// Unified Real-Time Storage Layer: Deeply Synchronized with Firebase Firestore
import { db, isFirebaseConfigured } from './firebase';
import {
  INITIAL_PERSONNEL,
  INITIAL_DEPARTMENTS,
  INITIAL_EXECUTIVES,
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
}

/**
 * ----------------- 1. REAL-TIME SUBSCRIPTIONS (ONSNAPSHOT) -----------------
 */

/**
 * Subscribe to real-time changes of Personnel list
 */
export function subscribePersonnelList(callback) {
  if (typeof window === 'undefined') {
    callback([]);
    return () => {};
  }

  if (isFirebaseConfigured && db) {
    try {
      const unsub = onSnapshot(
        collection(db, 'personnel'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify(list));
            callback(list);
          } else {
            localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify([]));
            callback([]);
          }
        },
        (error) => {
          console.warn('Firestore personnel snapshot error, fallback to local', error);
          initLocalStorage();
          callback(JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]'));
        }
      );
      return unsub;
    } catch (e) {
      console.warn('Failed to attach Firestore snapshot listener', e);
    }
  }

  // Fallback / Demo Mode
  initLocalStorage();
  callback(JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]'));

  const handleStorageChange = () => {
    callback(JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]'));
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}

/**
 * Subscribe to real-time changes of Departments list
 */
export function subscribeDepartmentList(callback) {
  if (typeof window === 'undefined') {
    callback(INITIAL_DEPARTMENTS);
    return () => {};
  }

  if (isFirebaseConfigured && db) {
    try {
      const unsub = onSnapshot(
        collection(db, 'departments'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            localStorage.setItem(LOCAL_KEY_DEPTS, JSON.stringify(list));
            callback(list);
          } else {
            for (const d of INITIAL_DEPARTMENTS) {
              setDoc(doc(db, 'departments', d.id), d);
            }
            callback(INITIAL_DEPARTMENTS);
          }
        },
        (error) => {
          console.warn('Firestore department snapshot error', error);
          initLocalStorage();
          callback(JSON.parse(localStorage.getItem(LOCAL_KEY_DEPTS) || '[]'));
        }
      );
      return unsub;
    } catch (e) {
      console.warn('Failed to attach department listener', e);
    }
  }

  initLocalStorage();
  callback(JSON.parse(localStorage.getItem(LOCAL_KEY_DEPTS) || '[]'));

  const handleStorageChange = () => {
    callback(JSON.parse(localStorage.getItem(LOCAL_KEY_DEPTS) || '[]'));
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}

/**
 * Subscribe to real-time changes of Executives list
 */
export function subscribeExecutiveList(callback) {
  if (typeof window === 'undefined') {
    callback(INITIAL_EXECUTIVES);
    return () => {};
  }

  if (isFirebaseConfigured && db) {
    try {
      const unsub = onSnapshot(
        collection(db, 'executives'),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(list));
            callback(list);
          } else {
            localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify([]));
            callback([]);
          }
        },
        (error) => {
          console.warn('Firestore executive snapshot error', error);
          initLocalStorage();
          callback(JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]'));
        }
      );
      return unsub;
    } catch (e) {
      console.warn('Failed to attach executive listener', e);
    }
  }

  initLocalStorage();
  callback(JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]'));

  const handleStorageChange = () => {
    callback(JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]'));
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}

/**
 * ----------------- 2. CRUD OPERATIONS (WRITE & DELETE) -----------------
 */

/**
 * Save / Update Personnel
 */
export async function savePersonnelRecord(personnel) {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'personnel', personnel.id), personnel, { merge: true });
    } catch (e) {
      console.error('Firestore save personnel failed', e);
    }
  }

  // Update local cache
  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]');
  const idx = list.findIndex((p) => p.id === personnel.id);
  if (idx >= 0) {
    list[idx] = personnel;
  } else {
    list.unshift(personnel);
  }
  localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify(list));
  return personnel;
}

/**
 * Delete Personnel
 */
export async function deletePersonnelRecord(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'personnel', id));
    } catch (e) {
      console.error('Firestore delete personnel failed', e);
    }
  }

  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]');
  const filtered = list.filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify(filtered));
  return true;
}

/**
 * Save / Update Department
 */
export async function saveDepartmentRecord(department) {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'departments', department.id), department, { merge: true });
    } catch (e) {
      console.error('Firestore save department failed', e);
    }
  }

  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_DEPTS) || '[]');
  const idx = list.findIndex((d) => d.id === department.id);
  if (idx >= 0) {
    list[idx] = department;
  } else {
    list.push(department);
  }
  localStorage.setItem(LOCAL_KEY_DEPTS, JSON.stringify(list));
  return department;
}

/**
 * Save / Update Executive
 */
export async function saveExecutiveRecord(executive) {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'executives', executive.id), executive, { merge: true });
    } catch (e) {
      console.error('Firestore save executive failed', e);
    }
  }

  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]');
  const idx = list.findIndex((ex) => ex.id === executive.id);
  if (idx >= 0) {
    list[idx] = executive;
  } else {
    list.push(executive);
  }
  localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(list));
  return executive;
}

/**
 * Delete Executive
 */
export async function deleteExecutiveRecord(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'executives', id));
    } catch (e) {
      console.error('Firestore delete executive failed', e);
    }
  }

  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]');
  const filtered = list.filter((ex) => ex.id !== id);
  localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(filtered));
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

  if (typeof window !== 'undefined') {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]');
    const filtered = cleanKeepEmail
      ? list.filter((p) => p.email && p.email.trim().toLowerCase() === cleanKeepEmail)
      : [];
    localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify(filtered));
  }
}

/**
 * Clear all dummy executives
 */
export async function clearAllExecutivesData() {
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

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify([]));
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
}
