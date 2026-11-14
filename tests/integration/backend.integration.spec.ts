import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { jest } from "@jest/globals";
import { Prisma } from "@prisma/client";
import request from "supertest";
import { AppModule } from "../../apps/api/src/app.module.js";
import { PrismaService } from "../../apps/api/src/prisma.service.js";

describe("Order/payment HTTP integration with PostgreSQL", () => {
  const savedDatabaseUrl = process.env.DATABASE_URL;
  const savedJwtSecret = process.env.JWT_SECRET;
  const schema = `test_${randomUUID().replaceAll("-", "")}`;
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let otherToken: string;
  let userId: string;
  let productId: string;

  function runNode(...args: string[]) {
    return execFileSync(
      process.execPath,
      args,
      {
        env: process.env,
        encoding: "utf8",
        timeout: 45000,
      },
    );
  }

  function runPrisma(...args: string[]) {
    return runNode(resolve("node_modules/prisma/build/index.js"), ...args);
  }

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error(
        "Set TEST_DATABASE_URL to a PostgreSQL database for integration tests.",
      );
    }
    const url = new URL(process.env.TEST_DATABASE_URL);
    url.searchParams.set("schema", schema);
    process.env.DATABASE_URL = url.toString();
    process.env.JWT_SECRET = "backend-integration-secret-at-least-32-bytes";
    prisma = new PrismaService({
      datasources: { db: { url: url.toString() } },
    });
    // Apply the committed migration to a fresh, isolated schema; never reset an existing DB.
    runPrisma("migrate", "deploy");
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany(); // Đơn hàng, mặt hàng và thanh toán sẽ theo thứ tự trong sơ đồ kiểm tra này.
    await prisma.product.deleteMany();
    const user = await prisma.user.create({
      data: { email: "customer@example.com", passwordHash: "unused-test-hash" },
    });
    const other = await prisma.user.create({
      data: { email: "other@example.com", passwordHash: "unused-test-hash" },
    });
    userId = user.id;
    const jwt = app.get(JwtService);
    token = await jwt.signAsync({ sub: user.id, email: user.email });
    otherToken = await jwt.signAsync({ sub: other.id, email: other.email });
    const product = await prisma.product.create({
      data: {
        name: "Test Latte",
        price: 59000,
        imageUrl: "/test.png",
        stock: 5,
      },
    });
    productId = product.id;
    // Định tuyến cuộc gọi HTTP của gateway qua Supertest, sử dụng controller/service thực tế của gateway 
    // mà không cần kết nối với cổng sản xuất 3001. Tất cả các thao tác Prisma đều sử dụng PostgreSQL.
    jest.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const result = await request(app.getHttpServer())
        .post("/mock-gateway/pay")
        .send(JSON.parse(init!.body as string));
      return new Response(JSON.stringify(result.body), {
        status: result.status,
      });
    });
  });

  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => {
    try {
      if (prisma)
        await prisma.$executeRawUnsafe(
          `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
        );
    } finally {
      if (app) await app.close();
      if (prisma) await prisma.$disconnect();
      if (savedDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = savedDatabaseUrl;
      if (savedJwtSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = savedJwtSecret;
    }
  });

  function createOrder(
    items = [{ productId, size: "L", topping: ["Cream Cheese"], qty: 2 }],
  ) {
    return request(app.getHttpServer())
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ items });
  }

  function pay(
    orderId: string,
    key: string = randomUUID(),
    simulateFail = false,
    bearer = token,
    method = "WALLET",
  ) {
    return request(app.getHttpServer())
      .post("/payments")
      .set("Authorization", `Bearer ${bearer}`)
      .set("Idempotency-Key", key)
      .send({ orderId, method, simulateFail });
  }

  it("DB-INT-01: migration re-applies safely and seed can recreate the same six products", async () => {
    const output = runPrisma("migrate", "deploy");
    expect(output).toContain("No pending migrations");
    await prisma.product.deleteMany();
    runNode("--loader", "ts-node/esm", resolve("prisma/seed.ts"));
    const query = {
      orderBy: { name: "asc" as const },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        stock: true,
      },
    };
    const first = await prisma.product.findMany(query);
    expect(first).toHaveLength(6);
    expect(
      first.every(
        (product) => product.stock === 20 && product.price.greaterThan(0),
      ),
    ).toBe(true);
    runNode("--loader", "ts-node/esm", resolve("prisma/seed.ts"));
    expect(await prisma.product.findMany(query)).toEqual(first);
    expect(await prisma.promotion.count()).toBe(0);
    expect(await prisma.loyaltyTransaction.count()).toBe(0);
  });

  it("DB-INT-02: database enforces unique email, foreign keys and payment idempotency keys", async () => {
    await expect(
      prisma.user.create({
        data: { email: "customer@example.com", passwordHash: "hash" },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    await expect(
      prisma.order.create({ data: { userId: randomUUID(), total: 1000 } }),
    ).rejects.toMatchObject({ code: "P2003" });
    const order = await createOrder().expect(201);
    await pay(order.body.id, "unique-key").expect(201);
    await expect(
      prisma.payment.create({
        data: {
          orderId: order.body.id,
          idempotencyKey: "unique-key",
          amount: 168000,
          method: "WALLET",
          status: "SUCCESS",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("ORD-INT-01: creates a pending order with persisted details and a server-calculated total", async () => {
    const response = await createOrder().expect(201);
    expect(response.body).toMatchObject({
      userId,
      status: "PENDING",
      total: "168000",
    });
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: response.body.id },
      include: { orderItems: true },
    });
    expect(order.total.toString()).toBe("168000");
    expect(order.orderItems).toEqual([
      expect.objectContaining({
        productId,
        size: "L",
        topping: "Cream Cheese",
        qty: 2,
        lineTotal: new Prisma.Decimal(168000),
      }),
    ]);
  });

  it.each([undefined, "Bearer invalid"])(
    "ORD-INT-02: rejects unauthenticated create/payment requests (%s)",
    async (header) => {
      for (const endpoint of ["/orders", "/payments"]) {
        const call = request(app.getHttpServer()).post(endpoint);
        if (header) call.set("Authorization", header);
        await call.send({}).expect(401);
      }
      expect(await prisma.order.count()).toBe(0);
      expect(await prisma.payment.count()).toBe(0);
    },
  );

  it.each([
    { items: [] },
    { items: [{ productId: "invalid", size: "M", qty: 1 }] },
    ...[0, -1, 1.5, 21].map((qty) => ({ items: [{ size: "M", qty }] })),
    { items: [{ size: "XL", qty: 1 }] },
    { items: [{ size: "M", qty: 1, topping: ["unknown"] }] },
    {
      items: [{ size: "M", qty: 1, topping: ["Cream Cheese", "Cream Cheese"] }],
    },
    { items: [{ size: "M", qty: 1 }], total: 1 },
  ])(
    "ORD-INT-03: rejects invalid cart without persisting an order: %j",
    async (body) => {
      const items = body.items.map((item) => ({ productId, ...item }));
      await request(app.getHttpServer())
        .post("/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...body, items })
        .expect(400);
      expect(await prisma.order.count()).toBe(0);
      expect(await prisma.orderItem.count()).toBe(0);
    },
  );

  it("ORD-INT-04: rejects a missing product or insufficient combined stock without partial writes", async () => {
    await createOrder([
      { productId: randomUUID(), size: "M", topping: [], qty: 1 },
    ]).expect(404);
    await createOrder([
      { productId, size: "M", topping: [], qty: 3 },
      { productId, size: "L", topping: [], qty: 3 },
    ]).expect(409);
    expect(await prisma.order.count()).toBe(0);
    expect(await prisma.orderItem.count()).toBe(0);
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
        .stock,
    ).toBe(5);
  });

  it("ORD-INT-05: another customer cannot view, cancel or pay the order", async () => {
    const { body: order } = await createOrder().expect(201);
    await request(app.getHttpServer())
      .get(`/orders/${order.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/orders/${order.id}/cancel`)
      .set("Authorization", `Bearer ${otherToken}`)
      .expect(404);
    await pay(order.id, "other-user-key", false, otherToken).expect(404);
    const history = await request(app.getHttpServer())
      .get("/orders/me")
      .set("Authorization", `Bearer ${otherToken}`)
      .expect(200);
    expect(history.body).toEqual([]);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .status,
    ).toBe("PENDING");
    expect(await prisma.payment.count()).toBe(0);
  });

  it.each(["WALLET", "CARD"])(
    "PAY-INT-01: %s payment persists success and decrements stock once on replay",
    async (method) => {
      const { body: order } = await createOrder().expect(201);
      const first = await pay(
        order.id,
        "replay-key",
        false,
        token,
        method,
      ).expect(201);
      const replay = await pay(
        order.id,
        "replay-key",
        false,
        token,
        method,
      ).expect(201);
      expect(first.body).toMatchObject({
        success: true,
        status: "SUCCESS",
        amount: "168000",
        method,
      });
      expect(replay.body).toEqual(first.body);
      expect(await prisma.payment.count()).toBe(1);
      expect(
        (await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
          .stock,
      ).toBe(3);
      const status = await request(app.getHttpServer())
        .get(`/payments/orders/${order.id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(status.body).toMatchObject({
        orderStatus: "PAID",
        paymentStatus: "SUCCESS",
        paymentId: first.body.paymentId,
      });
      await pay(order.id, "new-key-on-paid-order").expect(409);
    },
  );

  it("PAY-INT-02: failed payment keeps stock unchanged, replays failure, then permits retry", async () => {
    const { body: order } = await createOrder().expect(201);
    const failed = await pay(order.id, "failed-key", true).expect(201);
    expect(failed.body).toMatchObject({ success: false, status: "FAILED" });
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .status,
    ).toBe("PAYMENT_FAILED");
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
        .stock,
    ).toBe(5);
    const replay = await pay(order.id, "failed-key").expect(201);
    expect(replay.body).toEqual(failed.body);
    await pay(order.id, "retry-key").expect(201);
    expect(await prisma.payment.count()).toBe(2);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .status,
    ).toBe("PAID");
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
        .stock,
    ).toBe(3);
  });

  it("PAY-INT-03: rejects missing keys, invalid methods, missing/cancelled orders and key reuse", async () => {
    const { body: order } = await createOrder().expect(201);
    await request(app.getHttpServer())
      .post("/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ orderId: order.id, method: "WALLET" })
      .expect(400);
    await pay(order.id, "bad-method", false, token, "CASH").expect(400);
    await pay(randomUUID(), "missing-order").expect(404);
    await pay(order.id, "shared-key").expect(201);
    const { body: second } = await createOrder().expect(201);
    await pay(second.id, "shared-key").expect(409);
    await pay(order.id, "shared-key", false, otherToken).expect(409);
    await request(app.getHttpServer())
      .patch(`/orders/${second.id}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    await pay(second.id, "cancelled-order").expect(409);
    expect(await prisma.payment.count()).toBe(1);
  });

  it("PAY-INT-04: rolls back all stock decrements if a later product is out of stock", async () => {
    const second = await prisma.product.create({
      data: { name: "Second", price: 10000, imageUrl: "/test.png", stock: 1 },
    });
    const { body: order } = await createOrder([
      { productId, size: "M", topping: [], qty: 1 },
      { productId: second.id, size: "M", topping: [], qty: 1 },
    ]).expect(201);
    await prisma.product.update({
      where: { id: second.id },
      data: { stock: 0 },
    });
    await pay(order.id).expect(409);
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
        .stock,
    ).toBe(5);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .status,
    ).toBe("PENDING");
    expect(await prisma.payment.count()).toBe(0);
  });

  it("PAY-INT-05: concurrent payments cannot sell more than the remaining stock", async () => {
    await prisma.product.update({
      where: { id: productId },
      data: { stock: 2 },
    });
    const first = await createOrder().expect(201);
    const second = await createOrder().expect(201);
    const results = await Promise.all([
      pay(first.body.id),
      pay(second.body.id),
    ]);
    expect(
      results.map((result) => result.status).sort((a, b) => a - b),
    ).toEqual([201, 409]);
    expect(results.filter((result) => result.status === 201)).toHaveLength(1);
    expect(await prisma.payment.count({ where: { status: "SUCCESS" } })).toBe(
      1,
    );
    expect(await prisma.order.count({ where: { status: "PAID" } })).toBe(1);
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: productId } }))
        .stock,
    ).toBe(0);
    const pending = await prisma.order.findFirstOrThrow({
      where: { status: "PENDING" },
    });
    await pay(pending.id).expect(409);
  });
});