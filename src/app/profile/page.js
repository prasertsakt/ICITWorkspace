'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  subscribePersonnelList,
  subscribeDepartmentList,
  subscribeExecutiveList,
  subscribeLeaveList,
  subscribeTimeAttendanceList,
  isDummyLeaveRecord,
  isDummyTimeAttendanceRecord,
} from '@/lib/storageService';
import {
  calculateTenure,
  calculateRetirementCountdown,
  formatThaiDisplayDate,
  formatLocalDate,
} from '@/lib/dateUtils';
import {
  PERSONNEL_STATUS,
  USER_ROLES,
  LEAVE_TYPES,
  LEAVE_TYPE_CONFIG,
  TIME_ATTENDANCE_TYPES,
  TIME_ATTENDANCE_STEPS,
  TIME_ATTENDANCE_STEP_CONFIG,
} from '@/lib/constants';
import {
  User,
  Building2,
  Calendar,
  Clock,
  Award,
  ShieldCheck,
  Mail,
  FileText,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  LogIn,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Eye,
  CalendarDays,
  RotateCcw,
  ChevronRight,
  UserCheck,
  X,
} from 'lucide-react';

function ProfileContent() {
  const { currentPersonnel, currentUser, isAdmin, handleGoogleSignIn } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Master Data States
  const [departmentList, setDepartmentList] = useState([]);
  const [executiveList, setExecutiveList] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leave & Attendance States
  const [leaves, setLeaves] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [selectedLeaveYear, setSelectedLeaveYear] = useState(() => new Date().getFullYear());

  // Search box state for admin personnel switcher
  const [personSearchQuery, setPersonSearchQuery] = useState('');

  // 1. Subscriptions (Must be top-level & unconditional)
  useEffect(() => {
    setLoading(true);
    const unsubPersonnel = subscribePersonnelList((list) => {
      setPersonnelList(list || []);
      setLoading(false);
    });
    const unsubDepts = subscribeDepartmentList((list) => {
      setDepartmentList(list || []);
    });
    const unsubExecs = subscribeExecutiveList((list) => {
      setExecutiveList(list || []);
    });

    return () => {
      unsubPersonnel();
      unsubDepts();
      unsubExecs();
    };
  }, []);

  useEffect(() => {
    const unsubLeaves = subscribeLeaveList(
      (list) => {
        setLeaves((list || []).filter((l) => !isDummyLeaveRecord(l)));
      },
      { year: selectedLeaveYear, enableRealtime: true }
    );
    return () => unsubLeaves();
  }, [selectedLeaveYear]);

  useEffect(() => {
    const unsubAttendances = subscribeTimeAttendanceList((list) => {
      const validRecords = (list || []).filter((r) => !isDummyTimeAttendanceRecord(r));
      setAttendances(validRecords);
    });
    return () => unsubAttendances();
  }, []);

  // 2. Target Personnel Resolution
  const paramId = searchParams.get('id') || searchParams.get('personnelId');
  const targetPersonnel = useMemo(() => {
    if (paramId && personnelList.length > 0) {
      const found = personnelList.find((p) => p.id === paramId);
      if (found) return found;
    }
    return currentPersonnel;
  }, [paramId, personnelList, currentPersonnel]);

  const isViewingSelf = Boolean(
    currentPersonnel && targetPersonnel && currentPersonnel.id === targetPersonnel.id
  );

  // 3. Filtered Personnel for Admin Switcher Search Box
  const filteredPersonnelList = useMemo(() => {
    if (!personSearchQuery.trim()) return personnelList;
    const q = personSearchQuery.trim().toLowerCase();
    return personnelList.filter((p) => {
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchDept = (p.department || '').toLowerCase().includes(q);
      const matchPos = (p.position || '').toLowerCase().includes(q);
      const matchEmail = (p.email || '').toLowerCase().includes(q);
      return matchName || matchDept || matchPos || matchEmail;
    });
  }, [personnelList, personSearchQuery]);

  // 4. Calculations for Target Personnel (All hooks called unconditionally)
  const tenure = useMemo(() => {
    if (!targetPersonnel?.appointmentDate) return { years: 0, months: 0, days: 0, text: '-' };
    return calculateTenure(targetPersonnel.appointmentDate);
  }, [targetPersonnel?.appointmentDate]);

  const retirement = useMemo(() => {
    if (!targetPersonnel?.retirementDate) return { years: 0, months: 0, days: 0, text: '-' };
    return calculateRetirementCountdown(targetPersonnel.retirementDate);
  }, [targetPersonnel?.retirementDate]);

  const deptInfo = useMemo(() => {
    return departmentList.find((d) => d.name === targetPersonnel?.department);
  }, [departmentList, targetPersonnel?.department]);

  const deptHead = useMemo(() => {
    return personnelList.find((p) => p.id === deptInfo?.headPersonnelId);
  }, [personnelList, deptInfo?.headPersonnelId]);

  const supervisingExec = useMemo(() => {
    return executiveList.find((e) => e.id === deptInfo?.supervisingExecutiveId);
  }, [executiveList, deptInfo?.supervisingExecutiveId]);

  const colleagues = useMemo(() => {
    if (!targetPersonnel?.department) return [];
    return personnelList.filter(
      (p) =>
        p.department === targetPersonnel.department &&
        p.id !== targetPersonnel.id &&
        p.status === PERSONNEL_STATUS.ACTIVE
    );
  }, [personnelList, targetPersonnel?.department, targetPersonnel?.id]);

  const headDeptNames = useMemo(() => {
    if (!targetPersonnel?.id) return [];
    return departmentList
      .filter((d) => d.headPersonnelId === targetPersonnel.id)
      .map((d) => d.name);
  }, [departmentList, targetPersonnel?.id]);

  // 5. Leave Data Hooks
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  const userLeaves = useMemo(() => {
    if (!targetPersonnel) return [];
    return leaves.filter((l) => {
      const matchId = l.personnelId && l.personnelId === targetPersonnel.id;
      const matchName = l.personnelName && l.personnelName === targetPersonnel.name;
      const matchEmail =
        targetPersonnel.email && l.personnelEmail && l.personnelEmail === targetPersonnel.email;
      return matchId || matchName || matchEmail;
    });
  }, [leaves, targetPersonnel]);

  const totalLeaveDays = useMemo(() => {
    return userLeaves.reduce((acc, curr) => acc + (Number(curr.totalDays) || 1), 0);
  }, [userLeaves]);

  const leaveTypeBreakdown = useMemo(() => {
    const counts = {};
    LEAVE_TYPES.forEach((t) => (counts[t] = { days: 0, count: 0 }));
    userLeaves.forEach((l) => {
      const type = l.leaveType || 'อื่น ๆ';
      if (!counts[type]) {
        counts[type] = { days: 0, count: 0 };
      }
      counts[type].days += Number(l.totalDays) || 1;
      counts[type].count += 1;
    });
    return counts;
  }, [userLeaves]);

  const activeLeaveToday = useMemo(() => {
    return userLeaves.find(
      (l) => l.startDate && l.endDate && l.startDate <= todayStr && todayStr <= l.endDate
    );
  }, [userLeaves, todayStr]);

  const recentLeaves = useMemo(() => {
    return [...userLeaves]
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
      .slice(0, 5);
  }, [userLeaves]);

  // 6. Time Attendance Data Hooks
  const userAttendances = useMemo(() => {
    if (!targetPersonnel) return [];
    return attendances.filter((a) => {
      const matchId = a.requesterId && a.requesterId === targetPersonnel.id;
      const matchName = a.requesterName && a.requesterName === targetPersonnel.name;
      const matchEmail =
        targetPersonnel.email && a.requesterEmail && a.requesterEmail === targetPersonnel.email;
      return matchId || matchName || matchEmail;
    });
  }, [attendances, targetPersonnel]);

  const attendanceMetrics = useMemo(() => {
    const total = userAttendances.length;
    const pending = userAttendances.filter((a) =>
      ['HR_REVIEW', 'WITNESS_CONFIRM', 'DEPT_HEAD_APPROVE', 'DEPUTY_APPROVE'].includes(a.currentStep)
    ).length;
    const completed = userAttendances.filter((a) => a.currentStep === 'COMPLETED').length;
    const rejected = userAttendances.filter((a) =>
      ['REJECTED', 'CANCELLED'].includes(a.currentStep)
    ).length;

    return { total, pending, completed, rejected };
  }, [userAttendances]);

  const pendingForTargetPerson = useMemo(() => {
    if (!targetPersonnel) return [];
    return attendances.filter((item) => {
      const isPendingStep =
        item.currentStep === 'HR_REVIEW' ||
        item.currentStep === 'WITNESS_CONFIRM' ||
        item.currentStep === 'DEPT_HEAD_APPROVE' ||
        item.currentStep === 'DEPUTY_APPROVE';

      if (!isPendingStep) return false;

      const needsWitness =
        item.currentStep === 'WITNESS_CONFIRM' && item.witnessId === targetPersonnel.id;
      const needsDeptHead =
        item.currentStep === 'DEPT_HEAD_APPROVE' &&
        (item.departmentHeadId === targetPersonnel.id ||
          headDeptNames.includes(item.requesterDepartment));
      const needsDeputy =
        item.currentStep === 'DEPUTY_APPROVE' && item.deputyDirectorId === targetPersonnel.id;

      return needsWitness || needsDeptHead || needsDeputy;
    });
  }, [attendances, targetPersonnel, headDeptNames]);

  const recentAttendances = useMemo(() => {
    return [...userAttendances]
      .sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''))
      .slice(0, 5);
  }, [userAttendances]);

  // Available Thai Years for Leave Selector
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];

  // =========================================================================
  // CONDITIONAL RENDERS (Placed strictly AFTER all hooks to obey Rules of Hooks)
  // =========================================================================
  if (!currentPersonnel && !targetPersonnel) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div
          className="card-glass"
          style={{ maxWidth: '460px', margin: '0 auto', padding: '2.5rem 1.5rem' }}
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
            <User size={32} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            เข้าสู่ระบบเพื่อดูข้อมูลของท่าน
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}
          >
            กรุณาลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อตรวจสอบข้อมูลบุคลากร สถิติวันลา
            และประวัติการขอลงเวลาปฏิบัติราชการ
          </p>
          <button onClick={handleGoogleSignIn} className="btn btn-primary" style={{ width: '100%' }}>
            <LogIn size={18} />
            <span>เข้าสู่ระบบด้วยบัญชี Google KMUTNB</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* Admin / Manager Viewing Banner */}
      {!isViewingSelf && targetPersonnel && (
        <div
          style={{
            background: 'linear-gradient(90deg, #FEF3C7 0%, #FDE68A 100%)',
            border: '1px solid #F59E0B',
            borderRadius: 'var(--radius-lg)',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.25rem' }}>👀</span>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#92400E' }}>
                กำลังดูข้อมูลประจำตัวของ: {targetPersonnel.name}
              </div>
              <div style={{ fontSize: '0.775rem', color: '#B45309' }}>
                สังกัด: {targetPersonnel.department || '-'} | ตำแหน่ง: {targetPersonnel.position || '-'}
              </div>
            </div>
          </div>
          {currentPersonnel && (
            <Link
              href="/profile"
              className="btn btn-secondary btn-sm"
              style={{
                background: 'white',
                borderColor: '#D97706',
                color: '#B45309',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <RotateCcw size={14} />
              <span>กลับไปที่ข้อมูลของฉัน</span>
            </Link>
          )}
        </div>
      )}

      {/* Page Header with Admin Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.25rem',
            }}
          >
            <span className="badge badge-admin">
              <Sparkles size={12} />
              {isViewingSelf ? 'ข้อมูลส่วนบุคคลของท่าน (My Profile)' : 'ข้อมูลบุคลากรรายบุคคล (Personnel Profile)'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ข้อมูลประจำตัวบุคลากร
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            รายละเอียดการบรรจุ ตำแหน่ง สังกัด พร้อมสรุปข้อมูลปฏิทินวันลาและระบบขอลงเวลา
          </p>
        </div>

        {/* Personnel Switcher with Search Text Box for Admins */}
        {isAdmin && personnelList.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              background: 'white',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={16} style={{ color: 'var(--primary-600)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                สลับดูบุคลากร:
              </span>
            </div>

            {/* 1. Search text box next to drop down */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '0.6rem',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="ค้นหาชื่อ / ฝ่าย..."
                value={personSearchQuery}
                onChange={(e) => setPersonSearchQuery(e.target.value)}
                style={{
                  padding: '0.35rem 1.8rem 0.35rem 1.85rem',
                  fontSize: '0.825rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  outline: 'none',
                  width: '160px',
                  transition: 'all 0.2s',
                  background: '#F8FAFC',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary-500)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
              />
              {personSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPersonSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.4rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  title="ล้างคำค้นหา"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* 2. Dropdown listing filtered or all personnel */}
            <select
              value={targetPersonnel?.id || ''}
              onChange={(e) => {
                const selectedId = e.target.value;
                if (!selectedId) return;
                if (selectedId === currentPersonnel?.id) {
                  router.push('/profile');
                } else {
                  router.push(`/profile?id=${selectedId}`);
                }
              }}
              className="form-select"
              style={{
                fontSize: '0.85rem',
                padding: '0.35rem 0.65rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                minWidth: '220px',
                maxWidth: '320px',
              }}
            >
              {/* If targetPersonnel exists but is not in the filtered query result, keep it visible */}
              {targetPersonnel &&
                !filteredPersonnelList.some((p) => p.id === targetPersonnel.id) && (
                  <option value={targetPersonnel.id}>
                    {targetPersonnel.name} ({targetPersonnel.department || 'ไม่ระบุ'}) (เลือกอยู่)
                  </option>
                )}

              {filteredPersonnelList.length === 0 ? (
                <option value="" disabled>
                  ไม่พบบุคลากรที่ค้นหา &quot;{personSearchQuery}&quot;
                </option>
              ) : (
                filteredPersonnelList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.department || 'ไม่ระบุ'}) {p.id === currentPersonnel?.id ? '★ ตัวฉัน' : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.75rem' }}>
        {/* TOP: Digital ID Badge Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 50%, #818CF8 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem 1.75rem',
            color: 'white',
            boxShadow: '0 16px 36px -8px rgba(99, 102, 241, 0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle decorative circles */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-30px',
              left: '30%',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Top row: Org Title & Role */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} style={{ color: '#C7D2FE' }} />
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: '#E0E7FF',
                  }}
                >
                  ICIT ORGANIZATION BADGE
                </span>
              </div>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '99px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                {targetPersonnel?.role === USER_ROLES.ADMIN
                  ? '🛡️ ผู้ดูแลระบบ (Admin)'
                  : '👤 สมาชิก (USER)'}
              </span>
            </div>

            {/* Middle row: Avatar + Name + Position */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              {targetPersonnel?.avatarUrl ? (
                <img
                  src={targetPersonnel.avatarUrl}
                  alt={targetPersonnel.name}
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: 'var(--radius-full)',
                    objectFit: 'cover',
                    border: '3px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.25)',
                    border: '3px solid rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 800,
                  }}
                >
                  {targetPersonnel?.name?.charAt(0) || 'U'}
                </div>
              )}

              <div style={{ flex: 1, minWidth: '220px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em', margin: 0 }}>
                  {targetPersonnel?.name}
                </h3>
                <div
                  style={{
                    fontSize: '0.95rem',
                    color: '#E0E7FF',
                    fontWeight: 500,
                    margin: '0.25rem 0',
                  }}
                >
                  {targetPersonnel?.position}
                  {targetPersonnel?.level ? ` (${targetPersonnel.level})` : ''}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.18)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    🏢 {targetPersonnel?.department || 'ไม่ระบุฝ่าย'}
                  </span>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.18)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    🏷️ {targetPersonnel?.personnelType || 'พนักงานมหาวิทยาลัย'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom row: Verified Email & Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.8rem',
                color: '#E0E7FF',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} />
                <span>{targetPersonnel?.email || 'ไม่มีอีเมล'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#34D399',
                    boxShadow: '0 0 8px #34D399',
                  }}
                />
                <span style={{ fontWeight: 600 }}>สถานะ: {targetPersonnel?.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* METRICS ROW: Tenure & Retirement Calculation */}
        <div className="grid-2">
          {/* Tenure Card */}
          <div
            className="card-glass"
            style={{ padding: '1.5rem', borderLeft: '5px solid var(--mint-500)' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--mint-50)',
                  color: 'var(--mint-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={20} />
              </div>
              <div>
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}
                >
                  อายุการปฏิบัติงาน (Tenure)
                </span>
                <h4
                  style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--mint-600)', margin: 0 }}
                >
                  {tenure.text}
                </h4>
              </div>
            </div>

            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>วันที่ได้รับการบรรจุ:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {targetPersonnel?.appointmentDate
                  ? `${formatThaiDisplayDate(targetPersonnel.appointmentDate)} (พ.ศ.)`
                  : '-'}
              </strong>
            </div>
          </div>

          {/* Retirement Card */}
          <div
            className="card-glass"
            style={{ padding: '1.5rem', borderLeft: '5px solid var(--peach-500)' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--peach-50)',
                  color: 'var(--peach-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}
                >
                  การเกษียณอายุราชการ
                </span>
                <h4
                  style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--peach-text)', margin: 0 }}
                >
                  {retirement.text}
                </h4>
              </div>
            </div>

            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>กำหนดวันเกษียณอายุ:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {targetPersonnel?.retirementDate
                  ? `${formatThaiDisplayDate(targetPersonnel.retirementDate)} (พ.ศ.)`
                  : '-'}
              </strong>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 1: LEAVE CALENDAR SUMMARY & ACTION LINKS         */}
        {/* ======================================================== */}
        <div
          className="card-glass"
          style={{
            padding: '1.75rem',
            borderTop: '4px solid #6366F1',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
          }}
        >
          {/* Header with Year Selector & Links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    ปฏิทินและสรุปข้อมูลการลา (Leave Summary)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    สถิติการลาจำแนกตามประเภทและประวัติการลาประจำปี
                  </span>
                </div>
              </div>
            </div>

            {/* Year Selector & Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  ประจำปี พ.ศ.
                </span>
                <select
                  value={selectedLeaveYear}
                  onChange={(e) => setSelectedLeaveYear(Number(e.target.value))}
                  className="form-select"
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.35rem 0.65rem',
                    fontWeight: 700,
                    color: 'var(--primary-700)',
                  }}
                >
                  {yearOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr + 543}
                    </option>
                  ))}
                </select>
              </div>

              <Link
                href={`/leave?search=${encodeURIComponent(targetPersonnel?.name || '')}`}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>ดูปฏิทินวันลาทั้งหมด</span>
                <ExternalLink size={13} />
              </Link>

              {/* Admin Only: Create / Record Leave */}
              {isAdmin && (
                <Link
                  href="/leave?action=new"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Plus size={14} />
                  <span>บันทึกการลาใหม่</span>
                </Link>
              )}
            </div>
          </div>

          {/* Active Leave Today Banner */}
          {activeLeaveToday && (
            <div
              style={{
                background: 'linear-gradient(90deg, #EFF6FF 0%, #DBEAFE 100%)',
                border: '1px solid #93C5FD',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🏖️</span>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#1E40AF', fontSize: '0.875rem' }}>
                  วันนี้กำลังอยู่ในช่วง: {activeLeaveToday.leaveType}
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#1D4ED8', marginLeft: '0.5rem' }}>
                  ({formatThaiDisplayDate(activeLeaveToday.startDate)} -{' '}
                  {formatThaiDisplayDate(activeLeaveToday.endDate)})
                </span>
                {activeLeaveToday.reason && (
                  <div style={{ fontSize: '0.775rem', color: '#3B82F6', marginTop: '0.15rem' }}>
                    เหตุผล: {activeLeaveToday.reason}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leave Summary Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Total Leave Days */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                วันลาสะสมทั้งหมด
              </span>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: 'var(--primary-600)',
                  margin: '0.2rem 0',
                }}
              >
                {totalLeaveDays}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>วัน ในปีนี้</span>
            </div>

            {/* Total Occurrences */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                จำนวนครั้งที่ยื่นลา
              </span>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#0D9488',
                  margin: '0.2rem 0',
                }}
              >
                {userLeaves.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ครั้ง</span>
            </div>

            {/* Vacation Leave Days */}
            <div
              style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
                ลาพักผ่อน
              </span>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#059669',
                  margin: '0.2rem 0',
                }}
              >
                {leaveTypeBreakdown['ลาพักผ่อน']?.days || 0}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                วัน ({leaveTypeBreakdown['ลาพักผ่อน']?.count || 0} ครั้ง)
              </span>
            </div>

            {/* Sick Leave Days */}
            <div
              style={{
                background: '#FFE4E6',
                border: '1px solid #FDA4AF',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#BE123C', fontWeight: 600 }}>
                ลาป่วย
              </span>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#E11D48',
                  margin: '0.2rem 0',
                }}
              >
                {leaveTypeBreakdown['ลาป่วย']?.days || 0}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#BE123C' }}>
                วัน ({leaveTypeBreakdown['ลาป่วย']?.count || 0} ครั้ง)
              </span>
            </div>

            {/* Personal Leave Days */}
            <div
              style={{
                background: '#E0F2FE',
                border: '1px solid #BAE6FD',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#0369A1', fontWeight: 600 }}>
                ลากิจ
              </span>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#0284C7',
                  margin: '0.2rem 0',
                }}
              >
                {leaveTypeBreakdown['ลากิจ']?.days || 0}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#0369A1' }}>
                วัน ({leaveTypeBreakdown['ลากิจ']?.count || 0} ครั้ง)
              </span>
            </div>
          </div>

          {/* Recent Leave History List */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                📋 ประวัติการลาล่าสุดในปี {selectedLeaveYear + 543} ({userLeaves.length} รายการ)
              </span>
            </div>

            {recentLeaves.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                ✨ ยังไม่มีประวัติการลาในปี {selectedLeaveYear + 543}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {recentLeaves.map((leave, idx) => {
                  const cfg = LEAVE_TYPE_CONFIG[leave.leaveType] || {
                    bg: '#F1F5F9',
                    color: '#475569',
                  };
                  return (
                    <div
                      key={leave.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-card-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            background: cfg.bg,
                            color: cfg.color,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '99px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {leave.leaveType}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatThaiDisplayDate(leave.startDate)}
                            {leave.startDate !== leave.endDate &&
                              ` - ${formatThaiDisplayDate(leave.endDate)}`}
                          </div>
                          {leave.reason && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              เหตุผล: {leave.reason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--primary-600)',
                            background: 'white',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {leave.totalDays || 1} วัน
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: TIME ATTENDANCE SUMMARY & ACTION LINKS        */}
        {/* ======================================================== */}
        <div
          className="card-glass"
          style={{
            padding: '1.75rem',
            borderTop: '4px solid #0D9488',
            boxShadow: '0 4px 20px rgba(13, 148, 136, 0.08)',
          }}
        >
          {/* Header & Quick Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    background: '#CCFBF1',
                    color: '#0F766E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Clock size={20} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    ระบบขอลงเวลาปฏิบัติราชการ (Time Attendance)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    คำขอลงเวลามา/กลับปฏิบัติราชการ และสถานะการอนุมัติตามสายงาน
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <Link
                href="/time-attendance"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>ดูระบบขอลงเวลาทั้งหมด</span>
                <ExternalLink size={13} />
              </Link>

              <Link
                href="/time-attendance?tab=mine"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>เฉพาะคำขอของฉัน</span>
              </Link>

              <Link
                href="/time-attendance?action=new"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={14} />
                <span>ยื่นขอลงเวลาใหม่</span>
              </Link>
            </div>
          </div>

          {/* Attention Banner if targetPersonnel has requests waiting for their signature */}
          {pendingForTargetPerson.length > 0 && (
            <div
              style={{
                background: 'linear-gradient(90deg, #FEF2F2 0%, #FEE2E2 100%)',
                border: '1px solid #F87171',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.15rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <AlertCircle size={20} style={{ color: '#DC2626' }} />
                <div>
                  <strong style={{ color: '#991B1B', fontSize: '0.875rem' }}>
                    มีคำขอที่รอท่านตรวจสอบ/รับรอง: {pendingForTargetPerson.length} รายการ
                  </strong>
                  <div style={{ fontSize: '0.775rem', color: '#B91C1C' }}>
                    ในฐานะพยาน หรือหัวหน้าฝ่าย หรือผู้บังคับบัญชา
                  </div>
                </div>
              </div>
              <Link
                href="/time-attendance?tab=pending_me"
                className="btn btn-danger btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                ไปลงนามรับรอง ({pendingForTargetPerson.length})
              </Link>
            </div>
          )}

          {/* Attendance Summary Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Total Requests */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                คำขอที่ยื่นทั้งหมด
              </span>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: 'var(--primary-600)',
                  margin: '0.2rem 0',
                }}
              >
                {attendanceMetrics.total}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>รายการ</span>
            </div>

            {/* Pending Requests */}
            <div
              style={{
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>
                รอการตรวจสอบ/อนุมัติ
              </span>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#D97706',
                  margin: '0.2rem 0',
                }}
              >
                {attendanceMetrics.pending}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#B45309' }}>กำลังดำเนินการ</span>
            </div>

            {/* Completed Requests */}
            <div
              style={{
                background: '#DCFCE7',
                border: '1px solid #86EFAC',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 600 }}>
                อนุมัติสมบูรณ์
              </span>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#16A34A',
                  margin: '0.2rem 0',
                }}
              >
                {attendanceMetrics.completed}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#15803D' }}>เสร็จสิ้น</span>
            </div>

            {/* Rejected / Cancelled */}
            <div
              style={{
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                ไม่อนุมัติ / ยกเลิก
              </span>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#64748B',
                  margin: '0.2rem 0',
                }}
              >
                {attendanceMetrics.rejected}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>รายการ</span>
            </div>
          </div>

          {/* Recent Attendance Requests List */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                📋 คำขอลงเวลาล่าสุด ({userAttendances.length} รายการ)
              </span>
            </div>

            {recentAttendances.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                ✨ ยังไม่มีประวัติการยื่นคำขอลงเวลา
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {recentAttendances.map((item) => {
                  const stepCfg = TIME_ATTENDANCE_STEP_CONFIG[item.currentStep] || {
                    label: item.currentStep,
                    bg: '#F1F5F9',
                    color: '#64748B',
                  };
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-card-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            background: stepCfg.bg,
                            color: stepCfg.color,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '99px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {stepCfg.label}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.attendanceType || 'ลงเวลาปฏิบัติราชการ'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            วันที่: {formatThaiDisplayDate(item.date)} | เวลา: {item.time || '-'} น.
                            {item.reason && ` | เหตุผล: ${item.reason}`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Link
                          href={`/time-attendance?viewId=${item.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.775rem',
                            padding: '0.25rem 0.65rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <span>ดูรายละเอียด</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* DEPARTMENT & SUPERVISORY HIERARCHY */}
        <div className="card-glass" style={{ padding: '1.5rem' }}>
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '1rem',
            }}
          >
            🏢 โครงสร้างและสายการบังคับบัญชา
          </h3>

          <div className="grid-3" style={{ gap: '1rem' }}>
            <div
              style={{
                background: 'var(--bg-card-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                ฝ่ายที่สังกัด
              </span>
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginTop: '0.25rem',
                }}
              >
                {targetPersonnel?.department || 'ไม่ระบุฝ่าย'}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {deptInfo?.description || 'หน่วยงานปฏิบัติการตามภารกิจ'}
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-card-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                หัวหน้าฝ่าย
              </span>
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginTop: '0.25rem',
                }}
              >
                {deptHead ? deptHead.name : 'ยังไม่ได้ระบุ'}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {deptHead ? `${deptHead.position}${deptHead.level ? ` (${deptHead.level})` : ''}` : '-'}
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-card-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                ผู้บริหารที่กำกับดูแลฝ่าย
              </span>
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginTop: '0.25rem',
                }}
              >
                {supervisingExec ? supervisingExec.name : 'ยังไม่ได้ระบุ'}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {supervisingExec ? supervisingExec.position : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* OFFICIAL DETAILS & REMARKS */}
        <div className="card-glass" style={{ padding: '1.5rem' }}>
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '1rem',
            }}
          >
            📋 รายละเอียดข้อมูลบุคลากร
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ประเภทบุคลากร</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {targetPersonnel?.personnelType}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ตำแหน่งงาน</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {targetPersonnel?.position}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ระดับตำแหน่ง</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {targetPersonnel?.level || '-'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>สถานะการปฏิบัติงาน</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {targetPersonnel?.status}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>อีเมลสำหรับล็อกอิน</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {targetPersonnel?.email}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>สิทธิ์ในระบบ</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {targetPersonnel?.role}
              </div>
            </div>
          </div>

          {targetPersonnel?.note && (
            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>หมายเหตุ</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {targetPersonnel.note}
              </p>
            </div>
          )}
        </div>

        {/* COLLEAGUES IN SAME DEPARTMENT */}
        {colleagues.length > 0 && (
          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                👥 เพื่อนร่วมฝ่าย ({colleagues.length} คน)
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                คลิกเพื่อดูข้อมูลประจำตัวของเพื่อนร่วมงาน
              </span>
            </div>

            <div className="grid-3">
              {colleagues.map((mate) => (
                <Link
                  key={mate.id}
                  href={`/profile?id=${mate.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                  className="card-interactive"
                >
                  {mate.avatarUrl ? (
                    <img
                      src={mate.avatarUrl}
                      alt=""
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'var(--primary-100)',
                        color: 'var(--primary-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      {mate.name?.charAt(0)}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {mate.name}
                    </h5>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {mate.position}
                      {mate.level ? ` (${mate.level})` : ''}
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <React.Suspense
      fallback={
        <div className="main-container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--primary-600)', marginBottom: '1rem' }}>
            <Clock size={36} className="spin" style={{ margin: '0 auto' }} />
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลประจำตัวบุคลากร...</p>
        </div>
      }
    >
      <ProfileContent />
    </React.Suspense>
  );
}
