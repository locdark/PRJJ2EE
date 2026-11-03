import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, Calendar, Clock, BookOpen, AlertCircle, CheckCircle2, 
  ShieldCheck, CreditCard, QrCode, Receipt, DollarSign, Info, ArrowRight,
  Copy, ExternalLink, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { graphqlQuery, restLogin, createSepayQR, createVNPayUrl, checkSepayStatus } from '../services/api';
import { REQUEST_BORROW } from '../services/graphqlQueries';
import { showToast } from './Toast';

export default function BorrowModal({ book, isOpen, onClose, onSuccess, onViewMyBorrowings }) {
  // Đơn giá thuê: 2.000 VNĐ / ngày
  const DAILY_RATE = 2000;

  // Lấy ngày hiện tại YYYY-MM-DD
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  // Mặc định 14 ngày
  const defaultDueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  }, []);

  const [returnDateStr, setReturnDateStr] = useState(defaultDueDate);
  const [paymentMethod, setPaymentMethod] = useState('SEPAY'); // COUNTER, SEPAY, VNPAY (Default SEPAY for instant QR)
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successRecord, setSuccessRecord] = useState(null);

  // Trạng thái mã QR SePay & VNPay
  const [sepayData, setSepayData] = useState(null);
  const [vnpayUrl, setVnpayUrl] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

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
      setSimulatingWebhook(false);
    }
  }, [isOpen, book, defaultDueDate]);

  // Tự động kiểm tra trạng thái thanh toán thực tế từ Webhook SePay mỗi 2 giây
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
            origin: { y: 0.6 }
          });
          showToast('🎉 Đã nhận chuyển khoản ngân hàng thành công!', 'success');
          if (onSuccess) onSuccess();
        }
      } catch (e) {
        // tiếp tục chờ webhook
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [isOpen, sepayData, isPaid, onSuccess]);

  if (!isOpen || !book) return null;

  // Giới hạn chọn ngày: Từ ngày mai đến tối đa 90 ngày tới
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

  // Tính số ngày mượn thực tế
  const calculateDays = (dateStr) => {
    const selected = new Date(dateStr);
    const diffTime = selected.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const daysCount = calculateDays(returnDateStr);
  const totalRentalFee = daysCount * DAILY_RATE;

  // Format ngày trả sách kiểu Việt Nam: DD/MM/YYYY
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

  // Chọn nhanh số ngày
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

  const handleSimulateSepayWebhook = async () => {
    if (!sepayData?.transactionId) return;
    setSimulatingWebhook(true);
    try {
      const payment = await checkSepayStatus(sepayData.transactionId);
      if (payment && payment.status === 'SUCCESS') {
        setIsPaid(true);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        showToast('🎉 Đã xác nhận thanh toán ngân hàng thành công!', 'success');
        if (onSuccess) onSuccess();
      } else {
        showToast('Hệ thống đang chờ thông báo biến động số dư từ TPBank (tự động cập nhật ngay khi tiền vào)...', 'info');
      }
    } catch (err) {
      showToast('Không thể kiểm tra trạng thái giao dịch lúc này.', 'warning');
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedNote = `[Thuê ${daysCount} ngày • Phí thuê: ${totalRentalFee.toLocaleString('vi-VN')} đ • PTTT: ${paymentMethod === 'COUNTER' ? 'Tại quầy' : paymentMethod === 'SEPAY' ? 'VietQR SePay' : 'VNPay'}] ${note ? '- ' + note : ''}`;
      
      const data = await graphqlQuery(REQUEST_BORROW, {
        bookId: book.id,
        days: daysCount,
        note: formattedNote
      });

      setSuccessRecord(data.requestBorrow);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      if (onSuccess) onSuccess(data.requestBorrow);

      // Nếu chọn VietQR SePay: Tự động khởi tạo mã QR thanh toán ngay
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
      <div 
        className="animate-fade-in modal-responsive-card" 
        style={{ 
          width: '100%', 
          maxWidth: '560px', 
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative', 
          background: '#ffffff', 
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          color: '#0f172a'
        }}
      >
        
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={18} />
        </button>

        {successRecord ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <CheckCircle2 size={36} color="#10b981" />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: isPaid ? '#047857' : '#0f172a', marginBottom: '4px', letterSpacing: '-0.02em' }}>
              {isPaid ? '🎉 Đã Thanh Toán & Thuê Sách Thành Công!' : 'Đã Đăng Ký Mượn Sách Thành Công!'}
            </h3>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '16px' }}>
              Mã phiếu mượn: <strong style={{ color: '#1d4ed8', fontWeight: '800' }}>#{successRecord.borrowCode}</strong> • Vị trí: <strong style={{ color: '#0f172a' }}>{book.shelfLocation || 'Kệ A-01'}</strong>
            </p>

            {/* HIỂN THỊ MÃ QR SEPAY NẾU CHỌN SEPAY */}
            {paymentMethod === 'SEPAY' && (
              <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '16px', padding: '18px', marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0891b2', color: 'white', padding: '3px 10px', borderRadius: '6px', fontSize: '0.725rem', fontWeight: '800', marginBottom: '10px' }}>
                  <QrCode size={14} /> MÃ VIETQR SEPAY THANH TOÁN TIỀN THUÊ ({totalRentalFee.toLocaleString('vi-VN')} VNĐ)
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <div style={{ padding: '10px', background: '#ffffff', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                    {sepayData ? (
                      <img 
                        src={sepayData.qrUrl} 
                        alt="VietQR SePay" 
                        style={{ width: '180px', height: '180px', display: 'block', borderRadius: '8px' }} 
                      />
                    ) : (
                      <div style={{ width: '180px', height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <Loader2 className="animate-spin" size={28} color="#0891b2" style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Đang nạp mã QR...</span>
                      </div>
                    )}
                  </div>
                </div>

                {sepayData && (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', textAlign: 'left', fontSize: '0.8rem', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Ngân hàng:</span>
                      <strong style={{ color: '#0f172a' }}>{sepayData.bankCode} ({sepayData.accountName})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Số tài khoản:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: '#0f172a' }}>{sepayData.accountNumber}</strong>
                        <button 
                          type="button"
                          onClick={() => copyToClipboard(sepayData.accountNumber, 'acc')}
                          style={{ background: 'transparent', border: 'none', color: copiedField === 'acc' ? '#10b981' : '#0891b2', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Số tiền:</span>
                      <strong style={{ color: '#059669', fontSize: '0.9rem' }}>{totalRentalFee.toLocaleString('vi-VN')} VNĐ</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Nội dung CK:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: '4px' }}>
                          {sepayData.paymentCode}
                        </strong>
                        <button 
                          type="button"
                          onClick={() => copyToClipboard(sepayData.paymentCode, 'code')}
                          style={{ background: 'transparent', border: 'none', color: copiedField === 'code' ? '#10b981' : '#0891b2', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trạng thái tự động lắng nghe Webhook SePay & nút kiểm tra ngay */}
                {!isPaid ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.78rem', color: '#0e7490', fontWeight: '700', marginBottom: '8px', background: '#ecfeff', padding: '7px 10px', borderRadius: '8px', border: '1px dashed #67e8f9' }}>
                      <Loader2 size={14} className="animate-spin" />
                      Đang tự động chờ ngân hàng xác nhận chuyển khoản (2 giây/lần)...
                    </div>
                    <button 
                      type="button"
                      onClick={handleSimulateSepayWebhook}
                      disabled={simulatingWebhook || !sepayData}
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        borderRadius: '8px',
                        background: '#0891b2', 
                        color: '#ffffff', 
                        border: 'none', 
                        fontSize: '0.8rem', 
                        fontWeight: '800', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {simulatingWebhook ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      {simulatingWebhook ? 'Đang kiểm tra giao dịch...' : '🔄 Tôi Đã Chuyển Khoản — Kiểm Tra Ngay'}
                    </button>
                  </div>
                ) : (
                  <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '8px', borderRadius: '8px', fontWeight: '800', fontSize: '0.825rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> ĐÃ HOÀN TẤT THANH TOÁN TIỀN THUÊ QUA VIETQR SEPAY
                  </div>
                )}
              </div>
            )}

            {/* HIỂN THỊ NÚT VNPAY NẾU CHỌN VNPAY */}
            {paymentMethod === 'VNPAY' && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '16px', padding: '18px', marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0284c7', color: 'white', padding: '3px 10px', borderRadius: '6px', fontSize: '0.725rem', fontWeight: '800', marginBottom: '10px' }}>
                  <CreditCard size={14} /> CỔNG THANH TOÁN VNPAY GATEWAY
                </div>
                <p style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '14px' }}>
                  Tổng phí thuê: <strong style={{ color: '#0284c7' }}>{totalRentalFee.toLocaleString('vi-VN')} VNĐ</strong>
                </p>
                {vnpayUrl ? (
                  <a 
                    href={vnpayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '11px 20px', 
                      borderRadius: '8px', 
                      background: '#0284c7', 
                      color: '#ffffff', 
                      textDecoration: 'none', 
                      fontWeight: '800', 
                      fontSize: '0.85rem' 
                    }}
                  >
                    <ExternalLink size={16} /> Mở Cổng VNPay Sandbox Để Thanh Toán
                  </a>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b', fontSize: '0.825rem' }}>
                    <Loader2 className="animate-spin" size={16} /> Đang kết nối cổng VNPay...
                  </div>
                )}
              </div>
            )}

            {/* TẠI QUẦY */}
            {paymentMethod === 'COUNTER' && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '20px', textAlign: 'left', fontSize: '0.825rem' }}>
                <div style={{ color: '#16a34a', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> Thanh toán tiền mặt tại quầy thư viện
                </div>
                <div style={{ color: '#475569' }}>
                  Vui lòng mang mã phiếu <strong style={{ color: '#1d4ed8' }}>#{successRecord.borrowCode}</strong> đến quầy thủ thư để nhận sách trên kệ và thanh toán <strong>{totalRentalFee.toLocaleString('vi-VN')} VNĐ</strong>.
                </div>
              </div>
            )}

            {/* Tóm tắt phiếu mượn */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', textAlign: 'left', marginBottom: '20px', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Tác phẩm:</span>
                <strong style={{ color: '#0f172a' }}>{book.title}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Thời gian mượn:</span>
                <strong style={{ color: '#0f172a' }}>{daysCount} ngày (đến {formattedReturnDate})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tổng tiền thuê:</span>
                <strong style={{ color: '#1d4ed8' }}>{totalRentalFee.toLocaleString('vi-VN')} VNĐ</strong>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleFinish} 
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: '800' }}
            >
              Hoàn Tất &amp; Xem Sách Đang Mượn
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: '#1d4ed8', padding: '12px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  Xác Nhận Đăng Ký Mượn Sách
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Thư Viện Số SmartLibrary • Tra cứu và tính phí thuê tự động
                </p>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Book Info Summary */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', marginBottom: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <img 
                src={book.coverImage} 
                alt={book.title} 
                style={{ width: '50px', height: '68px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {book.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '2px' }}>
                  Tác giả: {book.author?.name || 'SmartLibrary Author'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: '700' }}>
                  Vị trí kệ: {book.shelfLocation || 'Kệ A-01'}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* PHẦN 1: CHỌN LỊCH TRẢ SÁCH */}
              <div>
                <label style={{ fontSize: '0.825rem', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={15} color="#1d4ed8" /> Chọn Lịch Trả Sách:
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>
                    Tối đa 90 ngày
                  </span>
                </label>

                {/* Preset Chips */}
                <div className="preset-grid-4" style={{ marginBottom: '10px' }}>
                  {[
                    { days: 7, label: '7 ngày' },
                    { days: 14, label: '14 ngày' },
                    { days: 30, label: '30 ngày' },
                    { days: 60, label: '60 ngày' }
                  ].map((p) => {
                    const isSelected = daysCount === p.days;
                    return (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => handlePresetDays(p.days)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          color: isSelected ? '#1d4ed8' : '#475569',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Date Picker */}
                <div style={{ position: 'relative' }}>
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
                      color: '#0f172a',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>Ngày bắt đầu: <strong style={{ color: '#0f172a' }}>{new Date().toLocaleDateString('vi-VN')}</strong></span>
                  <span>Hạn trả dự kiến: <strong style={{ color: '#1d4ed8' }}>{formattedReturnDate}</strong> ({daysCount} ngày)</span>
                </div>
              </div>

              {/* PHẦN 2: BẢNG TÍNH LẠI TIỀN THUÊ SÁCH TỰ ĐỘNG */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Receipt size={15} color="#1d4ed8" /> Bảng Tính Tiền Thuê &amp; Chi Phí Mượn
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Thời gian thuê:</span>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>{daysCount} ngày</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Đơn giá thuê thư viện:</span>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>{DAILY_RATE.toLocaleString('vi-VN')} đ / ngày</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Tiền cọc thẻ bạn đọc:</span>
                    <span style={{ fontWeight: '700', color: '#059669' }}>Miễn phí (0 đ)</span>
                  </div>

                  <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>Tổng Tiền Thuê Phải Trả:</span>
                    <span style={{ fontWeight: '900', color: '#1d4ed8', fontSize: '1.15rem' }}>
                      {totalRentalFee.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* PHẦN 3: PHƯƠNG THỨC THANH TOÁN TIỀN THUÊ */}
              <div>
                <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Phương thức thanh toán tiền thuê:
                </label>
                <div className="payment-method-grid-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COUNTER')}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: paymentMethod === 'COUNTER' ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                      background: paymentMethod === 'COUNTER' ? '#eff6ff' : '#ffffff',
                      color: paymentMethod === 'COUNTER' ? '#1d4ed8' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Tại quầy thư viện
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('SEPAY')}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: paymentMethod === 'SEPAY' ? '2px solid #0891b2' : '1px solid #cbd5e1',
                      background: paymentMethod === 'SEPAY' ? '#ecfeff' : '#ffffff',
                      color: paymentMethod === 'SEPAY' ? '#0891b2' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    VietQR SePay
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VNPAY')}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: paymentMethod === 'VNPAY' ? '2px solid #005baa' : '1px solid #cbd5e1',
                      background: paymentMethod === 'VNPAY' ? '#eff6ff' : '#ffffff',
                      color: paymentMethod === 'VNPAY' ? '#005baa' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    Cổng VNPay
                  </button>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label style={{ fontSize: '0.8rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  Ghi chú cho thủ thư (tùy chọn):
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ví dụ: Mượn phục vụ tiểu luận môn học / khóa luận tốt nghiệp..." 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', color: '#0f172a', background: '#ffffff', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ fontSize: '0.725rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="#059669" />
                <span>Quy định: Phí trễ hạn là 5.000 VNĐ / ngày nếu không gia hạn đúng hạn.</span>
              </div>

              {/* Nút gửi */}
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: '800' }}
              >
                {loading ? 'Đang Xử Lý Đăng Ký...' : `Xác Nhận Mượn Sách (${totalRentalFee.toLocaleString('vi-VN')} đ)`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
