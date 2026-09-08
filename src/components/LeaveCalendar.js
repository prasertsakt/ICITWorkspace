'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LEAVE_TYPES, LEAVE_TYPE_CONFIG, PREDEFINED_DEPARTMENTS } from '@/lib/constants';
import { isDummyLeaveRecord } from '@/lib/storageService';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Search,
  User,
  Clock,
  Building2,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Info,
  Check,
  ChevronDown,
  RotateCcw,
  FileText,
} from 'lucide-react';

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

export default function LeaveCalendar({
  leaves = [],
  isAdmin = false,
  canCreateReport = false,
  onOpenReport,
  onEditLeave,
  onDeleteLeave,
  onYearChange,
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filterDept, setFilterDept] = useState('ALL');
  const [selectedTypes, setSelectedTypes] = useState([]); // [] means ALL types
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected date or leave for detailed inspection
  const [selectedDayDetail, setSelectedDayDetail] = useState(null); // { dateString, leaves: [] }
  const [selectedLeaveItem, setSelectedLeaveItem] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 - 11
  const thaiYear = year + 543;

  // Close type dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notify parent component about current active year
  useEffect(() => {
    if (onYearChange) {
      onYearChange(year);
    }
  }, [year, onYearChange]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Toggle single type in multi-select
  const handleToggleType = (type) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Toggle legend chip
  const handleToggleChip = (type) => {
    setSelectedTypes((prev) => {
      if (prev.length === 0) {
        // From all to just this type
        return [type];
      }
      if (prev.includes(type)) {
        const next = prev.filter((t) => t !== type);
        return next;
      }
      return [...prev, type];
    });
  };

  // Filter leaves based on user selections
  const filteredLeaves = useMemo(() => {
    return leaves.filter((item) => {
      if (isDummyLeaveRecord(item)) return false;
      const matchDept = filterDept === 'ALL' || item.department === filterDept;
      const matchType =
        selectedTypes.length === 0 ||
        selectedTypes.length === LEAVE_TYPES.length ||
        selectedTypes.includes(item.leaveType);
      const matchSearch =
        searchQuery === '' ||
        item.personnelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDept && matchType && matchSearch;
    });
  }, [leaves, filterDept, selectedTypes, searchQuery]);

  // Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({
        dayNumber: d,
        dateString: dateStr,
        isCurrentMonth: false,
        isToday: false,
        dateObj: prevDate,
      });
    }

    // 2. Current month days
    const todayStr = new Date().toISOString().split('T')[0];
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const currDate = new Date(year, month, d);
      // Format YYYY-MM-DD
      const yStr = year;
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;
      days.push({
        dayNumber: d,
        dateString: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        dateObj: currDate,
      });
    }

    // 3. Next month leading days to complete grid (42 cells: 6 weeks)
    const remainingDays = 42 - days.length;
    for (let d = 1; d <= remainingDays; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({
        dayNumber: d,
        dateString: dateStr,
        isCurrentMonth: false,
        isToday: false,
        dateObj: nextDate,
      });
    }

    return days;
  }, [year, month]);

  // Map leaves to dates: { 'YYYY-MM-DD': [leaves] }
  const leavesByDate = useMemo(() => {
    const map = {};
    filteredLeaves.forEach((leave) => {
      if (!leave.startDate || !leave.endDate) return;

      const cur = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      // Guard against infinite loop
      let count = 0;
      while (cur <= end && count < 366) {
        const dateStr = cur.toISOString().split('T')[0];
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(leave);
        cur.setDate(cur.getDate() + 1);
        count++;
      }
    });
    return map;
  }, [filteredLeaves]);

  const handleCellClick = (dayObj, dayLeaves) => {
    if (dayLeaves && dayLeaves.length > 0) {
      setSelectedDayDetail({
        dateString: dayObj.dateString,
        dayNumber: dayObj.dayNumber,
        leaves: dayLeaves,
      });
    }
  };

  return (
    <div className="card-glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
      {/* Calendar Top Controls & Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Month Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <button
              onClick={handlePrevMonth}
              className="btn btn-secondary btn-icon"
              title="เดือนก่อนหน้า"
              style={{ width: '36px', height: '36px', padding: 0 }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextMonth}
              className="btn btn-secondary btn-icon"
              title="เดือนถัดไป"
              style={{ width: '36px', height: '36px', padding: 0 }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="btn btn-ghost btn-sm"
            style={{ fontWeight: 600, fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            วันนี้
          </button>

          <h2
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              minWidth: '200px',
            }}
          >
            {THAI_MONTHS[month]} {thaiYear}
          </h2>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '180px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อ..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '28px', fontSize: '0.785rem', height: '36px' }}
            />
          </div>

          {/* Department Filter */}
          <select
            className="form-input"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            style={{ width: '170px', fontSize: '0.785rem', height: '36px' }}
          >
            <option value="ALL">🏢 ทุกฝ่ายงาน</option>
            {PREDEFINED_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Multi-Select Leave Type Filter (Enum-style) */}
          <div style={{ position: 'relative' }} ref={typeDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="form-input"
              style={{
                width: '185px',
                fontSize: '0.785rem',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0.65rem',
                cursor: 'pointer',
                background: selectedTypes.length > 0 ? 'var(--primary-50)' : 'var(--bg-card)',
                borderColor: selectedTypes.length > 0 ? 'var(--primary-300)' : 'var(--border-subtle)',
                color: selectedTypes.length > 0 ? 'var(--primary-700)' : 'var(--text-primary)',
                fontWeight: selectedTypes.length > 0 ? 600 : 400,
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedTypes.length === 0 || selectedTypes.length === LEAVE_TYPES.length
                  ? '📋 ทุกประเภทการลา'
                  : selectedTypes.length === 1
                  ? `📋 ${selectedTypes[0]}`
                  : `📋 เลือก ${selectedTypes.length} ประเภท`}
              </span>
              <ChevronDown size={14} style={{ flexShrink: 0, marginLeft: '4px', opacity: 0.7 }} />
            </button>

            {/* Multi-Select Popover Menu */}
            {isTypeDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  width: '240px',
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                  zIndex: 50,
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {/* Popover Header Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '2px 6px 6px',
                    borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
                    fontSize: '0.7rem',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>ประเภทการลา (Enum)</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedTypes([...LEAVE_TYPES])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-600)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        padding: 0,
                      }}
                    >
                      เลือกทั้งหมด
                    </button>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTypes([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        padding: 0,
                      }}
                    >
                      ล้างค่า
                    </button>
                  </div>
                </div>

                {/* Option List */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {LEAVE_TYPES.map((type) => {
                    const conf = LEAVE_TYPE_CONFIG[type] || {};
                    const isChecked = selectedTypes.includes(type);
                    return (
                      <label
                        key={type}
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleType(type);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          background: isChecked ? 'var(--primary-50, #eef2ff)' : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ cursor: 'pointer', accentColor: 'var(--primary-600)' }}
                        />
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: conf.pillBg || '#6366F1',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ flex: 1, fontWeight: isChecked ? 600 : 400, color: 'var(--text-primary)' }}>
                          {type}
                        </span>
                        {conf.label && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: conf.bg,
                              color: conf.color,
                            }}
                          >
                            {conf.label}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {canCreateReport && onOpenReport && (
            <button
              type="button"
              onClick={onOpenReport}
              className="btn btn-secondary btn-sm"
              title="ออกรายงานสรุปสถิติวันลา PDF"
              style={{
                height: '36px',
                padding: '0 0.85rem',
                fontSize: '0.785rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--primary-700)',
                background: 'var(--primary-50)',
                border: '1px solid var(--primary-200)',
                fontWeight: 600,
              }}
            >
              <FileText size={14} color="var(--primary-600)" />
              <span>รายงาน PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Leave Type Legend Chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          padding: '0.65rem 1rem',
          background: 'var(--bg-card-subtle)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          alignItems: 'center',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          สัญลักษณ์สี (คลิกเพื่อกรอง):
        </span>
        {LEAVE_TYPES.map((type) => {
          const conf = LEAVE_TYPE_CONFIG[type] || {};
          const isSelected = selectedTypes.includes(type);
          const hasFilter = selectedTypes.length > 0;
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleToggleChip(type)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.725rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                background: conf.bg || '#F1F5F9',
                color: conf.color || '#334155',
                border: isSelected
                  ? `2px solid ${conf.pillBg || '#6366F1'}`
                  : `1px solid ${conf.border || 'transparent'}`,
                cursor: 'pointer',
                fontWeight: isSelected ? 700 : 500,
                opacity: hasFilter && !isSelected ? 0.45 : 1,
                transform: isSelected ? 'scale(1.04)' : 'none',
                boxShadow: isSelected ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
              title={isSelected ? `คลิกเพื่อยกเลิกการเลือก ${type}` : `คลิกเพื่อเลือก ${type}`}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: conf.pillBg || '#6366F1',
                }}
              />
              <span>{type}</span>
              {isSelected && <Check size={11} strokeWidth={3} />}
            </button>
          );
        })}

        {selectedTypes.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedTypes([])}
            className="btn btn-ghost btn-xs"
            style={{
              fontSize: '0.7rem',
              color: 'var(--rose-600, #e11d48)',
              fontWeight: 600,
              padding: '0.15rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginLeft: 'auto',
            }}
          >
            <RotateCcw size={11} />
            <span>แสดงทั้งหมด</span>
          </button>
        )}
      </div>

      {/* Calendar Grid Table */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {/* Weekday Headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            background: 'var(--bg-card-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          {WEEKDAYS.map((w, idx) => (
            <div
              key={w}
              style={{
                padding: '0.65rem 0',
                color: idx === 0 ? 'var(--rose-500)' : idx === 6 ? 'var(--sky-600)' : 'var(--text-secondary)',
              }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Days Cells (6 Rows x 7 Columns) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            background: 'var(--border-subtle)',
            gap: '1px',
          }}
        >
          {calendarDays.map((dayObj, index) => {
            const dayLeaves = leavesByDate[dayObj.dateString] || [];
            const hasLeaves = dayLeaves.length > 0;
            const maxVisible = 2; // Show max 2 pill events, then +X more
            const visibleLeaves = dayLeaves.slice(0, maxVisible);
            const extraCount = dayLeaves.length - maxVisible;

            return (
              <div
                key={`${dayObj.dateString}-${index}`}
                onClick={() => handleCellClick(dayObj, dayLeaves)}
                style={{
                  background: dayObj.isToday
                    ? 'rgba(238, 242, 255, 0.7)'
                    : dayObj.isCurrentMonth
                    ? 'var(--bg-card)'
                    : 'rgba(248, 250, 252, 0.6)',
                  minHeight: '92px',
                  padding: '0.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: hasLeaves ? 'pointer' : 'default',
                  transition: 'background 0.15s ease',
                  position: 'relative',
                }}
                className={hasLeaves ? 'calendar-cell-active' : ''}
              >
                {/* Date Number Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: dayObj.isToday ? '24px' : 'auto',
                      height: dayObj.isToday ? '24px' : 'auto',
                      borderRadius: dayObj.isToday ? '50%' : 'none',
                      background: dayObj.isToday ? 'var(--primary-600)' : 'transparent',
                      color: dayObj.isToday
                        ? '#FFFFFF'
                        : dayObj.isCurrentMonth
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: dayObj.isToday ? 800 : dayObj.isCurrentMonth ? 600 : 400,
                    }}
                  >
                    {dayObj.dayNumber}
                  </span>

                  {hasLeaves && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'var(--primary-600)',
                        background: 'var(--primary-50)',
                        padding: '1px 5px',
                        borderRadius: '8px',
                      }}
                    >
                      {dayLeaves.length}
                    </span>
                  )}
                </div>

                {/* Leave Event Pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                  {visibleLeaves.map((leave) => {
                    const conf = LEAVE_TYPE_CONFIG[leave.leaveType] || {};
                    return (
                      <div
                        key={`${leave.id}-${dayObj.dateString}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeaveItem(leave);
                        }}
                        style={{
                          background: conf.bg || '#EEF2FF',
                          color: conf.color || '#4F46E5',
                          borderLeft: `3px solid ${conf.pillBg || '#6366F1'}`,
                          padding: '2px 4px',
                          borderRadius: '3px',
                          fontSize: '0.675rem',
                          lineHeight: 1.2,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title={`${leave.personnelName} (${leave.leaveType}): ${leave.reason || 'ไม่มีหมายเหตุ'}`}
                      >
                        <span style={{ fontWeight: 700 }}>{leave.leaveType}</span>
                        <span style={{ opacity: 0.9 }}>{leave.personnelName}</span>
                      </div>
                    );
                  })}

                  {extraCount > 0 && (
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        background: 'var(--border-subtle)',
                        textAlign: 'center',
                      }}
                    >
                      +{extraCount} รายการเพิ่มเติม
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1. Day Detail Modal (Shows all leaves on a specific day) */}
      {selectedDayDetail && (
        <div className="modal-overlay" onClick={() => setSelectedDayDetail(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--primary-50)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    รายการวันลาวันที่ {selectedDayDetail.dateString}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    มีบุคลากรขอลาทั้งหมด {selectedDayDetail.leaves.length} ท่าน
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="btn-close"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedDayDetail.leaves.map((item) => {
                  const conf = LEAVE_TYPE_CONFIG[item.leaveType] || {};
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-card-subtle)',
                        border: `1px solid ${conf.border || 'var(--border-subtle)'}`,
                        borderLeft: `4px solid ${conf.pillBg || '#6366F1'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {item.avatarUrl ? (
                            <img
                              src={item.avatarUrl}
                              alt=""
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--primary-100)',
                                color: 'var(--primary-600)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                              }}
                            >
                              {item.personnelName?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {item.personnelName}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                              {item.department}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            background: conf.bg,
                            color: conf.color,
                          }}
                        >
                          {item.leaveType}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        <strong>ช่วงเวลา:</strong> {item.startDate} ถึง {item.endDate} ({item.totalDays} วัน)
                      </div>

                      {item.reason && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', background: 'var(--bg-card)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                          <strong>เหตุผล:</strong> {item.reason}
                        </div>
                      )}

                      {isAdmin && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.6rem' }}>
                          <button
                            onClick={() => {
                              setSelectedDayDetail(null);
                              onEditLeave(item);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <Edit2 size={13} />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการลบรายการลาของ "${item.personnelName}" ใช่หรือไม่?`)) {
                                onDeleteLeave(item.id, item.personnelName);
                                setSelectedDayDetail(null);
                              }
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--rose-500)', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <Trash2 size={13} />
                            <span>ลบ</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Single Leave Item Detail Modal */}
      {selectedLeaveItem && (
        <div className="modal-overlay" onClick={() => setSelectedLeaveItem(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: LEAVE_TYPE_CONFIG[selectedLeaveItem.leaveType]?.bg || 'var(--primary-50)',
                    color: LEAVE_TYPE_CONFIG[selectedLeaveItem.leaveType]?.color || 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Info size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    รายละเอียดการลา
                  </h3>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: LEAVE_TYPE_CONFIG[selectedLeaveItem.leaveType]?.color,
                    }}
                  >
                    {selectedLeaveItem.leaveType}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeaveItem(null)}
                className="btn-close"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Personnel Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                }}
              >
                {selectedLeaveItem.avatarUrl ? (
                  <img
                    src={selectedLeaveItem.avatarUrl}
                    alt=""
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'var(--primary-100)',
                      color: 'var(--primary-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    {selectedLeaveItem.personnelName?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {selectedLeaveItem.personnelName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    ฝ่าย: {selectedLeaveItem.department}
                  </div>
                </div>
              </div>

              {/* Leave Info Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ประเภทการลา:</span>
                  <strong style={{ color: LEAVE_TYPE_CONFIG[selectedLeaveItem.leaveType]?.color }}>
                    {selectedLeaveItem.leaveType}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ช่วงวันที่ลา:</span>
                  <strong>{selectedLeaveItem.startDate} ถึง {selectedLeaveItem.endDate}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>จำนวนวันรวม:</span>
                  <strong style={{ color: 'var(--primary-600)' }}>{selectedLeaveItem.totalDays} วัน</strong>
                </div>

                {selectedLeaveItem.reason && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                      เหตุผลประกอบการลา:
                    </span>
                    <div style={{ background: 'var(--bg-card-subtle)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', lineHeight: 1.5 }}>
                      {selectedLeaveItem.reason}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => {
                      const item = selectedLeaveItem;
                      setSelectedLeaveItem(null);
                      onEditLeave(item);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit2 size={14} />
                    <span>แก้ไข</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`คุณต้องการลบรายการลาของ "${selectedLeaveItem.personnelName}" ใช่หรือไม่?`)) {
                        onDeleteLeave(selectedLeaveItem.id, selectedLeaveItem.personnelName);
                        setSelectedLeaveItem(null);
                      }
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--rose-500)' }}
                  >
                    <Trash2 size={14} />
                    <span>ลบรายการนี้</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
