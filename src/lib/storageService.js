// Unified Real-Time Storage Layer: Deeply Synchronized with Firebase Firestore
import { db, isFirebaseConfigured } from './firebase';
import {
  INITIAL_PERSONNEL,
  INITIAL_DEPARTMENTS,
  INITIAL_EXECUTIVES,
  INITIAL_LEAVES,
  INITIAL_TIME_ATTENDANCES,
} from './initialData';
import {
  sendTimeAttendanceNotification,
  validateApprovalToken,
  getNotificationRecipientForStep,
} from './emailNotificationService';
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
const LOCAL_KEY_TIME_ATTENDANCES = 'icit_time_attendances';

export const DEFAULT_SERVICE_ORDER = ['org', 'profile', 'attendance', 'leave', 'knowledge', 'survey'];
const LOCAL_KEY_PORTAL_SERVICES = 'icit_portal_services_order';

/**
 * Helper: Check if a leave record is sample / dummy data
 */
export function isDummyLeaveRecord(l) {
  if (!l) return true;
  const id = String(l.id || '');
  if (id.startsWith('leave-sample') || id.startsWith('sample-')) return true;
  const name = String(l.personnelName || '').trim();
  if (name === 'สมใจ รักดี' || name === 'เอกชัย พงษ์ศิริ' || name === 'นารีรัตน์ สุวรรณโชติ' || name === 'นางสาวจารุชา เจือทอง') {
    const pId = String(l.personnelId || '');
    if (pId.startsWith('pers-2') || pId.startsWith('pers-3') || pId.startsWith('pers-4') || pId.startsWith('pers-8') || pId.startsWith('pers-sample')) {
      return true;
    }
  }
  return false;
}

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
    localStorage.setItem(LOCAL_KEY_LEAVES, JSON.stringify([]));
  } else {
    // Purge any legacy dummy sample leaves from existing local storage
    try {
      const storedLeaves = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
      const cleaned = storedLeaves.filter((l) => !isDummyLeaveRecord(l));
      if (cleaned.length !== storedLeaves.length) {
        localStorage.setItem(LOCAL_KEY_LEAVES, JSON.stringify(cleaned));
      }
    } catch (e) {
      console.warn('Error purging dummy leaves from localStorage', e);
    }
  }
  if (!localStorage.getItem(LOCAL_KEY_TIME_ATTENDANCES)) {
    localStorage.setItem(LOCAL_KEY_TIME_ATTENDANCES, JSON.stringify(INITIAL_TIME_ATTENDANCES));
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
const portalServiceSubscribers = new Set();
const timeAttendanceSubscribers = new Set();
let cachedTimeAttendances = null;

function notifyTimeAttendanceSubscribers(list) {
  const cloned = Array.isArray(list) ? [...list] : [];
  cachedTimeAttendances = cloned;
  timeAttendanceSubscribers.forEach((cb) => {
    try {
      cb(cloned);
    } catch (e) {
      console.error('Time attendance subscriber notification error', e);
    }
  });
}

function notifyPortalServiceSubscribers(order) {
  portalServiceSubscribers.forEach((cb) => {
    try {
      cb(order);
    } catch (e) {
      console.error('Error notifying portal service subscriber', e);
    }
  });
}

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
 * Helper: Sort executives by custom order, then ID
 */
export function sortExecutives(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const ordA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
    const ordB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
    if (ordA !== ordB) return ordA - ordB;
    return (a.id || '').localeCompare(b.id || '');
  });
}

/**
 * Subscribe to real-time changes of Executives list
 */
export function subscribeExecutiveList(callback) {
  if (typeof window === 'undefined') {
    callback(sortExecutives(INITIAL_EXECUTIVES));
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
            const rawList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            const list = sortExecutives(rawList);
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
          const list = sortExecutives(JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]'));
          callback(list);
        }
      );
    } catch (e) {
      console.warn('Failed to attach executive listener', e);
    }
  }

  initLocalStorage();
  const cachedList = sortExecutives(JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]'));
  callback(cachedList);

  const handleStorageChange = () => {
    const list = sortExecutives(JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]'));
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
  const existing = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]').filter((l) => !isDummyLeaveRecord(l));
  
  const map = new Map();
  // Keep all existing leaves from cache
  existing.forEach((item) => map.set(item.id, item));
  // Overwrite or insert fetched docs that are not dummy
  fetchedDocs.forEach((item) => {
    if (!isDummyLeaveRecord(item)) {
      map.set(item.id, item);
    } else if (isFirebaseConfigured && db) {
      // Asynchronously clean dummy sample from Firestore
      deleteDoc(doc(db, 'leaves', item.id)).catch(() => {});
    }
  });

  const merged = Array.from(map.values());
  localStorage.setItem(LOCAL_KEY_LEAVES, JSON.stringify(merged));
  localStorage.setItem(LOCAL_KEY_LEAVES_SYNC_TIME, Date.now().toString());
  return merged;
}

