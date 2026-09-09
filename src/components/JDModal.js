'use client';

import React, { useState, useEffect } from 'react';
import { formatImageDisplayUrl, isGoogleDriveUrl } from '@/lib/driveUtils';
import { KMUTNB_CORE_COMPETENCIES, createBlankJD } from '@/lib/jdTemplateData';
import { PREDEFINED_DEPARTMENTS, POSITIONS, POSITION_LEVELS, PERSONNEL_TYPES } from '@/lib/constants';
import {
  X,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Building2,
  User,
  Layers,
  Award,
  BookOpen,
  Send,
  ExternalLink,
} from 'lucide-react';

const TABS = [
  { id: 'job_info', label: '1. ข้อมูลตำแหน่ง & ผังสายงาน', icon: User },
  { id: 'summary', label: '2. สรุปหน้าที่ (Summary)', icon: Layers },
  { id: 'responsibilities', label: '3. หน้าที่ความรับผิดชอบหลัก', icon: Award },
  { id: 'relationships', label: '4. การทำงานร่วมหน่วยงานอื่น', icon: Building2 },
  { id: 'qualifications', label: '5. คุณสมบัติ & ทักษะ', icon: BookOpen },
  { id: 'competencies', label: '6-7. สมรรถนะหลัก & ประจำตำแหน่ง', icon: Award },
  { id: 'training_signatures', label: '8. การฝึกอบรม & ลงนาม', icon: Send },
];

