package com.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookInput {
    private String title;
    private String isbn;
    private String description;
    private String coverImage;
    private Double price;
    private Integer totalCopies;
    private Integer publishYear;
    private Long categoryId;
    private Long authorId;
    private Long publisherId;
    private String shelfLocation;
}
