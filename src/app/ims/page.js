'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileCheck,
  AlertOctagon,
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
  Compass,
} from 'lucide-react';
import { subscribeImsAudits } from '@/lib/imsService';

export default function ImsLandingPage() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeImsAudits((data) => {
      setAudits(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalAudits = audits.length;
  const completedAudits = audits.filter((a) => a.status === 'COMPLETED').length;
  const cCount = audits.filter((a) => a.result === 'C').length;
  const ncCount = audits.filter((a) => a.result === 'NC').length;
  const ofiCount = audits.filter((a) => a.result === 'OFI').length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '4rem' }}>
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 40%, #0284C7 100%)',
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
              marginBottom: '1.25rem',
            }}
          >
            <ShieldCheck size={16} color="#A7F3D0" />
            <span>Integrated Management System (ISO 9001:2015 & ISO/IEC 27001:2022)</span>
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
            ระบบบริหารงาน IMS
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: '#CCFBF1',
              maxWidth: '720px',
              lineHeight: 1.6,
              margin: '0 0 2rem 0',
            }}
          >
            ศูนย์กลางการกำกับดูแลมาตรฐานคุณภาพและความมั่นคงปลอดภัยสารสนเทศแบบบูรณาการ
            ขับเคลื่อนกระบวนการตรวจติดตามภายใน (Internal Audit) พร้อมยกระดับสู่ระบบบริหารจัดการข้อบกพร่องและอุบัติการณ์
          </p>

          {/* Quick Stat Counters */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              maxWidth: '780px',
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#CCFBF1', fontWeight: 500 }}>
                รายการตรวจติดตามทั้งหมด
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px' }}>
                {totalAudits}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#CCFBF1', fontWeight: 500 }}>
                ตรวจเสร็จสิ้นแล้ว
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px', color: '#A7F3D0' }}>
                {completedAudits}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#CCFBF1', fontWeight: 500 }}>
                ผลการตรวจ (C / NC / OFI)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px' }}>
                <span style={{ color: '#A7F3D0' }}>{cCount} C</span> •{' '}
                <span style={{ color: '#FECACA' }}>{ncCount} NC</span> •{' '}
                <span style={{ color: '#FDE68A' }}>{ofiCount} OFI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          maxWidth: '1100px',
          margin: '-2.5rem auto 0',
          padding: '0 1.5rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1E293B',
              margin: '0 0 0.5rem 0',
            }}
          >
            บริการย่อยภายใต้ระบบบริหารงาน IMS
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>
            เลือกบริการที่ต้องการเข้าใช้งาน
          </p>
        </div>

        {/* 2 Sub-Services Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Sub-Service 1: Internal Audit Report (Active) */}
          <Link
            href="/ims/audit"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '1.25rem',
                border: '1.5px solid #0D9488',
                padding: '2rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.1)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(13, 148, 136, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(13, 148, 136, 0.1)';
              }}
            >
              {/* Active Badge */}
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
                <span>เปิดใช้งานแล้ว</span>
              </div>

              <div>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '1rem',
                    background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    boxShadow: '0 8px 16px -4px rgba(13, 148, 136, 0.4)',
                  }}
                >
                  <FileCheck size={28} />
                </div>

                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0D9488', marginBottom: '0.35rem' }}>
                  บริการที่ 1
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
                  Internal Audit Report
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569', marginTop: '4px' }}>
                    ระบบรายงานการตรวจติดตามภายใน
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
                  แดชบอร์ดสรุปผลการตรวจติดตามภายในตามรอบปีงบประมาณ กระบวนการเสนอแผนตรวจผ่าน Lead IA อนุมัติ
                  การประเมินผลข้อค้นพบ (Findings) และสรุปประเภทความไม่สอดคล้อง (C, NC, OFI) ทั้ง 23 หัวข้อตรวจ
                </p>

                {/* Highlights */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    background: '#F8FAFC',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    color: '#334155',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#0D9488" />
                    <span>แดชบอร์ดสรุปภาพรวม C, NC, OFI แบบเรียลไทม์</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#0D9488" />
                    <span>กำหนดสิทธิ์คณะผู้ตรวจติดตามและ Lead IA ประจำปี</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#0D9488" />
                    <span>23 หัวข้อตรวจมาตรฐาน ISO 9001 / ISO 27001</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid #F1F5F9',
                  color: '#0D9488',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                <span>เข้าสู่ระบบรายงานตรวจติดตาม</span>
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>

          {/* Sub-Service 2: CAR & Incident Hub (Coming Soon) */}
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
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              opacity: 0.92,
            }}
          >
            {/* Coming Soon Badge */}
            <div
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                padding: '4px 10px',
                borderRadius: '999px',
                background: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #FDE68A',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Clock size={13} />
              <span>Coming Soon</span>
            </div>

            <div>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '1rem',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 16px -4px rgba(245, 158, 11, 0.3)',
                }}
              >
                <AlertOctagon size={28} />
              </div>

              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#D97706', marginBottom: '0.35rem' }}>
                บริการที่ 2
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
                CAR & Incident Hub
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569', marginTop: '4px' }}>
                  ศูนย์จัดการข้อบกพร่องและอุบัติการณ์
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
                ระบบติดตามและบริหารจัดการใบแจ้งการแก้ไขและป้องกัน (Corrective Action Request: CAR)
                พร้อมศูนย์รับแจ้งและตอบสนองอุบัติการณ์ด้านความมั่นคงปลอดภัยสารสนเทศ (Security Incident)
              </p>

              {/* Feature Preview List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  background: '#FFFBEB',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid #FEF3C7',
                  marginBottom: '1.5rem',
                  fontSize: '0.85rem',
                  color: '#92400E',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} />
                  <span>ออกใบ CAR อัตโนมัติเมื่อพบผลตรวจเป็น NC</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} />
                  <span>แบบฟอร์มวิเคราะห์ Root Cause และแผนแก้ไขปรับปรุง</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} />
                  <span>การรับแจ้งเหตุการณ์ Incident และการสืบสวนตามมาตรฐาน</span>
                </div>
              </div>
            </div>

            {/* In Development Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid #F1F5F9',
                color: '#94A3B8',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <span>กำลังอยู่ระหว่างการพัฒนา</span>
              <Lock size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
