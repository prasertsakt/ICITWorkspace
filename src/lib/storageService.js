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
} from 'firebase/firestore';

const LOCAL_KEY_PERSONNEL = 'icit_org_personnel';
const LOCAL_KEY_DEPTS = 'icit_org_departments';
const LOCAL_KEY_EXECS = 'icit_org_executives';
const LOCAL_KEY_LEAVES = 'icit_org_leaves';

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
 * Subscribe to real-time changes of Leaves list
 */
export function subscribeLeaveList(callback) {
  if (typeof window === 'undefined') {
    callback([]);
    return () => {};
  }

  leaveSubscribers.add(callback);

  let firestoreUnsub = null;
  if (isFirebaseConfigured && db) {
    try {
      firestoreUnsub = onSnapshot(
        collection(db, 'leaves'),
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          localStorage.setItem(LOCAL_KEY_LEAVES, JSON.stringify(list));
          notifyLeaveSubscribers(list);
        },
        (error) => {
          console.warn('Firestore leaves snapshot error', error);
          initLocalStorage();
          const list = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
          callback(list);
        }
      );
    } catch (e) {
      console.warn('Failed to attach leaves listener', e);
    }
  }

  initLocalStorage();
  const cachedList = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
  callback(cachedList);

  const handleStorageChange = () => {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_LEAVES) || '[]');
    callback(list);
  };
  window.addEventListener('storage', handleStorageChange);

  return () => {
    leaveSubscribers.delete(callback);
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
