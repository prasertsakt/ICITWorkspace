// Real-Time Knowledge Management & Tracking Service (KM Hub)
// Synchronized with Firebase Firestore & Optimized LocalStorage Caching

import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { logActivity, ACTIVITY_CATEGORIES } from './activityLogService';

export const LOCAL_KEY_KM_RECORDS = 'icit_km_records';

export const KM_STATUSES = {
  PENDING: {
    key: 'PENDING',
    label: 'รอดำเนินการแบ่งปัน',
    badgeText: 'รอดำเนินการ',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  IN_PROGRESS: {
    key: 'IN_PROGRESS',
    label: 'อยู่ระหว่างดำเนินการ',
    badgeText: 'กำลังดำเนินการ',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  COMPLETED: {
    key: 'COMPLETED',
    label: 'ดำเนินการเสร็จสิ้น',
    badgeText: 'เสร็จสิ้นสมบูรณ์',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
};

export const SAMPLE_KM_RECORDS = [
  {
    id: 'km-2567-tqa-edu',
    courseTitle: 'อบรมหลักสูตร TQA for Education Sector',
    fiscalYear: '2567',
    organizer: 'สถาบันเพิ่มผลผลิตแห่งชาติ',
    location: 'ณ โรงแรม ฮอลิเดย์ อินน์ ศรีราชา จ.ชลบุรี',
    startDate: '2024-07-10',
    endDate: '2024-07-11',
    budget: 18480,
    attendees: [
      {
        id: 'pers-sample-1',
        name: 'นางสาวชาลินทร์ เกรียงสินยศ',
        email: 'chalin.k@icit.kmutnb.ac.th',
        department: 'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
        position: 'นักวิชาการคอมพิวเตอร์',
      },
      {
        id: 'pers-sample-2',
        name: 'นางสาวพิรานันท์ ลางดี',
        email: 'piranan.l@icit.kmutnb.ac.th',
        department: 'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
        position: 'นักวิชาการคอมพิวเตอร์',
      },
    ],
    sharingMethods: {
      summaryReport: true,
      smallGroupLecture: true,
      lectureDateTime: '2024-08-15 13:30',
      otherMethod: '',
    },
    documentUrls: [
      {
        title: 'รายงานสรุปประมวลความรู้ TQA for Education Sector',
        url: 'https://icit.kmutnb.ac.th/km/tqa-report.pdf',
      },
      {
        title: 'เอกสารประกอบการบรรยายและสไลด์นำเสนอ',
        url: 'https://drive.google.com/drive/folders/sample-tqa-km',
      },
    ],
    status: 'COMPLETED',
    completedDate: '2024-08-15',
    notes: 'ดำเนินการแบ่งปันความรู้และบรรยายกลุ่มย่อยแก่บุคลากรในฝ่ายเรียบร้อยแล้ว',
    createdAt: '2024-07-12T08:30:00.000Z',
    createdBy: 'ผู้ดูแลระบบ',
    updatedAt: '2024-08-16T09:00:00.000Z',
    updatedBy: 'ผู้ดูแลระบบ',
  },
  {
    id: 'km-2568-cloud-ai',
    courseTitle: 'การประยุกต์ใช้ Generative AI และ Cloud Architecture เพื่อพัฒนางานสารสนเทศมหาวิทยาลัย',
    fiscalYear: '2568',
    organizer: 'สมาคมปัญญาประดิษฐ์แห่งประเทศไทย (AIAT)',
    location: 'ศูนย์ประชุมสถาบันบัณฑิตพัฒนบริหารศาสตร์ (NIDA) กรุงเทพฯ',
    startDate: '2025-01-20',
    endDate: '2025-01-22',
    budget: 24500,
    attendees: [
      {
        id: 'pers-sample-3',
        name: 'นายกนก บุญพันธ์จันที',
        email: 'kanok.b@icit.kmutnb.ac.th',
        department: 'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
        position: 'นักวิชาการคอมพิวเตอร์',
      },
      {
        id: 'pers-sample-4',
        name: 'นางสาวธัญนันท์ กระดาษ',
        email: 'thanyanan.k@icit.kmutnb.ac.th',
        department: 'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
        position: 'นักวิชาการคอมพิวเตอร์',
      },
    ],
    sharingMethods: {
      summaryReport: true,
      smallGroupLecture: true,
      lectureDateTime: '2025-02-18 10:00',
      otherMethod: 'จัดทำวิดีโอคลิปการใช้งาน AI Tools',
    },
    documentUrls: [
      {
        title: 'สไลด์ประกอบการบรรยาย Generative AI in Higher Education',
        url: 'https://docs.google.com/presentation/d/sample-ai-slides',
      },
    ],
    status: 'COMPLETED',
    completedDate: '2025-02-18',
    notes: 'สรุปประมวลความรู้และบันทึกคลิปวิดีโอเผยแพร่ในระบบ KM Hub ภายในสำนัก',
    createdAt: '2025-01-23T10:00:00.000Z',
    createdBy: 'ผู้ดูแลระบบ',
    updatedAt: '2025-02-19T11:00:00.000Z',
    updatedBy: 'ผู้ดูแลระบบ',
  },
];

/**
 * Helper: Calculate 2-Month Deadline and 15-Day Periodic Reminders
 * @param {Object} item KM Record
 * @param {Date} [currentDate=new Date()]
 * @returns {Object} Tracking & Notification Status
 */
export function calculateKmNotificationStatus(item, currentDate = new Date()) {
  if (!item) {
    return {
      isCompleted: false,
      isOverdue: false,
      daysRemaining: 0,
      daysOverdue: 0,
      notificationCycle: 0,
      nextNotificationDays: 0,
      statusMessage: '-',
      badgeType: 'neutral',
      badgeColor: '#64748B',
      badgeBg: '#F1F5F9',
      deadlineDateStr: '-',
    };
  }

  if (item.status === 'COMPLETED') {
    return {
      isCompleted: true,
      isOverdue: false,
      daysRemaining: 0,
      daysOverdue: 0,
      notificationCycle: 0,
      nextNotificationDays: 0,
      statusMessage: 'ดำเนินการแบ่งปันความรู้เสร็จสิ้นสมบูรณ์',
      badgeType: 'completed',
      badgeColor: '#059669',
      badgeBg: '#ECFDF5',
      deadlineDateStr: '-',
    };
  }

  const rawEndDate = item.endDate || item.startDate;
  if (!rawEndDate) {
    return {
      isCompleted: false,
      isOverdue: false,
      daysRemaining: 60,
      daysOverdue: 0,
      notificationCycle: 0,
      nextNotificationDays: 15,
      statusMessage: 'รอดำเนินการแบ่งปันความรู้',
      badgeType: 'pending',
      badgeColor: '#D97706',
      badgeBg: '#FEF3C7',
      deadlineDateStr: '-',
    };
  }

  const endD = new Date(rawEndDate);
  if (isNaN(endD.getTime())) {
    return {
      isCompleted: false,
      isOverdue: false,
      daysRemaining: 0,
      daysOverdue: 0,
      notificationCycle: 0,
      nextNotificationDays: 0,
      statusMessage: 'รอดำเนินการ',
      badgeType: 'pending',
      badgeColor: '#D97706',
      badgeBg: '#FEF3C7',
      deadlineDateStr: '-',
    };
  }

  // Calculate 2 months deadline (60 days from training end date)
  const deadlineD = new Date(endD);
  deadlineD.setDate(deadlineD.getDate() + 60);

  const now = new Date(currentDate);
  const diffTime = now.getTime() - endD.getTime();
  const daysSinceEnd = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const deadlineDiffTime = deadlineD.getTime() - now.getTime();
  const daysRemaining = Math.ceil(deadlineDiffTime / (1000 * 60 * 60 * 24));

  const deadlineISO = deadlineD.toISOString().split('T')[0];

  if (daysRemaining >= 0) {
    // Within 2 months window
    return {
      isCompleted: false,
      isOverdue: false,
      daysRemaining,
      daysSinceEnd,
      daysOverdue: 0,
      notificationCycle: 0,
      nextNotificationDays: daysRemaining,
      statusMessage: `อยู่ในกรอบ 2 เดือนหลังอบรม (เหลือเวลาอีก ${daysRemaining} วัน)`,
      badgeType: daysRemaining <= 15 ? 'warning' : 'pending',
      badgeColor: daysRemaining <= 15 ? '#EA580C' : '#D97706',
      badgeBg: daysRemaining <= 15 ? '#FFF7ED' : '#FEF3C7',
      deadlineDateStr: deadlineISO,
    };
  } else {
    // Overdue! (Passed 2 months)
    const daysOverdue = Math.abs(daysRemaining);
    // Notification triggers every 15 days
    const notificationCycle = Math.floor(daysOverdue / 15) + 1;
    const nextNotificationDays = 15 - (daysOverdue % 15);

    return {
      isCompleted: false,
      isOverdue: true,
      daysRemaining: 0,
      daysSinceEnd,
      daysOverdue,
      notificationCycle,
      nextNotificationDays,
      statusMessage: `ครบกำหนด 2 เดือนแล้ว (เกินกำหนด ${daysOverdue} วัน • แจ้งเตือนรอบที่ ${notificationCycle})`,
      badgeType: 'overdue',
      badgeColor: '#DC2626',
      badgeBg: '#FEF2F2',
      deadlineDateStr: deadlineISO,
    };
  }
}

export const LOCAL_KEY_KM_SEEDED = 'icit_km_records_seeded_v2';

// Pub/Sub Single Shared Listener Cache for KM Records
let kmSubscribers = [];
let sharedKmUnsubscribe = null;
let cachedKmRecords = null;

function notifyKmSubscribers(data) {
  cachedKmRecords = data;
  kmSubscribers.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('KM subscriber callback error:', e);
    }
  });
}

