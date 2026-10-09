// src/lib/leaveLimitService.js
// Service for Leave Limits, Calculation Cycles, and Near/Exceeded Alerts

import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { logActivity, ACTIVITY_CATEGORIES } from './activityLogService';
import { getFiscalYear, parseLocalDate, formatLocalDate } from './dateUtils';
import { LEAVE_TYPES } from './constants';

export const LOCAL_KEY_LEAVE_LIMIT_CONFIG = 'icit_leave_limit_config';

export const DEFAULT_LEAVE_LIMIT_CONFIG = {
  id: 'leave_limit_config',
  cycleMode: 'ROUND_2_PERIODS', // 'ROUND_2_PERIODS' | 'CUSTOM'
  warningThresholdPercent: 80, // % threshold to trigger warning (e.g. 80%)
  includedLeaveTypes: [
    'ขาด',
    'สาย',
    'ลาป่วย',
    'ลากิจ',
    'ลาพักผ่อน',
    'ลาคลอดบุตร',
    'ลาไปช่วยเหลือภริยาที่คลอดบุตร',
    'ลาป่วยจำเป็น',
    'อื่น ๆ',
  ],
  // 1. พนักงานมหาวิทยาลัย (University Employee - พม.)
  // เกณฑ์: ลาป่วยและลากิจ ไม่เกิน 10 ครั้ง 23 วัน, สาย ไม่เกิน 18 ครั้ง ต่อรอบ 6 เดือน
  universityStaffLimits: {
    roundMaxDays: 23,
    roundMaxTimes: 10,
    roundMaxLate: 18,
  },
  // 2. พนักงานพิเศษ (Special Employee - พศ.)
  // เกณฑ์: ทำงาน < 6 เดือน ลาป่วยไม่เกิน 5 วัน | ทำงาน > 6 เดือน ลาป่วย+กิจ ไม่เกิน 15 วันทำการ | สายไม่เกิน 18 ครั้งต่อรอบ
  specialStaffLimits: {
    roundMaxDays: 15, // กรณีทำงาน > 6 เดือน
    probationMaxDays: 5, // กรณีทำงาน < 6 เดือน (ลาป่วยได้ไม่เกิน 5 วันทำการ)
    roundMaxLate: 18,
  },
  // 3. เกณฑ์การขอลงเวลา (Time Attendance Requests Limit)
  // เกณฑ์: การขอลงเวลา ไม่เกินจำนวน 12 ครั้ง ใน 1 ปีงบประมาณจริง (1 ต.ค. - 30 ก.ย.)
  timeAttendanceLimits: {
    fullYearMaxTimes: 12,
  },
  // Custom Date Ranges (when cycleMode === 'CUSTOM')
  customCycles: {
    round1: {
      name: 'รอบที่ 1 (กำหนดเอง)',
      startDate: '',
      endDate: '',
    },
    round2: {
      name: 'รอบที่ 2 (กำหนดเอง)',
      startDate: '',
      endDate: '',
    },
  },
  // Fallback single custom cycle for backwards compatibility
  customCycle: {
    name: 'รอบประเมินพิเศษ',
    startDate: '',
    endDate: '',
  },
  updatedAt: null,
  updatedBy: null,
};

let cachedLeaveLimitConfig = null;
const configSubscribers = new Set();

function notifySubscribers(config) {
  cachedLeaveLimitConfig = config;
  configSubscribers.forEach((cb) => {
    try {
      cb(config);
    } catch (e) {
      console.error('Error in leave limit config subscriber callback', e);
    }
  });
}

/**
 * Get current Leave Limit Configuration (Cached / LocalStorage / Defaults)
 */
export function getLeaveLimitConfig() {
  if (cachedLeaveLimitConfig) return cachedLeaveLimitConfig;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_KEY_LEAVE_LIMIT_CONFIG);
      if (stored) {
        cachedLeaveLimitConfig = { ...DEFAULT_LEAVE_LIMIT_CONFIG, ...JSON.parse(stored) };
        return cachedLeaveLimitConfig;
      }
    } catch (e) {
      console.warn('Failed to parse stored leave limit config', e);
    }
  }
  return DEFAULT_LEAVE_LIMIT_CONFIG;
}

/**
 * Subscribe to real-time Leave Limit Configuration
 */
export function subscribeLeaveLimitConfig(callback) {
  if (typeof window === 'undefined') {
    callback(DEFAULT_LEAVE_LIMIT_CONFIG);
    return () => {};
  }

  configSubscribers.add(callback);

  // 1. Immediately return cached/local data
  const initial = getLeaveLimitConfig();
  callback(initial);

  let firestoreUnsub = null;

  // 2. Listen to Firestore settings/leave_limit_config
  if (isFirebaseConfigured && db) {
    try {
      const configDocRef = doc(db, 'settings', 'leave_limit_config');
      firestoreUnsub = onSnapshot(
        configDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const merged = { ...DEFAULT_LEAVE_LIMIT_CONFIG, ...data };
            localStorage.setItem(LOCAL_KEY_LEAVE_LIMIT_CONFIG, JSON.stringify(merged));
            notifySubscribers(merged);
          } else {
            // Check fallback in leave_configs
            const fallbackRef = doc(db, 'leave_configs', 'limit_config');
            getDoc(fallbackRef).then((fSnap) => {
              if (fSnap.exists()) {
                const fData = fSnap.data();
                const merged = { ...DEFAULT_LEAVE_LIMIT_CONFIG, ...fData };
                localStorage.setItem(LOCAL_KEY_LEAVE_LIMIT_CONFIG, JSON.stringify(merged));
                notifySubscribers(merged);
              }
            }).catch(() => {});
          }
        },
        (err) => {
          console.warn('Leave limit config snapshot warning', err);
        }
      );
    } catch (e) {
      console.warn('Failed to attach leave limit config listener', e);
    }
  }

  const handleStorageChange = (e) => {
    if (e.key === LOCAL_KEY_LEAVE_LIMIT_CONFIG && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        notifySubscribers({ ...DEFAULT_LEAVE_LIMIT_CONFIG, ...parsed });
      } catch {}
    }
  };
  window.addEventListener('storage', handleStorageChange);

  return () => {
    configSubscribers.delete(callback);
    window.removeEventListener('storage', handleStorageChange);
    if (firestoreUnsub) {
      firestoreUnsub();
    }
  };
}

