import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { ProductsService } from './products.service';
import { jest } from '@jest/globals';

describe('ProductsService', () => {
  let productsService: ProductsService;

  // Giả lập một sản phẩm mà database có thể trả về
  const mockProduct = {
    id: 'product-uuid-123',
    name: 'Americano',
    price: 40000,
    imageUrl: '/images/americano.jpg',
    stock: 20,
  };

  // Giả lập các hàm Prisma mà ProductsService sử dụng
  const mockPrismaService = {
    product: {
      findMany: jest.fn<() => Promise<unknown[]>>(),
      findUnique: jest.fn<() => Promise<unknown>>(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    productsService = module.get<ProductsService>(ProductsService);

    // Xóa lịch sử lời gọi mock trước mỗi test
    jest.clearAllMocks();
  });

  it('service được tạo thành công', () => {
    expect(productsService).toBeDefined();
  });

  describe('findAll', () => {
    it('trả về danh sách sản phẩm, sắp xếp theo tên', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      const result = await productsService.findAll();

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findOne', () => {
    it('trả về sản phẩm khi tìm thấy id', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await productsService.findOne('product-uuid-123');

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-uuid-123' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('báo NotFoundException khi không tìm thấy id', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(productsService.findOne('id-khong-ton-tai')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});