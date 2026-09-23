// Real-Time JD Hub Service: Synchronized with Firebase Firestore & Offline Fallback
import { db, isFirebaseConfigured } from './firebase';
import { SAMPLE_SEED_JD, normalizeCoreCompetencies, DEFAULT_JD_TEMPLATE } from './jdTemplateData';
import { formatLocalDate } from './dateUtils';
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
const LOCAL_KEY_JD_TEMPLATE = 'icit_jd_template_config';

export const DEFAULT_JD_CONFIG = {
  isRevisionOpen: true,
  startDate: '2026-09-01',
  endDate: '2026-10-31',
  announcement: 'ช่วงเวลาเปิดให้บุคลากรตรวจสอบ ทบทวน และยืนยันแบบบรรยายลักษณะงาน (Job Description) ประจำปีงบประมาณ 2570',
  updatedAt: new Date().toISOString(),
  updatedBy: 'ผู้ดูแลระบบ',
};

// Internal pub/sub subscribers
let jdSubscribers = [];
let jdConfigSubscribers = [];
let jdTemplateSubscribers = [];

function notifyJDSubscribers(data) {
  jdSubscribers.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('JD subscriber error:', e);
    }
  });
}

function notifyJDConfigSubscribers(data) {
  jdConfigSubscribers.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('JD config subscriber error:', e);
    }
  });
}

function notifyJDTemplateSubscribers(data) {
  jdTemplateSubscribers.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('JD template subscriber error:', e);
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
  if (!localStorage.getItem(LOCAL_KEY_JD_TEMPLATE)) {
    localStorage.setItem(LOCAL_KEY_JD_TEMPLATE, JSON.stringify(DEFAULT_JD_TEMPLATE));
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
  initJDLocalStorage();
  if (typeof window === 'undefined') return DEFAULT_JD_CONFIG;
  try {
    const raw = localStorage.getItem(LOCAL_KEY_JD_CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_JD_CONFIG;
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

  return { success: true, config: updated };
}

/**
 * Subscribe to JD Config changes
 */
export function subscribeJDConfig(callback) {
  initJDLocalStorage();
  jdConfigSubscribers.push(callback);

  // Emit cached config immediately
  const cached = getJDConfig();
  callback(cached);

  // Real-time Firestore listener
  let unsubscribeFirestore = () => {};
  if (isFirebaseConfigured && db) {
    try {
      unsubscribeFirestore = onSnapshot(
        doc(db, 'settings', 'jd_hub_config'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_KEY_JD_CONFIG, JSON.stringify(data));
            }
            callback(data);
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
    unsubscribeFirestore();
  };
}

/**
 * Get cached JD Template config
 */
export function getJDTemplateConfig() {
  initJDLocalStorage();
  if (typeof window === 'undefined') return DEFAULT_JD_TEMPLATE;
  try {
    const raw = localStorage.getItem(LOCAL_KEY_JD_TEMPLATE);
    if (!raw) return DEFAULT_JD_TEMPLATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_JD_TEMPLATE,
      ...parsed,
      coreCompetencies: normalizeCoreCompetencies(parsed.coreCompetencies || DEFAULT_JD_TEMPLATE.coreCompetencies),
    };
  } catch {
    return DEFAULT_JD_TEMPLATE;
  }
}

/**
 * Save JD Template configuration (Admin only)
 */
export async function saveJDTemplateConfig(newTemplate, actorPersonnel) {
  initJDLocalStorage();
  const current = getJDTemplateConfig();
  const updated = {
    ...current,
    ...newTemplate,
    coreCompetencies: normalizeCoreCompetencies(newTemplate.coreCompetencies || current.coreCompetencies),
    updatedAt: new Date().toISOString(),
    updatedBy: actorPersonnel?.name || 'ผู้ดูแลระบบ',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_JD_TEMPLATE, JSON.stringify(updated));
  }
  notifyJDTemplateSubscribers(updated);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'settings', 'jd_template_config'), updated, { merge: true });
    } catch (e) {
      console.error('Failed to sync JD Template to Firestore', e);
    }
  }

  return { success: true, template: updated };
}

/**
 * Subscribe to JD Template changes
 */
export function subscribeJDTemplateConfig(callback) {
  initJDLocalStorage();
  jdTemplateSubscribers.push(callback);

  // Emit cached template immediately
  const cached = getJDTemplateConfig();
  callback(cached);

  // Real-time Firestore listener
  let unsubscribeFirestore = () => {};
  if (isFirebaseConfigured && db) {
    try {
      unsubscribeFirestore = onSnapshot(
        doc(db, 'settings', 'jd_template_config'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const normalized = {
              ...DEFAULT_JD_TEMPLATE,
              ...data,
              coreCompetencies: normalizeCoreCompetencies(data.coreCompetencies || DEFAULT_JD_TEMPLATE.coreCompetencies),
            };
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_KEY_JD_TEMPLATE, JSON.stringify(normalized));
            }
            callback(normalized);
          }
        },
        (err) => {
          console.warn('Firestore JD Template onSnapshot error, fallback to local', err);
        }
      );
    } catch (e) {
      console.error('Failed to attach JD Template listener', e);
    }
  }

  return () => {
    jdTemplateSubscribers = jdTemplateSubscribers.filter((cb) => cb !== callback);
    unsubscribeFirestore();
  };
}

