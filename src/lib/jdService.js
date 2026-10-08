// Real-Time JD Hub Service: Synchronized with Firebase Firestore & Offline Fallback
import { db, isFirebaseConfigured } from './firebase';
import { SAMPLE_SEED_JD, normalizeCoreCompetencies } from './jdTemplateData';
import { formatLocalDate } from './dateUtils';
import { logActivity, ACTIVITY_CATEGORIES } from './activityLogService';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

const LOCAL_KEY_JDS = 'icit_job_descriptions';
const LOCAL_KEY_JD_CONFIG = 'icit_jd_hub_config';

export const DEFAULT_JD_CONFIG = {
  isRevisionOpen: true,
  startDate: '2026-09-01',
  endDate: '2026-10-31',
  announcement: 'ช่วงเวลาเปิดให้บุคลากรตรวจสอบ ทบทวน และยืนยันแบบบรรยายลักษณะงาน (Job Description) ประจำปีงบประมาณ 2570',
  updatedAt: new Date().toISOString(),
  updatedBy: 'ผู้ดูแลระบบ',
};

// Internal pub/sub subscribers & Single Shared Listeners
let jdSubscribers = [];
let sharedJDUnsub = null;
let cachedJDList = null;

let jdConfigSubscribers = [];
let sharedJDConfigUnsub = null;
let cachedJDConfig = null;

function notifyJDSubscribers(data) {
  const cloned = Array.isArray(data) ? [...data] : [];
  cachedJDList = cloned;
  jdSubscribers.forEach((cb) => {
    try {
      cb(cloned);
    } catch (e) {
      console.error('JD subscriber error:', e);
    }
  });
}

function notifyJDConfigSubscribers(data) {
  cachedJDConfig = data;
  jdConfigSubscribers.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('JD config subscriber error:', e);
    }
  });
}

/**
 * Initialize local storage with seed data if empty
 */
function initJDLocalStorage() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(LOCAL_KEY_JDS)) {
    localStorage.setItem(LOCAL_KEY_JDS, JSON.stringify([SAMPLE_SEED_JD]));
  }
  if (!localStorage.getItem(LOCAL_KEY_JD_CONFIG)) {
    localStorage.setItem(LOCAL_KEY_JD_CONFIG, JSON.stringify(DEFAULT_JD_CONFIG));
  }
}

/**
 * Check if the Revisable Window is currently open
 */
export function isRevisionWindowOpen(config = null) {
  const cfg = config || getJDConfig();
  const isEnabled = cfg ? (cfg.isRevisionOpen !== undefined ? cfg.isRevisionOpen : (cfg.isOpen !== undefined ? cfg.isOpen : false)) : false;
  
  if (!cfg || !isEnabled) {
    return {
      isOpen: false,
      daysRemaining: 0,
      reason: 'ผู้ดูแลระบบยังไม่ได้เปิดช่วงเวลาแก้ไข',
      message: 'ปิดรับการแก้ไขแบบบรรยายลักษณะงาน (อยู่ในโหมดดูเอกสารเท่านั้น)',
    };
  }

  const todayStr = formatLocalDate(new Date());
  if (cfg.startDate && todayStr < cfg.startDate) {
    return {
      isOpen: false,
      daysRemaining: 0,
      reason: `จะเปิดให้แก้ไขในวันที่ ${cfg.startDate}`,
      message: `จะเปิดให้แก้ไขในวันที่ ${cfg.startDate}`,
    };
  }

  if (cfg.endDate && todayStr > cfg.endDate) {
    return {
      isOpen: false,
      daysRemaining: 0,
      reason: `สิ้นสุดช่วงเวลาแก้ไขแล้วเมื่อวันที่ ${cfg.endDate}`,
      message: `สิ้นสุดช่วงเวลาแก้ไขแล้วเมื่อวันที่ ${cfg.endDate}`,
    };
  }

  // Calculate remaining days
  let daysRemaining = 999;
  if (cfg.endDate) {
    const end = new Date(cfg.endDate);
    const today = new Date(todayStr);
    const diff = end - today;
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return {
    isOpen: true,
    daysRemaining,
    reason: `เปิดให้แก้ไขจนถึง ${cfg.endDate || 'ไม่มีกำหนด'}`,
    message: cfg.endDate ? `เปิดให้แก้ไขจนถึงวันที่ ${cfg.endDate} (เหลือเวลาอีก ${daysRemaining} วัน)` : 'เปิดให้แก้ไข (ไม่มีกำหนดสิ้นสุด)',
  };
}

/**
 * Get cached JD config
 */
export function getJDConfig() {
  if (cachedJDConfig !== null) return cachedJDConfig;
  initJDLocalStorage();
  if (typeof window === 'undefined') return DEFAULT_JD_CONFIG;
  try {
    const raw = localStorage.getItem(LOCAL_KEY_JD_CONFIG);
    const parsed = raw ? JSON.parse(raw) : DEFAULT_JD_CONFIG;
    cachedJDConfig = parsed;
    return parsed;
  } catch {
    return DEFAULT_JD_CONFIG;
  }
}

/**
 * Save Revisable Window configuration (Admin only)
 */
export async function saveJDConfig(newConfig, actorPersonnel) {
  initJDLocalStorage();
  const isRevisionOpen = newConfig.isRevisionOpen !== undefined 
    ? newConfig.isRevisionOpen 
    : (newConfig.isOpen !== undefined ? newConfig.isOpen : true);

  const updated = {
    ...DEFAULT_JD_CONFIG,
    ...newConfig,
    isRevisionOpen,
    isOpen: isRevisionOpen,
    updatedAt: new Date().toISOString(),
    updatedBy: actorPersonnel?.name || 'Admin',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_JD_CONFIG, JSON.stringify(updated));
  }
  notifyJDConfigSubscribers(updated);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'settings', 'jd_hub_config'), updated, { merge: true });
    } catch (e) {
      console.error('Failed to sync JD config to Firestore', e);
    }
  }

  logActivity({
    action: 'UPDATE_JD_CONFIG',
    category: ACTIVITY_CATEGORIES.JD_HUB,
    status: 'SUCCESS',
    title: `ปรับปรุงการตั้งค่าช่วงเวลาแก้ไขแบบบรรยายลักษณะงาน (JD)`,
    details: `สถานะเปิดรับ: ${isRevisionOpen ? 'เปิด' : 'ปิด'} (${updated.startDate || '-'} ถึง ${updated.endDate || '-'})`,
    actor: actorPersonnel ? { id: actorPersonnel.id || actorPersonnel.email, name: actorPersonnel.name, email: actorPersonnel.email, role: actorPersonnel.role } : null,
    metadata: { isRevisionOpen, startDate: updated.startDate, endDate: updated.endDate },
  });

  return { success: true, config: updated };
}

