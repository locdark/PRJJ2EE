package com.library.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.dto.AiResponseDto;
import com.library.entity.Book;
import com.library.entity.SystemSetting;
import com.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiLibrarianService {

    private final BookRepository bookRepository;
    private final SystemSettingService systemSettingService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.ai.gemini-api-key:}")
    private String defaultEnvGeminiKey;

    private static final String BACKUP_GEMINI_KEY = "AIzaSyAib_hSoeofWTPJn-H1IBoTx13uPIRt9J4";
    private static final String DEFAULT_MODEL = "gemini-flash-lite-latest";

    private static final Set<String> STOP_WORDS = Set.of(
            "chào", "xin", "hi", "hello", "alo", "ơi", "ạ", "nhé", "nha", "với", "cho",
            "tôi", "mình", "em", "anh", "chị", "bạn", "shop", "ad", "admin", "thư", "viện",
            "muốn", "cần", "hỏi", "tư", "vấn", "giúp", "tìm", "kiếm", "mua", "thuê", "mượn",
            "sách", "cuốn", "quyển", "tài", "liệu", "giáo", "trình", "nào", "hay", "tốt",
            "nhất", "về", "của", "là", "gì", "có", "không", "được", "bao", "nhiêu", "tiền",
            "giá", "phí", "cách", "làm", "sao", "để", "như", "thế", "mấy", "ngày"
    );

    private static final List<String> FALLBACK_MODELS = List.of(
            "gemini-flash-lite-latest",
            "gemini-2.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash-lite",
            "gemini-flash-latest",
            "gemini-2.5-flash"
    );

    public AiResponseDto chatWithAi(String userMessage) {
        String rawMessage = userMessage != null ? userMessage.trim() : "";
        String query = rawMessage.toLowerCase();

        boolean isPureGreeting = isGreetingIntent(query);
        boolean isPolicyOrPriceQuery = isPolicyOrPricingIntent(query);

        // 1. Tìm kiếm sách phù hợp theo ngữ nghĩa hoặc lấy sách nổi bật đại diện các ngành
        List<Book> matchedBooks = findRelevantBooks(query, isPureGreeting);
        List<Book> topCatalogBooks = bookRepository.findTop8ByOrderByRatingDesc();
        List<String> suggestedTopics = generateSuggestedTopics(query);

        // 2. Lấy cấu hình Gemini API Key & Model từ SystemSettingService
        SystemSetting settings = systemSettingService.getSettings();
        String effectiveApiKey = getEffectiveGeminiApiKey(settings);
        String configuredModel = getEffectiveGeminiModel(settings);
        boolean geminiEnabled = settings == null || settings.isGeminiEnabled();

        // 3. Gọi Google Gemini AI thực tế với cơ chế tự động thử lại các model khả dụng
        if (geminiEnabled && effectiveApiKey != null && !effectiveApiKey.trim().isEmpty()) {
            List<Book> ragBooks = new ArrayList<>(matchedBooks);
            for (Book tb : topCatalogBooks) {
                if (ragBooks.size() >= 12) break;
                if (ragBooks.stream().noneMatch(b -> Objects.equals(b.getId(), tb.getId()))) {
                    ragBooks.add(tb);
                }
            }

            String geminiReply = callGeminiWithFallback(
                    rawMessage,
                    ragBooks,
                    effectiveApiKey,
                    configuredModel,
                    getEffectiveSystemPrompt(settings)
            );

            if (geminiReply != null && !geminiReply.trim().isEmpty()) {
                // Nếu chỉ là câu chào xã giao ngắn gọn, chỉ đính kèm 3 sách nổi bật nhất
                List<Book> booksToShow = isPureGreeting
                        ? topCatalogBooks.stream().limit(3).collect(Collectors.toList())
                        : (matchedBooks.isEmpty() ? topCatalogBooks.stream().limit(4).collect(Collectors.toList()) : matchedBooks);

                return AiResponseDto.builder()
                        .reply(geminiReply.trim())
                        .recommendedBooks(booksToShow)
                        .suggestedTopics(suggestedTopics)
                        .build();
            }
        }

        // 4. Fallback thông minh theo ngữ cảnh (không bao giờ trả lời máy móc hay lộ thông báo hệ thống)
        String fallbackReply = buildSmartFallbackReply(rawMessage, query, isPureGreeting, isPolicyOrPriceQuery, matchedBooks, topCatalogBooks);
        List<Book> fallbackBooks = isPureGreeting
                ? topCatalogBooks.stream().limit(3).collect(Collectors.toList())
                : (matchedBooks.isEmpty() ? topCatalogBooks.stream().limit(4).collect(Collectors.toList()) : matchedBooks);

        return AiResponseDto.builder()
                .reply(fallbackReply)
                .recommendedBooks(fallbackBooks)
                .suggestedTopics(suggestedTopics)
                .build();
    }

    private String normalizeModelName(String model) {
        if (model == null || model.trim().isEmpty()) {
            return DEFAULT_MODEL;
        }
        String m = model.trim();
        if (m.startsWith("models/")) {
            m = m.substring("models/".length());
        }
        // Tự động ánh xạ các model cũ đã ngừng hỗ trợ trên v1beta sang model mới đang hoạt động
        if ("gemini-1.5-flash".equalsIgnoreCase(m)
                || "gemini-1.5-pro".equalsIgnoreCase(m)
                || "gemini-2.0-flash".equalsIgnoreCase(m)
                || "gemini-pro".equalsIgnoreCase(m)) {
            return DEFAULT_MODEL;
        }
        return m;
    }

    private String callGeminiWithFallback(String userMessage, List<Book> contextBooks, String primaryKey, String requestedModel, String systemPrompt) {
        String normalizedRequested = normalizeModelName(requestedModel);
        LinkedHashSet<String> modelsToTry = new LinkedHashSet<>();
        modelsToTry.add(normalizedRequested);
        modelsToTry.addAll(FALLBACK_MODELS);

        LinkedHashSet<String> keysToTry = new LinkedHashSet<>();
        if (primaryKey != null && !primaryKey.isBlank()) {
            keysToTry.add(primaryKey.trim());
        }
        if (defaultEnvGeminiKey != null && !defaultEnvGeminiKey.isBlank()) {
            keysToTry.add(defaultEnvGeminiKey.trim());
        }
        keysToTry.add(BACKUP_GEMINI_KEY);

        String promptText = buildComprehensiveConsultantPrompt(userMessage, contextBooks, systemPrompt);

        for (String key : keysToTry) {
            for (String model : modelsToTry) {
                try {
                    String reply = executeSingleGeminiCall(promptText, key, model);
                    if (reply != null && !reply.isBlank()) {
                        log.info("Gemini AI responded successfully using model: {}", model);
                        return reply;
                    }
                } catch (Exception e) {
                    log.debug("Model {} failed with key {}...: {}", model, key.substring(0, Math.min(8, key.length())), e.getMessage());
                }
            }
        }
        return null;
    }

    private String buildComprehensiveConsultantPrompt(String userMessage, List<Book> contextBooks, String systemPrompt) {
        StringBuilder catalogContext = new StringBuilder();
        catalogContext.append("THÔNG TIN DỊCH VỤ & CHÍNH SÁCH THUÊ / MƯỢN SÁCH CỦA THƯ VIỆN ĐẠI HỌC SMARTLIBRARY:\n");
        catalogContext.append("- Địa chỉ: 828 Sư Vạn Hạnh, Phường 13, Quận 10, TP. Hồ Chí Minh | Giờ mở cửa: 07:30 - 21:00 (Thứ 2 - Thứ 7).\n");
        catalogContext.append("- Biểu phí thuê sách ưu đãi: 2.000 VNĐ / ngày (Gói tiêu chuẩn 14 ngày = 28.000 VNĐ; có thể tùy chọn thuê từ 1 đến 90 ngày).\n");
        catalogContext.append("- Hạn mức mượn: Tối đa 3 - 5 cuốn cùng lúc. Hỗ trợ gia hạn trực tuyến thêm 7 ngày ngay trên website. Phí quá hạn: 5.000 VNĐ/ngày.\n");
        catalogContext.append("- Phương thức thanh toán tự động: Quét mã VietQR SePay (Ngân hàng TPBank - STK: 49431072004 - Chủ TK: LE HOAI LOC, hệ thống tự động xác nhận và duyệt phiếu mượn trong 2 giây), hoặc qua cổng VNPay / Thanh toán trực tiếp tại quầy.\n");
        catalogContext.append("- Các chuyên ngành chính (100+ đầu sách): Công nghệ thông tin & Lập trình, Trí tuệ nhân tạo & Khoa học dữ liệu, Kinh tế & Khởi nghiệp, Kỹ năng sống & Phát triển bản thân, Khoa học & Kỹ thuật, Văn học & Nghệ thuật, Lịch sử & Triết học.\n\n");

        if (!contextBooks.isEmpty()) {
            catalogContext.append("DANH SÁCH SÁCH & GIÁO TRÌNH HIỆN CÓ TRONG KHO ĐỂ TƯ VẤN CHO KHÁCH HÀNG:\n");
            for (Book b : contextBooks) {
                catalogContext.append(String.format(
                        "- Nhan đề: \"%s\" | Tác giả: %s | Chuyên ngành: %s | Vị trí kệ: %s | Số bản sẵn sàng: %d cuốn | Đánh giá: %.1f/5 | Tóm tắt: %s\n",
                        b.getTitle(),
                        b.getAuthor() != null ? b.getAuthor().getName() : "Nhiều tác giả",
                        b.getCategory() != null ? b.getCategory().getName() : "Học thuật",
                        b.getShelfLocation() != null ? b.getShelfLocation() : "Kệ A-01",
                        b.getAvailableCopies() != null ? b.getAvailableCopies() : 5,
                        b.getRating() != null ? b.getRating() : 4.8,
                        b.getDescription() != null ? b.getDescription() : "Tài liệu chuyên sâu chọn lọc."
                ));
            }
        }

        return String.format(
                "%s\n\n%s\n" +
                "TIN NHẮN CỦA KHÁCH HÀNG / ĐỘC GIẢ: \"%s\"\n\n" +
                "NGUYÊN TẮC TƯ VẤN & CHĂM SÓC KHÁCH HÀNG (BẮT BUỘC TUÂN THỦ):\n" +
                "1. Đóng vai Chuyên viên Tư vấn Sách & Học liệu thông minh, nhiệt tình, lịch sự và am hiểu sâu sắc toàn bộ kho sách cũng như chính sách thuê sách.\n" +
                "2. Nếu khách hàng chỉ chào hỏi xã giao (ví dụ: \"chào\", \"hi\", \"xin chào\", \"alo\"), hãy chào đón nồng nhiệt, giới thiệu ngắn gọn các dịch vụ (tư vấn chọn sách theo mục tiêu học tập/công việc, báo giá thuê 2.000đ/ngày thanh toán QR tự động, tra cứu vị trí kệ sách) và hỏi xem khách đang quan tâm đến lĩnh vực nào.\n" +
                "3. Nếu khách hàng hỏi tư vấn chọn sách, lộ trình học, hoặc muốn tìm mua/thuê sách theo nhu cầu: hãy phân tích nhu cầu của khách, đề xuất 2-4 cuốn sách phù hợp nhất từ danh sách trên, nêu rõ **lý do nên đọc**, **vị trí kệ**, **tình trạng còn sách**, và **chi phí thuê (ví dụ 28.000 VNĐ / 14 ngày)**.\n" +
                "4. Nếu khách hàng hỏi về giá thuê, cách mượn, thanh toán hoặc quy định: giải thích rõ ràng, minh bạch biểu phí 2.000đ/ngày và hướng dẫn bấm nút **\"Đăng ký mượn\"** để quét mã VietQR TPBank duyệt tự động.\n" +
                "5. Trình bày đẹp mắt bằng Markdown (dùng bullet points `-` hoặc `•` và in đậm `**Tên sách**`), giọng văn tự nhiên, thuyết phục như một chuyên gia tư vấn sách thực thụ.",
                systemPrompt, catalogContext.toString(), userMessage
        );
    }

    private String executeSingleGeminiCall(String promptText, String apiKey, String modelName) throws Exception {
        String cleanModel = modelName.startsWith("models/") ? modelName.substring("models/".length()) : modelName;
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                URLEncoder.encode(cleanModel, StandardCharsets.UTF_8),
                URLEncoder.encode(apiKey.trim(), StandardCharsets.UTF_8));

        Map<String, Object> textPart = Map.of("text", promptText);
        Map<String, Object> contentObj = Map.of("parts", List.of(textPart));
        Map<String, Object> generationConfig = Map.of(
                "temperature", 0.7,
                "maxOutputTokens", 900
        );
        Map<String, Object> requestPayload = Map.of(
                "contents", List.of(contentObj),
                "generationConfig", generationConfig
        );

        String jsonBody = objectMapper.writeValueAsString(requestPayload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json; charset=utf-8")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        if (response.statusCode() == 200) {
            JsonNode rootNode = objectMapper.readTree(response.body());
            JsonNode candidates = rootNode.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText();
                }
            }
        }
        throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
    }

    /**
     * Lấy danh sách các Model Gemini khả dụng trực tiếp từ Google API theo API Key
     */
    public Map<String, Object> listAvailableGeminiModels(String apiKey) {
        SystemSetting settings = systemSettingService.getSettings();
        String effectiveKey = (apiKey != null && !apiKey.trim().isEmpty())
                ? apiKey.trim()
                : getEffectiveGeminiApiKey(settings);

        if (effectiveKey == null || effectiveKey.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Vui lòng nhập Google Gemini API Key để quét danh sách model.",
                    "models", List.of()
            );
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models?key=" + URLEncoder.encode(effectiveKey, StandardCharsets.UTF_8);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (resp.statusCode() != 200) {
                return Map.of(
                        "success", false,
                        "message", "API Key không hợp lệ hoặc Google từ chối truy cập (HTTP " + resp.statusCode() + ").",
                        "models", List.of()
                );
            }

            JsonNode root = objectMapper.readTree(resp.body());
            JsonNode modelsNode = root.path("models");
            List<Map<String, String>> availableModels = new ArrayList<>();

            if (modelsNode.isArray()) {
                for (JsonNode m : modelsNode) {
                    boolean supportsGenerate = false;
                    JsonNode methods = m.path("supportedGenerationMethods");
                    if (methods.isArray()) {
                        for (JsonNode method : methods) {
                            if ("generateContent".equalsIgnoreCase(method.asText())) {
                                supportsGenerate = true;
                                break;
                            }
                        }
                    }
                    if (!supportsGenerate) continue;

                    String rawName = m.path("name").asText("");
                    String id = rawName.startsWith("models/") ? rawName.substring("models/".length()) : rawName;
                    // Lọc bỏ các model chuyên tạo ảnh/âm thanh/embedding để Admin dễ chọn model chat
                    if (id.contains("image") || id.contains("tts") || id.contains("lyria") || id.contains("robotics") || id.contains("computer-use") || id.contains("transcribe")) {
                        continue;
                    }
                    String displayName = m.path("displayName").asText(id);
                    String description = m.path("description").asText("");
                    availableModels.add(Map.of(
                            "id", id,
                            "displayName", displayName + " (" + id + ")",
                            "description", description
                    ));
                }
            }

            return Map.of(
                    "success", true,
                    "count", availableModels.size(),
                    "models", availableModels,
                    "recommendedModel", DEFAULT_MODEL,
                    "message", "Đã tìm thấy " + availableModels.size() + " model ngôn ngữ khả dụng trên API Key này!"
            );
        } catch (Exception e) {
            return Map.of(
                    "success", false,
                    "message", "Lỗi khi quét danh sách model: " + e.getMessage(),
                    "models", List.of()
            );
        }
    }

    /**
     * Test kết nối Google Gemini API Key & Test Model với câu hỏi tùy chọn
     */
    public Map<String, Object> testGeminiConnection(String apiKey, String model, String customPrompt) {
        SystemSetting settings = systemSettingService.getSettings();
        String effectiveKey = (apiKey != null && !apiKey.trim().isEmpty())
                ? apiKey.trim()
                : getEffectiveGeminiApiKey(settings);

        if (effectiveKey == null || effectiveKey.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Vui lòng nhập Google Gemini API Key để kiểm tra kết nối."
            );
        }

        String requestedModel = (model != null && !model.trim().isEmpty()) ? model.trim() : DEFAULT_MODEL;
        String cleanRequested = requestedModel.startsWith("models/") ? requestedModel.substring("models/".length()) : requestedModel;
        String testQuestion = (customPrompt != null && !customPrompt.trim().isEmpty())
                ? customPrompt.trim()
                : "Xin chào! Hãy đóng vai Chuyên viên Tư vấn Sách của Thư viện Đại học SmartLibrary, giới thiệu ngắn gọn 2 câu về dịch vụ tư vấn chọn sách và thuê sách trực tuyến (2.000đ/ngày).";

        LinkedHashSet<String> candidateModels = new LinkedHashSet<>();
        candidateModels.add(cleanRequested);
        if ("gemini-1.5-flash".equalsIgnoreCase(cleanRequested) || "gemini-2.0-flash".equalsIgnoreCase(cleanRequested)) {
            candidateModels.add(DEFAULT_MODEL);
        }
        candidateModels.addAll(FALLBACK_MODELS);

        String lastError = "";
        for (String candidateModel : candidateModels) {
            try {
                long startTime = System.currentTimeMillis();
                String reply = executeSingleGeminiCall(testQuestion, effectiveKey, candidateModel);
                long latency = System.currentTimeMillis() - startTime;

                if (reply != null && !reply.isBlank()) {
                    boolean autoSwitched = !candidateModel.equalsIgnoreCase(cleanRequested);
                    String msg = autoSwitched
                            ? String.format("Model '%s' đã ngừng hỗ trợ hoặc quá tải — Hệ thống tự động chuyển sang '%s' và phản hồi thành công sau %d ms!", cleanRequested, candidateModel, latency)
                            : String.format("Kết nối thành công! Model '%s' phản hồi chính xác sau %d ms.", candidateModel, latency);

                    return Map.of(
                            "success", true,
                            "message", msg,
                            "latencyMs", latency,
                            "requestedModel", cleanRequested,
                            "model", candidateModel,
                            "autoSwitched", autoSwitched,
                            "sampleReply", reply.trim()
                    );
                }
            } catch (Exception e) {
                lastError = e.getMessage();
            }
        }

        return Map.of(
                "success", false,
                "requestedModel", cleanRequested,
                "message", "Không thể gọi model '" + cleanRequested + "'. Chi tiết: " + (lastError.length() > 180 ? lastError.substring(0, 180) + "..." : lastError)
        );
    }

    public Map<String, Object> testGeminiConnection(String apiKey, String model) {
        return testGeminiConnection(apiKey, model, null);
    }

    private boolean isGreetingIntent(String query) {
        String clean = query.replaceAll("[!.,?~]", "").trim();
        return Set.of(
                "chào", "xin chào", "chao", "xin chao", "hi", "hello", "alo", "chào bạn",
                "chào shop", "chào ad", "chào thư viện", "bạn ơi", "ad ơi", "ai ơi", "tư vấn", "tư vấn giúp mình"
        ).contains(clean);
    }

    private boolean isPolicyOrPricingIntent(String query) {
        return query.contains("giá") || query.contains("bao nhiêu tiền") || query.contains("phí thuê")
                || query.contains("phí mượn") || query.contains("thanh toán") || query.contains("chuyển khoản")
                || query.contains("mấy ngày") || query.contains("quy định") || query.contains("thủ tục")
                || query.contains("cách mượn") || query.contains("gia hạn") || query.contains("phạt");
    }

    private String buildSmartFallbackReply(String rawMessage, String query, boolean isPureGreeting, boolean isPolicyOrPriceQuery, List<Book> matchedBooks, List<Book> topBooks) {
        if (isPureGreeting) {
            return "Xin chào bạn! 👋 Mình là **Chuyên viên Tư vấn Sách & Học liệu AI** của **Trung tâm Thông tin – Thư viện Đại học SmartLibrary**.\n\n" +
                    "Mình có thể hỗ trợ bạn ngay các nhu cầu sau:\n" +
                    "• **Tư vấn chọn sách & giáo trình chuẩn xác** theo ngành học, mục tiêu nghề nghiệp hoặc sở thích cá nhân.\n" +
                    "• **Báo giá thuê ưu đãi**: Chỉ **2.000 VNĐ/ngày** (Gói 14 ngày = **28.000 VNĐ**), quét mã **VietQR TPBank** duyệt phiếu tự động trong 2 giây.\n" +
                    "• **Tra cứu nhanh vị trí kệ sách** và tóm tắt nội dung cốt lõi của hơn **100+ đầu sách học thuật & kỹ năng**.\n\n" +
                    "Bạn đang tìm sách về **Lập trình – CNTT**, **Trí tuệ nhân tạo (AI)**, **Kinh tế – Khởi nghiệp**, **Kỹ năng sống** hay **Văn học – Lịch sử** để mình gợi ý cuốn phù hợp nhất nhé?";
        }

        if (isPolicyOrPriceQuery) {
            return "Dạ mình xin gửi thông tin **Biểu phí thuê sách & Quy trình mượn tự động** tại **SmartLibrary** để bạn dễ dàng lựa chọn ạ:\n\n" +
                    "• **Đơn giá thuê sách**: **2.000 VNĐ / ngày** (Mặc định gói 14 ngày là **28.000 VNĐ**, bạn có thể tùy chọn linh hoạt từ 1 đến 90 ngày).\n" +
                    "• **Hạn mức & Gia hạn**: Mỗi độc giả được mượn tối đa **3 – 5 cuốn** cùng lúc và hỗ trợ **gia hạn trực tuyến thêm 7 ngày** ngay tại mục *Sách Đang Mượn*.\n" +
                    "• **Thanh toán siêu tốc qua VietQR SePay**: Khi bấm **Đăng ký mượn**, hệ thống hiển thị mã QR ngân hàng **TPBank (49431072004 - LE HOAI LOC)** điền sẵn số tiền và mã đơn `LIB...`. Ngay khi bạn chuyển khoản, hệ thống tự động xác nhận trong **2 giây**!\n\n" +
                    "Bạn muốn mình tư vấn thêm đầu sách cụ thể nào để đăng ký mượn ngay không ạ?";
        }

        List<Book> targetBooks = matchedBooks.isEmpty() ? topBooks.stream().limit(4).collect(Collectors.toList()) : matchedBooks;
        String bookBullets = targetBooks.stream()
                .map(b -> String.format("• **\"%s\"** — *Tác giả: %s* | Chuyên ngành: **%s** | Vị trí: **%s** *(Còn %d bản • Phí thuê 14 ngày: 28.000đ)*",
                        b.getTitle(),
                        b.getAuthor() != null ? b.getAuthor().getName() : "Nhiều tác giả",
                        b.getCategory() != null ? b.getCategory().getName() : "Tổng hợp",
                        b.getShelfLocation() != null ? b.getShelfLocation() : "Kệ A-01",
                        b.getAvailableCopies() != null ? b.getAvailableCopies() : 5))
                .collect(Collectors.joining("\n"));

        if (!matchedBooks.isEmpty()) {
            return String.format(
                    "Dạ với nhu cầu tìm hiểu về **\"%s\"**, mình xin đề xuất **%d đầu sách chất lượng và sát nhu cầu nhất** hiện đang có sẵn trên kệ thư viện:\n\n%s\n\n" +
                    "💡 **Lời khuyên tư vấn**: Bạn có thể nhấn trực tiếp vào thẻ sách bên dưới để **nghe tóm tắt nội dung**, **lấy trích dẫn học thuật** hoặc bấm **Đăng ký mượn** (quét mã VietQR duyệt tự động ngay lập tức) nhé!",
                    rawMessage, matchedBooks.size(), bookBullets
            );
        }

        return "Dạ hiện tại với từ khóa **\"" + rawMessage + "\"**, mình xin gợi ý cho bạn **các đầu sách tiêu biểu được độc giả đánh giá cao nhất** tại thư viện:\n\n" +
                bookBullets + "\n\n" +
                "Bạn có thể cho mình biết thêm bạn đang muốn tìm sách phục vụ **môn học chuyên ngành**, **làm đồ án/luận văn**, hay **phát triển kỹ năng cá nhân** để mình lọc chính xác hơn nhé!";
    }

    private String getEffectiveGeminiApiKey(SystemSetting setting) {
        if (setting != null && setting.getGeminiApiKey() != null && !setting.getGeminiApiKey().trim().isEmpty()) {
            return setting.getGeminiApiKey().trim();
        }
        if (defaultEnvGeminiKey != null && !defaultEnvGeminiKey.trim().isEmpty()) {
            return defaultEnvGeminiKey.trim();
        }
        return BACKUP_GEMINI_KEY;
    }

    private String getEffectiveGeminiModel(SystemSetting setting) {
        if (setting != null && setting.getGeminiModel() != null && !setting.getGeminiModel().trim().isEmpty()) {
            return normalizeModelName(setting.getGeminiModel().trim());
        }
        return DEFAULT_MODEL;
    }

    private String getEffectiveSystemPrompt(SystemSetting setting) {
        if (setting != null && setting.getGeminiSystemPrompt() != null && !setting.getGeminiSystemPrompt().trim().isEmpty()) {
            return setting.getGeminiSystemPrompt().trim();
        }
        return "Bạn là Chuyên viên Tư vấn Sách & Học liệu AI của Trung tâm Thông tin – Thư viện Đại học SmartLibrary. Hãy tư vấn chọn sách, giải đáp thắc mắc về phí thuê sách và hỗ trợ độc giả nhiệt tình, chuẩn xác.";
    }

    public List<Book> recommendBooksByInterest(String interest) {
        return findRelevantBooks(interest.toLowerCase(), false);
    }

    private List<Book> findRelevantBooks(String query, boolean isPureGreeting) {
        if (isPureGreeting) {
            return bookRepository.findTop8ByOrderByRatingDesc().stream().limit(3).collect(Collectors.toList());
        }

        String cleaned = query.replaceAll("[^a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\\s]", " ");
        String[] rawTokens = cleaned.split("\\s+");
        List<String> meaningfulKeywords = new ArrayList<>();
        for (String token : rawTokens) {
            String t = token.trim().toLowerCase();
            if (t.length() >= 2 && !STOP_WORDS.contains(t)) {
                meaningfulKeywords.add(t);
            }
        }

        // Bổ sung từ khóa mở rộng theo chủ đề phổ biến
        if (query.contains("code") || query.contains("it") || query.contains("cntt") || query.contains("phần mềm") || query.contains("web")) {
            meaningfulKeywords.add("lập trình");
        }
        if (query.contains("ai") || query.contains("machine learning") || query.contains("dữ liệu")) {
            meaningfulKeywords.add("trí tuệ");
        }
        if (query.contains("bán hàng") || query.contains("kinh doanh") || query.contains("làm giàu") || query.contains("đầu tư") || query.contains("marketing")) {
            meaningfulKeywords.add("kinh tế");
            meaningfulKeywords.add("khởi nghiệp");
        }
        if (query.contains("giao tiếp") || query.contains("thói quen") || query.contains("tâm lý") || query.contains("bản thân")) {
            meaningfulKeywords.add("kỹ năng");
        }

        if (meaningfulKeywords.isEmpty()) {
            return bookRepository.findTop8ByOrderByRatingDesc().stream().limit(4).collect(Collectors.toList());
        }

        Map<Long, Book> candidateBooksById = new LinkedHashMap<>();
        for (String kw : meaningfulKeywords) {
            for (Book b : bookRepository.findBySemanticTerm(kw)) {
                candidateBooksById.putIfAbsent(b.getId(), b);
            }
        }

        if (candidateBooksById.isEmpty()) {
            return List.of();
        }

        Map<Book, Integer> scoredBooks = new HashMap<>();
        for (Book book : candidateBooksById.values()) {
            int score = 0;
            String title = (book.getTitle() != null ? book.getTitle() : "").toLowerCase();
            String desc = (book.getDescription() != null ? book.getDescription() : "").toLowerCase();
            String cat = (book.getCategory() != null ? book.getCategory().getName() : "").toLowerCase();
            String author = (book.getAuthor() != null ? book.getAuthor().getName() : "").toLowerCase();

            for (String kw : meaningfulKeywords) {
                if (title.contains(kw)) score += 6;
                if (cat.contains(kw)) score += 5;
                if (author.contains(kw)) score += 4;
                if (desc.contains(kw)) score += 2;
            }

            if (score > 0) {
                scoredBooks.put(book, score);
            }
        }

        return scoredBooks.entrySet().stream()
                .sorted(Map.Entry.<Book, Integer>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private List<String> generateSuggestedTopics(String query) {
        List<String> topics = new ArrayList<>();
        if (query.contains("lập trình") || query.contains("code") || query.contains("java") || query.contains("web")) {
            topics.add("Gợi ý sách Lập trình cho người mới bắt đầu");
            topics.add("Giáo trình Cấu trúc dữ liệu & Giải thuật");
            topics.add("Sách Thiết kế hệ thống & Kiến trúc phần mềm");
        } else if (query.contains("ai") || query.contains("trí tuệ nhân tạo") || query.contains("data") || query.contains("dữ liệu")) {
            topics.add("Lộ trình đọc sách Trí tuệ nhân tạo & Machine Learning");
            topics.add("Sách Phân tích dữ liệu & Khoa học dữ liệu");
            topics.add("Ứng dụng AI trong công việc và nghiên cứu");
        } else if (query.contains("kinh tế") || query.contains("kinh doanh") || query.contains("khởi nghiệp") || query.contains("tài chính")) {
            topics.add("Top sách Kinh doanh & Khởi nghiệp bán chạy nhất");
            topics.add("Sách Quản trị tài chính cá nhân & Đầu tư");
            topics.add("Chiến lược Marketing & Quản trị doanh nghiệp");
        } else {
            topics.add("Tư vấn sách Lập trình & Công nghệ thông tin");
            topics.add("Top sách Kinh doanh & Kỹ năng sống hay nhất");
            topics.add("Biểu phí thuê sách & cách thanh toán QR tự động");
        }
        return topics;
    }
}
