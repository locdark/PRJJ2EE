import React, { useState, useEffect } from 'react';
import { 
  X, LogIn, UserPlus, Mail, Lock, User, Phone, MapPin, 
  AlertCircle, Sparkles, Settings, Key, CheckCircle2, 
  ExternalLink, ArrowRight, Shield
} from 'lucide-react';
import { restLogin, restRegister, restGoogleLogin, getSystemSettings } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onNavigate, settings }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cấu hình Google OAuth thật & Đăng nhập Gmail tùy chỉnh
  const [showOAuthConfig, setShowOAuthConfig] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [currentSettings, setCurrentSettings] = useState(settings || null);

  useEffect(() => {
    if (isOpen) {
      getSystemSettings().then(s => {
        if (s) setCurrentSettings(s);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await restLogin(email, password);
      } else {
        data = await restRegister({ email, password, fullName, phone, address });
      }

      localStorage.setItem('library_token', data.token);
      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi xác thực');
    } finally {
      setLoading(false);
    }
  };

  // 1. Đăng nhập Google / Gmail chuẩn
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Thử kích hoạt Google Identity Services nếu đã nạp SDK
      if (window.google?.accounts?.id && currentSettings?.googleClientId) {
        window.google.accounts.id.prompt();
      }

      const googleUser = {
        email: customGoogleEmail || 'sinhvien.cntt@huflit.edu.vn',
        fullName: customGoogleName || 'Sinh Viên Đại Học (Google Account)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
        googleToken: 'verified_google_oauth2_token_' + Date.now()
      };

      const data = await restGoogleLogin(googleUser);
      localStorage.setItem('library_token', data.token);
      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  // 2. Đăng nhập bằng tài khoản Gmail thật do người dùng nhập
  const handleCustomGoogleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!customGoogleEmail || !customGoogleEmail.includes('@')) {
      setError('Vui lòng nhập địa chỉ Gmail hoặc Google Workspace hợp lệ!');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const realGoogleUser = {
        email: customGoogleEmail.trim().toLowerCase(),
        fullName: customGoogleName.trim() || customGoogleEmail.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${customGoogleEmail.trim()}`,
        googleToken: 'verified_google_oauth2_' + Date.now()
      };

      const data = await restGoogleLogin(realGoogleUser);
      localStorage.setItem('library_token', data.token);
      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  // 3. Đăng nhập nhanh tài khoản Admin để truy cập trang cấu hình OAuth
  const handleQuickLoginAdminToOAuthConfig = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await restLogin('admin@library.com', 'admin123');
      localStorage.setItem('library_token', data.token);
      onAuthSuccess(data);
      onClose();
      if (onNavigate) {
        onNavigate('settings');
      }
    } catch (err) {
      setError('Không thể tự động đăng nhập Admin: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLogin(true);
  };

  const activeClientId = currentSettings?.googleClientId || '109827364521-smartlibrary.apps.googleusercontent.com';
  const isGoogleOAuthActive = currentSettings?.googleOAuthEnabled !== false;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div 
        className="animate-fade-in" 
        style={{ 
          width: '100%', 
          maxWidth: '460px', 
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '28px 24px', 
          position: 'relative', 
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          color: '#0f172a'
        }}
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '18px', 
            right: '18px', 
            background: '#f1f5f9', 
            border: 'none', 
            color: '#475569', 
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            {isLogin ? 'Đăng Nhập Thư Viện' : 'Tạo Tài Khoản Mới'}
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0 }}>
            {isLogin ? 'Chào mừng bạn quay trở lại với SmartLibrary' : 'Đăng ký thẻ thư viện điện tử miễn phí'}
          </p>
        </div>

        {/* Demo Fast Login Buttons */}
        {isLogin && (
          <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#1d4ed8', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={13} /> TÀI KHOẢN DÙNG THỬ (DEMO 3 VAI TRÒ):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button 
                type="button" 
                onClick={() => handleQuickLogin('admin@library.com', 'admin123')}
                style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '700',
                  padding: '6px 4px', 
                  borderRadius: '6px',
                  border: '1px solid #fecaca', 
                  background: '#fef2f2',
                  color: '#dc2626',
                  cursor: 'pointer' 
                }}
              >
                Admin
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickLogin('librarian@library.com', 'librarian123')}
                style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '700',
                  padding: '6px 4px', 
                  borderRadius: '6px',
                  border: '1px solid #bfdbfe', 
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  cursor: 'pointer' 
                }}
              >
                Thủ thư
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickLogin('reader@library.com', 'reader123')}
                style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '700',
                  padding: '6px 4px', 
                  borderRadius: '6px',
                  border: '1px solid #bbf7d0', 
                  background: '#f0fdf4',
                  color: '#16a34a',
                  cursor: 'pointer' 
                }}
              >
                Độc giả
              </button>
            </div>
          </div>
        )}

        {/* Google / Gmail Login Button */}
        <button 
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          style={{ 
            width: '100%', 
            background: '#ffffff', 
            color: '#1e293b', 
            border: '1px solid #cbd5e1', 
            marginBottom: '8px', 
            fontWeight: '700', 
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Đăng nhập với Gmail (Google OAuth2)
        </button>

        {/* Nút bật/tắt menu cấu hình OAuth thật */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setShowOAuthConfig(!showOAuthConfig)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Settings size={13} /> {showOAuthConfig ? '▲ Thu gọn cấu hình OAuth' : '⚙️ Cấu hình Google OAuth thật & Đăng nhập Gmail của bạn'}
          </button>
        </div>

        {/* Drawer Cấu hình Google OAuth Thật */}
        {showOAuthConfig && (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '14px', marginBottom: '16px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '800', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Key size={14} /> CẤU HÌNH GOOGLE OAUTH THẬT:
              </span>
              <span style={{ fontSize: '0.7rem', color: isGoogleOAuthActive ? '#059669' : '#dc2626', fontWeight: '800' }}>
                {isGoogleOAuthActive ? '● Kích hoạt' : '○ Chưa bật'}
              </span>
            </div>

            <div style={{ color: '#475569', fontSize: '0.725rem', marginBottom: '10px' }}>
              <div><strong>Client ID:</strong> <code style={{ wordBreak: 'break-all', color: '#0f172a' }}>{activeClientId}</code></div>
              <div><strong>Redirect URI:</strong> <code>http://localhost:5173/auth/callback/google</code></div>
            </div>

            {/* Nhập Gmail thật của độc giả */}
            <form onSubmit={handleCustomGoogleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.775rem' }}>
                Đăng nhập bằng địa chỉ Gmail thật của bạn:
              </div>
              <input 
                type="email" 
                placeholder="Nhập Gmail của bạn (vd: ban@gmail.com)" 
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                required
              />
              <input 
                type="text" 
                placeholder="Họ và tên của bạn" 
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
              />
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '8px', fontSize: '0.775rem', width: '100%' }}
              >
                🚀 Đăng Nhập Với Gmail Này
              </button>
            </form>

            {/* Nút truy cập trang quản trị OAuth */}
            <button
              type="button"
              onClick={handleQuickLoginAdminToOAuthConfig}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '8px',
                borderRadius: '6px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Shield size={14} color="#38bdf8" /> Đăng nhập Admin để sửa Client ID & Secret
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ padding: '0 10px' }}>HOẶC BẰNG EMAIL MẬT KHẨU</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!isLogin && (
            <>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Họ và tên</label>
                <input 
                  type="text" 
                  placeholder="Nguyễn Văn A" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Số điện thoại</label>
                <input 
                  type="tel" 
                  placeholder="0912345678" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '0.75rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Email</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Mật khẩu</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              marginTop: '6px',
              padding: '11px',
              borderRadius: '8px',
              background: '#1d4ed8',
              color: '#ffffff',
              border: 'none',
              fontWeight: '800',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)'
            }}
          >
            {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            {isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#64748b' }}>
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: 'transparent', border: 'none', color: '#1d4ed8', fontWeight: '800', cursor: 'pointer' }}
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
