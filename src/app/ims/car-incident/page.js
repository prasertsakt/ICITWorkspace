'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeCarIncidents,
  deleteCarIncident,
  CAR_INCIDENT_STATUS,
  CAR_INCIDENT_STATUS_INFO,
  canUserEditPart1And4,
  canUserEditPart2And3,
  canUserManageCarIncidentStatus,
  canUserDeleteCarIncident,
  isDccUser,
  isDeputyDirectorUser,
  isPart3AllStepsCompleted,
} from '@/lib/carIncidentService';
import {
  subscribeImsAudits,
  subscribeYearlyAuditors,
} from '@/lib/imsService';
import { subscribePersonnelList } from '@/lib/storageService';
import {
  IMS_STANDARDS,
  IMS_AUDIT_TOPICS,
} from '@/lib/constants';

import CarIncidentModal from '@/components/CarIncidentModal';
import CarIncidentDetailModal from '@/components/CarIncidentDetailModal';
import CarIncidentStatusModal from '@/components/CarIncidentStatusModal';
import CarIncidentReminderModal from '@/components/CarIncidentReminderModal';

import {
  ShieldCheck,
  AlertOctagon,
  FileText,
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Calendar,
  Layers,
  Eye,
  Mail,
  AlertTriangle,
  FileCheck,
  Check,
  Ban,
  Download,
} from 'lucide-react';

