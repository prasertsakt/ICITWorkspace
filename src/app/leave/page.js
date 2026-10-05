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
import { formatLocalDate } from '@/lib/dateUtils';
import LeaveCalendar from '@/components/LeaveCalendar';
import LeaveModal from '@/components/LeaveModal';
import LeaveReportModal from '@/components/LeaveReportModal';
import {
  Calendar,
  Clock,
  UserCheck,
  Plus,
  LogIn,
  ShieldCheck,
  Users,
  AlertTriangle,
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
  const [editingLeave, setEditingLeave] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Subscribe to leaves scoped by selectedYear with Smart Cache TTL & Real-time for Admin
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

    setLastSyncTime(getLastLeaveSyncTime());

    return () => {
      unsubLeaves();
      unsubPersonnel();
    };
  }, [selectedYear, isAdmin]);

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

  // Leaves this month
  const leavesThisMonth = useMemo(() => {
    const now = new Date();
    const curYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return leaves.filter((l) => l.startDate?.startsWith(curYearMonth) || l.endDate?.startsWith(curYearMonth));
  }, [leaves]);

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

        {/* Card 2: รายการลาในเดือนนี้ */}
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
                รายการลาในเดือนนี้ (This Month)
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
              {leavesThisMonth.length}{' '}
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>รายการ</span>
            </div>
          </div>

          <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
            รวมวันลาทั้งหมด: <strong>{leavesThisMonth.reduce((acc, curr) => acc + (curr.totalDays || 1), 0)}</strong> วัน
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
