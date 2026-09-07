'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Award, AlertCircle } from 'lucide-react';

export default function ExecutiveModal({ isOpen, onClose, onSave, executiveToEdit }) {
  const isEditing = Boolean(executiveToEdit);

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    avatarUrl: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (executiveToEdit) {
      setFormData({
        name: executiveToEdit.name || '',
        position: executiveToEdit.position || '',
        avatarUrl: executiveToEdit.avatarUrl || '',
      });
    } else {
      setFormData({
        name: '',
        position: '',
        avatarUrl: '',
      });
    }
    setErrors({});
  }, [executiveToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'กรุณาระบุชื่อ-นามสกุลผู้บริหาร';
    if (!formData.position.trim()) errs.position = 'กรุณาระบุตำแหน่งผู้บริหาร';
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
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
                โครงสร้างฝ่ายบริหาร
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">
                ชื่อ-นามสกุล <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น ผศ.ดร.ประสิทธิ์ เจริญสุข"
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
                ตำแหน่งผู้บริหาร <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น ผู้อำนวยการสำนัก, รองผู้อำนวยการ"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
              {errors.position && (
                <span style={{ fontSize: '0.75rem', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.position}
                </span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">URL รูปถ่าย (ไม่บังคับ)</label>
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
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มผู้บริหาร'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
