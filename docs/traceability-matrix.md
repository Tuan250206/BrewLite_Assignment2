# Ma trận truy vết (Traceability Matrix) - BrewLite

| Mã yêu cầu (Req ID) | Use-case / User Story | Thiết kế / Sơ đồ (Diagrams) | Code / API Endpoint | Test Cases |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Khách hàng xem danh sách món ăn/thức uống (Catalog) | `docs/architecture/001-monorepo.md`[cite: 13] | `GET /products`, `GET /products/:id`[cite: 13] | Unit/Integration Test Catalog[cite: 13] |
| **FR-02** | Khách hàng tạo đơn hàng và giả lập thanh toán (Idempotency) | `docs/architecture/003-mock-payment-idempotency.md`[cite: 13] | `POST /orders`, `POST /payments`[cite: 13] | API Test Thanh toán & Idempotency[cite: 13] |
| **FR-03** | Xác thực tài khoản người dùng (Đăng ký/Đăng nhập JWT) | `docs/requirements/`[cite: 13] | `POST /auth/register`, `POST /auth/login`[cite: 13] | Auth Unit Test[cite: 13] |
| **FR-04** | Quy trình CI/CD tự động hóa triển khai Production | `docs/deployment.md`[cite: 13] | `.github/workflows/ci.yml` & `cd.yml`[cite: 13] | Pipeline Build & Smoke Test[cite: 13] |
| **FR-05** | Đăng nhập, xác thực và phân quyền tài khoản | UC-05, UC-06 | ADR-009, use-case-overview | Auth Unit Test / Security Test |
| **FR-06** | Phân quyền và giới hạn dữ liệu theo vai trò | UC-05, UC-07 đến UC-12 | ADR-009, component-api | Unit Test |
| **FR-07** | Tạo đơn hàng mới từ giỏ hàng | UC-07 | sequence-create-order, domain-class | E2E Test |
| **FR-08** | Kiểm tra và cập nhật tồn kho nguyên liệu | UC-07 | ADR-003, sequence-order | Integration Test |
| **FR-09** | Thanh toán đơn hàng qua VNPay Sandbox | UC-08 | ADR-004, sequence-payment-vnpay | E2E Test |
| **FR-10** | Chống xử lý trùng thanh toán (Idempotency) | UC-08 | ADR-005, domain-class | Unit Test |
| **FR-11** | Hết hạn, thất bại, thanh toán lại và hoàn tiền | UC-08 | ADR-006, activity-expiry | Integration Test |
| **FR-12** | Xem xác nhận và chi tiết đơn hàng | UC-09 | sequence-checkout, domain-class | Unit Test |
| **FR-13** | Xem lịch sử đơn hàng cá nhân | UC-10 | use-case-overview, domain-class | Unit Test |
| **FR-14** | Xem đơn hàng của cửa hàng (Quản trị) | UC-11 | ADR-009, use-case-overview | Unit Test |