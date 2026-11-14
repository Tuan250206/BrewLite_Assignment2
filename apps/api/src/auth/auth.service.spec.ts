import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { jest } from '@jest/globals';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: typeof mockPrismaService;

  // Giả lập dữ liệu trả về từ DB
  const mockUser = {
    id: 'user-uuid-123',
    email: 'customer@example.com',
    passwordHash: '$2b$10$hashedpasswordstring',
    loyaltyPoints: 0,
    createdAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique:
        jest.fn<
          (args: Prisma.UserFindUniqueArgs) => Promise<Partial<User> | null>
        >(),
      create:
        jest.fn<
          (
            args: Prisma.UserCreateArgs,
          ) => Promise<Pick<User, 'id' | 'email' | 'loyaltyPoints'>>
        >(),
    },
  };

  const mockJwtService = {
    signAsync: jest
      .fn<(payload: object) => Promise<string>>()
      .mockResolvedValue('mock-jwt-token'),
  };

  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash('password123', 4);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = mockPrismaService;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('Đăng ký tài khoản mới thành công (mật khẩu đã băm)', async () => {
      // Mock: không tìm thấy user trùng email
      prismaService.user.findUnique.mockResolvedValue(null);

      prismaService.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'newuser@example.com',
        loyaltyPoints: 0,
      });

      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'newuser@example.com' },
      });
      expect(prismaService.user.create).toHaveBeenCalled();
      const createdData = prismaService.user.create.mock.calls[0][0].data;
      expect(createdData.passwordHash).not.toBe('password123');
      await expect(
        bcrypt.compare('password123', createdData.passwordHash),
      ).resolves.toBe(true);
      expect(result).toBeDefined();
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('Đăng ký lỗi khi email bị trùng (ném ra ConflictException/BadRequest)', async () => {
      // Mock: đã tồn tại email trong DB
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'customer@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('returns 409 when another registration wins the unique constraint race', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Duplicate email', {
          code: 'P2002',
          clientVersion: '6.19.3',
          meta: { target: ['email'] },
        }),
      );
      await expect(
        authService.register({
          email: mockUser.email,
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('Đăng nhập thành công trả về accessToken và object user', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
      });

      const result = await authService.login({
        email: 'customer@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('customer@example.com');
      expect(result.user.loyaltyPoints).toBe(0);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('Đăng nhập thất bại khi sai mật khẩu (ném ra UnauthorizedException)', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
      });

      await expect(
        authService.login({
          email: 'customer@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('Đăng nhập thất bại khi email không tồn tại', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'notfound@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('returns the authenticated user profile without a password hash', async () => {
      const profile = {
        id: mockUser.id,
        email: mockUser.email,
        loyaltyPoints: 0,
      };
      prismaService.user.findUnique.mockResolvedValue(profile);
      const result = await authService.getProfile(mockUser.id);
      expect(result).toEqual(profile);
      expect(result).not.toHaveProperty('passwordHash');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { id: true, email: true, loyaltyPoints: true },
      });
    });

    it('rejects when the user account no longer exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.getProfile(mockUser.id)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});