'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  Calendar,
  User,
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Mail,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  History,
  MessageSquare,
  Sparkles,
  Send,
  Check,
} from 'lucide-react';
import { TIME_ATTENDANCE_STEP_CONFIG } from '@/lib/constants';
import { formatImageDisplayUrl, isGoogleDriveUrl } from '@/lib/driveUtils';
import {
  getNotificationRecipientForStep,
  resendNotificationEmail,
} from '@/lib/emailNotificationService';
import TimeAttendanceCancelModal from '@/components/TimeAttendanceCancelModal';

export default function TimeAttendanceDetailModal({
  isOpen,
  onClose,
  record,
  currentPersonnel,
  personnelList = [],
  isAdmin = false,
  onApproveStep,
  onCancelRequest,
  onOpenEmailPreview,
}) {
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'activity'
  const [commentInput, setCommentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isResendingMail, setIsResendingMail] = useState(false);
  const [mailSentNotice, setMailSentNotice] = useState('');

  // Cancellation State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Reset cancellation box on record change
  useEffect(() => {
    setIsCancelModalOpen(false);
    setShowCancelBox(false);
    setCancelReason('');
    setCancelError('');
  }, [record?.id]);

  const previewImgSrc = useMemo(() => {
    return formatImageDisplayUrl(record?.imageProofUrl);
  }, [record?.imageProofUrl]);

  // Designated recipient for current step
  const stepRecipient = useMemo(() => {
    if (!record) return null;
    return getNotificationRecipientForStep(record, record.currentStep, personnelList);
  }, [record, personnelList]);

  if (!isOpen || !record) return null;

  const handleResendEmail = async () => {
    setIsResendingMail(true);
    setMailSentNotice('');
    try {
      await resendNotificationEmail(record, record.currentStep, stepRecipient);
      setMailSentNotice(`ส่งอีเมลแจ้งเตือนถึง ${stepRecipient?.name || 'ผู้เกี่ยวข้อง'} สำเร็จ`);
      setTimeout(() => setMailSentNotice(''), 4000);
    } catch (e) {
      alert(`การส่งอีเมลไม่สำเร็จ: ${e.message}`);
    } finally {
      setIsResendingMail(false);
    }
  };

  const currentStepConfig = TIME_ATTENDANCE_STEP_CONFIG[record.currentStep] || {
    label: record.currentStep,
    bg: '#F1F5F9',
    color: '#475569',
  };

  // Check if current user is authorized to act on the current step
  const isHrPersonnel = currentPersonnel?.position === 'บุคลากร' || isAdmin;
  const isWitness = currentPersonnel?.id === record.witnessId || isAdmin;
  const isDeptHead = currentPersonnel?.id === record.departmentHeadId || isAdmin;
  const isDeputyDirector =
    currentPersonnel?.id === record.deputyDirectorId ||
    currentPersonnel?.position?.includes('ผู้บริหาร') ||
    isAdmin;

  // Eligibility to cancel: Requester (or Admin) can cancel only if it has NOT yet been finished สมบูรณ์ by รองผู้อำนวยการฝ่ายบริหาร
  const isRequester =
    currentPersonnel &&
    (currentPersonnel.id === record.requesterId ||
      currentPersonnel.email?.toLowerCase() === record.requesterEmail?.toLowerCase() ||
      isAdmin);

  const isFinishedByDeputy = record.currentStep === 'COMPLETED' || record.statusDeputy === 'อนุมัติ';
  const isAlreadyCancelled = record.currentStep === 'CANCELLED' || record.finalStatus?.includes('ยกเลิก');
  const canCancel = isRequester && !isFinishedByDeputy && !isAlreadyCancelled;

  const handleConfirmCancel = async () => {
    setCancelError('');
    setIsCancelling(true);
    try {
      if (onCancelRequest) {
        await onCancelRequest(record.id, cancelReason.trim());
      }
      setShowCancelBox(false);
      setCancelReason('');
    } catch (err) {
      setCancelError(err.message || 'เกิดข้อผิดพลาดในการยกเลิกคำขอ');
    } finally {
      setIsCancelling(false);
    }
  };

  let canTakeAction = false;
  let actionTitle = '';
  let approveLabel = 'อนุมัติ';
  let rejectLabel = 'ไม่อนุมัติ';

  if (record.currentStep === 'HR_REVIEW' && isHrPersonnel) {
    canTakeAction = true;
    actionTitle = 'การตรวจสอบโดยฝ่ายบุคคล';
    approveLabel = 'ตรวจสอบแล้ว (ผ่าน)';
    rejectLabel = 'ไม่ผ่านการตรวจสอบ';
  } else if (record.currentStep === 'WITNESS_CONFIRM' && isWitness) {
    canTakeAction = true;
    actionTitle = 'การรับรองโดยพยาน';
    approveLabel = 'รับรองการเป็นพยาน';
    rejectLabel = 'ไม่รับรอง';
  } else if (record.currentStep === 'DEPT_HEAD_APPROVE' && isDeptHead) {
    canTakeAction = true;
    actionTitle = 'การอนุมัติโดยหัวหน้าฝ่าย';
    approveLabel = 'อนุมัติ';
    rejectLabel = 'ไม่อนุมัติ';
  } else if (record.currentStep === 'DEPUTY_APPROVE' && isDeputyDirector) {
    canTakeAction = true;
    actionTitle = 'การอนุมัติโดยรองผู้อำนวยการฝ่ายบริหาร';
    approveLabel = 'อนุมัติ (จบกระบวนการ)';
    rejectLabel = 'ไม่อนุมัติ';
  }

  const handleAction = async (decision) => {
    setActionError('');
    if (record.currentStep === 'HR_REVIEW' && decision === 'approve' && !commentInput && !record.commentHr) {
      setActionError('กรุณากรอกบันทึกข้อความการตรวจสอบ (Related comment_บันทึกใบลงเวลา)');
      return;
    }

    setIsProcessing(true);
    try {
      await onApproveStep(record.id, record.currentStep, decision, commentInput.trim());
      setCommentInput('');
    } catch (err) {
      setActionError(err.message || 'เกิดข้อผิดพลาดในการบันทึกสถานะ');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '750px',
          maxHeight: '94vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: 0,
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'white',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className="badge"
              style={{
                background: currentStepConfig.bg,
                color: currentStepConfig.color,
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '0.35rem 0.75rem',
              }}
            >
              {currentStepConfig.label}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              รหัส: {record.id}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={onClose} className="btn btn-ghost btn-icon" type="button">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-subtle)',
            padding: '0 1.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            style={{
              padding: '0.75rem 1.25rem',
              borderBottom: activeTab === 'form' ? '2.5px solid var(--primary-600)' : '2.5px solid transparent',
              background: 'transparent',
              borderLeft: 'none',
              borderRight: 'none',
              borderTop: 'none',
              fontWeight: activeTab === 'form' ? 700 : 500,
              color: activeTab === 'form' ? 'var(--primary-600)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileText size={16} />
            <span>แบบฟอร์มใบลงเวลา</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            style={{
              padding: '0.75rem 1.25rem',
              borderBottom: activeTab === 'activity' ? '2.5px solid var(--primary-600)' : '2.5px solid transparent',
              background: 'transparent',
              borderLeft: 'none',
              borderRight: 'none',
              borderTop: 'none',
              fontWeight: activeTab === 'activity' ? 700 : 500,
              color: activeTab === 'activity' ? 'var(--primary-600)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <History size={16} />
            <span>ประวัติกิจกรรม ({record.activityLog?.length || 0})</span>
          </button>
        </div>

        {/* Tab 1: Faithful AppSheet Layout */}
        {activeTab === 'form' && (
          <div style={{ padding: '2rem 1.75rem' }}>
            {/* Email Notification & Status Banner */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '0.85rem 1.15rem',
                marginBottom: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#EEF2FF',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Mail size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ระบบแจ้งเตือนทางอีเมล: {stepRecipient?.name || 'ผู้มีอำนาจอนุมัติ'} ({stepRecipient?.email || '-'})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                    ✓ มีปุ่ม 1-Click Action อนุมัติ/รับรองได้ทันทีผ่านอีเมล
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {mailSentNotice && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--mint-600)', fontWeight: 600 }}>
                    {mailSentNotice}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResendingMail}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                  title="ส่งอีเมลแจ้งเตือนซ้ำไปยังผู้รับในขั้นตอนนี้"
                >
                  <Send size={12} />
                  <span>{isResendingMail ? 'กำลังส่ง...' : 'ส่งอีเมลแจ้งเตือนซ้ำ'}</span>
                </button>
              </div>
            </div>
            {/* Form Title (Large Bold Header matching AppSheet screenshot) */}
            <h1
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
                fontWeight: 800,
                color: '#1E293B',
                letterSpacing: '-0.02em',
                marginBottom: '1.75rem',
                lineHeight: 1.2,
              }}
            >
              {record.requestType || 'ลงเวลากลับปฏิบัติราชการ'}
            </h1>

            {/* Main Key-Value Metadata Grid matching AppSheet */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', marginBottom: '2rem' }}>
              {/* ผู้ขอลงเวลาปฏิบัติราชการ */}
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569' }}>
                  ผู้ขอลงเวลาปฏิบัติราชการ
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284C7' }}>
                  {record.requesterName}
                </span>
              </div>

              {/* วันที่ดำเนินการ */}
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569' }}>วันที่ดำเนินการ</span>
                <span style={{ fontSize: '1rem', color: '#1E293B' }}>{record.actionDate}</span>
              </div>

              {/* วันที่ขอลงเวลา */}
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569' }}>วันที่ขอลงเวลา</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284C7' }}>
                  {record.attendanceDate}
                </span>
              </div>

              {/* เวลา */}
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569' }}>เวลา</span>
                <span style={{ fontSize: '1rem', color: '#1E293B', fontWeight: 500 }}>
                  {record.attendanceTime}
                </span>
              </div>

              {/* ระบุบุคลากร (พยาน) */}
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569' }}>ระบุบุคลากร (พยาน)</span>
                <span style={{ fontSize: '1rem', color: '#1E293B' }}>
                  {record.witnessName || 'ไม่มีพยาน (ใช้ภาพหลักฐาน)'}
                </span>
              </div>

              {/* หัวหน้าฝ่าย_ */}
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569' }}>หัวหน้าฝ่าย_</span>
                <span style={{ fontSize: '1rem', color: '#1E293B' }}>
                  {record.departmentHeadName || '-'}
                </span>
              </div>

              {/* เจ้าหน้าที่ฝ่ายบุคคล */}
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569' }}>เจ้าหน้าที่ฝ่ายบุคคล</span>
                <span style={{ fontSize: '1rem', color: '#1E293B' }}>
                  {record.hrOfficerName || 'เจ้าหน้าที่ฝ่ายบุคคล'}
                  {(record.hrEmail || record.hrOfficerEmail) && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      ({record.hrEmail || record.hrOfficerEmail})
                    </span>
                  )}
                </span>
              </div>

              {/* แนบไฟล์ภาพกล้องวงจรปิด (กรณีไม่มีพยาน) */}
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569', paddingTop: '4px' }}>
                  แนบไฟล์ภาพกล้องวงจรปิด (กรณีไม่มีพยาน)
                </span>
                <div>
                  {previewImgSrc ? (
                    <div>
                      <img
                        src={previewImgSrc}
                        alt="ภาพหลักฐานกล้องวงจรปิด / สแกนนิ้ว"
                        style={{
                          width: '100%',
                          maxWidth: '280px',
                          height: 'auto',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'block',
                        }}
                      />
                      {isGoogleDriveUrl(record.imageProofUrl) && (
                        <a
                          href={record.imageProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '6px',
                            fontSize: '0.8rem',
                            color: 'var(--primary-600)',
                            textDecoration: 'underline',
                          }}
                        >
                          <span>เปิดดูไฟล์ต้นฉบับใน Google Drive</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      (ไม่มีการแนบไฟล์ภาพ)
                    </span>
                  )}
                </div>
              </div>

              {/* เหตุผลความจำเป็น (Optional) */}
              {record.reason && (
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.95rem', color: '#475569' }}>เหตุผลความจำเป็น</span>
                  <span style={{ fontSize: '0.95rem', color: '#334155' }}>{record.reason}</span>
                </div>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '2rem 0 1.5rem 0' }} />

            {/* Related comment_บันทึกใบลงเวลา Section matching AppSheet */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 600 }}>
                  Related comment_บันทึกใบลงเวลา
                </span>
                <span
                  style={{
                    background: '#64748B',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    padding: '1px 7px',
                  }}
                >
                  {record.commentHr ? 1 : 0}
                </span>
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '0.65rem 1rem',
                    borderBottom: '1px solid #E2E8F0',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  รายละเอียดการตรวจสอบโดยฝ่ายบุคคล
                </div>
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.95rem',
                    color: '#0F172A',
                    background: 'white',
                  }}
                >
                  <span>
                    {record.commentHr || (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        (ยังไม่มีบันทึกการตรวจสอบโดยฝ่ายบุคคล)
                      </span>
                    )}
                  </span>
                  <ChevronRight size={18} color="#94A3B8" />
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '1.5rem 0' }} />

            {/* 4 Status Lines matching AppSheet Screenshot */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              {/* 1. สถานะการตรวจสอบโดย_ฝ่ายบุคคล */}
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569' }}>
                  สถานะการตรวจสอบโดย_ฝ่ายบุคคล
                </span>
                <span
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: record.statusHr === 'ตรวจสอบแล้ว' ? '#0284C7' : record.statusHr === 'ไม่ผ่านการตรวจสอบ' ? '#DC2626' : '#94A3B8',
                  }}
                >
                  {record.statusHr || 'รอตรวจสอบ'}
                </span>
              </div>

              {/* 2. สถานะการรับรองโดย_พยาน */}
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569' }}>
                  สถานะการรับรองโดย_พยาน
                </span>
                <span
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: record.statusWitness === 'รับรอง' ? '#0284C7' : record.statusWitness === 'ไม่รับรอง' ? '#DC2626' : '#94A3B8',
                  }}
                >
                  {record.statusWitness || 'รอรับรอง'}
                </span>
              </div>

              {/* 3. สถานะการอนุมัติโดย_หัวหน้าฝ่าย */}
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569' }}>
                  สถานะการอนุมัติโดย_หัวหน้าฝ่าย
                </span>
                <span
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: record.statusDeptHead === 'อนุมัติ' ? '#0284C7' : record.statusDeptHead === 'ไม่อนุมัติ' ? '#DC2626' : '#94A3B8',
                  }}
                >
                  {record.statusDeptHead || 'รออนุมัติ'}
                </span>
              </div>

              {/* 4. สถานะการอนุมัติโดย_รองผอ */}
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569' }}>
                  สถานะการอนุมัติโดย_รองผอ
                </span>
                <span
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: record.statusDeputy === 'อนุมัติ' ? '#0284C7' : record.statusDeputy === 'ไม่อนุมัติ' ? '#DC2626' : '#94A3B8',
                  }}
                >
                  {record.statusDeputy || 'รออนุมัติ'}
                </span>
              </div>
            </div>

            {/* Action Bar for authorized actor */}
            {canTakeAction && record.currentStep !== 'COMPLETED' && record.currentStep !== 'REJECTED' && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  border: '1.5px solid var(--primary-300)',
                  marginTop: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                  <Sparkles size={18} color="var(--primary-600)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--primary-800)' }}>
                    ดำเนินการตามขั้นตอน: {actionTitle}
                  </h3>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--primary-700)', marginBottom: '1rem' }}>
                  ท่านมีสิทธิ์ดำเนินการในฐานะ <strong>{currentPersonnel?.name}</strong> ({currentPersonnel?.position})
                </p>

                {actionError && (
                  <div
                    style={{
                      padding: '0.6rem 0.85rem',
                      background: 'var(--rose-50)',
                      border: '1px solid var(--rose-200)',
                      color: 'var(--rose-text)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {actionError}
                  </div>
                )}

                {/* Comment textarea */}
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    {record.currentStep === 'HR_REVIEW'
                      ? 'บันทึกข้อความการตรวจสอบ (Related comment_บันทึกใบลงเวลา) *'
                      : 'ความเห็นเพิ่มเติม (ถ้ามี)'}
                  </label>
                  <textarea
                    rows={2}
                    className="form-input"
                    placeholder={
                      record.currentStep === 'HR_REVIEW'
                        ? 'เช่น นางสาวธัญนันท์ ลงเวลามา 07.10 น. และไม่ได้ลงเวลากลับ (นายกนก ลงเวลากลับ 18.00 น.)'
                        : 'ระบุความเห็นเพิ่มเติมสำหรับการอนุมัติ/ไม่อนุมัติ...'
                    }
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleAction('reject')}
                    disabled={isProcessing}
                    className="btn btn-secondary"
                    style={{ color: '#DC2626', borderColor: '#FCA5A5', background: '#FEF2F2' }}
                  >
                    <XCircle size={16} />
                    <span>{rejectLabel}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('approve')}
                    disabled={isProcessing}
                    className="btn btn-primary"
                    style={{ background: '#059669', borderColor: '#059669' }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{isProcessing ? 'กำลังบันทึก...' : approveLabel}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Cancellation info if already CANCELLED */}
            {record.currentStep === 'CANCELLED' && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  background: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: 700 }}>
                  <XCircle size={18} color="#64748B" />
                  <span>คำขอนี้ถูกยกเลิกแล้ว</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.35rem' }}>
                  ยกเลิกโดย: <strong>{record.cancelledByName || record.requesterName}</strong>
                  {record.cancelledAt && ` เมื่อ ${new Date(record.cancelledAt).toLocaleString('th-TH')}`}
                </div>
                {record.cancelReason && (
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.35rem', background: '#F1F5F9', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    <strong>เหตุผลการยกเลิก:</strong> {record.cancelReason}
                  </div>
                )}
              </div>
            )}

            {/* Notice if completed by Deputy Director */}
            {isFinishedByDeputy && isRequester && (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '0.85rem 1.25rem',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} color="#16A34A" />
                <span>คำขอนี้ได้รับการอนุมัติสมบูรณ์โดยรองผู้อำนวยการฝ่ายบริหารแล้ว (สิ้นสุดกระบวนการ ไม่สามารถยกเลิกได้)</span>
              </div>
            )}

            {/* Requester Cancellation Action Box */}
            {canCancel && (
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '1.25rem',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <XCircle size={16} />
                      <span>ยกเลิกคำขอลงเวลา (โดยผู้ยื่นคำขอ)</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#B91C1C', marginTop: '2px' }}>
                      สามารถยกเลิกคำขอได้ก่อนที่รองผู้อำนวยการฝ่ายบริหารจะอนุมัติสมบูรณ์
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      color: '#DC2626',
                      borderColor: '#FCA5A5',
                      background: '#FFFFFF',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <XCircle size={14} />
                    <span>ขอยกเลิกคำขอ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Activity Timeline */}
        {activeTab === 'activity' && (
          <div style={{ padding: '2rem 1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              ประวัติและบันทึกกิจกรรม (Activity Log)
            </h3>

            <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
              {/* Timeline vertical bar */}
              <div
                style={{
                  position: 'absolute',
                  left: '7px',
                  top: '10px',
                  bottom: '10px',
                  width: '2px',
                  background: 'var(--border-subtle)',
                }}
              />

              {record.activityLog && record.activityLog.length > 0 ? (
                record.activityLog.map((act, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {/* Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-1.5rem',
                        top: '4px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'var(--primary-600)',
                        border: '3px solid white',
                        boxShadow: '0 0 0 1px var(--primary-200)',
                      }}
                    />

                    <div
                      style={{
                        background: 'white',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem 1.25rem',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {act.action}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(act.timestamp).toLocaleString('th-TH')}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: act.comment && act.comment !== '-' ? '6px' : '0' }}>
                        โดย: <strong>{act.actorName}</strong> {act.actorEmail ? `(${act.actorEmail})` : ''}
                      </div>

                      {act.comment && act.comment !== '-' && (
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: '#334155',
                            background: 'var(--bg-main)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <strong>บันทึก:</strong> {act.comment}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>ไม่มีข้อมูลกิจกรรม</p>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.75rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-subtle)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ปรับปรุงล่าสุด: {new Date(record.updatedAt || record.createdAt).toLocaleString('th-TH')}
          </div>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Themed Cancellation Modal */}
      <TimeAttendanceCancelModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        record={record}
        onConfirmCancel={async (recordId, reason) => {
          if (onCancelRequest) {
            await onCancelRequest(recordId, reason);
          }
          setIsCancelModalOpen(false);
        }}
      />
    </div>
  );
}
