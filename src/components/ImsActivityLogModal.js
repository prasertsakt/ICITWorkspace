'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  ShieldCheck,
  FileCheck,
  Edit,
  Trash2,
  User,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import { subscribeActivityLogs, ACTIVITY_CATEGORIES } from '@/lib/activityLogService';

export default function ImsActivityLogModal({
  isOpen,
  onClose,
  currentYear = '2569',
}) {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeActivityLogs((allLogs) => {
      // Filter for IMS Audit relevant logs
      const imsLogs = (allLogs || []).filter((item) => {
        if (!item) return false;
        if (item.category === 'IMS_AUDIT') return true;
        if (item.category === ACTIVITY_CATEGORIES.EMAIL) {
          const sub = (item.metadata?.subject || '').toLowerCase();
          const rec = (item.metadata?.recipientRole || '').toLowerCase();
          const det = (item.details || '').toLowerCase();
          const target = (item.targetId || '').toLowerCase();
          return (
            sub.includes('ims') ||
            det.includes('ims') ||
            target.includes('ims') ||
            rec.includes('lead') ||
            rec.includes('auditor')
          );
        }
        if ((item.title || '').includes('IMS') || (item.details || '').includes('IMS')) {
          return true;
        }
        return false;
      });
      setLogs(imsLogs);
    });

    return () => unsub();
  }, [isOpen]);

  // Format Thai DateTime
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
        }) + ' น.'
      );
    } catch (e) {
      return isoString;
    }
  };

  // Helper action metadata
  const getActionMeta = (log) => {
    const action = log.action || '';
    if (log.category === ACTIVITY_CATEGORIES.EMAIL || log.isEmailLog) {
      return {
        label: 'แจ้งเตือนอีเมล (Email)',
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        icon: <Mail size={15} color="#2563EB" />,
      };
    }

    switch (action) {
      case 'CREATE_AUDIT':
        return {
          label: 'สร้างรายงานตรวจ',
          color: '#0D9488',
          bg: '#F0FDFA',
          border: '#99F6E4',
          icon: <FileCheck size={15} color="#0D9488" />,
        };
      case 'UPDATE_AUDIT':
        return {
          label: 'แก้ไขรายงานตรวจ',
          color: '#0284C7',
          bg: '#F0F9FF',
          border: '#BAE6FD',
          icon: <Edit size={15} color="#0284C7" />,
        };
      case 'DELETE_AUDIT':
        return {
          label: 'ลบรายงานตรวจ',
          color: '#DC2626',
          bg: '#FEF2F2',
          border: '#FECACA',
          icon: <Trash2 size={15} color="#DC2626" />,
        };
      case 'APPROVE_AUDIT_PLAN':
        return {
          label: 'อนุมัติแผนตรวจ (Lead IA)',
          color: '#16A34A',
          bg: '#F0FDF4',
          border: '#BBF7D0',
          icon: <CheckCircle2 size={15} color="#16A34A" />,
        };
      case 'RETURN_AUDIT_PLAN':
        return {
          label: 'ส่งกลับแก้ไข (Lead IA)',
          color: '#D97706',
          bg: '#FFFBEB',
          border: '#FDE68A',
          icon: <AlertCircle size={15} color="#D97706" />,
        };
      case 'COMPLETE_EVALUATION':
        return {
          label: 'บันทึกผลการตรวจ (C/NC/OFI)',
          color: '#6366F1',
          bg: '#EEF2FF',
          border: '#C7D2FE',
          icon: <ShieldCheck size={15} color="#6366F1" />,
        };
      case 'CONFIG_AUDITORS':
        return {
          label: 'กำหนดรายชื่อผู้ตรวจ & DCC',
          color: '#9333EA',
          bg: '#FAF5FF',
          border: '#E9D5FF',
          icon: <Users size={15} color="#9333EA" />,
        };
      default:
        return {
          label: action || 'กิจกรรม IMS',
          color: '#475569',
          bg: '#F1F5F9',
          border: '#CBD5E1',
          icon: <History size={15} color="#475569" />,
        };
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Action filter
      if (selectedAction !== 'ALL') {
        if (selectedAction === 'EMAIL') {
          if (log.category !== ACTIVITY_CATEGORIES.EMAIL && !log.isEmailLog) return false;
        } else if (log.action !== selectedAction) {
          return false;
        }
      }

      // Year filter
      if (selectedYear !== 'ALL') {
        const logYear =
          log.metadata?.year ||
          log.metadata?.auditYear ||
          (log.details && log.details.includes(selectedYear) ? selectedYear : '');
        if (logYear && logYear !== selectedYear) return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchTitle = log.title?.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        const matchActor =
          log.actorName?.toLowerCase().includes(q) || log.actorEmail?.toLowerCase().includes(q);
        const matchTopic = log.metadata?.topic?.toLowerCase().includes(q);
        const matchComment = log.metadata?.comment?.toLowerCase().includes(q);
        const matchSubject = log.metadata?.subject?.toLowerCase().includes(q);
        return matchTitle || matchDetails || matchActor || matchTopic || matchComment || matchSubject;
      }

      return true;
    });
  }, [logs, selectedAction, selectedYear, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const approvals = logs.filter((l) => l.action === 'APPROVE_AUDIT_PLAN').length;
    const returns = logs.filter((l) => l.action === 'RETURN_AUDIT_PLAN').length;
    const evaluations = logs.filter((l) => l.action === 'COMPLETE_EVALUATION').length;
    const emails = logs.filter(
      (l) => l.category === ACTIVITY_CATEGORIES.EMAIL || l.isEmailLog
    ).length;
    return { total, approvals, returns, evaluations, emails };
  }, [logs]);

  if (!isOpen) return null;

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
          maxWidth: '900px',
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
            background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <History size={22} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                ประวัติกิจกรรมการตรวจติดตามภายใน (IMS Activity Log)
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#CCFBF1', margin: '2px 0 0 0' }}>
                บันทึกประวัติการสร้าง แก้ไข ลบ การอนุมัติ/ส่งกลับของ Lead IA และการแจ้งเตือนอีเมล
              </p>
            </div>
          </div>
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

        {/* Stats Summary Bar */}
        <div
          style={{
            padding: '0.85rem 1.75rem',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.825rem',
          }}
        >
          <div style={{ color: '#64748B', fontWeight: 600 }}>ภาพรวมกิจกรรม:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0F172A' }}>
            <strong>{stats.total}</strong> รายการทั้งหมด
          </div>
          <div style={{ color: '#CBD5E1' }}>&bull;</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#16A34A' }}>
            <CheckCircle2 size={15} />
            <strong>{stats.approvals}</strong> อนุมัติแผน
          </div>
          <div style={{ color: '#CBD5E1' }}>&bull;</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#D97706' }}>
            <AlertCircle size={15} />
            <strong>{stats.returns}</strong> ส่งกลับแก้ไข
          </div>
          <div style={{ color: '#CBD5E1' }}>&bull;</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6366F1' }}>
            <ShieldCheck size={15} />
            <strong>{stats.evaluations}</strong> สรุปผลการตรวจ
          </div>
          <div style={{ color: '#CBD5E1' }}>&bull;</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2563EB' }}>
            <Mail size={15} />
            <strong>{stats.emails}</strong> แจ้งเตือนอีเมล
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderBottom: '1px solid #E2E8F0',
            background: '#FFFFFF',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
            <Search
              size={17}
              color="#94A3B8"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="ค้นหาตามหัวข้อ, ชื่อผู้ดำเนินการ, ข้อคิดเห็น..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Action Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                background: '#FFFFFF',
                color: '#334155',
                fontWeight: 600,
              }}
            >
              <option value="ALL">ทุกประเภทกิจกรรม</option>
              <option value="CREATE_AUDIT">สร้างรายงานตรวจ</option>
              <option value="UPDATE_AUDIT">แก้ไขรายงานตรวจ</option>
              <option value="DELETE_AUDIT">ลบรายงานตรวจ</option>
              <option value="APPROVE_AUDIT_PLAN">อนุมัติแผนตรวจ (Lead IA)</option>
              <option value="RETURN_AUDIT_PLAN">ส่งกลับแก้ไข (Lead IA)</option>
              <option value="COMPLETE_EVALUATION">บันทึกผลการตรวจ</option>
              <option value="CONFIG_AUDITORS">กำหนดรายชื่อผู้ตรวจ & DCC</option>
              <option value="EMAIL">แจ้งเตือนอีเมล</option>
            </select>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                background: '#FFFFFF',
                color: '#334155',
                fontWeight: 600,
              }}
            >
              <option value="ALL">ทุกปีงบประมาณ</option>
              <option value="2569">ปีงบประมาณ 2569</option>
              <option value="2570">ปีงบประมาณ 2570</option>
              <option value="2568">ปีงบประมาณ 2568</option>
            </select>
          </div>
        </div>

        {/* Timeline Log List */}
        <div style={{ overflowY: 'auto', padding: '1.25rem 1.75rem', flex: 1 }}>
          {filteredLogs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#94A3B8',
              }}
            >
              <History size={44} style={{ opacity: 0.4, margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#475569' }}>
                ไม่พบประวัติกิจกรรมตามเงื่อนไขที่ค้นหา
              </div>
              <p style={{ fontSize: '0.825rem', margin: '4px 0 0 0' }}>
                กิจกรรมทั้งหมดเกี่ยวกับการตรวจติดตาม IMS จะถูกบันทึกและแสดงที่นี่แบบเรียลไทม์
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredLogs.map((log) => {
                const meta = getActionMeta(log);
                const isExpanded = expandedLogId === log.id;

                return (
                  <div
                    key={log.id}
                    style={{
                      border: `1px solid ${isExpanded ? meta.border : '#E2E8F0'}`,
                      borderRadius: '10px',
                      background: isExpanded ? '#FAFDFB' : '#FFFFFF',
                      transition: 'all 0.15s ease',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    {/* Log Row Main */}
                    <div
                      style={{
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <div style={{ display: 'flex', gap: '0.85rem', flex: 1, minWidth: '260px' }}>
                        {/* Action Icon Box */}
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: meta.bg,
                            border: `1px solid ${meta.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          {meta.icon}
                        </div>

                        {/* Title & Details */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: meta.bg,
                                color: meta.color,
                                border: `1px solid ${meta.border}`,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              {meta.label}
                            </span>
                            <span style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0F172A' }}>
                              {log.title || log.details}
                            </span>
                          </div>

                          {log.details && (
                            <p
                              style={{
                                margin: '6px 0 0 0',
                                fontSize: '0.85rem',
                                color: '#475569',
                                lineHeight: 1.5,
                                whiteSpace: 'pre-line',
                              }}
                            >
                              {log.details}
                            </p>
                          )}

                          {/* Actor and Timestamp */}
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: '12px',
                              marginTop: '8px',
                              fontSize: '0.78rem',
                              color: '#64748B',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={13} color="#94A3B8" />
                              <strong style={{ color: '#334155' }}>
                                {log.actorName || log.metadata?.senderName || 'ผู้ใช้งาน'}
                              </strong>
                              {log.actorEmail ? ` (${log.actorEmail})` : ''}
                            </span>
                            <span style={{ color: '#CBD5E1' }}>&bull;</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} color="#94A3B8" />
                              <span>{formatDateTime(log.loggedAt)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expand / Collapse Indicator */}
                      <button
                        type="button"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: '1rem 1.25rem',
                          background: '#F8FAFC',
                          borderTop: '1px solid #E2E8F0',
                          fontSize: '0.825rem',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#334155',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Sparkles size={14} color="#0D9488" />
                          <span>รายละเอียดเชิงลึก (Metadata & Audit Details)</span>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.75rem',
                            background: '#FFFFFF',
                            padding: '0.85rem',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          <div>
                            <span style={{ color: '#64748B', display: 'block' }}>Log ID:</span>
                            <code style={{ fontSize: '0.75rem', color: '#0F172A' }}>{log.id}</code>
                          </div>
                          <div>
                            <span style={{ color: '#64748B', display: 'block' }}>สถานะ:</span>
                            <span style={{ fontWeight: 700, color: log.status === 'FAILED' ? '#DC2626' : '#16A34A' }}>
                              {log.status || 'SUCCESS'}
                            </span>
                          </div>
                          {log.metadata?.auditId && (
                            <div>
                              <span style={{ color: '#64748B', display: 'block' }}>Audit ID:</span>
                              <code style={{ fontSize: '0.75rem', color: '#0284C7' }}>{log.metadata.auditId}</code>
                            </div>
                          )}
                          {log.metadata?.topic && (
                            <div>
                              <span style={{ color: '#64748B', display: 'block' }}>หัวข้อตรวจ:</span>
                              <strong style={{ color: '#DC2626' }}>{log.metadata.topic}</strong>
                            </div>
                          )}
                          {log.metadata?.comment && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <span style={{ color: '#64748B', display: 'block' }}>ข้อคิดเห็น Lead IA:</span>
                              <div
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  background: '#FFFBEB',
                                  border: '1px solid #FDE68A',
                                  color: '#92400E',
                                  marginTop: '4px',
                                }}
                              >
                                {log.metadata.comment}
                              </div>
                            </div>
                          )}
                          {log.metadata?.to && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <span style={{ color: '#64748B', display: 'block' }}>ผู้รับอีเมล:</span>
                              <span style={{ color: '#0284C7', fontWeight: 600 }}>{log.metadata.to}</span>
                              {log.metadata.cc && ` (CC: ${log.metadata.cc})`}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
            แสดง {filteredLogs.length} จาก {logs.length} กิจกรรมที่บันทึก
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
