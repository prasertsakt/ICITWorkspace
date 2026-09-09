'use client';

import React from 'react';
import { formatImageDisplayUrl } from '@/lib/driveUtils';
import {
  X,
  Printer,
  Edit2,
  CheckCircle2,
  Clock,
  Shield,
  Building2,
  FileText,
  User,
  ExternalLink,
} from 'lucide-react';

export default function JDPreviewModal({
  isOpen,
  onClose,
  jd,
  canEdit = false,
  onEdit = null,
}) {
  if (!isOpen || !jd) return null;

  const handlePrint = () => {
    window.print();
  };

  const orgChartDisplayUrl = jd.orgChartUrl ? formatImageDisplayUrl(jd.orgChartUrl) : null;

  // Calculate total responsibility weight
  const totalWeight = (jd.mainResponsibilities || []).reduce(
    (acc, curr) => acc + (Number(curr.weight) || 0),
    0
  );

  return (
    <div className="modal-overlay jd-preview-overlay" onClick={onClose}>
      <div
        className="modal-content jd-preview-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: '#FFFFFF',
          color: '#1E293B',
        }}
      >
        {/* Modal Top Bar (Screen Only) */}
        <div
          className="modal-header-screen-only"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            background: 'var(--bg-card-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--teal-50, #ECFDF5)',
                color: 'var(--teal-600, #0D9488)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                แบบบรรยายลักษณะงาน (Job Description)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {jd.personnelName} • ตำแหน่งเลขที่ {jd.positionNumber || '-'} ({jd.position || '-'})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {jd.userConfirmed ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: '#ECFDF5',
                  color: '#059669',
                  fontWeight: 700,
                  border: '1px solid #A7F3D0',
                }}
              >
                <CheckCircle2 size={12} /> ยืนยันแล้ว
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: '#FEF3C7',
                  color: '#D97706',
                  fontWeight: 700,
                  border: '1px solid #FDE68A',
                }}
              >
                <Clock size={12} /> ฉบับร่าง / รอยืนยัน
              </span>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '6px' }}
              title="พิมพ์เอกสารหรือบันทึกเป็น PDF"
            >
              <Printer size={15} />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>

            {canEdit && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(jd);
                }}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '6px' }}
              >
                <Edit2 size={14} />
                <span>แก้ไข JD</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-icon"
              style={{ width: '32px', height: '32px', padding: 0 }}
              title="ปิด"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Scroll Area */}
        <div
          className="jd-print-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2.5rem 3rem',
            background: '#FFFFFF',
            fontFamily: "'Sarabun', 'TH Sarabun New', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            lineHeight: 1.6,
            color: '#111827',
          }}
        >
          {/* Official Document Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  color: '#E05A1B',
                  letterSpacing: '0.05em',
                  fontFamily: 'sans-serif',
                }}
              >
                KMUTNB
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                INVENTION TO INNOVATION
              </span>
            </div>

            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0F172A' }}>
              แบบบรรยายลักษณะงาน (Job Description)
            </h1>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
              สังกัด สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
              มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
            </div>
          </div>

          {/* ============================================================ */}
          {/* ส่วนที่ 1 ข้อมูลเกี่ยวกับตำแหน่งงาน (Job Information) */}
          {/* ============================================================ */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '2px solid #0F172A', paddingBottom: '4px', margin: '0 0 0.85rem 0' }}>
              ส่วนที่ 1 ข้อมูลเกี่ยวกับตำแหน่งงาน (Job Information)
            </h2>

            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              1) รายละเอียดเกี่ยวกับตำแหน่งงาน
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: '6px', fontSize: '0.925rem', paddingLeft: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, color: '#475569' }}>ชื่อตำแหน่งในการบริหารงาน</div>
              <div>{jd.adminPosition || '-'}</div>

              <div style={{ fontWeight: 600, color: '#475569' }}>ชื่อตำแหน่งในสายงาน</div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{jd.position || '-'}</div>

              <div style={{ fontWeight: 600, color: '#475569' }}>ตำแหน่งเลขที่</div>
              <div>{jd.positionNumber || '-'}</div>

              <div style={{ fontWeight: 600, color: '#475569' }}>ชื่อ-นามสกุล</div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{jd.personnelName || '-'}</div>

              <div style={{ fontWeight: 600, color: '#475569' }}>ระดับตำแหน่ง</div>
              <div>{jd.positionLevel || '-'}</div>

              <div style={{ fontWeight: 600, color: '#475569' }}>ตำแหน่งประเภท</div>
              <div>{jd.positionType || 'พนักงานมหาวิทยาลัย สายสนับสนุนวิชาการ'}</div>

              <div style={{ fontWeight: 600, color: '#475569' }}>ชื่อส่วนงาน (สำนัก/กอง)</div>
              <div>{jd.division || 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ'}</div>

              <div style={{ fontWeight: 600, color: '#475569' }}>ชื่อหน่วยงาน/กลุ่มงาน/ฝ่าย/งาน</div>
              <div>{jd.department || '-'}</div>
            </div>

            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              2) สายการบังคับบัญชา
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', rowGap: '6px', fontSize: '0.925rem', paddingLeft: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, color: '#475569' }}>ชื่อผู้บังคับบัญชา</div>
              <div>{jd.supervisorName || '-'}</div>

              <div style={{ fontWeight: 600, color: '#475569' }}>ตำแหน่งผู้บังคับบัญชาโดยตรง</div>
              <div>{jd.supervisorPosition || '-'}</div>

              <div style={{ fontWeight: 600, color: '#475569' }}>ผู้ใต้บังคับบัญชา (ถ้ามี)</div>
              <div>จำนวน {jd.subordinatesCount || '-'} คน</div>
            </div>

            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              3) ผังโครงสร้างสายการบังคับบัญชา (Organization Chart)
            </div>

            <div style={{ paddingLeft: '1rem', textAlign: 'center', margin: '1rem 0' }}>
              {orgChartDisplayUrl ? (
                <div style={{ display: 'inline-block', maxWidth: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px', background: '#F8FAFC' }}>
                  <img
                    src={orgChartDisplayUrl}
                    alt="Organization Chart"
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '340px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div style={{ padding: '2rem', border: '1.5px dashed #CBD5E1', borderRadius: '8px', color: '#94A3B8', fontSize: '0.875rem' }}>
                  ไม่ได้ระบุลิงก์รูปภาพผังโครงสร้างสายการบังคับบัญชา (Organization Chart)
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* ส่วนที่ 2 หน้าที่และความรับผิดชอบ (Job Summary) */}
          {/* ============================================================ */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '2px solid #0F172A', paddingBottom: '4px', margin: '0 0 0.85rem 0' }}>
              ส่วนที่ 2 หน้าที่และความรับผิดชอบ (Job Summary)
            </h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  <th style={{ border: '1px solid #94A3B8', padding: '8px 12px', width: '50%', textAlign: 'center', fontWeight: 700 }}>
                    ตามมาตรฐานกำหนดตำแหน่ง
                  </th>
                  <th style={{ border: '1px solid #94A3B8', padding: '8px 12px', width: '50%', textAlign: 'center', fontWeight: 700 }}>
                    ปฏิบัติจริงในปัจจุบัน
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #94A3B8', padding: '10px 12px', verticalAlign: 'top', textAlign: 'justify', whiteSpace: 'pre-line' }}>
                    {jd.jobSummaryStandard || '-'}
                  </td>
                  <td style={{ border: '1px solid #94A3B8', padding: '10px 12px', verticalAlign: 'top', textAlign: 'justify', whiteSpace: 'pre-line' }}>
                    {jd.jobSummaryActual || '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ============================================================ */}
          {/* ส่วนที่ 3 หน้าที่ความรับผิดชอบหลัก (Main Job Responsibilities) */}
          {/* ============================================================ */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '2px solid #0F172A', paddingBottom: '4px', margin: '0 0 0.85rem 0' }}>
              ส่วนที่ 3 หน้าที่ความรับผิดชอบหลัก (Main Job Responsibilities)
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic', marginBottom: '0.5rem' }}>
              (คำชี้แจง บางตำแหน่งซึ่งเป็นระดับปฏิบัติการถ้าไม่ได้ดำเนินการในด้านใดด้านหนึ่งก็สามารถเว้นได้ เช่น ด้านการวางแผน)
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  <th style={{ border: '1px solid #94A3B8', padding: '8px', width: '18%', textAlign: 'center', fontWeight: 700 }}>
                    ความรับผิดชอบหลัก<br />(Key Responsibility)
                  </th>
                  <th style={{ border: '1px solid #94A3B8', padding: '8px', width: '48%', textAlign: 'center', fontWeight: 700 }}>
                    ขอบเขตหน้าที่ความรับผิดชอบ<br />ที่ปฏิบัติจริงในปัจจุบัน (Key Activities)
                  </th>
                  <th style={{ border: '1px solid #94A3B8', padding: '8px', width: '24%', textAlign: 'center', fontWeight: 700 }}>
                    ดัชนีชี้วัดผลงาน<br />(Key Expected Results)
                  </th>
                  <th style={{ border: '1px solid #94A3B8', padding: '8px', width: '10%', textAlign: 'center', fontWeight: 700 }}>
                    น้ำหนัก<br />(ร้อยละ)
                  </th>
                </tr>
              </thead>
              <tbody>
                {(jd.mainResponsibilities || []).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #94A3B8', padding: '8px', verticalAlign: 'top', fontWeight: 700, color: '#0F172A' }}>
                      {item.category}
                    </td>
                    <td style={{ border: '1px solid #94A3B8', padding: '8px', verticalAlign: 'top', whiteSpace: 'pre-line', textAlign: 'justify' }}>
                      {item.activities}
                    </td>
                    <td style={{ border: '1px solid #94A3B8', padding: '8px', verticalAlign: 'top', whiteSpace: 'pre-line' }}>
                      {item.expectedResults}
                    </td>
                    <td style={{ border: '1px solid #94A3B8', padding: '8px', verticalAlign: 'top', textAlign: 'center', fontWeight: 700 }}>
                      {item.weight}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F8FAFC', fontWeight: 700 }}>
                  <td colSpan={3} style={{ border: '1px solid #94A3B8', padding: '8px', textAlign: 'right' }}>
                    รวมน้ำหนักทั้งหมด:
                  </td>
                  <td style={{ border: '1px solid #94A3B8', padding: '8px', textAlign: 'center', color: totalWeight === 100 ? '#059669' : '#DC2626' }}>
                    {totalWeight}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ============================================================ */}
          {/* ส่วนที่ 4 การทำงานร่วมกับหน่วยงานอื่น (Working Relationship) */}
          {/* ============================================================ */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '2px solid #0F172A', paddingBottom: '4px', margin: '0 0 0.85rem 0' }}>
              ส่วนที่ 4 การทำงานร่วมกับหน่วยงานอื่น (Working Relationship)
            </h2>

            <div style={{ fontWeight: 700, fontSize: '0.925rem', marginBottom: '0.4rem' }}>
              หน่วยงานภายใน
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  <th style={{ border: '1px solid #94A3B8', padding: '6px 8px', width: '25%', textAlign: 'center', fontWeight: 700 }}>ชื่อของหน่วยงาน</th>
                  <th style={{ border: '1px solid #94A3B8', padding: '6px 8px', width: '35%', textAlign: 'center', fontWeight: 700 }}>เรื่องที่ประสาน</th>
                  <th style={{ border: '1px solid #94A3B8', padding: '6px 8px', width: '22%', textAlign: 'center', fontWeight: 700 }}>วิธีการติดต่อ</th>
                  <th style={{ border: '1px solid #94A3B8', padding: '6px 8px', width: '18%', textAlign: 'center', fontWeight: 700 }}>ความถี่ในการติดต่อ</th>
                </tr>
              </thead>
              <tbody>
                {(jd.internalRelationships || []).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #94A3B8', padding: '6px 8px', verticalAlign: 'top', fontWeight: 600 }}>{item.unitName}</td>
                    <td style={{ border: '1px solid #94A3B8', padding: '6px 8px', verticalAlign: 'top', whiteSpace: 'pre-line' }}>{item.topics}</td>
                    <td style={{ border: '1px solid #94A3B8', padding: '6px 8px', verticalAlign: 'top' }}>{item.contactMethod}</td>
                    <td style={{ border: '1px solid #94A3B8', padding: '6px 8px', verticalAlign: 'top', textAlign: 'center' }}>{item.frequency}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontWeight: 700, fontSize: '0.925rem', marginBottom: '0.4rem' }}>
              หน่วยงานภายนอก
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  <th style={{ border: '1px solid #94A3B8', padding: '6px 8px', width: '25%', textAlign: 'center', fontWeight: 700 }}>ชื่อของหน่วยงาน</th>
                  <th style={{ border: '1px solid #94A3B8', padding: '6px 8px', width: '35%', textAlign: 'center', fontWeight: 700 }}>เรื่องที่ประสาน</th>
                  <th style={{ border: '1px solid #94A3B8', padding: '6px 8px', width: '22%', textAlign: 'center', fontWeight: 700 }}>วิธีการติดต่อ</th>
                  <th style={{ border: '1px solid #94A3B8', padding: '6px 8px', width: '18%', textAlign: 'center', fontWeight: 700 }}>ความถี่ในการติดต่อ</th>
                </tr>
              </thead>
              <tbody>
                {(jd.externalRelationships || []).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #94A3B8', padding: '6px 8px', verticalAlign: 'top', fontWeight: 600 }}>{item.unitName}</td>
                    <td style={{ border: '1px solid #94A3B8', padding: '6px 8px', verticalAlign: 'top', whiteSpace: 'pre-line' }}>{item.topics}</td>
                    <td style={{ border: '1px solid #94A3B8', padding: '6px 8px', verticalAlign: 'top' }}>{item.contactMethod}</td>
                    <td style={{ border: '1px solid #94A3B8', padding: '6px 8px', verticalAlign: 'top', textAlign: 'center' }}>{item.frequency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================================ */}
          {/* ส่วนที่ 5 คุณสมบัติมาตรฐานของตำแหน่ง (Job Specification) */}
          {/* ============================================================ */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '2px solid #0F172A', paddingBottom: '4px', margin: '0 0 0.85rem 0' }}>
              ส่วนที่ 5 คุณสมบัติมาตรฐานของตำแหน่ง (Job Specification)
            </h2>

            <div style={{ marginBottom: '0.65rem' }}>
              <strong style={{ fontSize: '0.925rem' }}>5.1 การศึกษา (ระดับการศึกษา และสาขาวิชา) (Education and Major)</strong>
              <div style={{ paddingLeft: '1rem', fontSize: '0.9rem', color: '#1E293B', marginTop: '2px' }}>
                {jd.educationAndMajor || '-'}
              </div>
            </div>

            <div style={{ marginBottom: '0.65rem' }}>
              <strong style={{ fontSize: '0.925rem' }}>5.2 ประสบการณ์ที่จำเป็นในการทำงาน (Experience)</strong>
              <div style={{ paddingLeft: '1rem', fontSize: '0.9rem', color: '#1E293B', marginTop: '2px' }}>
                {jd.experience || '-'}
              </div>
            </div>

            <div style={{ marginBottom: '0.65rem' }}>
              <strong style={{ fontSize: '0.925rem' }}>5.3 คุณสมบัติพิเศษที่เกี่ยวกับงาน (Special Qualifications)</strong>
              <div style={{ paddingLeft: '1rem', fontSize: '0.9rem', color: '#1E293B', marginTop: '2px' }}>
                {jd.specialQualifications || '-'}
              </div>
            </div>

            <div style={{ marginBottom: '0.65rem' }}>
              <strong style={{ fontSize: '0.925rem' }}>5.4 ทักษะที่จำเป็นสำหรับงาน (Skill)</strong>
              <div style={{ paddingLeft: '1rem', fontSize: '0.875rem', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>• <strong>ภาษาอังกฤษ (English):</strong> {jd.skills?.english || '-'}</div>
                <div>• <strong>ภาษาอื่น (Other):</strong> {jd.skills?.otherLanguage || '-'}</div>
                <div>• <strong>คอมพิวเตอร์ (Computer):</strong> {jd.skills?.computer || '-'}</div>
                <div>• <strong>อื่น ๆ โปรดระบุ:</strong> {jd.skills?.otherSkills || '-'}</div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* ส่วนที่ 6 ความสามารถหรือสมรรถนะในงาน (Core Competencies) */}
          {/* ============================================================ */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '2px solid #0F172A', paddingBottom: '4px', margin: '0 0 0.85rem 0' }}>
              ส่วนที่ 6 ความสามารถหรือสมรรถนะในงาน (Core Competencies)
            </h2>
            <div style={{ fontSize: '0.825rem', color: '#64748B', marginBottom: '0.4rem' }}>
              (ตามประกาศสมรรถนะหลัก KMUTNB ของ มจพ. ประกาศมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ - เรื่องการกำหนดสมรรถนะหลัก)
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  <th style={{ border: '1px solid #94A3B8', padding: '8px 12px', width: '75%', textAlign: 'left', fontWeight: 700 }}>
                    คุณลักษณะที่ทุกคนในองค์กรพึงมี (Core Competencies)
                  </th>
                  <th style={{ border: '1px solid #94A3B8', padding: '8px 12px', width: '25%', textAlign: 'center', fontWeight: 700 }}>
                    ระดับความสามารถที่ต้องการ (1-5)
                  </th>
                </tr>
              </thead>
              <tbody>
                {(jd.coreCompetencies || []).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #94A3B8', padding: '6px 12px' }}>{item.name}</td>
                    <td style={{ border: '1px solid #94A3B8', padding: '6px 12px', textAlign: 'center', fontWeight: 800, color: '#4338CA' }}>
                      {item.targetLevel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================================ */}
          {/* ส่วนที่ 7 คุณสมบัติประจำตำแหน่ง (Functional Competencies) */}
          {/* ============================================================ */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '2px solid #0F172A', paddingBottom: '4px', margin: '0 0 0.85rem 0' }}>
              ส่วนที่ 7 คุณสมบัติประจำตำแหน่ง (Functional Competencies)
            </h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  <th style={{ border: '1px solid #94A3B8', padding: '8px 12px', width: '75%', textAlign: 'left', fontWeight: 700 }}>
                    สมรรถนะประจำตำแหน่งงาน (Functional Competencies)
                  </th>
                  <th style={{ border: '1px solid #94A3B8', padding: '8px 12px', width: '25%', textAlign: 'center', fontWeight: 700 }}>
                    ระดับความสามารถที่ต้องการ (1-5)
                  </th>
                </tr>
              </thead>
              <tbody>
                {(jd.functionalCompetencies || []).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #94A3B8', padding: '6px 12px' }}>{item.name}</td>
                    <td style={{ border: '1px solid #94A3B8', padding: '6px 12px', textAlign: 'center', fontWeight: 800, color: '#0D9488' }}>
                      {item.targetLevel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================================ */}
          {/* ส่วนที่ 8 การฝึกอบรมที่จำเป็นต่อการปฏิบัติหน้าที่ (Training) */}
          {/* ============================================================ */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '2px solid #0F172A', paddingBottom: '4px', margin: '0 0 0.85rem 0' }}>
              ส่วนที่ 8 การฝึกอบรมที่จำเป็นต่อการปฏิบัติหน้าที่ให้มีประสิทธิภาพ (Training)
            </h2>

            <div style={{ paddingLeft: '1rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {(jd.trainings || []).map((tr, idx) => (
                <div key={idx}>
                  {idx + 1}. {tr}
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* Signature & Approval Block */}
          {/* ============================================================ */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              border: '1px solid #94A3B8',
              textAlign: 'center',
              fontSize: '0.85rem',
              marginBottom: '2rem',
              pageBreakInside: 'avoid',
            }}
          >
            <div style={{ borderRight: '1px solid #94A3B8', padding: '12px' }}>
              <div style={{ fontWeight: 700, marginBottom: '2.5rem' }}>
                ผู้จัดทำ<br />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>(Position By)</span>
              </div>
              <div style={{ borderBottom: '1px dotted #64748B', margin: '0 1rem 8px' }}></div>
              <div style={{ fontWeight: 600 }}>({jd.signatures?.preparedBy?.name || jd.personnelName || '...........................................'})</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                {jd.confirmedAt ? `ยืนยันเมื่อ ${new Date(jd.confirmedAt).toLocaleDateString('th-TH')}` : '......../......../........'}
              </div>
            </div>

            <div style={{ borderRight: '1px solid #94A3B8', padding: '12px' }}>
              <div style={{ fontWeight: 700, marginBottom: '2.5rem' }}>
                ผู้บังคับบัญชา<br />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>(Reviewed By)</span>
              </div>
              <div style={{ borderBottom: '1px dotted #64748B', margin: '0 1rem 8px' }}></div>
              <div style={{ fontWeight: 600 }}>({jd.signatures?.reviewedBy?.name || jd.supervisorName || '...........................................'})</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>......../......../........</div>
            </div>

            <div style={{ padding: '12px' }}>
              <div style={{ fontWeight: 700, marginBottom: '2.5rem' }}>
                ผู้อนุมัติ<br />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>(Approved By)</span>
              </div>
              <div style={{ borderBottom: '1px dotted #64748B', margin: '0 1rem 8px' }}></div>
              <div style={{ fontWeight: 600 }}>({jd.signatures?.approvedBy?.name || 'รศ.ดร.ชูพันธุ์ รัตนโภคา'})</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>......../......../........</div>
            </div>
          </div>

          {/* Official Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: '#64748B',
              borderTop: '1px solid #E2E8F0',
              paddingTop: '8px',
            }}
          >
            <div>Version {jd.version || '2.0'} • {jd.docCode || 'ICIT-FM-COMMON-006'}</div>
            <div style={{ fontWeight: 700, color: '#DC2626' }}>{jd.securityClassification || 'ปกปิด (Restricted)'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
