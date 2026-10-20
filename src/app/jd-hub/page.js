'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
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
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Key,
  X,
  HelpCircle,
  Filter,
} from 'lucide-react';
import {
  subscribeJDList,
  subscribeJDConfig,
  isRevisionWindowOpen,
  saveJDRecord,
  confirmJDVersion,
} from '@/lib/jdService';
import {
  subscribePersonnelList,
  subscribeDepartmentList,
  subscribeExecutiveList,
} from '@/lib/storageService';
import { SAMPLE_SEED_JD, createBlankJD, JD_SECURITY_RISK_LEVELS } from '@/lib/jdTemplateData';
import { MAIN_6_DEPTS } from '@/lib/constants';
import JDPreviewModal from '@/components/JDPreviewModal';
import JDModal from '@/components/JDModal';
import JDConfigModal from '@/components/JDConfigModal';
import JDDeleteModal from '@/components/JDDeleteModal';

export default function JDHubPage() {
  const { currentUser, currentPersonnel, isAdmin, isLoading: isAuthLoading, handleGoogleSignIn } = useAuth();

  // Data state
  const [jds, setJds] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [executiveList, setExecutiveList] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'DRAFT'
  const [myJdOnly, setMyJdOnly] = useState(false);
  const [riskFilter, setRiskFilter] = useState('ALL'); // 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL_ACCESS'

  // Modals state
  const [previewJD, setPreviewJD] = useState(null);
  const [editingJD, setEditingJD] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [deletingJD, setDeletingJD] = useState(null);
  const [showRiskInfoModal, setShowRiskInfoModal] = useState(false);

  // Real-time subscriptions
  useEffect(() => {
    const unsubJDs = subscribeJDList((data) => {
      if (!data || data.length === 0) {
        setJds([SAMPLE_SEED_JD]);
      } else {
        setJds(data);
      }
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

    const unsubConfig = subscribeJDConfig((cfg) => {
      setConfig(cfg);
    });

    return () => {
      if (unsubJDs) unsubJDs();
      if (unsubPersonnel) unsubPersonnel();
      if (unsubDepts) unsubDepts();
      if (unsubExecs) unsubExecs();
      if (unsubConfig) unsubConfig();
    };
  }, []);

  // Compute revision window status
  const windowStatus = useMemo(() => {
    return isRevisionWindowOpen(config);
  }, [config]);

  // Current logged in user's email
  const userEmail = (currentUser?.email || currentPersonnel?.email || '').toLowerCase().trim();

  // Filtered & Sorted JDs: เรียงตามฝ่าย / กลุ่มงาน (Department) แล้วตามด้วยชื่อตำแหน่ง (Position)
  const filteredJDs = useMemo(() => {
    const list = jds.filter((item) => {
      const posTitle = item.position || item.positionTitle || '';
      const posNum = item.positionNumber || item.positionNo || '';
      const persName = item.personnelName || '';
      const persDept = item.department || '';
      const persEmail = item.personnelEmail || '';
      const isConfirmed = item.userConfirmed || item.status === 'CONFIRMED';
      const riskLvl = item.securityRiskAssessment?.riskLevel || 'LOW';
      const accessRights = item.securityRiskAssessment?.accessRights || '';

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const riskThai = riskLvl === 'HIGH' ? 'สูง' : riskLvl === 'MEDIUM' ? 'ปานกลาง' : 'ต่ำ';
        const riskEng = riskLvl.toLowerCase();
        const matches =
          persName.toLowerCase().includes(q) ||
          posTitle.toLowerCase().includes(q) ||
          posNum.toLowerCase().includes(q) ||
          persDept.toLowerCase().includes(q) ||
          persEmail.toLowerCase().includes(q) ||
          accessRights.toLowerCase().includes(q) ||
          riskThai.includes(q) ||
          riskEng.includes(q) ||
          (`ความเสี่ยง${riskThai}`).includes(q) ||
          (`เสี่ยง${riskThai}`).includes(q);
        if (!matches) return false;
      }

      if (selectedDept !== 'ALL' && persDept !== selectedDept) {
        return false;
      }

      if (statusFilter === 'CONFIRMED' && !isConfirmed) return false;
      if (statusFilter === 'DRAFT' && isConfirmed) return false;

      if (myJdOnly) {
        const itemEmail = persEmail.toLowerCase().trim();
        if (!userEmail || itemEmail !== userEmail) return false;
      }

      // Information Security Risk Filter
      if (riskFilter === 'HIGH' && riskLvl !== 'HIGH') return false;
      if (riskFilter === 'MEDIUM' && riskLvl !== 'MEDIUM') return false;
      if (riskFilter === 'LOW' && riskLvl !== 'LOW') return false;
      if (riskFilter === 'CRITICAL_ACCESS') {
        const hasAccess = !!(accessRights && accessRights.trim() && accessRights.trim() !== '-');
        if (!hasAccess) return false;
      }

      return true;
    });

    // 1. เรียงตาม ฝ่าย / กลุ่มงาน (Department)
    // 2. เรียงตาม ชื่อตำแหน่ง (Position Title)
    // 3. เรียงตาม เลขที่ตำแหน่ง (Position Number)
    return list.sort((a, b) => {
      const deptA = a.department || '';
      const deptB = b.department || '';

      const idxA = MAIN_6_DEPTS.indexOf(deptA);
      const idxB = MAIN_6_DEPTS.indexOf(deptB);

      if (idxA !== -1 && idxB !== -1) {
        if (idxA !== idxB) return idxA - idxB;
      } else if (idxA !== -1) {
        return -1;
      } else if (idxB !== -1) {
        return 1;
      } else if (deptA !== deptB) {
        const comp = deptA.localeCompare(deptB, 'th');
        if (comp !== 0) return comp;
      }

      // Then by Position Title
      const posA = a.position || a.positionTitle || '';
      const posB = b.position || b.positionTitle || '';
      if (posA !== posB) {
        const comp = posA.localeCompare(posB, 'th');
        if (comp !== 0) return comp;
      }

      // Then by Position Number
      const numA = String(a.positionNumber || a.positionNo || '');
      const numB = String(b.positionNumber || b.positionNo || '');
      return numA.localeCompare(numB, 'th', { numeric: true });
    });
  }, [jds, searchQuery, selectedDept, statusFilter, myJdOnly, userEmail, riskFilter]);

  // Statistics of Security Risk Levels based on current department & user context
  const riskStats = useMemo(() => {
    const baseList = jds.filter((item) => {
      const persDept = item.department || '';
      const persEmail = (item.personnelEmail || '').toLowerCase().trim();
      if (selectedDept !== 'ALL' && persDept !== selectedDept) return false;
      if (myJdOnly && (!userEmail || persEmail !== userEmail)) return false;
      return true;
    });

    let high = 0;
    let medium = 0;
    let low = 0;
    let hasAccessRights = 0;

    baseList.forEach((j) => {
      const lvl = j.securityRiskAssessment?.riskLevel || 'LOW';
      if (lvl === 'HIGH') high++;
      else if (lvl === 'MEDIUM') medium++;
      else low++;

      const acc = j.securityRiskAssessment?.accessRights;
      if (acc && acc.trim() && acc.trim() !== '-') {
        hasAccessRights++;
      }
    });

    return {
      total: baseList.length,
      high,
      medium,
      low,
      hasAccessRights,
    };
  }, [jds, selectedDept, myJdOnly, userEmail]);

  // Department list sorted in organizational order (6 main departments)
  const departments = useMemo(() => {
    return MAIN_6_DEPTS;
  }, []);

  // Minimal dashboard stats
  const stats = useMemo(() => {
    const total = jds.length;
    const confirmed = jds.filter((j) => j.userConfirmed || j.status === 'CONFIRMED').length;
    const draft = total - confirmed;
    const percent = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    return { total, confirmed, draft, percent };
  }, [jds]);

  // Permission check
  const canUserEdit = (jd) => {
    if (isAdmin) return true;
    if (!windowStatus.isOpen) return false;
    const itemEmail = (jd.personnelEmail || '').toLowerCase().trim();
    return userEmail && itemEmail === userEmail;
  };

  const handleCreateNew = () => {
    const newJD = createBlankJD(null);
    setEditingJD(newJD);
  };

  // 1. Authentication Loading
  if (isAuthLoading) {
    return (
      <div className="main-container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid var(--primary-100)', borderTopColor: 'var(--primary-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>กำลังตรวจสอบข้อมูลผู้ใช้งาน...</p>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Authentication Gate (Required Login)
  if (!currentUser && !currentPersonnel) {
    return (
      <div className="main-container" style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <div
          className="card-glass card-pastel-accent"
          style={{
            maxWidth: '520px',
            width: '100%',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--peach-50)',
              color: 'var(--peach-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
            }}
          >
            <FileText size={36} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
            ระบบจัดการ Job Description (JD Hub)
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)
            <br />
            มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
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
            <Lock size={20} style={{ color: 'var(--peach-500)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                บริการสารสนเทศภายใน (Required Login)
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                โปรดเข้าสู่ระบบด้วยบัญชี Google KMUTNB เพื่อดูและจัดการแบบบรรยายลักษณะงานของคุณ
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleGoogleSignIn}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem 1.5rem', fontSize: '0.95rem', justifyContent: 'center' }}
            >
              <LogIn size={18} />
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
    <div className="main-container" style={{ paddingBottom: '3rem' }}>
      {/* Top Banner & Header */}
      <div
        className="card-glass"
        style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                }}
              >
                <FileText size={24} color="#FFF" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#FFFFFF', lineHeight: 1.2 }}>
                  JD Hub
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
                  ICIT Job Description Management System • FM-COMMON-006 v2.0
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#CBD5E1', maxWidth: '650px', lineHeight: 1.5 }}>
              ระบบจัดการและทบทวนแบบบรรยายลักษณะงาน (Job Description) ประจำปี สำหรับบุคลากรสำนักคอมพิวเตอร์ฯ
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem' }}>
            {isAdmin && (
              <>
                <button
                  onClick={() => setIsConfigOpen(true)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(8px)',
                  }}
                  title="ตั้งค่าช่วงเวลาเปิดให้บุคลากรแก้ไข/ยืนยัน JD"
                >
                  <Settings size={15} style={{ color: '#FB923C' }} />
                  <span>ตั้งค่าช่วงเวลาแก้ไข</span>
                </button>
                <button
                  onClick={handleCreateNew}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  }}
                >
                  <Plus size={15} />
                  <span>สร้าง JD ใหม่</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Revisable Period Status Banner */}
      <div style={{ marginBottom: '1.5rem' }}>
        {windowStatus.isOpen ? (
          <div
            className="card-glass"
            style={{
              padding: '1.1rem 1.25rem',
              borderLeft: '4px solid var(--mint-500)',
              background: 'var(--mint-50)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--mint-500)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Calendar size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--mint-text)' }}>
                    เปิดให้ทบทวนและแก้ไข Job Description ประจำปี
                  </strong>
                  <span className="badge badge-active">เปิดใช้งาน</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--mint-text)', opacity: 0.9 }}>
                  {windowStatus.message}
                  {config?.announcement ? ` — ${config.announcement}` : ''}
                </p>
              </div>
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--mint-text)',
                background: 'rgba(255, 255, 255, 0.7)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Clock size={14} />
              <span>บุคลากรสามารถเปิดแก้ไขและกดยืนยันฉบับใหม่ได้</span>
            </div>
          </div>
        ) : (
          <div
            className="card-glass"
            style={{
              padding: '1.1rem 1.25rem',
              borderLeft: '4px solid var(--peach-500)',
              background: 'var(--peach-50)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--peach-500)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Clock size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--peach-text)' }}>
                    ยังไม่เปิดช่วงเวลาแก้ไขสำหรับบุคลากร (โหมดดูเอกสาร PDF เท่านั้น)
                  </strong>
                  <span className="badge badge-type">View Only</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--peach-text)', opacity: 0.9 }}>
                  {windowStatus.message}
                  {config?.announcement ? ` — ${config.announcement}` : ''}
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsConfigOpen(true)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                <Settings size={14} />
                <span>เปิดช่วงเวลาให้บุคลากร</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Minimal Dashboard 4 Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Total JDs */}
        <div className="card-glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              JD ทั้งหมดในระบบ
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {stats.total}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>ตำแหน่ง</span>
            </div>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--peach-50)',
              color: 'var(--peach-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={22} />
          </div>
        </div>

        {/* Card 2: Confirmed Count */}
        <div className="card-glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                ยืนยันฉบับสมบูรณ์
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--mint-600)', marginTop: '0.2rem' }}>
                {stats.confirmed}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>รายการ</span>
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--mint-50)',
                color: 'var(--mint-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ width: '100%', height: '6px', background: 'var(--border-subtle)', borderRadius: '99px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${stats.percent}%`,
                  height: '100%',
                  background: 'var(--mint-500)',
                  borderRadius: '99px',
                  transition: 'width 0.4s ease',
                }}
              ></div>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
              {stats.percent}% ยืนยันแล้ว
            </div>
          </div>
        </div>

        {/* Card 3: Drafts / In progress */}
        <div className="card-glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              ฉบับร่าง / รอทบทวน
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--peach-text)', marginTop: '0.2rem' }}>
              {stats.draft}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>รายการ</span>
            </div>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--peach-50)',
              color: 'var(--peach-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </div>
        </div>

        {/* Card 4: Revision Period Status */}
        <div className="card-glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              สถานะการแก้ไข
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: windowStatus.isOpen ? 'var(--mint-500)' : 'var(--text-muted)',
                }}
              ></span>
              {windowStatus.isOpen ? 'เปิดให้แก้ไข' : 'ปิดการแก้ไข'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {isAdmin ? 'Admin แก้ไขได้ตลอดเวลา' : 'บุคลากรแก้ไขได้ตามช่วงเวลา'}
            </div>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters, Risk Buttons & "My JD Only" */}
      <div
        className="card-glass"
        style={{
          padding: '1.15rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        {/* Row 1: Search, Department, Status, My JD Only */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '280px' }}>
            {/* Search box */}
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อผู้ครองตำแหน่ง, ตำแหน่ง, เลขที่, ระดับความเสี่ยง..."
                className="form-input"
                style={{ paddingLeft: '2.2rem', paddingRight: searchQuery ? '2.2rem' : '0.75rem', fontSize: '0.85rem' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="ล้างข้อความค้นหา"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: '160px', fontSize: '0.85rem' }}
            >
              <option value="ALL">ทุกฝ่าย / กลุ่มงาน</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', minWidth: '130px', fontSize: '0.85rem' }}
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="CONFIRMED">ยืนยันแล้ว</option>
              <option value="DRAFT">ฉบับร่าง</option>
            </select>
          </div>

          {/* Toggle: My JD only */}
          <div>
            <button
              onClick={() => setMyJdOnly(!myJdOnly)}
              className={`btn btn-sm ${myJdOnly ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem' }}
            >
              <UserCheck size={14} />
              <span>เฉพาะ JD ของฉัน</span>
            </button>
          </div>
        </div>

        {/* Row 2: Security Risk Quick Filter Buttons Bar */}
        <div
          style={{
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.65rem',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.45rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.2rem' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: 'var(--peach-50)',
                  color: 'var(--peach-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={14} />
              </div>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ความเสี่ยงสารสนเทศ:
              </span>
            </div>

            {/* Button 1: ALL */}
            <button
              type="button"
              onClick={() => setRiskFilter('ALL')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: riskFilter === 'ALL' ? '1.5px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                background: riskFilter === 'ALL' ? 'var(--text-primary)' : '#FFFFFF',
                color: riskFilter === 'ALL' ? '#FFFFFF' : 'var(--text-secondary)',
                boxShadow: riskFilter === 'ALL' ? '0 2px 6px rgba(0, 0, 0, 0.15)' : 'none',
              }}
              title="แสดงทุกระดับความเสี่ยง"
            >
              <span>ทั้งหมด</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: riskFilter === 'ALL' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-card-subtle)',
                  color: riskFilter === 'ALL' ? '#FFFFFF' : 'var(--text-muted)',
                }}
              >
                {riskStats.total}
              </span>
            </button>

            {/* Button 2: HIGH */}
            <button
              type="button"
              onClick={() => setRiskFilter(riskFilter === 'HIGH' ? 'ALL' : 'HIGH')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: riskFilter === 'HIGH' ? '1.5px solid #DC2626' : '1px solid #FECACA',
                background: riskFilter === 'HIGH' ? '#DC2626' : '#FEF2F2',
                color: riskFilter === 'HIGH' ? '#FFFFFF' : '#DC2626',
                boxShadow: riskFilter === 'HIGH' ? '0 3px 10px rgba(220, 38, 38, 0.35)' : 'none',
              }}
              title="กรองเฉพาะตำแหน่งระดับความเสี่ยงสูง (High Risk)"
            >
              <ShieldAlert size={14} />
              <span>เสี่ยงสูง (High)</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: riskFilter === 'HIGH' ? 'rgba(255, 255, 255, 0.3)' : '#FEE2E2',
                  color: riskFilter === 'HIGH' ? '#FFFFFF' : '#B91C1C',
                }}
              >
                {riskStats.high}
              </span>
            </button>

            {/* Button 3: MEDIUM */}
            <button
              type="button"
              onClick={() => setRiskFilter(riskFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: riskFilter === 'MEDIUM' ? '1.5px solid #D97706' : '1px solid #FDE68A',
                background: riskFilter === 'MEDIUM' ? '#D97706' : '#FEF3C7',
                color: riskFilter === 'MEDIUM' ? '#FFFFFF' : '#B45309',
                boxShadow: riskFilter === 'MEDIUM' ? '0 3px 10px rgba(217, 119, 6, 0.35)' : 'none',
              }}
              title="กรองเฉพาะตำแหน่งระดับความเสี่ยงปานกลาง (Medium Risk)"
            >
              <AlertTriangle size={14} />
              <span>เสี่ยงปานกลาง (Medium)</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: riskFilter === 'MEDIUM' ? 'rgba(255, 255, 255, 0.3)' : '#FDE68A',
                  color: riskFilter === 'MEDIUM' ? '#FFFFFF' : '#92400E',
                }}
              >
                {riskStats.medium}
              </span>
            </button>

            {/* Button 4: LOW */}
            <button
              type="button"
              onClick={() => setRiskFilter(riskFilter === 'LOW' ? 'ALL' : 'LOW')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: riskFilter === 'LOW' ? '1.5px solid #059669' : '1px solid #A7F3D0',
                background: riskFilter === 'LOW' ? '#059669' : '#ECFDF5',
                color: riskFilter === 'LOW' ? '#FFFFFF' : '#059669',
                boxShadow: riskFilter === 'LOW' ? '0 3px 10px rgba(5, 150, 105, 0.35)' : 'none',
              }}
              title="กรองเฉพาะตำแหน่งระดับความเสี่ยงต่ำ (Low Risk)"
            >
              <ShieldCheck size={14} />
              <span>เสี่ยงต่ำ (Low)</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: riskFilter === 'LOW' ? 'rgba(255, 255, 255, 0.3)' : '#D1FAE5',
                  color: riskFilter === 'LOW' ? '#FFFFFF' : '#065F46',
                }}
              >
                {riskStats.low}
              </span>
            </button>

            {/* Button 5: Critical Access Rights */}
            <button
              type="button"
              onClick={() => setRiskFilter(riskFilter === 'CRITICAL_ACCESS' ? 'ALL' : 'CRITICAL_ACCESS')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: riskFilter === 'CRITICAL_ACCESS' ? '1.5px solid #2563EB' : '1px solid #BFDBFE',
                background: riskFilter === 'CRITICAL_ACCESS' ? '#2563EB' : '#EFF6FF',
                color: riskFilter === 'CRITICAL_ACCESS' ? '#FFFFFF' : '#1D4ED8',
                boxShadow: riskFilter === 'CRITICAL_ACCESS' ? '0 3px 10px rgba(37, 99, 235, 0.35)' : 'none',
              }}
              title="กรองเฉพาะตำแหน่งที่มีการระบุสิทธิการเข้าถึงระบบสำคัญ (Critical/Privileged Access Rights)"
            >
              <Key size={14} />
              <span>มีสิทธิระบบสำคัญ</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: riskFilter === 'CRITICAL_ACCESS' ? 'rgba(255, 255, 255, 0.3)' : '#DBEAFE',
                  color: riskFilter === 'CRITICAL_ACCESS' ? '#FFFFFF' : '#1E40AF',
                }}
              >
                {riskStats.hasAccessRights}
              </span>
            </button>
          </div>

          {/* Right helper buttons: Reset & Info modal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {riskFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setRiskFilter('ALL')}
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0.25rem 0.5rem',
                }}
                title="ล้างตัวกรองความเสี่ยง"
              >
                <X size={13} />
                <span>ล้างตัวกรอง</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowRiskInfoModal(true)}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary-600)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.25rem 0.5rem',
              }}
              title="ดูความหมายระดับความเสี่ยงของตำแหน่งงานตามสิทธิการเข้าถึง"
            >
              <HelpCircle size={14} />
              <span>ความหมายระดับความเสี่ยงของตำแหน่งงานตามสิทธิการเข้าถึง</span>
            </button>
          </div>
        </div>

        {/* Active Filter Hint Banner if riskFilter is active */}
        {riskFilter !== 'ALL' && (
          <div
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              background:
                riskFilter === 'HIGH'
                  ? '#FEF2F2'
                  : riskFilter === 'MEDIUM'
                  ? '#FEF3C7'
                  : riskFilter === 'LOW'
                  ? '#ECFDF5'
                  : '#EFF6FF',
              border:
                riskFilter === 'HIGH'
                  ? '1px solid #FECACA'
                  : riskFilter === 'MEDIUM'
                  ? '1px solid #FDE68A'
                  : riskFilter === 'LOW'
                  ? '1px solid #A7F3D0'
                  : '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.785rem',
              color:
                riskFilter === 'HIGH'
                  ? '#991B1B'
                  : riskFilter === 'MEDIUM'
                  ? '#92400E'
                  : riskFilter === 'LOW'
                  ? '#065F46'
                  : '#1E40AF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={14} />
              <span>
                กำลังกรองเฉพาะ:{' '}
                <strong>
                  {riskFilter === 'HIGH'
                    ? 'ระดับความเสี่ยงสูง (High Risk)'
                    : riskFilter === 'MEDIUM'
                    ? 'ระดับความเสี่ยงปานกลาง (Medium Risk)'
                    : riskFilter === 'LOW'
                    ? 'ระดับความเสี่ยงต่ำ (Low Risk)'
                    : 'ตำแหน่งที่มีสิทธิการเข้าถึงระบบที่สำคัญ (Privileged Access)'}
                </strong>{' '}
                — พบทั้งหมด <strong>{filteredJDs.length}</strong> ตำแหน่ง
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRiskFilter('ALL')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.75rem',
              }}
            >
              แสดงทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* JD Cards Grid */}
      {loading ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid var(--primary-100)', borderTopColor: 'var(--primary-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <p style={{ marginTop: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>กำลังโหลดข้อมูล Job Description...</p>
        </div>
      ) : filteredJDs.length === 0 ? (
        <div
          className="card-glass"
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            maxWidth: '520px',
            margin: '2rem auto',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--peach-50)',
              color: 'var(--peach-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            {riskFilter !== 'ALL' ? <ShieldAlert size={28} /> : <FileText size={28} />}
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--text-primary)' }}>
            ไม่พบแบบบรรยายลักษณะงาน
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
            {riskFilter !== 'ALL'
              ? `ไม่พบรายการที่มีระดับความเสี่ยง "${riskFilter === 'HIGH' ? 'สูง' : riskFilter === 'MEDIUM' ? 'ปานกลาง' : riskFilter === 'LOW' ? 'ต่ำ' : 'มีสิทธิระบบสำคัญ'}" ในเงื่อนไขที่เลือก`
              : myJdOnly
              ? 'ยังไม่มี JD ที่ผูกกับอีเมลของคุณในระบบ'
              : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {riskFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setRiskFilter('ALL')}
                className="btn btn-secondary btn-sm"
              >
                <Shield size={14} />
                <span>แสดงทุกระดับความเสี่ยง</span>
              </button>
            )}
            {(searchQuery || selectedDept !== 'ALL' || statusFilter !== 'ALL' || myJdOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDept('ALL');
                  setStatusFilter('ALL');
                  setMyJdOnly(false);
                  setRiskFilter('ALL');
                }}
                className="btn btn-secondary btn-sm"
              >
                <X size={14} />
                <span>รีเซ็ตตัวกรองทั้งหมด</span>
              </button>
            )}
            {isAdmin && (
              <button onClick={handleCreateNew} className="btn btn-primary btn-sm">
                <Plus size={14} />
                <span>สร้าง JD รายการแรก</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredJDs.map((jd) => {
            const isOwner = userEmail && (jd.personnelEmail || '').toLowerCase().trim() === userEmail;
            const editable = canUserEdit(jd);
            const posTitle = jd.position || jd.positionTitle || 'ไม่ระบุชื่อตำแหน่ง';
            const posNum = jd.positionNumber || jd.positionNo || '-';
            const posLvl = jd.positionLevel || jd.jobLevel || '';
            const isConfirmed = jd.userConfirmed || jd.status === 'CONFIRMED';
            const respCount = (jd.mainResponsibilities || jd.responsibilities || []).length;
            const fcCount = (jd.functionalCompetencies || []).length;

            const matchedPerson = (personnelList || []).find((p) => {
              if (jd.personnelId && p.id === jd.personnelId) return true;
              if (jd.personnelEmail && p.email && p.email.toLowerCase().trim() === jd.personnelEmail.toLowerCase().trim()) return true;
              if (jd.personnelName && p.name && p.name.trim() === jd.personnelName.trim()) return true;
              return false;
            });
            const avatarUrl = jd.avatarUrl || jd.imageUrl || matchedPerson?.avatarUrl || matchedPerson?.imageUrl || null;

            return (
              <div
                key={jd.id}
                className="card-glass card-pastel-accent"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div style={{ padding: '1.25rem' }}>
                  {/* Top: Dept & Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'var(--bg-card-subtle)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {jd.department || 'ไม่ระบุฝ่าย'}
                    </span>
                    {isConfirmed ? (
                      <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                        <CheckCircle2 size={11} />
                        ยืนยันแล้ว v{jd.version || '2.0'}
                      </span>
                    ) : (
                      <span className="badge badge-type" style={{ fontSize: '0.7rem' }}>
                        <Clock size={11} />
                        ฉบับร่าง v{jd.version || '1.0'}
                      </span>
                    )}
                  </div>

                  {/* Position Title & Position No */}
                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: '0 0 0.35rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {posTitle}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span>เลขที่: <strong style={{ color: 'var(--text-secondary)' }}>{posNum}</strong></span>
                    {posLvl && (
                      <>
                        <span>•</span>
                        <span>ระดับ: <strong style={{ color: 'var(--text-secondary)' }}>{posLvl}</strong></span>
                      </>
                    )}
                  </div>

                  {/* Personnel info box */}
                  <div
                    style={{
                      padding: '0.75rem',
                      background: 'var(--bg-card-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={jd.personnelName || 'บุคลากร'}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1.5px solid var(--peach-200, #FED7AA)',
                          flexShrink: 0,
                          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          flexShrink: 0,
                        }}
                      >
                        {jd.personnelName ? jd.personnelName.charAt(0) : <UserIcon size={18} />}
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {jd.personnelName || 'ตำแหน่งว่าง'}
                        </span>
                        {isOwner && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              background: 'var(--peach-50)',
                              color: 'var(--peach-text)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            คุณ
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.725rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {jd.personnelEmail || 'ยังไม่ได้ระบุอีเมล'}
                      </p>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>หน้าที่ความรับผิดชอบหลัก:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{respCount} ด้าน</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>สมรรถนะประจำตำแหน่ง:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{fcCount} สมรรถนะ</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Shield size={12} style={{ color: 'var(--peach-500)' }} />
                        ความเสี่ยงสารสนเทศ:
                      </span>
                      {jd.securityRiskAssessment?.riskLevel === 'HIGH' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRiskFilter(riskFilter === 'HIGH' ? 'ALL' : 'HIGH');
                          }}
                          title="คลิกเพื่อกรองเฉพาะระดับความเสี่ยงสูง (High)"
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#DC2626',
                            background: '#FEF2F2',
                            padding: '1px 7px',
                            borderRadius: '5px',
                            border: '1px solid #FECACA',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <ShieldAlert size={12} />
                          สูง (High)
                        </button>
                      ) : jd.securityRiskAssessment?.riskLevel === 'MEDIUM' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRiskFilter(riskFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM');
                          }}
                          title="คลิกเพื่อกรองเฉพาะระดับความเสี่ยงปานกลาง (Medium)"
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#D97706',
                            background: '#FEF3C7',
                            padding: '1px 7px',
                            borderRadius: '5px',
                            border: '1px solid #FDE68A',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <AlertTriangle size={12} />
                          ปานกลาง (Medium)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRiskFilter(riskFilter === 'LOW' ? 'ALL' : 'LOW');
                          }}
                          title="คลิกเพื่อกรองเฉพาะระดับความเสี่ยงต่ำ (Low)"
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#059669',
                            background: '#ECFDF5',
                            padding: '1px 7px',
                            borderRadius: '5px',
                            border: '1px solid #A7F3D0',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <ShieldCheck size={12} />
                          ต่ำ (Low)
                        </button>
                      )}
                    </div>
                    {/* Critical Access Rights Hint */}
                    {jd.securityRiskAssessment?.accessRights && jd.securityRiskAssessment.accessRights.trim() && jd.securityRiskAssessment.accessRights.trim() !== '-' && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setRiskFilter(riskFilter === 'CRITICAL_ACCESS' ? 'ALL' : 'CRITICAL_ACCESS');
                        }}
                        style={{
                          marginTop: '0.2rem',
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(37, 99, 235, 0.05)',
                          border: '1px dashed rgba(37, 99, 235, 0.25)',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          color: '#1D4ED8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        title={`คลิกเพื่อกรองตำแหน่งที่มีสิทธิระบบสำคัญ\nรายละเอียด: ${jd.securityRiskAssessment.accessRights}`}
                      >
                        <Key size={11} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          สิทธิระบบ: {jd.securityRiskAssessment.accessRights}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <button
                    onClick={() => setPreviewJD(jd)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <Eye size={13} style={{ color: 'var(--peach-500)' }} />
                    <span>ดูเอกสาร (PDF)</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {editable ? (
                      <button
                        onClick={() => setEditingJD(jd)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
                      >
                        <Edit3 size={13} />
                        <span>แก้ไข</span>
                      </button>
                    ) : isOwner && !windowStatus.isOpen ? (
                      <span
                        title="ยังไม่เปิดช่วงเวลาให้แก้ไข JD (ดูได้เฉพาะ PDF)"
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: 'var(--border-subtle)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'not-allowed',
                        }}
                      >
                        <Lock size={12} />
                        ปิดการแก้ไข
                      </span>
                    ) : null}

                    {isAdmin && (
                      <button
                        onClick={() => setDeletingJD(jd)}
                        title="ลบแบบบรรยายลักษณะงาน"
                        className="btn btn-danger btn-sm btn-icon"
                        style={{ width: '28px', height: '28px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {previewJD && (
        <JDPreviewModal
          isOpen={!!previewJD}
          onClose={() => setPreviewJD(null)}
          jd={previewJD}
          onEdit={() => {
            const toEdit = previewJD;
            setPreviewJD(null);
            setEditingJD(toEdit);
          }}
          canEdit={canUserEdit(previewJD)}
        />
      )}

      {editingJD && (
        <JDModal
          isOpen={!!editingJD}
          onClose={() => setEditingJD(null)}
          jdToEdit={editingJD}
          existingJDs={jds}
          personnelList={personnelList}
          departmentList={departmentList}
          executiveList={executiveList}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          isAdmin={isAdmin}
          isRevisionOpen={windowStatus.isOpen}
          onSave={async (saved) => {
            await saveJDRecord(saved, currentPersonnel, isAdmin);
            setEditingJD(null);
          }}
          onConfirm={async (confirmed) => {
            await saveJDRecord(confirmed, currentPersonnel, isAdmin);
            setEditingJD(null);
          }}
        />
      )}

      {isConfigOpen && (
        <JDConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          currentConfig={config}
          onSaved={(newCfg) => setConfig(newCfg)}
        />
      )}

      {deletingJD && (
        <JDDeleteModal
          isOpen={!!deletingJD}
          onClose={() => setDeletingJD(null)}
          jd={deletingJD}
          onDeleted={(deletedId) => {
            setJds((prev) => prev.filter((item) => item.id !== deletedId));
          }}
        />
      )}

      {/* Information Security Risk Definition Modal */}
      {showRiskInfoModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setShowRiskInfoModal(false)}
        >
          <div
            className="card-glass"
            style={{
              maxWidth: '620px',
              width: '100%',
              borderRadius: 'var(--radius-xl)',
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(249, 115, 22, 0.25)',
                    border: '1px solid rgba(249, 115, 22, 0.4)',
                    color: '#FB923C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                    ความหมายระดับความเสี่ยงของตำแหน่งงานตามสิทธิการเข้าถึง
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#CBD5E1' }}>
                    แบบบรรยายลักษณะงาน (JD) ส่วนที่ 9 ตามมาตรฐานความมั่นคงปลอดภัยสารสนเทศ ISO/IEC 27001
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRiskInfoModal(false)}
                className="btn btn-ghost btn-icon"
                style={{ color: '#94A3B8' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                การกำหนดระดับความเสี่ยงของตำแหน่งงาน พิจารณาจาก <strong>ระดับสิทธิการเข้าถึง (Privilege Levels)</strong> และผลกระทบต่อความลับ ความถูกต้องครบถ้วน และความพร้อมใช้งาน (CIA Triad) ของระบบสารสนเทศหลักสำนักฯ
              </div>

              {/* 3 Risk Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {JD_SECURITY_RISK_LEVELS.map((lvl) => (
                  <div
                    key={lvl.key}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background: lvl.bgColor,
                      border: `1.5px solid ${lvl.borderColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: '#FFFFFF',
                            background: lvl.color,
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {lvl.key}
                        </span>
                        <strong style={{ fontSize: '0.925rem', color: '#0F172A' }}>
                          {lvl.fullTitle}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRiskFilter(lvl.key);
                          setShowRiskInfoModal(false);
                        }}
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          color: lvl.color,
                          background: '#FFFFFF',
                          border: `1px solid ${lvl.borderColor}`,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        กรองดูเฉพาะกลุ่มนี้ →
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {lvl.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Critical Access Box */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: '#EFF6FF',
                  border: '1.5px solid #BFDBFE',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Key size={16} color="#2563EB" />
                    <strong style={{ fontSize: '0.925rem', color: '#1E40AF' }}>
                      สิทธิการเข้าถึงระบบที่สำคัญ (Critical System Access Rights)
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRiskFilter('CRITICAL_ACCESS');
                      setShowRiskInfoModal(false);
                    }}
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      color: '#2563EB',
                      background: '#FFFFFF',
                      border: '1px solid #BFDBFE',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    กรองดูเฉพาะกลุ่มนี้ →
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#1E3A8A', lineHeight: 1.5 }}>
                  ระดับสิทธิในการเข้าถึงและดูแลเครื่องแม่ข่าย (Server), ระบบเครือข่ายแกนหลัก (Core Network), ฐานข้อมูล (Database) หรือโครงสร้างพื้นฐานสำคัญ เช่น สิทธิระดับ Root, Domain Admin, หรือการจัดการ Firewalls ตามมาตรฐานการควบคุมการเข้าถึง (Access Control Policy)
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-card-subtle)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setShowRiskInfoModal(false)}
                className="btn btn-secondary btn-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
