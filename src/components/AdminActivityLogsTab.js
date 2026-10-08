'use client';

import React, { useState, useMemo } from 'react';
import {
  Activity,
  Mail,
  User,
  Clock,
  Calendar,
  Building2,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ExternalLink,
  Download,
  Trash2,
  RefreshCw,
  X,
  Info,
  ChevronRight,
  Eye,
  FileText,
  Target,
  Layers,
  Award,
  BookOpen,
  FileSpreadsheet,
  Globe,
  Sliders,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import {
  ACTIVITY_CATEGORIES,
  CATEGORY_DEFINITIONS,
  clearAllActivityLogs,
} from '@/lib/activityLogService';
import { useModal } from '@/context/ModalContext';

export default function AdminActivityLogsTab({ logs = [], currentAdmin = null }) {
  const { showAlert, showConfirm } = useModal();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Grouped Category Options for Filter
  const CATEGORY_GROUPS = [
    {
      groupLabel: 'การเข้าใช้งาน & หน้าเว็บ',
      items: [ACTIVITY_CATEGORIES.AUTH, ACTIVITY_CATEGORIES.PAGE_VIEW],
    },
    {
      groupLabel: 'บุคลากร & โครงสร้าง',
      items: [
        ACTIVITY_CATEGORIES.PERSONNEL,
        ACTIVITY_CATEGORIES.DEPARTMENT,
        ACTIVITY_CATEGORIES.EXECUTIVE,
      ],
    },
    {
      groupLabel: 'เวลา & วันลา',
      items: [ACTIVITY_CATEGORIES.ATTENDANCE, ACTIVITY_CATEGORIES.LEAVE],
    },
    {
      groupLabel: 'การพัฒนาบุคลากร (HRD)',
      items: [
        ACTIVITY_CATEGORIES.JD_HUB,
        ACTIVITY_CATEGORIES.IDP,
        ACTIVITY_CATEGORIES.IDP_ACTION_PLAN,
        ACTIVITY_CATEGORIES.SKILL_MAP,
      ],
    },
    {
      groupLabel: 'คุณภาพ & ความรู้',
      items: [
        ACTIVITY_CATEGORIES.KM_HUB,
        ACTIVITY_CATEGORIES.IMS_AUDIT,
        ACTIVITY_CATEGORIES.IMS_CAR,
        ACTIVITY_CATEGORIES.IMS_OFI,
        ACTIVITY_CATEGORIES.TQA_OFI,
      ],
    },
    {
      groupLabel: 'ระบบ & การสื่อสาร',
      items: [ACTIVITY_CATEGORIES.EMAIL, ACTIVITY_CATEGORIES.PORTAL, ACTIVITY_CATEGORIES.SYSTEM],
    },
  ];

  // Helper: Date filter check
  const isWithinDateRange = (isoString, range) => {
    if (!isoString || range === 'ALL') return true;
    const itemDate = new Date(isoString).getTime();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (range === 'TODAY') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return itemDate >= todayStart.getTime();
    }
    if (range === '7D') return now - itemDate <= 7 * oneDay;
    if (range === '30D') return now - itemDate <= 30 * oneDay;
    return true;
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      // Date Range filter
      if (!isWithinDateRange(item.loggedAt || item.timestamp, selectedDateRange)) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchDetails = item.details?.toLowerCase().includes(q);
        const matchAction = item.action?.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        const matchActor =
          item.actorName?.toLowerCase().includes(q) ||
          item.actorEmail?.toLowerCase().includes(q) ||
          item.actor?.name?.toLowerCase().includes(q) ||
          item.actor?.email?.toLowerCase().includes(q);
        const matchTarget =
          item.targetName?.toLowerCase().includes(q) ||
          item.targetId?.toLowerCase().includes(q) ||
          item.target?.name?.toLowerCase().includes(q);
        const matchMeta = JSON.stringify(item.metadata || {}).toLowerCase().includes(q);

        return (
          matchTitle ||
          matchDetails ||
          matchAction ||
          matchCategory ||
          matchActor ||
          matchTarget ||
          matchMeta
        );
      }
      return true;
    });
  }, [logs, selectedCategory, selectedDateRange, searchTerm]);

  // Extended Domain Statistics Calculation
  const stats = useMemo(() => {
    const total = logs.length;
    const authAndVisits = logs.filter(
      (l) => l.category === ACTIVITY_CATEGORIES.AUTH || l.category === ACTIVITY_CATEGORIES.PAGE_VIEW
    ).length;
    const personnel = logs.filter(
      (l) =>
        l.category === ACTIVITY_CATEGORIES.PERSONNEL ||
        l.category === ACTIVITY_CATEGORIES.DEPARTMENT ||
        l.category === ACTIVITY_CATEGORIES.EXECUTIVE
    ).length;
    const attendanceAndLeave = logs.filter(
      (l) => l.category === ACTIVITY_CATEGORIES.ATTENDANCE || l.category === ACTIVITY_CATEGORIES.LEAVE
    ).length;
    const developmentHubs = logs.filter(
      (l) =>
        l.category === ACTIVITY_CATEGORIES.JD_HUB ||
        l.category === ACTIVITY_CATEGORIES.IDP ||
        l.category === ACTIVITY_CATEGORIES.IDP_ACTION_PLAN ||
        l.category === ACTIVITY_CATEGORIES.SKILL_MAP
    ).length;
    const qualityAndKm = logs.filter(
      (l) =>
        l.category === ACTIVITY_CATEGORIES.KM_HUB ||
        l.category === ACTIVITY_CATEGORIES.IMS_AUDIT ||
        l.category === ACTIVITY_CATEGORIES.IMS_CAR ||
        l.category === ACTIVITY_CATEGORIES.IMS_OFI ||
        l.category === ACTIVITY_CATEGORIES.TQA_OFI
    ).length;
    const emails = logs.filter((l) => l.category === ACTIVITY_CATEGORIES.EMAIL).length;

    return {
      total,
      authAndVisits,
      personnel,
      attendanceAndLeave,
      developmentHubs,
      qualityAndKm,
      emails,
    };
  }, [logs]);

  // Helper to format Thai date time
  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return (
        d.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' น.'
      );
    } catch (e) {
      return isoString;
    }
  };

  // Helper to get Category Icon and Definition
  const getCategoryMeta = (category) => {
    const def = CATEGORY_DEFINITIONS[category];
    let icon = <Activity size={14} />;

    switch (category) {
      case ACTIVITY_CATEGORIES.AUTH:
        icon = <Shield size={14} />;
        break;
      case ACTIVITY_CATEGORIES.PAGE_VIEW:
        icon = <Globe size={14} />;
        break;
      case ACTIVITY_CATEGORIES.PERSONNEL:
        icon = <User size={14} />;
        break;
      case ACTIVITY_CATEGORIES.DEPARTMENT:
        icon = <Building2 size={14} />;
        break;
      case ACTIVITY_CATEGORIES.EXECUTIVE:
        icon = <Award size={14} />;
        break;
      case ACTIVITY_CATEGORIES.ATTENDANCE:
        icon = <Clock size={14} />;
        break;
      case ACTIVITY_CATEGORIES.LEAVE:
        icon = <Calendar size={14} />;
        break;
      case ACTIVITY_CATEGORIES.JD_HUB:
        icon = <FileText size={14} />;
        break;
      case ACTIVITY_CATEGORIES.IDP:
      case ACTIVITY_CATEGORIES.IDP_ACTION_PLAN:
        icon = <Target size={14} />;
        break;
      case ACTIVITY_CATEGORIES.SKILL_MAP:
        icon = <Layers size={14} />;
        break;
      case ACTIVITY_CATEGORIES.KM_HUB:
        icon = <BookOpen size={14} />;
        break;
      case ACTIVITY_CATEGORIES.EMAIL:
        icon = <Mail size={14} />;
        break;
      case ACTIVITY_CATEGORIES.PORTAL:
        icon = <Sliders size={14} />;
        break;
      default:
        icon = <Activity size={14} />;
    }

    if (def) {
      return {
        ...def,
        icon,
      };
    }

    return {
      label: category || 'ระบบ',
      shortLabel: category || 'ระบบ',
      color: '#475569',
      bgColor: '#F1F5F9',
      borderColor: '#CBD5E1',
      icon,
    };
  };

  // Export logs to JSON
  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `icit_activity_logs_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export logs to CSV
  const handleExportCsv = () => {
    if (!filteredLogs.length) return;

    const headers = [
      'ID',
      'วัน-เวลา (ISO)',
      'หมวดหมู่ (Category)',
      'รหัสกิจกรรม (Action)',
      'หัวข้อกิจกรรม (Title)',
      'รายละเอียด (Details)',
      'ผู้ดำเนินการ (Actor Name)',
      'อีเมลผู้ดำเนินการ (Actor Email)',
      'สถานะ (Status)',
      'เป้าหมาย (Target)',
    ];

    const rows = filteredLogs.map((l) => [
      `"${l.id || ''}"`,
      `"${l.loggedAt || l.timestamp || ''}"`,
      `"${l.category || ''}"`,
      `"${l.action || ''}"`,
      `"${(l.title || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${(l.actorName || l.actor?.name || '').replace(/"/g, '""')}"`,
      `"${(l.actorEmail || l.actor?.email || '').replace(/"/g, '""')}"`,
      `"${l.status || ''}"`,
      `"${(l.targetName || l.target?.name || l.targetId || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `icit_activity_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearLogs = async () => {
    const confirmed = await showConfirm({
      type: 'danger',
      title: 'ล้างประวัติกิจกรรมทั้งหมด',
      message:
        'คุณต้องการล้างประวัติกิจกรรมทั้งหมดในระบบใช่หรือไม่? ข้อมูลบันทึก Audit Trail ทั้งหมดจะถูกลบถาวร (ไม่สามารถย้อนกลับได้)',
      confirmText: 'ล้างประวัติถาวร',
    });
    if (confirmed) {
      await clearAllActivityLogs();
      await showAlert({
        type: 'success',
        title: 'สำเร็จ',
        message: 'ล้างประวัติกิจกรรมเรียบร้อยแล้ว',
      });
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Extended KPI Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {/* Total Activities */}
        <div
          className="card-glass"
          style={{
            padding: '0.85rem 1rem',
            borderLeft: '4px solid var(--primary-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              กิจกรรมทั้งหมด
            </div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: '2px',
              }}
            >
              {stats.total}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={18} />
          </div>
        </div>

        {/* Auth & Page Visits */}
        <div
          className="card-glass"
          style={{
            padding: '0.85rem 1rem',
            borderLeft: '4px solid #0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              เข้าสู่ระบบ & เข้าชม
            </div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#0284C7',
                marginTop: '2px',
              }}
            >
              {stats.authAndVisits}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#F0F9FF',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={18} />
          </div>
        </div>

        {/* Personnel & Org */}
        <div
          className="card-glass"
          style={{
            padding: '0.85rem 1rem',
            borderLeft: '4px solid #059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              บุคลากร & ฝ่ายงาน
            </div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#059669',
                marginTop: '2px',
              }}
            >
              {stats.personnel}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={18} />
          </div>
        </div>

        {/* Attendance & Leave */}
        <div
          className="card-glass"
          style={{
            padding: '0.85rem 1rem',
            borderLeft: '4px solid #7C3AED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              ขอลงเวลา & วันลา
            </div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#7C3AED',
                marginTop: '2px',
              }}
            >
              {stats.attendanceAndLeave}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#F5F3FF',
              color: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={18} />
          </div>
        </div>

        {/* HRD / Competency Hubs */}
        <div
          className="card-glass"
          style={{
            padding: '0.85rem 1rem',
            borderLeft: '4px solid #4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              JD, IDP & Skill Map
            </div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#4F46E5',
                marginTop: '2px',
              }}
            >
              {stats.developmentHubs}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#EEF2FF',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Target size={18} />
          </div>
        </div>

        {/* Quality & KM */}
        <div
          className="card-glass"
          style={{
            padding: '0.85rem 1rem',
            borderLeft: '4px solid #D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              KM Hub & IMS / TQA
            </div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#D97706',
                marginTop: '2px',
              }}
            >
              {stats.qualityAndKm}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={18} />
          </div>
        </div>

        {/* Email Dispatches */}
        <div
          className="card-glass"
          style={{
            padding: '0.85rem 1rem',
            borderLeft: '4px solid #2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              อีเมลแจ้งเตือน
            </div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#2563EB',
                marginTop: '2px',
              }}
            >
              {stats.emails}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mail size={18} />
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div
        className="card-glass"
        style={{
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="ค้นหาชื่อผู้กระทำ, หัวข้อ, รหัสกิจกรรม, ข้อมูลเป้าหมาย, อีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
            />
          </div>

          {/* Filters & Actions Controls */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Date Range Dropdown */}
            <select
              className="form-select"
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              style={{ width: 'auto', fontSize: '0.825rem', padding: '0.35rem 0.65rem' }}
            >
              <option value="ALL">ทุกช่วงเวลา</option>
              <option value="TODAY">วันนี้ (Today)</option>
              <option value="7D">7 วันล่าสุด</option>
              <option value="30D">30 วันล่าสุด</option>
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="btn btn-secondary btn-sm"
              title="ส่งออกบันทึก Audit Trail เป็นไฟล์ CSV"
              style={{ fontSize: '0.8rem', gap: '4px' }}
            >
              <FileSpreadsheet size={14} />
              <span>ส่งออก CSV</span>
            </button>

            {/* Export JSON Button */}
            <button
              onClick={handleExportJson}
              className="btn btn-secondary btn-sm"
              title="ส่งออกบันทึกประวัติเป็น JSON"
              style={{ fontSize: '0.8rem', gap: '4px' }}
            >
              <Download size={14} />
              <span>JSON</span>
            </button>

            {/* Clear All Logs Button */}
            <button
              onClick={handleClearLogs}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--rose-500)', fontSize: '0.8rem' }}
              title="ล้างบันทึกประวัติทั้งหมด"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* 3. Category Filter Chips (Categorized & Visualized) */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
          >
            ทั้งหมด ({logs.length})
          </button>

          {Object.keys(CATEGORY_DEFINITIONS).map((catKey) => {
            const meta = getCategoryMeta(catKey);
            const count = logs.filter((l) => l.category === catKey).length;
            const isSelected = selectedCategory === catKey;

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(isSelected ? 'ALL' : catKey)}
                className="btn btn-sm"
                style={{
                  fontSize: '0.725rem',
                  padding: '0.2rem 0.55rem',
                  background: isSelected ? meta.color : meta.bgColor,
                  color: isSelected ? '#FFFFFF' : meta.color,
                  border: `1px solid ${meta.borderColor}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                {meta.icon}
                <span>{meta.shortLabel}</span>
                {count > 0 && (
                  <span
                    style={{
                      background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Activity Logs Table */}
      <div className="card-glass" style={{ overflowX: 'auto', padding: 0 }}>
        {filteredLogs.length > 0 ? (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg-card-subtle, #F8FAFC)',
                  borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
                  color: 'var(--text-secondary, #64748B)',
                  fontWeight: 600,
                }}
              >
                <th style={{ padding: '0.85rem 1rem', width: '130px' }}>หมวดหมู่</th>
                <th style={{ padding: '0.85rem 1rem' }}>กิจกรรม / รายละเอียด</th>
                <th style={{ padding: '0.85rem 1rem', width: '210px' }}>ข้อมูลเป้าหมาย / วัตถุ</th>
                <th style={{ padding: '0.85rem 1rem', width: '175px' }}>ผู้ดำเนินการ</th>
                <th style={{ padding: '0.85rem 1rem', width: '150px' }}>วัน-เวลา</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', width: '70px' }}>ดูข้อมูล</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((item) => {
                const meta = getCategoryMeta(item.category);
                const actorName = item.actorName || item.actor?.name || 'ระบบ';
                const actorEmail = item.actorEmail || item.actor?.email || '';
                const targetDisplay =
                  item.targetName ||
                  item.target?.name ||
                  item.targetId ||
                  item.metadata?.path ||
                  item.metadata?.title ||
                  '';
                const targetType =
                  item.target?.type ||
                  (item.category === ACTIVITY_CATEGORIES.PAGE_VIEW ? 'PAGE' : null);

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--bg-card-subtle, #F8FAFC)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* 1. Category */}
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: meta.bgColor,
                          color: meta.color,
                          border: `1px solid ${meta.borderColor}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {meta.icon}
                        <span>{meta.shortLabel}</span>
                      </span>
                    </td>

                    {/* 2. Action & Title & Details */}
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {item.action && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: '#F1F5F9',
                              color: '#475569',
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            {item.action}
                          </span>
                        )}
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {item.title}
                        </strong>
                      </div>

                      {item.details && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: '3px',
                            lineHeight: 1.4,
                          }}
                        >
                          {item.details}
                        </div>
                      )}

                      {item.metadata?.error && (
                        <div
                          style={{
                            fontSize: '0.725rem',
                            color: 'var(--rose-600)',
                            marginTop: '2px',
                            fontWeight: 500,
                          }}
                        >
                          ⚠️ ข้อผิดพลาด: {item.metadata.error}
                        </div>
                      )}
                    </td>

                    {/* 3. Target Entity / Resource (New Column) */}
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                      {targetDisplay ? (
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span style={{ color: 'var(--primary-600)' }}>🎯</span>
                            <span style={{ wordBreak: 'break-word' }}>{targetDisplay}</span>
                          </div>
                          {(targetType || item.metadata?.fiscalYear || item.metadata?.department) && (
                            <div
                              style={{
                                fontSize: '0.675rem',
                                color: 'var(--text-muted)',
                                marginTop: '2px',
                                display: 'flex',
                                gap: '4px',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                              }}
                            >
                              {targetType && (
                                <span
                                  style={{
                                    background: '#F1F5F9',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    fontFamily: 'monospace',
                                    color: '#475569',
                                  }}
                                >
                                  {targetType}
                                </span>
                              )}
                              {item.metadata?.fiscalYear && (
                                <span>ปีงบฯ {item.metadata.fiscalYear}</span>
                              )}
                              {item.metadata?.department && (
                                <span>• ฝ่าย{item.metadata.department}</span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* 4. Actor */}
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                        }}
                      >
                        {actorName}
                      </div>
                      {actorEmail && (
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            wordBreak: 'break-all',
                          }}
                        >
                          {actorEmail}
                        </div>
                      )}
                      {item.actor?.role && (
                        <span
                          style={{
                            fontSize: '0.625rem',
                            color: '#64748B',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}
                        >
                          [{item.actor.role}]
                        </span>
                      )}
                    </td>

                    {/* 5. Date & Time */}
                    <td
                      style={{
                        padding: '0.75rem 1rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        verticalAlign: 'top',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatDateTime(item.loggedAt || item.timestamp)}
                    </td>

                    {/* 6. Inspect Action */}
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', verticalAlign: 'top' }}>
                      <button
                        onClick={() => setSelectedLogForDetail(item)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="ดูรายละเอียดข้อมูลบันทึกนี้"
                        style={{ color: 'var(--primary-600)' }}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div
            style={{
              padding: '3.5rem 1rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <Activity size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              ยังไม่มีบันทึกประวัติกิจกรรมที่ตรงกับเงื่อนไขการค้นหา
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              กิจกรรมของผู้ใช้ การแก้ไขข้อมูล การเข้าชมหน้าเว็บ และการส่งอีเมล จะถูกบันทึกที่นี่แบบ Real-time
            </div>
          </div>
        )}
      </div>

      {/* 5. Comprehensive Log Detail Modal */}
      {selectedLogForDetail && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px', width: '95%' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: getCategoryMeta(selectedLogForDetail.category).bgColor,
                    color: getCategoryMeta(selectedLogForDetail.category).color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getCategoryMeta(selectedLogForDetail.category).icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                    รายละเอียดบันทึกกิจกรรม (Audit Log Details)
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.725rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>ID: {selectedLogForDetail.id}</span>
                    <button
                      onClick={() => handleCopyId(selectedLogForDetail.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedId ? '#10B981' : 'var(--text-muted)',
                        padding: 0,
                      }}
                      title="คัดลอก ID"
                    >
                      {copiedId ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="btn btn-ghost btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="modal-body"
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            >
              {/* Activity Banner */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: '#E2E8F0',
                      color: '#334155',
                    }}
                  >
                    {selectedLogForDetail.action || 'ACTIVITY'}
                  </span>
                  <span
                    className={`badge ${
                      selectedLogForDetail.status === 'SUCCESS' ? 'badge-active' : 'badge-resigned'
                    }`}
                    style={{ fontSize: '0.65rem' }}
                  >
                    {selectedLogForDetail.status || 'SUCCESS'}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginTop: '2px',
                  }}
                >
                  {selectedLogForDetail.title}
                </div>
                {selectedLogForDetail.details && (
                  <div
                    style={{
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                      marginTop: '4px',
                      lineHeight: 1.45,
                    }}
                  >
                    {selectedLogForDetail.details}
                  </div>
                )}
              </div>

              {/* Grid Metadata */}
              <div
                className="grid-2"
                style={{
                  gap: '0.75rem',
                  fontSize: '0.825rem',
                  background: '#FFFFFF',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>หมวดหมู่: </span>
                  <strong>
                    {getCategoryMeta(selectedLogForDetail.category).label} ({selectedLogForDetail.category})
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>เวลาบันทึก: </span>
                  <span>{formatDateTime(selectedLogForDetail.loggedAt || selectedLogForDetail.timestamp)}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>ผู้ดำเนินการ: </span>
                  <strong>
                    {selectedLogForDetail.actorName || selectedLogForDetail.actor?.name || 'ระบบ'}
                  </strong>
                  {(selectedLogForDetail.actorEmail || selectedLogForDetail.actor?.email) && (
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>
                      {selectedLogForDetail.actorEmail || selectedLogForDetail.actor?.email}
                    </span>
                  )}
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>เป้าหมาย (Target): </span>
                  <strong>
                    {selectedLogForDetail.targetName ||
                      selectedLogForDetail.target?.name ||
                      selectedLogForDetail.targetId ||
                      '-'}
                  </strong>
                  {selectedLogForDetail.target?.type && (
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>
                      ประเภท: {selectedLogForDetail.target.type}
                    </span>
                  )}
                </div>
              </div>

              {/* Raw Payload / Metadata Viewer */}
              {selectedLogForDetail.metadata && Object.keys(selectedLogForDetail.metadata).length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                    }}
                  >
                    ข้อมูลบันทึกเชิงลึก (Payload & Metadata):
                  </div>
                  <pre
                    style={{
                      background: '#0F172A',
                      color: '#38BDF8',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      maxHeight: '220px',
                      overflow: 'auto',
                      fontFamily: 'Consolas, monospace',
                      border: '1px solid #334155',
                    }}
                  >
                    {JSON.stringify(selectedLogForDetail.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="btn btn-secondary btn-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
