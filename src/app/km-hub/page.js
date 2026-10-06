'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  Edit3,
  Trash2,
  Eye,
  AlertTriangle,
  Lock,
  LogIn,
  Users,
  Coins,
  ArrowRight,
  ExternalLink,
  BellRing,
  Filter,
  Sparkles,
  MapPin,
  ChevronRight,
  RefreshCw,
  FileText,
  Layers,
} from 'lucide-react';
import {
  subscribeKmRecords,
  saveKmRecord,
  deleteKmRecord,
  calculateKmNotificationStatus,
  KM_STATUSES,
} from '@/lib/kmHubService';
import {
  subscribePersonnelList,
  subscribeDepartmentList,
  subscribeExecutiveList,
} from '@/lib/storageService';
import { MAIN_6_DEPTS } from '@/lib/constants';
import { formatDateDDMMYYYYBE, getCurrentThaiFiscalYear, getAvailableFiscalYears } from '@/lib/dateUtils';
import KMFormModal from '@/components/KMFormModal';
import KMDetailModal from '@/components/KMDetailModal';
import KMReminderModal from '@/components/KMReminderModal';
import KMDeleteModal from '@/components/KMDeleteModal';

export default function KMHubPage() {
  const { currentUser, currentPersonnel, isAdmin, isLoading: isAuthLoading, handleGoogleSignIn } = useAuth();
  const { showAlert } = useModal();

  // Data states
  const [kmRecords, setKmRecords] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [executiveList, setExecutiveList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [fiscalYear, setFiscalYear] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'OVERDUE'
  const [searchQuery, setSearchQuery] = useState('');
  const [myTrainingsOnly, setMyTrainingsOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals state
  const [selectedDetailRecord, setSelectedDetailRecord] = useState(null);
  const [formRecord, setFormRecord] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Subscriptions
  useEffect(() => {
    const unsubKm = subscribeKmRecords((data) => {
      setKmRecords(data || []);
      setLoading(false);
    });

    const unsubPersonnel = subscribePersonnelList((pList) => {
      setPersonnelList(pList || []);
    });

    const unsubDepts = subscribeDepartmentList((dList) => {
      setDepartmentList(dList || []);
    });

    const unsubExecs = subscribeExecutiveList((eList) => {
      setExecutiveList(eList || []);
    });

    return () => {
      unsubKm();
      unsubPersonnel();
      unsubDepts();
      unsubExecs();
    };
  }, []);

  const userEmail = (currentUser?.email || currentPersonnel?.email || '').toLowerCase().trim();

  // Base Filtered Records by Year, Dept, Search Query, and My Trainings
  const scopeRecords = useMemo(() => {
    return kmRecords.filter((rec) => {
      // Fiscal Year
      if (fiscalYear !== 'ALL' && String(rec.fiscalYear) !== String(fiscalYear)) {
        return false;
      }

      // Department Filter (Check if any attendee belongs to selected department)
      if (selectedDept !== 'ALL') {
        const hasDeptAttendee = (rec.attendees || []).some((a) => a.department === selectedDept);
        if (!hasDeptAttendee) return false;
      }

      // My Trainings Only
      if (myTrainingsOnly) {
        const isMyTraining = (rec.attendees || []).some(
          (a) => a.email && a.email.toLowerCase().trim() === userEmail
        );
        if (!isMyTraining) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mTitle = (rec.courseTitle || '').toLowerCase().includes(q);
        const mOrg = (rec.organizer || '').toLowerCase().includes(q);
        const mLoc = (rec.location || '').toLowerCase().includes(q);
        const mAttendees = (rec.attendees || []).some(
          (a) => (a.name || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q)
        );
        return mTitle || mOrg || mLoc || mAttendees;
      }

      return true;
    });
  }, [kmRecords, fiscalYear, selectedDept, myTrainingsOnly, searchQuery, userEmail]);

  // Dashboard Statistics based on the selected filter scope
  const stats = useMemo(() => {
    const total = scopeRecords.length;
    const completed = scopeRecords.filter((r) => r.status === 'COMPLETED').length;
    const inProgress = scopeRecords.filter((r) => r.status === 'IN_PROGRESS').length;

    let totalBudget = 0;
    const uniqueAttendees = new Set();
    let overdueCount = 0;
    let pendingWithoutOverdue = 0;

    scopeRecords.forEach((r) => {
      if (r.budget) totalBudget += Number(r.budget) || 0;
      (r.attendees || []).forEach((a) => {
        if (a.id || a.email || a.name) uniqueAttendees.add(a.id || a.email || a.name);
      });
      const trk = calculateKmNotificationStatus(r);
      if (trk.isOverdue && r.status !== 'COMPLETED') {
        overdueCount += 1;
      } else if (r.status === 'PENDING') {
        pendingWithoutOverdue += 1;
      }
    });

    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      pendingWithoutOverdue,
      overdueCount,
      percent,
      totalBudget,
      uniqueAttendeesCount: uniqueAttendees.size,
    };
  }, [scopeRecords]);

  // Filtered Records (applying statusFilter on top of scopeRecords)
  const filteredRecords = useMemo(() => {
    return scopeRecords.filter((rec) => {
      const tracking = calculateKmNotificationStatus(rec);
      if (statusFilter === 'COMPLETED' && rec.status !== 'COMPLETED') return false;
      if (statusFilter === 'IN_PROGRESS' && rec.status !== 'IN_PROGRESS') return false;
      if (statusFilter === 'PENDING' && (rec.status !== 'PENDING' || tracking.isOverdue)) return false;
      if (statusFilter === 'OVERDUE' && (!tracking.isOverdue || rec.status === 'COMPLETED')) return false;
      return true;
    });
  }, [scopeRecords, statusFilter]);

  // Handlers for Admin
  const handleOpenCreateModal = () => {
    setFormRecord(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (rec, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFormRecord(rec);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (rec, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDeletingRecord(rec);
  };

  const handleSaveRecord = async (payload) => {
    const actor = {
      name: currentPersonnel?.name || currentUser?.displayName || 'ผู้ดูแลระบบ',
      email: currentUser?.email || currentPersonnel?.email || '',
    };
    await saveKmRecord(payload, actor);
    setIsFormModalOpen(false);
    setFormRecord(null);
    await showAlert({
      type: 'success',
      title: 'บันทึกข้อมูลสำเร็จ',
      message: `บันทึกข้อมูลหลักสูตร "${payload.courseTitle}" เรียบร้อยแล้ว`,
    });
  };

  const handleDeleteRecord = async (id) => {
    await deleteKmRecord(id);
    setDeletingRecord(null);
    await showAlert({
      type: 'success',
      title: 'ลบข้อมูลสำเร็จ',
      message: 'ลบรายการหลักสูตรการอบรมเรียบร้อยแล้ว',
    });
  };

  // 1. Auth Loading State
  if (isAuthLoading) {
    return (
      <div className="main-container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '3px solid #E2E8F0',
            borderTopColor: '#059669',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ marginTop: '1rem', color: '#64748B', fontSize: '0.9rem' }}>
          กำลังตรวจสอบข้อมูลผู้ใช้งาน...
        </p>
      </div>
    );
  }

  // 2. Auth Required Gate
  if (!currentUser && !currentPersonnel) {
    return (
      <div className="main-container" style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <div
          className="card-glass card-pastel-accent"
          style={{
            maxWidth: '540px',
            width: '100%',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl, 20px)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '16px',
              background: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
            }}
          >
            <BookOpen size={36} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
            ระบบจัดเก็บ-ติดตามองค์ความรู้บุคลากร
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT) &bull; มจพ.
            <br />
            ศูนย์รวมองค์ความรู้และการติดตามการแบ่งปันความรู้จากการฝึกอบรม-สัมมนา
          </p>

          <div
            style={{
              padding: '1rem',
              background: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.75rem',
              textAlign: 'left',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
            }}
          >
            <Lock size={20} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                บริการสารสนเทศภายใน (Required Login)
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                โปรดเข้าสู่ระบบด้วยบัญชี Google ของมหาวิทยาลัยเพื่อดูข้อมูลและติดตามการแบ่งปันองค์ความรู้
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleGoogleSignIn}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
              }}
            >
              <LogIn size={18} />
              <span>เข้าสู่ระบบด้วย Google Account มจพ.</span>
            </button>
            <Link
              href="/"
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.65rem 1.5rem', fontSize: '0.875rem', justifyContent: 'center' }}
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container" style={{ padding: '1.75rem 1rem 4rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Breadcrumb Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: '#047857',
              textDecoration: 'none',
              fontWeight: 700,
              background: '#ECFDF5',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid #A7F3D0',
            }}
          >
            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
            <span>กลับหน้าหลัก</span>
          </Link>
          <span style={{ color: '#CBD5E1' }}>/</span>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
            จัดเก็บ-ติดตามองค์ความรู้บุคลากร (KM Hub)
          </span>
        </div>

        {/* Action Controls for Admin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {stats.overdueCount > 0 && (
            <button
              type="button"
              onClick={() => setIsReminderModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1.5px solid #FECACA',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '0.825rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '20px',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.1)',
              }}
            >
              <BellRing size={15} />
              <span>ติดตามแจ้งเตือน ({stats.overdueCount})</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn btn-primary btn-sm"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800,
                fontSize: '0.825rem',
                padding: '0.5rem 1.15rem',
                borderRadius: '20px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
              }}
            >
              <Plus size={16} />
              <span>เพิ่มรายการอบรมใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Header Banner Styled Similar to JD Hub */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
          borderRadius: 'var(--radius-xl, 20px)',
          padding: '1.75rem 2rem',
          color: '#FFFFFF',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                color: '#FFFFFF',
              }}
            >
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                  จัดเก็บ-ติดตามองค์ความรู้บุคลากร
                </h1>
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.25)',
                    color: '#A7F3D0',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                  }}
                >
                  KM Tracking System &bull; ICIT
                </span>
              </div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#CBD5E1', maxWidth: '720px', lineHeight: 1.5 }}>
            ระบบบันทึกและติดตามการแบ่งปันองค์ความรู้จากการฝึกอบรม/สัมมนาของบุคลากร แจ้งเตือนการแบ่งปันความรู้ภายใน 2 เดือนและทุก ๆ 15 วัน
          </p>
        </div>

        {/* Hero Mini Stats Pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              borderRadius: '12px',
              padding: '0.65rem 1rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>แบ่งปันเสร็จสิ้น</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399' }}>
              {stats.completed} / {stats.total}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              borderRadius: '12px',
              padding: '0.65rem 1rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>ความก้าวหน้ารวม</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FBBF24' }}>
              {stats.percent}%
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Dashboard Summary Cards (Clickable Filter Shortcuts) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Total Courses */}
        <div
          className="card"
          onClick={() => setStatusFilter('ALL')}
          style={{
            padding: '1.15rem 1.25rem',
            borderRadius: '14px',
            border: statusFilter === 'ALL' ? '2px solid #059669' : '1px solid #E2E8F0',
            background: statusFilter === 'ALL' ? '#F0FDF4' : '#FFFFFF',
            boxShadow: statusFilter === 'ALL' ? '0 4px 12px rgba(5, 150, 105, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.825rem' }}>
            <span style={{ fontWeight: 600 }}>หลักสูตรทั้งหมด</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E293B', marginTop: '0.4rem' }}>
            {stats.total} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>หลักสูตร</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            บุคลากรเข้าอบรม {stats.uniqueAttendeesCount} คน
          </div>
        </div>

        {/* Card 2: Total Budget */}
        <div
          className="card"
          style={{
            padding: '1.15rem 1.25rem',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.825rem' }}>
            <span style={{ fontWeight: 600 }}>งบประมาณที่ใช้รวม</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coins size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563EB', marginTop: '0.4rem' }}>
            ฿{stats.totalBudget.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            งบประมาณการฝึกอบรมบุคลากร
          </div>
        </div>

        {/* Card 3: Completed Sharing */}
        <div
          className="card"
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          style={{
            padding: '1.15rem 1.25rem',
            borderRadius: '14px',
            border: statusFilter === 'COMPLETED' ? '2px solid #059669' : '1px solid #E2E8F0',
            background: statusFilter === 'COMPLETED' ? '#ECFDF5' : '#FFFFFF',
            boxShadow: statusFilter === 'COMPLETED' ? '0 4px 12px rgba(5, 150, 105, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.825rem' }}>
            <span style={{ fontWeight: 600 }}>แบ่งปันเสร็จสิ้นแล้ว</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '0.4rem' }}>
            {stats.completed} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>หลักสูตร</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
            คิดเป็น {stats.percent}% ของทั้งหมด
          </div>
        </div>

        {/* Card 4: Overdue & Pending Reminders */}
        <div
          className="card"
          onClick={() => setStatusFilter(statusFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          style={{
            padding: '1.15rem 1.25rem',
            borderRadius: '14px',
            border: statusFilter === 'OVERDUE' ? '2px solid #DC2626' : stats.overdueCount > 0 ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0',
            background: statusFilter === 'OVERDUE' ? '#FEF2F2' : stats.overdueCount > 0 ? '#FFF1F2' : '#FFFFFF',
            boxShadow: statusFilter === 'OVERDUE' ? '0 4px 12px rgba(220, 38, 38, 0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: stats.overdueCount > 0 ? '#991B1B' : '#64748B', fontSize: '0.825rem' }}>
            <span style={{ fontWeight: 700 }}>⚠️ เกินกำหนด 2 เดือน</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626', marginTop: '0.4rem' }}>
            {stats.overdueCount} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#991B1B' }}>หลักสูตร</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#B91C1C', marginTop: '2px' }}>
            รอดำเนินการรวม {stats.pending} หลักสูตร
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card-glass"
        style={{
          padding: '1.15rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          background: '#FFFFFF',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
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
              placeholder="ค้นหาชื่อหลักสูตร, ผู้เข้าอบรม, หน่วยงานที่จัด..."
              className="form-input"
              style={{ paddingLeft: '2.25rem', height: '38px', borderRadius: '20px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Fiscal Year Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>
              ปีงบประมาณ:
            </span>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              className="form-select"
              style={{
                height: '38px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#065F46',
                minWidth: '110px',
              }}
            >
              <option value="ALL">ทุกปีงบประมาณ</option>
              {getAvailableFiscalYears().map((y) => (
                <option key={y} value={y}>
                  ปี {y}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>
              ฝ่ายงาน:
            </span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="form-select"
              style={{
                height: '38px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                maxWidth: '220px',
              }}
            >
              <option value="ALL">ทุกฝ่ายงาน</option>
              {MAIN_6_DEPTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* My Trainings Toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: 700,
              color: myTrainingsOnly ? '#059669' : '#475569',
              padding: '6px 12px',
              borderRadius: '20px',
              background: myTrainingsOnly ? '#ECFDF5' : '#F1F5F9',
              border: myTrainingsOnly ? '1.5px solid #059669' : '1px solid #E2E8F0',
            }}
          >
            <input
              type="checkbox"
              checked={myTrainingsOnly}
              onChange={(e) => setMyTrainingsOnly(e.target.checked)}
              style={{ accentColor: '#059669' }}
            />
            <span>เฉพาะหลักสูตรของฉัน</span>
          </label>
        </div>

        {/* Status Filter Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '0.85rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #F1F5F9',
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginRight: '4px', whiteSpace: 'nowrap' }}>
            สถานะ:
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              border: statusFilter === 'ALL' ? '1.5px solid #059669' : '1px solid #E2E8F0',
              background: statusFilter === 'ALL' ? '#ECFDF5' : '#FFFFFF',
              color: statusFilter === 'ALL' ? '#065F46' : '#64748B',
              fontSize: '0.775rem',
              fontWeight: statusFilter === 'ALL' ? 800 : 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ทั้งหมด ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              border: statusFilter === 'COMPLETED' ? '1.5px solid #059669' : '1px solid #E2E8F0',
              background: statusFilter === 'COMPLETED' ? '#ECFDF5' : '#FFFFFF',
              color: statusFilter === 'COMPLETED' ? '#059669' : '#64748B',
              fontSize: '0.775rem',
              fontWeight: statusFilter === 'COMPLETED' ? 800 : 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ✅ แบ่งปันเสร็จสิ้น ({stats.completed})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('IN_PROGRESS')}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              border: statusFilter === 'IN_PROGRESS' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
              background: statusFilter === 'IN_PROGRESS' ? '#EFF6FF' : '#FFFFFF',
              color: statusFilter === 'IN_PROGRESS' ? '#1D4ED8' : '#64748B',
              fontSize: '0.775rem',
              fontWeight: statusFilter === 'IN_PROGRESS' ? 800 : 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            🔄 อยู่ระหว่างดำเนินการ ({stats.inProgress})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              border: statusFilter === 'PENDING' ? '1.5px solid #D97706' : '1px solid #E2E8F0',
              background: statusFilter === 'PENDING' ? '#FEF3C7' : '#FFFFFF',
              color: statusFilter === 'PENDING' ? '#B45309' : '#64748B',
              fontSize: '0.775rem',
              fontWeight: statusFilter === 'PENDING' ? 800 : 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ⏳ รอดำเนินการ ({stats.pendingWithoutOverdue})
          </button>

          {stats.overdueCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('OVERDUE')}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                border: statusFilter === 'OVERDUE' ? '1.5px solid #DC2626' : '1px solid #FECACA',
                background: statusFilter === 'OVERDUE' ? '#FEF2F2' : '#FFFFFF',
                color: '#DC2626',
                fontSize: '0.775rem',
                fontWeight: statusFilter === 'OVERDUE' ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⚠️ เกินกำหนด 2 เดือน ({stats.overdueCount})
            </button>
          )}
        </div>
      </div>

      {/* Courses Cards Grid */}
      {filteredRecords.length === 0 ? (
        <div
          className="card-glass"
          style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px dashed #CBD5E1',
            color: '#64748B',
          }}
        >
          <BookOpen size={40} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: '0 0 4px' }}>
            ไม่พบรายการหลักสูตรการอบรม
          </h4>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>
            ลองปรับเปลี่ยนคำค้นหา หรือตัวกรองปีงบประมาณและฝ่ายงาน
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredRecords.map((item) => {
            const trk = calculateKmNotificationStatus(item);
            const statusCfg = KM_STATUSES[item.status] || KM_STATUSES.PENDING;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedDetailRecord(item)}
                className="card-glass"
                style={{
                  borderRadius: '16px',
                  padding: '1.35rem',
                  borderTop: `5px solid ${trk.isCompleted ? '#10B981' : trk.isOverdue ? '#DC2626' : '#F59E0B'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  position: 'relative',
                }}
              >
                <div>
                  {/* Top Status & Fiscal Year Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: statusCfg.bgColor,
                          color: statusCfg.color,
                          border: `1px solid ${statusCfg.borderColor}`,
                        }}
                      >
                        {statusCfg.label}
                      </span>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: '#F1F5F9',
                          color: '#475569',
                        }}
                      >
                        ปี {item.fiscalYear}
                      </span>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(item, e)}
                          className="btn btn-secondary btn-xs"
                          style={{ padding: '3px 6px', borderRadius: '6px', color: '#047857', borderColor: '#A7F3D0' }}
                          title="แก้ไขรายการ"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenDeleteModal(item, e)}
                          className="btn btn-ghost btn-xs"
                          style={{ padding: '3px 6px', borderRadius: '6px', color: '#DC2626' }}
                          title="ลบรายการ"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Course Title with Green check icon matching screenshot */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '0.65rem' }}>
                    <CheckCircle2
                      size={20}
                      style={{
                        color: trk.isCompleted ? '#16A34A' : '#10B981',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    />
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: '#15803D',
                        lineHeight: 1.35,
                      }}
                    >
                      {item.courseTitle}
                    </h3>
                  </div>

                  {/* Attendees List */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      color: '#475569',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <Users size={14} style={{ color: '#059669', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(item.attendees || []).map((a) => a.name).join(' , ') || 'ไม่ได้ระบุผู้เข้าอบรม'}
                    </span>
                  </div>

                  {/* Organizer & Location */}
                  <div style={{ fontSize: '0.775rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '0.5rem' }}>
                    {item.organizer && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={13} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.organizer}
                        </span>
                      </div>
                    )}
                    {item.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={13} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.location}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Knowledge Sharing Types Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.5rem' }}>
                    {item.sharingMethods?.summaryReport && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: '#F0FDF4',
                          color: '#166534',
                          border: '1px solid #BBF7D0',
                        }}
                      >
                        📄 รายงานประมวลความรู้
                      </span>
                    )}
                    {item.sharingMethods?.smallGroupLecture && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: '#F0FDF4',
                          color: '#166534',
                          border: '1px solid #BBF7D0',
                        }}
                      >
                        🎤 บรรยายกลุ่มย่อย
                      </span>
                    )}
                    {Array.isArray(item.documentUrls) && item.documentUrls.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          border: '1px solid #BFDBFE',
                        }}
                      >
                        🔗 มี {item.documentUrls.length} เอกสารแนบ
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer with Notification Tracker & Budget */}
                <div
                  style={{
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: trk.badgeColor, fontWeight: 700 }}>
                    {trk.isCompleted ? (
                      <CheckCircle2 size={14} />
                    ) : trk.isOverdue ? (
                      <AlertTriangle size={14} />
                    ) : (
                      <Clock size={14} />
                    )}
                    <span>{trk.statusMessage}</span>
                  </div>

                  <div style={{ color: '#15803D', fontWeight: 800, fontSize: '0.85rem' }}>
                    ฿{Number(item.budget || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetailRecord && (
        <KMDetailModal
          isOpen={Boolean(selectedDetailRecord)}
          onClose={() => setSelectedDetailRecord(null)}
          record={selectedDetailRecord}
          isAdmin={isAdmin}
          onEdit={(rec) => {
            setFormRecord(rec);
            setIsFormModalOpen(true);
          }}
          onDelete={(rec) => setDeletingRecord(rec)}
        />
      )}

      {/* Form Modal (Create / Edit) */}
      {isFormModalOpen && (
        <KMFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setFormRecord(null);
          }}
          recordToEdit={formRecord}
          personnelList={personnelList}
          executiveList={executiveList}
          onSave={handleSaveRecord}
        />
      )}

      {/* Reminder Modal */}
      {isReminderModalOpen && (
        <KMReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          records={kmRecords}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <KMDeleteModal
          isOpen={Boolean(deletingRecord)}
          onClose={() => setDeletingRecord(null)}
          record={deletingRecord}
          onConfirm={handleDeleteRecord}
        />
      )}
    </div>
  );
}
