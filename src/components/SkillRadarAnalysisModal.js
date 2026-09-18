'use client';

import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Target,
  RefreshCw,
  Award,
  Building2,
  Calendar,
  Lock,
  BookOpen,
  Printer,
} from 'lucide-react';
import SkillRadarChart from '@/components/SkillRadarChart';
import {
  calculateAssessmentSummary,
  ICIT_VISION,
  ICIT_MISSIONS,
  saveSkillMapAssessment,
} from '@/lib/skillMapService';
import { formatDateDDMMYYYYBE } from '@/lib/dateUtils';

export default function SkillRadarAnalysisModal({
  isOpen,
  onClose,
  personnel,
  assessment,
  workAreas = [],
  fiscalYear,
  isSelf = false,
  onAnalysisUpdated,
}) {
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(assessment?.aiAnalysis || null);

  if (!isOpen || !personnel) return null;

  const ratings = assessment?.ratings || {};
  const summary = calculateAssessmentSummary(workAreas, ratings);

  // Radar Data Points across all competencies
  const radarPoints = [];
  (workAreas || []).forEach((area) => {
    (area.competencies || []).forEach((comp) => {
      const compSummary = summary.competencySummaries[comp.id];
      const shortName = comp.name.length > 26 ? `${comp.name.substring(0, 24)}...` : comp.name;
      radarPoints.push({
        label: comp.name,
        shortLabel: shortName,
        value: compSummary?.averageScore || 0,
        maxVal: 5,
        color: area.color,
        areaName: area.shortName || area.name,
      });
    });
  });

  const handleRunAIAnalysis = async () => {
    if (summary.completedCount === 0) {
      alert('กรุณาทำการประเมินทักษะอย่างน้อย 1 รายการก่อนขอรับบทวิเคราะห์');
      return;
    }

    setIsAnalyzingAI(true);
    try {
      const resp = await fetch('/api/skill-map/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnel,
          assessment: { ratings, fiscalYear },
          workAreas,
        }),
      });

      const data = await resp.json();
      if (data.success && data.analysis) {
        setCurrentAnalysis(data.analysis);
        // Save to storage
        const updatedRecord = {
          ...assessment,
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
          aiAnalysis: data.analysis,
          updatedAt: new Date().toISOString(),
        };

        await saveSkillMapAssessment(updatedRecord);
        if (onAnalysisUpdated) {
          onAnalysisUpdated(updatedRecord);
        }
      } else {
        alert('เกิดข้อผิดพลาดในการประมวลผลบทวิเคราะห์');
      }
    } catch (e) {
      console.error('Run AI Analysis error', e);
      alert('ไม่สามารถเชื่อมต่อระบบวิเคราะห์ได้');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const activeAnalysis = currentAnalysis || assessment?.aiAnalysis;

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
          maxWidth: '1120px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
                  Personalized Spider Radar &amp; AI Analysis
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
                {!isSelf && (
                  <span
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: 600,
                    }}
                  >
                    โหมดอ่านอย่างเดียว (Read-Only)
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#CBD5E1', marginTop: '2px' }}>
                {personnel.name} &bull; {personnel.position} &bull; {personnel.department}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              title="พิมพ์เอกสารหรือบันทึกเป็น PDF"
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

        {/* Scrollable Content (Grid) */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
            {/* Left: Spider Radar Chart */}
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
                    <span>แผนที่สมรรถนะ (Competency Radar)</span>
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                    เปรียบเทียบเกณฑ์มาตรฐานระดับ 3 (เส้นประสีม่วง)
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>คะแนนเฉลี่ยรวม</span>
                  <strong style={{ fontSize: '1.3rem', color: '#4F46E5', fontWeight: 900 }}>
                    {summary.overallAverage}{' '}
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/ 5.00</span>
                  </strong>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SkillRadarChart data={radarPoints} size={420} themeColor="#4F46E5" />
              </div>
            </div>

            {/* Right: AI Analysis & Strategic Alignment */}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={18} color="#EA580C" />
                    <span>บทวิเคราะห์ศักยภาพ & พันธกิจ ICIT</span>
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                    วิสัยทัศน์ &ldquo;{ICIT_VISION}&rdquo;
                  </p>
                </div>

                {isSelf && (
                  <button
                    type="button"
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzingAI}
                    style={{
                      background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: isAnalyzingAI ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 3px 8px rgba(234, 88, 12, 0.3)',
                    }}
                  >
                    <RefreshCw size={13} className={isAnalyzingAI ? 'spin' : ''} />
                    <span>{isAnalyzingAI ? 'กำลังวิเคราะห์...' : 'ประมวลผล AI ใหม่'}</span>
                  </button>
                )}
              </div>

              {activeAnalysis ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                  {/* 1. Strengths */}
                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#166534', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={15} color="#16A34A" />
                      <span>จุดเด่นและทักษะระดับสูง (Strengths):</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#15803D', lineHeight: 1.45 }}>
                      {(activeAnalysis.strengths || []).map((s, idx) => (
                        <li key={idx} style={{ marginBottom: '2px' }}>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 2. Development Areas */}
                  <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#92400E', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Target size={15} color="#D97706" />
                      <span>ทักษะที่ควรเสริมและพัฒนา (Development Areas):</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#B45309', lineHeight: 1.45 }}>
                      {(activeAnalysis.developmentAreas || []).map((d, idx) => (
                        <li key={idx} style={{ marginBottom: '2px' }}>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 3. 5 Missions Alignment */}
                  {activeAnalysis.missionAlignments && (
                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#1E293B', marginBottom: '6px' }}>
                        ความพร้อมสนับสนุนพันธกิจ 5 ด้านของสำนักฯ:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {activeAnalysis.missionAlignments.map((m, idx) => (
                          <div key={m.missionId || idx} style={{ fontSize: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span style={{ fontWeight: 600, color: '#334155' }}>
                                พันธกิจ {idx + 1}: {m.title}
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
                  )}

                  {/* 4. Recommended Courses */}
                  <div style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#3730A3', marginBottom: '6px' }}>
                      🎓 แนะนำหลักสูตรอบรมสำหรับจัดทำแผน IDP:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(activeAnalysis.recommendedCourses || []).map((c, idx) => (
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
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px dashed #CBD5E1',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={34} color="#EA580C" style={{ marginBottom: '10px' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B', marginBottom: '4px' }}>
                    ยังไม่ได้ประมวลผลบทวิเคราะห์
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', maxWidth: '340px', margin: '0 0 1rem' }}>
                    ระบบจะวิเคราะห์สมรรถนะเปรียบเทียบกับวิสัยทัศน์และพันธกิจ 5 ด้านของสำนักฯ พร้อมแนะนำหลักสูตร IDP
                  </p>
                  {isSelf && (
                    <button
                      type="button"
                      onClick={handleRunAIAnalysis}
                      disabled={isAnalyzingAI}
                      style={{
                        background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 20px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: isAnalyzingAI ? 'wait' : 'pointer',
                      }}
                    >
                      {isAnalyzingAI ? 'กำลังประมวลผล...' : 'กดรับบทวิเคราะห์ AI ตอนนี้'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
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
              padding: '8px 22px',
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
