# Tổng quan kiến trúc hệ thống BrewLite

## 1. Mục đích

Tài liệu này mô tả kiến trúc và các công nghệ đang được sử dụng trong BrewLite Assignment 2. Nội dung được đối chiếu với mã nguồn trong repository tại thời điểm rà soát, bao gồm ứng dụng Frontend, Backend, cấu hình cơ sở dữ liệu và các thành phần hỗ trợ vận hành.

Tài liệu phân biệt giữa chức năng đã có trong mã nguồn và định hướng có thể phát triển trong tương lai, tránh mô tả một tính năng là đã triển khai khi chưa có bằng chứng trong repository.

## 2. Tổng quan kiến trúc

BrewLite sử dụng mô hình Client–Server. Frontend được xây dựng bằng Next.js, Backend cung cấp REST API bằng NestJS và dữ liệu được lưu trữ trong PostgreSQL thông qua Prisma ORM.

Repository được tổ chức theo mô hình Monorepo. Các thành phần chính gồm:

```text
BrewLite_Assignment2/
├── apps/
│   ├── web/                 # Frontend Next.js
│   └── api/                 # Backend NestJS
├── docs/                    # Tài liệu yêu cầu, thiết kế và kiến trúc
├── tests/                   # Tài liệu và các thành phần kiểm thử
├── .github/workflows/       # Quy trình CI/CD
├── docker-compose.yml       # Cấu hình PostgreSQL, API và Web
└── README.md
```

Các lớp chính:

- **Presentation Layer:** Frontend Next.js hiển thị giao diện và nhận thao tác của người dùng.
- **Application Layer:** Backend NestJS tiếp nhận REST API, xác thực, kiểm tra dữ liệu và xử lý nghiệp vụ.
- **Data Access Layer:** Prisma ORM cung cấp khả năng truy cập dữ liệu và làm việc với PostgreSQL.
- **Database Layer:** PostgreSQL lưu trữ người dùng, sản phẩm, đơn hàng, thanh toán và dữ liệu liên quan.

Frontend giao tiếp với Backend qua HTTP REST API. Backend sử dụng Prisma để truy vấn và cập nhật PostgreSQL.

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Frontend framework | Next.js 16, React 19, TypeScript | Xây dựng ứng dụng giao diện người dùng |
| Giao diện | Tailwind CSS 4 | Tạo kiểu và xây dựng giao diện responsive |
| Biểu tượng | lucide-react | Cung cấp các biểu tượng giao diện |
| Quản lý trạng thái Client | Zustand | Quản lý trạng thái phía Client; giỏ hàng sử dụng middleware `persist` để lưu trạng thái |
| Giao tiếp HTTP | Fetch API (Web API) | Gửi yêu cầu từ Frontend đến Backend |
| Backend framework | NestJS 12, TypeScript | Xây dựng REST API theo module |
| Kiểm tra dữ liệu | class-validator, class-transformer, NestJS ValidationPipe | Kiểm tra và chuyển đổi dữ liệu đầu vào |
| Tài liệu API | Swagger (`@nestjs/swagger`) | Tạo tài liệu API tại đường dẫn `/swagger` |
| Xác thực | JWT, Passport, bcrypt | Xác thực và bảo vệ các API cần đăng nhập |
| Cơ sở dữ liệu | PostgreSQL 16 (trong Docker Compose) | Lưu trữ dữ liệu quan hệ |
| ORM và migration | Prisma 6 | Truy vấn dữ liệu và quản lý migration |
| Thanh toán giả lập | MockGateway module nội bộ | Mô phỏng kết quả thanh toán |
| Kiểm soát yêu cầu lặp | Idempotency-Key và ràng buộc unique trong PostgreSQL | Nhận diện khóa thanh toán đã được sử dụng |
| Môi trường chạy | Docker Compose | Khởi chạy PostgreSQL, API và Web |

**Lưu ý về thư viện:** Axios và TanStack Query có khai báo trong `apps/web/package.json`, nhưng trong mã nguồn ứng dụng được rà soát không tìm thấy chỗ sử dụng Axios, `useQuery` hoặc `QueryClientProvider`. Vì vậy, tài liệu không mô tả chúng là công cụ đang được sử dụng trong luồng ứng dụng. Các yêu cầu HTTP trong mã nguồn được thực hiện bằng Fetch API.

