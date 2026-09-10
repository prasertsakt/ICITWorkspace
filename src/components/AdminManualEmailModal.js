'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Users,
  Search,
  ChevronDown,
  Info,
  Check,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Minus,
  RotateCcw,
  Palette,
  Heading2,
  Heading3,
} from 'lucide-react';
import { sendManualAdminEmail, getEmailConfig } from '@/lib/emailNotificationService';

const QUICK_SUBJECTS = [
  '[ประกาศ] แจ้งข้อมูลสำคัญสำหรับบุคลากร สำนักคอมพิวเตอร์ฯ',
  '[แจ้งเตือน] การปฏิบัติงานและบันทึกเวลาปฏิบัติราชการ',
  '[ขอความอนุเคราะห์] ข้อมูลการปฏิบัติงาน',
  '[กำหนดการ] การประชุม / กิจกรรมองค์กร',
  '[เอกสาร] ภาระงานประจำฝ่ายและคู่มือการปฏิบัติงาน',
];

export default function AdminManualEmailModal({
  isOpen,
  onClose,
  targetPersonnel = null,
  personnelList = [],
  currentAdmin = null,
}) {
  const editorRef = useRef(null);
  const emailConfig = useMemo(() => getEmailConfig(), [isOpen]);

  // Form states
  const [recipientMode, setRecipientMode] = useState('single'); // 'single' | 'all' | 'custom'
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [customToEmail, setCustomToEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [bccEmail, setBccEmail] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [contentHtml, setContentHtml] = useState('');

  // UI states
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'preview'
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [lastSentResult, setLastSentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSendSuccess(false);
      setLastSentResult(null);
      setErrorMessage('');
      setActiveTab('compose');
      setIsDropdownOpen(false);
      setSearchTerm('');

      let initialHtml = '';
      if (targetPersonnel) {
        setRecipientMode('single');
        setSelectedPersonnelId(targetPersonnel.id || '');
        setCustomToEmail(targetPersonnel.email || '');
        initialHtml = `<p>เรียน ${targetPersonnel.name || ''}</p><p><br></p><p></p>`;
      } else {
        setRecipientMode('single');
        setSelectedPersonnelId('');
        setCustomToEmail('');
        initialHtml = '<p>เรียน บุคลากรทุกท่าน</p><p><br></p><p></p>';
      }

      setContentHtml(initialHtml);
      if (editorRef.current) {
        editorRef.current.innerHTML = initialHtml;
      }

      setSubject('');
      setCcEmail('');
      setBccEmail('');
      setShowCcBcc(false);
    }
  }, [isOpen, targetPersonnel]);

  // Keep editorRef innerHTML synced when switching back to compose tab
  useEffect(() => {
    if (activeTab === 'compose' && editorRef.current) {
      if (editorRef.current.innerHTML !== contentHtml) {
        editorRef.current.innerHTML = contentHtml;
      }
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Selected recipient object
  const selectedPersonnel = personnelList.find((p) => p.id === selectedPersonnelId);

  // Filtered personnel for dropdown
  const filteredPersonnelList = personnelList.filter((p) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q) ||
      p.position?.toLowerCase().includes(q)
    );
  });

  // Effective recipient emails & names
  let effectiveToEmail = '';
  let effectiveRecipientName = '';

  if (recipientMode === 'single') {
    effectiveToEmail = selectedPersonnel?.email || customToEmail;
    effectiveRecipientName = selectedPersonnel?.name || '';
  } else if (recipientMode === 'all') {
    const activeEmails = personnelList
      .filter((p) => p.email && p.status !== 'ลาออก' && !p.email.endsWith('@icit.org'))
      .map((p) => p.email.trim());
    effectiveToEmail = activeEmails.join(', ');
    effectiveRecipientName = 'บุคลากรสำนักคอมพิวเตอร์ฯ ทุกท่าน';
  } else {
    effectiveToEmail = customToEmail;
    effectiveRecipientName = customToEmail;
  }

  // WYSIWYG Command Executor
  const executeCommand = (command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      setContentHtml(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContentHtml(editorRef.current.innerHTML);
    }
  };

  // Quick insertion helpers for email body
  const handleInsertGreeting = () => {
    const name = selectedPersonnel?.name ? ` ${selectedPersonnel.name}` : '';
    const greetingHtml = `<p><strong>เรียน${name}</strong></p><p><br></p>`;
    if (editorRef.current) {
      editorRef.current.innerHTML = greetingHtml + editorRef.current.innerHTML;
      setContentHtml(editorRef.current.innerHTML);
    }
  };

  const handleInsertSignature = () => {
    const adminName = currentAdmin?.name || 'ฝ่ายบริหารงานทั่วไป / ผู้ดูแลระบบ';
    const sigHtml = `
      <p><br></p>
      <div style="margin-top: 16px; border-top: 1px dashed #CBD5E1; padding-top: 12px; font-size: 13.5px; color: #475569;">
        <p style="margin: 0 0 4px 0;">ขอแสดงความนับถือ,</p>
        <p style="margin: 0 0 4px 0; font-weight: 700; color: #1E293B;">${adminName}</p>
        <p style="margin: 0 0 4px 0; color: #64748B;">สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.</p>
        <p style="margin: 0; font-size: 12.5px; color: #94A3B8;">โทรศัพท์ 02-555-2000 ต่อ 2200 | เว็บไซต์: icit.kmutnb.ac.th</p>
      </div>
    `;
    if (editorRef.current) {
      editorRef.current.innerHTML = editorRef.current.innerHTML + sigHtml;
      setContentHtml(editorRef.current.innerHTML);
    }
  };

  const handleInsertCallout = () => {
    const calloutHtml = `
      <div style="margin: 12px 0; padding: 12px 16px; background: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 6px; color: #1E40AF;">
        <strong>📌 ข้อความเน้นย้ำ / ข้อมูลสำคัญ:</strong> พิมพ์ข้อความสำคัญที่ต้องการแจ้งเตือนที่นี่
      </div>
      <p></p>
    `;
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, calloutHtml);
      setContentHtml(editorRef.current.innerHTML);
    }
  };

  const handleAddLink = () => {
    const url = prompt('ระบุ URL ลิงก์ที่ต้องการแทรก (เช่น https://...):');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  // Handle Send Email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!effectiveToEmail.trim()) {
      setErrorMessage('กรุณาระบุอีเมลผู้รับ (To)');
      return;
    }

    if (!subject.trim()) {
      setErrorMessage('กรุณาระบุหัวข้ออีเมล (Subject)');
      return;
    }

    // Strip tags to check if there is actual content
    const textOnly = (contentHtml || '').replace(/<[^>]*>/g, '').trim();
    if (!textOnly) {
      setErrorMessage('กรุณาพิมพ์ข้อความเนื้อหาอีเมล');
      return;
    }

    setIsSending(true);

    try {
      const senderName = currentAdmin?.name
        ? `${currentAdmin.name} (ผู้ดูแลระบบ ICIT)`
        : 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)';

      const res = await sendManualAdminEmail({
        to: effectiveToEmail.trim(),
        cc: ccEmail.trim(),
        bcc: bccEmail.trim(),
        subject: subject.trim(),
        message: contentHtml, // WYSIWYG HTML content
        recipientName: effectiveRecipientName,
        senderName,
        senderEmail: currentAdmin?.email || '',
      });

      if (res.success) {
        setSendSuccess(true);
        setLastSentResult(res.logEntry);
      } else {
        setErrorMessage(res.error || 'เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      console.error('Send email error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          width: '95%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.18)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Mail size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>
                เขียนและส่งอีเมลถึงบุคลากร (Compose Email)
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                {emailConfig.enableLiveSending
                  ? '🟢 เชื่อมต่อระบบส่งจริงผ่าน Google Apps Script / Gmail Relay'
                  : '🟡 ทำงานในโหมดจำลอง (Simulation Mode - สามารถส่งทดสอบได้)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ color: '#FFFFFF', opacity: 0.85 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Screen */}
        {sendSuccess ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'var(--mint-50)',
                color: 'var(--mint-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <CheckCircle2 size={40} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ส่งอีเมลสำเร็จเรียบร้อยแล้ว!
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              ระบบได้ส่งอีเมลเรื่อง <strong>&ldquo;{subject}&rdquo;</strong> ไปยังผู้รับ (<strong>{effectiveToEmail}</strong>)
              {ccEmail && <span> พร้อมสำเนาถึง (<strong>{ccEmail}</strong>)</span>}
              {bccEmail && <span> และสำเนาลับถึง (<strong>{bccEmail}</strong>)</span>}
              {' '}และได้บันทึกประวัติลงในระบบ Firebase Firestore เรียบร้อยแล้ว
            </p>

            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                maxWidth: '480px',
                margin: '0 auto 2rem',
                border: '1px solid var(--border-subtle)',
                textAlign: 'left',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>ช่องทางการส่ง:</span>
                <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                  {lastSentResult?.deliveryMethod || 'สำเร็จ'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>เวลาที่ส่ง:</span>
                <span>{new Date().toLocaleTimeString('th-TH')} น.</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>การบันทึกประวัติ:</span>
                <span style={{ color: 'var(--mint-700)', fontWeight: 600 }}>☁️ บันทึกลง Firebase Firestore (email_logs)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setSendSuccess(false);
                  setSubject('');
                  setContentHtml('<p>เรียน บุคลากรทุกท่าน</p><p><br></p>');
                  if (editorRef.current) {
                    editorRef.current.innerHTML = '<p>เรียน บุคลากรทุกท่าน</p><p><br></p>';
                  }
                }}
                className="btn btn-secondary btn-sm"
              >
                <Mail size={15} />
                <span>เขียนอีเมลฉบับอื่น</span>
              </button>
              <button type="button" onClick={onClose} className="btn btn-primary btn-sm">
                <span>ปิดหน้าต่าง</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Tabs Header: Compose vs Preview */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 1.5rem',
                background: 'var(--bg-card-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('compose')}
                  className={`btn btn-sm ${activeTab === 'compose' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                >
                  <Edit3 size={14} />
                  <span>เขียนข้อความ (WYSIWYG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`btn btn-sm ${activeTab === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                >
                  <Eye size={14} />
                  <span>ดูตัวอย่างอีเมลจริง (Live Preview)</span>
                </button>
              </div>

              {/* Recipient Mode Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientMode('single');
                    if (targetPersonnel) setSelectedPersonnelId(targetPersonnel.id);
                  }}
                  className={`btn btn-sm ${recipientMode === 'single' ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  เลือกรายบุคคล
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('all')}
                  className={`btn btn-sm ${recipientMode === 'all' ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  title="ส่งถึงบุคลากรทุกคนในองค์กร (Broadcast)"
                >
                  <Users size={13} />
                  <span>ส่งทุกคน ({personnelList.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('custom')}
                  className={`btn btn-sm ${recipientMode === 'custom' ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  พิมพ์อีเมลเอง
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              className="modal-body"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {errorMessage && (
                <div
                  style={{
                    background: 'var(--rose-50)',
                    border: '1px solid var(--rose-200)',
                    color: 'var(--rose-700)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {activeTab === 'preview' ? (
                /* Live Preview View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>ถึง (To): </span>
                      <strong>{effectiveToEmail || 'ยังไม่ได้ระบุ'}</strong>
                    </div>
                    {ccEmail && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>สำเนา (CC): </span>
                        <span>{ccEmail}</span>
                      </div>
                    )}
                    {bccEmail && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>สำเนาลับ (BCC): </span>
                        <span>{bccEmail}</span>
                      </div>
                    )}
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>หัวข้อ (Subject): </span>
                      <strong>{subject || '(ไม่มีหัวข้อ)'}</strong>
                    </div>
                  </div>

                  {/* Rendered HTML Container */}
                  <div
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                        padding: '1.25rem',
                        color: '#FFFFFF',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div
                          style={{
                            background: '#FFFFFF',
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '3px',
                          }}
                        >
                          <img
                            src="https://raw.githubusercontent.com/prasertsakt/ICITWorkspace/main/public/icit-logo.png"
                            alt="ICIT Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 600 }}>
                            สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>
                            มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                        {subject || 'หัวข้ออีเมล'}
                      </div>
                    </div>

                    <div style={{ padding: '1.5rem', background: '#FFFFFF', fontSize: '0.875rem', lineHeight: 1.7, color: '#334155' }}>
                      <div dangerouslySetInnerHTML={{ __html: contentHtml || '<em>ไม่มีเนื้อหาข้อความ</em>' }} />
                    </div>

                    <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                      <div><strong>ส่งโดย:</strong> {currentAdmin?.name || 'ผู้ดูแลระบบ (Admin) ICIT'}</div>
                      <div><strong>ระบบ:</strong> ระบบบริหารจัดการองค์กร ICIT Workspace</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Compose View with WYSIWYG */
                <>
                  {/* Recipient Row */}
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="input-label" style={{ margin: 0 }}>
                        ถึง (To) <span className="required">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCcBcc(!showCcBcc)}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.725rem', padding: '0.15rem 0.4rem', height: 'auto' }}
                      >
                        {showCcBcc ? 'ซ่อน CC / BCC' : '+ เพิ่ม CC / BCC'}
                      </button>
                    </div>

                    {recipientMode === 'single' ? (
                      <div style={{ position: 'relative' }}>
                        <div
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="form-input"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            padding: '0.5rem 0.75rem',
                            minHeight: '42px',
                          }}
                        >
                          {selectedPersonnel ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              {selectedPersonnel.avatarUrl ? (
                                <img
                                  src={selectedPersonnel.avatarUrl}
                                  alt=""
                                  style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    background: 'var(--primary-100)',
                                    color: 'var(--primary-600)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {selectedPersonnel.name?.charAt(0)}
                                </div>
                              )}
                              <div>
                                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                  {selectedPersonnel.name}
                                </strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                                  ({selectedPersonnel.email}) • {selectedPersonnel.department}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              -- เลือกบุคลากรผู้รับอีเมล --
                            </span>
                          )}
                          <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                        </div>

                        {/* Searchable dropdown list */}
                        {isDropdownOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              zIndex: 100,
                              background: '#FFFFFF',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                              boxShadow: 'var(--shadow-lg)',
                              marginTop: '4px',
                              maxHeight: '260px',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                              <div style={{ position: 'relative' }}>
                                <Search
                                  size={14}
                                  style={{
                                    position: 'absolute',
                                    left: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                  }}
                                />
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="พิมพ์ค้นหาชื่อ, อีเมล, ฝ่าย..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  style={{ paddingLeft: '1.85rem', fontSize: '0.8rem', padding: '0.35rem 0.5rem 0.35rem 1.85rem' }}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>

                            <div style={{ overflowY: 'auto', flex: 1, padding: '0.25rem 0' }}>
                              {filteredPersonnelList.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedPersonnelId(p.id);
                                    setCustomToEmail(p.email || '');
                                    setIsDropdownOpen(false);
                                  }}
                                  style={{
                                    padding: '0.5rem 0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    background: selectedPersonnelId === p.id ? 'var(--primary-50)' : 'transparent',
                                    fontSize: '0.825rem',
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-subtle)')}
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      selectedPersonnelId === p.id ? 'var(--primary-50)' : 'transparent')
                                  }
                                >
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                      {p.email} • {p.department}
                                    </div>
                                  </div>
                                  {selectedPersonnelId === p.id && <Check size={16} style={{ color: 'var(--primary-600)' }} />}
                                </div>
                              ))}

                              {filteredPersonnelList.length === 0 && (
                                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                  ไม่พบบุคลากรที่ตรงกับคำค้นหา
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : recipientMode === 'all' ? (
                      <div
                        style={{
                          background: 'var(--primary-50)',
                          border: '1.5px solid var(--primary-200)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.65rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <Users size={18} style={{ color: 'var(--primary-600)' }} />
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--primary-700)' }}>
                            ส่งถึงบุคลากรทุกคนในองค์กร ({personnelList.filter((p) => p.email && p.status !== 'ลาออก').length} ท่าน)
                          </strong>
                          <div style={{ fontSize: '0.725rem', color: 'var(--primary-600)' }}>
                            ระบบจะส่งอีเมลกระจายข่าวสารไปยังอีเมล Whitelist ของบุคลากรทุกคนที่ยังปฏิบัติงานอยู่
                          </div>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="email"
                        className="form-input"
                        placeholder="ระบุอีเมลผู้รับ เช่น user@icit.kmutnb.ac.th"
                        value={customToEmail}
                        onChange={(e) => setCustomToEmail(e.target.value)}
                        required
                      />
                    )}
                  </div>

                  {/* Expandable CC / BCC */}
                  {showCcBcc && (
                    <div className="grid-2" style={{ gap: '0.75rem', marginTop: '-0.25rem' }}>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>
                          สำเนา (CC)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="เช่น hr@icit.kmutnb.ac.th, user@gmail.com"
                          value={ccEmail}
                          onChange={(e) => setCcEmail(e.target.value)}
                          style={{ fontSize: '0.825rem' }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          คั่นหลายอีเมลด้วยเครื่องหมายจุลภาค (,)
                        </span>
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>
                          สำเนาลับ (BCC)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="เช่น director@icit.kmutnb.ac.th"
                          value={bccEmail}
                          onChange={(e) => setBccEmail(e.target.value)}
                          style={{ fontSize: '0.825rem' }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          ผู้รับจะไม่เห็นรายชื่ออีเมลใน BCC
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Subject Row */}
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">
                      หัวข้ออีเมล (Subject) <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ระบุหัวข้ออีเมล เช่น แจ้งเตือนการส่งแบบฟอร์มภาระงาน..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />

                    {/* Quick Subject Chips */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        ตัวอย่างหัวข้อด่วน:
                      </span>
                      {QUICK_SUBJECTS.map((qs, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSubject(qs)}
                          className="btn btn-ghost btn-sm"
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            height: 'auto',
                            background: '#F1F5F9',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '12px',
                          }}
                        >
                          {qs}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* WYSIWYG Message Editor */}
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="input-label" style={{ margin: 0 }}>
                        เนื้อหาอีเมล (Message Content) <span className="required">*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          type="button"
                          onClick={handleInsertGreeting}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.725rem', padding: '0.15rem 0.4rem', height: 'auto' }}
                          title="แทรกคำขึ้นต้น"
                        >
                          + คำขึ้นต้น
                        </button>
                        <button
                          type="button"
                          onClick={handleInsertCallout}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.725rem', padding: '0.15rem 0.4rem', height: 'auto' }}
                          title="แทรกกล่องข้อความเน้นย้ำ"
                        >
                          + กล่องเน้นย้ำ
                        </button>
                        <button
                          type="button"
                          onClick={handleInsertSignature}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.725rem', padding: '0.15rem 0.4rem', height: 'auto' }}
                          title="แทรกคำลงท้ายและลายเซ็นต์"
                        >
                          + ลายเซ็นต์
                        </button>
                      </div>
                    </div>

                    {/* WYSIWYG Container */}
                    <div
                      style={{
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        background: '#FFFFFF',
                      }}
                    >
                      {/* WYSIWYG Toolbar */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          flexWrap: 'wrap',
                          padding: '0.4rem 0.6rem',
                          background: '#F8FAFC',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        {/* Heading Formats */}
                        <button
                          type="button"
                          onClick={() => executeCommand('formatBlock', '<h2>')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="หัวข้อขนาดใหญ่ (H2)"
                        >
                          <Heading2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('formatBlock', '<h3>')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="หัวข้อขนาดย่อย (H3)"
                        >
                          <Heading3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('formatBlock', '<p>')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto', fontSize: '0.75rem', fontWeight: 600 }}
                          title="ย่อหน้าปกติ (Paragraph)"
                        >
                          Normal
                        </button>

                        <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 3px' }} />

                        {/* Basic Formatting */}
                        <button
                          type="button"
                          onClick={() => executeCommand('bold')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="ตัวหนา (Bold)"
                        >
                          <Bold size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('italic')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="ตัวเอียง (Italic)"
                        >
                          <Italic size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('underline')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="ขีดเส้นใต้ (Underline)"
                        >
                          <Underline size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('strikeThrough')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="ขีดฆ่า (Strikethrough)"
                        >
                          <Strikethrough size={15} />
                        </button>

                        <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 3px' }} />

                        {/* Colors */}
                        <button
                          type="button"
                          onClick={() => executeCommand('foreColor', '#1E40AF')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto', color: '#1E40AF', fontWeight: 700 }}
                          title="สีน้ำเงิน (ICIT Blue)"
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('foreColor', '#E11D48')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto', color: '#E11D48', fontWeight: 700 }}
                          title="สีแดง (Warning Red)"
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('foreColor', '#059669')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto', color: '#059669', fontWeight: 700 }}
                          title="สีเขียว (Success Green)"
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('foreColor', '#334155')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto', color: '#334155', fontWeight: 700 }}
                          title="สีข้อความปกติ (Default Slate)"
                        >
                          A
                        </button>

                        <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 3px' }} />

                        {/* Alignment */}
                        <button
                          type="button"
                          onClick={() => executeCommand('justifyLeft')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="ชิดซ้าย"
                        >
                          <AlignLeft size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('justifyCenter')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="กึ่งกลาง"
                        >
                          <AlignCenter size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('justifyRight')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="ชิดขวา"
                        >
                          <AlignRight size={15} />
                        </button>

                        <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 3px' }} />

                        {/* Lists */}
                        <button
                          type="button"
                          onClick={() => executeCommand('insertUnorderedList')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="รายการสัญลักษณ์ (Bullet List)"
                        >
                          <List size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('insertOrderedList')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="รายการลำดับตัวเลข (Numbered List)"
                        >
                          <ListOrdered size={15} />
                        </button>

                        <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 3px' }} />

                        {/* Inserts & Utility */}
                        <button
                          type="button"
                          onClick={handleAddLink}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="แทรกลิงก์ (Link)"
                        >
                          <Link2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('insertHorizontalRule')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="เส้นคั่นแนวนอน (Horizontal Divider)"
                        >
                          <Minus size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => executeCommand('removeFormat')}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto' }}
                          title="ล้างการจัดรูปแบบ (Clear Formatting)"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>

                      {/* Content Editable Area */}
                      <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleEditorInput}
                        style={{
                          minHeight: '220px',
                          maxHeight: '340px',
                          overflowY: 'auto',
                          padding: '1rem',
                          outline: 'none',
                          fontSize: '0.9rem',
                          lineHeight: 1.7,
                          color: '#334155',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="modal-footer"
              style={{
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-card-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={13} />
                <span>
                  ผู้ส่ง: {currentAdmin?.name || 'ผู้ดูแลระบบ (Admin)'}
                  {ccEmail ? ` • CC: ${ccEmail}` : ''}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={isSending}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSending}>
                  {isSending ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      <span>กำลังส่งอีเมล...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={15} />
                      <span>ส่งอีเมล</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
