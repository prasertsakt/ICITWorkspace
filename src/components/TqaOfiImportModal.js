'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileUp,
  File,
  Loader2,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { importTqaOfiList } from '@/lib/tqaOfiService';
import TqaBulletList from '@/components/TqaBulletList';

export default function TqaOfiImportModal({
  isOpen,
  onClose,
  fiscalYear,
  currentUser,
  onImportSuccess,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // PDF & AI State
  const [pdfFile, setPdfFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState(null);
  const [extractedModel, setExtractedModel] = useState('');
  const [selectedPreviewCat, setSelectedPreviewCat] = useState('ALL');
  const [previewSearch, setPreviewSearch] = useState('');
  const [expandedPreviewIdx, setExpandedPreviewIdx] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle Drag & Drop
  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        if (file.size > 4.5 * 1024 * 1024) {
          setPdfFile(null);
          setErrorMsg(`ขนาดไฟล์ (${(file.size / (1024 * 1024)).toFixed(2)} MB) เกินขีดจำกัด 4.5 MB ของ Vercel กรุณาลดขนาดไฟล์ หรือแยกเฉพาะหน้าที่ต้องการสกัด`);
          return;
        }
        setPdfFile(file);
        setErrorMsg('');
      } else {
        setErrorMsg('กรุณาเลือกไฟล์เอกสารนามสกุล .pdf เท่านั้น');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        if (file.size > 4.5 * 1024 * 1024) {
          setPdfFile(null);
          setErrorMsg(`ขนาดไฟล์ (${(file.size / (1024 * 1024)).toFixed(2)} MB) เกินขีดจำกัด 4.5 MB ของ Vercel กรุณาลดขนาดไฟล์ หรือแยกเฉพาะหน้าที่ต้องการสกัด`);
          return;
        }
        setPdfFile(file);
        setErrorMsg('');
      } else {
        setErrorMsg('กรุณาเลือกไฟล์เอกสารนามสกุล .pdf เท่านั้น');
      }
    }
  };

  // Extract OFI items from PDF via /api/tqa/extract-pdf (using server-side GEMINI_API_KEY)
  const handleExtractPdf = async () => {
    if (!pdfFile) {
      setErrorMsg('กรุณาเลือกไฟล์ PDF เล่มรายงาน TQA Feedback Report');
      return;
    }

    // Vercel Serverless payload limit check (4.5 MB)
    if (pdfFile.size > 4.5 * 1024 * 1024) {
      setErrorMsg(
        `ขนาดไฟล์ PDF (${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB) ใหญ่เกินขีดจำกัดของเซิร์ฟเวอร์ (สูงสุด 4.5 MB) กรุณาลดขนาดไฟล์ หรือแยกเฉพาะหน้าที่ต้องการสกัดก่อนอัปโหลด`
      );
      return;
    }

    setIsExtracting(true);
    setErrorMsg('');
    setSuccessMsg('');
    setExtractedItems(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('fiscalYear', fiscalYear);

      const res = await fetch('/api/tqa/extract-pdf', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawText = await res.text();
      let data = null;

      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        if (res.status === 413 || rawText.includes('413') || rawText.includes('Payload Too Large')) {
          throw new Error('ขนาดไฟล์ PDF ใหญ่เกินขีดจำกัดของ Vercel (สูงสุด 4.5 MB) กรุณาลดขนาดไฟล์ก่อนอัปโหลด');
        }
        if (
          res.status === 504 ||
          rawText.includes('FUNCTION_INVOCATION_TIMEOUT') ||
          rawText.includes('Timeout') ||
          rawText.includes('timeout')
        ) {
          throw new Error(
            'เซิร์ฟเวอร์ประมวลผลหมดเวลา (Timeout) เนื่องจากไฟล์มีหลายหน้าหรือโมเดล AI ตอบสนองช้า กรุณาลองใหม่อีกครั้ง'
          );
        }
        throw new Error(
          `เซิร์ฟเวอร์แจ้งข้อผิดพลาด (${res.status}): ${rawText.slice(0, 150)}`
        );
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'ไม่สามารถสกัดข้อมูลจากไฟล์ PDF ได้');
      }

      setExtractedItems(data.items || []);
      setExtractedModel(data.modelUsed || 'Gemini Flash');
      setSuccessMsg(`AI สกัดข้อมูลสำเร็จทั้งหมด ${data.count} รายการ จากเล่มรายงาน (โดยโมเดล ${data.modelUsed || 'Gemini'})`);
    } catch (err) {
      if (err.name === 'AbortError') {
        setErrorMsg('การเชื่อมต่อหมดเวลา (Client Timeout) กรุณาลองใหม่อีกครั้ง');
      } else {
        setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสกัดข้อมูลจากไฟล์ PDF');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsExtracting(false);
    }
  };

  // Confirm saving extracted items to Firestore (Safe Smart Sync)
  const handleSaveExtracted = async () => {
    if (!extractedItems || extractedItems.length === 0) return;

    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updatedByName = currentUser?.displayName || currentUser?.email || 'Admin';
      await importTqaOfiList(extractedItems, fiscalYear, updatedByName, { preserveProgress: true });

      setSuccessMsg(`บันทึกชุดข้อมูล ${extractedItems.length} รายการเข้าสู่ระบบ (Safe Smart Sync) สำเร็จ`);
      if (onImportSuccess) onImportSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter preview items
  const filteredPreviewItems = (extractedItems || []).filter((item) => {
    if (selectedPreviewCat !== 'ALL') {
      const catNum = Number(selectedPreviewCat);
      if (item.categoryNum !== catNum && !item.category?.includes(String(catNum))) {
        return false;
      }
    }
    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      const match =
        (item.itemRef || '').toLowerCase().includes(q) ||
        (item.finding || '').toLowerCase().includes(q) ||
        (item.evidence || '').toLowerCase().includes(q) ||
        (item.potentialImpact || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

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
          maxWidth: extractedItems ? '880px' : '640px',
          width: '100%',
          maxHeight: '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E2E8F0',
          transition: 'max-width 0.25s ease',
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)',
              }}
            >
              <Sparkles size={20} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                อัปโหลดไฟล์ PDF (AI Extract) TQA OFI
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8' }}>
                สกัดข้อเสนอแนะอัตโนมัติด้วย AI จากเล่มรายงาน TQA Feedback Report (ปีงบประมาณ {fiscalYear})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ color: '#94A3B8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: 'calc(90vh - 100px)',
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

          {!extractedItems ? (
            <>
              {/* Upload Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '12px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  background: pdfFile ? '#F5F3FF' : '#F8FAFC',
                  borderColor: pdfFile ? '#8B5CF6' : '#CBD5E1',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {pdfFile ? (
                  <>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: '#EDE9FE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <File size={28} color="#7C3AED" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#4C1D95', fontSize: '1rem' }}>
                        {pdfFile.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6D28D9', marginTop: '2px' }}>
                        ขนาดไฟล์: {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#8B5CF6', textDecoration: 'underline', fontWeight: 600 }}>
                      คลิกเพื่อเปลี่ยนไฟล์ PDF
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: '#F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileUp size={26} color="#64748B" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#334155', fontSize: '1rem' }}>
                        ลากและวางไฟล์เล่มรายงาน TQA Feedback Report (.pdf)
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                        หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Safe Smart Sync Notice */}
              <div
                style={{
                  padding: '10px 14px',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  color: '#065F46',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  lineHeight: 1.5,
                }}
              >
                <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Safe Smart Sync:</strong> AI จะประมวลผลสกัดแยกหัวข้อ Finding, Evidence (ทุก bullet) และ Potential Impact (ทุก bullet) พร้อมระบุหมวด 1 - 7 อย่างแม่นยำ โดยจะ<strong>คงรักษารายชื่อผู้รายงานผล (Assigned Persons) และผลการดำเนินงานเดิมไว้ 100%</strong> ไม่สูญหาย
                </span>
              </div>

              {/* Extract Button */}
              <button
                type="button"
                onClick={handleExtractPdf}
                disabled={!pdfFile || isExtracting}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                  borderColor: '#6D28D9',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  justifyContent: 'center',
                  padding: '0.9rem',
                  gap: '8px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                {isExtracting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>กำลังอ่านเอกสาร PDF และสกัดข้อเสนอแนะด้วย Gemini AI (เอกสารขนาดใหญ่ใช้เวลาประมาณ 30-70 วินาที กรุณารอสักครู่)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>เริ่มสกัดข้อมูล OFI จากไฟล์ PDF ด้วย AI</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* EXTRACTED PREVIEW & CONFIRMATION */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  background: '#F5F3FF',
                  border: '1px solid #DDD6FE',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: '#5B21B6', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="#7C3AED" />
                    <span>สกัดข้อมูลสำเร็จ {extractedItems.length} รายการ</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6D28D9', marginTop: '2px' }}>
                    ประมวลผลโดยโมเดล <strong>{extractedModel}</strong> จากไฟล์: {pdfFile?.name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExtractedItems(null);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.8rem' }}
                >
                  เลือกไฟล์ใหม่ / สกัดใหม่
                </button>
              </div>

              {/* Category Pills & Search */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewCat('ALL')}
                    className={`btn btn-sm ${selectedPreviewCat === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                  >
                    ทั้งหมด ({extractedItems.length})
                  </button>
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                    const count = extractedItems.filter((i) => i.categoryNum === num || i.category?.includes(String(num))).length;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedPreviewCat(String(num))}
                        className={`btn btn-sm ${selectedPreviewCat === String(num) ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                      >
                        หมวด {num} ({count})
                      </button>
                    );
                  })}
                </div>

                <div style={{ position: 'relative', minWidth: '180px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    placeholder="ค้นหาข้อความ..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    style={{ paddingLeft: '30px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* List of Preview Items */}
              <div
                style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  background: '#FAFAFA',
                }}
              >
                {filteredPreviewItems.map((item, idx) => {
                  const isExpanded = expandedPreviewIdx === idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div
                        onClick={() => setExpandedPreviewIdx(isExpanded ? null : idx)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              background: '#EDE9FE',
                              color: '#6D28D9',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {item.itemRef || `ข้อที่ ${idx + 1}`}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                            {item.category}
                          </span>
                          {item.keyTheme && (
                            <span style={{ fontSize: '0.7rem', color: '#64748B', background: '#F1F5F9', padding: '1px 6px', borderRadius: '4px' }}>
                              {item.keyTheme}
                            </span>
                          )}
                        </div>
                        <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ padding: '2px', color: '#64748B' }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 500, lineHeight: 1.5 }}>
                        {item.finding}
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {item.evidence && (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1', marginBottom: '2px' }}>
                                🔍 หลักฐานเชิงประจักษ์ (Evidence):
                              </div>
                              <TqaBulletList text={item.evidence} bulletColor="#0284C7" bulletBg="#E0F2FE" fontSize="0.8rem" />
                            </div>
                          )}
                          {item.potentialImpact && (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F766E', marginBottom: '2px' }}>
                                💡 ผลกระทบและคุณค่าเชิงกลยุทธ์ (Potential Impact):
                              </div>
                              <TqaBulletList text={item.potentialImpact} bulletColor="#0F766E" bulletBg="#CCFBF1" fontSize="0.8rem" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Save Confirmation Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setExtractedItems(null)}
                  className="btn btn-secondary"
                  disabled={isProcessing}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveExtracted}
                  disabled={isProcessing}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                    borderColor: '#059669',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    gap: '6px',
                    fontWeight: 700,
                    padding: '0.75rem 1.25rem',
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>กำลังบันทึกชุดข้อมูล...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>ยืนยันบันทึกชุดข้อมูล {extractedItems.length} รายการเข้าสู่ปีงบประมาณ {fiscalYear} (Safe Smart Sync)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
