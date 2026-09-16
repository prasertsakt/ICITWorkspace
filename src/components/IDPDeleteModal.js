'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { deleteIdpRecord } from '@/lib/idpService';

export default function IDPDeleteModal({ isOpen, onClose, record, onDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !record) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteIdpRecord(record.id, record.fiscalYear);
      if (onDeleted) {
        onDeleted(record.id);
      }
      onClose();
    } catch (err) {
      console.error('Delete IDP error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการลบแบบประเมิน');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={isDeleting ? undefined : onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          textAlign: 'center',
          padding: '1.75rem 1.5rem',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Warning Icon Badge */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: '#FEF2F2',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <AlertTriangle size={26} />
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#1E293B' }}>
          ยืนยันการลบแบบประเมิน IDP
        </h3>

        <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1rem' }}>
          คุณต้องการลบแบบประเมิน IDP ปีงบประมาณ{' '}
          <strong style={{ color: '#1E293B' }}>{record.fiscalYear}</strong> ของ{' '}
          <strong style={{ color: '#1E293B' }}>{record.personnelName}</strong> ใช่หรือไม่?
        </p>

        {/* Record Info Box */}
        <div
          style={{
            padding: '0.75rem 1rem',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            textAlign: 'left',
            fontSize: '0.8rem',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            color: '#475569',
          }}
        >
          <div>
            ชื่อ-สกุล: <strong style={{ color: '#1E293B' }}>{record.personnelName}</strong>
          </div>
          {record.position && (
            <div>
              ตำแหน่ง: <strong style={{ color: '#1E293B' }}>{record.position}</strong>
            </div>
          )}
          {record.department && (
            <div>
              ฝ่าย/ส่วนงาน: <strong style={{ color: '#1E293B' }}>{record.department}</strong>
            </div>
          )}
          <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
            * ข้อมูลการประเมินและผลการวิเคราะห์จะถูกลบและไม่สามารถกู้คืนได้
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '0.6rem',
              background: '#FEF2F2',
              border: '1px solid #FEE2E2',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '0.775rem',
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
            className="btn btn-secondary"
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn btn-danger"
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: '#EF4444',
              color: '#FFFFFF',
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>กำลังลบ...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>ยืนยันการลบ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
