'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  AlertCircle,
  ExternalLink,
  Link as LinkIcon,
  Image as ImageIcon,
  Palette,
  Eye,
  Building2,
  UserCheck,
  Clock,
  Calendar,
  BookOpen,
  HeartHandshake,
  Laptop,
  FileText,
  Layers,
  Globe,
  Sparkles,
  ShieldCheck,
  Wrench,
  Database,
  Send,
  HelpCircle,
  Award,
  Bell,
  Share2,
  Briefcase,
} from 'lucide-react';
import { PORTAL_COLOR_THEMES, PORTAL_AVAILABLE_ICONS } from '@/lib/constants';

// Icon dictionary for rendering
export const PORTAL_ICON_COMPONENTS = {
  Building2,
  UserCheck,
  Clock,
  Calendar,
  BookOpen,
  HeartHandshake,
  Laptop,
  FileText,
  Layers,
  Globe,
  Sparkles,
  ShieldCheck,
  Wrench,
  Database,
  Send,
  HelpCircle,
  Award,
  Bell,
  Share2,
  Briefcase,
};

export default function ServiceCardModal({
  isOpen,
  onClose,
  onSave,
  serviceToEdit = null,
}) {
  const isEditing = Boolean(serviceToEdit);

  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    href: '',
    openInNewTab: false,
    iconType: 'lucide', // 'lucide' | 'image'
    iconName: 'Laptop',
    iconImageUrl: '',
    colorTheme: 'primary',
    badgeText: 'เปิดให้บริการ',
    badgeType: 'active', // 'active' | 'user' | 'neutral'
    footerLeft: '',
    footerRightText: 'เข้าใช้งาน',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (serviceToEdit) {
      setFormData({
        title: serviceToEdit.title || '',
        desc: serviceToEdit.desc || '',
        href: serviceToEdit.href || '',
        openInNewTab: Boolean(serviceToEdit.openInNewTab),
        iconType: serviceToEdit.iconType || (serviceToEdit.iconImageUrl ? 'image' : 'lucide'),
        iconName: serviceToEdit.iconName || 'Laptop',
        iconImageUrl: serviceToEdit.iconImageUrl || '',
        colorTheme: serviceToEdit.colorTheme || 'primary',
        badgeText: serviceToEdit.badgeText || 'เปิดให้บริการ',
        badgeType: serviceToEdit.badgeType || 'active',
        footerLeft: serviceToEdit.footerLeft || '',
        footerRightText: serviceToEdit.footerRightText || 'เข้าใช้งาน',
      });
    } else {
      setFormData({
        title: '',
        desc: '',
        href: '',
        openInNewTab: false,
        iconType: 'lucide',
        iconName: 'Laptop',
        iconImageUrl: '',
        colorTheme: 'primary',
        badgeText: 'เปิดให้บริการ',
        badgeType: 'active',
        footerLeft: '',
        footerRightText: 'เข้าใช้งาน',
      });
    }
    setErrors({});
  }, [serviceToEdit, isOpen]);

  if (!isOpen) return null;

  const currentTheme = PORTAL_COLOR_THEMES[formData.colorTheme] || PORTAL_COLOR_THEMES.primary;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'กรุณาระบุชื่อระบบหรือบริการ';
    }

    if (!formData.href.trim()) {
      newErrors.href = 'กรุณาระบุลิงก์ปลายทาง (URL หรือ Internal Path)';
    }

    if (formData.iconType === 'image' && !formData.iconImageUrl.trim()) {
      newErrors.iconImageUrl = 'กรุณาระบุ URL รูปภาพไอคอน';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ...formData,
      id: serviceToEdit?.id || `service-${Date.now()}`,
      title: formData.title.trim(),
      desc: formData.desc.trim(),
      href: formData.href.trim(),
      iconImageUrl: formData.iconImageUrl.trim(),
      footerLeft: formData.footerLeft.trim(),
      footerRightText: formData.footerRightText.trim() || 'เข้าใช้งาน',
    };

    onSave(payload);
  };

  const SelectedIcon = PORTAL_ICON_COMPONENTS[formData.iconName] || Laptop;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 'var(--radius-lg, 16px)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: currentTheme.iconBg,
                color: currentTheme.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Palette size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isEditing ? 'แก้ไขการ์ดระบบสารสนเทศและบริการ' : 'เพิ่มการ์ดระบบสารสนเทศและบริการใหม่'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                กำหนดชื่อ ลิงก์ ไอคอน และการแสดงผลบนหน้าหลัก
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            gap: '1.25rem',
          }}
        >
          {/* Card Live Preview */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Eye size={13} /> <span>ตัวอย่างการแสดงผล (Live Preview)</span>
            </div>
            <div
              className="card-glass"
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                borderTop: `5px solid ${currentTheme.borderColor}`,
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: currentTheme.iconBg,
                    color: currentTheme.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {formData.iconType === 'image' && formData.iconImageUrl ? (
                    <img
                      src={formData.iconImageUrl}
                      alt="Icon"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <SelectedIcon size={22} />
                  )}
                </div>

                <span
                  className={
                    formData.badgeType === 'user'
                      ? 'badge badge-user'
                      : formData.badgeType === 'neutral'
                      ? 'badge'
                      : 'badge badge-active'
                  }
                >
                  {formData.badgeType === 'active' && <span className="pulse-dot" />}
                  {formData.badgeText || 'เปิดให้บริการ'}
                </span>
              </div>

              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formData.title || 'ชื่อระบบหรือบริการ'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {formData.desc || 'คำอธิบายรายละเอียดระบบสารสนเทศและบริการที่จะแสดงบนการ์ด'}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  marginTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  {formData.footerLeft || 'รายละเอียดหรือข้อกำหนด'}
                </span>
                <span style={{ color: currentTheme.iconColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {formData.footerRightText || 'เข้าใช้งาน'}
                  {formData.openInNewTab ? <ExternalLink size={12} /> : <LinkIcon size={12} />}
                </span>
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="input-group">
            <label className="input-label">
              ชื่อระบบ / บริการ <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              placeholder="เช่น ระบบงานสารบรรณอิเล็กทรอนิกส์"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            {errors.title && (
              <span style={{ fontSize: '0.75rem', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} /> {errors.title}
              </span>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">คำอธิบายย่อ (Description)</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="อธิบายสรุปสั้นๆ เกี่ยวกับฟังก์ชันการทำงานของระบบนี้"
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
            />
          </div>

          {/* URL & Open In New Tab */}
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">
                ลิงก์ปลายทาง (URL หรือ Path) <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input ${errors.href ? 'input-error' : ''}`}
                placeholder="เช่น /leave หรือ https://icit.kmutnb.ac.th"
                value={formData.href}
                onChange={(e) => {
                  const val = e.target.value;
                  const isExternal = val.startsWith('http://') || val.startsWith('https://');
                  setFormData((prev) => ({
                    ...prev,
                    href: val,
                    // If user enters full external URL, default openInNewTab to true
                    openInNewTab: isExternal ? true : prev.openInNewTab,
                  }));
                }}
              />
              {errors.href && (
                <span style={{ fontSize: '0.75rem', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {errors.href}
                </span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">การเปิดหน้าต่าง (Window Target)</label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: formData.openInNewTab ? 'var(--primary-50)' : 'var(--bg-card-subtle)',
                  border: formData.openInNewTab ? '1px solid var(--primary-300)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  height: '38px',
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.openInNewTab}
                  onChange={(e) => setFormData({ ...formData, openInNewTab: e.target.checked })}
                  style={{ accentColor: 'var(--primary-600)', cursor: 'pointer' }}
                />
                <span style={{ color: formData.openInNewTab ? 'var(--primary-700)' : 'var(--text-primary)' }}>
                  เปิดในแท็บใหม่ (Open in New Tab)
                </span>
                <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </label>
            </div>
          </div>

          {/* Icon Choice: Lucide Icon vs Custom Image URL */}
          <div className="input-group">
            <label className="input-label">ไอคอนของการ์ด (Icon Style)</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: formData.iconType === 'lucide' ? 'var(--primary-50)' : 'var(--bg-card-subtle)',
                  border: formData.iconType === 'lucide' ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                }}
              >
                <input
                  type="radio"
                  name="iconType"
                  value="lucide"
                  checked={formData.iconType === 'lucide'}
                  onChange={() => setFormData({ ...formData, iconType: 'lucide' })}
                  style={{ accentColor: 'var(--primary-600)' }}
                />
                <span>เลือกไอคอนระบบ (Lucide Icons)</span>
              </label>

              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: formData.iconType === 'image' ? 'var(--primary-50)' : 'var(--bg-card-subtle)',
                  border: formData.iconType === 'image' ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                }}
              >
                <input
                  type="radio"
                  name="iconType"
                  value="image"
                  checked={formData.iconType === 'image'}
                  onChange={() => setFormData({ ...formData, iconType: 'image' })}
                  style={{ accentColor: 'var(--primary-600)' }}
                />
                <ImageIcon size={14} />
                <span>ใช้รูปภาพ URL ภายนอก (Image URL)</span>
              </label>
            </div>

            {formData.iconType === 'lucide' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '0.4rem',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {PORTAL_AVAILABLE_ICONS.map((item) => {
                  const IconComp = PORTAL_ICON_COMPONENTS[item.name] || Laptop;
                  const isSelected = formData.iconName === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, iconName: item.name })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.35rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? '#FFFFFF' : 'transparent',
                        border: isSelected ? '1.5px solid var(--primary-500)' : '1px solid transparent',
                        color: isSelected ? 'var(--primary-700)' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                      }}
                    >
                      <IconComp size={16} color={isSelected ? currentTheme.iconColor : undefined} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <input
                  type="url"
                  className={`form-input ${errors.iconImageUrl ? 'input-error' : ''}`}
                  placeholder="เช่น https://example.com/logo-app.png หรือ /icit-logo.png"
                  value={formData.iconImageUrl}
                  onChange={(e) => setFormData({ ...formData, iconImageUrl: e.target.value })}
                />
                {errors.iconImageUrl && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--rose-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> {errors.iconImageUrl}
                  </span>
                )}
                <span className="input-hint">รองรับลิงก์ไฟล์ .png, .svg, .jpg หรือรูปโลโก้ประจำระบบ</span>
              </div>
            )}
          </div>

          {/* Color Theme Selector */}
          <div className="input-group">
            <label className="input-label">ธีมสีประจำการ์ด (Card Color Theme)</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '0.4rem',
              }}
            >
              {Object.entries(PORTAL_COLOR_THEMES).map(([themeKey, themeConfig]) => {
                const isSelected = formData.colorTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setFormData({ ...formData, colorTheme: themeKey })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? themeConfig.iconBg : 'var(--bg-card-subtle)',
                      border: isSelected ? `2px solid ${themeConfig.borderColor}` : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? themeConfig.iconColor : 'var(--text-secondary)',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: themeConfig.borderColor,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {themeConfig.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badges & Footer Text */}
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">ข้อความป้ายกำกับ (Badge Text)</label>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น เปิดให้บริการ, ข้อมูลส่วนบุคคล"
                value={formData.badgeText}
                onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">รูปแบบป้ายกำกับ (Badge Style)</label>
              <select
                className="form-select"
                value={formData.badgeType}
                onChange={(e) => setFormData({ ...formData, badgeType: e.target.value })}
              >
                <option value="active">🟢 สีเขียว + จุดกระพริบ (เปิดให้บริการ)</option>
                <option value="user">🟣 สีม่วง (ข้อมูลส่วนบุคคล / เฉพาะสมาชิก)</option>
                <option value="neutral">⚪ สีเทาสุภาพ (ทั่วไป)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">ข้อความมุมล่างซ้าย (Footer Left)</label>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น 6 ฝ่าย • บุคลากรในสังกัด หรือ แหล่งข้อมูลภายนอก"
                value={formData.footerLeft}
                onChange={(e) => setFormData({ ...formData, footerLeft: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">ข้อความปุ่มขวา (Footer Right Text)</label>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น เข้าใช้งาน หรือ เปิดใช้งาน"
                value={formData.footerRightText}
                onChange={(e) => setFormData({ ...formData, footerRightText: e.target.value })}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem' }}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Check size={16} />
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มการ์ดบริการ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
