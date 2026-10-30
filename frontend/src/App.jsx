import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PolicyModal from './components/PolicyModal';
import HomeView from './views/HomeView';
import CatalogView from './views/CatalogView';
import MyBorrowingsView from './views/MyBorrowingsView';
import AdminDashboardView from './views/AdminDashboardView';
import BookManagementView from './views/BookManagementView';
import BorrowManagementView from './views/BorrowManagementView';
import UserManagementView from './views/UserManagementView';
import AdminSettingsView from './views/AdminSettingsView';
import AuthModal from './components/AuthModal';
import BookDetailModal from './components/BookDetailModal';
import BorrowModal from './components/BorrowModal';
import PaymentModal from './components/PaymentModal';
import AiChatbotModal from './components/AiChatbotModal';
import AnnouncementModal from './components/AnnouncementModal';
import { processVNPayReturn, getSystemSettings, graphqlQuery, restLogin } from './services/api';
import { GET_MY_BORROWINGS } from './services/graphqlQueries';
import confetti from 'canvas-confetti';

const THEME_LIST = ['emerald-scholar', 'oxford-navy', 'modern-dark', 'academic-light'];

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('emerald-scholar');

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

  // Active Borrowings count for navbar cart badge
  const [activeBorrowCount, setActiveBorrowCount] = useState(0);

  useEffect(() => {
    // 1. Khôi phục user phiên trước đó nếu có
    const savedUser = localStorage.getItem('library_user');
    const savedToken = localStorage.getItem('library_token');

    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
      } catch (e) {}
    } else {
      const defaultDemoUser = {
        id: 3,
        email: 'reader@library.com',
        fullName: 'Sinh viên Trần Anh Tuấn',
        role: 'ROLE_READER',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop'
      };
      setUser(defaultDemoUser);
      localStorage.setItem('library_user', JSON.stringify(defaultDemoUser));
    }

    // Đảm bảo token luôn hợp lệ và tươi mới
    if (!savedToken) {
      restLogin('reader@library.com', 'reader123')
        .then(res => {
          localStorage.setItem('library_token', res.token);
          loadBorrowCount();
        })
        .catch(() => loadBorrowCount());
    } else {
      loadBorrowCount();
    }

    // 2. Tải cấu hình hệ thống (Title, Logo, Theme...)
    loadSettings();

    // 3. Kiểm tra callback từ VNPay Sandbox
    if (window.location.search && window.location.search.includes('vnp_ResponseCode')) {
      handleVNPayReturnCallback();
    }
  }, []);

  const loadBorrowCount = async () => {
    try {
      const data = await graphqlQuery(GET_MY_BORROWINGS);
      const list = data?.myBorrowRecords || [];
      const active = list.filter(r => r.status === 'BORROWED' || r.status === 'PENDING').length;
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
        if (data.themeName) {
          applyTheme(data.themeName);
        } else {
          applyTheme('emerald-scholar');
        }

        // Kiểm tra hiển thị Popup thông báo bản tin
        if (data.popupEnabled !== false && localStorage.getItem('library_hide_popup_date') !== new Date().toDateString()) {
          const seen = sessionStorage.getItem('library_popup_seen');
          if (!seen) {
            setAnnouncementModalOpen(true);
            sessionStorage.setItem('library_popup_seen', 'true');
          }
        }
      }
    } catch (err) {
      console.error('Lỗi tải cấu hình hệ thống:', err);
      applyTheme('emerald-scholar');
    }
  };

  const applyTheme = (themeName) => {
    setCurrentTheme(themeName);
    document.body.className = `theme-${themeName}`;
  };

  const handleCycleTheme = () => {
    const currentIndex = THEME_LIST.indexOf(currentTheme);
    const nextTheme = THEME_LIST[(currentIndex + 1) % THEME_LIST.length];
    applyTheme(nextTheme);
  };

  const handleVNPayReturnCallback = async () => {
    try {
      const paymentResult = await processVNPayReturn(window.location.search);
      if (paymentResult.status === 'SUCCESS') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        alert('🎉 Thanh toán VNPay thành công! Mã giao dịch: ' + paymentResult.transactionId);
        window.history.replaceState({}, document.title, window.location.pathname);
        setCurrentView('my-borrowings');
        loadBorrowCount();
      }
    } catch (err) {
      console.error('VNPay return error:', err);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('library_user', JSON.stringify(userData));
    loadBorrowCount();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('library_token');
    localStorage.removeItem('library_user');
    setActiveBorrowCount(0);
    setCurrentView('home');
  };

  const handleGoCatalog = (keyword = '', categoryId = null) => {
    setCatalogKeyword(keyword);
    setCatalogCategoryId(categoryId);
    setCatalogScope('all');
    setCurrentView('catalog');
  };

  const handleQuickSearch = (keyword = '', scope = 'all') => {
    setCatalogKeyword(keyword);
    setCatalogScope(scope);
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

  const isAdminView = ['dashboard', 'settings', 'book-mgmt', 'borrow-mgmt', 'user-mgmt'].includes(currentView);

  const getAdminInitialSection = () => {
    switch (currentView) {
      case 'settings': return 'branding';
      case 'book-mgmt': return 'books';
      case 'borrow-mgmt': return 'borrows';
      case 'user-mgmt': return 'users';
      case 'dashboard':
      default: return 'overview';
    }
  };

  return (
    <div style={{ minHeight: '100vh', height: isAdminView ? '100vh' : 'auto', display: 'flex', flexDirection: 'column', overflow: isAdminView ? 'hidden' : 'visible' }}>
      
      {/* GSL Dual-Bar Header & Navigation (Rendered on Reader Pages) */}
      {!isAdminView && (
        <Navbar 
          currentView={currentView}
          setCurrentView={setCurrentView}
          user={user}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          onOpenAi={() => setAiModalOpen(true)}
          onOpenAnnouncement={() => setAnnouncementModalOpen(true)}
          settings={settings}
          onCycleTheme={handleCycleTheme}
          onQuickSearch={handleQuickSearch}
          onOpenPolicy={handleOpenPolicy}
          borrowCartCount={activeBorrowCount}
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
          />
        )}

        {currentView === 'catalog' && (
          <CatalogView 
            initialKeyword={catalogKeyword}
            initialCategoryId={catalogCategoryId}
            initialScope={catalogScope}
            onSelectBook={(b) => setSelectedBookForDetail(b)}
            onBorrowClick={(b) => {
              if (!user) setAuthModalOpen(true);
              else setSelectedBookForBorrow(b);
            }}
          />
        )}

        {currentView === 'my-borrowings' && (
          <MyBorrowingsView 
            user={user}
            onPayFine={handlePayFine}
          />
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
          onOpenPolicy={handleOpenPolicy}
        />
      )}

      {/* Global Modals */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onNavigate={(view) => setCurrentView(view)}
        settings={settings}
      />

      <BookDetailModal 
        bookId={selectedBookForDetail?.id}
        isOpen={!!selectedBookForDetail}
        onClose={() => setSelectedBookForDetail(null)}
        user={user}
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
          setCurrentView('catalog');
        }}
        settings={settings}
      />

    </div>
  );
}
