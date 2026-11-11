import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type OrderSize = 'S' | 'M' | 'L';

const SIZE_PRICE_ADJUSTMENTS: Record<OrderSize, number> = {
  S: -5000,
  M: 0,
  L: 10000,
};

const TOPPING_PRICE_ADJUSTMENTS: Record<string, number> = {
  'Trân châu đen': 10000,
  'Thạch trái cây': 8000,
  'Cream Cheese': 15000,
  'Pudding trứng': 10000,
};

export function calculateOrderItemLineTotal(
  basePrice: Prisma.Decimal,
  size: OrderSize,
  toppings: string[] | undefined,
  quantity: number,
): Prisma.Decimal {
  let unitPrice = basePrice.add(SIZE_PRICE_ADJUSTMENTS[size]);
  const selectedToppings = new Set<string>();

  for (const topping of toppings ?? []) {
    if (!Object.hasOwn(TOPPING_PRICE_ADJUSTMENTS, topping)) {
      throw new BadRequestException(`Topping không hợp lệ: ${topping}`);
    }
    if (selectedToppings.has(topping)) {
      throw new BadRequestException(`Topping bị chọn trùng: ${topping}`);
    }

    selectedToppings.add(topping);
    unitPrice = unitPrice.add(TOPPING_PRICE_ADJUSTMENTS[topping]);
  }

  if (unitPrice.lessThan(0)) {
    throw new BadRequestException('Giá sản phẩm sau điều chỉnh không hợp lệ');
  }

  return unitPrice.mul(quantity);
}
