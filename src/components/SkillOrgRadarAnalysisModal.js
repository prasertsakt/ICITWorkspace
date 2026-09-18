'use client';

import React, { useMemo } from 'react';
import {
  X,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Target,
  Award,
  Building2,
  Calendar,
  Users,
  Layers,
  BookOpen,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import SkillRadarChart from '@/components/SkillRadarChart';
import {
  calculateAssessmentSummary,
  ICIT_VISION,
  ICIT_MISSIONS,
} from '@/lib/skillMapService';

export default function SkillOrgRadarAnalysisModal({
  isOpen,
  onClose,
  fiscalYear,
  workAreas = [],
  personnelList = [],
  assessments = [],
  onExportExcel,
}) {
  // Filter out Executive personnel
  const staffList = useMemo(() => {
    return (personnelList || []).filter(
      (p) => p.department !== 'คณะผู้บริหาร' && p.position !== 'ผู้บริหาร' && !p.isExecutive && p.status !== 'ลาออก'
    );
  }, [personnelList]);

  // Aggregate Organization Statistics & Competency Averages
  const orgData = useMemo(() => {
    const totalStaff = staffList.length || 1;
    const evaluatedAssessments = [];

    staffList.forEach((pers) => {
      const userEval = assessments.find((a) => a.personnelId === pers.id);
      if (userEval && userEval.ratings && Object.keys(userEval.ratings).length > 0) {
        const summ = calculateAssessmentSummary(workAreas, userEval.ratings);
        if (summ.completedCount > 0) {
          evaluatedAssessments.push({
            personnel: pers,
            ratings: userEval.ratings,
            summary: summ,
          });
        }
      }
    });

    const evaluatedCount = evaluatedAssessments.length;
    const completionRate = Math.round((evaluatedCount / totalStaff) * 100);

    // Calculate Average Score for each Competency across all evaluated staff
    const competencyAverages = {};
    const competencyStaffCount = {};

    workAreas.forEach((area) => {
      (area.competencies || []).forEach((comp) => {
        competencyAverages[comp.id] = 0;
        competencyStaffCount[comp.id] = 0;
      });
    });

    evaluatedAssessments.forEach((item) => {
      Object.entries(item.summary.competencySummaries || {}).forEach(([compId, cSumm]) => {
        if (competencyAverages[compId] !== undefined) {
          competencyAverages[compId] += cSumm.averageScore;
          competencyStaffCount[compId] += 1;
        }
      });
    });

    // Final Mean for each competency
    const finalCompAverages = {};
    Object.keys(competencyAverages).forEach((compId) => {
      const count = competencyStaffCount[compId] || 1;
      finalCompAverages[compId] = evaluatedCount > 0
        ? Number((competencyAverages[compId] / count).toFixed(2))
        : 0;
    });

    // Calculate Area Averages
    const areaAverages = {};
    workAreas.forEach((area) => {
      let areaSum = 0;
      let compCount = 0;
      (area.competencies || []).forEach((comp) => {
        areaSum += finalCompAverages[comp.id] || 0;
        compCount++;
      });
      areaAverages[area.id] = compCount > 0 ? Number((areaSum / compCount).toFixed(2)) : 0;
    });

    // Calculate Total Org Mean
    let totalScoreSum = 0;
    let allCompCount = 0;
    Object.values(finalCompAverages).forEach((avg) => {
      totalScoreSum += avg;
      allCompCount++;
    });
    const orgOverallAverage = allCompCount > 0 ? Number((totalScoreSum / allCompCount).toFixed(2)) : 0;

    // Build Radar Data Points for the entire Org
    const radarPoints = [];
    workAreas.forEach((area) => {
      (area.competencies || []).forEach((comp) => {
        const avg = finalCompAverages[comp.id] || 0;
        const shortName = comp.name.length > 26 ? `${comp.name.substring(0, 24)}...` : comp.name;
        radarPoints.push({
          label: comp.name,
          shortLabel: shortName,
          value: avg,
          maxVal: 5,
          color: area.color,
          areaName: area.shortName || area.name,
        });
      });
    });

    // Find Org Strengths (Highest scoring competencies)
    const sortedComps = [...radarPoints].sort((a, b) => b.value - a.value);
    const orgStrengths = sortedComps.slice(0, 4).filter((c) => c.value > 0);
    const orgDevelopmentNeeds = sortedComps.slice(-4).reverse();

    // Mission Alignment based on org scores
    const missionAlignments = ICIT_MISSIONS.map((m, idx) => {
      let mScore = 0;
      if (idx === 0) {
        // Mission 1: Network & Infrastructure
        mScore = (areaAverages['work-network'] || orgOverallAverage) * 1.05;
      } else if (idx === 1) {
        // Mission 2: Info Systems & Admin Management
        mScore = ((areaAverages['work-software'] || orgOverallAverage) + (areaAverages['work-admin'] || orgOverallAverage)) / 2;
      } else if (idx === 2) {
        // Mission 3: IT Services & Research Support
        mScore = (areaAverages['work-academic'] || orgOverallAverage) * 1.02;
      } else if (idx === 3) {
        // Mission 4: Digital Skills Training for Students & Staff
        mScore = ((areaAverages['work-academic'] || orgOverallAverage) + (areaAverages['work-software'] || orgOverallAverage)) / 2;
      } else {
        // Mission 5: Co-working spaces & Laboratories
        mScore = ((areaAverages['work-academic'] || orgOverallAverage) + (areaAverages['work-network'] || orgOverallAverage)) / 2;
      }

      const scoreNum = Math.min(5, Number(mScore.toFixed(2)));
      let statusText = 'พร้อมระดับสูง (High Readiness)';
      let statusColor = '#10B981';

      if (scoreNum < 2.5) {
        statusText = 'ต้องเร่งพัฒนา (High Priority)';
        statusColor = '#EF4444';
      } else if (scoreNum < 3.5) {
        statusText = 'กำลังพัฒนา (Developing)';
        statusColor = '#F59E0B';
      }

      return {
        ...m,
        score: scoreNum,
        statusText,
        statusColor,
      };
    });

    return {
      totalStaff,
      evaluatedCount,
      completionRate,
      orgOverallAverage,
      radarPoints,
      areaAverages,
      orgStrengths,
      orgDevelopmentNeeds,
      missionAlignments,
    };
  }, [staffList, assessments, workAreas]);

  if (!isOpen) return null;

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
    >
      <div
        style={{
          backgroundColor: '#F8FAFC',
          borderRadius: '1.25rem',
          maxWidth: '1150px',
          width: '100%',
          maxHeight: '92vh',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
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
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
              }}
            >
              <Award size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  Spider Radar &amp; บทวิเคราะห์ภาพรวมระดับสำนักฯ (Organization Overview)
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
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#CBD5E1' }}>
                สรุปภาพรวมสมรรถนะบุคลากรทั้งหมด {orgData.totalStaff} คน (ไม่รวมผู้บริหาร) เทียบเกณฑ์มาตรฐานและพันธกิจสำนักฯ
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                style={{
                  background: 'rgba(16, 185, 129, 0.25)',
                  color: '#A7F3D0',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FileSpreadsheet size={15} />
                <span>ส่งออก Excel</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="พิมพ์รายงานหรือบันทึกเป็น PDF"
            >
              <Printer size={15} />
              <span>พิมพ์ / PDF</span>
            </button>

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
        </div>

        {/* Top Org Metrics Banner */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '1rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>อัตราการประเมินตนเอง</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '1.05rem', color: '#0F172A', fontWeight: 800 }}>
                  {orgData.evaluatedCount} / {orgData.totalStaff} คน
                </strong>
                <span
                  style={{
                    backgroundColor: orgData.completionRate === 100 ? '#DCFCE7' : '#EEF2FF',
                    color: orgData.completionRate === 100 ? '#15803D' : '#4F46E5',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {orgData.completionRate}%
                </span>
              </div>
            </div>

            <div style={{ width: '1px', height: '32px', backgroundColor: '#E2E8F0' }} />

            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>คะแนนเฉลี่ยรวมระดับสำนักฯ</span>
              <strong style={{ fontSize: '1.3rem', color: '#4F46E5', fontWeight: 900 }}>
                {orgData.orgOverallAverage}{' '}
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>/ 5.00</span>
              </strong>
            </div>

            <div style={{ width: '1px', height: '32px', backgroundColor: '#E2E8F0' }} />

            {/* 4 Work Areas Quick Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {workAreas.map((area) => {
                const avg = orgData.areaAverages[area.id] || 0;
                return (
                  <div key={area.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: area.color }} />
                    <span style={{ color: '#475569', fontWeight: 600 }}>{area.shortName || area.name}:</span>
                    <strong style={{ color: area.color, fontWeight: 800 }}>{avg}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
            {/* Left: Org Spider Radar Chart */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={18} color="#4F46E5" />
                    <span>ผังใยแมงมุมสมรรถนะเฉลี่ยระดับสำนักฯ (Org Competency Map)</span>
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                    เส้นสีน้ำเงินคือคะแนนเฉลี่ยจริง &bull; เส้นประสีม่วงคือเกณฑ์มาตรฐานระดับ 3
                  </p>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SkillRadarChart data={orgData.radarPoints} size={420} themeColor="#4F46E5" />
              </div>
            </div>

            {/* Right: Strategic Analysis & ICIT Missions Alignment */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={18} color="#EA580C" />
                  <span>บทวิเคราะห์ศักยภาพ & ความพร้อมระดับองค์กร</span>
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                  ขับเคลื่อนตามวิสัยทัศน์ &ldquo;{ICIT_VISION}&rdquo;
                </p>
              </div>

              {/* 1. Organizational Strengths */}
              <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#166534', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} color="#16A34A" />
                  <span>จุดแข็งและสมรรถนะเด่นระดับสำนักฯ (Organizational Strengths):</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#15803D', lineHeight: 1.45 }}>
                  {orgData.orgStrengths.map((s, idx) => (
                    <li key={idx} style={{ marginBottom: '2px' }}>
                      <strong>{s.label}</strong> ({s.areaName}) &bull; คะแนนเฉลี่ย {s.value}/5.00
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2. Organizational Skill Gaps */}
              <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#92400E', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={15} color="#D97706" />
                  <span>สมรรถนะที่สำนักฯ ควรเร่งยกระดับ (Organizational Development Needs):</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#B45309', lineHeight: 1.45 }}>
                  {orgData.orgDevelopmentNeeds.map((d, idx) => (
                    <li key={idx} style={{ marginBottom: '2px' }}>
                      <strong>{d.label}</strong> ({d.areaName}) &bull; คะแนนเฉลี่ย {d.value}/5.00
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3. 5 Missions Progress */}
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#1E293B', marginBottom: '6px' }}>
                  ความพร้อมสนับสนุนพันธกิจ 5 ด้านของสำนักคอมพิวเตอร์ฯ:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {orgData.missionAlignments.map((m, idx) => (
                    <div key={m.missionId || idx} style={{ fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, color: '#334155' }}>
                          พันธกิจที่ {idx + 1}: {m.title}
                        </span>
                        <span style={{ fontWeight: 800, color: m.statusColor }}>
                          {m.score}/5 ({m.statusText})
                        </span>
                      </div>
                      <div style={{ height: '5px', width: '100%', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(m.score / 5) * 100}%`,
                            backgroundColor: m.statusColor,
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Strategic Training Recommendations */}
              <div style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#3730A3', marginBottom: '6px' }}>
                  🎓 แนะนำหลักสูตรอบรมและแผนพัฒนาบุคลากรประจำปี (Annual IDP Roadmap):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'AI & GenAI for Higher Education Workflow Automation',
                    'Enterprise Cloud Infrastructure & Zero Trust Security',
                    'DevSecOps, CI/CD Pipeline & Modern API Architecture',
                    'Digital Learning Experience & Hybrid Classroom Management',
                    'Service Design & Excellence in Digital Lifestyle KMUTNB',
                  ].map((course, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #A5B4FC',
                        color: '#4338CA',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                      }}
                    >
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            </div>
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
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 24px',
              borderRadius: '8px',
              fontSize: '0.88rem',
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
