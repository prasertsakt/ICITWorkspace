// System Audit & Activity Log Service (Synchronized with Firebase Firestore)
import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

export const LOCAL_KEY_ACTIVITY_LOGS = 'icit_system_activity_logs';

export const ACTIVITY_CATEGORIES = {
  EMAIL: 'EMAIL',
  PERSONNEL: 'PERSONNEL',
  ATTENDANCE: 'ATTENDANCE',
  LEAVE: 'LEAVE',
  EXECUTIVE: 'EXECUTIVE',
  DEPARTMENT: 'DEPARTMENT',
  SYSTEM: 'SYSTEM',
};

/**
 * Record a system activity event to Firestore and LocalStorage
 */
export async function logActivity({
  category = ACTIVITY_CATEGORIES.SYSTEM,
  action = 'ACTION',
  title = '',
  details = '',
  actorName = 'ระบบ',
  actorEmail = '',
  targetName = '',
  targetId = '',
  status = 'SUCCESS', // 'SUCCESS' | 'FAILED' | 'PENDING' | 'SIMULATED'
  metadata = {},
}) {
  const logId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const logEntry = {
    id: logId,
    category,
    action,
    title: title || `${category}: ${action}`,
    details: details || '',
    actorName: actorName || 'ผู้ใช้งาน',
    actorEmail: actorEmail || '',
    targetName: targetName || '',
    targetId: targetId || '',
    status,
    metadata: metadata || {},
    loggedAt: nowIso,
  };

  // 1. Save to LocalStorage with max 200 entries
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_ACTIVITY_LOGS);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(logEntry);
      if (list.length > 200) list.pop();
      localStorage.setItem(LOCAL_KEY_ACTIVITY_LOGS, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed saving activity log to localStorage', e);
    }
  }

  // 2. Persist to Cloud Firestore 'activity_logs' collection
  if (typeof window !== 'undefined' && isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'activity_logs', logId), {
        ...logEntry,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore activity_logs write error:', err);
    }
  }

  return logEntry;
}

/**
 * Get cached local activity logs
 */
export function getLocalActivityLogs() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY_ACTIVITY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Real-time subscription to activity logs (with automatic combination of email_logs)
 */
export function subscribeActivityLogs(callback) {
  if (typeof window === 'undefined') return () => {};

  let activityLogs = getLocalActivityLogs();
  let emailLogs = [];

  // Helper to merge and sort both activity_logs and email_logs into a unified timeline
  const mergeAndNotify = (acts, emails) => {
    // Map email_logs into normalized activity log format if not already in activityLogs
    const normalizedEmailActs = (emails || []).map((em) => ({
      id: em.id || `em-${em.loggedAt}`,
      category: ACTIVITY_CATEGORIES.EMAIL,
      action: em.recordId === 'ADMIN_MANUAL_COMPOSE' ? 'SEND_MANUAL_EMAIL' : 'SEND_WORKFLOW_EMAIL',
      title: `ส่งอีเมล: ${em.subject || 'ไม่มีหัวข้อ'}`,
      details: `ส่งถึง: ${em.recipientName ? `${em.recipientName} (${em.recipientEmail})` : em.recipientEmail}${em.cc ? ` • CC: ${em.cc}` : ''}`,
      actorName: em.senderName || 'ผู้ดูแลระบบ (Admin)',
      actorEmail: '',
      targetName: em.recipientName || em.recipientEmail,
      targetId: em.recordId || '',
      status: em.status === 'DELIVERED' ? 'SUCCESS' : em.status === 'SIMULATED' ? 'SIMULATED' : 'FAILED',
      metadata: {
        to: em.recipientEmail,
        cc: em.cc || '',
        bcc: em.bcc || '',
        subject: em.subject,
        deliveryMethod: em.deliveryMethod,
        error: em.error || '',
      },
      loggedAt: em.loggedAt || em.sentAt || new Date().toISOString(),
      isEmailLog: true,
      rawEmailLog: em,
    }));

    // Deduplicate by ID
    const map = new Map();
    [...acts, ...normalizedEmailActs].forEach((item) => {
      if (item && item.id && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });

    const combined = Array.from(map.values()).sort(
      (a, b) => new Date(b.loggedAt || 0) - new Date(a.loggedAt || 0)
    );

    callback(combined);
  };

  // Immediate initial callback
  mergeAndNotify(activityLogs, emailLogs);

  if (isFirebaseConfigured && db) {
    try {
      const qActs = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(150));
      const unsubActs = onSnapshot(
        qActs,
        (snap) => {
          activityLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          mergeAndNotify(activityLogs, emailLogs);
        },
        (err) => console.warn('activity_logs onSnapshot error:', err)
      );

      const qEmails = query(collection(db, 'email_logs'), orderBy('timestamp', 'desc'), limit(150));
      const unsubEmails = onSnapshot(
        qEmails,
        (snap) => {
          emailLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          mergeAndNotify(activityLogs, emailLogs);
        },
        (err) => console.warn('email_logs onSnapshot error:', err)
      );

      return () => {
        unsubActs();
        unsubEmails();
      };
    } catch (err) {
      console.warn('Firestore subscription failed, using local activity logs:', err);
    }
  }

  return () => {};
}

/**
 * Clear activity logs
 */
export async function clearAllActivityLogs() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_KEY_ACTIVITY_LOGS);
  }

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'activity_logs'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.warn('Clear firestore activity_logs error:', e);
    }
  }
}
