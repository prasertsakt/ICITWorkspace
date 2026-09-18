'use client';

import React, { useRef, useState } from 'react';
import { X, Printer, TrendingUp, Sparkles, Building2, User, FileText, CheckCircle2 } from 'lucide-react';
import SkillRadarChart from '@/components/SkillRadarChart';
import { calculateAssessmentSummary } from '@/lib/skillMapService';
import { formatDateDDMMYYYYBE } from '@/lib/dateUtils';

export default function SkillMapPreviewModal({
  isOpen,
  onClose,
  personnel,
  assessment,
  workAreas = [],
  fiscalYear,
}) {
  const printRef = useRef(null);
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'

  if (!isOpen || !personnel) return null;

  const ratings = assessment?.ratings || {};
  const summary = calculateAssessmentSummary(workAreas, ratings);

  const handlePrint = () => {
    window.print();
  };

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

  const getScoreBadgeColor = (score) => {
    if (score >= 4) return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
    if (score >= 3) return { bg: '#E0E7FF', text: '#4338CA', border: '#A5B4FC' };
    if (score >= 2) return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
    if (score >= 1) return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
    return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
  };

  const getScoreLabel = (score) => {
    if (score === 5) return 'ระดับ 5: เชี่ยวชาญ / ให้คำปรึกษาถ่ายทอดได้';
    if (score === 4) return 'ระดับ 4: ปฏิบัติงานได้ดีเยี่ยม / แก้ไขปัญหาซับซ้อนได้';
    if (score === 3) return 'ระดับ 3: ปฏิบัติงานได้ตามมาตรฐานโดยอิสระ';
    if (score === 2) return 'ระดับ 2: ปฏิบัติงานพื้นฐานได้โดยมีผู้แนะนำ';
    if (score === 1) return 'ระดับ 1: มีความรู้ความเข้าใจเบื้องต้น';
    return 'ยังไม่ได้ประเมิน';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
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
          maxWidth: orientation === 'landscape' ? '1200px' : '960px',
          width: '100%',
          maxHeight: '94vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'max-width 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Header (Hidden on Print) */}
        <div
          className="no-print"
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                backgroundColor: 'rgba(249, 115, 22, 0.2)',
                color: '#FB923C',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
              }}
            >
              SKILL MAP PDF PREVIEW
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC' }}>
              {personnel.name} - ปีงบประมาณ {fiscalYear}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Orientation Toggle Button Group */}
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: orientation === 'portrait' ? '#EA580C' : 'transparent',
                  color: orientation === 'portrait' ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.15s ease',
                }}
                title="แนวตั้ง (เหมาะสำหรับการพิมพ์ A4 มาตรฐาน)"
              >
                <span>แนวตั้ง (Portrait)</span>
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: orientation === 'landscape' ? '#EA580C' : 'transparent',
                  color: orientation === 'landscape' ? '#FFFFFF' : '#94A3B8',
                  transition: 'all 0.15s ease',
                }}
                title="แนวนอน"
              >
                <span>แนวนอน (Landscape)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <Printer size={15} />
              <span>พิมพ์เอกสาร / บันทึก PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#E2E8F0',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div
          ref={printRef}
          className="printable-skill-map-document"
          style={{
            padding: '2.5rem 3rem',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            fontFamily: '"Sarabun", "TH Sarabun New", sans-serif',
          }}
        >
          {/* Document Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>
              แบบรายงานผลการประเมินแผนที่ความรู้และทักษะรายบุคคล
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#EA580C', marginBottom: '4px' }}>
              (Individual Knowledge &amp; Skill Map Assessment Report)
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>
              ประจำปีงบประมาณ พ.ศ. {fiscalYear}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '2px' }}>
              สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
            </div>
          </div>

          {/* Personnel Info & Summary Stats Box */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '1.25rem',
              marginBottom: '1.75rem',
            }}
          >
            {/* Personnel Info */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                ข้อมูลผู้รับการประเมิน
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ color: '#64748B', width: '90px', display: 'inline-block' }}>ชื่อ-นามสกุล:</span>
                  <strong style={{ color: '#0F172A' }}>{personnel.name}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', width: '90px', display: 'inline-block' }}>ตำแหน่ง:</span>
                  <strong style={{ color: '#334155' }}>{personnel.position || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', width: '90px', display: 'inline-block' }}>ฝ่ายงาน:</span>
                  <strong style={{ color: '#334155' }}>{personnel.department || '-'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', width: '90px', display: 'inline-block' }}>อีเมล:</span>
                  <span style={{ color: '#475569' }}>{personnel.email || '-'}</span>
                </div>
              </div>
            </div>

            {/* Assessment KPI Summary */}
            <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                สรุปผลการประเมินสมรรถนะ
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B', fontSize: '0.88rem' }}>คะแนนเฉลี่ยรวม:</span>
                  <strong style={{ fontSize: '1.2rem', color: '#EA580C', fontWeight: 900 }}>
                    {summary.overallAverage} <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>/ 5.00</span>
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B', fontSize: '0.88rem' }}>ความคืบหน้าการประเมิน:</span>
                  <strong style={{ color: '#16A34A', fontSize: '0.9rem' }}>
                    {summary.completedCount} / {summary.totalSubSkills} ทักษะ ({summary.completionPercentage}%)
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B', fontSize: '0.88rem' }}>วันที่บันทึกผลล่าสุด:</span>
                  <span style={{ color: '#334155', fontSize: '0.85rem', fontWeight: 600 }}>
                    {assessment?.updatedAt ? formatDateDDMMYYYYBE(assessment.updatedAt) : 'ยังไม่ระบุ'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart Section */}
          <div
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '1.25rem',
              marginBottom: '1.75rem',
              backgroundColor: '#FFFFFF',
              pageBreakInside: 'avoid',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
              <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                แผนภูมิใยแมงมุมแสดงสมรรถนะ (Competency Spider Radar Chart)
              </strong>
              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                เทียบระดับความสามารถที่ประเมินได้กับเกณฑ์มาตรฐานระดับ 3 (เส้นประสีม่วง)
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <SkillRadarChart data={radarPoints} size={380} themeColor="#4F46E5" />
            </div>
          </div>

          {/* Detailed Competency Tables for each Work Area */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>รายละเอียดผลการประเมินทักษะย่อยตามโครงสร้าง 5 ด้าน</span>
            </div>

            {workAreas.map((area, aIdx) => {
              const areaSummary = summary.areaSummaries[area.id] || { averageScore: '0.00', completedCount: 0, totalCount: 0 };

              return (
                <div
                  key={area.id}
                  style={{
                    marginBottom: '1.25rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    pageBreakInside: 'avoid',
                  }}
                >
                  {/* Area Header Bar */}
                  <div
                    style={{
                      backgroundColor: area.color || '#F1F5F9',
                      color: '#FFFFFF',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                    }}
                  >
                    <span>
                      ด้านที่ {aIdx + 1}: {area.name} ({area.code})
                    </span>
                    <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                      คะแนนเฉลี่ย: {areaSummary.averageScore} / 5.00
                    </span>
                  </div>

                  {/* Competencies & Subskills Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #CBD5E1', color: '#475569' }}>
                        <th style={{ padding: '8px 10px', width: '50px', textAlign: 'center' }}>ลำดับ</th>
                        <th style={{ padding: '8px 10px', width: '220px' }}>สมรรถนะ / ทักษะย่อย</th>
                        <th style={{ padding: '8px 10px' }}>คำอธิบายทักษะ</th>
                        <th style={{ padding: '8px 10px', width: '100px', textAlign: 'center' }}>คะแนน (1-5)</th>
                        <th style={{ padding: '8px 10px', width: '240px' }}>ระดับความสามารถ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(area.competencies || []).map((comp, cIdx) => (
                        <React.Fragment key={comp.id}>
                          {/* Competency Group Header */}
                          <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #E2E8F0', fontWeight: 700 }}>
                            <td colSpan={5} style={{ padding: '6px 10px', color: '#1E293B' }}>
                              {aIdx + 1}.{cIdx + 1} {comp.name}
                            </td>
                          </tr>

                          {/* Subskills */}
                          {(comp.subSkills || []).map((sub, sIdx) => {
                            const val = Number(ratings[sub.id]) || 0;
                            const badge = getScoreBadgeColor(val);

                            return (
                              <tr key={sub.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748B' }}>
                                  {aIdx + 1}.{cIdx + 1}.{sIdx + 1}
                                </td>
                                <td style={{ padding: '6px 10px', fontWeight: 600, color: '#0F172A' }}>
                                  {sub.name}
                                </td>
                                <td style={{ padding: '6px 10px', color: '#475569', fontSize: '0.8rem' }}>
                                  {sub.description || '-'}
                                </td>
                                <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      fontWeight: 800,
                                      fontSize: '0.85rem',
                                      backgroundColor: badge.bg,
                                      color: badge.text,
                                      border: `1px solid ${badge.border}`,
                                    }}
                                  >
                                    {val > 0 ? val : '-'}
                                  </span>
                                </td>
                                <td style={{ padding: '6px 10px', fontSize: '0.78rem', color: val > 0 ? '#1E293B' : '#94A3B8' }}>
                                  {getScoreLabel(val)}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* AI Analysis & Strategic Insights (if available) */}
          {assessment?.aiAnalysis && (
            <div
              style={{
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '1.25rem',
                backgroundColor: '#FFFBF7',
                marginBottom: '1.75rem',
                pageBreakInside: 'avoid',
              }}
            >
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#C2410C', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} />
                <span>บทวิเคราะห์และข้อเสนอแนะเชิงยุทธศาสตร์ (AI Strategic Insights)</span>
              </div>
              <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {assessment.aiAnalysis}
              </div>
            </div>
          )}

          {/* Signature Boxes */}
          <div
            style={{
              marginTop: '2.5rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              pageBreakInside: 'avoid',
            }}
          >
            {/* 1. ผู้รับการประเมิน */}
            <div style={{ textAlign: 'center', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '2.5rem' }}>
                ลงชื่อ ................................................................ ผู้รับการประเมิน
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                ({personnel.name})
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px' }}>
                ตำแหน่ง {personnel.position || '-'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px' }}>
                วันที่ ........ / ........ / ................
              </div>
            </div>

            {/* 2. ผู้บังคับบัญชา / หัวหน้าฝ่าย */}
            <div style={{ textAlign: 'center', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '2.5rem' }}>
                ลงชื่อ ................................................................ ผู้บังคับบัญชา / หัวหน้าฝ่าย
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                (................................................................)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px' }}>
                ตำแหน่ง ................................................................
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px' }}>
                วันที่ ........ / ........ / ................
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
            เอกสารฉบับนี้สร้างโดยระบบ ICIT Workspace &bull; สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.
          </div>
        </div>
      </div>

      {/* Global Print Style Injection */}
      <style jsx global>{`
        @media print {
          /* Hide non-printable elements */
          body * {
            visibility: hidden;
          }
          .no-print,
          .modal-overlay,
          header,
          footer,
          nav {
            display: none !important;
          }
          .printable-skill-map-document,
          .printable-skill-map-document * {
            visibility: visible;
          }
          .printable-skill-map-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 10mm 12mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: ${orientation};
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
