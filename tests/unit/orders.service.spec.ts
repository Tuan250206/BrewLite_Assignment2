import { ConflictException, NotFoundException } from "@nestjs/common";
import { jest } from "@jest/globals";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../apps/api/src/prisma.service.js";
import { OrdersService } from "../../apps/api/src/orders/orders.service.js";

describe("OrdersService", () => {
  const product = {
    id: "product-1",
    name: "Latte",
    price: new Prisma.Decimal(59000),
    stock: 3,
  };
  const item = {
    productId: product.id,
    size: "L" as const,
    qty: 2,
    topping: ["Cream Cheese"],
  };
  const tx = {
    product: { findMany: jest.fn<() => Promise<(typeof product)[]>>() },
    order: {
      create: jest.fn<(args: Prisma.OrderCreateArgs) => Promise<unknown>>(),
      findFirst:
        jest.fn<() => Promise<{ id: string; status: OrderStatus } | null>>(),
      update: jest.fn<(args: Prisma.OrderUpdateArgs) => Promise<unknown>>(),
      findMany:
        jest.fn<(args: Prisma.OrderFindManyArgs) => Promise<unknown[]>>(),
    },
  };
  const prisma = {
    ...tx,
    $transaction:
      jest.fn<
        (
          callback: (client: typeof tx) => Promise<unknown>,
          options?: unknown,
        ) => Promise<unknown>
      >(),
  };
  const service = new OrdersService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(tx));
    tx.product.findMany.mockResolvedValue([product]);
    tx.order.findFirst.mockResolvedValue({
      id: "order-1",
      status: OrderStatus.PENDING,
    });
  });

  it("ORD-UNIT-01: calculates total from database prices and persists pending order/items atomically", async () => {
    tx.order.create.mockResolvedValue({ id: "order-1" });
    await expect(service.create("user-1", [item])).resolves.toEqual({
      id: "order-1",
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    const { data } = tx.order.create.mock.calls[0][0];
    expect(data).toMatchObject({ userId: "user-1", status: "PENDING" });
    expect(data.total).toEqual(new Prisma.Decimal(168000));
    expect(data.orderItems?.create).toEqual([
      expect.objectContaining({
        productId: product.id,
        qty: 2,
        size: "L",
        topping: "Cream Cheese",
        lineTotal: new Prisma.Decimal(168000),
      }),
    ]);
  });

  it("ORD-UNIT-02: rejects missing products without creating an order", async () => {
    tx.product.findMany.mockResolvedValue([]);
    await expect(service.create("user-1", [item])).rejects.toThrow(
      NotFoundException,
    );
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("ORD-UNIT-03: aggregates stock needed for multiple lines of the same product", async () => {
    await expect(
      service.create("user-1", [item, { ...item, size: "M" }]),
    ).rejects.toThrow(ConflictException);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("ORD-UNIT-04: filters history by owner and newest first", async () => {
    tx.order.findMany.mockResolvedValue([]);
    await expect(service.findMine("user-1")).resolves.toEqual([]);
    expect(tx.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("ORD-UNIT-05: hides missing orders and orders belonging to another user", async () => {
    tx.order.findFirst.mockResolvedValue(null);
    await expect(service.findOne("user-1", "order-1")).rejects.toThrow(
      NotFoundException,
    );
    expect(tx.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "order-1", userId: "user-1" } }),
    );
  });

  it.each([OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED])(
    "ORD-UNIT-06: cancels an unpaid %s order",
    async (status) => {
      tx.order.findFirst.mockResolvedValue({ id: "order-1", status });
      await service.cancel("user-1", "order-1");
      expect(tx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "order-1" },
          data: { status: OrderStatus.CANCELLED },
        }),
      );
    },
  );

  it.each([OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.CANCELLED])(
    "ORD-UNIT-07: rejects cancellation of %s without updating",
    async (status) => {
      tx.order.findFirst.mockResolvedValue({ id: "order-1", status });
      await expect(service.cancel("user-1", "order-1")).rejects.toThrow(
        ConflictException,
      );
      expect(tx.order.update).not.toHaveBeenCalled();
    },
  );

  it("ORD-UNIT-08: only a failed payment can be reset to pending", async () => {
    await expect(service.retryPayment("user-1", "order-1")).rejects.toThrow(
      ConflictException,
    );
    expect(tx.order.update).not.toHaveBeenCalled();
    tx.order.findFirst.mockResolvedValue({
      id: "order-1",
      status: OrderStatus.PAYMENT_FAILED,
    });
    await service.retryPayment("user-1", "order-1");
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: OrderStatus.PENDING } }),
    );
  });
});