## 4. Các thành phần chính

### 4.1. Frontend

Frontend nằm trong `apps/web`, sử dụng Next.js, React và TypeScript.

Các trách nhiệm chính:

- Hiển thị danh sách và thông tin sản phẩm.
- Hỗ trợ người dùng thao tác với giỏ hàng.
- Gửi yêu cầu đến Backend để thực hiện các chức năng của ứng dụng.
- Hiển thị thông tin đơn hàng và kết quả thanh toán.

Zustand được sử dụng để quản lý trạng thái Client. Ví dụ, `cartStore.ts` sử dụng `persist` với khóa lưu trữ `brewlite-cart` để duy trì dữ liệu giỏ hàng ở phía trình duyệt.

Các yêu cầu HTTP trong mã nguồn Frontend được thực hiện bằng Fetch API.

Giao diện sử dụng Tailwind CSS và được thiết kế để hiển thị trên các kích thước màn hình khác nhau. Tuy nhiên, trong repository được rà soát chưa thấy Web App Manifest hoặc Service Worker. Vì vậy, PWA chưa được xác nhận là đã triển khai; đây chỉ có thể được xem là định hướng nếu nhóm tiếp tục phát triển.

### 4.2. Backend

Backend nằm trong `apps/api`, được xây dựng bằng NestJS và TypeScript. Các module được khai báo trong `apps/api/src/app.module.ts` gồm:

- **PrismaModule:** Cung cấp PrismaService để các module truy cập cơ sở dữ liệu.
- **ProductsModule:** Xử lý API và nghiệp vụ liên quan đến sản phẩm.
- **AuthModule:** Xử lý đăng ký, đăng nhập và xác thực.
- **OrdersModule:** Xử lý tạo, truy vấn, hủy và các thao tác liên quan đến đơn hàng.
- **PaymentsModule:** Tiếp nhận yêu cầu thanh toán, kiểm tra Idempotency-Key và cập nhật trạng thái thanh toán/đơn hàng.
- **HealthModule:** Cung cấp endpoint kiểm tra tình trạng API và kết nối cơ sở dữ liệu.
- **MockGatewayModule:** Mô phỏng kết quả thanh toán thông qua endpoint nội bộ của Backend.

Không liệt kê Inventory hoặc Promotions là module NestJS độc lập vì `AppModule` hiện không import các module này. Trong Prisma schema có trường `Product.stock` và model `Promotion`, nhưng sự hiện diện của model/field trong schema không đồng nghĩa đã có module nghiệp vụ tương ứng.

### 4.3. Cơ sở dữ liệu

PostgreSQL được khai báo là datasource trong `apps/api/prisma/schema.prisma`. Prisma được sử dụng làm ORM và Prisma Migrate quản lý thay đổi cấu trúc dữ liệu.

Các model chính trong Prisma schema gồm:

- `User`: thông tin tài khoản người dùng và điểm tích lũy.
- `Product`: thông tin sản phẩm và số lượng tồn kho (`stock`).
- `Promotion`: thông tin mã khuyến mãi.
- `Order`: đơn hàng, người tạo, trạng thái và tổng tiền.
- `OrderItem`: các dòng sản phẩm trong đơn hàng.
- `Payment`: thông tin giao dịch, phương thức, trạng thái và `idempotencyKey`.
- `LoyaltyTransaction`: lịch sử thay đổi điểm tích lũy.

Repository có migration khởi tạo tại `apps/api/prisma/migrations/`. Docker Compose khai báo PostgreSQL 16 và ánh xạ cổng máy chủ `5433` tới cổng container `5432`.

### 4.4. Thanh toán giả lập và Idempotency

Thanh toán được xử lý bởi `PaymentsModule`. `PaymentsService` gửi HTTP POST đến endpoint `/mock-gateway/pay` của MockGateway module đang chạy trong Backend. Đây là cơ chế giả lập nội bộ của ứng dụng, không phải tích hợp với nhà cung cấp thanh toán bên ngoài.

