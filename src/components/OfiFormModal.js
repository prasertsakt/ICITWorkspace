'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Lightbulb,
  Building,
  Users,
  Search,
  Check,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PREDEFINED_DEPARTMENTS } from '@/lib/constants';
import { OFI_IMPLEMENT_OPTIONS, OFI_STATUS_OPTIONS } from '@/lib/ofiHubService';

const STANDARD_OPTIONS = [
  'ISO 9001:2015 & ISO/IEC 27001:2022',
  'ISO 9001:2015',
  'ISO/IEC 27001:2022',
  'อื่นๆ',
];

export default function OfiFormModal({
  isOpen,
  onClose,
  onSave,
  ofiItem = null,
  fiscalYear = '2569',
  personnelList = [],
  availableYears = ['2570', '2569', '2568'],
}) {
  const [selectedYear, setSelectedYear] = useState(fiscalYear);
  const [topic, setTopic] = useState('');
  const [standard, setStandard] = useState(STANDARD_OPTIONS[0]);
  const [customStandard, setCustomStandard] = useState('');
  const [clauses, setClauses] = useState('');
  const [findings, setFindings] = useState('');
  const [implement, setImplement] = useState('');
  const [status, setStatus] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState([]);
  const [remark, setRemark] = useState('');

  const [personnelSearch, setPersonnelSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEditing = Boolean(ofiItem && ofiItem.id);

  useEffect(() => {
    if (isOpen) {
      if (ofiItem) {
        setSelectedYear(ofiItem.fiscalYear || fiscalYear);
        setTopic(ofiItem.sourceAuditTopic || '');
        if (STANDARD_OPTIONS.includes(ofiItem.sourceStandard)) {
          setStandard(ofiItem.sourceStandard);
          setCustomStandard('');
        } else if (ofiItem.sourceStandard) {
          setStandard('อื่นๆ');
          setCustomStandard(ofiItem.sourceStandard);
        } else {
          setStandard(STANDARD_OPTIONS[0]);
          setCustomStandard('');
        }
        setClauses(ofiItem.sourceClauses || '');
        setFindings(ofiItem.sourceFindings || '');
        setImplement(ofiItem.implement || '');
        setStatus(ofiItem.status || '');
        setSelectedDepartments(ofiItem.departments || []);
        setSelectedAssigneeIds((ofiItem.assignees || []).map((a) => a.id));
        setRemark(ofiItem.remark || '');
      } else {
        // Reset for new creation
        setSelectedYear(fiscalYear);
        setTopic('');
        setStandard(STANDARD_OPTIONS[0]);
        setCustomStandard('');
        setClauses('');
        setFindings('');
        setImplement('');
        setStatus('');
        setSelectedDepartments([]);
        setSelectedAssigneeIds([]);
        setRemark('');
      }
      setPersonnelSearch('');
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, ofiItem, fiscalYear]);

  if (!isOpen) return null;

  const handleImplementChange = (val) => {
    setImplement(val);
    if (val === 'NO') {
      setStatus('');
    } else if (val === 'YES' && !status) {
      setStatus(OFI_STATUS_OPTIONS.ON_PROCESS);
    }
  };

  const toggleDepartment = (dept) => {
    setSelectedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const toggleAssignee = (personId) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!topic.trim()) {
      setErrorMsg('กรุณาระบุหัวข้อหรือประเด็นการตรวจ');
      return;
    }

    if (!findings.trim()) {
      setErrorMsg('กรุณาระบุข้อค้นพบหรือโอกาสในการพัฒนา');
      return;
    }

    setIsSubmitting(true);

    const now = new Date().toISOString();
    const finalStandard = standard === 'อื่นๆ' ? (customStandard.trim() || 'อื่นๆ') : standard;

    const assignees = personnelList
      .filter((p) => selectedAssigneeIds.includes(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email || '',
        department: p.department || '',
      }));

    const payload = {
      ...(ofiItem || {}),
      id: ofiItem?.id || `ofi-${selectedYear}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fiscalYear: String(selectedYear),
      sourceAuditTopic: topic.trim(),
      sourceStandard: finalStandard,
      sourceClauses: clauses.trim(),
      sourceFindings: findings.trim(),
      implement: implement || '',
      status: implement === 'YES' ? (status || OFI_STATUS_OPTIONS.ON_PROCESS) : '',
      departments: selectedDepartments,
      assignees: assignees,
      remark: remark.trim(),
      detailsHtml: ofiItem?.detailsHtml || '',
      createdAt: ofiItem?.createdAt || now,
      updatedAt: now,
    };

    try {
      await onSave(payload, isEditing);
      onClose();
    } catch (err) {
      console.error('Save OFI error:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
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
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(124, 58, 237, 0.3)',
              }}
            >
              <Lightbulb size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#4C1D95' }}>
                {isEditing ? 'แก้ไขรายการ OFI' : 'เพิ่มรายการ OFI ใหม่'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#7C3AED' }}>
                บันทึกโอกาสในการพัฒนา (Opportunity for Improvement) ประจำปีงบประมาณ {selectedYear}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE9FE')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1.5rem',
              background: '#FEF2F2',
              borderBottom: '1px solid #FECACA',
              color: '#991B1B',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              padding: '1.5rem 1.75rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Row 1: ปีงบประมาณ & มาตรฐาน */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  <Calendar size={15} color="#7C3AED" />
                  <span>ปีงบประมาณ</span>
                  <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    background: '#FFFFFF',
                    color: '#4C1D95',
                  }}
                  required
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  <Layers size={15} color="#7C3AED" />
                  <span>มาตรฐานที่เกี่ยวข้อง</span>
                </label>
                <select
                  value={standard}
                  onChange={(e) => setStandard(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    background: '#FFFFFF',
                    color: '#334155',
                  }}
                >
                  {STANDARD_OPTIONS.map((std) => (
                    <option key={std} value={std}>
                      {std}
                    </option>
                  ))}
                </select>
                {standard === 'อื่นๆ' && (
                  <input
                    type="text"
                    placeholder="ระบุชื่อมาตรฐาน..."
                    value={customStandard}
                    onChange={(e) => setCustomStandard(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      marginTop: '6px',
                      outline: 'none',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Row 2: หัวข้อการตรวจ / เรื่อง */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                <FileText size={15} color="#7C3AED" />
                <span>หัวข้อการตรวจ / ประเด็นโอกาสในการพัฒนา</span>
                <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น การสำรองข้อมูลสารสนเทศ, การจัดการเอกสารคุณภาพ"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
                required
              />
            </div>

            {/* Row 3: ข้อกำหนดที่เกี่ยวข้อง */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                <span>ข้อกำหนดที่เกี่ยวข้อง (Clauses)</span>
              </label>
              <input
                type="text"
                placeholder="เช่น 7.1.3, 8.5.1, A.8.1, A.12.1"
                value={clauses}
                onChange={(e) => setClauses(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Row 4: ข้อค้นพบ / โอกาสในการพัฒนา (Findings) */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                <Lightbulb size={15} color="#D97706" />
                <span>ข้อค้นพบ / โอกาสในการพัฒนา (Findings & Recommendations)</span>
                <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                rows={4}
                placeholder="อธิบายรายละเอียดข้อค้นพบ แนวทางที่ควรปรับปรุงหรือพัฒนา..."
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical',
                }}
                required
              />
            </div>

            {/* Row 5: ฝ่ายที่เกี่ยวข้อง (Multi-select) */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={15} color="#7C3AED" />
                  <span>ฝ่ายที่เกี่ยวข้อง ({selectedDepartments.length} ฝ่าย)</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>
                  เลือกได้มากกว่า 1 ฝ่าย
                </span>
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '6px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '0.65rem',
                  background: '#F8FAFC',
                }}
              >
                {PREDEFINED_DEPARTMENTS.map((dept) => {
                  const isChecked = selectedDepartments.includes(dept);
                  return (
                    <label
                      key={dept}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 8px',
                        borderRadius: '6px',
                        background: isChecked ? '#EDE9FE' : '#FFFFFF',
                        border: `1px solid ${isChecked ? '#C4B5FD' : '#E2E8F0'}`,
                        cursor: 'pointer',
                        fontSize: '0.825rem',
                        fontWeight: isChecked ? 700 : 500,
                        color: isChecked ? '#6D28D9' : '#334155',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDepartment(dept)}
                        style={{ accentColor: '#7C3AED' }}
                      />
                      <span>{dept}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Row 6: ผู้รับผิดชอบ (Multi-select) */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={15} color="#7C3AED" />
                  <span>ผู้รับผิดชอบดำเนินการ ({selectedAssigneeIds.length} ท่าน)</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>
                  เลือกได้มากกว่า 1 ท่าน (มีสิทธิ์กรอกรายละเอียด)
                </span>
              </label>

              {/* Personnel Search */}
              <div style={{ position: 'relative', marginBottom: '6px' }}>
                <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ หรือฝ่ายของบุคลากร..."
                  value={personnelSearch}
                  onChange={(e) => setPersonnelSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem 0.45rem 2rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.825rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Personnel List */}
              <div
                style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  background: '#F8FAFC',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {personnelList
                  .filter((p) => {
                    if (!personnelSearch.trim()) return true;
                    const q = personnelSearch.toLowerCase();
                    return (
                      (p.name || '').toLowerCase().includes(q) ||
                      (p.department || '').toLowerCase().includes(q) ||
                      (p.email || '').toLowerCase().includes(q)
                    );
                  })
                  .map((person) => {
                    const isChecked = selectedAssigneeIds.includes(person.id);
                    return (
                      <label
                        key={person.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: `1px solid ${isChecked ? '#C4B5FD' : '#E2E8F0'}`,
                          background: isChecked ? '#FAF5FF' : '#FFFFFF',
                          cursor: 'pointer',
                          fontSize: '0.825rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAssignee(person.id)}
                            style={{ accentColor: '#7C3AED' }}
                          />
                          <div>
                            <span style={{ fontWeight: 600, color: isChecked ? '#6D28D9' : '#1E293B' }}>
                              {person.name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '6px' }}>
                              ({person.department || 'ไม่ระบุฝ่าย'})
                            </span>
                          </div>
                        </div>
                        {isChecked && <Check size={14} color="#7C3AED" />}
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* Row 7: Implement & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  การพิจารณา (Implement?)
                </label>
                <select
                  value={implement}
                  onChange={(e) => handleImplementChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background:
                      implement === 'YES'
                        ? '#ECFDF5'
                        : implement === 'NO'
                        ? '#FEF2F2'
                        : '#FFFFFF',
                    color:
                      implement === 'YES'
                        ? '#059669'
                        : implement === 'NO'
                        ? '#DC2626'
                        : '#334155',
                  }}
                >
                  <option value="">-- ยังไม่ระบุ --</option>
                  <option value="YES">Yes (ดำเนินการ)</option>
                  <option value="NO">No (ไม่ดำเนินการ)</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  สถานะความคืบหน้า (Status)
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={implement !== 'YES'}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: implement === 'YES' ? '#FFFFFF' : '#F1F5F9',
                    color: implement === 'YES' ? '#334155' : '#94A3B8',
                    cursor: implement === 'YES' ? 'pointer' : 'not-allowed',
                  }}
                >
                  {implement === 'YES' ? (
                    <>
                      <option value={OFI_STATUS_OPTIONS.ON_PROCESS}>กำลังดำเนินการ (On Process)</option>
                      <option value={OFI_STATUS_OPTIONS.COMPLETED}>เสร็จสิ้น (Completed)</option>
                    </>
                  ) : (
                    <option value="">-</option>
                  )}
                </select>
              </div>
            </div>

            {/* Row 8: หมายเหตุ */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                หมายเหตุ (Remark)
              </label>
              <input
                type="text"
                placeholder="ระบุเหตุผลหรือบันทึกเพิ่มเติม (ถ้ามี)..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '1rem 1.75rem',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              background: '#F8FAFC',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.55rem 1.5rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              <Save size={16} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : isEditing ? 'บันทึกการแก้ไข' : 'สร้างรายการ OFI'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
