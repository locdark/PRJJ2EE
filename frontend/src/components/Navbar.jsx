import React, { useState } from 'react';
import { 
  BookOpen, Sparkles, User, Shield, BookMarked, LayoutDashboard, 
  LogOut, LogIn, Settings, Palette, Search, SlidersHorizontal, 
  Clock, Users, ChevronRight, Bell, Bookmark, Menu, X
} from 'lucide-react';

export default function Navbar({ 
  currentView, 
  setCurrentView, 
  user, 
  onOpenAuth, 
  onLogout, 
  onOpenAi, 
  onOpenAnnouncement,
  settings, 
  onCycleTheme,
  onQuickSearch,
  borrowCartCount = 0
}) {
  const [searchInput, setSearchInput] = useState('');
  const [searchScope, setSearchScope] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const siteTitle = settings?.siteTitle || 'SmartLibrary';
  const siteSubtitle = settings?.siteSubtitle || 'Hệ Thống Thư Viện Số Chuẩn Doanh Nghiệp & Học Thuật';

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (onQuickSearch) {
      onQuickSearch(searchInput, searchScope);
    } else {
      setCurrentView('catalog');
    }
  };

  return (
    <header style={{ 
      width: '100%', 
      position: 'sticky', 
      top: 0, 
      zIndex: 60, 
      background: 'rgba(255, 255, 255, 0.98)', 
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)'
    }}>
      
      {/* 100% Full Width Fluid Header Container */}
      <div className="navbar-container">
        
        {/* Left: Brand Identity */}
        <div 
          onClick={() => setCurrentView('home')} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flexShrink: 0 }}
        >
          {/* Logo Icon */}
          <div 
            style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '8px', 
              background: '#1d4ed8', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(29, 78, 216, 0.25)',
              color: '#ffffff'
            }}
          >
            <BookOpen size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#0f172a' }}>
                {siteTitle}
              </span>
              <span style={{ 
                fontSize: '0.625rem', 
                fontWeight: '800', 
                color: '#1d4ed8', 
                background: '#eff6ff', 
                border: '1px solid #bfdbfe', 
                padding: '2px 6px', 
                borderRadius: '4px',
                letterSpacing: '0.04em'
              }}>
                ENTERPRISE
              </span>
            </div>
            <div className="hide-on-mobile" style={{ fontSize: '0.675rem', color: '#64748b', fontWeight: '500', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
            background: '#f8fafc', 
            border: '1px solid #cbd5e1', 
            borderRadius: '8px', 
            padding: '6px 12px', 
            maxWidth: '280px', 
            width: '100%',
            transition: 'border-color 0.2s ease'
          }}
        >
          <Search size={15} color="#64748b" style={{ marginRight: '8px', flexShrink: 0 }} />
          <input 
            type="text" 
            placeholder="Tra cứu giáo trình, ISBN, tác giả..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#0f172a', outline: 'none', fontSize: '0.8rem', minWidth: 0 }}
          />
          <span style={{ fontSize: '0.65rem', color: '#64748b', background: '#ffffff', border: '1px solid #e2e8f0', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
            Ctrl+K
          </span>
        </form>

        {/* Center: Main Navigation Tabs (Clean Corporate Styles) */}
        <nav className="navbar-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          
          <button 
            onClick={() => setCurrentView('home')}
            style={{
              background: currentView === 'home' ? '#1d4ed8' : 'transparent',
              color: currentView === 'home' ? '#ffffff' : '#334155',
              border: 'none',
              padding: '7px 14px',
              borderRadius: '7px',
              fontSize: '0.825rem',
              fontWeight: currentView === 'home' ? '700' : '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            Trang chủ
          </button>

          <button 
            onClick={() => setCurrentView('catalog')}
            style={{
              background: currentView === 'catalog' ? '#1d4ed8' : 'transparent',
              color: currentView === 'catalog' ? '#ffffff' : '#334155',
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
              transition: 'all 0.15s ease'
            }}
          >
            <SlidersHorizontal size={14} /> Tra cứu mục lục (OPAC)
          </button>

          {/* Bulletin / Announcement Button */}
          {settings?.popupNavButtonEnabled !== false && (
            <button 
              onClick={onOpenAnnouncement}
              style={{
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Bell size={14} color="#1d4ed8" /> Bản Tin Thư Viện
            </button>
          )}

          {/* AI Assistant Button */}
          <button 
            onClick={onOpenAi}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: '1px solid #1e293b',
              padding: '6px 13px',
              borderRadius: '7px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
            }}
          >
            <Sparkles size={14} color="#38bdf8" /> Trợ lý AI
          </button>

          {/* Dedicated Reader Borrowing History Link */}
          {user && (
            <button 
              onClick={() => setCurrentView('my-borrowings')}
              style={{
                background: currentView === 'my-borrowings' ? '#1d4ed8' : 'transparent',
                color: currentView === 'my-borrowings' ? '#ffffff' : '#334155',
                border: 'none',
                padding: '7px 12px',
                borderRadius: '7px',
                fontSize: '0.825rem',
                fontWeight: currentView === 'my-borrowings' ? '700' : '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <Bookmark size={14} /> Sách của tôi
              {borrowCartCount > 0 && (
                <span style={{ 
                  background: currentView === 'my-borrowings' ? '#ffffff' : '#1d4ed8', 
                  color: currentView === 'my-borrowings' ? '#1d4ed8' : '#ffffff', 
                  fontSize: '0.65rem', 
                  padding: '1px 5px', 
                  borderRadius: '10px', 
                  fontWeight: '800' 
                }}>
                  {borrowCartCount}
                </span>
              )}
            </button>
          )}

          {/* High-Authority Admin & Librarian Launcher Button */}
          {user && (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_LIBRARIAN') && (
            <div style={{ marginLeft: '6px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
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
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)'
                }}
              >
                <Shield size={14} color="#38bdf8" />
                <span>Quản Trị Hệ Thống</span>
                <span style={{ 
                  fontSize: '0.625rem', 
                  background: '#2563eb', 
                  color: '#ffffff', 
                  padding: '1px 5px', 
                  borderRadius: '3px', 
                  fontWeight: '800' 
                }}>
                  ADMIN
                </span>
              </button>
            </div>
          )}
        </nav>

        {/* Right: Actions, Theme, Cart & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          
          {/* Theme Quick Switcher */}
          <button 
            onClick={onCycleTheme} 
            title="Đổi chủ đề giao diện"
            style={{ 
              background: '#f8fafc', 
              border: '1px solid #cbd5e1', 
              color: '#334155', 
              padding: '6px 10px', 
              borderRadius: '7px', 
              fontSize: '0.75rem', 
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Palette size={14} color="#1d4ed8" /> <span className="hide-on-mobile">Giao diện</span>
          </button>

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
                    background: '#f8fafc', 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    border: '1px solid #e2e8f0',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <img 
                    src={user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.email} 
                    alt="Avatar" 
                    style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a', maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.fullName}
                  </span>
                  <span style={{ 
                    fontSize: '0.625rem', 
                    fontWeight: '700', 
                    padding: '1px 6px', 
                    borderRadius: '4px',
                    background: user.role === 'ROLE_ADMIN' ? '#fee2e2' : user.role === 'ROLE_LIBRARIAN' ? '#fef3c7' : '#e0f2fe',
                    color: user.role === 'ROLE_ADMIN' ? '#b91c1c' : user.role === 'ROLE_LIBRARIAN' ? '#b45309' : '#0369a1'
                  }}>
                    {user.role === 'ROLE_ADMIN' ? 'Admin' : user.role === 'ROLE_LIBRARIAN' ? 'Thủ thư' : 'Bạn đọc'}
                  </span>
                </div>

                <button 
                  onClick={onLogout}
                  title="Đăng xuất"
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
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
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              padding: '6px 10px',
              borderRadius: '7px',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {mobileMenuOpen ? <X size={20} color="#dc2626" /> : <Menu size={20} color="#1d4ed8" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer (Expanded below navbar when mobileMenuOpen is true) */}
      {mobileMenuOpen && (
        <div 
          className="navbar-mobile-drawer animate-fade-in"
          style={{
            position: 'absolute',
            top: '64px',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderBottom: '2px solid #e2e8f0',
            boxShadow: '0 20px 30px -10px rgba(15, 23, 42, 0.15)',
            padding: '16px 20px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Mobile Search */}
          <form 
            onSubmit={(e) => {
              handleSearchSubmit(e);
              setMobileMenuOpen(false);
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: '#f8fafc', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              padding: '8px 12px', 
              width: '100%' 
            }}
          >
            <Search size={16} color="#64748b" style={{ marginRight: '8px', flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder="Tra cứu giáo trình, ISBN, tác giả..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#0f172a', outline: 'none', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              Tìm
            </button>
          </form>

          {/* Mobile Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px' }}>
            <button 
              onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
              style={{
                background: currentView === 'home' ? '#eff6ff' : 'transparent',
                color: currentView === 'home' ? '#1d4ed8' : '#1e293b',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: currentView === 'home' ? '800' : '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <BookOpen size={18} color="#1d4ed8" /> Trang chủ
            </button>

            <button 
              onClick={() => { setCurrentView('catalog'); setMobileMenuOpen(false); }}
              style={{
                background: currentView === 'catalog' ? '#eff6ff' : 'transparent',
                color: currentView === 'catalog' ? '#1d4ed8' : '#1e293b',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: currentView === 'catalog' ? '800' : '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <SlidersHorizontal size={18} color="#1d4ed8" /> Tra cứu mục lục (OPAC)
            </button>

            {settings?.popupNavButtonEnabled !== false && (
              <button 
                onClick={() => { onOpenAnnouncement(); setMobileMenuOpen(false); }}
                style={{
                  background: 'transparent',
                  color: '#1e293b',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <Bell size={18} color="#1d4ed8" /> Bản Tin Thư Viện
              </button>
            )}

            <button 
              onClick={() => { onOpenAi(); setMobileMenuOpen(false); }}
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
                gap: '10px'
              }}
            >
              <Sparkles size={18} color="#38bdf8" /> Trợ lý AI Học Thuật
            </button>

            {user && (
              <button 
                onClick={() => { setCurrentView('my-borrowings'); setMobileMenuOpen(false); }}
                style={{
                  background: currentView === 'my-borrowings' ? '#eff6ff' : 'transparent',
                  color: currentView === 'my-borrowings' ? '#1d4ed8' : '#1e293b',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: currentView === 'my-borrowings' ? '800' : '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bookmark size={18} color="#1d4ed8" /> Sách của tôi
                </span>
                {borrowCartCount > 0 && (
                  <span style={{ background: '#1d4ed8', color: '#ffffff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                    {borrowCartCount}
                  </span>
                )}
              </button>
            )}

            {user && (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_LIBRARIAN') && (
              <button 
                onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
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
                  gap: '10px'
                }}
              >
                <Shield size={18} color="#38bdf8" /> Quản Trị Hệ Thống (ADMIN)
              </button>
            )}
          </div>

          {/* Mobile User Profile Footer */}
          <div style={{ paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img 
                    src={user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.email} 
                    alt="Avatar" 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{user.fullName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{user.email}</div>
                  </div>
                </div>

                <button 
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  <LogOut size={14} /> Đăng xuất
                </button>
              </>
            ) : (
              <button 
                onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
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
