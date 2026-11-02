import React, { useState, useEffect } from 'react';
import { Check, X, RotateCcw, Search, Download } from 'lucide-react';
import { graphqlQuery } from '../services/api';
import {
  GET_ALL_BORROW_RECORDS,
  APPROVE_BORROW,
  RETURN_BOOK,
} from '../services/graphqlQueries';
import { showToast } from '../components/Toast';

export default function BorrowManagementView() {
  const [records, setRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  // Return Book Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDamaged, setIsDamaged] = useState(false);
  const [isLost, setIsLost] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [statusFilter]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await graphqlQuery(GET_ALL_BORROW_RECORDS, {
        status: statusFilter || null,
        keyword: keyword || null,
      });
      setRecords(data.allBorrowRecords || []);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải danh sách phiếu mượn', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recordId) => {
    try {
      await graphqlQuery(APPROVE_BORROW, { recordId });
      showToast('Đã duyệt phiếu mượn sách thành công!', 'success');
      loadRecords();
    } catch (err) {
      showToast(err.message || 'Lỗi duyệt mượn', 'error');
    }
  };

  const handleConfirmReturn = async () => {
    if (!selectedRecord) return;
    try {
      await graphqlQuery(RETURN_BOOK, {
        recordId: selectedRecord.id,
        damaged: isDamaged,
        lost: isLost,
      });
      showToast(
        `Đã xác nhận hoàn trả sách cho phiếu #${selectedRecord.borrowCode}`,
        'success'
      );
      setSelectedRecord(null);
      setIsDamaged(false);
      setIsLost(false);
      loadRecords();
    } catch (err) {
      showToast(err.message || 'Lỗi xử lý trả sách', 'error');
    }
  };

  const handleExportCSV = () => {
    if (!records.length) {
      showToast('Không có dữ liệu phiếu mượn để xuất', 'warning');
      return;
    }
    const headers = [
      'Mã Phiếu',
      'Độc Giả',
      'Email',
      'Sách Mượn',
      'Mã ISBN',
      'Ngày Mượn',
      'Hạn Trả',
      'Ngày Trả',
      'Trạng Thái',
      'Tiền Phạt (VND)',
    ];
    const rows = records.map((r) => [
      r.id,
      `"${(r.user?.fullName || '').replace(/"/g, '""')}"`,
      `"${r.user?.email || ''}"`,
      `"${(r.book?.title || '').replace(/"/g, '""')}"`,
      `"${r.book?.isbn || ''}"`,
      r.borrowDate || '',
      r.dueDate || '',
      r.returnDate || '',
      r.status || '',
      r.fineAmount || 0,
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `danh_sach_phieu_muon_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Đã xuất ${records.length} phiếu mượn ra tệp CSV`, 'success');
  };

  return (
    <div style={{ width: '100%', padding: '0 0 60px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: '900',
              color: 'var(--text-main)',
              marginBottom: '6px',
            }}
          >
            Quản Lý Mượn &amp; Nhận Trả Sách
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Dành cho Thủ thư: Duyệt yêu cầu mượn, ghi nhận trả sách, xử lý vi phạm trễ hạn hoặc hỏng/mất sách
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleExportCSV}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Download size={16} color="var(--primary)" /> Xuất Excel / CSV
        </button>
      </div>

      {/* Filter bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Tìm theo mã phiếu, tên độc giả, email, sách..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadRecords();
            }}
          />
          <button className="btn btn-primary" onClick={loadRecords}>
            <Search size={16} /> Tìm
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['', 'BORROWED', 'OVERDUE', 'RETURNED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            >
              {st === ''
                ? 'Tất cả'
                : st === 'BORROWED'
                ? 'Đang mượn'
                : st === 'OVERDUE'
                ? 'Quá hạn'
                : 'Đã trả'}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '16px' }}>
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Độc giả</th>
              <th>Sách mượn</th>
              <th>Ngày mượn &amp; Hạn</th>
              <th>Trạng thái</th>
              <th>Tiền phạt</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td colSpan={7}>
                    <div className="skeleton" style={{ height: '46px', width: '100%' }} />
                  </td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Không có dữ liệu phiếu mượn nào phù hợp.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: '800', color: 'var(--primary)' }}>
                    #{r.borrowCode}
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                      {r.user?.fullName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.user?.email}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                      {r.book?.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Kệ: {r.book?.shelfLocation || 'A-01'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      Mượn: {r.borrowDate}
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: r.status === 'OVERDUE' ? '#dc2626' : '#059669',
                        fontWeight: '700',
                      }}
                    >
                      Hạn: {r.dueDate}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        r.status === 'BORROWED'
                          ? 'badge-info'
                          : r.status === 'RETURNED'
                          ? 'badge-success'
                          : r.status === 'OVERDUE'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {r.status === 'BORROWED'
                        ? 'Đang mượn'
                        : r.status === 'RETURNED'
                        ? 'Đã trả'
                        : r.status === 'OVERDUE'
                        ? 'Quá hạn'
                        : r.status}
                    </span>
                  </td>
                  <td
                    style={{
                      fontWeight: '700',
                      color: r.fineAmount > 0 ? '#dc2626' : 'var(--text-muted)',
                    }}
                  >
                    {r.fineAmount ? r.fineAmount.toLocaleString('vi-VN') + ' đ' : '0 đ'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {r.status === 'PENDING' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleApprove(r.id)}
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        <Check size={14} /> Duyệt mượn
                      </button>
                    )}

                    {(r.status === 'BORROWED' || r.status === 'OVERDUE') && (
                      <button
                        className="btn btn-success"
                        onClick={() => setSelectedRecord(r)}
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        <RotateCcw size={14} /> Nhận trả sách
                      </button>
                    )}

                    {r.status === 'RETURNED' && (
                      <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>
                        ✓ Hoàn tất
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Return Book Modal */}
      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
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
              maxWidth: '480px',
              padding: '28px',
              position: 'relative',
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xl)',
              color: 'var(--text-main)',
            }}
          >
            <button
              onClick={() => setSelectedRecord(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>

            <h3
              style={{
                fontSize: '1.3rem',
                fontWeight: '900',
                color: 'var(--text-main)',
                marginBottom: '8px',
                letterSpacing: '-0.02em',
              }}
            >
              Xác Nhận Nhận Trả Sách
            </h3>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '20px',
                fontWeight: '600',
              }}
            >
              Phiếu #{selectedRecord.borrowCode} • {selectedRecord.book?.title}
            </p>

            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={isDamaged}
                  onChange={(e) => {
                    setIsDamaged(e.target.checked);
                    if (e.target.checked) setIsLost(false);
                  }}
                />
                <span style={{ color: '#d97706', fontWeight: '700' }}>
                  Sách bị rách / hư hỏng (Phạt 50% giá bìa)
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={isLost}
                  onChange={(e) => {
                    setIsLost(e.target.checked);
                    if (e.target.checked) setIsDamaged(false);
                  }}
                />
                <span style={{ color: '#dc2626', fontWeight: '700' }}>
                  Sách bị mất (Phạt 150% giá bìa)
                </span>
              </label>
            </div>

            <button
              className="btn btn-success"
              onClick={handleConfirmReturn}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '800' }}
            >
              <Check size={18} /> Xác Nhận Trả Sách Vào Kho
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