/**
 * Subscribe to KM Records with Firestore & LocalStorage Cache
 */
export function subscribeKmRecords(callback) {
  if (typeof window === 'undefined') {
    callback([]);
    return () => {};
  }

  kmSubscribers.push(callback);

  // Send cached data immediately if available
  if (cachedKmRecords !== null) {
    callback(cachedKmRecords);
  } else {
    // Load from local storage cache initially
    try {
      const isSeeded = localStorage.getItem(LOCAL_KEY_KM_SEEDED);
      const raw = localStorage.getItem(LOCAL_KEY_KM_RECORDS);

      if (raw !== null) {
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : [];
        cachedKmRecords = list;
        callback(list);
      } else if (!isSeeded) {
        // First ever load: initialize with sample records and mark seeded
        localStorage.setItem(LOCAL_KEY_KM_SEEDED, 'true');
        localStorage.setItem(LOCAL_KEY_KM_RECORDS, JSON.stringify(SAMPLE_KM_RECORDS));
        cachedKmRecords = SAMPLE_KM_RECORDS;
        callback(SAMPLE_KM_RECORDS);
      } else {
        cachedKmRecords = [];
        callback([]);
      }
    } catch (e) {
      cachedKmRecords = [];
      callback([]);
    }
  }

  // Multi-tab real-time storage event listener
  const handleStorageChange = (e) => {
    if (!e || e.key === LOCAL_KEY_KM_RECORDS) {
      try {
        const raw = localStorage.getItem(LOCAL_KEY_KM_RECORDS);
        const list = raw ? JSON.parse(raw) : [];
        cachedKmRecords = list;
        callback(list);
      } catch (err) {}
    }
  };
  window.addEventListener('storage', handleStorageChange);

  // Start shared Firestore listener if not already active
  if (isFirebaseConfigured && db && !sharedKmUnsubscribe) {
    try {
      const colRef = collection(db, 'km_records');
      const q = query(colRef);

      sharedKmUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const records = [];
            snapshot.forEach((docSnap) => {
              records.push({ id: docSnap.id, ...docSnap.data() });
            });

            // Sort by createdAt / startDate descending
            records.sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0));

            try {
              localStorage.setItem(LOCAL_KEY_KM_SEEDED, 'true');
              localStorage.setItem(LOCAL_KEY_KM_RECORDS, JSON.stringify(records));
            } catch (e) {}

            notifyKmSubscribers(records);
          } else {
            // Firestore collection is currently empty
            const isSeeded = localStorage.getItem(LOCAL_KEY_KM_SEEDED);
            if (!isSeeded) {
              // First time ever on empty DB: seed sample records into Firestore so they can be deleted individually
              localStorage.setItem(LOCAL_KEY_KM_SEEDED, 'true');
              localStorage.setItem(LOCAL_KEY_KM_RECORDS, JSON.stringify(SAMPLE_KM_RECORDS));
              notifyKmSubscribers(SAMPLE_KM_RECORDS);

              // Persist seeds to Firestore in background
              SAMPLE_KM_RECORDS.forEach((rec) => {
                setDoc(doc(db, 'km_records', rec.id), rec).catch((err) =>
                  console.warn('Initial seed write warning:', err)
                );
              });
            } else {
              // DB is empty because user deleted all items
              try {
                localStorage.setItem(LOCAL_KEY_KM_RECORDS, '[]');
              } catch (e) {}
              notifyKmSubscribers([]);
            }
          }
        },
        (err) => {
          console.warn('Firestore km_records subscription warning (using local cache):', err);
        }
      );
    } catch (e) {
      console.error('Failed to attach km_records listener:', e);
    }
  }

  return () => {
    kmSubscribers = kmSubscribers.filter((cb) => cb !== callback);
    window.removeEventListener('storage', handleStorageChange);
    if (kmSubscribers.length === 0 && sharedKmUnsubscribe) {
      sharedKmUnsubscribe();
      sharedKmUnsubscribe = null;
    }
  };
}

