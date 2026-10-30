package com.library.service;

import com.library.dto.BookInput;
import com.library.dto.BookPageResponse;
import com.library.entity.*;
import com.library.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final ReviewRepository reviewRepository;

    public BookPageResponse getBooks(int page, int size, Long categoryId, String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Book> bookPage = bookRepository.searchBooks(categoryId, keyword, pageable);

        return BookPageResponse.builder()
                .content(bookPage.getContent())
                .totalElements(bookPage.getTotalElements())
                .totalPages(bookPage.getTotalPages())
                .currentPage(bookPage.getNumber())
                .build();
    }

    public Book getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sách với ID: " + id));
    }

    public List<Book> getFeaturedBooks() {
        return bookRepository.findTop8ByOrderByRatingDesc();
    }

    public List<Category> getCategories() {
        List<Category> categories = categoryRepository.findAll();
        for (Category cat : categories) {
            cat.setBookCount((int) bookRepository.countByCategoryId(cat.getId()));
        }
        return categories;
    }

    public List<Author> getAuthors() {
        return authorRepository.findAll();
    }

    public List<Publisher> getPublishers() {
        return publisherRepository.findAll();
    }

    @Transactional
    public Book createBook(BookInput input) {
        Category category = categoryRepository.findById(input.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại"));
        Author author = authorRepository.findById(input.getAuthorId())
                .orElseThrow(() -> new RuntimeException("Tác giả không tồn tại"));
        Publisher publisher = publisherRepository.findById(input.getPublisherId())
                .orElseThrow(() -> new RuntimeException("Nhà xuất bản không tồn tại"));

        Book book = Book.builder()
                .title(input.getTitle())
                .isbn(input.getIsbn())
                .description(input.getDescription())
                .coverImage(input.getCoverImage())
                .price(input.getPrice())
                .totalCopies(input.getTotalCopies())
                .availableCopies(input.getTotalCopies())
                .publishYear(input.getPublishYear())
                .category(category)
                .author(author)
                .publisher(publisher)
                .shelfLocation(input.getShelfLocation())
                .rating(5.0)
                .build();

        return bookRepository.save(book);
    }

    @Transactional
    public Book updateBook(Long id, BookInput input) {
        Book book = getBookById(id);

        if (input.getCategoryId() != null) {
            book.setCategory(categoryRepository.findById(input.getCategoryId()).orElse(book.getCategory()));
        }
        if (input.getAuthorId() != null) {
            book.setAuthor(authorRepository.findById(input.getAuthorId()).orElse(book.getAuthor()));
        }
        if (input.getPublisherId() != null) {
            book.setPublisher(publisherRepository.findById(input.getPublisherId()).orElse(book.getPublisher()));
        }

        book.setTitle(input.getTitle());
        book.setIsbn(input.getIsbn());
        book.setDescription(input.getDescription());
        book.setCoverImage(input.getCoverImage());
        book.setPrice(input.getPrice());
        book.setPublishYear(input.getPublishYear());
        book.setShelfLocation(input.getShelfLocation());

        int diff = input.getTotalCopies() - book.getTotalCopies();
        book.setTotalCopies(input.getTotalCopies());
        book.setAvailableCopies(Math.max(0, book.getAvailableCopies() + diff));

        return bookRepository.save(book);
    }

    @Transactional
    public boolean deleteBook(Long id) {
        Book book = getBookById(id);
        bookRepository.delete(book);
        return true;
    }

    @Transactional
    public Review addReview(Long bookId, User user, int rating, String comment) {
        Book book = getBookById(bookId);

        Review review = Review.builder()
                .book(book)
                .user(user)
                .rating(rating)
                .comment(comment)
                .build();

        Review saved = reviewRepository.save(review);

        // Cập nhật rating trung bình
        List<Review> reviews = reviewRepository.findByBookIdOrderByCreatedAtDesc(bookId);
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(5.0);
        book.setRating(Math.round(avg * 10.0) / 10.0);
        bookRepository.save(book);

        return saved;
    }
}
