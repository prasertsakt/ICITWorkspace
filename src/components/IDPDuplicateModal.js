'use client';

import React, { useState } from 'react';
import { Copy, Sparkles, CheckCircle2, AlertCircle, ArrowRight, X, Loader2 } from 'lucide-react';
import { duplicateIdpRecordsFromPreviousYear } from '@/lib/idpService';

export default function IDPDuplicateModal({
  isOpen,
  onClose,
  fiscalYear,
  currentUser,
  currentPersonnel,
  personnelList = [],
  departmentList = [],
  executiveList = [],
  idpConfig = null,
  onCompleted,
}) {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [result, setResult] = useState(null); // { success: boolean, count?: number, error?: string }

  if (!isOpen) return null;

  const fromYear = String(Number(fiscalYear) - 1);

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    setResult(null);

    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'เจ้าหน้าที่งานบุคคล',
        email: currentUser?.email || currentPersonnel?.email || '',
      };

      const created = await duplicateIdpRecordsFromPreviousYear(
        fromYear,
        fiscalYear,
        actor,
        personnelList,
        departmentList,
        executiveList,
        idpConfig
      );

      setResult({
        success: true,
        count: created.length,
      });

      if (onCompleted) {
        onCompleted(created);
      }
    } catch (err) {
      console.error('Duplicate IDPs error:', err);
      setResult({
        success: false,
        error: err.message || 'เกิดข้อผิดพลาดในการคัดลอกข้อมูล',
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleClose = () => {
    if (isDuplicating) return;
    setResult(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          padding: '1.75rem 1.5rem',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Success State */}
        {result?.success ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#F0FDF4',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.5rem' }}>
              คัดลอกข้อมูลสำเร็จ
            </h3>

            <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
              สร้างแบบประเมิน IDP สำหรับปีงบประมาณ <strong style={{ color: '#EA580C' }}>{fiscalYear}</strong> เรียบร้อยแล้ว
              จำนวน <strong style={{ color: '#16A34A' }}>{result.count}</strong> รายการ
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="btn btn-primary"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                padding: '0.65rem',
                borderRadius: '10px',
                border: 'none',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              }}
            >
              ตกลง
            </button>
          </div>
        ) : (
          <div>
            {/* Header with Icon */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                  }}
                >
                  <Copy size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                    คัดลอกแบบประเมิน IDP
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    สร้างแบบประเมินชุดใหม่สำหรับบุคลากรทุกคน
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isDuplicating}
                className="btn btn-ghost btn-icon"
                style={{ padding: '4px', color: '#94A3B8' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Fiscal Year Transition Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                padding: '0.85rem 1rem',
                background: '#FFF7ED',
                border: '1px solid #FFEDD5',
                borderRadius: '12px',
                marginBottom: '1rem',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#9A3412', fontWeight: 600 }}>ปีงบประมาณเดิม</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#475569' }}>{fromYear}</div>
              </div>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowRight size={16} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#C2410C', fontWeight: 600 }}>ปีงบประมาณใหม่</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#EA580C' }}>{fiscalYear}</div>
              </div>
            </div>

            {/* Explanation / Policy Notice */}
            <div
              style={{
                fontSize: '0.825rem',
                color: '#475569',
                lineHeight: 1.55,
                background: '#F8FAFC',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                marginBottom: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1E293B' }}>
                <Sparkles size={14} color="#EA580C" />
                <span>รายละเอียดการดำเนินการ:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569' }}>
                <li>ระบบจะดึงโครงสร้างหัวข้อสมรรถนะและความต้องการพัฒนาจากปี <strong>{fromYear}</strong></li>
                <li>สร้างแบบประเมินสำหรับบุคลากรทุกคนในระบบ ({personnelList.length} คน)</li>
                <li><strong>จะไม่เขียนทับ</strong> บุคลากรที่มีแบบประเมินในปี <strong>{fiscalYear}</strong> อยู่แล้ว</li>
                <li>สถานะเริ่มต้นจะเป็น &quot;รอดำเนินการ (PENDING)&quot; เพื่อให้บุคลากรเข้าประเมินตนเองใหม่</li>
              </ul>
            </div>

            {/* Error Display if any */}
            {result?.error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.75rem',
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: '10px',
                  color: '#DC2626',
                  fontSize: '0.825rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{result.error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isDuplicating}
                className="btn btn-secondary"
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                }}
              >
                {isDuplicating ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>กำลังคัดลอกข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>ยืนยันคัดลอกข้อมูล</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
