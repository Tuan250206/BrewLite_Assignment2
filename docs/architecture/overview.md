# Tổng quan kiến trúc hệ thống BrewLite

## 1. Mục đích

Tài liệu này mô tả kiến trúc phần mềm của hệ thống BrewLite trong Assignment 2.

Nội dung được xây dựng dựa trên dự án BrewLite của Assignment 1 và các yêu cầu kiến trúc của Assignment 2. Tài liệu trình bày cấu trúc hệ thống, công nghệ sử dụng, các thành phần chính, luồng xử lý dữ liệu, những quyết định thiết kế quan trọng và các ưu điểm, hạn chế của kiến trúc.

Mục tiêu là xây dựng một hệ thống có cấu trúc rõ ràng, dễ bảo trì, dễ kiểm thử và đáp ứng các chức năng chính của ứng dụng đặt đồ uống.

## 2. Tổng quan kiến trúc

BrewLite sử dụng mô hình kiến trúc Client–Server, bao gồm giao diện người dùng (Frontend), máy chủ xử lý nghiệp vụ (Backend) và cơ sở dữ liệu.

Dự án được tổ chức theo mô hình Monorepo, trong đó mã nguồn của Frontend, Backend và tài liệu được quản lý trong cùng một repository.

Cấu trúc thư mục mục tiêu của dự án Assignment 2:

```text
BrewLite_Assignment2/
├── apps/
│   ├── web/                 # Giao diện người dùng Next.js
│   └── api/                 # Backend API sử dụng NestJS
├── docs/
│   └── architecture/
│       ├── adr/
│       └── overview.md
├── tests/
├── .env.example
├── docker-compose.yml
└── README.md
```

Kiến trúc hệ thống gồm các lớp chính:

* **Lớp giao diện (Presentation Layer):** Hiển thị sản phẩm, giỏ hàng và các chức năng đặt hàng cho người dùng.
* **Lớp nghiệp vụ (Application Layer):** Xử lý yêu cầu, kiểm tra dữ liệu, quản lý đơn hàng và phối hợp quá trình thanh toán.
* **Lớp dữ liệu (Data Layer):** Sử dụng PostgreSQL để lưu trữ dữ liệu và Prisma để truy cập cơ sở dữ liệu.
* **Lớp dịch vụ bên ngoài (External Service Layer):** Sử dụng Mock Payment Gateway để mô phỏng quá trình thanh toán.

Frontend giao tiếp với Backend thông qua HTTP REST API. Backend tiếp nhận yêu cầu, kiểm tra dữ liệu, xử lý nghiệp vụ, truy vấn cơ sở dữ liệu và trả kết quả về Frontend.

## 3. Công nghệ sử dụng

| Thành phần                     | Công nghệ                  | Vai trò                                              |
| ------------------------------ | -------------------------- | ---------------------------------------------------- |
| Frontend                       | Next.js, React, TypeScript | Xây dựng giao diện người dùng                        |
| Giao diện và tạo kiểu          | Tailwind CSS               | Thiết kế giao diện đáp ứng nhiều kích thước màn hình |
| Quản lý trạng thái phía Client | Zustand                    | Quản lý trạng thái giao diện và dữ liệu phía Client  |
| Quản lý dữ liệu từ API         | TanStack Query             | Quản lý trạng thái truy vấn và dữ liệu từ máy chủ    |
| Giao tiếp HTTP                 | Axios                      | Gửi yêu cầu từ Frontend đến Backend                  |
| Backend                        | NestJS, TypeScript         | Xử lý nghiệp vụ và cung cấp REST API                 |
| Cơ sở dữ liệu                  | PostgreSQL                 | Lưu trữ dữ liệu của hệ thống                         |
| ORM                            | Prisma                     | Truy cập dữ liệu và quản lý migration                |
| Xác thực                       | JWT, Passport, bcrypt      | Hỗ trợ xác thực và bảo vệ tài khoản                  |
| Thanh toán                     | Mock Payment Gateway       | Mô phỏng quá trình thanh toán                        |
| Môi trường phát triển          | Docker Compose             | Hỗ trợ khởi chạy các dịch vụ cần thiết               |

Các công nghệ trên được lựa chọn dựa trên dự án Assignment 1 và định hướng phát triển của Assignment 2.

Giao diện được định hướng thiết kế theo phương pháp Mobile-first, ưu tiên trải nghiệm trên thiết bị di động trước khi mở rộng sang máy tính.

