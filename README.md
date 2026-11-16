# BrewLite - Coffee Ordering Platform

Bài tập lớn môn Công nghệ Phần mềm - Assignment 2 (Requirements to Deployment)
Hệ thống đặt cà phê theo kiến trúc Mobile-first / PWA, NestJS API và PostgreSQL.

---

## 1. Cấu trúc Repository

Dự án áp dụng mô hình monorepo với các thư mục chính:

- `apps/web`: Ứng dụng Frontend phát triển bằng Next.js (Mobile-first / PWA).
- `apps/api`: Dịch vụ Backend API xây dựng bằng NestJS.
- `docs/`: Tài liệu phân tích yêu cầu (SRS), sơ đồ thiết kế UML và kiến trúc hệ thống.
- `tests/`: Bộ kiểm thử backend (Unit Test, Integration Test) và hướng dẫn chạy.
- `.github/workflows/`: Cấu hình pipeline tự động hóa CI/CD qua GitHub Actions.

---

## 2. Chiến lược Phân nhánh và Pull Request

### Phân nhánh (Branching Strategy)

- `main`: Nhánh chính chứa mã nguồn ổn định nhất, sẵn sàng bàn giao và triển khai Production. Nhánh này được bật tính năng Branch Protection, cấm push trực tiếp.
- Các nhánh chức năng tạo ra từ `main`:
  - `feat/<tên-tính-năng>`: Xây dựng tính năng mới (Ví dụ: `feat/menu-catalog`, `feat/order-checkout`).
  - `fix/<tên-lỗi>`: Sửa lỗi hệ thống (Ví dụ: `fix/cancelled-order`).
  - `docs/<tên-tài-liệu>`: Bổ sung hoặc cập nhật tài liệu (Ví dụ: `docs/traceability-matrix`).
  - `test/<tên-module>`: Viết hoặc bổ sung kịch bản kiểm thử (Ví dụ: `test/e2e-order`).

### Quy trình Pull Request (PR)

1. Tạo Pull Request từ nhánh tính năng về nhánh `main`.
2. Mô tả rõ nhiệm vụ giải quyết và gắn liên kết với Issue liên quan (Ví dụ: `Closes #1`).
3. Điều kiện bắt buộc để merge vào `main`:
   - Pipeline CI (Install → Lint → Unit Test → Build) thực thi thành công.
   - Có sự xem xét (review) và phê duyệt (approve) từ thành viên trong nhóm.

---

## 3. Quy ước Commit

Tiêu đề commit phải rõ ràng, bắt đầu bằng các tiền tố phân loại công việc:

- `feat:` Thêm tính năng mới (Ví dụ: `feat: implement cancel order logic`).
- `fix:` Sửa lỗi hệ thống (Ví dụ: `fix: disable cancel button for paid orders`).
- `test:` Bổ sung hoặc chỉnh sửa mã kiểm thử (Ví dụ: `test: add e2e test for checkout flow`).
- `docs:` Cập nhật tài liệu, sơ đồ UML hoặc ma trận truy vết (Ví dụ: `docs: update traceability matrix`).
- `ci:` Cấu hình pipeline GitHub Actions, Docker (Ví dụ: `ci: add workflow for pr check`).
- `refactor:` Tái cấu trúc mã nguồn mà không làm thay đổi logic xử lý.
- `chore:` Cập nhật cấu hình phụ, dependencies hoặc dọn dẹp thư mục.

---

## 4. Tiêu chí Hoàn thành (Definition of Done - DoD)

Một User Story hoặc Issue được xác nhận là "Done" khi đạt đủ các tiêu chí:

1. **Lint & Code Quality:** Mã nguồn không còn lỗi cảnh báo hoặc vi phạm quy tắc khi chạy `npm run lint`.
2. **Kiểm thử:** Đã có kiểm thử tự động (Unit Test / Integration Test / E2E Test) tương ứng và kết quả kiểm thử pass 100%.
3. **Môi trường Local:** Kiểm thử cục bộ thông qua `docker-compose.yml` hoạt động ổn định.
4. **CI Kiểm tra:** Pull Request vượt qua toàn bộ các bước kiểm tra tự động của GitHub Actions và được merge vào nhánh chính.
5. **Truy vết:** Đã đối chiếu và cập nhật các mã yêu cầu, mã API và mã bài test vào tệp `docs/traceability-matrix.md`.

---

## 5. Khởi chạy Hệ thống tại Local

### 5.1. Yêu cầu môi trường

- Node.js (phiên bản 20 trở lên)
- Docker và Docker Compose
- npm

### 5.2. Sao chép mã nguồn

```bash
git clone https://github.com/Tuan250206/BrewLite_Assignment2.git
cd BrewLite_Assignment2
```

### 5.3. Cấu hình biến môi trường

Sao chép tệp mẫu và chỉnh sửa nếu cần:

```bash
cd apps/api
cp .env.example .env
```

Nội dung `apps/api/.env`:

