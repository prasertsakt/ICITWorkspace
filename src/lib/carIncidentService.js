// Real-Time CAR & Incident Service (Integrated Management System - ICIT)
// Implements KMUTNB Form: ICIT-FM-COMMON-013, 19 DEC 2025 Version 5.0
// Standard: ISO 9001:2015 & ISO/IEC 27001:2022

import { db, isFirebaseConfigured } from './firebase';
import { logActivity } from './activityLogService';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

export const LOCAL_KEY_CAR_INCIDENTS = 'icit_ims_car_incidents';
export const CAR_INCIDENT_STATUS = {
  NOT_YET_APPROVED: 'NOT_YET_APPROVED', // รอดำเนินการ / ยังไม่อนุมัติ
  ON_PROGRESS: 'ON_PROGRESS',           // กำลังดำเนินการ
  CLOSED: 'CLOSED',                     // ปิด CAR / สมบูรณ์
  CANCELLED: 'CANCELLED',               // ยกเลิก
};

export const CAR_INCIDENT_STATUS_INFO = {
  NOT_YET_APPROVED: {
    label: 'รอดำเนินการ (Not Yet Approved)',
    shortLabel: 'รอดำเนินการ',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
  },
  ON_PROGRESS: {
    label: 'กำลังดำเนินการ (On Progress)',
    shortLabel: 'กำลังดำเนินการ',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  CLOSED: {
    label: 'ปิดสมบูรณ์ (Closed)',
    shortLabel: 'ปิดสมบูรณ์',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
  },
  CANCELLED: {
    label: 'ยกเลิก (Cancelled)',
    shortLabel: 'ยกเลิก',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
  },
};

// Pub/Sub Single Shared Listener Cache
let carSubscribers = [];
let sharedCarsUnsubscribe = null;
let cachedCars = null;

function notifyCarSubscribers(data) {
  cachedCars = data;
  carSubscribers.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('CAR subscriber error:', e);
    }
  });
}

export const SEED_CAR_INCIDENTS = [
  {
    id: 'car-2569-001',
    docNumber: 'CAR-2569-001',
    docType: 'CAR',
    fiscalYear: '2569',
    status: 'ON_PROGRESS',
    standard: 'ISO 9001:2015',
    topic: 'Document and record control',
    clauses: '7.5',
    sourceAuditId: 'audit-2569-001',
    sourceAuditCode: 'IA-2569-001',
    requesters: [
      {
        id: 'p-1',
        name: 'รศ. ดร.ประเสริฐศักดิ์ เตียวงศ์สมบัติ',
        email: 'prasertsak.t@cit.kmutnb.ac.th',
        department: 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
      },
    ],
    requesterStatus: 'AUDITOR',
    problemStatus: 'INTERNAL',
    requestDate: '2026-09-10',
    description: 'พบว่าแบบฟอร์มขอปฏิบัติการแก้ไขในระบบสารสนเทศบางส่วนยังใช้ฉบับเก่า (Version 4.0) ซึ่งยังไม่สอดคล้องกับข้อกำหนดฉบับปรับปรุง Version 5.0 (NC)',
    requestees: [
      {
        id: 'p-2',
        name: 'นางสาวจารุชา เจือทอง',
        email: 'jarucha.j@icit.kmutnb.ac.th',
        department: 'ฝ่ายบริหารงานทั่วไป',
      },
      {
        id: 'p-3',
        name: 'นายกนก บรรเทิงจิตต์',
        email: 'kanok.b@icit.kmutnb.ac.th',
        department: 'ฝ่ายบริการสารสนเทศและสื่อการเรียนรู้',
      },
    ],
    immediateCorrection: 'ดำเนินการแจ้งเวียนยกเลิกการใช้งานแบบฟอร์ม Version 4.0 และอัปโหลดแบบฟอร์ม ICIT-FM-COMMON-013 Version 5.0 ขึ้นสู่ระบบ Intranet ทันที',
    rootCause: 'บุคลากรบางส่วนยังบันทึกไฟล์เทมเพลตเดิมไว้ในเครื่องคอมพิวเตอร์ส่วนบุคคล และยังไม่ได้ดาวน์โหลดไฟล์เวอร์ชันล่าสุดจากระบบ DCC',
    part2Date: '2026-09-11',
    part2SubmittedBy: 'นางสาวจารุชา เจือทอง',
    actionPlans: [
      {
        id: 'step-1',
        step: 'สำรวจและรวบรวมแบบฟอร์มควบคุมเอกสารทั้งหมดในทุกฝ่าย',
        responsiblePerson: 'นางสาวจารุชา เจือทอง',
        targetDate: '2026-09-20',
        completedDate: '2026-09-15',
        signature: 'จารุชา เจือทอง (2026-09-15)',
        remarks: 'ดำเนินการแล้วเสร็จ',
      },
      {
        id: 'step-2',
        step: 'จัดทำระบบตรวจสอบเวอร์ชันเอกสารอัตโนมัติบน Portal',
        responsiblePerson: 'นายกนก บรรเทิงจิตต์',
        targetDate: '2026-09-30',
        completedDate: '2026-09-25',
        signature: 'กนก บรรเทิงจิตต์ (2026-09-25)',
        remarks: 'ติดตั้งระบบเรียบร้อย',
      },
    ],
    executiveSignature: {
      name: 'รศ. ดร.ประเสริฐศักดิ์ เตียวงศ์สมบัติ',
      position: 'รองผู้อำนวยการฝ่ายบริหาร',
      date: '2026-09-12',
      signedByEmail: 'prasertsak.t@cit.kmutnb.ac.th',
    },
    notes: [
      {
        id: 'note-1',
        authorName: 'รศ. ดร.ประเสริฐศักดิ์ เตียวงศ์สมบัติ',
        authorEmail: 'prasertsak.t@cit.kmutnb.ac.th',
        content: 'อนุมัติแผนงาน Corrective Actions ขอให้เร่งรัดติดตามการสำรวจให้แล้วเสร็จตามกำหนด',
        createdAt: '2026-09-12T09:30:00.000Z',
      },
    ],
    createdAt: '2026-09-10T08:00:00.000Z',
    createdByEmail: 'prasertsak.t@cit.kmutnb.ac.th',
    createdByName: 'รศ. ดร.ประเสริฐศักดิ์ เตียวงศ์สมบัติ',
    updatedAt: '2026-09-12T09:30:00.000Z',
  },
];

