import React, { useState, useEffect } from 'react';
import {
  BookMarked,
  Calendar,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  QrCode,
  Clock,
  MapPin,
  Download,
  Info,
  BookOpen,
} from 'lucide-react';
import { graphqlQuery } from '../services/api';
import { GET_MY_BORROWINGS, RENEW_BORROW } from '../services/graphqlQueries';
import { showToast } from '../components/Toast';

export default function MyBorrowingsView({ user, onPayFine }) {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
      showToast('Đã gia hạn sách thêm 7 ngày!', 'success');
      setTimeout(() => setActionMessage(''), 3000);
      loadMyBorrowings();
    } catch (err) {
      showToast(err.message || 'Không thể gia hạn sách', 'error');
    }
  };

  const handleExportCSV = () => {
    if (!borrowings || borrowings.length === 0) {
      showToast('Chưa có dữ liệu phiếu mượn để xuất file', 'warning');
      return;
    }

    const headers = [
      'Mã Phiếu Mượn',
      'Tên Tài Liệu / Giáo Trình',
      'Vị Trí Kệ',
      'Ngày Mượn',
      'Hạn Trả',
      'Ngày Trả Thực Tế',
      'Trạng Thái',
      'Phí Phạt (VNĐ)',
    ];

    const escapeCsv = (val) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = borrowings.map((rec) => [
      rec.borrowCode || `PM-${rec.id}`,
      rec.book?.title || 'Tài liệu thư viện',
      rec.book?.shelfLocation || 'A-01',
      rec.borrowDate || '',
      rec.dueDate || '',
      rec.returnDate || 'Chưa trả',
      rec.status === 'BORROWED'
        ? 'Đang mượn'
        : rec.status === 'RETURNED'
        ? 'Đã trả'
        : rec.status === 'OVERDUE'
        ? 'Quá hạn'
        : rec.status,
      rec.fineAmount || 0,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phieu-muon-thu-vien-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất danh sách phiếu mượn ra file CSV!', 'success');
  };

  const getDueDateMetrics = (rec) => {
    if (!rec.dueDate) {
      return { daysLeft: 14, progressPercent: 30, color: '#10b981', label: 'Đang trong hạn mượn' };
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(rec.dueDate);
    due.setHours(0, 0, 0, 0);
    const start = rec.borrowDate ? new Date(rec.borrowDate) : new Date(now.getTime() - 7 * 86400000);
    start.setHours(0, 0, 0, 0);

    const totalDays = Math.max(1, Math.round((due - start) / 86400000));
    const daysLeft = Math.round((due - now) / 86400000);
    const elapsedDays = Math.max(0, totalDays - daysLeft);
    const progressPercent = Math.min(100, Math.max(8, Math.round((elapsedDays / totalDays) * 100)));

    if (daysLeft < 0 || rec.status === 'OVERDUE') {
      return {
        daysLeft,
        progressPercent: 100,
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        label: `Quá hạn ${Math.abs(daysLeft)} ngày`,
      };
    }
    if (daysLeft <= 3) {
      return {
        daysLeft,
        progressPercent: Math.max(75, progressPercent),
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        label: daysLeft === 0 ? 'Hạn trả hôm nay!' : `Sắp đến hạn (còn ${daysLeft} ngày)`,
      };
    }
    return {
      daysLeft,
      progressPercent,
      color: '#10b981',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      label: `Còn ${daysLeft} ngày`,
    };
  };

  const activeCount = borrowings.filter(
    (r) => r.status === 'BORROWED' || r.status === 'PENDING'
  ).length;
  const overdueCount = borrowings.filter(
    (r) => r.status === 'OVERDUE' || (r.status === 'BORROWED' && new Date(r.dueDate) < new Date())
  ).length;
  const returnedCount = borrowings.filter((r) => r.status === 'RETURNED').length;

  const filteredBorrowings = borrowings.filter((rec) => {
    const isOverdue =
      rec.status === 'OVERDUE' || (rec.status === 'BORROWED' && new Date(rec.dueDate) < new Date());
    if (statusFilter === 'BORROWED') return rec.status === 'BORROWED' && !isOverdue;
    if (statusFilter === 'OVERDUE') return isOverdue;
    if (statusFilter === 'RETURNED') return rec.status === 'RETURNED';
    return true;
  });

  return (
    <div className="page-padding" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header & Digital Library Card */}
      <div className="my-borrowings-header-grid" style={{ marginBottom: '24px' }}>
        <div>
          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: '900',
              color: 'var(--text-main)',
              marginBottom: '8px',
            }}
          >
            Sách Đang Mượn &amp; Lịch Sử Lưu Thông
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.55 }}>
            Theo dõi thời hạn trả giáo trình, chủ động gia hạn trực tuyến và xuất phiếu mượn đối chiếu tại quầy lưu thông.
          </p>

          {actionMessage && (
            <div
              style={{
                marginTop: '14px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                padding: '10px 16px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '700',
              }}
            >
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
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#38bdf8',
                  fontWeight: '800',
                  letterSpacing: '0.05em',
                }}
              >
                THẺ THƯ VIỆN ĐẠI HỌC CHÍNH THỨC
              </div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: '900',
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                {user?.fullName || 'Độc Giả Thư Viện'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginTop: '2px' }}>
                {user?.email}
              </div>
            </div>
            <div
              style={{
                background: '#ffffff',
                padding: '6px',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              <QrCode size={40} color="#0f172a" />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              paddingTop: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>MÃ THẺ ĐỘC GIẢ</div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  color: '#f8fafc',
                  letterSpacing: '0.05em',
                }}
              >
                LIB-2026-{(user?.id || 101).toString().padStart(4, '0')}
              </div>
            </div>
            <span className="badge badge-success">ĐANG HOẠT ĐỘNG</span>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="my-borrowings-kpi-grid" style={{ marginBottom: '20px' }}>
        <div
          className="surface-card"
          style={{
            padding: '16px 18px',
            borderRadius: '12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>
            TỔNG PHIẾU MƯỢN
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>
            {borrowings.length} <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>phiếu</span>
          </div>
        </div>

        <div
          className="surface-card"
          style={{
            padding: '16px 18px',
            borderRadius: '12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>
            ĐANG LƯU HÀNH
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)', marginTop: '4px' }}>
            {activeCount} <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>cuốn</span>
          </div>
        </div>

        <div
          className="surface-card"
          style={{
            padding: '16px 18px',
            borderRadius: '12px',
            background: 'var(--bg-card)',
            border: overdueCount > 0 ? '1px solid #fecaca' : '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '700' }}>
            QUÁ HẠN CẦN TRẢ
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#dc2626', marginTop: '4px' }}>
            {overdueCount} <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>cuốn</span>
          </div>
        </div>

        <div
          className="surface-card"
          style={{
            padding: '16px 18px',
            borderRadius: '12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>
            ĐÃ HOÀN TRẢ
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
            {returnedCount} <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>cuốn</span>
          </div>
        </div>
      </div>

      {/* Renewal & Return Guide Banner */}
      <div
        style={{
          marginBottom: '20px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.82rem',
            color: 'var(--text-main)',
            lineHeight: 1.5,
          }}
        >
          <Info size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Hướng dẫn gia hạn &amp; trả sách:</strong> Độc giả được gia hạn trực tuyến thêm{' '}
            <strong>+7 ngày</strong> trước khi sách quá hạn. Khi trả sách tại Tầng 1, vui lòng xuất trình Mã Thẻ hoặc file phiếu mượn CSV.
          </span>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="btn btn-secondary"
          style={{
            padding: '8px 14px',
            fontSize: '0.8rem',
            fontWeight: '800',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <Download size={15} color="var(--primary)" /> Xuất phiếu mượn (CSV / In)
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '18px',
        }}
      >
        {[
          { id: 'ALL', label: `Tất cả (${borrowings.length})` },
          { id: 'BORROWED', label: `Đang mượn (${activeCount})` },
          { id: 'OVERDUE', label: `Quá hạn (${overdueCount})` },
          { id: 'RETURNED', label: `Đã trả (${returnedCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            style={{
              padding: '7px 14px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: '800',
              border:
                statusFilter === tab.id ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: statusFilter === tab.id ? 'var(--primary)' : 'var(--bg-card)',
              color: statusFilter === tab.id ? '#ffffff' : 'var(--text-main)',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Borrowings List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="skeleton-card" style={{ height: '120px' }}>
              <div className="skeleton" style={{ width: '100%', height: '100%' }} />
            </div>
          ))}
        </div>
      ) : filteredBorrowings.length === 0 ? (
        <div
          className="surface-card"
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <BookMarked size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3
            style={{
              fontSize: '1.2rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              marginBottom: '8px',
            }}
          >
            Không có phiếu mượn nào trong danh mục này
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Hãy truy cập kho sách để chọn và đăng ký mượn tài liệu học tập ngay nhé!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredBorrowings.map((rec) => {
            const isOverdue =
              rec.status === 'OVERDUE' ||
              (rec.status === 'BORROWED' && new Date(rec.dueDate) < new Date());
            const hasFine = rec.fineAmount && rec.fineAmount > 0;
            const dueMetrics = getDueDateMetrics(rec);

            return (
              <div
                key={rec.id}
                className="my-borrowings-item-grid surface-card"
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'var(--bg-card)',
                  border: isOverdue ? '1px solid #ef4444' : '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <img
                  src={
                    rec.book?.coverImage ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120'
                  }
                  alt={rec.book?.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120';
                  }}
                  style={{
                    width: '74px',
                    height: '102px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}
                />

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: 'var(--primary)',
                      }}
                    >
                      #{rec.borrowCode}
                    </span>
                    <span
                      className={`badge ${
                        rec.status === 'BORROWED' && !isOverdue
                          ? 'badge-info'
                          : rec.status === 'RETURNED'
                          ? 'badge-success'
                          : isOverdue
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {rec.status === 'BORROWED' && !isOverdue
                        ? 'Đang mượn'
                        : rec.status === 'RETURNED'
                        ? 'Đã trả'
                        : isOverdue
                        ? 'Quá hạn'
                        : rec.status}
                    </span>

                    {rec.status !== 'RETURNED' && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: dueMetrics.bg,
                          color: dueMetrics.color,
                          border: `1px solid ${dueMetrics.border}`,
                        }}
                      >
                        {dueMetrics.label}
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: '800',
                      color: 'var(--text-main)',
                      marginBottom: '6px',
                    }}
                  >
                    {rec.book?.title}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '16px',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} color="var(--primary)" /> Ngày mượn: {rec.borrowDate}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} color={isOverdue ? '#dc2626' : '#10b981'} />
                      Hạn trả:{' '}
                      <strong style={{ color: isOverdue ? '#dc2626' : '#10b981' }}>
                        {rec.dueDate}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color="var(--accent)" /> Kệ:{' '}
                      {rec.book?.shelfLocation || 'A-01'}
                    </div>
                  </div>

                  {/* Smart Due-Date Progress Bar */}
                  {rec.status !== 'RETURNED' && (
                    <div style={{ marginTop: '10px', maxWidth: '460px' }}>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          background: 'var(--bg-elevated)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            width: `${dueMetrics.progressPercent}%`,
                            height: '100%',
                            background: dueMetrics.color,
                            borderRadius: '999px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {hasFine && (
                    <div
                      style={{
                        marginTop: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#ef4444',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                      }}
                    >
                      <AlertTriangle size={15} /> Tiền phạt phát sinh:{' '}
                      {rec.fineAmount.toLocaleString('vi-VN')} VNĐ
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div
                  className="my-borrowings-actions"
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
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
                      <CreditCard size={14} /> Thanh toán phạt (
                      {rec.fineAmount.toLocaleString('vi-VN')}đ)
                    </button>
                  ) : (
                    rec.status === 'BORROWED' && (
                      <button
                        className="btn btn-sepay"
                        onClick={() => onPayFine(rec, 28000)}
                        style={{ fontSize: '0.8rem', padding: '8px 14px' }}
                      >
                        <QrCode size={14} /> Mã QR Thanh Toán
                      </button>
                    )
                  )}

                  {rec.status === 'RETURNED' && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700' }}>
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
