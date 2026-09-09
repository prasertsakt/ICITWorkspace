'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  subscribePersonnelList,
  subscribeDepartmentList,
  subscribeExecutiveList,
} from '@/lib/storageService';
import {
  calculateTenure,
  calculateRetirementCountdown,
  formatThaiDisplayDate,
} from '@/lib/dateUtils';
import { PERSONNEL_STATUS, USER_ROLES } from '@/lib/constants';
import {
  User,
  Building2,
  Calendar,
  Clock,
  Award,
  ShieldCheck,
  Mail,
  FileText,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle,
  LogIn,
} from 'lucide-react';

export default function ProfilePage() {
  const { currentPersonnel, currentUser, isAdmin, handleGoogleSignIn } = useAuth();
  const [departmentList, setDepartmentList] = useState([]);
  const [executiveList, setExecutiveList] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubPersonnel = subscribePersonnelList((list) => {
      setPersonnelList(list || []);
      setLoading(false);
    });
    const unsubDepts = subscribeDepartmentList((list) => {
      setDepartmentList(list || []);
    });
    const unsubExecs = subscribeExecutiveList((list) => {
      setExecutiveList(list || []);
    });

    return () => {
      unsubPersonnel();
      unsubDepts();
      unsubExecs();
    };
  }, []);

  if (!currentPersonnel) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div
          className="card-glass"
          style={{ maxWidth: '460px', margin: '0 auto', padding: '2.5rem 1.5rem' }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <User size={32} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            เข้าสู่ระบบเพื่อดูข้อมูลของท่าน
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            กรุณาลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อตรวจสอบข้อมูลบุคลากร สังกัดฝ่ายงาน และสิทธิประโยชน์ของท่าน
          </p>
          <button onClick={handleGoogleSignIn} className="btn btn-primary" style={{ width: '100%' }}>
            <LogIn size={18} />
            <span>เข้าสู่ระบบด้วยบัญชี Google KMUTNB</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculations
  const tenure = calculateTenure(currentPersonnel.appointmentDate);
  const retirement = calculateRetirementCountdown(currentPersonnel.retirementDate);

  // Department and Executives
  const deptInfo = departmentList.find((d) => d.name === currentPersonnel.department);
  const deptHead = personnelList.find((p) => p.id === deptInfo?.headPersonnelId);
  const supervisingExec = executiveList.find((e) => e.id === deptInfo?.supervisingExecutiveId);

  // Colleagues in the same department
  const colleagues = personnelList.filter(
    (p) => p.department === currentPersonnel.department && p.id !== currentPersonnel.id && p.status === PERSONNEL_STATUS.ACTIVE
  );

  return (
    <div className="main-container">
      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-admin">
            <Sparkles size={12} />
            ข้อมูลส่วนบุคคลของท่าน (Personalized Data)
          </span>
        </div>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          ข้อมูลประจำตัวบุคลากร
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          รายละเอียดการบรรจุ ตำแหน่งงาน สังกัด และข้อมูลอายุงานของท่าน
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.75rem' }}>
        {/* TOP: Digital ID Badge Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 50%, #818CF8 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem 1.75rem',
            color: 'white',
            boxShadow: '0 16px 36px -8px rgba(99, 102, 241, 0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle background circles for sleek aesthetic */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-30px',
              left: '30%',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Top row: Org Title & Role */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} style={{ color: '#C7D2FE' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: '#E0E7FF' }}>
                  ICIT ORGANIZATION CARD
                </span>
              </div>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '99px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                {isAdmin ? '🛡️ ผู้ดูแลระบบ (Admin)' : '👤 สมาชิก (USER)'}
              </span>
            </div>

            {/* Middle row: Avatar + Name + Position */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              {currentPersonnel.avatarUrl ? (
                <img
                  src={currentPersonnel.avatarUrl}
                  alt={currentPersonnel.name}
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: 'var(--radius-full)',
                    objectFit: 'cover',
                    border: '3px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.25)',
                    border: '3px solid rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 800,
                  }}
                >
                  {currentPersonnel.name?.charAt(0) || 'U'}
                </div>
              )}

              <div style={{ flex: 1, minWidth: '220px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em', margin: 0 }}>
                  {currentPersonnel.name}
                </h3>
                <div style={{ fontSize: '0.95rem', color: '#E0E7FF', fontWeight: 500, margin: '0.25rem 0' }}>
                  {currentPersonnel.position}{currentPersonnel.level ? ` (${currentPersonnel.level})` : ''}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.18)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    🏢 {currentPersonnel.department}
                  </span>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.18)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    🏷️ {currentPersonnel.personnelType}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom row: Verified Email & Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.8rem',
                color: '#E0E7FF',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} />
                <span>{currentPersonnel.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#34D399',
                    boxShadow: '0 0 8px #34D399',
                  }}
                />
                <span style={{ fontWeight: 600 }}>สถานะ: {currentPersonnel.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* METRICS ROW: Tenure & Retirement Calculation */}
        <div className="grid-2">
          {/* Tenure Card */}
          <div className="card-glass" style={{ padding: '1.5rem', borderLeft: '5px solid var(--mint-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--mint-50)',
                  color: 'var(--mint-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  อายุการปฏิบัติงาน (Tenure)
                </span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--mint-600)', margin: 0 }}>
                  {tenure.text}
                </h4>
              </div>
            </div>

            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>วันที่ได้รับการบรรจุ:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {formatThaiDisplayDate(currentPersonnel.appointmentDate)} (พ.ศ.)
              </strong>
            </div>
          </div>

          {/* Retirement Card */}
          <div className="card-glass" style={{ padding: '1.5rem', borderLeft: '5px solid var(--peach-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--peach-50)',
                  color: 'var(--peach-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  การเกษียณอายุราชการ
                </span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--peach-text)', margin: 0 }}>
                  {retirement.text}
                </h4>
              </div>
            </div>

            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>กำหนดวันเกษียณอายุ:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {formatThaiDisplayDate(currentPersonnel.retirementDate)} (พ.ศ.)
              </strong>
            </div>
          </div>
        </div>

        {/* DEPARTMENT & SUPERVISORY HIERARCHY */}
        <div className="card-glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            🏢 โครงสร้างและสายการบังคับบัญชา
          </h3>

          <div className="grid-3" style={{ gap: '1rem' }}>
            <div
              style={{
                background: 'var(--bg-card-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                ฝ่ายที่สังกัด
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {currentPersonnel.department}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {deptInfo?.description || 'หน่วยงานปฏิบัติการตามภารกิจ'}
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-card-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                หัวหน้าฝ่าย
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {deptHead ? deptHead.name : 'ยังไม่ได้ระบุ'}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {deptHead ? `${deptHead.position}${deptHead.level ? ` (${deptHead.level})` : ''}` : '-'}
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-card-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                ผู้บริหารที่กำกับดูแลฝ่าย
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {supervisingExec ? supervisingExec.name : 'ยังไม่ได้ระบุ'}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {supervisingExec ? supervisingExec.position : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* OFFICIAL DETAILS & REMARKS */}
        <div className="card-glass" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            📋 รายละเอียดข้อมูลบุคลากร
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ประเภทบุคลากร</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {currentPersonnel.personnelType}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ตำแหน่งงาน</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {currentPersonnel.position}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ระดับตำแหน่ง</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {currentPersonnel.level || '-'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>สถานะการปฏิบัติงาน</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {currentPersonnel.status}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>อีเมลสำหรับล็อกอิน</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {currentPersonnel.email}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>สิทธิ์ในระบบ</span>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {currentPersonnel.role}
              </div>
            </div>
          </div>

          {currentPersonnel.note && (
            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>หมายเหตุ</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {currentPersonnel.note}
              </p>
            </div>
          )}
        </div>

        {/* COLLEAGUES IN SAME DEPARTMENT */}
        {colleagues.length > 0 && (
          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              👥 เพื่อนร่วมฝ่าย ({colleagues.length} คน)
            </h3>

            <div className="grid-3">
              {colleagues.map((mate) => (
                <div
                  key={mate.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {mate.avatarUrl ? (
                    <img
                      src={mate.avatarUrl}
                      alt=""
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'var(--primary-100)',
                        color: 'var(--primary-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      {mate.name?.charAt(0)}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {mate.name}
                    </h5>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {mate.position}{mate.level ? ` (${mate.level})` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
