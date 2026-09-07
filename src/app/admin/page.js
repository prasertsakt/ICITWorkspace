'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  subscribePersonnelList,
  subscribeDepartmentList,
  subscribeExecutiveList,
  savePersonnelRecord,
  deletePersonnelRecord,
  saveDepartmentRecord,
  saveExecutiveRecord,
  deleteExecutiveRecord,
  saveExecutiveOrder,
  syncAllSeedDataToFirestore,
  clearAllPersonnelData,
  clearAllExecutivesData,
  resetLocalSeedData,
} from '@/lib/storageService';
import {
  PREDEFINED_DEPARTMENTS,
  PERSONNEL_STATUS,
  USER_ROLES,
  PERSONNEL_TYPES,
} from '@/lib/constants';
import { formatThaiDisplayDate } from '@/lib/dateUtils';
import PersonnelModal from '@/components/PersonnelModal';
import ExecutiveModal from '@/components/ExecutiveModal';
import DepartmentModal from '@/components/DepartmentModal';
import {
  ShieldCheck,
  Users,
  Building2,
  Award,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  User,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Filter,
  CloudUpload,
  ArrowUpDown,
  GripVertical,
} from 'lucide-react';

export default function AdminPage() {
  const { currentPersonnel, isAdmin, isFirebaseConfigured } = useAuth();

  const [activeTab, setActiveTab] = useState('personnel'); // 'personnel' | 'departments' | 'executives' | 'settings'

  // Data states
  const [personnelList, setPersonnelList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [executiveList, setExecutiveList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Search and filters for personnel
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals state
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState(null);

  const [isExecutiveModalOpen, setIsExecutiveModalOpen] = useState(false);
  const [editingExecutive, setEditingExecutive] = useState(null);

  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  // Executive rearrange states
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

  const handleSyncToFirestore = async () => {
    if (!confirm('ต้องการอัปโหลด/ซิงค์ข้อมูลเริ่มต้นทั้งหมด (6 ฝ่าย, บุคลากร, ฝ่ายบริหาร) ขึ้น Cloud Firestore ใช่หรือไม่?')) {
      return;
    }
    setIsSyncing(true);
    try {
      await syncAllSeedDataToFirestore();
      alert('✅ ซิงค์ข้อมูลขึ้น Firebase Firestore สำเร็จเรียบร้อยแล้ว!');
    } catch (err) {
      console.error('Sync failed', err);
      alert('เกิดข้อผิดพลาดในการซิงค์ข้อมูล กรุณาตรวจสอบการตั้งค่า Firebase');
    } finally {
      setIsSyncing(false);
    }
  };

  // Access check
  if (!isAdmin) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div
          className="card-glass"
          style={{ maxWidth: '480px', margin: '0 auto', padding: '2.5rem 1.5rem' }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--rose-50)',
              color: 'var(--rose-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <ShieldCheck size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            บัญชีปัจจุบันของคุณ ({currentPersonnel?.email || 'ยังไม่ได้เข้าสู่ระบบ'}) ไม่มีสิทธิ์เข้าถึงส่วนจัดการระบบนี้
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <Link href="/" className="btn btn-secondary btn-sm">
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle Personnel Actions with Immediate State Update
  const handleSavePersonnel = async (data) => {
    // Immediate optimistic update (0ms UI latency)
    setPersonnelList((prev) => {
      const idx = prev.findIndex((p) => p.id === data.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...data };
        return next;
      }
      return [data, ...prev];
    });
    await savePersonnelRecord(data);
  };

  const handleDeletePersonnel = async (id, name) => {
    if (confirm(`คุณต้องการลบข้อมูล "${name}" ออกจากระบบใช่หรือไม่?`)) {
      setPersonnelList((prev) => prev.filter((p) => p.id !== id));
      await deletePersonnelRecord(id);
    }
  };

  const handleTogglePersonnelStatus = async (person) => {
    const newStatus =
      person.status === PERSONNEL_STATUS.ACTIVE
        ? PERSONNEL_STATUS.RESIGNED
        : PERSONNEL_STATUS.ACTIVE;
    const updated = { ...person, status: newStatus };
    setPersonnelList((prev) => prev.map((p) => (p.id === person.id ? updated : p)));
    await savePersonnelRecord(updated);
  };

  const handleTogglePersonnelRole = async (person) => {
    const newRole =
      person.role === USER_ROLES.ADMIN ? USER_ROLES.USER : USER_ROLES.ADMIN;
    const updated = { ...person, role: newRole };
    setPersonnelList((prev) => prev.map((p) => (p.id === person.id ? updated : p)));
    await savePersonnelRecord(updated);
  };

  // Handle Executive Actions with Immediate State Update
  const handleSaveExecutive = async (data) => {
    setExecutiveList((prev) => {
      const idx = prev.findIndex((e) => e.id === data.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...data };
        return next;
      }
      return [...prev, data];
    });
    await saveExecutiveRecord(data);
  };

  const handleDeleteExecutive = async (id, name) => {
    if (confirm(`คุณต้องการลบผู้บริหาร "${name}" ใช่หรือไม่?`)) {
      setExecutiveList((prev) => prev.filter((e) => e.id !== id));
      await deleteExecutiveRecord(id);
    }
  };

  // Handle Department Actions with Immediate State Update
  const handleSaveDepartment = async (data) => {
    setDepartmentList((prev) => {
      const idx = prev.findIndex((d) => d.id === data.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...data };
        return next;
      }
      return [...prev, data];
    });
    await saveDepartmentRecord(data);
  };

  const handleResetData = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่างใช่หรือไม่?')) {
      resetLocalSeedData();
    }
  };

  const handleClearDummyData = async () => {
    if (confirm('คุณต้องการลบข้อมูลบุคลากรและฝ่ายบริหารตัวอย่างทั้งหมด เพื่อเริ่มต้นใส่ข้อมูลบุคลากรจริงใช่หรือไม่? (ระบบจะคงบัญชี Admin ปัจจุบันของคุณไว้)')) {
      const keepEmail = currentPersonnel?.email || '';
      await clearAllPersonnelData(keepEmail);
      await clearAllExecutivesData();
      alert('ล้างข้อมูลตัวอย่างเรียบร้อยแล้ว! ตอนนี้ฐานข้อมูลว่างและพร้อมสำหรับการเพิ่มบุคลากรจริงแล้วครับ');
    }
  };

  // Filtered personnel list
  const filteredPersonnel = personnelList.filter((p) => {
    const matchSearch =
      searchTerm === '' ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = filterDept === 'ALL' || p.department === filterDept;
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div className="main-container">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <span className="badge badge-admin">
              <ShieldCheck size={12} />
              Admin Management Console
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ระบบจัดการข้อมูลองค์กร
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            จัดการรายชื่อบุคลากร (Google Login Whitelist), โครงสร้าง 6 ฝ่าย และฝ่ายบริหาร
          </p>
        </div>

        {/* Tab Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            background: 'white',
            padding: '0.35rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('personnel')}
            className={`btn btn-sm ${activeTab === 'personnel' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            <Users size={15} />
            <span>บุคลากร ({personnelList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`btn btn-sm ${activeTab === 'departments' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            <Building2 size={15} />
            <span>โครงสร้างฝ่าย (6)</span>
          </button>

          <button
            onClick={() => setActiveTab('executives')}
            className={`btn btn-sm ${activeTab === 'executives' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            <Award size={15} />
            <span>ฝ่ายบริหาร ({executiveList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`btn btn-sm ${activeTab === 'settings' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            <Settings size={15} />
            <span>ตั้งค่า & คู่มือ</span>
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: PERSONNEL MANAGEMENT ===================== */}
      {activeTab === 'personnel' && (
        <div>
          {/* Controls Bar */}
          <div
            className="card-glass"
            style={{
              padding: '1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search
                    size={16}
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
                    placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.2rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="ALL">🏢 ทุกฝ่าย</option>
                  {PREDEFINED_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="ALL">สถานะทั้งหมด</option>
                  <option value={PERSONNEL_STATUS.ACTIVE}>🟢 ปกติ</option>
                  <option value={PERSONNEL_STATUS.RESIGNED}>🔴 ลาออก</option>
                </select>

                <button
                  onClick={() => {
                    setEditingPersonnel(null);
                    setIsPersonnelModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={16} />
                  <span>เพิ่มบุคลากร</span>
                </button>
              </div>
            </div>
          </div>

          {/* Personnel Table / Cards */}
          <div className="card-glass" style={{ overflowX: 'auto', padding: 0 }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.85rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--bg-card-subtle)',
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: '0.85rem 1rem' }}>ชื่อ-นามสกุล / อีเมล</th>
                  <th style={{ padding: '0.85rem 1rem' }}>ฝ่ายที่สังกัด</th>
                  <th style={{ padding: '0.85rem 1rem' }}>ตำแหน่งงาน (ระดับ)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>ประเภท</th>
                  <th style={{ padding: '0.85rem 1rem' }}>บรรจุ - เกษียณ (พ.ศ.)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>สถานะ</th>
                  <th style={{ padding: '0.85rem 1rem' }}>สิทธิ์</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersonnel.map((person) => {
                  const isActive = person.status === PERSONNEL_STATUS.ACTIVE;
                  const isPersonAdmin = person.role === USER_ROLES.ADMIN;

                  return (
                    <tr
                      key={person.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'var(--transition)',
                      }}
                    >
                      {/* Name & Email */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {person.avatarUrl ? (
                            <img
                              src={person.avatarUrl}
                              alt=""
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'var(--primary-100)',
                                color: 'var(--primary-600)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            >
                              {person.name?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <strong style={{ color: 'var(--text-primary)', display: 'block' }}>
                              {person.name}
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {person.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {person.department}
                      </td>

                      {/* Position & Level */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {person.position}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary-600)' }}>
                          {person.level}
                        </div>
                      </td>

                      {/* Personnel Type */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-type" style={{ fontSize: '0.725rem' }}>
                          {person.personnelType}
                        </span>
                      </td>

                      {/* Dates */}
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem' }}>
                        <div>บรรจุ: {person.appointmentDate}</div>
                        <div style={{ color: 'var(--text-muted)' }}>เกษียณ: {person.retirementDate}</div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <button
                          onClick={() => handleTogglePersonnelStatus(person)}
                          className={`badge ${isActive ? 'badge-active' : 'badge-resigned'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="คลิกเพื่อสลับสถานะ"
                        >
                          <span className="pulse-dot" />
                          {person.status}
                        </button>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <button
                          onClick={() => handleTogglePersonnelRole(person)}
                          className={`badge ${isPersonAdmin ? 'badge-admin' : 'badge-user'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="คลิกเพื่อสลับสิทธิ์ Admin/USER"
                        >
                          {isPersonAdmin ? '🛡️ Admin' : '👤 USER'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                          <button
                            onClick={() => {
                              setEditingPersonnel(person);
                              setIsPersonnelModalOpen(true);
                            }}
                            className="btn btn-ghost btn-icon"
                            title="แก้ไข"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePersonnel(person.id, person.name)}
                            className="btn btn-ghost btn-icon"
                            style={{ color: 'var(--rose-500)' }}
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredPersonnel.length === 0 && (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                ไม่พบข้อมูลบุคลากรที่ตรงกับเงื่อนไข
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: DEPARTMENTS (6 PREDEFINED) ===================== */}
      {activeTab === 'departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}
          >
            <strong>โครงสร้าง 6 ฝ่ายหลักขององค์กร:</strong> คุณสามารถกำหนด
            <strong>หัวหน้าฝ่าย</strong> (เลือกจากบุคลากร) และ
            <strong>ผู้บริหารที่กำกับดูแลฝ่าย</strong> (เลือกจากคณะฝ่ายบริหาร) ได้อย่างอิสระ
          </div>

          <div className="grid-2">
            {PREDEFINED_DEPARTMENTS.map((deptName) => {
              const deptConfig = departmentList.find((d) => d.name === deptName) || { name: deptName };
              const head = personnelList.find((p) => p.id === deptConfig.headPersonnelId);
              const supervisingExec = executiveList.find((e) => e.id === deptConfig.supervisingExecutiveId);
              const staffCount = personnelList.filter((p) => p.department === deptName).length;

              return (
                <div
                  key={deptName}
                  className="card-glass"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    borderTop: '4px solid var(--primary-500)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {deptName}
                      </h4>
                      <span className="badge badge-user">{staffCount} บุคลากร</span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                      {deptConfig.description || 'ยังไม่ได้ระบุรายละเอียดภารกิจ'}
                    </p>
                  </div>

                  <div
                    style={{
                      background: '#F8FAFC',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.825rem',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>หัวหน้าฝ่าย: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {head ? `${head.name} (${head.position})` : '⚠️ ยังไม่ได้ระบุ'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>ผู้บริหารที่กำกับดูแล: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {supervisingExec ? `${supervisingExec.name} (${supervisingExec.position})` : '⚠️ ยังไม่ได้ระบุ'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setEditingDepartment(deptConfig);
                        setIsDepartmentModalOpen(true);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      <Edit2 size={14} />
                      <span>กำหนดหัวหน้า / ผู้บริหาร</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: EXECUTIVE BOARD ===================== */}
      {activeTab === 'executives' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                คณะฝ่ายบริหาร ({executiveList.length} ท่าน)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                {isRearrangingExecs
                  ? '💡 ลากการ์ดเพื่อสลับตำแหน่ง หรือใช้ปุ่ม ◀ ▶ บนการ์ดแต่ละใบเพื่อจัดเรียงลำดับ'
                  : 'ผู้บริหารระดับสูงและผู้กำกับดูแลฝ่ายงาน'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsRearrangingExecs(!isRearrangingExecs)}
                className={`btn btn-sm ${isRearrangingExecs ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
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

              {!isRearrangingExecs && (
                <button
                  onClick={() => {
                    setEditingExecutive(null);
                    setIsExecutiveModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={16} />
                  <span>เพิ่มผู้บริหารใหม่</span>
                </button>
              )}
            </div>
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
                      : undefined,
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
                        alt=""
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--peach-200)',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: 'var(--peach-50)',
                          color: 'var(--peach-500)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {exec.name?.charAt(0)}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
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
                      <p style={{ fontSize: '0.8rem', color: 'var(--primary-600)', margin: 0, fontWeight: 500 }}>
                        {exec.position}
                      </p>
                      {(() => {
                        const linked = personnelList.find((p) => p.id === exec.personnelId || p.name === exec.name);
                        return linked ? (
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                            🏢 {linked.department} ({linked.position})
                          </span>
                        ) : null;
                      })()}
                    </div>

                    {!isRearrangingExecs && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <button
                          onClick={() => {
                            setEditingExecutive(exec);
                            setIsExecutiveModalOpen(true);
                          }}
                          className="btn btn-ghost btn-icon"
                          title="แก้ไข"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteExecutive(exec.id, exec.name)}
                          className="btn btn-ghost btn-icon"
                          style={{ color: 'var(--rose-500)' }}
                          title="ลบ"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 4: SYSTEM SETTINGS & DEPLOYMENT GUIDE ===================== */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Card */}
          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              ⚙️ สถานะการเชื่อมต่อระบบฐานข้อมูล & การยืนยันตัวตน
            </h3>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: isFirebaseConfigured ? 'var(--mint-50)' : 'var(--peach-50)',
                border: isFirebaseConfigured ? '1px solid var(--mint-200)' : '1px solid var(--peach-100)',
                marginBottom: '1rem',
              }}
            >
              <div>
                <strong>
                  {isFirebaseConfigured ? '🟢 เชื่อมต่อกับ Firebase สำเร็จ (Live Mode)' : '🟡 ใช้งานในโหมดจำลอง (Local Storage / Demo Mode)'}
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {isFirebaseConfigured
                    ? 'ระบบกำลังบันทึกข้อมูลและตรวจสอบสิทธิ์ Google Login ผ่าน Firebase Firestore โดยตรง'
                    : 'ระบบกำลังทำงานผ่านหน่วยความจำของบราวเซอร์ คุณสามารถทดสอบทุกฟังก์ชันได้ทันที และเมื่อใส่ Firebase Keys ใน .env.local ข้อมูลจะซิงค์กับ Firestore'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {isFirebaseConfigured && (
                  <button
                    onClick={handleSyncToFirestore}
                    disabled={isSyncing}
                    className="btn btn-primary btn-sm"
                  >
                    <CloudUpload size={14} />
                    <span>{isSyncing ? 'กำลังซิงค์ขึ้น Firestore...' : '☁️ ซิงค์ข้อมูลทั้งหมดขึ้น Firestore'}</span>
                  </button>
                )}
                <button onClick={handleResetData} className="btn btn-secondary btn-sm">
                  <RotateCcw size={14} />
                  <span>รีเซ็ตข้อมูลตัวอย่าง</span>
                </button>
                <button
                  onClick={handleClearDummyData}
                  className="btn btn-danger btn-sm"
                  title="ลบเฉพาะข้อมูลบุคลากรตัวอย่าง เพื่อเริ่มกรอกข้อมูลบุคลากรจริง"
                >
                  <Trash2 size={14} />
                  <span>ล้างข้อมูลตัวอย่าง (เริ่มใช้งานจริง)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Deployment Guide */}
          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              🚀 ขั้นตอนการขึ้นระบบบน GitHub และ Vercel
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
              <div>
                <strong>1. ติดตั้งตัวแปรสภาพแวดล้อม (Environment Variables) บน Vercel:</strong>
                <div
                  style={{
                    background: '#1E293B',
                    color: '#F8FAFC',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '0.4rem',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                  }}
                >
                  NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key<br />
                  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com<br />
                  NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id<br />
                  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com<br />
                  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id<br />
                  NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
                </div>
              </div>

              <div>
                <strong>2. การเปิดใช้งาน Google Sign-In ใน Firebase Console:</strong>
                <ol style={{ paddingLeft: '1.5rem', marginTop: '0.3rem' }}>
                  <li>ไปที่ Firebase Console &gt; Authentication &gt; Sign-in method</li>
                  <li>เปิดใช้งาน <strong>Google</strong> Provider</li>
                  <li>เพิ่มโดเมนของ Vercel (เช่น <code>your-app.vercel.app</code>) ในแท็บ <strong>Authorized domains</strong></li>
                </ol>
              </div>

              <div>
                <strong>3. กลไกความปลอดภัย Google Whitelist:</strong>
                <p style={{ marginTop: '0.3rem', color: 'var(--text-secondary)' }}>
                  เมื่อผู้ใช้ล็อกอินผ่าน Google ระบบจะนำอีเมลที่ได้รับมาค้นหาในคอลเลกชัน <code>personnel</code> ใน Firestore ทันที หากไม่พบอีเมลหรือสถานะเป็น <code>ลาออก</code> ระบบจะปฏิเสธการเข้าถึงโดยอัตโนมัติ
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <PersonnelModal
        isOpen={isPersonnelModalOpen}
        onClose={() => setIsPersonnelModalOpen(false)}
        onSave={handleSavePersonnel}
        personnelToEdit={editingPersonnel}
      />

      <ExecutiveModal
        isOpen={isExecutiveModalOpen}
        onClose={() => setIsExecutiveModalOpen(false)}
        onSave={handleSaveExecutive}
        executiveToEdit={editingExecutive}
        personnelList={personnelList}
      />

      <DepartmentModal
        isOpen={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
        onSave={handleSaveDepartment}
        departmentToEdit={editingDepartment}
        personnelList={personnelList}
        executiveList={executiveList}
      />
    </div>
  );
}
