import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { jest } from "@jest/globals";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../apps/api/src/prisma.service.js";
import { PaymentsService } from "../../apps/api/src/payments/payments.service.js";

describe("PaymentsService", () => {
  const order = {
    id: "order-1",
    userId: "user-1",
    status: OrderStatus.PENDING as OrderStatus,
    total: new Prisma.Decimal(118000),
    orderItems: [
      { productId: "product-1", qty: 1 },
      { productId: "product-1", qty: 1 },
    ],
  };
  const payment = {
    id: "payment-1",
    orderId: order.id,
    idempotencyKey: "key-1",
    amount: order.total,
    method: PaymentMethod.WALLET,
    status: PaymentStatus.SUCCESS as PaymentStatus,
    order,
  };
  const tx = {
    order: {
      findFirst: jest.fn<() => Promise<typeof order | null>>(),
      update: jest.fn<(args: Prisma.OrderUpdateArgs) => Promise<unknown>>(),
    },
    product: {
      updateMany:
        jest.fn<
          (args: Prisma.ProductUpdateManyArgs) => Promise<{ count: number }>
        >(),
    },
    payment: {
      create:
        jest.fn<(args: Prisma.PaymentCreateArgs) => Promise<typeof payment>>(),
    },
  };
  const prisma = {
    payment: { findUnique: jest.fn<() => Promise<typeof payment | null>>() },
    $transaction:
      jest.fn<
        (
          callback: (client: typeof tx) => Promise<unknown>,
          options?: unknown,
        ) => Promise<unknown>
      >(),
  };
  const service = new PaymentsService(prisma as unknown as PrismaService);
  const dto = { orderId: order.id, method: "WALLET" as const };
  const mockGateway = () => jest.spyOn(globalThis, "fetch");
  let gateway: ReturnType<typeof mockGateway>;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation((callback) => callback(tx));
    tx.order.findFirst.mockResolvedValue(order);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.payment.create.mockResolvedValue(payment);
    gateway = mockGateway().mockResolvedValue(
      new Response(JSON.stringify({ status: "SUCCESS" })),
    );
  });
  afterEach(() => jest.restoreAllMocks());

  it.each(["", "   ", "x".repeat(256)])(
    "PAY-UNIT-01: rejects invalid idempotency keys before querying DB",
    async (key) => {
      await expect(service.create(order.userId, key, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
      expect(gateway).not.toHaveBeenCalled();
    },
  );

  it("PAY-UNIT-02: replays an existing result without calling gateway or decrementing stock", async () => {
    prisma.payment.findUnique.mockResolvedValue(payment);
    const result = await service.create(order.userId, " key-1 ", dto);
    expect(result).toMatchObject({
      success: true,
      paymentId: payment.id,
      amount: "118000",
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(gateway).not.toHaveBeenCalled();
  });

  it.each([
    { userId: "another-user", orderId: order.id },
    { userId: order.userId, orderId: "another-order" },
  ])(
    "PAY-UNIT-03: rejects a key already used by a different owner/order",
    async ({ userId, orderId }) => {
      prisma.payment.findUnique.mockResolvedValue(payment);
      await expect(
        service.create(userId, "key-1", { ...dto, orderId }),
      ).rejects.toThrow(ConflictException);
      expect(gateway).not.toHaveBeenCalled();
    },
  );

  it("PAY-UNIT-04: rejects a missing or inaccessible order before calling gateway", async () => {
    tx.order.findFirst.mockResolvedValue(null);
    await expect(service.create(order.userId, "key-1", dto)).rejects.toThrow(
      NotFoundException,
    );
    expect(gateway).not.toHaveBeenCalled();
  });

  it.each([OrderStatus.PAID, OrderStatus.CANCELLED, OrderStatus.COMPLETED])(
    "PAY-UNIT-05: rejects payment of a %s order",
    async (status) => {
      tx.order.findFirst.mockResolvedValue({ ...order, status });
      await expect(service.create(order.userId, "key-1", dto)).rejects.toThrow(
        ConflictException,
      );
      expect(gateway).not.toHaveBeenCalled();
    },
  );

  it("PAY-UNIT-06: uses the server total and decrements aggregated stock on success", async () => {
    await expect(
      service.create(order.userId, "key-1", dto),
    ).resolves.toMatchObject({ success: true, status: "SUCCESS" });
    const body = JSON.parse(gateway.mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({
      amount: 118000,
      orderId: order.id,
      idempotencyKey: "key-1",
    });
    expect(tx.product.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: "product-1", stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: order.id },
      data: { status: OrderStatus.PAID },
    });
  });

  it("PAY-UNIT-07: records failed payments without changing stock", async () => {
    gateway.mockResolvedValue(
      new Response(JSON.stringify({ status: "FAILED" })),
    );
    tx.payment.create.mockResolvedValue({
      ...payment,
      status: PaymentStatus.FAILED,
    });
    await expect(
      service.create(order.userId, "key-1", dto),
    ).resolves.toMatchObject({ success: false, status: "FAILED" });
    expect(tx.product.updateMany).not.toHaveBeenCalled();
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: order.id },
      data: { status: OrderStatus.PAYMENT_FAILED },
    });
  });

  it("PAY-UNIT-08: rejects insufficient stock without persisting a successful payment", async () => {
    tx.product.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.create(order.userId, "key-1", dto)).rejects.toThrow(
      ConflictException,
    );
    expect(tx.payment.create).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
  });

  it.each(["network", "http"])(
    "PAY-UNIT-09: reports gateway %s failure without persisting changes",
    async (failure) => {
      if (failure === "network")
        gateway.mockRejectedValue(new Error("offline"));
      else gateway.mockResolvedValue(new Response("", { status: 503 }));
      await expect(service.create(order.userId, "key-1", dto)).rejects.toThrow(
        BadGatewayException,
      );
      expect(tx.payment.create).not.toHaveBeenCalled();
      expect(tx.product.updateMany).not.toHaveBeenCalled();
      expect(tx.order.update).not.toHaveBeenCalled();
    },
  );

  it("PAY-UNIT-10: returns the existing payment after a unique-key race", async () => {
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate key", {
        code: "P2002",
        clientVersion: "6.19.0",
      }),
    );
    prisma.payment.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(payment);
    await expect(
      service.create(order.userId, "key-1", dto),
    ).resolves.toMatchObject({ paymentId: payment.id });
  });
});