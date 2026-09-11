'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Calendar,
  User,
  Users,
  Building,
  Check,
  Lock,
  Download,
  Search,
  MessageSquare,
  AlertOctagon,
  Clock,
  Send,
  HelpCircle,
} from 'lucide-react';
import {
  IMS_STANDARDS,
  IMS_AUDIT_TOPICS,
} from '../lib/constants';
import {
  CAR_INCIDENT_STATUS,
  CAR_INCIDENT_STATUS_INFO,
  saveCarIncident,
  canUserEditPart1And4,
  canUserEditPart2And3,
  isUserInRequestees,
  isUserInRequesters,
  isPart3AllStepsCompleted,
  canProposePart4,
  isDccUser,
  confirmActionStepSignature,
  confirmExecutiveSignature,
} from '../lib/carIncidentService';

export default function CarIncidentModal({
  isOpen,
  onClose,
  record,
  currentUser,
  currentPersonnel,
  personnelList = [],
  yearlyConfig = {},
  availableNcAudits = [],
  isAdmin,
  onSaved,
}) {
  const isEdit = Boolean(record && record.id);

  // Form State
  const [docType, setDocType] = useState(record?.docType || 'CAR');
  const [fiscalYear, setFiscalYear] = useState(record?.fiscalYear || '2569');
  const [docNumber, setDocNumber] = useState(record?.docNumber || '');
  const [status, setStatus] = useState(record?.status || CAR_INCIDENT_STATUS.NOT_YET_APPROVED);
  const [standard, setStandard] = useState(record?.standard || IMS_STANDARDS[1] || 'ISO 9001:2015');
  const [topic, setTopic] = useState(record?.topic || IMS_AUDIT_TOPICS[0] || '');
  const [clauses, setClauses] = useState(record?.clauses || '');

  // Part 1
  const [requesters, setRequesters] = useState(record?.requesters || []);
  const [requesterStatus, setRequesterStatus] = useState(record?.requesterStatus || 'AUDITOR');
  const [requesterStatusOther, setRequesterStatusOther] = useState(record?.requesterStatusOther || '');
  const [problemStatus, setProblemStatus] = useState(record?.problemStatus || 'INTERNAL');
  const [requestDate, setRequestDate] = useState(
    record?.requestDate || new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState(record?.description || '');
  const [requestees, setRequestees] = useState(record?.requestees || []);

  // Part 2
  const [immediateCorrection, setImmediateCorrection] = useState(record?.immediateCorrection || '');
  const [rootCause, setRootCause] = useState(record?.rootCause || '');
  const [part2Date, setPart2Date] = useState(record?.part2Date || '');

  // Part 3
  const [actionPlans, setActionPlans] = useState(
    record?.actionPlans || [
      {
        id: `step-${Date.now()}-1`,
        step: '',
        responsiblePerson: '',
        targetDate: '',
        completedDate: '',
        signature: '',
        remarks: '',
      },
    ]
  );
  const [executiveSignature, setExecutiveSignature] = useState(record?.executiveSignature || null);

  // Part 4
  const [followUpDate, setFollowUpDate] = useState(record?.followUpDate || '');
  const [followUpFindings, setFollowUpFindings] = useState(record?.followUpFindings || '');
  const [followUpResult, setFollowUpResult] = useState(record?.followUpResult || '');
  const [followUpAuditor, setFollowUpAuditor] = useState(record?.followUpAuditor || null);

  // Notes
  const [notes, setNotes] = useState(record?.notes || []);
  const [newNoteText, setNewNoteText] = useState('');

  // Source IA link
  const [sourceAuditId, setSourceAuditId] = useState(record?.sourceAuditId || null);
  const [sourceAuditCode, setSourceAuditCode] = useState(record?.sourceAuditCode || null);

  // UI States
  const [activeTab, setActiveTab] = useState('part1'); // 'part1', 'part2', 'part3', 'part4', 'notes'
  const [showNcImportModal, setShowNcImportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchPersonnelKeyword, setSearchPersonnelKeyword] = useState('');

  // Reset or initialize state on record change
  useEffect(() => {
    if (record) {
      setDocType(record.docType || 'CAR');
      setFiscalYear(record.fiscalYear || '2569');
      setDocNumber(record.docNumber || '');
      setStatus(record.status || CAR_INCIDENT_STATUS.NOT_YET_APPROVED);
      setStandard(record.standard || IMS_STANDARDS[1] || 'ISO 9001:2015');
      setTopic(record.topic || IMS_AUDIT_TOPICS[0] || '');
      setClauses(record.clauses || '');

      setRequesters(record.requesters || []);
      setRequesterStatus(record.requesterStatus || 'AUDITOR');
      setRequesterStatusOther(record.requesterStatusOther || '');
      setProblemStatus(record.problemStatus || 'INTERNAL');
      setRequestDate(record.requestDate || new Date().toISOString().split('T')[0]);
      setDescription(record.description || '');
      setRequestees(record.requestees || []);

      setImmediateCorrection(record.immediateCorrection || '');
      setRootCause(record.rootCause || '');
      setPart2Date(record.part2Date || '');

      setActionPlans(
        record.actionPlans && record.actionPlans.length > 0
          ? record.actionPlans
          : [
              {
                id: `step-${Date.now()}-1`,
                step: '',
                responsiblePerson: '',
                targetDate: '',
                completedDate: '',
                signature: '',
                remarks: '',
              },
            ]
      );
      setExecutiveSignature(record.executiveSignature || null);

      setFollowUpDate(record.followUpDate || '');
      setFollowUpFindings(record.followUpFindings || '');
      setFollowUpResult(record.followUpResult || '');
      setFollowUpAuditor(record.followUpAuditor || null);
      setNotes(record.notes || []);
      setSourceAuditId(record.sourceAuditId || null);
      setSourceAuditCode(record.sourceAuditCode || null);
    } else {
      // Default for new
      setDocType('CAR');
      setFiscalYear('2569');
      setDocNumber('');
      setStatus(CAR_INCIDENT_STATUS.NOT_YET_APPROVED);
      setStandard(IMS_STANDARDS[1] || 'ISO 9001:2015');
      setTopic(IMS_AUDIT_TOPICS[0] || '');
      setClauses('');

      // Auto-set current user as requester if not specified
      const currentAsRequester = currentPersonnel
        ? [{ id: currentPersonnel.id, name: currentPersonnel.name, email: currentPersonnel.email, department: currentPersonnel.department }]
        : currentUser?.email
        ? [{ id: currentUser.uid || 'usr', name: currentUser.displayName || 'ผู้ตรวจติดตาม', email: currentUser.email }]
        : [];
      setRequesters(currentAsRequester);
      setRequesterStatus('AUDITOR');
      setRequesterStatusOther('');
      setProblemStatus('INTERNAL');
      setRequestDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setRequestees([]);

      setImmediateCorrection('');
      setRootCause('');
      setPart2Date('');

      setActionPlans([
        {
          id: `step-${Date.now()}-1`,
          step: '',
          responsiblePerson: '',
          targetDate: '',
          completedDate: '',
          signature: '',
          remarks: '',
        },
      ]);
      setExecutiveSignature(null);

      setFollowUpDate('');
      setFollowUpFindings('');
      setFollowUpResult('');
      setFollowUpAuditor(null);
      setNotes([]);
      setSourceAuditId(null);
      setSourceAuditCode(null);
    }
    setActiveTab('part1');
    setErrorMsg('');
  }, [record, isOpen]);

  if (!isOpen) return null;

  // Permissions Evaluation
  const isDCC = isDccUser(currentUser, currentPersonnel, yearlyConfig, isAdmin);
  const isRequester = isUserInRequesters({ requesters }, currentUser, currentPersonnel);
  const isRequestee = isUserInRequestees({ requestees }, currentUser, currentPersonnel);

  // DCC cannot edit form contents directly unless they are also a requester/requestee or Admin
  const dccContentEditBlocked = isDCC && !isAdmin && !isRequester && !isRequestee;

  const canEditPart1 = !dccContentEditBlocked && (isAdmin || !isEdit || isRequester);
  const canEditPart2 = !dccContentEditBlocked && (isAdmin || isRequestee);
  const canEditPart3 = !dccContentEditBlocked && (isAdmin || isRequestee);
  
  // Part 4 preconditions: Status must be ON_PROGRESS AND all steps in Part 3 completed
  const part3Completed = isPart3AllStepsCompleted({ actionPlans });
  const isPart4Eligible = status === CAR_INCIDENT_STATUS.ON_PROGRESS && part3Completed;
  const canEditPart4 = !dccContentEditBlocked && (isAdmin || isRequester) && isPart4Eligible;

  // Deputy Director signature permission
  const userEmail = (currentUser?.email || currentPersonnel?.email || '').toLowerCase().trim();
  const isDeputy =
    isAdmin ||
    userEmail === 'prasertsak.t@cit.kmutnb.ac.th' ||
    userEmail === 'tiawongsombat@gmail.com' ||
    currentPersonnel?.position?.includes('รองผู้อำนวยการฝ่ายบริหาร') ||
    currentPersonnel?.note?.includes('รองผู้อำนวยการฝ่ายบริหาร');

  // Handle NC Import from IA Report
  const handleImportFromNc = (audit) => {
    if (!audit) return;
    setTopic(audit.topic || IMS_AUDIT_TOPICS[0]);
    setStandard(audit.standard || IMS_STANDARDS[0]);
    setClauses(audit.clause || audit.clauses || '');
    setDescription(audit.findings || audit.description || '');
    setSourceAuditId(audit.id);
    setSourceAuditCode(audit.docNumber || audit.id);

    // Populate Requesters from Auditors
    if (Array.isArray(audit.auditors) && audit.auditors.length > 0) {
      setRequesters(audit.auditors.map((a) => ({ id: a.id || '', name: a.name || '', email: a.email || '', department: a.department || '' })));
    } else if (audit.auditor1Name) {
      setRequesters([
        { id: audit.auditor1Id || '1', name: audit.auditor1Name, email: audit.auditor1Email || '' },
        ...(audit.auditor2Name ? [{ id: audit.auditor2Id || '2', name: audit.auditor2Name, email: audit.auditor2Email || '' }] : []),
      ]);
    }

    // Populate Requestees from Auditees
    if (Array.isArray(audit.auditees) && audit.auditees.length > 0) {
      setRequestees(audit.auditees.map((a) => ({ id: a.id || '', name: a.name || '', email: a.email || '', department: a.department || '' })));
    }

    setShowNcImportModal(false);
  };

  // Add Requestee
  const handleAddRequestee = (person) => {
    if (!person) return;
    if (requestees.some((r) => r.id === person.id || (r.email && r.email === person.email))) return;
    setRequestees([
      ...requestees,
      {
        id: person.id,
        name: person.name,
        email: person.email,
        department: person.department || '',
      },
    ]);
  };

  // Remove Requestee
  const handleRemoveRequestee = (personId) => {
    setRequestees(requestees.filter((r) => r.id !== personId));
  };

  // Add Requester
  const handleAddRequester = (person) => {
    if (!person) return;
    if (requesters.some((r) => r.id === person.id || (r.email && r.email === person.email))) return;
    setRequesters([
      ...requesters,
      {
        id: person.id,
        name: person.name,
        email: person.email,
        department: person.department || '',
      },
    ]);
  };

  // Remove Requester
  const handleRemoveRequester = (personId) => {
    setRequesters(requesters.filter((r) => r.id !== personId));
  };

  // Part 3 Action Plans Row Operations
  const handleAddActionPlanStep = () => {
    setActionPlans([
      ...actionPlans,
      {
        id: `step-${Date.now()}-${actionPlans.length + 1}`,
        step: '',
        responsiblePerson: '',
        targetDate: '',
        completedDate: '',
        signature: '',
        remarks: '',
      },
    ]);
  };

  const handleUpdateActionPlanStep = (index, field, value) => {
    const updated = [...actionPlans];
    updated[index] = { ...updated[index], [field]: value };
    setActionPlans(updated);
  };

  const handleRemoveActionPlanStep = (index) => {
    if (actionPlans.length <= 1) return;
    setActionPlans(actionPlans.filter((_, i) => i !== index));
  };

  // Electronic Signature button for Action Step
  const handleSignStep = (index) => {
    const today = new Date().toISOString().split('T')[0];
    const signerName = currentPersonnel?.name || currentUser?.displayName || 'ผู้รับผิดชอบ';
    const updated = [...actionPlans];
    updated[index] = {
      ...updated[index],
      completedDate: updated[index].completedDate || today,
      signature: `${signerName} (${today})`,
      signedByEmail: currentUser?.email || currentPersonnel?.email || '',
      signedAt: new Date().toISOString(),
    };
    setActionPlans(updated);
  };

  // Electronic Signature for Deputy Director
  const handleSignExecutive = () => {
    const today = new Date().toISOString().split('T')[0];
    const signerName = currentPersonnel?.name || 'รศ. ดร.ประเสริฐศักดิ์ เตียวงศ์สมบัติ';
    setExecutiveSignature({
      name: signerName,
      position: 'รองผู้อำนวยการฝ่ายบริหาร',
      date: today,
      signedByEmail: currentUser?.email || currentPersonnel?.email || '',
      signedAt: new Date().toISOString(),
    });
  };

  // Evaluator Signature in Part 4
  const handleSignEvaluator = () => {
    const today = new Date().toISOString().split('T')[0];
    const signerName = currentPersonnel?.name || currentUser?.displayName || 'ผู้ตรวจติดตาม';
    setFollowUpAuditor({
      id: currentPersonnel?.id || 'aud',
      name: signerName,
      email: currentUser?.email || currentPersonnel?.email || '',
      date: today,
    });
    setFollowUpDate(today);
  };

  // Add Note
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const now = new Date().toISOString();
    const newNote = {
      id: `note-${Date.now()}`,
      authorName: currentPersonnel?.name || currentUser?.displayName || 'ผู้ใช้',
      authorEmail: currentUser?.email || currentPersonnel?.email || '',
      content: newNoteText.trim(),
      createdAt: now,
    };
    setNotes([newNote, ...notes]);
    setNewNoteText('');
  };

  // Submit Save
  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (!topic) {
      setErrorMsg('กรุณาเลือกหัวข้อตรวจติดตาม');
      setActiveTab('part1');
      return;
    }
    if (requesters.length === 0) {
      setErrorMsg('กรุณาระบุผู้ร้องขอการแก้ไขอย่างน้อย 1 ท่าน');
      setActiveTab('part1');
      return;
    }
    if (requestees.length === 0) {
      setErrorMsg('กรุณาเลือกผู้รับการร้องขอ/ผู้รับผิดชอบบริการอย่างน้อย 1 ท่าน');
      setActiveTab('part1');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('กรุณาระบุรายละเอียดปัญหา/ความไม่สอดคล้อง');
      setActiveTab('part1');
      return;
    }

    // Follow-up status rule:
    // If followUpResult is RESOLVED -> closed
    // If followUpResult is INEFFECTIVE -> remains ON_PROGRESS
    let finalStatus = status;
    if (followUpResult === 'RESOLVED') {
      finalStatus = CAR_INCIDENT_STATUS.CLOSED;
    } else if (followUpResult === 'INEFFECTIVE' && status === CAR_INCIDENT_STATUS.CLOSED) {
      finalStatus = CAR_INCIDENT_STATUS.ON_PROGRESS;
    }

    setIsSaving(true);
    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'ผู้บันทึก',
        email: currentUser?.email || currentPersonnel?.email || '',
      };

      const payload = {
        ...(record || {}),
        docType,
        fiscalYear,
        docNumber,
        status: finalStatus,
        standard,
        topic,
        clauses,
        sourceAuditId,
        sourceAuditCode,

        // Part 1
        requesters,
        requesterStatus,
        requesterStatusOther,
        problemStatus,
        requestDate,
        description,
        requestees,

        // Part 2
        immediateCorrection,
        rootCause,
        part2Date: part2Date || (immediateCorrection ? new Date().toISOString().split('T')[0] : ''),

        // Part 3
        actionPlans,
        executiveSignature,

        // Part 4
        followUpAuditor,
        followUpDate,
        followUpFindings,
        followUpResult,

        // Notes
        notes,
      };

      const saved = await saveCarIncident(payload, actor);
      if (onSaved) onSaved(saved);
      onClose();
    } catch (err) {
      console.error('Save CAR/Incident error:', err);
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
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
          maxWidth: '1050px',
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
            background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
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
                  color: '#FFFFFF',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.5px',
                }}
              >
                ICIT-FM-COMMON-013, 19 DEC 2025 Version 5.0
              </span>
              <span
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  color: '#CCFBF1',
                  fontSize: '0.725rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                เอกสารใช้ภายใน (Internal Use)
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
              {isEdit ? 'แก้ไขแบบฟอร์ม' : 'แบบฟอร์มขอปฏิบัติการแก้ไข'}: Corrective Action Request (CAR) & Incident
            </h2>
            <div style={{ fontSize: '0.825rem', color: '#CCFBF1', marginTop: '3px' }}>
              เลขที่: <strong>{docNumber || 'ระบบจะออกเลขอัตโนมัติเมื่อบันทึก'}</strong> &bull; ปีงบประมาณ: {fiscalYear}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Doc Type Switcher */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '3px',
                borderRadius: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setDocType('CAR')}
                style={{
                  background: docType === 'CAR' ? '#FFFFFF' : 'transparent',
                  color: docType === 'CAR' ? '#0F766E' : '#FFFFFF',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                CAR
              </button>
              <button
                type="button"
                onClick={() => setDocType('INCIDENT')}
                style={{
                  background: docType === 'INCIDENT' ? '#FFFFFF' : 'transparent',
                  color: docType === 'INCIDENT' ? '#0F766E' : '#FFFFFF',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Incident
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '7px',
                borderRadius: '8px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* DCC warning if content edit is locked */}
        {dccContentEditBlocked && (
          <div
            style={{
              padding: '0.65rem 1.75rem',
              backgroundColor: '#FEF3C7',
              borderBottom: '1px solid #FDE68A',
              color: '#92400E',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Lock size={15} />
            <span>
              <strong>โหมดผู้ควบคุมเอกสาร (DCC):</strong> ท่านสามารถจัดการสถานะและส่งแจ้งเตือนได้ แต่ไม่สามารถแก้ไขเนื้อหาในส่วนที่ 1-4 ได้ เพื่อรักษาความโปร่งใสของกระบวนการตรวจประเมิน
            </span>
          </div>
        )}

        {/* NC Import Action Bar */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '0.75rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: CAR_INCIDENT_STATUS_INFO[status]?.bg || '#F1F5F9',
                color: CAR_INCIDENT_STATUS_INFO[status]?.color || '#475569',
                border: `1px solid ${CAR_INCIDENT_STATUS_INFO[status]?.border || '#CBD5E1'}`,
              }}
            >
              สถานะ: {CAR_INCIDENT_STATUS_INFO[status]?.label || status}
            </span>
            {sourceAuditCode && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#0D9488',
                  background: '#ECFDF5',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #A7F3D0',
                }}
              >
                เชื่อมโยงจาก IA: {sourceAuditCode}
              </span>
            )}
          </div>

          {!isEdit && (
            <button
              type="button"
              onClick={() => setShowNcImportModal(true)}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                padding: '0.35rem 0.85rem',
                background: '#FFFFFF',
                border: '1px solid #0D9488',
                color: '#0D9488',
                fontWeight: 700,
              }}
            >
              <Download size={15} />
              <span>ดึงข้อมูลจากข้อบกพร่อง (NC) ในรอบปี</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            padding: '0 1.75rem',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'part1', label: 'ส่วนที่ 1: ผู้ร้องขอการแก้ไข', badge: requesters.length },
            { id: 'part2', label: 'ส่วนที่ 2: แนวทางแก้ไข & สาเหตุ', badge: immediateCorrection ? '✓' : '' },
            { id: 'part3', label: 'ส่วนที่ 3: แผน Corrective Actions', badge: actionPlans.length },
            { id: 'part4', label: 'ส่วนที่ 4: การตรวจติดตามผล', badge: followUpResult ? '✓' : '' },
            { id: 'notes', label: 'บันทึกเพิ่มเติม (Notes)', badge: notes.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.85rem 1.25rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab.id ? '3px solid #0D9488' : '3px solid transparent',
                color: activeTab === tab.id ? '#0D9488' : '#64748B',
                fontWeight: activeTab === tab.id ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{tab.label}</span>
              {tab.badge !== '' && (
                <span
                  style={{
                    backgroundColor: activeTab === tab.id ? '#0D9488' : '#E2E8F0',
                    color: activeTab === tab.id ? '#FFFFFF' : '#475569',
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '999px',
                    fontWeight: 700,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem' }}>
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
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ===================== TAB 1: ส่วนที่ 1 ===================== */}
          {activeTab === 'part1' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Classification Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Standard */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    มาตรฐาน (Standard) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={standard}
                    onChange={(e) => setStandard(e.target.value)}
                    disabled={!canEditPart1}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                    }}
                  >
                    {IMS_STANDARDS.map((std) => (
                      <option key={std} value={std}>
                        {std}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audit Topic (Predefined 23 Topics) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    หัวข้อตรวจติดตาม (Audit Topic - 23 รายการ) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={!canEditPart1}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                    }}
                  >
                    {IMS_AUDIT_TOPICS.map((top, idx) => (
                      <option key={top} value={top}>
                        {idx + 1}. {top}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clauses */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    ข้อกำหนดที่เกี่ยวข้อง (Clauses)
                  </label>
                  <input
                    type="text"
                    value={clauses}
                    onChange={(e) => setClauses(e.target.value)}
                    disabled={!canEditPart1}
                    placeholder="เช่น 8.2, 9.1 หรือ A.8.1"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                {/* Request Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    วันที่ร้องขอ (Request Date)
                  </label>
                  <input
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    disabled={!canEditPart1}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              {/* Status checkboxes matching template */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1.25rem',
                  background: '#F8FAFC',
                  padding: '1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                }}
              >
                {/* สถานะผู้ร้องขอการแก้ไข */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                    สถานะผู้ร้องขอการแก้ไข:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {[
                      { value: 'AUDITOR', label: 'ผู้ตรวจติดตามภายใน (Internal Auditor)' },
                      { value: 'CUSTOMER', label: 'ผู้รับบริการ (Customer / Service Recipient)' },
                      { value: 'OTHER', label: 'อื่นๆ' },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.825rem',
                          color: '#334155',
                          cursor: canEditPart1 ? 'pointer' : 'default',
                        }}
                      >
                        <input
                          type="radio"
                          name="requesterStatus"
                          value={opt.value}
                          checked={requesterStatus === opt.value}
                          onChange={(e) => setRequesterStatus(e.target.value)}
                          disabled={!canEditPart1}
                          style={{ accentColor: '#0D9488' }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                    {requesterStatus === 'OTHER' && (
                      <input
                        type="text"
                        value={requesterStatusOther}
                        onChange={(e) => setRequesterStatusOther(e.target.value)}
                        placeholder="ระบุสถานะอื่นๆ..."
                        disabled={!canEditPart1}
                        style={{
                          marginTop: '4px',
                          padding: '6px 10px',
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* สถานะปัญหา */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                    สถานะปัญหา:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {[
                      { value: 'INTERNAL', label: 'ปัญหาภายใน (Internal Problem)' },
                      { value: 'PREVENTIVE', label: 'ป้องกันปัญหา (Preventive Problem)' },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.825rem',
                          color: '#334155',
                          cursor: canEditPart1 ? 'pointer' : 'default',
                        }}
                      >
                        <input
                          type="radio"
                          name="problemStatus"
                          value={opt.value}
                          checked={problemStatus === opt.value}
                          onChange={(e) => setProblemStatus(e.target.value)}
                          disabled={!canEditPart1}
                          style={{ accentColor: '#0D9488' }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Requesters Selection */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155' }}>
                    (ส่วนที่ 1) ผู้ร้องขอการแก้ไข (Requesters / Internal Auditors) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    *รายชื่อผู้ร้องขอการแก้ไข และรายชื่อผู้ตรวจติดตามภายในเป็นกลุ่มเดียวกัน
                  </span>
                </div>

                {/* Selected Requesters Pills */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    minHeight: '44px',
                    backgroundColor: '#FFFFFF',
                    marginBottom: '6px',
                  }}
                >
                  {requesters.map((req) => (
                    <span
                      key={req.id || req.email}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#CCFBF1',
                        color: '#0F766E',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <User size={13} />
                      <span>{req.name}</span>
                      {canEditPart1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRequester(req.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#0F766E',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}
                  {requesters.length === 0 && (
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem', padding: '4px' }}>
                      ยังไม่ได้เลือกผู้ร้องขอการแก้ไข
                    </span>
                  )}
                </div>

                {/* Add from Internal Auditors List */}
                {canEditPart1 && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      onChange={(e) => {
                        const person = personnelList.find((p) => p.id === e.target.value);
                        if (person) handleAddRequester(person);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8rem',
                        flex: 1,
                      }}
                    >
                      <option value="">+ เพิ่มผู้ร้องขอ (เลือกจากรายชื่อบุคลากร/ผู้ตรวจติดตาม)</option>
                      {personnelList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.department || p.position || p.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Requestees Selection (ผู้รับการร้องขอ - มีได้มากกว่า 1 คน) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155' }}>
                    ผู้รับการร้องขอ / ผู้รับผิดชอบบริการ (Service Owner) / หัวหน้าฝ่าย <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    *สามารถเลือกได้มากกว่า 1 ท่าน (ผู้มีสิทธิ์จัดทำแนวทางแก้ไขในส่วนที่ 2 และ 3)
                  </span>
                </div>

                {/* Selected Requestees Pills */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    minHeight: '44px',
                    backgroundColor: '#FFFFFF',
                    marginBottom: '6px',
                  }}
                >
                  {requestees.map((req) => (
                    <span
                      key={req.id || req.email}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#FEF3C7',
                        color: '#92400E',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <User size={13} />
                      <span>{req.name}</span>
                      {canEditPart1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRequestee(req.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#92400E',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}
                  {requestees.length === 0 && (
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem', padding: '4px' }}>
                      ยังไม่ได้เลือกผู้รับการร้องขอ
                    </span>
                  )}
                </div>

                {canEditPart1 && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      onChange={(e) => {
                        const person = personnelList.find((p) => p.id === e.target.value);
                        if (person) handleAddRequestee(person);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8rem',
                        flex: 1,
                      }}
                    >
                      <option value="">+ เพิ่มผู้รับการร้องขอ (เลือกจากรายชื่อบุคลากร)</option>
                      {personnelList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.department || p.position || p.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Problem / Non-Conformity Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  รายละเอียดปัญหา / ความไม่สอดคล้อง <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canEditPart1}
                  rows={4}
                  placeholder="ระบุข้อเท็จจริง สิ่งที่พบ และความไม่สอดคล้องตามเกณฑ์หรือมาตรฐาน..."
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
            </div>
          )}

          {/* ===================== TAB 2: ส่วนที่ 2 ===================== */}
          {activeTab === 'part2' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!canEditPart2 && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    color: '#92400E',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Lock size={16} />
                  <span>
                    <strong>เฉพาะผู้รับการร้องขอ:</strong> ส่วนที่ 2 สามารถเสนอแนวทางการแก้ไขและสาเหตุโดยผู้รับการร้องขอ/ผู้รับผิดชอบบริการ (Service Owner) หรือ Admin เท่านั้น
                  </span>
                </div>
              )}

              {/* Immediate Correction */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  แนวทางการแก้ไขปัญหาเบื้องต้น (Correction actions)
                </label>
                <textarea
                  value={immediateCorrection}
                  onChange={(e) => setImmediateCorrection(e.target.value)}
                  disabled={!canEditPart2}
                  rows={4}
                  placeholder="ระบุมาตรการแก้ไขเฉพาะหน้าเพื่อบรรเทาความเสียหายในทันที..."
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

              {/* Root Cause */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  สาเหตุของปัญหา (Root Cause Analysis)
                </label>
                <textarea
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  disabled={!canEditPart2}
                  rows={4}
                  placeholder="ระบุสาเหตุที่แท้จริงของปัญหา (Why-Why Analysis / ก้างปลา)..."
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
            </div>
          )}

          {/* ===================== TAB 3: ส่วนที่ 3 ===================== */}
          {activeTab === 'part3' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!canEditPart3 && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    color: '#92400E',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Lock size={16} />
                  <span>
                    <strong>เฉพาะผู้รับการร้องขอ:</strong> ส่วนที่ 3 สามารถจัดทำแผน Corrective actions โดยผู้รับการร้องขอ หรือ Admin เท่านั้น
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                  การแก้ไขปัญหาเพื่อกำจัดสาเหตุของปัญหา / การดำเนินการป้องกัน (Corrective actions)
                </h3>
                {canEditPart3 && (
                  <button
                    type="button"
                    onClick={handleAddActionPlanStep}
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.775rem',
                      padding: '4px 10px',
                    }}
                  >
                    <Plus size={14} />
                    <span>เพิ่มขั้นตอน</span>
                  </button>
                )}
              </div>

              {/* Action Plans Table */}
              <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                      <th style={{ padding: '8px 10px', width: '40px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '8px 10px', minWidth: '220px', textAlign: 'left' }}>ขั้นตอนการปฏิบัติ</th>
                      <th style={{ padding: '8px 10px', width: '160px', textAlign: 'left' }}>ผู้รับผิดชอบ</th>
                      <th style={{ padding: '8px 10px', width: '130px', textAlign: 'left' }}>วันที่จะแล้วเสร็จ</th>
                      <th style={{ padding: '8px 10px', width: '130px', textAlign: 'left' }}>วันที่เสร็จ</th>
                      <th style={{ padding: '8px 10px', width: '170px', textAlign: 'center' }}>ลายมือชื่อผู้รับผิดชอบ</th>
                      <th style={{ padding: '8px 10px', minWidth: '130px', textAlign: 'left' }}>หมายเหตุ</th>
                      {canEditPart3 && <th style={{ padding: '8px 6px', width: '40px', textAlign: 'center' }}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {actionPlans.map((plan, idx) => (
                      <tr key={plan.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '6px' }}>
                          <input
                            type="text"
                            value={plan.step}
                            onChange={(e) => handleUpdateActionPlanStep(idx, 'step', e.target.value)}
                            disabled={!canEditPart3}
                            placeholder="ระบุขั้นตอนการแก้ไขเพื่อกำจัดสาเหตุ..."
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.8rem',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px' }}>
                          <input
                            type="text"
                            value={plan.responsiblePerson}
                            onChange={(e) => handleUpdateActionPlanStep(idx, 'responsiblePerson', e.target.value)}
                            disabled={!canEditPart3}
                            placeholder="ชื่อผู้รับผิดชอบ"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.8rem',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px' }}>
                          <input
                            type="date"
                            value={plan.targetDate}
                            onChange={(e) => handleUpdateActionPlanStep(idx, 'targetDate', e.target.value)}
                            disabled={!canEditPart3}
                            style={{
                              width: '100%',
                              padding: '5px 6px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.775rem',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px' }}>
                          <input
                            type="date"
                            value={plan.completedDate}
                            onChange={(e) => handleUpdateActionPlanStep(idx, 'completedDate', e.target.value)}
                            disabled={!canEditPart3}
                            style={{
                              width: '100%',
                              padding: '5px 6px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.775rem',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          {plan.signature ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#ECFDF5',
                                color: '#059669',
                                border: '1px solid #A7F3D0',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              <CheckCircle2 size={13} />
                              <span>{plan.signature}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSignStep(idx)}
                              className="btn btn-secondary btn-sm"
                              style={{
                                fontSize: '0.725rem',
                                padding: '3px 8px',
                                background: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #BFDBFE',
                              }}
                            >
                              ลงชื่อยืนยัน
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '6px' }}>
                          <input
                            type="text"
                            value={plan.remarks || ''}
                            onChange={(e) => handleUpdateActionPlanStep(idx, 'remarks', e.target.value)}
                            disabled={!canEditPart3}
                            placeholder="หมายเหตุ"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.8rem',
                            }}
                          />
                        </td>
                        {canEditPart3 && (
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveActionPlanStep(idx)}
                              disabled={actionPlans.length <= 1}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: actionPlans.length <= 1 ? '#CBD5E1' : '#DC2626',
                                cursor: actionPlans.length <= 1 ? 'not-allowed' : 'pointer',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Executive Sign-off Block */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                    รองผู้อำนวยการฝ่ายบริหาร / ตัวแทนฝ่ายบริหาร
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                    {executiveSignature ? (
                      <span style={{ color: '#059669', fontWeight: 600 }}>
                        ✓ ลงนามรับทราบแล้ว: {executiveSignature.name} ({executiveSignature.date})
                      </span>
                    ) : (
                      'รอดำเนินการลงนามรับทราบแผนงาน'
                    )}
                  </div>
                </div>

                {isDeputy && !executiveSignature && (
                  <button
                    type="button"
                    onClick={handleSignExecutive}
                    className="btn btn-primary btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>ลงชื่อรับทราบในฐานะรองผู้อำนวยการฝ่ายบริหาร</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ===================== TAB 4: ส่วนที่ 4 ===================== */}
          {activeTab === 'part4' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!isPart4Eligible && (
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <AlertOctagon size={18} style={{ marginTop: '2px' }} />
                  <div>
                    <strong>เงื่อนไขการตรวจติดตามผล (Part 4 Preconditions):</strong>
                    <div style={{ marginTop: '4px' }}>
                      เอกสารต้องอยู่ในสถานะ <strong>กำลังดำเนินการ (On Progress)</strong> และต้องดำเนินการตามขั้นตอนในส่วนที่ 3 ครบถ้วนทุกข้อ (มีวันที่เสร็จและลงชื่อยืนยันครบ) ก่อน จึงจะสามารถบันทึกผลการตรวจติดตามได้
                    </div>
                  </div>
                </div>
              )}

              {/* Follow-up Findings */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  การตรวจติดตามผลการแก้ไข และสิ่งที่พบจากการติดตามผลการแก้ไข
                </label>
                <textarea
                  value={followUpFindings}
                  onChange={(e) => setFollowUpFindings(e.target.value)}
                  disabled={!canEditPart4}
                  rows={4}
                  placeholder="ระบุสิ่งที่พบจากการติดตาม สุ่มตรวจเอกสาร หลักฐาน หรือการปฏิบัติงานจริง..."
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

              {/* Follow-up Result Radio Options */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.65rem' }}>
                  ผลการติดตาม (Follow-up Evaluation Result):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1.5px solid ${followUpResult === 'RESOLVED' ? '#10B981' : '#E2E8F0'}`,
                      background: followUpResult === 'RESOLVED' ? '#ECFDF5' : '#FFFFFF',
                      cursor: canEditPart4 ? 'pointer' : 'default',
                    }}
                  >
                    <input
                      type="radio"
                      name="followUpResult"
                      value="RESOLVED"
                      checked={followUpResult === 'RESOLVED'}
                      onChange={(e) => setFollowUpResult(e.target.value)}
                      disabled={!canEditPart4}
                      style={{ marginTop: '3px', accentColor: '#059669' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065F46' }}>
                        สามารถแก้ไข / ป้องกันปัญหาได้ (Resolved & Effective)
                      </div>
                      <div style={{ fontSize: '0.775rem', color: '#047857' }}>
                        เมื่อเลือกผลนี้ เอกสารจะถูกปรับสถานะเป็น <strong>Closed (ปิดสมบูรณ์)</strong> และไม่สามารถลบเอกสารได้
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1.5px solid ${followUpResult === 'INEFFECTIVE' ? '#F59E0B' : '#E2E8F0'}`,
                      background: followUpResult === 'INEFFECTIVE' ? '#FFFBEB' : '#FFFFFF',
                      cursor: canEditPart4 ? 'pointer' : 'default',
                    }}
                  >
                    <input
                      type="radio"
                      name="followUpResult"
                      value="INEFFECTIVE"
                      checked={followUpResult === 'INEFFECTIVE'}
                      onChange={(e) => setFollowUpResult(e.target.value)}
                      disabled={!canEditPart4}
                      style={{ marginTop: '3px', accentColor: '#D97706' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400E' }}>
                        ไม่สามารถแก้ไข / ไม่สามารถป้องกันได้อย่างมีประสิทธิภาพ (Ineffective)
                      </div>
                      <div style={{ fontSize: '0.775rem', color: '#B45309' }}>
                        สถานะจะคงเป็น <strong>On Progress</strong> และผู้ร้องขอการแก้ไขสามารถเสนอขั้นตอนการแก้ไขปัญหาเพื่อกำจัดสาเหตุรอบใหม่ได้
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Evaluator Confirmation Signature */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155' }}>
                    ผู้ตรวจติดตามภายใน / ผู้ที่ได้รับมอบหมาย
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    {followUpAuditor ? `${followUpAuditor.name} (${followUpDate || followUpAuditor.date})` : 'ยังไม่ได้ลงชื่อตรวจติดตาม'}
                  </div>
                </div>

                {canEditPart4 && !followUpAuditor && (
                  <button
                    type="button"
                    onClick={handleSignEvaluator}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem' }}
                  >
                    ลงชื่อยืนยันการตรวจติดตาม
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ===================== TAB 5: NOTES & REMARKS ===================== */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="พิมพ์บันทึกข้อความ หมายเหตุ หรือการประสานงาน..."
                  rows={2}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={!newNoteText.trim()}
                  className="btn btn-primary btn-sm"
                  style={{
                    alignSelf: 'flex-end',
                    background: '#0D9488',
                    border: 'none',
                    padding: '0.5rem 1rem',
                  }}
                >
                  <Send size={15} />
                  <span>บันทึก</span>
                </button>
              </div>

              {/* Notes List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.825rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>{note.authorName}</span>
                      <span>{new Date(note.createdAt).toLocaleString('th-TH')}</span>
                    </div>
                    <div style={{ color: '#1E293B', whiteSpace: 'pre-wrap' }}>{note.content}</div>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', padding: '2rem' }}>
                    ยังไม่มีบันทึกข้อความเพิ่มเติม
                  </div>
                )}
              </div>
            </div>
          )}
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
            <span>กดปุ่ม <strong>บันทึกข้อมูล</strong> เพื่อจัดเก็บลงฐานข้อมูลและแจ้งเตือนผู้เกี่ยวข้อง</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
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
                background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
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
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* NC Import Modal Selector */}
      {showNcImportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowNcImportModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                เลือกข้อบกพร่อง (NC) จากรายงานการตรวจติดตาม
              </h3>
              <button
                type="button"
                onClick={() => setShowNcImportModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {availableNcAudits && availableNcAudits.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {availableNcAudits.map((audit) => (
                    <div
                      key={audit.id}
                      onClick={() => handleImportFromNc(audit)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        backgroundColor: '#FFFFFF',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#0D9488';
                        e.currentTarget.style.backgroundColor = '#F0FDFA';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, color: '#0D9488', fontSize: '0.85rem' }}>
                          {audit.docNumber || audit.id}
                        </span>
                        <span
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          NC (ข้อบกพร่อง)
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                        {audit.topic}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', whiteSpace: 'pre-wrap' }}>
                        {audit.findings || audit.description || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>
                  ไม่พบรายงานการตรวจที่มีผลเป็น NC ในรอบปีงบประมาณนี้
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
