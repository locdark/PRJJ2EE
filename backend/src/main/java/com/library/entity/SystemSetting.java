package com.library.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Website branding
    @Builder.Default
    private String siteTitle = "SmartLibrary";

    @Builder.Default
    private String siteSubtitle = "Hệ Thống Quản Lý Thư Viện Số Thế Hệ Mới";

    @Builder.Default
    private String logoUrl = "";

    @Builder.Default
    private String contactEmail = "support@smartlibrary.edu.vn";

    @Builder.Default
    private String contactPhone = "1900 6868";

    @Builder.Default
    private String address = "828 Sư Vạn Hạnh, Phường 13, Quận 10, TP. Hồ Chí Minh";

    @Builder.Default
    private String openingHours = "07:30 - 21:00 (Thứ 2 - Thứ 7)";

    // VNPay Config
    @Builder.Default
    private String vnpTmnCode = "2QXUI4B4";

    @Builder.Default
    private String vnpHashSecret = "AXYZBOPQRETUVWXKLMN1234567890ABC";

    @Builder.Default
    private String vnpPayUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    // SePay Config
    @Builder.Default
    private String sepayAccountNumber = "0388888888";

    @Builder.Default
    private String sepayBankCode = "MBBank";

    @Builder.Default
    private String sepayAccountName = "SMART LIBRARY HUFLIT";

    @Builder.Default
    private String sepayApiKey = "SEPAY_DEMO_SECRET_API_KEY";

    // Cloudflare & Cloud CDN Config
    @Builder.Default
    private String cloudflareApiKey = "";

    @Builder.Default
    private String cloudflareZoneId = "";

    @Builder.Default
    private String cloudflareAccountEmail = "admin@smartlibrary.edu.vn";

    @Builder.Default
    private boolean cloudflareProxyEnabled = true;

    // Database & System rules
    @Builder.Default
    private String databaseEngine = "H2 / MySQL Dual Engine";

    @Builder.Default
    private String dbType = "POSTGRESQL"; // POSTGRESQL, MYSQL, SQLSERVER, ORACLE, H2

    @Builder.Default
    private String dbHost = "localhost";

    @Builder.Default
    private String dbPort = "5432";

    @Builder.Default
    private String dbName = "smart_library_db";

    @Builder.Default
    private String dbUsername = "postgres";

    @Builder.Default
    private String dbPassword = "root_password_123";

    @Builder.Default
    private String dbJdbcUrl = "jdbc:postgresql://localhost:5432/smart_library_db";

    @Builder.Default
    private String dbDriverClassName = "org.postgresql.Driver";

    @Builder.Default
    private Integer dbMaxPoolSize = 10;

    @Builder.Default
    private Integer dbMinIdle = 5;

    @Builder.Default
    private Double lateFinePerDay = 5000.0;

    @Builder.Default
    private Integer defaultBorrowDays = 14;

    // Giới hạn số lượng sách tối đa được mượn cùng lúc (mặc định 3 cuốn, admin tùy chỉnh)
    @Builder.Default
    private Integer maxBorrowLimit = 3;

    // Bật / Tắt chứng nhận & huy hiệu Bộ Công Thương (MOIT)
    @Builder.Default
    private boolean moitVerificationEnabled = true;

    // Số liệu vận hành & thống kê tra cứu thực tế
    @Builder.Default
    private Long totalSearchHits = 158958434L;

    @Builder.Default
    private Long todaySearchHits = 345693L;

    @Builder.Default
    private Integer activeReadersCount = 28;

    @Builder.Default
    private String themeName = "emerald-scholar"; // orange-white, modern-dark, oxford-navy, emerald-scholar

    // Google Gemini AI Config
    @Builder.Default
    private String geminiApiKey = "";

    @Builder.Default
    private String geminiModel = "gemini-1.5-flash"; // gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro

    @Builder.Default
    private boolean geminiEnabled = true;

    @Builder.Default
    private String geminiSystemPrompt = "Bạn là Trợ lý Thủ thư AI thông minh của Thư viện Số SmartLibrary. Hãy tư vấn giáo trình, phương pháp học tập và gợi ý chính xác sách trong thư viện bằng tiếng Việt chuẩn mực, thân thiện.";

    // Google OAuth 2.0 Config
    @Builder.Default
    private String googleClientId = "109827364521-smartlibrary.apps.googleusercontent.com";

    @Builder.Default
    private String googleClientSecret = "GOCSPX-demo_google_client_secret_xyz123";

    @Builder.Default
    private String googleRedirectUri = "http://localhost:5173/auth/callback/google";

    @Builder.Default
    private boolean googleOAuthEnabled = true;

    // Facebook Login Config
    @Builder.Default
    private String facebookAppId = "108927164928374";

    @Builder.Default
    private String facebookAppSecret = "fb_sec_89283472891238918237";

    @Builder.Default
    private String facebookRedirectUri = "http://localhost:5173/auth/callback/facebook";

    @Builder.Default
    private boolean facebookOAuthEnabled = true;

    // Library Bulletin & Popup Management (Bản Tin & Quản Lý Popup Độc Giả)
    @Builder.Default
    private boolean popupEnabled = true;

    @Builder.Default
    private boolean popupNavButtonEnabled = true;

    @Builder.Default
    private String popupTitle = "Thông Báo: Khai Trương Kho Sách Số & Tuần Lễ Văn Hóa Đọc 2026";

    @Builder.Default
    private String popupBadgeText = "HOT • BẢN TIN SỐ #1792776375";

    @Builder.Default
    private String popupBannerUrl = "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1000";

    @Builder.Default
    @Column(length = 2000)
    private String popupContent = "Chào mừng quý độc giả đến với Hệ thống Thư viện Số SmartLibrary! Nhằm phục vụ đợt thi học kỳ và nhu cầu nghiên cứu học thuật, Thư viện nâng hạn mức mượn giáo trình lên 5 cuốn/độc giả, miễn phí đọc 100 tài liệu số chuyên ngành. Trợ lý AI Gemini đã sẵn sàng hỗ trợ tra cứu 24/7.";

    @Builder.Default
    private String popupLinkText = "Xem Kho Sách & Tra Cứu";
}
