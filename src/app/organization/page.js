'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  subscribePersonnelList,
  subscribeDepartmentList,
  subscribeExecutiveList,
  saveExecutiveOrder,
} from '@/lib/storageService';
import { PREDEFINED_DEPARTMENTS, PERSONNEL_STATUS, USER_ROLES } from '@/lib/constants';
import { formatThaiDisplayDate } from '@/lib/dateUtils';
import {
  Users,
  Building2,
  Award,
  Search,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Filter,
  Sparkles,
  ArrowUpRight,
  Mail,
  Calendar,
  Briefcase,
  Layers,
  ArrowLeft,
  ArrowUpDown,
  GripVertical,
} from 'lucide-react';

export default function OrganizationPage() {
  const { currentUser, currentPersonnel, isAdmin } = useAuth();
  const [personnelList, setPersonnelList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [executiveList, setExecutiveList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedPersonnelDetail, setSelectedPersonnelDetail] = useState(null);

  // Executive Rearrange state (Admin only)
  const [isRearrangingExecs, setIsRearrangingExecs] = useState(false);
  const [draggedExecIndex, setDraggedExecIndex] = useState(null);
  const [dragOverExecIndex, setDragOverExecIndex] = useState(null);

  const moveExecutive = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= executiveList.length || fromIndex === toIndex) return;
    const next = [...executiveList];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setExecutiveList(next);
    await saveExecutiveOrder(next);
  };

  const handleExecDragStart = (e, index) => {
    setDraggedExecIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleExecDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverExecIndex !== index) {
      setDragOverExecIndex(index);
    }
  };

  const handleExecDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedExecIndex === null || draggedExecIndex === dropIndex) {
      setDraggedExecIndex(null);
      setDragOverExecIndex(null);
      return;
    }
    await moveExecutive(draggedExecIndex, dropIndex);
    setDraggedExecIndex(null);
    setDragOverExecIndex(null);
  };

  const handleExecDragEnd = () => {
    setDraggedExecIndex(null);
    setDragOverExecIndex(null);
  };

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

  // Filtered personnel
  const activePersonnel = personnelList.filter((p) => p.status === PERSONNEL_STATUS.ACTIVE);
  const filteredPersonnel = personnelList.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || p.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="main-container">
      {/* Back to Portal button */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          href="/"
          className="btn btn-ghost btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', paddingLeft: 0 }}
        >
          <ArrowLeft size={16} />
          <span>กลับสู่หน้าพอร์ทัลหลัก (Portal Home)</span>
        </Link>
      </div>

      {/* Hero Header */}
      <section
        style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #FDF4FF 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem 1.5rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(199, 210, 254, 0.4)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px' }}>
          <div
            className="badge badge-admin"
            style={{ marginBottom: '0.75rem', background: 'white', border: '1px solid var(--primary-200)' }}
          >
            <Building2 size={14} />
            <span>โครงสร้างองค์กรและทำเนียบบุคลากร</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              marginBottom: '0.75rem',
            }}
          >
            โครงสร้างฝ่ายงานและทำเนียบบุคลากร
          </h2>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            ผังโครงสร้าง 6 ฝ่ายงานหลัก คณะฝ่ายบริหาร และรายชื่อบุคลากรทั้งหมดภายในองค์กร
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {currentPersonnel ? (
              <Link href="/profile" className="btn btn-primary btn-sm">
                <UserCheck size={16} />
                <span>ดูข้อมูลส่วนบุคคลของฉัน</span>
              </Link>
            ) : null}

            {isAdmin && (
              <Link href="/admin" className="btn btn-secondary btn-sm">
                <ShieldCheck size={16} />
                <span>จัดการข้อมูล (Admin)</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Metrics Cards */}
      <section className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <div className="card-glass" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              บุคลากรทั้งหมด
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {personnelList.length} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>คน</span>
          </div>
        </div>

        <div className="card-glass" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              ปฏิบัติงานปกติ (Active)
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--mint-50)',
                color: 'var(--mint-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--mint-600)' }}>
            {activePersonnel.length} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>คน</span>
          </div>
        </div>

        <div className="card-glass" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              ฝ่ายงานในองค์กร
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--sky-50)',
                color: 'var(--sky-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--sky-text)' }}>
            {PREDEFINED_DEPARTMENTS.length} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>ฝ่าย</span>
          </div>
        </div>

        <div className="card-glass" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              คณะฝ่ายบริหาร
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--peach-50)',
                color: 'var(--peach-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--peach-text)' }}>
            {executiveList.length} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>ท่าน</span>
          </div>
        </div>
      </section>

      {/* Executive Board Section */}
      <section style={{ marginBottom: '2.5rem' }}>
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
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              🏛️ คณะผู้บริหาร (Executive Board)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isRearrangingExecs
                ? '💡 ลากการ์ดเพื่อสลับตำแหน่ง หรือใช้ปุ่ม ◀ ▶ บนการ์ดแต่ละใบเพื่อจัดเรียงลำดับ'
                : 'โครงสร้างฝ่ายบริหารและผู้กำกับดูแลหน่วยงาน'}
            </p>
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setIsRearrangingExecs(!isRearrangingExecs)}
                className={`btn btn-sm ${isRearrangingExecs ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              >
                {isRearrangingExecs ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>เสร็จสิ้นการจัดเรียง</span>
                  </>
                ) : (
                  <>
                    <ArrowUpDown size={15} />
                    <span>จัดเรียงการ์ดผู้บริหาร</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="grid-3">
          {executiveList.map((exec, index) => {
            const isDragging = draggedExecIndex === index;
            const isDragTarget = dragOverExecIndex === index && draggedExecIndex !== index;

            return (
              <div
                key={exec.id}
                className="card-glass"
                draggable={isRearrangingExecs}
                onDragStart={(e) => handleExecDragStart(e, index)}
                onDragOver={(e) => handleExecDragOver(e, index)}
                onDrop={(e) => handleExecDrop(e, index)}
                onDragEnd={handleExecDragEnd}
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  position: 'relative',
                  cursor: isRearrangingExecs ? 'grab' : 'default',
                  opacity: isDragging ? 0.4 : 1,
                  transform: isDragging ? 'scale(0.97)' : 'scale(1)',
                  border: isDragTarget
                    ? '2px dashed var(--primary-500)'
                    : isRearrangingExecs
                    ? '1px dashed var(--peach-300)'
                    : undefined,
                  backgroundColor: isDragTarget
                    ? 'rgba(99, 102, 241, 0.05)'
                    : isRearrangingExecs
                    ? 'rgba(255, 255, 255, 0.95)'
                    : 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFF 100%)',
                  boxShadow: isRearrangingExecs
                    ? '0 6px 16px -3px rgba(249, 115, 22, 0.12)'
                    : undefined,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                }}
              >
                {/* Rearrange Bar when in rearrange mode */}
                {isRearrangingExecs && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: '0.6rem',
                      borderBottom: '1px dashed var(--peach-200)',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <GripVertical size={16} style={{ color: 'var(--peach-500)' }} />
                      <span
                        className="badge"
                        style={{
                          background: 'var(--peach-50)',
                          color: 'var(--peach-600)',
                          border: '1px solid var(--peach-200)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        ลำดับที่ {index + 1}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveExecutive(index, index - 1);
                        }}
                        disabled={index === 0}
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '0.2rem 0.45rem',
                          fontSize: '0.72rem',
                          opacity: index === 0 ? 0.35 : 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                        title="เลื่อนไปซ้าย (ลำดับก่อนหน้า)"
                      >
                        <ChevronLeft size={13} />
                        <span>ซ้าย</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveExecutive(index, index + 1);
                        }}
                        disabled={index === executiveList.length - 1}
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '0.2rem 0.45rem',
                          fontSize: '0.72rem',
                          opacity: index === executiveList.length - 1 ? 0.35 : 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                        title="เลื่อนไปขวา (ลำดับถัดไป)"
                      >
                        <span>ขวา</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Card Content */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {exec.avatarUrl ? (
                    <img
                      src={exec.avatarUrl}
                      alt={exec.name}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: 'var(--radius-full)',
                        objectFit: 'cover',
                        border: '3px solid var(--peach-100)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--peach-50)',
                        color: 'var(--peach-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {exec.name?.charAt(0) || 'ผ'}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: 'var(--peach-50)',
                        color: 'var(--peach-text)',
                        fontSize: '0.7rem',
                        marginBottom: '0.35rem',
                      }}
                    >
                      ผู้บริหาร
                    </span>
                    <h4
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '0.2rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {exec.name}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--primary-600)', fontWeight: 500, margin: 0 }}>
                      {exec.position}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Organization Structure: 6 Predefined Departments */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              🏢 โครงสร้างฝ่ายงาน (Departments)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              โครงสร้าง 6 ฝ่ายหลัก แสดงหัวหน้าฝ่ายและผู้บริหารกำกับดูแล
            </p>
          </div>
        </div>

        <div className="grid-2">
          {PREDEFINED_DEPARTMENTS.map((deptName) => {
            const deptConfig = departmentList.find((d) => d.name === deptName) || {};
            const head = personnelList.find((p) => p.id === deptConfig.headPersonnelId);
            const supervisingExec = executiveList.find((e) => e.id === deptConfig.supervisingExecutiveId);
            const deptStaff = personnelList.filter((p) => p.department === deptName && p.status === PERSONNEL_STATUS.ACTIVE);

            return (
              <div
                key={deptName}
                className="card-glass"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderTop: '4px solid var(--primary-pastel)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {deptName}
                    </h4>
                    <span className="badge badge-user" style={{ flexShrink: 0 }}>
                      {deptStaff.length} คน
                    </span>
                  </div>
                  {deptConfig.description && (
                    <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                      {deptConfig.description}
                    </p>
                  )}
                </div>

                {/* Supervisor & Head Info Box */}
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {/* Supervising Exec */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <Award size={16} style={{ color: 'var(--peach-500)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>ผู้บริหารกำกับดูแล:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {supervisingExec ? `${supervisingExec.name} (${supervisingExec.position})` : 'ยังไม่ได้กำหนด'}
                    </strong>
                  </div>

                  {/* Head of Dept */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <UserCheck size={16} style={{ color: 'var(--mint-500)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }}>หัวหน้าฝ่าย:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {head ? `${head.name} (${head.position})` : 'ยังไม่ได้กำหนด'}
                    </strong>
                  </div>
                </div>

                {/* Quick Staff Avatars */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '-6px' }}>
                    {deptStaff.slice(0, 5).map((member, i) => (
                      <div
                        key={member.id}
                        title={`${member.name} (${member.position})`}
                        style={{
                          marginLeft: i > 0 ? '-8px' : 0,
                          border: '2px solid white',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          overflow: 'hidden',
                          background: 'var(--primary-100)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          member.name?.charAt(0)
                        )}
                      </div>
                    ))}
                    {deptStaff.length > 5 && (
                      <div
                        style={{
                          marginLeft: '-8px',
                          border: '2px solid white',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          background: '#E2E8F0',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        +{deptStaff.length - 5}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDept(deptName);
                      const el = document.getElementById('personnel-directory');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.775rem' }}
                  >
                    <span>ดูสมาชิกฝ่าย</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Personnel Directory & Search */}
      <section id="personnel-directory" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              👥 ทำเนียบบุคลากร (Personnel Directory)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              ค้นหาบุคลากรตามชื่อ ตำแหน่ง หรือเลือกกรองตามฝ่าย
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="ค้นหาชื่อ, อีเมล หรือตำแหน่งงาน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                />
              </div>

              <select
                className="form-select"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ width: 'auto', minWidth: '180px' }}
              >
                <option value="ALL">🏢 ทุกฝ่ายในองค์กร</option>
                {PREDEFINED_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Department Pill Filters (Horizontal scroll on mobile) */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingBottom: '0.4rem',
              }}
            >
              <button
                onClick={() => setSelectedDept('ALL')}
                className={`btn btn-sm ${selectedDept === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              >
                ทั้งหมด ({personnelList.length})
              </button>
              {PREDEFINED_DEPARTMENTS.map((dept) => {
                const count = personnelList.filter((p) => p.department === dept).length;
                return (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`btn btn-sm ${selectedDept === dept ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  >
                    {dept} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Personnel Cards Grid */}
        <div className="grid-3">
          {filteredPersonnel.map((person) => {
            const isActive = person.status === PERSONNEL_STATUS.ACTIVE;
            return (
              <div
                key={person.id}
                className="card-glass"
                onClick={() => setSelectedPersonnelDetail(person)}
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  borderLeft: isActive ? '4px solid var(--mint-500)' : '4px solid var(--rose-500)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {person.avatarUrl ? (
                    <img
                      src={person.avatarUrl}
                      alt={person.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-full)',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--primary-100)',
                        color: 'var(--primary-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                      }}
                    >
                      {person.name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <h4
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {person.name}
                      </h4>
                      {person.role === USER_ROLES.ADMIN && (
                        <span className="badge badge-admin" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                          Admin
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--primary-600)', fontWeight: 500, margin: 0 }}>
                      {person.position}{person.level ? ` (${person.level})` : ''}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.775rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    <Building2 size={13} style={{ color: 'var(--sky-500)' }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {person.department}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    <Mail size={13} style={{ color: 'var(--primary-500)' }} />
                    <span>{person.email}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.725rem',
                  }}
                >
                  <span
                    className={`badge ${isActive ? 'badge-active' : 'badge-resigned'}`}
                  >
                    <span className="pulse-dot" />
                    {person.status}
                  </span>

                  <span className="badge badge-type">
                    {person.personnelType}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPersonnel.length === 0 && (
          <div
            className="card-glass"
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <Users size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.9rem' }}>ไม่พบบุคลากรที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        )}
      </section>

      {/* Personnel Quick Detail Modal */}
      {selectedPersonnelDetail && (
        <div className="modal-overlay" onClick={() => setSelectedPersonnelDetail(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>ข้อมูลบุคลากร</h3>
              <button
                onClick={() => setSelectedPersonnelDetail(null)}
                className="btn btn-ghost btn-icon"
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {selectedPersonnelDetail.avatarUrl ? (
                  <img
                    src={selectedPersonnelDetail.avatarUrl}
                    alt=""
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: 'var(--radius-full)',
                      objectFit: 'cover',
                      border: '3px solid var(--primary-100)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--primary-100)',
                      color: 'var(--primary-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.6rem',
                      fontWeight: 700,
                    }}
                  >
                    {selectedPersonnelDetail.name?.charAt(0)}
                  </div>
                )}

                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    {selectedPersonnelDetail.name}
                  </h4>
                  <p style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.875rem', margin: '0.2rem 0' }}>
                    {selectedPersonnelDetail.position}{selectedPersonnelDetail.level ? ` (${selectedPersonnelDetail.level})` : ''}
                  </p>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <span
                      className={`badge ${selectedPersonnelDetail.status === PERSONNEL_STATUS.ACTIVE ? 'badge-active' : 'badge-resigned'}`}
                    >
                      {selectedPersonnelDetail.status}
                    </span>
                    <span className="badge badge-type">
                      {selectedPersonnelDetail.personnelType}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <strong>ฝ่าย:</strong> {selectedPersonnelDetail.department}
                </div>
                <div>
                  <strong>อีเมล:</strong> {selectedPersonnelDetail.email}
                </div>
                <div>
                  <strong>วันที่บรรจุ:</strong> {formatThaiDisplayDate(selectedPersonnelDetail.appointmentDate)} (พ.ศ.)
                </div>
                <div>
                  <strong>วันที่เกษียณ:</strong> {formatThaiDisplayDate(selectedPersonnelDetail.retirementDate)} (พ.ศ.)
                </div>
                {selectedPersonnelDetail.note && (
                  <div>
                    <strong>หมายเหตุ:</strong> {selectedPersonnelDetail.note}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setSelectedPersonnelDetail(null)}
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
