# Sprint Review và Sprint Retrospective — BrewLite

> Nguồn dữ liệu: bảng phân công công việc của nhóm, nhật ký công việc theo ngày
> (Task 1–Task 5) và lịch sử commit của repository tại thời điểm bàn giao.
> Mốc thời gian giữ nguyên theo nhật ký, định dạng `dd/mm/yyyy`.

## 1. Bối cảnh chung

- Nhóm gồm **6 thành viên**.
- **4 buổi họp nhóm:** 27/10/2026, 03/11/2026, 10/11/2026, 17/11/2026.
- **Sprint 1** (Task 4 – nền tảng kỹ thuật): 20/10/2026 → 10/11/2026.
- **Sprint 2** (Task 5 – hoàn thiện, CI/CD, bàn giao): 10/11/2026 → 17/11/2026.

### Phân công theo thành viên

| Thành viên | Phần việc chính |
| --- | --- |
| Nguyễn Văn Thanh Tuấn | Task 2.2, 2.3; Task 4.1; Task 4.4; Task 5.2 (docker-compose); Task 5.3; Task 5.4 (URL HTTPS, secret) |
| Nguyễn Thành Nhân | Task 1.1, 1.3; Task 4.2, 4.3; Task 5.1 (FE Catalog) |
| Vũ Minh Trường | Task 3.2; Task 5.1 (BE Core); Task 5.2 (`GET /health`) |
| Tiêu Tấn Tùng | Task 1.2; Task 1.3 (sơ đồ); Task 5.1 (BE Auth); Task 5.2 (DB & Testing) |
| Nguyễn Đức Tuấn | Task 2.1; Task 5.1 (FE UI); Task 5.2 (E2E Testing) |
| Nguyễn Thanh Nhân | Task 3.1; Task 5.4 (README, release, rollback); Mục 8 – Truy vết |

---

## 2. Sprint Review

### 2.1 Sprint 1 — nền tảng kỹ thuật

| Hạng mục | Phụ trách | Ngày ghi nhận | Kết quả |
| --- | --- | --- | --- |
| Task 4.1 – Thiết lập repository (monorepo, branching, quy ước commit) | Nguyễn Văn Thanh Tuấn | 20/10/2026 | Hoàn thành |
| Task 4.2 – Quản lý tài liệu | Nguyễn Thành Nhân | 09/11/2026 | Hoàn thành |
| Task 4.3 – MVP Sprint 1 (component/luồng chính) | Nguyễn Thành Nhân | 09/11 – 10/11/2026 | Hoàn thành |
| Task 4.4 – Continuous Integration (Install → Lint → Unit Test → Build) | Nguyễn Văn Thanh Tuấn | 10/11/2026 | Hoàn thành |
| Task 1 – Khai thác và đặc tả yêu cầu | Tiêu Tấn Tùng, Nguyễn Thành Nhân | 22/10 – 03/11/2026 | Hoàn thành |
| Task 2 – Mô hình hóa (activity, sequence, class) | Nguyễn Đức Tuấn, Nguyễn Văn Thanh Tuấn | 24/10 – 25/10/2026 | Hoàn thành |
| Task 3 – Thiết kế kiến trúc và deployment | Nguyễn Thanh Nhân, Vũ Minh Trường | 26/10 – 29/10/2026 | Hoàn thành |

### 2.2 Sprint 2 — hoàn thiện MVP, CI/CD và bàn giao

| Hạng mục | Phụ trách | Ngày ghi nhận | Kết quả |
| --- | --- | --- | --- |
| Task 5.1 – FE Catalog: chi tiết sản phẩm, size/topping, giỏ hàng, tổng tiền | Nguyễn Thành Nhân | 09/11/2026 | Hoàn thành |
| Task 5.1 – BE Auth: đăng ký, đăng nhập, cấp JWT, validate | Tiêu Tấn Tùng | 10/11/2026 | Hoàn thành |
| Task 5.1 – BE Core: tạo đơn, thanh toán Ví/Thẻ, trạng thái, lịch sử, Idempotency | Vũ Minh Trường | 11/11/2026 | Hoàn thành |
| Task 5.1 – FE UI: màn hình auth, thanh toán, xác nhận, lịch sử đơn | Nguyễn Đức Tuấn | 11/11/2026 | Hoàn thành |
| Task 5.2 – Bộ kiểm thử backend (unit/integration) và migration/seed | Tiêu Tấn Tùng | 12/11/2026 | Hoàn thành |
| Task 5.2 – E2E Playwright: Menu → Cart → Checkout → Payment → History | Nguyễn Đức Tuấn | 12/11/2026 | Hoàn thành |
| Task 5.2 – `docker-compose.yml` chạy web, API, database ở local | Nguyễn Văn Thanh Tuấn | 14/11/2026 | Hoàn thành |
| Task 5.3 – Continuous Delivery/Deployment | Nguyễn Văn Thanh Tuấn | 14/11/2026 | Hoàn thành |
| Task 5.4 – URL frontend/API qua HTTPS, database không public, secret không lộ | Nguyễn Văn Thanh Tuấn | 14/11/2026 | Hoàn thành |
| Task 5.4 – README, release notes, hướng dẫn rollback, video demo | Nguyễn Thanh Nhân | 16/11/2026 | Hoàn thành |
| Mục 8 – Ma trận truy vết | Nguyễn Thanh Nhân | 16/11/2026 | Hoàn thành |

