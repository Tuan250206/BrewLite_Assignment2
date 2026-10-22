# BrewLite — Use Case: Đặt và thanh toán đơn hàng

**Phiên bản:** 1.0  
**Mã use case:** UC-01  
**Task:** 1.3 — Đặc tả use-case trọng tâm (văn bản)  
**Mức:** Mục tiêu người dùng

## 1. Tóm tắt

Khách hàng chọn đồ uống và tùy chọn, gửi đơn đã xác thực; hệ thống xác nhận tồn kho, tính giá từ dữ liệu backend, tạo đơn `PENDING` và cho khách thanh toán qua mock gateway. Hệ thống ghi nhận kết quả, cập nhật trạng thái và hiển thị xác nhận. MVP không thu tiền thật.

## 2. Actor và hệ thống liên quan

| Actor / hệ thống                             | Vai trò                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Khách hàng (actor chính)                     | Chọn món, gửi đơn, chọn phương thức thanh toán và xác nhận thanh toán giả lập.                                     |
| BrewLite frontend                            | Hiển thị menu, chi tiết, giỏ hàng, đăng nhập và kết quả đơn/thanh toán.                                            |
| BrewLite backend                             | Xác thực, kiểm tra dữ liệu, tính giá, giữ/trừ tồn kho, tạo đơn và điều phối thanh toán.                            |
| PostgreSQL                                   | Lưu user, product, order, order item và payment.                                                                   |
| Mock payment gateway (actor phụ)             | Mô phỏng kết quả thanh toán và gửi callback/webhook về BrewLite.                                                   |
| Nhân viên quầy (actor hỗ trợ ngoài hệ thống) | Nhận/chuẩn bị đơn theo quy trình cửa hàng; không trực tiếp thao tác trong use case MVP nếu chưa có giao diện quầy. |

## 3. Trigger

Khách hàng chọn **Tiến hành thanh toán** từ giỏ hàng có ít nhất một sản phẩm.

## 4. Tiền điều kiện

1. Menu và dịch vụ backend/database đang sẵn sàng.
2. Giỏ hàng có ít nhất một sản phẩm; mỗi số lượng là số nguyên dương.
3. Sản phẩm, size và topping được chọn thuộc dữ liệu/quy tắc hợp lệ.
4. Khách đã đăng nhập hợp lệ trước khi gửi yêu cầu tạo đơn. Nếu chưa đăng nhập, luồng thay thế yêu cầu đăng nhập rồi quay lại checkout.
5. Khách chưa xác nhận giao dịch tiền thật; phương thức được chọn chỉ chạy với mock gateway.

## 5. Hậu điều kiện

### Thành công

- Một order thuộc về khách được lưu với tổng tiền do backend tính.
- Tồn kho được kiểm tra và giữ/trừ trong transaction; nếu có tranh chấp thì không thể bán vượt số lượng.
- Payment được lưu với `Idempotency-Key`; khi gateway xác nhận thành công, payment/order được cập nhật `PAID`.
- Khách thấy mã đơn, tổng tiền và trạng thái cuối cùng; đơn xuất hiện trong lịch sử tài khoản.

### Thất bại / ngoại lệ

- Nếu kiểm tra hoặc giữ kho thất bại, không tạo order dở dang và tồn kho không bị trừ một phần.
- Nếu thanh toán thất bại, payment/order phản ánh `PAYMENT_FAILED`; không được hiển thị là đã thanh toán.
- Lặp lại yêu cầu cùng khóa idempotency và cùng dữ liệu không tạo thêm payment; cùng khóa nhưng dữ liệu khác bị từ chối.
- Quy tắc hoàn tồn kho khi payment thất bại/hủy hiện cần xác nhận theo `A-07` trong tài liệu bối cảnh; phải được chốt trước khi nghiệm thu hành vi này.

## 6. Luồng chính

| Bước | Tác nhân                      | Hành động / phản hồi                                                                                                                                                                                      |
| ---: | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    1 | Khách hàng                    | Mở menu, xem sản phẩm, giá và thông tin còn hàng.                                                                                                                                                         |
|    2 | Khách hàng                    | Chọn một hoặc nhiều đồ uống; chọn size, topping hợp lệ và số lượng; thêm vào giỏ.                                                                                                                         |
|    3 | BrewLite frontend             | Hiển thị các dòng hàng và tổng tạm tính; cho khách chỉnh sửa giỏ trước khi gửi.                                                                                                                           |
|    4 | Khách hàng                    | Chọn checkout. Nếu đã xác thực, chọn tiếp tục.                                                                                                                                                            |
|    5 | BrewLite backend              | Nhận `POST /orders`, xác thực JWT và validate request; tải product/giá từ database, bỏ qua mọi giá do client tự gửi.                                                                                      |
|    6 | BrewLite backend + PostgreSQL | Tính giá theo size/topping/khuyến mãi hợp lệ; kiểm tra tồn kho và giữ/trừ kho trong cùng transaction với việc tạo order `PENDING` và các order item. Nếu một dòng thất bại, rollback toàn bộ transaction. |
|    7 | BrewLite frontend             | Hiển thị đơn đã tạo và yêu cầu khách chọn `EWALLET` hoặc `CARD`.                                                                                                                                          |
|    8 | Khách hàng                    | Xác nhận khởi tạo thanh toán. Frontend gửi `POST /payments` với JWT và `Idempotency-Key`.                                                                                                                 |
|    9 | BrewLite backend              | Kiểm tra đơn thuộc khách và trạng thái hợp lệ; tạo hoặc trả lại payment theo khóa idempotency; khởi tạo phiên mock gateway.                                                                               |
|   10 | Khách hàng                    | Mở trang mock gateway và bấm xác nhận thanh toán. Không nhập thông tin thẻ/ví thật.                                                                                                                       |
|   11 | Mock payment gateway          | Gửi callback/webhook mô phỏng có chữ ký và thông tin giao dịch về backend.                                                                                                                                |
|   12 | BrewLite backend              | Xác minh chữ ký, giao dịch, số tiền và tính hợp lệ của callback; cập nhật payment và trạng thái order trong transaction. Callback lặp không tạo tác động kép.                                             |
|   13 | BrewLite frontend             | Hiển thị kết quả `PAID` hoặc `PAYMENT_FAILED`; khi thành công, hiển thị mã đơn và cho phép xem lịch sử tại `GET /orders/me`.                                                                              |

