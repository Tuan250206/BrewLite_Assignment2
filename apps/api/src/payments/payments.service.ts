import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma.service.js';
import { assertTransition } from '../orders/order-state.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';

const GATEWAY_URL = `http://localhost:${process.env.PORT ?? 3001}/mock-gateway/pay`;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async callMockGateway(dto: CreatePaymentDto, amount: number, idempotencyKey: string): Promise<PaymentStatus> {
    try {
      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: dto.orderId,
          amount,
          method: dto.method,
          idempotencyKey,
          simulateFail: dto.simulateFail,
        }),
      });

      if (!response.ok) {
        throw new BadGatewayException(
          `Mock gateway trả về lỗi ${response.status}`,
        );
      }

      const data = (await response.json()) as { status: PaymentStatus };
      return data.status;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new BadGatewayException(
        'Không thể kết nối đến mock payment gateway',
      );
    }
  }

  async create(
    userId: string,
    idempotencyKey: string,
    dto: CreatePaymentDto,
  ) {
    const normalizedKey = idempotencyKey.trim();

    if (!normalizedKey) {
      throw new BadRequestException(
        'Thiếu header Idempotency-Key',
      );
    }

    if (normalizedKey.length > 255) {
      throw new BadRequestException(
        'Idempotency-Key không được vượt quá 255 ký tự',
      );
    }

    const existingPayment =
      await this.prisma.payment.findUnique({
        where: {
          idempotencyKey: normalizedKey,
        },
        include: {
          order: true,
        },
      });

    if (existingPayment) {
      if (
        existingPayment.orderId !== dto.orderId ||
        existingPayment.order.userId !== userId
      ) {
        throw new ConflictException(
          'Idempotency-Key đã được dùng cho giao dịch khác',
        );
      }

      return this.serializePayment(existingPayment);
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const order = await tx.order.findFirst({
            where: {
              id: dto.orderId,
              userId,
            },
            include: {
              orderItems: true,
            },
          });

          if (!order) {
            throw new NotFoundException(
              'Không tìm thấy đơn hàng',
            );
          }

          if (
            order.status !== OrderStatus.PENDING &&
            order.status !== OrderStatus.PAYMENT_FAILED
          ) {
            throw new ConflictException(
              `Không thể thanh toán đơn ở trạng thái ${order.status}`,
            );
          }

          if (order.status === OrderStatus.PAYMENT_FAILED) {
            assertTransition(
              order.status,
              OrderStatus.PENDING,
            );
          }

          const paymentStatus = await this.callMockGateway(
            dto,
            order.total.toNumber(),
            normalizedKey,
          );

          const targetOrderStatus =
            paymentStatus === PaymentStatus.SUCCESS
              ? OrderStatus.PAID
              : OrderStatus.PAYMENT_FAILED;

          assertTransition(
            OrderStatus.PENDING,
            targetOrderStatus,
          );

          if (paymentStatus === PaymentStatus.SUCCESS) {
            const quantityByProductId = new Map<string, number>();

            for (const item of order.orderItems) {
              quantityByProductId.set(
                item.productId,
                (quantityByProductId.get(item.productId) ?? 0) +
                  item.qty,
              );
            }

            for (const [
              productId,
              requestedQty,
            ] of quantityByProductId) {
              const result = await tx.product.updateMany({
                where: {
                  id: productId,
                  stock: {
                    gte: requestedQty,
                  },
                },
                data: {
                  stock: {
                    decrement: requestedQty,
                  },
                },
              });

              if (result.count !== 1) {
                throw new ConflictException(
                  'Sản phẩm không đủ tồn kho để hoàn tất thanh toán',
                );
              }
            }
          }

          const payment = await tx.payment.create({
            data: {
              orderId: order.id,
              idempotencyKey: normalizedKey,
              amount: order.total,
              method:
                dto.method === 'WALLET'
                  ? PaymentMethod.WALLET
                  : PaymentMethod.CARD,
              status: paymentStatus,
            },
            include: {
              order: true,
            },
          });

          await tx.order.update({
            where: {
              id: order.id,
            },
            data: {
              status: targetOrderStatus,
            },
          });

          return this.serializePayment(payment);
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const duplicatedPayment =
          await this.prisma.payment.findUnique({
            where: {
              idempotencyKey: normalizedKey,
            },
            include: {
              order: true,
            },
          });

        if (!duplicatedPayment) {
          throw error;
        }

        if (
          duplicatedPayment.orderId !== dto.orderId ||
          duplicatedPayment.order.userId !== userId
        ) {
          throw new ConflictException(
            'Idempotency-Key đã được dùng cho giao dịch khác',
          );
        }

        return this.serializePayment(duplicatedPayment);
      }

      throw error;
    }
  }

  async getOrderPaymentStatus(
    userId: string,
    orderId: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Không tìm thấy đơn hàng',
      );
    }

    const latestPayment = order.payments[0] ?? null;

    return {
      orderId: order.id,
      orderStatus: order.status,
      paymentStatus: latestPayment?.status ?? null,
      paymentId: latestPayment?.id ?? null,
      amount: latestPayment?.amount.toString() ?? null,
      method: latestPayment?.method ?? null,
    };
  }

  private serializePayment(payment: {
    id: string;
    orderId: string;
    amount: Prisma.Decimal;
    method: PaymentMethod;
    status: PaymentStatus;
  }) {
    return {
      success: payment.status === PaymentStatus.SUCCESS,
      orderId: payment.orderId,
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount.toString(),
      method: payment.method,
    };
  }
}