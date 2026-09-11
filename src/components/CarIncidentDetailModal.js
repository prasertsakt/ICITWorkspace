'use client';

import React, { useRef } from 'react';
import {
  X,
  Printer,
  Edit,
  Trash2,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  User,
  Users,
  Building,
  Lock,
} from 'lucide-react';
import {
  CAR_INCIDENT_STATUS,
  CAR_INCIDENT_STATUS_INFO,
  canUserDeleteCarIncident,
  canUserManageCarIncidentStatus,
  isDccUser,
} from '../lib/carIncidentService';

export default function CarIncidentDetailModal({
  isOpen,
  onClose,
  record,
  currentUser,
  currentPersonnel,
  yearlyConfig,
  isAdmin,
  onEdit,
  onDelete,
  onManageStatus,
  onSendReminder,
}) {
  const printRef = useRef(null);

  if (!isOpen || !record) return null;

  const isDCC = isDccUser(currentUser, currentPersonnel, yearlyConfig, isAdmin);
  const canManageStatus = canUserManageCarIncidentStatus(record, currentUser, currentPersonnel, yearlyConfig, isAdmin);
  const canDelete = canUserDeleteCarIncident(record, currentUser, currentPersonnel, yearlyConfig, isAdmin);
  const isClosed = record.status === CAR_INCIDENT_STATUS.CLOSED;

  const handlePrint = () => {
    window.print();
  };

  const statusInfo = CAR_INCIDENT_STATUS_INFO[record.status] || {
    label: record.status,
    color: '#475569',
    bg: '#F1F5F9',
    border: '#CBD5E1',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9997,
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
          maxWidth: '960px',
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
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '1rem 1.5rem',
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
                backgroundColor: statusInfo.bg,
                color: statusInfo.color,
                border: `1px solid ${statusInfo.border}`,
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {statusInfo.label}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
              {record.docNumber} ({record.docType})
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              ปีงบประมาณ {record.fiscalYear}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Status Manage Button for Deputy Director & DCC */}
            {canManageStatus && (
              <button
                type="button"
                onClick={onManageStatus}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.775rem',
                  padding: '4px 10px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                <ShieldCheck size={14} color="#A7F3D0" />
                <span>จัดการสถานะ</span>
              </button>
            )}

            {/* DCC Reminder Button (Envelope Icon using Mail from lucide-react) */}
            {isDCC && (
              <button
                type="button"
                onClick={onSendReminder}
                className="btn btn-secondary btn-sm"
                title="ส่งอีเมลแจ้งเตือนติดตามความคืบหน้า (DCC Reminder)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.775rem',
                  padding: '4px 10px',
                  background: 'rgba(13, 148, 136, 0.25)',
                  color: '#2DD4BF',
                  border: '1px solid rgba(45, 212, 191, 0.4)',
                }}
              >
                <Mail size={15} />
                <span>ส่งแจ้งเตือน (DCC)</span>
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.775rem',
                padding: '4px 10px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              <Printer size={14} />
              <span>พิมพ์แบบฟอร์ม</span>
            </button>

            {/* Edit Button */}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="btn btn-primary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.775rem',
                  padding: '4px 12px',
                  background: '#0D9488',
                  color: '#FFFFFF',
                  border: 'none',
                }}
              >
                <Edit size={14} />
                <span>แก้ไข</span>
              </button>
            )}

            {/* Delete Button (Only for DCC / Admin, forbidden if CLOSED) */}
            {isDCC && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isClosed}
                title={isClosed ? 'เอกสารปิดสมบูรณ์แล้ว ไม่สามารถลบได้' : 'ลบเอกสาร'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.775rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: isClosed ? 'rgba(255, 255, 255, 0.05)' : 'rgba(239, 68, 68, 0.2)',
                  color: isClosed ? '#94A3B8' : '#FCA5A5',
                  cursor: isClosed ? 'not-allowed' : 'pointer',
                }}
              >
                <Trash2 size={14} />
                <span>{isClosed ? 'ลบไม่ได้ (Closed)' : 'ลบ'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '4px',
                marginLeft: '6px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Official KMUTNB Document Content */}
        <div
          ref={printRef}
          className="printable-document"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2.25rem 2.5rem',
            backgroundColor: '#FFFFFF',
            fontFamily: "'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: '#000000',
            lineHeight: 1.5,
          }}
        >
          {/* Header Metadata matching PDF */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11pt',
              color: '#333333',
              marginBottom: '1rem',
            }}
          >
            <div>
              <div>Version 5.0</div>
              <div>ICIT-FM-COMMON-013, 19 DEC 2025</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>หน้า 1 จาก 1</div>
              <div>เอกสารใช้ภายใน (Internal Use)</div>
              <div style={{ marginTop: '4px', fontWeight: 'bold' }}>
                เลขที่: <u>&nbsp;{record.docNumber}&nbsp;</u>
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', margin: '0.75rem 0 1.25rem' }}>
            <h1 style={{ fontSize: '15pt', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              แบบฟอร์มขอปฏิบัติการแก้ไข : Corrective Action Request (CAR)
            </h1>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '11pt' }}>
              <span>
                {record.standard?.includes('27001') ? '●' : '○'} ISO 27001
              </span>
              <span>
                {record.standard?.includes('9001') ? '●' : '○'} ISO 9001
              </span>
              <span>
                {record.standard?.includes('IMS') ? '●' : '○'} IMS (Integrated)
              </span>
            </div>
            <div style={{ fontSize: '10pt', color: '#475569', marginTop: '4px' }}>
              หัวข้อตรวจติดตาม: <strong>{record.topic}</strong> {record.clauses ? `(ข้อกำหนด: ${record.clauses})` : ''}
            </div>
          </div>

          {/* Boxed Form matching template */}
          <div style={{ border: '1.5px solid #000000', borderRadius: '4px', fontSize: '10.5pt' }}>
            {/* PART 1 */}
            <div style={{ padding: '10px 14px', borderBottom: '1.5px solid #000000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div>
                  <strong>(ส่วนที่ 1) ผู้ร้องขอการแก้ไข</strong> ชื่อ - นามสกุล:{' '}
                  <u>
                    &nbsp;
                    {(record.requesters || []).map((r) => r.name).join(', ') || '-'}&nbsp;
                  </u>
                </div>
                <div>
                  วันที่: <u>&nbsp;{record.requestDate || '-'}&nbsp;</u>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '8px', fontSize: '10pt' }}>
                <div>
                  สถานะผู้ร้องขอการแก้ไข:{' '}
                  <span>{record.requesterStatus === 'AUDITOR' ? '☑' : '☐'} ผู้ตรวจติดตามภายใน</span>{' '}
                  <span>{record.requesterStatus === 'CUSTOMER' ? '☑' : '☐'} ผู้รับบริการ</span>{' '}
                  <span>{record.requesterStatus === 'OTHER' ? '☑' : '☐'} อื่นๆ {record.requesterStatusOther ? `(${record.requesterStatusOther})` : ''}</span>
                </div>
                <div>
                  สถานะปัญหา:{' '}
                  <span>{record.problemStatus === 'INTERNAL' ? '☑' : '☐'} ปัญหาภายใน</span>{' '}
                  <span>{record.problemStatus === 'PREVENTIVE' ? '☑' : '☐'} ป้องกันปัญหา</span>
                </div>
              </div>

              <div>
                <strong>รายละเอียดปัญหา/ความไม่สอดคล้อง:</strong>
                <div
                  style={{
                    marginTop: '4px',
                    minHeight: '60px',
                    whiteSpace: 'pre-wrap',
                    padding: '6px 8px',
                    backgroundColor: '#FAFAFA',
                    border: '1px dashed #CCCCCC',
                    borderRadius: '4px',
                  }}
                >
                  {record.description || '-'}
                </div>
              </div>
            </div>

            {/* PART 2 */}
            <div style={{ padding: '10px 14px', borderBottom: '1.5px solid #000000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div>
                  <strong>(ส่วนที่ 2) ผู้รับการร้องขอ / ผู้รับผิดชอบบริการ (Service Owner) / หัวหน้าฝ่าย:</strong>
                  <br />
                  ชื่อ - นามสกุล:{' '}
                  <u>
                    &nbsp;
                    {(record.requestees || []).map((r) => r.name).join(', ') || '-'}&nbsp;
                  </u>
                </div>
                <div>
                  วันที่: <u>&nbsp;{record.part2Date || '-'}&nbsp;</u>
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <strong>แนวทางการแก้ไขปัญหาเบื้องต้น (Correction actions):</strong>
                <div
                  style={{
                    marginTop: '4px',
                    minHeight: '48px',
                    whiteSpace: 'pre-wrap',
                    padding: '6px 8px',
                    backgroundColor: '#FAFAFA',
                    border: '1px dashed #CCCCCC',
                    borderRadius: '4px',
                  }}
                >
                  {record.immediateCorrection || 'ยังไม่มีการระบุแนวทางการแก้ไขเบื้องต้น'}
                </div>
              </div>

              <div>
                <strong>สาเหตุของปัญหา (Root Cause):</strong>
                <div
                  style={{
                    marginTop: '4px',
                    minHeight: '48px',
                    whiteSpace: 'pre-wrap',
                    padding: '6px 8px',
                    backgroundColor: '#FAFAFA',
                    border: '1px dashed #CCCCCC',
                    borderRadius: '4px',
                  }}
                >
                  {record.rootCause || 'ยังไม่มีการระบุสาเหตุของปัญหา'}
                </div>
              </div>
            </div>

            {/* PART 3 */}
            <div style={{ padding: '10px 14px', borderBottom: '1.5px solid #000000' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                การแก้ไขปัญหาเพื่อกำจัดสาเหตุของปัญหา / การดำเนินการป้องกัน (Corrective actions)
              </div>

              {/* Action Plan Table matching template */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #000000',
                  fontSize: '9.5pt',
                  marginBottom: '10px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#F3F4F6', textAlign: 'center' }}>
                    <th style={{ border: '1px solid #000000', padding: '6px', width: '30px' }}>#</th>
                    <th style={{ border: '1px solid #000000', padding: '6px' }}>ขั้นตอนการปฏิบัติ</th>
                    <th style={{ border: '1px solid #000000', padding: '6px', width: '140px' }}>ผู้รับผิดชอบ</th>
                    <th style={{ border: '1px solid #000000', padding: '6px', width: '100px' }}>วันที่จะแล้วเสร็จ</th>
                    <th style={{ border: '1px solid #000000', padding: '6px', width: '90px' }}>วันที่เสร็จ</th>
                    <th style={{ border: '1px solid #000000', padding: '6px', width: '130px' }}>ลายมือชื่อผู้รับผิดชอบ</th>
                    <th style={{ border: '1px solid #000000', padding: '6px', width: '100px' }}>หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {(record.actionPlans || []).map((plan, idx) => (
                    <tr key={plan.id || idx}>
                      <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px' }}>{plan.step || '-'}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px' }}>{plan.responsiblePerson || '-'}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{plan.targetDate || '-'}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{plan.completedDate || '-'}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px', textAlign: 'center' }}>{plan.signature || '-'}</td>
                      <td style={{ border: '1px solid #000000', padding: '6px' }}>{plan.remarks || '-'}</td>
                    </tr>
                  ))}
                  {(!record.actionPlans || record.actionPlans.length === 0) && (
                    <tr>
                      <td colSpan={7} style={{ border: '1px solid #000000', padding: '12px', textAlign: 'center', color: '#666' }}>
                        ยังไม่มีการกำหนดแผนขั้นตอนการปฏิบัติ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Executive Sign-off */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', fontSize: '10pt' }}>
                <div style={{ textAlign: 'right' }}>
                  รองผู้อำนวยการฝ่ายบริหาร/ตัวแทนฝ่ายบริหาร : ลายมือชื่อ{' '}
                  <u>
                    &nbsp;{record.executiveSignature ? record.executiveSignature.name : '________________________'}&nbsp;
                  </u>{' '}
                  วันที่ <u>&nbsp;{record.executiveSignature?.date || '______________'}&nbsp;</u>
                </div>
              </div>
            </div>

            {/* PART 4 (ในแบบฟอร์มระบุ ส่วนที่ 3 ผู้ตรวจติดตามภายใน) */}
            <div style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div>
                  <strong>(ส่วนที่ 3 ในแบบฟอร์ม) ผู้ตรวจติดตามภายใน / ผู้ที่ได้รับมอบหมาย:</strong>
                  <br />
                  ชื่อ - นามสกุล:{' '}
                  <u>
                    &nbsp;
                    {record.followUpAuditor?.name || '-'}&nbsp;
                  </u>
                </div>
                <div>
                  วันที่: <u>&nbsp;{record.followUpDate || '-'}&nbsp;</u>
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <strong>การตรวจติดตามผลการแก้ไข และสิ่งที่พบจากการติดตามผลการแก้ไข:</strong>
                <div
                  style={{
                    marginTop: '4px',
                    minHeight: '48px',
                    whiteSpace: 'pre-wrap',
                    padding: '6px 8px',
                    backgroundColor: '#FAFAFA',
                    border: '1px dashed #CCCCCC',
                    borderRadius: '4px',
                  }}
                >
                  {record.followUpFindings || 'ยังไม่มีการบันทึกผลการติดตาม'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginTop: '8px' }}>
                <strong>ผลการติดตาม:</strong>
                <span>
                  {record.followUpResult === 'RESOLVED' ? '☑' : '☐'} สามารถแก้ไข / ป้องกันปัญหาได้
                </span>
                <span>
                  {record.followUpResult === 'INEFFECTIVE' ? '☑' : '☐'} ไม่สามารถแก้ไข / ไม่สามารถป้องกันได้อย่างมีประสิทธิภาพ
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Remarks Print section */}
          {record.notes && record.notes.length > 0 && (
            <div style={{ marginTop: '1.25rem', fontSize: '9.5pt' }}>
              <strong>บันทึกข้อความและหมายเหตุเพิ่มเติม (Notes & Remarks):</strong>
              <div style={{ marginTop: '6px', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '8px' }}>
                {record.notes.map((n, i) => (
                  <div key={n.id || i} style={{ marginBottom: '6px', borderBottom: '1px dotted #E2E8F0', paddingBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold' }}>{n.authorName}</span>{' '}
                    <span style={{ color: '#666', fontSize: '8.5pt' }}>({new Date(n.createdAt).toLocaleDateString('th-TH')}):</span>{' '}
                    <span>{n.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-document,
          .printable-document * {
            visibility: visible !important;
          }
          .printable-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
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
