'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  ExternalLink,
  Link2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { saveKmDocConfig } from '@/lib/kmHubService';

export default function KMDocConfigModal({
  isOpen,
  onClose,
  fiscalYear = 'ALL',
  initialConfig = null,
  onSaved,
  currentUser,
  currentPersonnel,
}) {
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [additionalLinks, setAdditionalLinks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fyText = fiscalYear === 'ALL' ? '' : ` ประจำปีงบประมาณ ${fiscalYear}`;
      setDocumentTitle(
        initialConfig?.documentTitle || `แนวทางและคู่มือการจัดการองค์ความรู้ KM${fyText}`
      );
      setDocumentUrl(initialConfig?.documentUrl || '');
      setAdditionalLinks(
        Array.isArray(initialConfig?.additionalLinks) && initialConfig.additionalLinks.length > 0
          ? initialConfig.additionalLinks.map((l) => ({
              title: l.title || '',
              url: l.url || '',
            }))
          : []
      );
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, fiscalYear, initialConfig]);

  if (!isOpen) return null;

  const handleAddLink = () => {
    setAdditionalLinks((prev) => [...prev, { title: '', url: '' }]);
  };

  const handleRemoveLink = (idx) => {
    setAdditionalLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLinkChange = (idx, field, val) => {
    setAdditionalLinks((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'ผู้ดูแลระบบ',
        email: currentUser?.email || currentPersonnel?.email || '',
      };

      const payload = {
        documentTitle: documentTitle.trim(),
        documentUrl: documentUrl.trim(),
        additionalLinks: additionalLinks.filter((l) => (l.url || '').trim()),
      };

      await saveKmDocConfig(fiscalYear, payload, actor);
      setSuccessMsg('บันทึกการตั้งค่าลิงก์เอกสารแนบเรียบร้อยแล้ว');
      if (onSaved) onSaved({ fiscalYear, ...payload });

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
        zIndex: 11000,
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
          maxWidth: '620px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E2E8F0',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Link2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                ตั้งค่าลิงก์เอกสารแนบ / รายงาน KM
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#D1FAE5' }}>
                {fiscalYear === 'ALL' ? 'เอกสารทั่วไปสำหรับทุกปีงบประมาณ' : `ปีงบประมาณ ${fiscalYear}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ color: '#FFFFFF', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            overflowY: 'auto',
          }}
        >
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

          {/* Primary Document Section */}
          <div
            style={{
              padding: '1rem',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065F46', fontWeight: 800, fontSize: '0.9rem' }}>
              <BookOpen size={16} />
              <span>เอกสารหลัก / คู่มือ KM</span>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.825rem' }}>
                ชื่อเอกสาร (Document Title) <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="เช่น แนวทางและคู่มือการจัดการองค์ความรู้ KM ICIT ประจำปีงบประมาณ 2568"
                required
                style={{ fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.825rem' }}>
                URL ลิงก์เอกสารหลัก (Google Drive / Web link / PDF)
              </label>
              <input
                type="url"
                className="form-input"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://drive.google.com/... หรือ https://icit.kmutnb.ac.th/.../km-guideline.pdf"
                style={{ fontSize: '0.875rem' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                ระบุลิงก์เปิดไฟล์เพื่อให้บุคลากรสามารถคลิกเปิดอ่านคู่มือ/เอกสารแนวทาง KM ฉบับเต็มได้ทันที
              </p>
            </div>

            {documentUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{
                    gap: '6px',
                    fontSize: '0.775rem',
                    color: '#059669',
                    borderColor: '#A7F3D0',
                    background: '#ECFDF5',
                  }}
                >
                  <ExternalLink size={14} /> ทดสอบเปิดลิงก์เอกสารหลัก
                </a>
              </div>
            )}
          </div>

          {/* Additional Attached Links Section */}
          <div
            style={{
              padding: '1rem',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E293B', fontWeight: 800, fontSize: '0.9rem' }}>
                <FileText size={16} color="#059669" />
                <span>เอกสารแนบเพิ่มเติม / แบบฟอร์ม / สื่อนำเสนอ (ถ้ามี)</span>
              </div>
              <button
                type="button"
                onClick={handleAddLink}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#065F46',
                  borderColor: '#A7F3D0',
                }}
              >
                <Plus size={12} />
                <span>เพิ่มลิงก์</span>
              </button>
            </div>

            {additionalLinks.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', textAlign: 'center', padding: '0.5rem 0' }}>
                ไม่มีเอกสารแนบเพิ่มเติม (สามารถคลิกปุ่ม &quot;+ เพิ่มลิงก์&quot; เพื่อแนบแบบฟอร์มหรือสไลด์เพิ่มเติม)
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {additionalLinks.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ชื่อเอกสาร เช่น แบบฟอร์มสรุปองค์ความรู้"
                      value={item.title}
                      onChange={(e) => handleLinkChange(idx, 'title', e.target.value)}
                      style={{ flex: '0 0 40%', fontSize: '0.825rem' }}
                    />
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://drive.google.com/..."
                      value={item.url}
                      onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                      style={{ flex: 1, fontSize: '0.825rem' }}
                    />
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#059669',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="ทดสอบเปิดลิงก์"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#DC2626',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                      }}
                      title="ลบรายการนี้"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '0.5rem',
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
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderColor: '#047857',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกลิงก์เอกสาร'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
