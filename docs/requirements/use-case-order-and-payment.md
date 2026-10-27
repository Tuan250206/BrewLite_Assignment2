# Task 1.3 – Đặc tả use case: Đặt và thanh toán đơn hàng

**Mã use case:** UC-01  
**Tên:** Đặt và thanh toán đơn hàng  
**Phạm vi:** Hệ thống BrewLite  
**Mục tiêu:** Khách hàng đặt sản phẩm trong giỏ hàng và nhận kết quả thanh toán mô phỏng.

## 1. Tác nhân

| Tác nhân             | Vai trò                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| Khách hàng           | Khởi tạo đặt hàng, chọn các tùy chọn thanh toán, và nhận kết quả.         |
| Mock payment gateway | Nhận yêu cầu thanh toán mô phỏng và trả kết quả thành công hoặc thất bại. |

Frontend, backend và cơ sở dữ liệu là các thành phần nội bộ của BrewLite, không phải tác nhân. Nhân viên không tham gia use case trọng tâm này.

Theo sơ đồ use case của lead, **Xử lý thanh toán mô phỏng** được include trong use case này. Các use case **Áp mã khuyến mãi**, **Đổi điểm giảm giá**, **Tích điểm thưởng** và **Hủy đơn** là các nhánh `<<extend>>`.

## 2. Sự kiện kích hoạt

Khách hàng đã đăng nhập và chọn **Đặt hàng/Thanh toán** từ giỏ hàng.

## 3. Tiền điều kiện

1. Hệ thống BrewLite và các dịch vụ cần thiết đang hoạt động.
2. Khách hàng đã đăng nhập.
3. Giỏ hàng có ít nhất một sản phẩm.

## 4. Hậu điều kiện

### Thành công

- Đơn hàng được ghi nhận với trạng thái **PAID**.
- Kết quả thanh toán được lưu và khách hàng nhận được xác nhận đơn hàng.
- Tồn kho phản ánh số lượng sản phẩm đã đặt.

### Thanh toán thất bại hoặc đơn bị hủy

- Đơn hàng không ở trạng thái **PAID**; trạng thái tương ứng là **PAYMENT_FAILED** hoặc **CANCELLED**.
- Số lượng đã giữ cho đơn được hoàn lại đúng một lần khi đơn thất bại hoặc bị hủy.

## 5. Luồng chính

| Bước | Luồng xử lý                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------ |
| 1    | Khách hàng chọn **Đặt hàng/Thanh toán** từ giỏ hàng.                                             |
| 2    | BrewLite hiển thị sản phẩm, tùy chọn, số lượng và tổng tiền dự kiến.                             |
| 3    | Khách hàng kiểm tra thông tin và xác nhận tiếp tục.                                              |
| 4    | BrewLite kiểm tra phiên đăng nhập, giỏ hàng, sản phẩm, tùy chọn và số lượng khả dụng.            |
| 5    | BrewLite tính tổng tiền, tạo đơn ở trạng thái **PENDING** và ghi nhận số lượng hàng cần cho đơn. |
| 6    | BrewLite gửi yêu cầu thanh toán mô phỏng đến Mock payment gateway.                               |
| 7    | Mock payment gateway trả kết quả thanh toán thành công.                                          |
| 8    | BrewLite ghi nhận kết quả, chuyển đơn sang **PAID**.                                             |
| 9    | BrewLite hiển thị kết quả thanh toán và thông tin xác nhận đơn hàng cho khách hàng.              |

## 6. Luồng thay thế

### A1 – Khách hàng hủy đơn khi đơn còn PENDING

1. Khách hàng gửi yêu cầu hủy đơn.
2. BrewLite kiểm tra đơn vẫn ở trạng thái **PENDING**.
3. BrewLite chuyển đơn sang **CANCELLED** và hoàn lại số lượng đã giữ đúng một lần.
4. BrewLite thông báo kết quả hủy cho khách hàng.

Nếu thanh toán đã được xác nhận thành công trước khi yêu cầu hủy được xử lý, BrewLite không hủy đơn theo nhánh này và hiển thị trạng thái hiện tại.

## 7. Luồng ngoại lệ

### E1 – Phiên đăng nhập hết hạn

Nếu JWT hết hạn khi khách hàng gửi yêu cầu, BrewLite từ chối request với mã **401**, yêu cầu khách hàng đăng nhập lại và không tạo đơn hàng.

### E2 – Sản phẩm hoặc tùy chọn không còn hợp lệ

Nếu sản phẩm không còn được bán hoặc tùy chọn đã chọn không hợp lệ, BrewLite thông báo nội dung cần sửa và không tạo đơn hàng.

### E3 – Tồn kho không đủ

Nếu số lượng trong giỏ vượt quá số lượng khả dụng, BrewLite thông báo sản phẩm không đủ hàng, giữ nguyên giỏ hàng và thông tin giá đang hiển thị, đồng thời không tạo đơn hàng. Ví dụ: khách yêu cầu 20 sản phẩm nhưng chỉ còn 10 sản phẩm khả dụng.

### E4 – Thanh toán mô phỏng thất bại

Nếu Mock payment gateway trả kết quả thất bại, BrewLite chuyển đơn sang **PAYMENT_FAILED** và thông báo kết quả. Khách hàng có thể thử thanh toán lại hoặc hủy đơn theo trạng thái hiện tại.

