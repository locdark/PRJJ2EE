import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  BookOpen,
  Star,
  ArrowLeft,
  ArrowRight,
  MapPin,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  ListFilter,
  Calendar,
  Tag,
  BookmarkCheck,
  X,
  Download,
  Heart,
  Mic,
  MicOff,
} from 'lucide-react';
import { graphqlQuery } from '../services/api';
import { GET_BOOKS, GET_CATEGORIES } from '../services/graphqlQueries';
import { showToast } from '../components/Toast';

export default function CatalogView({
  initialKeyword = '',
  initialCategoryId = null,
  initialScope = 'all',
  initialSavedOnly = false,
  wishlistIds = [],
  onToggleWishlist,
  onSelectBook,
  onBorrowClick,
}) {
  const [allBooks, setAllBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [keyword, setKeyword] = useState(initialKeyword);
  const [searchScope, setSearchScope] = useState(initialScope);
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId || 'all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // all, available, out_of_stock
  const [yearFilter, setYearFilter] = useState('all'); // all, 2024-2026, 2020-2023, before-2020
  const [shelfFilter, setShelfFilter] = useState('all'); // all, shelf-A..shelf-F
  const [ratingFilter, setRatingFilter] = useState('all'); // all, 5, 4.5, 4.0
  const [priceFilter, setPriceFilter] = useState('all'); // all, under-100, 100-200, over-200
  const [savedOnly, setSavedOnly] = useState(initialSavedOnly);
  const [sortBy, setSortBy] = useState('rating_desc'); // rating_desc, newest, title_asc, price_asc
  const [viewMode, setViewMode] = useState('grid'); // grid, table
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialKeyword !== undefined) setKeyword(initialKeyword);
    if (initialCategoryId !== undefined) setSelectedCategory(initialCategoryId || 'all');
    if (initialScope !== undefined) setSearchScope(initialScope || 'all');
    if (initialSavedOnly !== undefined) setSavedOnly(Boolean(initialSavedOnly));
  }, [initialKeyword, initialCategoryId, initialScope, initialSavedOnly]);

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói (Web Speech API).', 'warning');
      return;
    }
    if (isListening) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        showToast('🎙️ Đang lắng nghe... Hãy nói tên sách hoặc chủ đề cần tìm!', 'info', 2500);
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
        if (transcript) {
          setKeyword(transcript);
          setCurrentPage(1);
          showToast(`🎙️ Đã lọc kho sách theo giọng nói: "${transcript}"`, 'success', 3000);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        showToast('Không nhận diện được giọng nói, vui lòng thử lại.', 'warning', 2200);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      showToast('Không thể khởi động microphone.', 'error');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [booksData, catData] = await Promise.all([
        graphqlQuery(GET_BOOKS, { page: 0, size: 120 }),
        graphqlQuery(GET_CATEGORIES),
      ]);
      setAllBooks(booksData?.books?.content || []);
      setCategories(catData?.categories || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu kho sách:', err);
      showToast('Không thể tải mục lục kho sách', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setKeyword('');
    setSearchScope('all');
    setSelectedCategory('all');
    setAvailabilityFilter('all');
    setYearFilter('all');
    setShelfFilter('all');
    setRatingFilter('all');
    setPriceFilter('all');
    setSavedOnly(false);
    setSortBy('rating_desc');
    setCurrentPage(1);
    showToast('Đã khôi phục bộ lọc mặc định', 'info', 2000);
  };

  // Smart Multi-Facet Filter Engine
  const filteredBooks = useMemo(() => {
    return allBooks
      .filter((book) => {
        if (savedOnly && !wishlistIds.includes(String(book.id))) {
          return false;
        }
        if (keyword.trim()) {
          const query = keyword.toLowerCase().trim();
          if (searchScope === 'title') {
            if (!book.title?.toLowerCase().includes(query)) return false;
          } else if (searchScope === 'author') {
            if (!book.author?.name?.toLowerCase().includes(query)) return false;
          } else if (searchScope === 'isbn') {
            if (!book.isbn?.toLowerCase().includes(query)) return false;
          } else if (searchScope === 'category') {
            if (!book.category?.name?.toLowerCase().includes(query)) return false;
          } else {
            const matchTitle = book.title?.toLowerCase().includes(query);
            const matchAuthor = book.author?.name?.toLowerCase().includes(query);
            const matchIsbn = book.isbn?.toLowerCase().includes(query);
            const matchDesc = book.description?.toLowerCase().includes(query);
            const matchCat = book.category?.name?.toLowerCase().includes(query);
            if (!matchTitle && !matchAuthor && !matchIsbn && !matchDesc && !matchCat) return false;
          }
        }

        if (selectedCategory && selectedCategory !== 'all') {
          if (String(book.category?.id) !== String(selectedCategory)) {
            return false;
          }
        }

        if (availabilityFilter === 'available') {
          if (book.availableCopies <= 0) return false;
        } else if (availabilityFilter === 'out_of_stock') {
          if (book.availableCopies > 0) return false;
        }

        if (yearFilter === '2024-2026') {
          if (book.publishYear < 2024) return false;
        } else if (yearFilter === '2020-2023') {
          if (book.publishYear < 2020 || book.publishYear > 2023) return false;
        } else if (yearFilter === 'before-2020') {
          if (book.publishYear >= 2020) return false;
        }

        if (shelfFilter !== 'all') {
          const shelfCode = shelfFilter.replace('shelf-', '').toUpperCase();
          if (!book.shelfLocation?.toUpperCase().includes(shelfCode)) {
            return false;
          }
        }

        if (ratingFilter !== 'all') {
          const minRating = parseFloat(ratingFilter);
          if ((book.rating || 5) < minRating) return false;
        }

        if (priceFilter === 'under-100') {
          if (book.price > 100000) return false;
        } else if (priceFilter === '100-200') {
          if (book.price < 100000 || book.price > 200000) return false;
        } else if (priceFilter === 'over-200') {
          if (book.price < 200000) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating_desc') return (b.rating || 5) - (a.rating || 5);
        if (sortBy === 'newest') return (b.publishYear || 2020) - (a.publishYear || 2020);
        if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
        return 0;
      });
  }, [
    allBooks,
    savedOnly,
    wishlistIds,
    keyword,
    searchScope,
    selectedCategory,
    availabilityFilter,
    yearFilter,
    shelfFilter,
    ratingFilter,
    priceFilter,
    sortBy,
  ]);

  const handleExportCSV = () => {
    if (!filteredBooks.length) {
      showToast('Không có dữ liệu sách để xuất', 'warning');
      return;
    }
    const headers = [
      'Mã Sách',
      'Nhan Đề',
      'Tác Giả',
      'ISBN',
      'Chuyên Ngành',
      'Năm XB',
      'Vị Trí Kệ',
      'Đánh Giá',
      'Tổng Bản',
      'Khả Dụng',
      'Tiền Cọc (VND)',
    ];
    const rows = filteredBooks.map((b) => [
      b.id,
      `"${(b.title || '').replace(/"/g, '""')}"`,
      `"${(b.author?.name || '').replace(/"/g, '""')}"`,
      `"${b.isbn || ''}"`,
      `"${b.category?.name || ''}"`,
      b.publishYear || '',
      `"${b.shelfLocation || ''}"`,
      b.rating || 5.0,
      b.totalCopies || 0,
      b.availableCopies || 0,
      b.price || 0,
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `danh_sach_tai_lieu_smartlibrary_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Đã xuất ${filteredBooks.length} đầu sách ra tệp CSV`, 'success');
  };

  // Pagination Slice
  const totalItems = filteredBooks.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Category counts map
  const categoryCountMap = useMemo(() => {
    const counts = {};
    allBooks.forEach((b) => {
      if (b.category?.id) {
        counts[b.category.id] = (counts[b.category.id] || 0) + 1;
      }
    });
    return counts;
  }, [allBooks]);

  return (
    <div className="page-padding" style={{ width: '100%' }}>
      {/* Top Header Breadcrumb & Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--primary)',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '3px',
            }}
          >
            MỤC LỤC TRUY XUẤT CÔNG KHAI (OPAC ISO 2709)
          </div>
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Kho Giáo Trình &amp; Tài Liệu Nghiên Cứu
          </h1>
        </div>

        {/* View Mode & Export Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Mobile Filter Toggle Button (shown on < 992px) */}
          <button
            onClick={() => setMobileFilterOpen((prev) => !prev)}
            className="btn btn-primary catalog-mobile-filter-btn"
            style={{
              fontSize: '0.8rem',
              padding: '7px 14px',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Filter size={14} /> {mobileFilterOpen ? 'Ẩn Bộ Lọc' : 'Bộ Lọc Chuyên Ngành'}
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{
              fontSize: '0.8rem',
              padding: '7px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Xuất kết quả tìm kiếm ra tệp Excel CSV"
          >
            <Download size={14} color="var(--primary)" /> Xuất Excel / CSV
          </button>

          <button
            onClick={handleResetFilters}
            className="btn btn-outline"
            style={{
              fontSize: '0.8rem',
              padding: '7px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Đặt lại toàn bộ tiêu chí lọc"
          >
            <RotateCcw size={14} /> Đặt lại bộ lọc
          </button>

          <div
            style={{
              display: 'flex',
              background: 'var(--bg-card)',
              borderRadius: '7px',
              padding: '2px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
              }}
            >
              <LayoutGrid size={14} /> Dạng Lưới
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
              }}
            >
              <ListFilter size={14} /> Dạng Bảng Thư Viện
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout: Sidebar Filters (Left) + Results List (Right) */}
      <div className="responsive-catalog-layout catalog-layout-grid">
        {/* ================= LEFT SIDEBAR: BỘ LỌC DOANH NGHIỆP ================= */}
        <aside
          className={`glass-panel catalog-sidebar ${
            !mobileFilterOpen ? 'mobile-collapsed' : ''
          }`}
          style={{
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontWeight: '800',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
              }}
            >
              <SlidersHorizontal size={16} color="var(--primary)" /> TIÊU CHÍ LỌC
            </div>
            <span
              style={{
                fontSize: '0.725rem',
                color: 'var(--primary)',
                fontWeight: '700',
                background: 'var(--primary-light)',
                padding: '2px 7px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
              }}
            >
              {totalItems} tài liệu
            </span>
          </div>

          {/* Filter Group 1: CHUYÊN NGÀNH HỌC THUẬT */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: 'var(--primary)',
                textTransform: 'uppercase',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Tag size={12} /> CHUYÊN NGÀNH HỌC THUẬT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setCurrentPage(1);
                }}
                style={{
                  background: selectedCategory === 'all' ? 'var(--primary-light)' : 'transparent',
                  color: selectedCategory === 'all' ? 'var(--primary)' : 'var(--text-main)',
                  border:
                    selectedCategory === 'all'
                      ? '1px solid var(--border)'
                      : '1px solid transparent',
                  padding: '6px 9px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.785rem',
                  fontWeight: selectedCategory === 'all' ? '700' : '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Tất cả chuyên ngành</span>
                <span
                  style={{
                    fontSize: '0.675rem',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-elevated)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                  }}
                >
                  {allBooks.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = categoryCountMap[cat.id] || 0;
                const isSelected = String(selectedCategory) === String(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCurrentPage(1);
                    }}
                    style={{
                      background: isSelected ? 'var(--primary-light)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                      border: isSelected ? '1px solid var(--border)' : '1px solid transparent',
                      padding: '6px 9px',
                      borderRadius: '6px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.785rem',
                      fontWeight: isSelected ? '700' : '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '185px',
                      }}
                    >
                      {cat.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.675rem',
                        color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                        background: isSelected ? 'var(--bg-card)' : 'var(--bg-elevated)',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontWeight: '700',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Group 2: TÌNH TRẠNG LƯU KHO */}
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: 'var(--primary)',
                textTransform: 'uppercase',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <BookmarkCheck size={12} /> TÌNH TRẠNG LƯU KHO
            </div>
            <select
              value={availabilityFilter}
              onChange={(e) => {
                setAvailabilityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field"
              style={{ fontSize: '0.785rem', padding: '7px 9px' }}
            >
              <option value="all">Tất cả tình trạng</option>
              <option value="available">🟢 Còn sách trên kệ (Mượn ngay)</option>
              <option value="out_of_stock">🔴 Đang cho mượn hết</option>
            </select>
          </div>

          {/* Filter Group 3: NĂM XUẤT BẢN */}
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: 'var(--primary)',
                textTransform: 'uppercase',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Calendar size={12} /> NĂM PHÁT HÀNH
            </div>
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field"
              style={{ fontSize: '0.785rem', padding: '7px 9px' }}
            >
              <option value="all">Tất cả năm phát hành</option>
              <option value="2024-2026">2024 - 2026 (Mới cập nhật)</option>
              <option value="2020-2023">2020 - 2023 (Giáo trình chuẩn)</option>
              <option value="before-2020">Trước 2020 (Tài liệu tham khảo)</option>
            </select>
          </div>

          {/* Filter Group 4: VỊ TRÍ KỆ SÁCH */}
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: 'var(--primary)',
                textTransform: 'uppercase',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <MapPin size={12} /> VỊ TRÍ KỆ / PHÒNG ĐỌC
            </div>
            <select
              value={shelfFilter}
              onChange={(e) => {
                setShelfFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field"
              style={{ fontSize: '0.785rem', padding: '7px 9px' }}
            >
              <option value="all">Tất cả khu vực lưu trữ</option>
              <option value="shelf-A">Khu A: Tầng 1 - CNTT &amp; Kỹ thuật phần mềm</option>
              <option value="shelf-B">Khu B: Tầng 1 - Trí tuệ nhân tạo &amp; Dữ liệu</option>
              <option value="shelf-C">Khu C: Tầng 2 - Kinh tế &amp; Quản trị</option>
              <option value="shelf-D">Khu D: Tầng 2 - Kỹ năng &amp; Lãnh đạo</option>
              <option value="shelf-E">Khu E: Tầng 3 - Khoa học Tự nhiên</option>
              <option value="shelf-F">Khu F: Tầng 3 - Văn học &amp; Lịch sử</option>
            </select>
          </div>

          {/* Filter Group 5: ĐÁNH GIÁ HỌC THUẬT */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: 'var(--primary)',
                textTransform: 'uppercase',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Star size={12} /> ĐÁNH GIÁ ĐỘC GIẢ
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field"
              style={{ fontSize: '0.785rem', padding: '7px 9px' }}
            >
              <option value="all">Tất cả đánh giá</option>
              <option value="5.0">⭐⭐⭐⭐⭐ 5.0 sao (Tuyệt đối)</option>
              <option value="4.5">⭐⭐⭐⭐ 4.5 sao trở lên</option>
              <option value="4.0">⭐⭐⭐ 4.0 sao trở lên</option>
            </select>
          </div>

          {/* Reset button inside sidebar */}
          <button
            onClick={handleResetFilters}
            className="btn btn-outline"
            style={{ width: '100%', fontSize: '0.785rem', padding: '8px', marginTop: '6px' }}
          >
            <RotateCcw size={13} /> Khôi phục mặc định
          </button>
        </aside>

        {/* ================= RIGHT AREA: SEARCH BAR + ACTIVE FILTERS + RESULTS ================= */}
        <div>
          {/* Top Multi-Scope Search Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              marginBottom: '16px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value)}
                className="input-field"
                style={{ width: '140px', padding: '8px 10px', fontSize: '0.8rem' }}
              >
                <option value="all">Toàn bộ trường</option>
                <option value="title">Tên tài liệu</option>
                <option value="author">Tác giả</option>
                <option value="isbn">Mã ISBN</option>
                <option value="category">Chuyên ngành</option>
              </select>

              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search
                  size={16}
                  color="var(--primary)"
                  style={{ position: 'absolute', top: '10px', left: '12px' }}
                />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nhập từ khóa hoặc nhấn Mic để tìm bằng giọng nói (Tên sách, Tác giả, ISBN...)"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    paddingLeft: '36px',
                    paddingRight: keyword ? '64px' : '40px',
                    fontSize: '0.825rem',
                  }}
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => {
                      setKeyword('');
                      setCurrentPage(1);
                    }}
                    style={{
                      position: 'absolute',
                      top: '9px',
                      right: '36px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                    title="Xóa từ khóa"
                  >
                    <X size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={isListening ? 'mic-listening' : ''}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '8px',
                    background: isListening ? 'rgba(220, 38, 38, 0.12)' : 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: isListening ? '#dc2626' : 'var(--primary)',
                    cursor: 'pointer',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Tìm kiếm bằng giọng nói Tiếng Việt (Voice Search)"
                  aria-label="Tìm kiếm bằng giọng nói"
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              </div>

              {/* Saved Books / Wishlist Filter Pill */}
              <button
                type="button"
                onClick={() => {
                  setSavedOnly((prev) => !prev);
                  setCurrentPage(1);
                }}
                style={{
                  background: savedOnly ? '#e11d48' : '#fff1f2',
                  color: savedOnly ? '#ffffff' : '#e11d48',
                  border: '1px solid #fecdd3',
                  padding: '8px 13px',
                  borderRadius: '8px',
                  fontSize: '0.785rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
                title="Lọc nhanh các tài liệu trong Tủ sách Đọc sau / Yêu thích"
              >
                <Heart
                  size={14}
                  fill={savedOnly || wishlistIds.length > 0 ? 'currentColor' : 'none'}
                />
                <span>Đã lưu ({wishlistIds.length})</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  Sắp xếp:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field"
                  style={{ width: '160px', padding: '8px 10px', fontSize: '0.8rem' }}
                >
                  <option value="rating_desc">Đánh giá cao nhất</option>
                  <option value="newest">Năm XB mới nhất</option>
                  <option value="title_asc">Nhan đề (A → Z)</option>
                  <option value="price_asc">Giá cọc (Thấp → Cao)</option>
                  <option value="price_desc">Giá cọc (Cao → Thấp)</option>
                </select>
              </div>
            </div>

            {/* Active Filter Chips Tags */}
            {(savedOnly ||
              keyword ||
              selectedCategory !== 'all' ||
              availabilityFilter !== 'all' ||
              yearFilter !== 'all' ||
              shelfFilter !== 'all' ||
              ratingFilter !== 'all') && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '7px',
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Đang lọc theo:</span>

                {savedOnly && (
                  <span
                    className="badge badge-danger"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSavedOnly(false)}
                  >
                    ❤️ Tủ sách Đọc sau ({wishlistIds.length}) <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                {keyword && (
                  <span
                    className="badge badge-info"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setKeyword('')}
                  >
                    Từ khóa: &quot;{keyword}&quot; <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                {selectedCategory !== 'all' && (
                  <span
                    className="badge badge-info"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedCategory('all')}
                  >
                    Chủ đề:{' '}
                    {categories.find((c) => String(c.id) === String(selectedCategory))?.name ||
                      selectedCategory}{' '}
                    <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                {availabilityFilter !== 'all' && (
                  <span
                    className="badge badge-success"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setAvailabilityFilter('all')}
                  >
                    {availabilityFilter === 'available' ? 'Còn trên kệ' : 'Đang cho mượn hết'}{' '}
                    <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                {yearFilter !== 'all' && (
                  <span
                    className="badge badge-warning"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setYearFilter('all')}
                  >
                    Năm: {yearFilter} <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                {shelfFilter !== 'all' && (
                  <span
                    className="badge badge-secondary"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShelfFilter('all')}
                  >
                    {shelfFilter.toUpperCase()} <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                {ratingFilter !== 'all' && (
                  <span
                    className="badge badge-warning"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setRatingFilter('all')}
                  >
                    ≥ {ratingFilter} ⭐ <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                <button
                  onClick={handleResetFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '0.725rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginLeft: '6px',
                  }}
                >
                  [Xóa tất cả]
                </button>
              </div>
            )}
          </div>

          {/* Results Summary Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
              Hiển thị <strong>{paginatedBooks.length}</strong> / <strong>{totalItems}</strong> tài liệu phù hợp
            </div>
            <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
              Trang {currentPage} trên {totalPages}
            </div>
          </div>

          {/* ================= RESULTS CONTENT ================= */}
          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
              }}
            >
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="skeleton-card" style={{ padding: 0 }}>
                  <div className="skeleton" style={{ width: '100%', height: '220px', borderRadius: 0 }} />
                  <div style={{ padding: '12px' }}>
                    <div className="skeleton" style={{ width: '50%', height: '12px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: '90%', height: '16px', marginBottom: '6px' }} />
                    <div className="skeleton" style={{ width: '65%', height: '14px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ width: '100%', height: '32px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : totalItems === 0 ? (
            <div
              className="glass-panel"
              style={{
                textAlign: 'center',
                padding: '50px 24px',
                borderRadius: '12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              <BookOpen size={44} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                Không tìm thấy tài liệu phù hợp
              </h3>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  maxWidth: '420px',
                  margin: '0 auto 16px',
                }}
              >
                Vui lòng thử lại với từ khóa khác hoặc đặt lại bộ lọc tìm kiếm.
              </p>
              <button onClick={handleResetFilters} className="btn btn-primary">
                <RotateCcw size={14} /> Khôi phục bộ lọc mặc định
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ================= VIEW MODE 1: GRID VIEW ================= */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
              }}
            >
              {paginatedBooks.map((book) => (
                <div
                  key={book.id}
                  className="glass-panel card-hover-lift"
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    position: 'relative',
                  }}
                >
                  {/* Book Cover */}
                  <div
                    onClick={() => onSelectBook(book)}
                    style={{
                      position: 'relative',
                      height: '220px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    <img
                      src={
                        book.coverImage ||
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'
                      }
                      alt={book.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />

                    {/* Wishlist Heart Button */}
                    {onToggleWishlist && (
                      <button
                        type="button"
                        onClick={(e) => onToggleWishlist(book, e)}
                        title={
                          wishlistIds.includes(String(book.id))
                            ? 'Bỏ lưu khỏi Tủ sách Đọc sau'
                            : 'Lưu vào Tủ sách Đọc sau'
                        }
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: wishlistIds.includes(String(book.id))
                            ? '#fff1f2'
                            : 'rgba(255, 255, 255, 0.92)',
                          border: wishlistIds.includes(String(book.id))
                            ? '1px solid #fecdd3'
                            : '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)',
                          zIndex: 4,
                        }}
                      >
                        <Heart
                          size={14}
                          fill={wishlistIds.includes(String(book.id)) ? '#e11d48' : 'none'}
                          color={wishlistIds.includes(String(book.id)) ? '#e11d48' : '#64748b'}
                        />
                      </button>
                    )}

                    {/* Star Rating Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'var(--bg-card)',
                        padding: '2px 7px',
                        borderRadius: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '0.725rem',
                        fontWeight: '800',
                        color: '#d97706',
                        boxShadow: 'var(--shadow-sm)',
                        border: '1px solid #fde68a',
                      }}
                    >
                      <Star size={11} fill="#f59e0b" color="#f59e0b" /> {book.rating || 5.0}
                    </div>

                    {/* Stock Status Badge */}
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px' }}>
                      <span
                        className={`badge ${
                          book.availableCopies > 0 ? 'badge-success' : 'badge-danger'
                        }`}
                        style={{ fontSize: '0.65rem' }}
                      >
                        {book.availableCopies > 0
                          ? `Còn ${book.availableCopies} bản`
                          : 'Hết sách'}
                      </span>
                    </div>

                    {/* Publish Year Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                      }}
                    >
                      NXB {book.publishYear || 2024}
                    </div>
                  </div>

                  {/* Book Card Body */}
                  <div
                    style={{
                      padding: '12px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--primary)',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          marginBottom: '3px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {book.category?.name || 'Chuyên ngành'}
                      </div>

                      <h3
                        onClick={() => onSelectBook(book)}
                        title={book.title}
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: '800',
                          color: 'var(--text-main)',
                          marginBottom: '3px',
                          cursor: 'pointer',
                          lineHeight: '1.35',
                          height: '2.7em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {book.title}
                      </h3>

                      <div
                        style={{
                          fontSize: '0.725rem',
                          color: 'var(--text-muted)',
                          marginBottom: '6px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        Tác giả: <strong style={{ color: 'var(--text-main)' }}>{book.author?.name}</strong>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          marginBottom: '10px',
                          background: 'var(--bg-elevated)',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} color="var(--primary)" /> Kệ:{' '}
                          <strong style={{ color: 'var(--text-main)' }}>{book.shelfLocation}</strong>
                        </span>
                        <span>ISBN: {book.isbn ? book.isbn.slice(-5) : '...'}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px',
                        borderTop: '1px solid var(--border)',
                        paddingTop: '8px',
                      }}
                    >
                      <button
                        className="btn btn-outline"
                        onClick={() => onSelectBook(book)}
                        style={{ fontSize: '0.725rem', padding: '6px 8px' }}
                      >
                        Chi tiết
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => onBorrowClick(book)}
                        disabled={book.availableCopies <= 0}
                        style={{ fontSize: '0.725rem', padding: '6px 8px' }}
                      >
                        Mượn sách
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ================= VIEW MODE 2: OPAC TABLE VIEW ================= */
            <div
              className="glass-panel"
              style={{
                borderRadius: '12px',
                overflowX: 'auto',
                marginBottom: '32px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px' }}>Bìa</th>
                    <th>Nhan đề &amp; Tác giả</th>
                    <th>Chuyên ngành</th>
                    <th>Mã ISBN</th>
                    <th>Năm XB</th>
                    <th>Vị trí lưu trữ</th>
                    <th>Tình trạng</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBooks.map((book) => (
                    <tr key={book.id}>
                      <td>
                        <img
                          src={
                            book.coverImage ||
                            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'
                          }
                          alt="Cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100';
                          }}
                          style={{
                            width: '36px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: '1px solid var(--border)',
                          }}
                          onClick={() => onSelectBook(book)}
                        />
                      </td>
                      <td>
                        <div
                          onClick={() => onSelectBook(book)}
                          style={{
                            fontWeight: '700',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            lineHeight: '1.3',
                          }}
                        >
                          {book.title}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          {book.author?.name}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">{book.category?.name}</span>
                      </td>
                      <td
                        style={{
                          fontFamily: 'monospace',
                          color: 'var(--text-muted)',
                          fontSize: '0.75rem',
                        }}
                      >
                        {book.isbn}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {book.publishYear || '2024'}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            color: 'var(--primary)',
                            fontWeight: '600',
                          }}
                        >
                          <MapPin size={11} /> {book.shelfLocation}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            book.availableCopies > 0 ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {book.availableCopies > 0
                            ? `Còn ${book.availableCopies} bản`
                            : 'Hết sách'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {onToggleWishlist && (
                            <button
                              type="button"
                              onClick={(e) => onToggleWishlist(book, e)}
                              className="btn btn-outline"
                              style={{
                                padding: '4px 7px',
                                borderColor: wishlistIds.includes(String(book.id))
                                  ? '#fecdd3'
                                  : 'var(--border)',
                                color: wishlistIds.includes(String(book.id))
                                  ? '#e11d48'
                                  : 'var(--text-muted)',
                              }}
                              title="Lưu vào Tủ sách Đọc sau"
                            >
                              <Heart
                                size={13}
                                fill={wishlistIds.includes(String(book.id)) ? '#e11d48' : 'none'}
                                color={wishlistIds.includes(String(book.id)) ? '#e11d48' : 'currentColor'}
                              />
                            </button>
                          )}
                          <button
                            className="btn btn-outline"
                            onClick={() => onSelectBook(book)}
                            style={{ padding: '4px 8px', fontSize: '0.725rem' }}
                          >
                            Xem
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => onBorrowClick(book)}
                            disabled={book.availableCopies <= 0}
                            style={{ padding: '4px 10px', fontSize: '0.725rem' }}
                          >
                            Mượn
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ================= PAGINATION CONTROLS ================= */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '20px',
                flexWrap: 'wrap',
              }}
            >
              <button
                className="btn btn-outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <ArrowLeft size={14} /> Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    background: currentPage === p ? 'var(--primary)' : 'var(--bg-card)',
                    color: currentPage === p ? '#ffffff' : 'var(--text-main)',
                    border:
                      currentPage === p
                        ? '1px solid var(--primary)'
                        : '1px solid var(--border)',
                    borderRadius: '6px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: currentPage === p ? '700' : '500',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                className="btn btn-outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Sau <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
