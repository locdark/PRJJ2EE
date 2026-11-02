package com.library.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payment_user", columnList = "user_id"),
        @Index(name = "idx_payment_borrow", columnList = "borrow_record_id"),
        @Index(name = "idx_payment_status", columnList = "status"),
        @Index(name = "idx_payment_txn_ref", columnList = "vnp_txn_ref")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String transactionId;

    @Column(name = "vnp_txn_ref")
    private String vnpTxnRef;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "borrow_record_id")
    private BorrowRecord borrowRecord;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    @Builder.Default
    private String paymentMethod = "VNPAY";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    private String vnpResponseCode;

    @Builder.Default
    private LocalDateTime paymentDate = LocalDateTime.now();

    private String orderInfo;
}