export default function JDModal({
  isOpen,
  onClose,
  onSave,
  onConfirm,
  jdToEdit = null,
  personnelList = [],
  currentPersonnel = null,
  isAdmin = false,
  isRevisionOpen = true,
}) {
  const [activeTab, setActiveTab] = useState('job_info');
  const [formData, setFormData] = useState(() => createBlankJD());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset form on open/change
  useEffect(() => {
    if (isOpen) {
      if (jdToEdit) {
        setFormData(JSON.parse(JSON.stringify(jdToEdit)));
      } else {
        // Create new: default to current personnel or first in list
        const defaultPerson = isAdmin ? personnelList[0] || null : currentPersonnel;
        setFormData(createBlankJD(defaultPerson));
      }
      setActiveTab('job_info');
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, jdToEdit, currentPersonnel, personnelList, isAdmin]);

  if (!isOpen) return null;

  // Handle personnel selection for Admin
  const handleSelectPersonnel = (pId) => {
    const selected = personnelList.find((p) => p.id === pId);
    if (!selected) return;
    setFormData((prev) => ({
      ...prev,
      personnelId: selected.id,
      personnelName: selected.name,
      personnelEmail: selected.email,
      positionNumber: selected.positionNumber || prev.positionNumber,
      position: selected.position || prev.position,
      department: selected.department || prev.department,
      positionLevel: selected.positionLevel || prev.positionLevel,
      positionType: selected.personnelType || prev.positionType,
      signatures: {
        ...prev.signatures,
        preparedBy: {
          name: selected.name,
          date: prev.signatures?.preparedBy?.date || '',
        },
      },
    }));
  };

  // Field change helpers
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [field]: value,
      },
    }));
  };

  // Main Responsibilities Handlers
  const handleAddResponsibility = () => {
    setFormData((prev) => ({
      ...prev,
      mainResponsibilities: [
        ...(prev.mainResponsibilities || []),
        { category: 'งานที่ได้รับมอบหมาย', activities: '', expectedResults: '', weight: 10 },
      ],
    }));
  };

  const handleUpdateResponsibility = (idx, field, val) => {
    setFormData((prev) => {
      const list = [...(prev.mainResponsibilities || [])];
      list[idx] = { ...list[idx], [field]: val };
      return { ...prev, mainResponsibilities: list };
    });
  };

  const handleRemoveResponsibility = (idx) => {
    setFormData((prev) => ({
      ...prev,
      mainResponsibilities: prev.mainResponsibilities.filter((_, i) => i !== idx),
    }));
  };

  // Internal / External Relationships Handlers
  const handleAddRelationship = (type) => {
    const key = type === 'internal' ? 'internalRelationships' : 'externalRelationships';
    setFormData((prev) => ({
      ...prev,
      [key]: [
        ...(prev[key] || []),
        { unitName: '', topics: '', contactMethod: '', frequency: '' },
      ],
    }));
  };

  const handleUpdateRelationship = (type, idx, field, val) => {
    const key = type === 'internal' ? 'internalRelationships' : 'externalRelationships';
    setFormData((prev) => {
      const list = [...(prev[key] || [])];
      list[idx] = { ...list[idx], [field]: val };
      return { ...prev, [key]: list };
    });
  };

  const handleRemoveRelationship = (type, idx) => {
    const key = type === 'internal' ? 'internalRelationships' : 'externalRelationships';
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx),
    }));
  };

  // Functional Competencies Handlers
  const handleAddFunctionalCompetency = () => {
    setFormData((prev) => ({
      ...prev,
      functionalCompetencies: [
        ...(prev.functionalCompetencies || []),
        { name: '', targetLevel: 3 },
      ],
    }));
  };

  const handleUpdateFunctionalCompetency = (idx, field, val) => {
    setFormData((prev) => {
      const list = [...(prev.functionalCompetencies || [])];
      list[idx] = { ...list[idx], [field]: val };
      return { ...prev, functionalCompetencies: list };
    });
  };

  const handleRemoveFunctionalCompetency = (idx) => {
    setFormData((prev) => ({
      ...prev,
      functionalCompetencies: prev.functionalCompetencies.filter((_, i) => i !== idx),
    }));
  };

  // Trainings Handlers
  const handleAddTraining = () => {
    setFormData((prev) => ({
      ...prev,
      trainings: [...(prev.trainings || []), ''],
    }));
  };

  const handleUpdateTraining = (idx, val) => {
    setFormData((prev) => {
      const list = [...(prev.trainings || [])];
      list[idx] = val;
      return { ...prev, trainings: list };
    });
  };

  const handleRemoveTraining = (idx) => {
    setFormData((prev) => ({
      ...prev,
      trainings: prev.trainings.filter((_, i) => i !== idx),
    }));
  };

  // Submit Draft
  const handleSaveDraft = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      if (!formData.personnelName) {
        throw new Error('กรุณาระบุชื่อ-นามสกุล บุคลากรเจ้าของตำแหน่ง');
      }
      await onSave(formData);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Version
  const handleConfirmUpdated = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      if (!formData.personnelName) {
        throw new Error('กรุณาระบุชื่อ-นามสกุล บุคลากรเจ้าของตำแหน่ง');
      }
      const updated = {
        ...formData,
        userConfirmed: true,
        confirmedAt: new Date().toISOString(),
        confirmedByEmail: currentPersonnel?.email || '',
        status: 'CONFIRMED',
      };
      if (onConfirm) {
        await onConfirm(updated);
      } else {
        await onSave(updated);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการยืนยันข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Total weight
  const totalWeight = (formData.mainResponsibilities || []).reduce(
    (acc, curr) => acc + (Number(curr.weight) || 0),
    0
  );

  const orgChartPreview = formData.orgChartUrl ? formatImageDisplayUrl(formData.orgChartUrl) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            padding: '1rem 1.5rem',
            background: 'var(--bg-card-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
              <FileText size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {jdToEdit ? 'แก้ไขแบบบรรยายลักษณะงาน (Job Description)' : 'สร้างแบบบรรยายลักษณะงาน (JD) ใหม่'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                แบบฟอร์มมาตรฐาน มจพ. (ICIT-FM-COMMON-006 Version 2.0)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 0.5rem',
          }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '2.5px solid var(--primary-600)' : '2.5px solid transparent',
                  background: 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body: Scrollable Tab Content */}
        <div
          className="modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            background: 'var(--bg-card)',
          }}
        >
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: '#FEE2E2',
                color: '#DC2626',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 1: ข้อมูลตำแหน่ง & ผังสายงาน */}
          {/* ============================================================ */}
          {activeTab === 'job_info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {isAdmin && personnelList.length > 0 && (
                <div style={{ background: 'var(--bg-card-subtle)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                    🏢 ดึงข้อมูลอัตโนมัติจากทำเนียบบุคลากร (Admin Quick Select)
                  </label>
                  <select
                    className="form-input"
                    value={formData.personnelId}
                    onChange={(e) => handleSelectPersonnel(e.target.value)}
                  >
                    <option value="">-- เลือกบุคลากรเพื่อกรอกข้อมูลเริ่มต้นอัตโนมัติ --</option>
                    {personnelList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.position || 'ไม่ระบุตำแหน่ง'} - เลขที่ {p.positionNumber || '-'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                1) รายละเอียดเกี่ยวกับตำแหน่งงาน
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label">ชื่อตำแหน่งในการบริหารงาน</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น - หรือ หัวหน้าสำนักงานผู้อำนวยการ"
                    value={formData.adminPosition}
                    onChange={(e) => handleChange('adminPosition', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">
                    ชื่อตำแหน่งในสายงาน <span style={{ color: 'var(--rose-500)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น บุคลากร, นักวิชาการคอมพิวเตอร์"
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">ตำแหน่งเลขที่</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น 1940"
                    value={formData.positionNumber}
                    onChange={(e) => handleChange('positionNumber', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">
                    ชื่อ-นามสกุล บุคลากร <span style={{ color: 'var(--rose-500)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น นางสาวจารุชา เจือทอง"
                    value={formData.personnelName}
                    onChange={(e) => handleChange('personnelName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">ระดับตำแหน่ง</label>
                  <select
                    className="form-input"
                    value={formData.positionLevel}
                    onChange={(e) => handleChange('positionLevel', e.target.value)}
                  >
                    {POSITION_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                    <option value="ชำนาญงาน">ชำนาญงาน</option>
                    <option value="ชำนาญงานพิเศษ">ชำนาญงานพิเศษ</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">ตำแหน่งประเภท</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น พนักงานมหาวิทยาลัย สายสนับสนุนวิชาการ"
                    value={formData.positionType}
                    onChange={(e) => handleChange('positionType', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">ชื่อส่วนงาน (สำนัก/กอง)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.division}
                    onChange={(e) => handleChange('division', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">ชื่อหน่วยงาน/กลุ่มงาน/ฝ่าย/งาน</label>
                  <select
                    className="form-input"
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                  >
                    {PREDEFINED_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                2) สายการบังคับบัญชา
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label">ชื่อผู้บังคับบัญชา</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น นางสาวชาลินทร์ เกรียงสินยศ"
                    value={formData.supervisorName}
                    onChange={(e) => handleChange('supervisorName', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">ตำแหน่งผู้บังคับบัญชาโดยตรง</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น หัวหน้าสำนักงานผู้อำนวยการ (นักวิชาการพัสดุ)"
                    value={formData.supervisorPosition}
                    onChange={(e) => handleChange('supervisorPosition', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">ผู้ใต้บังคับบัญชา (ถ้ามี) จำนวนคน</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น - หรือ 2"
                    value={formData.subordinatesCount}
                    onChange={(e) => handleChange('subordinatesCount', e.target.value)}
                  />
                </div>
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                3) ผังโครงสร้างสายการบังคับบัญชา (Organization Chart Image Link)
              </h4>

              <div style={{ background: 'var(--bg-card-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  ลิงก์รูปภาพจาก Google Drive หรือ Web URL
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="วางลิงก์แชร์จาก Google Drive (เช่น https://drive.google.com/file/d/...)"
                    value={formData.orgChartUrl}
                    onChange={(e) => handleChange('orgChartUrl', e.target.value)}
                  />
                  {formData.orgChartUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(formData.orgChartUrl, '_blank')}
                      className="btn btn-secondary btn-icon"
                      title="เปิดดูลิงก์ต้นทาง"
                    >
                      <ExternalLink size={16} />
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  💡 <strong>คำแนะนำ:</strong> สามารถวางลิงก์รูปภาพจาก Google Drive ได้โดยตรง ระบบจะแปลงเป็นรูปภาพที่แสดงผลได้ทันที
                </div>

                {/* Instant Image Preview */}
                {orgChartPreview && (
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: '6px' }}>
                      ตัวอย่างการแสดงผลรูปภาพผังโครงสร้าง:
                    </div>
                    <img
                      src={orgChartPreview}
                      alt="Organization Chart Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '220px',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        padding: '4px',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: สรุปหน้าที่ (Job Summary) */}
          {/* ============================================================ */}
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  ตามมาตรฐานกำหนดตำแหน่ง (Standard Job Summary)
                </label>
                <textarea
                  rows={6}
                  className="form-input"
                  placeholder="ระบุหน้าที่ตามมาตรฐานกำหนดตำแหน่ง..."
                  value={formData.jobSummaryStandard}
                  onChange={(e) => handleChange('jobSummaryStandard', e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  ปฏิบัติจริงในปัจจุบัน (Actual Job Summary in Practice)
                </label>
                <textarea
                  rows={8}
                  className="form-input"
                  placeholder="ระบุหน้าที่ตามการปฏิบัติจริงในปัจจุบัน..."
                  value={formData.jobSummaryActual}
                  onChange={(e) => handleChange('jobSummaryActual', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: หน้าที่ความรับผิดชอบหลัก */}
          {/* ============================================================ */}
          {activeTab === 'responsibilities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                    หน้าที่ความรับผิดชอบหลัก (Main Job Responsibilities)
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    ระบุกิจกรรม ตัวชี้วัดผลงาน และค่าน้ำหนักร้อยละ (น้ำหนักรวมปัจจุบัน:{' '}
                    <strong style={{ color: totalWeight === 100 ? 'var(--mint-600)' : 'var(--rose-500)' }}>
                      {totalWeight}%
                    </strong>
                    )
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddResponsibility}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '4px' }}
                >
                  <Plus size={14} /> เพิ่มหมวดงาน
                </button>
              </div>

              {(formData.mainResponsibilities || []).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-card-subtle)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontWeight: 700, flex: 1 }}
                      placeholder="เช่น ด้านการปฏิบัติการ, ด้านการวางแผน..."
                      value={item.category}
                      onChange={(e) => handleUpdateResponsibility(idx, 'category', e.target.value)}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        น้ำหนัก (%):
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: '70px', textAlign: 'center', fontWeight: 700 }}
                        min={0}
                        max={100}
                        value={item.weight}
                        onChange={(e) => handleUpdateResponsibility(idx, 'weight', Number(e.target.value))}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveResponsibility(idx)}
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--rose-500)' }}
                      title="ลบหมวดนี้"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      ขอบเขตหน้าที่ความรับผิดชอบที่ปฏิบัติจริงในปัจจุบัน (Key Activities):
                    </label>
                    <textarea
                      rows={4}
                      className="form-input"
                      placeholder="อธิบายกิจกรรมหลักในด้านนี้..."
                      value={item.activities}
                      onChange={(e) => handleUpdateResponsibility(idx, 'activities', e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      ดัชนีชี้วัดผลงาน (Key Expected Results):
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ผลสำเร็จหรือตัวชี้วัดที่คาดหวัง..."
                      value={item.expectedResults}
                      onChange={(e) => handleUpdateResponsibility(idx, 'expectedResults', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: การทำงานร่วมหน่วยงานอื่น */}
          {/* ============================================================ */}
          {activeTab === 'relationships' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Internal Relationships */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                    1. หน่วยงานภายใน (Internal Relationships)
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddRelationship('internal')}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '4px' }}
                  >
                    <Plus size={14} /> เพิ่มหน่วยงานภายใน
                  </button>
                </div>

                {(formData.internalRelationships || []).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 2fr 1.5fr 1.2fr auto',
                      gap: '8px',
                      alignItems: 'center',
                      background: 'var(--bg-card-subtle)',
                      padding: '0.65rem',
                      borderRadius: '6px',
                      marginBottom: '6px',
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ชื่อหน่วยงาน"
                      value={item.unitName}
                      onChange={(e) => handleUpdateRelationship('internal', idx, 'unitName', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เรื่องที่ประสาน"
                      value={item.topics}
                      onChange={(e) => handleUpdateRelationship('internal', idx, 'topics', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="วิธีการติดต่อ"
                      value={item.contactMethod}
                      onChange={(e) => handleUpdateRelationship('internal', idx, 'contactMethod', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ความถี่"
                      value={item.frequency}
                      onChange={(e) => handleUpdateRelationship('internal', idx, 'frequency', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRelationship('internal', idx)}
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--rose-500)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* External Relationships */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                    2. หน่วยงานภายนอก (External Relationships)
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddRelationship('external')}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '4px' }}
                  >
                    <Plus size={14} /> เพิ่มหน่วยงานภายนอก
                  </button>
                </div>

                {(formData.externalRelationships || []).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 2fr 1.5fr 1.2fr auto',
                      gap: '8px',
                      alignItems: 'center',
                      background: 'var(--bg-card-subtle)',
                      padding: '0.65rem',
                      borderRadius: '6px',
                      marginBottom: '6px',
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ชื่อหน่วยงาน"
                      value={item.unitName}
                      onChange={(e) => handleUpdateRelationship('external', idx, 'unitName', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เรื่องที่ประสาน"
                      value={item.topics}
                      onChange={(e) => handleUpdateRelationship('external', idx, 'topics', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="วิธีการติดต่อ"
                      value={item.contactMethod}
                      onChange={(e) => handleUpdateRelationship('external', idx, 'contactMethod', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ความถี่"
                      value={item.frequency}
                      onChange={(e) => handleUpdateRelationship('external', idx, 'frequency', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRelationship('external', idx)}
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--rose-500)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: คุณสมบัติ & ทักษะ */}
          {/* ============================================================ */}
          {activeTab === 'qualifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  5.1 การศึกษา (ระดับการศึกษา และสาขาวิชา) (Education and Major)
                </label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="เช่น ปริญญาตรี ด้านการบริหารจัดการ บริหารงานบุคคล รัฐศาสตร์..."
                  value={formData.educationAndMajor}
                  onChange={(e) => handleChange('educationAndMajor', e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  5.2 ประสบการณ์ที่จำเป็นในการทำงาน (Experience)
                </label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="เช่น ประสบการณ์ด้านการบริหารจัดการ การวางแผน การวิเคราะห์..."
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  5.3 คุณสมบัติพิเศษที่เกี่ยวกับงาน (Special Qualifications)
                </label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="เช่น การสื่อสารด้านจิตวิทยา การพูดในที่สาธารณะ..."
                  value={formData.specialQualifications}
                  onChange={(e) => handleChange('specialQualifications', e.target.value)}
                />
              </div>

              <h4 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 800 }}>
                5.4 ทักษะที่จำเป็นสำหรับงาน (Skills)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label">ภาษาอังกฤษ (English)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น ระดับเริ่มต้น หรือ CEFR ไม่ต่ำกว่า B1"
                    value={formData.skills?.english || ''}
                    onChange={(e) => handleNestedChange('skills', 'english', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">ภาษาอื่น (Other Languages)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น - หรือ ภาษาจีนระดับพื้นฐาน"
                    value={formData.skills?.otherLanguage || ''}
                    onChange={(e) => handleNestedChange('skills', 'otherLanguage', e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">คอมพิวเตอร์ (Computer)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น Microsoft Word, Excel, PowerPoint, Google Form, Canva..."
                    value={formData.skills?.computer || ''}
                    onChange={(e) => handleNestedChange('skills', 'computer', e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">อื่น ๆ โปรดระบุ (Other Skills)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น ทักษะการประสานงาน, ทักษะการเจรจาต่อรอง..."
                    value={formData.skills?.otherSkills || ''}
                    onChange={(e) => handleNestedChange('skills', 'otherSkills', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 6: สมรรถนะหลัก & ประจำตำแหน่ง */}
          {/* ============================================================ */}
          {activeTab === 'competencies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Part 6: Core Competencies */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ส่วนที่ 6 ความสามารถหรือสมรรถนะในงาน (Core Competencies ของ มจพ.)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(formData.coreCompetencies || []).map((comp, idx) => (
                    <div
                      key={comp.code}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--bg-card-subtle)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{comp.name}</div>
                        {comp.desc && <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>{comp.desc}</div>}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ระดับที่ต้องการ:</span>
                        <select
                          className="form-input"
                          style={{ width: '64px', textAlign: 'center', fontWeight: 800 }}
                          value={comp.targetLevel}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormData((prev) => {
                              const list = [...prev.coreCompetencies];
                              list[idx] = { ...list[idx], targetLevel: val };
                              return { ...prev, coreCompetencies: list };
                            });
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Part 7: Functional Competencies */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    ส่วนที่ 7 คุณสมบัติประจำตำแหน่ง (Functional Competencies)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddFunctionalCompetency}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '4px' }}
                  >
                    <Plus size={14} /> เพิ่มสมรรถนะประจำตำแหน่ง
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(formData.functionalCompetencies || []).map((comp, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg-card-subtle)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                      }}
                    >
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1 }}
                        placeholder="ชื่อสมรรถนะประจำตำแหน่งงาน..."
                        value={comp.name}
                        onChange={(e) => handleUpdateFunctionalCompetency(idx, 'name', e.target.value)}
                      />

                      <select
                        className="form-input"
                        style={{ width: '64px', textAlign: 'center', fontWeight: 800 }}
                        value={comp.targetLevel}
                        onChange={(e) => handleUpdateFunctionalCompetency(idx, 'targetLevel', Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveFunctionalCompetency(idx)}
                        className="btn btn-ghost btn-icon"
                        style={{ color: 'var(--rose-500)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 7: การฝึกอบรม & ลงนาม */}
          {/* ============================================================ */}
          {activeTab === 'training_signatures' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Part 8: Training */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                    ส่วนที่ 8 การฝึกอบรมที่จำเป็นต่อการปฏิบัติหน้าที่ (Training)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddTraining}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '4px' }}
                  >
                    <Plus size={14} /> เพิ่มหลักสูตรอบรม
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(formData.trainings || []).map((tr, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg-card-subtle)',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                      }}
                    >
                      <span style={{ fontWeight: 700, minWidth: '24px' }}>{idx + 1}.</span>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1 }}
                        placeholder="ชื่อหลักสูตรการฝึกอบรม..."
                        value={tr}
                        onChange={(e) => handleUpdateTraining(idx, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTraining(idx)}
                        className="btn btn-ghost btn-icon"
                        style={{ color: 'var(--rose-500)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures */}
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 800 }}>
                  ข้อมูลการลงนามรับรอง
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-card-subtle)', padding: '1rem', borderRadius: '8px' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>ผู้จัดทำ (Position By)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ชื่อผู้จัดทำ"
                      value={formData.signatures?.preparedBy?.name || ''}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          signatures: {
                            ...prev.signatures,
                            preparedBy: { ...(prev.signatures?.preparedBy || {}), name },
                          },
                        }));
                      }}
                    />
                  </div>

                  <div style={{ background: 'var(--bg-card-subtle)', padding: '1rem', borderRadius: '8px' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>ผู้บังคับบัญชา (Reviewed By)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ชื่อผู้บังคับบัญชา"
                      value={formData.signatures?.reviewedBy?.name || ''}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          signatures: {
                            ...prev.signatures,
                            reviewedBy: { ...(prev.signatures?.reviewedBy || {}), name },
                          },
                        }));
                      }}
                    />
                  </div>

                  <div style={{ background: 'var(--bg-card-subtle)', padding: '1rem', borderRadius: '8px' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>ผู้อนุมัติ (Approved By)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ชื่อผู้อนุมัติ"
                      value={formData.signatures?.approvedBy?.name || ''}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          signatures: {
                            ...prev.signatures,
                            approvedBy: { ...(prev.signatures?.approvedBy || {}), name },
                          },
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          className="modal-footer"
          style={{
            padding: '1rem 1.5rem',
            background: 'var(--bg-card-subtle)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {formData.userConfirmed ? (
              <span style={{ color: 'var(--mint-600)', fontWeight: 600 }}>
                ✅ สถานะ: ได้รับการยืนยันข้อมูลเวอร์ชันล่าสุดแล้ว
              </span>
            ) : (
              <span style={{ color: 'var(--amber-600)', fontWeight: 600 }}>
                ⏳ สถานะ: ฉบับร่าง (ยังไม่ได้รับการยืนยัน)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary btn-sm"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <Save size={15} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกฉบับร่าง (Draft)'}</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmUpdated}
              disabled={isSubmitting}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px', background: 'var(--teal-600, #0D9488)' }}
              title="บันทึกและยืนยันแบบบรรยายลักษณะงาน (Job Description) เวอร์ชันสมบูรณ์"
            >
              <CheckCircle2 size={15} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึก & ยืนยันข้อมูลล่าสุด'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
