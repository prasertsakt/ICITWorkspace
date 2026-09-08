// Initial Data Definitions for Organization Management System
// Cleaned for Live Production: No dummy mock personnel or dummy executives.
// Real data is managed and fetched directly from Firebase Firestore.

export const INITIAL_PERSONNEL = [];

export const INITIAL_EXECUTIVES = [];

export const INITIAL_DEPARTMENTS = [
  {
    id: 'dept-1',
    name: 'สำนักงานผู้อำนวยการ',
    headPersonnelId: '',
    supervisingExecutiveId: '',
    description: 'บริหารงานทั่วไป นโยบายและแผน การเงิน พัสดุ และการบริหารงานบุคคล',
  },
  {
    id: 'dept-2',
    name: 'ฝ่ายวิศวกรรมระบบเครือข่าย',
    headPersonnelId: '',
    supervisingExecutiveId: '',
    description: 'ดูแลโครงสร้างพื้นฐานระบบเครือข่าย อินเทอร์เน็ต และความมั่นคงปลอดภัยสารสนเทศ',
  },
  {
    id: 'dept-3',
    name: 'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
    headPersonnelId: '',
    supervisingExecutiveId: '',
    description: 'สนับสนุนการวิจัย พัฒนาศักยภาพบุคลากร และบริการวิชาการสู่สังคม',
  },
  {
    id: 'dept-4',
    name: 'ฝ่ายพัฒนาระบบสารสนเทศ',
    headPersonnelId: '',
    supervisingExecutiveId: '',
    description: 'ออกแบบและพัฒนาระบบสารสนเทศ ฐานข้อมูล และเว็บแอปพลิเคชันองค์กร',
  },
  {
    id: 'dept-5',
    name: 'ฝ่ายเทคโนโลยีสารสนเทศ วิทยาเขตปราจีนบุรี',
    headPersonnelId: '',
    supervisingExecutiveId: '',
    description: 'บริการและพัฒนาระบบสารสนเทศประจำวิทยาเขตปราจีนบุรี',
  },
  {
    id: 'dept-6',
    name: 'ฝ่ายเทคโนโลยีสารสนเทศ วิทยาเขตระยอง',
    headPersonnelId: '',
    supervisingExecutiveId: '',
    description: 'บริการและพัฒนาระบบสารสนเทศประจำวิทยาเขตระยอง',
  },
];

// Initial leaves data is empty (no dummy data)
export const INITIAL_LEAVES = [];

// Initial time attendance requests is empty (no dummy data)
export const INITIAL_TIME_ATTENDANCES = [];
