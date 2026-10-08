// Real-Time IDP Hub Service: Synchronized with Firebase Firestore & Optimized Caching
import { db, isFirebaseConfigured } from './firebase';
import {
  DEFAULT_IDP_CORE_COMPETENCIES,
  DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION,
  DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL,
  DEFAULT_IDP_STRATEGY_CONFIG_2569,
  IDP_STATUSES,
  POSITIONS,
} from './constants';
import { resolveRoleEmailsFromDirectory } from './emailNotificationService';
import { getCurrentThaiFiscalYear } from './dateUtils';
import { logActivity, ACTIVITY_CATEGORIES } from './activityLogService';
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
  orderBy,
} from 'firebase/firestore';

export const LOCAL_KEY_IDP_RECORDS = 'icit_idp_records';
export const LOCAL_KEY_IDP_CONFIG = 'icit_idp_config';
export const LOCAL_KEY_STRATEGY_CONFIG = 'icit_idp_strategy_config';

/**
 * Check if the current user is an authorized HR Officer (e.g. jarucha.j@icit.kmutnb.ac.th or Admin)
 */
export function isHrOfficer(currentUser, currentPersonnel, isAdmin = false) {
  if (isAdmin) return true;
  const email = (currentUser?.email || currentPersonnel?.email || '').trim().toLowerCase();
  if (
    email === 'jarucha.j@icit.kmutnb.ac.th' ||
    email === 'prasertsak.t@cit.kmutnb.ac.th' ||
    email === 'tiawongsombat@gmail.com'
  ) {
    return true;
  }
  const pos = (currentPersonnel?.position || '').toLowerCase();
  const dept = (currentPersonnel?.department || '').toLowerCase();
  if (pos.includes('บุคลากร') || (dept.includes('สำนักงานผู้อำนวยการ') && pos.includes('บริหารงานทั่วไป'))) {
    return true;
  }
  return false;
}

/**
 * Auto-resolve personnel hierarchy: Position, Department, Department Head, Supervising Deputy Director
 */
export function resolvePersonnelOrgHierarchy(targetPersonnel, allPersonnel = [], departmentList = [], executiveList = []) {
  if (!targetPersonnel) {
    return {
      position: '-',
      department: '-',
      departmentHead: null,
      supervisingDeputyDirector: null,
    };
  }

  const deptName = targetPersonnel.department || '';
  const dirRoles = resolveRoleEmailsFromDirectory(allPersonnel, departmentList, executiveList, {
    requesterDepartment: deptName,
    requesterEmail: targetPersonnel.email,
  });

  return {
    position: targetPersonnel.position || 'บุคลากร',
    level: targetPersonnel.level || '',
    department: deptName || 'สำนักงานผู้อำนวยการ',
    departmentHead: dirRoles.deptHead
      ? {
          id: dirRoles.deptHead.id || '',
          name: dirRoles.deptHead.name || 'หัวหน้าฝ่าย',
          email: dirRoles.deptHead.email || '',
        }
      : null,
    supervisingDeputyDirector: dirRoles.deputyDirector
      ? {
          id: dirRoles.deputyDirector.id || '',
          name: dirRoles.deputyDirector.name || 'รองผู้อำนวยการฝ่ายบริหาร',
          email: dirRoles.deputyDirector.email || '',
        }
      : null,
  };
}

/**
 * Calculate single competency row values based on official formulas:
 * (5) Expected Score = Weight (1) * Expected Level (2)
 * (6) Evaluated Score = ((Self Score (3) + Supervisor Score (4)) / 2) * Weight (1)
 * Gap = Evaluated Score (6) - Expected Score (5)
 */
