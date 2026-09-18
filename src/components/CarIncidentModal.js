'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Layers,
  History,
  MessageSquareQuote,
  CheckSquare,
  XCircle,
  Info,
} from 'lucide-react';
import {
  IMS_STANDARDS,
  IMS_AUDIT_TOPICS,
} from '../lib/constants';
import { subscribeImsAuditTopics, isMrUser } from '../lib/imsService';
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
  approveActionPlanByAuditor,
  requestActionPlanRevision,
} from '../lib/carIncidentService';

const CAR_TABS = [
  {
    id: 'part1',
    num: 1,
    label: 'ส่วนที่ 1: ผู้ร้องขอการแก้ไข',
    shortLabel: '1. ข้อมูลทั่วไป & ผู้ร้องขอ',
    icon: Users,
    desc: 'ข้อมูลทั่วไป, ผู้ร้องขอ, รายละเอียดข้อบกพร่อง, ผู้รับการแก้ไข',
  },
  {
    id: 'part2',
    num: 2,
    label: 'ส่วนที่ 2: แนวทางแก้ไข & สาเหตุ',
    shortLabel: '2. แก้ไขเบื้องต้น & สาเหตุ',
    icon: AlertOctagon,
    desc: 'การแก้ไขทันที (Immediate Correction) & การวิเคราะห์สาเหตุ (Root Cause)',
  },
  {
    id: 'part3',
    num: 3,
    label: 'ส่วนที่ 3: แผน Corrective Actions',
    shortLabel: '3. แผน Corrective Actions',
    icon: Layers,
    desc: 'ขั้นตอนปฏิบัติการแก้ไข, ผู้รับผิดชอบ, กำหนดเสร็จ, ลงนาม MR',
  },
  {
    id: 'part4',
    num: 4,
    label: 'ส่วนที่ 4: การตรวจติดตามผล',
    shortLabel: '4. การตรวจติดตามผล',
    icon: ShieldCheck,
    desc: 'ผลการตรวจติดตามการแก้ไข, ปิดเอกสาร CAR โดยผู้ตรวจติดตาม',
  },
  {
    id: 'notes',
    num: 5,
    label: 'บันทึกเพิ่มเติม (Notes)',
    shortLabel: '5. บันทึกเพิ่มเติม (Notes)',
    icon: MessageSquare,
    desc: 'ข้อความสื่อสารภายในและข้อคิดเห็นระหว่างผู้เกี่ยวข้อง',
  },
];

