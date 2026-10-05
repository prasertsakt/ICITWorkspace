'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Award,
  FileCheck,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  BarChart3,
  Users,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Target,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { subscribeTqaOfiItems, subscribeTqaReportConfig } from '@/lib/tqaOfiService';
import { getCurrentThaiFiscalYear } from '@/lib/dateUtils';
import { TQA_CATEGORIES } from '@/lib/tqaSeedData';

export default function TqaLandingPage() {
  const { currentUser, isAdmin, isLoading: authLoading, handleGoogleSignIn } = useAuth();
  const currentFiscalYear = String(getCurrentThaiFiscalYear());
  const [ofiItems, setOfiItems] = useState([]);
  const [reportConfig, setReportConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubOfis = subscribeTqaOfiItems(currentFiscalYear, (data) => {
      setOfiItems(data);
      setLoading(false);
    });
    const unsubReport = subscribeTqaReportConfig(currentFiscalYear, (cfg) => {
      setReportConfig(cfg);
    });

    return () => {
      unsubOfis();
      unsubReport();
    };
  }, [currentFiscalYear]);

  const totalOfis = ofiItems.length;
  const completedOfis = ofiItems.filter((i) => i.status === 'COMPLETED').length;
  const inProgressOfis = ofiItems.filter((i) => i.status === 'IN_PROGRESS').length;
  const pendingOfis = ofiItems.filter((i) => i.status === 'PENDING' || !i.status).length;
  const completionRate = totalOfis > 0 ? Math.round((completedOfis / totalOfis) * 100) : 0;

  if (authLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', color: '#EA580C', fontWeight: 600 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #FED7AA',
              borderTopColor: '#EA580C',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span>กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</span>
        </div>
      </div>
    );
  }

  // Authentication gate
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
            borderRadius: 'var(--radius-xl)',
            border: '1px solid #E2E8F0',
            borderTop: '5px solid #F97316',
            padding: '2.75rem 2.25rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12)',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#FFF7ED',
              color: '#EA580C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.15)',
            }}
          >
            <Award size={36} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: '#FFF7ED',
              color: '#EA580C',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '1rem',
              border: '1px solid #FFEDD5',
            }}
          >
            <Sparkles size={14} color="#EA580C" />
            <span>Thailand Quality Award (TQA / EdPEx)</span>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
            ระบบบริหารคุณภาพสู่ความเป็นเลิศ (TQA)
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
            กรุณาเข้าสู่ระบบด้วยบัญชี Google ของมหาวิทยาลัย (@icit.kmutnb.ac.th หรือ @cit.kmutnb.ac.th) เพื่อติดตามข้อเสนอแนะและผลการดำเนินงานตามเกณฑ์ TQA
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                justifyContent: 'center',
                gap: '10px',
                color: '#FFFFFF',
              }}
            >
              <span>เข้าสู่ระบบด้วย Google Account</span>
              <ArrowRight size={18} />
            </button>
            <Link
              href="/"
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
            >
              <ArrowLeft size={16} />
              <span>กลับสู่หน้าหลัก (Portal)</span>
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
          padding: '3rem 1.5rem 4rem',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.3)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'radial-gradient(circle at 10% 20%, rgba(249, 115, 22, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(251, 146, 60, 0.06) 0%, transparent 40%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Link
              href="/"
              style={{
                color: '#FED7AA',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={14} /> หน้าหลัก Portal
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(249, 115, 22, 0.22)',
                color: '#FED7AA',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                backdropFilter: 'blur(8px)',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              <Award size={16} color="#FB923C" />
              <span>Thailand Quality Award (TQA / EdPEx)</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#FED7AA',
              }}
            >
              <span>ปีงบประมาณ {currentFiscalYear}</span>
            </div>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 800,
              margin: '0 0 1rem 0',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}
          >
            ระบบบริหารคุณภาพสู่ความเป็นเลิศ{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              (TQA / EdPEx)
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: 'rgba(255, 255, 255, 0.78)',
              maxWidth: '720px',
              lineHeight: 1.6,
              margin: '0 0 2rem 0',
            }}
          >
            ศูนย์ติดตามการพัฒนาตามข้อเสนอแนะ (OFI Tracking) รายงานผลการประเมินตนเอง และการขับเคลื่อนเกณฑ์รางวัลคุณภาพแห่งชาติ สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ
          </p>

          {/* Quick Stats Grid */}
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
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#FED7AA', fontWeight: 600 }}>
                <FileText size={16} color="#FB923C" />
                <span>OFI ทั้งหมด (ปี {currentFiscalYear})</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {totalOfis} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#FED7AA' }}>รายการ</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#FED7AA', fontWeight: 600 }}>
                <CheckCircle2 size={16} color="#34D399" />
                <span>ดำเนินการเสร็จสิ้น</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', color: '#34D399', letterSpacing: '-0.02em' }}>
                {completedOfis} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#A7F3D0' }}>รายการ</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#FED7AA', fontWeight: 600 }}>
                <Clock size={16} color="#60A5FA" />
                <span>กำลังดำเนินการ</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', color: '#60A5FA', letterSpacing: '-0.02em' }}>
                {inProgressOfis} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#BFDBFE' }}>รายการ</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#FED7AA', fontWeight: 600 }}>
                <BarChart3 size={16} color="#FBBF24" />
                <span>ความก้าวหน้ารวม</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', color: '#FBBF24', letterSpacing: '-0.02em' }}>
                {completionRate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Services Container */}
      <div style={{ maxWidth: '1200px', margin: '-2rem auto 0', padding: '0 1.5rem', position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Card 1: TQA OFI Tracking (Active Main Module) */}
          <Link href="/tqa/ofi-tracking" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '1.25rem',
                border: '1.5px solid #F97316',
                padding: '2rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.12)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(249, 115, 22, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(249, 115, 22, 0.12)';
              }}
            >
              {/* Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: '#ECFDF5',
                  color: '#059669',
                  border: '1px solid #A7F3D0',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={13} />
                <span>เปิดให้บริการ</span>
              </div>

              <div>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '1rem',
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    boxShadow: '0 8px 16px -4px rgba(249, 115, 22, 0.4)',
                  }}
                >
                  <Target size={28} />
                </div>

                <h3
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: '0 0 0.75rem 0',
                    lineHeight: 1.3,
                  }}
                >
                  TQA OFI Tracking
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#EA580C', marginTop: '4px' }}>
                    ระบบติดตามการพัฒนาตามข้อเสนอแนะ TQA
                  </div>
                </h3>

                <p
                  style={{
                    fontSize: '0.925rem',
                    color: '#64748B',
                    lineHeight: 1.6,
                    margin: '0 0 1.5rem 0',
                  }}
                >
                  ติดตามความคืบหน้าการปรับปรุงตามข้อค้นพบ (Findings), หลักฐานเชิงประจักษ์ (Evidence) และคุณค่าเชิงกลยุทธ์ (Potential Impact) มอบหมายผู้รายงานผล และบันทึกผลการดำเนินงานแบบ WYSIWYG
                </p>

                {/* Highlights */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    background: '#FFF7ED',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid #FFEDD5',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    color: '#9A3412',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#EA580C" />
                    <span>จำแนกตามปีงบประมาณ และหมวด 1 - 7</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#EA580C" />
                    <span>มอบหมายผู้รายงานผลแบบหลายคน (Multi-assigned)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#EA580C" />
                    <span>รายงานผลด้วย WYSIWYG Editor พร้อมแนบลิงก์</span>
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid #F1F5F9',
                  color: '#EA580C',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                <span>เข้าสู่ระบบติดตาม OFI</span>
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>


        </div>

        {/* 7 Categories Reference Grid */}
        <div style={{ marginTop: '3rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="#EA580C" />
            <span>โครงสร้างเกณฑ์รางวัลคุณภาพแห่งชาติ 7 หมวด (TQA Criteria)</span>
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {TQA_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid #E2E8F0',
                  borderLeft: `4px solid ${cat.color}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: cat.color, marginBottom: '4px' }}>
                  {cat.num <= 6 ? 'หมวดกระบวนการ (Process)' : 'หมวดผลลัพธ์ (Results)'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>
                  {cat.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
