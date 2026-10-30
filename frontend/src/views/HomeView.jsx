import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Star, Sparkles, ArrowRight, Layers, CreditCard, 
  ShieldCheck, MapPin, Bookmark, CheckCircle2, ChevronRight,
  TrendingUp, Award, ExternalLink, Zap, Users, Search, Flame,
  FileCheck2, Database, Library
} from 'lucide-react';
import { graphqlQuery } from '../services/api';
import { GET_BOOKS, GET_CATEGORIES } from '../services/graphqlQueries';

export default function HomeView({ onSelectBook, onOpenAi, onGoCatalog, settings, stats }) {
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
        graphqlQuery(GET_CATEGORIES)
      ]);
      setAllBooks(booksRes?.books?.content || []);
      setCategories(catRes?.categories || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hero Spotlight Featured Book (Top 1)
  const spotlightBook = allBooks[0] || {
    id: 1,
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: { name: 'Robert C. Martin (Uncle Bob)' },
    rating: 4.9,
    publishYear: 2024,
    shelfLocation: 'Khu A: Tầng 1 - Kệ IT-A01',
    category: { name: 'Công nghệ & Lập trình J2EE' },
    availableCopies: 8,
    totalCopies: 10,
    description: 'Tác phẩm kinh điển về nghệ thuật viết mã sạch, tối ưu hóa cấu trúc chương trình hướng đối tượng, xử lý ngoại lệ và thiết kế kiến trúc phần mềm chuyên nghiệp cho kỹ sư Enterprise.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'
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
      name: 'Công nghệ & Lập trình J2EE',
      desc: 'Java 21, Spring Boot 3, GraphQL, Microservices & React 19',
      count: '20 tài liệu',
      bg: '#f0f7ff',
      border: '#bfdbfe',
      accent: '#1d4ed8',
      icon: '💻',
      query: 'Công nghệ'
    },
    {
      id: 'ai',
      name: 'Trí Tuệ Nhân Tạo & Data',
      desc: 'Machine Learning, Deep Learning, GenAI, MLOps & Big Data',
      count: '15 tài liệu',
      bg: '#f5f3ff',
      border: '#ddd6fe',
      accent: '#7c3aed',
      icon: '🤖',
      query: 'Trí tuệ nhân tạo'
    },
    {
      id: 'economics',
      name: 'Kinh Tế & Quản Trị Đổi Mới',
      desc: 'Quản trị chiến lược, Fintech, Marketing & Tài chính doanh nghiệp',
      count: '14 tài liệu',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      accent: '#059669',
      icon: '📈',
      query: 'Kinh tế'
    },
    {
      id: 'skills',
      name: 'Kỹ Năng Lãnh Đạo & Tư Duy',
      desc: 'Tư duy phản biện, đàm phán thương thuyết & quản trị cảm xúc',
      count: '14 tài liệu',
      bg: '#ecfeff',
      border: '#a5f3fc',
      accent: '#0891b2',
      icon: '🧠',
      query: 'Kỹ năng'
    },
    {
      id: 'science',
      name: 'Khoa Học & Kỹ Thuật Tự Nhiên',
      desc: 'Vật lý hiện đại, toán ứng dụng, tự động hóa & năng lượng xanh',
      count: '14 tài liệu',
      bg: '#f0f9ff',
      border: '#bae6fd',
      accent: '#0284c7',
      icon: '🔬',
      query: 'Khoa học'
    },
    {
      id: 'literature',
      name: 'Văn Học Cổ Điển & Đương Đại',
      desc: 'Kiệt tác văn học Việt Nam, tiểu thuyết kinh điển thế giới',
      count: '13 tài liệu',
      bg: '#fff1f2',
      border: '#fecdd3',
      accent: '#e11d48',
      icon: '📜',
      query: 'Văn học'
    },
    {
      id: 'history',
      name: 'Lịch Sử & Triết Học Tư Tưởng',
      desc: 'Quốc sử Đại Việt, văn minh nhân loại & các trường phái triết học',
      count: '10 tài liệu',
      bg: '#fffbeb',
      border: '#fde68a',
      accent: '#d97706',
      icon: '🏛️',
      query: 'Lịch sử'
    },
    {
      id: 'kids',
      name: 'Kho Sách Số Mở & Ebooks',
      desc: 'Tài liệu số hóa đa phương tiện, giáo dục STEAM & nghiên cứu mở',
      count: '100+ Ebook',
      bg: '#f0fdfa',
      border: '#99f6e4',
      accent: '#0d9488',
      icon: '📚',
      query: 'Tất cả'
    }
  ];

  return (
    <div className="page-padding" style={{ width: '100%' }}>
      
      {/* ================= 1. HERO SPOTLIGHT WITH 3D REALISTIC BOOK SHOWCASE ================= */}
      <div 
        className="glass-panel hero-card-padding" 
        style={{ 
          borderRadius: '16px', 
          marginBottom: '32px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 60%, #eff6ff 100%)',
          border: '1px solid #cbd5e1',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Corporate Architectural Background Accent */}
        <div style={{ position: 'absolute', top: '-100px', right: '-50px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Enterprise Institutional Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', marginBottom: '28px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
            <span style={{ 
              background: '#eff6ff', 
              color: '#1d4ed8', 
              border: '1px solid #bfdbfe', 
              padding: '4px 10px', 
              borderRadius: '6px', 
              fontSize: '0.725rem', 
              fontWeight: '800',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap'
            }}>
              ENTERPRISE DIGITAL LIBRARY SUITE
            </span>
            <span style={{ fontSize: '0.825rem', color: '#334155', fontWeight: '600', minWidth: 0 }}>
              Cổng Thông Tin Học Thuật &amp; Quản Trị Tri Thức Chuẩn Quốc Tế DDC / MARC-21
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> 
              Sẵn sàng: <strong style={{ color: '#0f172a' }}>{stats?.sla || '99.98%'} SLA</strong>
            </span>
            <span>•</span>
            <span>Độc giả truy cập: <strong style={{ color: '#1d4ed8' }}>{stats?.onlineReaders || (allBooks.length > 0 ? allBooks.length * 2 + 8 : 28)} độc giả</strong></span>
            {settings?.moitVerificationEnabled !== false && (
              <>
                <span>•</span>
                <span style={{ color: '#059669', fontWeight: '700' }}>✓ Xác thực Bộ Công Thương</span>
              </>
            )}
          </div>
        </div>

        <div className="responsive-hero-grid" style={{ position: 'relative', zIndex: 2 }}>
          
          {/* Left Column: Spotlight Info */}
          <div>
            {/* Pill Tag */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '5px 12px', borderRadius: '6px', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '0.04em' }}>
              <Award size={14} color="#1d4ed8" /> GIÁO TRÌNH TIÊU BIỂU • ĐƯỢC ĐÁNH GIÁ XUẤT SẮC
            </div>

            {/* Title */}
            <h1 className="hero-spotlight-title" style={{ fontSize: '2.3rem', fontWeight: '900', color: '#0f172a', lineHeight: '1.2', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              {spotlightBook.title}
            </h1>

            {/* Meta Row: Author, Rating, Shelf */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <span style={{ color: '#475569' }}>
                Tác giả: <strong style={{ color: '#0f172a' }}>{spotlightBook.author?.name}</strong>
              </span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b45309', fontWeight: '800' }}>
                <Star size={14} fill="#f59e0b" color="#f59e0b" /> {spotlightBook.rating || 5.0} (128 phản hồi học thuật)
              </span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span className="badge badge-info">
                {spotlightBook.category?.name}
              </span>
            </div>

            {/* Excerpt */}
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.65', marginBottom: '22px', maxWidth: '640px' }}>
              {spotlightBook.description}
            </p>

            {/* Location & Stock Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '26px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', color: '#1e40af', fontWeight: '700' }}>
                <MapPin size={14} /> {spotlightBook.shelfLocation}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', padding: '7px 12px', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '0.8rem', color: '#047857', fontWeight: '700' }}>
                <CheckCircle2 size={14} /> Sẵn sàng cho mượn ({spotlightBook.availableCopies}/{spotlightBook.totalCopies} bản)
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
                style={{ padding: '10px 18px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '7px' }}
              >
                <Sparkles size={15} color="#1d4ed8" /> Hỏi Trợ Lý AI về tài liệu
              </button>
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
                position: 'relative'
              }}
              title="Nhấn để xem chi tiết cuốn sách này"
            >
              <img 
                src={spotlightBook.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'} 
                alt={spotlightBook.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500';
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px 10px 10px 4px' }}
              />

              {/* Glossy Reflection Sheen */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(105deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.03) 35%, transparent 60%)',
                  borderRadius: '4px 10px 10px 4px',
                  pointerEvents: 'none'
                }}
              />

              {/* Floating Quick Stats Badge */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.725rem',
                  fontWeight: '800',
                  color: '#0f172a'
                }}
              >
                <span style={{ color: '#059669' }}>● CÒN {spotlightBook.availableCopies} BẢN</span>
                <span style={{ color: '#64748b' }}>• NXB {spotlightBook.publishYear || 2024}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Quick Search Bar inside Hero */}
        <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px', width: '100%', maxWidth: '580px', background: '#ffffff', padding: '5px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <Search size={16} color="#1d4ed8" style={{ flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder="Tra cứu nhanh trong 100 đầu sách (Nhan đề, Tác giả, ISBN...)"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onGoCatalog(searchKeyword); }}
              style={{ flex: 1, minWidth: 0, width: '100%', background: 'transparent', border: 'none', color: '#0f172a', outline: 'none', fontSize: '0.825rem' }}
            />
            <button 
              onClick={() => onGoCatalog(searchKeyword)}
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.775rem', flexShrink: 0 }}
            >
              Tìm kiếm
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.75rem', color: '#64748b' }}>
            <span style={{ fontWeight: '600' }}>Từ khóa phổ biến:</span>
            {['Java 21', 'Spring Boot 3', 'Microservices', 'Trí tuệ nhân tạo', 'Kinh tế'].map(tag => (
              <span 
                key={tag}
                onClick={() => onGoCatalog(tag)}
                style={{ 
                  background: '#f8fafc', 
                  border: '1px solid #cbd5e1', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  color: '#1d4ed8', 
                  fontWeight: '600', 
                  cursor: 'pointer', 
                  transition: 'all 0.15s ease' 
                }}
                onMouseEnter={(e) => { e.target.style.background = '#eff6ff'; e.target.style.borderColor = '#1d4ed8'; }}
                onMouseLeave={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1'; }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* ================= 2. ENTERPRISE KPI & QUALITY PILLARS ================= */}
      <div className="responsive-kpi-grid">
        
        <div className="glass-panel card-hover-lift" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', flexShrink: 0 }}>
            <Library size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
              {stats?.totalBooks ? `${stats.totalBooks}+ Đầu Sách` : (allBooks.length > 0 ? `${allBooks.length}+ Đầu Sách` : '100+ Giáo Trình')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {stats?.totalCopies ? `${stats.totalCopies} bản lưu hành • ${categories.length || 7} chuyên ngành` : 'Bản quyền 7 chuyên ngành mũi nhọn'}
            </div>
          </div>
        </div>

        <div className="glass-panel card-hover-lift" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>Trợ Lý AI Học Thuật</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Phân tích đề cương & gợi ý tài liệu</div>
          </div>
        </div>

        <div className="glass-panel card-hover-lift" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
            <FileCheck2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>Chuẩn ISO & OPAC</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Phân loại tiêu chuẩn quốc tế DDC</div>
          </div>
        </div>

        <div className="glass-panel card-hover-lift" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0 }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>Bảo Mật Cấp Độ 3</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Chứng thực người dùng & mã hóa dữ liệu</div>
          </div>
        </div>

      </div>

      {/* ================= 3. POPULAR ACADEMIC TOPICS (ENTERPRISE BENTO GRID) ================= */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
              DANH MỤC CHUYÊN NGÀNH HỌC THUẬT
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Khám Phá Theo Chủ Đề Nghiên Cứu
            </h2>
          </div>

          <button 
            onClick={() => onGoCatalog()}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Xem tất cả 7 chuyên ngành <ChevronRight size={14} />
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
                border: `1px solid ${topic.border}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '125px',
                background: topic.bg
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{topic.icon}</span>
                  <span style={{ fontSize: '0.675rem', color: topic.accent, background: '#ffffff', border: `1px solid ${topic.border}`, padding: '2px 7px', borderRadius: '4px', fontWeight: '700' }}>
                    {topic.count}
                  </span>
                </div>

                <h3 style={{ fontSize: '0.925rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', lineHeight: '1.3' }}>
                  {topic.name}
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, lineHeight: '1.4' }}>
                  {topic.desc}
                </p>
              </div>

              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: topic.accent, fontSize: '0.725rem', fontWeight: '700', gap: '4px' }}>
                Khám phá <ArrowRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= 4. CURATED BOOK SHOWCASE: TABS FOR NEWEST & RECOMMENDED ================= */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
              MỤC LỤC TÀI LIỆU TUYỂN CHỌN
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Kho Tài Liệu Đọc & Nghiên Cứu
            </h2>
          </div>

          {/* Interactive Modern Switch Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('newest')}
              style={{
                background: activeTab === 'newest' ? '#1d4ed8' : 'transparent',
                color: activeTab === 'newest' ? '#ffffff' : '#64748b',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Zap size={14} /> Sách Mới Cập Nhật ({newestBooks.length})
            </button>

            <button
              onClick={() => setActiveTab('recommended')}
              style={{
                background: activeTab === 'recommended' ? '#1d4ed8' : 'transparent',
                color: activeTab === 'recommended' ? '#ffffff' : '#64748b',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Star size={14} fill={activeTab === 'recommended' ? '#ffffff' : 'none'} /> Sách Đề Xuất Đọc ({recommendedBooks.length})
            </button>
          </div>
        </div>

        {/* 5-Column Grid x 2 Rows = 10 Modern Book Cards */}
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
                border: '1px solid #e2e8f0',
                background: '#ffffff'
              }}
            >
              {/* Cover Image with Floating Badges */}
              <div style={{ position: 'relative', aspectRatio: '3 / 4.2', overflow: 'hidden', background: '#f8fafc' }}>
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

                {/* Rating Badge */}
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#ffffff', padding: '2px 7px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.725rem', fontWeight: '800', color: '#b45309', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', border: '1px solid #fde68a' }}>
                  <Star size={11} fill="#f59e0b" color="#f59e0b" /> {book.rating || 5.0}
                </div>

                {/* Stock Badge */}
                <div style={{ position: 'absolute', bottom: '8px', left: '8px' }}>
                  <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                    {book.availableCopies > 0 ? `Còn ${book.availableCopies} cuốn` : 'Đã mượn hết'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#1d4ed8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '3px', letterSpacing: '0.04em' }}>
                    {book.category?.name}
                  </div>

                  <h3 
                    title={book.title}
                    style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', lineHeight: '1.35', height: '2.7em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                  >
                    {book.title}
                  </h3>

                  <div style={{ fontSize: '0.725rem', color: '#64748b', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Tác giả: <strong style={{ color: '#334155' }}>{book.author?.name}</strong>
                  </div>
                </div>

                {/* Bottom Row */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                  <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={11} color="#1d4ed8" /> Kệ: <strong style={{ color: '#0f172a' }}>{book.shelfLocation}</strong>
                  </span>
                  
                  <span style={{ color: '#1d4ed8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Chi tiết <ChevronRight size={12} />
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
