'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  UserCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Mail,
} from 'lucide-react';

export default function DemoSwitcherModal({ onClose }) {
  const { switchDemoUser, currentPersonnel, isFirebaseConfigured } = useAuth();
  const [customEmail, setCustomEmail] = useState('');

  const testAccounts = [
    {
      title: 'ผู้ดูแลระบบ (Admin)',
      name: 'นายสมชาย ใจดี',
      email: 'admin@icit.org',
      role: 'Admin',
      status: 'ปกติ',
      badgeColor: 'var(--primary-50)',
      textColor: 'var(--primary-600)',
      description: 'เข้าถึงได้ทุกหน้า รวมทั้งหน้าแผงควบคุม Admin',
    },
    {
      title: 'บุคลากรทั่วไป (USER)',
      name: 'น.ส.วนิดา แสงทอง',
      email: 'wanida@icit.org',
      role: 'USER',
      status: 'ปกติ',
      badgeColor: 'var(--sky-50)',
      textColor: 'var(--sky-text)',
      description: 'เข้าถึงหน้าหลักและหน้าข้อมูลส่วนบุคคลของตนเอง',
    },
    {
      title: 'บุคลากรที่ลาออกแล้ว (Resigned)',
      name: 'นายมนัส เก่าดี',
      email: 'manas.retired@icit.org',
      role: 'USER',
      status: 'ลาออก',
      badgeColor: 'var(--rose-50)',
      textColor: 'var(--rose-text)',
      description: 'ทดสอบการบล็อก: ระบบจะไม่อนุญาตให้เข้าสู่ระบบ',
    },
    {
      title: 'อีเมลที่ไม่มีในรายชื่อ (Unauthorized)',
      name: 'ผู้ใช้นอกองค์กร',
      email: 'outsider@gmail.com',
      role: 'ไม่มีสิทธิ์',
      status: 'ไม่มีในระบบ',
      badgeColor: '#F1F5F9',
      textColor: '#64748B',
      description: 'ทดสอบการตรวจ Whitelist: ระบบจะปฏิเสธการเข้าใช้งานทันที',
    },
  ];

  const handleSelect = async (email) => {
    await switchDemoUser(email);
    onClose();
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail) return;
    await switchDemoUser(customEmail);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>สลับบัญชีทดสอบระบบ</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                จำลองการเข้าสู่ระบบเพื่อทดสอบสิทธิ์และระบบ Whitelist
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: '0.6rem',
            }}
          >
            <HelpCircle size={18} style={{ color: 'var(--primary-500)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>หลักการทำงานของ Google Sign-In & Whitelist:</strong>
              <div style={{ marginTop: '0.2rem' }}>
                เมื่อเชื่อมต่อกับ Firebase ผู้ใช้จะกดล็อกอินด้วย Google จากนั้นระบบจะนำอีเมลมาตรวจกับตารางบุคลากร หากไม่มีในระบบหรือมีสถานะเป็น "ลาออก" ระบบจะไม่อนุญาตให้เข้าใช้งาน
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {testAccounts.map((acc, idx) => {
              const isCurrent = currentPersonnel?.email === acc.email;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(acc.email)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: isCurrent
                      ? '2px solid var(--primary-500)'
                      : '1px solid var(--border-subtle)',
                    background: isCurrent ? 'var(--primary-50)' : 'white',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.borderColor = 'var(--primary-200)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {acc.title}
                      </span>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: acc.badgeColor,
                          color: acc.textColor,
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.5rem',
                        }}
                      >
                        {acc.role} ({acc.status})
                      </span>
                      {isCurrent && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--primary-600)',
                            fontWeight: 600,
                          }}
                        >
                          (กำลังใช้งาน)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {acc.name} &bull; <span style={{ color: 'var(--text-secondary)' }}>{acc.email}</span>
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {acc.description}
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <form onSubmit={handleCustomSubmit}>
              <label className="input-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
                หรือทดสอบด้วยอีเมลอื่น:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="เช่น someone@domain.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-secondary btn-sm">
                  ทดสอบ
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