## 7. Luồng thay thế

### A1 — Khách chưa đăng nhập

1. Tại bước 4, backend/frontend yêu cầu đăng nhập hoặc đăng ký.
2. Sau xác thực thành công, khách quay lại checkout với giỏ hàng đã giữ ở frontend.
3. Tiếp tục tại bước 5. Backend vẫn kiểm tra lại product, giá và tồn kho.

### A2 — Có mã khuyến mãi

1. Khách nhập mã khuyến mãi trước khi gửi đơn.
2. Backend xác thực mã và tự tính mức giảm theo contract hiện hành (ví dụ `WELCOME10`, giảm 10%, tối đa 30.000 đồng).
3. Mã không hợp lệ/hết hạn bị từ chối; không âm tổng tiền.
4. Tiếp tục với tổng tiền do backend trả về.

### A3 — Khách dùng lại yêu cầu thanh toán

1. Khách gửi lại cùng `Idempotency-Key` và cùng order/method.
2. Backend trả kết quả payment đã có, không tạo payment/giao dịch thứ hai.
3. Nếu cùng key nhưng dữ liệu khác, backend từ chối request và giữ nguyên payment hiện có.

### A4 — Khách thử lại sau thanh toán thất bại

1. Khách thấy trạng thái `PAYMENT_FAILED` và chọn thử lại.
2. Backend chỉ cho retry trên đơn thuộc khách và ở trạng thái được phép; tạo lần thanh toán mới với `Idempotency-Key` mới.
3. Nếu thành công, order chuyển về luồng `PAID`; nếu thất bại lần nữa, trạng thái tiếp tục phản ánh thất bại.

### A5 — Khách hủy đơn thanh toán thất bại

1. Khách chọn hủy trên đơn `PAYMENT_FAILED`.
2. Backend kiểm tra quyền sở hữu và transition; nếu hợp lệ, chuyển order sang `CANCELLED`.
3. Cách giải phóng tồn kho phải theo quy tắc được nhóm chốt (xem `A-07`); không được tự giải phóng nhiều lần.

## 8. Luồng ngoại lệ

| Mã  | Tình huống                                                                  | Phản hồi mong đợi                                                                                                       |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| E1  | JWT thiếu, hết hạn hoặc không hợp lệ                                        | Trả `401`; không tạo order/payment và không thay đổi tồn kho.                                                           |
| E2  | Giỏ rỗng, số lượng không nguyên/dương, size/topping không hợp lệ            | Trả lỗi validation (`400`); không ghi order và không trừ kho.                                                           |
| E3  | Product không tồn tại                                                       | Trả `404`; transaction rollback, không tạo order.                                                                       |
| E4  | Một hoặc nhiều product không đủ tồn, gồm hai yêu cầu mua đồng thời món cuối | Từ chối yêu cầu không đủ hàng; chỉ yêu cầu lấy được tồn hợp lệ mới thành công; stock không âm; không tạo order dở dang. |
| E5  | Database lỗi khi tạo order hoặc reserve stock                               | Rollback toàn bộ thao tác; báo lỗi có thể retry; không trả xác nhận thành công.                                         |
| E6  | Mã promo không hợp lệ/hết hạn                                               | Từ chối mã hoặc yêu cầu khách sửa mã theo contract; không áp dụng giảm giá sai.                                         |
| E7  | Gateway báo thanh toán thất bại                                             | Ghi trạng thái thất bại; UI không báo đã trả tiền; khách có thể retry hoặc hủy theo trạng thái cho phép.                |
| E8  | Webhook thiếu/sai chữ ký, sai số tiền/mã giao dịch hoặc quá hạn             | Từ chối callback; không chuyển order sang `PAID`; ghi nhận lỗi kỹ thuật phù hợp để điều tra.                            |
| E9  | Webhook hoặc request thanh toán được gửi lặp                                | Xử lý idempotent; không tạo payment hoặc cập nhật trạng thái hai lần.                                                   |
| E10 | Khách truy cập order không thuộc mình hoặc thao tác sai trạng thái          | Trả `403`/`404` hoặc `409` tương ứng; không sửa dữ liệu.                                                                |

