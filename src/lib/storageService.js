// Unified Storage Layer: Supports Firestore (Live) and LocalStorage (Demo/Fallback)
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
 * ----------------- PERSONNEL (บุคลากร) -----------------
 */
export async function getPersonnelList() {
  if (typeof window === 'undefined') return INITIAL_PERSONNEL;

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'personnel'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      // If collection empty, seed it
      for (const p of INITIAL_PERSONNEL) {
        await setDoc(doc(db, 'personnel', p.id), p);
      }
      return INITIAL_PERSONNEL;
    } catch (e) {
      console.warn('Firestore fetch failed, using local storage fallback', e);
    }
  }

  initLocalStorage();
  const raw = localStorage.getItem(LOCAL_KEY_PERSONNEL);
  return raw ? JSON.parse(raw) : INITIAL_PERSONNEL;
}

export async function savePersonnelRecord(personnel) {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'personnel', personnel.id), personnel);
    } catch (e) {
      console.error('Firestore save failed', e);
    }
  }

  // Always update local cache
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

export async function deletePersonnelRecord(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'personnel', id));
    } catch (e) {
      console.error('Firestore delete failed', e);
    }
  }

  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_PERSONNEL) || '[]');
  const filtered = list.filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify(filtered));
  return true;
}

/**
 * Find personnel by email (case-insensitive) for whitelist check
 */
export async function findPersonnelByEmail(email) {
  if (!email) return null;
  const list = await getPersonnelList();
  const cleanEmail = email.trim().toLowerCase();
  return list.find((p) => p.email && p.email.trim().toLowerCase() === cleanEmail) || null;
}

/**
 * ----------------- DEPARTMENTS (ฝ่าย) -----------------
 */
export async function getDepartmentList() {
  if (typeof window === 'undefined') return INITIAL_DEPARTMENTS;

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'departments'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      for (const d of INITIAL_DEPARTMENTS) {
        await setDoc(doc(db, 'departments', d.id), d);
      }
      return INITIAL_DEPARTMENTS;
    } catch (e) {
      console.warn('Firestore fetch failed, using local fallback', e);
    }
  }

  initLocalStorage();
  const raw = localStorage.getItem(LOCAL_KEY_DEPTS);
  return raw ? JSON.parse(raw) : INITIAL_DEPARTMENTS;
}

export async function saveDepartmentRecord(department) {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'departments', department.id), department);
    } catch (e) {
      console.error('Firestore save failed', e);
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
 * ----------------- EXECUTIVES (ผู้บริหาร) -----------------
 */
export async function getExecutiveList() {
  if (typeof window === 'undefined') return INITIAL_EXECUTIVES;

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'executives'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      for (const ex of INITIAL_EXECUTIVES) {
        await setDoc(doc(db, 'executives', ex.id), ex);
      }
      return INITIAL_EXECUTIVES;
    } catch (e) {
      console.warn('Firestore fetch failed, using local fallback', e);
    }
  }

  initLocalStorage();
  const raw = localStorage.getItem(LOCAL_KEY_EXECS);
  return raw ? JSON.parse(raw) : INITIAL_EXECUTIVES;
}

export async function saveExecutiveRecord(executive) {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'executives', executive.id), executive);
    } catch (e) {
      console.error('Firestore save failed', e);
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

export async function deleteExecutiveRecord(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'executives', id));
    } catch (e) {
      console.error('Firestore delete failed', e);
    }
  }

  initLocalStorage();
  const list = JSON.parse(localStorage.getItem(LOCAL_KEY_EXECS) || '[]');
  const filtered = list.filter((ex) => ex.id !== id);
  localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(filtered));
  return true;
}

/**
 * Reset data back to initial seeds
 */
export function resetLocalSeedData() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY_PERSONNEL, JSON.stringify(INITIAL_PERSONNEL));
  localStorage.setItem(LOCAL_KEY_DEPTS, JSON.stringify(INITIAL_DEPARTMENTS));
  localStorage.setItem(LOCAL_KEY_EXECS, JSON.stringify(INITIAL_EXECUTIVES));
}
