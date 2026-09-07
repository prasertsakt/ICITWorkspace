'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Home,
  User,
  ShieldCheck,
  LogOut,
  LogIn,
  Sparkles,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import DemoSwitcherModal from './DemoSwitcherModal';

export default function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    currentPersonnel,
    isAdmin,
    handleGoogleSignIn,
    handleSignOut,
    isFirebaseConfigured,
  } = useAuth();

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          {/* Brand */}
          <Link href="/" className="brand-link">
            <div className="brand-logo-icon">
              <Building2 size={24} />
            </div>
            <div className="brand-text">
              <h1>ระบบบริหารจัดการองค์กร</h1>
              <p>Organization Management System</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nav-links-desktop">
            <Link
              href="/"
              className={`nav-link-item ${pathname === '/' ? 'active' : ''}`}
            >
              <Home size={16} />
              <span>หน้าหลัก</span>
            </Link>

            {currentPersonnel && (
              <Link
                href="/profile"
                className={`nav-link-item ${pathname === '/profile' ? 'active' : ''}`}
              >
                <User size={16} />
                <span>ข้อมูลของฉัน</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className={`nav-link-item ${pathname === '/admin' ? 'active' : ''}`}
              >
                <ShieldCheck size={16} />
                <span>จัดการข้อมูล (Admin)</span>
              </Link>
            )}
          </nav>

          {/* User Profile & Auth */}
          <div className="nav-user-area">
            {/* Quick Demo Switcher Button */}
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="btn btn-secondary btn-sm"
              title="สลับบัญชีทดสอบระบบ"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
            >
              <Sparkles size={14} style={{ color: 'var(--primary-500)' }} />
              <span className="hidden sm:inline">สลับบัญชีทดสอบ</span>
            </button>

            {currentPersonnel ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link href="/profile" className="user-badge-pill" style={{ cursor: 'pointer' }}>
                  {currentPersonnel.avatarUrl ? (
                    <img
                      src={currentPersonnel.avatarUrl}
                      alt={currentPersonnel.name}
                      className="user-avatar"
                    />
                  ) : (
                    <div className="user-avatar">
                      {currentPersonnel.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="user-info-text">
                    <span className="user-name">{currentPersonnel.name}</span>
                    <span className="user-role">
                      {isAdmin ? '🛡️ ผู้ดูแลระบบ (Admin)' : '👤 บุคลากร'}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="btn btn-ghost btn-icon"
                  title="ออกจากระบบ"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="btn btn-primary btn-sm"
              >
                <LogIn size={16} />
                <span>เข้าสู่ระบบ Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Demo Switcher Modal */}
      {isDemoModalOpen && (
        <DemoSwitcherModal onClose={() => setIsDemoModalOpen(false)} />
      )}
    </>
  );
}
