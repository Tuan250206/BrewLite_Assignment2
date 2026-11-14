# Ma trận truy vết (Traceability Matrix) - BrewLite

| Mã yêu cầu (Req ID) | Use-case / User Story | Thiết kế Sơ đồ (Diagrams) | Code / API Endpoint | Test Cases |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Khách hàng xem danh sách món ăn/thức uống (Catalog) | `docs/architecture/001-monorepo.md` | `GET /products`, `GET /products/:id` | Unit/Integration Test Catalog |
| **REQ-02** | Khách hàng tạo đơn hàng và giả lập thanh toán (Idempotency) | `docs/architecture/003-mock-payment-idempotency.md` | `POST /orders`, `POST /payments` | API Test Thanh toán & Idempotency |
| **REQ-03** | Xác thực tài khoản người dùng (Đăng ký/Đăng nhập JWT) | `docs/requirements/` | `POST /auth/register`, `POST /auth/login` | Auth Unit Test |
| **REQ-04** | Quy trình CI/CD tự động hóa triển khai Production | `docs/deployment.md` | `.github/workflows/ci.yml` & `cd.yml` | Pipeline Build & Smoke Test |