'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  ArrowRight,
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
  exportAllActionPlansToExcel,
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

function IDPActionPlanContent() {
  const { currentUser, currentPersonnel, isAdmin, isLoading: isAuthLoading, handleGoogleSignIn } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const searchParams = useSearchParams();
  const yearFromUrl = searchParams.get('year') || searchParams.get('fiscalYear');

  // Fiscal Year
  const [fiscalYear, setFiscalYear] = useState(() => {
    return yearFromUrl ? String(yearFromUrl) : String(getCurrentThaiFiscalYear());
  });

  // Sync with URL query param
  useEffect(() => {
    if (yearFromUrl && yearFromUrl !== fiscalYear) {
      setFiscalYear(String(yearFromUrl));
    }
  }, [yearFromUrl]);

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

            {/* Fiscal Year Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <Calendar size={16} color="#FB923C" />
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#E2E8F0' }}>ปีงบประมาณ:</span>
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  style={{
                    background: '#FFFFFF',
                    color: '#0F172A',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {getAvailableFiscalYears().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
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
            borderRadius: '1.25rem',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: '1px solid #E2E8F0',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          {/* Enhanced Search Box */}
          <div style={{ position: 'relative', flex: '1 1 320px', minWidth: '260px' }}>
            <div
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อบุคลากร, ตำแหน่ง, หรือฝ่ายงาน..."
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.6rem',
                borderRadius: '12px',
                border: '1.5px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: '0.875rem',
                color: '#1E293B',
                fontWeight: 500,
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#EA580C';
                e.target.style.background = '#FFFFFF';
                e.target.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E2E8F0';
                e.target.style.background = '#F8FAFC';
                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)';
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#E2E8F0',
                  border: 'none',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                  fontSize: '11px',
                  padding: 0,
                }}
                title="ล้างคำค้นหา"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dept & Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                borderRadius: '12px',
                border: '1.5px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#334155',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.65rem 1rem',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
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
              style={{
                borderRadius: '12px',
                border: '1.5px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#334155',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.65rem 1rem',
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="DRAFT">ฉบับร่าง</option>
              <option value="PLANNED">รับทราบแผนแล้ว</option>
              <option value="IN_PROGRESS">อยู่ระหว่างดำเนินการ</option>
              <option value="EVALUATED">ประเมินผลแล้ว</option>
            </select>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  const targetPlans = filteredPlans.length > 0 ? filteredPlans : actionPlans;
                  if (targetPlans.length === 0) {
                    showAlert({
                      type: 'info',
                      title: 'ไม่พบข้อมูลแผนพัฒนา',
                      message: 'ไม่มีข้อมูลแผนพัฒนา IDP Action Plan สำหรับส่งออกในขณะนี้',
                    });
                    return;
                  }
                  exportAllActionPlansToExcel(targetPlans, fiscalYear);
                }}
                disabled={actionPlans.length === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: actionPlans.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: actionPlans.length === 0 ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                title="ส่งออกแผนพัฒนาบุคลากรทุกคนเป็นไฟล์ Excel รวม (แยก 1 Sheet ต่อ 1 คน) - สำหรับผู้ดูแลระบบ"
              >
                <FileSpreadsheet size={16} />
                <span>ส่งออก Excel รวม</span>
                {actionPlans.length > 0 && (
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.25)',
                      padding: '1px 7px',
                      borderRadius: '999px',
                      fontSize: '0.725rem',
                      fontWeight: 800,
                    }}
                  >
                    {filteredPlans.length}
                  </span>
                )}
              </button>
            )}
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
              borderRadius: '1.25rem',
              border: '1.5px dashed #CBD5E1',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: '#FFF7ED',
                color: '#EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <Target size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.5rem 0' }}>
              ไม่พบข้อมูลแผนพัฒนา IDP Action Plan ในปีงบประมาณ {fiscalYear}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748B', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              แผนพัฒนา IDP Action Plan จะถูกสร้างขึ้นโดยอัตโนมัติจาก <strong>แบบวิเคราะห์ความต้องการจำเป็น (IDP Need Analysis)</strong> เมื่อหัวหน้าฝ่ายหรือรองผู้อำนวยการทำการเลือกสมรรถนะที่มี Gap
            </p>
            <Link
              href={`/idp-hub/need-analysis?year=${fiscalYear}`}
              style={{
                padding: '0.65rem 1.35rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
              }}
            >
              <Layers size={16} />
              <span>ไปยังแบบวิเคราะห์ IDP Need Analysis</span>
              <ArrowRight size={16} />
            </Link>
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
    </div>
  );
}

export default function IDPActionPlanPage() {
  return (
    <React.Suspense
      fallback={
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
          กำลังโหลดแผนพัฒนาบุคลากรรายบุคคล (IDP Action Plan)...
        </div>
      }
    >
      <IDPActionPlanContent />
    </React.Suspense>
  );
}