export function calculateCompetencyRow(row) {
  const weight = Number(row.weight) || 0;
  const expectedLevel = Number(row.expectedLevel) || 0;
  const selfScore = row.selfScore !== '' && row.selfScore !== null && row.selfScore !== undefined ? Number(row.selfScore) : null;
  const supervisorScore = row.supervisorScore !== '' && row.supervisorScore !== null && row.supervisorScore !== undefined ? Number(row.supervisorScore) : null;

  // (5) Expected Score
  const expectedTotal = weight * expectedLevel;

  // (6) Evaluated Score
  let evaluatedTotal = 0;
  if (selfScore !== null && supervisorScore !== null) {
    evaluatedTotal = ((selfScore + supervisorScore) / 2) * weight;
  } else if (selfScore !== null) {
    evaluatedTotal = selfScore * weight;
  } else if (supervisorScore !== null) {
    evaluatedTotal = supervisorScore * weight;
  }

  // Gap = (6) - (5)
  const gap = evaluatedTotal - expectedTotal;

  return {
    ...row,
    weight,
    expectedLevel,
    selfScore,
    supervisorScore,
    expectedTotal: Number(expectedTotal.toFixed(2)),
    evaluatedTotal: Number(evaluatedTotal.toFixed(2)),
    gap: Number(gap.toFixed(2)),
  };
}

/**
 * Calculate complete IDP summary scores
 */
export function calculateIdpSummary(coreCompetencies = [], functionalCompetencies = []) {
  const calcCore = (coreCompetencies || []).map(calculateCompetencyRow);
  const calcFunc = (functionalCompetencies || []).map(calculateCompetencyRow);

  const coreWeightTotal = calcCore.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
  const coreExpectedTotal = calcCore.reduce((sum, r) => sum + (Number(r.expectedTotal) || 0), 0);
  const coreEvaluatedTotal = calcCore.reduce((sum, r) => sum + (Number(r.evaluatedTotal) || 0), 0);
  const coreGapTotal = calcCore.reduce((sum, r) => sum + (Number(r.gap) || 0), 0);

  const functionalWeightTotal = calcFunc.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
  const functionalExpectedTotal = calcFunc.reduce((sum, r) => sum + (Number(r.expectedTotal) || 0), 0);
  const functionalEvaluatedTotal = calcFunc.reduce((sum, r) => sum + (Number(r.evaluatedTotal) || 0), 0);
  const functionalGapTotal = calcFunc.reduce((sum, r) => sum + (Number(r.gap) || 0), 0);

  return {
    coreCompetencies: calcCore,
    functionalCompetencies: calcFunc,
    summary: {
      coreWeightTotal: Number(coreWeightTotal.toFixed(2)),
      coreExpectedTotal: Number(coreExpectedTotal.toFixed(2)),
      coreEvaluatedTotal: Number(coreEvaluatedTotal.toFixed(2)),
      coreGapTotal: Number(coreGapTotal.toFixed(2)),

      functionalWeightTotal: Number(functionalWeightTotal.toFixed(2)),
      functionalExpectedTotal: Number(functionalExpectedTotal.toFixed(2)),
      functionalEvaluatedTotal: Number(functionalEvaluatedTotal.toFixed(2)),
      functionalGapTotal: Number(functionalGapTotal.toFixed(2)),

      totalExpected: Number((coreExpectedTotal + functionalExpectedTotal).toFixed(2)),
      totalEvaluated: Number((coreEvaluatedTotal + functionalEvaluatedTotal).toFixed(2)),
      totalGap: Number((coreGapTotal + functionalGapTotal).toFixed(2)),
    },
  };
}

// Shared singleton listeners & cache maps per fiscal year
let idpSubscribersMap = {};
let sharedIdpUnsubMap = {};
let cachedIdpMap = {};

let idpConfigSubscribersMap = {};
let sharedIdpConfigUnsubMap = {};
let cachedIdpConfigMap = {};

function notifyIdpSubscribers(fy, list) {
  const cloned = Array.isArray(list) ? [...list] : [];
  cachedIdpMap[fy] = cloned;
  if (idpSubscribersMap[fy]) {
    idpSubscribersMap[fy].forEach((cb) => {
      try {
        cb(cloned);
      } catch (e) {
        console.error('IDP subscriber error:', e);
      }
    });
  }
}