/**
 * Save Leave Limit Configuration (Firestore + LocalStorage + Audit Log)
 */
export async function saveLeaveLimitConfig(configData, currentUser = null) {
  const updatedData = {
    ...DEFAULT_LEAVE_LIMIT_CONFIG,
    ...configData,
    updatedAt: new Date().toISOString(),
    updatedBy: currentUser ? {
      name: currentUser.name || currentUser.displayName || 'Admin',
      email: currentUser.email || '',
      role: currentUser.role || 'Admin',
    } : null,
  };

  // 1. Update local storage & cache immediately
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_LEAVE_LIMIT_CONFIG, JSON.stringify(updatedData));
  }
  notifySubscribers(updatedData);

  // 2. Persist to Firestore
  if (isFirebaseConfigured && db) {
    try {
      const configDocRef = doc(db, 'settings', 'leave_limit_config');
      await setDoc(configDocRef, updatedData, { merge: true });

      // Also sync to leave_configs/limit_config for redundancy
      try {
        const fallbackRef = doc(db, 'leave_configs', 'limit_config');
        await setDoc(fallbackRef, updatedData, { merge: true });
      } catch {}
    } catch (e) {
      console.warn('Failed to save leave limit config to Firestore', e);
    }
  }

  // 3. Log Activity
  try {
    await logActivity({
      action: 'UPDATE_LEAVE_LIMIT_CONFIG',
      category: ACTIVITY_CATEGORIES.LEAVE,
      title: 'ปรับปรุงเกณฑ์จำกัดการลาและรอบการคำนวณ',
      details: `ตั้งค่าเกณฑ์จำกัดการลา: รอบประเมิน=${updatedData.cycleMode}, เตือนเมื่อถึง=${updatedData.warningThresholdPercent}%`,
      actor: currentUser ? {
        name: currentUser.name || currentUser.displayName || 'Admin',
        email: currentUser.email || '',
        role: currentUser.role || 'Admin',
      } : { name: 'Admin' },
      target: {
        entityId: 'leave_limit_config',
        entityType: 'LEAVE_LIMIT_CONFIG',
        title: 'เกณฑ์จำกัดการลาในภาพรวม',
      },
      metadata: {
        cycleMode: updatedData.cycleMode,
        warningThresholdPercent: updatedData.warningThresholdPercent,
        universityStaffLimits: updatedData.universityStaffLimits,
        specialStaffLimits: updatedData.specialStaffLimits,
      },
    });
  } catch (logErr) {
    console.warn('Failed to log leave limit update activity', logErr);
  }

  return { success: true, config: updatedData };
}

/**
 * Get evaluation cycle date range
 * @param {object} config - Leave limit config
 * @param {number} fiscalYear - Target fiscal year (CE e.g. 2026 for BE 2569)
 * @param {string} cycleKey - 'round_1' | 'round_2' | 'full_year' | 'custom'
 */