/**
 * Recursively removes undefined fields so Firestore writes never fail with invalid data
 * and ensures minimal payload size
 */
export function cleanForFirestore(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj === undefined ? null : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForFirestore(item));
  }
  const cleaned = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = cleanForFirestore(val);
    }
  });
  return cleaned;
}

function initCarLocalStorage() {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(LOCAL_KEY_CAR_INCIDENTS);
  if (!raw || raw === '[]') {
    localStorage.setItem(LOCAL_KEY_CAR_INCIDENTS, JSON.stringify(SEED_CAR_INCIDENTS));
  }
}

/**
 * Subscribe to all CAR & Incident records with real-time Firestore sync & single shared listener
 */
export function subscribeCarIncidents(callback) {
  carSubscribers.push(callback);
  initCarLocalStorage();

  if (cachedCars) {
    callback(cachedCars);
  } else if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_CAR_INCIDENTS);
      const parsed = JSON.parse(raw || '[]');
      cachedCars = parsed;
      callback(parsed);
    } catch (e) {
      callback([]);
    }
  }

  // Cross-tab storage sync
  const handleStorageChange = (e) => {
    if (!e || e.key === LOCAL_KEY_CAR_INCIDENTS) {
      try {
        const raw = localStorage.getItem(LOCAL_KEY_CAR_INCIDENTS);
        const list = JSON.parse(raw || '[]');
        cachedCars = list;
        callback(list);
      } catch (err) {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
  }

  // Connect Firestore single listener if configured
  if (isFirebaseConfigured && db && !sharedCarsUnsubscribe) {
    try {
      const colRef = collection(db, 'ims_car_incidents');
      sharedCarsUnsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const list = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          list.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_KEY_CAR_INCIDENTS, JSON.stringify(list));
          }
          notifyCarSubscribers(list);
        },
        (err) => {
          console.warn('Firestore ims_car_incidents subscription warning (using local fallback):', err);
        }
      );
    } catch (err) {
      console.warn('Failed to attach Firestore car incidents listener:', err);
    }
  }

  return () => {
    carSubscribers = carSubscribers.filter((cb) => cb !== callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange);
    }
    if (carSubscribers.length === 0 && sharedCarsUnsubscribe) {
      sharedCarsUnsubscribe();
      sharedCarsUnsubscribe = null;
    }
  };
}

/**
 * Generate Next Running Document Number
 * Format: CAR-2569-001 or INC-2569-001
 */
