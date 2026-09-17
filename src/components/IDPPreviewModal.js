'use client';

import React, { useRef, useState } from 'react';
import { X, Printer, Download, Eye, LayoutGrid, FileText, Check } from 'lucide-react';
import { calculateIdpSummary } from '../lib/idpService';

export default function IDPPreviewModal({
  isOpen,
  onClose,
  record,
}) {
  const printRef = useRef(null);
  const [orientation, setOrientation] = useState('landscape'); // 'landscape' | 'portrait'

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
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
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
          maxWidth: orientation === 'landscape' ? '1200px' : '900px',
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
        {/* Top Control Header (Hidden in Print) */}
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
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                color: '#FB923C',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
              }}
            >
              IDP PRINT PREVIEW
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC' }}>
              {record.personnelName} - ปีงบประมาณ {record.fiscalYear}
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
                title="แนวนอน (เหมาะกับตารางกว้าง 9 คอลัมน์)"
              >
                <span>แนวนอน (Landscape)</span>
              </button>
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
                title="แนวตั้ง"
              >
                <span>แนวตั้ง (Portrait)</span>
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
          <div className="idp-header-title" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: '0 0 2px 0', fontSize: '11pt', fontWeight: 'bold' }}>
              แบบวิเคราะห์ความต้องการจำเป็นเพื่อจัดทำแผนพัฒนาบุคลากรรายบุคคล (IDP)
            </h3>
            <div style={{ fontSize: '9pt', color: '#333333' }}>
              สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ ประจำปีงบประมาณ {record.fiscalYear}
            </div>
          </div>

          {/* Personnel Information Line */}
          <div
            className="idp-personnel-line"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.65rem',
              fontSize: '9.5pt',
              fontWeight: 600,
            }}
          >
            <div>
              ชื่อ - สกุล : &nbsp;&nbsp;<u>&nbsp;&nbsp;{record.personnelName || '......................................................'}&nbsp;&nbsp;</u>
            </div>
            <div>
              ตำแหน่ง : &nbsp;&nbsp;<u>&nbsp;&nbsp;{record.position || '......................................................'}{record.level ? ` (${record.level})` : ''}&nbsp;&nbsp;</u>
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
                  rowSpan={4}
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
                  rowSpan={4}
                  style={{
                    border: '1px solid #000000',
                    padding: '4px 6px',
                    width: '190px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                  }}
                >
                  ประเภทของสมรรถนะ<br />(Type of Competency)
                </th>
                <th
                  rowSpan={4}
                  style={{
                    border: '1px solid #000000',
                    padding: '4px',
                    width: '40px',
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
                  rowSpan={2}
                  style={{
                    border: '1px solid #000000',
                    padding: '3px',
                    verticalAlign: 'middle',
                  }}
                >
                  ระดับคาดหวังที่กำหนด (2)
                </th>
                <th
                  colSpan={2}
                  rowSpan={2}
                  style={{
                    border: '1px solid #000000',
                    padding: '3px',
                    verticalAlign: 'middle',
                  }}
                >
                  ค่าคะแนนคาดหวัง(5) และที่ประเมินได้(6)
                </th>
                <th
                  rowSpan={3}
                  style={{
                    border: '1px solid #000000',
                    padding: '2px',
                    width: '42px',
                    verticalAlign: 'middle',
                  }}
                >
                  ช่องว่าง<br />(Gap)<br />(6) - (5)<br />(+/-)
                </th>
                <th
                  colSpan={10}
                  style={{
                    border: '1px solid #000000',
                    padding: '3px',
                  }}
                >
                  ผลการประเมิน
                </th>
              </tr>

              {/* Row 3 Header: ตนเอง vs หัวหน้า */}
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                <th
                  colSpan={5}
                  style={{
                    border: '1px solid #000000',
                    padding: '2px',
                  }}
                >
                  ตนเอง (3)
                </th>
                <th
                  colSpan={5}
                  style={{
                    border: '1px solid #000000',
                    padding: '2px',
                  }}
                >
                  หัวหน้า (4)
                </th>
              </tr>

              {/* Row 4 Subheaders: 1-5 levels */}
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                {/* Levels 1-5 for Expected */}
                {[1, 2, 3, 4, 5].map((n) => (
                  <th key={`exp-${n}`} style={{ border: '1px solid #000000', padding: '2px', width: '18px' }}>
                    {n}
                  </th>
                ))}
                {/* Expected Score Formula */}
                <th style={{ border: '1px solid #000000', padding: '2px', width: '46px', fontSize: '7pt' }}>
                  คาดหวัง(5)<br />(1) × (2)
                </th>
                {/* Evaluated Score Formula */}
                <th style={{ border: '1px solid #000000', padding: '2px', width: '50px', fontSize: '6.5pt' }}>
                  ประเมินได้(6)<br />{'[(3)+(4)]/2'}×(1)
                </th>
                {/* Levels 1-5 for Self Assessment */}
                {[1, 2, 3, 4, 5].map((n) => (
                  <th key={`self-${n}`} style={{ border: '1px solid #000000', padding: '2px', width: '18px' }}>
                    {n}
                  </th>
                ))}
                {/* Levels 1-5 for Supervisor Assessment */}
                {[1, 2, 3, 4, 5].map((n) => (
                  <th key={`sup-${n}`} style={{ border: '1px solid #000000', padding: '2px', width: '18px' }}>
                    {n}
                  </th>
                ))}
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
          <div className="idp-footnote" style={{ fontSize: '7.5pt', marginTop: '6px', lineHeight: 1.3, color: '#333333' }}>
            <div>* ที่ประเมินได้(6) = {'{ผลตนเอง(3) + ผลหัวหน้า(4)}'} ÷ 2 × น้ำหนักคะแนน(1)</div>
            <div>* หมายเหตุ ระดับความคาดหวังมาจากสมรรถนะหลักของมหาวิทยาลัย สามารถดูได้ที่ เว็บไซต์ กองบริหารและจัดการทรัพยากรมนุษย์</div>
          </div>

          {/* Signatures Blocks Matching Sample Form */}
          <div
            className="idp-signature-block"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              marginTop: '1rem',
              fontSize: '8.5pt',
              lineHeight: 1.5,
            }}
          >
            {/* Left: Self */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                <span>ลงชื่อ</span>
                <span
                  style={{
                    borderBottom: '1px dotted #000000',
                    minWidth: '150px',
                    display: 'inline-block',
                    textAlign: 'center',
                    fontWeight: selfSign?.signed ? 'bold' : 'normal',
                    padding: '0 6px',
                  }}
                >
                  {selfSign?.signed ? selfSign.name : ''}
                </span>
                <span>(ผู้รับการประเมิน)</span>
              </div>
              <div style={{ marginTop: '2px' }}>
                ( &nbsp;{selfSign?.signed ? selfSign.name : record.personnelName || '...................................................'} &nbsp;)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px', whiteSpace: 'nowrap' }}>
                <span>วันที่</span>
                <span
                  style={{
                    borderBottom: '1px dotted #000000',
                    minWidth: '150px',
                    display: 'inline-block',
                    textAlign: 'center',
                    padding: '0 6px',
                  }}
                >
                  {selfSign?.signed ? selfSign.signedAt : ''}
                </span>
              </div>
            </div>

            {/* Right: Supervisor / Head of Dept / Deputy Director */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                <span>ลงชื่อ</span>
                <span
                  style={{
                    borderBottom: '1px dotted #000000',
                    minWidth: '150px',
                    display: 'inline-block',
                    textAlign: 'center',
                    fontWeight: (headSign?.signed || deputySign?.signed) ? 'bold' : 'normal',
                    padding: '0 6px',
                  }}
                >
                  {headSign?.signed ? headSign.name : deputySign?.signed ? deputySign.name : ''}
                </span>
                <span style={{ fontSize: '8pt' }}>(ผู้ประเมิน/ผู้บังคับบัญชาเหนือขึ้นไป)</span>
              </div>
              <div style={{ marginTop: '2px' }}>
                ( &nbsp;{headSign?.signed ? headSign.name : deputySign?.signed ? deputySign.name : record.departmentHead?.name || record.supervisingDeputyDirector?.name || '...................................................'} &nbsp;)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px', whiteSpace: 'nowrap' }}>
                <span>วันที่</span>
                <span
                  style={{
                    borderBottom: '1px dotted #000000',
                    minWidth: '150px',
                    display: 'inline-block',
                    textAlign: 'center',
                    padding: '0 6px',
                  }}
                >
                  {headSign?.signed ? headSign.signedAt : deputySign?.signed ? deputySign.signedAt : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Optimization CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 ${orientation};
            margin: ${orientation === 'landscape' ? '5mm 7mm' : '7mm 8mm'};
          }
          html, body {
            background: #ffffff !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            font-size: 8pt !important;
            margin: 0 !important;
            padding: 0 !important;
          }
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
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .printable-idp-document table {
            font-size: ${orientation === 'landscape' ? '7.5pt' : '6.5pt'} !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .printable-idp-document th,
          .printable-idp-document td {
            padding: ${orientation === 'landscape' ? '2px 3px' : '1px 2px'} !important;
            line-height: 1.15 !important;
          }
          .printable-idp-document .idp-header-title {
            margin-bottom: 4px !important;
          }
          .printable-idp-document .idp-header-title h3 {
            font-size: 10.5pt !important;
            margin: 0 0 1px 0 !important;
          }
          .printable-idp-document .idp-header-title div {
            font-size: 8.5pt !important;
          }
          .printable-idp-document .idp-personnel-line {
            margin-bottom: 4px !important;
            font-size: 8.5pt !important;
          }
          .printable-idp-document .idp-footnote {
            margin-top: 3px !important;
            font-size: 6.5pt !important;
            line-height: 1.15 !important;
          }
          .printable-idp-document .idp-signature-block {
            margin-top: 6px !important;
            font-size: 7.5pt !important;
            line-height: 1.25 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
