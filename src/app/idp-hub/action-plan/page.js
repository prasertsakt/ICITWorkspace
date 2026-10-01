'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Compass,
  FileSpreadsheet,
  Award,
  Users,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeActionPlans,
  deleteActionPlan,
  saveActionPlan,
  createActionPlanItemsFromNeedAnalysis,
  exportActionPlanToExcel,
} from '@/lib/idpActionPlanService';
import { subscribeIdpRecords, isHrOfficer } from '@/lib/idpService';
import {
  subscribePersonnelList,
  subscribeDepartmentList,
  subscribeExecutiveList,
} from '@/lib/storageService';
import { MAIN_6_DEPTS, IDP_ACTION_PLAN_STATUSES } from '@/lib/constants';
import IDPActionPlanModal from '@/components/IDPActionPlanModal';
import IDPActionPlanPrintModal from '@/components/IDPActionPlanPrintModal';
import { getCurrentThaiFiscalYear, getAvailableFiscalYears, formatDateDDMMYYYYBE } from '@/lib/dateUtils';
import { useModal } from '@/context/ModalContext';

export default function IDPActionPlanPage() {
  const { currentUser, currentPersonnel, isAdmin, isLoading: isAuthLoading, handleGoogleSignIn } = useAuth();
  const { showAlert, showConfirm } = useModal();

  // Fiscal Year
  const [fiscalYear, setFiscalYear] = useState(() => String(getCurrentThaiFiscalYear()));

  // Data states
  const [actionPlans, setActionPlans] = useState([]);
  const [idpRecords, setIdpRecords] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal states
  const [activePlan, setActivePlan] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Selected Personnel for new plan
  const [selectedPersonnelIdForCreate, setSelectedPersonnelIdForCreate] = useState('');

  const isHR = isHrOfficer(currentUser, currentPersonnel, isAdmin);

  // Subscriptions
  useEffect(() => {
    setLoading(true);
    const unsubPlans = subscribeActionPlans(fiscalYear, (data) => {
      setActionPlans(data || []);
      setLoading(false);
    });

    const unsubRecords = subscribeIdpRecords(fiscalYear, (data) => {
      setIdpRecords(data || []);
    });

    const unsubPersonnel = subscribePersonnelList((list) => {
      setPersonnelList(list || []);
    });

    return () => {
      unsubPlans();
      unsubRecords();
      unsubPersonnel();
    };
  }, [fiscalYear]);

  // Exclude executive personnel for staff list
  const staffList = useMemo(() => {
    return personnelList.filter(
      (p) => p.department !== 'คณะผู้บริหาร' && p.position !== 'ผู้บริหาร' && !p.isExecutive && p.status !== 'ลาออก'
    );
  }, [personnelList]);

  // Statistics
  const stats = useMemo(() => {
    const total = actionPlans.length;
    const planned = actionPlans.filter((p) => p.status === 'PLANNED').length;
    const inProgress = actionPlans.filter((p) => p.status === 'IN_PROGRESS').length;
    const evaluated = actionPlans.filter((p) => p.status === 'EVALUATED').length;

    let totalItems = 0;
    let achievedItems = 0;
    actionPlans.forEach((p) => {
      (p.items || []).forEach((it) => {
        totalItems++;
        if (it.evaluation?.status === 'ACHIEVED') achievedItems++;
      });
    });

    // 6 Depts breakdown
    const deptStats = MAIN_6_DEPTS.map((deptName) => {
      const deptPlans = actionPlans.filter((p) => p.department === deptName);
      const deptStaff = staffList.filter((p) => p.department === deptName);
      const totalDeptStaff = deptStaff.length;
      const count = deptPlans.length;
      const evalCount = deptPlans.filter((p) => p.status === 'EVALUATED').length;
      const percent = totalDeptStaff > 0 ? Math.round((count / totalDeptStaff) * 100) : 0;
      return {
        name: deptName,
        plansCount: count,
        totalStaff: totalDeptStaff,
        evalCount,
        percent,
        isAllDone: totalDeptStaff > 0 && count >= totalDeptStaff,
      };
    });

    return {
      total,
      planned,
      inProgress,
      evaluated,
      totalItems,
      achievedItems,
      achievedRate: totalItems > 0 ? Math.round((achievedItems / totalItems) * 100) : 0,
      deptStats,
    };
  }, [actionPlans, staffList]);

  // Filtered action plans
  const filteredPlans = useMemo(() => {
    return actionPlans.filter((p) => {
      const matchSearch =
        !searchTerm ||
        (p.personnelName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.position || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.personnelEmail || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === 'ALL' || p.department === selectedDept;
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [actionPlans, searchTerm, selectedDept, selectedStatus]);

  // Delete Action Plan
  const handleDeletePlan = async (plan) => {
    const confirmed = await showConfirm({
      type: 'danger',
      title: 'ยืนยันการลบแผน IDP Action Plan',
      message: `ต้องการลบแผนพัฒนาบุคลากรของ "${plan.personnelName}" (ปีงบประมาณ ${fiscalYear}) ใช่หรือไม่?`,
      confirmText: 'ลบแผนพัฒนา',
    });
    if (!confirmed) return;

    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'ผู้ดูแลระบบ',
      };
      await deleteActionPlan(plan.id, fiscalYear, actor);
      await showAlert({
        type: 'success',
        title: 'ลบสำเร็จ',
        message: `ลบแผนพัฒนาของ ${plan.personnelName} เรียบร้อยแล้ว`,
      });
    } catch (e) {
      console.error(e);
      await showAlert({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: e.message || 'ไม่สามารถลบแผนได้',
      });
    }
  };

  // Create new plan handler (with automatic import of Gap != 0 from Need Analysis if available)
  const handleCreateNewPlan = async () => {
    if (!selectedPersonnelIdForCreate) {
      await showAlert({
        type: 'warning',
        title: 'กรุณาเลือกบุคลากร',
        message: 'โปรดเลือกบุคลากรที่ต้องการจัดทำแผนพัฒนา IDP Action Plan',
      });
      return;
    }

    const targetPerson = personnelList.find((p) => p.id === selectedPersonnelIdForCreate);
    if (!targetPerson) return;

    // Check if plan already exists for this person in this year
    const existing = actionPlans.find(
      (p) => p.personnelId === targetPerson.id || p.personnelEmail === targetPerson.email
    );
    if (existing) {
      setActivePlan(existing);
      setIsCreateModalOpen(false);
      setIsEditModalOpen(true);
      return;
    }

    // Check Need Analysis record to auto-import competencies with gap !== 0
    const needRecord = idpRecords.find(
      (r) => r.personnelId === targetPerson.id || r.personnelEmail === targetPerson.email
    );

    const gapCompetencies = [];
    if (needRecord) {
      (needRecord.coreCompetencies || []).forEach((c) => {
        if (c.gap !== 0 && c.gap !== undefined) {
          gapCompetencies.push({
            ...c,
            type: 'CORE',
            competencyType: 'CORE',
          });
        }
      });
      (needRecord.functionalCompetencies || []).forEach((f) => {
        if (f.gap !== 0 && f.gap !== undefined) {
          gapCompetencies.push({
            ...f,
            type: 'FUNCTIONAL',
            competencyType: 'FUNCTIONAL',
          });
        }
      });
    }

    const initialItems = createActionPlanItemsFromNeedAnalysis(gapCompetencies);

    const newPlanPayload = {
      id: `action-plan-${fiscalYear}-${targetPerson.id}`,
      fiscalYear: String(fiscalYear),
      personnelId: targetPerson.id,
      personnelName: targetPerson.name,
      personnelEmail: targetPerson.email || '',
      position: targetPerson.position || 'บุคลากร',
      department: targetPerson.department || 'สำนักคอมพิวเตอร์ฯ',
      items: initialItems,
      signatures: {
        acknowledgement: {
          trainee: { name: targetPerson.name, email: targetPerson.email || '', signed: false, signedAt: '' },
          supervisor: { name: '', email: '', signed: false, signedAt: '' },
        },
        evaluation: {
          resultType: 'COMPLETED',
          percent: 100,
          reason: '',
          supervisor: { name: '', email: '', position: 'รองผู้อำนวยการฝ่ายบริหาร', signed: false, signedAt: '' },
          trainee: { name: targetPerson.name, email: targetPerson.email || '', position: targetPerson.position || '', signed: false, signedAt: '' },
        },
      },
      status: IDP_ACTION_PLAN_STATUSES.DRAFT.key,
      createdAt: new Date().toISOString(),
      createdBy: currentPersonnel?.name || currentUser?.displayName || 'ผู้จัดทำแผน',
    };

    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'ผู้จัดทำแผน',
      };
      const saved = await saveActionPlan(newPlanPayload, actor);
      setIsCreateModalOpen(false);
      setActivePlan(saved);
      setIsEditModalOpen(true);
      if (gapCompetencies.length > 0) {
        await showAlert({
          type: 'success',
          title: 'ดึงข้อมูลสำเร็จ',
          message: `ดึงสมรรถนะที่มี Gap จำนวน ${gapCompetencies.length} รายการจาก IDP Need Analysis เข้าสู่แผนพัฒนาเรียบร้อยแล้ว`,
        });
      }
    } catch (e) {
      console.error(e);
      await showAlert({ type: 'error', title: 'เกิดข้อผิดพลาด', message: e.message });
    }
  };

  if (!currentUser && !isAuthLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#EA580C' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.5rem 0' }}>
            กรุณาเข้าสู่ระบบ
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            เข้าสู่ระบบด้วยบัญชี Google KMUTNB เพื่อดูและจัดทำแผนพัฒนาบุคลากรรายบุคคล (IDP Action Plan)
          </p>
          <button type="button" onClick={handleGoogleSignIn} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#EA580C' }}>
            <LogIn size={18} />
            <span>เข้าสู่ระบบด้วย Google KMUTNB</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '4rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          color: '#FFFFFF',
          padding: '2.5rem 1.5rem 3.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#CBD5E1', marginBottom: '1.25rem' }}>
            <Link href="/idp-hub" style={{ color: '#FB923C', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={16} />
              <span>IDP Hub</span>
            </Link>
            <ChevronRight size={14} />
            <span style={{ color: '#FFFFFF', fontWeight: 600 }}>IDP Action Plan</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                }}
              >
                <Target size={28} color="#FFFFFF" />
              </div>
              <div>
                <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
                  แผนพัฒนาบุคลากรรายบุคคล (IDP Action Plan)
                </h1>
                <p style={{ fontSize: '0.9rem', color: '#94A3B8', margin: '4px 0 0 0' }}>
                  จัดทำแผนพัฒนาสมรรถนะที่มี Gap รายงานผลรายไตรมาส (Q1-Q4) และประเมินผลสัมฤทธิ์ปลายปี
                </p>
              </div>
            </div>

            {/* Fiscal Year Selector & Create Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(8px)',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Calendar size={16} color="#FB923C" />
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#CBD5E1' }}>ปีงบประมาณ:</span>
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  style={{
                    background: '#FFFFFF',
                    color: '#1E293B',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {getAvailableFiscalYears().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                }}
              >
                <Plus size={16} />
                <span>สร้างแผนพัฒนา IDP ใหม่</span>
              </button>
            </div>
          </div>

          {/* Quick Stat Counters */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', borderRadius: '14px', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div style={{ fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={15} color="#FB923C" />
                <span>แผนพัฒนาทั้งหมด</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: '#FFFFFF' }}>
                {stats.total} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>ฉบับ</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', borderRadius: '14px', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div style={{ fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="#FBBF24" />
                <span>อยู่ระหว่างดำเนินการ</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: '#FEF08A' }}>
                {stats.inProgress + stats.planned} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>ฉบับ</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', borderRadius: '14px', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div style={{ fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} color="#86EFAC" />
                <span>ประเมินผลแล้ว</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: '#86EFAC' }}>
                {stats.evaluated} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>ฉบับ</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)', borderRadius: '14px', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div style={{ fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={15} color="#38BDF8" />
                <span>ตัวชี้วัดที่บรรลุแล้ว</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: '#BAE6FD' }}>
                {stats.achievedItems} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>/ {stats.totalItems} ข้อ ({stats.achievedRate}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '-1.5rem auto 0', padding: '0 1.5rem', position: 'relative', zIndex: 2 }}>
        {/* Filter Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '1rem',
            padding: '1.25rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อบุคลากร, ตำแหน่ง, ฝ่าย..."
              className="form-control"
              style={{ paddingLeft: '38px', borderRadius: '10px', fontSize: '0.875rem' }}
            />
          </div>

          {/* Dept & Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="form-control"
              style={{ borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem 0.85rem' }}
            >
              <option value="ALL">ทุกฝ่าย (6 ฝ่าย)</option>
              {MAIN_6_DEPTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-control"
              style={{ borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, padding: '0.5rem 0.85rem' }}
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="DRAFT">ฉบับร่าง</option>
              <option value="PLANNED">รับทราบแผนแล้ว</option>
              <option value="IN_PROGRESS">อยู่ระหว่างดำเนินการ</option>
              <option value="EVALUATED">ประเมินผลแล้ว</option>
            </select>
          </div>
        </div>

        {/* Plans Table / Cards */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            กำลังโหลดข้อมูลแผนพัฒนา IDP Action Plan...
          </div>
        ) : filteredPlans.length === 0 ? (
          <div
            style={{
              padding: '4rem 1.5rem',
              textAlign: 'center',
              background: '#FFFFFF',
              borderRadius: '1rem',
              border: '1.5px dashed #CBD5E1',
            }}
          >
            <Target size={48} color="#94A3B8" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.5rem 0' }}>
              ไม่พบข้อมูลแผนพัฒนา IDP Action Plan ในปีงบประมาณ {fiscalYear}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
              สามารถกดปุ่มสร้างแผนพัฒนาใหม่ เพื่อดึงสมรรถนะที่มี Gap จาก IDP Need Analysis เข้ามาสร้างแผนได้ทันที
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '10px',
                background: '#EA580C',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={16} />
              <span>สร้างแผนพัฒนา IDP ใหม่</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredPlans.map((plan, idx) => {
              const itemsCount = (plan.items || []).length;
              const achievedCount = (plan.items || []).filter((it) => it.evaluation?.status === 'ACHIEVED').length;
              const statusMeta = IDP_ACTION_PLAN_STATUSES[plan.status] || IDP_ACTION_PLAN_STATUSES.DRAFT;

              const isOwner =
                (currentUser?.email || '').trim().toLowerCase() === (plan.personnelEmail || '').trim().toLowerCase();

              return (
                <div
                  key={plan.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '1rem',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 340px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#FFF7ED',
                        color: '#EA580C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                          {plan.personnelName}
                        </span>
                        {isOwner && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: '#FDF4FF',
                              color: '#A21CAF',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              border: '1px solid #F5D0FE',
                            }}
                          >
                            แผนของฉัน
                          </span>
                        )}
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: statusMeta.bg,
                            color: statusMeta.color,
                            fontSize: '0.725rem',
                            fontWeight: 700,
                          }}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '3px 0 0 0' }}>
                        {plan.position || 'บุคลากร'} • ฝ่าย{plan.department || 'สำนักคอมพิวเตอร์ฯ'}
                      </p>
                    </div>
                  </div>

                  {/* Indicators / Progress summary */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>จำนวนสมรรถนะ</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                        {itemsCount} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>รายการ</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>ผลสัมฤทธิ์</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: achievedCount > 0 ? '#16A34A' : '#64748B' }}>
                        {achievedCount} / {itemsCount} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>บรรลุ</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>การลงนาม</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: plan.signatures?.acknowledgement?.supervisor?.signed ? '#16A34A' : '#EA580C' }}>
                        {plan.signatures?.acknowledgement?.supervisor?.signed ? '✓ รับทราบแล้ว' : '⏳ รอลงนาม'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePlan(plan);
                        setIsEditModalOpen(true);
                      }}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '8px',
                        background: '#EA580C',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit3 size={15} />
                      <span>ดู/แก้ไขแผน</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActivePlan(plan);
                        setIsPrintModalOpen(true);
                      }}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '8px',
                        background: '#F1F5F9',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="พิมพ์แบบฟอร์ม"
                    >
                      <Printer size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => exportActionPlanToExcel(plan, fiscalYear)}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '8px',
                        background: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="ส่งออก Excel"
                    >
                      <FileSpreadsheet size={15} />
                    </button>

                    {(isAdmin || isHR) && (
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan)}
                        style={{
                          padding: '0.45rem 0.75rem',
                          borderRadius: '8px',
                          background: '#FEE2E2',
                          color: '#DC2626',
                          border: '1px solid #FECDD3',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="ลบแผนพัฒนา"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Edit & Manage Action Plan */}
      <IDPActionPlanModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        plan={activePlan}
        fiscalYear={fiscalYear}
        currentUser={currentUser}
        currentPersonnel={currentPersonnel}
        personnelList={personnelList}
        isAdmin={isAdmin}
        onSaved={(updated) => {
          setActivePlan(updated);
        }}
        onOpenPrint={(planToPrint) => {
          setActivePlan(planToPrint);
          setIsPrintModalOpen(true);
        }}
      />

      {/* Modal 2: Official Form Print & PDF */}
      <IDPActionPlanPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        plan={activePlan}
        fiscalYear={fiscalYear}
      />

      {/* Modal 3: Create Plan for Personnel */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1.25rem',
              maxWidth: '540px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#FFF7ED',
                    color: '#EA580C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                    สร้างแผนพัฒนา IDP Action Plan
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
                    ปีงบประมาณ พ.ศ. {fiscalYear}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                เลือกบุคลากรผู้จัดทำแผน:
              </label>
              <select
                value={selectedPersonnelIdForCreate}
                onChange={(e) => setSelectedPersonnelIdForCreate(e.target.value)}
                className="form-control"
                style={{ width: '100%', borderRadius: '10px', padding: '0.6rem 0.85rem', fontSize: '0.9rem' }}
              >
                <option value="">-- กรุณาเลือกบุคลากร --</option>
                {staffList.map((p) => {
                  const hasPlan = actionPlans.some(
                    (plan) => plan.personnelId === p.id || plan.personnelEmail === p.email
                  );
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.position || 'บุคลากร'} • {p.department || 'สำนักคอมพิวเตอร์ฯ'}) {hasPlan ? '• มีแผนแล้ว' : ''}
                    </option>
                  );
                })}
              </select>
              <p style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '6px' }}>
                💡 ระบบจะดึงสมรรถนะที่มี Gap ≠ 0 จาก IDP Need Analysis ของบุคลากรคนดังกล่าวเข้ามาในแผนให้อัตโนมัติ
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCreateNewPlan}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', background: '#EA580C', border: 'none', fontWeight: 700 }}
              >
                สร้างแผนพัฒนา
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
