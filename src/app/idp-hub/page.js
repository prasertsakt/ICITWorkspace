'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Target,
  FileCheck,
  Compass,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  BarChart3,
  Users,
  ChevronRight,
  Lock,
  LogIn,
  ArrowLeft,
  Settings,
  Calendar,
  UserCheck,
  Building2,
} from 'lucide-react';
import { subscribeIdpRecords, subscribeIdpConfig, isHrOfficer } from '@/lib/idpService';
import { useAuth } from '@/context/AuthContext';
import { MAIN_6_DEPTS } from '@/lib/constants';
import IDPConfigModal from '@/components/IDPConfigModal';
import IDPStrategyConfigModal from '@/components/IDPStrategyConfigModal';
import { getCurrentThaiFiscalYear, getAvailableFiscalYears } from '@/lib/dateUtils';

export default function IDPHubLandingPage() {
  const { currentUser, currentPersonnel, isAdmin, isLoading: authLoading, handleGoogleSignIn } = useAuth();
  const [fiscalYear, setFiscalYear] = useState(() => String(getCurrentThaiFiscalYear()));
  const [idpRecords, setIdpRecords] = useState([]);
  const [idpConfig, setIdpConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);

  const isHR = isHrOfficer(currentUser, currentPersonnel, isAdmin);

  useEffect(() => {
    setLoading(true);
    const unsubRecords = subscribeIdpRecords(fiscalYear, (data) => {
      setIdpRecords(data || []);
      setLoading(false);
    });

    const unsubConfig = subscribeIdpConfig(fiscalYear, (cfg) => {
      setIdpConfig(cfg);
    });

    return () => {
      unsubRecords();
      unsubConfig();
    };
  }, [fiscalYear]);

  // Statistics
  const stats = useMemo(() => {
    const total = idpRecords.length;
    const selfEvaluated = idpRecords.filter(
      (r) => r.signatures?.evaluatorSelf?.signed || r.status === 'SELF_EVALUATED'
    ).length;
    const supervisorEvaluated = idpRecords.filter(
      (r) => r.signatures?.evaluatorSupervisor?.signed || r.signatures?.evaluatorDeputyDirector?.signed
    ).length;
    const completed = idpRecords.filter((r) => r.status === 'COMPLETED').length;

    // Breakdown for all 6 main departments
    const deptStats = MAIN_6_DEPTS.map((deptName) => {
      const deptRecords = idpRecords.filter((r) => r.department === deptName);
      const dTotal = deptRecords.length;
      const dCompleted = deptRecords.filter((r) => r.status === 'COMPLETED').length;
      const dSelf = deptRecords.filter(
        (r) => r.signatures?.evaluatorSelf?.signed || r.status === 'SELF_EVALUATED'
      ).length;
      const percent = dTotal > 0 ? Math.round((dCompleted / dTotal) * 100) : 0;
      return {
        name: deptName,
        total: dTotal,
        completed: dCompleted,
        selfDone: dSelf,
        percent,
        isAllDone: dTotal > 0 && dCompleted === dTotal,
      };
    });

    const completedDepts = deptStats.filter((d) => d.isAllDone).length;

    return {
      total,
      selfEvaluated,
      supervisorEvaluated,
      completed,
      deptStats,
      completedDepts,
    };
  }, [idpRecords]);

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
        }}
      >
        <div style={{ textAlign: 'center', color: '#EA580C', fontWeight: 600 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #FFEDD5',
              borderTopColor: '#EA580C',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span>กำลังตรวจสอบสิทธิ์การเข้าใช้งาน IDP Hub...</span>
        </div>
      </div>
    );
  }

  // Authentication Gate: User must log in first to access IDP Hub
  if (!currentUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #FFF7ED 0%, #F8FAFC 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '1.5rem',
            border: '1px solid #FED7AA',
            padding: '2.5rem 2.25rem',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(249, 115, 22, 0.08), 0 8px 10px -6px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.35)',
            }}
          >
            <Target size={38} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: '#FFF7ED',
              color: '#C2410C',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: '1px solid #FFEDD5',
              marginBottom: '1rem',
            }}
          >
            <Lock size={13} />
            <span>สงวนสิทธิ์เฉพาะบุคลากรที่เข้าสู่ระบบ</span>
          </div>

          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
            ระบบพัฒนาบุคลากรรายบุคคล (IDP Hub)
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
            ศูนย์กลางการวิเคราะห์ความต้องการจำเป็น วางแผน และพัฒนาศักยภาพบุคลากรรายบุคคล สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              }}
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
              <span>กลับสู่หน้าหลัก</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '4rem' }}>
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #0F172A 100%)',
          color: '#FFFFFF',
          padding: '2.5rem 1.5rem 3.5rem',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Subtle Ambient Glowing Gradients */}
        <div
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.12) 0%, transparent 70%)',
            top: '-200px',
            right: '-100px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
            bottom: '-150px',
            left: '5%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1160px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Top Bar: System Badge + Year Selector & Admin Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 14px',
                borderRadius: '999px',
                background: 'rgba(249, 115, 22, 0.15)',
                color: '#FED7AA',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.4px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Sparkles size={13} color="#FB923C" />
              <span>HUMAN RESOURCE DEVELOPMENT SYSTEM</span>
            </div>

            {/* Fiscal Year & Admin Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <Calendar size={14} color="#FB923C" />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94A3B8' }}>ปีงบประมาณ:</span>
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  style={{
                    background: '#FFFFFF',
                    color: '#0F172A',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {getAvailableFiscalYears().map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {isHR && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsStrategyModalOpen(true)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      color: '#E2E8F0',
                      padding: '5px 12px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backdropFilter: 'blur(8px)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = '#E2E8F0';
                    }}
                  >
                    <Compass size={14} style={{ color: '#A5B4FC' }} />
                    <span>ตั้งค่าประเด็นยุทธศาสตร์</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(true)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      color: '#E2E8F0',
                      padding: '5px 12px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backdropFilter: 'blur(8px)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = '#E2E8F0';
                    }}
                  >
                    <Settings size={14} style={{ color: '#FB923C' }} />
                    <span>ตั้งค่าสมรรถนะมาตรฐาน</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.4rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
                }}
              >
                <Target size={22} color="#FFFFFF" />
              </div>
              <h1
                style={{
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: '-0.025em',
                  color: '#FFFFFF',
                }}
              >
                IDP Hub
              </h1>
            </div>

            <p
              style={{
                fontSize: '0.875rem',
                color: '#94A3B8',
                maxWidth: '680px',
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              ศูนย์กลางการวิเคราะห์ความต้องการจำเป็น วางแผน และพัฒนาศักยภาพบุคลากรรายบุคคล สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.
            </p>
          </div>

          {/* Clean Integrated Dashboard: 3 KPIs on Left + 6 Depts Progress on Right */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
              alignItems: 'stretch',
            }}
          >
            {/* Left Column: 3 Sleek Key Stat Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {/* Stat 1: Total Assessments */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '14px',
                  padding: '1rem 1.15rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
                    แบบวิเคราะห์ทั้งหมด
                  </span>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(249, 115, 22, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={15} color="#FB923C" />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {stats.total}{' '}
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>ฉบับ</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px' }}>
                    เป้าหมายบุคลากรทั้ง 6 ฝ่าย
                  </div>
                </div>
              </div>

              {/* Stat 2: Self Evaluated */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '14px',
                  padding: '1rem 1.15rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
                    ประเมินตนเองแล้ว
                  </span>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UserCheck size={15} color="#38BDF8" />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7DD3FC', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {stats.selfEvaluated}{' '}
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>ฉบับ</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#38BDF8', marginTop: '6px', fontWeight: 600 }}>
                    {stats.total > 0 ? Math.round((stats.selfEvaluated / stats.total) * 100) : 0}% ของบุคลากรทั้งหมด
                  </div>
                </div>
              </div>

              {/* Stat 3: Completed Across 6 Depts */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '14px',
                  padding: '1rem 1.15rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  gridColumn: '1 / -1',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'rgba(74, 222, 128, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle2 size={15} color="#4ADE80" />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 700 }}>
                      เสร็จสมบูรณ์ภาพรวม (Completed)
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: stats.completedDepts === 6 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      color: stats.completedDepts === 6 ? '#86EFAC' : '#CBD5E1',
                    }}
                  >
                    เสร็จครบ {stats.completedDepts}/6 ฝ่าย
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#86EFAC', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {stats.completed}{' '}
                    <span style={{ fontSize: '0.825rem', fontWeight: 500, color: '#64748B' }}>/ {stats.total} ฉบับ</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#86EFAC' }}>
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </span>
                </div>

                {/* Mini Progress Bar */}
                <div
                  style={{
                    width: '100%',
                    height: '5px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '999px',
                    marginTop: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #38BDF8 0%, #4ADE80 100%)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: 6 Operational Departments Progress */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.85rem',
                  paddingBottom: '0.65rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={16} color="#FB923C" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                    ความก้าวหน้าการประเมิน 6 ฝ่ายงาน
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  {stats.deptStats?.reduce((sum, d) => sum + d.completed, 0)}/{stats.total} ดำเนินการแล้ว
                </span>
              </div>

              {/* 6 Departments Grid (2 columns x 3 rows) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.65rem',
                }}
              >
                {(stats.deptStats || []).map((d) => {
                  const DEPT_SHORT_NAMES = {
                    'สำนักงานผู้อำนวยการ': 'สำนักงานผู้อำนวยการ',
                    'ฝ่ายวิศวกรรมระบบเครือข่าย': 'วิศวกรรมระบบเครือข่าย',
                    'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย': 'บริการวิชาการ & ส่งเสริมวิจัย',
                    'ฝ่ายพัฒนาระบบสารสนเทศ': 'พัฒนาระบบสารสนเทศ',
                    'ฝ่ายเทคโนโลยีสารสนเทศ วิทยาเขตปราจีนบุรี': 'ไอที วิทยาเขตปราจีนบุรี',
                    'ฝ่ายเทคโนโลยีสารสนเทศ วิทยาเขตระยอง': 'ไอที วิทยาเขตระยอง',
                  };
                  const shortName = DEPT_SHORT_NAMES[d.name] || d.name;

                  return (
                    <div
                      key={d.name}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '10px',
                        padding: '0.6rem 0.85rem',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                      }}
                      title={d.name}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#E2E8F0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {shortName}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: d.isAllDone ? '#86EFAC' : d.percent > 0 ? '#7DD3FC' : '#64748B',
                            flexShrink: 0,
                          }}
                        >
                          {d.completed}/{d.total} ({d.percent}%)
                        </span>
                      </div>

                      {/* Micro Progress Bar */}
                      <div
                        style={{
                          width: '100%',
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${d.percent}%`,
                            height: '100%',
                            background: d.isAllDone
                              ? '#4ADE80'
                              : d.percent > 0
                              ? '#38BDF8'
                              : 'transparent',
                            borderRadius: '999px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Main Container */}
      <div
        style={{
          maxWidth: '1100px',
          margin: '2.5rem auto 0',
          padding: '0 1.5rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#EA580C',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.35rem',
            }}
          >
            <Layers size={15} />
            <span>IDP HUB SERVICES</span>
          </div>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 0.35rem 0',
              lineHeight: 1.3,
            }}
          >
            บริการย่อยภายใต้ระบบ IDP Hub
          </h2>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748B' }}>
            วิเคราะห์สมรรถนะ วางแผน และติดตามการพัฒนาตนเอง
          </p>
        </div>

        {/* Sub-Services Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Sub-Service 1: IDP Need Analysis Form (Active) */}
          <Link
            href="/idp-hub/need-analysis"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <div
              className="card"
              style={{
                background: '#FFFFFF',
                borderRadius: '1.25rem',
                border: '1.5px solid #E2E8F0',
                padding: '1.75rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#F97316';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(249, 115, 22, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 16px -4px rgba(249, 115, 22, 0.35)',
                    }}
                  >
                    <FileCheck size={26} />
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: '#DCFCE7',
                      color: '#15803D',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      border: '1px solid #BBF7D0',
                    }}
                  >
                    เปิดให้บริการ
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                  แบบวิเคราะห์ความต้องการจำเป็น (IDP Need Analysis)
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
                  ประเมินระดับสมรรถนะหลัก (Core) และสมรรถนะตามตำแหน่งงาน (Functional) ตามเกณฑ์ มจพ. คำนวณคะแนนคาดหวัง คะแนนประเมินได้ Gap และลงนาม 3 ฝ่าย
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid #F1F5F9',
                  color: '#EA580C',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                <span>เข้าสู่แบบวิเคราะห์ ({stats.total} รายการ)</span>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#FFF7ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#EA580C',
                  }}
                >
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </Link>

          {/* Sub-Service: Knowledge & Skill Map (Active) */}
          <Link
            href="/idp-hub/skill-map"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <div
              className="card"
              style={{
                background: '#FFFFFF',
                borderRadius: '1.25rem',
                border: '1.5px solid #E2E8F0',
                padding: '1.75rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4F46E5';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(79, 70, 229, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.35)',
                    }}
                  >
                    <Compass size={26} />
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: '#DCFCE7',
                      color: '#15803D',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      border: '1px solid #BBF7D0',
                    }}
                  >
                    เปิดให้บริการ
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                  แผนที่ความรู้และทักษะ (Knowledge & Skill Map)
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
                  ประเมินทักษะ 4 ด้านงานตามโครงสร้าง 3 ระดับ (เกณฑ์ 0-5) พร้อม Personalized Spider Radar และ AI วิเคราะห์ความพร้อมต่อพันธกิจสำนักฯ
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid #F1F5F9',
                  color: '#4F46E5',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                <span>เข้าสู่แผนที่ความรู้และทักษะ</span>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4F46E5',
                  }}
                >
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </Link>

          {/* Sub-Service 2: Individual Development Plan (Active) */}
          <Link
            href="/idp-hub/action-plan"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <div
              className="card"
              style={{
                background: '#FFFFFF',
                borderRadius: '1.25rem',
                border: '1.5px solid #E2E8F0',
                padding: '1.75rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#EA580C';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(234, 88, 12, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 16px -4px rgba(234, 88, 12, 0.35)',
                    }}
                  >
                    <Target size={26} />
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: '#DCFCE7',
                      color: '#15803D',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      border: '1px solid #BBF7D0',
                    }}
                  >
                    เปิดให้บริการ
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                  แผนพัฒนาบุคลากรรายบุคคล (IDP Action Plan)
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
                  จัดทำแผนพัฒนาสมรรถนะที่มี Gap กำหนดเป้าหมาย วิธีการพัฒนา 10 รูปแบบ รายงานผลรายไตรมาส (Q1-Q4) และประเมินผลสัมฤทธิ์
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid #F1F5F9',
                  color: '#EA580C',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                <span>เข้าสู่แผนพัฒนา IDP Action Plan</span>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#FFF7ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#EA580C',
                  }}
                >
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </Link>


        </div>
      </div>

      {/* Master Competency Config Modal for HR / Admin */}
      {isConfigModalOpen && (
        <IDPConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          currentFiscalYear={fiscalYear}
          initialConfig={idpConfig}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          onSaved={(cfg) => {
            setIdpConfig(cfg);
            setIsConfigModalOpen(false);
          }}
        />
      )}

      {/* Master Strategy & SFA Config Modal for HR / Admin */}
      {isStrategyModalOpen && (
        <IDPStrategyConfigModal
          isOpen={isStrategyModalOpen}
          onClose={() => setIsStrategyModalOpen(false)}
          currentFiscalYear={fiscalYear}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          onSaved={() => {
            setIsStrategyModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