Các tính năng PWA sẽ được triển khai nếu thuộc phạm vi yêu cầu và được hỗ trợ trong phiên bản cuối cùng của hệ thống.

## 4. Các thành phần chính

### 4.1. Frontend

Frontend được xây dựng bằng Next.js, React và TypeScript.

Các nhiệm vụ chính bao gồm:

* Hiển thị danh sách sản phẩm và thông tin chi tiết sản phẩm.
* Cho phép người dùng quản lý giỏ hàng.
* Thu thập thông tin cần thiết để tạo đơn hàng.
* Hiển thị trạng thái đơn hàng và kết quả thanh toán.
* Gửi yêu cầu đến Backend thông qua REST API.

Giao diện cần có khả năng hiển thị phù hợp trên điện thoại, máy tính bảng và máy tính.

Zustand được sử dụng để quản lý trạng thái phía Client. TanStack Query hỗ trợ quản lý dữ liệu nhận được từ API, trạng thái tải dữ liệu và lỗi khi gửi yêu cầu.

### 4.2. Backend

Backend sử dụng NestJS và TypeScript.

Hệ thống được tổ chức theo các module nghiệp vụ nhằm phân chia trách nhiệm và giúp mã nguồn dễ bảo trì.

Dựa trên dự án Assignment 1, các module nghiệp vụ chính bao gồm:

* **Authentication:** Xử lý xác thực người dùng và kiểm soát quyền truy cập.
* **Products:** Quản lý và cung cấp thông tin sản phẩm.
* **Inventory:** Quản lý các hoạt động liên quan đến tồn kho.
* **Orders:** Xử lý việc tạo đơn hàng và cập nhật trạng thái đơn hàng.
* **Payments:** Phối hợp xử lý yêu cầu thanh toán và kết quả thanh toán.
* **Promotions:** Xử lý chương trình khuyến mãi và giảm giá.

Backend chịu trách nhiệm kiểm tra dữ liệu đầu vào, thực thi các quy tắc nghiệp vụ, phối hợp truy cập cơ sở dữ liệu và trả kết quả phù hợp cho Frontend.

Việc chia module giúp hạn chế sự phụ thuộc không cần thiết giữa các chức năng và thuận tiện hơn khi phát triển, kiểm thử từng phần.

### 4.3. Cơ sở dữ liệu

PostgreSQL được sử dụng làm hệ quản trị cơ sở dữ liệu quan hệ cho BrewLite.

Prisma đóng vai trò là ORM, hỗ trợ Backend truy cập dữ liệu và quản lý các thay đổi của cấu trúc cơ sở dữ liệu thông qua migration.

Cơ sở dữ liệu lưu trữ các thông tin phục vụ hoạt động của hệ thống, chẳng hạn như sản phẩm, đơn hàng, thông tin thanh toán và các dữ liệu nghiệp vụ liên quan.

Các thay đổi về cấu trúc cơ sở dữ liệu cần được quản lý bằng các tệp migration có kiểm soát phiên bản, thay vì chỉnh sửa thủ công mà không có ghi nhận.

Các nghiệp vụ liên quan đến đơn hàng, thanh toán và tồn kho cần được kiểm tra cẩn thận để bảo đảm tính nhất quán của dữ liệu.

### 4.4. Dịch vụ thanh toán giả lập

Mock Payment Gateway được sử dụng để mô phỏng quá trình tương tác giữa BrewLite và một nhà cung cấp dịch vụ thanh toán bên ngoài.

Quy trình thanh toán dự kiến gồm các bước:

1. Frontend gửi yêu cầu tạo đơn hàng hoặc thanh toán đến Backend.
2. Backend kiểm tra yêu cầu và tạo hoặc truy xuất bản ghi thanh toán tương ứng.
3. Mock Payment Gateway mô phỏng kết quả thanh toán.
4. Backend kiểm tra kết quả và cập nhật trạng thái thanh toán, đơn hàng theo quy tắc nghiệp vụ.
5. Frontend hiển thị kết quả cho người dùng.

Hệ thống cần có cơ chế Idempotency để hạn chế việc một yêu cầu thanh toán bị xử lý nhiều lần do người dùng nhấn nút nhiều lần hoặc do hệ thống gửi lại yêu cầu khi xảy ra lỗi mạng.

