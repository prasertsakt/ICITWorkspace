'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeTqaOfiItems,
  deleteTqaOfiItem,
  saveTqaOfiItem,
  subscribeTqaReportConfig,
  canEditTqaOfiProgress,
  normalizeTqaRounds,
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
} from 'lucide-react';

export default function TqaOfiTrackingPage() {
  const { currentUser, currentPersonnel, isAdmin, isLoading: authLoading, handleGoogleSignIn } = useAuth();

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
    const total = ofiItems.length;
    const completed = ofiItems.filter((i) => i.status === 'COMPLETED').length;
    const inProgress = ofiItems.filter((i) => i.status === 'IN_PROGRESS').length;
    const pending = ofiItems.filter((i) => i.status === 'PENDING' || !i.status).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Per-round calculations
    const round1Items = ofiItems.map((i) => normalizeTqaRounds(i).round1);
    const round2Items = ofiItems.map((i) => normalizeTqaRounds(i).round2);
    const round3Items = ofiItems.map((i) => normalizeTqaRounds(i).round3);

    const calcRoundStats = (roundList) => {
      const reported = roundList.filter((r) => !!r?.actionReport).length;
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

    // By category counts
    const byCategory = {};
    TQA_CATEGORIES.forEach((c) => {
      byCategory[c.name] = ofiItems.filter((i) => i.category === c.name || i.categoryNum === c.num).length;
    });

    return {
      total,
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

  // Filtered OFIs with 3-round support
  const filteredOfiItems = useMemo(() => {
    return ofiItems.filter((item) => {
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
  }, [ofiItems, selectedCategory, selectedStatus, searchQuery, currentUser, currentPersonnel]);

  // Quick Status Toggle Handler
  const handleQuickStatusChange = async (item, newStatus) => {
    const canEdit = canEditTqaOfiProgress(item, currentUser, currentPersonnel, isAdmin);
    if (!canEdit) {
      alert('คุณไม่มีสิทธิ์เปลี่ยนสถานะข้อเสนอแนะนี้ (ต้องเป็น Admin หรือผู้รายงานผลที่ได้รับมอบหมาย)');
      return;
    }

    try {
      const updatedByName = currentPersonnel?.name || currentUser?.displayName || currentUser?.email || 'Admin';
      await saveTqaOfiItem(
        {
          ...item,
          status: newStatus,
          lastReportedAt: new Date().toISOString(),
          lastReportedBy: updatedByName,
        },
        fiscalYear,
        updatedByName
      );
    } catch (e) {
      alert(e.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deletingOfi) return;
    try {
      await deleteTqaOfiItem(deletingOfi.id, fiscalYear);
      setDeletingOfi(null);
    } catch (e) {
      alert(e.message || 'เกิดข้อผิดพลาดในการลบรายการ');
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
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>OFI ทั้งหมด (ปี {fiscalYear})</span>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FAF5FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={18} />
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginTop: '6px', letterSpacing: '-0.02em' }}>
                {stats.total} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>รายการ</span>
              </div>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: '#059669', fontWeight: 700 }}>🟢 เสร็จสิ้น {stats.completed} ข้อ</span>
              <span style={{ color: '#6D28D9', fontWeight: 700 }}>ปิดแล้ว {stats.percentage}%</span>
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
              ทุกหมวด ({stats.total})
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
              const itemRounds = normalizeTqaRounds(item);
              const statusCfg = TQA_STATUS_CONFIG[item.status || 'PENDING'] || TQA_STATUS_CONFIG.PENDING;
              const catObj = TQA_CATEGORIES.find((c) => c.name === item.category || c.num === item.categoryNum) || TQA_CATEGORIES[0];

              // Count completed and reported rounds
              const reportedRoundsCount = [itemRounds.round1, itemRounds.round2, itemRounds.round3].filter(
                (r) => !!r?.actionReport
              ).length;

              return (
                <div
                  key={item.id || idx}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    borderLeft: `5px solid ${catObj.color}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Item Main Row */}
                  <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {/* Top line: Category, Item Ref, Theme, and Status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '6px',
                            background: `${catObj.color}15`,
                            color: catObj.color,
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

                      {/* Status Action Dropdown / Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {canEdit ? (
                          <select
                            className="form-input"
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              borderRadius: '999px',
                              color: statusCfg.color,
                              background: statusCfg.bg,
                              borderColor: statusCfg.border,
                              cursor: 'pointer',
                              width: 'auto',
                            }}
                            value={item.status || 'PENDING'}
                            onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                            title="คลิกเพื่อเปลี่ยนสถานะภาพรวมของข้อเสนอแนะนี้"
                          >
                            <option value="PENDING">🟡 รอดำเนินการ</option>
                            <option value="IN_PROGRESS">🔵 กำลังดำเนินการ</option>
                            <option value="COMPLETED">🟢 เสร็จสิ้นแล้ว</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '999px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              color: statusCfg.color,
                              background: statusCfg.bg,
                              border: `1px solid ${statusCfg.border}`,
                            }}
                          >
                            {statusCfg.label}
                          </span>
                        )}

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

                    {/* Finding Content */}
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.55 }}>
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
                        const rStatus = rData.status || 'PENDING';
                        const rCfg = TQA_STATUS_CONFIG[rStatus] || TQA_STATUS_CONFIG.PENDING;
                        const hasReport = !!rData.actionReport;

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
                              border: `1px solid ${hasReport ? rCfg.border : '#E2E8F0'}`,
                              background: '#FFFFFF',
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
                                  background: hasReport ? '#6D28D9' : '#E2E8F0',
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
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>
                                {r.label}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '999px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  background: rCfg.bg,
                                  color: rCfg.color,
                                }}
                              >
                                {rCfg.label}
                              </span>
                              {hasReport && <CheckCircle2 size={12} color="#10B981" />}
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
                            const rStatus = rData.status || 'PENDING';
                            const rCfg = TQA_STATUS_CONFIG[rStatus] || TQA_STATUS_CONFIG.PENDING;
                            const hasReport = !!rData.actionReport;

                            return (
                              <div
                                key={r.key}
                                style={{
                                  background: '#FFFFFF',
                                  borderRadius: '10px',
                                  border: '1px solid #E2E8F0',
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
                                        background: rCfg.bg,
                                        color: rCfg.color,
                                        border: `1px solid ${rCfg.border}`,
                                      }}
                                    >
                                      {rCfg.label}
                                    </span>
                                  </div>

                                  {hasReport ? (
                                    <div
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
                                      dangerouslySetInnerHTML={{ __html: rData.actionReport }}
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
