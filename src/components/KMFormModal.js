'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Calendar,
  Users,
  Building2,
  MapPin,
  DollarSign,
  BookOpen,
  Link as LinkIcon,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  FileText,
  Sparkles,
} from 'lucide-react';
import KMDatePickerModal from './KMDatePickerModal';
import KMAttendeeSelectModal from './KMAttendeeSelectModal';
import { formatDateDDMMYYYYBE } from '@/lib/dateUtils';
import { getAvailableFiscalYears, getCurrentThaiFiscalYear } from '@/lib/dateUtils';
import { KM_STATUSES } from '@/lib/kmHubService';
import { formatImageDisplayUrl } from '@/lib/driveUtils';

export default function KMFormModal({
  isOpen,
  onClose,
  onSave,
  recordToEdit = null,
  personnelList = [],
  executiveList = [],
}) {
  const isEditing = Boolean(recordToEdit && recordToEdit.id);

  const [formData, setFormData] = useState({
    courseTitle: '',
    fiscalYear: String(getCurrentThaiFiscalYear()),
    organizer: '',
    location: '',
    startDate: '',
    endDate: '',
    budget: '',
    attendees: [],
    sharingMethods: {
      summaryReport: true,
      smallGroupLecture: false,
      lectureDateTime: '',
      otherMethod: '',
    },
    documentUrls: [{ title: 'รายงานประมวลความรู้', url: '' }],
    status: 'IN_PROGRESS',
    completedDate: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [activeDatePickerField, setActiveDatePickerField] = useState(null); // 'startDate' | 'endDate' | 'completedDate' | null
  const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        id: recordToEdit.id,
        courseTitle: recordToEdit.courseTitle || '',
        fiscalYear: String(recordToEdit.fiscalYear || getCurrentThaiFiscalYear()),
        organizer: recordToEdit.organizer || '',
        location: recordToEdit.location || '',
        startDate: recordToEdit.startDate || '',
        endDate: recordToEdit.endDate || recordToEdit.startDate || '',
        budget: recordToEdit.budget !== undefined && recordToEdit.budget !== null ? String(recordToEdit.budget) : '',
        attendees: Array.isArray(recordToEdit.attendees) ? recordToEdit.attendees : [],
        sharingMethods: {
          summaryReport: Boolean(recordToEdit.sharingMethods?.summaryReport),
          smallGroupLecture: Boolean(recordToEdit.sharingMethods?.smallGroupLecture),
          lectureDateTime: recordToEdit.sharingMethods?.lectureDateTime || '',
          otherMethod: recordToEdit.sharingMethods?.otherMethod || '',
        },
        documentUrls:
          Array.isArray(recordToEdit.documentUrls) && recordToEdit.documentUrls.length > 0
            ? recordToEdit.documentUrls.map((d) =>
                typeof d === 'string' ? { title: 'ลิงก์เอกสาร', url: d } : { title: d.title || 'ลิงก์เอกสาร', url: d.url || '' }
              )
            : [{ title: 'รายงานประมวลความรู้', url: '' }],
        status: recordToEdit.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        completedDate: recordToEdit.completedDate || '',
        notes: recordToEdit.notes || '',
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        courseTitle: '',
        fiscalYear: String(getCurrentThaiFiscalYear()),
        organizer: '',
        location: '',
        startDate: today,
        endDate: today,
        budget: '',
        attendees: [],
        sharingMethods: {
          summaryReport: true,
          smallGroupLecture: false,
          lectureDateTime: '',
          otherMethod: '',
        },
        documentUrls: [{ title: 'รายงานประมวลความรู้', url: '' }],
        status: 'IN_PROGRESS',
        completedDate: '',
        notes: '',
      });
    }
    setErrors({});
  }, [recordToEdit, isOpen]);

  if (!isOpen) return null;

  // Add & remove document links
  const handleAddDocumentLink = () => {
    setFormData((prev) => ({
      ...prev,
      documentUrls: [...prev.documentUrls, { title: '', url: '' }],
    }));
  };

  const handleRemoveDocumentLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      documentUrls: prev.documentUrls.filter((_, i) => i !== index),
    }));
  };

  const handleDocumentChange = (index, field, val) => {
    setFormData((prev) => {
      const nextDocs = [...prev.documentUrls];
      nextDocs[index] = { ...nextDocs[index], [field]: val };
      return { ...prev, documentUrls: nextDocs };
    });
  };

  const handleRemoveAttendee = (pId) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((p) => p.id !== pId && p.email !== pId),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.courseTitle.trim()) {
      newErrors.courseTitle = 'กรุณาระบุชื่อหลักสูตร / หัวข้อการอบรม';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'กรุณาระบุวันที่เริ่มการอบรม';
    }

    if (formData.attendees.length === 0) {
      newErrors.attendees = 'กรุณาเลือกรายชื่อผู้เข้าอบรมอย่างน้อย 1 คน';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ...formData,
      budget: Number(formData.budget) || 0,
      documentUrls: formData.documentUrls.filter((d) => d.url.trim()),
    };

    onSave(payload);
  };

  return (
    <>
      <div className="modal-overlay" style={{ zIndex: 10500 }}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '780px',
            width: '94vw',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)',
              color: '#FFFFFF',
              padding: '1.25rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={22} color="#FFFFFF" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  {isEditing ? 'แก้ไขข้อมูลการอบรมและการแบ่งปันความรู้' : 'บันทึกข้อมูลการอบรมและองค์ความรู้ใหม่'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.9 }}>
                  ระบบจัดเก็บและติดตามการแบ่งปันองค์ความรู้บุคลากร (Knowledge Management Tracking)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '6px',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Body */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              gap: '1.25rem',
            }}
          >
            {/* Course Title */}
            <div className="input-group">
              <label className="input-label" style={{ fontWeight: 800, color: '#1E293B' }}>
                ชื่อหลักสูตร / หัวข้อการฝึกอบรม-สัมมนา <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.courseTitle ? 'input-error' : ''}`}
                placeholder="เช่น อบรมหลักสูตร TQA for Education Sector"
                value={formData.courseTitle}
                onChange={(e) => setFormData({ ...formData, courseTitle: e.target.value })}
                style={{ fontSize: '0.95rem', fontWeight: 600 }}
              />
              {errors.courseTitle && (
                <span style={{ fontSize: '0.75rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.courseTitle}
                </span>
              )}
            </div>

            {/* Fiscal Year, Organizer & Budget */}
            <div className="grid-3" style={{ gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">ปีงบประมาณ</label>
                <select
                  className="form-select"
                  value={formData.fiscalYear}
                  onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                  style={{ fontWeight: 700, color: '#065F46' }}
                >
                  {getAvailableFiscalYears().map((y) => (
                    <option key={y} value={y}>
                      ปี {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">หน่วยงานที่จัด (Organizer)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น สถาบันเพิ่มผลผลิตแห่งชาติ"
                  value={formData.organizer}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">งบประมาณที่ขอ (บาท)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    placeholder="เช่น 18480"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    style={{ fontWeight: 700 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.8rem',
                      color: '#64748B',
                      fontWeight: 600,
                    }}
                  >
                    บาท
                  </span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="input-group">
              <label className="input-label">สถานที่จัด (Venue / Location)</label>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น ณ โรงแรม ฮอลิเดย์ อินน์ ศรีราชา จ.ชลบุรี หรือ Online (Zoom Meeting)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            {/* Training Dates (Modal Date Picker Trigger) */}
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">
                  เริ่มตั้งแต่วันที่ (Start Date) <span className="required">*</span>
                </label>
                <div
                  onClick={() => setActiveDatePickerField('startDate')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    border: errors.startDate ? '1.5px solid #DC2626' : '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} color="#059669" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                      {formData.startDate ? formatDateDDMMYYYYBE(formData.startDate) : 'คลิกเพื่อเลือกวันที่'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>เลือกวันที่</span>
                </div>
                {errors.startDate && (
                  <span style={{ fontSize: '0.75rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.startDate}
                  </span>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">ถึงวันที่ (End Date)</label>
                <div
                  onClick={() => setActiveDatePickerField('endDate')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} color="#059669" />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                      {formData.endDate ? formatDateDDMMYYYYBE(formData.endDate) : 'คลิกเพื่อเลือกวันที่'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>เลือกวันที่</span>
                </div>
              </div>
            </div>

            {/* Attendees Selection (Modal Trigger) */}
            <div className="input-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="input-label" style={{ margin: 0, fontWeight: 800, color: '#1E293B' }}>
                  รายชื่อผู้เข้าอบรม (ไม่รวมผู้บริหาร) <span className="required">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAttendeeModalOpen(true)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    padding: '3px 10px',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#065F46',
                    borderColor: '#A7F3D0',
                    background: '#ECFDF5',
                    fontWeight: 700,
                  }}
                >
                  <Plus size={13} />
                  <span>เลือกผู้เข้าอบรม ({formData.attendees.length})</span>
                </button>
              </div>

              {formData.attendees.length === 0 ? (
                <div
                  onClick={() => setIsAttendeeModalOpen(true)}
                  style={{
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: errors.attendees ? '1.5px dashed #DC2626' : '1px dashed #CBD5E1',
                    cursor: 'pointer',
                  }}
                >
                  <Users size={24} color="#94A3B8" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                    คลิกที่นี่เพื่อเปิดหน้าต่างเลือกรายชื่อผู้เข้าอบรม (เลือกได้มากกว่า 1 คน)
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    padding: '0.75rem',
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {formData.attendees.map((p) => {
                    const avatarSrc = formatImageDisplayUrl(p.avatarUrl || p.photoUrl || p.photoURL || p.image || p.imageUrl || p.avatar || p.picture || p.photo || '');
                    return (
                      <div
                        key={p.id || p.email}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          color: '#065F46',
                          padding: '3px 10px 3px 5px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt=""
                            style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span>{p.name}</span>
                        <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 500 }}>
                          ({p.department || 'สำนัก'})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttendee(p.id || p.email)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#059669',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.attendees && (
                <span style={{ fontSize: '0.75rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.attendees}
                </span>
              )}
            </div>

            {/* Knowledge Sharing Options */}
            <div
              style={{
                background: '#F0FDF4',
                border: '1.5px solid #BBF7D0',
                borderRadius: '12px',
                padding: '1.15rem 1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.85rem' }}>
                <Sparkles size={18} color="#059669" />
                <span style={{ fontSize: '0.925rem', fontWeight: 800, color: '#065F46' }}>
                  องค์ความรู้ที่ทำการแบ่งปัน (Knowledge Sharing Formats)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Option 1: Summary Report */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#1E293B',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.sharingMethods.summaryReport}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sharingMethods: { ...formData.sharingMethods, summaryReport: e.target.checked },
                      })
                    }
                    style={{ accentColor: '#059669', width: '18px', height: '18px' }}
                  />
                  <span>📄 รายงานสรุปประมวลความรู้ (Knowledge Summary Report)</span>
                </label>

                {/* Option 2: Small Group Lecture */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#1E293B',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.sharingMethods.smallGroupLecture}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sharingMethods: { ...formData.sharingMethods, smallGroupLecture: e.target.checked },
                        })
                      }
                      style={{ accentColor: '#059669', width: '18px', height: '18px' }}
                    />
                    <span>🎤 บรรยายกลุ่มย่อย (Small Group Knowledge Sharing Session)</span>
                  </label>

                  {formData.sharingMethods.smallGroupLecture && (
                    <div style={{ marginLeft: '28px', marginTop: '2px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="ระบุวันเวลา เช่น 15 ส.ค. 2567 เวลา 13:30 - 15:00 น. ณ ห้องประชุมชั้น 3"
                        value={formData.sharingMethods.lectureDateTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sharingMethods: { ...formData.sharingMethods, lectureDateTime: e.target.value },
                          })
                        }
                        style={{ fontSize: '0.825rem' }}
                      />
                    </div>
                  )}
                </div>

                {/* Option 3: Other Method */}
                <div style={{ marginTop: '2px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="วิธีการแบ่งปันความรู้อื่นๆ (ถ้ามี) เช่น สื่อวิดีโอคลิป, คู่มือการปฏิบัติงาน"
                    value={formData.sharingMethods.otherMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sharingMethods: { ...formData.sharingMethods, otherMethod: e.target.value },
                      })
                    }
                    style={{ fontSize: '0.825rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Document Attachments (Multiple URLs) */}
            <div className="input-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="input-label" style={{ margin: 0, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LinkIcon size={14} color="#059669" />
                  <span>แนบลิงก์เอกสาร / สื่อนำเสนอ (มีได้มากกว่า 1 ลิงก์)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddDocumentLink}
                  className="btn btn-secondary btn-sm"
                  style={{
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={12} />
                  <span>เพิ่มลิงก์</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {formData.documentUrls.map((docItem, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ชื่อเอกสาร เช่น รายงานสรุปความรู้, สไลด์บรรยาย"
                      value={docItem.title}
                      onChange={(e) => handleDocumentChange(idx, 'title', e.target.value)}
                      style={{ flex: '0 0 35%', fontSize: '0.825rem' }}
                    />
                    <input
                      type="url"
                      className="form-input"
                      placeholder="URL ลิงก์ เช่น https://icit.kmutnb.ac.th/km/file.pdf หรือ Google Drive"
                      value={docItem.url}
                      onChange={(e) => handleDocumentChange(idx, 'url', e.target.value)}
                      style={{ flex: 1, fontSize: '0.825rem' }}
                    />
                    {formData.documentUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDocumentLink(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="ลบลิงก์นี้"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Status (2 Checkbox Options: อยู่ระหว่างดำเนินการ / ดำเนินการเสร็จสิ้น) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="input-label" style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>
                สถานะการแบ่งปันความรู้
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '10px',
                }}
              >
                {/* Option 1: อยู่ระหว่างดำเนินการ */}
                <label
                  onClick={() => setFormData((prev) => ({ ...prev, status: 'IN_PROGRESS' }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border:
                      formData.status === 'IN_PROGRESS' || formData.status === 'PENDING'
                        ? '2px solid #2563EB'
                        : '1.5px solid #E2E8F0',
                    background:
                      formData.status === 'IN_PROGRESS' || formData.status === 'PENDING'
                        ? '#EFF6FF'
                        : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow:
                      formData.status === 'IN_PROGRESS' || formData.status === 'PENDING'
                        ? '0 2px 8px rgba(37, 99, 235, 0.15)'
                        : 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.status === 'IN_PROGRESS' || formData.status === 'PENDING'}
                    onChange={() => setFormData((prev) => ({ ...prev, status: 'IN_PROGRESS' }))}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#2563EB',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color:
                          formData.status === 'IN_PROGRESS' || formData.status === 'PENDING'
                            ? '#1D4ED8'
                            : '#334155',
                      }}
                    >
                      🔄 อยู่ระหว่างดำเนินการ
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '2px' }}>
                      อยู่ระหว่างเตรียมสรุปหรือรอจัดแบ่งปัน
                    </div>
                  </div>
                </label>

                {/* Option 2: ดำเนินการเสร็จสิ้น */}
                <label
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      status: 'COMPLETED',
                      completedDate: prev.completedDate || new Date().toISOString().split('T')[0],
                    }))
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: formData.status === 'COMPLETED' ? '2px solid #059669' : '1.5px solid #E2E8F0',
                    background: formData.status === 'COMPLETED' ? '#ECFDF5' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow:
                      formData.status === 'COMPLETED' ? '0 2px 8px rgba(5, 150, 105, 0.15)' : 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.status === 'COMPLETED'}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        status: 'COMPLETED',
                        completedDate: prev.completedDate || new Date().toISOString().split('T')[0],
                      }))
                    }
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#059669',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color: formData.status === 'COMPLETED' ? '#065F46' : '#334155',
                      }}
                    >
                      ✅ ดำเนินการเสร็จสิ้น
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '2px' }}>
                      แบ่งปันความรู้และแนบเอกสารเรียบร้อย
                    </div>
                  </div>
                </label>
              </div>

              {/* Completed Date Picker (shown if status is COMPLETED) */}
              {formData.status === 'COMPLETED' && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.85rem 1rem',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={16} />
                    <span>วันที่ดำเนินการแบ่งปันเสร็จสิ้น:</span>
                  </div>
                  <div
                    onClick={() => setActiveDatePickerField('completedDate')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid #059669',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: '#065F46',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <span>
                      {formData.completedDate
                        ? formatDateDDMMYYYYBE(formData.completedDate)
                        : 'คลิกเพื่อระบุวันที่เสร็จสิ้น'}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 600 }}>✎ เปลี่ยน</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="input-group">
              <label className="input-label">หมายเหตุเพิ่มเติม</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="ระบุข้อสังเกตหรือรายละเอียดเพิ่มเติมเกี่ยวกับการอบรมหรือการติดตาม"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {/* Footer Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                paddingTop: '1rem',
                borderTop: '1px solid #E2E8F0',
                marginTop: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                }}
              >
                <Check size={16} />
                <span>{isEditing ? 'บันทึกการแก้ไข' : 'บันทึกรายการอบรม'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Date Picker Modal */}
      {activeDatePickerField && (
        <KMDatePickerModal
          isOpen={Boolean(activeDatePickerField)}
          onClose={() => setActiveDatePickerField(null)}
          title={
            activeDatePickerField === 'startDate'
              ? 'เลือกวันที่เริ่มการอบรม'
              : activeDatePickerField === 'endDate'
              ? 'เลือกวันที่สิ้นสุดการอบรม'
              : 'เลือกวันที่ดำเนินการเสร็จสิ้น'
          }
          initialDate={formData[activeDatePickerField] || ''}
          onSelectDate={(selectedDate) => {
            setFormData((prev) => ({
              ...prev,
              [activeDatePickerField]: selectedDate,
              // If start date changed and end date is before start date, sync end date
              ...(activeDatePickerField === 'startDate' && (!prev.endDate || prev.endDate < selectedDate)
                ? { endDate: selectedDate }
                : {}),
            }));
          }}
        />
      )}

      {/* Attendee Select Modal */}
      {isAttendeeModalOpen && (
        <KMAttendeeSelectModal
          isOpen={isAttendeeModalOpen}
          onClose={() => setIsAttendeeModalOpen(false)}
          personnelList={personnelList}
          executiveList={executiveList}
          initialSelected={formData.attendees}
          onConfirm={(selectedList) => {
            setFormData((prev) => ({ ...prev, attendees: selectedList }));
          }}
        />
      )}
    </>
  );
}
