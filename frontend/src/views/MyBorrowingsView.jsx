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

  const isRecordOverdue = (rec) =>
    rec.status === 'OVERDUE' ||
    (rec.status === 'BORROWED' && rec.dueDate && new Date(rec.dueDate) < new Date());

  const getDueDateMetrics = (rec) => {
    if (!rec.dueDate) {
      return {
        daysLeft: 14,
        progressPercent: 30,
        color: 'var(--success-text)',
        bg: 'var(--success-bg)',
        border: 'var(--success-border)',
        label: 'Đang trong hạn mượn',
      };
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(rec.dueDate);
    due.setHours(0, 0, 0, 0);
    const start = rec.borrowDate
      ? new Date(rec.borrowDate)
      : new Date(now.getTime() - 7 * 86400000);
    start.setHours(0, 0, 0, 0);

    const totalDays = Math.max(1, Math.round((due - start) / 86400000));
    const daysLeft = Math.round((due - now) / 86400000);
    const elapsedDays = Math.max(0, totalDays - daysLeft);
    const progressPercent = Math.min(100, Math.max(8, Math.round((elapsedDays / totalDays) * 100)));

    if (daysLeft < 0 || rec.status === 'OVERDUE') {
      return {
        daysLeft,
        progressPercent: 100,
        color: 'var(--danger-text)',
        bg: 'var(--danger-bg)',
        border: 'var(--danger-border)',
        label: `Quá hạn ${Math.abs(daysLeft)} ngày`,
      };
    }
    if (daysLeft <= 3) {
      return {
        daysLeft,
        progressPercent: Math.max(75, progressPercent),
        color: 'var(--warning-text)',
        bg: 'var(--warning-bg)',
        border: 'var(--warning-border)',
        label: daysLeft === 0 ? 'Hạn trả hôm nay' : `Còn ${daysLeft} ngày đến hạn`,
      };
    }
    return {
      daysLeft,
      progressPercent,
      color: 'var(--success-text)',
      bg: 'var(--success-bg)',
      border: 'var(--success-border)',
      label: `Còn ${daysLeft} ngày`,
    };
  };

  const activeCount = borrowings.filter(
    (r) => r.status === 'BORROWED' || r.status === 'PENDING'
  ).length;
  const overdueCount = borrowings.filter(isRecordOverdue).length;
  const returnedCount = borrowings.filter((r) => r.status === 'RETURNED').length;

  const filteredBorrowings = borrowings.filter((rec) => {
    const overdue = isRecordOverdue(rec);
    if (statusFilter === 'BORROWED') return rec.status === 'BORROWED' && !overdue;
    if (statusFilter === 'OVERDUE') return overdue;
    if (statusFilter === 'RETURNED') return rec.status === 'RETURNED';
    return true;
  });

  return (
    <div className="page-padding" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header & Digital Library Card */}
      <div className="my-borrowings-header-grid" style={{ marginBottom: '24px' }}>
        <div>
          <h1
            className="editorial-heading"
            style={{
              fontSize: '2.1rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              marginBottom: '8px',
            }}
          >
            Sách Đang Mượn &amp; Lịch Sử Lưu Thông
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.6 }}>
            Theo dõi thời hạn trả giáo trình, chủ động gia hạn trực tuyến và xuất phiếu mượn đối chiếu tại quầy lưu thông.
          </p>

          {actionMessage && (
            <div
              style={{
                marginTop: '14px',
                background: 'var(--success-bg)',
                border: '1px solid var(--success-border)',
                color: 'var(--success-text)',
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

        {/* Digital Library Card */}
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
            border: '1px solid #243b6b',
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
                  fontSize: '0.72rem',
                  color: '#7dd3fc',
                  fontWeight: '800',
                  letterSpacing: '0.05em',
                }}
              >
                THẺ THƯ VIỆN ĐẠI HỌC CHÍNH THỨC
              </div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: '800',
                  color: '#ffffff',
                  marginTop: '2px',
                }}
              >
                {user?.fullName || 'Độc Giả Thư Viện'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
                {user?.email}
              </div>
            </div>
            <div
              style={{
                background: '#ffffff', /* qr-quiet-zone */
                padding: '6px',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-sm)',
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
              borderTop: '1px solid rgba(255,255,255,0.16)',
              paddingTop: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>MÃ THẺ ĐỘC GIẢ</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  color: '#f8fafc',
                  letterSpacing: '0.04em',
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
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '700' }}>
            TỔNG PHIẾU MƯỢN
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>
            {borrowings.length} <span style={{ fontSize: '0.82rem', fontWeight: '600' }}>phiếu</span>
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
          <div style={{ fontSize: '0.76rem', color: 'var(--primary-text)', fontWeight: '700' }}>
            ĐANG LƯU HÀNH
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-text)', marginTop: '4px' }}>
            {activeCount} <span style={{ fontSize: '0.82rem', fontWeight: '600' }}>cuốn</span>
          </div>
        </div>

        <div
          className="surface-card"
          style={{
            padding: '16px 18px',
            borderRadius: '12px',
            background: 'var(--bg-card)',
            border: overdueCount > 0 ? '1px solid var(--danger-border)' : '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '0.76rem', color: 'var(--danger-text)', fontWeight: '700' }}>
            QUÁ HẠN CẦN TRẢ
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--danger-text)', marginTop: '4px' }}>
            {overdueCount} <span style={{ fontSize: '0.82rem', fontWeight: '600' }}>cuốn</span>
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
          <div style={{ fontSize: '0.76rem', color: 'var(--success-text)', fontWeight: '700' }}>
            ĐÃ HOÀN TRẢ
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--success-text)', marginTop: '4px' }}>
            {returnedCount} <span style={{ fontSize: '0.82rem', fontWeight: '600' }}>cuốn</span>
          </div>
        </div>
      </div>

      {/* Renewal & Return Guide Banner */}
      <div
        style={{
          marginBottom: '20px',
          padding: '14px 16px',
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
            fontSize: '0.84rem',
            color: 'var(--text-main)',
            lineHeight: 1.55,
          }}
        >
          <Info size={18} color="var(--primary-text)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Hướng dẫn gia hạn &amp; trả sách:</strong> Độc giả được gia hạn trực tuyến thêm{' '}
            <strong>7 ngày</strong> trước khi sách quá hạn. Khi trả sách tại Tầng 1, vui lòng xuất trình Mã Thẻ hoặc file CSV.
          </span>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem', fontWeight: '700', whiteSpace: 'nowrap' }}
        >
          <Download size={15} color="var(--primary-text)" /> Xuất phiếu mượn CSV
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
          { id: 'ALL', label: 'Tất cả', count: borrowings.length },
          { id: 'BORROWED', label: 'Đang mượn', count: activeCount },
          { id: 'OVERDUE', label: 'Quá hạn', count: overdueCount },
          { id: 'RETURNED', label: 'Đã trả', count: returnedCount },
        ].map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                minHeight: '38px',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: '700',
                border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: active ? 'var(--primary)' : 'var(--bg-card)',
                color: active ? 'var(--on-primary)' : 'var(--text-main)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{tab.label}</span>
              <span
                className="pill-count"
                style={
                  active
                    ? { background: 'rgba(255,255,255,0.22)', color: 'var(--on-primary)' }
                    : undefined
                }
              >
                {tab.count}
              </span>
            </button>
          );
        })}
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
            className="editorial-heading"
            style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              marginBottom: '8px',
            }}
          >
            Không có phiếu mượn nào trong danh mục này
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Hãy truy cập kho sách để chọn và đăng ký mượn tài liệu học tập.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredBorrowings.map((rec) => {
            const overdue = isRecordOverdue(rec);
            const hasFine = rec.fineAmount && rec.fineAmount > 0;
            const dueMetrics = getDueDateMetrics(rec);

            return (
              <div
                key={rec.id}
                className="my-borrowings-item-grid surface-card"
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  background: 'var(--bg-card)',
                  border: overdue ? '1px solid var(--danger-border)' : '1px solid var(--border)',
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
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        color: 'var(--primary-text)',
                      }}
                    >
                      #{rec.borrowCode}
                    </span>
                    <span
                      className={`badge ${
                        rec.status === 'BORROWED' && !overdue
                          ? 'badge-info'
                          : rec.status === 'RETURNED'
                          ? 'badge-success'
                          : overdue
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {rec.status === 'BORROWED' && !overdue
                        ? 'Đang mượn'
                        : rec.status === 'RETURNED'
                        ? 'Đã trả'
                        : overdue
                        ? 'Quá hạn'
                        : rec.status}
                    </span>

                    {rec.status !== 'RETURNED' && (
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          padding: '3px 10px',
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
                    className="editorial-heading"
                    style={{
                      fontSize: '1.12rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      marginBottom: '8px',
                    }}
                  >
                    {rec.book?.title}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '16px',
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <BookOpen size={14} color="var(--primary-text)" />
                      <span>Ngày mượn: {rec.borrowDate}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} color="var(--primary-text)" />
                      <span>Hạn trả: </span>
                      <strong style={{ color: overdue ? 'var(--danger-text)' : 'var(--text-main)' }}>
                        {rec.dueDate}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} color={overdue ? 'var(--danger-text)' : 'var(--success-text)'} />
                      <strong style={{ color: overdue ? 'var(--danger-text)' : 'var(--success-text)' }}>
                        {rec.status === 'RETURNED'
                          ? `Đã trả: ${rec.returnDate || 'Hoàn tất'}`
                          : overdue
                          ? 'Quá hạn trả'
                          : 'Trong thời hạn'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={14} color="var(--primary-text)" /> Kệ:{' '}
                      {rec.book?.shelfLocation || 'A-01'}
                    </div>
                  </div>

                  {rec.status !== 'RETURNED' && (
                    <div style={{ marginTop: '12px', maxWidth: '460px' }}>
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
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'var(--danger-bg)',
                        border: '1px solid var(--danger-border)',
                        color: 'var(--danger-text)',
                        fontSize: '0.84rem',
                        fontWeight: '700',
                      }}
                    >
                      <AlertTriangle size={15} /> Tiền phạt phát sinh:{' '}
                      {rec.fineAmount.toLocaleString('vi-VN')} VNĐ
                    </div>
                  )}
                </div>

                <div
                  className="my-borrowings-actions"
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  {rec.status === 'BORROWED' && !overdue && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleRenew(rec.id)}
                      style={{ fontSize: '0.82rem', minHeight: '40px' }}
                    >
                      <RefreshCw size={14} /> Gia hạn thêm 7 ngày
                    </button>
                  )}

                  {hasFine ? (
                    <button
                      type="button"
                      className="btn btn-sepay"
                      onClick={() => onPayFine(rec, rec.fineAmount)}
                      style={{ fontSize: '0.82rem', minHeight: '40px' }}
                    >
                      <CreditCard size={14} /> Thanh toán phạt •{' '}
                      {rec.fineAmount.toLocaleString('vi-VN')} VNĐ
                    </button>
                  ) : (
                    rec.status === 'BORROWED' && (
                      <button
                        type="button"
                        className="btn btn-sepay"
                        onClick={() => onPayFine(rec, 28000)}
                        style={{ fontSize: '0.82rem', minHeight: '40px' }}
                      >
                        <QrCode size={14} /> Chuyển khoản gia hạn 14 ngày • 28.000đ
                      </button>
                    )
                  )}

                  {rec.status === 'RETURNED' && (
                    <span
                      className="badge badge-success"
                      style={{ justifyContent: 'center', minHeight: '36px', fontSize: '0.8rem' }}
                    >
                      <CheckCircle2 size={14} /> Đã hoàn tất trả sách
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
