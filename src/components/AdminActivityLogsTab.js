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
} from 'lucide-react';
import { ACTIVITY_CATEGORIES, clearAllActivityLogs } from '@/lib/activityLogService';

export default function AdminActivityLogsTab({ logs = [], currentAdmin = null }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState(null);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'SUCCESS' && item.status !== 'SUCCESS') return false;
        if (selectedStatus === 'SIMULATED' && item.status !== 'SIMULATED') return false;
        if (selectedStatus === 'FAILED' && item.status !== 'FAILED') return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchDetails = item.details?.toLowerCase().includes(q);
        const matchActor = item.actorName?.toLowerCase().includes(q) || item.actorEmail?.toLowerCase().includes(q);
        const matchTarget = item.targetName?.toLowerCase().includes(q) || item.targetId?.toLowerCase().includes(q);
        const matchSubject = item.metadata?.subject?.toLowerCase().includes(q);
        const matchRecipient = item.metadata?.to?.toLowerCase().includes(q);

        return matchTitle || matchDetails || matchActor || matchTarget || matchSubject || matchRecipient;
      }
      return true;
    });
  }, [logs, selectedCategory, selectedStatus, searchTerm]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = logs.length;
    const emails = logs.filter((l) => l.category === ACTIVITY_CATEGORIES.EMAIL).length;
    const personnel = logs.filter((l) => l.category === ACTIVITY_CATEGORIES.PERSONNEL).length;
    const attendance = logs.filter(
      (l) => l.category === ACTIVITY_CATEGORIES.ATTENDANCE || l.category === ACTIVITY_CATEGORIES.LEAVE
    ).length;
    return { total, emails, personnel, attendance };
  }, [logs]);

  // Helper to format Thai date time
  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' น.';
    } catch (e) {
      return isoString;
    }
  };

  // Helper to get category icon and colors
  const getCategoryMeta = (category) => {
    switch (category) {
      case ACTIVITY_CATEGORIES.EMAIL:
        return {
          icon: <Mail size={16} />,
          label: 'อีเมล (Email)',
          bg: '#EFF6FF',
          color: '#2563EB',
          border: '#BFDBFE',
        };
      case ACTIVITY_CATEGORIES.PERSONNEL:
        return {
          icon: <User size={16} />,
          label: 'บุคลากร (Personnel)',
          bg: '#ECFDF5',
          color: '#059669',
          border: '#A7F3D0',
        };
      case ACTIVITY_CATEGORIES.ATTENDANCE:
        return {
          icon: <Clock size={16} />,
          label: 'ขอลงเวลา (Attendance)',
          bg: '#F5F3FF',
          color: '#7C3AED',
          border: '#DDD6FE',
        };
      case ACTIVITY_CATEGORIES.LEAVE:
        return {
          icon: <Calendar size={16} />,
          label: 'ปฏิทินวันลา (Leave)',
          bg: '#FFF7ED',
          color: '#EA580C',
          border: '#FED7AA',
        };
      case ACTIVITY_CATEGORIES.DEPARTMENT:
        return {
          icon: <Building2 size={16} />,
          label: 'ฝ่ายงาน (Department)',
          bg: '#F8FAFC',
          color: '#475569',
          border: '#CBD5E1',
        };
      default:
        return {
          icon: <Activity size={16} />,
          label: 'ระบบ (System)',
          bg: '#F1F5F9',
          color: '#334155',
          border: '#E2E8F0',
        };
    }
  };

  // Export logs to JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `icit_activity_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearLogs = async () => {
    if (confirm('คุณต้องการล้างประวัติกิจกรรมทั้งหมดในระบบใช่หรือไม่?')) {
      await clearAllActivityLogs();
      alert('ล้างประวัติกิจกรรมเรียบร้อยแล้ว');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* KPI Stats Header */}
      <div className="grid-4" style={{ gap: '0.75rem' }}>
        <div
          className="card-glass"
          style={{
            padding: '1rem 1.25rem',
            borderLeft: '4px solid var(--primary-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              กิจกรรมทั้งหมด
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {stats.total}
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={20} />
          </div>
        </div>

        <div
          className="card-glass"
          style={{
            padding: '1rem 1.25rem',
            borderLeft: '4px solid #2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              การส่งอีเมล (Emails)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
              {stats.emails}
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mail size={20} />
          </div>
        </div>

        <div
          className="card-glass"
          style={{
            padding: '1rem 1.25rem',
            borderLeft: '4px solid #059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              การจัดการบุคลากร
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
              {stats.personnel}
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={20} />
          </div>
        </div>

        <div
          className="card-glass"
          style={{
            padding: '1rem 1.25rem',
            borderLeft: '4px solid #7C3AED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              ขอลงเวลา & ปฏิทินวันลา
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7C3AED', marginTop: '2px' }}>
              {stats.attendance}
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#F5F3FF',
              color: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card-glass"
        style={{
          padding: '1.25rem',
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
              placeholder="ค้นหาชื่อผู้ดำเนินการ, หัวข้ออีเมล, ผู้รับ, รายละเอียด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem' }}
            />
          </div>

          {/* Status Dropdown */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="SUCCESS">🟢 สำเร็จ (Success / Delivered)</option>
              <option value="SIMULATED">🟡 จำลอง (Simulated / Sandbox)</option>
              <option value="FAILED">🔴 ไม่สำเร็จ (Failed)</option>
            </select>

            <button
              onClick={handleExportJson}
              className="btn btn-secondary btn-sm"
              title="ส่งออกข้อมูลบันทึกประวัติ (Export JSON)"
            >
              <Download size={15} />
              <span>ส่งออก JSON</span>
            </button>

            <button
              onClick={handleClearLogs}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--rose-500)' }}
              title="ล้างบันทึกประวัติทั้งหมด"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
          >
            ทั้งหมด ({logs.length})
          </button>
          <button
            onClick={() => setSelectedCategory(ACTIVITY_CATEGORIES.EMAIL)}
            className={`btn btn-sm ${selectedCategory === ACTIVITY_CATEGORIES.EMAIL ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
          >
            <Mail size={13} />
            <span>อีเมล ({stats.emails})</span>
          </button>
          <button
            onClick={() => setSelectedCategory(ACTIVITY_CATEGORIES.PERSONNEL)}
            className={`btn btn-sm ${selectedCategory === ACTIVITY_CATEGORIES.PERSONNEL ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
          >
            <User size={13} />
            <span>บุคลากร ({stats.personnel})</span>
          </button>
          <button
            onClick={() => setSelectedCategory(ACTIVITY_CATEGORIES.ATTENDANCE)}
            className={`btn btn-sm ${selectedCategory === ACTIVITY_CATEGORIES.ATTENDANCE ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
          >
            <Clock size={13} />
            <span>ขอลงเวลา</span>
          </button>
          <button
            onClick={() => setSelectedCategory(ACTIVITY_CATEGORIES.LEAVE)}
            className={`btn btn-sm ${selectedCategory === ACTIVITY_CATEGORIES.LEAVE ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
          >
            <Calendar size={13} />
            <span>ปฏิทินวันลา</span>
          </button>
          <button
            onClick={() => setSelectedCategory(ACTIVITY_CATEGORIES.DEPARTMENT)}
            className={`btn btn-sm ${selectedCategory === ACTIVITY_CATEGORIES.DEPARTMENT ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
          >
            <Building2 size={13} />
            <span>ฝ่ายงาน</span>
          </button>
        </div>
      </div>

      {/* Activity Logs Timeline / Table */}
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
                  background: 'var(--bg-card-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                <th style={{ padding: '0.85rem 1rem', width: '130px' }}>ประเภท</th>
                <th style={{ padding: '0.85rem 1rem' }}>กิจกรรม / รายละเอียด</th>
                <th style={{ padding: '0.85rem 1rem' }}>ผู้ดำเนินการ</th>
                <th style={{ padding: '0.85rem 1rem', width: '120px' }}>สถานะ</th>
                <th style={{ padding: '0.85rem 1rem', width: '160px' }}>วัน-เวลา</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', width: '80px' }}>ดูข้อมูล</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((item) => {
                const meta = getCategoryMeta(item.category);
                const isSuccess = item.status === 'SUCCESS' || item.status === 'DELIVERED';
                const isSimulated = item.status === 'SIMULATED' || item.status === 'SANDBOX';

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Category */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          background: meta.bg,
                          color: meta.color,
                          border: `1px solid ${meta.border}`,
                        }}
                      >
                        {meta.icon}
                        <span>{item.category}</span>
                      </span>
                    </td>

                    {/* Title & Details */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong style={{ color: 'var(--text-primary)', display: 'block' }}>
                        {item.title}
                      </strong>
                      {item.details && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.details}
                        </div>
                      )}
                      {item.metadata?.error && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--rose-600)', marginTop: '2px' }}>
                          ⚠️ ข้อผิดพลาด: {item.metadata.error}
                        </div>
                      )}
                    </td>

                    {/* Actor */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {item.actorName || 'ระบบ'}
                      </div>
                      {item.actorEmail && (
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          {item.actorEmail}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        className={`badge ${
                          isSuccess
                            ? 'badge-active'
                            : isSimulated
                            ? 'badge-user'
                            : 'badge-resigned'
                        }`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {isSuccess ? '🟢 สำเร็จ' : isSimulated ? '🟡 โหมดจำลอง' : '🔴 ล้มเหลว'}
                      </span>
                    </td>

                    {/* Time */}
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {formatDateTime(item.loggedAt)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedLogForDetail(item)}
                        className="btn btn-ghost btn-icon"
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
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Activity size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>ยังไม่มีบันทึกประวัติกิจกรรมที่ตรงกับเงื่อนไข</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              เมื่อมีการส่งอีเมล หรือดำเนินการใดๆ ในระบบ ประวัติจะปรากฏที่นี่แบบ Real-time
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLogForDetail && (
        <div className="modal-overlay" onClick={() => setSelectedLogForDetail(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '95%' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  <Info size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>รายละเอียดบันทึกกิจกรรม (Log Details)</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ID: {selectedLogForDetail.id}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedLogForDetail(null)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>หัวข้อกิจกรรม:</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedLogForDetail.title}
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedLogForDetail.details}
                </div>
              </div>

              <div className="grid-2" style={{ gap: '0.75rem', fontSize: '0.825rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>หมวดหมู่: </span>
                  <strong>{selectedLogForDetail.category}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>สถานะ: </span>
                  <strong>{selectedLogForDetail.status}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>ผู้ดำเนินการ: </span>
                  <strong>{selectedLogForDetail.actorName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>เวลาที่บันทึก: </span>
                  <span>{formatDateTime(selectedLogForDetail.loggedAt)}</span>
                </div>
              </div>

              {/* Metadata Details */}
              {selectedLogForDetail.metadata && Object.keys(selectedLogForDetail.metadata).length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    ข้อมูลเพิ่มเติม (Metadata):
                  </div>
                  <pre
                    style={{
                      background: '#1E293B',
                      color: '#F8FAFC',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      maxHeight: '180px',
                      overflow: 'auto',
                    }}
                  >
                    {JSON.stringify(selectedLogForDetail.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedLogForDetail(null)} className="btn btn-secondary btn-sm">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
