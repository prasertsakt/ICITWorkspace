'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  User,
  Users,
  Building,
  ShieldCheck,
  Calendar,
  Lock,
  Edit,
  Printer,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  IDP_STATUSES,
  POSITIONS,
  DEFAULT_IDP_CORE_COMPETENCIES,
  DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION,
  DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL,
} from '../lib/constants';
import {
  resolvePersonnelOrgHierarchy,
  calculateIdpSummary,
  saveIdpRecord,
  isHrOfficer,
  confirmSelfSignature,
  confirmDeptHeadSignature,
  confirmDeputyDirectorSignature,
} from '../lib/idpService';

export default function IDPModal({
  isOpen,
  onClose,
  record = null,
  fiscalYear = '2569',
  currentUser,
  currentPersonnel,
  personnelList = [],
  departmentList = [],
  executiveList = [],
  idpConfig = null,
  isAdmin = false,
  onSaved,
}) {
  const isEdit = Boolean(record && record.id);
  const isHR = isHrOfficer(currentUser, currentPersonnel, isAdmin);

  // Selected Personnel for new record creation
  const [selectedPersonnelId, setSelectedPersonnelId] = useState(record?.personnelId || '');

  // Form State
  const [personnelName, setPersonnelName] = useState(record?.personnelName || '');
  const [personnelEmail, setPersonnelEmail] = useState(record?.personnelEmail || '');
  const [position, setPosition] = useState(record?.position || 'บุคลากร');
  const [department, setDepartment] = useState(record?.department || 'สำนักงานผู้อำนวยการ');
  const [departmentHead, setDepartmentHead] = useState(record?.departmentHead || null);
  const [supervisingDeputyDirector, setSupervisingDeputyDirector] = useState(
    record?.supervisingDeputyDirector || null
  );

  // Competency rows
  const [coreCompetencies, setCoreCompetencies] = useState(record?.coreCompetencies || []);
  const [functionalCompetencies, setFunctionalCompetencies] = useState(record?.functionalCompetencies || []);

  // Signatures
  const [signatures, setSignatures] = useState(
    record?.signatures || {
      evaluatorSelf: { name: '', email: '', signedAt: '', signed: false },
      evaluatorSupervisor: { name: '', email: '', signedAt: '', signed: false },
      evaluatorDeputyDirector: { name: '', email: '', signedAt: '', signed: false },
    }
  );

  const [status, setStatus] = useState(record?.status || IDP_STATUSES.DRAFT.key);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto populate on personnel selection (when creating new)
  const handleSelectPersonnel = (pId) => {
    setSelectedPersonnelId(pId);
    const p = personnelList.find((item) => item.id === pId);
    if (!p) return;

    setPersonnelName(p.name || '');
    setPersonnelEmail(p.email || '');

    const hierarchy = resolvePersonnelOrgHierarchy(p, personnelList, departmentList, executiveList);
    setPosition(hierarchy.position);
    setDepartment(hierarchy.department);
    setDepartmentHead(hierarchy.departmentHead);
    setSupervisingDeputyDirector(hierarchy.supervisingDeputyDirector);

    // Initial competencies from config
    const coreList = idpConfig?.coreCompetencies || DEFAULT_IDP_CORE_COMPETENCIES;
    const funcList =
      idpConfig?.functionalCompetenciesByPosition?.[hierarchy.position] ||
      DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION[hierarchy.position] ||
      idpConfig?.functionalCompetenciesGeneral ||
      DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL;

    setCoreCompetencies(
      coreList.map((c) => ({
        ...c,
        selfScore: null,
        supervisorScore: null,
      }))
    );

    setFunctionalCompetencies(
      funcList.map((f) => ({
        ...f,
        selfScore: null,
        supervisorScore: null,
      }))
    );
  };

  // Reset or initialize state
  useEffect(() => {
    if (record) {
      setSelectedPersonnelId(record.personnelId || '');
      setPersonnelName(record.personnelName || '');
      setPersonnelEmail(record.personnelEmail || '');
      setPosition(record.position || 'บุคลากร');
      setDepartment(record.department || 'สำนักงานผู้อำนวยการ');
      setDepartmentHead(record.departmentHead || null);
      setSupervisingDeputyDirector(record.supervisingDeputyDirector || null);
      setCoreCompetencies(record.coreCompetencies || []);
      setFunctionalCompetencies(record.functionalCompetencies || []);
      setSignatures(
        record.signatures || {
          evaluatorSelf: { name: '', email: '', signedAt: '', signed: false },
          evaluatorSupervisor: { name: '', email: '', signedAt: '', signed: false },
          evaluatorDeputyDirector: { name: '', email: '', signedAt: '', signed: false },
        }
      );
      setStatus(record.status || IDP_STATUSES.DRAFT.key);
    } else {
      // Default for new
      if (currentPersonnel && !isHR) {
        handleSelectPersonnel(currentPersonnel.id);
      } else {
        setSelectedPersonnelId('');
        setPersonnelName('');
        setPersonnelEmail('');
        setPosition('บุคลากร');
        setDepartment('สำนักงานผู้อำนวยการ');
        setDepartmentHead(null);
        setSupervisingDeputyDirector(null);
        setCoreCompetencies([]);
        setFunctionalCompetencies([]);
        setSignatures({
          evaluatorSelf: { name: '', email: '', signedAt: '', signed: false },
          evaluatorSupervisor: { name: '', email: '', signedAt: '', signed: false },
          evaluatorDeputyDirector: { name: '', email: '', signedAt: '', signed: false },
        });
        setStatus(IDP_STATUSES.DRAFT.key);
      }
    }
    setErrorMsg('');
  }, [record, isOpen, fiscalYear]);

  if (!isOpen) return null;

  // Permissions Evaluation
  const isOwner =
    Boolean(currentUser?.email && personnelEmail && currentUser.email.toLowerCase() === personnelEmail.toLowerCase()) ||
    Boolean(currentPersonnel?.id && selectedPersonnelId && currentPersonnel.id === selectedPersonnelId);

  const isDeptHead =
    Boolean(departmentHead?.email && currentUser?.email && departmentHead.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    Boolean(departmentHead?.id && currentPersonnel?.id && departmentHead.id === currentPersonnel.id) ||
    isAdmin;

  const isDeputyDirector =
    Boolean(supervisingDeputyDirector?.email && currentUser?.email && supervisingDeputyDirector.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    Boolean(supervisingDeputyDirector?.id && currentPersonnel?.id && supervisingDeputyDirector.id === currentPersonnel.id) ||
    isAdmin;

  // Can edit scores:
  // - Self scores (3): Owner or Admin
  // - Supervisor scores (4): Dept Head, Deputy Director, or Admin
  const canEditSelfScore = isOwner || isAdmin;
  const canEditSupervisorScore = isDeptHead || isDeputyDirector || isAdmin;

  // Live Summary Calculation
  const liveSummary = calculateIdpSummary(coreCompetencies, functionalCompetencies);

  // Update Core Row field
  const handleUpdateCoreScore = (index, field, val) => {
    const parsed = val === '' ? null : Number(val);
    const updated = [...coreCompetencies];
    updated[index] = { ...updated[index], [field]: parsed };
    setCoreCompetencies(updated);
  };

  // Update Functional Row field
  const handleUpdateFuncScore = (index, field, val) => {
    const parsed = val === '' ? null : Number(val);
    const updated = [...functionalCompetencies];
    updated[index] = { ...updated[index], [field]: parsed };
    setFunctionalCompetencies(updated);
  };

  // Signature Confirmations
  const handleSignSelf = () => {
    const updated = confirmSelfSignature({ signatures }, currentUser, currentPersonnel);
    setSignatures(updated.signatures);
  };

  const handleSignDeptHead = () => {
    const updated = confirmDeptHeadSignature({ signatures, departmentHead }, currentUser, currentPersonnel);
    setSignatures(updated.signatures);
  };

  const handleSignDeputyDirector = () => {
    const updated = confirmDeputyDirectorSignature(
      { signatures, supervisingDeputyDirector },
      currentUser,
      currentPersonnel
    );
    setSignatures(updated.signatures);
  };

  // Submit Save
  const handleSave = async () => {
    setErrorMsg('');

    if (!selectedPersonnelId && !personnelName) {
      setErrorMsg('กรุณาเลือกหรือระบุผู้รับการประเมิน');
      return;
    }

    setIsSaving(true);
    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'ผู้ใช้งาน',
        email: currentUser?.email || currentPersonnel?.email || '',
      };

      const payload = {
        ...(record || {}),
        fiscalYear: String(record?.fiscalYear || fiscalYear),
        personnelId: selectedPersonnelId,
        personnelName,
        personnelEmail,
        position,
        department,
        departmentHead,
        supervisingDeputyDirector,
        coreCompetencies: liveSummary.coreCompetencies,
        functionalCompetencies: liveSummary.functionalCompetencies,
        signatures,
        status,
      };

      const saved = await saveIdpRecord(payload, actor);
      if (onSaved) onSaved(saved);
      onClose();
    } catch (err) {
      console.error('Save IDP Record error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9998,
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
          maxWidth: '1100px',
          width: '100%',
          maxHeight: '94vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #3730A3 0%, #4F46E5 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                }}
              >
                IDP NEED ANALYSIS
              </span>
              <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                ปีงบประมาณ {record?.fiscalYear || fiscalYear}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              แบบวิเคราะห์ความต้องการจำเป็นเพื่อจัดทำแผนพัฒนาบุคลากรรายบุคคล (IDP)
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Read-only Header / Hierarchy Bar */}
        <div
          style={{
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '0.85rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem',
            fontSize: '0.85rem',
          }}
        >
          {/* If new and HR/Admin -> Select personnel dropdown */}
          {!isEdit && isHR ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px' }}>
              <label style={{ fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                เลือกบุคลากรเป้าหมาย:
              </label>
              <select
                value={selectedPersonnelId}
                onChange={(e) => handleSelectPersonnel(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1.5px solid #4F46E5',
                  background: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                <option value="">-- เลือกรายชื่อบุคลากรเพื่อสร้างแบบประเมิน --</option>
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.position || 'บุคลากร'} - {p.department || 'สำนัก'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>ชื่อ - สกุล: </span>
                <strong style={{ color: '#1E293B', fontSize: '0.9rem' }}>{personnelName || '-'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>ตำแหน่ง: </span>
                <strong style={{ color: '#1E293B' }}>{position || '-'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>ฝ่าย: </span>
                <strong style={{ color: '#1E293B' }}>{department || '-'}</strong>
              </div>
            </div>
          )}

          {/* Hierarchy Info Badges (Read-only) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.75rem',
                background: '#EEF2FF',
                color: '#3730A3',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #C7D2FE',
              }}
              title="หัวหน้าฝ่ายผู้ประเมินตามโครงสร้างองค์กร"
            >
              หัวหน้าฝ่าย: <strong>{departmentHead?.name || 'หัวหน้าฝ่าย'}</strong>
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                background: '#F0FDF4',
                color: '#15803D',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #BBF7D0',
              }}
              title="รองผู้อำนวยการที่กำกับดูแลฝ่าย"
            >
              รองผู้อำนวยการ: <strong>{supervisingDeputyDirector?.name || 'รองผู้อำนวยการฝ่ายบริหาร'}</strong>
            </span>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div
            style={{
              margin: '0.75rem 1.75rem 0',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body: Evaluation Tables */}
        <div style={{ padding: '1.25rem 1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Permission Notice */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              fontSize: '0.8rem',
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={15} />
              <span>
                <strong>คำแนะนำการประเมิน:</strong> เจ้าของฟอร์มประเมินในคอลัมน์ <strong>ตนเอง (3)</strong> • หัวหน้าฝ่ายหรือรองผู้อำนวยการประเมินในคอลัมน์ <strong>หัวหน้า (4)</strong> (ระดับคะแนน 1 - 5)
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              {isOwner && <span style={{ color: '#2563EB' }}>[ท่านคือเจ้าของฟอร์ม] </span>}
              {isDeptHead && <span style={{ color: '#16A34A' }}>[ท่านคือหัวหน้าฝ่าย] </span>}
              {isDeputyDirector && <span style={{ color: '#7C3AED' }}>[ท่านคือรองผู้อำนวยการ] </span>}
            </div>
          </div>

          {/* ==================== 1. สมรรถนะหลัก (Core Competency) ==================== */}
          <div style={{ border: '1.5px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
            <div
              style={{
                background: '#F8FAFC',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B' }}>
                1. สมรรถนะหลัก (Core Competency)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                น้ำหนักรวม: <strong>{liveSummary.summary.coreWeightTotal}/100</strong> • คาดหวัง: <strong>{liveSummary.summary.coreExpectedTotal}</strong> • ประเมินได้: <strong>{liveSummary.summary.coreEvaluatedTotal}</strong> • Gap: <strong style={{ color: liveSummary.summary.coreGapTotal >= 0 ? '#16A34A' : '#DC2626' }}>{liveSummary.summary.coreGapTotal > 0 ? `+${liveSummary.summary.coreGapTotal}` : liveSummary.summary.coreGapTotal}</strong>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#334155', textAlign: 'center' }}>
                    <th style={{ padding: '8px', width: '35px' }}>#</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '200px' }}>ประเภทของสมรรถนะ</th>
                    <th style={{ padding: '8px', width: '80px' }}>น้ำหนัก (1)</th>
                    <th style={{ padding: '8px', width: '85px' }}>คาดหวัง (2)</th>
                    <th style={{ padding: '8px', width: '90px', background: '#E0F2FE', color: '#0369A1' }}>ตนเอง (3)</th>
                    <th style={{ padding: '8px', width: '90px', background: '#FEF3C7', color: '#92400E' }}>หัวหน้า (4)</th>
                    <th style={{ padding: '8px', width: '100px' }}>คะแนนคาดหวัง (5)</th>
                    <th style={{ padding: '8px', width: '105px' }}>คะแนนประเมินได้ (6)</th>
                    <th style={{ padding: '8px', width: '85px' }}>ช่องว่าง (Gap)</th>
                  </tr>
                </thead>
                <tbody>
                  {liveSummary.coreCompetencies.map((row, idx) => (
                    <tr key={row.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>
                        {row.title}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                        {row.weight}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                        {row.expectedLevel}
                      </td>

                      {/* Column (3) Self Score */}
                      <td style={{ padding: '6px', textAlign: 'center', background: '#F0F9FF' }}>
                        <select
                          value={row.selfScore === null || row.selfScore === undefined ? '' : row.selfScore}
                          onChange={(e) => handleUpdateCoreScore(idx, 'selfScore', e.target.value)}
                          disabled={!canEditSelfScore}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '6px',
                            border: '1px solid #7DD3FC',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: '#0369A1',
                            background: canEditSelfScore ? '#FFFFFF' : '#F0F9FF',
                            cursor: canEditSelfScore ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <option value="">-</option>
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Column (4) Supervisor Score */}
                      <td style={{ padding: '6px', textAlign: 'center', background: '#FFFBEB' }}>
                        <select
                          value={row.supervisorScore === null || row.supervisorScore === undefined ? '' : row.supervisorScore}
                          onChange={(e) => handleUpdateCoreScore(idx, 'supervisorScore', e.target.value)}
                          disabled={!canEditSupervisorScore}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '6px',
                            border: '1px solid #FDE68A',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: '#92400E',
                            background: canEditSupervisorScore ? '#FFFFFF' : '#FFFBEB',
                            cursor: canEditSupervisorScore ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <option value="">-</option>
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Column (5) Expected Total */}
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                        {row.expectedTotal}
                      </td>

                      {/* Column (6) Evaluated Total */}
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 800, color: '#0F766E' }}>
                        {row.evaluatedTotal}
                      </td>

                      {/* Gap */}
                      <td
                        style={{
                          padding: '8px',
                          textAlign: 'center',
                          fontWeight: 800,
                          color: row.gap >= 0 ? '#15803D' : '#DC2626',
                        }}
                      >
                        {row.gap > 0 ? `+${row.gap}` : row.gap}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==================== 2. สมรรถนะตามตำแหน่งงาน (Functional Competency) ==================== */}
          <div style={{ border: '1.5px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
            <div
              style={{
                background: '#F8FAFC',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B' }}>
                2. สมรรถนะตามตำแหน่งงาน (Functional Competency) : {position}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                น้ำหนักรวม: <strong>{liveSummary.summary.functionalWeightTotal}/100</strong> • คาดหวัง: <strong>{liveSummary.summary.functionalExpectedTotal}</strong> • ประเมินได้: <strong>{liveSummary.summary.functionalEvaluatedTotal}</strong> • Gap: <strong style={{ color: liveSummary.summary.functionalGapTotal >= 0 ? '#16A34A' : '#DC2626' }}>{liveSummary.summary.functionalGapTotal > 0 ? `+${liveSummary.summary.functionalGapTotal}` : liveSummary.summary.functionalGapTotal}</strong>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#334155', textAlign: 'center' }}>
                    <th style={{ padding: '8px', width: '35px' }}>#</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '200px' }}>ประเภทของสมรรถนะ</th>
                    <th style={{ padding: '8px', width: '80px' }}>น้ำหนัก (1)</th>
                    <th style={{ padding: '8px', width: '85px' }}>คาดหวัง (2)</th>
                    <th style={{ padding: '8px', width: '90px', background: '#E0F2FE', color: '#0369A1' }}>ตนเอง (3)</th>
                    <th style={{ padding: '8px', width: '90px', background: '#FEF3C7', color: '#92400E' }}>หัวหน้า (4)</th>
                    <th style={{ padding: '8px', width: '100px' }}>คะแนนคาดหวัง (5)</th>
                    <th style={{ padding: '8px', width: '105px' }}>คะแนนประเมินได้ (6)</th>
                    <th style={{ padding: '8px', width: '85px' }}>ช่องว่าง (Gap)</th>
                  </tr>
                </thead>
                <tbody>
                  {liveSummary.functionalCompetencies.map((row, idx) => (
                    <tr key={row.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>
                        {row.title}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                        {row.weight}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                        {row.expectedLevel}
                      </td>

                      {/* Column (3) Self Score */}
                      <td style={{ padding: '6px', textAlign: 'center', background: '#F0F9FF' }}>
                        <select
                          value={row.selfScore === null || row.selfScore === undefined ? '' : row.selfScore}
                          onChange={(e) => handleUpdateFuncScore(idx, 'selfScore', e.target.value)}
                          disabled={!canEditSelfScore}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '6px',
                            border: '1px solid #7DD3FC',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: '#0369A1',
                            background: canEditSelfScore ? '#FFFFFF' : '#F0F9FF',
                            cursor: canEditSelfScore ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <option value="">-</option>
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Column (4) Supervisor Score */}
                      <td style={{ padding: '6px', textAlign: 'center', background: '#FFFBEB' }}>
                        <select
                          value={row.supervisorScore === null || row.supervisorScore === undefined ? '' : row.supervisorScore}
                          onChange={(e) => handleUpdateFuncScore(idx, 'supervisorScore', e.target.value)}
                          disabled={!canEditSupervisorScore}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '6px',
                            border: '1px solid #FDE68A',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: '#92400E',
                            background: canEditSupervisorScore ? '#FFFFFF' : '#FFFBEB',
                            cursor: canEditSupervisorScore ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <option value="">-</option>
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Column (5) Expected Total */}
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                        {row.expectedTotal}
                      </td>

                      {/* Column (6) Evaluated Total */}
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 800, color: '#0F766E' }}>
                        {row.evaluatedTotal}
                      </td>

                      {/* Gap */}
                      <td
                        style={{
                          padding: '8px',
                          textAlign: 'center',
                          fontWeight: 800,
                          color: row.gap >= 0 ? '#15803D' : '#DC2626',
                        }}
                      >
                        {row.gap > 0 ? `+${row.gap}` : row.gap}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formula Footnote */}
          <div style={{ fontSize: '0.775rem', color: '#64748B', lineHeight: 1.6, padding: '0 4px' }}>
            <div>* <strong>สูตรคะแนนคาดหวัง(5)</strong> = น้ำหนักคะแนน(1) × ระดับคาดหวังที่กำหนด(2)</div>
            <div>* <strong>สูตรที่ประเมินได้(6)</strong> = [ผลตนเอง(3) + ผลหัวหน้า(4)] ÷ 2 × น้ำหนักคะแนน(1)</div>
            <div>* <strong>สูตรช่องว่าง (Gap)</strong> = ค่าคะแนนที่ประเมินได้(6) - ค่าคะแนนคาดหวัง(5)</div>
          </div>

          {/* ==================== Signatures Section (3 Separate Sign Buttons) ==================== */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              paddingTop: '0.5rem',
            }}
          >
            {/* 1. Self Signature */}
            <div
              style={{
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                padding: '1rem',
                backgroundColor: signatures.evaluatorSelf?.signed ? '#F0FDF4' : '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  ผู้รับการประเมิน (บุคลากร)
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.875rem', fontWeight: 800, color: '#1E293B' }}>
                  {signatures.evaluatorSelf?.signed ? signatures.evaluatorSelf.name : personnelName || '-'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {signatures.evaluatorSelf?.signed ? `วันที่ลงนาม: ${signatures.evaluatorSelf.signedAt}` : 'ยังไม่ได้ลงชื่อ'}
                </div>
              </div>

              {!signatures.evaluatorSelf?.signed && canEditSelfScore && (
                <button
                  type="button"
                  onClick={handleSignSelf}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: '#FFFFFF',
                    borderColor: '#0284C7',
                    color: '#0369A1',
                    fontWeight: 700,
                    fontSize: '0.775rem',
                  }}
                >
                  ลงชื่อผู้รับการประเมิน (ตนเอง)
                </button>
              )}
            </div>

            {/* 2. Department Head Signature (แยกปุ่มสำหรับหัวหน้าฝ่าย) */}
            <div
              style={{
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                padding: '1rem',
                backgroundColor: signatures.evaluatorSupervisor?.signed ? '#F0FDF4' : '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  ผู้ประเมิน (หัวหน้าฝ่าย)
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.875rem', fontWeight: 800, color: '#1E293B' }}>
                  {signatures.evaluatorSupervisor?.signed
                    ? signatures.evaluatorSupervisor.name
                    : departmentHead?.name || 'หัวหน้าฝ่าย'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {signatures.evaluatorSupervisor?.signed
                    ? `วันที่ลงนาม: ${signatures.evaluatorSupervisor.signedAt}`
                    : 'ยังไม่ได้ลงชื่อ'}
                </div>
              </div>

              {!signatures.evaluatorSupervisor?.signed && (isDeptHead || isAdmin) && (
                <button
                  type="button"
                  onClick={handleSignDeptHead}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: '#FFFFFF',
                    borderColor: '#16A34A',
                    color: '#15803D',
                    fontWeight: 700,
                    fontSize: '0.775rem',
                  }}
                >
                  ลงชื่อผู้ประเมิน (หัวหน้าฝ่าย)
                </button>
              )}
            </div>

            {/* 3. Supervising Deputy Director Signature (แยกปุ่มสำหรับรองผู้อำนวยการที่กำกับดูแลฝ่าย) */}
            <div
              style={{
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                padding: '1rem',
                backgroundColor: signatures.evaluatorDeputyDirector?.signed ? '#F0FDF4' : '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  ผู้ประเมิน (รองผู้อำนวยการที่กำกับดูแลฝ่าย)
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.875rem', fontWeight: 800, color: '#1E293B' }}>
                  {signatures.evaluatorDeputyDirector?.signed
                    ? signatures.evaluatorDeputyDirector.name
                    : supervisingDeputyDirector?.name || 'รองผู้อำนวยการฝ่ายบริหาร'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {signatures.evaluatorDeputyDirector?.signed
                    ? `วันที่ลงนาม: ${signatures.evaluatorDeputyDirector.signedAt}`
                    : 'ยังไม่ได้ลงชื่อ'}
                </div>
              </div>

              {!signatures.evaluatorDeputyDirector?.signed && (isDeputyDirector || isAdmin) && (
                <button
                  type="button"
                  onClick={handleSignDeputyDirector}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: '#FFFFFF',
                    borderColor: '#7C3AED',
                    color: '#6D28D9',
                    fontWeight: 700,
                    fontSize: '0.775rem',
                  }}
                >
                  ลงชื่อผู้ประเมิน (รองผู้อำนวยการ)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            padding: '1rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
            คะแนนประเมินรวม: <strong>{liveSummary.summary.totalEvaluated}</strong> / คาดหวังรวม: <strong>{liveSummary.summary.totalExpected}</strong> (Gap สุทธิ: <strong style={{ color: liveSummary.summary.totalGap >= 0 ? '#16A34A' : '#DC2626' }}>{liveSummary.summary.totalGap > 0 ? `+${liveSummary.summary.totalGap}` : liveSummary.summary.totalGap}</strong>)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              disabled={isSaving}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary btn-sm"
              disabled={isSaving}
              style={{
                background: 'linear-gradient(135deg, #3730A3 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                padding: '0.5rem 1.5rem',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกแบบประเมิน'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
