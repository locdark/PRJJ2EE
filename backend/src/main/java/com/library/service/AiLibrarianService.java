package com.library.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.dto.AiResponseDto;
import com.library.entity.Book;
import com.library.entity.SystemSetting;
import com.library.repository.BookRepository;
import com.library.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiLibrarianService {

    private final BookRepository bookRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.ai.gemini-api-key:}")
    private String defaultEnvGeminiKey;

    public AiResponseDto chatWithAi(String userMessage) {
        String query = userMessage.toLowerCase().trim();

        // 1. Tìm kiếm sách liên quan trong CSDL thư viện (RAG context)
        List<Book> matchedBooks = findRelevantBooks(query);
        List<String> suggestedTopics = generateSuggestedTopics(query);

        // 2. Lấy cấu hình Gemini API Key từ Database hoặc Env
        String effectiveApiKey = getEffectiveGeminiApiKey();
        String model = getEffectiveGeminiModel();
        boolean geminiEnabled = isGeminiEnabled();

        // 3. Nếu Admin đã cấu hình Gemini API Key -> Gọi Google Gemini AI
        if (geminiEnabled && effectiveApiKey != null && !effectiveApiKey.trim().isEmpty()) {
            try {
                String geminiReply = callGeminiGenerateContent(userMessage, matchedBooks, effectiveApiKey, model);
                if (geminiReply != null && !geminiReply.trim().isEmpty()) {
                    return AiResponseDto.builder()
                            .reply(geminiReply)
                            .recommendedBooks(matchedBooks)
                            .suggestedTopics(suggestedTopics)
                            .build();
                }
            } catch (Exception e) {
                log.warn("Gemini API call failed, falling back to smart local catalog matcher: {}", e.getMessage());
            }
        }

        // 4. Fallback: Trả lời thông minh dựa trên CSDL thư viện nội bộ
        String reply;
        if (!matchedBooks.isEmpty()) {
            String bookTitles = matchedBooks.stream()
                    .map(b -> "• **\"" + b.getTitle() + "\"** (Tác giả: " + (b.getAuthor() != null ? b.getAuthor().getName() : "Đang cập nhật") + " - Vị trí: " + b.getShelfLocation() + ")")
                    .collect(Collectors.joining("\n"));

            reply = String.format(
                    "Xin chào! Tôi là Trợ lý AI của Thư viện Số SmartLibrary. 🤖\n\n" +
                    "Dựa trên yêu cầu **\"%s\"** của bạn, tôi đã tra cứu kho sách và tìm thấy %d tài liệu phù hợp nhất:\n\n%s\n\n" +
                    "💡 **Gợi ý học tập**: Bạn có thể nhấn trực tiếp vào từng cuốn sách trong danh sách bên dưới để xem tóm tắt nội dung và đăng ký mượn trực tuyến ngay nhé!\n\n" +
                    "*(Gợi ý cho Admin: Bạn có thể cấu hình Google Gemini API Key trong menu Cấu hình để kích hoạt mô hình ngôn ngữ lớn thế hệ mới)*",
                    userMessage, matchedBooks.size(), bookTitles
            );
        } else {
            List<Book> topBooks = bookRepository.findTop8ByOrderByRatingDesc();
            String bookTitles = topBooks.stream().limit(3)
                    .map(b -> "• **\"" + b.getTitle() + "\"**")
                    .collect(Collectors.joining("\n"));

            reply = "Chào bạn! Tôi là Trợ lý AI Thư viện SmartLibrary. " +
                    "Tôi chưa tìm thấy chính xác cuốn sách chứa từ khóa này, nhưng đây là một số giáo trình xuất sắc được bạn đọc mượn nhiều nhất:\n\n" +
                    bookTitles + "\n\nBạn có thể thử tìm theo các chuyên ngành: *Lập trình Java*, *Trí tuệ nhân tạo*, *Kinh tế & Khởi nghiệp*, *Kỹ năng sống* nhé!";
            matchedBooks = topBooks.stream().limit(3).collect(Collectors.toList());
        }

        return AiResponseDto.builder()
                .reply(reply)
                .recommendedBooks(matchedBooks)
                .suggestedTopics(suggestedTopics)
                .build();
    }

    /**
     * Gọi Google Gemini API với RAG (Context từ kho sách thư viện)
     */
    private String callGeminiGenerateContent(String userMessage, List<Book> contextBooks, String apiKey, String model) throws Exception {
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey);

        // Tạo ngữ cảnh kho sách để Gemini biết chính xác sách của thư viện
        StringBuilder catalogContext = new StringBuilder();
        if (!contextBooks.isEmpty()) {
            catalogContext.append("\nDanh sách các tài liệu học thuật hiện có sẵn trong kho thư viện:\n");
            for (Book b : contextBooks) {
                catalogContext.append(String.format("- Nhan đề: \"%s\" | Tác giả: %s | Chuyên ngành: %s | Kệ: %s | Còn lại: %d cuốn\n",
                        b.getTitle(),
                        b.getAuthor() != null ? b.getAuthor().getName() : "Nhiều tác giả",
                        b.getCategory() != null ? b.getCategory().getName() : "Chung",
                        b.getShelfLocation(),
                        b.getAvailableCopies()
                ));
            }
        }

        String systemPrompt = getEffectiveSystemPrompt();

        String combinedPrompt = String.format(
                "%s\n\n%s\n\nCâu hỏi/Yêu cầu của độc giả: \"%s\"\n\n" +
                "Hướng dẫn trả lời:\n" +
                "1. Trả lời bằng tiếng Việt thân thiện, chuyên nghiệp, hỗ trợ sinh viên học tập và nghiên cứu.\n" +
                "2. Nếu câu hỏi liên quan đến môn học, hãy tư vấn phương pháp học và giới thiệu chính xác các cuốn sách có trong kho sách thư viện ở trên.\n" +
                "3. Định dạng câu trả lời đẹp mắt bằng Markdown (dùng bullet points, in đậm tên sách).\n" +
                "4. Giữ câu trả lời súc tích, truyền cảm hứng và mời độc giả mượn sách.",
                systemPrompt, catalogContext.toString(), userMessage
        );

        Map<String, Object> textPart = Map.of("text", combinedPrompt);
        Map<String, Object> contentObj = Map.of("parts", List.of(textPart));
        Map<String, Object> requestPayload = Map.of("contents", List.of(contentObj));

        String jsonBody = objectMapper.writeValueAsString(requestPayload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode rootNode = objectMapper.readTree(response.body());
            JsonNode candidates = rootNode.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText();
                }
            }
        } else {
            log.error("Gemini API returned error code {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Gemini API error code: " + response.statusCode());
        }

        return null;
    }

    /**
     * Test kết nối Google Gemini API Key
     */
    public Map<String, Object> testGeminiConnection(String apiKey, String model) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Vui lòng nhập Google Gemini API Key để kiểm tra kết nối."
            );
        }

        String effectiveModel = (model != null && !model.trim().isEmpty()) ? model.trim() : "gemini-1.5-flash";
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", effectiveModel, apiKey.trim());

        try {
            long startTime = System.currentTimeMillis();
            Map<String, Object> textPart = Map.of("text", "Xin chào! Bạn có hoạt động tốt không? Trả lời ngắn gọn dưới 10 từ.");
            Map<String, Object> contentObj = Map.of("parts", List.of(textPart));
            Map<String, Object> requestPayload = Map.of("contents", List.of(contentObj));

            String jsonBody = objectMapper.writeValueAsString(requestPayload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long latency = System.currentTimeMillis() - startTime;

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                String reply = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
                return Map.of(
                        "success", true,
                        "message", "Kết nối Google Gemini API thành công! Mô hình " + effectiveModel + " đã sẵn sàng tư vấn sách.",
                        "latencyMs", latency,
                        "model", effectiveModel,
                        "sampleReply", reply.trim()
                );
            } else {
                return Map.of(
                        "success", false,
                        "message", "Google Gemini từ chối kết nối (Mã lỗi " + response.statusCode() + "). Vui lòng kiểm tra lại API Key.",
                        "httpStatus", response.statusCode()
                );
            }
        } catch (Exception e) {
            return Map.of(
                    "success", false,
                    "message", "Không thể kết nối đến Gemini API: " + e.getMessage()
            );
        }
    }

    private String getEffectiveGeminiApiKey() {
        Optional<SystemSetting> setting = systemSettingRepository.findAll().stream().findFirst();
        if (setting.isPresent() && setting.get().getGeminiApiKey() != null && !setting.get().getGeminiApiKey().trim().isEmpty()) {
            return setting.get().getGeminiApiKey().trim();
        }
        return defaultEnvGeminiKey;
    }

    private String getEffectiveGeminiModel() {
        Optional<SystemSetting> setting = systemSettingRepository.findAll().stream().findFirst();
        if (setting.isPresent() && setting.get().getGeminiModel() != null && !setting.get().getGeminiModel().trim().isEmpty()) {
            return setting.get().getGeminiModel().trim();
        }
        return "gemini-1.5-flash";
    }

    private boolean isGeminiEnabled() {
        Optional<SystemSetting> setting = systemSettingRepository.findAll().stream().findFirst();
        return setting.map(SystemSetting::isGeminiEnabled).orElse(true);
    }

    private String getEffectiveSystemPrompt() {
        Optional<SystemSetting> setting = systemSettingRepository.findAll().stream().findFirst();
        if (setting.isPresent() && setting.get().getGeminiSystemPrompt() != null && !setting.get().getGeminiSystemPrompt().trim().isEmpty()) {
            return setting.get().getGeminiSystemPrompt().trim();
        }
        return "Bạn là Trợ lý Thủ thư AI thông minh của Thư viện Số SmartLibrary.";
    }

    public List<Book> recommendBooksByInterest(String interest) {
        return findRelevantBooks(interest.toLowerCase());
    }

    private List<Book> findRelevantBooks(String query) {
        List<Book> allBooks = bookRepository.findAll();
        Map<Book, Integer> scoredBooks = new HashMap<>();

        String[] keywords = query.split("\\s+");

        for (Book book : allBooks) {
            int score = 0;
            String title = (book.getTitle() != null ? book.getTitle() : "").toLowerCase();
            String desc = (book.getDescription() != null ? book.getDescription() : "").toLowerCase();
            String cat = (book.getCategory() != null ? book.getCategory().getName() : "").toLowerCase();
            String author = (book.getAuthor() != null ? book.getAuthor().getName() : "").toLowerCase();

            for (String kw : keywords) {
                if (kw.length() < 2) continue;
                if (title.contains(kw)) score += 6;
                if (cat.contains(kw)) score += 4;
                if (desc.contains(kw)) score += 2;
                if (author.contains(kw)) score += 3;
            }

            if (score > 0) {
                scoredBooks.put(book, score);
            }
        }

        if (scoredBooks.isEmpty()) {
            return bookRepository.findTop8ByOrderByRatingDesc().stream().limit(4).collect(Collectors.toList());
        }

        return scoredBooks.entrySet().stream()
                .sorted(Map.Entry.<Book, Integer>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private List<String> generateSuggestedTopics(String query) {
        List<String> topics = new ArrayList<>();
        if (query.contains("lập trình") || query.contains("code") || query.contains("java") || query.contains("web") || query.contains("spring")) {
            topics.add("Lộ trình trở thành Fullstack Java & Spring Boot Developer");
            topics.add("Kiến trúc Microservices & Spring Cloud thực chiến");
            topics.add("Thiết kế GraphQL API hiệu năng cao");
        } else if (query.contains("ai") || query.contains("trí tuệ nhân tạo") || query.contains("data") || query.contains("máy")) {
            topics.add("Machine Learning & Deep Learning cơ bản đến nâng cao");
            topics.add("Ứng dụng Generative AI & LLMs trong chuyển đổi số");
            topics.add("Xử lý dữ liệu lớn với PySpark & Python");
        } else if (query.contains("kinh tế") || query.contains("tài chính") || query.contains("khởi nghiệp")) {
            topics.add("Fintech & Ngân hàng số tại Việt Nam");
            topics.add("Khởi nghiệp tinh gọn (Lean Startup) cho sinh viên");
            topics.add("Quản trị tài chính doanh nghiệp hiện đại");
        } else {
            topics.add("Kỹ năng quản lý thời gian và giải quyết vấn đề");
            topics.add("Tâm lý học hành vi độc giả");
            topics.add("Tư duy phản biện và phương pháp nghiên cứu khoa học");
        }
        return topics;
    }
}