export function getEvaluationCycleInfo(config = DEFAULT_LEAVE_LIMIT_CONFIG, fiscalYear = 2026, cycleKey = 'round_1') {
  const fy = Number(fiscalYear) || getFiscalYear(new Date());
  const beYear = fy + 543;
  const prevBeYear = beYear - 1;

  const isCustomMode = config.cycleMode === 'CUSTOM';

  // 1. Custom Evaluation Mode
  if (isCustomMode || cycleKey === 'custom') {
    const round1Custom = config.customCycles?.round1 || {};
    const round2Custom = config.customCycles?.round2 || {};
    const singleCustom = config.customCycle || {};

    if (cycleKey === 'both_rounds' || cycleKey === 'round_both' || cycleKey === 'round_1_plus_2' || cycleKey === 'full_year') {
      const r1Start = round1Custom.startDate || singleCustom.startDate || `${fy - 1}-08-01`;
      const r2End = round2Custom.endDate || singleCustom.endDate || `${fy}-07-31`;
      return {
        key: 'both_rounds',
        name: `รอบที่ 1 + รอบที่ 2 (กำหนดเอง)`,
        startDate: r1Start,
        endDate: r2End,
        isRound: false,
        isBothRounds: true,
        fiscalYear: fy,
        buddhistYear: beYear,
        label: `รอบที่ 1 + รอบที่ 2 (${r1Start} ถึง ${r2End})`,
      };
    }

    if (cycleKey === 'round_2') {
      const r2Start = round2Custom.startDate || `${fy}-02-01`;
      const r2End = round2Custom.endDate || `${fy}-07-31`;
      const r2Name = round2Custom.name || 'รอบที่ 2 (กำหนดเอง)';
      return {
        key: 'round_2',
        name: `${r2Name} (${r2Start} - ${r2End})`,
        startDate: r2Start,
        endDate: r2End,
        isRound: true,
        isBothRounds: false,
        fiscalYear: fy,
        buddhistYear: beYear,
        label: `${r2Name} (${r2Start} ถึง ${r2End})`,
      };
    }

    // Default round_1 or 'custom'
    const r1Start = round1Custom.startDate || singleCustom.startDate || `${fy - 1}-08-01`;
    const r1End = round1Custom.endDate || singleCustom.endDate || `${fy}-01-31`;
    const r1Name = round1Custom.name || singleCustom.name || 'รอบที่ 1 (กำหนดเอง)';
    return {
      key: 'round_1',
      name: `${r1Name} (${r1Start} - ${r1End})`,
      startDate: r1Start,
      endDate: r1End,
      isRound: true,
      isBothRounds: false,
      fiscalYear: fy,
      buddhistYear: beYear,
      label: `${r1Name} (${r1Start} ถึง ${r1End})`,
    };
  }

  // 2. Both Rounds (รอบที่ 1 + รอบที่ 2: 1 ส.ค. - 31 ก.ค.)
  if (cycleKey === 'both_rounds' || cycleKey === 'round_both' || cycleKey === 'round_1_plus_2' || cycleKey === 'full_year' || config.cycleMode === 'FULL_YEAR') {
    return {
      key: 'both_rounds',
      name: `รอบที่ 1 + รอบที่ 2 (${beYear})`,
      startDate: `${fy - 1}-08-01`,
      endDate: `${fy}-07-31`,
      isRound: false,
      isBothRounds: true,
      fiscalYear: fy,
      buddhistYear: beYear,
      label: `รอบที่ 1 + รอบที่ 2 (1 ส.ค. ${prevBeYear} - 31 ก.ค. ${beYear})`,
    };
  }

  // 3. Round 2: กุมภาพันธ์ ถึง กรกฎาคม (1 ก.พ. - 31 ก.ค.)
  if (cycleKey === 'round_2') {
    return {
      key: 'round_2',
      name: `รอบที่ 2 (1 ก.พ. - 31 ก.ค. ${beYear})`,
      startDate: `${fy}-02-01`,
      endDate: `${fy}-07-31`,
      isRound: true,
      isBothRounds: false,
      fiscalYear: fy,
      buddhistYear: beYear,
      label: `รอบที่ 2/ปี ${beYear} (1 ก.พ. ${beYear} - 31 ก.ค. ${beYear})`,
    };
  }

  // 4. Round 1 (Default): สิงหาคม ถึง มกราคม (1 ส.ค. - 31 ม.ค.)
  return {
    key: 'round_1',
    name: `รอบที่ 1 (1 ส.ค. ${prevBeYear} - 31 ม.ค. ${beYear})`,
    startDate: `${fy - 1}-08-01`,
    endDate: `${fy}-01-31`,
    isRound: true,
    isBothRounds: false,
    fiscalYear: fy,
    buddhistYear: beYear,
    label: `รอบที่ 1/ปี ${beYear} (1 ส.ค. ${prevBeYear} - 31 ม.ค. ${beYear})`,
  };
}

/**
 * Determine the current active round based on today's date
 * รอบที่ 1: เดือนสิงหาคม (7) ถึง เดือนมกราคม (0)
 * รอบที่ 2: เดือนกุมภาพันธ์ (1) ถึง เดือนกรกฎาคม (6)
 */
export function getCurrentActiveCycleKey(targetDate = new Date()) {
  const d = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const month = d.getMonth(); // 0 = Jan, 1 = Feb, ..., 6 = Jul, 7 = Aug, 11 = Dec
  if (month >= 7 || month === 0) {
    return 'round_1';
  }
  return 'round_2';
}

/**
 * Calculate leave statistics and alert status for all personnel
 */
