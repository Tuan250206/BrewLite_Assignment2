import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { jest } from '@jest/globals';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma.service';

describe('Auth HTTP integration (mocked Prisma)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const savedSecret = process.env.JWT_SECRET;
  const secret = 'auth-http-test-secret-at-least-32-bytes';
  const publicUser = {
    id: '08f637c9-6d1a-4610-9662-8f41a651fb26',
    email: 'customer@example.com',
    role: UserRole.CUSTOMER,
    loyaltyPoints: 0,
  };
  let user: User;
  const prisma = {
    user: {
      findUnique:
        jest.fn<
          (args: Prisma.UserFindUniqueArgs) => Promise<Partial<User> | null>
        >(),
      create:
        jest.fn<(args: Prisma.UserCreateArgs) => Promise<typeof publicUser>>(),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = secret;
    user = {
      ...publicUser,
      passwordHash: await bcrypt.hash('password123', 4),
      createdAt: new Date(),
    };
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
    jwt = module.get(JwtService);
  });

  afterAll(async () => {
    await app?.close();
    if (savedSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = savedSecret;
  });
  beforeEach(() => jest.resetAllMocks());

  it('AUTH-HTTP-01: registration returns a safe user and a one-day CUSTOMER JWT', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(publicUser);
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: ' Customer@Example.com ', password: 'password123' })
      .expect(201);
    expect(response.body.user).toEqual(publicUser);
    expect(response.body.user).not.toHaveProperty('passwordHash');
    const payload = await jwt.verifyAsync(response.body.accessToken, {
      secret,
    });
    expect(payload).toMatchObject({
      sub: publicUser.id,
      email: publicUser.email,
      role: 'CUSTOMER',
    });
    expect(payload.exp - payload.iat).toBe(86400);
    const data = prisma.user.create.mock.calls[0][0].data;
    expect(data.role).toBe('CUSTOMER');
    expect(await bcrypt.compare('password123', data.passwordHash)).toBe(true);
  });

  it.each([
    {},
    { email: 'invalid', password: 'password123' },
    { email: publicUser.email, password: 'short' },
    { email: publicUser.email, password: 'a'.repeat(73) },
    { email: publicUser.email, password: '☕'.repeat(25) },
    { email: publicUser.email, password: '☕'.repeat(7) },
    { email: publicUser.email, password: 12345678 },
    { email: null, password: null },
    { email: publicUser.email, password: 'password123', role: 'STAFF' },
  ])('AUTH-HTTP-02: rejects invalid registration %j', async (body) => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(body)
      .expect(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it.each(['a'.repeat(72), '☕'.repeat(24)])(
    'AUTH-HTTP-03: accepts exactly 72 UTF-8 bytes',
    async (password) => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(publicUser);
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: publicUser.email, password })
        .expect(201);
    },
  );

  it('AUTH-HTTP-04: returns 409 for an existing normalized email', async () => {
    prisma.user.findUnique.mockResolvedValue(user);
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: ' CUSTOMER@EXAMPLE.COM ', password: 'password123' })
      .expect(409);
  });

  it.each([UserRole.CUSTOMER, UserRole.STAFF])(
    'AUTH-HTTP-05: login issues a %s token usable on a protected endpoint',
    async (role) => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ ...user, role })
        .mockResolvedValueOnce(publicUser);
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password123' })
        .expect(200);
      expect(login.body.user).not.toHaveProperty('passwordHash');
      expect(
        (await jwt.verifyAsync(login.body.accessToken, { secret })).role,
      ).toBe(role);
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .expect(200, publicUser);
      expect(prisma.user.findUnique).toHaveBeenLastCalledWith({
        where: { id: publicUser.id },
        select: { id: true, email: true, role: true, loyaltyPoints: true },
      });
    },
  );

  it('AUTH-HTTP-06: unknown email and incorrect password receive the same 401', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(user);
    const unknown = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'unknown@example.com', password: 'password123' })
      .expect(401);
    const wrong = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'wrongpassword' })
      .expect(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(wrong.body).not.toHaveProperty('accessToken');
  });

  it.each([
    {},
    { email: publicUser.email, password: '' },
    { email: publicUser.email, password: 'x'.repeat(73) },
  ])('AUTH-HTTP-07: rejects invalid login %j', async (body) => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(body)
      .expect(400);
  });

  it.each([undefined, 'Bearer invalid', 'Basic abc'])(
    'AUTH-HTTP-08: rejects missing or malformed token %s',
    async (header) => {
      const call = request(app.getHttpServer()).get('/auth/me');
      if (header) call.set('Authorization', header);
      await call.expect(401);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    },
  );

  it.each([
    { expiresIn: -1 },
    { secret: 'incorrect-secret' },
    { algorithm: 'HS384' as const },
  ])('AUTH-HTTP-09: rejects invalid JWT %j', async (options) => {
    const token = await jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      options,
    );
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    { email: publicUser.email, role: 'CUSTOMER' },
    { sub: publicUser.id, email: publicUser.email, role: 'ADMIN' },
    { sub: 123, email: publicUser.email, role: 'CUSTOMER' },
  ])('AUTH-HTTP-10: rejects malformed claims %j', async (claims) => {
    const token = await jwt.signAsync(claims);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('AUTH-HTTP-11: rejects a token without expiration', async () => {
    const token = await new JwtService({ secret }).signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('AUTH-HTTP-12: rejects a token for a deleted account', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const token = await jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });
});