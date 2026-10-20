// Real-Time Knowledge Sharing & Group Lecture Sessions Service (KM Hub - Submodule 2)
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

export const LOCAL_KEY_KM_SHARING = 'icit_km_sharing_records';
export const LOCAL_KEY_KM_SHARING_SEEDED = 'icit_km_sharing_seeded';
export const LOCAL_KEY_KM_SHARING_TAGS = 'icit_km_sharing_tags';
export const LOCAL_KEY_KM_SHARING_RECIPIENTS = 'icit_km_sharing_recipients';
export const LOCAL_KEY_KM_SHARING_TAG_MANAGERS = 'icit_km_sharing_tag_managers';

// Default Knowledge Tags (as specified from UI)
export const DEFAULT_SHARING_TAGS = [
  'AI',
  'Microsoft 365',
  'Google',
  'เครือข่าย',
  'ความปลอดภัยทางไซเบอร์',
  'การเงิน/บัญชี',
  'พัสดุ',
  'งานสารบรรณ/จัดทำเอกสาร',
  'งานบริหาร',
  'งานแผน',
  'งานบุคคล',
  'งานบริการ',
  'Green Office',
  'อื่นๆ',
];

// Default Tag Managers (Personnel who can manage/assign tags)
export const DEFAULT_TAG_MANAGERS = [
  {
    email: 'jarucha.j@icit.kmutnb.ac.th',
    name: 'นางสาวจารุชา จันทจร',
    department: 'สำนักงานผู้อำนวยการ',
    position: 'เจ้าหน้าที่บริหารงานทั่วไป',
    note: 'ผู้รับผิดชอบงานจัดการความรู้ (KM)',
  },
  {
    email: 'prasertsak.t@cit.kmutnb.ac.th',
    name: 'นายประเสริฐศักดิ์ ถาวร',
    department: 'ฝ่ายพัฒนาระบบสารสนเทศ',
    position: 'นักวิชาการคอมพิวเตอร์',
    note: 'ผู้ดูแลระบบสารสนเทศ',
  },
];

