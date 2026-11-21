import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calendar,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  QrCode,
  Receipt,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { graphqlQuery, createSepayQR, createVNPayUrl, checkSepayStatus } from '../services/api';
import { REQUEST_BORROW } from '../services/graphqlQueries';
import { showToast } from './Toast';

export default function BorrowModal({ book, isOpen, onClose, onSuccess, onViewMyBorrowings }) {
  const DAILY_RATE = 2000;

  const today = useMemo(() => new Date(), []);

  const defaultDueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  }, []);

  const [returnDateStr, setReturnDateStr] = useState(defaultDueDate);
  const [paymentMethod, setPaymentMethod] = useState('SEPAY');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successRecord, setSuccessRecord] = useState(null);

  const [sepayData, setSepayData] = useState(null);
  const [vnpayUrl, setVnpayUrl] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (isOpen && book) {
      setReturnDateStr(defaultDueDate);
      setPaymentMethod('SEPAY');
      setNote('');
      setLoading(false);
      setError('');
      setSuccessRecord(null);
      setSepayData(null);
      setVnpayUrl('');
      setCopiedField('');
      setIsPaid(false);
      setCheckingStatus(false);
    }
  }, [isOpen, book, defaultDueDate]);

  useEffect(() => {
    if (!isOpen || !sepayData?.transactionId || isPaid) return;

    const timer = setInterval(async () => {
      try {
        const payment = await checkSepayStatus(sepayData.transactionId);
        if (payment && payment.status === 'SUCCESS') {
          setIsPaid(true);
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
          showToast('Đã nhận chuyển khoản ngân hàng thành công!', 'success');
          if (onSuccess) onSuccess();
        }
      } catch {}
    }, 2000);

    return () => clearInterval(timer);
  }, [isOpen, sepayData, isPaid, onSuccess]);

  if (!isOpen || !book) return null;

  const minDateStr = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  })();

  const maxDateStr = (() => {
    const maxD = new Date();
    maxD.setDate(maxD.getDate() + 90);
    return maxD.toISOString().split('T')[0];
  })();

  const calculateDays = (dateStr) => {
    const selected = new Date(dateStr);
    const diffTime = selected.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const daysCount = calculateDays(returnDateStr);
  const totalRentalFee = daysCount * DAILY_RATE;

  const formattedReturnDate = (() => {
    try {
      const parts = returnDateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(returnDateStr).toLocaleDateString('vi-VN');
    } catch {
      return returnDateStr;
    }
  })();

  const handlePresetDays = (presetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + presetDays);
    setReturnDateStr(d.toISOString().split('T')[0]);
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleCheckSepayStatus = async () => {
    if (!sepayData?.transactionId) return;
    setCheckingStatus(true);
    try {
      const payment = await checkSepayStatus(sepayData.transactionId);
      if (payment && payment.status === 'SUCCESS') {
        setIsPaid(true);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
        showToast('Đã xác nhận thanh toán ngân hàng thành công!', 'success');
        if (onSuccess) onSuccess();
      } else {
        showToast(
          'Hệ thống đang chờ thông báo biến động số dư từ ngân hàng và sẽ tự cập nhật ngay khi nhận tiền.',
          'info'
        );
      }
    } catch {
      showToast('Không thể kiểm tra trạng thái giao dịch lúc này.', 'warning');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const methodLabel =
        paymentMethod === 'COUNTER'
          ? 'Tại quầy'
          : paymentMethod === 'SEPAY'
          ? 'VietQR SePay'
          : 'VNPay';
      const formattedNote = `Thuê ${daysCount} ngày • Phí ${totalRentalFee.toLocaleString('vi-VN')} VNĐ • ${methodLabel}${note ? ' • ' + note : ''}`;

      const data = await graphqlQuery(REQUEST_BORROW, {
        bookId: book.id,
        days: daysCount,
        note: formattedNote,
      });

      setSuccessRecord(data.requestBorrow);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      if (onSuccess) onSuccess(data.requestBorrow);

      if (paymentMethod === 'SEPAY') {
        try {
          const sData = await createSepayQR(data.requestBorrow.id, totalRentalFee);
          setSepayData(sData);
        } catch (qrErr) {
          console.error('Lỗi tạo mã VietQR:', qrErr);
        }
      } else if (paymentMethod === 'VNPAY') {
        try {
          const vData = await createVNPayUrl(data.requestBorrow.id, totalRentalFee);
          setVnpayUrl(vData.paymentUrl);
        } catch (vnErr) {
          console.error('Lỗi tạo link VNPay:', vnErr);
        }
      }
    } catch (err) {
      setError(err.message || 'Mượn sách không thành công');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (onViewMyBorrowings) {
      onViewMyBorrowings();
    } else {
      onClose();
    }
  };

  return (
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
        overflowY: 'auto',
      }}
    >
      <div
        className="animate-fade-in modal-responsive-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-xl)',
          color: 'var(--text-main)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp thoại mượn sách"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {successRecord ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--success-bg)',
                border: '2px solid var(--success-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <CheckCircle2 size={34} color="var(--success-text)" />
            </div>

            <h3
              className="editorial-heading"
              style={{
                fontSize: '1.35rem',
                fontWeight: '700',
                color: isPaid ? 'var(--success-text)' : 'var(--text-main)',
                marginBottom: '6px',
              }}
            >
              {isPaid ? 'Đã Thanh Toán & Thuê Sách Thành Công' : 'Đã Đăng Ký Mượn Sách Thành Công'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '18px' }}>
              Mã phiếu mượn:{' '}
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-text)' }}>
                #{successRecord.borrowCode}
              </strong>{' '}
              • Vị trí kệ: <strong style={{ color: 'var(--text-main)' }}>{book.shelfLocation || 'Kệ A-01'}</strong>
            </p>

            {paymentMethod === 'SEPAY' && (
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '18px',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--primary)',
                    color: 'var(--on-primary)',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                  }}
                >
                  <QrCode size={14} /> VIETQR SEPAY • {totalRentalFee.toLocaleString('vi-VN')} VNĐ
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <div
                    style={{
                      padding: '10px',
                      background: '#ffffff', /* qr-quiet-zone */
                      borderRadius: '14px',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {sepayData ? (
                      <img
                        src={sepayData.qrUrl}
                        alt="VietQR SePay"
                        style={{ width: '180px', height: '180px', display: 'block', borderRadius: '8px' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '180px',
                          height: '180px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <Loader2 className="animate-spin" size={28} color="var(--primary-text)" style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '0.78rem', fontWeight: '600' }}>Đang nạp mã QR...</span>
                      </div>
                    )}
                  </div>
                </div>

                {sepayData && (
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      textAlign: 'left',
                      fontSize: '0.82rem',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Ngân hàng</span>
                      <strong style={{ color: 'var(--text-main)', textAlign: 'right' }}>
                        {sepayData.bankCode} • {sepayData.accountName}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Số tài khoản</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                          {sepayData.accountNumber}
                        </strong>
                        <button
                          type="button"
                          aria-label="Sao chép số tài khoản"
                          onClick={() => copyToClipboard(sepayData.accountNumber, 'acc')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: copiedField === 'acc' ? 'var(--success-text)' : 'var(--primary-text)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Số tiền</span>
                      <strong style={{ color: 'var(--success-text)', fontSize: '0.92rem' }}>
                        {totalRentalFee.toLocaleString('vi-VN')} VNĐ
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Nội dung chuyển khoản</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--warning-text)',
                            background: 'var(--warning-bg)',
                            border: '1px solid var(--warning-border)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {sepayData.paymentCode}
                        </strong>
                        <button
                          type="button"
                          aria-label="Sao chép mã giao dịch"
                          onClick={() => copyToClipboard(sepayData.paymentCode, 'code')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: copiedField === 'code' ? 'var(--success-text)' : 'var(--primary-text)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!isPaid ? (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--info-text)',
                        fontWeight: '600',
                        marginBottom: '10px',
                        background: 'var(--info-bg)',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--info-border)',
                      }}
                    >
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang tự động đồng bộ xác nhận từ ngân hàng...</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckSepayStatus}
                      disabled={checkingStatus || !sepayData}
                      className="btn btn-sepay"
                      style={{ width: '100%', minHeight: '42px', fontSize: '0.84rem' }}
                    >
                      {checkingStatus ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <RefreshCw size={15} />
                      )}
                      {checkingStatus ? 'Đang kiểm tra giao dịch...' : 'Tôi đã chuyển khoản — Kiểm tra ngay'}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'var(--success-bg)',
                      color: 'var(--success-text)',
                      border: '1px solid var(--success-border)',
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={16} /> Đã hoàn tất thanh toán tiền thuê qua VietQR SePay
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'VNPAY' && (
              <div
                style={{
                  background: 'var(--info-bg)',
                  border: '1px solid var(--info-border)',
                  borderRadius: '16px',
                  padding: '18px',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--primary)',
                    color: 'var(--on-primary)',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    marginBottom: '10px',
                  }}
                >
                  <CreditCard size={14} /> CỔNG THANH TOÁN VNPAY
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Tổng phí thuê: <strong style={{ color: 'var(--info-text)' }}>{totalRentalFee.toLocaleString('vi-VN')} VNĐ</strong>
                </p>
                {vnpayUrl ? (
                  <a
                    href={vnpayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sepay"
                    style={{ width: '100%', minHeight: '42px', textDecoration: 'none' }}
                  >
                    <ExternalLink size={16} /> Mở Cổng VNPay Sandbox Để Thanh Toán
                  </a>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: 'var(--text-muted)',
                      fontSize: '0.84rem',
                    }}
                  >
                    <Loader2 className="animate-spin" size={16} /> Đang kết nối cổng VNPay...
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'COUNTER' && (
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '20px',
                  textAlign: 'left',
                  fontSize: '0.84rem',
                }}
              >
                <div
                  style={{
                    color: 'var(--success-text)',
                    fontWeight: '700',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={16} /> Thanh toán tiền mặt tại quầy thư viện
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Vui lòng mang mã phiếu{' '}
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-text)' }}>
                    #{successRecord.borrowCode}
                  </strong>{' '}
                  đến quầy thủ thư để nhận sách và thanh toán{' '}
                  <strong>{totalRentalFee.toLocaleString('vi-VN')} VNĐ</strong>.
                </div>
              </div>
            )}

            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'left',
                marginBottom: '20px',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tác phẩm</span>
                <strong style={{ color: 'var(--text-main)', textAlign: 'right' }}>{book.title}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Thời gian mượn</span>
                <strong style={{ color: 'var(--text-main)' }}>
                  {daysCount} ngày • Trả {formattedReturnDate}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tổng tiền thuê</span>
                <strong style={{ color: 'var(--primary-text)' }}>
                  {totalRentalFee.toLocaleString('vi-VN')} VNĐ
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleFinish}
              style={{ width: '100%', minHeight: '44px', fontSize: '0.92rem' }}
            >
              Hoàn Tất &amp; Xem Sách Đang Mượn
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingRight: '32px' }}>
              <div
                style={{
                  background: 'var(--primary)',
                  padding: '12px',
                  borderRadius: '12px',
                  color: 'var(--on-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={24} />
              </div>
              <div>
                <h3
                  className="editorial-heading"
                  style={{ fontSize: '1.28rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}
                >
                  Xác Nhận Đăng Ký Mượn Sách
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Chọn lịch trả dự kiến và phương thức thanh toán phí thuê
                </p>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger-text)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
              }}
            >
              <img
                src={book.coverImage}
                alt={book.title}
                style={{
                  width: '50px',
                  height: '68px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    color: 'var(--text-main)',
                    marginBottom: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {book.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Tác giả: {book.author?.name || 'Chưa cập nhật'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--primary-text)', fontWeight: '700' }}>
                  Vị trí kệ: {book.shelfLocation || 'Kệ A-01'}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-main)',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={15} color="var(--primary-text)" /> Chọn lịch trả sách
                  </span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Tối đa 90 ngày
                  </span>
                </label>

                <div className="preset-grid-4" style={{ marginBottom: '10px' }}>
                  {[
                    { days: 7, label: '7 ngày' },
                    { days: 14, label: '14 ngày' },
                    { days: 30, label: '30 ngày' },
                    { days: 60, label: '60 ngày' },
                  ].map((p) => {
                    const isSelected = daysCount === p.days;
                    return (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => handlePresetDays(p.days)}
                        style={{
                          minHeight: '38px',
                          padding: '8px 6px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: isSelected ? 'var(--primary-light)' : 'var(--bg-elevated)',
                          color: isSelected ? 'var(--primary-text)' : 'var(--text-secondary)',
                          fontWeight: '700',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="date"
                  min={minDateStr}
                  max={maxDateStr}
                  value={returnDateStr}
                  onChange={(e) => setReturnDateStr(e.target.value)}
                  className="input-field"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>
                    Bắt đầu: <strong style={{ color: 'var(--text-main)' }}>{new Date().toLocaleDateString('vi-VN')}</strong>
                  </span>
                  <span>
                    Hạn trả: <strong style={{ color: 'var(--primary-text)' }}>{formattedReturnDate}</strong> •{' '}
                    <strong>{daysCount} ngày</strong>
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '10px',
                  }}
                >
                  <Receipt size={15} color="var(--primary-text)" /> Chi tiết phí thuê tài liệu
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Thời gian thuê</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{daysCount} ngày</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Đơn giá thư viện</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {DAILY_RATE.toLocaleString('vi-VN')} VNĐ / ngày
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tiền cọc thẻ bạn đọc</span>
                    <span style={{ fontWeight: '700', color: 'var(--success-text)' }}>Miễn phí</span>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      Tổng phí thanh toán
                    </span>
                    <span style={{ fontWeight: '800', color: 'var(--primary-text)', fontSize: '1.12rem' }}>
                      {totalRentalFee.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    fontWeight: '700',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Phương thức thanh toán
                </label>
                <div className="payment-method-grid-3">
                  {[
                    { id: 'COUNTER', label: 'Tại quầy' },
                    { id: 'SEPAY', label: 'VietQR SePay' },
                    { id: 'VNPAY', label: 'Cổng VNPay' },
                  ].map((opt) => {
                    const active = paymentMethod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPaymentMethod(opt.id)}
                        style={{
                          minHeight: '40px',
                          padding: '8px 6px',
                          borderRadius: '8px',
                          border: active ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: active ? 'var(--primary-light)' : 'var(--bg-elevated)',
                          color: active ? 'var(--primary-text)' : 'var(--text-secondary)',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '600',
                  }}
                >
                  Lời nhắn cho thủ thư
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Mượn phục vụ tiểu luận hoặc đồ án tốt nghiệp..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div
                style={{
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ShieldCheck size={15} color="var(--success-text)" />
                <span>Phí trễ hạn áp dụng 5.000 VNĐ mỗi ngày nếu chưa gia hạn trước khi đến hạn.</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', minHeight: '46px', fontSize: '0.94rem', fontWeight: '700' }}
              >
                {loading
                  ? 'Đang xử lý đăng ký...'
                  : `Xác nhận mượn sách • ${totalRentalFee.toLocaleString('vi-VN')} VNĐ`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
