// Unified Real-Time Storage Layer: Deeply Synchronized with Firebase Firestore
import { db, isFirebaseConfigured } from './firebase';
import {
  INITIAL_PERSONNEL,
  INITIAL_DEPARTMENTS,
  INITIAL_EXECUTIVES,
  INITIAL_LEAVES,
} from './initialData';
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
  writeBatch,
  orderBy,
  limit,
} from 'firebase/firestore';

const LOCAL_KEY_PERSONNEL = 'icit_org_personnel';
const LOCAL_KEY_DEPTS = 'icit_org_departments';
const LOCAL_KEY_EXECS = 'icit_org_executives';
const LOCAL_KEY_LEAVES = 'icit_org_leaves';
const LOCAL_KEY_LEAVES_SYNC_TIME = 'icit_org_leaves_sync_time';
const LEAVES_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL for leave records cache

// Helper: Ensure local storage has seed data
function initLocalStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(LOCAL_KEY_PERSONNEL)) {
    localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify(INITIAL_PERSONNEL));
  }
  if (!localStorage.getItem(LOCAL_KEY_DEPTS)) {
    localStorage.setItem(LOCAL_KEY_DEPTS, JSON.stringify(INITIAL_DEPARTMENTS));
  }
  if (!localStorage.getItem(LOCAL_KEY_EXECS)) {
    localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(INITIAL_EXECUTIVES));
  }
  if (!localStorage.getItem(LOCAL_KEY_LEAVES)) {
    localStorage.setItem(LOCAL_KEY_LEAVES, JSON.stringify(INITIAL_LEAVES));
  }
}

/**
 * ----------------- 1. REAL-TIME SUBSCRIPTIONS & PUB-SUB -----------------
 */

// In-memory subscribers for instantaneous, synchronous zero-latency UI updates
const personnelSubscribers = new Set();
const departmentSubscribers = new Set();
const executiveSubscribers = new Set();
const leaveSubscribers = new Set();

function notifyPersonnelSubscribers(list) {
  personnelSubscribers.forEach((cb) => {
    try {
      cb(list);
    } catch (e) {
      console.error('Error notifying personnel subscriber', e);
    }
  });
}

function notifyDepartmentSubscribers(list) {
  departmentSubscribers.forEach((cb) => {
    try {
      cb(list);
    } catch (e) {
      console.error('Error notifying department subscriber', e);
    }
  });
}

function notifyExecutiveSubscribers(list) {
  executiveSubscribers.forEach((cb) => {
    try {
      cb(list);
    } catch (e) {
      console.error('Error notifying executive subscriber', e);
    }
  });
}

function notifyLeaveSubscribers(list) {
  leaveSubscribers.forEach((cb) => {
    try {
      cb(list);
    } catch (e) {
      console.error('Error notifying leave subscriber', e);
    }
  });
}

/**
 * Subscribe to real-time changes of Personnel list
 */
export function subscribePersonnelList(callback) {
  if (typeof window === 'undefined') {
    callback([]);
    return () => {};
  }

  personnelSubscribers.add(callback);

  let firestoreUnsub = null;
  if (isFirebaseConfigured && db) {
    try {
      firestoreUnsub = onSnapshot(
        collection(db, 'personnel'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify(list));
            notifyPersonnelSubscribers(list);
          } else {
            localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify([]));
            notifyPersonnelSubscribers([]);
          }
        },
        (error) => {
          console.warn('Firestore personnel snapshot error, fallback to local', error);
          initLocalStorage();
          const list = JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]');
          callback(list);
        }
      );
    } catch (e) {
      console.warn('Failed to attach Firestore snapshot listener', e);
    }
  }

  // Immediate invoke with cached data
  initLocalStorage();
  const cachedList = JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]');
  callback(cachedList);

  const handleStorageChange = () => {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]');
    callback(list);
  };
  window.addEventListener('storage', handleStorageChange);

  return () => {
    personnelSubscribers.delete(callback);
    window.removeEventListener('storage', handleStorageChange);
    if (firestoreUnsub) {
      firestoreUnsub();
    }
  };
}

/**
 * Subscribe to real-time changes of Departments list
 */
