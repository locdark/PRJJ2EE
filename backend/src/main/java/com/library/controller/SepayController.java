package com.library.controller;

import com.library.dto.SepayPaymentResponse;
import com.library.dto.SepayWebhookDto;
import com.library.entity.Payment;
import com.library.entity.User;
import com.library.service.AuthService;
import com.library.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sepay")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
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
        return ResponseEntity.ok(paymentService.createSepayPayment(recordId, amount, user));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestBody SepayWebhookDto webhookDto,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        log.info("Incoming SePay Webhook notification: {}", webhookDto);
        boolean success = paymentService.processSepayWebhook(webhookDto, authHeader);
        return ResponseEntity.ok(Map.of("success", success));
    }

    @GetMapping("/status/{transactionId}")
    public ResponseEntity<Payment> checkPaymentStatus(@PathVariable String transactionId) {
        Payment payment = paymentService.getPaymentByTransactionId(transactionId);
        if (payment == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(payment);
    }
}
