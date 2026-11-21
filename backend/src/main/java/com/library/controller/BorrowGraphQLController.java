package com.library.controller;

import com.library.dto.DashboardStatsDto;
import com.library.entity.BorrowRecord;
import com.library.entity.User;
import com.library.service.AuthService;
import com.library.service.BorrowService;
import com.library.entity.Role;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.util.Collections;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class BorrowGraphQLController {

    private final BorrowService borrowService;
    private final AuthService authService;
    private final UserRepository userRepository;

    private boolean isStaff(User user) {
        return user != null && (user.getRole() == Role.ROLE_ADMIN || user.getRole() == Role.ROLE_LIBRARIAN);
    }

    @QueryMapping
    public List<BorrowRecord> myBorrowRecords() {
        User user = authService.getCurrentUser();
        if (user == null) {
            return Collections.emptyList();
        }
        return borrowService.getMyBorrowRecords(user.getId());
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public List<BorrowRecord> allBorrowRecords(
            @Argument(name = "status") String status,
            @Argument(name = "keyword") String keyword
    ) {
        return borrowService.getAllBorrowRecords(status, keyword);
    }

    @QueryMapping
    public BorrowRecord borrowRecordById(@Argument Long id) {
        User user = authService.getCurrentUser();
        if (user == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để xem thông tin phiếu mượn!");
        }
        BorrowRecord record = borrowService.getBorrowRecordById(id);
        if (!isStaff(user) && (record.getUser() == null || !record.getUser().getId().equals(user.getId()))) {
            throw new AccessDeniedException("Bạn không có quyền xem phiếu mượn này!");
        }
        return record;
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public DashboardStatsDto dashboardStats() {
        return borrowService.getDashboardStatistics();
    }

    @MutationMapping
    public BorrowRecord requestBorrow(
            @Argument Long bookId,
            @Argument(name = "days") Integer days,
            @Argument(name = "note") String note
    ) {
        User user = authService.getCurrentUser();
        if (user == null) {
            throw new RuntimeException("Vui lòng đăng nhập tài khoản độc giả để mượn sách!");
        }
        int safeDays = (days != null) ? Math.max(1, Math.min(90, days)) : 14;
        return borrowService.requestBorrow(user, bookId, safeDays, note);
    }

    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public BorrowRecord approveBorrow(@Argument Long recordId) {
        return borrowService.approveBorrow(recordId);
    }

    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public BorrowRecord returnBook(
            @Argument Long recordId,
            @Argument(name = "damaged") Boolean damaged,
            @Argument(name = "lost") Boolean lost
    ) {
        return borrowService.returnBook(recordId, Boolean.TRUE.equals(damaged), Boolean.TRUE.equals(lost));
    }

    @MutationMapping
    public BorrowRecord renewBorrow(
            @Argument Long recordId,
            @Argument(name = "extraDays") Integer extraDays
    ) {
        User user = authService.getCurrentUser();
        if (user == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để gia hạn sách!");
        }
        BorrowRecord existing = borrowService.getBorrowRecordById(recordId);
        if (!isStaff(user) && (existing.getUser() == null || !existing.getUser().getId().equals(user.getId()))) {
            throw new AccessDeniedException("Bạn không có quyền gia hạn phiếu mượn của người khác!");
        }
        int safeExtraDays = (extraDays != null) ? Math.max(1, Math.min(14, extraDays)) : 7;
        return borrowService.renewBorrow(recordId, safeExtraDays);
    }

    @MutationMapping
    public BorrowRecord cancelBorrow(@Argument Long recordId) {
        User user = authService.getCurrentUser();
        if (user == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để hủy yêu cầu mượn sách!");
        }
        BorrowRecord existing = borrowService.getBorrowRecordById(recordId);
        if (!isStaff(user) && (existing.getUser() == null || !existing.getUser().getId().equals(user.getId()))) {
            throw new AccessDeniedException("Bạn không có quyền hủy phiếu mượn của người khác!");
        }
        return borrowService.cancelBorrow(recordId);
    }
}
