// Real-Time TQA OFI Tracking Service: Synchronized with Firebase Firestore & Caching
import { db, isFirebaseConfigured } from './firebase';
import { SEED_TQA_OFI_2568 } from './tqaSeedData';
import { getCurrentThaiFiscalYear } from './dateUtils';
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
  writeBatch,
} from 'firebase/firestore';
import { logActivity, ACTIVITY_CATEGORIES } from './activityLogService';

export const LOCAL_KEY_TQA_OFI = 'icit_tqa_ofi_items';
export const LOCAL_KEY_TQA_REPORTS = 'icit_tqa_reports';

/**
 * Check if the user has permission to write Action Progress & change status for a specific OFI item
 * Rules: Only Admin and Assigned Persons can edit.
 */
export function canEditTqaOfiProgress(ofiItem, currentUser, currentPersonnel, isAdmin = false) {
  if (isAdmin) return true;
  if (!ofiItem || !Array.isArray(ofiItem.assignedPersons) || ofiItem.assignedPersons.length === 0) {
    return false;
  }

  const userEmail = (currentUser?.email || currentPersonnel?.email || '').trim().toLowerCase();
  const userId = currentPersonnel?.id || '';
  const userName = (currentPersonnel?.name || currentUser?.displayName || '').trim().toLowerCase();

  return ofiItem.assignedPersons.some((p) => {
    if (!p) return false;
    const pEmail = (p.email || '').trim().toLowerCase();
    const pId = p.id || '';
    const pName = (p.name || '').trim().toLowerCase();

    if (userEmail && pEmail && userEmail === pEmail) return true;
    if (userId && pId && userId === pId) return true;
    if (userName && pName && (userName.includes(pName) || pName.includes(userName))) return true;
    return false;
  });
}

/**
 * Helper: Check if an OFI item is actively tracked ("ดำเนินการ") or excluded/on-hold ("ยังไม่ดำเนินการ")
 * Defaults to true for all standard items. Returns false if explicitly marked not tracked or excluded.
 */
export function isTqaOfiTracked(item) {
  if (!item) return true;
  if (item.isTracking === false) return false;
  if (item.executionStatus === 'NOT_TRACKED' || item.executionStatus === 'INACTIVE') return false;
  if (item.isExcluded === true) return false;
  return true;
}

/**
 * Helper: Normalize 3 Tracking Rounds for a TQA OFI Item
 * Supports 3 evaluation rounds (รอบที่ 1, รอบที่ 2, รอบที่ 3)
 */
export function normalizeTqaRounds(item) {
  const createDefaultRound = (roundNum) => ({
    round: roundNum,
    status: 'PENDING',
    actionReport: '',
    reportedBy: '',
    reportedAt: '',
  });

  const existingRounds = item?.rounds || {};

  // Backwards compatibility: Map existing single report to round 1 if not defined
  const r1 = existingRounds.round1 || {
    round: 1,
    status: item?.status || 'PENDING',
    actionReport: item?.actionReport || '',
    reportedBy: item?.lastReportedBy || '',
    reportedAt: item?.lastReportedAt || '',
  };

  const r2 = existingRounds.round2 || createDefaultRound(2);
  const r3 = existingRounds.round3 || createDefaultRound(3);

  return {
    round1: { ...createDefaultRound(1), ...r1 },
    round2: { ...createDefaultRound(2), ...r2 },
    round3: { ...createDefaultRound(3), ...r3 },
  };
}

/**
 * Helper: Count how many rounds have been reported (0, 1, 2, or 3)
 */
export function getReportedRoundsCount(rounds) {
  if (!rounds) return 0;
  const hasR1 = !!(rounds.round1?.actionReport && rounds.round1.actionReport.replace(/<[^>]*>/g, '').trim());
  const hasR2 = !!(rounds.round2?.actionReport && rounds.round2.actionReport.replace(/<[^>]*>/g, '').trim());
  const hasR3 = !!(rounds.round3?.actionReport && rounds.round3.actionReport.replace(/<[^>]*>/g, '').trim());
  return (hasR1 ? 1 : 0) + (hasR2 ? 1 : 0) + (hasR3 ? 1 : 0);
}

/**
 * Helper: Compute overall status from 3 rounds based on step-based progress (0/3, 1-2/3, 3/3)
 */
export function computeOverallStatus(rounds, manualOverride = null) {
  if (manualOverride && ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(manualOverride)) {
    return manualOverride;
  }
  if (!rounds) return 'PENDING';
  const count = getReportedRoundsCount(rounds);
  if (count === 3 || !!(rounds.round3?.actionReport && rounds.round3.actionReport.replace(/<[^>]*>/g, '').trim())) {
    return 'COMPLETED';
  }
  if (count > 0) {
    return 'IN_PROGRESS';
  }
  return 'PENDING';
}