export const SHARING_STATUSES = {
  SCHEDULED: {
    key: 'SCHEDULED',
    label: 'จองวันแล้ว / กำลังจะมาถึง',
    badgeText: 'กำลังจะมาถึง',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  COMPLETED: {
    key: 'COMPLETED',
    label: 'บรรยายเสร็จสิ้น',
    badgeText: 'เสร็จสิ้นแล้ว',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  CANCELLED: {
    key: 'CANCELLED',
    label: 'ยกเลิกการบรรยาย',
    badgeText: 'ยกเลิกแล้ว',
    color: '#64748B',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
};

// Realistic Seed Records
export const SAMPLE_KM_SHARING_RECORDS = [
  {
    id: 'kms-sample-01',
    topic: 'การประยุกต์ใช้ Prompt Engineering และ Generative AI เพื่อเพิ่มประสิทธิภาพงานบริการสารสนเทศ',
    format: 'บรรยายกลุ่มย่อย',
    date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), // 3 days from now
    startTime: '10:00',
    endTime: '12:00',
    locationType: 'ONLINE',
    meetUrl: 'https://meet.google.com/lookup/icit-km-sample-01',
    location: 'Google Meet (ออนไลน์)',
    roomNumber: '',
    overview: 'แลกเปลี่ยนเทคนิคการเขียน prompt อย่างเป็นระบบ (Role-Task-Context-Constraint) สำหรับ Gemini และ ChatGPT ในการร่างหนังสือราชการ สรุปรายงาน และช่วยเขียนโค้ดเบื้องต้น',
    materialUrl: 'https://docs.google.com/presentation/d/1sample-ai-prompting',
    tags: ['AI', 'Google', 'งานบริการ'],
    speakers: [
      {
        id: 'pers-km-01',
        name: 'นายกนก บุญพันธ์จันที',
        email: 'kanok.b@icit.kmutnb.ac.th',
        department: 'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
        position: 'นักวิชาการคอมพิวเตอร์',
      },
      {
        id: 'pers-km-02',
        name: 'นางสาวชาลินทร์ เกรียงสินยศ',
        email: 'chalin.k@icit.kmutnb.ac.th',
        department: 'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
        position: 'นักวิชาการคอมพิวเตอร์',
      },
    ],
    status: 'SCHEDULED',
    creator: {
      name: 'นายกนก บุญพันธ์จันที',
      email: 'kanok.b@icit.kmutnb.ac.th',
      department: 'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kms-sample-02',
    topic: 'เทคนิคการรักษาความมั่นคงปลอดภัยสารสนเทศส่วนบุคคลและการรับมือภัยคุกคามทางไซเบอร์',
    format: 'บรรยายกลุ่มย่อย',
    date: new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10), // 7 days ago
    startTime: '13:30',
    endTime: '15:30',
    locationType: 'ONSITE',
    roomNumber: 'ห้องสัมมนา ชั้น 3 สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
    location: 'ห้องสัมมนา ชั้น 3 สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
    meetUrl: '',
    overview: 'สรุปประเด็นสำคัญจากกรณีศึกษา Phishing Mail ล่าสุด วิธีสังเกตลิงก์หลอกลวง และการเปิดใช้งาน 2-Factor Authentication สำหรับอีเมล @cit.kmutnb.ac.th',
    materialUrl: 'https://drive.google.com/file/d/sample-cyber-security-guide/view',
    tags: ['ความปลอดภัยทางไซเบอร์', 'เครือข่าย', 'Microsoft 365'],
    speakers: [
      {
        id: 'pers-km-03',
        name: 'นายสิทธิโชค ศิริพันธุ์',
        email: 'sittichok.s@icit.kmutnb.ac.th',
        department: 'ฝ่ายวิศวกรรมระบบเครือข่าย',
        position: 'วิศวกร',
      },
    ],
    status: 'COMPLETED',
    creator: {
      name: 'นายสิทธิโชค ศิริพันธุ์',
      email: 'sittichok.s@icit.kmutnb.ac.th',
      department: 'ฝ่ายวิศวกรรมระบบเครือข่าย',
    },
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'kms-sample-03',
    topic: 'แนวทางการจัดทำเอกสารและงานสารบรรณดิจิทัลอย่างถูกต้องตามระเบียบสารบรรณ',
    format: 'บรรยายกลุ่มย่อย',
    date: new Date(Date.now() - 86400000 * 14).toISOString().slice(0, 10),
    startTime: '09:30',
    endTime: '11:30',
    locationType: 'ONSITE',
    roomNumber: 'ห้องประชุมสำนักงานผู้อำนวยการ ชั้น 2',
    location: 'ห้องประชุมสำนักงานผู้อำนวยการ ชั้น 2',
    meetUrl: '',
    overview: 'แนะนำรูปแบบหนังสือราชการภายนอก/ภายใน การเว้นวรรค การใช้ตราครุฑ และระบบสารบรรณอิเล็กทรอนิกส์ e-Saraban',
    materialUrl: 'https://icit.kmutnb.ac.th/km/e-saraban-guide.pdf',
    tags: ['งานสารบรรณ/จัดทำเอกสาร', 'งานบริหาร'],
    speakers: [
      {
        id: 'pers-km-04',
        name: 'นางสาวจารุชา จันทจร',
        email: 'jarucha.j@icit.kmutnb.ac.th',
        department: 'สำนักงานผู้อำนวยการ',
        position: 'เจ้าหน้าที่บริหารงานทั่วไป',
      },
    ],
    status: 'COMPLETED',
    creator: {
      name: 'นางสาวจารุชา จันทจร',
      email: 'jarucha.j@icit.kmutnb.ac.th',
      department: 'สำนักงานผู้อำนวยการ',
    },
    createdAt: new Date(Date.now() - 86400000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
];

// In-Memory Caches
let cachedSharingRecords = null;
let sharingListeners = [];

function notifySharingSubscribers(data) {
  cachedSharingRecords = data;
  sharingListeners.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Sharing subscriber callback error:', e);
    }
  });
}

/**
 * Check if the user is authorized to manage/assign tags
 */
export function canUserManageKmTags(currentUser, currentPersonnel, isAdmin, tagManagers = []) {
  if (isAdmin) return true;
  const email = (currentUser?.email || currentPersonnel?.email || '').toLowerCase().trim();
  if (!email) return false;
  return (tagManagers || []).some(
    (m) => (m.email || '').toLowerCase().trim() === email
  );
}

/**
 * Generate Google Calendar Web URL for 1-Click Calendar Add
 */
export function getGoogleCalendarUrl(record) {
  if (!record || !record.date) return '';
  try {
    const startParts = (record.startTime || '09:00').split(':').map(Number);
    const endParts = (record.endTime || '11:00').split(':').map(Number);
    const [year, month, day] = record.date.split('-').map(Number);

    // Thailand is UTC+7. Convert local time to UTC for Google Calendar URL
    const startDate = new Date(Date.UTC(year, month - 1, day, startParts[0] - 7, startParts[1]));
    const endDate = new Date(Date.UTC(year, month - 1, day, endParts[0] - 7, endParts[1]));

    const formatIso = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const datesParam = `${formatIso(startDate)}/${formatIso(endDate)}`;

    const speakersText = (record.speakers || [])
      .map((s) => `${s.name} (${s.department || ''})`)
      .join(', ');

    const isOnline = record.locationType === 'ONLINE' || Boolean(record.meetUrl);
    let resolvedLocation = '';
    if (isOnline) {
      resolvedLocation = resolvedMeetUrl || 'Google Meet (ออนไลน์)';
    } else {
      const room = (record.roomNumber || record.location || '').trim();
      if (room) {
        resolvedLocation = room.includes('สำนักคอมพิวเตอร์') ? room : `${room} อาคารสำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.`;
      } else {
        resolvedLocation = 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.';
      }
    }

    const details = [
      `หัวข้อบรรยาย: ${record.topic}`,
      `ผู้บรรยาย: ${speakersText || '-'}`,
      isOnline ? `📹 ลิงก์เข้าร่วม Google Meet: ${resolvedMeetUrl}` : `📍 สถานที่/ห้องบรรยาย: ${record.roomNumber ? `${record.roomNumber} อาคารสำนักคอมพิวเตอร์ฯ` : (record.location || 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.')}`,
      `รายละเอียดเนื้อหา: ${record.overview || '-'}`,
      record.materialUrl ? `เอกสารประกอบการบรรยาย: ${record.materialUrl}` : '',
      `แท็กเนื้อหา: ${(record.tags || []).join(', ') || '-'}`,
      `ระบบแบ่งปันความรู้ ICIT Workspace (KM Hub)`
    ].filter(Boolean).join('\n\n');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `[KM Sharing] ${record.topic}`,
      dates: datesParam,
      details: details,
      location: resolvedLocation,
    });

    const speakerEmails = (record.speakers || []).map((s) => s.email).filter(Boolean);
    if (speakerEmails.length > 0) {
      params.set('add', speakerEmails.join(','));
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch (err) {
    console.error('Error generating Google Calendar URL:', err);
    return '';
  }
}

/**
 * Subscribe to Knowledge Sharing records
 */
export function subscribeKmSharingRecords(callback) {
  if (typeof window === 'undefined') {
    callback([]);
    return () => {};
  }

  sharingListeners.push(callback);

  // Return cached or local storage data immediately
  if (cachedSharingRecords) {
    callback(cachedSharingRecords);
  } else {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_KM_SHARING);
      if (raw) {
        cachedSharingRecords = JSON.parse(raw);
        callback(cachedSharingRecords);
      } else {
        const isSeeded = localStorage.getItem(LOCAL_KEY_KM_SHARING_SEEDED);
        if (!isSeeded) {
          cachedSharingRecords = [...SAMPLE_KM_SHARING_RECORDS];
          localStorage.setItem(LOCAL_KEY_KM_SHARING, JSON.stringify(cachedSharingRecords));
          localStorage.setItem(LOCAL_KEY_KM_SHARING_SEEDED, 'true');
          callback(cachedSharingRecords);
        } else {
          cachedSharingRecords = [];
          callback([]);
        }
      }
    } catch (e) {
      cachedSharingRecords = [...SAMPLE_KM_SHARING_RECORDS];
      callback(cachedSharingRecords);
    }
  }

  // Setup Firestore Real-time listener
  if (!isFirebaseConfigured || !db) {
    return () => {
      sharingListeners = sharingListeners.filter((cb) => cb !== callback);
    };
  }

  try {
    const q = query(collection(db, 'km_sharing_records'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          localStorage.setItem(LOCAL_KEY_KM_SHARING, JSON.stringify(records));
          localStorage.setItem(LOCAL_KEY_KM_SHARING_SEEDED, 'true');
          notifySharingSubscribers(records);
        } else {
          // If Firestore is empty, optionally write sample records
          const isSeeded = localStorage.getItem(LOCAL_KEY_KM_SHARING_SEEDED);
          if (!isSeeded && SAMPLE_KM_SHARING_RECORDS.length > 0) {
            SAMPLE_KM_SHARING_RECORDS.forEach(async (item) => {
              try {
                await setDoc(doc(db, 'km_sharing_records', item.id), item);
              } catch (err) {}
            });
            localStorage.setItem(LOCAL_KEY_KM_SHARING_SEEDED, 'true');
          }
        }
      },
      (error) => {
        console.warn('Firestore km_sharing_records warning (falling back to cache):', error);
      }
    );

    return () => {
      sharingListeners = sharingListeners.filter((cb) => cb !== callback);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  } catch (err) {
    console.error('Failed to setup km_sharing_records listener:', err);
    return () => {
      sharingListeners = sharingListeners.filter((cb) => cb !== callback);
    };
  }
}

