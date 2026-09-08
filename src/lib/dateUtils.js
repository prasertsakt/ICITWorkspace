// Utility functions for Buddhist Era (พ.ศ.) date handling and calculations

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * Validate DD-MM-YYYY format where YYYY is Buddhist Era (e.g., 2500-2650)
 */
export function isValidBuddhistDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateStr.match(regex);
  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const beYear = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (beYear < 2400 || beYear > 2700) return false;

  // Gregorian year for Date verification
  const ceYear = beYear - 543;
  const date = new Date(ceYear, month - 1, day);
  return (
    date.getFullYear() === ceYear &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Parse DD-MM-YYYY (พ.ศ.) string into a JS Date object
 */
export function parseBuddhistDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const beYear = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(beYear)) return null;

  const ceYear = beYear - 543;
  return new Date(ceYear, month - 1, day);
}

/**
 * Format a JS Date object to DD-MM-YYYY (พ.ศ.)
 */
export function formatToBuddhistDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const beYear = date.getFullYear() + 543;
  return `${day}-${month}-${beYear}`;
}

/**
 * Format DD-MM-YYYY (พ.ศ.) to readable Thai date string
 * Example: '01-10-2560' -> '1 ตุลาคม 2560'
 */
export function formatThaiDisplayDate(dateStr, short = false) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const day = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const beYear = parts[2];

  if (monthIdx < 0 || monthIdx > 11) return dateStr;
  const monthName = short ? THAI_MONTHS_SHORT[monthIdx] : THAI_MONTHS_FULL[monthIdx];
  return `${day} ${monthName} ${beYear}`;
}

/**
 * Calculate tenure (อายุงาน) from appointment date (DD-MM-YYYY พ.ศ.) to today
 * Returns { years, months, days, text }
 */
export function calculateTenure(appointmentDateStr) {
  const startDate = parseBuddhistDate(appointmentDateStr);
  if (!startDate) return { years: 0, months: 0, days: 0, text: '-' };

  const now = new Date();
  if (startDate > now) {
    return { years: 0, months: 0, days: 0, text: 'ยังไม่ถึงวันบรรจุ' };
  }

  let years = now.getFullYear() - startDate.getFullYear();
  let months = now.getMonth() - startDate.getMonth();
  let days = now.getDate() - startDate.getDate();

  if (days < 0) {
    months -= 1;
    // Days in previous month
    const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} ปี`);
  if (months > 0) parts.push(`${months} เดือน`);
  if (days > 0 || parts.length === 0) parts.push(`${days} วัน`);

  return {
    years,
    months,
    days,
    text: parts.join(' ')
  };
}

/**
 * Calculate retirement countdown from today to retirement date (DD-MM-YYYY พ.ศ.)
 * Returns { isRetired, years, months, days, text }
 */
export function calculateRetirementCountdown(retirementDateStr) {
  const retireDate = parseBuddhistDate(retirementDateStr);
  if (!retireDate) return { isRetired: false, years: 0, months: 0, days: 0, text: '-' };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  retireDate.setHours(0, 0, 0, 0);

  if (now >= retireDate) {
    return {
      isRetired: true,
      years: 0,
      months: 0,
      days: 0,
      text: 'เกษียณอายุราชการแล้ว'
    };
  }

  let years = retireDate.getFullYear() - now.getFullYear();
  let months = retireDate.getMonth() - now.getMonth();
  let days = retireDate.getDate() - now.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(retireDate.getFullYear(), retireDate.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} ปี`);
  if (months > 0) parts.push(`${months} เดือน`);
  if (days > 0 || parts.length === 0) parts.push(`${days} วัน`);

  return {
    isRetired: false,
    years,
    months,
    days,
    text: `เหลือเวลาอีก ${parts.join(' ')}`
  };
}

/**
 * คำนวณปีงบประมาณไทย (พ.ศ. / ค.ศ.) จากวันที่กำหนด
 * ปีงบประมาณราชการไทยเริ่มต้น 1 ตุลาคม สิ้นสุด 30 กันยายน
 * เช่น ต.ค. 2025 - ก.ย. 2026 คือปีงบประมาณ 2026 (พ.ศ. 2569)
 */
export function getFiscalYear(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-11
  return month >= 9 ? year + 1 : year;
}

/**
 * คำนวณช่วงวันที่ของไตรมาส (รองรับทั้งปีปฏิทิน Calendar Year และปีงบประมาณ Fiscal Year)
 * @param {number} quarterNumber - ไตรมาส 1, 2, 3 หรือ 4
 * @param {object} options
 * @param {boolean} options.isFiscal - true = ปีงบประมาณราชการ (ต.ค. - ก.ย.), false = ปีปฏิทิน (ม.ค. - ธ.ค.)
 * @param {number} options.year - ปี ค.ศ. อ้างอิง (กรณีปีงบประมาณ หมายถึงปีงบประมาณนั้นๆ)
 * @returns {{ startDate: string, endDate: string, label: string, fiscalYear?: number, buddhistYear: number, quarter: number }}
 */