/**
 * Apply updated template settings to ALL existing JD records in Firestore and LocalStorage
 */
export async function applyJDTemplateToAllJDs(templateData, actorPersonnel, options = {}) {
  initJDLocalStorage();
  // 1. First save template config itself
  await saveJDTemplateConfig(templateData, actorPersonnel);

  const tmpl = getJDTemplateConfig();
  const list = getJDList();
  const now = new Date().toISOString();
  const updaterName = actorPersonnel?.name || 'ผู้ดูแลระบบ';

  const updatedList = list.map((jd) => {
    // Merge template updates while keeping individual identity & personalized responsibilities
    const updated = {
      ...jd,
      docCode: tmpl.docCode || jd.docCode || 'ICIT-FM-COMMON-006',
      version: tmpl.version || jd.version || '2.0',
      securityClassification: tmpl.securityClassification || jd.securityClassification || 'ปกปิด (Restricted)',
      division: tmpl.division || jd.division || 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
      coreCompetencies: normalizeCoreCompetencies(
        tmpl.coreCompetencies && tmpl.coreCompetencies.length > 0
          ? tmpl.coreCompetencies
          : jd.coreCompetencies
      ),
      signatures: {
        ...jd.signatures,
        approvedBy: {
          name: tmpl.approvedByName || jd.signatures?.approvedBy?.name || 'อาจารย์ณัฐวุฒิ สร้อยดอกสน',
          date: jd.signatures?.approvedBy?.date || '',
        },
      },
      updatedAt: now,
      lastUpdatedBy: updaterName,
    };

    // If options specify to also overwrite functional competencies or trainings if empty:
    if (options.overwriteFunctionalCompetencies && Array.isArray(tmpl.functionalCompetencies)) {
      updated.functionalCompetencies = JSON.parse(JSON.stringify(tmpl.functionalCompetencies));
    } else if ((!updated.functionalCompetencies || updated.functionalCompetencies.length === 0) && Array.isArray(tmpl.functionalCompetencies)) {
      updated.functionalCompetencies = JSON.parse(JSON.stringify(tmpl.functionalCompetencies));
    }

    if (options.overwriteTrainings && Array.isArray(tmpl.trainings)) {
      updated.trainings = [...tmpl.trainings];
    } else if ((!updated.trainings || updated.trainings.length === 0) && Array.isArray(tmpl.trainings)) {
      updated.trainings = [...tmpl.trainings];
    }

    return updated;
  });

  // 2. Update localStorage & notify
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_JDS, JSON.stringify(updatedList));
  }
  notifyJDSubscribers(updatedList);

  // 3. Batch/Parallel update in Firestore
  if (isFirebaseConfigured && db) {
    try {
      const updatePromises = updatedList.map((jd) =>
        setDoc(doc(db, 'job_descriptions', jd.id), jd, { merge: true })
      );
      await Promise.all(updatePromises);
    } catch (e) {
      console.error('Failed to batch update JDs in Firestore', e);
    }
  }

  return { success: true, count: updatedList.length, template: tmpl };
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
 */
export function subscribeJDList(callback) {
  initJDLocalStorage();
  jdSubscribers.push(callback);

  // Immediately emit cached local data
  const cached = getJDList();
  callback(cached);

  // Attach Firestore real-time listener
  let unsubscribeFirestore = () => {};
  if (isFirebaseConfigured && db) {
    try {
      const jdCollection = collection(db, 'job_descriptions');
      unsubscribeFirestore = onSnapshot(
        jdCollection,
        (snapshot) => {
          const remoteList = [];
          let hasOutdatedRecords = false;

          snapshot.forEach((docSnap) => {
            const rawData = { id: docSnap.id, ...docSnap.data() };
            const sanitized = sanitizeJDRecord(rawData);
            
            // Check if any core competency was updated during sanitization
            const rawNames = JSON.stringify(rawData.coreCompetencies?.map((c) => c.name) || []);
            const cleanNames = JSON.stringify(sanitized.coreCompetencies?.map((c) => c.name) || []);
            if (rawNames !== cleanNames) {
              hasOutdatedRecords = true;
              // Auto-fix the document in Firestore
              setDoc(doc(db, 'job_descriptions', docSnap.id), { coreCompetencies: sanitized.coreCompetencies }, { merge: true }).catch(() => {});
            }

            remoteList.push(sanitized);
          });

          if (remoteList.length > 0) {
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_KEY_JDS, JSON.stringify(remoteList));
            }
            callback(remoteList);
          } else {
            // Seed sample if Firestore collection is empty
            const seed = [sanitizeJDRecord(SAMPLE_SEED_JD)];
            callback(seed);
            setDoc(doc(db, 'job_descriptions', SAMPLE_SEED_JD.id), seed[0]).catch(() => {});
          }
        },
        (error) => {
          console.warn('Firestore JD onSnapshot error, fallback to local storage', error);
        }
      );
    } catch (err) {
      console.error('Failed to attach JD Firestore listener', err);
    }
  }

  return () => {
    jdSubscribers = jdSubscribers.filter((cb) => cb !== callback);
    unsubscribeFirestore();
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

  return await saveJDRecord(updated, actorPersonnel, isAdmin);
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

  return true;
}

// Aliases for intuitive imports
export const subscribeToJobDescriptions = subscribeJDList;
export const subscribeToJDConfig = subscribeJDConfig;