/**
 * Save or Update Knowledge Sharing Record
 */
export async function saveKmSharingRecord(recordData, actor) {
  const isNew = !recordData.id;
  const now = new Date().toISOString();
  const id = recordData.id || `kms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const isOnline = recordData.locationType === 'ONLINE';
  const meetUrl = isOnline
    ? (recordData.meetUrl || `https://meet.google.com/lookup/icit-km-${id}`)
    : '';
  const roomNumber = isOnline ? '' : String(recordData.roomNumber || recordData.location || '').trim();
  const location = isOnline
    ? 'Google Meet (ออนไลน์)'
    : (roomNumber ? (roomNumber.includes('สำนักคอมพิวเตอร์') ? roomNumber : `${roomNumber} อาคารสำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.`) : 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.');

  const payload = {
    ...recordData,
    id,
    topic: String(recordData.topic || '').trim(),
    format: 'บรรยายกลุ่มย่อย',
    date: recordData.date || new Date().toISOString().slice(0, 10),
    startTime: recordData.startTime || '10:00',
    endTime: recordData.endTime || '12:00',
    locationType: isOnline ? 'ONLINE' : 'ONSITE',
    roomNumber,
    meetUrl,
    location,
    overview: String(recordData.overview || '').trim(),
    materialUrl: String(recordData.materialUrl || '').trim(),
    tags: Array.isArray(recordData.tags) ? recordData.tags : [],
    speakers: Array.isArray(recordData.speakers) ? recordData.speakers.slice(0, 3) : [],
    status: recordData.status || 'SCHEDULED',
    creator: recordData.creator || {
      name: actor?.name || 'บุคลากรสำนักฯ',
      email: actor?.email || '',
      department: actor?.department || '',
    },
    updatedAt: now,
    updatedBy: actor?.name || actor?.email || 'ผู้ใช้งาน',
    createdAt: recordData.createdAt || now,
  };

  // 1. Update in-memory cache and notify
  if (cachedSharingRecords) {
    const idx = cachedSharingRecords.findIndex((r) => r.id === id);
    let updated;
    if (idx >= 0) {
      updated = [...cachedSharingRecords];
      updated[idx] = payload;
    } else {
      updated = [payload, ...cachedSharingRecords];
    }
    notifySharingSubscribers(updated);
  }

  // 2. Persist to local storage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_KEY_KM_SHARING_SEEDED, 'true');
      const raw = localStorage.getItem(LOCAL_KEY_KM_SHARING);
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((r) => r.id === id);
      if (idx >= 0) {
        list[idx] = payload;
      } else {
        list.unshift(payload);
      }
      localStorage.setItem(LOCAL_KEY_KM_SHARING, JSON.stringify(list));
    } catch (e) {}
  }

  // 3. Save to Firestore
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'km_sharing_records', id);
      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      console.warn('Firestore save km_sharing_records warning (persisted locally):', e);
    }
  }

  // Log activity
  logActivity({
    action: isNew ? 'CREATE_KM_SHARING' : 'UPDATE_KM_SHARING',
    category: ACTIVITY_CATEGORIES.KM_HUB,
    status: 'SUCCESS',
    title: `${isNew ? 'จองการบรรยายกลุ่มย่อยใหม่' : 'แก้ไขข้อมูลการบรรยาย'}: ${payload.topic}`,
    details: `${actor?.name || 'ผู้ใช้งาน'} ${isNew ? 'บันทึกการจองวันเวลาบรรยายกลุ่มย่อย' : 'อัปเดตรายละเอียดการบรรยาย'} "${payload.topic}" (${payload.locationType === 'ONLINE' ? 'ออนไลน์ผ่าน Google Meet' : `Onsite ${payload.roomNumber}`})`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name, email: actor.email, role: actor.role } : null,
    target: { id, name: payload.topic, type: 'KM_SHARING_RECORD' },
  });

  return payload;
}

