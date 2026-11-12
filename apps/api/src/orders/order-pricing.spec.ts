import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it } from '@jest/globals';
import { calculateOrderItemLineTotal } from './order-pricing.js';

describe('calculateOrderItemLineTotal', () => {
  it('cộng phụ phí size L và nhiều topping vào giá gốc', () => {
    const total = calculateOrderItemLineTotal(
      new Prisma.Decimal(69000),
      'L',
      ['Pudding trứng', 'Thạch trái cây'],
      1,
    );

    expect(total.toNumber()).toBe(97000);
  });

  it('áp dụng size S và nhân giá theo số lượng', () => {
    const total = calculateOrderItemLineTotal(
      new Prisma.Decimal(59000),
      'S',
      ['Cream Cheese'],
      2,
    );

    expect(total.toNumber()).toBe(138000);
  });

  it('giữ nguyên giá gốc với size M và không có topping', () => {
    const total = calculateOrderItemLineTotal(
      new Prisma.Decimal(65000),
      'M',
      undefined,
      2,
    );

    expect(total.toNumber()).toBe(130000);
  });

  it('từ chối topping không nằm trong danh sách hợp lệ', () => {
    expect(() =>
      calculateOrderItemLineTotal(
        new Prisma.Decimal(59000),
        'M',
        ['Topping tự chọn'],
        1,
      ),
    ).toThrow(BadRequestException);
  });

  it('từ chối topping bị lặp', () => {
    expect(() =>
      calculateOrderItemLineTotal(
        new Prisma.Decimal(59000),
        'M',
        ['Trân châu đen', 'Trân châu đen'],
        1,
      ),
    ).toThrow(BadRequestException);
  });
});
