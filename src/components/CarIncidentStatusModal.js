'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  CAR_INCIDENT_STATUS,
  CAR_INCIDENT_STATUS_INFO,
  updateCarIncidentStatus,
} from '../lib/carIncidentService';

export default function CarIncidentStatusModal({
  isOpen,
  onClose,
  record,
  currentUser,
  currentPersonnel,
  yearlyConfig,
  isAdmin,
  onStatusUpdated,
}) {
  const [selectedStatus, setSelectedStatus] = useState(
    record?.status || CAR_INCIDENT_STATUS.NOT_YET_APPROVED
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedStatus === record.status && !reason.trim()) {
      setErrorMsg('กรุณาเลือกสถานะใหม่ หรือระบุหมายเหตุการเปลี่ยนแปลง');
      return;
    }

    setIsSubmitting(true);
    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'เจ้าหน้าที่',
        email: currentUser?.email || currentPersonnel?.email || '',
      };

      const updated = await updateCarIncidentStatus(
        record.id,
        selectedStatus,
        reason,
        actor,
        yearlyConfig,
        isAdmin
      );

      if (onStatusUpdated) onStatusUpdated(updated);
      onClose();
    } catch (err) {
      console.error('Update status error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการปรับเปลี่ยนสถานะ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    {
      value: CAR_INCIDENT_STATUS.NOT_YET_APPROVED,
      label: 'รอดำเนินการ (Not Yet Approved)',
      desc: 'เอกสารอยู่ในสถานะร่างหรือรอจัดทำแนวทางแก้ไขเบื้องต้น',
      icon: <Clock size={18} color="#D97706" />,
      color: '#D97706',
      bg: '#FEF3C7',
    },
    {
      value: CAR_INCIDENT_STATUS.ON_PROGRESS,
      label: 'กำลังดำเนินการ (On Progress)',
      desc: 'อนุมัติแนวทางและเริ่มปฏิบัติตามแผนงาน Corrective Actions',
      icon: <CheckCircle2 size={18} color="#2563EB" />,
      color: '#2563EB',
      bg: '#EFF6FF',
    },
    {
      value: CAR_INCIDENT_STATUS.CLOSED,
      label: 'ปิดสมบูรณ์ (Closed)',
      desc: 'แก้ไข/ป้องกันปัญหาได้อย่างมีประสิทธิภาพ สิ้นสุดกระบวนการ (ไม่สามารถลบได้)',
      icon: <ShieldCheck size={18} color="#059669" />,
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      value: CAR_INCIDENT_STATUS.CANCELLED,
      label: 'ยกเลิก (Cancelled)',
      desc: 'ยกเลิกคำขอหรือเอกสารไม่ถูกต้องตามเกณฑ์',
      icon: <Ban size={18} color="#DC2626" />,
      color: '#DC2626',
      bg: '#FEF2F2',
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                จัดการสถานะเอกสาร
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#CCFBF1' }}>
                {record.docNumber} ({record.docType}) &bull; ปีงบประมาณ {record.fiscalYear}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {errorMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '1.25rem',
              }}
            >
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '0.65rem',
              }}
            >
              เลือกสถานะที่ต้องการปรับเปลี่ยน:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {statusOptions.map((opt) => {
                const isSelected = selectedStatus === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setSelectedStatus(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? opt.color : '#E2E8F0'}`,
                      background: isSelected ? opt.bg : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>{opt.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: isSelected ? opt.color : '#1E293B',
                        }}
                      >
                        {opt.label}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '2px' }}>
                        {opt.desc}
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="car_status"
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => setSelectedStatus(opt.value)}
                      style={{ marginTop: '4px', cursor: 'pointer', accentColor: opt.color }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '0.4rem',
              }}
            >
              หมายเหตุ / เหตุผลในการปรับเปลี่ยนสถานะ:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุข้อความประกอบการอนุมัติหรือปรับสถานะ เช่น อนุมัติแนวทางแก้ไขให้เริ่มปฏิบัติงาน..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              disabled={isSubmitting}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                color: '#FFFFFF',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                padding: '0.5rem 1.25rem',
              }}
            >
              <Send size={15} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกสถานะ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
