'use client';

import React from 'react';
import { X, Printer } from 'lucide-react';
import { formatMethodsString } from '@/lib/idpActionPlanService';

/**
 * Helper to format date into full Thai date format: e.g. "30 ตุลาคม 2569"
 */
function formatThaiFullDate(dateInput) {
  if (!dateInput) return null;
  const THAI_MONTHS_FULL = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  let day = null;
  let monthIndex = null;
  let beYear = null;

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    day = dateInput.getDate();
    monthIndex = dateInput.getMonth();
    beYear = dateInput.getFullYear() < 2400 ? dateInput.getFullYear() + 543 : dateInput.getFullYear();
  } else if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed || trimmed === '-') return null;

    // ISO: YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      monthIndex = parseInt(isoMatch[2], 10) - 1;
      day = parseInt(isoMatch[3], 10);
      beYear = y < 2400 ? y + 543 : y;
    } else if (trimmed.includes('/') || trimmed.includes('-')) {
      const sep = trimmed.includes('/') ? '/' : '-';
      const parts = trimmed.split(sep);
      if (parts.length === 3) {
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        const y = parseInt(parts[2].split(' ')[0], 10);
        if (!isNaN(p1) && !isNaN(p2) && !isNaN(y)) {
          if (p1 > 12) {
            day = p1;
            monthIndex = p2 - 1;
          } else if (p2 > 12) {
            day = p2;
            monthIndex = p1 - 1;
          } else {
            day = p1;
            monthIndex = p2 - 1;
          }
          beYear = y < 2400 ? y + 543 : y;
        }
      }
    }
  }

  if (day && monthIndex !== null && monthIndex >= 0 && monthIndex < 12 && beYear) {
    return `${day} ${THAI_MONTHS_FULL[monthIndex]} ${beYear}`;
  }
  return null;
}

