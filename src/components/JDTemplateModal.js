'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Layers,
  Award,
  BookOpen,
  Briefcase,
  Users,
  Plus,
  Trash2,
  Check,
  HelpCircle,
} from 'lucide-react';
import {
  DEFAULT_JD_TEMPLATE,
  KMUTNB_CORE_COMPETENCIES,
} from '@/lib/jdTemplateData';
import {
  getJDTemplateConfig,
  saveJDTemplateConfig,
  applyJDTemplateToAllJDs,
} from '@/lib/jdService';

export default function JDTemplateModal({
  isOpen,
  onClose,
  actorPersonnel,
  onTemplateUpdated,
}) {
  const [activeTab, setActiveTab] = useState('doc_info');
  const [template, setTemplate] = useState(() => DEFAULT_JD_TEMPLATE);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [confirmApplyAll, setConfirmApplyAll] = useState(false);

  // Options for bulk apply
  const [applyOptions, setApplyOptions] = useState({
    overwriteFunctionalCompetencies: false,
    overwriteTrainings: false,
  });

  useEffect(() => {
    if (isOpen) {
      const current = getJDTemplateConfig();
      setTemplate(JSON.parse(JSON.stringify(current || DEFAULT_JD_TEMPLATE)));
      setStatusMsg(null);
      setConfirmApplyAll(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResetToDefault = () => {
    if (confirm('คุณต้องการรีเซ็ตการตั้งค่าแม่แบบกลับเป็นค่าเริ่มต้นของระบบใช่หรือไม่?')) {
      setTemplate(JSON.parse(JSON.stringify(DEFAULT_JD_TEMPLATE)));
      setStatusMsg({ type: 'info', text: 'รีเซ็ตค่าแม่แบบเป็นค่าเริ่มต้นของระบบแล้ว (อย่าลืมกดบันทึก)' });
    }
  };

  const handleSaveOnly = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const res = await saveJDTemplateConfig(template, actorPersonnel);
      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: 'บันทึกแม่แบบเริ่มต้นสำเร็จ! (จะมีผลกับ JD ที่สร้างใหม่)',
        });
        if (onTemplateUpdated) onTemplateUpdated(res.template);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMsg({ type: 'error', text: 'ไม่สามารถบันทึกแม่แบบได้' });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToAll = async () => {
    setIsApplyingAll(true);
    setStatusMsg(null);
    try {
      const res = await applyJDTemplateToAllJDs(template, actorPersonnel, applyOptions);
      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: `บันทึกและปรับใช้แม่แบบกับ JD ในระบบทั้งหมด (${res.count} รายการ) สำเร็จเรียบร้อย!`,
        });
        if (onTemplateUpdated) onTemplateUpdated(res.template);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMsg({ type: 'error', text: 'ไม่สามารถปรับใช้แม่แบบกับ JD ทั้งหมดได้' });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการซิงค์ข้อมูลกับ Firestore' });
    } finally {
      setIsApplyingAll(false);
      setConfirmApplyAll(false);
    }
  };

  // Helper updater
  const updateField = (field, value) => {
    setTemplate((prev) => ({ ...prev, [field]: value }));
  };

  // Qualifications sub-field updater
  const updateQual = (field, value) => {
    setTemplate((prev) => ({
      ...prev,
      qualifications: {
        ...prev.qualifications,
        [field]: value,
      },
    }));
  };

  const updateQualSkills = (field, value) => {
    setTemplate((prev) => ({
      ...prev,
      qualifications: {
        ...prev.qualifications,
        skills: {
          ...prev.qualifications?.skills,
          [field]: value,
        },
      },
    }));
  };

  // Core competencies target level updater
  const updateCoreLevel = (idx, level) => {
    const list = [...(template.coreCompetencies || [])];
    if (list[idx]) {
      list[idx].targetLevel = Number(level);
      setTemplate((prev) => ({ ...prev, coreCompetencies: list }));
    }
  };

  // Functional competencies handlers
  const addFunctionalComp = () => {
    const list = [...(template.functionalCompetencies || [])];
    list.push({
      name: `${list.length + 1}. `,
      targetLevel: 4,
    });
    setTemplate((prev) => ({ ...prev, functionalCompetencies: list }));
  };

  const removeFunctionalComp = (idx) => {
    const list = (template.functionalCompetencies || []).filter((_, i) => i !== idx);
    setTemplate((prev) => ({ ...prev, functionalCompetencies: list }));
  };

  const updateFunctionalComp = (idx, key, value) => {
    const list = [...(template.functionalCompetencies || [])];
    if (list[idx]) {
      list[idx][key] = key === 'targetLevel' ? Number(value) : value;
      setTemplate((prev) => ({ ...prev, functionalCompetencies: list }));
    }
  };

  // Trainings handlers
  const addTraining = () => {
    const list = [...(template.trainings || [])];
    list.push('');
    setTemplate((prev) => ({ ...prev, trainings: list }));
  };

  const removeTraining = (idx) => {
    const list = (template.trainings || []).filter((_, i) => i !== idx);
    setTemplate((prev) => ({ ...prev, trainings: list }));
  };

  const updateTraining = (idx, value) => {
    const list = [...(template.trainings || [])];
    list[idx] = value;
    setTemplate((prev) => ({ ...prev, trainings: list }));
  };

  // Main Responsibilities handlers
  const updateResp = (idx, key, value) => {
    const list = [...(template.mainResponsibilities || [])];
    if (list[idx]) {
      list[idx][key] = key === 'weight' ? Number(value) : value;
      setTemplate((prev) => ({ ...prev, mainResponsibilities: list }));
    }
  };

  const totalWeight = (template.mainResponsibilities || []).reduce(
    (sum, r) => sum + (Number(r.weight) || 0),
    0
  );

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF' }}>
                จัดการแม่แบบ Job Description (JD Template)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                กำหนดค่าเริ่มต้นมาตรฐานสำหรับเอกสาร JD ประจำสำนักคอมพิวเตอร์ฯ และปรับใช้กับบุคลากรทั้งหมด
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-close"
            type="button"
            style={{ color: '#94A3B8', background: 'rgba(255,255,255,0.08)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            padding: '0.6rem 1.25rem',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('doc_info')}
            className={`btn btn-sm ${activeTab === 'doc_info' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              gap: '0.4rem',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
            }}
          >
            <Layers size={15} />
            <span>1. ข้อมูลหัวเอกสาร</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('core_comp')}
            className={`btn btn-sm ${activeTab === 'core_comp' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              gap: '0.4rem',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
            }}
          >
            <Award size={15} />
            <span>2. ส่วนที่ 6 สมรรถนะหลัก (Core)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('functional_comp')}
            className={`btn btn-sm ${activeTab === 'functional_comp' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              gap: '0.4rem',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
            }}
          >
            <Sparkles size={15} />
            <span>3. ส่วนที่ 6 สมรรถนะประจำสายงาน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('responsibilities')}
            className={`btn btn-sm ${activeTab === 'responsibilities' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              gap: '0.4rem',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
            }}
          >
            <Briefcase size={15} />
            <span>4. ส่วนที่ 3 หน้าที่หลัก</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qual_trainings')}
            className={`btn btn-sm ${activeTab === 'qual_trainings' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              gap: '0.4rem',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
            }}
          >
            <BookOpen size={15} />
            <span>5. คุณสมบัติ & ฝึกอบรม</span>
          </button>
        </div>

        {/* Modal Body */}
        <div
          className="modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            background: '#FFFFFF',
          }}
        >
          {statusMsg && (
            <div
              style={{
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                background:
                  statusMsg.type === 'success'
                    ? '#F0FDF4'
                    : statusMsg.type === 'info'
                    ? '#EFF6FF'
                    : '#FEF2F2',
                color:
                  statusMsg.type === 'success'
                    ? '#166534'
                    : statusMsg.type === 'info'
                    ? '#1E40AF'
                    : '#991B1B',
                border: `1px solid ${
                  statusMsg.type === 'success'
                    ? '#BBF7D0'
                    : statusMsg.type === 'info'
                    ? '#BFDBFE'
                    : '#FECACA'
                }`,
              }}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : statusMsg.type === 'info' ? (
                <HelpCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: General & Document Info */}
          {activeTab === 'doc_info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  padding: '1rem',
                  background: '#FFF7ED',
                  border: '1px solid #FFEDD5',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  fontSize: '0.83rem',
                  color: '#9A3412',
                }}
              >
                <HelpCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>ข้อมูลหัวเอกสารมาตรฐาน:</strong>{' '}
                  ค่าเหล่านี้จะถูกนำไปใช้เป็นค่าเริ่มต้นสำหรับหัวเอกสารและผู้อนุมัติของแบบบรรยายลักษณะงาน (Job Description) ทุกฉบับ
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    รหัสแบบฟอร์มเอกสาร (Document Code)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={template.docCode || ''}
                    onChange={(e) => updateField('docCode', e.target.value)}
                    placeholder="เช่น ICIT-FM-COMMON-006"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    ฉบับที่ (Version)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={template.version || ''}
                    onChange={(e) => updateField('version', e.target.value)}
                    placeholder="เช่น 2.0"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    ชั้นความลับ (Security Classification)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={template.securityClassification || ''}
                    onChange={(e) => updateField('securityClassification', e.target.value)}
                    placeholder="เช่น ปกปิด (Restricted)"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    สังกัด / หน่วยงานหลัก (Division)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={template.division || ''}
                    onChange={(e) => updateField('division', e.target.value)}
                    placeholder="สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ"
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    ชื่อผู้มีอำนาจอนุมัติเริ่มต้น (Default Approver)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={template.approvedByName || ''}
                    onChange={(e) => updateField('approvedByName', e.target.value)}
                    placeholder="อาจารย์ณัฐวุฒิ สร้อยดอกสน"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Core Competencies */}
          {activeTab === 'core_comp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  padding: '1rem',
                  background: '#F0FDF4',
                  border: '1px solid #DCFCE7',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  fontSize: '0.83rem',
                  color: '#166534',
                }}
              >
                <Award size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>สมรรถนะหลักของ มจพ. (KMUTNB Core Competencies - 6 ตัวอักษรย่อ):</strong>{' '}
                  แสดงเฉพาะตัวอักษรย่อ (K, M, U, T, N, B) ตามมาตรฐานของมหาวิทยาลัย โดย Admin สามารถปรับระดับเป้าหมายเริ่มต้น (Target Level 1 - 5) ได้
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(template.coreCompetencies || KMUTNB_CORE_COMPETENCIES).map((comp, idx) => (
                  <div
                    key={comp.code || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.9rem 1.15rem',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: '#F97316',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                          }}
                        >
                          {comp.code}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1E293B' }}>
                          {comp.name}
                        </span>
                      </div>
                      {comp.desc && (
                        <p style={{ margin: '4px 0 0 34px', fontSize: '0.77rem', color: '#64748B' }}>
                          {comp.desc}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500 }}>
                        ระดับเป้าหมายเริ่มต้น:
                      </span>
                      <select
                        className="form-control"
                        style={{ width: '85px', textAlign: 'center', fontWeight: 600 }}
                        value={comp.targetLevel || 3}
                        onChange={(e) => updateCoreLevel(idx, e.target.value)}
                      >
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Functional Competencies */}
          {activeTab === 'functional_comp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>
                    รายการสมรรถนะประจำสายงานเริ่มต้น (Default Functional Competencies)
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                    เพิ่มหรือแก้ไขรายการสมรรถนะประจำสายงานที่จะใส่ให้เป็นค่าเริ่มต้นใน JD ใหม่
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addFunctionalComp}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.35rem', background: '#F97316' }}
                >
                  <Plus size={15} />
                  <span>เพิ่มสมรรถนะ</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {(template.functionalCompetencies || []).map((comp, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                    }}
                  >
                    <input
                      type="text"
                      className="form-control"
                      style={{ flex: 1, fontSize: '0.85rem' }}
                      value={comp.name || ''}
                      onChange={(e) => updateFunctionalComp(idx, 'name', e.target.value)}
                      placeholder={`เช่น ${idx + 1}. ความรู้ด้านการบริหารทรัพยากรบุคคล`}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        ระดับเป้าหมาย:
                      </span>
                      <select
                        className="form-control"
                        style={{ width: '80px', textAlign: 'center', fontWeight: 600 }}
                        value={comp.targetLevel || 4}
                        onChange={(e) => updateFunctionalComp(idx, 'targetLevel', e.target.value)}
                      >
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFunctionalComp(idx)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#EF4444', padding: '0.4rem' }}
                      title="ลบรายการ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Main Responsibilities */}
          {activeTab === 'responsibilities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: totalWeight === 100 ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${totalWeight === 100 ? '#BBF7D0' : '#FECACA'}`,
                  borderRadius: '10px',
                }}
              >
                <div>
                  <strong>หน้าที่ความรับผิดชอบหลักตามโครงสร้าง (4 หมวดหมู่):</strong>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                    กำหนดกิจกรรมและผลสัมฤทธิ์ของงานเริ่มต้นสำหรับแต่ละด้าน
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: totalWeight === 100 ? '#166534' : '#DC2626' }}>
                  ค่าน้ำหนักรวม: {totalWeight}% {totalWeight === 100 ? '✓ (ถูกต้อง)' : '(ควรเท่ากับ 100%)'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(template.mainResponsibilities || []).map((resp, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        style={{ fontWeight: 700, color: '#1E293B', width: '260px' }}
                        value={resp.category || ''}
                        onChange={(e) => updateResp(idx, 'category', e.target.value)}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                          ค่าน้ำหนัก:
                        </span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: '80px', textAlign: 'center', fontWeight: 700 }}
                          value={resp.weight ?? 0}
                          onChange={(e) => updateResp(idx, 'weight', e.target.value)}
                          min={0}
                          max={100}
                        />
                        <span style={{ fontSize: '0.82rem', color: '#64748B' }}>%</span>
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '4px' }}>
                        กิจกรรม / ลักษณะงานที่ปฏิบัติ:
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        style={{ fontSize: '0.82rem' }}
                        value={resp.activities || ''}
                        onChange={(e) => updateResp(idx, 'activities', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '4px' }}>
                        ผลสัมฤทธิ์ที่คาดหวัง:
                      </label>
                      <textarea
                        className="form-control"
                        rows={2}
                        style={{ fontSize: '0.82rem' }}
                        value={resp.expectedResults || ''}
                        onChange={(e) => updateResp(idx, 'expectedResults', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Qualifications & Trainings */}
          {activeTab === 'qual_trainings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>
                  ส่วนที่ 5 คุณสมบัติเฉพาะตำแหน่งเริ่มต้น (Default Qualifications)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      คุณวุฒิการศึกษาและสาขาวิชา
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={template.qualifications?.educationAndMajor || ''}
                      onChange={(e) => updateQual('educationAndMajor', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      ประสบการณ์ในการทำงาน
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={template.qualifications?.experience || ''}
                      onChange={(e) => updateQual('experience', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        ทักษะภาษาอังกฤษ (English Skill)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={template.qualifications?.skills?.english || ''}
                        onChange={(e) => updateQualSkills('english', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        ทักษะคอมพิวเตอร์ (Computer Skill)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={template.qualifications?.skills?.computer || ''}
                        onChange={(e) => updateQualSkills('computer', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>
                    ส่วนที่ 7 หลักสูตรฝึกอบรมที่แนะนำเริ่มต้น (Default Recommended Trainings)
                  </h4>
                  <button
                    type="button"
                    onClick={addTraining}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.35rem', background: '#F97316' }}
                  >
                    <Plus size={15} />
                    <span>เพิ่มหลักสูตร</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(template.trainings || []).map((t, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#64748B', width: '24px' }}>
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        style={{ flex: 1, fontSize: '0.85rem' }}
                        value={t}
                        onChange={(e) => updateTraining(idx, e.target.value)}
                        placeholder="ชื่อหลักสูตรอบรม"
                      />
                      <button
                        type="button"
                        onClick={() => removeTraining(idx)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#EF4444', padding: '0.4rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Confirm Apply All Dialog */}
          {confirmApplyAll && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                background: '#FEF2F2',
                border: '2px solid #F87171',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <AlertCircle size={24} style={{ color: '#DC2626', flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#991B1B' }}>
                    ยืนยันการบันทึกและปรับใช้แม่แบบกับ JD ทั้งหมดใน Firestore?
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#B91C1C', lineHeight: 1.5 }}>
                    การดำเนินการนี้จะอัปเดตข้อมูลมาตรฐาน (รหัสเอกสาร, ฉบับที่, สมรรถนะหลัก Core Competencies 6 ตัว, ชื่อผู้อนุมัติ) ไปยังแบบบรรยายลักษณะงาน (JD) ของบุคลากรทุกคนในระบบ โดยยังคงรักษาข้อมูลส่วนบุคคลและภาระงานเฉพาะตัวไว้
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '32px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#7F1D1D', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={applyOptions.overwriteFunctionalCompetencies}
                    onChange={(e) =>
                      setApplyOptions((prev) => ({
                        ...prev,
                        overwriteFunctionalCompetencies: e.target.checked,
                      }))
                    }
                  />
                  <span>เขียนทับสมรรถนะประจำสายงาน (Functional Competencies) ของทุก JD ด้วยแม่แบบนี้</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#7F1D1D', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={applyOptions.overwriteTrainings}
                    onChange={(e) =>
                      setApplyOptions((prev) => ({
                        ...prev,
                        overwriteTrainings: e.target.checked,
                      }))
                    }
                  />
                  <span>เขียนทับหลักสูตรฝึกอบรมที่แนะนำของทุก JD ด้วยแม่แบบนี้</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setConfirmApplyAll(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={isApplyingAll}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleApplyToAll}
                  className="btn btn-sm"
                  disabled={isApplyingAll}
                  style={{
                    background: '#DC2626',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  }}
                >
                  {isApplyingAll ? (
                    <span>กำลังอัปเดต Firestore...</span>
                  ) : (
                    <span>ยืนยันการปรับใช้กับ JD ทั้งหมด</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={handleResetToDefault}
            className="btn btn-ghost btn-sm"
            style={{ color: '#64748B', gap: '0.4rem' }}
            disabled={isSaving || isApplyingAll}
          >
            <RotateCcw size={15} />
            <span>รีเซ็ตค่าเริ่มต้นระบบ</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              disabled={isSaving || isApplyingAll}
            >
              ปิด
            </button>

            <button
              type="button"
              onClick={handleSaveOnly}
              className="btn btn-secondary btn-sm"
              disabled={isSaving || isApplyingAll}
              style={{
                borderColor: '#CBD5E1',
                fontWeight: 600,
              }}
            >
              <Save size={15} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกเป็นแม่แบบ (สำหรับสร้างใหม่)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmApplyAll(true)}
              className="btn btn-primary btn-sm"
              disabled={isSaving || isApplyingAll}
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                fontWeight: 700,
              }}
            >
              <Sparkles size={15} />
              <span>บันทึกและปรับใช้กับ JD ทั้งหมด (Apply to All)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