`MockGatewayService` trả về trạng thái `FAILED` khi `simulateFail` là `true`; trong trường hợp còn lại trả về `SUCCESS`.

API tạo thanh toán nhận khóa qua HTTP header `Idempotency-Key`. Backend kiểm tra khóa trong bảng Payment. Trường `Payment.idempotencyKey` được khai báo `@unique` trong Prisma schema. Nếu khóa đã tồn tại và thuộc cùng đơn hàng/người dùng, hệ thống trả lại thông tin thanh toán đã lưu; nếu khóa được dùng cho giao dịch khác, hệ thống trả lỗi xung đột.

Quá trình tạo thanh toán và cập nhật trạng thái đơn hàng được thực hiện trong Prisma transaction với mức cô lập `Serializable`. Khi thanh toán thành công, Backend kiểm tra và giảm tồn kho sản phẩm trong transaction. Khi thanh toán thất bại, trạng thái đơn hàng được chuyển thành `PAYMENT_FAILED`.

Cơ chế hiện tại giúp ngăn việc tạo thêm bản ghi Payment với cùng khóa duy nhất. Việc bảo đảm idempotency ở mọi tình huống đồng thời hoặc khi gateway đã xử lý nhưng transaction thất bại vẫn cần được kiểm thử và đánh giá riêng.

## 5. Các quyết định kiến trúc

### 5.1. Tổ chức mã nguồn theo Monorepo

Frontend, Backend, tài liệu và các thành phần kiểm thử được quản lý trong cùng repository. Cấu trúc chính phân chia ứng dụng thành `apps/web` và `apps/api`, tài liệu trong `docs` và kiểm thử trong `tests`.

Chi tiết được trình bày trong [ADR 001: Tổ chức mã nguồn theo Monorepo](adr/001-monorepo.md).

### 5.2. Sử dụng PostgreSQL và Prisma

PostgreSQL được chọn để lưu trữ dữ liệu quan hệ; Prisma được sử dụng để truy vấn dữ liệu và quản lý migration.

Chi tiết được trình bày trong [ADR 002: PostgreSQL và Prisma](adr/002-postgresql-prisma.md).

### 5.3. Mock Payment Gateway và Idempotency

Backend sử dụng module MockGateway nội bộ để mô phỏng kết quả thanh toán. Khóa Idempotency-Key cùng ràng buộc unique trong cơ sở dữ liệu được dùng để nhận diện yêu cầu thanh toán đã được ghi nhận.

Chi tiết được trình bày trong [ADR 003: Mock Payment Gateway và Idempotency](adr/003-mock-payment-idempotency.md).

## 6. Vận hành và cấu hình

### 6.1. Cấu hình môi trường

Backend đọc các biến môi trường như `DATABASE_URL`, `JWT_SECRET` và `PORT`. Docker Compose hiện khai báo cấu hình PostgreSQL, API và Web; API nhận `DATABASE_URL`, `JWT_SECRET` và `PORT` từ cấu hình Compose.

Tệp `.env.example` trong bản repository được rà soát hiện chưa liệt kê các biến cấu hình. Nhóm nên cập nhật tệp này để mô tả các biến cần thiết, đồng thời chỉ sử dụng giá trị mẫu, không đưa mật khẩu hoặc khóa bí mật thực tế vào repository.

### 6.2. Kiểm tra dữ liệu đầu vào

Trong `apps/api/src/main.ts`, Backend cấu hình `ValidationPipe` toàn cục với `whitelist: true`, `forbidNonWhitelisted: true` và `transform: true`. Việc này hỗ trợ kiểm tra DTO và từ chối các thuộc tính không được khai báo.

### 6.3. Tài liệu API

Swagger được cấu hình trong `main.ts` và được phục vụ tại `/swagger`. Tài liệu API được tạo từ metadata của các controller và DTO.

### 6.4. Health Check

`HealthController` cung cấp endpoint `GET /health`. `HealthService` thực hiện truy vấn `SELECT 1` thông qua Prisma để kiểm tra kết nối cơ sở dữ liệu. Khi kiểm tra thành công, API trả trạng thái `ok`; khi cơ sở dữ liệu không khả dụng, API trả lỗi dịch vụ không khả dụng.

