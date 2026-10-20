'use client';

import React from 'react';
import {
  X,
  BarChart2,
  Calendar,
  Clock,
  Users,
  Tag,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Filter,
} from 'lucide-react';
import { SHARING_STATUSES, SHARING_FORMATS } from '@/lib/kmSharingService';

export default function KMSharingSummaryModal({
  isOpen,
  onClose,
  dimension = 'TOTAL', // 'TOTAL' | 'UPCOMING' | 'COMPLETED' | 'SPEAKERS' | 'TAGS'
  sessions = [],
  tags = [],
  onSelectSession,
}) {
  if (!isOpen) return null;

  const nowIso = new Date().toISOString().slice(0, 10);

  // Compute breakdown data depending on dimension
  let title = 'สรุปภาพรวมการแบ่งปันความรู้ (KM Sharing Summary)';
  let filteredList = [...sessions];

  if (dimension === 'UPCOMING') {
    title = 'สรุปการบรรยายที่กำลังจะมาถึง (Upcoming Sessions)';
    filteredList = sessions.filter(
      (s) => s.status === 'SCHEDULED' || s.date >= nowIso
    );
  } else if (dimension === 'COMPLETED') {
    title = 'สรุปการบรรยายที่เสร็จสิ้นแล้ว (Completed Sessions)';
    filteredList = sessions.filter((s) => s.status === 'COMPLETED');
  } else if (dimension === 'SPEAKERS') {
    title = 'สรุปทำเนียบผู้บรรยายและผู้แชร์ความรู้ (Speakers Directory)';
  } else if (dimension === 'TAGS') {
    title = 'สรุปการกระจายตัวตามหมวดหมู่แท็ก (Knowledge Tags Breakdown)';
  }

  // Speakers aggregation
  const speakersMap = {};
  sessions.forEach((s) => {
    (s.speakers || []).forEach((spk) => {
      const key = spk.email || spk.name;
      if (!speakersMap[key]) {
        speakersMap[key] = {
          name: spk.name,
          email: spk.email,
          department: spk.department,
          position: spk.position,
          sessions: [],
        };
      }
      speakersMap[key].sessions.push(s);
    });
  });
  const speakersList = Object.values(speakersMap).sort(
    (a, b) => b.sessions.length - a.sessions.length
  );

  // Tags aggregation
  const tagsMap = {};
  sessions.forEach((s) => {
    (s.tags || []).forEach((t) => {
      tagsMap[t] = (tagsMap[t] || 0) + 1;
    });
  });
  const tagsList = Object.entries(tagsMap)
    .map(([tagName, count]) => ({ tagName, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="card-glass"
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart2 size={18} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#D1FAE5' }}>
                ข้อมูลสรุปภาพรวมจากระบบแบ่งปันความรู้ (KM Hub)
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
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ overflowY: 'auto', padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Dimension 1: Speakers Directory View */}
          {dimension === 'SPEAKERS' ? (
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.75rem' }}>
                รายชื่อบุคลากรผู้ร่วมแบ่งปันความรู้ ({speakersList.length} ท่าน)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {speakersList.map((spk, idx) => (
                  <div
                    key={spk.email || spk.name || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: '#ECFDF5',
                          color: '#059669',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>{spk.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {spk.position ? `${spk.position} • ` : ''}{spk.department || '-'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          background: '#ECFDF5',
                          color: '#059669',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          border: '1px solid #A7F3D0',
                        }}
                      >
                        {spk.sessions.length} การบรรยาย
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : dimension === 'TAGS' ? (
            /* Dimension 2: Tags Distribution */
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.75rem' }}>
                การกระจายตัวตามหมวดหมู่แท็กองค์ความรู้ ({tagsList.length} หมวดหมู่)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {tagsList.map((item) => (
                  <div
                    key={item.tagName}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#B45309' }}>
                      #{item.tagName}
                    </span>
                    <span
                      style={{
                        background: '#F59E0B',
                        color: '#FFFFFF',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {item.count} ครั้ง
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Dimension 3: Session list for TOTAL, UPCOMING, COMPLETED */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                  รายการการบรรยาย ({filteredList.length} รายการ)
                </span>
              </div>

              {filteredList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.875rem' }}>
                  ไม่พบรายการการบรรยายในหมวดหมู่นี้
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredList.map((s) => {
                    const st = SHARING_STATUSES[s.status] || SHARING_STATUSES.SCHEDULED;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          if (onSelectSession) onSelectSession(s);
                          onClose();
                        }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: '#FFFFFF',
                          border: '1.5px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#10B981';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E2E8F0';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: st.bgColor,
                                color: st.color,
                                padding: '2px 8px',
                                borderRadius: '999px',
                              }}
                            >
                              {st.badgeText}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                              📅 {s.date} ({s.startTime} - {s.endTime} น.)
                            </span>
                          </div>

                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                            {s.topic}
                          </div>

                          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
                            🎤 ผู้บรรยาย: {(s.speakers || []).map((sp) => sp.name).join(', ') || '-'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.8rem', fontWeight: 700 }}>
                          <span>ดูรายละเอียด</span>
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
