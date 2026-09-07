'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeLeaveList,
  subscribePersonnelList,
  saveLeaveRecord,
  deleteLeaveRecord,
  syncAllLocalLeavesToFirestore,
} from '@/lib/storageService';
import { LEAVE_TYPES, LEAVE_TYPE_CONFIG } from '@/lib/constants';
import LeaveCalendar from '@/components/LeaveCalendar';
import LeaveModal from '@/components/LeaveModal';
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
  CloudUpload,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export default function LeavePage() {
  const { currentPersonnel, isAdmin, handleGoogleSignIn, isLoading: isAuthLoading } = useAuth();

  const [leaves, setLeaves] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  // Subscribe to real-time leave list and personnel list
  useEffect(() => {
    const unsubLeaves = subscribeLeaveList((list) => {
      setLeaves(list || []);
    });

    const unsubPersonnel = subscribePersonnelList((list) => {
      setPersonnelList(list || []);
    });

    return () => {
      unsubLeaves();
      unsubPersonnel();
    };
  }, []);

  // Dashboard Metrics Calculations
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

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
        alert(
          `⚠️ การซิงก์ขึ้น Firebase ยังไม่สำเร็จ (${res.errorCount} รายการล้มเหลว)\n\n` +
          `สาเหตุ: ${res.lastError?.code || ''} ${res.lastError?.message || 'ติด Security Rules'}\n\n` +
          `วิธีแก้:\n1. ไปที่ Firebase Console > Firestore Database > แท็บ Rules\n` +
          `2. ตรวจสอบว่ากฎความปลอดภัยเปิดอนุญาตให้อ่าน/เขียนคอลเลกชัน leaves\n` +
          `3. กด Publish แล้วลองกดซิงก์ใหม่อีกครั้ง`
        );
      }
    } catch (e) {
      alert(`เกิดข้อผิดพลาด: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

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
            padding: '2.5rem 2rem',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Calendar size={32} />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            เข้าสู่ระบบเพื่อใช้งาน "ปฏิทินวันลา"
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            ระบบปฏิทินวันลาและแดชบอร์ดสรุปสถิติเป็นบริการสารสนเทศภายในองค์กร
            <br />
            โปรดเข้าสู่ระบบด้วยบัญชี Google เพื่อเข้าดูปฏิทินและสถานะการลา
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleGoogleSignIn}
              className="btn btn-primary btn-sm"
              style={{ width: '100%', padding: '0.65rem', justifyContent: 'center' }}
            >
              <LogIn size={18} />
              <span>เข้าสู่ระบบด้วย Google</span>
            </button>
            <Link href="/" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              กลับหน้าหลัก (Portal)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <span className="badge badge-active">
              <Calendar size={13} />
              ระบบบริการงานบุคคล
            </span>
            {isAdmin && (
              <span className="badge badge-admin">
                <ShieldCheck size={12} />
                Admin สิทธิ์บันทึกวันลา
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
            ปฏิทินวันลาและสรุปสถิติ (Leave Calendar)
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            ตรวจสอบสถานะการลา ปฏิทินวันลาของบุคลากรในองค์กร และสถิติภาพรวม
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={handleSyncToCloud}
              disabled={isSyncing}
              className="btn btn-secondary btn-sm"
              title="ซิงก์ข้อมูลวันลาทั้งหมดจากเครื่องขึ้น Cloud Firestore"
              style={{ padding: '0.6rem 0.95rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isSyncing ? (
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
              ) : syncStatus ? (
                <CheckCircle2 size={15} color="var(--mint-600)" />
              ) : (
                <CloudUpload size={15} color="var(--primary-600)" />
              )}
              <span>{isSyncing ? 'กำลังซิงก์...' : syncStatus || 'ซิงก์ขึ้น Firebase'}</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.6rem 1.15rem' }}
            >
              <Plus size={16} />
              <span>บันทึกการลาใหม่</span>
            </button>
          </div>
        )}
      </div>

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
            ประวัติการลาสะสมทั้งหมด: {leaves.length} รายการ
          </div>
        </div>
      </div>

      {/* Main Interactive Calendar */}
      <LeaveCalendar
        leaves={leaves}
        isAdmin={isAdmin}
        onEditLeave={handleOpenEditModal}
        onDeleteLeave={handleDeleteLeave}
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
    </div>
  );
}