| Biến | Ý nghĩa | Giá trị mẫu |
| :--- | :--- | :--- |
| `PORT` | Cổng chạy API | `3001` |
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL | `postgresql://postgres:postgres@localhost:5433/brewlite_db?schema=public` |
| `JWT_SECRET` | Khóa bí mật ký JWT (tối thiểu 32 ký tự) | sinh bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

Frontend cần tệp `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BREWLITE_ORDER_MOCK=false
```

> Lưu ý: không commit tệp `.env` / `.env.local` chứa giá trị thật lên repository; tệp mẫu `.env.example` chỉ chứa giá trị giả.

### 5.4. Cách 1 — Chạy toàn hệ thống bằng Docker Compose (khuyến nghị)

Lệnh chạy từ **thư mục gốc dự án**:

```bash
docker compose up -d --build
```

Docker Compose khởi chạy 3 service:

| Service | Cổng | Mô tả |
| :--- | :--- | :--- |
| `postgres` | `5433` (host) | PostgreSQL 16, có healthcheck `pg_isready` |
| `api` | `3001` | NestJS; tự động chạy `prisma migrate deploy` + `db seed` trước khi khởi động |
| `web` | `3000` | Next.js |

Kiểm tra hệ thống đã sẵn sàng:

```bash
curl http://localhost:3001/health
# {"status":"ok","database":"up",...}
```

Dừng hệ thống: `docker compose down` (thêm `-v` nếu muốn xóa cả dữ liệu database).

### 5.5. Cách 2 — Chạy chế độ phát triển (hot reload)

Chạy PostgreSQL bằng Docker, sau đó chạy từng ứng dụng:

```bash
# 1. Chỉ chạy database
docker compose up -d --wait postgres

# 2. Backend (cửa sổ terminal 1)
cd apps/api
npm ci
npx prisma generate
npx prisma migrate deploy
node --loader ts-node/esm prisma/seed.ts   # tạo 6 sản phẩm mẫu
npm run start:dev                          # http://localhost:3001

# 3. Frontend (cửa sổ terminal 2)
cd apps/web
npm ci
npm run dev                                # http://localhost:3000
```

---

## 6. Kiểm thử

Chi tiết về migration/seed và cấu hình test backend xem tại [tests/README.md](tests/README.md).

### 6.1. Backend — Unit Test (trong `apps/api`)

Bao gồm kiểm thử `auth`, `products`, `health`, `order-state`, `order-pricing`:

```bash
cd apps/api
npm ci
npx prisma generate
npm test -- --runInBand
```

### 6.2. Backend — Unit & Integration Test (trong `tests/`)

Integration test chạy trên PostgreSQL thật (Docker), tự tạo/xóa schema riêng:

```bash
docker compose up -d --wait postgres
cd apps/api
npm ci
npx prisma generate

# Unit test nghiệp vụ đơn hàng / thanh toán
npm test -- --config ../../tests/jest.unit.config.ts --runInBand

# Integration test API tạo đơn / thanh toán / tồn kho / idempotency
$env:TEST_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/brewlite_db'
npm test -- --config ../../tests/jest.integration.config.ts --runInBand
```

### 6.3. Frontend — Unit Test (Vitest)

```bash
cd apps/web
npm ci
npm test
```

### 6.4. Frontend — E2E Test (Playwright)

```bash
cd apps/web
npm run test:e2e          # kịch bản chạy với backend mô phỏng/mock
npm run test:e2e:real     # kịch bản chạy end-to-end với backend thật
npm run test:e2e:slow     # chạy có hiển thị trình duyệt, 1 worker (để quay minh chứng)
```

Kết quả và minh chứng E2E được sinh tự động: xem `apps/web/test-results/` (ảnh chụp/`video` khi bật recording) và báo cáo HTML của Playwright.

### 6.5. Lint

```bash
cd apps/api && npm run lint   # oxlint
cd apps/web && npm run lint   # eslint
```

---

## 7. Build

### 7.1. Build từng ứng dụng

```bash
cd apps/api && npm run build    # kết quả: apps/api/dist
cd apps/web && npm run build    # kết quả: apps/web/.next
```

### 7.2. Build Docker Image

```bash
# API
docker build -t brewlite/api:local ./apps/api

# Web (cần truyền URL API của môi trường đích)
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://<api-domain> \
  --build-arg NEXT_PUBLIC_BREWLITE_ORDER_MOCK=false \
  -t brewlite/web:local ./apps/web
```

---

## 8. Triển khai (Deployment)

### 8.1. Pipeline CI/CD

| Workflow | Kích hoạt | Nội dung |
| :--- | :--- | :--- |
| `.github/workflows/ci.yml` | Pull Request vào `main` và push lên `main` | Install → Lint → Unit Test → Build (cho cả `api` và `web`). PR **không được merge** nếu bất kỳ bước nào thất bại. |
| `.github/workflows/cd.yml` | Push lên `main`, push tag `v*.*.*`, hoặc chạy thủ công | Quality Gate → Build & Push image lên GHCR → Trigger deploy trên Render → Smoke Test → hướng dẫn rollback. |

