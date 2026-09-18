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
 * Format any date string or Date object to DD/MM/YYYY in Buddhist Era (พ.ศ.)
 * e.g., '2026-09-08' -> '08/09/2569'
 * e.g., '9/8/2026' -> '08/09/2569'
 */
export function formatDateDDMMYYYYBE(dateInput) {
  if (!dateInput) return '-';

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const d = String(dateInput.getDate()).padStart(2, '0');
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const y = dateInput.getFullYear() < 2400 ? dateInput.getFullYear() + 543 : dateInput.getFullYear();
    return `${d}/${m}/${y}`;
  }

  if (typeof dateInput !== 'string') return String(dateInput);

  const trimmed = dateInput.trim();
  if (!trimmed) return '-';

  // Check if ISO format: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    const beYear = y < 2400 ? y + 543 : y;
    return `${d}/${m}/${beYear}`;
  }

  // Check if slash format: M/D/YYYY or D/M/YYYY or DD/MM/YYYY
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      let p1 = parseInt(parts[0], 10);
      let p2 = parseInt(parts[1], 10);
      let yStr = parts[2].trim().split(' ')[0];
      let y = parseInt(yStr, 10);

      if (!isNaN(p1) && !isNaN(p2) && !isNaN(y)) {
        const beYear = y < 2400 ? y + 543 : y;
        // If first number > 12, it is definitely Day: DD/MM/YYYY
        // If first number <= 12 and second number > 12, first is Month: MM/DD/YYYY
        let d = p1;
        let m = p2;
        if (p1 <= 12 && p2 > 12) {
          d = p2;
          m = p1;
        }
        return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${beYear}`;
      }
    }
  }

  // Check if dash format: DD-MM-YYYY
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      let yStr = parts[2].trim().split(' ')[0];
      let y = parseInt(yStr, 10);
      if (!isNaN(p1) && !isNaN(p2) && !isNaN(y)) {
        const beYear = y < 2400 ? y + 543 : y;
        return `${String(p1).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${beYear}`;
      }
    }
  }

  return trimmed;
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
 * คำนวณปีงบประมาณไทย พ.ศ. (Thai Buddhist Era Fiscal Year) จากวันที่ปัจจุบันหรือวันที่กำหนด
 * เช่น วันที่ 18 ก.ย. 2026 -> 2569, วันที่ 1 ต.ค. 2026 -> 2570
 */
export function getCurrentThaiFiscalYear(date = new Date()) {
  const ceFiscalYear = getFiscalYear(date);
  return ceFiscalYear + 543;
}

/**
 * สร้างรายการปีงบประมาณแบบ Dynamic (พ.ศ.) สำหรับตัวเลือกใน Dropdown อัตโนมัติ
 * รองรับการเลื่อนปีอัตโนมัติเมื่อถึงรอบปีงบประมาณใหม่
 * @param {number} baseStartYear - ปีงบประมาณเริ่มต้นในระบบ (default 2568)
 * @param {number} futureOffset - จำนวนปีงบประมาณล่วงหน้าที่จะแสดง (default 1)
 * @returns {string[]} อาร์เรย์ของปีงบประมาณ เช่น ['2568', '2569', '2570'] และจะขึ้น 2571 อัตโนมัติเมื่อเข้าสู่รอบปี
 */
export function getAvailableFiscalYears(baseStartYear = 2568, futureOffset = 1, descending = false) {
  const currentFiscalYear = getCurrentThaiFiscalYear();
  const maxYear = Math.max(currentFiscalYear + futureOffset, baseStartYear + 2);
  const years = [];
  for (let y = baseStartYear; y <= maxYear; y++) {
    years.push(String(y));
  }
  return descending ? years.reverse() : years;
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

/**
 * Format a Date object to YYYY-MM-DD in local time
 * (Prevents UTC timezone offset day-shift bugs caused by d.toISOString().split('T')[0])
 */
export function formatLocalDate(date = new Date()) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD string into a local Date object at 00:00:00 local time
 * (Avoids UTC midnight parsing of new Date('YYYY-MM-DD') which causes timezone shifts)
 */
export function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

/**
 * Format any time string or Date to 24-hour format (e.g., '18:00 น.' or '08:30 น.')
 * Converts legacy 12-hour AM/PM strings (e.g. '6:00:00 PM' -> '18:00 น.')
 */
export function formatTo24HrTime(timeInput, { includeSeconds = false, includeUnit = true } = {}) {
  if (!timeInput) return '-';

  if (timeInput instanceof Date && !isNaN(timeInput.getTime())) {
    const h = String(timeInput.getHours()).padStart(2, '0');
    const m = String(timeInput.getMinutes()).padStart(2, '0');
    const s = String(timeInput.getSeconds()).padStart(2, '0');
    const secStr = includeSeconds ? `:${s}` : '';
    const unitStr = includeUnit ? ' น.' : '';
    return `${h}:${m}${secStr}${unitStr}`;
  }

  const str = String(timeInput).trim();
  if (!str) return '-';

  // 1. Check for 12-hour AM/PM format (e.g. '6:00:00 PM', '06:30 AM', '6:00 PM')
  const ampmMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)$/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const min = ampmMatch[2];
    const sec = ampmMatch[3] || '00';
    const period = ampmMatch[4].toUpperCase();

    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    const hStr = String(hour).padStart(2, '0');
    const secStr = includeSeconds && ampmMatch[3] ? `:${sec}` : '';
    const unitStr = includeUnit ? ' น.' : '';
    return `${hStr}:${min}${secStr}${unitStr}`;
  }

  // 2. Check for 24-hour format (e.g. '18:00', '18:00:00', '08:30')
  const match24 = str.match(/^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?(?:\s*น\.?)?$/);
  if (match24) {
    const h = String(parseInt(match24[1], 10)).padStart(2, '0');
    const m = match24[2];
    const s = match24[3] || '00';
    const secStr = includeSeconds && match24[3] ? `:${s}` : '';
    const unitStr = includeUnit ? ' น.' : '';
    return `${h}:${m}${secStr}${unitStr}`;
  }

  // 3. Return original with unit if reasonable
  if (includeUnit && !str.includes('น.') && !str.includes('PM') && !str.includes('AM')) {
    return `${str} น.`;
  }

  return str;
}

/**
 * Format Date or ISO string to Thai Date and 24-hour Time
 * Example: '18 ก.ย. 2569, 14:30:00 น.'
 */
export function formatThaiDateTime(input, { includeSeconds = true, shortMonth = true } = {}) {
  if (!input) return '-';
  try {
    const d = typeof input === 'string' ? new Date(input) : input;
    if (!(d instanceof Date) || isNaN(d.getTime())) return String(input);
    const day = d.getDate();
    const month = shortMonth ? THAI_MONTHS_SHORT[d.getMonth()] : THAI_MONTHS_FULL[d.getMonth()];
    const beYear = d.getFullYear() < 2400 ? d.getFullYear() + 543 : d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const timeStr = includeSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
    return `${day} ${month} ${beYear}, ${timeStr} น.`;
  } catch (e) {
    return String(input);
  }
}


