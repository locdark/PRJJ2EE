package com.library.controller;

import com.library.dto.SepayPaymentResponse;
import com.library.dto.SepayWebhookDto;
import com.library.entity.Payment;
import com.library.entity.User;
import com.library.service.AuthService;
import com.library.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sepay")
@RequiredArgsConstructor
@Slf4j
public class SepayController {

    private final PaymentService paymentService;
    private final AuthService authService;

    @PostMapping("/create-payment")
    public ResponseEntity<SepayPaymentResponse> createPayment(
            @RequestParam(required = false) Long recordId,
            @RequestParam Double amount
    ) {
        User user = authService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(paymentService.createSepayPayment(recordId, amount, user));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestBody SepayWebhookDto webhookDto,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        log.info("Incoming SePay Webhook notification: ref={}", webhookDto != null ? webhookDto.getReferenceCode() : null);
        boolean success = paymentService.processSepayWebhook(webhookDto, authHeader);
        if (!success) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false));
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/status/{transactionId}")
    public ResponseEntity<Payment> checkPaymentStatus(@PathVariable String transactionId) {
        User user = authService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Payment payment = paymentService.getPaymentByTransactionId(transactionId);
        if (payment == null) {
            return ResponseEntity.notFound().build();
        }
        boolean isStaff = user.getRole() == com.library.entity.Role.ROLE_ADMIN
                || user.getRole() == com.library.entity.Role.ROLE_LIBRARIAN;
        if (!isStaff && (payment.getUser() == null || !payment.getUser().getId().equals(user.getId()))) {
            throw new AccessDeniedException("Bạn không có quyền xem trạng thái giao dịch này!");
        }
        return ResponseEntity.ok(payment);
    }
}