/**
 * Assign or Update Tags for a Specific Knowledge Sharing Session
 */
export async function updateSessionTags(sessionId, newTags, actor) {
  const cleanTags = Array.from(new Set((newTags || []).map((t) => String(t || '').trim()).filter(Boolean)));
  const now = new Date().toISOString();

  let targetSession = null;

  // 1. Update in-memory cache and notify
  if (cachedSharingRecords) {
    const idx = cachedSharingRecords.findIndex((r) => r.id === sessionId);
    if (idx >= 0) {
      const updated = [...cachedSharingRecords];
      targetSession = { ...updated[idx], tags: cleanTags, updatedAt: now, updatedBy: actor?.name || 'Tag Manager' };
      updated[idx] = targetSession;
      notifySharingSubscribers(updated);
    }
  }

  // 2. Persist to local storage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_KM_SHARING);
      if (raw) {
        const list = JSON.parse(raw);
        const idx = list.findIndex((r) => r.id === sessionId);
        if (idx >= 0) {
          list[idx] = { ...list[idx], tags: cleanTags, updatedAt: now, updatedBy: actor?.name || 'Tag Manager' };
          if (!targetSession) targetSession = list[idx];
          localStorage.setItem(LOCAL_KEY_KM_SHARING, JSON.stringify(list));
        }
      }
    } catch (e) {}
  }

  // 3. Save to Firestore
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'km_sharing_records', sessionId);
      await setDoc(docRef, { tags: cleanTags, updatedAt: now, updatedBy: actor?.name || 'Tag Manager' }, { merge: true });
    } catch (e) {
      console.warn('Firestore updateSessionTags warning:', e);
    }
  }

  logActivity({
    action: 'UPDATE_SESSION_TAGS',
    category: ACTIVITY_CATEGORIES.KM_HUB,
    status: 'SUCCESS',
    title: `กำหนดแท็กการบรรยาย: ${targetSession?.topic || sessionId}`,
    details: `${actor?.name || 'ผู้จัดการแท็ก'} บันทึกการกำหนดแท็ก [${cleanTags.join(', ') || 'ไม่มีแท็ก'}] สำหรับหัวข้อ "${targetSession?.topic || sessionId}"`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name, email: actor.email, role: actor.role } : null,
    target: { id: sessionId, name: targetSession?.topic || sessionId, type: 'KM_SHARING_RECORD' },
  });

  return cleanTags;
}