### 6.5. Ghi log và xử lý lỗi

Ứng dụng hiện sử dụng khả năng logging mặc định của NestJS và có thông báo khi Backend khởi động trong `main.ts`. Trong mã nguồn được rà soát chưa thấy cấu hình hệ thống log tập trung hoặc thư viện logging chuyên biệt. Không ghi thông tin nhạy cảm như mật khẩu, JWT hoặc khóa bí mật vào log.

Backend sử dụng các exception của NestJS để trả lỗi HTTP phù hợp cho các tình huống nghiệp vụ và lỗi dịch vụ.

### 6.6. Docker Compose

Tệp `docker-compose.yml` khai báo ba dịch vụ:

- `postgres`: PostgreSQL 16, có healthcheck bằng `pg_isready`.
- `api`: Backend được build từ `apps/api`, phụ thuộc vào trạng thái healthy của PostgreSQL.
- `web`: Frontend được build từ `apps/web`, cấu hình địa chỉ API công khai cho môi trường Docker.

Docker Compose hỗ trợ khởi chạy môi trường phát triển tích hợp. Cấu hình triển khai thực tế cần được rà soát riêng trước khi dùng production.

## 7. Ưu điểm, hạn chế và đánh đổi

### 7.1. Ưu điểm

- **Quản lý tập trung:** Monorepo đặt Frontend, Backend và tài liệu trong cùng repository.
- **Tách biệt trách nhiệm:** NestJS module hóa các nhóm chức năng Backend.
- **Dữ liệu quan hệ:** PostgreSQL hỗ trợ quan hệ, ràng buộc và transaction.
- **Quản lý schema:** Prisma schema và migration giúp theo dõi thay đổi cơ sở dữ liệu.
- **Dễ kiểm thử thanh toán:** MockGateway mô phỏng kết quả mà không cần kết nối nhà cung cấp thanh toán thật.
- **Kiểm soát yêu cầu lặp:** Idempotency-Key và ràng buộc unique giúp nhận diện khóa thanh toán đã được lưu.

### 7.2. Hạn chế

- **Xung đột khi cộng tác:** Nhiều thành viên chỉnh sửa cùng tệp có thể gây conflict; cần tuân thủ branch và Pull Request.
- **Mock thanh toán có giới hạn:** MockGateway không mô phỏng đầy đủ các tình huống, bảo mật và đối soát của nhà cung cấp thật.
- **Idempotency cần kiểm thử thêm:** Cần kiểm thử các tình huống gửi đồng thời và lỗi xảy ra giữa lúc gọi gateway với lúc ghi transaction.
- **PWA chưa được xác nhận:** Chưa thấy manifest và service worker trong mã nguồn được rà soát.
- **Cấu hình môi trường cần hoàn thiện:** `.env.example` hiện còn trống trong bản repository này.

### 7.3. Đánh đổi

Kiến trúc hiện tại ưu tiên một ứng dụng Backend NestJS được chia module thay vì triển khai nhiều microservice độc lập. Cách tiếp cận này giảm độ phức tạp vận hành và phù hợp với quy mô dự án học phần.

MockGateway giúp nhóm phát triển và kiểm thử luồng thanh toán mà không cần phụ thuộc nhà cung cấp bên ngoài, nhưng không thay thế một cổng thanh toán thực tế.

## 8. Kết luận

BrewLite Assignment 2 được tổ chức theo mô hình Monorepo, sử dụng Next.js cho Frontend, NestJS cho Backend, PostgreSQL cho lưu trữ dữ liệu và Prisma cho truy cập dữ liệu/migration. Backend được chia thành các module nghiệp vụ, cung cấp REST API, Swagger, ValidationPipe và endpoint health check.

Thanh toán được mô phỏng bởi MockGateway nội bộ. Idempotency-Key được lưu với ràng buộc unique để nhận diện yêu cầu đã được xử lý. Tài liệu kiến trúc cần tiếp tục được cập nhật khi mã nguồn thay đổi để luôn phản ánh đúng trạng thái triển khai.