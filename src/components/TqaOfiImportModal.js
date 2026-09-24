'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { SEED_TQA_OFI_2568 } from '@/lib/tqaSeedData';
import { importTqaOfiList, duplicateTqaOfiFromPreviousYear } from '@/lib/tqaOfiService';

export default function TqaOfiImportModal({
  isOpen,
  onClose,
  fiscalYear,
  currentUser,
  onImportSuccess,
}) {
  const [activeTab, setActiveTab] = useState('seed'); // 'seed' | 'duplicate' | 'json'
  const [sourceYear, setSourceYear] = useState(String(Number(fiscalYear) - 1));
  const [jsonText, setJsonText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleImportSeed = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updatedByName = currentUser?.displayName || currentUser?.email || 'Admin';
      const itemsToImport = SEED_TQA_OFI_2568.map((item, idx) => ({
        ...item,
        id: `tqa-${fiscalYear}-${idx + 1}`,
        fiscalYear: String(fiscalYear),
      }));

      await importTqaOfiList(itemsToImport, fiscalYear, updatedByName);
      setSuccessMsg(`นำเข้าข้อมูลข้อเสนอแนะจากเล่มรายงาน 2568 จำนวน ${itemsToImport.length} รายการสำเร็จ`);
      if (onImportSuccess) onImportSuccess();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicate = async () => {
    if (!sourceYear) {
      setErrorMsg('กรุณาระบุปีงบประมาณต้นทาง');
      return;
    }
    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updatedByName = currentUser?.displayName || currentUser?.email || 'Admin';
      await duplicateTqaOfiFromPreviousYear(sourceYear, fiscalYear, updatedByName);
      setSuccessMsg(`คัดลอกข้อมูล OFI จากปี ${sourceYear} มายังปี ${fiscalYear} สำเร็จ`);
      if (onImportSuccess) onImportSuccess();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการคัดลอกข้อมูล');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportJson = async () => {
    if (!jsonText.trim()) {
      setErrorMsg('กรุณาวางโค้ด JSON');
      return;
    }
    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('รูปแบบ JSON ต้องเป็น Array ของรายการ OFI');
      }

      const updatedByName = currentUser?.displayName || currentUser?.email || 'Admin';
      await importTqaOfiList(parsed, fiscalYear, updatedByName);
      setSuccessMsg(`นำเข้าข้อมูลจำนวน ${parsed.length} รายการสำเร็จ`);
      if (onImportSuccess) onImportSuccess();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setErrorMsg(err.message || 'รูปแบบ JSON ไม่ถูกต้อง');
    } finally {
      setIsProcessing(false);
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
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '1.25rem',
          maxWidth: '620px',
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
              <Upload size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                นำเข้าข้อมูลข้อเสนอแนะ TQA OFI
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#DDD6FE' }}>
                สำหรับปีงบประมาณ {fiscalYear}
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

        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
            padding: '0.5rem 1rem 0',
            gap: '6px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('seed')}
            style={{
              padding: '8px 14px',
              borderBottom: activeTab === 'seed' ? '2px solid #7C3AED' : '2px solid transparent',
              color: activeTab === 'seed' ? '#6D28D9' : '#64748B',
              fontWeight: activeTab === 'seed' ? 700 : 500,
              fontSize: '0.85rem',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={15} />
            <span>จาก Feedback Report 2568</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('duplicate')}
            style={{
              padding: '8px 14px',
              borderBottom: activeTab === 'duplicate' ? '2px solid #7C3AED' : '2px solid transparent',
              color: activeTab === 'duplicate' ? '#6D28D9' : '#64748B',
              fontWeight: activeTab === 'duplicate' ? 700 : 500,
              fontSize: '0.85rem',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Copy size={15} />
            <span>คัดลอกจากปีก่อนหน้า</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            style={{
              padding: '8px 14px',
              borderBottom: activeTab === 'json' ? '2px solid #7C3AED' : '2px solid transparent',
              color: activeTab === 'json' ? '#6D28D9' : '#64748B',
              fontWeight: activeTab === 'json' ? 700 : 500,
              fontSize: '0.85rem',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={15} />
            <span>นำเข้า JSON</span>
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

          {activeTab === 'seed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.9rem', lineHeight: 1.6, color: '#334155' }}>
                <strong style={{ color: '#6D28D9' }}>ชุดข้อมูลสกัดจากเล่มรายงานประเมินตนเอง 2568:</strong>
                <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  ประกอบด้วยข้อเสนอแนะเพื่อการปรับปรุงทั้งหมด <strong>47 รายการ</strong> ครอบคลุมหมวด 1 - 7 (Finding, Evidence, Potential Impact, Key Themes)
                </p>
              </div>

              <button
                type="button"
                onClick={handleImportSeed}
                disabled={isProcessing}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                  borderColor: '#6D28D9',
                  justifyContent: 'center',
                  padding: '0.75rem',
                  gap: '8px',
                  fontWeight: 700,
                }}
              >
                <Sparkles size={16} />
                <span>{isProcessing ? 'กำลังนำเข้า...' : `นำเข้าชุดข้อมูลเข้าสู่ปีงบประมาณ ${fiscalYear}`}</span>
              </button>
            </div>
          )}

          {activeTab === 'duplicate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  คัดลอกจากปีงบประมาณต้นทาง:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={sourceYear}
                  onChange={(e) => setSourceYear(e.target.value)}
                  placeholder="เช่น 2568"
                />
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                  ระบบจะคัดลอกรายการข้อค้นพบทั้งหมดโดยตั้งค่าสถานะเป็น "รอดำเนินการ (PENDING)" ใหม่สำหรับปี {fiscalYear}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isProcessing}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                  borderColor: '#6D28D9',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 700,
                }}
              >
                <Copy size={16} />
                <span>{isProcessing ? 'กำลังคัดลอก...' : `คัดลอกรายการเข้าสู่ปี ${fiscalYear}`}</span>
              </button>
            </div>
          )}

          {activeTab === 'json' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  วางโค้ด JSON ข้อมูล OFI:
                </label>
                <textarea
                  rows={6}
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                  placeholder="[ { &quot;category&quot;: &quot;หมวด 1&quot;, &quot;itemRef&quot;: &quot;1.1ก(2)&quot;, &quot;finding&quot;: &quot;...&quot; } ]"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={handleImportJson}
                disabled={isProcessing}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                  borderColor: '#6D28D9',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 700,
                }}
              >
                <Upload size={16} />
                <span>{isProcessing ? 'กำลังประมวลผล...' : 'นำเข้า JSON'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isProcessing}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