/**
 * Subscribe to JD Config changes
 * OPTIMIZED: Single shared Firestore onSnapshot listener
 */
export function subscribeJDConfig(callback) {
  initJDLocalStorage();
  jdConfigSubscribers.push(callback);

  // 1. Emit cached config immediately (0ms)
  const cached = getJDConfig();
  callback(cached);

  // 2. Start SINGLE shared listener if not already active
  if (isFirebaseConfigured && db && !sharedJDConfigUnsub) {
    try {
      sharedJDConfigUnsub = onSnapshot(
        doc(db, 'settings', 'jd_hub_config'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_KEY_JD_CONFIG, JSON.stringify(data));
            }
            notifyJDConfigSubscribers(data);
          }
        },
        (err) => {
          console.warn('Firestore JD Config onSnapshot error, fallback to local', err);
        }
      );
    } catch (e) {
      console.error('Failed to attach JD Config listener', e);
    }
  }

  return () => {
    jdConfigSubscribers = jdConfigSubscribers.filter((cb) => cb !== callback);
    if (jdConfigSubscribers.length === 0 && sharedJDConfigUnsub) {
      sharedJDConfigUnsub();
      sharedJDConfigUnsub = null;
    }
  };
}


/**
 * Helper to normalize a JD record's coreCompetencies
 */
function sanitizeJDRecord(jd) {
  if (!jd) return jd;
  const coreCompetencies = normalizeCoreCompetencies(jd.coreCompetencies);
  return {
    ...jd,
    coreCompetencies,
  };
}

/**
 * Get all JDs (local / cached)
 */
export function getJDList() {
  initJDLocalStorage();
  if (typeof window === 'undefined') return [sanitizeJDRecord(SAMPLE_SEED_JD)];
  try {
    const raw = localStorage.getItem(LOCAL_KEY_JDS);
    const parsed = raw ? JSON.parse(raw) : [SAMPLE_SEED_JD];
    return Array.isArray(parsed) ? parsed.map(sanitizeJDRecord) : [sanitizeJDRecord(SAMPLE_SEED_JD)];
  } catch {
    return [sanitizeJDRecord(SAMPLE_SEED_JD)];
  }
}

/**
 * Get single JD by ID
 */
export async function getJDById(id) {
  if (!id) return null;
  const list = getJDList();
  const localItem = list.find((j) => j.id === id);

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'job_descriptions', id));
      if (snap.exists()) {
        return sanitizeJDRecord({ id: snap.id, ...snap.data() });
      }
    } catch (e) {
      console.error('Error fetching JD from Firestore', e);
    }
  }

  return localItem ? sanitizeJDRecord(localItem) : null;
}

/**
 * Subscribe to Real-Time Job Descriptions list
 * OPTIMIZED: Single shared Firestore onSnapshot listener
 */
