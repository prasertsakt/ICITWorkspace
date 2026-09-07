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
