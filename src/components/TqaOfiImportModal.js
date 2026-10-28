'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileCode,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Upload,
  FileText,
  Loader2,
} from 'lucide-react';
import { importTqaOfiList } from '@/lib/tqaOfiService';
import TqaBulletList from '@/components/TqaBulletList';

const TQA_AI_PROMPT = `คุณคือผู้เชี่ยวชาญระดับสูงด้านการตรวจประเมินคุณภาพองค์กรตามเกณฑ์รางวัลคุณภาพแห่งชาติ (TQA - Thailand Quality Award)
หน้าที่ของคุณคืออ่านเอกสาร "รายงานการตรวจประเมินคุณภาพ / รายงานป้อนกลับ (TQA Feedback Report)" จากไฟล์ PDF ที่แนบมานี้
และสกัดข้อเสนอแนะเพื่อการปรับปรุง (Opportunity for Improvement: OFI) ทั้งหมดที่ปรากฏในเอกสารออกมาให้ครบถ้วนทุกข้อ

เกณฑ์และข้อกำหนดสำคัญในการสกัดข้อมูล:
1. หมวดหมู่ (category): ต้องเป็นหนึ่งใน 7 หมวดตามเกณฑ์ TQA:
   - "หมวด 1 การนำองค์กร" (categoryNum: 1)
   - "หมวด 2 กลยุทธ์" (categoryNum: 2)
   - "หมวด 3 ลูกค้า" (categoryNum: 3)
   - "หมวด 4 การวัด การวิเคราะห์ และการจัดการความรู้" (categoryNum: 4)
   - "หมวด 5 บุคลากร" (categoryNum: 5)
   - "หมวด 6 ระบบปฏิบัติการ" (categoryNum: 6)
   - "หมวด 7 ผลลัพธ์" (categoryNum: 7)
2. รหัสหัวข้อ (itemRef): ระบุเลขเกณฑ์ TQA เช่น "1.1ก(2)", "2.1ก(4)", "7.1ก(1)" เป็นต้น
3. Key Theme: ระบุธีมหลักของ OFI เช่น "Key Theme B1", "Key Theme B2", "Key Theme D1" (หากในเอกสารไม่ได้ระบุ ให้จัดหมวดหมู่ตามบริบท)
4. ข้อค้นพบ (finding): สรุปข้อความข้อค้นพบหรือประเด็นโอกาสในการพัฒนา
5. หลักฐานเชิงประจักษ์ (evidence):
   ***สำคัญมาก***: หากมีหลายประเด็น ให้ใส่สัญลักษณ์ "• " นำหน้าและขึ้นบรรทัดใหม่แยกแต่ละประเด็น ห้ามตัดทอนหรือรวมเป็นประโยคเดียว
6. ผลกระทบหรือคุณค่าเชิงกลยุทธ์ (potentialImpact):
   ***สำคัญมาก***: หากมีหลายประเด็น ให้ใส่สัญลักษณ์ "• " นำหน้าและขึ้นบรรทัดใหม่แยกแต่ละประเด็น

โปรดตอบกลับเป็น JSON Array ของ OFI items เท่านั้น (ห้ามใส่คำเกริ่นนำ ข้อความทักทาย หรือ markdown fence อื่นใด ตอบเฉพาะ JSON ล้วนๆ):
[
  {
    "category": "หมวด 1 การนำองค์กร",
    "categoryNum": 1,
    "itemRef": "1.1ก(2)",
    "keyTheme": "Key Theme B1",
    "finding": "ข้อความข้อค้นพบ...",
    "evidence": "• รายการหลักฐานข้อที่ 1...\\n• รายการหลักฐานข้อที่ 2...",
    "potentialImpact": "• ผลกระทบหรือคุณค่าข้อที่ 1...\\n• ผลกระทบหรือคุณค่าข้อที่ 2..."
  }
]`;

