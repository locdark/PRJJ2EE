import React, { useState, useEffect } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { restLogin, restRegister, getSystemSettings } from '../services/api';
import { showToast } from './Toast';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onNavigate, settings }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSettings, setCurrentSettings] = useState(settings || null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      getSystemSettings()
        .then((s) => {
          if (s) setCurrentSettings(s);
        })
        .catch(() => {});
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await restLogin(email.trim(), password);
      } else {
        data = await restRegister({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
        });
      }

      localStorage.setItem('library_token', data.token);
      const userObj = data.user || data;
      onAuthSuccess(userObj);
      onClose();

      const roleUpper = String(userObj.role || '').toUpperCase();
      if (['ADMIN', 'ROLE_ADMIN', 'LIBRARIAN', 'ROLE_LIBRARIAN'].includes(roleUpper) && onNavigate) {
        onNavigate('dashboard', userObj);
      }
    } catch (err) {
      setError(err.message || 'Thông tin đăng nhập không chính xác hoặc tài khoản không tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuthRedirect = async () => {
    setError('');
    let activeSettings = currentSettings;
    if (!activeSettings) {
      try {
        activeSettings = await getSystemSettings();
        if (activeSettings) setCurrentSettings(activeSettings);
      } catch {}
    }

    const googleClientId = (activeSettings?.googleClientId || '').trim();
    const isCustomDomain =
      window.location.hostname.includes('sanhoantien.click') ||
      (!/^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname) &&
        window.location.hostname !== 'localhost');
    const googleRedirectUri = isCustomDomain
      ? `${window.location.origin}/auth/callback/google`
      : (activeSettings?.googleRedirectUri || `${window.location.origin}/auth/callback/google`).trim();

    if (
      !googleClientId ||
      googleClientId.includes('smartlibrary.apps.googleusercontent.com') ||
      googleClientId.includes('demo')
    ) {
      showToast(
        'Quản trị viên chưa cấu hình Google Client ID trong mục Cấu hình Hệ thống.',
        'warning',
        4000
      );
      return;
    }

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      googleClientId
    )}&redirect_uri=${encodeURIComponent(
      googleRedirectUri || window.location.origin
    )}&response_type=token%20id_token&scope=openid%20email%20profile&state=google_${Date.now()}&nonce=${Date.now()}`;
    window.location.href = oauthUrl;
  };

  const handleFacebookOAuthRedirect = async () => {
    setError('');
    let activeSettings = currentSettings;
    if (!activeSettings) {
      try {
        activeSettings = await getSystemSettings();
        if (activeSettings) setCurrentSettings(activeSettings);
      } catch {}
    }

    const facebookAppId = (activeSettings?.facebookAppId || '').trim();
    const facebookRedirectUri = (
      activeSettings?.facebookRedirectUri || `${window.location.origin}/auth/callback/facebook`
    ).trim();

    if (!facebookAppId || facebookAppId === '108927164928374' || facebookAppId.includes('demo')) {
      showToast(
        'Quản trị viên chưa cấu hình Facebook App ID trong mục Cấu hình Hệ thống.',
        'warning',
        4000
      );
      return;
    }

    const fbUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(
      facebookAppId
    )}&redirect_uri=${encodeURIComponent(
      facebookRedirectUri || window.location.origin
    )}&response_type=token&scope=email,public_profile&state=facebook_${Date.now()}`;
    window.location.href = fbUrl;
  };

  const inputBaseStyle = {
    width: '100%',
    padding: '10px 12px 10px 38px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-main)',
    fontSize: '0.875rem',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  const iconStyle = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '28px 24px',
          position: 'relative',
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          color: 'var(--text-main)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Đóng cửa sổ đăng nhập"
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'var(--primary-light)',
              color: 'var(--primary-text)',
              border: '1px solid var(--primary-border, var(--border))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <h3
            className="editorial-heading"
            style={{
              fontSize: '1.45rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              marginBottom: '6px',
            }}
          >
            {isLogin ? 'Cổng Đăng Nhập Thư Viện' : 'Đăng Ký Thẻ Độc Giả Mới'}
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {isLogin
              ? 'Sử dụng tài khoản sinh viên, giảng viên hoặc cán bộ thư viện'
              : 'Khởi tạo hồ sơ mượn trả giáo trình và tài liệu nghiên cứu'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={handleGoogleOAuthRedirect}
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '42px',
              padding: '10px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-main)',
              fontWeight: '700',
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            Đăng nhập bằng Google
          </button>

          <button
            type="button"
            onClick={handleFacebookOAuthRedirect}
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '42px',
              padding: '10px 14px',
              background: '#1877F2',
              border: '1px solid #1877F2',
              borderRadius: '10px',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Đăng nhập bằng Facebook
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700' }}>
            HOẶC DÙNG TÀI KHOẢN THƯ VIỆN
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {error && (
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--danger-text)',
              fontSize: '0.82rem',
              fontWeight: '600',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isLogin && (
            <div>
              <label style={labelStyle}>Họ và tên đầy đủ *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={iconStyle} />
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  style={inputBaseStyle}
                />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Địa chỉ Email học vụ hoặc cá nhân *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={iconStyle} />
              <input
                type="email"
                required
                placeholder="email@university.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={inputBaseStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Mật khẩu *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={iconStyle} />
              <input
                type="password"
                required
                placeholder="Nhập mật khẩu tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={inputBaseStyle}
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label style={labelStyle}>Số điện thoại liên hệ</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={iconStyle} />
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                    style={inputBaseStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Khoa / Viện hoặc Địa chỉ</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={iconStyle} />
                  <input
                    type="text"
                    placeholder="Khoa Công nghệ Thông tin, TP.HCM"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input-field"
                    style={inputBaseStyle}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              minHeight: '44px',
              marginTop: '4px',
              fontSize: '0.92rem',
              fontWeight: '700',
              borderRadius: '10px',
            }}
          >
            {loading ? (
              'Đang xác thực...'
            ) : isLogin ? (
              <>
                <LogIn size={17} /> Đăng Nhập
              </>
            ) : (
              <>
                <UserPlus size={17} /> Đăng Ký Tài Khoản
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '18px',
            textAlign: 'center',
            fontSize: '0.84rem',
            color: 'var(--text-muted)',
          }}
        >
          {isLogin ? 'Chưa có thẻ thư viện điện tử? ' : 'Đã có tài khoản độc giả? '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-text)',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
