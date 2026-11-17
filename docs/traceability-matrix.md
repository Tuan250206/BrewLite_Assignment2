# Ma trận truy vết (Traceability Matrix) — BrewLite

## Quy ước mã

| Loại mã | Nguồn | Ghi chú |
| --- | --- | --- |
| `FR-01`–`FR-10` | `docs/requirements/srs.md` | Yêu cầu chức năng — dùng làm **Mã yêu cầu** |
| `NFR-01`–`NFR-04` | `docs/requirements/srs.md` | Yêu cầu phi chức năng cấp hệ thống |
| `US-01`–`US-09` | Bộ User Story của đề bài | Dùng ở cột **Use-case/User Story** |
| `UC1`–`UC10` | `docs/diagrams/use-case-overview.puml` | Use case trong sơ đồ |
| `AUTH-HTTP-*`, `ORD-UNIT-*`, `ORD-INT-*`, `PAY-UNIT-*`, `PAY-INT-*`, `DB-INT-*` | Source test | Giữ nguyên mã như trong test |

## 1. Ma trận truy vết yêu cầu chức năng

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API | Test |
| --- | --- | --- | --- | --- |
| **FR-01** | US-01 – Xem menu | `use-case-overview.puml` (UC1); `class-domain-model-overview.puml` (Product) | `GET /products`, `GET /products/:id` | `products.service.spec.ts`; `product-image.spec.ts` |
| **FR-02** | US-02 – Chọn size & topping | `use-case-overview.puml` (UC2); `class-domain-model-overview.puml` (Product, OrderItem) | `GET /products/:id`; `order-pricing.ts` | `order-pricing.spec.ts`; `cartStore.spec.ts` |
| **FR-03** | US-03 – Quản lý giỏ hàng | `use-case-overview.puml` (UC3); `activity-end-to-end.puml` | `cartStore.ts` (Zustand persist); `CartView.tsx` | `cartStore.spec.ts`; `ORD-INT-03`, `ORD-INT-05` |
| **FR-04** | US-04 – Đăng ký tài khoản | `use-case-overview.puml` (UC4) | `POST /auth/register` | `AUTH-HTTP-01`..`AUTH-HTTP-04`; `auth.service.spec.ts` |
| **FR-05** | US-04 – Đăng nhập | `use-case-overview.puml` (UC7) | `POST /auth/login`, `GET /auth/me` | `AUTH-HTTP-05`..`AUTH-HTTP-12`; E2E `checkout-auth.spec.ts` |
| **FR-06** | US-05 – Đặt đơn hàng | `sequence-checkout.puml`; `activity-end-to-end.puml` | `POST /orders` | `ORD-UNIT-03`; `ORD-INT-04`; `PAY-INT-05` |
| **FR-07** | US-05 – Thanh toán không tiền mặt | `sequence-checkout.puml`; `use-case-place-and-pay.puml` (UC5, UC10) | `POST /payments`, `GET /payments/orders/:orderId/status`; `POST /mock-gateway/pay` | `PAY-UNIT-06`..`PAY-UNIT-09`; `PAY-INT-01`..`PAY-INT-03`; E2E `checkout-real.spec.ts` |
| **FR-08** | US-06 – Xem lịch sử đơn | `use-case-overview.puml` (UC6) | `GET /orders/me`, `GET /orders/:id` | `ORD-UNIT-04`, `ORD-UNIT-05`; `ORD-INT-05`; `orders-api.spec.ts` |
| **FR-09** | US-06 – Hủy đơn hàng | `use-case-overview.puml` (UC8); `order-state.ts` | `PATCH /orders/:id/cancel`, `PATCH /orders/:id/retry-payment` | `ORD-UNIT-06`..`ORD-UNIT-08`; E2E `checkout-auth.spec.ts` |
| **FR-10** | US-08 – Cập nhật trạng thái đơn | `use-case-overview.puml` (UC9); `order-state.ts` | `order-state.ts` (máy trạng thái `PAID→PREPARING→READY→COMPLETED`) | `order-state.spec.ts` |
| — | US-09 – Khuyến mãi & tích điểm (Future Scope) | `class-domain-model-overview.puml` (Promotion, LoyaltyTransaction) | `schema.prisma` (model `Promotion`, `User.loyaltyPoints`, `LoyaltyTransaction`) | Chưa có test nghiệp vụ |

