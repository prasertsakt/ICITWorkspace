'use client';

import React, { useState, useEffect } from 'react';
import { LEAVE_TYPES, LEAVE_TYPE_CONFIG } from '@/lib/constants';
import { sanitizeText } from '@/lib/securityUtils';
import { formatLocalDate, parseLocalDate } from '@/lib/dateUtils';
import {
  X,
  Check,
  Calendar,
  User,
  Clock,
  FileText,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function LeaveModal({
  isOpen,
  onClose,
  onSave,
  leaveToEdit,
  personnelList = [],
}) {
  const isEditing = Boolean(leaveToEdit);

  const [formData, setFormData] = useState({
    personnelId: '',
    leaveType: LEAVE_TYPES[1], // default 'ลาป่วย'
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [searchPerson, setSearchPerson] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (leaveToEdit) {
      setFormData({
        personnelId: leaveToEdit.personnelId || '',
        leaveType: leaveToEdit.leaveType || LEAVE_TYPES[1],
        startDate: leaveToEdit.startDate || '',
        endDate: leaveToEdit.endDate || '',
        reason: leaveToEdit.reason || '',
      });
    } else {
      const today = formatLocalDate(new Date());
      setFormData({
        personnelId: personnelList[0]?.id || '',
        leaveType: LEAVE_TYPES[1],
        startDate: today,
        endDate: today,
        reason: '',
      });
    }
    setErrors({});
    setSearchPerson('');
  }, [leaveToEdit, isOpen, personnelList]);

  if (!isOpen) return null;

  // Selected personnel details
  const selectedPerson = personnelList.find((p) => p.id === formData.personnelId);

  // Filtered personnel for dropdown
  const filteredPersonnel = personnelList.filter((p) => {
    if (!searchPerson.trim()) return true;
    const term = searchPerson.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.department?.toLowerCase().includes(term)
    );
  });

  // Calculate total days
  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 1;
    const start = parseLocalDate(formData.startDate);
    const end = parseLocalDate(formData.endDate);
    if (!start || !end || end < start) return 1;
    const diffTime = Math.abs(end - start);
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleStartDateChange = (val) => {
    setFormData((prev) => {
      const next = { ...prev, startDate: val };
      if (!prev.endDate || prev.endDate < val) {
        next.endDate = val;
      }
      return next;
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.personnelId) errs.personnelId = 'กรุณาเลือกบุคลากร';
    if (!formData.leaveType) errs.leaveType = 'กรุณาเลือกประเภทการลา';
    if (!formData.startDate) errs.startDate = 'กรุณาระบุวันที่เริ่มต้น';
    if (!formData.endDate) errs.endDate = 'กรุณาระบุวันที่สิ้นสุด';
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errs.endDate = 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const person = personnelList.find((p) => p.id === formData.personnelId);
    const totalDays = calculateDays();

    const payload = {
      id: isEditing ? leaveToEdit.id : `leave-${Date.now()}`,
      personnelId: formData.personnelId,
      personnelName: person?.name || 'ไม่ระบุชื่อ',
      personnelEmail: person?.email || '',
      department: person?.department || '',
      avatarUrl: person?.avatarUrl || '',
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      totalDays,
      reason: sanitizeText(formData.reason),
      updatedAt: new Date().toISOString(),
      createdAt: isEditing ? leaveToEdit.createdAt || new Date().toISOString() : new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                {isEditing ? 'แก้ไขรายการวันลา' : 'บันทึกรายการวันลาใหม่'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                บันทึกประวัติการลาป่วย ลากิจ ลาพักผ่อน หรือขาดการปฏิบัติงาน
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-close" type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* 1. เลือกบุคลากร */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>บุคลากรผู้ขอลา <span style={{ color: 'var(--rose-500)' }}>*</span></span>
              {selectedPerson && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  ฝ่าย: {selectedPerson.department}
                </span>
              )}
            </label>

            {personnelList.length > 8 && (
              <input
                type="text"
                className="form-input"
                placeholder="🔍 พิมพ์ค้นหาชื่อ หรืออีเมล..."
                value={searchPerson}
                onChange={(e) => setSearchPerson(e.target.value)}
                style={{ marginBottom: '0.4rem', fontSize: '0.8rem' }}
              />
            )}

            <select
              className={`form-input ${errors.personnelId ? 'input-error' : ''}`}
              value={formData.personnelId}
              onChange={(e) => setFormData({ ...formData, personnelId: e.target.value })}
            >
              <option value="">-- กรุณาเลือกบุคลากร --</option>
              {filteredPersonnel.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.department} - {p.position})
                </option>
              ))}
            </select>
            {errors.personnelId && (
              <span className="error-message">
                <AlertCircle size={12} /> {errors.personnelId}
              </span>
            )}

            {selectedPerson && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '0.5rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {selectedPerson.avatarUrl ? (
                  <img
                    src={selectedPerson.avatarUrl}
                    alt=""
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--primary-100)',
                      color: 'var(--primary-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {selectedPerson.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedPerson.name}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                    {selectedPerson.position} &bull; {selectedPerson.department}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. ประเภทการลา (7 ประเภท) */}
          <div className="form-group">
            <label className="form-label">
              ประเภทการลา <span style={{ color: 'var(--rose-500)' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.2rem' }}>
              {LEAVE_TYPES.map((type) => {
                const conf = LEAVE_TYPE_CONFIG[type] || {};
                const isSelected = formData.leaveType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, leaveType: type })}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected ? `2px solid ${conf.pillBg || '#6366F1'}` : '1px solid var(--border-subtle)',
                      background: isSelected ? (conf.bg || '#EEF2FF') : 'var(--bg-card)',
                      color: isSelected ? (conf.color || '#4F46E5') : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: conf.pillBg || '#6366F1',
                      }}
                    />
                    <span>{type}</span>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
            {errors.leaveType && (
              <span className="error-message">
                <AlertCircle size={12} /> {errors.leaveType}
              </span>
            )}
          </div>

          {/* 3. ช่วงวันที่ลา (วันเริ่มต้น - วันสิ้นสุด) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">
                วันที่เริ่มต้น <span style={{ color: 'var(--rose-500)' }}>*</span>
              </label>
              <input
                type="date"
                className={`form-input ${errors.startDate ? 'input-error' : ''}`}
                value={formData.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
              {errors.startDate && (
                <span className="error-message">
                  <AlertCircle size={12} /> {errors.startDate}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                วันที่สิ้นสุด <span style={{ color: 'var(--rose-500)' }}>*</span>
              </label>
              <input
                type="date"
                className={`form-input ${errors.endDate ? 'input-error' : ''}`}
                value={formData.endDate}
                min={formData.startDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              {errors.endDate && (
                <span className="error-message">
                  <AlertCircle size={12} /> {errors.endDate}
                </span>
              )}
            </div>
          </div>

          {/* สรุปจำนวนวัน */}
          <div
            style={{
              padding: '0.6rem 0.85rem',
              background: 'var(--primary-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              fontSize: '0.825rem',
              color: 'var(--primary-700)',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} />
              <span>ระยะเวลาการลาทั้งหมด:</span>
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary-600)' }}>
              {calculateDays()} วัน
            </span>
          </div>

          {/* 4. เหตุผล / หมายเหตุ */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">เหตุผลประกอบการลา / หมายเหตุ</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="ระบุเหตุผล เช่น พบแพทย์ตามนัด, ติดธุระส่วนตัวต่างจังหวัด, พักผ่อนประจำปี..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="modal-footer" style={{ marginTop: '1.25rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Check size={16} />
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'บันทึกรายการลา'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