export default function CarIncidentModal({
  isOpen,
  onClose,
  record,
  defaultYear = '2569',
  currentUser,
  currentPersonnel,
  personnelList = [],
  yearlyConfig = {},
  availableNcAudits = [],
  isAdmin,
  onSaved,
}) {
  const isEdit = Boolean(record && record.id);
  const [topicsList, setTopicsList] = useState(IMS_AUDIT_TOPICS || []);

  // Form State
  const [docType, setDocType] = useState(record?.docType || 'CAR');
  const [fiscalYear, setFiscalYear] = useState(record?.fiscalYear || defaultYear || '2569');
  const [docNumber, setDocNumber] = useState(record?.docNumber || '');
  const [status, setStatus] = useState(record?.status || CAR_INCIDENT_STATUS.NOT_YET_APPROVED);
  const [standard, setStandard] = useState(record?.standard || IMS_STANDARDS[1] || 'ISO 9001:2015');
  const [topic, setTopic] = useState(record?.topic || IMS_AUDIT_TOPICS[0] || '');
  const [clauses, setClauses] = useState(record?.clauses || '');

  // Subscribe to dynamic audit topics
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeImsAuditTopics((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setTopicsList(data);
      }
    });
    return () => unsub && unsub();
  }, [isOpen]);

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
    record?.actionPlans && record?.actionPlans.length > 0
      ? record?.actionPlans
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
  const [executiveSignature, setExecutiveSignature] = useState(record?.executiveSignature || null);
  const [auditorApproval, setAuditorApproval] = useState(record?.auditorApproval || null);
  const [reviewComments, setReviewComments] = useState(record?.reviewComments || []);

  // Part 4
  const [followUpDate, setFollowUpDate] = useState(record?.followUpDate || '');
  const [followUpFindings, setFollowUpFindings] = useState(record?.followUpFindings || '');
  const [followUpResult, setFollowUpResult] = useState(record?.followUpResult || '');
  const [followUpAuditor, setFollowUpAuditor] = useState(record?.followUpAuditor || null);
  const [followUpHistory, setFollowUpHistory] = useState(record?.followUpHistory || []);

  // Notes
  const [notes, setNotes] = useState(record?.notes || []);
  const [newNoteText, setNewNoteText] = useState('');

  // Source IA link
  const [sourceAuditId, setSourceAuditId] = useState(record?.sourceAuditId || null);
  const [sourceAuditCode, setSourceAuditCode] = useState(record?.sourceAuditCode || null);

  // Sub-Modals & Workflow States
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionCommentInput, setRevisionCommentInput] = useState('');
  const [showCommentsHistoryModal, setShowCommentsHistoryModal] = useState(false);
  const [showFollowUpHistoryModal, setShowFollowUpHistoryModal] = useState(false);
  const [isAuditorSubmitting, setIsAuditorSubmitting] = useState(false);

  // UI States
  const [activeTab, setActiveTab] = useState('part1'); // 'part1', 'part2', 'part3', 'part4', 'notes'
  const [showNcImportModal, setShowNcImportModal] = useState(false);
  const [ncSearchQuery, setNcSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchPersonnelKeyword, setSearchPersonnelKeyword] = useState('');

  // Navigation helpers & modal scroll ref (JD Modal style)
  const modalBodyRef = useRef(null);

  const currentTabIndex = useMemo(() => {
    const idx = CAR_TABS.findIndex((t) => t.id === activeTab);
    return idx >= 0 ? idx : 0;
  }, [activeTab]);

  const prevTab = currentTabIndex > 0 ? CAR_TABS[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex < CAR_TABS.length - 1 ? CAR_TABS[currentTabIndex + 1] : null;

  const goToTab = (tabId) => {
    setActiveTab(tabId);
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevTab = () => {
    if (prevTab) goToTab(prevTab.id);
  };

  const handleNextTab = () => {
    if (nextTab) goToTab(nextTab.id);
  };

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
      setAuditorApproval(record.auditorApproval || null);
      setReviewComments(record.reviewComments || []);

      setFollowUpDate(record.followUpDate || '');
      setFollowUpFindings(record.followUpFindings || '');
      setFollowUpResult(record.followUpResult || '');
      setFollowUpAuditor(record.followUpAuditor || null);
      setFollowUpHistory(record.followUpHistory || []);
      setNotes(record.notes || []);
      setSourceAuditId(record.sourceAuditId || null);
      setSourceAuditCode(record.sourceAuditCode || null);
    } else {
      // Default for new
      setDocType('CAR');
      setFiscalYear(defaultYear || '2569');
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
      setAuditorApproval(null);
      setReviewComments([]);

      setFollowUpDate('');
      setFollowUpFindings('');
      setFollowUpResult('');
      setFollowUpAuditor(null);
      setFollowUpHistory([]);
      setNotes([]);
      setSourceAuditId(null);
      setSourceAuditCode(null);
    }
    setErrorMsg('');
  }, [record, isOpen, defaultYear]);

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

  // MR (Management Representative) signature permission (เฉพาะ MR ของปีนี้ หรือ Admin)
  const isMR = isAdmin || isMrUser(currentUser, currentPersonnel, yearlyConfig);

  // Handle NC Import from IA Report
  const handleImportFromNc = (audit) => {
    if (!audit) return;
    if (audit.auditYear || audit.fiscalYear) {
      setFiscalYear(String(audit.auditYear || audit.fiscalYear));
    }
    setTopic(audit.topic || IMS_AUDIT_TOPICS[0]);
    setStandard(audit.isoStandard || audit.standard || IMS_STANDARDS[0]);
    setClauses(audit.clauses || audit.clause || '');
    setDescription(audit.findings || audit.description || '');
    setSourceAuditId(audit.id);
    setSourceAuditCode(audit.auditCode || audit.docNumber || audit.id);

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
    setRequestees([...requestees, { id: person.id, name: person.name, email: person.email, department: person.department || '' }]);
  };

  // Remove Requestee
  const handleRemoveRequestee = (id) => {
    setRequestees(requestees.filter((r) => r.id !== id));
  };

  // Add Requester
  const handleAddRequester = (person) => {
    if (!person) return;
    if (requesters.some((r) => r.id === person.id || (r.email && r.email === person.email))) return;
    setRequesters([...requesters, { id: person.id, name: person.name, email: person.email, department: person.department || '' }]);
  };

  // Remove Requester
  const handleRemoveRequester = (id) => {
    setRequesters(requesters.filter((r) => r.id !== id));
  };

  // Action Plan Row Handlers
  const handleAddActionPlanStep = () => {
    const newStep = {
      id: `step-${Date.now()}-${actionPlans.length + 1}`,
      step: '',
      responsiblePerson: '',
      targetDate: '',
      completedDate: '',
      signature: '',
      remarks: '',
    };
    setActionPlans([...actionPlans, newStep]);
  };

  const handleUpdateActionPlanStep = (index, field, value) => {
    const updated = [...actionPlans];
    updated[index] = { ...updated[index], [field]: value };
    setActionPlans(updated);
  };

  const handleRemoveActionPlanStep = (index) => {
    if (actionPlans.length <= 1) return;
    setActionPlans(actionPlans.filter((_, idx) => idx !== index));
  };

  // Signature Confirmations & Workflow Actions
  const handleSignActionStep = async (stepId) => {
    try {
      const updatedPlans = confirmActionStepSignature(actionPlans, stepId, currentUser, currentPersonnel);
      setActionPlans(updatedPlans);
    } catch (err) {
      setErrorMsg(err.message || 'ไม่สามารถลงนามในขั้นตอนนี้ได้');
    }
  };

  const handleAuditorApprove = async () => {
    if (!window.confirm('ยืนยันการเห็นชอบและอนุมัติแผนปฏิบัติการแก้ไข (Correction & Action Plan)?\n\nระบบจะบันทึกการอนุมัติและส่งอีเมลแจ้งเตือนไปยัง MR เพื่อดำเนินการลงชื่อรับทราบ')) {
      return;
    }
    setIsAuditorSubmitting(true);
    try {
      const actor = {
        id: currentPersonnel?.id || currentUser?.uid || 'auditor',
        name: currentPersonnel?.name || currentUser?.displayName || 'ผู้ตรวจติดตาม',
        email: currentUser?.email || currentPersonnel?.email || '',
        role: 'ผู้ตรวจติดตาม (Auditor)',
      };

      const approvalObj = {
        approved: true,
        auditorId: actor.id,
        auditorName: actor.name,
        auditorEmail: actor.email,
        approvedAt: new Date().toISOString(),
        comment: 'เห็นชอบและอนุมัติแผนปฏิบัติการแก้ไข',
      };

      setAuditorApproval(approvalObj);
      if (status === CAR_INCIDENT_STATUS.NOT_YET_APPROVED) {
        setStatus(CAR_INCIDENT_STATUS.ON_PROGRESS);
      }

      if (isEdit && record?.id) {
        await approveActionPlanByAuditor(record.id, actor, yearlyConfig);
      }
      alert('✅ บันทึกการเห็นชอบแผนงานเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Auditor approval error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการอนุมัติแผนงาน');
    } finally {
      setIsAuditorSubmitting(false);
    }
  };

  const handleSubmitRevision = async () => {
    if (!revisionCommentInput.trim()) {
      alert('กรุณาระบุข้อคิดเห็น/สิ่งที่ต้องการให้ปรับปรุงแก้ไข');
      return;
    }
    setIsAuditorSubmitting(true);
    try {
      const actor = {
        id: currentPersonnel?.id || currentUser?.uid || 'auditor',
        name: currentPersonnel?.name || currentUser?.displayName || 'ผู้ตรวจติดตาม',
        email: currentUser?.email || currentPersonnel?.email || '',
      };
      const now = new Date().toISOString();
      const newComment = {
        id: `rev-${Date.now()}`,
        text: revisionCommentInput.trim(),
        authorId: actor.id,
        authorName: actor.name,
        authorEmail: actor.email,
        createdAt: now,
        role: 'ผู้ตรวจติดตาม (Auditor)',
      };

      setReviewComments((prev) => [...prev, newComment]);
      setAuditorApproval({
        approved: false,
        auditorId: actor.id,
        auditorName: actor.name,
        auditorEmail: actor.email,
        revisedAt: now,
        comment: revisionCommentInput.trim(),
      });

      if (isEdit && record?.id) {
        await requestActionPlanRevision(record.id, revisionCommentInput.trim(), actor, yearlyConfig);
      }

      setShowRevisionModal(false);
      setRevisionCommentInput('');
      alert('✉️ บันทึกข้อคิดเห็นและส่งแจ้งเตือนผู้รับการตรวจเพื่อแก้ไขเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Request revision error:', err);
      alert(err.message || 'เกิดข้อผิดพลาดในการส่งข้อคิดเห็น');
    } finally {
      setIsAuditorSubmitting(false);
    }
  };

  const handleSignExecutive = () => {
    try {
      const sig = confirmExecutiveSignature(currentUser, currentPersonnel, auditorApproval, isAdmin);
      setExecutiveSignature(sig);
    } catch (err) {
      setErrorMsg(err.message || 'ไม่สามารถลงชื่อรับทราบในฐานะ MR ได้');
    }
  };

  const handleSignEvaluator = () => {
    const name = currentPersonnel?.name || currentUser?.displayName || currentUser?.email || 'ผู้ตรวจติดตาม';
    const date = followUpDate || new Date().toISOString().split('T')[0];
    const auditorObj = {
      id: currentPersonnel?.id || currentUser?.uid || 'auditor',
      name,
      email: currentUser?.email || currentPersonnel?.email || '',
      date,
    };
    setFollowUpAuditor(auditorObj);
    setFollowUpDate(date);

    // Record entry into followUpHistory if findings or result are provided
    if (followUpFindings || followUpResult) {
      const historyEntry = {
        id: `fu-${Date.now()}`,
        followUpDate: date,
        followUpFindings: followUpFindings || '',
        followUpResult: followUpResult || '',
        followUpAuditor: auditorObj,
        recordedAt: new Date().toISOString(),
      };
      setFollowUpHistory((prev) => [...(prev || []), historyEntry]);
    }
  };

  // Add Note
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const now = new Date().toISOString();
    const newNote = {
      id: `note-${Date.now()}`,
      authorId: currentPersonnel?.id || currentUser?.uid || 'usr',
      authorName: currentPersonnel?.name || currentUser?.displayName || currentUser?.email || 'ผู้ใช้งาน',
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
      modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (requesters.length === 0) {
      setErrorMsg('กรุณาระบุผู้ร้องขอการแก้ไขอย่างน้อย 1 ท่าน');
      modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (requestees.length === 0) {
      setErrorMsg('กรุณาเลือกผู้รับการร้องขอ/ผู้รับผิดชอบบริการอย่างน้อย 1 ท่าน');
      modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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
        auditorApproval,
        reviewComments,

        // Part 4
        followUpAuditor,
        followUpDate,
        followUpFindings,
        followUpResult,
        followUpHistory,

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

        {/* Smart Step Navigator & Quick-Jump Helper Strip (JD Modal Style) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.45rem 1.25rem',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            fontSize: '0.8rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
            flexShrink: 0,
          }}
        >
          {/* Left: Step indicator & interactive 5-step number buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  background: '#0D9488',
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.3px',
                }}
              >
                ส่วนที่ {currentTabIndex + 1}/5
              </span>
              <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.82rem' }}>
                {CAR_TABS[currentTabIndex]?.shortLabel || CAR_TABS[currentTabIndex]?.label}
              </span>
            </div>

            {/* Quick 5 Step Number Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {CAR_TABS.map((t, idx) => {
                const isCurrent = idx === currentTabIndex;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => goToTab(t.id)}
                    title={`ไปยัง ${t.label}`}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: isCurrent ? '1.5px solid #0D9488' : '1px solid #CBD5E1',
                      background: isCurrent ? '#0D9488' : '#FFFFFF',
                      color: isCurrent ? '#FFFFFF' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {t.num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Quick jump dropdown + mini Prev/Next buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>ไปยังส่วนที่:</span>
              <select
                value={activeTab}
                onChange={(e) => goToTab(e.target.value)}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#1E293B',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {CAR_TABS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Prev / Next Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={handlePrevTab}
                disabled={!prevTab}
                title={prevTab ? `ย้อนกลับ: ${prevTab.label}` : 'อยู่ที่ส่วนแรกแล้ว'}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: prevTab ? '#FFFFFF' : '#F1F5F9',
                  color: prevTab ? '#1E293B' : '#94A3B8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: prevTab ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <ChevronLeft size={13} />
                <span>ก่อนหน้า</span>
              </button>

              <button
                type="button"
                onClick={handleNextTab}
                disabled={!nextTab}
                title={nextTab ? `ถัดไป: ${nextTab.label}` : 'อยู่ที่ส่วนสุดท้ายแล้ว'}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid #0D9488',
                  background: nextTab ? '#0D9488' : '#F1F5F9',
                  color: nextTab ? '#FFFFFF' : '#94A3B8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: nextTab ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span>ถัดไป</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* 5 Button Navigation Bar (Pills with real-time status indicators) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            background: '#F1F5F9',
            borderBottom: '1px solid #E2E8F0',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {CAR_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;

            // Real-time badges for each section
            let badge = null;
            if (tab.id === 'part1' && requesters.length > 0) {
              badge = `${requesters.length} คน`;
            } else if (tab.id === 'part2' && (immediateCorrection || rootCause)) {
              badge = '✓ ระบุแล้ว';
            } else if (tab.id === 'part3' && actionPlans.length > 0) {
              badge = `${actionPlans.length} ขั้นตอน`;
            } else if (tab.id === 'part4' && followUpResult) {
              badge = followUpResult === 'RESOLVED' ? '✓ สำเร็จ' : 'ไม่สำเร็จ';
            } else if (tab.id === 'notes' && notes.length > 0) {
              badge = `${notes.length}`;
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => goToTab(tab.id)}
                style={{
                  flex: '1 0 auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: isActive ? '1.5px solid #0D9488' : '1px solid #CBD5E1',
                  background: isActive ? 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#334155',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 4px rgba(13, 148, 136, 0.25)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <TabIcon size={15} style={{ color: isActive ? '#FFFFFF' : '#0D9488' }} />
                <span>{tab.shortLabel}</span>
                {badge && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                      color: isActive ? '#FFFFFF' : '#475569',
                      fontWeight: 700,
                      marginLeft: '2px',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div ref={modalBodyRef} style={{ flex: 1, overflowY: 'auto', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
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
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ===================== ส่วนที่ 1: การแจ้ง CAR/Incident ===================== */}
          {activeTab === 'part1' && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #F1F5F9',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                  }}
                >
                  1
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    ส่วนที่ 1: การแจ้ง CAR / Incident (ข้อมูลทั่วไปและประเด็นปัญหา)
                  </h3>
                  <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                    ข้อมูลการตรวจประเมิน ผู้ร้องขอ รายละเอียดความไม่สอดคล้อง และผู้รับการร้องขอ
                  </div>
                </div>
              </div>
            </div>

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
                  หัวข้อตรวจติดตาม (Audit Topic) <span style={{ color: '#DC2626' }}>*</span>
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
                  {topicsList.map((top, idx) => (
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
                </div>

                {requesterStatus === 'OTHER' && (
                  <input
                    type="text"
                    value={requesterStatusOther}
                    onChange={(e) => setRequesterStatusOther(e.target.value)}
                    disabled={!canEditPart1}
                    placeholder="โปรดระบุสถานะผู้ร้องขอ..."
                    style={{
                      marginTop: '6px',
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.8rem',
                    }}
                  />
                )}
              </div>

              {/* สถานะของปัญหา */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                  สถานะของปัญหา (Problem Source):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[
                    { value: 'INTERNAL', label: 'เกิดจากการตรวจติดตามภายใน (Internal Audit Finding)' },
                    { value: 'EXTERNAL', label: 'เกิดจากผู้รับบริการภายนอก / เหตุการณ์จริง' },
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

            {/* Requesters Selection (ผู้ร้องขอการแก้ไข - มีได้มากกว่า 1 คน) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155' }}>
                  ผู้ร้องขอการแก้ไข (Requesters / Auditors) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  *สามารถระบุได้มากกว่า 1 ท่าน (ผู้มีสิทธิ์ตรวจติดตามผลในส่วนที่ 4)
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
                      background: '#ECFDF5',
                      color: '#065F46',
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
                          color: '#065F46',
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
                    ยังไม่ได้เลือกผู้ร้องขอ
                  </span>
                )}
              </div>

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
                    <option value="">+ เพิ่มผู้ร้องขอ (เลือกจากรายชื่อบุคลากร)</option>
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

        {/* ===================== ส่วนที่ 2: การวิเคราะห์สาเหตุและแนวทางแก้ไขเบื้องต้น ===================== */}
        {activeTab === 'part2' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #F1F5F9',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                  }}
                >
                  2
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    ส่วนที่ 2: การวิเคราะห์สาเหตุและแนวทางแก้ไขเบื้องต้น
                  </h3>
                  <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                    การแก้ไขทันที (Immediate Correction) และการวิเคราะห์สาเหตุที่แท้จริง (Root Cause Analysis)
                  </div>
                </div>
              </div>
            </div>

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

        {/* ===================== ส่วนที่ 3: แผนปฏิบัติการแก้ไขและลงนาม MR ===================== */}
        {activeTab === 'part3' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #F1F5F9',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                  }}
                >
                  3
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    ส่วนที่ 3: แผนปฏิบัติการแก้ไข ป้องกัน และจัดการความเสี่ยง (Corrective Actions)
                  </h3>
                  <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                    ขั้นตอนปฏิบัติการแก้ไข ผู้รับผิดชอบ กำหนดเสร็จ และการลงนามรับทราบโดย MR
                  </div>
                </div>
              </div>

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
                          canEditPart3 && (
                            <button
                              type="button"
                              onClick={() => handleSignActionStep(plan.id)}
                              className="btn btn-secondary btn-sm"
                              style={{
                                fontSize: '0.75rem',
                                padding: '3px 8px',
                                background: '#F8FAFC',
                              }}
                            >
                              ลงชื่อยืนยัน
                            </button>
                          )
                        )}
                      </td>
                      <td style={{ padding: '6px' }}>
                        <input
                          type="text"
                          value={plan.remarks}
                          onChange={(e) => handleUpdateActionPlanStep(idx, 'remarks', e.target.value)}
                          disabled={!canEditPart3}
                          placeholder="หมายเหตุเพิ่มเติม"
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

            {/* Auditor Review & Approval Card */}
            <div
              style={{
                background: auditorApproval?.approved
                  ? '#F0FDF4'
                  : auditorApproval?.approved === false
                  ? '#FFFBEB'
                  : '#F8FAFC',
                padding: '1.25rem',
                borderRadius: '10px',
                border: `1.5px solid ${
                  auditorApproval?.approved
                    ? '#86EFAC'
                    : auditorApproval?.approved === false
                    ? '#FDE68A'
                    : '#CBD5E1'
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck
                    size={20}
                    color={
                      auditorApproval?.approved
                        ? '#16A34A'
                        : auditorApproval?.approved === false
                        ? '#D97706'
                        : '#64748B'
                    }
                  />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                      การพิจารณาเห็นชอบแผนงานโดยผู้ตรวจติดตาม (Auditor Review & Approval)
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                      ผู้ตรวจติดตามต้องพิจารณาเห็นชอบแนวทางแก้ไขเบื้องต้นและแผน Corrective Actions ก่อน MR ลงนาม
                    </div>
                  </div>
                </div>

                {/* Comments History Trigger */}
                <button
                  type="button"
                  onClick={() => setShowCommentsHistoryModal(true)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.75rem',
                    padding: '3px 8px',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#475569',
                  }}
                >
                  <MessageSquareQuote size={13} color="#0D9488" />
                  <span>ดูประวัติข้อคิดเห็น ({reviewComments.length})</span>
                </button>
              </div>

              {/* Approval Status Display */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.825rem',
                }}
              >
                {auditorApproval?.approved ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 700 }}>
                    <CheckCircle2 size={16} />
                    <span>
                      ✓ เห็นชอบและอนุมัติแผนงานแล้ว โดย {auditorApproval.auditorName || 'ผู้ตรวจติดตาม'}
                      {auditorApproval.approvedAt && (
                        <span style={{ fontWeight: 400, color: '#64748B', marginLeft: '6px' }}>
                          ({new Date(auditorApproval.approvedAt).toLocaleDateString('th-TH')})
                        </span>
                      )}
                    </span>
                  </div>
                ) : auditorApproval?.approved === false ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#D97706' }}>
                    <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>ผู้ตรวจติดตามขอให้ปรับปรุงแก้ไขแผนงาน:</div>
                      <div style={{ color: '#475569', marginTop: '2px', whiteSpace: 'pre-wrap' }}>
                        &ldquo;{auditorApproval.comment || auditorApproval.feedbackText || 'โปรดแก้ไขรายละเอียดแผนงานตามข้อคิดเห็น'}&rdquo;
                      </div>
                      {auditorApproval.auditorName && (
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                          โดย {auditorApproval.auditorName}{' '}
                          {auditorApproval.revisedAt && `(${new Date(auditorApproval.revisedAt).toLocaleDateString('th-TH')})`}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                    <Clock size={16} />
                    <span>รอดำเนินการพิจารณาตรวจสอบแผนงานโดยผู้ตรวจติดตาม</span>
                  </div>
                )}
              </div>

              {/* Auditor Action Buttons */}
              {canEditPart1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleAuditorApprove}
                    disabled={isAuditorSubmitting}
                    className="btn btn-sm"
                    style={{
                      background: '#16A34A',
                      color: '#FFFFFF',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '5px 12px',
                    }}
                  >
                    <CheckSquare size={14} />
                    <span>{auditorApproval?.approved ? 'ยืนยันการอนุมัติอีกครั้ง' : 'เห็นชอบ/อนุมัติแผนงาน'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRevisionCommentInput('');
                      setShowRevisionModal(true);
                    }}
                    disabled={isAuditorSubmitting}
                    className="btn btn-sm"
                    style={{
                      background: '#FFFFFF',
                      color: '#D97706',
                      border: '1.5px solid #F59E0B',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '5px 12px',
                    }}
                  >
                    <MessageSquare size={14} />
                    <span>ขอให้แก้ไขแผนงาน (ระบุข้อคิดเห็น)</span>
                  </button>
                </div>
              )}
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
                  ผู้แทนฝ่ายบริหาร (MR - Management Representative)
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  {executiveSignature ? (
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      ✓ ลงนามรับทราบแล้ว: {executiveSignature.name} ({executiveSignature.date})
                    </span>
                  ) : (
                    'รอดำเนินการลงนามรับทราบแผนงานโดย MR'
                  )}
                </div>
                {!auditorApproval?.approved && !executiveSignature && (
                  <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={13} />
                    <span>หมายเหตุ: ผู้แทนฝ่ายบริหาร (MR) จะสามารถลงนามได้หลังจากผู้ตรวจติดตามเห็นชอบแผนงานแล้ว</span>
                  </div>
                )}
              </div>

              {isMR && !executiveSignature && (
                <button
                  type="button"
                  onClick={handleSignExecutive}
                  disabled={!auditorApproval?.approved && !isAdmin}
                  className="btn btn-primary btn-sm"
                  title={!auditorApproval?.approved && !isAdmin ? 'ต้องได้รับการเห็นชอบจากผู้ตรวจติดตามก่อน' : 'ลงชื่อรับทราบในฐานะ MR'}
                  style={{
                    background: auditorApproval?.approved || isAdmin
                      ? 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)'
                      : '#94A3B8',
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    cursor: auditorApproval?.approved || isAdmin ? 'pointer' : 'not-allowed',
                    opacity: auditorApproval?.approved || isAdmin ? 1 : 0.6,
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>ลงชื่อรับทราบ (MR)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================== ส่วนที่ 4: การติดตามและประเมินประสิทธิผล ===================== */}
        {activeTab === 'part4' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #F1F5F9',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                  }}
                >
                  4
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    ส่วนที่ 4: การติดตามและประเมินประสิทธิผล (Follow-up & Verification)
                  </h3>
                  <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                    การตรวจติดตามผลการแก้ไขและการประเมินประสิทธิผลโดยผู้ตรวจติดตาม
                  </div>
                </div>
              </div>

              {/* View Follow-up History Button */}
              <button
                type="button"
                onClick={() => setShowFollowUpHistoryModal(true)}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.775rem',
                  padding: '4px 10px',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                }}
              >
                <History size={14} color="#0D9488" />
                <span>ดูประวัติผลการตรวจติดตาม ({followUpHistory.length})</span>
              </button>
            </div>

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
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                ผลการประเมินประสิทธิผลการแก้ไข (Effectiveness Evaluation):
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1.5px solid ${followUpResult === 'RESOLVED' ? '#0D9488' : '#E2E8F0'}`,
                    background: followUpResult === 'RESOLVED' ? '#F0FDFA' : '#FFFFFF',
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
                    style={{ marginTop: '3px', accentColor: '#0D9488' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F766E' }}>
                      สามารถแก้ไข / ป้องกันได้อย่างมีประสิทธิผล (Resolved & Effective)
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                      ปัญหาได้รับการแก้ไขตรงจุด และมีแนวทางป้องกันไม่ให้เกิดซ้ำอย่างมีประสิทธิผล (สถานะจะเปลี่ยนเป็น <strong>Closed</strong>)
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

              {canEditPart4 && (
                <button
                  type="button"
                  onClick={handleSignEvaluator}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.8rem' }}
                >
                  {followUpAuditor ? 'บันทึกการตรวจรอบใหม่' : 'ลงชื่อยืนยันการตรวจติดตาม'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================== บันทึกข้อความและหมายเหตุเพิ่มเติม ===================== */}
        {activeTab === 'notes' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #F1F5F9',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                  }}
                >
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                    บันทึกข้อความและหมายเหตุเพิ่มเติม (Notes & Remarks)
                  </h3>
                  <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                    ข้อความสื่อสารภายในและข้อคิดเห็นระหว่างผู้เกี่ยวข้อง
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#64748B',
                  background: '#F1F5F9',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600,
                }}
              >
                {notes.length} รายการ
              </span>
            </div>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {prevTab && (
              <button
                type="button"
                onClick={handlePrevTab}
                disabled={isSaving}
                className="btn btn-secondary btn-sm"
                style={{ gap: '4px', fontSize: '0.8rem' }}
                title={`ย้อนกลับไป: ${prevTab.label}`}
              >
                <ChevronLeft size={14} />
                <span>ก่อนหน้า ({prevTab.shortLabel})</span>
              </button>
            )}

            {nextTab && (
              <button
                type="button"
                onClick={handleNextTab}
                disabled={isSaving}
                className="btn btn-secondary btn-sm"
                style={{ gap: '4px', fontSize: '0.8rem', borderColor: '#0D9488', color: '#0F766E', fontWeight: 700 }}
                title={`ถัดไป: ${nextTab.label}`}
              >
                <span>ถัดไป ({nextTab.shortLabel})</span>
                <ChevronRight size={14} />
              </button>
            )}
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
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  เลือกข้อบกพร่อง (NC) จากรายงานการตรวจติดตาม
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  นำเข้าข้อความ findings, clauses, มาตรฐาน และรายชื่อผู้ตรวจ/ผู้รับการตรวจเข้าสู่ CAR
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNcImportModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search filter for NC audits */}
            <div style={{ padding: '0.75rem 1.25rem 0', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                  }}
                />
                <input
                  type="text"
                  placeholder="ค้นหารหัสตรวจ, หัวข้อตรวจ, หรือข้อบกพร่อง..."
                  value={ncSearchQuery}
                  onChange={(e) => setNcSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem 0.45rem 2.25rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    background: '#FFFFFF',
                  }}
                />
              </div>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {(() => {
                const filtered = (availableNcAudits || []).filter((audit) => {
                  if (!ncSearchQuery.trim()) return true;
                  const q = ncSearchQuery.toLowerCase();
                  const matchDoc = (audit.docNumber || audit.auditCode || audit.id || '').toLowerCase().includes(q);
                  const matchTopic = (audit.topic || '').toLowerCase().includes(q);
                  const matchFindings = (audit.findings || audit.description || '').toLowerCase().includes(q);
                  const matchClauses = (audit.clauses || audit.clause || '').toLowerCase().includes(q);
                  return matchDoc || matchTopic || matchFindings || matchClauses;
                });

                if (filtered.length > 0) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {filtered.map((audit) => {
                        const isDuplicate = audit.isAlreadyImported && audit.id !== sourceAuditId;

                        return (
                          <div
                            key={audit.id}
                            onClick={() => {
                              if (isDuplicate) {
                                alert(`⚠️ รายงานการตรวจนี้ (${audit.docNumber || audit.id}) ได้ถูกนำไปสร้างเอกสาร CAR หมายเลข ${audit.existingCarDocNumber} แล้ว`);
                                return;
                              }
                              handleImportFromNc(audit);
                            }}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: `1px solid ${isDuplicate ? '#FDE68A' : '#E2E8F0'}`,
                              cursor: isDuplicate ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease',
                              backgroundColor: isDuplicate ? '#FFFDF5' : '#FFFFFF',
                              opacity: isDuplicate ? 0.75 : 1,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            }}
                            onMouseEnter={(e) => {
                              if (!isDuplicate) {
                                e.currentTarget.style.borderColor = '#0D9488';
                                e.currentTarget.style.backgroundColor = '#F0FDFA';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isDuplicate) {
                                e.currentTarget.style.borderColor = '#E2E8F0';
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, color: '#0D9488', fontSize: '0.875rem' }}>
                                  {audit.docNumber || audit.auditCode || audit.id}
                                </span>
                                {audit.auditYear && (
                                  <span
                                    style={{
                                      fontSize: '0.725rem',
                                      fontWeight: 700,
                                      background: '#E2E8F0',
                                      color: '#475569',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    ปี {audit.auditYear}
                                  </span>
                                )}
                                {audit.isoStandard && (
                                  <span
                                    style={{
                                      fontSize: '0.725rem',
                                      background: '#E0F2FE',
                                      color: '#0369A1',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    {audit.isoStandard}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {isDuplicate && (
                                  <span
                                    style={{
                                      background: '#FEF3C7',
                                      color: '#B45309',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontWeight: 700,
                                      fontSize: '0.725rem',
                                      border: '1px solid #FDE68A',
                                    }}
                                  >
                                    สร้าง CAR แล้ว ({audit.existingCarDocNumber})
                                  </span>
                                )}
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
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                              {audit.topic}
                            </div>
                            {audit.clauses && (
                              <div style={{ fontSize: '0.775rem', color: '#0284C7', marginBottom: '4px' }}>
                                ข้อกำหนด: <strong>{audit.clauses}</strong>
                              </div>
                            )}
                            <div style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                              {audit.findings || audit.description || '-'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2.5rem 1rem' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#64748B' }}>
                      ไม่พบรายงานการตรวจที่มีผลเป็น NC
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                      รายงานที่มีผลเป็น C (สอดคล้อง) หรือ OFI จะไม่ปรากฏในรายการนี้
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Revision Request Modal (Auditor to Requestee) */}
      {showRevisionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquareQuote size={20} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                  ขอให้ปรับปรุงแก้ไขแนวทาง/แผนปฏิบัติการ (Request Plan Revision)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  เมื่อส่งข้อคิดเห็น ระบบจะบันทึกสถานะการขอให้แก้ไข และ<strong>ส่งอีเมลแจ้งเตือนไปยังผู้รับการร้องขอ (Requestees)</strong> เพื่อให้เข้ามาปรับปรุงแนวทางแก้ไขเบื้องต้นและแผน Corrective Actions
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  ข้อคิดเห็น / สิ่งที่ต้องการให้ปรับปรุงแก้ไข <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  value={revisionCommentInput}
                  onChange={(e) => setRevisionCommentInput(e.target.value)}
                  rows={5}
                  placeholder="ระบุข้อคิดเห็น เช่น ขอให้ระบุสาเหตุที่แท้จริงเพิ่มเติม, ปรับเป้าหมายระยะเวลาให้กระชับขึ้น, หรือเพิ่มขั้นตอนการป้องกัน..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '0.85rem 1.25rem',
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="btn btn-ghost btn-sm"
                disabled={isAuditorSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSubmitRevision}
                disabled={isAuditorSubmitting || !revisionCommentInput.trim()}
                className="btn btn-sm"
                style={{
                  background: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  padding: '6px 14px',
                }}
              >
                <Send size={14} />
                <span>{isAuditorSubmitting ? 'กำลังส่ง...' : 'ส่งข้อคิดเห็นและแจ้งเตือนผู้รับการตรวจ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Comments History Modal */}
      {showCommentsHistoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '80vh',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="#0D9488" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                  ประวัติข้อคิดเห็นการพิจารณาแผนงาน (Review Comments History)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCommentsHistoryModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {reviewComments && reviewComments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {reviewComments.map((comm, idx) => (
                    <div
                      key={comm.id || idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#F8FAFC',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.85rem' }}>
                            {comm.authorName || 'ผู้ตรวจติดตาม'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: '#E0F2FE',
                              color: '#0369A1',
                              fontWeight: 600,
                            }}
                          >
                            {comm.role || 'Auditor'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          {comm.createdAt ? new Date(comm.createdAt).toLocaleString('th-TH') : '-'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.825rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {comm.text || comm.content || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2.5rem 1rem' }}>
                  <MessageSquareQuote size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#64748B' }}>
                    ยังไม่มีประวัติข้อคิดเห็นการพิจารณาแผนงาน
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '0.75rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowCommentsHistoryModal(false)}
                className="btn btn-secondary btn-sm"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Evaluation History Modal */}
      {showFollowUpHistoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '80vh',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="#0D9488" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                  ประวัติผลการตรวจติดตาม (Follow-up Evaluation History)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFollowUpHistoryModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {followUpHistory && followUpHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {followUpHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${item.followUpResult === 'RESOLVED' ? '#A7F3D0' : '#FED7AA'}`,
                        backgroundColor: item.followUpResult === 'RESOLVED' ? '#F0FDF4' : '#FFFDF5',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.875rem' }}>
                            รอบที่ {idx + 1} ({item.followUpDate || '-'})
                          </span>
                          <span
                            style={{
                              fontSize: '0.725rem',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontWeight: 700,
                              background: item.followUpResult === 'RESOLVED' ? '#DCFCE7' : '#FEF3C7',
                              color: item.followUpResult === 'RESOLVED' ? '#15803D' : '#B45309',
                              border: `1px solid ${item.followUpResult === 'RESOLVED' ? '#86EFAC' : '#FDE68A'}`,
                            }}
                          >
                            {item.followUpResult === 'RESOLVED' ? '✓ ปิดข้อบกพร่อง (Resolved)' : '⚠️ ยังไม่ปิด (Ineffective)'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          {item.recordedAt ? new Date(item.recordedAt).toLocaleString('th-TH') : ''}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '4px' }}>
                        <strong>สิ่งที่พบจากการตรวจ:</strong>
                        <div style={{ whiteSpace: 'pre-wrap', marginTop: '2px', color: '#475569' }}>
                          {item.followUpFindings || '-'}
                        </div>
                      </div>

                      {item.followUpAuditor?.name && (
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '6px' }}>
                          ผู้ตรวจติดตาม: <strong>{item.followUpAuditor.name}</strong> {item.followUpAuditor.email && `(${item.followUpAuditor.email})`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '2.5rem 1rem' }}>
                  <ShieldCheck size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#64748B' }}>
                    ยังไม่มีประวัติการบันทึกผลการตรวจติดตามในอดีต
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '0.75rem 1.25rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowFollowUpHistoryModal(false)}
                className="btn btn-secondary btn-sm"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