export function generateCarIncidentDocNumber(fiscalYear, docType, existingRecords = []) {
  const year = fiscalYear || new Date().getFullYear() + 543;
  const prefix = docType === 'INCIDENT' ? 'INC' : 'CAR';
  const matching = existingRecords.filter((r) => {
    const isSameYear = String(r.fiscalYear) === String(year);
    const isSameType = (r.docType || 'CAR') === (docType || 'CAR');
    return isSameYear && isSameType;
  });

  let maxNum = 0;
  matching.forEach((r) => {
    if (r.docNumber) {
      const parts = r.docNumber.split('-');
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });

  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${prefix}-${year}-${nextNum}`;
}

/**
 * Create or Update a CAR / Incident Record
 */
export async function saveCarIncident(recordData, actor) {
  if (!recordData) throw new Error('ข้อมูลเอกสารไม่ถูกต้อง');

  let list = [];
  if (typeof window !== 'undefined') {
    try {
      list = JSON.parse(localStorage.getItem(LOCAL_KEY_CAR_INCIDENTS) || '[]');
    } catch (e) {
      list = [];
    }
  }

  const isNew = !recordData.id || !list.some((r) => r.id === recordData.id);
  const now = new Date().toISOString();

  let finalId = recordData.id;
  let finalDocNumber = recordData.docNumber;

  if (isNew) {
    const fiscalYear = recordData.fiscalYear || '2569';
    const docType = recordData.docType || 'CAR';
    finalDocNumber = finalDocNumber || generateCarIncidentDocNumber(fiscalYear, docType, list);
    finalId = `carinc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  const payload = {
    ...recordData,
    id: finalId,
    docNumber: finalDocNumber,
    docType: recordData.docType || 'CAR',
    fiscalYear: recordData.fiscalYear || '2569',
    status: recordData.status || CAR_INCIDENT_STATUS.NOT_YET_APPROVED,
    standard: recordData.standard || 'ISO 9001:2015',
    topic: recordData.topic || 'Management processes',
    clauses: recordData.clauses || '',
    sourceAuditId: recordData.sourceAuditId || null,
    sourceAuditCode: recordData.sourceAuditCode || null,

    // Part 1: ผู้ร้องขอการแก้ไข
    requesters: Array.isArray(recordData.requesters) ? recordData.requesters : [],
    requesterStatus: recordData.requesterStatus || 'AUDITOR', // AUDITOR, CUSTOMER, OTHER
    requesterStatusOther: recordData.requesterStatusOther || '',
    problemStatus: recordData.problemStatus || 'INTERNAL',     // INTERNAL, PREVENTIVE
    requestDate: recordData.requestDate || new Date().toISOString().split('T')[0],
    description: recordData.description || '',

    // ผู้รับการร้องขอ (Multiple persons)
    requestees: Array.isArray(recordData.requestees) ? recordData.requestees : [],

    // Part 2: ผู้รับการร้องขอ (Correction actions & Root Cause)
    immediateCorrection: recordData.immediateCorrection || '',
    rootCause: recordData.rootCause || '',
    part2Date: recordData.part2Date || '',
    part2SubmittedBy: recordData.part2SubmittedBy || '',

    // Part 3: Corrective actions
    actionPlans: Array.isArray(recordData.actionPlans) ? recordData.actionPlans : [],
    executiveSignature: recordData.executiveSignature || null,

    // Part 4: Evaluation
    followUpAuditor: recordData.followUpAuditor || null,
    followUpDate: recordData.followUpDate || '',
    followUpFindings: recordData.followUpFindings || '',
    followUpResult: recordData.followUpResult || null, // RESOLVED, INEFFECTIVE

    // Notes & Remarks
    notes: Array.isArray(recordData.notes) ? recordData.notes : [],

    createdAt: isNew ? now : recordData.createdAt || now,
    createdByEmail: isNew ? actor?.email || '' : recordData.createdByEmail || actor?.email || '',
    createdByName: isNew ? actor?.name || 'ระบบ' : recordData.createdByName || actor?.name || 'ระบบ',
    updatedAt: now,
  };

  // 1. Update Local Storage
  const existingIdx = list.findIndex((r) => r.id === finalId);
  if (existingIdx >= 0) {
    list[existingIdx] = payload;
  } else {
    list.unshift(payload);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_CAR_INCIDENTS, JSON.stringify(list));
  }
  notifyCarSubscribers(list);

  // 2. Sync to Firestore
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'ims_car_incidents', finalId);
      await setDoc(docRef, cleanForFirestore(payload), { merge: true });
    } catch (e) {
      console.warn('Firestore setDoc ims_car_incidents warning:', e);
    }
  }

  // 3. Log Activity
  try {
    await logActivity({
      type: isNew ? 'CAR_CREATED' : 'CAR_UPDATED',
      action: isNew ? 'สร้างเอกสาร CAR/Incident' : 'แก้ไขเอกสาร CAR/Incident',
      details: `${isNew ? 'สร้าง' : 'แก้ไข'} ${payload.docNumber} (${payload.docType}): ${payload.topic || '-'} [สถานะ: ${CAR_INCIDENT_STATUS_INFO[payload.status]?.shortLabel || payload.status}]`,
      actorEmail: actor?.email,
      actorName: actor?.name,
      metadata: { id: payload.id, docNumber: payload.docNumber, status: payload.status, fiscalYear: payload.fiscalYear },
    });
  } catch (e) {}

  // 4. Send Initial Email Notification on Create
  if (isNew && payload.requestees && payload.requestees.length > 0) {
    triggerCarIncidentEmail({
      record: payload,
      eventType: 'NEW_CAR_ISSUED',
      actor,
    }).catch((err) => console.warn('Email dispatch warning:', err));
  }

  return payload;
}

/**
 * Delete a CAR / Incident Record
 * STRICT RULE: Only DCC or Admin can delete, AND status CANNOT be CLOSED.
 */