function notifyIdpConfigSubscribers(fy, data) {
  cachedIdpConfigMap[fy] = data;
  if (idpConfigSubscribersMap[fy]) {
    idpConfigSubscribersMap[fy].forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('IDP config subscriber error:', e);
      }
    });
  }
}

/**
 * Real-Time Subscription to IDP Records (Optimized by Fiscal Year)
 * OPTIMIZED: Single shared Firestore listener per fiscal year
 */
export function subscribeIdpRecords(fiscalYear = String(getCurrentThaiFiscalYear()), callback) {
  if (typeof window === 'undefined') return () => {};

  const fy = String(fiscalYear);
  if (!idpSubscribersMap[fy]) {
    idpSubscribersMap[fy] = [];
  }
  idpSubscribersMap[fy].push(callback);

  const localCacheKey = `${LOCAL_KEY_IDP_RECORDS}_${fy}`;

  // 1. Instant cache response (0ms)
  if (cachedIdpMap[fy]) {
    callback(cachedIdpMap[fy]);
  } else {
    try {
      const raw = localStorage.getItem(localCacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          cachedIdpMap[fy] = parsed;
          callback(parsed);
        }
      }
    } catch (e) {}
  }

  // 2. Start SINGLE shared listener per fiscal year if not active
  if (isFirebaseConfigured && db && !sharedIdpUnsubMap[fy]) {
    try {
      const colRef = collection(db, 'idp_records');
      const q = query(colRef, where('fiscalYear', '==', fy));

      sharedIdpUnsubMap[fy] = onSnapshot(
        q,
        (snapshot) => {
          const records = [];
          snapshot.forEach((docSnap) => {
            records.push({ id: docSnap.id, ...docSnap.data() });
          });

          try {
            localStorage.setItem(localCacheKey, JSON.stringify(records));
          } catch (e) {}

          notifyIdpSubscribers(fy, records);
        },
        (err) => {
          console.warn(`Firestore idp_records (${fy}) subscription warning:`, err);
        }
      );
    } catch (e) {
      console.error('Failed to setup idp_records snapshot listener:', e);
    }
  }

  return () => {
    if (idpSubscribersMap[fy]) {
      idpSubscribersMap[fy] = idpSubscribersMap[fy].filter((cb) => cb !== callback);
      if (idpSubscribersMap[fy].length === 0 && sharedIdpUnsubMap[fy]) {
        sharedIdpUnsubMap[fy]();
        delete sharedIdpUnsubMap[fy];
      }
    }
  };
}

/**
 * Real-Time Subscription to IDP Master Config per Fiscal Year
 * OPTIMIZED: Single shared Firestore listener per fiscal year
 */
