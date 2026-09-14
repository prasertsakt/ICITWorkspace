// OFI Hub Service — Manages Opportunity for Improvement (OFI) tracking
// Syncs OFI items from Internal Audit Reports and tracks implementation progress
// Follows the same real-time Firestore + localStorage pattern as imsService.js

import { db, isFirebaseConfigured } from './firebase';
import { logActivity } from './activityLogService';
import { cleanForFirestore } from './imsService';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

const LOCAL_KEY_OFI_ITEMS = 'icit_ims_ofi_items';

// OFI Implementation Status
export const OFI_IMPLEMENT_OPTIONS = {
  YES: 'YES',
  NO: 'NO',
  PENDING: '', // Not yet decided
};

export const OFI_STATUS_OPTIONS = {
  ON_PROCESS: 'ON_PROCESS',
  COMPLETED: 'COMPLETED',
};

export const OFI_STATUS_CONFIG = {
  ON_PROCESS: {
    label: 'กำลังดำเนินการ (On Process)',
    shortLabel: 'กำลังดำเนินการ',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  COMPLETED: {
    label: 'เสร็จสิ้น (Completed)',
    shortLabel: 'เสร็จสิ้น',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
  },
};

// Pub/Sub Single Shared Listener Cache
let ofiSubscribers = [];
let sharedOfiUnsubscribe = null;
let cachedOfiItems = null;

function notifyOfiSubscribers(data) {
  cachedOfiItems = data;
  ofiSubscribers.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('OFI subscriber error:', e);
    }
  });
}

/**
 * Subscribe to all OFI items with real-time Firestore sync & local fallback
 */
export function subscribeOfiItems(callback) {
  ofiSubscribers.push(callback);

  // Send cached or local data immediately
  if (cachedOfiItems) {
    callback(cachedOfiItems);
  } else if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_KEY_OFI_ITEMS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        cachedOfiItems = parsed;
        callback(parsed);
      } catch (e) {
        callback([]);
      }
    } else {
      callback([]);
    }
  }

  // Multi-tab real-time storage event listener
  const handleStorageChange = (e) => {
    if (!e || e.key === LOCAL_KEY_OFI_ITEMS) {
      try {
        const raw = localStorage.getItem(LOCAL_KEY_OFI_ITEMS);
        const list = JSON.parse(raw || '[]');
        cachedOfiItems = list;
        callback(list);
      } catch (err) {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
  }

  // Start shared Firestore listener if not already active
  if (isFirebaseConfigured && db && !sharedOfiUnsubscribe) {
    try {
      const ofiRef = collection(db, 'ims_ofi_hub');
      sharedOfiUnsubscribe = onSnapshot(
        ofiRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() });
            });
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_KEY_OFI_ITEMS, JSON.stringify(list));
            }
            notifyOfiSubscribers(list);
          } else {
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_KEY_OFI_ITEMS, '[]');
            }
            notifyOfiSubscribers([]);
          }
        },
        (error) => {
          console.warn('Firestore ims_ofi_hub onSnapshot error:', error);
        }
      );
    } catch (e) {
      console.warn('Failed to listen to Firestore ims_ofi_hub:', e);
    }
  }

  return () => {
    ofiSubscribers = ofiSubscribers.filter((cb2) => cb2 !== callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange);
    }
    if (ofiSubscribers.length === 0 && sharedOfiUnsubscribe) {
      sharedOfiUnsubscribe();
      sharedOfiUnsubscribe = null;
    }
  };
}

/**
 * Import OFI items from Internal Audit Reports for a given fiscal year
 * Only DCC or MR (or Admin) can trigger this action
 * Checks for duplicates against existing OFI records to prevent duplicate entries
 */
