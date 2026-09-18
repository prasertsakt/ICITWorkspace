'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Save,
  Sliders,
  AlertCircle,
  HelpCircle,
  Search,
} from 'lucide-react';
import {
  subscribeImsAuditTopics,
  saveImsAuditTopics,
  resetImsAuditTopicsToDefault,
} from '@/lib/imsService';

export default function ImsAuditTopicsModal({ isOpen, onClose, actor }) {
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeImsAuditTopics((data) => {
      setTopics(Array.isArray(data) ? [...data] : []);
      setHasUnsavedChanges(false);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const showStatus = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => {
      setStatusMsg(null);
    }, 3500);
  };

  const handleAddTopic = (e) => {
    if (e) e.preventDefault();
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    if (topics.includes(trimmed)) {
      showStatus('มีหัวข้อนี้อยู่ในรายการแล้ว', 'error');
      return;
    }
    const updated = [...topics, trimmed];
    setTopics(updated);
    setNewTopic('');
    setHasUnsavedChanges(true);
    showStatus('เพิ่มหัวข้อในรายการแล้ว (อย่าลืมกดบันทึก)', 'info');
  };

  const handleStartEdit = (idx, currentText) => {
    setEditingIndex(idx);
    setEditingText(currentText);
  };

  const handleSaveEdit = (idx) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      showStatus('หัวข้อไม่สามารถเว้นว่างได้', 'error');
      return;
    }
    const updated = [...topics];
    updated[idx] = trimmed;
    setTopics(updated);
    setEditingIndex(null);
    setEditingText('');
    setHasUnsavedChanges(true);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const handleDelete = (idx) => {
    const target = topics[idx];
    if (window.confirm(`คุณต้องการลบหัวข้อ "${target}" หรือไม่?`)) {
      const updated = topics.filter((_, i) => i !== idx);
      setTopics(updated);
      if (editingIndex === idx) {
        setEditingIndex(null);
      }
      setHasUnsavedChanges(true);
      showStatus('ลบหัวข้อออกจากรายการแล้ว (อย่าลืมกดบันทึก)', 'info');
    }
  };

  const handleMoveUp = (idx) => {
    if (idx === 0) return;
    const updated = [...topics];
    const temp = updated[idx - 1];
    updated[idx - 1] = updated[idx];
    updated[idx] = temp;
    setTopics(updated);
    setHasUnsavedChanges(true);
  };

  const handleMoveDown = (idx) => {
    if (idx === topics.length - 1) return;
    const updated = [...topics];
    const temp = updated[idx + 1];
    updated[idx + 1] = updated[idx];
    updated[idx] = temp;
    setTopics(updated);
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await saveImsAuditTopics(topics, actor);
      setHasUnsavedChanges(false);
      showStatus('บันทึกรายการหัวข้อที่รับการตรวจเรียบร้อยแล้ว', 'success');
    } catch (err) {
      console.error(err);
      showStatus('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (
      window.confirm(
        'คุณแน่ใจหรือไม่ว่าต้องการคืนค่าเริ่มต้น 23 หัวข้อมาตรฐาน? ข้อมูลที่ปรับแต่งไว้จะถูกแทนที่ด้วยค่ามาตรฐาน'
      )
    ) {
      setIsSaving(true);
      try {
        const defaultList = await resetImsAuditTopicsToDefault(actor);
        setTopics([...defaultList]);
        setHasUnsavedChanges(false);
        setEditingIndex(null);
        showStatus('คืนค่าหัวข้อมาตรฐาน 23 รายการเรียบร้อยแล้ว', 'success');
      } catch (err) {
        console.error(err);
        showStatus('เกิดข้อผิดพลาดในการคืนค่าเริ่มต้น', 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const filteredTopics = topics
    .map((topic, index) => ({ topic, originalIndex: index }))
    .filter(({ topic }) =>
      searchQuery ? topic.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
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
                background: 'rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sliders size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  จัดการหัวข้อที่รับการตรวจ
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                  }}
                >
                  {topics.length} หัวข้อ
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#CCFBF1', margin: '2px 0 0 0' }}>
                Predefined Audit Topics สำหรับการตรวจติดตามภายใน (Internal Audit) และ OFI Hub
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (hasUnsavedChanges) {
                if (window.confirm('คุณมีรายการที่ยังไม่ได้บันทึก ต้องการปิดโดยไม่บันทึกหรือไม่?')) {
                  onClose();
                }
              } else {
                onClose();
              }
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="ปิดหน้าต่าง"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div
            style={{
              padding: '0.6rem 1.25rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500,
              background:
                statusMsg.type === 'error'
                  ? '#FEF2F2'
                  : statusMsg.type === 'info'
                  ? '#EFF6FF'
                  : '#ECFDF5',
              color:
                statusMsg.type === 'error'
                  ? '#B91C1C'
                  : statusMsg.type === 'info'
                  ? '#1D4ED8'
                  : '#047857',
              borderBottom: `1px solid ${
                statusMsg.type === 'error'
                  ? '#FECACA'
                  : statusMsg.type === 'info'
                  ? '#BFDBFE'
                  : '#A7F3D0'
              }`,
            }}
          >
            <AlertCircle size={16} />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Add & Filter Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Add form */}
          <form onSubmit={handleAddTopic} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="พิมพ์ชื่อหัวข้อที่รับการตรวจใหม่ แล้วกดปุ่มเพิ่ม..."
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                fontSize: '0.9rem',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                outline: 'none',
                background: '#FFFFFF',
              }}
            />
            <button
              type="submit"
              disabled={!newTopic.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: '#0D9488',
                color: '#FFFFFF',
                border: 'none',
                cursor: newTopic.trim() ? 'pointer' : 'not-allowed',
                opacity: newTopic.trim() ? 1 : 0.6,
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={16} />
              <span>เพิ่มหัวข้อ</span>
            </button>
          </form>

          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาหัวข้อในรายการ..."
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2.25rem',
                fontSize: '0.85rem',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#334155',
              }}
            />
          </div>
        </div>

        {/* Topic List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {filteredTopics.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#94A3B8',
                fontSize: '0.9rem',
              }}
            >
              <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <div>ไม่พบหัวข้อที่ค้นหา</div>
            </div>
          ) : (
            filteredTopics.map(({ topic, originalIndex }, displayIdx) => {
              const isEditing = editingIndex === originalIndex;

              return (
                <div
                  key={originalIndex}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: isEditing ? '#F0FDFA' : '#FFFFFF',
                    border: isEditing ? '1.5px solid #0D9488' : '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Index badge */}
                  <span
                    style={{
                      minWidth: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: isEditing ? '#0D9488' : '#F1F5F9',
                      color: isEditing ? '#FFFFFF' : '#64748B',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {originalIndex + 1}
                  </span>

                  {/* Topic text / edit input */}
                  <div style={{ flex: 1 }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(originalIndex);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.875rem',
                          borderRadius: '6px',
                          border: '1.5px solid #0D9488',
                          outline: 'none',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: '#1E293B',
                          fontWeight: 500,
                          lineHeight: 1.4,
                        }}
                      >
                        {topic}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(originalIndex)}
                          title="บันทึกข้อความ"
                          style={{
                            background: '#0D9488',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          <Check size={14} />
                          <span>ตกลง</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          title="ยกเลิก"
                          style={{
                            background: '#F1F5F9',
                            color: '#64748B',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          ยกเลิก
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Move Up / Down (Disabled when searching) */}
                        {!searchQuery && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleMoveUp(originalIndex)}
                              disabled={originalIndex === 0}
                              title="เลื่อนขึ้น"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: originalIndex === 0 ? '#CBD5E1' : '#64748B',
                                padding: '4px',
                                borderRadius: '4px',
                                cursor: originalIndex === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <ArrowUp size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveDown(originalIndex)}
                              disabled={originalIndex === topics.length - 1}
                              title="เลื่อนลง"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color:
                                  originalIndex === topics.length - 1 ? '#CBD5E1' : '#64748B',
                                padding: '4px',
                                borderRadius: '4px',
                                cursor:
                                  originalIndex === topics.length - 1 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <ArrowDown size={15} />
                            </button>
                          </>
                        )}

                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(originalIndex, topic)}
                          title="แก้ไขหัวข้อ"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#0284C7',
                            padding: '4px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(originalIndex)}
                          title="ลบหัวข้อ"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#EF4444',
                            padding: '4px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={handleResetDefault}
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.55rem 0.9rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#64748B',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
            }}
            title="คืนค่าเป็น 23 หัวข้อมาตรฐานเริ่มต้น"
          >
            <RotateCcw size={14} />
            <span>คืนค่าเริ่มต้น (23 หัวข้อ)</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasUnsavedChanges && (
              <span style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 600 }}>
                • มีการเปลี่ยนแปลงที่ยังไม่บันทึก
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.65rem 1.4rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#FFFFFF',
                background: '#0D9488',
                border: 'none',
                borderRadius: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