/**
 * Helper: Filter a list of leaves by calendar year
 */
function filterLeavesByYear(list, year) {
  if (!Array.isArray(list)) return [];
  const cleanList = list.filter((l) => !isDummyLeaveRecord(l));
  if (!year) return cleanList;
  const yStr = year.toString();
  return cleanList.filter((l) => {
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
 * Subscribe to real-time changes of Portal Services Order
 */
export function subscribePortalServicesOrder(callback) {
  if (typeof window === 'undefined') {
    callback(DEFAULT_SERVICE_ORDER);
    return () => {};
  }

  portalServiceSubscribers.add(callback);

  let firestoreUnsub = null;
  if (isFirebaseConfigured && db) {
    try {
      firestoreUnsub = onSnapshot(
        doc(db, 'settings', 'portal_services'),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data?.order) && data.order.length > 0) {
              let mergedOrder = [...data.order];
              if (!mergedOrder.includes('attendance')) {
                const profileIdx = mergedOrder.indexOf('profile');
                if (profileIdx !== -1) {
                  mergedOrder.splice(profileIdx + 1, 0, 'attendance');
                } else {
                  mergedOrder.push('attendance');
                }
              }
              DEFAULT_SERVICE_ORDER.forEach((id) => {
                if (!mergedOrder.includes(id)) mergedOrder.push(id);
              });
              localStorage.setItem(LOCAL_KEY_PORTAL_SERVICES, JSON.stringify(mergedOrder));
              notifyPortalServiceSubscribers(mergedOrder);
            }
          }
        },
        (err) => {
          console.warn('Firestore portal_services listener error', err);
        }
      );
    } catch (e) {
      console.warn('Failed to attach portal_services listener', e);
    }
  }

  // Initial emit from localStorage or default
  const cached = localStorage.getItem(LOCAL_KEY_PORTAL_SERVICES);
  let initialOrder = DEFAULT_SERVICE_ORDER;
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let merged = [...parsed];
        if (!merged.includes('attendance')) {
          const profileIdx = merged.indexOf('profile');
          if (profileIdx !== -1) {
            merged.splice(profileIdx + 1, 0, 'attendance');
          } else {
            merged.push('attendance');
          }
        }
        DEFAULT_SERVICE_ORDER.forEach((id) => {
          if (!merged.includes(id)) merged.push(id);
        });
        initialOrder = merged;
      }
    } catch {}
  }
  callback(initialOrder);

  const handleStorageChange = (e) => {
    if (e.key === LOCAL_KEY_PORTAL_SERVICES && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          let merged = [...parsed];
          if (!merged.includes('attendance')) merged.push('attendance');
          callback(merged);
        }
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorageChange);

  return () => {
    portalServiceSubscribers.delete(callback);
    window.removeEventListener('storage', handleStorageChange);
    if (firestoreUnsub) {
      firestoreUnsub();
    }
  };
}

/**
 * Save Portal Services Order
 */
export async function savePortalServicesOrder(order) {
  if (!Array.isArray(order)) return order;

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_PORTAL_SERVICES, JSON.stringify(order));
  }
  notifyPortalServiceSubscribers(order);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(
        doc(db, 'settings', 'portal_services'),
        {
          order,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log('✅ Successfully persisted portal services order to Firestore');
    } catch (e) {
      console.error('Failed to persist portal services order to Firestore', e);
    }
  }

  return order;
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
  const execWithOrder = {
    ...executive,
    order: executive.order !== undefined ? executive.order : (idx >= 0 && list[idx].order !== undefined ? list[idx].order : list.length),
  };

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...execWithOrder };
  } else {
    list.push(execWithOrder);
  }
  const sorted = sortExecutives(list);
  localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(sorted));
  notifyExecutiveSubscribers(sorted);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'executives', execWithOrder.id), execWithOrder, { merge: true });
    } catch (e) {
      console.error('Firestore save executive failed', e);
    }
  }

  return execWithOrder;
}

