import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],

  PAYMENT_FAILED: [
    OrderStatus.PENDING,
    OrderStatus.CANCELLED,
  ],

  PAID: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],

  PREPARING: [
    OrderStatus.READY,
  ],

  READY: [
    OrderStatus.COMPLETED,
  ],

  COMPLETED: [],

  CANCELLED: [],
};

export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
): void {
  if (!allowedTransitions[from].includes(to)) {
    throw new ConflictException(
      `Không thể chuyển đơn từ ${from} sang ${to}`,
    );
  }
}