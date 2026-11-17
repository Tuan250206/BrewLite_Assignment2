import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../apps/api/src/app.module.js";
import { PrismaService } from "../../apps/api/src/prisma.service.js";

describe("NFR-01: GET /products", () => {
  const savedDatabaseUrl = process.env.DATABASE_URL;
  const schema = `perf_${randomUUID().replaceAll("-", "")}`;
  const REQUESTS = 100;
  const THRESHOLD_MS = 500;

  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error("Set TEST_DATABASE_URL to a PostgreSQL database.");
    }
    const url = new URL(process.env.TEST_DATABASE_URL);
    url.searchParams.set("schema", schema);
    process.env.DATABASE_URL = url.toString();
    process.env.JWT_SECRET = "nfr-performance-secret-at-least-32-bytes";

    prisma = new PrismaService({ datasources: { db: { url: url.toString() } } });
    execFileSync(
      process.execPath,
      [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"],
      { env: process.env, encoding: "utf8", timeout: 45000 },
    );

    // Dữ liệu mẫu: 6 sản phẩm (giống bộ seed)
    await prisma.product.createMany({
      data: [
        { name: "Brew Latte", price: 45000, imageUrl: "/images/brew-latte.png", stock: 20 },
        { name: "Berry Fizz", price: 40000, imageUrl: "/images/berry-fizz.png", stock: 20 },
        { name: "Caramel Cold Brew", price: 50000, imageUrl: "/images/caramel-cold-brew.png", stock: 20 },
        { name: "Citrus Bloom", price: 42000, imageUrl: "/images/citrus-bloom.png", stock: 20 },
        { name: "Mocha Freeze", price: 48000, imageUrl: "/images/mocha-freeze.png", stock: 20 },
        { name: "Vanilla Matcha", price: 46000, imageUrl: "/images/vanilla-matcha.png", stock: 20 },
      ],
    });

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      }
    } finally {
      if (app) await app.close();
      if (prisma) await prisma.$disconnect();
      if (savedDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = savedDatabaseUrl;
    }
  });

  it("p95 < 500ms và >=95% yêu cầu dưới 500ms", async () => {
    const durations: number[] = [];
    for (let i = 0; i < REQUESTS; i++) {
      const start = performance.now();
      const res = await request(app.getHttpServer()).get("/products");
      durations.push(performance.now() - start);
      expect(res.status).toBe(200);
    }

    durations.sort((a, b) => a - b);
    const percentile = (q: number) =>
      durations[Math.min(REQUESTS - 1, Math.ceil(q * REQUESTS) - 1)];
    const p50 = percentile(0.5);
    const p95 = percentile(0.95);
    const under = durations.filter((d) => d < THRESHOLD_MS).length;

    console.log(
      `NFR-01: ${REQUESTS} requests | p50=${p50.toFixed(1)}ms p95=${p95.toFixed(
        1,
      )}ms | <${THRESHOLD_MS}ms: ${under}/${REQUESTS} (${(
        (under / REQUESTS) * 100
      ).toFixed(0)}%)`,
    );

    expect(p95).toBeLessThan(THRESHOLD_MS);
    expect(under / REQUESTS).toBeGreaterThanOrEqual(0.95);
  });
});