export function subscribeDepartmentList(callback) {
  if (typeof window === 'undefined') {
    callback(INITIAL_DEPARTMENTS);
    return () => {};
  }

  departmentSubscribers.add(callback);

  let firestoreUnsub = null;
  if (isFirebaseConfigured && db) {
    try {
      firestoreUnsub = onSnapshot(
        collection(db, 'departments'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            localStorage.setItem(LOCAL_KEY_DEPTS, JSON.stringify(list));
            notifyDepartmentSubscribers(list);
          } else {
            for (const d of INITIAL_DEPARTMENTS) {
              setDoc(doc(db, 'departments', d.id), d);
            }
            notifyDepartmentSubscribers(INITIAL_DEPARTMENTS);
          }
        },
        (error) => {
          console.warn('Firestore department snapshot error', error);
          initLocalStorage();
          const list = JSON.parse(localStorage.getItem(LOCAL_KEY_DEPTS) || '[]');
          callback(list);
        }
      );
    } catch (e) {
      console.warn('Failed to attach department listener', e);
    }
  }

  initLocalStorage();
  const cachedList = JSON.parse(localStorage.getItem(LOCAL_KEY_DEPTS) || '[]');
  callback(cachedList);

  const handleStorageChange = () => {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_DEPTS) || '[]');
    callback(list);
  };
  window.addEventListener('storage', handleStorageChange);

  return () => {
    departmentSubscribers.delete(callback);
    window.removeEventListener('storage', handleStorageChange);
    if (firestoreUnsub) {
      firestoreUnsub();
    }
  };
}

/**
 * Subscribe to real-time changes of Executives list
 */
export function subscribeExecutiveList(callback) {
  if (typeof window === 'undefined') {
    callback(INITIAL_EXECUTIVES);
    return () => {};
  }

  executiveSubscribers.add(callback);

  let firestoreUnsub = null;
  if (isFirebaseConfigured && db) {
    try {
      firestoreUnsub = onSnapshot(
        collection(db, 'executives'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(list));
            notifyExecutiveSubscribers(list);
          } else {
            localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify([]));
            notifyExecutiveSubscribers([]);
          }
        },
        (error) => {
          console.warn('Firestore executive snapshot error', error);
          initLocalStorage();
          const list = JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]');
          callback(list);
        }
      );
    } catch (e) {
      console.warn('Failed to attach executive listener', e);
    }
  }

  initLocalStorage();
  const cachedList = JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]');
  callback(cachedList);

  const handleStorageChange = () => {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]');
    callback(list);
  };
  window.addEventListener('storage', handleStorageChange);

  return () => {
    executiveSubscribers.delete(callback);
    window.removeEventListener('storage', handleStorageChange);
    if (firestoreUnsub) {
      firestoreUnsub();
    }
  };
}

/**
 * Helper: Merge fetched Firestore documents into local storage cache
 */
function mergeLeavesIntoLocalStorage(fetchedDocs, year) {
  if (typeof window === 'undefined') return [];
  initLocalStorage();
  const existing = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
  
  const map = new Map();
  // Keep all existing leaves from cache
  existing.forEach((item) => map.set(item.id, item));
  // Overwrite or insert fetched docs
  fetchedDocs.forEach((item) => map.set(item.id, item));

  const merged = Array.from(map.values());
  localStorage.setItem(LOCAL_KEY_LEAVES, JSON.stringify(merged));
  localStorage.setItem(LOCAL_KEY_LEAVES_SYNC_TIME, Date.now().toString());
  return merged;
}

/**
 * Helper: Filter a list of leaves by calendar year
 */
function filterLeavesByYear(list, year) {
  if (!year) return list;
  const yStr = year.toString();
  return list.filter((l) => {
    return (l.startDate && l.startDate.startsWith(yStr)) || (l.endDate && l.endDate.startsWith(yStr));
  });
}

/**
 * Fetch leaves from Cloud Firestore for a specific year and update local cache
 */
export async function refreshLeaveList(year = new Date().getFullYear()) {
  if (!isFirebaseConfigured || !db) {
    initLocalStorage();
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
    return filterLeavesByYear(list, year);
  }

  try {
    const startStr = `${year}-01-01`;
    const endStr = `${year}-12-31T23:59:59`;
    const leavesQuery = query(
      collection(db, 'leaves'),
      where('startDate', '>=', startStr),
      where('startDate', '<=', endStr)
    );

    const snapshot = await getDocs(leavesQuery);
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const merged = mergeLeavesIntoLocalStorage(docs, year);
    notifyLeaveSubscribers(merged);
    return filterLeavesByYear(merged, year);
  } catch (err) {
    console.warn('Firestore leaves fetch error (falling back to cache):', err);
    initLocalStorage();
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
    return filterLeavesByYear(list, year);
  }
}

