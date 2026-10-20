'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  RotateCcw,
  Video,
  Building2,
} from 'lucide-react';
import { SHARING_STATUSES } from '@/lib/kmSharingService';

export default function KMSharingSummaryModal({
  isOpen,
  onClose,
  dimension = 'TOTAL', // 'TOTAL' | 'UPCOMING' | 'COMPLETED' | 'SPEAKERS' | 'TAGS'
  sessions = [],
  tags = [],
  onSelectSession,
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Reset date range filter when modal opens
  useEffect(() => {
    if (isOpen) {
      setStartDate('');
      setEndDate('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nowIso = new Date().toISOString().slice(0, 10);

  // Compute breakdown title depending on dimension
  let title = 'สรุปภาพรวมการแบ่งปันความรู้ (KM Sharing Summary)';

  if (dimension === 'TOTAL') {
    title = 'การบรรยายทั้งหมด (All Knowledge Sharing Sessions)';
  } else if (dimension === 'UPCOMING') {
    title = 'สรุปการบรรยายที่กำลังจะมาถึง (Upcoming Sessions)';
  } else if (dimension === 'COMPLETED') {
    title = 'สรุปการบรรยายที่เสร็จสิ้นแล้ว (Completed Sessions)';
  } else if (dimension === 'SPEAKERS') {
    title = 'สรุปทำเนียบผู้บรรยายและผู้แชร์ความรู้ (Speakers Directory)';
  } else if (dimension === 'TAGS') {
    title = 'สรุปการกระจายตัวตามหมวดหมู่แท็ก (Knowledge Tags Breakdown)';
  }

  // Filter sessions by date range if specified
  const dateFilteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (!s.date) return false;
      if (startDate && s.date < startDate) return false;
      if (endDate && s.date > endDate) return false;
      return true;
    });
  }, [sessions, startDate, endDate]);

  // Session list for TOTAL, UPCOMING, COMPLETED based on date-filtered sessions
  const filteredList = useMemo(() => {
    if (dimension === 'UPCOMING') {
      return dateFilteredSessions.filter((s) => s.status === 'SCHEDULED' || s.date >= nowIso);
    }
    if (dimension === 'COMPLETED') {
      return dateFilteredSessions.filter((s) => s.status === 'COMPLETED');
    }
    return dateFilteredSessions;
  }, [dimension, dateFilteredSessions, nowIso]);

  // Preset handlers
  const handlePreset = (presetKey) => {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();

    if (presetKey === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (presetKey === 'THIS_MONTH') {
      const firstDay = new Date(curYear, curMonth, 1).toISOString().slice(0, 10);
      const lastDay = new Date(curYear, curMonth + 1, 0).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (presetKey === 'NEXT_3_MONTHS') {
      const start = today.toISOString().slice(0, 10);
      const future = new Date(curYear, curMonth + 3, today.getDate());
      setStartDate(start);
      setEndDate(future.toISOString().slice(0, 10));
    } else if (presetKey === 'THIS_YEAR') {
      setStartDate(`${curYear}-01-01`);
      setEndDate(`${curYear}-12-31`);
    }
  };

  // Speakers aggregation based on date-filtered sessions
  const speakersList = useMemo(() => {
    const speakersMap = {};
    dateFilteredSessions.forEach((s) => {
      (s.speakers || []).forEach((spk) => {
        const key = spk.email || spk.name;
        if (!key) return;
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
    return Object.values(speakersMap).sort((a, b) => b.sessions.length - a.sessions.length);
  }, [dateFilteredSessions]);

  // Tags aggregation based on date-filtered sessions
  const tagsList = useMemo(() => {
    const tagsMap = {};
    dateFilteredSessions.forEach((s) => {
      (s.tags || []).forEach((t) => {
        if (!t) return;
        if (!tagsMap[t]) {
          tagsMap[t] = { count: 0, sessions: [] };
        }
        tagsMap[t].count += 1;
        tagsMap[t].sessions.push(s);
      });
    });
    return Object.entries(tagsMap)
      .map(([tagName, data]) => ({ tagName, count: data.count, sessions: data.sessions }))
      .sort((a, b) => b.count - a.count);
  }, [dateFilteredSessions]);

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
          {/* Shared Date Range Filter for all dimensions (Total, Upcoming, Completed, Speakers, Tags) */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 700, color: '#334155' }}>
                <Calendar size={15} color="#059669" />
                <span>กรองตามช่วงวันที่ (Date Range)</span>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handlePreset('ALL')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    border: '1px solid #CBD5E1',
                    background: !startDate && !endDate ? '#059669' : '#FFFFFF',
                    color: !startDate && !endDate ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('THIS_MONTH')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  เดือนนี้
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('NEXT_3_MONTHS')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  3 เดือนข้างหน้า
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('THIS_YEAR')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  ปีนี้
                </button>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      border: '1px solid #FECACA',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <RotateCcw size={11} />
                    <span>ล้างตัวกรอง</span>
                  </button>
                )}
              </div>
            </div>

            {/* Date Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '3px' }}>
                  ตั้งแต่วันที่
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                    background: '#FFFFFF',
                    color: '#1E293B',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '3px' }}>
                  ถึงวันที่
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                    background: '#FFFFFF',
                    color: '#1E293B',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Dimension 1: Speakers Directory View */}
          {dimension === 'SPEAKERS' ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '4px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                  รายชื่อบุคลากรผู้ร่วมแบ่งปันความรู้ ({speakersList.length} ท่าน
                  {(startDate || endDate) && (
                    <span style={{ color: '#059669', marginLeft: '4px', fontWeight: 600, fontSize: '0.775rem' }}>
                      • จากช่วง {startDate || 'เริ่มต้น'} ถึง {endDate || 'ปัจจุบัน/อนาคต'}
                    </span>
                  )}
                  )
                </div>
              </div>

              {speakersList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94A3B8', fontSize: '0.875rem', background: '#F8FAFC', borderRadius: '12px' }}>
                  ไม่พบข้อมูลผู้บรรยายตามเงื่อนไขช่วงวันที่ที่เลือก
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {speakersList.map((spk, idx) => (
                    <div
                      key={spk.email || spk.name || idx}
                      style={{
                        borderRadius: '16px',
                        background: '#FFFFFF',
                        border: '1.5px solid #E2E8F0',
                        overflow: 'hidden',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Speaker Profile Header Bar */}
                      <div
                        style={{
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px',
                          background: '#F8FAFC',
                          borderBottom: spk.sessions.length > 0 ? '1px solid #E2E8F0' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                              color: '#059669',
                              fontWeight: 800,
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #A7F3D0',
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>{spk.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              {spk.position ? `${spk.position} • ` : ''}{spk.department || '-'}
                            </div>
                          </div>
                        </div>

                        {/* Interactive "การบรรยาย" Badge Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (spk.sessions && spk.sessions.length > 0 && onSelectSession) {
                              onSelectSession(spk.sessions[0]);
                              onClose();
                            }
                          }}
                          title="คลิกเพื่อเปิดดูรายละเอียดการบรรยาย"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#ECFDF5',
                            color: '#059669',
                            padding: '5px 12px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            border: '1.5px solid #A7F3D0',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(5, 150, 105, 0.08)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#059669';
                            e.currentTarget.style.color = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ECFDF5';
                            e.currentTarget.style.color = '#059669';
                            e.currentTarget.style.borderColor = '#A7F3D0';
                          }}
                        >
                          <BookOpen size={13} />
                          <span>{spk.sessions.length} การบรรยาย</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>

                      {/* Display หัวข้อบรรยาย (Lecture Topics list) */}
                      {spk.sessions && spk.sessions.length > 0 && (
                        <div style={{ padding: '10px 14px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>หัวข้อการบรรยาย ({spk.sessions.length} รายการ):</span>
                            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>คลิกหัวข้อเพื่อเปิดหน้าต่างรายละเอียด</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {spk.sessions.map((sess) => {
                              const isOnline = sess.locationType === 'ONLINE' || Boolean(sess.meetUrl);

                              return (
                                <div
                                  key={sess.id}
                                  onClick={() => {
                                    if (onSelectSession) onSelectSession(sess);
                                    onClose();
                                  }}
                                  style={{
                                    padding: '9px 12px',
                                    borderRadius: '10px',
                                    background: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '10px',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#ECFDF5';
                                    e.currentTarget.style.borderColor = '#A7F3D0';
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#F8FAFC';
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                    e.currentTarget.style.transform = 'none';
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                                      <span
                                        style={{
                                          background: isOnline ? '#E0F2FE' : '#ECFDF5',
                                          color: isOnline ? '#0369A1' : '#047857',
                                          border: `1px solid ${isOnline ? '#BAE6FD' : '#A7F3D0'}`,
                                          padding: '1px 7px',
                                          borderRadius: '999px',
                                          fontSize: '0.68rem',
                                          fontWeight: 700,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px',
                                        }}
                                      >
                                        {isOnline ? <Video size={10} /> : <Building2 size={10} />}
                                        <span>{isOnline ? 'Online' : 'Onsite'}</span>
                                      </span>

                                      <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                        <Calendar size={11} />
                                        <span>{sess.date} ({sess.startTime} - {sess.endTime} น.)</span>
                                      </span>
                                    </div>

                                    <div
                                      style={{
                                        fontSize: '0.84rem',
                                        fontWeight: 700,
                                        color: '#0F172A',
                                        lineHeight: 1.35,
                                      }}
                                    >
                                      {sess.topic}
                                    </div>

                                    {(sess.tags || []).length > 0 && (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                        {(sess.tags || []).map((t) => (
                                          <span
                                            key={t}
                                            style={{
                                              fontSize: '0.68rem',
                                              color: '#059669',
                                              background: '#FFFFFF',
                                              border: '1px solid #DCFCE7',
                                              padding: '1px 6px',
                                              borderRadius: '4px',
                                              fontWeight: 600,
                                            }}
                                          >
                                            #{t}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      color: '#059669',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      flexShrink: 0,
                                    }}
                                  >
                                    <span>เปิดดู</span>
                                    <ChevronRight size={14} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : dimension === 'TAGS' ? (
            /* Dimension 2: Tags Distribution */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '4px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                  การกระจายตัวตามหมวดหมู่แท็กองค์ความรู้ ({tagsList.length} หมวดหมู่
                  {(startDate || endDate) && (
                    <span style={{ color: '#059669', marginLeft: '4px', fontWeight: 600, fontSize: '0.775rem' }}>
                      • จากช่วง {startDate || 'เริ่มต้น'} ถึง {endDate || 'ปัจจุบัน/อนาคต'}
                    </span>
                  )}
                  )
                </div>
              </div>

              {tagsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94A3B8', fontSize: '0.875rem', background: '#F8FAFC', borderRadius: '12px' }}>
                  ไม่พบข้อมูลแท็กตามเงื่อนไขช่วงวันที่ที่เลือก
                </div>
              ) : (
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
              )}
            </div>
          ) : (
            /* Dimension 3: Session list for TOTAL, UPCOMING, COMPLETED */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Session List Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                  รายการการบรรยาย ({filteredList.length} รายการ
                  {(startDate || endDate) && (
                    <span style={{ color: '#059669', marginLeft: '4px', fontWeight: 600, fontSize: '0.775rem' }}>
                      • จากช่วง {startDate || 'เริ่มต้น'} ถึง {endDate || 'ปัจจุบัน/อนาคต'}
                    </span>
                  )}
                  )
                </span>
              </div>

              {/* Sessions */}
              {filteredList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94A3B8', fontSize: '0.875rem', background: '#F8FAFC', borderRadius: '12px' }}>
                  ไม่พบรายการการบรรยายตามเงื่อนไขช่วงวันที่ที่เลือก
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredList.map((s) => {
                    const st = SHARING_STATUSES[s.status] || SHARING_STATUSES.SCHEDULED;
                    const isOnline = s.locationType === 'ONLINE' || Boolean(s.meetUrl);

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
                            {/* Location Badge */}
                            {isOnline ? (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  background: '#EFF6FF',
                                  color: '#1D4ED8',
                                  border: '1px solid #BFDBFE',
                                  padding: '1px 7px',
                                  borderRadius: '999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Video size={10} />
                                <span>Google Meet</span>
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  background: '#F8FAFC',
                                  color: '#334155',
                                  border: '1px solid #CBD5E1',
                                  padding: '1px 7px',
                                  borderRadius: '999px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Building2 size={10} />
                                <span>{s.roomNumber || s.location || 'Onsite'}</span>
                              </span>
                            )}

                            {/* Status Badge */}
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: st.bgColor,
                                color: st.color,
                                padding: '1px 7px',
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

                          {s.tags && s.tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                              {s.tags.map((t) => (
                                <span
                                  key={t}
                                  style={{
                                    fontSize: '0.675rem',
                                    fontWeight: 600,
                                    background: '#FEF3C7',
                                    color: '#B45309',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                  }}
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
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
