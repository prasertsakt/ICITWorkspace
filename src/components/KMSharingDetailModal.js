'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Link2,
  Tag,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  CalendarPlus,
  Video,
  Building2,
  Plus,
  Check,
  Search,
} from 'lucide-react';
import {
  SHARING_STATUSES,
  getGoogleCalendarUrl,
  updateSessionTags,
  canUserManageKmTags,
} from '@/lib/kmSharingService';

export default function KMSharingDetailModal({
  isOpen,
  onClose,
  session,
  onEdit,
  onDelete,
  onTagsUpdated,
  availableTags = [],
  tagManagers = [],
  currentUser,
  currentPersonnel,
  isAdmin = false,
}) {
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [isSavingTags, setIsSavingTags] = useState(false);

  useEffect(() => {
    if (session) {
      setSelectedTags(session.tags || []);
      setIsEditingTags(false);
      setTagSearch('');
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const userEmail = (currentUser?.email || currentPersonnel?.email || '').toLowerCase().trim();
  const isCreator =
    (session.creator?.email || '').toLowerCase().trim() === userEmail ||
    (session.speakers || []).some((s) => (s.email || '').toLowerCase().trim() === userEmail);
  const canManageSession = isAdmin || isCreator;
  const canManageTags = canUserManageKmTags(currentUser, currentPersonnel, isAdmin, tagManagers);

  const stConfig = SHARING_STATUSES[session.status] || SHARING_STATUSES.SCHEDULED;
  const googleCalUrl = getGoogleCalendarUrl(session);

  const isOnline = session.locationType === 'ONLINE' || Boolean(session.meetUrl);
  const resolvedMeetUrl = session.meetUrl || (isOnline ? `https://meet.google.com/lookup/icit-km-${session.id}` : '');

  const filteredAvailableTags = availableTags.filter((t) =>
    !tagSearch ? true : t.toLowerCase().includes(tagSearch.toLowerCase().trim())
  );

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleSaveTags = async () => {
    setIsSavingTags(true);
    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'Tag Manager',
        email: currentUser?.email || currentPersonnel?.email || '',
        role: isAdmin ? 'Admin' : 'TagManager',
      };
      await updateSessionTags(session.id, selectedTags, actor);
      if (onTagsUpdated) {
        onTagsUpdated(session.id, selectedTags);
      }
      setIsEditingTags(false);
    } catch (err) {
      console.error('Failed to update tags:', err);
    } finally {
      setIsSavingTags(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="card-glass"
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: isOnline ? '#0284C7' : '#10B981',
                  color: '#FFFFFF',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {isOnline ? <Video size={13} /> : <Building2 size={13} />}
                <span>{isOnline ? 'การบรรยายออนไลน์' : 'ในสถานที่ (Onsite)'}</span>
              </span>

              <span
                style={{
                  background: stConfig.bgColor,
                  color: stConfig.color,
                  border: `1px solid ${stConfig.borderColor}`,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}
              >
                {stConfig.badgeText}
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, lineHeight: 1.4, color: '#FFFFFF' }}>
              {session.topic}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ overflowY: 'auto', padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Key Schedule Information Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              background: '#F8FAFC',
              borderRadius: '14px',
              padding: '1rem',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>วันและเวลาบรรยาย</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                  {session.date} ({session.startTime} - {session.endTime} น.)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: isOnline ? '#E0F2FE' : '#FEF3C7',
                  color: isOnline ? '#0284C7' : '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isOnline ? <Video size={18} /> : <MapPin size={18} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>สถานที่ / ช่องทาง</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                  {isOnline ? 'Google Meet (ออนไลน์)' : session.roomNumber || session.location || 'สำนักคอมพิวเตอร์ฯ'}
                </div>
                {isOnline && resolvedMeetUrl && (
                  <a
                    href={resolvedMeetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      color: '#0284C7',
                      fontWeight: 700,
                      marginTop: '2px',
                      textDecoration: 'underline',
                    }}
                  >
                    <span>เข้าร่วม Google Meet</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Speakers List */}
          <div>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="#059669" />
              <span>ผู้แชร์ขององค์ความรู้ / ผู้บรรยาย ({session.speakers?.length || 0} ท่าน)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              {(session.speakers || []).map((spk, idx) => (
                <div
                  key={spk.id || spk.email || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B' }}>{spk.name}</div>
                    <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                      {spk.position ? `${spk.position} • ` : ''}{spk.department || '-'}
                    </div>
                    {spk.email && (
                      <div style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 600 }}>{spk.email}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags Section with Admin / Specific Users Tag Assignment */}
          <div
            style={{
              background: '#FFFBEB',
              border: '1.5px solid #FDE68A',
              borderRadius: '14px',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={16} color="#D97706" />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400E' }}>
                  เนื้อหาองค์ความรู้ที่เกี่ยวข้อง (Tags)
                </span>
              </div>

              {canManageTags && !isEditingTags && (
                <button
                  type="button"
                  onClick={() => setIsEditingTags(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    border: '1px solid #F59E0B',
                    background: '#FFFFFF',
                    color: '#B45309',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Edit2 size={12} />
                  <span>กำหนด / แก้ไขแท็ก</span>
                </button>
              )}
            </div>

            {/* Displaying current tags or editor */}
            {isEditingTags ? (
              <div style={{ marginTop: '0.5rem' }}>
                {/* Search Box */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    marginBottom: '8px',
                    gap: '6px',
                  }}
                >
                  <Search size={14} color="#94A3B8" />
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="ค้นหาแท็ก..."
                    style={{
                      border: 'none',
                      outline: 'none',
                      fontSize: '0.8rem',
                      width: '100%',
                      background: 'transparent',
                    }}
                  />
                </div>

                {/* Checkboxes matching image 3 */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '6px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    padding: '4px',
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    marginBottom: '8px',
                  }}
                >
                  {filteredAvailableTags.map((t) => {
                    const isChecked = selectedTags.includes(t);
                    return (
                      <label
                        key={t}
                        onClick={() => handleToggleTag(t)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          padding: '3px 6px',
                          borderRadius: '6px',
                          background: isChecked ? '#FEF3C7' : 'transparent',
                          fontSize: '0.8rem',
                          color: isChecked ? '#B45309' : '#334155',
                          fontWeight: isChecked ? 700 : 500,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#D97706' }}
                        />
                        <span>{t}</span>
                      </label>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTags(session.tags || []);
                      setIsEditingTags(false);
                    }}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTags}
                    disabled={isSavingTags}
                    style={{
                      background: '#D97706',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isSavingTags ? 'กำลังบันทึก...' : 'บันทึกแท็ก'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {(session.tags || []).length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {session.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#FFFFFF',
                          color: '#B45309',
                          border: '1px solid #FDE68A',
                          borderRadius: '20px',
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#92400E', fontStyle: 'italic' }}>
                    ยังไม่ได้กำหนดแท็กเนื้อหา (Admin และผู้มีสิทธิ์จัดการแท็กสามารถกดกำหนดแท็กได้)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Overview details */}
          <div>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} color="#059669" />
              <span>รายละเอียดของเนื้อหาในภาพรวม</span>
            </div>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1rem',
                fontSize: '0.9rem',
                color: '#334155',
                lineHeight: 1.7,
                whiteSpace: 'pre-line',
              }}
            >
              {session.overview || '-'}
            </div>
          </div>

          {/* Presentation Attachment Link */}
          {session.materialUrl && (
            <div
              style={{
                background: '#ECFDF5',
                border: '1.5px solid #A7F3D0',
                borderRadius: '14px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#10B981',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Link2 size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#065F46' }}>
                    เอกสารประกอบการบรรยาย / สไลด์นำเสนอ
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#047857', wordBreak: 'break-all' }}>
                    {session.materialUrl}
                  </div>
                </div>
              </div>

              <a
                href={session.materialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                }}
              >
                <span>เปิดเอกสาร</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Google Calendar Quick Add Button */}
          {googleCalUrl && (
            <div
              style={{
                background: '#F0F9FF',
                border: '1.5px solid #BAE6FD',
                borderRadius: '14px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarPlus size={20} color="#0284C7" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0369A1' }}>
                  บันทึกลงปฏิทิน Google Calendar ส่วนบุคคลของคุณ
                </span>
              </div>
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0284C7',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                }}
              >
                <span>+ เพิ่มลง Google Calendar</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}

          {/* Audit trail footer */}
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
            ผู้บันทึกการจอง: {session.creator?.name || 'บุคลากรสำนักฯ'} ({session.creator?.department || '-'}) &bull; บันทึกเมื่อ {new Date(session.createdAt || Date.now()).toLocaleDateString('th-TH')}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.75rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {canManageSession && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onEdit(session);
                    onClose();
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                >
                  <Edit2 size={14} />
                  <span>แก้ไขข้อมูล</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onDelete(session);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    color: '#DC2626',
                    borderColor: '#FECACA',
                    background: '#FEF2F2',
                  }}
                >
                  <Trash2 size={14} />
                  <span>ลบรายการ</span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
