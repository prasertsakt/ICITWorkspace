'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Layers,
  Users,
  Search,
  BookOpen,
  Calendar,
  Building2,
  Mail,
  Filter,
  AlertCircle,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { MAIN_6_DEPTS } from '@/lib/constants';

// Level Color Definitions matching the system standard and enterprise design
const LEVEL_BADGE_STYLES = {
  0: {
    bgActive: '#8B0000', // Maroon / Dark Red
    textActive: '#FFFFFF',
    label: 'ระดับ 0',
    shortDesc: 'ไม่มีความรู้/ไม่จำเป็น/ยังไม่ประเมิน',
  },
  1: {
    bgActive: '#DC2626', // Red
    textActive: '#FFFFFF',
    label: 'ระดับ 1',
    shortDesc: 'น้อยมาก (ทฤษฎีพื้นฐาน)',
  },
  2: {
    bgActive: '#EA580C', // Orange
    textActive: '#FFFFFF',
    label: 'ระดับ 2',
    shortDesc: 'น้อย (ต้องการคนดูแล)',
  },
  3: {
    bgActive: '#EAB308', // Gold / Amber
    textActive: '#FFFFFF',
    label: 'ระดับ 3',
    shortDesc: 'ปานกลาง (ตามมาตรฐาน)',
  },
  4: {
    bgActive: '#16A34A', // Green
    textActive: '#FFFFFF',
    label: 'ระดับ 4',
    shortDesc: 'มาก (ทำได้ด้วยตนเอง)',
  },
  5: {
    bgActive: '#14532D', // Deep Forest Dark Green
    textActive: '#FFFFFF',
    label: 'ระดับ 5',
    shortDesc: 'มากที่สุด (เชี่ยวชาญ/Mentor)',
  },
};

