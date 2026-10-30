package com.library.controller;

import com.library.dto.AiResponseDto;
import com.library.entity.Book;
import com.library.service.AiLibrarianService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class AiGraphQLController {

    private final AiLibrarianService aiLibrarianService;

    @QueryMapping
    public AiResponseDto aiChat(@Argument String message) {
        return aiLibrarianService.chatWithAi(message);
    }

    @QueryMapping
    public List<Book> aiRecommendBooks(@Argument String interest) {
        return aiLibrarianService.recommendBooksByInterest(interest);
    }
}
