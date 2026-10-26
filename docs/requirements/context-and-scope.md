# BrewLite — Bối cảnh và phạm vi

**Phiên bản:** 1.1  
**Tài liệu:** Assignment 2 — Task 1.1: Bối cảnh, stakeholder và phạm vi

## 1. Vấn đề nghiệp vụ

Quy trình gọi đồ uống trực tiếp tại quầy khiến khách phải chờ nhân viên ghi nhận món. Khi cửa hàng đông khách, nhân viên có thể nhập sai sản phẩm, size, topping, số lượng hoặc tổng tiền. Việc cập nhật tồn kho và trạng thái đơn cũng khó nhất quán khi có nhiều yêu cầu cùng lúc. Khách hàng thiếu một nơi để xem lại đơn hàng và kết quả thanh toán.

BrewLite hỗ trợ khách xem menu, chọn tùy chọn, quản lý giỏ hàng, tạo đơn và thanh toán mô phỏng trên web. Backend kiểm tra dữ liệu đơn, tính giá, kiểm tra tồn kho và lưu trạng thái để khách có thể xem lịch sử đơn hàng.

## 2. Stakeholder

| Stakeholder                        | Vai trò / nhu cầu                        | Mục tiêu và kỳ vọng                                                                                                                                  |
| ---------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Khách hàng                         | Xem menu, chọn đồ uống và đặt đơn        | Xem giá và tình trạng sản phẩm; chọn size, topping, số lượng; sử dụng mã khuyến mãi hợp lệ; thanh toán mô phỏng; xem trạng thái và lịch sử đơn hàng. |
| Nhân viên quầy                     | Tiếp nhận và chuẩn bị đơn                | Nhận thông tin món, size, topping và số lượng chính xác; cập nhật trạng thái xử lý đơn theo quyền được cấp.                                          |
| Quản lý cửa hàng                   | Theo dõi sản phẩm, đơn hàng và tồn kho   | Có dữ liệu nhất quán để vận hành cửa hàng và đánh giá kết quả demo.                                                                                  |
| Giảng viên / khách hàng nghiệm thu | Đánh giá đồ án theo yêu cầu và kịch bản  | Kiểm tra được vấn đề nghiệp vụ, stakeholder, phạm vi, giả định, ràng buộc và rủi ro; chạy được demo với dữ liệu mẫu và thanh toán giả lập.           |
| Nhóm phát triển                    | Phân tích, xây dựng và kiểm thử hệ thống | Có phạm vi và quy tắc thống nhất để triển khai, kiểm thử và review.                                                                                  |
| Đơn vị thanh toán                  | Dịch vụ bên ngoài được mô phỏng          | Nhận yêu cầu thanh toán mô phỏng và trả kết quả thành công hoặc thất bại; không xử lý giao dịch tiền thật.                                           |

## 3. Phạm vi MVP (in-scope)

| Mã    | Phạm vi trong MVP                                                                                                                                                                                                                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IS-01 | Hiển thị menu và chi tiết sản phẩm mẫu, gồm tên, giá, hình ảnh, tình trạng tồn kho và các tùy chọn size/topping được hỗ trợ.                                                                                                                                                                                   |
| IS-02 | Khách hàng chọn size, topping và số lượng; thêm sản phẩm, sửa số lượng hoặc xóa sản phẩm khỏi giỏ hàng.                                                                                                                                                                                                        |
| IS-03 | Khách hàng đăng ký và đăng nhập; cần đăng nhập để tạo đơn và xem lịch sử đơn của tài khoản.                                                                                                                                                                                                                    |
| IS-04 | Backend kiểm tra dữ liệu đơn, lấy giá cơ bản từ database và tính giá theo size/topping. Hệ thống áp dụng mã khuyến mãi hợp lệ và ghi nhận điểm loyalty một lần cho đơn đủ điều kiện đã thanh toán thành công. Khách chưa dùng điểm loyalty để giảm tiền đơn hàng trong MVP.                                    |
| IS-05 | Backend kiểm tra tình trạng tồn kho trước khi chấp nhận đơn; từ chối tạo đơn nếu sản phẩm không đủ số lượng theo yêu cầu.                                                                                                                                                                                      |
| IS-06 | Thanh toán qua mock gateway bằng ví điện tử (`WALLET`) hoặc thẻ (`CARD`); tiếp nhận kết quả thành công/thất bại và xử lý callback lặp theo `Idempotency-Key`.                                                                                                                                                  |
| IS-07 | Khách hàng xem lịch sử và trạng thái đơn của tài khoản mình. Khách có thể hủy đơn `PENDING` hoặc `PAID`; đơn `PAYMENT_FAILED` có thể được thử thanh toán lại hoặc hủy. Nhân viên được cấp quyền có thể cập nhật trạng thái đơn theo các chuyển trạng thái hợp lệ. Hủy đơn không đồng nghĩa với hoàn tiền thật. |

## 4. Phạm vi mở rộng (Future Scope)

