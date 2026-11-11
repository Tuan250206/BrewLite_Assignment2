import * as crypto from 'node:crypto';
import {
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

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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
          });

          if (!order) {
            throw new NotFoundException(
              'Không tìm thấy đơn hàng',
            );
          }

          if (order.status !== OrderStatus.PENDING) {
            throw new ConflictException(
              `Không thể thanh toán đơn ở trạng thái ${order.status}`,
            );
          }

          const paymentStatus = dto.simulateFail
            ? PaymentStatus.PAYMENT_FAILED
            : PaymentStatus.PAID;

          const targetOrderStatus = dto.simulateFail
            ? OrderStatus.PAYMENT_FAILED
            : OrderStatus.PAID;

          assertTransition(
            order.status,
            targetOrderStatus,
          );

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
              providerTransactionId:
                `mock_${crypto.randomUUID()}`,
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
      providerTransactionId:
        latestPayment?.providerTransactionId ?? null,
    };
  }

  private serializePayment(payment: {
    id: string;
    orderId: string;
    amount: Prisma.Decimal;
    method: PaymentMethod;
    status: PaymentStatus;
    providerTransactionId: string | null;
  }) {
    return {
      success: payment.status === PaymentStatus.PAID,
      orderId: payment.orderId,
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount.toString(),
      method: payment.method,
      providerTransactionId:
        payment.providerTransactionId,
    };
  }
}