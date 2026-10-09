'use client';

import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Calendar,
  AlertTriangle,
  Save,
  X,
  Check,
  Building2,
  Briefcase,
  Layers,
  Clock,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import {
  DEFAULT_LEAVE_LIMIT_CONFIG,
  saveLeaveLimitConfig,
} from '@/lib/leaveLimitService';
import { LEAVE_TYPES, LEAVE_TYPE_CONFIG } from '@/lib/constants';

function MetricInputField({
  label,
  value,
  onChange,
  unit,
  min = 1,
  max = 365,
  step = 1,
  benchmark,
  accentColor = '#F97316',
  placeholder = '0',
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.825rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        <span>{label}</span>
      </label>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-card, #FFFFFF)',
          border: isFocused ? `1.5px solid ${accentColor}` : '1.5px solid var(--border-color, #E2E8F0)',
          borderRadius: '10px',
          boxShadow: isFocused ? `0 0 0 3px ${accentColor}25` : '0 1px 2px rgba(0,0,0,0.03)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required
          style={{
            flex: 1,
            minWidth: 0,
            padding: '0.65rem 0.85rem',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '1.05rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
          }}
        />
        {unit && (
          <div
            style={{
              padding: '0.45rem 0.85rem',
              background: isFocused ? `${accentColor}15` : 'var(--bg-secondary, #F8FAFC)',
              borderLeft: '1px solid var(--border-color, #E2E8F0)',
              color: isFocused ? accentColor : 'var(--text-secondary)',
              fontSize: '0.785rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              transition: 'all 0.2s',
            }}
          >
            {unit}
          </div>
        )}
      </div>

      {benchmark && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.725rem',
            color: 'var(--text-secondary)',
            marginTop: '2px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: accentColor,
              display: 'inline-block',
              opacity: 0.8,
            }}
          />
          <span>{benchmark}</span>
        </div>
      )}
    </div>
  );
}

