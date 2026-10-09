'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Users,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  FileSpreadsheet,
  Download,
  Building2,
  Briefcase,
  Layers,
  ArrowUpDown,
  ExternalLink,
  Mail,
  Send,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { LEAVE_TYPE_CONFIG, PREDEFINED_DEPARTMENTS } from '@/lib/constants';
import { formatLocalDate } from '@/lib/dateUtils';
import {
  sendLeaveLimitEmailNotification,
  sendBatchLeaveLimitEmailNotifications,
  calculatePersonnelLeaveLimitStats,
  DEFAULT_LEAVE_LIMIT_CONFIG,
} from '@/lib/leaveLimitService';

// Helper to format Thai date
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

export default function LeaveLimitDetailModal({
  isOpen,
  onClose,
  limitStats = null,
  initialFilterStatus = 'AT_RISK', // 'AT_RISK' | 'EXCEEDED' | 'NEAR_LIMIT' | 'ALL' | 'NORMAL'
  currentUser = null,
  leaves = [],
  personnelList = [],
  leaveLimitConfig = DEFAULT_LEAVE_LIMIT_CONFIG,
  selectedYear = 2026,
  selectedCycleKey = 'round_1',
  onCycleChange = null,
}) {
  const [currentCycleKey, setCurrentCycleKey] = useState(selectedCycleKey || limitStats?.selectedCycleKey || 'round_1');
  const [activeStatusFilter, setActiveStatusFilter] = useState(initialFilterStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStaffType, setSelectedStaffType] = useState('ALL'); // 'ALL' | 'พนักงานมหาวิทยาลัย' | 'พนักงานพิเศษ'
  const [expandedPersonIds, setExpandedPersonIds] = useState(new Set());

  // Sync cycle key from props
  useEffect(() => {
    if (selectedCycleKey) {
      setCurrentCycleKey(selectedCycleKey);
    }
  }, [selectedCycleKey]);

  // Recalculate or use limit stats based on selected cycle in modal
  const effectiveLimitStats = useMemo(() => {
    if (leaves && leaves.length > 0 && personnelList && personnelList.length > 0) {
      return calculatePersonnelLeaveLimitStats({
        leaves,
        personnelList,
        config: leaveLimitConfig || DEFAULT_LEAVE_LIMIT_CONFIG,
        fiscalYear: selectedYear,
        selectedCycleKey: currentCycleKey,
      });
    }
    return limitStats;
  }, [leaves, personnelList, leaveLimitConfig, selectedYear, currentCycleKey, limitStats]);

  const handleSelectCycle = (newKey) => {
    setCurrentCycleKey(newKey);
    if (onCycleChange) {
      onCycleChange(newKey);
    }
  };

  // Email Notification States
  const [sendingEmailMap, setSendingEmailMap] = useState({});
  const [sentEmailSuccessMap, setSentEmailSuccessMap] = useState({});
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const [emailModalPerson, setEmailModalPerson] = useState(null);
  const [customEmailNote, setCustomEmailNote] = useState('');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);

  // Reset or initialize status filter when opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveStatusFilter(initialFilterStatus || 'AT_RISK');
      setActionAlert(null);
    }
  }, [isOpen, initialFilterStatus]);

  if (!isOpen || !effectiveLimitStats) return null;

  const { cycleInfo, summary, personnelStats = [] } = effectiveLimitStats;

  const toggleExpand = (personId) => {
    setExpandedPersonIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPersonIds(new Set(filteredPersonnel.map((p) => p.personnelId)));
  };

  const collapseAll = () => {
    setExpandedPersonIds(new Set());
  };

  // Filtered personnel list
  const filteredPersonnel = useMemo(() => {
    return personnelStats.filter((person) => {
      // 1. Status Filter
      if (activeStatusFilter === 'AT_RISK' && person.status === 'NORMAL') return false;
      if (activeStatusFilter === 'EXCEEDED' && person.status !== 'EXCEEDED') return false;
      if (activeStatusFilter === 'NEAR_LIMIT' && person.status !== 'NEAR_LIMIT') return false;
      if (activeStatusFilter === 'NORMAL' && person.status !== 'NORMAL') return false;

      // 2. Staff Type Filter
      if (selectedStaffType !== 'ALL' && person.personnelType !== selectedStaffType) {
        return false;
      }

      // 3. Department Filter
      if (selectedDept !== 'ALL' && person.department !== selectedDept) {
        return false;
      }

      // 4. Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const nameMatch = (person.personnelName || '').toLowerCase().includes(q);
        const posMatch = (person.position || '').toLowerCase().includes(q);
        const deptMatch = (person.department || '').toLowerCase().includes(q);
        const emailMatch = (person.email || '').toLowerCase().includes(q);
        if (!nameMatch && !posMatch && !deptMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [personnelStats, activeStatusFilter, selectedStaffType, selectedDept, searchTerm]);

  // At-risk list with emails for batch notification
  const atRiskWithEmails = useMemo(() => {
    return filteredPersonnel.filter(
      (p) => p.email && (p.status === 'EXCEEDED' || p.status === 'NEAR_LIMIT')
    );
  }, [filteredPersonnel]);

  // Send Single Email
  const handleSendSingleEmail = async (person, customNote = '') => {
    if (!person.email) {
      setActionAlert({
        type: 'error',
        title: 'ไม่สามารถส่งอีเมลได้',
        message: `ไม่พบที่อยู่อีเมลของ ${person.personnelName} ในระบบ`,
      });
      return;
    }

    setSendingEmailMap((prev) => ({ ...prev, [person.personnelId]: true }));
    setActionAlert(null);

    try {
      const res = await sendLeaveLimitEmailNotification({
        personStat: person,
        cycleInfo,
        sender: currentUser,
        customNote,
      });

      if (res.success) {
        setSentEmailSuccessMap((prev) => ({
          ...prev,
          [person.personnelId]: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        }));
        setActionAlert({
          type: 'success',
          title: 'ส่งอีเมลแจ้งเตือนสำเร็จ',
          message: `จัดส่งอีเมลแจ้งเตือนไปยัง ${person.personnelName} (${person.email}) เรียบร้อยแล้ว`,
        });
      } else {
        setActionAlert({
          type: 'error',
          title: 'ส่งอีเมลไม่สำเร็จ',
          message: res.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Mail Relay',
        });
      }
    } catch (err) {
      setActionAlert({
        type: 'error',
        title: 'ส่งอีเมลไม่สำเร็จ',
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      });
    } finally {
      setSendingEmailMap((prev) => ({ ...prev, [person.personnelId]: false }));
      setEmailModalPerson(null);
    }
  };

  // Send Batch Emails
  const handleSendBatchEmails = async () => {
    if (atRiskWithEmails.length === 0) return;

    setIsBatchSending(true);
    setIsBatchModalOpen(false);
    setActionAlert(null);
    setBatchProgress({ current: 0, total: atRiskWithEmails.length, personnelName: '' });

    try {
      const res = await sendBatchLeaveLimitEmailNotifications({
        personnelList: atRiskWithEmails,
        cycleInfo,
        sender: currentUser,
        customNote: customEmailNote,
        onProgress: (progress) => {
          setBatchProgress(progress);
        },
      });

      if (res.success) {
        // Mark all as sent
        const newSuccessMap = { ...sentEmailSuccessMap };
        atRiskWithEmails.forEach((p) => {
          newSuccessMap[p.personnelId] = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        });
        setSentEmailSuccessMap(newSuccessMap);

        setActionAlert({
          type: 'success',
          title: 'ส่งอีเมลแจ้งเตือนสำเร็จครบถ้วน',
          message: `จัดส่งอีเมลแจ้งเตือนถึงบุคลากรที่ต้องเฝ้าระวังสำเร็จ ${res.deliveredCount} จากทั้งหมด ${res.totalCount} ท่าน`,
        });
      } else {
        setActionAlert({
          type: 'warning',
          title: 'การส่งอีเมลเสร็จสิ้นบางส่วน',
          message: `ส่งสำเร็จ ${res.deliveredCount} ท่าน (ล้มเหลว ${res.failedCount} ท่าน)`,
        });
      }
    } catch (err) {
      setActionAlert({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการส่งอีเมล',
        message: err.message || 'เกิดข้อผิดพลาดในการประมวลผล',
      });
    } finally {
      setIsBatchSending(false);
      setBatchProgress(null);
      setCustomEmailNote('');
    }
  };

  // Export CSV of near/exceeded personnel
  const handleExportCSV = () => {
    const headers = [
      'ลำดับ',
      'ชื่อ-นามสกุล',
      'อีเมล',
      'ฝ่ายงาน',
      'ประเภทบุคลากร',
      'สถานะการลา',
      'จำนวนวันลา (วัน)',
      'เพดานวันลา (วัน)',
      '% การใช้วันลา',
      'จำนวนครั้งที่ลา (ครั้ง)',
      'เพดานครั้งที่ลา (ครั้ง)',
      'จำนวนครั้งมาสาย (ครั้ง)',
      'เพดานครั้งมาสาย (ครั้ง)',
      'จำนวนรายการ (รายการ)',
      'สาเหตุการเตือน/เกินเกณฑ์',
    ];

    const rows = filteredPersonnel.map((p, idx) => {
      const statusText =
        p.status === 'EXCEEDED'
          ? 'เกินเกณฑ์กำหนด'
          : p.status === 'NEAR_LIMIT'
          ? 'ใกล้เกินเกณฑ์'
          : 'ปกติ';

      const reasons = (p.alertTriggers || [])
        .map((t) => `${t.metric} (${t.current}/${t.limit} ${t.unit})`)
        .join('; ') || '-';

      return [
        idx + 1,
        `"${p.personnelName}"`,
        `"${p.email || '-'}"`,
        `"${p.department}"`,
        `"${p.personnelType}"`,
        `"${statusText}"`,
        p.totalDays,
        p.limits.maxDays,
        `${p.percentages.daysPercent}%`,
        p.totalTimes,
        p.limits.maxTimes,
        p.totalLateTimes || 0,
        p.limits.maxLate || 18,
        p.totalTransactions,
        `"${reasons}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leave_limit_monitoring_${cycleInfo.key}_${formatLocalDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          width: '96%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            padding: '1.25rem 1.75rem',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: summary.exceededCount > 0
                  ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                  : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              }}
            >
              {summary.exceededCount > 0 ? <AlertOctagon size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                  รายงานตรวจสอบบุคลากรที่ใกล้เกินและเกินเกณฑ์การลา
                </h3>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    borderRadius: '999px',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    padding: '2px 10px',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  {cycleInfo.label}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.825rem', color: 'rgba(255, 255, 255, 0.78)' }}>
                ตรวจสอบรายละเอียดประวัติการลา สถิติการใช้สิทธิ์เทียบเพดาน และส่งอีเมลแจ้งเตือนบุคลากร
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

        {/* Cycle Switcher Bar inside Modal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFF7ED',
            borderBottom: '1px solid #FED7AA',
            padding: '0.65rem 1.25rem',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="#EA580C" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#9A3412' }}>
              เลือกรอบการประเมิน:
            </span>
            <span style={{ fontSize: '0.75rem', color: '#C2410C', fontWeight: 600 }}>
              {cycleInfo.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleSelectCycle('round_1')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: currentCycleKey === 'round_1' ? '1px solid #D97706' : '1px solid rgba(217, 119, 6, 0.25)',
                background: currentCycleKey === 'round_1' ? '#D97706' : '#FFFFFF',
                color: currentCycleKey === 'round_1' ? '#FFFFFF' : '#92400E',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {leaveLimitConfig.cycleMode === 'CUSTOM' ? 'รอบที่ 1 (กำหนดเอง)' : 'รอบที่ 1 (1 ส.ค. - 31 ม.ค.)'}
            </button>
            <button
              type="button"
              onClick={() => handleSelectCycle('round_2')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: currentCycleKey === 'round_2' ? '1px solid #D97706' : '1px solid rgba(217, 119, 6, 0.25)',
                background: currentCycleKey === 'round_2' ? '#D97706' : '#FFFFFF',
                color: currentCycleKey === 'round_2' ? '#FFFFFF' : '#92400E',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {leaveLimitConfig.cycleMode === 'CUSTOM' ? 'รอบที่ 2 (กำหนดเอง)' : 'รอบที่ 2 (1 ก.พ. - 31 ก.ค.)'}
            </button>
            <button
              type="button"
              onClick={() => handleSelectCycle('both_rounds')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: (currentCycleKey === 'both_rounds' || currentCycleKey === 'full_year') ? '1px solid #D97706' : '1px solid rgba(217, 119, 6, 0.25)',
                background: (currentCycleKey === 'both_rounds' || currentCycleKey === 'full_year') ? '#D97706' : '#FFFFFF',
                color: (currentCycleKey === 'both_rounds' || currentCycleKey === 'full_year') ? '#FFFFFF' : '#92400E',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              รอบที่ 1 + รอบที่ 2
            </button>
          </div>
        </div>

        {/* Quick KPI Summary Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '0.75rem 1.25rem',
            gap: '0.75rem',
          }}
        >
          {/* Card A: เกินกำหนด */}
          <div
            onClick={() => setActiveStatusFilter('EXCEEDED')}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: activeStatusFilter === 'EXCEEDED' ? '#FEE2E2' : '#FFFFFF',
              border: activeStatusFilter === 'EXCEEDED' ? '2px solid #EF4444' : '1px solid #FECACA',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626' }}>
                🚨 เกินเกณฑ์กำหนด (Exceeded)
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991B1B' }}>
                {summary.exceededCount}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#B91C1C', marginTop: '2px' }}>
              พม.: {summary.exceededByStaffType?.university || 0} | พษ.: {summary.exceededByStaffType?.special || 0}
            </div>
          </div>

          {/* Card B: ใกล้เกินกำหนด */}
          <div
            onClick={() => setActiveStatusFilter('NEAR_LIMIT')}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: activeStatusFilter === 'NEAR_LIMIT' ? '#FEF3C7' : '#FFFFFF',
              border: activeStatusFilter === 'NEAR_LIMIT' ? '2px solid #F59E0B' : '1px solid #FDE68A',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706' }}>
                ⚠️ ใกล้เกินเกณฑ์ (Near Limit)
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400E' }}>
                {summary.nearLimitCount}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#B45309', marginTop: '2px' }}>
              พม.: {summary.nearLimitByStaffType?.university || 0} | พษ.: {summary.nearLimitByStaffType?.special || 0}
            </div>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionAlert && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: actionAlert.type === 'success' ? '#ECFDF5' : actionAlert.type === 'warning' ? '#FFFBEB' : '#FEF2F2',
              borderBottom: `1px solid ${actionAlert.type === 'success' ? '#6EE7B7' : actionAlert.type === 'warning' ? '#FDE68A' : '#FCA5A5'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {actionAlert.type === 'success' ? (
                <CheckCircle2 size={18} color="#059669" />
              ) : actionAlert.type === 'warning' ? (
                <AlertTriangle size={18} color="#D97706" />
              ) : (
                <AlertCircle size={18} color="#DC2626" />
              )}
              <span style={{ fontSize: '0.825rem', color: actionAlert.type === 'success' ? '#065F46' : actionAlert.type === 'warning' ? '#92400E' : '#991B1B', fontWeight: 600 }}>
                <strong>{actionAlert.title}:</strong> {actionAlert.message}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActionAlert(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Batch Progress Bar */}
        {isBatchSending && batchProgress && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: '#EFF6FF',
              borderBottom: '1px solid #BFDBFE',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#1E40AF', fontWeight: 700 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} className="spin" />
                <span>กำลังส่งอีเมลแจ้งเตือน ({batchProgress.current} จาก {batchProgress.total} ท่าน): {batchProgress.personnelName}</span>
              </span>
              <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#DBEAFE', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                  height: '100%',
                  background: '#2563EB',
                  borderRadius: '999px',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '240px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div
              style={{
                position: 'relative',
                flex: '1 1 220px',
                display: 'flex',
                alignItems: 'center',
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                padding: '0 0.75rem',
                transition: 'all 0.2s ease',
              }}
            >
              <Search size={16} color="#94A3B8" />
              <input
                type="text"
                placeholder="ค้นหาชื่อบุคลากร, ตำแหน่ง, อีเมล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.parentElement.style.borderColor = '#F97316';
                  e.currentTarget.parentElement.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.parentElement.style.borderColor = '#E2E8F0';
                  e.currentTarget.parentElement.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                }}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.5rem',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                fontSize: '0.825rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                minWidth: '160px',
                padding: '0.55rem 0.85rem',
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                transition: 'border 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#F97316')}
              onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
            >
              <option value="ALL">🏢 ทุกฝ่ายงาน</option>
              {PREDEFINED_DEPARTMENTS.filter((d) => d !== 'คณะผู้บริหาร').map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Staff Type Filter */}
            <select
              value={selectedStaffType}
              onChange={(e) => setSelectedStaffType(e.target.value)}
              style={{
                fontSize: '0.825rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                minWidth: '150px',
                padding: '0.55rem 0.85rem',
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                transition: 'border 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#F97316')}
              onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
            >
              <option value="ALL">👥 ทุกประเภทบุคลากร</option>
              <option value="พนักงานมหาวิทยาลัย">🏢 พนักงานมหาวิทยาลัย</option>
              <option value="พนักงานพิเศษ">💼 พนักงานพิเศษ</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Batch Send Email Button */}
            {atRiskWithEmails.length > 0 && (
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(true)}
                disabled={isBatchSending}
                className="btn"
                title="ส่งอีเมลแจ้งเตือนถึงบุคลากรที่ใกล้เกินและเกินเกณฑ์ทุกคนในรอบนี้"
                style={{
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: isBatchSending ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
                }}
              >
                <Mail size={14} />
                <span>ส่งอีเมลแจ้งเตือนทั้งหมด ({atRiskWithEmails.length} ท่าน)</span>
              </button>
            )}

            <button
              type="button"
              onClick={expandAll}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
            >
              ขยายทั้งหมด
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
            >
              ย่อทั้งหมด
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="btn"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.775rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#059669',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <Download size={14} />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* List Body */}
        <div
          className="modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--bg-secondary)',
          }}
        >
          {filteredPersonnel.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3.5rem 1rem',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-color)',
              }}
            >
              <CheckCircle2 size={44} color="#10B981" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                ไม่พบบุคลากรตามเงื่อนไขที่เลือก
              </h4>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                {activeStatusFilter === 'EXCEEDED'
                  ? 'ยอดเยี่ยม! ไม่มีบุคลากรท่านใดลาเกินเกณฑ์ที่กำหนดในรอบนี้'
                  : activeStatusFilter === 'NEAR_LIMIT'
                  ? 'ไม่มีบุคลากรที่แตะเกณฑ์ใกล้เกินในรอบนี้'
                  : 'ลองเปลี่ยนคำค้นหาหรือตัวกรองฝ่ายงาน'}
              </p>
            </div>
          ) : (
            filteredPersonnel.map((person) => {
              const isExpanded = expandedPersonIds.has(person.personnelId);
              const isExceeded = person.status === 'EXCEEDED';
              const isNear = person.status === 'NEAR_LIMIT';
              const isSendingThis = sendingEmailMap[person.personnelId];
              const sentTime = sentEmailSuccessMap[person.personnelId];

              // Color configs
              const cardBorder = isExceeded ? '#EF4444' : isNear ? '#F59E0B' : 'var(--border-color)';
              const badgeBg = isExceeded ? '#FEE2E2' : isNear ? '#FEF3C7' : '#ECFDF5';
              const badgeColor = isExceeded ? '#B91C1C' : isNear ? '#B45309' : '#047857';

              return (
                <div
                  key={person.personnelId}
                  className="card-glass"
                  style={{
                    padding: '1.1rem 1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: `1.5px solid ${cardBorder}`,
                    background: '#FFFFFF',
                    boxShadow: isExceeded
                      ? '0 4px 14px rgba(239, 68, 68, 0.08)'
                      : isNear
                      ? '0 4px 14px rgba(245, 158, 11, 0.08)'
                      : '0 2px 6px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Top Bar: Person Info & Status */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      marginBottom: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: isExceeded ? '#FEE2E2' : isNear ? '#FEF3C7' : 'var(--primary-50)',
                          color: isExceeded ? '#DC2626' : isNear ? '#D97706' : 'var(--primary-600)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1rem',
                        }}
                      >
                        {person.personnelName ? person.personnelName.charAt(0) : <User size={20} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.975rem', color: 'var(--text-primary)' }}>
                            {person.personnelName}
                          </strong>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: person.isSpecialStaff ? '#F3E8FF' : '#E0E7FF',
                              color: person.isSpecialStaff ? '#6B21A8' : '#3730A3',
                            }}
                          >
                            {person.personnelType}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {person.position} &bull; <span>{person.department}</span>
                          {person.email && <span style={{ color: 'var(--text-muted)' }}> &bull; {person.email}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Email Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background: badgeBg,
                            color: badgeColor,
                          }}
                        >
                          {isExceeded ? <AlertOctagon size={13} /> : isNear ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                          <span>
                            {isExceeded ? 'เกินเกณฑ์กำหนด' : isNear ? '⚠️ ใกล้เกินเกณฑ์' : 'ปกติ'}
                          </span>
                        </span>

                        {/* Send Email Button */}
                        {(isExceeded || isNear) && person.email && (
                          <button
                            type="button"
                            onClick={() => setEmailModalPerson(person)}
                            disabled={isSendingThis}
                            className="btn"
                            title={`ส่งอีเมลแจ้งเตือนไปยัง ${person.email}`}
                            style={{
                              padding: '3px 9px',
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: sentTime ? '#ECFDF5' : '#FFF7ED',
                              color: sentTime ? '#059669' : '#EA580C',
                              border: sentTime ? '1px solid #A7F3D0' : '1px solid #FFEDD5',
                              borderRadius: '6px',
                              cursor: isSendingThis ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {isSendingThis ? (
                              <>
                                <RefreshCw size={12} className="spin" />
                                <span>กำลังส่ง...</span>
                              </>
                            ) : sentTime ? (
                              <>
                                <CheckCircle2 size={12} color="#059669" />
                                <span>ส่งแล้ว ({sentTime})</span>
                              </>
                            ) : (
                              <>
                                <Mail size={12} color="#EA580C" />
                                <span>ส่งอีเมลแจ้งเตือน</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {person.alertTriggers && person.alertTriggers.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end' }}>
                          {person.alertTriggers.map((t, tidx) => (
                            <span
                              key={tidx}
                              style={{
                                fontSize: '0.675rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: t.type === 'EXCEEDED' ? '#FEE2E2' : '#FEF3C7',
                                color: t.type === 'EXCEEDED' ? '#DC2626' : '#B45309',
                              }}
                            >
                              {t.metric} {t.current}/{t.limit} {t.unit} ({t.percent}%)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4 Metric Gauges Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: '0.75rem',
                      background: '#F8FAFC',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '0.65rem',
                    }}
                  >
                    {/* Gauge 1: จำนวนวัน */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>1. จำนวนวันลา</span>
                        <strong
                          style={{
                            color: person.flags.isExceededDays ? '#DC2626' : person.flags.isNearDays ? '#D97706' : 'var(--text-primary)',
                          }}
                        >
                          {person.totalDays} / {person.limits.maxDays} วัน ({person.percentages.daysPercent}%)
                        </strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(person.percentages.daysPercent, 100)}%`,
                            height: '100%',
                            background: person.flags.isExceededDays
                              ? '#EF4444'
                              : person.flags.isNearDays
                              ? '#F59E0B'
                              : '#10B981',
                            borderRadius: '999px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Gauge 2: จำนวนครั้ง */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>2. จำนวนครั้งที่ลา</span>
                        <strong
                          style={{
                            color: person.flags.isExceededTimes ? '#DC2626' : person.flags.isNearTimes ? '#D97706' : 'var(--text-primary)',
                          }}
                        >
                          {person.totalTimes} / {person.limits.maxTimes} ครั้ง ({person.percentages.timesPercent}%)
                        </strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(person.percentages.timesPercent, 100)}%`,
                            height: '100%',
                            background: person.flags.isExceededTimes
                              ? '#EF4444'
                              : person.flags.isNearTimes
                              ? '#F59E0B'
                              : '#3B82F6',
                            borderRadius: '999px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Gauge 3: จำนวนครั้งมาสาย */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>3. จำนวนครั้งมาสาย</span>
                        <strong
                          style={{
                            color: person.flags.isExceededLate ? '#DC2626' : person.flags.isNearLate ? '#D97706' : 'var(--text-primary)',
                          }}
                        >
                          {person.totalLateTimes || 0} / {person.limits.maxLate || 18} ครั้ง ({person.percentages.latePercent || 0}%)
                        </strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(person.percentages.latePercent || 0, 100)}%`,
                            height: '100%',
                            background: person.flags.isExceededLate
                              ? '#EF4444'
                              : person.flags.isNearLate
                              ? '#F59E0B'
                              : '#EA580C',
                            borderRadius: '999px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Gauge 4: จำนวนรายการ */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>4. จำนวนรายการ</span>
                        <strong
                          style={{
                            color: person.flags.isExceededTrans ? '#DC2626' : person.flags.isNearTrans ? '#D97706' : 'var(--text-primary)',
                          }}
                        >
                          {person.totalTransactions} / {person.limits.maxTransactions} รายการ ({person.percentages.transPercent}%)
                        </strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(person.percentages.transPercent, 100)}%`,
                            height: '100%',
                            background: person.flags.isExceededTrans
                              ? '#EF4444'
                              : person.flags.isNearTrans
                              ? '#F59E0B'
                              : '#8B5CF6',
                            borderRadius: '999px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Accordion Toggle for Detailed Leave Records */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      มีประวัติการลาในรอบนี้ทั้งหมด {person.leaves?.length || 0} รายการ
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExpand(person.personnelId)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary-600)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        padding: '2px 6px',
                      }}
                    >
                      <span>{isExpanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียดการลา'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Expanded Leave Records Table */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px dashed var(--border-color)',
                      }}
                    >
                      {person.leaves && person.leaves.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', fontSize: '0.775rem', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#F1F5F9', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '6px 8px', borderRadius: '4px 0 0 4px' }}>ประเภทการลา</th>
                                <th style={{ padding: '6px 8px' }}>ช่วงวันที่ลา</th>
                                <th style={{ padding: '6px 8px', textAlign: 'center' }}>จำนวนวันในรอบ</th>
                                <th style={{ padding: '6px 8px', textAlign: 'center' }}>วันรวมทั้งหมด</th>
                                <th style={{ padding: '6px 8px', borderRadius: '0 4px 4px 0' }}>เหตุผล / หมายเหตุ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {person.leaves.map((item) => {
                                const conf = LEAVE_TYPE_CONFIG[item.leaveType] || {};
                                return (
                                  <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '6px 8px' }}>
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          padding: '2px 8px',
                                          borderRadius: '12px',
                                          background: conf.bg || '#F3F4F6',
                                          color: conf.color || '#374151',
                                          fontWeight: 700,
                                          fontSize: '0.7rem',
                                        }}
                                      >
                                        {item.leaveType}
                                      </span>
                                    </td>
                                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                                      {formatThaiDate(item.startDate)}
                                      {item.startDate !== item.endDate && ` - ${formatThaiDate(item.endDate)}`}
                                    </td>
                                    <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: '#EA580C' }}>
                                      {item.overlapDaysInCycle || item.totalDays} วัน
                                    </td>
                                    <td style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                      {item.totalDays} วัน
                                    </td>
                                    <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>
                                      {item.reason || item.remarks || '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                          ไม่มีรายการประวัติการลาในรอบนี้
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            แสดงผล <strong>{filteredPersonnel.length}</strong> จาก <strong>{personnelStats.length}</strong> ท่าน
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.5rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Single Email Prompt Modal */}
      {emailModalPerson && (
        <div
          className="modal-overlay"
          onClick={() => setEmailModalPerson(null)}
          style={{ zIndex: 1200, background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', width: '92%', borderRadius: 'var(--radius-xl)', padding: 0, overflow: 'hidden' }}
          >
            <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)', padding: '1.25rem', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={20} color="#FB923C" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                  ส่งอีเมลแจ้งเตือนวันลา
                </h3>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                ผู้รับ: <strong>{emailModalPerson.personnelName}</strong> ({emailModalPerson.email})
              </p>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: '#FFF7ED', borderRadius: 'var(--radius-md)', border: '1px solid #FFEDD5', fontSize: '0.8rem', color: '#9A3412' }}>
                ระบบจะสร้างเนื้อหาอีเมลทางการ สรุปสถิติวันลา ({emailModalPerson.totalDays}/{emailModalPerson.limits.maxDays} วัน) พร้อมรายการประวัติการลาในรอบนี้ส่งตรงไปยังอีเมลของบุคลากร
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                  ข้อความเพิ่มเติม / บันทึกแนบจาก HR หรือผู้ดูแลระบบ (ไม่บังคับ):
                </label>
                <textarea
                  rows={3}
                  placeholder="เช่น โปรดติดต่อฝ่ายบุคคลเพื่อวางแผนการใช้วันลา หรือส่งเอกสารใบรับรองแพทย์เพิ่มเติม..."
                  value={customEmailNote}
                  onChange={(e) => setCustomEmailNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    lineHeight: 1.5,
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#F97316';
                    e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#CBD5E1';
                    e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                  }}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: 'var(--bg-card)' }}>
              <button
                type="button"
                onClick={() => setEmailModalPerson(null)}
                className="btn btn-secondary"
                style={{ fontSize: '0.825rem' }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleSendSingleEmail(emailModalPerson, customEmailNote)}
                className="btn btn-primary"
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  border: 'none',
                }}
              >
                <Send size={14} />
                <span>ยืนยันส่งอีเมล</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Email Confirmation Modal */}
      {isBatchModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsBatchModalOpen(false)}
          style={{ zIndex: 1200, background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px', width: '92%', borderRadius: 'var(--radius-xl)', padding: 0, overflow: 'hidden' }}
          >
            <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)', padding: '1.25rem', color: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={20} color="#FB923C" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                  ยืนยันการส่งอีเมลแจ้งเตือนทั้งหมด
                </h3>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                รอบการประเมิน: <strong>{cycleInfo.label}</strong>
              </p>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', background: '#EFF6FF', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE', fontSize: '0.825rem', color: '#1E40AF', lineHeight: 1.5 }}>
                ระบบจะส่งอีเมลแจ้งเตือนรายบุคคลไปยังบุคลากรที่อยู่ในกลุ่ม <strong>เกินเกณฑ์กำหนด</strong> และ <strong>ใกล้เกินเกณฑ์</strong> จำนวนทั้งหมด <strong>{atRiskWithEmails.length} ท่าน</strong>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                  ข้อความเพิ่มเติมถึงผู้รับทุกคน (ไม่บังคับ):
                </label>
                <textarea
                  rows={3}
                  placeholder="เช่น ขอความร่วมมือบุคลากรตรวจสอบสถิติวันลาคงเหลือประจำปีงบประมาณ..."
                  value={customEmailNote}
                  onChange={(e) => setCustomEmailNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    lineHeight: 1.5,
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#F97316';
                    e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#CBD5E1';
                    e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                  }}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: 'var(--bg-card)' }}>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.825rem' }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSendBatchEmails}
                className="btn btn-primary"
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  border: 'none',
                }}
              >
                <Send size={14} />
                <span>เริ่มส่งอีเมล ({atRiskWithEmails.length} ท่าน)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
