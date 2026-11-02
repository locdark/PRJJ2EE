import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Shield,
  LogOut,
  LogIn,
  Palette,
  Search,
  SlidersHorizontal,
  Bell,
  Bookmark,
  Menu,
  X,
  Mic,
  MicOff,
  Heart,
  Type,
  Check,
} from 'lucide-react';
import { showToast } from './Toast';

const THEME_OPTIONS = [
  { id: 'academic-light', name: 'Academic Light', desc: 'Sáng tiêu chuẩn', color: '#1d4ed8' },
  { id: 'modern-dark', name: 'Modern Dark', desc: 'Tối hiện đại', color: '#3b82f6' },
  { id: 'emerald-scholar', name: 'Emerald Scholar', desc: 'Học thuật xanh', color: '#047857' },
  { id: 'orange-white', name: 'Orange White', desc: 'Trắng cam ấm', color: '#d97706' },
  { id: 'oxford-navy', name: 'Oxford Navy', desc: 'Hải quân & Vàng', color: '#1e3a8a' },
];

const FONT_SCALES = [
  { value: '100%', label: '100% (Chuẩn)' },
  { value: '110%', label: '110% (Lớn)' },
  { value: '120%', label: '120% (Rất rõ)' },
];

export default function Navbar({
  currentView,
  setCurrentView,
  user,
  onOpenAuth,
  onLogout,
  onOpenAi,
  onOpenAnnouncement,
  settings,
  currentTheme = 'emerald-scholar',
  onCycleTheme,
  onSelectTheme,
  fontScale = '100%',
  onChangeFontScale,
  onQuickSearch,
  borrowCartCount = 0,
  wishlistCount = 0,
  onOpenWishlist,
}) {
  const [searchInput, setSearchInput] = useState('');
  const [searchScope] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [comfortMenuOpen, setComfortMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const searchInputRef = useRef(null);
  const comfortMenuRef = useRef(null);

  const siteTitle = settings?.siteTitle || 'SmartLibrary';
  const siteSubtitle =
    settings?.siteSubtitle || 'Trung Tâm Thông Tin – Thư Viện Đại Học';

  // Global Ctrl+K / Cmd+K shortcut to focus search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close comfort menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (comfortMenuRef.current && !comfortMenuRef.current.contains(e.target)) {
        setComfortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (onQuickSearch) {
      onQuickSearch(searchInput, searchScope);
    } else {
      setCurrentView('catalog');
    }
  };

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
          setSearchInput(transcript);
          showToast(`🎙️ Đã nhận diện giọng nói: "${transcript}"`, 'success', 3000);
          if (onQuickSearch) {
            onQuickSearch(transcript, searchScope);
          } else {
            setCurrentView('catalog');
          }
          setMobileMenuOpen(false);
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

  return (
    <header
      style={{
        width: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 60,
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        color: 'var(--text-main)',
      }}
    >
      {/* 100% Full Width Fluid Header Container */}
      <div className="navbar-container">
        {/* Left: Brand Identity */}
        <div
          onClick={() => setCurrentView('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {/* Logo Icon */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              color: '#ffffff',
            }}
          >
            <BookOpen size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '1.15rem',
                  fontWeight: '800',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-main)',
                }}
              >
                {siteTitle}
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: '800',
                  color: 'var(--primary)',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--border)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em',
                }}
              >
                UNIVERSITY
              </span>
            </div>
            <div
              className="hide-on-mobile"
              style={{
                fontSize: '0.675rem',
                color: 'var(--text-muted)',
                fontWeight: '500',
                maxWidth: '280px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {siteSubtitle}
            </div>
          </div>
        </div>

        {/* Center-Left: Responsive Clean Search Bar */}
        <form
          className="navbar-desktop-search"
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 10px',
            maxWidth: '300px',
            width: '100%',
            gap: '6px',
            transition: 'border-color 0.2s ease',
          }}
        >
          <Search
            size={15}
            color="var(--text-muted)"
            style={{ flexShrink: 0 }}
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Tra cứu giáo trình, ISBN, tác giả..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              outline: 'none',
              fontSize: '0.8rem',
              minWidth: 0,
            }}
          />
          <button
            type="button"
            onClick={handleVoiceSearch}
            className={isListening ? 'mic-listening' : ''}
            style={{
              background: isListening ? 'rgba(220, 38, 38, 0.12)' : 'transparent',
              border: 'none',
              color: isListening ? '#dc2626' : 'var(--primary)',
              cursor: 'pointer',
              padding: '3px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title="Tìm kiếm bằng giọng nói Tiếng Việt (Voice Search)"
            aria-label="Tìm kiếm bằng giọng nói"
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <span
            onClick={() => searchInputRef.current?.focus()}
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              padding: '1px 5px',
              borderRadius: '4px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
            title="Nhấn Ctrl+K để tìm kiếm nhanh"
          >
            Ctrl+K
          </span>
        </form>

        {/* Center: Main Navigation Tabs */}
        <nav className="navbar-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setCurrentView('home')}
            style={{
              background: currentView === 'home' ? 'var(--primary)' : 'transparent',
              color: currentView === 'home' ? '#ffffff' : 'var(--text-main)',
              border: 'none',
              padding: '7px 14px',
              borderRadius: '7px',
              fontSize: '0.825rem',
              fontWeight: currentView === 'home' ? '700' : '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            Trang chủ
          </button>

          <button
            onClick={() => setCurrentView('catalog')}
            style={{
              background: currentView === 'catalog' ? 'var(--primary)' : 'transparent',
              color: currentView === 'catalog' ? '#ffffff' : 'var(--text-main)',
              border: 'none',
              padding: '7px 14px',
              borderRadius: '7px',
              fontSize: '0.825rem',
              fontWeight: currentView === 'catalog' ? '700' : '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <SlidersHorizontal size={14} /> Tra cứu mục lục (OPAC)
          </button>

          {/* Bulletin / Announcement Button */}
          {settings?.popupNavButtonEnabled !== false && (
            <button
              onClick={onOpenAnnouncement}
              style={{
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                border: '1px solid var(--border)',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Bell size={14} /> Bản Tin Thư Viện
            </button>
          )}

          {/* AI Assistant Button */}
          <button
            onClick={onOpenAi}
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              border: '1px solid #334155',
              padding: '6px 13px',
              borderRadius: '7px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Sparkles size={14} color="#38bdf8" /> Trợ lý AI
          </button>

          {/* Dedicated Reader Borrowing History Link */}
          {user && (
            <button
              onClick={() => setCurrentView('my-borrowings')}
              style={{
                background: currentView === 'my-borrowings' ? 'var(--primary)' : 'transparent',
                color: currentView === 'my-borrowings' ? '#ffffff' : 'var(--text-main)',
                border: 'none',
                padding: '7px 12px',
                borderRadius: '7px',
                fontSize: '0.825rem',
                fontWeight: currentView === 'my-borrowings' ? '700' : '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Bookmark size={14} /> Sách của tôi
              {borrowCartCount > 0 && (
                <span
                  style={{
                    background: currentView === 'my-borrowings' ? '#ffffff' : 'var(--primary)',
                    color: currentView === 'my-borrowings' ? 'var(--primary)' : '#ffffff',
                    fontSize: '0.65rem',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    fontWeight: '800',
                  }}
                >
                  {borrowCartCount}
                </span>
              )}
            </button>
          )}

          {/* High-Authority Admin & Librarian Launcher Button */}
          {user &&
            ['ROLE_ADMIN', 'ADMIN', 'ROLE_LIBRARIAN', 'LIBRARIAN'].includes(
              String(user.role || '').toUpperCase()
            ) && (
            <div style={{ marginLeft: '6px', paddingLeft: '8px', borderLeft: '1px solid var(--border)' }}>
              <button
                onClick={() => setCurrentView('dashboard')}
                title="Truy cập Bảng điều khiển quản trị thư viện"
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#ffffff',
                  border: '1px solid #334155',
                  padding: '7px 14px',
                  borderRadius: '7px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  whiteSpace: 'nowrap',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Shield size={14} color="#38bdf8" />
                <span>Quản Trị Hệ Thống</span>
                <span
                  style={{
                    fontSize: '0.625rem',
                    background: '#2563eb',
                    color: '#ffffff',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontWeight: '800',
                  }}
                >
                  ADMIN
                </span>
              </button>
            </div>
          )}
        </nav>

        {/* Right: Actions, Theme, Cart & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Saved Books / Wishlist Quick Trigger */}
          <button
            onClick={() => {
              if (onOpenWishlist) onOpenWishlist();
              else setCurrentView('catalog');
            }}
            title="Tủ sách Đọc sau / Yêu thích"
            style={{
              background: wishlistCount > 0 ? '#fff1f2' : 'var(--bg-elevated)',
              border: wishlistCount > 0 ? '1px solid #fecdd3' : '1px solid var(--border)',
              color: wishlistCount > 0 ? '#e11d48' : 'var(--text-main)',
              padding: '6px 10px',
              borderRadius: '7px',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Heart
              size={14}
              fill={wishlistCount > 0 ? '#e11d48' : 'none'}
              color={wishlistCount > 0 ? '#e11d48' : 'var(--primary)'}
            />
            <span className="hide-on-mobile">Đã lưu</span>
            {wishlistCount > 0 && (
              <span
                style={{
                  background: '#e11d48',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  padding: '0 5px',
                  borderRadius: '10px',
                  fontWeight: '800',
                }}
              >
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Theme & Reading Comfort Accessibility Switcher */}
          <div ref={comfortMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setComfortMenuOpen((prev) => !prev)}
              title="Tùy chỉnh Giao diện & Cỡ chữ (Hỗ trợ thị lực)"
              style={{
                background: comfortMenuOpen ? 'var(--primary-light)' : 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                padding: '6px 10px',
                borderRadius: '7px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Palette size={14} color="var(--primary)" />
              <span className="hide-on-mobile">Giao diện &amp; Cỡ chữ</span>
            </button>

            {comfortMenuOpen && (
              <div
                className="animate-fade-in"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '290px',
                  maxWidth: '92vw',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-xl)',
                  padding: '14px',
                  zIndex: 120,
                  color: 'var(--text-main)',
                }}
              >
                {/* Font Scale Accessibility Section */}
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Type size={13} color="var(--primary)" /> CỠ CHỮ ĐỌC SÁCH (ACCESSIBILITY)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {FONT_SCALES.map((item) => {
                      const active = fontScale === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => onChangeFontScale && onChangeFontScale(item.value)}
                          style={{
                            padding: '6px 4px',
                            borderRadius: '7px',
                            border: active ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: active ? 'var(--primary-light)' : 'var(--bg-elevated)',
                            color: active ? 'var(--primary)' : 'var(--text-main)',
                            fontSize: '0.72rem',
                            fontWeight: active ? '800' : '600',
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5 Academic Themes Section */}
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Palette size={13} color="var(--primary)" /> 5 CHỦ ĐỀ THƯ VIỆN
                    </span>
                    <button
                      type="button"
                      onClick={onCycleTheme}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      Đổi nhanh ↻
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {THEME_OPTIONS.map((t) => {
                      const active = currentTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (onSelectTheme) onSelectTheme(t.id);
                            else if (onCycleTheme) onCycleTheme();
                            setComfortMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            border: active ? '1px solid var(--primary)' : '1px solid transparent',
                            background: active ? 'var(--primary-light)' : 'var(--bg-elevated)',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                background: t.color,
                                display: 'inline-block',
                                flexShrink: 0,
                              }}
                            />
                            <div>
                              <div style={{ fontSize: '0.78rem', fontWeight: active ? '800' : '600' }}>
                                {t.name}
                              </div>
                              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                                {t.desc}
                              </div>
                            </div>
                          </div>
                          {active && <Check size={14} color="var(--primary)" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Account / Login (Desktop) */}
          <div className="navbar-desktop-user">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  onClick={() => setCurrentView('my-borrowings')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    background: 'var(--bg-elevated)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <img
                    src={
                      user.avatar ||
                      'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.email
                    }
                    alt="Avatar"
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      maxWidth: '110px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.fullName}
                  </span>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: '700',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background:
                        user.role === 'ROLE_ADMIN' || user.role === 'ADMIN'
                          ? '#fee2e2'
                          : user.role === 'ROLE_LIBRARIAN' || user.role === 'LIBRARIAN'
                          ? '#fef3c7'
                          : '#e0f2fe',
                      color:
                        user.role === 'ROLE_ADMIN' || user.role === 'ADMIN'
                          ? '#b91c1c'
                          : user.role === 'ROLE_LIBRARIAN' || user.role === 'LIBRARIAN'
                          ? '#b45309'
                          : '#0369a1',
                    }}
                  >
                    {user.role === 'ROLE_ADMIN' || user.role === 'ADMIN'
                      ? 'Admin'
                      : user.role === 'ROLE_LIBRARIAN' || user.role === 'LIBRARIAN'
                      ? 'Thủ thư'
                      : 'Bạn đọc'}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="btn btn-primary"
                style={{ padding: '7px 16px', fontSize: '0.8rem', borderRadius: '7px' }}
              >
                <LogIn size={15} /> Đăng nhập
              </button>
            )}
          </div>

          {/* Hamburger Mobile Menu Toggle Button */}
          <button
            className="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              padding: '6px 10px',
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mobileMenuOpen ? (
              <X size={20} color="#dc2626" />
            ) : (
              <Menu size={20} color="var(--primary)" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="navbar-mobile-drawer animate-fade-in"
          style={{
            position: 'absolute',
            top: '64px',
            left: 0,
            right: 0,
            background: 'var(--bg-card)',
            borderBottom: '2px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            padding: '16px 20px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Mobile Search with Voice Search */}
          <form
            onSubmit={(e) => {
              handleSearchSubmit(e);
              setMobileMenuOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 12px',
              width: '100%',
              gap: '8px',
            }}
          >
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ flexShrink: 0 }}
            />
            <input
              type="text"
              placeholder="Tra cứu giáo trình, ISBN, tác giả..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                outline: 'none',
                fontSize: '0.85rem',
                minWidth: 0,
              }}
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={isListening ? 'mic-listening' : ''}
              style={{
                background: isListening ? 'rgba(220, 38, 38, 0.12)' : 'transparent',
                border: 'none',
                color: isListening ? '#dc2626' : 'var(--primary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Tìm kiếm bằng giọng nói"
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Tìm
            </button>
          </form>

          {/* Mobile Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px' }}>
            <button
              onClick={() => {
                setCurrentView('home');
                setMobileMenuOpen(false);
              }}
              style={{
                background: currentView === 'home' ? 'var(--primary-light)' : 'transparent',
                color: currentView === 'home' ? 'var(--primary)' : 'var(--text-main)',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: currentView === 'home' ? '800' : '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <BookOpen size={18} color="var(--primary)" /> Trang chủ
            </button>

            <button
              onClick={() => {
                setCurrentView('catalog');
                setMobileMenuOpen(false);
              }}
              style={{
                background: currentView === 'catalog' ? 'var(--primary-light)' : 'transparent',
                color: currentView === 'catalog' ? 'var(--primary)' : 'var(--text-main)',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: currentView === 'catalog' ? '800' : '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <SlidersHorizontal size={18} color="var(--primary)" /> Tra cứu mục lục (OPAC)
            </button>

            {settings?.popupNavButtonEnabled !== false && (
              <button
                onClick={() => {
                  onOpenAnnouncement();
                  setMobileMenuOpen(false);
                }}
                style={{
                  background: 'transparent',
                  color: 'var(--text-main)',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Bell size={18} color="var(--primary)" /> Bản Tin Thư Viện
              </button>
            )}

            <button
              onClick={() => {
                onOpenAi();
                setMobileMenuOpen(false);
              }}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Sparkles size={18} color="#38bdf8" /> Trợ lý AI Học Thuật
            </button>

            {user && (
              <button
                onClick={() => {
                  setCurrentView('my-borrowings');
                  setMobileMenuOpen(false);
                }}
                style={{
                  background:
                    currentView === 'my-borrowings' ? 'var(--primary-light)' : 'transparent',
                  color:
                    currentView === 'my-borrowings' ? 'var(--primary)' : 'var(--text-main)',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: currentView === 'my-borrowings' ? '800' : '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bookmark size={18} color="var(--primary)" /> Sách của tôi
                </span>
                {borrowCartCount > 0 && (
                  <span
                    style={{
                      background: 'var(--primary)',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: '800',
                    }}
                  >
                    {borrowCartCount}
                  </span>
                )}
              </button>
            )}

            {user &&
              ['ROLE_ADMIN', 'ADMIN', 'ROLE_LIBRARIAN', 'LIBRARIAN'].includes(
                String(user.role || '').toUpperCase()
              ) && (
              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  setMobileMenuOpen(false);
                }}
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Shield size={18} color="#38bdf8" /> Quản Trị Hệ Thống (ADMIN)
              </button>
            )}
          </div>

          {/* Mobile User Profile Footer */}
          <div
            style={{
              paddingTop: '10px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={
                      user.avatar ||
                      'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.email
                    }
                    alt="Avatar"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: 'var(--text-main)',
                      }}
                    >
                      {user.fullName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {user.email}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  <LogOut size={14} /> Đăng xuất
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
              >
                <LogIn size={16} /> Đăng nhập / Đăng ký
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
