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

