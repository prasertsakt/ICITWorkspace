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

export default function IDPHubPage() {
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
  const [isDuplicating, setIsDuplicating] = useState(false);

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

  // Batch duplicate IDPs from previous year
  const handleDuplicateFromPreviousYear = async () => {
    const fromYear = String(Number(fiscalYear) - 1);
    if (
      !window.confirm(
        `ยืนยันการคัดลอกแบบประเมิน IDP จากปีงบประมาณ ${fromYear} มายังปี ${fiscalYear} สำหรับบุคลากรทุกคน?`
      )
    ) {
      return;
    }

    setIsDuplicating(true);
    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'เจ้าหน้าที่งานบุคคล',
        email: currentUser?.email || currentPersonnel?.email || '',
      };

      const created = await duplicateIdpRecordsFromPreviousYear(
        fromYear,
        fiscalYear,
        actor,
        personnelList,
        departmentList,
        executiveList,
        idpConfig
      );

      alert(`✅ คัดลอกและสร้างแบบประเมิน IDP ปีงบประมาณ ${fiscalYear} สำเร็จ (${created.length} รายการ)`);
    } catch (err) {
      console.error('Duplicate IDPs error:', err);
      alert(err.message || 'เกิดข้อผิดพลาดในการคัดลอกข้อมูล');
    } finally {
      setIsDuplicating(false);
    }
  };

  // Delete Record
  const handleDelete = async (rec) => {
    if (!rec || !rec.id) return;
    if (
      !window.confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการลบแบบประเมิน IDP ของ "${rec.personnelName}" ปีงบประมาณ ${rec.fiscalYear}?`
      )
    ) {
      return;
    }

    try {
      await deleteIdpRecord(rec.id, rec.fiscalYear);
    } catch (err) {
      console.error('Delete IDP error:', err);
      alert('เกิดข้อผิดพลาดในการลบแบบประเมิน');
    }
  };

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

    return { total, selfEvaluated, supervisorEvaluated, completed, avgGap };
  }, [idpRecords]);

  // If Not Logged In, Show Elegant Login Gate
  if (!isAuthLoading && !currentUser) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', maxWidth: '720px', margin: '0 auto' }}>
        <div
          className="card-glass"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderRadius: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
            }}
          >
            <Target size={32} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E1B4B', margin: '0 0 0.5rem 0' }}>
            ระบบพัฒนาบุคลากรรายบุคคล (IDP Hub)
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
              background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
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
      {/* Top Navigation & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            color: '#64748B',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} />
          <span>กลับหน้าหลัก (Portal Landing)</span>
        </Link>

        {/* Fiscal Year Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '4px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <Calendar size={16} color="#4F46E5" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>รอบปีงบประมาณ:</span>
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontWeight: 800,
              color: '#4F46E5',
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
          background: 'linear-gradient(135deg, #3730A3 0%, #4F46E5 50%, #6366F1 100%)',
          borderRadius: '1.25rem',
          padding: '1.75rem 2rem',
          color: '#FFFFFF',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
              }}
            >
              HUMAN RESOURCE DEVELOPMENT
            </span>
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              ICIT-KMUTNB
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
            ศูนย์พัฒนาบุคลากรรายบุคคล (IDP Hub)
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', opacity: 0.9, maxWidth: '650px' }}>
            ระบบวิเคราะห์ความต้องการจำเป็นเพื่อจัดทำแผนพัฒนาบุคลากรรายบุคคล (IDP Need Analysis Form) ตามเกณฑ์สมรรถนะ มจพ.
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
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '0.825rem',
                padding: '0.5rem 0.9rem',
              }}
            >
              <Settings size={15} />
              <span>ตั้งค่าสมรรถนะมาตรฐาน</span>
            </button>

            <button
              type="button"
              onClick={handleDuplicateFromPreviousYear}
              disabled={isDuplicating}
              className="btn btn-secondary btn-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '0.825rem',
                padding: '0.5rem 0.9rem',
              }}
            >
              <Copy size={15} />
              <span>{isDuplicating ? 'กำลังคัดลอก...' : 'คัดลอกจากปีก่อนหน้า'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="btn btn-sm"
              style={{
                background: '#FFFFFF',
                color: '#4338CA',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800,
                fontSize: '0.825rem',
                padding: '0.5rem 1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <Plus size={16} />
              <span>สร้างแบบประเมิน IDP</span>
            </button>
          </div>
        )}
      </div>

      {/* Minimal Dashboard Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.15rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#EEF2FF',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', color: '#64748B', fontWeight: 600 }}>แบบประเมินทั้งหมด</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E293B' }}>{stats.total} รายการ</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.15rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', color: '#64748B', fontWeight: 600 }}>ประเมินตนเองแล้ว</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0369A1' }}>{stats.selfEvaluated} รายการ</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.15rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', color: '#64748B', fontWeight: 600 }}>หัวหน้าประเมินแล้ว</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#B45309' }}>{stats.supervisorEvaluated} รายการ</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.15rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', color: '#64748B', fontWeight: 600 }}>เสร็จสมบูรณ์</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803D' }}>{stats.completed} รายการ</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '1.15rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#F3E8FF',
              color: '#7E22CE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', color: '#64748B', fontWeight: 600 }}>คะแนน Gap เฉลี่ย</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7E22CE' }}>
              {Number(stats.avgGap) > 0 ? `+${stats.avgGap}` : stats.avgGap}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          marginBottom: '1.25rem',
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
            { key: 'MY_IDP', label: 'IDP ของฉัน' },
            { key: 'PENDING_ME', label: 'รอฉันประเมิน' },
            { key: 'COMPLETED', label: 'เสร็จสมบูรณ์' },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setQuickFilter(pill.key)}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: quickFilter === pill.key ? '1.5px solid #4F46E5' : '1px solid #CBD5E1',
                background: quickFilter === pill.key ? '#EEF2FF' : '#FFFFFF',
                color: quickFilter === pill.key ? '#3730A3' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search & Dept Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.825rem',
              fontWeight: 600,
              background: '#F8FAFC',
            }}
          >
            <option value="ALL">-- ทุกฝ่ายในสำนัก --</option>
            {departmentList.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, ตำแหน่ง..."
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.825rem',
              }}
            />
          </div>
        </div>
      </div>

      {/* IDP Records Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', width: '50px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '10px 14px', minWidth: '220px' }}>ผู้รับการประเมิน</th>
                <th style={{ padding: '10px 14px', minWidth: '180px' }}>ฝ่าย / สังกัด</th>
                <th style={{ padding: '10px 14px', width: '140px', textAlign: 'center' }}>คะแนนคาดหวัง / ประเมินได้</th>
                <th style={{ padding: '10px 14px', width: '90px', textAlign: 'center' }}>Gap</th>
                <th style={{ padding: '10px 14px', width: '140px', textAlign: 'center' }}>สถานะ</th>
                <th style={{ padding: '10px 14px', width: '140px', textAlign: 'center' }}>การลงนาม</th>
                <th style={{ padding: '10px 14px', width: '150px', textAlign: 'center' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                    กำลังโหลดข้อมูลแบบประเมิน IDP...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
                    <Target size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#64748B' }}>
                      ยังไม่มีแบบประเมิน IDP ในรอบปีงบประมาณ {fiscalYear}
                    </div>
                    {isHR && (
                      <div style={{ marginTop: '8px' }}>
                        คลิกปุ่ม &ldquo;สร้างแบบประเมิน IDP&rdquo; หรือ &ldquo;คัดลอกจากปีก่อนหน้า&rdquo; เพื่อเริ่มต้น
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const statusInfo = IDP_STATUSES[rec.status] || IDP_STATUSES.DRAFT;
                  const selfSigned = rec.signatures?.evaluatorSelf?.signed;
                  const headSigned = rec.signatures?.evaluatorSupervisor?.signed;
                  const deputySigned = rec.signatures?.evaluatorDeputyDirector?.signed;

                  return (
                    <tr
                      key={rec.id || idx}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                    >
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
                        {idx + 1}
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#1E293B' }}>{rec.personnelName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{rec.position}</div>
                      </td>

                      <td style={{ padding: '10px 14px', color: '#475569' }}>
                        <div>{rec.department || '-'}</div>
                        <div style={{ fontSize: '0.725rem', color: '#94A3B8' }}>
                          หัวหน้า: {rec.departmentHead?.name || '-'}
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#475569' }}>
                          {rec.summary?.totalExpected || 0}
                        </span>
                        <span style={{ color: '#94A3B8', margin: '0 4px' }}>/</span>
                        <span style={{ fontWeight: 800, color: '#0F766E' }}>
                          {rec.summary?.totalEvaluated || 0}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.775rem',
                            background: (rec.summary?.totalGap || 0) >= 0 ? '#DCFCE7' : '#FEE2E2',
                            color: (rec.summary?.totalGap || 0) >= 0 ? '#15803D' : '#DC2626',
                          }}
                        >
                          {(rec.summary?.totalGap || 0) > 0 ? `+${rec.summary.totalGap}` : rec.summary?.totalGap || 0}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.border}`,
                          }}
                        >
                          {statusInfo.shortLabel || statusInfo.label}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span
                            title={selfSigned ? `ตนเองลงนามแล้ว (${rec.signatures?.evaluatorSelf?.signedAt})` : 'ตนเองยังไม่ลงนาม'}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: selfSigned ? '#DCFCE7' : '#F1F5F9',
                              color: selfSigned ? '#16A34A' : '#94A3B8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                            }}
                          >
                            ต
                          </span>
                          <span
                            title={headSigned ? `หัวหน้าลงนามแล้ว (${rec.signatures?.evaluatorSupervisor?.signedAt})` : 'หัวหน้ายังไม่ลงนาม'}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: headSigned ? '#DCFCE7' : '#F1F5F9',
                              color: headSigned ? '#16A34A' : '#94A3B8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                            }}
                          >
                            ห
                          </span>
                          <span
                            title={deputySigned ? `รองผู้อำนวยการลงนามแล้ว (${rec.signatures?.evaluatorDeputyDirector?.signedAt})` : 'รองผู้อำนวยการยังไม่ลงนาม'}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: deputySigned ? '#DCFCE7' : '#F1F5F9',
                              color: deputySigned ? '#16A34A' : '#94A3B8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                            }}
                          >
                            ร
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingRecord(rec)}
                            className="btn btn-secondary btn-xs"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              padding: '3px 8px',
                              background: '#FFFFFF',
                              color: '#4F46E5',
                              borderColor: '#C7D2FE',
                            }}
                            title="เปิดแบบประเมิน"
                          >
                            <Edit3 size={13} />
                            <span>ประเมิน</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewRecord(rec)}
                            className="btn btn-ghost btn-xs"
                            style={{ padding: '3px 6px', color: '#0369A1' }}
                            title="ดูตัวอย่าง / พิมพ์เอกสาร"
                          >
                            <Printer size={14} />
                          </button>

                          {isHR && (
                            <button
                              type="button"
                              onClick={() => handleDelete(rec)}
                              className="btn btn-ghost btn-xs"
                              style={{ padding: '3px 6px', color: '#EF4444' }}
                              title="ลบแบบประเมิน"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IDP Form Modal */}
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

      {/* IDP Master Config Modal */}
      {isConfigModalOpen && (
        <IDPConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          currentFiscalYear={fiscalYear}
          initialConfig={idpConfig}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          onSaved={(newCfg) => {
            setIdpConfig(newCfg);
          }}
        />
      )}

      {/* IDP Preview & Print Modal */}
      {previewRecord && (
        <IDPPreviewModal
          isOpen={Boolean(previewRecord)}
          onClose={() => setPreviewRecord(null)}
          record={previewRecord}
        />
      )}
    </div>
  );
}
