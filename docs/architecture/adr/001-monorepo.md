# ADR 001: Tổ chức mã nguồn theo mô hình Monorepo

## 1. Trạng thái

**Trạng thái:** Đã chấp nhận (Accepted).

Quyết định này đã được áp dụng trong repository BrewLite Assignment 2.

## 2. Bối cảnh

BrewLite gồm nhiều thành phần cần phối hợp, bao gồm Frontend, Backend, tài liệu kỹ thuật và các thành phần kiểm thử. Frontend được xây dựng bằng Next.js, React và TypeScript; Backend sử dụng NestJS và TypeScript. Hai thành phần giao tiếp thông qua REST API.

Nếu mỗi thành phần được lưu trong một repository riêng, nhóm phải quản lý nhiều nơi lưu trữ và phối hợp các thay đổi liên quan giữa Frontend, Backend và tài liệu.

Vì vậy, nhóm cần một cách tổ chức repository phù hợp với quy mô dự án và quy trình cộng tác.

## 3. Các phương án được xem xét

### Phương án 1: Monorepo

Quản lý Frontend, Backend, tài liệu và các thành phần liên quan trong cùng một repository.

Cấu trúc chính:

```text
BrewLite_Assignment2/
├── apps/
│   ├── web/
│   └── api/
├── docs/
├── tests/
├── .github/
├── docker-compose.yml
└── README.md
```

**Ưu điểm:**

- Mã nguồn và tài liệu được quản lý tập trung.
- Thành viên dễ theo dõi thay đổi của toàn bộ dự án.
- Thuận tiện khi cập nhật đồng thời Frontend, Backend và tài liệu liên quan.
- Thống nhất quy trình quản lý phiên bản và Pull Request.

**Nhược điểm:**

- Có thể phát sinh xung đột khi nhiều thành viên chỉnh sửa cùng một tệp.
- Repository có thể lớn hơn khi dự án mở rộng.
- Cần quy ước rõ ràng về thư mục, branch và quy trình hợp nhất mã nguồn.

### Phương án 2: Polyrepo

Tách Frontend, Backend và tài liệu thành các repository riêng biệt.

**Ưu điểm:**

- Mỗi thành phần có thể được quản lý và triển khai độc lập.
- Quyền truy cập và quy trình phát triển có thể được thiết lập riêng.

**Nhược điểm:**

- Cần quản lý nhiều repository.
- Phối hợp thay đổi giữa Frontend và Backend có thể phức tạp hơn.
- Tài liệu và mã nguồn có thể bị phân tán.

## 4. Quyết định

Nhóm lựa chọn mô hình **Monorepo** để quản lý các thành phần của BrewLite trong cùng một repository.

Các thư mục chính đang có trong repository:

- `apps/web`: Mã nguồn Frontend Next.js.
- `apps/api`: Mã nguồn Backend NestJS.
- `docs`: Tài liệu yêu cầu, thiết kế và kiến trúc.
- `tests`: Các thành phần và hướng dẫn kiểm thử.
- `.github/workflows`: Cấu hình quy trình CI/CD.
- `docker-compose.yml`: Cấu hình môi trường gồm PostgreSQL, API và Web.
- `README.md`: Hướng dẫn tổng quan về dự án.

## 5. Lý do lựa chọn

Monorepo phù hợp với quy mô BrewLite trong Assignment 2. Các thành viên có thể làm việc trên những branch riêng, sau đó push thay đổi và tạo Pull Request để nhóm xem xét.

Việc quản lý tập trung giúp nhóm đối chiếu tài liệu với mã nguồn, theo dõi lịch sử thay đổi và phối hợp các thay đổi có ảnh hưởng đến nhiều thành phần.

## 6. Hệ quả

### Tích cực

- Tập trung mã nguồn và tài liệu trong một repository.
- Thuận tiện cho cộng tác và review thay đổi.
- Dễ theo dõi các thay đổi liên quan giữa Frontend và Backend.
- Thống nhất cách tổ chức dự án và quản lý phiên bản.

### Tiêu cực

- Thành viên cần tuân thủ quy tắc branch và Pull Request để hạn chế xung đột.
- Cần duy trì cấu trúc thư mục rõ ràng khi dự án phát triển.
- Việc triển khai độc lập từng thành phần vẫn cần cấu hình phù hợp.

## 7. Kết luận

Mô hình Monorepo đã được áp dụng nhằm đơn giản hóa việc quản lý mã nguồn, hỗ trợ cộng tác và giúp tài liệu gắn liền với quá trình phát triển BrewLite. Nếu quy mô hệ thống thay đổi đáng kể, nhóm có thể đánh giá lại cách tổ chức repository dựa trên nhu cầu thực tế.