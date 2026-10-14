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
import { saveTqaReportConfig } from '@/lib/tqaOfiService';

export default function TqaReportUrlModal({
  isOpen,
  onClose,
  fiscalYear,
  initialConfig,
  onSaved,
  currentUser,
  currentPersonnel,
}) {
  const [reportUrl, setReportUrl] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [additionalLinks, setAdditionalLinks] = useState([]);
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
      const updatedByName =
        currentPersonnel?.name || currentUser?.displayName || currentUser?.email || 'Admin';

      const cleanedLinks = additionalLinks
        .filter((l) => (l.url || '').trim())
        .map((l) => ({
          title: (l.title || '').trim() || 'เอกสารแนบ',
          url: l.url.trim(),
        }));

      await saveTqaReportConfig(fiscalYear, reportUrl, reportTitle, updatedByName, cleanedLinks);
      setSuccessMsg('บันทึกลิงก์รายงานและเอกสารแนบเรียบร้อยแล้ว');
      if (onSaved) {
        onSaved({
          fiscalYear,
          reportUrl: reportUrl.trim(),
          reportTitle: reportTitle.trim(),
          additionalLinks: cleanedLinks,
        });
      }
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
          maxWidth: '680px',
          width: '100%',
          maxHeight: '92vh',
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
            background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
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
                background: 'rgba(249, 115, 22, 0.22)',
                color: '#FB923C',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Link2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                ตั้งค่าลิงก์รายงานและเอกสารแนบ (TQA)
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#FED7AA' }}>
                ระบบ TQA OFI Tracking ประจำปีงบประมาณ / ปีการศึกษา {fiscalYear}
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

          {/* Section 1: Main Feedback Report */}
          <div
            style={{
              padding: '1.15rem',
              background: '#FFF7ED',
              borderRadius: '12px',
              border: '1px solid #FFEDD5',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9A3412', fontWeight: 800, fontSize: '0.925rem' }}>
              <BookOpen size={18} color="#EA580C" />
              <span>1. รายงานหลัก (Feedback Report / Main Report)</span>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#431407' }}>
                ชื่อรายงานหลัก (Report Title) <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="เช่น รายงานการตรวจประเมินคุณภาพการศึกษาภายใน ประจำปีการศึกษา 2568"
                required
                style={{ background: '#FFFFFF' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#431407' }}>
                URL ไฟล์รายงานหลัก (PDF / Google Drive Link)
              </label>
              <input
                type="url"
                className="form-input"
                value={reportUrl}
                onChange={(e) => setReportUrl(e.target.value)}
                placeholder="https://drive.google.com/... หรือ https://.../report.pdf"
                style={{ background: '#FFFFFF' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#7C2D12' }}>
                ระบุลิงก์เปิดไฟล์เพื่อให้บุคลากรและผู้ตรวจประเมินสามารถคลิกเปิดอ่านรายงานฉบับเต็มได้ทันที
              </p>
            </div>

            {reportUrl && (
              <div>
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    background: '#FFFFFF',
                    borderColor: '#FED7AA',
                    color: '#C2410C',
                    fontWeight: 600,
                  }}
                >
                  <ExternalLink size={14} /> ทดสอบเปิดลิงก์รายงานหลัก
                </a>
              </div>
            )}
          </div>

          {/* Section 2: Additional Attached Links */}
          <div
            style={{
              padding: '1.15rem',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B', fontWeight: 800, fontSize: '0.925rem' }}>
                <FileText size={18} color="#EA580C" />
                <span>2. ลิงก์เอกสารแนบเพิ่มเติม / สื่อนำเสนอ / Dashboard (ถ้ามี)</span>
              </div>
              <button
                type="button"
                onClick={handleAddLink}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#EA580C',
                  borderColor: '#FED7AA',
                  background: '#FFF7ED',
                  fontWeight: 700,
                }}
              >
                <Plus size={14} />
                <span>เพิ่มลิงก์</span>
              </button>
            </div>

            {additionalLinks.length === 0 ? (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#94A3B8',
                  textAlign: 'center',
                  padding: '1.25rem 1rem',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px dashed #CBD5E1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Link2 size={24} color="#94A3B8" />
                <span>ยังไม่มีเอกสารแนบเพิ่มเติม</span>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  สามารถคลิกปุ่ม &quot;+ เพิ่มลิงก์&quot; ด้านบน เพื่อแนบสไลด์นำเสนอ แดชบอร์ดสรุปผล หรือแบบฟอร์มที่เกี่ยวข้อง
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {additionalLinks.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '10px 12px',
                      background: '#F8FAFC',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#EA580C',
                          background: '#FFEDD5',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        ลิงก์เพิ่มเติม #{idx + 1}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#EA580C',
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
                            alignItems: 'center',
                            borderRadius: '4px',
                          }}
                          title="ลบรายการนี้"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1.2fr) minmax(200px, 2fr)', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="ชื่อเอกสาร เช่น สไลด์นำเสนอ TQA"
                        value={item.title}
                        onChange={(e) => handleLinkChange(idx, 'title', e.target.value)}
                        style={{ fontSize: '0.825rem', background: '#FFFFFF' }}
                      />
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://drive.google.com/... หรือ https://..."
                        value={item.url}
                        onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                        style={{ fontSize: '0.825rem', background: '#FFFFFF' }}
                      />
                    </div>
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
              paddingTop: '0.75rem',
              borderTop: '1px solid #F1F5F9',
              marginTop: '0.5rem',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                borderColor: '#EA580C',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                gap: '6px',
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกลิงก์ทั้งหมด'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
