'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  Share2,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Layers,
  Lock,
  LogIn,
  ExternalLink,
  Tag,
} from 'lucide-react';
import {
  subscribeKmRecords,
  calculateKmNotificationStatus,
} from '@/lib/kmHubService';
import {
  subscribeKmSharingRecords,
  subscribeKmSharingTags,
  DEFAULT_SHARING_TAGS,
} from '@/lib/kmSharingService';

export default function KMHubLandingPage() {
  const { currentUser, currentPersonnel, isAdmin, isLoading: isAuthLoading, handleGoogleSignIn } = useAuth();

  const [kmRecords, setKmRecords] = useState([]);
  const [sharingRecords, setSharingRecords] = useState([]);
  const [sharingTags, setSharingTags] = useState(DEFAULT_SHARING_TAGS);
  const [loading, setLoading] = useState(true);

  // Subscriptions
  useEffect(() => {
    const unsubKm = subscribeKmRecords((data) => {
      setKmRecords(data || []);
      setLoading(false);
    });

    const unsubSharing = subscribeKmSharingRecords((data) => {
      setSharingRecords(data || []);
    });

    const unsubTags = subscribeKmSharingTags((data) => {
      if (Array.isArray(data) && data.length > 0) setSharingTags(data);
    });

    return () => {
      unsubKm();
      unsubSharing();
      unsubTags();
    };
  }, []);

  // Overall combined statistics
  const stats = useMemo(() => {
    // 1. KM Tracking stats
    const totalKm = kmRecords.length;
    const completedKm = kmRecords.filter((r) => r.status === 'COMPLETED').length;
    const inProgressKm = kmRecords.filter((r) => r.status === 'IN_PROGRESS').length;
    let overdueKm = 0;
    kmRecords.forEach((r) => {
      const trk = calculateKmNotificationStatus(r);
      if (trk.isOverdue && r.status !== 'COMPLETED') overdueKm += 1;
    });
    const kmPercent = totalKm > 0 ? Math.round((completedKm / totalKm) * 100) : 0;

    // 2. Sharing stats
    const nowIso = new Date().toISOString().slice(0, 10);
    const totalSharing = sharingRecords.length;
    const upcomingSharing = sharingRecords.filter(
      (s) => s.status === 'SCHEDULED' || s.date >= nowIso
    ).length;
    const completedSharing = sharingRecords.filter((s) => s.status === 'COMPLETED').length;

    // Unique speakers
    const uniqueSpeakers = new Set();
    sharingRecords.forEach((s) => {
      (s.speakers || []).forEach((spk) => {
        if (spk.name || spk.email) uniqueSpeakers.add(spk.name || spk.email);
      });
    });

    // Unique attendees in KM
    const uniqueAttendees = new Set();
    kmRecords.forEach((r) => {
      (r.attendees || []).forEach((a) => {
        if (a.name || a.email) uniqueAttendees.add(a.name || a.email);
      });
    });

    return {
      totalKm,
      completedKm,
      inProgressKm,
      overdueKm,
      kmPercent,
      totalSharing,
      upcomingSharing,
      completedSharing,
      speakersCount: uniqueSpeakers.size,
      attendeesCount: uniqueAttendees.size,
      tagsCount: sharingTags.length,
    };
  }, [kmRecords, sharingRecords, sharingTags]);

  // Auth Loading
  if (isAuthLoading) {
    return (
      <div className="main-container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '3px solid #E2E8F0',
            borderTopColor: '#059669',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ marginTop: '1rem', color: '#64748B', fontSize: '0.9rem' }}>
          กำลังตรวจสอบสิทธิ์การเข้าใช้งาน KM Hub...
        </p>
      </div>
    );
  }

  // Auth Gate
  if (!currentUser && !currentPersonnel) {
    return (
      <div className="main-container" style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <div
          className="card-glass"
          style={{
            maxWidth: '520px',
            width: '100%',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '16px',
              background: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
            }}
          >
            <BookOpen size={36} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0F172A' }}>
            ศูนย์จัดการความรู้และการอบรม (KM Hub)
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT) &bull; มจพ.
            <br />
            ศูนย์รวมองค์ความรู้ การติดตามผลการอบรม และการแบ่งปันความรู้กลุ่มย่อย
          </p>

          <div
            style={{
              padding: '1rem',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              marginBottom: '1.75rem',
              textAlign: 'left',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
            }}
          >
            <Lock size={20} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.2rem' }}>
                บริการสารสนเทศภายใน (Required Login)
              </div>
              <p style={{ fontSize: '0.775rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                โปรดเข้าสู่ระบบด้วยบัญชี Google @cit.kmutnb.ac.th เพื่อเข้าใช้งานโมดูลจัดการความรู้
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleGoogleSignIn}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
              }}
            >
              <LogIn size={18} />
              <span>เข้าสู่ระบบด้วยบัญชี Google KMUTNB</span>
            </button>
            <Link
              href="/"
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.65rem 1.5rem', fontSize: '0.875rem', justifyContent: 'center' }}
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '4rem' }}>
      {/* Top Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #065F46 45%, #0F172A 100%)',
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
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
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
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
            bottom: '-150px',
            left: '5%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1180px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Top Breadcrumb Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.825rem',
                  color: '#A7F3D0',
                  textDecoration: 'none',
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                <span>กลับหน้าหลักพอร์ทัล</span>
              </Link>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>/</span>
              <span style={{ fontSize: '0.825rem', color: '#CBD5E1', fontWeight: 600 }}>
                KM Hub
              </span>
            </div>
          </div>

          {/* Title & Description */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
              >
                <BookOpen size={26} color="#FFFFFF" />
              </div>
              <h1
                style={{
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
                  fontWeight: 800,
                  margin: 0,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                }}
              >
                KM Hub • ศูนย์จัดการความรู้และการอบรม
              </h1>
            </div>
            <p style={{ fontSize: '0.925rem', color: '#CBD5E1', maxWidth: '780px', lineHeight: 1.6, margin: 0 }}>
              ระบบบริหารจัดการ จัดเก็บ ติดตาม และแบ่งปันองค์ความรู้บุคลากร สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ. ครอบคลุมการติดตามผลการฝึกอบรม-สัมมนา และการจองวันเวลาแบ่งปันความรู้ผ่านการบรรยายกลุ่มย่อย
            </p>
          </div>

          {/* Integrated High-Level Dashboard: 4 KPIs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            {/* KPI 1: หลักสูตรการอบรมที่จัดเก็บ */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
                  หลักสูตรการอบรมที่จัดเก็บ
                </span>
                <span style={{ fontSize: '0.72rem', color: '#A7F3D0', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                  KM Tracking
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
                {stats.totalKm}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>หลักสูตร</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6EE7B7', marginTop: '6px', fontWeight: 600 }}>
                แบ่งปันสำเร็จแล้ว {stats.completedKm}/{stats.totalKm} ({stats.kmPercent}%)
              </div>
            </div>

            {/* KPI 2: การบรรยายกลุ่มย่อย */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
                  การบรรยายกลุ่มย่อย
                </span>
                <span style={{ fontSize: '0.72rem', color: '#7DD3FC', background: 'rgba(56, 189, 248, 0.2)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                  Sharing Sessions
                </span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
                {stats.totalSharing}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>การบรรยาย</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7DD3FC', marginTop: '6px', fontWeight: 600 }}>
                กำลังจะมาถึง {stats.upcomingSharing} รายการ &bull; เสร็จสิ้น {stats.completedSharing}
              </div>
            </div>

            {/* KPI 3: ผู้บรรยายและผู้แชร์ความรู้ */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
                  ทำเนียบผู้บรรยาย
                </span>
                <Users size={16} color="#A7F3D0" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
                {stats.speakersCount}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>ท่าน</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '6px', fontWeight: 500 }}>
                จากบุคลากรทุกฝ่ายงานในสำนักฯ
              </div>
            </div>

            {/* KPI 4: หมวดหมู่แท็กองค์ความรู้ */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '1.15rem 1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
                  หมวดหมู่แท็กความรู้
                </span>
                <Tag size={16} color="#FDE68A" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FDE68A', lineHeight: 1 }}>
                {stats.tagsCount}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94A3B8' }}>แท็ก</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#FDE68A', marginTop: '6px', fontWeight: 600 }}>
                AI, M365, Cloud, Security, ฯลฯ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: 2 Service Module Cards */}
      <div style={{ maxWidth: '1180px', margin: '2.5rem auto 0', padding: '0 1.5rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 800,
              color: '#059669',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.35rem',
            }}
          >
            <Layers size={15} />
            <span>KM HUB MODULES & SERVICES</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0', lineHeight: 1.3 }}>
            โมดูลบริการภายใต้ระบบ KM Hub
          </h2>
          <p style={{ margin: 0, fontSize: '0.925rem', color: '#64748B' }}>
            เลือกโมดูลที่ต้องการใช้งาน เพื่อบันทึก ติดตามการอบรม หรือจองวันเวลาแบ่งปันความรู้กลุ่มย่อย
          </p>
        </div>

        {/* 2 Big Module Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.75rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Card 1: จัดเก็บ-ติดตามองค์ความรู้บุคลากร */}
          <Link
            href="/km-hub/tracking"
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <div
              className="card-glass"
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1.5px solid #E2E8F0',
                padding: '2rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#059669';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 30px -5px rgba(5, 150, 105, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.03)';
              }}
            >
              {/* Top Accent line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '5px',
                  background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
                }}
              />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)',
                    }}
                  >
                    <BookOpen size={28} />
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#065F46',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      padding: '4px 12px',
                      borderRadius: '999px',
                    }}
                  >
                    KM Tracking & Training
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                  จัดเก็บ-ติดตามองค์ความรู้บุคลากร
                </h3>

                <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
                  ระบบบันทึกและติดตามการแบ่งปันความรู้จากการฝึกอบรม-สัมมนา กำกับดูแลการส่งรายงานสรุปและสไลด์นำเสนอภายใน 2 เดือน พร้อมระบบแจ้งเตือนเตือนความจำอัตโนมัติ
                </p>

                {/* Metrics Breakdown */}
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '1rem',
                    border: '1px solid #E2E8F0',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{stats.totalKm}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>หลักสูตรทั้งหมด</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{stats.completedKm}</div>
                    <div style={{ fontSize: '0.72rem', color: '#059669' }}>ส่งรายงานแล้ว</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: stats.overdueKm > 0 ? '#DC2626' : '#64748B' }}>
                      {stats.overdueKm}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: stats.overdueKm > 0 ? '#DC2626' : '#64748B' }}>
                      เกินกำหนด 2 ด.
                    </div>
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
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>
                  เข้าสู่ระบบจัดเก็บ-ติดตามองค์ความรู้
                </span>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#ECFDF5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </Link>

          {/* Card 2: แบ่งปันความรู้ (บรรยายกลุ่มย่อย) */}
          <Link
            href="/km-hub/sharing"
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
          >
            <div
              className="card-glass"
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1.5px solid #E2E8F0',
                padding: '2rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0284C7';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 30px -5px rgba(2, 132, 199, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.03)';
              }}
            >
              {/* Top Accent line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '5px',
                  background: 'linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)',
                }}
              />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                      color: '#0284C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)',
                    }}
                  >
                    <Share2 size={28} />
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#0369A1',
                      background: '#E0F2FE',
                      border: '1px solid #BAE6FD',
                      padding: '4px 12px',
                      borderRadius: '999px',
                    }}
                  >
                    Group Lectures & Booking
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                  แบ่งปันความรู้ (บรรยายกลุ่มย่อย)
                </h3>

                <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
                  ระบบจองวันเวลาบรรยายกลุ่มย่อยสำหรับบุคลากรทุกคน ระบุผู้บรรยายสูงสุด 3 ท่าน แท็กหมวดหมู่องค์ความรู้ แนบลิงก์เอกสารประกอบ ปฏิทินแสดงผลกลาง และแจ้งเตือนผ่านอีเมล
                </p>

                {/* Metrics Breakdown */}
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '1rem',
                    border: '1px solid #E2E8F0',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{stats.totalSharing}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>การบรรยายทั้งหมด</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284C7' }}>{stats.upcomingSharing}</div>
                    <div style={{ fontSize: '0.72rem', color: '#0284C7' }}>กำลังจะมาถึง</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{stats.speakersCount}</div>
                    <div style={{ fontSize: '0.72rem', color: '#059669' }}>ทำเนียบผู้บรรยาย</div>
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
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0284C7' }}>
                  เข้าสู่ระบบแบ่งปันความรู้ (บรรยายกลุ่มย่อย)
                </span>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#E0F2FE',
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
