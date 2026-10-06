'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function KMDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  record = null,
}) {
  if (!isOpen || !record) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 10700 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          padding: '1.75rem 1.5rem',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.5rem' }}>
          ยืนยันการลบข้อมูลการอบรม
        </h3>

        <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
          คุณแน่ใจหรือไม่ว่าต้องการลบรายการหลักสูตร{' '}
          <strong style={{ color: '#1E293B' }}>&ldquo;{record.courseTitle}&rdquo;</strong>?
          <br />
          <span style={{ fontSize: '0.78rem', color: '#DC2626' }}>
            การกระทำนี้จะไม่สามารถย้อนกลับได้
          </span>
        </p>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.55rem 1.25rem', borderRadius: '10px' }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(record.id);
              onClose();
            }}
            className="btn btn-primary"
            style={{
              background: '#DC2626',
              color: '#FFFFFF',
              padding: '0.55rem 1.5rem',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Trash2 size={16} />
            <span>ยืนยันลบรายการ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
