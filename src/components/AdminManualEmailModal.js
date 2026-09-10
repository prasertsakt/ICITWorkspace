'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Mail,
  Send,
  Paperclip,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  File,
  Eye,
  Edit3,
  Users,
  Search,
  ChevronDown,
  Sparkles,
  Info,
  Building2,
  Check,
} from 'lucide-react';
import { sendManualAdminEmail, getEmailConfig } from '@/lib/emailNotificationService';

const QUICK_SUBJECTS = [
  '📢 แจ้งข้อมูลสำคัญสำหรับบุคลากร สำนักคอมพิวเตอร์ฯ',
  '⏰ แจ้งเตือนการปฏิบัติงานและบันทึกเวลาปฏิบัติราชการ',
  '📋 ขอความอนุเคราะห์ข้อมูลการปฏิบัติงาน',
  '📌 แจ้งกำหนดการประชุม / กิจกรรมองค์กร',
  '📄 แจ้งเอกสารและภาระงานประจำฝ่าย',
];

export default function AdminManualEmailModal({
  isOpen,
  onClose,
  targetPersonnel = null,
  personnelList = [],
  currentAdmin = null,
}) {
  const fileInputRef = useRef(null);
  const emailConfig = useMemo(() => getEmailConfig(), [isOpen]);

  // Form states
  const [recipientMode, setRecipientMode] = useState('single'); // 'single' | 'all' | 'custom'
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [customToEmail, setCustomToEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [bccEmail, setBccEmail] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]); // [{ name, size, type, base64Data }]

  // UI states
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'preview'
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [lastSentResult, setLastSentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Initialize or reset form when modal opens or targetPersonnel changes
  useEffect(() => {
    if (isOpen) {
      setSendSuccess(false);
      setLastSentResult(null);
      setErrorMessage('');
      setActiveTab('compose');
      setAttachments([]);
      setIsDropdownOpen(false);
      setSearchTerm('');

      if (targetPersonnel) {
        setRecipientMode('single');
        setSelectedPersonnelId(targetPersonnel.id || '');
        setCustomToEmail(targetPersonnel.email || '');
        setMessage(`เรียน ${targetPersonnel.name || ''}\n\n`);
      } else {
        setRecipientMode('single');
        setSelectedPersonnelId('');
        setCustomToEmail('');
        setMessage('เรียน บุคลากรทุกท่าน\n\n');
      }

      setSubject('');
      setCcEmail('');
      setBccEmail('');
      setShowCcBcc(false);
    }
  }, [isOpen, targetPersonnel]);

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

  // Handle file uploads (Convert to base64)
  const handleFilesSelected = (files) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // 15MB file size limit check
      if (file.size > 15 * 1024 * 1024) {
        alert(`ไฟล์ "${file.name}" มีขนาดเกิน 15 MB ไม่สามารถแนบผ่านอีเมลได้`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // Strip data:mime/type;base64, prefix
        const base64Data = result.includes(',') ? result.split(',')[1] : result;

        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            base64Data,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (fileName, type) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return <ImageIcon size={16} style={{ color: 'var(--mint-600)' }} />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      return <FileText size={16} style={{ color: 'var(--primary-600)' }} />;
    }
    return <File size={16} style={{ color: 'var(--peach-600)' }} />;
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Quick insertion helpers for email body
  const handleInsertGreeting = () => {
    const name = selectedPersonnel?.name ? ` ${selectedPersonnel.name}` : '';
    setMessage((prev) => `เรียน${name}\n\n` + prev);
  };

  const handleInsertSignature = () => {
    const adminName = currentAdmin?.name || 'ฝ่ายบริหารงานทั่วไป / ผู้ดูแลระบบ';
    const sig = `\n\nขอแสดงความนับถือ,\n${adminName}\nสำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.\nโทร. 02-555-2000 ต่อ 2200`;
    setMessage((prev) => prev + sig);
  };

  // Handle Send Email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!effectiveToEmail.trim()) {
      setErrorMessage('กรุณาระบุอีเมลผู้รับ');
      return;
    }

    if (!subject.trim()) {
      setErrorMessage('กรุณาระบุหัวข้ออีเมล');
      return;
    }

    if (!message.trim()) {
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
        message: message.trim(),
        attachments: attachments.map(({ name, size, type, base64Data }) => ({
          name,
          size,
          type,
          base64Data,
        })),
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
          maxWidth: '780px',
          width: '95%',
          maxHeight: '92vh',
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
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              ระบบได้ส่งอีเมลเรื่อง <strong>&ldquo;{subject}&rdquo;</strong> ไปยังผู้รับ (<strong>{effectiveToEmail}</strong>)
              {attachments.length > 0 && ` พร้อมแนบเอกสาร ${attachments.length} ไฟล์`} เรียบร้อยแล้ว
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
                <span style={{ color: 'var(--text-muted)' }}>จำนวนไฟล์แนบ:</span>
                <span>{attachments.length} ไฟล์</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setSendSuccess(false);
                  setSubject('');
                  setMessage('');
                  setAttachments([]);
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
                  <span>เขียนข้อความ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`btn btn-sm ${activeTab === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                >
                  <Eye size={14} />
                  <span>ดูตัวอย่างอีเมลจริง (Preview)</span>
                </button>
              </div>

              {/* Mode Toggle Buttons */}
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
                /* Email Preview View */
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
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>หัวข้อ (Subject): </span>
                      <strong>{subject || '(ไม่มีหัวข้อ)'}</strong>
                    </div>
                    {attachments.length > 0 && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>ไฟล์แนบ: </span>
                        <span>{attachments.length} ไฟล์ ({attachments.map((a) => a.name).join(', ')})</span>
                      </div>
                    )}
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
                            src="/icit-logo.png"
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
                      {effectiveRecipientName && (
                        <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '1rem' }}>
                          เรียน {effectiveRecipientName}
                        </div>
                      )}

                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {message || 'เนื้อหาข้อความจะแสดงที่นี่...'}
                      </div>

                      {attachments.length > 0 && (
                        <div
                          style={{
                            marginTop: '1.5rem',
                            padding: '0.85rem 1rem',
                            background: '#F8FAFC',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Paperclip size={14} />
                            <span>เอกสารแนบ ({attachments.length} ไฟล์):</span>
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#475569' }}>
                            {attachments.map((att) => (
                              <li key={att.id}>
                                <strong>{att.name}</strong> ({formatFileSize(att.size)})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                      <div><strong>ส่งโดย:</strong> {currentAdmin?.name || 'ผู้ดูแลระบบ (Admin) ICIT'}</div>
                      <div><strong>ระบบ:</strong> ระบบบริหารจัดการองค์กร ICIT Workspace</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Compose Form View */
                <>
                  {/* Recipient Row */}
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="input-label" style={{ margin: 0 }}>
                        ถึง (Recipient) <span className="required">*</span>
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
                          placeholder="เช่น hr@icit.kmutnb.ac.th"
                          value={ccEmail}
                          onChange={(e) => setCcEmail(e.target.value)}
                          style={{ fontSize: '0.825rem' }}
                        />
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

                  {/* Message Body */}
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="input-label" style={{ margin: 0 }}>
                        เนื้อหาอีเมล (Message Body) <span className="required">*</span>
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
                          onClick={handleInsertSignature}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.725rem', padding: '0.15rem 0.4rem', height: 'auto' }}
                          title="แทรกคำลงท้ายและลายเซ็นต์"
                        >
                          + ลายเซ็นต์
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="form-textarea"
                      rows={7}
                      placeholder="พิมพ์ข้อความเนื้อหาอีเมลที่ต้องการส่งถึงบุคลากร..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      style={{ fontSize: '0.875rem', lineHeight: 1.6 }}
                    />
                  </div>

                  {/* File Attachments Area */}
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="input-label" style={{ margin: 0 }}>
                        แนบไฟล์เอกสาร (Attachments)
                      </label>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        รองรับ PDF, รูปภาพ, เอกสาร Word/Excel (สูงสุด 15MB/ไฟล์)
                      </span>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${isDragOver ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                        background: isDragOver ? 'var(--primary-50)' : '#F8FAFC',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFilesSelected(e.target.files)}
                        multiple
                        style={{ display: 'none' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--primary-600)' }}>
                        <Paperclip size={18} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          คลิกเพื่อเลือกไฟล์แนบ หรือลากไฟล์มาวางที่นี่
                        </span>
                      </div>
                    </div>

                    {/* Attached Files List */}
                    {attachments.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem',
                          marginTop: '0.6rem',
                        }}
                      >
                        {attachments.map((att) => (
                          <div
                            key={att.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.45rem 0.75rem',
                              background: '#FFFFFF',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: '0.8rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                              {getFileIcon(att.name, att.type)}
                              <span
                                style={{
                                  fontWeight: 500,
                                  color: 'var(--text-primary)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '360px',
                                }}
                              >
                                {att.name}
                              </span>
                              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                ({formatFileSize(att.size)})
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(att.id)}
                              className="btn btn-ghost btn-icon"
                              style={{ color: 'var(--rose-500)', padding: '2px', height: 'auto' }}
                              title="ลบไฟล์แนบ"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                  {attachments.length > 0 ? `แนบ ${attachments.length} ไฟล์ • ` : ''}
                  ผู้ส่ง: {currentAdmin?.name || 'ผู้ดูแลระบบ (Admin)'}
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
