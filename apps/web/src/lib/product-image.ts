const LEGACY_PRODUCT_IMAGES: Record<string, string> = {
  '/images/americano.jpg': '/images/caramel-cold-brew.png',
  '/images/cappuccino.jpg': '/images/brew-latte.png',
  '/images/ca-phe-sua.jpg': '/images/brew-latte.png',
  '/images/tra-dao.jpg': '/images/citrus-bloom.png',
};

/** Return a local image that exists for both current and legacy seed data. */
export function getProductImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return '/images/brew-latte.png';

  const legacyImage = LEGACY_PRODUCT_IMAGES[imageUrl.trim().toLowerCase()];
  return legacyImage ?? imageUrl;
}
