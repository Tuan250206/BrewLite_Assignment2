# Ma trận truy vết (Traceability Matrix) - BrewLite

| Mã yêu cầu | User Story & Mô tả chi tiết | Thiết kế / Sơ đồ | Code / API | Test |
| :--- | :--- | :--- | :--- | :--- |
| **NR-01** | **US-01:** Khách hàng xem danh sách món ăn/thức uống *(Mô tả: Cho phép người dùng duyệt qua danh mục sản phẩm, tìm kiếm và lọc đồ uống dễ dàng)* | activity-catalog, domain-class | `GET /products`, `GET /products/:id` | tests/evidence/nr-01.png |
| **NR-02** | **US-02:** Xem chi tiết và tùy chọn sản phẩm *(Mô tả: Xem thông tin giá cả, thành phần và các tùy chọn size, lượng đường, đá cho từng món)* | activity-product-detail, domain-class | `GET /products/:id/options` | tests/evidence/nr-02.png |
| **NR-03** | **US-03:** Quản lý giỏ hàng cá nhân *(Mô tả: Thêm, sửa, xoá sản phẩm và cập nhật số lượng trong giỏ hàng tạm thời)* | activity-cart, domain-class | `GET /cart`, `POST /cart/items` | tests/evidence/nr-03.png |
| **NR-04** | **US-04:** Đăng ký tài khoản khách hàng *(Mô tả: Cho phép người dùng mới tạo tài khoản bằng email/số điện thoại và mật khẩu)* | sequence-register, domain-class | `POST /auth/register` | tests/evidence/nr-04.png |
| **NR-05** | **US-05:** Đăng nhập, xác thực và đăng xuất *(Mô tả: Xác thực tài khoản người dùng, cấp phát và quản lý phiên làm việc bằng JWT)* | sequence-login, domain-class | `POST /auth/login`, `POST /auth/logout` | tests/evidence/nr-05.png |
| **NR-06** | **US-06:** Tạo đơn hàng mới từ giỏ hàng *(Mô tả: Chuyển đổi sản phẩm trong giỏ thành đơn hàng chính thức với địa chỉ và thông tin giao nhận)* | sequence-create-order, activity-order | `POST /orders` | tests/evidence/nr-06.png |
| **NR-07** | **US-07:** Kiểm tra và cập nhật tồn kho nguyên liệu *(Mô tả: Tự động trừ số lượng nguyên liệu trong kho tương ứng khi đơn hàng được xác nhận)* | sequence-inventory, activity-stock | `PATCH /inventory/:id` | tests/evidence/nr-07.png |
| **NR-08** | **US-08:** Thanh toán đơn hàng qua VNPay Sandbox *(Mô tả: Tích hợp cổng thanh toán trực tuyến VNPay để xử lý giao dịch đơn hàng)* | sequence-payment-vnpay, activity-payment | `POST /payments/vnpay` | tests/evidence/nr-08.png |
| **NR-09** | **US-09:** Chống xử lý trùng thanh toán (Idempotency) *(Mô tả: Đảm bảo một giao dịch thanh toán không bị thực hiện trùng lặp khi người dùng bấm nhiều lần)* | sequence-idempotency | Header `X-Idempotency-Key` | tests/evidence/nr-09.png |
| **NR-10** | **US-10:** Xem lịch sử và chi tiết đơn hàng cá nhân *(Mô tả: Giúp khách hàng theo dõi trạng thái các đơn hàng đã đặt trước đó)* | sequence-checkout, domain-class | `GET /orders`, `GET /orders/:id` | tests/evidence/nr-10.png |
| **NFR-01** | **Non-Functional:** Hiệu suất phản hồi API hệ thống dưới 500ms | architecture-overview | N/A (Caching / Optimization) | tests/evidence/nfr-01.png |
| **NFR-02** | **Non-Functional:** Bảo mật thông tin, mã hóa mật khẩu bằng Bcrypt và xác thực token | ADR-009 (Security Auth) | Middleware / Bcrypt hashing | tests/evidence/nfr-02.png |
| **NFR-03** | **Non-Functional:** Khả năng mở rộng kiến trúc Monorepo hiệu quả | docs/architecture/001-monorepo.md | Turboorepo / pnpm workspace | tests/evidence/nfr-03.png |
| **NFR-04** | **Non-Functional:** Độ sẵn sàng hệ thống và triển khai tự động qua CI/CD pipeline | docs/deployment.md | `.github/workflows/ci.yml` & `cd.yml` | tests/evidence/nfr-04.png |