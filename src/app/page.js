'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  subscribePersonnelList,
  subscribeDepartmentList,
  subscribeExecutiveList,
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
  LogIn,
  CheckCircle2,
} from 'lucide-react';

export default function PortalLandingPage() {
  const { currentUser, currentPersonnel, isAdmin, handleGoogleSignIn } = useAuth();
  const [personnelList, setPersonnelList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [executiveList, setExecutiveList] = useState([]);

  useEffect(() => {
    const unsubPersonnel = subscribePersonnelList((list) => setPersonnelList(list || []));
    const unsubDepts = subscribeDepartmentList((list) => setDepartmentList(list || []));
    const unsubExecs = subscribeExecutiveList((list) => setExecutiveList(list || []));
    return () => {
      unsubPersonnel();
      unsubDepts();
      unsubExecs();
    };
  }, []);

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
              }}
            >
              <Sparkles size={13} />
              ICIT PORTAL &bull; ศูนย์รวมระบบสารสนเทศ
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
                  {currentPersonnel.position} ({currentPersonnel.level})
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              🚀 ระบบงานหลัก (Core Services)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              เลือกระบบงานที่ต้องการเข้าใช้งาน
            </p>
          </div>
        </div>

        <div className="grid-3" style={{ gap: '1.25rem' }}>
          {/* Service 1: Organization Structure & Directory */}
          <Link
            href="/organization"
            className="card-glass"
            style={{
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
              borderTop: '5px solid var(--primary-500)',
              transition: 'var(--transition)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-50)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={24} />
                </div>
                <span className="badge badge-active">
                  <span className="pulse-dot" />
                  เปิดให้บริการ
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                โครงสร้างองค์กรและทำเนียบบุคลากร
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                ผังโครงสร้าง 6 ฝ่ายงานหลัก คณะฝ่ายบริหาร และทำเนียบบุคลากรพร้อมระบบค้นหาและตัวกรอง
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
                {PREDEFINED_DEPARTMENTS.length} ฝ่าย &bull; {personnelList.length} บุคลากร
              </span>
              <span
                style={{
                  color: 'var(--primary-600)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                เข้าใช้งาน <ArrowRight size={15} />
              </span>
            </div>
          </Link>

          {/* Service 2: Personal Profile */}
          <Link
            href="/profile"
            className="card-glass"
            style={{
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
              borderTop: '5px solid var(--mint-500)',
              transition: 'var(--transition)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--mint-50)',
                    color: 'var(--mint-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserCheck size={24} />
                </div>
                <span className="badge badge-user">
                  ข้อมูลส่วนบุคคล
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                ข้อมูลของฉัน (Personal Profile)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                บัตรประจำตัวดิจิทัล คำนวณอายุงาน นับถอยหลังวันเกษียณราชการ และสายการบังคับบัญชา
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
                {currentPersonnel ? `เข้าสู่ระบบในชื่อ: ${currentPersonnel.name}` : 'ต้องเข้าสู่ระบบ Google'}
              </span>
              <span
                style={{
                  color: 'var(--mint-600)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                เข้าใช้งาน <ArrowRight size={15} />
              </span>
            </div>
          </Link>

          {/* Service 3: Leave Calendar & Dashboard */}
          <Link
            href="/leave"
            className="card-glass"
            style={{
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
              borderTop: '5px solid var(--peach-500)',
              transition: 'var(--transition)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--peach-50)',
                    color: 'var(--peach-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={24} />
                </div>
                <span className="badge badge-active">
                  <span className="pulse-dot" />
                  เปิดให้บริการ
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                ปฏิทินวันลา (Leave Calendar)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                แดชบอร์ดสรุปสถิติและปฏิทินแสดงวันลาป่วย ลากิจ ลาพักผ่อน และขาดงานของบุคลากร
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
                {currentPersonnel ? 'คลิกเพื่อดูปฏิทินวันลา' : 'ต้องเข้าสู่ระบบเพื่อใช้งาน'}
              </span>
              <span
                style={{
                  color: 'var(--peach-500)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                เข้าใช้งาน <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Future Systems / Extensible Modules Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              📦 ระบบและบริการที่จะเปิดเร็วๆ นี้ (Coming Soon)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ระบบสารสนเทศที่อยู่ระหว่างการพัฒนาเพื่อรองรับการใช้งานภายในองค์กร
            </p>
          </div>
        </div>

        <div className="grid-3" style={{ gap: '1.25rem' }}>
          {/* Module 1 */}
          <div
            className="card-glass"
            style={{
              padding: '1.5rem',
              opacity: 0.85,
              background: '#FAFBFD',
              border: '1px dashed var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: '#F1F5F9',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarCheck size={20} />
              </div>
              <span
                className="badge"
                style={{ background: '#F1F5F9', color: '#64748B', fontSize: '0.7rem' }}
              >
                เร็วๆ นี้
              </span>
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              ระบบจองห้องประชุมและทรัพยากร
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              จองห้องประชุม ห้องสัมมนา ห้องปฏิบัติการคอมพิวเตอร์ และอุปกรณ์โสตทัศนูปกรณ์
            </p>
          </div>

          {/* Module 2 */}
          <div
            className="card-glass"
            style={{
              padding: '1.5rem',
              opacity: 0.85,
              background: '#FAFBFD',
              border: '1px dashed var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: '#F1F5F9',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Wrench size={20} />
              </div>
              <span
                className="badge"
                style={{ background: '#F1F5F9', color: '#64748B', fontSize: '0.7rem' }}
              >
                เร็วๆ นี้
              </span>
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              ระบบแจ้งซ่อมและบริการไอซีที (Service Desk)
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              แจ้งปัญหาการใช้งานคอมพิวเตอร์ อินเทอร์เน็ต เครือข่าย และบริการเทคโนโลยีสารสนเทศ
            </p>
          </div>

          {/* Module 3 */}
          <div
            className="card-glass"
            style={{
              padding: '1.5rem',
              opacity: 0.85,
              background: '#FAFBFD',
              border: '1px dashed var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: '#F1F5F9',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={20} />
              </div>
              <span
                className="badge"
                style={{ background: '#F1F5F9', color: '#64748B', fontSize: '0.7rem' }}
              >
                เร็วๆ นี้
              </span>
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              ระบบคลังเอกสารและแบบฟอร์มดิจิทัล
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              ดาวน์โหลดและยื่นแบบฟอร์มคำขอ ระเบียบ ประกาศ และเอกสารเผยแพร่ภายในองค์กร
            </p>
          </div>
        </div>
      </section>

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
          <span>สถานะระบบ: ระบบสารสนเทศทำงานปกติ (All Systems Operational)</span>
        </div>

        <div>
          <span>ICIT Workspace &bull; ระบบสารสนเทศสำหรับใช้งานภายในองค์กร</span>
        </div>
      </section>
    </div>
  );
}
