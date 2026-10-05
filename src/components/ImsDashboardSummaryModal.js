'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  X,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  AlertOctagon,
  ArrowRight,
  Calendar,
  User,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { formatDateDDMMYYYYBE, getAvailableFiscalYears } from '@/lib/dateUtils';

export default function ImsDashboardSummaryModal({
  isOpen,
  onClose,
  initialTab = 'ALL',
  audits = [],
  carIncidents = [],
  ofiItems = [],
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const availableYears = useMemo(() => getAvailableFiscalYears(2568, 1, true), []);

  // Sync initialTab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'ALL');
      setSearchTerm('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Filter raw lists by selected fiscal year
  const yearFilteredAudits = audits.filter((a) => {
    if (selectedYear === 'ALL') return true;
    const y = String(a.auditYear || a.fiscalYear || a.year || '');
    return y === selectedYear;
  });

  const yearFilteredCars = carIncidents.filter((c) => {
    if (selectedYear === 'ALL') return true;
    const y = String(c.fiscalYear || c.year || '');
    return y === selectedYear;
  });

  const totalAudits = yearFilteredAudits.length;
  const completedAudits = yearFilteredAudits.filter((a) => a.status === 'COMPLETED');
  const cAudits = yearFilteredAudits.filter((a) => a.result === 'C');
  const ncAudits = yearFilteredAudits.filter((a) => a.result === 'NC');
  const ofiAudits = yearFilteredAudits.filter((a) => a.result === 'OFI');
  const totalCars = yearFilteredCars.length;

  // Filter items based on activeTab
  let currentList = [];
  if (activeTab === 'ALL') {
    currentList = yearFilteredAudits;
  } else if (activeTab === 'COMPLETED') {
    currentList = completedAudits;
  } else if (activeTab === 'C') {
    currentList = cAudits;
  } else if (activeTab === 'NC') {
    currentList = ncAudits;
  } else if (activeTab === 'OFI') {
    currentList = ofiAudits;
  } else if (activeTab === 'CAR') {
    currentList = yearFilteredCars;
  }

  // Search filter
  const filteredList = currentList.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.topic || '').toLowerCase().includes(term) ||
      (item.topicName || '').toLowerCase().includes(term) ||
      (item.item || '').toLowerCase().includes(term) ||
      (item.clauses || '').toLowerCase().includes(term) ||
      (item.auditorName || '').toLowerCase().includes(term) ||
      (item.auditeeName || '').toLowerCase().includes(term) ||
      (item.details || '').toLowerCase().includes(term) ||
      (item.carNumber || '').toLowerCase().includes(term) ||
      (item.title || '').toLowerCase().includes(term)
    );
  });

  const getResultBadge = (result) => {
    if (result === 'C') {
      return (
        <span
          style={{
            padding: '3px 8px',
            borderRadius: '999px',
            background: '#ECFDF5',
            color: '#059669',
            border: '1px solid #A7F3D0',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <CheckCircle2 size={12} />
          <span>C (สอดคล้อง)</span>
        </span>
      );
    }
    if (result === 'NC') {
      return (
        <span
          style={{
            padding: '3px 8px',
            borderRadius: '999px',
            background: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FECACA',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <AlertTriangle size={12} />
          <span>NC (ไม่สอดคล้อง)</span>
        </span>
      );
    }
    if (result === 'OFI') {
      return (
        <span
          style={{
            padding: '3px 8px',
            borderRadius: '999px',
            background: '#FFFBEB',
            color: '#D97706',
            border: '1px solid #FDE68A',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Lightbulb size={12} />
          <span>OFI (ข้อเสนอแนะ)</span>
        </span>
      );
    }
    return (
      <span
        style={{
          padding: '3px 8px',
          borderRadius: '999px',
          background: '#F1F5F9',
          color: '#64748B',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        ยังไม่ระบุผล
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === 'COMPLETED') {
      return (
        <span
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            background: '#ECFDF5',
            color: '#059669',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          เสร็จสิ้นแล้ว
        </span>
      );
    }
    if (status === 'READY_FOR_AUDIT' || status === 'IN_PROGRESS') {
      return (
        <span
          style={{
            padding: '3px 8px',
            borderRadius: '6px',
            background: '#EFF6FF',
            color: '#2563EB',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          พร้อมตรวจ / กำลังตรวจ
        </span>
      );
    }
    return (
      <span
        style={{
          padding: '3px 8px',
          borderRadius: '6px',
          background: '#FFFBEB',
          color: '#D97706',
          fontSize: '0.75rem',
          fontWeight: 700,
        }}
      >
        ร่าง / รออนุมัติ
      </span>
    );
  };

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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '1.25rem',
          width: '100%',
          maxWidth: '880px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.2s ease-out',
        }}
      >
        <style>{`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.97) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(249, 115, 22, 0.25)',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FB923C',
              }}
            >
              <FileCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                สรุปข้อมูลผลการตรวจติดตาม IMS
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#FED7AA', marginTop: '2px' }}>
                ข้อมูลเรียลไทม์จากระบบรายงานการตรวจติดตามภายใน (Internal Audit Report)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters and Year Selector Toolbar */}
        <div
          style={{
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              style={{
                padding: '5px 11px',
                borderRadius: '8px',
                border: activeTab === 'ALL' ? '1.5px solid #F97316' : '1px solid #CBD5E1',
                background: activeTab === 'ALL' ? '#FFF7ED' : '#FFFFFF',
                color: activeTab === 'ALL' ? '#EA580C' : '#475569',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'ALL' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              ทั้งหมด ({totalAudits})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('COMPLETED')}
              style={{
                padding: '5px 11px',
                borderRadius: '8px',
                border: activeTab === 'COMPLETED' ? '1.5px solid #10B981' : '1px solid #CBD5E1',
                background: activeTab === 'COMPLETED' ? '#ECFDF5' : '#FFFFFF',
                color: activeTab === 'COMPLETED' ? '#059669' : '#475569',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'COMPLETED' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              ตรวจเสร็จสิ้น ({completedAudits.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('C')}
              style={{
                padding: '5px 11px',
                borderRadius: '8px',
                border: activeTab === 'C' ? '1.5px solid #10B981' : '1px solid #CBD5E1',
                background: activeTab === 'C' ? '#ECFDF5' : '#FFFFFF',
                color: activeTab === 'C' ? '#059669' : '#475569',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'C' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              สอดคล้อง C ({cAudits.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('NC')}
              style={{
                padding: '5px 11px',
                borderRadius: '8px',
                border: activeTab === 'NC' ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                background: activeTab === 'NC' ? '#FEF2F2' : '#FFFFFF',
                color: activeTab === 'NC' ? '#DC2626' : '#475569',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'NC' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              ไม่สอดคล้อง NC ({ncAudits.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('OFI')}
              style={{
                padding: '5px 11px',
                borderRadius: '8px',
                border: activeTab === 'OFI' ? '1.5px solid #F59E0B' : '1px solid #CBD5E1',
                background: activeTab === 'OFI' ? '#FFFBEB' : '#FFFFFF',
                color: activeTab === 'OFI' ? '#D97706' : '#475569',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'OFI' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              ข้อเสนอแนะ OFI ({ofiAudits.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CAR')}
              style={{
                padding: '5px 11px',
                borderRadius: '8px',
                border: activeTab === 'CAR' ? '1.5px solid #8B5CF6' : '1px solid #CBD5E1',
                background: activeTab === 'CAR' ? '#F5F3FF' : '#FFFFFF',
                color: activeTab === 'CAR' ? '#7C3AED' : '#475569',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'CAR' ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              CAR/Incident ({totalCars})
            </button>
          </div>

          {/* Year Filter and Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Fiscal Year Filter Dropdown */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FFFFFF',
                border: '1.5px solid #FFEDD5',
                borderRadius: '8px',
                padding: '3px 8px',
              }}
            >
              <Calendar size={14} color="#EA580C" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9A3412', whiteSpace: 'nowrap' }}>
                ปีงบ:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#9A3412',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">ทุกปี (ทั้งหมด)</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '4px 10px',
                width: '180px',
              }}
            >
              <Search size={14} color="#94A3B8" />
              <input
                type="text"
                placeholder="ค้นหา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.8rem',
                  width: '100%',
                  background: 'transparent',
                }}
              />
            </div>
          </div>
        </div>

        {/* Modal Body / Items List */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Informational Banner for NC / CAR connection */}
          {activeTab === 'NC' && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.825rem',
                color: '#991B1B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color="#DC2626" />
                <span>
                  <strong>ข้อสังเกต:</strong> ผลตรวจแบบ NC (Non-Conformity) เป็นข้อค้นพบที่ตรวจพบในรายงาน Internal Audit เพื่อนำไปเปิดใบ CAR ในระบบ <strong>CAR &amp; Incident Hub</strong> ต่อไป
                </span>
              </div>
              <Link
                href="/ims/car-incident"
                style={{
                  color: '#DC2626',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  whiteSpace: 'nowrap',
                }}
              >
                ไปหน้า CAR Hub &rarr;
              </Link>
            </div>
          )}

          {activeTab === 'CAR' && (
            <div
              style={{
                background: '#F5F3FF',
                border: '1px solid #DDD6FE',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.825rem',
                color: '#5B21B6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#7C3AED" />
                <span>
                  <strong>สถานะ CAR &amp; Incident:</strong> {selectedYear === 'ALL' ? 'รวมทุกปีงบประมาณ' : `ปีงบประมาณ ${selectedYear}`} มีเอกสาร CAR/Incident ในระบบทั้งหมด <strong>{totalCars}</strong> รายการ
                </span>
              </div>
              <Link
                href="/ims/car-incident"
                style={{
                  color: '#7C3AED',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  whiteSpace: 'nowrap',
                }}
              >
                เปิดระบบ CAR &amp; Incident &rarr;
              </Link>
            </div>
          )}

          {filteredList.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#64748B',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px dashed #CBD5E1',
              }}
            >
              <FileCheck size={40} color="#94A3B8" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#334155' }}>
                ไม่พบรายการข้อมูลในหมวดนี้ {selectedYear !== 'ALL' ? `(ปีงบประมาณ ${selectedYear})` : ''}
              </div>
              <div style={{ fontSize: '0.825rem', marginTop: '4px' }}>
                {activeTab === 'CAR'
                  ? 'ยังไม่มีการสร้างเอกสารใบ CAR / Incident ในระบบสำหรับเงื่อนไขนี้'
                  : 'ยังไม่มีรายงานการตรวจติดตามที่ตรงกับเงื่อนไข'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredList.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#F97316';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#EA580C',
                            background: '#FFF7ED',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid #FFEDD5',
                          }}
                        >
                          ปีงบประมาณ {item.auditYear || item.fiscalYear || item.year || '-'}
                        </span>
                        {item.clauses && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: '#475569',
                              background: '#F1F5F9',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            ข้อกำหนด {item.clauses}
                          </span>
                        )}
                        {getStatusBadge(item.status)}
                        {getResultBadge(item.result || item.findingType)}
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginTop: '4px' }}>
                        {item.topic || item.topicName || item.title || 'รายการตรวจติดตาม'}
                      </div>

                      {item.item && (
                        <div style={{ fontSize: '0.85rem', color: '#0284C7', fontWeight: 600, marginTop: '2px' }}>
                          ข้อตรวจ: {item.item}
                        </div>
                      )}

                      {item.details && (
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: '#64748B',
                            marginTop: '4px',
                            lineHeight: 1.5,
                          }}
                        >
                          {item.details}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: '0.5rem',
                      marginTop: '0.25rem',
                      fontSize: '0.8rem',
                      color: '#64748B',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      {item.auditorName || item.auditor1Name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={13} color="#94A3B8" />
                          <span>ผู้ตรวจ: <strong>{item.auditorName || item.auditor1Name}</strong></span>
                        </div>
                      ) : null}
                      {item.auditDate || item.date || item.createdAt ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} color="#94A3B8" />
                          <span>วันที่ตรวจ: <strong>{formatDateDDMMYYYYBE(item.auditDate || item.date || item.createdAt)}</strong></span>
                        </div>
                      ) : null}
                    </div>

                    <Link
                      href={activeTab === 'CAR' ? '/ims/car-incident' : activeTab === 'OFI' ? '/ims/ofi-hub' : '/ims/audit'}
                      onClick={onClose}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#EA580C',
                        fontWeight: 700,
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span>ดูรายละเอียดในระบบ</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.825rem', color: '#64748B' }}>
            แสดงผล <strong>{filteredList.length}</strong> รายการ {selectedYear !== 'ALL' ? `(ปีงบประมาณ ${selectedYear})` : '(ทุกปีงบประมาณ)'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href="/ims/audit"
              onClick={onClose}
              className="btn btn-secondary"
              style={{
                fontSize: '0.85rem',
                padding: '0.5rem 1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
              }}
            >
              <span>ไปหน้ารายงานการตรวจติดตาม</span>
              <ArrowRight size={14} />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{
                fontSize: '0.85rem',
                padding: '0.5rem 1.25rem',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
