# Task 1.3 – Đặc tả use case: Đặt và thanh toán đơn hàng

**Mã use case:** UC-01  
**Tên:** Đặt và thanh toán đơn hàng  
**Phạm vi:** Hệ thống BrewLite  
**Mục tiêu:** Khách hàng đặt các sản phẩm trong giỏ và nhận kết quả thanh toán mô phỏng.

## 1. Tác nhân

| Tác nhân             | Vai trò                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| Khách hàng           | Chọn sản phẩm, gửi yêu cầu đặt hàng, cung cấp mã khuyến mãi nếu có và nhận kết quả. |
| Mock payment gateway | Nhận yêu cầu thanh toán mô phỏng và trả kết quả thành công hoặc thất bại.           |

Frontend, backend và cơ sở dữ liệu là các thành phần nội bộ của BrewLite, không phải tác nhân của use case này. Nhân viên quầy không tham gia use case trọng tâm này.

## 2. Sự kiện kích hoạt

Khách hàng đã đăng nhập và chọn **Đặt hàng/Thanh toán** từ giỏ hàng.

## 3. Tiền điều kiện

1. Hệ thống BrewLite và các dịch vụ cần thiết đang hoạt động.
2. Khách hàng đã đăng nhập.
3. Giỏ hàng có ít nhất một sản phẩm.

## 4. Hậu điều kiện

### Thành công

- Đơn hàng được tạo với trạng thái **PAID**.
- Tồn kho phản ánh số lượng sản phẩm đã đặt.
- Điểm thưởng được cộng cho đơn hàng thành công đúng một lần.
- Khách hàng nhận được thông tin xác nhận đơn hàng.

### Thất bại hoặc bị hủy

- Đơn hàng không ở trạng thái **PAID**.
- Số lượng hàng được giữ cho đơn hàng được hoàn lại đúng một lần nếu đơn bị hủy hoặc thanh toán thất bại.
- Điểm thưởng không được cộng.

## 5. Luồng chính

| Bước | Tác nhân             | Hành động / phản hồi                                                                              |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------- |
| 1    | Khách hàng           | Chọn đặt hàng từ giỏ hàng.                                                                        |
| 2    | BrewLite             | Hiển thị thông tin đơn hàng, gồm sản phẩm, kích cỡ, topping, số lượng và tổng tiền tạm tính.      |
| 3    | Khách hàng           | Kiểm tra đơn hàng và xác nhận tiếp tục.                                                           |
| 4    | BrewLite             | Kiểm tra thông tin đơn hàng, giá và số lượng tồn kho.                                             |
| 5    | BrewLite             | Tạo đơn hàng ở trạng thái **PENDING** và giữ số lượng hàng cần thiết cho đơn đó.                  |
| 6    | BrewLite             | Gửi yêu cầu thanh toán mô phỏng đến Mock payment gateway.                                         |
| 7    | Mock payment gateway | Trả kết quả thanh toán thành công.                                                                |
| 8    | BrewLite             | Cập nhật đơn hàng thành **PAID**, xác nhận số lượng hàng đã đặt và cộng điểm thưởng đúng một lần. |
| 9    | BrewLite             | Hiển thị xác nhận đặt hàng cho khách hàng.                                                        |

## 6. Luồng thay thế

### A1 – Khách hàng áp dụng mã khuyến mãi

1. Ở bước 3, khách hàng nhập mã khuyến mãi.
2. BrewLite kiểm tra mã và điều kiện áp dụng.
3. Nếu mã hợp lệ, BrewLite cập nhật số tiền phải thanh toán.
4. Luồng tiếp tục ở bước 4.

Nếu mã không hợp lệ hoặc không đủ điều kiện, BrewLite thông báo lý do và cho phép khách hàng sửa hoặc bỏ mã để tiếp tục.

### A2 – Khách hàng không áp dụng mã khuyến mãi

Khách hàng tiếp tục mà không nhập mã. BrewLite giữ nguyên tổng tiền và luồng tiếp tục ở bước 4.

## 7. Luồng ngoại lệ

### E1 – Phiên đăng nhập hết hạn

Nếu thông tin xác thực hết hạn khi khách hàng gửi yêu cầu, BrewLite từ chối yêu cầu và yêu cầu khách hàng đăng nhập lại. Không tạo đơn hàng.

### E2 – Sản phẩm hoặc lựa chọn không còn hợp lệ

Nếu sản phẩm không còn được bán, hoặc kích cỡ/topping đã chọn không hợp lệ, BrewLite thông báo nội dung cần sửa và không tạo đơn hàng.

### E3 – Tồn kho không đủ

Nếu một hay nhiều sản phẩm không đủ số lượng, BrewLite thông báo sản phẩm bị thiếu hàng và không tạo đơn hàng **PAID**.

### E4 – Thanh toán mô phỏng thất bại

Nếu Mock payment gateway trả về thất bại, BrewLite đánh dấu đơn hàng là **FAILED**, hoàn lại số lượng hàng đã giữ đúng một lần và thông báo kết quả cho khách hàng.

### E5 – Không nhận được kết quả thanh toán

