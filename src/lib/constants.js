// Predefined Constants for the Organization Management System

// 1. ตัวเลือกฝ่ายในองค์กร (Predefined Departments)
export const PREDEFINED_DEPARTMENTS = [
  'สำนักงานผู้อำนวยการ',
  'ฝ่ายวิศวกรรมระบบเครือข่าย',
  'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
  'ฝ่ายพัฒนาระบบสารสนเทศ',
  'ฝ่ายเทคโนโลยีสารสนเทศ วิทยาเขตปราจีนบุรี',
  'ฝ่ายเทคโนโลยีสารสนเทศ วิทยาเขตระยอง',
];

// 2. ตัวเลือกประเภทบุคลากร (Personnel Types)
export const PERSONNEL_TYPES = [
  'พนักงานมหาวิทยาลัย',
  'พนักงานพิเศษ',
];

// 3. ตัวเลือกตำแหน่งงาน (Positions)
export const POSITIONS = [
  'ผู้บริหาร',
  'นักวิชาการคอมพิวเตอร์',
  'นักวิชาการพัสดุ',
  'บุคลากร',
  'เจ้าหน้าที่บริหารงานทั่วไป',
  'นักวิเคราะห์นโยบายและแผน',
  'นักวิชาการเงินและบัญชี',
  'วิศวกร',
  'ช่างเครื่องคอมพิวเตอร์',
  'ช่างเทคนิค',
];

// 4. ตัวเลือกระดับตำแหน่ง (Position Levels)
export const POSITION_LEVELS = [
  'ปฏิบัติการ',
  'ชำนาญการ',
  'ชำนาญการพิเศษ',
];

// 5. สถานะบุคลากร (Personnel Status)
export const PERSONNEL_STATUS = {
  ACTIVE: 'ปกติ',
  RESIGNED: 'ลาออก',
};

// 6. สิทธิ์การใช้งาน (Roles)
export const USER_ROLES = {
  ADMIN: 'Admin',
  USER: 'USER',
};

// 7. ตัวเลือกประเภทการลา (Leave Types)
export const LEAVE_TYPES = [
  'ขาด',
  'สาย',
  'ลาป่วย',
  'ลากิจ',
  'ลาพักผ่อน',
  'ลาคลอดบุตร',
  'ลาไปช่วยเหลือภริยาที่คลอดบุตร',
  'ลาป่วยจำเป็น',
];

export const LEAVE_TYPE_CONFIG = {
  'ขาด': {
    label: 'ขาด',
    bg: '#FEE2E2',
    color: '#DC2626',
    border: '#FCA5A5',
    pillBg: '#EF4444',
  },
  'ลาป่วย': {
    label: 'ลาป่วย',
    bg: '#FFE4E6',
    color: '#E11D48',
    border: '#FDA4AF',
    pillBg: '#F43F5E',
  },
  'ลากิจ': {
    label: 'ลากิจ',
    bg: '#E0F2FE',
    color: '#0284C7',
    border: '#BAE6FD',
    pillBg: '#0EA5E9',
  },
  'ลาพักผ่อน': {
    label: 'ลาพักผ่อน',
    bg: '#ECFDF5',
    color: '#059669',
    border: '#A7F3D0',
    pillBg: '#10B981',
  },
  'ลาคลอดบุตร': {
    label: 'ลาคลอดบุตร',
    bg: '#EDE9FE',
    color: '#7C3AED',
    border: '#DDD6FE',
    pillBg: '#8B5CF6',
  },
  'ลาไปช่วยเหลือภริยาที่คลอดบุตร': {
    label: 'ลาไปช่วยเหลือภริยาที่คลอดบุตร',
    bg: '#EEF2FF',
    color: '#4F46E5',
    border: '#C7D2FE',
    pillBg: '#6366F1',
  },
  'ลาป่วยจำเป็น': {
    label: 'ลาป่วยจำเป็น',
    bg: '#FEF3C7',
    color: '#D97706',
    border: '#FDE68A',
    pillBg: '#F59E0B',
  },
};

// 8. ตัวเลือกประเภทใบลงเวลา (Time Attendance Types)
export const TIME_ATTENDANCE_TYPES = [
  'ลงเวลามาปฏิบัติราชการ',
  'ลงเวลากลับปฏิบัติราชการ',
];

// 9. ลำดับขั้นตอนการอนุมัติใบลงเวลา (Time Attendance Workflow Steps)
export const TIME_ATTENDANCE_STEPS = {
  HR_REVIEW: 'HR_REVIEW',                 // 1. รอเจ้าหน้าที่ฝ่ายบุคคลตรวจสอบ
  WITNESS_CONFIRM: 'WITNESS_CONFIRM',     // 2. รอพยานรับรอง
  DEPT_HEAD_APPROVE: 'DEPT_HEAD_APPROVE', // 3. รอหัวหน้าฝ่ายอนุมัติ
  DEPUTY_APPROVE: 'DEPUTY_APPROVE',       // 4. รอรอง ผอ.ฝ่ายบริหาร อนุมัติ
  COMPLETED: 'COMPLETED',                 // อนุมัติสมบูรณ์ (จบกระบวนการ)
  REJECTED: 'REJECTED',                   // ไม่อนุมัติ / ไม่ผ่านการตรวจสอบ
  CANCELLED: 'CANCELLED',                 // ยกเลิกคำขอ (โดยผู้ยื่นคำขอ)
};

export const TIME_ATTENDANCE_STEP_CONFIG = {
  HR_REVIEW: {
    label: 'รอฝ่ายบุคคลตรวจสอบ',
    stepNumber: 1,
    bg: '#FEF3C7',
    color: '#B45309',
    badgeClass: 'badge-warning',
    roleRequired: 'เจ้าหน้าที่ฝ่ายบุคคล',
  },
  WITNESS_CONFIRM: {
    label: 'รอพยานรับรอง',
    stepNumber: 2,
    bg: '#E0E7FF',
    color: '#4338CA',
    badgeClass: 'badge-info',
    roleRequired: 'พยานที่ถูกระบุ',
  },
  DEPT_HEAD_APPROVE: {
    label: 'รอหัวหน้าฝ่ายอนุมัติ',
    stepNumber: 3,
    bg: '#F3E8FF',
    color: '#7E22CE',
    badgeClass: 'badge-primary',
    roleRequired: 'หัวหน้าฝ่าย',
  },
  DEPUTY_APPROVE: {
    label: 'รอรอง ผอ. อนุมัติ',
    stepNumber: 4,
    bg: '#FCE7F3',
    color: '#BE185D',
    badgeClass: 'badge-secondary',
    roleRequired: 'รองผู้อำนวยการฝ่ายบริหาร',
  },
  COMPLETED: {
    label: 'อนุมัติสมบูรณ์',
    stepNumber: 5,
    bg: '#DCFCE7',
    color: '#15803D',
    badgeClass: 'badge-success',
    roleRequired: null,
  },
  REJECTED: {
    label: 'ไม่อนุมัติ',
    stepNumber: 0,
    bg: '#FEE2E2',
    color: '#B91C1C',
    badgeClass: 'badge-danger',
    roleRequired: null,
  },
  CANCELLED: {
    label: 'ยกเลิกคำขอ',
    stepNumber: -1,
    bg: '#F1F5F9',
    color: '#64748B',
    badgeClass: 'badge-resigned',
    roleRequired: null,
  },
};

// 10. การกำหนดระยะเวลาเซสชัน (Session Timeout Configuration)
export const SESSION_TIMEOUT_HOURS = 3;
export const SESSION_TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 hours (10,800,000 ms)



