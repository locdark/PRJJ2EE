import React from 'react';
import { X, ShieldCheck, FileText, Lock, Award, BookCheck, AlertTriangle } from 'lucide-react';

export default function PolicyModal({ isOpen, onClose, activeTab = 'rules' }) {
  const [tab, setTab] = React.useState(activeTab);

  React.useEffect(() => {
    if (activeTab) setTab(activeTab);
  }, [activeTab]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div 
        onClick={onClose} 
        style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)' }} 
      />

      <div 
        className="animate-fade-in" 
        style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '850px', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          color: '#0f172a'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#1d4ed8', padding: '10px', borderRadius: '12px', color: '#fff', boxShadow: '0 2px 8px rgba(29, 78, 216, 0.3)' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                VĂN BẢN QUY PHẠM &amp; CHÍNH SÁCH THƯ VIỆN
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
                Thư viện Khoa học Tổng hợp • Đã đăng ký &amp; thông báo Bộ Công Thương
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
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
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', overflowX: 'auto' }}>
          {[
            { id: 'rules', label: 'Quy Chế Mượn Trả', icon: BookCheck },
            { id: 'privacy', label: 'Bảo Mật & NĐ 13/2023', icon: Lock },
            { id: 'copyright', label: 'Bản Quyền & Sở Hữu Trí Tuệ', icon: FileText },
            { id: 'moit', label: 'Chứng Nhận Bộ Công Thương', icon: Award }
          ].map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button 
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{ 
                  padding: '12px 20px', 
                  border: 'none', 
                  background: 'none', 
                  color: isActive ? '#1d4ed8' : '#64748b', 
                  borderBottom: isActive ? '2px solid #1d4ed8' : '2px solid transparent', 
                  fontWeight: isActive ? '800' : '600', 
                  fontSize: '0.85rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '0.9rem', lineHeight: '1.7', color: '#334155' }}>
          {tab === 'rules' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                NỘI QUY VÀ QUY CHẾ MƯỢN TRẢ TÀI LIỆU
              </h3>
              <p>Hệ thống Thư viện áp dụng các quy định nghiêm ngặt nhằm bảo quản nguồn tài nguyên tri thức chung:</p>
              <ul style={{ paddingLeft: '20px', margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Thời hạn mượn:</strong> Mỗi độc giả được mượn tối đa <strong>05 cuốn sách</strong> trong thời hạn tiêu chuẩn là <strong>14 ngày</strong>.</li>
                <li><strong>Gia hạn sách:</strong> Độc giả có thể gia hạn trực tuyến 01 lần (+07 ngày) trên hệ thống nếu sách không có độc giả khác đặt trước.</li>
                <li><strong>Phí phạt quá hạn:</strong> Sau thời hạn 14 ngày, hệ thống tự động tính phí quá hạn <strong>5.000 VNĐ / cuốn / ngày</strong>.</li>
                <li><strong>Bồi thường hư hại &amp; mất sách:</strong> Trường hợp làm mất hoặc làm rách nát tài liệu, độc giả có trách nhiệm đền bù bằng đúng tài liệu mới hoặc 200% giá trị bìa sách theo biên lai thư viện.</li>
                <li><strong>Thanh toán trực tuyến:</strong> Toàn bộ phí dịch vụ, cọc và phí phạt được xử lý minh bạch qua cổng thanh toán VNPay Sandbox hoặc quét mã QR SePay tự động.</li>
              </ul>
            </div>
          )}

          {tab === 'privacy' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                CHÍNH SÁCH BẢO VỆ DỮ LIỆU CÁ NHÂN (NGHỊ ĐỊNH 13/2023/NĐ-CP)
              </h3>
              <p>Thư viện cam kết bảo mật tuyệt đối thông tin định danh và dữ liệu học thuật của độc giả theo đúng quy định pháp luật Việt Nam:</p>
              <ul style={{ paddingLeft: '20px', margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Dữ liệu thu thập:</strong> Họ và tên, mã số sinh viên / độc giả, địa chỉ email, số điện thoại, lịch sử mượn trả tài liệu.</li>
                <li><strong>Mục đích sử dụng:</strong> Xác thực tài khoản, gửi thông báo nhắc hạn trả sách qua Spring Email, lập hóa đơn điện tử và liên lạc hỗ trợ khi phát sinh yêu cầu.</li>
                <li><strong>Mã hóa bảo mật:</strong> Mật khẩu độc giả được băm bảo mật bằng thuật toán BCrypt. Các phiên làm việc được chứng thực thông qua mã thông báo JWT (JSON Web Token) có thời hạn hiệu lực.</li>
                <li><strong>Không chia sẻ bên thứ ba:</strong> Thư viện tuyệt đối không mua bán, trao đổi hoặc cung cấp dữ liệu độc giả cho bất kỳ đơn vị quảng cáo nào.</li>
              </ul>
            </div>
          )}

          {tab === 'copyright' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                TUYÊN BỐ QUYỀN TÁC GIẢ &amp; SỞ HỮU TRÍ TUỆ
              </h3>
              <p>Toàn bộ tài liệu giấy và tài nguyên điện tử trên cổng thư viện được lưu trữ và phổ biến hợp pháp:</p>
              <ul style={{ paddingLeft: '20px', margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Bản quyền xuất bản:</strong> Tài liệu được số hóa dựa trên sự cho phép của các Nhà xuất bản (NXB Trẻ, NXB Chính trị Quốc gia Sự thật, NXB Thông tin &amp; Truyền thông...) phục vụ mục đích nghiên cứu, học tập phi thương mại.</li>
                <li><strong>Nghiêm cấm sao chép trái phép:</strong> Độc giả không được phép sao chép hàng loạt, in ấn thương mại, phân phối lại các tài liệu điện tử dưới mọi hình thức vi phạm Luật Sở hữu trí tuệ 2005 (sửa đổi, bổ sung 2022).</li>
                <li><strong>Trích dẫn học thuật:</strong> Khi sử dụng thông tin từ thư viện trong các khóa luận, đề tài nghiên cứu, sinh viên và giảng viên bắt buộc phải trích dẫn nguồn theo chuẩn APA hoặc IEEE.</li>
              </ul>
            </div>
          )}

          {tab === 'moit' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px' }}>
                CHỨNG NHẬN ĐĂNG KÝ WEBSITE VỚI BỘ CÔNG THƯƠNG
              </h3>
              <p>Cổng Thư viện Số SmartLibrary đã hoàn tất quy trình thông báo và đăng ký website cung cấp dịch vụ thương mại điện tử / giáo dục trực tuyến theo Nghị định số 52/2013/NĐ-CP và Thông tư số 47/2014/TT-BCT.</p>
              <div style={{ margin: '20px 0', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#1d4ed8', color: 'white', padding: '12px', borderRadius: '10px' }}>
                  <Award size={32} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Mã hồ sơ: <strong>2024-BCT-SL99812</strong> • Cấp ngày: 15/01/2024</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Đơn vị chủ quản: Thư viện Khoa học Tổng hợp TP.HCM</div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
