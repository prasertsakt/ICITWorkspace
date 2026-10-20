'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { DEFAULT_SHARING_TAGS } from '@/lib/kmSharingService';

export default function KMSharingTagManageModal({
  isOpen,
  onClose,
  tags = [],
  sessions = [],
  onSaveTags,
}) {
  const [currentTags, setCurrentTags] = useState(() => (tags.length > 0 ? tags : DEFAULT_SHARING_TAGS));
  const [newTagName, setNewTagName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize when opening
  React.useEffect(() => {
    if (isOpen) {
      setCurrentTags(tags.length > 0 ? tags : DEFAULT_SHARING_TAGS);
      setNewTagName('');
      setSearchQuery('');
      setEditingIndex(null);
      setErrorMsg('');
    }
  }, [isOpen, tags]);

  // Compute tag usage frequency from sessions
  const tagUsageCount = useMemo(() => {
    const map = {};
    (sessions || []).forEach((s) => {
      (s.tags || []).forEach((t) => {
        map[t] = (map[t] || 0) + 1;
      });
    });
    return map;
  }, [sessions]);

  // Filtered tags for search
  const filteredTags = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return currentTags;
    return currentTags.filter((t) => t.toLowerCase().includes(q));
  }, [currentTags, searchQuery]);

  const handleAddTag = () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    if (currentTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`แท็ก "${trimmed}" มีอยู่ในระบบแล้ว`);
      return;
    }
    setErrorMsg('');
    setCurrentTags((prev) => [...prev, trimmed]);
    setNewTagName('');
  };

  const handleStartEdit = (index, val) => {
    setEditingIndex(index);
    setEditingValue(val);
  };

  const handleSaveEdit = (index) => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setEditingIndex(null);
      return;
    }
    const updated = [...currentTags];
    updated[index] = trimmed;
    setCurrentTags(updated);
    setEditingIndex(null);
  };

  const handleDeleteTag = (tagToDelete) => {
    setCurrentTags((prev) => prev.filter((t) => t !== tagToDelete));
  };

  const handleResetDefaults = () => {
    const merged = Array.from(new Set([...currentTags, ...DEFAULT_SHARING_TAGS]));
    setCurrentTags(merged);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSaveTags(currentTags);
      onClose();
    } catch (err) {
      console.error('Save tags error:', err);
    } finally {
      setIsSaving(false);
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
      }}
    >
      <div
        className="card-glass"
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '88vh',
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
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tag size={18} color="#FBBF24" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                จัดการแท็กเนื้อหาองค์ความรู้ (Admin)
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>
                กำหนดแท็กสำหรับจำแนกหมวดหมู่ความรู้การบรรยายกลุ่มย่อย
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Add Tag Row */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
              เพิ่มแท็กใหม่
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => {
                  setNewTagName(e.target.value);
                  setErrorMsg('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="ระบุชื่อแท็กใหม่ เช่น Big Data, RPA, Design..."
                style={{
                  flex: 1,
                  padding: '0.55rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#FFFFFF',
                  padding: '0.55rem 1rem',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={16} />
                <span>เพิ่ม</span>
              </button>
            </div>
            {errorMsg && (
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>
                {errorMsg}
              </p>
            )}
          </div>

          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '6px 10px',
              gap: '6px',
            }}
          >
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาแท็กในระบบ..."
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '0.8rem',
                width: '100%',
                background: 'transparent',
              }}
            />
          </div>

          {/* Tags List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B' }}>
                รายการแท็กทั้งหมด ({currentTags.length} แท็ก)
              </span>
              <button
                type="button"
                onClick={handleResetDefaults}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284C7',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + เติมแท็กมาตรฐาน
              </button>
            </div>

            <div
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '0.6rem',
                maxHeight: '260px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {filteredTags.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                  ไม่พบแท็กที่ตรงกับการค้นหา
                </div>
              ) : (
                filteredTags.map((tag, idx) => {
                  const isEditing = editingIndex === idx;
                  const usage = tagUsageCount[tag] || 0;

                  return (
                    <div
                      key={tag}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: '#FAFAFA',
                        border: '1px solid #F1F5F9',
                        fontSize: '0.825rem',
                      }}
                    >
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, marginRight: '8px' }}>
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.8rem',
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(idx)}
                            style={{
                              background: '#10B981',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              cursor: 'pointer',
                            }}
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#1E293B' }}>#{tag}</span>
                          {usage > 0 && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: '#059669',
                                background: '#ECFDF5',
                                padding: '1px 6px',
                                borderRadius: '999px',
                                fontWeight: 700,
                              }}
                            >
                              ใช้ {usage} ครั้ง
                            </span>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(idx, tag)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748B',
                              cursor: 'pointer',
                              padding: '3px',
                              borderRadius: '4px',
                            }}
                            title="แก้ไขชื่อแท็ก"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTag(tag)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '3px',
                            borderRadius: '4px',
                          }}
                          title="ลบแท็ก"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.825rem' }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.5rem 1.25rem',
              fontSize: '0.825rem',
              fontWeight: 800,
            }}
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกรายการแท็ก'}
          </button>
        </div>
      </div>
    </div>
  );
}
