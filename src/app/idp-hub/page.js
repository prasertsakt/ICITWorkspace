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
import IDPConfigModal from '@/components/IDPConfigModal';

export default function IDPHubLandingPage() {
  const { currentUser, currentPersonnel, isAdmin, isLoading: authLoading, handleGoogleSignIn } = useAuth();
  const [fiscalYear, setFiscalYear] = useState('2569');
  const [idpRecords, setIdpRecords] = useState([]);
  const [idpConfig, setIdpConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

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

  // The 4 Core Divisions/Departments in ICIT (including สำนักงานผู้อำนวยการ)
  const MAIN_4_DEPTS = useMemo(
    () => [
      'สำนักงานผู้อำนวยการ',
      'ฝ่ายพัฒนาระบบสารสนเทศ',
      'ฝ่ายวิศวกรรมระบบเครือข่าย',
      'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
    ],
    []
  );

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

    // Breakdown for all 4 departments (รวมสำนักงานผู้อำนวยการ)
    const deptStats = MAIN_4_DEPTS.map((deptName) => {
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
  }, [idpRecords, MAIN_4_DEPTS]);

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
          background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
          color: '#FFFFFF',
          padding: '3.5rem 1.5rem 4.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: 'absolute',
            width: '450px',
            height: '450px',
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
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
            bottom: '-100px',
            left: '10%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
              <span>HUMAN RESOURCE DEVELOPMENT SYSTEM</span>
            </div>

            {/* Fiscal Year & Admin Config Button */}
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
                  {['2568', '2569', '2570', '2571', '2572'].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {isHR && (
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
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Settings size={14} style={{ color: '#FB923C' }} />
                  <span>ตั้งค่าสมรรถนะมาตรฐาน</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
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
              <Target size={28} color="#FFFFFF" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.2,
                  color: '#FFFFFF',
                }}
              >
                IDP Hub
              </h1>
            </div>
          </div>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)',
              color: '#CBD5E1',
              maxWidth: '720px',
              lineHeight: 1.6,
              margin: '0 0 1.75rem 0',
            }}
          >
            ศูนย์กลางการวิเคราะห์ความต้องการจำเป็น วางแผน และพัฒนาศักยภาพบุคลากรรายบุคคล สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.
          </p>

          {/* Quick Stat Counters */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              maxWidth: '820px',
            }}
          >
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
                <FileText size={16} color="#FB923C" />
                <span>แบบวิเคราะห์ทั้งหมด</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {stats.total} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#94A3B8' }}>ฉบับ</span>
              </div>
            </div>

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
                {stats.selfEvaluated} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#94A3B8' }}>ฉบับ</span>
              </div>
            </div>

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
                <CheckCircle2 size={16} color="#4ADE80" />
                <span>เสร็จสมบูรณ์ทั้ง 4 ฝ่าย</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', color: '#86EFAC', letterSpacing: '-0.02em' }}>
                {stats.completed} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#94A3B8' }}>/ {stats.total} ฉบับ</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '2px' }}>
                (เสร็จสิ้นแล้ว {stats.completedDepts}/4 ฝ่าย)
              </div>
            </div>
          </div>

          {/* 4 Departments Progress Quick Breakdown */}
          {stats.deptStats && stats.deptStats.length > 0 && (
            <div
              style={{
                marginTop: '1.25rem',
                maxWidth: '820px',
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '0.85rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} color="#FB923C" />
                <span>ความก้าวหน้าทั้ง 4 ฝ่าย:</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {stats.deptStats.map((d) => (
                  <div
                    key={d.name}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: '#E2E8F0', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.name}>
                      {d.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: d.isAllDone ? '#86EFAC' : '#FFFFFF' }}>
                        {d.completed}/{d.total} ฉบับ
                      </span>
                      <span style={{ fontSize: '0.75rem', color: d.isAllDone ? '#86EFAC' : '#FED7AA', fontWeight: 700 }}>
                        {d.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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

          {/* Sub-Service 2: Individual Development Plan (Coming Soon) */}
          <div
            className="card"
            style={{
              background: '#FFFFFF',
              borderRadius: '1.25rem',
              border: '1px solid #E2E8F0',
              padding: '1.75rem',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              opacity: 0.85,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    background: '#F1F5F9',
                    color: '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Compass size={26} />
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: '#F1F5F9',
                    color: '#64748B',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  กำลังพัฒนา (Coming Soon)
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#334155', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                แผนพัฒนาบุคลากรรายบุคคล (IDP Action Plan)
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
                จัดทำแผนปฏิบัติการพัฒนาตนเองรายบุคคล กำหนดเป้าหมายการเรียนรู้ กิจกรรมพัฒนา และระยะเวลาดำเนินการตามผลช่องว่างสมรรถนะ
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid #F1F5F9',
                color: '#94A3B8',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              <span>โมดูลระยะถัดไป</span>
              <Lock size={16} />
            </div>
          </div>

          {/* Sub-Service 3: IDP Tracking & Evaluation (Coming Soon) */}
          <div
            className="card"
            style={{
              background: '#FFFFFF',
              borderRadius: '1.25rem',
              border: '1px solid #E2E8F0',
              padding: '1.75rem',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              opacity: 0.85,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    background: '#F1F5F9',
                    color: '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={26} />
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: '#F1F5F9',
                    color: '#64748B',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  กำลังพัฒนา (Coming Soon)
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#334155', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                ติดตามและประเมินผลสัมฤทธิ์ (IDP Tracking)
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
                บันทึกประวัติและผลการเข้าร่วมการอบรม/สัมมนา/ศึกษาดูงาน และประเมินผลสัมฤทธิ์การพัฒนาตนเองเมื่อสิ้นสุดรอบปีงบประมาณ
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid #F1F5F9',
                color: '#94A3B8',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              <span>โมดูลระยะถัดไป</span>
              <Lock size={16} />
            </div>
          </div>
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
    </div>
  );
}