/**
 * Delete Knowledge Sharing Record
 */
export async function deleteKmSharingRecord(recordId, actor) {
  let deletedItem = null;

  if (cachedSharingRecords) {
    deletedItem = cachedSharingRecords.find((item) => item.id === recordId);
    const updated = cachedSharingRecords.filter((item) => item.id !== recordId);
    notifySharingSubscribers(updated);
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_KM_SHARING);
      if (raw) {
        const list = JSON.parse(raw);
        if (!deletedItem) deletedItem = list.find((item) => item.id === recordId);
        const filtered = list.filter((item) => item.id !== recordId);
        localStorage.setItem(LOCAL_KEY_KM_SHARING, JSON.stringify(filtered));
      }
    } catch (e) {}
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'km_sharing_records', recordId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore delete km_sharing_records warning:', e);
    }
  }

  logActivity({
    action: 'DELETE_KM_SHARING',
    category: ACTIVITY_CATEGORIES.KM_HUB,
    status: 'SUCCESS',
    title: `ลบรายการบรรยายกลุ่มย่อย: ${deletedItem?.topic || recordId}`,
    details: `ลบรายการการบรรยาย "${deletedItem?.topic || recordId}" ออกจากระบบ`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name, email: actor.email, role: actor.role } : null,
    target: { id: recordId, name: deletedItem?.topic || recordId, type: 'KM_SHARING_RECORD' },
  });

  return true;
}

/**
 * Subscribe to Knowledge Sharing Tags
 */
export function subscribeKmSharingTags(callback) {
  if (typeof window === 'undefined') {
    callback(DEFAULT_SHARING_TAGS);
    return () => {};
  }

  const loadFromLocal = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_KM_SHARING_TAGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_SHARING_TAGS;
  };

  callback(loadFromLocal());

  if (!isFirebaseConfigured || !db) return () => {};

  try {
    const docRef = doc(db, 'km_sharing_configs', 'tags');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().tags) && snap.data().tags.length > 0) {
          const tags = snap.data().tags;
          localStorage.setItem(LOCAL_KEY_KM_SHARING_TAGS, JSON.stringify(tags));
          callback(tags);
        } else {
          callback(loadFromLocal());
        }
      },
      (err) => {
        console.warn('Firestore km_sharing_configs/tags warning:', err);
      }
    );
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}

/**
 * Save Knowledge Sharing Tags
 */
export async function saveKmSharingTags(tagsArray, actor) {
  const cleanTags = Array.from(new Set(tagsArray.map((t) => String(t || '').trim()).filter(Boolean)));

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_KEY_KM_SHARING_TAGS, JSON.stringify(cleanTags));
    } catch (e) {}
  }

  logActivity({
    action: 'UPDATE_KM_SHARING_TAGS',
    category: ACTIVITY_CATEGORIES.KM_HUB,
    status: 'SUCCESS',
    title: `อัปเดตแท็กเนื้อหาองค์ความรู้ (${cleanTags.length} แท็ก)`,
    details: `${actor?.name || 'ผู้ดูแลระบบ'} ปรับปรุงรายการแท็กองค์ความรู้สำหรับบรรยายกลุ่มย่อย`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name, email: actor.email, role: actor.role } : null,
  });

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'km_sharing_configs', 'tags');
      await setDoc(docRef, { tags: cleanTags, updatedAt: new Date().toISOString(), updatedBy: actor?.name || 'Admin' }, { merge: true });
    } catch (e) {
      console.warn('Firestore save km_sharing_configs/tags warning:', e);
    }
  }

  return cleanTags;
}

