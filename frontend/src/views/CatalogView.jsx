import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, BookOpen, Star, ArrowLeft, ArrowRight, 
  MapPin, SlidersHorizontal, Check, RotateCcw, LayoutGrid, 
  ListFilter, Calendar, DollarSign, Tag, BookmarkCheck,
  ChevronRight, X, Sparkles, BookMarked, Download, FileSpreadsheet
} from 'lucide-react';
import { graphqlQuery } from '../services/api';
import { GET_BOOKS, GET_CATEGORIES } from '../services/graphqlQueries';

export default function CatalogView({ 
  initialKeyword = '', 
  initialCategoryId = null, 
  initialScope = 'all',
  onSelectBook, 
  onBorrowClick 
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
  const [shelfFilter, setShelfFilter] = useState('all'); // all, shelf-A, shelf-B, shelf-C, shelf-D, shelf-E, shelf-F
  const [ratingFilter, setRatingFilter] = useState('all'); // all, 5, 4.5, 4.0
  const [priceFilter, setPriceFilter] = useState('all'); // all, under-100, 100-200, over-200
  const [sortBy, setSortBy] = useState('rating_desc'); // rating_desc, newest, title_asc, price_asc
  const [viewMode, setViewMode] = useState('grid'); // grid, table

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
  }, [initialKeyword, initialCategoryId, initialScope]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [booksData, catData] = await Promise.all([
        graphqlQuery(GET_BOOKS, { page: 0, size: 100 }),
        graphqlQuery(GET_CATEGORIES)
      ]);
      setAllBooks(booksData?.books?.content || []);
      setCategories(catData?.categories || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu kho sách:', err);
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
    setSortBy('rating_desc');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (!filteredBooks.length) return alert('Không có dữ liệu sách để xuất');
    const headers = ['Mã Sách', 'Nhan Đề', 'Tác Giả', 'ISBN', 'Chuyên Ngành', 'Năm XB', 'Vị Trí Kệ', 'Đánh Giá', 'Tổng Bản', 'Khả Dụng', 'Tiền Cọc (VND)'];
    const rows = filteredBooks.map(b => [
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
      b.price || 0
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_tai_lieu_smartlibrary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Smart Multi-Facet Filter Engine
  const filteredBooks = useMemo(() => {
    return allBooks.filter((book) => {
      // 1. Keyword & Scope Matching
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

      // 2. Category Filter
      if (selectedCategory && selectedCategory !== 'all') {
        if (String(book.category?.id) !== String(selectedCategory)) {
          return false;
        }
      }

      // 3. Availability Filter
      if (availabilityFilter === 'available') {
        if (book.availableCopies <= 0) return false;
      } else if (availabilityFilter === 'out_of_stock') {
        if (book.availableCopies > 0) return false;
      }

      // 4. Publication Year Filter
      if (yearFilter === '2024-2026') {
        if (book.publishYear < 2024) return false;
      } else if (yearFilter === '2020-2023') {
        if (book.publishYear < 2020 || book.publishYear > 2023) return false;
      } else if (yearFilter === 'before-2020') {
        if (book.publishYear >= 2020) return false;
      }

      // 5. Shelf Area Filter
      if (shelfFilter !== 'all') {
        const shelfCode = shelfFilter.replace('shelf-', '').toUpperCase();
        if (!book.shelfLocation?.toUpperCase().includes(shelfCode)) {
          return false;
        }
      }

      // 6. Rating Filter
      if (ratingFilter !== 'all') {
        const minRating = parseFloat(ratingFilter);
        if ((book.rating || 5) < minRating) return false;
      }

      // 7. Deposit Price Filter
      if (priceFilter === 'under-100') {
        if (book.price > 100000) return false;
      } else if (priceFilter === '100-200') {
        if (book.price < 100000 || book.price > 200000) return false;
      } else if (priceFilter === 'over-200') {
        if (book.price < 200000) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating_desc') return (b.rating || 5) - (a.rating || 5);
      if (sortBy === 'newest') return (b.publishYear || 2020) - (a.publishYear || 2020);
      if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      return 0;
    });
  }, [allBooks, keyword, searchScope, selectedCategory, availabilityFilter, yearFilter, shelfFilter, ratingFilter, priceFilter, sortBy]);

  // Pagination Slice
  const totalItems = filteredBooks.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Category counts map
  const categoryCountMap = useMemo(() => {
    const counts = {};
    allBooks.forEach(b => {
      if (b.category?.id) {
        counts[b.category.id] = (counts[b.category.id] || 0) + 1;
      }
    });
    return counts;
  }, [allBooks]);

  return (
    <div className="page-padding" style={{ width: '100%' }}>
      
      {/* Top Header Breadcrumb & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
            MỤC LỤC TRUY XUẤT CÔNG KHAI (OPAC ISO 2709)
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Kho Giáo Trình & Tài Liệu Nghiên Cứu
          </h1>
        </div>

        {/* View Mode & Export Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Xuất kết quả tìm kiếm ra tệp Excel CSV"
          >
            <Download size={14} color="#1d4ed8" /> Xuất Excel / CSV
          </button>

          <button 
            onClick={handleResetFilters}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Đặt lại toàn bộ tiêu chí lọc"
          >
            <RotateCcw size={14} /> Đặt lại bộ lọc
          </button>

          <div style={{ display: 'flex', background: '#ffffff', borderRadius: '7px', padding: '2px', border: '1px solid #cbd5e1' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#1d4ed8' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: '700'
              }}
            >
              <LayoutGrid size={14} /> Dạng Lưới
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#1d4ed8' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#64748b',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: '700'
              }}
            >
              <ListFilter size={14} /> Dạng Bảng Thư Viện
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout: Sidebar Filters (Left) + Results List (Right) */}
      <div className="responsive-catalog-layout">
        
        {/* ================= LEFT SIDEBAR: BỘ LỌC DOANH NGHIỆP ================= */}
        <aside className="glass-panel" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', position: 'sticky', top: '80px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: '800', color: '#0f172a', fontSize: '0.9rem' }}>
              <SlidersHorizontal size={16} color="#1d4ed8" /> TIÊU CHÍ LỌC
            </div>
            <span style={{ fontSize: '0.725rem', color: '#1d4ed8', fontWeight: '700', background: '#eff6ff', padding: '2px 7px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
              {totalItems} tài liệu
            </span>
          </div>

          {/* Filter Group 1: CHUYÊN NGÀNH HỌC THUẬT */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Tag size={12} /> CHUYÊN NGÀNH HỌC THUẬT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <button
                onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
                style={{
                  background: selectedCategory === 'all' ? '#eff6ff' : 'transparent',
                  color: selectedCategory === 'all' ? '#1d4ed8' : '#334155',
                  border: selectedCategory === 'all' ? '1px solid #bfdbfe' : '1px solid transparent',
                  padding: '6px 9px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.785rem',
                  fontWeight: selectedCategory === 'all' ? '700' : '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Tất cả chuyên ngành</span>
                <span style={{ fontSize: '0.675rem', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '10px' }}>
                  {allBooks.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = categoryCountMap[cat.id] || 0;
                const isSelected = String(selectedCategory) === String(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                    style={{
                      background: isSelected ? '#eff6ff' : 'transparent',
                      color: isSelected ? '#1d4ed8' : '#334155',
                      border: isSelected ? '1px solid #bfdbfe' : '1px solid transparent',
                      padding: '6px 9px',
                      borderRadius: '6px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.785rem',
                      fontWeight: isSelected ? '700' : '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '185px' }}>
                      {cat.name}
                    </span>
                    <span style={{ fontSize: '0.675rem', color: isSelected ? '#1d4ed8' : '#64748b', background: isSelected ? '#ffffff' : '#f1f5f9', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter Group 2: TÌNH TRẠNG LƯU KHO */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <BookmarkCheck size={12} /> TÌNH TRẠNG LƯU KHO
            </div>
            <select
              value={availabilityFilter}
              onChange={(e) => { setAvailabilityFilter(e.target.value); setCurrentPage(1); }}
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
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={12} /> NĂM PHÁT HÀNH
            </div>
            <select
              value={yearFilter}
              onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
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
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={12} /> VỊ TRÍ KỆ / PHÒNG ĐỌC
            </div>
            <select
              value={shelfFilter}
              onChange={(e) => { setShelfFilter(e.target.value); setCurrentPage(1); }}
              className="input-field"
              style={{ fontSize: '0.785rem', padding: '7px 9px' }}
            >
              <option value="all">Tất cả khu vực lưu trữ</option>
              <option value="shelf-A">Khu A: Tầng 1 - CNTT & J2EE</option>
              <option value="shelf-B">Khu B: Tầng 1 - Trí tuệ nhân tạo</option>
              <option value="shelf-C">Khu C: Tầng 2 - Kinh tế & Quản trị</option>
              <option value="shelf-D">Khu D: Tầng 2 - Kỹ năng & Lãnh đạo</option>
              <option value="shelf-E">Khu E: Tầng 3 - Khoa học Tự nhiên</option>
              <option value="shelf-F">Khu F: Tầng 3 - Văn học & Lịch sử</option>
            </select>
          </div>

          {/* Filter Group 5: ĐÁNH GIÁ HỌC THUẬT */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Star size={12} /> ĐÁNH GIÁ ĐỘC GIẢ
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
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
          <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Scope Dropdown */}
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

              {/* Main Search Input */}
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} color="#1d4ed8" style={{ position: 'absolute', top: '10px', left: '12px' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Nhập từ khóa tìm kiếm (Ví dụ: Java, Clean Code, Microservices, Spring Boot, AI, 978...)"
                  value={keyword}
                  onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
                  style={{ paddingLeft: '36px', paddingRight: keyword ? '32px' : '12px', fontSize: '0.825rem' }}
                />
                {keyword && (
                  <button
                    onClick={() => { setKeyword(''); setCurrentPage(1); }}
                    style={{ position: 'absolute', top: '9px', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.785rem', color: '#64748b', whiteSpace: 'nowrap' }}>Sắp xếp:</span>
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
            {(keyword || selectedCategory !== 'all' || availabilityFilter !== 'all' || yearFilter !== 'all' || shelfFilter !== 'all' || ratingFilter !== 'all') && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Đang lọc theo:</span>
                
                {keyword && (
                  <span className="badge badge-info" style={{ cursor: 'pointer' }} onClick={() => setKeyword('')}>
                    Từ khóa: "{keyword}" <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                {selectedCategory !== 'all' && (
                  <span className="badge badge-info" style={{ cursor: 'pointer' }} onClick={() => setSelectedCategory('all')}>
                    Chủ đề: {categories.find(c => String(c.id) === String(selectedCategory))?.name || selectedCategory} <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                {availabilityFilter !== 'all' && (
                  <span className="badge badge-success" style={{ cursor: 'pointer' }} onClick={() => setAvailabilityFilter('all')}>
                    {availabilityFilter === 'available' ? 'Còn trên kệ' : 'Đang cho mượn hết'} <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                {yearFilter !== 'all' && (
                  <span className="badge badge-warning" style={{ cursor: 'pointer' }} onClick={() => setYearFilter('all')}>
                    Năm: {yearFilter} <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                {shelfFilter !== 'all' && (
                  <span className="badge badge-secondary" style={{ cursor: 'pointer' }} onClick={() => setShelfFilter('all')}>
                    {shelfFilter.toUpperCase()} <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                {ratingFilter !== 'all' && (
                  <span className="badge badge-warning" style={{ cursor: 'pointer' }} onClick={() => setRatingFilter('all')}>
                    ≥ {ratingFilter} ⭐ <X size={11} style={{ marginLeft: '4px' }} />
                  </span>
                )}

                <button 
                  onClick={handleResetFilters}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.725rem', fontWeight: '700', cursor: 'pointer', marginLeft: '6px' }}
                >
                  [Xóa tất cả]
                </button>
              </div>
            )}
          </div>

          {/* Results Summary Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>
              Hiển thị <strong>{paginatedBooks.length}</strong> / <strong>{totalItems}</strong> tài liệu phù hợp
            </div>
            <div style={{ fontSize: '0.785rem', color: '#64748b' }}>
              Trang {currentPage} trên {totalPages}
            </div>
          </div>

          {/* ================= RESULTS CONTENT ================= */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <Sparkles size={28} color="#1d4ed8" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 10px' }} />
              <div>Đang truy vấn mục lục thư viện...</div>
            </div>
          ) : totalItems === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 24px', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <BookOpen size={44} color="#94a3b8" style={{ margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '6px' }}>
                Không tìm thấy tài liệu phù hợp
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 16px' }}>
                Vui lòng thử lại với từ khóa khác hoặc đặt lại bộ lọc tìm kiếm.
              </p>
              <button onClick={handleResetFilters} className="btn btn-primary">
                <RotateCcw size={14} /> Khôi phục bộ lọc mặc định
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ================= VIEW MODE 1: GRID VIEW ================= */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {paginatedBooks.map((book) => (
                <div 
                  key={book.id}
                  className="glass-panel card-hover-lift"
                  style={{ 
                    borderRadius: '12px', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    position: 'relative'
                  }}
                >
                  {/* Book Cover */}
                  <div 
                    onClick={() => onSelectBook(book)}
                    style={{ position: 'relative', height: '220px', cursor: 'pointer', overflow: 'hidden', background: '#f8fafc' }}
                  >
                    <img 
                      src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'} 
                      alt={book.title} 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />

                    {/* Star Rating Badge */}
                    <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#ffffff', padding: '2px 7px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.725rem', fontWeight: '800', color: '#b45309', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', border: '1px solid #fde68a' }}>
                      <Star size={11} fill="#f59e0b" color="#f59e0b" /> {book.rating || 5.0}
                    </div>

                    {/* Stock Status Badge */}
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px' }}>
                      <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                        {book.availableCopies > 0 ? `Còn ${book.availableCopies} bản` : 'Hết sách'}
                      </span>
                    </div>

                    {/* Publish Year Badge */}
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(15, 23, 42, 0.8)', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700' }}>
                      NXB {book.publishYear || 2024}
                    </div>
                  </div>

                  {/* Book Card Body */}
                  <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#1d4ed8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '3px', letterSpacing: '0.04em' }}>
                        {book.category?.name || 'Chuyên ngành'}
                      </div>
                      
                      <h3 
                        onClick={() => onSelectBook(book)}
                        title={book.title}
                        style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0f172a', marginBottom: '3px', cursor: 'pointer', lineHeight: '1.35', height: '2.7em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                      >
                        {book.title}
                      </h3>
                      
                      <div style={{ fontSize: '0.725rem', color: '#64748b', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Tác giả: <strong style={{ color: '#334155' }}>{book.author?.name}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '10px', background: '#f8fafc', padding: '4px 8px', borderRadius: '5px', border: '1px solid #f1f5f9' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} color="#1d4ed8" /> Kệ: <strong style={{ color: '#0f172a' }}>{book.shelfLocation}</strong>
                        </span>
                        <span>
                          ISBN: {book.isbn ? book.isbn.slice(-5) : '...'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
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
            <div className="glass-panel" style={{ borderRadius: '12px', overflowX: 'auto', marginBottom: '32px', border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: 'var(--shadow-card)' }}>
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px' }}>Bìa</th>
                    <th>Nhan đề & Tác giả</th>
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
                          src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'} 
                          alt="Cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100';
                          }}
                          style={{ width: '36px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                          onClick={() => onSelectBook(book)}
                        />
                      </td>
                      <td>
                        <div 
                          onClick={() => onSelectBook(book)}
                          style={{ fontWeight: '700', color: '#0f172a', cursor: 'pointer', lineHeight: '1.3' }}
                        >
                          {book.title}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                          {book.author?.name}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {book.category?.name}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: '#475569', fontSize: '0.75rem' }}>
                        {book.isbn}
                      </td>
                      <td style={{ color: '#64748b' }}>
                        {book.publishYear || '2024'}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#1d4ed8', fontWeight: '600' }}>
                          <MapPin size={11} /> {book.shelfLocation}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>
                          {book.availableCopies > 0 ? `Còn ${book.availableCopies} bản` : 'Hết sách'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
              <button
                className="btn btn-outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <ArrowLeft size={14} /> Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    background: currentPage === p ? '#1d4ed8' : '#ffffff',
                    color: currentPage === p ? '#ffffff' : '#334155',
                    border: currentPage === p ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                    borderRadius: '6px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: currentPage === p ? '700' : '500',
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                className="btn btn-outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
