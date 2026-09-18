'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  AlertCircle,
  CheckCircle2,
  Users,
  Info,
  UserCheck,
  ShieldCheck,
  User,
} from 'lucide-react';
import { sendCarIncidentReminder } from '../lib/carIncidentService';

export default function CarIncidentReminderModal({
  isOpen,
  onClose,
  record,
  currentUser,
  currentPersonnel,
  yearlyConfig = {},
  onReminderSent,
}) {
  const [targetRole, setTargetRole] = useState('AUTO'); // AUTO, REQUESTEES, AUDITORS, MR, ALL
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !record) return null;

  const requesterEmails = (record.requesters || []).map((r) => r.email).filter(Boolean);
  const requesteeEmails = (record.requestees || []).map((r) => r.email).filter(Boolean);
  const mrEmail = yearlyConfig?.mrEmail || 'prasertsak.t@cit.kmutnb.ac.th';

  // Compute pending recipients preview
  let targetEmails = [];
  let pendingRoleDesc = '';

  if (targetRole === 'REQUESTEES') {
    targetEmails = requesteeEmails;
    pendingRoleDesc = 'ผู้รับการร้องขอ / ผู้รับผิดชอบบริการ (Service Owners)';
  } else if (targetRole === 'AUDITORS') {
    targetEmails = requesterEmails;
    pendingRoleDesc = 'ผู้ตรวจติดตามภายใน / ผู้ร้องขอ (Internal Auditors)';
  } else if (targetRole === 'MR') {
    targetEmails = [mrEmail].filter(Boolean);
    pendingRoleDesc = 'ผู้แทนฝ่ายบริหาร (MR - Management Representative)';
  } else if (targetRole === 'ALL') {
    targetEmails = [...new Set([...requesteeEmails, ...requesterEmails, mrEmail])].filter(Boolean);
    pendingRoleDesc = 'ทุกฝ่ายที่เกี่ยวข้อง (ผู้รับการตรวจ, ผู้ตรวจติดตาม, MR)';
  } else {
    // AUTO mode based on current document status & progress
    if (record.status === 'NOT_YET_APPROVED') {
      if (!record.immediateCorrection || !record.actionPlans?.length) {
        targetEmails = requesteeEmails;
        pendingRoleDesc = 'ผู้รับการร้องขอ (รอจัดทำแนวทางแก้ไขเบื้องต้นและแผนปฏิบัติการ)';
      } else if (!record.auditorApproval?.approved) {
        targetEmails = requesterEmails;
        pendingRoleDesc = 'ผู้ตรวจติดตามภายใน (รอพิจารณาให้ความเห็นชอบแผนงาน)';
      } else if (!record.executiveSignature) {
        targetEmails = [mrEmail].filter(Boolean);
        pendingRoleDesc = 'ผู้แทนฝ่ายบริหาร (MR - รอดำเนินการลงนามรับทราบแผนงาน)';
      } else {
        pendingRoleDesc = 'รองผู้อำนวยการฝ่ายบริหาร และ DCC (รอพิจารณาอนุมัติให้เริ่มดำเนินการ)';
      }
    } else if (record.status === 'ON_PROGRESS') {
      const isPlansDone = (record.actionPlans || []).length > 0 &&
        record.actionPlans.every((p) => Boolean(p.completedDate && p.signature));
      if (!isPlansDone) {
        targetEmails = requesteeEmails;
        pendingRoleDesc = 'ผู้รับการร้องขอ (รอดำเนินการตามแผน Corrective Actions ให้เสร็จสิ้น)';
      } else {
        targetEmails = requesterEmails;
        pendingRoleDesc = 'ผู้ตรวจติดตามภายใน / ผู้ร้องขอ (รอดำเนินการตรวจติดตามและประเมินผลการแก้ไขในส่วนที่ 4)';
      }
    }
  }

  if (targetEmails.length === 0) {
    targetEmails = [...new Set([...requesteeEmails, ...requesterEmails, mrEmail])].filter(Boolean);
  }

  const handleSend = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setResultMsg(null);
    setIsSending(true);

    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'DCC (ผู้ควบคุมเอกสาร)',
        email: currentUser?.email || currentPersonnel?.email || '',
      };

      const res = await sendCarIncidentReminder(record, actor, targetRole, customMessage, yearlyConfig);
      setResultMsg('ส่งอีเมลแจ้งเตือนติดตามความคืบหน้าเรียบร้อยแล้ว');
      if (onReminderSent) onReminderSent(res);
      setTimeout(() => {
        onClose();
        setResultMsg(null);
        setCustomMessage('');
      }, 1400);
    } catch (err) {
      console.error('Send reminder error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการส่งอีเมลแจ้งเตือน');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.5rem',
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
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={18} color="#A7F3D0" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                ส่งอีเมลแจ้งเตือนติดตาม (DCC Reminder)
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8' }}>
                {record.docNumber} &bull; {record.topic}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSend} style={{ padding: '1.5rem' }}>
          {resultMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#059669',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '1.25rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{resultMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Target Group Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '0.5rem',
              }}
            >
              เลือกกลุ่มเป้าหมายผู้รับการแจ้งเตือน:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {[
                { id: 'AUTO', label: 'ตามขั้นตอนปัจจุบัน (Auto)', icon: Info },
                { id: 'REQUESTEES', label: 'ผู้รับการตรวจ (Requestees)', icon: User },
                { id: 'AUDITORS', label: 'ผู้ตรวจติดตาม (Auditors)', icon: UserCheck },
                { id: 'MR', label: 'ผู้แทนฝ่ายบริหาร (MR)', icon: ShieldCheck },
                { id: 'ALL', label: 'ทุกฝ่ายที่เกี่ยวข้อง (All)', icon: Users },
              ].map((opt) => {
                const isSel = targetRole === opt.id;
                const OptIcon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTargetRole(opt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: isSel ? '1.5px solid #0D9488' : '1px solid #CBD5E1',
                      background: isSel ? '#F0FDFA' : '#FFFFFF',
                      color: isSel ? '#0F766E' : '#334155',
                      fontSize: '0.8rem',
                      fontWeight: isSel ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <OptIcon size={14} style={{ color: isSel ? '#0D9488' : '#64748B' }} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pending Info Card */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#64748B',
                marginBottom: '0.35rem',
              }}
            >
              <Info size={14} color="#0D9488" />
              <span>บทบาทเป้าหมาย:</span>
              <span style={{ color: '#0F766E', fontWeight: 800 }}>{pendingRoleDesc}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <Users size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ wordBreak: 'break-all' }}>
                {targetEmails.length > 0
                  ? targetEmails.join(', ')
                  : 'ไม่พบอีเมลผู้รับ'}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '0.4rem',
              }}
            >
              ข้อความกำกับเพิ่มเติมจาก DCC (ถ้ามี):
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="เช่น รบกวนเร่งรัดการลงชื่อรับทราบผลการปฏิบัติงานภายในสัปดาห์นี้..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              disabled={isSending}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              disabled={isSending || targetEmails.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                padding: '0.5rem 1.25rem',
                background: '#0D9488',
                color: '#FFFFFF',
                border: 'none',
              }}
            >
              <Mail size={16} />
              <span>{isSending ? 'กำลังส่งแจ้งเตือน...' : 'ส่งอีเมลแจ้งเตือน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
