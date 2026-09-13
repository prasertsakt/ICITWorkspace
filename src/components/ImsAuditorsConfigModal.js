'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Users,
  ShieldCheck,
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  Link2,
  ExternalLink,
} from 'lucide-react';

export default function ImsAuditorsConfigModal({
  isOpen,
  onClose,
  onSave,
  currentYear = '2569',
  yearlyConfig = null,
  personnelList = [],
}) {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [mrId, setMrId] = useState('');
  const [mrName, setMrName] = useState('');
  const [mrEmail, setMrEmail] = useState('');
  const [leadAuditorId, setLeadAuditorId] = useState('');
  const [leadAuditorName, setLeadAuditorName] = useState('');
  const [leadAuditorEmail, setLeadAuditorEmail] = useState('');
  const [dccId, setDccId] = useState('');
  const [dccName, setDccName] = useState('');
  const [dccEmail, setDccEmail] = useState('');
  const [appointmentOrderUrl, setAppointmentOrderUrl] = useState('');
  const [selectedAuditorIds, setSelectedAuditorIds] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (yearlyConfig) {
      setSelectedYear(yearlyConfig.year || currentYear);
      setMrId(yearlyConfig.mrId || '');
      setMrName(yearlyConfig.mrName || '');
      setMrEmail(yearlyConfig.mrEmail || '');
      setLeadAuditorId(yearlyConfig.leadAuditorId || '');
      setLeadAuditorName(yearlyConfig.leadAuditorName || '');
      setLeadAuditorEmail(yearlyConfig.leadAuditorEmail || '');
      setDccId(yearlyConfig.dccId || '');
      setDccName(yearlyConfig.dccName || '');
      setDccEmail(yearlyConfig.dccEmail || '');
      setAppointmentOrderUrl(yearlyConfig.appointmentOrderUrl || '');
      // Get auditor IDs
      const ids =
        yearlyConfig.auditorIds ||
        (yearlyConfig.auditors ? yearlyConfig.auditors.map((a) => a.id) : []);
      setSelectedAuditorIds(ids);
    } else {
      setSelectedYear(currentYear);
      setMrId('');
      setMrName('');
      setMrEmail('');
      setLeadAuditorId('');
      setLeadAuditorName('');
      setLeadAuditorEmail('');
      setDccId('');
      setDccName('');
      setDccEmail('');
      setAppointmentOrderUrl('');
      setSelectedAuditorIds([]);
    }
    setErrorMsg('');
  }, [yearlyConfig, currentYear, isOpen]);

  if (!isOpen) return null;

  const handleMrChange = (e) => {
    const personId = e.target.value;
    const person = personnelList.find((p) => p.id === personId);
    setMrId(personId);
    setMrName(person ? person.name : '');
    setMrEmail(person ? person.email : '');
  };

  const handleLeadChange = (e) => {
    const personId = e.target.value;
    const person = personnelList.find((p) => p.id === personId);
    setLeadAuditorId(personId);
    setLeadAuditorName(person ? person.name : '');
    setLeadAuditorEmail(person ? person.email : '');
  };

  const handleDccChange = (e) => {
    const personId = e.target.value;
    const person = personnelList.find((p) => p.id === personId);
    setDccId(personId);
    setDccName(person ? person.name : '');
    setDccEmail(person ? person.email : '');
  };

  const toggleAuditor = (personId) => {
    setSelectedAuditorIds((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!leadAuditorName && !leadAuditorId) {
      setErrorMsg('กรุณาระบุ Lead Internal Auditor ประจำปีงบประมาณ');
      return;
    }

    setIsSubmitting(true);
    try {
      // Map full auditor objects
      const auditors = personnelList
        .filter((p) => selectedAuditorIds.includes(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          department: p.department || '',
          position: p.position || '',
        }));

      await onSave(selectedYear, {
        year: selectedYear,
        mrId,
        mrName,
        mrEmail,
        leadAuditorId,
        leadAuditorName,
        leadAuditorEmail,
        dccId,
        dccName,
        dccEmail,
        appointmentOrderUrl: appointmentOrderUrl ? appointmentOrderUrl.trim() : '',
        auditorIds: selectedAuditorIds,
        auditors,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกรายชื่อผู้ตรวจ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPersonnel = personnelList.filter((p) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

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
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '1.25rem',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={22} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                กำหนดรายชื่อผู้ตรวจติดตามภายใน (Internal Auditors)
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#E0F2FE', margin: '2px 0 0 0' }}>
                กำหนดสิทธิ์เฉพาะบุคลากรที่ได้รับมอบหมายในการสร้างและประเมินรายงาน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row: ปีงบประมาณ / รอบตรวจ */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '0.35rem',
              }}
            >
              ปีงบประมาณ (Fiscal Year) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: '#F8FAFC',
              }}
            >
              <option value="2570">ปีงบประมาณ 2570</option>
              <option value="2569">ปีงบประมาณ 2569</option>
              <option value="2568">ปีงบประมาณ 2568</option>
            </select>
          </div>

          {/* Row: MR (Management Representative) */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              background: '#F5F3FF',
              border: '1.5px solid #DDD6FE',
              marginBottom: '1.25rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#5B21B6',
                marginBottom: '0.4rem',
              }}
            >
              <ShieldCheck size={18} color="#7C3AED" />
              <span>ตัวแทนฝ่ายบริหาร (MR - Management Representative)</span>
            </label>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#5B21B6' }}>
              ผู้มีอำนาจกำกับดูแลระบบบริหารงานคุณภาพ (IMS) สามารถ Sync ข้อมูล OFI และดูแลการดำเนินงาน
            </p>
            <select
              value={mrId}
              onChange={handleMrChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #7C3AED',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: '#FFFFFF',
                color: '#5B21B6',
              }}
            >
              <option value="">-- เลือกตัวแทนฝ่ายบริหาร (MR) --</option>
              {personnelList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.department ? `(${p.department})` : ''}
                </option>
              ))}
            </select>
            {!mrId && mrName && (
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                กำหนดไว้ปัจจุบัน: {mrName}
              </p>
            )}
          </div>

          {/* Row: Lead Internal Auditor */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              background: '#F0F9FF',
              border: '1.5px solid #BAE6FD',
              marginBottom: '1.25rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#0369A1',
                marginBottom: '0.4rem',
              }}
            >
              <ShieldCheck size={18} color="#0284C7" />
              <span>หัวหน้าทีมผู้ตรวจติดตาม (Lead Internal Auditor)</span>
              <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#0369A1' }}>
              มีอำนาจในการตรวจสอบและกด Approved แผนการตรวจติดตาม ก่อนให้เริ่มการตรวจจริง
            </p>
            <select
              value={leadAuditorId}
              onChange={handleLeadChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #0284C7',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: '#FFFFFF',
                color: '#0369A1',
              }}
              required
            >
              <option value="">-- เลือกหัวหน้าทีมผู้ตรวจ (Lead Auditor) --</option>
              {personnelList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.department ? `(${p.department})` : ''}
                </option>
              ))}
            </select>
            {!leadAuditorId && leadAuditorName && (
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                กำหนดไว้ปัจจุบัน: {leadAuditorName}
              </p>
            )}
          </div>

          {/* Row: DCC (ผู้ควบคุมเอกสาร) */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              background: '#F0FDF4',
              border: '1.5px solid #BBF7D0',
              marginBottom: '1.25rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#166534',
                marginBottom: '0.4rem',
              }}
            >
              <FileText size={18} color="#16A34A" />
              <span>ผู้ควบคุมเอกสาร (DCC - Document Control Center)</span>
            </label>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#166534' }}>
              มีสิทธิ์ในการแก้ไขและลบรายการรายงานการตรวจติดตามภายในทุกรายการในระบบ
            </p>
            <select
              value={dccId}
              onChange={handleDccChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #16A34A',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: '#FFFFFF',
                color: '#166534',
              }}
            >
              <option value="">-- เลือกผู้ควบคุมเอกสาร (DCC) จากรายชื่อบุคลากร --</option>
              {personnelList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.department ? `(${p.department})` : ''}
                </option>
              ))}
            </select>
            {!dccId && dccName && (
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                กำหนดไว้ปัจจุบัน: {dccName}
              </p>
            )}
          </div>

          {/* Row: ทีมผู้ตรวจติดตามภายใน (Internal Auditors) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#334155',
                }}
              >
                <UserCheck size={18} color="#0D9488" />
                <span>คณะผู้ตรวจติดตามภายใน (Internal Auditors ประจำปีงบประมาณ {selectedYear})</span>
              </label>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#E2E8F0',
                  color: '#475569',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                }}
              >
                เลือกแล้ว {selectedAuditorIds.length} ท่าน
              </span>
            </div>

            {/* Quick search input */}
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <Search
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '10px', top: '10px' }}
              />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือฝ่ายเพื่อเลือกผู้ตรวจ..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Personnel Multi-selection Checklist */}
            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                background: '#FAFAFA',
              }}
            >
              {filteredPersonnel.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                  ไม่พบบุคลากรที่ค้นหา
                </div>
              ) : (
                filteredPersonnel.map((p) => {
                  const isChecked = selectedAuditorIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      onClick={() => toggleAuditor(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        background: isChecked ? '#F0FDF4' : '#FFFFFF',
                        border: `1px solid ${isChecked ? '#86EFAC' : '#E2E8F0'}`,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by label onClick
                        style={{ width: '16px', height: '16px', accentColor: '#16A34A' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {p.department || 'ไม่ระบุฝ่าย'} • {p.position || 'บุคลากร'}
                        </div>
                      </div>
                      {isChecked && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#16A34A',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={14} /> ผู้ตรวจ
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Row: ลิงก์คำสั่งแต่งตั้งคณะผู้ตรวจติดตาม (Google Drive Shared Link) (Optional) */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.4rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#334155',
                }}
              >
                <Link2 size={18} color="#0284C7" />
                <span>ลิงก์คำสั่งแต่งตั้ง (Google Drive Shared Link)</span>
                <span style={{ fontSize: '0.775rem', fontWeight: 500, color: '#64748B' }}>
                  (ไม่บังคับ / Optional)
                </span>
              </label>
              {appointmentOrderUrl && (
                <a
                  href={appointmentOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#0284C7',
                    textDecoration: 'none',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#E0F2FE',
                    border: '1px solid #BAE6FD',
                  }}
                >
                  <ExternalLink size={12} />
                  <span>ทดสอบเปิดลิงก์</span>
                </a>
              )}
            </div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748B' }}>
              แชร์ลิงก์ไฟล์คำสั่งแต่งตั้งคณะผู้ตรวจติดตามประจำปีงบประมาณ เช่น ลิงก์ PDF ใน Google Drive เพื่อให้ผู้ใช้งานสามารถคลิกเปิดดูเอกสารคำสั่งฉบับเต็มได้
            </p>
            <div style={{ position: 'relative' }}>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/... หรือ ลิงก์คำสั่งแต่งตั้ง"
                value={appointmentOrderUrl}
                onChange={(e) => setAppointmentOrderUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  background: '#FFFFFF',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.75rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)',
              }}
            >
              <Save size={16} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการกำหนดผู้ตรวจ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