export function calculatePersonnelLeaveLimitStats({
  leaves = [],
  personnelList = [],
  config = DEFAULT_LEAVE_LIMIT_CONFIG,
  fiscalYear = 2026,
  selectedCycleKey = null,
}) {
  const fy = Number(fiscalYear) || getFiscalYear(new Date());
  const cycleKey = selectedCycleKey || (config.cycleMode === 'FULL_YEAR' ? 'full_year' : config.cycleMode === 'CUSTOM' ? (getCurrentActiveCycleKey()) : getCurrentActiveCycleKey());
  const cycleInfo = getEvaluationCycleInfo(config, fy, cycleKey);

  const startDate = cycleInfo.startDate;
  const endDate = cycleInfo.endDate;
  const warningThreshold = Number(config.warningThresholdPercent) || 80;
  const includedTypes = new Set(config.includedLeaveTypes || LEAVE_TYPES);

  // Group leaves by personnel
  const leavesByPerson = {};
  leaves.forEach((l) => {
    if (!l.startDate || !l.endDate) return;
    const lStart = l.startDate.split('T')[0];
    const lEnd = l.endDate.split('T')[0];

    // Check overlap with cycle date range
    if (lStart > endDate || lEnd < startDate) return;

    // Check included leave types
    if (!includedTypes.has(l.leaveType)) return;

    const personId = l.personnelId || l.personnelName || 'unknown';
    if (!leavesByPerson[personId]) {
      leavesByPerson[personId] = [];
    }
    leavesByPerson[personId].push(l);
  });

  const personnelStats = [];
  let exceededCount = 0;
  let nearLimitCount = 0;
  let normalCount = 0;

  const exceededByStaffType = {
    university: 0,
    special: 0,
  };
  const nearLimitByStaffType = {
    university: 0,
    special: 0,
  };

  // Evaluate each personnel in directory
  const activePersonnel = (personnelList || []).filter(
    (p) => p.status !== 'RESIGNED' && p.status !== 'ลาออก'
  );

  activePersonnel.forEach((person) => {
    const isSpecialStaff =
      (person.personnelType || '').includes('พิเศษ') ||
      (person.position || '').includes('พิเศษ') ||
      (person.type || '').includes('พิเศษ');
    
    const staffTypeLabel = isSpecialStaff ? 'พนักงานพิเศษ' : 'พนักงานมหาวิทยาลัย';
    const staffTypeShort = isSpecialStaff ? 'พศ.' : 'พม.';
    const typeKey = isSpecialStaff ? 'special' : 'university';

    // Get configured limits (evaluated per 6-month round or 2 rounds combined)
    const limitsConfig = isSpecialStaff
      ? config.specialStaffLimits || DEFAULT_LEAVE_LIMIT_CONFIG.specialStaffLimits
      : config.universityStaffLimits || DEFAULT_LEAVE_LIMIT_CONFIG.universityStaffLimits;

    const roundMultiplier = cycleInfo.isBothRounds ? 2 : 1;
    const maxDays = (Number(limitsConfig.roundMaxDays) || (isSpecialStaff ? 15 : 23)) * roundMultiplier;
    const maxTimes = isSpecialStaff ? 0 : ((Number(limitsConfig.roundMaxTimes) || 10) * roundMultiplier);
    const maxLate = (Number(limitsConfig.roundMaxLate) || 18) * roundMultiplier;
    const maxTransactions = 0; // Removed transaction limit

    // Find person's leaves (by ID or Name match)
    const personLeaves = leavesByPerson[person.id] || leavesByPerson[person.name] || [];

    // Calculate actual days, times, and late counts of leave overlapping this cycle
    let totalDays = 0;
    let totalLateTimes = 0;
    const matchingRecords = [];

    personLeaves.forEach((l) => {
      const lStart = l.startDate.split('T')[0];
      const lEnd = l.endDate.split('T')[0];

      const overlapStartStr = lStart > startDate ? lStart : startDate;
      const overlapEndStr = lEnd < endDate ? lEnd : endDate;

      let leaveDaysInCycle = 0;
      if (lStart >= startDate && lEnd <= endDate) {
        leaveDaysInCycle = Number(l.totalDays) || 1;
      } else {
        const startObj = parseLocalDate(overlapStartStr);
        const endObj = parseLocalDate(overlapEndStr);
        if (startObj && endObj && startObj <= endObj) {
          leaveDaysInCycle = Math.round((endObj - startObj) / (1000 * 60 * 60 * 24)) + 1;
        } else {
          leaveDaysInCycle = 1;
        }
      }

      // Check if this record is 'สาย' (Late)
      if (l.leaveType === 'สาย') {
        totalLateTimes += 1;
      }

      totalDays += leaveDaysInCycle;
      matchingRecords.push({
        ...l,
        overlapDaysInCycle: leaveDaysInCycle,
      });
    });

    totalDays = Number(totalDays.toFixed(1));
    const totalTimes = matchingRecords.length; // จำนวนครั้ง / การลา
    const totalTransactions = matchingRecords.length; // จำนวนการทำรายการ

    // Calculate usage percentages
    const daysPercent = maxDays > 0 ? Number(((totalDays / maxDays) * 100).toFixed(1)) : 0;
    const timesPercent = maxTimes > 0 ? Number(((totalTimes / maxTimes) * 100).toFixed(1)) : 0;
    const latePercent = maxLate > 0 ? Number(((totalLateTimes / maxLate) * 100).toFixed(1)) : 0;
    const highestPercent = Math.max(daysPercent, timesPercent, latePercent);

    // Evaluate exceeded conditions (>= max limit)
    const isExceededDays = totalDays >= maxDays && maxDays > 0;
    const isExceededTimes = !isSpecialStaff && totalTimes >= maxTimes && maxTimes > 0;
    const isExceededLate = totalLateTimes >= maxLate && maxLate > 0;
    const isExceeded = isExceededDays || isExceededTimes || isExceededLate;

    // Evaluate near-limit condition (>= warningThreshold % but not exceeded)
    const isNearDays = !isExceededDays && daysPercent >= warningThreshold;
    const isNearTimes = !isSpecialStaff && !isExceededTimes && timesPercent >= warningThreshold;
    const isNearLate = !isExceededLate && latePercent >= warningThreshold;
    const isNearLimit = !isExceeded && (isNearDays || isNearTimes || isNearLate);

    let status = 'NORMAL';
    if (isExceeded) {
      status = 'EXCEEDED';
      exceededCount++;
      exceededByStaffType[typeKey]++;
    } else if (isNearLimit) {
      status = 'NEAR_LIMIT';
      nearLimitCount++;
      nearLimitByStaffType[typeKey]++;
    } else {
      normalCount++;
    }

    // Trigger reasons list
    const alertTriggers = [];
    if (isExceededDays) alertTriggers.push({ metric: 'จำนวนวันลา', type: 'EXCEEDED', current: totalDays, limit: maxDays, unit: 'วัน', percent: daysPercent });
    else if (isNearDays) alertTriggers.push({ metric: 'จำนวนวันลา', type: 'NEAR_LIMIT', current: totalDays, limit: maxDays, unit: 'วัน', percent: daysPercent });

    if (!isSpecialStaff) {
      if (isExceededTimes) alertTriggers.push({ metric: 'จำนวนครั้งการลา', type: 'EXCEEDED', current: totalTimes, limit: maxTimes, unit: 'ครั้ง', percent: timesPercent });
      else if (isNearTimes) alertTriggers.push({ metric: 'จำนวนครั้งการลา', type: 'NEAR_LIMIT', current: totalTimes, limit: maxTimes, unit: 'ครั้ง', percent: timesPercent });
    }

    if (isExceededLate) alertTriggers.push({ metric: 'จำนวนครั้งมาสาย', type: 'EXCEEDED', current: totalLateTimes, limit: maxLate, unit: 'ครั้ง', percent: latePercent });
    else if (isNearLate) alertTriggers.push({ metric: 'จำนวนครั้งมาสาย', type: 'NEAR_LIMIT', current: totalLateTimes, limit: maxLate, unit: 'ครั้ง', percent: latePercent });

    personnelStats.push({
      personnelId: person.id,
      personnelName: person.name,
      personnelType: staffTypeLabel,
      staffTypeShort,
      isSpecialStaff,
      department: person.department || '-',
      position: person.position || '-',
      email: person.email || '',
      avatar: person.avatar || '',
      totalDays,
      totalTimes,
      totalLateTimes,
      totalTransactions,
      limits: {
        maxDays,
        maxTimes,
        maxLate,
        maxTransactions: 0,
      },
      percentages: {
        daysPercent,
        timesPercent,
        latePercent,
        highestPercent,
      },
      flags: {
        isExceededDays,
        isExceededTimes,
        isExceededLate,
        isNearDays,
        isNearTimes,
        isNearLate,
      },
      status, // 'EXCEEDED' | 'NEAR_LIMIT' | 'NORMAL'
      alertTriggers,
      leaves: matchingRecords,
    });
  });

  // Sort: EXCEEDED first, then NEAR_LIMIT, then highest percent descending
  personnelStats.sort((a, b) => {
    const statusWeight = { EXCEEDED: 3, NEAR_LIMIT: 2, NORMAL: 1 };
    if (statusWeight[b.status] !== statusWeight[a.status]) {
      return statusWeight[b.status] - statusWeight[a.status];
    }
    return b.percentages.highestPercent - a.percentages.highestPercent;
  });

  return {
    cycleInfo,
    selectedCycleKey: cycleKey,
    summary: {
      totalPersonnel: activePersonnel.length,
      evaluatedPersonnel: personnelStats.length,
      exceededCount,
      nearLimitCount,
      normalCount,
      atRiskCount: exceededCount + nearLimitCount,
      exceededByStaffType,
      nearLimitByStaffType,
    },
    personnelStats,
    riskPersonnel: personnelStats.filter((p) => p.status === 'EXCEEDED' || p.status === 'NEAR_LIMIT'),
    exceededList: personnelStats.filter((p) => p.status === 'EXCEEDED'),
    nearLimitList: personnelStats.filter((p) => p.status === 'NEAR_LIMIT'),
    normalList: personnelStats.filter((p) => p.status === 'NORMAL'),
  };
}