export async function deleteCarIncident(carId, actor, yearlyConfig, isAdmin) {
  if (!carId) throw new Error('ID ไม่ถูกต้อง');

  let list = [];
  if (typeof window !== 'undefined') {
    try {
      list = JSON.parse(localStorage.getItem(LOCAL_KEY_CAR_INCIDENTS) || '[]');
    } catch (e) {
      list = [];
    }
  }

  const record = list.find((r) => r.id === carId);
  if (!record) throw new Error('ไม่พบข้อมูลเอกสาร');

  // Verify deletion permission
  const canDelete = canUserDeleteCarIncident(record, actor, null, yearlyConfig, isAdmin);
  if (!canDelete) {
    if (record.status === CAR_INCIDENT_STATUS.CLOSED) {
      throw new Error('ไม่สามารถลบเอกสารที่ปิดสมบูรณ์แล้ว (Closed) ได้');
    }
    throw new Error('คุณไม่มีสิทธิ์ในการลบเอกสารนี้ (สิทธิ์เฉพาะ DCC หรือ Admin เท่านั้น)');
  }

  // 1. Remove from Local Storage
  const updatedList = list.filter((r) => r.id !== carId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_CAR_INCIDENTS, JSON.stringify(updatedList));
  }
  notifyCarSubscribers(updatedList);

  // 2. Remove from Firestore
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'ims_car_incidents', carId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore deleteDoc ims_car_incidents warning:', e);
    }
  }

  // 3. Log Activity
  try {
    await logActivity({
      type: 'CAR_DELETED',
      action: 'ลบเอกสาร CAR/Incident',
      details: `ลบเอกสาร ${record.docNumber} (${record.docType}) ปีงบประมาณ ${record.fiscalYear}`,
      actorEmail: actor?.email,
      actorName: actor?.name,
      metadata: { id: record.id, docNumber: record.docNumber },
    });
  } catch (e) {}

  return true;
}

/**
 * Update Document Status
 * STRICT RULE: Only รองผู้อำนวยการฝ่ายบริหาร or DCC (or Admin) can manage the status
 */
export async function updateCarIncidentStatus(carId, newStatus, reason = '', actor, yearlyConfig, isAdmin) {
  if (!carId) throw new Error('ID ไม่ถูกต้อง');

  let list = [];
  if (typeof window !== 'undefined') {
    try {
      list = JSON.parse(localStorage.getItem(LOCAL_KEY_CAR_INCIDENTS) || '[]');
    } catch (e) {
      list = [];
    }
  }

  const record = list.find((r) => r.id === carId);
  if (!record) throw new Error('ไม่พบข้อมูลเอกสาร');

  const canManage = canUserManageCarIncidentStatus(record, actor, null, yearlyConfig, isAdmin);
  if (!canManage) {
    throw new Error('คุณไม่มีสิทธิ์เปลี่ยนสถานะเอกสารนี้ (สิทธิ์เฉพาะ รองผู้อำนวยการฝ่ายบริหาร, DCC หรือ Admin)');
  }

  const oldStatus = record.status;
  const now = new Date().toISOString();

  // Add a status note if reason is provided
  const notes = Array.isArray(record.notes) ? [...record.notes] : [];
  if (reason.trim()) {
    notes.push({
      id: `note-${Date.now()}`,
      authorName: actor?.name || 'ผู้จัดการสถานะ',
      authorEmail: actor?.email || '',
      content: `[เปลี่ยนสถานะเป็น ${CAR_INCIDENT_STATUS_INFO[newStatus]?.shortLabel || newStatus}] ${reason.trim()}`,
      createdAt: now,
    });
  }

  const updatedRecord = {
    ...record,
    status: newStatus,
    notes,
    updatedAt: now,
  };

  // Update storage & Firestore
  const idx = list.findIndex((r) => r.id === carId);
  if (idx >= 0) {
    list[idx] = updatedRecord;
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_CAR_INCIDENTS, JSON.stringify(list));
  }
  notifyCarSubscribers(list);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'ims_car_incidents', carId);
      // Optimized delta write: only update status, notes, and timestamp
      await setDoc(
        docRef,
        cleanForFirestore({
          status: newStatus,
          notes,
          updatedAt: now,
        }),
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore updateCarIncidentStatus warning:', e);
    }
  }

  try {
    await logActivity({
      type: 'CAR_STATUS_CHANGED',
      action: 'ปรับเปลี่ยนสถานะ CAR/Incident',
      details: `เปลี่ยนสถานะ ${record.docNumber} จาก ${CAR_INCIDENT_STATUS_INFO[oldStatus]?.shortLabel || oldStatus} เป็น ${CAR_INCIDENT_STATUS_INFO[newStatus]?.shortLabel || newStatus}`,
      actorEmail: actor?.email,
      actorName: actor?.name,
      metadata: { id: record.id, oldStatus, newStatus, reason },
    });
  } catch (e) {}

  // Send email notifications for status change
  triggerCarIncidentEmail({
    record: updatedRecord,
    eventType: 'STATUS_CHANGED',
    oldStatus,
    newStatus,
    actor,
  }).catch((err) => console.warn('Email dispatch warning:', err));

  return updatedRecord;
}

/**
 * Add a Note/Remark to the CAR / Incident
 */
