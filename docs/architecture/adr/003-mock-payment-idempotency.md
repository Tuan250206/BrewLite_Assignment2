# ADR 003: Sử dụng Mock Payment Gateway và cơ chế Idempotency

## 1. Trạng thái

**Trạng thái:** Đề xuất lựa chọn.

Tài liệu này ghi lại quyết định sử dụng Mock Payment Gateway để mô phỏng thanh toán và áp dụng cơ chế Idempotency nhằm hạn chế việc xử lý thanh toán trùng lặp trong BrewLite.

## 2. Bối cảnh

BrewLite hỗ trợ quy trình đặt hàng và thanh toán. Trong quá trình xử lý, hệ thống có thể gặp các tình huống như người dùng nhấn nút thanh toán nhiều lần, yêu cầu được gửi lại do lỗi mạng hoặc một thông báo kết quả thanh toán được chuyển đến nhiều lần.

Nếu Backend không kiểm soát các trường hợp này, hệ thống có thể tạo nhiều bản ghi thanh toán hoặc thực hiện lặp lại các tác động nghiệp vụ.

Đối với phạm vi phát triển và kiểm thử của Assignment 2, nhóm cần một phương án thanh toán có thể mô phỏng được các kết quả mà không phụ thuộc vào nhà cung cấp thanh toán thực tế.

Vì vậy, nhóm cần lựa chọn cách mô phỏng thanh toán và cơ chế kiểm soát yêu cầu lặp lại.

## 3. Các phương án được xem xét

### Phương án 1: Mock Payment Gateway kết hợp Idempotency

Sử dụng dịch vụ thanh toán giả lập và nhận diện các yêu cầu lặp lại bằng một khóa Idempotency Key.

**Ưu điểm:**

* Không cần kết nối nhà cung cấp thanh toán thật trong quá trình kiểm thử.
* Có thể mô phỏng các kết quả thanh toán khác nhau.
* Giúp kiểm thử luồng thành công, thất bại và thử lại.
* Hạn chế việc tạo các giao dịch trùng lặp khi nhận cùng một yêu cầu nhiều lần.

**Nhược điểm:**

* Không phản ánh đầy đủ hành vi của nhà cung cấp thanh toán thật.
* Cần quản lý khóa Idempotency và trạng thái giao dịch cẩn thận.
* Cần xử lý các yêu cầu đồng thời và các trường hợp lỗi giữa chừng.

### Phương án 2: Tích hợp trực tiếp nhà cung cấp thanh toán thật

Kết nối Backend với một nhà cung cấp thanh toán thực tế.

**Ưu điểm:**

* Phản ánh gần hơn quy trình thanh toán trong môi trường thực tế.
* Có thể sử dụng các cơ chế bảo mật và đối soát do nhà cung cấp hỗ trợ.

**Nhược điểm:**

* Cần cấu hình tài khoản, thông tin xác thực và môi trường thử nghiệm.
* Tăng độ phức tạp của việc phát triển và kiểm thử.
* Có thể phụ thuộc vào tính khả dụng của dịch vụ bên ngoài.

## 4. Quyết định

Nhóm lựa chọn **Mock Payment Gateway kết hợp cơ chế Idempotency** cho phạm vi phát triển và kiểm thử của BrewLite.

Mock Payment Gateway mô phỏng kết quả thanh toán. Backend chịu trách nhiệm kiểm tra yêu cầu, quản lý trạng thái giao dịch và cập nhật trạng thái đơn hàng theo quy tắc nghiệp vụ.

Idempotency Key được sử dụng để nhận diện các yêu cầu thanh toán lặp lại. Khi cùng một yêu cầu được gửi lại, hệ thống cần kiểm tra kết quả đã được ghi nhận trước đó và tránh tạo thêm giao dịch hoặc lặp lại tác động nghiệp vụ.

## 5. Luồng xử lý dự kiến

Quy trình thanh toán được định hướng như sau:

1. Frontend gửi yêu cầu thanh toán đến Backend.
2. Backend xác thực người dùng và kiểm tra thông tin đơn hàng.
3. Backend kiểm tra Idempotency Key và xác định yêu cầu có phải là yêu cầu đã được xử lý trước đó hay không.
4. Nếu là yêu cầu lặp lại đã được ghi nhận, Backend trả về kết quả phù hợp thay vì tạo một giao dịch mới.
5. Nếu là yêu cầu mới hợp lệ, Backend tạo hoặc cập nhật bản ghi thanh toán theo quy tắc nghiệp vụ.
6. Mock Payment Gateway mô phỏng kết quả thanh toán.
7. Backend kiểm tra kết quả và cập nhật trạng thái thanh toán, đơn hàng.
8. Frontend nhận kết quả và hiển thị thông báo cho người dùng.

Các bước cụ thể cần được điều chỉnh theo cách triển khai thực tế của Backend.

## 6. Quy tắc Idempotency

Để cơ chế Idempotency hoạt động đáng tin cậy, nhóm cần xem xét các quy tắc sau:

* Mỗi yêu cầu thanh toán cần có khóa nhận diện phù hợp.
* Khóa phải được kiểm tra và lưu trữ theo cách tránh xử lý đồng thời cùng một yêu cầu nhiều lần.
* Cùng một khóa và cùng nội dung yêu cầu không được tạo thêm giao dịch mới.
* Nếu cùng một khóa được sử dụng với nội dung yêu cầu khác nhau, Backend cần từ chối hoặc xử lý theo quy tắc lỗi đã xác định.
* Kết quả của yêu cầu đã được xử lý cần được lưu lại để có thể trả về khi yêu cầu được gửi lại.
* Việc cập nhật trạng thái thanh toán và đơn hàng cần tuân thủ các quy tắc chuyển trạng thái hợp lệ.

Idempotency không thay thế việc xác thực người dùng, kiểm tra quyền truy cập hoặc xác minh tính hợp lệ của giao dịch.

Nếu sử dụng webhook hoặc callback, Backend cần xác minh nguồn gửi và kiểm tra tính hợp lệ của thông báo trước khi cập nhật dữ liệu.

## 7. Hệ quả

### Tích cực

* Có thể kiểm thử quy trình thanh toán mà không cần nhà cung cấp thanh toán thật.
* Giảm nguy cơ xử lý lặp lại cùng một yêu cầu.
* Hỗ trợ kiểm thử tình huống gửi lại yêu cầu và lỗi mạng.
* Giúp tách biệt logic nghiệp vụ của ứng dụng với dịch vụ thanh toán bên ngoài.

### Tiêu cực

* Thanh toán giả lập không bảo đảm phản ánh đầy đủ các tình huống trong thực tế.
* Cần quản lý trạng thái giao dịch và khóa Idempotency một cách nhất quán.
* Cần kiểm thử các tình huống gửi yêu cầu đồng thời.
* Khi triển khai thực tế, hệ thống cần bổ sung tích hợp với nhà cung cấp thanh toán và các biện pháp bảo mật phù hợp.

## 8. Kết luận

Mock Payment Gateway phù hợp với nhu cầu phát triển và kiểm thử quy trình thanh toán của BrewLite trong phạm vi Assignment 2.

Kết hợp Idempotency giúp hạn chế giao dịch trùng lặp khi yêu cầu được gửi lại, đồng thời nâng cao độ tin cậy của quá trình xử lý đơn hàng và thanh toán.

Các quy tắc này cần được kiểm thử và điều chỉnh theo cách triển khai thực tế trước khi hệ thống được sử dụng trong môi trường production.
