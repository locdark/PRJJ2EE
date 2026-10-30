package com.library.dto;

import com.library.entity.Book;
import com.library.entity.BorrowRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalBooks;
    private long totalReaders;
    private long activeBorrowings;
    private long overdueBorrowings;
    private double totalRevenue;
    private List<BorrowRecord> recentBorrows;
    private List<Book> popularBooks;
}
