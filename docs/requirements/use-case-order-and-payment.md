Task 1.3 – Đặc tả use case: Đặt và thanh toán đơn hàng
Mã use case: UC-01
Tên: Đặt và thanh toán đơn hàng
Phạm vi: Hệ thống BrewLite
Mục tiêu: Khách hàng đặt sản phẩm trong giỏ hàng và nhận kết quả thanh toán mô phỏng.

1. Tác nhân
Tác nhân	Vai trò
Khách hàng	Khởi tạo đặt hàng, chọn các tùy chọn thanh toán, và nhận kết quả.
Mock payment gateway	Nhận yêu cầu thanh toán mô phỏng và trả kết quả thành công hoặc thất bại.
2. Sự kiện kích hoạt
Khách hàng đã đăng nhập và tiến hành thanh toán từ giỏ hàng.

3. Tiền điều kiện
Hệ thống BrewLite và các dịch vụ cần thiết đang hoạt động.
Khách hàng đã đăng nhập.
Giỏ hàng có ít nhất một sản phẩm.
4. Hậu điều kiện
Thành công
Đơn hàng được ghi nhận với trạng thái PAID.
Kết quả thanh toán được lưu và khách hàng nhận được xác nhận đơn hàng.
Tồn kho phản ánh số lượng sản phẩm đã đặt.

Thanh toán thất bại
Đơn hàng chuyển sang PAYMENT_FAILED và không ở trạng thái PAID.
Kết quả thanh toán thất bại được lưu lại (một bản ghi Payment trạng thái FAILED).
Tồn kho không bị trừ.
Khách hàng nhận thông báo thất bại và có thể thử thanh toán lại (với Idempotency-Key mới) hoặc hủy đơn.

Đơn bị hủy
Đơn hàng chuyển sang CANCELLED và không ở trạng thái PAID.
Tồn kho không bị trừ, nên không cần hoàn lại.

5. Luồng chính
Bước	Luồng xử lý
1	Khách hàng chọn tiến hành thanh toán từ giỏ hàng.
2	BrewLite hiển thị sản phẩm, tùy chọn, số lượng và tổng tiền dự kiến.
3	Khách hàng kiểm tra thông tin và xác nhận tiếp tục.
4	BrewLite kiểm tra phiên đăng nhập, giỏ hàng, sản phẩm, tùy chọn và số lượng khả dụng.
5	BrewLite tính tổng tiền, tạo đơn ở trạng thái PENDING.
6	BrewLite gửi yêu cầu thanh toán mô phỏng đến Mock payment gateway.
7	Mock payment gateway trả kết quả thanh toán thành công.
8	BrewLite ghi nhận kết quả, chuyển đơn sang PAID và trừ tồn kho.
9	BrewLite hiển thị kết quả thanh toán và thông tin xác nhận đơn hàng cho khách hàng.
6. Luồng thay thế
Khách hàng hủy đơn khi đơn ở trạng thái PAYMENT_FAILED.
Khách hàng gửi yêu cầu hủy đơn.
BrewLite kiểm tra đơn vẫn ở trạng thái PAYMENT_FAILED.
BrewLite chuyển đơn sang CANCELLED.
BrewLite thông báo kết quả hủy cho khách hàng.
Nếu thanh toán đã được xác nhận thành công trước khi yêu cầu hủy được xử lý, BrewLite không hủy đơn theo nhánh này và hiển thị trạng thái hiện tại.

7. Luồng ngoại lệ
E1 – Sản phẩm hoặc tùy chọn không còn hợp lệ
Nếu sản phẩm không còn được bán hoặc tùy chọn đã chọn không hợp lệ, BrewLite thông báo nội dung cần sửa và không tạo đơn hàng.

E2 – Tồn kho không đủ
Nếu số lượng trong giỏ vượt quá số lượng khả dụng, BrewLite thông báo sản phẩm không đủ hàng, giữ nguyên giỏ hàng và thông tin giá đang hiển thị, đồng thời không tạo đơn hàng. Ví dụ: khách yêu cầu 20 sản phẩm nhưng chỉ còn 10 sản phẩm khả dụng.

