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

/**
 * Subscribe to KM Records with Firestore & LocalStorage Cache
 */
export function subscribeKmRecords(callback) {
  if (typeof window === 'undefined') {
    callback([]);
    return () => {};
  }

  // Load from local storage cache initially
  try {
    const raw = localStorage.getItem(LOCAL_KEY_KM_RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        callback(parsed);
      } else {
        callback(SAMPLE_KM_RECORDS);
      }
    } else {
      localStorage.setItem(LOCAL_KEY_KM_RECORDS, JSON.stringify(SAMPLE_KM_RECORDS));
      callback(SAMPLE_KM_RECORDS);
    }
  } catch (e) {
    callback(SAMPLE_KM_RECORDS);
  }

  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  try {
    const colRef = collection(db, 'km_records');
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...docSnap.data() });
        });

        const finalList = records.length > 0 ? records : SAMPLE_KM_RECORDS;
        try {
          localStorage.setItem(LOCAL_KEY_KM_RECORDS, JSON.stringify(finalList));
        } catch (e) {}

        callback(finalList);
      },
      (err) => {
        console.warn('Firestore km_records subscription warning (using cache):', err);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error('Failed to attach km_records listener:', e);
    return () => {};
  }
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

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'km_records', finalId);
      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      console.warn('Firestore setDoc km_records warning:', e);
    }
  }

  // Update local storage cache
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_KM_RECORDS);
      let list = raw ? JSON.parse(raw) : [...SAMPLE_KM_RECORDS];
      const idx = list.findIndex((item) => item.id === finalId);
      if (idx >= 0) {
        list[idx] = payload;
      } else {
        list.unshift(payload);
      }
      localStorage.setItem(LOCAL_KEY_KM_RECORDS, JSON.stringify(list));
    } catch (e) {}
  }

  return payload;
}

/**
 * Delete a KM Record
 */
export async function deleteKmRecord(recordId) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'km_records', recordId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore deleteDoc km_records warning:', e);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_KM_RECORDS);
      if (raw) {
        const list = JSON.parse(raw).filter((item) => item.id !== recordId);
        localStorage.setItem(LOCAL_KEY_KM_RECORDS, JSON.stringify(list));
      }
    } catch (e) {}
  }

  return true;
}
