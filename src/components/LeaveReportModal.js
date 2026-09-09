'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Printer,
  FileText,
  Layers,
  Calendar,
  ChevronDown,
  Check,
} from 'lucide-react';
import { LEAVE_TYPES, LEAVE_TYPE_CONFIG, PREDEFINED_DEPARTMENTS } from '@/lib/constants';
import { getQuarterRange, getFiscalYear, getFiscalYearRange, formatLocalDate } from '@/lib/dateUtils';

// Format Date Thai: e.g. 15 ก.ย. 2569
function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10) + 543;
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return `${day} ${thaiMonths[monthIdx]} ${year}`;
  } catch {
    return dateStr;
  }
}

function formatThaiDateFull(dateStr) {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10) + 543;
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${day} ${thaiMonths[monthIdx]} ${year}`;
  } catch {
    return dateStr;
  }
}

export default function LeaveReportModal({
  isOpen,
  onClose,
  leaves = [],
  personnelList = [],
  currentPersonnel = null,
}) {
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11

  // Default range: First day of current month to last day of current month
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return formatLocalDate(d);
  });
  const [endDate, setEndDate] = useState(() => {
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    return formatLocalDate(lastDay);
  });

  const [filterDept, setFilterDept] = useState('ALL');
  const [selectedTypes, setSelectedTypes] = useState([]); // [] means ALL types
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef(null);
  const [activePreset, setActivePreset] = useState('this_month');
  const [quarterMode, setQuarterMode] = useState('fiscal'); // 'fiscal' = ปีงบประมาณ, 'calendar' = ปีปฏิทิน

  // Close type dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleType = (type) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Quick Range Presets
  const applyPreset = (presetKey, overrideMode = null) => {
    setActivePreset(presetKey);
    const mode = overrideMode || quarterMode;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (presetKey === 'this_month') {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      setStartDate(formatLocalDate(start));
      setEndDate(formatLocalDate(end));
    } else if (presetKey === 'last_month') {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      setStartDate(formatLocalDate(start));
      setEndDate(formatLocalDate(end));
    } else if (presetKey === 'q1' || presetKey === 'q2' || presetKey === 'q3' || presetKey === 'q4') {
      const qNum = parseInt(presetKey.replace('q', ''), 10);
      const range = getQuarterRange(qNum, { isFiscal: mode === 'fiscal' });
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    } else if (presetKey === 'fiscal_year') {
      const range = getFiscalYearRange();
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    } else if (presetKey === 'this_year') {
      setStartDate(`${y}-01-01`);
      setEndDate(`${y}-12-31`);
    }
  };

  // Toggle quarter mode and reapply if currently on a quarter preset
  const handleToggleQuarterMode = (newMode) => {
    setQuarterMode(newMode);
    if (['q1', 'q2', 'q3', 'q4'].includes(activePreset)) {
      applyPreset(activePreset, newMode);
    }
  };

  // Filter leaves based on date range, department, and leave type
  const filteredLeaves = useMemo(() => {
    return leaves.filter((item) => {
      if (!item.startDate) return false;
      const leaveStart = item.startDate.split('T')[0];
      const leaveEnd = (item.endDate || item.startDate).split('T')[0];

      // Overlap condition: leave range overlaps with [startDate, endDate]
      const isInRange = leaveStart <= endDate && leaveEnd >= startDate;
      if (!isInRange) return false;

      // Department filter
      if (filterDept !== 'ALL' && item.department !== filterDept) {
        return false;
      }

      // Leave type filter (multi-select)
      if (
        selectedTypes.length > 0 &&
        selectedTypes.length < LEAVE_TYPES.length &&
        !selectedTypes.includes(item.leaveType)
      ) {
        return false;
      }

      return true;
    }).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }, [leaves, startDate, endDate, filterDept, selectedTypes]);

  // Aggregate Metrics
  const summaryMetrics = useMemo(() => {
    const totalRecords = filteredLeaves.length;
    let totalDays = 0;
    const uniquePersonnel = new Set();
    const typeBreakdown = {};
    const deptBreakdown = {};

    LEAVE_TYPES.forEach((t) => {
      typeBreakdown[t] = { count: 0, days: 0 };
    });

    filteredLeaves.forEach((item) => {
      const days = Number(item.totalDays) || 1;
      totalDays += days;
      if (item.personnelId || item.personnelName) {
        uniquePersonnel.add(item.personnelId || item.personnelName);
      }

      // Type Breakdown
      const type = item.leaveType || 'อื่นๆ';
      if (!typeBreakdown[type]) {
        typeBreakdown[type] = { count: 0, days: 0 };
      }
      typeBreakdown[type].count += 1;
      typeBreakdown[type].days += days;

      // Department Breakdown
      const dept = item.department || 'ไม่ระบุฝ่าย';
      if (!deptBreakdown[dept]) {
        deptBreakdown[dept] = { count: 0, days: 0, personnel: new Set() };
      }
      deptBreakdown[dept].count += 1;
      deptBreakdown[dept].days += days;
      deptBreakdown[dept].personnel.add(item.personnelId || item.personnelName);
    });

    return {
      totalRecords,
      totalDays,
      totalPeople: uniquePersonnel.size,
      typeBreakdown,
      deptBreakdown,
    };
  }, [filteredLeaves]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, padding: '1rem' }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1020px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#F8FAFC',
        }}
      >
        {/* Modal Top Bar (Hidden on Print) */}
        <div
          className="no-print"
          style={{
            padding: '1rem 1.5rem',
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
              }}
            >
              <img
                src="/icit-logo.png"
                alt="ICIT Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                ออกรายงานสรุปประวัติวันลาบุคลากร (PDF)
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                กำหนดช่วงเวลา เลือกฝ่ายงาน ตรวจสอบตัวอย่างเอกสาร และกดพิมพ์หรือบันทึกเป็น PDF
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary btn-sm"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                padding: '0.55rem 1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              <Printer size={16} />
              <span>พิมพ์ / บันทึกเป็น PDF</span>
            </button>
            <button
              onClick={onClose}
              className="btn-close"
              type="button"
              style={{ padding: '6px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar (Hidden on Print) */}
        <div
          className="no-print"
          style={{
            padding: '0.85rem 1.5rem',
            background: '#F1F5F9',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginRight: '4px' }}>
              ช่วงเวลายอดนิยม:
            </span>
            {[
              { key: 'this_month', label: 'เดือนนี้' },
              { key: 'last_month', label: 'เดือนที่แล้ว' },
              { key: 'fiscal_year', label: 'ปีงบประมาณนี้' },
              { key: 'this_year', label: 'ทั้งปีนี้' },
            ].map((p) => {
              const isActive = activePreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: isActive ? 700 : 500,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    border: isActive ? '1px solid #4F46E5' : '1px solid #CBD5E1',
                    background: isActive ? '#4F46E5' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              );
            })}

            <span style={{ color: '#CBD5E1', margin: '0 2px' }}>|</span>
            <span style={{ fontSize: '0.725rem', fontWeight: 600, color: '#64748B' }}>ไตรมาส:</span>

            {/* Quarter Mode Toggle (ปีงบประมาณราชการ vs ปีปฏิทิน) */}
            <div
              style={{
                display: 'inline-flex',
                borderRadius: '6px',
                padding: '2px',
                background: '#E2E8F0',
                marginRight: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => handleToggleQuarterMode('fiscal')}
                style={{
                  border: 'none',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '0.675rem',
                  fontWeight: quarterMode === 'fiscal' ? 700 : 500,
                  background: quarterMode === 'fiscal' ? '#FFFFFF' : 'transparent',
                  color: quarterMode === 'fiscal' ? '#4F46E5' : '#64748B',
                  cursor: 'pointer',
                  boxShadow: quarterMode === 'fiscal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
                title="ไตรมาสตามปีงบประมาณราชการ (ต.ค. - ก.ย.)"
              >
                🏛️ ปีงบประมาณ
              </button>
              <button
                type="button"
                onClick={() => handleToggleQuarterMode('calendar')}
                style={{
                  border: 'none',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '0.675rem',
                  fontWeight: quarterMode === 'calendar' ? 700 : 500,
                  background: quarterMode === 'calendar' ? '#FFFFFF' : 'transparent',
                  color: quarterMode === 'calendar' ? '#4F46E5' : '#64748B',
                  cursor: 'pointer',
                  boxShadow: quarterMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
                title="ไตรมาสตามปีปฏิทิน (ม.ค. - ธ.ค.)"
              >
                📅 ปีปฏิทิน
              </button>
            </div>

            {/* Quarter Buttons Q1 - Q4 */}
            {[
              {
                key: 'q1',
                label: quarterMode === 'fiscal' ? 'Q1 (ต.ค.-ธ.ค.)' : 'Q1 (ม.ค.-มี.ค.)',
                title: quarterMode === 'fiscal' ? 'ไตรมาส 1 ปีงบประมาณ: 1 ต.ค. - 31 ธ.ค.' : 'ไตรมาส 1 ปีปฏิทิน: 1 ม.ค. - 31 มี.ค.',
              },
              {
                key: 'q2',
                label: quarterMode === 'fiscal' ? 'Q2 (ม.ค.-มี.ค.)' : 'Q2 (เม.ย.-มิ.ย.)',
                title: quarterMode === 'fiscal' ? 'ไตรมาส 2 ปีงบประมาณ: 1 ม.ค. - 31 มี.ค.' : 'ไตรมาส 2 ปีปฏิทิน: 1 เม.ย. - 30 มิ.ย.',
              },
              {
                key: 'q3',
                label: quarterMode === 'fiscal' ? 'Q3 (เม.ย.-มิ.ย.)' : 'Q3 (ก.ค.-ก.ย.)',
                title: quarterMode === 'fiscal' ? 'ไตรมาส 3 ปีงบประมาณ: 1 เม.ย. - 30 มิ.ย.' : 'ไตรมาส 3 ปีปฏิทิน: 1 ก.ค. - 30 ก.ย.',
              },
              {
                key: 'q4',
                label: quarterMode === 'fiscal' ? 'Q4 (ก.ค.-ก.ย.)' : 'Q4 (ต.ค.-ธ.ค.)',
                title: quarterMode === 'fiscal' ? 'ไตรมาส 4 ปีงบประมาณ: 1 ก.ค. - 30 ก.ย.' : 'ไตรมาส 4 ปีปฏิทิน: 1 ต.ค. - 31 ธ.ค.',
              },
            ].map((q) => {
              const isActive = activePreset === q.key;
              return (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => applyPreset(q.key)}
                  title={q.title}
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: isActive ? 700 : 500,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    border: isActive ? '1px solid #4F46E5' : '1px solid #CBD5E1',
                    background: isActive ? '#4F46E5' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {q.label}
                </button>
              );
            })}
          </div>

          {/* Date Pickers & Dropdowns */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>จากวันที่:</span>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', height: '34px', width: '140px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>ถึงวันที่:</span>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', height: '34px', width: '140px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>ฝ่ายงาน:</span>
              <select
                className="form-input"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', height: '34px', width: '160px' }}
              >
                <option value="ALL">🏢 ทุกฝ่ายงาน</option>
                {PREDEFINED_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-Select ประเภทการลา */}
            <div ref={typeDropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>ประเภท:</span>
              <button
                type="button"
                onClick={() => setIsTypeDropdownOpen((prev) => !prev)}
                className="form-input"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.35rem 0.6rem',
                  height: '34px',
                  minWidth: '150px',
                  maxWidth: '210px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: selectedTypes.length > 0 ? '#EEF2FF' : '#FFFFFF',
                  borderColor: selectedTypes.length > 0 ? '#A5B4FC' : '#CBD5E1',
                  color: selectedTypes.length > 0 ? '#4338CA' : '#0F172A',
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
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    zIndex: 60,
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
                      borderBottom: '1px solid #F1F5F9',
                      fontSize: '0.7rem',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#475569' }}>ประเภทการลา (Enum)</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedTypes([...LEAVE_TYPES])}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4F46E5',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          padding: 0,
                        }}
                      >
                        เลือกทั้งหมด
                      </button>
                      <span style={{ color: '#CBD5E1' }}>|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTypes([])}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748B',
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
                            background: isChecked ? '#EEF2FF' : 'transparent',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            style={{ cursor: 'pointer', accentColor: '#4F46E5' }}
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
                          <span style={{ flex: 1, fontWeight: isChecked ? 600 : 400, color: '#0F172A' }}>
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

            <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748B' }}>
              พบข้อมูล: <strong style={{ color: '#0F172A' }}>{filteredLeaves.length}</strong> รายการ (รวม{' '}
              <strong style={{ color: '#4F46E5' }}>{summaryMetrics.totalDays}</strong> วัน)
            </div>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            backgroundColor: '#CBD5E1',
          }}
        >
          {/* Printable Sheet (Standard A4 Simulation) */}
          <div
            id="printable-leave-report"
            className="report-preview-sheet"
            style={{
              width: '100%',
              maxWidth: '820px',
              minHeight: 'fit-content',
              height: 'fit-content',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: '28mm 20mm',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              borderRadius: '6px',
              fontSize: '13px',
              lineHeight: 1.5,
              marginBottom: '2.5rem',
              fontFamily: "'Sarabun', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {/* Document Header */}
            <div
              style={{
                textAlign: 'center',
                paddingBottom: '16px',
                borderBottom: '2px solid #0F172A',
                marginBottom: '20px',
              }}
            >
              {/* Official ICIT Logo Header */}
              <div style={{ marginBottom: '12px' }}>
                <img
                  src="/icit-logo.png"
                  alt="ICIT Logo"
                  style={{
                    height: '62px',
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'inline-block',
                  }}
                />
              </div>

              <h2
                style={{
                  margin: '0 0 2px 0',
                  fontSize: '17px',
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '0.2px',
                }}
              >
                สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.
              </h2>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                Institute of Computer and Information Technology | KMUTNB
              </div>

              <h1
                style={{
                  margin: '8px 0 4px 0',
                  fontSize: '19px',
                  fontWeight: 800,
                  color: '#1E293B',
                }}
              >
                รายงานสรุปประวัติและสถิติการลาของบุคลากร
              </h1>

              <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
                ช่วงวันที่ <strong>{formatThaiDateFull(startDate)}</strong> ถึงวันที่{' '}
                <strong>{formatThaiDateFull(endDate)}</strong>
                {filterDept !== 'ALL' && <span> • ฝ่ายงาน: <strong>{filterDept}</strong></span>}
                {selectedTypes.length > 0 && selectedTypes.length < LEAVE_TYPES.length && (
                  <span> • ประเภท: <strong>{selectedTypes.join(', ')}</strong></span>
                )}
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: '#64748B',
                  marginTop: '12px',
                  paddingTop: '8px',
                  borderTop: '1px dashed #E2E8F0',
                }}
              >
                <span>
                  วันที่จัดพิมพ์: {formatThaiDateFull(formatLocalDate(today))} เวลา{' '}
                  {String(today.getHours()).padStart(2, '0')}:{String(today.getMinutes()).padStart(2, '0')} น.
                </span>
                <span>
                  ผู้พิมพ์รายงาน: {currentPersonnel?.name || 'เจ้าหน้าที่ผู้มีสิทธิ์'} (
                  {currentPersonnel?.position || 'ICIT'})
                </span>
              </div>
            </div>

            {/* Summary Statistics Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>จำนวนครั้งที่ลา</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {summaryMetrics.totalRecords}{' '}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>ครั้ง</span>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  background: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: '#4F46E5', fontWeight: 600 }}>รวมจำนวนวันลา</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#4F46E5', marginTop: '2px' }}>
                  {summaryMetrics.totalDays}{' '}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#6366F1' }}>วัน</span>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>บุคลากรที่ลา</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {summaryMetrics.totalPeople}{' '}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>คน</span>
                </div>
              </div>
            </div>

            {/* Leave Type Breakdown Table */}
            <div style={{ marginBottom: '22px' }}>
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  margin: '0 0 8px 0',
                  color: '#1E293B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>๑. สรุปจำแนกตามประเภทการลา</span>
              </h3>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                  border: '1px solid #CBD5E1',
                }}
              >
                <thead>
                  <tr style={{ background: '#F1F5F9' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #CBD5E1' }}>
                      ประเภทการลา
                    </th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #CBD5E1', width: '90px' }}>
                      จำนวน (ครั้ง)
                    </th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #CBD5E1', width: '90px' }}>
                      รวม (วัน)
                    </th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #CBD5E1', width: '90px' }}>
                      สัดส่วน (%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {LEAVE_TYPES.map((type) => {
                    const data = summaryMetrics.typeBreakdown[type] || { count: 0, days: 0 };
                    if (
                      selectedTypes.length > 0 &&
                      selectedTypes.length < LEAVE_TYPES.length &&
                      !selectedTypes.includes(type)
                    ) {
                      return null;
                    }
                    const percent = summaryMetrics.totalDays > 0
                      ? ((data.days / summaryMetrics.totalDays) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <tr key={type} style={{ backgroundColor: data.count > 0 ? '#FFFFFF' : '#FAFAFA' }}>
                        <td style={{ padding: '5px 10px', border: '1px solid #CBD5E1' }}>
                          <span style={{ fontWeight: data.count > 0 ? 600 : 400 }}>{type}</span>
                        </td>
                        <td style={{ padding: '5px 10px', textAlign: 'center', border: '1px solid #CBD5E1' }}>
                          {data.count}
                        </td>
                        <td style={{ padding: '5px 10px', textAlign: 'center', border: '1px solid #CBD5E1', fontWeight: data.days > 0 ? 700 : 400 }}>
                          {data.days}
                        </td>
                        <td style={{ padding: '5px 10px', textAlign: 'center', border: '1px solid #CBD5E1', color: '#64748B' }}>
                          {percent}%
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#F8FAFC', fontWeight: 800 }}>
                    <td style={{ padding: '6px 10px', border: '1px solid #CBD5E1' }}>รวมทั้งสิ้น</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #CBD5E1' }}>
                      {summaryMetrics.totalRecords}
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #CBD5E1', color: '#4F46E5' }}>
                      {summaryMetrics.totalDays}
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #CBD5E1' }}>
                      100.0%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Department Breakdown Table */}
            {filterDept === 'ALL' && Object.keys(summaryMetrics.deptBreakdown).length > 0 && (
              <div style={{ marginBottom: '22px' }}>
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                    color: '#1E293B',
                  }}
                >
                  <span>๒. สรุปจำแนกตามฝ่ายงาน</span>
                </h3>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    border: '1px solid #CBD5E1',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#F1F5F9' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #CBD5E1' }}>
                        ฝ่ายงาน / หน่วยงาน
                      </th>
                      <th style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #CBD5E1', width: '100px' }}>
                        จำนวนบุคลากร
                      </th>
                      <th style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #CBD5E1', width: '90px' }}>
                        จำนวน (ครั้ง)
                      </th>
                      <th style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #CBD5E1', width: '90px' }}>
                        รวม (วัน)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(summaryMetrics.deptBreakdown).map(([deptName, stats]) => (
                      <tr key={deptName}>
                        <td style={{ padding: '5px 10px', border: '1px solid #CBD5E1', fontWeight: 500 }}>
                          {deptName}
                        </td>
                        <td style={{ padding: '5px 10px', textAlign: 'center', border: '1px solid #CBD5E1' }}>
                          {stats.personnel.size} คน
                        </td>
                        <td style={{ padding: '5px 10px', textAlign: 'center', border: '1px solid #CBD5E1' }}>
                          {stats.count}
                        </td>
                        <td style={{ padding: '5px 10px', textAlign: 'center', border: '1px solid #CBD5E1', fontWeight: 700 }}>
                          {stats.days}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Detailed Records Log Table */}
            <div style={{ marginBottom: '25px' }}>
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  margin: '0 0 8px 0',
                  color: '#1E293B',
                }}
              >
                <span>๓. รายละเอียดประวัติการลาของบุคลากรรายบุคคล</span>
              </h3>

              {filteredLeaves.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: '#F8FAFC',
                    border: '1px dashed #CBD5E1',
                    borderRadius: '6px',
                    color: '#64748B',
                    fontSize: '12px',
                  }}
                >
                  ไม่พบข้อมูลการลาในช่วงเวลาและเงื่อนไขที่กำหนด
                </div>
              ) : (
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '11px',
                    border: '1px solid #CBD5E1',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#F1F5F9' }}>
                      <th style={{ padding: '6px 6px', textAlign: 'center', border: '1px solid #CBD5E1', width: '36px' }}>
                        ลำดับ
                      </th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #CBD5E1', width: '130px' }}>
                        ชื่อ - นามสกุล
                      </th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #CBD5E1', width: '130px' }}>
                        ฝ่ายงาน
                      </th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #CBD5E1', width: '70px' }}>
                        ประเภท
                      </th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #CBD5E1', width: '120px' }}>
                        ช่วงวันที่ลา
                      </th>
                      <th style={{ padding: '6px 6px', textAlign: 'center', border: '1px solid #CBD5E1', width: '45px' }}>
                        วัน
                      </th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #CBD5E1' }}>
                        เหตุผลการลา
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.map((item, idx) => {
                      const isSameDay = item.startDate === item.endDate;
                      const dateRangeStr = isSameDay
                        ? formatThaiDate(item.startDate)
                        : `${formatThaiDate(item.startDate)} - ${formatThaiDate(item.endDate)}`;

                      return (
                        <tr
                          key={item.id || idx}
                          style={{
                            backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                            pageBreakInside: 'avoid',
                          }}
                        >
                          <td style={{ padding: '5px 6px', textAlign: 'center', border: '1px solid #CBD5E1' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '5px 8px', border: '1px solid #CBD5E1', fontWeight: 600 }}>
                            {item.personnelName || '-'}
                          </td>
                          <td style={{ padding: '5px 8px', border: '1px solid #CBD5E1', color: '#475569' }}>
                            {item.department || '-'}
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #CBD5E1' }}>
                            <span style={{ fontWeight: 600 }}>{item.leaveType}</span>
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                            {dateRangeStr}
                          </td>
                          <td style={{ padding: '5px 6px', textAlign: 'center', border: '1px solid #CBD5E1', fontWeight: 700 }}>
                            {item.totalDays || 1}
                          </td>
                          <td style={{ padding: '5px 8px', border: '1px solid #CBD5E1', color: '#334155' }}>
                            {item.reason || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Official Footer Note (No signature block as requested) */}
            <div
              style={{
                marginTop: '30px',
                paddingTop: '12px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10px',
                color: '#64748B',
              }}
            >
              <span>เอกสารสารสนเทศภายใน สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT KMUTNB)</span>
              <span>หน้า 1 จาก 1 • ระบบบริหารงานบุคคล ICIT Workspace</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Print Style Injection */}
      <style jsx global>{`
        @media print {
          /* Hide non-printable UI elements */
          body * {
            visibility: hidden !important;
          }
          .no-print,
          .modal-overlay,
          header,
          nav,
          footer {
            display: none !important;
          }

          /* Make only the report sheet visible and take full page */
          #printable-leave-report,
          #printable-leave-report * {
            visibility: visible !important;
          }

          #printable-leave-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm 12mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