export default function IDPActionPlanPrintModal({
  isOpen,
  onClose,
  plan,
  fiscalYear = '2569',
}) {
  if (!isOpen || !plan) return null;

  const handlePrint = () => {
    window.print();
  };

  const ack = plan.signatures?.acknowledgement || {};
  const ev = plan.signatures?.evaluation || {};

  const isSupervisorSigned = Boolean(ev.supervisor?.signed);

  // If supervisor has evaluated and signed:
  const isCompleted =
    isSupervisorSigned &&
    (ev.resultType === 'COMPLETED' || (ev.percent !== undefined && Number(ev.percent) >= 100));

  const isNearlyCompleted =
    isSupervisorSigned &&
    (ev.resultType === 'NEARLY_COMPLETED' || (ev.percent !== undefined && Number(ev.percent) < 100));

  // Percentage: show actual evaluated percent if supervisor has signed, otherwise show dotted line placeholder
  const displayPercent =
    isSupervisorSigned && ev.percent !== undefined && ev.percent !== null && ev.percent !== ''
      ? ev.percent
      : '.....';

  return (
    <div
      className="print-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto',
        padding: '2rem 1rem',
      }}
    >
      {/* Top Action Bar (Hidden on Print) */}
      <div
        className="no-print"
        style={{
          maxWidth: '1200px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          background: '#1E293B',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
          ตัวอย่างก่อนพิมพ์แบบฟอร์มแผนพัฒนาบุคลากร (IDP Action Plan) พ.ศ. {fiscalYear}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              background: '#F97316',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.825rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Printer size={15} />
            <span>พิมพ์เอกสาร (Print)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div
        className="printable-sheet"
        style={{
          background: '#FFFFFF',
          width: '100%',
          maxWidth: '1200px',
          padding: '2.5rem',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          color: '#000000',
          fontFamily: "'Sarabun', 'TH Sarabun New', Tahoma, sans-serif",
          fontSize: '13px',
          lineHeight: '1.4',
        }}
      >
        {/* Document Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
            แผนพัฒนาบุคลากร ประจำปีงบประมาณ พ.ศ. {fiscalYear} : Individual Development Plan (IDP)
          </h2>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
            สังกัด สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ
          </h3>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              borderBottom: '1px solid #000',
              fontWeight: 'normal',
              fontSize: '13px',
            }}
          >
            <div>
              <strong>ข้อมูลทั่วไป :</strong> ชื่อ - สกุล &nbsp;
              <span style={{ textDecoration: 'underline' }}>{plan.personnelName || '-'}</span>
            </div>
            <div>
              <strong>ฝ่าย :</strong> &nbsp;
              <span style={{ textDecoration: 'underline' }}>{plan.department || '-'}</span>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '1rem',
            fontSize: '11px',
            textAlign: 'left',
          }}
          border="1"
        >
          <thead>
            <tr style={{ background: '#F8FAFC', textAlign: 'center' }}>
              <th rowSpan="2" style={{ padding: '6px', width: '18%', border: '1px solid #000' }}>
                ความรู้/ทักษะ/สมรรถนะ
                <br />
                <span style={{ fontSize: '10px', fontWeight: 'normal' }}>
                  (เรียงลำดับความสำคัญ/เร่งด่วน จากมากไปน้อย)
                </span>
              </th>
              <th rowSpan="2" style={{ padding: '6px', width: '13%', border: '1px solid #000' }}>
                เป้าหมายการพัฒนา
              </th>
              <th rowSpan="2" style={{ padding: '6px', width: '10%', border: '1px solid #000' }}>
                วิธีการพัฒนา
              </th>
              <th rowSpan="2" style={{ padding: '6px', width: '14%', border: '1px solid #000' }}>
                การประยุกต์ใช้ในงาน
              </th>
              <th colSpan="4" style={{ padding: '4px', width: '16%', border: '1px solid #000' }}>
                ช่วงเวลาที่พัฒนา
              </th>
              <th rowSpan="2" style={{ padding: '6px', width: '11%', border: '1px solid #000' }}>
                การวัดผลสำเร็จของ
                <br />
                การนำไปประยุกต์ใช้ในงาน
              </th>
              <th colSpan="4" style={{ padding: '4px', width: '18%', border: '1px solid #000' }}>
                ความสอดคล้อง
              </th>
            </tr>
            <tr style={{ background: '#F8FAFC', textAlign: 'center', fontSize: '10px' }}>
              {/* Quarters */}
              <th style={{ padding: '4px', width: '4%', border: '1px solid #000' }}>
                Q1
                <br />
                <span style={{ fontSize: '9px' }}>(ต.ค.-ธ.ค.)</span>
              </th>
              <th style={{ padding: '4px', width: '4%', border: '1px solid #000' }}>
                Q2
                <br />
                <span style={{ fontSize: '9px' }}>(ม.ค.-มี.ค.)</span>
              </th>
              <th style={{ padding: '4px', width: '4%', border: '1px solid #000' }}>
                Q3
                <br />
                <span style={{ fontSize: '9px' }}>(เม.ย.-มิ.ย.)</span>
              </th>
              <th style={{ padding: '4px', width: '4%', border: '1px solid #000' }}>
                Q4
                <br />
                <span style={{ fontSize: '9px' }}>(ก.ค.-ก.ย.)</span>
              </th>

              {/* 4-Dimensions */}
              <th style={{ padding: '4px', width: '4.5%', border: '1px solid #000' }}>ประเภทสมรรถนะ</th>
              <th style={{ padding: '4px', width: '4.5%', border: '1px solid #000' }}>แผนกลยุทธ์</th>
              <th style={{ padding: '4px', width: '4.5%', border: '1px solid #000' }}>Knowledge & Skill</th>
              <th style={{ padding: '4px', width: '4.5%', border: '1px solid #000' }}>พันธกิจ</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="13" style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid #000' }}>
                  ไม่มีข้อมูลรายการแผนพัฒนา
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const methodsStr = formatMethodsString(item.methods, item.methodCustom);
                const q1 = item.quarters?.q1?.progress || (item.quarters?.q1?.planned ? '✓' : '-');
                const q2 = item.quarters?.q2?.progress || (item.quarters?.q2?.planned ? '✓' : '-');
                const q3 = item.quarters?.q3?.progress || (item.quarters?.q3?.planned ? '✓' : '-');
                const q4 = item.quarters?.q4?.progress || (item.quarters?.q4?.planned ? '✓' : '-');
                const evalStatus = item.evaluation?.status === 'ACHIEVED' ? 'บรรลุ' : 'ไม่บรรลุ';

                const compType = item.competencyType === 'CORE' ? 'สมรรถนะหลัก' : 'สมรรถนะตามตำแหน่งงาน';
                const strats = (item.alignments?.strategyTitles || []).join(', ') || '-';
                const skills = (item.alignments?.skillMapTitles || []).join(', ') || '-';
                const missions = (item.alignments?.missionTitles || []).join(', ') || '-';

                return (
                  <tr key={item.id} style={{ verticalAlign: 'top' }}>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>
                      <strong>{idx + 1}. {item.competencyName || '-'}</strong>
                      {item.skillDetail && (
                        <div style={{ fontSize: '10px', color: '#334155', marginTop: '3px' }}>
                          {item.skillDetail}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>
                      {item.goal || '-'}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #000', textAlign: 'center' }}>
                      {methodsStr}
                    </td>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>
                      {item.application || '-'}
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>{q1}</td>
                    <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>{q2}</td>
                    <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>{q3}</td>
                    <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>{q4}</td>
                    <td style={{ padding: '6px', border: '1px solid #000' }}>
                      {item.kpiCriteria && (
                        <div style={{ marginBottom: '4px', fontSize: '9.5px', color: '#0F172A' }}>
                          <strong>เกณฑ์วัดผล (KPI):</strong> {item.kpiCriteria}
                        </div>
                      )}
                      <div style={{ fontWeight: item.evaluation?.status === 'ACHIEVED' ? 700 : 'normal' }}>
                        <strong>ผลการประเมิน:</strong> {evalStatus}
                      </div>
                      {item.evaluation?.comment && (
                        <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>
                          ({item.evaluation.comment})
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #000', fontSize: '9px' }}>{compType}</td>
                    <td style={{ padding: '4px', border: '1px solid #000', fontSize: '9px' }}>{strats}</td>
                    <td style={{ padding: '4px', border: '1px solid #000', fontSize: '9px' }}>{skills}</td>
                    <td style={{ padding: '4px', border: '1px solid #000', fontSize: '9px' }}>{missions}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Legend of 10 Development Methods */}
        <div
          style={{
            border: '1px solid #000',
            padding: '6px 10px',
            marginBottom: '1rem',
            fontSize: '11px',
            background: '#FAFAFA',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '2px' }}>หมายเหตุ : วิธีการพัฒนา</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            <div>1 = ศึกษาด้วยตนเอง</div>
            <div>3 = แลกเปลี่ยนเรียนรู้</div>
            <div>5 = การสอนงาน</div>
            <div>7 = การให้คำปรึกษา</div>
            <div>9 = ติดตามผู้มีประสบการณ์</div>

            <div>2 = เรียนรู้จากการปฏิบัติงาน</div>
            <div>4 = พี่เลี้ยง</div>
            <div>6 = ฝึกอบรม</div>
            <div>8 = การมอบหมายงาน</div>
            <div>10 = วิธีพัฒนาอื่น ๆ</div>
          </div>
        </div>

        {/* Signatures & Evaluation 3 Boxes Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.35fr 1fr',
            border: '1px solid #000',
            fontSize: '11px',
          }}
        >
          {/* Box 1: รับทราบแผนพัฒนา IDP */}
          <div style={{ padding: '8px', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong>รับทราบแผนพัฒนา IDP</strong>
              <div style={{ marginTop: '16px' }}>
                ลงชื่อ: {ack.trainee?.signed ? <u>&nbsp;{ack.trainee.name}&nbsp;</u> : '...................................................'} ผู้รับการพัฒนา
              </div>
              <div style={{ marginTop: '12px' }}>
                ลงชื่อ: {ack.supervisor?.signed ? <u>&nbsp;{ack.supervisor.name}&nbsp;</u> : '...................................................'} ผู้บังคับบัญชา
              </div>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              วันที่ {formatThaiFullDate(ack.supervisor?.signedAt) || formatThaiFullDate(ack.trainee?.signedAt) || '..... / .................... / ..........'}
            </div>
          </div>

          {/* Box 2: การประเมินผลพัฒนาตามแผน IDP โดยผู้บังคับบัญชา */}
          <div style={{ padding: '8px', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong>การประเมินผลพัฒนาตามแผน IDP โดยผู้บังคับบัญชา</strong>
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '13px',
                      height: '13px',
                      border: '1.2px solid #000',
                      borderRadius: '2px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      lineHeight: 1,
                      backgroundColor: '#FFF',
                    }}
                  >
                    {isCompleted ? '✓' : ''}
                  </span>
                  <span>ดำเนินการพัฒนาตนเองสำเร็จตามแผน IDP</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '13px',
                      height: '13px',
                      border: '1.2px solid #000',
                      borderRadius: '2px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      lineHeight: 1,
                      backgroundColor: '#FFF',
                    }}
                  >
                    {isNearlyCompleted ? '✓' : ''}
                  </span>
                  <span>ดำเนินการพัฒนาตนเองเกือบสำเร็จตามแผน IDP</span>
                </div>
              </div>
              <div style={{ marginTop: '6px' }}>
                คิดเป็นร้อยละ <u>&nbsp;{displayPercent !== null ? displayPercent : '.....'}&nbsp;</u> ของแผนที่กำหนดไว้
                <br />
                เนื่องจาก <u>&nbsp;{ev.reason || '...................................................................................................'}&nbsp;</u>
              </div>
              <div style={{ marginTop: '12px' }}>
                ลงชื่อ: {ev.supervisor?.signed ? <u>&nbsp;{ev.supervisor.name}&nbsp;</u> : '...................................................'} ผู้บังคับบัญชา
                <br />
                ตำแหน่ง: {ev.supervisor?.position ? <u>&nbsp;{ev.supervisor.position}&nbsp;</u> : ev.supervisor?.signed ? <u>&nbsp;รองผู้อำนวยการฝ่ายบริหาร&nbsp;</u> : '...................................................'}
              </div>
            </div>
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              วันที่ {formatThaiFullDate(ev.supervisor?.signedAt) || '..... / .................... / ..........'}
            </div>
          </div>

          {/* Box 3: รับทราบผลการพัฒนา IDP */}
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong>รับทราบผลการพัฒนา IDP</strong>
              <div style={{ marginTop: '24px' }}>
                ลงชื่อ: {ev.trainee?.signed ? <u>&nbsp;{ev.trainee.name}&nbsp;</u> : '...................................................'} ผู้รับการพัฒนา
                <br />
                ตำแหน่ง: {ev.trainee?.position ? <u>&nbsp;{ev.trainee.position}&nbsp;</u> : plan.position ? <u>&nbsp;{plan.position}&nbsp;</u> : '...................................................'}
              </div>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              วันที่ {formatThaiFullDate(ev.trainee?.signedAt) || '..... / .................... / ..........'}
            </div>
          </div>
        </div>
      </div>

      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm 8mm;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            font-size: 8.5pt !important;
          }
          body * {
            visibility: hidden !important;
          }
          .print-modal-overlay,
          .print-modal-overlay * {
            visibility: visible !important;
          }
          .print-modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            z-index: 99999 !important;
            display: block !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-sheet {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 4mm 2mm !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          .printable-sheet table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            font-size: 7.5pt !important;
          }
          .printable-sheet th,
          .printable-sheet td {
            padding: 2.5px 3.5px !important;
            line-height: 1.2 !important;
            border: 1px solid #000000 !important;
          }
          .printable-sheet tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .printable-sheet thead {
            display: table-header-group !important;
          }
          .printable-sheet tfoot {
            display: table-footer-group !important;
          }
        }
      `}</style>
    </div>
  );
}
