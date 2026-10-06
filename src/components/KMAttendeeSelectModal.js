'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Users, Check, UserCheck, Building2, UserX } from 'lucide-react';
import { MAIN_6_DEPTS } from '@/lib/constants';

export default function KMAttendeeSelectModal({
  isOpen,
  onClose,
  onConfirm,
  personnelList = [],
  executiveList = [],
  initialSelected = [],
}) {
  const [selectedPersonnel, setSelectedPersonnel] = useState(initialSelected || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  if (!isOpen) return null;

  // Filter out executives and advisors
  const isExcluded = (p) => {
    if (!p) return true;
    if (p.status === 'ลาออก') return true;

    // 1. Executive
    if (p.isExecutive) return true;
    const dept = (p.department || '').trim();
    if (dept === 'คณะผู้บริหาร' || dept === 'ผู้บริหาร' || dept.includes('คณะผู้บริหาร')) return true;

    const pos = (p.position || p.adminPosition || '').trim();
    if (
      pos.includes('ผู้บริหาร') ||
      pos.includes('ผู้อำนวยการ') ||
      pos.includes('รองผู้อำนวยการ')
    ) return true;

    const inExecList = (executiveList || []).some(
      (e) =>
        (e.id && e.id === p.id) ||
        (e.name && p.name && e.name.trim() === p.name.trim()) ||
        (e.email && p.email && e.email.trim().toLowerCase() === p.email.trim().toLowerCase())
    );
    if (inExecList) return true;

    // 2. Advisor
    if (p.isAdvisor) return true;
    if (
      pos.includes('ที่ปรึกษา') ||
      (p.role || '').includes('ที่ปรึกษา') ||
      (p.name || '').includes('ที่ปรึกษา') ||
      dept.includes('ที่ปรึกษา')
    ) return true;

    return false;
  };

  const eligiblePersonnel = useMemo(() => {
    return (personnelList || []).filter((p) => !isExcluded(p));
  }, [personnelList, executiveList]);

  // Filtered personnel by search and department
  const filteredList = useMemo(() => {
    return eligiblePersonnel.filter((p) => {
      if (selectedDept !== 'ALL' && p.department !== selectedDept) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mName = (p.name || '').toLowerCase().includes(q);
        const mPos = (p.position || '').toLowerCase().includes(q);
        const mDept = (p.department || '').toLowerCase().includes(q);
        const mEmail = (p.email || '').toLowerCase().includes(q);
        return mName || mPos || mDept || mEmail;
      }
      return true;
    });
  }, [eligiblePersonnel, selectedDept, searchQuery]);

  const isSelected = (pId) => {
    return selectedPersonnel.some((item) => (item.id && item.id === pId) || (item.email && item.email === pId));
  };

  const handleTogglePerson = (p) => {
    setSelectedPersonnel((prev) => {
      const exists = prev.some((item) => item.id === p.id || (item.email && item.email === p.email));
      if (exists) {
        return prev.filter((item) => !(item.id === p.id || (item.email && item.email === p.email)));
      } else {
        return [
          ...prev,
          {
            id: p.id,
            name: p.name,
            email: p.email || '',
            department: p.department || '',
            position: p.position || 'บุคลากร',
          },
        ];
      }
    });
  };

  const handleSelectAllVisible = () => {
    const existingIds = new Set(selectedPersonnel.map((p) => p.id || p.email));
    const toAdd = filteredList
      .filter((p) => !existingIds.has(p.id) && !existingIds.has(p.email))
      .map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email || '',
        department: p.department || '',
        position: p.position || 'บุคลากร',
      }));
    setSelectedPersonnel((prev) => [...prev, ...toAdd]);
  };

  const handleClearAll = () => {
    setSelectedPersonnel([]);
  };

  const handleRemoveChip = (pId) => {
    setSelectedPersonnel((prev) => prev.filter((item) => item.id !== pId && item.email !== pId));
  };

  const handleConfirmSelection = () => {
    onConfirm(selectedPersonnel);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 11000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '94vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.5rem',
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
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                เลือกรายชื่อผู้เข้าอบรม (ไม่รวมผู้บริหาร)
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>
                สามารถเลือกบุคลากรเป้าหมายที่เข้าร่วมการอบรม/สัมมนาได้มากกว่า 1 คน
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

        {/* Search & Selected Attendees Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flexShrink: 0,
          }}
        >
          {/* Search Input & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ, ตำแหน่ง, อีเมล..."
                className="form-input"
                style={{ paddingLeft: '2.25rem', height: '38px', fontSize: '0.85rem' }}
              />
            </div>

            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.775rem', height: '38px', padding: '0 10px' }}
            >
              เลือกทั้งหมดที่แสดง
            </button>

            {selectedPersonnel.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.775rem', height: '38px', color: '#DC2626' }}
              >
                ล้างที่เลือก ({selectedPersonnel.length})
              </button>
            )}
          </div>

          {/* Department Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedDept('ALL')}
              style={{
                padding: '4px 10px',
                borderRadius: '20px',
                border: selectedDept === 'ALL' ? '1.5px solid #059669' : '1px solid #CBD5E1',
                background: selectedDept === 'ALL' ? '#ECFDF5' : '#FFFFFF',
                color: selectedDept === 'ALL' ? '#065F46' : '#64748B',
                fontSize: '0.75rem',
                fontWeight: selectedDept === 'ALL' ? 800 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ทั้งหมด ({eligiblePersonnel.length})
            </button>
            {MAIN_6_DEPTS.map((deptName) => {
              const count = eligiblePersonnel.filter((p) => p.department === deptName).length;
              const isSel = selectedDept === deptName;
              return (
                <button
                  key={deptName}
                  type="button"
                  onClick={() => setSelectedDept(deptName)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: isSel ? '1.5px solid #059669' : '1px solid #CBD5E1',
                    background: isSel ? '#ECFDF5' : '#FFFFFF',
                    color: isSel ? '#065F46' : '#64748B',
                    fontSize: '0.75rem',
                    fontWeight: isSel ? 800 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {deptName} ({count})
                </button>
              );
            })}
          </div>

          {/* Selected Attendees Chips */}
          {selectedPersonnel.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                maxHeight: '80px',
                overflowY: 'auto',
                padding: '6px',
                background: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
                <UserCheck size={14} />
                <span>เลือกแล้ว ({selectedPersonnel.length} คน):</span>
              </div>
              {selectedPersonnel.map((p) => (
                <span
                  key={p.id || p.email}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  <span>{p.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(p.id || p.email)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#059669',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Personnel List Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '8px',
          }}
        >
          {filteredList.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8' }}>
              <UserX size={32} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
              <div>ไม่พบบุคลากรที่ตรงกับเงื่อนไขการค้นหา</div>
            </div>
          ) : (
            filteredList.map((p) => {
              const selected = isSelected(p.id || p.email);
              return (
                <div
                  key={p.id || p.email}
                  onClick={() => handleTogglePerson(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: selected ? '2px solid #059669' : '1px solid #E2E8F0',
                    background: selected ? '#ECFDF5' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: selected ? '#059669' : '#F1F5F9',
                        color: selected ? '#FFFFFF' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      {selected ? <Check size={16} /> : (p.name || 'บ')[0]}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: selected ? '#065F46' : '#1E293B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.725rem',
                          color: '#64748B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.position || 'บุคลากร'} • {p.department || 'สำนัก'}
                      </div>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {}} // Handled by div onClick
                    style={{
                      accentColor: '#059669',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
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
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
            เลือกแล้ว <strong style={{ color: '#059669' }}>{selectedPersonnel.length}</strong> ท่าน
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirmSelection}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
              }}
            >
              <Check size={16} />
              <span>ยืนยันผู้เข้าอบรม ({selectedPersonnel.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
