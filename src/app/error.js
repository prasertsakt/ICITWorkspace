'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Next.js Page Error caught by boundary:', error);
  }, [error]);

  return (
    <div className="main-container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
      <div
        className="card"
        style={{
          maxWidth: '540px',
          margin: '0 auto',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
          }}
        >
          <AlertTriangle size={32} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          เกิดข้อผิดพลาดในการโหลดหน้านี้
        </h2>

        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          {error?.message || 'ระบบไม่สามารถโหลดข้อมูลหน้านี้ได้ในขณะนี้ กรุณากดปุ่มลองใหม่อีกครั้ง หรือกลับสู่หน้าหลัก'}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={15} />
            <span>ลองใหม่อีกครั้ง</span>
          </button>

          <Link
            href="/"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Home size={15} />
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