/**
 * Save / Update a KM Record
 */
export async function saveKmRecord(recordData, actor) {
  const finalId = recordData.id || `km-${recordData.fiscalYear || '2569'}-${Date.now()}`;
  const now = new Date().toISOString();

  const payload = {
    ...recordData,
    id: finalId,
    courseTitle: (recordData.courseTitle || '').trim(),
    fiscalYear: String(recordData.fiscalYear || '2569'),
    organizer: (recordData.organizer || '').trim(),
    location: (recordData.location || '').trim(),
    startDate: recordData.startDate || '',
    endDate: recordData.endDate || recordData.startDate || '',
    budget: Number(recordData.budget) || 0,
    attendees: Array.isArray(recordData.attendees) ? recordData.attendees : [],
    sharingMethods: recordData.sharingMethods || {
      summaryReport: false,
      smallGroupLecture: false,
      lectureDateTime: '',
      otherMethod: '',
    },
    documentUrls: Array.isArray(recordData.documentUrls)
      ? recordData.documentUrls.filter((u) => u && (typeof u === 'string' ? u.trim() : (u.url || '').trim()))
      : [],
    status: recordData.status || 'PENDING',
    completedDate: recordData.status === 'COMPLETED' ? (recordData.completedDate || now.split('T')[0]) : '',
    notes: (recordData.notes || '').trim(),
    updatedAt: now,
    updatedBy: actor?.name || actor?.email || 'ผู้ดูแลระบบ',
    createdAt: recordData.createdAt || now,
    createdBy: recordData.createdBy || actor?.name || 'ผู้ดูแลระบบ',
  };

  // Immediate in-memory cache and subscriber update
  if (cachedKmRecords) {
    const list = [...cachedKmRecords];
    const idx = list.findIndex((item) => item.id === finalId);
    if (idx >= 0) {
      list[idx] = payload;
    } else {
      list.unshift(payload);
    }
    notifyKmSubscribers(list);
  }

  // Update local storage cache
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_KEY_KM_SEEDED, 'true');
      const raw = localStorage.getItem(LOCAL_KEY_KM_RECORDS);
      let list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((item) => item.id === finalId);
      if (idx >= 0) {
        list[idx] = payload;
      } else {
        list.unshift(payload);
      }
      localStorage.setItem(LOCAL_KEY_KM_RECORDS, JSON.stringify(list));
    } catch (e) {}
  }

    if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'km_records', finalId);
      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      console.warn('Firestore setDoc km_records warning:', e);
    }
  }

  logActivity({
    action: recordData.id ? 'UPDATE_KM_RECORD' : 'CREATE_KM_RECORD',
    category: ACTIVITY_CATEGORIES.KM_HUB,
    status: 'SUCCESS',
    title: `${recordData.id ? 'แก้ไข' : 'บันทึก'}องค์ความรู้/การอบรม: ${payload.courseTitle}`,
    details: `${actor?.name || 'ผู้ดูแลระบบ'} บันทึกหลักสูตร "${payload.courseTitle}" จัดโดย ${payload.organizer || '-'} (ปีงบฯ ${payload.fiscalYear}) [สถานะ: ${payload.status}]`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name, email: actor.email, role: actor.role } : null,
    target: { id: payload.id, name: payload.courseTitle, type: 'KM_RECORD' },
    metadata: { fiscalYear: payload.fiscalYear, status: payload.status, budget: payload.budget, attendeesCount: payload.attendees?.length || 0 },
  });

  return payload;
}

