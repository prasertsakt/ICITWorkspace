'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import {
  subscribeTqaOfiItems,
  deleteTqaOfiItem,
  saveTqaOfiItem,
  subscribeTqaReportConfig,
  canEditTqaOfiProgress,
  isTqaOfiTracked,
  normalizeTqaRounds,
  normalizeActionReportHtml,
} from '@/lib/tqaOfiService';
import { subscribePersonnelList } from '@/lib/storageService';
import { getCurrentThaiFiscalYear, getAvailableFiscalYears } from '@/lib/dateUtils';
import { TQA_CATEGORIES, TQA_STATUS_CONFIG } from '@/lib/tqaSeedData';
import TqaReportUrlModal from '@/components/TqaReportUrlModal';
import TqaOfiActionModal from '@/components/TqaOfiActionModal';
import TqaOfiFormModal from '@/components/TqaOfiFormModal';
import TqaOfiImportModal from '@/components/TqaOfiImportModal';

import {
  Target,
  Sparkles,
  ArrowLeft,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Download,
  FileText,
  Edit3,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Users,
  Building,
  ChevronRight,
  Shield,
  ShieldCheck,
  Lock,
  LogIn,
  Check,
  X,
  Plus,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Layers,
  BarChart3,
  Link2,
  Copy,
  BookOpen,
  Award,
  Pause,
  Play,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function TqaOfiTrackingPage() {
  const { currentUser, currentPersonnel, isAdmin, isLoading: authLoading, handleGoogleSignIn } = useAuth();
  const { showAlert } = useModal();

  // Fiscal Year State (Dynamic list including past and future years)
  const [fiscalYear, setFiscalYear] = useState(() => String(getCurrentThaiFiscalYear()));
  const availableFiscalYears = useMemo(() => getAvailableFiscalYears(2568, 1, true), []);

  // Data States
  const [ofiItems, setOfiItems] = useState([]);
  const [reportConfig, setReportConfig] = useState(null);
  const [personnelList, setPersonnelList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('TRACKED'); // 'TRACKED' (ดำเนินการ) | 'NOT_TRACKED' (ยังไม่ดำเนินการ) | 'ALL' (ทั้งหมด)
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'MY_ASSIGNED'
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Modals
  const [isReportUrlModalOpen, setIsReportUrlModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOfi, setEditingOfi] = useState(null);
  const [actionModalOfi, setActionModalOfi] = useState(null);
  const [actionModalRound, setActionModalRound] = useState('round1');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deletingOfi, setDeletingOfi] = useState(null);
  const [trackingConfirmState, setTrackingConfirmState] = useState(null); // { item, nextTracked, isSaving }

  // 1. Subscribe to OFI Items for the chosen fiscal year
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeTqaOfiItems(fiscalYear, (data) => {
      setOfiItems(data);
      setLoading(false);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [fiscalYear]);

  // 2. Subscribe to Report URL for the chosen fiscal year
  useEffect(() => {
    const unsubscribe = subscribeTqaReportConfig(fiscalYear, (cfg) => {
      setReportConfig(cfg);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [fiscalYear]);

  // 3. Subscribe to Personnel List
  useEffect(() => {
    const unsubscribe = subscribePersonnelList((data) => {
      setPersonnelList(data || []);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Dashboard calculations for 3-round tracking architecture
  const stats = useMemo(() => {
    const totalAll = ofiItems.length;
    const trackedItems = ofiItems.filter((i) => isTqaOfiTracked(i));
    const untrackedItems = ofiItems.filter((i) => !isTqaOfiTracked(i));
    const total = trackedItems.length;
    const completed = trackedItems.filter((i) => i.status === 'COMPLETED').length;
    const inProgress = trackedItems.filter((i) => i.status === 'IN_PROGRESS').length;
    const pending = trackedItems.filter((i) => i.status === 'PENDING' || !i.status).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Per-round calculations (based on active tracked items)
    const round1Items = trackedItems.map((i) => normalizeTqaRounds(i).round1);
    const round2Items = trackedItems.map((i) => normalizeTqaRounds(i).round2);
    const round3Items = trackedItems.map((i) => normalizeTqaRounds(i).round3);

    const calcRoundStats = (roundList) => {
      const reported = roundList.filter((r) => !!(r?.actionReport && r.actionReport.replace(/<[^>]*>/g, '').trim())).length;
      const comp = roundList.filter((r) => r?.status === 'COMPLETED').length;
      const inProg = roundList.filter((r) => r?.status === 'IN_PROGRESS').length;
      const pend = roundList.filter((r) => r?.status === 'PENDING' || !r?.status).length;
      const reportedPct = total > 0 ? Math.round((reported / total) * 100) : 0;
      const compPct = total > 0 ? Math.round((comp / total) * 100) : 0;
      return { reported, reportedPct, completed: comp, inProgress: inProg, pending: pend, completedPct: compPct };
    };

    const round1 = calcRoundStats(round1Items);
    const round2 = calcRoundStats(round2Items);
    const round3 = calcRoundStats(round3Items);

    const totalReportsRequired = total * 3;
    const totalReportsSubmitted = round1.reported + round2.reported + round3.reported;
    const overallFulfillmentPct = totalReportsRequired > 0 ? Math.round((totalReportsSubmitted / totalReportsRequired) * 100) : 0;

    // By category counts (based on tracked items)
    const byCategory = {};
    TQA_CATEGORIES.forEach((c) => {
      byCategory[c.name] = trackedItems.filter((i) => i.category === c.name || i.categoryNum === c.num).length;
    });

    return {
      totalAll,
      total,
      untrackedCount: untrackedItems.length,
      completed,
      inProgress,
      pending,
      percentage,
      round1,
      round2,
      round3,
      totalReportsRequired,
      totalReportsSubmitted,
      overallFulfillmentPct,
      byCategory,
    };
  }, [ofiItems]);

  // Filtered OFIs with 3-round and tracking scope support
  const filteredOfiItems = useMemo(() => {
    return ofiItems.filter((item) => {
      const isTracked = isTqaOfiTracked(item);

      // 0. Scope Filter ("ดำเนินการ" vs "ยังไม่ดำเนินการ")
      if (scopeFilter === 'TRACKED' && !isTracked) return false;
      if (scopeFilter === 'NOT_TRACKED' && isTracked) return false;

      const itemRounds = normalizeTqaRounds(item);

      // 1. Category Filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory && String(item.categoryNum) !== selectedCategory) {
        return false;
      }

      // 2. Status & Round Filter
      if (selectedStatus === 'MY_ASSIGNED') {
        const userEmail = (currentUser?.email || currentPersonnel?.email || '').trim().toLowerCase();
        const userId = currentPersonnel?.id || '';
        const isAssigned = Array.isArray(item.assignedPersons) && item.assignedPersons.some((p) => {
          return (userEmail && p.email && userEmail === p.email.toLowerCase()) || (userId && p.id && userId === p.id);
        });
        if (!isAssigned) return false;
      } else if (selectedStatus === 'ROUND1_UNREPORTED') {
        if (itemRounds.round1?.actionReport) return false;
      } else if (selectedStatus === 'ROUND2_UNREPORTED') {
        if (itemRounds.round2?.actionReport) return false;
      } else if (selectedStatus === 'ROUND3_UNREPORTED') {
        if (itemRounds.round3?.actionReport) return false;
      } else if (selectedStatus === 'ALL_ROUNDS_REPORTED') {
        if (!itemRounds.round1?.actionReport || !itemRounds.round2?.actionReport || !itemRounds.round3?.actionReport) {
          return false;
        }
      } else if (selectedStatus !== 'ALL') {
        const itemStat = item.status || 'PENDING';
        if (itemStat !== selectedStatus) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const refMatch = (item.itemRef || '').toLowerCase().includes(q);
        const findingMatch = (item.finding || '').toLowerCase().includes(q);
        const evidenceMatch = (item.evidence || '').toLowerCase().includes(q);
        const impactMatch = (item.potentialImpact || '').toLowerCase().includes(q);
        const assignedMatch = Array.isArray(item.assignedPersons) && item.assignedPersons.some((p) => (p.name || '').toLowerCase().includes(q));
        if (!refMatch && !findingMatch && !evidenceMatch && !impactMatch && !assignedMatch) {
          return false;
        }
      }

      return true;
    });
  }, [ofiItems, scopeFilter, selectedCategory, selectedStatus, searchQuery, currentUser, currentPersonnel]);

  // Open custom modal for toggling tracking execution status (ดำเนินการ <-> ยังไม่ดำเนินการ)
  const handleToggleTracking = (item) => {
    const canEdit = canEditTqaOfiProgress(item, currentUser, currentPersonnel, isAdmin);
    if (!canEdit) {
      showAlert({
        type: 'warning',
        title: 'ไม่มีสิทธิ์ดำเนินการ',
        message: 'คุณไม่มีสิทธิ์เปลี่ยนสถานะการติดตามของข้อเสนอแนะนี้ (ต้องเป็น Admin หรือผู้รายงานผลที่ได้รับมอบหมาย)',
      });
      return;
    }

    const currentTracked = isTqaOfiTracked(item);
    const nextTracked = !currentTracked;
    setTrackingConfirmState({
      item,
      nextTracked,
      isSaving: false,
    });
  };

  // Execute toggle tracking after modal confirmation
  const handleExecuteToggleTracking = async () => {
    if (!trackingConfirmState || !trackingConfirmState.item) return;
    const { item, nextTracked } = trackingConfirmState;

    setTrackingConfirmState((prev) => ({ ...prev, isSaving: true }));
    try {
      const updatedByName = currentPersonnel?.name || currentUser?.displayName || currentUser?.email || 'Admin';
      await saveTqaOfiItem(
        {
          ...item,
          isTracking: nextTracked,
          executionStatus: nextTracked ? 'TRACKED' : 'NOT_TRACKED',
          lastReportedAt: new Date().toISOString(),
          lastReportedBy: updatedByName,
        },
        fiscalYear,
        updatedByName
      );
      setTrackingConfirmState(null);
    } catch (e) {
      showAlert({
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: e.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะการติดตาม',
      });
      setTrackingConfirmState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deletingOfi) return;
    try {
      await deleteTqaOfiItem(deletingOfi.id, fiscalYear);
      setDeletingOfi(null);
    } catch (e) {
      showAlert({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการลบรายการ',
        message: e.message || 'เกิดข้อผิดพลาดในการลบรายการ',
      });
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6D28D9', fontWeight: 600 }}>กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '450px', textAlign: 'center', background: '#FFFFFF', padding: '2rem', borderRadius: '1rem', border: '1px solid #E2E8F0' }}>
          <Lock size={40} color="#7C3AED" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>เข้าสู่ระบบเพื่อเข้าถึง TQA OFI Tracking</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0.5rem 0 1.5rem' }}>
            กรุณาเข้าสู่ระบบด้วย Google Account ของมหาวิทยาลัย
          </p>
          <button type="button" onClick={handleGoogleSignIn} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#6D28D9', borderColor: '#6D28D9' }}>
            <LogIn size={16} /> เข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '5rem' }}>
      {/* Top Header Navigation */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3B0764 0%, #581C87 50%, #6D28D9 100%)',
          color: '#FFFFFF',
          padding: '2rem 1.5rem 3rem',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                href="/tqa"
                style={{
                  color: '#DDD6FE',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={16} /> กลับสู่ TQA Hub
              </Link>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>/</span>
              <span style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 700 }}>OFI Tracking</span>
            </div>

            {/* Fiscal Year Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: '10px' }}>
              <Calendar size={16} color="#FDE047" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#DDD6FE' }}>ปีงบประมาณ:</span>
              <select
                className="form-input"
                style={{
                  width: 'auto',
                  padding: '4px 8px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                }}
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
              >
                {availableFiscalYears.map((fy) => (
                  <option key={fy} value={fy} style={{ color: '#0F172A', background: '#FFFFFF' }}>
                    {fy}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.15rem)', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
                TQA OFI Tracking (ระบบติดตามข้อเสนอแนะเพื่อการปรับปรุง)
              </h1>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#DDD6FE', maxWidth: '800px', lineHeight: 1.5 }}>
                ติดตามความก้าวหน้าการปรับปรุงกระบวนการและผลลัพธ์ตามเกณฑ์รางวัลคุณภาพแห่งชาติ (TQA) ประจำปีงบประมาณ {fiscalYear}
              </p>
            </div>

            {/* Report Link & Admin Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {reportConfig?.reportUrl && (
                <a
                  href={reportConfig.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backdropFilter: 'blur(6px)',
                    maxWidth: '480px',
                  }}
                  title={reportConfig.reportTitle || `Feedback Report (${fiscalYear})`}
                >
                  <BookOpen size={16} color="#FDE047" style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {reportConfig.reportTitle || `Feedback Report (${fiscalYear})`}
                  </span>
                  <ExternalLink size={14} style={{ flexShrink: 0 }} />
                </a>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsReportUrlModalOpen(true)}
                  className="btn btn-secondary"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  <Link2 size={16} />
                  <span>ตั้งค่าลิงก์รายงาน ({fiscalYear})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ maxWidth: '1360px', margin: '-1.5rem auto 0', padding: '0 1.5rem', position: 'relative', zIndex: 3 }}>
        {/* 3-Round Tracking Architecture Dashboard */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Card 1: Total OFIs */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>OFI ที่ติดตามดำเนินการ (ปี {fiscalYear})</span>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FAF5FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={18} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginTop: '6px', letterSpacing: '-0.02em' }}>
                {stats.total} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>/ {stats.totalAll} ข้อ</span>
              </div>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', fontSize: '0.75rem' }}>
              <span style={{ color: '#059669', fontWeight: 700 }}>🟢 เสร็จสิ้น {stats.completed} ข้อ</span>
              {stats.untrackedCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setScopeFilter(scopeFilter === 'NOT_TRACKED' ? 'TRACKED' : 'NOT_TRACKED')}
                  style={{
                    border: 'none',
                    background: scopeFilter === 'NOT_TRACKED' ? '#FEF3C7' : '#F8FAFC',
                    color: '#B45309',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid #FDE68A',
                  }}
                  title="คลิกเพื่อสลับดูรายการที่ยังไม่ดำเนินการ"
                >
                  <Pause size={10} color="#D97706" />
                  <span>ยังไม่ทำ {stats.untrackedCount} ข้อ</span>
                </button>
              ) : (
                <span style={{ color: '#6D28D9', fontWeight: 700 }}>ปิดแล้ว {stats.percentage}%</span>
              )}
            </div>
          </div>

          {/* Card 2: Round 1 Progress */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              borderTop: '3px solid #10B981',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>1</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>ติดตามรอบที่ 1</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '999px' }}>
                  {stats.round1.reportedPct}% รายงานแล้ว
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                {stats.round1.reported} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>/ {stats.total} ข้อ</span>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${stats.round1.reportedPct}%`, height: '100%', background: '#10B981', borderRadius: '999px', transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                <span style={{ color: '#059669', fontWeight: 600 }}>เสร็จ {stats.round1.completed}</span>
                <span style={{ color: '#2563EB', fontWeight: 600 }}>ทำอยู่ {stats.round1.inProgress}</span>
                <span style={{ color: '#D97706', fontWeight: 600 }}>รอ {stats.round1.pending}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Round 2 Progress */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              borderTop: '3px solid #3B82F6',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>2</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>ติดตามรอบที่ 2</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '999px' }}>
                  {stats.round2.reportedPct}% รายงานแล้ว
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563EB', marginTop: '6px' }}>
                {stats.round2.reported} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>/ {stats.total} ข้อ</span>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${stats.round2.reportedPct}%`, height: '100%', background: '#3B82F6', borderRadius: '999px', transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                <span style={{ color: '#059669', fontWeight: 600 }}>เสร็จ {stats.round2.completed}</span>
                <span style={{ color: '#2563EB', fontWeight: 600 }}>ทำอยู่ {stats.round2.inProgress}</span>
                <span style={{ color: '#D97706', fontWeight: 600 }}>รอ {stats.round2.pending}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Round 3 Progress */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              borderTop: '3px solid #8B5CF6',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#FAF5FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800 }}>3</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>ติดตามรอบที่ 3</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED', background: '#FAF5FF', padding: '2px 8px', borderRadius: '999px' }}>
                  {stats.round3.reportedPct}% รายงานแล้ว
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7C3AED', marginTop: '6px' }}>
                {stats.round3.reported} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>/ {stats.total} ข้อ</span>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${stats.round3.reportedPct}%`, height: '100%', background: '#8B5CF6', borderRadius: '999px', transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B' }}>
                <span style={{ color: '#059669', fontWeight: 600 }}>เสร็จ {stats.round3.completed}</span>
                <span style={{ color: '#2563EB', fontWeight: 600 }}>ทำอยู่ {stats.round3.inProgress}</span>
                <span style={{ color: '#D97706', fontWeight: 600 }}>รอ {stats.round3.pending}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Round Pipeline Summary Banner */}
        {stats.total > 0 && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.15rem 1.35rem',
              border: '1px solid #E2E8F0',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#EDE9FE', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={16} />
                </div>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                    ความก้าวหน้าการรายงานผลรวมทั้ง 3 รอบ (3 Tracking Rounds Fulfillment)
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    บันทึกผลแล้ว {stats.totalReportsSubmitted} จากเป้าหมาย {stats.totalReportsRequired} รายงาน ({stats.overallFulfillmentPct}%)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                  อัตราปิดข้อค้นพบสำเร็จ: <strong style={{ color: '#059669' }}>{stats.completed}/{stats.total} ({stats.percentage}%)</strong>
                </div>
              </div>
            </div>

            {/* 3 Phase Segmented Progress Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', paddingTop: '6px' }}>
              {[
                { round: 1, label: 'รอบที่ 1', color: '#10B981', bg: '#ECFDF5', data: stats.round1 },
                { round: 2, label: 'รอบที่ 2', color: '#3B82F6', bg: '#EFF6FF', data: stats.round2 },
                { round: 3, label: 'รอบที่ 3', color: '#8B5CF6', bg: '#FAF5FF', data: stats.round3 },
              ].map((ph) => (
                <div key={ph.round} style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 800, color: ph.color }}>{ph.label}</span>
                    <span style={{ fontWeight: 700, color: '#334155' }}>
                      {ph.data.reported}/{stats.total} ข้อ ({ph.data.reportedPct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${ph.data.reportedPct}%`, height: '100%', background: ph.color, borderRadius: '999px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar & Filters */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Top Row: Search & Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                <Search
                  size={18}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px', borderRadius: '10px' }}
                  placeholder="ค้นหาตาม Item Ref, ข้อค้นพบ, ผู้รายงาน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Admin Buttons */}
            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="btn btn-secondary"
                  style={{ gap: '6px', fontSize: '0.85rem' }}
                  title="นำเข้าชุดข้อมูลมาตรฐานจาก PDF หรือคัดลอกจากปีก่อนหน้า"
                >
                  <Download size={15} />
                  <span>นำเข้าข้อมูล / คัดลอก</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingOfi(null);
                    setIsFormModalOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                    borderColor: '#6D28D9',
                    gap: '6px',
                    fontSize: '0.85rem',
                  }}
                >
                  <Plus size={16} />
                  <span>เพิ่ม OFI ใหม่</span>
                </button>
              </div>
            )}
          </div>

          {/* Tracking Scope Filter Tabs (ดำเนินการ vs ยังไม่ดำเนินการ vs ทั้งหมด) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              paddingBottom: '10px',
              borderBottom: '1px solid #F1F5F9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <SlidersHorizontal size={15} color="#6D28D9" />
                <span>ขอบเขตการติดตาม:</span>
              </span>

              <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setScopeFilter('TRACKED')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: scopeFilter === 'TRACKED' ? 800 : 600,
                    background: scopeFilter === 'TRACKED' ? '#FFFFFF' : 'transparent',
                    color: scopeFilter === 'TRACKED' ? '#059669' : '#64748B',
                    boxShadow: scopeFilter === 'TRACKED' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="แสดงเฉพาะข้อเสนอแนะที่อยู่ในแผนดำเนินการ (ติดตามผล 3 รอบ)"
                >
                  <CheckCircle2 size={14} color={scopeFilter === 'TRACKED' ? '#059669' : '#94A3B8'} />
                  <span>ดำเนินการ ({stats.total})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScopeFilter('NOT_TRACKED')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: scopeFilter === 'NOT_TRACKED' ? 800 : 600,
                    background: scopeFilter === 'NOT_TRACKED' ? '#FFFFFF' : 'transparent',
                    color: scopeFilter === 'NOT_TRACKED' ? '#D97706' : '#64748B',
                    boxShadow: scopeFilter === 'NOT_TRACKED' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="แสดงรายการที่ยังไม่ดำเนินการ (ซ่อนจากการติดตามปกติ และไม่ต้องรายงานผล)"
                >
                  <Pause size={14} color={scopeFilter === 'NOT_TRACKED' ? '#D97706' : '#94A3B8'} />
                  <span>ยังไม่ดำเนินการ ({stats.untrackedCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScopeFilter('ALL')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: scopeFilter === 'ALL' ? 800 : 600,
                    background: scopeFilter === 'ALL' ? '#FFFFFF' : 'transparent',
                    color: scopeFilter === 'ALL' ? '#6D28D9' : '#64748B',
                    boxShadow: scopeFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="แสดงทุกรายการรวมทั้งที่ดำเนินการและยังไม่ดำเนินการ"
                >
                  <Layers size={14} color={scopeFilter === 'ALL' ? '#6D28D9' : '#94A3B8'} />
                  <span>ทั้งหมด ({stats.totalAll})</span>
                </button>
              </div>
            </div>

            {scopeFilter === 'NOT_TRACKED' && (
              <span style={{ fontSize: '0.78rem', color: '#B45309', background: '#FEF3C7', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Pause size={12} />
                <span>มุมมองรายการ &ldquo;ยังไม่ดำเนินการ&rdquo; — ผู้รายงานผลไม่ต้องบันทึกผลการดำเนินงาน</span>
              </span>
            )}
          </div>

          {/* Category Chips Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: selectedCategory === 'ALL' ? '1px solid #7C3AED' : '1px solid #E2E8F0',
                background: selectedCategory === 'ALL' ? '#EDE9FE' : '#FFFFFF',
                color: selectedCategory === 'ALL' ? '#6D28D9' : '#64748B',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              ทุกหมวด ({scopeFilter === 'ALL' ? stats.totalAll : scopeFilter === 'NOT_TRACKED' ? stats.untrackedCount : stats.total})
            </button>

            {TQA_CATEGORIES.map((cat) => {
              const count = stats.byCategory[cat.name] || 0;
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: isSelected ? `1px solid ${cat.color}` : '1px solid #E2E8F0',
                    background: isSelected ? `${cat.color}15` : '#FFFFFF',
                    color: isSelected ? cat.color : '#64748B',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.shortName} ({count})
                </button>
              );
            })}
          </div>

          {/* Quick Status & 3-Round Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>ตัวกรองสถานะ & รอบ:</span>
            {[
              { id: 'ALL', label: 'ทั้งหมด' },
              { id: 'MY_ASSIGNED', label: '👤 ที่ฉันรับผิดชอบ' },
              { id: 'COMPLETED', label: '🟢 เสร็จสิ้นภาพรวม' },
              { id: 'IN_PROGRESS', label: '🔵 กำลังดำเนินการ' },
              { id: 'PENDING', label: '🟡 รอดำเนินการ' },
              { id: 'ROUND1_UNREPORTED', label: '⏳ ค้างรายงานรอบ 1' },
              { id: 'ROUND2_UNREPORTED', label: '⏳ ค้างรายงานรอบ 2' },
              { id: 'ROUND3_UNREPORTED', label: '⏳ ค้างรายงานรอบ 3' },
              { id: 'ALL_ROUNDS_REPORTED', label: '✅ รายงานครบ 3 รอบ' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: selectedStatus === st.id ? 800 : 500,
                  background: selectedStatus === st.id ? '#1E293B' : '#F1F5F9',
                  color: selectedStatus === st.id ? '#FFFFFF' : '#475569',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* OFI Items List / Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6D28D9', fontWeight: 600 }}>
            กำลังโหลดข้อมูลข้อเสนอแนะ...
          </div>
        ) : filteredOfiItems.length === 0 ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '1.25rem',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              border: '1px dashed #CBD5E1',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: '#FAF5FF',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <Target size={30} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
              ยังไม่มีรายการ OFI สำหรับปีงบประมาณ {fiscalYear}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748B', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              {String(fiscalYear) === '2568'
                ? 'คลิกปุ่มด้านล่างเพื่อนำเข้าชุดข้อมูลข้อเสนอแนะจากเล่ม Feedback Report 2568'
                : 'สำหรับปีงบประมาณนี้ ยังไม่มีการเพิ่มข้อมูลข้อเสนอแนะ ท่านสามารถเพิ่มใหม่ หรือนำเข้าข้อมูลได้'}
            </p>

            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="btn btn-secondary"
                  style={{ gap: '6px', fontWeight: 700 }}
                >
                  <Download size={16} /> นำเข้าข้อมูล / คัดลอก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingOfi(null);
                    setIsFormModalOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                    borderColor: '#6D28D9',
                    gap: '6px',
                    fontWeight: 700,
                  }}
                >
                  <Plus size={16} /> เพิ่มข้อเสนอแนะใหม่
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredOfiItems.map((item, idx) => {
              const isExpanded = expandedRowId === item.id;
              const canEdit = canEditTqaOfiProgress(item, currentUser, currentPersonnel, isAdmin);
              const isTracked = isTqaOfiTracked(item);
              const itemRounds = normalizeTqaRounds(item);
              const statusCfg = TQA_STATUS_CONFIG[item.status || 'PENDING'] || TQA_STATUS_CONFIG.PENDING;
              const catObj = TQA_CATEGORIES.find((c) => c.name === item.category || c.num === item.categoryNum) || TQA_CATEGORIES[0];

              // Count completed and reported rounds
              const reportedRoundsCount = [itemRounds.round1, itemRounds.round2, itemRounds.round3].filter(
                (r) => !!(r?.actionReport && r.actionReport.replace(/<[^>]*>/g, '').trim())
              ).length;

              return (
                <div
                  key={item.id || idx}
                  style={{
                    background: isTracked ? '#FFFFFF' : '#F8FAFC',
                    borderRadius: '14px',
                    border: `1px solid ${isTracked ? '#E2E8F0' : '#CBD5E1'}`,
                    borderLeft: isTracked ? `5px solid ${catObj.color}` : '5px solid #94A3B8',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Item Main Row */}
                  <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {/* Top line: Category, Item Ref, Theme, Scope Toggle, and Status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '6px',
                            background: isTracked ? `${catObj.color}15` : '#F1F5F9',
                            color: isTracked ? catObj.color : '#64748B',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                          }}
                        >
                          {item.itemRef || 'OFI'}
                        </span>

                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                          {item.category}
                        </span>

                        {item.keyTheme && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#F1F5F9',
                              color: '#64748B',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {item.keyTheme}
                          </span>
                        )}
                      </div>

                      {/* Right Header: Tracking Toggle & Status Progress Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Tracking Scope Toggle Button (ผู้รายงานผล & Admin กดได้) */}
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => handleToggleTracking(item)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: isTracked ? '#ECFDF5' : '#FEF3C7',
                              color: isTracked ? '#047857' : '#B45309',
                              border: `1px solid ${isTracked ? '#A7F3D0' : '#FDE68A'}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title={
                              isTracked
                                ? "คลิกเพื่อเปลี่ยนเป็น 'ยังไม่ดำเนินการ' (ซ่อนจากการติดตามปกติ & ไม่ต้องรายงานผล)"
                                : "คลิกเพื่อนำกลับเข้าสู่แผน 'ดำเนินการ' (ติดตามผล 3 รอบ)"
                            }
                          >
                            {isTracked ? (
                              <>
                                <CheckCircle2 size={13} color="#059669" />
                                <span>ดำเนินการ</span>
                              </>
                            ) : (
                              <>
                                <Pause size={13} color="#D97706" />
                                <span>ยังไม่ดำเนินการ</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: isTracked ? '#ECFDF5' : '#F1F5F9',
                              color: isTracked ? '#059669' : '#64748B',
                              border: `1px solid ${isTracked ? '#A7F3D0' : '#E2E8F0'}`,
                            }}
                          >
                            {isTracked ? '🟢 ดำเนินการ' : '⏸️ ยังไม่ดำเนินการ'}
                          </span>
                        )}

                        {/* Progress Status Badge */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: isTracked ? statusCfg.color : '#64748B',
                            background: isTracked ? statusCfg.bg : '#F1F5F9',
                            border: `1px solid ${isTracked ? statusCfg.border : '#E2E8F0'}`,
                          }}
                        >
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: isTracked ? statusCfg.color : '#94A3B8',
                            }}
                          />
                          {!isTracked
                            ? 'พักการติดตาม'
                            : item.status === 'COMPLETED'
                            ? 'เสร็จสิ้นแล้ว'
                            : reportedRoundsCount > 0
                            ? `กำลังดำเนินการ (${reportedRoundsCount}/3 รอบ)`
                            : 'รอดำเนินการ'}
                        </span>

                        {isAdmin && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOfi(item);
                                setIsFormModalOpen(true);
                              }}
                              className="btn btn-ghost btn-icon"
                              style={{ color: '#64748B', padding: '4px' }}
                              title="แก้ไขข้อ OFI นี้"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingOfi(item)}
                              className="btn btn-ghost btn-icon"
                              style={{ color: '#EF4444', padding: '4px' }}
                              title="ลบรายการนี้"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Untracked Notice Banner */}
                    {!isTracked && (
                      <div
                        style={{
                          background: '#FEF3C7',
                          border: '1px solid #FDE68A',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                          fontSize: '0.8rem',
                          color: '#92400E',
                          fontWeight: 600,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Pause size={15} color="#D97706" style={{ flexShrink: 0 }} />
                          <span>รายการนี้อยู่ในสถานะ &ldquo;ยังไม่ดำเนินการ&rdquo; — ผู้รายงานผลไม่ต้องบันทึกผลการดำเนินงาน</span>
                        </div>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleToggleTracking(item)}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #D97706',
                              color: '#B45309',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            เปลี่ยนเป็น &ldquo;ดำเนินการ&rdquo;
                          </button>
                        )}
                      </div>
                    )}

                    {/* Finding Content */}
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isTracked ? '#0F172A' : '#475569', lineHeight: 1.55 }}>
                      {item.finding}
                    </div>

                    {/* 3-Round Tracking Bar (การติดตามผล 3 รอบ) */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                        gap: '8px',
                        background: '#F8FAFC',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {[
                        { key: 'round1', num: 1, label: 'รอบที่ 1' },
                        { key: 'round2', num: 2, label: 'รอบที่ 2' },
                        { key: 'round3', num: 3, label: 'รอบที่ 3' },
                      ].map((r) => {
                        const rData = itemRounds[r.key] || {};
                        const hasReport = !!(rData.actionReport && rData.actionReport.trim());

                        return (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => {
                              setActionModalRound(r.key);
                              setActionModalOfi(item);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: `1px solid ${hasReport ? '#A7F3D0' : '#E2E8F0'}`,
                              background: hasReport ? '#ECFDF5' : '#FFFFFF',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease',
                            }}
                            title={`คลิกเพื่อดูหรือรายงานผล ${r.label}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  background: hasReport ? '#059669' : '#E2E8F0',
                                  color: hasReport ? '#FFFFFF' : '#64748B',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                }}
                              >
                                {r.num}
                              </span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: hasReport ? '#065F46' : '#334155' }}>
                                {r.label}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: '999px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  background: hasReport ? '#D1FAE5' : '#F1F5F9',
                                  color: hasReport ? '#047857' : '#64748B',
                                }}
                              >
                                {hasReport ? 'รายงานแล้ว' : 'ยังไม่รายงาน'}
                              </span>
                              {hasReport && <CheckCircle2 size={13} color="#059669" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Assigned Persons & Action Report Button Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px',
                        paddingTop: '6px',
                        borderTop: '1px solid #F1F5F9',
                      }}
                    >
                      {/* Assigned Persons Pill */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem' }}>
                        <Users size={15} color="#6D28D9" />
                        <span style={{ color: '#64748B', fontWeight: 600 }}>ผู้รายงานผล:</span>
                        {Array.isArray(item.assignedPersons) && item.assignedPersons.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {item.assignedPersons.map((p, pIdx) => (
                              <span
                                key={pIdx}
                                style={{
                                  padding: '2px 8px',
                                  background: '#FAF5FF',
                                  color: '#6D28D9',
                                  border: '1px solid #EDE9FE',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                }}
                              >
                                {p.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>ยังไม่ได้ระบุ</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Toggle Evidence / Impact Detail */}
                        <button
                          type="button"
                          onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            color: '#64748B',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <span>{isExpanded ? 'ซ่อนรายละเอียด & ผล 3 รอบ' : 'ดูหลักฐาน & รายงาน 3 รอบ'}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* Open Action Report Modal Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActionModalRound('round1');
                            setActionModalOfi(item);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{
                            background: reportedRoundsCount > 0
                              ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                              : 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                            borderColor: reportedRoundsCount > 0 ? '#059669' : '#6D28D9',
                            gap: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          <Edit3 size={14} />
                          <span>
                            {reportedRoundsCount > 0
                              ? `รายงานผลแล้ว (${reportedRoundsCount}/3 รอบ)`
                              : 'บันทึกผลการดำเนินงาน 3 รอบ'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Evidence, Potential Impact & 3-Round Progress Reports */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '1.25rem 1.5rem',
                        background: '#F8FAFC',
                        borderTop: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                        fontSize: '0.875rem',
                      }}
                    >
                      {item.evidence && (
                        <div>
                          <div style={{ fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                            🔍 หลักฐานเชิงประจักษ์ (Evidence):
                          </div>
                          <div style={{ color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                            {item.evidence}
                          </div>
                        </div>
                      )}

                      {item.potentialImpact && (
                        <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '8px' }}>
                          <div style={{ fontWeight: 700, color: '#0F766E', marginBottom: '4px' }}>
                            💡 ผลกระทบและคุณค่าเชิงกลยุทธ์ (Potential Impact):
                          </div>
                          <div style={{ color: '#334155', lineHeight: 1.6 }}>
                            {item.potentialImpact}
                          </div>
                        </div>
                      )}

                      {/* 3-Round Detailed Action Reports Section */}
                      <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ fontWeight: 800, color: '#6D28D9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Layers size={16} />
                            <span>รายงานผลการดำเนินงาน 3 รอบ (3 Tracking Rounds):</span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                          {[
                            { key: 'round1', num: 1, label: 'รอบที่ 1 (ครั้งที่ 1)' },
                            { key: 'round2', num: 2, label: 'รอบที่ 2 (ครั้งที่ 2)' },
                            { key: 'round3', num: 3, label: 'รอบที่ 3 (ครั้งที่ 3)' },
                          ].map((r) => {
                            const rData = itemRounds[r.key] || {};
                            const hasReport = !!(rData.actionReport && rData.actionReport.trim());

                            return (
                              <div
                                key={r.key}
                                style={{
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  border: `1px solid ${hasReport ? '#A7F3D0' : '#E2E8F0'}`,
                                  padding: '1rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.85rem' }}>
                                      {r.label}
                                    </span>
                                    <span
                                      style={{
                                        padding: '2px 8px',
                                        borderRadius: '999px',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        background: hasReport ? '#D1FAE5' : '#F1F5F9',
                                        color: hasReport ? '#047857' : '#64748B',
                                        border: `1px solid ${hasReport ? '#A7F3D0' : '#E2E8F0'}`,
                                      }}
                                    >
                                      {hasReport ? '🟢 รายงานแล้ว' : '⚪ ยังไม่รายงาน'}
                                    </span>
                                  </div>

                                  {hasReport ? (
                                    <div
                                      className="tqa-rich-content"
                                      style={{
                                        fontSize: '0.825rem',
                                        lineHeight: 1.5,
                                        color: '#334155',
                                        maxHeight: '140px',
                                        overflowY: 'auto',
                                        padding: '6px 8px',
                                        background: '#F8FAFC',
                                        borderRadius: '6px',
                                        border: '1px solid #F1F5F9',
                                      }}
                                      dangerouslySetInnerHTML={{ __html: normalizeActionReportHtml(rData.actionReport) }}
                                    />
                                  ) : (
                                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic', padding: '10px 0' }}>
                                      ยังไม่มีการบันทึกรายงานผลในรอบนี้
                                    </div>
                                  )}
                                </div>

                                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                    {rData.reportedBy ? `โดย ${rData.reportedBy}` : '-'}
                                  </span>

                                  {canEdit && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActionModalRound(r.key);
                                        setActionModalOfi(item);
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#6D28D9',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {hasReport ? 'แก้ไขผลรอบนี้' : '+ รายงานผล'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <TqaReportUrlModal
        isOpen={isReportUrlModalOpen}
        onClose={() => setIsReportUrlModalOpen(false)}
        fiscalYear={fiscalYear}
        initialConfig={reportConfig}
        currentUser={currentUser}
        onSaved={(cfg) => setReportConfig(cfg)}
      />

      <TqaOfiActionModal
        isOpen={Boolean(actionModalOfi)}
        onClose={() => {
          setActionModalOfi(null);
          setActionModalRound('round1');
        }}
        ofiItem={actionModalOfi}
        fiscalYear={fiscalYear}
        currentUser={currentUser}
        currentPersonnel={currentPersonnel}
        isAdmin={isAdmin}
        initialRound={actionModalRound}
        onSaved={() => {
          // Real-time listener will refresh
        }}
      />

      <TqaOfiFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingOfi(null);
        }}
        ofiToEdit={editingOfi}
        fiscalYear={fiscalYear}
        personnelList={personnelList}
        currentUser={currentUser}
        onSaved={() => {
          // Real-time listener will refresh
        }}
      />

      <TqaOfiImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        fiscalYear={fiscalYear}
        currentUser={currentUser}
        onImportSuccess={() => {
          // Real-time listener will refresh
        }}
      />

      {/* Tracking Scope Confirmation Modal */}
      {trackingConfirmState && trackingConfirmState.item && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !trackingConfirmState.isSaving) {
              setTrackingConfirmState(null);
            }
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '1.25rem',
              maxWidth: '480px',
              width: '100%',
              padding: '2rem 1.75rem 1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top colored accent bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: trackingConfirmState.nextTracked
                  ? 'linear-gradient(90deg, #10B981, #059669)'
                  : 'linear-gradient(90deg, #F59E0B, #D97706)',
              }}
            />

            {/* Icon Header */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: trackingConfirmState.nextTracked ? '#ECFDF5' : '#FEF3C7',
                color: trackingConfirmState.nextTracked ? '#059669' : '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                border: `3px solid ${trackingConfirmState.nextTracked ? '#A7F3D0' : '#FDE68A'}`,
                boxShadow: `0 8px 16px -4px ${trackingConfirmState.nextTracked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
              }}
            >
              {trackingConfirmState.nextTracked ? <Play size={28} /> : <Pause size={28} />}
            </div>

            {/* Title */}
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
              {trackingConfirmState.nextTracked
                ? 'ยืนยันนำกลับเข้าสู่แผน "ดำเนินการ"'
                : 'ยืนยันเปลี่ยนเป็น "ยังไม่ดำเนินการ"'}
            </h3>

            {/* OFI Item Context Card */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '0.75rem',
                padding: '0.875rem 1rem',
                margin: '1rem 0 1.25rem',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
                <span
                  style={{
                    background: '#6D28D9',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {trackingConfirmState.item.itemRef || 'OFI'}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: trackingConfirmState.nextTracked ? '#059669' : '#D97706',
                    background: trackingConfirmState.nextTracked ? '#ECFDF5' : '#FEF3C7',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {trackingConfirmState.nextTracked ? 'สถานะใหม่: ดำเนินการ (ติดตามผล)' : 'สถานะใหม่: ยังไม่ดำเนินการ (พักไว้)'}
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: '#334155',
                  margin: 0,
                  fontWeight: 500,
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {trackingConfirmState.item.finding || 'ข้อเสนอแนะในการปรับปรุง'}
              </p>
            </div>

            {/* Description Text */}
            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.55, margin: '0 0 1.5rem 0' }}>
              {trackingConfirmState.nextTracked ? (
                <>
                  ข้อเสนอแนะนี้จะถูกนำกลับเข้าสู่กระบวนการติดตามผล <strong>(3 รอบ)</strong>{' '}
                  และผู้รายงานผลจะสามารถบันทึกความก้าวหน้าได้ตามปกติ
                </>
              ) : (
                <>
                  ข้อเสนอแนะนี้จะถูกเปลี่ยนสถานะเป็น <strong>&quot;ยังไม่ดำเนินการ&quot;</strong>{' '}
                  ซึ่งจะถูกซ่อนจากมุมมองติดตามปกติ และผู้รายงานผลไม่ต้องรายงานความก้าวหน้า
                </>
              )}
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                disabled={trackingConfirmState.isSaving}
                onClick={() => setTrackingConfirmState(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '0.65rem', fontWeight: 600 }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={trackingConfirmState.isSaving}
                onClick={handleExecuteToggleTracking}
                className="btn btn-primary"
                style={{
                  flex: 1.3,
                  padding: '0.65rem 1.25rem',
                  borderRadius: '0.65rem',
                  fontWeight: 700,
                  border: 'none',
                  background: trackingConfirmState.nextTracked
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  boxShadow: trackingConfirmState.nextTracked
                    ? '0 4px 12px rgba(16, 185, 129, 0.35)'
                    : '0 4px 12px rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {trackingConfirmState.isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> กำลังบันทึก...
                  </>
                ) : trackingConfirmState.nextTracked ? (
                  <>
                    <CheckCircle2 size={16} /> ยืนยันเป็น &quot;ดำเนินการ&quot;
                  </>
                ) : (
                  <>
                    <Pause size={16} /> ยืนยันเป็น &quot;ยังไม่ดำเนินการ&quot;
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingOfi && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '1rem',
              maxWidth: '450px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              border: '1px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
              ยืนยันการลบข้อเสนอแนะ TQA OFI
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              คุณต้องการลบข้อเสนอแนะ <strong>{deletingOfi.itemRef}</strong>: &quot;{deletingOfi.finding}&quot; หรือไม่?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button type="button" onClick={() => setDeletingOfi(null)} className="btn btn-secondary">
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="btn btn-primary"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
              >
                ลบรายการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
