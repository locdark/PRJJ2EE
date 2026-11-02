package com.library.data;

import com.library.entity.*;
import com.library.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final BookRepository bookRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        seedCategoriesAuthorsPublishersAnd100Books();
        seedSampleBorrowsAndPayments();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) return;

        User admin = User.builder()
                .email("admin@library.com")
                .password(passwordEncoder.encode("admin123"))
                .fullName("Quản trị viên Hệ thống")
                .phone("0901234567")
                .avatar("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop")
                .address("Hồ Chí Minh, Việt Nam")
                .role(Role.ROLE_ADMIN)
                .provider("LOCAL")
                .enabled(true)
                .build();

        User librarian = User.builder()
                .email("librarian@library.com")
                .password(passwordEncoder.encode("librarian123"))
                .fullName("Thủ thư Nguyễn Thu Hà")
                .phone("0912345678")
                .avatar("https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop")
                .address("Hà Nội, Việt Nam")
                .role(Role.ROLE_LIBRARIAN)
                .provider("LOCAL")
                .enabled(true)
                .build();

        User reader = User.builder()
                .email("reader@library.com")
                .password(passwordEncoder.encode("reader123"))
                .fullName("Sinh viên Trần Anh Tuấn")
                .phone("0987654321")
                .avatar("https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop")
                .address("TP. Hồ Chí Minh")
                .role(Role.ROLE_READER)
                .provider("LOCAL")
                .enabled(true)
                .build();

        userRepository.saveAll(List.of(admin, librarian, reader));
        log.info("Seeded 3 system users: admin, librarian, reader");
    }

    private void seedCategoriesAuthorsPublishersAnd100Books() {
        if (bookRepository.count() >= 100) {
            log.info("Books already seeded (count >= 100).");
            return;
        }

        // 1. Categories
        Category catIT = getOrCreateCategory("Công nghệ thông tin & Lập trình", "Kiến trúc phần mềm, Java, Spring Boot, Microservices, AI & Cloud", "Code");
        Category catAI = getOrCreateCategory("Trí tuệ nhân tạo & Khoa học dữ liệu", "Machine Learning, Deep Learning, Big Data và LLM", "Cpu");
        Category catBiz = getOrCreateCategory("Kinh tế & Khởi nghiệp", "Tài chính, quản trị doanh nghiệp, marketing và khởi nghiệp", "TrendingUp");
        Category catSkills = getOrCreateCategory("Kỹ năng sống & Phát triển bản thân", "Tư duy tích cực, giao tiếp, đắc nhân tâm và quản lý thời gian", "BookOpen");
        Category catScience = getOrCreateCategory("Khoa học & Kỹ thuật", "Vật lý thiên văn, sinh học, cơ học lượng tử và khám phá vũ trụ", "Atom");
        Category catLiterature = getOrCreateCategory("Văn học & Nghệ thuật", "Tiểu thuyết kinh điển, tác phẩm văn học Việt Nam và thế giới", "Feather");
        Category catHistory = getOrCreateCategory("Lịch sử & Triết học", "Lịch sử Việt Nam, văn minh nhân loại và triết học phương Tây", "Compass");

        // 2. Authors
        Author aBob = getOrCreateAuthor("Robert C. Martin (Uncle Bob)", "Chuyên gia Clean Code hàng đầu thế giới");
        Author aFowler = getOrCreateAuthor("Martin Fowler", "Tiên phong về Refactoring & Enterprise Architecture");
        Author aAndrew = getOrCreateAuthor("Andrew Ng", "Giáo sư Stanford, huyền thoại AI & Machine Learning");
        Author aCarnegie = getOrCreateAuthor("Dale Carnegie", "Tác giả Đắc Nhân Tâm kinh điển");
        Author aHarari = getOrCreateAuthor("Yuval Noah Harari", "Sử gia thế giới, tác giả Sapiens");
        Author aClear = getOrCreateAuthor("James Clear", "Tác giả Atomic Habits (Thói Quen Nguyên Tử)");
        Author aHawking = getOrCreateAuthor("Stephen Hawking", "Nhà vật lý lý thuyết kiệt xuất");
        Author aMurakami = getOrCreateAuthor("Haruki Murakami", "Nhà văn đương đại Nhật Bản nổi tiếng thế giới");
        Author aRies = getOrCreateAuthor("Eric Ries", "Cha đẻ phương pháp khởi nghiệp tinh gọn Lean Startup");
        Author aKahneman = getOrCreateAuthor("Daniel Kahneman", "Nhà kinh tế học đoạt giải Nobel, tác giả Thinking Fast & Slow");

        // Đại thi hào & Tác giả văn học, lịch sử danh tiếng
        Author aNguyenDu = getOrCreateAuthor("Nguyễn Du", "Đại thi hào dân tộc, Danh nhân văn hóa thế giới, tác giả Đoạn Trường Tân Thanh");
        Author aVuTrongPhung = getOrCreateAuthor("Vũ Trọng Phụng", "Ông vua phóng sự đất Bắc, tác giả Số Đỏ & Giông Tố");
        Author aBaoNinh = getOrCreateAuthor("Bảo Ninh", "Nhà văn quân đội, tác giả Nỗi Buồn Chiến Tranh kinh điển");
        Author aNgoSiLien = getOrCreateAuthor("Ngô Sĩ Liên", "Sử thần triều Hậu Lê, chủ biên Đại Việt Sử Ký Toàn Thư");
        Author aPauloCoelho = getOrCreateAuthor("Paulo Coelho", "Nhà văn Brazil, tác giả Nhà Giả Kim bán chạy toàn cầu");
        Author aSaintExupery = getOrCreateAuthor("Antoine de Saint-Exupéry", "Nhà văn kiêm phi công Pháp, tác giả Hoàng Tử Bé");
        Author aMarquez = getOrCreateAuthor("Gabriel García Márquez", "Đại văn hào Colombia đoạt giải Nobel, tác giả Trăm Năm Cô Đơn");
        Author aTolstoy = getOrCreateAuthor("Lev Tolstoy", "Đại văn hào Nga, tác giả Chiến Tranh Và Hòa Bình");
        Author aDostoevsky = getOrCreateAuthor("Fyodor Dostoevsky", "Đại văn hào tâm lý Nga, tác giả Tội Ác Và Trừng Phạt");
        Author aHemingway = getOrCreateAuthor("Ernest Hemingway", "Đại văn hào Mỹ đoạt giải Nobel, tác giả Ông Già Và Biển Cả");
        Author aMitchell = getOrCreateAuthor("Margaret Mitchell", "Nhà văn Mỹ, tác giả Cuốn Theo Chiều Gió");
        Author aSalinger = getOrCreateAuthor("J.D. Salinger", "Nhà văn Mỹ, tác giả Bắt Trẻ Đồng Xanh");
        Author aBronte = getOrCreateAuthor("Emily Brontë", "Tiểu thuyết gia người Anh, tác giả Đồi Gió Hú");
        Author aJaredDiamond = getOrCreateAuthor("Jared Diamond", "Nhà địa lý học & sinh lý học Mỹ, tác giả Súng, Vi Trùng Và Thép");
        Author aTonTu = getOrCreateAuthor("Tôn Tử", "Danh tướng thời Xuân Thu, tác giả Binh Pháp Tôn Tử");
        Author aKhongTu = getOrCreateAuthor("Khổng Tử", "Nhà tư tưởng sáng lập Nho giáo, tác giả Luận Ngữ");
        Author aRussell = getOrCreateAuthor("Bertrand Russell", "Triết gia người Anh đoạt giải Nobel Văn học, tác giả Lược Sử Triết Học");
        Author aSartre = getOrCreateAuthor("Jean-Paul Sartre", "Triết gia hiện sinh Pháp, tác giả Buồn Nôn");
        Author aSpinoza = getOrCreateAuthor("Baruch Spinoza", "Triết gia duy lý Hà Lan, tác giả Đạo Đức Học (Ethics)");
        Author aTranTrongKim = getOrCreateAuthor("Trần Trọng Kim", "Nhà học giả, sử gia Việt Nam, tác giả Việt Nam Sử Lược");

        // 3. Publishers
        Publisher pTre = getOrCreatePublisher("NXB Trẻ", "161B Lý Chính Thắng, Quận 3, TP.HCM");
        Publisher pOReilly = getOrCreatePublisher("O'Reilly Media", "Sebastopol, CA, USA");
        Publisher pThongTin = getOrCreatePublisher("NXB Thông tin & Truyền thông", "Hà Nội, Việt Nam");
        Publisher pKimDong = getOrCreatePublisher("NXB Kim Đồng", "55 Quang Trung, Hai Bà Trưng, Hà Nội");
        Publisher pGiaoDuc = getOrCreatePublisher("NXB Giáo Dục Việt Nam", "Hà Nội, Việt Nam");

        // Cover pool images
        String[] covers = {
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=500&auto=format&fit=crop&q=80"
        };

        // Book definitions (100 books)
        Object[][] bookRawData = {
            // --- IT & Lập trình (20 sách) ---
            {"Clean Code - Mã Sạch Thực Chiến", "978-0132350884", catIT, aBob, pOReilly, "Kệ IT-A01", 185000.0, 10, 8, 2022, 4.9, "Cẩm nang viết code sạch, kiến trúc dễ đọc, kiểm thử đơn vị hiệu quả."},
            {"Spring Boot & GraphQL In Action", "978-1617297571", catIT, aFowler, pThongTin, "Kệ IT-A02", 250000.0, 8, 6, 2023, 5.0, "Xây dựng ứng dụng enterprise với Spring Boot 3, Spring Data JPA, JWT và GraphQL."},
            {"Refactoring - Cải Thiện Mã Nguồn Kế Thừa", "978-0201485677", catIT, aFowler, pOReilly, "Kệ IT-A03", 210000.0, 6, 5, 2023, 4.7, "Kỹ thuật tái cấu trúc code chuyên sâu và loại bỏ code smells."},
            {"Design Patterns - Mẫu Thiết Kế Hướng Đối Tượng", "978-0201633610", catIT, aFowler, pOReilly, "Kệ IT-A04", 280000.0, 12, 9, 2022, 4.9, "23 mẫu thiết kế kinh điển Gang of Four cho lập trình viên Java & OOP."},
            {"Effective Java (Bản dịch tiếng Việt)", "978-0134685991", catIT, aBob, pThongTin, "Kệ IT-A05", 220000.0, 10, 7, 2023, 4.9, "78 phương pháp tối ưu hóa code Java, quản lý bộ nhớ và generic."},
            {"Kiến Trúc Microservices Thực Chiến", "978-1492034025", catIT, aFowler, pOReilly, "Kệ IT-A06", 310000.0, 7, 4, 2024, 4.8, "Thiết kế hệ thống vi dịch vụ phân tán, API Gateway, Docker và Kafka."},
            {"Cấu Trúc Dữ Liệu Và Giải Thuật Với Java", "978-0133761313", catIT, aBob, pGiaoDuc, "Kệ IT-A07", 175000.0, 15, 11, 2022, 4.8, "Toàn tập về Tree, Graph, Dynamic Programming, Sorting và Big O."},
            {"Lập Trình Web Toàn Diện Với React & TypeScript", "978-1801070621", catIT, aFowler, pOReilly, "Kệ IT-A08", 260000.0, 9, 7, 2024, 4.7, "Xây dựng Single Page App hiện đại, Hooks, Redux Toolkit và Next.js."},
            {"DevOps Toàn Tập: CI/CD, Docker & Kubernetes", "978-1492056478", catIT, aFowler, pOReilly, "Kệ IT-A09", 350000.0, 6, 3, 2024, 4.9, "Quy trình tự động hóa triển khai phần mềm lên Kubernetes và Cloud."},
            {"Học Lập Trình Python Từ Số Không", "978-1593279288", catIT, aAndrew, pTre, "Kệ IT-A10", 145000.0, 20, 16, 2022, 4.6, "Cơ bản đến nâng cao về Python, xử lý file, automation và web scraping."},
            {"Golang Thực Chiến Cho Hệ Thống Hiệu Năng Cao", "978-1491941959", catIT, aBob, pOReilly, "Kệ IT-A11", 290000.0, 5, 4, 2023, 4.8, "Lập trình đồng thời với Goroutines, Channels và kiến trúc Backend Go."},
            {"An Ninh Mạng & Kỹ Thuật Hacking Đạo Đức", "978-1593275013", catIT, aBob, pThongTin, "Kệ IT-A12", 230000.0, 8, 5, 2023, 4.7, "Kiểm thử thâm nhập, phòng thủ mã độc và bảo mật Web OWASP Top 10."},
            {"Cơ Sở Dữ Liệu Phân Tán & NoSQL", "978-1449373320", catIT, aFowler, pOReilly, "Kệ IT-A13", 270000.0, 7, 5, 2022, 4.6, "So sánh MongoDB, Cassandra, Redis và tính nhất quán CAP Theorem."},
            {"Clean Architecture - Kiến Trúc Phần Mềm Chuẩn", "978-0134494166", catIT, aBob, pOReilly, "Kệ IT-A14", 240000.0, 10, 8, 2023, 5.0, "Tách biệt business logic, UI, framework và nguyên lý Dependency Inversion."},
            {"Lập Trình Rust Cơ Bản Và Ứng Dụng", "978-1593278281", catIT, aBob, pOReilly, "Kệ IT-A15", 300000.0, 5, 3, 2024, 4.8, "Khái niệm Ownership, Borrow checker và lập trình an toàn bộ nhớ."},
            {"Thiết Kế API RESTful & GraphQL Chuẩn Quốc Tế", "978-1449358068", catIT, aFowler, pThongTin, "Kệ IT-A16", 215000.0, 11, 9, 2023, 4.7, "Xây dựng API bảo mật với OAuth2, Rate limiting và GraphQL Subscriptions."},
            {"Lập Trình Hệ Thống Nhúng & IoT Với C/C++", "978-0131103627", catIT, aBob, pGiaoDuc, "Kệ IT-A17", 160000.0, 14, 12, 2021, 4.5, "Giao tiếp vi điều khiển, cảm biến, MQTT và FreeRTOS."},
            {"Thực Chiến Với Hệ Điều Hành Linux & Bash Shell", "978-1593279523", catIT, aBob, pThongTin, "Kệ IT-A18", 195000.0, 12, 9, 2023, 4.7, "Quản trị Linux Server, phân quyền người dùng và shell script tự động."},
            {"Điện Toán Đám Mây AWS & Azure Toàn Diện", "978-1119550266", catIT, aFowler, pOReilly, "Kệ IT-A19", 330000.0, 8, 6, 2024, 4.9, "Thiết kế kiến trúc Serverless, S3, EC2, Lambda và bảo mật IAM."},
            {"Kiểm Thử Phần Mềm Tự Động (Automation Testing)", "978-1492040767", catIT, aFowler, pThongTin, "Kệ IT-A20", 225000.0, 9, 7, 2023, 4.6, "Selenium, Cypress, JUnit 5, Mockito và chiến lược kiểm thử TDD."},

            // --- AI, Machine Learning & Data (15 sách) ---
            {"Machine Learning Năm 2026: Từ Lý Thuyết Đến Ứng Dụng", "978-1492032649", catAI, aAndrew, pOReilly, "Kệ AI-B01", 320000.0, 5, 3, 2024, 4.8, "Tổng hợp mô hình học máy, mạng nơ-ron sâu, LLM và kỹ thuật MLOps."},
            {"Deep Learning Căn Bản - Học Sâu Với PyTorch", "978-1617295263", catAI, aAndrew, pOReilly, "Kệ AI-B02", 340000.0, 6, 4, 2024, 4.9, "CNN, RNN, Transformer, mô hình thị giác máy tính và nhận dạng tiếng nói."},
            {"Kỹ Thuật Xử Lý Ngôn Ngữ Tự Nhiên (NLP) Hiện Đại", "978-1492054085", catAI, aAndrew, pThongTin, "Kệ AI-B03", 295000.0, 7, 5, 2023, 4.7, "Tokenization, Word2Vec, BERT, GPT và các kiến trúc Attention."},
            {"Prompt Engineering Cho Kỹ Sư Phần Mềm", "978-1492099999", catAI, aAndrew, pOReilly, "Kệ AI-B04", 210000.0, 15, 12, 2024, 4.8, "Nghệ thuật giao tiếp với LLM, Chain-of-Thought, Few-Shot và RAG."},
            {"Khoa Học Dữ Liệu Bằng Python (Data Science Handbook)", "978-1491912058", catAI, aAndrew, pOReilly, "Kệ AI-B05", 280000.0, 10, 8, 2023, 4.9, "Thành thạo Pandas, NumPy, Matplotlib, Seaborn và Scikit-Learn."},
            {"Trực Quan Hóa Dữ Liệu Chuyên Nghiệp", "978-1119002253", catAI, aAndrew, pTre, "Kệ AI-B06", 185000.0, 12, 10, 2022, 4.6, "Nghệ thuật kể chuyện bằng số liệu với Dashboard, biểu đồ và Power BI."},
            {"Toán Học Dành Cho Khoa Học Dữ Liệu & AI", "978-1492052074", catAI, aAndrew, pGiaoDuc, "Kệ AI-B07", 190000.0, 14, 11, 2023, 4.7, "Đại số tuyến tính, giải tích ma trận, xác suất và tối ưu hóa lồi."},
            {"Khai Phá Dữ Liệu Lớn Với Apache Spark", "978-1491912218", catAI, aAndrew, pOReilly, "Kệ AI-B08", 310000.0, 8, 6, 2023, 4.8, "Phân tích dữ liệu phân tán terabyte với Spark SQL và Streaming."},
            {"Học Tăng Cường (Reinforcement Learning) Thực Chiến", "978-0262039246", catAI, aAndrew, pOReilly, "Kệ AI-B09", 360000.0, 4, 2, 2024, 4.9, "Q-Learning, Policy Gradient, ứng dụng trong xe tự hành và robotics."},
            {"Thị Giác Máy Tính Với OpenCV Và Deep Learning", "978-1491941409", catAI, aAndrew, pThongTin, "Kệ AI-B10", 275000.0, 9, 6, 2023, 4.7, "Phát hiện khuôn mặt, nhận diện vật thể YOLOv8 và phân đoạn ảnh."},
            {"Generative AI: Bí Ẩn Đằng Sau ChatGPT & Midjourney", "978-1492088888", catAI, aAndrew, pTre, "Kệ AI-B11", 240000.0, 18, 14, 2024, 4.9, "Cơ chế hoạt động của Diffusion Models, VAE và GANs giải thích dễ hiểu."},
            {"Đạo Đức AI & Quản Trị Trí Tuệ Nhân Tạo", "978-0190905033", catAI, aHarari, pTre, "Kệ AI-B12", 165000.0, 11, 9, 2023, 4.6, "Định kiến thuật toán, bảo vệ dữ liệu cá nhân và an toàn AI toàn cầu."},
            {"Hệ Thống Gợi Ý Thông Minh (Recommender Systems)", "978-1491954386", catAI, aAndrew, pOReilly, "Kệ AI-B13", 290000.0, 6, 4, 2024, 4.8, "Lọc cộng tác (Collaborative Filtering), Matrix Factorization như Netflix."},
            {"Phân Tích Dữ Liệu Chuỗi Thời Gian Trong Tài Chính", "978-1492041658", catAI, aAndrew, pThongTin, "Kệ AI-B14", 260000.0, 7, 5, 2023, 4.7, "Mô hình ARIMA, LSTM dự báo biến động giá cổ phiếu và thời tiết."},
            {"Xây Dựng Ứng Dụng Với LangChain & Vector DB", "978-1492077777", catAI, aAndrew, pOReilly, "Kệ AI-B15", 285000.0, 10, 8, 2024, 5.0, "Kết nối LLM với ChromaDB, Pinecone để tra cứu tài liệu nội bộ."},

            // --- Kinh tế & Khởi nghiệp (15 sách) ---
            {"Khởi Nghiệp Tinh Gọn (The Lean Startup)", "978-0307887894", catBiz, aRies, pTre, "Kệ KT-C01", 140000.0, 8, 7, 2022, 4.8, "Kiểm chứng giả thuyết kinh doanh và xây dựng MVP tối ưu chi phí."},
            {"Tư Duy Nhanh Và Chậm (Thinking, Fast and Slow)", "978-0374533557", catBiz, aKahneman, pTre, "Kệ KT-C02", 175000.0, 14, 10, 2021, 4.9, "Hai hệ thống tư duy chi phối mọi quyết định tài chính và đời sống."},
            {"Chiến Lược Đại Dương Xanh", "978-1625274496", catBiz, aRies, pTre, "Kệ KT-C03", 160000.0, 9, 6, 2022, 4.7, "Tạo ra khoảng trống thị trường không có đối thủ cạnh tranh."},
            {"Từ Không Đến Một (Zero To One)", "978-0804139298", catBiz, aRies, pTre, "Kệ KT-C04", 135000.0, 12, 9, 2022, 4.8, "Bài học khởi nghiệp công nghệ đột phá từ nhà sáng lập PayPal."},
            {"Nhà Đầu Tư Thông Minh (The Intelligent Investor)", "978-0060555665", catBiz, aKahneman, pTre, "Kệ KT-C05", 210000.0, 10, 7, 2021, 4.9, "Cẩm nang đầu tư giá trị kinh điển của Benjamin Graham."},
            {"Bắt Đầu Với Câu Hỏi Tại Sao (Start With Why)", "978-1591846444", catBiz, aClear, pTre, "Kệ KT-C06", 125000.0, 15, 11, 2022, 4.8, "Truyền cảm hứng lãnh đạo và xây dựng doanh nghiệp vĩ đại."},
            {"Kinh Tế Học Hài Hước (Freakonomics)", "978-0060731335", catBiz, aKahneman, pTre, "Kệ KT-C07", 130000.0, 11, 8, 2021, 4.7, "Khám phá bản chất ngầm của các hiện tượng kinh tế thường ngày."},
            {"Nguyên Lý Tiếp Thị (Principles of Marketing - Kotler)", "978-0134492513", catBiz, aKahneman, pGiaoDuc, "Kệ KT-C08", 320000.0, 8, 5, 2023, 4.9, "Giáo trình marketing căn bản kinh điển của Philip Kotler."},
            {"Tài Chính Doanh Nghiệp Hiện Đại", "978-1259918940", catBiz, aKahneman, pGiaoDuc, "Kệ KT-C09", 290000.0, 9, 6, 2022, 4.6, "Định giá doanh nghiệp, dòng tiền DCF và cấu trúc vốn."},
            {"Dốc Hết Trái Tim (Pour Your Heart Into It - Starbucks)", "978-1401308445", catBiz, aRies, pTre, "Kệ KT-C10", 145000.0, 10, 8, 2021, 4.8, "Hành trình xây dựng đế chế cà phê Starbucks của Howard Schultz."},
            {"Tái Cấu Trúc Tổ Chức Và Doanh Nghiệp", "978-1633691780", catBiz, aFowler, pThongTin, "Kệ KT-C11", 195000.0, 6, 4, 2023, 4.6, "Mô hình Agile trong quản trị tập đoàn và tối ưu hiệu suất."},
            {"Nghệ Thuật Bán Hàng Bậc Cao", "978-0425081020", catBiz, aCarnegie, pTre, "Kệ KT-C12", 115000.0, 16, 12, 2021, 4.7, "Kỹ năng tư vấn, xử lý từ chối và chốt đơn đỉnh cao."},
            {"Tâm Lý Học Về Tiền (The Psychology of Money)", "978-0857197689", catBiz, aKahneman, pTre, "Kệ KT-C13", 155000.0, 20, 15, 2023, 5.0, "Bài học vượt thời gian về sự giàu có, lòng tham và hạnh phúc."},
            {"Bí Quyết Gây Quỹ Khởi Nghiệp Thành Công", "978-1118490808", catBiz, aRies, pThongTin, "Kệ KT-C14", 180000.0, 7, 5, 2023, 4.7, "Pitch deck, định giá tiền đầu tư và thương lượng với VC."},
            {"Thương Mại Điện Tử & Bán Lẻ Đa Kênh (Omnichannel)", "978-1789660883", catBiz, aRies, pThongTin, "Kệ KT-C15", 220000.0, 8, 6, 2024, 4.8, "Vận hành Shopee, TikTok Shop, quản trị kho và logistics."},

            // --- Kỹ năng sống & Phát triển bản thân (15 sách) ---
            {"Đắc Nhân Tâm (Bản dịch chuẩn)", "978-0671027032", catSkills, aCarnegie, pTre, "Kệ KN-D01", 95000.0, 25, 20, 2021, 4.9, "Nghệ thuật giao tiếp thu phục lòng người kinh điển nhất lịch sử."},
            {"Thói Quen Nguyên Tử (Atomic Habits)", "978-0735211292", catSkills, aClear, pTre, "Kệ KN-D02", 168000.0, 22, 17, 2022, 5.0, "Thay đổi tí hon mang lại thành tựu phi thường mỗi ngày."},
            {"7 Thói Quen Của Người Thành Đạt", "978-1982137274", catSkills, aClear, pTre, "Kệ KN-D03", 180000.0, 18, 13, 2021, 4.9, "Nguyên lý sống chủ động, tư duy cùng thắng và rèn giũa bản thân."},
            {"Dám Bị Ghét (The Courage to Be Disliked)", "978-1501197277", catSkills, aMurakami, pTre, "Kệ KN-D04", 120000.0, 16, 12, 2022, 4.8, "Tâm lý học Adler giải phóng bạn khỏi kỳ vọng của người khác."},
            {"Sức Mạnh Của Hiện Tại (The Power of Now)", "978-1577314806", catSkills, aCarnegie, pTre, "Kệ KN-D05", 135000.0, 14, 10, 2021, 4.8, "Tỉnh thức, buông bỏ lo âu và sống trọn vẹn trong khoảnh khắc này."},
            {"Thuật Đọc Nguội - Thấu Hiểu Bất Kỳ Ai", "978-7505739345", catSkills, aCarnegie, pTre, "Kệ KN-D06", 110000.0, 15, 11, 2022, 4.6, "Kỹ thuật quan sát ngôn ngữ cơ thể và tâm lý trong đàm phán."},
            {"Tư Duy Sâu (Deep Work)", "978-1455586691", catSkills, aClear, pTre, "Kệ KN-D07", 145000.0, 12, 9, 2022, 4.9, "Quy tắc rèn luyện sự tập trung cao độ trong thế giới đầy xao nhãng."},
            {"Thiết Kế Cuộc Đời Bạn Đáng Sống (Designing Your Life)", "978-1101875322", catSkills, aFowler, pTre, "Kệ KN-D08", 150000.0, 10, 8, 2022, 4.7, "Áp dụng tư duy thiết kế (Design Thinking) vào sự nghiệp và đời sống."},
            {"Khéo Ăn Nói Sẽ Có Được Thiên Hạ", "978-6045628522", catSkills, aCarnegie, pTre, "Kệ KN-D09", 98000.0, 20, 15, 2021, 4.7, "Kỹ năng ứng biến trong các tình huống giao tiếp đời sống."},
            {"Quản Lý Thời Gian Thông Minh", "978-0143126584", catSkills, aClear, pTre, "Kệ KN-D10", 105000.0, 14, 11, 2022, 4.6, "Phương pháp Pomodoro, ma trận Eisenhower và lập kế hoạch ngày."},
            {"Càng Kỷ Luật, Càng Tự Do", "978-6045658932", catSkills, aClear, pTre, "Kệ KN-D11", 125000.0, 18, 14, 2023, 4.8, "Kiên trì vượt qua lười biếng để đạt được mục tiêu cuộc đời."},
            {"Làm Chủ Cảm Xúc (Master Your Emotions)", "978-1981089154", catSkills, aCarnegie, pTre, "Kệ KN-D12", 118000.0, 12, 9, 2022, 4.7, "Vượt qua căng thẳng, sợ hãi và làm chủ tư duy tích cực."},
            {"Tư Duy Phản Biện (Critical Thinking)", "978-0134047911", catSkills, aKahneman, pGiaoDuc, "Kệ KN-D13", 160000.0, 11, 8, 2023, 4.8, "Nhận diện ngụy biện, kiểm chứng thông tin và lập luận logic."},
            {"Sức Bền Tinh Thần (Grit - Angela Duckworth)", "978-1501111105", catSkills, aClear, pTre, "Kệ KN-D14", 155000.0, 13, 10, 2022, 4.8, "Sức mạnh của đam mê và tính kiên trì vượt trội tài năng thiên bẩm."},
            {"Tâm Lý Học Đám Đông (Gustave Le Bon)", "978-0486419565", catSkills, aHarari, pTre, "Kệ KN-D15", 100000.0, 15, 12, 2021, 4.7, "Nghiên cứu kinh điển về hành vi vô thức của số đông trong xã hội."},

            // --- Khoa học & Kỹ thuật (12 sách) ---
            {"Lược Sử Thời Gian (A Brief History of Time)", "978-0553380163", catScience, aHawking, pTre, "Kệ KH-E01", 130000.0, 12, 9, 2021, 4.9, "Vũ trụ học, Lỗ đen, Thuyết tương đối và Vụ nổ lớn Big Bang."},
            {"Vũ Trụ Trong Vỏ Hạt Dẻ", "978-0553802023", catScience, aHawking, pTre, "Kệ KH-E02", 165000.0, 10, 7, 2021, 4.8, "Khám phá các chiều không gian bổ sung và lý thuyết M."},
            {"Sapiens: Lược Sử Loài Người", "978-0062316097", catScience, aHarari, pTre, "Kệ KH-E03", 189000.0, 20, 15, 2022, 5.0, "Hành trình tiến hóa từ vượn nhân hình đến bá chủ địa cầu."},
            {"Homo Deus: Lược Sử Tương Lai", "978-0062464316", catScience, aHarari, pTre, "Kệ KH-E04", 195000.0, 15, 11, 2022, 4.9, "Công nghệ sinh học, trí tuệ nhân tạo và tương lai của giống loài."},
            {"Cơ Học Lượng Tử Dành Cho Người Tò Mò", "978-0262529686", catScience, aHawking, pTre, "Kệ KH-E05", 140000.0, 9, 6, 2023, 4.7, "Hiện tượng rối lượng tử, nguyên lý bất định Heisenberg dễ hiểu."},
            {"Vật Lý Thiên Văn Cho Người Vội Vã", "978-0393609394", catScience, aHawking, pTre, "Kệ KH-E06", 115000.0, 14, 11, 2022, 4.8, "Bức xạ tàn dư, vật chất tối và năng lượng tối của Neil Tyson."},
            {"Thế Giới Vi Mô & DNA Tế Bào", "978-0815344322", catScience, aHawking, pGiaoDuc, "Kệ KH-E07", 250000.0, 8, 5, 2023, 4.7, "Cấu trúc xoắn kép, chỉnh sửa gen CRISPR và sự sống sinh học."},
            {"Biến Đổi Khí Hậu: Thách Thức Thế Kỷ 21", "978-0385546132", catScience, aHarari, pTre, "Kệ KH-E08", 170000.0, 10, 8, 2023, 4.6, "Hiệu ứng nhà kính, năng lượng tái tạo và giải pháp của Bill Gates."},
            {"Lịch Sử Vạn Vật (A Short History of Nearly Everything)", "978-0767908184", catScience, aHawking, pTre, "Kệ KH-E09", 220000.0, 11, 8, 2022, 4.9, "Bách khoa toàn thư sinh động về hóa học, địa chất và sự sống."},
            {"Nguồn Gốc Các Loài (Charles Darwin)", "978-0451529060", catScience, aHawking, pGiaoDuc, "Kệ KH-E10", 180000.0, 8, 6, 2021, 4.8, "Học thuyết chọn lọc tự nhiên làm thay đổi nhận thức nhân loại."},
            {"Khoa Học Thần Kinh & Bộ Não Người", "978-0393351378", catScience, aKahneman, pTre, "Kệ KH-E11", 210000.0, 7, 5, 2023, 4.7, "Synapse thần kinh, trí nhớ, giấc mơ và cơ chế tư duy của con người."},
            {"Robot & Tự Động Hóa Trong Công Nghiệp 4.0", "978-1119538356", catScience, aAndrew, pThongTin, "Kệ KH-E12", 280000.0, 6, 4, 2024, 4.8, "Cánh tay robot công nghiệp, cảm biến và nhà máy thông minh."},

            // --- Văn học & Nghệ thuật (13 sách) ---
            {"Nhà Giả Kim (The Alchemist)", "978-0062315007", catLiterature, aPauloCoelho, pTre, "Kệ VH-F01", 79000.0, 30, 24, 2021, 5.0, "Hành trình theo đuổi vận mệnh và giấc mơ của chàng chăn cừu Santiago."},
            {"Rừng Na Uy (Norwegian Wood)", "978-0375704024", catLiterature, aMurakami, pTre, "Kệ VH-F02", 125000.0, 18, 14, 2022, 4.8, "Câu chuyện hoài niệm, tình yêu và nỗi cô đơn tuổi trẻ của Toru Watanabe."},
            {"Hoàng Tử Bé (Le Petit Prince)", "978-0156012195", catLiterature, aSaintExupery, pKimDong, "Kệ VH-F03", 65000.0, 25, 20, 2021, 4.9, "Bài học sâu sắc về tình bạn, hoa hồng và cái nhìn của trái tim."},
            {"Trăm Năm Cô Đơn (One Hundred Years of Solitude)", "978-0060883287", catLiterature, aMarquez, pTre, "Kệ VH-F04", 175000.0, 12, 9, 2022, 4.9, "Chủ nghĩa hiện thực huyền ảo về dòng họ Buendía ở Macondo."},
            {"Chiến Tranh Và Hòa Bình (Lev Tolstoy)", "978-1400079988", catLiterature, aTolstoy, pTre, "Kệ VH-F05", 290000.0, 8, 6, 2021, 4.9, "Bản hùng ca hoành tráng về xã hội Nga thời kỳ Napoléon."},
            {"Tội Ác Và Trừng Phạt (Dostoevsky)", "978-0143058144", catLiterature, aDostoevsky, pTre, "Kệ VH-F06", 185000.0, 10, 7, 2022, 4.9, "Diễn biến tâm lý phức tạp của Raskolnikov sau vụ án mạng."},
            {"Ông Già Và Biển Cả (Ernest Hemingway)", "978-0684801223", catLiterature, aHemingway, pKimDong, "Kệ VH-F07", 75000.0, 20, 16, 2021, 4.8, "Biểu tượng bất khuất về ý chí kiên cường của con người trước số phận."},
            {"Cuốn Theo Chiều Gió (Gone with the Wind)", "978-1451635621", catLiterature, aMitchell, pTre, "Kệ VH-F08", 240000.0, 11, 8, 2021, 4.8, "Mối tình Scarlett O'Hara và Rhett Butler giữa nội chiến Mỹ."},
            {"Số Đỏ (Vũ Trọng Phụng)", "978-6045618295", catLiterature, aVuTrongPhung, pKimDong, "Kệ VH-F09", 70000.0, 22, 18, 2022, 4.9, "Kiệt tác châm biếm xã hội thượng lưu Hà thành qua nhân vật Xuân Tóc Đỏ."},
            {"Nỗi Buồn Chiến Tranh (Bảo Ninh)", "978-6045620113", catLiterature, aBaoNinh, pTre, "Kệ VH-F10", 110000.0, 14, 11, 2022, 4.8, "Góc nhìn nhân bản sâu sắc và trăn trở về chiến tranh Việt Nam."},
            {"Truyện Kiều (Nguyễn Du - Bản Khảo Dị)", "978-6045601235", catLiterature, aNguyenDu, pKimDong, "Kệ VH-F11", 95000.0, 20, 16, 2021, 5.0, "Đỉnh cao thi ca dân tộc, khúc đoạn trường tân thanh về nàng Thúy Kiều."},
            {"Bắt Trẻ Đồng Xanh (The Catcher in the Rye)", "978-0316769488", catLiterature, aSalinger, pTre, "Kệ VH-F12", 90000.0, 15, 12, 2022, 4.7, "Tâm trạng hoang mang, nổi loạn và khao khát chân thật của Holden."},
            {"Đồi Gió Hú (Wuthering Heights)", "978-0141439556", catLiterature, aBronte, pTre, "Kệ VH-F13", 115000.0, 12, 9, 2021, 4.8, "Mối tình nồng cháy và báo thù tăm tối giữa Heathcliff và Catherine."},

            // --- Lịch sử & Triết học (10 sách) ---
            {"Súng, Vi Trùng Và Thép (Guns, Germs, and Steel)", "978-0393354324", catHistory, aJaredDiamond, pTre, "Kệ LS-G01", 190000.0, 12, 9, 2022, 4.9, "Các yếu tố địa lý, môi trường định hình số phận các nền văn minh."},
            {"Sử Việt - 12 Khúc Tráng Ca", "978-6045651239", catHistory, aTranTrongKim, pTre, "Kệ LS-G02", 145000.0, 25, 20, 2023, 5.0, "Những lát cắt lịch sử hào hùng và bi tráng của dân tộc Việt Nam."},
            {"Lược Sử Triết Học Phương Tây (Bertrand Russell)", "978-0415325059", catHistory, aRussell, pGiaoDuc, "Kệ LS-G03", 280000.0, 7, 5, 2022, 4.8, "Hệ thống tư tưởng từ Hy Lạp cổ đại Socrates đến hiện đại."},
            {"Khổng Tử & Luận Ngữ Bình Giải", "978-7505712345", catHistory, aKhongTu, pTre, "Kệ LS-G04", 120000.0, 15, 12, 2021, 4.7, "Cốt lõi nhân, nghĩa, lễ, trí, tín trong đạo Nho phương Đông."},
            {"Binh Pháp Tôn Tử - Nghệ Thuật Dụng Binh", "978-1590302255", catHistory, aTonTu, pTre, "Kệ LS-G05", 85000.0, 20, 16, 2022, 4.9, "13 thiên chiến lược quân sự, kinh doanh và lãnh đạo đỉnh cao."},
            {"Lịch Sử Các Nền Văn Minh Cổ Đại", "978-0199211241", catHistory, aHarari, pGiaoDuc, "Kệ LS-G06", 210000.0, 9, 7, 2022, 4.7, "Ai Cập, Lưỡng Hà, Hy Lạp, La Mã và văn minh sông Hoàng Hà."},
            {"Đại Việt Sử Ký Toàn Thư (Trọn bộ tóm lược)", "978-6045634561", catHistory, aNgoSiLien, pGiaoDuc, "Kệ LS-G07", 350000.0, 6, 4, 2022, 5.0, "Bộ quốc sử vĩ đại từ thời Hồng Bàng đến triều Hậu Lê."},
            {"Triết Học Hiện Sinh Của Jean-Paul Sartre", "978-0806509020", catHistory, aSartre, pTre, "Kệ LS-G08", 130000.0, 8, 6, 2023, 4.6, "Khái niệm tự do, trách nhiệm cá nhân và sự phi lý của tồn tại."},
            {"Đạo Đức Học (Spinoza - Ethics)", "978-0140435719", catHistory, aSpinoza, pGiaoDuc, "Kệ LS-G09", 160000.0, 6, 4, 2021, 4.7, "Luận giải hình học về Chúa, tự nhiên và tự do tâm trí con người."},
            {"Văn Minh Lúa Nước & Bản Sắc Người Việt", "978-6045678912", catHistory, aTranTrongKim, pTre, "Kệ LS-G10", 125000.0, 14, 11, 2023, 4.8, "Khảo cứu nhân học về phong tục, làng xã và tâm thức người Việt."}
        };

        List<Book> booksToSave = new ArrayList<>();
        int coverIndex = 0;

        for (Object[] row : bookRawData) {
            String title = (String) row[0];
            String isbn = (String) row[1];
            Category cat = (Category) row[2];
            Author author = (Author) row[3];
            Publisher pub = (Publisher) row[4];
            String shelf = (String) row[5];
            Double price = (Double) row[6];
            Integer total = (Integer) row[7];
            Integer avail = (Integer) row[8];
            Integer year = (Integer) row[9];
            Double rating = (Double) row[10];
            String desc = (String) row[11];

            // Kiểm tra trùng ISBN
            if (bookRepository.existsByIsbn(isbn)) {
                continue;
            }

            String cover = covers[coverIndex % covers.length];
            coverIndex++;

            Book b = Book.builder()
                    .title(title)
                    .isbn(isbn)
                    .description(desc)
                    .coverImage(cover)
                    .price(price)
                    .totalCopies(total)
                    .availableCopies(avail)
                    .publishYear(year)
                    .category(cat)
                    .author(author)
                    .publisher(pub)
                    .shelfLocation(shelf)
                    .rating(rating)
                    .build();

            booksToSave.add(b);
        }

        bookRepository.saveAll(booksToSave);
        log.info("Successfully seeded {} books into database! Total books in DB: {}", booksToSave.size(), bookRepository.count());
    }

    private void seedSampleBorrowsAndPayments() {
        if (borrowRecordRepository.count() > 0) return;

        User reader = userRepository.findByEmail("reader@library.com").orElse(null);
        if (reader == null) return;

        List<Book> allBooks = bookRepository.findAll();
        if (allBooks.size() < 3) return;

        BorrowRecord activeRecord = BorrowRecord.builder()
                .borrowCode("BR-DEMO-001")
                .user(reader)
                .book(allBooks.get(0))
                .borrowDate(LocalDate.now().minusDays(5))
                .dueDate(LocalDate.now().plusDays(9))
                .status(BorrowStatus.BORROWED)
                .notes("Mượn để làm đồ án J2EE Spring Boot GraphQL")
                .fineAmount(0.0)
                .build();

        BorrowRecord overdueRecord = BorrowRecord.builder()
                .borrowCode("BR-OVERDUE-002")
                .user(reader)
                .book(allBooks.get(1))
                .borrowDate(LocalDate.now().minusDays(20))
                .dueDate(LocalDate.now().minusDays(6))
                .status(BorrowStatus.OVERDUE)
                .notes("Sách quá hạn 6 ngày - Cần thanh toán phạt qua VNPay/SePay")
                .fineAmount(30000.0)
                .build();

        BorrowRecord returnedRecord = BorrowRecord.builder()
                .borrowCode("BR-RETURN-003")
                .user(reader)
                .book(allBooks.get(2))
                .borrowDate(LocalDate.now().minusDays(30))
                .dueDate(LocalDate.now().minusDays(16))
                .returnDate(LocalDate.now().minusDays(17))
                .status(BorrowStatus.RETURNED)
                .notes("Đã trả sách nguyên vẹn")
                .fineAmount(0.0)
                .build();

        borrowRecordRepository.saveAll(List.of(activeRecord, overdueRecord, returnedRecord));

        Payment p1 = Payment.builder()
                .transactionId("VNP14892011")
                .user(reader)
                .borrowRecord(returnedRecord)
                .amount(50000.0)
                .paymentMethod("VNPAY")
                .status(PaymentStatus.SUCCESS)
                .vnpResponseCode("00")
                .paymentDate(LocalDateTime.now().minusDays(15))
                .orderInfo("Thanh toan phi the thu vien nam 2026")
                .build();

        Payment p2 = Payment.builder()
                .transactionId("SP92837102")
                .user(reader)
                .borrowRecord(activeRecord)
                .amount(25000.0)
                .paymentMethod("SEPAY_VIETQR")
                .status(PaymentStatus.SUCCESS)
                .vnpResponseCode("SEPAY_MB182930")
                .paymentDate(LocalDateTime.now().minusDays(4))
                .orderInfo("Thanh toan phi dat coc sach qua SePay VietQR")
                .build();

        paymentRepository.saveAll(List.of(p1, p2));
        log.info("Seeded sample borrow records and payments!");
    }

    private Category getOrCreateCategory(String name, String desc, String icon) {
        return categoryRepository.findByName(name).orElseGet(() ->
                categoryRepository.save(Category.builder().name(name).description(desc).icon(icon).build())
        );
    }

    private Author getOrCreateAuthor(String name, String bio) {
        return authorRepository.findByName(name).orElseGet(() ->
                authorRepository.save(Author.builder().name(name).bio(bio).build())
        );
    }

    private Publisher getOrCreatePublisher(String name, String address) {
        return publisherRepository.findByName(name).orElseGet(() ->
                publisherRepository.save(Publisher.builder().name(name).address(address).build())
        );
    }
}