export async function addCarIncidentNote(carId, noteContent, actor) {
  if (!carId || !noteContent?.trim()) throw new Error('ข้อความบันทึกไม่ถูกต้อง');

  let list = [];
  if (typeof window !== 'undefined') {
    try {
      list = JSON.parse(localStorage.getItem(LOCAL_KEY_CAR_INCIDENTS) || '[]');
    } catch (e) {
      list = [];
    }
  }

  const record = list.find((r) => r.id === carId);
  if (!record) throw new Error('ไม่พบข้อมูลเอกสาร');

  const now = new Date().toISOString();
  const newNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    authorName: actor?.name || 'ผู้บันทึก',
    authorEmail: actor?.email || '',
    content: noteContent.trim(),
    createdAt: now,
  };

  const notes = Array.isArray(record.notes) ? [newNote, ...record.notes] : [newNote];
  const updatedRecord = { ...record, notes, updatedAt: now };

  const idx = list.findIndex((r) => r.id === carId);
  if (idx >= 0) list[idx] = updatedRecord;

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_CAR_INCIDENTS, JSON.stringify(list));
  }
  notifyCarSubscribers(list);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'ims_car_incidents', carId);
      await setDoc(docRef, cleanForFirestore({ notes, updatedAt: now }), { merge: true });
    } catch (e) {}
  }

  try {
    await logActivity({
      type: 'CAR_NOTE_ADDED',
      action: 'เพิ่มบันทึกข้อความใน CAR/Incident',
      details: `เพิ่มบันทึกในเอกสาร ${record.docNumber}: ${noteContent.slice(0, 50)}...`,
      actorEmail: actor?.email,
      actorName: actor?.name,
    });
  } catch (e) {}

  return updatedRecord;
}

/**
 * Sign an Action Step in Part 3
 * "the signatures can be confirmation button with date recorded"
 */
export async function confirmActionStepSignature(carId, stepId, actor) {
  if (!carId || !stepId) throw new Error('ข้อมูลขั้นตอนไม่ถูกต้อง');

  let list = [];
  if (typeof window !== 'undefined') {
    try {
      list = JSON.parse(localStorage.getItem(LOCAL_KEY_CAR_INCIDENTS) || '[]');
    } catch (e) {
      list = [];
    }
  }

  const record = list.find((r) => r.id === carId);
  if (!record) throw new Error('ไม่พบข้อมูลเอกสาร');

  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];

  const actionPlans = (record.actionPlans || []).map((step) => {
    if (step.id === stepId) {
      return {
        ...step,
        completedDate: step.completedDate || dateStr,
        signature: `${actor?.name || 'ผู้รับผิดชอบ'} (${dateStr})`,
        signedByEmail: actor?.email || '',
        signedAt: now,
      };
    }
    return step;
  });

  const updatedRecord = {
    ...record,
    actionPlans,
    updatedAt: now,
  };

  const idx = list.findIndex((r) => r.id === carId);
  if (idx >= 0) list[idx] = updatedRecord;

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_CAR_INCIDENTS, JSON.stringify(list));
  }
  notifyCarSubscribers(list);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'ims_car_incidents', carId);
      await setDoc(docRef, cleanForFirestore({ actionPlans, updatedAt: now }), { merge: true });
    } catch (e) {}
  }

  return updatedRecord;
}

/**
 * Sign Executive Approval in Part 3
 * รองผู้อำนวยการฝ่ายบริหาร / ตัวแทนฝ่ายบริหาร
 */
export async function confirmExecutiveSignature(carId, actor, position = 'รองผู้อำนวยการฝ่ายบริหาร') {
  if (!carId) throw new Error('ข้อมูลเอกสารไม่ถูกต้อง');

  let list = [];
  if (typeof window !== 'undefined') {
    try {
      list = JSON.parse(localStorage.getItem(LOCAL_KEY_CAR_INCIDENTS) || '[]');
    } catch (e) {
      list = [];
    }
  }

  const record = list.find((r) => r.id === carId);
  if (!record) throw new Error('ไม่พบข้อมูลเอกสาร');

  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];

  const executiveSignature = {
    name: actor?.name || 'รศ. ดร.ประเสริฐศักดิ์ เตียวงศ์สมบัติ',
    position,
    date: dateStr,
    signedByEmail: actor?.email || '',
    signedAt: now,
  };

  const updatedRecord = {
    ...record,
    executiveSignature,
    updatedAt: now,
  };

  const idx = list.findIndex((r) => r.id === carId);
  if (idx >= 0) list[idx] = updatedRecord;

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_CAR_INCIDENTS, JSON.stringify(list));
  }
  notifyCarSubscribers(list);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'ims_car_incidents', carId);
      await setDoc(docRef, cleanForFirestore({ executiveSignature, updatedAt: now }), { merge: true });
    } catch (e) {}
  }

  return updatedRecord;
}

/**
 * Check if all action steps in Part 3 are completed
 */
export function isPart3AllStepsCompleted(record) {
  if (!record || !Array.isArray(record.actionPlans) || record.actionPlans.length === 0) {
    return false;
  }
  return record.actionPlans.every((step) => Boolean(step.completedDate && step.signature));
}

/**
 * Check if Part 4 can be proposed/evaluated:
 * Precondition: Must be in ON_PROGRESS status AND complete all steps in Part 3
 */
export function canProposePart4(record) {
  if (!record) return false;
  if (record.status !== CAR_INCIDENT_STATUS.ON_PROGRESS) return false;
  return isPart3AllStepsCompleted(record);
}

