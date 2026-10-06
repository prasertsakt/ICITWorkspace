'use client';

import React, { useState } from 'react';
import {
  X,
  BellRing,
  AlertTriangle,
  Clock,
  Send,
  CheckCircle2,
  Users,
  Calendar,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { formatDateDDMMYYYYBE } from '@/lib/dateUtils';
import { calculateKmNotificationStatus } from '@/lib/kmHubService';
import { useModal } from '@/context/ModalContext';

export default function KMReminderModal({
  isOpen,
  onClose,
  records = [],
  currentUser,
  currentPersonnel,
}) {
  const [isSending, setIsSending] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const { showAlert } = useModal();

  if (!isOpen) return null;

  // Filter pending or overdue records
  const pendingRecords = records.filter((r) => r.status !== 'COMPLETED').map((r) => ({
    ...r,
    tracking: calculateKmNotificationStatus(r),
  }));

  const overdueRecords = pendingRecords.filter((r) => r.tracking.isOverdue);
  const nearDueRecords = pendingRecords.filter((r) => !r.tracking.isOverdue && r.tracking.daysRemaining <= 30);

  const toggleSelect = (id) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedItemIds.size === pendingRecords.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(pendingRecords.map((r) => r.id)));
    }
  };

  const handleSendReminders = async () => {
    const targetItems = pendingRecords.filter((r) => selectedItemIds.has(r.id));
    if (targetItems.length === 0) {
      await showAlert({
        type: 'warning',
        title: 'ยังไม่ได้เลือกรายการ',
        message: 'กรุณาเลือกรายการการอบรมที่ต้องการส่งการแจ้งเตือนอย่างน้อย 1 รายการ',
      });
      return;
    }

    setIsSending(true);
    try {
      // Send reminder notifications for each selected item
      for (const item of targetItems) {
        const attendeeEmails = (item.attendees || []).map((a) => a.email).filter(Boolean);
        if (attendeeEmails.length > 0) {
          try {
            await fetch('/api/email/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: attendeeEmails,
                subject: `[แจ้งเตือนการแบ่งปันองค์ความรู้] หลักสูตร: ${item.courseTitle}`,
                message: `เรียน ผู้เข้าอบรม\n\nระบบขอแจ้งเตือนให้ท่านดำเนินการแบ่งปันองค์ความรู้จากการอบรมหลักสูตร "${item.courseTitle}" (วันที่อบรม: ${formatDateDDMMYYYYBE(item.startDate)} - ${formatDateDDMMYYYYBE(item.endDate)})\n\nสถานะการติดตาม: ${item.tracking.statusMessage}\n\nกรุณาดำเนินการจัดทำรายงานสรุปความรู้ หรือบรรยายกลุ่มย่อย และอัปเดตสถานะในระบบ KM Hub\n\nสำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)`,
              }),
            });
          } catch (err) {
            console.warn('Send email reminder failed:', err);
          }
        }
      }

      await showAlert({
        type: 'success',
        title: 'ส่งการแจ้งเตือนสำเร็จ',
        message: `ส่งการแจ้งเตือนการแบ่งปันองค์ความรู้สำหรับ ${targetItems.length} หลักสูตร ไปยังอีเมลของผู้เข้าอบรมเรียบร้อยแล้ว`,
      });
      onClose();
    } catch (e) {
      console.error(e);
      await showAlert({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถส่งอีเมลแจ้งเตือนได้ในขณะนี้',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10600 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '740px',
          width: '94vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #EA580C 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              <BellRing size={20} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                ศูนย์ติดตามและแจ้งเตือนการแบ่งปันองค์ความรู้
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>
                ติดตามกรอบเวลา 2 เดือนหลังวันอบรม และระบบแจ้งเตือนเป็นระยะทุก ๆ 15 วัน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Summary Metric Pills */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#FFF7ED',
            borderBottom: '1px solid #FED7AA',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              border: '1px solid #FED7AA',
            }}
          >
            <div style={{ fontSize: '0.725rem', color: '#9A3412', fontWeight: 700 }}>รอดำเนินการทั้งหมด</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#C2410C' }}>
              {pendingRecords.length} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>หลักสูตร</span>
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              border: '1.5px solid #FCA5A5',
            }}
          >
            <div style={{ fontSize: '0.725rem', color: '#991B1B', fontWeight: 700 }}>⚠️ เกินกำหนด 2 เดือน</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>
              {overdueRecords.length} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>หลักสูตร</span>
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              border: '1px solid #FED7AA',
            }}
          >
            <div style={{ fontSize: '0.725rem', color: '#B45309', fontWeight: 700 }}>⏳ ใกล้ครบกำหนด (&le; 30 วัน)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706' }}>
              {nearDueRecords.length} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>หลักสูตร</span>
            </div>
          </div>
        </div>

        {/* List of items needing reminder */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {pendingRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#15803D' }}>
              <CheckCircle2 size={44} color="#16A34A" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>ยอดเยี่ยม! ไม่มีรายการค้างแบ่งปันความรู้</div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                บุคลากรทุกท่านดำเนินการแบ่งปันองค์ความรู้ครบถ้วนสมบูรณ์แล้ว
              </div>
            </div>
          ) : (
            pendingRecords.map((item) => {
              const isChecked = selectedItemIds.has(item.id);
              const trk = item.tracking;

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: isChecked
                      ? '2px solid #EA580C'
                      : trk.isOverdue
                      ? '1.5px solid #FECACA'
                      : '1px solid #E2E8F0',
                    background: isChecked ? '#FFF7ED' : trk.isOverdue ? '#FEF2F2' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{
                      accentColor: '#EA580C',
                      width: '18px',
                      height: '18px',
                      marginTop: '4px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: '#1E293B',
                        }}
                      >
                        {item.courseTitle}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: trk.badgeBg,
                          color: trk.badgeColor,
                          border: `1px solid ${trk.badgeColor}33`,
                        }}
                      >
                        {trk.statusMessage}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.78rem',
                        color: '#64748B',
                        marginTop: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> วันที่อบรม: {formatDateDDMMYYYYBE(item.startDate)} - {formatDateDDMMYYYYBE(item.endDate)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={13} /> ผู้เข้าอบรม: {(item.attendees || []).map((a) => a.name).join(', ') || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
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
          {pendingRecords.length > 0 ? (
            <button
              type="button"
              onClick={handleSelectAll}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.8rem', color: '#EA580C', fontWeight: 600 }}
            >
              {selectedItemIds.size === pendingRecords.length ? 'ยกเลิกการเลือกทั้งหมด' : 'เลือกทั้งหมด'}
            </button>
          ) : (
            <span />
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              ปิด
            </button>
            {pendingRecords.length > 0 && (
              <button
                type="button"
                onClick={handleSendReminders}
                disabled={isSending || selectedItemIds.size === 0}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #DC2626 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  opacity: selectedItemIds.size === 0 ? 0.6 : 1,
                  cursor: selectedItemIds.size === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>กำลังส่งอีเมลแจ้งเตือน...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>ส่งอีเมลแจ้งเตือน ({selectedItemIds.size})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
