# BrewLite — Bối cảnh và phạm vi

**Phiên bản:** 1.0  
**Tài liệu:** Task 1.1 — Bối cảnh, stakeholder và phạm vi  
**Trạng thái:** Bản đặc tả MVP dùng làm cơ sở cho thiết kế và kiểm thử

## 1. Bối cảnh nghiệp vụ

BrewLite là ứng dụng web hỗ trợ khách hàng xem menu đồ uống, chọn size và topping, tạo đơn và thanh toán không dùng tiền mặt. Nếu quy trình gọi món và thanh toán chỉ thực hiện trực tiếp tại quầy, khách phải chờ nhân viên ghi nhận yêu cầu; nhân viên dễ nhập sai món, số lượng hoặc tổng tiền; cửa hàng khó đồng bộ trạng thái đơn và tồn kho khi nhiều yêu cầu đến cùng lúc.

BrewLite tập trung chuẩn hóa luồng từ xem sản phẩm đến xác nhận thanh toán. Backend là nguồn dữ liệu có thẩm quyền về sản phẩm, giá, tồn kho, tổng tiền, trạng thái đơn và kết quả thanh toán. Bản MVP dùng cổng thanh toán giả lập; không xử lý giao dịch tiền thật.

## 2. Stakeholder

| Stakeholder                   | Vai trò / nhu cầu                         | Mục tiêu và kỳ vọng                                                                                                                                                          |
| ----------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Khách hàng                    | Người xem menu, đặt đồ uống và thanh toán | Xem giá và tồn kho; chọn món, size, topping, số lượng; biết đơn được tạo/thanh toán thành công hay thất bại; xem lịch sử đơn của tài khoản.                                  |
| Nhân viên quầy                | Tiếp nhận và chuẩn bị đơn                 | Nhận thông tin đơn rõ ràng, chính xác; biết món và tùy chọn khách đã chọn; tránh xử lý trùng đơn. Giao diện quản trị/quầy không thuộc MVP nếu chưa được nhóm bổ sung.        |
| Quản lý cửa hàng              | Theo dõi hoạt động và kiểm soát sản phẩm  | Có dữ liệu đơn, giá và tồn kho nhất quán; hạn chế bán vượt số lượng có sẵn; có thể dùng dữ liệu demo để đánh giá quy trình. Công cụ báo cáo/quản trị đầy đủ không thuộc MVP. |
| Giảng viên / người nghiệm thu | Đánh giá đồ án theo yêu cầu và kịch bản   | Có thể lần theo yêu cầu, luồng nghiệp vụ, tiêu chí chấp nhận và bằng chứng kiểm thử; chạy được demo với dữ liệu mẫu và thanh toán giả lập.                                   |
| Nhóm phát triển               | Phân tích, xây dựng, tích hợp và kiểm thử | Có hợp đồng API và quy tắc nghiệp vụ thống nhất; tài liệu đủ cụ thể để chia task, viết test, review và triển khai.                                                           |
| Đơn vị thanh toán             | Hệ thống tích hợp mô phỏng bên ngoài      | Trong MVP chỉ được đại diện bởi mock gateway; giao tiếp qua kết quả giả lập/callback có kiểm tra, không kết nối tài khoản hay mạng thanh toán thật.                          |

## 3. Mục tiêu sản phẩm

1. Cho phép khách xem danh sách và chi tiết đồ uống có giá, ảnh và tồn kho.
2. Cho phép khách cấu hình size/topping, chọn số lượng và tạo đơn hàng.
3. Tính tổng tiền ở backend từ giá sản phẩm và quy tắc đã thống nhất; không tin tổng tiền do frontend gửi.
4. Giữ/trừ tồn kho nhất quán khi nhiều yêu cầu đặt hàng đồng thời; không chấp nhận số lượng vượt tồn.
5. Hỗ trợ thanh toán không tiền mặt bằng mock gateway và thể hiện trạng thái đơn rõ ràng.
6. Tạo tài liệu và tiêu chí chấp nhận có thể chuyển thành test ở các task sau.

## 4. Phạm vi MVP (in-scope)

| Mã    | Phạm vi                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IS-01 | Hiển thị menu và chi tiết sản phẩm mẫu: tên, giá, ảnh, tồn kho.                                                                                         |
| IS-02 | Chọn size S/M/L, topping theo danh sách được nhóm chốt, số lượng nguyên dương; cập nhật giỏ hàng.                                                       |
| IS-03 | Đăng ký/đăng nhập để tạo đơn và truy cập lịch sử đơn của tài khoản.                                                                                     |
| IS-04 | Backend xác thực dữ liệu đơn, đọc giá từ database, tính dòng tiền/tổng tiền và áp dụng quy tắc khuyến mãi nếu mã được hỗ trợ.                           |
| IS-05 | Tạo đơn ở trạng thái `PENDING`; kiểm tra và giữ/trừ tồn kho trong transaction, kể cả khi có yêu cầu đồng thời.                                          |
| IS-06 | Thanh toán bằng `EWALLET` hoặc `CARD` thông qua mock gateway; hỗ trợ thành công, thất bại, xác nhận callback và chống xử lý lặp theo `Idempotency-Key`. |
| IS-07 | Hiển thị kết quả thanh toán, trạng thái đơn và lịch sử đơn cơ bản.                                                                                      |
| IS-08 | Kiểm thử unit, e2e cho quy tắc nghiệp vụ trọng tâm và hướng dẫn chạy demo bằng PostgreSQL/Docker Compose.                                               |

