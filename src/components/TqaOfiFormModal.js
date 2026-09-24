'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Users,
  Check,
} from 'lucide-react';
import { TQA_CATEGORIES, TQA_KEY_THEMES, TQA_STATUS_CONFIG } from '@/lib/tqaSeedData';
import { saveTqaOfiItem } from '@/lib/tqaOfiService';

export default function TqaOfiFormModal({
  isOpen,
  onClose,
  ofiToEdit = null,
  fiscalYear,
  personnelList = [],
  currentUser,
  onSaved,
}) {
  const [category, setCategory] = useState(TQA_CATEGORIES[0].name);
  const [itemRef, setItemRef] = useState('');
  const [keyTheme, setKeyTheme] = useState(TQA_KEY_THEMES[0].code);
  const [finding, setFinding] = useState('');
  const [evidence, setEvidence] = useState('');
  const [potentialImpact, setPotentialImpact] = useState('');
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState([]);
  const [status, setStatus] = useState('PENDING');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (ofiToEdit) {
        setCategory(ofiToEdit.category || TQA_CATEGORIES[0].name);
        setItemRef(ofiToEdit.itemRef || '');
        setKeyTheme(ofiToEdit.keyTheme || TQA_KEY_THEMES[0].code);
        setFinding(ofiToEdit.finding || '');
        setEvidence(ofiToEdit.evidence || '');
        setPotentialImpact(ofiToEdit.potentialImpact || '');
        setStatus(ofiToEdit.status || 'PENDING');
        const assignedIds = Array.isArray(ofiToEdit.assignedPersons)
          ? ofiToEdit.assignedPersons.map((p) => p.id || p.email)
          : [];
        setSelectedPersonnelIds(assignedIds);
      } else {
        setCategory(TQA_CATEGORIES[0].name);
        setItemRef('');
        setKeyTheme(TQA_KEY_THEMES[0].code);
        setFinding('');
        setEvidence('');
        setPotentialImpact('');
        setSelectedPersonnelIds([]);
        setStatus('PENDING');
      }
      setErrorMsg('');
    }
  }, [isOpen, ofiToEdit]);

  if (!isOpen) return null;

  const handleTogglePersonnel = (person) => {
    const pKey = person.id || person.email;
    setSelectedPersonnelIds((prev) =>
      prev.includes(pKey) ? prev.filter((k) => k !== pKey) : [...prev, pKey]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finding.trim()) {
      setErrorMsg('กรุณากรอกข้อค้นพบ (Finding)');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const selectedCategoryObj = TQA_CATEGORIES.find((c) => c.name === category) || TQA_CATEGORIES[0];
      
      const assignedPersons = selectedPersonnelIds
        .map((pKey) => {
          const found = personnelList.find((p) => (p.id || p.email) === pKey);
          if (found) {
            return {
              id: found.id || '',
              name: found.name || '',
              email: found.email || '',
              department: found.department || '',
              position: found.position || '',
            };
          }
          return null;
        })
        .filter(Boolean);

      const payload = {
        id: ofiToEdit?.id || `tqa-${fiscalYear}-${Date.now()}`,
        fiscalYear: String(fiscalYear),
        category,
        categoryNum: selectedCategoryObj.num,
        itemRef: itemRef.trim(),
        keyTheme,
        finding: finding.trim(),
        evidence: evidence.trim(),
        potentialImpact: potentialImpact.trim(),
        assignedPersons,
        status,
        actionReport: ofiToEdit?.actionReport || '',
      };

      const updatedByName = currentUser?.displayName || currentUser?.email || 'Admin';
      await saveTqaOfiItem(payload, fiscalYear, updatedByName);
      if (onSaved) onSaved(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '1.25rem',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)',
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
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                {ofiToEdit ? 'แก้ไขข้อเสนอแนะ TQA OFI' : 'เพิ่มข้อเสนอแนะ TQA OFI ใหม่'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#DDD6FE' }}>
                ปีงบประมาณ {fiscalYear}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ color: '#FFFFFF' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#FEE2E2',
                color: '#DC2626',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>
                หมวดตามเกณฑ์ TQA <span style={{ color: 'var(--rose-500)' }}>*</span>
              </label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {TQA_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Item Ref. (รหัสข้อกำหนด)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น 1.1ก(2), 2.1ก(4), 6.1ก(1)"
                value={itemRef}
                onChange={(e) => setItemRef(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Key Theme (ภาพรวม)
              </label>
              <select
                className="form-input"
                value={keyTheme}
                onChange={(e) => setKeyTheme(e.target.value)}
              >
                {TQA_KEY_THEMES.map((t) => (
                  <option key={t.id} value={t.code}>
                    {t.code}: {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              ข้อค้นพบ (Finding) <span style={{ color: 'var(--rose-500)' }}>*</span>
            </label>
            <textarea
              rows={3}
              className="form-input"
              placeholder="ระบุข้อค้นพบ สิ่งที่ยังไม่พบกระบวนการเชิงระบบ หรือประเด็นโอกาสในการพัฒนา..."
              value={finding}
              onChange={(e) => setFinding(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              หลักฐานเชิงประจักษ์ (Evidence)
            </label>
            <textarea
              rows={3}
              className="form-input"
              placeholder="ระบุข้อเท็จจริง สิ่งที่ตรวจพบ หรือหลักฐานจากรายงาน SAR / หน้างาน..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              ผลกระทบและคุณค่าเชิงกลยุทธ์ (Potential Impact)
            </label>
            <textarea
              rows={3}
              className="form-input"
              placeholder="ระบุประโยชน์ ผลกระทบเชิงบวก หรือความเชื่อมโยงกับ SC, SA, CC, Vision..."
              value={potentialImpact}
              onChange={(e) => setPotentialImpact(e.target.value)}
            />
          </div>

          {/* Assigned Persons Multi-select */}
          <div>
            <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="#6D28D9" />
              <span>มอบหมายผู้รายงานผล (Assigned Persons) - เลือกได้มากกว่า 1 คน</span>
            </label>
            <div
              style={{
                maxHeight: '160px',
                overflowY: 'auto',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '6px',
                background: '#F8FAFC',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '4px',
              }}
            >
              {personnelList.map((p) => {
                const pKey = p.id || p.email;
                const isSelected = selectedPersonnelIds.includes(pKey);
                return (
                  <div
                    key={pKey}
                    onClick={() => handleTogglePersonnel(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: isSelected ? '#EDE9FE' : '#FFFFFF',
                      border: isSelected ? '1px solid #7C3AED' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#6D28D9' : '#334155',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        border: isSelected ? '1px solid #7C3AED' : '1px solid #CBD5E1',
                        background: isSelected ? '#7C3AED' : '#FFFFFF',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              สถานะเริ่มต้น (Status)
            </label>
            <select
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                fontWeight: 700,
                color: TQA_STATUS_CONFIG[status]?.color || '#334155',
                background: TQA_STATUS_CONFIG[status]?.bg || '#FFFFFF',
                width: 'auto',
              }}
            >
              <option value="PENDING">🟡 รอดำเนินการ (PENDING)</option>
              <option value="IN_PROGRESS">🔵 กำลังดำเนินการ (IN_PROGRESS)</option>
              <option value="COMPLETED">🟢 เสร็จสิ้นแล้ว (COMPLETED)</option>
            </select>
          </div>

          {/* Footer Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '1rem',
              borderTop: '1px solid #F1F5F9',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSaving}>
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{
                background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)',
                borderColor: '#6D28D9',
                gap: '6px',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : ofiToEdit ? 'บันทึกการแก้ไข' : 'เพิ่มข้อเสนอแนะ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