/**
 * Subscribe to Tag Managers (Authorized personnel who can manage tags on sessions)
 */
export function subscribeKmSharingTagManagers(callback) {
  if (typeof window === 'undefined') {
    callback(DEFAULT_TAG_MANAGERS);
    return () => {};
  }

  const loadFromLocal = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_KM_SHARING_TAG_MANAGERS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEFAULT_TAG_MANAGERS;
  };

  callback(loadFromLocal());

  if (!isFirebaseConfigured || !db) return () => {};

  try {
    const docRef = doc(db, 'km_sharing_configs', 'tag_managers');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().managers)) {
          const list = snap.data().managers;
          localStorage.setItem(LOCAL_KEY_KM_SHARING_TAG_MANAGERS, JSON.stringify(list));
          callback(list);
        } else {
          callback(loadFromLocal());
        }
      },
      (err) => {
        console.warn('Firestore km_sharing_configs/tag_managers warning:', err);
      }
    );
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}

/**
 * Save Tag Managers (Authorized personnel who can manage tags)
 */
export async function saveKmSharingTagManagers(managersArray, actor) {
  const cleanList = (managersArray || []).filter((m) => m && m.email);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_KEY_KM_SHARING_TAG_MANAGERS, JSON.stringify(cleanList));
    } catch (e) {}
  }

  logActivity({
    action: 'UPDATE_KM_TAG_MANAGERS',
    category: ACTIVITY_CATEGORIES.KM_HUB,
    status: 'SUCCESS',
    title: `อัปเดตผู้มีสิทธิ์จัดการแท็ก (${cleanList.length} ท่าน)`,
    details: `${actor?.name || 'ผู้ดูแลระบบ'} ปรับปรุงรายชื่อผู้มีสิทธิ์กำหนดและจัดการแท็กในแต่ละรายการบรรยาย`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name, email: actor.email, role: actor.role } : null,
  });

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'km_sharing_configs', 'tag_managers');
      await setDoc(docRef, { managers: cleanList, updatedAt: new Date().toISOString(), updatedBy: actor?.name || 'Admin' }, { merge: true });
    } catch (e) {
      console.warn('Firestore save km_sharing_configs/tag_managers warning:', e);
    }
  }

  return cleanList;
}

/**
 * Subscribe to Notification Recipients for Sharing Bookings
 */
export function subscribeKmSharingNotificationConfig(callback) {
  if (typeof window === 'undefined') {
    callback([]);
    return () => {};
  }

  const loadFromLocal = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_KM_SHARING_RECIPIENTS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { email: 'jarucha.j@icit.kmutnb.ac.th', name: 'นางสาวจารุชา จันทจร (ผู้ดูแล KM)', note: 'ผู้รับผิดชอบงานจัดการความรู้' },
    ];
  };

  callback(loadFromLocal());

  if (!isFirebaseConfigured || !db) return () => {};

  try {
    const docRef = doc(db, 'km_sharing_configs', 'notification_recipients');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().recipients)) {
          const list = snap.data().recipients;
          localStorage.setItem(LOCAL_KEY_KM_SHARING_RECIPIENTS, JSON.stringify(list));
          callback(list);
        } else {
          callback(loadFromLocal());
        }
      },
      (err) => {
        console.warn('Firestore km_sharing_configs/notification_recipients warning:', err);
      }
    );
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}

/**
 * Save Notification Recipients Configuration
 */
export async function saveKmSharingNotificationConfig(recipientsArray, actor) {
  const cleanList = (recipientsArray || []).filter((r) => r && r.email);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_KEY_KM_SHARING_RECIPIENTS, JSON.stringify(cleanList));
    } catch (e) {}
  }

  logActivity({
    action: 'UPDATE_KM_SHARING_RECIPIENTS',
    category: ACTIVITY_CATEGORIES.KM_HUB,
    status: 'SUCCESS',
    title: `อัปเดตผู้รับอีเมลแจ้งเตือนการจองบรรยาย (${cleanList.length} อีเมล)`,
    details: `${actor?.name || 'ผู้ดูแลระบบ'} บันทึกรายชื่อผู้รับอีเมลแจ้งเตือนการจองบรรยายกลุ่มย่อย`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name, email: actor.email, role: actor.role } : null,
  });

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'km_sharing_configs', 'notification_recipients');
      await setDoc(docRef, { recipients: cleanList, updatedAt: new Date().toISOString(), updatedBy: actor?.name || 'Admin' }, { merge: true });
    } catch (e) {
      console.warn('Firestore save notification_recipients warning:', e);
    }
  }

  return cleanList;
}

