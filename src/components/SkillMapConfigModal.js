'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Save,
  Copy,
  Layers,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
} from 'lucide-react';
import {
  getSkillMapConfig,
  saveSkillMapConfig,
  cloneSkillMapConfigFromYear,
  getAllAssessments,
} from '@/lib/skillMapService';
import { getPersonnelListSync } from '@/lib/storageService';
import { exportSkillMapToExcel } from '@/lib/skillMapExcelExport';
import { getAvailableFiscalYears } from '@/lib/dateUtils';

export default function SkillMapConfigModal({
  isOpen,
  onClose,
  currentYear,
  operatorName = 'เจ้าหน้าที่บุคลากร',
  personnelList = [],
  onConfigSaved,
}) {
  const [fiscalYear, setFiscalYear] = useState(currentYear || 2569);
  const [workAreas, setWorkAreas] = useState([]);
  const [openAreaIdx, setOpenAreaIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cloneConfirmOpen, setCloneConfirmOpen] = useState(false);
  const [sourceCloneYear, setSourceCloneYear] = useState(Number(currentYear) - 1 || 2568);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSkillMapConfig(fiscalYear);
      setWorkAreas(JSON.parse(JSON.stringify(cfg.workAreas || [])));
      setSaveSuccess(false);
    }
  }, [isOpen, fiscalYear]);

  if (!isOpen) return null;

  const handleUpdateSubSkill = (areaIdx, compIdx, subIdx, field, val) => {
    const updated = [...workAreas];
    updated[areaIdx].competencies[compIdx].subSkills[subIdx][field] = val;
    setWorkAreas(updated);
  };

  const handleAddSubSkill = (areaIdx, compIdx) => {
    const updated = [...workAreas];
    const newId = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    updated[areaIdx].competencies[compIdx].subSkills.push({
      id: newId,
      name: 'หัวข้อทักษะใหม่',
      description: 'คำอธิบายรายละเอียดความรู้และทักษะ',
    });
    setWorkAreas(updated);
  };

  const handleDeleteSubSkill = (areaIdx, compIdx, subIdx) => {
    const updated = [...workAreas];
    updated[areaIdx].competencies[compIdx].subSkills.splice(subIdx, 1);
    setWorkAreas(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSkillMapConfig({
        fiscalYear,
        workAreas,
        updatedBy: operatorName,
      });
      setSaveSuccess(true);
      if (onConfigSaved) onConfigSaved(fiscalYear);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (e) {
      console.error('Save config error', e);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteClone = async () => {
    setIsSaving(true);
    try {
      const cloned = await cloneSkillMapConfigFromYear(sourceCloneYear, fiscalYear, operatorName);
      setWorkAreas(JSON.parse(JSON.stringify(cloned.workAreas || [])));
      setCloneConfirmOpen(false);
      setSaveSuccess(true);
      if (onConfigSaved) onConfigSaved(fiscalYear);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Clone error', e);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูลจากปีก่อนหน้า');
    } finally {
      setIsSaving(false);
    }
  };

  const totalCompetencies = workAreas.reduce((acc, a) => acc + (a.competencies?.length || 0), 0);
  const totalSubSkills = workAreas.reduce(
    (acc, a) => acc + (a.competencies || []).reduce((cAcc, c) => cAcc + (c.subSkills?.length || 0), 0),
    0
  );

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
          maxWidth: '1100px',
          width: '100%',
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.25)',
                color: '#A5B4FC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                ตั้งค่าโครงสร้างความรู้และทักษะ (Knowledge & Skill Map)
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#C7D2FE' }}>
                จัดการหมวดงาน สมรรถนะหลัก และรายละเอียดทักษะย่อย ประจำปีงบประมาณ {fiscalYear}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Export to Excel Button */}
            <button
              type="button"
              onClick={() => {
                const allAssessments = getAllAssessments(fiscalYear);
                const pList = (personnelList && personnelList.length > 0) ? personnelList : getPersonnelListSync();
                exportSkillMapToExcel({
                  fiscalYear,
                  workAreas,
                  personnelList: pList,
                  assessments: allAssessments,
                });
              }}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
              }}
              title="ส่งออกโครงสร้างและผลการประเมินเป็นไฟล์ Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} />
              <span>ส่งออก Excel</span>
            </button>

            {/* Clone Button */}
            <button
              type="button"
              onClick={() => setCloneConfirmOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Copy size={14} />
              <span>ดึงข้อมูลจากปีก่อนหน้า</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Clone Confirmation Dialog Overlay */}
        {cloneConfirmOpen && (
          <div
            style={{
              padding: '1rem 1.75rem',
              backgroundColor: '#EFF6FF',
              borderBottom: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="#2563EB" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E40AF' }}>
                  คัดลอกโครงสร้างทักษะจากปีงบประมาณก่อนหน้า
                </div>
                <div style={{ fontSize: '0.78rem', color: '#3B82F6' }}>
                  ระบบจะดึงโครงสร้างความรู้และทักษะทั้งหมดจากปีงบประมาณ {sourceCloneYear} มาเป็นค่าตั้งต้นของปี {fiscalYear}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={sourceCloneYear}
                onChange={(e) => setSourceCloneYear(Number(e.target.value))}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #93C5FD',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                {getAvailableFiscalYears().map((y) => (
                  <option key={y} value={Number(y)}>
                    ปีงบประมาณ {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleExecuteClone}
                disabled={isSaving}
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ยืนยันการคัดลอก
              </button>
              <button
                type="button"
                onClick={() => setCloneConfirmOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* Modal Sub-Header Stats & Year Switcher */}
        <div
          style={{
            padding: '0.75rem 1.75rem',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ปีงบประมาณ:</span>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {getAvailableFiscalYears().map((y) => (
                  <option key={y} value={Number(y)}>
                    ปี {y}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              หมวดงาน: <strong style={{ color: '#0F172A' }}>{workAreas.length} ด้าน</strong>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              สมรรถนะหลัก: <strong style={{ color: '#0F172A' }}>{totalCompetencies} หัวข้อ</strong>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              ทักษะย่อยทั้งหมด: <strong style={{ color: '#4F46E5' }}>{totalSubSkills} รายการ</strong>
            </div>
          </div>

          {saveSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#059669',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: '#ECFDF5',
                padding: '4px 10px',
                borderRadius: '6px',
              }}
            >
              <CheckCircle size={15} />
              <span>บันทึกการตั้งค่าสำเร็จเรียบร้อย</span>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem' }}>
          {/* Work Area Tabs Accordion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {workAreas.map((area, aIdx) => {
              const isOpen = openAreaIdx === aIdx;
              return (
                <div
                  key={area.id || aIdx}
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Area Header Bar */}
                  <div
                    onClick={() => setOpenAreaIdx(isOpen ? -1 : aIdx)}
                    style={{
                      padding: '0.85rem 1.25rem',
                      background: isOpen ? area.bgColor || '#F8FAFC' : '#FFFFFF',
                      borderLeft: `5px solid ${area.color || '#4F46E5'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                        {aIdx + 1}. {area.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor: area.color,
                          color: '#FFFFFF',
                        }}
                      >
                        {area.competencies?.length || 0} ด้านสมรรถนะ
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Area Competencies List */}
                  {isOpen && (
                    <div style={{ padding: '1.25rem', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {(area.competencies || []).map((comp, cIdx) => (
                        <div
                          key={comp.id || cIdx}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '10px',
                            border: '1px solid #E2E8F0',
                            padding: '1rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <BookOpen size={16} color={area.color} />
                              <span>{comp.name}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddSubSkill(aIdx, cIdx)}
                              style={{
                                background: '#EEF2FF',
                                color: '#4F46E5',
                                border: '1px solid #C7D2FE',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Plus size={13} />
                              <span>เพิ่มทักษะย่อย</span>
                            </button>
                          </div>

                          {/* Sub-skills Table / Inputs */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {(comp.subSkills || []).map((sub, sIdx) => (
                              <div
                                key={sub.id || sIdx}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '260px 1fr 36px',
                                  gap: '8px',
                                  alignItems: 'center',
                                  backgroundColor: '#F8FAFC',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #F1F5F9',
                                }}
                              >
                                <input
                                  type="text"
                                  value={sub.name}
                                  onChange={(e) => handleUpdateSubSkill(aIdx, cIdx, sIdx, 'name', e.target.value)}
                                  placeholder="ชื่อทักษะย่อย"
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: '5px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                  }}
                                />
                                <input
                                  type="text"
                                  value={sub.description}
                                  onChange={(e) => handleUpdateSubSkill(aIdx, cIdx, sIdx, 'description', e.target.value)}
                                  placeholder="คำอธิบายรายละเอียดความรู้และทักษะ"
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: '5px',
                                    border: '1px solid #CBD5E1',
                                    fontSize: '0.8rem',
                                    color: '#475569',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubSkill(aIdx, cIdx, sIdx)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#EF4444',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title="ลบทักษะย่อยนี้"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
            * การแก้ไขจะมีผลต่อแบบประเมินของบุคลากรในปีงบประมาณ {fiscalYear}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '7px 20px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าโครงสร้าง'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
