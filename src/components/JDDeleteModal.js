'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { deleteJDRecord } from '@/lib/jdService';

export default function JDDeleteModal({ isOpen, onClose, jd, onDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !jd) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteJDRecord(jd.id, null, true);
      if (res) {
        if (onDeleted) onDeleted(jd.id);
        onClose();
      } else {
        setError('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', textAlign: 'center', padding: '1.75rem 1.5rem' }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'var(--rose-50)',
            color: 'var(--rose-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <AlertTriangle size={26} />
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
          ยืนยันการลบ Job Description
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1rem' }}>
          คุณต้องการลบข้อมูลแบบบรรยายลักษณะงานของ{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {jd.personnelName || jd.positionTitle || 'รายการนี้'}
          </strong>{' '}
          ใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้
        </p>

        {jd.positionTitle && (
          <div
            style={{
              padding: '0.75rem',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'left',
              fontSize: '0.75rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div>ตำแหน่ง: <strong style={{ color: 'var(--text-primary)' }}>{jd.positionTitle}</strong></div>
            {jd.positionNo && <div>เลขที่ตำแหน่ง: <strong style={{ color: 'var(--text-primary)' }}>{jd.positionNo}</strong></div>}
            {jd.department && <div>สังกัด: <strong style={{ color: 'var(--text-primary)' }}>{jd.department}</strong></div>}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.6rem',
              background: 'var(--rose-50)',
              border: '1px solid var(--rose-100)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--rose-500)',
              fontSize: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn btn-danger btn-sm"
            style={{ flex: 1 }}
          >
            <Trash2 size={14} />
            <span>{isDeleting ? 'กำลังลบ...' : 'ยืนยันลบ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
