import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Calendar, ArrowRight, Bell, CheckCircle2 } from 'lucide-react';

export default function AnnouncementModal({ 
  isOpen, 
  onClose, 
  onGoCatalog, 
  settings 
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

  const title = settings?.popupTitle || 'Thông Báo: Khai Trương Kho Sách Số & Tuần Lễ Văn Hóa Đọc 2026';
  const badgeText = settings?.popupBadgeText || 'HOT • BẢN TIN SỐ #1792776375';
  const bannerUrl = settings?.popupBannerUrl || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1000';
  const content = settings?.popupContent || 'Chào mừng quý độc giả đến với Hệ thống Thư viện Số SmartLibrary! Nhằm phục vụ đợt thi học kỳ và nhu cầu nghiên cứu học thuật, Thư viện nâng hạn mức mượn giáo trình lên 5 cuốn/độc giả, miễn phí đọc 100 tài liệu số chuyên ngành. Trợ lý AI Gemini đã sẵn sàng hỗ trợ tra cứu 24/7.';
  const linkText = settings?.popupLinkText || 'Xem Kho Sách & Tra Cứu';

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 150, 
      background: 'rgba(15, 23, 42, 0.75)', 
      backdropFilter: 'blur(8px)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '16px' 
    }}>
      <div 
        className="animate-fade-in" 
        style={{ 
          width: '100%', 
          maxWidth: '640px', 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          background: '#ffffff', 
          borderRadius: '20px', 
          border: '1px solid #bfdbfe', 
          boxShadow: '0 25px 60px -15px rgba(29, 78, 216, 0.35)', 
          position: 'relative',
          color: '#0f172a'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          style={{ 
            position: 'absolute', 
            top: '16px', 
            right: '16px', 
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.9)', 
            border: 'none', 
            color: '#475569', 
            cursor: 'pointer',
            padding: '7px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <X size={18} />
        </button>

        {/* Banner Image */}
        <div style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden' }}>
          <img 
            src={bannerUrl} 
            alt="Library Announcement Banner" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.75) 0%, transparent 60%)' 
          }} />
          
          {/* Badge Tag */}
          <div style={{ 
            position: 'absolute', 
            bottom: '16px', 
            left: '20px', 
            background: '#1d4ed8', 
            color: '#ffffff', 
            padding: '4px 12px', 
            borderRadius: '6px', 
            fontSize: '0.75rem', 
            fontWeight: '800',
            letterSpacing: '0.04em',
            boxShadow: '0 2px 8px rgba(29, 78, 216, 0.4)'
          }}>
            {badgeText}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px 28px' }}>
          
          <h2 style={{ 
            fontSize: '1.45rem', 
            fontWeight: '900', 
            color: '#0f172a', 
            marginBottom: '12px', 
            lineHeight: 1.35, 
            letterSpacing: '-0.02em' 
          }}>
            {title}
          </h2>

          <div style={{ 
            fontSize: '0.875rem', 
            color: '#334155', 
            lineHeight: 1.7, 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            padding: '16px 20px', 
            marginBottom: '22px',
            whiteSpace: 'pre-line'
          }}>
            {content}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <button 
              onClick={handleAction}
              style={{ 
                flex: 1, 
                padding: '12px 20px', 
                borderRadius: '8px', 
                background: '#1d4ed8', 
                color: '#ffffff', 
                border: 'none', 
                fontSize: '0.9rem', 
                fontWeight: '800', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(29, 78, 216, 0.35)'
              }}
            >
              <BookOpen size={17} /> {linkText}
            </button>

            <button 
              onClick={handleClose}
              style={{ 
                padding: '12px 18px', 
                borderRadius: '8px', 
                background: '#f1f5f9', 
                color: '#475569', 
                border: '1px solid #cbd5e1', 
                fontSize: '0.85rem', 
                fontWeight: '700', 
                cursor: 'pointer'
              }}
            >
              Đã Hiểu
            </button>
          </div>

          {/* Checkbox: Don't show again today */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem', color: '#64748b' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={dontShowAgain} 
                onChange={e => setDontShowAgain(e.target.checked)} 
                style={{ accentColor: '#1d4ed8' }}
              />
              Không hiển thị lại thông báo này hôm nay
            </label>

            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: '700' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> Tin chính thức từ Thư viện
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
