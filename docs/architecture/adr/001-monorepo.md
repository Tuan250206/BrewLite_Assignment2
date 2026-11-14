# ADR 001: Tổ chức mã nguồn theo mô hình Monorepo

## 1. Trạng thái

**Trạng thái:** Đề xuất lựa chọn.

Quyết định này được đưa ra nhằm thống nhất cách tổ chức mã nguồn và tài liệu cho dự án BrewLite trong Assignment 2.

## 2. Bối cảnh

BrewLite gồm nhiều thành phần, trong đó có Frontend, Backend, tài liệu kỹ thuật và các thành phần phục vụ kiểm thử.

Frontend sử dụng Next.js, React và TypeScript. Backend sử dụng NestJS và TypeScript. Hai thành phần cần phối hợp thông qua REST API để thực hiện các chức năng như xem sản phẩm, quản lý giỏ hàng, đặt hàng và thanh toán.

Nếu mã nguồn được lưu trữ tại nhiều repository riêng biệt, việc quản lý phiên bản, theo dõi thay đổi và phối hợp giữa các thành viên có thể phức tạp hơn.

Vì vậy, nhóm cần lựa chọn phương án tổ chức repository phù hợp với quy mô dự án và cách làm việc chung.

## 3. Các phương án được xem xét

### Phương án 1: Monorepo

Quản lý Frontend, Backend, tài liệu và các thành phần liên quan trong cùng một repository.

Cấu trúc dự kiến:

```text
BrewLite_Assignment2/
├── apps/
│   ├── web/
│   └── api/
├── docs/
├── tests/
├── docker-compose.yml
└── README.md
```

**Ưu điểm:**

* Mã nguồn và tài liệu được quản lý tập trung.
* Các thành viên dễ dàng theo dõi thay đổi của toàn bộ dự án.
* Thuận tiện khi cập nhật đồng thời Frontend, Backend và tài liệu liên quan.
* Giúp nhóm thống nhất quy trình quản lý phiên bản.

**Nhược điểm:**

* Có thể phát sinh xung đột khi nhiều thành viên chỉnh sửa cùng một tệp.
* Repository có thể trở nên lớn hơn khi dự án mở rộng.
* Cần quy ước rõ ràng về thư mục, branch và quy trình hợp nhất mã nguồn.

### Phương án 2: Polyrepo

Tách Frontend, Backend và tài liệu thành các repository riêng biệt.

**Ưu điểm:**

* Mỗi thành phần có thể được quản lý và triển khai độc lập.
* Quyền truy cập và quy trình phát triển có thể được thiết lập riêng cho từng repository.

**Nhược điểm:**

* Cần quản lý nhiều repository.
* Việc phối hợp các thay đổi liên quan giữa Frontend và Backend có thể phức tạp hơn.
* Tài liệu và mã nguồn có thể bị phân tán.

## 4. Quyết định

Nhóm lựa chọn mô hình **Monorepo** để quản lý các thành phần của BrewLite trong cùng một repository.

Cấu trúc mục tiêu gồm:

* `apps/web`: Mã nguồn Frontend.
* `apps/api`: Mã nguồn Backend.
* `docs`: Tài liệu yêu cầu, kiến trúc và các quyết định thiết kế.
* `tests`: Các thành phần kiểm thử.
* `docker-compose.yml`: Cấu hình môi trường phát triển bằng Docker Compose.
* `README.md`: Hướng dẫn tổng quan về dự án.

Cấu trúc thư mục có thể được điều chỉnh khi có yêu cầu mới, nhưng cần bảo đảm sự nhất quán giữa mã nguồn, tài liệu và quy trình làm việc của nhóm.

## 5. Lý do lựa chọn

Monorepo phù hợp với phạm vi và quy mô của BrewLite trong Assignment 2.

Các thành viên có thể làm việc trên những branch riêng, sau đó push thay đổi và tạo Pull Request để nhóm xem xét.

Việc quản lý tập trung giúp dễ dàng đối chiếu tài liệu với mã nguồn và theo dõi lịch sử thay đổi.

Ngoài ra, Frontend và Backend có mối liên hệ thông qua REST API. Việc đặt chúng trong cùng repository giúp nhóm thuận tiện hơn khi kiểm tra những thay đổi có ảnh hưởng đến cả hai thành phần.

## 6. Hệ quả

### Tích cực

* Tập trung mã nguồn và tài liệu trong một repository.
* Thuận tiện cho việc cộng tác và xem xét thay đổi.
* Dễ theo dõi các thay đổi liên quan giữa Frontend và Backend.
* Thống nhất cách tổ chức dự án và quản lý phiên bản.

### Tiêu cực

* Các thành viên cần tuân thủ quy tắc làm việc với branch và Pull Request để hạn chế xung đột.
* Cần duy trì cấu trúc thư mục rõ ràng khi dự án phát triển.
* Việc triển khai độc lập từng thành phần cần được cấu hình riêng nếu có yêu cầu.

## 7. Kết luận

Mô hình Monorepo được lựa chọn nhằm đơn giản hóa việc quản lý mã nguồn, hỗ trợ cộng tác và giúp tài liệu luôn gắn liền với quá trình phát triển BrewLite.

Quyết định này phù hợp với quy mô hiện tại của dự án. Nếu hệ thống mở rộng đáng kể trong tương lai, nhóm có thể đánh giá lại cách tổ chức repository dựa trên nhu cầu thực tế.