function cleanJsonString(raw) {
  if (!raw) return '';
  let str = raw.trim();
  if (str.startsWith('```json')) {
    str = str.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (str.startsWith('```')) {
    str = str.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return str.trim();
}

export default function TqaOfiImportModal({
  isOpen,
  onClose,
  fiscalYear,
  currentUser,
  onImportSuccess,
}) {
  const [jsonText, setJsonText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [parsedItems, setParsedItems] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Preview filtering state
  const [selectedPreviewCat, setSelectedPreviewCat] = useState('ALL');
  const [previewSearch, setPreviewSearch] = useState('');
  const [expandedPreviewIdx, setExpandedPreviewIdx] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(TQA_AI_PROMPT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setErrorMsg('กรุณาเลือกไฟล์ .json เท่านั้น');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setJsonText(content);
        validateAndParseJson(content);
      }
    };
    reader.readAsText(file);
  };

  const validateAndParseJson = (textToParse) => {
    const raw = textToParse || jsonText;
    if (!raw.trim()) {
      setErrorMsg('กรุณาวางโค้ด JSON ก่อนทำการตรวจสอบ');
      setParsedItems(null);
      return;
    }

    try {
      const cleaned = cleanJsonString(raw);
      const parsed = JSON.parse(cleaned);

      let items = null;
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && Array.isArray(parsed.items)) {
        items = parsed.items;
      } else {
        throw new Error('โครงสร้าง JSON ต้องเป็น Array ของรายการ OFI');
      }

      if (items.length === 0) {
        throw new Error('ไม่พบรายการข้อมูลใน JSON');
      }

      // Normalize items
      const normalized = items.map((item, idx) => {
        const catNum =
          Number(item.categoryNum) ||
          (item.category?.match(/\d+/)?.[0] ? Number(item.category.match(/\d+/)[0]) : 1);
        const catName = item.category || `หมวด ${catNum}`;

        return {
          id: `tqa-${fiscalYear}-${String(idx + 1).padStart(2, '0')}`,
          fiscalYear: String(fiscalYear),
          category: catName,
          categoryNum: catNum,
          itemRef: (item.itemRef || `ข้อที่ ${idx + 1}`).trim(),
          keyTheme: (item.keyTheme || 'Key Theme B1').trim(),
          finding: (item.finding || '').trim(),
          evidence: (item.evidence || '').trim(),
          potentialImpact: (item.potentialImpact || '').trim(),
          status: 'PENDING',
          assignedPersons: [],
          actionReport: '',
          isTracking: true,
          executionStatus: 'TRACKED',
          isExcluded: false,
          importedAt: new Date().toISOString(),
          importedBy: currentUser?.displayName || currentUser?.email || 'Admin',
        };
      });

      setParsedItems(normalized);
      setErrorMsg('');
      setSuccessMsg(`ตรวจสอบโครงสร้าง JSON ผ่านสมบูรณ์! พบข้อมูลทั้งหมด ${normalized.length} รายการ พร้อมนำเข้า`);
    } catch (err) {
      setErrorMsg(`รูปแบบ JSON ไม่ถูกต้อง: ${err.message}`);
      setParsedItems(null);
    }
  };

  // Confirm saving to Firestore via Safe Smart Sync
  const handleSaveToFirestore = async () => {
    if (!parsedItems || parsedItems.length === 0) return;

    setIsProcessing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updatedByName = currentUser?.displayName || currentUser?.email || 'Admin';
      await importTqaOfiList(parsedItems, fiscalYear, updatedByName, { preserveProgress: true });

      setSuccessMsg(`บันทึกชุดข้อมูล ${parsedItems.length} รายการเข้าสู่ระบบ (Safe Smart Sync) สำเร็จเรียบร้อย`);
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
  const filteredPreviewItems = (parsedItems || []).filter((item) => {
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
          maxWidth: parsedItems ? '920px' : '720px',
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
                นำเข้าข้อมูล TQA OFI ด้วย AI Prompt & JSON
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8' }}>
                คัดลอกคำสั่ง Prompt ไปใช้กับ AI (พร้อมไฟล์ PDF) แล้วนำโค้ด JSON มาวางเพื่อนำเข้าสู่ปีงบประมาณ {fiscalYear}
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
            gap: '1.25rem',
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

          {!parsedItems ? (
            <>
              {/* SECTION 1: AI PROMPT COPY CARD */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                  borderRadius: '12px',
                  border: '1px solid #DDD6FE',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#7C3AED',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                      }}
                    >
                      1
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4C1D95' }}>
                      คัดลอกคำสั่ง Prompt สำหรับให้ AI อ่านเอกสาร PDF และสร้าง JSON
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="btn btn-primary btn-sm"
                    style={{
                      background: copiedPrompt ? '#059669' : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                      borderColor: copiedPrompt ? '#059669' : '#6D28D9',
                      boxShadow: '0 4px 10px rgba(109, 40, 217, 0.25)',
                      gap: '6px',
                      fontWeight: 700,
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {copiedPrompt ? (
                      <>
                        <Check size={16} />
                        <span>คัดลอกคำสั่งเรียบร้อยแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>📋 คัดลอกคำสั่ง Prompt สำหรับ AI</span>
                      </>
                    )}
                  </button>
                </div>

                <div style={{ fontSize: '0.825rem', color: '#5B21B6', lineHeight: 1.5 }}>
                  <strong>วิธีใช้งาน:</strong> ก๊อปปี้คำสั่งนี้ไปวางคู่กับการแนบไฟล์ PDF เล่มรายงาน TQA ใน AI (เช่น Google AI Studio, Gemini, ChatGPT หรือ Claude) เพื่อให้ AI สกัดข้อเสนอแนะออกมาเป็น JSON ที่ถูกต้องตามมาตรฐาน
                </div>

                {/* Prompt Details Expandable */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPromptDetails(!showPromptDetails)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#7C3AED',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{showPromptDetails ? 'ซ่อนตัวอย่างคำสั่ง Prompt' : 'คลิกเพื่อดูเนื้อหาคำสั่ง Prompt'}</span>
                    {showPromptDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showPromptDetails && (
                    <pre
                      style={{
                        marginTop: '8px',
                        background: '#1E1B4B',
                        color: '#E0E7FF',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        lineHeight: 1.5,
                        maxHeight: '180px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                      }}
                    >
                      {TQA_AI_PROMPT}
                    </pre>
                  )}
                </div>
              </div>

              {/* SECTION 2: PASTE JSON OR UPLOAD .JSON FILE */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#EA580C',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                      }}
                    >
                      2
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                      วางโค้ด JSON ที่ได้จาก AI หรืออัปโหลดไฟล์ (.json)
                    </span>
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px', fontSize: '0.8rem' }}
                    >
                      <Upload size={14} />
                      <span>อัปโหลดไฟล์ .json</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  className="form-input"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    background: '#F8FAFC',
                    borderRadius: '8px',
                  }}
                  placeholder={`วางโค้ด JSON ที่ AI สร้างขึ้นที่นี่ เช่น:\n[\n  {\n    "category": "หมวด 1 การนำองค์กร",\n    "categoryNum": 1,\n    "itemRef": "1.1ก(2)",\n    "finding": "...",\n    "evidence": "• ข้อที่ 1...\\n• ข้อที่ 2...",\n    "potentialImpact": "• ผลกระทบ...\\n• คุณค่า..."\n  }\n]`}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                />

                {/* Safe Smart Sync Notice */}
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#065F46',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Safe Smart Sync:</strong> ระบบจะอัปเดตเนื้อหา และ<strong>คงรักษารายชื่อผู้รายงานผล (Assigned Persons) และประวัติรายงานเดิมไว้ 100%</strong> ไม่สูญหาย
                  </span>
                </div>

                {/* Parse & Preview Button */}
                <button
                  type="button"
                  onClick={() => validateAndParseJson()}
                  disabled={!jsonText.trim()}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    borderColor: '#EA580C',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
                    justifyContent: 'center',
                    padding: '0.85rem',
                    gap: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                  }}
                >
                  <Sparkles size={18} />
                  <span>ตรวจสอบโครงสร้างและดูตัวอย่างข้อมูล (Parse & Preview)</span>
                </button>
              </div>
            </>
          ) : (
            /* PREVIEW & SAVE CONFIRMATION */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
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
                  <div style={{ fontWeight: 800, color: '#166534', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={18} color="#16A34A" />
                    <span>ตรวจสอบผ่านสมบูรณ์ พบข้อมูล {parsedItems.length} รายการ</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#15803D', marginTop: '2px' }}>
                    พร้อมนำเข้าสู่ระบบปีงบประมาณ {fiscalYear} ด้วยเทคโนโลยี Safe Smart Sync
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParsedItems(null);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.8rem' }}
                >
                  แก้ไข JSON / วางใหม่
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
                    ทั้งหมด ({parsedItems.length})
                  </button>
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                    const count = parsedItems.filter((i) => i.categoryNum === num || i.category?.includes(String(num))).length;
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
                  onClick={() => setParsedItems(null)}
                  className="btn btn-secondary"
                  disabled={isProcessing}
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleSaveToFirestore}
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
                      <span>ยืนยันบันทึกชุดข้อมูล {parsedItems.length} รายการเข้าสู่ปีงบประมาณ {fiscalYear} (Safe Smart Sync)</span>
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
