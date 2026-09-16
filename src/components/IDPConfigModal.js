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
  Briefcase,
  Calendar,
  HelpCircle,
} from 'lucide-react';
import {
  POSITIONS,
  DEFAULT_IDP_CORE_COMPETENCIES,
  DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION,
  DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL,
} from '../lib/constants';
import { saveIdpConfig, duplicateIdpConfig } from '../lib/idpService';

export default function IDPConfigModal({
  isOpen,
  onClose,
  currentFiscalYear = '2569',
  initialConfig = null,
  currentUser,
  currentPersonnel,
  onSaved,
}) {
  const [selectedYear, setSelectedYear] = useState(currentFiscalYear);
  const [activeTab, setActiveTab] = useState('core'); // 'core' | 'functional'
  const [selectedPosition, setSelectedPosition] = useState(POSITIONS[0] || 'บุคลากร');

  // Competency states
  const [coreCompetencies, setCoreCompetencies] = useState(
    initialConfig?.coreCompetencies || DEFAULT_IDP_CORE_COMPETENCIES
  );

  const [functionalByPosition, setFunctionalByPosition] = useState(
    initialConfig?.functionalCompetenciesByPosition || DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Duplicate states
  const [showDuplicateBox, setShowDuplicateBox] = useState(false);
  const [duplicateFromYear, setDuplicateFromYear] = useState(String(Number(currentFiscalYear) - 1));

  useEffect(() => {
    if (initialConfig) {
      setSelectedYear(initialConfig.fiscalYear || currentFiscalYear);
      setCoreCompetencies(initialConfig.coreCompetencies || DEFAULT_IDP_CORE_COMPETENCIES);
      setFunctionalByPosition(
        initialConfig.functionalCompetenciesByPosition || DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION
      );
    }
  }, [initialConfig, currentFiscalYear, isOpen]);

  if (!isOpen) return null;

  // Active functional competency list for selected position
  const currentPosFuncList = useMemo(() => {
    return functionalByPosition[selectedPosition] || DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL;
  }, [functionalByPosition, selectedPosition]);

  // Total weight calculations
  const coreTotalWeight = coreCompetencies.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const funcTotalWeight = currentPosFuncList.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);

  // Core Competency row operations
  const handleAddCoreItem = () => {
    const newItem = {
      id: `core-${Date.now()}`,
      title: '',
      weight: 15,
      expectedLevel: 3,
    };
    setCoreCompetencies([...coreCompetencies, newItem]);
  };

  const handleUpdateCoreItem = (index, field, value) => {
    const updated = [...coreCompetencies];
    updated[index] = { ...updated[index], [field]: value };
    setCoreCompetencies(updated);
  };

  const handleRemoveCoreItem = (index) => {
    if (coreCompetencies.length <= 1) return;
    setCoreCompetencies(coreCompetencies.filter((_, idx) => idx !== index));
  };

  // Functional Competency row operations
  const handleAddFuncItem = () => {
    const newItem = {
      id: `func-${Date.now()}`,
      title: '',
      weight: 15,
      expectedLevel: 3,
    };
    const updatedList = [...currentPosFuncList, newItem];
    setFunctionalByPosition({
      ...functionalByPosition,
      [selectedPosition]: updatedList,
    });
  };

  const handleUpdateFuncItem = (index, field, value) => {
    const updatedList = [...currentPosFuncList];
    updatedList[index] = { ...updatedList[index], [field]: value };
    setFunctionalByPosition({
      ...functionalByPosition,
      [selectedPosition]: updatedList,
    });
  };

  const handleRemoveFuncItem = (index) => {
    if (currentPosFuncList.length <= 1) return;
    const updatedList = currentPosFuncList.filter((_, idx) => idx !== index);
    setFunctionalByPosition({
      ...functionalByPosition,
      [selectedPosition]: updatedList,
    });
  };

  // Save Config
  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    // Validation: Core total weight must be exactly 100
    if (coreTotalWeight !== 100) {
      setErrorMsg(`ผลรวมน้ำหนักของสมรรถนะหลัก (Core Competency) ต้องเท่ากับ 100 คะแนนพอดี (ปัจจุบัน: ${coreTotalWeight})`);
      setActiveTab('core');
      return;
    }

    // Validation: Current position functional weight must be 100
    if (funcTotalWeight !== 100) {
      setErrorMsg(`ผลรวมน้ำหนักสมรรถนะตามตำแหน่งงาน (${selectedPosition}) ต้องเท่ากับ 100 คะแนนพอดี (ปัจจุบัน: ${funcTotalWeight})`);
      setActiveTab('functional');
      return;
    }

    setIsSaving(true);
    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'เจ้าหน้าที่งานบุคคล',
        email: currentUser?.email || currentPersonnel?.email || '',
      };

      const payload = {
        coreCompetencies,
        functionalCompetenciesByPosition: functionalByPosition,
      };

      const saved = await saveIdpConfig(selectedYear, payload, actor);
      setSuccessMsg(`บันทึกการตั้งค่าสมรรถนะมาตรฐานปีงบประมาณ ${selectedYear} เรียบร้อยแล้ว`);
      if (onSaved) onSaved(saved);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Save IDP Config error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate Config from previous year
  const handleDuplicate = async () => {
    if (!duplicateFromYear) return;
    if (
      !window.confirm(
        `ยืนยันการคัดลอกการตั้งค่าสมรรถนะมาตรฐานจากปีงบประมาณ ${duplicateFromYear} มายังปี ${selectedYear}?`
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'เจ้าหน้าที่งานบุคคล',
        email: currentUser?.email || currentPersonnel?.email || '',
      };

      const duplicated = await duplicateIdpConfig(duplicateFromYear, selectedYear, actor);
      setCoreCompetencies(duplicated.coreCompetencies || DEFAULT_IDP_CORE_COMPETENCIES);
      setFunctionalByPosition(
        duplicated.functionalCompetenciesByPosition || DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION
      );
      setShowDuplicateBox(false);
      setSuccessMsg(`คัดลอกการตั้งค่าจากปีงบประมาณ ${duplicateFromYear} สำเร็จ`);
    } catch (err) {
      console.error('Duplicate IDP Config error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการคัดลอกข้อมูล');
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
          maxWidth: '1140px',
          width: '95vw',
          maxHeight: '94vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              <Layers size={22} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                ตั้งค่าสมรรถนะมาตรฐานประจำปีงบประมาณ (IDP Competency Config)
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                กำหนดหัวข้อสมรรถนะหลัก (Core) และสมรรถนะตามตำแหน่งงาน (Functional) พร้อมน้ำหนักคะแนนและระดับคาดหวัง
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.2)', padding: '4px 10px', borderRadius: '8px' }}>
              <Calendar size={15} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>ปีงบประมาณ:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  background: '#FFFFFF',
                  color: '#1E293B',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {['2568', '2569', '2570', '2571', '2572'].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Action Bar (Tabs & Duplicate Button) */}
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
          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('core')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: activeTab === 'core' ? '1.5px solid #4F46E5' : '1px solid #CBD5E1',
                background: activeTab === 'core' ? '#4F46E5' : '#FFFFFF',
                color: activeTab === 'core' ? '#FFFFFF' : '#475569',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Layers size={14} />
              <span>1. สมรรถนะหลัก (Core Competency)</span>
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  background: coreTotalWeight === 100 ? '#22C55E' : '#EF4444',
                  color: '#FFFFFF',
                }}
              >
                {coreTotalWeight}/100
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('functional')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: activeTab === 'functional' ? '1.5px solid #4F46E5' : '1px solid #CBD5E1',
                background: activeTab === 'functional' ? '#4F46E5' : '#FFFFFF',
                color: activeTab === 'functional' ? '#FFFFFF' : '#475569',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Briefcase size={14} />
              <span>2. สมรรถนะตามตำแหน่งงาน (Functional)</span>
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  background: funcTotalWeight === 100 ? '#22C55E' : '#EF4444',
                  color: '#FFFFFF',
                }}
              >
                {funcTotalWeight}/100
              </span>
            </button>
          </div>

          {/* Duplicate from previous year toggle */}
          <button
            type="button"
            onClick={() => setShowDuplicateBox(!showDuplicateBox)}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: '#4F46E5',
              borderColor: '#C7D2FE',
              background: '#EEF2FF',
              fontWeight: 700,
            }}
          >
            <Copy size={14} />
            <span>คัดลอกการตั้งค่าจากปีก่อนหน้า</span>
          </button>
        </div>

        {/* Duplicate Box Banner */}
        {showDuplicateBox && (
          <div
            style={{
              padding: '0.85rem 1.75rem',
              background: '#EFF6FF',
              borderBottom: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1E40AF' }}>
              <Copy size={16} />
              <span>
                เลือกปีงบประมาณต้นทางเพื่อดึงค่าสมรรถนะเริ่มต้นมายังปี <strong>{selectedYear}</strong>:
              </span>
              <select
                value={duplicateFromYear}
                onChange={(e) => setDuplicateFromYear(e.target.value)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #93C5FD',
                  background: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                }}
              >
                {['2568', '2569', '2570', '2571'].map((y) => (
                  <option key={y} value={y}>
                    ปีงบประมาณ {y}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isSaving}
                className="btn btn-primary btn-sm"
                style={{ background: '#2563EB', border: 'none', fontSize: '0.775rem' }}
              >
                ยืนยันการคัดลอก
              </button>
              <button
                type="button"
                onClick={() => setShowDuplicateBox(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.775rem' }}
              >
                ปิด
              </button>
            </div>
          </div>
        )}

        {/* Notification Alerts */}
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

        {successMsg && (
          <div
            style={{
              margin: '0.75rem 1.75rem 0',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              color: '#16A34A',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.75rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {activeTab === 'core' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1E293B' }}>
                    สมรรถนะหลัก (Core Competency) ของมหาวิทยาลัย
                  </h4>
                  <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                    กำหนดสมรรถนะร่วมสำหรับบุคลากรทุกคน โดยผลรวมน้ำหนักคะแนนต้องเท่ากับ 100 คะแนนพอดี
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCoreItem}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.775rem' }}
                >
                  <Plus size={14} />
                  <span>เพิ่มหัวข้อสมรรถนะหลัก</span>
                </button>
              </div>

              {/* Table */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                      <th style={{ padding: '8px 10px', width: '40px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>ชื่อสมรรถนะหลัก</th>
                      <th style={{ padding: '8px 10px', width: '130px', textAlign: 'center' }}>น้ำหนักคะแนน (1)</th>
                      <th style={{ padding: '8px 10px', width: '150px', textAlign: 'center' }}>ระดับคาดหวัง (2)</th>
                      <th style={{ padding: '8px 6px', width: '50px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {coreCompetencies.map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateCoreItem(idx, 'title', e.target.value)}
                            placeholder="ระบุชื่อสมรรถนะหลัก..."
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.8rem',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={item.weight}
                            onChange={(e) => handleUpdateCoreItem(idx, 'weight', Number(e.target.value))}
                            style={{
                              width: '80px',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.8rem',
                              textAlign: 'center',
                              fontWeight: 700,
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <select
                            value={item.expectedLevel}
                            onChange={(e) => handleUpdateCoreItem(idx, 'expectedLevel', Number(e.target.value))}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                            }}
                          >
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <option key={lvl} value={lvl}>
                                ระดับ {lvl}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveCoreItem(idx)}
                            disabled={coreCompetencies.length <= 1}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: coreCompetencies.length <= 1 ? '#CBD5E1' : '#EF4444',
                              cursor: coreCompetencies.length <= 1 ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#F8FAFC', fontWeight: 800 }}>
                      <td colSpan={2} style={{ padding: '10px 14px', textAlign: 'right', color: '#1E293B' }}>
                        ผลรวมน้ำหนักคะแนนสมรรถนะหลักทั้งหมด:
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          textAlign: 'center',
                          color: coreTotalWeight === 100 ? '#15803D' : '#DC2626',
                          fontSize: '0.9rem',
                        }}
                      >
                        {coreTotalWeight} / 100
                      </td>
                      <td colSpan={2} style={{ padding: '10px', fontSize: '0.75rem', color: coreTotalWeight === 100 ? '#15803D' : '#DC2626' }}>
                        {coreTotalWeight === 100 ? '✓ น้ำหนักคะแนนถูกต้อง (ครบ 100)' : '⚠️ ต้องปรับน้ำหนักให้รวมเท่ากับ 100'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'functional' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginRight: '6px' }}>
                      เลือกตำแหน่งงาน (จาก const POSITIONS):
                    </label>
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #4F46E5',
                        background: '#EEF2FF',
                        color: '#3730A3',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                      }}
                    >
                      {POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddFuncItem}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.775rem' }}
                >
                  <Plus size={14} />
                  <span>เพิ่มสมรรถนะของตำแหน่ง &ldquo;{selectedPosition}&rdquo;</span>
                </button>
              </div>

              {/* Functional Competencies Table */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                      <th style={{ padding: '8px 10px', width: '40px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>
                        ชื่อสมรรถนะตามตำแหน่งงาน ({selectedPosition})
                      </th>
                      <th style={{ padding: '8px 10px', width: '130px', textAlign: 'center' }}>น้ำหนักคะแนน (1)</th>
                      <th style={{ padding: '8px 10px', width: '150px', textAlign: 'center' }}>ระดับคาดหวัง (2)</th>
                      <th style={{ padding: '8px 6px', width: '50px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPosFuncList.map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateFuncItem(idx, 'title', e.target.value)}
                            placeholder={`ระบุสมรรถนะของตำแหน่ง ${selectedPosition}...`}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.8rem',
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={item.weight}
                            onChange={(e) => handleUpdateFuncItem(idx, 'weight', Number(e.target.value))}
                            style={{
                              width: '80px',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.8rem',
                              textAlign: 'center',
                              fontWeight: 700,
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <select
                            value={item.expectedLevel}
                            onChange={(e) => handleUpdateFuncItem(idx, 'expectedLevel', Number(e.target.value))}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                            }}
                          >
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <option key={lvl} value={lvl}>
                                ระดับ {lvl}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveFuncItem(idx)}
                            disabled={currentPosFuncList.length <= 1}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: currentPosFuncList.length <= 1 ? '#CBD5E1' : '#EF4444',
                              cursor: currentPosFuncList.length <= 1 ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#F8FAFC', fontWeight: 800 }}>
                      <td colSpan={2} style={{ padding: '10px 14px', textAlign: 'right', color: '#1E293B' }}>
                        ผลรวมน้ำหนักคะแนนสมรรถนะตำแหน่ง &ldquo;{selectedPosition}&rdquo;:
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          textAlign: 'center',
                          color: funcTotalWeight === 100 ? '#15803D' : '#DC2626',
                          fontSize: '0.9rem',
                        }}
                      >
                        {funcTotalWeight} / 100
                      </td>
                      <td colSpan={2} style={{ padding: '10px', fontSize: '0.75rem', color: funcTotalWeight === 100 ? '#15803D' : '#DC2626' }}>
                        {funcTotalWeight === 100 ? '✓ น้ำหนักคะแนนถูกต้อง (ครบ 100)' : '⚠️ ต้องปรับน้ำหนักให้รวมเท่ากับ 100'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
            ตั้งค่าสำหรับปีงบประมาณ <strong>{selectedYear}</strong> • การเปลี่ยนแปลงจะมีผลต่อแบบประเมิน IDP ใหม่ที่สร้าง
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              disabled={isSaving}
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary btn-sm"
              disabled={isSaving}
              style={{
                background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                padding: '0.5rem 1.25rem',
              }}
            >
              <Save size={15} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
