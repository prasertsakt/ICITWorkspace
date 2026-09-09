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
import { SAMPLE_SEED_JD, createBlankJD } from '@/lib/jdTemplateData';
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

  // Modals state
  const [previewJD, setPreviewJD] = useState(null);
  const [editingJD, setEditingJD] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [deletingJD, setDeletingJD] = useState(null);

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

  // Filtered JDs
  const filteredJDs = useMemo(() => {
    return jds.filter((item) => {
      const posTitle = item.position || item.positionTitle || '';
      const posNum = item.positionNumber || item.positionNo || '';
      const persName = item.personnelName || '';
      const persDept = item.department || '';
      const persEmail = item.personnelEmail || '';
      const isConfirmed = item.userConfirmed || item.status === 'CONFIRMED';

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          persName.toLowerCase().includes(q) ||
          posTitle.toLowerCase().includes(q) ||
          posNum.toLowerCase().includes(q) ||
          persDept.toLowerCase().includes(q) ||
          persEmail.toLowerCase().includes(q);
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

      return true;
    });
  }, [jds, searchQuery, selectedDept, statusFilter, myJdOnly, userEmail]);

  // Department list
  const departments = useMemo(() => {
    const list = Array.from(new Set(jds.map((j) => j.department).filter(Boolean)));
    return list.sort();
  }, [jds]);

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
    const newJD = createBlankJD(currentPersonnel || { name: '', email: currentUser?.email });
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

      {/* Toolbar: Search, Filters & "My JD Only" */}
      <div
        className="card-glass"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '280px' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
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
              placeholder="ค้นหาชื่อผู้ครองตำแหน่ง, ตำแหน่ง, เลขที่ตำแหน่ง..."
              className="form-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
            />
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
            maxWidth: '500px',
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
            <FileText size={28} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--text-primary)' }}>
            ไม่พบแบบบรรยายลักษณะงาน
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem' }}>
            {myJdOnly
              ? 'ยังไม่มี JD ที่ผูกกับอีเมลของคุณในระบบ'
              : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา'}
          </p>
          {isAdmin && (
            <button onClick={handleCreateNew} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>สร้าง JD รายการแรก</span>
            </button>
          )}
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
                      <span>สมรรถนะประจำตำแหน่ง (FC):</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{fcCount} สมรรถนะ</strong>
                    </div>
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
          personnelList={personnelList}
          departmentList={departmentList}
          executiveList={executiveList}
          currentPersonnel={currentPersonnel}
          isAdmin={isAdmin}
          isRevisionOpen={windowStatus.isOpen}
          onSave={async (saved) => {
            await saveJDRecord(saved, currentPersonnel, isAdmin);
            setEditingJD(null);
          }}
          onConfirm={async (confirmed) => {
            await confirmJDVersion(confirmed.id, currentPersonnel, isAdmin);
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
    </div>
  );
}
