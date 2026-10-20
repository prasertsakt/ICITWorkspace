'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  Tag,
  Plus,
  ChevronRight,
  BellRing,
  Settings,
  Sparkles,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Lock,
  LogIn,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import {
  subscribeKmSharingRecords,
  saveKmSharingRecord,
  deleteKmSharingRecord,
  subscribeKmSharingTags,
  saveKmSharingTags,
  subscribeKmSharingNotificationConfig,
  saveKmSharingNotificationConfig,
  sendKmSharingBookingNotification,
  DEFAULT_SHARING_TAGS,
} from '@/lib/kmSharingService';
import { subscribePersonnelList } from '@/lib/storageService';
import KMSharingCalendar from '@/components/KMSharingCalendar';
import KMSharingModal from '@/components/KMSharingModal';
import KMSharingDetailModal from '@/components/KMSharingDetailModal';
import KMSharingTagManageModal from '@/components/KMSharingTagManageModal';
import KMSharingEmailRecipientsModal from '@/components/KMSharingEmailRecipientsModal';
import KMSharingSummaryModal from '@/components/KMSharingSummaryModal';

export default function KMSharingPage() {
  const { currentUser, currentPersonnel, isAdmin, isLoading: isAuthLoading, handleGoogleSignIn } = useAuth();
  const { showAlert, showConfirm } = useModal();

  // Data
  const [sessions, setSessions] = useState([]);
  const [tags, setTags] = useState(DEFAULT_SHARING_TAGS);
  const [recipients, setRecipients] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState(null);
  const [initialBookingDate, setInitialBookingDate] = useState(null);

  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isRecipientsModalOpen, setIsRecipientsModalOpen] = useState(false);

  // Summary modal state (clicked on dashboard KPI)
  const [summaryDimension, setSummaryDimension] = useState(null); // 'TOTAL' | 'UPCOMING' | 'COMPLETED' | 'SPEAKERS' | 'TAGS' | null

  // Subscriptions
  useEffect(() => {
    const unsubSessions = subscribeKmSharingRecords((data) => {
      setSessions(data || []);
      setLoading(false);
    });

    const unsubTags = subscribeKmSharingTags((data) => {
      if (Array.isArray(data) && data.length > 0) setTags(data);
    });

    const unsubRecipients = subscribeKmSharingNotificationConfig((data) => {
      setRecipients(data || []);
    });

    const unsubPersonnel = subscribePersonnelList((data) => {
      setPersonnelList(data || []);
    });

    return () => {
      unsubSessions();
      unsubTags();
      unsubRecipients();
      unsubPersonnel();
    };
  }, []);

  // Dashboard Metrics Computation
  const stats = useMemo(() => {
    const total = sessions.length;
    const nowIso = new Date().toISOString().slice(0, 10);

    const upcoming = sessions.filter(
      (s) => s.status === 'SCHEDULED' || s.date >= nowIso
    ).length;

    const completed = sessions.filter((s) => s.status === 'COMPLETED').length;

    // Unique speakers
    const uniqueSpeakers = new Set();
    sessions.forEach((s) => {
      (s.speakers || []).forEach((spk) => {
        if (spk.email || spk.name) uniqueSpeakers.add(spk.email || spk.name);
      });
    });

    return {
      total,
      upcoming,
      completed,
      speakersCount: uniqueSpeakers.size,
      tagsCount: tags.length,
    };
  }, [sessions, tags]);

  // Handlers
  const handleOpenCreateModal = (dateStr = null) => {
    setSessionToEdit(null);
    setInitialBookingDate(dateStr || new Date().toISOString().slice(0, 10));
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (sess) => {
    setSessionToEdit(sess);
    setIsFormModalOpen(true);
  };

  const handleSelectSession = (sess) => {
    setSelectedSessionDetail(sess);
    setIsDetailModalOpen(true);
  };

  const handleSaveSession = async (payload) => {
    const isNew = !payload.id || !sessions.some((s) => s.id === payload.id);
    const actor = {
      name: currentPersonnel?.name || currentUser?.displayName || 'ผู้ใช้งาน',
      email: currentUser?.email || currentPersonnel?.email || '',
      department: currentPersonnel?.department || '',
      role: isAdmin ? 'Admin' : 'User',
    };

    const saved = await saveKmSharingRecord(payload, actor);
    setIsFormModalOpen(false);
    setSessionToEdit(null);

    await showAlert({
      type: 'success',
      title: isNew ? 'จองการบรรยายสำเร็จ' : 'บันทึกการแก้ไขสำเร็จ',
      message: `บันทึกข้อมูลการบรรยาย "${payload.topic}" เรียบร้อยแล้ว`,
    });

    // Auto-send email notification in background
    sendKmSharingBookingNotification({
      record: saved,
      recipients,
      allPersonnelList: personnelList,
      actor,
      actionType: isNew ? 'CREATED' : 'UPDATED',
    }).then((res) => {
      if (res && res.success) {
        console.log('Notification email dispatched successfully');
      }
    });
  };

  const handleDeleteSession = async (sess) => {
    const confirmed = await showConfirm({
      type: 'danger',
      title: 'ยืนยันการลบการบรรยาย',
      message: `คุณต้องการลบรายการบรรยาย "${sess.topic}" ออกจากระบบใช่หรือไม่?`,
      confirmText: 'ยืนยันการลบ',
      cancelText: 'ยกเลิก',
    });

    if (confirmed) {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'ผู้ใช้งาน',
        email: currentUser?.email || currentPersonnel?.email || '',
        department: currentPersonnel?.department || '',
      };
      await deleteKmSharingRecord(sess.id, actor);
      setIsDetailModalOpen(false);
      setSelectedSessionDetail(null);

      await showAlert({
        type: 'success',
        title: 'ลบข้อมูลสำเร็จ',
        message: 'ลบรายการบรรยายกลุ่มย่อยเรียบร้อยแล้ว',
      });
    }
  };

  // 1. Auth Loading
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
          กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
        </p>
      </div>
    );
  }

  // 2. Auth Required Gate
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
            <Share2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0F172A' }}>
            แบ่งปันความรู้ (บรรยายกลุ่มย่อย)
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT) &bull; มจพ.
            <br />
            ระบบจองวันเวลา จัดการ และเผยแพร่องค์ความรู้การบรรยายกลุ่มย่อย
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
                สงวนสิทธิ์เฉพาะบุคลากรภายใน (Required Login)
              </div>
              <p style={{ fontSize: '0.775rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                โปรดเข้าสู่ระบบด้วยบัญชี Google @cit.kmutnb.ac.th เพื่อจองวันเวลาและดูรายละเอียดการบรรยาย
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
              href="/km-hub"
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.65rem 1.5rem', fontSize: '0.875rem', justifyContent: 'center' }}
            >
              กลับสู่ KM Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container" style={{ padding: '1.75rem 1rem 4rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Breadcrumb Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/km-hub"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: '#047857',
              textDecoration: 'none',
              fontWeight: 700,
              background: '#ECFDF5',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid #A7F3D0',
            }}
          >
            <ArrowLeft size={14} />
            <span>กลับสู่ KM Hub</span>
          </Link>
          <span style={{ color: '#CBD5E1' }}>/</span>
          <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
            แบ่งปันความรู้ (บรรยายกลุ่มย่อย)
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setIsRecipientsModalOpen(true)}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '20px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                }}
                title="ตั้งค่าผู้รับอีเมลแจ้งเตือนเมื่อมีการจองการบรรยาย"
              >
                <BellRing size={14} color="#059669" />
                <span>ผู้รับอีเมลแจ้งเตือน ({recipients.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTagModalOpen(true)}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '20px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                }}
                title="จัดการแท็กเนื้อหาองค์ความรู้"
              >
                <Tag size={14} color="#D97706" />
                <span>จัดการแท็ก ({tags.length})</span>
              </button>
            </>
          )}

          {/* Booking Button for EVERYONE */}
          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="btn btn-primary btn-sm"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#FFFFFF',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 800,
              fontSize: '0.85rem',
              padding: '0.55rem 1.25rem',
              borderRadius: '20px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
            }}
          >
            <Plus size={16} />
            <span>จองวันเวลาบรรยายใหม่</span>
          </button>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #065F46 100%)',
          borderRadius: '20px',
          padding: '2rem 2.25rem',
          color: '#FFFFFF',
          marginBottom: '1.75rem',
          boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '750px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#A7F3D0',
                padding: '3px 10px',
                borderRadius: '999px',
                letterSpacing: '0.5px',
              }}
            >
              KM HUB SUBMODULE • KNOWLEDGE SHARING
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 1.85rem)',
              fontWeight: 800,
              margin: '0 0 0.5rem 0',
              lineHeight: 1.3,
              color: '#FFFFFF',
            }}
          >
            แบ่งปันความรู้ (บรรยายกลุ่มย่อย)
          </h1>
          <p
            style={{
              fontSize: '0.9rem',
              color: '#D1FAE5',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            ระบบจองวันเวลาบรรยายกลุ่มย่อย เผยแพร่ และแลกเปลี่ยนองค์ความรู้ภายในสำนักคอมพิวเตอร์ฯ บุคลากรทุกคนสามารถจองวันเวลา ระบุผู้บรรยาย (สูงสุด 3 ท่าน) แท็กเนื้อหา และแนบเอกสารเพื่อเผยแพร่ให้บุคลากรทราบ
          </p>
        </div>

        {/* Ambient Decorative element */}
        <div
          style={{
            position: 'absolute',
            right: '-40px',
            bottom: '-40px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Minimal Dashboard: 5 Important and Necessary KPI Cards (Clickable for Summary) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={16} color="#059669" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
              สรุปภาพรวมการแบ่งปันความรู้ (คลิกที่การ์ดเพื่อดูสรุปรายละเอียด)
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            💡 คลิกการ์ดใดก็ได้เพื่อเปิดหน้าต่างสรุปและกรองข้อมูล
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px',
          }}
        >
          {/* Card 1: การบรรยายทั้งหมด */}
          <div
            onClick={() => setSummaryDimension('TOTAL')}
            className="card-glass"
            style={{
              padding: '1.15rem 1.25rem',
              borderRadius: '16px',
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderTop: '4px solid #059669',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(5, 150, 105, 0.15)';
              e.currentTarget.style.borderColor = '#059669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>
                  การบรรยายทั้งหมด
                </span>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#ECFDF5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BookOpen size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#065F46', lineHeight: 1.1 }}>
                {stats.total}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>รายการ</span>
              </div>
            </div>
            <div style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 700, marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>คลิกดูภาพรวมทั้งหมด</span>
              <ChevronRight size={13} />
            </div>
          </div>

          {/* Card 2: กำลังจะมาถึง / เดือนนี้ */}
          <div
            onClick={() => setSummaryDimension('UPCOMING')}
            className="card-glass"
            style={{
              padding: '1.15rem 1.25rem',
              borderRadius: '16px',
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderTop: '4px solid #0284C7',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(2, 132, 199, 0.15)';
              e.currentTarget.style.borderColor = '#0284C7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>
                  กำลังจะมาถึง / รอดำเนินการ
                </span>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#E0F2FE',
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0369A1', lineHeight: 1.1 }}>
                {stats.upcoming}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>รายการ</span>
              </div>
            </div>
            <div style={{ fontSize: '0.725rem', color: '#0284C7', fontWeight: 700, marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>คลิกดูรายการที่รอจัด</span>
              <ChevronRight size={13} />
            </div>
          </div>

          {/* Card 3: บรรยายเสร็จสิ้นแล้ว */}
          <div
            onClick={() => setSummaryDimension('COMPLETED')}
            className="card-glass"
            style={{
              padding: '1.15rem 1.25rem',
              borderRadius: '16px',
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderTop: '4px solid #10B981',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(16, 185, 129, 0.15)';
              e.currentTarget.style.borderColor = '#10B981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>
                  บรรยายเสร็จสิ้นแล้ว
                </span>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#ECFDF5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
                {stats.completed}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>รายการ</span>
              </div>
            </div>
            <div style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 700, marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>คลิกดูรายการที่เสร็จสิ้น</span>
              <ChevronRight size={13} />
            </div>
          </div>

          {/* Card 4: ผู้บรรยายสะสม */}
          <div
            onClick={() => setSummaryDimension('SPEAKERS')}
            className="card-glass"
            style={{
              padding: '1.15rem 1.25rem',
              borderRadius: '16px',
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderTop: '4px solid #8B5CF6',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(139, 92, 246, 0.15)';
              e.currentTarget.style.borderColor = '#8B5CF6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>
                  ทำเนียบผู้บรรยาย
                </span>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#F5F3FF',
                    color: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#6D28D9', lineHeight: 1.1 }}>
                {stats.speakersCount}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>ท่าน</span>
              </div>
            </div>
            <div style={{ fontSize: '0.725rem', color: '#7C3AED', fontWeight: 700, marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>คลิกดูทำเนียบผู้บรรยาย</span>
              <ChevronRight size={13} />
            </div>
          </div>

          {/* Card 5: หมวดหมู่แท็กองค์ความรู้ */}
          <div
            onClick={() => setSummaryDimension('TAGS')}
            className="card-glass"
            style={{
              padding: '1.15rem 1.25rem',
              borderRadius: '16px',
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderTop: '4px solid #D97706',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(217, 119, 6, 0.15)';
              e.currentTarget.style.borderColor = '#D97706';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
              e.currentTarget.style.borderColor = '#E2E8F0';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>
                  แท็กองค์ความรู้
                </span>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Tag size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#B45309', lineHeight: 1.1 }}>
                {stats.tagsCount}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>หมวดหมู่</span>
              </div>
            </div>
            <div style={{ fontSize: '0.725rem', color: '#B45309', fontWeight: 700, marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>คลิกดูการกระจายแท็ก</span>
              <ChevronRight size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Calendar Section */}
      <KMSharingCalendar
        sessions={sessions}
        tags={tags}
        onSelectSession={handleSelectSession}
        onOpenCreateModal={handleOpenCreateModal}
      />

      {/* Booking / Edit Modal */}
      {isFormModalOpen && (
        <KMSharingModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setSessionToEdit(null);
          }}
          onSave={handleSaveSession}
          sessionToEdit={sessionToEdit}
          initialDate={initialBookingDate}
          personnelList={personnelList}
          availableTags={tags}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          isAdmin={isAdmin}
        />
      )}

      {/* Session Details Modal */}
      {isDetailModalOpen && selectedSessionDetail && (
        <KMSharingDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedSessionDetail(null);
          }}
          session={selectedSessionDetail}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteSession}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          isAdmin={isAdmin}
        />
      )}

      {/* Admin Tag Management Modal */}
      {isTagModalOpen && (
        <KMSharingTagManageModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          tags={tags}
          sessions={sessions}
          onSaveTags={async (newTags) => {
            const actor = {
              name: currentPersonnel?.name || currentUser?.displayName || 'Admin',
              email: currentUser?.email || '',
            };
            await saveKmSharingTags(newTags, actor);
            setTags(newTags);
            await showAlert({
              type: 'success',
              title: 'บันทึกแท็กสำเร็จ',
              message: `บันทึกรายการแท็กองค์ความรู้ ${newTags.length} รายการเรียบร้อยแล้ว`,
            });
          }}
        />
      )}

      {/* Admin Email Recipients Modal */}
      {isRecipientsModalOpen && (
        <KMSharingEmailRecipientsModal
          isOpen={isRecipientsModalOpen}
          onClose={() => setIsRecipientsModalOpen(false)}
          recipients={recipients}
          personnelList={personnelList}
          onSaveRecipients={async (newList) => {
            const actor = {
              name: currentPersonnel?.name || currentUser?.displayName || 'Admin',
              email: currentUser?.email || '',
            };
            await saveKmSharingNotificationConfig(newList, actor);
            setRecipients(newList);
            await showAlert({
              type: 'success',
              title: 'บันทึกการตั้งค่าสำเร็จ',
              message: `บันทึกรายชื่อผู้รับอีเมลแจ้งเตือน ${newList.length} รายชื่อเรียบร้อยแล้ว`,
            });
          }}
        />
      )}

      {/* Clickable Dashboard Summary Modal */}
      {summaryDimension && (
        <KMSharingSummaryModal
          isOpen={Boolean(summaryDimension)}
          onClose={() => setSummaryDimension(null)}
          dimension={summaryDimension}
          sessions={sessions}
          tags={tags}
          onSelectSession={handleSelectSession}
        />
      )}
    </div>
  );
}
