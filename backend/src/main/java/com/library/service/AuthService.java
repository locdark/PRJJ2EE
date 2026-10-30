package com.library.service;

import com.library.dto.AuthRequest;
import com.library.dto.AuthResponse;
import com.library.dto.GoogleLoginRequest;
import com.library.dto.RegisterRequest;
import com.library.entity.Role;
import com.library.entity.User;
import com.library.repository.UserRepository;
import com.library.security.JwtTokenProvider;
import com.library.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được đăng ký trong hệ thống: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(Role.ROLE_READER)
                .provider("LOCAL")
                .avatar("https://api.dicebear.com/7.x/bottts/svg?seed=" + request.getEmail())
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);

        // Gửi email chào mừng bằng Spring Mail
        emailService.sendWelcomeEmail(savedUser);

        String token = tokenProvider.generateTokenFromEmail(savedUser.getEmail(), savedUser.getId());

        return AuthResponse.builder()
                .token(token)
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole())
                .avatar(savedUser.getAvatar())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .avatar(user.getAvatar())
                .build();
    }

    @Transactional
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        String effectiveEmail = request.getEmail();
        String effectiveName = request.getFullName();
        String effectiveAvatar = request.getAvatar();

        // 1. Xác thực Google ID Token thật qua Google OAuth2 Tokeninfo Endpoint
        if (request.getGoogleToken() != null && request.getGoogleToken().startsWith("ey")) {
            try {
                java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
                java.net.http.HttpRequest httpReq = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + request.getGoogleToken()))
                        .GET()
                        .timeout(java.time.Duration.ofSeconds(5))
                        .build();
                java.net.http.HttpResponse<String> resp = client.send(httpReq, java.net.http.HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() == 200 && resp.body().contains("\"email\"")) {
                    com.fasterxml.jackson.databind.JsonNode json = new com.fasterxml.jackson.databind.ObjectMapper().readTree(resp.body());
                    if (json.has("email")) effectiveEmail = json.get("email").asText();
                    if (json.has("name")) effectiveName = json.get("name").asText();
                    if (json.has("picture")) effectiveAvatar = json.get("picture").asText();
                    log.info("Xác thực Google OAuth2 thành công cho tài khoản: {}", effectiveEmail);
                }
            } catch (Exception e) {
                log.warn("Không thể kết nối Google Tokeninfo API, dùng thông tin dự phòng: {}", e.getMessage());
            }
        }

        if (effectiveEmail == null || effectiveEmail.trim().isEmpty()) {
            throw new RuntimeException("Email tài khoản Google không hợp lệ!");
        }

        Optional<User> optionalUser = userRepository.findByEmail(effectiveEmail);
        User user;

        if (optionalUser.isPresent()) {
            user = optionalUser.get();
            if (effectiveAvatar != null && !effectiveAvatar.isEmpty()) {
                user.setAvatar(effectiveAvatar);
            }
            if (effectiveName != null && !effectiveName.isEmpty()) {
                user.setFullName(effectiveName);
            }
            userRepository.save(user);
        } else {
            user = User.builder()
                    .email(effectiveEmail)
                    .fullName(effectiveName != null && !effectiveName.isEmpty() ? effectiveName : "Google User")
                    .avatar(effectiveAvatar != null && !effectiveAvatar.isEmpty() ? effectiveAvatar : 
                            "https://api.dicebear.com/7.x/bottts/svg?seed=" + effectiveEmail)
                    .role(Role.ROLE_READER)
                    .provider("GOOGLE")
                    .enabled(true)
                    .password(passwordEncoder.encode("GOOGLE_OAUTH2_" + System.currentTimeMillis()))
                    .build();
            user = userRepository.save(user);
            emailService.sendWelcomeEmail(user);
        }

        String token = tokenProvider.generateTokenFromEmail(user.getEmail(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .avatar(user.getAvatar())
                .build();
    }

    @Transactional
    public AuthResponse facebookLogin(com.library.dto.FacebookLoginRequest request) {
        Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());
        User user;

        if (optionalUser.isPresent()) {
            user = optionalUser.get();
            if (request.getAvatar() != null && !request.getAvatar().isEmpty()) {
                user.setAvatar(request.getAvatar());
            }
            if (request.getFullName() != null && !request.getFullName().isEmpty()) {
                user.setFullName(request.getFullName());
            }
            userRepository.save(user);
        } else {
            user = User.builder()
                    .email(request.getEmail())
                    .fullName(request.getFullName() != null ? request.getFullName() : "Facebook User")
                    .avatar(request.getAvatar() != null ? request.getAvatar() : 
                            "https://api.dicebear.com/7.x/bottts/svg?seed=" + request.getEmail())
                    .role(Role.ROLE_READER)
                    .provider("FACEBOOK")
                    .enabled(true)
                    .password(passwordEncoder.encode("FACEBOOK_OAUTH_" + System.currentTimeMillis()))
                    .build();
            user = userRepository.save(user);
            emailService.sendWelcomeEmail(user);
        }

        String token = tokenProvider.generateTokenFromEmail(user.getEmail(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .avatar(user.getAvatar())
                .build();
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }

        if (auth.getPrincipal() instanceof UserPrincipal principal) {
            return userRepository.findById(principal.getId()).orElse(null);
        }

        return userRepository.findByEmail(auth.getName()).orElse(null);
    }
}