export function subscribeJDList(callback) {
  initJDLocalStorage();
  jdSubscribers.push(callback);

  // 1. Immediately emit cached local data (0ms)
  if (cachedJDList !== null) {
    callback(cachedJDList);
  } else {
    const cached = getJDList();
    cachedJDList = cached;
    callback(cached);
  }

  // 2. Attach SINGLE shared Firestore real-time listener
  if (isFirebaseConfigured && db && !sharedJDUnsub) {
    try {
      const jdCollection = collection(db, 'job_descriptions');
      sharedJDUnsub = onSnapshot(
        jdCollection,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteList = [];
            snapshot.forEach((docSnap) => {
              const rawData = { id: docSnap.id, ...docSnap.data() };
              const sanitized = sanitizeJDRecord(rawData);
              remoteList.push(sanitized);
            });

            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_KEY_JDS, JSON.stringify(remoteList));
            }
            notifyJDSubscribers(remoteList);
          } else {
            const seed = [sanitizeJDRecord(SAMPLE_SEED_JD)];
            notifyJDSubscribers(seed);
          }
        },
        (error) => {
          console.warn('Firestore JD onSnapshot error, fallback to local storage', error);
          const cached = getJDList();
          notifyJDSubscribers(cached);
        }
      );
    } catch (err) {
      console.error('Failed to attach JD Firestore listener', err);
    }
  }

  return () => {
    jdSubscribers = jdSubscribers.filter((cb) => cb !== callback);
    if (jdSubscribers.length === 0 && sharedJDUnsub) {
      sharedJDUnsub();
      sharedJDUnsub = null;
    }
  };
}

/**
 * Save (Create or Update) a Job Description
 * Validates permissions:
 * - Admin can edit anytime
 * - Owner can edit ONLY when Revisable Window is OPEN
 */
export async function saveJDRecord(jdData, actorPersonnel, isAdmin = false) {
  initJDLocalStorage();
  if (!jdData) throw new Error('ข้อมูลแบบบรรยายลักษณะงานไม่ถูกต้อง');

  // Permission Check for Non-Admin
  if (!isAdmin) {
    if (!actorPersonnel) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนทำการบันทึกข้อมูล');
    }

    // Check ownership
    const isOwner =
      (jdData.personnelEmail && jdData.personnelEmail.toLowerCase() === actorPersonnel.email?.toLowerCase()) ||
      (jdData.personnelId && jdData.personnelId === actorPersonnel.id);

    if (!isOwner) {
      throw new Error('คุณสามารถแก้ไขได้เฉพาะแบบบรรยายลักษณะงาน (JD) ของตนเองเท่านั้น');
    }

    // Check revisable window
    const windowStatus = isRevisionWindowOpen();
    if (!windowStatus.isOpen) {
      throw new Error(`ไม่สามารถแก้ไขข้อมูลได้ในขณะนี้: ${windowStatus.reason}`);
    }
  }

  const nowIso = new Date().toISOString();
  const id = jdData.id || `jd-${Date.now()}`;
  const fullRecord = sanitizeJDRecord({
    ...jdData,
    id,
    lastUpdatedBy: actorPersonnel?.name || 'ผู้ใช้งาน',
    updatedAt: nowIso,
    createdAt: jdData.createdAt || nowIso,
  });

  // Optimistic update in localStorage
  const list = getJDList();
  const existingIdx = list.findIndex((j) => j.id === id);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = list.map((item, i) => (i === existingIdx ? fullRecord : item));
  } else {
    updatedList = [fullRecord, ...list];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_JDS, JSON.stringify(updatedList));
  }
  notifyJDSubscribers(updatedList);

  // Sync to Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'job_descriptions', id), fullRecord, { merge: true });
    } catch (e) {
      console.error('Failed to sync JD to Firestore', e);
    }
  }

  const isNew = existingIdx < 0;
  logActivity({
    action: isNew ? 'CREATE_JD' : 'UPDATE_JD',
    category: ACTIVITY_CATEGORIES.JD_HUB,
    status: 'SUCCESS',
    title: `${isNew ? 'สร้าง' : 'แก้ไข'}แบบบรรยายลักษณะงาน (JD): ${fullRecord.jobTitle || fullRecord.positionTitle || 'JD'} (${fullRecord.personnelName || fullRecord.personnelEmail || '-'})`,
    details: `${actorPersonnel?.name || 'ผู้ใช้งาน'} ${isNew ? 'สร้างแบบบรรยายลักษณะงานใหม่' : 'บันทึกแก้ไขแบบบรรยายลักษณะงาน'} ของ ${fullRecord.personnelName} ตำแหน่ง ${fullRecord.positionTitle || '-'} [สถานะ: ${fullRecord.status || 'DRAFT'}]`,
    actor: actorPersonnel ? { id: actorPersonnel.id || actorPersonnel.email, name: actorPersonnel.name, email: actorPersonnel.email, role: actorPersonnel.role } : null,
    target: { id: fullRecord.id, name: `${fullRecord.personnelName} - ${fullRecord.jobTitle || fullRecord.positionTitle}`, type: 'JD_RECORD' },
    metadata: { status: fullRecord.status, userConfirmed: fullRecord.userConfirmed, personnelEmail: fullRecord.personnelEmail },
  });

  return fullRecord;
}

