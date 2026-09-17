'use client';

import React from 'react';
import {
  X,
  User,
  Building2,
  Calendar,
  Layers,
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import SkillRadarChart from '@/components/SkillRadarChart';
import { SKILL_RATING_LEVELS, calculateAssessmentSummary, ICIT_MISSIONS } from '@/lib/skillMapService';
import { formatDateDDMMYYYYBE } from '@/lib/dateUtils';

export default function SkillMapPeerDetailModal({
  isOpen,
  onClose,
  personnel,
  assessment,
  workAreas = [],
  fiscalYear,
}) {
  if (!isOpen || !personnel) return null;

  const ratings = assessment?.ratings || {};
  const summary = calculateAssessmentSummary(workAreas, ratings);

  // Radar Data Points across all competencies
  const radarData = [];
  (workAreas || []).forEach((area) => {
    (area.competencies || []).forEach((comp) => {
      const compSummary = summary.competencySummaries[comp.id];
      const shortName = comp.name.length > 28 ? `${comp.name.substring(0, 26)}...` : comp.name;
      radarData.push({
        label: comp.name,
        shortLabel: shortName,
        value: compSummary?.averageScore || 0,
        maxVal: 5,
        color: area.color,
        areaName: area.shortName || area.name,
      });
    });
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
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
          maxWidth: '1050px',
          width: '100%',
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Read-Only Badge) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {personnel.avatarUrl ? (
              <img
                src={personnel.avatarUrl}
                alt=""
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }}
              />
            ) : (
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                }}
              >
                {personnel.name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  {personnel.name}
                </h3>
                <span
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#FCD34D',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Lock size={12} />
                  <span>โหมดอ่านอย่างเดียว (Read-Only)</span>
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>
                {personnel.department} &bull; {personnel.position} &bull; ประจำปีงบประมาณ {fiscalYear}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem', backgroundColor: '#F8FAFC' }}>
          {/* Top Quick Stats Card */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>คะแนนเฉลี่ยรวมทุกด้าน</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4F46E5', marginTop: '2px' }}>
                {summary.overallAverage} <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 600 }}>/ 5.00</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>อัตราการประเมินทักษะ</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: summary.completionPercentage === 100 ? '#10B981' : '#F59E0B', marginTop: '2px' }}>
                {summary.completionPercentage}% <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>({summary.completedCount}/{summary.totalSubSkills})</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>ประเมินล่าสุดเมื่อ</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', marginTop: '6px' }}>
                {assessment?.updatedAt ? formatDateDDMMYYYYBE(assessment.updatedAt) : 'ยังไม่ประเมิน'}
              </div>
            </div>
          </div>

          {/* Spider Radar Chart Section */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              border: '1px solid #E2E8F0',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="#4F46E5" />
                <span>Spider Radar Chart: แผนที่สมรรถนะรายบุคคล</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                เปรียบเทียบคะแนนกับเกณฑ์มาตรฐานระดับ 3
              </span>
            </div>

            <SkillRadarChart data={radarData} size={460} themeColor="#4F46E5" />
          </div>

          {/* Detailed Ratings by 4 Work Areas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
              รายละเอียดคะแนนประเมินตนเองครบทั้ง 4 ด้านงาน
            </h4>

            {workAreas.map((area, aIdx) => {
              const areaSumm = summary.areaSummaries[area.id];
              return (
                <div
                  key={area.id || aIdx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: area.bgColor || '#F8FAFC',
                      borderLeft: `5px solid ${area.color || '#4F46E5'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>
                      {aIdx + 1}. {area.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: area.color }}>
                      คะแนนเฉลี่ย: {areaSumm?.averageScore || 0} / 5.00
                    </div>
                  </div>

                  <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {(area.competencies || []).map((comp) => (
                      <div key={comp.id}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem' }}>
                          {comp.name}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(comp.subSkills || []).map((sub) => {
                            const score = ratings[sub.id];
                            const lvlObj = SKILL_RATING_LEVELS.find((l) => l.score === score);
                            return (
                              <div
                                key={sub.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '6px 10px',
                                  backgroundColor: '#F8FAFC',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: 600, color: '#1E293B' }}>{sub.name}</span>
                                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>
                                    {sub.description}
                                  </span>
                                </div>
                                {lvlObj ? (
                                  <span
                                    style={{
                                      backgroundColor: lvlObj.bgColor,
                                      color: lvlObj.badgeColor,
                                      fontWeight: 800,
                                      fontSize: '0.75rem',
                                      padding: '3px 10px',
                                      borderRadius: '999px',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    ระดับ {lvlObj.score}: {lvlObj.label}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>ยังไม่ประเมิน</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
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
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              padding: '7px 20px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
