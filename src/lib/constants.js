// Predefined Constants for the Organization Management System

// 1. ตัวเลือกฝ่ายในองค์กร (Predefined Departments)
export const PREDEFINED_DEPARTMENTS = [
  'คณะผู้บริหาร',
  'สำนักงานผู้อำนวยการ',
  'ฝ่ายวิศวกรรมระบบเครือข่าย',
  'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
  'ฝ่ายพัฒนาระบบสารสนเทศ',
  'ฝ่ายเทคโนโลยีสารสนเทศ วิทยาเขตปราจีนบุรี',
  'ฝ่ายเทคโนโลยีสารสนเทศ วิทยาเขตระยอง',
];

// 1.1 ตัวเลือก 6 ฝ่ายหลักสำหรับระบบ IDP Hub (MAIN_6_DEPTS)
export const MAIN_6_DEPTS = [
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
  'อื่น ๆ',
];

export const LEAVE_TYPE_CONFIG = {
  'ขาด': {
    label: 'ขาด',
    bg: '#FEE2E2',
    color: '#DC2626',
    border: '#FCA5A5',
    pillBg: '#EF4444',
  },
  'สาย': {
    label: 'สาย',
    bg: '#E0F2FE',
    color: '#0284C7',
    border: '#BAE6FD',
    pillBg: '#0EA5E9',
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
  'อื่น ๆ': {
    label: 'อื่น ๆ',
    bg: '#F1F5F9',
    color: '#475569',
    border: '#CBD5E1',
    pillBg: '#64748B',
  },
  'อื่นๆ': {
    label: 'อื่น ๆ',
    bg: '#F1F5F9',
    color: '#475569',
    border: '#CBD5E1',
    pillBg: '#64748B',
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

// 11. รายการการ์ดบริการและระบบสารสนเทศเริ่มต้น (Default Portal Services)
export const DEFAULT_PORTAL_SERVICES = [
  {
    id: 'org',
    title: 'โครงสร้างองค์กรและทำเนียบบุคลากร',
    desc: 'ผังโครงสร้าง 6 ฝ่ายงานหลัก คณะฝ่ายบริหาร และทำเนียบบุคลากรพร้อมระบบค้นหาและตัวกรอง',
    href: '/organization',
    openInNewTab: false,
    iconType: 'lucide',
    iconName: 'Building2',
    iconImageUrl: '',
    colorTheme: 'primary',
    badgeText: 'เปิดให้บริการ',
    badgeType: 'active',
    footerLeft: '6 ฝ่าย • บุคลากรในสังกัด',
    footerRightText: 'เข้าใช้งาน',
  },
  {
    id: 'profile',
    title: 'ข้อมูลของฉัน (Personal Profile)',
    desc: 'บัตรประจำตัวดิจิทัล คำนวณอายุงาน นับถอยหลังวันเกษียณราชการ และสายการบังคับบัญชา',
    href: '/profile',
    openInNewTab: false,
    iconType: 'lucide',
    iconName: 'UserCheck',
    iconImageUrl: '',
    colorTheme: 'mint',
    badgeText: 'ข้อมูลส่วนบุคคล',
    badgeType: 'user',
    footerLeft: 'ข้อมูลส่วนตัวและสิทธิประโยชน์',
    footerRightText: 'เข้าใช้งาน',
  },
  {
    id: 'attendance',
    title: 'ระบบขอลงเวลา',
    desc: 'ยื่นคำขอลงเวลามา/กลับปฏิบัติราชการ กระบวนการอนุมัติ 4 ขั้นตอน พร้อมระบบแจ้งเตือนทางอีเมล',
    href: '/time-attendance',
    openInNewTab: false,
    iconType: 'lucide',
    iconName: 'Clock',
    iconImageUrl: '',
    colorTheme: 'indigo',
    badgeText: 'เปิดให้บริการ',
    badgeType: 'active',
    footerLeft: 'คลิกเพื่อเข้าสู่ระบบใบลงเวลา',
    footerRightText: 'เข้าใช้งาน',
  },
  {
    id: 'leave',
    title: 'ปฏิทินวันลา (Leave Calendar)',
    desc: 'แดชบอร์ดสรุปสถิติและปฏิทินแสดงวันลาป่วย ลากิจ ลาพักผ่อน และขาดงานของบุคลากร',
    href: '/leave',
    openInNewTab: false,
    iconType: 'lucide',
    iconName: 'Calendar',
    iconImageUrl: '',
    colorTheme: 'peach',
    badgeText: 'เปิดให้บริการ',
    badgeType: 'active',
    footerLeft: 'คลิกเพื่อดูปฏิทินวันลา',
    footerRightText: 'เข้าใช้งาน',
  },
  {
    id: 'jd-hub',
    title: 'ศูนย์จัดการลักษณะงาน (JD Hub)',
    desc: 'แบบบรรยายลักษณะงาน (Job Description) ตามมาตรฐาน มจพ. ตรวจสอบ ปรับปรุง และยืนยันข้อมูล',
    href: '/jd-hub',
    openInNewTab: false,
    iconType: 'lucide',
    iconName: 'FileText',
    iconImageUrl: '',
    colorTheme: 'teal',
    badgeText: 'ต้องเข้าสู่ระบบ',
    badgeType: 'user',
    footerLeft: 'แบบบรรยายลักษณะงาน (Job Description)',
    footerRightText: 'เข้าใช้งาน',
  },
  {
    id: 'ims',
    title: 'ระบบบริหารงาน IMS',
    desc: 'ระบบบริหารจัดการมาตรฐานแบบบูรณาการ (ISO 9001 / ISO 27001) รายงานการตรวจติดตามภายใน และ CAR & Incident Hub',
    href: '/ims',
    openInNewTab: false,
    iconType: 'lucide',
    iconName: 'ShieldCheck',
    iconImageUrl: '',
    colorTheme: 'teal',
    badgeText: 'ต้องเข้าสู่ระบบ',
    badgeType: 'user',
    footerLeft: 'ISO 9001 & ISO/IEC 27001',
    footerRightText: 'เข้าใช้งาน',
  },
  {
    id: 'idp-hub',
    title: 'ระบบพัฒนาบุคลากร (IDP Hub)',
    desc: 'แบบวิเคราะห์ความต้องการจำเป็นเพื่อจัดทำแผนพัฒนาบุคลากรรายบุคคล (Individual Development Plan)',
    href: '/idp-hub',
    openInNewTab: false,
    iconType: 'lucide',
    iconName: 'Target',
    iconImageUrl: '',
    colorTheme: 'orange',
    badgeText: 'ต้องเข้าสู่ระบบ',
    badgeType: 'user',
    footerLeft: 'แผนพัฒนาบุคลากรรายบุคคล (IDP)',
    footerRightText: 'เข้าใช้งาน',
  },
  {
    id: 'knowledge',
    title: 'ICIT Personal Knowledge Map',
    desc: 'แผนที่องค์ความรู้และทักษะความเชี่ยวชาญเฉพาะบุคคลของบุคลากรภายในสำนัก',
    href: 'https://script.google.com/macros/s/AKfycbzRNmWQ9gDvjPvV-Grx-7B3WK54dd-J7q6LiIYeuqSAXMLNOepAPof1ofRMSCikx2BK/exec',
    openInNewTab: true,
    iconType: 'lucide',
    iconName: 'BookOpen',
    iconImageUrl: '',
    colorTheme: 'violet',
    badgeText: 'เปิดให้บริการ',
    badgeType: 'active',
    footerLeft: 'ไม่ต้องเข้าสู่ระบบ • แหล่งข้อมูลภายนอก',
    footerRightText: 'เปิดใช้งาน',
  },
  {
    id: 'survey',
    title: 'แบบสำรวจปัจจัยความผูกพันของบุคลากร',
    desc: 'แบบประเมินและสำรวจความคิดเห็นเพื่อเสริมสร้างความผูกพันและความสุขในการทำงานของบุคลากร',
    href: 'https://script.google.com/macros/s/AKfycbwOb1JYVMKCOhvh4HS5br-VXF-AG-QWDoFMYQvjeZbwBe7CbgDUzkGc7_EEDE6JAaH5JA/exec',
    openInNewTab: true,
    iconType: 'lucide',
    iconName: 'HeartHandshake',
    iconImageUrl: '',
    colorTheme: 'pink',
    badgeText: 'เปิดให้บริการ',
    badgeType: 'active',
    footerLeft: 'ไม่ต้องเข้าสู่ระบบ • แหล่งข้อมูลภายนอก',
    footerRightText: 'เปิดใช้งาน',
  },
];

// 12. ธีมสีสำหรับการ์ดบริการ (Color Theme Presets)
export const PORTAL_COLOR_THEMES = {
  primary: {
    label: 'น้ำเงิน ICIT (Primary)',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  indigo: {
    label: 'ครามเข้ม (Indigo)',
    iconBg: '#E0E7FF',
    iconColor: '#4338CA',
    borderColor: '#4338CA',
  },
  mint: {
    label: 'เขียวมิ้นต์ (Mint / Emerald)',
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
    borderColor: '#10B981',
  },
  peach: {
    label: 'ส้มพีช (Peach / Amber)',
    iconBg: '#FFF7ED',
    iconColor: '#F97316',
    borderColor: '#F97316',
  },
  violet: {
    label: 'ม่วงลาเวนเดอร์ (Violet)',
    iconBg: '#EDE9FE',
    iconColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  pink: {
    label: 'ชมพูกุหลาบ (Pink / Rose)',
    iconBg: '#FCE7F3',
    iconColor: '#EC4899',
    borderColor: '#EC4899',
  },
  sky: {
    label: 'ฟ้าคราม (Sky Blue)',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    borderColor: '#0284C7',
  },
  teal: {
    label: 'เขียวน้ำทะเล (Teal)',
    iconBg: '#CCFBF1',
    iconColor: '#0D9488',
    borderColor: '#0D9488',
  },
  dark: {
    label: 'เทาเข้ม (Slate Dark)',
    iconBg: '#F1F5F9',
    iconColor: '#334155',
    borderColor: '#334155',
  },
};

// 13. รายการไอคอนมาตรฐานให้เลือก (Available Lucide Icons)
export const PORTAL_AVAILABLE_ICONS = [
  { name: 'Building2', label: 'อาคาร / องค์กร' },
  { name: 'UserCheck', label: 'โปรไฟล์ / บุคลากร' },
  { name: 'Clock', label: 'เวลา / ลงเวลา' },
  { name: 'Calendar', label: 'ปฏิทิน / วันลา' },
  { name: 'BookOpen', label: 'หนังสือ / ความรู้' },
  { name: 'HeartHandshake', label: 'หัวใจ / ความผูกพัน' },
  { name: 'Laptop', label: 'คอมพิวเตอร์ / ระบบ' },
  { name: 'FileText', label: 'เอกสาร / รายงาน' },
  { name: 'Layers', label: 'ชั้นงาน / หมวดหมู่' },
  { name: 'Globe', label: 'เว็บไซต์ / อินเทอร์เน็ต' },
  { name: 'Sparkles', label: 'ประกาย / นวัตกรรม' },
  { name: 'ShieldCheck', label: 'ความปลอดภัย / สิทธิ์' },
  { name: 'Wrench', label: 'เครื่องมือ / ปรับแต่ง' },
  { name: 'Database', label: 'ฐานข้อมูล / เซิร์ฟเวอร์' },
  { name: 'Send', label: 'ส่งงาน / การสื่อสาร' },
  { name: 'HelpCircle', label: 'ช่วยเหลือ / คำแนะนำ' },
  { name: 'Award', label: 'รางวัล / ความสำเร็จ' },
  { name: 'Bell', label: 'การแจ้งเตือน' },
  { name: 'Share2', label: 'การเชื่อมต่อ' },
  { name: 'Briefcase', label: 'งาน / ธุรกิจ' },
];

// 14. มาตรฐาน IMS (Integrated Management System Standards)
export const IMS_STANDARDS = [
  'IMS 9001/27001',
  'ISO 9001:2015',
  'ISO/IEC 27001:2022',
];

// 15. หัวข้อที่รับการตรวจ (Predefined Audit Topics - 23 items)
export const IMS_AUDIT_TOPICS = [
  'Management processes',
  'Document and record control',
  'Client computer management, Office areas',
  'Risk and opportunity, Information security risk assessment and treatement, SoA',
  'Internal and external communication, Internal audit and follow-up, Corrective action and improvement, Compliance management',
  'Facility management and Physical security management (Data center)',
  'Network and security management, Outsource control',
  'Service design and development, Service changes and improvement',
  'Server management, Outsource control',
  'HR and training',
  'Purchasing',
  'Training',
  'Data & APIs',
  'Software license',
  'IT clinic',
  'Web hosting, Virtual Private Server',
  'ICIT account',
  'Computer lab & rooms มจพ กรุงเทพ',
  'Computer lab & rooms มจพ.ระยอง',
  'Computer lab & rooms มจพ.ปราจีนบุรี',
  'PC maintenance for the Office of President มจพ กรุงเทพ',
  'PC maintenance for the Office of President มจพ.ระยอง',
  'PC maintenance for the Office of President มจพ.ปราจีนบุรี',
];

// 16. ประเภทความไม่สอดคล้อง / ผลการตรวจ (Audit Result Types)
export const IMS_RESULT_TYPES = {
  C: {
    code: 'C',
    label: 'C - Conformity (สอดคล้องตามข้อกำหนด)',
    shortLabel: 'C (Conformity)',
    desc: 'การปฏิบัติงานสอดคล้องตามเกณฑ์และข้อกำหนดมาตรฐาน',
    bg: '#ECFDF5',
    color: '#059669',
    border: '#A7F3D0',
    badgeBg: '#10B981',
    badgeText: '#FFFFFF',
  },
  NC: {
    code: 'NC',
    label: 'NC - Non-Conformity (ไม่สอดคล้องตามข้อกำหนด)',
    shortLabel: 'NC (Non-Conformity)',
    desc: 'ไม่สอดคล้องตามข้อกำหนดมาตรฐาน ต้องดำเนินการแก้ไข (CAR)',
    bg: '#FEF2F2',
    color: '#DC2626',
    border: '#FECACA',
    badgeBg: '#EF4444',
    badgeText: '#FFFFFF',
  },
  OFI: {
    code: 'OFI',
    label: 'OFI - Opportunity for Improvement (ข้อสังเกต / โอกาสในการปรับปรุง)',
    shortLabel: 'OFI (Opportunity for Improvement)',
    desc: 'ข้อเสนอแนะหรือโอกาสเพื่อพัฒนาและปรับปรุงประสิทธิภาพกระบวนการ',
    bg: '#FFFBEB',
    color: '#D97706',
    border: '#FDE68A',
    badgeBg: '#F59E0B',
    badgeText: '#FFFFFF',
  },
};

// 17. สถานะรายงานการตรวจติดตาม (IMS Audit Workflow Statuses)
export const IMS_AUDIT_STATUSES = {
  PENDING_LEAD_APPROVAL: {
    key: 'PENDING_LEAD_APPROVAL',
    label: 'รอ Lead IA อนุมัติแผน',
    badgeBg: '#FEF3C7',
    color: '#92400E',
    border: '#FDE68A',
  },
  RETURNED_FOR_REVISION: {
    key: 'RETURNED_FOR_REVISION',
    label: 'ส่งกลับเพื่อแก้ไขแผนตรวจ',
    badgeBg: '#FEE2E2',
    color: '#B91C1C',
    border: '#FCA5A5',
  },
  READY_FOR_AUDIT: {
    key: 'READY_FOR_AUDIT',
    label: 'อนุมัติแล้ว / พร้อมเข้าตรวจ',
    badgeBg: '#DBEAFE',
    color: '#1E40AF',
    border: '#BFDBFE',
  },
  COMPLETED: {
    key: 'COMPLETED',
    label: 'ตรวจเสร็จสิ้นแล้ว',
    badgeBg: '#D1FAE5',
    color: '#065F46',
    border: '#A7F3D0',
  },
};

// 18. สถานะแบบวิเคราะห์แผนพัฒนาบุคลากรรายบุคคล (IDP Workflow Statuses)
export const IDP_STATUSES = {
  DRAFT: {
    key: 'DRAFT',
    label: 'ฉบับร่าง / รอดำเนินการ',
    shortLabel: 'ฉบับร่าง',
    color: '#64748B',
    bg: '#F8FAFC',
    border: '#CBD5E1',
    badgeBg: '#94A3B8',
  },
  SELF_EVALUATED: {
    key: 'SELF_EVALUATED',
    label: 'ประเมินตนเองแล้ว (รอหัวหน้า/รองฯ ประเมิน)',
    shortLabel: 'ประเมินตนเองแล้ว',
    color: '#0369A1',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    badgeBg: '#0284C7',
  },
  SUPERVISOR_EVALUATED: {
    key: 'SUPERVISOR_EVALUATED',
    label: 'หัวหน้าประเมินแล้ว (รอลงนามครบ)',
    shortLabel: 'หัวหน้าประเมินแล้ว',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    badgeBg: '#F59E0B',
  },
  COMPLETED: {
    key: 'COMPLETED',
    label: 'ประเมินและลงนามเสร็จสมบูรณ์',
    shortLabel: 'เสร็จสมบูรณ์',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    badgeBg: '#10B981',
  },
};

// 19. สมรรถนะหลักมาตรฐาน มจพ. (Default Core Competencies)
export const DEFAULT_IDP_CORE_COMPETENCIES = [
  { id: 'core-1', title: 'ความใฝ่เรียนรู้', weight: 20, expectedLevel: 3 },
  { id: 'core-2', title: 'คุณธรรมและความซื่อสัตย์', weight: 20, expectedLevel: 5 },
  { id: 'core-3', title: 'ความมุ่งมั่นให้เกิดผลสำเร็จของงาน', weight: 15, expectedLevel: 3 },
  { id: 'core-4', title: 'การทำงานเป็นทีม', weight: 15, expectedLevel: 3 },
  { id: 'core-5', title: 'จิตสำนึกองค์กร', weight: 15, expectedLevel: 3 },
  { id: 'core-6', title: 'การพัฒนางานอย่างต่อเนื่อง', weight: 15, expectedLevel: 3 },
];

// 20. สมรรถนะตามตำแหน่งงานมาตรฐาน (Default Functional Competencies by Position)
export const DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_BY_POSITION = {
  'บุคลากร': [
    { id: 'func-1', title: 'ความรู้ด้านการบริหารทรัพยากรบุคคล', weight: 20, expectedLevel: 3 },
    { id: 'func-2', title: 'ความรู้เรื่องกฎและระเบียบที่เกี่ยวข้องกับงาน', weight: 20, expectedLevel: 3 },
    { id: 'func-3', title: 'การสื่อสารและให้คำปรึกษา', weight: 15, expectedLevel: 2 },
    { id: 'func-4', title: 'ด้านประสานงาน', weight: 15, expectedLevel: 3 },
    { id: 'func-5', title: 'ความละเอียดรอบคอบและความถูกต้องของงาน', weight: 15, expectedLevel: 3 },
    { id: 'func-6', title: 'การมีจิตบริการ', weight: 15, expectedLevel: 3 },
  ],
  'นักวิชาการคอมพิวเตอร์': [
    { id: 'func-1', title: 'ความรู้และทักษะด้านการพัฒนาระบบและเทคโนโลยีดิจิทัล', weight: 20, expectedLevel: 3 },
    { id: 'func-2', title: 'การดูแลและบริหารจัดการระบบสารสนเทศและความมั่นคงปลอดภัย', weight: 20, expectedLevel: 3 },
    { id: 'func-3', title: 'การวิเคราะห์และแก้ไขปัญหาทางเทคนิค (Troubleshooting)', weight: 15, expectedLevel: 3 },
    { id: 'func-4', title: 'การบริหารจัดการโครงการและการประสานงานทางเทคนิค', weight: 15, expectedLevel: 3 },
    { id: 'func-5', title: 'การถ่ายทอดองค์ความรู้และให้คำปรึกษาด้านไอที', weight: 15, expectedLevel: 3 },
    { id: 'func-6', title: 'การมีจิตบริการและการสนับสนุนผู้ใช้งาน', weight: 15, expectedLevel: 3 },
  ],
  'นักวิชาการพัสดุ': [
    { id: 'func-1', title: 'ความรู้กฎหมายระเบียบการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ', weight: 25, expectedLevel: 3 },
    { id: 'func-2', title: 'การบริหารจัดการสัญญาและการตรวจรับพัสดุ', weight: 20, expectedLevel: 3 },
    { id: 'func-3', title: 'การควบคุมและตรวจนับทรัพย์สิน/ครุภัณฑ์', weight: 15, expectedLevel: 3 },
    { id: 'func-4', title: 'การประสานงานและการเจรจาต่อรอง', weight: 15, expectedLevel: 3 },
    { id: 'func-5', title: 'ความถูกต้องแม่นยำและการตรวจสอบเอกสาร', weight: 15, expectedLevel: 3 },
    { id: 'func-6', title: 'การมีจิตบริการและการสื่อสารประสานงาน', weight: 10, expectedLevel: 3 },
  ],
  'เจ้าหน้าที่บริหารงานทั่วไป': [
    { id: 'func-1', title: 'งานสารบรรณและการจัดการเอกสารทางราชการ', weight: 25, expectedLevel: 3 },
    { id: 'func-2', title: 'การประสานงานและการจัดประชุม', weight: 20, expectedLevel: 3 },
    { id: 'func-3', title: 'การบริหารจัดการงานสำนักงานและอาคารสถานที่', weight: 15, expectedLevel: 3 },
    { id: 'func-4', title: 'การสื่อสารและการประชาสัมพันธ์ภายในองค์กร', weight: 15, expectedLevel: 3 },
    { id: 'func-5', title: 'ความละเอียดรอบคอบในการจัดทำเอกสาร', weight: 15, expectedLevel: 3 },
    { id: 'func-6', title: 'การมีจิตบริการและความร่วมมือในงาน', weight: 10, expectedLevel: 3 },
  ],
  'นักวิเคราะห์นโยบายและแผน': [
    { id: 'func-1', title: 'การจัดทำแผนยุทธศาสตร์และแผนปฏิบัติการประจำปี', weight: 25, expectedLevel: 3 },
    { id: 'func-2', title: 'การติดตาม ประเมินผล และรายงานผลการดำเนินงาน', weight: 20, expectedLevel: 3 },
    { id: 'func-3', title: 'การวิเคราะห์ข้อมูลและสารสนเทศเชิงยุทธศาสตร์', weight: 20, expectedLevel: 3 },
    { id: 'func-4', title: 'การบริหารความเสี่ยงและการควบคุมภายใน', weight: 15, expectedLevel: 3 },
    { id: 'func-5', title: 'การประสานงานและการขับเคลื่อนโครงการ', weight: 10, expectedLevel: 3 },
    { id: 'func-6', title: 'การนำเสนอข้อมูลและการสื่อสารเชิงกลยุทธ์', weight: 10, expectedLevel: 3 },
  ],
  'นักวิชาการเงินและบัญชี': [
    { id: 'func-1', title: 'ความรู้ด้านระเบียบการเงิน การเบิกจ่าย และระบบบัญชีภาครัฐ', weight: 25, expectedLevel: 3 },
    { id: 'func-2', title: 'การตรวจสอบความถูกต้องของเอกสารหลักฐานทางการเงิน', weight: 20, expectedLevel: 3 },
    { id: 'func-3', title: 'การจัดทำรายงานทางการเงินและการบริหารงบประมาณ', weight: 20, expectedLevel: 3 },
    { id: 'func-4', title: 'การใช้ระบบสารสนเทศทางการเงินและบัญชี', weight: 15, expectedLevel: 3 },
    { id: 'func-5', title: 'ความซื่อสัตย์สุจริตและความละเอียดรอบคอบ', weight: 10, expectedLevel: 3 },
    { id: 'func-6', title: 'การมีจิตบริการและการให้คำปรึกษาด้านการเบิกจ่าย', weight: 10, expectedLevel: 3 },
  ],
  'วิศวกร': [
    { id: 'func-1', title: 'ความรู้ทางวิศวกรรมและการออกแบบระบบเครือข่าย/โครงสร้างพื้นฐาน', weight: 25, expectedLevel: 3 },
    { id: 'func-2', title: 'การบริหารจัดการและบำรุงรักษาเชิงป้องกัน (Preventive Maintenance)', weight: 20, expectedLevel: 3 },
    { id: 'func-3', title: 'การวิเคราะห์และแก้ไขปัญหาทางวิศวกรรมขั้นสูง', weight: 20, expectedLevel: 3 },
    { id: 'func-4', title: 'ความปลอดภัยในการปฏิบัติงานและมาตรฐานทางวิศวกรรม', weight: 15, expectedLevel: 3 },
    { id: 'func-5', title: 'การบริหารโครงการและการควบคุมงาน', weight: 10, expectedLevel: 3 },
    { id: 'func-6', title: 'การทำงานเป็นทีมและการถ่ายทอดองค์ความรู้', weight: 10, expectedLevel: 3 },
  ],
  'ช่างเครื่องคอมพิวเตอร์': [
    { id: 'func-1', title: 'การซ่อมบำรุงและตรวจเช็คอุปกรณ์คอมพิวเตอร์และโสตทัศนูปกรณ์', weight: 25, expectedLevel: 3 },
    { id: 'func-2', title: 'การติดตั้งระบบปฏิบัติการ ซอฟต์แวร์ และการเชื่อมต่อเครือข่าย', weight: 20, expectedLevel: 3 },
    { id: 'func-3', title: 'การแก้ไขปัญหาเฉพาะหน้าและการให้บริการหน้างาน (On-site Support)', weight: 20, expectedLevel: 3 },
    { id: 'func-4', title: 'การดูแลรักษาระบบห้องปฏิบัติการคอมพิวเตอร์', weight: 15, expectedLevel: 3 },
    { id: 'func-5', title: 'ความปลอดภัยในการใช้อุปกรณ์ไฟฟ้าและอิเล็กทรอนิกส์', weight: 10, expectedLevel: 3 },
    { id: 'func-6', title: 'การมีจิตบริการและมนุษยสัมพันธ์ที่ดี', weight: 10, expectedLevel: 3 },
  ],
  'ช่างเทคนิค': [
    { id: 'func-1', title: 'การซ่อมบำรุงและตรวจเช็คอุปกรณ์คอมพิวเตอร์และระบบอาคาร', weight: 25, expectedLevel: 3 },
    { id: 'func-2', title: 'การติดตั้งระบบสายสัญญาณและอุปกรณ์เครือข่าย', weight: 20, expectedLevel: 3 },
    { id: 'func-3', title: 'การแก้ไขปัญหาเฉพาะหน้าและการให้บริการหน้างาน', weight: 20, expectedLevel: 3 },
    { id: 'func-4', title: 'การดูแลรักษาเครื่องมือและอุปกรณ์ประจำห้องปฏิบัติการ', weight: 15, expectedLevel: 3 },
    { id: 'func-5', title: 'ความปลอดภัยในการทำงานและมาตรฐานการซ่อมบำรุง', weight: 10, expectedLevel: 3 },
    { id: 'func-6', title: 'การมีจิตบริการและการประสานงาน', weight: 10, expectedLevel: 3 },
  ],
  'ผู้บริหาร': [
    { id: 'func-1', title: 'ภาวะผู้นำและการบริหารจัดการเชิงยุทธศาสตร์', weight: 25, expectedLevel: 4 },
    { id: 'func-2', title: 'การบริหารทรัพยากรบุคคลและการพัฒนาองค์กร', weight: 20, expectedLevel: 4 },
    { id: 'func-3', title: 'การตัดสินใจและการแก้ไขปัญหาเชิงบริหาร', weight: 20, expectedLevel: 4 },
    { id: 'func-4', title: 'การบริหารงบประมาณและความคุ้มค่า', weight: 15, expectedLevel: 4 },
    { id: 'func-5', title: 'การขับเคลื่อนนวัตกรรมและการเปลี่ยนแปลงองค์กร', weight: 10, expectedLevel: 4 },
    { id: 'func-6', title: 'ธรรมาภิบาลและความรับผิดชอบต่อสังคม', weight: 10, expectedLevel: 4 },
  ],
};

// Default Functional Competency template fallback
export const DEFAULT_IDP_FUNCTIONAL_COMPETENCIES_GENERAL = [
  { id: 'func-1', title: 'ความรู้ความเชี่ยวชาญเฉพาะด้านตามตำแหน่งงาน', weight: 25, expectedLevel: 3 },
  { id: 'func-2', title: 'ความรู้เรื่องกฎ ระเบียบ และแนวปฏิบัติตามสายงาน', weight: 20, expectedLevel: 3 },
  { id: 'func-3', title: 'การสื่อสาร การให้คำปรึกษา และการประสานงาน', weight: 15, expectedLevel: 3 },
  { id: 'func-4', title: 'การแก้ไขปัญหาและการปรับปรุงกระบวนการทำงาน', weight: 15, expectedLevel: 3 },
  { id: 'func-5', title: 'ความถูกต้องแม่นยำและความรับผิดชอบในงาน', weight: 15, expectedLevel: 3 },
  { id: 'func-6', title: 'การมีจิตบริการและการทำงานเชิงรุก', weight: 10, expectedLevel: 3 },
];
