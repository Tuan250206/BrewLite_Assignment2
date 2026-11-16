# ADR 003: Sử dụng Mock Payment Gateway và cơ chế Idempotency

## 1. Trạng thái

**Trạng thái:** Đã chấp nhận (Accepted).

MockGateway và cơ chế Idempotency-Key đã được triển khai trong Backend BrewLite Assignment 2.

## 2. Bối cảnh

BrewLite hỗ trợ quy trình đặt hàng và thanh toán. Trong quá trình xử lý, người dùng có thể gửi lại yêu cầu do nhấn nút nhiều lần hoặc do lỗi mạng. Nếu Backend không kiểm soát yêu cầu lặp, hệ thống có thể tạo nhiều bản ghi thanh toán hoặc lặp lại tác động nghiệp vụ.

Trong phạm vi Assignment 2, nhóm cần mô phỏng kết quả thanh toán mà không phụ thuộc vào nhà cung cấp thanh toán thực tế. Đồng thời, Backend cần nhận diện các yêu cầu thanh toán đã được ghi nhận.

## 3. Các phương án được xem xét

### Phương án 1: Mock Payment Gateway nội bộ kết hợp Idempotency-Key

Sử dụng module MockGateway trong Backend để mô phỏng kết quả thanh toán. Backend nhận khóa `Idempotency-Key` và lưu khóa này cùng bản ghi Payment.

**Ưu điểm:**

- Không cần kết nối nhà cung cấp thanh toán thật trong quá trình phát triển và kiểm thử.
- Có thể mô phỏng kết quả thành công hoặc thất bại.
- Khóa duy nhất trong cơ sở dữ liệu giúp nhận diện khóa đã được sử dụng.
- Giảm nguy cơ tạo nhiều bản ghi Payment với cùng một khóa.

**Nhược điểm:**

- Không phản ánh đầy đủ hành vi của nhà cung cấp thanh toán thật.
- Cần quản lý khóa và trạng thái giao dịch cẩn thận.
- Cần kiểm thử các tình huống đồng thời và lỗi giữa các bước xử lý.

### Phương án 2: Tích hợp trực tiếp nhà cung cấp thanh toán thật

Kết nối Backend với một nhà cung cấp thanh toán thực tế.

**Ưu điểm:**

- Phản ánh gần hơn quy trình thanh toán trong môi trường thực tế.
- Có thể sử dụng các cơ chế bảo mật và đối soát do nhà cung cấp hỗ trợ.

**Nhược điểm:**

- Cần tài khoản, thông tin xác thực và môi trường thử nghiệm.
- Tăng độ phức tạp phát triển và kiểm thử.
- Phụ thuộc vào tính khả dụng của dịch vụ bên ngoài.

## 4. Quyết định

Nhóm lựa chọn **MockGateway nội bộ kết hợp Idempotency-Key** cho phạm vi phát triển và kiểm thử của BrewLite.

MockGateway được tổ chức thành NestJS module gồm controller và service. Endpoint `POST /mock-gateway/pay` tiếp nhận yêu cầu giả lập. `MockGatewayService` trả về `FAILED` khi `simulateFail` là `true`, ngược lại trả về `SUCCESS`.

Đây là module nội bộ của Backend, không phải tích hợp với một cổng thanh toán bên ngoài. Trong mã nguồn hiện tại, `PaymentsService` gọi endpoint MockGateway bằng HTTP POST tới địa chỉ localhost và cổng Backend đang cấu hình.

## 5. Luồng xử lý hiện tại

Quy trình tạo thanh toán trong mã nguồn được thực hiện như sau:

