'use client';

import React from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  Building,
  MapPin,
  Users,
  Coins,
  FileText,
  ExternalLink,
  Edit,
  Trash2,
  Clock,
  AlertTriangle,
  Sparkles,
  Link as LinkIcon,
  Printer,
  BellRing,
} from 'lucide-react';
import { formatDateDDMMYYYYBE, formatThaiDisplayDate } from '@/lib/dateUtils';
import { calculateKmNotificationStatus, KM_STATUSES } from '@/lib/kmHubService';

export default function KMDetailModal({
  isOpen,
  onClose,
  record = null,
  isAdmin = false,
  onEdit,
  onDelete,
}) {
  if (!isOpen || !record) return null;

  const tracking = calculateKmNotificationStatus(record);
  const statusCfg = KM_STATUSES[record.status] || KM_STATUSES.PENDING;

  return (
    <div className="modal-overlay" style={{ zIndex: 10400 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '94vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Top Header Controls */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '20px',
                background: statusCfg.bgColor,
                color: statusCfg.color,
                border: `1px solid ${statusCfg.borderColor}`,
              }}
            >
              {statusCfg.label}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
              ปีงบประมาณ {record.fiscalYear}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAdmin && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(record);
                }}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.775rem',
                  padding: '4px 10px',
                  color: '#047857',
                  borderColor: '#A7F3D0',
                }}
              >
                <Edit size={14} />
                <span>แก้ไข</span>
              </button>
            )}

            {isAdmin && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(record);
                }}
                className="btn btn-ghost btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.775rem',
                  padding: '4px 10px',
                  color: '#DC2626',
                }}
              >
                <Trash2 size={14} />
                <span>ลบ</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                color: '#64748B',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem',
            background: '#FFFFFF',
          }}
        >
          {/* Main Title Section Styled matching user attachment */}
          <div style={{ marginBottom: '1.75rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <CheckCircle2
                size={34}
                style={{
                  color: '#16A34A',
                  flexShrink: 0,
                  marginTop: '4px',
                }}
              />
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#15803D',
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em',
                }}
              >
                {record.courseTitle}
              </h2>
            </div>
          </div>

          {/* 2-Months / 15-Days Periodic Notification Status Banner */}
          <div
            style={{
              marginBottom: '1.75rem',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              background: tracking.badgeBg,
              border: `1.5px solid ${tracking.badgeColor}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: tracking.badgeColor,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {tracking.isCompleted ? (
                  <CheckCircle2 size={18} />
                ) : tracking.isOverdue ? (
                  <AlertTriangle size={18} />
                ) : (
                  <BellRing size={18} />
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: tracking.badgeColor }}>
                  {tracking.statusMessage}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                  {tracking.isCompleted
                    ? `ดำเนินการแบ่งปันเสร็จสิ้นเมื่อ ${record.completedDate ? formatDateDDMMYYYYBE(record.completedDate) : '-'}`
                    : tracking.isOverdue
                    ? `ครบกำหนดแบ่งปันความรู้ 2 เดือนเมื่อ ${formatDateDDMMYYYYBE(tracking.deadlineDateStr)} (ระบบแจ้งเตือนทุก 15 วัน)`
                    : `กรอบเวลาแบ่งปันความรู้ภายใน 2 เดือน: ครบกำหนดวันที่ ${formatDateDDMMYYYYBE(tracking.deadlineDateStr)}`}
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#FFFFFF',
                color: tracking.badgeColor,
                border: `1px solid ${tracking.badgeColor}44`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              {tracking.isCompleted
                ? '✅ เสร็จสิ้น'
                : tracking.isOverdue
                ? `แจ้งเตือนรอบที่ ${tracking.notificationCycle}`
                : `เหลือ ${tracking.daysRemaining} วัน`}
            </span>
          </div>

          {/* Details Key-Value List matching screenshot structure */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.15rem',
              fontSize: '0.95rem',
              color: '#1E293B',
            }}
          >
            {/* Row 1: Fiscal Year */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'baseline', gap: '1rem' }}>
              <div style={{ color: '#475569', fontWeight: 600 }}>ปีงบประมาณ</div>
              <div style={{ fontWeight: 700 }}>{record.fiscalYear}</div>
            </div>

            {/* Row 2: Attendees */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ color: '#475569', fontWeight: 600 }}>รายชื่อผู้เข้าอบรม</div>
              <div>
                {Array.isArray(record.attendees) && record.attendees.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {record.attendees.map((p, idx) => (
                      <span
                        key={p.id || p.email || idx}
                        style={{
                          fontWeight: 700,
                          color: '#0F172A',
                        }}
                      >
                        {p.name}
                        {idx < record.attendees.length - 1 ? ' , ' : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#94A3B8' }}>-</span>
                )}
              </div>
            </div>

            {/* Row 3: Organizer */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'baseline', gap: '1rem' }}>
              <div style={{ color: '#475569', fontWeight: 600 }}>หน่วยงานที่จัด</div>
              <div style={{ fontWeight: 600 }}>{record.organizer || '-'}</div>
            </div>

            {/* Row 4: Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'baseline', gap: '1rem' }}>
              <div style={{ color: '#475569', fontWeight: 600 }}>สถานที่จัด</div>
              <div style={{ fontWeight: 600 }}>{record.location || '-'}</div>
            </div>

            {/* Row 5: Start Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'baseline', gap: '1rem' }}>
              <div style={{ color: '#475569', fontWeight: 600 }}>เริ่มตั้งแต่วัน/เดือน/ปี</div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>
                {record.startDate ? formatDateDDMMYYYYBE(record.startDate) : '-'}
              </div>
            </div>

            {/* Row 6: End Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'baseline', gap: '1rem' }}>
              <div style={{ color: '#475569', fontWeight: 600 }}>ถึงวันที่ วัน/เดือน/ปี</div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>
                {record.endDate ? formatDateDDMMYYYYBE(record.endDate) : '-'}
              </div>
            </div>

            {/* Row 7: Budget */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: '#475569', fontWeight: 600 }}>งบประมาณที่ขอ</div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#16A34A',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                }}
              >
                <span>💰</span>
                <span>
                  {record.budget !== undefined && record.budget !== null
                    ? Number(record.budget).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : '0.00'}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#16A34A' }}>บาท</span>
              </div>
            </div>

            {/* Row 8: Knowledge Sharing Methods */}
            <div
              style={{
                marginTop: '0.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid #E2E8F0',
                display: 'grid',
                gridTemplateColumns: '180px 1fr',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
            >
              <div style={{ color: '#475569', fontWeight: 700 }}>องค์ความรู้ที่ทำการแบ่งปัน</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {record.sharingMethods?.summaryReport && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#166534',
                    }}
                  >
                    <CheckCircle2 size={16} color="#16A34A" />
                    <span>รายงานสรุปประมวลความรู้ (Knowledge Summary Report)</span>
                  </div>
                )}

                {record.sharingMethods?.smallGroupLecture && (
                  <div
                    style={{
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: '#166534',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      <CheckCircle2 size={16} color="#16A34A" />
                      <span>บรรยายกลุ่มย่อย (Small Group Session)</span>
                    </div>
                    {record.sharingMethods.lectureDateTime && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#047857',
                          marginTop: '4px',
                          paddingLeft: '24px',
                          fontWeight: 600,
                        }}
                      >
                        🕒 วันเวลา: {record.sharingMethods.lectureDateTime}
                      </div>
                    )}
                  </div>
                )}

                {record.sharingMethods?.otherMethod && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#334155',
                    }}
                  >
                    <span>💡</span>
                    <span>{record.sharingMethods.otherMethod}</span>
                  </div>
                )}

                {!record.sharingMethods?.summaryReport &&
                  !record.sharingMethods?.smallGroupLecture &&
                  !record.sharingMethods?.otherMethod && (
                    <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>ยังไม่ได้ระบุรูปแบบการแบ่งปันความรู้</div>
                  )}
              </div>
            </div>

            {/* Row 9: Attached Document Links */}
            <div
              style={{
                paddingTop: '1.25rem',
                borderTop: '1px solid #E2E8F0',
                display: 'grid',
                gridTemplateColumns: '180px 1fr',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
            >
              <div style={{ color: '#475569', fontWeight: 700 }}>ลิงก์เอกสารแนบ</div>
              <div>
                {Array.isArray(record.documentUrls) && record.documentUrls.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {record.documentUrls.map((docItem, idx) => {
                      const url = typeof docItem === 'string' ? docItem : docItem.url;
                      const title = typeof docItem === 'string' ? `เอกสารแนบที่ ${idx + 1}` : docItem.title || url;
                      if (!url) return null;
                      return (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '0.5rem 0.85rem',
                            borderRadius: '8px',
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            textDecoration: 'none',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <FileText size={15} color="#2563EB" />
                          <span>{title}</span>
                          <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>ไม่มีเอกสารแนบ</span>
                )}
              </div>
            </div>

            {/* Notes if any */}
            {record.notes && (
              <div
                style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid #E2E8F0',
                  fontSize: '0.85rem',
                  color: '#64748B',
                }}
              >
                <strong style={{ color: '#334155' }}>หมายเหตุ:</strong> {record.notes}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            บันทึกข้อมูลเมื่อ {formatDateDDMMYYYYBE(record.createdAt?.split('T')[0] || '')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
              border: 'none',
              padding: '0.5rem 1.5rem',
              fontWeight: 700,
              fontSize: '0.875rem',
            }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
