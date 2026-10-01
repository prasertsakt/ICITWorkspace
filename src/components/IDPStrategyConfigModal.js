'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Copy,
  AlertCircle,
  CheckCircle2,
  Layers,
  Compass,
  Target,
  Calendar,
  Sparkles,
  HelpCircle,
  FileText,
  BarChart3,
  Award,
  ChevronRight,
  ShieldCheck,
  Building,
  Info,
  Lightbulb,
  Check,
  BookOpen,
} from 'lucide-react';
import { DEFAULT_IDP_STRATEGY_CONFIG_2569 } from '../lib/constants';
import { saveStrategyConfig, duplicateStrategyConfig, subscribeStrategyConfig } from '../lib/idpService';
import { getAvailableFiscalYears } from '../lib/dateUtils';

export default function IDPStrategyConfigModal({
  isOpen,
  onClose,
  currentFiscalYear = '2569',
  initialConfig = null,
  currentUser,
  currentPersonnel,
  onSaved,
}) {
  const [selectedYear, setSelectedYear] = useState(currentFiscalYear);
  const [activeTab, setActiveTab] = useState('vision'); // 'vision' | 'sfa' | 'so'

  // Strategy Config States
  const [title, setTitle] = useState(DEFAULT_IDP_STRATEGY_CONFIG_2569.title);
  const [approvalMeeting, setApprovalMeeting] = useState(DEFAULT_IDP_STRATEGY_CONFIG_2569.approvalMeeting);
  const [vision, setVision] = useState(DEFAULT_IDP_STRATEGY_CONFIG_2569.vision);
  const [visionMeaningCreate, setVisionMeaningCreate] = useState(
    DEFAULT_IDP_STRATEGY_CONFIG_2569.visionMeaning?.create || ''
  );
  const [visionMeaningLifestyle, setVisionMeaningLifestyle] = useState(
    DEFAULT_IDP_STRATEGY_CONFIG_2569.visionMeaning?.lifestyle || ''
  );
  const [corePurpose, setCorePurpose] = useState(DEFAULT_IDP_STRATEGY_CONFIG_2569.corePurpose);
  const [ckpis, setCkpis] = useState(DEFAULT_IDP_STRATEGY_CONFIG_2569.ckpis || []);
  const [coreCompetencies, setCoreCompetencies] = useState(DEFAULT_IDP_STRATEGY_CONFIG_2569.coreCompetencies || []);
  const [missions, setMissions] = useState(DEFAULT_IDP_STRATEGY_CONFIG_2569.missions || []);
  const [sfas, setSfas] = useState(DEFAULT_IDP_STRATEGY_CONFIG_2569.sfas || []);
  const [sos, setSos] = useState(DEFAULT_IDP_STRATEGY_CONFIG_2569.sos || []);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Duplicate states
  const [showDuplicateBox, setShowDuplicateBox] = useState(false);
  const [duplicateFromYear, setDuplicateFromYear] = useState(String(Number(currentFiscalYear) - 1));

  // Dynamic fiscal year list
  const availableFiscalYears = useMemo(() => getAvailableFiscalYears(2568, 1, true), []);

  // Sync state with selected fiscal year
  useEffect(() => {
    if (!isOpen) return;

    const unsub = subscribeStrategyConfig(selectedYear, (cfg) => {
      if (cfg) {
        setTitle(cfg.title || DEFAULT_IDP_STRATEGY_CONFIG_2569.title);
        setApprovalMeeting(cfg.approvalMeeting || DEFAULT_IDP_STRATEGY_CONFIG_2569.approvalMeeting);
        setVision(cfg.vision || DEFAULT_IDP_STRATEGY_CONFIG_2569.vision);
        setVisionMeaningCreate(cfg.visionMeaning?.create || DEFAULT_IDP_STRATEGY_CONFIG_2569.visionMeaning?.create || '');
        setVisionMeaningLifestyle(cfg.visionMeaning?.lifestyle || DEFAULT_IDP_STRATEGY_CONFIG_2569.visionMeaning?.lifestyle || '');
        setCorePurpose(cfg.corePurpose || DEFAULT_IDP_STRATEGY_CONFIG_2569.corePurpose);
        setCkpis(cfg.ckpis || DEFAULT_IDP_STRATEGY_CONFIG_2569.ckpis || []);
        setCoreCompetencies(cfg.coreCompetencies || DEFAULT_IDP_STRATEGY_CONFIG_2569.coreCompetencies || []);
        setMissions(cfg.missions || DEFAULT_IDP_STRATEGY_CONFIG_2569.missions || []);
        setSfas(cfg.sfas || DEFAULT_IDP_STRATEGY_CONFIG_2569.sfas || []);
        setSos(cfg.sos || DEFAULT_IDP_STRATEGY_CONFIG_2569.sos || []);
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [selectedYear, isOpen]);

  if (!isOpen) return null;

  // ------------------------------------
  // Handlers for CKPI
  // ------------------------------------
  const handleAddCkpi = () => {
    const nextNum = ckpis.length + 1;
    setCkpis([...ckpis, { id: `ckpi-${Date.now()}`, code: `CKPI ${nextNum}`, name: '' }]);
  };

  const handleUpdateCkpi = (index, field, value) => {
    const updated = [...ckpis];
    updated[index] = { ...updated[index], [field]: value };
    setCkpis(updated);
  };

  const handleDeleteCkpi = (index) => {
    setCkpis(ckpis.filter((_, idx) => idx !== index));
  };

  // ------------------------------------
  // Handlers for Core Competencies
  // ------------------------------------
  const handleAddCoreComp = () => {
    const nextNum = coreCompetencies.length + 1;
    setCoreCompetencies([
      ...coreCompetencies,
      { id: `cc-${Date.now()}`, code: `CC${nextNum}`, name: '' },
    ]);
  };

  const handleUpdateCoreComp = (index, field, value) => {
    const updated = [...coreCompetencies];
    updated[index] = { ...updated[index], [field]: value };
    setCoreCompetencies(updated);
  };

  const handleDeleteCoreComp = (index) => {
    setCoreCompetencies(coreCompetencies.filter((_, idx) => idx !== index));
  };

  // ------------------------------------
  // Handlers for Missions
  // ------------------------------------
  const handleAddMission = () => {
    const nextNum = String(missions.length + 1).padStart(2, '0');
    setMissions([...missions, { id: `m-${Date.now()}`, num: nextNum, title: '' }]);
  };

  const handleUpdateMission = (index, field, value) => {
    const updated = [...missions];
    updated[index] = { ...updated[index], [field]: value };
    setMissions(updated);
  };

  const handleDeleteMission = (index) => {
    setMissions(missions.filter((_, idx) => idx !== index));
  };

  // ------------------------------------
  // Handlers for SFAs (Strategic Focus Areas)
  // ------------------------------------
  const handleAddSfa = () => {
    const nextNum = sfas.length + 1;
    const colors = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626'];
    const chosenColor = colors[(nextNum - 1) % colors.length];
    setSfas([
      ...sfas,
      {
        id: `sfa-${Date.now()}`,
        code: `SFA ${nextNum}`,
        name: '',
        description: '',
        color: chosenColor,
        bg: '#F8FAFC',
        border: '#E2E8F0',
      },
    ]);
  };

  const handleUpdateSfa = (index, field, value) => {
    const updated = [...sfas];
    updated[index] = { ...updated[index], [field]: value };
    setSfas(updated);
  };

  const handleDeleteSfa = (index) => {
    setSfas(sfas.filter((_, idx) => idx !== index));
  };

  // ------------------------------------
  // Handlers for SOs (Strategic Objectives)
  // ------------------------------------
  const handleAddSo = () => {
    const nextNum = sos.length + 1;
    const defaultSfa = sfas[0] || { id: 'sfa-1', code: 'SFA 1' };
    setSos([
      ...sos,
      {
        id: `so-${Date.now()}`,
        code: `SO${nextNum}`,
        sfaId: defaultSfa.id,
        sfaCode: defaultSfa.code,
        title: '',
        alignmentCodes: [],
        responsibleRoles: [],
        skpis: [{ id: `skpi-${Date.now()}-1`, title: '', target: '' }],
      },
    ]);
  };

  const handleUpdateSo = (index, field, value) => {
    const updated = [...sos];
    updated[index] = { ...updated[index], [field]: value };
    setSos(updated);
  };

  const handleDeleteSo = (index) => {
    setSos(sos.filter((_, idx) => idx !== index));
  };

  // Handlers for SKPI inside SO
  const handleAddSkpiToSo = (soIndex) => {
    const updated = [...sos];
    const targetSo = { ...updated[soIndex] };
    const currentSkpis = targetSo.skpis || [];
    targetSo.skpis = [...currentSkpis, { id: `skpi-${Date.now()}`, title: '', target: '' }];
    updated[soIndex] = targetSo;
    setSos(updated);
  };

  const handleUpdateSkpiInSo = (soIndex, skpiIndex, field, value) => {
    const updated = [...sos];
    const targetSo = { ...updated[soIndex] };
    const currentSkpis = [...(targetSo.skpis || [])];
    currentSkpis[skpiIndex] = { ...currentSkpis[skpiIndex], [field]: value };
    targetSo.skpis = currentSkpis;
    updated[soIndex] = targetSo;
    setSos(updated);
  };

  const handleDeleteSkpiInSo = (soIndex, skpiIndex) => {
    const updated = [...sos];
    const targetSo = { ...updated[soIndex] };
    targetSo.skpis = (targetSo.skpis || []).filter((_, idx) => idx !== skpiIndex);
    updated[soIndex] = targetSo;
    setSos(updated);
  };

  // ------------------------------------
  // Save Action
  // ------------------------------------
  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSaving(true);

    try {
      const payload = {
        fiscalYear: selectedYear,
        title,
        approvalMeeting,
        vision,
        visionMeaning: {
          create: visionMeaningCreate,
          lifestyle: visionMeaningLifestyle,
        },
        corePurpose,
        ckpis,
        coreCompetencies,
        missions,
        sfas,
        sos,
      };

      const saved = await saveStrategyConfig(selectedYear, payload, currentPersonnel || currentUser);
      setSuccessMsg(`บันทึกการตั้งค่าแผนกลยุทธ์และประเด็นยุทธศาสตร์ปีงบประมาณ ${selectedYear} เรียบร้อยแล้ว`);
      if (typeof onSaved === 'function') {
        onSaved(saved);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setErrorMsg(e.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  // ------------------------------------
  // Duplicate Action
  // ------------------------------------
  const handleDuplicate = async () => {
    if (duplicateFromYear === selectedYear) {
      setErrorMsg('ปีงบประมาณต้นทางและปลายทางต้องไม่ตรงกัน');
      return;
    }

    const confirmMsg = `ยืนยันการคัดลอกการตั้งค่าประเด็นยุทธศาสตร์จากปีงบประมาณ ${duplicateFromYear} มายังปี ${selectedYear}?`;
    if (!window.confirm(confirmMsg)) return;

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const duplicated = await duplicateStrategyConfig(
        duplicateFromYear,
        selectedYear,
        currentPersonnel || currentUser
      );
      setSuccessMsg(`คัดลอกการตั้งค่าจากปีงบประมาณ ${duplicateFromYear} มายังปี ${selectedYear} สำเร็จ`);
      setShowDuplicateBox(false);
      if (typeof onSaved === 'function') {
        onSaved(duplicated);
      }
    } catch (e) {
      setErrorMsg(e.message || 'เกิดข้อผิดพลาดในการคัดลอกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  // Reusable input styling for consistent aesthetics
  const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #CBD5E1',
    fontSize: '0.875rem',
    color: '#1E293B',
    background: '#FFFFFF',
    outline: 'none',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '1.25rem',
          maxWidth: '1150px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
            color: '#FFFFFF',
            padding: '1.15rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Compass size={24} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.015em', color: '#FFFFFF' }}>
                ตั้งค่าประเด็นยุทธศาสตร์ประจำปีงบประมาณ (Strategic Framework Config)
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#C7D2FE', margin: '3px 0 0', fontWeight: 500 }}>
                เชื่อมโยงและบริหารจัดการ Vision, CKPI, Core Purpose, SFA (3 ด้าน) และ SO (7 วัตถุประสงค์เชิงกลยุทธ์)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Fiscal Year Selector in Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                padding: '5px 12px',
                borderRadius: '10px',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Calendar size={15} color="#A5B4FC" />
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#E0E7FF' }}>ปีงบประมาณ:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  background: '#FFFFFF',
                  color: '#1E1B4B',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {availableFiscalYears.map((yr) => (
                  <option key={yr.year} value={String(yr.year)}>
                    {yr.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Bar (Pill Tabs + Duplicate Action) */}
        <div
          style={{
            padding: '0.75rem 1.75rem',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* Segmented Pill Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('vision')}
              style={{
                padding: '7px 16px',
                borderRadius: '999px',
                border: activeTab === 'vision' ? '1.5px solid #4F46E5' : '1px solid #CBD5E1',
                background: activeTab === 'vision' ? 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' : '#FFFFFF',
                color: activeTab === 'vision' ? '#FFFFFF' : '#475569',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'vision' ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Target size={14} />
              <span>1. วิสัยทัศน์ & พันธกิจ (Vision & Missions)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sfa')}
              style={{
                padding: '7px 16px',
                borderRadius: '999px',
                border: activeTab === 'sfa' ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                background: activeTab === 'sfa' ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#FFFFFF',
                color: activeTab === 'sfa' ? '#FFFFFF' : '#475569',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'sfa' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Compass size={14} />
              <span>2. ประเด็นยุทธศาสตร์หลัก (SFA 1, SFA 2, SFA 3)</span>
              <span
                style={{
                  padding: '1px 7px',
                  borderRadius: '10px',
                  fontSize: '0.725rem',
                  background: activeTab === 'sfa' ? 'rgba(255, 255, 255, 0.25)' : '#EFF6FF',
                  color: activeTab === 'sfa' ? '#FFFFFF' : '#1D4ED8',
                  fontWeight: 800,
                }}
              >
                {sfas.length} ด้าน
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('so')}
              style={{
                padding: '7px 16px',
                borderRadius: '999px',
                border: activeTab === 'so' ? '1.5px solid #059669' : '1px solid #CBD5E1',
                background: activeTab === 'so' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : '#FFFFFF',
                color: activeTab === 'so' ? '#FFFFFF' : '#475569',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeTab === 'so' ? '0 2px 8px rgba(5, 150, 105, 0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <BarChart3 size={14} />
              <span>3. วัตถุประสงค์เชิงกลยุทธ์ (SO 1 - SO 7 & SKPI)</span>
              <span
                style={{
                  padding: '1px 7px',
                  borderRadius: '10px',
                  fontSize: '0.725rem',
                  background: activeTab === 'so' ? 'rgba(255, 255, 255, 0.25)' : '#ECFDF5',
                  color: activeTab === 'so' ? '#FFFFFF' : '#047857',
                  fontWeight: 800,
                }}
              >
                {sos.length} กลยุทธ์
              </span>
            </button>
          </div>

          {/* Right Action: Duplicate from previous year */}
          <button
            type="button"
            onClick={() => setShowDuplicateBox(!showDuplicateBox)}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              background: '#FFFFFF',
              borderColor: '#CBD5E1',
              color: '#334155',
              padding: '6px 14px',
              borderRadius: '8px',
            }}
          >
            <Copy size={14} color="#6366F1" />
            <span>คัดลอกจากปีก่อนหน้า</span>
          </button>
        </div>

        {/* Duplicate Box Banner (if opened) */}
        {showDuplicateBox && (
          <div
            style={{
              padding: '0.85rem 1.75rem',
              background: '#EEF2FF',
              borderBottom: '1px solid #C7D2FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info size={18} color="#4F46E5" />
              <span style={{ fontSize: '0.875rem', color: '#312E81', fontWeight: 600 }}>
                คัดลอกชุดข้อมูลยุทธศาสตร์จากปี:
              </span>
              <select
                value={duplicateFromYear}
                onChange={(e) => setDuplicateFromYear(e.target.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1.5px solid #818CF8',
                  background: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#312E81',
                }}
              >
                {availableFiscalYears
                  .filter((yr) => String(yr.year) !== String(selectedYear))
                  .map((yr) => (
                    <option key={yr.year} value={String(yr.year)}>
                      ปีงบประมาณ {yr.year}
                    </option>
                  ))}
              </select>
              <span style={{ fontSize: '0.875rem', color: '#312E81' }}>
                มายังปีงบประมาณ <strong>{selectedYear}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isSaving}
                className="btn btn-primary btn-sm"
                style={{ background: '#4F46E5', borderColor: '#4F46E5', fontWeight: 700, padding: '4px 14px' }}
              >
                ยืนยันการคัดลอก
              </button>
              <button
                type="button"
                onClick={() => setShowDuplicateBox(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 10px' }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem', background: '#FAFAFA' }}>
          {/* Alerts */}
          {errorMsg && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#047857',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: VISION, CKPI, CORE & MISSIONS */}
          {/* ======================================================== */}
          {activeTab === 'vision' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Header Info Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                  borderRadius: '14px',
                  padding: '1.25rem 1.5rem',
                  border: '1.5px solid #C7D2FE',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.05)',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.825rem', fontWeight: 800, color: '#3730A3', display: 'block', marginBottom: '6px' }}>
                      ชื่อแผนกลยุทธ์ (Strategy Plan Title):
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{ ...inputStyle, borderColor: '#A5B4FC', fontWeight: 700, color: '#1E1B4B' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.825rem', fontWeight: 800, color: '#3730A3', display: 'block', marginBottom: '6px' }}>
                      มติที่ประชุม / เอกสารอ้างอิง:
                    </label>
                    <input
                      type="text"
                      value={approvalMeeting}
                      onChange={(e) => setApprovalMeeting(e.target.value)}
                      style={{ ...inputStyle, borderColor: '#A5B4FC', fontWeight: 600, color: '#1E1B4B' }}
                    />
                  </div>
                </div>
              </div>

              {/* Vision & Meaning Card */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: '#EEF2FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={18} color="#4F46E5" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                      วิสัยทัศน์ (Vision) & คำนิยาม
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0' }}>
                      เป้าหมายและทิศทางสูงสุดในการพัฒนาเทคโนโลยีสารสนเทศขององค์กร
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    ข้อความวิสัยทัศน์ (Vision Statement):
                  </label>
                  <input
                    type="text"
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                    style={{
                      ...inputStyle,
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: '#312E81',
                      borderColor: '#818CF8',
                      background: '#F8FAFC',
                      padding: '0.75rem 1rem',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 800, color: '#4338CA', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb size={15} color="#4F46E5" />
                      <span>ความหมาย &quot;สร้างสรรค์&quot;:</span>
                    </label>
                    <textarea
                      rows={4}
                      value={visionMeaningCreate}
                      onChange={(e) => setVisionMeaningCreate(e.target.value)}
                      style={{ ...inputStyle, minHeight: '85px', fontSize: '0.85rem', lineHeight: 1.55 }}
                    />
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 800, color: '#4338CA', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb size={15} color="#4F46E5" />
                      <span>ความหมาย &quot;Digital Lifestyle ในรั้ว มจพ.&quot;:</span>
                    </label>
                    <textarea
                      rows={4}
                      value={visionMeaningLifestyle}
                      onChange={(e) => setVisionMeaningLifestyle(e.target.value)}
                      style={{ ...inputStyle, minHeight: '85px', fontSize: '0.85rem', lineHeight: 1.55 }}
                    />
                  </div>
                </div>
              </div>

              {/* CKPI & Core Competency Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* CKPI Card */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: '#FEF3C7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Award size={18} color="#D97706" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                          ตัววัดระดับวิสัยทัศน์ (CKPI)
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>เกณฑ์ประเมินความสำเร็จของวิสัยทัศน์</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCkpi}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '4px', fontSize: '0.78rem', fontWeight: 700 }}
                    >
                      <Plus size={13} /> เพิ่ม CKPI
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ckpis.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          background: '#F8FAFC',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleUpdateCkpi(idx, 'code', e.target.value)}
                          style={{
                            width: '85px',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            color: '#D97706',
                            background: '#FEF3C7',
                            border: '1px solid #FDE68A',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            textAlign: 'center',
                          }}
                        />
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateCkpi(idx, 'name', e.target.value)}
                          placeholder="ชื่อตัวชี้วัดระดับวิสัยทัศน์..."
                          style={{ ...inputStyle, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteCkpi(idx)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: '#EF4444', padding: '4px' }}
                          title="ลบตัววัดนี้"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core Purpose & Core Competency Card */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Core Purpose (วัตถุประสงค์หลักขององค์กร):
                    </label>
                    <input
                      type="text"
                      value={corePurpose}
                      onChange={(e) => setCorePurpose(e.target.value)}
                      style={{ ...inputStyle, fontWeight: 700, color: '#312E81', background: '#F8FAFC' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                        Core Competency (สมรรถนะหลักองค์กร CC)
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>ขีดความสามารถที่โดดเด่นของสำนัก</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCoreComp}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '4px', fontSize: '0.78rem', fontWeight: 700 }}
                    >
                      <Plus size={13} /> เพิ่ม CC
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {coreCompetencies.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          background: '#F8FAFC',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleUpdateCoreComp(idx, 'code', e.target.value)}
                          style={{
                            width: '70px',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            color: '#4F46E5',
                            background: '#EEF2FF',
                            border: '1px solid #C7D2FE',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            textAlign: 'center',
                          }}
                        />
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateCoreComp(idx, 'name', e.target.value)}
                          placeholder="คำอธิบายสมรรถนะหลัก..."
                          style={{ ...inputStyle, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteCoreComp(idx)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: '#EF4444', padding: '4px' }}
                          title="ลบ CC นี้"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Missions Section */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: '#EEF2FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BookOpen size={18} color="#4F46E5" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                        พันธกิจ (Missions)
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0' }}>
                        พันธกิจหลักในการดำเนินงานและสนับสนุนมหาวิทยาลัย
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMission}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px', fontWeight: 700 }}
                  >
                    <Plus size={14} /> เพิ่มพันธกิจ
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {missions.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        background: '#F8FAFC',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: '#EEF2FF',
                          color: '#4F46E5',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                        }}
                      >
                        {m.num || String(idx + 1).padStart(2, '0')}
                      </span>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => handleUpdateMission(idx, 'title', e.target.value)}
                        placeholder="รายละเอียดพันธกิจ..."
                        style={{ ...inputStyle, padding: '0.55rem 0.85rem', fontSize: '0.875rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteMission(idx)}
                        className="btn btn-ghost btn-icon"
                        style={{ color: '#EF4444', padding: '6px' }}
                        title="ลบพันธกิจนี้"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SFA (STRATEGIC FOCUS AREAS - ประเด็นยุทธศาสตร์หลัก 3 ด้าน) */}
          {/* ======================================================== */}
          {activeTab === 'sfa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    ประเด็นยุทธศาสตร์หลัก (Strategic Focus Areas: SFA)
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '3px 0 0' }}>
                    เสาหลักยุทธศาสตร์ในการขับเคลื่อนองค์กรตามแผนกลยุทธ์ พ.ศ. 2569–2572
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSfa}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    borderColor: '#2563EB',
                    gap: '6px',
                    fontWeight: 700,
                    padding: '0.5rem 1.25rem',
                  }}
                >
                  <Plus size={15} /> เพิ่มประเด็นยุทธศาสตร์ (SFA)
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {sfas.map((sfa, idx) => (
                  <div
                    key={sfa.id || idx}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '14px',
                      border: `1.5px solid ${sfa.border || '#CBD5E1'}`,
                      borderLeft: `6px solid ${sfa.color || '#2563EB'}`,
                      padding: '1.5rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
                        <input
                          type="text"
                          value={sfa.code}
                          onChange={(e) => handleUpdateSfa(idx, 'code', e.target.value)}
                          style={{
                            width: '95px',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            color: sfa.color || '#2563EB',
                            background: sfa.bg || '#EFF6FF',
                            borderColor: sfa.color || '#93C5FD',
                            borderRadius: '8px',
                            padding: '0.5rem 0.75rem',
                            textAlign: 'center',
                          }}
                        />
                        <input
                          type="text"
                          value={sfa.name}
                          onChange={(e) => handleUpdateSfa(idx, 'name', e.target.value)}
                          placeholder="ชื่อประเด็นยุทธศาสตร์ (ไทย / อังกฤษ)..."
                          style={{
                            ...inputStyle,
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: '#0F172A',
                            flex: 1,
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '4px 8px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>สีประจำ SFA:</span>
                          <input
                            type="color"
                            value={sfa.color || '#2563EB'}
                            onChange={(e) => handleUpdateSfa(idx, 'color', e.target.value)}
                            title="เปลี่ยนสีประจำ SFA"
                            style={{ width: '28px', height: '28px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSfa(idx)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: '#EF4444', padding: '6px' }}
                          title="ลบ SFA นี้"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <label style={{ fontSize: '0.825rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>
                        คำอธิบายขอบเขตและเป้าหมายของ SFA:
                      </label>
                      <textarea
                        rows={3}
                        value={sfa.description || ''}
                        onChange={(e) => handleUpdateSfa(idx, 'description', e.target.value)}
                        placeholder="ระบุคำอธิบายขอบเขตและแนวทางการดำเนินงาน..."
                        style={{ ...inputStyle, minHeight: '80px', fontSize: '0.875rem', lineHeight: 1.6 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: SO (STRATEGIC OBJECTIVES - 7 วัตถุประสงค์เชิงกลยุทธ์ & SKPI) */}
          {/* ======================================================== */}
          {activeTab === 'so' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    วัตถุประสงค์เชิงกลยุทธ์และตัวชี้วัด (Strategic Objectives: SO & SKPI)
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '3px 0 0' }}>
                    กำหนด SO ทั้ง 7 ด้าน พร้อมการเชื่อมโยง SFA, Alignment Codes (CC, SA, SC) และผู้รับผิดชอบ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSo}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    borderColor: '#059669',
                    gap: '6px',
                    fontWeight: 700,
                    padding: '0.5rem 1.25rem',
                  }}
                >
                  <Plus size={15} /> เพิ่มวัตถุประสงค์เชิงกลยุทธ์ (SO)
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {sos.map((so, soIdx) => {
                  const matchedSfa = sfas.find((s) => s.id === so.sfaId || s.code === so.sfaCode) || sfas[0];
                  return (
                    <div
                      key={so.id || soIdx}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '14px',
                        border: '1.5px solid #E2E8F0',
                        borderLeft: `6px solid ${matchedSfa?.color || '#3B82F6'}`,
                        padding: '1.5rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      }}
                    >
                      {/* Top Row: Code, SFA mapping, Title */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '90px 180px 1fr 40px',
                          gap: '12px',
                          alignItems: 'center',
                          marginBottom: '1rem',
                        }}
                      >
                        <input
                          type="text"
                          value={so.code}
                          onChange={(e) => handleUpdateSo(soIdx, 'code', e.target.value)}
                          style={{
                            ...inputStyle,
                            fontWeight: 800,
                            color: '#1E1B4B',
                            background: '#F1F5F9',
                            textAlign: 'center',
                          }}
                        />
                        <select
                          value={so.sfaId || so.sfaCode}
                          onChange={(e) => {
                            const found = sfas.find((s) => s.id === e.target.value || s.code === e.target.value);
                            handleUpdateSo(soIdx, 'sfaId', found?.id || e.target.value);
                            handleUpdateSo(soIdx, 'sfaCode', found?.code || e.target.value);
                          }}
                          style={{
                            ...inputStyle,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: matchedSfa?.color || '#2563EB',
                            borderColor: matchedSfa?.color || '#93C5FD',
                            background: matchedSfa?.bg || '#EFF6FF',
                          }}
                        >
                          {sfas.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.code}: {s.name ? s.name.substring(0, 20) + '...' : s.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={so.title}
                          onChange={(e) => handleUpdateSo(soIdx, 'title', e.target.value)}
                          placeholder="ชื่อวัตถุประสงค์เชิงกลยุทธ์..."
                          style={{ ...inputStyle, fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteSo(soIdx)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: '#EF4444', padding: '6px' }}
                          title="ลบ SO นี้"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Middle Row: Alignment & Responsible Roles */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1.5fr',
                          gap: '1.25rem',
                          marginBottom: '1.25rem',
                          background: '#F8FAFC',
                          padding: '1rem',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '5px' }}>
                            ความสอดคล้อง / Alignment Codes (เช่น CC1, CC2, SA3, SC6):
                          </label>
                          <input
                            type="text"
                            value={Array.isArray(so.alignmentCodes) ? so.alignmentCodes.join(', ') : so.alignmentCodes || ''}
                            onChange={(e) =>
                              handleUpdateSo(
                                soIdx,
                                'alignmentCodes',
                                e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                              )
                            }
                            placeholder="CC1, CC2, SA3, SC6..."
                            style={{ ...inputStyle, fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '5px' }}>
                            ผู้บริหารที่รับผิดชอบ (Responsible Roles):
                          </label>
                          <input
                            type="text"
                            value={Array.isArray(so.responsibleRoles) ? so.responsibleRoles.join(', ') : so.responsibleRoles || ''}
                            onChange={(e) =>
                              handleUpdateSo(
                                soIdx,
                                'responsibleRoles',
                                e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                              )
                            }
                            placeholder="รองผู้อำนวยการฝ่ายระบบเครือข่ายและงานบริการ, รองผู้อำนวยการฝ่ายบริหาร..."
                            style={{ ...inputStyle, fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>

                      {/* SKPI List for this SO */}
                      <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>
                            ตัวชี้วัดระดับวัตถุประสงค์เชิงกลยุทธ์ (SKPI) ของ {so.code}:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddSkpiToSo(soIdx)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.78rem', padding: '3px 10px', gap: '4px', fontWeight: 700 }}
                          >
                            <Plus size={13} /> เพิ่ม SKPI
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(so.skpis || []).map((skpi, skpiIdx) => (
                            <div key={skpi.id || skpiIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  color: '#475569',
                                  width: '24px',
                                  textAlign: 'center',
                                }}
                              >
                                {skpiIdx + 1}.
                              </span>
                              <input
                                type="text"
                                value={typeof skpi === 'string' ? skpi : skpi.title || ''}
                                onChange={(e) => handleUpdateSkpiInSo(soIdx, skpiIdx, 'title', e.target.value)}
                                placeholder="ระบุตัวชี้วัดระดับ SO (SKPI)..."
                                style={{ ...inputStyle, flex: 1, fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteSkpiInSo(soIdx, skpiIdx)}
                                className="btn btn-ghost btn-icon"
                                style={{ color: '#EF4444', padding: '4px' }}
                                title="ลบตัวชี้วัดนี้"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
            ปีงบประมาณเป้าหมาย: <strong style={{ color: '#312E81' }}>{selectedYear}</strong> | รวม{' '}
            <strong style={{ color: '#2563EB' }}>{sfas.length}</strong> ประเด็นยุทธศาสตร์ และ{' '}
            <strong style={{ color: '#059669' }}>{sos.length}</strong> วัตถุประสงค์เชิงกลยุทธ์
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSaving}
              style={{ padding: '0.6rem 1.25rem', fontWeight: 600 }}
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #4338CA 0%, #3730A3 100%)',
                borderColor: '#4338CA',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
                padding: '0.6rem 1.75rem',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(67, 56, 202, 0.35)',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : `บันทึกการตั้งค่าปี ${selectedYear}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
