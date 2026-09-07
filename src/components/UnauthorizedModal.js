'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, AlertTriangle, RefreshCw, Sparkles, Mail } from 'lucide-react';

export default function UnauthorizedModal() {
  const { authError, unauthorizedEmail, clearAuthError, switchDemoUser } = useAuth();

  if (!authError) return null;

  const isNotWhitelisted = authError === 'EMAIL_NOT_WHITELISTED';
  const isResigned = authError === 'STATUS_RESIGNED';
  const isConfigMissing = authError === 'FIREBASE_CONFIG_MISSING';

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div className="modal-body" style={{ padding: '2rem 1.75rem' }}>
          {/* Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: isResigned ? 'var(--rose-50)' : isConfigMissing ? 'var(--peach-50)' : 'var(--rose-50)',
              color: isResigned ? 'var(--rose-500)' : isConfigMissing ? 'var(--peach-500)' : 'var(--rose-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            {isResigned ? (
              <AlertTriangle size={32} />
            ) : isConfigMissing ? (
              <Sparkles size={32} />
            ) : (
              <ShieldAlert size={32} />
            )}
          </div>

          {/* Title */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {isNotWhitelisted && 'ไม่พบอีเมลในระบบ (Whitelist)'}
            {isResigned && 'สถานะพ้นสภาพการปฏิบัติงาน (ลาออก)'}
            {isConfigMissing && 'โหมดทดสอบระบบ (Demo Mode)'}
            {!isNotWhitelisted && !isResigned && !isConfigMissing && 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'}
          </h3>

          {/* Description */}
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {isNotWhitelisted && (
              <>
                อีเมล <strong style={{ color: 'var(--rose-500)' }}>{unauthorizedEmail}</strong> ยังไม่ได้รับการบันทึกในรายชื่อบุคลากรโดยผู้ดูแลระบบ
                <br />
                ระบบนี้อนุญาตให้เฉพาะบุคลากรภายในองค์กรที่ Admin เพิ่มข้อมูลไว้เท่านั้น
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
                ยังไม่ได้เชื่อมต่อ Firebase API Keys ในไฟล์ <code>.env.local</code>
                <br />
                คุณสามารถใช้ปุ่ม <strong>"สลับบัญชีทดสอบ"</strong> เพื่อทดลองใช้งานเป็น Admin หรือ บุคลากร ได้ทันที!
              </>
            )}
            {!isNotWhitelisted && !isResigned && !isConfigMissing && (
              <span>โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือลองใหม่อีกครั้ง</span>
            )}
          </p>

          {/* Contact Box */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              📞 ช่องทางติดต่อฝ่ายดูแลระบบ:
            </div>
            <div>สำนักงานผู้อำนวยการ / ผู้ดูแลระบบไอที (admin@icit.org)</div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button
              onClick={() => {
                clearAuthError();
                switchDemoUser('admin@icit.org');
              }}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <Sparkles size={16} />
              <span>เข้าใช้งานด้วยบัญชีตัวอย่าง Admin</span>
            </button>

            <button
              onClick={clearAuthError}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              <RefreshCw size={16} />
              <span>ปิดหน้าต่างนี้</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
