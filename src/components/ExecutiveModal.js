'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Award, AlertCircle, User, Building2 } from 'lucide-react';

export default function ExecutiveModal({
  isOpen,
  onClose,
  onSave,
  executiveToEdit,
  personnelList = [],
}) {
  const isEditing = Boolean(executiveToEdit);

  const [formData, setFormData] = useState({
    personnelId: '',
    name: '',
    position: '',
    avatarUrl: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (executiveToEdit) {
      setFormData({
        personnelId: executiveToEdit.personnelId || '',
        name: executiveToEdit.name || '',
        position: executiveToEdit.position || '',
        avatarUrl: executiveToEdit.avatarUrl || '',
      });
    } else {
      setFormData({
        personnelId: '',
        name: '',
        position: '',
        avatarUrl: '',
      });
    }
    setErrors({});
  }, [executiveToEdit, isOpen]);

  if (!isOpen) return null;

  // Separate personnel: those with position "ผู้บริหาร" vs others
  const execPersonnel = personnelList.filter((p) => p.position === 'ผู้บริหาร');
  const otherPersonnel = personnelList.filter((p) => p.position !== 'ผู้บริหาร');

  const handleSelectPersonnel = (personId) => {
    const person = personnelList.find((p) => p.id === personId);
    if (person) {
      setFormData((prev) => ({
        ...prev,
        personnelId: person.id,
        name: person.name,
        avatarUrl: person.avatarUrl || '',
      }));
      setErrors((prev) => ({ ...prev, personnelId: null, name: null }));
    } else {
      setFormData((prev) => ({
        ...prev,
        personnelId: '',
      }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'กรุณาเลือกบุคลากร';
    if (!formData.position.trim()) errs.position = 'กรุณาระบุตำแหน่งผู้บริหาร (เช่น ผู้อำนวยการสำนัก)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      id: isEditing ? executiveToEdit.id : `exec-${Date.now()}`,
    };

    onSave(payload);
    onClose();
  };

  const selectedPerson = personnelList.find((p) => p.id === formData.personnelId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--peach-50)',
                color: 'var(--peach-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>
                {isEditing ? 'แก้ไขข้อมูลผู้บริหาร' : 'เพิ่มผู้บริหารใหม่'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                เลือกจากรายชื่อบุคลากรเพื่อแต่งตั้งเป็นฝ่ายบริหาร
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Step 1: Select Personnel */}
            <div className="input-group">
              <label className="input-label">
                เลือกบุคลากร <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={formData.personnelId}
                onChange={(e) => handleSelectPersonnel(e.target.value)}
              >
                <option value="">-- กรุณาเลือกบุคลากรจากรายชื่อ --</option>

                {execPersonnel.length > 0 && (
                  <optgroup label="⭐ บุคลากรในตำแหน่ง 'ผู้บริหาร'">
                    {execPersonnel.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.department})
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="👤 บุคลากรทั้งหมดในองค์กร">
                  {otherPersonnel.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.department} ({p.position})
                    </option>
                  ))}
                </optgroup>
              </select>
              {errors.name && (
                <span style={{ fontSize: '0.75rem', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.name}
                </span>
              )}
            </div>

            {/* Selected Personnel Preview */}
            {selectedPerson && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--peach-50)',
                  border: '1px solid var(--peach-100)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {selectedPerson.avatarUrl ? (
                  <img
                    src={selectedPerson.avatarUrl}
                    alt=""
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'var(--peach-500)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {selectedPerson.name?.charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0, fontSize: '0.825rem' }}>
                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>
                    {selectedPerson.name}
                  </strong>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {selectedPerson.department} &bull; ตำแหน่ง: {selectedPerson.position}
                  </span>
                </div>
              </div>
            )}

            {/* Step 2: Executive Position Title */}
            <div className="input-group">
              <label className="input-label">
                ตำแหน่งผู้บริหารในโครงสร้าง <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น ผู้อำนวยการสำนัก, รองผู้อำนวยการฝ่ายวิชาการและวิจัย"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
              {errors.position ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.position}
                </span>
              ) : (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>ตัวอย่างคลิกด่วน:</span>
                  {[
                    'ผู้อำนวยการสำนัก',
                    'รองผู้อำนวยการฝ่ายวิชาการและวิจัย',
                    'รองผู้อำนวยการฝ่ายพัฒนาระบบและโครงสร้างพื้นฐาน',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, position: preset })}
                      style={{
                        background: '#F1F5F9',
                        border: 'none',
                        borderRadius: '99px',
                        padding: '0.15rem 0.5rem',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Avatar Override */}
            <div className="input-group">
              <label className="input-label">URL รูปถ่าย (ดึงอัตโนมัติจากบุคลากร หรือระบุใหม่)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/photo.jpg"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Check size={16} />
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'แต่งตั้งผู้บริหาร'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
