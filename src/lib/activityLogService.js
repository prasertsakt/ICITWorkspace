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
  AUTH: 'AUTH',
  PAGE_VIEW: 'PAGE_VIEW',
  PERSONNEL: 'PERSONNEL',
  ATTENDANCE: 'ATTENDANCE',
  LEAVE: 'LEAVE',
  EXECUTIVE: 'EXECUTIVE',
  DEPARTMENT: 'DEPARTMENT',
  JD_HUB: 'JD_HUB',
  IDP: 'IDP',
  IDP_ACTION_PLAN: 'IDP_ACTION_PLAN',
  SKILL_MAP: 'SKILL_MAP',
  KM_HUB: 'KM_HUB',
  IMS_AUDIT: 'IMS_AUDIT',
  IMS_CAR: 'IMS_CAR',
  IMS_OFI: 'IMS_OFI',
  TQA_OFI: 'TQA_OFI',
  EMAIL: 'EMAIL',
  PORTAL: 'PORTAL',
  SYSTEM: 'SYSTEM',
};

export const CATEGORY_DEFINITIONS = {
  [ACTIVITY_CATEGORIES.AUTH]: {
    label: 'การเข้าสู่ระบบ (Auth)',
    shortLabel: 'เข้าสู่ระบบ',
    color: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  [ACTIVITY_CATEGORIES.PAGE_VIEW]: {
    label: 'การเข้าชมหน้าเว็บ (Page View)',
    shortLabel: 'เข้าชมหน้า',
    color: '#64748B',
    bgColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  [ACTIVITY_CATEGORIES.PERSONNEL]: {
    label: 'จัดการบุคลากร (Personnel)',
    shortLabel: 'บุคลากร',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  [ACTIVITY_CATEGORIES.ATTENDANCE]: {
    label: 'ขอลงเวลา/WFH/OT (Attendance)',
    shortLabel: 'ลงเวลา',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  [ACTIVITY_CATEGORIES.LEAVE]: {
    label: 'ปฏิทินวันลา (Leave)',
    shortLabel: 'วันลา',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  [ACTIVITY_CATEGORIES.EXECUTIVE]: {
    label: 'คณะผู้บริหาร (Executive)',
    shortLabel: 'ผู้บริหาร',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  [ACTIVITY_CATEGORIES.DEPARTMENT]: {
    label: 'โครงสร้างฝ่ายงาน (Department)',
    shortLabel: 'ฝ่ายงาน',
    color: '#475569',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  [ACTIVITY_CATEGORIES.JD_HUB]: {
    label: 'แบบบรรยายลักษณะงาน (JD Hub)',
    shortLabel: 'JD Hub',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  [ACTIVITY_CATEGORIES.IDP]: {
    label: 'แผนพัฒนารายบุคคล (IDP Hub)',
    shortLabel: 'IDP',
    color: '#0891B2',
    bgColor: '#ECFEFF',
    borderColor: '#A5F3FC',
  },
  [ACTIVITY_CATEGORIES.IDP_ACTION_PLAN]: {
    label: 'แผนปฏิบัติการ IDP (Action Plan)',
    shortLabel: 'Action Plan',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  [ACTIVITY_CATEGORIES.SKILL_MAP]: {
    label: 'แผนที่ทักษะ (Skill Map)',
    shortLabel: 'Skill Map',
    color: '#9333EA',
    bgColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  [ACTIVITY_CATEGORIES.KM_HUB]: {
    label: 'องค์ความรู้ & ติดตาม (KM Hub)',
    shortLabel: 'KM Hub',
    color: '#047857',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  [ACTIVITY_CATEGORIES.IMS_AUDIT]: {
    label: 'ตรวจติดตามภายใน (IMS Audit)',
    shortLabel: 'IMS Audit',
    color: '#4338CA',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  [ACTIVITY_CATEGORIES.IMS_CAR]: {
    label: 'จัดการ CAR & เหตุการณ์ (IMS CAR)',
    shortLabel: 'IMS CAR',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  [ACTIVITY_CATEGORIES.IMS_OFI]: {
    label: 'ติดตาม OFI ภายใน (IMS OFI)',
    shortLabel: 'IMS OFI',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  [ACTIVITY_CATEGORIES.TQA_OFI]: {
    label: 'รายงานผล TQA OFI (TQA Hub)',
    shortLabel: 'TQA OFI',
    color: '#B45309',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  [ACTIVITY_CATEGORIES.EMAIL]: {
    label: 'การส่งอีเมลแจ้งเตือน (Email)',
    shortLabel: 'อีเมล',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  [ACTIVITY_CATEGORIES.PORTAL]: {
    label: 'ตั้งค่าหน้าหลัก (Portal Config)',
    shortLabel: 'Portal',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  [ACTIVITY_CATEGORIES.SYSTEM]: {
    label: 'ระบบและความปลอดภัย (System)',
    shortLabel: 'ระบบ',
    color: '#334155',
    bgColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
};

// In-memory debounce map for page views to avoid spamming Firestore
let lastPageViewMap = new Map();

/**
 * Log a user's page visit with smart 15-second debounce per path
 */
export function logPageView(path, title, user = null) {
  if (typeof window === 'undefined' || !path) return;
  const userKey = user?.email || 'guest';
  const debounceKey = `${userKey}:${path}`;
  const now = Date.now();
  const lastTime = lastPageViewMap.get(debounceKey) || 0;

  // Debounce duplicate page visits within 15 seconds
  if (now - lastTime < 15000) return;
  lastPageViewMap.set(debounceKey, now);

  logActivity({
    category: ACTIVITY_CATEGORIES.PAGE_VIEW,
    action: 'VISIT',
    title: `เข้าชมหน้า: ${title || path}`,
    details: `เข้าใช้งานหน้าเว็บเส้นทาง ${path}`,
    actorName: user?.displayName || user?.name || 'ผู้ใช้งาน',
    actorEmail: user?.email || '',
    targetName: title || path,
    targetId: path,
    status: 'SUCCESS',
    metadata: {
      path,
      title: title || path,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : null,
    },
  }).catch(() => {});
}

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
