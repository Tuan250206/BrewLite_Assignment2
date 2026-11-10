import { describe, it, expect } from 'vitest';
import { getProductImageUrl } from './product-image';

describe('Menu Catalog - Hiển thị sản phẩm & xử lý trạng thái (Task 4.3)', () => {
  it('trả về ảnh mặc định khi sản phẩm không có imageUrl', () => {
    expect(getProductImageUrl(undefined)).toBe('/images/brew-latte.png');
    expect(getProductImageUrl(null)).toBe('/images/brew-latte.png');
    expect(getProductImageUrl('')).toBe('/images/brew-latte.png');
  });

  it('ánh xạ đúng đường dẫn ảnh cũ (legacy seed) sang ảnh có sẵn trong public/images', () => {
    expect(getProductImageUrl('/images/americano.jpg')).toBe(
      '/images/caramel-cold-brew.png',
    );
    expect(getProductImageUrl('/images/cappuccino.jpg')).toBe(
      '/images/brew-latte.png',
    );
    expect(getProductImageUrl('/images/tra-dao.jpg')).toBe(
      '/images/citrus-bloom.png',
    );
  });

  it('giữ nguyên đường dẫn ảnh hợp lệ từ API GET /products', () => {
    expect(getProductImageUrl('/images/vanilla-matcha.png')).toBe(
      '/images/vanilla-matcha.png',
    );
  });
});