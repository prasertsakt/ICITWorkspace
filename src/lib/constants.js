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
    desc: 'ระบบบริหารจัดการมาตรฐานแบบบูรณาการ (ISO 9001 / ISO 27001) รายงานการตรวจติดตามภายใน, OFI Hub และ CAR & Incident Hub',
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
    id: 'tqa',
    title: 'ระบบบริหารงาน TQA',
    desc: 'ระบบติดตามโอกาสในการปรับปรุง TQA OFI Tracking (หมวด 1-7), การจัดการรายงานป้อนกลับ และรายงานผลการดำเนินงาน',
    href: '/tqa',
    openInNewTab: false,
    iconType: 'lucide',
    iconName: 'Award',
    iconImageUrl: '',
    colorTheme: 'violet',
    badgeText: 'ต้องเข้าสู่ระบบ',
    badgeType: 'user',
    footerLeft: 'Thailand Quality Award (TQA)',
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
    id: 'skill-map',
    title: 'Knowledge & Skill Map',
    desc: 'แผนที่ความรู้และทักษะบุคลากร ประเมินตนเองตามโครงสร้าง 3 ระดับ พร้อม Spider Radar Chart และ AI วิเคราะห์ศักยภาพ',
    href: '/idp-hub/skill-map',
    openInNewTab: false,
    iconType: 'lucide',
    iconName: 'Compass',
    iconImageUrl: '',
    colorTheme: 'blue',
    badgeText: 'ต้องเข้าสู่ระบบ',
    badgeType: 'user',
    footerLeft: 'ส่วนหนึ่งของระบบ IDP Hub',
    footerRightText: 'เข้าใช้งาน',
  },
  {
    id: 'km-hub',
    title: 'จัดเก็บ-ติดตามองค์ความรู้บุคลากร',
    desc: 'ระบบบันทึกและติดตามการแบ่งปันองค์ความรู้จากการฝึกอบรม-สัมมนาของบุคลากร แจ้งเตือนการแบ่งปันความรู้ภายใน 2 เดือนและทุก ๆ 15 วัน',
    href: '/km-hub',
    openInNewTab: false,
    iconType: 'lucide',
    iconName: 'BookOpen',
    iconImageUrl: '',
    colorTheme: 'mint',
    badgeText: 'ต้องเข้าสู่ระบบ',
    badgeType: 'user',
    footerLeft: 'Knowledge Management & Tracking (KM)',
    footerRightText: 'เข้าใช้งาน',
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
  { name: 'Compass', label: 'เข็มทิศ / Skill Map' },
  { name: 'Target', label: 'เป้าหมาย / IDP Hub' },
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

// 19. สมรรถนะหลักมาตรฐาน มจพ. (Default Core Competencies with Level Expectations)
export const DEFAULT_IDP_CORE_COMPETENCIES = [
  {
    id: 'core-1',
    title: 'ความใฝ่เรียนรู้',
    weight: 20,
    expectedLevel: 3,
    expectedLevels: {
      'ปฏิบัติการ': 3,
      'ชำนาญการ': 4,
      'ชำนาญการพิเศษ': 4,
    },
  },
  {
    id: 'core-2',
    title: 'คุณธรรมและความซื่อสัตย์',
    weight: 20,
    expectedLevel: 5,
    expectedLevels: {
      'ปฏิบัติการ': 5,
      'ชำนาญการ': 5,
      'ชำนาญการพิเศษ': 5,
    },
  },
  {
    id: 'core-3',
    title: 'ความมุ่งมั่นให้เกิดผลสำเร็จของงาน',
    weight: 15,
    expectedLevel: 3,
    expectedLevels: {
      'ปฏิบัติการ': 3,
      'ชำนาญการ': 4,
      'ชำนาญการพิเศษ': 4,
    },
  },
  {
    id: 'core-4',
    title: 'การทำงานเป็นทีม',
    weight: 15,
    expectedLevel: 3,
    expectedLevels: {
      'ปฏิบัติการ': 3,
      'ชำนาญการ': 4,
      'ชำนาญการพิเศษ': 4,
    },
  },
  {
    id: 'core-5',
    title: 'จิตสำนึกองค์กร',
    weight: 15,
    expectedLevel: 3,
    expectedLevels: {
      'ปฏิบัติการ': 3,
      'ชำนาญการ': 4,
      'ชำนาญการพิเศษ': 4,
    },
  },
  {
    id: 'core-6',
    title: 'การพัฒนางานอย่างต่อเนื่อง',
    weight: 15,
    expectedLevel: 3,
    expectedLevels: {
      'ปฏิบัติการ': 3,
      'ชำนาญการ': 4,
      'ชำนาญการพิเศษ': 4,
    },
  },
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

// ==========================================
// 8. แผนกลยุทธ์และประเด็นยุทธศาสตร์ (Strategic Framework Config - 2569-2572)
// ==========================================
export const DEFAULT_IDP_STRATEGY_CONFIG_2569 = {
  fiscalYear: '2569',
  title: 'แผนกลยุทธ์สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ สู่ความเป็นเลิศ พ.ศ. 2569-2572',
  approvalMeeting: 'มติที่ประชุมคณะกรรมการบริหารฯ ครั้งที่ 7/2568',
  
  // 1. Vision & CKPI
  vision: 'สร้างสรรค์ Digital Lifestyle ในรั้ว มจพ.',
  visionMeaning: {
    create: 'การออกแบบหรือพัฒนาเทคโนโลยีสารสนเทศสมัยใหม่ และเหมาะสมกับมหาวิทยาลัยในปัจจุบัน เพื่อรองรับการเรียนรู้และการทำงานหรือกิจกรรมให้มีประสิทธิภาพมากขึ้น',
    lifestyle: 'การใช้ชีวิตที่ขับเคลื่อนด้วยเทคโนโลยีดิจิทัลของสำนักคอมพิวเตอร์ฯ ที่สามารถตอบสนองต่อความต้องการของนักศึกษา บุคลากร และคณาจารย์ได้อย่างรวดเร็วและมีประสิทธิภาพ',
  },
  ckpis: [
    { id: 'ckpi-1', code: 'CKPI 1', name: 'ความผูกพันของผู้ใช้บริการที่มีต่อ Digital Lifestyle' },
    { id: 'ckpi-2', code: 'CKPI 2', name: 'Digital Maturity Assessment' },
    { id: 'ckpi-3', code: 'CKPI 3', name: 'TQC (Thailand Quality Class / เกณฑ์ EdPEx)' },
  ],
  corePurpose: 'สร้างสรรค์ Digital Lifestyle ที่ทันสมัย',
  coreCompetencies: [
    { id: 'cc-1', code: 'CC1', name: 'โครงสร้างพื้นฐานภายในมหาวิทยาลัย' },
    { id: 'cc-2', code: 'CC2', name: 'ระบบสารสนเทศภายในมหาวิทยาลัย' },
    { id: 'cc-3', code: 'CC3', name: 'เป็นศูนย์กลางการให้บริการระบบงานสารสนเทศที่สำคัญแก่บุคลากร นักศึกษา' },
  ],
  missions: [
    { id: 'm-1', num: '01', title: 'พัฒนาโครงสร้างพื้นฐานระบบเทคโนโลยีสารสนเทศและการสื่อสารทางดิจิทัลของมหาวิทยาลัย' },
    { id: 'm-2', num: '02', title: 'พัฒนาระบบเทคโนโลยีสารสนเทศเพื่อสนับสนุนการบริหารจัดการงานของมหาวิทยาลัย' },
    { id: 'm-3', num: '03', title: 'บริการเทคโนโลยีสารสนเทศเพื่อสนับสนุนการเรียนการสอน การค้นคว้าวิจัย และการปฏิบัติงานในมหาวิทยาลัย' },
    { id: 'm-4', num: '04', title: 'บริการวิชาการด้านเทคโนโลยีสารสนเทศ เพื่อการพัฒนาทักษะทางดิจิทัลแก่นักศึกษาและบุคลากร' },
    { id: 'm-5', num: '05', title: 'บริการพื้นที่แลกเปลี่ยนเรียนรู้และห้องปฏิบัติการเพื่อการเรียนการสอนและการอบรม' },
  ],

  // 2. SFA (Strategic Focus Areas - ประเด็นยุทธศาสตร์หลัก 3 ด้าน)
  sfas: [
    {
      id: 'sfa-1',
      code: 'SFA 1',
      name: 'พัฒนาโครงสร้างพื้นฐานดิจิทัลแบบยั่งยืน (Sustainable Digital Infrastructure)',
      description: 'การสร้างหรือปรับปรุงโครงสร้างพื้นฐานด้านเทคโนโลยีดิจิทัล เช่น เครือข่ายอินเทอร์เน็ต ศูนย์ข้อมูล (Data Centers) ระบบคลาวด์ และแพลตฟอร์มดิจิทัล ให้สามารถตอบสนองความต้องการในปัจจุบันได้อย่างมีประสิทธิภาพ โดยไม่ส่งผลกระทบเชิงลบต่อทรัพยากรธรรมชาติ สังคม และเศรษฐกิจในระยะยาว รวมถึงสามารถรองรับการเติบโตของเทคโนโลยีในอนาคตได้อย่างยืดหยุ่น',
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#BFDBFE',
    },
    {
      id: 'sfa-2',
      code: 'SFA 2',
      name: 'พัฒนาการปฏิบัติงานและให้บริการดิจิทัลแบบยั่งยืน (Sustainable Digital Operations and Services)',
      description: 'การปรับปรุงและดำเนินการในกระบวนการทำงาน รวมถึงการให้บริการในรูปแบบดิจิทัล โดยมุ่งเน้นการใช้ทรัพยากรอย่างมีประสิทธิภาพ ลดผลกระทบต่อสิ่งแวดล้อม สนับสนุนสังคมที่เท่าเทียม และสร้างคุณค่าในระยะยาวทั้งต่อองค์กรและผู้รับบริการ',
      color: '#059669',
      bg: '#ECFDF5',
      border: '#A7F3D0',
    },
    {
      id: 'sfa-3',
      code: 'SFA 3',
      name: 'เสริมสร้างความผูกพันลูกค้าแบบยั่งยืน (Sustainable Customer Engagement)',
      description: 'การสร้างและรักษาความสัมพันธ์ระยะยาวระหว่างสำนักคอมพิวเตอร์ฯ และผู้ใช้บริการ โดยมุ่งเน้นการสร้างคุณค่า ความไว้วางใจ และความพึงพอใจอย่างต่อเนื่องผ่านกระบวนการที่ใส่ใจในความต้องการของลูกค้า เพื่อสร้างประสบการณ์ที่สอดคล้องกับความคาดหวังของลูกค้า',
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
    },
  ],

  // 3. SO (Strategic Objectives - 7 วัตถุประสงค์เชิงกลยุทธ์ พร้อม SKPI และผู้รับผิดชอบ)
  sos: [
    {
      id: 'so-1',
      code: 'SO1',
      sfaId: 'sfa-1',
      sfaCode: 'SFA 1',
      title: 'พัฒนาและปรับปรุงระบบโครงสร้างพื้นฐานดิจิทัลให้มีเสถียรภาพ รวดเร็ว และปลอดภัย',
      alignmentCodes: ['CC1', 'CC2', 'SA3'],
      responsibleRoles: [
        'รองผู้อำนวยการฝ่ายระบบเครือข่ายและงานบริการ',
        'รองผู้อำนวยการฝ่ายบริหาร',
      ],
      skpis: [
        { id: 'skpi-1-1', title: 'อัตราความพร้อมใช้งานของโครงสร้างพื้นฐานดิจิทัล', target: '' },
        { id: 'skpi-1-2', title: 'ร้อยละความสำเร็จของการแก้ไขปัญหา (Incident) การเข้าใช้งานระบบงานที่สำคัญของสำนักคอมพิวเตอร์ฯ ที่ไม่สามารถเข้าใช้งานได้ตามปกติ', target: '' },
        { id: 'skpi-1-3', title: 'ร้อยละความสำเร็จของการบริหารจัดการแผนการแก้ไขความเสี่ยง (Risk Treatment Plan)', target: '' },
      ],
    },
    {
      id: 'so-2',
      code: 'SO2',
      sfaId: 'sfa-1',
      sfaCode: 'SFA 1',
      title: 'ปรับปรุงโครงสร้างพื้นฐานดิจิทัลให้เป็นมิตรกับสิ่งแวดล้อม ลดการปล่อยก๊าซเรือนกระจก',
      alignmentCodes: ['CC1', 'CC2', 'SC6'],
      responsibleRoles: [
        'รองผู้อำนวยการฝ่ายระบบเครือข่ายและงานบริการ',
      ],
      skpis: [
        { id: 'skpi-2-1', title: 'ร้อยละการปล่อยก๊าซเรือนกระจกที่ลดลงภายในห้อง Data Center', target: '' },
        { id: 'skpi-2-2', title: 'ร้อยละของมูลค่าการจัดซื้ออุปกรณ์โครงสร้างพื้นฐานดิจิทัลที่เป็นมิตรกับสิ่งแวดล้อม (นับใหม่ทุกปีเฉพาะห้อง Data Center)', target: '' },
      ],
    },
    {
      id: 'so-3',
      code: 'SO3',
      sfaId: 'sfa-2',
      sfaCode: 'SFA 2',
      title: 'สร้างระบบนิเวศเพื่อการวิเคราะห์ข้อมูลเชิงลึกสำหรับการตัดสินใจ',
      alignmentCodes: ['CC2', 'CC3', 'SA11', 'SC1', 'SC4', 'SC8'],
      responsibleRoles: [
        'รองผู้อำนวยการฝ่ายเทคโนโลยีดิจิทัล',
      ],
      skpis: [
        { id: 'skpi-3-1', title: 'ระดับความพึงพอใจผู้ใช้ระบบ', target: '' },
        { id: 'skpi-3-2', title: 'จำนวนชุดข้อมูลสำหรับการวิเคราะห์', target: '' },
        { id: 'skpi-3-3', title: 'ร้อยละความพร้อมใช้งาน', target: '' },
      ],
    },
    {
      id: 'so-4',
      code: 'SO4',
      sfaId: 'sfa-2',
      sfaCode: 'SFA 2',
      title: 'ประยุกต์ใช้งาน AI สำหรับการปฏิบัติงานและการบริการ',
      alignmentCodes: ['CC2', 'CC3', 'SA4', 'SA10', 'SC2', 'SC7'],
      responsibleRoles: [
        'รองผู้อำนวยการฝ่ายบริหาร',
      ],
      skpis: [
        { id: 'skpi-4-1', title: 'จำนวนกระบวนการ/บริการที่มีการนำ AI เข้ามาใช้ (นับสะสม)', target: '' },
        { id: 'skpi-4-2', title: 'คะแนนเฉลี่ยความพึงพอใจต่อบริการที่ใช้ AI', target: '' },
      ],
    },
    {
      id: 'so-5',
      code: 'SO5',
      sfaId: 'sfa-2',
      sfaCode: 'SFA 2',
      title: 'พัฒนารูปแบบกระบวนการสู่ Green IT',
      alignmentCodes: ['CC1', 'CC2', 'CC3', 'SA1', 'SA4', 'SA5'],
      responsibleRoles: [
        'รองผู้อำนวยการฝ่ายบริหาร',
        'ผู้ช่วยผู้อำนวยการฝ่ายเทคโนโลยีสารสนเทศ วิทยาเขตปราจีนบุรี',
        'ผู้ช่วยผู้อำนวยการฝ่ายเทคโนโลยีสารสนเทศ วิทยาเขตระยอง',
      ],
      skpis: [
        { id: 'skpi-5-1', title: 'ร้อยละการปล่อยก๊าซเรือนกระจกที่ลดลงภายในห้องปฏิบัติงานและห้องบริการ (ขอบเขตข้อมูล ชั้น 3-5 กทม. และวิทยาเขต)', target: '' },
        { id: 'skpi-5-2', title: 'จำนวนกระบวนการ/บริการที่มีการปรับปรุงให้เป็นมิตรต่อสิ่งแวดล้อม (นับสะสม ขอบเขตข้อมูล ชั้น 3-5 กทม. และวิทยาเขต)', target: '' },
      ],
    },
    {
      id: 'so-6',
      code: 'SO6',
      sfaId: 'sfa-3',
      sfaCode: 'SFA 3',
      title: 'สร้างและส่งเสริม Digital Lifestyle และการมีส่วนร่วมในสังคม Digital',
      alignmentCodes: ['CC3', 'SA1', 'SA5', 'SA8', 'SC5'],
      responsibleRoles: [
        'รองผู้อำนวยการฝ่ายเทคโนโลยีดิจิทัล',
      ],
      skpis: [
        { id: 'skpi-6-1', title: 'ร้อยละการส่วนร่วมของนักศึกษาและบุคลากรในกิจกรรมดิจิทัล', target: '' },
        { id: 'skpi-6-2', title: 'จำนวนกิจกรรมที่ส่งเสริม Digital Lifestyle', target: '' },
        { id: 'skpi-6-3', title: 'จำนวนสมาชิกในกลุ่มหรือชุมชน IT ของมหาวิทยาลัย', target: '' },
      ],
    },
    {
      id: 'so-7',
      code: 'SO7',
      sfaId: 'sfa-3',
      sfaCode: 'SFA 3',
      title: 'สร้างและส่งเสริมการให้ความรู้เกี่ยวกับการใช้ชีวิตบนโลกดิจิทัลอย่างปลอดภัย',
      alignmentCodes: ['CC1', 'CC2', 'CC3', 'SA2', 'SA3', 'SA8', 'SC5'],
      responsibleRoles: [
        'รองผู้อำนวยการฝ่ายเทคโนโลยีดิจิทัล',
        'รองผู้อำนวยการฝ่ายระบบเครือข่ายและงานบริการ',
      ],
      skpis: [
        { id: 'skpi-7-1', title: 'จำนวนสื่อประชาสัมพันธ์ให้ความรู้เกี่ยวกับการใช้ชีวิตบนโลกดิจิทัลอย่างปลอดภัย', target: '' },
        { id: 'skpi-7-2', title: 'ร้อยละของผู้ใช้บริการที่มีความตระหนักเกี่ยวกับความปลอดภัยดิจิทัลตามเกณฑ์ที่กำหนด (เกณฑ์ที่กำหนดตามแบบสอบถาม)', target: '' },
      ],
    },
  ],

  // 4. Strategic Initiatives & Action Plan (โครงการริเริ่ม 6 โครงการ)
  initiatives: [
    {
      id: 'init-1',
      code: 'I-01',
      title: 'โครงการ ICIT Community Engagement',
      fiscalYearPlanned: '2569',
      responsibleRoles: ['รองผู้อำนวยการ ฝ่ายเทคโนโลยีดิจิทัล', 'รองผู้อำนวยการ ฝ่ายระบบเครือข่ายและงานบริการ'],
      relatedSos: ['SO6', 'SO7'],
      indicators: [
        'อัตราการมีส่วนร่วมของนักศึกษาและบุคลากรในกิจกรรมการเรียนรู้',
        'จำนวนสมาชิกใหม่ในกลุ่มหรือชุมชน IT ของมหาวิทยาลัย',
      ],
      requiredResources: 'ทีมงาน, งบประมาณ, สถานที่',
    },
    {
      id: 'init-2',
      code: 'I-02',
      title: 'โครงการพัฒนา API Gateway สำหรับให้บริการข้อมูลเพื่อการวิเคราะห์',
      fiscalYearPlanned: '2569',
      responsibleRoles: ['รองผู้อำนวยการ ฝ่ายเทคโนโลยีดิจิทัล'],
      relatedSos: ['SO3'],
      indicators: [
        'อัตราการพร้อมใช้งานของระบบ',
        'จำนวนชุดข้อมูลสำหรับการวิเคราะห์',
      ],
      requiredResources: 'Server, Software, ทีมงาน, งบประมาณ',
    },
    {
      id: 'init-3',
      code: 'I-03',
      title: 'โครงการปรับเปลี่ยนกระบวนการทำงานภายในสำนักสู่ดิจิทัล',
      fiscalYearPlanned: '2570',
      responsibleRoles: ['รองผู้อำนวยการ ฝ่ายบริหาร'],
      relatedSos: ['SO4', 'SO5'],
      indicators: [
        'จำนวนกระบวนการทำงานที่ปรับเปลี่ยนเป็นดิจิทัล',
        'ค่าเฉลี่ยความพึงพอใจการใช้งานกระบวนการทำงานที่ปรับเปลี่ยน',
      ],
      requiredResources: 'Server, Software, ทีมงาน, งบประมาณ',
    },
    {
      id: 'init-4',
      code: 'I-04',
      title: 'โครงการเปลี่ยนผ่านระบบสารสนเทศสู่คลาวด์',
      fiscalYearPlanned: '2570-2571',
      responsibleRoles: ['รองผู้อำนวยการ ฝ่ายระบบเครือข่ายและงานบริการ'],
      relatedSos: ['SO1', 'SO2'],
      indicators: [
        'ระดับความเสถียรของระบบสารสนเทศหลังการย้ายไปยังระบบคลาวด์ (จำนวนครั้ง downtime ลดลง)',
        'ความพึงพอใจของผู้ใช้บริการ',
      ],
      requiredResources: 'Server, ทีมงาน, งบประมาณ',
    },
    {
      id: 'init-5',
      code: 'I-05',
      title: 'โครงการพัฒนาระบบการจัดการความพึงพอใจด้วย AI',
      fiscalYearPlanned: '2570-2571',
      responsibleRoles: ['รองผู้อำนวยการ ฝ่ายบริหาร'],
      relatedSos: ['SO4'],
      indicators: [
        'อัตราความแม่นยำในการวิเคราะห์ความรู้สึก (Sentiment Analysis Accuracy Rate)',
        'อัตราการทำงานของระบบ (System Uptime)',
      ],
      requiredResources: 'Server, Software, ทีมงาน, งบประมาณ',
    },
    {
      id: 'init-6',
      code: 'I-06',
      title: 'โครงการจัดทำ Green Data center',
      fiscalYearPlanned: '2572',
      responsibleRoles: ['รองผู้อำนวยการ ฝ่ายระบบเครือข่ายและงานบริการ'],
      relatedSos: ['SO1', 'SO2'],
      indicators: [
        'ร้อยละการปล่อยก๊าซเรือนกระจกที่ลดลงภายในห้อง Data Center',
        'ร้อยละของมูลค่าการจัดซื้ออุปกรณ์โครงสร้างพื้นฐานดิจิทัลที่เป็นมิตรกับสิ่งแวดล้อม',
      ],
      requiredResources: 'Server, Software, ทีมงาน, งบประมาณ',
    },
  ],
};

// 12. ตัวเลือกวิธีการพัฒนา 10 รูปแบบสำหรับ IDP Action Plan
export const IDP_DEVELOPMENT_METHODS = [
  { id: 1, code: '1', title: 'ศึกษาด้วยตนเอง', shortTitle: '1 = ศึกษาด้วยตนเอง' },
  { id: 2, code: '2', title: 'เรียนรู้จากการปฏิบัติงาน', shortTitle: '2 = เรียนรู้จากการปฏิบัติงาน' },
  { id: 3, code: '3', title: 'แลกเปลี่ยนเรียนรู้', shortTitle: '3 = แลกเปลี่ยนเรียนรู้' },
  { id: 4, code: '4', title: 'พี่เลี้ยง', shortTitle: '4 = พี่เลี้ยง' },
  { id: 5, code: '5', title: 'การสอนงาน', shortTitle: '5 = การสอนงาน' },
  { id: 6, code: '6', title: 'ฝึกอบรม', shortTitle: '6 = ฝึกอบรม' },
  { id: 7, code: '7', title: 'การให้คำปรึกษา', shortTitle: '7 = การให้คำปรึกษา' },
  { id: 8, code: '8', title: 'การมอบหมายงาน', shortTitle: '8 = การมอบหมายงาน' },
  { id: 9, code: '9', title: 'ติดตามผู้มีประสบการณ์', shortTitle: '9 = ติดตามผู้มีประสบการณ์' },
  { id: 10, code: '10', title: 'วิธีพัฒนาอื่น ๆ', shortTitle: '10 = วิธีพัฒนาอื่น ๆ' },
];

// 13. ตัวเลือก 5 พันธกิจของสำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ
export const IDP_MISSIONS_5 = [
  { id: 'm-1', num: '01', title: 'พัฒนาโครงสร้างพื้นฐานระบบเทคโนโลยีสารสนเทศและการสื่อสารทางดิจิทัลของมหาวิทยาลัย' },
  { id: 'm-2', num: '02', title: 'พัฒนาระบบเทคโนโลยีสารสนเทศเพื่อสนับสนุนการบริหารจัดการงานของมหาวิทยาลัย' },
  { id: 'm-3', num: '03', title: 'บริการเทคโนโลยีสารสนเทศเพื่อสนับสนุนการเรียนการสอน การค้นคว้าวิจัย และการปฏิบัติงานในมหาวิทยาลัย' },
  { id: 'm-4', num: '04', title: 'บริการวิชาการด้านเทคโนโลยีสารสนเทศ เพื่อการพัฒนาทักษะทางดิจิทัลแก่นักศึกษาและบุคลากร' },
  { id: 'm-5', num: '05', title: 'บริการพื้นที่แลกเปลี่ยนเรียนรู้และห้องปฏิบัติการเพื่อการเรียนการสอนและการอบรม' },
];

// 14. ข้อมูลรอบไตรมาสสำหรับ IDP Action Plan
export const IDP_ACTION_PLAN_QUARTERS = [
  { key: 'q1', label: 'Q1', period: 'ต.ค.-ธ.ค.', fullLabel: 'Q1 (ต.ค.-ธ.ค.)' },
  { key: 'q2', label: 'Q2', period: 'ม.ค.-มี.ค.', fullLabel: 'Q2 (ม.ค.-มี.ค.)' },
  { key: 'q3', label: 'Q3', period: 'เม.ย.-มิ.ย.', fullLabel: 'Q3 (เม.ย.-มิ.ย.)' },
  { key: 'q4', label: 'Q4', period: 'ก.ค.-ก.ย.', fullLabel: 'Q4 (ก.ค.-ก.ย.)' },
];

// 15. สถานะของ IDP Action Plan
export const IDP_ACTION_PLAN_STATUSES = {
  DRAFT: { key: 'DRAFT', label: 'ฉบับร่าง', color: '#64748B', bg: '#F1F5F9' },
  PLANNED: { key: 'PLANNED', label: 'รับทราบแผนแล้ว', color: '#2563EB', bg: '#EFF6FF' },
  IN_PROGRESS: { key: 'IN_PROGRESS', label: 'อยู่ระหว่างดำเนินการ', color: '#D97706', bg: '#FEF3C7' },
  EVALUATED: { key: 'EVALUATED', label: 'ประเมินผลแล้ว', color: '#16A34A', bg: '#DCFCE7' },
};
