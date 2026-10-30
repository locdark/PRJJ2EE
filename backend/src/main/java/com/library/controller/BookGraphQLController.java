package com.library.controller;

import com.library.dto.BookInput;
import com.library.dto.BookPageResponse;
import com.library.entity.*;
import com.library.service.AuthService;
import com.library.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class BookGraphQLController {

    private final BookService bookService;
    private final AuthService authService;

    @QueryMapping
    public BookPageResponse books(
            @Argument(name = "page") Integer page,
            @Argument(name = "size") Integer size,
            @Argument(name = "categoryId") Long categoryId,
            @Argument(name = "keyword") String keyword
    ) {
        return bookService.getBooks(page != null ? page : 0, size != null ? size : 12, categoryId, keyword);
    }

    @QueryMapping
    public Book bookById(@Argument Long id) {
        return bookService.getBookById(id);
    }

    @QueryMapping
    public List<Book> featuredBooks() {
        return bookService.getFeaturedBooks();
    }

    @QueryMapping
    public List<Category> categories() {
        return bookService.getCategories();
    }

    @QueryMapping
    public List<Author> authors() {
        return bookService.getAuthors();
    }

    @QueryMapping
    public List<Publisher> publishers() {
        return bookService.getPublishers();
    }

    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public Book createBook(@Argument BookInput input) {
        return bookService.createBook(input);
    }

    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public Book updateBook(@Argument Long id, @Argument BookInput input) {
        return bookService.updateBook(id, input);
    }

    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public Boolean deleteBook(@Argument Long id) {
        return bookService.deleteBook(id);
    }

    @MutationMapping
    public Review addReview(
            @Argument Long bookId,
            @Argument Integer rating,
            @Argument String comment
    ) {
        User user = authService.getCurrentUser();
        if (user == null) {
            throw new RuntimeException("Bạn cần đăng nhập để đánh giá sách!");
        }
        return bookService.addReview(bookId, user, rating, comment);
    }
}
