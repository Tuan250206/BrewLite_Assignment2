# BrewLite - Coffee Ordering Platform

Bài tập lớn môn Công nghệ Phần mềm - Assignment 2 (Requirements to Deployment)  
Hệ thống đặt cà phê theo kiến trúc Mobile-first / PWA, NestJS API và PostgreSQL.

---

## 1. Cấu trúc Repository
Dự án áp dụng mô hình monorepo với các thư mục chính:
- `apps/web`: Ứng dụng Frontend phát triển bằng Next.js (Mobile-first / PWA).
- `apps/api`: Dịch vụ Backend API xây dựng bằng NestJS.
- `docs/`: Tài liệu phân tích yêu cầu (SRS), sơ đồ thiết kế UML và kiến trúc hệ thống.
- `tests/`: Kịch bản kiểm thử tích hợp (Integration Test) và kiểm thử đầu-cuối (E2E Test).
- `.github/workflows/`: Cấu hình pipeline tự động hóa CI/CD qua GitHub Actions.

---

## 2. Chiến lược Phân nhánh và Pull Request

### Phân nhánh (Branching Strategy)
- `main`: Nhánh chính chứa mã nguồn ổn định nhất, sẵn sàng bàn giao và triển khai Production. Nhánh này được bật tính năng Branch Protection, cấm push trực tiếp.
- Các nhánh chức năng tạo ra từ `main`:
  - `feat/<tên-tính-năng>`: Xây dựng tính năng mới (Ví dụ: `feat/menu-catalog`, `feat/order-checkout`).
  - `fix/<tên-lỗi>`: Sửa lỗi hệ thống (Ví dụ: `fix/cancelled-order`).
  - `docs/<tên-tài-liệu>`: Bổ sung hoặc cập nhật tài liệu (Ví dụ: `docs/traceability-matrix`).
  - `test/<tên-module>`: Viết hoặc bổ sung kịch bản kiểm thử (Ví dụ: `test/e2e-order`).

### Quy trình Pull Request (PR)
1. Tạo Pull Request từ nhánh tính năng về nhánh `main`.
2. Mô tả rõ nhiệm vụ giải quyết và gắn liên kết với Issue liên quan (Ví dụ: `Closes #1`).
3. Điều kiện bắt buộc để merge vào `main`:
   - Pipeline CI (Install $\rightarrow$ Lint $\rightarrow$ Unit Test $\rightarrow$ Build) thực thi thành công.
   - Có sự xem xét (review) và phê duyệt (approve) từ thành viên trong nhóm.

---

## 3. Quy ước Commit
Tiêu đề commit phải rõ ràng, bắt đầu bằng các tiền tố phân loại công việc:

- `feat:` Thêm tính năng mới (Ví dụ: `feat: implement cancel order logic`).
- `fix:` Sửa lỗi hệ thống (Ví dụ: `fix: disable cancel button for paid orders`).
- `test:` Bổ sung hoặc chỉnh sửa mã kiểm thử (Ví dụ: `test: add e2e test for checkout flow`).
- `docs:` Cập nhật tài liệu, sơ đồ UML hoặc ma trận truy vết (Ví dụ: `docs: update traceability matrix`).
- `ci:` Cấu hình pipeline GitHub Actions, Docker (Ví dụ: `ci: add workflow for pr check`).
- `refactor:` Tái cấu trúc mã nguồn mà không làm thay đổi logic xử lý.
- `chore:` Cập nhật cấu hình phụ, dependencies hoặc dọn dẹp thư mục.

---

## 4. Tiêu chí Hoàn thành (Definition of Done - DoD)
Một User Story hoặc Issue được xác nhận là "Done" khi đạt đủ các tiêu chí:
1. **Lint & Code Quality:** Mã nguồn không còn lỗi cảnh báo hoặc vi phạm quy tắc khi chạy `npm run lint`.
2. **Kiểm thử:** Đã có kiểm thử tự động (Unit Test / Integration Test / E2E Test) tương ứng và kết quả kiểm thử pass 100%.
3. **Môi trường Local:** Kiểm thử cục bộ thông qua `docker-compose.yml` hoạt động ổn định.
4. **CI Kiểm tra:** Pull Request vượt qua toàn bộ các bước kiểm tra tự động của GitHub Actions và được merge vào nhánh chính.
5. **Truy vết:** Đã đối chiếu và cập nhật các mã yêu cầu, mã API và mã bài test vào tệp `docs/traceability-matrix.md`.

---

## 5. Khởi chạy Hệ thống tại Local

### Yêu cầu môi trường
- Node.js (phiên bản 18 trở lên)
- Docker và Docker Compose

### Các bước khởi chạy
1. Sao chép kho mã nguồn về máy:
   ```bash
   git clone [https://github.com/Tuan250206/BrewLite_Assignment2.git](https://github.com/Tuan250206/BrewLite_Assignment2.git)
   cd BrewLite_Assignment2