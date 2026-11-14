import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      name: 'Brew Latte',
      price: 59000,
      imageUrl: '/images/brew-latte.png',
      stock: 20,
    },
    {
      name: 'Caramel Cold Brew',
      price: 65000,
      imageUrl: '/images/caramel-cold-brew.png',
      stock: 20,
    },
    {
      name: 'Vanilla Matcha',
      price: 61000,
      imageUrl: '/images/vanilla-matcha.png',
      stock: 20,
    },
    {
      name: 'Berry Fizz',
      price: 55000,
      imageUrl: '/images/berry-fizz.png',
      stock: 20,
    },
    {
      name: 'Mocha Freeze',
      price: 69000,
      imageUrl: '/images/mocha-freeze.png',
      stock: 20,
    },
    {
      name: 'Citrus Bloom',
      price: 57000,
      imageUrl: '/images/citrus-bloom.png',
      stock: 20,
    },
  ];

  for (const product of products) {
    const existingProduct = await prisma.product.findFirst({
        where: { name: product.name },
    });

    if (existingProduct) {
        await prisma.product.update({
        where: { id: existingProduct.id },
            data: {
                price: product.price,
                imageUrl: product.imageUrl,
                stock: product.stock,
            },
        });
    } else {
        await prisma.product.create({
        data: product,
        });
    }
    }
    console.log('Đã thêm 6 sản phẩm mẫu');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });