'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Eye,
  Edit3,
  FileText,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Minus,
  RotateCcw,
  Heading2,
  Heading3,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

/**
 * OFI Detail Modal with WYSIWYG editor
 * - ผู้รับผิดชอบ (Assignees), DCC, MR can edit
 * - Other users see read-only view
 * 
 * Uses the same contentEditable + execCommand WYSIWYG pattern as AdminManualEmailModal
 */
export default function OfiDetailModal({
  isOpen,
  onClose,
  ofiItem,
  onSave,
  editPermission = 'VIEW', // 'FULL' | 'MR' | 'ASSIGNEE' | 'VIEW'
}) {
  const editorRef = useRef(null);
  const [contentHtml, setContentHtml] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'
  const [saved, setSaved] = useState(false);

  const canEdit = editPermission === 'FULL' || editPermission === 'MR' || editPermission === 'ASSIGNEE';

  useEffect(() => {
    if (isOpen && ofiItem) {
      const html = ofiItem.detailsHtml || '';
      setContentHtml(html);
      setSaved(false);
      setActiveTab(canEdit ? 'edit' : 'preview');
      // Defer setting innerHTML until after render
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = html;
        }
      }, 50);
    }
  }, [isOpen, ofiItem]);

  // Keep editor synced when switching tabs
  useEffect(() => {
    if (activeTab === 'edit' && editorRef.current && canEdit) {
      if (editorRef.current.innerHTML !== contentHtml) {
        editorRef.current.innerHTML = contentHtml;
      }
    }
  }, [activeTab]);

  if (!isOpen || !ofiItem) return null;

  const executeCommand = (command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      setContentHtml(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContentHtml(editorRef.current.innerHTML);
    }
  };

  const handleAddLink = () => {
    const url = prompt('ระบุ URL ลิงก์ที่ต้องการแทรก (เช่น https://...):');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...ofiItem,
        detailsHtml: contentHtml,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save OFI detail error:', err);
    } finally {
      setIsSaving(false);
    }
  };

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
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '1.25rem',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText size={22} color="#FFFFFF" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                รายละเอียด OFI
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#EDE9FE', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ofiItem.sourceAuditTopic || 'ไม่ระบุหัวข้อ'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!canEdit && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  fontSize: '0.725rem',
                  fontWeight: 600,
                }}
              >
                <Lock size={12} />
                <span>อ่านอย่างเดียว</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Source Info Card */}
        <div style={{ padding: '1rem 1.75rem 0' }}>
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.65rem',
              fontSize: '0.825rem',
            }}
          >
            <div>
              <span style={{ color: '#64748B', fontWeight: 600 }}>หัวข้อที่ตรวจ: </span>
              <span style={{ color: '#0F172A', fontWeight: 700 }}>{ofiItem.sourceAuditTopic || '-'}</span>
            </div>
            <div>
              <span style={{ color: '#64748B', fontWeight: 600 }}>ข้อกำหนดอ้างอิง: </span>
              <span style={{ color: '#0F172A' }}>{ofiItem.sourceClauses || '-'}</span>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>ข้อค้นพบ OFI: </span>
              <span style={{ color: '#334155' }}>{ofiItem.sourceFindings || '-'}</span>
            </div>
            {ofiItem.assignees && ofiItem.assignees.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>ผู้รับผิดชอบ: </span>
                <span style={{ color: '#334155' }}>
                  {ofiItem.assignees.map((a) => a.name).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.75rem 1.5rem' }}>
          {canEdit ? (
            <>
              {/* Tab Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: activeTab === 'edit' ? '#7C3AED' : '#CBD5E1',
                    background: activeTab === 'edit' ? '#F5F3FF' : '#FFFFFF',
                    color: activeTab === 'edit' ? '#7C3AED' : '#64748B',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={14} />
                  <span>แก้ไข</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: activeTab === 'preview' ? '#7C3AED' : '#CBD5E1',
                    background: activeTab === 'preview' ? '#F5F3FF' : '#FFFFFF',
                    color: activeTab === 'preview' ? '#7C3AED' : '#64748B',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={14} />
                  <span>ดูตัวอย่าง</span>
                </button>
              </div>

              {activeTab === 'edit' ? (
                <div
                  style={{
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: '#FFFFFF',
                  }}
                >
                  {/* WYSIWYG Toolbar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      flexWrap: 'wrap',
                      padding: '0.4rem 0.6rem',
                      background: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                    }}
                  >
                    {/* Heading Formats */}
                    <button type="button" onClick={() => executeCommand('formatBlock', '<h2>')} style={toolbarBtnStyle} title="หัวข้อขนาดใหญ่ (H2)">
                      <Heading2 size={15} />
                    </button>
                    <button type="button" onClick={() => executeCommand('formatBlock', '<h3>')} style={toolbarBtnStyle} title="หัวข้อขนาดย่อย (H3)">
                      <Heading3 size={15} />
                    </button>
                    <button type="button" onClick={() => executeCommand('formatBlock', '<p>')} style={{ ...toolbarBtnStyle, fontSize: '0.75rem', fontWeight: 600 }} title="ย่อหน้าปกติ">
                      Normal
                    </button>

                    <div style={separatorStyle} />

                    {/* Basic Formatting */}
                    <button type="button" onClick={() => executeCommand('bold')} style={toolbarBtnStyle} title="ตัวหนา (Bold)">
                      <Bold size={15} />
                    </button>
                    <button type="button" onClick={() => executeCommand('italic')} style={toolbarBtnStyle} title="ตัวเอียง (Italic)">
                      <Italic size={15} />
                    </button>
                    <button type="button" onClick={() => executeCommand('underline')} style={toolbarBtnStyle} title="ขีดเส้นใต้ (Underline)">
                      <Underline size={15} />
                    </button>
                    <button type="button" onClick={() => executeCommand('strikeThrough')} style={toolbarBtnStyle} title="ขีดฆ่า (Strikethrough)">
                      <Strikethrough size={15} />
                    </button>

                    <div style={separatorStyle} />

                    {/* Colors */}
                    <button type="button" onClick={() => executeCommand('foreColor', '#7C3AED')} style={{ ...toolbarBtnStyle, color: '#7C3AED', fontWeight: 700 }} title="สีม่วง (OFI Purple)">
                      A
                    </button>
                    <button type="button" onClick={() => executeCommand('foreColor', '#E11D48')} style={{ ...toolbarBtnStyle, color: '#E11D48', fontWeight: 700 }} title="สีแดง">
                      A
                    </button>
                    <button type="button" onClick={() => executeCommand('foreColor', '#059669')} style={{ ...toolbarBtnStyle, color: '#059669', fontWeight: 700 }} title="สีเขียว">
                      A
                    </button>
                    <button type="button" onClick={() => executeCommand('foreColor', '#334155')} style={{ ...toolbarBtnStyle, color: '#334155', fontWeight: 700 }} title="สีปกติ">
                      A
                    </button>

                    <div style={separatorStyle} />

                    {/* Alignment */}
                    <button type="button" onClick={() => executeCommand('justifyLeft')} style={toolbarBtnStyle} title="ชิดซ้าย">
                      <AlignLeft size={15} />
                    </button>
                    <button type="button" onClick={() => executeCommand('justifyCenter')} style={toolbarBtnStyle} title="กึ่งกลาง">
                      <AlignCenter size={15} />
                    </button>
                    <button type="button" onClick={() => executeCommand('justifyRight')} style={toolbarBtnStyle} title="ชิดขวา">
                      <AlignRight size={15} />
                    </button>

                    <div style={separatorStyle} />

                    {/* Lists */}
                    <button type="button" onClick={() => executeCommand('insertUnorderedList')} style={toolbarBtnStyle} title="Bullet List">
                      <List size={15} />
                    </button>
                    <button type="button" onClick={() => executeCommand('insertOrderedList')} style={toolbarBtnStyle} title="Numbered List">
                      <ListOrdered size={15} />
                    </button>

                    <div style={separatorStyle} />

                    {/* Utility */}
                    <button type="button" onClick={handleAddLink} style={toolbarBtnStyle} title="แทรกลิงก์ (Link)">
                      <Link2 size={15} />
                    </button>
                    <button type="button" onClick={() => executeCommand('insertHorizontalRule')} style={toolbarBtnStyle} title="เส้นคั่น">
                      <Minus size={15} />
                    </button>
                    <button type="button" onClick={() => executeCommand('removeFormat')} style={toolbarBtnStyle} title="ล้างการจัดรูปแบบ">
                      <RotateCcw size={14} />
                    </button>
                  </div>

                  {/* Content Editable Area */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorInput}
                    style={{
                      minHeight: '250px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      padding: '1rem',
                      outline: 'none',
                      fontSize: '0.9rem',
                      lineHeight: 1.7,
                      color: '#334155',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              ) : (
                // Preview Mode
                <div
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    minHeight: '250px',
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    color: '#334155',
                    background: '#FAFAFA',
                  }}
                  dangerouslySetInnerHTML={{ __html: contentHtml || '<p style="color:#94A3B8;">ยังไม่มีเนื้อหา</p>' }}
                />
              )}
            </>
          ) : (
            // Read-only View
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#64748B',
                }}
              >
                <Eye size={16} />
                <span>รายละเอียดเพิ่มเติม (อ่านอย่างเดียว)</span>
              </div>
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  minHeight: '200px',
                  fontSize: '0.9rem',
                  lineHeight: 1.7,
                  color: '#334155',
                  background: '#FAFAFA',
                }}
                dangerouslySetInnerHTML={{ __html: contentHtml || '<p style="color:#94A3B8;">ยังไม่มีเนื้อหา</p>' }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.75rem',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          {saved && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#059669',
                fontSize: '0.825rem',
                fontWeight: 600,
                marginRight: 'auto',
              }}
            >
              <CheckCircle2 size={16} />
              <span>บันทึกสำเร็จ</span>
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ปิด
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(124, 58, 237, 0.3)',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Shared toolbar button style
const toolbarBtnStyle = {
  padding: '0.2rem 0.4rem',
  height: 'auto',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: '4px',
  color: '#475569',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const separatorStyle = {
  width: '1px',
  height: '18px',
  background: '#E2E8F0',
  margin: '0 3px',
};
