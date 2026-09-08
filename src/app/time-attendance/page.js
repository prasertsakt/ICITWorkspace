'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeTimeAttendanceList,
  subscribePersonnelList,
  subscribeDepartmentList,
  subscribeExecutiveList,
  saveTimeAttendanceRecord,
  updateTimeAttendanceApproval,
  executeOneClickApproval,
  deleteTimeAttendanceRecord,
  resetTimeAttendanceSeedData,
} from '@/lib/storageService';
import {
  TIME_ATTENDANCE_TYPES,
  TIME_ATTENDANCE_STEPS,
  TIME_ATTENDANCE_STEP_CONFIG,
  PREDEFINED_DEPARTMENTS,
} from '@/lib/constants';
import TimeAttendanceModal from '@/components/TimeAttendanceModal';
import TimeAttendanceDetailModal from '@/components/TimeAttendanceDetailModal';
import TimeAttendanceEmailModal from '@/components/TimeAttendanceEmailModal';
import {
  Clock,
  Calendar,
  User,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Sparkles,
  FileText,
  Mail,
  RotateCcw,
  CheckCircle,
  Building2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Eye,
  Inbox,
  Send,
  SlidersHorizontal,
  LogIn,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getNotificationRecipientForStep } from '@/lib/emailNotificationService';