export function getQuarterRange(quarterNumber, { isFiscal = true, year = null } = {}) {
  const now = new Date();
  const q = Number(quarterNumber) || 1;

  if (isFiscal) {
    // ไตรมาสปีงบประมาณราชการ (1 ต.ค. - 30 ก.ย.)
    const fiscalYear = year || getFiscalYear(now);
    const prevYear = fiscalYear - 1;
    const beYear = fiscalYear + 543;

    switch (q) {
      case 1:
        // ไตรมาส 1: 1 ต.ค. - 31 ธ.ค. (ของปีก่อนหน้า)
        return {
          startDate: `${prevYear}-10-01`,
          endDate: `${prevYear}-12-31`,
          label: `ไตรมาส 1 ปีงบประมาณ ${beYear} (ต.ค. - ธ.ค. ${prevYear + 543})`,
          quarter: 1,
          fiscalYear,
          buddhistYear: beYear,
        };
      case 2:
        // ไตรมาส 2: 1 ม.ค. - 31 มี.ค.
        return {
          startDate: `${fiscalYear}-01-01`,
          endDate: `${fiscalYear}-03-31`,
          label: `ไตรมาส 2 ปีงบประมาณ ${beYear} (ม.ค. - มี.ค. ${beYear})`,
          quarter: 2,
          fiscalYear,
          buddhistYear: beYear,
        };
      case 3:
        // ไตรมาส 3: 1 เม.ย. - 30 มิ.ย.
        return {
          startDate: `${fiscalYear}-04-01`,
          endDate: `${fiscalYear}-06-30`,
          label: `ไตรมาส 3 ปีงบประมาณ ${beYear} (เม.ย. - มิ.ย. ${beYear})`,
          quarter: 3,
          fiscalYear,
          buddhistYear: beYear,
        };
      case 4:
      default:
        // ไตรมาส 4: 1 ก.ค. - 30 ก.ย.
        return {
          startDate: `${fiscalYear}-07-01`,
          endDate: `${fiscalYear}-09-30`,
          label: `ไตรมาส 4 ปีงบประมาณ ${beYear} (ก.ค. - ก.ย. ${beYear})`,
          quarter: 4,
          fiscalYear,
          buddhistYear: beYear,
        };
    }
  } else {
    // ไตรมาสปีปฏิทิน (Calendar Year: ม.ค. - ธ.ค.)
    const calYear = year || now.getFullYear();
    const beYear = calYear + 543;

    switch (q) {
      case 1:
        return {
          startDate: `${calYear}-01-01`,
          endDate: `${calYear}-03-31`,
          label: `ไตรมาส 1 ปี ${beYear} (ม.ค. - มี.ค.)`,
          quarter: 1,
          year: calYear,
          buddhistYear: beYear,
        };
      case 2:
        return {
          startDate: `${calYear}-04-01`,
          endDate: `${calYear}-06-30`,
          label: `ไตรมาส 2 ปี ${beYear} (เม.ย. - มิ.ย.)`,
          quarter: 2,
          year: calYear,
          buddhistYear: beYear,
        };
      case 3:
        return {
          startDate: `${calYear}-07-01`,
          endDate: `${calYear}-09-30`,
          label: `ไตรมาส 3 ปี ${beYear} (ก.ค. - ก.ย.)`,
          quarter: 3,
          year: calYear,
          buddhistYear: beYear,
        };
      case 4:
      default:
        return {
          startDate: `${calYear}-10-01`,
          endDate: `${calYear}-12-31`,
          label: `ไตรมาส 4 ปี ${beYear} (ต.ค. - ธ.ค.)`,
          quarter: 4,
          year: calYear,
          buddhistYear: beYear,
        };
    }
  }
}

/**
 * คำนวณช่วงวันที่ของปีงบประมาณไทยทั้งปี
 * เช่น ปีงบประมาณ 2569 (2026) -> 2025-10-01 ถึง 2026-09-30
 */
export function getFiscalYearRange(fiscalYear = null) {
  const fy = fiscalYear || getFiscalYear(new Date());
  return {
    startDate: `${fy - 1}-10-01`,
    endDate: `${fy}-09-30`,
    fiscalYear: fy,
    buddhistYear: fy + 543,
    label: `ปีงบประมาณ ${fy + 543} (1 ต.ค. ${fy - 1 + 543} - 30 ก.ย. ${fy + 543})`,
  };
}
