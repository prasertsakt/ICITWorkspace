'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  subscribePersonnelList,
  subscribeDepartmentList,
  subscribeExecutiveList,
  subscribePortalServicesOrder,
  savePortalServicesOrder,
  DEFAULT_SERVICE_ORDER,
} from '@/lib/storageService';
import { PREDEFINED_DEPARTMENTS, PERSONNEL_STATUS } from '@/lib/constants';
import { formatToBuddhistDate, formatThaiDisplayDate } from '@/lib/dateUtils';
import {
  Building2,
  Users,
  UserCheck,
  ShieldCheck,
  Award,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  ExternalLink,
  Laptop,
  CalendarCheck,
  Wrench,
  FileText,
  Lock,
  ChevronRight,
  ChevronLeft,
  LogIn,
  CheckCircle2,
  BookOpen,
  HeartHandshake,
  GripVertical,
  MoveHorizontal,
  RotateCcw,
} from 'lucide-react';

export default function PortalLandingPage() {
  const { currentUser, currentPersonnel, isAdmin, handleGoogleSignIn } = useAuth();
  const [personnelList, setPersonnelList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [executiveList, setExecutiveList] = useState([]);

  // Moveable / Rearrangeable Service Cards State
  const [serviceOrder, setServiceOrder] = useState(DEFAULT_SERVICE_ORDER);
  const [isRearranging, setIsRearranging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    const unsubPersonnel = subscribePersonnelList((list) => setPersonnelList(list || []));
    const unsubDepts = subscribeDepartmentList((list) => setDepartmentList(list || []));
    const unsubExecs = subscribeExecutiveList((list) => setExecutiveList(list || []));
    const unsubOrder = subscribePortalServicesOrder((order) => {
      if (Array.isArray(order) && order.length > 0) {
        const fullOrder = [...order];
        DEFAULT_SERVICE_ORDER.forEach((id) => {
          if (!fullOrder.includes(id)) fullOrder.push(id);
        });
        setServiceOrder(fullOrder);
      }
    });

    return () => {
      unsubPersonnel();
      unsubDepts();
      unsubExecs();
      unsubOrder();
    };
  }, []);

  // Reorder handlers
  const moveService = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= serviceOrder.length || fromIndex === toIndex) return;
    const next = [...serviceOrder];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setServiceOrder(next);
    await savePortalServicesOrder(next);
  };

  const handleResetOrder = async () => {
    if (window.confirm('คุณต้องการรีเซ็ตลำดับการ์ดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      setServiceOrder(DEFAULT_SERVICE_ORDER);
      await savePortalServicesOrder(DEFAULT_SERVICE_ORDER);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    await moveService(draggedIndex, dropIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const todayBuddhistDate = formatToBuddhistDate(new Date());
  const activePersonnelCount = personnelList.filter((p) => p.status === PERSONNEL_STATUS.ACTIVE).length;

  return (
    <div className="main-container">
      {/* Top Welcome Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 40%, #FFF1F2 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem 1.75rem',
          marginBottom: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(199, 210, 254, 0.45)',
          boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.08)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '780px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span
              className="badge"
              style={{
                background: 'white',
                color: 'var(--primary-600)',
                border: '1px solid var(--primary-200)',
                boxShadow: 'var(--shadow-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px 4px 6px',
              }}
            >
              <img src="/icit-logo.png" alt="ICIT" style={{ height: '16px', width: 'auto', objectFit: 'contain' }} />
              <span>ICIT PORTAL &bull; ศูนย์รวมระบบสารสนเทศ</span>
            </span>

            <span
              className="badge"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Calendar size={13} />
              {formatThaiDisplayDate(todayBuddhistDate)}
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              marginBottom: '0.75rem',
            }}
          >
            {currentPersonnel ? (
              <>
                สวัสดี, <span style={{ color: 'var(--primary-600)' }}>{currentPersonnel.name}</span> 👋
              </>
            ) : (
              <>
                <span style={{ color: 'var(--primary-600)' }}>ICIT Workspace Portal</span>
              </>
            )}
          </h1>

          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {currentPersonnel ? (
              <>
                สังกัด <strong>{currentPersonnel.department}</strong> &bull; ตำแหน่ง{' '}
                <strong>
                  {currentPersonnel.position}{currentPersonnel.level ? ` (${currentPersonnel.level})` : ''}
                </strong>
                <br />
                เข้าถึงระบบสารสนเทศ โครงสร้างองค์กร และบริการดิจิทัลทั้งหมดได้จากหน้านี้
              </>
            ) : (
              'ศูนย์รวมระบบสารสนเทศภายในองค์กร'
            )}
          </p>
        </div>
      </section>

      {/* Main Systems Grid */}
      <section style={{ marginBottom: '2.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              🚀 ระบบสารสนเทศและบริการ
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isRearranging
                ? '💡 ลากการ์ดเพื่อสลับตำแหน่ง หรือใช้ปุ่ม ◀ ▶ บนการ์ดแต่ละใบ'
                : 'เลือกระบบงานที่ต้องการเข้าใช้งาน'}
            </p>
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isRearranging ? (
                <>
                  <button
                    onClick={handleResetOrder}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="คืนค่าการจัดเรียงกลับเป็นค่าเริ่มต้น"
                  >
                    <RotateCcw size={13} />
                    <span>คืนค่าเริ่มต้น</span>
                  </button>
                  <button
                    onClick={() => setIsRearranging(false)}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <CheckCircle2 size={14} />
                    <span>เสร็จสิ้น</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsRearranging(true)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: 'var(--primary-300)',
                    color: 'var(--primary-700)',
                    background: 'var(--primary-50)',
                  }}
                  title="คลิกเพื่อสลับและจัดลำดับการ์ดบริการ"
                >
                  <MoveHorizontal size={14} />
                  <span>จัดเรียงการ์ดบริการ</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid-3" style={{ gap: '1.25rem' }}>
          {serviceOrder.map((serviceId, index) => {
            let cardData = null;

            if (serviceId === 'org') {
              cardData = {
                title: 'โครงสร้างองค์กรและทำเนียบบุคลากร',
                desc: 'ผังโครงสร้าง 6 ฝ่ายงานหลัก คณะฝ่ายบริหาร และทำเนียบบุคลากรพร้อมระบบค้นหาและตัวกรอง',
                href: '/organization',
                isExternal: false,
                icon: <Building2 size={24} />,
                iconBg: 'var(--primary-50)',
                iconColor: 'var(--primary-600)',
                borderColor: 'var(--primary-500)',
                badge: (
                  <span className="badge badge-active">
                    <span className="pulse-dot" />
                    เปิดให้บริการ
                  </span>
                ),
                footerLeft: `${PREDEFINED_DEPARTMENTS.length} ฝ่าย • ${personnelList.length} บุคลากร`,
                footerRight: (
                  <span style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    เข้าใช้งาน <ArrowRight size={15} />
                  </span>
                ),
              };
            } else if (serviceId === 'profile') {
              cardData = {
                title: 'ข้อมูลของฉัน (Personal Profile)',
                desc: 'บัตรประจำตัวดิจิทัล คำนวณอายุงาน นับถอยหลังวันเกษียณราชการ และสายการบังคับบัญชา',
                href: '/profile',
                isExternal: false,
                icon: <UserCheck size={24} />,
                iconBg: 'var(--mint-50)',
                iconColor: 'var(--mint-500)',
                borderColor: 'var(--mint-500)',
                badge: <span className="badge badge-user">ข้อมูลส่วนบุคคล</span>,
                footerLeft: currentPersonnel ? `เข้าสู่ระบบในชื่อ: ${currentPersonnel.name}` : 'ต้องเข้าสู่ระบบเพื่อใช้งาน',
                footerRight: (
                  <span style={{ color: 'var(--mint-600)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    เข้าใช้งาน <ArrowRight size={15} />
                  </span>
                ),
              };
            } else if (serviceId === 'attendance') {
              cardData = {
                title: 'ระบบขอลงเวลา',
                desc: 'ยื่นคำขอลงเวลามา/กลับปฏิบัติราชการ กระบวนการอนุมัติ 4 ขั้นตอน พร้อมระบบแจ้งเตือนทางอีเมล',
                href: '/time-attendance',
                isExternal: false,
                icon: <Clock size={24} />,
                iconBg: '#EEF2FF',
                iconColor: '#4F46E5',
                borderColor: '#4F46E5',
                badge: (
                  <span className="badge badge-active">
                    <span className="pulse-dot" />
                    เปิดให้บริการ
                  </span>
                ),
                footerLeft: currentPersonnel ? 'คลิกเพื่อเข้าสู่ระบบใบลงเวลา' : 'ต้องเข้าสู่ระบบเพื่อใช้งาน',
                footerRight: (
                  <span style={{ color: '#4F46E5', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    เข้าใช้งาน <ArrowRight size={15} />
                  </span>
                ),
              };
            } else if (serviceId === 'leave') {
              cardData = {
                title: 'ปฏิทินวันลา (Leave Calendar)',
                desc: 'แดชบอร์ดสรุปสถิติและปฏิทินแสดงวันลาป่วย ลากิจ ลาพักผ่อน และขาดงานของบุคลากร',
                href: '/leave',
                isExternal: false,
                icon: <Calendar size={24} />,
                iconBg: 'var(--peach-50)',
                iconColor: 'var(--peach-500)',
                borderColor: 'var(--peach-500)',
                badge: (
                  <span className="badge badge-active">
                    <span className="pulse-dot" />
                    เปิดให้บริการ
                  </span>
                ),
                footerLeft: currentPersonnel ? 'คลิกเพื่อดูปฏิทินวันลา' : 'ต้องเข้าสู่ระบบเพื่อใช้งาน',
                footerRight: (
                  <span style={{ color: 'var(--peach-500)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    เข้าใช้งาน <ArrowRight size={15} />
                  </span>
                ),
              };
            } else if (serviceId === 'knowledge') {
              cardData = {
                title: 'ICIT Personal Knowledge Map',
                desc: 'แผนที่องค์ความรู้และทักษะความเชี่ยวชาญเฉพาะบุคคลของบุคลากรภายในสำนัก',
                href: 'https://script.google.com/macros/s/AKfycbzRNmWQ9gDvjPvV-Grx-7B3WK54dd-J7q6LiIYeuqSAXMLNOepAPof1ofRMSCikx2BK/exec',
                isExternal: true,
                icon: <BookOpen size={24} />,
                iconBg: '#EDE9FE',
                iconColor: '#8B5CF6',
                borderColor: '#8B5CF6',
                badge: (
                  <span className="badge badge-active">
                    <span className="pulse-dot" />
                    เปิดให้บริการ
                  </span>
                ),
                footerLeft: 'ไม่ต้องเข้าสู่ระบบ • แหล่งข้อมูลภายนอก',
                footerRight: (
                  <span style={{ color: '#8B5CF6', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    เปิดใช้งาน <ExternalLink size={15} />
                  </span>
                ),
              };
            } else if (serviceId === 'survey') {
              cardData = {
                title: 'แบบสำรวจปัจจัยความผูกพันของบุคลากร',
                desc: 'แบบประเมินและสำรวจความคิดเห็นเพื่อเสริมสร้างความผูกพันและความสุขในการทำงานของบุคลากร',
                href: 'https://script.google.com/macros/s/AKfycbwOb1JYVMKCOhvh4HS5br-VXF-AG-QWDoFMYQvjeZbwBe7CbgDUzkGc7_EEDE6JAaH5JA/exec',
                isExternal: true,
                icon: <HeartHandshake size={24} />,
                iconBg: '#FCE7F3',
                iconColor: '#EC4899',
                borderColor: '#EC4899',
                badge: (
                  <span className="badge badge-active">
                    <span className="pulse-dot" />
                    เปิดให้บริการ
                  </span>
                ),
                footerLeft: 'ไม่ต้องเข้าสู่ระบบ • แหล่งข้อมูลภายนอก',
                footerRight: (
                  <span style={{ color: '#EC4899', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    เปิดใช้งาน <ExternalLink size={15} />
                  </span>
                ),
              };
            }

            if (!cardData) return null;

            const baseCardStyle = {
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
              borderTop: `5px solid ${cardData.borderColor}`,
              transition: 'var(--transition)',
              textDecoration: 'none',
              color: 'inherit',
              position: 'relative',
            };

            const cardInnerContent = (
              <>
                {/* Admin Rearrange Toolbar Bar on Card */}
                {isRearranging && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      marginBottom: '0.5rem',
                      background: 'var(--primary-50)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--primary-200)',
                      color: 'var(--primary-700)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'grab' }}>
                      <GripVertical size={14} />
                      <span>ลำดับที่ {index + 1}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          moveService(index, index - 1);
                        }}
                        disabled={index === 0}
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '0.2rem 0.45rem',
                          fontSize: '0.7rem',
                          opacity: index === 0 ? 0.35 : 1,
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                        }}
                        title="เลื่อนไปทางซ้าย"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          moveService(index, index + 1);
                        }}
                        disabled={index === serviceOrder.length - 1}
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '0.2rem 0.45rem',
                          fontSize: '0.7rem',
                          opacity: index === serviceOrder.length - 1 ? 0.35 : 1,
                          cursor: index === serviceOrder.length - 1 ? 'not-allowed' : 'pointer',
                        }}
                        title="เลื่อนไปทางขวา"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-md)',
                        background: cardData.iconBg,
                        color: cardData.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cardData.icon}
                    </div>
                    {cardData.badge}
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {cardData.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {cardData.desc}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {cardData.footerLeft}
                  </span>
                  {cardData.footerRight}
                </div>
              </>
            );

            // In rearrange mode, render as draggable interactive div
            if (isRearranging) {
              const isDragging = draggedIndex === index;
              const isOver = dragOverIndex === index;
              return (
                <div
                  key={serviceId}
                  className="card-glass"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    ...baseCardStyle,
                    cursor: 'grab',
                    opacity: isDragging ? 0.35 : 1,
                    outline: isOver ? '2px dashed var(--primary-500)' : undefined,
                    outlineOffset: '3px',
                    transform: isOver ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isDragging ? 'var(--shadow-lg)' : undefined,
                  }}
                >
                  {cardInnerContent}
                </div>
              );
            }

            // Normal mode
            if (cardData.isExternal) {
              return (
                <a
                  key={serviceId}
                  href={cardData.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-glass"
                  style={baseCardStyle}
                >
                  {cardInnerContent}
                </a>
              );
            }

            return (
              <Link
                key={serviceId}
                href={cardData.href}
                className="card-glass"
                style={baseCardStyle}
              >
                {cardInnerContent}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Future Systems / Extensible Modules Section */}


      {/* System Status Footer Bar */}
      <section
        className="card-glass"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--mint-500)',
              boxShadow: '0 0 8px var(--mint-500)',
            }}
          />
          <span>Core Value: ICIT+R</span>
        </div>

        <div>
          <span>ICIT Workspace &bull; ระบบสารสนเทศสำหรับใช้งานภายในองค์กร</span>
        </div>
      </section>
    </div>
  );
}