/**
 * Normalizes rich text HTML for TQA / IMS Action Reports:
 * 1. Ensures all links with relative/missing protocol (e.g. href="kmutnb.link/..." or href="www.google.com") are converted to external absolute URLs (href="https://...")
 * 2. Ensures all links have target="_blank" and rel="noopener noreferrer"
 * 3. Auto-links plain text URLs if they are not already inside <a> tags
 */
export function normalizeActionReportHtml(html) {
  if (!html || typeof html !== 'string') return '';

  let processed = html;

  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${processed}</div>`, 'text/html');
      const root = doc.body.firstElementChild;

      if (root) {
        // 1. Fix all existing <a> tags
        root.querySelectorAll('a').forEach((a) => {
          let h = (a.getAttribute('href') || '').trim();
          if (
            h &&
            !/^https?:\/\//i.test(h) &&
            !h.startsWith('mailto:') &&
            !h.startsWith('tel:') &&
            !h.startsWith('#')
          ) {
            // If it starts with relative pathname, fix it to https://
            const clean = h.replace(/^\/+/, '');
            a.setAttribute('href', `https://${clean}`);
          }
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        });

        // 2. Auto-link plain text URLs inside text nodes (not inside <a>)
        const urlRegex = /(?:\bhttps?:\/\/[\w.-]+(?:\.[\w\.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]+|\b[a-zA-Z0-9-]+\.(?:link|com|org|net|edu|ac\.th|co\.th|in\.th|gov\.th|go\.th|io|app|dev)(?:\/[^\s<]*)?)/gi;

        const walk = (node) => {
          if (node.nodeType === 3) {
            // Text node
            const text = node.nodeValue;
            if (urlRegex.test(text)) {
              const span = document.createElement('span');
              span.innerHTML = text.replace(urlRegex, (url) => {
                const fullUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
                return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
              });
              node.parentNode.replaceChild(span, node);
            }
          } else if (node.nodeType === 1 && node.nodeName.toLowerCase() !== 'a') {
            Array.from(node.childNodes).forEach(walk);
          }
        };

        Array.from(root.childNodes).forEach(walk);
        return root.innerHTML;
      }
    } catch {
      // Ignore DOM parser fallback
    }
  }

  return processed;
}

// Shared singleton listeners & cache maps per fiscal year
let tqaSubscribersMap = {};
let sharedTqaUnsubMap = {};
let cachedTqaMap = {};

let tqaReportsSubscribersMap = {};
let sharedTqaReportsUnsubMap = {};
let cachedTqaReportsMap = {};

function notifyTqaSubscribers(fy, list) {
  const cloned = Array.isArray(list) ? [...list] : [];
  cachedTqaMap[fy] = cloned;
  if (tqaSubscribersMap[fy]) {
    tqaSubscribersMap[fy].forEach((cb) => {
      try {
        cb(cloned);
      } catch (e) {
        console.error('TQA subscriber error:', e);
      }
    });
  }
}

function notifyTqaReportsSubscribers(fy, data) {
  cachedTqaReportsMap[fy] = data;
  if (tqaReportsSubscribersMap[fy]) {
    tqaReportsSubscribersMap[fy].forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('TQA Reports subscriber error:', e);
      }
    });
  }
}

/**
 * Real-Time Subscription to TQA OFI Items for a specific Fiscal Year
 * OPTIMIZED: Single shared Firestore listener per fiscal year
 */
