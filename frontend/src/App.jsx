import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Heart, Bookmark, Sparkles } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PolicyModal from './components/PolicyModal';
import HomeView from './views/HomeView';
import CatalogView from './views/CatalogView';
import MyBorrowingsView from './views/MyBorrowingsView';
import AdminDashboardView from './views/AdminDashboardView';
import AuthModal from './components/AuthModal';
import BookDetailModal from './components/BookDetailModal';
import BorrowModal from './components/BorrowModal';
import PaymentModal from './components/PaymentModal';
import AiChatbotModal from './components/AiChatbotModal';
import AnnouncementModal from './components/AnnouncementModal';
import ToastContainer, { showToast } from './components/Toast';
import {
  processVNPayReturn,
  getSystemSettings,
  getSystemStats,
  graphqlQuery,
  restGoogleLogin,
  restFacebookLogin,
} from './services/api';
import { GET_MY_BORROWINGS } from './services/graphqlQueries';
import confetti from 'canvas-confetti';

const ADMIN_VIEWS = [
  'admin',
  'dashboard',
  'settings',
  'book-mgmt',
  'borrow-mgmt',
  'user-mgmt',
];

function isAdminOrLibrarian(u) {
  return (
    !!u &&
    ['ADMIN', 'ROLE_ADMIN', 'LIBRARIAN', 'ROLE_LIBRARIAN'].includes(
      String(u.role || '').toUpperCase()
    )
  );
}

const THEME_LIST = [
  'emerald-scholar',
  'oxford-navy',
  'modern-dark',
  'academic-light',
  'orange-white',
];

const THEME_LABELS = {
  'emerald-scholar': 'Emerald Scholar (Học thuật Xanh)',
  'oxford-navy': 'Oxford Navy (Xanh Hải Quân & Vàng)',
  'modern-dark': 'Modern Dark (Tối Hiện Đại)',
  'academic-light': 'Academic Light (Sáng Tiêu Chuẩn)',
  'orange-white': 'Orange White (Trắng Cam Ấm)',
};

const VALID_VIEWS = [
  'home',
  'catalog',
  'my-borrowings',
  'admin',
  'dashboard',
  'settings',
  'book-mgmt',
  'borrow-mgmt',
  'user-mgmt',
];

function getInitialViewFromUrl() {
  const hash = window.location.hash.replace('#/', '').replace('#', '').trim();
  if (hash && VALID_VIEWS.includes(hash)) {
    return hash === 'admin' ? 'dashboard' : hash;
  }
  return 'home';
}

