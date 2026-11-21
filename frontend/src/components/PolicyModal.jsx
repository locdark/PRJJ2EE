import React from 'react';
import { X, ShieldCheck, FileText, Lock, Award, BookCheck } from 'lucide-react';

export default function PolicyModal({ isOpen, onClose, activeTab = 'rules' }) {
  const [tab, setTab] = React.useState(activeTab);

  React.useEffect(() => {
    if (activeTab) setTab(activeTab);
  }, [activeTab]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
      />

      <div
        className="animate-fade-in"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '840px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          color: 'var(--text-main)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                background: 'var(--primary)',
                padding: '10px',
                borderRadius: '12px',
                color: 'var(--on-primary)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2
                className="editorial-heading"
                style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  margin: 0,
                }}
              >
                Văn bản quy phạm &amp; Chính sách Thư viện
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Thư viện Khoa học Tổng hợp • Đã thông báo Bộ Công Thương
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chính sách"
            style={{
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
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'rules', label: 'Quy chế mượn trả', icon: BookCheck },
            { id: 'privacy', label: 'Bảo mật dữ liệu', icon: Lock },
            { id: 'copyright', label: 'Bản quyền & SHTT', icon: FileText },
            { id: 'moit', label: 'Chứng nhận BCT', icon: Award },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: 'none',
                  color: isActive ? 'var(--primary-text)' : 'var(--text-muted)',
                  borderBottom: isActive
                    ? '2px solid var(--primary)'
                    : '2px solid transparent',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            fontSize: '0.92rem',
            lineHeight: '1.7',
            color: 'var(--text-secondary)',
          }}
        >
          {tab === 'rules' && (
            <div>
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '14px',
                }}
              >
                Nội quy và Quy chế mượn trả tài liệu
              </h3>
              <p>
                Hệ thống Thư viện áp dụng các quy định tiêu chuẩn nhằm bảo quản nguồn học liệu chung cho toàn thể bạn đọc:
              </p>
              <ul
                style={{
                  paddingLeft: '20px',
                  margin: '14px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <li>
                  <strong>Thời hạn mượn:</strong> Mỗi bạn đọc được mượn tối đa <strong>05 cuốn sách</strong> trong thời hạn tiêu chuẩn <strong>14 ngày</strong>.
                </li>
                <li>
                  <strong>Gia hạn sách:</strong> Độc giả có thể gia hạn trực tuyến thêm 07 ngày trên hệ thống nếu sách chưa có lượt đặt trước.
                </li>
                <li>
                  <strong>Phí phạt quá hạn:</strong> Sau thời hạn 14 ngày, hệ thống tự động tính phí quá hạn <strong>5.000 VNĐ / cuốn / ngày</strong>.
                </li>
                <li>
                  <strong>Bồi thường hư hại &amp; mất sách:</strong> Trường hợp làm mất hoặc hư hỏng nặng tài liệu, bạn đọc bồi thường bằng sách mới tương đương hoặc 200% giá trị bìa sách theo biên lai thư viện.
                </li>
                <li>
                  <strong>Thanh toán trực tuyến:</strong> Phí dịch vụ và phí quá hạn được xử lý minh bạch qua cổng VNPay hoặc quét mã VietQR SePay tự động.
                </li>
              </ul>
            </div>
          )}

          {tab === 'privacy' && (
            <div>
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '14px',
                }}
              >
                Chính sách bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP
              </h3>
              <p>
                Thư viện cam kết bảo mật thông tin định danh và dữ liệu học thuật của bạn đọc theo quy định pháp luật hiện hành:
              </p>
              <ul
                style={{
                  paddingLeft: '20px',
                  margin: '14px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <li>
                  <strong>Dữ liệu thu thập:</strong> Họ và tên, mã bạn đọc, địa chỉ email, số điện thoại và lịch sử mượn trả tài liệu.
                </li>
                <li>
                  <strong>Mục đích sử dụng:</strong> Xác thực thẻ bạn đọc, gửi thông báo nhắc hạn trả sách qua email, lập biên lai thu phí và hỗ trợ tra cứu.
                </li>
                <li>
                  <strong>An toàn thông tin:</strong> Mật khẩu và phiên đăng nhập được mã hóa theo tiêu chuẩn an toàn thông tin hiện đại, bảo vệ toàn vẹn tài khoản sinh viên và giảng viên.
                </li>
                <li>
                  <strong>Cam kết không chia sẻ:</strong> Thư viện tuyệt đối không mua bán, trao đổi hoặc cung cấp dữ liệu bạn đọc cho bất kỳ bên quảng cáo nào.
                </li>
              </ul>
            </div>
          )}

          {tab === 'copyright' && (
            <div>
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '14px',
                }}
              >
                Tuyên bố Quyền tác giả &amp; Sở hữu trí tuệ
              </h3>
              <p>
                Toàn bộ tài liệu in và tài nguyên số trên cổng thư viện được lưu trữ và phục vụ tra cứu hợp pháp:
              </p>
              <ul
                style={{
                  paddingLeft: '20px',
                  margin: '14px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <li>
                  <strong>Bản quyền xuất bản:</strong> Tài liệu được số hóa dựa trên thỏa thuận cấp phép từ các đối tác như NXB Trẻ, NXB Chính trị Quốc gia Sự thật, NXB Thông tin &amp; Truyền thông phục vụ học tập phi thương mại.
                </li>
                <li>
                  <strong>Quy định sao chép:</strong> Nghiêm cấm sao chép hàng loạt, in ấn thương mại hoặc phân phối lại học liệu vi phạm Luật Sở hữu trí tuệ hiện hành.
                </li>
                <li>
                  <strong>Trích dẫn học thuật:</strong> Khi sử dụng tài liệu trong khóa luận và nghiên cứu, sinh viên và giảng viên cần trích dẫn đầy đủ nguồn theo chuẩn APA hoặc IEEE.
                </li>
              </ul>
            </div>
          )}

          {tab === 'moit' && (
            <div>
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '14px',
                }}
              >
                Chứng nhận đăng ký website với Bộ Công Thương
              </h3>
              <p>
                Cổng Thư viện Số SmartLibrary đã hoàn tất thủ tục thông báo website cung cấp dịch vụ giáo dục trực tuyến theo Nghị định số 52/2013/NĐ-CP và Thông tư số 47/2014/TT-BCT.
              </p>
              <div
                style={{
                  margin: '20px 0',
                  padding: '16px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--on-primary)',
                    padding: '12px',
                    borderRadius: '10px',
                  }}
                >
                  <Award size={32} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: '800',
                      color: 'var(--text-main)',
                      fontSize: '0.95rem',
                    }}
                  >
                    ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Mã hồ sơ: <strong>2024-BCT-SL99812</strong> • Cấp ngày: 15/01/2024
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Đơn vị chủ quản: Thư viện Khoa học Tổng hợp TP.HCM
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
