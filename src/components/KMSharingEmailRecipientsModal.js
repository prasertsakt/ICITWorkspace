'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Mail,
  Plus,
  Trash2,
  Users,
  Search,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function KMSharingEmailRecipientsModal({
  isOpen,
  onClose,
  recipients = [],
  personnelList = [],
  onSaveRecipients,
}) {
  const [list, setList] = useState(() => (Array.isArray(recipients) ? recipients : []));
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [personSearch, setPersonSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setList(Array.isArray(recipients) ? recipients : []);
      setSelectedPersonId('');
      setCustomEmail('');
      setCustomName('');
      setPersonSearch('');
      setErrorMsg('');
    }
  }, [isOpen, recipients]);

  // Personnel filter
  const filteredPersonnel = useMemo(() => {
    const q = personSearch.toLowerCase().trim();
    const existingEmails = new Set(list.map((r) => (r.email || '').toLowerCase().trim()));

    return personnelList
      .filter((p) => p.email && !existingEmails.has(p.email.toLowerCase().trim()))
      .filter((p) => {
        if (!q) return true;
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q) ||
          (p.department || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 15);
  }, [personnelList, personSearch, list]);

  const handleAddFromPersonnel = (p) => {
    if (!p || !p.email) return;
    setList((prev) => [
      ...prev,
      {
        email: p.email.trim(),
        name: p.name,
        department: p.department || '',
        position: p.position || '',
        note: 'บุคลากรในสำนักฯ',
      },
    ]);
    setPersonSearch('');
  };

  const handleAddCustom = () => {
    const email = customEmail.trim();
    if (!email || !email.includes('@')) {
      setErrorMsg('กรุณาระบุอีเมลที่ถูกต้อง');
      return;
    }
    if (list.some((r) => r.email.toLowerCase() === email.toLowerCase())) {
      setErrorMsg('อีเมลนี้มีอยู่ในรายชื่อผู้รับแล้ว');
      return;
    }

    setList((prev) => [
      ...prev,
      {
        email,
        name: customName.trim() || email,
        note: 'กำหนดเอง',
      },
    ]);
    setCustomEmail('');
    setCustomName('');
    setErrorMsg('');
  };

  const handleRemove = (emailToRemove) => {
    setList((prev) => prev.filter((r) => r.email.toLowerCase() !== emailToRemove.toLowerCase()));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveRecipients(list);
      onClose();
    } catch (err) {
      console.error('Save recipients error:', err);
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
          maxWidth: '620px',
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
            padding: '1.25rem 1.5rem',
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
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BellRing size={18} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                ตั้งค่าผู้รับอีเมลแจ้งเตือนการจองบรรยาย (Admin)
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#D1FAE5' }}>
                กำหนดรายชื่อผู้รับอีเมลแจ้งเตือนเมื่อมีการจองหรือปรับปรุงการบรรยายกลุ่มย่อย
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

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Explanation Info Box */}
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <Sparkles size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.775rem', color: '#166534', lineHeight: 1.5 }}>
              เมื่อมีบุคลากรสร้างการจองวันเวลาบรรยายกลุ่มย่อยใหม่ ระบบจะส่งอีเมลแจ้งเตือนไปยังรายชื่อด้านล่างนี้โดยอัตโนมัติ (พร้อมลิงก์ปฏิทิน Google Calendar และรายละเอียดการบรรยาย)
            </div>
          </div>

          {/* Quick Select from Personnel */}
          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
              <Users size={15} color="#059669" />
              <span>เลือกจากทำเนียบบุคลากรสำนักฯ</span>
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F8FAFC',
                border: '1.5px solid #CBD5E1',
                borderRadius: '10px',
                padding: '6px 10px',
                gap: '8px',
              }}
            >
              <Search size={15} color="#94A3B8" />
              <input
                type="text"
                value={personSearch}
                onChange={(e) => setPersonSearch(e.target.value)}
                placeholder="ค้นหาชื่อบุคลากรหรืออีเมลเพื่อเพิ่มเป็นผู้รับแจ้งเตือน..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.85rem',
                  width: '100%',
                }}
              />
            </div>

            {personSearch && filteredPersonnel.length > 0 && (
              <div
                style={{
                  marginTop: '4px',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                {filteredPersonnel.map((p) => (
                  <div
                    key={p.id || p.email}
                    onClick={() => handleAddFromPersonnel(p)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #F1F5F9',
                      fontSize: '0.825rem',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#ECFDF5')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: '#1E293B' }}>{p.name}</span>
                      <span style={{ color: '#64748B', fontSize: '0.75rem', marginLeft: '6px' }}>({p.email})</span>
                    </div>
                    <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.75rem' }}>+ เพิ่ม</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Or Manual Custom Email */}
          <div>
            <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
              <Mail size={15} color="#059669" />
              <span>หรือ ระบุอีเมลอื่น ๆ โดยตรง</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="ชื่อ / ตำแหน่ง (ระบุหรือไม่ก็ได้)"
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.825rem',
                  outline: 'none',
                }}
              />
              <input
                type="email"
                value={customEmail}
                onChange={(e) => {
                  setCustomEmail(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="name@icit.kmutnb.ac.th"
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.825rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="btn btn-secondary"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={15} />
                <span>เพิ่ม</span>
              </button>
            </div>
            {errorMsg && (
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>
                {errorMsg}
              </p>
            )}
          </div>

          {/* Current Configured Recipients List */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginBottom: '0.4rem' }}>
              รายชื่อผู้รับอีเมลปัจจุบัน ({list.length} อีเมล)
            </div>

            <div
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                maxHeight: '220px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '6px',
              }}
            >
              {list.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8', fontSize: '0.825rem' }}>
                  ยังไม่มีรายชื่อผู้รับอีเมลแจ้งเตือน
                </div>
              ) : (
                list.map((item, idx) => (
                  <div
                    key={item.email || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#FAFAFA',
                      border: '1px solid #F1F5F9',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                        {item.name || item.email}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                        {item.email} {item.department ? `• ${item.department}` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.email)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                      }}
                      title="ลบออกจากรายชื่อ"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
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
            onClick={handleSave}
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
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>
    </div>
  );
}