/**
 * Get timestamp of last leave sync
 */
export function getLastLeaveSyncTime() {
  if (typeof window === 'undefined') return null;
  const t = localStorage.getItem(LOCAL_KEY_LEAVES_SYNC_TIME);
  return t ? parseInt(t, 10) : null;
}

/**
 * Subscribe to Leaves list with Scoped Year Query, Smart Cache TTL (15m), and On-Demand Refresh
 */
export function subscribeLeaveList(callback, { year = new Date().getFullYear(), enableRealtime = false } = {}) {
  if (typeof window === 'undefined') {
    callback([]);
    return () => {};
  }

  // Wrapper callback to ensure caller receives only the requested year's leaves (or all if year is null)
  const wrappedCallback = (allLeaves) => {
    callback(filterLeavesByYear(allLeaves, year));
  };

  leaveSubscribers.add(wrappedCallback);

  let firestoreUnsub = null;

  if (isFirebaseConfigured && db) {
    const startStr = `${year}-01-01`;
    const endStr = `${year}-12-31T23:59:59`;
    const leavesQuery = query(
      collection(db, 'leaves'),
      where('startDate', '>=', startStr),
      where('startDate', '<=', endStr)
    );

    if (enableRealtime) {
      // 1. Real-time mode (Admin / Live collaboration)
      try {
        firestoreUnsub = onSnapshot(
          leavesQuery,
          (snapshot) => {
            const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            const merged = mergeLeavesIntoLocalStorage(docs, year);
            notifyLeaveSubscribers(merged);
          },
          (error) => {
            console.warn('Firestore leaves snapshot error', error);
            initLocalStorage();
            const list = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
            wrappedCallback(list);
          }
        );
      } catch (e) {
        console.warn('Failed to attach leaves listener', e);
      }
    } else {
      // 2. Cache-First with Stale-While-Revalidate mode (General staff view)
      const lastSync = parseInt(localStorage.getItem(LOCAL_KEY_LEAVES_SYNC_TIME) || '0', 10);
      const isCacheStale = Date.now() - lastSync > LEAVES_CACHE_TTL_MS;

      if (isCacheStale) {
        // Fetch fresh copy in background without blocking UI
        refreshLeaveList(year).catch((e) => console.warn('Background leave refresh failed', e));
      }
    }
  }

  // 3. Immediately emit cached data in 0ms
  initLocalStorage();
  const cachedList = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
  wrappedCallback(cachedList);

  const handleStorageChange = () => {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
    wrappedCallback(list);
  };
  window.addEventListener('storage', handleStorageChange);

  return () => {
    leaveSubscribers.delete(wrappedCallback);
    window.removeEventListener('storage', handleStorageChange);
    if (firestoreUnsub) {
      firestoreUnsub();
    }
  };
}

/**
 * ----------------- 2. CRUD OPERATIONS (WRITE & DELETE) -----------------
 */

/**
 * Save / Update Personnel
 */
export async function savePersonnelRecord(personnel) {
  // 1. Immediately update local storage and notify all subscribers with zero latency
  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]');
  const idx = list.findIndex((p) => p.id === personnel.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...personnel };
  } else {
    list.unshift(personnel);
  }
  localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify(list));
  notifyPersonnelSubscribers(list);

  // 2. Persist to Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'personnel', personnel.id), personnel, { merge: true });
      console.log('✅ Successfully persisted personnel to Cloud Firestore:', personnel.id);
    } catch (e) {
      console.error('Firestore save personnel failed', e);
      if (e?.code === 'permission-denied' && typeof window !== 'undefined') {
        alert(
          '⚠️ ข้อมูลถูกบันทึกใน Local Cache แต่ยังไม่สามารถส่งขึ้น Cloud Firestore ได้!\n\n' +
          'สาเหตุ: Firestore ติด Security Rules (Permission Denied)\n' +
          'วิธีแก้: ไปที่ Firebase Console > Firestore Database > แท็บ Rules แล้วเปลี่ยนกฎเป็น allow read, write: if true; แล้วกด Publish'
        );
      }
    }
  }

  return personnel;
}

