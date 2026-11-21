import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';

export default function AnnouncementModal({
  isOpen,
  onClose,
  onGoCatalog,
  settings,
}) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('library_hide_popup_date', new Date().toDateString());
    }
    onClose();
  };

  const handleAction = () => {
    handleClose();
    if (onGoCatalog) onGoCatalog();
  };

  const title =
    settings?.popupTitle ||
    'Khai trương Kho Sách Số & Tuần lễ Văn hóa Đọc 2026';
  const badgeText = settings?.popupBadgeText || 'BẢN TIN THƯ VIỆN';
  const bannerUrl =
    settings?.popupBannerUrl ||
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1000';
  const content =
    settings?.popupContent ||
    'Chào mừng quý độc giả đến với Hệ thống Thư viện Số SmartLibrary. Nhằm phục vụ kỳ thi và nghiên cứu học thuật, Thư viện nâng hạn mức mượn giáo trình lên 5 cuốn mỗi tài khoản và mở truy cập 100 đầu sách chuyên ngành chọn lọc.';
  const linkText = settings?.popupLinkText || 'Khám phá Kho Sách';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        background: 'rgba(15, 23, 42, 0.72)',
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
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          color: 'var(--text-main)',
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng thông báo"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ position: 'relative', width: '100%', height: '216px', overflow: 'hidden' }}>
          <img
            src={bannerUrl}
            alt="Ảnh minh họa thông báo thư viện"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 65%)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '24px',
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '800',
              letterSpacing: '0.04em',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {badgeText}
          </div>
        </div>

        <div style={{ padding: '24px 28px 28px' }}>
          <h2
            className="editorial-heading"
            style={{
              fontSize: '1.45rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              marginBottom: '12px',
              lineHeight: 1.35,
            }}
          >
            {title}
          </h2>

          <div
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '22px',
              whiteSpace: 'pre-line',
            }}
          >
            {content}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleAction}
              className="btn btn-primary"
              style={{ flex: 1, minHeight: '44px', fontSize: '0.9rem', fontWeight: '700' }}
            >
              <BookOpen size={17} /> {linkText}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="btn btn-outline"
              style={{ minHeight: '44px', fontSize: '0.875rem', padding: '0 20px' }}
            >
              Đóng
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
              />
              Không hiển thị lại trong hôm nay
            </label>

            <span
              className="badge badge-success"
              style={{ fontSize: '0.75rem' }}
            >
              Thông báo chính thức từ Thư viện
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
