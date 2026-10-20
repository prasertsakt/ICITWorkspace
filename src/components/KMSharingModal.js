'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Link2,
  Tag,
  Search,
  Plus,
  Check,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { SHARING_FORMATS, SHARING_STATUSES } from '@/lib/kmSharingService';

export default function KMSharingModal({
  isOpen,
  onClose,
  onSave,
  sessionToEdit = null,
  initialDate = null,
  personnelList = [],
  availableTags = [],
  currentUser = null,
  currentPersonnel = null,
  isAdmin = false,
}) {
  // Form state
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState('บรรยายกลุ่มย่อย/Focus group');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [location, setLocation] = useState('ห้องประชุมสำนักคอมพิวเตอร์ฯ หรือ ออนไลน์');
  const [overview, setOverview] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [status, setStatus] = useState('SCHEDULED');

  // Tag search in modal
  const [tagSearch, setTagSearch] = useState('');

  // Personnel search for speaker selector
  const [speakerSearch, setSpeakerSearch] = useState('');
  const [isSpeakerDropdownOpen, setIsSpeakerDropdownOpen] = useState(false);

  // Errors state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (sessionToEdit) {
      setTopic(sessionToEdit.topic || '');
      setFormat(sessionToEdit.format || 'บรรยายกลุ่มย่อย/Focus group');
      setDate(sessionToEdit.date || '');
      setStartTime(sessionToEdit.startTime || '10:00');
      setEndTime(sessionToEdit.endTime || '12:00');
      setLocation(sessionToEdit.location || '');
      setOverview(sessionToEdit.overview || '');
      setMaterialUrl(sessionToEdit.materialUrl || '');
      setSelectedTags(sessionToEdit.tags || []);
      setSpeakers(sessionToEdit.speakers || []);
      setStatus(sessionToEdit.status || 'SCHEDULED');
    } else {
      setTopic('');
      setFormat('บรรยายกลุ่มย่อย/Focus group');
      setDate(initialDate || new Date().toISOString().slice(0, 10));
      setStartTime('10:00');
      setEndTime('12:00');
      setLocation('ห้องประชุมสำนักคอมพิวเตอร์ฯ หรือ ออนไลน์ (MS Teams/Google Meet)');
      setOverview('');
      setMaterialUrl('');
      setSelectedTags(['AI']);
      setStatus('SCHEDULED');

      // Default speaker: current logged in user if available
      if (currentPersonnel) {
        setSpeakers([
          {
            id: currentPersonnel.id || currentPersonnel.email,
            name: currentPersonnel.name,
            email: currentPersonnel.email,
            department: currentPersonnel.department || '',
            position: currentPersonnel.position || '',
          },
        ]);
      } else {
        setSpeakers([]);
      }
    }
    setErrors({});
    setTagSearch('');
    setSpeakerSearch('');
    setIsSpeakerDropdownOpen(false);
  }, [sessionToEdit, initialDate, currentPersonnel, isOpen]);

  // Filtered personnel for speaker picker
  const filteredPersonnel = useMemo(() => {
    const q = speakerSearch.toLowerCase().trim();
    const existingIds = new Set(speakers.map((s) => s.id || s.email));

    return personnelList
      .filter((p) => !existingIds.has(p.id || p.email))
      .filter((p) => {
        if (!q) return true;
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q) ||
          (p.department || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 10);
  }, [personnelList, speakerSearch, speakers]);

  // Filtered tags for tag selector
  const filteredTags = useMemo(() => {
    const q = tagSearch.toLowerCase().trim();
    if (!q) return availableTags;
    return availableTags.filter((t) => t.toLowerCase().includes(q));
  }, [availableTags, tagSearch]);

  const handleAddSpeaker = (person) => {
    if (speakers.length >= 3) return;
    setSpeakers((prev) => [
      ...prev,
      {
        id: person.id || person.email,
        name: person.name,
        email: person.email,
        department: person.department || '',
        position: person.position || '',
      },
    ]);
    setSpeakerSearch('');
    setIsSpeakerDropdownOpen(false);
    if (errors.speakers) {
      setErrors((prev) => ({ ...prev, speakers: null }));
    }
  };

  const handleRemoveSpeaker = (speakerId) => {
    setSpeakers((prev) => prev.filter((s) => (s.id || s.email) !== speakerId));
  };

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const validate = () => {
    const errs = {};
    if (!topic.trim()) errs.topic = 'กรุณาระบุหัวข้อบรรยาย / ชื่อองค์ความรู้';
    if (!date) errs.date = 'กรุณาระบุวันที่จัดบรรยาย';
    if (!startTime) errs.startTime = 'กรุณาระบุเวลาเริ่มต้น';
    if (!endTime) errs.endTime = 'กรุณาระบุเวลาสิ้นสุด';
    if (startTime && endTime && startTime >= endTime) {
      errs.endTime = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น';
    }
    if (!location.trim()) errs.location = 'กรุณาระบุสถานที่หรือลิงก์การประชุม';
    if (speakers.length === 0) errs.speakers = 'กรุณาระบุผู้บรรยายอย่างน้อย 1 ท่าน (สูงสุด 3 ท่าน)';
    if (!overview.trim()) errs.overview = 'กรุณาระบุรายละเอียดของเนื้อหาในภาพรวม';
    if (!materialUrl.trim()) errs.materialUrl = 'กรุณาแนบลิงก์เอกสารประกอบการบรรยาย';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...(sessionToEdit || {}),
        topic: topic.trim(),
        format,
        date,
        startTime,
        endTime,
        location: location.trim(),
        overview: overview.trim(),
        materialUrl: materialUrl.trim(),
        tags: selectedTags,
        speakers,
        status,
      };

      await onSave(payload);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
          maxWidth: '780px',
          maxHeight: '92vh',
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
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={20} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
                {sessionToEdit ? 'แก้ไขข้อมูลการบรรยายกลุ่มย่อย' : 'จองวันเวลาบรรยายกลุ่มย่อย (แบ่งปันความรู้)'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#D1FAE5' }}>
                ระบบจัดการและแบ่งปันองค์ความรู้บุคลากร สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.
              </p>
            </div>
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
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section 1: Speakers (สูงสุด 3 คน) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} color="#059669" />
                <span>ผู้แชร์ขององค์ความรู้ / ผู้บรรยาย (สูงสุด 3 คน) <span style={{ color: '#EF4444' }}>*</span></span>
              </label>
              <span style={{ fontSize: '0.75rem', color: speakers.length >= 3 ? '#DC2626' : '#64748B', fontWeight: 600 }}>
                {speakers.length}/3 ท่าน
              </span>
            </div>

            {/* Selected Speakers Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {speakers.map((spk, idx) => (
                <div
                  key={spk.id || spk.email || idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '12px',
                    padding: '6px 12px',
                    fontSize: '0.825rem',
                    color: '#065F46',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#10B981',
                      color: '#FFFFFF',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{spk.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#047857' }}>{spk.department || spk.position || spk.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpeaker(spk.id || spk.email)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#047857',
                      padding: '2px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="ลบผู้บรรยาย"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Speaker Input Dropdown */}
            {speakers.length < 3 && (
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: `1.5px solid ${errors.speakers ? '#EF4444' : '#CBD5E1'}`,
                    borderRadius: '10px',
                    padding: '0.45rem 0.75rem',
                    background: '#F8FAFC',
                    gap: '8px',
                  }}
                >
                  <Search size={16} color="#94A3B8" />
                  <input
                    type="text"
                    value={speakerSearch}
                    onChange={(e) => {
                      setSpeakerSearch(e.target.value);
                      setIsSpeakerDropdownOpen(true);
                    }}
                    onFocus={() => setIsSpeakerDropdownOpen(true)}
                    placeholder="พิมพ์ชื่อหรืออีเมลเพื่อเลือกผู้บรรยายจากทำเนียบบุคลากร..."
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.85rem',
                      color: '#1E293B',
                    }}
                  />
                  <Plus size={18} color="#059669" style={{ cursor: 'pointer' }} />
                </div>

                {/* Dropdown Results */}
                {isSpeakerDropdownOpen && filteredPersonnel.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      zIndex: 30,
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    {filteredPersonnel.map((p) => (
                      <div
                        key={p.id || p.email}
                        onClick={() => handleAddSpeaker(p)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F0FDF4')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>{p.name}</div>
                          <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                            {p.position || '-'} &bull; {p.department || '-'}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>+ เพิ่ม</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.speakers && (
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>
                {errors.speakers}
              </p>
            )}
          </div>

          {/* Section 2: Topic / ชื่อองค์ความรู้ */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: '0.35rem' }}>
              ชื่อองค์ความรู้ / หัวข้อบรรยาย <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (errors.topic) setErrors((prev) => ({ ...prev, topic: null }));
              }}
              placeholder="ระบุชื่อองค์ความรู้หรือหัวข้อการบรรยาย เช่น การประยุกต์ใช้ AI ในงานประจำ..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: `1.5px solid ${errors.topic ? '#EF4444' : '#CBD5E1'}`,
                fontSize: '0.9rem',
                outline: 'none',
                background: '#FFFFFF',
              }}
            />
            {errors.topic && (
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>
                {errors.topic}
              </p>
            )}
          </div>

          {/* Section 3: รูปแบบขององค์ความรู้ (Pills matching image 1) */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: '0.35rem' }}>
              รูปแบบขององค์ความรู้ <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
              {SHARING_FORMATS.map((fmt) => {
                const isSelected = format === fmt.key;
                return (
                  <button
                    key={fmt.key}
                    type="button"
                    onClick={() => setFormat(fmt.key)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? fmt.color : '#E2E8F0'}`,
                      background: isSelected ? fmt.bg : '#F8FAFC',
                      color: isSelected ? fmt.color : '#475569',
                      fontSize: '0.825rem',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    {fmt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: วันที่จัด เวลา และสถานที่ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.3rem' }}>
                <Calendar size={14} color="#059669" />
                <span>วันที่บรรยาย <span style={{ color: '#EF4444' }}>*</span></span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
                }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  border: `1.5px solid ${errors.date ? '#EF4444' : '#CBD5E1'}`,
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              {errors.date && (
                <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: '#EF4444' }}>{errors.date}</p>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.3rem' }}>
                <Clock size={14} color="#059669" />
                <span>ช่วงเวลา (เริ่มต้น - สิ้นสุด) <span style={{ color: '#EF4444' }}>*</span></span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.65rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
                <span style={{ color: '#94A3B8', fontWeight: 700 }}>-</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.65rem',
                    borderRadius: '10px',
                    border: `1.5px solid ${errors.endTime ? '#EF4444' : '#CBD5E1'}`,
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
              {errors.endTime && (
                <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: '#EF4444' }}>{errors.endTime}</p>
              )}
            </div>

            <div style={{ gridColumn: 'span 1' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.3rem' }}>
                <MapPin size={14} color="#059669" />
                <span>สถานที่ / ช่องทางออนไลน์ <span style={{ color: '#EF4444' }}>*</span></span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (errors.location) setErrors((prev) => ({ ...prev, location: null }));
                }}
                placeholder="ระบุห้องประชุม หรือ Microsoft Teams / Google Meet"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '10px',
                  border: `1.5px solid ${errors.location ? '#EF4444' : '#CBD5E1'}`,
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              {errors.location && (
                <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: '#EF4444' }}>{errors.location}</p>
              )}
            </div>
          </div>

          {/* Section 5: เนื้อหาองค์ความรู้เกี่ยวข้องกับอะไร? (Tags with search & checkboxes matching image 3) */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
              <Tag size={16} color="#059669" />
              <span>เนื้อหาองค์ความรู้เกี่ยวข้องกับอะไร? (เลือกแท็กที่เกี่ยวข้อง)</span>
            </label>

            <div
              style={{
                border: '1.5px solid #CBD5E1',
                borderRadius: '12px',
                padding: '0.75rem',
                background: '#FAFAFA',
              }}
            >
              {/* Search box for tags */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  marginBottom: '10px',
                  gap: '6px',
                }}
              >
                <Search size={14} color="#94A3B8" />
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="ค้นหาแท็กหมวดหมู่..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.8rem',
                    width: '100%',
                    background: 'transparent',
                  }}
                />
              </div>

              {/* Checkboxes Grid matching image 3 styling */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '8px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {filteredTags.map((t) => {
                  const isChecked = selectedTags.includes(t);
                  return (
                    <label
                      key={t}
                      onClick={() => handleToggleTag(t)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        background: isChecked ? '#FEF3C7' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by label click
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          accentColor: '#D97706',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: isChecked ? 700 : 500,
                          color: isChecked ? '#B45309' : '#334155',
                        }}
                      >
                        {t}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 6: รายละเอียดของเนื้อหาในภาพรวม (Textarea matching image 2) */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
              <FileText size={16} color="#059669" />
              <span>รายละเอียดของเนื้อหาในภาพรวม <span style={{ color: '#EF4444' }}>*</span></span>
            </label>
            <textarea
              rows={4}
              value={overview}
              onChange={(e) => {
                setOverview(e.target.value);
                if (errors.overview) setErrors((prev) => ({ ...prev, overview: null }));
              }}
              placeholder="ระบุสาระสำคัญ วัตถุประสงค์ และหัวข้อที่จะแบ่งปันให้ผู้เข้าร่วมรับทราบ..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: `1.5px solid ${errors.overview ? '#EF4444' : '#CBD5E1'}`,
                fontSize: '0.875rem',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
              }}
            />
            {errors.overview && (
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>
                {errors.overview}
              </p>
            )}
          </div>

          {/* Section 7: แนบลิงก์เอกสารประกอบการบรรยาย */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
              <Link2 size={16} color="#059669" />
              <span>แนบลิงก์เอกสารประกอบการบรรยาย (Google Drive / Canva / Slides / OneDrive) <span style={{ color: '#EF4444' }}>*</span></span>
            </label>
            <input
              type="url"
              value={materialUrl}
              onChange={(e) => {
                setMaterialUrl(e.target.value);
                if (errors.materialUrl) setErrors((prev) => ({ ...prev, materialUrl: null }));
              }}
              placeholder="https://drive.google.com/..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: `1.5px solid ${errors.materialUrl ? '#EF4444' : '#CBD5E1'}`,
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            {errors.materialUrl && (
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>
                {errors.materialUrl}
              </p>
            )}
          </div>

          {/* Edit status (for editing existing session) */}
          {sessionToEdit && (
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: '0.35rem' }}>
                สถานะการบรรยาย
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#FFFFFF',
                }}
              >
                {Object.values(SHARING_STATUSES).map((st) => (
                  <option key={st.key} value={st.key}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '1rem',
              borderTop: '1px solid #E2E8F0',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.6rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
              }}
            >
              {isSubmitting ? 'กำลังบันทึก...' : sessionToEdit ? 'บันทึกการแก้ไข' : 'ยืนยันการจองบรรยาย'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
