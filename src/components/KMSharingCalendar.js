'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Users,
  Clock,
  MapPin,
  Tag,
  List,
  CalendarDays,
  Plus,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Video,
  Building2,
} from 'lucide-react';
import { SHARING_STATUSES } from '@/lib/kmSharingService';
import { MAIN_6_DEPTS } from '@/lib/constants';

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export default function KMSharingCalendar({
  sessions = [],
  tags = [],
  onSelectSession,
  onOpenCreateModal,
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const thaiYear = year + 543;

  // Month Navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mTopic = (s.topic || '').toLowerCase().includes(q);
        const mOverview = (s.overview || '').toLowerCase().includes(q);
        const mLoc = (s.location || '').toLowerCase().includes(q);
        const mSpeakers = (s.speakers || []).some(
          (sp) => (sp.name || '').toLowerCase().includes(q) || (sp.email || '').toLowerCase().includes(q)
        );
        if (!mTopic && !mOverview && !mLoc && !mSpeakers) return false;
      }

      // Tag Filter
      if (selectedTag !== 'ALL') {
        if (!(s.tags || []).includes(selectedTag)) return false;
      }

      // Department Filter (Check if any speaker belongs to this dept)
      if (selectedDept !== 'ALL') {
        const hasDeptSpeaker = (s.speakers || []).some((sp) => sp.department === selectedDept);
        if (!hasDeptSpeaker) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL') {
        if (s.status !== statusFilter) return false;
      }

      return true;
    });
  }, [sessions, searchQuery, selectedTag, selectedDept, statusFilter]);

  // Calendar Grid Cells Computation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = totalDaysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const iso = prevDate.toISOString().slice(0, 10);
      days.push({
        dateNumber: dayNum,
        dateIso: iso,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    const todayIso = new Date().toISOString().slice(0, 10);
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateNumber: i,
        dateIso: iso,
        isCurrentMonth: true,
        isToday: iso === todayIso,
      });
    }

    // Next month padding (make full 35 or 42 cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const iso = nextDate.toISOString().slice(0, 10);
      days.push({
        dateNumber: i,
        dateIso: iso,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [year, month]);

  // Map sessions by date ISO
  const sessionsByDate = useMemo(() => {
    const map = {};
    filteredSessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [filteredSessions]);

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        border: '1.5px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Calendar Header Toolbar */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#F8FAFC',
        }}
      >
        {/* Month Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="เดือนถัดไป"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #A7F3D0',
              background: '#ECFDF5',
              color: '#059669',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            วันนี้
          </button>

          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            {THAI_MONTHS[month]} {thaiYear}
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500, marginLeft: '8px' }}>
              ({currentDate.toLocaleString('default', { month: 'long' })} {year})
            </span>
          </h2>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              background: '#E2E8F0',
              borderRadius: '10px',
              padding: '3px',
              gap: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'grid' ? '#0F172A' : '#64748B',
                fontWeight: viewMode === 'grid' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <CalendarDays size={15} />
              <span>ปฏิทิน</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'list' ? '#0F172A' : '#64748B',
                fontWeight: viewMode === 'list' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <List size={15} />
              <span>รายการ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          padding: '0.85rem 1.5rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          background: '#FFFFFF',
        }}
      >
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            padding: '5px 10px',
            gap: '6px',
            flex: '1 1 200px',
            maxWidth: '320px',
          }}
        >
          <Search size={15} color="#94A3B8" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาหัวข้อ, ผู้บรรยาย, รายละเอียด..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.825rem',
              width: '100%',
              color: '#1E293B',
            }}
          />
        </div>

        {/* Tag filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Tag size={14} color="#64748B" />
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.8rem',
              outline: 'none',
              background: '#FFFFFF',
              color: '#334155',
            }}
          >
            <option value="ALL">หมวดหมู่แท็กทั้งหมด</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        </div>

        {/* Department filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} color="#64748B" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.8rem',
              outline: 'none',
              background: '#FFFFFF',
              color: '#334155',
            }}
          >
            <option value="ALL">ทุกฝ่ายงาน</option>
            {MAIN_6_DEPTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.8rem',
              outline: 'none',
              background: '#FFFFFF',
              color: '#334155',
            }}
          >
            <option value="ALL">สถานะทั้งหมด</option>
            <option value="SCHEDULED">จองแล้ว/รอจัด</option>
            <option value="COMPLETED">บรรยายเสร็จสิ้น</option>
          </select>
        </div>

        {/* Reset filter button if any active */}
        {(searchQuery || selectedTag !== 'ALL' || selectedDept !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedTag('ALL');
              setSelectedDept('ALL');
              setStatusFilter('ALL');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#DC2626',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {viewMode === 'grid' ? (
        /* Calendar Grid View */
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <div style={{ minWidth: '700px' }}>
            {/* Weekday headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                background: '#F1F5F9',
                borderBottom: '1px solid #E2E8F0',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: '#475569',
              }}
            >
              {WEEKDAYS.map((wd, idx) => (
                <div
                  key={wd}
                  style={{
                    padding: '8px 0',
                    color: idx === 0 ? '#DC2626' : idx === 6 ? '#2563EB' : '#475569',
                  }}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gridAutoRows: 'minmax(110px, auto)',
              }}
            >
              {calendarDays.map((day, idx) => {
                const daySessions = sessionsByDate[day.dateIso] || [];

                return (
                  <div
                    key={`${day.dateIso}-${idx}`}
                    style={{
                      borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #F1F5F9',
                      borderBottom: '1px solid #F1F5F9',
                      padding: '6px',
                      background: !day.isCurrentMonth
                        ? '#FBFBFB'
                        : day.isToday
                        ? '#FEFCE8'
                        : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      position: 'relative',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* Day number bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '2px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: day.isToday ? 800 : 600,
                          color: day.isToday
                            ? '#D97706'
                            : !day.isCurrentMonth
                            ? '#CBD5E1'
                            : '#334155',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: day.isToday ? '#FEF3C7' : 'transparent',
                        }}
                      >
                        {day.dateNumber}
                      </span>

                      {/* Quick Add icon on hover / empty day */}
                      {day.isCurrentMonth && onOpenCreateModal && (
                        <button
                          type="button"
                          onClick={() => onOpenCreateModal(day.dateIso)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: '2px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.6,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#059669';
                            e.currentTarget.style.opacity = 1;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#94A3B8';
                            e.currentTarget.style.opacity = 0.6;
                          }}
                          title={`จองบรรยายวันที่ ${day.dateIso}`}
                        >
                          <Plus size={13} />
                        </button>
                      )}
                    </div>

                    {/* Sessions list in this day */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      {daySessions.map((s) => {
                        const isDone = s.status === 'COMPLETED';

                        return (
                          <div
                            key={s.id}
                            onClick={() => onSelectSession(s)}
                            style={{
                              background: isDone ? '#ECFDF5' : '#EFF6FF',
                              border: `1px solid ${isDone ? '#A7F3D0' : '#BFDBFE'}`,
                              borderRadius: '6px',
                              padding: '4px 6px',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                            }}
                            title={`${s.topic}\nผู้บรรยาย: ${(s.speakers || []).map((sp) => sp.name).join(', ')}\nเวลา: ${s.startTime}-${s.endTime}`}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '4px',
                                fontSize: '0.68rem',
                                color: isDone ? '#047857' : '#1D4ED8',
                                fontWeight: 700,
                                marginBottom: '2px',
                              }}
                            >
                              <span>🕒 {s.startTime}</span>
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  color: s.locationType === 'ONLINE' ? '#2563EB' : '#475569',
                                  background: s.locationType === 'ONLINE' ? '#DBEAFE' : '#F1F5F9',
                                  padding: '1px 4px',
                                  borderRadius: '4px',
                                }}
                              >
                                {s.locationType === 'ONLINE' ? '🌐 Meet' : `🏢 ${s.roomNumber || 'Onsite'}`}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: '#0F172A',
                                lineHeight: 1.25,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {s.topic}
                            </div>

                            <div
                              style={{
                                fontSize: '0.675rem',
                                color: '#64748B',
                                marginTop: '2px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              🎤 {(s.speakers || []).map((sp) => sp.name).join(', ')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* List / Agenda View */
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: '0.9rem' }}>
              ไม่พบการบรรยายตามเงื่อนไขที่เลือก
            </div>
          ) : (
            filteredSessions.map((s) => {
              const st = SHARING_STATUSES[s.status] || SHARING_STATUSES.SCHEDULED;

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectSession(s)}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '14px',
                    border: '1.5px solid #E2E8F0',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#10B981';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      {s.locationType === 'ONLINE' ? (
                        <span
                          style={{
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #BFDBFE',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Video size={12} />
                          <span>Google Meet (Online)</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            background: '#F8FAFC',
                            color: '#334155',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Building2 size={12} />
                          <span>{s.roomNumber ? `ห้อง ${s.roomNumber} (Onsite)` : s.location || 'Onsite'}</span>
                        </span>
                      )}

                      <span
                        style={{
                          background: st.bgColor,
                          color: st.color,
                          border: `1px solid ${st.borderColor}`,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                        }}
                      >
                        {st.badgeText}
                      </span>

                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                        📅 วันที่ {s.date} เวลา {s.startTime} - {s.endTime} น.
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0', lineHeight: 1.35 }}>
                      {s.topic}
                    </h4>

                    <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginBottom: '6px' }}>
                      🎤 ผู้บรรยาย: {(s.speakers || []).map((sp) => `${sp.name} (${sp.department || sp.position || ''})`).join(', ')}
                    </div>

                    {s.tags && s.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {s.tags.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              background: '#FEF3C7',
                              color: '#B45309',
                              padding: '1px 6px',
                              borderRadius: '12px',
                            }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#059669',
                        padding: '6px 12px',
                        background: '#ECFDF5',
                        borderRadius: '8px',
                      }}
                    >
                      ดูรายละเอียด &rarr;
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
