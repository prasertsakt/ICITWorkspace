'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Building2,
  Calendar,
  X,
  Loader2,
  Check,
} from 'lucide-react';

const REASON_PRESETS = [
  'ระบุเวลาผิดพลาด',
  'ข้อมูลไม่ถูกต้อง ขอยื่นใหม่',
  'แก้ไขปัญหาเรียบร้อยแล้ว',
  'เปลี่ยนวัน/เวลาปฏิบัติงาน',
];

export default function TimeAttendanceCancelModal({
  isOpen,
  onClose,
  record,
  onConfirmCancel,
}) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, record]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !record) return null;

  const handleSelectPreset = (presetText) => {
    if (!reason.trim()) {
      setReason(presetText);
    } else if (!reason.includes(presetText)) {
      setReason(`${reason.trim()}, ${presetText}`);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const finalReason = reason.trim() || 'ผู้ยื่นขอยกเลิกคำขอ';
      if (onConfirmCancel) {
        await onConfirmCancel(record.id, finalReason);
      }
      onClose();
    } catch (err) {
      console.error('Cancellation error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการยกเลิกคำขอ');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      style={{
        zIndex: 1100,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          borderRadius: 'var(--radius-xl, 24px)',
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 20px 45px -10px rgba(220, 38, 38, 0.15), 0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(254, 202, 202, 0.8)',
          background: '#FFFFFF',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header with Close Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '1.5rem 1.75rem 1rem 1.75rem',
            borderBottom: '1px solid #FEE2E2',
            background: 'linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.12)',
              }}
            >
              <AlertTriangle size={26} strokeWidth={2.2} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#991B1B',
                  margin: 0,
                  fontFamily: 'var(--font-primary)',
                }}
              >
                ยืนยันการยกเลิกคำขอลงเวลา
              </h3>
              <p
                style={{
                  fontSize: '0.825rem',
                  color: '#B91C1C',
                  margin: '2px 0 0 0',
                }}
              >
                การดำเนินการนี้จะยุติกระบวนการพิจารณาอนุมัติทันที
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition)',
            }}
            title="ปิดหน้าต่าง"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.75rem' }}>
          {/* Target Record Info Card */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 'var(--radius-md, 14px)',
              padding: '1rem 1.15rem',
              border: '1px solid #E2E8F0',
              marginBottom: '1.15rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem',
                paddingBottom: '0.65rem',
                borderBottom: '1px solid #EEF2F6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="#4F46E5" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1E293B' }}>
                  {record.requestType || 'ใบลงเวลาปฏิบัติราชการ'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#FEF3C7',
                  color: '#92400E',
                }}
              >
                ขั้นตอน: {record.currentStep || 'รอพิจารณา'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <User size={13} color="#64748B" />
                <span>
                  ผู้ยื่น: <strong style={{ color: '#0F172A' }}>{record.requesterName}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Building2 size={13} color="#64748B" />
                <span>
                  ฝ่าย: <strong style={{ color: '#0F172A' }}>{record.requesterDepartment || '-'}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Calendar size={13} color="#64748B" />
                <span>
                  วันที่: <strong style={{ color: '#0284C7' }}>{record.attendanceDate}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Clock size={13} color="#64748B" />
                <span>
                  เวลา: <strong style={{ color: '#0F172A' }}>{record.attendanceTime}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Warning Notice */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: '#FFF1F2',
              border: '1px solid #FFE4E6',
              color: '#9F1239',
              fontSize: '0.82rem',
              lineHeight: 1.5,
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <XCircle size={16} color="#E11D48" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              เมื่อยกเลิกแล้ว สถานะคำขอจะเปลี่ยนเป็น <strong>"ยกเลิกคำขอ"</strong> ทันที
              และไม่สามารถส่งต่อให้หัวหน้าฝ่ายหรือผู้บริหารอนุมัติได้อีก
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div
              style={{
                padding: '0.65rem 0.9rem',
                borderRadius: '8px',
                background: '#FEE2E2',
                color: '#B91C1C',
                fontSize: '0.82rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertTriangle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preset Quick Chips */}
          <div style={{ marginBottom: '0.6rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              เหตุผลด่วน (เลือกเพื่อระบุอัตโนมัติ):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {REASON_PRESETS.map((preset, idx) => {
                const isSelected = reason.includes(preset);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: isSelected ? '1px solid #F87171' : '1px solid #E2E8F0',
                      background: isSelected ? '#FEF2F2' : '#F8FAFC',
                      color: isSelected ? '#DC2626' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontWeight: isSelected ? 600 : 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isSelected && <Check size={11} />}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason Input Field */}
          <div style={{ marginBottom: '0.5rem' }}>
            <label
              htmlFor="cancel-reason-input"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              ระบุเหตุผลในการขอยกเลิกคำขอ:
            </label>
            <textarea
              id="cancel-reason-input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผลเพิ่มเติม (เช่น ข้อมูลเวลาไม่ตรงกับความจริง, ลงเวลาซ้ำซ้อน)..."
              disabled={isSubmitting}
              className="form-input"
              style={{
                width: '100%',
                fontSize: '0.85rem',
                borderRadius: '10px',
                borderColor: '#CBD5E1',
                padding: '0.65rem 0.85rem',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            padding: '1rem 1.75rem',
            borderTop: '1px solid #F1F5F9',
            background: 'var(--bg-card-subtle, #F8FAFC)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-secondary"
            style={{
              padding: '0.55rem 1.15rem',
              fontSize: '0.875rem',
              borderRadius: '10px',
            }}
          >
            ปิด / ย้อนกลับ
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.875rem',
              borderRadius: '10px',
              background: '#DC2626',
              borderColor: '#DC2626',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>กำลังยกเลิกคำขอ...</span>
              </>
            ) : (
              <>
                <XCircle size={16} />
                <span>ยืนยันยกเลิกคำขอ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