/**
 * Check if the user is in the list of ผู้รับการร้องขอ (Requestees)
 */
export function isUserInRequestees(record, user, personnel) {
  if (!record || !record.requestees || !Array.isArray(record.requestees)) return false;
  const userEmail = (user?.email || personnel?.email || '').toLowerCase().trim();
  const personId = personnel?.id;

  return record.requestees.some((r) => {
    if (personId && r.id && r.id === personId) return true;
    if (userEmail && r.email && r.email.toLowerCase().trim() === userEmail) return true;
    return false;
  });
}

/**
 * Check if the user is in the list of ผู้ร้องขอการแก้ไข (Requesters)
 */
export function isUserInRequesters(record, user, personnel) {
  if (!record || !record.requesters || !Array.isArray(record.requesters)) return false;
  const userEmail = (user?.email || personnel?.email || '').toLowerCase().trim();
  const personId = personnel?.id;

  return record.requesters.some((r) => {
    if (personId && r.id && r.id === personId) return true;
    if (userEmail && r.email && r.email.toLowerCase().trim() === userEmail) return true;
    return false;
  });
}

/**
 * Check if user is รองผู้อำนวยการฝ่ายบริหาร
 */
export function isDeputyDirectorUser(user, personnel, isAdmin) {
  if (isAdmin) return true;
  const email = (user?.email || personnel?.email || '').toLowerCase().trim();
  if (email === 'prasertsak.t@cit.kmutnb.ac.th' || email === 'tiawongsombat@gmail.com') return true;
  const pos = personnel?.position || '';
  const note = personnel?.note || '';
  return pos.includes('รองผู้อำนวยการฝ่ายบริหาร') || note.includes('รองผู้อำนวยการฝ่ายบริหาร');
}

/**
 * Check if user is DCC (ผู้ควบคุมเอกสาร)
 */
export function isDccUser(user, personnel, yearlyConfig, isAdmin) {
  if (isAdmin) return true;
  if (!user && !personnel) return false;
  const userEmail = (user?.email || personnel?.email || '').toLowerCase().trim();
  const personId = personnel?.id;

  if (yearlyConfig?.dccEmail && yearlyConfig.dccEmail.toLowerCase().trim() === userEmail) {
    return true;
  }
  if (yearlyConfig?.dccId && personId && yearlyConfig.dccId === personId) {
    return true;
  }
  return false;
}

/**
 * Check permission to manage status (รองผู้อำนวยการฝ่ายบริหาร, DCC, or Admin)
 */
export function canUserManageCarIncidentStatus(record, user, personnel, yearlyConfig, isAdmin) {
  if (isAdmin) return true;
  if (isDeputyDirectorUser(user, personnel, isAdmin)) return true;
  if (isDccUser(user, personnel, yearlyConfig, isAdmin)) return true;
  return false;
}

/**
 * Check permission to edit Part 1 and Part 4
 * Users who are in list of ผู้ร้องขอการแก้ไข (or Admin)
 */
export function canUserEditPart1And4(record, user, personnel, yearlyConfig, isAdmin) {
  if (isAdmin) return true;
  return isUserInRequesters(record, user, personnel);
}

/**
 * Check permission to edit Part 2 and Part 3
 * Users who are in list of ผู้รับการร้องขอ (or Admin)
 */
export function canUserEditPart2And3(record, user, personnel, isAdmin) {
  if (isAdmin) return true;
  return isUserInRequestees(record, user, personnel);
}

/**
 * Check permission to delete document
 * STRICT RULE: Only DCC (or Admin) can delete, AND status CANNOT be CLOSED.
 */
export function canUserDeleteCarIncident(record, user, personnel, yearlyConfig, isAdmin) {
  if (!record) return false;
  if (record.status === CAR_INCIDENT_STATUS.CLOSED) {
    return false; // Permanent lock
  }
  return isDccUser(user, personnel, yearlyConfig, isAdmin);
}

/**
 * DCC Reminder Email Dispatcher
 * Allows DCC to re-notify pending stakeholders with the envelope icon
 */
