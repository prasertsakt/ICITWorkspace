'use client';

import React, { useEffect, useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  User,
  Building2,
  Calendar,
  Clock,
  FileText,
  X,
  Loader2,
} from 'lucide-react';
import { LEAVE_TYPE_CONFIG } from '@/lib/constants';

function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10) + 543;
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return `${day} ${thaiMonths[monthIdx]} ${year}`;
  } catch {
    return dateStr;
  }
}

export default function LeaveDeleteModal({
  isOpen,
  onClose,
  leaveRecord,
  onConfirmDelete,
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
    }
  }, [isOpen, leaveRecord]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !leaveRecord) return null;

  const conf = LEAVE_TYPE_CONFIG[leaveRecord.leaveType] || {};
  const isSameDay = leaveRecord.startDate === leaveRecord.endDate;
  const dateRangeStr = isSameDay
    ? formatThaiDate(leaveRecord.startDate)
    : `${formatThaiDate(leaveRecord.startDate)} - ${formatThaiDate(leaveRecord.endDate)}`;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onConfirmDelete) {
        await onConfirmDelete(leaveRecord.id, leaveRecord.personnelName);
      }
      onClose();
    } catch (err) {
      console.error('Failed to delete leave:', err);
      alert(`เกิดข้อผิดพลาดในการลบรายการ: ${err.message || 'โปรดลองอีกครั้ง'}`);
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!isDeleting) onClose();
      }}
      style={{
        zIndex: 1100,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '100%',
          borderRadius: '20px',
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 20px 40px -10px rgba(225, 29, 72, 0.2), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          animation: 'modalScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
            borderBottom: '1px solid #FECDD3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#FEE2E2',
                color: '#E11D48',
                border: '1px solid #FECDD3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(225, 29, 72, 0.15)',
              }}
            >
              <Trash2 size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#9F1239' }}>
                ยืนยันการลบรายการลา
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#BE123C' }}>
                ข้อมูลนี้จะถูกลบออกจากปฏิทินและระบบฐานข้อมูล
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-close"
            style={{ padding: '6px', color: '#BE123C' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Summary Card */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            {/* Personnel & Department */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                    {leaveRecord.personnelName || 'ไม่ระบุชื่อ'}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                    {leaveRecord.department || '-'}
                  </div>
                </div>
              </div>

              {/* Leave Type Pill */}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: conf.bg || '#F1F5F9',
                  color: conf.color || '#334155',
                  border: `1px solid ${conf.border || 'transparent'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: conf.pillBg || '#6366F1',
                  }}
                />
                {leaveRecord.leaveType}
              </span>
            </div>

            <div style={{ borderTop: '1px dashed #E2E8F0', margin: '2px 0' }} />

            {/* Date Range & Total Days */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                <Calendar size={14} color="#64748B" />
                <span>{dateRangeStr}</span>
              </div>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>
                {leaveRecord.totalDays || 1} วัน
              </span>
            </div>

            {/* Reason */}
            {leaveRecord.reason && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#64748B',
                  background: '#FFFFFF',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                }}
              >
                <FileText size={13} style={{ flexShrink: 0, marginTop: '2px', color: '#94A3B8' }} />
                <span>{leaveRecord.reason}</span>
              </div>
            )}
          </div>

          {/* Warning Notice */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FEE2E2',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#991B1B',
              fontSize: '0.785rem',
              lineHeight: 1.4,
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, color: '#DC2626' }} />
            <span>
              คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การดำเนินการนี้จะลบข้อมูลออกจากระบบอย่างถาวรและไม่สามารถเรียกคืนได้
            </span>
          </div>

          {/* Modal Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="btn btn-secondary btn-sm"
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn btn-primary btn-sm"
              style={{
                padding: '0.55rem 1.35rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                borderColor: '#BE123C',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)',
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>กำลังลบ...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>ยืนยันลบรายการ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
