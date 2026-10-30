import React from 'react';
import { 
  ShieldCheck, ArrowUp, ExternalLink, HelpCircle, FileText, 
  CheckCircle2, BookOpen, Layers, Terminal, Heart
} from 'lucide-react';

export default function Footer({ settings, stats, onOpenPolicy }) {
  const siteTitle = settings?.siteTitle || 'SmartLib';
  const address = settings?.address || '828 Sư Vạn Hạnh, Phường 13, Quận 10, TP. Hồ Chí Minh';
  const phone = settings?.contactPhone || '1900 6868';
  const email = settings?.contactEmail || 'hotro@smartlib.edu.vn';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer 
      style={{ 
        background: 'rgba(8, 12, 22, 0.95)', 
        color: '#ffffff', 
        padding: '48px 40px 24px', 
        marginTop: '80px', 
        position: 'relative',
        fontSize: '0.85rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="responsive-footer-grid" style={{ maxWidth: '1420px', margin: '0 auto' }}>
        
        {/* Column 1: Brand & Mission */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} color="#ffffff" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.02em', color: '#ffffff' }}>
              {siteTitle} <span style={{ color: '#818cf8', fontSize: '0.8rem', fontWeight: '700' }}>UNIVERSITY</span>
            </span>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.825rem', lineHeight: '1.6', marginBottom: '18px', maxWidth: '340px' }}>
            Nền tảng Quản lý Thư viện Số Thế Hệ Mới xây dựng trên nền tảng Spring Boot 3, Spring for GraphQL, React 19 và Cổng thanh toán VietQR SePay & VNPay.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <div><strong>Địa chỉ:</strong> {address}</div>
            <div><strong>Hotline:</strong> {phone} | <strong>Email:</strong> {email}</div>
          </div>
        </div>

        {/* Column 2: Quick Links & Dev Tools */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '14px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Liên Kết & Công Cụ
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', color: '#94a3b8' }}>
            <li>
              <a href="/graphiql" target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={14} /> GraphQL Playground (/graphiql)
              </a>
            </li>
            <li>
              <a href="http://localhost:8080/h2-console" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} /> H2 Database Console (/h2-console)
              </a>
            </li>
            <li>
              <span style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={() => onOpenPolicy('rules')}>
                ▸ Nội quy & Quy chế mượn trả
              </span>
            </li>
            <li>
              <span style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={() => onOpenPolicy('privacy')}>
                ▸ Chính sách bảo mật dữ liệu độc giả
              </span>
            </li>
            <li>
              <span style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={() => onOpenPolicy('copyright')}>
                ▸ Tuyên bố bản quyền & Sở hữu trí tuệ
              </span>
            </li>
          </ul>
        </div>

        {/* Column 3: Trust & Regulatory Seals */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '14px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Chứng Nhận Pháp Lý
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Bo Cong Thuong Badges (Only shown if moitVerificationEnabled is true) */}
            {settings?.moitVerificationEnabled !== false ? (
              <>
                {/* Bo Cong Thuong Registered Badge */}
                <div 
                  onClick={() => onOpenPolicy('moit')}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: 'rgba(255, 255, 255, 0.95)', 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    border: '1px solid #dc2626',
                    width: 'fit-content'
                  }}
                  title="Đã đăng ký sàn giao dịch thương mại điện tử với Bộ Công Thương"
                >
                  <div style={{ background: '#dc2626', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '11px' }}>
                    ✓
                  </div>
                  <div style={{ textAlign: 'left', lineHeight: '1.1' }}>
                    <div style={{ fontSize: '0.625rem', fontWeight: '800', color: '#dc2626' }}>ĐÃ ĐĂNG KÝ</div>
                    <div style={{ fontSize: '0.675rem', fontWeight: '900', color: '#1e293b' }}>BỘ CÔNG THƯƠNG</div>
                  </div>
                </div>

                {/* Bo Cong Thuong Notified Badge */}
                <div 
                  onClick={() => onOpenPolicy('moit')}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: 'rgba(255, 255, 255, 0.95)', 
                    padding: '6px 12px', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    border: '1px solid #0284c7',
                    width: 'fit-content'
                  }}
                  title="Đã thông báo website cung ứng dịch vụ với Bộ Công Thương"
                >
                  <div style={{ background: '#0284c7', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '11px' }}>
                    ✓
                  </div>
                  <div style={{ textAlign: 'left', lineHeight: '1.1' }}>
                    <div style={{ fontSize: '0.625rem', fontWeight: '800', color: '#0284c7' }}>ĐÃ THÔNG BÁO</div>
                    <div style={{ fontSize: '0.675rem', fontWeight: '900', color: '#1e293b' }}>BỘ CÔNG THƯƠNG</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.785rem', fontStyle: 'italic', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.15)' }}>
                ○ Chế độ kiểm thử nội bộ: Huy hiệu Bộ Công Thương đang tạm tắt theo cấu hình Admin.
              </div>
            )}

            {/* NCSC Trust Badge */}
            <div 
              onClick={() => onOpenPolicy('moit')}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'rgba(16, 185, 129, 0.1)', 
                padding: '5px 10px', 
                borderRadius: '6px', 
                border: '1px solid rgba(16, 185, 129, 0.3)',
                cursor: 'pointer',
                width: 'fit-content'
              }}
            >
              <ShieldCheck size={15} color="#34d399" />
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#86efac' }}>Tín nhiệm mạng NCSC Cấp 3</span>
            </div>
          </div>
        </div>

        {/* Column 4: Real-time Telemetry & Visitors */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '14px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Thông Tin Vận Hành Thực Tế
          </h4>

          <div className="glass-panel" style={{ padding: '14px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Đang truy cập:</span>
                <strong style={{ color: '#ffd600' }}>{stats?.onlineReaders || 28} độc giả</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Tổng tài liệu:</span>
                <strong style={{ color: '#38bdf8' }}>{stats?.totalBooks || 30} đầu sách ({stats?.totalCopies || 210} bản)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Lượt mượn phục vụ:</span>
                <strong style={{ color: '#ffffff' }}>{stats?.totalBorrows || 45} lượt</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Lượt tra cứu hôm nay:</span>
                <strong style={{ color: '#a7f3d0' }}>{Number(stats?.todaySearchHits || 345693).toLocaleString('vi-VN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#94a3b8' }}>Hệ thống:</span>
                <span style={{ color: '#34d399', fontWeight: '700' }}>● Uptime {stats?.systemUptime || '99.98%'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div style={{ maxWidth: '1420px', margin: '32px auto 0', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Đồ Án Chuyên Ngành J2EE • Spring Boot 3.3.4 • Spring for GraphQL • Spring Data JPA • React 19 • SePay VietQR & VNPay
        </div>

        <button 
          onClick={scrollToTop}
          title="Lên đầu trang"
          style={{
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '6px 14px',
            fontSize: '0.75rem',
            fontWeight: '700',
            cursor: 'pointer',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'; }}
        >
          <ArrowUp size={13} /> Lên đầu trang
        </button>
      </div>
    </footer>
  );
}