### 2.3 Nghiệm thu

| Hạng mục | Kết quả |
| --- | --- |
| FR-01 → FR-09 | Đạt |
| FR-10 – Cập nhật trạng thái đơn hàng | Hạ từ Must xuống Should; máy trạng thái đã có nhưng **chưa có API** → future scope |
| US-09 – Khuyến mãi & tích điểm | Future scope |
| NFR-01 – Hiệu năng `GET /products` | Đạt trong môi trường kiểm thử local |
| NFR-03 – Health check `GET /health` | Đạt |
| NFR-04 – CI/CD | Đạt |

### 2.4 Phản hồi tiếp nhận


---

## 3. Sprint Retrospective

### 3.1 Điều làm tốt

- **Phân công rõ ràng theo task và có thể truy vết:** mỗi thành viên nhận task cụ thể, làm trên nhánh riêng (`docs/task-1-requirements`, `docs/task-3-architecture`, …) qua Pull Request.
- **Duy trì nhật ký công việc theo ngày:** mọi thay đổi đều ghi lại ngày, hình thức (task cá nhân / chỉnh sửa, bổ sung), nội dung và người thực hiện — giúp dựng lại chính xác tiến độ.
- **Họp nhóm đều đặn:** 4 buổi trong giai đoạn 27/10 – 17/11/2026.
- **Tự động hóa sớm:** CI có từ Sprint 1 (10/11), CD và triển khai production có ngay sau đó (14/11), nên phần bàn giao không phải làm thủ công.
- **Nghiệp vụ tách thành hàm thuần** (`assertTransition`, `calculateOrderItemLineTotal`) nên unit test được mà không cần dựng HTTP server.

### 3.2 Điều chưa tốt

| Vấn đề | Bằng chứng |
| --- | --- |
| Tài liệu yêu cầu phải sửa nhiều vòng | Task 1.1/1.3 được ghi nhận chỉnh sửa ngày 23/10, 24/10, 04/11, 11/11, 12/11 |
| Ưu tiên yêu cầu chốt quá muộn | Ngày 12/11 mới chỉnh mức ưu tiên của FR-09, FR-10, NFR-03 |
| Sơ đồ vẽ trước, code sau nên phải vẽ lại | Ngày 15/11 ghi nhận "chỉnh sửa lại class diagram phù hợp hàm"; activity diagram cũng phải chỉnh lại cùng ngày |
| Deployment diagram phải chỉnh nhiều lần | Task 3.2 chỉnh ngày 06/11 và 14/11 sau khi hoàn thành 26/10 |
| Tài liệu kiến trúc từng mô tả công nghệ không dùng | `docs/architecture/overview.md` phải bổ sung ghi chú rằng Axios và TanStack Query có trong `package.json` nhưng không dùng trong mã nguồn |
| File rác build bị đưa vào repository | `apps/api/tsconfig.build.tsbuildinfo` đang được Git theo dõi, `.gitignore` chưa có `*.tsbuildinfo` |
| Nhận thức về giới hạn rollback đến muộn | Rollback image không hoàn tác được migration Prisma — chỉ phát hiện khi viết tài liệu deployment |

### 3.3 Hành động cho giai đoạn sau

1. **Chốt tên hàm/API trước khi vẽ sơ đồ**, hoặc rà soát sơ đồ ↔ mã nguồn ngay trong từng Pull Request thay vì để tới sát hạn.
2. **Đưa "đối chiếu tài liệu với mã nguồn" vào Definition of Done** để tránh tài liệu mô tả thư viện/module không tồn tại.
3. **Đóng băng tài liệu trước ngày nộp**, không chỉnh sửa tài liệu ở những ngày cuối.
4. **Dọn repository:** thêm `*.tsbuildinfo` vào `.gitignore` và bỏ theo dõi `apps/api/tsconfig.build.tsbuildinfo`.
5. **Cấu hình cổng và URL qua biến môi trường**, không hardcode, để tránh lỗi health check khi triển khai.
6. **Ghi rõ "future scope" và hạ mức ưu tiên** cho hạng mục chưa triển khai, thay vì để mức Must rồi bỏ trống.

---

## 4. Phụ lục — Số lần chỉnh sửa theo hạng mục

| Hạng mục | Ngày ghi nhận chỉnh sửa |
| --- | --- |
| Task 1.1, 1.3 | 23/10, 24/10, 04/11, 11/11 |
| Task 1.2 | 03/11, 10/11, 12/11 |
| Task 2.1 (activity) | 03/11, 15/11 |
| Task 2.2, 2.3 (sequence, class) | 24/10, 25/10, 11/11, 15/11 |
| Task 3.2 (deployment) | 06/11, 14/11 |
