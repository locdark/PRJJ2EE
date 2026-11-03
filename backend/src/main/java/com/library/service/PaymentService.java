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
    private final SystemSettingService systemSettingService;

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

    private String getEffectiveVnpTmnCode() {
        SystemSetting settings = systemSettingService != null ? systemSettingService.getSettings() : null;
        if (settings != null && settings.getVnpTmnCode() != null && !settings.getVnpTmnCode().trim().isEmpty()) {
            return settings.getVnpTmnCode().trim();
        }
        return vnPayConfig.getVnp_TmnCode();
    }

    private String getEffectiveVnpHashSecret() {
        SystemSetting settings = systemSettingService != null ? systemSettingService.getSettings() : null;
        if (settings != null && settings.getVnpHashSecret() != null && !settings.getVnpHashSecret().trim().isEmpty()) {
            return settings.getVnpHashSecret().trim();
        }
        return vnPayConfig.getSecretKey();
    }

    private String getEffectiveVnpPayUrl() {
        SystemSetting settings = systemSettingService != null ? systemSettingService.getSettings() : null;
        if (settings != null && settings.getVnpPayUrl() != null && !settings.getVnpPayUrl().trim().isEmpty()) {
            return settings.getVnpPayUrl().trim();
        }
        return vnPayConfig.getVnp_PayUrl();
    }

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
        vnp_Params.put("vnp_TmnCode", getEffectiveVnpTmnCode());
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
        String vnp_SecureHash = VNPayConfig.hmacSHA512(getEffectiveVnpHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = getEffectiveVnpPayUrl() + "?" + queryUrl;

        // Lưu transaction PENDING
        Payment payment = Payment.builder()
                .transactionId(vnp_TxnRef)
                .vnpTxnRef(vnp_TxnRef)
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
        String vnp_SecureHash = params.get("vnp_SecureHash");

        // Verify vnp_SecureHash if present and secret key is configured
        String hashSecret = getEffectiveVnpHashSecret();
        if (vnp_SecureHash != null && !vnp_SecureHash.isEmpty()
                && hashSecret != null && !hashSecret.isEmpty()
                && !hashSecret.startsWith("DEMO_")) {
            List<String> fieldNames = new ArrayList<>(params.keySet());
            fieldNames.remove("vnp_SecureHash");
            fieldNames.remove("vnp_SecureHashType");
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = params.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                    if (itr.hasNext()) {
                        hashData.append('&');
                    }
                }
            }
            String calculatedHash = VNPayConfig.hmacSHA512(hashSecret, hashData.toString());
            if (!calculatedHash.equalsIgnoreCase(vnp_SecureHash)) {
                log.warn("VNPay SecureHash mismatch for transaction {}: expected {}, got {}", vnp_TxnRef, calculatedHash, vnp_SecureHash);
            }
        }

        Optional<Payment> optionalPayment = paymentRepository.findByTransactionId(vnp_TxnRef);
        if (optionalPayment.isEmpty()) {
            throw new RuntimeException("Không tìm thấy giao dịch: " + vnp_TxnRef);
        }

        Payment payment = optionalPayment.get();
        payment.setVnpResponseCode(vnp_ResponseCode);

        if ("00".equals(vnp_ResponseCode)) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaymentDate(LocalDateTime.now());

            // Cập nhật phiếu mượn và tự động cộng ngày gia hạn
            if (payment.getBorrowRecord() != null) {
                applyPaymentExtensionToBorrowRecord(
                        payment.getBorrowRecord(),
                        payment.getAmount(),
                        "VNPAY #" + vnp_TxnRef
                );
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

        SystemSetting settings = systemSettingService != null ? systemSettingService.getSettings() : null;
        String effectiveAccNum = (settings != null && settings.getSepayAccountNumber() != null && !settings.getSepayAccountNumber().isEmpty())
                ? settings.getSepayAccountNumber() : sepayAccountNumber;
        String effectiveBankCode = (settings != null && settings.getSepayBankCode() != null && !settings.getSepayBankCode().isEmpty())
                ? settings.getSepayBankCode() : sepayBankCode;
        String effectiveAccName = (settings != null && settings.getSepayAccountName() != null && !settings.getSepayAccountName().isEmpty())
                ? settings.getSepayAccountName() : sepayAccountName;

        String transactionId = "SP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String paymentCode = "LIB" + (record != null ? record.getId() : System.currentTimeMillis() % 100000);

        // Tạo VietQR qua SePay API generator
        // URL format: https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}&template=compact2
        String encodedDes = URLEncoder.encode(paymentCode, StandardCharsets.UTF_8);
        String qrUrl = String.format("%s?acc=%s&bank=%s&amount=%.0f&des=%s&template=compact2",
                sepayQrBaseUrl, effectiveAccNum, effectiveBankCode, amount, encodedDes);

        // Lưu transaction PENDING
        Payment payment = Payment.builder()
                .transactionId(transactionId)
                .vnpTxnRef(paymentCode)
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
                .accountNumber(effectiveAccNum)
                .bankCode(effectiveBankCode)
                .accountName(effectiveAccName)
                .amount(amount)
                .paymentCode(paymentCode)
                .transactionId(transactionId)
                .build();
    }

    @Transactional
    public boolean processSepayWebhook(SepayWebhookDto webhookDto, String authHeader) {
        log.info("Received SePay Webhook: {}", webhookDto);

        SystemSetting settings = systemSettingService != null ? systemSettingService.getSettings() : null;
        String effectiveApiKey = (settings != null && settings.getSepayApiKey() != null && !settings.getSepayApiKey().isEmpty())
                ? settings.getSepayApiKey() : sepayApiKey;

        // Kiểm tra bảo mật ApiKey (nếu cấu hình)
        if (effectiveApiKey != null && !effectiveApiKey.isEmpty() && !effectiveApiKey.startsWith("SEPAY_DEMO")) {
            if (authHeader == null || !authHeader.contains(effectiveApiKey)) {
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
        List<Payment> pendingPayments = paymentRepository.findByStatusOrderByPaymentDateDesc(PaymentStatus.PENDING);
        Payment matchedPayment = null;
        String upperContent = content.toUpperCase();

        for (Payment p : pendingPayments) {
            boolean matchCode = p.getVnpTxnRef() != null && upperContent.contains(p.getVnpTxnRef().toUpperCase());
            boolean matchRecord = p.getBorrowRecord() != null && upperContent.contains("LIB" + p.getBorrowRecord().getId());
            boolean matchOrder = p.getOrderInfo() != null && upperContent.contains(p.getOrderInfo().toUpperCase());
            if (matchCode || matchRecord || matchOrder) {
                matchedPayment = p;
                break;
            }
        }

        if (matchedPayment != null) {
            matchedPayment.setStatus(PaymentStatus.SUCCESS);
            matchedPayment.setPaymentDate(LocalDateTime.now());
            matchedPayment.setVnpResponseCode("SEPAY_" + webhookDto.getReferenceCode());

            if (matchedPayment.getBorrowRecord() != null) {
                Double payAmount = webhookDto.getTransferAmount() != null && webhookDto.getTransferAmount() > 0
                        ? webhookDto.getTransferAmount()
                        : matchedPayment.getAmount();
                applyPaymentExtensionToBorrowRecord(
                        matchedPayment.getBorrowRecord(),
                        payAmount,
                        "SEPAY #" + webhookDto.getReferenceCode()
                );
            }

            paymentRepository.save(matchedPayment);
            emailService.sendPaymentReceipt(matchedPayment);
            log.info("Successfully processed SePay Webhook for Payment ID: {}", matchedPayment.getId());
            return true;
        }

        log.info("No matching pending payment found for content: {}", content);
        return true;
    }

    private void applyPaymentExtensionToBorrowRecord(BorrowRecord record, Double amount, String referenceNote) {
        if (record == null) return;

        record.setFineAmount(0.0);

        // Mỗi 2.000 VNĐ tương ứng với 1 ngày thuê (theo bảng giá chuẩn hệ thống), mặc định tối thiểu 7 ngày nếu nộp tiền
        int extraDays = (amount != null && amount >= 2000) ? (int) Math.round(amount / 2000.0) : 7;
        java.time.LocalDate today = java.time.LocalDate.now();

        if (record.getStatus() == com.library.entity.BorrowStatus.PENDING) {
            record.setStatus(com.library.entity.BorrowStatus.BORROWED);
            if (record.getBorrowDate() == null) {
                record.setBorrowDate(today);
            }
            record.setDueDate(today.plusDays(extraDays > 0 ? extraDays : 14));
        } else {
            // Đang mượn hoặc Quá hạn -> tự động cộng thêm ngày gia hạn
            java.time.LocalDate baseDueDate = (record.getDueDate() != null && record.getDueDate().isAfter(today))
                    ? record.getDueDate()
                    : today;
            record.setDueDate(baseDueDate.plusDays(extraDays));
            record.setStatus(com.library.entity.BorrowStatus.BORROWED);
        }

        String currentNote = record.getNotes() != null ? record.getNotes() : "";
        String extensionTag = " • [ĐÃ GIA HẠN +" + extraDays + " NGÀY - " + referenceNote + "]";
        if (!currentNote.contains(referenceNote)) {
            record.setNotes(currentNote + extensionTag);
        }
        borrowRecordRepository.save(record);
        log.info("Successfully extended borrow record #{} by {} days. New due date: {}", record.getId(), extraDays, record.getDueDate());
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByPaymentDateDesc();
    }

    public Payment getPaymentByTransactionId(String transactionId) {
        return paymentRepository.findByTransactionId(transactionId).orElse(null);
    }
}
