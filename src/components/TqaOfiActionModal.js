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
  Calendar,
  Layers,
  Copy,
} from 'lucide-react';
import { saveTqaOfiItem, canEditTqaOfiProgress, normalizeTqaRounds, computeOverallStatus } from '@/lib/tqaOfiService';
import { TQA_STATUS_CONFIG } from '@/lib/tqaSeedData';
import { formatDateDDMMYYYYBE } from '@/lib/dateUtils';

const ROUND_TABS = [
  { key: 'round1', num: 1, label: 'รอบที่ 1', shortLabel: 'รอบ 1 (ครั้งที่ 1)' },
  { key: 'round2', num: 2, label: 'รอบที่ 2', shortLabel: 'รอบ 2 (ครั้งที่ 2)' },
  { key: 'round3', num: 3, label: 'รอบที่ 3', shortLabel: 'รอบ 3 (ครั้งที่ 3)' },
];

export default function TqaOfiActionModal({
  isOpen,
  onClose,
  ofiItem,
  fiscalYear,
  currentUser,
  currentPersonnel,
  isAdmin = false,
  initialRound = 'round1',
  onSaved,
}) {
  const [activeRound, setActiveRound] = useState(initialRound || 'round1');
  const [roundsData, setRoundsData] = useState(() => normalizeTqaRounds(ofiItem));
  const [currentRoundStatus, setCurrentRoundStatus] = useState('PENDING');
  const [htmlContent, setHtmlContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const editorRef = useRef(null);

  const canEdit = canEditTqaOfiProgress(ofiItem, currentUser, currentPersonnel, isAdmin);

  // Initialize or update data when modal opens or ofiItem changes
  useEffect(() => {
    if (isOpen && ofiItem) {
      const normalized = normalizeTqaRounds(ofiItem);
      setRoundsData(normalized);
      const targetRound = initialRound && normalized[initialRound] ? initialRound : 'round1';
      setActiveRound(targetRound);
      const roundObj = normalized[targetRound] || { status: 'PENDING', actionReport: '' };
      setCurrentRoundStatus(roundObj.status || 'PENDING');
      setHtmlContent(roundObj.actionReport || '');
      setErrorMsg('');
      setSuccessMsg('');

      if (editorRef.current) {
        editorRef.current.innerHTML = roundObj.actionReport || '';
      }
    }
  }, [isOpen, ofiItem, initialRound]);

  // Handle switching round tab
  const handleTabChange = (newRoundKey) => {
    if (newRoundKey === activeRound) return;

    // Persist current editor text to previous round state in memory
    const currentText = editorRef.current ? editorRef.current.innerHTML : htmlContent;
    const updatedRounds = {
      ...roundsData,
      [activeRound]: {
        ...roundsData[activeRound],
        status: currentRoundStatus,
        actionReport: currentText,
      },
    };
    setRoundsData(updatedRounds);

    // Switch to new round
    setActiveRound(newRoundKey);
    const newRoundObj = updatedRounds[newRoundKey] || { status: 'PENDING', actionReport: '' };
    setCurrentRoundStatus(newRoundObj.status || 'PENDING');
    setHtmlContent(newRoundObj.actionReport || '');

    if (editorRef.current) {
      editorRef.current.innerHTML = newRoundObj.actionReport || '';
    }
    setErrorMsg('');
    setSuccessMsg('');
  };

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

  const handleCopyFromPreviousRound = (sourceKey) => {
    if (!canEdit) return;
    const sourceReport = roundsData[sourceKey]?.actionReport || '';
    if (!sourceReport) {
      alert('รอบก่อนหน้ายังไม่มีข้อมูลรายงานผล');
      return;
    }
    if (editorRef.current) {
      editorRef.current.innerHTML = sourceReport;
      setHtmlContent(sourceReport);
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
      const nowIso = new Date().toISOString();

      // Build updated rounds
      const updatedRounds = {
        ...roundsData,
        [activeRound]: {
          ...roundsData[activeRound],
          round: activeRound === 'round1' ? 1 : activeRound === 'round2' ? 2 : 3,
          status: currentRoundStatus,
          actionReport: contentToSave,
          reportedBy: updatedByName,
          reportedAt: nowIso,
        },
      };

      const computedStatus = computeOverallStatus(updatedRounds, currentRoundStatus);

      const payload = {
        ...ofiItem,
        status: computedStatus,
        rounds: updatedRounds,
        actionReport: contentToSave, // Store current active report for backward compatibility
        lastReportedAt: nowIso,
        lastReportedBy: updatedByName,
      };

      await saveTqaOfiItem(payload, fiscalYear, updatedByName);
      setRoundsData(updatedRounds);
      setSuccessMsg(`บันทึกผลการดำเนินงาน ${ROUND_TABS.find((r) => r.key === activeRound)?.label} เรียบร้อยแล้ว`);
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

  const currentRoundMeta = roundsData[activeRound] || {};
  const activeTabObj = ROUND_TABS.find((t) => t.key === activeRound) || ROUND_TABS[0];

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
          maxWidth: '880px',
          width: '100%',
          maxHeight: '94vh',
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
                รายงานผลการดำเนินงาน 3 รอบ (Action Progress Tracking)
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

        {/* 3-Round Tabs Navigation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '0.5rem 1.5rem 0',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {ROUND_TABS.map((tab) => {
            const isActive = activeRound === tab.key;
            const rData = roundsData[tab.key] || {};
            const rStatus = rData.status || 'PENDING';
            const statusMeta = TQA_STATUS_CONFIG[rStatus] || TQA_STATUS_CONFIG.PENDING;
            const hasReport = !!rData.actionReport;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                  border: isActive ? '1px solid #E2E8F0' : '1px solid transparent',
                  borderBottom: isActive ? '2px solid #6D28D9' : '1px solid transparent',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#6D28D9' : '#64748B',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  marginBottom: '-1px',
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: isActive ? '#6D28D9' : '#E2E8F0',
                    color: isActive ? '#FFFFFF' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  {tab.num}
                </div>
                <span>{tab.label}</span>

                {/* Status Dot / Pill */}
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: statusMeta.bg,
                    color: statusMeta.color,
                    border: `1px solid ${statusMeta.border}`,
                  }}
                >
                  {statusMeta.label}
                </span>

                {hasReport && (
                  <CheckCircle2 size={14} color="#10B981" title="มีรายงานผลแล้ว" />
                )}
              </button>
            );
          })}
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

          {/* Assigned Persons & Round Status Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
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

            {/* Status Selector for Active Round */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                สถานะผลการดำเนินงาน ({activeTabObj.label}):
              </span>
              <select
                className="form-input"
                style={{
                  width: 'auto',
                  fontWeight: 700,
                  color: TQA_STATUS_CONFIG[currentRoundStatus]?.color || '#334155',
                  background: TQA_STATUS_CONFIG[currentRoundStatus]?.bg || '#FFFFFF',
                  borderColor: TQA_STATUS_CONFIG[currentRoundStatus]?.border || '#CBD5E1',
                }}
                value={currentRoundStatus}
                onChange={(e) => setCurrentRoundStatus(e.target.value)}
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
              <AlertCircle size={18} />
              <span>โหมดอ่านอย่างเดียว (สงวนสิทธิ์การรายงานผลเฉพาะ Admin และผู้รับผิดชอบที่ระบุเท่านั้น)</span>
            </div>
          )}

          {/* Action Report WYSIWYG Editor Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} color="#6D28D9" />
                <span>รายละเอียดรายงานผลการดำเนินงาน {activeTabObj.shortLabel}</span>
              </label>

              {/* Quick action: Copy from previous round */}
              {canEdit && activeRound !== 'round1' && (
                <button
                  type="button"
                  onClick={() => handleCopyFromPreviousRound(activeRound === 'round3' ? 'round2' : 'round1')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#F1F5F9',
                    fontSize: '0.75rem',
                    color: '#475569',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                  title="คัดลอกข้อความรายงานจากรอบก่อนหน้าเพื่อนำมาปรับปรุงต่อ"
                >
                  <Copy size={12} />
                  <span>คัดลอกจาก {activeRound === 'round3' ? 'รอบที่ 2' : 'รอบที่ 1'}</span>
                </button>
              )}
            </div>

            {/* Rich Text Toolbar */}
            {canEdit && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '4px',
                  background: '#F8FAFC',
                  padding: '6px 8px',
                  borderRadius: '8px 8px 0 0',
                  border: '1px solid #CBD5E1',
                  borderBottom: 'none',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleFormat('bold')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '4px', height: '28px', width: '28px' }}
                  title="หนา (Bold)"
                >
                  <Bold size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('italic')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '4px', height: '28px', width: '28px' }}
                  title="เอียง (Italic)"
                >
                  <Italic size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('underline')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '4px', height: '28px', width: '28px' }}
                  title="ขีดเส้นใต้ (Underline)"
                >
                  <Underline size={15} />
                </button>

                <div style={{ width: '1px', height: '18px', background: '#CBD5E1', margin: '0 4px' }} />

                <button
                  type="button"
                  onClick={() => handleFormat('insertUnorderedList')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '4px', height: '28px', width: '28px' }}
                  title="รายการหัวข้อย่อย (Bullet List)"
                >
                  <List size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('insertOrderedList')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '4px', height: '28px', width: '28px' }}
                  title="รายการลำดับตัวเลข (Numbered List)"
                >
                  <ListOrdered size={15} />
                </button>

                <div style={{ width: '1px', height: '18px', background: '#CBD5E1', margin: '0 4px' }} />

                <button
                  type="button"
                  onClick={() => handleFormat('formatBlock', '<h3>')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '4px', height: '28px', width: '28px', fontWeight: 800, fontSize: '0.8rem' }}
                  title="หัวข้อขนาดใหญ่ (Heading)"
                >
                  H
                </button>
                <button
                  type="button"
                  onClick={handleInsertLink}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '4px', height: '28px', width: '28px' }}
                  title="แทรก URL ลิงก์ (Link)"
                >
                  <LinkIcon size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('removeFormat')}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '4px', height: '28px', width: '28px' }}
                  title="ล้างการจัดรูปแบบ (Clear Formatting)"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}

            {/* Editable Content Area */}
            <div
              ref={editorRef}
              contentEditable={canEdit}
              suppressContentEditableWarning
              onInput={(e) => setHtmlContent(e.currentTarget.innerHTML)}
              style={{
                minHeight: '220px',
                maxHeight: '340px',
                overflowY: 'auto',
                padding: '1rem',
                border: '1px solid #CBD5E1',
                borderRadius: canEdit ? '0 0 8px 8px' : '8px',
                background: canEdit ? '#FFFFFF' : '#F8FAFC',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: '#0F172A',
                outline: 'none',
              }}
              placeholder={`พิมพ์รายละเอียดผลการดำเนินงานสำหรับ ${activeTabObj.label} (เช่น กิจกรรมที่ได้ดำเนินการ, ผลลัพธ์เชิงปริมาณ/คุณภาพ, หลักฐานอ้างอิง, อุปสรรคและแผนการขั้นถัดไป)...`}
            />

            {/* Reporting Meta / Timestamp for current round */}
            {currentRoundMeta.reportedBy && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>
                <Clock size={13} />
                <span>
                  บันทึกล่าสุด {activeTabObj.label} โดย <strong>{currentRoundMeta.reportedBy}</strong> เมื่อ{' '}
                  {formatDateDDMMYYYYBE(currentRoundMeta.reportedAt || currentRoundMeta.lastReportedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#FEE2E2', color: '#DC2626', fontSize: '0.85rem', fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '0.75rem', borderRadius: '8px', background: '#ECFDF5', color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
              {successMsg}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
            กำลังรายงาน: <strong style={{ color: '#6D28D9' }}>{activeTabObj.label}</strong> (จาก 3 รอบการติดตาม)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              ปิดหน้าต่าง
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary"
                disabled={isSaving}
                style={{
                  background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                  borderColor: '#6D28D9',
                  gap: '6px',
                  fontWeight: 700,
                  minWidth: '170px',
                }}
              >
                {isSaving ? (
                  <>
                    <Clock size={16} className="animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>บันทึกผล {activeTabObj.label}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