/**
 * Delete Personnel
 */
export async function deletePersonnelRecord(id) {
  // 1. Immediately update local storage and notify all subscribers with zero latency
  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]');
  const filtered = list.filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify(filtered));
  notifyPersonnelSubscribers(filtered);

  // 2. Persist deletion to Firestore
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'personnel', id));
      console.log('✅ Successfully deleted personnel from Cloud Firestore:', id);
    } catch (e) {
      console.error('Firestore delete personnel failed', e);
      if (e?.code === 'permission-denied' && typeof window !== 'undefined') {
        alert(
          '⚠️ ลบจาก Local Cache แล้วแต่ไม่สามารถลบใน Firestore ได้เนื่องจากติด Firestore Security Rules (Permission Denied)'
        );
      }
    }
  }

  return true;
}

/**
 * Save / Update Department
 */
export async function saveDepartmentRecord(department) {
  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_DEPTS) || '[]');
  const idx = list.findIndex((d) => d.id === department.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...department };
  } else {
    list.push(department);
  }
  localStorage.setItem(LOCAL_KEY_DEPTS, JSON.stringify(list));
  notifyDepartmentSubscribers(list);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'departments', department.id), department, { merge: true });
    } catch (e) {
      console.error('Firestore save department failed', e);
    }
  }

  return department;
}

/**
 * Save / Update Executive
 */
export async function saveExecutiveRecord(executive) {
  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]');
  const idx = list.findIndex((ex) => ex.id === executive.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...executive };
  } else {
    list.push(executive);
  }
  localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(list));
  notifyExecutiveSubscribers(list);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'executives', executive.id), executive, { merge: true });
    } catch (e) {
      console.error('Firestore save executive failed', e);
    }
  }

  return executive;
}

/**
 * Delete Executive
 */
export async function deleteExecutiveRecord(id) {
  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]');
  const filtered = list.filter((ex) => ex.id !== id);
  localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(filtered));
  notifyExecutiveSubscribers(filtered);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'executives', id));
    } catch (e) {
      console.error('Firestore delete executive failed', e);
    }
  }

  return true;
}

/**
 * Save / Update Leave Record
 */
export async function saveLeaveRecord(leave) {
  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
  const idx = list.findIndex((l) => l.id === leave.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...leave };
  } else {
    list.unshift(leave);
  }
  localStorage.setItem(LOCAL_KEY_LEAVES, JSON.stringify(list));
  notifyLeaveSubscribers(list);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'leaves', leave.id), leave, { merge: true });
      console.log('✅ Successfully persisted leave to Cloud Firestore:', leave.id);
    } catch (e) {
      console.error('Firestore save leave failed', e);
      if (e?.code === 'permission-denied' && typeof window !== 'undefined') {
        alert(
          '⚠️ ข้อมูลการลาถูกบันทึกในแคชของเบราว์เซอร์ แต่ยังไม่สามารถบันทึกลง Cloud Firestore ได้!\n\n' +
          'สาเหตุ: ติด Security Rules (Permission Denied)\n' +
          'วิธีแก้: ไปที่ Firebase Console > Firestore Database > แท็บ Rules แล้วตรวจดูว่าอนุญาตคอลเลกชัน leaves หรือไม่'
        );
      }
    }
  }

  return leave;
}

/**
 * Delete Leave Record
 */
export async function deleteLeaveRecord(id) {
  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
  const filtered = list.filter((l) => l.id !== id);
  localStorage.setItem(LOCAL_KEY_LEAVES, JSON.stringify(filtered));
  notifyLeaveSubscribers(filtered);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'leaves', id));
      console.log('✅ Successfully deleted leave from Cloud Firestore:', id);
    } catch (e) {
      console.error('Firestore delete leave failed', e);
      if (e?.code === 'permission-denied' && typeof window !== 'undefined') {
        alert(
          '⚠️ ข้อมูลถูกลบในแคช แต่ไม่สามารถลบจาก Cloud Firestore ได้เนื่องจากติดสิทธิ์ (Permission Denied)'
        );
      }
    }
  }

  return true;
}

/**
 * Synchronize all local leaves to Cloud Firestore using Atomic writeBatch
 * Chunks into batches of up to 450 documents (Firestore limit: 500 ops/batch)
 */
