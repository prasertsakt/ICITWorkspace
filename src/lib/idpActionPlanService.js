// IDP Action Plan Service: Firestore Synchronization & Excel Export Engine
import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { formatDateDDMMYYYYBE } from './dateUtils';
import {
  IDP_DEVELOPMENT_METHODS,
  IDP_ACTION_PLAN_QUARTERS,
  IDP_MISSIONS_5,
  IDP_ACTION_PLAN_STATUSES,
} from './constants';

export const LOCAL_KEY_IDP_ACTION_PLANS = 'icit_idp_action_plans';

/**
 * Real-time Subscription to IDP Action Plans per Fiscal Year
 */
export function subscribeActionPlans(fiscalYear, callback) {
  if (typeof window === 'undefined') return () => {};

  const localKey = `${LOCAL_KEY_IDP_ACTION_PLANS}_${fiscalYear}`;
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) callback(parsed);
    }
  } catch (e) {}

  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  try {
    const colRef = collection(db, 'idp_action_plans');
    const q = query(colRef, where('fiscalYear', '==', String(fiscalYear)));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        try {
          localStorage.setItem(localKey, JSON.stringify(list));
        } catch (e) {}

        callback(list);
      },
      (err) => {
        console.warn('Firestore idp_action_plans subscription warning:', err);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error('Failed to setup idp_action_plans subscription:', e);
    return () => {};
  }
}

/**
 * Get a single Action Plan by ID
 */
