'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasAnyAdmin } from '@/lib/storageService';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  ArrowRight,
  Clock,
  LogIn,
  Sparkles,
} from 'lucide-react';

export default function UnauthorizedModal() {
  const {
    authError,
    unauthorizedEmail,
    pendingUserData,
    clearAuthError,
    bootstrapFirstAdmin,
    isFirebaseConfigured,
    handleGoogleSignIn,
  } = useAuth();

  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [canBootstrap, setCanBootstrap] = useState(false);

  const isNotWhitelisted = authError === 'EMAIL_NOT_WHITELISTED';
  const isResigned = authError === 'STATUS_RESIGNED';
  const isConfigMissing = authError === 'FIREBASE_CONFIG_MISSING';
  const isTimeout = authError === 'SESSION_TIMEOUT';

  useEffect(() => {
    if (isNotWhitelisted) {
      hasAnyAdmin().then((exists) => {
        setCanBootstrap(!exists);
      });
    } else {
      setCanBootstrap(false);
    }
  }, [isNotWhitelisted]);

  if (!authError) return null;

  const handleClaimFirstAdmin = async () => {
    setIsBootstrapping(true);
    try {
      await bootstrapFirstAdmin();
    } catch (e) {
      console.error('Failed to bootstrap first admin', e);
    } finally {
      setIsBootstrapping(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'center' }}>
        <div className="modal-body" style={{ padding: '2rem 1.75rem' }}>
          {/* Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: isTimeout ? '#FEF3C7' : isResigned ? 'var(--rose-50)' : isConfigMissing ? 'var(--peach-50)' : 'var(--rose-50)',
              color: isTimeout ? '#D97706' : isResigned ? 'var(--rose-500)' : isConfigMissing ? 'var(--peach-500)' : 'var(--rose-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            {isTimeout ? (
              <Clock size={32} />
            ) : isResigned ? (
              <AlertTriangle size={32} />
            ) : isConfigMissing ? (
              <Sparkles size={32} />
            ) : (
              <ShieldAlert size={32} />
            )}
          </div>

          {/* Title */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {isTimeout && 'เซสชันหมดอายุ (Session Timeout)'}
            {isNotWhitelisted && 'ไม่พบอีเมลในรายชื่อบุคลากร (Whitelist)'}
            {isResigned && 'สถานะพ้นสภาพการปฏิบัติงาน (ลาออก)'}
            {isConfigMissing && 'โหมดทดสอบระบบ (Demo Mode)'}
            {!isTimeout && !isNotWhitelisted && !isResigned && !isConfigMissing && 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'}
          </h3>

          {/* Description */}
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {isTimeout && (
              <>
                เซสชันการเข้าใช้งานของท่านหมดอายุเนื่องจากไม่มีการใช้งานติดต่อกันเกิน <strong>3 ชั่วโมง</strong>
                <br />
                เพื่อความปลอดภัยของข้อมูลองค์กร กรุณาลงชื่อเข้าใช้ด้วยบัญชี Google ใหม่อีกครั้ง
              </>
            )}
            {isNotWhitelisted && (
              <>
                บัญชี Google <strong style={{ color: 'var(--rose-500)' }}>{unauthorizedEmail}</strong> ยังไม่ได้รับการบันทึกในรายชื่อบุคลากรของระบบ
              </>
            )}
            {isResigned && (
              <>
                บัญชีอีเมล <strong style={{ color: 'var(--rose-500)' }}>{unauthorizedEmail}</strong> มีสถานะเป็น
                <span className="badge badge-resigned" style={{ marginLeft: '4px' }}>ลาออก</span>
                <br />
                จึงไม่สามารถเข้าถึงระบบสารสนเทศภายในองค์กรได้ หากข้อมูลไม่ถูกต้องโปรดติดต่อสำนักงานผู้อำนวยการ
              </>
            )}
            {isConfigMissing && (
              <>
                ยังไม่ได้เชื่อมต่อ Firebase API Keys ในไฟล์ <code>.env.local</code> หรือบน Vercel
                <br />
                โปรดตั้งค่า Environment Variables ให้ครบถ้วนเพื่อเริ่มใช้งาน
              </>
            )}
            {!isTimeout && !isNotWhitelisted && !isResigned && !isConfigMissing && (
              <span>โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือลองใหม่อีกครั้ง</span>
            )}
          </p>

          {/* FIRST ADMIN BOOTSTRAP BOX (Only shown if NO Admin currently exists in the system) */}
          {isNotWhitelisted && canBootstrap && (
            <div
              style={{
                background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
                border: '1px solid var(--primary-200)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                <ShieldCheck size={18} />
                <span>คุณคือผู้ติดตั้งระบบคนแรกใช่หรือไม่?</span>
              </div>
              <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                หากคุณเพิ่งเริ่มใช้งานและยังไม่มี Admin ในระบบ คุณสามารถคลิกปุ่มด้านล่างเพื่อแต่งตั้งบัญชีนี้เป็น <strong>Super Admin คนแรก</strong> ได้ทันที
              </p>
              <button
                onClick={handleClaimFirstAdmin}
                disabled={isBootstrapping}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                <UserPlus size={15} />
                <span>
                  {isBootstrapping ? 'กำลังบันทึกข้อมูล...' : `ตั้งค่า ${unauthorizedEmail} เป็น Admin คนแรก`}
                </span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {isTimeout ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                onClick={async () => {
                  clearAuthError();
                  await handleGoogleSignIn();
                }}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <LogIn size={16} />
                <span>เข้าสู่ระบบใหม่ด้วย Google</span>
              </button>
              <button
                onClick={clearAuthError}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%' }}
              >
                <span>ปิดหน้าต่างนี้</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                onClick={clearAuthError}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%' }}
              >
                <RefreshCw size={14} />
                <span>ปิดหน้าต่างนี้</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