export default function SkillScoreSummaryModal({
  isOpen,
  onClose,
  fiscalYear,
  workAreas = [],
  assessments = [],
  personnelList = [],
  onSelectFiscalYear,
}) {
  // Flatten all competencies across all work areas to allow easy selecting
  const allCompetencies = useMemo(() => {
    const list = [];
    (workAreas || []).forEach((area) => {
      (area.competencies || []).forEach((comp) => {
        list.push({
          ...comp,
          areaId: area.id,
          areaName: area.shortName || area.name,
          areaColor: area.color || '#4F46E5',
        });
      });
    });
    return list;
  }, [workAreas]);

  // Selected Competency ID (default to first competency if available)
  const [selectedCompId, setSelectedCompId] = useState('');
  // Department filter
  const [selectedDept, setSelectedDept] = useState('ALL');
  // Search query within skills
  const [searchQuery, setSearchQuery] = useState('');
  // Sub-modal state for viewing personnel in a specific level
  const [drilldownModal, setDrilldownModal] = useState({
    isOpen: false,
    skillName: '',
    competencyName: '',
    level: 0,
    personnel: [],
  });
  // Search query inside drilldown modal
  const [drilldownSearch, setDrilldownSearch] = useState('');

  // Auto-select first competency if none is selected
  const activeCompId = useMemo(() => {
    if (selectedCompId && allCompetencies.some((c) => c.id === selectedCompId)) {
      return selectedCompId;
    }
    return allCompetencies[0]?.id || '';
  }, [selectedCompId, allCompetencies]);

  const activeCompetency = useMemo(() => {
    return allCompetencies.find((c) => c.id === activeCompId) || null;
  }, [allCompetencies, activeCompId]);

  // Filter staff based on selected department (excluding executives/resigned)
  const activeStaffList = useMemo(() => {
    return (personnelList || []).filter((p) => {
      if (p.department === 'คณะผู้บริหาร' || p.position === 'ผู้บริหาร' || p.isExecutive || p.status === 'ลาออก') {
        return false;
      }
      if (selectedDept !== 'ALL' && p.department !== selectedDept) {
        return false;
      }
      return true;
    });
  }, [personnelList, selectedDept]);

  // Calculate scores per subSkill for the active competency
  const subSkillScoreMap = useMemo(() => {
    if (!activeCompetency) return [];

    const subSkills = activeCompetency.subSkills || [];
    return subSkills.map((sub) => {
      // Buckets for levels 0 - 5
      const levelBuckets = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };

      activeStaffList.forEach((pers) => {
        const evalRec = assessments.find((a) => a.personnelId === pers.id);
        const rawScore = evalRec?.ratings?.[sub.id];

        let score = 0;
        if (rawScore !== undefined && rawScore !== null && rawScore !== '') {
          const num = Number(rawScore);
          if (!isNaN(num) && num >= 0 && num <= 5) {
            score = Math.floor(num);
          }
        }

        levelBuckets[score].push({
          id: pers.id,
          name: pers.name,
          position: pers.position || '-',
          department: pers.department || '-',
          email: pers.email || '-',
          avatarUrl: pers.avatarUrl || null,
          score: score,
          hasEvaluated: rawScore !== undefined && rawScore !== null && rawScore !== '',
        });
      });

      return {
        ...sub,
        levelBuckets,
      };
    });
  }, [activeCompetency, activeStaffList, assessments]);

  // Filtered subskills based on search
  const filteredSubSkills = useMemo(() => {
    if (!searchQuery.trim()) return subSkillScoreMap;
    const q = searchQuery.toLowerCase();
    return subSkillScoreMap.filter((s) => {
      return (
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    });
  }, [subSkillScoreMap, searchQuery]);

  // Handle clicking a badge to inspect personnel
  const handleBadgeClick = (sub, level, personnel) => {
    setDrilldownSearch('');
    setDrilldownModal({
      isOpen: true,
      skillName: sub.name,
      competencyName: activeCompetency?.name || '',
      level: level,
      personnel: personnel || [],
    });
  };

  // Filter drilldown personnel
  const filteredDrilldownPersonnel = useMemo(() => {
    if (!drilldownSearch.trim()) return drilldownModal.personnel;
    const q = drilldownSearch.toLowerCase();
    return drilldownModal.personnel.filter((p) => {
      return (
        p.name?.toLowerCase().includes(q) ||
        p.position?.toLowerCase().includes(q) ||
        p.department?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
      );
    });
  }, [drilldownModal.personnel, drilldownSearch]);

  if (!isOpen) return null;

  const isStructureEmpty = !workAreas || workAreas.length === 0;

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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          maxWidth: '1240px',
          width: '100%',
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(16px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #F1F5F9;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94A3B8;
          }
          .skill-level-badge {
            transition: all 0.15s ease;
          }
          .skill-level-badge:hover {
            transform: translateY(-1px);
            filter: brightness(1.08);
          }
        `}</style>

        {/* 1. Modal Top Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              }}
            >
              <Layers size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                  แดชบอร์ดสรุปผลทักษะตามระดับคะแนน (0 - 5)
                </h2>
                <span
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    color: '#7DD3FC',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  ปีงบประมาณ {fiscalYear}
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                แสดงจำนวนบุคลากรจำแนกตามระดับคะแนน 0 - 5 ในแต่ละทักษะ พร้อมคลิกดูรายชื่อบุคลากร
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease',
              }}
              title="ปิดหน้าต่าง"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 2. Control Bar (Category Selector, Dept Filter, Search) */}
        {!isStructureEmpty && (
          <div
            style={{
              padding: '1rem 1.75rem',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            {/* Primary Selector: หมวดหมู่ความรู้ (Competency Selector) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
                <BookOpen size={16} color="#0284C7" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                  เลือกหมวดหมู่ความรู้:
                </span>
              </div>

              {/* Grouped Dropdown for quick access to all competencies */}
              <div style={{ flex: '2 1 340px' }}>
                <select
                  value={activeCompId}
                  onChange={(e) => setSelectedCompId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #0284C7',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    boxShadow: '0 1px 3px rgba(2, 132, 199, 0.1)',
                    cursor: 'pointer',
                  }}
                >
                  {(workAreas || []).map((area) => (
                    <optgroup key={area.id} label={`งานด้าน: ${area.name}`}>
                      {(area.competencies || []).map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name} ({(comp.subSkills || []).length} ทักษะ)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 220px' }}>
                <Building2 size={15} color="#64748B" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">-- ทุกฝ่ายงาน ({activeStaffList.length} คน) --</option>
                  {MAIN_6_DEPTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Within Competency */}
              <div style={{ position: 'relative', flex: '1 1 200px' }}>
                <Search
                  size={15}
                  color="#94A3B8"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อทักษะในหมวดนี้..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 32px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    color: '#0F172A',
                  }}
                />
              </div>
            </div>

            {/* Quick Horizontal Tabs for fast navigation between Competencies in the same Area */}
            {activeCompetency && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  overflowX: 'auto',
                  paddingTop: '2px',
                }}
              >
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  ในหมวดงานนี้:
                </span>
                {allCompetencies
                  .filter((c) => c.areaId === activeCompetency.areaId)
                  .map((comp) => {
                    const isCurrent = comp.id === activeCompId;
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => setSelectedCompId(comp.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: isCurrent ? 800 : 600,
                          backgroundColor: isCurrent ? '#0284C7' : '#FFFFFF',
                          color: isCurrent ? '#FFFFFF' : '#475569',
                          border: isCurrent ? '1px solid #0284C7' : '1px solid #E2E8F0',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {comp.name}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* 3. Modal Body */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
          {/* Case 1: Empty Structure for Year (e.g. 2570, 2571) */}
          {isStructureEmpty ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1.5rem',
                backgroundColor: '#FFFBEB',
                borderRadius: '1rem',
                border: '1px solid #FDE68A',
              }}
            >
              <AlertCircle size={48} color="#D97706" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400E', margin: '0 0 0.5rem 0' }}>
                โครงสร้างของปีงบประมาณ {fiscalYear} ยังคงว่างเปล่า
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#B45309',
                  maxWidth: '520px',
                  margin: '0 auto 1.5rem',
                  lineHeight: 1.6,
                }}
              >
                เนื่องจากยังไม่ได้เริ่มทำการดึงข้อมูลมา หรือยังไม่ได้กำหนดโครงสร้างทักษะสำหรับปีงบประมาณนี้
                คุณสามารถเลือกดูข้อมูลสรุปของปีงบประมาณก่อนหน้าที่มีข้อมูลสมบูรณ์ได้
              </p>
              {onSelectFiscalYear && (
                <button
                  type="button"
                  onClick={() => onSelectFiscalYear('2569')}
                  style={{
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)',
                  }}
                >
                  สลับไปดูปีงบประมาณ 2569
                </button>
              )}
            </div>
          ) : !activeCompetency ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              <AlertCircle size={36} color="#94A3B8" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 700 }}>ไม่พบหมวดหมู่ความรู้ในโครงสร้าง</div>
            </div>
          ) : (
            <div>
              {/* Outer Blue Header Card matching the Screenshot */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '1rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 14px -3px rgba(15, 23, 42, 0.06)',
                  overflow: 'hidden',
                  marginBottom: '1.25rem',
                }}
              >
                {/* Header Banner matching user screenshot */}
                <div
                  style={{
                    padding: '1.5rem 1.75rem',
                    borderBottom: '1px solid #E2E8F0',
                    borderLeft: '5px solid #0284C7',
                    background: 'linear-gradient(to right, #F0F9FF 0%, #FFFFFF 100%)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#0284C7',
                      margin: '0 0 0.4rem 0',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    หมวดหมู่งาน: {activeCompetency.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: '#64748B',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    ป้ายสีแสดงจำนวนบุคลากรที่ได้คะแนน 0 - 5 ในแต่ละทักษะ{' '}
                    <span style={{ color: '#0284C7', fontStyle: 'italic', fontWeight: 600 }}>
                      *(คลิกที่ป้ายสีเพื่อดูรายชื่อบุคลากร)*
                    </span>
                  </p>
                </div>

                {/* SubSkills List Rows */}
                <div style={{ padding: '0.75rem 1.25rem' }}>
                  {filteredSubSkills.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
                      ไม่พบทักษะที่ตรงกับเงื่อนไขการค้นหา
                    </div>
                  ) : (
                    filteredSubSkills.map((sub, sIdx) => {
                      return (
                        <div
                          key={sub.id || sIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem 0.75rem',
                            borderBottom: sIdx < filteredSubSkills.length - 1 ? '1px solid #F1F5F9' : 'none',
                            gap: '1.5rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* Left: Bullet & Skill Title Text */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: '1 1 340px' }}>
                            <span
                              style={{
                                color: '#0284C7',
                                fontSize: '1rem',
                                lineHeight: '1.3',
                                userSelect: 'none',
                              }}
                            >
                              &#9670;
                            </span>
                            <div>
                              <div
                                style={{
                                  fontSize: '0.9rem',
                                  fontWeight: 700,
                                  color: '#1E293B',
                                  lineHeight: 1.45,
                                }}
                              >
                                {sub.name}
                                {sub.description && !sub.name.includes(sub.description) && (
                                  <span style={{ fontWeight: 500, color: '#334155' }}>
                                    : {sub.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: 6 Level Badges (0 - 5) */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'wrap',
                              justifyContent: 'flex-end',
                            }}
                          >
                            {[0, 1, 2, 3, 4, 5].map((lvl) => {
                              const peopleInLevel = sub.levelBuckets[lvl] || [];
                              const count = peopleInLevel.length;
                              const styleCfg = LEVEL_BADGE_STYLES[lvl];
                              const hasPeople = count > 0;

                              return (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => handleBadgeClick(sub, lvl, peopleInLevel)}
                                  className="skill-level-badge"
                                  style={{
                                    backgroundColor: hasPeople ? styleCfg.bgActive : '#F1F5F9',
                                    color: hasPeople ? styleCfg.textActive : '#94A3B8',
                                    border: hasPeople ? 'none' : '1px solid #E2E8F0',
                                    borderRadius: '6px',
                                    padding: '5px 12px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    minWidth: '86px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    boxShadow: hasPeople
                                      ? '0 2px 4px rgba(0, 0, 0, 0.12)'
                                      : 'none',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={`${styleCfg.label}: ${styleCfg.shortDesc} (${count} คน) - คลิกเพื่อดูรายชื่อบุคลากร`}
                                >
                                  {styleCfg.label} ({count})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Legend Bar at Bottom */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '10px 16px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748B' }}>
                  <Users size={14} />
                  <span>
                    บุคลากรในการประมวลผล: <strong style={{ color: '#0F172A' }}>{activeStaffList.length} คน</strong>
                    {selectedDept !== 'ALL' && ` (ฝ่าย: ${selectedDept})`}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {[0, 1, 2, 3, 4, 5].map((lvl) => {
                    const cfg = LEVEL_BADGE_STYLES[lvl];
                    return (
                      <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '3px',
                            backgroundColor: cfg.bgActive,
                            display: 'inline-block',
                          }}
                        />
                        <span style={{ color: '#475569', fontWeight: 600 }}>
                          {lvl} ({cfg.label.replace('ระดับ ', '')})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Modal Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
            <span>สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT KMUTNB)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 20px',
              borderRadius: '8px',
              backgroundColor: '#334155',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* 5. Drilldown Personnel List Sub-Modal */}
      {drilldownModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setDrilldownModal({ ...drilldownModal, isOpen: false })}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'modalSlideUp 0.18s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: LEVEL_BADGE_STYLES[drilldownModal.level]?.bgActive || '#1E293B',
                color: '#FFFFFF',
                padding: '1.15rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#FFFFFF" />
                  <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                    รายชื่อบุคลากร: {LEVEL_BADGE_STYLES[drilldownModal.level]?.label}
                  </span>
                  <span
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    {drilldownModal.personnel.length} คน
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '3px' }}>
                  {LEVEL_BADGE_STYLES[drilldownModal.level]?.shortDesc}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrilldownModal({ ...drilldownModal, isOpen: false })}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Skill Target Info Banner */}
            <div
              style={{
                padding: '0.85rem 1.5rem',
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                หมวด: {drilldownModal.competencyName}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                ทักษะ: {drilldownModal.skillName}
              </div>

              {/* Search inside drilldown */}
              <div style={{ position: 'relative', marginTop: '8px' }}>
                <Search
                  size={14}
                  color="#94A3B8"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อบุคลากร, ตำแหน่ง, ฝ่ายงาน..."
                  value={drilldownSearch}
                  onChange={(e) => setDrilldownSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                  }}
                />
              </div>
            </div>

            {/* Personnel List Table / Cards */}
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
              {filteredDrilldownPersonnel.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8' }}>
                  <AlertCircle size={32} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {drilldownModal.personnel.length === 0
                      ? 'ไม่มีบุคลากรที่ได้คะแนนในระดับนี้'
                      : 'ไม่พบบุคลากรที่ตรงกับคำค้นหา'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredDrilldownPersonnel.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #F1F5F9',
                        backgroundColor: '#FFFFFF',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#94A3B8',
                            minWidth: '22px',
                          }}
                        >
                          {idx + 1}.
                        </span>

                        {p.avatarUrl ? (
                          <img
                            src={p.avatarUrl}
                            alt=""
                            style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: '#F1F5F9',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                            }}
                          >
                            {p.name?.charAt(0) || 'U'}
                          </div>
                        )}

                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                            {p.position} &bull; {p.department}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            backgroundColor: LEVEL_BADGE_STYLES[drilldownModal.level]?.bgActive,
                            color: '#FFFFFF',
                          }}
                        >
                          คะแนน {drilldownModal.level}
                        </span>
                        {!p.hasEvaluated && drilldownModal.level === 0 && (
                          <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>
                            (ยังไม่ประเมิน)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '0.85rem 1.5rem',
                backgroundColor: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setDrilldownModal({ ...drilldownModal, isOpen: false })}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#E2E8F0',
                  color: '#1E293B',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
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