/**
 * Delete a KM Record
 */
export async function deleteKmRecord(recordId, actor = null) {
  let deletedItem = null;
  // 1. Immediately update in-memory cache and notify subscribers
  if (cachedKmRecords) {
    deletedItem = cachedKmRecords.find((item) => item.id === recordId);
    const updated = cachedKmRecords.filter((item) => item.id !== recordId);
    notifyKmSubscribers(updated);
  }

  // 2. Update local storage cache
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_KEY_KM_SEEDED, 'true');
      const raw = localStorage.getItem(LOCAL_KEY_KM_RECORDS);
      if (raw) {
        const list = JSON.parse(raw);
        if (!deletedItem) deletedItem = list.find((item) => item.id === recordId);
        const filtered = list.filter((item) => item.id !== recordId);
        localStorage.setItem(LOCAL_KEY_KM_RECORDS, JSON.stringify(filtered));
      }
    } catch (e) {}
  }

  // 3. Delete from Firestore
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'km_records', recordId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore deleteDoc km_records warning:', e);
    }
  }

  logActivity({
    action: 'DELETE_KM_RECORD',
    category: ACTIVITY_CATEGORIES.KM_HUB,
    status: 'SUCCESS',
    title: `ลบหลักสูตรองค์ความรู้: ${deletedItem?.courseTitle || recordId}`,
    details: `ลบข้อมูลหลักสูตร "${deletedItem?.courseTitle || recordId}" ออกจากฐานข้อมูล KM Hub`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name, email: actor.email, role: actor.role } : null,
    target: { id: recordId, name: deletedItem?.courseTitle || recordId, type: 'KM_RECORD' },
  });

  return true;
}