/**
 * Save / Update Executive Order (Moveable Executive Cards)
 */
export async function saveExecutiveOrder(reorderedList) {
  initLocalStorage();
  const updatedList = reorderedList.map((exec, idx) => ({
    ...exec,
    order: idx,
  }));

  localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(updatedList));
  notifyExecutiveSubscribers(updatedList);

  if (isFirebaseConfigured && db) {
    try {
      const batch = writeBatch(db);
      updatedList.forEach((exec) => {
        batch.set(doc(db, 'executives', exec.id), { order: exec.order }, { merge: true });
      });
      batch.set(
        doc(db, 'settings', 'executives_order'),
        {
          order: updatedList.map((e) => e.id),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      await batch.commit();
      console.log('✅ Successfully persisted executive order to Firestore');
    } catch (e) {
      console.error('Firestore save executive order failed', e);
    }
  }

  return updatedList;
}

/**
 * Delete Executive
 */
export async function deleteExecutiveRecord(id) {
  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]');
  const filtered = list.filter((ex) => ex.id !== id);
  const reindexed = filtered.map((ex, idx) => ({ ...ex, order: idx }));
  localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(reindexed));
  notifyExecutiveSubscribers(reindexed);

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

  // Also clean all dummy leaves
  await clearAllDummyLeavesData();
}

/**
 * Clear all dummy leave records from localStorage and Firestore
 */
export async function clearAllDummyLeavesData() {
  if (typeof window !== 'undefined') {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
    const filtered = list.filter((l) => !isDummyLeaveRecord(l));
    localStorage.setItem(LOCAL_KEY_LEAVES, JSON.stringify(filtered));
    notifyLeaveSubscribers(filtered);
  }

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'leaves'));
      for (const d of snap.docs) {
        const data = { id: d.id, ...d.data() };
        if (isDummyLeaveRecord(data)) {
          await deleteDoc(doc(db, 'leaves', d.id));
        }
      }
    } catch (e) {
      console.error('Failed to clear dummy leaves in Firestore', e);
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

/**
 * ----------------- 8. TIME ATTENDANCE REQUESTS (ระบบใบลงเวลา) -----------------
 */

/**
 * Read time attendance list from localStorage synchronously
 */
export function getTimeAttendanceList() {
  if (cachedTimeAttendances !== null) return cachedTimeAttendances;
  if (typeof window === 'undefined') return INITIAL_TIME_ATTENDANCES;
  initLocalStorage();
  const raw = localStorage.getItem(LOCAL_KEY_TIME_ATTENDANCES);
  cachedTimeAttendances = raw ? JSON.parse(raw) : INITIAL_TIME_ATTENDANCES;
  return cachedTimeAttendances;
}

/**
 * Find time attendance record by ID
 */
export function getTimeAttendanceById(id) {
  const list = getTimeAttendanceList();
  return list.find((item) => item.id === id) || null;
}

/**
 * Subscribe to Time Attendance Requests with Real-Time Firestore Sync
 */
export function subscribeTimeAttendanceList(callback, options = {}) {
  // 1. Immediate sync response (0ms)
  const initialData = getTimeAttendanceList();
  callback(initialData);

  // 2. Register in-memory pub-sub callback
  timeAttendanceSubscribers.add(callback);

  let unsubscribeFirestore = () => {};

  // 3. Connect to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'time_attendances'), orderBy('createdAt', 'desc'));
      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_KEY_TIME_ATTENDANCES, JSON.stringify(list));
            }
            notifyTimeAttendanceSubscribers(list);
          }
        },
        (err) => {
          console.warn('Firestore time_attendances subscription error (using local cache)', err);
        }
      );
    } catch (e) {
      console.warn('Failed setting up Firestore listener for time_attendances', e);
    }
  }

  // 4. Cross-tab/window real-time synchronization
  const handleStorageChange = (e) => {
    if (e.key === LOCAL_KEY_TIME_ATTENDANCES && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          notifyTimeAttendanceSubscribers(parsed);
        }
      } catch {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
  }

  return () => {
    timeAttendanceSubscribers.delete(callback);
    unsubscribeFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange);
    }
  };
}

/**
 * Save / Create Time Attendance Request
 */
