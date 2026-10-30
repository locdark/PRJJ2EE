package com.library.controller;

import com.library.config.VNPayConfig;
import com.library.dto.VNPayPaymentResponse;
import com.library.entity.Payment;
import com.library.entity.User;
import com.library.service.AuthService;
import com.library.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/vnpay")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VNPayController {

    private final PaymentService paymentService;
    private final AuthService authService;

    @GetMapping("/create-payment")
    public ResponseEntity<VNPayPaymentResponse> createPayment(
            @RequestParam(required = false) Long recordId,
            @RequestParam Double amount,
            HttpServletRequest request
    ) {
        String ipAddress = VNPayConfig.getIpAddress(request);
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(paymentService.createVNPayPaymentUrl(recordId, amount, ipAddress, user));
    }

    @GetMapping("/payment-return")
    public ResponseEntity<Payment> paymentReturn(@RequestParam Map<String, String> allParams) {
        return ResponseEntity.ok(paymentService.processVNPayCallback(allParams));
    }
}
