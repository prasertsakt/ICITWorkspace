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
  LogIn,
  ArrowLeft,
  Lightbulb,
  Sliders,
} from 'lucide-react';
import { subscribeImsAudits } from '@/lib/imsService';
import { subscribeCarIncidents } from '@/lib/carIncidentService';
import { subscribeOfiItems } from '@/lib/ofiHubService';
import { useAuth } from '@/context/AuthContext';
import ImsAuditTopicsModal from '@/components/ImsAuditTopicsModal';

export default function ImsLandingPage() {
  const { currentUser, isAdmin, isLoading: authLoading, handleGoogleSignIn } = useAuth();
  const [audits, setAudits] = useState([]);
  const [carIncidents, setCarIncidents] = useState([]);
  const [ofiItems, setOfiItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState(false);

  useEffect(() => {
    const unsubAudits = subscribeImsAudits((data) => {
      setAudits(data);
      setLoading(false);
    });
    const unsubCars = subscribeCarIncidents((data) => {
      setCarIncidents(data);
    });
    const unsubOfis = subscribeOfiItems((data) => {
      setOfiItems(data);
    });
    return () => {
      unsubAudits();
      unsubCars();
      unsubOfis();
    };
  }, []);

  const totalAudits = audits.length;
  const completedAudits = audits.filter((a) => a.status === 'COMPLETED').length;
  const cCount = audits.filter((a) => a.result === 'C').length;
  const ncCount = audits.filter((a) => a.result === 'NC').length;
  const ofiCount = audits.filter((a) => a.result === 'OFI').length;
  const totalCars = carIncidents.length;
  const activeCars = carIncidents.filter((c) => c.status === 'ON_PROGRESS').length;

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

  // Authentication Gate: User must log in first to access IMS
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
            <ShieldCheck size={36} />
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
            <Lock size={13} />
            <span>สงวนสิทธิ์เฉพาะผู้ใช้ที่เข้าสู่ระบบ</span>
          </div>

          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
            ระบบบริหารงาน IMS
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
            ศูนย์กลางกำกับดูแลมาตรฐานคุณภาพและความมั่นคงปลอดภัยสารสนเทศแบบบูรณาการ (ISO 9001 / ISO 27001) สำนักคอมพิวเตอร์ฯ มจพ.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 700,
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                color: '#FFFFFF',
              }}
            >
              <LogIn size={20} />
              <span>เข้าสู่ระบบด้วยบัญชี Google KMUTNB</span>
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
          padding: '3.5rem 1.5rem 4.5rem',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.3)',
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: 'absolute',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%)',
            top: '-100px',
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
            background: 'radial-gradient(circle, rgba(251, 146, 60, 0.06) 0%, transparent 70%)',
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
              <ShieldCheck size={16} color="#FB923C" />
              <span>Integrated Management System (ISO 9001:2015 & ISO/IEC 27001:2022)</span>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsTopicsModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 16px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(249, 115, 22, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                title="จัดการรายการหัวข้อที่รับการตรวจ (เพิ่ม / แก้ไข / ลบ / จัดเรียง / คืนค่าเริ่มต้น)"
              >
                <Sliders size={15} color="#FB923C" />
                <span>จัดการหัวข้อที่รับการตรวจ (Admin)</span>
              </button>
            )}
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
            ระบบบริหารงาน IMS{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              (Integrated Management System)
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
            ศูนย์กลางการกำกับดูแลมาตรฐานคุณภาพและความมั่นคงปลอดภัยสารสนเทศแบบบูรณาการ
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
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#FED7AA', fontWeight: 600 }}>
                <FileText size={16} color="#FB923C" />
                <span>รายการตรวจทั้งหมด</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {totalAudits}
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
                <span>ตรวจเสร็จสิ้นแล้ว</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '4px', color: '#34D399', letterSpacing: '-0.02em' }}>
                {completedAudits}
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
                <BarChart3 size={16} color="#FB923C" />
                <span>ผลการตรวจ (C / NC / OFI)</span>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.01em' }}>
                <span style={{ color: '#34D399' }}>{cCount} C</span> &bull;{' '}
                <span style={{ color: '#F87171' }}>{ncCount} NC</span> &bull;{' '}
                <span style={{ color: '#FBBF24' }}>{ofiCount} OFI</span>
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
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#EA580C',
              background: '#FFF7ED',
              border: '1px solid #FFEDD5',
              padding: '4px 10px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.5rem',
            }}
          >
            <Layers size={14} color="#EA580C" />
            <span>IMS SERVICES</span>
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
            บริการย่อยภายใต้ระบบบริหารงาน IMS
          </h2>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748B' }}>
            เลือกบริการที่ต้องการเข้าใช้งานและกำกับดูแลมาตรฐานคุณภาพ
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
                  <FileCheck size={28} />
                </div>

                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#EA580C', marginBottom: '0.35rem' }}>

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
                  การประเมินผลข้อค้นพบ (Findings) และสรุปประเภทความไม่สอดคล้อง (C, NC, OFI)
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
                    <span>แดชบอร์ดสรุปภาพรวม C, NC, OFI แบบเรียลไทม์</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#EA580C" />
                    <span>กำหนดสิทธิ์คณะผู้ตรวจติดตามและ Lead IA ประจำปีงบประมาณ</span>
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
                  color: '#EA580C',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                <span>เข้าสู่ระบบรายงานตรวจติดตาม</span>
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>

          {/* Sub-Service 2: CAR & Incident Hub (Active) */}
          <Link
            href="/ims/car-incident"
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
                border: '1.5px solid #F59E0B',
                padding: '2rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.1)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(245, 158, 11, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(245, 158, 11, 0.1)';
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
                <span>เปิดให้บริการ</span>
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
                  ระบบติดตามและบริหารจัดการใบแจ้งการแก้ไขและป้องกัน (Corrective Action Request: CAR) ตามแบบฟอร์ม
                  ICIT-FM-COMMON-013 Version 5.0 เชื่อมโยงข้อบกพร่องจากรายงานตรวจติดตามภายใน (NC)
                </p>

                {/* Feature Highlights */}
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
                    <CheckCircle2 size={16} color="#D97706" />
                    <span>แบบฟอร์ม ICIT-FM-COMMON-013 พร้อมพิมพ์เอกสาร</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#D97706" />
                    <span>ดึงข้อบกพร่อง (NC) จากรายงานการตรวจติดตามได้ทันที</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#D97706" />
                    <span>ติดตามแผน Corrective Actions และแจ้งเตือน DCC Reminder</span>
                  </div>
                </div>
              </div>

              {/* Action Link Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid #F1F5F9',
                  color: '#D97706',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                <span>เข้าสู่ศูนย์ CAR & Incident ({totalCars} รายการ)</span>
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>

          {/* Sub-Service 3: OFI Hub */}
          <Link
            href="/ims/ofi-hub"
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
                border: '1.5px solid #7C3AED',
                padding: '2rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.1)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(124, 58, 237, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(124, 58, 237, 0.1)';
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
                <span>เปิดให้บริการ</span>
              </div>

              <div>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '1rem',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    boxShadow: '0 8px 16px -4px rgba(124, 58, 237, 0.4)',
                  }}
                >
                  <Lightbulb size={28} />
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
                  OFI Hub
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569', marginTop: '4px' }}>
                    ศูนย์ติดตามโอกาสในการพัฒนา
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
                  ระบบติดตามและบริหารจัดการโอกาสในการพัฒนา (Opportunity for Improvement: OFI)
                  เชื่อมโยงข้อค้นพบจากรายงานตรวจติดตามภายใน (Internal Audit) พร้อมบันทึกความคืบหน้า มอบหมายผู้รับผิดชอบ และเครื่องมือ WYSIWYG
                </p>

                {/* Feature Highlights */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    background: '#FAF5FF',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid #F3E8FF',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    color: '#6B21A8',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#7C3AED" />
                    <span>ดึงข้อค้นพบ (OFI) จากรายงานการตรวจติดตามได้ทันที</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#7C3AED" />
                    <span>ติดตามแผนดำเนินงาน (Implement Yes/No) และสถานะ On Process</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#7C3AED" />
                    <span>DCC มอบหมายฝ่าย/ผู้รับผิดชอบ พร้อมกล่องเขียนรายละเอียด WYSIWYG</span>
                  </div>
                </div>
              </div>

              {/* Action Link Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid #F1F5F9',
                  color: '#7C3AED',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                <span>เข้าสู่ศูนย์ OFI Hub ({ofiItems.length} รายการ)</span>
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Admin Modal for Predefined Audit Topics Management */}
      <ImsAuditTopicsModal
        isOpen={isTopicsModalOpen}
        onClose={() => setIsTopicsModalOpen(false)}
        actor={{
          email: currentUser?.email,
          name: currentUser?.displayName || currentUser?.email || 'Admin',
        }}
      />
    </div>
  );
}