## 2. Ma trận truy vết yêu cầu phi chức năng

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API | Test |
| --- | --- | --- | --- | --- |
| **NFR-01** | Hiệu năng | `architecture/overview.md` | `GET /products`; `prisma.service.ts` | Chưa có test đo thời gian phản hồi |
| **NFR-02** | Bảo mật | `architecture/overview.md`; `adr/003-mock-payment-idempotency.md` | `auth.service.ts` (bcrypt + JWT); `jwt-auth.guard.ts`; kiểm tra quyền sở hữu đơn | `AUTH-HTTP-08`..`AUTH-HTTP-12`; `ORD-INT-02`, `ORD-INT-05` |
| **NFR-03** | Tính khả dụng | `deployment-production.puml` | `GET /health` | `health.service.spec.ts` (200 & 503) |
| **NFR-04** | Khả năng triển khai | `deployment-production.puml` | `docker-compose.yml`, `apps/*/Dockerfile`, `.github/workflows/*.yml`, `README.md` | CI/CD pipeline (Install → Lint → Test → Build → Deploy → smoke) |

## 3. Giải thích User Story

### US-01 – Xem menu

> Là một **khách hàng**, tôi muốn **xem danh sách đồ uống đang bán kèm hình ảnh và giá**, để tôi **chọn được món muốn uống**.

**Tiêu chí chấp nhận:**
- Giao diện hiển thị danh sách sản phẩm từ hệ thống khi tải thành công.
- Mỗi sản phẩm hiển thị tối thiểu tên, hình ảnh và giá bán.
- Không có sản phẩm thì hiển thị thông báo danh sách trống.
- Tải thất bại thì hiển thị thông báo lỗi thay vì trang trống.

### US-02 – Chọn size & topping

> Là một **khách hàng**, tôi muốn **chọn size (S/M/L) và thêm topping**, để tôi **tùy biến đồ uống theo sở thích và thấy giá cập nhật**.

**Tiêu chí chấp nhận:**
- Mở được chi tiết sản phẩm đang tồn tại.
- Hiển thị tên, giá và các lựa chọn size/topping khả dụng.
- Giá hiển thị thay đổi đúng theo size và topping đã chọn.
- Sản phẩm không tồn tại thì hiển thị thông báo phù hợp.

### US-03 – Quản lý giỏ hàng

> Là một **khách hàng**, tôi muốn **thêm, sửa số lượng và xóa sản phẩm trong giỏ**, để tôi **kiểm soát đơn hàng trước khi thanh toán**.

**Tiêu chí chấp nhận:**
- Thêm được sản phẩm với size, topping và số lượng hợp lệ.
- Thay đổi được số lượng và xóa được sản phẩm trong giỏ.
- Tổng tiền được tính lại theo số lượng và tùy chọn đã chọn.
- Số lượng không hợp lệ (không phải số nguyên dương) bị từ chối.
- Không thể đặt đơn khi giỏ hàng trống.

### US-04 – Đăng ký & đăng nhập

> Là một **khách hàng**, tôi muốn **đăng ký tài khoản và đăng nhập**, để tôi **đặt hàng, thanh toán và xem lịch sử đơn của mình**.

**Tiêu chí chấp nhận:**
- Dữ liệu hợp lệ được chấp nhận và tạo tài khoản thành công.
- Email trùng hoặc dữ liệu sai định dạng bị từ chối, kèm thông báo rõ ràng.
- Mật khẩu không được lưu dưới dạng văn bản thuần.
- Đăng nhập hợp lệ thành công và nhận JWT có thời hạn.
- Thông tin đăng nhập sai bị từ chối và hiển thị thông báo lỗi.
- Yêu cầu đến API được bảo vệ mà không có JWT hợp lệ bị từ chối.

### US-05 – Thanh toán không tiền mặt