export default function CarIncidentHubPage() {
  const { currentUser, currentPersonnel, isAdmin, handleGoogleSignIn } = useAuth();

  // Data States
  const [carIncidents, setCarIncidents] = useState([]);
  const [iaAudits, setIaAudits] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [yearlyConfig, setYearlyConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Year Selection
  const [selectedYear, setSelectedYear] = useState('2569');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, CAR, INCIDENT
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [standardFilter, setStandardFilter] = useState('ALL');
  const [topicFilter, setTopicFilter] = useState('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedRecordForStatus, setSelectedRecordForStatus] = useState(null);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedRecordForReminder, setSelectedRecordForReminder] = useState(null);

  // Feedback Toast
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const showFeedback = (msg, type = 'success') => {
    setFeedbackMessage({ msg, type });
    setTimeout(() => setFeedbackMessage(null), 4500);
  };

  // 1. Subscribe to Personnel List
  useEffect(() => {
    const unsub = subscribePersonnelList((list) => {
      setPersonnelList(list || []);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to CAR & Incident Records
  useEffect(() => {
    const unsub = subscribeCarIncidents((data) => {
      setCarIncidents(data || []);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to IA Audits (for NC import)
  useEffect(() => {
    const unsub = subscribeImsAudits((data) => {
      setIaAudits(data || []);
    });
    return () => unsub();
  }, []);

  // 4. Subscribe to Yearly Config for the selected year
  useEffect(() => {
    const unsub = subscribeYearlyAuditors(selectedYear, (config) => {
      setYearlyConfig(config || {});
    });
    return () => unsub();
  }, [selectedYear]);

  // Compute available years
  const availableYears = useMemo(() => {
    const yearsSet = new Set(['2570', '2569', '2568']);
    carIncidents.forEach((c) => {
      if (c.fiscalYear) yearsSet.add(String(c.fiscalYear));
    });
    iaAudits.forEach((a) => {
      if (a.auditYear) yearsSet.add(String(a.auditYear));
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [carIncidents, iaAudits]);

  // NC Audits available for import in the current fiscal year
  const availableNcAudits = useMemo(() => {
    return iaAudits.filter((a) => {
      const isSameYear = String(a.auditYear) === String(selectedYear);
      const isNC = a.resultType === 'NC' || a.overallResult === 'NC' || (a.findings && a.findings.includes('NC'));
      return isSameYear && isNC;
    });
  }, [iaAudits, selectedYear]);

  // Role Checks
  const isDCC = useMemo(() => {
    return isDccUser(currentUser, currentPersonnel, yearlyConfig, isAdmin);
  }, [currentUser, currentPersonnel, yearlyConfig, isAdmin]);

  const isDeputy = useMemo(() => {
    return isDeputyDirectorUser(currentUser, currentPersonnel, isAdmin);
  }, [currentUser, currentPersonnel, isAdmin]);

  // Filtered List
  const filteredList = useMemo(() => {
    return carIncidents.filter((item) => {
      // Fiscal Year Filter
      if (item.fiscalYear && String(item.fiscalYear) !== String(selectedYear)) {
        return false;
      }

      // Type Filter
      if (typeFilter !== 'ALL' && item.docType !== typeFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Standard Filter
      if (standardFilter !== 'ALL' && item.standard !== standardFilter) {
        return false;
      }

      // Topic Filter
      if (topicFilter !== 'ALL' && item.topic !== topicFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const docNo = (item.docNumber || '').toLowerCase();
        const top = (item.topic || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const reqNames = (item.requesters || []).map((r) => (r.name || '').toLowerCase()).join(' ');
        const recNames = (item.requestees || []).map((r) => (r.name || '').toLowerCase()).join(' ');

        if (
          !docNo.includes(q) &&
          !top.includes(q) &&
          !desc.includes(q) &&
          !reqNames.includes(q) &&
          !recNames.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [carIncidents, selectedYear, typeFilter, statusFilter, standardFilter, topicFilter, searchQuery]);

  // Counters for selected year
  const stats = useMemo(() => {
    const yearItems = carIncidents.filter((c) => String(c.fiscalYear) === String(selectedYear));
    return {
      total: yearItems.length,
      notYetApproved: yearItems.filter((c) => c.status === CAR_INCIDENT_STATUS.NOT_YET_APPROVED).length,
      onProgress: yearItems.filter((c) => c.status === CAR_INCIDENT_STATUS.ON_PROGRESS).length,
      closed: yearItems.filter((c) => c.status === CAR_INCIDENT_STATUS.CLOSED).length,
      cancelled: yearItems.filter((c) => c.status === CAR_INCIDENT_STATUS.CANCELLED).length,
    };
  }, [carIncidents, selectedYear]);

  // Delete Action Handler
  const handleDelete = async (record) => {
    if (!record) return;
    if (record.status === CAR_INCIDENT_STATUS.CLOSED) {
      alert('ไม่สามารถลบเอกสารที่ปิดสมบูรณ์แล้ว (Closed) ได้');
      return;
    }

    const confirmed = window.confirm(
      `ยืนยันการลบเอกสาร ${record.docNumber} (${record.docType}) หรือไม่?\nการกระทำนี้ไม่สามารถย้อนกลับได้`
    );
    if (!confirmed) return;

    try {
      const actor = {
        name: currentPersonnel?.name || currentUser?.displayName || 'DCC',
        email: currentUser?.email || currentPersonnel?.email || '',
      };
      await deleteCarIncident(record.id, actor, yearlyConfig, isAdmin);
      showFeedback(`ลบเอกสาร ${record.docNumber} เรียบร้อยแล้ว`, 'success');
      if (isDetailModalOpen) setIsDetailModalOpen(false);
    } catch (err) {
      console.error('Delete error:', err);
      showFeedback(err.message || 'ไม่สามารถลบเอกสารได้', 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '4rem' }}>
      {/* Top Banner / Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 60%, #14B8A6 100%)',
          color: '#FFFFFF',
          padding: '2.5rem 1.5rem 3.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              color: '#CCFBF1',
              marginBottom: '1.25rem',
            }}
          >
            <Link
              href="/ims"
              style={{
                color: '#FFFFFF',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={16} />
              <span>ระบบบริหารงาน IMS</span>
            </Link>
            <span>/</span>
            <span style={{ color: '#A7F3D0', fontWeight: 700 }}>CAR & Incident Hub</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginBottom: '0.75rem',
                }}
              >
                <ShieldCheck size={15} color="#A7F3D0" />
                <span>ICIT-FM-COMMON-013, 19 DEC 2025 Version 5.0 (Internal Use)</span>
              </div>
              <h1
                style={{
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
                  fontWeight: 800,
                  margin: '0 0 0.5rem 0',
                  letterSpacing: '-0.02em',
                }}
              >
                CAR & Incident Hub
              </h1>
              <p
                style={{
                  fontSize: '0.95rem',
                  color: '#CCFBF1',
                  margin: 0,
                  maxWidth: '740px',
                  lineHeight: 1.5,
                }}
              >
                ศูนย์จัดการใบแจ้งการแก้ไขและป้องกัน (Corrective Action Request) และรับมืออุบัติการณ์ (Security Incident)
                เชื่อมโยงผลการตรวจติดตามภายใน (NC) พร้อมติดตามกระบวนการแก้ไขและการประเมินผลอย่างเป็นรูปธรรม
              </p>
            </div>

            {/* Year Selector & Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                <Calendar size={18} color="#A7F3D0" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>ปีงบประมาณ:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} style={{ color: '#0F172A' }}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    if (handleGoogleSignIn) {
                      handleGoogleSignIn();
                    } else {
                      alert('กรุณาเข้าสู่ระบบด้วยบัญชี Google เพื่อออกเอกสาร CAR/Incident');
                    }
                    return;
                  }
                  setEditingRecord(null);
                  setIsFormModalOpen(true);
                }}
                className="btn btn-primary"
                style={{
                  background: '#FFFFFF',
                  color: '#0F766E',
                  border: 'none',
                  boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={18} />
                <span>+ ออกเอกสาร CAR / Incident</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '-1.75rem auto 0',
          padding: '0 1.5rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Assigned DCC & IMS Stakeholders Bar */}
        <div
          style={{
            background: '#F0FDFA',
            border: '1px solid #CCFBF1',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            fontSize: '0.85rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F766E' }}>
            <Users size={17} />
            <span>
              <strong>ผู้รับผิดชอบระบบ IMS ปีงบประมาณ {selectedYear}:</strong> DCC (ผู้ควบคุมเอกสาร) คือ{' '}
              <strong>{yearlyConfig?.dccName || 'รศ. ดร.ประเสริฐศักดิ์ เตียวงศ์สมบัติ'}</strong>
              {yearlyConfig?.leadAuditorName && (
                <> &bull; Lead IA: <strong>{yearlyConfig.leadAuditorName}</strong></>
              )}
            </span>
          </div>
          {isDCC && (
            <span
              style={{
                background: '#0D9488',
                color: '#FFFFFF',
                padding: '2px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              ท่านเป็น DCC ประจำปีงบประมาณนี้
            </span>
          )}
        </div>
        {/* Feedback Toast */}
        {feedbackMessage && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              backgroundColor: feedbackMessage.type === 'error' ? '#FEE2E2' : '#ECFDF5',
              border: `1px solid ${feedbackMessage.type === 'error' ? '#FECACA' : '#A7F3D0'}`,
              color: feedbackMessage.type === 'error' ? '#DC2626' : '#059669',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            {feedbackMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{feedbackMessage.msg}</span>
          </div>
        )}

        {/* Stats Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Total */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>เอกสารทั้งหมด</span>
              <FileText size={18} color="#0D9488" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              ประจำปีงบประมาณ {selectedYear}
            </div>
          </div>

          {/* Not Yet Approved */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>รอดำเนินการ</span>
              <Clock size={18} color="#D97706" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#D97706', marginTop: '6px' }}>
              {stats.notYetApproved}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              รอจัดทำแผนหรือรออนุมัติ
            </div>
          </div>

          {/* On Progress */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>กำลังดำเนินการ</span>
              <AlertOctagon size={18} color="#2563EB" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2563EB', marginTop: '6px' }}>
              {stats.onProgress}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              ปฏิบัติการแก้ไข / รอติดตามผล
            </div>
          </div>

          {/* Closed */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>ปิดสมบูรณ์</span>
              <CheckCircle2 size={18} color="#059669" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
              {stats.closed}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
              แก้ไขสำเร็จ / ล็อกการลบ
            </div>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
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
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search
                size={16}
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
                placeholder="ค้นหาเลขที่เอกสาร, หัวข้อตรวจติดตาม, ผู้ร้องขอ, หรือผู้รับบริการ..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Type Filter Buttons */}
            <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
              {['ALL', 'CAR', 'INCIDENT'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: typeFilter === t ? '#FFFFFF' : 'transparent',
                    color: typeFilter === t ? '#0F766E' : '#64748B',
                    fontWeight: typeFilter === t ? 800 : 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: typeFilter === t ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                  }}
                >
                  {t === 'ALL' ? 'ทั้งหมด' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Dropdown Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                color: '#334155',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="ALL">-- สถานะทั้งหมด --</option>
              <option value={CAR_INCIDENT_STATUS.NOT_YET_APPROVED}>รอดำเนินการ (Not Yet Approved)</option>
              <option value={CAR_INCIDENT_STATUS.ON_PROGRESS}>กำลังดำเนินการ (On Progress)</option>
              <option value={CAR_INCIDENT_STATUS.CLOSED}>ปิดสมบูรณ์ (Closed)</option>
              <option value={CAR_INCIDENT_STATUS.CANCELLED}>ยกเลิก (Cancelled)</option>
            </select>

            {/* Standard */}
            <select
              value={standardFilter}
              onChange={(e) => setStandardFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                color: '#334155',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="ALL">-- ทุกมาตรฐาน --</option>
              {IMS_STANDARDS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Topic Filter */}
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                color: '#334155',
                backgroundColor: '#FFFFFF',
                maxWidth: '320px',
              }}
            >
              <option value="ALL">-- ทุกหัวข้อตรวจติดตาม (23 รายการ) --</option>
              {IMS_AUDIT_TOPICS.map((top, idx) => (
                <option key={top} value={top}>
                  {idx + 1}. {top}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Records Data Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '1rem',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', minWidth: '130px' }}>เลขที่เอกสาร</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', minWidth: '90px' }}>ประเภท</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', minWidth: '240px' }}>มาตรฐาน & หัวข้อ</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', minWidth: '160px' }}>ผู้ร้องขอ</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', minWidth: '170px' }}>ผู้รับการร้องขอ</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', minWidth: '120px' }}>สถานะ</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', minWidth: '120px' }}>ความคืบหน้า</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', minWidth: '150px' }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item) => {
                  const statusObj = CAR_INCIDENT_STATUS_INFO[item.status] || {
                    label: item.status,
                    shortLabel: item.status,
                    color: '#475569',
                    bg: '#F1F5F9',
                    border: '#CBD5E1',
                  };

                  // Step progress
                  const totalSteps = (item.actionPlans || []).length;
                  const completedSteps = (item.actionPlans || []).filter((s) => Boolean(s.completedDate && s.signature)).length;
                  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

                  const canManageThisStatus = canUserManageCarIncidentStatus(item, currentUser, currentPersonnel, yearlyConfig, isAdmin);
                  const canDeleteThis = canUserDeleteCarIncident(item, currentUser, currentPersonnel, yearlyConfig, isAdmin);

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                    >
                      {/* Document Code */}
                      <td style={{ padding: '12px 16px' }}>
                        <div
                          onClick={() => {
                            setSelectedRecordForDetail(item);
                            setIsDetailModalOpen(true);
                          }}
                          style={{
                            fontWeight: 800,
                            color: '#0D9488',
                            cursor: 'pointer',
                          }}
                        >
                          {item.docNumber}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          {item.requestDate}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: item.docType === 'INCIDENT' ? '#FEF3C7' : '#EFF6FF',
                            color: item.docType === 'INCIDENT' ? '#B45309' : '#1D4ED8',
                            border: `1px solid ${item.docType === 'INCIDENT' ? '#FDE68A' : '#BFDBFE'}`,
                          }}
                        >
                          {item.docType}
                        </span>
                      </td>

                      {/* Standard & Topic */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '2px' }}>
                          {item.topic}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {item.standard} {item.clauses ? `(ข้อ ${item.clauses})` : ''}
                        </div>
                      </td>

                      {/* Requesters */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#1E293B', fontWeight: 600 }}>
                          {(item.requesters || []).map((r) => r.name).join(', ') || '-'}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                          {item.requesterStatus === 'AUDITOR' ? 'ผู้ตรวจติดตามภายใน' : item.requesterStatus === 'CUSTOMER' ? 'ผู้รับบริการ' : 'อื่นๆ'}
                        </div>
                      </td>

                      {/* Requestees */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#1E293B', fontWeight: 600 }}>
                          {(item.requestees || []).map((r) => r.name).join(', ') || '-'}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                          {item.requestees && item.requestees.length > 1 ? `(${item.requestees.length} ท่าน)` : 'ผู้รับผิดชอบบริการ'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: statusObj.bg,
                            color: statusObj.color,
                            border: `1px solid ${statusObj.border}`,
                          }}
                        >
                          {statusObj.shortLabel || statusObj.label}
                        </span>
                      </td>

                      {/* Progress Bar */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: progressPct === 100 ? '#059669' : '#334155' }}>
                            {completedSteps}/{totalSteps} ขั้นตอน ({progressPct}%)
                          </div>
                          <div style={{ width: '80px', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${progressPct}%`,
                                height: '100%',
                                backgroundColor: progressPct === 100 ? '#10B981' : '#0D9488',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          {/* View Detail Modal */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecordForDetail(item);
                              setIsDetailModalOpen(true);
                            }}
                            className="btn-icon"
                            title="เปิดดูแบบฟอร์มเต็ม (Print / View)"
                            style={{
                              padding: '5px',
                              background: 'transparent',
                              border: 'none',
                              color: '#0D9488',
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={16} />
                          </button>

                          {/* Edit Modal */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecord(item);
                              setIsFormModalOpen(true);
                            }}
                            className="btn-icon"
                            title="แก้ไขข้อมูลแบบฟอร์ม"
                            style={{
                              padding: '5px',
                              background: 'transparent',
                              border: 'none',
                              color: '#64748B',
                              cursor: 'pointer',
                            }}
                          >
                            <Edit size={16} />
                          </button>

                          {/* DCC Reminder Button (Envelope Icon using Mail from lucide-react) */}
                          {isDCC && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRecordForReminder(item);
                                setIsReminderModalOpen(true);
                              }}
                              className="btn-icon text-secondary"
                              title="ส่งอีเมลแจ้งเตือนติดตาม (DCC Reminder)"
                              style={{
                                padding: '5px',
                                background: 'transparent',
                                border: 'none',
                                color: '#0D9488',
                                cursor: 'pointer',
                              }}
                            >
                              <Mail size={16} />
                            </button>
                          )}

                          {/* Delete Button (Only for DCC / Admin, forbidden if Closed) */}
                          {isDCC && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={!canDeleteThis}
                              title={item.status === CAR_INCIDENT_STATUS.CLOSED ? 'เอกสารปิดสมบูรณ์แล้ว ไม่สามารถลบได้' : 'ลบเอกสาร'}
                              style={{
                                padding: '5px',
                                background: 'transparent',
                                border: 'none',
                                color: canDeleteThis ? '#DC2626' : '#CBD5E1',
                                cursor: canDeleteThis ? 'pointer' : 'not-allowed',
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                      <FileText size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <div>ไม่พบเอกสาร CAR หรือ Incident ตามเงื่อนไขที่เลือก</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isFormModalOpen && (
        <CarIncidentModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          record={editingRecord}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          personnelList={personnelList}
          yearlyConfig={yearlyConfig}
          availableNcAudits={availableNcAudits}
          isAdmin={isAdmin}
          onSaved={(saved) => {
            showFeedback(`บันทึกเอกสาร ${saved.docNumber} สำเร็จ`, 'success');
            setIsFormModalOpen(false);
          }}
        />
      )}

      {isDetailModalOpen && (
        <CarIncidentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          record={selectedRecordForDetail}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          yearlyConfig={yearlyConfig}
          isAdmin={isAdmin}
          onEdit={() => {
            setEditingRecord(selectedRecordForDetail);
            setIsDetailModalOpen(false);
            setIsFormModalOpen(true);
          }}
          onDelete={() => handleDelete(selectedRecordForDetail)}
          onManageStatus={() => {
            setSelectedRecordForStatus(selectedRecordForDetail);
            setIsStatusModalOpen(true);
          }}
          onSendReminder={() => {
            setSelectedRecordForReminder(selectedRecordForDetail);
            setIsReminderModalOpen(true);
          }}
        />
      )}

      {isStatusModalOpen && (
        <CarIncidentStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          record={selectedRecordForStatus}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          yearlyConfig={yearlyConfig}
          isAdmin={isAdmin}
          onStatusUpdated={(updated) => {
            showFeedback(`ปรับเปลี่ยนสถานะ ${updated.docNumber} เรียบร้อยแล้ว`, 'success');
            if (selectedRecordForDetail && selectedRecordForDetail.id === updated.id) {
              setSelectedRecordForDetail(updated);
            }
          }}
        />
      )}

      {isReminderModalOpen && (
        <CarIncidentReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          record={selectedRecordForReminder}
          currentUser={currentUser}
          currentPersonnel={currentPersonnel}
          onReminderSent={() => {
            showFeedback('ส่งอีเมลแจ้งเตือนติดตามความคืบหน้าเรียบร้อยแล้ว', 'success');
          }}
        />
      )}
    </div>
  );
}