1. Client gửi yêu cầu `POST /payments` kèm header `Idempotency-Key` và dữ liệu thanh toán.
2. `PaymentsController` yêu cầu người dùng đã xác thực thông qua `JwtAuthGuard`.
3. `PaymentsService` kiểm tra khóa không được để trống và không dài quá 255 ký tự.
4. Backend tìm Payment theo `idempotencyKey`. Nếu khóa đã tồn tại và thuộc cùng đơn hàng/người dùng, Backend trả lại thông tin Payment đã lưu. Nếu khóa thuộc giao dịch khác, Backend trả lỗi xung đột.
5. Với khóa mới, Backend mở Prisma transaction, kiểm tra đơn hàng thuộc người dùng và trạng thái đơn hàng có cho phép thanh toán hay không.
6. `PaymentsService` gọi `POST /mock-gateway/pay` để mô phỏng kết quả thanh toán.
7. Nếu kết quả thành công, Backend kiểm tra tồn kho và giảm số lượng tồn kho trong transaction. Nếu không đủ tồn kho, thao tác transaction bị từ chối.
8. Backend tạo bản ghi Payment, cập nhật trạng thái Order thành `PAID` hoặc `PAYMENT_FAILED`, sau đó trả kết quả về Client.

## 6. Quy tắc Idempotency và phạm vi hiện tại

Các cơ chế có trong mã nguồn:

- Client gửi khóa thông qua HTTP header `Idempotency-Key`.
- Backend từ chối khóa rỗng và khóa dài hơn 255 ký tự.
- Trường `Payment.idempotencyKey` được khai báo `@unique` trong Prisma schema.
- Backend kiểm tra khóa đã tồn tại trước khi xử lý yêu cầu mới.
- Nếu khóa đã tồn tại cho cùng đơn hàng và người dùng, Backend trả thông tin Payment đã ghi nhận.
- Nếu khóa đã được dùng cho đơn hàng khác hoặc người dùng khác, Backend trả lỗi xung đột.
- Khi gặp lỗi unique constraint `P2002` do cạnh tranh tạo bản ghi, Backend truy vấn lại Payment theo khóa và xử lý kết quả nếu bản ghi đã được tạo.

**Giới hạn cần lưu ý:** Việc kiểm tra khóa hiện đối chiếu đơn hàng và người dùng; mã nguồn chưa đối chiếu toàn bộ payload (ví dụ phương thức thanh toán) với payload ban đầu. Ngoài ra, lời gọi MockGateway được thực hiện trong khi transaction đang mở. Cần kiểm thử tình huống gateway đã trả kết quả nhưng transaction thất bại, cũng như các yêu cầu đồng thời, trước khi khẳng định cơ chế bảo đảm exactly-once trong mọi tình huống. Tài liệu chỉ khẳng định mục tiêu hạn chế xử lý trùng lặp và ngăn tạo Payment trùng khóa.

Webhook/callback từ nhà cung cấp thanh toán bên ngoài **không áp dụng trong phạm vi triển khai hiện tại**, vì MockGateway đang được gọi trực tiếp bởi Backend và không có luồng webhook được thể hiện trong mã nguồn đã rà soát.

## 7. Hệ quả

### Tích cực

- Có thể kiểm thử quy trình thanh toán mà không cần nhà cung cấp thanh toán thật.
- Có thể mô phỏng thanh toán thành công và thất bại thông qua `simulateFail`.
- Khóa unique trong PostgreSQL giúp ngăn tạo nhiều Payment có cùng Idempotency-Key.
- Hệ thống có thể trả lại thông tin Payment đã được ghi nhận khi nhận lại cùng khóa và cùng đơn hàng/người dùng.

### Tiêu cực

- Thanh toán giả lập không phản ánh đầy đủ các tình huống thực tế của nhà cung cấp thanh toán.
- Cần quản lý trạng thái giao dịch và khóa Idempotency nhất quán.
- Cần kiểm thử kỹ các trường hợp đồng thời và lỗi giữa lời gọi gateway với transaction cơ sở dữ liệu.
- Khi triển khai thực tế, cần tích hợp nhà cung cấp thanh toán phù hợp, xác minh kết quả và bổ sung biện pháp bảo mật/đối soát.

## 8. Kết luận

MockGateway nội bộ và Idempotency-Key đã được áp dụng trong Backend BrewLite Assignment 2. MockGateway mô phỏng kết quả thanh toán; PaymentsService kiểm tra khóa, ghi nhận Payment và cập nhật trạng thái đơn hàng trong transaction.

Quyết định này phù hợp với phạm vi phát triển và kiểm thử của dự án. Nếu triển khai thanh toán thực tế, nhóm cần đánh giá lại luồng tích hợp, xử lý callback/webhook và các yêu cầu bảo mật của nhà cung cấp.