package com.library.repository;

import com.library.entity.BorrowRecord;
import com.library.entity.BorrowStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {

    @EntityGraph(attributePaths = {"user", "book", "book.author", "book.category", "book.publisher"})
    List<BorrowRecord> findByUserIdOrderByBorrowDateDesc(Long userId);

    @EntityGraph(attributePaths = {"user", "book", "book.author", "book.category", "book.publisher"})
    List<BorrowRecord> findAllByOrderByBorrowDateDesc();

    Optional<BorrowRecord> findByBorrowCode(String borrowCode);

    @EntityGraph(attributePaths = {"user", "book", "book.author", "book.category", "book.publisher"})
    @Query("SELECT r FROM BorrowRecord r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(r.borrowCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(r.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(r.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(r.book.title) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY r.borrowDate DESC")
    List<BorrowRecord> filterRecords(@Param("status") BorrowStatus status, @Param("keyword") String keyword);

    long countByStatus(BorrowStatus status);

    long countByStatusIn(Collection<BorrowStatus> statuses);

    long countByUserIdAndStatusIn(Long userId, Collection<BorrowStatus> statuses);

    boolean existsByUserIdAndBookIdAndStatusIn(Long userId, Long bookId, Collection<BorrowStatus> statuses);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM BorrowRecord r " +
           "WHERE r.user.id = :userId AND (" +
           "(r.status = com.library.entity.BorrowStatus.BORROWED AND r.dueDate < :today) OR " +
           "(r.status = com.library.entity.BorrowStatus.OVERDUE) OR " +
           "(r.fineAmount > 0 AND r.status <> com.library.entity.BorrowStatus.RETURNED))")
    boolean existsOverdueOrUnpaidFineByUserId(@Param("userId") Long userId, @Param("today") LocalDate today);

    @Query("SELECT r FROM BorrowRecord r WHERE r.status = 'BORROWED' AND r.dueDate < :currentDate")
    List<BorrowRecord> findOverdueRecords(@Param("currentDate") LocalDate currentDate);

    @EntityGraph(attributePaths = {"user", "book", "book.author", "book.category", "book.publisher"})
    List<BorrowRecord> findTop5ByOrderByBorrowDateDesc();
}