export const LOCAL_KEY_KM_DOCS = 'icit_km_doc_configs';

/**
 * Subscribe to KM Document / Report Attachment Configuration for a Fiscal Year
 */
export function subscribeKmDocConfig(fiscalYear, callback) {
  if (typeof window === 'undefined') {
    callback(null);
    return () => {};
  }

  const fy = String(fiscalYear || 'ALL');
  const docId = fy === 'ALL' ? 'km-doc-general' : `km-doc-${fy}`;
  const localKey = `${LOCAL_KEY_KM_DOCS}_${fy}`;

  // Default empty config
  const defaultResult = {
    id: docId,
    fiscalYear: fy,
    documentTitle:
      fy === 'ALL'
        ? 'แนวทางและคู่มือการจัดการองค์ความรู้ KM'
        : `แนวทางและคู่มือการจัดการองค์ความรู้ KM ประจำปีงบประมาณ ${fy}`,
    documentUrl: '',
    additionalLinks: [],
  };

  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      callback(JSON.parse(raw));
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
    const docRef = doc(db, 'km_doc_configs', docId);
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
        console.warn(`Firestore km_doc_configs (${fy}) warning:`, err);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error('Failed to setup km_doc_configs listener:', e);
    return () => {};
  }
}

/**
 * Save KM Document / Report Attachment Configuration
 */
export async function saveKmDocConfig(fiscalYear, configData, actor) {
  const fy = String(fiscalYear || 'ALL');
  const docId = fy === 'ALL' ? 'km-doc-general' : `km-doc-${fy}`;
  const now = new Date().toISOString();

  const payload = {
    id: docId,
    fiscalYear: fy,
    documentTitle:
      configData.documentTitle ||
      (fy === 'ALL'
        ? 'แนวทางและคู่มือการจัดการองค์ความรู้ KM'
        : `แนวทางและคู่มือการจัดการองค์ความรู้ KM ประจำปีงบประมาณ ${fy}`),
    documentUrl: String(configData.documentUrl || '').trim(),
    additionalLinks: Array.isArray(configData.additionalLinks)
      ? configData.additionalLinks.filter((l) => l && (l.url || '').trim())
      : [],
    updatedAt: now,
    updatedBy: actor?.name || actor?.email || 'ผู้ดูแลระบบ',
  };

  const localKey = `${LOCAL_KEY_KM_DOCS}_${fy}`;
  try {
    localStorage.setItem(localKey, JSON.stringify(payload));
  } catch (e) {}

  logActivity({
    action: 'UPDATE_KM_DOC_CONFIG',
    category: ACTIVITY_CATEGORIES.KM_HUB,
    status: 'SUCCESS',
    title: `อัปเดตเอกสารแนบ KM Hub: ${payload.documentTitle}`,
    details: `${actor?.name || 'ผู้ดูแลระบบ'} บันทึกการกำหนดลิงก์เอกสารคู่มือและลิงก์แนบเพิ่มเติม (${fy === 'ALL' ? 'ภาพรวมทั่วไป' : `ปีงบประมาณ ${fy}`})`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name, email: actor.email, role: actor.role } : null,
    metadata: { fiscalYear: fy, linksCount: payload.additionalLinks?.length || 0 },
  });

  if (!isFirebaseConfigured || !db) {
    return { success: true, data: payload };
  }

  try {
    const docRef = doc(db, 'km_doc_configs', docId);
    await setDoc(docRef, payload, { merge: true });
    return { success: true, data: payload };
  } catch (e) {
    console.warn('Firestore save km_doc_configs warning (persisted locally):', e);
    // If permission-denied, still return success from local cache and log guidance
    return { success: true, data: payload, warning: e.message };
  }
}
