import React, { useState, useEffect } from 'react';
import { X, QrCode, CreditCard, CheckCircle2, Copy, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createVNPayUrl, createSepayQR, checkSepayStatus } from '../services/api';
import { showToast } from './Toast';

export default function PaymentModal({ isOpen, onClose, borrowRecord, amount = 30000, onSuccess }) {
  const [method, setMethod] = useState('sepay'); // 'sepay' or 'vnpay'
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

  // Tự động kiểm tra trạng thái thanh toán từ Webhook SePay mỗi 2 giây
  useEffect(() => {
    if (!isOpen || !sepayData?.transactionId || paymentSuccess) return;

    const timer = setInterval(async () => {
      try {
        const payment = await checkSepayStatus(sepayData.transactionId);
        if (payment && payment.status === 'SUCCESS') {
          setPaymentSuccess(true);
          triggerConfetti();
          showToast('🎉 Đã nhận chuyển khoản ngân hàng thành công!', 'success');
          if (onSuccess) onSuccess();
        }
      } catch (e) {
        // tiếp tục chờ webhook
      }
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
      origin: { y: 0.6 }
    });
  };

  const handleSimulateSepayWebhook = async () => {
    if (!sepayData?.transactionId) return;
    setPolling(true);
    try {
      const payment = await checkSepayStatus(sepayData.transactionId);
      if (payment && payment.status === 'SUCCESS') {
        setPaymentSuccess(true);
        triggerConfetti();
        showToast('🎉 Đã xác nhận thanh toán ngân hàng thành công!', 'success');
        if (onSuccess) onSuccess();
      } else {
        showToast('Hệ thống đang chờ thông báo biến động số dư từ TPBank (tự động cập nhật ngay khi tiền vào)...', 'info');
      }
    } catch (err) {
      showToast('Không thể kiểm tra trạng thái giao dịch lúc này.', 'warning');
    } finally {
      setPolling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div 
        className="animate-fade-in" 
        style={{ 
          width: '100%', 
          maxWidth: '520px', 
          padding: '32px', 
          position: 'relative', 
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          color: '#0f172a'
        }}
      >
        
        {/* Close button */}
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '18px', 
            right: '18px', 
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

        {paymentSuccess ? (
          /* Màn hình thành công */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#ecfdf5', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={40} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#047857', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Thanh Toán Thành Công!
            </h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '24px' }}>
              Giao dịch đã được hệ thống ngân hàng SePay / VNPay xác thực. Hóa đơn điện tử đã được ghi nhận vào hệ thống thư viện!
            </p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '24px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Phương thức:</span>
                <span style={{ fontWeight: '800', color: '#0284c7' }}>{method === 'sepay' ? 'SePay VietQR' : 'VNPay Sandbox'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Số tiền:</span>
                <span style={{ fontWeight: '900', color: '#059669', fontSize: '1rem' }}>{amount.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Trạng thái:</span>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: '800', fontSize: '0.75rem' }}>ĐÃ HOÀN TẤT</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              style={{ 
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Đóng và Quay Lại
            </button>
          </div>
        ) : (
          /* Màn hình chọn phương thức & thanh toán */
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                Cổng Thanh Toán Trực Tuyến
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Hỗ trợ thanh toán nhanh bằng SePay VietQR (Tự động khớp lệnh) hoặc VNPay
              </p>
            </div>

            {/* Selector: SePay vs VNPay */}
            <div className="form-grid-2" style={{ marginBottom: '24px' }}>
              <div 
                onClick={() => setMethod('sepay')}
                style={{ 
                  padding: '14px', 
                  borderRadius: '12px', 
                  cursor: 'pointer',
                  border: method === 'sepay' ? '2px solid #0891b2' : '1px solid #e2e8f0',
                  background: method === 'sepay' ? '#f0fdfa' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div style={{ background: '#0891b2', padding: '8px', borderRadius: '8px', color: 'white' }}>
                  <QrCode size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: method === 'sepay' ? '#0e7490' : '#0f172a' }}>
                    SePay VietQR
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Quét mã ngân hàng</div>
                </div>
              </div>

              <div 
                onClick={() => setMethod('vnpay')}
                style={{ 
                  padding: '14px', 
                  borderRadius: '12px', 
                  cursor: 'pointer',
                  border: method === 'vnpay' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: method === 'vnpay' ? '#f0f9ff' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div style={{ background: '#0284c7', padding: '8px', borderRadius: '8px', color: 'white' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: method === 'vnpay' ? '#0369a1' : '#0f172a' }}>
                    VNPay Gateway
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Thẻ ATM / Cổng VNPay</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Loader2 className="animate-spin" size={36} color="#1d4ed8" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>Đang kết nối cổng thanh toán...</p>
              </div>
            ) : method === 'sepay' && sepayData ? (
              /* TAB SEPAY VIETQR */
              <div>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'inline-block', padding: '12px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)' }}>
                    <img 
                      src={sepayData.qrUrl} 
                      alt="VietQR SePay" 
                      style={{ width: '190px', height: '190px', display: 'block', borderRadius: '8px' }} 
                    />
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#0891b2', fontWeight: '700' }}>
                    Quét mã bằng bất kỳ ứng dụng ngân hàng nào (MBBank, Vietcombank, Techcombank, MoMo...)
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '20px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Ngân hàng:</span>
                    <span style={{ fontWeight: '800', color: '#0f172a' }}>{sepayData.bankCode} ({sepayData.accountName})</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Số tài khoản:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '800', color: '#0f172a', letterSpacing: '0.05em' }}>{sepayData.accountNumber}</span>
                      <button 
                        onClick={() => copyToClipboard(sepayData.accountNumber, 'acc')}
                        style={{ background: 'transparent', border: 'none', color: copiedField === 'acc' ? '#10b981' : '#0891b2', cursor: 'pointer' }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Số tiền chuyển:</span>
                    <span style={{ fontWeight: '900', color: '#059669', fontSize: '1rem' }}>{amount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Nội dung CK:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '800', color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '6px' }}>
                        {sepayData.paymentCode}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(sepayData.paymentCode, 'code')}
                        style={{ background: 'transparent', border: 'none', color: copiedField === 'code' ? '#10b981' : '#0891b2', cursor: 'pointer' }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Webhook Polling & Manual Check */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.78rem', color: '#0e7490', fontWeight: '700', marginBottom: '8px', background: '#ecfeff', padding: '7px 10px', borderRadius: '8px', border: '1px dashed #67e8f9' }}>
                  <Loader2 size={14} className="animate-spin" />
                  Đang tự động chờ ngân hàng xác nhận chuyển khoản (2 giây/lần)...
                </div>
                <button 
                  onClick={handleSimulateSepayWebhook}
                  disabled={polling}
                  style={{ 
                    width: '100%', 
                    marginBottom: '10px',
                    padding: '11px',
                    borderRadius: '8px',
                    background: '#0891b2',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
                  }}
                >
                  {polling ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                  🔄 Tôi Đã Chuyển Khoản — Kiểm Tra Ngay
                </button>
              </div>
            ) : (
              /* TAB VNPAY GATEWAY */
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ background: 'white', padding: '16px', borderRadius: '14px', width: 'fit-content', margin: '0 auto 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                  <img 
                    src="https://sandbox.vnpayment.vn/paymentv2/Images/brands/logo.svg" 
                    alt="VNPay Logo" 
                    style={{ height: '42px', display: 'block' }} 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div style={{ fontWeight: '800', color: '#005baa', fontSize: '1.2rem', marginTop: '4px' }}>VNPAY SANDBOX</div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '24px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Đơn hàng:</span>
                    <span style={{ fontWeight: '800', color: '#0f172a' }}>{borrowRecord ? borrowRecord.borrowCode : 'Phiếu thư viện'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Tổng tiền:</span>
                    <span style={{ fontWeight: '900', color: '#059669', fontSize: '1.1rem' }}>{amount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Bảo mật:</span>
                    <span style={{ color: '#0284c7', fontWeight: '700' }}>Mã hóa chuẩn HMAC-SHA512</span>
                  </div>
                </div>

                <a 
                  href={vnpayUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ 
                    width: '100%', 
                    textDecoration: 'none', 
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: '800',
                    boxSizing: 'border-box'
                  }}
                >
                  <ExternalLink size={18} /> Chuyển sang Cổng VNPay Sandbox
                </a>

                <button 
                  onClick={() => {
                    setPaymentSuccess(true);
                    triggerConfetti();
                    if (onSuccess) onSuccess();
                  }}
                  style={{ 
                    width: '100%', 
                    fontSize: '0.8rem', 
                    color: '#64748b',
                    background: 'transparent',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  (Mô phỏng VNPay Return Code: 00 Thành Công)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
