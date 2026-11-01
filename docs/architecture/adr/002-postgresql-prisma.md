# ADR 002: Sử dụng PostgreSQL và Prisma

## 1. Trạng thái

**Trạng thái:** Đề xuất lựa chọn.

Tài liệu này ghi lại quyết định lựa chọn PostgreSQL làm hệ quản trị cơ sở dữ liệu và Prisma làm công cụ ORM cho dự án BrewLite trong Assignment 2.

## 2. Bối cảnh

BrewLite là hệ thống đặt đồ uống có nhiều thành phần dữ liệu liên quan, bao gồm người dùng, sản phẩm, tồn kho, đơn hàng, thanh toán và khuyến mãi.

Các nghiệp vụ như tạo đơn hàng, cập nhật tồn kho và ghi nhận thanh toán cần được xử lý nhất quán nhằm hạn chế dữ liệu không hợp lệ.

Vì vậy, dự án cần một hệ quản trị cơ sở dữ liệu có khả năng quản lý dữ liệu quan hệ, hỗ trợ giao dịch và bảo đảm tính toàn vẹn dữ liệu. Đồng thời, nhóm cần một công cụ giúp Backend truy cập cơ sở dữ liệu và quản lý thay đổi cấu trúc dữ liệu có hệ thống.

## 3. Các phương án được xem xét

### Phương án 1: PostgreSQL kết hợp Prisma

PostgreSQL được sử dụng để lưu trữ dữ liệu. Prisma đóng vai trò ORM, hỗ trợ truy vấn dữ liệu và quản lý migration.

**Ưu điểm:**

* PostgreSQL hỗ trợ dữ liệu quan hệ, ràng buộc dữ liệu và giao dịch.
* Prisma cung cấp API truy vấn có kiểu dữ liệu, phù hợp với TypeScript.
* Migration giúp theo dõi lịch sử thay đổi cấu trúc cơ sở dữ liệu.
* Có thể kết hợp với NestJS để xây dựng lớp truy cập dữ liệu.

**Nhược điểm:**

* Nhóm cần tìm hiểu cách sử dụng Prisma và quy trình migration.
* Thay đổi schema cần được quản lý và kiểm thử cẩn thận.
* Một số truy vấn phức tạp có thể cần sử dụng truy vấn SQL phù hợp.

### Phương án 2: PostgreSQL kết hợp truy vấn SQL trực tiếp

Backend kết nối với PostgreSQL và sử dụng SQL trực tiếp để truy vấn dữ liệu.

**Ưu điểm:**

* Chủ động kiểm soát câu lệnh SQL.
* Có thể tối ưu trực tiếp các truy vấn theo nhu cầu.

**Nhược điểm:**

* Cần tự quản lý nhiều chi tiết khi truy vấn và ánh xạ dữ liệu.
* Việc quản lý kiểu dữ liệu và thay đổi schema cần được tổ chức riêng.
* Có thể làm tăng lượng mã xử lý cơ sở dữ liệu trong ứng dụng.

## 4. Quyết định

Nhóm lựa chọn **PostgreSQL làm hệ quản trị cơ sở dữ liệu và Prisma làm ORM** cho dự án BrewLite.

PostgreSQL chịu trách nhiệm lưu trữ dữ liệu nghiệp vụ. Prisma được sử dụng tại Backend để truy vấn dữ liệu và quản lý các thay đổi về cấu trúc cơ sở dữ liệu thông qua migration.

Các thay đổi schema cần được ghi nhận bằng migration có kiểm soát phiên bản để những thành viên trong nhóm có thể đồng bộ môi trường phát triển.

## 5. Lý do lựa chọn

### 5.1. PostgreSQL

PostgreSQL phù hợp với BrewLite vì hệ thống có các thực thể dữ liệu liên quan với nhau, chẳng hạn như sản phẩm, đơn hàng và thanh toán.

Cơ sở dữ liệu quan hệ giúp thể hiện mối quan hệ giữa các thực thể và hỗ trợ các ràng buộc nhằm hạn chế dữ liệu không hợp lệ.

Giao dịch cơ sở dữ liệu có thể được sử dụng khi cần thực hiện nhiều thao tác liên quan như một đơn vị công việc, nhằm bảo đảm tính nhất quán khi xảy ra lỗi.

### 5.2. Prisma

Prisma phù hợp với Backend sử dụng TypeScript vì cung cấp cơ chế truy vấn có kiểu dữ liệu và hỗ trợ làm việc với mô hình dữ liệu đã định nghĩa.

Prisma Migrate cho phép ghi nhận các thay đổi schema bằng các tệp migration. Nhờ đó, nhóm có thể xem xét, kiểm thử và áp dụng thay đổi theo một quy trình thống nhất.

Việc sử dụng Prisma cũng giúp tổ chức phần truy cập dữ liệu rõ ràng hơn trong Backend.

## 6. Quy tắc quản lý dữ liệu và migration

Để hạn chế lỗi và bảo đảm tính nhất quán, nhóm cần tuân thủ các quy tắc sau:

* Quản lý cấu trúc dữ liệu trong tệp schema của Prisma.
* Ghi nhận các thay đổi schema bằng migration.
* Đưa các tệp migration vào hệ thống quản lý phiên bản.
* Kiểm thử migration trước khi áp dụng lên môi trường dùng chung.
* Không tự ý sửa lịch sử migration đã được chia sẻ nếu chưa thống nhất với nhóm.
* Sử dụng giao dịch cơ sở dữ liệu cho các nghiệp vụ cần bảo đảm tính nguyên tử.
* Không đưa thông tin kết nối hoặc mật khẩu thực tế vào repository.

Các thao tác liên quan đến đơn hàng, tồn kho và thanh toán cần được thiết kế để tránh dữ liệu không nhất quán khi một bước xử lý thất bại.

## 7. Hệ quả

### Tích cực

* PostgreSQL hỗ trợ lưu trữ dữ liệu quan hệ và các ràng buộc toàn vẹn.
* Giao dịch giúp bảo vệ tính nhất quán của các thao tác liên quan.
* Prisma hỗ trợ truy vấn dữ liệu có kiểu và phù hợp với TypeScript.
* Migration giúp theo dõi lịch sử thay đổi schema.
* Quy trình truy cập dữ liệu dễ được tổ chức và kiểm thử.

### Tiêu cực

* Nhóm cần duy trì quy trình migration để tránh sai lệch schema giữa các môi trường.
* Thành viên cần hiểu cách sử dụng Prisma và xử lý các thay đổi cơ sở dữ liệu.
* Các truy vấn đặc biệt có thể cần kiến thức SQL bổ sung.
* Việc thay đổi cấu trúc dữ liệu có thể ảnh hưởng đến mã nguồn hiện có và cần được kiểm thử.

## 8. Kết luận

PostgreSQL kết hợp Prisma được lựa chọn nhằm đáp ứng nhu cầu quản lý dữ liệu quan hệ, hỗ trợ giao dịch và kiểm soát thay đổi schema của BrewLite.

Quyết định này hướng đến khả năng bảo trì, tính nhất quán dữ liệu và sự thuận tiện khi phát triển Backend bằng NestJS và TypeScript.