### 8.2. Quy trình CD chi tiết

1. **Quality gate:** lint + unit test + build cho `api` và `web`.
2. **Build & Push:** đóng gói image và đẩy lên GitHub Container Registry `ghcr.io/tuan250206/brewlite_assignment2/{api,web}` với tag bất biến:
   - Push tag `v1.0.0` → image tag `v1.0.0`
   - Push nhánh `main` → image tag `sha-<7 ký tự đầu của commit>`
   - Đồng thời gắn thêm tag `latest`.
3. **Deploy:** gọi Render Deploy Hook kèm `imgURL` của image vừa build.
4. **Smoke test:** chờ và gọi `GET /health` cho tới khi trả về `"status":"ok"` (tối đa 15 phút), sau đó kiểm tra frontend trả HTTP 200.
5. **Rollback:** nếu smoke test thất bại, pipeline dừng và in hướng dẫn rollback vào phần tóm tắt của lần chạy.

### 8.3. Biến và Secret cần cấu hình trên GitHub

| Loại | Tên | Ý nghĩa |
| :--- | :--- | :--- |
| Secret | `RENDER_API_DEPLOY_HOOK` | Deploy hook của service API trên Render |
| Secret | `RENDER_WEB_DEPLOY_HOOK` | Deploy hook của service Web trên Render |
| Variable | `PRODUCTION_API_URL` | URL API production (HTTPS) |
| Variable | `PRODUCTION_WEB_URL` | URL frontend production (HTTPS) |

Secret/variable được khai báo trong **GitHub → Settings → Secrets and variables → Actions**, không lưu trong repository. Database production chạy trên hạ tầng Render (không mở cổng public) và chỉ được API truy cập qua `DATABASE_URL` nội bộ.

---

## 9. Rollback

Mỗi lần build đều sinh ra tag image bất biến (semver hoặc `sha-xxxxxxx`), và tag `latest` là con trỏ có thể dịch chuyển. Vì vậy rollback chỉ là "trỏ về tag cũ".

**Cách 1 — Qua Render Dashboard:**

1. Vào Render → chọn service (`api` hoặc `web`) → tab **Events**.
2. Tìm lần deploy thành công gần nhất trước đó.
3. Chọn **Redeploy** cho phiên bản đó.

**Cách 2 — Gọi lại deploy hook với tag cũ:**

```bash
curl --get \
  --data-urlencode "imgURL=ghcr.io/tuan250206/brewlite_assignment2/api:sha-3e679d8" \
  "<RENDER_API_DEPLOY_HOOK>"
```

**Kiểm tra sau rollback:**

```bash
curl https://<api-domain>/health   # mong đợi: {"status":"ok",...}
```

---

## 10. Bàn giao (Task 5.4)

| Hạng mục | Đường dẫn |
| :--- | :--- |
| Ma trận truy vết | [docs/traceability-matrix.md](docs/traceability-matrix.md) |
| Release Notes v1.0.0 | [docs/release-notes-v1.0.0.md](docs/release-notes-v1.0.0.md) |
| SRS & yêu cầu | [docs/requirements/srs.md](docs/requirements/srs.md) |
| Phạm vi & ngữ cảnh | [docs/requirements/context-and-scope.md](docs/requirements/context-and-scope.md) |
| Kiến trúc & ADR | [docs/architecture/overview.md](docs/architecture/overview.md) |
| Sơ đồ UML | `docs/diagrams/` |
| Hướng dẫn test backend | [tests/README.md](tests/README.md) |

**URL hệ thống Production:**

| Môi trường | URL |
| :--- | :--- |
| Frontend (Web) | `https://<PRODUCTION_WEB_URL>` |
| Backend API | `https://<PRODUCTION_API_URL>` |
| Health check | `https://<PRODUCTION_API_URL>/health` |

**Video demo luồng end-to-end:** https://drive.google.com/file/d/1A-eg1J9njoYhHFaS733luhuykywo9NIw/view

Video ghi lại luồng nghiệp vụ chính: chọn món từ thực đơn → tùy biến size/topping → thêm vào giỏ hàng → đăng nhập → tạo đơn và thanh toán qua cổng mô phỏng (WALLET/CARD) → xem xác nhận đơn và lịch sử/trạng thái đơn hàng.

**GitHub Release:** https://github.com/Tuan250206/BrewLite_Assignment2/releases/tag/v1.0.0

---

## 11. Truy vết yêu cầu

Toàn bộ ánh xạ giữa mã yêu cầu (`US-01`–`US-09`, `NFR-01`–`NFR-04`) với use-case, sơ đồ thiết kế, API, mã nguồn và bài kiểm thử được ghi tại [docs/traceability-matrix.md](docs/traceability-matrix.md).
````

Còn thiếu **2 URL production** (ở §10) — bạn gửi mình thay vào. Bạn có muốn mình viết luôn 2 biên bản Sprint Review / Retrospective không?