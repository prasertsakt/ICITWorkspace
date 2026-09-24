'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Quote,
  RotateCcw,
  Sparkles,
  User,
  Tag,
  Check,
} from 'lucide-react';
import { saveTqaOfiItem, canEditTqaOfiProgress } from '@/lib/tqaOfiService';
import { TQA_STATUS_CONFIG } from '@/lib/tqaSeedData';

export default function TqaOfiActionModal({
  isOpen,
  onClose,
  ofiItem,
  fiscalYear,
  currentUser,
  currentPersonnel,
  isAdmin = false,
  onSaved,
}) {
  const [status, setStatus] = useState('PENDING');
  const [htmlContent, setHtmlContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const editorRef = useRef(null);

  const canEdit = canEditTqaOfiProgress(ofiItem, currentUser, currentPersonnel, isAdmin);

  useEffect(() => {
    if (isOpen && ofiItem) {
      setStatus(ofiItem.status || 'PENDING');
      setHtmlContent(ofiItem.actionReport || '');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, ofiItem]);

  // Sync editor innerHTML when content loaded
  useEffect(() => {
    if (isOpen && editorRef.current) {
      if (editorRef.current.innerHTML !== (ofiItem?.actionReport || '')) {
        editorRef.current.innerHTML = ofiItem?.actionReport || '';
      }
    }
  }, [isOpen, ofiItem]);

  if (!isOpen || !ofiItem) return null;

  const handleFormat = (command, value = null) => {
    if (!canEdit) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  const handleInsertLink = () => {
    if (!canEdit) return;
    const url = prompt('ระบุ URL ลิงก์:', 'https://');
    if (url) {
      document.execCommand('createLink', false, url);
      if (editorRef.current) {
        setHtmlContent(editorRef.current.innerHTML);
      }
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      setErrorMsg('คุณไม่มีสิทธิ์บันทึกผลการดำเนินงานสำหรับข้อเสนอแนะนี้ (ต้องเป็น Admin หรือผู้รายงานผลที่ได้รับมอบหมาย)');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const contentToSave = editorRef.current ? editorRef.current.innerHTML : htmlContent;
      const updatedByName = currentPersonnel?.name || currentUser?.displayName || currentUser?.email || 'Admin';

      const payload = {
        ...ofiItem,
        status,
        actionReport: contentToSave,
        lastReportedAt: new Date().toISOString(),
        lastReportedBy: updatedByName,
      };

      await saveTqaOfiItem(payload, fiscalYear, updatedByName);
      setSuccessMsg('บันทึกผลการดำเนินงานและสถานะเรียบร้อยแล้ว');
      if (onSaved) onSaved(payload);
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
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
          maxWidth: '850px',
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
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {ofiItem.itemRef || 'TQA OFI'}
                </span>
                <span style={{ fontSize: '0.825rem', color: '#DDD6FE' }}>
                  {ofiItem.category}
                </span>
              </div>
              <h3 style={{ margin: '3px 0 0', fontSize: '1.1rem', fontWeight: 800 }}>
                รายงานผลการดำเนินงาน (Action Progress Report)
              </h3>
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

        {/* Modal Body Scrollable */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Finding Reference Box */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6D28D9', marginBottom: '4px' }}>
              ข้อค้นพบ (Finding):
            </div>
            <div style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 600, lineHeight: 1.5 }}>
              {ofiItem.finding}
            </div>

            {ofiItem.potentialImpact && (
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, borderTop: '1px dashed #CBD5E1', paddingTop: '6px' }}>
                <strong style={{ color: '#0F766E' }}>คุณค่าเชิงกลยุทธ์ (Potential Impact):</strong> {ofiItem.potentialImpact}
              </div>
            )}
          </div>

          {/* Assigned Persons Pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
              <User size={16} color="#6D28D9" />
              <strong style={{ color: '#334155' }}>ผู้รายงานผล:</strong>
              {Array.isArray(ofiItem.assignedPersons) && ofiItem.assignedPersons.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {ofiItem.assignedPersons.map((p, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '2px 8px',
                        background: '#EDE9FE',
                        color: '#6D28D9',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>ยังไม่ได้ระบุผู้รับผิดชอบ (Admin เท่านั้น)</span>
              )}
            </div>

            {/* Status Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>สถานะการดำเนินงาน:</span>
              <select
                className="form-input"
                style={{
                  width: 'auto',
                  fontWeight: 700,
                  color: TQA_STATUS_CONFIG[status]?.color || '#334155',
                  background: TQA_STATUS_CONFIG[status]?.bg || '#FFFFFF',
                  borderColor: TQA_STATUS_CONFIG[status]?.border || '#CBD5E1',
                }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={!canEdit}
              >
                <option value="PENDING">🟡 รอดำเนินการ (PENDING)</option>
                <option value="IN_PROGRESS">🔵 กำลังดำเนินการ (IN_PROGRESS)</option>
                <option value="COMPLETED">🟢 เสร็จสิ้นแล้ว (COMPLETED)</option>
              </select>
            </div>
          </div>

          {!canEdit && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#FEF3C7',
                color: '#92400E',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={16} />
              <span>คุณอยู่ในโหมดดูข้อมูล (Read-Only) เฉพาะ Admin และผู้รายงานผลที่ได้รับมอบหมายเท่านั้นที่สามารถแก้ไขได้</span>
            </div>
          )}

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

          {/* WYSIWYG Editor Container */}
          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #CBD5E1', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Toolbar */}
            {canEdit && (
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '8px 12px',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleFormat('bold')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '6px', height: '32px', width: '32px' }}
                  title="ตัวหนา (Ctrl+B)"
                >
                  <Bold size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('italic')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '6px', height: '32px', width: '32px' }}
                  title="ตัวเอียง (Ctrl+I)"
                >
                  <Italic size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('underline')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '6px', height: '32px', width: '32px' }}
                  title="ขีดเส้นใต้ (Ctrl+U)"
                >
                  <Underline size={15} />
                </button>

                <div style={{ width: '1px', height: '20px', background: '#CBD5E1', margin: '0 4px' }} />

                <button
                  type="button"
                  onClick={() => handleFormat('insertUnorderedList')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '6px', height: '32px', width: '32px' }}
                  title="รายการแบบสัญลักษณ์ (Bullet List)"
                >
                  <List size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('insertOrderedList')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '6px', height: '32px', width: '32px' }}
                  title="รายการแบบลำดับเลข (Numbered List)"
                >
                  <ListOrdered size={15} />
                </button>

                <div style={{ width: '1px', height: '20px', background: '#CBD5E1', margin: '0 4px' }} />

                <button
                  type="button"
                  onClick={() => handleFormat('formatBlock', '<h3>')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '6px', height: '32px', width: '32px' }}
                  title="หัวข้อย่อย (Heading)"
                >
                  <Heading2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('formatBlock', '<blockquote>')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '6px', height: '32px', width: '32px' }}
                  title="กล่องข้อความอ้างอิง (Quote)"
                >
                  <Quote size={15} />
                </button>
                <button
                  type="button"
                  onClick={handleInsertLink}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '6px', height: '32px', width: '32px' }}
                  title="แทรกลิงก์ (Link)"
                >
                  <LinkIcon size={15} />
                </button>

                <div style={{ width: '1px', height: '20px', background: '#CBD5E1', margin: '0 4px' }} />

                <button
                  type="button"
                  onClick={() => handleFormat('removeFormat')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '6px', height: '32px', width: '32px' }}
                  title="ล้างการจัดรูปแบบ"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            )}

            {/* Editable Area */}
            <div
              ref={editorRef}
              contentEditable={canEdit}
              suppressContentEditableWarning
              onInput={(e) => setHtmlContent(e.currentTarget.innerHTML)}
              style={{
                minHeight: '220px',
                padding: '1.25rem',
                outline: 'none',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                color: '#1E293B',
                background: canEdit ? '#FFFFFF' : '#F8FAFC',
                cursor: canEdit ? 'text' : 'default',
              }}
              data-placeholder="กรอกรายละเอียดความคืบหน้า แผนงาน มาตรการแก้ไข หรือผลการดำเนินงานที่ได้ปรับปรุง..."
            />
          </div>

          {ofiItem.lastReportedAt && (
            <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} />
              <span>
                รายงานผลล่าสุดเมื่อ {new Date(ofiItem.lastReportedAt).toLocaleString('th-TH')} โดย{' '}
                <strong>{ofiItem.lastReportedBy || 'ผู้รับผิดชอบ'}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-secondary">
            ปิดหน้าต่าง
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                borderColor: '#6D28D9',
                gap: '6px',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกผลการดำเนินงาน'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
