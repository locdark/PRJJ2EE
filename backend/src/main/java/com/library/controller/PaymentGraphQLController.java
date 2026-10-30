package com.library.controller;

import com.library.dto.SepayPaymentResponse;
import com.library.dto.VNPayPaymentResponse;
import com.library.entity.Payment;
import com.library.entity.User;
import com.library.service.AuthService;
import com.library.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class PaymentGraphQLController {

    private final PaymentService paymentService;
    private final AuthService authService;

    @MutationMapping
    public VNPayPaymentResponse createVNPayPayment(
            @Argument Long borrowRecordId,
            @Argument Double amount
    ) {
        User user = authService.getCurrentUser();
        return paymentService.createVNPayPaymentUrl(borrowRecordId, amount, "127.0.0.1", user);
    }

    @MutationMapping
    public SepayPaymentResponse createSepayPayment(
            @Argument Long borrowRecordId,
            @Argument Double amount
    ) {
        User user = authService.getCurrentUser();
        return paymentService.createSepayPayment(borrowRecordId, amount, user);
    }

    @QueryMapping
    public List<Payment> payments() {
        return paymentService.getAllPayments();
    }
}
