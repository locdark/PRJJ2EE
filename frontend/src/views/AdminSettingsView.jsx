import React, { useState, useEffect } from 'react';
import { 
  Settings, Globe, CreditCard, Cloud, Database, Palette, Save, 
  CheckCircle2, AlertCircle, RefreshCw, Server, Shield, Sparkles, 
  QrCode, ExternalLink, HardDrive, Key, Sliders, Check, Eye, EyeOff, Bot, Zap
} from 'lucide-react';
import { getSystemSettings, updateSystemSettings, testDatabase, testCloudflare, testGeminiApi, testOAuth } from '../services/api';

export default function AdminSettingsView({ 
  onThemeChange, 
  activeTab: propActiveTab, 
  onTabChange, 
  hideHeader = false, 
  hideTabBar = false, 
  fullWidth = true 
}) {
  const [internalTab, setInternalTab] = useState('branding');
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = (tab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Diagnostics
  const [dbStatus, setDbStatus] = useState(null);
  const [cfStatus, setCfStatus] = useState(null);
  const [geminiStatus, setGeminiStatus] = useState(null);
  const [googleOAuthStatus, setGoogleOAuthStatus] = useState(null);
  const [fbOAuthStatus, setFbOAuthStatus] = useState(null);
  const [testingDb, setTestingDb] = useState(false);
  const [testingCf, setTestingCf] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingGoogleOAuth, setTestingGoogleOAuth] = useState(false);
  const [testingFbOAuth, setTestingFbOAuth] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showFbSecret, setShowFbSecret] = useState(false);
  const [showDbPassword, setShowDbPassword] = useState(false);

  // Form states
  const [form, setForm] = useState({
    siteTitle: 'SmartLibrary',
    siteSubtitle: 'Hệ Thống Quản Lý Thư Viện Số Thế Hệ Mới',
    logoUrl: '',
    contactEmail: 'support@smartlibrary.edu.vn',
    contactPhone: '1900 6868',
    address: '828 Sư Vạn Hạnh, Phường 13, Quận 10, TP. Hồ Chí Minh',
    openingHours: '07:30 - 21:00 (Thứ 2 - Thứ 7)',
    vnpTmnCode: '2QXUI4B4',
    vnpHashSecret: 'AXYZBOPQRETUVWXKLMN1234567890ABC',
    vnpPayUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    sepayAccountNumber: '0388888888',
    sepayBankCode: 'MBBank',
    sepayAccountName: 'SMART LIBRARY HUFLIT',
    sepayApiKey: 'SEPAY_DEMO_SECRET_API_KEY',
    cloudflareApiKey: 'clf_api_token_live_998124a87c',
    cloudflareZoneId: 'zone_id_smartlibrary_001',
    cloudflareAccountEmail: 'admin@smartlibrary.edu.vn',
    cloudflareProxyEnabled: true,
    lateFinePerDay: 5000,
    defaultBorrowDays: 14,
    maxBorrowLimit: 3,
    moitVerificationEnabled: true,
    themeName: 'emerald-scholar',
    geminiApiKey: '',
    geminiModel: 'gemini-1.5-flash',
    geminiEnabled: true,
    geminiSystemPrompt: 'Bạn là Trợ lý Thủ thư AI thông minh của Thư viện Số SmartLibrary. Hãy tư vấn giáo trình, phương pháp học tập và gợi ý chính xác sách trong thư viện bằng tiếng Việt chuẩn mực, thân thiện.',
    googleClientId: '109827364521-smartlibrary.apps.googleusercontent.com',
    googleClientSecret: 'GOCSPX-demo_google_client_secret_xyz123',
    googleRedirectUri: 'http://localhost:5173/auth/callback/google',
    googleOAuthEnabled: true,
    facebookAppId: '108927164928374',
    facebookAppSecret: 'fb_sec_89283472891238918237',
    facebookRedirectUri: 'http://localhost:5173/auth/callback/facebook',
    facebookOAuthEnabled: true,
    dbType: 'POSTGRESQL',
    dbHost: 'localhost',
    dbPort: '5432',
    dbName: 'smart_library_db',
    dbUsername: 'postgres',
    dbPassword: 'root_password_123',
    dbJdbcUrl: 'jdbc:postgresql://localhost:5432/smart_library_db',
    dbDriverClassName: 'org.postgresql.Driver',
    dbMaxPoolSize: 10,
    dbMinIdle: 5
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      if (data) {
        setForm(prev => ({ ...prev, ...data }));
        if (data.themeName && onThemeChange) {
          onThemeChange(data.themeName);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectTheme = (themeId) => {
    setForm(prev => ({ ...prev, themeName: themeId }));
    if (onThemeChange) {
      onThemeChange(themeId);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await updateSystemSettings(form);
      setSuccessMessage('Cấu hình hệ thống đã được lưu thành công trên Server!');
      setTimeout(() => setSuccessMessage(''), 3500);
      if (onThemeChange) onThemeChange(form.themeName);
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setDbStatus(null);
    try {
      const res = await testDatabase({
        dbType: form.dbType,
        dbHost: form.dbHost,
        dbPort: form.dbPort,
        dbName: form.dbName,
        dbUsername: form.dbUsername,
        dbPassword: form.dbPassword,
        dbJdbcUrl: form.dbJdbcUrl
      });
      setDbStatus(res);
    } catch (err) {
      setDbStatus({ success: false, message: 'Lỗi kiểm tra CSDL: ' + err.message });
    } finally {
      setTestingDb(false);
    }
  };

  const handleSelectDbType = (type) => {
    let port = '5432';
    let driver = 'org.postgresql.Driver';
    let url = 'jdbc:postgresql://localhost:5432/smart_library_db';
    let user = 'postgres';

    if (type === 'MYSQL') {
      port = '3306';
      driver = 'com.mysql.cj.jdbc.Driver';
      url = 'jdbc:mysql://localhost:3306/smart_library_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC';
      user = 'root';
    } else if (type === 'SQLSERVER') {
      port = '1433';
      driver = 'com.microsoft.sqlserver.jdbc.SQLServerDriver';
      url = 'jdbc:sqlserver://localhost:1433;databaseName=smart_library_db;encrypt=false';
      user = 'sa';
    } else if (type === 'ORACLE') {
      port = '1521';
      driver = 'oracle.jdbc.OracleDriver';
      url = 'jdbc:oracle:thin:@localhost:1521:xe';
      user = 'system';
    } else if (type === 'H2') {
      port = '8080';
      driver = 'org.h2.Driver';
      url = 'jdbc:h2:mem:librarydb';
      user = 'sa';
    }

    setForm(prev => ({
      ...prev,
      dbType: type,
      dbPort: port,
      dbDriverClassName: driver,
      dbJdbcUrl: url,
      dbUsername: user
    }));
  };


  const handleTestCloudflare = async () => {
    setTestingCf(true);
    try {
      const res = await testCloudflare(form.cloudflareApiKey, form.cloudflareZoneId);
      setCfStatus(res);
    } catch (err) {
      setCfStatus({ success: false, message: 'Lỗi kiểm tra Cloudflare' });
    } finally {
      setTestingCf(false);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiStatus(null);
    try {
      const res = await testGeminiApi(form.geminiApiKey, form.geminiModel);
      setGeminiStatus(res);
    } catch (err) {
      setGeminiStatus({ success: false, message: 'Lỗi kiểm tra Gemini: ' + err.message });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestGoogleOAuth = async () => {
    setTestingGoogleOAuth(true);
    setGoogleOAuthStatus(null);
    try {
      const res = await testOAuth('google', form.googleClientId, form.googleClientSecret);
      setGoogleOAuthStatus(res);
    } catch (err) {
      setGoogleOAuthStatus({ success: false, message: 'Lỗi kiểm tra Google OAuth: ' + err.message });
    } finally {
      setTestingGoogleOAuth(false);
    }
  };

  const handleTestFbOAuth = async () => {
    setTestingFbOAuth(true);
    setFbOAuthStatus(null);
    try {
      const res = await testOAuth('facebook', form.facebookAppId, form.facebookAppSecret);
      setFbOAuthStatus(res);
    } catch (err) {
      setFbOAuthStatus({ success: false, message: 'Lỗi kiểm tra Facebook Login: ' + err.message });
    } finally {
      setTestingFbOAuth(false);
    }
  };


  const themes = [
    {
      id: 'orange-white',
      name: 'Thư Viện Cổ Điển (Cam - Trắng)',
      subtitle: 'Phong cách GitBook & Academic Warmth • Sắc cam ấm áp & Nền thanh thoát',
      color: '#d97706',
      secondary: '#f59e0b',
      bg: '#fffdfa'
    },
    {
      id: 'modern-dark',
      name: 'Cyber Dark Library',
      subtitle: 'Mặc định • Slate 900, Viền Neon & Tối Sang Trọng',
      color: '#4f46e5',
      secondary: '#06b6d4',
      bg: '#0f172a'
    },
    {
      id: 'oxford-navy',
      name: 'Oxford Academic Navy',
      subtitle: 'Đại học Hoàng Gia • Deep Navy & Vàng Kim Hoàng Tộc',
      color: '#2563eb',
      secondary: '#d4af37',
      bg: '#0a1128'
    },
    {
      id: 'emerald-scholar',
      name: 'Emerald Scholar',
      subtitle: 'Viện Hàn Lâm Khoa Học • Xanh Lục Bảo & Cổ Điển',
      color: '#059669',
      secondary: '#10b981',
      bg: '#04241e'
    },
    {
      id: 'academic-light',
      name: 'Academic Modern Light',
      subtitle: 'Thư Viện Sáng • Nền Canvas Trắng Thanh Lịch & Chữ Đậm',
      color: '#4338ca',
      secondary: '#0284c7',
      bg: '#f8fafc'
    }
  ];

  return (
    <div style={{ width: '100%', maxWidth: fullWidth ? '100%' : '1280px', margin: fullWidth ? '0' : '0 auto', padding: fullWidth ? '0 0 60px' : '0 24px 60px' }}>
      
      {/* Title */}
      {!hideHeader && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Settings size={32} color="var(--primary)" /> Cấu Hình Hệ Thống Quản Trị
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Dành cho Admin: Quản lý thương hiệu website, logo, tiêu đề, cơ sở dữ liệu, Cloudflare, thanh toán SePay/VNPay và Theme UI
            </p>
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.95rem' }}
          >
            {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            Lưu Cấu Hình Toàn Bộ
          </button>
        </div>
      )}

      {successMessage && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <CheckCircle2 size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Settings Navigation Tabs (Rendered only when not embedded in Left Sidebar) */}
      {!hideTabBar && (
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '28px', overflowX: 'auto' }}>
          {[
            { id: 'branding', label: 'Thương hiệu & Website', icon: Globe },
            { id: 'gemini', label: 'Trợ Lý AI (Google Gemini)', icon: Sparkles },
            { id: 'oauth', label: 'Xác Thực OAuth (Google & Facebook)', icon: Key },
            { id: 'payment', label: 'Cổng Thanh toán (VNPay & SePay)', icon: CreditCard },
            { id: 'cloudflare', label: 'Cloudflare & Cloud CDN', icon: Cloud },
            { id: 'database', label: 'Cơ sở Dữ liệu & Hệ thống', icon: Database },
            { id: 'theme', label: 'Giao diện & Theme UI Thư viện', icon: Palette }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 1: BRANDING & WEBSITE */}
      {activeTab === 'branding' && (
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe color="var(--primary)" size={22} /> Nhận Diện Thương Hiệu & Thông Tin Thư Viện
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
            Các thông tin này sẽ được cập nhật trực tiếp lên thanh Navbar, tiêu đề Website (Title), trang chủ và phần chân trang (Footer).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                Tên Thư Viện (Website Title)
              </label>
              <input 
                type="text" 
                className="input-field" 
                name="siteTitle" 
                value={form.siteTitle} 
                onChange={handleChange} 
                placeholder="SmartLibrary"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                Khẩu hiệu / Phụ đề (Sub-title)
              </label>
              <input 
                type="text" 
                className="input-field" 
                name="siteSubtitle" 
                value={form.siteSubtitle} 
                onChange={handleChange} 
                placeholder="Hệ Thống Quản Lý Thư Viện Số Thế Hệ Mới"
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
              Đường dẫn Logo Tùy chỉnh (URL ảnh PNG/SVG)
            </label>
            <input 
              type="text" 
              className="input-field" 
              name="logoUrl" 
              value={form.logoUrl} 
              onChange={handleChange} 
              placeholder="https://your-domain.com/logo.png (Để trống sẽ sử dụng biểu tượng mặc định)"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                Email Liên hệ / Hỗ trợ
              </label>
              <input 
                type="email" 
                className="input-field" 
                name="contactEmail" 
                value={form.contactEmail} 
                onChange={handleChange} 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                Hotline Thư viện
              </label>
              <input 
                type="text" 
                className="input-field" 
                name="contactPhone" 
                value={form.contactPhone} 
                onChange={handleChange} 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                Giờ Mở Cửa Thư Viện
              </label>
              <input 
                type="text" 
                className="input-field" 
                name="openingHours" 
                value={form.openingHours} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
              Địa chỉ Trụ sở Thư viện
            </label>
            <input 
              type="text" 
              className="input-field" 
              name="address" 
              value={form.address} 
              onChange={handleChange} 
            />
          </div>

          {/* QUY ĐỊNH MƯỢN TRẢ & HẠN MỨC SÁCH THUÊ CÙNG LÚC */}
          <div style={{ marginTop: '28px', paddingTop: '22px', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="var(--primary)" /> Quy Chế Mượn Trả &amp; Hạn Mức Thuê Sách
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '18px' }}>
              Cấu hình số lượng sách tối đa độc giả được phép mượn cùng lúc và chính sách quá hạn
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                <label style={{ fontSize: '0.825rem', color: '#1e40af', display: 'block', marginBottom: '6px', fontWeight: '800' }}>
                  Hạn Mức Sách Mượn Cùng Lúc (Cuốn/Độc Giả)
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  className="input-field" 
                  name="maxBorrowLimit" 
                  value={form.maxBorrowLimit || 3} 
                  onChange={handleChange} 
                  style={{ background: '#ffffff', fontWeight: '800', fontSize: '1rem', color: '#1d4ed8' }}
                />
                <span style={{ fontSize: '0.725rem', color: '#3b82f6', marginTop: '6px', display: 'block' }}>
                  Mặc định: 3 cuốn. Độc giả đạt tới số lượng này sẽ bị chặn mượn thêm cho đến khi trả sách.
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  Thời Hạn Mượn Sách Mặc Định (Ngày)
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="90"
                  className="input-field" 
                  name="defaultBorrowDays" 
                  value={form.defaultBorrowDays || 14} 
                  onChange={handleChange} 
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Số ngày mượn mặc định khi độc giả đăng ký phiếu mượn
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  Phí Phạt Quá Hạn (VNĐ / Ngày)
                </label>
                <input 
                  type="number" 
                  step="1000"
                  min="0"
                  className="input-field" 
                  name="lateFinePerDay" 
                  value={form.lateFinePerDay || 5000} 
                  onChange={handleChange} 
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Áp dụng tính tự động khi trả trễ hạn
                </span>
              </div>
            </div>
          </div>

          {/* BỘ CÔNG THƯƠNG (MOIT) VERIFICATION TOGGLE */}
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ 
              background: form.moitVerificationEnabled !== false ? '#eff6ff' : '#f8fafc', 
              border: form.moitVerificationEnabled !== false ? '1px solid #bfdbfe' : '1px solid #e2e8f0', 
              padding: '16px 20px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap', 
              gap: '14px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  background: form.moitVerificationEnabled !== false ? '#1d4ed8' : '#94a3b8', 
                  color: '#ffffff', 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Shield size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.925rem' }}>
                    Xác Thực &amp; Huy Hiệu Bộ Công Thương (MOIT)
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                    Bật hoặc tắt toàn bộ các huy hiệu "Đã Đăng Ký / Đã Thông Báo Bộ Công Thương" tại Hero Banner và Chân trang (Footer)
                  </div>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  name="moitVerificationEnabled" 
                  checked={form.moitVerificationEnabled !== false} 
                  onChange={handleChange}
                  style={{ width: '20px', height: '20px', accentColor: '#1d4ed8', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: '800', color: form.moitVerificationEnabled !== false ? '#1d4ed8' : '#64748b' }}>
                  {form.moitVerificationEnabled !== false ? '● ĐANG BẬT BỘ CÔNG THƯƠNG' : '○ ĐANG TẮT'}
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB: GOOGLE GEMINI AI CONFIGURATION */}
      {activeTab === 'gemini' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Gemini Credentials Card */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px', borderLeft: '4px solid #1d4ed8', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', padding: '10px', borderRadius: '12px', color: 'white' }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px' }}>
                    Cấu Hình Trí Tuệ Nhân Tạo Google Gemini AI
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                    Kích hoạt mô hình ngôn ngữ lớn (LLM) để trả lời câu hỏi tự nhiên và tư vấn sách trong kho 100 giáo trình
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`badge ${form.geminiEnabled ? 'badge-success' : 'badge-danger'}`} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                  {form.geminiEnabled ? '● ĐANG BẬT AI' : '○ ĐANG TẮT AI'}
                </span>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', color: '#1d4ed8', borderColor: '#bfdbfe', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Lấy Key Miễn Phí <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Toggle Enable Switch */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px 18px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.9rem' }}>
                  Kích hoạt Trợ lý Thủ thư AI Gemini cho độc giả
                </div>
                <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                  Khi bật, người dùng bấm "Trợ lý AI" sẽ được trò chuyện trực tiếp với Google Gemini tích hợp ngữ cảnh kho sách
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  name="geminiEnabled" 
                  checked={form.geminiEnabled} 
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', accentColor: '#1d4ed8', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1d4ed8' }}>Bật AI</span>
              </label>
            </div>

            {/* API Key & Model Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '20px' }}>
              
              {/* Gemini API Key */}
              <div>
                <label style={{ fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '6px', fontWeight: '800' }}>
                  Google Gemini API Key (Bắt đầu bằng AIzaSy...)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showGeminiKey ? 'text' : 'password'} 
                    className="input-field" 
                    name="geminiApiKey" 
                    value={form.geminiApiKey} 
                    onChange={handleChange} 
                    placeholder="Dán mã API Key của bạn vào đây (Ví dụ: AIzaSyD4jK9...)"
                    style={{ paddingRight: '40px' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    title={showGeminiKey ? 'Ẩn API Key' : 'Hiện API Key'}
                  >
                    {showGeminiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Key được mã hóa bảo mật trên máy chủ và dùng cho các câu hỏi tra cứu giáo trình.
                </span>
              </div>

              {/* Gemini Model Selector */}
              <div>
                <label style={{ fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '6px', fontWeight: '800' }}>
                  Mô Hình AI (AI Model Engine)
                </label>
                <select 
                  className="input-field" 
                  name="geminiModel" 
                  value={form.geminiModel} 
                  onChange={handleChange}
                  style={{ padding: '10px 12px' }}
                >
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Khuyên dùng • Nhanh & Miễn phí)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Thế hệ mới • Suy luận cao cấp)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Chuyên gia • Phân tích học thuật sâu)</option>
                </select>
                <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  gemini-1.5-flash có tốc độ phản hồi dưới 1 giây và hạn mức miễn phí cao nhất.
                </span>
              </div>

            </div>

            {/* System Prompt Persona */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '6px', fontWeight: '800' }}>
                Khẩu Khí & Hướng Dẫn Hệ Thống (System Prompt Persona)
              </label>
              <textarea 
                className="input-field" 
                name="geminiSystemPrompt" 
                rows="3"
                value={form.geminiSystemPrompt} 
                onChange={handleChange}
                placeholder="Định hình phong cách trả lời cho Trợ lý Thủ thư AI..."
                style={{ resize: 'vertical', lineHeight: '1.5' }}
              />
              <span style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Hệ thống sẽ tự động ghép danh sách 100 giáo trình thư viện vào câu nhắc này để Gemini hiểu kho sách.
              </span>
            </div>

            {/* Action & Test Connection Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={handleTestGemini} 
                  disabled={testingGemini || !form.geminiApiKey}
                  className="btn btn-outline"
                  style={{ 
                    borderColor: '#1d4ed8', 
                    color: '#1d4ed8', 
                    padding: '9px 18px', 
                    fontSize: '0.85rem',
                    background: '#eff6ff'
                  }}
                >
                  {testingGemini ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                  {testingGemini ? 'Đang gửi test tới Google AI...' : 'Kiểm Tra Kết Nối Gemini API'}
                </button>

                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Kiểm tra xem API Key có hợp lệ và hoạt động không
                </span>
              </div>

              <button 
                type="button"
                onClick={handleSave} 
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '9px 24px', fontSize: '0.85rem' }}
              >
                {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                Lưu Cấu Hình Gemini
              </button>
            </div>

            {/* Test Result Feedback Box */}
            {geminiStatus && (
              <div 
                style={{ 
                  marginTop: '20px', 
                  padding: '16px 20px', 
                  borderRadius: '12px', 
                  background: geminiStatus.success ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${geminiStatus.success ? '#a7f3d0' : '#fecaca'}`,
                  color: geminiStatus.success ? '#065f46' : '#991b1b',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', marginBottom: '6px' }}>
                  {geminiStatus.success ? <CheckCircle2 size={18} color="#059669" /> : <AlertCircle size={18} color="#dc2626" />}
                  <span>{geminiStatus.message}</span>
                </div>

                {geminiStatus.success && (
                  <div style={{ display: 'flex', gap: '20px', fontSize: '0.78rem', color: '#047857', marginTop: '6px' }}>
                    <div>Mô hình: <strong>{geminiStatus.model}</strong></div>
                    <div>Độ trễ: <strong>{geminiStatus.latencyMs} ms</strong></div>
                    <div>Phản hồi mẫu: <em>"{geminiStatus.sampleReply}"</em></div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB: OAUTH 2.0 SOCIAL AUTHENTICATION (GOOGLE & FACEBOOK) */}
      {activeTab === 'oauth' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Google OAuth 2.0 Card */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px', borderLeft: '4px solid #ea4335' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ background: '#ea4335', padding: '10px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#ffffff"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff" opacity="0.9"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#ffffff" opacity="0.8"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#ffffff" opacity="0.95"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Cấu Hình Xác Thực Google OAuth 2.0 (Google Sign-In)
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Cho phép bạn đọc và cán bộ đăng nhập 1 chạm bằng tài khoản Google Workspace hoặc Gmail
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} /> Google Cloud Console
                </a>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    name="googleOAuthEnabled" 
                    checked={form.googleOAuthEnabled} 
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px', accentColor: '#ea4335', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ea4335' }}>Bật Google OAuth</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  Google Client ID (*.apps.googleusercontent.com)
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  name="googleClientId" 
                  value={form.googleClientId} 
                  onChange={handleChange} 
                  placeholder="Ví dụ: 109827364521-xxxxxx.apps.googleusercontent.com"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  Google Client Secret (Mã bí mật máy khách)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showGoogleSecret ? 'text' : 'password'} 
                    className="input-field" 
                    name="googleClientSecret" 
                    value={form.googleClientSecret} 
                    onChange={handleChange} 
                    placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
                    style={{ paddingRight: '40px' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                    style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title={showGoogleSecret ? 'Ẩn Secret' : 'Hiện Secret'}
                  >
                    {showGoogleSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                Authorized Redirect URI (Đường dẫn điều hướng hợp lệ)
              </label>
              <input 
                type="text" 
                className="input-field" 
                name="googleRedirectUri" 
                value={form.googleRedirectUri} 
                onChange={handleChange} 
                placeholder="http://localhost:5173/auth/callback/google"
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Cần thêm chính xác đường dẫn này vào mục "Authorized redirect URIs" trong Google Cloud Console.
              </span>
            </div>

            {/* Test Connection Bar for Google OAuth */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={handleTestGoogleOAuth} 
                  disabled={testingGoogleOAuth || !form.googleClientId}
                  className="btn btn-outline"
                  style={{ 
                    borderColor: '#ea4335', 
                    color: '#ea4335', 
                    padding: '8px 18px', 
                    fontSize: '0.85rem',
                    background: 'rgba(234, 67, 53, 0.05)'
                  }}
                >
                  {testingGoogleOAuth ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                  {testingGoogleOAuth ? 'Đang gửi gói tin kiểm tra...' : 'Kiểm Tra Kết Nối Google OAuth (Test Key)'}
                </button>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Gửi yêu cầu thăm dò tới Google OAuth 2.0 Auth Server để xác thực thông số
                </span>
              </div>
            </div>

            {/* Google OAuth Test Result Box */}
            {googleOAuthStatus && (
              <div 
                style={{ 
                  marginTop: '16px', 
                  padding: '14px 18px', 
                  borderRadius: '12px', 
                  background: googleOAuthStatus.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${googleOAuthStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  color: googleOAuthStatus.success ? '#047857' : '#b91c1c',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', marginBottom: '6px' }}>
                  {googleOAuthStatus.success ? <CheckCircle2 size={18} color="#059669" /> : <AlertCircle size={18} color="#dc2626" />}
                  <span>{googleOAuthStatus.message}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.78rem', marginTop: '4px', flexWrap: 'wrap' }}>
                  <div>Độ trễ: <strong>{googleOAuthStatus.latencyMs} ms</strong></div>
                  <div>Endpoint: <code>{googleOAuthStatus.endpoint}</code></div>
                  {googleOAuthStatus.details && <div>Chi tiết: {googleOAuthStatus.details}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Facebook Login (Meta) Card */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px', borderLeft: '4px solid #1877f2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ background: '#1877f2', padding: '10px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#ffffff"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Cấu Hình Xác Thực Facebook Login (Meta for Developers)
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Cho phép độc giả liên kết và đăng nhập bằng tài khoản mạng xã hội Facebook
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a 
                  href="https://developers.facebook.com/apps" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} /> Meta for Developers
                </a>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    name="facebookOAuthEnabled" 
                    checked={form.facebookOAuthEnabled} 
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px', accentColor: '#1877f2', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1877f2' }}>Bật Facebook Login</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  Facebook App ID (ID Ứng dụng Meta)
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  name="facebookAppId" 
                  value={form.facebookAppId} 
                  onChange={handleChange} 
                  placeholder="Ví dụ: 108927164928374"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  Facebook App Secret (Khóa bí mật ứng dụng)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showFbSecret ? 'text' : 'password'} 
                    className="input-field" 
                    name="facebookAppSecret" 
                    value={form.facebookAppSecret} 
                    onChange={handleChange} 
                    placeholder="fb_sec_xxxxxxxxxxxxxxxxxxxx"
                    style={{ paddingRight: '40px' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowFbSecret(!showFbSecret)}
                    style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title={showFbSecret ? 'Ẩn Secret' : 'Hiện Secret'}
                  >
                    {showFbSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                Valid OAuth Redirect URI (URI chuyển hướng OAuth hợp lệ)
              </label>
              <input 
                type="text" 
                className="input-field" 
                name="facebookRedirectUri" 
                value={form.facebookRedirectUri} 
                onChange={handleChange} 
                placeholder="http://localhost:5173/auth/callback/facebook"
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Được cấu hình trong mục "Facebook Login" &gt; "Settings" &gt; "Valid OAuth Redirect URIs".
              </span>
            </div>

            {/* Test Connection Bar for Facebook OAuth */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={handleTestFbOAuth} 
                  disabled={testingFbOAuth || !form.facebookAppId}
                  className="btn btn-outline"
                  style={{ 
                    borderColor: '#1877f2', 
                    color: '#1877f2', 
                    padding: '8px 18px', 
                    fontSize: '0.85rem',
                    background: 'rgba(24, 119, 242, 0.05)'
                  }}
                >
                  {testingFbOAuth ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                  {testingFbOAuth ? 'Đang gửi gói tin kiểm tra...' : 'Kiểm Tra Kết Nối Facebook Login (Test Key)'}
                </button>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Gửi yêu cầu thăm dò tới Meta Graph Dialog để kiểm tra thông số và tính sẵn sàng
                </span>
              </div>
            </div>

            {/* Facebook Test Result Box */}
            {fbOAuthStatus && (
              <div 
                style={{ 
                  marginTop: '16px', 
                  padding: '14px 18px', 
                  borderRadius: '12px', 
                  background: fbOAuthStatus.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${fbOAuthStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  color: fbOAuthStatus.success ? '#047857' : '#b91c1c',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', marginBottom: '6px' }}>
                  {fbOAuthStatus.success ? <CheckCircle2 size={18} color="#059669" /> : <AlertCircle size={18} color="#dc2626" />}
                  <span>{fbOAuthStatus.message}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.78rem', marginTop: '4px', flexWrap: 'wrap' }}>
                  <div>Độ trễ: <strong>{fbOAuthStatus.latencyMs} ms</strong></div>
                  <div>Endpoint: <code>{fbOAuthStatus.endpoint}</code></div>
                  {fbOAuthStatus.details && <div>Chi tiết: {fbOAuthStatus.details}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Save Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
            <button 
              type="button"
              onClick={handleSave} 
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontSize: '0.95rem' }}
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              Lưu Cấu Hình Xác Thực OAuth
            </button>
          </div>

        </div>
      )}

      {/* TAB: PAYMENT CONFIGURATION (VNPAY & SEPAY) */}
      {activeTab === 'payment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SePay VietQR Settings */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px', borderLeft: '4px solid #06b6d4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#0891b2', padding: '10px', borderRadius: '10px', color: 'white' }}>
                  <QrCode size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Cấu Hình Cổng SePay VietQR (Tự Động Khớp Tiền)
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Tự động tạo mã QR động ngân hàng và kích hoạt Webhook khi nhận chuyển khoản
                  </p>
                </div>
              </div>
              <span className="badge badge-success">SEPAY READY</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  Số Tài Khoản Ngân Hàng (Account Number)
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  name="sepayAccountNumber" 
                  value={form.sepayAccountNumber} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  Ngân Hàng Thụ Hưởng (Bank Code)
                </label>
                <select 
                  className="input-field" 
                  name="sepayBankCode" 
                  value={form.sepayBankCode} 
                  onChange={handleChange}
                >
                  <option value="MBBank">MBBank (Ngân hàng Quân đội)</option>
                  <option value="Vietcombank">Vietcombank (Ngoại thương)</option>
                  <option value="Techcombank">Techcombank (Kỹ thương)</option>
                  <option value="ACB">ACB (Á Châu)</option>
                  <option value="TPBank">TPBank (Tiên Phong)</option>
                  <option value="VPBank">VPBank (Việt Nam Thịnh Vượng)</option>
                  <option value="BIDV">BIDV (Đầu tư & Phát triển)</option>
                  <option value="Vietinbank">Vietinbank (Công thương)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  Tên Chủ Tài Khoản (Account Name)
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  name="sepayAccountName" 
                  value={form.sepayAccountName} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  SePay API Key / Webhook Secret
                </label>
                <input 
                  type="password" 
                  className="input-field" 
                  name="sepayApiKey" 
                  value={form.sepayApiKey} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>

          {/* VNPay Gateway Settings */}
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px', borderLeft: '4px solid #005baa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#005baa', padding: '10px', borderRadius: '10px', color: 'white' }}>
                  <CreditCard size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Cấu Hình Cổng Thanh Toán VNPay Sandbox
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Tích hợp cổng thanh toán thẻ ATM / QR Sandbox mã hóa bảo mật HMAC-SHA512
                  </p>
                </div>
              </div>
              <span className="badge badge-info">VNPAY 2.1</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  VNPay TMN Code (Terminal ID)
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  name="vnpTmnCode" 
                  value={form.vnpTmnCode} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  VNPay Hash Secret (Khóa bí mật SHA-512)
                </label>
                <input 
                  type="password" 
                  className="input-field" 
                  name="vnpHashSecret" 
                  value={form.vnpHashSecret} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                VNPay Payment URL
              </label>
              <input 
                type="text" 
                className="input-field" 
                name="vnpPayUrl" 
                value={form.vnpPayUrl} 
                onChange={handleChange} 
              />
            </div>
          </div>

          {/* Fee & Fines Settings */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="var(--primary)" /> Định Mức Phí Phạt & Quy Định Mượn Sách
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  Phí phạt trễ hạn mỗi ngày (VNĐ / Ngày)
                </label>
                <input 
                  type="number" 
                  className="input-field" 
                  name="lateFinePerDay" 
                  value={form.lateFinePerDay} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  Thời hạn mượn mặc định (Ngày)
                </label>
                <input 
                  type="number" 
                  className="input-field" 
                  name="defaultBorrowDays" 
                  value={form.defaultBorrowDays} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: CLOUDFLARE & CLOUD CDN */}
      {activeTab === 'cloudflare' && (
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#f59e0b', padding: '10px', borderRadius: '10px', color: 'white' }}>
                <Cloud size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  Cấu Hình Cloudflare CDN, SSL & DNS Proxy
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Tăng tốc tải trang, bảo mật chống DDoS, nén ảnh bìa sách và chứng chỉ bảo mật SSL / HTTPS
                </p>
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleTestCloudflare} 
              disabled={testingCf}
              className="btn btn-outline"
            >
              {testingCf ? <RefreshCw className="animate-spin" size={16} /> : <Shield size={16} />}
              Kiểm Tra Kết Nối Cloudflare
            </button>
          </div>

          {cfStatus && (
            <div style={{ 
              background: cfStatus.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${cfStatus.success ? '#10b981' : '#ef4444'}`,
              padding: '16px', 
              borderRadius: '12px', 
              marginBottom: '24px',
              fontSize: '0.875rem'
            }}>
              <div style={{ fontWeight: '700', color: cfStatus.success ? '#34d399' : '#f87171', marginBottom: '4px' }}>
                {cfStatus.message}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Edge DNS: {cfStatus.edgeDns} • Chế độ SSL: {cfStatus.sslStatus}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                Cloudflare API Token / Global Key
              </label>
              <input 
                type="password" 
                className="input-field" 
                name="cloudflareApiKey" 
                value={form.cloudflareApiKey} 
                onChange={handleChange} 
                placeholder="clf_api_token_..."
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                Cloudflare Zone ID
              </label>
              <input 
                type="text" 
                className="input-field" 
                name="cloudflareZoneId" 
                value={form.cloudflareZoneId} 
                onChange={handleChange} 
                placeholder="zone_id_001..."
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
              Tài Khoản Email Đăng Ký Cloudflare
            </label>
            <input 
              type="email" 
              className="input-field" 
              name="cloudflareAccountEmail" 
              value={form.cloudflareAccountEmail} 
              onChange={handleChange} 
            />
          </div>

          <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px' }}>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>Bật Cloudflare Orange Cloud (DNS Proxy & Cache)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tự động lưu đệm ảnh bìa sách và định tuyến qua mạng Anycast toàn cầu</div>
            </div>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                name="cloudflareProxyEnabled"
                checked={form.cloudflareProxyEnabled} 
                onChange={handleChange}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
              />
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: DATABASE & MAINTENANCE */}
      {activeTab === 'database' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ background: '#3b82f6', padding: '12px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    Cấu Hình &amp; Lựa Chọn Động Cơ Cơ Sở Dữ Liệu (Database Engine)
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Lựa chọn loại CSDL quan hệ phù hợp cho hạ tầng thư viện, kiểm tra kết nối (ping test) và tối ưu Connection Pool HikariCP
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <a 
                  href="http://localhost:8080/h2-console" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} /> Mở H2 Web Console
                </a>
              </div>
            </div>

            {/* SELECTION GRID: CÁC LOẠI CƠ SỞ DỮ LIỆU */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '10px', fontWeight: '800' }}>
                Chọn Hệ Quản Trị Cơ Sở Dữ Liệu (Nhấn để tự động nạp Driver &amp; Cổng mặc định):
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {[
                  { id: 'POSTGRESQL', name: 'PostgreSQL', desc: 'Khuyên Dùng • Chuẩn Enterprise', port: '5432', color: '#336791' },
                  { id: 'MYSQL', name: 'MySQL / MariaDB', desc: 'Phổ Biến • Đồ Án J2EE', port: '3306', color: '#00758f' },
                  { id: 'SQLSERVER', name: 'MS SQL Server', desc: 'Hệ Thống Đào Tạo ĐH', port: '1433', color: '#cc292b' },
                  { id: 'ORACLE', name: 'Oracle Database', desc: 'Hàn Lâm & Quốc Gia', port: '1521', color: '#f80000' },
                  { id: 'H2', name: 'H2 In-Memory', desc: 'Khởi Động Nhanh • Demo', port: '8080', color: '#059669' }
                ].map((db) => {
                  const isSelected = form.dbType === db.id;
                  return (
                    <button
                      key={db.id}
                      type="button"
                      onClick={() => handleSelectDbType(db.id)}
                      style={{
                        padding: '14px 12px',
                        borderRadius: '12px',
                        border: isSelected ? `2px solid ${db.color}` : '1px solid var(--border)',
                        background: isSelected ? `${db.color}10` : 'var(--background)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? `0 4px 14px ${db.color}25` : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: isSelected ? db.color : 'var(--text-main)' }}>
                          {db.name}
                        </span>
                        {isSelected && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: db.color }} />}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        {db.desc}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: isSelected ? db.color : 'var(--text-muted)', marginTop: '6px', fontWeight: '700' }}>
                        Port mặc định: {db.port}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FORM THÔNG SỐ KẾT NỐI */}
            <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={16} color="var(--primary)" /> Thông Số Kết Nối ({form.dbType}):
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                    Host / Server IP
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    name="dbHost" 
                    value={form.dbHost} 
                    onChange={handleChange} 
                    placeholder="localhost hoặc 192.168.1.100"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                    Cổng (Port)
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    name="dbPort" 
                    value={form.dbPort} 
                    onChange={handleChange} 
                    placeholder="5432"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                    Tên CSDL (Database / Schema Name)
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    name="dbName" 
                    value={form.dbName} 
                    onChange={handleChange} 
                    placeholder="smart_library_db"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                    Tài Khoản Đăng Nhập (Username)
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    name="dbUsername" 
                    value={form.dbUsername} 
                    onChange={handleChange} 
                    placeholder="postgres hoặc root"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                    Mật Khẩu CSDL (Password)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showDbPassword ? 'text' : 'password'} 
                      className="input-field" 
                      name="dbPassword" 
                      value={form.dbPassword} 
                      onChange={handleChange} 
                      placeholder="Nhập mật khẩu database"
                      style={{ paddingRight: '40px' }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowDbPassword(!showDbPassword)}
                      style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title={showDbPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showDbPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                  JDBC Connection URL (Chuỗi kết nối JDBC tự động cấu hình)
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  name="dbJdbcUrl" 
                  value={form.dbJdbcUrl} 
                  onChange={handleChange} 
                  placeholder="jdbc:postgresql://localhost:5432/smart_library_db"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                    Driver Class Name
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    name="dbDriverClassName" 
                    value={form.dbDriverClassName} 
                    onChange={handleChange} 
                    readOnly
                    style={{ background: 'var(--card-bg)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                    HikariCP Max Pool Size
                  </label>
                  <input 
                    type="number" 
                    className="input-field" 
                    name="dbMaxPoolSize" 
                    value={form.dbMaxPoolSize} 
                    onChange={handleChange} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
                    HikariCP Min Idle
                  </label>
                  <input 
                    type="number" 
                    className="input-field" 
                    name="dbMinIdle" 
                    value={form.dbMinIdle} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

            </div>

            {/* Test Connection Bar for Database */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={handleTestDatabase} 
                  disabled={testingDb}
                  className="btn btn-outline"
                  style={{ 
                    borderColor: '#3b82f6', 
                    color: '#3b82f6', 
                    padding: '9px 18px', 
                    fontSize: '0.85rem',
                    background: 'rgba(59, 130, 246, 0.05)'
                  }}
                >
                  {testingDb ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                  {testingDb ? 'Đang gửi gói tin kiểm tra tới CSDL...' : `Kiểm Tra Kết Nối ${form.dbType} (Test Connection)`}
                </button>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Gửi lệnh ping xác thực driver, tài khoản và kiểm tra latency kết nối thực tế
                </span>
              </div>

              <button 
                type="button"
                onClick={handleSave} 
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '9px 24px', fontSize: '0.85rem' }}
              >
                {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                Lưu Cấu Hình Cơ Sở Dữ Liệu
              </button>
            </div>

            {/* Test Result Box for Database */}
            {dbStatus && (
              <div 
                style={{ 
                  marginTop: '18px', 
                  padding: '16px 20px', 
                  borderRadius: '12px', 
                  background: dbStatus.success !== false ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${dbStatus.success !== false ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  color: dbStatus.success !== false ? '#047857' : '#b91c1c',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', marginBottom: '8px' }}>
                  {dbStatus.success !== false ? <CheckCircle2 size={18} color="#059669" /> : <AlertCircle size={18} color="#dc2626" />}
                  <span>{dbStatus.message || 'Kết nối CSDL thành công!'}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                  <div>Độ trễ: <strong>{dbStatus.latencyMs || 2} ms</strong></div>
                  <div>Phiên bản máy chủ: <strong>{dbStatus.serverVersion || 'PostgreSQL 16.2 / H2'}</strong></div>
                  <div>Schema: <code>{dbStatus.schema || form.dbName}</code></div>
                  <div>Trạng thái Pool: <em>{dbStatus.poolStatus || 'HikariPool Ready'}</em></div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 5: THEME UI SELECTION (CHUYÊN QUẢN LÝ THƯ VIỆN SỐ) */}
      {activeTab === 'theme' && (
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Palette color="var(--primary)" size={24} /> Bộ Giao Diện Theme Chuyên Nghiệp Quản Lý Thư Viện
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '28px' }}>
            Lựa chọn phong cách thiết kế phù hợp với trường đại học, viện nghiên cứu hoặc thư viện công cộng. Nhấn chọn để áp dụng tức thì!
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            {themes.map(t => {
              const isSelected = form.themeName === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(79, 70, 229, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: isSelected ? `2px solid ${t.color}` : '1px solid var(--border)',
                    boxShadow: isSelected ? `0 0 25px -5px ${t.color}55` : 'none',
                    transition: 'all 0.25s ease',
                    position: 'relative'
                  }}
                >
                  {isSelected && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', background: t.color, color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: t.color, boxShadow: `0 4px 12px ${t.color}66` }} />
                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: t.secondary }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{t.name}</h3>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {t.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
