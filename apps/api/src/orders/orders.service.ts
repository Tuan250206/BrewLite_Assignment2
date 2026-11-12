import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma.service.js';
import { CreateOrderItemDto } from './dto/create-order.dto.js';
import { assertTransition } from './order-state.js';

const orderDetailInclude = {
  orderItems: {
    include: {
      product: true,
    },
  },
  payments: {
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, items: CreateOrderItemDto[]) {
    return this.prisma.$transaction(
      async (tx) => {
        const quantityByProductId = new Map<string, number>();

        for (const item of items) {
          const currentQty =
            quantityByProductId.get(item.productId) ?? 0;

          quantityByProductId.set(
            item.productId,
            currentQty + item.qty,
          );
        }

        const productIds = [...quantityByProductId.keys()];

        const products = await tx.product.findMany({
          where: {
            id: {
              in: productIds,
            },
          },
        });

        if (products.length !== productIds.length) {
          throw new NotFoundException(
            'Có sản phẩm không tồn tại hoặc đã bị xóa',
          );
        }

        for (const product of products) {
          const requestedQty = quantityByProductId.get(product.id)!;

          if (product.stock < requestedQty) {
            throw new ConflictException(
              `Sản phẩm ${product.name} không đủ tồn kho`,
            );
          }
        }

        const priceByProductId = new Map(
          products.map((product) => [
            product.id,
            product.price,
          ]),
        );

        const orderItems = items.map((item) => {
          const unitPrice = priceByProductId.get(item.productId)!;

          return {
            productId: item.productId,
            size: item.size,
            topping:
              item.topping && item.topping.length > 0
                ? item.topping.join(', ')
                : '',
            qty: item.qty,
            lineTotal: unitPrice.mul(item.qty),
          };
        });

        const total = orderItems.reduce(
          (sum, item) => sum.add(item.lineTotal),
          new Prisma.Decimal(0),
        );

        return tx.order.create({
          data: {
            userId,
            status: OrderStatus.PENDING,
            total,
            orderItems: {
              create: orderItems,
            },
          },
          include: orderDetailInclude,
        });
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async findMine(userId: string) {
    return this.prisma.order.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: orderDetailInclude,
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return order;
  }

  async retryPayment(userId: string, orderId: string) {
    const order = await this.findOne(userId, orderId);

    assertTransition(
      order.status,
      OrderStatus.PENDING,
    );

    return this.prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: OrderStatus.PENDING,
      },
      include: orderDetailInclude,
    });
  }

  async cancel(userId: string, orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          userId,
        },
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      assertTransition(
        order.status,
        OrderStatus.CANCELLED,
      );

      return tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: OrderStatus.CANCELLED,
        },
        include: orderDetailInclude,
      });
    });
  }
}