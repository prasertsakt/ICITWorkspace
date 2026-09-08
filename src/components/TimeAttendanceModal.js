'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  Calendar,
  User,
  Users,
  Building2,
  Image as ImageIcon,
  ExternalLink,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { TIME_ATTENDANCE_TYPES } from '@/lib/constants';
import { formatImageDisplayUrl, isGoogleDriveUrl } from '@/lib/driveUtils';
import { getNotificationRecipientForStep, resolveRoleEmailsFromDirectory } from '@/lib/emailNotificationService';

export default function TimeAttendanceModal({
  isOpen,
  onClose,
  onSubmit,
  currentPersonnel,
  personnelList = [],
  departmentList = [],
  executiveList = [],
  isAdmin = false,
}) {
  const [requestType, setRequestType] = useState('ลงเวลากลับปฏิบัติราชการ');
  const [requesterId, setRequesterId] = useState(currentPersonnel?.id || '');
  const [actionDate, setActionDate] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [attendanceTime, setAttendanceTime] = useState('18:00');
  const [witnessId, setWitnessId] = useState('');
  const [imageProofUrl, setImageProofUrl] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill defaults on modal open
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const todayYmd = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
      const todayDisplay = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

      setActionDate(todayDisplay);
      setAttendanceDate(todayYmd);
      setAttendanceTime(requestType.includes('มา') ? '08:30' : '18:00');
      setErrorMsg('');
      setRequesterId(currentPersonnel?.id || (personnelList[0]?.id || ''));
      setWitnessId('');
      setImageProofUrl('');
      setReason('');
    }
  }, [isOpen, currentPersonnel, personnelList, requestType]);

  // Selected requester object
  const selectedRequester = useMemo(() => {
    return personnelList.find((p) => p.id === requesterId) || currentPersonnel || null;
  }, [personnelList, requesterId, currentPersonnel]);

  // Automatically resolve official roles from directory
  const directoryRoles = useMemo(() => {
    return resolveRoleEmailsFromDirectory(
      personnelList,
      departmentList,
      executiveList,
      selectedRequester ? { requesterDepartment: selectedRequester.department } : null
    );
  }, [personnelList, departmentList, executiveList, selectedRequester]);

  // Auto-find department head corresponding to requester's department
  const detectedDeptHead = useMemo(() => {
    return directoryRoles.deptHead || null;
  }, [directoryRoles]);

  // Auto-find Deputy Director of Administration (รองผู้อำนวยการฝ่ายบริหาร)
  const detectedDeputyDirector = useMemo(() => {
    return directoryRoles.deputyDirector || null;
  }, [directoryRoles]);

  // Auto-find HR Officer
  const detectedHrOfficer = useMemo(() => {
    return directoryRoles.hr || null;
  }, [directoryRoles]);

  // Selected witness person
  const witnessPerson = useMemo(() => {
    return personnelList.find((p) => p.id === witnessId) || null;
  }, [personnelList, witnessId]);

  // List of candidate witnesses (excluding requester)
  const candidateWitnesses = useMemo(() => {
    return personnelList.filter((p) => p.id !== requesterId && p.status === 'ปกติ');
  }, [personnelList, requesterId]);

  // Format image preview
  const previewImgSrc = useMemo(() => {
    return formatImageDisplayUrl(imageProofUrl);
  }, [imageProofUrl]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedRequester) {
      setErrorMsg('กรุณาเลือกผู้ขอลงเวลาปฏิบัติราชการ');
      return;
    }
    if (!attendanceDate) {
      setErrorMsg('กรุณาระบุวันที่ขอลงเวลา');
      return;
    }
    if (!attendanceTime) {
      setErrorMsg('กรุณาระบุเวลาที่ขอลงเวลา');
      return;
    }
    if (!witnessId && !imageProofUrl) {
      setErrorMsg('กรุณาระบุพยานผู้รับรอง หรือแนบไฟล์ภาพหลักฐานกล้องวงจรปิด');
      return;
    }

    // Format display date M/D/YYYY
    let displayAttendanceDate = attendanceDate;
    if (attendanceDate.includes('-')) {
      const [year, month, day] = attendanceDate.split('-');
      displayAttendanceDate = `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
    }

    // Format time (e.g. 6:00:00 PM or 18:00)
    let displayTime = attendanceTime;
    if (/^\d{2}:\d{2}$/.test(attendanceTime)) {
      const [h, min] = attendanceTime.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      displayTime = `${h12}:${String(min).padStart(2, '0')}:00 ${period}`;
    }

    const recordData = {
      requestType,
      requesterId: selectedRequester.id,
      requesterName: selectedRequester.name,
      requesterEmail: selectedRequester.email,
      requesterDepartment: selectedRequester.department || '-',
      requesterPosition: selectedRequester.position || '-',
      actionDate: actionDate || '9/8/2026',
      attendanceDate: displayAttendanceDate,
      attendanceTime: displayTime,
      hrOfficerId: detectedHrOfficer?.id || '',
      hrOfficerName: detectedHrOfficer?.name || 'เจ้าหน้าที่ฝ่ายบุคคล',
      hrOfficerEmail: detectedHrOfficer?.email || '',
      hrEmail: detectedHrOfficer?.email || '',
      witnessId: witnessPerson?.id || '',
      witnessName: witnessPerson?.name || '',
      witnessEmail: witnessPerson?.email || '',
      departmentHeadId: detectedDeptHead?.id || '',
      departmentHeadName: detectedDeptHead?.name || 'หัวหน้าฝ่าย',
      departmentHeadEmail: detectedDeptHead?.email || '',
      deputyDirectorId: detectedDeputyDirector?.id || detectedDeputyDirector?.personnelId || '',
      deputyDirectorName: detectedDeputyDirector?.name || 'รองผู้อำนวยการฝ่ายบริหาร',
      deputyDirectorEmail: detectedDeputyDirector?.email || '',
      imageProofUrl: imageProofUrl.trim(),
      reason: reason.trim(),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(recordData);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--primary-600)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                ยื่นคำขอลงเวลาปฏิบัติราชการ
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                กรอกข้อมูลเวลาจริง ระบุพยาน หรือแนบภาพหลักฐานกล้องวงจรปิด
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" type="button">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--rose-50)',
                border: '1px solid var(--rose-200)',
                color: 'var(--rose-text)',
                marginBottom: '1.25rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. เลือกประเภทคำขอ */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              ประเภทใบลงเวลา <span style={{ color: 'red' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {TIME_ATTENDANCE_TYPES.map((type) => {
                const isSelected = requestType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setRequestType(type);
                      setAttendanceTime(type === 'ลงเวลามาปฏิบัติราชการ' ? '08:30' : '18:00');
                    }}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--primary-50)' : 'white',
                      color: isSelected ? 'var(--primary-700)' : 'var(--text-primary)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'var(--transition)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Clock size={16} color={isSelected ? 'var(--primary-600)' : 'var(--text-muted)'} />
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* 2. ผู้ขอลงเวลาปฏิบัติราชการ */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                ผู้ขอลงเวลาปฏิบัติราชการ <span style={{ color: 'red' }}>*</span>
              </label>
              {isAdmin ? (
                <select
                  value={requesterId}
                  onChange={(e) => setRequesterId(e.target.value)}
                  className="form-input"
                  required
                >
                  {personnelList
                    .filter((p) => p.status === 'ปกติ')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.department})
                      </option>
                    ))}
                </select>
              ) : (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#2563EB',
                  }}
                >
                  {selectedRequester?.name || 'ไม่พบข้อมูลบุคลากร'}
                </div>
              )}
            </div>

            {/* 3. วันที่ดำเนินการ */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                วันที่ดำเนินการ (วันที่ยื่นคำขอ)
              </label>
              <input
                type="text"
                value={actionDate}
                readOnly
                className="form-input"
                style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* 4. วันที่ขอลงเวลา */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                วันที่ขอลงเวลา <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="form-input"
                required
                style={{ fontWeight: 600, color: '#2563EB' }}
              />
            </div>

            {/* 5. เวลา */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                เวลาที่ปฏิบัติราชการจริง <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="time"
                value={attendanceTime}
                onChange={(e) => setAttendanceTime(e.target.value)}
                className="form-input"
                required
                style={{ fontWeight: 600 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* 6. ระบุบุคลากร (พยาน) */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                ระบุบุคลากร (พยาน)
              </label>
              <select
                value={witnessId}
                onChange={(e) => setWitnessId(e.target.value)}
                className="form-input"
              >
                <option value="">-- เลือกพยานผู้รับรอง --</option>
                {candidateWitnesses.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.department})
                  </option>
                ))}
              </select>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                เลือกบุคลากรที่ปฏิบัติงานร่วมกับท่านในเวลาดังกล่าว
              </small>
            </div>

            {/* 7. หัวหน้าฝ่าย_ (Auto-filled) */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                หัวหน้าฝ่าย_ <span style={{ color: 'var(--mint-600)', fontSize: '0.8rem' }}>(ค้นหาอัตโนมัติ)</span>
              </label>
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-main)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Building2 size={16} color="var(--primary-600)" />
                <span>{detectedDeptHead ? detectedDeptHead.name : 'หัวหน้าฝ่ายประจำสังกัด'}</span>
              </div>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                สังกัด: {selectedRequester?.department || '-'}
              </small>
            </div>
          </div>

          {/* 8. แนบไฟล์ภาพกล้องวงจรปิด / ลิงก์ Google Drive */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              แนบไฟล์ภาพกล้องวงจรปิด (กรณีไม่มีพยาน) / แชร์ลิงก์ภาพ Google Drive
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="url"
                placeholder="วางลิงก์ภาพหรือ Google Drive (เช่น https://drive.google.com/file/d/...)"
                value={imageProofUrl}
                onChange={(e) => setImageProofUrl(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
              />
              <ImageIcon
                size={18}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
            </div>

            {/* Live Image Preview */}
            {previewImgSrc && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: 'var(--bg-main)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                  ตัวอย่างภาพหลักฐาน:
                </div>
                <img
                  src={previewImgSrc}
                  alt="ภาพหลักฐานเวลา"
                  style={{
                    maxHeight: '180px',
                    maxWidth: '100%',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-sm)',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                {isGoogleDriveUrl(imageProofUrl) && (
                  <div style={{ marginTop: '6px' }}>
                    <a
                      href={imageProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--primary-600)', textDecoration: 'underline' }}
                    >
                      เปิดลิงก์ใน Google Drive <ExternalLink size={12} style={{ display: 'inline' }} />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 9. เหตุผลความจำเป็น */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              เหตุผลความจำเป็น / หมายเหตุเพิ่มเติม
            </label>
            <textarea
              rows={2}
              placeholder="ระบุเหตุผล เช่น ลืมสแกนนิ้ว, เครื่องสแกนขัดข้อง, ปฏิบัติงานนอกสถานที่เร่งด่วน..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="form-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Workflow Sequence Alert Box */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              marginBottom: '1.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              ℹ️ ขั้นตอนการอนุมัติและผู้รับแจ้งเตือน (4 ขั้นตอน):
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div>
                1. <strong>ฝ่ายบุคคล:</strong> {detectedHrOfficer?.name || 'เจ้าหน้าที่ฝ่ายบุคคล'}{' '}
                <span style={{ color: 'var(--primary-600)' }}>
                  ({detectedHrOfficer?.email || 'รอระบุอีเมล'})
                </span>
              </div>
              <div>
                2. <strong>พยานรับรอง:</strong> {witnessPerson?.name || 'พยานที่ระบุ'}{' '}
                {witnessPerson?.email && <span style={{ color: 'var(--text-muted)' }}>({witnessPerson.email})</span>}
              </div>
              <div>
                3. <strong>หัวหน้าฝ่าย:</strong> {detectedDeptHead?.name || 'หัวหน้าฝ่าย'}{' '}
                {detectedDeptHead?.email && <span style={{ color: 'var(--text-muted)' }}>({detectedDeptHead.email})</span>}
              </div>
              <div>
                4. <strong>รองผู้อำนวยการฝ่ายบริหาร:</strong> {detectedDeputyDirector?.name || 'รองผู้อำนวยการฝ่ายบริหาร'}{' '}
                {detectedDeputyDirector?.email && <span style={{ color: 'var(--text-muted)' }}>({detectedDeputyDirector.email})</span>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ minWidth: '150px' }}
            >
              {isSubmitting ? (
                'กำลังบันทึก...'
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>บันทึกและยื่นคำขอ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
