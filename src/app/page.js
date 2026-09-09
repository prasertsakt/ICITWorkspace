'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  subscribePersonnelList,
  subscribeDepartmentList,
  subscribeExecutiveList,
  subscribePortalServices,
  savePortalServices,
  savePortalServiceCard,
  deletePortalServiceCard,
  savePortalServicesOrder,
  DEFAULT_SERVICE_ORDER,
} from '@/lib/storageService';
import { PREDEFINED_DEPARTMENTS, PERSONNEL_STATUS, PORTAL_COLOR_THEMES } from '@/lib/constants';
import { formatToBuddhistDate, formatThaiDisplayDate } from '@/lib/dateUtils';
import ServiceCardModal, { PORTAL_ICON_COMPONENTS } from '@/components/ServiceCardModal';
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
  ChevronLeft,
  LogIn,
  CheckCircle2,
  BookOpen,
  HeartHandshake,
  GripVertical,
  MoveHorizontal,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
} from 'lucide-react';

export default function PortalLandingPage() {
  const { currentUser, currentPersonnel, isAdmin, handleGoogleSignIn } = useAuth();
  const [personnelList, setPersonnelList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [executiveList, setExecutiveList] = useState([]);

  // Portal Service Cards & Rearrange State
  const [services, setServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRearranging, setIsRearranging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Filtered Services based on Search Query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase().trim();
    return services.filter((item) => {
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.desc?.toLowerCase().includes(q);
      const matchHref = item.href?.toLowerCase().includes(q);
      const matchBadge = item.badgeText?.toLowerCase().includes(q);
      const matchFooter = item.footerLeft?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchHref || matchBadge || matchFooter;
    });
  }, [services, searchQuery]);

  // Modal State for Add / Edit Service Card
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState(null);

  useEffect(() => {
    const unsubPersonnel = subscribePersonnelList((list) => setPersonnelList(list || []));
    const unsubDepts = subscribeDepartmentList((list) => setDepartmentList(list || []));
    const unsubExecs = subscribeExecutiveList((list) => setExecutiveList(list || []));
    const unsubServices = subscribePortalServices((cardList) => {
      if (Array.isArray(cardList)) {
        setServices(cardList);
      }
    });

    return () => {
      unsubPersonnel();
      unsubDepts();
      unsubExecs();
      unsubServices();
    };
  }, []);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setCardToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (serviceCard, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCardToEdit(serviceCard);
    setIsModalOpen(true);
  };

  const handleSaveCard = async (savedCard) => {
    await savePortalServiceCard(savedCard);
    setIsModalOpen(false);
    setCardToEdit(null);
  };

  const handleDeleteCard = async (cardId, cardTitle, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบการ์ด "${cardTitle}" นี้ออกจากหน้าหลัก?`)) {
      await deletePortalServiceCard(cardId);
    }
  };

  // Reorder handlers
  const moveService = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= services.length || fromIndex === toIndex) return;
    const next = [...services];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setServices(next);
    await savePortalServices(next);
  };

  const handleResetOrder = async () => {
    if (window.confirm('คุณต้องการรีเซ็ตการจัดเรียงการ์ดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      await savePortalServicesOrder(DEFAULT_SERVICE_ORDER);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    await moveService(draggedIndex, dropIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px 4px 6px',
              }}
            >
              <img src="/icit-logo.png" alt="ICIT" style={{ height: '16px', width: 'auto', objectFit: 'contain' }} />
              <span>ICIT PORTAL &bull; ศูนย์รวมระบบสารสนเทศ</span>
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
                  {currentPersonnel.position}{currentPersonnel.level ? ` (${currentPersonnel.level})` : ''}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              🚀 ระบบสารสนเทศและบริการ
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isRearranging
                ? '💡 ลากการ์ดเพื่อสลับตำแหน่ง หรือใช้ปุ่ม ◀ ▶ บนการ์ดแต่ละใบ'
                : 'เลือกระบบงานที่ต้องการเข้าใช้งาน'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', width: '260px' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาระบบงานหรือบริการ..."
                className="form-input"
                style={{
                  paddingLeft: '2rem',
                  paddingRight: searchQuery ? '2rem' : '0.75rem',
                  fontSize: '0.8rem',
                  height: '36px',
                  borderRadius: '20px',
                  background: 'var(--bg-card)',
                  borderColor: searchQuery ? 'var(--primary-400)' : 'var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="ล้างคำค้นหา"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleOpenAddModal}
                  className="btn btn-primary btn-sm"
                  style={{
                    height: '36px',
                    padding: '0 0.85rem',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                    borderRadius: '20px',
                  }}
                  title="คลิกเพื่อเพิ่มการ์ดระบบงานหรือบริการใหม่"
                >
                  <Plus size={14} />
                  <span>เพิ่มการ์ดบริการ</span>
                </button>

                {isRearranging ? (
                  <>
                    <button
                      onClick={handleResetOrder}
                      className="btn btn-secondary btn-sm"
                      style={{ height: '36px', padding: '0 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '20px' }}
                      title="คืนค่าการจัดเรียงกลับเป็นค่าเริ่มต้น"
                    >
                      <RotateCcw size={13} />
                      <span>คืนค่าเริ่มต้น</span>
                    </button>
                    <button
                      onClick={() => setIsRearranging(false)}
                      className="btn btn-secondary btn-sm"
                      style={{ height: '36px', padding: '0 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--primary-300)', color: 'var(--primary-700)', borderRadius: '20px' }}
                    >
                      <CheckCircle2 size={14} />
                      <span>เสร็จสิ้นการจัดเรียง</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsRearranging(true);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{
                      height: '36px',
                      padding: '0 0.85rem',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderColor: 'var(--primary-300)',
                      color: 'var(--primary-700)',
                      background: 'var(--primary-50)',
                      borderRadius: '20px',
                    }}
                    title="คลิกเพื่อสลับและจัดลำดับการ์ดบริการ"
                  >
                    <MoveHorizontal size={14} />
                    <span>จัดเรียงการ์ด</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search Results Count Bar when Searching */}
        {searchQuery.trim() && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              padding: '0.45rem 0.85rem',
              background: 'var(--primary-50)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--primary-200)',
              fontSize: '0.8rem',
              color: 'var(--primary-700)',
            }}
          >
            <span>
              ผลการค้นหาสำหรับ &ldquo;<strong>{searchQuery}</strong>&rdquo; : พบ <strong>{filteredServices.length}</strong> ระบบ
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-700)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.75rem',
                textDecoration: 'underline',
              }}
            >
              แสดงทั้งหมด
            </button>
          </div>
        )}

        {filteredServices.length === 0 ? (
          <div
            className="card-glass"
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <Search size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              ไม่พบระบบงานหรือบริการที่ตรงกับ &ldquo;{searchQuery}&rdquo;
            </h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem' }}>
              ลองตรวจสอบการสะกดคำ หรือล้างคำค้นหาเพื่อดูระบบงานทั้งหมด
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: '20px', padding: '0.4rem 1rem' }}
            >
              ล้างการค้นหา
            </button>
          </div>
        ) : (
          <div className="grid-3" style={{ gap: '1.25rem' }}>
            {filteredServices.map((item, index) => {
            const theme = PORTAL_COLOR_THEMES[item.colorTheme] || PORTAL_COLOR_THEMES.primary;
            const IconComponent = PORTAL_ICON_COMPONENTS[item.iconName] || Laptop;
            const isExternal = Boolean(
              item.openInNewTab ||
              item.href?.startsWith('http://') ||
              item.href?.startsWith('https://')
            );

            // Dynamic footer note fallback
            let dynamicFooterLeft = item.footerLeft;
            if (item.id === 'org') {
              dynamicFooterLeft = `${departmentList.length || 6} ฝ่าย • ${personnelList.length} บุคลากร`;
            } else if (item.id === 'profile' && currentPersonnel) {
              dynamicFooterLeft = `เข้าสู่ระบบในชื่อ: ${currentPersonnel.name}`;
            }

            const baseCardStyle = {
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
              borderTop: `5px solid ${theme.borderColor}`,
              transition: 'var(--transition)',
              textDecoration: 'none',
              color: 'inherit',
              position: 'relative',
              borderRadius: 'var(--radius-lg, 16px)',
            };

            const cardInnerContent = (
              <>
                {/* Admin Rearrange Toolbar Bar on Card */}
                {isRearranging && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      marginBottom: '0.5rem',
                      background: 'var(--primary-50)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--primary-200)',
                      color: 'var(--primary-700)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'grab' }}>
                      <GripVertical size={14} />
                      <span>ลำดับที่ {index + 1}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          moveService(index, index - 1);
                        }}
                        disabled={index === 0}
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '0.2rem 0.45rem',
                          fontSize: '0.7rem',
                          opacity: index === 0 ? 0.35 : 1,
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                        }}
                        title="เลื่อนไปทางซ้าย"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          moveService(index, index + 1);
                        }}
                        disabled={index === services.length - 1}
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '0.2rem 0.45rem',
                          fontSize: '0.7rem',
                          opacity: index === services.length - 1 ? 0.35 : 1,
                          cursor: index === services.length - 1 ? 'not-allowed' : 'pointer',
                        }}
                        title="เลื่อนไปทางขวา"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-md)',
                        background: theme.iconBg,
                        color: theme.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {item.iconType === 'image' && item.iconImageUrl ? (
                        <img
                          src={item.iconImageUrl}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <IconComponent size={24} />
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {/* Badge */}
                      <span
                        className={
                          item.badgeType === 'user'
                            ? 'badge badge-user'
                            : item.badgeType === 'neutral'
                            ? 'badge'
                            : 'badge badge-active'
                        }
                      >
                        {item.badgeType === 'active' && <span className="pulse-dot" />}
                        {item.badgeText || 'เปิดให้บริการ'}
                      </span>

                      {/* Admin Edit & Delete Actions (When not rearranging) */}
                      {isAdmin && !isRearranging && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditModal(item, e)}
                            className="btn btn-secondary btn-xs"
                            style={{
                              padding: '3px 6px',
                              borderRadius: '6px',
                              color: 'var(--primary-600)',
                              background: 'var(--primary-50)',
                              borderColor: 'var(--primary-200)',
                            }}
                            title="แก้ไขการ์ดบริการนี้"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCard(item.id, item.title, e)}
                            className="btn btn-ghost btn-xs"
                            style={{
                              padding: '3px 6px',
                              borderRadius: '6px',
                              color: 'var(--rose-500)',
                            }}
                            title="ลบการ์ดนี้"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.desc}
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
                    {dynamicFooterLeft || 'บริการสารสนเทศ ICIT'}
                  </span>
                  <span style={{ color: theme.iconColor, fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {item.footerRightText || 'เข้าใช้งาน'}
                    {item.openInNewTab ? <ExternalLink size={14} /> : <ArrowRight size={15} />}
                  </span>
                </div>
              </>
            );

            // In rearrange mode, render as draggable interactive div
            if (isRearranging) {
              const isDragging = draggedIndex === index;
              const isOver = dragOverIndex === index;
              return (
                <div
                  key={item.id}
                  className="card-glass"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    ...baseCardStyle,
                    cursor: 'grab',
                    opacity: isDragging ? 0.35 : 1,
                    outline: isOver ? '2px dashed var(--primary-500)' : undefined,
                    outlineOffset: '3px',
                    transform: isOver ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isDragging ? 'var(--shadow-lg)' : undefined,
                  }}
                >
                  {cardInnerContent}
                </div>
              );
            }

            // External Link or Open In New Tab
            if (item.openInNewTab || item.href?.startsWith('http://') || item.href?.startsWith('https://')) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  target={item.openInNewTab ? '_blank' : '_self'}
                  rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                  className="card-glass"
                  style={baseCardStyle}
                >
                  {cardInnerContent}
                </a>
              );
            }

            // Internal Link
            return (
              <Link
                key={item.id}
                href={item.href || '#'}
                className="card-glass"
                style={baseCardStyle}
              >
                {cardInnerContent}
              </Link>
            );
          })}
        </div>
        )}
      </section>

      {/* Service Card Modal for Add / Edit */}
      {isModalOpen && (
        <ServiceCardModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setCardToEdit(null);
          }}
          onSave={handleSaveCard}
          serviceToEdit={cardToEdit}
        />
      )}

      {/* Future Systems / Extensible Modules Section */}


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
          <span>Core Value: ICIT+R</span>
        </div>

        <div>
          <span>ICIT Workspace &bull; ระบบสารสนเทศสำหรับใช้งานภายในองค์กร</span>
        </div>
      </section>
    </div>
  );
}
