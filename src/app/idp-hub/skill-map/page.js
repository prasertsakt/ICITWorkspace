'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Compass,
  ArrowLeft,
  Search,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
  Award,
  CheckCircle2,
  Clock,
  Settings,
  Eye,
  Edit3,
  FileSpreadsheet,
  Target,
  Info,
  Building2,
  UserCheck,
  Plus,
  RefreshCw,
  Lock,
  LogIn,
  AlertCircle,
  Printer,
} from 'lucide-react';
import {
  getSkillMapConfig,
  saveSkillMapAssessment,
  getAllAssessments,
  calculateAssessmentSummary,
  getDefaultFiscalYear,
  SKILL_RATING_LEVELS,
  ICIT_VISION,
} from '@/lib/skillMapService';
import { subscribePersonnelList } from '@/lib/storageService';
import { MAIN_6_DEPTS } from '@/lib/constants';
import { formatDateDDMMYYYYBE, getAvailableFiscalYears } from '@/lib/dateUtils';
import { exportSkillMapToExcel } from '@/lib/skillMapExcelExport';

// Modals
import SkillRatingScaleModal from '@/components/SkillRatingScaleModal';
import SkillAssessmentFormModal from '@/components/SkillAssessmentFormModal';
import SkillRadarAnalysisModal from '@/components/SkillRadarAnalysisModal';
import SkillOrgRadarAnalysisModal from '@/components/SkillOrgRadarAnalysisModal';
import SkillMapConfigModal from '@/components/SkillMapConfigModal';
import SkillMapPreviewModal from '@/components/SkillMapPreviewModal';

