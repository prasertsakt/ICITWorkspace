'use client';

import React from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  FileText,
  ShieldCheck,
  Edit,
  CheckSquare,
  Clock,
  Printer,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { IMS_RESULT_TYPES, IMS_AUDIT_STATUSES } from '@/lib/constants';

export default function ImsAuditDetailModal({
  isOpen,
  onClose,
  audit,
  onEdit,
  onDelete,
  onApprove,
  onReturn,
  isLeadAuditor = false,
  isAdmin = false,
  canEdit = true,
  canDelete = false,
}) {
  const [isReturnBoxOpen, setIsReturnBoxOpen] = React.useState(false);
  const [revisionComment, setRevisionComment] = React.useState('');

  React.useEffect(() => {
    setIsReturnBoxOpen(false);
    setRevisionComment('');
  }, [isOpen, audit?.id]);

  if (!isOpen || !audit) return null;

  const resultMeta = audit.result ? IMS_RESULT_TYPES[audit.result] : null;
  const statusMeta = IMS_AUDIT_STATUSES[audit.status] || IMS_AUDIT_STATUSES.PENDING_LEAD_APPROVAL;

  const handleConfirmReturn = () => {
    if (!revisionComment.trim()) {
      alert('กรุณาระบุข้อคิดเห็นหรือสิ่งที่ต้องการให้ผู้ตรวจแก้ไขเพิ่มเติม');
      return;
    }
    if (onReturn) {
      onReturn(audit.id, revisionComment.trim());
      setIsReturnBoxOpen(false);
      setRevisionComment('');
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '1.25rem',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={22} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                รายละเอียดการตรวจติดตามภายใน
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#CCFBF1', margin: '2px 0 0 0' }}>
                ปีงบประมาณ {audit.auditYear} • {audit.isoStandard || 'IMS 9001/27001'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body - Styled strictly matching the AppSheet Screenshot Layout */}
        <div style={{ overflowY: 'auto', padding: '1.75rem 2rem' }}>
          {/* If returned for revision, show Lead comment banner */}
          {audit.status === 'RETURNED_FOR_REVISION' && audit.leadRevisionComment && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                background: '#FEF2F2',
                border: '1.5px solid #FECACA',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#DC2626',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  marginBottom: '4px',
                }}
              >
                <AlertCircle size={18} />
                <span>ข้อคิดเห็นจาก Lead Internal Auditor (ส่งกลับเพื่อแก้ไข):</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#991B1B', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {audit.leadRevisionComment}
              </p>
              {audit.returnedByName && (
                <div style={{ fontSize: '0.775rem', color: '#B91C1C', marginTop: '6px' }}>
                  โดย {audit.returnedByName}
                </div>
              )}
            </div>
          )}

          {/* Top metadata grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr',
              rowGap: '0.75rem',
              columnGap: '1rem',
              marginBottom: '1.5rem',
              fontSize: '0.925rem',
            }}
          >
            <div style={{ color: '#64748B', fontWeight: 500 }}>ISO</div>
            <div style={{ color: '#1E293B', fontWeight: 600 }}>{audit.isoStandard || 'IMS 9001/27001'}</div>

            <div style={{ color: '#64748B', fontWeight: 500 }}>วันที่ทำการตรวจติดตาม</div>
            <div style={{ color: '#0284C7', fontWeight: 700 }}>
              {audit.auditDate || '-'}
            </div>

            <div style={{ color: '#64748B', fontWeight: 500 }}>สถานะกระบวนการ</div>
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: statusMeta.badgeBg,
                  color: statusMeta.color,
                  border: `1px solid ${statusMeta.border}`,
                }}
              >
                {statusMeta.label}
              </span>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '1.25rem 0' }} />

          {/* Section: รายชื่อผู้ตรวจติดตาม */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#0284C7',
                margin: '0 0 0.85rem 0',
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
              }}
            >
              รายชื่อผู้ตรวจติดตาม
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                rowGap: '0.75rem',
                columnGap: '1rem',
                fontSize: '0.925rem',
              }}
            >
              <div style={{ color: '#64748B', fontWeight: 500 }}>ผู้ตรวจติดตามภายใน 1</div>
              <div style={{ color: '#0284C7', fontWeight: 600 }}>
                {audit.auditor1Name || '-'}
              </div>

              {audit.hasSecondAuditor && audit.auditor2Name && (
                <>
                  <div style={{ color: '#64748B', fontWeight: 500 }}>ผู้ตรวจติดตามภายใน 2</div>
                  <div style={{ color: '#0284C7', fontWeight: 600 }}>
                    {audit.auditor2Name}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section: รายชื่อผู้รับการตรวจ (Auditees) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#0284C7',
                margin: '0 0 0.85rem 0',
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
              }}
            >
              รายชื่อผู้รับการตรวจ
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                rowGap: '0.75rem',
                columnGap: '1rem',
                fontSize: '0.925rem',
              }}
            >
              {Array.isArray(audit.auditees) && audit.auditees.length > 0 ? (
                audit.auditees.map((auditee, idx) => (
                  <React.Fragment key={idx}>
                    <div style={{ color: '#64748B', fontWeight: 500 }}>
                      ผู้รับการตรวจ {idx + 1}
                    </div>
                    <div style={{ color: '#1E293B', fontWeight: 600 }}>
                      {auditee.name || '-'}
                      {auditee.department ? ` (${auditee.department})` : ''}
                    </div>
                  </React.Fragment>
                ))
              ) : (
                <>
                  <div style={{ color: '#64748B', fontWeight: 500 }}>ผู้รับการตรวจ 1</div>
                  <div style={{ color: '#1E293B', fontWeight: 600 }}>
                    {audit.auditee1Name || '-'}
                    {audit.auditeeDepartment ? ` (${audit.auditeeDepartment})` : ''}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section: รายละเอียดการตรวจติดตาม */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#0284C7',
                margin: '0 0 1rem 0',
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
              }}
            >
              รายละเอียดการตรวจติดตาม
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                rowGap: '1rem',
                columnGap: '1rem',
                fontSize: '0.925rem',
              }}
            >
              {/* หัวข้อที่รับการตรวจ (in Red bold, exactly matching screenshot) */}
              <div style={{ color: '#64748B', fontWeight: 500 }}>หัวข้อที่รับการตรวจ</div>
              <div style={{ color: '#DC2626', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.4 }}>
                {audit.topic}
              </div>

              {/* Item (in Blue, matching screenshot) */}
              <div style={{ color: '#64748B', fontWeight: 500 }}>Item</div>
              <div style={{ color: '#0284C7', fontWeight: 500, lineHeight: 1.5 }}>
                {audit.item || '-'}
              </div>

              {/* Clauses (in Blue, matching screenshot) */}
              <div style={{ color: '#64748B', fontWeight: 500 }}>Clauses</div>
              <div style={{ color: '#0284C7', fontWeight: 600 }}>
                {audit.clauses || '-'}
              </div>

              {/* Expected Evidence */}
              <div style={{ color: '#64748B', fontWeight: 500 }}>Expected Evidence</div>
              <div
                style={{
                  color: '#334155',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                }}
              >
                {audit.expectedEvidence || '-'}
              </div>

              {/* Approved by Lead IA */}
              <div style={{ color: '#64748B', fontWeight: 500 }}>Approved by Lead IA</div>
              <div>
                {audit.approvedByLeadIA ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={20} color="#16A34A" />
                    <span style={{ color: '#16A34A', fontWeight: 800, fontSize: '0.95rem' }}>
                      APPROVED
                    </span>
                    {audit.approvedByName && (
                      <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        (โดย {audit.approvedByName})
                      </span>
                    )}
                  </div>
                ) : audit.status === 'RETURNED_FOR_REVISION' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={18} color="#DC2626" />
                    <span style={{ color: '#DC2626', fontWeight: 700, fontSize: '0.9rem' }}>
                      ส่งกลับเพื่อแก้ไขแผนตรวจ
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={18} color="#D97706" />
                    <span style={{ color: '#D97706', fontWeight: 700, fontSize: '0.9rem' }}>
                      รอการอนุมัติก่อนเริ่มการตรวจ
                    </span>
                  </div>
                )}
              </div>

              {/* Findings */}
              <div style={{ color: '#64748B', fontWeight: 500 }}>Findings</div>
              <div
                style={{
                  color: '#1E293B',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  background: '#F8FAFC',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              >
                {audit.findings || '(ยังไม่มีการบันทึกข้อค้นพบ)'}
              </div>

              {/* Recommendation */}
              <div style={{ color: '#64748B', fontWeight: 500 }}>Recommendation</div>
              <div
                style={{
                  color: '#1E293B',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  background: '#F8FAFC',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              >
                {audit.recommendation || '-'}
              </div>

              {/* ประเภทความไม่สอดคล้องที่พบ (Result C, NC, OFI in blue bold) */}
              <div style={{ color: '#64748B', fontWeight: 500 }}>
                ประเภทความไม่สอดคล้องที่พบ
              </div>
              <div>
                {resultMeta ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: resultMeta.color,
                      }}
                    >
                      {resultMeta.code}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: resultMeta.bg,
                        color: resultMeta.color,
                        border: `1px solid ${resultMeta.border}`,
                        fontSize: '0.825rem',
                        fontWeight: 600,
                      }}
                    >
                      {resultMeta.shortLabel}
                    </span>
                  </div>
                ) : (
                  <span style={{ color: '#94A3B8' }}>- ยังไม่สรุปผล -</span>
                )}
              </div>
            </div>
          </div>

          {/* Return Comment Input Box (if Lead IA clicked "ส่งกลับเพื่อแก้ไข") */}
          {isReturnBoxOpen && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                borderRadius: '10px',
                background: '#FFFBEB',
                border: '1.5px solid #FDE68A',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#92400E',
                  marginBottom: '0.5rem',
                }}
              >
                ระบุข้อคิดเห็น / สิ่งที่ต้องการให้ผู้ตรวจแก้ไขเพิ่มเติม: <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                rows={3}
                value={revisionComment}
                onChange={(e) => setRevisionComment(e.target.value)}
                placeholder="เช่น กรุณาปรับปรุงรายละเอียดข้อตรวจ Item และระบุหลักฐานที่คาดหวังเพิ่มเติม..."
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #FCD34D',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  background: '#FFFFFF',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsReturnBoxOpen(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#D97706',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  ยืนยันส่งกลับเพื่อแก้ไข
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Lead IA Approval & Return Actions */}
            {!audit.approvedByLeadIA && (isLeadAuditor || isAdmin) && !isReturnBoxOpen && (
              <>
                <button
                  type="button"
                  onClick={() => onApprove && onApprove(audit.id)}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>อนุมัติแผนตรวจ (Approve)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsReturnBoxOpen(true)}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '8px',
                    border: '1px solid #FCA5A5',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>ส่งกลับเพื่อแก้ไข (Return)</span>
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Delete button (Lead IA or assigned auditor before approval) */}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(audit);
                }}
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: '8px',
                  border: '1px solid #FECACA',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={15} />
                <span>ลบรายงาน</span>
              </button>
            )}

            {/* Edit / Evaluate button (Authorized auditor or Lead IA) */}
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onEdit) onEdit(audit);
                }}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #0284C7',
                  background: '#F0F9FF',
                  color: '#0284C7',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Edit size={15} />
                <span>{audit.approvedByLeadIA ? 'ประเมินผล / แก้ไข' : 'แก้ไขแผนตรวจ'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

