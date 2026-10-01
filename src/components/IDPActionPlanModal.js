'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  User,
  Users,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  CheckSquare,
  Award,
  BookOpen,
  Target,
  Edit3,
  Lock,
  Search,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  IDP_DEVELOPMENT_METHODS,
  IDP_ACTION_PLAN_QUARTERS,
  IDP_MISSIONS_5,
  IDP_ACTION_PLAN_STATUSES,
} from '@/lib/constants';
import {
  saveActionPlan,
  signPlanAcknowledgement,
  signPlanEvaluation,
  exportActionPlanToExcel,
  formatMethodsString,
} from '@/lib/idpActionPlanService';
import { subscribeStrategyConfig, isHrOfficer } from '@/lib/idpService';
import { getSkillMapConfig } from '@/lib/skillMapService';
import { formatDateDDMMYYYYBE } from '@/lib/dateUtils';
import { useModal } from '@/context/ModalContext';

export default function IDPActionPlanModal({
  isOpen,
  onClose,
  plan,
  fiscalYear = '2569',
  currentUser,
  currentPersonnel,
  personnelList = [],
  isAdmin = false,
  onSaved,
  onOpenPrint,
}) {
  const { showAlert, showConfirm } = useModal();

  // Strategy & Skill Map config states
  const [strategyConfig, setStrategyConfig] = useState(null);
  const [skillMapConfig, setSkillMapConfig] = useState(null);

  // Form State
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('plan'); // 'plan' | 'signatures'
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Evaluation Form State
  const [evalResultType, setEvalResultType] = useState('COMPLETED'); // 'COMPLETED' | 'NEARLY_COMPLETED'
  const [evalPercent, setEvalPercent] = useState(100);
  const [evalReason, setEvalReason] = useState('');

  // Active item accordion for mobile / detailed editing
  const [expandedItemId, setExpandedItemId] = useState(null);

  // Competency Type Filter Tabs ('ALL' | 'CORE' | 'FUNCTIONAL')
  const [competencyFilter, setCompetencyFilter] = useState('ALL');

  // Alignment Modal State
  const [alignmentTargetItemId, setAlignmentTargetItemId] = useState(null);
  const [alignTab, setAlignTab] = useState('STRATEGY'); // 'STRATEGY' | 'SKILL_MAP' | 'MISSION'
  const [alignSearch, setAlignSearch] = useState('');

  const isHR = isHrOfficer(currentUser, currentPersonnel, isAdmin);
  const userEmail = (currentUser?.email || currentPersonnel?.email || '').trim().toLowerCase();
  const planOwnerEmail = (plan?.personnelEmail || '').trim().toLowerCase();
  const isOwner = userEmail && userEmail === planOwnerEmail;

  // Subscribe Strategy Config
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeStrategyConfig(fiscalYear, (cfg) => {
      setStrategyConfig(cfg);
    });
    const smConfig = getSkillMapConfig(fiscalYear);
    setSkillMapConfig(smConfig);
    return () => unsub && unsub();
  }, [isOpen, fiscalYear]);

  // Sync initial plan data
  useEffect(() => {
    if (isOpen && plan) {
      setItems(JSON.parse(JSON.stringify(plan.items || [])));
      const ev = plan.signatures?.evaluation || {};
      setEvalResultType(ev.resultType || 'COMPLETED');
      setEvalPercent(ev.percent !== undefined ? ev.percent : 100);
      setEvalReason(ev.reason || '');
      setHasUnsavedChanges(false);
      if (plan.items?.length > 0) {
        setExpandedItemId(plan.items[0].id);
      }
    }
  }, [isOpen, plan]);

  // Strategy items list for Multi-select (Fix CKPI undefined)
  const availableStrategies = useMemo(() => {
    const list = [];
    if (strategyConfig?.sos) {
      strategyConfig.sos.forEach((so) => {
        list.push({
          id: so.id || so.code,
          code: so.code,
          title: `[${so.code}] ${so.title || so.name || ''}`.trim(),
          category: 'SO',
        });
      });
    }
    if (strategyConfig?.ckpis) {
      strategyConfig.ckpis.forEach((ckpi) => {
        const ckpiName = ckpi.name || ckpi.title || '';
        list.push({
          id: ckpi.id || ckpi.code,
          code: ckpi.code,
          title: `[${ckpi.code}] ${ckpiName}`.trim(),
          category: 'CKPI',
        });
      });
    }
    return list;
  }, [strategyConfig]);

  // Skill Map items list for Multi-select
  const availableSkills = useMemo(() => {
    const list = [];
    if (skillMapConfig?.workAreas) {
      skillMapConfig.workAreas.forEach((area) => {
        (area.competencies || []).forEach((c) => {
          list.push({
            id: c.id,
            title: `${area.shortName || area.name} : ${c.name}`,
          });
        });
      });
    }
    return list;
  }, [skillMapConfig]);

  // Missions list
  const availableMissions = useMemo(() => {
    if (strategyConfig?.missions && strategyConfig.missions.length > 0) {
      return strategyConfig.missions.map((m) => ({
        id: m.id,
        title: `พันธกิจที่ ${m.num || ''}: ${m.title}`,
      }));
    }
    return IDP_MISSIONS_5.map((m) => ({
      id: m.id,
      title: `พันธกิจที่ ${m.num || ''}: ${m.title}`,
    }));
  }, [strategyConfig]);

  // Derived counts for filters
  const coreCount = useMemo(
    () => items.filter((it) => (it.competencyType || 'CORE') === 'CORE').length,
    [items]
  );
  const functionalCount = useMemo(
    () => items.filter((it) => it.competencyType === 'FUNCTIONAL').length,
    [items]
  );
  const displayedItems = useMemo(() => {
    if (competencyFilter === 'ALL') return items;
    return items.filter((it) => (it.competencyType || 'CORE') === competencyFilter);
  }, [items, competencyFilter]);

  const targetAlignmentItem = useMemo(() => {
    if (!alignmentTargetItemId) return null;
    return items.find((it) => it.id === alignmentTargetItemId) || null;
  }, [items, alignmentTargetItemId]);

  if (!isOpen || !plan) return null;

  // -------------------------------------------------------------
  // Item Field Handlers
  // -------------------------------------------------------------
  const updateItemField = (itemId, field, value) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return { ...it, [field]: value };
      })
    );
    setHasUnsavedChanges(true);
  };

  const toggleItemMethod = (itemId, methodId) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const currentMethods = it.methods || [];
        const exists = currentMethods.includes(methodId);
        const updated = exists
          ? currentMethods.filter((m) => m !== methodId)
          : [...currentMethods, methodId].sort((a, b) => a - b);
        return { ...it, methods: updated };
      })
    );
    setHasUnsavedChanges(true);
  };

  const updateQuarterProgress = (itemId, quarterKey, field, value) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const currentQ = it.quarters || {};
        const targetQ = currentQ[quarterKey] || { planned: false, progress: '' };
        return {
          ...it,
          quarters: {
            ...currentQ,
            [quarterKey]: {
              ...targetQ,
              [field]: value,
              ...(field === 'progress' ? { reportedAt: new Date().toISOString() } : {}),
            },
          },
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const updateItemEvaluation = (itemId, field, value) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const currentEval = it.evaluation || { status: 'NOT_ACHIEVED' };
        return {
          ...it,
          evaluation: {
            ...currentEval,
            [field]: value,
            evaluatedBy: currentPersonnel?.name || currentUser?.displayName || 'ผู้บังคับบัญชา',
            evaluatedAt: new Date().toISOString(),
          },
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const toggleAlignmentMulti = (itemId, alignmentField, idValue, titleValue) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const currentAlign = it.alignments || {};
        const idArray = currentAlign[`${alignmentField}Ids`] || [];
        const titleArray = currentAlign[`${alignmentField}Titles`] || [];

        const exists = idArray.includes(idValue);
        let nextIds = [];
        let nextTitles = [];

        if (exists) {
          nextIds = idArray.filter((i) => i !== idValue);
          nextTitles = titleArray.filter((t) => t !== titleValue);
        } else {
          nextIds = [...idArray, idValue];
          nextTitles = [...titleArray, titleValue];
        }

        return {
          ...it,
          alignments: {
            ...currentAlign,
            [`${alignmentField}Ids`]: nextIds,
            [`${alignmentField}Titles`]: nextTitles,
          },
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  // Reorder Items
  const moveItem = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const next = [...items];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    // Re-index order numbers
    const reindexed = next.map((it, i) => ({ ...it, order: i + 1 }));
    setItems(reindexed);
    setHasUnsavedChanges(true);
  };

  const handleDeleteItem = async (itemId) => {
    const confirmed = await showConfirm({
      type: 'danger',
      title: 'ยืนยันการลบรายการแผนพัฒนา',
      message: 'ต้องการลบรายการสมรรถนะนี้ออกจากแผนพัฒนา IDP หรือไม่?',
      confirmText: 'ลบรายการ',
    });
    if (!confirmed) return;
    const filtered = items.filter((it) => it.id !== itemId).map((it, i) => ({ ...it, order: i + 1 }));
    setItems(filtered);
    setHasUnsavedChanges(true);
  };

  const handleAddNewCustomItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      order: items.length + 1,
      competencyName: 'สมรรถนะเพิ่มเติม',
      competencyType: 'CORE',
      gap: 0,
      goal: '',
      methods: [],
      methodCustom: '',
      application: '',
      quarters: {
        q1: { planned: false, progress: '' },
        q2: { planned: false, progress: '' },
        q3: { planned: false, progress: '' },
        q4: { planned: false, progress: '' },
      },
      evaluation: { status: 'NOT_ACHIEVED', comment: '' },
      alignments: {
        competencyType: 'CORE',
        strategyIds: [],
        strategyTitles: [],
        skillMapIds: [],
        skillMapTitles: [],
        missionIds: [],
        missionTitles: [],
      },
    };
    setItems((prev) => [...prev, newItem]);
    setExpandedItemId(newItem.id);
    setHasUnsavedChanges(true);
  };

  // -------------------------------------------------------------
  // Save Plan
  // -------------------------------------------------------------
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'ผู้ใช้งาน',
        email: currentUser?.email || currentPersonnel?.email || '',
      };
      const updated = {
        ...plan,
        items,
        signatures: {
          ...(plan.signatures || {}),
          evaluation: {
            ...(plan.signatures?.evaluation || {}),
            resultType: evalResultType,
            percent: Number(evalPercent),
            reason: evalReason,
          },
        },
      };
      const saved = await saveActionPlan(updated, actor);
      setHasUnsavedChanges(false);
      if (onSaved) onSaved(saved);
      await showAlert({
        type: 'success',
        title: 'บันทึกสำเร็จ',
        message: 'บันทึกข้อมูลแผนพัฒนาบุคลากร IDP Action Plan เรียบร้อยแล้ว',
      });
    } catch (e) {
      console.error('Save action plan error:', e);
      await showAlert({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        message: e.message || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // Signatures Handlers
  // -------------------------------------------------------------
  const handleSignAcknowledgement = async (role) => {
    const roleLabel = role === 'TRAINEE' ? 'ผู้รับการพัฒนา' : 'ผู้บังคับบัญชา';
    const confirmed = await showConfirm({
      type: 'info',
      title: `ลงนามรับทราบแผน (${roleLabel})`,
      message: `ยืนยันการลงนามรับทราบแผนพัฒนาบุคลากรประจำปีงบประมาณ พ.ศ. ${fiscalYear}?`,
      confirmText: 'ยืนยันลงนาม',
    });
    if (!confirmed) return;

    setIsSaving(true);
    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || roleLabel,
        email: currentUser?.email || currentPersonnel?.email || '',
      };
      const currentPlanWithItems = { ...plan, items };
      const saved = await signPlanAcknowledgement(currentPlanWithItems, role, actor);
      if (onSaved) onSaved(saved);
      await showAlert({
        type: 'success',
        title: 'ลงนามสำเร็จ',
        message: `ลงนามรับทราบแผนในฐานะ${roleLabel}เรียบร้อยแล้ว`,
      });
    } catch (e) {
      console.error(e);
      await showAlert({ type: 'error', title: 'เกิดข้อผิดพลาด', message: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignEvaluation = async (role) => {
    const roleLabel = role === 'SUPERVISOR' ? 'ผู้บังคับบัญชา (ผู้ประเมิน)' : 'ผู้รับการพัฒนา';
    const confirmed = await showConfirm({
      type: 'info',
      title: `ลงนามประเมินผล (${roleLabel})`,
      message: `ยืนยันการลงนามผลการประเมินการพัฒนาตนเองประจำปีงบประมาณ พ.ศ. ${fiscalYear}?`,
      confirmText: 'ยืนยันลงนาม',
    });
    if (!confirmed) return;

    setIsSaving(true);
    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || roleLabel,
        email: currentUser?.email || currentPersonnel?.email || '',
        position: currentPersonnel?.position || (role === 'SUPERVISOR' ? 'รองผู้อำนวยการฝ่ายบริหาร' : ''),
      };
      const currentPlanWithItems = { ...plan, items };
      const evalData = {
        resultType: evalResultType,
        percent: Number(evalPercent),
        reason: evalReason,
      };
      const saved = await signPlanEvaluation(currentPlanWithItems, evalData, role, actor);
      if (onSaved) onSaved(saved);
      await showAlert({
        type: 'success',
        title: 'ลงนามสำเร็จ',
        message: `ลงนามประเมินผลการพัฒนาในฐานะ${roleLabel}เรียบร้อยแล้ว`,
      });
    } catch (e) {
      console.error(e);
      await showAlert({ type: 'error', title: 'เกิดข้อผิดพลาด', message: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const ack = plan.signatures?.acknowledgement || {};
  const ev = plan.signatures?.evaluation || {};

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
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
          maxWidth: '1280px',
          width: '100%',
          maxHeight: '94vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
              }}
            >
              <Target size={24} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  แผนพัฒนาบุคลากรรายบุคคล (IDP Action Plan)
                </h2>
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: '999px',
                    background: 'rgba(249, 115, 22, 0.25)',
                    color: '#FED7AA',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid rgba(249, 115, 22, 0.4)',
                  }}
                >
                  ปีงบประมาณ {fiscalYear}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: '3px 0 0 0' }}>
                {plan.personnelName} • {plan.position || 'บุคลากร'} • ฝ่าย{plan.department || 'สำนักคอมพิวเตอร์ฯ'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onOpenPrint && onOpenPrint({ ...plan, items })}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Printer size={16} />
              <span>พิมพ์แบบฟอร์ม</span>
            </button>

            <button
              type="button"
              onClick={() => exportActionPlanToExcel({ ...plan, items }, fiscalYear)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
              }}
            >
              <FileSpreadsheet size={16} />
              <span>ส่งออก Excel</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                if (hasUnsavedChanges) {
                  const confirmed = await showConfirm({
                    type: 'warning',
                    title: 'มีรายการที่ยังไม่ได้บันทึก',
                    message: 'คุณมีรายการที่ยังไม่ได้บันทึก ต้องการปิดโดยไม่บันทึกหรือไม่?',
                    confirmText: 'ปิดโดยไม่บันทึก',
                  });
                  if (confirmed) onClose();
                } else {
                  onClose();
                }
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
            padding: '0 1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            style={{
              padding: '0.85rem 1.25rem',
              border: 'none',
              background: 'transparent',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: activeTab === 'plan' ? '#EA580C' : '#64748B',
              borderBottom: `3px solid ${activeTab === 'plan' ? '#EA580C' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Target size={18} />
            <span>ตารางแผนพัฒนาบุคลากร ({items.length} รายการ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signatures')}
            style={{
              padding: '0.85rem 1.25rem',
              border: 'none',
              background: 'transparent',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: activeTab === 'signatures' ? '#EA580C' : '#64748B',
              borderBottom: `3px solid ${activeTab === 'signatures' ? '#EA580C' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckSquare size={18} />
            <span>การลงนามรับทราบและประเมินผล</span>
            {ev.supervisor?.signed && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#DCFCE7',
                  color: '#15803D',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                }}
              >
                ประเมินแล้ว
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            background: '#FFFFFF',
          }}
        >
          {activeTab === 'plan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Instructions banner */}
              <div
                style={{
                  background: '#FFF7ED',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  border: '1px solid #FFEDD5',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <HelpCircle size={20} color="#EA580C" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem', color: '#9A3412', lineHeight: 1.6 }}>
                  <strong>คำแนะนำ:</strong> กรอกเป้าหมายและเลือกวิธีการพัฒนา (1-10 วิธี) สำหรับสมรรถนะแต่ละรายการ
                  พร้อมรายงานความคืบหน้ารายไตรมาส (Q1-Q4) และเลือกความสอดคล้อง 4 มิติ
                  <span style={{ color: '#15803D', fontWeight: 700 }}>
                    {' '}
                    *หากผู้บังคับบัญชาประเมินผลว่า &quot;บรรลุ&quot; แล้ว จะถือว่าเป้าหมายสำเร็จสมบูรณ์และไม่ต้องรายงานผลในไตรมาสที่เหลือ
                  </span>
                </div>
              </div>

              {/* Filter Tabs: Core vs Functional Competencies */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  background: '#F1F5F9',
                  padding: '6px 8px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setCompetencyFilter('ALL')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: competencyFilter === 'ALL' ? '#FFFFFF' : 'transparent',
                      color: competencyFilter === 'ALL' ? '#0F172A' : '#64748B',
                      fontWeight: competencyFilter === 'ALL' ? 800 : 600,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      boxShadow: competencyFilter === 'ALL' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span>ทั้งหมด</span>
                    <span
                      style={{
                        background: competencyFilter === 'ALL' ? '#EA580C' : '#CBD5E1',
                        color: '#FFFFFF',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        fontSize: '0.725rem',
                        fontWeight: 800,
                      }}
                    >
                      {items.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompetencyFilter('CORE')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: competencyFilter === 'CORE' ? '#FFFFFF' : 'transparent',
                      color: competencyFilter === 'CORE' ? '#1D4ED8' : '#64748B',
                      fontWeight: competencyFilter === 'CORE' ? 800 : 600,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      boxShadow: competencyFilter === 'CORE' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span>สมรรถนะหลัก (Core)</span>
                    <span
                      style={{
                        background: competencyFilter === 'CORE' ? '#2563EB' : '#CBD5E1',
                        color: '#FFFFFF',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        fontSize: '0.725rem',
                        fontWeight: 800,
                      }}
                    >
                      {coreCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompetencyFilter('FUNCTIONAL')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: competencyFilter === 'FUNCTIONAL' ? '#FFFFFF' : 'transparent',
                      color: competencyFilter === 'FUNCTIONAL' ? '#A21CAF' : '#64748B',
                      fontWeight: competencyFilter === 'FUNCTIONAL' ? 800 : 600,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      boxShadow: competencyFilter === 'FUNCTIONAL' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span>สมรรถนะตามตำแหน่งงาน (Functional)</span>
                    <span
                      style={{
                        background: competencyFilter === 'FUNCTIONAL' ? '#C026D3' : '#CBD5E1',
                        color: '#FFFFFF',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        fontSize: '0.725rem',
                        fontWeight: 800,
                      }}
                    >
                      {functionalCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <div
                  style={{
                    padding: '3.5rem 1rem',
                    textAlign: 'center',
                    background: '#F8FAFC',
                    borderRadius: '1rem',
                    border: '1.5px dashed #CBD5E1',
                  }}
                >
                  <Target size={48} color="#94A3B8" style={{ margin: '0 auto 1rem' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: '0 0 0.5rem 0' }}>
                    ยังไม่มีรายการสมรรถนะในแผนพัฒนา IDP
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '460px', margin: '0 auto 1.25rem' }}>
                    ท่านสามารถดึงรายการสมรรถนะที่มีช่องว่าง (Gap ≠ 0) จาก IDP Need Analysis หรือกดเพิ่มรายการสมรรถนะใหม่
                  </p>
                  <button
                    type="button"
                    onClick={handleAddNewCustomItem}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '10px',
                      background: '#F97316',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Plus size={16} />
                    <span>เพิ่มรายการสมรรถนะ</span>
                  </button>
                </div>
              ) : displayedItems.length === 0 ? (
                <div
                  style={{
                    padding: '3rem 1rem',
                    textAlign: 'center',
                    background: '#F8FAFC',
                    borderRadius: '1rem',
                    border: '1px dashed #CBD5E1',
                  }}
                >
                  <AlertCircle size={40} color="#94A3B8" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ fontSize: '0.9rem', color: '#64748B', margin: 0 }}>
                    ไม่พบรายการสมรรถนะในหมวดหมู่นี้ ({competencyFilter === 'CORE' ? 'สมรรถนะหลัก' : 'สมรรถนะตามตำแหน่งงาน'})
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {displayedItems.map((item, idx) => {
                    const isExpanded = expandedItemId === item.id;
                    const isAchieved = item.evaluation?.status === 'ACHIEVED';
                    const actualIdx = items.findIndex((it) => it.id === item.id);

                    return (
                      <div
                        key={item.id}
                        style={{
                          borderRadius: '14px',
                          border: `1.5px solid ${isAchieved ? '#86EFAC' : '#E2E8F0'}`,
                          backgroundColor: isAchieved ? '#F0FDF4' : '#FFFFFF',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                        }}
                      >
                        {/* Item Card Header */}
                        <div
                          style={{
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px',
                            background: isAchieved ? '#DCFCE7' : '#F8FAFC',
                            borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
                            cursor: 'pointer',
                          }}
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            {/* Order Badge */}
                            <span
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: isAchieved ? '#16A34A' : '#F97316',
                                color: '#FFFFFF',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {actualIdx >= 0 ? actualIdx + 1 : idx + 1}
                            </span>

                            {/* Move Up/Down Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                disabled={actualIdx <= 0}
                                onClick={() => moveItem(actualIdx, -1)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: actualIdx <= 0 ? 'not-allowed' : 'pointer',
                                  color: actualIdx <= 0 ? '#CBD5E1' : '#64748B',
                                  padding: 0,
                                }}
                                title="เลื่อนขึ้น"
                              >
                                <ChevronUp size={16} />
                              </button>
                              <button
                                type="button"
                                disabled={actualIdx >= items.length - 1}
                                onClick={() => moveItem(actualIdx, 1)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: actualIdx >= items.length - 1 ? 'not-allowed' : 'pointer',
                                  color: actualIdx >= items.length - 1 ? '#CBD5E1' : '#64748B',
                                  padding: 0,
                                }}
                                title="เลื่อนลง"
                              >
                                <ChevronDown size={16} />
                              </button>
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                                  {item.competencyName}
                                </span>
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: item.competencyType === 'CORE' ? '#EFF6FF' : '#FDF4FF',
                                    color: item.competencyType === 'CORE' ? '#1D4ED8' : '#A21CAF',
                                    fontSize: '0.725rem',
                                    fontWeight: 700,
                                    border: `1px solid ${item.competencyType === 'CORE' ? '#BFDBFE' : '#F5D0FE'}`,
                                  }}
                                >
                                  {item.competencyType === 'CORE' ? 'สมรรถนะหลัก (Core)' : 'สมรรถนะประจำสายงาน (Functional)'}
                                </span>
                                {item.gap !== undefined && item.gap !== 0 && (
                                  <span
                                    style={{
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      background: '#FEE2E2',
                                      color: '#DC2626',
                                      fontSize: '0.725rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    Gap: {item.gap}
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
                                วิธีการพัฒนา: {formatMethodsString(item.methods, item.methodCustom)} • สถานะ: {isAchieved ? '✅ บรรลุตามตัวชี้วัดแล้ว' : '⏳ กำลังดำเนินการ'}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                            {isAchieved && (
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '999px',
                                  background: '#16A34A',
                                  color: '#FFFFFF',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <CheckCircle2 size={13} />
                                <span>บรรลุแล้ว</span>
                              </span>
                            )}
                            {isExpanded ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
                          </div>
                        </div>

                        {/* Item Card Body */}
                        {isExpanded && (
                          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Row 1: Competency Name & Goal */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                                  ความรู้/ทักษะ/สมรรถนะ:
                                </label>
                                <input
                                  type="text"
                                  value={item.competencyName}
                                  onChange={(e) => updateItemField(item.id, 'competencyName', e.target.value)}
                                  className="form-control"
                                  placeholder="ระบุชื่อสมรรถนะที่ต้องการพัฒนา"
                                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                                />
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                                  เป้าหมายการพัฒนา:
                                </label>
                                <textarea
                                  value={item.goal || ''}
                                  onChange={(e) => updateItemField(item.id, 'goal', e.target.value)}
                                  className="form-control"
                                  rows={2}
                                  placeholder="เช่น ผ่านการทดสอบระดับ B2 หรือสามารถออกแบบสถาปัตยกรรม Microservices ได้ด้วยตนเอง"
                                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                                />
                              </div>
                            </div>

                            {/* Row 2: Development Methods (Multi-Select 1-10) */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                วิธีการพัฒนา (เลือกได้มากกว่า 1 วิธี):
                              </label>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                  gap: '8px',
                                  background: '#F8FAFC',
                                  padding: '10px',
                                  borderRadius: '10px',
                                  border: '1px solid #E2E8F0',
                                }}
                              >
                                {IDP_DEVELOPMENT_METHODS.map((method) => {
                                  const isChecked = (item.methods || []).includes(method.id);
                                  return (
                                    <label
                                      key={method.id}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.825rem',
                                        fontWeight: isChecked ? 700 : 500,
                                        color: isChecked ? '#C2410C' : '#475569',
                                        background: isChecked ? '#FFF7ED' : '#FFFFFF',
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        border: `1px solid ${isChecked ? '#FDBA74' : '#E2E8F0'}`,
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleItemMethod(item.id, method.id)}
                                        style={{ accentColor: '#EA580C', cursor: 'pointer' }}
                                      />
                                      <span>{method.shortTitle}</span>
                                    </label>
                                  );
                                })}
                              </div>

                              {/* Custom text for Method 10 */}
                              {(item.methods || []).includes(10) && (
                                <div style={{ marginTop: '8px' }}>
                                  <input
                                    type="text"
                                    value={item.methodCustom || ''}
                                    onChange={(e) => updateItemField(item.id, 'methodCustom', e.target.value)}
                                    className="form-control"
                                    placeholder="โปรดระบุวิธีการพัฒนาอื่น ๆ..."
                                    style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Row 3: Application to work */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                                การประยุกต์ใช้ในงาน:
                              </label>
                              <textarea
                                value={item.application || ''}
                                onChange={(e) => updateItemField(item.id, 'application', e.target.value)}
                                className="form-control"
                                rows={2}
                                placeholder="เช่น นำมาใช้พัฒนาระบบ Single Sign-On ของมหาวิทยาลัย หรือปรับปรุงโครงสร้างพื้นฐานระบบเครือข่าย"
                                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                              />
                            </div>

                            {/* Row 4: Quarterly Progress Reporting (Q1..Q4) */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                ช่วงเวลาที่พัฒนาและการรายงานผลรายไตรมาส (Q1 - Q4):
                              </label>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                                {IDP_ACTION_PLAN_QUARTERS.map((q) => {
                                  const qData = item.quarters?.[q.key] || { planned: false, progress: '' };
                                  return (
                                    <div
                                      key={q.key}
                                      style={{
                                        borderRadius: '10px',
                                        border: `1px solid ${qData.planned ? '#FB923C' : '#E2E8F0'}`,
                                        background: qData.planned ? '#FFFBEB' : '#F8FAFC',
                                        padding: '10px',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 700, color: '#1E293B' }}>
                                          <input
                                            type="checkbox"
                                            checked={Boolean(qData.planned)}
                                            onChange={(e) => updateQuarterProgress(item.id, q.key, 'planned', e.target.checked)}
                                            style={{ accentColor: '#EA580C', cursor: 'pointer' }}
                                          />
                                          <span>{q.fullLabel}</span>
                                        </label>
                                        {qData.progress && (
                                          <span style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 700 }}>
                                            ✓ รายงานแล้ว
                                          </span>
                                        )}
                                      </div>

                                      <textarea
                                        value={qData.progress || ''}
                                        disabled={isAchieved}
                                        onChange={(e) => updateQuarterProgress(item.id, q.key, 'progress', e.target.value)}
                                        rows={2}
                                        placeholder={isAchieved ? 'บรรลุเป้าหมายแล้ว' : `รายงานผลในรอบ ${q.label}...`}
                                        style={{
                                          width: '100%',
                                          padding: '0.4rem 0.6rem',
                                          borderRadius: '6px',
                                          border: '1px solid #CBD5E1',
                                          fontSize: '0.8rem',
                                          background: isAchieved ? '#F1F5F9' : '#FFFFFF',
                                        }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Row 5: Success Measurement & Evaluation */}
                            <div
                              style={{
                                background: isAchieved ? '#F0FDF4' : '#F8FAFC',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                border: `1.5px solid ${isAchieved ? '#86EFAC' : '#E2E8F0'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                              }}
                            >
                              {/* 5.1 Staff KPI / Success Criteria */}
                              <div>
                                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
                                  🎯 การวัดผลสำเร็จ / ตัวชี้วัดความสำเร็จ (KPI) (ระบุโดยเจ้าของผลงาน / ผู้รับการพัฒนา):
                                </label>
                                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 6px 0' }}>
                                  ระบุเกณฑ์ ตัวชี้วัด หรือผลลัพธ์ที่เป็นรูปธรรมในการวัดความสำเร็จของการนำความรู้/ทักษะไปประยุกต์ใช้ในงาน
                                </p>
                                <textarea
                                  value={item.kpiCriteria || ''}
                                  onChange={(e) => updateItemField(item.id, 'kpiCriteria', e.target.value)}
                                  rows={2}
                                  placeholder="เช่น มีระบบพร้อมใช้งานจริงภายใน Q3, ลดเวลาการทำงานลง 30%, ผ่านเกณฑ์การทดสอบ หรือจัดทำคู่มือการปฏิบัติงานสำเร็จ 1 เล่ม..."
                                  style={{
                                    width: '100%',
                                    padding: '0.55rem 0.85rem',
                                    borderRadius: '8px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '0.85rem',
                                    background: '#FFFFFF',
                                  }}
                                />
                              </div>

                              {/* 5.2 Supervisor / HR Evaluation */}
                              <div
                                style={{
                                  background: isAchieved ? '#DCFCE7' : '#FFFFFF',
                                  borderRadius: '10px',
                                  padding: '10px 12px',
                                  border: `1px solid ${isAchieved ? '#86EFAC' : '#E2E8F0'}`,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                  <div>
                                    <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0F172A' }}>
                                      📝 การประเมินผลสัมฤทธิ์ของการนำไปประยุกต์ใช้ในงาน (โดยผู้บังคับบัญชา / HR):
                                    </span>
                                    <p style={{ fontSize: '0.725rem', color: '#64748B', margin: '1px 0 0 0' }}>
                                      *หากประเมินว่า &quot;บรรลุตามตัวชี้วัด&quot; แล้ว จะถือว่าเป้าหมายสำเร็จสมบูรณ์และไม่ต้องรายงานผลในไตรมาสที่เหลือ
                                    </p>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <select
                                      value={item.evaluation?.status || 'NOT_ACHIEVED'}
                                      onChange={(e) => updateItemEvaluation(item.id, 'status', e.target.value)}
                                      style={{
                                        padding: '0.4rem 0.85rem',
                                        borderRadius: '8px',
                                        fontSize: '0.825rem',
                                        fontWeight: 800,
                                        background: isAchieved ? '#16A34A' : '#64748B',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <option value="NOT_ACHIEVED">⏳ ไม่บรรลุ (กำลังดำเนินการ)</option>
                                      <option value="ACHIEVED">✅ บรรลุตามตัวชี้วัด</option>
                                    </select>
                                  </div>
                                </div>

                                <input
                                  type="text"
                                  value={item.evaluation?.comment || ''}
                                  onChange={(e) => updateItemEvaluation(item.id, 'comment', e.target.value)}
                                  placeholder="ข้อคิดเห็นการประเมินผลสำเร็จจากผู้บังคับบัญชา..."
                                  style={{
                                    width: '100%',
                                    padding: '0.45rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '0.825rem',
                                    background: '#FFFFFF',
                                  }}
                                />
                              </div>
                            </div>

                            {/* Row 6: 4-Dimension Alignments (Button Trigger & Selection Display) */}
                            {(() => {
                              const stratCount = (item.alignments?.strategyIds || []).length;
                              const skillCount = (item.alignments?.skillMapIds || []).length;
                              const missionCount = (item.alignments?.missionIds || []).length;
                              const totalCount = stratCount + skillCount + missionCount;

                              return (
                                <div
                                  style={{
                                    background: '#F8FAFC',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    border: '1.5px solid #E2E8F0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div
                                        style={{
                                          width: '32px',
                                          height: '32px',
                                          borderRadius: '8px',
                                          background: '#EEF2FF',
                                          color: '#4F46E5',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        <Sparkles size={18} />
                                      </div>
                                      <div>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1E293B' }}>
                                          ความสอดคล้อง 4 มิติ (Alignment Mapping)
                                        </span>
                                        <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
                                          เชื่อมโยงแผนกลยุทธ์, ทักษะตามสายงาน (Skill Map), และพันธกิจของสำนักฯ
                                        </p>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAlignmentTargetItemId(item.id);
                                        setAlignTab('STRATEGY');
                                        setAlignSearch('');
                                      }}
                                      style={{
                                        padding: '0.5rem 1.15rem',
                                        borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        fontSize: '0.825rem',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                                      }}
                                    >
                                      <Edit3 size={15} />
                                      <span>เลือก / แก้ไขความสอดคล้อง</span>
                                      {totalCount > 0 && (
                                        <span
                                          style={{
                                            background: '#FFFFFF',
                                            color: '#4338CA',
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                          }}
                                        >
                                          {totalCount}
                                        </span>
                                      )}
                                    </button>
                                  </div>

                                  {/* Summary Badges of Selected Alignments */}
                                  {totalCount === 0 ? (
                                    <div
                                      onClick={() => {
                                        setAlignmentTargetItemId(item.id);
                                        setAlignTab('STRATEGY');
                                        setAlignSearch('');
                                      }}
                                      style={{
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        background: '#FFFFFF',
                                        border: '1px dashed #CBD5E1',
                                        color: '#94A3B8',
                                        fontSize: '0.8rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      ⚠️ ยังไม่ได้เลือกความสอดคล้อง (คลิกปุ่ม &quot;เลือก / แก้ไขความสอดคล้อง&quot; เพื่อกำหนด)
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        background: '#FFFFFF',
                                        borderRadius: '10px',
                                        padding: '10px 12px',
                                        border: '1px solid #E2E8F0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                      }}
                                    >
                                      {/* Strategy */}
                                      {stratCount > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem' }}>
                                          <span style={{ fontWeight: 800, color: '#1E40AF', flexShrink: 0, minWidth: '95px' }}>
                                            🏛️ แผนกลยุทธ์:
                                          </span>
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                            {(item.alignments?.strategyTitles || []).map((st, i) => (
                                              <span
                                                key={i}
                                                style={{
                                                  background: '#EFF6FF',
                                                  color: '#1D4ED8',
                                                  padding: '3px 8px',
                                                  borderRadius: '6px',
                                                  fontSize: '0.75rem',
                                                  fontWeight: 600,
                                                  border: '1px solid #BFDBFE',
                                                }}
                                              >
                                                {st}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Skill Map */}
                                      {skillCount > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem' }}>
                                          <span style={{ fontWeight: 800, color: '#047857', flexShrink: 0, minWidth: '95px' }}>
                                            💡 Skill Map:
                                          </span>
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                            {(item.alignments?.skillMapTitles || []).map((sk, i) => (
                                              <span
                                                key={i}
                                                style={{
                                                  background: '#ECFDF5',
                                                  color: '#047857',
                                                  padding: '3px 8px',
                                                  borderRadius: '6px',
                                                  fontSize: '0.75rem',
                                                  fontWeight: 600,
                                                  border: '1px solid #A7F3D0',
                                                }}
                                              >
                                                {sk}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Missions */}
                                      {missionCount > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem' }}>
                                          <span style={{ fontWeight: 800, color: '#9333EA', flexShrink: 0, minWidth: '95px' }}>
                                            🎯 พันธกิจ:
                                          </span>
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                            {(item.alignments?.missionTitles || []).map((ms, i) => (
                                              <span
                                                key={i}
                                                style={{
                                                  background: '#FAF5FF',
                                                  color: '#9333EA',
                                                  padding: '3px 8px',
                                                  borderRadius: '6px',
                                                  fontSize: '0.75rem',
                                                  fontWeight: 600,
                                                  border: '1px solid #E9D5FF',
                                                }}
                                              >
                                                {ms}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Signatures & Year-End Evaluation */}
          {activeTab === 'signatures' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Part 1: ต้นปี - รับทราบแผนพัฒนา IDP */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <Award size={20} color="#EA580C" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    ส่วนที่ 1: รับทราบแผนพัฒนา IDP (ต้นปีงบประมาณ)
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                  {/* Trainee Box */}
                  <div
                    style={{
                      background: ack.trainee?.signed ? '#F0FDF4' : '#FFFFFF',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      border: `1px solid ${ack.trainee?.signed ? '#86EFAC' : '#E2E8F0'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                        1. ผู้รับการพัฒนา (เจ้าของแผน)
                      </span>
                      {ack.trainee?.signed && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>
                          ✓ ลงนามแล้ว
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 12px 0' }}>
                      ชื่อ: {ack.trainee?.signed ? ack.trainee.name : plan.personnelName}
                      <br />
                      วันที่: {ack.trainee?.signedAt ? formatDateDDMMYYYYBE(ack.trainee.signedAt) : 'ยังไม่ได้ลงนาม'}
                    </p>

                    {(isOwner || isAdmin || isHR) && (
                      <button
                        type="button"
                        onClick={() => handleSignAcknowledgement('TRAINEE')}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          background: ack.trainee?.signed ? '#DCFCE7' : '#EA580C',
                          color: ack.trainee?.signed ? '#15803D' : '#FFFFFF',
                          border: ack.trainee?.signed ? '1px solid #86EFAC' : 'none',
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {ack.trainee?.signed ? 'ลงนามซ้ำ / อัปเดต' : 'ลงนามรับทราบแผน (ผู้รับการพัฒนา)'}
                      </button>
                    )}
                  </div>

                  {/* Supervisor Box */}
                  <div
                    style={{
                      background: ack.supervisor?.signed ? '#F0FDF4' : '#FFFFFF',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      border: `1px solid ${ack.supervisor?.signed ? '#86EFAC' : '#E2E8F0'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                        2. ผู้บังคับบัญชา
                      </span>
                      {ack.supervisor?.signed && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>
                          ✓ ลงนามแล้ว
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 12px 0' }}>
                      ชื่อ: {ack.supervisor?.signed ? ack.supervisor.name : 'หัวหน้าฝ่าย / รองผู้อำนวยการ'}
                      <br />
                      วันที่: {ack.supervisor?.signedAt ? formatDateDDMMYYYYBE(ack.supervisor.signedAt) : 'ยังไม่ได้ลงนาม'}
                    </p>

                    {(isAdmin || isHR || !isOwner) && (
                      <button
                        type="button"
                        onClick={() => handleSignAcknowledgement('SUPERVISOR')}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          background: ack.supervisor?.signed ? '#DCFCE7' : '#0284C7',
                          color: ack.supervisor?.signed ? '#15803D' : '#FFFFFF',
                          border: ack.supervisor?.signed ? '1px solid #86EFAC' : 'none',
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {ack.supervisor?.signed ? 'ลงนามซ้ำ / อัปเดต' : 'ลงนามรับทราบแผน (ผู้บังคับบัญชา)'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Part 2: สิ้นปี - การประเมินผลพัฒนาตามแผน IDP โดยผู้บังคับบัญชา */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <Award size={20} color="#059669" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    ส่วนที่ 2: การประเมินผลพัฒนาตามแผน IDP โดยผู้บังคับบัญชา (สิ้นปีงบประมาณ)
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Evaluation Result Type */}
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="evalResultType"
                        value="COMPLETED"
                        checked={evalResultType === 'COMPLETED'}
                        onChange={(e) => setEvalResultType(e.target.value)}
                        style={{ accentColor: '#16A34A' }}
                      />
                      <span>ดำเนินการพัฒนาตนเองสำเร็จตามแผน IDP</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="evalResultType"
                        value="NEARLY_COMPLETED"
                        checked={evalResultType === 'NEARLY_COMPLETED'}
                        onChange={(e) => setEvalResultType(e.target.value)}
                        style={{ accentColor: '#EA580C' }}
                      />
                      <span>ดำเนินการพัฒนาตนเองเกือบสำเร็จตามแผน IDP</span>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        คิดเป็นร้อยละ (%):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={evalPercent}
                        onChange={(e) => setEvalPercent(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        เนื่องจาก (เหตุผล):
                      </label>
                      <input
                        type="text"
                        value={evalReason}
                        onChange={(e) => setEvalReason(e.target.value)}
                        className="form-control"
                        placeholder="ระบุเหตุผลประกอบการประเมิน..."
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
                    {/* Supervisor Evaluation Signature */}
                    <div
                      style={{
                        background: ev.supervisor?.signed ? '#F0FDF4' : '#FFFFFF',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        border: `1px solid ${ev.supervisor?.signed ? '#86EFAC' : '#E2E8F0'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                          ผู้บังคับบัญชา (ผู้ประเมินผล)
                        </span>
                        {ev.supervisor?.signed && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>
                            ✓ ประเมินแล้ว
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 12px 0' }}>
                        ชื่อ: {ev.supervisor?.signed ? ev.supervisor.name : 'รองผู้อำนวยการฝ่ายบริหาร / ผู้บังคับบัญชา'}
                        <br />
                        ตำแหน่ง: {ev.supervisor?.position || 'รองผู้อำนวยการฝ่ายบริหาร'}
                        <br />
                        วันที่: {ev.supervisor?.signedAt ? formatDateDDMMYYYYBE(ev.supervisor.signedAt) : 'ยังไม่ได้ลงนาม'}
                      </p>

                      {(isAdmin || isHR || !isOwner) && (
                        <button
                          type="button"
                          onClick={() => handleSignEvaluation('SUPERVISOR')}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            background: ev.supervisor?.signed ? '#DCFCE7' : '#059669',
                            color: ev.supervisor?.signed ? '#15803D' : '#FFFFFF',
                            border: ev.supervisor?.signed ? '1px solid #86EFAC' : 'none',
                            fontSize: '0.825rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {ev.supervisor?.signed ? 'ลงนามซ้ำ / อัปเดตผลประเมิน' : 'ลงนามประเมินผล (ผู้บังคับบัญชา)'}
                        </button>
                      )}
                    </div>

                    {/* Part 3: Trainee Acceptance Signature */}
                    <div
                      style={{
                        background: ev.trainee?.signed ? '#F0FDF4' : '#FFFFFF',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        border: `1px solid ${ev.trainee?.signed ? '#86EFAC' : '#E2E8F0'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                          ส่วนที่ 3: รับทราบผลการพัฒนา IDP
                        </span>
                        {ev.trainee?.signed && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>
                            ✓ รับทราบแล้ว
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 12px 0' }}>
                        ชื่อ: {ev.trainee?.signed ? ev.trainee.name : plan.personnelName}
                        <br />
                        ตำแหน่ง: {ev.trainee?.position || plan.position || 'บุคลากร'}
                        <br />
                        วันที่: {ev.trainee?.signedAt ? formatDateDDMMYYYYBE(ev.trainee.signedAt) : 'ยังไม่ได้ลงนาม'}
                      </p>

                      {(isOwner || isAdmin || isHR) && (
                        <button
                          type="button"
                          onClick={() => handleSignEvaluation('TRAINEE')}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            background: ev.trainee?.signed ? '#DCFCE7' : '#EA580C',
                            color: ev.trainee?.signed ? '#15803D' : '#FFFFFF',
                            border: ev.trainee?.signed ? '1px solid #86EFAC' : 'none',
                            fontSize: '0.825rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {ev.trainee?.signed ? 'ลงนามซ้ำ / อัปเดต' : 'ลงนามรับทราบผลการพัฒนา'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
            {hasUnsavedChanges ? (
              <span style={{ color: '#EA580C', fontWeight: 700 }}>⚠️ มีการแก้ไขที่ยังไม่ได้กดบันทึก</span>
            ) : (
              <span>สถานะ: {IDP_ACTION_PLAN_STATUSES[plan.status]?.label || 'ฉบับร่าง'}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={async () => {
                if (hasUnsavedChanges) {
                  const confirmed = await showConfirm({
                    type: 'warning',
                    title: 'มีรายการที่ยังไม่ได้บันทึก',
                    message: 'คุณมีรายการที่ยังไม่ได้บันทึก ต้องการปิดโดยไม่บันทึกหรือไม่?',
                    confirmText: 'ปิดโดยไม่บันทึก',
                  });
                  if (confirmed) onClose();
                } else {
                  onClose();
                }
              }}
              className="btn btn-secondary"
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}
            >
              ปิด
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAll}
              className="btn btn-primary"
              style={{
                padding: '0.55rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกแผน IDP Action Plan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alignment Selection Sub-Modal */}
      {alignmentTargetItemId && targetAlignmentItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={() => setAlignmentTargetItemId(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1.25rem',
              width: '100%',
              maxWidth: '760px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #E2E8F0',
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
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
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E1B4B', margin: 0 }}>
                    กำหนดความสอดคล้อง 4 มิติ
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#4338CA', margin: '2px 0 0 0', fontWeight: 600 }}>
                    สมรรถนะ: <span style={{ color: '#1E1B4B', fontWeight: 800 }}>{targetAlignmentItem.competencyName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAlignmentTargetItemId(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#FFFFFF',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                padding: '0 1rem',
                gap: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAlignTab('STRATEGY');
                  setAlignSearch('');
                }}
                style={{
                  padding: '0.85rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: alignTab === 'STRATEGY' ? '3px solid #2563EB' : '3px solid transparent',
                  color: alignTab === 'STRATEGY' ? '#1D4ED8' : '#64748B',
                  fontWeight: alignTab === 'STRATEGY' ? 800 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>1. แผนกลยุทธ์ (SFA/SO)</span>
                <span
                  style={{
                    background: (targetAlignmentItem.alignments?.strategyIds || []).length > 0 ? '#2563EB' : '#CBD5E1',
                    color: '#FFFFFF',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                  }}
                >
                  {(targetAlignmentItem.alignments?.strategyIds || []).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAlignTab('SKILL_MAP');
                  setAlignSearch('');
                }}
                style={{
                  padding: '0.85rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: alignTab === 'SKILL_MAP' ? '3px solid #4F46E5' : '3px solid transparent',
                  color: alignTab === 'SKILL_MAP' ? '#4338CA' : '#64748B',
                  fontWeight: alignTab === 'SKILL_MAP' ? 800 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>2. Skill Map</span>
                <span
                  style={{
                    background: (targetAlignmentItem.alignments?.skillMapIds || []).length > 0 ? '#4F46E5' : '#CBD5E1',
                    color: '#FFFFFF',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                  }}
                >
                  {(targetAlignmentItem.alignments?.skillMapIds || []).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAlignTab('MISSION');
                  setAlignSearch('');
                }}
                style={{
                  padding: '0.85rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: alignTab === 'MISSION' ? '3px solid #059669' : '3px solid transparent',
                  color: alignTab === 'MISSION' ? '#047857' : '#64748B',
                  fontWeight: alignTab === 'MISSION' ? 800 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>3. พันธกิจ 5 ด้าน</span>
                <span
                  style={{
                    background: (targetAlignmentItem.alignments?.missionIds || []).length > 0 ? '#059669' : '#CBD5E1',
                    color: '#FFFFFF',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                  }}
                >
                  {(targetAlignmentItem.alignments?.missionIds || []).length}
                </span>
              </button>
            </div>

            {/* Modal Body & Search */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={alignSearch}
                  onChange={(e) => setAlignSearch(e.target.value)}
                  placeholder={
                    alignTab === 'STRATEGY'
                      ? 'ค้นหาประเด็นยุทธศาสตร์ SFA, SO, ตัวชี้วัด CKPI...'
                      : alignTab === 'SKILL_MAP'
                      ? 'ค้นหาทักษะ Skill Map, รหัส, หมวดหมู่...'
                      : 'ค้นหาพันธกิจของสำนักฯ...'
                  }
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              {/* Items List for active tab */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {alignTab === 'STRATEGY' && (
                  <>
                    {availableStrategies
                      .filter((st) => !alignSearch || (st.title || '').toLowerCase().includes(alignSearch.toLowerCase()) || (st.code || '').toLowerCase().includes(alignSearch.toLowerCase()))
                      .map((st) => {
                        const isSelected = (targetAlignmentItem.alignments?.strategyIds || []).includes(st.id);
                        return (
                          <div
                            key={st.id}
                            onClick={() => toggleAlignmentMulti(targetAlignmentItem.id, 'strategy', st.id, st.code || st.title)}
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: '10px',
                              border: `1.5px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}`,
                              background: isSelected ? '#EFF6FF' : '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{ accentColor: '#2563EB', marginTop: '3px', cursor: 'pointer' }}
                              />
                              <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: isSelected ? '#1E40AF' : '#1E293B' }}>
                                  {st.title}
                                </div>
                                {st.desc && (
                                  <div style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '2px' }}>
                                    {st.desc}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: st.type === 'SFA' ? '#FEF3C7' : st.type === 'SO' ? '#E0E7FF' : '#DCFCE7',
                                color: st.type === 'SFA' ? '#92400E' : st.type === 'SO' ? '#3730A3' : '#166534',
                                flexShrink: 0,
                              }}
                            >
                              {st.type || 'STRATEGY'}
                            </span>
                          </div>
                        );
                      })}
                  </>
                )}

                {alignTab === 'SKILL_MAP' && (
                  <>
                    {availableSkills
                      .filter((sk) => !alignSearch || (sk.title || '').toLowerCase().includes(alignSearch.toLowerCase()) || (sk.group || '').toLowerCase().includes(alignSearch.toLowerCase()))
                      .map((sk) => {
                        const isSelected = (targetAlignmentItem.alignments?.skillMapIds || []).includes(sk.id);
                        return (
                          <div
                            key={sk.id}
                            onClick={() => toggleAlignmentMulti(targetAlignmentItem.id, 'skillMap', sk.id, sk.title)}
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: '10px',
                              border: `1.5px solid ${isSelected ? '#6366F1' : '#E2E8F0'}`,
                              background: isSelected ? '#EEF2FF' : '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{ accentColor: '#4F46E5', marginTop: '3px', cursor: 'pointer' }}
                              />
                              <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: isSelected ? '#3730A3' : '#1E293B' }}>
                                  {sk.title}
                                </div>
                                {sk.group && (
                                  <div style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '2px' }}>
                                    หมวดหมู่: {sk.group}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: '#EDE9FE',
                                color: '#5B21B6',
                                flexShrink: 0,
                              }}
                            >
                              SKILL
                            </span>
                          </div>
                        );
                      })}
                  </>
                )}

                {alignTab === 'MISSION' && (
                  <>
                    {availableMissions
                      .filter((ms) => !alignSearch || (ms.title || '').toLowerCase().includes(alignSearch.toLowerCase()))
                      .map((ms) => {
                        const isSelected = (targetAlignmentItem.alignments?.missionIds || []).includes(ms.id);
                        return (
                          <div
                            key={ms.id}
                            onClick={() => toggleAlignmentMulti(targetAlignmentItem.id, 'mission', ms.id, ms.title)}
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: '10px',
                              border: `1.5px solid ${isSelected ? '#10B981' : '#E2E8F0'}`,
                              background: isSelected ? '#ECFDF5' : '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{ accentColor: '#059669', marginTop: '3px', cursor: 'pointer' }}
                              />
                              <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: isSelected ? '#065F46' : '#1E293B' }}>
                                  {ms.title}
                                </div>
                              </div>
                            </div>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: '#D1FAE5',
                                color: '#065F46',
                                flexShrink: 0,
                              }}
                            >
                              MISSION
                            </span>
                          </div>
                        );
                      })}
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '0.825rem', color: '#64748B' }}>
                เลือกแล้ว:{' '}
                <span style={{ fontWeight: 800, color: '#1E293B' }}>
                  {(targetAlignmentItem.alignments?.strategyIds || []).length +
                    (targetAlignmentItem.alignments?.skillMapIds || []).length +
                    (targetAlignmentItem.alignments?.missionIds || []).length}
                </span>{' '}
                รายการ
              </div>

              <button
                type="button"
                onClick={() => setAlignmentTargetItemId(null)}
                style={{
                  padding: '0.55rem 1.5rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                }}
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
