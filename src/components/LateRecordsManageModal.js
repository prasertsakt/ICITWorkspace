'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  X,
  Search,
  Filter,
  Edit2,
  Trash2,
  Save,
  Calendar,
  AlertCircle,
  Building2,
  CheckCircle2,
  ArrowRight,
  User,
  History,
  Sparkles,
} from 'lucide-react';
import { saveLeaveRecord, deleteLeaveRecord } from '@/lib/storageService';
import { PREDEFINED_DEPARTMENTS } from '@/lib/constants';
import { formatLocalDate, parseLocalDate } from '@/lib/dateUtils';
import LeaveDeleteModal from '@/components/LeaveDeleteModal';

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

export default function LateRecordsManageModal({
  isOpen,
  onClose,
  leaves = [],
  currentUser = null,
  onSaved = null,
  onDeleted = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  
  // Editing Record State
  const [editingRecord, setEditingRecord] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Deleting Record State
  const [leaveToDelete, setLeaveToDelete] = useState(null);

  // Filter only 'สาย' records
  const lateLeaves = useMemo(() => {
    return leaves.filter((l) => l.leaveType === 'สาย');
  }, [leaves]);

  // Extract available years from late leaves
  const availableYears = useMemo(() => {
    const years = new Set();
    lateLeaves.forEach((l) => {
      if (l.startDate) {
        const y = parseInt(l.startDate.split('-')[0], 10);
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [lateLeaves]);

  // Filtered list based on search, department, and year
  const filteredLateLeaves = useMemo(() => {
    return lateLeaves.filter((l) => {
      if (filterDept !== 'ALL' && l.department !== filterDept) return false;
      if (filterYear !== 'ALL') {
        const lYear = l.startDate ? parseInt(l.startDate.split('-')[0], 10) : null;
        if (lYear !== parseInt(filterYear, 10)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = l.personnelName?.toLowerCase().includes(q);
        const matchDept = l.department?.toLowerCase().includes(q);
        const matchReason = l.reason?.toLowerCase().includes(q);
        if (!matchName && !matchDept && !matchReason) return false;
      }
      return true;
    }).sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
  }, [lateLeaves, filterDept, filterYear, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalRecords = filteredLateLeaves.length;
    let totalDays = 0;
    const personnelSet = new Set();

    filteredLateLeaves.forEach((l) => {
      totalDays += Number(l.totalDays || l.days || 1);
      if (l.personnelId || l.personnelName) {
        personnelSet.add(l.personnelId || l.personnelName);
      }
    });

    return {
      totalRecords,
      totalDays: Number(totalDays.toFixed(2)),
      uniquePersonnel: personnelSet.size,
    };
  }, [filteredLateLeaves]);

  if (!isOpen) return null;

  const handleStartEdit = (record) => {
    setEditingRecord({
      ...record,
      startDate: record.startDate ? record.startDate.split('T')[0] : '',
      endDate: record.endDate ? record.endDate.split('T')[0] : (record.startDate ? record.startDate.split('T')[0] : ''),
      totalDays: record.totalDays ?? record.days ?? 1,
      reason: record.reason || 'มาสาย',
    });
    setErrorMsg(null);
    setSaveSuccessMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setErrorMsg(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;

    if (!editingRecord.startDate) {
      setErrorMsg('กรุณาระบุวันที่เริ่มต้น');
      return;
    }

    if (!editingRecord.endDate) {
      editingRecord.endDate = editingRecord.startDate;
    }

    if (editingRecord.startDate > editingRecord.endDate) {
      setErrorMsg('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');
      return;
    }

    const durationDays = Number(editingRecord.totalDays) > 0 ? Number(editingRecord.totalDays) : 1;

    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      const updatedData = {
        ...editingRecord,
        leaveType: 'สาย',
        startDate: editingRecord.startDate,
        endDate: editingRecord.endDate,
        totalDays: durationDays,
        days: durationDays,
        reason: editingRecord.reason || 'มาสาย',
        updatedAt: new Date().toISOString(),
      };

      await saveLeaveRecord(updatedData, currentUser);
      setSaveSuccessMsg(`บันทึกข้อมูลของ ${editingRecord.personnelName} เรียบร้อยแล้ว`);
      if (onSaved) onSaved(updatedData);

      setTimeout(() => {
        setEditingRecord(null);
        setSaveSuccessMsg(null);
      }, 900);
    } catch (err) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async (id, personnelName) => {
    try {
      await deleteLeaveRecord(id, currentUser);
      if (onDeleted) onDeleted(id, personnelName);
      setLeaveToDelete(null);
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '920px',
            width: '95%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3)',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
              padding: '1.25rem 1.5rem',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
                }}
              >
                <Clock size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                    จัดการและแก้ไขรายการมาสาย (Late Records Management)
                  </h3>
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.25)',
                      color: '#FECACA',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                    }}
                  >
                    Admin Only
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                  ตรวจสอบรายการมาสายของบุคลากรรายบุคคล และแก้ไขวันที่เริ่มต้น วันที่สิ้นสุด หรือระยะเวลาทั้งหมด
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-close"
              type="button"
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              padding: '1rem 1.5rem',
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #EF4444',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                จำนวนรายการมาสายทั้งหมด
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>
                {stats.totalRecords}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>รายการ</span>
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #F59E0B',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                รวมระยะเวลาทั้งหมด
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706', marginTop: '2px' }}>
                {stats.totalDays}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>วัน / ครั้ง</span>
              </div>
            </div>

            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #3B82F6',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                บุคลากรที่เคยมาสาย
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
                {stats.uniquePersonnel}{' '}
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>ท่าน</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div
            style={{
              padding: '0.85rem 1.5rem',
              background: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                  }}
                />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, ฝ่ายงาน, หรือเหตุผล..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '32px',
                    paddingRight: '10px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    fontSize: '0.825rem',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                />
              </div>

              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                style={{
                  padding: '6px 10px',
                  fontSize: '0.825rem',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  outline: 'none',
                }}
              >
                <option value="ALL">🏢 ทุกฝ่ายงาน</option>
                {PREDEFINED_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                style={{
                  padding: '6px 10px',
                  fontSize: '0.825rem',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  outline: 'none',
                }}
              >
                <option value="ALL">📅 ทุกปี</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    ปี {y + 543} ({y})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.785rem', color: '#64748B' }}>
              แสดง <strong>{filteredLateLeaves.length}</strong> จาก <strong>{lateLeaves.length}</strong> รายการ
            </div>
          </div>

          {/* Edit Drawer / Modal Form when editing */}
          {editingRecord && (
            <form
              onSubmit={handleSaveEdit}
              style={{
                padding: '1.25rem 1.5rem',
                background: '#FFF7ED',
                borderBottom: '2px solid #F97316',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: '#F97316',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Edit2 size={15} />
                  </div>
                  <strong style={{ fontSize: '0.95rem', color: '#9A3412' }}>
                    แก้ไขรายการมาสาย: {editingRecord.personnelName} ({editingRecord.department || '-'})
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#9A3412',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  ปิดหน้าแก้ไข
                </button>
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '6px',
                    color: '#DC2626',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {saveSuccessMsg && (
                <div
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: '#ECFDF5',
                    border: '1px solid #6EE7B7',
                    borderRadius: '6px',
                    color: '#059669',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="grid-3" style={{ gap: '1rem' }}>
                {/* วันที่เริ่มต้น */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9A3412' }}>
                    วันที่เริ่มต้น (Start Date) *
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#FFFFFF',
                      border: '1.5px solid #FDBA74',
                      borderRadius: '8px',
                      padding: '0 8px',
                    }}
                  >
                    <Calendar size={15} color="#F97316" />
                    <input
                      type="date"
                      value={editingRecord.startDate}
                      onChange={(e) => setEditingRecord({ ...editingRecord, startDate: e.target.value })}
                      required
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: 'transparent',
                      }}
                    />
                  </div>
                </div>

                {/* วันที่สิ้นสุด */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9A3412' }}>
                    วันที่สิ้นสุด (End Date) *
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#FFFFFF',
                      border: '1.5px solid #FDBA74',
                      borderRadius: '8px',
                      padding: '0 8px',
                    }}
                  >
                    <Calendar size={15} color="#F97316" />
                    <input
                      type="date"
                      value={editingRecord.endDate}
                      onChange={(e) => setEditingRecord({ ...editingRecord, endDate: e.target.value })}
                      required
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: 'transparent',
                      }}
                    />
                  </div>
                </div>

                {/* ระยะเวลาทั้งหมด */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9A3412' }}>
                    ระยะเวลาทั้งหมด (Total Duration) *
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#FFFFFF',
                      border: '1.5px solid #FDBA74',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <input
                      type="number"
                      min="0.1"
                      max="365"
                      step="0.1"
                      value={editingRecord.totalDays}
                      onChange={(e) => setEditingRecord({ ...editingRecord, totalDays: e.target.value })}
                      required
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        background: 'transparent',
                      }}
                    />
                    <div
                      style={{
                        padding: '6px 10px',
                        background: '#FFF7ED',
                        borderLeft: '1px solid #FED7AA',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#EA580C',
                      }}
                    >
                      วัน
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    placeholder="เหตุผล / บันทึกเพิ่มเติม (เช่น ติดภารกิจ, รถติด ฯลฯ)"
                    value={editingRecord.reason}
                    onChange={(e) => setEditingRecord({ ...editingRecord, reason: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '0.825rem',
                      border: '1px solid #FDBA74',
                      borderRadius: '6px',
                      background: '#FFFFFF',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn btn-primary btn-sm"
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Save size={14} />
                    <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* List Table Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {filteredLateLeaves.length === 0 ? (
              <div
                style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1.5px dashed #CBD5E1',
                  color: '#64748B',
                }}
              >
                <Clock size={36} color="#94A3B8" style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                  ไม่พบรายการมาสาย
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                  {lateLeaves.length === 0
                    ? 'ไม่มีบันทึกข้อมูลการมาสายในระบบ'
                    : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา/ตัวกรอง'}
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', borderBottom: '1.5px solid #CBD5E1' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px', color: '#475569' }}>
                        #
                      </th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>
                        ชื่อ - นามสกุล
                      </th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>
                        ฝ่ายงาน
                      </th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569', fontWeight: 700, width: '170px' }}>
                        ช่วงวันที่มาสาย
                      </th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569', fontWeight: 700, width: '110px' }}>
                        ระยะเวลาทั้งหมด
                      </th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>
                        เหตุผล / หมายเหตุ
                      </th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', color: '#475569', fontWeight: 700, width: '110px' }}>
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLateLeaves.map((record, idx) => {
                      const isSameDay = record.startDate === record.endDate;
                      const dateRangeDisplay = isSameDay
                        ? formatThaiDate(record.startDate)
                        : `${formatThaiDate(record.startDate)} - ${formatThaiDate(record.endDate)}`;
                      const isCurrentEditing = editingRecord?.id === record.id;

                      return (
                        <tr
                          key={record.id || idx}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: isCurrentEditing
                              ? '#FFF7ED'
                              : idx % 2 === 0
                              ? '#FFFFFF'
                              : '#F8FAFC',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '9px 12px', textAlign: 'center', color: '#64748B', fontSize: '0.775rem' }}>
                            {idx + 1}
                          </td>

                          <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0F172A' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <User size={14} color="#64748B" />
                              <span>{record.personnelName || record.personnelEmail || '-'}</span>
                            </div>
                          </td>

                          <td style={{ padding: '9px 12px', color: '#475569', fontSize: '0.785rem' }}>
                            {record.department || '-'}
                          </td>

                          <td style={{ padding: '9px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                background: '#FEF2F2',
                                color: '#DC2626',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                border: '1px solid #FEE2E2',
                              }}
                            >
                              {dateRangeDisplay}
                            </span>
                          </td>

                          <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '3px 9px',
                                background: '#FFFBEB',
                                color: '#B45309',
                                borderRadius: '999px',
                                fontSize: '0.785rem',
                                fontWeight: 800,
                                border: '1px solid #FDE68A',
                              }}
                            >
                              {record.totalDays || record.days || 1} วัน
                            </span>
                          </td>

                          <td style={{ padding: '9px 12px', color: '#64748B', fontSize: '0.775rem' }}>
                            {record.reason || 'มาสาย'}
                          </td>

                          <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(record)}
                                title="แก้ไข วันที่เริ่มต้น, สิ้นสุด และระยะเวลา"
                                style={{
                                  padding: '4px 8px',
                                  background: '#EFF6FF',
                                  border: '1px solid #BFDBFE',
                                  borderRadius: '6px',
                                  color: '#2563EB',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Edit2 size={13} />
                                <span>แก้ไข</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setLeaveToDelete(record)}
                                title="ลบรายการนี้"
                                style={{
                                  padding: '4px 6px',
                                  background: '#FEF2F2',
                                  border: '1px solid #FECACA',
                                  borderRadius: '6px',
                                  color: '#DC2626',
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '0.785rem', color: '#64748B' }}>
              💡 การแก้ไขรายการมาสายจะมีผลต่อสถิติการจำกัดการลาและบันทึกลง Cloud Firestore ทันที
            </div>

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

      {/* Delete Confirmation Modal */}
      {leaveToDelete && (
        <LeaveDeleteModal
          isOpen={true}
          leaveId={leaveToDelete.id}
          personnelName={leaveToDelete.personnelName}
          onClose={() => setLeaveToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}
