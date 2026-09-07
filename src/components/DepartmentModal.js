'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Building2, User, Award } from 'lucide-react';

export default function DepartmentModal({
  isOpen,
  onClose,
  onSave,
  departmentToEdit,
  personnelList = [],
  executiveList = [],
}) {
  const [formData, setFormData] = useState({
    name: '',
    headPersonnelId: '',
    supervisingExecutiveId: '',
    description: '',
  });

  useEffect(() => {
    if (departmentToEdit) {
      setFormData({
        name: departmentToEdit.name || '',
        headPersonnelId: departmentToEdit.headPersonnelId || '',
        supervisingExecutiveId: departmentToEdit.supervisingExecutiveId || '',
        description: departmentToEdit.description || '',
      });
    }
  }, [departmentToEdit, isOpen]);

  if (!isOpen || !departmentToEdit) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...departmentToEdit,
      headPersonnelId: formData.headPersonnelId,
      supervisingExecutiveId: formData.supervisingExecutiveId,
      description: formData.description,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--sky-50)',
                color: 'var(--sky-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>กำหนดโครงสร้าง: {formData.name}</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                ระบุหัวหน้าฝ่ายและผู้บริหารที่กำกับดูแล
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Department Name Display */}
            <div className="input-group">
              <label className="input-label">ชื่อฝ่ายในองค์กร</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                disabled
                style={{ background: '#F1F5F9', color: '#334155', fontWeight: 600 }}
              />
            </div>

            {/* Head of Department */}
            <div className="input-group">
              <label className="input-label">
                หัวหน้าฝ่าย (เลือกจากบุคลากร)
              </label>
              <select
                className="form-select"
                value={formData.headPersonnelId}
                onChange={(e) => setFormData({ ...formData, headPersonnelId: e.target.value })}
              >
                <option value="">-- ยังไม่ได้ระบุ --</option>
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.position} - {p.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Supervising Executive */}
            <div className="input-group">
              <label className="input-label">
                ผู้บริหารที่กำกับดูแลฝ่าย (เลือกจากฝ่ายบริหาร)
              </label>
              <select
                className="form-select"
                value={formData.supervisingExecutiveId}
                onChange={(e) => setFormData({ ...formData, supervisingExecutiveId: e.target.value })}
              >
                <option value="">-- ยังไม่ได้ระบุ --</option>
                {executiveList.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.position})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="input-group">
              <label className="input-label">ภารกิจและหน้าที่รับผิดชอบของฝ่าย</label>
              <textarea
                rows={3}
                className="form-textarea"
                placeholder="ระบุภารกิจหลักของฝ่าย..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Check size={16} />
              <span>บันทึกโครงสร้างฝ่าย</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