export function subscribeIdpConfig(fiscalYear = String(getCurrentThaiFiscalYear()), callback) {
  if (typeof window === 'undefined') return () => {};

  const fy = String(fiscalYear);
  if (!idpConfigSubscribersMap[fy]) {
    idpConfigSubscribersMap[fy] = [];
  }
  idpConfigSubscribersMap[fy].push(callback);

  const configDocId = `idp-config-${fy}`;
  const localConfigKey = `${LOCAL_KEY_IDP_CONFIG}_${fy}`;

  const isDefaultYear2569 = fy === '2569';
  const defaultResult = isDefaultYear2569
    ? {
        id: configDocId,
        fiscalYear: fy,
        coreCompetencies: DEFAULT_IDP_CORE_COMPETENCIES,
        functionalCompetenciesByPosition: DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION,
        functionalCompetenciesGeneral: DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL,
      }
    : {
        id: configDocId,
        fiscalYear: fy,
        coreCompetencies: [],
        functionalCompetenciesByPosition: {},
        functionalCompetenciesGeneral: [],
      };

  // 1. Instant cache response (0ms)
  if (cachedIdpConfigMap[fy]) {
    callback(cachedIdpConfigMap[fy]);
  } else {
    try {
      const raw = localStorage.getItem(localConfigKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          cachedIdpConfigMap[fy] = parsed;
          callback(parsed);
        }
      } else {
        callback(defaultResult);
      }
    } catch (e) {
      callback(defaultResult);
    }
  }

  // 2. Start SINGLE shared listener per fiscal year if not active
  if (isFirebaseConfigured && db && !sharedIdpConfigUnsubMap[fy]) {
    try {
      const docRef = doc(db, 'idp_config', configDocId);
      sharedIdpConfigUnsubMap[fy] = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            try {
              localStorage.setItem(localConfigKey, JSON.stringify(data));
            } catch (e) {}
            notifyIdpConfigSubscribers(fy, data);
          } else {
            notifyIdpConfigSubscribers(fy, defaultResult);
          }
        },
        (err) => {
          console.warn(`Firestore idp_config (${fy}) subscription warning:`, err);
        }
      );
    } catch (e) {
      console.error('Failed to setup idp_config subscription:', e);
    }
  }

  return () => {
    if (idpConfigSubscribersMap[fy]) {
      idpConfigSubscribersMap[fy] = idpConfigSubscribersMap[fy].filter((cb) => cb !== callback);
      if (idpConfigSubscribersMap[fy].length === 0 && sharedIdpConfigUnsubMap[fy]) {
        sharedIdpConfigUnsubMap[fy]();
        delete sharedIdpConfigUnsubMap[fy];
      }
    }
  };
}

/**
 * Save / Update an IDP record
 */