export function subscribeTqaOfiItems(fiscalYear = String(getCurrentThaiFiscalYear()), callback) {
  if (typeof window === 'undefined') return () => {};

  const fy = String(fiscalYear);
  if (!tqaSubscribersMap[fy]) {
    tqaSubscribersMap[fy] = [];
  }
  tqaSubscribersMap[fy].push(callback);

  const localKey = `${LOCAL_KEY_TQA_OFI}_${fy}`;

  const getDefaultItemsForYear = (targetFy) => {
    if (String(targetFy) === '2568') {
      return SEED_TQA_OFI_2568;
    }
    return [];
  };

  // 1. Instant Cache load (0ms)
  if (cachedTqaMap[fy]) {
    callback(cachedTqaMap[fy]);
  } else {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          cachedTqaMap[fy] = parsed;
          callback(parsed);
        } else {
          const defaults = getDefaultItemsForYear(fy);
          cachedTqaMap[fy] = defaults;
          callback(defaults);
        }
      } else {
        const defaults = getDefaultItemsForYear(fy);
        if (defaults.length > 0) {
          localStorage.setItem(localKey, JSON.stringify(defaults));
        }
        cachedTqaMap[fy] = defaults;
        callback(defaults);
      }
    } catch (e) {
      callback(getDefaultItemsForYear(fy));
    }
  }

  // 2. Start SINGLE shared listener per fiscal year if not active
  if (isFirebaseConfigured && db && !sharedTqaUnsubMap[fy]) {
    try {
      const q = query(collection(db, 'tqa_ofi_items'), where('fiscalYear', '==', fy));
      sharedTqaUnsubMap[fy] = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items = [];
            snapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...docSnap.data() });
            });
            // Sort items cleanly by categoryNum and itemRef
            items.sort((a, b) => {
              if ((a.categoryNum || 0) !== (b.categoryNum || 0)) {
                return (a.categoryNum || 0) - (b.categoryNum || 0);
              }
              return (a.itemRef || '').localeCompare(b.itemRef || '');
            });

            try {
              localStorage.setItem(localKey, JSON.stringify(items));
            } catch (e) {}
            notifyTqaSubscribers(fy, items);
          } else {
            // If Firestore is empty for 2568, seed it once
            if (fy === '2568') {
              const defaults = SEED_TQA_OFI_2568;
              seedInitialTqaToFirestore(defaults, '2568');
              notifyTqaSubscribers(fy, defaults);
            } else {
              try {
                localStorage.setItem(localKey, JSON.stringify([]));
              } catch (e) {}
              notifyTqaSubscribers(fy, []);
            }
          }
        },
        (err) => {
          console.warn(`Firestore tqa_ofi_items (${fy}) warning:`, err);
        }
      );
    } catch (e) {
      console.error('Failed to setup tqa_ofi_items snapshot listener:', e);
    }
  }

  return () => {
    if (tqaSubscribersMap[fy]) {
      tqaSubscribersMap[fy] = tqaSubscribersMap[fy].filter((cb) => cb !== callback);
      if (tqaSubscribersMap[fy].length === 0 && sharedTqaUnsubMap[fy]) {
        sharedTqaUnsubMap[fy]();
        delete sharedTqaUnsubMap[fy];
      }
    }
  };
}

/**
 * Helper to seed initial 2568 items into Firestore in batch
 */
async function seedInitialTqaToFirestore(items, fiscalYear) {
  if (!isFirebaseConfigured || !db || !Array.isArray(items) || items.length === 0) return;
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const docRef = doc(db, 'tqa_ofi_items', item.id);
      batch.set(docRef, { ...item, fiscalYear: String(fiscalYear) });
    });
    await batch.commit();
  } catch (e) {
    console.warn('Error batch seeding TQA items to Firestore:', e);
  }
}

/**
 * Save or Update a single TQA OFI Item
 */
export async function saveTqaOfiItem(itemData, fiscalYear = String(getCurrentThaiFiscalYear()), updatedByName = 'Admin') {
  const fy = String(fiscalYear || itemData.fiscalYear || getCurrentThaiFiscalYear());
  const id = itemData.id || `tqa-${fy}-${Date.now()}`;
  const now = new Date().toISOString();

  const normalizedRounds = normalizeTqaRounds(itemData);
  const status = itemData.status || computeOverallStatus(normalizedRounds, 'PENDING');

  const payload = {
    ...itemData,
    id,
    fiscalYear: fy,
    status,
    rounds: normalizedRounds,
    updatedAt: now,
    updatedBy: updatedByName || itemData.updatedBy || 'Admin',
  };

  // Update local cache
  const localKey = `${LOCAL_KEY_TQA_OFI}_${fy}`;
  try {
    const raw = localStorage.getItem(localKey);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    const idx = list.findIndex((x) => x.id === id);
    if (idx >= 0) {
      list[idx] = payload;
    } else {
      list.push(payload);
    }
    localStorage.setItem(localKey, JSON.stringify(list));
  } catch (e) {}

  if (!isFirebaseConfigured || !db) {
    return { success: true, item: payload };
  }

  try {
    const docRef = doc(db, 'tqa_ofi_items', id);
    await setDoc(docRef, payload, { merge: true });
  } catch (e) {
    console.error('Error saving TQA OFI item to Firestore:', e);
    throw e;
  }

  logActivity({
    action: itemData.id ? 'UPDATE_TQA_OFI' : 'CREATE_TQA_OFI',
    category: ACTIVITY_CATEGORIES.TQA_OFI,
    status: 'SUCCESS',
    title: `บันทึกความก้าวหน้า TQA OFI: ${payload.itemRef || payload.title || 'OFI'} (ปี ${fy})`,
    details: `${updatedByName || 'ผู้ใช้งาน'} บันทึกผลการดำเนินงานและรายงานรอบของ ${payload.itemRef || ''}: ${payload.title || ''} [สถานะ: ${payload.status}]`,
    actor: { name: updatedByName || 'Admin', role: 'OPERATOR' },
    target: { id: payload.id, name: `${payload.itemRef || ''} - ${payload.title || ''}`, type: 'TQA_OFI' },
    metadata: { fiscalYear: fy, status: payload.status, categoryNum: payload.categoryNum },
  });

  return { success: true, item: payload };
}