E3 – Thanh toán mô phỏng thất bại
Nếu Mock payment gateway trả kết quả thất bại, BrewLite chuyển đơn sang PAYMENT_FAILED và thông báo kết quả. Khách hàng có thể thử thanh toán lại hoặc hủy đơn theo trạng thái hiện tại.

E4– Khách hàng rời trang khi đơn còn PENDING
Nếu khách đóng trang hoặc rời khỏi quy trình thanh toán khi đơn còn PENDING, BrewLite tự động chuyển đơn sang CANCELLED mà khách không cần thao tác hủy. Tồn kho không bị trừ nên không cần hoàn lại.

E5 – Đảm bảo tính Idempotency (Yêu cầu trùng lặp)
Nếu BrewLite nhận lại yêu cầu xác nhận thanh toán cho đơn hàng đã xử lý xong (do click đúp hoặc gửi lại request), hệ thống chỉ trả về kết quả thành công mà không trừ kho hay thay đổi dữ liệu lần thứ hai.

E6 – Khách hàng hủy đơn không còn ở PAYMENT_FAILED
Nếu đơn đã được thanh toán hoặc không còn trạng thái PAYMENT_FAILED, BrewLite từ chối yêu cầu hủy theo luồng này và hiển thị trạng thái hiện tại.

8. Quy tắc nghiệp vụ và giới hạn phạm vi
Thanh toán trong use case này là mô phỏng, không xử lý giao dịch tiền thật.
Khách hàng chỉ được hủy đơn theo nhánh A1 khi đơn vẫn PAYMENT_FAILED.
Use case này không mô tả quy trình nhân viên xử lý đơn.
9. Liên kết yêu cầu
Mã yêu cầu	Nội dung liên quan
FR-03	Giỏ hàng phải có sản phẩm và thông tin đơn hàng hợp lệ trước khi đặt.
FR-05	Khách hàng phải đăng nhập; API được bảo vệ từ chối request chưa xác thực.
FR-06	BrewLite kiểm tra dữ liệu và tình trạng khả dụng trước khi tạo đơn.
FR-07	BrewLite gửi yêu cầu đến dịch vụ thanh toán mô phỏng, lưu và thông báo kết quả thanh toán.
FR-09	Khách hàng có thể hủy đơn khi đơn ở trạng thái PAYMENT_FAILED.
NFR-01	Request lỗi hoặc quá thời gian phải trả mã HTTP và thông báo lỗi phù hợp.
NFR-02	Áp dụng xác thực và bảo vệ đơn hàng của khách; cập nhật tự động theo kết quả thanh toán hợp lệ không phải thao tác đổi trạng thái thủ công của nhân viên.
NFR-03 về health check và NFR-04 về triển khai áp dụng ở cấp hệ thống, không phải các bước riêng của use case này.

10. Tiêu chí chấp nhận
Khách hàng chưa đăng nhập không thể gửi yêu cầu đặt hàng; API được bảo vệ trả 401.
Giỏ hàng rỗng hoặc dữ liệu sản phẩm/tùy chọn không hợp lệ không tạo được đơn hàng.
Nếu giỏ yêu cầu 20 sản phẩm nhưng chỉ còn 10, BrewLite báo thiếu hàng, giữ nguyên giỏ và giá đang hiển thị, đồng thời không tạo đơn.
Với giỏ hàng hợp lệ và đủ hàng, đơn được tạo ở trạng thái PENDING trước khi nhận kết quả thanh toán.
Khi Mock payment gateway trả kết quả thành công hợp lệ, đơn chuyển sang PAID và khách hàng nhận xác nhận.
Khách hủy đơn khi còn PAYMENT_FAILED thì đơn chuyển sang CANCELLED.
Nếu khách rời trang khi đơn còn PENDING, việc rời trang tự hủy đơn.
Idempotency không làm phát sinh việc xử lý nghiệp vụ lần thứ hai.
Khách hàng không truy cập được dữ liệu đơn hàng của tài khoản khác.
11. Ngoài phạm vi
Kết nối cổng thanh toán thật hoặc xử lý giao dịch tiền thật.
Nhân viên quầy tạo hoặc chỉnh sửa đơn trong use case này.
Các nghiệp vụ quản lý trạng thái đơn của nhân viên.