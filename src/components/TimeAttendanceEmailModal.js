'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  ExternalLink,
  Settings,
  History,
  Copy,
  Check,
  UserCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  generateEmailContent,
  getEmailConfig,
  saveEmailConfig,
  sendTimeAttendanceNotification,
  getSentEmailLogs,
  getNotificationRecipientForStep,
  resolveRoleEmailsFromDirectory,
} from '@/lib/emailNotificationService';

export default function TimeAttendanceEmailModal({
  isOpen,
  onClose,
  record,
  personnelList = [],
  departmentList = [],
  executiveList = [],
}) {
  const [selectedStep, setSelectedStep] = useState('HR_REVIEW');
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'logs' | 'config'
  const [emailConfig, setEmailConfig] = useState(getEmailConfig());
  const [sentLogs, setSentLogs] = useState([]);
  const [copiedLink, setCopiedLink] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [customRecipientEmail, setCustomRecipientEmail] = useState('');
  const [autoSyncedToast, setAutoSyncedToast] = useState(false);

  // Automatically resolve official notification emails directly from directory
  const autoResolvedEmails = useMemo(() => {
    return resolveRoleEmailsFromDirectory(personnelList, departmentList, executiveList, record);
  }, [personnelList, departmentList, executiveList, record]);

  useEffect(() => {
    if (isOpen && record) {
      setSelectedStep(record.currentStep || 'HR_REVIEW');
      const loadedConfig = getEmailConfig();

      // Automatically set from personnel list if config is empty or legacy placeholder
      const resolvedHr = autoResolvedEmails.hr?.email || '';
      const resolvedDeptHead = autoResolvedEmails.deptHead?.email || '';
      const resolvedDeputy = autoResolvedEmails.deputyDirector?.email || '';

      const updatedConfig = {
        ...loadedConfig,
        hrEmail: (!loadedConfig.hrEmail || loadedConfig.hrEmail === 'tiawongsombat@gmail.com')
          ? resolvedHr
          : loadedConfig.hrEmail,
        deptHeadEmail: (!loadedConfig.deptHeadEmail || loadedConfig.deptHeadEmail === 'tiawongsombat@gmail.com')
          ? resolvedDeptHead
          : loadedConfig.deptHeadEmail,
        deputyDirectorEmail: (!loadedConfig.deputyDirectorEmail || loadedConfig.deputyDirectorEmail === 'tiawongsombat@gmail.com')
          ? resolvedDeputy
          : loadedConfig.deputyDirectorEmail,
      };

      setEmailConfig(updatedConfig);
      setSentLogs(getSentEmailLogs(record.id));
      setSendSuccess(false);

      // Pre-fill test recipient email with the current step's recipient
      const initialTarget = getNotificationRecipientForStep(
        record,
        record.currentStep || 'HR_REVIEW',
        personnelList,
        departmentList,
        executiveList
      );
      setCustomRecipientEmail(initialTarget?.email || record.requesterEmail || '');
    }
  }, [isOpen, record, autoResolvedEmails]);

  if (!isOpen || !record) return null;

  // Determine recipient for the selected preview step
  const resolvedRecipient = getNotificationRecipientForStep(
    record,
    selectedStep,
    personnelList,
    departmentList,
    executiveList
  );
  const targetRecipient = resolvedRecipient || {
    name: record.requesterName || 'ผู้เกี่ยวข้อง',
    email: record.requesterEmail || '',
  };

  // If user entered custom test email, reflect it in the generated email content
  const previewRecipient = customRecipientEmail.trim()
    ? { ...targetRecipient, email: customRecipientEmail.trim() }
    : targetRecipient;

  const generated = generateEmailContent(record, selectedStep, previewRecipient);

  const handleCopy = (url, name) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(name);
    setTimeout(() => setCopiedLink(''), 2500);
  };

  const handleSendTestEmail = async () => {
    setIsSending(true);
    setSendSuccess(false);
    try {
      const effectiveRecipient = {
        ...targetRecipient,
        email: customRecipientEmail.trim() || targetRecipient.email,
        name: targetRecipient.name || 'ผู้ทดสอบระบบ',
      };
      await sendTimeAttendanceNotification(record, selectedStep, effectiveRecipient);
      setSentLogs(getSentEmailLogs(record.id));
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 5000);
    } catch (e) {
      alert(`การส่งอีเมลไม่สำเร็จ: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleAutoSyncFromDirectory = () => {
    const resolvedHr = autoResolvedEmails.hr?.email || '';
    const resolvedDeptHead = autoResolvedEmails.deptHead?.email || '';
    const resolvedDeputy = autoResolvedEmails.deputyDirector?.email || '';

    setEmailConfig((prev) => ({
      ...prev,
      hrEmail: resolvedHr || prev.hrEmail || '',
      deptHeadEmail: resolvedDeptHead || prev.deptHeadEmail || '',
      deputyDirectorEmail: resolvedDeputy || prev.deputyDirectorEmail || '',
    }));
    setAutoSyncedToast(true);
    setTimeout(() => setAutoSyncedToast(false), 3500);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    saveEmailConfig(emailConfig);
    alert('บันทึกการตั้งค่าระบบอีเมล Google API สำเร็จเรียบร้อย');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          maxHeight: '94vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: 0,
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'white' }}>
                ระบบแจ้งเตือนทางอีเมลภาษาไทย (Google API & 1-Click Approval)
              </h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: 0 }}>
                ดูตัวอย่างเนื้อหาอีเมล ทดสอบลิงก์ 1-Click Action และตั้งค่าเชื่อมต่อ
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ color: 'white' }} type="button">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-subtle)',
            padding: '0 1.75rem',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex' }}>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              style={{
                padding: '0.75rem 1.25rem',
                borderBottom: activeTab === 'preview' ? '2.5px solid var(--primary-600)' : '2.5px solid transparent',
                background: 'transparent',
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
                fontWeight: activeTab === 'preview' ? 700 : 500,
                color: activeTab === 'preview' ? 'var(--primary-600)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Mail size={15} />
              <span>ตัวอย่างอีเมล (Preview)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              style={{
                padding: '0.75rem 1.25rem',
                borderBottom: activeTab === 'logs' ? '2.5px solid var(--primary-600)' : '2.5px solid transparent',
                background: 'transparent',
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
                fontWeight: activeTab === 'logs' ? 700 : 500,
                color: activeTab === 'logs' ? 'var(--primary-600)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <History size={15} />
              <span>ประวัติการส่ง ({sentLogs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('config')}
              style={{
                padding: '0.75rem 1.25rem',
                borderBottom: activeTab === 'config' ? '2.5px solid var(--primary-600)' : '2.5px solid transparent',
                background: 'transparent',
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
                fontWeight: activeTab === 'config' ? 700 : 500,
                color: activeTab === 'config' ? 'var(--primary-600)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Settings size={15} />
              <span>ตั้งค่า Google API Webhook</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Preview */}
        {activeTab === 'preview' && (
          <div style={{ padding: '1.5rem 1.75rem' }}>
            {/* Step Selector Pills */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                เลือกขั้นตอนเพื่อดูตัวอย่างอีเมลที่จะส่งให้ผู้มีสิทธิ์:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'HR_REVIEW', label: '1. ฝ่ายบุคคล' },
                  { id: 'WITNESS_CONFIRM', label: '2. พยาน' },
                  { id: 'DEPT_HEAD_APPROVE', label: '3. หัวหน้าฝ่าย' },
                  { id: 'DEPUTY_APPROVE', label: '4. รอง ผอ.' },
                  { id: 'COMPLETED', label: 'แจ้งผล (อนุมัติ)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStep(s.id)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      border: selectedStep === s.id ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                      background: selectedStep === s.id ? 'var(--primary-50)' : 'white',
                      color: selectedStep === s.id ? 'var(--primary-700)' : 'var(--text-secondary)',
                      fontWeight: selectedStep === s.id ? 700 : 500,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Metadata Box */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px', marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>ผู้รับ:</span>
                <span style={{ color: '#1E293B', fontWeight: 600 }}>
                  {targetRecipient?.name} &lt;{targetRecipient?.email}&gt;
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px' }}>
                <span style={{ color: '#64748B' }}>หัวข้อ:</span>
                <span style={{ color: '#0F172A', fontWeight: 600 }}>{generated.subject}</span>
              </div>
            </div>

            {/* 1-Click Action Link Copy Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: '#EEF2FF',
                border: '1px solid #C7D2FE',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#3730A3' }}>
                ⚡ <strong>ลิงก์ 1-Click Approval ในอีเมล:</strong> ผู้รับสามารถคลิกลิงก์เพื่ออนุมัติได้ทันที
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCopy(generated.approveUrl, 'approve')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  {copiedLink === 'approve' ? <Check size={13} color="green" /> : <Copy size={13} />}
                  <span>{copiedLink === 'approve' ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์อนุมัติ'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(generated.rejectUrl, 'reject')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  {copiedLink === 'reject' ? <Check size={13} color="green" /> : <Copy size={13} />}
                  <span>{copiedLink === 'reject' ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์ไม่อนุมัติ'}</span>
                </button>
              </div>
            </div>

            {/* Rendered HTML Email Frame */}
            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '1.25rem',
              }}
            >
              <iframe
                srcDoc={generated.html}
                title="Email Preview"
                style={{
                  width: '100%',
                  height: '460px',
                  border: 'none',
                  background: 'white',
                }}
              />
            </div>

            {/* Test Send Trigger Box */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginTop: '1rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                }}
              >
                <Mail size={16} color="#4F46E5" />
                <span>ส่งอีเมลทดสอบไปยัง (Recipient Email):</span>
              </label>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={customRecipientEmail}
                  onChange={(e) => setCustomRecipientEmail(e.target.value)}
                  placeholder="ระบุอีเมลสำหรับทดสอบ (เช่น hr@icit.kmutnb.ac.th)"
                  className="form-input"
                  style={{
                    flex: '1 1 260px',
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.9rem',
                    background: 'white',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSending || !customRecipientEmail.trim()}
                  className="btn btn-primary"
                  style={{
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    background: '#4F46E5',
                    borderColor: '#4F46E5',
                  }}
                >
                  <Send size={15} />
                  <span>{isSending ? 'กำลังส่งอีเมล...' : 'ส่งอีเมลทดสอบทันที'}</span>
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px dashed #E2E8F0',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                <span>
                  โหมดระบบ:{' '}
                  <strong style={{ color: emailConfig.enableLiveSending && emailConfig.googleAppsScriptUrl ? '#16A34A' : '#D97706' }}>
                    {emailConfig.enableLiveSending && emailConfig.googleAppsScriptUrl
                      ? '🟢 ส่งจริงถึง Inbox ผ่าน Google Apps Script (Gmail)'
                      : '🟡 จำลองในระบบ (บันทึกลงประวัติ/Log Sandbox)'}
                  </strong>
                </span>

                {sendSuccess && (
                  <span style={{ color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={16} /> ส่งข้อความทดสอบสำเร็จเรียบร้อย!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Logs */}
        {activeTab === 'logs' && (
          <div style={{ padding: '1.5rem 1.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              ประวัติการส่งอีเมลสำหรับคำขอนี้ ({sentLogs.length} รายการ)
            </h3>
            {sentLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sentLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.85rem 1rem',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {log.subject}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(log.sentAt).toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ถึง: <strong>{log.recipientName}</strong> ({log.recipientEmail}) &bull; ช่องทาง:{' '}
                      <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>{log.deliveryMethod}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ยังไม่มีประวัติการส่งอีเมลสำหรับคำขอนี้</p>
            )}
          </div>
        )}

        {/* Tab 3: Config */}
        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} style={{ padding: '1.5rem 1.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              ตั้งค่าการเชื่อมต่อ Google API / Google Apps Script
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              สามารถใช้ Google Apps Script Web App เพื่อส่งอีเมลผ่าน Gmail บัญชีองค์กรได้โดยไม่มีค่าใช้จ่าย
            </p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Google Apps Script Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={emailConfig.googleAppsScriptUrl || ''}
                onChange={(e) => setEmailConfig({ ...emailConfig, googleAppsScriptUrl: e.target.value })}
                className="form-input"
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                Web App URL ที่ Deploy จาก Google Apps Script (เลือกสิทธิ์ Execute as Me & Anyone has access)
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                ชื่อผู้ส่ง (Sender Display Name)
              </label>
              <input
                type="text"
                value={emailConfig.senderName || ''}
                onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                className="form-input"
              />
            </div>

            {/* Role Notification Email Settings Header */}
            <div
              style={{
                marginTop: '1.5rem',
                marginBottom: '1rem',
                padding: '0.85rem 1rem',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.07), rgba(124, 58, 237, 0.07))',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={16} color="#4F46E5" />
                  <span>กำหนดอีเมลแจ้งเตือนตามบทบาท (ดึงอัตโนมัติจากฐานข้อมูลบุคลากร)</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  ระบบดึงอีเมลฝ่ายบุคคล, หัวหน้าฝ่าย, และรอง ผอ. ฝ่ายบริหารจากรายชื่อบุคลากรปัจจุบันให้อัตโนมัติ
                </div>
              </div>

              <button
                type="button"
                onClick={handleAutoSyncFromDirectory}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '6px 12px',
                  background: '#EEF2FF',
                  borderColor: '#C7D2FE',
                  color: '#4338CA',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                title="คลิกเพื่อดึงอีเมลล่าสุดจากข้อมูลบุคลากร"
              >
                <RefreshCw size={14} className={autoSyncedToast ? 'animate-spin' : ''} />
                <span>ดึงอีเมลอัตโนมัติจากฐานข้อมูล</span>
              </button>
            </div>

            {autoSyncedToast && (
              <div
                style={{
                  padding: '8px 12px',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '6px',
                  color: '#065F46',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Check size={16} />
                <span>อัปเดตอีเมลจากฐานข้อมูลบุคลากรเรียบร้อยแล้ว! อย่าลืมกดบันทึกการตั้งค่า</span>
              </div>
            )}

            {/* HR Email */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>
                  อีเมลฝ่ายบุคคลรับแจ้งเตือน (HR Notification Email)
                </label>
                {autoResolvedEmails.hr && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: '#ECFDF5',
                      color: '#047857',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid #A7F3D0',
                    }}
                  >
                    <UserCheck size={12} /> พบในบุคลากร: {autoResolvedEmails.hr.name}
                  </span>
                )}
              </div>
              <input
                type="email"
                placeholder={autoResolvedEmails.hr?.email || "hr@icit.kmutnb.ac.th"}
                value={emailConfig.hrEmail || ''}
                onChange={(e) => setEmailConfig({ ...emailConfig, hrEmail: e.target.value })}
                className="form-input"
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                {autoResolvedEmails.hr ? (
                  <span>
                    ดึงอัตโนมัติจากตำแหน่งบุคลากร: <strong>{autoResolvedEmails.hr.name}</strong> ({autoResolvedEmails.hr.position})
                  </span>
                ) : (
                  <span>อีเมลเจ้าหน้าที่ฝ่ายบุคคลสำหรับรับแจ้งเตือนใบลงเวลาใหม่และลิงก์ตรวจสอบ 1-Click</span>
                )}
              </small>
            </div>

            {/* Dept Head Email */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>
                  อีเมลหัวหน้าฝ่ายรับแจ้งเตือน (Dept Head Notification Email)
                </label>
                {autoResolvedEmails.deptHead && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: '#EEF2FF',
                      color: '#4338CA',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid #C7D2FE',
                    }}
                  >
                    <UserCheck size={12} /> พบในบุคลากร: {autoResolvedEmails.deptHead.name}
                  </span>
                )}
              </div>
              <input
                type="email"
                placeholder={autoResolvedEmails.deptHead?.email || "depthead@icit.kmutnb.ac.th"}
                value={emailConfig.deptHeadEmail || ''}
                onChange={(e) => setEmailConfig({ ...emailConfig, deptHeadEmail: e.target.value })}
                className="form-input"
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                {autoResolvedEmails.deptHead ? (
                  <span>
                    ดึงอัตโนมัติจากหัวหน้า{autoResolvedEmails.deptHead.department || 'ฝ่าย'}: <strong>{autoResolvedEmails.deptHead.name}</strong>
                  </span>
                ) : (
                  <span>อีเมลหัวหน้าฝ่าย (หรืออีเมลสำรอง) สำหรับรับการแจ้งเตือนพิจารณาอนุมัติใบลงเวลาจริง</span>
                )}
              </small>
            </div>

            {/* Deputy Director Email */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>
                  อีเมลรองผู้อำนวยการฝ่ายบริหารรับแจ้งเตือน (Deputy Director Notification Email)
                </label>
                {autoResolvedEmails.deputyDirector && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: '#FEF3C7',
                      color: '#92400E',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid #FDE68A',
                    }}
                  >
                    <UserCheck size={12} /> พบในผู้บริหาร: {autoResolvedEmails.deputyDirector.name}
                  </span>
                )}
              </div>
              <input
                type="email"
                placeholder={autoResolvedEmails.deputyDirector?.email || "deputy.admin@icit.kmutnb.ac.th"}
                value={emailConfig.deputyDirectorEmail || ''}
                onChange={(e) => setEmailConfig({ ...emailConfig, deputyDirectorEmail: e.target.value })}
                className="form-input"
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                {autoResolvedEmails.deputyDirector ? (
                  <span>
                    ดึงอัตโนมัติจาก: <strong>{autoResolvedEmails.deputyDirector.name}</strong> ({autoResolvedEmails.deputyDirector.position})
                  </span>
                ) : (
                  <span>อีเมลรอง ผอ. ฝ่ายบริหาร สำหรับรับการแจ้งเตือนพิจารณาอนุมัติขั้นตอนสุดท้ายจริง</span>
                )}
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={emailConfig.enableLiveSending || false}
                  onChange={(e) => setEmailConfig({ ...emailConfig, enableLiveSending: e.target.checked })}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  เปิดใช้งานการส่งอีเมลจริง (Live Sending) เมื่อบันทึกคำขอ/อนุมัติ
                </span>
              </label>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '2px', marginLeft: '24px' }}>
                หากปิดไว้ ระบบจะบันทึกประวัติและสร้างลิงก์ 1-Click Action ในโหมดจำลอง (Sandbox)
              </small>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">
                <CheckCircle2 size={16} />
                <span>บันทึกการตั้งค่า</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