export async function saveIdpRecord(recordData, actor) {
  const calculated = calculateIdpSummary(recordData.coreCompetencies, recordData.functionalCompetencies);
  const finalId = recordData.id || `idp-${recordData.fiscalYear || '2569'}-${recordData.personnelId || Date.now()}`;
  const now = new Date().toISOString();

  // Determine status automatically
  let status = recordData.status || IDP_STATUSES.DRAFT.key;
  const hasSelfSign = Boolean(recordData.signatures?.evaluatorSelf?.signed);
  const hasHeadSign = Boolean(recordData.signatures?.evaluatorSupervisor?.signed);
  const hasDeputySign = Boolean(recordData.signatures?.evaluatorDeputyDirector?.signed);

  const hasSelfScores = calculated.coreCompetencies.some((c) => c.selfScore !== null);
  const hasSupervisorScores = calculated.coreCompetencies.some((c) => c.supervisorScore !== null);

  if (hasSelfSign && (hasHeadSign || hasDeputySign)) {
    status = IDP_STATUSES.COMPLETED.key;
  } else if (hasSupervisorScores || hasHeadSign || hasDeputySign) {
    status = IDP_STATUSES.SUPERVISOR_EVALUATED.key;
  } else if (hasSelfScores || hasSelfSign) {
    status = IDP_STATUSES.SELF_EVALUATED.key;
  }

  const payload = {
    ...recordData,
    id: finalId,
    status,
    coreCompetencies: calculated.coreCompetencies,
    functionalCompetencies: calculated.functionalCompetencies,
    summary: calculated.summary,
    updatedAt: now,
    updatedBy: actor?.name || actor?.email || 'ผู้ใช้งาน',
    createdAt: recordData.createdAt || now,
    createdBy: recordData.createdBy || actor?.name || 'เจ้าหน้าที่งานบุคคล',
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'idp_records', finalId);
      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      console.warn('Firestore setDoc idp_records warning (saving locally):', e);
    }
  }

  // Update local cache
  if (typeof window !== 'undefined') {
    const cacheKey = `${LOCAL_KEY_IDP_RECORDS}_${payload.fiscalYear}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      let list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((item) => item.id === finalId);
      if (idx >= 0) {
        list[idx] = payload;
      } else {
        list.unshift(payload);
      }
      localStorage.setItem(cacheKey, JSON.stringify(list));
    } catch (e) {
      console.warn('localStorage setItem error:', e);
    }
  }

  // Audit logging
  logActivity({
    action: recordData.id ? 'UPDATE_IDP_RECORD' : 'CREATE_IDP_RECORD',
    category: ACTIVITY_CATEGORIES.IDP,
    status: 'SUCCESS',
    title: `บันทึกแบบประเมิน IDP: ${payload.personnelName} (ปีงบฯ ${payload.fiscalYear})`,
    details: `${actor?.name || 'ผู้ใช้งาน'} บันทึกผลการประเมินสมรรถนะ IDP ของ ${payload.personnelName} ฝ่าย${payload.department || '-'} [สถานะ: ${status}]`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name || actor.displayName, email: actor.email, role: actor.role } : null,
    target: { id: payload.id, name: `${payload.personnelName} (IDP ${payload.fiscalYear})`, type: 'IDP_RECORD' },
    metadata: { fiscalYear: payload.fiscalYear, status, personnelEmail: payload.personnelEmail },
  });

  return payload;
}

/**
 * Delete an IDP Record
 */
export async function deleteIdpRecord(idpId, fiscalYear = String(getCurrentThaiFiscalYear()), actor = null) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'idp_records', idpId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore deleteDoc idp_records warning:', e);
    }
  }

  let deletedItem = null;
  if (typeof window !== 'undefined') {
    const cacheKey = `${LOCAL_KEY_IDP_RECORDS}_${fiscalYear}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const list = JSON.parse(raw);
        deletedItem = list.find((item) => item.id === idpId);
        const filtered = list.filter((item) => item.id !== idpId);
        localStorage.setItem(cacheKey, JSON.stringify(filtered));
      }
    } catch (e) {}
  }

  logActivity({
    action: 'DELETE_IDP_RECORD',
    category: ACTIVITY_CATEGORIES.IDP,
    status: 'SUCCESS',
    title: `ลบแบบประเมิน IDP: ${deletedItem?.personnelName || idpId}`,
    details: `ลบแบบประเมิน IDP ปีงบประมาณ ${fiscalYear} ของ ${deletedItem?.personnelName || idpId} ออกจากระบบ`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name || actor.displayName, email: actor.email, role: actor.role } : null,
    target: { id: idpId, name: `${deletedItem?.personnelName || idpId} (IDP ${fiscalYear})`, type: 'IDP_RECORD' },
  });

  return true;
}

/**
 * Save Master Competency Configuration for a Fiscal Year
 */
export async function saveIdpConfig(fiscalYear, configData, actor) {
  const configDocId = `idp-config-${fiscalYear}`;
  const now = new Date().toISOString();

  const payload = {
    id: configDocId,
    fiscalYear: String(fiscalYear),
    coreCompetencies: configData.coreCompetencies || DEFAULT_IDP_CORE_COMPETENCIES,
    functionalCompetenciesByPosition:
      configData.functionalCompetenciesByPosition || DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION,
    functionalCompetenciesGeneral:
      configData.functionalCompetenciesGeneral || DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL,
    updatedAt: now,
    updatedBy: actor?.name || actor?.email || 'เจ้าหน้าที่งานบุคคล',
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'idp_config', configDocId);
      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      console.warn('Firestore setDoc idp_config warning:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const cacheKey = `${LOCAL_KEY_IDP_CONFIG}_${fiscalYear}`;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch (e) {}
  }

  logActivity({
    action: 'UPDATE_IDP_CONFIG',
    category: ACTIVITY_CATEGORIES.IDP,
    status: 'SUCCESS',
    title: `ปรับปรุงเกณฑ์สมรรถนะ IDP ประจำปีงบประมาณ ${fiscalYear}`,
    details: `${actor?.name || 'เจ้าหน้าที่งานบุคคล'} บันทึกการกำหนดเกณฑ์ Core และ Functional Competencies ปี ${fiscalYear}`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name || actor.displayName, email: actor.email, role: actor.role } : null,
    metadata: { fiscalYear },
  });

  return payload;
}