/**
 * Generate rich Thai HTML email for Leave Limit Alerts
 */
export function generateLeaveLimitEmailContent({
  personStat,
  cycleInfo,
  appBaseUrl = '',
  customNote = '',
}) {
  const baseUrl =
    appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://icitworkspace.web.app');
  const isExceeded = personStat.status === 'EXCEEDED';
  const statusTitle = isExceeded
    ? 'แจ้งเตือนการใช้วันลาเกินเกณฑ์ที่กำหนด (Exceeded Leave Limit)'
    : 'แจ้งเตือนสถิติการใช้วันลาใกล้ครบเกณฑ์กำหนด (Near Leave Limit Warning)';
  const badgeText = isExceeded ? '🚨 เกินเกณฑ์ที่กำหนด' : '⚠️ ใกล้เกินเกณฑ์ที่กำหนด';
  const statusColor = isExceeded ? '#DC2626' : '#D97706';
  const statusBg = isExceeded ? '#FEE2E2' : '#FEF3C7';
  const statusBorder = isExceeded ? '#EF4444' : '#F59E0B';

  const subject = `[${isExceeded ? 'แจ้งเตือนด่วน ICIT' : 'แจ้งเตือน ICIT'}] ${statusTitle}: คุณ${personStat.personnelName} (${cycleInfo.name || cycleInfo.label})`;

  const leaveRecordsHtml =
    personStat.leaves && personStat.leaves.length > 0
      ? personStat.leaves
          .map((l) => {
            const startThai = l.startDate ? l.startDate : '-';
            const endThai = l.endDate ? l.endDate : '-';
            const dateRange = startThai === endThai ? startThai : `${startThai} ถึง ${endThai}`;
            return `
              <tr style="border-bottom: 1px solid #E2E8F0;">
                <td style="padding: 8px 10px; font-weight: bold; color: #1E293B;">${l.leaveType}</td>
                <td style="padding: 8px 10px; color: #475569;">${dateRange}</td>
                <td style="padding: 8px 10px; text-align: center; font-weight: bold; color: #EA580C;">${l.overlapDaysInCycle || l.totalDays} วัน</td>
                <td style="padding: 8px 10px; color: #64748B;">${l.reason || l.remarks || '-'}</td>
              </tr>
            `;
          })
          .join('')
      : `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #94A3B8;">ไม่มีรายการประวัติการลาในรอบนี้</td></tr>`;

  const triggersSummary =
    personStat.alertTriggers && personStat.alertTriggers.length > 0
      ? personStat.alertTriggers
          .map(
            (t) =>
              `<li style="margin-bottom: 4px;"><strong>${t.metric}:</strong> ใช้ไปแล้ว ${t.current}/${t.limit} ${t.unit} (คิดเป็น ${t.percent}% ของเกณฑ์)</li>`
          )
          .join('')
      : `<li>สถิติการลาแตะระดับเฝ้าระวังของรอบการประเมิน</li>`;

  const html = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; line-height: 1.6; color: #1E293B;">
  <div style="max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1);">
    
    <!-- Top Header -->
    <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 28px 24px; text-align: center; border-bottom: 4px solid #F97316;">
      <h1 style="color: #FFFFFF; font-size: 20px; margin: 0 0 6px 0; font-weight: 800;">
        สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT KMUTNB)
      </h1>
      <p style="color: #FED7AA; font-size: 13px; margin: 0; font-weight: 600;">
        ระบบบริหารจัดการวันลาและติดตามสิทธิ์ (Leave Limit & Quota Monitoring)
      </p>
    </div>

    <div style="padding: 24px;">
      <!-- Alert Banner -->
      <div style="background: ${statusBg}; border-left: 5px solid ${statusBorder}; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 14px; font-weight: 800; color: ${statusColor};">
            ${badgeText}
          </span>
          <span style="font-size: 12px; font-weight: 700; color: #475569;">
            ${cycleInfo.label}
          </span>
        </div>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #334155; line-height: 1.5;">
          เรียน คุณ <strong>${personStat.personnelName}</strong> ระบบตรวจพบว่าสถิติการใช้วันลาของท่านในรอบนี้อยู่ในเกณฑ์ที่ต้องเฝ้าระวัง โปรดตรวจสอบรายละเอียดด้านล่าง
        </p>
      </div>

      <!-- Personnel Info Card -->
      <table style="width: 100%; border-collapse: collapse; background: #F8FAFC; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; width: 35%; color: #64748B;">ชื่อ-นามสกุล:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #0F172A;">${personStat.personnelName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #64748B;">ฝ่ายงาน / ตำแหน่ง:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #0F172A;">${personStat.department} (${personStat.position})</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; color: #64748B;">ประเภทบุคลากร:</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #4F46E5;">${personStat.personnelType}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; color: #64748B;">รอบการประเมิน:</td>
          <td style="padding: 10px 14px; font-weight: bold; color: #0F172A;">${cycleInfo.label}</td>
        </tr>
      </table>

      <!-- 3 Metrics Comparison -->
      <h3 style="font-size: 15px; margin: 0 0 10px 0; color: #0F172A; font-weight: 700;">
        📊 สรุปสถิติการใช้วันลาเทียบกับเพดานเกณฑ์ที่กำหนด
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; text-align: left;">
        <thead>
          <tr style="background: #F1F5F9; color: #475569;">
            <th style="padding: 8px 10px; border-radius: 6px 0 0 6px;">หัวข้อการประเมิน</th>
            <th style="padding: 8px 10px; text-align: center;">ใช้ไปจริง</th>
            <th style="padding: 8px 10px; text-align: center;">เพดานจำกัด</th>
            <th style="padding: 8px 10px; text-align: center; border-radius: 0 6px 6px 0;">% การใช้</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px; font-weight: bold; color: #1E293B;">1. จำนวนวันลา</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.flags?.isExceededDays ? '#DC2626' : personStat.flags?.isNearDays ? '#D97706' : '#0F172A'};">${personStat.totalDays} วัน</td>
            <td style="padding: 10px; text-align: center; color: #64748B;">${personStat.limits?.maxDays || '-'} วัน</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.percentages?.daysPercent >= 80 ? '#DC2626' : '#059669'};">${personStat.percentages?.daysPercent || 0}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px; font-weight: bold; color: #1E293B;">2. จำนวนครั้งการลา</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.flags?.isExceededTimes ? '#DC2626' : personStat.flags?.isNearTimes ? '#D97706' : '#0F172A'};">${personStat.totalTimes} ครั้ง</td>
            <td style="padding: 10px; text-align: center; color: #64748B;">${personStat.limits?.maxTimes || '-'} ครั้ง</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.percentages?.timesPercent >= 80 ? '#DC2626' : '#059669'};">${personStat.percentages?.timesPercent || 0}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px; font-weight: bold; color: #1E293B;">3. จำนวนครั้งมาสาย</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.flags?.isExceededLate ? '#DC2626' : personStat.flags?.isNearLate ? '#D97706' : '#0F172A'};">${personStat.totalLateTimes || 0} ครั้ง</td>
            <td style="padding: 10px; text-align: center; color: #64748B;">${personStat.limits?.maxLate || '-'} ครั้ง</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.percentages?.latePercent >= 80 ? '#DC2626' : '#059669'};">${personStat.percentages?.latePercent || 0}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px; font-weight: bold; color: #1E293B;">4. จำนวนรายการลา</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.flags?.isExceededTrans ? '#DC2626' : personStat.flags?.isNearTrans ? '#D97706' : '#0F172A'};">${personStat.totalTransactions} รายการ</td>
            <td style="padding: 10px; text-align: center; color: #64748B;">${personStat.limits?.maxTransactions || '-'} รายการ</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.percentages?.transPercent >= 80 ? '#DC2626' : '#059669'};">${personStat.percentages?.transPercent || 0}%</td>
          </tr>
        </tbody>
      </table>

      <!-- Reasons / Highlights -->
      <div style="background: #FFF7ED; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #9A3412;">
        <strong>📌 สรุปสาเหตุการแจ้งเตือน:</strong>
        <ul style="margin: 6px 0 0 0; padding-left: 20px;">
          ${triggersSummary}
        </ul>
      </div>

      <!-- Detail Leave Records Table -->
      <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #0F172A; font-weight: 700;">
        📋 รายการประวัติการลาของท่านในรอบนี้ (${personStat.leaves?.length || 0} รายการ)
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; text-align: left;">
        <thead>
          <tr style="background: #F1F5F9; color: #475569;">
            <th style="padding: 8px 10px;">ประเภทการลา</th>
            <th style="padding: 8px 10px;">ช่วงวันที่</th>
            <th style="padding: 8px 10px; text-align: center;">วันในรอบ</th>
            <th style="padding: 8px 10px;">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          ${leaveRecordsHtml}
        </tbody>
      </table>

      ${customNote ? `
      <div style="background: #F1F5F9; border-left: 4px solid #3B82F6; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; color: #1E293B;">
        <strong>💬 ข้อความเพิ่มเติมจากผู้ดูแลระบบ/งานบุคคล:</strong>
        <div style="margin-top: 4px; white-space: pre-wrap;">${customNote}</div>
      </div>
      ` : ''}

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0 16px 0;">
        <a href="${baseUrl}/leave" style="display: inline-block; background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35);">
          เข้าสู่ระบบ ICIT Workspace เพื่อตรวจสอบวันลา
        </a>
      </div>

      <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0;">
        หากมีข้อสงสัยเกี่ยวกับสถิติการลาหรือการคำนวณโควตา โปรดติดต่อเจ้าหน้าที่งานบริหารงานบุคคล สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94A3B8;">
      อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ ICIT Workspace &bull; วันที่ส่ง: ${new Date().toLocaleString('th-TH')}
      <br />
      สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (ICIT KMUTNB)
    </div>
  </div>
