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
import { formatDateDDMMYYYYBE } from '@/lib/dateUtils';
import { exportSkillMapToExcel } from '@/lib/skillMapExcelExport';

// Modals
import SkillRatingScaleModal from '@/components/SkillRatingScaleModal';
import SkillAssessmentFormModal from '@/components/SkillAssessmentFormModal';
import SkillRadarAnalysisModal from '@/components/SkillRadarAnalysisModal';
import SkillOrgRadarAnalysisModal from '@/components/SkillOrgRadarAnalysisModal';
import SkillMapConfigModal from '@/components/SkillMapConfigModal';

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

  // Handle Assessment Save Success
  const handleAssessmentSaved = (savedPayload) => {
    loadYearData(fiscalYear);
  };

  // Handle Excel Export
  const handleExportExcel = () => {
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
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
          color: '#FFFFFF',
          padding: '1.75rem 2rem',
          borderRadius: '1.25rem',
          marginBottom: '1.75rem',
          boxShadow: '0 15px 30px -10px rgba(15, 23, 42, 0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>


            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Compass size={28} color="#A5B4FC" />
              <span>แผนที่ความรู้และทักษะบุคลากร (Knowledge & Skill Map)</span>
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#CBD5E1', maxWidth: '780px' }}>
              ประเมินความรู้และทักษะ 4 ด้านงาน โครงสร้าง 3 ระดับ วิเคราะห์ช่องว่างและศักยภาพเชื่อมโยงกับวิสัยทัศน์ &ldquo;{ICIT_VISION}&rdquo;
            </p>
          </div>

          {/* Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Year Selector */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '10px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Calendar size={15} color="#C7D2FE" />
              <span style={{ fontSize: '0.75rem', color: '#E2E8F0', fontWeight: 600 }}>ปีงบ:</span>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#1E1B4B',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {[2567, 2568, 2569, 2570, 2571].map((y) => (
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
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              title="ดูคำอธิบายเกณฑ์ระดับคะแนน 0 - 5"
            >
              <Info size={15} color="#C7D2FE" />
              <span>เกณฑ์ระดับคะแนน (0-5)</span>
            </button>

            {/* Org Overview Radar & AI Button */}
            <button
              type="button"
              onClick={() => setIsOrgRadarModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.35)',
              }}
              title="ดู Spider Radar และบทวิเคราะห์ศักยภาพภาพรวมของทั้งองค์กร"
            >
              <TrendingUp size={15} />
              <span>Radar & AI ภาพรวมสำนักฯ</span>
            </button>

            {/* Export to Excel Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
              }}
              title="ส่งออกผลการประเมินทักษะทั้งหมดเป็นไฟล์ Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} />
              <span>ส่งออก Excel</span>
            </button>

            {/* HR Config Button */}
            {isHrOrAdmin && (
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="ตั้งค่าโครงสร้างความรู้และทักษะ"
              >
                <Settings size={15} />
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
                  padding: '8px 18px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
                }}
              >
                <Edit3 size={16} />
                <span>ทำการประเมินตนเอง (ปี {fiscalYear})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <LogIn size={16} />
                <span>เข้าสู่ระบบเพื่อประเมิน</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. 4 KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Card 1: Total Staff */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>บุคลากรทั้งหมด</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A' }}>
              {stats.totalStaff} <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>คน</span>
            </div>
          </div>
        </div>

        {/* Card 2: Evaluated Count */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>ประเมินตนเองแล้ว</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803D' }}>
              {stats.evaluatedCount}{' '}
              <span style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 700 }}>
                ({stats.completionRate}%)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Count */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#FFFBEB',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>ยังไม่ประเมิน</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#B45309' }}>
              {stats.pendingCount} <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>คน</span>
            </div>
          </div>
        </div>

        {/* Card 4: Org Average Score */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#EEF2FF',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>คะแนนเฉลี่ยรวมสำนักฯ</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4F46E5' }}>
              {stats.orgAverage}{' '}
              <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>/ 5.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
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
                  border: isActive ? '1.5px solid #4F46E5' : '1px solid #E2E8F0',
                  backgroundColor: isActive ? '#EEF2FF' : '#FFFFFF',
                  color: isActive ? '#4F46E5' : '#475569',
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

      {/* 5. Main Evaluations Table */}
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
                        backgroundColor: isSelf ? '#F8FAFC' : '#FFFFFF',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isSelf ? '#EEF2FF' : '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelf ? '#F8FAFC' : '#FFFFFF')}
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
                                backgroundColor: '#EEF2FF',
                                color: '#4F46E5',
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
                                    backgroundColor: '#4F46E5',
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
                            <span style={{ fontWeight: 800, color: isCompleted ? '#16A34A' : '#4F46E5' }}>
                              {summ.completionPercentage}%
                            </span>
                          </div>
                          <div style={{ height: '6px', width: '100%', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${summ.completionPercentage}%`,
                                backgroundColor: isCompleted ? '#16A34A' : '#4F46E5',
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
                              backgroundColor: '#EEF2FF',
                              color: '#4F46E5',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontWeight: 900,
                              fontSize: '0.9rem',
                            }}
                          >
                            <span>{summ.overallAverage}</span>
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>/ 5</span>
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
                                  backgroundColor: '#4F46E5',
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
                                }}
                              >
                                <Edit3 size={13} />
                                <span>แก้ไข</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenRadarModal(pers, true)}
                                style={{
                                  backgroundColor: '#EEF2FF',
                                  color: '#4F46E5',
                                  border: '1px solid #C7D2FE',
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
                                <span>Radar & AI</span>
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
                              <Eye size={13} color="#4F46E5" />
                              <span>ดูผล & Radar</span>
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
        onExportExcel={handleExportExcel}
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
    </div>
  );
}
