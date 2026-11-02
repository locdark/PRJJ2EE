package com.library.controller;

import com.library.dto.AiResponseDto;
import com.library.entity.Book;
import com.library.service.AiLibrarianService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiGraphQLController {

    private final AiLibrarianService aiLibrarianService;

    @QueryMapping
    public AiResponseDto aiChat(@Argument String message) {
        return aiLibrarianService.chatWithAi(message);
    }

    @PostMapping("/api/ai/chat")
    @ResponseBody
    public ResponseEntity<AiResponseDto> restAiChat(@RequestBody Map<String, String> payload) {
        String message = payload != null ? payload.getOrDefault("message", "") : "";
        return ResponseEntity.ok(aiLibrarianService.chatWithAi(message));
    }

    @QueryMapping
    public List<Book> aiRecommendBooks(@Argument String interest) {
        return aiLibrarianService.recommendBooksByInterest(interest);
    }
}
