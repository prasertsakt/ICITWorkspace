'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { formatDateDDMMYYYYBE } from '@/lib/dateUtils';

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function KMDatePickerModal({
  isOpen,
  onClose,
  onSelectDate,
  initialDate = '',
  title = 'เลือกวันที่',
}) {
  const [currentYear, setCurrentYear] = useState(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      if (!isNaN(d.getTime())) return d.getFullYear();
    }
    return new Date().getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      if (!isNaN(d.getTime())) return d.getMonth();
    }
    return new Date().getMonth();
  });

  const [selectedDateStr, setSelectedDateStr] = useState(initialDate || '');

  useEffect(() => {
    if (initialDate) {
      setSelectedDateStr(initialDate);
      const d = new Date(initialDate);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    } else {
      const today = new Date();
      setSelectedDateStr(today.toISOString().split('T')[0]);
      setCurrentYear(today.getFullYear());
      setCurrentMonth(today.getMonth());
    }
  }, [initialDate, isOpen]);

  if (!isOpen) return null;

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    setSelectedDateStr(dateStr);
  };

  const handleQuickSelectToday = () => {
    const today = new Date();
    const formatted = today.toISOString().split('T')[0];
    setSelectedDateStr(formatted);
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const handleConfirm = () => {
    if (selectedDateStr) {
      onSelectDate(selectedDateStr);
      onClose();
    }
  };

  const buddhistYear = currentYear + 543;

  return (
    <div className="modal-overlay" style={{ zIndex: 11000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '380px',
          padding: '1.25rem',
          borderRadius: '16px',
          boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>
                {title}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                ปฏิทินแบบ พ.ศ. (Thai Buddhist Calendar)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected Date Indicator Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#FFFFFF',
            borderRadius: '10px',
            padding: '0.65rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.85, fontWeight: 600 }}>วันที่เลือก</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              {selectedDateStr ? formatDateDDMMYYYYBE(selectedDateStr) : 'ยังไม่ได้เลือก'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickSelectToday}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 8px',
              cursor: 'pointer',
            }}
          >
            วันนี้
          </button>
        </div>

        {/* Month & Year Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            padding: '0 4px',
          }}
        >
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '4px 8px',
              cursor: 'pointer',
              color: '#334155',
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#1E293B',
                cursor: 'pointer',
              }}
            >
              {THAI_MONTHS_FULL.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#059669',
                cursor: 'pointer',
              }}
            >
              {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                <option key={y} value={y}>
                  พ.ศ. {y + 543} ({y})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '4px 8px',
              cursor: 'pointer',
              color: '#334155',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Days Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#64748B',
            marginBottom: '4px',
          }}
        >
          {THAI_DAYS_SHORT.map((d, idx) => (
            <div key={d} style={{ color: idx === 0 ? '#DC2626' : undefined, padding: '4px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '3px',
            marginBottom: '1rem',
          }}
        >
          {/* Previous month filler days */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div
              key={`prev-${idx}`}
              style={{
                padding: '6px 0',
                textAlign: 'center',
                color: '#CBD5E1',
                fontSize: '0.75rem',
              }}
            >
              {daysInPrevMonth - firstDayOfMonth + idx + 1}
            </div>
          ))}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const formattedMonth = String(currentMonth + 1).padStart(2, '0');
            const formattedDay = String(day).padStart(2, '0');
            const thisDateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
            const isSelected = selectedDateStr === thisDateStr;

            const isToday =
              new Date().toISOString().split('T')[0] === thisDateStr;

            return (
              <button
                key={`day-${day}`}
                type="button"
                onClick={() => handleSelectDay(day)}
                style={{
                  padding: '6px 0',
                  borderRadius: '8px',
                  border: isSelected
                    ? '1.5px solid #059669'
                    : isToday
                    ? '1.5px dashed #10B981'
                    : '1px solid transparent',
                  background: isSelected ? '#059669' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#1E293B',
                  fontWeight: isSelected || isToday ? 800 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary btn-sm"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.45rem 1.15rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} />
            <span>ยืนยันเลือกวันที่</span>
          </button>
        </div>
      </div>
    </div>
  );
}