Nếu BrewLite chưa nhận được kết quả từ Mock payment gateway, đơn hàng giữ trạng thái **PENDING** trong 15 phút sau 15 phút BrewLite chuyển đơn sang **FAILED** và hoàn lại số lượng giữ đúng 1 lần. Trong thời gian chờ khách hàng không nhận được điểm thưởng.

### E6 – Khách hàng rời khỏi trang khi đơn còn PENDING

Nếu khách hàng đóng trang hoặc rời khỏi quy trình sau khi đơn đã được tạo nhưng trước khi có kết quả thanh toán, đơn hàng vẫn ở trạng thái **PENDING** 15 phút. Khi nhận được kết quả thanh toán sau đó, BrewLite cập nhật đơn theo kết quả đó. Nếu đơn bị hủy hoặc hết hạn BrewLite đơn hàng chuyển trạng thái thành **FAILED** hoàn lại số lượng đã giữ đúng một lần.

### E7 – Khách hàng hủy đơn PENDING

Nếu khách hàng hủy đơn khi đơn vẫn ở trạng thái **PENDING**, BrewLite chuyển đơn sang **CANCELLED** và hoàn lại số lượng đã giữ đúng một lần. Nếu thanh toán đã thành công trước khi yêu cầu hủy được xử lý, việc hủy không được thực hiện theo luồng này.

## 8. Quy tắc nghiệp vụ và giới hạn phạm vi

- Thanh toán trong use case này là **mô phỏng**, không xử lý giao dịch tiền thật.
- Mã khuyến mãi chỉ được áp dụng nếu hợp lệ và đáp ứng điều kiện chương trình.
- Điểm thưởng chỉ được cộng cho đơn **PAID**, mỗi đơn đúng một lần.
- Đơn **PENDING**, **FAILED** hoặc **CANCELLED** không được cộng điểm.
- Use case không mô tả nghiệp vụ nhân viên quầy xử lý đơn.

## 9. Liên kết yêu cầu

> Các mã dưới đây là mã tạm để lập liên kết. Cần thay hoặc đối chiếu với mã trong SRS chính thức của nhóm.

| Mã tạm          | Yêu cầu liên quan                                                             |
| --------------- | ----------------------------------------------------------------------------- |
| FR-ORDER-01     | Khách hàng đã đăng nhập có thể gửi đơn hàng từ giỏ hàng không rỗng.           |
| FR-ORDER-02     | Hệ thống kiểm tra sản phẩm, lựa chọn và tồn kho trước khi chấp nhận đơn.      |
| FR-ORDER-03     | Hệ thống tạo đơn và theo dõi các trạng thái PENDING, PAID, FAILED, CANCELLED. |
| FR-PAY-01       | Hệ thống gửi yêu cầu và nhận kết quả từ Mock payment gateway.                 |
| FR-PROMO-01     | Khách hàng có thể nhập mã khuyến mãi; hệ thống kiểm tra điều kiện áp dụng.    |
| FR-LOYALTY-01   | Hệ thống cộng điểm cho đơn đã thanh toán thành công, đúng một lần.            |
| FR-INVENTORY-01 | Hệ thống giữ và hoàn lại số lượng hàng theo kết quả hoặc việc hủy đơn.        |

## 10. Tiêu chí chấp nhận

1. Khách chưa đăng nhập không thể gửi yêu cầu đặt hàng; hệ thống yêu cầu đăng nhập.
2. Khách đã đăng nhập nhưng giỏ hàng rỗng không thể tạo đơn.
3. Nếu số lượng tồn không đủ, hệ thống báo sản phẩm thiếu hàng và không tạo đơn.
4. Với sản phẩm hợp lệ và đủ hàng, hệ thống tạo đơn **PENDING** trước khi nhận kết quả thanh toán.
5. Khi Mock payment gateway trả thành công, đơn chuyển sang **PAID** và khách hàng được xác nhận.
6. Khi Mock payment gateway trả thất bại, đơn chuyển sang **FAILED**, không cộng điểm và số lượng đã giữ được hoàn lại một lần.
7. Khách có thể hủy đơn **PENDING**; đơn chuyển sang **CANCELLED** và số lượng đã giữ được hoàn lại một lần.
8. Nếu khách rời trang trong lúc đơn **PENDING**, trạng thái đơn không tự đổi thành **PAID** hoặc **CANCELLED**; hệ thống xử lý khi có kết quả thanh toán hoặc theo quy tắc hết hạn.
9. Mã khuyến mãi hợp lệ làm tổng tiền thay đổi theo điều kiện của chương trình; mã không hợp lệ không được áp dụng và hệ thống thông báo lý do.
10. Một đơn **PAID** chỉ được cộng điểm thưởng một lần, kể cả khi kết quả thanh toán được gửi lại.

## 11. Ngoài phạm vi

- Thanh toán bằng cổng thanh toán thật hoặc xử lý hoàn tiền thật.
- Nhân viên quầy tạo hoặc chỉnh sửa đơn trong use case này.
- Các nghiệp vụ quản trị cửa hàng không liên quan trực tiếp đến việc khách đặt và thanh toán đơn.
