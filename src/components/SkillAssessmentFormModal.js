'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  CheckCircle2,
  BookOpen,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  User,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  SKILL_RATING_LEVELS,
  calculateAssessmentSummary,
  saveSkillMapAssessment,
} from '@/lib/skillMapService';
import { formatDateDDMMYYYYBE } from '@/lib/dateUtils';

export default function SkillAssessmentFormModal({
  isOpen,
  onClose,
  fiscalYear,
  personnel,
  workAreas = [],
  initialRatings = {},
  onSaveSuccess,
}) {
  const [ratings, setRatings] = useState({});
  const [activeAreaIdx, setActiveAreaIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [lastUpdatedDate, setLastUpdatedDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRatings(initialRatings || {});
      setSaveSuccessMsg(false);
    }
  }, [isOpen, initialRatings]);

  const summary = useMemo(() => {
    return calculateAssessmentSummary(workAreas, ratings);
  }, [workAreas, ratings]);

  if (!isOpen || !personnel) return null;

  const handleRatingChange = (subSkillId, score) => {
    setRatings((prev) => ({
      ...prev,
      [subSkillId]: Number(score),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        fiscalYear,
        personnelId: personnel.id,
        personnelName: personnel.name,
        department: personnel.department,
        position: personnel.position,
        ratings,
        summary: {
          totalSubSkills: summary.totalSubSkills,
          completedCount: summary.completedCount,
          averageScore: summary.overallAverage,
          competencyAverages: Object.fromEntries(
            Object.entries(summary.competencySummaries).map(([k, v]) => [k, v.averageScore])
          ),
        },
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveSkillMapAssessment(payload);
      setLastUpdatedDate(payload.updatedAt);
      setSaveSuccessMsg(true);

      if (onSaveSuccess) {
        onSaveSuccess(payload);
      }

      setTimeout(() => {
        setSaveSuccessMsg(false);
      }, 3000);
    } catch (e) {
      console.error('Error saving assessment', e);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
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
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#F8FAFC',
          borderRadius: '1.25rem',
          maxWidth: '1100px',
          width: '100%',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {personnel.avatarUrl ? (
              <img
                src={personnel.avatarUrl}
                alt=""
                style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FB923C' }}
              />
            ) : (
              <div
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                }}
              >
                {personnel.name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  แบบประเมิน Knowledge &amp; Skill Map
                </h3>
                <span
                  style={{
                    backgroundColor: 'rgba(249, 115, 22, 0.25)',
                    color: '#FED7AA',
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    border: '1px solid rgba(249, 115, 22, 0.4)',
                  }}
                >
                  ปีงบประมาณ {fiscalYear}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#CBD5E1', marginTop: '2px' }}>
                {personnel.name} &bull; {personnel.position} &bull; {personnel.department}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Top Summary Sticky Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '0.85rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>ความคืบหน้า</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 800 }}>
                  {summary.completedCount} / {summary.totalSubSkills} รายการ
                </strong>
                <span
                  style={{
                    backgroundColor: summary.completionPercentage === 100 ? '#DCFCE7' : '#FFF7ED',
                    color: summary.completionPercentage === 100 ? '#15803D' : '#EA580C',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {summary.completionPercentage}%
                </span>
              </div>
            </div>

            <div style={{ width: '1px', height: '30px', backgroundColor: '#E2E8F0' }} />

            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>คะแนนเฉลี่ยรวม</span>
              <strong style={{ fontSize: '1.2rem', color: '#EA580C', fontWeight: 900 }}>
                {summary.overallAverage}{' '}
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>/ 5.00</span>
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {saveSuccessMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontSize: '0.85rem', fontWeight: 700 }}>
                <CheckCircle2 size={18} />
                <span>บันทึกผลเรียบร้อยแล้ว</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 24px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกผลการประเมิน'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content (4 Work Areas) */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {workAreas.map((area, aIdx) => {
            const areaSumm = summary.areaSummaries[area.id];
            const isOpen = activeAreaIdx === aIdx;

            return (
              <div
                key={area.id || aIdx}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '1rem',
                  border: '1.5px solid #E2E8F0',
                  overflow: 'hidden',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.02)',
                }}
              >
                {/* Area Header Bar */}
                <div
                  onClick={() => setActiveAreaIdx(isOpen ? -1 : aIdx)}
                  style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: isOpen ? `${area.color}10` : '#FFFFFF',
                    borderBottom: isOpen ? `2px solid ${area.color}40` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: area.color,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1rem',
                        boxShadow: `0 3px 8px ${area.color}40`,
                      }}
                    >
                      {aIdx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>
                        {area.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                        {(area.competencies || []).length} สมรรถนะ &bull; {areaSumm?.totalSubSkills || 0} ทักษะย่อย
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>เฉลี่ยกลุ่มงาน</span>
                      <strong style={{ fontSize: '0.95rem', color: area.color, fontWeight: 900 }}>
                        {areaSumm?.averageScore || 0}{' '}
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>/ 5.00</span>
                      </strong>
                    </div>

                    <div
                      style={{
                        backgroundColor: areaSumm?.completedCount === areaSumm?.totalSubSkills && areaSumm?.totalSubSkills > 0 ? '#DCFCE7' : '#F1F5F9',
                        color: areaSumm?.completedCount === areaSumm?.totalSubSkills && areaSumm?.totalSubSkills > 0 ? '#15803D' : '#475569',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {areaSumm?.completedCount || 0}/{areaSumm?.totalSubSkills || 0} ข้อ
                    </div>

                    {isOpen ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
                  </div>
                </div>

                {/* Area Competencies List */}
                {isOpen && (
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#FAFAFA' }}>
                    {(area.competencies || []).map((comp, cIdx) => {
                      const compSumm = summary.competencySummaries[comp.id];

                      return (
                        <div
                          key={comp.id || cIdx}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            padding: '1rem 1.25rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderBottom: '1px solid #F1F5F9',
                              paddingBottom: '0.65rem',
                              marginBottom: '0.85rem',
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <BookOpen size={16} color={area.color} />
                              <span>{comp.name}</span>
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4F46E5' }}>
                              เฉลี่ย: {compSumm?.averageScore || 0} / 5.00
                            </span>
                          </div>

                          {/* Sub-skills Rating Rows */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {(comp.subSkills || []).map((sub, sIdx) => {
                              const currentScore = ratings[sub.id];

                              return (
                                <div
                                  key={sub.id || sIdx}
                                  style={{
                                    padding: '9px 12px',
                                    backgroundColor: currentScore !== undefined ? '#F8FAFC' : '#FFFFFF',
                                    borderRadius: '8px',
                                    border: currentScore !== undefined ? '1px solid #E2E8F0' : '1px dashed #CBD5E1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: '260px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                                      {sub.name}
                                    </div>
                                    <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '2px', lineHeight: 1.35 }}>
                                      {sub.description}
                                    </div>
                                  </div>

                                  {/* 0 - 5 Badges */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    {SKILL_RATING_LEVELS.map((lvl) => {
                                      const isSelected = currentScore === lvl.score;

                                      return (
                                        <button
                                          key={lvl.score}
                                          type="button"
                                          onClick={() => handleRatingChange(sub.id, lvl.score)}
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '40px',
                                            height: '36px',
                                            borderRadius: '8px',
                                            border: isSelected ? `2px solid ${lvl.color}` : '1px solid #CBD5E1',
                                            backgroundColor: isSelected ? lvl.color : '#FFFFFF',
                                            color: isSelected ? '#FFFFFF' : '#475569',
                                            fontWeight: 800,
                                            fontSize: '0.82rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            boxShadow: isSelected ? `0 3px 8px ${lvl.color}40` : 'none',
                                          }}
                                          title={`ระดับ ${lvl.score}: ${lvl.label} - ${lvl.description}`}
                                        >
                                          <span>{lvl.score}</span>
                                          <span style={{ fontSize: '0.52rem', fontWeight: 600, opacity: isSelected ? 0.95 : 0.7 }}>
                                            {lvl.label.substring(0, 4)}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
            {lastUpdatedDate ? `บันทึกข้อมูลล่าสุด: ${formatDateDDMMYYYYBE(lastUpdatedDate)}` : 'ยังไม่ได้บันทึกผล'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#F1F5F9',
                color: '#475569',
                border: '1px solid #CBD5E1',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
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
                padding: '8px 24px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกผลการประเมิน'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