## 9. Liên kết yêu cầu

| Mã yêu cầu | Nội dung                                                                                                    | Bước / luồng liên quan        |
| ---------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------- |
| FR-01      | Khách xem menu và chi tiết sản phẩm, giá, tồn kho.                                                          | Main 1                        |
| FR-02      | Khách chọn size/topping hợp lệ và số lượng nguyên dương.                                                    | Main 2–3; A1                  |
| FR-03      | Chỉ user xác thực mới tạo đơn, thanh toán và xem lịch sử của mình.                                          | Main 4–5, 8–9, 13; A1; E1/E10 |
| FR-04      | Backend lấy giá từ DB, tính tổng và không tin giá/tổng client gửi.                                          | Main 5–6; A2                  |
| FR-05      | Tạo order `PENDING` và order items cùng transaction giữ/trừ kho.                                            | Main 6; E3–E5                 |
| FR-06      | Không bán vượt tồn trong các request đồng thời; transaction rollback toàn bộ nếu reserve một item thất bại. | Main 6; E4–E5                 |
| FR-07      | Hỗ trợ method `EWALLET` và `CARD` qua mock gateway, không thu tiền thật.                                    | Main 7–11; E7–E8              |
| FR-08      | Xử lý idempotency cho payment và callback.                                                                  | Main 8–12; A3; E9             |
| FR-09      | Cập nhật trạng thái hợp lệ `PENDING`, `PAID`, `PAYMENT_FAILED`, retry/hủy theo state machine.               | Main 12–13; A4–A5; E7/E10     |
| FR-10      | Khách nhận kết quả và xem lịch sử đơn.                                                                      | Main 13                       |
| FR-11      | Áp dụng mã promo theo contract (nếu có mã), từ chối mã invalid/expired và không âm tổng.                    | A2; E6                        |
| NFR-01     | Tính toàn vẹn: tạo order, giữ kho và order items nguyên tử; không để stock âm.                              | Main 6; E4–E5                 |
| NFR-02     | Tính truy vết: response/error nêu trạng thái rõ; test có thể kiểm tra các trường hợp thành công và lỗi.     | Tất cả luồng                  |
| NFR-03     | Bảo vệ dữ liệu: không lưu/ghi log thông tin thẻ hoặc ví thật trong MVP.                                     | Main 10; A1; E8               |

## 10. Tiêu chí chấp nhận có thể kiểm thử

1. Với user đã đăng nhập và một giỏ hàng hợp lệ còn đủ kho, `POST /orders` tạo đúng một order `PENDING`; tổng tiền bằng phép tính từ product trong database cộng/trừ tùy chọn hợp lệ.
2. Nếu client gửi giá/tổng tiền giả, backend bỏ qua và dùng giá/quy tắc phía server.
3. Nếu số lượng không hợp lệ, product không tồn tại hoặc stock không đủ, request bị từ chối; không tạo order dở dang và stock không bị trừ một phần.
4. Với product có stock bằng 1, gửi hai yêu cầu đồng thời mỗi yêu cầu mua 1: đúng một yêu cầu thành công, một yêu cầu bị từ chối; stock cuối bằng 0 và chỉ có một order thành công.
5. Order không thể được xem hoặc thao tác bởi user khác.
6. Payment mock với `EWALLET` hoặc `CARD` nhận kết quả success/failure và cập nhật trạng thái đúng; ứng dụng không yêu cầu dữ liệu thẻ/ví thật.
7. Gửi lại cùng `Idempotency-Key` và cùng dữ liệu không tạo payment thứ hai; dùng lại key với dữ liệu khác bị từ chối.
8. Webhook sai chữ ký hoặc sai amount không thể đưa order sang `PAID`; webhook đúng, lặp lại an toàn.
9. Thanh toán thất bại hiển thị `PAYMENT_FAILED`; retry/hủy chỉ được phép theo state machine và quyền sở hữu.
10. Nghiệm thu hành vi giải phóng tồn khi payment fail/cancel sau khi nhóm chốt quy tắc được ghi ở `A-07`.

## 11. Điểm cần nhóm xác nhận trước khi khóa baseline

- Khi đơn được tạo, tồn kho được giữ/trừ ngay. Nếu payment thất bại rồi khách retry, giữ nguyên phần tồn đã giữ hay trả lại rồi reserve lại?
- Khi khách hủy đơn thất bại, có hoàn tồn kho không và cơ chế bảo đảm chỉ hoàn một lần là gì?
- Luồng thanh toán có yêu cầu trigger khởi tạo từ frontend bằng POST `/payments` sau khi order đã tạo, hay mock gateway nên được khởi tạo ngay khi checkout? Contract hiện tại mô tả hai bước riêng.

Các quyết định này cần leader/nhóm xác nhận và cập nhật ở `docs/team-contract.md` trước khi dùng làm acceptance baseline cho implementation.
