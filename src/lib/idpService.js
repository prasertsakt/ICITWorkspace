// Real-Time IDP Hub Service: Synchronized with Firebase Firestore & Optimized Caching
import { db, isFirebaseConfigured } from './firebase';
import {
  DEFAULT_IDP_CORE_COMPETENCIES,
  DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION,
  DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL,
  IDP_STATUSES,
  POSITIONS,
} from './constants';
import { resolveRoleEmailsFromDirectory } from './emailNotificationService';
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

/**
 * Real-Time Subscription to IDP Records (Optimized by Fiscal Year)
 */
export function subscribeIdpRecords(fiscalYear = '2569', callback) {
  if (typeof window === 'undefined') return () => {};

  const localCacheKey = `${LOCAL_KEY_IDP_RECORDS}_${fiscalYear}`;
  try {
    const raw = localStorage.getItem(localCacheKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) callback(parsed);
    }
  } catch (e) {
    console.warn('LocalStorage read error for IDP records:', e);
  }

  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  try {
    const colRef = collection(db, 'idp_records');
    const q = query(colRef, where('fiscalYear', '==', String(fiscalYear)));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Save local cache
        try {
          localStorage.setItem(localCacheKey, JSON.stringify(records));
        } catch (e) {
          // ignore cache full
        }

        callback(records);
      },
      (err) => {
        console.warn('Firestore idp_records subscription warning (using cache):', err);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error('Failed to setup idp_records snapshot listener:', e);
    return () => {};
  }
}

/**
 * Real-Time Subscription to IDP Master Config per Fiscal Year
 */
export function subscribeIdpConfig(fiscalYear = '2569', callback) {
  if (typeof window === 'undefined') return () => {};

  const configDocId = `idp-config-${fiscalYear}`;
  const localConfigKey = `${LOCAL_KEY_IDP_CONFIG}_${fiscalYear}`;

  const defaultResult = {
    id: configDocId,
    fiscalYear: String(fiscalYear),
    coreCompetencies: DEFAULT_IDP_CORE_COMPETENCIES,
    functionalCompetenciesByPosition: DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION,
    functionalCompetenciesGeneral: DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL,
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
    const docRef = doc(db, 'idp_config', configDocId);
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
        console.warn('Firestore idp_config subscription warning:', err);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.error('Failed to setup idp_config subscription:', e);
    return () => {};
  }
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
    } catch (e) {}
  }

  return payload;
}

/**
 * Delete an IDP Record
 */
export async function deleteIdpRecord(idpId, fiscalYear = '2569') {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'idp_records', idpId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore deleteDoc idp_records warning:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const cacheKey = `${LOCAL_KEY_IDP_RECORDS}_${fiscalYear}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const list = JSON.parse(raw).filter((item) => item.id !== idpId);
        localStorage.setItem(cacheKey, JSON.stringify(list));
      }
    } catch (e) {}
  }

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

  if (!sourceConfig) {
    sourceConfig = {
      coreCompetencies: DEFAULT_IDP_CORE_COMPETENCIES,
      functionalCompetenciesByPosition: DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION,
      functionalCompetenciesGeneral: DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL,
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

  // If no source records, generate initial IDP forms for all active personnel
  if (sourceRecords.length === 0 && allPersonnel.length > 0) {
    sourceRecords = allPersonnel.map((p) => ({
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