export async function sendCarIncidentReminder(record, actor, customMessage = '') {
  if (!record) throw new Error('ไม่พบข้อมูลเอกสาร');

  // Determine who is currently pending action
  let recipientEmails = [];
  let pendingRoleDescription = '';

  if (record.status === CAR_INCIDENT_STATUS.NOT_YET_APPROVED) {
    // Waiting for Part 2 & 3 from Requestees OR status approval from Deputy/DCC
    if (!record.immediateCorrection || !record.actionPlans?.length) {
      recipientEmails = (record.requestees || []).map((r) => r.email).filter(Boolean);
      pendingRoleDescription = 'ผู้รับการร้องขอ / ผู้รับผิดชอบบริการ (รอจัดทำแนวทางแก้ไขเบื้องต้นและแผนการปฏิบัติ)';
    } else {
      pendingRoleDescription = 'รองผู้อำนวยการฝ่ายบริหาร และ DCC (รอพิจารณาอนุมัติให้เริ่มดำเนินการ)';
    }
  } else if (record.status === CAR_INCIDENT_STATUS.ON_PROGRESS) {
    if (!isPart3AllStepsCompleted(record)) {
      recipientEmails = (record.requestees || []).map((r) => r.email).filter(Boolean);
      pendingRoleDescription = 'ผู้รับการร้องขอ (รอดำเนินการตามแผน Corrective Actions ให้แล้วเสร็จทุกขั้นตอน)';
    } else {
      recipientEmails = (record.requesters || []).map((r) => r.email).filter(Boolean);
      pendingRoleDescription = 'ผู้ตรวจติดตามภายใน / ผู้ร้องขอ (รอดำเนินการตรวจติดตามและประเมินผลการแก้ไขในส่วนที่ 4)';
    }
  }

  if (recipientEmails.length === 0) {
    // Fallback to all stakeholders
    const allEmails = [
      ...(record.requestees || []).map((r) => r.email),
      ...(record.requesters || []).map((r) => r.email),
    ].filter(Boolean);
    recipientEmails = [...new Set(allEmails)];
  }

  if (recipientEmails.length === 0) {
    throw new Error('ไม่พบอีเมลผู้เกี่ยวข้องสำหรับส่งการแจ้งเตือน');
  }

  const subject = `[แจ้งเตือนการปฏิบัติงาน] ${record.docNumber} (${record.docType}) - ${record.topic}`;
  const htmlBody = `
    <div style="font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FFFFFF; color: #1E293B;">
      <div style="text-align: center; border-bottom: 2px solid #0D9488; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 12px; font-weight: bold; color: #0D9488; letter-spacing: 1px; text-transform: uppercase;">ICIT Integrated Management System (IMS)</span>
        <h2 style="margin: 8px 0 0 0; color: #0F172A; font-size: 20px;">แจ้งเตือนติดตามความคืบหน้า CAR & Incident</h2>
        <div style="font-size: 13px; color: #64748B; margin-top: 4px;">แบบฟอร์มขอปฏิบัติการแก้ไข (ICIT-FM-COMMON-013, Version 5.0)</div>
      </div>

      <p style="font-size: 14px; line-height: 1.6;">เรียน ผู้เกี่ยวข้องทุกท่าน,</p>
      <p style="font-size: 14px; line-height: 1.6;">
        ผู้ควบคุมเอกสาร (DCC) ขอส่งการแจ้งเตือนเพื่อติดตามความคืบหน้าการดำเนินการในระบบบริหารงาน IMS สำหรับเอกสารหมายเลข <strong>${record.docNumber}</strong>
      </p>

      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748B; width: 35%;"><strong>เลขที่เอกสาร:</strong></td>
            <td style="padding: 6px 0; font-weight: bold; color: #0D9488;">${record.docNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>ประเภท:</strong></td>
            <td style="padding: 6px 0;">${record.docType === 'INCIDENT' ? 'Incident (อุบัติการณ์)' : 'CAR (ใบแจ้งการแก้ไขและป้องกัน)'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>ปีงบประมาณ:</strong></td>
            <td style="padding: 6px 0;">${record.fiscalYear}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>หัวข้อตรวจติดตาม:</strong></td>
            <td style="padding: 6px 0;">${record.topic}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>สถานะปัจจุบัน:</strong></td>
            <td style="padding: 6px 0; font-weight: bold;">${CAR_INCIDENT_STATUS_INFO[record.status]?.label || record.status}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>ขั้นตอนที่รอการดำเนินการ:</strong></td>
            <td style="padding: 6px 0; color: #D97706; font-weight: bold;">${pendingRoleDescription}</td>
          </tr>
        </table>
      </div>

      ${customMessage ? `
      <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 16px 0; border-radius: 4px; font-size: 13px; color: #92400E;">
        <strong>ข้อความเพิ่มเติมจาก DCC:</strong><br/>
        ${customMessage}
      </div>
      ` : ''}

      <div style="text-align: center; margin: 28px 0;">
        <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/ims/car-incident" style="background-color: #0D9488; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
          เข้าสู่ระบบ CAR & Incident Hub
        </a>
      </div>

      <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #94A3B8; text-align: center;">
        ส่งโดย: ${actor?.name || 'ผู้ควบคุมเอกสาร (DCC)'} &bull; สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT) มจพ.
      </div>
    </div>
  `;

  let webhookUrl = '';
  if (typeof window !== 'undefined') {
    try {
      const emailConfig = JSON.parse(localStorage.getItem('icit_email_notification_config') || '{}');
      webhookUrl = emailConfig.googleAppsScriptUrl || '';
    } catch (e) {}
  }

  const logEntry = {
    id: `email-car-${Date.now()}`,
    recordId: record.id,
    targetStep: 'DCC_REMINDER',
    recipientEmail: recipientEmails.join(', '),
    recipientName: recipientEmails.join(', '),
    recipientRole: pendingRoleDescription,
    subject,
    sentAt: new Date().toISOString(),
    status: 'PENDING',
    senderName: actor?.name || 'DCC (ผู้ควบคุมเอกสาร)',
  };

  try {
    const resp = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipientEmails.join(','),
        subject,
        htmlBody,
        senderName: actor?.name || 'DCC (ผู้ควบคุมเอกสาร)',
        webhookUrl,
      }),
    });
    const resData = await resp.json().catch(() => ({}));
    if (resp.ok && resData.success) {
      logEntry.status = resData.simulated ? 'SIMULATED' : 'DELIVERED';
    } else {
      logEntry.status = 'FAILED';
      logEntry.error = resData.message || resData.error;
    }
  } catch (err) {
    logEntry.status = 'FAILED';
    logEntry.error = err.message;
  }

  // Save log
  if (typeof window !== 'undefined') {
    try {
      const logs = JSON.parse(localStorage.getItem('icit_sent_email_logs') || '[]');
      logs.unshift(logEntry);
      if (logs.length > 100) logs.pop();
      localStorage.setItem('icit_sent_email_logs', JSON.stringify(logs));
    } catch (e) {}
  }

  // Record reminder in activity log
  try {
    await logActivity({
      type: 'CAR_REMINDER_SENT',
      action: 'ส่งอีเมลแจ้งเตือน CAR/Incident โดย DCC',
      details: `ส่งการแจ้งเตือนสำหรับ ${record.docNumber} ไปยัง: ${recipientEmails.join(', ')}`,
      actorEmail: actor?.email,
      actorName: actor?.name,
    });
  } catch (e) {}

  return logEntry;
}