Các yêu cầu gọi lại (callback hoặc webhook), nếu được sử dụng, cần được kiểm tra trước khi kết quả được chấp nhận.

## 5. Các quyết định thiết kế quan trọng

### 5.1. Tổ chức mã nguồn theo Monorepo

Frontend, Backend và tài liệu được quản lý trong cùng một repository.

Cách tổ chức này giúp các thành viên dễ dàng tìm kiếm mã nguồn, đối chiếu tài liệu, xem xét thay đổi và phối hợp phát triển.

Cấu trúc mục tiêu của Assignment 2 phân chia ứng dụng thành `apps/web` và `apps/api`, trong khi tài liệu được lưu trong thư mục `docs`.

### 5.2. Sử dụng PostgreSQL và Prisma

PostgreSQL được lựa chọn vì hệ thống có nhiều thực thể dữ liệu liên quan và cần bảo đảm tính nhất quán trong các nghiệp vụ như đơn hàng, thanh toán và tồn kho.

Prisma hỗ trợ truy cập dữ liệu theo cấu trúc rõ ràng và quản lý thay đổi cơ sở dữ liệu thông qua migration.

Sự kết hợp này giúp việc quản lý dữ liệu có hệ thống hơn, đồng thời hỗ trợ theo dõi và kiểm tra các thay đổi về cấu trúc cơ sở dữ liệu.

### 5.3. Chống xử lý thanh toán trùng lặp

Trong quá trình thanh toán, hệ thống có thể nhận được yêu cầu lặp lại do lỗi mạng, thao tác nhiều lần của người dùng hoặc cơ chế thử lại yêu cầu.

Idempotency Key được sử dụng để nhận diện các yêu cầu thanh toán lặp lại. Backend cần bảo đảm việc gửi lại cùng một yêu cầu không tạo ra các giao dịch trùng lặp hoặc thực hiện lặp lại các tác động nghiệp vụ.

Các thay đổi trạng thái đơn hàng và thanh toán phải được kiểm tra để tránh phát sinh trạng thái không hợp lệ.

Chi tiết các quyết định trên được trình bày trong những tài liệu ADR sau:

* [ADR 001: Tổ chức mã nguồn theo Monorepo](adr/001-monorepo.md)
* [ADR 002: Lựa chọn PostgreSQL và Prisma](adr/002-postgresql-prisma.md)
* [ADR 003: Thanh toán giả lập và chống xử lý trùng lặp](adr/003-mock-payment-idempotency.md)

## 6. Các vấn đề vận hành

### 6.1. Cấu hình môi trường

Các thông tin cấu hình của ứng dụng cần được quản lý thông qua biến môi trường thay vì ghi trực tiếp trong mã nguồn.

Tệp `.env.example` cần liệt kê các biến môi trường cần thiết nhưng không được chứa mật khẩu hoặc thông tin xác thực thực tế.

Các cấu hình có thể bao gồm:

* Thông tin kết nối cơ sở dữ liệu.
* Cổng chạy Backend và môi trường thực thi.
* Địa chỉ API của Backend mà Frontend sử dụng.
* Các cấu hình liên quan đến dịch vụ thanh toán.
* Khóa bí mật dùng để xác thực webhook, nếu có.

Các thông tin nhạy cảm không được đưa lên repository.

### 6.2. Ghi log và xử lý lỗi

Backend cần ghi nhận các sự kiện quan trọng và lỗi phát sinh trong quá trình xử lý để hỗ trợ việc theo dõi và khắc phục sự cố.

Log có thể bao gồm thông tin về lỗi yêu cầu, quá trình xử lý đơn hàng và các hoạt động thanh toán cần theo dõi.

Không ghi mật khẩu, access token, khóa bí mật hoặc các dữ liệu nhạy cảm khác vào log.

API cần trả về mã trạng thái HTTP phù hợp và thông tin lỗi có cấu trúc nhất quán để Frontend có thể xử lý.

### 6.3. Health Check

Backend cần cung cấp endpoint kiểm tra tình trạng hoạt động của hệ thống:

`GET /health`

Endpoint này dùng để kiểm tra Backend có đang hoạt động hay không. Nếu yêu cầu vận hành cần thiết, endpoint có thể kiểm tra thêm tình trạng kết nối đến các dịch vụ quan trọng như cơ sở dữ liệu.

Endpoint cần được triển khai và kiểm thử trước khi được xác nhận là đã hoạt động.

