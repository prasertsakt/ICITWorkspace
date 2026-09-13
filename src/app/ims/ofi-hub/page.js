'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeOfiItems,
  syncOfiFromAudits,
  saveOfiItem,
  deleteOfiItem,
  getOfiEditPermission,
  OFI_IMPLEMENT_OPTIONS,
  OFI_STATUS_OPTIONS,
  OFI_STATUS_CONFIG,
} from '@/lib/ofiHubService';
import {
  subscribeImsAudits,
  subscribeYearlyAuditors,
  isDccUser,
  isMrUser,
} from '@/lib/imsService';
import { subscribePersonnelList } from '@/lib/storageService';
import { PREDEFINED_DEPARTMENTS } from '@/lib/constants';
import OfiDetailModal from '@/components/OfiDetailModal';

import {
  Lightbulb,
  Sparkles,
  ArrowLeft,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Users,
  Building,
  ChevronRight,
  Shield,
  ShieldCheck,
  Lock,
  LogIn,
  Check,
  X,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

export default function OfiHubPage() {
  const { currentUser, currentPersonnel, isAdmin, handleGoogleSignIn } = useAuth();

  // Data states
  const [ofiItems, setOfiItems] = useState([]);
  const [iaAudits, setIaAudits] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);
  const [yearlyConfig, setYearlyConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Year Selection
  const [selectedYear, setSelectedYear] = useState('2569');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [implementFilter, setImplementFilter] = useState('ALL'); // ALL, YES, NO, PENDING
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ON_PROCESS, COMPLETED
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Modal States
  const [selectedOfiForDetail, setSelectedOfiForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Assignment Dropdown / Modal state for DCC
  const [assigningOfi, setAssigningOfi] = useState(null);
  const [assignmentType, setAssignmentType] = useState(null); // 'departments' | 'assignees'
  const [tempSelection, setTempSelection] = useState([]);
  const [personnelSearch, setPersonnelSearch] = useState('');

  // Syncing state & Feedback Toast
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error'|'info', message: '' }

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4500);
  };

  // 1. Subscribe to OFI Items
  useEffect(() => {
    const unsub = subscribeOfiItems((data) => {
      setOfiItems(data || []);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to IA Audits (for syncing)
  useEffect(() => {
    const unsub = subscribeImsAudits((data) => {
      setIaAudits(data || []);
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to Personnel List
  useEffect(() => {
    const unsub = subscribePersonnelList((list) => {
      setPersonnelList(list || []);
    });
    return () => unsub();
  }, []);

  // 4. Subscribe to Yearly Config
  useEffect(() => {
    const unsub = subscribeYearlyAuditors(selectedYear, (config) => {
      setYearlyConfig(config || {});
    });
    return () => unsub();
  }, [selectedYear]);

  // Compute available fiscal years
  const availableYears = useMemo(() => {
    const yearsSet = new Set(['2570', '2569', '2568']);
    ofiItems.forEach((item) => {
      if (item.fiscalYear) yearsSet.add(String(item.fiscalYear));
    });
    iaAudits.forEach((audit) => {
      if (audit.auditYear) yearsSet.add(String(audit.auditYear));
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [ofiItems, iaAudits]);

  // Role Checks
  const isDcc = useMemo(() => {
    return isDccUser(currentUser, currentPersonnel, yearlyConfig);
  }, [currentUser, currentPersonnel, yearlyConfig]);

  const isMr = useMemo(() => {
    return isMrUser(currentUser, currentPersonnel, yearlyConfig);
  }, [currentUser, currentPersonnel, yearlyConfig]);

  const canSync = isAdmin || isDcc || isMr;
  const canEditDccFields = isAdmin || isDcc; // Only DCC & Admin can assign departments & assignees

  // Filter OFI items by selected fiscal year
  const yearOfiItems = useMemo(() => {
    return ofiItems.filter((item) => String(item.fiscalYear) === String(selectedYear));
  }, [ofiItems, selectedYear]);

  // Count OFI from IA audits for current fiscal year
  const availableIaOfiCount = useMemo(() => {
    return iaAudits.filter(
      (a) =>
        String(a.auditYear) === String(selectedYear) &&
        (a.result === 'OFI' || a.overallResult === 'OFI')
    ).length;
  }, [iaAudits, selectedYear]);

  // Summary Metrics for Dashboard
  const metrics = useMemo(() => {
    const total = yearOfiItems.length;
    const implementYes = yearOfiItems.filter((i) => i.implement === 'YES').length;
    const implementNo = yearOfiItems.filter((i) => i.implement === 'NO').length;
    const implementPending = yearOfiItems.filter(
      (i) => !i.implement || (i.implement !== 'YES' && i.implement !== 'NO')
    ).length;
    const onProcess = yearOfiItems.filter(
      (i) => i.implement === 'YES' && i.status === 'ON_PROCESS'
    ).length;
    const completed = yearOfiItems.filter(
      (i) => i.implement === 'YES' && i.status === 'COMPLETED'
    ).length;

    return {
      total,
      implementYes,
      implementNo,
      implementPending,
      onProcess,
      completed,
    };
  }, [yearOfiItems]);

  // Filtered Items for Display
  const filteredItems = useMemo(() => {
    return yearOfiItems.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const topic = (item.sourceAuditTopic || '').toLowerCase();
        const clauses = (item.sourceClauses || '').toLowerCase();
        const findings = (item.sourceFindings || '').toLowerCase();
        const remark = (item.remark || '').toLowerCase();
        const deptNames = (item.departments || []).join(' ').toLowerCase();
        const assigneeNames = (item.assignees || []).map((a) => a.name || '').join(' ').toLowerCase();

        const match =
          topic.includes(query) ||
          clauses.includes(query) ||
          findings.includes(query) ||
          remark.includes(query) ||
          deptNames.includes(query) ||
          assigneeNames.includes(query);

        if (!match) return false;
      }

      // Implement filter
      if (implementFilter === 'YES' && item.implement !== 'YES') return false;
      if (implementFilter === 'NO' && item.implement !== 'NO') return false;
      if (
        implementFilter === 'PENDING' &&
        item.implement === 'YES' &&
        item.implement === 'NO'
      )
        return false;

      // Status filter
      if (statusFilter !== 'ALL') {
        if (item.implement !== 'YES') return false;
        if (item.status !== statusFilter) return false;
      }

      // Department filter
      if (departmentFilter !== 'ALL') {
        if (!item.departments || !item.departments.includes(departmentFilter)) return false;
      }

      return true;
    });
  }, [yearOfiItems, searchQuery, implementFilter, statusFilter, departmentFilter]);

  // Handlers
  const handleSync = async () => {
    if (!canSync) {
      showFeedback('เฉพาะ DCC หรือ MR เท่านั้นที่สามารถ Sync ข้อมูลได้', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const actor = {
        email: currentUser?.email,
        name: currentPersonnel?.name || currentUser?.displayName || currentUser?.email,
      };
      const result = await syncOfiFromAudits(selectedYear, iaAudits, actor);
      if (result.newItems > 0) {
        showFeedback(
          `Sync สำเร็จ! ตรวจพบ OFI ทั้งหมด ${result.totalOfi} รายการ, นำเข้าใหม่ ${result.newItems} รายการ`,
          'success'
        );
      } else if (result.totalOfi > 0) {
        showFeedback(
          `พบ OFI ในรายงานการตรวจ ${result.totalOfi} รายการ (ซิงค์ครบถ้วนแล้วทั้งหมด)`,
          'info'
        );
      } else {
        showFeedback(
          `ไม่พบรายการผลการตรวจประเภท OFI ในรายงานการตรวจติดตาม ปีงบประมาณ ${selectedYear}`,
          'info'
        );
      }
    } catch (err) {
      console.error('Sync OFI error:', err);
      showFeedback('เกิดข้อผิดพลาดในการ Sync ข้อมูล', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImplementChange = async (item, newImplement) => {
    const perm = getOfiEditPermission(currentUser, currentPersonnel, yearlyConfig, item, isAdmin);
    if (perm !== 'FULL' && perm !== 'MR') {
      showFeedback('คุณไม่มีสิทธิ์แก้ไขผลการพิจารณา (เฉพาะ DCC หรือ MR)', 'error');
      return;
    }

    let newStatus = item.status;
    if (newImplement === 'NO') {
      newStatus = ''; // Reset status to "-"
    } else if (newImplement === 'YES' && !newStatus) {
      newStatus = OFI_STATUS_OPTIONS.ON_PROCESS; // Default to On Process
    }

    const updated = {
      ...item,
      implement: newImplement,
      status: newStatus,
    };

    try {
      await saveOfiItem(updated, {
        email: currentUser?.email,
        name: currentPersonnel?.name || currentUser?.displayName,
      });
      showFeedback('บันทึกการพิจารณาเรียบร้อยแล้ว', 'success');
    } catch (err) {
      showFeedback('บันทึกไม่สำเร็จ', 'error');
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    const perm = getOfiEditPermission(currentUser, currentPersonnel, yearlyConfig, item, isAdmin);
    if (perm !== 'FULL' && perm !== 'MR') {
      showFeedback('คุณไม่มีสิทธิ์แก้ไขสถานะ (เฉพาะ DCC หรือ MR)', 'error');
      return;
    }

    const updated = {
      ...item,
      status: newStatus,
    };

    try {
      await saveOfiItem(updated, {
        email: currentUser?.email,
        name: currentPersonnel?.name || currentUser?.displayName,
      });
      showFeedback('บันทึกสถานะเรียบร้อยแล้ว', 'success');
    } catch (err) {
      showFeedback('บันทึกไม่สำเร็จ', 'error');
    }
  };

  const handleRemarkChange = async (item, newRemark) => {
    const perm = getOfiEditPermission(currentUser, currentPersonnel, yearlyConfig, item, isAdmin);
    if (perm !== 'FULL' && perm !== 'MR') {
      showFeedback('คุณไม่มีสิทธิ์แก้ไขหมายเหตุ', 'error');
      return;
    }

    const updated = {
      ...item,
      remark: newRemark,
    };

    try {
      await saveOfiItem(updated, {
        email: currentUser?.email,
        name: currentPersonnel?.name || currentUser?.displayName,
      });
    } catch (err) {
      console.error('Save remark error:', err);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!canEditDccFields) {
      showFeedback('เฉพาะ DCC หรือ Admin เท่านั้นที่สามารถลบรายการได้', 'error');
      return;
    }

    if (!window.confirm(`ยืนยันการลบ OFI: "${item.sourceAuditTopic || item.id}" หรือไม่?`)) {
      return;
    }

    try {
      await deleteOfiItem(item.id);
      showFeedback('ลบรายการ OFI เรียบร้อยแล้ว', 'success');
    } catch (err) {
      showFeedback('เกิดข้อผิดพลาดในการลบ', 'error');
    }
  };

  // Open Assignment Modal/Drawer for DCC
  const openAssignmentModal = (item, type) => {
    if (!canEditDccFields) {
      showFeedback('เฉพาะ DCC เท่านั้นที่สามารถมอบหมายฝ่ายหรือผู้รับผิดชอบได้', 'error');
      return;
    }
    setAssigningOfi(item);
    setAssignmentType(type);
    if (type === 'departments') {
      setTempSelection(item.departments || []);
    } else {
      setTempSelection((item.assignees || []).map((a) => a.id));
    }
    setPersonnelSearch('');
  };

  const handleSaveAssignment = async () => {
    if (!assigningOfi) return;

    let updatedItem = { ...assigningOfi };
    if (assignmentType === 'departments') {
      updatedItem.departments = tempSelection;
    } else {
      const selectedPersonnelObjects = personnelList
        .filter((p) => tempSelection.includes(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email || '',
          department: p.department || '',
        }));
      updatedItem.assignees = selectedPersonnelObjects;
    }

    try {
      await saveOfiItem(updatedItem, {
        email: currentUser?.email,
        name: currentPersonnel?.name || currentUser?.displayName,
      });
      showFeedback(
        assignmentType === 'departments'
          ? 'อัปเดตฝ่ายที่เกี่ยวข้องเรียบร้อยแล้ว'
          : 'อัปเดตผู้รับผิดชอบเรียบร้อยแล้ว',
        'success'
      );
      setAssigningOfi(null);
      setAssignmentType(null);
    } catch (err) {
      showFeedback('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  // Open Details Modal
  const openDetailModal = (item) => {
    setSelectedOfiForDetail(item);
    setIsDetailModalOpen(true);
  };

  const handleSaveDetails = async (updatedItem) => {
    try {
      await saveOfiItem(updatedItem, {
        email: currentUser?.email,
        name: currentPersonnel?.name || currentUser?.displayName,
      });
      showFeedback('บันทึกรายละเอียด OFI เรียบร้อยแล้ว', 'success');
    } catch (err) {
      showFeedback('บันทึกรายละเอียดไม่สำเร็จ', 'error');
    }
  };

  // Authentication Gate: User must log in first to access IMS
  if (!currentUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #FAF5FF 0%, #F8FAFC 100%)',
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
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.3)',
            }}
          >
            <Lightbulb size={40} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: '#F3E8FF',
              color: '#7C3AED',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '1rem',
            }}
          >
            <Lock size={13} />
            <span>สงวนสิทธิ์เฉพาะผู้ใช้ที่เข้าสู่ระบบ</span>
          </div>

          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
            ศูนย์ติดตามโอกาสในการพัฒนา (OFI Hub)
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
            ระบบบันทึก มอบหมาย และติดตามความคืบหน้าของโอกาสในการพัฒนา (Opportunity for Improvement) จากผลการตรวจติดตามภายใน
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
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                borderColor: '#7C3AED',
              }}
            >
              <LogIn size={18} />
              <span>เข้าสู่ระบบด้วยบัญชี Google KMUTNB</span>
            </button>

            <Link
              href="/ims"
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
            >
              <ArrowLeft size={16} />
              <span>กลับสู่หน้าหลัก IMS</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get current user edit permission for current record
  const currentOfiPermission = selectedOfiForDetail
    ? getOfiEditPermission(currentUser, currentPersonnel, yearlyConfig, selectedOfiForDetail, isAdmin)
    : 'VIEW';

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '4rem' }}>
      {/* Feedback Toast */}
      {feedback && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
            background:
              feedback.type === 'success'
                ? '#ECFDF5'
                : feedback.type === 'error'
                ? '#FEF2F2'
                : '#EFF6FF',
            color:
              feedback.type === 'success'
                ? '#065F46'
                : feedback.type === 'error'
                ? '#991B1B'
                : '#1E40AF',
            border: `1.5px solid ${
              feedback.type === 'success'
                ? '#A7F3D0'
                : feedback.type === 'error'
                ? '#FECACA'
                : '#BFDBFE'
            }`,
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {feedback.type === 'success' && <CheckCircle2 size={18} color="#059669" />}
          {feedback.type === 'error' && <AlertCircle size={18} color="#DC2626" />}
          {feedback.type === 'info' && <HelpCircle size={18} color="#2563EB" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header / Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #7C3AED 100%)',
          color: '#FFFFFF',
          padding: '2.25rem 1.5rem 3rem',
          boxShadow: '0 4px 20px -2px rgba(109, 40, 217, 0.25)',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Top Bar: Back & User Role */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <Link
              href="/ims"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#E9D5FF',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
              }}
            >
              <ArrowLeft size={16} />
              <span>กลับหน้าหลัก IMS</span>
            </Link>

            {/* Role indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.825rem',
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '6px 14px',
                borderRadius: '999px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Shield size={14} color="#DDD6FE" />
              <span>สิทธิ์ของคุณ:</span>
              <strong style={{ color: '#F5D0FE' }}>
                {isAdmin
                  ? 'ผู้ดูแลระบบ (Admin)'
                  : isDcc
                  ? 'DCC (ผู้บริหารเอกสาร)'
                  : isMr
                  ? 'MR (ตัวแทนฝ่ายบริหาร)'
                  : currentPersonnel?.name
                  ? `${currentPersonnel.name} (ผู้ใช้งาน)`
                  : 'ผู้เข้าชม (View only)'}
              </strong>
            </div>
          </div>

          {/* Title and Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(6px)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
                }}
              >
                <Lightbulb size={32} color="#FDE047" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1
                    style={{
                      fontSize: '1.85rem',
                      fontWeight: 800,
                      margin: 0,
                      letterSpacing: '-0.02em',
                      color: '#FFFFFF',
                    }}
                  >
                    OFI Hub
                  </h1>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: '#A855F7',
                      color: '#FFFFFF',
                      fontWeight: 700,
                    }}
                  >
                    Opportunity for Improvement
                  </span>
                </div>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.95rem',
                    color: '#E9D5FF',
                    fontWeight: 400,
                  }}
                >
                  ศูนย์ติดตามโอกาสในการพัฒนา จากรายงานการตรวจติดตามภายใน (Internal Audit)
                </p>
              </div>
            </div>

            {/* Controls: Year Selector + Sync Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              {/* Year Dropdown */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <Calendar size={18} color="#DDD6FE" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E9D5FF' }}>
                  ปีงบประมาณ:
                </span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{
                    background: '#FFFFFF',
                    color: '#4C1D95',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sync Button (DCC / MR / Admin) */}
              {canSync && (
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={isSyncing}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    color: '#6D28D9',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.2s',
                    opacity: isSyncing ? 0.7 : 1,
                  }}
                  title={`ดึงข้อมูล OFI จาก Internal Audit ปี ${selectedYear} (พบ ${availableIaOfiCount} รายการ)`}
                >
                  <RefreshCw
                    size={17}
                    style={{
                      animation: isSyncing ? 'spin 1s linear infinite' : 'none',
                    }}
                  />
                  <span>
                    {isSyncing
                      ? 'กำลังซิงค์...'
                      : `Sync จาก Internal Audit (${availableIaOfiCount})`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '-1.5rem auto 0',
          padding: '0 1.5rem',
        }}
      >
        {/* Yearly Team & Auditor Banner */}
        <div
          style={{
            background: yearlyConfig?._isConfigured ? '#FAF5FF' : '#FFFBEB',
            border: `1px solid ${yearlyConfig?._isConfigured ? '#E9D5FF' : '#FDE68A'}`,
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: yearlyConfig?._isConfigured ? '#6B21A8' : '#92400E',
            }}
          >
            <Users size={17} />
            {yearlyConfig?._isConfigured ? (
              <span>
                <strong>ผู้รับผิดชอบระบบ IMS ปีงบประมาณ {selectedYear}:</strong>{' '}
                {yearlyConfig?.mrName && (
                  <>
                    MR (ตัวแทนฝ่ายบริหาร) คือ <strong>{yearlyConfig.mrName}</strong> &bull;{' '}
                  </>
                )}
                DCC (ผู้ควบคุมเอกสาร) คือ{' '}
                <strong>{yearlyConfig?.dccName || '-'}</strong>
                {yearlyConfig?.leadAuditorName && (
                  <> &bull; Lead IA: <strong>{yearlyConfig.leadAuditorName}</strong></>
                )}
                {yearlyConfig?.auditors && yearlyConfig.auditors.length > 0
                  ? ` • ผู้ตรวจ ${yearlyConfig.auditors.length} ท่าน`
                  : ''}
              </span>
            ) : (
              <span>
                <strong>ปีงบประมาณ {selectedYear}:</strong>{' '}
                <span style={{ color: '#B45309' }}>
                  ยังไม่ได้กำหนดคณะผู้ตรวจติดตามและผู้รับผิดชอบ — ข้อมูลจะเชื่อมโยงอัตโนมัติจาก Internal Audit
                </span>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {yearlyConfig?.appointmentOrderUrl && (
              <a
                href={yearlyConfig.appointmentOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="เปิดดูคำสั่งแต่งตั้ง (Google Drive)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#6B21A8',
                  background: '#EDE9FE',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  border: '1px solid #DDD6FE',
                  transition: 'all 0.2s ease',
                }}
              >
                <ExternalLink size={13} />
                <span>คำสั่งแต่งตั้ง</span>
              </a>
            )}
          </div>
        </div>

        {/* Minimal Dashboard Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Card 1: Total OFI */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748B' }}>
                OFI ทั้งหมด ({selectedYear})
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#F3E8FF',
                  color: '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lightbulb size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>
              {metrics.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              รายการโอกาสในการพัฒนา
            </div>
          </div>

          {/* Card 2: Implement YES */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#059669' }}>
                ตกลงดำเนินการ (Yes)
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
              {metrics.implementYes}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669' }}>
              {metrics.total > 0
                ? `${Math.round((metrics.implementYes / metrics.total) * 100)}% ของทั้งหมด`
                : '-'}
            </div>
          </div>

          {/* Card 3: Implement NO */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#DC2626' }}>
                ไม่ดำเนินการ (No)
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626' }}>
              {metrics.implementNo}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              บันทึกเหตุผลในหมายเหตุ
            </div>
          </div>

          {/* Card 4: Pending Decision */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#D97706' }}>
                รอการพิจารณา
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#FFFBEB',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HelpCircle size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706' }}>
              {metrics.implementPending}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              ยังไม่ระบุ Yes / No
            </div>
          </div>

          {/* Card 5: On Process */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#2563EB' }}>
                กำลังดำเนินการ
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563EB' }}>
              {metrics.onProcess}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              On Process
            </div>
          </div>

          {/* Card 6: Completed */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#059669' }}>
                เสร็จสิ้นสมบูรณ์
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
              {metrics.completed}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Completed
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '1.25rem',
            border: '1px solid #E2E8F0',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        >
          {/* Search Input */}
          <div
            style={{
              flex: '1 1 260px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={18}
              color="#94A3B8"
              style={{ position: 'absolute', left: '12px' }}
            />
            <input
              type="text"
              placeholder="ค้นหา หัวข้อ, ข้อกำหนด, ข้อค้นพบ, ผู้รับผิดชอบ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.4rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter: Implement */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748B' }}>
              Implement:
            </span>
            <select
              value={implementFilter}
              onChange={(e) => setImplementFilter(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="YES">Yes (ดำเนินการ)</option>
              <option value="NO">No (ไม่ดำเนินการ)</option>
              <option value="PENDING">ยังไม่ระบุ</option>
            </select>
          </div>

          {/* Filter: Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748B' }}>
              สถานะ:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="ON_PROCESS">กำลังดำเนินการ (On Process)</option>
              <option value="COMPLETED">เสร็จสิ้น (Completed)</option>
            </select>
          </div>

          {/* Filter: Department */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748B' }}>
              ฝ่าย:
            </span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: '#FFFFFF',
                color: '#334155',
                cursor: 'pointer',
                maxWidth: '180px',
              }}
            >
              <option value="ALL">ทุกฝ่าย</option>
              {PREDEFINED_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(searchQuery ||
            implementFilter !== 'ALL' ||
            statusFilter !== 'ALL' ||
            departmentFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setImplementFilter('ALL');
                setStatusFilter('ALL');
                setDepartmentFilter('ALL');
              }}
              style={{
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '8px',
                padding: '0.55rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* Main Table Container */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Table Header / Action Info */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              background: '#FAF5FF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#7C3AED" />
              <span style={{ fontWeight: 700, color: '#4C1D95', fontSize: '1rem' }}>
                รายการ Opportunity for Improvement (OFI)
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#EDE9FE',
                  color: '#6D28D9',
                }}
              >
                {filteredItems.length} รายการ
              </span>
            </div>

            {/* Permission Guide Note */}
            <div
              style={{
                fontSize: '0.78rem',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ShieldCheck size={14} color="#7C3AED" />
              <span>
                <strong>สิทธิ์การกำหนด:</strong> DCC มอบหมายฝ่าย/ผู้รับผิดชอบ • DCC/MR กำหนดการ Implement/สถานะ/หมายเหตุ • ผู้รับผิดชอบแก้ไขรายละเอียดได้
              </span>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              <RefreshCw
                size={28}
                style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: '#7C3AED' }}
              />
              <p>กำลังโหลดข้อมูล OFI...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#F3E8FF',
                  color: '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <Lightbulb size={32} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', margin: '0 0 0.5rem 0' }}>
                {yearOfiItems.length === 0
                  ? `ยังไม่มีข้อมูล OFI ในปีงบประมาณ ${selectedYear}`
                  : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0 0 1.5rem 0', maxWidth: '480px', marginInline: 'auto' }}>
                {yearOfiItems.length === 0
                  ? canSync
                    ? `คุณสามารถกดปุ่ม "Sync จาก Internal Audit" เพื่อดึงข้อค้นพบประเภท OFI จากรายงานการตรวจติดตาม ปี ${selectedYear}`
                    : 'ติดต่อ DCC หรือ MR เพื่อทำการ Sync ข้อมูลจากรายงานการตรวจติดตามภายใน'
                  : 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองเพื่อดูรายการทั้งหมด'}
              </p>
              {canSync && yearOfiItems.length === 0 && (
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={isSyncing}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <RefreshCw size={16} />
                  <span>Sync ข้อมูลเดี๋ยวนี้ ({availableIaOfiCount} รายการ)</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: '#F8FAFC',
                      color: '#475569',
                      fontWeight: 700,
                      borderBottom: '2px solid #E2E8F0',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    <th style={{ padding: '0.85rem 1rem', width: '50px', textAlign: 'center' }}>
                      #
                    </th>
                    <th style={{ padding: '0.85rem 1rem', width: '220px' }}>
                      หัวข้อ / ข้อกำหนด
                    </th>
                    <th style={{ padding: '0.85rem 1rem', minWidth: '220px' }}>
                      ข้อค้นพบ (Opportunity)
                    </th>
                    <th style={{ padding: '0.85rem 1rem', width: '130px', textAlign: 'center' }}>
                      Implement?
                    </th>
                    <th style={{ padding: '0.85rem 1rem', width: '160px', textAlign: 'center' }}>
                      Status
                    </th>
                    <th style={{ padding: '0.85rem 1rem', width: '180px' }}>
                      ฝ่ายที่เกี่ยวข้อง
                    </th>
                    <th style={{ padding: '0.85rem 1rem', width: '190px' }}>
                      ผู้รับผิดชอบ
                    </th>
                    <th style={{ padding: '0.85rem 1rem', minWidth: '160px' }}>
                      หมายเหตุ
                    </th>
                    <th style={{ padding: '0.85rem 1rem', width: '110px', textAlign: 'center' }}>
                      Details
                    </th>
                    {canEditDccFields && (
                      <th style={{ padding: '0.85rem 0.75rem', width: '45px', textAlign: 'center' }}>
                        ลบ
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody style={{ divideY: '1px solid #F1F5F9' }}>
                  {filteredItems.map((item, idx) => {
                    const itemPerm = getOfiEditPermission(
                      currentUser,
                      currentPersonnel,
                      yearlyConfig,
                      item,
                      isAdmin
                    );
                    const canEditDccOrMr = itemPerm === 'FULL' || itemPerm === 'MR';
                    const hasDetails = Boolean(item.detailsHtml && item.detailsHtml.trim());

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF5FF')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                      >
                        {/* 1. Index */}
                        <td
                          style={{
                            padding: '1rem 0.5rem',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: '#64748B',
                            fontSize: '0.85rem',
                          }}
                        >
                          {idx + 1}
                        </td>

                        {/* 2. Topic & Clauses */}
                        <td style={{ padding: '1rem' }}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: '#0F172A',
                              marginBottom: '4px',
                              lineHeight: 1.4,
                            }}
                          >
                            {item.sourceAuditTopic || '-'}
                          </div>
                          {item.sourceClauses && (
                            <div
                              style={{
                                fontSize: '0.775rem',
                                color: '#6D28D9',
                                background: '#EDE9FE',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                fontWeight: 600,
                              }}
                            >
                              ข้อ {item.sourceClauses}
                            </div>
                          )}
                          {item.sourceStandard && (
                            <div
                              style={{
                                fontSize: '0.725rem',
                                color: '#64748B',
                                marginTop: '4px',
                              }}
                            >
                              {item.sourceStandard}
                            </div>
                          )}
                        </td>

                        {/* 3. Findings */}
                        <td style={{ padding: '1rem' }}>
                          <p
                            style={{
                              margin: 0,
                              color: '#334155',
                              fontSize: '0.85rem',
                              lineHeight: 1.5,
                              whiteSpace: 'pre-line',
                            }}
                          >
                            {item.sourceFindings || '-'}
                          </p>
                        </td>

                        {/* 4. Implement? (Yes / No / Pending) */}
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {canEditDccOrMr ? (
                            <select
                              value={item.implement || ''}
                              onChange={(e) => handleImplementChange(item, e.target.value)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                fontSize: '0.825rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: '1.5px solid',
                                background:
                                  item.implement === 'YES'
                                    ? '#ECFDF5'
                                    : item.implement === 'NO'
                                    ? '#FEF2F2'
                                    : '#F8FAFC',
                                color:
                                  item.implement === 'YES'
                                    ? '#059669'
                                    : item.implement === 'NO'
                                    ? '#DC2626'
                                    : '#64748B',
                                borderColor:
                                  item.implement === 'YES'
                                    ? '#A7F3D0'
                                    : item.implement === 'NO'
                                    ? '#FECACA'
                                    : '#CBD5E1',
                              }}
                            >
                              <option value="">-- ระบุ --</option>
                              <option value="YES">Yes</option>
                              <option value="NO">No</option>
                            </select>
                          ) : (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.825rem',
                                fontWeight: 700,
                                background:
                                  item.implement === 'YES'
                                    ? '#ECFDF5'
                                    : item.implement === 'NO'
                                    ? '#FEF2F2'
                                    : '#F1F5F9',
                                color:
                                  item.implement === 'YES'
                                    ? '#059669'
                                    : item.implement === 'NO'
                                    ? '#DC2626'
                                    : '#64748B',
                                border: `1px solid ${
                                  item.implement === 'YES'
                                    ? '#A7F3D0'
                                    : item.implement === 'NO'
                                    ? '#FECACA'
                                    : '#E2E8F0'
                                }`,
                              }}
                            >
                              {item.implement === 'YES'
                                ? 'Yes'
                                : item.implement === 'NO'
                                ? 'No'
                                : '-'}
                            </span>
                          )}
                        </td>

                        {/* 5. Status (On Process / Completed / "-") */}
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {item.implement === 'YES' ? (
                            canEditDccOrMr ? (
                              <select
                                value={item.status || OFI_STATUS_OPTIONS.ON_PROCESS}
                                onChange={(e) => handleStatusChange(item, e.target.value)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.825rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  border: '1.5px solid',
                                  background:
                                    item.status === 'COMPLETED'
                                      ? OFI_STATUS_CONFIG.COMPLETED.bg
                                      : OFI_STATUS_CONFIG.ON_PROCESS.bg,
                                  color:
                                    item.status === 'COMPLETED'
                                      ? OFI_STATUS_CONFIG.COMPLETED.color
                                      : OFI_STATUS_CONFIG.ON_PROCESS.color,
                                  borderColor:
                                    item.status === 'COMPLETED'
                                      ? OFI_STATUS_CONFIG.COMPLETED.border
                                      : OFI_STATUS_CONFIG.ON_PROCESS.border,
                                }}
                              >
                                <option value={OFI_STATUS_OPTIONS.ON_PROCESS}>
                                  กำลังดำเนินการ
                                </option>
                                <option value={OFI_STATUS_OPTIONS.COMPLETED}>
                                  เสร็จสิ้น
                                </option>
                              </select>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  background:
                                    item.status === 'COMPLETED'
                                      ? OFI_STATUS_CONFIG.COMPLETED.bg
                                      : OFI_STATUS_CONFIG.ON_PROCESS.bg,
                                  color:
                                    item.status === 'COMPLETED'
                                      ? OFI_STATUS_CONFIG.COMPLETED.color
                                      : OFI_STATUS_CONFIG.ON_PROCESS.color,
                                  border: `1px solid ${
                                    item.status === 'COMPLETED'
                                      ? OFI_STATUS_CONFIG.COMPLETED.border
                                      : OFI_STATUS_CONFIG.ON_PROCESS.border
                                  }`,
                                }}
                              >
                                {item.status === 'COMPLETED'
                                  ? 'เสร็จสิ้น'
                                  : 'กำลังดำเนินการ'}
                              </span>
                            )
                          ) : (
                            <span
                              style={{
                                color: '#94A3B8',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                              }}
                            >
                              -
                            </span>
                          )}
                        </td>

                        {/* 6. ฝ่ายที่เกี่ยวข้อง (Multi-select: DCC only) */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {item.departments && item.departments.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {item.departments.map((dept, dIdx) => (
                                  <span
                                    key={dIdx}
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      background: '#F1F5F9',
                                      color: '#334155',
                                      border: '1px solid #E2E8F0',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {dept}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                                ยังไม่ระบุฝ่าย
                              </span>
                            )}

                            {canEditDccFields && (
                              <button
                                type="button"
                                onClick={() => openAssignmentModal(item, 'departments')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: '#7C3AED',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginTop: '2px',
                                }}
                              >
                                <Edit3 size={11} />
                                <span>{item.departments?.length ? 'แก้ไขฝ่าย' : '+ กำหนดฝ่าย'}</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 7. ผู้รับผิดชอบ (Multi-select: DCC only) */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {item.assignees && item.assignees.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {item.assignees.map((assignee, aIdx) => (
                                  <span
                                    key={aIdx}
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      background: '#EDE9FE',
                                      color: '#6D28D9',
                                      border: '1px solid #DDD6FE',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {assignee.name || assignee.email}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                                ยังไม่ระบุผู้รับผิดชอบ
                              </span>
                            )}

                            {canEditDccFields && (
                              <button
                                type="button"
                                onClick={() => openAssignmentModal(item, 'assignees')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: '#7C3AED',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginTop: '2px',
                                }}
                              >
                                <Users size={11} />
                                <span>{item.assignees?.length ? 'แก้ไขผู้รับผิดชอบ' : '+ มอบหมาย'}</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 8. หมายเหตุ (Remark) */}
                        <td style={{ padding: '1rem' }}>
                          {canEditDccOrMr ? (
                            <input
                              type="text"
                              defaultValue={item.remark || ''}
                              onBlur={(e) => {
                                if (e.target.value !== (item.remark || '')) {
                                  handleRemarkChange(item, e.target.value);
                                }
                              }}
                              placeholder="ระบุหมายเหตุ..."
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.825rem',
                                outline: 'none',
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: '0.825rem', color: item.remark ? '#334155' : '#94A3B8' }}>
                              {item.remark || '-'}
                            </span>
                          )}
                        </td>

                        {/* 9. Details Button */}
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => openDetailModal(item)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: hasDetails ? '#7C3AED' : '#F3E8FF',
                              color: hasDetails ? '#FFFFFF' : '#6D28D9',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              boxShadow: hasDetails ? '0 2px 4px rgba(124, 58, 237, 0.25)' : 'none',
                            }}
                            title={hasDetails ? 'มีข้อมูลรายละเอียด (คลิกเพื่อดู/แก้ไข)' : 'คลิกเพื่อดูหรือกรอกรายละเอียด'}
                          >
                            <FileText size={14} />
                            <span>Details</span>
                          </button>
                        </td>

                        {/* 10. Delete (DCC / Admin) */}
                        {canEditDccFields && (
                          <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94A3B8',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '6px',
                                transition: 'color 0.15s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                              title="ลบรายการ OFI นี้"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal (DCC-only assignment of Departments or Assignees) */}
      {assigningOfi && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '1.25rem',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FAF5FF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {assignmentType === 'departments' ? (
                  <Building size={20} color="#7C3AED" />
                ) : (
                  <Users size={20} color="#7C3AED" />
                )}
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#4C1D95' }}>
                  {assignmentType === 'departments'
                    ? 'กำหนดฝ่ายที่เกี่ยวข้อง'
                    : 'กำหนดผู้รับผิดชอบ (Assignees)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningOfi(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Target Item Info */}
            <div style={{ padding: '0.85rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: '#1E293B' }}>
                {assigningOfi.sourceAuditTopic}
              </div>
              {assigningOfi.sourceClauses && (
                <div style={{ color: '#64748B', fontSize: '0.775rem' }}>
                  ข้อกำหนด: {assigningOfi.sourceClauses}
                </div>
              )}
            </div>

            {/* Content Selection List */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {assignmentType === 'departments' ? (
                /* Departments Checkbox List */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem', color: '#64748B' }}>
                    เลือกฝ่ายที่เกี่ยวข้องกับ OFI นี้ (สามารถเลือกได้มากกว่า 1 ฝ่าย):
                  </p>
                  {PREDEFINED_DEPARTMENTS.map((dept) => {
                    const isChecked = tempSelection.includes(dept);
                    return (
                      <label
                        key={dept}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${isChecked ? '#7C3AED' : '#E2E8F0'}`,
                          background: isChecked ? '#FAF5FF' : '#FFFFFF',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: isChecked ? 700 : 500,
                          color: isChecked ? '#6D28D9' : '#334155',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setTempSelection((prev) =>
                              prev.includes(dept)
                                ? prev.filter((d) => d !== dept)
                                : [...prev, dept]
                            );
                          }}
                          style={{ accentColor: '#7C3AED', width: '16px', height: '16px' }}
                        />
                        <span>{dept}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                /* Assignees (Personnel) Multi-Select */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748B' }}>
                    เลือกผู้รับผิดชอบดำเนินการ (สามารถเลือกได้มากกว่า 1 คน — ผู้รับผิดชอบจะมีสิทธิ์เข้ามากรอกรายละเอียด):
                  </p>

                  {/* Search personnel */}
                  <div style={{ position: 'relative' }}>
                    <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ หรือฝ่ายของบุคลากร..."
                      value={personnelSearch}
                      onChange={(e) => setPersonnelSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Selected summary */}
                  <div style={{ fontSize: '0.8rem', color: '#7C3AED', fontWeight: 600 }}>
                    เลือกแล้ว {tempSelection.length} คน
                  </div>

                  {/* Personnel List */}
                  <div
                    style={{
                      maxHeight: '260px',
                      overflowY: 'auto',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {personnelList
                      .filter((p) => {
                        if (!personnelSearch.trim()) return true;
                        const q = personnelSearch.toLowerCase();
                        return (
                          (p.name || '').toLowerCase().includes(q) ||
                          (p.department || '').toLowerCase().includes(q) ||
                          (p.email || '').toLowerCase().includes(q)
                        );
                      })
                      .map((person) => {
                        const isChecked = tempSelection.includes(person.id);
                        return (
                          <label
                            key={person.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '6px',
                              border: `1px solid ${isChecked ? '#DDD6FE' : 'transparent'}`,
                              background: isChecked ? '#FAF5FF' : 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setTempSelection((prev) =>
                                    prev.includes(person.id)
                                      ? prev.filter((id) => id !== person.id)
                                      : [...prev, person.id]
                                  );
                                }}
                                style={{ accentColor: '#7C3AED', width: '15px', height: '15px' }}
                              />
                              <div>
                                <div style={{ fontWeight: 600, color: '#1E293B' }}>
                                  {person.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                  {person.department || 'ไม่ระบุฝ่าย'} {person.email ? `• ${person.email}` : ''}
                                </div>
                              </div>
                            </div>
                            {isChecked && <Check size={16} color="#7C3AED" />}
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                background: '#F8FAFC',
              }}
            >
              <button
                type="button"
                onClick={() => setAssigningOfi(null)}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveAssignment}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                บันทึกการมอบหมาย
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFI WYSIWYG Detail Modal */}
      <OfiDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOfiForDetail(null);
        }}
        ofiItem={selectedOfiForDetail}
        onSave={handleSaveDetails}
        editPermission={currentOfiPermission}
      />
    </div>
  );
}
