
import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { assertTransition } from './order-state.js';

describe('assertTransition', () => {
  it('cho phép PENDING sang PAID', () => {
    expect(() => {
      assertTransition(
        OrderStatus.PENDING,
        OrderStatus.PAID,
      );
    }).not.toThrow();
  });

  it('cho phép PENDING sang PAYMENT_FAILED', () => {
    expect(() => {
      assertTransition(
        OrderStatus.PENDING,
        OrderStatus.PAYMENT_FAILED,
      );
    }).not.toThrow();
  });

  it('cho phép PAYMENT_FAILED sang PENDING để thanh toán lại', () => {
    expect(() => {
      assertTransition(
        OrderStatus.PAYMENT_FAILED,
        OrderStatus.PENDING,
      );
    }).not.toThrow();
  });

  it('cho phép PAYMENT_FAILED sang CANCELLED', () => {
    expect(() => {
      assertTransition(
        OrderStatus.PAYMENT_FAILED,
        OrderStatus.CANCELLED,
      );
    }).not.toThrow();
  });

  it('chặn PAID sang PENDING', () => {
    expect(() => {
      assertTransition(
        OrderStatus.PAID,
        OrderStatus.PENDING,
      );
    }).toThrow(ConflictException);
  });

  it('chặn CANCELLED sang PENDING', () => {
    expect(() => {
      assertTransition(
        OrderStatus.CANCELLED,
        OrderStatus.PENDING,
      );
    }).toThrow(ConflictException);
  });

  it('chặn COMPLETED sang PAID', () => {
    expect(() => {
      assertTransition(
        OrderStatus.COMPLETED,
        OrderStatus.PAID,
      );
    }).toThrow(ConflictException);
  });
});