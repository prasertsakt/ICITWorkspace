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
  cycleMode: 'ROUND_2_PERIODS', // 'ROUND_2_PERIODS' | 'FULL_YEAR' | 'CUSTOM'
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
  // 1. พนักงานมหาวิทยาลัย (University Employee)
  universityStaffLimits: {
    roundMaxDays: 15,
    roundMaxTimes: 6,
    roundMaxTransactions: 6,
    fullYearMaxDays: 23,
    fullYearMaxTimes: 10,
    fullYearMaxTransactions: 10,
  },
  // 2. พนักงานพิเศษ (Special Employee)
  specialStaffLimits: {
    roundMaxDays: 8,
    roundMaxTimes: 4,
    roundMaxTransactions: 4,
    fullYearMaxDays: 15,
    fullYearMaxTimes: 8,
    fullYearMaxTransactions: 8,
  },
  // Custom Date Range (when cycleMode === 'CUSTOM')
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

  if (cycleKey === 'custom' || config.cycleMode === 'CUSTOM') {
    return {
      key: 'custom',
      name: config.customCycle?.name || 'รอบพิเศษกำหนดเอง',
      startDate: config.customCycle?.startDate || `${fy - 1}-10-01`,
      endDate: config.customCycle?.endDate || `${fy}-09-30`,
      isRound: true,
      fiscalYear: fy,
      buddhistYear: beYear,
      label: `${config.customCycle?.name || 'รอบพิเศษ'} (${config.customCycle?.startDate || '-'} ถึง ${config.customCycle?.endDate || '-'})`,
    };
  }

  if (cycleKey === 'full_year' || config.cycleMode === 'FULL_YEAR') {
    return {
      key: 'full_year',
      name: `ตลอดปีงบประมาณ ${beYear}`,
      startDate: `${fy - 1}-10-01`,
      endDate: `${fy}-09-30`,
      isRound: false,
      fiscalYear: fy,
      buddhistYear: beYear,
      label: `ตลอดปีงบประมาณ ${beYear} (1 ต.ค. ${prevBeYear} - 30 ก.ย. ${beYear})`,
    };
  }

  if (cycleKey === 'round_2') {
    return {
      key: 'round_2',
      name: `รอบที่ 2 (1 เม.ย. - 30 ก.ย. ${beYear})`,
      startDate: `${fy}-04-01`,
      endDate: `${fy}-09-30`,
      isRound: true,
      fiscalYear: fy,
      buddhistYear: beYear,
      label: `รอบที่ 2/ปี ${beYear} (1 เม.ย. ${beYear} - 30 ก.ย. ${beYear})`,
    };
  }

  // Default: round_1
  return {
    key: 'round_1',
    name: `รอบที่ 1 (1 ต.ค. ${prevBeYear} - 31 มี.ค. ${beYear})`,
    startDate: `${fy - 1}-10-01`,
    endDate: `${fy}-03-31`,
    isRound: true,
    fiscalYear: fy,
    buddhistYear: beYear,
    label: `รอบที่ 1/ปี ${beYear} (1 ต.ค. ${prevBeYear} - 31 มี.ค. ${beYear})`,
  };
}

/**
 * Determine the current active round based on today's date
 */
