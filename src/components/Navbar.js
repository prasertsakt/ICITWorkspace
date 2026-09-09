'use client';

import React, { useState, useEffect } from 'react';
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
  Calendar,
  Clock,
  Menu,
  X,
  ChevronRight,
  FileText,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    currentUser,
    currentPersonnel,
    isAdmin,
    handleGoogleSignIn,
    handleSignOut,
  } = useAuth();

  // Close mobile drawer whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle ESC key and lock body scroll when drawer is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          {/* Brand */}
          <Link href="/" className="brand-link" onClick={() => setIsMobileMenuOpen(false)}>
            <div
              className="brand-logo-icon"
              style={{
                background: '#FFFFFF',
                padding: '4px',
                border: '1.5px solid var(--border-subtle, #E2E8F0)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <img
                src="/icit-logo.png"
                alt="ICIT Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div className="brand-text">
              <h1>ระบบบริหารจัดการองค์กร</h1>
              <p>สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.</p>
            </div>
          </Link>

          {/* Desktop Navigation Links (>= 1024px) */}
          <nav className="nav-links-desktop">
            <Link
              href="/"
              className={`nav-link-item ${pathname === '/' ? 'active' : ''}`}
            >
              <Home size={16} />
              <span>หน้าหลัก</span>
            </Link>

            <Link
              href="/organization"
              className={`nav-link-item ${pathname === '/organization' ? 'active' : ''}`}
            >
              <Building2 size={16} />
              <span>โครงสร้างองค์กร</span>
            </Link>

            {currentPersonnel && (
              <>
                <Link
                  href="/time-attendance"
                  className={`nav-link-item ${pathname === '/time-attendance' ? 'active' : ''}`}
                >
                  <Clock size={16} />
                  <span>ขอลงเวลา</span>
                </Link>

                <Link
                  href="/leave"
                  className={`nav-link-item ${pathname === '/leave' ? 'active' : ''}`}
                >
                  <Calendar size={16} />
                  <span>ปฏิทินวันลา</span>
                </Link>

                <Link
                  href="/jd-hub"
                  className={`nav-link-item ${pathname === '/jd-hub' ? 'active' : ''}`}
                >
                  <FileText size={16} />
                  <span>JD Hub</span>
                </Link>

                <Link
                  href="/profile"
                  className={`nav-link-item ${pathname === '/profile' ? 'active' : ''}`}
                >
                  <User size={16} />
                  <span>ข้อมูลของฉัน</span>
                </Link>
              </>
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

          {/* User Profile & Actions (Desktop & Mobile) */}
          <div className="nav-user-area">
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
                      {isAdmin ? '🛡️ Admin' : '👤 บุคลากร'}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="btn btn-ghost btn-icon desktop-only-action"
                  title="ออกจากระบบ"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="btn btn-primary btn-sm desktop-only-action"
              >
                <LogIn size={16} />
                <span>เข้าสู่ระบบด้วยบัญชี Google KMUTNB</span>
              </button>
            )}

            {/* Hamburger Button (< 1024px) */}
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Drawer Menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="navbar-mobile-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="navbar-mobile-drawer" role="dialog" aria-modal="true">
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    background: '#FFFFFF',
                    padding: '2px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src="/icit-logo.png"
                    alt="ICIT"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    เมนูการใช้งาน
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    ICIT Workspace
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="ปิดเมนู"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Links */}
            <nav className="mobile-drawer-body">
              <Link
                href="/"
                className={`mobile-drawer-link ${pathname === '/' ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="drawer-icon-box">
                  <Home size={18} />
                </div>
                <span style={{ flex: 1 }}>หน้าหลัก (Portal)</span>
                <ChevronRight size={16} opacity={0.4} />
              </Link>

              <Link
                href="/organization"
                className={`mobile-drawer-link ${pathname === '/organization' ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="drawer-icon-box">
                  <Building2 size={18} />
                </div>
                <span style={{ flex: 1 }}>โครงสร้างองค์กร</span>
                <ChevronRight size={16} opacity={0.4} />
              </Link>

              {currentPersonnel && (
                <>
                  <Link
                    href="/time-attendance"
                    className={`mobile-drawer-link ${pathname === '/time-attendance' ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="drawer-icon-box">
                      <Clock size={18} />
                    </div>
                    <span style={{ flex: 1 }}>ขอลงเวลาปฏิบัติราชการ</span>
                    <ChevronRight size={16} opacity={0.4} />
                  </Link>

                  <Link
                    href="/leave"
                    className={`mobile-drawer-link ${pathname === '/leave' ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="drawer-icon-box">
                      <Calendar size={18} />
                    </div>
                    <span style={{ flex: 1 }}>ปฏิทินวันลา</span>
                    <ChevronRight size={16} opacity={0.4} />
                  </Link>

                  <Link
                    href="/jd-hub"
                    className={`mobile-drawer-link ${pathname === '/jd-hub' ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="drawer-icon-box">
                      <FileText size={18} />
                    </div>
                    <span style={{ flex: 1 }}>JD Hub</span>
                    <ChevronRight size={16} opacity={0.4} />
                  </Link>

                  <Link
                    href="/profile"
                    className={`mobile-drawer-link ${pathname === '/profile' ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="drawer-icon-box">
                      <User size={18} />
                    </div>
                    <span style={{ flex: 1 }}>ข้อมูลของฉัน</span>
                    <ChevronRight size={16} opacity={0.4} />
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`mobile-drawer-link ${pathname === '/admin' ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="drawer-icon-box" style={{ color: 'var(--amber-600)' }}>
                    <ShieldCheck size={18} />
                  </div>
                  <span style={{ flex: 1 }}>จัดการข้อมูล (Admin)</span>
                  <ChevronRight size={16} opacity={0.4} />
                </Link>
              )}
            </nav>

            {/* Drawer Footer (User Profile or Sign In) */}
            <div className="mobile-drawer-footer">
              {currentPersonnel ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {currentPersonnel.avatarUrl ? (
                      <img
                        src={currentPersonnel.avatarUrl}
                        alt={currentPersonnel.name}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: 'var(--radius-full)',
                          objectFit: 'cover',
                          border: '2px solid white',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--primary-100)',
                          color: 'var(--primary-700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {currentPersonnel.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {currentPersonnel.name}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {isAdmin ? '🛡️ ผู้ดูแลระบบ (Admin)' : '👤 บุคลากร'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', gap: '0.4rem', color: 'var(--rose-600)' }}
                  >
                    <LogOut size={16} />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleGoogleSignIn();
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <LogIn size={18} />
                  <span>เข้าสู่ระบบด้วยบัญชี Google KMUTNB</span>
                </button>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
