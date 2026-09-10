'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeImsAudits,
  saveImsAuditRecord,
  deleteImsAuditRecord,
  approveAuditPlanByLead,
  returnAuditPlanForRevision,
  completeAuditEvaluation,
  subscribeYearlyAuditors,
  saveYearlyAuditors,
  isUserAuthorizedAuditor,
  isLeadAuditorUser,
  isDccUser,
  canUserEditAudit,
  canUserDeleteAudit,
} from '@/lib/imsService';
import { subscribePersonnelList } from '@/lib/storageService';
import {
  IMS_AUDIT_TOPICS,
  IMS_RESULT_TYPES,
  IMS_AUDIT_STATUSES,
} from '@/lib/constants';
import ImsAuditModal from '@/components/ImsAuditModal';
import ImsAuditDetailModal from '@/components/ImsAuditDetailModal';
import ImsAuditorsConfigModal from '@/components/ImsAuditorsConfigModal';
import ImsActivityLogModal from '@/components/ImsActivityLogModal';
import {
  ShieldCheck,
  FileCheck,
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Layers,
  Settings,
  AlertCircle,
  Eye,
  CheckSquare,
  Sparkles,
  BarChart3,
  Award,
  Lock,
  LogIn,
  History,
} from 'lucide-react';

export default function ImsAuditPage() {
  const { currentUser, currentPersonnel, isAdmin, isLoading: authLoading, handleGoogleSignIn } = useAuth();

  // Data states
  const [audits, setAudits] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2569');
  const [yearlyConfig, setYearlyConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAuditForDetail, setSelectedAuditForDetail] = useState(null);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isActivityLogModalOpen, setIsActivityLogModalOpen] = useState(false);

  // Toast / Status banner
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const showFeedback = (msg, type = 'success') => {
    setFeedbackMessage({ msg, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // 1. Subscribe to Personnel List
  useEffect(() => {
    const unsub = subscribePersonnelList((list) => {
      setPersonnelList(list || []);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Audits
  useEffect(() => {
    const unsub = subscribeImsAudits((data) => {
      setAudits(data || []);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to Yearly Config
  useEffect(() => {
    const unsub = subscribeYearlyAuditors(selectedYear, (config) => {
      setYearlyConfig(config);
    });
    return () => unsub();
  }, [selectedYear]);

  // Check if current user is authorized to create/edit audits for this year
  const isAuthorizedToAudit = useMemo(() => {
    if (isAdmin) return true;
    if (!currentUser) return false;
    return isUserAuthorizedAuditor(currentUser, currentPersonnel, yearlyConfig, isAdmin);
  }, [currentUser, currentPersonnel, yearlyConfig, isAdmin]);

  // Check if current user is Lead Auditor
  const isLeadAuditor = useMemo(() => {
    if (isAdmin) return true;
    if (!currentUser) return false;
    return isLeadAuditorUser(currentUser, currentPersonnel, yearlyConfig, isAdmin);
  }, [currentUser, currentPersonnel, yearlyConfig, isAdmin]);

  // Check if current user is DCC (ผู้ควบคุมเอกสาร)
  const isDcc = useMemo(() => {
    if (isAdmin) return true;
    if (!currentUser) return false;
    return isDccUser(currentUser, currentPersonnel, yearlyConfig, isAdmin);
  }, [currentUser, currentPersonnel, yearlyConfig, isAdmin]);

  // Filtered Audits
  const filteredAudits = useMemo(() => {
    return audits.filter((audit) => {
      // Year filter
      if (selectedYear !== 'ALL' && audit.auditYear !== selectedYear) {
        return false;
      }
      // Topic filter
      if (topicFilter !== 'ALL' && audit.topic !== topicFilter) {
        return false;
      }
      // Result filter
      if (resultFilter !== 'ALL' && audit.result !== resultFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && audit.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTopic = audit.topic?.toLowerCase().includes(q);
        const matchItem = audit.item?.toLowerCase().includes(q);
        const matchClauses = audit.clauses?.toLowerCase().includes(q);
        const matchAuditor1 = audit.auditor1Name?.toLowerCase().includes(q);
        const matchAuditor2 = audit.auditor2Name?.toLowerCase().includes(q);
        const matchAuditee = audit.auditee1Name?.toLowerCase().includes(q);
        const matchFindings = audit.findings?.toLowerCase().includes(q);
        if (
          !matchTopic &&
          !matchItem &&
          !matchClauses &&
          !matchAuditor1 &&
          !matchAuditor2 &&
          !matchAuditee &&
          !matchFindings
        ) {
          return false;
        }
      }
      return true;
    });
  }, [audits, selectedYear, topicFilter, resultFilter, statusFilter, searchQuery]);

  // Minimal Dashboard Metrics (for selected year)
  const dashboardStats = useMemo(() => {
    const currentYearAudits =
      selectedYear === 'ALL' ? audits : audits.filter((a) => a.auditYear === selectedYear);

    const total = currentYearAudits.length;
    const pendingApproval = currentYearAudits.filter(
      (a) => a.status === 'PENDING_LEAD_APPROVAL'
    ).length;
    const readyForAudit = currentYearAudits.filter((a) => a.status === 'READY_FOR_AUDIT').length;
    const completed = currentYearAudits.filter((a) => a.status === 'COMPLETED').length;

    const cCount = currentYearAudits.filter((a) => a.result === 'C').length;
    const ncCount = currentYearAudits.filter((a) => a.result === 'NC').length;
    const ofiCount = currentYearAudits.filter((a) => a.result === 'OFI').length;
    const totalResults = cCount + ncCount + ofiCount;

    return {
      total,
      pendingApproval,
      readyForAudit,
      completed,
      cCount,
      ncCount,
      ofiCount,
      totalResults,
      cPercent: totalResults > 0 ? Math.round((cCount / totalResults) * 100) : 0,
      ncPercent: totalResults > 0 ? Math.round((ncCount / totalResults) * 100) : 0,
      ofiPercent: totalResults > 0 ? Math.round((ofiCount / totalResults) * 100) : 0,
    };
  }, [audits, selectedYear]);

  // Handlers
  const handleSaveAudit = async (data) => {
    const actor = {
      name: currentPersonnel?.name || currentUser?.displayName || 'ผู้ตรวจ',
      email: currentUser?.email || currentPersonnel?.email || '',
    };
    const options = {
      leadAuditorEmail: yearlyConfig?.leadAuditorEmail,
      leadAuditorName: yearlyConfig?.leadAuditorName,
    };
    await saveImsAuditRecord(data, actor, options);
    showFeedback('บันทึกรายงานการตรวจติดตามเรียบร้อยแล้ว (ส่งอีเมลแจ้งเตือนแล้ว)');
  };

  const handleDeleteAudit = async (audit) => {
    if (!window.confirm(`ยืนยันการลบรายงานการตรวจหัวข้อ "${audit.topic}"?`)) return;
    const actor = {
      name: currentPersonnel?.name || currentUser?.displayName || 'Admin',
      email: currentUser?.email || '',
    };
    await deleteImsAuditRecord(audit.id, actor);
    showFeedback('ลบรายงานเรียบร้อยแล้ว', 'info');
  };

  const handleApproveByLead = async (auditId) => {
    const leadActor = {
      name: currentPersonnel?.name || currentUser?.displayName || 'Lead Internal Auditor',
      email: currentUser?.email || '',
    };
    await approveAuditPlanByLead(auditId, leadActor);
    showFeedback('อนุมัติแผนการตรวจติดตามเรียบร้อยแล้ว (ส่งอีเมลแจ้งเตือนผู้ตรวจแล้ว)');
  };

  const handleReturnPlan = async (auditId, comment) => {
    const leadActor = {
      name: currentPersonnel?.name || currentUser?.displayName || 'Lead Internal Auditor',
      email: currentUser?.email || '',
    };
    await returnAuditPlanForRevision(auditId, comment, leadActor);
    showFeedback('ส่งกลับแผนตรวจเพื่อให้ผู้ตรวจแก้ไขเรียบร้อยแล้ว (ส่งอีเมลแจ้งเตือนแล้ว)', 'info');
  };

  const handleSaveYearlyConfig = async (year, configData) => {
    const adminActor = {
      name: currentPersonnel?.name || currentUser?.displayName || 'Admin',
      email: currentUser?.email || '',
    };
    await saveYearlyAuditors(year, configData, adminActor);
    showFeedback(`บันทึกรายชื่อผู้ตรวจติดตามประจำปีงบประมาณ ${year} เรียบร้อยแล้ว`);
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
        }}
      >
        <div style={{ textAlign: 'center', color: '#0D9488', fontWeight: 600 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #CCFBF1',
              borderTopColor: '#0D9488',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span>กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</span>
        </div>
      </div>
    );
  }

  // Authentication Gate: User must log in first
  if (!currentUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #F0FDFA 0%, #F8FAFC 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '1.5rem',
            border: '1px solid #E2E8F0',
            padding: '2.5rem 2.25rem',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.3)',
            }}
          >
            <ShieldCheck size={40} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: '#CCFBF1',
              color: '#0F766E',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '1rem',
            }}
          >
            <Lock size={13} />
            <span>สงวนสิทธิ์เฉพาะผู้ใช้ที่เข้าสู่ระบบ</span>
          </div>

          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
            รายงานการตรวจติดตามภายใน (IMS)
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
            กรุณาเข้าสู่ระบบด้วย Google Account ของสำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ เพื่อเข้าถึงรายงานและการตรวจติดตาม
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <LogIn size={18} />
              <span>เข้าสู่ระบบด้วยบัญชี Google KMUTNB</span>
            </button>

            <Link
              href="/"
              className="btn btn-secondary"
              style={{
                width: '100%',
                justifyContent: 'center',
                fontSize: '0.875rem',
                padding: '0.65rem 1rem',
              }}
            >
              <ArrowLeft size={16} />
              <span>กลับสู่หน้าหลัก (Portal)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '5rem' }}>
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            background: feedbackMessage.type === 'info' ? '#0284C7' : '#0F766E',
            color: '#FFFFFF',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '0.9rem',
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{feedbackMessage.msg}</span>
        </div>
      )}

      {/* Top Breadcrumb & Actions Bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '1rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <Link href="/" style={{ color: '#64748B', textDecoration: 'none' }}>
              หน้าหลัก
            </Link>
            <ChevronRight size={14} color="#94A3B8" />
            <Link href="/ims" style={{ color: '#0D9488', textDecoration: 'none', fontWeight: 600 }}>
              ระบบบริหารงาน IMS
            </Link>
            <ChevronRight size={14} color="#94A3B8" />
            <span style={{ color: '#0F172A', fontWeight: 700 }}>รายงานการตรวจติดตามภายใน</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Button: Activity Log Modal */}
            <button
              type="button"
              onClick={() => setIsActivityLogModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <History size={16} color="#0D9488" />
              <span>ประวัติกิจกรรม (Activity Log)</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Settings size={16} color="#64748B" />
                <span>จัดการรายชื่อผู้ตรวจประจำปีงบประมาณ</span>
              </button>
            )}

            {isAuthorizedToAudit ? (
              <button
                type="button"
                onClick={() => {
                  setEditingAudit(null);
                  setIsFormModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(13, 148, 136, 0.3)',
                }}
              >
                <Plus size={17} />
                <span>สร้างรายงานการตรวจติดตาม</span>
              </button>
            ) : (
              <div
                title="โหมดดูข้อมูลอย่างเดียว: เฉพาะคณะผู้ตรวจติดตามที่ได้รับมอบหมายของปีนี้เท่านั้นที่สามารถสร้างรายงานได้"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  background: '#F1F5F9',
                  color: '#64748B',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  border: '1px solid #CBD5E1',
                }}
              >
                <Eye size={15} color="#64748B" />
                <span>โหมดดูข้อมูลอย่างเดียว</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.75rem 1.5rem' }}>
        {/* Title Header with Year Selector */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#0F172A',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#CCFBF1',
                  color: '#0D9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileCheck size={22} />
              </div>
              <span>Internal Audit Report (การตรวจติดตามภายใน)</span>
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.9rem' }}>
              มาตรฐาน IMS (ISO 9001 & ISO/IEC 27001) สำนักคอมพิวเตอร์ฯ มจพ.
            </p>
          </div>

          {/* Year Selector Pills */}
          <div
            style={{
              display: 'inline-flex',
              background: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '3px',
            }}
          >
            {['2569', '2570', '2568', 'ALL'].map((yr) => {
              const isSel = selectedYear === yr;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSel ? '#0D9488' : 'transparent',
                    color: isSel ? '#FFFFFF' : '#64748B',
                    fontWeight: isSel ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {yr === 'ALL' ? 'ทุกปีงบประมาณ' : `ปีงบประมาณ ${yr}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimal Dashboard Overview Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Card 1: Total Audits */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748B' }}>
              แผนตรวจทั้งหมด ({selectedYear === 'ALL' ? 'ทุกปีงบประมาณ' : `ปีงบประมาณ ${selectedYear}`})
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0F172A',
                marginTop: '0.25rem',
                lineHeight: 1.1,
              }}
            >
              {dashboardStats.total}
            </div>
            <div style={{ fontSize: '0.775rem', color: '#94A3B8', marginTop: '6px' }}>
              {dashboardStats.completed} ตรวจเสร็จสิ้นแล้ว
            </div>
          </div>

          {/* Card 2: Approved / Pending Lead Approval */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748B' }}>
              สถานะการอนุมัติแผนตรวจ
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0284C7', lineHeight: 1.1 }}>
                {dashboardStats.readyForAudit + dashboardStats.completed}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                / {dashboardStats.total} อนุมัติแล้ว
              </span>
            </div>
            <div style={{ fontSize: '0.775rem', color: '#D97706', marginTop: '6px', fontWeight: 600 }}>
              {dashboardStats.pendingApproval > 0
                ? `⏳ รอ Lead IA อนุมัติ ${dashboardStats.pendingApproval} รายการ`
                : '✅ ทุกแผนได้รับการอนุมัติ'}
            </div>
          </div>

          {/* Card 3: C (Conformity) */}
          <div
            style={{
              background: '#F0FDF4',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid #BBF7D0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#16A34A' }}>
              C - Conformity (สอดคล้อง)
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#15803D',
                marginTop: '0.25rem',
                lineHeight: 1.1,
              }}
            >
              {dashboardStats.cCount}
            </div>
            <div style={{ fontSize: '0.775rem', color: '#16A34A', marginTop: '6px' }}>
              {dashboardStats.totalResults > 0 ? `${dashboardStats.cPercent}% ของผลตรวจ` : '-'}
            </div>
          </div>

          {/* Card 4: NC (Non-Conformity) */}
          <div
            style={{
              background: '#FEF2F2',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid #FECACA',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#DC2626' }}>
              NC - Non-Conformity (ไม่สอดคล้อง)
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#B91C1C',
                marginTop: '0.25rem',
                lineHeight: 1.1,
              }}
            >
              {dashboardStats.ncCount}
            </div>
            <div style={{ fontSize: '0.775rem', color: '#DC2626', marginTop: '6px' }}>
              {dashboardStats.ncCount > 0 ? 'จำเป็นต้องออกใบ CAR' : 'ไม่พบข้อบกพร่อง NC'}
            </div>
          </div>

          {/* Card 5: OFI (Opportunity for Improvement) */}
          <div
            style={{
              background: '#FFFBEB',
              borderRadius: '1rem',
              padding: '1.25rem',
              border: '1px solid #FDE68A',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#D97706' }}>
              OFI - ข้อสังเกต / ข้อเสนอแนะ
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#B45309',
                marginTop: '0.25rem',
                lineHeight: 1.1,
              }}
            >
              {dashboardStats.ofiCount}
            </div>
            <div style={{ fontSize: '0.775rem', color: '#D97706', marginTop: '6px' }}>
              เพื่อนำไปพัฒนาปรับปรุง
            </div>
          </div>
        </div>

        {/* C / NC / OFI Distribution Visual Bar */}
        {dashboardStats.totalResults > 0 && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '1rem',
              padding: '1rem 1.25rem',
              border: '1px solid #E2E8F0',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: '#475569',
              }}
            >
              <span>สัดส่วนผลการตรวจติดตาม (C vs NC vs OFI)</span>
              <span>รวม {dashboardStats.totalResults} ผลสรุป</span>
            </div>
            <div
              style={{
                height: '12px',
                borderRadius: '999px',
                background: '#F1F5F9',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              {dashboardStats.cCount > 0 && (
                <div
                  style={{
                    width: `${dashboardStats.cPercent}%`,
                    background: '#10B981',
                    height: '100%',
                    title: `C: ${dashboardStats.cCount}`,
                  }}
                />
              )}
              {dashboardStats.ncCount > 0 && (
                <div
                  style={{
                    width: `${dashboardStats.ncPercent}%`,
                    background: '#EF4444',
                    height: '100%',
                    title: `NC: ${dashboardStats.ncCount}`,
                  }}
                />
              )}
              {dashboardStats.ofiCount > 0 && (
                <div
                  style={{
                    width: `${dashboardStats.ofiPercent}%`,
                    background: '#F59E0B',
                    height: '100%',
                    title: `OFI: ${dashboardStats.ofiCount}`,
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Assigned Auditors Bar */}
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F766E' }}>
            <Users size={17} />
            <span>
              <strong>คณะผู้ตรวจติดตามประจำปีงบประมาณ {selectedYear}:</strong> Lead IA คือ{' '}
              <strong>{yearlyConfig?.leadAuditorName || 'รศ. ดร.ประเสริฐศักดิ์ เตียวงค์สมบัติ'}</strong>
              {yearlyConfig?.dccName && (
                <>
                  {' '}• DCC (ผู้ควบคุมเอกสาร): <strong>{yearlyConfig.dccName}</strong>
                </>
              )}
              {yearlyConfig?.auditors && yearlyConfig.auditors.length > 0
                ? ` • ผู้ตรวจ ${yearlyConfig.auditors.length} ท่าน (${yearlyConfig.auditors
                  .map((a) => a.name)
                  .join(', ')})`
                : ''}
            </span>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#0D9488',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              แก้ไขผู้ตรวจ
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '1rem',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '12px', top: '12px' }}
              />
              <input
                type="text"
                placeholder="ค้นหาหัวข้อ, ผู้ตรวจ, ผู้รับการตรวจ, Clauses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem 0.6rem 2.5rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.875rem',
                  background: '#FFFFFF',
                }}
              />
            </div>

            {/* Topic Filter */}
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                background: '#FFFFFF',
              }}
            >
              <option value="ALL">-- ทุกหัวข้อที่รับการตรวจ (23 หัวข้อ) --</option>
              {IMS_AUDIT_TOPICS.map((topic, i) => (
                <option key={i} value={topic}>
                  {i + 1}. {topic}
                </option>
              ))}
            </select>

            {/* Result Filter */}
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                background: '#FFFFFF',
              }}
            >
              <option value="ALL">-- ผลการตรวจทั้งหมด (C, NC, OFI) --</option>
              <option value="C">C - Conformity (สอดคล้อง)</option>
              <option value="NC">NC - Non-Conformity (ไม่สอดคล้อง)</option>
              <option value="OFI">OFI - Opportunity for Improvement</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                background: '#FFFFFF',
              }}
            >
              <option value="ALL">-- ทุกสถานะแผนตรวจ --</option>
              {Object.values(IMS_AUDIT_STATUSES).map((st) => (
                <option key={st.key} value={st.key}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Reports Table */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '1.25rem',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>
                รายการตรวจติดตามภายใน ({filteredAudits.length} รายการ)
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#0D9488',
                  background: '#F0FDFA',
                  padding: '2px 9px',
                  borderRadius: '999px',
                  border: '1px solid #99F6E4',
                }}
                title="ระบบเชื่อมต่อ Firestore Real-Time Listener ซิงค์ข้อมูลอัตโนมัติทันที"
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#0D9488',
                    boxShadow: '0 0 6px #0D9488',
                  }}
                />
                อัปเดตแบบเรียลไทม์ (Live Sync)
              </span>
            </div>
          </div>

          {filteredAudits.length === 0 ? (
            <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#94A3B8' }}>
              <FileCheck size={44} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569' }}>
                ไม่พบรายการตรวจติดตามตามเงื่อนไขที่เลือก
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem' }}>
                สามารถสร้างรายงานการตรวจติดตามใหม่ หรือปรับตัวกรองค้นหา
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.825rem', fontWeight: 700, color: '#475569' }}>
                      วันที่ / ปี
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.825rem', fontWeight: 700, color: '#475569' }}>
                      หัวข้อที่รับการตรวจ & ข้อตรวจ
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.825rem', fontWeight: 700, color: '#475569' }}>
                      ผู้ตรวจติดตาม
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.825rem', fontWeight: 700, color: '#475569' }}>
                      ผู้รับการตรวจ
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.825rem', fontWeight: 700, color: '#475569' }}>
                      Lead IA อนุมัติ
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.825rem', fontWeight: 700, color: '#475569' }}>
                      ผลการตรวจ
                    </th>
                    <th
                      style={{
                        padding: '0.85rem 1rem',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        color: '#475569',
                        textAlign: 'right',
                      }}
                    >
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudits.map((audit) => {
                    const resultMeta = audit.result ? IMS_RESULT_TYPES[audit.result] : null;
                    const statusMeta =
                      IMS_AUDIT_STATUSES[audit.status] || IMS_AUDIT_STATUSES.PENDING_LEAD_APPROVAL;

                    return (
                      <tr
                        key={audit.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                      >
                        {/* วันที่ / ปี */}
                        <td style={{ padding: '1rem', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0284C7' }}>
                            {audit.auditDate || '-'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            ปีงบประมาณ {audit.auditYear}
                          </div>
                        </td>

                        {/* หัวข้อที่รับการตรวจ & ข้อตรวจ */}
                        <td style={{ padding: '1rem', verticalAlign: 'top', maxWidth: '320px' }}>
                          <div
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              color: '#DC2626',
                              lineHeight: 1.3,
                              marginBottom: '3px',
                            }}
                          >
                            {audit.topic}
                          </div>
                          <div
                            style={{
                              fontSize: '0.825rem',
                              color: '#0284C7',
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {audit.item}
                          </div>
                          {audit.clauses && (
                            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                              ข้อกำหนด: <strong>{audit.clauses}</strong>
                            </div>
                          )}
                        </td>

                        {/* ผู้ตรวจติดตาม */}
                        <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0369A1' }}>
                            1. {audit.auditor1Name || '-'}
                          </div>
                          {audit.hasSecondAuditor && audit.auditor2Name && (
                            <div style={{ fontSize: '0.8rem', color: '#0284C7', marginTop: '2px' }}>
                              2. {audit.auditor2Name}
                            </div>
                          )}
                        </td>

                        {/* ผู้รับการตรวจ */}
                        <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                          {Array.isArray(audit.auditees) && audit.auditees.length > 0 ? (
                            <div>
                              {audit.auditees.map((aud, i) => (
                                <div key={i} style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', lineHeight: 1.4 }}>
                                  {audit.auditees.length > 1 ? `${i + 1}. ` : ''}{aud.name || '-'}
                                  {aud.department && (
                                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 400, marginLeft: '4px' }}>
                                      ({aud.department})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>
                                {audit.auditee1Name || '-'}
                              </div>
                              {audit.auditeeDepartment && (
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                  {audit.auditeeDepartment}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* สถานะ Lead IA อนุมัติ */}
                        <td style={{ padding: '1rem', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          {audit.approvedByLeadIA ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: '#DCFCE7',
                                color: '#15803D',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              <CheckCircle2 size={13} /> APPROVED
                            </span>
                          ) : audit.status === 'RETURNED_FOR_REVISION' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: '#FEE2E2',
                                color: '#B91C1C',
                                border: '1px solid #FCA5A5',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              <AlertCircle size={13} /> ส่งกลับเพื่อแก้ไข
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: '#FEF3C7',
                                color: '#92400E',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              <Clock size={13} /> รออนุมัติ
                            </span>
                          )}
                        </td>

                        {/* ผลการตรวจ C / NC / OFI */}
                        <td style={{ padding: '1rem', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          {resultMeta ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: resultMeta.bg,
                                color: resultMeta.color,
                                border: `1px solid ${resultMeta.border}`,
                                fontSize: '0.825rem',
                                fontWeight: 800,
                              }}
                            >
                              {resultMeta.code}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>ยังไม่สรุป</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '1rem', verticalAlign: 'top', textAlign: 'right' }}>
                          {(() => {
                            const canEdit = canUserEditAudit(audit, currentUser, currentPersonnel, yearlyConfig, isAdmin);
                            const canDelete = canUserDeleteAudit(audit, currentUser, currentPersonnel, yearlyConfig, isAdmin);

                            return (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  justifyContent: 'flex-end',
                                }}
                              >
                                {/* Lead IA Quick Approve */}
                                {!audit.approvedByLeadIA && (isLeadAuditor || isAdmin) && (
                                  <button
                                    type="button"
                                    title="Lead IA อนุมัติแผนการตรวจ"
                                    onClick={() => handleApproveByLead(audit.id)}
                                    style={{
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: '#16A34A',
                                      color: '#FFFFFF',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <CheckCircle2 size={13} />
                                    <span>อนุมัติ</span>
                                  </button>
                                )}

                                {/* View Detail Modal */}
                                <button
                                  type="button"
                                  title="ดูรายละเอียดการตรวจ"
                                  onClick={() => {
                                    setSelectedAuditForDetail(audit);
                                    setIsDetailModalOpen(true);
                                  }}
                                  style={{
                                    padding: '6px',
                                    borderRadius: '6px',
                                    border: '1px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    color: '#475569',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Eye size={15} />
                                </button>

                                {/* Edit / Evaluate (Authorized auditors for this report, or Lead IA / Admin) */}
                                {canEdit && (
                                  <button
                                    type="button"
                                    title={audit.approvedByLeadIA ? 'บันทึกผลการตรวจ' : 'แก้ไขแผนตรวจ'}
                                    onClick={() => {
                                      setEditingAudit(audit);
                                      setIsFormModalOpen(true);
                                    }}
                                    style={{
                                      padding: '6px',
                                      borderRadius: '6px',
                                      border: '1px solid #BAE6FD',
                                      background: '#F0F9FF',
                                      color: '#0284C7',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Edit size={15} />
                                  </button>
                                )}

                                {/* Delete (Lead IA / Admin can delete all; assigned auditor can delete only before approval) */}
                                {canDelete && (
                                  <button
                                    type="button"
                                    title="ลบรายงาน"
                                    onClick={() => handleDeleteAudit(audit)}
                                    style={{
                                      padding: '6px',
                                      borderRadius: '6px',
                                      border: '1px solid #FECACA',
                                      background: '#FEF2F2',
                                      color: '#DC2626',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal (Create / Edit) */}
      <ImsAuditModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveAudit}
        auditData={editingAudit}
        personnelList={personnelList}
        currentYear={selectedYear === 'ALL' ? '2569' : selectedYear}
        isLeadAuditor={isLeadAuditor}
        isAdmin={isAdmin}
      />

      {/* Detail Modal (AppSheet Styled View) */}
      <ImsAuditDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        audit={selectedAuditForDetail}
        onEdit={(audit) => {
          setEditingAudit(audit);
          setIsFormModalOpen(true);
        }}
        onDelete={handleDeleteAudit}
        onApprove={handleApproveByLead}
        onReturn={handleReturnPlan}
        isLeadAuditor={isLeadAuditor}
        isAdmin={isAdmin}
        canEdit={selectedAuditForDetail ? canUserEditAudit(selectedAuditForDetail, currentUser, currentPersonnel, yearlyConfig, isAdmin) : false}
        canDelete={selectedAuditForDetail ? canUserDeleteAudit(selectedAuditForDetail, currentUser, currentPersonnel, yearlyConfig, isAdmin) : false}
      />

      {/* Admin Yearly Auditor Assignment Modal */}
      <ImsAuditorsConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveYearlyConfig}
        currentYear={selectedYear === 'ALL' ? '2569' : selectedYear}
        yearlyConfig={yearlyConfig}
        personnelList={personnelList}
      />

      {/* IMS Activity Log Modal */}
      <ImsActivityLogModal
        isOpen={isActivityLogModalOpen}
        onClose={() => setIsActivityLogModalOpen(false)}
        currentYear={selectedYear === 'ALL' ? '2569' : selectedYear}
      />
    </div>
  );
}