export default function LeaveLimitConfigModal({
  isOpen,
  onClose,
  currentConfig = null,
  currentUser = null,
  onSaved = null,
}) {
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_LEAVE_LIMIT_CONFIG,
    ...(currentConfig || {}),
  }));

  const [activeTab, setActiveTab] = useState('university'); // 'university' | 'special' | 'cycles' | 'types'
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && currentConfig) {
      setFormData({
        ...DEFAULT_LEAVE_LIMIT_CONFIG,
        ...currentConfig,
        universityStaffLimits: {
          ...DEFAULT_LEAVE_LIMIT_CONFIG.universityStaffLimits,
          ...(currentConfig.universityStaffLimits || {}),
        },
        specialStaffLimits: {
          ...DEFAULT_LEAVE_LIMIT_CONFIG.specialStaffLimits,
          ...(currentConfig.specialStaffLimits || {}),
        },
        customCycle: {
          ...DEFAULT_LEAVE_LIMIT_CONFIG.customCycle,
          ...(currentConfig.customCycle || {}),
        },
      });
      setError(null);
      setSaveSuccess(false);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleUniversityChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      universityStaffLimits: {
        ...prev.universityStaffLimits,
        [field]: Number(value) >= 0 ? Number(value) : 0,
      },
    }));
  };

  const handleSpecialChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      specialStaffLimits: {
        ...prev.specialStaffLimits,
        [field]: Number(value) >= 0 ? Number(value) : 0,
      },
    }));
  };

  const handleToggleLeaveType = (type) => {
    setFormData((prev) => {
      const current = prev.includedLeaveTypes || LEAVE_TYPES;
      if (current.includes(type)) {
        // Must keep at least 1 type
        if (current.length === 1) return prev;
        return {
          ...prev,
          includedLeaveTypes: current.filter((t) => t !== type),
        };
      } else {
        return {
          ...prev,
          includedLeaveTypes: [...current, type],
        };
      }
    });
  };

  const handleSelectAllLeaveTypes = () => {
    setFormData((prev) => ({
      ...prev,
      includedLeaveTypes: [...LEAVE_TYPES],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await saveLeaveLimitConfig(formData, currentUser);
      if (res.success) {
        setSaveSuccess(true);
        if (onSaved) onSaved(res.config);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setError(res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
            padding: '1.25rem 1.5rem',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
              }}
            >
              <SlidersHorizontal size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                  ตั้งค่าเกณฑ์จำกัดการลา & รอบการคำนวณ
                </h3>
                <span
                  style={{
                    background: 'rgba(249, 115, 22, 0.25)',
                    color: '#FED7AA',
                    border: '1px solid rgba(249, 115, 22, 0.5)',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                  }}
                >
                  Admin Only
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                กำหนดเพดานจำนวนวัน/ครั้ง/รายการ แยกตามประเภทบุคลากร และตั้งค่าแจ้งเตือนเมื่อใกล้เกินเกณฑ์
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-close"
            type="button"
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            padding: '0.5rem 1rem 0',
            borderBottom: '1px solid var(--border-color)',
            gap: '0.5rem',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('university')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.65rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'university' ? '3px solid #F97316' : '3px solid transparent',
              background: activeTab === 'university' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'university' ? '#EA580C' : 'var(--text-secondary)',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Building2 size={16} />
            <span>1. พนักงานมหาวิทยาลัย</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('special')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.65rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'special' ? '3px solid #8B5CF6' : '3px solid transparent',
              background: activeTab === 'special' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'special' ? '#7C3AED' : 'var(--text-secondary)',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Briefcase size={16} />
            <span>2. พนักงานพิเศษ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cycles')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.65rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'cycles' ? '3px solid #2563EB' : '3px solid transparent',
              background: activeTab === 'cycles' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'cycles' ? '#2563EB' : 'var(--text-secondary)',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Calendar size={16} />
            <span>3. รอบช่วงเวลา & เกณฑ์เตือน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('types')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.65rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'types' ? '3px solid #10B981' : '3px solid transparent',
              background: activeTab === 'types' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'types' ? '#059669' : 'var(--text-secondary)',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Layers size={16} />
            <span>4. ประเภทการลาที่นับรวม</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div
            className="modal-body"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 'var(--radius-md)',
                  color: '#DC2626',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            {saveSuccess && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: '#ECFDF5',
                  border: '1px solid #6EE7B7',
                  borderRadius: 'var(--radius-md)',
                  color: '#059669',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} />
                <span>บันทึกการตั้งค่าเกณฑ์จำกัดการลาเรียบร้อยแล้ว</span>
              </div>
            )}

            {/* TAB 1: พนักงานมหาวิทยาลัย */}
            {activeTab === 'university' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div
                  style={{
                    padding: '0.85rem 1.1rem',
                    background: '#FFF7ED',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid #F97316',
                    borderRight: '1px solid #FFEDD5',
                    borderTop: '1px solid #FFEDD5',
                    borderBottom: '1px solid #FFEDD5',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <Building2 size={20} color="#EA580C" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.825rem', color: '#9A3412', lineHeight: 1.5 }}>
                    <strong>เกณฑ์จำกัดการลา: พนักงานมหาวิทยาลัย (University Employee)</strong>
                    <br />
                    กำหนดเพดานสำหรับการประเมินแต่ละรอบ (6 เดือน) และเพดานสะสมตลอดทั้งปีงบประมาณ (12 เดือน)
                  </div>
                </div>

                {/* Section A: เพดานต่อรอบประเมิน (6 เดือน) */}
                <div
                  className="card-glass"
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.15rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: '#FFF7ED',
                        color: '#EA580C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Clock size={16} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        เพดานต่อรอบการประเมิน (6 เดือน / รอบที่ 1 หรือ รอบที่ 2)
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        คำนวณและประเมินผลแยกรายรอบ 6 เดือน
                      </span>
                    </div>
                  </div>

                  <div className="grid-3" style={{ gap: '1.25rem' }}>
                    <MetricInputField
                      label="จำนวนวันลาสูงสุด"
                      value={formData.universityStaffLimits.roundMaxDays}
                      onChange={(val) => handleUniversityChange('roundMaxDays', val)}
                      unit="วัน / รอบ"
                      min={1}
                      max={180}
                      step={0.5}
                      benchmark="ค่ามาตรฐาน: 15 วัน / รอบ"
                      accentColor="#F97316"
                    />

                    <MetricInputField
                      label="จำนวนครั้งการลาสูงสุด"
                      value={formData.universityStaffLimits.roundMaxTimes}
                      onChange={(val) => handleUniversityChange('roundMaxTimes', val)}
                      unit="ครั้ง / รอบ"
                      min={1}
                      max={100}
                      benchmark="ค่ามาตรฐาน: 6 ครั้ง / รอบ"
                      accentColor="#F97316"
                    />

                    <MetricInputField
                      label="จำนวนการทำรายการสูงสุด"
                      value={formData.universityStaffLimits.roundMaxTransactions}
                      onChange={(val) => handleUniversityChange('roundMaxTransactions', val)}
                      unit="รายการ / รอบ"
                      min={1}
                      max={100}
                      benchmark="ค่ามาตรฐาน: 6 รายการ / รอบ"
                      accentColor="#F97316"
                    />
                  </div>
                </div>

                {/* Section B: เพดานสะสมทั้งปีงบประมาณ (12 เดือน) */}
                <div
                  className="card-glass"
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.15rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Calendar size={16} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        เพดานสะสมตลอดปีงบประมาณ (12 เดือน)
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        คำนวณสะสมยอดรวมตลอดปีงบประมาณ 1 ต.ค. - 30 ก.ย.
                      </span>
                    </div>
                  </div>

                  <div className="grid-3" style={{ gap: '1.25rem' }}>
                    <MetricInputField
                      label="จำนวนวันลาสูงสุดทั้งปี"
                      value={formData.universityStaffLimits.fullYearMaxDays}
                      onChange={(val) => handleUniversityChange('fullYearMaxDays', val)}
                      unit="วัน / ปี"
                      min={1}
                      max={365}
                      step={0.5}
                      benchmark="ค่ามาตรฐาน: 23 วัน / ปี"
                      accentColor="#2563EB"
                    />

                    <MetricInputField
                      label="จำนวนครั้งการลาสูงสุดทั้งปี"
                      value={formData.universityStaffLimits.fullYearMaxTimes}
                      onChange={(val) => handleUniversityChange('fullYearMaxTimes', val)}
                      unit="ครั้ง / ปี"
                      min={1}
                      max={200}
                      benchmark="ค่ามาตรฐาน: 10 ครั้ง / ปี"
                      accentColor="#2563EB"
                    />

                    <MetricInputField
                      label="จำนวนการทำรายการสูงสุดทั้งปี"
                      value={formData.universityStaffLimits.fullYearMaxTransactions}
                      onChange={(val) => handleUniversityChange('fullYearMaxTransactions', val)}
                      unit="รายการ / ปี"
                      min={1}
                      max={200}
                      benchmark="ค่ามาตรฐาน: 10 รายการ / ปี"
                      accentColor="#2563EB"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: พนักงานพิเศษ */}
            {activeTab === 'special' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div
                  style={{
                    padding: '0.85rem 1.1rem',
                    background: '#F5F3FF',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid #8B5CF6',
                    borderRight: '1px solid #EDE9FE',
                    borderTop: '1px solid #EDE9FE',
                    borderBottom: '1px solid #EDE9FE',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <Briefcase size={20} color="#7C3AED" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.825rem', color: '#5B21B6', lineHeight: 1.5 }}>
                    <strong>เกณฑ์จำกัดการลา: พนักงานพิเศษ (Special Employee)</strong>
                    <br />
                    กำหนดเพดานวันลา/ครั้ง/รายการ สำหรับลูกจ้างชั่วคราวและพนักงานจ้างเหมาบริการตามรอบการประเมิน
                  </div>
                </div>

                {/* Section A: เพดานต่อรอบประเมิน (6 เดือน) */}
                <div
                  className="card-glass"
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.15rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: '#F5F3FF',
                        color: '#7C3AED',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Clock size={16} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        เพดานต่อรอบการประเมิน (6 เดือน / รอบที่ 1 หรือ รอบที่ 2)
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        คำนวณและประเมินผลแยกรายรอบ 6 เดือน
                      </span>
                    </div>
                  </div>

                  <div className="grid-3" style={{ gap: '1.25rem' }}>
                    <MetricInputField
                      label="จำนวนวันลาสูงสุด"
                      value={formData.specialStaffLimits.roundMaxDays}
                      onChange={(val) => handleSpecialChange('roundMaxDays', val)}
                      unit="วัน / รอบ"
                      min={1}
                      max={180}
                      step={0.5}
                      benchmark="ค่ามาตรฐาน: 8 วัน / รอบ"
                      accentColor="#8B5CF6"
                    />

                    <MetricInputField
                      label="จำนวนครั้งการลาสูงสุด"
                      value={formData.specialStaffLimits.roundMaxTimes}
                      onChange={(val) => handleSpecialChange('roundMaxTimes', val)}
                      unit="ครั้ง / รอบ"
                      min={1}
                      max={100}
                      benchmark="ค่ามาตรฐาน: 4 ครั้ง / รอบ"
                      accentColor="#8B5CF6"
                    />

                    <MetricInputField
                      label="จำนวนการทำรายการสูงสุด"
                      value={formData.specialStaffLimits.roundMaxTransactions}
                      onChange={(val) => handleSpecialChange('roundMaxTransactions', val)}
                      unit="รายการ / รอบ"
                      min={1}
                      max={100}
                      benchmark="ค่ามาตรฐาน: 4 รายการ / รอบ"
                      accentColor="#8B5CF6"
                    />
                  </div>
                </div>

                {/* Section B: เพดานสะสมทั้งปีงบประมาณ (12 เดือน) */}
                <div
                  className="card-glass"
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.15rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: '#F5F3FF',
                        color: '#7C3AED',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Calendar size={16} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        เพดานสะสมตลอดปีงบประมาณ (12 เดือน)
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        คำนวณสะสมยอดรวมตลอดปีงบประมาณ 1 ต.ค. - 30 ก.ย.
                      </span>
                    </div>
                  </div>

                  <div className="grid-3" style={{ gap: '1.25rem' }}>
                    <MetricInputField
                      label="จำนวนวันลาสูงสุดทั้งปี"
                      value={formData.specialStaffLimits.fullYearMaxDays}
                      onChange={(val) => handleSpecialChange('fullYearMaxDays', val)}
                      unit="วัน / ปี"
                      min={1}
                      max={365}
                      step={0.5}
                      benchmark="ค่ามาตรฐาน: 15 วัน / ปี"
                      accentColor="#7C3AED"
                    />

                    <MetricInputField
                      label="จำนวนครั้งการลาสูงสุดทั้งปี"
                      value={formData.specialStaffLimits.fullYearMaxTimes}
                      onChange={(val) => handleSpecialChange('fullYearMaxTimes', val)}
                      unit="ครั้ง / ปี"
                      min={1}
                      max={200}
                      benchmark="ค่ามาตรฐาน: 8 ครั้ง / ปี"
                      accentColor="#7C3AED"
                    />

                    <MetricInputField
                      label="จำนวนการทำรายการสูงสุดทั้งปี"
                      value={formData.specialStaffLimits.fullYearMaxTransactions}
                      onChange={(val) => handleSpecialChange('fullYearMaxTransactions', val)}
                      unit="รายการ / ปี"
                      min={1}
                      max={200}
                      benchmark="ค่ามาตรฐาน: 8 รายการ / ปี"
                      accentColor="#7C3AED"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: รอบช่วงเวลา & เกณฑ์เตือน */}
            {activeTab === 'cycles' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Mode Selection */}
                <div
                  className="card-glass"
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                  }}
                >
                  <label className="form-label" style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    รูปแบบรอบของช่วงการคิดคำนวณ (Calculation Cycle Mode)
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '0.85rem 1.15rem',
                        borderRadius: '10px',
                        background: formData.cycleMode === 'ROUND_2_PERIODS' ? '#FFF7ED' : 'var(--bg-secondary)',
                        border: formData.cycleMode === 'ROUND_2_PERIODS' ? '2px solid #F97316' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="cycleMode"
                        value="ROUND_2_PERIODS"
                        checked={formData.cycleMode === 'ROUND_2_PERIODS'}
                        onChange={(e) => setFormData({ ...formData, cycleMode: e.target.value })}
                        style={{ accentColor: '#F97316', width: '17px', height: '17px' }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          รอบการประเมิน 2 รอบ (6 เดือน/รอบ) - มาตรฐานมหาวิทยาลัย
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                          • รอบที่ 1: 1 ต.ค. - 31 มี.ค. &nbsp;|&nbsp; • รอบที่ 2: 1 เม.ย. - 30 ก.ย. (ระบบจะสลับรอบและคำนวณอัตโนมัติตามช่วงเวลา)
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '0.85rem 1.15rem',
                        borderRadius: '10px',
                        background: formData.cycleMode === 'FULL_YEAR' ? '#EFF6FF' : 'var(--bg-secondary)',
                        border: formData.cycleMode === 'FULL_YEAR' ? '2px solid #2563EB' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="cycleMode"
                        value="FULL_YEAR"
                        checked={formData.cycleMode === 'FULL_YEAR'}
                        onChange={(e) => setFormData({ ...formData, cycleMode: e.target.value })}
                        style={{ accentColor: '#2563EB', width: '17px', height: '17px' }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          ตลอดทั้งปีงบประมาณ (Full Fiscal Year: 1 ต.ค. - 30 ก.ย.)
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                          คำนวณสะสมยอดการลาต่อเนื่องทั้ง 12 เดือนของปีงบประมาณ
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '0.85rem 1.15rem',
                        borderRadius: '10px',
                        background: formData.cycleMode === 'CUSTOM' ? '#F5F3FF' : 'var(--bg-secondary)',
                        border: formData.cycleMode === 'CUSTOM' ? '2px solid #8B5CF6' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="cycleMode"
                        value="CUSTOM"
                        checked={formData.cycleMode === 'CUSTOM'}
                        onChange={(e) => setFormData({ ...formData, cycleMode: e.target.value })}
                        style={{ accentColor: '#8B5CF6', width: '17px', height: '17px' }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          กำหนดช่วงวันที่เอง (Custom Date Range)
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                          ระบุช่วงวันที่เริ่มต้นและสิ้นสุดเฉพาะกิจ
                        </div>
                      </div>
                    </label>
                  </div>

                  {formData.cycleMode === 'CUSTOM' && (
                    <div
                      style={{
                        marginTop: '1.25rem',
                        padding: '1.15rem',
                        background: '#F8FAFC',
                        borderRadius: '10px',
                        border: '1.5px dashed #CBD5E1',
                      }}
                    >
                      <div className="grid-2" style={{ gap: '1rem' }}>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            วันที่เริ่มต้นรอบ
                          </label>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              background: 'var(--bg-card, #FFFFFF)',
                              border: '1.5px solid var(--border-color, #E2E8F0)',
                              borderRadius: '10px',
                              padding: '0 0.85rem',
                              gap: '8px',
                            }}
                          >
                            <CalendarDays size={16} color="#8B5CF6" />
                            <input
                              type="date"
                              value={formData.customCycle?.startDate || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  customCycle: {
                                    ...formData.customCycle,
                                    startDate: e.target.value,
                                  },
                                })
                              }
                              required={formData.cycleMode === 'CUSTOM'}
                              style={{
                                flex: 1,
                                padding: '0.65rem 0.25rem',
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                fontFamily: 'inherit',
                              }}
                            />
                          </div>
                        </div>

                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            วันที่สิ้นสุดรอบ
                          </label>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              background: 'var(--bg-card, #FFFFFF)',
                              border: '1.5px solid var(--border-color, #E2E8F0)',
                              borderRadius: '10px',
                              padding: '0 0.85rem',
                              gap: '8px',
                            }}
                          >
                            <CalendarDays size={16} color="#8B5CF6" />
                            <input
                              type="date"
                              value={formData.customCycle?.endDate || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  customCycle: {
                                    ...formData.customCycle,
                                    endDate: e.target.value,
                                  },
                                })
                              }
                              required={formData.cycleMode === 'CUSTOM'}
                              style={{
                                flex: 1,
                                padding: '0.65rem 0.25rem',
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                fontFamily: 'inherit',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Warning Threshold Percentage */}
                <div
                  className="card-glass"
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: '#FFF7ED',
                          color: '#EA580C',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AlertTriangle size={16} />
                      </div>
                      <label className="form-label" style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem' }}>
                        เกณฑ์เปอร์เซ็นต์การแจ้งเตือน &quot;ใกล้เกินเกณฑ์&quot;
                      </label>
                    </div>
                    <span
                      style={{
                        background: '#FFF7ED',
                        color: '#EA580C',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        padding: '4px 14px',
                        borderRadius: '999px',
                        border: '1.5px solid #FDBA74',
                        boxShadow: '0 2px 6px rgba(249, 115, 22, 0.15)',
                      }}
                    >
                      {formData.warningThresholdPercent}%
                    </span>
                  </div>

                  <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', marginBottom: '1.15rem', lineHeight: 1.5 }}>
                    เมื่อการใช้วันลา จำนวนครั้ง หรือจำนวนรายการ ของบุคลากรรายใดแตะถึงเกณฑ์นี้ (เช่น ถึง 80% ของเพดาน) ระบบจะแสดงสถานะ <strong>⚠️ ใกล้เกินเกณฑ์</strong> และขึ้นเตือนบน Dashboard ทันที
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      step="5"
                      value={formData.warningThresholdPercent}
                      onChange={(e) => setFormData({ ...formData, warningThresholdPercent: Number(e.target.value) })}
                      style={{ flex: 1, accentColor: '#F97316', height: '6px', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                      {[70, 75, 80, 85, 90].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData({ ...formData, warningThresholdPercent: val })}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.785rem',
                            fontWeight: 700,
                            borderRadius: '8px',
                            border: formData.warningThresholdPercent === val ? '1.5px solid #EA580C' : '1px solid var(--border-color)',
                            background: formData.warningThresholdPercent === val ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' : 'var(--bg-secondary)',
                            color: formData.warningThresholdPercent === val ? '#FFFFFF' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: formData.warningThresholdPercent === val ? '0 2px 8px rgba(249, 115, 22, 0.3)' : 'none',
                          }}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ประเภทการลาที่นับรวม */}
            {activeTab === 'types' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div
                  style={{
                    padding: '0.85rem 1.1rem',
                    background: '#F0FDF4',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: '4px solid #10B981',
                    borderRight: '1px solid #DCFCE7',
                    borderTop: '1px solid #DCFCE7',
                    borderBottom: '1px solid #DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ fontSize: '0.825rem', color: '#065F46', lineHeight: 1.5 }}>
                    <strong>กำหนดประเภทการลาที่นำมาคำนวณในภาพรวม</strong>
                    <br />
                    เลือกประเภทการลาที่ต้องการให้นับรวมเข้าสู่เพดานวันลา/ครั้ง/รายการ
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllLeaveTypes}
                    className="btn"
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.785rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    เลือกทั้งหมด
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {LEAVE_TYPES.map((type) => {
                    const conf = LEAVE_TYPE_CONFIG[type] || {};
                    const isChecked = (formData.includedLeaveTypes || LEAVE_TYPES).includes(type);

                    return (
                      <div
                        key={type}
                        onClick={() => handleToggleLeaveType(type)}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          background: isChecked ? (conf.bg || '#F3F4F6') : 'var(--bg-secondary)',
                          border: isChecked ? `2px solid ${conf.border || '#D1D5DB'}` : '1px dashed var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          opacity: isChecked ? 1 : 0.65,
                          boxShadow: isChecked ? '0 2px 6px rgba(0,0,0,0.04)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: conf.color || '#6B7280',
                            }}
                          />
                          <span style={{ fontSize: '0.875rem', fontWeight: isChecked ? 700 : 500, color: isChecked ? (conf.color || 'var(--text-primary)') : 'var(--text-muted)' }}>
                            {type}
                          </span>
                        </div>
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            background: isChecked ? (conf.color || '#3B82F6') : 'transparent',
                            border: isChecked ? 'none' : '1.5px solid var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isChecked && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            className="modal-footer"
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              {formData.updatedAt ? `ปรับปรุงล่าสุดเมื่อ: ${new Date(formData.updatedAt).toLocaleString('th-TH')}` : 'ใช้ค่าเริ่มต้นของระบบ'}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isSaving}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary"
                style={{
                  padding: '0.6rem 1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  color: '#FFFFFF',
                }}
              >
                <Save size={16} />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
