package com.library.repository;

import com.library.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    @Query("SELECT b FROM Book b WHERE " +
           "(:categoryId IS NULL OR b.category.id = :categoryId) AND " +
           "(:keyword IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(b.isbn) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(b.author.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Book> searchBooks(@Param("categoryId") Long categoryId, 
                           @Param("keyword") String keyword, 
                           Pageable pageable);

    List<Book> findTop8ByOrderByRatingDesc();

    List<Book> findByCategoryId(Long categoryId);

    long countByCategoryId(Long categoryId);

    @Query("SELECT b FROM Book b WHERE " +
           "LOWER(b.title) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(b.description) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(b.category.name) LIKE LOWER(CONCAT('%', :term, '%'))")
    List<Book> findBySemanticTerm(@Param("term") String term);
}
