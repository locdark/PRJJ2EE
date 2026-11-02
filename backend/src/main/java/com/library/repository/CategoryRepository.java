package com.library.repository;

import com.library.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByName(String name);

    @Query("SELECT b.category.id, COUNT(b) FROM Book b WHERE b.category IS NOT NULL GROUP BY b.category.id")
    List<Object[]> countBooksByCategory();
}
