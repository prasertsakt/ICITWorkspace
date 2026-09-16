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
        backdropFilter: 'blur(6px)',
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
          maxWidth: '1360px',
          width: '96vw',
          maxHeight: '94vh',
          height: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================== Top Header Banner ==================== */}
        <div
          style={{
            background: 'linear-gradient(135deg, #312E81 0%, #4338CA 50%, #4F46E5 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.22)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                  }}
                >
                  IDP NEED ANALYSIS
                </span>
                <span style={{ fontSize: '0.875rem', opacity: 0.95, fontWeight: 600 }}>
                  ปีงบประมาณ {record?.fiscalYear || fiscalYear}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                แบบวิเคราะห์ความต้องการจำเป็นเพื่อจัดทำแผนพัฒนาบุคลากรรายบุคคล (IDP)
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '10px',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              title="ปิดหน้าต่าง"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ==================== Personnel & Organization Hierarchy Info Bar ==================== */}
        <div
          style={{
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '1rem 2rem',
            flexShrink: 0,
          }}
        >
          {!isEdit && isHR ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  🎯 เลือกบุคลากรเป้าหมาย:
                </label>
                <select
                  value={selectedPersonnelId}
                  onChange={(e) => handleSelectPersonnel(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '320px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '2px solid #6366F1',
                    background: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: '#1E293B',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <option value="">-- คลิกเพื่อเลือกรายชื่อบุคลากรเพื่อสร้างแบบประเมิน --</option>
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.position || 'บุคลากร'} ({p.department || 'สำนัก'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Hierarchy Summary Pills */}
              {selectedPersonnelId && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.75rem',
                    paddingTop: '0.25rem',
                  }}
                >
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '0.5rem 0.85rem',
                      fontSize: '0.825rem',
                    }}
                  >
                    <div style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>ตำแหน่ง / ฝ่าย</div>
                    <div style={{ fontWeight: 700, color: '#1E293B' }}>
                      {position} • {department}
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#EEF2FF',
                      border: '1px solid #C7D2FE',
                      borderRadius: '8px',
                      padding: '0.5rem 0.85rem',
                      fontSize: '0.825rem',
                    }}
                  >
                    <div style={{ color: '#4338CA', fontSize: '0.75rem', fontWeight: 600 }}>
                      👔 ผู้ประเมิน (หัวหน้าฝ่าย)
                    </div>
                    <div style={{ fontWeight: 700, color: '#312E81' }}>
                      {departmentHead?.name || 'หัวหน้าฝ่าย'}
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '8px',
                      padding: '0.5rem 0.85rem',
                      fontSize: '0.825rem',
                    }}
                  >
                    <div style={{ color: '#15803D', fontSize: '0.75rem', fontWeight: 600 }}>
                      🏛️ ผู้ประเมิน (รองผู้อำนวยการที่กำกับดูแล)
                    </div>
                    <div style={{ fontWeight: 700, color: '#14532D' }}>
                      {supervisingDeputyDirector?.name || 'รองผู้อำนวยการฝ่ายบริหาร'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Read-only Personnel Information Grid */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4F46E5',
                    flexShrink: 0,
                  }}
                >
                  <User size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>ผู้รับการประเมิน</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B' }}>
                    {personnelName || '-'}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#F0F9FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284C7',
                    flexShrink: 0,
                  }}
                >
                  <Building size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>ตำแหน่ง / ฝ่ายงาน</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                    {position || '-'} ({department || '-'})
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3730A3',
                    flexShrink: 0,
                  }}
                >
                  <Users size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#4338CA', fontWeight: 600 }}>
                    ผู้ประเมิน (หัวหน้าฝ่าย)
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#312E81' }}>
                    {departmentHead?.name || 'หัวหน้าฝ่าย'}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#15803D',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 600 }}>
                    ผู้ประเมิน (รองผู้อำนวยการ)
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#14532D' }}>
                    {supervisingDeputyDirector?.name || 'รองผู้อำนวยการฝ่ายบริหาร'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div
            style={{
              margin: '0.75rem 2rem 0',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ==================== Modal Scrollable Body ==================== */}
        <div
          style={{
            padding: '1.5rem 2rem',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
          }}
        >
          {/* Permission Notice */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              fontSize: '0.85rem',
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="#2563EB" style={{ flexShrink: 0 }} />
              <span>
                <strong>คำแนะนำการประเมิน:</strong> เจ้าของฟอร์มประเมินในคอลัมน์ <strong style={{ color: '#0369A1' }}>ตนเอง (3)</strong> • หัวหน้าฝ่ายหรือรองผู้อำนวยการประเมินในคอลัมน์ <strong style={{ color: '#92400E' }}>หัวหน้า (4)</strong> (ระดับคะแนน 1 - 5)
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', gap: '8px' }}>
              {isOwner && (
                <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '4px' }}>
                  ✓ ท่านคือเจ้าของแบบฟอร์ม
                </span>
              )}
              {isDeptHead && (
                <span style={{ background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '4px' }}>
                  ✓ ท่านคือหัวหน้าฝ่าย
                </span>
              )}
              {isDeputyDirector && (
                <span style={{ background: '#F3E8FF', color: '#7E22CE', padding: '2px 8px', borderRadius: '4px' }}>
                  ✓ ท่านคือรองผู้อำนวยการ
                </span>
              )}
            </div>
          </div>

          {/* ==================== 1. สมรรถนะหลัก (Core Competency) ==================== */}
          <div
            style={{
              border: '1.5px solid #CBD5E1',
              borderRadius: '14px',
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              flexShrink: 0,
            }}
          >
            {/* Card Header */}
            <div
              style={{
                background: '#F8FAFC',
                padding: '1rem 1.25rem',
                borderBottom: '1.5px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: '#3730A3',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  ส่วนที่ 1
                </span>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1E293B' }}>
                  สมรรถนะหลัก (Core Competency)
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#475569',
                  background: '#FFFFFF',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              >
                น้ำหนักรวม: <strong style={{ color: '#3730A3' }}>{liveSummary.summary.coreWeightTotal}/100</strong> • คาดหวัง: <strong>{liveSummary.summary.coreExpectedTotal}</strong> • ประเมินได้: <strong>{liveSummary.summary.coreEvaluatedTotal}</strong> • ช่องว่าง (Gap): <strong style={{ color: liveSummary.summary.coreGapTotal >= 0 ? '#16A34A' : '#DC2626' }}>{liveSummary.summary.coreGapTotal > 0 ? `+${liveSummary.summary.coreGapTotal}` : liveSummary.summary.coreGapTotal}</strong>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#1E293B', textAlign: 'center' }}>
                    <th style={{ padding: '10px 8px', width: '45px' }}>#</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', minWidth: '240px' }}>ประเภทของสมรรถนะ</th>
                    <th style={{ padding: '10px 8px', width: '90px' }}>น้ำหนัก (1)</th>
                    <th style={{ padding: '10px 8px', width: '95px' }}>คาดหวัง (2)</th>
                    <th style={{ padding: '10px 8px', width: '105px', background: '#E0F2FE', color: '#0369A1' }}>ตนเอง (3)</th>
                    <th style={{ padding: '10px 8px', width: '105px', background: '#FEF3C7', color: '#92400E' }}>หัวหน้า (4)</th>
                    <th style={{ padding: '10px 8px', width: '110px' }}>คะแนนคาดหวัง (5)</th>
                    <th style={{ padding: '10px 8px', width: '115px' }}>คะแนนประเมินได้ (6)</th>
                    <th style={{ padding: '10px 8px', width: '100px' }}>ช่องว่าง (Gap)</th>
                  </tr>
                </thead>
                <tbody>
                  {liveSummary.coreCompetencies.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      style={{
                        borderBottom: '1px solid #E2E8F0',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                      }}
                    >
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1E293B', lineHeight: 1.4 }}>
                        {row.title}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                        {row.weight}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                        {row.expectedLevel}
                      </td>

                      {/* Column (3) Self Score */}
                      <td style={{ padding: '8px', textAlign: 'center', background: '#F0F9FF' }}>
                        <select
                          value={row.selfScore === null || row.selfScore === undefined ? '' : row.selfScore}
                          onChange={(e) => handleUpdateCoreScore(idx, 'selfScore', e.target.value)}
                          disabled={!canEditSelfScore}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #7DD3FC',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            color: '#0369A1',
                            background: canEditSelfScore ? '#FFFFFF' : '#E0F2FE',
                            cursor: canEditSelfScore ? 'pointer' : 'not-allowed',
                            width: '65px',
                            textAlign: 'center',
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
                      <td style={{ padding: '8px', textAlign: 'center', background: '#FFFBEB' }}>
                        <select
                          value={row.supervisorScore === null || row.supervisorScore === undefined ? '' : row.supervisorScore}
                          onChange={(e) => handleUpdateCoreScore(idx, 'supervisorScore', e.target.value)}
                          disabled={!canEditSupervisorScore}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #FDE68A',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            color: '#92400E',
                            background: canEditSupervisorScore ? '#FFFFFF' : '#FEF3C7',
                            cursor: canEditSupervisorScore ? 'pointer' : 'not-allowed',
                            width: '65px',
                            textAlign: 'center',
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
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
                        {row.expectedTotal}
                      </td>

                      {/* Column (6) Evaluated Total */}
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, color: '#0F766E' }}>
                        {row.evaluatedTotal}
                      </td>

                      {/* Gap */}
                      <td
                        style={{
                          padding: '10px 8px',
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
                <tfoot>
                  <tr style={{ background: '#F8FAFC', borderTop: '2px solid #CBD5E1', fontWeight: 800, color: '#1E293B', textAlign: 'center' }}>
                    <td colSpan={2} style={{ padding: '10px 14px', textAlign: 'right' }}>
                      รวมสมรรถนะหลัก:
                    </td>
                    <td style={{ padding: '10px 8px', color: '#3730A3' }}>
                      {liveSummary.summary.coreWeightTotal}
                    </td>
                    <td style={{ padding: '10px 8px' }}>-</td>
                    <td style={{ padding: '10px 8px', background: '#F0F9FF', color: '#0369A1' }}>-</td>
                    <td style={{ padding: '10px 8px', background: '#FFFBEB', color: '#92400E' }}>-</td>
                    <td style={{ padding: '10px 8px' }}>{liveSummary.summary.coreExpectedTotal}</td>
                    <td style={{ padding: '10px 8px', color: '#0F766E' }}>{liveSummary.summary.coreEvaluatedTotal}</td>
                    <td style={{ padding: '10px 8px', color: liveSummary.summary.coreGapTotal >= 0 ? '#15803D' : '#DC2626' }}>
                      {liveSummary.summary.coreGapTotal > 0 ? `+${liveSummary.summary.coreGapTotal}` : liveSummary.summary.coreGapTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ==================== 2. สมรรถนะตามตำแหน่งงาน (Functional Competency) ==================== */}
          <div
            style={{
              border: '1.5px solid #CBD5E1',
              borderRadius: '14px',
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              flexShrink: 0,
            }}
          >
            {/* Card Header */}
            <div
              style={{
                background: '#F8FAFC',
                padding: '1rem 1.25rem',
                borderBottom: '1.5px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: '#0D9488',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  ส่วนที่ 2
                </span>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1E293B' }}>
                  สมรรถนะตามตำแหน่งงาน (Functional Competency) : <span style={{ color: '#0F766E' }}>{position}</span>
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#475569',
                  background: '#FFFFFF',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              >
                น้ำหนักรวม: <strong style={{ color: '#0D9488' }}>{liveSummary.summary.functionalWeightTotal}/100</strong> • คาดหวัง: <strong>{liveSummary.summary.functionalExpectedTotal}</strong> • ประเมินได้: <strong>{liveSummary.summary.functionalEvaluatedTotal}</strong> • ช่องว่าง (Gap): <strong style={{ color: liveSummary.summary.functionalGapTotal >= 0 ? '#16A34A' : '#DC2626' }}>{liveSummary.summary.functionalGapTotal > 0 ? `+${liveSummary.summary.functionalGapTotal}` : liveSummary.summary.functionalGapTotal}</strong>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#1E293B', textAlign: 'center' }}>
                    <th style={{ padding: '10px 8px', width: '45px' }}>#</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', minWidth: '240px' }}>ประเภทของสมรรถนะ</th>
                    <th style={{ padding: '10px 8px', width: '90px' }}>น้ำหนัก (1)</th>
                    <th style={{ padding: '10px 8px', width: '95px' }}>คาดหวัง (2)</th>
                    <th style={{ padding: '10px 8px', width: '105px', background: '#E0F2FE', color: '#0369A1' }}>ตนเอง (3)</th>
                    <th style={{ padding: '10px 8px', width: '105px', background: '#FEF3C7', color: '#92400E' }}>หัวหน้า (4)</th>
                    <th style={{ padding: '10px 8px', width: '110px' }}>คะแนนคาดหวัง (5)</th>
                    <th style={{ padding: '10px 8px', width: '115px' }}>คะแนนประเมินได้ (6)</th>
                    <th style={{ padding: '10px 8px', width: '100px' }}>ช่องว่าง (Gap)</th>
                  </tr>
                </thead>
                <tbody>
                  {liveSummary.functionalCompetencies.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      style={{
                        borderBottom: '1px solid #E2E8F0',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                      }}
                    >
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1E293B', lineHeight: 1.4 }}>
                        {row.title}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                        {row.weight}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                        {row.expectedLevel}
                      </td>

                      {/* Column (3) Self Score */}
                      <td style={{ padding: '8px', textAlign: 'center', background: '#F0F9FF' }}>
                        <select
                          value={row.selfScore === null || row.selfScore === undefined ? '' : row.selfScore}
                          onChange={(e) => handleUpdateFuncScore(idx, 'selfScore', e.target.value)}
                          disabled={!canEditSelfScore}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #7DD3FC',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            color: '#0369A1',
                            background: canEditSelfScore ? '#FFFFFF' : '#E0F2FE',
                            cursor: canEditSelfScore ? 'pointer' : 'not-allowed',
                            width: '65px',
                            textAlign: 'center',
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
                      <td style={{ padding: '8px', textAlign: 'center', background: '#FFFBEB' }}>
                        <select
                          value={row.supervisorScore === null || row.supervisorScore === undefined ? '' : row.supervisorScore}
                          onChange={(e) => handleUpdateFuncScore(idx, 'supervisorScore', e.target.value)}
                          disabled={!canEditSupervisorScore}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #FDE68A',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            color: '#92400E',
                            background: canEditSupervisorScore ? '#FFFFFF' : '#FEF3C7',
                            cursor: canEditSupervisorScore ? 'pointer' : 'not-allowed',
                            width: '65px',
                            textAlign: 'center',
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
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
                        {row.expectedTotal}
                      </td>

                      {/* Column (6) Evaluated Total */}
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, color: '#0F766E' }}>
                        {row.evaluatedTotal}
                      </td>

                      {/* Gap */}
                      <td
                        style={{
                          padding: '10px 8px',
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
                <tfoot>
                  <tr style={{ background: '#F8FAFC', borderTop: '2px solid #CBD5E1', fontWeight: 800, color: '#1E293B', textAlign: 'center' }}>
                    <td colSpan={2} style={{ padding: '10px 14px', textAlign: 'right' }}>
                      รวมสมรรถนะตามตำแหน่งงาน:
                    </td>
                    <td style={{ padding: '10px 8px', color: '#0D9488' }}>
                      {liveSummary.summary.functionalWeightTotal}
                    </td>
                    <td style={{ padding: '10px 8px' }}>-</td>
                    <td style={{ padding: '10px 8px', background: '#F0F9FF', color: '#0369A1' }}>-</td>
                    <td style={{ padding: '10px 8px', background: '#FFFBEB', color: '#92400E' }}>-</td>
                    <td style={{ padding: '10px 8px' }}>{liveSummary.summary.functionalExpectedTotal}</td>
                    <td style={{ padding: '10px 8px', color: '#0F766E' }}>{liveSummary.summary.functionalEvaluatedTotal}</td>
                    <td style={{ padding: '10px 8px', color: liveSummary.summary.functionalGapTotal >= 0 ? '#15803D' : '#DC2626' }}>
                      {liveSummary.summary.functionalGapTotal > 0 ? `+${liveSummary.summary.functionalGapTotal}` : liveSummary.summary.functionalGapTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Formula Footnote */}
          <div
            style={{
              fontSize: '0.8rem',
              color: '#64748B',
              lineHeight: 1.6,
              padding: '0.75rem 1rem',
              background: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              flexShrink: 0,
            }}
          >
            <div>* <strong>สูตรคะแนนคาดหวัง(5)</strong> = น้ำหนักคะแนน(1) × ระดับคาดหวังที่กำหนด(2)</div>
            <div>* <strong>สูตรที่ประเมินได้(6)</strong> = [ผลตนเอง(3) + ผลหัวหน้า(4)] ÷ 2 × น้ำหนักคะแนน(1)</div>
            <div>* <strong>สูตรช่องว่าง (Gap)</strong> = ค่าคะแนนที่ประเมินได้(6) - ค่าคะแนนคาดหวัง(5)</div>
          </div>

          {/* ==================== Signatures Section (3 Separate Sign Buttons) ==================== */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.25rem',
              paddingTop: '0.5rem',
              flexShrink: 0,
            }}
          >
            {/* 1. Self Signature */}
            <div
              style={{
                border: '1.5px solid #CBD5E1',
                borderRadius: '12px',
                padding: '1.25rem',
                backgroundColor: signatures.evaluatorSelf?.signed ? '#F0FDF4' : '#FFFFFF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>
                    ผู้รับการประเมิน (บุคลากร)
                  </span>
                  {signatures.evaluatorSelf?.signed ? (
                    <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 800, background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>
                      ✓ ลงนามแล้ว
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                      ยังไม่ได้ลงชื่อ
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '8px', fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>
                  {signatures.evaluatorSelf?.signed ? signatures.evaluatorSelf.name : personnelName || '-'}
                </div>
                <div style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '2px' }}>
                  {signatures.evaluatorSelf?.signed ? `วันที่ลงนาม: ${signatures.evaluatorSelf.signedAt}` : 'รอการลงชื่อยืนยันการประเมินตนเอง'}
                </div>
              </div>

              {!signatures.evaluatorSelf?.signed && canEditSelfScore && (
                <button
                  type="button"
                  onClick={handleSignSelf}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: '#F0F9FF',
                    borderColor: '#0284C7',
                    color: '#0369A1',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  ✍️ ลงชื่อผู้รับการประเมิน (ตนเอง)
                </button>
              )}
            </div>

            {/* 2. Department Head Signature */}
            <div
              style={{
                border: '1.5px solid #CBD5E1',
                borderRadius: '12px',
                padding: '1.25rem',
                backgroundColor: signatures.evaluatorSupervisor?.signed ? '#F0FDF4' : '#FFFFFF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>
                    ผู้ประเมิน (หัวหน้าฝ่าย)
                  </span>
                  {signatures.evaluatorSupervisor?.signed ? (
                    <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 800, background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>
                      ✓ ลงนามแล้ว
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                      ยังไม่ได้ลงชื่อ
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '8px', fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>
                  {signatures.evaluatorSupervisor?.signed
                    ? signatures.evaluatorSupervisor.name
                    : departmentHead?.name || 'หัวหน้าฝ่าย'}
                </div>
                <div style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '2px' }}>
                  {signatures.evaluatorSupervisor?.signed
                    ? `วันที่ลงนาม: ${signatures.evaluatorSupervisor.signedAt}`
                    : 'รอการลงชื่อประเมินโดยหัวหน้าฝ่าย'}
                </div>
              </div>

              {!signatures.evaluatorSupervisor?.signed && (isDeptHead || isAdmin) && (
                <button
                  type="button"
                  onClick={handleSignDeptHead}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: '#F0FDF4',
                    borderColor: '#16A34A',
                    color: '#15803D',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  ✍️ ลงชื่อผู้ประเมิน (หัวหน้าฝ่าย)
                </button>
              )}
            </div>

            {/* 3. Supervising Deputy Director Signature */}
            <div
              style={{
                border: '1.5px solid #CBD5E1',
                borderRadius: '12px',
                padding: '1.25rem',
                backgroundColor: signatures.evaluatorDeputyDirector?.signed ? '#F0FDF4' : '#FFFFFF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>
                    ผู้ประเมิน (รองผู้อำนวยการที่กำกับดูแลฝ่าย)
                  </span>
                  {signatures.evaluatorDeputyDirector?.signed ? (
                    <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 800, background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>
                      ✓ ลงนามแล้ว
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                      ยังไม่ได้ลงชื่อ
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '8px', fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>
                  {signatures.evaluatorDeputyDirector?.signed
                    ? signatures.evaluatorDeputyDirector.name
                    : supervisingDeputyDirector?.name || 'รองผู้อำนวยการฝ่ายบริหาร'}
                </div>
                <div style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '2px' }}>
                  {signatures.evaluatorDeputyDirector?.signed
                    ? `วันที่ลงนาม: ${signatures.evaluatorDeputyDirector.signedAt}`
                    : 'รอการลงชื่อประเมินโดยรองผู้อำนวยการ'}
                </div>
              </div>

              {!signatures.evaluatorDeputyDirector?.signed && (isDeputyDirector || isAdmin) && (
                <button
                  type="button"
                  onClick={handleSignDeputyDirector}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: '#FDF4FF',
                    borderColor: '#9333EA',
                    color: '#7E22CE',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  ✍️ ลงชื่อผู้ประเมิน (รองผู้อำนวยการ)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ==================== Modal Footer ==================== */}
        <div
          style={{
            borderTop: '1.5px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
            <span style={{ color: '#64748B' }}>
              คะแนนรวมประเมินได้: <strong style={{ color: '#0F766E', fontSize: '1rem' }}>{liveSummary.summary.totalEvaluated}</strong> / คาดหวังรวม: <strong style={{ color: '#1E293B', fontSize: '1rem' }}>{liveSummary.summary.totalExpected}</strong>
            </span>
            <span
              style={{
                background: liveSummary.summary.totalGap >= 0 ? '#DCFCE7' : '#FEE2E2',
                color: liveSummary.summary.totalGap >= 0 ? '#15803D' : '#DC2626',
                padding: '4px 10px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                border: `1px solid ${liveSummary.summary.totalGap >= 0 ? '#BBF7D0' : '#FECACA'}`,
              }}
            >
              Gap สุทธิ: {liveSummary.summary.totalGap > 0 ? `+${liveSummary.summary.totalGap}` : liveSummary.summary.totalGap}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              disabled={isSaving}
              style={{ padding: '0.5rem 1.25rem' }}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary btn-sm"
              disabled={isSaving}
              style={{
                background: 'linear-gradient(135deg, #312E81 0%, #4338CA 50%, #4F46E5 100%)',
                color: '#FFFFFF',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 800,
                padding: '0.6rem 1.75rem',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                cursor: 'pointer',
              }}
            >
              <Save size={18} />
              <span>{isSaving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกแบบประเมิน'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
