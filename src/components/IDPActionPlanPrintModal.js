'use client';

import React from 'react';
import { X, Printer, FileSpreadsheet } from 'lucide-react';
import { formatMethodsString, exportActionPlanToExcel } from '@/lib/idpActionPlanService';
import { formatDateDDMMYYYYBE } from '@/lib/dateUtils';

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
            onClick={() => exportActionPlanToExcel(plan, fiscalYear)}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              background: '#059669',
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
            <FileSpreadsheet size={15} />
            <span>ส่งออก Excel</span>
          </button>

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
            แผนพัฒนาบุคลากร ประจำปีงบประมาณ พ.ศ. {fiscalYear} : Individual Development (IDP)
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
            {(plan.items || []).length === 0 ? (
              <tr>
                <td colSpan="13" style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid #000' }}>
                  ไม่มีข้อมูลรายการแผนพัฒนา
                </td>
              </tr>
            ) : (
              plan.items.map((item, idx) => {
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
            gridTemplateColumns: '1fr 1.3fr 1fr',
            border: '1px solid #000',
            fontSize: '11px',
          }}
        >
          {/* Box 1: รับทราบแผนพัฒนา IDP */}
          <div style={{ padding: '8px', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong>รับทราบแผนพัฒนา IDP</strong>
              <div style={{ marginTop: '16px' }}>
                ลงชื่อ: {ack.trainee?.signed ? <u>{ack.trainee.name}</u> : '...................................................'} ผู้รับการพัฒนา
              </div>
              <div style={{ marginTop: '12px' }}>
                ลงชื่อ: {ack.supervisor?.signed ? <u>{ack.supervisor.name}</u> : '...................................................'} ผู้บังคับบัญชา
              </div>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              วันที่ {ack.trainee?.signedAt ? formatDateDDMMYYYYBE(ack.trainee.signedAt) : '30 ตุลาคม 2568'}
            </div>
          </div>

          {/* Box 2: การประเมินผลพัฒนาตามแผน IDP โดยผู้บังคับบัญชา */}
          <div style={{ padding: '8px', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong>การประเมินผลพัฒนาตามแผน IDP โดยผู้บังคับบัญชา</strong>
              <div style={{ marginTop: '6px' }}>
                <div>{ev.resultType === 'COMPLETED' ? '☑' : '☐'} ดำเนินการพัฒนาตนเองสำเร็จตามแผน IDP</div>
                <div>{ev.resultType === 'NEARLY_COMPLETED' ? '☑' : '☐'} ดำเนินการพัฒนาตนเองเกือบสำเร็จตามแผน IDP</div>
              </div>
              <div style={{ marginTop: '6px' }}>
                คิดเป็นร้อยละ <u>&nbsp;{ev.percent ?? '.....'}&nbsp;</u> ของแผนที่กำหนดไว้
                <br />
                เนื่องจาก <u>&nbsp;{ev.reason || '.....................................................'}&nbsp;</u>
              </div>
              <div style={{ marginTop: '12px' }}>
                ลงชื่อ: {ev.supervisor?.signed ? <u>{ev.supervisor.name}</u> : '...................................................'} ผู้บังคับบัญชา
                <br />
                ตำแหน่ง: <u>&nbsp;{ev.supervisor?.position || 'รองผู้อำนวยการฝ่ายบริหาร'}&nbsp;</u>
              </div>
            </div>
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              วันที่ {ev.supervisor?.signedAt ? formatDateDDMMYYYYBE(ev.supervisor.signedAt) : '30 ตุลาคม 2568'}
            </div>
          </div>

          {/* Box 3: รับทราบผลการพัฒนา IDP */}
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong>รับทราบผลการพัฒนา IDP</strong>
              <div style={{ marginTop: '24px' }}>
                ลงชื่อ: {ev.trainee?.signed ? <u>{ev.trainee.name}</u> : '...................................................'} ผู้รับการพัฒนา
                <br />
                ตำแหน่ง: <u>&nbsp;{ev.trainee?.position || plan.position || 'บุคลากร'}&nbsp;</u>
              </div>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              วันที่ {ev.trainee?.signedAt ? formatDateDDMMYYYYBE(ev.trainee.signedAt) : '30 ตุลาคม 2568'}
            </div>
          </div>
        </div>
      </div>

      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-modal-overlay {
            position: static !important;
            background: none !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .printable-sheet {
            max-width: 100% !important;
            box-shadow: none !important;
            padding: 10mm !important;
            border-radius: 0 !important;
          }
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  );
}
