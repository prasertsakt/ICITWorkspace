'use client';

import React, { useState, useEffect } from 'react';
import {
  PREDEFINED_DEPARTMENTS,
  PERSONNEL_TYPES,
  POSITIONS,
  POSITION_LEVELS,
  PERSONNEL_STATUS,
  USER_ROLES,
} from '@/lib/constants';
import { isValidBuddhistDate, formatThaiDisplayDate } from '@/lib/dateUtils';
import { sanitizeText, sanitizeUrl, sanitizeEmail } from '@/lib/securityUtils';
import { X, Check, AlertCircle, User, Calendar, Shield, Mail } from 'lucide-react';

export default function PersonnelModal({ isOpen, onClose, onSave, personnelToEdit }) {
  const isEditing = Boolean(personnelToEdit);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    personnelType: PERSONNEL_TYPES[0],
    department: PREDEFINED_DEPARTMENTS[0],
    position: POSITIONS[0],
    level: POSITION_LEVELS[0],
    appointmentDate: '',
    retirementDate: '',
    status: PERSONNEL_STATUS.ACTIVE,
    role: USER_ROLES.USER,
    note: '',
    avatarUrl: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (personnelToEdit) {
      setFormData({
        name: personnelToEdit.name || '',
        email: personnelToEdit.email || '',
        personnelType: personnelToEdit.personnelType || PERSONNEL_TYPES[0],
        department: personnelToEdit.department || PREDEFINED_DEPARTMENTS[0],
        position: personnelToEdit.position || POSITIONS[0],
        level: personnelToEdit.level || POSITION_LEVELS[0],
        appointmentDate: personnelToEdit.appointmentDate || '',
        retirementDate: personnelToEdit.retirementDate || '',
        status: personnelToEdit.status || PERSONNEL_STATUS.ACTIVE,
        role: personnelToEdit.role || USER_ROLES.USER,
        note: personnelToEdit.note || '',
        avatarUrl: personnelToEdit.avatarUrl || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        personnelType: PERSONNEL_TYPES[0],
        department: PREDEFINED_DEPARTMENTS[0],
        position: POSITIONS[0],
        level: POSITION_LEVELS[0],
        appointmentDate: '01-10-2565',
        retirementDate: '30-09-2595',
        status: PERSONNEL_STATUS.ACTIVE,
        role: USER_ROLES.USER,
        note: '',
        avatarUrl: '',
      });
    }
    setErrors({});
  }, [personnelToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'กรุณาระบุชื่อ-นามสกุล';
    if (!formData.email.trim()) {
      errs.email = 'กรุณาระบุอีเมล';
    } else if (!formData.email.includes('@')) {
      errs.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (!formData.appointmentDate.trim()) {
      errs.appointmentDate = 'กรุณาระบุวันที่บรรจุ';
    } else if (!isValidBuddhistDate(formData.appointmentDate.trim())) {
      errs.appointmentDate = 'รูปแบบต้องเป็น DD-MM-YYYY (พ.ศ.) เช่น 01-10-2565';
    }

    if (!formData.retirementDate.trim()) {
      errs.retirementDate = 'กรุณาระบุวันที่เกษียณ';
    } else if (!isValidBuddhistDate(formData.retirementDate.trim())) {
      errs.retirementDate = 'รูปแบบต้องเป็น DD-MM-YYYY (พ.ศ.) เช่น 30-09-2595';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      id: isEditing ? personnelToEdit.id : `pers-${Date.now()}`,
      name: sanitizeText(formData.name),
      email: sanitizeEmail(formData.email),
      note: sanitizeText(formData.note),
      avatarUrl: sanitizeUrl(formData.avatarUrl),
      appointmentDate: sanitizeText(formData.appointmentDate),
      retirementDate: sanitizeText(formData.retirementDate),
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>
                {isEditing ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรใหม่'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                กำหนดสิทธิ์การเข้าใช้งาน Google และข้อมูลตำแหน่งงาน
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Grid 2: Name & Email */}
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">
                  ชื่อ-นามสกุล <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น นายสมชาย ใจดี"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.name}
                  </span>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">
                  อีเมล (สำหรับ Google Login Whitelist) <span className="required">*</span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="เช่น somchai@icit.org"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.email}
                  </span>
                ) : (
                  <span className="input-hint">ใช้ตรวจสอบสิทธิ์เมื่อล็อกอินด้วย Google</span>
                )}
              </div>
            </div>

            {/* Grid 2: Department & Personnel Type */}
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">
                  ฝ่ายในองค์กร <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  {PREDEFINED_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">
                  ประเภทบุคลากร <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.personnelType}
                  onChange={(e) => setFormData({ ...formData, personnelType: e.target.value })}
                >
                  {PERSONNEL_TYPES.map((ptype) => (
                    <option key={ptype} value={ptype}>
                      {ptype}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid 2: Position & Level */}
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">
                  ตำแหน่งงาน <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">
                  ระดับตำแหน่ง <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                >
                  {POSITION_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid 2: Dates (DD-MM-YYYY Buddhist Era) */}
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">
                  วันที่บรรจุ (DD-MM-YYYY พ.ศ.) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="01-10-2565"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                />
                {errors.appointmentDate ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.appointmentDate}
                  </span>
                ) : (
                  <span className="input-hint">
                    {isValidBuddhistDate(formData.appointmentDate)
                      ? `🗓️ ${formatThaiDisplayDate(formData.appointmentDate)}`
                      : 'ระบุเป็น วัน-เดือน-ปี พ.ศ. เช่น 01-10-2565'}
                  </span>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">
                  วันที่เกษียณ (DD-MM-YYYY พ.ศ.) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="30-09-2595"
                  value={formData.retirementDate}
                  onChange={(e) => setFormData({ ...formData, retirementDate: e.target.value })}
                />
                {errors.retirementDate ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.retirementDate}
                  </span>
                ) : (
                  <span className="input-hint">
                    {isValidBuddhistDate(formData.retirementDate)
                      ? `🗓️ ${formatThaiDisplayDate(formData.retirementDate)}`
                      : 'ระบุเป็น วัน-เดือน-ปี พ.ศ. เช่น 30-09-2595'}
                  </span>
                )}
              </div>
            </div>

            {/* Grid 2: Status & Role */}
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">
                  สถานะการปฏิบัติงาน <span className="required">*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.9rem',
                      borderRadius: 'var(--radius-md)',
                      background: formData.status === PERSONNEL_STATUS.ACTIVE ? 'var(--mint-50)' : '#F8FAFC',
                      border: formData.status === PERSONNEL_STATUS.ACTIVE ? '1px solid var(--mint-500)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={PERSONNEL_STATUS.ACTIVE}
                      checked={formData.status === PERSONNEL_STATUS.ACTIVE}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{ accentColor: 'var(--mint-500)' }}
                    />
                    <span>🟢 ปกติ (เข้าใช้งานได้)</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.9rem',
                      borderRadius: 'var(--radius-md)',
                      background: formData.status === PERSONNEL_STATUS.RESIGNED ? 'var(--rose-50)' : '#F8FAFC',
                      border: formData.status === PERSONNEL_STATUS.RESIGNED ? '1px solid var(--rose-500)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={PERSONNEL_STATUS.RESIGNED}
                      checked={formData.status === PERSONNEL_STATUS.RESIGNED}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{ accentColor: 'var(--rose-500)' }}
                    />
                    <span>🔴 ลาออก (บล็อกการเข้าใช้)</span>
                  </label>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  สิทธิ์การใช้งาน (Role) <span className="required">*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.9rem',
                      borderRadius: 'var(--radius-md)',
                      background: formData.role === USER_ROLES.USER ? 'var(--sky-50)' : '#F8FAFC',
                      border: formData.role === USER_ROLES.USER ? '1px solid var(--sky-500)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={USER_ROLES.USER}
                      checked={formData.role === USER_ROLES.USER}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      style={{ accentColor: 'var(--sky-500)' }}
                    />
                    <span>👤 บุคลากร (USER)</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.9rem',
                      borderRadius: 'var(--radius-md)',
                      background: formData.role === USER_ROLES.ADMIN ? 'var(--primary-50)' : '#F8FAFC',
                      border: formData.role === USER_ROLES.ADMIN ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={USER_ROLES.ADMIN}
                      checked={formData.role === USER_ROLES.ADMIN}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      style={{ accentColor: 'var(--primary-500)' }}
                    />
                    <span>🛡️ ผู้ดูแลระบบ (Admin)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Avatar URL & Note */}
            <div className="input-group">
              <label className="input-label">URL รูปถ่ายบุคลากร (ไม่บังคับ)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/photo.jpg"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">หมายเหตุ</label>
              <textarea
                rows={2}
                className="form-textarea"
                placeholder="ระบุหมายเหตุหรือหน้าที่ความรับผิดชอบพิเศษ (ถ้ามี)"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Check size={16} />
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มบุคลากร'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