/**
 * Confirm JD Version by Owner or Admin
 */
export async function confirmJDVersion(idOrData, actorPersonnel, isAdmin = false) {
  initJDLocalStorage();
  const list = getJDList();
  let item = null;
  if (typeof idOrData === 'object' && idOrData !== null) {
    item = idOrData.id ? list.find((j) => j.id === idOrData.id) : null;
    if (!item) {
      item = idOrData;
    }
  } else if (typeof idOrData === 'string') {
    item = list.find((j) => j.id === idOrData);
  }

  if (!item) throw new Error('ไม่พบข้อมูลแบบบรรยายลักษณะงานที่ระบุ');

  if (!isAdmin) {
    const isOwner =
      (item.personnelEmail && item.personnelEmail.toLowerCase() === actorPersonnel?.email?.toLowerCase()) ||
      (item.personnelId && item.personnelId === actorPersonnel?.id);
    if (!isOwner) {
      throw new Error('คุณสามารถยืนยันข้อมูลได้เฉพาะแบบบรรยายลักษณะงาน (JD) ของตนเองเท่านั้น');
    }
    const windowStatus = isRevisionWindowOpen();
    if (!windowStatus.isOpen) {
      throw new Error(`ไม่สามารถยืนยันข้อมูลได้: ${windowStatus.reason}`);
    }
  }

  const nowIso = new Date().toISOString();
  const updated = {
    ...item,
    userConfirmed: true,
    confirmedAt: nowIso,
    confirmedByEmail: actorPersonnel?.email || item.confirmedByEmail || '',
    status: 'CONFIRMED',
    updatedAt: nowIso,
    lastUpdatedBy: actorPersonnel?.name || 'ผู้ใช้งาน',
  };

  const saved = await saveJDRecord(updated, actorPersonnel, isAdmin);

  logActivity({
    action: 'CONFIRM_JD',
    category: ACTIVITY_CATEGORIES.JD_HUB,
    status: 'SUCCESS',
    title: `ยืนยันความถูกต้องแบบบรรยายลักษณะงาน (JD): ${saved.personnelName || saved.personnelEmail}`,
    details: `${actorPersonnel?.name || 'ผู้ใช้งาน'} ยืนยันความถูกต้องของแบบบรรยายลักษณะงาน (JD) ประจำปีงบประมาณ`,
    actor: actorPersonnel ? { id: actorPersonnel.id || actorPersonnel.email, name: actorPersonnel.name, email: actorPersonnel.email, role: actorPersonnel.role } : null,
    target: { id: saved.id, name: `${saved.personnelName} - ${saved.jobTitle || saved.positionTitle}`, type: 'JD_RECORD' },
  });

  return saved;
}

/**
 * Delete a Job Description (Admin only)
 */
export async function deleteJDRecord(id, actorPersonnel, isAdmin = false) {
  initJDLocalStorage();
  if (!isAdmin) {
    throw new Error('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบข้อมูลแบบบรรยายลักษณะงานได้');
  }

  const list = getJDList();
  const target = list.find((j) => j.id === id);
  const filtered = list.filter((j) => j.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_JDS, JSON.stringify(filtered));
  }
  notifyJDSubscribers(filtered);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'job_descriptions', id));
    } catch (e) {
      console.error('Failed to delete JD from Firestore', e);
    }
  }

  logActivity({
    action: 'DELETE_JD',
    category: ACTIVITY_CATEGORIES.JD_HUB,
    status: 'SUCCESS',
    title: `ลบแบบบรรยายลักษณะงาน (JD): ${target?.personnelName || id}`,
    details: `ผู้ดูแลระบบลบแบบบรรยายลักษณะงานของ ${target?.personnelName || id} ตำแหน่ง ${target?.positionTitle || '-'} ออกจากระบบ`,
    actor: actorPersonnel ? { id: actorPersonnel.id || actorPersonnel.email, name: actorPersonnel.name, email: actorPersonnel.email, role: actorPersonnel.role } : null,
    target: { id, name: `${target?.personnelName || id} - ${target?.jobTitle || target?.positionTitle}`, type: 'JD_RECORD' },
  });

  return true;
}

// Aliases for intuitive imports
export const subscribeToJobDescriptions = subscribeJDList;
export const subscribeToJDConfig = subscribeJDConfig;