export default function App() {
  const [currentView, setCurrentViewState] = useState(getInitialViewFromUrl);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(
    () => localStorage.getItem('libtech_user_theme') || 'emerald-scholar'
  );
  const [fontScale, setFontScale] = useState(
    () => localStorage.getItem('libtech_font_scale') || '100%'
  );

  // Reading Wishlist / Saved Books state (persisted in localStorage)
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('libtech_wishlist') || '[]');
      return Array.isArray(saved) ? saved.map((x) => (typeof x === 'object' ? String(x.id) : String(x))) : [];
    } catch {
      return [];
    }
  });
  const [catalogSavedOnly, setCatalogSavedOnly] = useState(false);

  // Search routing state
  const [catalogKeyword, setCatalogKeyword] = useState('');
  const [catalogCategoryId, setCatalogCategoryId] = useState(null);
  const [catalogScope, setCatalogScope] = useState('all');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [policyActiveTab, setPolicyActiveTab] = useState('rules');
  const [selectedBookForDetail, setSelectedBookForDetail] = useState(null);
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState(null);

  // Payment modal state (VNPay & SePay VietQR)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentRecord, setPaymentRecord] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(30000);
  const [myBorrowingsKey, setMyBorrowingsKey] = useState(0);

  // Active Borrowings count for navbar cart badge
  const [activeBorrowCount, setActiveBorrowCount] = useState(0);

  useEffect(() => {
    document.documentElement.style.fontSize = fontScale;
    localStorage.setItem('libtech_font_scale', fontScale);
  }, [fontScale]);

  const handleToggleWishlist = (bookOrId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const idStr = String(typeof bookOrId === 'object' ? bookOrId.id : bookOrId);
    const title = typeof bookOrId === 'object' ? bookOrId.title : 'tài liệu';
    setWishlistIds((prev) => {
      const exists = prev.includes(idStr);
      const next = exists ? prev.filter((item) => item !== idStr) : [...prev, idStr];
      localStorage.setItem('libtech_wishlist', JSON.stringify(next));
      showToast(
        exists
          ? `Đã bỏ lưu "${title}" khỏi Tủ sách Yêu thích`
          : `❤️ Đã lưu "${title}" vào Tủ sách Đọc sau`,
        exists ? 'info' : 'success',
        2200
      );
      return next;
    });
  };

  const setCurrentView = (view, overrideUser = undefined) => {
    const activeUser = overrideUser !== undefined ? overrideUser : user;
    const normalized = view === 'admin' ? 'dashboard' : view;

    if (ADMIN_VIEWS.includes(normalized) && !isAdminOrLibrarian(activeUser)) {
      setCurrentViewState('home');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setAuthModalOpen(true);
      showToast(
        'Vui lòng đăng nhập bằng tài khoản Quản trị viên (Admin/Thủ thư) để truy cập trang quản trị!',
        'warning',
        4000
      );
      return;
    }

    if (normalized === 'my-borrowings' && !activeUser) {
      setCurrentViewState('home');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setAuthModalOpen(true);
      showToast('Vui lòng đăng nhập tài khoản độc giả để xem danh sách sách mượn!', 'info', 3000);
      return;
    }

    setCurrentViewState(normalized);
    const hashValue = normalized === 'home' ? '' : `#/${normalized}`;
    if (window.location.hash !== hashValue) {
      window.history.replaceState(null, '', hashValue || window.location.pathname + window.location.search);
    }
  };

  useEffect(() => {
    const onHashChange = () => {
      const nextView = getInitialViewFromUrl();
      const savedUserRaw = localStorage.getItem('library_user');
      const savedToken = localStorage.getItem('library_token');
      let parsedUser = user;
      if (!parsedUser && savedUserRaw && savedToken) {
        try {
          parsedUser = JSON.parse(savedUserRaw);
        } catch (e) {}
      }
      if (ADMIN_VIEWS.includes(nextView) && !isAdminOrLibrarian(parsedUser)) {
        setCurrentViewState('home');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        setAuthModalOpen(true);
        showToast(
          'Vui lòng đăng nhập bằng tài khoản Quản trị viên (Admin/Thủ thư) để truy cập trang quản trị!',
          'warning',
          4000
        );
        return;
      }
      if (nextView === 'my-borrowings' && !parsedUser) {
        setCurrentViewState('home');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        setAuthModalOpen(true);
        return;
      }
      setCurrentViewState(nextView);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [user]);

  useEffect(() => {
    // 1. Khôi phục phiên đăng nhập thực từ localStorage (không tự động đăng nhập tài khoản mẫu)
    const savedUser = localStorage.getItem('library_user');
    const savedToken = localStorage.getItem('library_token');
    let restoredUser = null;

    if (savedUser && savedToken) {
      try {
        restoredUser = JSON.parse(savedUser);
        setUser(restoredUser);
        loadBorrowCount();
      } catch (e) {
        setUser(null);
        localStorage.removeItem('library_user');
        localStorage.removeItem('library_token');
      }
    } else {
      setUser(null);
      localStorage.removeItem('library_user');
      localStorage.removeItem('library_token');
    }

    // Kiểm tra quyền truy cập ngay khi vừa tải trang nếu URL trỏ tới trang quản trị hoặc sách đang mượn
    const initialView = getInitialViewFromUrl();
    if (ADMIN_VIEWS.includes(initialView) && !isAdminOrLibrarian(restoredUser)) {
      setCurrentViewState('home');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setAuthModalOpen(true);
      showToast(
        'Vui lòng đăng nhập bằng tài khoản Quản trị viên (Admin/Thủ thư) để truy cập trang quản trị!',
        'warning',
        4000
      );
    } else if (initialView === 'my-borrowings' && !restoredUser) {
      setCurrentViewState('home');
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setAuthModalOpen(true);
    }

    // 2. Xử lý OAuth 2.0 Redirect Callback (Google / Facebook) hoặc đồng bộ cross-domain (.nip.io -> IP)
    if (window.location.hash.includes('oauth_sync=')) {
      try {
        const syncParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
        const encoded = syncParams.get('oauth_sync');
        if (encoded) {
          const authData = JSON.parse(decodeURIComponent(encoded));
          if (authData && authData.token) {
            const userObj = authData.user || {
              id: authData.id,
              email: authData.email,
              fullName: authData.fullName,
              role: authData.role,
              avatar: authData.avatar,
            };
            localStorage.setItem('library_token', authData.token);
            localStorage.setItem('library_user', JSON.stringify(userObj));
            handleAuthSuccess(userObj);
          }
        }
        window.history.replaceState({}, document.title, '/');
      } catch (e) {
        console.error('OAuth sync error:', e);
      }
    } else if (
      window.location.hash.includes('access_token=') ||
      window.location.hash.includes('id_token=') ||
      window.location.search.includes('code=') ||
      window.location.pathname.includes('/auth/callback/')
    ) {
      handleOAuthRedirectCallback();
    }

    // 3. Tải cấu hình hệ thống & thống kê
    loadSettings();
    loadSystemStats();

    // 4. Kiểm tra callback từ cổng thanh toán VNPay
    if (window.location.search && window.location.search.includes('vnp_ResponseCode')) {
      handleVNPayReturnCallback();
    }
  }, []);

  const handleOAuthRedirectCallback = async () => {
    try {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
      const queryParams = new URLSearchParams(window.location.search);
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const idToken = hashParams.get('id_token') || queryParams.get('id_token');
      const state = hashParams.get('state') || queryParams.get('state') || '';
      if (!accessToken && !idToken) return;

      const finalizeSocialAuth = (authData) => {
        if (!authData || !authData.token) {
          throw new Error('Không nhận được token xác thực từ máy chủ');
        }
        const userObj = authData.user || {
          id: authData.id,
          email: authData.email,
          fullName: authData.fullName,
          role: authData.role,
          avatar: authData.avatar,
        };
        localStorage.setItem('library_token', authData.token);
        localStorage.setItem('library_user', JSON.stringify(userObj));

        // Nếu người dùng bắt đầu từ IP gốc (ví dụ http://160.191.244.153:8088) và Google redirect sang .nip.io,
        // chuyển hướng ngược về origin gốc kèm dữ liệu phiên để lưu localStorage đúng tên miền đang dùng
        if (
          state &&
          state.startsWith('http') &&
          state !== window.location.origin
        ) {
          window.location.href = `${state}/#oauth_sync=${encodeURIComponent(
            JSON.stringify({ ...authData, user: userObj })
          )}`;
          return true;
        }

        handleAuthSuccess(userObj);
        return false;
      };

      if (state.includes('facebook') || window.location.pathname.includes('facebook')) {
        const fbRes = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(accessToken)}`
        );
        if (!fbRes.ok) {
          throw new Error('Không thể lấy thông tin tài khoản Facebook');
        }
        const profile = await fbRes.json();
        const authData = await restFacebookLogin({
          email: profile.email || `${profile.id}@facebook.com`,
          fullName: profile.name || 'Độc giả Facebook',
          avatar: profile.picture?.data?.url || '',
          facebookToken: accessToken,
        });
        if (finalizeSocialAuth(authData)) return;
      } else {
        let profile = null;
        if (accessToken) {
          const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (gRes.ok) {
            profile = await gRes.json();
          }
        }
        if (!profile && idToken) {
          try {
            const payloadBase64 = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            profile = JSON.parse(decodeURIComponent(escape(window.atob(payloadBase64))));
          } catch (e) {}
        }
        if (!profile || !profile.email) {
          throw new Error('Không thể đọc email từ tài khoản Google');
        }
        const authData = await restGoogleLogin({
          email: profile.email,
          fullName: profile.name || profile.email,
          avatar: profile.picture || '',
          googleToken: accessToken || idToken,
        });
        if (finalizeSocialAuth(authData)) return;
      }
      window.history.replaceState({}, document.title, '/');
    } catch (err) {
      console.error('OAuth callback error:', err);
      showToast('Không thể xác thực phiên đăng nhập mạng xã hội: ' + (err.message || ''), 'error');
    }
  };

  const loadSystemStats = async () => {
    try {
      const statsData = await getSystemStats();
      if (statsData) {
        setSystemStats(statsData);
      }
    } catch (e) {
      // ignore
    }
  };

  const loadBorrowCount = async () => {
    try {
      const data = await graphqlQuery(GET_MY_BORROWINGS);
      const list = data?.myBorrowRecords || [];
      const active = list.filter((r) => r.status === 'BORROWED' || r.status === 'PENDING').length;
      setActiveBorrowCount(active);
    } catch (e) {
      // ignore
    }
  };

  const loadSettings = async () => {
    try {
      const data = await getSystemSettings();
      if (data) {
        setSettings(data);
        if (data.siteTitle) {
          document.title = `${data.siteTitle} - ${data.siteSubtitle || 'Thư Viện Số'}`;
        }
        const userPrefTheme = localStorage.getItem('libtech_user_theme');
        if (userPrefTheme && THEME_LIST.includes(userPrefTheme)) {
          applyTheme(userPrefTheme);
        } else if (data.themeName && THEME_LIST.includes(data.themeName)) {
          applyTheme(data.themeName);
        } else {
          applyTheme('emerald-scholar');
        }

        // Kiểm tra hiển thị Popup thông báo bản tin
        if (
          data.popupEnabled !== false &&
          localStorage.getItem('library_hide_popup_date') !== new Date().toDateString()
        ) {
          const seen = sessionStorage.getItem('library_popup_seen');
          if (!seen) {
            setAnnouncementModalOpen(true);
            sessionStorage.setItem('library_popup_seen', 'true');
          }
        }
      }
    } catch (err) {
      console.error('Lỗi tải cấu hình hệ thống:', err);
      const userPrefTheme = localStorage.getItem('libtech_user_theme');
      applyTheme(userPrefTheme && THEME_LIST.includes(userPrefTheme) ? userPrefTheme : 'emerald-scholar');
    }
  };

  const applyTheme = (themeName) => {
    setCurrentTheme(themeName);
    document.body.className = `theme-${themeName}`;
  };

  const handleSelectTheme = (themeName) => {
    if (!THEME_LIST.includes(themeName)) return;
    localStorage.setItem('libtech_user_theme', themeName);
    applyTheme(themeName);
    showToast(`Đã chuyển giao diện: ${THEME_LABELS[themeName] || themeName}`, 'info', 2200);
  };

  const handleCycleTheme = () => {
    const currentIndex = THEME_LIST.indexOf(currentTheme);
    const nextTheme = THEME_LIST[(currentIndex + 1) % THEME_LIST.length];
    handleSelectTheme(nextTheme);
  };

  const handleVNPayReturnCallback = async () => {
    try {
      const paymentResult = await processVNPayReturn(window.location.search);
      if (paymentResult.status === 'SUCCESS') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        showToast(
          `Thanh toán VNPay thành công! Mã giao dịch: ${paymentResult.transactionId}`,
          'success',
          5000
        );
        window.history.replaceState({}, document.title, window.location.pathname);
        setCurrentView('my-borrowings');
        loadBorrowCount();
      }
    } catch (err) {
      console.error('VNPay return error:', err);
      showToast('Không thể xác thực giao dịch VNPay', 'error');
    }
  };

  const handleAuthSuccess = (userData) => {
    localStorage.removeItem('user_logged_out');
    setUser(userData);
    localStorage.setItem('library_user', JSON.stringify(userData));
    loadBorrowCount();
    showToast(`Xin chào, ${userData.fullName || userData.email}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.setItem('user_logged_out', 'true');
    localStorage.removeItem('library_token');
    localStorage.removeItem('library_user');
    setActiveBorrowCount(0);
    setCurrentView('home');
    showToast('Đã đăng xuất khỏi tài khoản thư viện', 'info');
  };

  const handleGoCatalog = (keyword = '', categoryId = null, savedOnly = false) => {
    setCatalogKeyword(keyword);
    setCatalogCategoryId(categoryId);
    setCatalogScope('all');
    setCatalogSavedOnly(savedOnly);
    setCurrentView('catalog');
  };

  const handleQuickSearch = (keyword = '', scope = 'all') => {
    setCatalogKeyword(keyword);
    setCatalogScope(scope);
    setCatalogSavedOnly(false);
    setCurrentView('catalog');
  };

  const handleOpenPolicy = (tab = 'rules') => {
    setPolicyActiveTab(tab);
    setPolicyModalOpen(true);
  };

  const handlePayFine = (record, fineAmount) => {
    setPaymentRecord(record);
    setPaymentAmount(fineAmount || 30000);
    setPaymentModalOpen(true);
  };

  const isAdminView = ADMIN_VIEWS.includes(currentView) && isAdminOrLibrarian(user);

  const getAdminInitialSection = () => {
    switch (currentView) {
      case 'settings':
        return 'branding';
      case 'book-mgmt':
        return 'books';
      case 'borrow-mgmt':
        return 'borrows';
      case 'user-mgmt':
        return 'users';
      case 'admin':
      case 'dashboard':
      default:
        return 'overview';
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        height: isAdminView ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: isAdminView ? 'hidden' : 'visible',
      }}
    >
      <ToastContainer />

      {/* GSL Dual-Bar Header & Navigation (Rendered on Reader Pages) */}
      {!isAdminView && (
        <Navbar
          currentView={currentView}
          setCurrentView={(v) => {
            if (v === 'catalog') setCatalogSavedOnly(false);
            setCurrentView(v);
          }}
          user={user}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          onOpenAi={() => setAiModalOpen(true)}
          onOpenAnnouncement={() => setAnnouncementModalOpen(true)}
          settings={settings}
          currentTheme={currentTheme}
          onCycleTheme={handleCycleTheme}
          onSelectTheme={handleSelectTheme}
          fontScale={fontScale}
          onChangeFontScale={(scale) => {
            setFontScale(scale);
            showToast(`Đã điều chỉnh cỡ chữ hiển thị: ${scale}`, 'info', 1800);
          }}
          onQuickSearch={handleQuickSearch}
          onOpenPolicy={handleOpenPolicy}
          borrowCartCount={activeBorrowCount}
          wishlistCount={wishlistIds.length}
          onOpenWishlist={() => handleGoCatalog('', null, true)}
        />
      )}

      {/* Main Content Views */}
      <main style={{ flex: 1 }}>
        {currentView === 'home' && (
          <HomeView
            onSelectBook={(b) => setSelectedBookForDetail(b)}
            onOpenAi={() => setAiModalOpen(true)}
            onGoCatalog={handleGoCatalog}
            settings={settings}
            stats={systemStats}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogView
            initialKeyword={catalogKeyword}
            initialCategoryId={catalogCategoryId}
            initialScope={catalogScope}
            initialSavedOnly={catalogSavedOnly}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onSelectBook={(b) => setSelectedBookForDetail(b)}
            onBorrowClick={(b) => {
              if (!user) setAuthModalOpen(true);
              else setSelectedBookForBorrow(b);
            }}
          />
        )}

        {currentView === 'my-borrowings' && (
          <MyBorrowingsView key={myBorrowingsKey} user={user} onPayFine={handlePayFine} />
        )}

        {isAdminView && (
          <AdminDashboardView
            onNavigate={setCurrentView}
            initialSection={getAdminInitialSection()}
            onLogout={handleLogout}
            onThemeChange={(newTheme) => {
              applyTheme(newTheme);
              loadSettings();
            }}
          />
        )}
      </main>

      {/* Official Accredited Footer (Rendered on Reader Pages) */}
      {!isAdminView && (
        <Footer
          settings={settings}
          stats={systemStats}
          onOpenPolicy={handleOpenPolicy}
        />
      )}

      {/* Floating AI Chatbot Quick Trigger (Positioned at bottom: 80px on mobile so it never overlaps Bottom Nav) */}
      {!isAdminView && !aiModalOpen && (
        <button
          onClick={() => setAiModalOpen(true)}
          className="floating-ai-btn"
          title="Mở Trợ lý Thư viện AI 24/7"
          aria-label="Mở Trợ lý Thư viện AI"
        >
          <Sparkles size={16} color="#38bdf8" />
          <span>AI Tư Vấn 24/7</span>
        </button>
      )}

      {/* Native-App-Like Mobile Bottom Navigation Bar (< 768px) */}
      {!isAdminView && (
        <nav className="mobile-bottom-nav" aria-label="Điều hướng di động">
          <button
            type="button"
            onClick={() => {
              setCatalogSavedOnly(false);
              setCurrentView('home');
            }}
            className={`mobile-bottom-nav-item ${currentView === 'home' ? 'active' : ''}`}
          >
            <Home size={19} />
            <span>Trang chủ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCatalogSavedOnly(false);
              setCurrentView('catalog');
            }}
            className={`mobile-bottom-nav-item ${
              currentView === 'catalog' && !catalogSavedOnly ? 'active' : ''
            }`}
          >
            <BookOpen size={19} />
            <span>Kho sách</span>
          </button>

          <button
            type="button"
            onClick={() => handleGoCatalog('', null, true)}
            className={`mobile-bottom-nav-item ${
              currentView === 'catalog' && catalogSavedOnly ? 'active' : ''
            }`}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Heart
                size={19}
                fill={wishlistIds.length > 0 ? '#e11d48' : 'none'}
                color={wishlistIds.length > 0 ? '#e11d48' : 'currentColor'}
              />
              {wishlistIds.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    background: '#e11d48',
                    color: '#ffffff',
                    fontSize: '0.6rem',
                    fontWeight: '800',
                    padding: '0 4px',
                    borderRadius: '999px',
                    minWidth: '15px',
                    height: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {wishlistIds.length}
                </span>
              )}
            </div>
            <span>Đã lưu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!user) setAuthModalOpen(true);
              else setCurrentView('my-borrowings');
            }}
            className={`mobile-bottom-nav-item ${currentView === 'my-borrowings' ? 'active' : ''}`}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Bookmark size={19} />
              {activeBorrowCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '0.6rem',
                    fontWeight: '800',
                    padding: '0 4px',
                    borderRadius: '999px',
                    minWidth: '15px',
                    height: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {activeBorrowCount}
                </span>
              )}
            </div>
            <span>Sách mượn</span>
          </button>

          <button
            type="button"
            onClick={() => setAiModalOpen((prev) => !prev)}
            className={`mobile-bottom-nav-item ${aiModalOpen ? 'active' : ''}`}
          >
            <Sparkles size={19} color="#0284c7" />
            <span>AI Tư vấn</span>
          </button>
        </nav>
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onNavigate={(view, loggedInUser) => setCurrentView(view, loggedInUser)}
        settings={settings}
      />

      <BookDetailModal
        bookId={selectedBookForDetail?.id}
        isOpen={!!selectedBookForDetail}
        onClose={() => setSelectedBookForDetail(null)}
        user={user}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onBorrowClick={(b) => {
          setSelectedBookForDetail(null);
          if (!user) setAuthModalOpen(true);
          else setSelectedBookForBorrow(b);
        }}
      />

      <BorrowModal
        book={selectedBookForBorrow}
        isOpen={!!selectedBookForBorrow}
        onClose={() => {
          setSelectedBookForBorrow(null);
          loadBorrowCount();
        }}
        onSuccess={() => {
          loadBorrowCount();
          loadSystemStats();
        }}
        onViewMyBorrowings={() => {
          setSelectedBookForBorrow(null);
          loadBorrowCount();
          setCurrentView('my-borrowings');
        }}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        borrowRecord={paymentRecord}
        amount={paymentAmount}
        onSuccess={() => {
          loadBorrowCount();
          loadSystemStats();
          setMyBorrowingsKey(k => k + 1);
          setCurrentView('my-borrowings');
        }}
      />

      <AiChatbotModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onSelectBook={(b) => setSelectedBookForDetail(b)}
      />

      <PolicyModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        activeTab={policyActiveTab}
      />

      <AnnouncementModal
        isOpen={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
        onGoCatalog={() => {
          setCatalogKeyword('');
          setCatalogSavedOnly(false);
          setCurrentView('catalog');
        }}
        settings={settings}
      />
    </div>
  );
}