export async function syncAllLocalLeavesToFirestore() {
  if (!isFirebaseConfigured || !db) {
    return { success: false, reason: 'Firebase not configured' };
  }

  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
  if (list.length === 0) {
    return { success: true, count: 0, successCount: 0 };
  }

  const BATCH_SIZE = 450;
  let successCount = 0;
  let lastError = null;

  for (let i = 0; i < list.length; i += BATCH_SIZE) {
    const chunk = list.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    chunk.forEach((item) => {
      const ref = doc(db, 'leaves', item.id);
      batch.set(ref, item, { merge: true });
    });

    try {
      await batch.commit();
      successCount += chunk.length;
      console.log(`✅ Successfully batch synced ${chunk.length} leaves to Firestore`);
    } catch (e) {
      console.error('Batch sync leaves failed', e);
      lastError = e;
      break;
    }
  }

  if (lastError) {
    return {
      success: false,
      successCount,
      errorCount: list.length - successCount,
      lastError,
    };
  }

  localStorage.setItem(LOCAL_KEY_LEAVES_SYNC_TIME, Date.now().toString());
  return { success: true, successCount, count: successCount };
}

/**
 * Archive leave records older than cutoffYear (e.g. before cutoffYear-01-01)
 * Moves docs from 'leaves' collection to 'leaves_archive' and updates cache
 */
export async function archiveOldLeaves(cutoffYear) {
  if (!isFirebaseConfigured || !db) {
    return { success: false, reason: 'Firebase not configured' };
  }

  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
  const cutoffStr = `${cutoffYear}-01-01`;

  // Find records strictly before the cutoff date
  const toArchive = list.filter((l) => l.endDate && l.endDate < cutoffStr);
  if (toArchive.length === 0) {
    return { success: true, archivedCount: 0, message: 'ไม่มีข้อมูลวันลาเก่าที่เข้าเกณฑ์จัดเก็บ' };
  }

  // Each record requires 2 ops (1 set into archive + 1 delete from leaves), max 225 records per batch (450 ops)
  const BATCH_SIZE = 225;
  let archivedCount = 0;
  let lastError = null;

  for (let i = 0; i < toArchive.length; i += BATCH_SIZE) {
    const chunk = toArchive.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    chunk.forEach((item) => {
      const archiveRef = doc(db, 'leaves_archive', item.id);
      const leaveRef = doc(db, 'leaves', item.id);
      batch.set(archiveRef, { ...item, archivedAt: new Date().toISOString() });
      batch.delete(leaveRef);
    });

    try {
      await batch.commit();
      archivedCount += chunk.length;
      console.log(`📦 Archived ${chunk.length} leave records to leaves_archive`);
    } catch (e) {
      console.error('Batch archive failed', e);
      lastError = e;
      break;
    }
  }

  if (lastError) {
    return { success: false, archivedCount, lastError };
  }

  // Remove archived items from active localStorage cache
  const remaining = list.filter((l) => !toArchive.some((a) => a.id === l.id));
  localStorage.setItem(LOCAL_KEY_LEAVES, JSON.stringify(remaining));
  notifyLeaveSubscribers(remaining);

  return { success: true, archivedCount };
}

/**
 * ----------------- 3. QUERY HELPERS -----------------
 */

export async function getPersonnelList() {
  if (typeof window === 'undefined') return INITIAL_PERSONNEL;

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'personnel'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn('Firestore fetch failed', e);
    }
  }

  initLocalStorage();
  const raw = localStorage.getItem(LOCAL_KEY_PERSONNEL);
  return raw ? JSON.parse(raw) : INITIAL_PERSONNEL;
}

export async function getDepartmentList() {
  if (typeof window === 'undefined') return INITIAL_DEPARTMENTS;

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'departments'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn('Firestore getDepartmentList failed', e);
    }
  }

  initLocalStorage();
  const raw = localStorage.getItem(LOCAL_KEY_DEPTS);
  return raw ? JSON.parse(raw) : INITIAL_DEPARTMENTS;
}

export async function getExecutiveList() {
  if (typeof window === 'undefined') return INITIAL_EXECUTIVES;

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'executives'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn('Firestore getExecutiveList failed', e);
    }
  }

  initLocalStorage();
  const raw = localStorage.getItem(LOCAL_KEY_EXECS);
  return raw ? JSON.parse(raw) : INITIAL_EXECUTIVES;
}

