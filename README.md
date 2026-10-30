# 📚 SmartLibrary - Hệ Thống Quản Lý Thư Viện Số Hiện Đại

> **Đồ án môn học J2EE / Java Web Nâng Cao**  
> **Kiến trúc:** Frontend SPA (React + Vite) + Backend (Spring Boot 3 + Spring for GraphQL)  
> **Cổng thanh toán:** VNPay Sandbox + SePay VietQR  
> **Tích hợp:** Spring Security OAuth2 (Gmail), Spring Mail, AI Smart Librarian  

---

## 🚀 Khởi Chạy Nhanh Trong 1 Click

Chỉ cần nhấp đúp vào file **`run_all.bat`** trên máy tính của bạn:
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8080](http://localhost:8080)
- **Interactive GraphiQL IDE:** [http://localhost:8080/graphiql](http://localhost:8080/graphiql)
- **H2 Database Console:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:mem:librarydb`, User: `sa`, Pass: để trống)

Hoặc khởi động bằng 2 lệnh riêng biệt:
```bash
# Terminal 1: Backend
cd backend
mvnw.cmd spring-boot:run

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 🔑 Tài Khoản Dùng Thử (3 Nhóm Người Dùng)

Hệ thống đã có sẵn 3 tài khoản mẫu được kích hoạt sẵn để phục vụ chấm bài và kiểm thử:

1. **Quản trị viên (Admin):**
   - Email: `admin@library.com`
   - Mật khẩu: `admin123`
   - *Quyền hạn: Xem toàn bộ KPI, biểu đồ doanh thu VNPay & SePay, quản lý cấp quyền người dùng.*

2. **Thủ thư (Librarian):**
   - Email: `librarian@library.com`
   - Mật khẩu: `librarian123`
   - *Quyền hạn: Quản lý kho sách (CRUD), cập nhật vị trí kệ sách, duyệt phiếu mượn, nhận trả sách, xử lý hỏng/mất sách.*

3. **Độc giả (Reader):**
   - Email: `reader@library.com`
   - Mật khẩu: `reader123`
   - *Quyền hạn: Tra cứu sách qua GraphQL, đăng ký mượn sách trực tuyến, gia hạn mượn, thanh toán tiền phạt qua SePay VietQR / VNPay, chat với Trợ lý AI.*

4. **Đăng nhập Google / Gmail (OAuth2):**
   - Nhấn nút **"Đăng nhập với Gmail (Google OAuth2)"** trong modal đăng nhập để trải nghiệm đăng nhập 1 cú nhấp chuột!

---

## 💳 Hướng Dẫn Thanh Toán Trực Tuyến

Khi độc giả có sách quá hạn hoặc chọn thanh toán phí:
1. Nhấp nút **"Thanh toán phạt"** tại mục Sách đang mượn.
2. **Chọn SePay VietQR:**
   - Hệ thống tự động sinh ảnh VietQR chuẩn ngân hàng với số tiền chính xác và nội dung chuyển khoản `LIB...`.
   - Nhấn nút **"⚡ Kiểm tra / Xác nhận chuyển khoản SePay thành công"** để mô phỏng Webhook tự động khớp lệnh của SePay.
3. **Chọn VNPay Gateway:**
   - Chuyển hướng sang cổng thanh toán VNPay Sandbox với mã hóa bảo mật chuẩn HMAC-SHA512.

---

## 🐳 Triển Khai Docker / Cloud (Microservices)

```bash
docker-compose up --build
```
Dự án sẽ khởi chạy 3 container:
- `library_mysql`: MySQL Database trên port 3306
- `library_backend`: Spring Boot 3 trên port 8080
- `library_frontend`: Nginx React SPA trên port 80 / 3000

---

## 📄 Báo Cáo Đồ Án Chi Tiết
Xem toàn bộ báo cáo đồ án học thuật đầy đủ cấu trúc tại file:  
👉 **[BAO_CAO_DO_AN_J2EE_QUAN_LY_THU_VIEN.md](./BAO_CAO_DO_AN_J2EE_QUAN_LY_THU_VIEN.md)**
