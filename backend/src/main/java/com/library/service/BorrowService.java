package com.library.service;

import com.library.dto.DashboardStatsDto;
import com.library.entity.*;
import com.library.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BorrowService {

    private final BorrowRecordRepository borrowRecordRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final SystemSettingService systemSettingService;

    private static final double DAILY_FINE_RATE = 5000.0; // 5,000 VNĐ / day late

    private double getDailyFineRate() {
        if (systemSettingService != null) {
            Double rate = systemSettingService.getSettings().getLateFinePerDay();
            if (rate != null && rate > 0) {
                return rate;
            }
        }
        return DAILY_FINE_RATE;
    }

    @Transactional
    public BorrowRecord requestBorrow(User user, Long bookId, int days, String note) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Sách không tồn tại trong hệ thống thư viện!"));

        if (book.getAvailableCopies() <= 0) {
            throw new RuntimeException("Rất tiếc, cuốn sách này hiện đã được mượn hết trong kho!");
        }

        List<BorrowStatus> activeStatuses = List.of(BorrowStatus.BORROWED, BorrowStatus.PENDING);

        // 1. Kiểm tra độc giả có đang mượn chính cuốn sách này chưa trả
        boolean isAlreadyBorrowingThisBook = borrowRecordRepository
                .existsByUserIdAndBookIdAndStatusIn(user.getId(), bookId, activeStatuses);
        if (isAlreadyBorrowingThisBook) {
            throw new RuntimeException("Bạn đang mượn cuốn sách này rồi (chưa hoàn tất trả sách). Quy chế thư viện: Mỗi độc giả chỉ được mượn 1 bản của cùng một đầu sách!");
        }

        // 2. Kiểm tra giới hạn mượn sách tối đa (Được cấu hình bởi Admin, mặc định 3 cuốn)
        int maxBorrowLimit = 3;
        if (systemSettingService != null) {
            Integer limit = systemSettingService.getSettings().getMaxBorrowLimit();
            if (limit != null && limit > 0) {
                maxBorrowLimit = limit;
            }
        }

        long activeCount = borrowRecordRepository.countByUserIdAndStatusIn(user.getId(), activeStatuses);
        if (activeCount >= maxBorrowLimit) {
            throw new RuntimeException("Bạn đã đạt giới hạn tối đa mượn " + maxBorrowLimit + " cuốn sách cùng lúc theo Quy chế Thư viện. Vui lòng trả bớt sách đang mượn trước khi đăng ký mượn thêm sách mới!");
        }

        // 3. Kiểm tra sách quá hạn hoặc tiền phạt chưa thanh toán
        LocalDate today = LocalDate.now();
        boolean hasOverdue = borrowRecordRepository.existsOverdueOrUnpaidFineByUserId(user.getId(), today);
        if (hasOverdue) {
            throw new RuntimeException("Tài khoản của bạn đang có sách quá hạn hoặc tiền phạt trễ hạn chưa thanh toán. Vui lòng thanh toán phí phạt tại mục 'Sách của tôi' trước khi tiếp tục mượn sách mới!");
        }

        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        LocalDate due = today.plusDays(days > 0 ? days : 14);

        String borrowCode = "BR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        BorrowRecord record = BorrowRecord.builder()
                .borrowCode(borrowCode)
                .user(user)
                .book(book)
                .borrowDate(today)
                .dueDate(due)
                .status(BorrowStatus.BORROWED)
                .notes(note)
                .fineAmount(0.0)
                .build();

        BorrowRecord savedRecord = borrowRecordRepository.save(record);

        // Gửi email xác nhận mượn sách qua Spring Email
        emailService.sendBorrowConfirmation(savedRecord);

        return savedRecord;
    }

    @Transactional
    public BorrowRecord approveBorrow(Long recordId) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu mượn"));

        record.setStatus(BorrowStatus.BORROWED);
        return borrowRecordRepository.save(record);
    }

    @Transactional
    public BorrowRecord returnBook(Long recordId, boolean damaged, boolean lost) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu mượn"));

        if (record.getStatus() == BorrowStatus.RETURNED) {
            throw new RuntimeException("Phiếu mượn này đã được trả trước đó!");
        }

        LocalDate returnDate = LocalDate.now();
        record.setReturnDate(returnDate);

        double fine = 0.0;
        if (returnDate.isAfter(record.getDueDate())) {
            long overdueDays = ChronoUnit.DAYS.between(record.getDueDate(), returnDate);
            fine += overdueDays * getDailyFineRate();
        }

        if (lost) {
            fine += (record.getBook().getPrice() != null ? record.getBook().getPrice() : 100000.0) * 1.5;
            record.setNotes((record.getNotes() != null ? record.getNotes() + " | " : "") + "Sách bị mất");
        } else if (damaged) {
            fine += (record.getBook().getPrice() != null ? record.getBook().getPrice() : 100000.0) * 0.5;
            record.setNotes((record.getNotes() != null ? record.getNotes() + " | " : "") + "Sách bị hư hỏng");
        } else {
            // Khôi phục số lượng sách sẵn có nếu không bị mất
            Book book = record.getBook();
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepository.save(book);
        }

        record.setFineAmount(fine);
        record.setStatus(BorrowStatus.RETURNED);

        return borrowRecordRepository.save(record);
    }

    @Transactional
    public BorrowRecord renewBorrow(Long recordId, int extraDays) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu mượn"));

        if (record.getStatus() != BorrowStatus.BORROWED) {
            throw new RuntimeException("Chỉ có thể gia hạn khi sách đang ở trạng thái đang mượn!");
        }

        record.setDueDate(record.getDueDate().plusDays(extraDays > 0 ? extraDays : 7));
        return borrowRecordRepository.save(record);
    }

    @Transactional
    public BorrowRecord cancelBorrow(Long recordId) {
        BorrowRecord record = borrowRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu mượn"));

        if (record.getStatus() == BorrowStatus.BORROWED || record.getStatus() == BorrowStatus.PENDING) {
            Book book = record.getBook();
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepository.save(book);
            record.setStatus(BorrowStatus.CANCELLED);
        }

        return borrowRecordRepository.save(record);
    }

    public List<BorrowRecord> getMyBorrowRecords(Long userId) {
        return borrowRecordRepository.findByUserIdOrderByBorrowDateDesc(userId);
    }

    public List<BorrowRecord> getAllBorrowRecords(String status, String keyword) {
        BorrowStatus borrowStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                borrowStatus = BorrowStatus.valueOf(status.toUpperCase());
            } catch (Exception ignored) {}
        }
        return borrowRecordRepository.filterRecords(borrowStatus, keyword);
    }

    public BorrowRecord getBorrowRecordById(Long id) {
        return borrowRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu mượn"));
    }

    @Scheduled(cron = "0 0 8 * * ?") // 8:00 AM daily check
    @Transactional
    public void checkAndAlertOverdueBorrows() {
        LocalDate today = LocalDate.now();
        List<BorrowRecord> overdueList = borrowRecordRepository.findOverdueRecords(today);

        log.info("Checking overdue records: found {} overdue records", overdueList.size());
        if (overdueList.isEmpty()) {
            return;
        }
        double dailyFineRate = getDailyFineRate();
        for (BorrowRecord r : overdueList) {
            r.setStatus(BorrowStatus.OVERDUE);
            long days = ChronoUnit.DAYS.between(r.getDueDate(), today);
            r.setFineAmount(days * dailyFineRate);
        }
        borrowRecordRepository.saveAll(overdueList);
        for (BorrowRecord r : overdueList) {
            emailService.sendOverdueAlert(r);
        }
    }

    public DashboardStatsDto getDashboardStatistics() {
        long totalBooks = bookRepository.count();
        long totalReaders = userRepository.countByRole(Role.ROLE_READER);
        long activeBorrows = borrowRecordRepository.countByStatus(BorrowStatus.BORROWED);
        long overdueBorrows = borrowRecordRepository.countByStatus(BorrowStatus.OVERDUE);
        Double totalRevenue = paymentRepository.sumAmountByStatus(PaymentStatus.SUCCESS);

        List<BorrowRecord> recentBorrows = borrowRecordRepository.findTop5ByOrderByBorrowDateDesc();
        List<Book> popularBooks = bookRepository.findTop8ByOrderByRatingDesc();

        return DashboardStatsDto.builder()
                .totalBooks(totalBooks)
                .totalReaders(totalReaders)
                .activeBorrowings(activeBorrows)
                .overdueBorrowings(overdueBorrows)
                .totalRevenue(totalRevenue != null ? totalRevenue : 0.0)
                .recentBorrows(recentBorrows)
                .popularBooks(popularBooks)
                .build();
    }
}
