'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import {
  subscribeLeaveList,
  subscribePersonnelList,
  saveLeaveRecord,
  deleteLeaveRecord,
  syncAllLocalLeavesToFirestore,
  refreshLeaveList,
  getLastLeaveSyncTime,
  archiveOldLeaves,
  isDummyLeaveRecord,
} from '@/lib/storageService';
import { LEAVE_TYPES, LEAVE_TYPE_CONFIG } from '@/lib/constants';
import { formatLocalDate, parseLocalDate, THAI_MONTHS_FULL } from '@/lib/dateUtils';
import LeaveCalendar from '@/components/LeaveCalendar';
import LeaveModal from '@/components/LeaveModal';
import LeaveReportModal from '@/components/LeaveReportModal';
import LeaveLimitConfigModal from '@/components/LeaveLimitConfigModal';
import LeaveLimitDetailModal from '@/components/LeaveLimitDetailModal';
import LateRecordsManageModal from '@/components/LateRecordsManageModal';
import {
  subscribeLeaveLimitConfig,
  calculatePersonnelLeaveLimitStats,
  getCurrentActiveCycleKey,
  DEFAULT_LEAVE_LIMIT_CONFIG,
} from '@/lib/leaveLimitService';
import {
  Calendar,
  Clock,
  UserCheck,
  Plus,
  LogIn,
  ShieldCheck,
  Users,
  AlertTriangle,
  AlertOctagon,
  SlidersHorizontal,
  HeartPulse,
  Sun,
  Baby,
  ArrowRight,
  ArrowLeft,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  Archive,
  FileText,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';


function LeaveContent() {
  const { currentPersonnel, isAdmin, handleGoogleSignIn, isLoading: isAuthLoading } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // Role permissions for Leave Report
  const isHrStaff = currentPersonnel?.position === 'บุคลากร' || isAdmin;
  const isExecutive =
    currentPersonnel?.position?.includes('ผู้บริหาร') ||
    currentPersonnel?.position?.includes('ผู้อำนวยการ') ||
    currentPersonnel?.position?.includes('รองผู้อำนวยการ') ||
    isAdmin;
  const canCreateReport = isExecutive || isHrStaff;

  const [leaves, setLeaves] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLimitConfigModalOpen, setIsLimitConfigModalOpen] = useState(false);
  const [isLateRecordsModalOpen, setIsLateRecordsModalOpen] = useState(false);
  const [isLimitDetailModalOpen, setIsLimitDetailModalOpen] = useState(false);
  const [limitDetailFilterStatus, setLimitDetailFilterStatus] = useState('AT_RISK');
  const [leaveLimitConfig, setLeaveLimitConfig] = useState(DEFAULT_LEAVE_LIMIT_CONFIG);
  const [selectedLimitCycleKey, setSelectedLimitCycleKey] = useState(() => getCurrentActiveCycleKey());
  const [editingLeave, setEditingLeave] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [activeCalendarDate, setActiveCalendarDate] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Subscribe to leaves, personnel, and leave limit config
  useEffect(() => {
    const unsubLeaves = subscribeLeaveList(
      (list) => {
        setLeaves((list || []).filter((l) => !isDummyLeaveRecord(l)));
        setLastSyncTime(getLastLeaveSyncTime());
      },
      { year: selectedYear, enableRealtime: true }
    );

    const unsubPersonnel = subscribePersonnelList((list) => {
      setPersonnelList(list || []);
    });

    const unsubLimitConfig = subscribeLeaveLimitConfig((conf) => {
      setLeaveLimitConfig(conf || DEFAULT_LEAVE_LIMIT_CONFIG);
    });

    setLastSyncTime(getLastLeaveSyncTime());

    return () => {
      unsubLeaves();
      unsubPersonnel();
      unsubLimitConfig();
    };
  }, [selectedYear, isAdmin]);

  // Leave Limit & Risk Monitoring Calculations
  const leaveLimitStats = useMemo(() => {
    return calculatePersonnelLeaveLimitStats({
      leaves,
      personnelList,
      config: leaveLimitConfig,
      fiscalYear: selectedYear,
      selectedCycleKey: selectedLimitCycleKey,
    });
  }, [leaves, personnelList, leaveLimitConfig, selectedYear, selectedLimitCycleKey]);

  const handleOpenLimitDetails = (statusFilter = 'AT_RISK') => {
    setLimitDetailFilterStatus(statusFilter);
    setIsLimitDetailModalOpen(true);
  };

  // Handle URL query parameters for action=new (Admin only)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new' && isAdmin) {
      setEditingLeave(null);
      setIsLeaveModalOpen(true);
    }
  }, [searchParams, isAdmin]);


  // Dashboard Metrics Calculations
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  // People on leave today
  const leavesToday = useMemo(() => {
    return leaves.filter((l) => {
      return l.startDate && l.endDate && l.startDate <= todayStr && todayStr <= l.endDate;
    });
  }, [leaves, todayStr]);

  // Leaves in the active calendar month (accurate overlap matching and cross-month days count)
  const activeMonthStats = useMemo(() => {
    const y = activeCalendarDate.getFullYear();
    const m = activeCalendarDate.getMonth(); // 0-11

    // First and last day strings of active month: YYYY-MM-DD
    const firstDayStr = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDayObj = new Date(y, m + 1, 0);
    const lastDayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDayObj.getDate()).padStart(2, '0')}`;

    // Filter leaves that overlap with this month: start <= lastDay && end >= firstDay
    const list = leaves.filter((l) => {
      if (!l.startDate || !l.endDate) return false;
      return l.startDate <= lastDayStr && l.endDate >= firstDayStr;
    });

    // Calculate actual days of leave falling within this month
    let totalDaysInMonth = 0;
    list.forEach((l) => {
      if (l.startDate >= firstDayStr && l.endDate <= lastDayStr) {
        // Entire leave falls within this month
        totalDaysInMonth += Number(l.totalDays) || 1;
      } else {
        // Cross-month leave: calculate overlapping days within this month
        const startStr = l.startDate > firstDayStr ? l.startDate : firstDayStr;
        const endStr = l.endDate < lastDayStr ? l.endDate : lastDayStr;
        const start = parseLocalDate(startStr);
        const end = parseLocalDate(endStr);
        if (start && end && start <= end) {
          const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
          totalDaysInMonth += diffDays;
        }
      }
    });

    const isCurrentRealMonth = y === new Date().getFullYear() && m === new Date().getMonth();

    return {
      list,
      count: list.length,
      totalDays: Number(totalDaysInMonth.toFixed(1)),
      monthName: THAI_MONTHS_FULL[m] || '',
      thaiYear: y + 543,
      isCurrentRealMonth,
    };
  }, [leaves, activeCalendarDate]);

  // Breakdown by leave type
  const typeCounts = useMemo(() => {
    const counts = {};
    LEAVE_TYPES.forEach((t) => (counts[t] = 0));
    leaves.forEach((l) => {
      if (counts[l.leaveType] !== undefined) {
        counts[l.leaveType]++;
      }
    });
    return counts;
  }, [leaves]);

  // Admin Actions with immediate optimistic updates
  const handleSaveLeave = async (data) => {
    // Optimistic UI state update in 0ms
    setLeaves((prev) => {
      const idx = prev.findIndex((l) => l.id === data.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...data };
        return next;
      }
      return [data, ...prev];
    });

    await saveLeaveRecord(data);
  };

  const handleDeleteLeave = async (id, personName) => {
    setLeaves((prev) => prev.filter((l) => l.id !== id));
    await deleteLeaveRecord(id);
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncAllLocalLeavesToFirestore();
      if (res.success) {
        setSyncStatus(`ซิงก์สำเร็จ ${res.successCount} รายการ`);
        setTimeout(() => setSyncStatus(null), 4000);
      } else {
        await showAlert({
          type: 'warning',
          title: 'การซิงก์ขึ้น Firebase ไม่สมบูรณ์',
          message: `การซิงก์ขึ้น Firebase ยังไม่สำเร็จ (${res.errorCount} รายการล้มเหลว)\n\nสาเหตุ: ${res.lastError?.code || ''} ${res.lastError?.message || 'ติด Security Rules'}\n\nวิธีแก้:\n1. ไปที่ Firebase Console > Firestore Database > แท็บ Rules\n2. ตรวจสอบว่ากฎความปลอดภัยเปิดอนุญาตให้อ่าน/เขียนคอลเลกชัน leaves\n3. กด Publish แล้วลองกดซิงก์ใหม่อีกครั้ง`,
        });
      }
    } catch (e) {
      await showAlert({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการซิงก์',
        message: e.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await refreshLeaveList(selectedYear);
      setLeaves((fresh || []).filter((l) => !isDummyLeaveRecord(l)));
      setLastSyncTime(getLastLeaveSyncTime());
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleArchiveOldData = async () => {
    const cutoffYear = selectedYear - 1;
    const confirmed = await showConfirm({
      type: 'info',
      title: 'ย้ายข้อมูลวันลาเข้าคลังประวัติ',
      message: `คุณต้องการย้ายข้อมูลวันลาที่สิ้นสุดก่อนปี ${cutoffYear + 543} (${cutoffYear}) เข้าสู่คลังประวัติ (leaves_archive) หรือไม่?\n\nการย้ายเข้าคลังประวัติจะช่วยให้คอลเลกชันปัจจุบันมีขนาดกะทัดรัด โหลดเร็ว และประหยัดโควตาการอ่าน`,
      confirmText: 'ยืนยันย้ายข้อมูล',
    });
    if (!confirmed) return;

    setIsArchiving(true);
    try {
      const res = await archiveOldLeaves(cutoffYear);
      if (res.success) {
        if (res.archivedCount > 0) {
          await showAlert({
            type: 'success',
            title: 'จัดเก็บข้อมูลสำเร็จ',
            message: `ย้ายข้อมูลเข้าคลังประวัติสำเร็จ ${res.archivedCount} รายการ`,
          });
        } else {
          await showAlert({
            type: 'info',
            title: 'ไม่พบข้อมูลที่เข้าเกณฑ์',
            message: 'ไม่พบข้อมูลวันลาเก่าที่เข้าเกณฑ์จัดเก็บในรอบปีที่เลือก',
          });
        }
      } else {
        await showAlert({
          type: 'warning',
          title: 'ไม่สามารถจัดเก็บข้อมูลได้',
          message: res.lastError?.message || 'โปรดตรวจสอบสิทธิ์การเข้าถึงข้อมูล',
        });
      }
    } finally {
      setIsArchiving(false);
    }
  };

  const formattedSyncTime = useMemo(() => {
    if (!lastSyncTime) return null;
    const d = new Date(lastSyncTime);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} น.`;
  }, [lastSyncTime]);

  const handleOpenAddModal = () => {
    setEditingLeave(null);
    setIsLeaveModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingLeave(item);
    setIsLeaveModalOpen(true);
  };

  // 1. Require Login Guard
  if (!isAuthLoading && !currentPersonnel) {
    return (
      <div className="main-container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div
          className="card-glass"
          style={{
            maxWidth: '520px',
            margin: '0 auto',
            padding: '2.75rem 2rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12)',
            borderTop: '5px solid #F97316',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#FFF7ED',
              color: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.15)',
            }}
          >
            <Calendar size={34} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: '#FFF7ED',
              color: '#EA580C',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '1rem',
              border: '1px solid #FFEDD5',
            }}
          >
            <span className="pulse-dot" style={{ background: '#EA580C' }} />
            ต้องเข้าสู่ระบบเพื่อใช้งาน
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
            ปฏิทินวันลาและสรุปสถิติ (Leave Calendar)
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
            ระบบปฏิทินวันลาและแดชบอร์ดสรุปสถิติเป็นบริการสารสนเทศภายในองค์กร
            <br />
            โปรดเข้าสู่ระบบด้วยบัญชี Google เพื่อเข้าดูปฏิทินและสถานะการลา
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleGoogleSignIn}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                color: '#FFFFFF',
                fontWeight: 700,
              }}
            >
              <LogIn size={20} />
              <span>เข้าสู่ระบบด้วยบัญชี Google KMUTNB</span>
            </button>
            <Link
              href="/"
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
            >
              <ArrowLeft size={16} />
              <span>กลับสู่หน้าหลัก (Portal)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* Top Hero Banner */}
      <section
        className="card-glass"
        style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.25rem 2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.3)',
          color: '#FFFFFF',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span
                style={{
                  background: 'rgba(249, 115, 22, 0.22)',
                  color: '#FED7AA',
                  border: '1px solid rgba(249, 115, 22, 0.4)',
                  borderRadius: '999px',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <Calendar size={13} style={{ color: '#FB923C' }} />
                <span>ระบบบริการงานบุคคล</span>
              </span>
              {isAdmin && (
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#A7F3D0',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '999px',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <ShieldCheck size={12} style={{ color: '#34D399' }} />
                  <span>Admin สิทธิ์บันทึกวันลา</span>
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.75rem, 3.8vw, 2.35rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                lineHeight: 1.2,
                margin: '0 0 0.5rem 0',
              }}
            >
              ปฏิทินวันลาและสรุปสถิติ{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                (Leave Calendar)
              </span>
            </h1>

            <p style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.78)', margin: 0, lineHeight: 1.6 }}>
              ตรวจสอบสถานะการลา ปฏิทินวันลาของบุคลากรในองค์กร และสถิติภาพรวม
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Cache & Refresh button (all users) */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn"
              title="รีเฟรชดึงข้อมูลล่าสุดจาก Cloud Firestore"
              style={{
                padding: '0.65rem 0.95rem',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 'var(--radius-md)',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isRefreshing ? 'กำลังโหลด...' : formattedSyncTime ? `แคช: ${formattedSyncTime}` : 'รีเฟรช'}</span>
            </button>

            {/* Executive & HR Staff: Create Leave Report PDF */}
            {canCreateReport && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="btn"
                title="ออกรายงานสรุปสถิติและประวัติการลาเป็น PDF (สำหรับผู้บริหารและเจ้าหน้าที่บุคลากร)"
                style={{
                  padding: '0.65rem 1.05rem',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(249, 115, 22, 0.2)',
                  color: '#FED7AA',
                  border: '1px solid rgba(249, 115, 22, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                <FileText size={15} color="#FB923C" />
                <span>ออกรายงานสรุป (PDF)</span>
              </button>
            )}

            {isAdmin && (
              <>
                {/* Admin Leave Limit Rules Configuration Button */}
                <button
                  onClick={() => setIsLimitConfigModalOpen(true)}
                  className="btn"
                  title="ตั้งค่าเพดานจำกัดการลา (วัน/ครั้ง/รายการ) แยกตามประเภทบุคลากร และกำหนดรอบการคำนวณ"
                  style={{
                    padding: '0.65rem 1rem',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(249, 115, 22, 0.25)',
                    color: '#FED7AA',
                    border: '1px solid rgba(249, 115, 22, 0.5)',
                    borderRadius: 'var(--radius-md)',
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  <SlidersHorizontal size={14} color="#FB923C" />
                  <span>ตั้งค่าเกณฑ์จำกัดการลา</span>
                </button>

                {/* Admin Late Records Management Button */}
                <button
                  onClick={() => setIsLateRecordsModalOpen(true)}
                  className="btn"
                  title="จัดการและแก้ไขรายการมาสาย (เฉพาะ Admin: แก้ไขวันที่เริ่มต้น วันที่สิ้นสุด และระยะเวลาทั้งหมด)"
                  style={{
                    padding: '0.65rem 1rem',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(239, 68, 68, 0.22)',
                    color: '#FECACA',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    borderRadius: 'var(--radius-md)',
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  <Clock size={14} color="#F87171" />
                  <span>จัดการรายการมาสาย</span>
                </button>

                {/* Batch Sync to Firebase */}
                <button
                  onClick={handleSyncToCloud}
                  disabled={isSyncing}
                  className="btn"
                  title="ซิงก์ข้อมูลวันลาขึ้น Cloud Firestore ด้วย Atomic Batch Write"
                  style={{
                    padding: '0.65rem 0.95rem',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {isSyncing ? (
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : syncStatus ? (
                    <CheckCircle2 size={14} color="#34D399" />
                  ) : (
                    <CloudUpload size={14} color="#FB923C" />
                  )}
                  <span>{isSyncing ? 'กำลังซิงก์...' : syncStatus || 'ซิงก์ขึ้น Firebase'}</span>
                </button>

                {/* Archive Old Data button */}
                <button
                  onClick={handleArchiveOldData}
                  disabled={isArchiving}
                  className="btn"
                  title={`ย้ายข้อมูลวันลาที่สิ้นสุดก่อนปี ${selectedYear + 542} เข้าคลังประวัติ`}
                  style={{
                    padding: '0.65rem 0.95rem',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Archive size={14} color="#FBBF24" />
                  <span>{isArchiving ? 'กำลังจัดเก็บ...' : 'จัดเก็บข้อมูลเก่า'}</span>
                </button>

                {/* Add Leave */}
                <button
                  onClick={handleOpenAddModal}
                  className="btn"
                  style={{
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} />
                  <span>บันทึกการลาใหม่</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Leave Limit & Risk Alert Monitoring Bar */}
      <section
        className="card-glass"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          border: '1.5px solid #FDE68A',
          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.08)',
        }}
      >
        {/* Risk Monitor Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(217, 119, 6, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#F59E0B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
              }}
            >
              <AlertTriangle size={17} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.95rem', color: '#92400E' }}>
                  ระบบติดตามและแจ้งเตือนการลาใกล้เกิน / เกินเกณฑ์ (Leave Limit & Quota Monitor)
                </strong>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#FEF3C7',
                    color: '#B45309',
                    border: '1px solid #FCD34D',
                  }}
                >
                  เกณฑ์เตือนที่ {leaveLimitConfig.warningThresholdPercent}%
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '2px' }}>
                รอบที่กำลังประเมิน: <strong>{leaveLimitStats.cycleInfo.label}</strong>
              </div>
            </div>
          </div>

          {/* Cycle Switcher Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E' }}>เลือกรอบ:</span>
            <button
              type="button"
              onClick={() => setSelectedLimitCycleKey('round_1')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: selectedLimitCycleKey === 'round_1' ? '1px solid #D97706' : '1px solid rgba(217, 119, 6, 0.25)',
                background: selectedLimitCycleKey === 'round_1' ? '#D97706' : '#FFFFFF',
                color: selectedLimitCycleKey === 'round_1' ? '#FFFFFF' : '#92400E',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {leaveLimitConfig.cycleMode === 'CUSTOM' ? 'รอบที่ 1 (กำหนดเอง)' : 'รอบที่ 1 (1 ส.ค. - 31 ม.ค.)'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedLimitCycleKey('round_2')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: selectedLimitCycleKey === 'round_2' ? '1px solid #D97706' : '1px solid rgba(217, 119, 6, 0.25)',
                background: selectedLimitCycleKey === 'round_2' ? '#D97706' : '#FFFFFF',
                color: selectedLimitCycleKey === 'round_2' ? '#FFFFFF' : '#92400E',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {leaveLimitConfig.cycleMode === 'CUSTOM' ? 'รอบที่ 2 (กำหนดเอง)' : 'รอบที่ 2 (1 ก.พ. - 31 ก.ค.)'}
            </button>
          </div>
        </div>

        {/* 2 Clickable Monitoring Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Card A: เกินเกณฑ์กำหนด (Exceeded) */}
          <div
            onClick={() => handleOpenLimitDetails('EXCEEDED')}
            className="card-glass"
            style={{
              padding: '1.1rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: '#FFFFFF',
              border: '1.5px solid #FCA5A5',
              borderLeft: '5px solid #EF4444',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.08)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#DC2626' }}>
                  🚨 บุคลากรที่เกินเกณฑ์ (Exceeded)
                </span>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertOctagon size={16} />
                </div>
              </div>

              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#991B1B', lineHeight: 1.1, marginBottom: '0.35rem' }}>
                {leaveLimitStats.summary.exceededCount}{' '}
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#DC2626' }}>ท่าน</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', color: '#B91C1C', marginBottom: '0.4rem', fontWeight: 600 }}>
                • พม.: {leaveLimitStats.summary.exceededByStaffType?.university || 0} ท่าน | • พศ.: {leaveLimitStats.summary.exceededByStaffType?.special || 0} ท่าน
              </div>
              <div
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>คลิกเพื่อดูรายชื่อและประวัติการลา</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>

          {/* Card B: ใกล้เกินเกณฑ์ (Near Limit) */}
          <div
            onClick={() => handleOpenLimitDetails('NEAR_LIMIT')}
            className="card-glass"
            style={{
              padding: '1.1rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: '#FFFFFF',
              border: '1.5px solid #FDE68A',
              borderLeft: '5px solid #F59E0B',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.08)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D97706' }}>
                  ⚠️ บุคลากรที่ใกล้เกินเกณฑ์ (Near Limit)
                </span>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={16} />
                </div>
              </div>

              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#92400E', lineHeight: 1.1, marginBottom: '0.35rem' }}>
                {leaveLimitStats.summary.nearLimitCount}{' '}
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#D97706' }}>ท่าน</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', color: '#B45309', marginBottom: '0.4rem', fontWeight: 600 }}>
                • พม.: {leaveLimitStats.summary.nearLimitByStaffType?.university || 0} ท่าน | • พศ.: {leaveLimitStats.summary.nearLimitByStaffType?.special || 0} ท่าน
              </div>
              <div
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>คลิกเพื่อดูรายชื่อและประวัติการลา</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Summary Metric Cards */}
      <div className="grid-3" style={{ gap: '1rem', marginBottom: '1.75rem' }}>
        {/* Card 1: วันนี้กำลังลา */}
        <div
          className="card-glass"
          style={{
            padding: '1.25rem',
            borderTop: '4px solid var(--rose-500)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                วันนี้กำลังลา (Today)
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--rose-50)',
                  color: 'var(--rose-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={16} />
              </div>
            </div>

            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              {leavesToday.length}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>ท่าน</span>
            </div>
          </div>

          <div>
            {leavesToday.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                {leavesToday.map((l) => {
                  const conf = LEAVE_TYPE_CONFIG[l.leaveType] || {};
                  return (
                    <span
                      key={l.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.725rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: conf.bg,
                        color: conf.color,
                        fontWeight: 600,
                      }}
                      title={`${l.personnelName} (${l.leaveType})`}
                    >
                      {l.personnelName} ({l.leaveType})
                    </span>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '0.775rem', color: 'var(--mint-600)', margin: 0, fontWeight: 600 }}>
                ✅ วันนี้บุคลากรทุกคนปฏิบัติงานปกติ
              </p>
            )}
          </div>
        </div>

        {/* Card 2: รายการลาประจำเดือน */}
        <div
          className="card-glass"
          style={{
            padding: '1.25rem',
            borderTop: '4px solid var(--primary-500)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {activeMonthStats.isCurrentRealMonth
                  ? `รายการลาในเดือนนี้ (${activeMonthStats.monthName})`
                  : `รายการลาประจำเดือน (${activeMonthStats.monthName} ${activeMonthStats.thaiYear})`}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={16} />
              </div>
            </div>

            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              {activeMonthStats.count}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>รายการ</span>
            </div>
          </div>

          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
            รวมวันลาในเดือนนี้: <strong>{activeMonthStats.totalDays}</strong> วัน
          </div>
        </div>

        {/* Card 3: สถิติแยกตามประเภท */}
        <div
          className="card-glass"
          style={{
            padding: '1.25rem',
            borderTop: '4px solid var(--mint-500)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                สรุปภาพรวมแยกตามประเภท
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--mint-50)',
                  color: 'var(--mint-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={16} />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
              {LEAVE_TYPES.map((type) => {
                const conf = LEAVE_TYPE_CONFIG[type] || {};
                const count = typeCounts[type] || 0;
                return (
                  <div
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.725rem',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      background: conf.bg,
                      color: conf.color,
                      fontWeight: 600,
                    }}
                  >
                    <span>{type}:</span>
                    <strong style={{ fontSize: '0.8rem' }}>{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            ประวัติการลาปี {selectedYear + 543}: {leaves.length} รายการ
          </div>
        </div>
      </div>

      {/* Main Interactive Calendar */}
      <LeaveCalendar
        leaves={leaves}
        isAdmin={isAdmin}
        canCreateReport={canCreateReport}
        onOpenReport={() => setIsReportModalOpen(true)}
        onEditLeave={handleOpenEditModal}
        onDeleteLeave={handleDeleteLeave}
        onYearChange={setSelectedYear}
        onDateChange={setActiveCalendarDate}
        initialSearch={initialSearch}
      />

      {/* Modal for Adding / Editing Leave */}
      {isLeaveModalOpen && (
        <LeaveModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          onSave={handleSaveLeave}
          leaveToEdit={editingLeave}
          personnelList={personnelList}
        />
      )}

      {/* Modal for Generating and Previewing Leave Summary Report PDF */}
      {isReportModalOpen && (
        <LeaveReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          leaves={leaves}
          personnelList={personnelList}
          currentPersonnel={currentPersonnel}
          initialFiscalYear={selectedYear}
          initialLimitCycleKey={selectedLimitCycleKey}
          leaveLimitConfig={leaveLimitConfig}
        />
      )}

      {/* Admin Leave Limit Configuration Modal */}
      {isLimitConfigModalOpen && (
        <LeaveLimitConfigModal
          isOpen={isLimitConfigModalOpen}
          onClose={() => setIsLimitConfigModalOpen(false)}
          currentConfig={leaveLimitConfig}
          currentUser={currentPersonnel}
          onSaved={(newConfig) => setLeaveLimitConfig(newConfig)}
        />
      )}

      {/* Personnel Leave Limit Risk & Details Modal */}
      {isLimitDetailModalOpen && (
        <LeaveLimitDetailModal
          isOpen={isLimitDetailModalOpen}
          onClose={() => setIsLimitDetailModalOpen(false)}
          limitStats={leaveLimitStats}
          initialFilterStatus={limitDetailFilterStatus}
          currentUser={currentPersonnel}
        />
      )}

      {/* Admin Late Records Management Modal */}
      {isLateRecordsModalOpen && (
        <LateRecordsManageModal
          isOpen={isLateRecordsModalOpen}
          onClose={() => setIsLateRecordsModalOpen(false)}
          leaves={leaves}
          currentUser={currentPersonnel}
          onSaved={() => refreshLeaveList()}
          onDeleted={() => refreshLeaveList()}
        />
      )}
    </div>

  );
}


export default function LeavePage() {
  return (
    <React.Suspense
      fallback={
        <div className="main-container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--primary-600)', marginBottom: '1rem' }}>
            <Calendar size={36} className="spin" style={{ margin: '0 auto' }} />
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดปฏิทินวันลา...</p>
        </div>
      }
    >
      <LeaveContent />
    </React.Suspense>
  );
}