</body>
</html>
  `;

  return {
    subject,
    html,
  };
}

/**
 * Dispatch Leave Limit Email Notification to a single personnel
 */
export async function sendLeaveLimitEmailNotification({
  personStat,
  cycleInfo,
  sender = null,
  customNote = '',
  appBaseUrl = '',
}) {
  if (!personStat || !personStat.email) {
    return {
      success: false,
      error: 'ไม่พบที่อยู่อีเมลของบุคลากร',
    };
  }

  const { subject, html } = generateLeaveLimitEmailContent({
    personStat,
    cycleInfo,
    appBaseUrl,
    customNote,
  });

  const logEntry = {
    id: `email-leavelimit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    recordId: personStat.personnelId || '',
    targetStep: personStat.status, // 'EXCEEDED' | 'NEAR_LIMIT'
    recipientEmail: personStat.email,
    recipientName: personStat.personnelName,
    recipientRole: personStat.personnelType,
    subject,
    sentAt: new Date().toISOString(),
    status: 'PENDING',
    deliveryMethod: 'Next.js Relay / Google Apps Script',
    metadata: {
      totalDays: personStat.totalDays,
      maxDays: personStat.limits.maxDays,
      daysPercent: personStat.percentages.daysPercent,
      cycleKey: cycleInfo.key,
      cycleLabel: cycleInfo.label,
    },
  };

  let isDelivered = false;
  let deliveryError = null;

  try {
    const resp = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: personStat.email,
        subject,
        htmlBody: html,
        senderName: 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)',
      }),
    });

    const resData = await resp.json().catch(() => ({}));
    if (resp.ok && resData.success) {
      logEntry.deliveryMethod = resData.via || 'Google Apps Script Gateway';
      logEntry.status = resData.simulated ? 'SIMULATED' : 'DELIVERED';
      isDelivered = true;
    } else {
      deliveryError = resData.message || resData.error || `HTTP ${resp.status} relay failed`;
      logEntry.deliveryMethod = 'Email API (Failed)';
      logEntry.status = 'FAILED';
      logEntry.error = deliveryError;
    }
  } catch (err) {
    console.warn('Leave limit email dispatch error:', err);
    deliveryError = err.message || 'Network error during email dispatch';
    logEntry.deliveryMethod = 'Email API (Error)';
    logEntry.status = 'FAILED';
    logEntry.error = deliveryError;
  }

  // Save to sent email logs in LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const logs = JSON.parse(localStorage.getItem('icit_sent_email_logs') || '[]');
      logs.unshift(logEntry);
      if (logs.length > 100) logs.pop();
      localStorage.setItem('icit_sent_email_logs', JSON.stringify(logs));
    } catch {}
  }

  // Save to Firestore email_logs collection
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'email_logs', logEntry.id), {
        ...logEntry,
        loggedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to save to email_logs', e);
    }
  }

  // Log to activity_logs
  try {
    await logActivity({
      action: 'EMAIL_DISPATCH',
      category: ACTIVITY_CATEGORIES.LEAVE,
      title: `ส่งอีเมลแจ้งเตือนวันลา${personStat.status === 'EXCEEDED' ? 'เกินเกณฑ์' : 'ใกล้เกินเกณฑ์'}`,
      details: `ส่งอีเมลแจ้งเตือนถึง ${personStat.personnelName} (${personStat.email}) - สถานะ: ${personStat.status}, วันลา: ${personStat.totalDays}/${personStat.limits.maxDays} วัน`,
      actor: sender
        ? {
            name: sender.name || sender.displayName || 'Admin',
            email: sender.email || '',
            role: sender.role || 'Admin',
          }
        : { name: 'Admin' },
      target: {
        entityId: personStat.personnelId,
        entityType: 'PERSONNEL_LEAVE_LIMIT',
        title: personStat.personnelName,
      },
      metadata: {
        recipientEmail: personStat.email,
        status: logEntry.status,
        cycle: cycleInfo.label,
      },
    });
  } catch {}

  return {
    success: isDelivered,
    error: deliveryError,
    logEntry,
  };
}

