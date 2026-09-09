'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Calendar, Bell, Save, X, AlertCircle } from 'lucide-react';
import { saveJDConfig } from '@/lib/jdService';

export default function JDConfigModal({ isOpen, onClose, currentConfig, onSaved }) {
  const [formData, setFormData] = useState({
    isOpen: false,
    startDate: '',
    endDate: '',
    announcement: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentConfig) {
      setFormData({
        isOpen: currentConfig.isOpen ?? currentConfig.isRevisionOpen ?? false,
        startDate: currentConfig.startDate || '',
        endDate: currentConfig.endDate || '',
        announcement: currentConfig.announcement || '',
      });
    }
  }, [currentConfig, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const res = await saveJDConfig(formData);
      if (res.success) {
        if (onSaved) onSaved(res.config || formData);
        onClose();
      } else {
        setError(res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ background: 'var(--peach-50)', borderBottom: '1px solid var(--peach-100)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--peach-500)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ตั้งค่าช่วงเวลาแก้ไข Job Description
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                กำหนดช่วงเวลาที่บุคลากรสามารถแก้ไข/ยืนยัน JD ประจำปีได้
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-close" type="button">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {error && (
              <div
                style={{
                  padding: '0.75rem',
                  background: 'var(--rose-50)',
                  border: '1px solid var(--rose-100)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--rose-500)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Toggle Status */}
            <div
              style={{
                padding: '1rem',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  สถานะเปิดรับการแก้ไข
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  เปิดให้บุคลากรเข้ามารีวิวและแก้ไข JD ของตนเอง
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.isOpen}
                  onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--peach-500)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: formData.isOpen ? 'var(--mint-600)' : 'var(--text-muted)' }}>
                  {formData.isOpen ? 'เปิดใช้งาน' : 'ปิดการแก้ไข'}
                </span>
              </label>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <Calendar size={14} style={{ color: 'var(--peach-500)' }} />
                  <span>วันที่เริ่มต้น</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <Calendar size={14} style={{ color: 'var(--peach-500)' }} />
                  <span>วันที่สิ้นสุด</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            {/* Announcement textarea */}
            <div>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <Bell size={14} style={{ color: 'var(--peach-500)' }} />
                <span>ข้อความประกาศ / คำแนะนำ</span>
              </label>
              <textarea
                rows={3}
                value={formData.announcement}
                onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
                placeholder="เช่น เปิดให้ทบทวนและยืนยันแบบบรรยายลักษณะงาน (Job Description) ประจำปีงบประมาณ 2568 ถึงวันที่ 30 กันยายนนี้"
                className="form-textarea"
              />
            </div>

            {/* Hint alert */}
            <div
              style={{
                padding: '0.75rem',
                background: 'var(--peach-50)',
                border: '1px solid var(--peach-100)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--peach-text)',
                fontSize: '0.75rem',
                lineHeight: 1.5,
              }}
            >
              💡 <strong>คำแนะนำ:</strong> เมื่อเปิดใช้งานและอยู่ในช่วงเวลา บุคลากรจะสามารถเปิดแก้ไข JD ของตนเองได้ แต่ผู้ดูแลระบบ (Admin) จะสามารถแก้ไขหรือลบ JD ได้ตลอดเวลา
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              disabled={isSaving}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary btn-sm"
              style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
            >
              <Save size={14} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
