import React, { useState, useEffect } from 'react';
import { BookMarked, Calendar, AlertTriangle, RefreshCw, CreditCard, CheckCircle2, QrCode, Clock, MapPin } from 'lucide-react';
import { graphqlQuery } from '../services/api';
import { GET_MY_BORROWINGS, RENEW_BORROW } from '../services/graphqlQueries';

export default function MyBorrowingsView({ user, onPayFine }) {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    loadMyBorrowings();
  }, []);

  const loadMyBorrowings = async () => {
    setLoading(true);
    try {
      const data = await graphqlQuery(GET_MY_BORROWINGS);
      setBorrowings(data.myBorrowRecords || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (recordId) => {
    try {
      await graphqlQuery(RENEW_BORROW, { recordId, extraDays: 7 });
      setActionMessage('Gia hạn sách thêm 7 ngày thành công!');
      setTimeout(() => setActionMessage(''), 3000);
      loadMyBorrowings();
    } catch (err) {
      alert(err.message || 'Không thể gia hạn sách');
    }
  };

  return (
    <div className="page-padding" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header & Digital Library Card */}
      <div className="my-borrowings-header-grid" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>
            Sách Đang Mượn &amp; Lịch Sử
          </h1>
          <p style={{ color: '#475569', fontSize: '0.95rem' }}>
            Quản lý các tài liệu bạn đang mượn, gia hạn sách và thanh toán phí trễ hạn trực tuyến.
          </p>

          {actionMessage && (
            <div style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> {actionMessage}
            </div>
          )}
        </div>

        {/* Digital Library Card Badge */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '20px', 
            borderRadius: '18px', 
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
            border: '1px solid #1e293b',
            boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.05em' }}>THẺ THƯ VIỆN SỐ CHÍNH THỨC</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.01em' }}>{user?.fullName || 'Độc Giả Thư Viện'}</div>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginTop: '2px' }}>{user?.email}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
              <QrCode size={40} color="#0f172a" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>MÃ THẺ ĐỘC GIẢ</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.05em' }}>
                LIB-2026-{(user?.id || 101).toString().padStart(4, '0')}
              </div>
            </div>
            <span className="badge badge-success">HOẠT ĐỘNG</span>
          </div>
        </div>
      </div>

      {/* Borrowings List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          Đang tải danh sách mượn...
        </div>
      ) : borrowings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-card)' }}>
          <BookMarked size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Bạn chưa có phiếu mượn nào</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Hãy truy cập kho sách để chọn và đăng ký mượn tài liệu học tập ngay nhé!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {borrowings.map((rec) => {
            const isOverdue = rec.status === 'OVERDUE' || (rec.status === 'BORROWED' && new Date(rec.dueDate) < new Date());
            const hasFine = rec.fineAmount && rec.fineAmount > 0;

            return (
              <div 
                key={rec.id}
                className="my-borrowings-item-grid"
                style={{ 
                  padding: '20px', 
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: isOverdue ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <img 
                  src={rec.book?.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120'} 
                  alt={rec.book?.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120';
                  }}
                  style={{ width: '70px', height: '90px', objectFit: 'cover', borderRadius: '8px' }} 
                />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1d4ed8' }}>#{rec.borrowCode}</span>
                    <span className={`badge ${
                      rec.status === 'BORROWED' ? 'badge-info' :
                      rec.status === 'RETURNED' ? 'badge-success' :
                      rec.status === 'OVERDUE' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {rec.status === 'BORROWED' ? 'Đang mượn' :
                       rec.status === 'RETURNED' ? 'Đã trả' :
                       rec.status === 'OVERDUE' ? 'Quá hạn' : rec.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                    {rec.book?.title}
                  </h3>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} color="#2563eb" /> Ngày mượn: {rec.borrowDate}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} color={isOverdue ? '#dc2626' : '#16a34a'} /> 
                      Hạn trả: <strong style={{ color: isOverdue ? '#dc2626' : '#16a34a' }}>{rec.dueDate}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color="#0284c7" /> Kệ: {rec.book?.shelfLocation || 'A-01'}
                    </div>
                  </div>

                  {/* Cảnh báo tiền phạt */}
                  {hasFine && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.85rem', fontWeight: '700' }}>
                      <AlertTriangle size={15} /> Tiền phạt phát sinh: {rec.fineAmount.toLocaleString('vi-VN')} VNĐ
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rec.status === 'BORROWED' && !isOverdue && (
                    <button 
                      className="btn btn-outline"
                      onClick={() => handleRenew(rec.id)}
                      style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                    >
                      <RefreshCw size={14} /> Gia hạn (+7 ngày)
                    </button>
                  )}

                  {hasFine ? (
                    <button 
                      className="btn btn-sepay"
                      onClick={() => onPayFine(rec, rec.fineAmount)}
                      style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                    >
                      <CreditCard size={14} /> Thanh toán phạt ({rec.fineAmount.toLocaleString('vi-VN')}đ)
                    </button>
                  ) : rec.status === 'BORROWED' && (
                    <button 
                      className="btn btn-sepay"
                      onClick={() => onPayFine(rec, 28000)}
                      style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                    >
                      <QrCode size={14} /> Mã QR Thanh Toán
                    </button>
                  )}

                  {rec.status === 'RETURNED' && (
                    <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '600' }}>
                      ✓ Đã hoàn tất trả sách
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
