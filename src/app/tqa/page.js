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
        <div style={{ textAlign: 'center', color: '#6D28D9', fontWeight: 600 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #EDE9FE',
              borderTopColor: '#6D28D9',
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
          background: 'linear-gradient(135deg, #FAF5FF 0%, #F8FAFC 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '1.5rem',
            border: '1px solid #E2E8F0',
            padding: '2.5rem 2.25rem',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 15px -3px rgba(109, 40, 217, 0.3)',
            }}
          >
            <Award size={40} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: '#EDE9FE',
              color: '#6D28D9',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '1rem',
            }}
          >
            <Sparkles size={14} />
            <span>Thailand Quality Award (TQA / EdPEx)</span>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
            ระบบบริหารคุณภาพสู่ความเป็นเลิศ (TQA)
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
            กรุณาเข้าสู่ระบบด้วยบัญชี Google ของมหาวิทยาลัย (@icit.kmutnb.ac.th หรือ @cit.kmutnb.ac.th) เพื่อติดตามข้อเสนอแนะและผลการดำเนินงานตามเกณฑ์ TQA
          </p>

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
              background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
              borderColor: '#6D28D9',
              boxShadow: '0 4px 12px rgba(109, 40, 217, 0.25)',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <span>เข้าสู่ระบบด้วย Google Account</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '4rem' }}>
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3B0764 0%, #581C87 50%, #6D28D9 100%)',
          color: '#FFFFFF',
          padding: '3rem 1.5rem 4rem',
          position: 'relative',
          overflow: 'hidden',
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
              'radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(192, 132, 252, 0.15) 0%, transparent 40%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Link
              href="/"
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
                background: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(8px)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#FFFFFF',
              }}
            >
              <Award size={16} color="#FDE047" />
              <span>Thailand Quality Award (TQA / EdPEx)</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.15)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#DDD6FE',
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
            ระบบบริหารคุณภาพสู่ความเป็นเลิศ TQA
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: '#EDE9FE',
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
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.22)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#DDD6FE', fontWeight: 600 }}>
                <FileText size={16} color="#FDE047" />
                <span>OFI ทั้งหมด (ปี {currentFiscalYear})</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em' }}>
                {totalOfis} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#DDD6FE' }}>รายการ</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.22)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#DDD6FE', fontWeight: 600 }}>
                <CheckCircle2 size={16} color="#86EFAC" />
                <span>ดำเนินการเสร็จสิ้น</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', color: '#86EFAC', letterSpacing: '-0.02em' }}>
                {completedOfis} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#DDD6FE' }}>รายการ</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.22)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#DDD6FE', fontWeight: 600 }}>
                <Clock size={16} color="#93C5FD" />
                <span>กำลังดำเนินการ</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', color: '#93C5FD', letterSpacing: '-0.02em' }}>
                {inProgressOfis} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#DDD6FE' }}>รายการ</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.22)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#DDD6FE', fontWeight: 600 }}>
                <BarChart3 size={16} color="#FDE047" />
                <span>ความก้าวหน้ารวม</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', color: '#FDE047', letterSpacing: '-0.02em' }}>
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
                border: '1.5px solid #7C3AED',
                padding: '2rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -5px rgba(109, 40, 217, 0.12)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(109, 40, 217, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(109, 40, 217, 0.12)';
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
                    background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    boxShadow: '0 8px 16px -4px rgba(109, 40, 217, 0.4)',
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
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#6D28D9', marginTop: '4px' }}>
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
                    background: '#FAF5FF',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid #EDE9FE',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    color: '#4C1D95',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#7C3AED" />
                    <span>จำแนกตามปีงบประมาณ และหมวด 1 - 7</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#7C3AED" />
                    <span>มอบหมายผู้รายงานผลแบบหลายคน (Multi-assigned)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#7C3AED" />
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
                  color: '#6D28D9',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                <span>เข้าสู่ระบบติดตาม OFI</span>
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>

          {/* Card 2: Feedback Report Vault (Report link) */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '1.25rem',
              border: '1.5px solid #E2E8F0',
              padding: '2rem',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '1rem',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 16px -4px rgba(2, 132, 199, 0.3)',
                }}
              >
                <BookOpen size={28} />
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
                TQA Feedback Report
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0284C7', marginTop: '4px' }}>
                  คลังรายงานการประเมินตนเอง & ข้อเสนอแนะ
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
                {reportConfig?.reportTitle ||
                  `รายงานผลการตรวจประเมินคุณภาพการศึกษาภายใน ประจำปีการศึกษา ${currentFiscalYear} ตามเกณฑ์ TQA มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ`}
              </p>

              {reportConfig?.reportUrl ? (
                <a
                  href={reportConfig.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.75rem 1.25rem',
                    color: '#0284C7',
                    borderColor: '#BAE6FD',
                    background: '#F0F9FF',
                    fontWeight: 700,
                    textDecoration: 'none',
                    borderRadius: '10px',
                    marginBottom: '1rem',
                  }}
                >
                  <ExternalLink size={16} />
                  <span>เปิดอ่านรายงานฉบับเต็ม (PDF / Drive)</span>
                </a>
              ) : (
                <div
                  style={{
                    background: '#F8FAFC',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px dashed #CBD5E1',
                    fontSize: '0.85rem',
                    color: '#64748B',
                    marginBottom: '1rem',
                  }}
                >
                  {isAdmin
                    ? 'ยังไม่ได้ระบุลิงก์รายงาน (คลิก "ตั้งค่าลิงก์รายงาน" ในหน้า OFI Tracking เพื่อระบุ URL)'
                    : 'อยู่ระหว่างการจัดเตรียมเอกสารรายงาน'}
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
              เกณฑ์รางวัลคุณภาพแห่งชาติ Thailand Quality Award (TQA)
            </div>
          </div>
        </div>

        {/* 7 Categories Reference Grid */}
        <div style={{ marginTop: '3rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="#6D28D9" />
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