export async function saveTimeAttendanceRecord(record, createdByPersonnel = null) {
  initLocalStorage();
  const list = getTimeAttendanceList();
  const isNew = !record.id;
  const id = record.id || `ta-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Automatically detect HR officer: ดึงจาก email ของ เจ้าหน้าที่ตำแหน่งบุคลากร
  const allPersonnel = await getPersonnelList();
  const allDepts = await getDepartmentList();
  const allExecs = await getExecutiveList();
  const hrOfficer = getNotificationRecipientForStep(record, 'HR_REVIEW', allPersonnel, allDepts, allExecs);

  const nowIso = new Date().toISOString();
  const fullRecord = {
    ...record,
    id,
    hrOfficerId: record.hrOfficerId || hrOfficer?.id || '',
    hrOfficerName: record.hrOfficerName || hrOfficer?.name || 'เจ้าหน้าที่ฝ่ายบุคคล',
    hrOfficerEmail: record.hrOfficerEmail || hrOfficer?.email || '',
    hrEmail: record.hrEmail || record.hrOfficerEmail || hrOfficer?.email || '',
    currentStep: record.currentStep || 'HR_REVIEW',
    statusHr: record.statusHr || 'รอตรวจสอบ',
    commentHr: record.commentHr || '',
    statusWitness: record.statusWitness || 'รอรับรอง',
    witnessComment: record.witnessComment || '',
    statusDeptHead: record.statusDeptHead || 'รออนุมัติ',
    deptHeadComment: record.deptHeadComment || '',
    statusDeputy: record.statusDeputy || 'รออนุมัติ',
    deputyComment: record.deputyComment || '',
    finalStatus: record.finalStatus || 'รอดำเนินการ',
    activityLog: record.activityLog || [
      {
        step: 'CREATE',
        actorName: createdByPersonnel?.name || record.requesterName,
        actorEmail: createdByPersonnel?.email || record.requesterEmail,
        action: `ยื่นคำขอ${record.requestType || 'ใบลงเวลา'}`,
        timestamp: nowIso,
      },
    ],
    createdAt: record.createdAt || nowIso,
    updatedAt: nowIso,
  };

  // Optimistic update
  const idx = list.findIndex((item) => item.id === id);
  if (idx >= 0) {
    list[idx] = fullRecord;
  } else {
    list.unshift(fullRecord);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_TIME_ATTENDANCES, JSON.stringify(list));
  }
  notifyTimeAttendanceSubscribers(list);

  // Firestore sync
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'time_attendances', id), fullRecord, { merge: true });
    } catch (e) {
      console.error('Failed to sync time attendance to Firestore', e);
    }
  }

  // Trigger initial email notification to HR officer if new request
  let notifiedRecipient = null;
  let emailDispatchResult = null;
  if (isNew) {
    try {
      const allPersonnel = await getPersonnelList();
      const allDepts = await getDepartmentList();
      const allExecs = await getExecutiveList();
      notifiedRecipient = getNotificationRecipientForStep(fullRecord, 'HR_REVIEW', allPersonnel, allDepts, allExecs);
      emailDispatchResult = await sendTimeAttendanceNotification(fullRecord, 'HR_REVIEW', notifiedRecipient);
    } catch (err) {
      console.warn('Initial email dispatch error', err);
    }
  }

  return { ...fullRecord, _notifiedRecipient: notifiedRecipient, _emailDispatchResult: emailDispatchResult };
}

/**
 * Progress Workflow: Update Time Attendance Approval at each of the 4 steps
 */
export async function updateTimeAttendanceApproval(
  id,
  step,
  decision, // 'approve' | 'reject'
  comment = '',
  actorPersonnel = null
) {
  initLocalStorage();
  const list = getTimeAttendanceList();
  const idx = list.findIndex((item) => item.id === id);
  if (idx < 0) throw new Error('ไม่พบข้อมูลใบลงเวลาที่ระบุ');

  const rec = { ...list[idx] };
  const nowIso = new Date().toISOString();
  const actorName = actorPersonnel?.name || 'ผู้มีอำนาจอนุมัติ';
  const actorEmail = actorPersonnel?.email || '';

  let actionText = '';
  let nextStep = rec.currentStep;
  let nextRecipient = null;

  if (step === 'HR_REVIEW') {
    if (decision === 'approve') {
      rec.statusHr = 'ตรวจสอบแล้ว';
      rec.currentStep = 'WITNESS_CONFIRM';
      nextStep = 'WITNESS_CONFIRM';
      actionText = 'ตรวจสอบแล้ว (ผ่านการตรวจสอบ)';
    } else {
      rec.statusHr = 'ไม่ผ่านการตรวจสอบ';
      rec.currentStep = 'REJECTED';
      rec.finalStatus = 'ไม่ผ่านการตรวจสอบ (ฝ่ายบุคคล)';
      nextStep = 'REJECTED';
      actionText = 'ไม่ผ่านการตรวจสอบ';
    }
    rec.commentHr = comment || rec.commentHr;
    rec.checkedByHrName = actorName;
    rec.checkedByHrAt = nowIso;
  } else if (step === 'WITNESS_CONFIRM') {
    if (decision === 'approve') {
      rec.statusWitness = 'รับรอง';
      rec.currentStep = 'DEPT_HEAD_APPROVE';
      nextStep = 'DEPT_HEAD_APPROVE';
      actionText = 'รับรองการเป็นพยาน';
    } else {
      rec.statusWitness = 'ไม่รับรอง';
      rec.currentStep = 'REJECTED';
      rec.finalStatus = 'พยานไม่รับรอง';
      nextStep = 'REJECTED';
      actionText = 'ไม่รับรองการเป็นพยาน';
    }
    rec.witnessComment = comment;
    rec.witnessConfirmedAt = nowIso;
  } else if (step === 'DEPT_HEAD_APPROVE') {
    if (decision === 'approve') {
      rec.statusDeptHead = 'อนุมัติ';
      rec.currentStep = 'DEPUTY_APPROVE';
      nextStep = 'DEPUTY_APPROVE';
      actionText = 'หัวหน้าฝ่ายอนุมัติ';
    } else {
      rec.statusDeptHead = 'ไม่อนุมัติ';
      rec.currentStep = 'REJECTED';
      rec.finalStatus = 'หัวหน้าฝ่ายไม่อนุมัติ';
      nextStep = 'REJECTED';
      actionText = 'หัวหน้าฝ่ายไม่อนุมัติ';
    }
    rec.deptHeadComment = comment;
    rec.deptHeadApprovedAt = nowIso;
  } else if (step === 'DEPUTY_APPROVE') {
    if (decision === 'approve') {
      rec.statusDeputy = 'อนุมัติ';
      rec.currentStep = 'COMPLETED';
      rec.finalStatus = 'อนุมัติสมบูรณ์';
      nextStep = 'COMPLETED';
      actionText = 'รอง ผอ.ฝ่ายบริหาร อนุมัติ (จบกระบวนการ)';
    } else {
      rec.statusDeputy = 'ไม่อนุมัติ';
      rec.currentStep = 'REJECTED';
      rec.finalStatus = 'รอง ผอ. ไม่อนุมัติ';
      nextStep = 'REJECTED';
      actionText = 'รอง ผอ. ไม่อนุมัติ';
    }
    rec.deputyComment = comment;
    rec.deputyApprovedAt = nowIso;
  }

  // Append to Activity Timeline Log
  const activityItem = {
    step,
    actorName,
    actorEmail,
    action: actionText,
    comment: comment || '-',
    timestamp: nowIso,
  };

  rec.activityLog = [...(rec.activityLog || []), activityItem];
  rec.updatedAt = nowIso;

  // Optimistic update
  const updatedList = list.map((item, i) => (i === idx ? rec : item));
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_TIME_ATTENDANCES, JSON.stringify(updatedList));
  }
  notifyTimeAttendanceSubscribers(updatedList);

  // Firestore sync
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'time_attendances', id), rec, { merge: true });
    } catch (e) {
      console.error('Failed to update time attendance in Firestore', e);
    }
  }

  // Dispatch Email Notification to next actor
  try {
    const allPersonnel = await getPersonnelList();
    const allDepts = await getDepartmentList();
    const allExecs = await getExecutiveList();
    const nextRecipient = getNotificationRecipientForStep(rec, nextStep, allPersonnel, allDepts, allExecs);
    if (nextRecipient) {
      await sendTimeAttendanceNotification(rec, nextStep, nextRecipient);
    }
  } catch (err) {
    console.warn('Email dispatch to next workflow reviewer failed', err);
  }

  return rec;
}

/**
 * 1-Click Action Executor (from Email link)
 */
export async function executeOneClickApproval(actionId, step, decision, token, actorPersonnel, comment = '') {
  if (!validateApprovalToken(token, actionId, step)) {
    throw new Error('รหัสยืนยัน (Token) ในลิงก์ไม่ถูกต้องหรือหมดอายุ');
  }
  const record = getTimeAttendanceById(actionId);
  if (!record) {
    throw new Error('ไม่พบข้อมูลคำขอใบลงเวลาในระบบ');
  }
  if (record.currentStep !== step) {
    throw new Error(`คำขอนี้ไม่อยู่ในขั้นตอนที่ระบุแล้ว (สถานะปัจจุบัน: ${record.currentStep})`);
  }

  const finalComment = comment && comment.trim()
    ? comment.trim()
    : 'ดำเนินการผ่านลิงก์ยืนยันในอีเมล (1-Click Action)';

  return await updateTimeAttendanceApproval(
    actionId,
    step,
    decision,
    finalComment,
    actorPersonnel || { name: 'ผู้ดำเนินการผ่านอีเมล' }
  );
}

/**
 * Cancel Time Attendance Request (by requester before finished by Deputy Director)
 */
export async function cancelTimeAttendanceRecord(id, reason = '', actorPersonnel) {
  initLocalStorage();
  const list = getTimeAttendanceList();
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) {
    throw new Error('ไม่พบข้อมูลคำขอใบลงเวลาในระบบ');
  }

  const rec = { ...list[idx] };

  // Rule: can be cancelled by requester but only if it has not yet been finished สมบูรณ์ by รองผู้อำนวยการฝ่ายบริหาร
  if (rec.currentStep === 'COMPLETED' || rec.statusDeputy === 'อนุมัติ') {
    throw new Error('ไม่สามารถยกเลิกคำขอนี้ได้ เนื่องจากได้รับการอนุมัติสมบูรณ์โดยรองผู้อำนวยการฝ่ายบริหารแล้ว');
  }

  if (rec.currentStep === 'CANCELLED') {
    throw new Error('คำขอนี้ถูกยกเลิกไปแล้ว');
  }

  const nowIso = new Date().toISOString();
  const actorName = actorPersonnel?.name || 'ผู้ยื่นคำขอ';
  const actorEmail = actorPersonnel?.email || '';

  rec.currentStep = 'CANCELLED';
  rec.finalStatus = 'ยกเลิกโดยผู้ยื่นคำขอ';
  rec.cancelledAt = nowIso;
  rec.cancelledByName = actorName;
  rec.cancelledByEmail = actorEmail;
  rec.cancelReason = reason || 'ผู้ยื่นขอยกเลิกคำขอ';

  // Activity Log
  const activityItem = {
    step: 'CANCELLED',
    actorName,
    actorEmail,
    action: 'ยกเลิกคำขอลงเวลา',
    comment: reason || 'ผู้ยื่นขอยกเลิกคำขอ',
    timestamp: nowIso,
  };

  rec.activityLog = [...(rec.activityLog || []), activityItem];
  rec.updatedAt = nowIso;

  // Optimistic update
  const updatedList = list.map((item, i) => (i === idx ? rec : item));
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_TIME_ATTENDANCES, JSON.stringify(updatedList));
  }
  notifyTimeAttendanceSubscribers(updatedList);

  // Firestore sync
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'time_attendances', id), rec, { merge: true });
    } catch (e) {
      console.error('Failed to update cancelled time attendance in Firestore', e);
    }
  }

  // Dispatch Cancellation Email Notification
  try {
    const allPersonnel = await getPersonnelList();
    const allDepts = await getDepartmentList();
    const allExecs = await getExecutiveList();
    const notifyRecipient = getNotificationRecipientForStep(rec, 'HR_REVIEW', allPersonnel, allDepts, allExecs);
    if (notifyRecipient) {
      await sendTimeAttendanceNotification(rec, 'CANCELLED', notifyRecipient);
    }
  } catch (err) {
    console.warn('Email dispatch for cancellation failed', err);
  }

  return rec;
}

/**
 * Delete Time Attendance Record
 */
export async function deleteTimeAttendanceRecord(id) {
  initLocalStorage();
  const list = getTimeAttendanceList();
  const filtered = list.filter((item) => item.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_TIME_ATTENDANCES, JSON.stringify(filtered));
  }
  notifyTimeAttendanceSubscribers(filtered);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'time_attendances', id));
    } catch (e) {
      console.error('Failed to delete time attendance in Firestore', e);
    }
  }
  return true;
}

/**
 * Reset Time Attendance seed data
 */
export function resetTimeAttendanceSeedData() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY_TIME_ATTENDANCES, JSON.stringify(INITIAL_TIME_ATTENDANCES));
  notifyTimeAttendanceSubscribers(INITIAL_TIME_ATTENDANCES);
}

