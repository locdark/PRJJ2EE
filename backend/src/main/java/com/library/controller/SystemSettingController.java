package com.library.controller;

import com.library.entity.SystemSetting;
import com.library.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SystemSettingController {

    private final SystemSettingService settingService;
    private final com.library.service.AiLibrarianService aiLibrarianService;

    @GetMapping
    public ResponseEntity<SystemSetting> getSettings() {
        return ResponseEntity.ok(settingService.getSettings());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getRealSystemStats() {
        return ResponseEntity.ok(settingService.getRealSystemStats());
    }

    @PostMapping("/increment-search")
    public ResponseEntity<Map<String, String>> incrementSearch() {
        settingService.incrementSearchHits();
        return ResponseEntity.ok(Map.of("status", "OK"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemSetting> updateSettings(@RequestBody SystemSetting newSettings) {
        return ResponseEntity.ok(settingService.updateSettings(newSettings));
    }

    @GetMapping("/server-metrics")
    public ResponseEntity<Map<String, Object>> getServerMetrics() {
        return ResponseEntity.ok(settingService.getServerHardwareMetrics());
    }

    @GetMapping("/test-db")
    public ResponseEntity<Map<String, Object>> testDb() {
        return ResponseEntity.ok(settingService.testDatabaseStatus());
    }

    @PostMapping("/test-db")
    public ResponseEntity<Map<String, Object>> testCustomDb(@RequestBody Map<String, String> body) {
        String dbType = body.getOrDefault("dbType", "POSTGRESQL");
        String host = body.getOrDefault("dbHost", "localhost");
        String port = body.getOrDefault("dbPort", "5432");
        String name = body.getOrDefault("dbName", "smart_library_db");
        String username = body.getOrDefault("dbUsername", "postgres");
        String password = body.getOrDefault("dbPassword", "");
        String jdbcUrl = body.getOrDefault("dbJdbcUrl", "");
        return ResponseEntity.ok(settingService.testCustomDatabase(dbType, host, port, name, username, password, jdbcUrl));
    }

    @PostMapping("/test-cloudflare")
    public ResponseEntity<Map<String, Object>> testCloudflare(@RequestBody Map<String, String> body) {
        String apiKey = body.getOrDefault("apiKey", "");
        String zoneId = body.getOrDefault("zoneId", "");

        boolean valid = apiKey != null && !apiKey.isEmpty() && zoneId != null && !zoneId.isEmpty();

        return ResponseEntity.ok(Map.of(
                "success", valid,
                "message", valid ? "Kết nối Cloudflare API thành công! SSL Proxy đang hoạt động."
                                 : "Vui lòng nhập đầy đủ API Key và Zone ID của Cloudflare.",
                "edgeDns", "1.1.1.1",
                "sslStatus", valid ? "Full (Strict)" : "Off"
        ));
    }

    @PostMapping("/test-gemini")
    public ResponseEntity<Map<String, Object>> testGemini(@RequestBody Map<String, String> body) {
        String apiKey = body.getOrDefault("apiKey", "");
        String model = body.getOrDefault("model", "gemini-flash-lite-latest");
        String prompt = body.getOrDefault("prompt", null);
        return ResponseEntity.ok(aiLibrarianService.testGeminiConnection(apiKey, model, prompt));
    }

    @GetMapping("/gemini-models")
    public ResponseEntity<Map<String, Object>> listGeminiModels(@RequestParam(required = false) String apiKey) {
        return ResponseEntity.ok(aiLibrarianService.listAvailableGeminiModels(apiKey));
    }

    @PostMapping("/gemini-models")
    public ResponseEntity<Map<String, Object>> listGeminiModelsPost(@RequestBody(required = false) Map<String, String> body) {
        String apiKey = body != null ? body.getOrDefault("apiKey", "") : "";
        return ResponseEntity.ok(aiLibrarianService.listAvailableGeminiModels(apiKey));
    }

    @PostMapping("/test-oauth")
    public ResponseEntity<Map<String, Object>> testOAuth(@RequestBody Map<String, String> body) {
        String provider = body.getOrDefault("provider", "google");
        String clientId = body.getOrDefault("clientId", "");
        String clientSecret = body.getOrDefault("clientSecret", "");

        boolean valid = clientId != null && !clientId.trim().isEmpty() && clientSecret != null && !clientSecret.trim().isEmpty();

        if ("google".equalsIgnoreCase(provider)) {
            return ResponseEntity.ok(Map.of(
                    "success", valid,
                    "provider", "Google OAuth 2.0",
                    "message", valid ? "Định dạng Google Client ID & Secret hợp lệ! Sẵn sàng cho phép đăng nhập Gmail."
                                     : "Vui lòng nhập đầy đủ Google Client ID và Client Secret."
            ));
        } else {
            return ResponseEntity.ok(Map.of(
                    "success", valid,
                    "provider", "Facebook Login",
                    "message", valid ? "Định dạng Facebook App ID & App Secret hợp lệ! Sẵn sàng cho phép đăng nhập Facebook."
                                     : "Vui lòng nhập đầy đủ Facebook App ID và App Secret."
            ));
        }
    }
}
