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
  ShieldCheck,
  Lock,
  Mail,
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
  const [hrOfficerId, setHrOfficerId] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [attendanceTime, setAttendanceTime] = useState('18:00');
  const [witnessId, setWitnessId] = useState('');
  const [imageProofUrl, setImageProofUrl] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. ผู้ขอยื่นลงเวลา: ล็อกอัตโนมัติตาม login user (can not edit)
  const selectedRequester = useMemo(() => {
    if (!currentPersonnel) return null;
    return personnelList.find((p) => p.id === currentPersonnel.id) || currentPersonnel;
  }, [currentPersonnel, personnelList]);

  // Automatically resolve official roles from directory
  const directoryRoles = useMemo(() => {
    return resolveRoleEmailsFromDirectory(
      personnelList,
      departmentList,
      executiveList,
      selectedRequester ? { requesterDepartment: selectedRequester.department } : null
    );
  }, [personnelList, departmentList, executiveList, selectedRequester]);

  // 2. HR Officer (งานบุคคล): ค้นหาและเลือกระบุอัตโนมัติ (แก้ไขไม่ได้)
  const selectedHrOfficer = useMemo(() => {
    const jarucha = personnelList.find((p) => p.email?.toLowerCase() === 'jarucha.j@icit.kmutnb.ac.th');
    if (jarucha) return jarucha;
    return (
      directoryRoles.hr || {
        id: 'pers-1788794490388',
        name: 'นางสาวจารุชา เจือทอง',
        email: 'jarucha.j@icit.kmutnb.ac.th',
        position: 'เจ้าหน้าที่ ตำแหน่งงานบุคลากร',
      }
    );
  }, [personnelList, directoryRoles]);

  // 3. หัวหน้าฝ่าย: ค้นหาและเลือกอัตโนมัติตามฝ่ายสังกัด (can not edit)
  const detectedDeptHead = useMemo(() => {
    return directoryRoles.deptHead || null;
  }, [directoryRoles]);

  // 4. รองผู้อำนวยการฝ่ายบริหาร: รศ. ดร.ประเสริฐศักดิ์ เตียวงศ์สมบัติ (prasertsak.t@cit.kmutnb.ac.th)
  const detectedDeputyDirector = useMemo(() => {
    return (
      directoryRoles.deputyDirector || {
        id: '4SRaJO35tQE1ae4YC16V',
        name: 'รศ. ดร.ประเสริฐศักดิ์ เตียวงศ์สมบัติ',
        email: 'prasertsak.t@cit.kmutnb.ac.th',
        position: 'รองผู้อำนวยการฝ่ายบริหาร',
      }
    );
  }, [directoryRoles]);

  // Selected witness person
  const witnessPerson = useMemo(() => {
    return personnelList.find((p) => p.id === witnessId) || null;
  }, [personnelList, witnessId]);

  // List of candidate witnesses (excluding requester)
  const candidateWitnesses = useMemo(() => {
    const reqId = selectedRequester?.id;
    return personnelList.filter((p) => p.id !== reqId && p.status === 'ปกติ');
  }, [personnelList, selectedRequester]);

  // Format image preview
  const previewImgSrc = useMemo(() => {
    return formatImageDisplayUrl(imageProofUrl);
  }, [imageProofUrl]);

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

      // Auto-select jarucha.j@icit.kmutnb.ac.th as HR officer
      const jarucha = personnelList.find((p) => p.email?.toLowerCase() === 'jarucha.j@icit.kmutnb.ac.th');
      setHrOfficerId(jarucha?.id || 'pers-1788794490388');

      setWitnessId('');
      setImageProofUrl('');
      setReason('');
    }
  }, [isOpen, currentPersonnel, personnelList, requestType]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedRequester) {
      setErrorMsg('กรุณาเข้าสู่ระบบก่อนยื่นคำขอลงเวลาปฏิบัติราชการ');
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

    const hrEmailFinal = (selectedHrOfficer?.email || 'jarucha.j@icit.kmutnb.ac.th').trim();
    const deptHeadEmailFinal = (detectedDeptHead?.email || '').trim();
    const deputyEmailFinal = (detectedDeputyDirector?.email || 'prasertsak.t@cit.kmutnb.ac.th').trim();

    const recordData = {
      requestType,
      // ผู้ขอยื่น: ล็อกอัตโนมัติตาม login user
      requesterId: selectedRequester.id,
      requesterName: selectedRequester.name,
      requesterEmail: selectedRequester.email,
      requesterDepartment: selectedRequester.department || '-',
      requesterPosition: selectedRequester.position || '-',
      actionDate: actionDate || '9/8/2026',
      attendanceDate: displayAttendanceDate,
      attendanceTime: displayTime,
      // HR: เจ้าหน้าที่ ตำแหน่งงานบุคลากร jarucha.j@icit.kmutnb.ac.th
      hrOfficerId: selectedHrOfficer?.id || 'pers-1788794490388',
      hrOfficerName: selectedHrOfficer?.name || 'นางสาวจารุชา เจือทอง',
      hrOfficerEmail: hrEmailFinal,
      hrEmail: hrEmailFinal,
      // พยาน
      witnessId: witnessPerson?.id || '',
      witnessName: witnessPerson?.name || '',
      witnessEmail: witnessPerson?.email || '',
      // หัวหน้าฝ่าย: auto select from the list (can not edit)
      departmentHeadId: detectedDeptHead?.id || '',
      departmentHeadName: detectedDeptHead?.name || 'หัวหน้าฝ่าย',
      departmentHeadEmail: deptHeadEmailFinal,
      // รองผู้อำนวยการฝ่ายบริหาร: prasertsak.t@cit.kmutnb.ac.th
      deputyDirectorId: detectedDeputyDirector?.id || detectedDeputyDirector?.personnelId || '4SRaJO35tQE1ae4YC16V',
      deputyDirectorName: detectedDeputyDirector?.name || 'รศ. ดร.ประเสริฐศักดิ์ เตียวงศ์สมบัติ',
      deputyDirectorEmail: deputyEmailFinal,
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

          {/* 2. ผู้ขอยื่นลงเวลา (Automatically select login user, CAN NOT EDIT) */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                ผู้ขอยื่นลงเวลาปฏิบัติราชการ <span style={{ color: 'red' }}>*</span>
              </label>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#EFF6FF',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  border: '1px solid #BFDBFE',
                  fontWeight: 600,
                }}
              >
                <Lock size={12} /> เลือกระบุอัตโนมัติตามผู้เข้าสู่ระบบ (แก้ไขไม่ได้)
              </span>
            </div>

            <div
              style={{
                padding: '0.85rem 1rem',
                background: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#DBEAFE',
                  color: '#1D4ED8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <User size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
                  {selectedRequester?.name || 'ไม่พบข้อมูลผู้เข้าสู่ระบบ'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
                  <span>สังกัด: <strong>{selectedRequester?.department || '-'}</strong></span>
                  <span>&bull;</span>
                  <span>ตำแหน่ง: <strong>{selectedRequester?.position || '-'}</strong></span>
                  <span>&bull;</span>
                  <span style={{ color: '#2563EB', fontWeight: 600 }}>{selectedRequester?.email || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* 3. วันที่ดำเนินการ (วันที่ยื่นคำขอ) */}
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* 5. เวลาที่ปฏิบัติราชการจริง */}
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

            {/* 6. HR: เจ้าหน้าที่ ตำแหน่งงานบุคลากร (auto select, can not edit) */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label" style={{ fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>ฝ่ายบุคคล (งานบุคลากร) <span style={{ color: 'red' }}>*</span></span>
                  <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, background: '#ECFDF5', padding: '1px 6px', borderRadius: '8px' }}>
                    ตรวจสอบลำดับที่ 1
                  </span>
                </label>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: '#F1F5F9',
                    padding: '1px 6px',
                    borderRadius: '8px',
                  }}
                >
                  <Lock size={11} /> กำหนดอัตโนมัติ (แก้ไขไม่ได้)
                </span>
              </div>
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: '#F8FAFC',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1E293B' }}>
                  <ShieldCheck size={16} color="#059669" />
                  <span>{selectedHrOfficer?.name || 'นางสาวจารุชา เจือทอง'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span>{selectedHrOfficer?.position || 'เจ้าหน้าที่ ตำแหน่งงานบุคลากร'}</span>
                  <span>&bull;</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>{selectedHrOfficer?.email || 'jarucha.j@icit.kmutnb.ac.th'}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* 7. หัวหน้าฝ่าย: auto select from the list (can not edit) */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>
                  หัวหน้าฝ่าย <span style={{ color: 'red' }}>*</span>
                </label>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: '#F1F5F9',
                    padding: '1px 6px',
                    borderRadius: '8px',
                  }}
                >
                  <Lock size={11} /> ค้นหาอัตโนมัติ (แก้ไขไม่ได้)
                </span>
              </div>
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: '#F8FAFC',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1E293B' }}>
                  <Building2 size={16} color="var(--primary-600)" />
                  <span>{detectedDeptHead ? detectedDeptHead.name : 'หัวหน้าฝ่ายประจำสังกัด'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  {detectedDeptHead?.email && (
                    <span style={{ color: '#2563EB', fontWeight: 600 }}>{detectedDeptHead.email}</span>
                  )}
                  {detectedDeptHead?.position && <span> &bull; {detectedDeptHead.position}</span>}
                </div>
              </div>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                สังกัด: {selectedRequester?.department || '-'}
              </small>
            </div>

            {/* 8. ระบุบุคลากร (พยาน) */}
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
          </div>

          {/* 9. แนบไฟล์ภาพกล้องวงจรปิด / ลิงก์ Google Drive */}
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

          {/* 10. เหตุผลความจำเป็น */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
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

          {/* Workflow Sequence Alert Box (Sending notification mail according to above information) */}
          <div
            style={{
              padding: '0.9rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              marginBottom: '1.5rem',
              fontSize: '0.82rem',
              color: '#334155',
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              <Mail size={16} color="var(--primary-600)" />
              <span>ลำดับขั้นตอนการส่งอีเมลแจ้งเตือนและอนุมัติ (4 ขั้นตอน):</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>
                1. <strong>ฝ่ายบุคคล (งานบุคลากร):</strong> {selectedHrOfficer?.name || 'นางสาวจารุชา เจือทอง'}{' '}
                <span style={{ color: '#2563EB', fontWeight: 600 }}>
                  ({selectedHrOfficer?.email || 'jarucha.j@icit.kmutnb.ac.th'})
                </span>
                <span style={{ color: '#059669', fontSize: '0.75rem', marginLeft: '6px' }}>[ส่งอีเมลแจ้งเตือนตรวจสอบทันทีที่ยื่นคำขอ]</span>
              </div>
              <div>
                2. <strong>พยานรับรอง:</strong> {witnessPerson ? `${witnessPerson.name} (${witnessPerson.email})` : 'ไม่มีพยาน (ใช้ภาพหลักฐานกล้องวงจรปิด)'}
              </div>
              <div>
                3. <strong>หัวหน้าฝ่าย:</strong> {detectedDeptHead ? `${detectedDeptHead.name} (${detectedDeptHead.email})` : 'หัวหน้าฝ่ายตามสังกัด'}
              </div>
              <div>
                4. <strong>รองผู้อำนวยการฝ่ายบริหาร:</strong> {detectedDeputyDirector?.name || 'รศ. ดร.ประเสริฐศักดิ์ เตียวงศ์สมบัติ'}{' '}
                <span style={{ color: '#2563EB', fontWeight: 600 }}>
                  ({detectedDeputyDirector?.email || 'prasertsak.t@cit.kmutnb.ac.th'})
                </span>
                <span style={{ color: '#475569', fontSize: '0.75rem', marginLeft: '6px' }}>[อนุมัติขั้นสุดท้าย]</span>
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
              style={{ minWidth: '160px' }}
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
