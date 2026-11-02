import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, Users, Clock, AlertTriangle, DollarSign, 
  TrendingUp, CreditCard, QrCode, Server, Shield, Sparkles, Key, Cloud, 
  RefreshCw, CheckCircle2, AlertCircle, ArrowUpRight, Plus, ExternalLink, 
  Activity, Compass, Search, Download, Mail, MessageSquare, ChevronRight,
  FileText, Check, Phone, Layers, Calendar, Filter, Database, Globe,
  Radio, Send, Bell, Home, LogOut, Sun, Moon, Cpu, Wifi, HardDrive, Zap,
  Sliders, Eye, Image as ImageIcon, Menu, X
} from 'lucide-react';
import { graphqlQuery, getSystemSettings, updateSystemSettings } from '../services/api';
import { GET_DASHBOARD_STATS, GET_CATEGORIES, GET_BOOKS } from '../services/graphqlQueries';
import { showToast } from '../components/Toast';

// Sub-views integrated directly into the unified dashboard
import BookManagementView from './BookManagementView';
import BorrowManagementView from './BorrowManagementView';
import UserManagementView from './UserManagementView';
import AdminSettingsView from './AdminSettingsView';
import AnnouncementModal from '../components/AnnouncementModal';

export default function AdminDashboardView({ 
  onNavigate, 
  initialSection = 'overview', 
  onLogout, 
  onThemeChange 
}) {
  const [activeMenu, setActiveMenu] = useState(initialSection);
  const [adminTheme, setAdminTheme] = useState('light'); // Enterprise default: 'light', toggleable to 'dark'
  
  // Dashboard Metrics & Charts
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('7d');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');

  // Broadcast Notification State (matching Image 2)
  const [lastBroadcastTime, setLastBroadcastTime] = useState('00:26:15 28/10/2026');
  const [enablePopup, setEnablePopup] = useState(true);
  const [enableBannerButton, setEnableBannerButton] = useState(true);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Popup & Bulletin Settings State
  const [popupSettings, setPopupSettings] = useState({
    popupEnabled: true,
    popupNavButtonEnabled: true,
    popupTitle: 'Thông Báo: Khai Trương Kho Sách Số & Tuần Lễ Văn Hóa Đọc 2026',
    popupBadgeText: 'HOT • BẢN TIN SỐ #1792776375',
    popupBannerUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1000',
    popupContent: 'Chào mừng quý độc giả đến với Hệ thống Thư viện Số SmartLibrary! Nhằm phục vụ đợt thi học kỳ và nhu cầu nghiên cứu học thuật, Thư viện nâng hạn mức mượn giáo trình lên 5 cuốn/độc giả, miễn phí đọc 100 tài liệu số chuyên ngành. Trợ lý AI Gemini đã sẵn sàng hỗ trợ tra cứu 24/7.',
    popupLinkText: 'Xem Kho Sách & Tra Cứu'
  });
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupSaveSuccess, setPopupSaveSuccess] = useState(false);

  useEffect(() => {
    if (initialSection) {
      setActiveMenu(initialSection);
    }
  }, [initialSection]);

  useEffect(() => {
    loadDashboardData();
    loadSystemSettingsData();
  }, []);

  const loadSystemSettingsData = async () => {
    try {
      const data = await getSystemSettings();
      if (data) {
        setEnablePopup(data.popupEnabled !== false);
        setEnableBannerButton(data.popupNavButtonEnabled !== false);
        setPopupSettings(prev => ({
          ...prev,
          popupEnabled: data.popupEnabled !== false,
          popupNavButtonEnabled: data.popupNavButtonEnabled !== false,
          popupTitle: data.popupTitle || prev.popupTitle,
          popupBadgeText: data.popupBadgeText || prev.popupBadgeText,
          popupBannerUrl: data.popupBannerUrl || prev.popupBannerUrl,
          popupContent: data.popupContent || prev.popupContent,
          popupLinkText: data.popupLinkText || prev.popupLinkText
        }));
      }
    } catch (e) {
      console.error('Lỗi tải cấu hình Popup:', e);
    }
  };

  const handleSavePopupSettings = async (overrideSettings = null) => {
    setPopupSaving(true);
    setPopupSaveSuccess(false);
    try {
      const payload = overrideSettings || popupSettings;
      await updateSystemSettings(payload);
      setPopupSaveSuccess(true);
      showToast('Đã lưu và phát sóng cấu hình bản tin thành công!', 'success');
      setTimeout(() => setPopupSaveSuccess(false), 3500);
    } catch (e) {
      showToast('Lỗi lưu cấu hình: ' + e.message, 'error');
    } finally {
      setPopupSaving(false);
    }
  };

  const handleTogglePopup = async (checked) => {
    setEnablePopup(checked);
    const updated = { ...popupSettings, popupEnabled: checked };
    setPopupSettings(updated);
    try {
      await updateSystemSettings(updated);
    } catch (e) {}
  };

  const handleToggleBannerButton = async (checked) => {
    setEnableBannerButton(checked);
    const updated = { ...popupSettings, popupNavButtonEnabled: checked };
    setPopupSettings(updated);
    try {
      await updateSystemSettings(updated);
    } catch (e) {}
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [data, catData, bookData] = await Promise.all([
        graphqlQuery(GET_DASHBOARD_STATS),
        graphqlQuery(GET_CATEGORIES),
        graphqlQuery(GET_BOOKS, { page: 0, size: 120 }),
      ]);
      setStats(data?.dashboardStats || null);
      setPayments(data?.payments || []);
      setCategories(catData?.categories || []);
      setBooks(bookData?.books?.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    await loadSystemSettingsData();
    setRefreshing(false);
  };

  const handleBroadcast = async () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${now.toLocaleDateString('vi-VN')}`;
    setLastBroadcastTime(timeStr);
    setBroadcastSuccess(true);
    try {
      await updateSystemSettings(popupSettings);
    } catch (e) {}
    setTimeout(() => setBroadcastSuccess(false), 4000);
  };

  const handleExportReport = () => {
    const reportData = `BÁO CÁO HOẠT ĐỘNG THƯ VIỆN SỐ SMARTLIBRARY\nNgày xuất: ${new Date().toLocaleString('vi-VN')}\nTổng đầu sách: ${stats?.totalBooks || 100}\nTổng độc giả: ${stats?.totalReaders || 12}\nĐang mượn: ${stats?.activeBorrowings || 0}\nQuá hạn: ${stats?.overdueBorrowings || 0}\nDoanh thu: ${(stats?.totalRevenue || 0).toLocaleString('vi-VN')} VNĐ`;
    const blob = new Blob([reportData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_Cao_Thu_Vien_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  // Menu items list matching Image 2
  const menuGroups = [
    {
      group: 'BÁO CÁO & PHÂN TÍCH',
      items: [
        { id: 'overview', label: 'Doanh Thu & CSDL', icon: TrendingUp, tag: 'CSDL', tagBg: '#78350f', tagColor: '#fde047' },
        { id: 'server', label: 'Máy Chủ Trực Tuyến', icon: Server, tag: 'LIVE', tagBg: '#064e3b', tagColor: '#34d399' }
      ]
    },
    {
      group: 'QUẢN LÝ DỮ LIỆU',
      items: [
        { id: 'books', label: 'Quản Lý Toàn Bộ Sách', icon: BookOpen, tag: 'ALL', tagBg: '#581c87', tagColor: '#d8b4fe' },
        { id: 'borrows', label: 'Quản Lý Mượn Trả', icon: Clock, tag: 'RENT', tagBg: '#713f12', tagColor: '#facc15' },
        { id: 'payments', label: 'Lịch Sử Thanh Toán', icon: CreditCard, tag: 'BILL', tagBg: '#064e3b', tagColor: '#34d399' },
        { id: 'users', label: 'Quản Lý Độc Giả', icon: Users, tag: 'ACCOUNT', tagBg: '#164e63', tagColor: '#38bdf8' }
      ]
    },
    {
      group: 'CẤU HÌNH HỆ THỐNG',
      items: [
        { id: 'popup', label: 'Quản Lý Popup & Bản Tin', icon: Bell, tag: 'POPUP', tagBg: '#78350f', tagColor: '#fde047' },
        { id: 'branding', label: 'Nhận Diện & Thương Hiệu', icon: Globe, tag: 'SYS', tagBg: '#1e3a8a', tagColor: '#60a5fa' },
        { id: 'gemini', label: 'Trợ Lý AI Gemini', icon: Sparkles, tag: 'AI', tagBg: '#4c1d95', tagColor: '#c084fc' },
        { id: 'oauth', label: 'Xác Thực OAuth (Google & FB)', icon: Key, tag: 'AUTH', tagBg: '#064e3b', tagColor: '#4ade80' },
        { id: 'database', label: 'Cơ Sở Dữ Liệu (5 DBs)', icon: Database, tag: 'DB', tagBg: '#7c2d12', tagColor: '#38bdf8' },
        { id: 'payment', label: 'Cổng Thanh Toán (VNPay & SePay)', icon: CreditCard, tag: 'PAY', tagBg: '#713f12', tagColor: '#fde047' },
        { id: 'cloudflare', label: 'Cloudflare & Media CDN', icon: Cloud, tag: 'CDN', tagBg: '#1e293b', tagColor: '#94a3b8' }
      ]
    }
  ];

  // Colors based on adminTheme
  const isDark = adminTheme === 'dark';
  const themeColors = {
    bgApp: isDark ? '#070a13' : '#f8fafc',
    bgSidebar: isDark ? '#0b0f19' : '#ffffff',
    bgTopBar: isDark ? '#0b0f19' : '#ffffff',
    bgCard: isDark ? '#0f172a' : '#ffffff',
    bgCardSecondary: isDark ? '#111827' : '#f1f5f9',
    border: isDark ? '#1e293b' : '#e2e8f0',
    borderHighlight: isDark ? '#334155' : '#cbd5e1',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    activeNavBg: isDark ? '#1e293b' : '#eff6ff',
    activeNavBorder: '#1d4ed8',
    activeNavText: isDark ? '#2563eb' : '#1d4ed8'
  };

  const getSectionTitle = () => {
    for (const group of menuGroups) {
      const found = group.items.find(item => item.id === activeMenu);
      if (found) return `${group.group} / ${found.label}`;
    }
    return 'Hệ Thống / Bảng Điều Khiển';
  };

  return (
    <div 
      className={isDark ? "admin-portal-dark" : "admin-portal-light"}
      style={{ 
        display: 'flex', 
        width: '100%', 
        height: '100vh', 
        maxHeight: '100vh',
        backgroundColor: themeColors.bgApp, 
        color: themeColors.textMain,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        overflow: 'hidden',
        position: 'fixed',
        inset: 0,
        zIndex: 50
      }}
    >
      
      {/* ================= 1. LEFT SIDEBAR (EXACT MATCH TO IMAGE 2) ================= */}
      <aside
        className={`admin-sidebar-panel ${!mobileSidebarOpen ? 'mobile-closed' : ''}`}
        style={{ 
        width: '260px', 
        minWidth: '260px', 
        backgroundColor: themeColors.bgSidebar, 
        borderRight: `1px solid ${themeColors.border}`,
        display: 'flex', 
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        zIndex: 50,
        boxSizing: 'border-box'
      }}>
        
        {/* Brand Header */}
        <div style={{ 
          padding: '16px 16px', 
          borderBottom: `1px solid ${themeColors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '62px',
          boxSizing: 'border-box'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.925rem', fontWeight: '900', letterSpacing: '-0.02em', color: themeColors.textMain, lineHeight: 1.2 }}>
                QUẢN TRỊ HỆ THỐNG
              </span>
              <span style={{ 
                fontSize: '0.65rem', 
                fontWeight: '800', 
                color: '#1d4ed8', 
                background: isDark ? 'rgba(29, 78, 216, 0.15)' : '#eff6ff', 
                border: '1px solid rgba(29, 78, 216, 0.3)', 
                padding: '1px 5px', 
                borderRadius: '4px' 
              }}>
                ENTERPRISE
              </span>
            </div>
            <div style={{ fontSize: '0.675rem', color: themeColors.textMuted, fontWeight: '600', letterSpacing: '0.5px', marginTop: '3px' }}>
              SMARTLIBRARY ENTERPRISE • V3.0
            </div>
          </div>
        </div>

        {/* Quick Portal Switcher */}
        <div style={{ padding: '10px 10px 4px' }}>
          <button
            onClick={() => onNavigate && onNavigate('home')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '7px 12px',
              borderRadius: '6px',
              background: isDark ? '#1e293b' : '#eff6ff',
              border: isDark ? '1px solid #334155' : '1px solid #bfdbfe',
              color: isDark ? '#38bdf8' : '#1d4ed8',
              fontSize: '0.785rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Home size={14} /> Cổng Bạn Đọc (Thư Viện)
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx}>
              {/* Group Header */}
              <div style={{ 
                fontSize: '0.675rem', 
                fontWeight: '800', 
                color: themeColors.textMuted, 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                padding: '4px 8px 8px'
              }}>
                {group.group}
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveMenu(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: isActive ? themeColors.activeNavBg : 'transparent',
                        border: isActive ? `1px solid ${themeColors.activeNavBorder}` : '1px solid transparent',
                        color: isActive ? themeColors.activeNavText : themeColors.textMain,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <Icon size={15} color={isActive ? '#1d4ed8' : (isDark ? '#94a3b8' : '#64748b')} style={{ flexShrink: 0 }} />
                        <span style={{ 
                          fontSize: '0.785rem', 
                          fontWeight: isActive ? '700' : '500',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.label}
                        </span>
                      </div>

                      {/* Clean Enterprise Pill Badge */}
                      <span style={{
                        fontSize: '0.625rem',
                        fontWeight: '700',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: isActive 
                          ? (isDark ? 'rgba(37, 99, 235, 0.25)' : '#eff6ff')
                          : (isDark ? '#1e293b' : '#f1f5f9'),
                        color: isActive 
                          ? '#1d4ed8' 
                          : (isDark ? '#94a3b8' : '#64748b'),
                        border: isActive
                          ? (isDark ? '1px solid #2563eb' : '1px solid #bfdbfe')
                          : (isDark ? '1px solid #334155' : '1px solid #e2e8f0'),
                        letterSpacing: '0.02em',
                        flexShrink: 0
                      }}>
                        {item.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div style={{ 
          padding: '12px 10px', 
          borderTop: `1px solid ${themeColors.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <button
            onClick={() => onNavigate && onNavigate('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: isDark ? '#111827' : '#f1f5f9',
              border: `1px solid ${themeColors.border}`,
              color: themeColors.textMain,
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <Home size={14} /> Trang Chủ Thư Viện
          </button>

          <button
            onClick={() => onLogout && onLogout()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: isDark ? '#1f1315' : '#fef2f2',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <LogOut size={14} /> Đăng Xuất
          </button>
        </div>

      </aside>

      {/* ================= 2. MAIN CONTENT (FULL WIDTH & FLUID) ================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        
        {/* Top Header Bar (Breadcrumb, Server Port, Theme Toggle) */}
        <header style={{ 
          height: '52px', 
          minHeight: '52px',
          backgroundColor: themeColors.bgTopBar, 
          borderBottom: `1px solid ${themeColors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* Breadcrumb Left + Mobile Sidebar Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: themeColors.textMuted }}>
            <button
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
              className="admin-mobile-toggle"
              style={{
                background: isDark ? '#1e293b' : '#f1f5f9',
                border: `1px solid ${themeColors.border}`,
                color: themeColors.textMain,
                padding: '5px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Đóng/Mở Menu Quản Trị"
            >
              {mobileSidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
            <span>Hệ Thống</span>
            <span>/</span>
            <span style={{ color: themeColors.textMain, fontWeight: '700' }}>
              {menuGroups.flatMap(g => g.items).find(i => i.id === activeMenu)?.label || 'Báo Cáo & Phân Tích'}
            </span>
          </div>

          {/* Right Status Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* Port Status Pill */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              backgroundColor: '#064e3b', 
              border: '1px solid #059669', 
              color: '#34d399', 
              fontSize: '0.75rem', 
              fontWeight: '700' 
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              Hệ Thống Hoạt Động
            </div>

            {/* Sáng / Tối Switch */}
            <div style={{ 
              display: 'flex', 
              background: isDark ? '#111827' : '#f1f5f9', 
              border: `1px solid ${themeColors.border}`, 
              borderRadius: '6px', 
              padding: '2px' 
            }}>
              <button 
                onClick={() => setAdminTheme('light')}
                style={{
                  background: !isDark ? '#ffffff' : 'transparent',
                  color: !isDark ? '#0f172a' : '#64748b',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sun size={12} /> Sáng
              </button>
              <button 
                onClick={() => setAdminTheme('dark')}
                style={{
                  background: isDark ? '#1e293b' : 'transparent',
                  color: isDark ? '#f8fafc' : '#64748b',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Moon size={12} /> Tối
              </button>
            </div>

            {/* Quick Action: Export / Save */}
            <button
              onClick={() => onNavigate && onNavigate('home')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                border: `1px solid ${themeColors.border}`,
                color: themeColors.textMain,
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={13} /> Thư Viện Web
            </button>
          </div>
        </header>

        {/* Body Main Area */}
        <main style={{ flex: 1, padding: '24px 32px 60px', width: '100%', boxSizing: 'border-box' }}>
          
          {/* ================= 3. BROADCAST BANNER (SHOWN IN OVERVIEW & POPUP CONSOLE) ================= */}
          {(activeMenu === 'overview' || activeMenu === 'popup') && (
            <div style={{
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              border: isDark ? '1px solid #1e3a8a' : '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '20px 24px',
              marginBottom: '24px',
              boxShadow: isDark ? '0 4px 20px -2px rgba(0,0,0,0.4)' : 'var(--shadow-card)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Radio size={18} color="#1d4ed8" />
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: isDark ? '#93c5fd' : '#1e3a8a', letterSpacing: '-0.01em' }}>
                    Trung Tâm Phát Sóng Thông Báo &amp; Tin Tức Toàn Hệ Thống
                  </span>
                </div>
                <span style={{ 
                  fontSize: '0.675rem', 
                  fontWeight: '700', 
                  backgroundColor: isDark ? '#1e293b' : '#eff6ff', 
                  color: '#1d4ed8', 
                  border: isDark ? '1px solid #334155' : '1px solid #bfdbfe',
                  padding: '2px 8px', 
                  borderRadius: '4px' 
                }}>
                  ID Bản: #1792776375
                </span>
              </div>

              <p style={{ fontSize: '0.785rem', color: themeColors.textMuted, margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Khi kích hoạt <strong style={{ color: '#1d4ed8' }}>"Phát Sóng Thông Báo Đến Toàn Hệ Thống"</strong>, máy chủ phát bản tin khẩn cấp/hoạt động tới toàn bộ phiên làm việc của bạn đọc kèm thông báo âm thanh.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <button
                  onClick={handleBroadcast}
                  style={{
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                    border: '1px solid #2563eb',
                    color: '#ffffff',
                    padding: '9px 20px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 10px rgba(29, 78, 216, 0.35)'
                  }}
                >
                  <Send size={14} /> Phát Sóng Thông Báo Đến Toàn Hệ Thống
                </button>

                <button
                  onClick={() => setActiveMenu('popup')}
                  style={{
                    background: isDark ? '#1e293b' : '#f8fafc',
                    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                    color: isDark ? '#f8fafc' : '#0f172a',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sliders size={14} color="#1d4ed8" /> Quản Lý &amp; Cấu Hình Bản Tin
                </button>

                <button
                  onClick={() => setPreviewModalOpen(true)}
                  style={{
                    background: isDark ? 'rgba(29, 78, 216, 0.15)' : '#eff6ff',
                    border: '1px solid rgba(29, 78, 216, 0.3)',
                    color: '#1d4ed8',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Eye size={14} /> Xem Trước Giao Diện Độc Giả
                </button>

                <span style={{ fontSize: '0.725rem', color: themeColors.textMuted }}>
                  Lần phát gần nhất: <span style={{ color: themeColors.textMain, fontWeight: '700' }}>{lastBroadcastTime}</span>
                </span>

                {broadcastSuccess && (
                  <span style={{ fontSize: '0.725rem', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Đã phát sóng thông báo đến tất cả độc giả trực tuyến!
                  </span>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap', 
                gap: '14px',
                paddingTop: '12px',
                borderTop: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9',
                fontSize: '0.75rem',
                color: themeColors.textMain
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                    <input 
                      type="checkbox" 
                      checked={enableBannerButton} 
                      onChange={e => handleToggleBannerButton(e.target.checked)} 
                      style={{ accentColor: '#1d4ed8' }}
                    />
                    BẬT NÚT "BẢN TIN" TRONG MENU CHỨC NĂNG THƯ VIỆN
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}>
                    <input 
                      type="checkbox" 
                      checked={enablePopup} 
                      onChange={e => handleTogglePopup(e.target.checked)} 
                      style={{ accentColor: '#1d4ed8' }}
                    />
                    TỰ ĐỘNG BUNG POPUP KHI VÀO THƯ VIỆN (TẮT SẼ KHÔNG LẶP LẠI)
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.725rem', fontWeight: '700' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  Đồng bộ tức thì từ xa đến Độc giả
                </div>
              </div>
            </div>
          )}

          {/* ================= 4. SECTION ROUTING ================= */}
          
          {/* SECTION: OVERVIEW (CRM DUAL WAVE CHART + TOP METRICS) */}
          {activeMenu === 'overview' && (
            <div>
              {/* Header Title & Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: '900', color: themeColors.textMain, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                    📊 Trung Tâm Thống Kê &amp; Báo Cáo Điều Hành
                  </h1>
                  <p style={{ color: themeColors.textMuted, fontSize: '0.8rem', margin: 0 }}>
                    Theo dõi lưu lượng mượn trả, doanh thu tiền phạt/thuê, và năng lực phục vụ độc giả
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', background: themeColors.bgCardSecondary, border: `1px solid ${themeColors.border}`, borderRadius: '6px', padding: '2px' }}>
                    {['7d', '30d', '90d'].map(f => (
                      <button
                        key={f}
                        onClick={() => setTimeFilter(f)}
                        style={{
                          background: timeFilter === f ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
                          color: timeFilter === f ? '#1d4ed8' : themeColors.textMuted,
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {f === '7d' ? '7 ngày' : f === '30d' ? '30 ngày' : 'Quý'}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleExportReport}
                    style={{
                      background: themeColors.bgCardSecondary,
                      border: `1px solid ${themeColors.border}`,
                      color: themeColors.textMain,
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={14} /> Xuất Báo Cáo
                  </button>

                  <button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    style={{
                      background: '#1d4ed8',
                      border: '1px solid #1e40af',
                      color: '#ffffff',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                    Làm Mới
                  </button>
                </div>
              </div>

              {/* Top 4 KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                
                {/* Card 1: Loan Duration */}
                <div style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  color: '#ffffff',
                  boxShadow: '0 8px 20px -4px rgba(29, 78, 216, 0.35)'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.9, letterSpacing: '0.5px', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Thời Gian Mượn Trung Bình
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: 1 }}>14</span>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: '700' }}>ngày</span>
                    <span style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: 1, marginLeft: '6px' }}>00</span>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: '700' }}>giờ</span>
                  </div>
                  <div style={{ fontSize: '0.725rem', marginTop: '8px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={13} /> +15% so với tháng trước
                  </div>
                </div>

                {/* Card 2: On-time Return Rate */}
                <div style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  color: '#ffffff',
                  boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.35)'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.9, letterSpacing: '0.5px', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Tỷ Lệ Trả Đúng Hạn
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: 1 }}>96</span>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: '700' }}>%</span>
                    <span style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: 1, marginLeft: '6px' }}>40</span>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: '700' }}>điểm</span>
                  </div>
                  <div style={{ fontSize: '0.725rem', marginTop: '8px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> Tuân thủ quy chế mượn tốt
                  </div>
                </div>

                {/* Card 3: Revenue */}
                <div style={{
                  backgroundColor: themeColors.bgCard,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: themeColors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Doanh Thu Phí Thuê &amp; Phạt
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981', lineHeight: 1.1 }}>
                    {((stats?.totalRevenue || 120000)).toLocaleString('vi-VN')} <span style={{ fontSize: '0.9rem' }}>VNĐ</span>
                  </div>
                  <div style={{ fontSize: '0.725rem', marginTop: '10px', color: themeColors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CreditCard size={13} color="#10b981" /> VNPay &amp; SePay VietQR Sandbox
                  </div>
                </div>

                {/* Card 4: Inventory */}
                <div style={{
                  backgroundColor: themeColors.bgCard,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '12px',
                  padding: '20px'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: themeColors.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Tổng Kho Giáo Trình &amp; Độc Giả
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
                    <div>
                      <span style={{ fontSize: '1.8rem', fontWeight: '900', color: themeColors.textMain }}>{stats?.totalBooks || 100}</span>
                      <span style={{ fontSize: '0.75rem', color: themeColors.textMuted, marginLeft: '4px' }}>Sách</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#3b82f6' }}>{stats?.totalReaders || 12}</span>
                      <span style={{ fontSize: '0.75rem', color: themeColors.textMuted, marginLeft: '4px' }}>Độc giả</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.725rem', marginTop: '10px', color: themeColors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Database size={13} color="#3b82f6" /> 7 chuyên mục phân loại
                  </div>
                </div>

              </div>

              {/* Central Dual Wave Chart & Weekday Bars */}
              <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                
                {/* Dual Wave SVG Chart */}
                <div style={{
                  backgroundColor: themeColors.bgCard,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: themeColors.textMain, margin: '0 0 2px 0' }}>
                        Biểu Đồ Tần Suất Mượn &amp; Trả Sách (Spline Wave)
                      </h3>
                      <p style={{ fontSize: '0.725rem', color: themeColors.textMuted, margin: 0 }}>
                        Đỉnh điểm phục vụ (Max = 88 lượt) rơi vào tháng 5 trong kỳ thi học kỳ
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', fontSize: '0.725rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1d4ed8', fontWeight: '700' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1d4ed8' }} /> Phiếu Mượn Mới
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontWeight: '700' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} /> Đã Hoàn Trả
                      </span>
                    </div>
                  </div>

                  {/* SVG Canvas */}
                  <div style={{ width: '100%', height: '230px', position: 'relative' }}>
                    <svg viewBox="0 0 700 230" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="waveOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="waveBlueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      {[40, 90, 140, 190].map((y, idx) => (
                        <line key={idx} x1="30" y1={y} x2="680" y2={y} stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeDasharray="4 4" strokeWidth="1" />
                      ))}

                      {/* Blue Wave (Returned) */}
                      <path
                        d="M 50 160 C 120 180, 160 120, 220 130 C 280 140, 320 100, 380 95 C 440 90, 480 130, 540 140 C 600 150, 640 120, 670 110 L 670 200 L 50 200 Z"
                        fill="url(#waveBlueGrad)"
                      />
                      <path
                        d="M 50 160 C 120 180, 160 120, 220 130 C 280 140, 320 100, 380 95 C 440 90, 480 130, 540 140 C 600 150, 640 120, 670 110"
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Orange Wave (Borrowed - Peak 88) */}
                      <path
                        d="M 50 140 C 110 120, 150 150, 210 110 C 270 70, 310 130, 370 50 C 430 -20, 470 110, 530 100 C 590 90, 630 60, 670 80 L 670 200 L 50 200 Z"
                        fill="url(#waveOrangeGrad)"
                      />
                      <path
                        d="M 50 140 C 110 120, 150 150, 210 110 C 270 70, 310 130, 370 50 C 430 -20, 470 110, 530 100 C 590 90, 630 60, 670 80"
                        fill="none"
                        stroke="#1d4ed8"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Peak Marker Dot */}
                      <circle cx="410" cy="42" r="6" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2.5" />
                      <rect x="375" y="10" width="70" height="22" rx="6" fill="#0f172a" />
                      <text x="410" y="25" fill="#f8fafc" fontSize="10" fontWeight="800" textAnchor="middle">Max = 88</text>

                      {/* Month labels */}
                      {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'].map((m, i) => (
                        <text key={i} x={50 + i * 55} y="218" fill={themeColors.textMuted} fontSize="11" fontWeight="600" textAnchor="middle">
                          {m}
                        </text>
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Weekday Vertical Bars */}
                <div style={{
                  backgroundColor: themeColors.bgCard,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: themeColors.textMain, margin: '0 0 4px 0' }}>
                    Phân Bổ Trong Tuần
                  </h3>
                  <p style={{ fontSize: '0.725rem', color: themeColors.textMuted, margin: '0 0 16px 0' }}>
                    Lượng bạn đọc đến quầy (Thứ 2 - CN)
                  </p>

                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '170px', paddingBottom: '10px' }}>
                    {[
                      { day: 'T2', val: 78, color: '#1d4ed8' },
                      { day: 'T3', val: 92, color: '#2563eb' },
                      { day: 'T4', val: 65, color: '#38bdf8' },
                      { day: 'T5', val: 88, color: '#1d4ed8' },
                      { day: 'T6', val: 95, color: '#1e40af' },
                      { day: 'T7', val: 45, color: '#64748b' },
                      { day: 'CN', val: 30, color: '#94a3b8' }
                    ].map((d, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: themeColors.textMuted }}>{d.val}</span>
                        <div style={{
                          width: '18px',
                          height: `${(d.val / 100) * 120}px`,
                          backgroundColor: d.color,
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease'
                        }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: themeColors.textMain }}>{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Donut Charts & Category Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
                
                {/* Return Rate Ring */}
                <div style={{
                  backgroundColor: themeColors.bgCard,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: themeColors.textMain, margin: '0 0 16px 0' }}>
                    Tỷ Lệ Hoàn Trả Đúng Hạn
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="3.8" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1d4ed8" strokeWidth="3.8" strokeDasharray="96, 100" />
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: themeColors.textMain }}>96.4%</div>
                        <div style={{ fontSize: '0.625rem', color: themeColors.textMuted }}>ĐÚNG HẠN</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1d4ed8' }} />
                        <span style={{ color: themeColors.textMain, fontWeight: '700' }}>Trả đúng hạn: 96.4%</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }} />
                        <span style={{ color: themeColors.textMain, fontWeight: '700' }}>Trễ hạn / Phạt: 3.6%</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ color: themeColors.textMain, fontWeight: '700' }}>Hư hỏng: 0.0%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Breakdown (Real Data Computed from Categories / Books) */}
                <div style={{
                  backgroundColor: themeColors.bgCard,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: themeColors.textMain, margin: '0 0 16px 0' }}>
                    Phân Bổ Đầu Sách Theo Chuyên Đề Học Thuật Thực Tế
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(() => {
                      const palette = ['#1d4ed8', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];
                      const totalBookCount = books.length || stats?.totalBooks || 100;
                      const computedCats = categories.length > 0
                        ? categories.map((cat, idx) => {
                            const countFromBooks = books.filter(b => String(b.category?.id) === String(cat.id)).length;
                            const count = countFromBooks || cat.bookCount || 0;
                            const pct = Math.min(100, Math.round((count / Math.max(1, totalBookCount)) * 100));
                            return {
                              name: cat.name,
                              count,
                              pct,
                              color: palette[idx % palette.length]
                            };
                          })
                        : [
                            { name: 'Công nghệ & Lập trình J2EE', count: 20, pct: 20, color: '#1d4ed8' },
                            { name: 'Trí Tuệ Nhân Tạo & Khoa Học Dữ Liệu', count: 15, pct: 15, color: '#3b82f6' },
                            { name: 'Kinh Tế, Quản Trị & Tài Chính', count: 14, pct: 14, color: '#10b981' },
                            { name: 'Kỹ Năng Mềm & Lãnh Đạo', count: 14, pct: 14, color: '#8b5cf6' },
                            { name: 'Khoa Học Tự Nhiên & Kỹ Thuật', count: 14, pct: 14, color: '#f59e0b' }
                          ];
                      return computedCats.map((cat, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                            <span style={{ color: themeColors.textMain, fontWeight: '600' }}>{cat.name}</span>
                            <span style={{ color: themeColors.textMuted, fontWeight: '700' }}>{cat.count} sách ({cat.pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: isDark ? '#1e293b' : '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${cat.pct}%`, height: '100%', background: cat.color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

              </div>

              {/* Real Recent Payments & Transactions Table */}
              <div style={{
                marginTop: '20px',
                backgroundColor: themeColors.bgCard,
                border: `1px solid ${themeColors.border}`,
                borderRadius: '12px',
                padding: '20px 24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: themeColors.textMain, margin: '0 0 2px 0' }}>
                      💳 Lịch Sử Giao Dịch Thanh Toán Gần Đây (VNPay &amp; SePay VietQR)
                    </h3>
                    <p style={{ fontSize: '0.725rem', color: themeColors.textMuted, margin: 0 }}>
                      Dữ liệu đối soát thời gian thực từ cổng thanh toán trực tuyến ({payments.length} giao dịch)
                    </p>
                  </div>
                  <span className="badge badge-success">ĐỐI SOÁT TỰ ĐỘNG</span>
                </div>

                {payments.length === 0 ? (
                  <div style={{ fontSize: '0.825rem', color: themeColors.textMuted, padding: '16px 0' }}>
                    Chưa có giao dịch phát sinh mới.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="enterprise-table">
                      <thead>
                        <tr>
                          <th>Mã Giao Dịch</th>
                          <th>Độc Giả</th>
                          <th>Nội Dung</th>
                          <th>Phương Thức</th>
                          <th>Số Tiền</th>
                          <th>Thời Gian</th>
                          <th>Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.slice(0, 6).map((pm) => (
                          <tr key={pm.id}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#1d4ed8', fontSize: '0.78rem' }}>
                              {pm.transactionId || `TXN-${pm.id}`}
                            </td>
                            <td>
                              <div style={{ fontWeight: '700', color: themeColors.textMain }}>{pm.user?.fullName || 'Độc giả'}</div>
                              <div style={{ fontSize: '0.7rem', color: themeColors.textMuted }}>{pm.user?.email}</div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: themeColors.textMain }}>{pm.orderInfo || 'Thanh toán phí thư viện'}</td>
                            <td>
                              <span className="badge badge-info">{pm.paymentMethod || 'SEPAY_VIETQR'}</span>
                            </td>
                            <td style={{ fontWeight: '800', color: '#10b981' }}>
                              {(pm.amount || 0).toLocaleString('vi-VN')} đ
                            </td>
                            <td style={{ fontSize: '0.75rem', color: themeColors.textMuted }}>{pm.paymentDate || 'Hôm nay'}</td>
                            <td>
                              <span className={`badge ${pm.status === 'SUCCESS' ? 'badge-success' : 'badge-warning'}`}>
                                {pm.status || 'SUCCESS'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION: SERVER & DB MONITOR */}
          {activeMenu === 'server' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '1.45rem', fontWeight: '900', color: themeColors.textMain, margin: '0 0 4px 0' }}>
                  🖥️ Giám Sát Máy Chủ &amp; Cơ Sở Dữ Liệu
                </h1>
                <p style={{ color: themeColors.textMuted, fontSize: '0.8rem', margin: 0 }}>
                  Trạng thái Spring Boot 3.3.4, GraphQL Engine, HikariCP Pool và Latency kết nối CSDL
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                
                <div style={{ backgroundColor: themeColors.bgCard, border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Cpu color="#10b981" size={20} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: themeColors.textMain }}>Spring Boot 3.3.4</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981' }}>ONLINE :8080</div>
                  <div style={{ fontSize: '0.75rem', color: themeColors.textMuted, marginTop: '6px' }}>JVM 21 • Hot-reload Active</div>
                </div>

                <div style={{ backgroundColor: themeColors.bgCard, border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Database color="#3b82f6" size={20} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: themeColors.textMain }}>HikariCP Pool</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#3b82f6' }}>10 Max / 5 Idle</div>
                  <div style={{ fontSize: '0.75rem', color: themeColors.textMuted, marginTop: '6px' }}>Connection Timeout: 30000ms</div>
                </div>

                <div style={{ backgroundColor: themeColors.bgCard, border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Wifi color="#1d4ed8" size={20} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: themeColors.textMain }}>Độ Trễ Phản Hồi (Ping)</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1d4ed8' }}>12 ms</div>
                  <div style={{ fontSize: '0.75rem', color: themeColors.textMuted, marginTop: '6px' }}>GraphQL Endpoint: /graphql</div>
                </div>

              </div>
            </div>
          )}

          {/* SECTION: DATA MANAGEMENT (BOOKS, BORROWS, PAYMENTS, USERS) */}
          {activeMenu === 'books' && <BookManagementView />}
          {activeMenu === 'borrows' && <BorrowManagementView />}
          {activeMenu === 'users' && <UserManagementView />}

          {activeMenu === 'payments' && (() => {
            const normalizedSearch = paymentSearch.trim().toLowerCase();
            const filteredPayments = (payments || []).filter((p) => {
              const matchStatus = paymentStatusFilter === 'ALL' || p.status === paymentStatusFilter;
              const matchMethod =
                paymentMethodFilter === 'ALL' ||
                (paymentMethodFilter === 'SEPAY' && (p.paymentMethod || '').toUpperCase().includes('SEPAY')) ||
                (paymentMethodFilter === 'VNPAY' && (p.paymentMethod || '').toUpperCase().includes('VNPAY')) ||
                (paymentMethodFilter === 'CASH' && (p.paymentMethod || '').toUpperCase().includes('CASH'));
              const matchKeyword =
                !normalizedSearch ||
                (p.transactionId || '').toLowerCase().includes(normalizedSearch) ||
                (p.orderInfo || '').toLowerCase().includes(normalizedSearch) ||
                (p.user?.fullName || '').toLowerCase().includes(normalizedSearch) ||
                (p.user?.email || '').toLowerCase().includes(normalizedSearch) ||
                (p.borrowRecord?.borrowCode || '').toLowerCase().includes(normalizedSearch) ||
                (p.borrowRecord?.book?.title || '').toLowerCase().includes(normalizedSearch);
              return matchStatus && matchMethod && matchKeyword;
            });

            const totalSuccessAmount = (payments || [])
              .filter((p) => p.status === 'SUCCESS')
              .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const successCount = (payments || []).filter((p) => p.status === 'SUCCESS').length;
            const pendingCount = (payments || []).filter((p) => p.status === 'PENDING').length;
            const sepayCount = (payments || []).filter((p) =>
              (p.paymentMethod || '').toUpperCase().includes('SEPAY')
            ).length;

            const handleExportPaymentsCsv = () => {
              const header = 'Ma_GD,Doc_Gia,Email,Ma_Phieu_Muon,Ten_Sach,So_Tien_VND,Phuong_Thuc,Trang_Thai,Thoi_Gian,Noi_Dung\n';
              const rows = filteredPayments
                .map((p) => {
                  const cols = [
                    p.transactionId || '',
                    p.user?.fullName || '',
                    p.user?.email || '',
                    p.borrowRecord?.borrowCode || '',
                    p.borrowRecord?.book?.title || '',
                    p.amount || 0,
                    p.paymentMethod || '',
                    p.status || '',
                    p.paymentDate || '',
                    (p.orderInfo || '').replace(/,/g, ';'),
                  ];
                  return cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
                })
                .join('\n');
              const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `Lich_Su_Thanh_Toan_${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
            };

            return (
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <h1 style={{ fontSize: '1.45rem', fontWeight: '900', color: themeColors.textMain, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CreditCard color="#10b981" size={24} /> Lịch Sử Thanh Toán &amp; Đối Soát Hóa Đơn
                    </h1>
                    <p style={{ color: themeColors.textMuted, fontSize: '0.82rem', margin: 0 }}>
                      Quản lý toàn bộ giao dịch thu phí mượn sách, tiền phạt quá hạn qua cổng SePay VietQR tự động và VNPay.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      style={{
                        background: isDark ? '#1e293b' : '#f1f5f9',
                        border: `1px solid ${themeColors.border}`,
                        color: themeColors.textMain,
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Làm mới
                    </button>

                    <button
                      type="button"
                      onClick={handleExportPaymentsCsv}
                      style={{
                        background: '#059669',
                        border: 'none',
                        color: '#ffffff',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Download size={14} /> Xuất CSV Đối Soát
                    </button>
                  </div>
                </div>

                {/* KPI Summary Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ backgroundColor: themeColors.bgCard, border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '18px 20px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: themeColors.textMuted, marginBottom: '6px' }}>TỔNG DOANH THU THÀNH CÔNG</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#10b981' }}>{totalSuccessAmount.toLocaleString('vi-VN')} VNĐ</div>
                    <div style={{ fontSize: '0.73rem', color: themeColors.textMuted, marginTop: '4px' }}>Đã xác thực tự động qua Webhook</div>
                  </div>

                  <div style={{ backgroundColor: themeColors.bgCard, border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '18px 20px', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: themeColors.textMuted, marginBottom: '6px' }}>GIAO DỊCH THÀNH CÔNG</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#3b82f6' }}>{successCount} / {(payments || []).length} đơn</div>
                    <div style={{ fontSize: '0.73rem', color: themeColors.textMuted, marginTop: '4px' }}>Tỷ lệ hoàn tất: {(payments || []).length ? Math.round((successCount / payments.length) * 100) : 0}%</div>
                  </div>

                  <div style={{ backgroundColor: themeColors.bgCard, border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '18px 20px', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: themeColors.textMuted, marginBottom: '6px' }}>ĐANG CHỜ THANH TOÁN (PENDING)</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#f59e0b' }}>{pendingCount} giao dịch</div>
                    <div style={{ fontSize: '0.73rem', color: themeColors.textMuted, marginTop: '4px' }}>Đang chờ quét mã QR ngân hàng</div>
                  </div>

                  <div style={{ backgroundColor: themeColors.bgCard, border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '18px 20px', borderLeft: '4px solid #8b5cf6' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: themeColors.textMuted, marginBottom: '6px' }}>CỔNG SEPAY VIETQR &amp; VNPAY</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#8b5cf6' }}>{sepayCount} QR • {(payments || []).length - sepayCount} Khác</div>
                    <div style={{ fontSize: '0.73rem', color: themeColors.textMuted, marginTop: '4px' }}>TPBank 49431072004 (LE HOAI LOC)</div>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div style={{ backgroundColor: themeColors.bgCard, border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '18px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ position: 'relative', flex: '1 1 280px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: themeColors.textMuted }} />
                    <input
                      type="text"
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      placeholder="Tìm theo mã giao dịch (SEPAY...), mã đơn LIB, tên độc giả, email, tên sách..."
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '9px 12px 9px 36px',
                        borderRadius: '8px',
                        border: `1px solid ${themeColors.border}`,
                        backgroundColor: isDark ? '#0b0f19' : '#f8fafc',
                        color: themeColors.textMain,
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${themeColors.border}`,
                        backgroundColor: isDark ? '#0b0f19' : '#f8fafc',
                        color: themeColors.textMain,
                        fontSize: '0.8rem',
                        fontWeight: '700',
                      }}
                    >
                      <option value="ALL">Tất cả trạng thái ({(payments || []).length})</option>
                      <option value="SUCCESS">Đã thanh toán (SUCCESS)</option>
                      <option value="PENDING">Chờ thanh toán (PENDING)</option>
                      <option value="FAILED">Thất bại / Đã hủy (FAILED)</option>
                    </select>

                    <select
                      value={paymentMethodFilter}
                      onChange={(e) => setPaymentMethodFilter(e.target.value)}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${themeColors.border}`,
                        backgroundColor: isDark ? '#0b0f19' : '#f8fafc',
                        color: themeColors.textMain,
                        fontSize: '0.8rem',
                        fontWeight: '700',
                      }}
                    >
                      <option value="ALL">Mọi phương thức</option>
                      <option value="SEPAY">SePay VietQR</option>
                      <option value="VNPAY">VNPay Sandbox/Gateway</option>
                      <option value="CASH">Tiền mặt tại quầy</option>
                    </select>
                  </div>
                </div>

                {/* Transactions Table */}
                <div style={{ backgroundColor: themeColors.bgCard, border: `1px solid ${themeColors.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: isDark ? '#111827' : '#f8fafc', borderBottom: `1px solid ${themeColors.border}`, textAlign: 'left' }}>
                          <th style={{ padding: '12px 16px', color: themeColors.textMuted, fontWeight: '800' }}>MÃ GIAO DỊCH</th>
                          <th style={{ padding: '12px 16px', color: themeColors.textMuted, fontWeight: '800' }}>ĐỘC GIẢ</th>
                          <th style={{ padding: '12px 16px', color: themeColors.textMuted, fontWeight: '800' }}>PHIẾU MƯỢN / NỘI DUNG</th>
                          <th style={{ padding: '12px 16px', color: themeColors.textMuted, fontWeight: '800' }}>SỐ TIỀN</th>
                          <th style={{ padding: '12px 16px', color: themeColors.textMuted, fontWeight: '800' }}>CỔNG TT</th>
                          <th style={{ padding: '12px 16px', color: themeColors.textMuted, fontWeight: '800' }}>THỜI GIAN</th>
                          <th style={{ padding: '12px 16px', color: themeColors.textMuted, fontWeight: '800' }}>TRẠNG THÁI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: '36px 20px', textAlign: 'center', color: themeColors.textMuted }}>
                              Không tìm thấy giao dịch thanh toán nào khớp với bộ lọc hiện tại.
                            </td>
                          </tr>
                        ) : (
                          filteredPayments.map((p) => {
                            const isSuccess = p.status === 'SUCCESS';
                            const isPending = p.status === 'PENDING';
                            return (
                              <tr key={p.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                                <td style={{ padding: '13px 16px', fontWeight: '800', color: themeColors.textMain, fontFamily: 'monospace' }}>
                                  {p.transactionId || `#PAY-${p.id}`}
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                  <div style={{ fontWeight: '700', color: themeColors.textMain }}>{p.user?.fullName || 'Độc giả'}</div>
                                  <div style={{ fontSize: '0.73rem', color: themeColors.textMuted }}>{p.user?.email || ''}</div>
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                  {p.borrowRecord?.borrowCode && (
                                    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: '4px', backgroundColor: isDark ? '#1e293b' : '#eff6ff', color: '#2563eb', fontWeight: '800', fontSize: '0.72rem', marginRight: '6px' }}>
                                      #{p.borrowRecord.borrowCode}
                                    </span>
                                  )}
                                  <span style={{ color: themeColors.textMain, fontWeight: '600' }}>
                                    {p.borrowRecord?.book?.title || p.orderInfo || 'Thanh toán phí thư viện'}
                                  </span>
                                  {p.orderInfo && p.borrowRecord?.book?.title && (
                                    <div style={{ fontSize: '0.72rem', color: themeColors.textMuted, marginTop: '2px' }}>{p.orderInfo}</div>
                                  )}
                                </td>
                                <td style={{ padding: '13px 16px', fontWeight: '900', color: isSuccess ? '#10b981' : themeColors.textMain }}>
                                  {(Number(p.amount) || 0).toLocaleString('vi-VN')} đ
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: themeColors.textMain }}>
                                    {p.paymentMethod || 'SEPAY_QR'}
                                  </span>
                                </td>
                                <td style={{ padding: '13px 16px', color: themeColors.textMuted, fontSize: '0.76rem' }}>
                                  {p.paymentDate ? new Date(p.paymentDate).toLocaleString('vi-VN') : '—'}
                                </td>
                                <td style={{ padding: '13px 16px' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '4px 10px',
                                      borderRadius: '20px',
                                      fontSize: '0.72rem',
                                      fontWeight: '800',
                                      backgroundColor: isSuccess ? '#ecfdf5' : isPending ? '#fffbeb' : '#fef2f2',
                                      color: isSuccess ? '#059669' : isPending ? '#d97706' : '#dc2626',
                                      border: `1px solid ${isSuccess ? '#a7f3d0' : isPending ? '#fde68a' : '#fecaca'}`,
                                    }}
                                  >
                                    {isSuccess ? '✓ Đã thanh toán' : isPending ? '⏳ Chờ thanh toán' : '✕ Thất bại'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SECTION: POPUP & BULLETIN MANAGEMENT (QUẢN LÝ POPUP & BẢN TIN) */}
          {activeMenu === 'popup' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: '900', color: themeColors.textMain, margin: '0 0 4px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell color="#1d4ed8" size={24} /> Quản Lý Bản Tin &amp; Cửa Sổ Popup Độc Giả
                  </h1>
                  <p style={{ color: themeColors.textMuted, fontSize: '0.8rem', margin: 0 }}>
                    Tùy chỉnh thông báo nổi bật (Modal Popup) tự động hiện khi độc giả vào thư viện, nội dung bản tin, banner ảnh và nút Bản Tin trên thanh menu.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => setPreviewModalOpen(true)}
                    style={{
                      background: 'rgba(29, 78, 216, 0.1)',
                      border: '1px solid rgba(29, 78, 216, 0.3)',
                      color: '#1d4ed8',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Eye size={15} /> Xem Thử Popup (Toàn Màn Hình)
                  </button>

                  <button
                    onClick={() => handleSavePopupSettings()}
                    disabled={popupSaving}
                    style={{
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                      border: '1px solid #2563eb',
                      color: '#ffffff',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 10px rgba(29, 78, 216, 0.35)'
                    }}
                  >
                    {popupSaving ? <RefreshCw className="animate-spin" size={15} /> : <Check size={15} />}
                    {popupSaving ? 'Đang Lưu...' : 'Lưu & Phát Sóng Cấu Hình'}
                  </button>
                </div>
              </div>

              {popupSaveSuccess && (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.825rem',
                  fontWeight: '700'
                }}>
                  <CheckCircle2 size={16} /> Đã lưu và đồng bộ cấu hình Popup &amp; Bản Tin lên hệ thống thành công!
                </div>
              )}

              {/* 2-Column Responsive Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', alignItems: 'start' }}>
                
                {/* Column 1: Configuration Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Card: Display Toggles */}
                  <div style={{ backgroundColor: themeColors.bgCard, border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: themeColors.textMain, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sliders size={16} color="#1d4ed8" /> 1. Cơ Chế Hiển Thị Độc Giả
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Toggle 1: Auto Popup */}
                      <label style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: isDark ? '#111827' : '#f8fafc',
                        border: `1px solid ${themeColors.border}`,
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={popupSettings.popupEnabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setPopupSettings(prev => ({ ...prev, popupEnabled: val }));
                            handleTogglePopup(val);
                          }}
                          style={{ accentColor: '#1d4ed8', width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: '800', color: themeColors.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Tự động bung Popup khi vào Thư Viện
                            <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: popupSettings.popupEnabled ? '#064e3b' : '#334155', color: popupSettings.popupEnabled ? '#34d399' : '#94a3b8' }}>
                              {popupSettings.popupEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: themeColors.textMuted, marginTop: '3px', lineHeight: 1.4 }}>
                            Độc giả truy cập trang chủ lần đầu sẽ thấy Popup thông báo. Nếu độc giả tích "Không hiển thị lại hôm nay", Popup sẽ tạm ẩn 24 giờ.
                          </div>
                        </div>
                      </label>

                      {/* Toggle 2: Navbar Button */}
                      <label style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: isDark ? '#111827' : '#f8fafc',
                        border: `1px solid ${themeColors.border}`,
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={popupSettings.popupNavButtonEnabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setPopupSettings(prev => ({ ...prev, popupNavButtonEnabled: val }));
                            handleToggleBannerButton(val);
                          }}
                          style={{ accentColor: '#1d4ed8', width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: '800', color: themeColors.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Hiển thị nút "📢 Bản Tin" trên thanh Menu Navbar
                            <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: popupSettings.popupNavButtonEnabled ? '#064e3b' : '#334155', color: popupSettings.popupNavButtonEnabled ? '#34d399' : '#94a3b8' }}>
                              {popupSettings.popupNavButtonEnabled ? 'ĐANG HIỆN' : 'ĐANG ẨN'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: themeColors.textMuted, marginTop: '3px', lineHeight: 1.4 }}>
                            Nút nằm cạnh ô tìm kiếm và Trợ lý AI trên thanh Menu chính, giúp độc giả xem lại thông báo bất kỳ lúc nào.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Card: Content Editor */}
                  <div style={{ backgroundColor: themeColors.bgCard, border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: themeColors.textMain, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="#1d4ed8" /> 2. Soạn Thảo Nội Dung Bản Tin &amp; Popup
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Tiêu đề */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: '700', color: themeColors.textMain, marginBottom: '6px' }}>
                          Tiêu Đề Bản Tin Thông Báo:
                        </label>
                        <input
                          type="text"
                          value={popupSettings.popupTitle}
                          onChange={(e) => setPopupSettings(prev => ({ ...prev, popupTitle: e.target.value }))}
                          placeholder="Ví dụ: Thông Báo: Khai Trương Kho Sách Số & Tuần Lễ Văn Hóa Đọc 2026"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? '#090d16' : '#ffffff',
                            border: `1px solid ${themeColors.border}`,
                            color: themeColors.textMain,
                            fontSize: '0.825rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* Huy hiệu Badge */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: '700', color: themeColors.textMain, marginBottom: '6px' }}>
                          Huy Hiệu Tag Góc Trái (Badge):
                        </label>
                        <input
                          type="text"
                          value={popupSettings.popupBadgeText}
                          onChange={(e) => setPopupSettings(prev => ({ ...prev, popupBadgeText: e.target.value }))}
                          placeholder="Ví dụ: HOT • BẢN TIN SỐ #1792776375 hoặc SỰ KIỆN NỔI BẬT"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? '#090d16' : '#ffffff',
                            border: `1px solid ${themeColors.border}`,
                            color: themeColors.textMain,
                            fontSize: '0.825rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* Banner Image URL */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: '700', color: themeColors.textMain, marginBottom: '6px' }}>
                          Đường Dẫn Ảnh Banner (URL):
                        </label>
                        <input
                          type="text"
                          value={popupSettings.popupBannerUrl}
                          onChange={(e) => setPopupSettings(prev => ({ ...prev, popupBannerUrl: e.target.value }))}
                          placeholder="https://images.unsplash.com/..."
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? '#090d16' : '#ffffff',
                            border: `1px solid ${themeColors.border}`,
                            color: themeColors.textMain,
                            fontSize: '0.825rem',
                            outline: 'none',
                            marginBottom: '8px'
                          }}
                        />

                        {/* Quick Presets */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', color: themeColors.textMuted, fontWeight: '700' }}>Chọn nhanh ảnh mẫu:</span>
                          {[
                            { label: '🏛️ Thư Viện Hiện Đại', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1000' },
                            { label: '📚 Mùa Thi & Giáo Trình', url: 'https://images.unsplash.com/photo-1507842229450-782123c4dcb7?w=1000' },
                            { label: '🤖 AI & Công Nghệ Số', url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1000' },
                            { label: '🎓 Không Gian Đọc', url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1000' }
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPopupSettings(prev => ({ ...prev, popupBannerUrl: preset.url }))}
                              style={{
                                background: popupSettings.popupBannerUrl === preset.url ? '#1d4ed8' : (isDark ? '#1e293b' : '#f1f5f9'),
                                color: popupSettings.popupBannerUrl === preset.url ? '#ffffff' : themeColors.textMain,
                                border: `1px solid ${popupSettings.popupBannerUrl === preset.url ? '#1d4ed8' : themeColors.border}`,
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Nội Dung Bản Tin */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: '700', color: themeColors.textMain, marginBottom: '6px' }}>
                          Nội Dung Chi Tiết Bản Tin:
                        </label>
                        <textarea
                          rows={4}
                          value={popupSettings.popupContent}
                          onChange={(e) => setPopupSettings(prev => ({ ...prev, popupContent: e.target.value }))}
                          placeholder="Nhập thông báo gửi tới toàn thể học sinh, sinh viên và giảng viên..."
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? '#090d16' : '#ffffff',
                            border: `1px solid ${themeColors.border}`,
                            color: themeColors.textMain,
                            fontSize: '0.825rem',
                            lineHeight: 1.5,
                            outline: 'none',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      {/* Nhãn Nút Bấm Hành Động CTA */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: '700', color: themeColors.textMain, marginBottom: '6px' }}>
                          Nhãn Nút Bấm Hành Động (Call-to-Action):
                        </label>
                        <input
                          type="text"
                          value={popupSettings.popupLinkText}
                          onChange={(e) => setPopupSettings(prev => ({ ...prev, popupLinkText: e.target.value }))}
                          placeholder="Ví dụ: Xem Kho Sách & Tra Cứu"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            backgroundColor: isDark ? '#090d16' : '#ffffff',
                            border: `1px solid ${themeColors.border}`,
                            color: themeColors.textMain,
                            fontSize: '0.825rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      {/* Save Action */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleSavePopupSettings()}
                          disabled={popupSaving}
                          style={{
                            flex: 1,
                            backgroundColor: '#1d4ed8',
                            border: 'none',
                            color: '#ffffff',
                            padding: '11px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 8px rgba(29, 78, 216, 0.3)'
                          }}
                        >
                          {popupSaving ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                          Lưu Cấu Hình &amp; Áp Dụng Ngay
                        </button>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Column 2: Live Reader Interactive Screen Preview */}
                <div style={{ backgroundColor: themeColors.bgCard, border: `1px solid ${themeColors.border}`, borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: themeColors.textMain, margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Eye size={16} color="#10b981" /> Mô Phỏng Trực Tiếp Giao Diện Độc Giả
                      </h3>
                      <p style={{ color: themeColors.textMuted, fontSize: '0.725rem', margin: 0 }}>
                        Giao diện hiển thị thời gian thực theo đúng những gì độc giả nhìn thấy trên màn hình
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewModalOpen(true)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${themeColors.border}`,
                        color: themeColors.textMain,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.725rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ExternalLink size={12} /> Mở Toàn Màn Hình
                    </button>
                  </div>

                  {/* Simulated Modal Box */}
                  <div style={{
                    backgroundColor: isDark ? '#0b0f19' : '#e2e8f0',
                    padding: '20px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '100%',
                      maxWidth: '480px',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
                      border: '1px solid #bfdbfe',
                      color: '#0f172a'
                    }}>
                      {/* Banner */}
                      <div style={{ position: 'relative', width: '100%', height: '160px', overflow: 'hidden' }}>
                        <img
                          src={popupSettings.popupBannerUrl}
                          alt="Banner Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1000'; }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.75) 0%, transparent 60%)' }} />
                        
                        <div style={{
                          position: 'absolute',
                          bottom: '12px',
                          left: '14px',
                          background: '#1d4ed8',
                          color: '#ffffff',
                          padding: '3px 10px',
                          borderRadius: '5px',
                          fontSize: '0.675rem',
                          fontWeight: '800',
                          letterSpacing: '0.03em'
                        }}>
                          {popupSettings.popupBadgeText}
                        </div>

                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(255, 255, 255, 0.85)',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#475569',
                          fontSize: '0.75rem',
                          fontWeight: '900'
                        }}>
                          ✕
                        </div>
                      </div>

                      {/* Content Box */}
                      <div style={{ padding: '18px 20px 20px' }}>
                        <h4 style={{
                          fontSize: '1.15rem',
                          fontWeight: '900',
                          color: '#0f172a',
                          margin: '0 0 10px 0',
                          lineHeight: 1.35,
                          letterSpacing: '-0.02em'
                        }}>
                          {popupSettings.popupTitle}
                        </h4>

                        <div style={{
                          fontSize: '0.8rem',
                          color: '#334155',
                          lineHeight: 1.6,
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          marginBottom: '16px',
                          whiteSpace: 'pre-line'
                        }}>
                          {popupSettings.popupContent}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <button
                            type="button"
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              borderRadius: '7px',
                              background: '#1d4ed8',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <BookOpen size={14} /> {popupSettings.popupLinkText}
                          </button>

                          <button
                            type="button"
                            style={{
                              padding: '10px 14px',
                              borderRadius: '7px',
                              background: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            Đã Hiểu
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked={false} style={{ accentColor: '#1d4ed8' }} />
                            Không hiển thị lại hôm nay
                          </label>

                          <span style={{ color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} /> Tin chính thức
                          </span>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', backgroundColor: isDark ? '#111827' : '#f8fafc', border: `1px solid ${themeColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: popupSettings.popupEnabled ? '#10b981' : '#ef4444' }} />
                      <span style={{ color: themeColors.textMain, fontWeight: '700' }}>
                        Trạng thái Popup: {popupSettings.popupEnabled ? 'Đang hoạt động (Kích hoạt)' : 'Tạm dừng hiển thị'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewModalOpen(true)}
                      style={{
                        background: '#1d4ed8',
                        border: 'none',
                        color: '#ffffff',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      Bật Thử Nghiệm Ngay
                    </button>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* SECTION: SYSTEM CONFIGURATIONS (ALL 6 TABS FROM SETTINGS) */}
          {['branding', 'gemini', 'oauth', 'database', 'payment', 'cloudflare'].includes(activeMenu) && (
            <AdminSettingsView 
              activeTab={activeMenu}
              hideHeader={true}
              hideTabBar={true}
              fullWidth={true}
              onThemeChange={onThemeChange}
            />
          )}

        </main>
      </div>

      {/* Full-screen Reader Announcement Modal for Live Testing */}
      <AnnouncementModal 
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        settings={popupSettings}
        onGoCatalog={() => setPreviewModalOpen(false)}
      />

    </div>
  );
}