### E5 – Giao dịch thanh toán hết hạn

Giao dịch mô phỏng có thời hạn 15 phút. Nếu khách hàng xác nhận thanh toán sau thời hạn này, BrewLite xử lý kết quả là thất bại và không chuyển đơn sang **PAID**.

### E6 – Khách hàng rời trang khi đơn còn PENDING

Việc đóng trang hoặc rời khỏi quy trình không tự hủy đơn và không làm đơn chuyển sang **PAID**. Đơn giữ trạng thái **PENDING** cho đến khi BrewLite nhận và xác thực kết quả thanh toán hoặc xử lý theo trạng thái hết hạn.

### E7 – Kết quả thanh toán không khớp giao dịch

Nếu BrewLite không tìm thấy giao dịch tương ứng, số tiền trong kết quả thanh toán không khớp, hoặc đơn không còn ở trạng thái PENDING, hệ thống không ghi nhận kết quả đó và không chuyển đơn sang PAID. BrewLite giữ nguyên trạng thái đơn hiện tại và thông báo giao dịch không thể xác nhận.

### E8 – Webhook được gửi lại

Nếu BrewLite nhận lại webhook có cùng kết quả đã được xử lý, hệ thống ghi nhận đây là yêu cầu lặp và không thực hiện tác động nghiệp vụ lần thứ hai.

### E9 – Khách hàng hủy đơn không còn ở PENDING

Nếu đơn đã được thanh toán hoặc không còn trạng thái **PENDING**, BrewLite từ chối yêu cầu hủy theo luồng này và hiển thị trạng thái hiện tại.

### 8. Quy tắc nghiệp vụ và giới hạn phạm vi

- Thanh toán trong use case này là **mô phỏng**, không xử lý giao dịch tiền thật.
- Khách hàng chỉ được hủy đơn theo nhánh A1 khi đơn vẫn **PENDING**.
- Use case này không mô tả quy trình nhân viên xử lý đơn.

## 9. Liên kết yêu cầu

| Mã yêu cầu | Nội dung liên quan                                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-03      | Giỏ hàng phải có sản phẩm và thông tin đơn hàng hợp lệ trước khi đặt.                                                                                     |
| FR-04      | Khách hàng phải đăng nhập; API được bảo vệ từ chối request chưa xác thực.                                                                                 |
| FR-05      | BrewLite kiểm tra dữ liệu và tình trạng khả dụng trước khi tạo đơn.                                                                                       |
| FR-06      | BrewLite gửi yêu cầu đến dịch vụ thanh toán mô phỏng và nhận kết quả.                                                                                     |
| FR-07      | BrewLite lưu và thông báo kết quả thanh toán.                                                                                                             |
| NFR-01     | Request lỗi hoặc quá thời gian phải trả mã HTTP và thông báo lỗi phù hợp.                                                                                 |
| NFR-02     | Áp dụng xác thực và bảo vệ đơn hàng của khách; cập nhật tự động theo kết quả thanh toán hợp lệ không phải thao tác đổi trạng thái thủ công của nhân viên. |
| NFR-05     | Giao diện luồng đặt và thanh toán hoạt động trên các trình duyệt được yêu cầu và hiển thị đúng ở chiều rộng 360 px.                                       |

NFR-03 về health check và NFR-04 về triển khai áp dụng ở cấp hệ thống, không phải các bước riêng của use case này.

## 10. Tiêu chí chấp nhận

1. Khách hàng chưa đăng nhập không thể gửi yêu cầu đặt hàng; API được bảo vệ trả **401**.
2. Giỏ hàng rỗng hoặc dữ liệu sản phẩm/tùy chọn không hợp lệ không tạo được đơn hàng.
3. Nếu giỏ yêu cầu 20 sản phẩm nhưng chỉ còn 10, BrewLite báo thiếu hàng, giữ nguyên giỏ và giá đang hiển thị, đồng thời không tạo đơn.
4. Với giỏ hàng hợp lệ và đủ hàng, đơn được tạo ở trạng thái **PENDING** trước khi nhận kết quả thanh toán.
5. Khi Mock payment gateway trả kết quả thành công hợp lệ, đơn chuyển sang **PAID** và khách hàng nhận xác nhận.
6. Khách hủy đơn khi còn **PENDING** thì đơn chuyển sang **CANCELLED** và số lượng đã giữ được hoàn lại đúng một lần.
7. Nếu khách rời trang khi đơn còn **PENDING**, việc rời trang không tự hủy đơn hoặc xác nhận thanh toán.
8. Webhook lặp không làm phát sinh việc xử lý nghiệp vụ lần thứ hai.
9. Khách hàng không truy cập được dữ liệu đơn hàng của tài khoản khác.
10. Giao diện luồng chính hiển thị đúng trên Chrome, Edge, Firefox, Safari bản mới và ở chiều rộng 360 px.

## 11. Ngoài phạm vi

- Kết nối cổng thanh toán thật hoặc xử lý giao dịch tiền thật.
- Nhân viên quầy tạo hoặc chỉnh sửa đơn trong use case này.
- Các nghiệp vụ quản lý trạng thái đơn của nhân viên.
- Áp dụng mã khuyến mãi và đổi điểm để giảm giá và tích điểm thưởng; xem xét trong phạm vi mở rộng.