/**
 * Delete a TQA OFI item
 */
export async function deleteTqaOfiItem(itemId, fiscalYear = String(getCurrentThaiFiscalYear()), actorName = 'Admin') {
  const fy = String(fiscalYear);
  const localKey = `${LOCAL_KEY_TQA_OFI}_${fy}`;
  let deletedItem = null;

  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        deletedItem = list.find((x) => x.id === itemId);
        const filtered = list.filter((x) => x.id !== itemId);
        localStorage.setItem(localKey, JSON.stringify(filtered));
      }
    }
  } catch (e) {}

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'tqa_ofi_items', itemId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Error deleting TQA OFI item:', e);
      throw e;
    }
  }

  logActivity({
    action: 'DELETE_TQA_OFI',
    category: ACTIVITY_CATEGORIES.TQA_OFI,
    status: 'SUCCESS',
    title: `ลบรายการ TQA OFI: ${deletedItem?.itemRef || itemId}`,
    details: `ลบหัวข้อ OFI ${deletedItem?.itemRef || ''} (${deletedItem?.title || ''}) ออกจากระบบปี ${fy}`,
    actor: { name: actorName || 'Admin', role: 'ADMIN' },
    target: { id: itemId, name: `${deletedItem?.itemRef || ''} - ${deletedItem?.title || ''}`, type: 'TQA_OFI' },
  });

  return { success: true };
}

/**
 * Import a list of OFI items into a fiscal year (Batch save)
 */