## 5. Ngoài phạm vi MVP (out-of-scope)

| Mã    | Nội dung không thực hiện trong MVP                                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OS-01 | Thu tiền thật, kết nối ngân hàng/ví thật, lưu số thẻ hoặc dữ liệu thanh toán thật.                                                                                     |
| OS-02 | Ứng dụng native iOS/Android, giao hàng, định vị hoặc theo dõi shipper.                                                                                                 |
| OS-03 | Hệ thống quản trị cửa hàng đầy đủ: phân quyền nhân viên, báo cáo doanh thu nâng cao, quản lý nhiều chi nhánh, cấu hình menu qua giao diện quản trị.                    |
| OS-04 | Đồng bộ tồn kho với hệ thống POS/ERP hoặc nhà cung cấp bên ngoài.                                                                                                      |
| OS-05 | Hóa đơn điện tử, hoàn tiền thực, chương trình loyalty đổi điểm và quản lý khách hàng nâng cao. MVP chỉ ghi nhận quy tắc demo đã thống nhất nếu task được giao yêu cầu. |
| OS-06 | Cam kết vận hành production, SLA, tải lớn hoặc kiểm thử bảo mật/chứng nhận thanh toán.                                                                                 |

## 6. Giả định

| Mã   | Giả định                                                                                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A-01 | MVP phục vụ một cửa hàng và một danh mục sản phẩm mẫu.                                                                                                                               |
| A-02 | Khách cần đăng nhập trước khi tạo đơn; menu có thể xem trước khi đăng nhập.                                                                                                          |
| A-03 | Backend và database PostgreSQL là nguồn dữ liệu chuẩn; frontend không quyết định giá hoặc tồn kho cuối cùng.                                                                         |
| A-04 | Mỗi đơn dùng tiền Việt Nam đồng; giá lưu dưới dạng số theo quy ước của schema hiện hành.                                                                                             |
| A-05 | Mock gateway mô phỏng kết quả thành công/thất bại và callback; đây không phải bằng chứng giao dịch tiền thật.                                                                        |
| A-06 | Danh mục size, topping, mã khuyến mãi và quy tắc tính giá theo `docs/team-contract.md` là contract hiện hành; thay đổi phải được nhóm thống nhất.                                    |
| A-07 | Tồn kho được giữ/trừ cùng transaction khi tạo đơn. Cách giải phóng tồn khi đơn thanh toán thất bại hoặc bị hủy cần được nhóm xác nhận trước khi coi là quy tắc nghiệm thu cuối cùng. |

## 7. Ràng buộc

| Mã   | Ràng buộc                                                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C-01 | Công nghệ hiện tại: Next.js/React/TypeScript, NestJS/TypeScript, PostgreSQL/Prisma và Docker Compose.                                                  |
| C-02 | Backend chạy cổng 3001; frontend chạy cổng 3000 trong môi trường phát triển theo README.                                                               |
| C-03 | API tuân theo các hợp đồng và giá trị đã chốt trong `docs/team-contract.md`; không tự ý đổi schema, enum hoặc response mà không báo nhóm.              |
| C-04 | Request tạo đơn phải xác thực JWT; server phải tính lại giá và kiểm tra tồn kho.                                                                       |
| C-05 | Không đưa secret, mật khẩu, token hoặc thông tin thanh toán thật vào Git, tài liệu công khai hay bằng chứng assignment.                                |
| C-06 | Cần lưu lịch sử thay đổi có thể review: làm trên nhánh `docs/task-1-requirements`, commit có phạm vi rõ và mở PR để leader nghiệm thu trước khi merge. |
| C-07 | Nghiệm thu tuân thủ thứ tự: chỉ chấp nhận task sau khi tạo phẩm bắt buộc của task trước đã có trong kho mã nguồn và có lịch sử thay đổi rõ ràng.       |

## 8. Rủi ro ban đầu

| Rủi ro                                                                                  | Tác động                                                | Cách giảm thiểu                                                                 |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Quy tắc tồn kho khi tạo đơn, thanh toán lỗi, thử lại hoặc hủy chưa được mô tả đồng nhất | Mất tồn kho, bán vượt tồn hoặc không thể thử lại hợp lệ | Chốt một quy tắc xuyên suốt; thêm acceptance test cho giữ/trả tồn và retry.     |
| Mock payment bị hiểu nhầm là tích hợp thanh toán thật                                   | Demo sai kỳ vọng, xử lý sai dữ liệu nhạy cảm            | Ghi rõ mock gateway trong UI, tài liệu và demo; không nhận thông tin thẻ thật.  |
| Giá, size, topping giữa frontend và backend lệch nhau                                   | Sai tổng tiền hoặc test không ổn định                   | Backend là nguồn chuẩn; contract và test dùng chung bộ quy tắc.                 |
| Thay đổi API/schema không được thông báo giữa các nhánh                                 | Xung đột tích hợp, migration lỗi                        | Cập nhật contract, review PR và phối hợp trước thay đổi breaking.               |
| Mạng/Docker/database không sẵn sàng khi demo                                            | Không chạy được luồng e2e                               | Có hướng dẫn chạy local, seed dữ liệu và checklist kiểm tra dịch vụ trước demo. |

## 9. Tài liệu liên quan

- `docs/team-contract.md` — API, schema và quy tắc MVP đã thống nhất.
- `docs/parallel-work-plan.md` — phân công, mốc và quy tắc nghiệm thu.
- `docs/requirements/use-case-order-and-payment.md` — đặc tả UC trọng tâm.
