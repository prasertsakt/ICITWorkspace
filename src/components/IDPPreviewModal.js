'use client';

import React, { useRef } from 'react';
import { X, Printer, Download, Eye } from 'lucide-react';
import { calculateIdpSummary } from '../lib/idpService';

export default function IDPPreviewModal({
  isOpen,
  onClose,
  record,
}) {
  const printRef = useRef(null);

  if (!isOpen || !record) return null;

  const summaryData = calculateIdpSummary(record.coreCompetencies || [], record.functionalCompetencies || []);
  const coreList = summaryData.coreCompetencies || [];
  const funcList = summaryData.functionalCompetencies || [];

  const handlePrint = () => {
    window.print();
  };

  const selfSign = record.signatures?.evaluatorSelf;
  const headSign = record.signatures?.evaluatorSupervisor;
  const deputySign = record.signatures?.evaluatorDeputyDirector;

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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          maxWidth: '1050px',
          width: '100%',
          maxHeight: '94vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Header (Hidden in Print) */}
        <div
          className="no-print"
          style={{
            background: '#1E1B4B',
            color: '#FFFFFF',
            padding: '1rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                backgroundColor: '#EEF2FF',
                color: '#3730A3',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              IDP A4 PREVIEW
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
              {record.personnelName} - ปีงบประมาณ {record.fiscalYear}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-primary btn-sm"
              style={{
                background: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              <Printer size={15} />
              <span>พิมพ์เอกสาร / บันทึกเป็น PDF</span>
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

        {/* Printable Document Container */}
        <div
          ref={printRef}
          style={{
            padding: '2rem 2.5rem',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: '#FFFFFF',
            color: '#000000',
            fontFamily: '"Sarabun", "TH Sarabun New", sans-serif',
          }}
          className="printable-idp-document"
        >
          {/* Header Title */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '12pt', fontWeight: 'bold' }}>
              แบบวิเคราะห์ความต้องการจำเป็นเพื่อจัดทำแผนพัฒนาบุคลากรรายบุคคล (IDP)
            </h3>
            <div style={{ fontSize: '10pt', color: '#333333' }}>
              สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ ประจำปีงบประมาณ {record.fiscalYear}
            </div>
          </div>

          {/* Personnel Information Line */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              fontSize: '10pt',
              fontWeight: 600,
            }}
          >
            <div>
              ชื่อ - สกุล : &nbsp;&nbsp;<u>&nbsp;&nbsp;{record.personnelName || '......................................................'}&nbsp;&nbsp;</u>
            </div>
            <div>
              ตำแหน่ง : &nbsp;&nbsp;<u>&nbsp;&nbsp;{record.position || '......................................................'}&nbsp;&nbsp;</u>
            </div>
            <div>
              ฝ่าย : &nbsp;&nbsp;<u>&nbsp;&nbsp;{record.department || '......................................................'}&nbsp;&nbsp;</u>
            </div>
          </div>

          {/* Main IDP Evaluation Matrix Table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1.5px solid #000000',
              fontSize: '8.5pt',
              textAlign: 'center',
            }}
          >
            <thead>
              {/* Row 1 Header */}
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                <th
                  rowSpan={3}
                  style={{
                    border: '1px solid #000000',
                    padding: '4px',
                    width: '30px',
                    verticalAlign: 'middle',
                  }}
                >
                  ลำดับ
                </th>
                <th
                  rowSpan={3}
                  style={{
                    border: '1px solid #000000',
                    padding: '6px',
                    width: '210px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                  }}
                >
                  ประเภทของสมรรถนะ<br />(Type of Competency)
                </th>
                <th
                  rowSpan={3}
                  style={{
                    border: '1px solid #000000',
                    padding: '4px',
                    width: '45px',
                    verticalAlign: 'middle',
                  }}
                >
                  น้ำหนัก<br />คะแนน<br />(1)
                </th>
                <th
                  colSpan={18}
                  style={{
                    border: '1px solid #000000',
                    padding: '4px',
                  }}
                >
                  วิเคราะห์ความต้องการจำเป็นเพื่อจัดทำแผนพัฒนาบุคลากรรายบุคคล (IDP)
                </th>
              </tr>

              {/* Row 2 Header */}
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                <th
                  colSpan={5}
                  style={{
                    border: '1px solid #000000',
                    padding: '2px',
                  }}
                >
                  ระดับคาดหวังที่กำหนด (2)
                </th>
                <th
                  colSpan={2}
                  style={{
                    border: '1px solid #000000',
                    padding: '2px',
                  }}
                >
                  ค่าคะแนนคาดหวัง(5) และที่ประเมินได้(6)
                </th>
                <th
                  rowSpan={2}
                  style={{
                    border: '1px solid #000000',
                    padding: '2px',
                    width: '45px',
                    verticalAlign: 'middle',
                  }}
                >
                  ช่องว่าง<br />(Gap)<br />(6) - (5)<br />(+/-)
                </th>
                <th
                  colSpan={10}
                  style={{
                    border: '1px solid #000000',
                    padding: '2px',
                  }}
                >
                  ผลการประเมิน
                </th>
              </tr>

              {/* Row 3 Subheaders */}
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                {/* Levels 1-5 for Expected */}
                {[1, 2, 3, 4, 5].map((n) => (
                  <th key={`exp-${n}`} style={{ border: '1px solid #000000', padding: '2px', width: '18px' }}>
                    {n}
                  </th>
                ))}
                {/* Expected Score Formula */}
                <th style={{ border: '1px solid #000000', padding: '2px', width: '50px', fontSize: '7.5pt' }}>
                  คาดหวัง(5)<br />(1) × (2)
                </th>
                {/* Evaluated Score Formula */}
                <th style={{ border: '1px solid #000000', padding: '2px', width: '55px', fontSize: '7pt' }}>
                  ประเมินได้(6)<br />{'[(3)+(4)]/2'}×(1)
                </th>
                {/* Levels 1-5 for Self Assessment */}
                <th colSpan={5} style={{ border: '1px solid #000000', padding: '2px' }}>
                  ตนเอง (3)
                  <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #000000', marginTop: '2px' }}>
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  </div>
                </th>
                {/* Levels 1-5 for Supervisor Assessment */}
                <th colSpan={5} style={{ border: '1px solid #000000', padding: '2px' }}>
                  หัวหน้า (4)
                  <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #000000', marginTop: '2px' }}>
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Category 1: สมรรถนะหลัก (Core Competency) */}
              {coreList.map((row, idx) => (
                <tr key={row.id || idx}>
                  {idx === 0 && (
                    <td
                      rowSpan={coreList.length}
                      style={{
                        border: '1px solid #000000',
                        padding: '4px',
                        fontWeight: 'bold',
                        verticalAlign: 'middle',
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        textAlign: 'center',
                        fontSize: '8pt',
                        backgroundColor: '#FCFDFE',
                      }}
                    >
                      สมรรถนะหลัก<br />(Core Competency)
                    </td>
                  )}
                  <td style={{ border: '1px solid #000000', padding: '3px 6px', textAlign: 'left' }}>
                    {idx + 1}. {row.title}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '3px' }}>
                    {row.weight}
                  </td>

                  {/* Expected Level 1-5 radio ticks */}
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <td key={`core-exp-${lvl}`} style={{ border: '1px solid #000000', padding: '2px' }}>
                      {row.expectedLevel === lvl ? lvl : ''}
                    </td>
                  ))}

                  {/* Expected Total (5) */}
                  <td style={{ border: '1px solid #000000', padding: '2px' }}>
                    {row.expectedTotal}
                  </td>

                  {/* Evaluated Total (6) */}
                  <td style={{ border: '1px solid #000000', padding: '2px', fontWeight: 'bold' }}>
                    {row.evaluatedTotal || 0}
                  </td>

                  {/* Gap */}
                  <td style={{ border: '1px solid #000000', padding: '2px', fontWeight: 'bold' }}>
                    {row.gap > 0 ? `+${row.gap}` : row.gap}
                  </td>

                  {/* Self Score 1-5 */}
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <td key={`core-self-${lvl}`} style={{ border: '1px solid #000000', padding: '2px' }}>
                      {row.selfScore === lvl ? lvl : ''}
                    </td>
                  ))}

                  {/* Supervisor Score 1-5 */}
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <td key={`core-sup-${lvl}`} style={{ border: '1px solid #000000', padding: '2px' }}>
                      {row.supervisorScore === lvl ? lvl : ''}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Category 2: สมรรถนะตามตำแหน่งงาน (Functional Competency) */}
              {funcList.map((row, idx) => (
                <tr key={row.id || idx}>
                  {idx === 0 && (
                    <td
                      rowSpan={funcList.length}
                      style={{
                        border: '1px solid #000000',
                        padding: '4px',
                        fontWeight: 'bold',
                        verticalAlign: 'middle',
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        textAlign: 'center',
                        fontSize: '7.5pt',
                        backgroundColor: '#FCFDFE',
                      }}
                    >
                      สมรรถนะตามตำแหน่งงาน<br />(Functional Competency)
                    </td>
                  )}
                  <td style={{ border: '1px solid #000000', padding: '3px 6px', textAlign: 'left' }}>
                    {idx + 1}. {row.title}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '3px' }}>
                    {row.weight}
                  </td>

                  {/* Expected Level 1-5 */}
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <td key={`func-exp-${lvl}`} style={{ border: '1px solid #000000', padding: '2px' }}>
                      {row.expectedLevel === lvl ? lvl : ''}
                    </td>
                  ))}

                  {/* Expected Total (5) */}
                  <td style={{ border: '1px solid #000000', padding: '2px' }}>
                    {row.expectedTotal}
                  </td>

                  {/* Evaluated Total (6) */}
                  <td style={{ border: '1px solid #000000', padding: '2px', fontWeight: 'bold' }}>
                    {row.evaluatedTotal || 0}
                  </td>

                  {/* Gap */}
                  <td style={{ border: '1px solid #000000', padding: '2px', fontWeight: 'bold' }}>
                    {row.gap > 0 ? `+${row.gap}` : row.gap}
                  </td>

                  {/* Self Score 1-5 */}
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <td key={`func-self-${lvl}`} style={{ border: '1px solid #000000', padding: '2px' }}>
                      {row.selfScore === lvl ? lvl : ''}
                    </td>
                  ))}

                  {/* Supervisor Score 1-5 */}
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <td key={`func-sup-${lvl}`} style={{ border: '1px solid #000000', padding: '2px' }}>
                      {row.supervisorScore === lvl ? lvl : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Formulas & Footnote */}
          <div style={{ fontSize: '8pt', marginTop: '8px', lineHeight: 1.5, color: '#333333' }}>
            <div>* ที่ประเมินได้(6) = {'{ผลตนเอง(3) + ผลหัวหน้า(4)}'} ÷ 2 × น้ำหนักคะแนน(1)</div>
            <div>* หมายเหตุ ระดับความคาดหวังมาจากสมรรถนะหลักของมหาวิทยาลัย สามารถดูได้ที่ เว็บไซต์ กองบริหารและจัดการทรัพยากรมนุษย์</div>
          </div>

          {/* Signatures Blocks Matching Sample Form */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '1.75rem',
              fontSize: '9.5pt',
              lineHeight: 1.8,
            }}
          >
            {/* Left: Self */}
            <div style={{ textAlign: 'center', width: '45%' }}>
              <div>
                ลงชื่อ &nbsp;&nbsp;<u>&nbsp;&nbsp;{selfSign?.signed ? selfSign.name : '............................................................'}&nbsp;&nbsp;</u>&nbsp;&nbsp; (ผู้รับการประเมิน)
              </div>
              <div style={{ marginTop: '2px' }}>
                ( &nbsp;{selfSign?.signed ? selfSign.name : record.personnelName || 'นายบุคลากร ดีเด่น'}&nbsp; )
              </div>
              <div>
                วันที่ &nbsp;&nbsp;<u>&nbsp;&nbsp;{selfSign?.signed ? selfSign.signedAt : '............................................................'}&nbsp;&nbsp;</u>
              </div>
            </div>

            {/* Right: Supervisor / Head of Dept / Deputy Director */}
            <div style={{ textAlign: 'center', width: '45%' }}>
              <div>
                ลงชื่อ &nbsp;&nbsp;<u>&nbsp;&nbsp;{headSign?.signed ? headSign.name : deputySign?.signed ? deputySign.name : '............................................................'}&nbsp;&nbsp;</u>&nbsp;&nbsp; (ผู้ประเมิน/ผู้บังคับบัญชาเหนือขึ้นไป)
              </div>
              <div style={{ marginTop: '2px' }}>
                ( &nbsp;{headSign?.signed ? headSign.name : deputySign?.signed ? deputySign.name : record.departmentHead?.name || record.supervisingDeputyDirector?.name || 'หัวหน้าฝ่าย / รองผู้อำนวยการ'}&nbsp; )
              </div>
              <div>
                วันที่ &nbsp;&nbsp;<u>&nbsp;&nbsp;{headSign?.signed ? headSign.signedAt : deputySign?.signed ? deputySign.signedAt : '............................................................'}&nbsp;&nbsp;</u>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Optimization CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-idp-document,
          .printable-idp-document * {
            visibility: visible !important;
          }
          .printable-idp-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0.5cm !important;
            margin: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
