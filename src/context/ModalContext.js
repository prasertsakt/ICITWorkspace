'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  HelpCircle,
  X,
  Trash2,
  ShieldAlert,
} from 'lucide-react';

const ModalContext = createContext(null);

// Standalone event-based helpers for non-component calls (e.g. utility files)
export const showAppAlert = (options) => {
  if (typeof window === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    window.dispatchEvent(
      new CustomEvent('app-global-modal-open', {
        detail: {
          ...opts,
          isConfirm: false,
          onClose: () => resolve(true),
        },
      })
    );
  });
};

export const showAppConfirm = (options) => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    window.dispatchEvent(
      new CustomEvent('app-global-modal-open', {
        detail: {
          ...opts,
          isConfirm: true,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        },
      })
    );
  });
};

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState(null);

  const closeModal = useCallback((result = false) => {
    if (!modalState) return;
    if (modalState.isConfirm) {
      if (result && typeof modalState.onConfirm === 'function') {
        modalState.onConfirm();
      } else if (!result && typeof modalState.onCancel === 'function') {
        modalState.onCancel();
      }
    } else {
      if (typeof modalState.onClose === 'function') {
        modalState.onClose();
      }
    }
    setModalState(null);
  }, [modalState]);

  // Hook methods
  const showAlert = useCallback((options) => {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : options;
      setModalState({
        ...opts,
        isConfirm: false,
        onClose: () => resolve(true),
      });
    });
  }, []);

  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : options;
      setModalState({
        ...opts,
        isConfirm: true,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }, []);

  // Listen to standalone CustomEvents from anywhere
  useEffect(() => {
    const handleGlobalModalOpen = (e) => {
      if (e.detail) {
        setModalState(e.detail);
      }
    };

    window.addEventListener('app-global-modal-open', handleGlobalModalOpen);
    return () => {
      window.removeEventListener('app-global-modal-open', handleGlobalModalOpen);
    };
  }, []);

  // Keyboard accessibility (Enter / Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modalState) return;
      if (e.key === 'Escape') {
        closeModal(false);
      } else if (e.key === 'Enter') {
        // Only confirm on Enter if not textarea
        if (e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          closeModal(true);
        }
      }
    };

    if (modalState) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalState, closeModal]);

  // Determine modal type styling and icons
  const type = modalState?.type || (modalState?.isDanger ? 'danger' : modalState?.isConfirm ? 'confirm' : 'info');

  const getThemeDetails = () => {
    switch (type) {
      case 'danger':
      case 'error':
        return {
          gradient: 'linear-gradient(90deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
          iconBg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
          iconBorder: '#FCA5A5',
          iconColor: '#DC2626',
          IconComponent: modalState?.icon || Trash2,
          btnBg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          btnShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
          defaultTitle: 'ยืนยันการลบ / ดำเนินการ',
        };
      case 'warning':
        return {
          gradient: 'linear-gradient(90deg, #F59E0B 0%, #D97706 50%, #B45309 100%)',
          iconBg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
          iconBorder: '#FCD34D',
          iconColor: '#D97706',
          IconComponent: modalState?.icon || AlertTriangle,
          btnBg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          btnShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
          defaultTitle: 'แจ้งเตือน / ตรวจสอบ',
        };
      case 'success':
        return {
          gradient: 'linear-gradient(90deg, #10B981 0%, #059669 50%, #047857 100%)',
          iconBg: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
          iconBorder: '#86EFAC',
          iconColor: '#059669',
          IconComponent: modalState?.icon || CheckCircle2,
          btnBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          btnShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
          defaultTitle: 'ดำเนินการสำเร็จ',
        };
      case 'confirm':
      case 'info':
      default:
        return {
          gradient: 'linear-gradient(90deg, #6366F1 0%, #4F46E5 50%, #4338CA 100%)',
          iconBg: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
          iconBorder: '#C7D2FE',
          iconColor: '#4F46E5',
          IconComponent: modalState?.icon || (modalState?.isConfirm ? HelpCircle : Info),
          btnBg: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
          btnShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
          defaultTitle: modalState?.isConfirm ? 'ยืนยันการทำรายการ' : 'แจ้งเตือนระบบ',
        };
    }
  };

  const theme = getThemeDetails();
  const IconComponent = theme.IconComponent;

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showAppAlert, showAppConfirm }}>
      {children}

      {/* Themed Global Modal */}
      {modalState && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 11000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => closeModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '22px',
              maxWidth: modalState.maxWidth || '480px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.9)',
              overflow: 'hidden',
              animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Gradient Line */}
            <div
              style={{
                height: '5px',
                background: theme.gradient,
              }}
            />

            <div style={{ padding: '1.75rem 1.75rem 1.5rem' }}>
              {/* Header with Icon and Title */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: theme.iconBg,
                    border: `1px solid ${theme.iconBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: theme.iconColor,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <IconComponent size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: '#1E293B',
                      letterSpacing: '-0.015em',
                      lineHeight: 1.35,
                    }}
                  >
                    {modalState.title || theme.defaultTitle}
                  </h3>
                  {modalState.subtitle && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: '#64748B' }}>
                      {modalState.subtitle}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => closeModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Message Body (Parses newlines and paragraphs) */}
              {modalState.message && (
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: '#475569',
                    lineHeight: 1.65,
                    marginBottom: '1.5rem',
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                  }}
                >
                  {modalState.message}
                </div>
              )}

              {/* Custom Extra Node if provided */}
              {modalState.customContent}

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginTop: '1.25rem',
                }}
              >
                {modalState.isConfirm && (
                  <button
                    type="button"
                    onClick={() => closeModal(false)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      border: '1.5px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#475569',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {modalState.cancelText || 'ยกเลิก'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => closeModal(true)}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: theme.btnBg,
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: theme.btnShadow,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {modalState.confirmText || (modalState.isConfirm ? 'ยืนยัน' : 'ตกลง')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    return {
      showAlert: showAppAlert,
      showConfirm: showAppConfirm,
      showAppAlert,
      showAppConfirm,
    };
  }
  return context;
}
