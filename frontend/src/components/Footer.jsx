import React from 'react';
import {
  ShieldCheck,
  ArrowUp,
  BookOpen,
} from 'lucide-react';

export default function Footer({ settings, stats, onOpenPolicy }) {
  const siteTitle = settings?.siteTitle || 'SmartLibrary';
  const address =
    settings?.address || '828 Sư Vạn Hạnh, Phường 13, Quận 10, TP. Hồ Chí Minh';
  const phone = settings?.contactPhone || '1900 6868';
  const email = settings?.contactEmail || 'hotro@smartlib.edu.vn';
  const openingHours = settings?.openingHours || 'Thứ 2 – Thứ 7 (07:30 – 21:00)';
  const totalBooks = stats?.totalBooks || 100;
  const totalCopies = stats?.totalCopies || 520;
  const availableCopies = stats?.availableCopies || (totalCopies - (stats?.activeBorrows || 12));
  const maxBorrowLimit = settings?.maxBorrowLimit || 5;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        padding: '48px 40px 24px',
        marginTop: '80px',
        position: 'relative',
        fontSize: '0.85rem',
        borderTop: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="responsive-footer-grid" style={{ maxWidth: '1420px', margin: '0 auto' }}>
        {/* Column 1: Brand & Mission */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div
              style={{
                background: 'var(--primary)',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={20} color="#ffffff" />
            </div>
            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: '900',
                letterSpacing: '-0.02em',
                color: 'var(--text-main)',
              }}
            >
              {siteTitle}{' '}
              <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700' }}>
                UNIVERSITY
              </span>
            </span>
          </div>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.825rem',
              lineHeight: '1.6',
              marginBottom: '18px',
              maxWidth: '340px',
            }}
          >
            Trung tâm Thông tin – Thư viện Đại học cung cấp nguồn học liệu học thuật, giáo trình chuyên ngành,
            luận văn và cơ sở dữ liệu nghiên cứu phục vụ giảng viên, học viên và sinh viên.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary, var(--text-main))',
            }}
          >
            <div>
              <strong>Địa chỉ:</strong> {address}
            </div>
            <div>
              <strong>Hotline:</strong> {phone} | <strong>Email:</strong> {email}
            </div>
          </div>
        </div>

        {/* Column 2: Reader Services & Support */}
        <div>
          <h4
            style={{
              fontSize: '0.9rem',
              fontWeight: '800',
              marginBottom: '14px',
              color: 'var(--text-main)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Dịch Vụ &amp; Hỗ Trợ Độc Giả
          </h4>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              color: 'var(--text-muted)',
            }}
          >
            <li>
              <span
                style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
                onClick={() => onOpenPolicy('rules')}
              >
                ▸ Hướng dẫn tra cứu &amp; Mượn trả sách
              </span>
            </li>
            <li>
              <span
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => onOpenPolicy('rules')}
              >
                ▸ Nội quy &amp; Quy chế Thư viện
              </span>
            </li>
            <li>
              <span
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => onOpenPolicy('privacy')}
              >
                ▸ Chính sách bảo mật thông tin độc giả
              </span>
            </li>
            <li>
              <span
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => onOpenPolicy('copyright')}
              >
                ▸ Bản quyền học liệu &amp; Sở hữu trí tuệ
              </span>
            </li>
            <li>
              <span
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => onOpenPolicy('rules')}
              >
                ▸ Đăng ký phòng học nhóm &amp; Không gian đọc
              </span>
            </li>
          </ul>
        </div>

        {/* Column 3: Trust & Regulatory Seals */}
        <div>
          <h4
            style={{
              fontSize: '0.9rem',
              fontWeight: '800',
              marginBottom: '14px',
              color: 'var(--text-main)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Chứng Nhận Pháp Lý
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {settings?.moitVerificationEnabled !== false ? (
              <>
                <div
                  onClick={() => onOpenPolicy('moit')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--bg-elevated)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid #dc2626',
                    width: 'fit-content',
                  }}
                  title="Đã đăng ký cổng dịch vụ học liệu số với Bộ Công Thương"
                >
                  <div
                    style={{
                      background: '#dc2626',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '11px',
                    }}
                  >
                    ✓
                  </div>
                  <div style={{ textAlign: 'left', lineHeight: '1.1' }}>
                    <div style={{ fontSize: '0.625rem', fontWeight: '800', color: '#dc2626' }}>
                      ĐÃ ĐĂNG KÝ
                    </div>
                    <div style={{ fontSize: '0.675rem', fontWeight: '900', color: 'var(--text-main)' }}>
                      BỘ CÔNG THƯƠNG
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => onOpenPolicy('moit')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--bg-elevated)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid #0284c7',
                    width: 'fit-content',
                  }}
                  title="Đã thông báo website cung ứng dịch vụ với Bộ Công Thương"
                >
                  <div
                    style={{
                      background: '#0284c7',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '11px',
                    }}
                  >
                    ✓
                  </div>
                  <div style={{ textAlign: 'left', lineHeight: '1.1' }}>
                    <div style={{ fontSize: '0.625rem', fontWeight: '800', color: '#0284c7' }}>
                      ĐÃ THÔNG BÁO
                    </div>
                    <div style={{ fontSize: '0.675rem', fontWeight: '900', color: 'var(--text-main)' }}>
                      BỘ CÔNG THƯƠNG
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.785rem',
                  fontStyle: 'italic',
                  background: 'var(--bg-elevated)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px dashed var(--border)',
                }}
              >
                ○ Huy hiệu Bộ Công Thương đang tạm ẩn theo cấu hình Quản trị viên.
              </div>
            )}

            <div
              onClick={() => onOpenPolicy('moit')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                cursor: 'pointer',
                width: 'fit-content',
              }}
            >
              <ShieldCheck size={15} color="#10b981" />
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#10b981' }}>
                Chuẩn Thư Viện Đại Học Quốc Gia
              </span>
            </div>
          </div>
        </div>

        {/* Column 4: Real-World Library Operating Information */}
        <div>
          <h4
            style={{
              fontSize: '0.9rem',
              fontWeight: '800',
              marginBottom: '14px',
              color: 'var(--text-main)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Thông Tin Hoạt Động Thư Viện
          </h4>

          <div
            className="surface-card"
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Giờ mở cửa:</span>
                <strong style={{ color: 'var(--text-main)', textAlign: 'right' }}>{openingHours}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tổng học liệu:</span>
                <strong style={{ color: 'var(--primary)' }}>
                  {totalBooks} đầu sách ({totalCopies} bản)
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sách sẵn sàng mượn:</span>
                <strong style={{ color: '#059669' }}>{availableCopies} bản</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hỗ trợ mượn tối đa:</span>
                <strong style={{ color: '#d97706' }}>
                  {maxBorrowLimit} cuốn / {settings?.defaultBorrowDays || 14} ngày
                </strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '8px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Không gian đọc:</span>
                <span style={{ color: '#10b981', fontWeight: '700', textAlign: 'right' }}>
                  Tầng 1 – Tầng 4 (Tự học &amp; Nhóm)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          maxWidth: '1420px',
          margin: '32px auto 0',
          paddingTop: '20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          © 2026 Trung tâm Thông tin – Thư viện Đại học ({siteTitle} University). Mọi quyền được bảo lưu.
        </div>

        <button
          onClick={scrollToTop}
          title="Lên đầu trang"
          className="btn btn-outline"
          style={{
            padding: '6px 14px',
            fontSize: '0.75rem',
            fontWeight: '700',
            borderRadius: '8px',
          }}
        >
          <ArrowUp size={13} /> Lên đầu trang
        </button>
      </div>
    </footer>
  );
}
