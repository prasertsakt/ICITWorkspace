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

  // Sync state with selected fiscal year or initialConfig
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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
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
          maxWidth: '1100px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Compass size={24} color="#A5B4FC" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                ตั้งค่าประเด็นยุทธศาสตร์ประจำปีงบประมาณ (Strategic Framework Config)
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#C7D2FE', margin: '0.2rem 0 0' }}>
                กำหนดและจัดการ Vision, CKPI, Core Purpose, SFA (3 ด้าน) และ SO (7 วัตถุประสงค์เชิงกลยุทธ์)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ color: '#FFFFFF', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Control Bar: Fiscal Year & Duplicate */}
        <div
          style={{
            padding: '1rem 1.75rem',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Year Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} color="#4F46E5" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
              ปีงบประมาณที่ต้องการตั้งค่า:
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="form-control"
              style={{
                width: 'auto',
                fontWeight: 700,
                fontSize: '0.95rem',
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                borderColor: '#818CF8',
                color: '#312E81',
                background: '#FFFFFF',
              }}
            >
              {availableFiscalYears.map((yr) => (
                <option key={yr.year} value={String(yr.year)}>
                  {yr.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action: Duplicate from previous year */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                color: '#475569',
              }}
            >
              <Copy size={14} color="#6366F1" />
              <span>คัดลอกจากปีก่อนหน้า</span>
            </button>
          </div>
        </div>

        {/* Duplicate Box dropdown */}
        {showDuplicateBox && (
          <div
            style={{
              padding: '1rem 1.75rem',
              background: '#EEF2FF',
              borderBottom: '1px solid #C7D2FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="#4F46E5" />
              <span style={{ fontSize: '0.875rem', color: '#312E81', fontWeight: 600 }}>
                คัดลอกการตั้งค่ากลยุทธ์จากปี:
              </span>
              <select
                value={duplicateFromYear}
                onChange={(e) => setDuplicateFromYear(e.target.value)}
                className="form-control"
                style={{ width: 'auto', padding: '0.3rem 0.75rem', borderRadius: '6px' }}
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
                มาแทนที่ปี <strong>{selectedYear}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isSaving}
                className="btn btn-primary btn-sm"
                style={{ background: '#4F46E5', borderColor: '#4F46E5', fontWeight: 700 }}
              >
                ยืนยันการคัดลอก
              </button>
              <button
                type="button"
                onClick={() => setShowDuplicateBox(false)}
                className="btn btn-ghost btn-sm"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* Tabs navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            background: '#FFFFFF',
            padding: '0 1.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('vision')}
            style={{
              padding: '1rem 1.25rem',
              border: 'none',
              background: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'vision' ? '#4338CA' : '#64748B',
              borderBottom: activeTab === 'vision' ? '3px solid #4338CA' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s',
            }}
          >
            <Target size={16} />
            <span>1. วิสัยทัศน์ & พันธกิจ (Vision, CKPI & Missions)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sfa')}
            style={{
              padding: '1rem 1.25rem',
              border: 'none',
              background: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'sfa' ? '#4338CA' : '#64748B',
              borderBottom: activeTab === 'sfa' ? '3px solid #4338CA' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s',
            }}
          >
            <Compass size={16} />
            <span>2. ประเด็นยุทธศาสตร์หลัก (SFA 1, SFA 2, SFA 3)</span>
            <span
              style={{
                background: '#EEF2FF',
                color: '#4338CA',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.75rem',
              }}
            >
              {sfas.length} ด้าน
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('so')}
            style={{
              padding: '1rem 1.25rem',
              border: 'none',
              background: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'so' ? '#4338CA' : '#64748B',
              borderBottom: activeTab === 'so' ? '3px solid #4338CA' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s',
            }}
          >
            <BarChart3 size={16} />
            <span>3. วัตถุประสงค์เชิงกลยุทธ์ (SO 1 - SO 7 & SKPI)</span>
            <span
              style={{
                background: '#ECFDF5',
                color: '#059669',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.75rem',
              }}
            >
              {sos.length} กลยุทธ์
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
          {errorMsg && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
              }}
            >
              <AlertCircle size={16} />
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
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: VISION, CKPI, CORE & MISSIONS */}
          {activeTab === 'vision' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Header Info Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #C7D2FE',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#3730A3', display: 'block', marginBottom: '4px' }}>
                      ชื่อแผนกลยุทธ์ (Strategy Plan Title):
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-control"
                      style={{ fontWeight: 600, borderColor: '#A5B4FC' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#3730A3', display: 'block', marginBottom: '4px' }}>
                      มติที่ประชุม / เอกสารอ้างอิง:
                    </label>
                    <input
                      type="text"
                      value={approvalMeeting}
                      onChange={(e) => setApprovalMeeting(e.target.value)}
                      className="form-control"
                      style={{ fontWeight: 600, borderColor: '#A5B4FC' }}
                    />
                  </div>
                </div>
              </div>

              {/* Vision Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <Sparkles size={20} color="#4F46E5" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#1E293B' }}>
                    วิสัยทัศน์ (Vision) & คำนิยาม
                  </h3>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    ข้อความวิสัยทัศน์:
                  </label>
                  <input
                    type="text"
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '1.05rem', fontWeight: 700, color: '#312E81', borderColor: '#818CF8' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ความหมาย &quot;สร้างสรรค์&quot;:
                    </label>
                    <textarea
                      rows={3}
                      value={visionMeaningCreate}
                      onChange={(e) => setVisionMeaningCreate(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      ความหมาย &quot;Digital Lifestyle ในรั้ว มจพ.&quot;:
                    </label>
                    <textarea
                      rows={3}
                      value={visionMeaningLifestyle}
                      onChange={(e) => setVisionMeaningLifestyle(e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* CKPI & Core Purpose & Core Competency */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* CKPIs */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={18} color="#D97706" />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#1E293B' }}>
                        ตัววัดระดับวิสัยทัศน์ (CKPI)
                      </h4>
                    </div>
                    <button type="button" onClick={handleAddCkpi} className="btn btn-secondary btn-sm" style={{ gap: '4px', fontSize: '0.75rem' }}>
                      <Plus size={13} /> เพิ่ม CKPI
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ckpis.map((item, idx) => (
                      <div key={item.id || idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleUpdateCkpi(idx, 'code', e.target.value)}
                          style={{ width: '85px', fontWeight: 700, fontSize: '0.825rem' }}
                          className="form-control"
                        />
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateCkpi(idx, 'name', e.target.value)}
                          placeholder="ชื่อตัวชี้วัดวิสัยทัศน์"
                          style={{ flex: 1, fontSize: '0.825rem' }}
                          className="form-control"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteCkpi(idx)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: '#EF4444', padding: '4px' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core Competencies & Purpose */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Core Purpose (วัตถุประสงค์หลัก):
                    </label>
                    <input
                      type="text"
                      value={corePurpose}
                      onChange={(e) => setCorePurpose(e.target.value)}
                      className="form-control"
                      style={{ fontWeight: 600, fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: '#1E293B' }}>
                      Core Competency (สมรรถนะหลักองค์กร CC)
                    </h4>
                    <button type="button" onClick={handleAddCoreComp} className="btn btn-secondary btn-sm" style={{ gap: '4px', fontSize: '0.75rem' }}>
                      <Plus size={13} /> เพิ่ม CC
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {coreCompetencies.map((item, idx) => (
                      <div key={item.id || idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleUpdateCoreComp(idx, 'code', e.target.value)}
                          style={{ width: '65px', fontWeight: 700, fontSize: '0.825rem' }}
                          className="form-control"
                        />
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateCoreComp(idx, 'name', e.target.value)}
                          placeholder="คำอธิบาย Core Competency"
                          style={{ flex: 1, fontSize: '0.825rem' }}
                          className="form-control"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteCoreComp(idx)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: '#EF4444', padding: '4px' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Missions List */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#1E293B' }}>
                      พันธกิจ (Missions)
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                      พันธกิจหลักในการดำเนินงานของสำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ
                    </p>
                  </div>
                  <button type="button" onClick={handleAddMission} className="btn btn-secondary btn-sm" style={{ gap: '4px' }}>
                    <Plus size={14} /> เพิ่มพันธกิจ
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {missions.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                        background: '#F8FAFC',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <span style={{ fontWeight: 800, color: '#4338CA', fontSize: '0.85rem' }}>
                        {m.num || String(idx + 1).padStart(2, '0')}
                      </span>
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => handleUpdateMission(idx, 'title', e.target.value)}
                        placeholder="รายละเอียดพันธกิจ..."
                        style={{ flex: 1, fontSize: '0.85rem' }}
                        className="form-control"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteMission(idx)}
                        className="btn btn-ghost btn-icon"
                        style={{ color: '#EF4444', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SFA (STRATEGIC FOCUS AREAS - ประเด็นยุทธศาสตร์หลัก 3 ด้าน) */}
          {activeTab === 'sfa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    ประเด็นยุทธศาสตร์หลัก (Strategic Focus Areas: SFA)
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '2px 0 0' }}>
                    เสาหลักยุทธศาสตร์ในการขับเคลื่อนองค์กรตามแผนกลยุทธ์
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSfa}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#4F46E5', borderColor: '#4F46E5', gap: '6px', fontWeight: 700 }}
                >
                  <Plus size={15} /> เพิ่มประเด็นยุทธศาสตร์ (SFA)
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sfas.map((sfa, idx) => (
                  <div
                    key={sfa.id || idx}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: `1px solid ${sfa.border || '#CBD5E1'}`,
                      borderLeft: `6px solid ${sfa.color || '#4F46E5'}`,
                      padding: '1.25rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="text"
                          value={sfa.code}
                          onChange={(e) => handleUpdateSfa(idx, 'code', e.target.value)}
                          style={{
                            width: '90px',
                            fontWeight: 800,
                            color: sfa.color || '#4F46E5',
                            background: sfa.bg || '#EEF2FF',
                            borderColor: sfa.color || '#A5B4FC',
                          }}
                          className="form-control"
                        />
                        <input
                          type="text"
                          value={sfa.name}
                          onChange={(e) => handleUpdateSfa(idx, 'name', e.target.value)}
                          placeholder="ชื่อประเด็นยุทธศาสตร์ (ไทย / อังกฤษ)..."
                          style={{ minWidth: '450px', fontWeight: 700, fontSize: '0.95rem' }}
                          className="form-control"
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="color"
                          value={sfa.color || '#4F46E5'}
                          onChange={(e) => handleUpdateSfa(idx, 'color', e.target.value)}
                          title="เปลี่ยนสีประจำ SFA"
                          style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteSfa(idx)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: '#EF4444' }}
                          title="ลบ SFA นี้"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                        คำอธิบายขอบเขตและเป้าหมายของ SFA:
                      </label>
                      <textarea
                        rows={3}
                        value={sfa.description || ''}
                        onChange={(e) => handleUpdateSfa(idx, 'description', e.target.value)}
                        placeholder="ระบุคำอธิบาย..."
                        className="form-control"
                        style={{ fontSize: '0.85rem', lineHeight: 1.5 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SO (STRATEGIC OBJECTIVES - 7 วัตถุประสงค์เชิงกลยุทธ์ & SKPI) */}
          {activeTab === 'so' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    วัตถุประสงค์เชิงกลยุทธ์และตัวชี้วัด (Strategic Objectives: SO & SKPI)
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: '#64748B', margin: '2px 0 0' }}>
                    กำหนด SO ทั้ง 7 ด้าน พร้อมการเชื่อมโยง SFA, Alignment Codes (CC, SA, SC) และผู้รับผิดชอบ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSo}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#059669', borderColor: '#059669', gap: '6px', fontWeight: 700 }}
                >
                  <Plus size={15} /> เพิ่มวัตถุประสงค์เชิงกลยุทธ์ (SO)
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {sos.map((so, soIdx) => {
                  const matchedSfa = sfas.find((s) => s.id === so.sfaId || s.code === so.sfaCode) || sfas[0];
                  return (
                    <div
                      key={so.id || soIdx}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        borderLeft: `5px solid ${matchedSfa?.color || '#3B82F6'}`,
                        padding: '1.25rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      }}
                    >
                      {/* Top Row: Code, SFA mapping, Title */}
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 140px 1fr 40px', gap: '10px', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <input
                          type="text"
                          value={so.code}
                          onChange={(e) => handleUpdateSo(soIdx, 'code', e.target.value)}
                          style={{ fontWeight: 800, color: '#1E1B4B', background: '#F1F5F9', textAlign: 'center' }}
                          className="form-control"
                        />
                        <select
                          value={so.sfaId || so.sfaCode}
                          onChange={(e) => {
                            const found = sfas.find((s) => s.id === e.target.value || s.code === e.target.value);
                            handleUpdateSo(soIdx, 'sfaId', found?.id || e.target.value);
                            handleUpdateSo(soIdx, 'sfaCode', found?.code || e.target.value);
                          }}
                          className="form-control"
                          style={{ fontWeight: 700, fontSize: '0.85rem' }}
                        >
                          {sfas.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={so.title}
                          onChange={(e) => handleUpdateSo(soIdx, 'title', e.target.value)}
                          placeholder="ชื่อวัตถุประสงค์เชิงกลยุทธ์..."
                          style={{ fontWeight: 700, fontSize: '0.95rem' }}
                          className="form-control"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteSo(soIdx)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: '#EF4444' }}
                          title="ลบ SO นี้"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Middle Row: Alignment & Responsible Roles */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem', marginBottom: '1rem', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '3px' }}>
                            ความสอดคล้อง / รหัสเชื่อมโยง (Alignment เช่น CC1, CC2, SA3):
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
                            className="form-control"
                            style={{ fontSize: '0.825rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '3px' }}>
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
                            className="form-control"
                            style={{ fontSize: '0.825rem' }}
                          />
                        </div>
                      </div>

                      {/* SKPI List for this SO */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#334155' }}>
                            ตัวชี้วัดระดับวัตถุประสงค์เชิงกลยุทธ์ (SKPI) ของ {so.code}:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddSkpiToSo(soIdx)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '2px 8px', gap: '3px' }}
                          >
                            <Plus size={12} /> เพิ่ม SKPI
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(so.skpis || []).map((skpi, skpiIdx) => (
                            <div key={skpi.id || skpiIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', width: '20px' }}>
                                {skpiIdx + 1}.
                              </span>
                              <input
                                type="text"
                                value={typeof skpi === 'string' ? skpi : skpi.title || ''}
                                onChange={(e) => handleUpdateSkpiInSo(soIdx, skpiIdx, 'title', e.target.value)}
                                placeholder="ระบุตัวชี้วัด SKPI..."
                                className="form-control"
                                style={{ flex: 1, fontSize: '0.825rem', padding: '0.35rem 0.65rem' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteSkpiInSo(soIdx, skpiIdx)}
                                className="btn btn-ghost btn-icon"
                                style={{ color: '#EF4444', padding: '3px' }}
                              >
                                <Trash2 size={14} />
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
          }}
        >
          <div style={{ fontSize: '0.825rem', color: '#64748B' }}>
            ปีงบประมาณเป้าหมาย: <strong style={{ color: '#312E81' }}>{selectedYear}</strong> | รวม <strong>{sfas.length}</strong> ประเด็นยุทธศาสตร์ และ <strong>{sos.length}</strong> วัตถุประสงค์เชิงกลยุทธ์
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSaving}
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
                padding: '0.5rem 1.5rem',
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
