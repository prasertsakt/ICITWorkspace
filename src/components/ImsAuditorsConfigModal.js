'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Users,
  ShieldCheck,
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { getAvailableFiscalYears } from '@/lib/dateUtils';
import { subscribeExecutiveList } from '@/lib/storageService';

export default function ImsAuditorsConfigModal({
  isOpen,
  onClose,
  onSave,
  currentYear = '2569',
  yearlyConfig = null,
  personnelList = [],
  executiveList: propExecutiveList = [],
}) {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [internalExecutives, setInternalExecutives] = useState([]);
  const [mrList, setMrList] = useState([]);
  const [leadAuditorId, setLeadAuditorId] = useState('');
  const [leadAuditorName, setLeadAuditorName] = useState('');
  const [leadAuditorEmail, setLeadAuditorEmail] = useState('');
  const [dccId, setDccId] = useState('');
  const [dccName, setDccName] = useState('');
  const [dccEmail, setDccEmail] = useState('');
  const [appointmentOrderUrl, setAppointmentOrderUrl] = useState('');
  const [selectedAuditorIds, setSelectedAuditorIds] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Subscribe to executives list
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeExecutiveList((list) => {
      setInternalExecutives(list || []);
    });
    return () => {
      unsub();
    };
  }, [isOpen]);

  // Compute list of executives only (from executiveList and personnel with executive position/department)
  const executiveOnlyList = useMemo(() => {
    const list = [];
    const seenNames = new Set();
    const seenIds = new Set();

    const rawExecs =
      propExecutiveList && propExecutiveList.length > 0
        ? propExecutiveList
        : internalExecutives;

    // 1. Items from executive collection
    (rawExecs || []).forEach((exec) => {
      const matchedPerson = personnelList.find(
        (p) =>
          (exec.personnelId && p.id === exec.personnelId) ||
          (exec.email && p.email && p.email.toLowerCase() === exec.email.toLowerCase()) ||
          (exec.name && p.name && p.name.trim() === exec.name.trim())
      );
      const id = matchedPerson?.id || exec.personnelId || exec.id;
      const name = (exec.name || matchedPerson?.name || '').trim();
      const email = matchedPerson?.email || exec.email || '';
      const position = exec.position || matchedPerson?.position || 'ผู้บริหาร';

      if (name && !seenNames.has(name)) {
        seenNames.add(name);
        if (id) seenIds.add(id);
        list.push({
          id,
          name,
          email,
          position,
          avatarUrl: exec.avatarUrl || matchedPerson?.avatarUrl || '',
        });
      }
    });

    // 2. Items from personnelList where position or department is executive
    (personnelList || []).forEach((p) => {
      const isExec =
        p.department === 'คณะผู้บริหาร' ||
        p.department === 'ผู้บริหาร' ||
        p.position === 'ผู้บริหาร' ||
        p.isExecutive === true ||
        p.role === 'EXECUTIVE';

      const name = (p.name || '').trim();
      if (isExec && name && !seenNames.has(name) && !seenIds.has(p.id)) {
        seenNames.add(name);
        seenIds.add(p.id);
        list.push({
          id: p.id,
          name,
          email: p.email || '',
          position: p.position || 'ผู้บริหาร',
          avatarUrl: p.avatarUrl || '',
        });
      }
    });

    return list;
  }, [propExecutiveList, internalExecutives, personnelList]);

  useEffect(() => {
    if (yearlyConfig) {
      setSelectedYear(yearlyConfig.year || currentYear);

      // Support array of MRs or legacy single MR
      if (Array.isArray(yearlyConfig.mrList) && yearlyConfig.mrList.length > 0) {
        setMrList(
          yearlyConfig.mrList.map((m) => ({
            id: m.id || '',
            name: m.name || '',
            email: m.email || '',
            position: m.position || '',
          }))
        );
      } else if (yearlyConfig.mrId || yearlyConfig.mrName) {
        setMrList([
          {
            id: yearlyConfig.mrId || '',
            name: yearlyConfig.mrName || '',
            email: yearlyConfig.mrEmail || '',
            position: '',
          },
        ]);
      } else {
        setMrList([]);
      }

      setLeadAuditorId(yearlyConfig.leadAuditorId || '');
      setLeadAuditorName(yearlyConfig.leadAuditorName || '');
      setLeadAuditorEmail(yearlyConfig.leadAuditorEmail || '');
      setDccId(yearlyConfig.dccId || '');
      setDccName(yearlyConfig.dccName || '');
      setDccEmail(yearlyConfig.dccEmail || '');
      setAppointmentOrderUrl(yearlyConfig.appointmentOrderUrl || '');
      // Get auditor IDs
      const ids =
        yearlyConfig.auditorIds ||
        (yearlyConfig.auditors ? yearlyConfig.auditors.map((a) => a.id) : []);
      setSelectedAuditorIds(ids);
    } else {
      setSelectedYear(currentYear);
      setMrList([]);
      setLeadAuditorId('');
      setLeadAuditorName('');
      setLeadAuditorEmail('');
      setDccId('');
      setDccName('');
      setDccEmail('');
      setAppointmentOrderUrl('');
      setSelectedAuditorIds([]);
    }
    setErrorMsg('');
  }, [yearlyConfig, currentYear, isOpen]);

  if (!isOpen) return null;

  const handleAddMr = () => {
    setMrList((prev) => [...prev, { id: '', name: '', email: '', position: '' }]);
  };

  const handleRemoveMr = (index) => {
    setMrList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSelectMr = (index, selectedValue) => {
    const exec = executiveOnlyList.find(
      (e) => (e.id && e.id === selectedValue) || e.name === selectedValue
    );

    setMrList((prev) => {
      const next = [...prev];
      if (exec) {
        next[index] = {
          id: exec.id || '',
          name: exec.name || '',
          email: exec.email || '',
          position: exec.position || '',
        };
      } else {
        const fallbackPerson = personnelList.find(
          (p) => p.id === selectedValue || p.name === selectedValue
        );
        if (fallbackPerson) {
          next[index] = {
            id: fallbackPerson.id,
            name: fallbackPerson.name,
            email: fallbackPerson.email || '',
            position: fallbackPerson.position || '',
          };
        } else {
          next[index] = { id: '', name: '', email: '', position: '' };
        }
      }
      return next;
    });
  };

  const handleLeadChange = (e) => {
    const personId = e.target.value;
    const person = personnelList.find((p) => p.id === personId);
    setLeadAuditorId(personId);
    setLeadAuditorName(person ? person.name : '');
    setLeadAuditorEmail(person ? person.email : '');
  };

  const handleDccChange = (e) => {
    const personId = e.target.value;
    const person = personnelList.find((p) => p.id === personId);
    setDccId(personId);
    setDccName(person ? person.name : '');
    setDccEmail(person ? person.email : '');
  };

  const toggleAuditor = (personId) => {
    setSelectedAuditorIds((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!leadAuditorName && !leadAuditorId) {
      setErrorMsg('กรุณาระบุ Lead Internal Auditor ประจำปีงบประมาณ');
      return;
    }

    setIsSubmitting(true);
    try {
      // Map full auditor objects
      const auditors = personnelList
        .filter((p) => selectedAuditorIds.includes(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          department: p.department || '',
          position: p.position || '',
        }));

      // Filter and clean MR list
      const cleanedMrList = mrList
        .filter((m) => m && (m.id || m.name))
        .map((m) => {
          const matched =
            executiveOnlyList.find((e) => (e.id && e.id === m.id) || e.name === m.name) ||
            personnelList.find((p) => p.id === m.id || p.name === m.name);
          return {
            id: m.id || matched?.id || '',
            name: m.name || matched?.name || '',
            email: m.email || matched?.email || '',
            position: m.position || matched?.position || '',
          };
        });

      const mrIds = cleanedMrList.map((m) => m.id).filter(Boolean);
      const mrNames = cleanedMrList.map((m) => m.name).filter(Boolean);
      const mrEmails = cleanedMrList.map((m) => m.email).filter(Boolean);

      await onSave(selectedYear, {
        year: selectedYear,
        mrList: cleanedMrList,
        mrIds,
        // Backward compatibility
        mrId: cleanedMrList[0]?.id || '',
        mrName: mrNames.join(', '),
        mrEmail: cleanedMrList[0]?.email || '',
        leadAuditorId,
        leadAuditorName,
        leadAuditorEmail,
        dccId,
        dccName,
        dccEmail,
        appointmentOrderUrl: appointmentOrderUrl ? appointmentOrderUrl.trim() : '',
        auditorIds: selectedAuditorIds,
        auditors,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกรายชื่อผู้ตรวจ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPersonnel = personnelList.filter((p) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '1.25rem',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              <Users size={22} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                กำหนดรายชื่อผู้ตรวจติดตามภายใน (Internal Auditors)
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#E0F2FE', margin: '2px 0 0 0' }}>
                กำหนดสิทธิ์เฉพาะบุคลากรที่ได้รับมอบหมายในการสร้างและประเมินรายงาน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row: ปีงบประมาณ / รอบตรวจ */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '0.35rem',
              }}
            >
              ปีงบประมาณ (Fiscal Year) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: '#F8FAFC',
              }}
            >
              {getAvailableFiscalYears(2568, 1, true).map((y) => (
                <option key={y} value={y}>
                  ปีงบประมาณ {y}
                </option>
              ))}
            </select>
          </div>

          {/* Row: MR (Management Representative) - Multiple allowed, list only executives */}
          <div
            style={{
              padding: '1.15rem',
              borderRadius: '12px',
              background: '#FAF5FF',
              border: '1.5px solid #DDD6FE',
              marginBottom: '1.25rem',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.4rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.925rem',
                  fontWeight: 700,
                  color: '#5B21B6',
                }}
              >
                <ShieldCheck size={18} color="#7C3AED" />
                <span>ตัวแทนฝ่ายบริหาร (MR - Management Representative)</span>
              </label>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: '999px',
                  background: '#EDE9FE',
                  color: '#6D28D9',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                }}
              >
                {mrList.filter((m) => m.id || m.name).length} ท่าน
              </span>
            </div>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#6B21A8', lineHeight: 1.5 }}>
              ผู้มีอำนาจกำกับดูแลระบบบริหารงานคุณภาพ (IMS) สามารถเพิ่มได้มากกว่า 1 ท่าน (คัดกรองเฉพาะรายชื่อคณะผู้บริหาร)
            </p>

            {/* MR List Cards */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                marginBottom: '0.75rem',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {mrList.length === 0 ? (
                <div
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    border: '1px dashed #DDD6FE',
                    color: '#7C3AED',
                    fontSize: '0.85rem',
                  }}
                >
                  ยังไม่ได้กำหนดตัวแทนฝ่ายบริหาร (MR) — กดปุ่ม <strong>"+ เพิ่มตัวแทนฝ่ายบริหาร"</strong> ด้านล่างเพื่อเลือก
                </div>
              ) : (
                mrList.map((mrItem, idx) => {
                  const currentValue = mrItem.id || mrItem.name || '';
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#FFFFFF',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '8px',
                        border: '1px solid #C4B5FD',
                        boxShadow: '0 1px 2px rgba(124, 58, 237, 0.05)',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: '#EDE9FE',
                          color: '#6D28D9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>

                      <select
                        value={currentValue}
                        onChange={(e) => handleSelectMr(idx, e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          width: '100%',
                          padding: '0.55rem 0.65rem',
                          borderRadius: '6px',
                          border: '1px solid #DDD6FE',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          background: '#FFFFFF',
                          color: '#5B21B6',
                          boxSizing: 'border-box',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
                      >
                        <option value="">-- เลือกตัวแทนฝ่ายบริหาร (MR) จากคณะผู้บริหาร --</option>
                        {/* Fallback option if current assigned value is not in executiveOnlyList */}
                        {mrItem.name &&
                          !executiveOnlyList.some(
                            (e) => (e.id && e.id === mrItem.id) || e.name === mrItem.name
                          ) && (
                            <option value={currentValue}>
                              {mrItem.name} {mrItem.position ? `(${mrItem.position})` : ''} (กำหนดไว้ปัจจุบัน)
                            </option>
                          )}
                        {executiveOnlyList.map((exec) => {
                          const val = exec.id || exec.name;
                          // Disable if already chosen in another row
                          const isChosenElsewhere = mrList.some(
                            (m, otherIdx) =>
                              otherIdx !== idx &&
                              ((m.id && m.id === exec.id) || (m.name && m.name === exec.name))
                          );
                          return (
                            <option key={val} value={val} disabled={isChosenElsewhere}>
                              {exec.name} {exec.position ? `(${exec.position})` : ''}{' '}
                              {isChosenElsewhere ? '— [เลือกแล้ว]' : ''}
                            </option>
                          );
                        })}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveMr(idx)}
                        style={{
                          background: '#FEE2E2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'background 0.15s ease',
                        }}
                        title="ลบผู้บริหารท่านนี้ออกจาก MR"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Button: + เพิ่มตัวแทนฝ่ายบริหาร */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={handleAddMr}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px dashed #7C3AED',
                  background: '#EDE9FE',
                  color: '#6D28D9',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={16} />
                <span>+ เพิ่มตัวแทนฝ่ายบริหาร</span>
              </button>

              {executiveOnlyList.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: '#9333EA', fontStyle: 'italic' }}>
                  * ยังไม่พบคณะผู้บริหารในระบบ กรุณาเพิ่มข้อมูลผู้บริหารในหน้าองค์กร/Admin
                </span>
              )}
            </div>
          </div>

          {/* Row: Lead Internal Auditor */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              background: '#F0F9FF',
              border: '1.5px solid #BAE6FD',
              marginBottom: '1.25rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#0369A1',
                marginBottom: '0.4rem',
              }}
            >
              <ShieldCheck size={18} color="#0284C7" />
              <span>หัวหน้าทีมผู้ตรวจติดตาม (Lead Internal Auditor)</span>
              <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#0369A1' }}>
              มีอำนาจในการตรวจสอบและกด Approved แผนการตรวจติดตาม ก่อนให้เริ่มการตรวจจริง
            </p>
            <select
              value={leadAuditorId}
              onChange={handleLeadChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #0284C7',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: '#FFFFFF',
                color: '#0369A1',
              }}
              required
            >
              <option value="">-- เลือกหัวหน้าทีมผู้ตรวจ (Lead Auditor) --</option>
              {personnelList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.department ? `(${p.department})` : ''}
                </option>
              ))}
            </select>
            {!leadAuditorId && leadAuditorName && (
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                กำหนดไว้ปัจจุบัน: {leadAuditorName}
              </p>
            )}
          </div>

          {/* Row: DCC (ผู้ควบคุมเอกสาร) */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              background: '#F0FDF4',
              border: '1.5px solid #BBF7D0',
              marginBottom: '1.25rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#166534',
                marginBottom: '0.4rem',
              }}
            >
              <FileText size={18} color="#16A34A" />
              <span>ผู้ควบคุมเอกสาร (DCC - Document Control Center)</span>
            </label>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#166534' }}>
              มีสิทธิ์ในการแก้ไขและลบรายการรายงานการตรวจติดตามภายในทุกรายการในระบบ
            </p>
            <select
              value={dccId}
              onChange={handleDccChange}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #16A34A',
                fontSize: '0.95rem',
                fontWeight: 600,
                background: '#FFFFFF',
                color: '#166534',
              }}
            >
              <option value="">-- เลือกผู้ควบคุมเอกสาร (DCC) จากรายชื่อบุคลากร --</option>
              {personnelList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.department ? `(${p.department})` : ''}
                </option>
              ))}
            </select>
            {!dccId && dccName && (
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                กำหนดไว้ปัจจุบัน: {dccName}
              </p>
            )}
          </div>

          {/* Row: ทีมผู้ตรวจติดตามภายใน (Internal Auditors) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#334155',
                }}
              >
                <UserCheck size={18} color="#0D9488" />
                <span>คณะผู้ตรวจติดตามภายใน (Internal Auditors ประจำปีงบประมาณ {selectedYear})</span>
              </label>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#E2E8F0',
                  color: '#475569',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                }}
              >
                เลือกแล้ว {selectedAuditorIds.length} ท่าน
              </span>
            </div>

            {/* Quick search input */}
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <Search
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '10px', top: '10px' }}
              />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือฝ่ายเพื่อเลือกผู้ตรวจ..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Personnel Multi-selection Checklist */}
            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                background: '#FAFAFA',
              }}
            >
              {filteredPersonnel.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                  ไม่พบบุคลากรที่ค้นหา
                </div>
              ) : (
                filteredPersonnel.map((p) => {
                  const isChecked = selectedAuditorIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      onClick={() => toggleAuditor(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        background: isChecked ? '#F0FDF4' : '#FFFFFF',
                        border: `1px solid ${isChecked ? '#86EFAC' : '#E2E8F0'}`,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by label onClick
                        style={{ width: '16px', height: '16px', accentColor: '#16A34A' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {p.department || 'ไม่ระบุฝ่าย'} • {p.position || 'บุคลากร'}
                        </div>
                      </div>
                      {isChecked && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#16A34A',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={14} /> ผู้ตรวจ
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Row: ลิงก์คำสั่งแต่งตั้งคณะผู้ตรวจติดตาม (Google Drive Shared Link) (Optional) */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.4rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#334155',
                }}
              >
                <Link2 size={18} color="#0284C7" />
                <span>ลิงก์คำสั่งแต่งตั้ง (Google Drive Shared Link)</span>
                <span style={{ fontSize: '0.775rem', fontWeight: 500, color: '#64748B' }}>
                  (ไม่บังคับ / Optional)
                </span>
              </label>
              {appointmentOrderUrl && (
                <a
                  href={appointmentOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#0284C7',
                    textDecoration: 'none',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#E0F2FE',
                    border: '1px solid #BAE6FD',
                  }}
                >
                  <ExternalLink size={12} />
                  <span>ทดสอบเปิดลิงก์</span>
                </a>
              )}
            </div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748B' }}>
              แชร์ลิงก์ไฟล์คำสั่งแต่งตั้งคณะผู้ตรวจติดตามประจำปีงบประมาณ เช่น ลิงก์ PDF ใน Google Drive เพื่อให้ผู้ใช้งานสามารถคลิกเปิดดูเอกสารคำสั่งฉบับเต็มได้
            </p>
            <div style={{ position: 'relative' }}>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/... หรือ ลิงก์คำสั่งแต่งตั้ง"
                value={appointmentOrderUrl}
                onChange={(e) => setAppointmentOrderUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  background: '#FFFFFF',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.75rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)',
              }}
            >
              <Save size={16} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการกำหนดผู้ตรวจ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
