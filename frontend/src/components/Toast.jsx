import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

// Global event bus for lightweight zero-prop-drilling Toasts & Confirmations
const TOAST_EVENT = 'libtech:toast';
const CONFIRM_EVENT = 'libtech:confirm';

export function showToast(message, type = 'info', duration = 3800) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT, {
        detail: { id: Date.now() + Math.random(), message, type, duration },
      })
    );
  }
}

export function confirmAction(title, message) {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(CONFIRM_EVENT, {
          detail: { title, message, resolve },
        })
      );
    } else {
      resolve(false);
    }
  });
}

export function useToast() {
  return { showToast, confirmAction };
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToast = (e) => {
      const newToast = e.detail;
      setToasts((prev) => [...prev, newToast]);
      if (newToast.duration > 0) {
        setTimeout(() => {
          removeToast(newToast.id);
        }, newToast.duration);
      }
    };

    const handleConfirm = (e) => {
      setConfirmDialog(e.detail);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    window.addEventListener(CONFIRM_EVENT, handleConfirm);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      window.removeEventListener(CONFIRM_EVENT, handleConfirm);
    };
  }, [removeToast]);

  const handleConfirmChoice = (choice) => {
    if (confirmDialog?.resolve) {
      confirmDialog.resolve(choice);
    }
    setConfirmDialog(null);
  };

  const getToastStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'var(--bg-card)',
          border: '#10b981',
          accentBg: '#ecfdf5',
          iconColor: '#059669',
          Icon: CheckCircle2,
        };
      case 'error':
        return {
          bg: 'var(--bg-card)',
          border: '#ef4444',
          accentBg: '#fef2f2',
          iconColor: '#dc2626',
          Icon: XCircle,
        };
      case 'warning':
        return {
          bg: 'var(--bg-card)',
          border: '#f59e0b',
          accentBg: '#fffbeb',
          iconColor: '#d97706',
          Icon: AlertTriangle,
        };
      default:
        return {
          bg: 'var(--bg-card)',
          border: 'var(--primary)',
          accentBg: 'var(--primary-light)',
          iconColor: 'var(--primary)',
          Icon: Info,
        };
    }
  };

  return (
    <>
      {/* Floating Toast Stack */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '400px',
          width: 'calc(100vw - 40px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const style = getToastStyle(t.type);
          const IconComponent = style.Icon;
          return (
            <div
              key={t.id}
              className="animate-fade-in"
              style={{
                pointerEvents: 'auto',
                background: style.bg,
                color: 'var(--text-main)',
                border: `1px solid var(--border)`,
                borderLeft: `4px solid ${style.border}`,
                borderRadius: '12px',
                padding: '12px 14px',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: style.accentBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconComponent size={18} color={style.iconColor} />
              </div>

              <div style={{ flex: 1, fontSize: '0.84rem', fontWeight: '600', lineHeight: 1.45 }}>
                {t.message}
              </div>

              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm Dialog Modal */}
      {confirmDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(6px)',
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
              maxWidth: '420px',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                {confirmDialog.title || 'Xác nhận thao tác'}
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.55 }}>
              {confirmDialog.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => handleConfirmChoice(false)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '0.825rem' }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleConfirmChoice(true)}
                className="btn btn-danger"
                style={{ padding: '8px 18px', fontSize: '0.825rem' }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