/**
 * Send batch leave limit emails to all specified personnel
 */
export async function sendBatchLeaveLimitEmailNotifications({
  personnelList = [],
  cycleInfo,
  sender = null,
  customNote = '',
  appBaseUrl = '',
  onProgress = null,
}) {
  const eligiblePersonnel = personnelList.filter(
    (p) => p.email && (p.status === 'EXCEEDED' || p.status === 'NEAR_LIMIT')
  );

  if (eligiblePersonnel.length === 0) {
    return {
      success: true,
      totalCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      results: [],
    };
  }

  const results = [];
  let deliveredCount = 0;
  let failedCount = 0;

  for (let i = 0; i < eligiblePersonnel.length; i++) {
    const person = eligiblePersonnel[i];
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: eligiblePersonnel.length,
        personnelName: person.personnelName,
      });
    }

    const res = await sendLeaveLimitEmailNotification({
      personStat: person,
      cycleInfo,
      sender,
      customNote,
      appBaseUrl,
    });

    if (res.success) {
      deliveredCount++;
    } else {
      failedCount++;
    }

    results.push({
      personnelId: person.personnelId,
      personnelName: person.personnelName,
      email: person.email,
      ...res,
    });
  }

  return {
    success: deliveredCount > 0,
    totalCount: eligiblePersonnel.length,
    deliveredCount,
    failedCount,
    results,
  };
}