### 6.4. Quản lý migration

Các thay đổi về cấu trúc cơ sở dữ liệu cần được quản lý bằng các tệp Prisma migration.

Migration phải được xem xét và kiểm thử trước khi áp dụng lên môi trường dùng chung hoặc môi trường triển khai thực tế.

Các thao tác có khả năng xóa hoặc làm mất dữ liệu cần được thực hiện thận trọng.

### 6.5. Môi trường phát triển

Docker Compose có thể được sử dụng để khởi chạy PostgreSQL và các dịch vụ cần thiết cho môi trường phát triển.

Frontend và Backend có thể được phát triển, kiểm thử riêng biệt nhưng vẫn giao tiếp thông qua địa chỉ API đã được cấu hình.

## 7. Ưu điểm, hạn chế và đánh đổi kiến trúc

### 7.1. Ưu điểm

* **Tính mô-đun:** Phân chia Frontend và Backend giúp trách nhiệm của từng thành phần rõ ràng hơn.
* **Khả năng bảo trì:** Các module NestJS giúp tách biệt những nhóm chức năng nghiệp vụ.
* **Tính nhất quán dữ liệu:** PostgreSQL và giao dịch cơ sở dữ liệu hỗ trợ bảo vệ tính nhất quán trong các nghiệp vụ liên quan.
* **Quản lý thay đổi:** Prisma migration giúp theo dõi và kiểm soát các thay đổi của cơ sở dữ liệu.
* **Hỗ trợ cộng tác:** Monorepo giúp các thành viên dễ dàng truy cập mã nguồn và tài liệu của dự án.
* **Thuận tiện kiểm thử:** Mock Payment Gateway cho phép kiểm thử quy trình thanh toán mà không cần kết nối nhà cung cấp thanh toán thật.

### 7.2. Hạn chế

* **Xung đột khi cộng tác:** Nhiều thành viên chỉnh sửa cùng một tệp có thể dẫn đến xung đột khi hợp nhất mã nguồn.
* **Phụ thuộc vào cấu hình triển khai:** Monorepo không tự động bảo đảm Frontend và Backend có thể triển khai độc lập; cần cấu hình quy trình triển khai phù hợp.
* **Công việc vận hành:** Việc quản lý migration, biến môi trường và log cần được duy trì thường xuyên.
* **Giới hạn của thanh toán giả lập:** Mock Payment Gateway không thể mô phỏng đầy đủ độ tin cậy, bảo mật và các tình huống thực tế của nhà cung cấp thanh toán.
* **Độ phức tạp của Idempotency:** Cần xử lý cẩn thận các yêu cầu gửi lại và các yêu cầu đồng thời để tránh phát sinh giao dịch trùng lặp.

### 7.3. Đánh đổi trong thiết kế

Kiến trúc được định hướng ưu tiên sự đơn giản, khả năng bảo trì và khả năng kiểm thử thay vì xây dựng hệ thống microservices có độ phức tạp cao.

Với phạm vi hiện tại, Backend được tổ chức theo các module nghiệp vụ giúp mã nguồn rõ ràng mà không cần phát sinh thêm chi phí giao tiếp giữa nhiều dịch vụ độc lập.

Mock Payment Gateway phù hợp cho quá trình phát triển và kiểm thử. Tuy nhiên, nếu triển khai hệ thống thực tế, cần tích hợp nhà cung cấp thanh toán phù hợp và bổ sung các biện pháp bảo mật cần thiết.

## 8. Kết luận

Kiến trúc BrewLite được định hướng sử dụng Next.js cho Frontend, NestJS cho Backend, PostgreSQL cho cơ sở dữ liệu, Prisma để quản lý truy cập dữ liệu và Mock Payment Gateway để mô phỏng thanh toán.

Cấu trúc Monorepo hỗ trợ cộng tác, trong khi các module Backend giúp phân chia trách nhiệm nghiệp vụ.

Việc quản lý cấu hình bằng biến môi trường, ghi log, kiểm tra tình trạng hoạt động, quản lý migration và chống xử lý thanh toán trùng lặp là những yếu tố quan trọng nhằm cải thiện khả năng bảo trì và độ tin cậy của hệ thống.

Tài liệu kiến trúc cần được cập nhật theo quá trình triển khai Assignment 2 để phản ánh chính xác trạng thái thực tế của dự án.
