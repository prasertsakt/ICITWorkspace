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
 * Real-Time Subscription to TQA OFI Items for a specific Fiscal Year
 * Default: 2568 is pre-seeded with Feedback Report data.
 * Other / future years start completely empty unless populated by admin.
 */
export function subscribeTqaOfiItems(fiscalYear = String(getCurrentThaiFiscalYear()), callback) {
  if (typeof window === 'undefined') return () => {};

  const localKey = `${LOCAL_KEY_TQA_OFI}_${fiscalYear}`;

  // Initial Seed for 2568 if first time
  const getDefaultItemsForYear = (fy) => {
    if (String(fy) === '2568') {
      return SEED_TQA_OFI_2568;
    }
    return [];
  };

  // 1. Instant Cache load
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        callback(parsed);
      } else {
        const defaults = getDefaultItemsForYear(fiscalYear);
        callback(defaults);
      }
    } else {
      const defaults = getDefaultItemsForYear(fiscalYear);
      if (defaults.length > 0) {
        localStorage.setItem(localKey, JSON.stringify(defaults));
      }
      callback(defaults);
    }
  } catch (e) {
    callback(getDefaultItemsForYear(fiscalYear));
  }

  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  // 2. Firestore Real-time listener
  try {
    const q = query(collection(db, 'tqa_ofi_items'), where('fiscalYear', '==', String(fiscalYear)));
    const unsubscribe = onSnapshot(
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
          callback(items);
        } else {
          // If Firestore is empty for 2568, seed it
          if (String(fiscalYear) === '2568') {
            const defaults = SEED_TQA_OFI_2568;
            seedInitialTqaToFirestore(defaults, '2568');
            callback(defaults);
          } else {
            // Future / other years: clean empty state
            try {
              localStorage.setItem(localKey, JSON.stringify([]));
            } catch (e) {}
            callback([]);
          }
        }
      },
      (err) => {
        console.warn(`Firestore tqa_ofi_items (${fiscalYear}) warning:`, err);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error('Failed to setup tqa_ofi_items snapshot listener:', e);
    return () => {};
  }
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

  const payload = {
    ...itemData,
    id,
    fiscalYear: fy,
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
    return { success: true, item: payload };
  } catch (e) {
    console.error('Error saving TQA OFI item to Firestore:', e);
    throw e;
  }
}

/**
 * Delete a TQA OFI item
 */
export async function deleteTqaOfiItem(itemId, fiscalYear = String(getCurrentThaiFiscalYear())) {
  const fy = String(fiscalYear);
  const localKey = `${LOCAL_KEY_TQA_OFI}_${fy}`;

  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const filtered = list.filter((x) => x.id !== itemId);
        localStorage.setItem(localKey, JSON.stringify(filtered));
      }
    }
  } catch (e) {}

  if (!isFirebaseConfigured || !db) {
    return { success: true };
  }

  try {
    const docRef = doc(db, 'tqa_ofi_items', itemId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (e) {
    console.error('Error deleting TQA OFI item:', e);
    throw e;
  }
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
 */
export function subscribeTqaReportConfig(fiscalYear = String(getCurrentThaiFiscalYear()), callback) {
  if (typeof window === 'undefined') return () => {};

  const docId = `report-${fiscalYear}`;
  const localKey = `${LOCAL_KEY_TQA_REPORTS}_${fiscalYear}`;

  const defaultResult = {
    fiscalYear: String(fiscalYear),
    reportUrl: '',
    reportTitle: `รายงานการตรวจประเมินคุณภาพการศึกษาภายใน ประจำปีการศึกษา ${fiscalYear} (Feedback Report)`,
    updatedAt: null,
  };

  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) callback(parsed);
    } else {
      callback(defaultResult);
    }
  } catch (e) {
    callback(defaultResult);
  }

  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  try {
    const docRef = doc(db, 'tqa_reports', docId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          try {
            localStorage.setItem(localKey, JSON.stringify(data));
          } catch (e) {}
          callback(data);
        } else {
          callback(defaultResult);
        }
      },
      (err) => {
        console.warn(`Firestore tqa_reports (${fiscalYear}) warning:`, err);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error('Failed to setup tqa_reports listener:', e);
    return () => {};
  }
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
