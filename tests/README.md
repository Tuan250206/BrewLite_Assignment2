# Kiểm thử Backend — Task 5.2

- `unit/`: kiểm tra nghiệp vụ đơn hàng và thanh toán.
- `integration/`: kiểm tra API với PostgreSQL thật, gồm migration/seed, tồn kho và thanh toán.

## 1. Chuẩn bị

Chạy từ **thư mục gốc dự án** (cần Node.js và Docker):

```powershell
docker compose up -d --wait postgres
cd apps/api
npm ci
npx prisma generate
```

## 2. Chạy test

Tiếp tục trong **apps/api**:

```powershell
# Unit test
npm test -- --config ../../tests/jest.unit.config.ts --runInBand

# Integration test
$env:TEST_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/brewlite_db'
npm test -- --config ../../tests/jest.integration.config.ts --runInBand
```

Integration test tự tạo và xóa schema riêng, không reset dữ liệu ứng dụng.

## 3. Migration và dữ liệu mẫu

Chạy trong **apps/api**:

```powershell
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/brewlite_db?schema=public'
npx prisma migrate deploy
node --loader ts-node/esm prisma/seed.ts
```

Seed tạo/cập nhật 6 sản phẩm mẫu, chạy lại không tạo sản phẩm trùng.
