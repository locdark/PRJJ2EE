package com.library.service;

import com.library.config.VNPayConfig;
import com.library.dto.SepayPaymentResponse;
import com.library.dto.SepayWebhookDto;
import com.library.dto.VNPayPaymentResponse;
import com.library.entity.*;
import com.library.repository.BorrowRecordRepository;
import com.library.repository.PaymentRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final VNPayConfig vnPayConfig;
    private final PaymentRepository paymentRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.sepay.account-number:0388888888}")
    private String sepayAccountNumber;

    @Value("${app.sepay.bank-code:MBBank}")
    private String sepayBankCode;

    @Value("${app.sepay.account-name:SMART LIBRARY HUFLIT}")
    private String sepayAccountName;

    @Value("${app.sepay.api-key:SEPAY_DEMO_SECRET_API_KEY}")
    private String sepayApiKey;

    @Value("${app.sepay.qr-url:https://qr.sepay.vn/img}")
    private String sepayQrBaseUrl;

    // ==================== VNPAY PAYMENT ====================

    @Transactional
    public VNPayPaymentResponse createVNPayPaymentUrl(Long borrowRecordId, Double amount, String ipAddress, User user) {
        BorrowRecord record = null;
        if (borrowRecordId != null) {
            record = borrowRecordRepository.findById(borrowRecordId)
                    .orElse(null);
        }

        String vnp_TxnRef = VNPayConfig.getRandomNumber(8);
        String vnp_OrderInfo = "Thanh toan phi muon sach SmartLibrary #" + (record != null ? record.getBorrowCode() : vnp_TxnRef);
        long amountInVnd = (long) (amount * 100); // VNPay expects amount multiplied by 100

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amountInVnd));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getVnp_ReturnUrl());
        vnp_Params.put("vnp_IpAddr", ipAddress != null ? ipAddress : "127.0.0.1");

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (!fieldValue.isEmpty())) {
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII)).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnPayConfig.getSecretKey(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = vnPayConfig.getVnp_PayUrl() + "?" + queryUrl;

        // Lưu transaction PENDING
        Payment payment = Payment.builder()
                .transactionId(vnp_TxnRef)
                .user(user != null ? user : (record != null ? record.getUser() : null))
                .borrowRecord(record)
                .amount(amount)
                .paymentMethod("VNPAY")
                .status(PaymentStatus.PENDING)
                .orderInfo(vnp_OrderInfo)
                .build();
        paymentRepository.save(payment);

        return VNPayPaymentResponse.builder()
                .paymentUrl(paymentUrl)
                .transactionId(vnp_TxnRef)
                .amount(amount)
                .build();
    }

    @Transactional
    public Payment processVNPayCallback(Map<String, String> params) {
        String vnp_TxnRef = params.get("vnp_TxnRef");
        String vnp_ResponseCode = params.get("vnp_ResponseCode");

        Optional<Payment> optionalPayment = paymentRepository.findByTransactionId(vnp_TxnRef);
        if (optionalPayment.isEmpty()) {
            throw new RuntimeException("Không tìm thấy giao dịch: " + vnp_TxnRef);
        }

        Payment payment = optionalPayment.get();
        payment.setVnpResponseCode(vnp_ResponseCode);

        if ("00".equals(vnp_ResponseCode)) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaymentDate(LocalDateTime.now());

            // Cập nhật phiếu mượn nếu có
            if (payment.getBorrowRecord() != null) {
                BorrowRecord record = payment.getBorrowRecord();
                record.setFineAmount(0.0);
                borrowRecordRepository.save(record);
            }

            // Gửi email biên lai thanh toán
            emailService.sendPaymentReceipt(payment);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
        }

        return paymentRepository.save(payment);
    }

    // ==================== SEPAY (VIETQR) PAYMENT ====================

    @Transactional
    public SepayPaymentResponse createSepayPayment(Long borrowRecordId, Double amount, User user) {
        BorrowRecord record = null;
        if (borrowRecordId != null) {
            record = borrowRecordRepository.findById(borrowRecordId).orElse(null);
        }

        String transactionId = "SP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String paymentCode = "LIB" + (record != null ? record.getId() : System.currentTimeMillis() % 100000);

        // Tạo VietQR qua SePay API generator
        // URL format: https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}&template=compact2
        String encodedDes = URLEncoder.encode(paymentCode, StandardCharsets.UTF_8);
        String qrUrl = String.format("%s?acc=%s&bank=%s&amount=%.0f&des=%s&template=compact2",
                sepayQrBaseUrl, sepayAccountNumber, sepayBankCode, amount, encodedDes);

        // Lưu transaction PENDING
        Payment payment = Payment.builder()
                .transactionId(transactionId)
                .user(user != null ? user : (record != null ? record.getUser() : null))
                .borrowRecord(record)
                .amount(amount)
                .paymentMethod("SEPAY_VIETQR")
                .status(PaymentStatus.PENDING)
                .orderInfo("Thanh toan VietQR SePay: " + paymentCode)
                .build();
        paymentRepository.save(payment);

        return SepayPaymentResponse.builder()
                .qrUrl(qrUrl)
                .accountNumber(sepayAccountNumber)
                .bankCode(sepayBankCode)
                .accountName(sepayAccountName)
                .amount(amount)
                .paymentCode(paymentCode)
                .transactionId(transactionId)
                .build();
    }

    @Transactional
    public boolean processSepayWebhook(SepayWebhookDto webhookDto, String authHeader) {
        log.info("Received SePay Webhook: {}", webhookDto);

        // Kiểm tra bảo mật ApiKey (nếu cấu hình)
        if (sepayApiKey != null && !sepayApiKey.isEmpty() && !sepayApiKey.startsWith("SEPAY_DEMO")) {
            if (authHeader == null || !authHeader.contains(sepayApiKey)) {
                log.warn("Unauthorized SePay Webhook request!");
                return false;
            }
        }

        String content = webhookDto.getContent() != null ? webhookDto.getContent() : webhookDto.getDescription();
        if (content == null) {
            log.warn("SePay Webhook has no content/description");
            return false;
        }

        // Tìm giao dịch tương ứng theo nội dung chuyển khoản "LIB..."
        List<Payment> pendingPayments = paymentRepository.findAll();
        Payment matchedPayment = null;

        for (Payment p : pendingPayments) {
            if (p.getStatus() == PaymentStatus.PENDING && p.getOrderInfo() != null) {
                if (content.toUpperCase().contains(p.getOrderInfo().toUpperCase()) ||
                    (p.getBorrowRecord() != null && content.toUpperCase().contains("LIB" + p.getBorrowRecord().getId()))) {
                    matchedPayment = p;
                    break;
                }
            }
        }

        if (matchedPayment != null) {
            matchedPayment.setStatus(PaymentStatus.SUCCESS);
            matchedPayment.setPaymentDate(LocalDateTime.now());
            matchedPayment.setVnpResponseCode("SEPAY_" + webhookDto.getReferenceCode());

            if (matchedPayment.getBorrowRecord() != null) {
                BorrowRecord record = matchedPayment.getBorrowRecord();
                record.setFineAmount(0.0);
                borrowRecordRepository.save(record);
            }

            paymentRepository.save(matchedPayment);
            emailService.sendPaymentReceipt(matchedPayment);
            log.info("Successfully processed SePay Webhook for Payment ID: {}", matchedPayment.getId());
            return true;
        }

        log.info("No matching pending payment found for content: {}", content);
        return true;
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByPaymentDateDesc();
    }

    public Payment getPaymentByTransactionId(String transactionId) {
        return paymentRepository.findByTransactionId(transactionId).orElse(null);
    }
}
