'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Compass,
  Layers,
  Sparkles,
  Award,
  CheckCircle2,
  TrendingUp,
  Users,
  Search,
  Settings,
  BookOpen,
  Filter,
  RefreshCw,
  Calendar,
  User,
  ShieldCheck,
  Building2,
  ChevronRight,
  Eye,
  Check,
  Save,
  Clock,
  ExternalLink,
  Target,
  Lock,
  LogIn,
} from 'lucide-react';
import {
  getSkillMapConfig,
  saveSkillMapAssessment,
  getAssessmentByPersonnel,
  getAllAssessments,
  calculateAssessmentSummary,
  getDefaultFiscalYear,
  SKILL_RATING_LEVELS,
  ICIT_VISION,
  ICIT_MISSIONS,
  generateIntelligentAnalysis,
} from '@/lib/skillMapService';
import { subscribePersonnelList } from '@/lib/storageService';
import { formatDateDDMMYYYYBE } from '@/lib/dateUtils';
import SkillRadarChart from '@/components/SkillRadarChart';
import SkillMapConfigModal from '@/components/SkillMapConfigModal';
import SkillMapPeerDetailModal from '@/components/SkillMapPeerDetailModal';

export default function SkillMapPage() {
  const { currentUser, currentPersonnel: authPersonnel, isAdmin, handleGoogleSignIn } = useAuth();

  // State
  const [fiscalYear, setFiscalYear] = useState(getDefaultFiscalYear());
  const [activeTab, setActiveTab] = useState('self'); // 'dashboard' | 'self' | 'radar' | 'peers'
  const [personnelList, setPersonnelList] = useState([]);
  const [workAreas, setWorkAreas] = useState([]);
  const [assessments, setAssessments] = useState([]);
  
  // Current user's assessment state
  const [ratings, setRatings] = useState({});
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [lastUpdatedDate, setLastUpdatedDate] = useState('');

  // Modals
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [peerModalOpen, setPeerModalOpen] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [selectedPeerAssessment, setSelectedPeerAssessment] = useState(null);

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

  // Filter in Peer tab
  const [peerSearchQuery, setPeerSearchQuery] = useState('');
  const [peerDeptFilter, setPeerDeptFilter] = useState('all');

  // Active accordion section in Self Assessment
  const [activeAreaIdx, setActiveAreaIdx] = useState(0);

  // Subscribe personnel list
  useEffect(() => {
    const unsub = subscribePersonnelList((list) => {
      setPersonnelList(list || []);
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

    if (currentPersonnel) {
      const myEval = all.find((a) => a.personnelId === currentPersonnel.id);
      if (myEval) {
        setRatings(myEval.ratings || {});
        setLastUpdatedDate(myEval.updatedAt || '');
        setAiAnalysis(myEval.aiAnalysis || null);
      } else {
        setRatings({});
        setLastUpdatedDate('');
        setAiAnalysis(null);
      }
    }
  };

  useEffect(() => {
    loadYearData(fiscalYear);
  }, [fiscalYear, currentPersonnel?.id]);

  // Handle Rating Change for a sub-skill
  const handleRatingChange = (subSkillId, score) => {
    setRatings((prev) => ({
      ...prev,
      [subSkillId]: Number(score),
    }));
  };

  // Calculate user's live summary
  const userSummary = useMemo(() => {
    return calculateAssessmentSummary(workAreas, ratings);
  }, [workAreas, ratings]);

  // Save Self Assessment
  const handleSaveAssessment = async () => {
    if (!currentPersonnel) return;
    setIsSavingAssessment(true);
    try {
      const payload = {
        fiscalYear,
        personnelId: currentPersonnel.id,
        personnelName: currentPersonnel.name,
        department: currentPersonnel.department,
        position: currentPersonnel.position,
        ratings,
        summary: {
          totalSubSkills: userSummary.totalSubSkills,
          completedCount: userSummary.completedCount,
          averageScore: userSummary.overallAverage,
          competencyAverages: Object.fromEntries(
            Object.entries(userSummary.competencySummaries).map(([k, v]) => [k, v.averageScore])
          ),
        },
        aiAnalysis: aiAnalysis || undefined,
        submittedAt: lastUpdatedDate || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveSkillMapAssessment(payload);
      setLastUpdatedDate(payload.updatedAt);
      setSaveSuccessMsg(true);
      // Reload assessments list
      setAssessments(getAllAssessments(fiscalYear));

      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (e) {
      console.error('Save assessment error', e);
      alert('เกิดข้อผิดพลาดในการบันทึกผลการประเมิน');
    } finally {
      setIsSavingAssessment(false);
    }
  };

  // Run AI Analysis
  const handleRunAIAnalysis = async () => {
    if (!currentPersonnel || userSummary.completedCount === 0) {
      alert('กรุณาทำการประเมินทักษะอย่างน้อย 1 รายการก่อนขอรับบทวิเคราะห์');
      return;
    }

    setIsAnalyzingAI(true);
    try {
      const resp = await fetch('/api/skill-map/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personnel: currentPersonnel,
          assessment: { ratings, fiscalYear },
          workAreas,
        }),
      });

      const data = await resp.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
        // Automatically save analysis into assessment record
        await saveSkillMapAssessment({
          fiscalYear,
          personnelId: currentPersonnel.id,
          personnelName: currentPersonnel.name,
          department: currentPersonnel.department,
          position: currentPersonnel.position,
          ratings,
          summary: {
            totalSubSkills: userSummary.totalSubSkills,
            completedCount: userSummary.completedCount,
            averageScore: userSummary.overallAverage,
            competencyAverages: Object.fromEntries(
              Object.entries(userSummary.competencySummaries).map(([k, v]) => [k, v.averageScore])
            ),
          },
          aiAnalysis: data.analysis,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Fallback local intelligent analysis
        const fallback = generateIntelligentAnalysis(currentPersonnel, { ratings }, workAreas);
        setAiAnalysis(fallback);
      }
    } catch (e) {
      console.warn('AI analysis API error, falling back locally', e);
      const fallback = generateIntelligentAnalysis(currentPersonnel, { ratings }, workAreas);
      setAiAnalysis(fallback);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Prepare Radar Chart Data for Current User
  const userRadarData = useMemo(() => {
    const points = [];
    (workAreas || []).forEach((area) => {
      (area.competencies || []).forEach((comp) => {
        const compSumm = userSummary.competencySummaries[comp.id];
        const shortName = comp.name.length > 26 ? `${comp.name.substring(0, 24)}...` : comp.name;
        points.push({
          label: comp.name,
          shortLabel: shortName,
          value: compSumm?.averageScore || 0,
          maxVal: 5,
          color: area.color,
          areaName: area.shortName || area.name,
        });
      });
    });
    return points;
  }, [workAreas, userSummary]);

  // Overall Dashboard Statistics
  const dashboardStats = useMemo(() => {
    const totalStaff = personnelList.filter((p) => p.status === 'ปกติ').length || personnelList.length || 1;
    const completedAssessments = assessments.filter((a) => a.summary?.completedCount > 0);
    const completionRate = Math.round((completedAssessments.length / totalStaff) * 100);

    let orgTotalScore = 0;
    completedAssessments.forEach((a) => {
      orgTotalScore += a.summary?.averageScore || 0;
    });
    const orgAverage = completedAssessments.length > 0 ? Number((orgTotalScore / completedAssessments.length).toFixed(2)) : 0;

    return {
      totalStaff,
      assessedCount: completedAssessments.length,
      completionRate: Math.min(100, completionRate),
      orgAverage,
    };
  }, [personnelList, assessments]);

  // Filtered Peers in Peer Tab
  const filteredPeers = useMemo(() => {
    return personnelList.filter((p) => {
      if (peerDeptFilter !== 'all' && p.department !== peerDeptFilter) return false;
      if (peerSearchQuery.trim()) {
        const q = peerSearchQuery.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchDept = p.department?.toLowerCase().includes(q);
        const matchPos = p.position?.toLowerCase().includes(q);
        const matchEmail = p.email?.toLowerCase().includes(q);
        if (!matchName && !matchDept && !matchPos && !matchEmail) return false;
      }
      return true;
    });
  }, [personnelList, peerDeptFilter, peerSearchQuery]);

  // Unique department list
  const uniqueDepts = useMemo(() => {
    const set = new Set();
    personnelList.forEach((p) => {
      if (p.department) set.add(p.department);
    });
    return Array.from(set);
  }, [personnelList]);

  return (
    <div className="container" style={{ paddingBottom: '4rem', paddingTop: '1.25rem' }}>
      {/* 1. Header Section */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.25)',
                  color: '#C7D2FE',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Compass size={13} />
                <span>ICIT TALENT INTELLIGENCE</span>
              </span>

              <span
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#FDE68A',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                วิสัยทัศน์: &ldquo;{ICIT_VISION}&rdquo;
              </span>
            </div>

            <h1 style={{ margin: '0 0 6px 0', fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF' }}>
              Knowledge & Skill Map
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#E0E7FF', maxWidth: '650px', lineHeight: 1.5 }}>
              แผนที่ความรู้และทักษะบุคลากรสำนักคอมพิวเตอร์ฯ ครอบคลุม 4 ด้านงาน ประเมินตนเองระดับ 0-5 พร้อมบทวิเคราะห์ AI รายบุคคล
            </p>
          </div>

          {/* Right Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Fiscal Year Selector */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.1)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <Calendar size={15} color="#C7D2FE" style={{ marginRight: '6px' }} />
              <span style={{ fontSize: '0.8rem', color: '#C7D2FE', marginRight: '6px', fontWeight: 600 }}>ปีงบประมาณ:</span>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#FFFFFF',
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

            {/* HR / Admin Config Button */}
            {isHrOrAdmin && (
              <button
                type="button"
                onClick={() => setConfigModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
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
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
                }}
                title="จัดการโครงสร้างทักษะและโคลนจากปีก่อนหน้า"
              >
                <Settings size={15} />
                <span>ตั้งค่าโครงสร้างทักษะ (HR)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Rating Scale Explanatory Legend Banner (Always Accessible) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          padding: '1rem 1.25rem',
          border: '1px solid #E2E8F0',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1E293B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Target size={16} color="#4F46E5" />
          <span>เกณฑ์ระดับการประเมินความรู้และทักษะ (0 - 5 Scale)</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '8px',
          }}
        >
          {SKILL_RATING_LEVELS.map((lvl) => (
            <div
              key={lvl.score}
              style={{
                backgroundColor: lvl.bgColor,
                border: `1px solid ${lvl.color}30`,
                padding: '8px 10px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    backgroundColor: lvl.color,
                    color: '#FFFFFF',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                  }}
                >
                  {lvl.score}
                </span>
                <span style={{ fontWeight: 800, fontSize: '0.8rem', color: lvl.badgeColor }}>
                  {lvl.label}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.3 }}>
                {lvl.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Tab Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '2px solid #E2E8F0',
          marginBottom: '1.75rem',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('self')}
          style={{
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: '0.9rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'self' ? '#4F46E5' : '#64748B',
            borderBottom: activeTab === 'self' ? '3px solid #4F46E5' : '3px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Target size={17} />
          <span>🎯 ประเมินตนเองครบ 4 ด้านงาน</span>
          <span
            style={{
              backgroundColor: userSummary.completionPercentage === 100 ? '#ECFDF5' : '#EEF2FF',
              color: userSummary.completionPercentage === 100 ? '#059669' : '#4F46E5',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
            }}
          >
            {userSummary.completionPercentage}%
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          style={{
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: '0.9rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'radar' ? '#4F46E5' : '#64748B',
            borderBottom: activeTab === 'radar' ? '3px solid #4F46E5' : '3px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <TrendingUp size={17} />
          <span>🕸️ Spider Radar & บทวิเคราะห์ AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: '0.9rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'dashboard' ? '#4F46E5' : '#64748B',
            borderBottom: activeTab === 'dashboard' ? '3px solid #4F46E5' : '3px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Award size={17} />
          <span>📊 ภาพรวมสำนัก (Dashboard)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('peers')}
          style={{
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: '0.9rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'peers' ? '#4F46E5' : '#64748B',
            borderBottom: activeTab === 'peers' ? '3px solid #4F46E5' : '3px solid transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <Users size={17} />
          <span>👥 สมาชิกและผลประเมิน (Read-Only)</span>
        </button>
      </div>

      {/* 4. TAB 1: SELF ASSESSMENT TAB (4 Work Areas) */}
      {activeTab === 'self' && (
        <div>
          {/* Top Status & Sticky Save Bar */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              padding: '1rem 1.5rem',
              border: '1px solid #E2E8F0',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
            }}
          >
            {!currentPersonnel ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Lock size={20} color="#64748B" />
                  <span style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
                    กรุณาเข้าสู่ระบบเพื่อบันทึกผลการประเมินตนเอง
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <LogIn size={15} />
                  <span>เข้าสู่ระบบ KMUTNB</span>
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {currentPersonnel?.avatarUrl ? (
                    <img
                      src={currentPersonnel.avatarUrl}
                      alt=""
                      style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                      }}
                    >
                      {currentPersonnel?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
                      {currentPersonnel?.name || 'ผู้ใช้งาน'} ({currentPersonnel?.position || '-'})
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      ฝ่าย: {currentPersonnel?.department || '-'} &bull; ประเมินแล้ว{' '}
                      <strong style={{ color: '#4F46E5' }}>{userSummary.completedCount}</strong> จาก{' '}
                      {userSummary.totalSubSkills} รายการ ({userSummary.completionPercentage}%)
                      {lastUpdatedDate && ` • บันทึกล่าสุด ${formatDateDDMMYYYYBE(lastUpdatedDate)}`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {saveSuccessMsg && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontSize: '0.85rem', fontWeight: 700 }}>
                      <CheckCircle2 size={18} />
                      <span>บันทึกผลประเมินเรียบร้อยแล้ว</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveAssessment}
                    disabled={isSavingAssessment}
                    style={{
                      background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '9px 24px',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      cursor: isSavingAssessment ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                    }}
                  >
                    <Save size={16} />
                    <span>{isSavingAssessment ? 'กำลังบันทึก...' : 'บันทึกผลการประเมินตนเอง'}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 4 Work Areas Accordion / Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {workAreas.map((area, aIdx) => {
              const areaSumm = userSummary.areaSummaries[area.id];
              const isOpen = activeAreaIdx === aIdx;

              return (
                <div
                  key={area.id || aIdx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '1rem',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Area Header Bar */}
                  <div
                    onClick={() => setActiveAreaIdx(isOpen ? -1 : aIdx)}
                    style={{
                      padding: '1rem 1.5rem',
                      background: isOpen ? area.bgColor || '#F8FAFC' : '#FFFFFF',
                      borderLeft: `6px solid ${area.color || '#4F46E5'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0F172A' }}>
                          {aIdx + 1}. {area.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 10px',
                            borderRadius: '999px',
                            backgroundColor: area.color,
                            color: '#FFFFFF',
                          }}
                        >
                          {area.competencies?.length || 0} ด้านสมรรถนะ
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                        ความก้าวหน้า:{' '}
                        <strong>
                          {areaSumm?.completedCount || 0} / {areaSumm?.totalSubSkills || 0} รายการ
                        </strong>{' '}
                        • คะแนนเฉลี่ย:{' '}
                        <strong style={{ color: area.color }}>{areaSumm?.averageScore || 0} / 5.00</strong>
                      </div>
                    </div>

                    <div style={{ color: '#64748B' }}>
                      {isOpen ? <ChevronRight size={20} style={{ transform: 'rotate(90deg)' }} /> : <ChevronRight size={20} />}
                    </div>
                  </div>

                  {/* Area Competencies & Subskills Rating Form */}
                  {isOpen && (
                    <div style={{ padding: '1.5rem', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {(area.competencies || []).map((comp, cIdx) => {
                        const compSumm = userSummary.competencySummaries[comp.id];

                        return (
                          <div
                            key={comp.id || cIdx}
                            style={{
                              backgroundColor: '#FFFFFF',
                              borderRadius: '12px',
                              border: '1px solid #E2E8F0',
                              padding: '1.25rem',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: '1px solid #F1F5F9',
                                paddingBottom: '0.65rem',
                                marginBottom: '0.85rem',
                              }}
                            >
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BookOpen size={17} color={area.color} />
                                <span>{comp.name}</span>
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4F46E5' }}>
                                เฉลี่ย: {compSumm?.averageScore || 0} / 5.00
                              </span>
                            </div>

                            {/* Sub-skills Rating Rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {(comp.subSkills || []).map((sub, sIdx) => {
                                const currentScore = ratings[sub.id];

                                return (
                                  <div
                                    key={sub.id || sIdx}
                                    style={{
                                      padding: '10px 14px',
                                      backgroundColor: currentScore !== undefined ? '#F8FAFC' : '#FFFFFF',
                                      borderRadius: '8px',
                                      border: currentScore !== undefined ? '1px solid #E2E8F0' : '1px dashed #CBD5E1',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      flexWrap: 'wrap',
                                      gap: '12px',
                                    }}
                                  >
                                    <div style={{ flex: 1, minWidth: '280px' }}>
                                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                                        {sub.name}
                                      </div>
                                      <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>
                                        {sub.description}
                                      </div>
                                    </div>

                                    {/* 0 - 5 Rating Radio Badges */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {SKILL_RATING_LEVELS.map((lvl) => {
                                        const isSelected = currentScore === lvl.score;

                                        return (
                                          <button
                                            key={lvl.score}
                                            type="button"
                                            onClick={() => handleRatingChange(sub.id, lvl.score)}
                                            style={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: '42px',
                                              height: '38px',
                                              borderRadius: '8px',
                                              border: isSelected ? `2px solid ${lvl.color}` : '1px solid #CBD5E1',
                                              backgroundColor: isSelected ? lvl.color : '#FFFFFF',
                                              color: isSelected ? '#FFFFFF' : '#475569',
                                              fontWeight: 800,
                                              fontSize: '0.85rem',
                                              cursor: 'pointer',
                                              transition: 'all 0.15s ease',
                                              boxShadow: isSelected ? `0 3px 8px ${lvl.color}40` : 'none',
                                            }}
                                            title={`ระดับ ${lvl.score}: ${lvl.label} - ${lvl.description}`}
                                          >
                                            <span>{lvl.score}</span>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 600, opacity: isSelected ? 0.95 : 0.7 }}>
                                              {lvl.label.substring(0, 4)}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB 2: SPIDER RADAR & AI ANALYSIS TAB */}
      {activeTab === 'radar' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
          {/* Left: Spider Radar Chart */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1.25rem',
              padding: '1.5rem 1.75rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} color="#4F46E5" />
                  <span>Personalized Spider Radar</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                  {currentPersonnel?.name || 'บุคลากร'} &bull; แผนที่สมรรถนะรอบด้านเทียบเกณฑ์มาตรฐานระดับ 3
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>คะแนนเฉลี่ยรวม</span>
                <strong style={{ fontSize: '1.4rem', color: '#4F46E5', fontWeight: 900 }}>
                  {userSummary.overallAverage} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>/ 5.00</span>
                </strong>
              </div>
            </div>

            <SkillRadarChart data={userRadarData} size={460} themeColor="#4F46E5" />
          </div>

          {/* Right: AI Analysis & Strategic Alignment */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1.25rem',
              padding: '1.5rem 1.75rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="#EA580C" />
                  <span>บทวิเคราะห์ศักยภาพรายบุคคล (AI)</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                  เชื่อมโยงกับวิสัยทัศน์ &ldquo;{ICIT_VISION}&rdquo; และพันธกิจ 5 ด้านของสำนักฯ
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunAIAnalysis}
                disabled={isAnalyzingAI}
                style={{
                  background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isAnalyzingAI ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                }}
              >
                <RefreshCw size={14} className={isAnalyzingAI ? 'spin' : ''} />
                <span>{isAnalyzingAI ? 'กำลังวิเคราะห์...' : 'ประมวลผลบทวิเคราะห์ AI'}</span>
              </button>
            </div>

            {aiAnalysis ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                {/* 1. Top Strengths */}
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#166534', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <span>จุดเด่นและทักษะระดับสูง (Strengths):</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#15803D', lineHeight: 1.5 }}>
                    {aiAnalysis.strengths?.map((s, idx) => (
                      <li key={idx} style={{ marginBottom: '3px' }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Development Areas */}
                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#92400E', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Target size={16} color="#D97706" />
                    <span>ทักษะที่ควรเสริมและพัฒนา (Development Opportunities):</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#B45309', lineHeight: 1.5 }}>
                    {aiAnalysis.developmentAreas?.map((d, idx) => (
                      <li key={idx} style={{ marginBottom: '3px' }}>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. 5 Missions Alignment */}
                {aiAnalysis.missionAlignments && (
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E293B', marginBottom: '8px' }}>
                      ความพร้อมสนับสนุนพันธกิจ 5 ด้านของสำนักฯ:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {aiAnalysis.missionAlignments.map((m, idx) => (
                        <div key={m.missionId || idx} style={{ fontSize: '0.78rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontWeight: 600, color: '#334155' }}>
                              พันธกิจที่ {idx + 1}: {m.title}
                            </span>
                            <span style={{ fontWeight: 800, color: m.statusColor }}>
                              {m.score}/5 ({m.statusText})
                            </span>
                          </div>
                          <div style={{ height: '6px', width: '100%', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${(m.score / 5) * 100}%`,
                                backgroundColor: m.statusColor,
                                borderRadius: '999px',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Strategic Recommendations & Courses */}
                <div style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', padding: '1rem', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#3730A3', marginBottom: '6px' }}>
                    🎓 แนะนำหลักสูตรอบรมและแผนพัฒนา (IDP Recommended Courses):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {aiAnalysis.recommendedCourses?.map((c, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: '#FFFFFF',
                          color: '#4338CA',
                          border: '1px solid #A5B4FC',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  color: '#94A3B8',
                  textAlign: 'center',
                }}
              >
                <Sparkles size={40} color="#CBD5E1" style={{ marginBottom: '12px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#64748B' }}>
                  ยังไม่มีบทวิเคราะห์รายบุคคล
                </div>
                <p style={{ fontSize: '0.8rem', maxWidth: '340px', marginTop: '4px' }}>
                  กดปุ่ม &ldquo;ประมวลผลบทวิเคราะห์ AI&rdquo; เพื่อให้ระบบสร้างบทวิเคราะห์จุดแข็งและแนวทางการพัฒนาตามวิสัยทัศน์ของสำนักฯ
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. TAB 3: DASHBOARD OVERVIEW TAB */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPI Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>บุคลากรทั้งหมด</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                {dashboardStats.totalStaff} <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 600 }}>คน</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>ประเมินตนเองแล้ว</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#4F46E5', marginTop: '2px' }}>
                {dashboardStats.assessedCount} <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 600 }}>/ {dashboardStats.totalStaff} คน ({dashboardStats.completionRate}%)</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>คะแนนเฉลี่ยรวมทั้งสำนัก</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
                {dashboardStats.orgAverage} <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 600 }}>/ 5.00</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>ปีงบประมาณ</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#EA580C', marginTop: '2px' }}>
                {fiscalYear}
              </div>
            </div>
          </div>

          {/* 4 Work Areas Average Breakdown Table */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 900, color: '#0F172A' }}>
              ระดับความเชี่ยวชาญเฉลี่ยตาม 4 หมวดงานหลักของสำนักฯ
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {workAreas.map((area, idx) => {
                let areaScores = 0;
                let evalCount = 0;

                assessments.forEach((a) => {
                  const areaSumm = a.summary?.areaSummaries?.[area.id];
                  if (areaSumm && areaSumm.completedCount > 0) {
                    areaScores += areaSumm.averageScore;
                    evalCount++;
                  }
                });

                const areaOrgAvg = evalCount > 0 ? Number((areaScores / evalCount).toFixed(2)) : 0;

                return (
                  <div
                    key={area.id || idx}
                    style={{
                      borderLeft: `5px solid ${area.color}`,
                      backgroundColor: area.bgColor || '#F8FAFC',
                      padding: '1.25rem',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', marginBottom: '4px' }}>
                      {area.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '8px' }}>
                      {area.competencies?.length || 0} สมรรถนะ
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: area.color }}>
                      {areaOrgAvg} <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>/ 5.00</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 4: ALL PERSONNEL TAB (Read-Only Peer Assessment Matrix) */}
      {activeTab === 'peers' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0F172A' }}>
                รายชื่อบุคลากรและสถานะการประเมินทักษะ
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                สามารถกดดูผลประเมินและ Spider Radar ของเพื่อนร่วมงานได้แบบอ่านอย่างเดียว (Read-Only)
              </p>
            </div>

            {/* Search & Dept Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, ตำแหน่ง, ฝ่าย..."
                  value={peerSearchQuery}
                  onChange={(e) => setPeerSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 12px 6px 32px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    width: '220px',
                  }}
                />
              </div>

              <select
                value={peerDeptFilter}
                onChange={(e) => setPeerDeptFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <option value="all">ทุกฝ่ายงาน ({uniqueDepts.length})</option>
                {uniqueDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Peers Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', width: '60px' }}>ลำดับ</th>
                  <th style={{ padding: '10px 14px' }}>ชื่อ-นามสกุล / ตำแหน่ง</th>
                  <th style={{ padding: '10px 14px' }}>ฝ่ายงาน</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>สถานะการประเมิน</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>คะแนนเฉลี่ย</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>ประเมินล่าสุด</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '130px' }}>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredPeers.map((person, idx) => {
                  const evalRecord = assessments.find((a) => a.personnelId === person.id);
                  const isCompleted = evalRecord && evalRecord.summary?.completedCount > 0;
                  const isSelf = person.id === currentPersonnel?.id;

                  return (
                    <tr
                      key={person.id || idx}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: isSelf ? '#F5F3FF' : '#FFFFFF',
                      }}
                    >
                      <td style={{ padding: '12px 14px', color: '#64748B', fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {person.avatarUrl ? (
                            <img
                              src={person.avatarUrl}
                              alt=""
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: '#EEF2FF',
                                color: '#4F46E5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                              }}
                            >
                              {person.name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>
                              {person.name} {isSelf && <span style={{ color: '#4F46E5', fontSize: '0.75rem' }}>(คุณ)</span>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              {person.position}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>
                        {person.department}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {isCompleted ? (
                          <span
                            style={{
                              backgroundColor: '#ECFDF5',
                              color: '#059669',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            ✓ ประเมินแล้ว ({evalRecord.summary?.completionPercentage}%)
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: '#F1F5F9',
                              color: '#94A3B8',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            ยังไม่ประเมิน
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: '#4F46E5' }}>
                        {isCompleted ? `${evalRecord.summary?.averageScore} / 5.0` : '-'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748B', fontSize: '0.78rem' }}>
                        {evalRecord?.updatedAt ? formatDateDDMMYYYYBE(evalRecord.updatedAt) : '-'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPeer(person);
                            setSelectedPeerAssessment(evalRecord || null);
                            setPeerModalOpen(true);
                          }}
                          style={{
                            background: '#FFFFFF',
                            color: '#4F46E5',
                            border: '1px solid #C7D2FE',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={13} />
                          <span>ดูผลประเมิน</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. HR & Admin Configuration Modal */}
      <SkillMapConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        currentYear={fiscalYear}
        operatorName={currentPersonnel?.name || 'เจ้าหน้าที่บุคลากร'}
        onConfigSaved={(year) => loadYearData(year)}
      />

      {/* 9. Peer Detail Modal (Read-Only) */}
      <SkillMapPeerDetailModal
        isOpen={peerModalOpen}
        onClose={() => setPeerModalOpen(false)}
        personnel={selectedPeer}
        assessment={selectedPeerAssessment}
        workAreas={workAreas}
        fiscalYear={fiscalYear}
      />
    </div>
  );
}