export async function getActionPlanById(planId, fiscalYear) {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${LOCAL_KEY_IDP_ACTION_PLANS}_${fiscalYear}`);
      if (raw) {
        const list = JSON.parse(raw);
        const found = list.find((p) => p.id === planId);
        if (found) return found;
      }
    } catch (e) {}
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'idp_action_plans', planId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (e) {}
  }
  return null;
}

function cleanPayload(data) {
  if (data === undefined) return null;
  return JSON.parse(
    JSON.stringify(data, (key, value) => (value === undefined ? null : value))
  );
}

/**
 * Save an IDP Action Plan
 */
export async function saveActionPlan(planData, actor) {
  const fiscalYear = String(planData.fiscalYear || '2569');
  const planId = planData.id || `action-plan-${fiscalYear}-${planData.personnelId || Date.now()}`;
  const now = new Date().toISOString();

  const rawPayload = {
    ...planData,
    id: planId,
    fiscalYear,
    updatedAt: now,
    updatedBy: actor?.name || actor?.displayName || actor?.email || 'ผู้จัดทำแผน',
    status: planData.status || IDP_ACTION_PLAN_STATUSES.DRAFT.key,
  };

  const payload = cleanPayload(rawPayload);

  // 1. LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const localKey = `${LOCAL_KEY_IDP_ACTION_PLANS}_${fiscalYear}`;
      const raw = localStorage.getItem(localKey);
      let list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((p) => p.id === planId);
      if (idx >= 0) {
        list[idx] = payload;
      } else {
        list.unshift(payload);
      }
      localStorage.setItem(localKey, JSON.stringify(list));
    } catch (e) {}
  }

  // 2. Firebase Firestore
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'idp_action_plans', planId);
      await setDoc(docRef, payload, { merge: true });
      console.log(`[IDP Action Plan] Saved & synced to Firestore: ${planId}`);
    } catch (e) {
      console.error('Firestore saveActionPlan error:', e);
      throw e;
    }
  }

  return payload;
}

/**
 * Delete an IDP Action Plan
 */
export async function deleteActionPlan(planId, fiscalYear, actor) {
  // 1. LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const localKey = `${LOCAL_KEY_IDP_ACTION_PLANS}_${fiscalYear}`;
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const list = JSON.parse(raw).filter((p) => p.id !== planId);
        localStorage.setItem(localKey, JSON.stringify(list));
      }
    } catch (e) {}
  }

  // 2. Firebase
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'idp_action_plans', planId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore deleteActionPlan warning:', e);
    }
  }

  return true;
}

/**
 * Initialize / Import selected competencies from Need Analysis into IDP Action Plan
 */
export function createActionPlanItemsFromNeedAnalysis(selectedCompetencies = []) {
  return selectedCompetencies.map((comp, idx) => ({
    id: `item-${Date.now()}-${idx + 1}`,
    order: idx + 1,
    competencyName: comp.name || comp.competencyName || '',
    competencyType: comp.type || comp.competencyType || 'CORE', // 'CORE' | 'FUNCTIONAL'
    sourceNeedId: comp.id || comp.code || '',
    gap: Number(comp.gap) || 0,
    expectedScore: Number(comp.expectedTotal) || 0,
    evaluatedScore: Number(comp.evaluatedTotal) || 0,
    
    // Form fields
    skillDetail: '', // รายละเอียดความรู้/ทักษะที่ต้องการพัฒนา (ผู้ใช้กรอกเอง)
    goal: '',
    kpiCriteria: '', // Staff success criteria / KPI
    methods: [], // Multi-select array of method IDs (e.g. [1, 6])
    methodCustom: '', // If method 10 selected
    application: '',
    
    // Quarterly Progress
    quarters: {
      q1: { planned: false, progress: '', reportedAt: '' },
      q2: { planned: false, progress: '', reportedAt: '' },
      q3: { planned: false, progress: '', reportedAt: '' },
      q4: { planned: false, progress: '', reportedAt: '' },
    },
    
    // Success Measurement & Evaluation (By Supervisor/Deputy/HR/Admin)
    evaluation: {
      status: 'NOT_ACHIEVED', // 'ACHIEVED' | 'NOT_ACHIEVED'
      evaluatedBy: '',
      evaluatedAt: '',
      comment: '',
    },
    
    // 4-Dimension Alignments
    alignments: {
      competencyType: comp.type || comp.competencyType || 'CORE',
      strategyIds: [], // SFA/SO/CKPI IDs (Multi-select)
      strategyTitles: [],
      skillMapIds: [], // Knowledge & Skill IDs (Multi-select)
      skillMapTitles: [],
      missionIds: [], // Missions 1-5 (Multi-select)
      missionTitles: [],
    },
  }));
}

/**
 * Sign Acknowledgement for IDP Action Plan (Early Fiscal Year)
 */
export async function signPlanAcknowledgement(plan, role, actor) {
  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];

  const signatures = {
    ...(plan.signatures || {}),
    acknowledgement: {
      ...(plan.signatures?.acknowledgement || {}),
    },
  };

  if (role === 'TRAINEE') {
    signatures.acknowledgement.trainee = {
      name: actor?.name || actor?.displayName || 'ผู้รับการพัฒนา',
      email: actor?.email || '',
      signed: true,
      signedAt: dateStr,
    };
  } else if (role === 'SUPERVISOR') {
    signatures.acknowledgement.supervisor = {
      name: actor?.name || actor?.displayName || 'ผู้บังคับบัญชา',
      email: actor?.email || '',
      signed: true,
      signedAt: dateStr,
    };
  }

  const isBothSigned =
    signatures.acknowledgement.trainee?.signed && signatures.acknowledgement.supervisor?.signed;

  const updatedPlan = {
    ...plan,
    signatures,
    status: isBothSigned ? IDP_ACTION_PLAN_STATUSES.PLANNED.key : plan.status || IDP_ACTION_PLAN_STATUSES.DRAFT.key,
  };

  return await saveActionPlan(updatedPlan, actor);
}

/**
 * Save / Sign Year-End Evaluation (End of Fiscal Year)
 */
export async function signPlanEvaluation(plan, evalData, role, actor) {
  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];

  const signatures = {
    ...(plan.signatures || {}),
    evaluation: {
      ...(plan.signatures?.evaluation || {}),
      resultType: evalData?.resultType || 'COMPLETED', // 'COMPLETED' | 'NEARLY_COMPLETED'
      percent: evalData?.percent !== undefined ? Number(evalData.percent) : 100,
      reason: evalData?.reason || '',
    },
  };

  if (role === 'SUPERVISOR') {
    signatures.evaluation.supervisor = {
      name: actor?.name || actor?.displayName || 'ผู้บังคับบัญชา',
      email: actor?.email || '',
      position: actor?.position || 'รองผู้อำนวยการฝ่ายบริหาร',
      signed: true,
      signedAt: dateStr,
    };
  } else if (role === 'TRAINEE') {
    signatures.evaluation.trainee = {
      name: actor?.name || actor?.displayName || 'ผู้รับการพัฒนา',
      email: actor?.email || '',
      position: actor?.position || '',
      signed: true,
      signedAt: dateStr,
    };
  }

  const isEvaluated = signatures.evaluation.supervisor?.signed;

  const updatedPlan = {
    ...plan,
    signatures,
    status: isEvaluated ? IDP_ACTION_PLAN_STATUSES.EVALUATED.key : IDP_ACTION_PLAN_STATUSES.IN_PROGRESS.key,
  };

  return await saveActionPlan(updatedPlan, actor);
}

/**
 * Format methods numbers as a string, e.g. "1, 6" or "1, 4, 6"
 */
export function formatMethodsString(methods = [], methodCustom = '') {
  if (!Array.isArray(methods) || methods.length === 0) return '-';
  const labels = methods.map((m) => String(m));
  if (methods.includes(10) && methodCustom) {
    return `${labels.join(', ')} (${methodCustom})`;
  }
  return labels.join(', ');
}

/**
 * Format 4-Dimension Alignments for display / table
 */
export function formatAlignmentText(alignments = {}) {
  const parts = [];
  if (alignments.competencyType) {
    parts.push(alignments.competencyType === 'CORE' ? 'สมรรถนะหลัก' : 'สมรรถนะตามตำแหน่งงาน');
  }
  if (alignments.strategyTitles?.length > 0) {
    parts.push(`ยุทธศาสตร์: ${alignments.strategyTitles.join(', ')}`);
  }
  if (alignments.skillMapTitles?.length > 0) {
    parts.push(`Skill: ${alignments.skillMapTitles.join(', ')}`);
  }
  if (alignments.missionTitles?.length > 0) {
    parts.push(`พันธกิจ: ${alignments.missionTitles.join(', ')}`);
  }
  return parts.join(' | ');
}

/**
 * Export a Single IDP Action Plan to Excel (.xlsx) matching the Official Form Layout
 */
export function exportActionPlanToExcel(plan, fiscalYear = '2569') {
  if (!plan) return;
  const wb = XLSX.utils.book_new();
  const rows = [];

  // Header Title
  rows.push([`แผนพัฒนาบุคลากร ประจำปีงบประมาณ พ.ศ. ${fiscalYear} : Individual Development (IDP)`]);
  rows.push([`สังกัด สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ`]);
  rows.push([
    `ข้อมูลทั่วไป : ชื่อ - สกุล`,
    plan.personnelName || '-',
    '',
    '',
    `ฝ่าย`,
    plan.department || '-',
    '',
    '',
    '',
    '',
  ]);
  rows.push([]); // Empty row

  // Table Headers
  const headerRow1 = [
    'ความรู้/ทักษะ/สมรรถนะ\n(เรียงลำดับความสำคัญ/เร่งด่วน จากมากไปน้อย)',
    'เป้าหมายการพัฒนา',
    'วิธีการพัฒนา',
    'การประยุกต์ใช้ในงาน',
    'ช่วงเวลาที่พัฒนา',
    '',
    '',
    '',
    'การวัดผลสำเร็จของการ\nนำไปประยุกต์ใช้ในงาน',
    'ความสอดคล้อง',
    '',
    '',
    '',
  ];

  const headerRow2 = [
    '',
    '',
    '',
    '',
    'Q1\n(ต.ค.-ธ.ค.)',
    'Q2\n(ม.ค.-มี.ค.)',
    'Q3\n(เม.ย.-มิ.ย.)',
    'Q4\n(ก.ค.-ก.ย.)',
    '',
    'ประเภทสมรรถนะ',
    'แผนกลยุทธ์',
    'Knowledge & Skill',
    'พันธกิจ',
  ];

  rows.push(headerRow1);
  rows.push(headerRow2);

  // Data Rows
  (plan.items || []).forEach((item, idx) => {
    const methodsStr = formatMethodsString(item.methods, item.methodCustom);
    const q1Val = item.quarters?.q1?.progress || (item.quarters?.q1?.planned ? '✓ (วางแผน)' : '-');
    const q2Val = item.quarters?.q2?.progress || (item.quarters?.q2?.planned ? '✓ (วางแผน)' : '-');
    const q3Val = item.quarters?.q3?.progress || (item.quarters?.q3?.planned ? '✓ (วางแผน)' : '-');
    const q4Val = item.quarters?.q4?.progress || (item.quarters?.q4?.planned ? '✓ (วางแผน)' : '-');
    const evalStatus = item.evaluation?.status === 'ACHIEVED' ? 'บรรลุ' : 'ไม่บรรลุ';
    let evalText = evalStatus;
    if (item.kpiCriteria) {
      evalText = `KPI: ${item.kpiCriteria}\nผล: ${evalStatus}`;
    }
    if (item.evaluation?.comment) {
      evalText += ` (${item.evaluation.comment})`;
    }

    const compTypeLabel = item.competencyType === 'CORE' ? 'สมรรถนะหลัก' : 'สมรรถนะตามตำแหน่งงาน';
    const stratLabel = (item.alignments?.strategyTitles || []).join(', ') || '-';
    const skillLabel = (item.alignments?.skillMapTitles || []).join(', ') || '-';
    const missionLabel = (item.alignments?.missionTitles || []).join(', ') || '-';

    const compTitle = item.skillDetail
      ? `${idx + 1}. ${item.competencyName}\n(${item.skillDetail})`
      : `${idx + 1}. ${item.competencyName || '-'}`;

    rows.push([
      compTitle,
      item.goal || '-',
      methodsStr,
      item.application || '-',
      q1Val,
      q2Val,
      q3Val,
      q4Val,
      evalText,
      compTypeLabel,
      stratLabel,
      skillLabel,
      missionLabel,
    ]);
  });

  rows.push([]); // Empty row

  // Legend / Notes on 10 Development Methods
  rows.push(['หมายเหตุ : วิธีการพัฒนา']);
  rows.push([
    '1 = ศึกษาด้วยตนเอง',
    '3 = แลกเปลี่ยนเรียนรู้',
    '5 = การสอนงาน',
    '7 = การให้คำปรึกษา',
    '9 = ติดตามผู้มีประสบการณ์',
  ]);
  rows.push([
    '2 = เรียนรู้จากการปฏิบัติงาน',
    '4 = พี่เลี้ยง',
    '6 = ฝึกอบรม',
    '8 = การมอบหมายงาน',
    '10 = วิธีพัฒนาอื่น ๆ',
  ]);
  rows.push([]); // Empty row

  // Signatures Section
  const ack = plan.signatures?.acknowledgement || {};
  const ev = plan.signatures?.evaluation || {};

  rows.push(['[ส่วนที่ 1: รับทราบแผนพัฒนา IDP (ต้นปีงบประมาณ)]']);
  rows.push([
    `ลงชื่อผู้รับการพัฒนา: ${ack.trainee?.signed ? ack.trainee.name : '....................................................'}`,
    '',
    `วันที่: ${ack.trainee?.signedAt ? formatDateDDMMYYYYBE(ack.trainee.signedAt) : '........................'}`,
    '',
    `ลงชื่อผู้บังคับบัญชา: ${ack.supervisor?.signed ? ack.supervisor.name : '....................................................'}`,
    '',
    `วันที่: ${ack.supervisor?.signedAt ? formatDateDDMMYYYYBE(ack.supervisor.signedAt) : '........................'}`,
  ]);

  rows.push([]);
  rows.push(['[ส่วนที่ 2: การประเมินผลพัฒนาตามแผน IDP โดยผู้บังคับบัญชา (สิ้นปีงบประมาณ)]']);
  const resultText =
    ev.resultType === 'COMPLETED'
      ? '[X] ดำเนินการพัฒนาตนเองสำเร็จตามแผน IDP'
      : ev.resultType === 'NEARLY_COMPLETED'
      ? '[X] ดำเนินการพัฒนาตนเองเกือบสำเร็จตามแผน IDP'
      : '[ ] ดำเนินการพัฒนาตนเองตามแผน IDP';
  rows.push([resultText]);
  rows.push([`คิดเป็นร้อยละ: ${ev.percent ?? '-'} % ของแผนที่กำหนดไว้  เนื่องจาก: ${ev.reason || '-'}`]);
  rows.push([
    `ลงชื่อผู้ประเมิน: ${ev.supervisor?.signed ? ev.supervisor.name : '....................................................'}`,
    '',
    `ตำแหน่ง: ${ev.supervisor?.position || 'รองผู้อำนวยการฝ่ายบริหาร'}`,
    '',
    `วันที่: ${ev.supervisor?.signedAt ? formatDateDDMMYYYYBE(ev.supervisor.signedAt) : '........................'}`,
  ]);

  rows.push([]);
  rows.push(['[ส่วนที่ 3: รับทราบผลการพัฒนา IDP]']);
  rows.push([
    `ลงชื่อผู้รับการพัฒนา: ${ev.trainee?.signed ? ev.trainee.name : '....................................................'}`,
    '',
    `ตำแหน่ง: ${ev.trainee?.position || plan.position || '-'}`,
    '',
    `วันที่: ${ev.trainee?.signedAt ? formatDateDDMMYYYYBE(ev.trainee.signedAt) : '........................'}`,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 32 }, // Competency
    { wch: 26 }, // Goal
    { wch: 18 }, // Method
    { wch: 28 }, // Application
    { wch: 14 }, // Q1
    { wch: 14 }, // Q2
    { wch: 14 }, // Q3
    { wch: 14 }, // Q4
    { wch: 16 }, // Evaluation
    { wch: 20 }, // Type
    { wch: 28 }, // Strategy
    { wch: 28 }, // Skill Map
    { wch: 28 }, // Mission
  ];

  const sheetName = `IDP_${(plan.personnelName || 'Plan').slice(0, 20)}`.replace(/[:\\/?*[\]]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const fileName = `IDP_Action_Plan_${fiscalYear}_${(plan.personnelName || 'Staff').replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