function TimeAttendanceContent() {
  const { currentPersonnel, isAdmin, handleGoogleSignIn, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [attendances, setAttendances] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [executiveList, setExecutiveList] = useState([]);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [emailModalRecord, setEmailModalRecord] = useState(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mine' | 'pending_me'
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stepFilter, setStepFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // Pagination Optimization
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, stepFilter, deptFilter, activeTab]);

  // 1-Click Action modal confirmation
  const [oneClickData, setOneClickData] = useState(null);
  const [oneClickProcessing, setOneClickProcessing] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState(null);

  // Subscriptions
  useEffect(() => {
    const unsubAttendances = subscribeTimeAttendanceList((list) => {
      setAttendances(list || []);
    });
    const unsubPersonnel = subscribePersonnelList((list) => {
      setPersonnelList(list || []);
    });
    const unsubDepts = subscribeDepartmentList((list) => {
      setDepartmentList(list || []);
    });
    const unsubExecs = subscribeExecutiveList((list) => {
      setExecutiveList(list || []);
    });

    return () => {
      unsubAttendances();
      unsubPersonnel();
      unsubDepts();
      unsubExecs();
    };
  }, []);

  // Role and permissions helpers
  const isHrStaff = currentPersonnel?.position === 'บุคลากร' || isAdmin;
  const isExecutive =
    currentPersonnel?.position?.includes('ผู้บริหาร') ||
    currentPersonnel?.position?.includes('ผู้อำนวยการ') ||
    currentPersonnel?.position?.includes('รองผู้อำนวยการ') ||
    isAdmin;

  // Departments where current user is the Department Head
  const headDeptNames = useMemo(() => {
    if (!currentPersonnel) return [];
    return departmentList
      .filter((d) => d.headPersonnelId === currentPersonnel.id)
      .map((d) => d.name);
  }, [departmentList, currentPersonnel]);

  const isAnyDeptHead = headDeptNames.length > 0;

  // 1. Base Access Control (Privacy & Scope):
  // - ผู้ขอ (Requester): ไม่สามารถเห็นรายการของผู้ขอคนอื่น (เห็นเฉพาะของตนเอง)
  // - พยาน (Witness): สามารถเห็นรายการที่ตนเองถูกระบุเป็นพยาน (และของตนเอง)
  // - หัวหน้าฝ่าย (Dept Head): สามารถเห็นรายการของบุคลากรในฝ่ายตนเอง หรือที่ระบุตนเองเป็นหัวหน้าฝ่าย
  // - เจ้าหน้าที่ฝ่ายบุคคล, ผู้บริหาร, Admin: สามารถเห็นคำขอทั้งหมดเพื่อตรวจสอบและกำกับดูแล
  const visibleAttendances = useMemo(() => {
    if (!currentPersonnel) return [];

    // HR Staff, Executives, and Admins have organization-wide visibility
    if (isAdmin || isHrStaff || isExecutive) {
      return attendances;
    }

    return attendances.filter((item) => {
      // 1. ผู้ขอ: เห็นรายการที่ตนเองเป็นผู้ยื่น
      if (item.requesterId === currentPersonnel.id) return true;

      // 2. พยาน: เห็นรายการที่ตนเองถูกระบุเป็นพยาน
      if (item.witnessId === currentPersonnel.id) return true;

      // 3. หัวหน้าฝ่าย: เห็นรายการในฝ่ายตนเอง หรือที่ระบุตนเองเป็นหัวหน้าฝ่าย
      if (item.departmentHeadId === currentPersonnel.id) return true;
      if (headDeptNames.includes(item.requesterDepartment)) return true;

      // 4. ได้รับมอบหมายเป็นรอง ผอ.
      if (item.deputyDirectorId === currentPersonnel.id) return true;

      return false;
    });
  }, [attendances, currentPersonnel, isHrStaff, isExecutive, isAdmin, headDeptNames]);

  // Handle URL query parameters for 1-Click Email Approvals or direct View (scoped to visibleAttendances)
  useEffect(() => {
    const actionId = searchParams.get('actionId');
    const step = searchParams.get('step');
    const decision = searchParams.get('decision');
    const token = searchParams.get('token');
    const viewId = searchParams.get('viewId');

    if (viewId && visibleAttendances.length > 0) {
      const rec = visibleAttendances.find((r) => r.id === viewId);
      if (rec) setViewingRecord(rec);
    }

    if (actionId && step && decision && token) {
      setOneClickData({ actionId, step, decision, token });
    }
  }, [searchParams, visibleAttendances]);

  // Execute 1-Click Confirmation
  const confirmOneClickAction = async () => {
    if (!oneClickData) return;
    setOneClickProcessing(true);
    try {
      const res = await executeOneClickApproval(
        oneClickData.actionId,
        oneClickData.step,
        oneClickData.decision,
        oneClickData.token,
        currentPersonnel || { name: 'ผู้ลงนามผ่านอีเมล' }
      );

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setNotificationBanner({
        type: 'success',
        text: `ดำเนินการบันทึกสถานะเรียบร้อยแล้ว (${oneClickData.decision === 'approve' ? 'อนุมัติ/รับรอง' : 'ไม่อนุมัติ'})`,
      });
      setOneClickData(null);
      router.replace('/time-attendance');
      setTimeout(() => setNotificationBanner(null), 5000);
    } catch (err) {
      setNotificationBanner({
        type: 'error',
        text: err.message || 'การดำเนินการผ่านลิงก์ไม่สำเร็จ',
      });
      setOneClickData(null);
    } finally {
      setOneClickProcessing(false);
    }
  };

  // Dashboard Metrics Calculations (scoped to visibleAttendances)
  const metrics = useMemo(() => {
    const total = visibleAttendances.length;
    const pendingHr = visibleAttendances.filter((a) => a.currentStep === 'HR_REVIEW').length;
    const pendingWitness = visibleAttendances.filter((a) => a.currentStep === 'WITNESS_CONFIRM').length;
    const pendingDeptHead = visibleAttendances.filter((a) => a.currentStep === 'DEPT_HEAD_APPROVE').length;
    const pendingDeputy = visibleAttendances.filter((a) => a.currentStep === 'DEPUTY_APPROVE').length;
    const completed = visibleAttendances.filter((a) => a.currentStep === 'COMPLETED').length;
    const rejected = visibleAttendances.filter((a) => a.currentStep === 'REJECTED').length;

    return { total, pendingHr, pendingWitness, pendingDeptHead, pendingDeputy, completed, rejected };
  }, [visibleAttendances]);

  // Count items pending current user's action
  const pendingMeCount = useMemo(() => {
    if (!currentPersonnel) return 0;
    return visibleAttendances.filter((item) => {
      const needsHr = item.currentStep === 'HR_REVIEW' && isHrStaff;
      const needsWitness = item.currentStep === 'WITNESS_CONFIRM' && item.witnessId === currentPersonnel.id;
      const needsDeptHead =
        item.currentStep === 'DEPT_HEAD_APPROVE' &&
        (item.departmentHeadId === currentPersonnel.id || headDeptNames.includes(item.requesterDepartment));
      const needsDeputy =
        item.currentStep === 'DEPUTY_APPROVE' &&
        (item.deputyDirectorId === currentPersonnel.id || isExecutive);

      return needsHr || needsWitness || needsDeptHead || needsDeputy || isAdmin;
    }).length;
  }, [visibleAttendances, currentPersonnel, isHrStaff, isExecutive, isAdmin, headDeptNames]);

  // Filtered List based on Active Tab, Search, and Filters
  const filteredAttendances = useMemo(() => {
    return visibleAttendances.filter((item) => {
      // Tab filter
      if (activeTab === 'mine') {
        if (currentPersonnel && item.requesterId !== currentPersonnel.id) return false;
      } else if (activeTab === 'witness') {
        if (currentPersonnel && item.witnessId !== currentPersonnel.id) return false;
      } else if (activeTab === 'dept_head') {
        const isHeadForThis =
          item.departmentHeadId === currentPersonnel.id || headDeptNames.includes(item.requesterDepartment);
        if (!isHeadForThis) return false;
      } else if (activeTab === 'pending_me') {
        if (!currentPersonnel) return false;
        // Check if item needs action from current user
        const needsHr = item.currentStep === 'HR_REVIEW' && isHrStaff;
        const needsWitness = item.currentStep === 'WITNESS_CONFIRM' && item.witnessId === currentPersonnel.id;
        const needsDeptHead =
          item.currentStep === 'DEPT_HEAD_APPROVE' &&
          (item.departmentHeadId === currentPersonnel.id || headDeptNames.includes(item.requesterDepartment));
        const needsDeputy =
          item.currentStep === 'DEPUTY_APPROVE' &&
          (item.deputyDirectorId === currentPersonnel.id || isExecutive);

        if (!needsHr && !needsWitness && !needsDeptHead && !needsDeputy && !isAdmin) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && item.requestType !== typeFilter) return false;

      // Step filter
      if (stepFilter !== 'all' && item.currentStep !== stepFilter) return false;

      // Department filter
      if (deptFilter !== 'all' && item.requesterDepartment !== deptFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.requesterName?.toLowerCase().includes(q);
        const matchWitness = item.witnessName?.toLowerCase().includes(q);
        const matchDept = item.requesterDepartment?.toLowerCase().includes(q);
        const matchDate = item.attendanceDate?.includes(q);
        const matchReason = item.reason?.toLowerCase().includes(q);
        if (!matchName && !matchWitness && !matchDept && !matchDate && !matchReason) return false;
      }

      return true;
    });
  }, [visibleAttendances, activeTab, typeFilter, stepFilter, deptFilter, searchQuery, currentPersonnel, isHrStaff, isExecutive, isAdmin, headDeptNames]);

  // Total pages and paginated attendances for high performance
  const totalPages = Math.max(1, Math.ceil(filteredAttendances.length / pageSize));
  const paginatedAttendances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAttendances.slice(start, start + pageSize);
  }, [filteredAttendances, currentPage, pageSize]);

  // Handle Save New Request
  const handleSaveNew = async (recordData) => {
    await saveTimeAttendanceRecord(recordData, currentPersonnel);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setNotificationBanner({
      type: 'success',
      text: 'ยื่นคำขอใบลงเวลาเรียบร้อยแล้ว ระบบได้ส่งแจ้งเตือนไปยังเจ้าหน้าที่ฝ่ายบุคคล',
    });
    setTimeout(() => setNotificationBanner(null), 5000);
  };

  // Handle Approve from Detail Modal
  const handleApproveStep = async (recordId, step, decision, comment) => {
    const updated = await updateTimeAttendanceApproval(recordId, step, decision, comment, currentPersonnel);
    setViewingRecord(updated);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    setNotificationBanner({
      type: 'success',
      text: `บันทึกสถานะการ${decision === 'approve' ? 'อนุมัติ/รับรอง' : 'ไม่อนุมัติ'}เรียบร้อยแล้ว`,
    });
    setTimeout(() => setNotificationBanner(null), 5000);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="pulse-dot" style={{ width: '16px', height: '16px', background: '#4F46E5' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
        </div>
      </div>
    );
  }

  // 2. Require Login State
  if (!currentPersonnel) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div
          className="card-glass"
          style={{
            maxWidth: '520px',
            margin: '0 auto',
            padding: '3rem 2rem',
            borderTop: '5px solid #4F46E5',
            boxShadow: '0 20px 40px -15px rgba(79, 70, 229, 0.15)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#EEF2FF',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.2)',
            }}
          >
            <Clock size={36} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#EEF2FF',
              color: '#4F46E5',
              padding: '4px 12px',
              borderRadius: '100px',
              fontSize: '0.78rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            <span className="pulse-dot" style={{ background: '#4F46E5' }} />
            ต้องเข้าสู่ระบบเพื่อใช้งาน
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            ระบบใบลงเวลา
          </h2>

          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            ยื่นคำขอลงเวลามา/กลับปฏิบัติราชการ
            ร่วมเป็นพยานรับรองเวลา หรือดำเนินการพิจารณาอนุมัติตามสายการบังคับบัญชา
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleGoogleSignIn}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#4F46E5',
                borderColor: '#4F46E5',
              }}
            >
              <LogIn size={20} />
              <span>เข้าสู่ระบบด้วย Google</span>
            </button>

            <Link
              href="/"
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>กลับสู่หน้าหลักพอร์ทัล</span>
            </Link>
          </div>

          {/* Feature Highlight Pills */}
          <div
            style={{
              marginTop: '2.25rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-color)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="#16A34A" />
              <span>ยื่นคำขอมา/กลับงาน</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="#16A34A" />
              <span>พยานรับรองเวลา</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="#16A34A" />
              <span>อนุมัติ 4 ขั้นตอน</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="#16A34A" />
              <span>แจ้งเตือนทางอีเมล</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* 1-Click Action Confirmation Modal */}
      {oneClickData && (
        <div className="modal-overlay" onClick={() => setOneClickData(null)} style={{ zIndex: 1000 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: oneClickData.decision === 'approve' ? '#DCFCE7' : '#FEE2E2',
                color: oneClickData.decision === 'approve' ? '#16A34A' : '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
              }}
            >
              {oneClickData.decision === 'approve' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              ยืนยันการ{oneClickData.decision === 'approve' ? 'อนุมัติ / รับรอง' : 'ไม่อนุมัติ'} ผ่านอีเมล
            </h3>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              ท่านต้องการยืนยันการ{' '}
              <strong style={{ color: oneClickData.decision === 'approve' ? '#16A34A' : '#DC2626' }}>
                {oneClickData.decision === 'approve' ? 'อนุมัติ / รับรอง' : 'ไม่อนุมัติ'}
              </strong>{' '}
              สำหรับคำขอนี้หรือไม่?
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setOneClickData(null)}
                className="btn btn-secondary"
                disabled={oneClickProcessing}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmOneClickAction}
                disabled={oneClickProcessing}
                className="btn btn-primary"
                style={{
                  background: oneClickData.decision === 'approve' ? '#10B981' : '#EF4444',
                  borderColor: oneClickData.decision === 'approve' ? '#10B981' : '#EF4444',
                }}
              >
                {oneClickProcessing ? 'กำลังบันทึก...' : 'ยืนยันดำเนินการ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast Banner */}
      {notificationBanner && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: notificationBanner.type === 'success' ? '#ECFDF5' : '#FFF1F2',
            border: `1px solid ${notificationBanner.type === 'success' ? '#A7F3D0' : '#FECDD3'}`,
            color: notificationBanner.type === 'success' ? '#065F46' : '#9F1239',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', fontWeight: 600 }}>
            {notificationBanner.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{notificationBanner.text}</span>
          </div>
          <button
            onClick={() => setNotificationBanner(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Banner & Header */}
      <section
        style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 40%, #EDE9FE 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.25rem 2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(199, 210, 254, 0.45)',
          boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.08)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span
                className="badge"
                style={{
                  background: 'white',
                  color: 'var(--primary-600)',
                  border: '1px solid var(--primary-200)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Clock size={13} />
                ระบบใบลงเวลา (Time Attendance)
              </span>

            </div>

            <h1
              style={{
                fontSize: 'clamp(1.75rem, 3.8vw, 2.35rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                marginBottom: '0.65rem',
              }}
            >
              ระบบใบลงเวลาปฏิบัติราชการ
            </h1>

            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              ยื่นคำขอลงเวลามา/กลับปฏิบัติราชการ พร้อมระบุพยานหรือแนบภาพกล้องวงจรปิด ผ่านกระบวนการตรวจสอบโดยฝ่ายบุคคล รับรองโดยพยาน อนุมัติโดยหัวหน้าฝ่าย และรองผู้อำนวยการฝ่ายบริหาร
            </p>
          </div>

          {/* New Request Button */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {currentPersonnel ? (
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.35rem', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}
              >
                <Plus size={18} />
                <span>สร้างใบลงเวลา</span>
              </button>
            ) : (
              <button onClick={handleGoogleSignIn} className="btn btn-primary">
                <span>เข้าสู่ระบบเพื่อสร้างใบลงเวลา</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('ต้องการรีเซ็ตข้อมูลตัวอย่างใบลงเวลาหรือไม่?')) {
                    resetTimeAttendanceSeedData();
                  }
                }}
                className="btn btn-secondary btn-sm"
                title="รีเซ็ตข้อมูลตัวอย่าง"
              >
                <RotateCcw size={14} />
                <span>รีเซ็ตตัวอย่าง</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Minimal Dashboard (Summary Cards) */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          {/* Total */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              borderLeft: '4px solid var(--primary-500)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
              คำขอทั้งหมด
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {metrics.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              รายการทั้งหมดในระบบ
            </div>
          </div>

          {/* Pending HR */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              borderLeft: '4px solid #F59E0B',
              background: metrics.pendingHr > 0 ? '#FFFBEB' : 'white',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 600, marginBottom: '4px' }}>
              1. รอฝ่ายบุคคลตรวจ
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#B45309' }}>
              {metrics.pendingHr}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              เจ้าหน้าที่บุคลากร
            </div>
          </div>

          {/* Pending Witness */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              borderLeft: '4px solid #6366F1',
              background: metrics.pendingWitness > 0 ? '#EEF2FF' : 'white',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#4338CA', fontWeight: 600, marginBottom: '4px' }}>
              2. รอพยานรับรอง
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4338CA' }}>
              {metrics.pendingWitness}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              พยานที่ถูกระบุ
            </div>
          </div>

          {/* Pending Dept Head */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              borderLeft: '4px solid #8B5CF6',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#7E22CE', fontWeight: 600, marginBottom: '4px' }}>
              3. รอหัวหน้าฝ่าย
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7E22CE' }}>
              {metrics.pendingDeptHead}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              หัวหน้าประจำฝ่าย
            </div>
          </div>

          {/* Pending Deputy Director */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              borderLeft: '4px solid #EC4899',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#BE185D', fontWeight: 600, marginBottom: '4px' }}>
              4. รอรอง ผอ. อนุมัติ
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#BE185D' }}>
              {metrics.pendingDeputy}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              รอง ผอ.ฝ่ายบริหาร
            </div>
          </div>

          {/* Completed */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              borderLeft: '4px solid #10B981',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600, marginBottom: '4px' }}>
              อนุมัติสมบูรณ์
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#047857' }}>
              {metrics.completed}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              เสร็จสิ้นกระบวนการ
            </div>
          </div>
        </div>
      </section>

      {/* Tabs, Search & Filters Bar */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div
          className="card"
          style={{
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '1.25rem',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                padding: '0.65rem 1rem',
                borderBottom: activeTab === 'all' ? '2.5px solid var(--primary-600)' : '2.5px solid transparent',
                background: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                fontWeight: activeTab === 'all' ? 700 : 500,
                color: activeTab === 'all' ? 'var(--primary-600)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Inbox size={16} />
              <span>
                {isAdmin || isHrStaff || isExecutive ? 'คำขอทั้งหมด' : 'คำขอที่เกี่ยวข้อง'} ({visibleAttendances.length})
              </span>
            </button>

            {currentPersonnel && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('mine')}
                  style={{
                    padding: '0.65rem 1rem',
                    borderBottom: activeTab === 'mine' ? '2.5px solid var(--primary-600)' : '2.5px solid transparent',
                    background: 'transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    fontWeight: activeTab === 'mine' ? 700 : 500,
                    color: activeTab === 'mine' ? 'var(--primary-600)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <User size={16} />
                  <span>คำขอของฉัน ({visibleAttendances.filter((a) => a.requesterId === currentPersonnel.id).length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('witness')}
                  style={{
                    padding: '0.65rem 1rem',
                    borderBottom: activeTab === 'witness' ? '2.5px solid var(--primary-600)' : '2.5px solid transparent',
                    background: 'transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    fontWeight: activeTab === 'witness' ? 700 : 500,
                    color: activeTab === 'witness' ? 'var(--primary-600)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Users size={16} />
                  <span>ฉันเป็นพยาน ({visibleAttendances.filter((a) => a.witnessId === currentPersonnel.id).length})</span>
                </button>

                {isAnyDeptHead && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('dept_head')}
                    style={{
                      padding: '0.65rem 1rem',
                      borderBottom: activeTab === 'dept_head' ? '2.5px solid var(--primary-600)' : '2.5px solid transparent',
                      background: 'transparent',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      fontWeight: activeTab === 'dept_head' ? 700 : 500,
                      color: activeTab === 'dept_head' ? 'var(--primary-600)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Building2 size={16} />
                    <span>
                      คำขอในฝ่าย ({visibleAttendances.filter((a) => a.departmentHeadId === currentPersonnel.id || headDeptNames.includes(a.requesterDepartment)).length})
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('pending_me')}
                  style={{
                    padding: '0.65rem 1rem',
                    borderBottom: activeTab === 'pending_me' ? '2.5px solid var(--primary-600)' : '2.5px solid transparent',
                    background: 'transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    fontWeight: activeTab === 'pending_me' ? 700 : 500,
                    color: activeTab === 'pending_me' ? 'var(--primary-600)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle size={16} />
                  <span>รอฉันดำเนินการ</span>
                  {pendingMeCount > 0 && (
                    <span
                      style={{
                        background: '#EF4444',
                        color: 'white',
                        fontSize: '0.72rem',
                        padding: '1px 7px',
                        borderRadius: '100px',
                        fontWeight: 700,
                        marginLeft: '2px',
                      }}
                    >
                      {pendingMeCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Search and Filters Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้ขอ, พยาน, ฝ่ายงาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
              />
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
            </div>

            {/* Filter by Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">ประเภททั้งหมด (มา / กลับ)</option>
              {TIME_ATTENDANCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Filter by Step */}
            <select
              value={stepFilter}
              onChange={(e) => setStepFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">สถานะขั้นตอนทั้งหมด</option>
              {Object.entries(TIME_ATTENDANCE_STEP_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>

            {/* Filter by Department */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">ทุกฝ่ายงาน</option>
              {PREDEFINED_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Requests List (Table on desktop, Cards on mobile) */}
      <section style={{ marginBottom: '3rem' }}>
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {filteredAttendances.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>ประเภทคำขอ</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>ผู้ขอลงเวลา & ฝ่าย</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>วันที่ขอลงเวลา</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>เวลาจริง</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>พยานผู้รับรอง</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>สถานะขั้นตอน</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>การแจ้งเตือนอีเมล</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'center' }}>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAttendances.map((item) => {
                    const stepCfg = TIME_ATTENDANCE_STEP_CONFIG[item.currentStep] || {
                      label: item.currentStep,
                      bg: '#F1F5F9',
                      color: '#475569',
                    };
                    const recipient = getNotificationRecipientForStep(item, item.currentStep, personnelList);

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* ประเภทคำขอ */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: item.requestType === 'ลงเวลามาปฏิบัติราชการ' ? '#0369A1' : '#4338CA',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Clock size={15} />
                            {item.requestType}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                            ยื่นเมื่อ {item.actionDate}
                          </span>
                        </td>

                        {/* ผู้ขอลงเวลา & ฝ่าย */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: 700, color: '#0284C7' }}>{item.requesterName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {item.requesterDepartment}
                          </div>
                        </td>

                        {/* วันที่ขอลงเวลา */}
                        <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#0284C7' }}>
                          {item.attendanceDate}
                        </td>

                        {/* เวลาจริง */}
                        <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.attendanceTime}
                        </td>

                        {/* พยานผู้รับรอง */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div>{item.witnessName || '-'}</div>
                          {item.statusWitness === 'รับรอง' && (
                            <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>
                              &check; รับรองแล้ว
                            </span>
                          )}
                        </td>

                        {/* สถานะขั้นตอน */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span
                            className="badge"
                            style={{
                              background: stepCfg.bg,
                              color: stepCfg.color,
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              padding: '0.3rem 0.65rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>{stepCfg.label}</span>
                          </span>
                          {item.finalStatus && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              ผล: {item.finalStatus}
                            </div>
                          )}
                        </td>

                        {/* การแจ้งเตือนอีเมล */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                color: '#15803D',
                                background: '#F0FDF4',
                                border: '1px solid #BBF7D0',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '999px',
                              }}
                              title={`ส่งแจ้งเตือนและลิงก์ 1-Click Action ถึง ${recipient?.name || 'ผู้มีอำนาจ'}`}
                            >
                              <Mail size={12} color="#16A34A" />
                              <span>ถึง: {recipient?.name ? (recipient.name.length > 13 ? recipient.name.substring(0, 13) + '...' : recipient.name) : 'ผู้มีอำนาจ'}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {recipient?.email || '-'}
                            </div>
                          </div>
                        </td>

                        {/* ปุ่มดูฟอร์มและกิจกรรม */}
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setViewingRecord(item)}
                              className="btn btn-secondary btn-sm"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.8rem',
                                color: 'var(--primary-700)',
                                background: 'var(--primary-50)',
                                borderColor: 'var(--primary-200)',
                              }}
                              title="เปิดดูแบบฟอร์ม บันทึกกิจกรรม และดำเนินการอนุมัติ"
                            >
                              <Eye size={14} />
                              <span>ดูฟอร์มและกิจกรรม</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setEmailModalRecord(item)}
                              className="btn btn-ghost btn-sm btn-icon"
                              title="ดูตัวอย่างอีเมลและลิงก์ 1-Click"
                            >
                              <Mail size={16} color="var(--primary-600)" />
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`คุณต้องการลบคำขอของ ${item.requesterName} หรือไม่?`)) {
                                    await deleteTimeAttendanceRecord(item.id);
                                  }
                                }}
                                className="btn btn-ghost btn-sm btn-icon"
                                title="ลบรายการ (Admin)"
                                style={{ color: '#DC2626' }}
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Table Pagination Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.25rem',
                  borderTop: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  แสดง {filteredAttendances.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredAttendances.length)} จากทั้งหมด <strong>{filteredAttendances.length}</strong> รายการ
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="form-input"
                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', width: 'auto' }}
                  >
                    <option value={5}>5 รายการ / หน้า</option>
                    <option value={10}>10 รายการ / หน้า</option>
                    <option value={25}>25 รายการ / หน้า</option>
                    <option value={50}>50 รายการ / หน้า</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                  >
                    <ChevronLeft size={13} />
                    <span>ก่อนหน้า</span>
                  </button>

                  <span style={{ fontSize: '0.82rem', fontWeight: 600, padding: '0 4px' }}>
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                  >
                    <span>ถัดไป</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Clock size={42} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                ไม่พบข้อมูลใบลงเวลาตามเงื่อนไขที่เลือก
              </h3>
              <p style={{ fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
                ลองเปลี่ยนตัวกรอง ค้นหาด้วยคำอื่น หรือกดสร้างใบลงเวลาใหม่
              </p>
              {currentPersonnel && (
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={16} />
                  <span>สร้างใบลงเวลา</span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* New Request Modal */}
      <TimeAttendanceModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleSaveNew}
        currentPersonnel={currentPersonnel}
        personnelList={personnelList}
        departmentList={departmentList}
        executiveList={executiveList}
        isAdmin={isAdmin}
      />

      {/* Detail, Form & Activity Modal */}
      <TimeAttendanceDetailModal
        isOpen={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        record={viewingRecord}
        currentPersonnel={currentPersonnel}
        personnelList={personnelList}
        isAdmin={isAdmin}
        onApproveStep={handleApproveStep}
        onOpenEmailPreview={(rec) => setEmailModalRecord(rec)}
      />

      {/* Email Preview & Notification Center Modal */}
      <TimeAttendanceEmailModal
        isOpen={!!emailModalRecord}
        onClose={() => setEmailModalRecord(null)}
        record={emailModalRecord}
        personnelList={personnelList}
      />
    </div>
  );
}

export default function TimeAttendancePage() {
  return (
    <React.Suspense
      fallback={
        <div className="main-container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--primary-600)', marginBottom: '1rem' }}>
            <Clock size={36} className="spin" style={{ margin: '0 auto' }} />
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลระบบใบลงเวลา...</p>
        </div>
      }
    >
      <TimeAttendanceContent />
    </React.Suspense>
  );
}

