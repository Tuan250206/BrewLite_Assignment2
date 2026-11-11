import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { PrismaService } from '../prisma.service.js';
import { HealthService } from './health.service.js';
import { jest } from '@jest/globals';

describe('HealthService', () => {
  let healthService: HealthService;

  const mockPrismaService = {
    $queryRaw: jest.fn<() => Promise<unknown>>(),
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          HealthService,
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
        ],
      }).compile();

    healthService = module.get<HealthService>(HealthService);

    jest.clearAllMocks();
  });

  it('trả status ok khi database phản hồi', async () => {
    mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await healthService.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });

  it('trả 503 khi database không phản hồi', async () => {
    mockPrismaService.$queryRaw.mockRejectedValue(
      new Error('Database connection failed'),
    );

    await expect(
      healthService.check(),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});