/**
 * Trigger Automated Workflow Email Notifications
 */
async function triggerCarIncidentEmail({ record, eventType, oldStatus, newStatus, actor }) {
  if (!record) return;

  let recipients = [];
  let subject = '';
  let heading = '';
  let detailsText = '';

  if (eventType === 'NEW_CAR_ISSUED') {
    recipients = (record.requestees || []).map((r) => r.email).filter(Boolean);
    subject = `[แจ้งออกเอกสารใหม่] ${record.docNumber} (${record.docType}) - ${record.topic}`;
    heading = 'แจ้งการออกเอกสารขอปฏิบัติการแก้ไข (CAR) / อุบัติการณ์';
    detailsText = `ท่านได้รับการระบุเป็นผู้รับการร้องขอ/ผู้รับผิดชอบบริการ โปรดเข้าสู่ระบบเพื่อจัดทำแนวทางการแก้ไขปัญหาเบื้องต้น (Correction actions) และสาเหตุของปัญหาในส่วนที่ 2 รวมถึงแผนการปฏิบัติในส่วนที่ 3`;
  } else if (eventType === 'STATUS_CHANGED') {
    recipients = [
      ...(record.requestees || []).map((r) => r.email),
      ...(record.requesters || []).map((r) => r.email),
    ].filter(Boolean);
    subject = `[อัปเดตสถานะ] ${record.docNumber} เปลี่ยนเป็น ${CAR_INCIDENT_STATUS_INFO[newStatus]?.shortLabel || newStatus}`;
    heading = 'แจ้งเตือนการปรับเปลี่ยนสถานะเอกสาร CAR / Incident';
    detailsText = `สถานะเอกสารถูกปรับเปลี่ยนเป็น: <strong>${CAR_INCIDENT_STATUS_INFO[newStatus]?.label || newStatus}</strong> โดย ${actor?.name || 'เจ้าหน้าที่'}`;
  }

  recipients = [...new Set(recipients)];
  if (recipients.length === 0) return;

  const htmlBody = `
    <div style="font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FFFFFF; color: #1E293B;">
      <div style="text-align: center; border-bottom: 2px solid #0D9488; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 12px; font-weight: bold; color: #0D9488; letter-spacing: 1px;">ICIT INTEGRATED MANAGEMENT SYSTEM</span>
        <h2 style="margin: 8px 0 0 0; color: #0F172A; font-size: 20px;">${heading}</h2>
      </div>
      <p style="font-size: 14px; line-height: 1.6;">${detailsText}</p>
      <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin: 18px 0; font-size: 13px;">
        <div><strong>เลขที่เอกสาร:</strong> <span style="color: #0D9488; font-weight: bold;">${record.docNumber}</span></div>
        <div style="margin-top: 6px;"><strong>หัวข้อ:</strong> ${record.topic}</div>
        <div style="margin-top: 6px;"><strong>มาตรฐาน:</strong> ${record.standard}</div>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/ims/car-incident" style="background-color: #0D9488; color: #FFFFFF; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
          เปิดดูเอกสารในระบบ
        </a>
      </div>
    </div>
  `;

  let webhookUrl = '';
  if (typeof window !== 'undefined') {
    try {
      const emailConfig = JSON.parse(localStorage.getItem('icit_email_notification_config') || '{}');
      webhookUrl = emailConfig.googleAppsScriptUrl || '';
    } catch (e) {}
  }

  try {
    await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipients.join(','),
        subject,
        htmlBody,
        senderName: 'ระบบบริหารงาน IMS (ICIT)',
        webhookUrl,
      }),
    });
  } catch (err) {
    console.warn('triggerCarIncidentEmail fetch failed:', err);
  }
}
