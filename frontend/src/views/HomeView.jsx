import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Star,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Award,
  Zap,
  Search,
  FileCheck2,
  Library,
  Heart,
} from 'lucide-react';
import { graphqlQuery } from '../services/api';
import { GET_BOOKS, GET_CATEGORIES } from '../services/graphqlQueries';

export default function HomeView({
  onSelectBook,
  onOpenAi,
  onGoCatalog,
  settings,
  stats,
  wishlistIds = [],
  onToggleWishlist,
}) {
  const [allBooks, setAllBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('newest'); // newest, recommended
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const [booksRes, catRes] = await Promise.all([
        graphqlQuery(GET_BOOKS, { page: 0, size: 30 }),
        graphqlQuery(GET_CATEGORIES),
      ]);
      setAllBooks(booksRes?.books?.content || []);
      setCategories(catRes?.categories || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hero Spotlight Featured Book (Top 1 after load)
  const spotlightBook = allBooks[0] || {
    id: 1,
    title: 'Clean Code: Nghệ Thuật Viết Mã Sạch & Thiết Kế Phần Mềm',
    author: { name: 'Robert C. Martin' },
    rating: 4.9,
    publishYear: 2024,
    shelfLocation: 'Khu A: Tầng 1 - Kệ IT-A01',
    category: { name: 'Công nghệ thông tin & Kỹ thuật phần mềm' },
    availableCopies: 8,
    totalCopies: 10,
    description:
      'Giáo trình nền tảng dành cho sinh viên và kỹ sư phần mềm về phương pháp tổ chức mã nguồn khoa học, tư duy thiết kế hướng đối tượng và quy trình phát triển hệ thống chuẩn mực.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
  };

  const newestBooks = allBooks.slice(0, 10);
  const recommendedBooks = [...allBooks]
    .sort((a, b) => (b.rating || 5) - (a.rating || 5))
    .slice(0, 10);

  const displayBooks = activeTab === 'newest' ? newestBooks : recommendedBooks;

  // Enterprise Bento Grid Collections
  const topicCollections = [
    {
      id: 'tech',
      name: 'Công Nghệ Thông Tin & Phần Mềm',
      desc: 'Cấu trúc dữ liệu, giải thuật, mạng máy tính, cơ sở dữ liệu & an toàn thông tin',
      count: '20 tài liệu',
      accent: '#3b82f6',
      icon: '💻',
      query: 'Công nghệ',
    },
    {
      id: 'ai',
      name: 'Trí Tuệ Nhân Tạo & Data',
      desc: 'Machine Learning, Deep Learning, GenAI, MLOps & Big Data',
      count: '15 tài liệu',
      accent: '#8b5cf6',
      icon: '🤖',
      query: 'Trí tuệ nhân tạo',
    },
    {
      id: 'economics',
      name: 'Kinh Tế & Quản Trị Đổi Mới',
      desc: 'Quản trị chiến lược, Fintech, Marketing & Tài chính doanh nghiệp',
      count: '14 tài liệu',
      accent: '#10b981',
      icon: '📈',
      query: 'Kinh tế',
    },
    {
      id: 'skills',
      name: 'Kỹ Năng Lãnh Đạo & Tư Duy',
      desc: 'Tư duy phản biện, đàm phán thương thuyết & quản trị cảm xúc',
      count: '14 tài liệu',
      accent: '#06b6d4',
      icon: '🧠',
      query: 'Kỹ năng',
    },
    {
      id: 'science',
      name: 'Khoa Học & Kỹ Thuật Tự Nhiên',
      desc: 'Vật lý hiện đại, toán ứng dụng, tự động hóa & năng lượng xanh',
      count: '14 tài liệu',
      accent: '#0284c7',
      icon: '🔬',
      query: 'Khoa học',
    },
    {
      id: 'literature',
      name: 'Văn Học Cổ Điển & Đương Đại',
      desc: 'Kiệt tác văn học Việt Nam, tiểu thuyết kinh điển thế giới',
      count: '13 tài liệu',
      accent: '#e11d48',
      icon: '📜',
      query: 'Văn học',
    },
    {
      id: 'history',
      name: 'Lịch Sử & Triết Học Tư Tưởng',
      desc: 'Quốc sử Đại Việt, văn minh nhân loại & các trường phái triết học',
      count: '10 tài liệu',
      accent: '#d97706',
      icon: '🏛️',
      query: 'Lịch sử',
    },
    {
      id: 'kids',
      name: 'Kho Sách Số Mở & Ebooks',
      desc: 'Tài liệu số hóa đa phương tiện, giáo dục STEAM & nghiên cứu mở',
      count: `${stats?.totalBooks || allBooks.length || 100}+ Ebook`,
      accent: '#0d9488',
      icon: '📚',
      query: '',
    },
  ];

  return (
    <div className="page-padding" style={{ width: '100%' }}>
      {/* ================= 1. HERO SPOTLIGHT WITH 3D REALISTIC BOOK SHOWCASE ================= */}
      <div
        className="glass-panel hero-card-padding"
        style={{
          borderRadius: '16px',
          marginBottom: '32px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Architectural Background Accent */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-50px',
            width: '380px',
            height: '380px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Enterprise Institutional Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            marginBottom: '28px',
            borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '12px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
            <span
              style={{
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.725rem',
                fontWeight: '800',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              TRUNG TÂM THÔNG TIN – THƯ VIỆN ĐẠI HỌC
            </span>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600', minWidth: 0 }}>
              Cổng Học Liệu Học Thuật &amp; Tra Cứu Giáo Trình Chuẩn Quốc Tế DDC / MARC-21
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'inline-block',
                }}
              />
              Mở cửa: <strong style={{ color: 'var(--text-main)' }}>{settings?.openingHours || '07:30 – 21:00 (T2 - T7)'}</strong>
            </span>
            <span>•</span>
            <span>
              Độc giả đang đọc:{' '}
              <strong style={{ color: 'var(--primary)' }}>
                {stats?.onlineReaders || (allBooks.length > 0 ? allBooks.length + 18 : 28)} bạn đọc
              </strong>
            </span>
            {settings?.moitVerificationEnabled !== false && (
              <>
                <span>•</span>
                <span style={{ color: '#10b981', fontWeight: '700' }}>✓ Xác thực Bộ Công Thương</span>
              </>
            )}
          </div>
        </div>

        {/* Hero Spotlight Body: Skeleton vs Loaded Book */}
        {loading ? (
          <div className="responsive-hero-grid" style={{ position: 'relative', zIndex: 2 }}>
            <div>
              <div className="skeleton" style={{ width: '240px', height: '28px', marginBottom: '16px' }} />
              <div className="skeleton" style={{ width: '85%', height: '42px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ width: '60%', height: '32px', marginBottom: '18px' }} />
              <div className="skeleton" style={{ width: '92%', height: '68px', marginBottom: '22px' }} />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '26px' }}>
                <div className="skeleton" style={{ width: '160px', height: '36px' }} />
                <div className="skeleton" style={{ width: '180px', height: '36px' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="skeleton" style={{ width: '190px', height: '42px' }} />
                <div className="skeleton" style={{ width: '210px', height: '42px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '260px', height: '370px', borderRadius: '10px' }} />
            </div>
          </div>
        ) : (
          <div className="responsive-hero-grid" style={{ position: 'relative', zIndex: 2 }}>
            {/* Left Column: Spotlight Info */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--border)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  marginBottom: '16px',
                  letterSpacing: '0.04em',
                }}
              >
                <Award size={14} /> GIÁO TRÌNH TIÊU BIỂU • ĐƯỢC ĐÁNH GIÁ XUẤT SẮC
              </div>

              <h1
                className="hero-spotlight-title"
                style={{
                  fontSize: '2.3rem',
                  fontWeight: '900',
                  color: 'var(--text-main)',
                  lineHeight: '1.2',
                  marginBottom: '12px',
                  letterSpacing: '-0.02em',
                }}
              >
                {spotlightBook.title}
              </h1>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  Tác giả: <strong style={{ color: 'var(--text-main)' }}>{spotlightBook.author?.name}</strong>
                </span>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#f59e0b',
                    fontWeight: '800',
                  }}
                >
                  <Star size={14} fill="#f59e0b" color="#f59e0b" /> {spotlightBook.rating || 5.0} (128 phản hồi học
                  thuật)
                </span>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span className="badge badge-primary">{spotlightBook.category?.name}</span>
              </div>

              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.65',
                  marginBottom: '22px',
                  maxWidth: '640px',
                }}
              >
                {spotlightBook.description}
              </p>

              {/* Location & Stock Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '26px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--bg-elevated)',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    color: 'var(--primary)',
                    fontWeight: '700',
                  }}
                >
                  <MapPin size={14} /> {spotlightBook.shelfLocation}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ecfdf5',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid #a7f3d0',
                    fontSize: '0.8rem',
                    color: '#047857',
                    fontWeight: '700',
                  }}
                >
                  <CheckCircle2 size={14} /> Sẵn sàng cho mượn ({spotlightBook.availableCopies}/
                  {spotlightBook.totalCopies} bản)
                </div>
              </div>

              {/* Action CTA Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => onSelectBook(spotlightBook)}
                  className="btn btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.875rem' }}
                >
                  <BookOpen size={16} /> Đăng ký mượn tài liệu
                </button>

                <button
                  onClick={onOpenAi}
                  className="btn btn-outline"
                  style={{
                    padding: '10px 18px',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                  }}
                >
                  <Sparkles size={15} color="var(--primary)" /> Hỏi Trợ Lý AI về tài liệu
                </button>

                {onToggleWishlist && (
                  <button
                    type="button"
                    onClick={(e) => onToggleWishlist(spotlightBook, e)}
                    className="btn btn-outline"
                    style={{
                      padding: '10px 16px',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderColor: wishlistIds.includes(String(spotlightBook.id))
                        ? '#fecdd3'
                        : 'var(--border)',
                      background: wishlistIds.includes(String(spotlightBook.id))
                        ? '#fff1f2'
                        : 'var(--bg-card)',
                      color: wishlistIds.includes(String(spotlightBook.id))
                        ? '#e11d48'
                        : 'var(--text-main)',
                    }}
                    title="Lưu vào Tủ sách Đọc sau / Yêu thích"
                  >
                    <Heart
                      size={15}
                      fill={wishlistIds.includes(String(spotlightBook.id)) ? '#e11d48' : 'none'}
                      color={wishlistIds.includes(String(spotlightBook.id)) ? '#e11d48' : 'currentColor'}
                    />
                    {wishlistIds.includes(String(spotlightBook.id)) ? 'Đã lưu' : 'Lưu đọc sau'}
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: 3D Realistic Book Perspective Cover */}
            <div className="book-3d-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div
                onClick={() => onSelectBook(spotlightBook)}
                className="book-3d"
                style={{
                  width: '260px',
                  height: '370px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                title="Nhấn để xem chi tiết cuốn sách này"
              >
                <img
                  src={
                    spotlightBook.coverImage ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'
                  }
                  alt={spotlightBook.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500';
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '4px 10px 10px 4px',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(105deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.03) 35%, transparent 60%)',
                    borderRadius: '4px 10px 10px 4px',
                    pointerEvents: 'none',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    bottom: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    whiteSpace: 'nowrap',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.725rem',
                    fontWeight: '800',
                    color: 'var(--text-main)',
                  }}
                >
                  <span style={{ color: '#10b981' }}>● CÒN {spotlightBook.availableCopies} BẢN</span>
                  <span style={{ color: 'var(--text-muted)' }}>• NXB {spotlightBook.publishYear || 2024}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Search Bar inside Hero */}
        <div
          style={{
            marginTop: '36px',
            paddingTop: '24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flex: 1,
              minWidth: '220px',
              width: '100%',
              maxWidth: '580px',
              background: 'var(--bg-elevated)',
              padding: '5px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <Search size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Tra cứu nhanh trong 100 đầu sách (Nhan đề, Tác giả, ISBN...)"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onGoCatalog(searchKeyword);
              }}
              style={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                outline: 'none',
                fontSize: '0.825rem',
              }}
            />
            <button
              onClick={() => onGoCatalog(searchKeyword)}
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.775rem', flexShrink: 0 }}
            >
              Tìm kiếm
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontWeight: '600' }}>Chủ đề tra cứu nhiều:</span>
            {['Trí tuệ nhân tạo', 'Kinh tế học', 'Khoa học dữ liệu', 'Kỹ năng lãnh đạo', 'Văn học'].map((tag) => (
              <span
                key={tag}
                onClick={() => onGoCatalog(tag)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  color: 'var(--primary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ================= 2. ENTERPRISE KPI & QUALITY PILLARS ================= */}
      <div className="responsive-kpi-grid">
        <div
          className="glass-panel card-hover-lift"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              background: 'var(--primary-light)',
              border: '1px solid var(--border)',
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              flexShrink: 0,
            }}
          >
            <Library size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.2' }}>
              {stats?.totalBooks
                ? `${stats.totalBooks}+ Đầu Sách`
                : allBooks.length > 0
                ? `${allBooks.length}+ Đầu Sách`
                : '100+ Giáo Trình'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {stats?.totalCopies
                ? `${stats.totalCopies} bản lưu hành • ${categories.length || 7} chuyên ngành`
                : 'Bản quyền 7 chuyên ngành mũi nhọn'}
            </div>
          </div>
        </div>

        <div
          className="glass-panel card-hover-lift"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              background: 'rgba(124, 58, 237, 0.12)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed',
              flexShrink: 0,
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.2' }}>
              Trợ Lý AI Học Thuật
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Phân tích đề cương &amp; gợi ý tài liệu
            </div>
          </div>
        </div>

        <div
          className="glass-panel card-hover-lift"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              background: 'rgba(5, 150, 105, 0.12)',
              border: '1px solid rgba(5, 150, 105, 0.3)',
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              flexShrink: 0,
            }}
          >
            <FileCheck2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.2' }}>
              Chuẩn ISO &amp; OPAC
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Phân loại tiêu chuẩn quốc tế DDC
            </div>
          </div>
        </div>

        <div
          className="glass-panel card-hover-lift"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              background: 'rgba(13, 148, 136, 0.12)',
              border: '1px solid rgba(13, 148, 136, 0.3)',
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0d9488',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.2' }}>
              Bảo Mật Cấp Độ 3
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Chứng thực người dùng &amp; mã hóa dữ liệu
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. POPULAR ACADEMIC TOPICS (ENTERPRISE BENTO GRID) ================= */}
      <div style={{ marginBottom: '40px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
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
              DANH MỤC CHUYÊN NGÀNH HỌC THUẬT
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Khám Phá Theo Chủ Đề Nghiên Cứu
            </h2>
          </div>

          <button
            onClick={() => onGoCatalog()}
            className="btn btn-outline"
            style={{
              fontSize: '0.8rem',
              padding: '7px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Xem tất cả {categories.length || 7} chuyên ngành <ChevronRight size={14} />
          </button>
        </div>

        {/* 8 Bento Topic Cards Grid */}
        <div className="responsive-topics-grid">
          {topicCollections.map((topic) => (
            <div
              key={topic.id}
              onClick={() => onGoCatalog(topic.query)}
              className="glass-panel card-hover-lift"
              style={{
                padding: '18px',
                borderRadius: '12px',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '125px',
                background: 'var(--bg-card)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{topic.icon}</span>
                  <span
                    style={{
                      fontSize: '0.675rem',
                      color: topic.accent,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontWeight: '700',
                    }}
                  >
                    {topic.count}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '0.925rem',
                    fontWeight: '800',
                    color: 'var(--text-main)',
                    margin: '0 0 4px',
                    lineHeight: '1.3',
                  }}
                >
                  {topic.name}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                  {topic.desc}
                </p>
              </div>

              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  color: topic.accent,
                  fontSize: '0.725rem',
                  fontWeight: '700',
                  gap: '4px',
                }}
              >
                Khám phá <ArrowRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= 4. CURATED BOOK SHOWCASE: TABS FOR NEWEST & RECOMMENDED ================= */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
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
              MỤC LỤC TÀI LIỆU TUYỂN CHỌN
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              Kho Tài Liệu Đọc &amp; Nghiên Cứu
            </h2>
          </div>

          {/* Interactive Modern Switch Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-elevated)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setActiveTab('newest')}
              style={{
                background: activeTab === 'newest' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'newest' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={14} /> Sách Mới Cập Nhật ({newestBooks.length})
            </button>

            <button
              onClick={() => setActiveTab('recommended')}
              style={{
                background: activeTab === 'recommended' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'recommended' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Star size={14} fill={activeTab === 'recommended' ? '#ffffff' : 'none'} /> Sách Đề Xuất Đọc (
              {recommendedBooks.length})
            </button>
          </div>
        </div>

        {/* 5-Column Grid x 2 Rows = 10 Modern Book Cards (or Skeleton placeholders while loading) */}
        {loading ? (
          <div className="responsive-books-grid">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="skeleton-card" style={{ padding: '0' }}>
                <div className="skeleton" style={{ width: '100%', aspectRatio: '3 / 4.2', borderRadius: 0 }} />
                <div style={{ padding: '12px' }}>
                  <div className="skeleton" style={{ width: '50%', height: '12px', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ width: '90%', height: '16px', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ width: '70%', height: '14px', marginBottom: '12px' }} />
                  <div className="skeleton" style={{ width: '100%', height: '24px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="responsive-books-grid">
            {displayBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => onSelectBook(book)}
                className="glass-panel card-hover-lift"
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                }}
              >
                {/* Cover Image with Floating Badges */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '3 / 4.2',
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

                  {/* Rating Badge */}
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

                  {/* Stock Badge */}
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px' }}>
                    <span
                      className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {book.availableCopies > 0 ? `Còn ${book.availableCopies} cuốn` : 'Đã mượn hết'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
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
                      {book.category?.name}
                    </div>

                    <h3
                      title={book.title}
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: '800',
                        color: 'var(--text-main)',
                        margin: '0 0 4px',
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
                        marginBottom: '8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Tác giả: <strong style={{ color: 'var(--text-main)' }}>{book.author?.name}</strong>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.7rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={11} color="var(--primary)" /> Kệ:{' '}
                      <strong style={{ color: 'var(--text-main)' }}>{book.shelfLocation}</strong>
                    </span>

                    <span
                      style={{
                        color: 'var(--primary)',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      Chi tiết <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
