'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Save,
  Plus,
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
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link2,
  Heading2,
  Heading3,
  Minus,
  PenTool,
  FileText,
  Eye,
  FileCheck2,
  Eraser,
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

  // Evaluation Form State (percent & resultType are auto-calculated from items)
  const [evalReason, setEvalReason] = useState('');

  // Active item accordion for mobile / detailed editing
  const [expandedItemId, setExpandedItemId] = useState(null);

  // Competency Type Filter Tabs ('ALL' | 'CORE' | 'FUNCTIONAL')
  const [competencyFilter, setCompetencyFilter] = useState('ALL');

  // Alignment Modal State
  const [alignmentTargetItemId, setAlignmentTargetItemId] = useState(null);
  const [alignTab, setAlignTab] = useState('STRATEGY'); // 'STRATEGY' | 'SKILL_MAP' | 'MISSION'
  const [alignSearch, setAlignSearch] = useState('');
  const [skillAreaFilter, setSkillAreaFilter] = useState('ALL'); // 'ALL' | area shortName

  // Methods Selector Modal State
  const [methodModalItemId, setMethodModalItemId] = useState(null);

  // WYSIWYG Progress Editor Modal State
  const [wysiwygModalState, setWysiwygModalState] = useState(null); // { itemId, quarterKey }
  const [wysiwygHtml, setWysiwygHtml] = useState('');
  const [wysiwygActiveTab, setWysiwygActiveTab] = useState('edit'); // 'edit' | 'preview'
  const editorRef = useRef(null);

  const isHR = isHrOfficer(currentUser, currentPersonnel, isAdmin);
  const userEmail = (currentUser?.email || currentPersonnel?.email || '').trim().toLowerCase();
  const planOwnerEmail = (plan?.personnelEmail || '').trim().toLowerCase();
  const isOwner = userEmail && userEmail === planOwnerEmail;

  // Supervisor / Dept Head / Executive / Admin Permission for Part 2 Evaluation
  const isLeaderOrExecutive = Boolean(
    currentPersonnel?.isExecutive ||
    currentPersonnel?.department === 'คณะผู้บริหาร' ||
    /หัวหน้า|ผู้อำนวยการ|รองผู้อำนวยการ|ผู้บริหาร/i.test(currentPersonnel?.position || '') ||
    /head|director|deputy|executive|supervisor/i.test(currentPersonnel?.role || currentPersonnel?.position || '')
  );

  const canEditEvaluationReason = Boolean(
    isAdmin ||
    isHR ||
    (isLeaderOrExecutive && !isOwner) ||
    (!isOwner && (isAdmin || isHR || isLeaderOrExecutive))
  );

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
      setEvalReason(ev.reason || '');
      setHasUnsavedChanges(false);
      if (plan.items?.length > 0) {
        setExpandedItemId(plan.items[0].id);
      }
    }
  }, [isOpen, plan]);

  // Strategy items list: Show ONLY SO (Strategic Objectives) of that fiscal year, enriched with SFA & CKPI correlation details
  const availableStrategies = useMemo(() => {
    const list = [];
    const sos = strategyConfig?.sos || [];
    const sfas = strategyConfig?.sfas || [];
    const ckpis = strategyConfig?.ckpis || [];

    sos.forEach((so) => {
      const sfa = sfas.find((s) => s.id === so.sfaId || s.code === so.sfaCode) || null;
      list.push({
        id: so.id || so.code,
        code: so.code,
        title: `[${so.code}] ${so.title || so.name || ''}`.trim(),
        rawTitle: so.title || so.name || '',
        category: 'SO',
        sfa: sfa,
        sfaCode: sfa?.code || so.sfaCode || 'SFA',
        sfaName: sfa?.name || '',
        sfaColor: sfa?.color || '#2563EB',
        sfaBg: sfa?.bg || '#EFF6FF',
        sfaBorder: sfa?.border || '#BFDBFE',
        ckpiList: ckpis,
        skpis: so.skpis || [],
        alignmentCodes: so.alignmentCodes || [],
        responsibleRoles: so.responsibleRoles || [],
      });
    });

    return list;
  }, [strategyConfig]);

  // Skill Map items list for Multi-select — list individual sub-skills (ทักษะย่อย) not main competency categories
  const availableSkills = useMemo(() => {
    const list = [];
    if (skillMapConfig?.workAreas) {
      skillMapConfig.workAreas.forEach((area) => {
        (area.competencies || []).forEach((comp) => {
          (comp.subSkills || []).forEach((sub) => {
            list.push({
              id: sub.id,
              title: sub.name,
              description: sub.description || '',
              competencyName: comp.name,
              areaName: area.shortName || area.name,
              areaColor: area.color || '#4F46E5',
            });
          });
        });
      });
    }
    return list;
  }, [skillMapConfig]);

  // Unique work area tabs for Skill Map alignment filter
  const skillWorkAreaTabs = useMemo(() => {
    const seen = new Set();
    const tabs = [];
    availableSkills.forEach((sk) => {
      if (!seen.has(sk.areaName)) {
        seen.add(sk.areaName);
        tabs.push({ name: sk.areaName, color: sk.areaColor });
      }
    });
    return tabs;
  }, [availableSkills]);

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

  // Auto-calculate evaluation percentage from individual item achievement statuses
  const evalPercent = useMemo(() => {
    if (!items || items.length === 0) return 0;
    const achievedCount = items.filter((it) => it.evaluation?.status === 'ACHIEVED').length;
    return Math.round((achievedCount / items.length) * 100);
  }, [items]);

  // Auto-derive result type: 100% = COMPLETED, otherwise NEARLY_COMPLETED
  const evalResultType = useMemo(() => {
    return evalPercent >= 100 ? 'COMPLETED' : 'NEARLY_COMPLETED';
  }, [evalPercent]);

  const targetAlignmentItem = useMemo(() => {
    if (!alignmentTargetItemId) return null;
    return items.find((it) => it.id === alignmentTargetItemId) || null;
  }, [items, alignmentTargetItemId]);

  const targetMethodItem = useMemo(() => {
    if (!methodModalItemId) return null;
    return items.find((it) => it.id === methodModalItemId) || null;
  }, [items, methodModalItemId]);

  const targetWysiwygItem = useMemo(() => {
    if (!wysiwygModalState?.itemId) return null;
    return items.find((it) => it.id === wysiwygModalState.itemId) || null;
  }, [items, wysiwygModalState]);

  // Sync editor innerHTML when opening or switching modal
  useEffect(() => {
    if (wysiwygModalState && editorRef.current) {
      editorRef.current.innerHTML = wysiwygHtml;
    }
  }, [wysiwygModalState?.itemId, wysiwygModalState?.quarterKey]);

  const openWysiwygModal = (itemId, quarterKey) => {
    const item = items.find((it) => it.id === itemId);
    const existingProgress = item?.quarters?.[quarterKey]?.progress || '';
    setWysiwygHtml(existingProgress);
    setWysiwygActiveTab('edit');
    setWysiwygModalState({ itemId, quarterKey });
  };

  const handleSwitchWysiwygQuarter = (newQuarterKey) => {
    if (!wysiwygModalState) return;
    const currentHtml = editorRef.current ? editorRef.current.innerHTML : wysiwygHtml;
    // Auto-save current quarter
    updateQuarterProgress(wysiwygModalState.itemId, wysiwygModalState.quarterKey, 'progress', currentHtml);
    // Switch to new quarter
    const item = items.find((it) => it.id === wysiwygModalState.itemId);
    const nextProgress = item?.quarters?.[newQuarterKey]?.progress || '';
    setWysiwygHtml(nextProgress);
    if (editorRef.current) {
      editorRef.current.innerHTML = nextProgress;
    }
    setWysiwygModalState((prev) => ({ ...prev, quarterKey: newQuarterKey }));
  };

  const handleSaveWysiwyg = () => {
    if (!wysiwygModalState) return;
    const finalHtml = editorRef.current ? editorRef.current.innerHTML : wysiwygHtml;
    updateQuarterProgress(wysiwygModalState.itemId, wysiwygModalState.quarterKey, 'progress', finalHtml);
    setWysiwygModalState(null);
  };

  const executeEditorCommand = (command, value = null) => {
    if (typeof document !== 'undefined') {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        setWysiwygHtml(editorRef.current.innerHTML);
      }
    }
  };

  const handleAddEditorLink = () => {
    const url = prompt('กรุณาระบุ URL ของลิงก์ (เช่น https://...):', 'https://');
    if (url) {
      executeEditorCommand('createLink', url);
    }
  };

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
    const target = items.find((it) => it.id === itemId);
    const currentMethods = target?.methods || [];
    const isSelected = currentMethods.includes(methodId);

    if (!isSelected && currentMethods.length >= 3) {
      showAlert({
        type: 'warning',
        title: 'เลือกได้สูงสุด 3 วิธีการ',
        message: 'ท่านสามารถเลือกวิธีการพัฒนาได้สูงสุดไม่เกิน 3 วิธีการต่อ 1 สมรรถนะ กรุณายกเลิกวิธีที่ไม่ต้องการออกก่อนเลือกวิธีใหม่',
      });
      return;
    }

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const curMethods = it.methods || [];
        const exists = curMethods.includes(methodId);
        const updated = exists
          ? curMethods.filter((m) => m !== methodId)
          : [...curMethods, methodId].sort((a, b) => a - b);
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
      skillDetail: '',
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
                                  {item.competencyName || 'ระบุชื่อสมรรถนะที่ต้องการพัฒนา'}
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
                                <textarea
                                  value={item.skillDetail || ''}
                                  onChange={(e) => updateItemField(item.id, 'skillDetail', e.target.value)}
                                  className="form-control"
                                  rows={2}
                                  placeholder="เช่น ทักษะด้านการวิเคราะห์และออกแบบกระบวนการ"
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

                            {/* Row 2: Development Methods (Modal Selector + Badges) */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', margin: 0 }}>
                                  วิธีการพัฒนา (Development Methods):
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setMethodModalItemId(item.id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                                    color: '#C2410C',
                                    border: '1px solid #FDBA74',
                                    borderRadius: '8px',
                                    padding: '5px 12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  <BookOpen size={15} />
                                  <span>เลือกวิธีการพัฒนา</span>
                                  {(item.methods || []).length > 0 && (
                                    <span
                                      style={{
                                        background: '#EA580C',
                                        color: '#FFFFFF',
                                        borderRadius: '999px',
                                        padding: '1px 7px',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                      }}
                                    >
                                      {(item.methods || []).length}/3
                                    </span>
                                  )}
                                </button>
                              </div>

                              {/* Selected Method Badges */}
                              <div
                                style={{
                                  background: '#F8FAFC',
                                  padding: '10px 12px',
                                  borderRadius: '10px',
                                  border: '1px solid #E2E8F0',
                                  minHeight: '44px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '6px',
                                }}
                              >
                                {(item.methods || []).length === 0 ? (
                                  <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                    ยังไม่ได้เลือกวิธีการพัฒนา — คลิกปุ่ม "เลือกวิธีการพัฒนา" ด้านบนเพื่อเลือกจาก 10 รูปแบบ (เลือกได้สูงสุด 3 วิธีการ)
                                  </span>
                                ) : (
                                  item.methods.map((methodId) => {
                                    const mObj = IDP_DEVELOPMENT_METHODS.find((m) => m.id === methodId);
                                    if (!mObj) return null;
                                    const isOther = methodId === 10;
                                    return (
                                      <span
                                        key={methodId}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          background: isOther ? '#FEF3C7' : '#EFF6FF',
                                          color: isOther ? '#92400E' : '#1E40AF',
                                          border: `1px solid ${isOther ? '#FDE68A' : '#BFDBFE'}`,
                                          borderRadius: '6px',
                                          padding: '3px 8px',
                                          fontSize: '0.785rem',
                                          fontWeight: 600,
                                        }}
                                      >
                                        <span style={{ fontWeight: 800 }}>{mObj.shortTitle}</span>
                                        {isOther && item.methodCustom && (
                                          <span style={{ color: '#78350F', fontWeight: 500 }}>
                                            : {item.methodCustom}
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })
                                )}
                              </div>
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

                            {/* Row 4: Quarterly Progress Reporting (Q1..Q4) via WYSIWYG */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                ช่วงเวลาที่พัฒนาและการรายงานผลรายไตรมาส (Q1 - Q4):
                              </label>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                                {IDP_ACTION_PLAN_QUARTERS.map((q) => {
                                  const qProgress = item.quarters?.[q.key]?.progress || '';
                                  const hasReport = Boolean(qProgress && qProgress.trim());
                                  // Clean text preview from HTML for display
                                  const plainTextPreview = qProgress.replace(/<[^>]*>?/gm, '').trim();

                                  return (
                                    <div
                                      key={q.key}
                                      style={{
                                        borderRadius: '12px',
                                        border: `1.5px solid ${hasReport ? '#86EFAC' : '#E2E8F0'}`,
                                        background: hasReport ? '#F0FDF4' : '#F8FAFC',
                                        padding: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: '8px',
                                        boxShadow: hasReport ? '0 2px 6px rgba(34, 197, 94, 0.08)' : 'none',
                                      }}
                                    >
                                      <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                          <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#1E293B' }}>
                                            {q.fullLabel}
                                          </div>
                                          {hasReport ? (
                                            <span
                                              style={{
                                                fontSize: '0.7rem',
                                                background: '#DCFCE7',
                                                color: '#166534',
                                                padding: '2px 8px',
                                                borderRadius: '999px',
                                                fontWeight: 800,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                              }}
                                            >
                                              <CheckCircle2 size={12} />
                                              รายงานแล้ว
                                            </span>
                                          ) : (
                                            <span
                                              style={{
                                                fontSize: '0.7rem',
                                                background: '#E2E8F0',
                                                color: '#64748B',
                                                padding: '2px 8px',
                                                borderRadius: '999px',
                                                fontWeight: 600,
                                              }}
                                            >
                                              ยังไม่มีรายงาน
                                            </span>
                                          )}
                                        </div>

                                        {/* Progress Text Preview Box */}
                                        <div
                                          style={{
                                            background: '#FFFFFF',
                                            borderRadius: '8px',
                                            border: '1px solid #E2E8F0',
                                            padding: '8px 10px',
                                            fontSize: '0.785rem',
                                            color: hasReport ? '#334155' : '#94A3B8',
                                            minHeight: '48px',
                                            maxHeight: '75px',
                                            overflowY: 'auto',
                                            lineHeight: '1.4',
                                          }}
                                        >
                                          {hasReport ? (
                                            plainTextPreview || 'บันทึกรายงานผลเรียบร้อยแล้ว'
                                          ) : (
                                            <span style={{ fontStyle: 'italic' }}>ยังไม่มีข้อมูลรายงานผลในไตรมาสนี้</span>
                                          )}
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => openWysiwygModal(item.id, q.key)}
                                        style={{
                                          width: '100%',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '6px',
                                          background: hasReport ? '#FFFFFF' : 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                                          color: hasReport ? '#15803D' : '#4338CA',
                                          border: `1px solid ${hasReport ? '#86EFAC' : '#C7D2FE'}`,
                                          borderRadius: '8px',
                                          padding: '6px 10px',
                                          fontSize: '0.775rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          transition: 'all 0.15s',
                                        }}
                                      >
                                        <PenTool size={13} />
                                        <span>{hasReport ? 'แก้ไขรายงานผล' : 'เขียนรายงานผล'}</span>
                                      </button>
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
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: evalResultType === 'COMPLETED' ? '#15803D' : '#94A3B8', cursor: 'default' }}>
                      <input
                        type="radio"
                        name="evalResultType"
                        value="COMPLETED"
                        checked={evalResultType === 'COMPLETED'}
                        readOnly
                        style={{ accentColor: '#16A34A', pointerEvents: 'none' }}
                      />
                      <span>ดำเนินการพัฒนาตนเองสำเร็จตามแผน IDP</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: evalResultType === 'NEARLY_COMPLETED' ? '#EA580C' : '#94A3B8', cursor: 'default' }}>
                      <input
                        type="radio"
                        name="evalResultType"
                        value="NEARLY_COMPLETED"
                        checked={evalResultType === 'NEARLY_COMPLETED'}
                        readOnly
                        style={{ accentColor: '#EA580C', pointerEvents: 'none' }}
                      />
                      <span>ดำเนินการพัฒนาตนเองเกือบสำเร็จตามแผน IDP</span>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        คิดเป็นร้อยละ (%):
                      </label>
                      <div
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          background: evalPercent >= 100 ? '#F0FDF4' : evalPercent >= 50 ? '#FFFBEB' : '#FEF2F2',
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: evalPercent >= 100 ? '#15803D' : evalPercent >= 50 ? '#92400E' : '#B91C1C',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{evalPercent}%</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94A3B8' }}>
                          ({items.filter((it) => it.evaluation?.status === 'ACHIEVED').length}/{items.length} รายการที่บรรลุ)
                        </span>
                      </div>
                      <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                        * คำนวณอัตโนมัติจากจำนวนสมรรถนะที่ประเมินว่า "บรรลุตามตัวชี้วัด"
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        เนื่องจาก (เหตุผลประกอบการประเมิน):
                      </label>
                      <textarea
                        rows={3}
                        value={evalReason}
                        onChange={(e) => {
                          if (canEditEvaluationReason) {
                            setEvalReason(e.target.value);
                            setHasUnsavedChanges(true);
                          }
                        }}
                        readOnly={!canEditEvaluationReason}
                        className="form-control"
                        placeholder={
                          canEditEvaluationReason
                            ? 'ระบุเหตุผลประกอบการประเมินผลการพัฒนาตนเอง...'
                            : 'ยังไม่มีการระบุเหตุผลประกอบการประเมิน (สงวนสิทธิ์เฉพาะหัวหน้า/ผู้บังคับบัญชา/ผู้ดูแลระบบ)'
                        }
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          border: `1px solid ${canEditEvaluationReason ? '#CBD5E1' : '#E2E8F0'}`,
                          backgroundColor: canEditEvaluationReason ? '#FFFFFF' : '#F1F5F9',
                          color: canEditEvaluationReason ? '#1E293B' : '#64748B',
                          cursor: canEditEvaluationReason ? 'text' : 'not-allowed',
                          fontSize: '0.85rem',
                          lineHeight: '1.5',
                        }}
                      />
                      {!canEditEvaluationReason && (
                        <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                          * สงวนสิทธิ์การระบุ/แก้ไขเหตุผลเฉพาะหัวหน้าฝ่าย, ผู้บังคับบัญชา หรือผู้ดูแลระบบเท่านั้น
                        </p>
                      )}
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

      {/* 1. Development Methods Selection Modal */}
      {methodModalItemId && targetMethodItem && (
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
          onClick={() => setMethodModalItemId(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1.25rem',
              width: '100%',
              maxWidth: '720px',
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
                background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#EA580C',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.3)',
                  }}
                >
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7C2D12', margin: 0 }}>
                    เลือกวิธีการพัฒนา (Development Methods)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#9A3412', margin: '2px 0 0 0', fontWeight: 600 }}>
                    สมรรถนะ: <span style={{ color: '#7C2D12', fontWeight: 800 }}>{targetMethodItem.competencyName || 'ไม่ระบุชื่อสมรรถนะ'}</span> (เลือกได้สูงสุด 3 วิธีการ)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMethodModalItemId(null)}
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

            {/* Modal Body - Method Cards */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
                {IDP_DEVELOPMENT_METHODS.map((method) => {
                  const isChecked = (targetMethodItem.methods || []).includes(method.id);
                  const isMaxReached = !isChecked && (targetMethodItem.methods || []).length >= 3;
                  return (
                    <div
                      key={method.id}
                      onClick={() => toggleItemMethod(targetMethodItem.id, method.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: `1.5px solid ${isChecked ? '#EA580C' : isMaxReached ? '#E2E8F0' : '#E2E8F0'}`,
                        background: isChecked ? '#FFF7ED' : isMaxReached ? '#F8FAFC' : '#FFFFFF',
                        cursor: isMaxReached ? 'not-allowed' : 'pointer',
                        opacity: isMaxReached ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        transition: 'all 0.15s ease-in-out',
                        boxShadow: isChecked ? '0 2px 8px rgba(234, 88, 12, 0.12)' : 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isMaxReached}
                        onChange={() => {}}
                        style={{
                          accentColor: '#EA580C',
                          marginTop: '3px',
                          cursor: isMaxReached ? 'not-allowed' : 'pointer',
                          width: '16px',
                          height: '16px',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: isChecked ? '#9A3412' : isMaxReached ? '#94A3B8' : '#1E293B', lineHeight: '1.3' }}>
                          {method.shortTitle}
                        </div>
                        <div style={{ fontSize: '0.785rem', color: isChecked ? '#C2410C' : isMaxReached ? '#94A3B8' : '#64748B', marginTop: '3px', lineHeight: '1.4' }}>
                          {method.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Input for Method 10 */}
              {(targetMethodItem.methods || []).includes(10) && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: '#FEF3C7',
                    border: '1.5px solid #FDE68A',
                  }}
                >
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#92400E', marginBottom: '6px' }}>
                    ระบุรายละเอียดสำหรับ "10. อื่น ๆ โปรดระบุ":
                  </label>
                  <input
                    type="text"
                    value={targetMethodItem.methodCustom || ''}
                    onChange={(e) => updateItemField(targetMethodItem.id, 'methodCustom', e.target.value)}
                    className="form-control"
                    placeholder="เช่น เข้าร่วมโครงการศึกษาดูงาน, การทำวิจัยเฉพาะกิจ..."
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #FCD34D',
                      fontSize: '0.875rem',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>
              )}
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
                <span style={{ fontWeight: 800, color: (targetMethodItem.methods || []).length === 3 ? '#16A34A' : '#EA580C' }}>
                  {(targetMethodItem.methods || []).length} / 3
                </span>{' '}
                วิธีการ {(targetMethodItem.methods || []).length >= 3 && <span style={{ color: '#16A34A', fontWeight: 700 }}>(เลือกครบ 3 วิธีแล้ว)</span>}
              </div>

              <button
                type="button"
                onClick={() => setMethodModalItemId(null)}
                style={{
                  padding: '0.55rem 1.5rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                }}
              >
                บันทึก & ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. WYSIWYG Quarterly Progress Modal */}
      {!!wysiwygModalState && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10010,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            animation: 'fadeIn 0.15s ease-out',
          }}
          onClick={() => setWysiwygModalState(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1.25rem',
              width: '100%',
              maxWidth: '860px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
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
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  <PenTool size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E1B4B', margin: 0 }}>
                    บันทึกผลการพัฒนา (Progress Report) — {IDP_ACTION_PLAN_QUARTERS.find((q) => q.key === wysiwygModalState.quarterKey)?.fullLabel || wysiwygModalState.quarterKey}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#4338CA', margin: '2px 0 0 0', fontWeight: 600 }}>
                    สมรรถนะ: <span style={{ color: '#1E1B4B', fontWeight: 800 }}>{targetWysiwygItem ? (targetWysiwygItem.competencyName || 'ไม่ระบุชื่อสมรรถนะ') : ''}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWysiwygModalState(null)}
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

            {/* Quarter Selector & Edit/Preview Mode Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '0.65rem 1.25rem',
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.785rem', fontWeight: 700, color: '#64748B', marginRight: '4px' }}>
                  สลับไตรมาส:
                </span>
                {IDP_ACTION_PLAN_QUARTERS.map((q) => {
                  const isCurrentQ = wysiwygModalState.quarterKey === q.key;
                  const qVal = targetWysiwygItem?.quarters?.[q.key]?.progress || '';
                  const hasVal = Boolean(qVal.trim());
                  return (
                    <button
                      key={q.key}
                      type="button"
                      onClick={() => handleSwitchWysiwygQuarter(q.key)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.785rem',
                        fontWeight: isCurrentQ ? 800 : 600,
                        border: isCurrentQ ? '1.5px solid #4F46E5' : '1px solid #CBD5E1',
                        background: isCurrentQ ? '#EEF2FF' : '#FFFFFF',
                        color: isCurrentQ ? '#4F46E5' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span>{q.fullLabel}</span>
                      {hasVal && (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#16A34A',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Edit vs Preview Toggle */}
              <div
                style={{
                  display: 'flex',
                  background: '#E2E8F0',
                  borderRadius: '8px',
                  padding: '2px',
                  gap: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setWysiwygActiveTab('edit')}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: wysiwygActiveTab === 'edit' ? 700 : 500,
                    background: wysiwygActiveTab === 'edit' ? '#FFFFFF' : 'transparent',
                    color: wysiwygActiveTab === 'edit' ? '#1E293B' : '#64748B',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: wysiwygActiveTab === 'edit' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <Edit3 size={12} /> แก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => setWysiwygActiveTab('preview')}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: wysiwygActiveTab === 'preview' ? 700 : 500,
                    background: wysiwygActiveTab === 'preview' ? '#FFFFFF' : 'transparent',
                    color: wysiwygActiveTab === 'preview' ? '#1E293B' : '#64748B',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: wysiwygActiveTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <Eye size={12} /> ตัวอย่าง
                </button>
              </div>
            </div>

            {/* WYSIWYG Toolbar (When in Edit tab) */}
            {wysiwygActiveTab === 'edit' && (
              <div
                style={{
                  padding: '6px 14px',
                  background: '#F1F5F9',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => executeEditorCommand('bold')}
                  title="ตัวหนา (Bold)"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => executeEditorCommand('italic')}
                  title="ตัวเอียง (Italic)"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Italic size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => executeEditorCommand('underline')}
                  title="ขีดเส้นใต้ (Underline)"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Underline size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => executeEditorCommand('strikeThrough')}
                  title="ขีดฆ่า (Strikethrough)"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Strikethrough size={14} />
                </button>

                <div style={{ width: '1px', height: '18px', background: '#CBD5E1', margin: '0 3px' }} />

                <button
                  type="button"
                  onClick={() => executeEditorCommand('formatBlock', '<h2>')}
                  title="หัวข้อ H2"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '0.785rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <Heading2 size={14} /> H2
                </button>
                <button
                  type="button"
                  onClick={() => executeEditorCommand('formatBlock', '<h3>')}
                  title="หัวข้อ H3"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '0.785rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <Heading3 size={14} /> H3
                </button>
                <button
                  type="button"
                  onClick={() => executeEditorCommand('formatBlock', '<p>')}
                  title="ย่อหน้าปกติ (Paragraph)"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '0.785rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  ข้อความ
                </button>

                <div style={{ width: '1px', height: '18px', background: '#CBD5E1', margin: '0 3px' }} />

                <button
                  type="button"
                  onClick={() => executeEditorCommand('insertUnorderedList')}
                  title="รายการสัญลักษณ์ (Bullet List)"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => executeEditorCommand('insertOrderedList')}
                  title="รายการตัวเลข (Numbered List)"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ListOrdered size={14} />
                </button>

                <div style={{ width: '1px', height: '18px', background: '#CBD5E1', margin: '0 3px' }} />

                <button
                  type="button"
                  onClick={() => executeEditorCommand('justifyLeft')}
                  title="ชิดซ้าย"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => executeEditorCommand('justifyCenter')}
                  title="จัดกึ่งกลาง"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => executeEditorCommand('justifyRight')}
                  title="ชิดขวา"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <AlignRight size={14} />
                </button>

                <div style={{ width: '1px', height: '18px', background: '#CBD5E1', margin: '0 3px' }} />

                <button
                  type="button"
                  onClick={handleAddEditorLink}
                  title="แทรกลิงก์ (Link)"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#2563EB',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <Link2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => executeEditorCommand('insertHorizontalRule')}
                  title="เส้นคั่น (Horizontal Rule)"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Minus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => executeEditorCommand('removeFormat')}
                  title="ล้างรูปแบบ (Clear Formatting)"
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#EF4444',
                    cursor: 'pointer',
                    fontSize: '0.785rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <Eraser size={13} /> ล้างรูปแบบ
                </button>
              </div>
            )}

            {/* Content Area (Edit or Preview) */}
            <div style={{ padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              {wysiwygActiveTab === 'edit' ? (
                <>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setWysiwygHtml(e.currentTarget.innerHTML)}
                    style={{
                      flex: 1,
                      minHeight: '260px',
                      maxHeight: '420px',
                      overflowY: 'auto',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '10px',
                      padding: '1rem 1.25rem',
                      outline: 'none',
                      fontSize: '0.925rem',
                      lineHeight: '1.65',
                      color: '#1E293B',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#64748B',
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}
                  >
                    <span>💡 สรุปผลการพัฒนา / โครงการ / ใบประกาศนียบัตร หรือปัญหาอุปสรรค</span>
                    <span>{(wysiwygHtml || '').replace(/<[^>]*>?/gm, '').length} ตัวอักษร</span>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    flex: 1,
                    minHeight: '260px',
                    maxHeight: '420px',
                    overflowY: 'auto',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    backgroundColor: '#F8FAFC',
                    fontSize: '0.925rem',
                    lineHeight: '1.65',
                    color: '#1E293B',
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      wysiwygHtml ||
                      '<p style="color: #94A3B8; font-style: italic; text-align: center; margin-top: 2rem;">(ยังไม่มีข้อความรายงานผลสำหรับไตรมาสนี้)</p>',
                  }}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => setWysiwygModalState(null)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  color: '#64748B',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveWysiwyg}
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>บันทึกรายงานผล</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                    สมรรถนะ: <span style={{ color: '#1E1B4B', fontWeight: 800 }}>{targetAlignmentItem.competencyName || 'ไม่ระบุชื่อสมรรถนะ'}</span>
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

            {/* Modal Body & Search / Area Tabs */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Skill Map: Work Area Tab Buttons | Others: Search Bar */}
              {alignTab === 'SKILL_MAP' ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSkillAreaFilter('ALL')}
                    style={{
                      padding: '5px 14px',
                      borderRadius: '999px',
                      border: skillAreaFilter === 'ALL' ? '1.5px solid #4F46E5' : '1px solid #CBD5E1',
                      background: skillAreaFilter === 'ALL' ? 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' : '#FFFFFF',
                      color: skillAreaFilter === 'ALL' ? '#FFFFFF' : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: skillAreaFilter === 'ALL' ? '0 2px 6px rgba(79, 70, 229, 0.25)' : 'none',
                    }}
                  >
                    ทั้งหมด
                  </button>
                  {skillWorkAreaTabs.map((tab) => {
                    const isActive = skillAreaFilter === tab.name;
                    return (
                      <button
                        key={tab.name}
                        type="button"
                        onClick={() => setSkillAreaFilter(tab.name)}
                        style={{
                          padding: '5px 14px',
                          borderRadius: '999px',
                          border: isActive ? `1.5px solid ${tab.color}` : '1px solid #CBD5E1',
                          background: isActive ? tab.color : '#FFFFFF',
                          color: isActive ? '#FFFFFF' : '#475569',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: isActive ? `0 2px 6px ${tab.color}40` : 'none',
                        }}
                      >
                        {tab.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={alignSearch}
                    onChange={(e) => setAlignSearch(e.target.value)}
                    placeholder={
                      alignTab === 'STRATEGY'
                        ? 'ค้นหาประเด็นยุทธศาสตร์ SFA, SO, ตัวชี้วัด CKPI...'
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
              )}

              {/* Items List for active tab */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {alignTab === 'STRATEGY' && (
                  <>
                    {availableStrategies
                      .filter((st) => !alignSearch || (st.title || '').toLowerCase().includes(alignSearch.toLowerCase()) || (st.code || '').toLowerCase().includes(alignSearch.toLowerCase()) || (st.sfaName || '').toLowerCase().includes(alignSearch.toLowerCase()) || (st.sfaCode || '').toLowerCase().includes(alignSearch.toLowerCase()))
                      .map((st) => {
                        const isSelected = (targetAlignmentItem.alignments?.strategyIds || []).includes(st.id);
                        return (
                          <div
                            key={st.id}
                            onClick={() => toggleAlignmentMulti(targetAlignmentItem.id, 'strategy', st.id, st.code || st.title)}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: '12px',
                              border: `1.5px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}`,
                              background: isSelected ? '#EFF6FF' : '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '12px',
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{ accentColor: '#2563EB', marginTop: '3px', cursor: 'pointer' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: isSelected ? '#1E40AF' : '#1E293B' }}>
                                  {st.title}
                                </div>
                                {/* SFA Badge with full name */}
                                {st.sfaCode && (
                                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '3px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.73rem',
                                        fontWeight: 700,
                                        background: st.sfaBg || '#EFF6FF',
                                        color: st.sfaColor || '#2563EB',
                                        border: `1px solid ${st.sfaBorder || '#BFDBFE'}`,
                                      }}
                                    >
                                      📌 {st.sfaCode}
                                    </span>
                                    {st.sfaName && (
                                      <span style={{ fontSize: '0.73rem', color: '#475569', fontWeight: 600, lineHeight: 1.3 }}>
                                        {st.sfaName}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {/* SKPIs list */}
                                {(st.skpis || []).length > 0 && (
                                  <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {st.skpis.slice(0, 3).map((skpi, sIdx) => (
                                      <div key={skpi.id || sIdx} style={{ fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'flex-start', gap: '4px', lineHeight: 1.35 }}>
                                        <span style={{ color: '#94A3B8', flexShrink: 0 }}>📊</span>
                                        <span>{skpi.title}</span>
                                      </div>
                                    ))}
                                    {st.skpis.length > 3 && (
                                      <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                        ...อีก {st.skpis.length - 3} ตัวชี้วัด
                                      </span>
                                    )}
                                  </div>
                                )}
                                {/* Responsible Roles */}
                                {(st.responsibleRoles || []).length > 0 && (
                                  <div style={{ marginTop: '5px', fontSize: '0.7rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                    <span>👤</span>
                                    <span>{st.responsibleRoles.join(', ')}</span>
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
                                background: '#E0E7FF',
                                color: '#3730A3',
                                flexShrink: 0,
                              }}
                            >
                              {st.code}
                            </span>
                          </div>
                        );
                      })}
                  </>
                )}

                {alignTab === 'SKILL_MAP' && (() => {
                  // Group sub-skills by competency name for organized display
                  // Filter by selected work area tab
                  const filteredSkills = availableSkills.filter(
                    (sk) => skillAreaFilter === 'ALL' || sk.areaName === skillAreaFilter
                  );

                  // Group by areaName -> competencyName
                  const grouped = [];
                  let lastAreaComp = '';
                  filteredSkills.forEach((sk) => {
                    const key = `${sk.areaName}||${sk.competencyName}`;
                    if (key !== lastAreaComp) {
                      grouped.push({ type: 'header', areaName: sk.areaName, competencyName: sk.competencyName, areaColor: sk.areaColor });
                      lastAreaComp = key;
                    }
                    grouped.push({ type: 'skill', ...sk });
                  });

                  return (
                    <>
                      {grouped.map((entry, gIdx) => {
                        if (entry.type === 'header') {
                          return (
                            <div key={`hdr-${gIdx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0 2px 0' }}>
                              <div style={{ width: '4px', height: '18px', borderRadius: '2px', background: entry.areaColor || '#4F46E5', flexShrink: 0 }} />
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1E293B' }}>{entry.areaName}</span>
                              <span style={{ fontSize: '0.73rem', color: '#64748B', fontWeight: 600 }}>›</span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>{entry.competencyName}</span>
                            </div>
                          );
                        }
                        const sk = entry;
                        const isSelected = (targetAlignmentItem.alignments?.skillMapIds || []).includes(sk.id);
                        return (
                          <div
                            key={sk.id}
                            onClick={() => toggleAlignmentMulti(targetAlignmentItem.id, 'skillMap', sk.id, sk.title)}
                            style={{
                              padding: '0.65rem 0.85rem 0.65rem 1.25rem',
                              marginLeft: '12px',
                              borderRadius: '10px',
                              border: `1.5px solid ${isSelected ? '#6366F1' : '#E2E8F0'}`,
                              background: isSelected ? '#EEF2FF' : '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '12px',
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{ accentColor: '#4F46E5', marginTop: '3px', cursor: 'pointer' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isSelected ? '#3730A3' : '#1E293B' }}>
                                  {sk.title}
                                </div>
                                {sk.description && (
                                  <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '3px', lineHeight: 1.35 }}>
                                    {sk.description}
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
                                background: isSelected ? '#EDE9FE' : '#F1F5F9',
                                color: isSelected ? '#5B21B6' : '#64748B',
                                flexShrink: 0,
                              }}
                            >
                              ทักษะย่อย
                            </span>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}

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
