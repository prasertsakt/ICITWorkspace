'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  FileText,
  ShieldCheck,
  CheckSquare,
  Clock,
  Sparkles,
  Info,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';
import {
  IMS_AUDIT_TOPICS,
  IMS_STANDARDS,
  IMS_RESULT_TYPES,
  IMS_AUDIT_STATUSES,
} from '@/lib/constants';
import { subscribeYearlyAuditors } from '@/lib/imsService';

export default function ImsAuditModal({
  isOpen,
  onClose,
  onSave,
  auditData = null,
  personnelList = [],
  currentYear = '2569',
  yearlyConfig = null,
  isLeadAuditor = false,
  isAdmin = false,
}) {
  const [formData, setFormData] = useState({
    auditYear: currentYear,
    isoStandard: 'IMS 9001/27001',
    auditDate: new Date().toISOString().split('T')[0],
    auditors: [{ id: '', name: '', email: '', department: '' }],
    auditees: [{ id: '', name: '', department: '' }],
    topic: IMS_AUDIT_TOPICS[0] || '',
    item: '',
    clauses: '',
    expectedEvidence: '',
    findings: '',
    recommendation: '',
    result: 'C',
    status: 'PENDING_LEAD_APPROVAL',
  });

  const [activeYearConfig, setActiveYearConfig] = useState(yearlyConfig || null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to yearly assigned auditors config whenever auditYear changes
  useEffect(() => {
    if (isOpen) {
      const targetYr = formData.auditYear || currentYear;
      const unsub = subscribeYearlyAuditors(targetYr, (cfg) => {
        if (cfg) setActiveYearConfig(cfg);
      });
      return () => unsub && unsub();
    }
  }, [formData.auditYear, currentYear, isOpen]);

  // Predefined list of committee auditors for this fiscal year
  const committeeList = useMemo(() => {
    const list = [];
    const cfg = activeYearConfig || yearlyConfig;

    // 1. Lead Internal Auditor
    if (cfg?.leadAuditorName) {
      list.push({
        id: cfg.leadAuditorId || `lead_${cfg.leadAuditorName}`,
        name: cfg.leadAuditorName,
        email: cfg.leadAuditorEmail || '',
        department: '',
        role: 'Lead Internal Auditor',
      });
    }

    // 2. Appointed Committee Auditors
    if (Array.isArray(cfg?.auditors)) {
      cfg.auditors.forEach((aud) => {
        if (aud.name && !list.some((x) => x.name === aud.name || (aud.id && x.id === aud.id))) {
          list.push({
            id: aud.id || aud.name,
            name: aud.name,
            email: aud.email || '',
            department: aud.department || '',
            role: 'ผู้ตรวจติดตาม',
          });
        }
      });
    }

    return list;
  }, [activeYearConfig, yearlyConfig]);

  useEffect(() => {
    if (auditData) {
      // 1. Parse Auditees
      const existingAuditees =
        Array.isArray(auditData.auditees) && auditData.auditees.length > 0
          ? auditData.auditees
          : auditData.auditee1Name
          ? [
              {
                id: auditData.auditee1Id || '',
                name: auditData.auditee1Name || '',
                department: auditData.auditeeDepartment || '',
              },
            ]
          : [{ id: '', name: '', department: '' }];

      // 2. Parse Auditors (supports both new array and legacy auditor1 / auditor2 fields)
      let existingAuditors = [];
      if (Array.isArray(auditData.auditors) && auditData.auditors.length > 0) {
        existingAuditors = auditData.auditors.map((a) => ({
          id: a.id || '',
          name: a.name || '',
          email: a.email || '',
          department: a.department || '',
        }));
      } else {
        existingAuditors = [];
        if (auditData.auditor1Name || auditData.auditor1Id) {
          existingAuditors.push({
            id: auditData.auditor1Id || '',
            name: auditData.auditor1Name || '',
            email: auditData.auditor1Email || '',
            department: auditData.auditor1Department || '',
          });
        }
        if (auditData.hasSecondAuditor && (auditData.auditor2Name || auditData.auditor2Id)) {
          existingAuditors.push({
            id: auditData.auditor2Id || '',
            name: auditData.auditor2Name || '',
            email: auditData.auditor2Email || '',
            department: auditData.auditor2Department || '',
          });
        }
        if (existingAuditors.length === 0) {
          existingAuditors = [{ id: '', name: '', email: '', department: '' }];
        }
      }

      setFormData({
        auditYear: auditData.auditYear || currentYear,
        isoStandard: auditData.isoStandard || 'IMS 9001/27001',
        auditDate: auditData.auditDate || new Date().toISOString().split('T')[0],
        auditors: existingAuditors,
        auditees: existingAuditees,
        topic: auditData.topic || IMS_AUDIT_TOPICS[0],
        item: auditData.item || '',
        clauses: auditData.clauses || '',
        expectedEvidence: auditData.expectedEvidence || '',
        findings: auditData.findings || '',
        recommendation: auditData.recommendation || '',
        result: auditData.result || 'C',
        status: auditData.status || 'PENDING_LEAD_APPROVAL',
      });
    } else {
      // Default new audit
      setFormData({
        auditYear: currentYear,
        isoStandard: 'IMS 9001/27001',
        auditDate: new Date().toISOString().split('T')[0],
        auditors: [{ id: '', name: '', email: '', department: '' }],
        auditees: [{ id: '', name: '', department: '' }],
        topic: IMS_AUDIT_TOPICS[0] || '',
        item: '',
        clauses: '',
        expectedEvidence: '',
        findings: '',
        recommendation: '',
        result: 'C',
        status: 'PENDING_LEAD_APPROVAL',
      });
    }
    setErrorMsg('');
  }, [auditData, currentYear, isOpen]);

  if (!isOpen) return null;

  // Auditor handlers
  const handleAddAuditor = () => {
    setFormData((prev) => ({
      ...prev,
      auditors: [...(prev.auditors || []), { id: '', name: '', email: '', department: '' }],
    }));
  };

  const handleRemoveAuditor = (idx) => {
    setFormData((prev) => {
      const next = (prev.auditors || []).filter((_, i) => i !== idx);
      return {
        ...prev,
        auditors: next.length > 0 ? next : [{ id: '', name: '', email: '', department: '' }],
      };
    });
  };

  const handleAuditorSelect = (idx, selectedKey) => {
    if (!selectedKey) {
      setFormData((prev) => {
        const next = [...(prev.auditors || [])];
        next[idx] = { id: '', name: '', email: '', department: '' };
        return { ...prev, auditors: next };
      });
      return;
    }

    const pool = committeeList.length > 0 ? committeeList : personnelList;
    const person = pool.find((p) => p.id === selectedKey || p.name === selectedKey);

    setFormData((prev) => {
      const next = [...(prev.auditors || [])];
      next[idx] = {
        id: person?.id || '',
        name: person?.name || selectedKey,
        email: person?.email || '',
        department: person?.department || '',
      };
      return { ...prev, auditors: next };
    });
  };

  // Auditee handlers
  const handleAddAuditee = () => {
    setFormData((prev) => ({
      ...prev,
      auditees: [...prev.auditees, { id: '', name: '', department: '' }],
    }));
  };

  const handleRemoveAuditee = (idx) => {
    setFormData((prev) => {
      const next = prev.auditees.filter((_, i) => i !== idx);
      return {
        ...prev,
        auditees: next.length > 0 ? next : [{ id: '', name: '', department: '' }],
      };
    });
  };

  const handleAuditeeSelectPersonnel = (idx, personId) => {
    const person = personnelList.find((p) => p.id === personId);
    setFormData((prev) => {
      const next = [...prev.auditees];
      next[idx] = {
        ...next[idx],
        id: personId,
        name: person ? person.name : '',
        department: person ? (person.department || next[idx].department) : next[idx].department,
      };
      return { ...prev, auditees: next };
    });
  };

  const handleAuditeeFieldChange = (idx, field, value) => {
    setFormData((prev) => {
      const next = [...prev.auditees];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, auditees: next };
    });
  };

  const isApproved =
    auditData?.approvedByLeadIA ||
    auditData?.status === 'READY_FOR_AUDIT' ||
    auditData?.status === 'COMPLETED';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.auditYear) {
      setErrorMsg('กรุณาระบุปีที่ตรวจ');
      return;
    }
    if (!formData.auditDate) {
      setErrorMsg('กรุณาระบุวันที่ทำการตรวจติดตาม');
      return;
    }

    const validAuditors = (formData.auditors || []).filter((a) => a.name && a.name.trim());
    if (validAuditors.length === 0) {
      setErrorMsg('กรุณาเลือกผู้ตรวจติดตามภายในอย่างน้อย 1 ท่าน จากคณะผู้ตรวจฯ');
      return;
    }

    const validAuditees = (formData.auditees || []).filter((a) => a.name && a.name.trim());
    if (validAuditees.length === 0) {
      setErrorMsg('กรุณาระบุผู้รับการตรวจอย่างน้อย 1 ท่าน');
      return;
    }

    if (!formData.topic) {
      setErrorMsg('กรุณาเลือกหัวข้อที่รับการตรวจ');
      return;
    }
    if (!formData.item.trim()) {
      setErrorMsg('กรุณาระบุรายละเอียดข้อตรวจ (Item)');
      return;
    }
    if (!formData.clauses.trim()) {
      setErrorMsg('กรุณาระบุข้อกำหนด (Clauses)');
      return;
    }

    const isResubmitting = formData.status === 'RETURNED_FOR_REVISION';
    let newStatus = isResubmitting ? 'PENDING_LEAD_APPROVAL' : formData.status;

    // If report was approved and auditor entered findings, transition to COMPLETED
    if (isApproved && (formData.findings.trim() || formData.recommendation.trim())) {
      newStatus = 'COMPLETED';
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...(auditData || {}),
        ...formData,
        auditors: validAuditors,
        auditor1Id: validAuditors[0]?.id || '',
        auditor1Name: validAuditors[0]?.name || '',
        auditor1Email: validAuditors[0]?.email || '',
        auditor1Department: validAuditors[0]?.department || '',
        hasSecondAuditor: validAuditors.length > 1,
        auditor2Id: validAuditors[1]?.id || '',
        auditor2Name: validAuditors[1]?.name || '',
        auditor2Email: validAuditors[1]?.email || '',
        auditor2Department: validAuditors[1]?.department || '',
        auditees: validAuditees,
        auditee1Id: validAuditees[0]?.id || '',
        auditee1Name: validAuditees[0]?.name || '',
        auditeeDepartment: validAuditees[0]?.department || '',
        // If not yet approved by Lead IA, prevent entering findings into the record
        findings: isApproved ? formData.findings : '',
        recommendation: isApproved ? formData.recommendation : '',
        result: isApproved ? formData.result : '',
        status: newStatus,
        leadRevisionComment: isResubmitting ? '' : (auditData?.leadRevisionComment || ''),
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          maxWidth: '780px',
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
            background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={22} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                {auditData ? 'แก้ไขรายงานการตรวจติดตาม' : 'สร้างรายงานการตรวจติดตามภายใน'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#CCFBF1', margin: '2px 0 0 0' }}>
                ระบบตรวจติดตามคุณภาพและความมั่นคงปลอดภัยสารสนเทศ (IMS ISO 9001 / 27001)
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
              transition: 'background 0.2s',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
          {/* Revision Banner if returned for revision */}
          {auditData?.status === 'RETURNED_FOR_REVISION' && auditData?.leadRevisionComment && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                background: '#FEF2F2',
                border: '1.5px solid #FECACA',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#DC2626',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  marginBottom: '4px',
                }}
              >
                <AlertCircle size={18} />
                <span>ข้อคิดเห็นจาก Lead IA ที่ต้องปรับปรุงแก้ไข:</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#991B1B', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {auditData.leadRevisionComment}
              </p>
              <div style={{ fontSize: '0.775rem', color: '#B91C1C', marginTop: '6px' }}>
                * เมื่อบันทึกและส่งรายงานนี้ ระบบจะส่งอีเมลแจ้งเตือนไปยัง Lead IA เพื่อพิจารณาอนุมัติใหม่อีกครั้ง
              </div>
            </div>
          )}
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

          {/* Section 1: ข้อมูลทั่วไป (General Info) */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              {/* ปีที่ตรวจ */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  ปีงบประมาณ <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formData.auditYear}
                  onChange={(e) => setFormData({ ...formData, auditYear: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.925rem',
                    background: '#FFFFFF',
                  }}
                  required
                >
                  <option value="2570">ปีงบประมาณ 2570</option>
                  <option value="2569">ปีงบประมาณ 2569</option>
                  <option value="2568">ปีงบประมาณ 2568</option>
                </select>
              </div>

              {/* มาตรฐาน ISO */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  ISO <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={formData.isoStandard}
                  onChange={(e) => setFormData({ ...formData, isoStandard: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.925rem',
                    background: '#FFFFFF',
                  }}
                  required
                >
                  {IMS_STANDARDS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* วันที่ทำการตรวจติดตาม */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  วันที่ทำการตรวจติดตาม <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.auditDate}
                  onChange={(e) => setFormData({ ...formData, auditDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.925rem',
                    background: '#FFFFFF',
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: รายชื่อผู้ตรวจติดตาม (Internal Auditors - เพิ่มได้เหมือน Auditees) */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#0284C7',
                    margin: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: '4px',
                  }}
                >
                  รายชื่อผู้ตรวจติดตาม
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                  {committeeList.length > 0
                    ? `เลือกได้เฉพาะรายชื่อจากคณะผู้ตรวจติดตามประจำปีงบประมาณ ${formData.auditYear} (${committeeList.length} ท่าน)`
                    : `คณะผู้ตรวจติดตามประจำปีงบประมาณ ${formData.auditYear}`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddAuditor}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  color: '#0284C7',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={14} />
                <span>เพิ่มผู้ตรวจติดตาม</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(formData.auditors || []).map((auditor, idx) => {
                // Ensure previously saved auditor is selectable even if not in current config
                const pool = committeeList.length > 0 ? committeeList : personnelList;
                const options = [...pool];
                if (auditor.name && !options.some((o) => o.name === auditor.name)) {
                  options.unshift({
                    id: auditor.id || auditor.name,
                    name: auditor.name,
                    email: auditor.email || '',
                    department: auditor.department || '',
                    role: 'ที่บันทึกไว้เดิม',
                  });
                }

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '0.85rem',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155' }}>
                        ผู้ตรวจติดตามภายในคนที่ {idx + 1} {idx === 0 && <span style={{ color: '#EF4444' }}>*</span>}
                      </span>
                      {formData.auditors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAuditor(idx)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            border: 'none',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Trash2 size={12} />
                          <span>ลบ</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <select
                        value={auditor.id || auditor.name}
                        onChange={(e) => handleAuditorSelect(idx, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.925rem',
                          background: '#FFFFFF',
                          color: auditor.name ? '#0F172A' : '#64748B',
                          fontWeight: auditor.name ? 600 : 400,
                        }}
                        required={idx === 0}
                      >
                        <option value="">-- เลือกผู้ตรวจติดตาม --</option>
                        {options.map((opt) => (
                          <option key={opt.id || opt.name} value={opt.id || opt.name}>
                            🔴 {opt.role ? `[${opt.role}] ` : ''}{opt.name} {opt.department ? `(${opt.department})` : ''}
                          </option>
                        ))}
                      </select>

                      {auditor.name && (
                        <div
                          style={{
                            marginTop: '6px',
                            fontSize: '0.75rem',
                            color: '#0369A1',
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>👤 <strong>{auditor.name}</strong></span>
                          {auditor.department && <span>🏢 สังกัด: {auditor.department}</span>}
                          {auditor.email && <span>✉️ {auditor.email}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: รายชื่อผู้รับการตรวจ (Auditees - มีได้มากกว่า 1 คน) */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0284C7',
                  margin: 0,
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                }}
              >
                รายชื่อผู้รับการตรวจ (Auditees)
              </h3>
              <button
                type="button"
                onClick={handleAddAuditee}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  color: '#0284C7',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={14} />
                <span>เพิ่มผู้รับการตรวจ</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(formData.auditees || []).map((auditee, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155' }}>
                      ผู้รับการตรวจคนที่ {idx + 1} {idx === 0 && <span style={{ color: '#EF4444' }}>*</span>}
                    </span>
                    {formData.auditees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAuditee(idx)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          border: 'none',
                          background: '#FEE2E2',
                          color: '#DC2626',
                          borderRadius: '4px',
                          padding: '3px 7px',
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={12} />
                        <span>ลบ</span>
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#64748B',
                          marginBottom: '0.25rem',
                        }}
                      >
                        เลือกจากรายชื่อบุคลากร
                      </label>
                      <select
                        value={auditee.id || ''}
                        onChange={(e) => handleAuditeeSelectPersonnel(idx, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          background: '#FFFFFF',
                        }}
                      >
                        <option value="">-- เลือกจากบุคลากร หรือพิมพ์ชื่อด้านล่าง --</option>
                        {personnelList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.department || 'ไม่ระบุฝ่าย'})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="หรือพิมพ์ชื่อ-นามสกุล..."
                        value={auditee.name || ''}
                        onChange={(e) => handleAuditeeFieldChange(idx, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          marginTop: '6px',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem',
                          background: '#FFFFFF',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#64748B',
                          marginBottom: '0.25rem',
                        }}
                      >
                        ฝ่าย / หน่วยงานที่สังกัด
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ฝ่ายวิศวกรรมระบบเครือข่าย"
                        value={auditee.department || ''}
                        onChange={(e) => handleAuditeeFieldChange(idx, 'department', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.875rem',
                          background: '#FFFFFF',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: รายละเอียดการตรวจติดตาม (Audit Scope & Details) */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              border: '1px solid #E2E8F0',
            }}
          >
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#0284C7',
                margin: '0 0 1rem 0',
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
              }}
            >
              รายละเอียดการตรวจติดตาม
            </h3>

            {/* หัวข้อที่รับการตรวจ (Dropdown with the 23 items) */}
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                หัวข้อที่รับการตรวจ <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  border: '1.5px solid #0284C7',
                  fontSize: '0.925rem',
                  background: '#F0F9FF',
                  fontWeight: 600,
                  color: '#0369A1',
                }}
                required
              >
                {IMS_AUDIT_TOPICS.map((topic, idx) => (
                  <option key={idx} value={topic}>
                    {idx + 1}. {topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Item * */}
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                Item (หัวข้อย่อย / รายละเอียดการตรวจ) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น ตรวจสอบพื้นที่การทำงานของฝ่ายวิศวกรรมฯ - สอบถามการเข้าใช้งานเครื่องคอมพิวเตอร์ กรณีอยู่นอกสถานที่"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.925rem',
                  background: '#FFFFFF',
                }}
                required
              />
            </div>

            {/* Clauses * */}
            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                Clauses (ข้อกำหนดมาตรฐาน ISO) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น IS: A6.7, A7.9 หรือ ISO 9001: 7.5"
                value={formData.clauses}
                onChange={(e) => setFormData({ ...formData, clauses: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.925rem',
                  background: '#FFFFFF',
                }}
                required
              />
            </div>

            {/* Expected Evidence */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                Expected Evidence (หลักฐานที่คาดหวัง)
              </label>
              <textarea
                rows={3}
                placeholder="- โปรแกรมที่เข้าใช้งานมีความน่าเชื่อถือ&#10;- เจ้าของเครื่องควรเข้าถึงจากภายนอกได้เพียงผู้เดียว"
                value={formData.expectedEvidence}
                onChange={(e) => setFormData({ ...formData, expectedEvidence: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.925rem',
                  background: '#FFFFFF',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Section 5: การประเมินผลการตรวจ (Findings & Recommendation) */}
          {/* Locked until Lead Internal Auditor approves the audit plan */}
          <div
            style={{
              background: isApproved ? '#F0FDF4' : '#F8FAFC',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              marginBottom: '1rem',
              border: `1.5px solid ${isApproved ? '#86EFAC' : '#E2E8F0'}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: isApproved ? '1rem' : '0.5rem',
              }}
            >
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: isApproved ? '#15803D' : '#64748B',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckSquare size={18} />
                <span>บันทึกผลการตรวจติดตาม (Audit Findings & Result)</span>
              </h3>
              {isApproved ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#DCFCE7',
                    color: '#15803D',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={13} /> Approved by Lead IA (เปิดให้บันทึกผลตรวจ)
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#FEF3C7',
                    color: '#92400E',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  <Lock size={13} /> ล็อกการบันทึก
                </span>
              )}
            </div>

            {!isApproved ? (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '1.15rem 1.25rem',
                  background: '#FFFBEB',
                  border: '1.5px dashed #FDE68A',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Lock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#92400E', marginBottom: '2px' }}>
                    ส่วนนี้จะเปิดให้บันทึกได้หลังจาก Lead IA อนุมัติแล้วเท่านั้น
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#B45309', lineHeight: 1.5 }}>
                    ท่านสามารถบันทึกและส่งแผนการตรวจติดตาม (Scope, หัวข้อ, ข้อตรวจ, ข้อกำหนด) เพื่อให้ Lead Internal Auditor อนุมัติก่อน เมื่อได้รับการอนุมัติแล้ว จึงจะสามารถบันทึกสิ่งที่ตรวจพบ (Findings), ข้อเสนอแนะ (Recommendation) และผลการตรวจ (C / NC / OFI) ได้
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Findings */}
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Findings (สิ่งที่ตรวจพบ)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ระบุข้อเท็จจริง สิ่งที่พบในการตรวจติดตาม..."
                    value={formData.findings}
                    onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.925rem',
                      background: '#FFFFFF',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Recommendation */}
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Recommendation (ข้อเสนอแนะ)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ระบุข้อเสนอแนะเพื่อการปรับปรุง..."
                    value={formData.recommendation}
                    onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.925rem',
                      background: '#FFFFFF',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* ประเภทความไม่สอดคล้องที่พบ (C, NC, OFI) */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.5rem',
                    }}
                  >
                    ประเภทความไม่สอดคล้องที่พบ (Result Output)
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.75rem',
                    }}
                  >
                    {Object.values(IMS_RESULT_TYPES).map((res) => {
                      const isSelected = formData.result === res.code;
                      return (
                        <button
                          key={res.code}
                          type="button"
                          onClick={() => setFormData({ ...formData, result: res.code })}
                          style={{
                            padding: '0.75rem 0.5rem',
                            borderRadius: '10px',
                            border: `2px solid ${isSelected ? res.color : '#CBD5E1'}`,
                            background: isSelected ? res.bg : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '1.15rem',
                              fontWeight: 800,
                              color: res.color,
                            }}
                          >
                            {res.code}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: isSelected ? res.color : '#64748B',
                              textAlign: 'center',
                            }}
                          >
                            {res.code === 'C' ? 'Conformity' : res.code === 'NC' ? 'Non-Conformity' : 'OFI (Improvement)'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
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
                fontSize: '0.925rem',
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
                background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                color: '#FFFFFF',
                fontSize: '0.925rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(13, 148, 136, 0.3)',
              }}
            >
              <Save size={17} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายงาน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
