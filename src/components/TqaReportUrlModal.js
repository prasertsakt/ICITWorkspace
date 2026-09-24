'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, ExternalLink, Link2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { saveTqaReportConfig } from '@/lib/tqaOfiService';

export default function TqaReportUrlModal({
  isOpen,
  onClose,
  fiscalYear,
  initialConfig,
  onSaved,
  currentUser,
}) {
  const [reportUrl, setReportUrl] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReportUrl(initialConfig?.reportUrl || '');
      setReportTitle(
        initialConfig?.reportTitle ||
          `รายงานการตรวจประเมินคุณภาพการศึกษาภายใน ประจำปีการศึกษา ${fiscalYear} (Feedback Report)`
      );
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, fiscalYear, initialConfig]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updatedByName = currentUser?.displayName || currentUser?.email || 'Admin';
      await saveTqaReportConfig(fiscalYear, reportUrl, reportTitle, updatedByName);
      setSuccessMsg('บันทึกลิงก์รายงานเรียบร้อยแล้ว');
      if (onSaved) onSaved({ fiscalYear, reportUrl, reportTitle });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '1.25rem',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Link2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                ตั้งค่าลิงก์รายงาน Feedback Report
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#DDD6FE' }}>
                ปีงบประมาณ / ปีการศึกษา {fiscalYear}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ color: '#FFFFFF' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#FEE2E2',
                color: '#DC2626',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#DCFCE7',
                color: '#15803D',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              ชื่อรายงาน (Report Title)
            </label>
            <input
              type="text"
              className="form-input"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="เช่น รายงานการตรวจประเมินคุณภาพการศึกษาภายใน ประจำปีการศึกษา 2568"
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              URL ไฟล์รายงาน (PDF / Google Drive Link)
            </label>
            <input
              type="url"
              className="form-input"
              value={reportUrl}
              onChange={(e) => setReportUrl(e.target.value)}
              placeholder="https://drive.google.com/... หรือ https://.../report.pdf"
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
              ระบุลิงก์เปิดไฟล์เพื่อให้บุคลากรและผู้ตรวจประเมินสามารถคลิกเปิดอ่านรายงานฉบับเต็มได้ทันที
            </p>
          </div>

          {reportUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px', fontSize: '0.8rem' }}
              >
                <ExternalLink size={14} /> ทดสอบเปิดลิงก์
              </a>
            </div>
          )}

          {/* Footer Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '1rem',
              borderTop: '1px solid #F1F5F9',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSaving}>
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{
                background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                borderColor: '#6D28D9',
                gap: '6px',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกลิงก์'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
