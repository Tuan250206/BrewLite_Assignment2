# Triển khai hệ thống BrewLite

## 1. Mục đích

Tài liệu này mô tả cách BrewLite được cấu hình, đóng gói và triển khai trên ba môi trường:
phát triển cục bộ (local), tích hợp/tự động hóa (CI) và vận hành thực tế (production).
Nội dung tương ứng với Task 3.2 (deployment diagram) và Task 5.3 – 5.4 (CD và bàn giao).

## 2. Các môi trường triển khai

| Môi trường | Thành phần | Công cụ | Địa chỉ |
| --- | --- | --- | --- |
| Local | Web, API, PostgreSQL | Docker Compose | Web `:3000`, API `:3001`, PostgreSQL `localhost:5433` |
| CI | Kiểm thử và build | GitHub Actions | Chạy khi mở Pull Request vào `main` |
| Production | Web, API, PostgreSQL | Render (kèm GHCR) | Web `https://brewlite-web-bu5f.onrender.com`, API `https://brewlite-api-d4ql.onrender.com` |

## 3. Kiến trúc triển khai Production

Hệ thống được triển khai trên Render, gồm các thành phần (xem sơ đồ deployment):

- **Render edge / CDN:** nhận request qua HTTPS (`:443`), TLS do Render quản lý.
- **Web Service (Next.js):** phục vụ giao diện, chạy trên cổng động `0.0.0.0:$PORT`.
- **API Service (NestJS):** xử lý nghiệp vụ và REST API, cũng bind `0.0.0.0:$PORT`.
- **PostgreSQL (Render managed):** lưu trữ bền vững, chỉ truy cập qua internal URL, không public.
- **GitHub Container Registry (GHCR):** nơi lưu image bất biến của Web và API.

Image được đẩy lên GHCR theo tag bất biến, sau đó Render pull đúng tag đó để triển khai.
Frontend gọi API qua `NEXT_PUBLIC_API_URL`; API bật CORS cho phép Web truy cập.

## 4. Đóng gói (Docker)

- **API (`apps/api/Dockerfile`):** build đa tầng (Node 20). Khi container khởi động chạy:
  `npx prisma migrate deploy` → `npx prisma db seed` → `node dist/main.js`.
  Việc migrate + seed tự động bảo đảm database production luôn đồng bộ với schema (seed viết dạng idempotent).
- **Web (`apps/web/Dockerfile`):** build Next.js với tham số `NEXT_PUBLIC_API_URL` truyền lúc build,
  sau đó chạy `npm run start`.

## 5. Cấu hình và bí mật

Không lưu thông tin nhạy cảm trong repository. Các giá trị được khai báo trong GitHub:

| Loại | Tên | Ý nghĩa |
| --- | --- | --- |
| Secret | `RENDER_API_DEPLOY_HOOK` | Deploy Hook của service API |
| Secret | `RENDER_WEB_DEPLOY_HOOK` | Deploy Hook của service Web |
| Variable | `PRODUCTION_API_URL` | URL API production (dùng khi build Web) |
| Variable | `PRODUCTION_WEB_URL` | URL Web production (dùng cho smoke test) |

Cấu hình phía Render: API cần `DATABASE_URL`, `JWT_SECRET`, `PORT`; Web cần `NEXT_PUBLIC_API_URL` (truyền lúc build).

## 6. Pipeline CI/CD

### CI – Continuous Integration (`.github/workflows/ci.yml`)

Kích hoạt khi mở Pull Request vào `main` (và khi push `main`), chạy tuần tự:
`Install → Lint → Unit Test → Build` cho cả API và Web. Pull Request không được merge nếu bất kỳ bước nào thất bại.

### CD – Continuous Delivery/Deployment (`.github/workflows/cd.yml`)

Kích hoạt khi push `main`, push tag dạng `v*.*.*`, hoặc chạy thủ công. Pipeline gồm 7 bước:

1. **Quality gate:** lint, test và build cho API và Web.
2. **Build image:** tạo image Web và API.
3. **Tag bất biến:** dùng semantic version khi push tag (ví dụ `v2.0.0`), hoặc `sha-<7 ký tự SHA>` khi push nhánh.
4. **Push GHCR:** đẩy image lên `ghcr.io/tuan250206/brewlite_assignment2/{api,web}:<tag>` (kèm tag `latest`).
5. **Deploy Render:** gọi Deploy Hook kèm tham số `imgURL` trỏ đúng tag image cần triển khai.
6. **Migration an toàn:** API chạy `prisma migrate deploy` khi khởi động (không mất dữ liệu, không sửa lịch sử migration).
7. **Smoke test:** gọi `GET /health` của API (và kiểm tra HTTP 200 của Web); nếu thất bại, pipeline dừng và in hướng dẫn rollback.

## 7. Health check

- Endpoint: `GET /health` — trả về `{"status":"ok"}` khi API hoạt động.
- Được Render dùng làm health check và được pipeline CD dùng làm smoke test sau triển khai.
- Swagger UI tại `/swagger` để kiểm thử API nhanh.

## 8. Rollback

Rollback là đưa hệ thống trở về phiên bản (image tag) trước đó khi bản mới gặp lỗi.
Vì mỗi image có tag bất biến (không bị ghi đè), bản cũ vẫn còn trong GHCR nên có thể triển khai lại bất cứ lúc nào.

### Cách chính — qua Render Dashboard

1. Render → chọn service cần rollback (API hoặc Web) → tab **Events**.
2. Tìm bản deploy thành công gần nhất trước bản lỗi → bấm **Redeploy**.
3. Chờ trạng thái chuyển **Live**.
4. Kiểm tra lại: gọi `GET /health` và kỳ vọng nhận `{"status":"ok"}`.

### Cách thay thế — gọi Deploy Hook với tag cũ

Chỉ dùng khi cần rollback bằng script. Trên PowerShell phải dùng `curl.exe` (không dùng `curl`):

```powershell
$hook = "<deploy hook>"
$img  = "ghcr.io/tuan250206/brewlite_assignment2/api:<tag-cu>"
curl.exe --get --data-urlencode "imgURL=$img" $hook
```

### Kiểm tra sau rollback

- Render → service → **Events**: có deploy mới sử dụng đúng tag cũ.
- `GET /health` trả về `{"status":"ok"}`.

### Lưu ý quan trọng

Rollback **không** rollback được database: migration của Prisma là một chiều.
Nếu bản lỗi đã chạy `prisma migrate deploy`, schema DB đã thay đổi; chỉ nên rollback về bản còn tương thích schema.

## 9. Ghi chú vận hành

- Render Free Tier: service "ngủ" sau 15 phút không có traffic, cần ~1 phút để khởi động lại.
- PostgreSQL Free hết hạn và bị xóa sau 30 ngày, không có backup.
- Database production không public; API kết nối qua internal URL.
- Không ghi mật khẩu, token hay secret vào log.