/**
 * Helper to normalize any date input (DD/MM/YYYY BE, ISO, etc.) to YYYY-MM-DD (CE)
 */
function normalizeRecordDateToIso(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return formatLocalDate(dateInput);
  }
  const str = String(dateInput).trim();
  // If ISO: YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    let y = parseInt(isoMatch[1], 10);
    if (y > 2400) y -= 543;
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // If DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    let d = String(parseInt(slashMatch[1], 10)).padStart(2, '0');
    let m = String(parseInt(slashMatch[2], 10)).padStart(2, '0');
    let y = parseInt(slashMatch[3], 10);
    if (y > 2400) y -= 543;
    return `${y}-${m}-${d}`;
  }
  return str.split('T')[0];
}

/**
 * Calculate Time Attendance statistics and limits for personnel
 * เกณฑ์ มจพ.: การขอลงเวลา ไม่เกินจำนวน 12 ครั้ง ใน 1 ปีงบประมาณ
 */
export function calculatePersonnelTimeAttendanceStats({
  attendances = [],
  personnelList = [],
  config = DEFAULT_LEAVE_LIMIT_CONFIG,
  fiscalYear = 2026,
}) {
  const fy = Number(fiscalYear) || getFiscalYear(new Date());
  const beYear = fy + 543;
  const prevBeYear = beYear - 1;

  // Fiscal Year date range: 1 ต.ค. (fy - 1) ถึง 30 ก.ย. (fy)
  const startDate = `${fy - 1}-10-01`;
  const endDate = `${fy}-09-30`;

  const maxLimit = Number(config?.timeAttendanceLimits?.fullYearMaxTimes) || 12;
  const warningThresholdPercent = Number(config?.warningThresholdPercent) || 80;

  // Group attendances by personnel
  const attendancesByPerson = {};
  attendances.forEach((rec) => {
    // Exclude cancelled and rejected records
    const isCancelled = rec.status === 'CANCELLED' || rec.currentStep === 'CANCELLED';
    const isRejected = rec.status === 'REJECTED' || rec.currentStep === 'REJECTED' || rec.finalStatus === 'ไม่อนุมัติ';
    if (isCancelled || isRejected) return;
    
    // Check date within fiscal year
    const reqDate = rec.attendanceDate || rec.actionDate || rec.createdAt;
    if (!reqDate) return;
    const dateStr = normalizeRecordDateToIso(reqDate);
    if (!dateStr || dateStr < startDate || dateStr > endDate) return;

    const personId = rec.requesterId || rec.personnelId || rec.requesterName || 'unknown';
    if (!attendancesByPerson[personId]) {
      attendancesByPerson[personId] = [];
    }
    attendancesByPerson[personId].push(rec);
  });

  const activePersonnel = (personnelList || []).filter(
    (p) => p.status !== 'RESIGNED' && p.status !== 'ลาออก'
  );

  let exceededCount = 0;
  let nearLimitCount = 0;
  let normalCount = 0;

  const personnelStats = activePersonnel.map((person) => {
    const records = attendancesByPerson[person.id] || attendancesByPerson[person.name] || [];
    const usedCount = records.length;
    const percent = maxLimit > 0 ? Number(((usedCount / maxLimit) * 100).toFixed(1)) : 0;
    const isExceeded = usedCount >= maxLimit && maxLimit > 0;
    const isNearLimit = !isExceeded && percent >= warningThresholdPercent;
    const remainingCount = Math.max(0, maxLimit - usedCount);

    let status = 'NORMAL';
    if (isExceeded) {
      status = 'EXCEEDED';
      exceededCount++;
    } else if (isNearLimit) {
      status = 'NEAR_LIMIT';
      nearLimitCount++;
    } else {
      normalCount++;
    }

    return {
      personnelId: person.id,
      personnelName: person.name,
      department: person.department || '-',
      position: person.position || '-',
      email: person.email || '',
      usedCount,
      maxLimit,
      remainingCount,
      percent,
      isExceeded,
      isNearLimit,
      status, // 'EXCEEDED' | 'NEAR_LIMIT' | 'NORMAL'
      records,
    };
  });

  personnelStats.sort((a, b) => {
    const statusWeight = { EXCEEDED: 3, NEAR_LIMIT: 2, NORMAL: 1 };
    if (statusWeight[b.status] !== statusWeight[a.status]) {
      return statusWeight[b.status] - statusWeight[a.status];
    }
    return b.usedCount - a.usedCount;
  });

  return {
    fiscalYear: fy,
    buddhistYear: beYear,
    startDate,
    endDate,
    maxLimit,
    warningThresholdPercent,
    summary: {
      totalPersonnel: activePersonnel.length,
      evaluatedPersonnel: personnelStats.length,
      exceededCount,
      nearLimitCount,
      normalCount,
      atRiskCount: exceededCount + nearLimitCount,
    },
    personnelStats,
    riskPersonnel: personnelStats.filter((p) => p.status === 'EXCEEDED' || p.status === 'NEAR_LIMIT'),
    exceededList: personnelStats.filter((p) => p.status === 'EXCEEDED'),
    nearLimitList: personnelStats.filter((p) => p.status === 'NEAR_LIMIT'),
    normalList: personnelStats.filter((p) => p.status === 'NORMAL'),
  };
}

