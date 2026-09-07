'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Building2, User, ShieldCheck } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();
  const { currentPersonnel, isAdmin } = useAuth();

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

        <Link
          href="/organization"
          className={`mobile-nav-item ${pathname === '/organization' ? 'active' : ''}`}
        >
          <div className="mobile-icon-wrapper">
            <Building2 size={18} />
          </div>
          <span>โครงสร้าง</span>
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
      </nav>
    </>
  );
}
