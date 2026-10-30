package com.library.dto;

import com.library.entity.Book;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResponseDto {
    private String reply;
    private List<Book> recommendedBooks;
    private List<String> suggestedTopics;
}
