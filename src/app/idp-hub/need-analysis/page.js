'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Target,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  Edit3,
  Trash2,
  Eye,
  Settings,
  Lock,
  LogIn,
  AlertCircle,
  UserCheck,
  User as UserIcon,
  ChevronRight,
  ArrowLeft,
  Copy,
  Layers,
  Sparkles,
  Printer,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import {
  subscribeIdpRecords,
  subscribeIdpConfig,
  isHrOfficer,
  deleteIdpRecord,
  duplicateIdpRecordsFromPreviousYear,
} from '@/lib/idpService';
import {
  subscribePersonnelList,
  subscribeDepartmentList,
  subscribeExecutiveList,
} from '@/lib/storageService';
import { IDP_STATUSES, POSITIONS } from '@/lib/constants';
import IDPModal from '@/components/IDPModal';
import IDPConfigModal from '@/components/IDPConfigModal';
import IDPPreviewModal from '@/components/IDPPreviewModal';
import IDPDuplicateModal from '@/components/IDPDuplicateModal';
import IDPDeleteModal from '@/components/IDPDeleteModal';

export default function IDPNeedAnalysisPage() {
  const { currentUser, currentPersonnel, isAdmin, isLoading: isAuthLoading, handleGoogleSignIn } = useAuth();

  // Fiscal Year
  const [fiscalYear, setFiscalYear] = useState('2569');

  // Data states
  const [idpRecords, setIdpRecords] = useState([]);
  const [idpConfig, setIdpConfig] = useState(null);
  const [personnelList, setPersonnelList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [executiveList, setExecutiveList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [quickFilter, setQuickFilter] = useState('ALL'); // 'ALL' | 'MY_IDP' | 'PENDING_ME' | 'COMPLETED'

  // Modals
  const [editingRecord, setEditingRecord] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);

  // Authorization helper
  const isHR = isHrOfficer(currentUser, currentPersonnel, isAdmin);

  // Real-time Subscriptions (Optimized by fiscalYear)
  useEffect(() => {
    setLoading(true);
    const unsubRecords = subscribeIdpRecords(fiscalYear, (data) => {
      setIdpRecords(data || []);
      setLoading(false);
    });

    const unsubConfig = subscribeIdpConfig(fiscalYear, (cfg) => {
      setIdpConfig(cfg);
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
      unsubRecords();
      unsubConfig();
      unsubPersonnel();
      unsubDepts();
      unsubExecs();
    };
  }, [fiscalYear]);



  // Filtered IDP Records
  const filteredRecords = useMemo(() => {
    return idpRecords.filter((rec) => {
      // Dept filter
      if (selectedDept !== 'ALL' && rec.department !== selectedDept) {
        return false;
      }

      // Quick filter
      if (quickFilter === 'MY_IDP') {
        const isMe =
          (currentUser?.email && rec.personnelEmail?.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentPersonnel?.id && rec.personnelId === currentPersonnel.id);
        if (!isMe) return false;
      } else if (quickFilter === 'PENDING_ME') {
        const isMyStaff =
          (rec.departmentHead?.email && currentUser?.email && rec.departmentHead.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (rec.supervisingDeputyDirector?.email && currentUser?.email && rec.supervisingDeputyDirector.email.toLowerCase() === currentUser.email.toLowerCase());
        const needsSupervisor = !rec.signatures?.evaluatorSupervisor?.signed && !rec.signatures?.evaluatorDeputyDirector?.signed;
        if (!isMyStaff || !needsSupervisor) return false;
      } else if (quickFilter === 'COMPLETED') {
        if (rec.status !== IDP_STATUSES.COMPLETED.key) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (rec.personnelName || '').toLowerCase().includes(q);
        const matchPos = (rec.position || '').toLowerCase().includes(q);
        const matchDept = (rec.department || '').toLowerCase().includes(q);
        const matchEmail = (rec.personnelEmail || '').toLowerCase().includes(q);
        return matchName || matchPos || matchDept || matchEmail;
      }

      return true;
    });
  }, [idpRecords, selectedDept, quickFilter, searchQuery, currentUser, currentPersonnel]);

  // The 4 Core Divisions/Departments in ICIT (including สำนักงานผู้อำนวยการ)
  const MAIN_4_DEPTS = useMemo(
    () => [
      'สำนักงานผู้อำนวยการ',
      'ฝ่ายพัฒนาระบบสารสนเทศ',
      'ฝ่ายวิศวกรรมระบบเครือข่าย',
      'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
    ],
    []
  );

  // Dashboard Statistics
  const stats = useMemo(() => {
    const total = idpRecords.length;
    const selfEvaluated = idpRecords.filter(
      (r) => r.signatures?.evaluatorSelf?.signed || r.status === IDP_STATUSES.SELF_EVALUATED.key
    ).length;
    const supervisorEvaluated = idpRecords.filter(
      (r) => r.signatures?.evaluatorSupervisor?.signed || r.signatures?.evaluatorDeputyDirector?.signed
    ).length;
    const completed = idpRecords.filter((r) => r.status === IDP_STATUSES.COMPLETED.key).length;

    let totalGaps = 0;
    idpRecords.forEach((r) => {
      if (r.summary?.totalGap) {
        totalGaps += Number(r.summary.totalGap);
      }
    });
    const avgGap = total > 0 ? (totalGaps / total).toFixed(1) : '0';

    // Breakdown for all 4 departments (รวมสำนักงานผู้อำนวยการ)
    const deptStats = MAIN_4_DEPTS.map((deptName) => {
      const deptRecords = idpRecords.filter((r) => r.department === deptName);
      const dTotal = deptRecords.length;
      const dCompleted = deptRecords.filter((r) => r.status === IDP_STATUSES.COMPLETED.key).length;
      const dSelf = deptRecords.filter(
        (r) => r.signatures?.evaluatorSelf?.signed || r.status === IDP_STATUSES.SELF_EVALUATED.key
      ).length;
      const percent = dTotal > 0 ? Math.round((dCompleted / dTotal) * 100) : 0;
      return {
        name: deptName,
        total: dTotal,
        completed: dCompleted,
        selfDone: dSelf,
        percent,
        isAllDone: dTotal > 0 && dCompleted === dTotal,
      };
    });

    const completedDepts = deptStats.filter((d) => d.isAllDone).length;

    return {
      total,
      selfEvaluated,
      supervisorEvaluated,
      completed,
      avgGap,
      deptStats,
      completedDepts,
    };
  }, [idpRecords, MAIN_4_DEPTS]);

  // If Not Logged In, Show Login Gate
  if (!isAuthLoading && !currentUser) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', maxWidth: '720px', margin: '0 auto' }}>
        <div
          className="card-glass"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderRadius: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(249, 115, 22, 0.08)',
            border: '1px solid #FED7AA',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.35)',
            }}
          >
            <Target size={32} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.5rem 0' }}>
            IDP Need Analysis Form
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748B', maxWidth: '500px', margin: '0 auto 1.75rem auto', lineHeight: 1.6 }}>
            แบบวิเคราะห์ความต้องการจำเป็นเพื่อจัดทำแผนพัฒนาบุคลากรรายบุคคล (Individual Development Plan) กรุณาเข้าสู่ระบบด้วยบัญชี Google ของมหาวิทยาลัยเพื่อเข้าใช้งาน
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem 1.75rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
            }}
          >
            <LogIn size={18} />
            <span>เข้าสู่ระบบด้วย Google Account</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '1.75rem 1rem 4rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Navigation & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Link
            href="/idp-hub"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: '#EA580C',
              textDecoration: 'none',
              fontWeight: 700,
              background: '#FFF7ED',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid #FFEDD5',
            }}
          >
            <ArrowLeft size={16} />
            <span>กลับสู่ IDP Hub</span>
          </Link>
          <span style={{ color: '#CBD5E1' }}>/</span>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
            แบบวิเคราะห์ความต้องการจำเป็น (IDP Need Analysis)
          </span>
        </div>

        {/* Fiscal Year Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '4px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <Calendar size={16} color="#EA580C" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>รอบปีงบประมาณ:</span>
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontWeight: 800,
              color: '#EA580C',
              fontSize: '0.9rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {['2568', '2569', '2570', '2571', '2572'].map((y) => (
              <option key={y} value={y}>
                ปี {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Page Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem 2rem',
          color: '#FFFFFF',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
              }}
            >
              <FileCheck size={24} color="#FFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                  IDP Need Analysis
                </h1>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(249, 115, 22, 0.25)',
                    color: '#FED7AA',
                    border: '1px solid rgba(249, 115, 22, 0.4)',
                  }}
                >
                  แบบวิเคราะห์ความต้องการจำเป็น • ปีงบประมาณ {fiscalYear}
                </span>
              </div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#CBD5E1', maxWidth: '650px', lineHeight: 1.5 }}>
            วิเคราะห์และประเมินระดับสมรรถนะหลัก (Core) และสมรรถนะตามตำแหน่งงาน (Functional) ตามแบบฟอร์ม มจพ.
          </p>
        </div>

        {/* Action Buttons for HR / Admin */}
        {isHR && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '0.825rem',
                padding: '0.5rem 0.9rem',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Settings size={15} style={{ color: '#FB923C' }} />
              <span>ตั้งค่าสมรรถนะมาตรฐาน</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDuplicateModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '0.825rem',
                padding: '0.5rem 0.9rem',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Copy size={15} style={{ color: '#FB923C' }} />
              <span>คัดลอกจากปีก่อนหน้า</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: '#FFFFFF',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800,
                fontSize: '0.825rem',
                padding: '0.5rem 1rem',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
                borderRadius: '8px',
              }}
            >
              <Plus size={16} />
              <span>สร้างแบบประเมิน IDP</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Departments Progress Notice & Guidance Banner (Orange-Tinted Theme) */}
      {stats.deptStats && stats.deptStats.length > 0 && (
        <div
          style={{
            marginBottom: '1.5rem',
            background: '#FFF7ED',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            border: '1px solid #FFEDD5',
            borderLeft: '4px solid #F97316',
            boxShadow: '0 2px 6px rgba(249, 115, 22, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={16} />
              </div>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B' }}>
                  ความก้าวหน้าการประเมิน IDP ทั้ง 4 ฝ่าย
                </span>
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(249, 115, 22, 0.15)',
                    color: '#C2410C',
                    border: '1px solid rgba(249, 115, 22, 0.25)',
                  }}
                >
                </span>
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#9A3412', fontWeight: 600 }}>
              เสร็จสิ้นแล้ว {stats.completedDepts} / 4 ฝ่าย
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {stats.deptStats.map((d) => (
              <div
                key={d.name}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  border: d.isAllDone ? '1.5px solid #86EFAC' : '1px solid #FED7AA',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.name}>
                  {d.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: d.isAllDone ? '#15803D' : '#1E293B' }}>
                    {d.completed} / {d.total} ฉบับ
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: d.isAllDone ? '#DCFCE7' : '#FFF7ED',
                      color: d.isAllDone ? '#15803D' : '#EA580C',
                      border: d.isAllDone ? '1px solid #BBF7D0' : '1px solid #FED7AA',
                    }}
                  >
                    {d.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minimal Dashboard Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Total */}
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
            <span style={{ fontWeight: 600 }}>แบบประเมินทั้งหมด</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E293B', marginTop: '0.5rem' }}>
            {stats.total} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>ฉบับ</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            ปีงบประมาณ {fiscalYear}
          </div>
        </div>

        {/* Card 2: Self Evaluated */}
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
            <span style={{ fontWeight: 600 }}>ประเมินตนเองแล้ว</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0F9FF', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284C7', marginTop: '0.5rem' }}>
            {stats.selfEvaluated} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>ฉบับ</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            คิดเป็น {stats.total > 0 ? Math.round((stats.selfEvaluated / stats.total) * 100) : 0}% ของทั้งหมด
          </div>
        </div>

        {/* Card 3: Supervisor Evaluated */}
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
            <span style={{ fontWeight: 600 }}>หัวหน้าประเมินแล้ว</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', marginTop: '0.5rem' }}>
            {stats.supervisorEvaluated} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>ฉบับ</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
            คิดเป็น {stats.total > 0 ? Math.round((stats.supervisorEvaluated / stats.total) * 100) : 0}% ของทั้งหมด
          </div>
        </div>

        {/* Card 4: Completed */}
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
            <span style={{ fontWeight: 600 }}>เสร็จสมบูรณ์ทั้ง 4 ฝ่าย</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16A34A', marginTop: '0.5rem' }}>
            {stats.completed} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>/ {stats.total} ฉบับ</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '2px', fontWeight: 600 }}>
            (เสร็จสิ้นแล้ว {stats.completedDepts}/4 ฝ่าย)
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          background: '#FFFFFF',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Quick Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'ทั้งหมด' },
            { key: 'MY_IDP', label: 'ฟอร์มของฉัน' },
            { key: 'PENDING_ME', label: 'รอฉันลงนาม/ประเมิน' },
            { key: 'COMPLETED', label: 'เสร็จสมบูรณ์' },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setQuickFilter(pill.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: quickFilter === pill.key ? '1.5px solid #F97316' : '1px solid #E2E8F0',
                background: quickFilter === pill.key ? '#FFF7ED' : '#FFFFFF',
                color: quickFilter === pill.key ? '#C2410C' : '#64748B',
                fontWeight: quickFilter === pill.key ? 800 : 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search Input & Department Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end', minWidth: '280px' }}>
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: '0.825rem',
              color: '#334155',
              fontWeight: 600,
            }}
          >
            <option value="ALL">ทุกฝ่าย / หน่วยงาน</option>
            {departmentList.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '220px', maxWidth: '300px', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, ตำแหน่ง, ฝ่าย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.825rem',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Table List */}
      <div
        className="card"
        style={{
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          background: '#FFFFFF',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
        }}
      >
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #FFEDD5', borderTopColor: '#EA580C', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>กำลังโหลดข้อมูลแบบประเมิน IDP...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Target size={28} />
            </div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1E293B', fontWeight: 700 }}>
              ไม่พบรายการแบบประเมิน IDP
            </h4>
            <p style={{ margin: '6px 0 1.25rem 0', fontSize: '0.85rem' }}>
              {isHR ? 'ยังไม่มีแบบประเมินในปีงบประมาณนี้ สามารถกดสร้างหรือคัดลอกจากปีก่อนหน้าได้' : 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา'}
            </p>
            {isHR && (
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  padding: '0.5rem 1.25rem',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                }}
              >
                <Plus size={16} />
                <span>สร้างแบบประเมิน IDP ใหม่</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', width: '50px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '12px 16px', minWidth: '200px' }}>ผู้รับการประเมิน</th>
                  <th style={{ padding: '12px 16px', minWidth: '180px' }}>ตำแหน่ง / ฝ่าย</th>
                  <th style={{ padding: '12px 16px', minWidth: '160px' }}>สถานะการลงนาม</th>
                  <th style={{ padding: '12px 16px', width: '120px', textAlign: 'center' }}>คะแนนประเมิน/คาดหวัง</th>
                  <th style={{ padding: '12px 16px', width: '100px', textAlign: 'center' }}>Gap สุทธิ</th>
                  <th style={{ padding: '12px 16px', width: '130px', textAlign: 'center' }}>สถานะ</th>
                  <th style={{ padding: '12px 16px', width: '130px', textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec, index) => {
                  const statusInfo = IDP_STATUSES[rec.status] || IDP_STATUSES.DRAFT;
                  const totalEval = rec.summary?.totalEvaluated || 0;
                  const totalExp = rec.summary?.totalExpected || 0;
                  const totalGap = rec.summary?.totalGap || 0;

                  const isOwner =
                    (currentUser?.email && rec.personnelEmail?.toLowerCase() === currentUser.email.toLowerCase()) ||
                    (currentPersonnel?.id && rec.personnelId === currentPersonnel.id);

                  return (
                    <tr
                      key={rec.id || index}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Index */}
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>
                        {index + 1}
                      </td>

                      {/* Personnel Name & Email */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{rec.personnelName}</span>
                          {isOwner && (
                            <span style={{ fontSize: '0.7rem', background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              ตนเอง
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {rec.personnelEmail || '-'}
                        </div>
                      </td>

                      {/* Position & Department */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>
                          {rec.position || 'บุคลากร'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {rec.department || '-'}
                        </div>
                      </td>

                      {/* Signatures status indicator */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.75rem' }}>
                          <span style={{ color: rec.signatures?.evaluatorSelf?.signed ? '#16A34A' : '#94A3B8' }}>
                            {rec.signatures?.evaluatorSelf?.signed ? '✓ ตนเองลงชื่อแล้ว' : '○ รอประเมินตนเอง'}
                          </span>
                          <span style={{ color: rec.signatures?.evaluatorSupervisor?.signed ? '#16A34A' : '#94A3B8' }}>
                            {rec.signatures?.evaluatorSupervisor?.signed ? '✓ หัวหน้าฝ่ายลงชื่อแล้ว' : '○ รอหัวหน้าฝ่าย'}
                          </span>
                          <span style={{ color: rec.signatures?.evaluatorDeputyDirector?.signed ? '#16A34A' : '#94A3B8' }}>
                            {rec.signatures?.evaluatorDeputyDirector?.signed ? '✓ รอง ผอ. ลงชื่อแล้ว' : '○ รอรอง ผอ.'}
                          </span>
                        </div>
                      </td>

                      {/* Scores */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, color: '#1E293B' }}>
                          {totalEval} <span style={{ color: '#94A3B8', fontWeight: 400 }}>/ {totalExp}</span>
                        </div>
                      </td>

                      {/* Gap */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.775rem',
                            background: totalGap >= 0 ? '#DCFCE7' : '#FEE2E2',
                            color: totalGap >= 0 ? '#15803D' : '#DC2626',
                          }}
                        >
                          {totalGap > 0 ? `+${totalGap}` : totalGap}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.color,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {/* Print / Preview */}
                          <button
                            type="button"
                            onClick={() => setPreviewRecord(rec)}
                            className="btn btn-ghost btn-icon"
                            style={{ padding: '6px', color: '#64748B' }}
                            title="พิมพ์ / ดูแบบฟอร์มทางการ A4"
                          >
                            <Printer size={16} />
                          </button>

                          {/* Edit / Evaluate */}
                          <button
                            type="button"
                            onClick={() => setEditingRecord(rec)}
                            className="btn btn-ghost btn-icon"
                            style={{ padding: '6px', color: '#EA580C' }}
                            title="เปิดดู / ประเมินผล"
                          >
                            <Edit3 size={16} />
                          </button>

                          {/* Delete (HR / Admin only) */}
                          {isHR && (
                            <button
                              type="button"
                              onClick={() => setDeletingRecord(rec)}
                              className="btn btn-ghost btn-icon"
                              style={{ padding: '6px', color: '#EF4444' }}
                              title="ลบแบบประเมิน"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
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

      {/* ==================== Modals ==================== */}

      {/* 1. Evaluation & Edit Modal */}
      {(editingRecord || isNewModalOpen) && (
        <IDPModal
          isOpen={Boolean(editingRecord || isNewModalOpen)}
          onClose={() => {
            setEditingRecord(null);
            setIsNewModalOpen(false);
          }}
          record={editingRecord}
          fiscalYear={fiscalYear}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          personnelList={personnelList}
          departmentList={departmentList}
          executiveList={executiveList}
          idpConfig={idpConfig}
          isAdmin={isAdmin}
          onSaved={() => {
            setEditingRecord(null);
            setIsNewModalOpen(false);
          }}
        />
      )}

      {/* 2. Official Form Print / Preview Modal */}
      {previewRecord && (
        <IDPPreviewModal
          isOpen={Boolean(previewRecord)}
          onClose={() => setPreviewRecord(null)}
          record={previewRecord}
          fiscalYear={fiscalYear}
        />
      )}

      {/* 3. Master Competency Config Modal */}
      {isConfigModalOpen && (
        <IDPConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          currentFiscalYear={fiscalYear}
          initialConfig={idpConfig}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          onSaved={(cfg) => {
            setIdpConfig(cfg);
            setIsConfigModalOpen(false);
          }}
        />
      )}

      {/* 4. Batch Duplicate Modal */}
      {isDuplicateModalOpen && (
        <IDPDuplicateModal
          isOpen={isDuplicateModalOpen}
          onClose={() => setIsDuplicateModalOpen(false)}
          fiscalYear={fiscalYear}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          personnelList={personnelList}
          departmentList={departmentList}
          executiveList={executiveList}
          idpConfig={idpConfig}
          onCompleted={() => {
            // Realtime listener automatically updates
          }}
        />
      )}

      {/* 5. Delete Confirm Modal */}
      {deletingRecord && (
        <IDPDeleteModal
          isOpen={Boolean(deletingRecord)}
          onClose={() => setDeletingRecord(null)}
          record={deletingRecord}
          onDeleted={() => setDeletingRecord(null)}
        />
      )}
    </div>
  );
}