export default function IDPSkillMapPage() {
  const { currentUser, currentPersonnel: authPersonnel, isAdmin, isLoading: authLoading, handleGoogleSignIn } = useAuth();

  // Fiscal Year
  const [fiscalYear, setFiscalYear] = useState(getDefaultFiscalYear());

  // Data States
  const [personnelList, setPersonnelList] = useState([]);
  const [workAreas, setWorkAreas] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [quickFilter, setQuickFilter] = useState('ALL'); // 'ALL' | 'MY_EVAL' | 'MY_DEPT' | 'EVALUATED' | 'PENDING'

  // Modals state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);
  const [isOrgRadarModalOpen, setIsOrgRadarModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [targetPersonnelForModal, setTargetPersonnelForModal] = useState(null);
  const [targetAssessmentForModal, setTargetAssessmentForModal] = useState(null);
  const [isModalSelfMode, setIsModalSelfMode] = useState(false);

  // PDF Preview Modal State
  const [previewPersonnelForModal, setPreviewPersonnelForModal] = useState(null);
  const [previewAssessmentForModal, setPreviewAssessmentForModal] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Filter out Executive personnel (บุคลากรที่ต้องทำการประเมิน ไม่รวม ผู้บริหาร)
  const staffList = useMemo(() => {
    return (personnelList || []).filter(
      (p) => p.department !== 'คณะผู้บริหาร' && p.position !== 'ผู้บริหาร' && !p.isExecutive && p.status !== 'ลาออก'
    );
  }, [personnelList]);

  // Subscribe personnel list
  useEffect(() => {
    const unsub = subscribePersonnelList((list) => {
      setPersonnelList(list || []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Determine current logged-in personnel
  const currentPersonnel = useMemo(() => {
    if (authPersonnel) return authPersonnel;
    if (currentUser?.email) {
      const email = currentUser.email.toLowerCase();
      const found = personnelList.find((p) => p.email?.toLowerCase() === email);
      if (found) return found;
      return {
        id: currentUser.uid || 'temp-user',
        name: currentUser.displayName || 'ผู้ใช้งาน',
        email: email,
        department: 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
        position: 'บุคลากร',
      };
    }
    return personnelList[0] || null;
  }, [authPersonnel, currentUser, personnelList]);

  // Check HR / Admin permissions
  const isHrOrAdmin = useMemo(() => {
    if (isAdmin) return true;
    const email = (currentPersonnel?.email || currentUser?.email || '').toLowerCase();
    return (
      email === 'jarucha.j@icit.kmutnb.ac.th' ||
      email === 'prasertsak.t@cit.kmutnb.ac.th' ||
      email.includes('admin') ||
      currentPersonnel?.position === 'ผู้ดูแลระบบ' ||
      currentPersonnel?.position?.includes('ผู้บริหาร')
    );
  }, [isAdmin, currentPersonnel, currentUser]);

  // Load config & assessments when fiscalYear changes
  const loadYearData = (year) => {
    const cfg = getSkillMapConfig(year);
    setWorkAreas(cfg.workAreas || []);
    const all = getAllAssessments(year);
    setAssessments(all);
  };

  useEffect(() => {
    loadYearData(fiscalYear);
  }, [fiscalYear]);

  // Total subskills count across all areas
  const totalSubSkillsCount = useMemo(() => {
    let count = 0;
    workAreas.forEach((area) => {
      (area.competencies || []).forEach((comp) => {
        count += (comp.subSkills || []).length;
      });
    });
    return count;
  }, [workAreas]);

  // Current user's assessment record
  const currentUserAssessment = useMemo(() => {
    if (!currentPersonnel) return null;
    return assessments.find((a) => a.personnelId === currentPersonnel.id) || null;
  }, [assessments, currentPersonnel]);

  // KPI Statistics (คำนวณเฉพาะบุคลากรปฏิบัติงานจริง ไม่รวมผู้บริหาร)
  const stats = useMemo(() => {
    const totalStaff = staffList.length || 1;

    let evaluatedCount = 0;
    let totalScoreSum = 0;

    staffList.forEach((pers) => {
      const evalRec = assessments.find((a) => a.personnelId === pers.id);
      const summ = calculateAssessmentSummary(workAreas, evalRec?.ratings || {});
      if (summ.completedCount > 0) {
        evaluatedCount++;
        totalScoreSum += summ.overallAverage;
      }
    });

    const pendingCount = Math.max(0, totalStaff - evaluatedCount);
    const completionRate = Math.round((evaluatedCount / totalStaff) * 100);
    const orgAverage = evaluatedCount > 0 ? Number((totalScoreSum / evaluatedCount).toFixed(2)) : 0;

    return {
      totalStaff,
      evaluatedCount,
      pendingCount,
      completionRate: Math.min(100, completionRate),
      orgAverage,
    };
  }, [staffList, assessments, workAreas]);

  // Filtered personnel table list (ไม่รวมผู้บริหาร)
  const filteredPersonnel = useMemo(() => {
    return staffList.filter((pers) => {
      // Dept filter
      if (selectedDept !== 'ALL' && pers.department !== selectedDept) {
        return false;
      }

      const evalRec = assessments.find((a) => a.personnelId === pers.id);
      const summ = calculateAssessmentSummary(workAreas, evalRec?.ratings || {});
      const hasEvaluated = summ.completedCount > 0;

      // Quick filter
      if (quickFilter === 'MY_EVAL') {
        if (!currentPersonnel || pers.id !== currentPersonnel.id) return false;
      } else if (quickFilter === 'MY_DEPT') {
        if (!currentPersonnel || pers.department !== currentPersonnel.department) return false;
      } else if (quickFilter === 'EVALUATED') {
        if (!hasEvaluated) return false;
      } else if (quickFilter === 'PENDING') {
        if (hasEvaluated) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = pers.name?.toLowerCase().includes(q);
        const matchDept = pers.department?.toLowerCase().includes(q);
        const matchPos = pers.position?.toLowerCase().includes(q);
        const matchEmail = pers.email?.toLowerCase().includes(q);
        if (!matchName && !matchDept && !matchPos && !matchEmail) return false;
      }

      return true;
    });
  }, [staffList, selectedDept, quickFilter, searchQuery, assessments, workAreas, currentPersonnel]);

  // Open Self Assessment Modal
  const handleOpenSelfAssessment = () => {
    if (!currentPersonnel) {
      alert('กรุณาเข้าสู่ระบบก่อนทำการประเมินตนเอง');
      return;
    }
    setTargetPersonnelForModal(currentPersonnel);
    setTargetAssessmentForModal(currentUserAssessment);
    setIsAssessmentModalOpen(true);
  };

  // Open Radar & AI Modal for specific person
  const handleOpenRadarModal = (pers, isSelf = false) => {
    const evalRec = assessments.find((a) => a.personnelId === pers.id) || null;
    setTargetPersonnelForModal(pers);
    setTargetAssessmentForModal(evalRec);
    setIsModalSelfMode(isSelf);
    setIsRadarModalOpen(true);
  };

  // Handle Open PDF Preview Modal
  const handleOpenPreviewPDF = (pers) => {
    const evalRec = assessments.find((a) => a.personnelId === pers.id) || null;
    setPreviewPersonnelForModal(pers);
    setPreviewAssessmentForModal(evalRec);
    setIsPreviewModalOpen(true);
  };

  // Handle Assessment Save Success
  const handleAssessmentSaved = (savedPayload) => {
    loadYearData(fiscalYear);
  };

  // Handle Excel Export (Admin/HR only)
  const handleExportExcel = () => {
    if (!isHrOrAdmin) {
      alert('เฉพาะผู้ดูแลระบบและเจ้าหน้าที่ HR เท่านั้นที่สามารถส่งออกข้อมูล Excel ได้');
      return;
    }
    exportSkillMapToExcel({
      fiscalYear,
      workAreas,
      personnelList: staffList,
      assessments,
    });
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#4F46E5', fontWeight: 600 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #EEF2FF',
              borderTopColor: '#4F46E5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span>กำลังโหลดข้อมูล Knowledge & Skill Map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '4rem', paddingTop: '1.25rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* 1. Breadcrumb */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          href="/idp-hub"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#64748B',
            textDecoration: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#F97316')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
        >
          <ArrowLeft size={16} />
          <span>กลับสู่ IDP Hub</span>
        </Link>
      </div>

      {/* 2. Header Hero Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
          color: '#FFFFFF',
          padding: '2.5rem 2rem 2.25rem',
          borderRadius: '1.5rem',
          marginBottom: '1.75rem',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            top: '-150px',
            right: '-100px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
            bottom: '-100px',
            left: '10%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top Pill & Action Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                background: 'rgba(249, 115, 22, 0.25)',
                color: '#FED7AA',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              <Sparkles size={14} color="#FB923C" />
              <span>HUMAN RESOURCE DEVELOPMENT SYSTEM &bull; KNOWLEDGE &amp; SKILL MAP</span>
            </div>

            {/* Fiscal Year & Top Header Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Calendar size={15} color="#FB923C" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#CBD5E1' }}>ปีงบประมาณ:</span>
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  style={{
                    background: '#FFFFFF',
                    color: '#1E293B',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '2px 8px',
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

              {/* Rating Scale Button */}
              <button
                type="button"
                onClick={() => setIsRatingModalOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.15s ease',
                }}
                title="ดูคำอธิบายเกณฑ์ระดับคะแนน 0 - 5"
              >
                <Info size={14} color="#FB923C" />
                <span>เกณฑ์คะแนน (0-5)</span>
              </button>

              {/* Org Radar & AI Overview Button */}
              <button
                type="button"
                onClick={() => setIsOrgRadarModalOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.15s ease',
                }}
                title="ดู Spider Radar และบทวิเคราะห์ศักยภาพภาพรวมของทั้งองค์กร"
              >
                <TrendingUp size={14} color="#38BDF8" />
                <span>Radar &amp; AI ภาพรวมสำนักฯ</span>
              </button>

              {/* Export to Excel Button (Admin/HR only) */}
              {isHrOrAdmin && (
                <button
                  type="button"
                  onClick={handleExportExcel}
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                    padding: '5px 12px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.15s ease',
                  }}
                  title="ส่งออกผลการประเมินทักษะทั้งหมดเป็นไฟล์ Excel (.xlsx)"
                >
                  <FileSpreadsheet size={14} color="#4ADE80" />
                  <span>ส่งออก Excel</span>
                </button>
              )}

              {/* HR Config Button */}
              {isHrOrAdmin && (
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                    padding: '5px 12px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.15s ease',
                  }}
                  title="ตั้งค่าโครงสร้างความรู้และทักษะ"
                >
                  <Settings size={14} color="#FB923C" />
                  <span>ตั้งค่าโครงสร้าง (HR)</span>
                </button>
              )}

              {/* Start Self Assessment Button */}
              {currentPersonnel ? (
                <button
                  type="button"
                  onClick={handleOpenSelfAssessment}
                  style={{
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                  }}
                >
                  <Edit3 size={15} />
                  <span>ประเมินตนเอง (ปี {fiscalYear})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  style={{
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                  }}
                >
                  <LogIn size={15} />
                  <span>เข้าสู่ระบบเพื่อประเมิน</span>
                </button>
              )}
            </div>
          </div>

          {/* Title and Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
              }}
            >
              <Compass size={28} color="#FFFFFF" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.2,
                  color: '#FFFFFF',
                }}
              >
                Knowledge &amp; Skill Map
              </h1>
            </div>
          </div>

          <p
            style={{
              fontSize: 'clamp(0.88rem, 1.6vw, 0.98rem)',
              color: '#CBD5E1',
              maxWidth: '820px',
              lineHeight: 1.6,
              margin: '0 0 1.75rem 0',
            }}
          >
            ศูนย์กลางการวิเคราะห์และประเมินทักษะความรู้ 4 ด้านงาน โครงสร้าง 3 ระดับ วิเคราะห์ช่องว่างและศักยภาพบุคลากรเชื่อมโยงกับวิสัยทัศน์ &ldquo;{ICIT_VISION}&rdquo;
          </p>

          {/* Dark Glassmorphic Quick Stat Counters inside Hero */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Card 1: Total Staff */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#E2E8F0', fontWeight: 600 }}>
                <Users size={16} color="#FB923C" />
                <span>บุคลากรทั้งหมด</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {stats.totalStaff} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#94A3B8' }}>คน</span>
              </div>
            </div>

            {/* Card 2: Evaluated Count */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#E2E8F0', fontWeight: 600 }}>
                <UserCheck size={16} color="#38BDF8" />
                <span>ประเมินตนเองแล้ว</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', color: '#7DD3FC', letterSpacing: '-0.02em' }}>
                {stats.evaluatedCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#94A3B8' }}>คน</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
                (ความครอบคลุม {stats.completionRate}%)
              </div>
            </div>

            {/* Card 3: Pending Count */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#E2E8F0', fontWeight: 600 }}>
                <Clock size={16} color="#FBBF24" />
                <span>ยังไม่ประเมิน</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', color: '#FCD34D', letterSpacing: '-0.02em' }}>
                {stats.pendingCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#94A3B8' }}>คน</span>
              </div>
            </div>

            {/* Card 4: Org Average */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#E2E8F0', fontWeight: 600 }}>
                <Award size={16} color="#4ADE80" />
                <span>คะแนนเฉลี่ยรวมสำนักฯ</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', color: '#86EFAC', letterSpacing: '-0.02em' }}>
                {stats.orgAverage} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#94A3B8' }}>/ 5.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          padding: '1.25rem 1.5rem',
          border: '1px solid #E2E8F0',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Quick Filter Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {[
            { id: 'ALL', label: 'ทั้งหมด' },
            { id: 'MY_EVAL', label: 'แบบประเมินของฉัน' },
            { id: 'MY_DEPT', label: 'ฝ่ายของฉัน' },
            { id: 'EVALUATED', label: 'ประเมินแล้ว' },
            { id: 'PENDING', label: 'ยังไม่ประเมิน' },
          ].map((tab) => {
            const isActive = quickFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQuickFilter(tab.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '999px',
                  border: isActive ? '1.5px solid #EA580C' : '1px solid #E2E8F0',
                  backgroundColor: isActive ? '#FFF7ED' : '#FFFFFF',
                  color: isActive ? '#EA580C' : '#475569',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Department Filter & Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Department dropdown */}
          <div style={{ minWidth: '240px', flex: '1 1 240px' }}>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                color: '#1E293B',
                fontWeight: 600,
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="ALL">-- ทุกฝ่ายงานในสำนัก --</option>
              {MAIN_6_DEPTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', flex: '2 1 300px' }}>
            <Search
              size={17}
              color="#94A3B8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อ-นามสกุล, ตำแหน่ง, ฝ่ายงาน หรืออีเมล..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                color: '#1E293B',
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. Main Evaluations Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1.25rem',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
                <th style={{ padding: '12px 16px', width: '60px', textAlign: 'center' }}>ลำดับ</th>
                <th style={{ padding: '12px 16px' }}>บุคลากร</th>
                <th style={{ padding: '12px 16px' }}>ฝ่ายงาน</th>
                <th style={{ padding: '12px 16px', minWidth: '180px' }}>ความคืบหน้าการประเมิน</th>
                <th style={{ padding: '12px 16px', width: '130px', textAlign: 'center' }}>คะแนนเฉลี่ยรวม</th>
                <th style={{ padding: '12px 16px', width: '140px' }}>บันทึกล่าสุด</th>
                <th style={{ padding: '12px 16px', width: '220px', textAlign: 'center' }}>จัดการ / เรียกดู</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={32} color="#94A3B8" />
                      <span style={{ fontWeight: 600 }}>ไม่พบข้อมูลบุคลากรตามเงื่อนไขที่เลือก</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map((pers, idx) => {
                  const evalRec = assessments.find((a) => a.personnelId === pers.id);
                  const summ = calculateAssessmentSummary(workAreas, evalRec?.ratings || {});
                  const isSelf = currentPersonnel && pers.id === currentPersonnel.id;
                  const isCompleted = summ.completedCount === totalSubSkillsCount && totalSubSkillsCount > 0;
                  const hasStarted = summ.completedCount > 0;

                  return (
                    <tr
                      key={pers.id || idx}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: isSelf ? '#FFFBF7' : '#FFFFFF',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isSelf ? '#FFF7ED' : '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelf ? '#FFFBF7' : '#FFFFFF')}
                    >
                      {/* 1. ลำดับ */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
                        {idx + 1}
                      </td>

                      {/* 2. บุคลากร */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {pers.avatarUrl ? (
                            <img
                              src={pers.avatarUrl}
                              alt=""
                              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: isSelf ? '#FFEDD5' : '#F1F5F9',
                                color: isSelf ? '#EA580C' : '#64748B',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                              }}
                            >
                              {pers.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{pers.name}</span>
                              {isSelf && (
                                <span
                                  style={{
                                    backgroundColor: '#F97316',
                                    color: '#FFFFFF',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '999px',
                                  }}
                                >
                                  ฉัน
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              {pers.position || '-'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. ฝ่ายงาน */}
                      <td style={{ padding: '14px 16px', color: '#334155' }}>
                        <span
                          style={{
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {pers.department || '-'}
                        </span>
                      </td>

                      {/* 4. ความคืบหน้า */}
                      <td style={{ padding: '14px 16px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, color: hasStarted ? '#0F172A' : '#94A3B8' }}>
                              {summ.completedCount} / {totalSubSkillsCount} รายการ
                            </span>
                            <span style={{ fontWeight: 800, color: isCompleted ? '#16A34A' : '#EA580C' }}>
                              {summ.completionPercentage}%
                            </span>
                          </div>
                          <div style={{ height: '6px', width: '100%', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${summ.completionPercentage}%`,
                                backgroundColor: isCompleted ? '#16A34A' : '#F97316',
                                borderRadius: '999px',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 5. คะแนนเฉลี่ยรวม */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {hasStarted ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#FFF7ED',
                              color: '#EA580C',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontWeight: 900,
                              fontSize: '0.9rem',
                              border: '1px solid #FFEDD5',
                            }}
                          >
                            <span>{summ.overallAverage}</span>
                            <span style={{ fontSize: '0.7rem', color: '#FB923C' }}>/ 5</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>-</span>
                        )}
                      </td>

                      {/* 6. วันที่บันทึก */}
                      <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '0.78rem' }}>
                        {evalRec?.updatedAt ? formatDateDDMMYYYYBE(evalRec.updatedAt) : '-'}
                      </td>

                      {/* 7. จัดการ / เรียกดู */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {isSelf ? (
                            <>
                              <button
                                type="button"
                                onClick={handleOpenSelfAssessment}
                                style={{
                                  backgroundColor: '#F97316',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 2px 6px rgba(249, 115, 22, 0.25)',
                                }}
                              >
                                <Edit3 size={13} />
                                <span>แก้ไข</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenRadarModal(pers, true)}
                                style={{
                                  backgroundColor: '#FFF7ED',
                                  color: '#EA580C',
                                  border: '1px solid #FED7AA',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="ดู Spider Radar & AI Analysis"
                              >
                                <Sparkles size={13} color="#EA580C" />
                                <span>Radar &amp; AI</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenRadarModal(pers, false)}
                              style={{
                                backgroundColor: '#F8FAFC',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Eye size={13} color="#F97316" />
                              <span>ดูผล &amp; Radar</span>
                            </button>
                          )}

                          {/* Preview PDF Button for Every Item */}
                          <button
                            type="button"
                            onClick={() => handleOpenPreviewPDF(pers)}
                            style={{
                              backgroundColor: '#F8FAFC',
                              color: '#475569',
                              border: '1px solid #CBD5E1',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                            title="ดูรายงานฉบับสมบูรณ์ (PDF) และพิมพ์เอกสาร A4"
                          >
                            <Printer size={13} color="#64748B" />
                            <span>Export to PDF</span>
                          </button>
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

      {/* MODALS */}
      {/* 1. Rating Scale Modal */}
      <SkillRatingScaleModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
      />

      {/* 2. Self Assessment Form Modal */}
      {targetPersonnelForModal && (
        <SkillAssessmentFormModal
          isOpen={isAssessmentModalOpen}
          onClose={() => setIsAssessmentModalOpen(false)}
          fiscalYear={fiscalYear}
          personnel={targetPersonnelForModal}
          workAreas={workAreas}
          initialRatings={targetAssessmentForModal?.ratings || {}}
          onSaveSuccess={handleAssessmentSaved}
        />
      )}

      {/* 3. Spider Radar & AI Analysis Modal */}
      {targetPersonnelForModal && (
        <SkillRadarAnalysisModal
          isOpen={isRadarModalOpen}
          onClose={() => setIsRadarModalOpen(false)}
          fiscalYear={fiscalYear}
          personnel={targetPersonnelForModal}
          assessment={targetAssessmentForModal}
          workAreas={workAreas}
          isSelf={isModalSelfMode}
          onAnalysisUpdated={handleAssessmentSaved}
        />
      )}

      {/* 4. Org Overview Radar & AI Analysis Modal */}
      <SkillOrgRadarAnalysisModal
        isOpen={isOrgRadarModalOpen}
        onClose={() => setIsOrgRadarModalOpen(false)}
        fiscalYear={fiscalYear}
        workAreas={workAreas}
        personnelList={staffList}
        assessments={assessments}
        onExportExcel={isHrOrAdmin ? handleExportExcel : null}
      />

      {/* 5. HR Config Modal */}
      <SkillMapConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        currentYear={Number(fiscalYear)}
        operatorName={currentPersonnel?.name || 'HR Officer'}
        personnelList={staffList}
        onConfigSaved={() => loadYearData(fiscalYear)}
      />

      {/* 6. Individual PDF Preview & Print Modal */}
      {previewPersonnelForModal && (
        <SkillMapPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          personnel={previewPersonnelForModal}
          assessment={previewAssessmentForModal}
          workAreas={workAreas}
          fiscalYear={fiscalYear}
        />
      )}
    </div>
  );
}