export async function importTqaOfiList(itemsList, fiscalYear, updatedByName = 'Admin') {
  const fy = String(fiscalYear || getCurrentThaiFiscalYear());
  const now = new Date().toISOString();

  const formattedItems = itemsList.map((item, idx) => ({
    ...item,
    id: item.id || `tqa-${fy}-${Date.now()}-${idx}`,
    fiscalYear: fy,
    status: item.status || 'PENDING',
    assignedPersons: Array.isArray(item.assignedPersons) ? item.assignedPersons : [],
    actionReport: item.actionReport || '',
    updatedAt: now,
    updatedBy: updatedByName,
  }));

  const localKey = `${LOCAL_KEY_TQA_OFI}_${fy}`;
  try {
    localStorage.setItem(localKey, JSON.stringify(formattedItems));
  } catch (e) {}

  if (!isFirebaseConfigured || !db) {
    return { success: true, count: formattedItems.length };
  }

  try {
    const batch = writeBatch(db);
    formattedItems.forEach((item) => {
      const docRef = doc(db, 'tqa_ofi_items', item.id);
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
    return { success: true, count: formattedItems.length };
  } catch (e) {
    console.error('Error importing TQA OFI items:', e);
    throw e;
  }
}

/**
 * Duplicate OFI items from a previous year to target year
 */
export async function duplicateTqaOfiFromPreviousYear(sourceYear, targetYear, updatedByName = 'Admin') {
  const srcKey = `${LOCAL_KEY_TQA_OFI}_${sourceYear}`;
  let sourceItems = [];

  try {
    const raw = localStorage.getItem(srcKey);
    if (raw) sourceItems = JSON.parse(raw);
  } catch (e) {}

  if ((!sourceItems || sourceItems.length === 0) && String(sourceYear) === '2568') {
    sourceItems = SEED_TQA_OFI_2568;
  }

  if (!sourceItems || sourceItems.length === 0) {
    throw new Error(`ไม่พบข้อมูล OFI ในปีงบประมาณ ${sourceYear} เพื่อคัดลอก`);
  }

  const duplicated = sourceItems.map((item, idx) => ({
    ...item,
    id: `tqa-${targetYear}-${Date.now()}-${idx}`,
    fiscalYear: String(targetYear),
    status: 'PENDING',
    actionReport: '', // Reset action report for the new year
    updatedAt: new Date().toISOString(),
    updatedBy: `คัดลอกจากปี ${sourceYear} โดย ${updatedByName}`,
  }));

  return await importTqaOfiList(duplicated, targetYear, updatedByName);
}

/**
 * Real-Time Subscription to TQA Report URL Config per Fiscal Year
 * OPTIMIZED: Single shared Firestore listener per fiscal year
 */
export function subscribeTqaReportConfig(fiscalYear = String(getCurrentThaiFiscalYear()), callback) {
  if (typeof window === 'undefined') return () => {};

  const fy = String(fiscalYear);
  if (!tqaReportsSubscribersMap[fy]) {
    tqaReportsSubscribersMap[fy] = [];
  }
  tqaReportsSubscribersMap[fy].push(callback);

  const docId = `report-${fy}`;
  const localKey = `${LOCAL_KEY_TQA_REPORTS}_${fy}`;

  const defaultResult = {
    fiscalYear: fy,
    reportUrl: '',
    reportTitle: `รายงานการตรวจประเมินคุณภาพการศึกษาภายใน ประจำปีการศึกษา ${fy} (Feedback Report)`,
    updatedAt: null,
  };

  // 1. Instant Cache load (0ms)
  if (cachedTqaReportsMap[fy]) {
    callback(cachedTqaReportsMap[fy]);
  } else {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          cachedTqaReportsMap[fy] = parsed;
          callback(parsed);
        }
      } else {
        callback(defaultResult);
      }
    } catch (e) {
      callback(defaultResult);
    }
  }

  // 2. Start SINGLE shared listener per fiscal year if not active
  if (isFirebaseConfigured && db && !sharedTqaReportsUnsubMap[fy]) {
    try {
      const docRef = doc(db, 'tqa_reports', docId);
      sharedTqaReportsUnsubMap[fy] = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            try {
              localStorage.setItem(localKey, JSON.stringify(data));
            } catch (e) {}
            notifyTqaReportsSubscribers(fy, data);
          } else {
            notifyTqaReportsSubscribers(fy, defaultResult);
          }
        },
        (err) => {
          console.warn(`Firestore tqa_reports (${fy}) warning:`, err);
        }
      );
    } catch (e) {
      console.error('Failed to setup tqa_reports listener:', e);
    }
  }

  return () => {
    if (tqaReportsSubscribersMap[fy]) {
      tqaReportsSubscribersMap[fy] = tqaReportsSubscribersMap[fy].filter((cb) => cb !== callback);
      if (tqaReportsSubscribersMap[fy].length === 0 && sharedTqaReportsUnsubMap[fy]) {
        sharedTqaReportsUnsubMap[fy]();
        delete sharedTqaReportsUnsubMap[fy];
      }
    }
  };
}

/**
 * Save TQA Report URL for a Fiscal Year
 */
export async function saveTqaReportConfig(fiscalYear, reportUrl, reportTitle = '', updatedByName = 'Admin') {
  const fy = String(fiscalYear || getCurrentThaiFiscalYear());
  const docId = `report-${fy}`;
  const now = new Date().toISOString();

  const payload = {
    id: docId,
    fiscalYear: fy,
    reportUrl: String(reportUrl || '').trim(),
    reportTitle: reportTitle || `รายงานการตรวจประเมินคุณภาพการศึกษาภายใน ประจำปีการศึกษา ${fy} (Feedback Report)`,
    updatedAt: now,
    updatedBy: updatedByName,
  };

  const localKey = `${LOCAL_KEY_TQA_REPORTS}_${fy}`;
  try {
    localStorage.setItem(localKey, JSON.stringify(payload));
  } catch (e) {}

  logActivity({
    action: 'UPDATE_TQA_REPORT_CONFIG',
    category: ACTIVITY_CATEGORIES.TQA_OFI,
    status: 'SUCCESS',
    title: `อัปเดตเอกสารรายงาน TQA: ${payload.reportTitle}`,
    details: `${updatedByName || 'ผู้ดูแลระบบ'} บันทึกลิงก์รายงานการตรวจประเมินคุณภาพการศึกษาภายใน ปีการศึกษา ${fy}`,
    actor: { name: updatedByName || 'Admin', role: 'ADMIN' },
    metadata: { fiscalYear: fy, reportUrl: payload.reportUrl },
  });

  if (!isFirebaseConfigured || !db) {
    return { success: true, data: payload };
  }

  try {
    const docRef = doc(db, 'tqa_reports', docId);
    await setDoc(docRef, payload, { merge: true });
    return { success: true, data: payload };
  } catch (e) {
    console.error('Error saving TQA report config to Firestore:', e);
    throw e;
  }
}