/**
 * Duplicate Master Competency Configuration from previous fiscal year
 */
export async function duplicateIdpConfig(fromYear, toYear, actor) {
  const fromDocId = `idp-config-${fromYear}`;
  let sourceConfig = null;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'idp_config', fromDocId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        sourceConfig = snap.data();
      }
    } catch (e) {}
  }

  if (!sourceConfig && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${LOCAL_KEY_IDP_CONFIG}_${fromYear}`);
      if (raw) sourceConfig = JSON.parse(raw);
    } catch (e) {}
  }

  if (!sourceConfig && String(fromYear) === '2569') {
    sourceConfig = {
      coreCompetencies: DEFAULT_IDP_CORE_COMPETENCIES,
      functionalCompetenciesByPosition: DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION,
      functionalCompetenciesGeneral: DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL,
    };
  }

  if (!sourceConfig) {
    sourceConfig = {
      coreCompetencies: [],
      functionalCompetenciesByPosition: {},
      functionalCompetenciesGeneral: [],
    };
  }

  return await saveIdpConfig(toYear, sourceConfig, actor);
}

/**
 * Batch duplicate IDP records from previous fiscal year to new fiscal year
 */
export async function duplicateIdpRecordsFromPreviousYear(
  fromYear,
  toYear,
  actor,
  allPersonnel = [],
  departmentList = [],
  executiveList = [],
  configForToYear = null
) {
  let sourceRecords = [];

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'idp_records');
      const q = query(colRef, where('fiscalYear', '==', String(fromYear)));
      const snap = await getDocs(q);
      snap.forEach((d) => sourceRecords.push({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Fetch previous IDP records error:', e);
    }
  }

  // If no source records, generate initial IDP forms for all eligible active personnel (excluding executives and advisors)
  if (sourceRecords.length === 0 && allPersonnel.length > 0) {
    sourceRecords = allPersonnel
      .filter((p) => {
        if (!p || p.status === 'ลาออก' || p.isExecutive || p.isAdvisor) return false;
        const pos = (p.position || p.adminPosition || '').trim();
        const dept = (p.department || '').trim();
        if (
          pos.includes('ผู้บริหาร') ||
          pos.includes('ผู้อำนวยการ') ||
          pos.includes('รองผู้อำนวยการ') ||
          pos.includes('ที่ปรึกษา') ||
          dept.includes('ผู้บริหาร') ||
          dept.includes('ที่ปรึกษา')
        ) return false;
        if (executiveList.some((e) => (e.id && e.id === p.id) || (e.name && p.name && e.name.trim() === p.name.trim()))) return false;
        return true;
      })
      .map((p) => ({
        personnelId: p.id,
        personnelName: p.name,
        personnelEmail: p.email,
        position: p.position || 'บุคลากร',
        department: p.department || 'สำนักงานผู้อำนวยการ',
      }));
  }

  const createdRecords = [];
  for (const src of sourceRecords) {
    const p = allPersonnel.find((item) => item.id === src.personnelId || item.email === src.personnelEmail) || src;
    const hierarchy = resolvePersonnelOrgHierarchy(p, allPersonnel, departmentList, executiveList);

    // Get default functional competency for position from config
    const position = hierarchy.position || src.position || 'บุคลากร';
    const funcList =
      configForToYear?.functionalCompetenciesByPosition?.[position] ||
      DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION[position] ||
      configForToYear?.functionalCompetenciesGeneral ||
      DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL;

    const coreList = configForToYear?.coreCompetencies || DEFAULT_IDP_CORE_COMPETENCIES;

    const userLevel = p.level || hierarchy.level || 'ชำนาญการ';
    const newRecord = {
      fiscalYear: String(toYear),
      personnelId: p.id || src.personnelId,
      personnelName: p.name || src.personnelName,
      personnelEmail: p.email || src.personnelEmail,
      position: hierarchy.position,
      level: userLevel,
      department: hierarchy.department,
      departmentHead: hierarchy.departmentHead,
      supervisingDeputyDirector: hierarchy.supervisingDeputyDirector,
      coreCompetencies: coreList.map((c) => {
        const expLevel = c.expectedLevels?.[userLevel] ?? c.expectedLevel ?? 3;
        return {
          ...c,
          expectedLevel: expLevel,
          selfScore: null,
          supervisorScore: null,
        };
      }),
      functionalCompetencies: funcList.map((f) => ({
        ...f,
        selfScore: null,
        supervisorScore: null,
      })),
      signatures: {
        evaluatorSelf: { name: '', email: '', signedAt: '', signed: false },
        evaluatorSupervisor: { name: '', email: '', signedAt: '', signed: false },
        evaluatorDeputyDirector: { name: '', email: '', signedAt: '', signed: false },
      },
      status: IDP_STATUSES.DRAFT.key,
      createdAt: new Date().toISOString(),
      createdBy: actor?.name || 'เจ้าหน้าที่งานบุคคล',
    };

    const saved = await saveIdpRecord(newRecord, actor);
    createdRecords.push(saved);
  }

  return createdRecords;
}

/**
 * Signature confirmation helpers for 3 roles
 */
export function confirmSelfSignature(record, currentUser, currentPersonnel) {
  const name = currentPersonnel?.name || currentUser?.displayName || 'ผู้รับการประเมิน';
  const email = currentUser?.email || currentPersonnel?.email || '';
  const date = new Date().toISOString().split('T')[0];

  return {
    ...record,
    signatures: {
      ...(record.signatures || {}),
      evaluatorSelf: {
        name,
        email,
        signedAt: date,
        signed: true,
      },
    },
  };
}

export function confirmDeptHeadSignature(record, currentUser, currentPersonnel) {
  const name = currentPersonnel?.name || currentUser?.displayName || record.departmentHead?.name || 'หัวหน้าฝ่าย';
  const email = currentUser?.email || currentPersonnel?.email || '';
  const date = new Date().toISOString().split('T')[0];

  return {
    ...record,
    signatures: {
      ...(record.signatures || {}),
      evaluatorSupervisor: {
        name,
        email,
        signedAt: date,
        signed: true,
      },
    },
  };
}

export function confirmDeputyDirectorSignature(record, currentUser, currentPersonnel) {
  const name =
    currentPersonnel?.name ||
    currentUser?.displayName ||
    record.supervisingDeputyDirector?.name ||
    'รองผู้อำนวยการฝ่ายบริหาร';
  const email = currentUser?.email || currentPersonnel?.email || '';
  const date = new Date().toISOString().split('T')[0];

  return {
    ...record,
    signatures: {
      ...(record.signatures || {}),
      evaluatorDeputyDirector: {
        name,
        email,
        signedAt: date,
        signed: true,
      },
    },
  };
}

/**
 * Real-Time Subscription to IDP Strategic Configuration per Fiscal Year
 */
export function subscribeStrategyConfig(fiscalYear = String(getCurrentThaiFiscalYear()), callback) {
  if (typeof window === 'undefined') return () => {};

  const configDocId = `strategy-config-${fiscalYear}`;
  const localConfigKey = `${LOCAL_KEY_STRATEGY_CONFIG}_${fiscalYear}`;

  const isDefaultYear2569 = String(fiscalYear) === '2569';
  const defaultResult = isDefaultYear2569
    ? {
        ...DEFAULT_IDP_STRATEGY_CONFIG_2569,
        id: configDocId,
        fiscalYear: '2569',
      }
    : {
        id: configDocId,
        fiscalYear: String(fiscalYear),
        title: `แผนกลยุทธ์สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (พ.ศ. ${fiscalYear})`,
        approvalMeeting: '',
        vision: '',
        visionMeaning: { create: '', lifestyle: '' },
        corePurpose: '',
        ckpis: [],
        coreCompetencies: [],
        missions: [],
        sfas: [],
        sos: [],
        initiatives: [],
      };

  try {
    const raw = localStorage.getItem(localConfigKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) callback(parsed);
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
    const docRef = doc(db, 'idp_strategy_config', configDocId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          try {
            localStorage.setItem(localConfigKey, JSON.stringify(data));
          } catch (e) {}
          callback(data);
        } else {
          callback(defaultResult);
        }
      },
      (err) => {
        console.warn('Firestore idp_strategy_config subscription warning:', err);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error('Failed to setup idp_strategy_config subscription:', e);
    return () => {};
  }
}

/**
 * Save Master Strategic Configuration for a Fiscal Year
 */
export async function saveStrategyConfig(fiscalYear, configData, actor) {
  const configDocId = `strategy-config-${fiscalYear}`;
  const now = new Date().toISOString();

  const payload = {
    ...configData,
    id: configDocId,
    fiscalYear: String(fiscalYear),
    updatedAt: now,
    updatedBy: actor?.name || actor?.displayName || actor?.email || 'เจ้าหน้าที่งานบุคคล / ผู้ดูแลระบบ',
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'idp_strategy_config', configDocId);
      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      console.warn('Firestore setDoc idp_strategy_config warning:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const cacheKey = `${LOCAL_KEY_STRATEGY_CONFIG}_${fiscalYear}`;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch (e) {}
  }

  logActivity({
    action: 'UPDATE_STRATEGY_CONFIG',
    category: ACTIVITY_CATEGORIES.IDP,
    status: 'SUCCESS',
    title: `ปรับปรุงแผนยุทธศาสตร์และ OKRs ประจำปีงบประมาณ ${fiscalYear}`,
    details: `${actor?.name || 'ผู้ดูแลระบบ'} บันทึกการกำหนดวิสัยทัศน์ พันธกิจ และตัวชี้วัดกลยุทธ์ (CKPI) ปี ${fiscalYear}`,
    actor: actor ? { id: actor.id || actor.email, name: actor.name || actor.displayName, email: actor.email, role: actor.role } : null,
    metadata: { fiscalYear },
  });

  return payload;
}

/**
 * Duplicate Strategic Configuration from previous fiscal year
 */
export async function duplicateStrategyConfig(fromYear, toYear, actor) {
  const fromDocId = `strategy-config-${fromYear}`;
  let sourceConfig = null;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'idp_strategy_config', fromDocId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        sourceConfig = snap.data();
      }
    } catch (e) {}
  }

  if (!sourceConfig && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${LOCAL_KEY_STRATEGY_CONFIG}_${fromYear}`);
      if (raw) sourceConfig = JSON.parse(raw);
    } catch (e) {}
  }

  if (!sourceConfig && String(fromYear) === '2569') {
    sourceConfig = {
      ...DEFAULT_IDP_STRATEGY_CONFIG_2569,
      fiscalYear: '2569',
    };
  }

  if (!sourceConfig) {
    sourceConfig = {
      fiscalYear: String(fromYear),
      title: `แผนกลยุทธ์สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (พ.ศ. ${fromYear})`,
      approvalMeeting: '',
      vision: '',
      visionMeaning: { create: '', lifestyle: '' },
      corePurpose: '',
      ckpis: [],
      coreCompetencies: [],
      missions: [],
      sfas: [],
      sos: [],
      initiatives: [],
    };
  }

  return await saveStrategyConfig(toYear, sourceConfig, actor);
}
