'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, User, ShieldCheck, Sparkles } from 'lucide-react';
import DemoSwitcherModal from './DemoSwitcherModal';

export default function MobileNav() {
  const pathname = usePathname();
  const { currentPersonnel, isAdmin } = useAuth();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <>
      <nav className="mobile-nav-bar">
        <Link
          href="/"
          className={`mobile-nav-item ${pathname === '/' ? 'active' : ''}`}
        >
          <div className="mobile-icon-wrapper">
            <Home size={18} />
          </div>
          <span>หน้าหลัก</span>
        </Link>

        {currentPersonnel && (
          <Link
            href="/profile"
            className={`mobile-nav-item ${pathname === '/profile' ? 'active' : ''}`}
          >
            <div className="mobile-icon-wrapper">
              <User size={18} />
            </div>
            <span>ข้อมูลของฉัน</span>
          </Link>
        )}

        {isAdmin && (
          <Link
            href="/admin"
            className={`mobile-nav-item ${pathname === '/admin' ? 'active' : ''}`}
          >
            <div className="mobile-icon-wrapper">
              <ShieldCheck size={18} />
            </div>
            <span>จัดการระบบ</span>
          </Link>
        )}

        <button
          onClick={() => setIsDemoModalOpen(true)}
          className="mobile-nav-item"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div className="mobile-icon-wrapper">
            <Sparkles size={18} style={{ color: 'var(--primary-500)' }} />
          </div>
          <span>สลับบัญชี</span>
        </button>
      </nav>

      {isDemoModalOpen && (
        <DemoSwitcherModal onClose={() => setIsDemoModalOpen(false)} />
      )}
    </>
  );
}