export function getCurrentActiveCycleKey(targetDate = new Date()) {
  const d = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const month = d.getMonth(); // 0 = Jan, 9 = Oct, etc.
  // Oct (9) to March (2) -> Round 1
  // April (3) to Sept (8) -> Round 2
  if (month >= 9 || month <= 2) {
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
  const cycleKey = selectedCycleKey || (config.cycleMode === 'FULL_YEAR' ? 'full_year' : config.cycleMode === 'CUSTOM' ? 'custom' : getCurrentActiveCycleKey());
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
    const typeKey = isSpecialStaff ? 'special' : 'university';

    // Get configured limits
    const limitsConfig = isSpecialStaff
      ? config.specialStaffLimits || DEFAULT_LEAVE_LIMIT_CONFIG.specialStaffLimits
      : config.universityStaffLimits || DEFAULT_LEAVE_LIMIT_CONFIG.universityStaffLimits;

    const isFullYear = cycleInfo.key === 'full_year';
    const maxDays = isFullYear ? Number(limitsConfig.fullYearMaxDays) || 23 : Number(limitsConfig.roundMaxDays) || 15;
    const maxTimes = isFullYear ? Number(limitsConfig.fullYearMaxTimes) || 10 : Number(limitsConfig.roundMaxTimes) || 6;
    const maxTransactions = isFullYear ? Number(limitsConfig.fullYearMaxTransactions) || 10 : Number(limitsConfig.roundMaxTransactions) || 6;

    // Find person's leaves (by ID or Name match)
    const personLeaves = leavesByPerson[person.id] || leavesByPerson[person.name] || [];

    // Calculate actual days of leave overlapping this cycle
    let totalDays = 0;
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

      totalDays += leaveDaysInCycle;
      matchingRecords.push({
        ...l,
        overlapDaysInCycle: leaveDaysInCycle,
      });
    });

    totalDays = Number(totalDays.toFixed(1));
    const totalTimes = matchingRecords.length; // จำนวนครั้ง / การลา
    const totalTransactions = matchingRecords.length; // จำนวนการทำรายการ

    // Calculate usage percentage
    const daysPercent = maxDays > 0 ? Number(((totalDays / maxDays) * 100).toFixed(1)) : 0;
    const timesPercent = maxTimes > 0 ? Number(((totalTimes / maxTimes) * 100).toFixed(1)) : 0;
    const transPercent = maxTransactions > 0 ? Number(((totalTransactions / maxTransactions) * 100).toFixed(1)) : 0;
    const highestPercent = Math.max(daysPercent, timesPercent, transPercent);

    // Evaluate exceeded condition (>= max limit)
    const isExceededDays = totalDays >= maxDays && maxDays > 0;
    const isExceededTimes = totalTimes >= maxTimes && maxTimes > 0;
    const isExceededTrans = totalTransactions >= maxTransactions && maxTransactions > 0;
    const isExceeded = isExceededDays || isExceededTimes || isExceededTrans;

    // Evaluate near-limit condition (>= warningThreshold % but not exceeded)
    const isNearDays = !isExceededDays && daysPercent >= warningThreshold;
    const isNearTimes = !isExceededTimes && timesPercent >= warningThreshold;
    const isNearTrans = !isExceededTrans && transPercent >= warningThreshold;
    const isNearLimit = !isExceeded && (isNearDays || isNearTimes || isNearTrans);

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
    if (isExceededDays) alertTriggers.push({ metric: 'จำนวนวัน', type: 'EXCEEDED', current: totalDays, limit: maxDays, unit: 'วัน', percent: daysPercent });
    else if (isNearDays) alertTriggers.push({ metric: 'จำนวนวัน', type: 'NEAR_LIMIT', current: totalDays, limit: maxDays, unit: 'วัน', percent: daysPercent });

    if (isExceededTimes) alertTriggers.push({ metric: 'จำนวนครั้ง', type: 'EXCEEDED', current: totalTimes, limit: maxTimes, unit: 'ครั้ง', percent: timesPercent });
    else if (isNearTimes) alertTriggers.push({ metric: 'จำนวนครั้ง', type: 'NEAR_LIMIT', current: totalTimes, limit: maxTimes, unit: 'ครั้ง', percent: timesPercent });

    if (isExceededTrans) alertTriggers.push({ metric: 'จำนวนรายการ', type: 'EXCEEDED', current: totalTransactions, limit: maxTransactions, unit: 'รายการ', percent: transPercent });
    else if (isNearTrans) alertTriggers.push({ metric: 'จำนวนรายการ', type: 'NEAR_LIMIT', current: totalTransactions, limit: maxTransactions, unit: 'รายการ', percent: transPercent });

    personnelStats.push({
      personnelId: person.id,
      personnelName: person.name,
      personnelType: staffTypeLabel,
      isSpecialStaff,
      department: person.department || '-',
      position: person.position || '-',
      email: person.email || '',
      avatar: person.avatar || '',
      totalDays,
      totalTimes,
      totalTransactions,
      limits: {
        maxDays,
        maxTimes,
        maxTransactions,
      },
      percentages: {
        daysPercent,
        timesPercent,
        transPercent,
        highestPercent,
      },
      flags: {
        isExceededDays,
        isExceededTimes,
        isExceededTrans,
        isNearDays,
        isNearTimes,
        isNearTrans,
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
            <td style="padding: 10px; text-align: center; color: #64748B;">${personStat.limits.maxDays} วัน</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.percentages.daysPercent >= 80 ? '#DC2626' : '#059669'};">${personStat.percentages.daysPercent}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px; font-weight: bold; color: #1E293B;">2. จำนวนครั้งที่ลา</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.flags?.isExceededTimes ? '#DC2626' : personStat.flags?.isNearTimes ? '#D97706' : '#0F172A'};">${personStat.totalTimes} ครั้ง</td>
            <td style="padding: 10px; text-align: center; color: #64748B;">${personStat.limits.maxTimes} ครั้ง</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.percentages.timesPercent >= 80 ? '#DC2626' : '#059669'};">${personStat.percentages.timesPercent}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px; font-weight: bold; color: #1E293B;">3. จำนวนรายการลา</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.flags?.isExceededTrans ? '#DC2626' : personStat.flags?.isNearTrans ? '#D97706' : '#0F172A'};">${personStat.totalTransactions} รายการ</td>
            <td style="padding: 10px; text-align: center; color: #64748B;">${personStat.limits.maxTransactions} รายการ</td>
            <td style="padding: 10px; text-align: center; font-weight: bold; color: ${personStat.percentages.transPercent >= 80 ? '#DC2626' : '#059669'};">${personStat.percentages.transPercent}%</td>
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

