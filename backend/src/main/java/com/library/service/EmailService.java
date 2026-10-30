package com.library.service;

import com.library.entity.BorrowRecord;
import com.library.entity.Payment;
import com.library.entity.User;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:noreply@smartlibrary.edu.vn}")
    private String fromEmail;

    @Async
    public void sendWelcomeEmail(User user) {
        String subject = "📚 Chào mừng bạn đến với Thư viện Số SmartLibrary!";
        String content = """
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                    <h2 style='color: #4f46e5; text-align: center;'>Chào mừng bạn gia nhập SmartLibrary!</h2>
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Tài khoản độc giả thư viện số của bạn đã được kích hoạt thành công.</p>
                    <p><strong>Email đăng nhập:</strong> %s</p>
                    <p><strong>Vai trò:</strong> %s</p>
                    <p>Bây giờ bạn có thể dễ dàng tra cứu hàng ngàn đầu sách, mượn sách trực tuyến và nhận sự trợ giúp từ Trợ lý Thư viện AI.</p>
                    <div style='text-align: center; margin-top: 24px;'>
                        <a href='http://localhost:5173' style='background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Truy Cập Thư Viện Ngay</a>
                    </div>
                </div>
                """.formatted(user.getFullName(), user.getEmail(), user.getRole().name());

        sendHtmlEmail(user.getEmail(), subject, content);
    }

    @Async
    public void sendBorrowConfirmation(BorrowRecord record) {
        String subject = "📖 Xác nhận phiếu mượn sách thành công - " + record.getBorrowCode();
        String content = """
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
                    <h2 style='color: #10b981; text-align: center;'>Mượn Sách Thành Công!</h2>
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Bạn đã đăng ký mượn cuốn sách <strong>"%s"</strong> thành công.</p>
                    <table style='width: 100%%; border-collapse: collapse; margin: 16px 0;'>
                        <tr><td style='padding: 8px; border-bottom: 1px solid #f1f5f9;'>Mã phiếu mượn:</td><td style='padding: 8px; font-weight: bold;'>%s</td></tr>
                        <tr><td style='padding: 8px; border-bottom: 1px solid #f1f5f9;'>Ngày mượn:</td><td style='padding: 8px;'>%s</td></tr>
                        <tr><td style='padding: 8px; border-bottom: 1px solid #f1f5f9;'>Hạn trả sách:</td><td style='padding: 8px; color: #ef4444; font-weight: bold;'>%s</td></tr>
                        <tr><td style='padding: 8px;'>Vị trí kệ:</td><td style='padding: 8px;'>%s</td></tr>
                    </table>
                    <p><em>Vui lòng lưu ý trả sách đúng thời hạn để tránh phát sinh phí trễ hạn.</em></p>
                </div>
                """.formatted(record.getUser().getFullName(), record.getBook().getTitle(), record.getBorrowCode(), 
                              record.getBorrowDate(), record.getDueDate(), record.getBook().getShelfLocation());

        sendHtmlEmail(record.getUser().getEmail(), subject, content);
    }

    @Async
    public void sendOverdueAlert(BorrowRecord record) {
        String subject = "⚠️ Cảnh báo: Sách mượn tại SmartLibrary đã quá hạn trả!";
        String content = """
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #ef4444; border-radius: 12px;'>
                    <h2 style='color: #ef4444; text-align: center;'>Thông Báo Quá Hạn Mượn Sách</h2>
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Hệ thống ghi nhận cuốn sách <strong>"%s"</strong> (Mã phiếu: <strong>%s</strong>) đã quá hạn vào ngày <strong>%s</strong>.</p>
                    <p style='color: #dc2626; font-weight: bold;'>Số tiền phạt hiện tại: %,.0f VNĐ (5.000 VNĐ / ngày trễ hạn).</p>
                    <p>Vui lòng mang sách đến quầy thủ thư hoặc truy cập cổng thanh toán trực tuyến VNPay để hoàn tất phí phạt và gia hạn.</p>
                    <div style='text-align: center; margin-top: 24px;'>
                        <a href='http://localhost:5173/my-borrowings' style='background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Kiểm Tra & Thanh Toán Ngay</a>
                    </div>
                </div>
                """.formatted(record.getUser().getFullName(), record.getBook().getTitle(), record.getBorrowCode(), 
                              record.getDueDate(), record.getFineAmount());

        sendHtmlEmail(record.getUser().getEmail(), subject, content);
    }

    @Async
    public void sendPaymentReceipt(Payment payment) {
        String subject = "💳 Biên lai thanh toán trực tuyến VNPay thành công #" + payment.getTransactionId();
        String content = """
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #10b981; border-radius: 12px;'>
                    <h2 style='color: #10b981; text-align: center;'>Hóa Đơn Thanh Toán Thành Công</h2>
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Giao dịch thanh toán trực tuyến qua <strong>VNPay</strong> của bạn đã được ghi nhận thành công.</p>
                    <table style='width: 100%%; border-collapse: collapse; margin: 16px 0;'>
                        <tr><td style='padding: 8px; border-bottom: 1px solid #f1f5f9;'>Mã giao dịch:</td><td style='padding: 8px; font-weight: bold;'>%s</td></tr>
                        <tr><td style='padding: 8px; border-bottom: 1px solid #f1f5f9;'>Số tiền:</td><td style='padding: 8px; color: #10b981; font-weight: bold;'>%,.0f VNĐ</td></tr>
                        <tr><td style='padding: 8px; border-bottom: 1px solid #f1f5f9;'>Nội dung:</td><td style='padding: 8px;'>%s</td></tr>
                        <tr><td style='padding: 8px;'>Thời gian:</td><td style='padding: 8px;'>%s</td></tr>
                    </table>
                    <p>Cảm ơn bạn đã sử dụng dịch vụ thư viện số SmartLibrary!</p>
                </div>
                """.formatted(payment.getUser().getFullName(), payment.getTransactionId(), payment.getAmount(), 
                              payment.getOrderInfo(), payment.getPaymentDate());

        sendHtmlEmail(payment.getUser().getEmail(), subject, content);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        if (!mailEnabled) {
            log.info("========== [SPRING MAIL SERVICE SIMULATION] ==========");
            log.info("TO: {}", to);
            log.info("SUBJECT: {}", subject);
            log.info("BODY (HTML Preview length: {} chars)", htmlBody.length());
            log.info("======================================================");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