> Là một **khách hàng**, tôi muốn **thanh toán đơn bằng ví điện tử/thẻ**, để tôi **không cần mang tiền mặt**.

**Tiêu chí chấp nhận:**
- Khi giỏ hàng có ít nhất 1 sản phẩm, nút "Thanh toán" hiển thị tổng tiền.
- Chọn phương thức (Ví / Thẻ) rồi xác nhận ⇒ tạo đơn ở trạng thái `PAID`.
- Nếu thanh toán lỗi, đơn ở trạng thái `PAYMENT_FAILED` và giỏ hàng được giữ nguyên.
- Sau khi thành công, hiển thị mã đơn và màn hình xác nhận.
- Chỉ sử dụng thanh toán mô phỏng, không thực hiện giao dịch tài chính thật.
- Gửi lại cùng yêu cầu với cùng khóa idempotency không tạo thêm giao dịch.

### US-06 – Xem lịch sử & hủy đơn

> Là một **khách hàng**, tôi muốn **xem danh sách đơn đã đặt và hủy đơn khi cần**, để tôi **theo dõi tình trạng đơn hàng và hủy nếu không muốn mua nữa**.

**Tiêu chí chấp nhận:**
- Khách hàng đã đăng nhập xem được danh sách đơn hàng của chính mình.
- Mỗi đơn hiển thị mã đơn, thời gian đặt, tổng tiền và trạng thái.
- Không thể truy cập lịch sử hoặc chi tiết đơn của khách hàng khác.
- Chưa có đơn hàng thì hiển thị thông báo danh sách trống.
- Khách hàng chỉ hủy được đơn của mình khi đơn chưa thanh toán thành công.
- Hủy thành công làm trạng thái đơn chuyển thành `CANCELLED`.

### US-07 – Đảm bảo idempotency thanh toán

> Là một **khách hàng**, tôi muốn **gửi lại yêu cầu thanh toán bị gián đoạn mà không bị tính tiền hai lần**, để tôi **an tâm khi mạng không ổn định**.

**Tiêu chí chấp nhận:**
- Thiếu `Idempotency-Key` bị từ chối.
- Gửi lại cùng key trả về kết quả giao dịch ban đầu, không tạo thêm `Payment`.
- Cùng key dùng cho đơn/chủ khác bị từ chối.

### US-08 – Kiểm soát tồn kho & trạng thái xử lý

> Là một **nhân viên quầy**, tôi muốn **hệ thống tự kiểm tra tồn kho và cập nhật trạng thái đơn**, để tôi **không bán quá hàng và khách biết tiến trình đơn**.

**Tiêu chí chấp nhận:**
- Tạo đơn kiểm tra tồn kho và từ chối nếu không đủ; không tạo đơn lỗi.
- Đơn `PENDING` chưa trừ tồn; chỉ trừ tồn khi thanh toán thành công, trong transaction.
- Nhiều khách thanh toán đồng thời không bán vượt tồn; tồn không âm.
- Đơn `PAID` có thể chuyển lần lượt `PREPARING → READY → COMPLETED`.
- Chuyển trạng thái không hợp lệ bị từ chối.

> **Lưu ý phạm vi:** MVP quản lý tồn theo **sản phẩm** (không tách size/topping, không có định mức nguyên liệu — giả định `A-06`). API cập nhật trạng thái cho nhân viên (UC9) và hủy đơn `PAID`/hoàn tồn kho **chưa triển khai**; chỉ có máy trạng thái.

### US-09 – Khuyến mãi & tích điểm (Future Scope)

> Là một **khách hàng**, tôi muốn **nhập mã giảm giá và tích điểm thưởng**, để tôi **tiết kiệm và hưởng ưu đãi sau những lần mua**.

**Tiêu chí chấp nhận:**
- Hệ thống kiểm tra mã tồn tại, đang hoạt động, còn hạn và đơn đạt giá trị tối thiểu.
- Tích lũy điểm sau khi mua thành công.

> **Lưu ý phạm vi:** Tính năng này thuộc **Future Scope `EX-07`** (theo `docs/requirements/context-and-scope.md`). Hiện chỉ có model trong `schema.prisma`, chưa có API/service/UI.