/**
 * Send Email Notification and Google Calendar Event when a session is booked/updated
 */
export async function sendKmSharingBookingNotification({
  record,
  recipients = [],
  allPersonnelList = [],
  actor,
  actionType = 'CREATED', // 'CREATED' | 'UPDATED'
}) {
  try {
    const targetEmails = new Set();
    (recipients || []).forEach((r) => {
      if (r.email) targetEmails.add(r.email.trim().toLowerCase());
    });

    (record.speakers || []).forEach((s) => {
      if (s.email) targetEmails.add(s.email.trim().toLowerCase());
    });

    if (record.creator?.email) {
      targetEmails.add(record.creator.email.trim().toLowerCase());
    }

    const emailList = Array.from(targetEmails).filter(Boolean);
    if (emailList.length === 0) {
      return { success: false, message: 'ไม่มีอีเมลผู้รับการแจ้งเตือน' };
    }

    const googleCalendarUrl = getGoogleCalendarUrl(record);
    const speakersText = (record.speakers || [])
      .map((s) => `<strong>${s.name}</strong> (${s.department || s.position || 'บุคลากร'})`)
      .join('<br />');

    const tagsHtml = (record.tags || []).length > 0
      ? (record.tags || [])
          .map(
            (t) =>
              `<span style="display:inline-block;background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;padding:2px 8px;border-radius:12px;font-size:12px;margin-right:4px;margin-bottom:4px;font-weight:600;">#${t}</span>`
          )
          .join(' ')
      : '<span style="color:#94A3B8;font-size:13px;">รอการกำหนดแท็กเนื้อหา</span>';

    const actionTitle = actionType === 'CREATED' ? 'แจ้งการจองวันเวลาบรรยายกลุ่มย่อยใหม่' : 'แจ้งการอัปเดตรายละเอียดการบรรยายกลุ่มย่อย';

    // Build ISO timestamps for Google Apps Script Calendar creation
    const startParts = (record.startTime || '10:00').split(':').map(Number);
    const endParts = (record.endTime || '12:00').split(':').map(Number);
    const [year, month, day] = (record.date || new Date().toISOString().slice(0, 10)).split('-').map(Number);
    const startDateTimeIso = new Date(Date.UTC(year, month - 1, day, startParts[0] - 7, startParts[1])).toISOString();
    const endDateTimeIso = new Date(Date.UTC(year, month - 1, day, endParts[0] - 7, endParts[1])).toISOString();

    const isOnline = record.locationType === 'ONLINE' || Boolean(record.meetUrl);
    const resolvedMeetUrl = record.meetUrl || (isOnline ? `https://meet.google.com/lookup/icit-km-${record.id}` : '');
    const locationDisplay = isOnline
      ? '🌐 Google Meet (ออนไลน์)'
      : `🏢 Onsite (ห้อง ${record.roomNumber || record.location || 'สำนักคอมพิวเตอร์ฯ'})`;

    // Collect all personnel emails for calendar invite
    const allPersonnelEmails = (allPersonnelList || [])
      .map((p) => p.email)
      .filter((e) => e && e.includes('@'));

    const htmlBody = `
      <div style="font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #065F46 0%, #047857 100%); padding: 24px 28px; color: #FFFFFF;">
          <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; margin-bottom: 6px;">
            ICIT Workspace • ศูนย์จัดการความรู้ (KM Hub)
          </div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 800; line-height: 1.4; color: #FFFFFF;">
            📢 ${actionTitle}
          </h2>
        </div>

        <div style="padding: 24px 28px;">
          <div style="background: #F8FAFC; border-left: 4px solid #10B981; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="font-size: 13px; color: #64748B; margin-bottom: 4px; font-weight: 600;">หัวข้อการบรรยาย / องค์ความรู้</div>
            <div style="font-size: 17px; font-weight: 800; color: #0F172A; line-height: 1.4;">
              ${record.topic}
            </div>
            <div style="margin-top: 8px; display: inline-block; background: ${isOnline ? '#E0F2FE' : '#ECFDF5'}; color: ${isOnline ? '#0369A1' : '#047857'}; padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 700;">
              ${isOnline ? '🌐 การบรรยายแบบออนไลน์ (Google Meet)' : `🏢 ในสถานที่ (ห้อง ${record.roomNumber || record.location})`}
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748B; width: 140px; vertical-align: top; font-weight: 600;">📅 วันที่บรรยาย:</td>
              <td style="padding: 8px 0; color: #0F172A; font-weight: 700;">
                ${record.date} (เวลา ${record.startTime} - ${record.endTime} น.)
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; vertical-align: top; font-weight: 600;">📍 รูปแบบ / สถานที่:</td>
              <td style="padding: 8px 0; color: #0F172A; font-weight: 600;">${locationDisplay}</td>
            </tr>
            ${isOnline && resolvedMeetUrl ? `
            <tr>
              <td style="padding: 8px 0; color: #64748B; vertical-align: top; font-weight: 600;">📹 Google Meet:</td>
              <td style="padding: 8px 0;">
                <a href="${resolvedMeetUrl}" target="_blank" style="color: #0284C7; font-weight: 700; text-decoration: underline;">
                  คลิกเพื่อเข้าห้องประชุม Google Meet
                </a>
              </td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #64748B; vertical-align: top; font-weight: 600;">🎤 ผู้บรรยาย (${record.speakers?.length || 0} ท่าน):</td>
              <td style="padding: 8px 0; color: #0F172A; line-height: 1.6;">${speakersText || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; vertical-align: top; font-weight: 600;">🏷️ หมวดหมู่แท็ก:</td>
              <td style="padding: 8px 0;">${tagsHtml}</td>
            </tr>
            ${record.materialUrl ? `
            <tr>
              <td style="padding: 8px 0; color: #64748B; vertical-align: top; font-weight: 600;">📎 เอกสารประกอบ:</td>
              <td style="padding: 8px 0;">
                <a href="${record.materialUrl}" target="_blank" style="color: #059669; font-weight: 700; text-decoration: underline;">
                  คลิกเพื่อเปิดเอกสารประกอบการบรรยาย
                </a>
              </td>
            </tr>
            ` : ''}
          </table>

          <div style="background: #F1F5F9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">
              📝 รายละเอียดเนื้อหาในภาพรวม:
            </div>
            <div style="font-size: 14px; color: #475569; line-height: 1.6; white-space: pre-line;">
              ${record.overview || '-'}
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
            ${isOnline && resolvedMeetUrl ? `
            <a href="${resolvedMeetUrl}" target="_blank" style="display: inline-block; background: #059669; color: #FFFFFF; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);">
              📹 เข้าห้อง Google Meet
            </a>
            ` : ''}

            ${googleCalendarUrl ? `
            <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; background: #0284C7; color: #FFFFFF; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);">
              📅 เพิ่มลง Google Calendar
            </a>
            ` : ''}
          </div>

          <div style="font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 16px;">
            ผู้ทำรายการ: ${actor?.name || record.creator?.name || 'บุคลากรสำนักฯ'} (${actor?.email || record.creator?.email || ''})<br />
            ข้อความแจ้งเตือนอัตโนมัติจากระบบ ICIT Workspace สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.
          </div>
        </div>
      </div>
    `;

    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: emailList,
        subject: `[KM Sharing] ${actionTitle}: ${record.topic} (วันที่ ${record.date})`,
        htmlBody,
        senderName: 'ระบบแบ่งปันความรู้ ICIT Workspace',
        createCalendarEvent: true,
        calendarEvent: {
          title: `[KM Sharing] ${record.topic}`,
          startTime: startDateTimeIso,
          endTime: endDateTimeIso,
          location: isOnline
            ? (resolvedMeetUrl || 'Google Meet')
            : (record.roomNumber
                ? (record.roomNumber.includes('สำนักคอมพิวเตอร์') ? record.roomNumber : `${record.roomNumber} อาคารสำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.`)
                : (record.location || 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.')),
          isOnline,
          meetUrl: resolvedMeetUrl,
          description: `หัวข้อ: ${record.topic}\nผู้บรรยาย: ${(record.speakers || []).map(s => s.name).join(', ')}\nสถานที่/รูปแบบ: ${isOnline ? 'ออนไลน์ (Google Meet: ' + resolvedMeetUrl + ')' : (record.roomNumber ? `ในสถานที่ (${record.roomNumber} อาคารสำนักคอมพิวเตอร์ฯ)` : (record.location || 'ในสถานที่'))}\nรายละเอียด: ${record.overview}\nเอกสารประกอบ: ${record.materialUrl || '-'}\n\nระบบ ICIT Workspace KM Hub`,
          guests: allPersonnelEmails.length > 0 ? allPersonnelEmails : emailList,
        },
      }),
    });

    const resData = await response.json();
    return { success: response.ok, data: resData };
  } catch (err) {
    console.error('Error dispatching KM Sharing notification email:', err);
    return { success: false, error: err.message };
  }
}