export async function getLeaveList() {
  if (typeof window === 'undefined') return [];

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'leaves'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn('Firestore getLeaveList failed', e);
    }
  }

  initLocalStorage();
  const raw = localStorage.getItem(LOCAL_KEY_LEAVES);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Find personnel by email (case-insensitive) for whitelist check
 * First checks Firestore directly, then fallback to local cache
 */
export async function findPersonnelByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  if (isFirebaseConfigured && db) {
    try {
      // Query Firestore directly for the matching email
      const q = query(collection(db, 'personnel'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (e) {
      console.warn('Firestore email query failed, checking list', e);
    }
  }

  const list = await getPersonnelList();
  return list.find((p) => p.email && p.email.trim().toLowerCase() === cleanEmail) || null;
}

/**
 * Check if the database already has at least one active Admin
 * Used to prevent privilege escalation on first-admin bootstrap
 */
export async function hasAnyAdmin() {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'personnel'),
        where('role', '==', USER_ROLES.ADMIN),
        where('status', '==', PERSONNEL_STATUS.ACTIVE)
      );
      const snap = await getDocs(q);
      if (!snap.empty) return true;
    } catch (e) {
      console.warn('Firestore hasAnyAdmin query failed, checking list fallback', e);
    }
  }

  const list = await getPersonnelList();
  return list.some(
    (p) => p.role === USER_ROLES.ADMIN && p.status === PERSONNEL_STATUS.ACTIVE
  );
}

/**
 * ----------------- 4. FULL FIRESTORE SYNC & RESET -----------------
 */

/**
 * Force sync all initial seed data into Cloud Firestore
 */
export async function syncAllSeedDataToFirestore() {
  if (!isFirebaseConfigured || !db) {
    console.warn('Cannot sync to Firestore: Firebase is not configured');
    return false;
  }

  try {
    // 1. Sync Personnel
    for (const p of INITIAL_PERSONNEL) {
      await setDoc(doc(db, 'personnel', p.id), p, { merge: true });
    }

    // 2. Sync 6 Departments
    for (const d of INITIAL_DEPARTMENTS) {
      await setDoc(doc(db, 'departments', d.id), d, { merge: true });
    }

    // 3. Sync Executives
    for (const ex of INITIAL_EXECUTIVES) {
      await setDoc(doc(db, 'executives', ex.id), ex, { merge: true });
    }

    return true;
  } catch (e) {
    console.error('Failed to sync seed data to Firestore', e);
    throw e;
  }
}

/**
 * Clear all dummy personnel (optionally keeping the current admin's email)
 */
export async function clearAllPersonnelData(keepEmail = '') {
  const cleanKeepEmail = keepEmail ? keepEmail.trim().toLowerCase() : '';

  if (typeof window !== 'undefined') {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]');
    const filtered = cleanKeepEmail
      ? list.filter((p) => p.email && p.email.trim().toLowerCase() === cleanKeepEmail)
      : [];
    localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify(filtered));
    notifyPersonnelSubscribers(filtered);
  }

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'personnel'));
      for (const d of snap.docs) {
        const data = d.data();
        if (!cleanKeepEmail || (data.email && data.email.trim().toLowerCase() !== cleanKeepEmail)) {
          await deleteDoc(doc(db, 'personnel', d.id));
        }
      }
    } catch (e) {
      console.error('Failed to clear personnel in Firestore', e);
    }
  }
}

/**
 * Clear all dummy executives
 */
export async function clearAllExecutivesData() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify([]));
    notifyExecutiveSubscribers([]);
  }

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'executives'));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'executives', d.id));
      }
    } catch (e) {
      console.error('Failed to clear executives in Firestore', e);
    }
  }
}

/**
 * Reset local seed data
 */
export function resetLocalSeedData() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify(INITIAL_PERSONNEL));
  localStorage.setItem(LOCAL_KEY_DEPTS, JSON.stringify(INITIAL_DEPARTMENTS));
  localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(INITIAL_EXECUTIVES));
  notifyPersonnelSubscribers(INITIAL_PERSONNEL);
  notifyDepartmentSubscribers(INITIAL_DEPARTMENTS);
  notifyExecutiveSubscribers(INITIAL_EXECUTIVES);
}
