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
    private String vnpTmnCode = "";

    @Builder.Default
    private String vnpHashSecret = "";

    @Builder.Default
    private String vnpPayUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    // SePay Config
    @Builder.Default
    private String sepayAccountNumber = "49431072004";

    @Builder.Default
    private String sepayBankCode = "TPBank";

    @Builder.Default
    private String sepayAccountName = "LE HOAI LOC";

    @Builder.Default
    private String sepayApiKey = "";

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
    private String databaseEngine = "MySQL 8.0 Enterprise Engine";

    @Builder.Default
    private String dbType = "MYSQL"; // POSTGRESQL, MYSQL, SQLSERVER, ORACLE, H2

    @Builder.Default
    private String dbHost = "mysqldb";

    @Builder.Default
    private String dbPort = "3306";

    @Builder.Default
    private String dbName = "library_db";

    @Builder.Default
    private String dbUsername = "root";

    @Builder.Default
    private String dbPassword = "root";

    @Builder.Default
    private String dbJdbcUrl = "jdbc:mysql://mysqldb:3306/library_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true";

    @Builder.Default
    private String dbDriverClassName = "com.mysql.cj.jdbc.Driver";

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
    private Long totalSearchHits = 12480L;

    @Builder.Default
    private Long todaySearchHits = 142L;

    @Builder.Default
    private Integer activeReadersCount = 18;

    @Builder.Default
    private String themeName = "emerald-scholar"; // orange-white, modern-dark, oxford-navy, emerald-scholar

    // Google Gemini AI Config
    @Builder.Default
    private String geminiApiKey = "";

    @Builder.Default
    private String geminiModel = "gemini-flash-lite-latest";

    @Builder.Default
    private boolean geminiEnabled = true;

    @Builder.Default
    private String geminiSystemPrompt = "Bạn là Cán bộ Tư vấn Học liệu của Trung tâm Thông tin – Thư viện Đại học. Hãy tư vấn giáo trình, phương pháp nghiên cứu và gợi ý chính xác sách trong thư viện bằng tiếng Việt chuẩn mực, thân thiện.";

    // Google OAuth 2.0 Config
    @Builder.Default
    private String googleClientId = "426128153010-m9mm9jui1d2hcq9a8ktjhj8eel1bfo0e.apps.googleusercontent.com";

    @Builder.Default
    private String googleClientSecret = "";

    @Builder.Default
    private String googleRedirectUri = "https://sanhoantien.click/auth/callback/google";

    @Builder.Default
    private boolean googleOAuthEnabled = true;

    // Facebook Login Config
    @Builder.Default
    private String facebookAppId = "";

    @Builder.Default
    private String facebookAppSecret = "";

    @Builder.Default
    private String facebookRedirectUri = "https://sanhoantien.click/auth/callback/facebook";

    @Builder.Default
    private boolean facebookOAuthEnabled = true;

    // Library Bulletin & Popup Management (Bản Tin & Quản Lý Popup Độc Giả)
    @Builder.Default
    private boolean popupEnabled = true;

    @Builder.Default
    private boolean popupNavButtonEnabled = true;

    @Builder.Default
    private String popupTitle = "Thông Báo: Lịch Phục Vụ Phòng Đọc & Mượn Giáo Trình Học Kỳ Mới";

    @Builder.Default
    private String popupBadgeText = "BẢN TIN THƯ VIỆN • HỌC KỲ 2026";

    @Builder.Default
    private String popupBannerUrl = "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1000";

    @Builder.Default
    @Column(length = 2000)
    private String popupContent = "Chào mừng quý giảng viên, học viên và sinh viên đến với Trung tâm Thông tin – Thư viện Đại học! Nhằm phục vụ đợt học tập và làm khóa luận tốt nghiệp, Thư viện hỗ trợ đặt mượn giáo trình trực tuyến, gia hạn phiếu mượn tự động và tra cứu danh mục tài liệu tham khảo theo từng chuyên ngành đào tạo.";

    @Builder.Default
    private String popupLinkText = "Tra Cứu Giáo Trình Ngay";
}