| Mã    | Tính năng mở rộng              | Mô tả                                                                              |
| ----- | ------------------------------ | ---------------------------------------------------------------------------------- |
| EX-01 | Cổng thanh toán thật           | Tích hợp VNPay, MoMo, ZaloPay hoặc ngân hàng.                                      |
| EX-02 | Ứng dụng di động               | Phát triển ứng dụng native cho khách hàng hoặc nhân viên giao hàng.                |
| EX-03 | Phân hạng thành viên           | Tạo các hạng thành viên và quyền lợi theo hạng.                                    |
| EX-04 | Nhiều chi nhánh                | Quản lý tồn kho, doanh thu và nhân sự theo từng cửa hàng.                          |
| EX-05 | Tích hợp POS/ERP               | Đồng bộ dữ liệu với hệ thống POS hoặc ERP bên ngoài.                               |
| EX-06 | Phân tích và gợi ý             | Phân tích hành vi mua hàng, gợi ý đồ uống và dự báo tồn kho.                       |
| EX-07 | Dùng điểm loyalty để giảm tiền | Cho phép khách dùng điểm đã tích lũy để giảm số tiền phải thanh toán cho đơn hàng. |
| EX-08 | Tìm kiếm/lọc lịch sử đơn       | Bổ sung tìm kiếm hoặc lọc lịch sử đơn hàng theo điều kiện phù hợp.                 |

## 5. Ngoài phạm vi MVP (out-of-scope)

| Mã    | Nội dung không thực hiện trong MVP                                                                                                                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OS-01 | Thu tiền thật, kết nối ngân hàng/ví thật hoặc lưu dữ liệu thanh toán thật.                                                                                                                                                       |
| OS-02 | Ứng dụng native iOS/Android, giao hàng, định vị hoặc theo dõi nhân viên giao hàng.                                                                                                                                               |
| OS-03 | Hệ thống quản trị cửa hàng đầy đủ như quản lý tài khoản và phân quyền nhân viên, báo cáo doanh thu nâng cao hoặc cấu hình menu qua giao diện quản trị. Việc nhân viên cập nhật trạng thái đơn theo quyền được cấp vẫn thuộc MVP. |
| OS-04 | Đồng bộ tồn kho với POS/ERP hoặc nhà cung cấp bên ngoài.                                                                                                                                                                         |
| OS-05 | Hóa đơn điện tử và hoàn tiền bằng giao dịch tiền thật.                                                                                                                                                                           |
| OS-06 | Cam kết vận hành production, SLA, tải lớn hoặc chứng nhận thanh toán.                                                                                                                                                            |

## 6. Giả định

| Mã   | Giả định                                                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------- |
| A-01 | MVP phục vụ một cửa hàng với bộ sản phẩm mẫu.                                                            |
| A-02 | Khách có thể xem menu trước khi đăng nhập; cần đăng nhập để tạo đơn và xem lịch sử đơn.                  |
| A-03 | Database là nguồn chuẩn cho giá cơ bản và tồn kho; backend kiểm tra dữ liệu và tính tổng tiền cuối cùng. |
| A-04 | Đơn hàng sử dụng Việt Nam đồng; giá được lưu theo quy ước của database hiện hành.                        |
| A-05 | Mock gateway chỉ mô phỏng giao dịch, không thu tiền thật.                                                |
| A-06 | Tồn kho được quản lý theo sản phẩm; MVP không tách tồn riêng theo size hoặc topping.                     |

## 7. Ràng buộc

| Mã   | Ràng buộc                                                                                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| C-01 | Công nghệ của hệ thống gồm Next.js cho frontend theo hướng mobile-first/PWA, NestJS cho backend và PostgreSQL cho database.               |
| C-02 | Môi trường chạy local sử dụng Docker Compose; backend và frontend dùng các cổng được hướng dẫn trong README.                              |
| C-03 | API tạo đơn và thanh toán yêu cầu JWT; backend chịu trách nhiệm xác thực dữ liệu, tính giá và kiểm tra tồn kho.                           |
| C-04 | Thanh toán trong phạm vi bài tập phải dùng dịch vụ mô phỏng; không nhận thông tin thanh toán thật.                                        |
| C-05 | Secret, mật khẩu, token và dữ liệu thanh toán thật không được đưa vào Git hoặc tài liệu công khai.                                        |
| C-06 | Cấu hình chạy và triển khai phải có hướng dẫn trong README và các biến môi trường cần thiết trong `.env.example`, không chứa secret thật. |

## 8. Rủi ro ban đầu

| Rủi ro                                                                        | Tác động                                                                  | Cách giảm thiểu                                                                                    |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Mock payment gateway có thể trả kết quả thất bại, chậm hoặc gửi lại callback. | Trạng thái thanh toán hoặc đơn hàng có thể không được xử lý như mong đợi. | Kiểm tra kết quả callback, xử lý yêu cầu lặp an toàn và kiểm thử cả nhánh thành công lẫn thất bại. |
| Quy tắc tính giá size/topping có thể khác nhau giữa giao diện và backend.     | Tổng tiền khách thấy có thể khác tổng tiền của đơn hàng.                  | Để backend tính tổng tiền cuối cùng và dùng chung bộ dữ liệu kiểm thử cho frontend, backend.       |
| Môi trường demo thiếu database, Docker hoặc cấu hình cần thiết.               | Không thể chạy và trình diễn luồng đặt hàng đầu cuối.                     | Chuẩn bị dữ liệu mẫu, hướng dẫn khởi động và kiểm tra môi trường trước buổi demo.                  |
