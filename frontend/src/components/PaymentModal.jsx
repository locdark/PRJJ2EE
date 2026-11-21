import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  CreditCard,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { createVNPayUrl, createSepayQR, checkSepayStatus } from '../services/api';
import { showToast } from './Toast';

export default function PaymentModal({
  isOpen,
  onClose,
  borrowRecord,
  amount = 30000,
  onSuccess,
}) {
  const [method, setMethod] = useState('sepay');
  const [loading, setLoading] = useState(false);
  const [sepayData, setSepayData] = useState(null);
  const [vnpayUrl, setVnpayUrl] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPaymentSuccess(false);
      loadPaymentOptions();
    }
  }, [isOpen, borrowRecord, amount]);

  useEffect(() => {
    if (!isOpen || !sepayData?.transactionId || paymentSuccess) return;

    const timer = setInterval(async () => {
      try {
        const payment = await checkSepayStatus(sepayData.transactionId);
        if (payment && payment.status === 'SUCCESS') {
          setPaymentSuccess(true);
          triggerConfetti();
          showToast('Đã nhận chuyển khoản ngân hàng thành công!', 'success');
          if (onSuccess) onSuccess();
        }
      } catch {}
    }, 2000);

    return () => clearInterval(timer);
  }, [isOpen, sepayData, paymentSuccess, onSuccess]);

  const loadPaymentOptions = async () => {
    setLoading(true);
    try {
      const recordId = borrowRecord ? borrowRecord.id : null;
      const sData = await createSepayQR(recordId, amount);
      setSepayData(sData);

      const vData = await createVNPayUrl(recordId, amount);
      setVnpayUrl(vData.paymentUrl);
    } catch (err) {
      console.error('Lỗi khởi tạo cổng thanh toán:', err);
      showToast(err.message || 'Không thể khởi tạo phiên thanh toán', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleCheckSepayStatus = async () => {
    if (!sepayData?.transactionId) return;
    setPolling(true);
    try {
      const payment = await checkSepayStatus(sepayData.transactionId);
      if (payment && payment.status === 'SUCCESS') {
        setPaymentSuccess(true);
        triggerConfetti();
        showToast('Đã xác nhận thanh toán ngân hàng thành công!', 'success');
        if (onSuccess) onSuccess();
      } else {
        showToast(
          'Hệ thống đang chờ thông báo biến động số dư từ ngân hàng và sẽ tự cập nhật khi giao dịch hoàn tất.',
          'info'
        );
      }
    } catch {
      showToast('Không thể kiểm tra trạng thái giao dịch lúc này.', 'warning');
    } finally {
      setPolling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
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
          maxWidth: '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '28px 24px',
          position: 'relative',
          background: 'var(--bg-card)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          color: 'var(--text-main)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cổng thanh toán"
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

        {paymentSuccess ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--success-bg)',
                border: '2px solid var(--success-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle2 size={38} color="var(--success-text)" />
            </div>
            <h3
              className="editorial-heading"
              style={{
                fontSize: '1.45rem',
                fontWeight: '700',
                color: 'var(--success-text)',
                marginBottom: '8px',
              }}
            >
              Thanh Toán Thành Công
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.55 }}>
              Giao dịch đã được hệ thống ngân hàng xác thực. Hóa đơn điện tử đã được ghi nhận vào hồ sơ thư viện.
            </p>
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '24px',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Phương thức</span>
                <span style={{ fontWeight: '700', color: 'var(--primary-text)' }}>
                  {method === 'sepay' ? 'SePay VietQR' : 'Cổng VNPay'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Số tiền</span>
                <span style={{ fontWeight: '800', color: 'var(--success-text)', fontSize: '1rem' }}>
                  {amount.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Trạng thái</span>
                <span className="badge badge-success">ĐÃ HOÀN TẤT</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '44px', fontSize: '0.92rem' }}
            >
              Đóng và Quay Lại
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '20px', paddingRight: '32px' }}>
              <h3
                className="editorial-heading"
                style={{
                  fontSize: '1.4rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '6px',
                }}
              >
                Cổng Thanh Toán Trực Tuyến
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Thanh toán nhanh qua mã VietQR SePay tự động khớp lệnh hoặc cổng VNPay
              </p>
            </div>

            <div className="form-grid-2" style={{ marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setMethod('sepay')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border:
                    method === 'sepay'
                      ? '2px solid var(--primary)'
                      : '1px solid var(--border)',
                  background: method === 'sepay' ? 'var(--primary-light)' : 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    background: 'var(--primary)',
                    padding: '8px',
                    borderRadius: '8px',
                    color: 'var(--on-primary)',
                    display: 'flex',
                  }}
                >
                  <QrCode size={18} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      color: method === 'sepay' ? 'var(--primary-text)' : 'var(--text-main)',
                    }}
                  >
                    SePay VietQR
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Quét mã ngân hàng
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('vnpay')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border:
                    method === 'vnpay'
                      ? '2px solid var(--primary)'
                      : '1px solid var(--border)',
                  background: method === 'vnpay' ? 'var(--primary-light)' : 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    background: 'var(--primary)',
                    padding: '8px',
                    borderRadius: '8px',
                    color: 'var(--on-primary)',
                    display: 'flex',
                  }}
                >
                  <CreditCard size={18} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      color: method === 'vnpay' ? 'var(--primary-text)' : 'var(--text-main)',
                    }}
                  >
                    Cổng VNPay
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Thẻ nội địa &amp; ví điện tử
                  </div>
                </div>
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Loader2
                  className="animate-spin"
                  size={36}
                  color="var(--primary-text)"
                  style={{ margin: '0 auto 12px' }}
                />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
                  Đang kết nối cổng thanh toán...
                </p>
              </div>
            ) : method === 'sepay' && sepayData ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '12px',
                      background: '#ffffff', /* qr-quiet-zone */
                      borderRadius: '16px',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    <img
                      src={sepayData.qrUrl}
                      alt="Mã VietQR SePay"
                      style={{ width: '188px', height: '188px', display: 'block', borderRadius: '8px' }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: '10px',
                      fontSize: '0.82rem',
                      color: 'var(--primary-text)',
                      fontWeight: '600',
                    }}
                  >
                    Quét bằng mọi ứng dụng ngân hàng hoặc ví điện tử hỗ trợ VietQR
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '16px',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Ngân hàng</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-main)', textAlign: 'right' }}>
                      {sepayData.bankCode} • {sepayData.accountName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Số tài khoản</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          color: 'var(--text-main)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {sepayData.accountNumber}
                      </span>
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
                        }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Số tiền chuyển</span>
                    <span style={{ fontWeight: '800', color: 'var(--success-text)', fontSize: '1rem' }}>
                      {amount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Nội dung chuyển khoản</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '800',
                          color: 'var(--warning-text)',
                          background: 'var(--warning-bg)',
                          border: '1px solid var(--warning-border)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {sepayData.paymentCode}
                      </span>
                      <button
                        type="button"
                        aria-label="Sao chép nội dung chuyển khoản"
                        onClick={() => copyToClipboard(sepayData.paymentCode, 'code')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: copiedField === 'code' ? 'var(--success-text)' : 'var(--primary-text)',
                          cursor: 'pointer',
                          display: 'flex',
                        }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--info-text)',
                    fontWeight: '600',
                    marginBottom: '12px',
                    background: 'var(--info-bg)',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--info-border)',
                  }}
                >
                  <Loader2 size={15} className="animate-spin" />
                  <span>Đang tự động đồng bộ xác nhận từ ngân hàng...</span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckSepayStatus}
                  disabled={polling}
                  className="btn btn-sepay"
                  style={{ width: '100%', minHeight: '44px', fontSize: '0.88rem' }}
                >
                  {polling ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <RefreshCw size={17} />
                  )}
                  Tôi đã chuyển khoản — Kiểm tra ngay
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div
                  style={{
                    background: '#ffffff', /* qr-quiet-zone */
                    padding: '14px 20px',
                    borderRadius: '14px',
                    width: 'fit-content',
                    margin: '0 auto 20px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <img
                    src="https://sandbox.vnpayment.vn/paymentv2/Images/brands/logo.svg"
                    alt="VNPay Logo"
                    style={{ height: '40px', display: 'block', margin: '0 auto' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div
                    style={{
                      fontWeight: '800',
                      color: '#005baa',
                      fontSize: '1.1rem',
                      marginTop: '4px',
                    }}
                  >
                    VNPAY SANDBOX
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'left',
                    marginBottom: '20px',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Đơn hàng</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-main)' }}>
                      {borrowRecord ? borrowRecord.borrowCode : 'Phiếu thư viện'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Tổng tiền</span>
                    <span style={{ fontWeight: '800', color: 'var(--success-text)', fontSize: '1.05rem' }}>
                      {amount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Bảo mật</span>
                    <span style={{ color: 'var(--primary-text)', fontWeight: '700' }}>
                      Chữ ký số HMAC-SHA512
                    </span>
                  </div>
                </div>

                <a
                  href={vnpayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sepay"
                  style={{ width: '100%', minHeight: '44px', textDecoration: 'none' }}
                >
                  <ExternalLink size={17} /> Chuyển sang Cổng VNPay Sandbox
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