export async function importOfiFromAudits(fiscalYear, audits, actor) {
  const ofiAudits = (audits || []).filter(
    (a) =>
      String(a.auditYear) === String(fiscalYear) &&
      (a.result === 'OFI' || a.overallResult === 'OFI')
  );

  // Get existing OFI items for this year from cache / local storage to avoid duplicates
  let allExisting = cachedOfiItems ? [...cachedOfiItems] : [];
  if (allExisting.length === 0 && typeof window !== 'undefined') {
    try {
      allExisting = JSON.parse(localStorage.getItem(LOCAL_KEY_OFI_ITEMS) || '[]');
    } catch (e) {
      allExisting = [];
    }
  }

  const existingInYear = allExisting.filter(
    (item) => String(item.fiscalYear) === String(fiscalYear)
  );

  // Set of known source audit IDs & item IDs
  const existingSourceIds = new Set(
    existingInYear.map((item) => item.sourceAuditId).filter(Boolean)
  );
  const existingItemIds = new Set(
    existingInYear.map((item) => item.id).filter(Boolean)
  );

  // Robust duplicate checker
  const isDuplicate = (audit) => {
    // 1. Direct ID match
    if (existingSourceIds.has(audit.id) || existingItemIds.has(audit.id)) {
      return true;
    }

    // 2. Exact or normalized Topic + Clauses / Findings matching
    const topicNorm = (audit.topic || '').trim().toLowerCase();
    const clausesNorm = (audit.clauses || '').trim().toLowerCase();
    const findingsNorm = (audit.findings || '').trim().toLowerCase();

    return existingInYear.some((item) => {
      const itemTopic = (item.sourceAuditTopic || '').trim().toLowerCase();
      const itemClauses = (item.sourceClauses || '').trim().toLowerCase();
      const itemFindings = (item.sourceFindings || '').trim().toLowerCase();

      if (topicNorm && itemTopic === topicNorm) {
        if (clausesNorm && itemClauses === clausesNorm) return true;
        if (findingsNorm && itemFindings === findingsNorm) return true;
      }
      return false;
    });
  };

  const newItems = [];
  let skippedCount = 0;
  const now = new Date().toISOString();

  for (const audit of ofiAudits) {
    if (isDuplicate(audit)) {
      skippedCount++;
      continue; // Skip duplicate
    }

    const ofiItem = {
      id: `ofi-${fiscalYear}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fiscalYear: String(fiscalYear),
      sourceAuditId: audit.id,
      sourceAuditTopic: audit.topic || '',
      sourceClauses: audit.clauses || '',
      sourceFindings: audit.findings || '',
      sourceStandard: audit.isoStandard || audit.standard || 'IMS 9001/27001',
      implement: '',
      status: '',
      remark: '',
      departments: [],
      assignees: [],
      detailsHtml: '',
      importedAt: now,
      importedBy: actor?.name || actor?.email || '',
      syncedAt: now,
      syncedBy: actor?.name || actor?.email || '',
      createdAt: now,
      updatedAt: now,
      updatedBy: actor?.name || actor?.email || '',
    };

    newItems.push(ofiItem);
  }

  if (newItems.length > 0) {
    // 1. Update local cache immediately
    const currentList = cachedOfiItems ? [...cachedOfiItems] : allExisting;
    const updatedList = [...newItems, ...currentList];
    cachedOfiItems = updatedList;

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_KEY_OFI_ITEMS, JSON.stringify(updatedList));
    }
    notifyOfiSubscribers(updatedList);

    // 2. Batch commit to Firestore in a single network round-trip
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        newItems.forEach((item) => {
          const docRef = doc(db, 'ims_ofi_hub', item.id);
          batch.set(docRef, cleanForFirestore(item));
        });
        await batch.commit();
      } catch (err) {
        console.warn('Failed to batch save OFI items to Firestore:', err);
      }
    }
  }

  // Log activity
  try {
    logActivity({
      category: 'IMS_OFI',
      action: 'IMPORT_OFI',
      details: `นำเข้า OFI จาก Internal Audit Report ปีงบประมาณ ${fiscalYear} — พบทั้งหมด ${ofiAudits.length} รายการ, นำเข้าใหม่ ${newItems.length} รายการ, ข้ามรายการซ้ำ ${skippedCount} รายการ`,
      actorEmail: actor?.email,
      actorName: actor?.name,
      metadata: {
        fiscalYear,
        totalOfi: ofiAudits.length,
        newItems: newItems.length,
        skipped: skippedCount,
      },
    });
  } catch (e) {}

  return { totalOfi: ofiAudits.length, newItems: newItems.length, skippedCount };
}

// Backward compatibility alias
export const syncOfiFromAudits = importOfiFromAudits;

/**
 * Save/Update an OFI item
 */
export async function saveOfiItem(item, actor, isSync = false) {
  const now = new Date().toISOString();
  const payload = {
    ...item,
    updatedAt: now,
    updatedBy: actor?.name || actor?.email || '',
  };

  // Update local cache
  const currentList = cachedOfiItems ? [...cachedOfiItems] : [];
  const existingIndex = currentList.findIndex((i) => i.id === payload.id);
  if (existingIndex >= 0) {
    currentList[existingIndex] = payload;
  } else {
    currentList.unshift(payload);
  }

  cachedOfiItems = currentList;
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_OFI_ITEMS, JSON.stringify(currentList));
  }
  notifyOfiSubscribers(currentList);

  // Save to Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(
        doc(db, 'ims_ofi_hub', payload.id),
        cleanForFirestore(payload),
        { merge: true }
      );
    } catch (err) {
      console.warn('Failed to save OFI item to Firestore:', err);
    }
  }

  // Log activity for non-sync saves
  if (!isSync) {
    try {
      logActivity({
        category: 'IMS_OFI',
        action: existingIndex >= 0 ? 'UPDATE_OFI' : 'CREATE_OFI',
        details: `${existingIndex >= 0 ? 'อัพเดต' : 'สร้าง'} OFI: ${payload.sourceAuditTopic || payload.id}`,
        actorEmail: actor?.email,
        actorName: actor?.name,
        metadata: { ofiId: payload.id, fiscalYear: payload.fiscalYear },
      });
    } catch (e) {}
  }

  return payload;
}

/**
 * Delete an OFI item
 */
export async function deleteOfiItem(id) {
  const currentList = (cachedOfiItems || []).filter((i) => i.id !== id);
  cachedOfiItems = currentList;

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_OFI_ITEMS, JSON.stringify(currentList));
  }
  notifyOfiSubscribers(currentList);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'ims_ofi_hub', id));
    } catch (err) {
      console.warn('Failed to delete OFI item from Firestore:', err);
    }
  }
}

/**
 * Check if the user can edit an OFI item:
 * - Admin: full access
 * - DCC: full access (assign departments, assignees, all fields)
 * - MR: can edit implement, status, remark, details
 * - Assigned ผู้รับผิดชอบ: can only edit details (via detail modal)
 * - Others: view-only
 */
export function getOfiEditPermission(user, personnel, yearConfig, ofiItem, isAdmin) {
  if (isAdmin) return 'FULL';

  const userEmail = (user?.email || personnel?.email || '').toLowerCase().trim();
  const personId = personnel?.id;

  // Check DCC
  if (yearConfig?.dccEmail && yearConfig.dccEmail.toLowerCase().trim() === userEmail) return 'FULL';
  if (yearConfig?.dccId && personId && yearConfig.dccId === personId) return 'FULL';

  // Check MR
  if (yearConfig?.mrEmail && yearConfig.mrEmail.toLowerCase().trim() === userEmail) return 'MR';
  if (yearConfig?.mrId && personId && yearConfig.mrId === personId) return 'MR';

  // Check Assignee (ผู้รับผิดชอบ)
  if (ofiItem?.assignees && Array.isArray(ofiItem.assignees)) {
    const isAssignee = ofiItem.assignees.some(
      (a) =>
        (a.id && a.id === personId) ||
        (a.email && a.email.toLowerCase().trim() === userEmail)
    );
    if (isAssignee) return 'ASSIGNEE';
  }

  return 'VIEW';
}
