package com.library.repository;

import com.library.entity.BorrowRecord;
import com.library.entity.BorrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {

    List<BorrowRecord> findByUserIdOrderByBorrowDateDesc(Long userId);

    Optional<BorrowRecord> findByBorrowCode(String borrowCode);

    @Query("SELECT r FROM BorrowRecord r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(r.borrowCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(r.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(r.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(r.book.title) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY r.borrowDate DESC")
    List<BorrowRecord> filterRecords(@Param("status") BorrowStatus status, @Param("keyword") String keyword);

    long countByStatus(BorrowStatus status);

    @Query("SELECT r FROM BorrowRecord r WHERE r.status = 'BORROWED' AND r.dueDate < :currentDate")
    List<BorrowRecord> findOverdueRecords(@Param("currentDate") LocalDate currentDate);

    List<BorrowRecord> findTop5ByOrderByBorrowDateDesc();
}
