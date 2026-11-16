# ADR 002: Sử dụng PostgreSQL và Prisma

## 1. Trạng thái

**Trạng thái:** Đã chấp nhận (Accepted).

Quyết định này đã được áp dụng trong Backend BrewLite Assignment 2.

## 2. Bối cảnh

BrewLite là hệ thống đặt đồ uống có nhiều thực thể dữ liệu liên quan, bao gồm người dùng, sản phẩm, đơn hàng, dòng sản phẩm trong đơn hàng, thanh toán, khuyến mãi và giao dịch điểm tích lũy.

Các nghiệp vụ như tạo đơn hàng, ghi nhận thanh toán và cập nhật tồn kho cần thao tác trên dữ liệu có quan hệ. Vì vậy, dự án cần hệ quản trị cơ sở dữ liệu quan hệ có hỗ trợ ràng buộc dữ liệu và transaction. Backend đồng thời cần công cụ truy cập dữ liệu và quản lý thay đổi schema.

## 3. Các phương án được xem xét

### Phương án 1: PostgreSQL kết hợp Prisma

PostgreSQL được sử dụng để lưu trữ dữ liệu. Prisma đóng vai trò ORM, hỗ trợ truy vấn dữ liệu và quản lý migration.

**Ưu điểm:**

- PostgreSQL hỗ trợ dữ liệu quan hệ, ràng buộc dữ liệu và transaction.
- Prisma cung cấp API truy vấn có kiểu dữ liệu, phù hợp với TypeScript.
- Migration giúp theo dõi lịch sử thay đổi cấu trúc cơ sở dữ liệu.
- Có thể tích hợp với NestJS để xây dựng lớp truy cập dữ liệu.

**Nhược điểm:**

- Nhóm cần nắm quy trình sử dụng Prisma và migration.
- Thay đổi schema cần được quản lý và kiểm thử cẩn thận.
- Một số truy vấn phức tạp có thể cần SQL bổ sung.

### Phương án 2: PostgreSQL kết hợp truy vấn SQL trực tiếp

Backend kết nối với PostgreSQL và sử dụng SQL trực tiếp để truy vấn dữ liệu.

**Ưu điểm:**

- Chủ động kiểm soát câu lệnh SQL.
- Có thể tối ưu trực tiếp truy vấn theo nhu cầu.

**Nhược điểm:**

- Cần tự quản lý nhiều chi tiết truy vấn và ánh xạ dữ liệu.
- Việc quản lý kiểu dữ liệu và thay đổi schema cần được tổ chức riêng.
- Có thể làm tăng lượng mã xử lý cơ sở dữ liệu trong ứng dụng.

## 4. Quyết định

Nhóm lựa chọn **PostgreSQL làm hệ quản trị cơ sở dữ liệu và Prisma làm ORM** cho BrewLite.

Bằng chứng triển khai trong repository:

- `apps/api/prisma/schema.prisma` khai báo datasource `provider = "postgresql"`.
- Backend sử dụng `PrismaService` để truy cập cơ sở dữ liệu.
- Repository có migration khởi tạo trong `apps/api/prisma/migrations/`.
- `docker-compose.yml` khai báo dịch vụ `postgres` sử dụng image `postgres:16`.

## 5. Lý do lựa chọn

### 5.1. PostgreSQL

PostgreSQL phù hợp với BrewLite vì hệ thống có các thực thể dữ liệu liên quan như User, Product, Order, OrderItem và Payment.

Cơ sở dữ liệu quan hệ giúp thể hiện mối quan hệ giữa các thực thể và hỗ trợ ràng buộc dữ liệu. Transaction được sử dụng trong các nghiệp vụ cần thực hiện nhiều thao tác liên quan như một đơn vị công việc.

### 5.2. Prisma

Prisma phù hợp với Backend sử dụng TypeScript vì cung cấp cơ chế truy vấn có kiểu dữ liệu dựa trên schema đã định nghĩa.

Prisma Migrate cho phép ghi nhận thay đổi schema bằng các tệp migration. Các tệp này được lưu trong repository để nhóm có thể xem xét và đồng bộ thay đổi cơ sở dữ liệu giữa các môi trường.

## 6. Quy tắc quản lý dữ liệu và migration

Nhóm cần tuân thủ các quy tắc sau:

- Quản lý cấu trúc dữ liệu trong `apps/api/prisma/schema.prisma`.
- Ghi nhận thay đổi schema bằng Prisma migration.
- Đưa các tệp migration vào hệ thống quản lý phiên bản.
- Kiểm thử migration trước khi áp dụng lên môi trường dùng chung.
- Không tự ý sửa lịch sử migration đã được chia sẻ nếu chưa thống nhất với nhóm.
- Sử dụng transaction cho nghiệp vụ cần bảo đảm tính nguyên tử.
- Không đưa thông tin kết nối hoặc mật khẩu thực tế vào repository.

Trong mã nguồn hiện tại, `OrdersService` và `PaymentsService` sử dụng Prisma transaction. `PaymentsService` cấu hình mức cô lập `Serializable` cho transaction tạo thanh toán. Khi thanh toán thành công, tồn kho được giảm trong transaction thanh toán.

## 7. Hệ quả

### Tích cực

- PostgreSQL hỗ trợ lưu trữ dữ liệu quan hệ và ràng buộc toàn vẹn.
- Transaction hỗ trợ bảo vệ tính nhất quán của các thao tác liên quan.
- Prisma hỗ trợ truy vấn dữ liệu có kiểu và phù hợp với TypeScript.
- Migration giúp theo dõi lịch sử thay đổi schema.
- Lớp truy cập dữ liệu có thể được tổ chức tập trung thông qua PrismaService.

### Tiêu cực

- Nhóm cần duy trì quy trình migration để tránh sai lệch schema giữa các môi trường.
- Thành viên cần hiểu cách sử dụng Prisma và xử lý thay đổi cơ sở dữ liệu.
- Một số truy vấn đặc biệt có thể cần kiến thức SQL bổ sung.
- Thay đổi cấu trúc dữ liệu có thể ảnh hưởng đến mã nguồn hiện có và cần được kiểm thử.

## 8. Kết luận

PostgreSQL kết hợp Prisma đã được áp dụng trong BrewLite Assignment 2 để quản lý dữ liệu quan hệ, hỗ trợ transaction và kiểm soát thay đổi schema. Quyết định này phù hợp với Backend NestJS và TypeScript của dự án.