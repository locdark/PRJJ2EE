package com.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SepayPaymentResponse {
    private String qrUrl;
    private String accountNumber;
    private String bankCode;
    private String accountName;
    private Double amount;
    private String paymentCode;
    private String transactionId;
}
