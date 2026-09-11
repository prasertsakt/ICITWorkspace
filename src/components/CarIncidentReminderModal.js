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
} from 'lucide-react';
import { sendCarIncidentReminder } from '../lib/carIncidentService';

export default function CarIncidentReminderModal({
  isOpen,
  onClose,
  record,
  currentUser,
  currentPersonnel,
  onReminderSent,
}) {
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !record) return null;

  // Compute pending recipients preview
  const requesterEmails = (record.requesters || []).map((r) => r.email).filter(Boolean);
  const requesteeEmails = (record.requestees || []).map((r) => r.email).filter(Boolean);

  let targetEmails = [];
  let pendingRoleDesc = '';

  if (record.status === 'NOT_YET_APPROVED') {
    if (!record.immediateCorrection || !record.actionPlans?.length) {
      targetEmails = requesteeEmails;
      pendingRoleDesc = 'ผู้รับการร้องขอ / ผู้รับผิดชอบบริการ (รอจัดทำแนวทางแก้ไขเบื้องต้นและแผนการปฏิบัติ)';
    } else {
      pendingRoleDesc = 'รองผู้อำนวยการฝ่ายบริหาร และ DCC (รอพิจารณาอนุมัติให้เริ่มดำเนินการ)';
    }
  } else if (record.status === 'ON_PROGRESS') {
    const isPlansDone = (record.actionPlans || []).length > 0 &&
      record.actionPlans.every((p) => Boolean(p.completedDate && p.signature));
    if (!isPlansDone) {
      targetEmails = requesteeEmails;
      pendingRoleDesc = 'ผู้รับการร้องขอ (รอดำเนินการตามแผนงาน Corrective Actions ให้เสร็จสิ้น)';
    } else {
      targetEmails = requesterEmails;
      pendingRoleDesc = 'ผู้ตรวจติดตามภายใน / ผู้ร้องขอ (รอดำเนินการตรวจติดตามและประเมินผลการแก้ไข)';
    }
  }

  if (targetEmails.length === 0) {
    targetEmails = [...new Set([...requesteeEmails, ...requesterEmails])];
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

      const res = await sendCarIncidentReminder(record, actor, customMessage);
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          maxWidth: '540px',
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
                marginBottom: '0.5rem',
              }}
            >
              <Info size={14} color="#0D9488" />
              <span>กลุ่มเป้าหมายผู้รับการแจ้งเตือน</span>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>
              {pendingRoleDesc || 'ผู้เกี่ยวข้องในกระบวนการ'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} />
              <span>
                {targetEmails.length > 0
                  ? targetEmails.join(', ')
                  : 'ระบุตามรายชื่อผู้รับบริการ / ผู้ตรวจติดตาม'}
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
              placeholder="เช่น รบกวนเร่งรัดการลงชื่อรับทราบผลการปฏิบัติงานภายในวันที่ 25 ก.พ. นี้..."
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
