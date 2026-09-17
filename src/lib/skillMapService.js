// Knowledge & Skill Map Service for ICIT KMUTNB
// Hierarchy: 4 Main Work Areas -> Functional Competencies -> Sub-Skills / Key Topics
// Rating Scale: 0 - 5

import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
} from 'firebase/firestore';

export const LOCAL_KEY_SKILL_MAP_CONFIGS = 'icit_skill_map_configs';
export const LOCAL_KEY_SKILL_MAP_ASSESSMENTS = 'icit_skill_map_assessments';

// -------------------------------------------------------------
// 1. Rating Scale Definition (0 - 5)
// -------------------------------------------------------------
export const SKILL_RATING_LEVELS = [
  {
    score: 0,
    label: 'ไม่มีความรู้/ไม่จำเป็น',
    shortLabel: '0 - ไม่มี/ไม่จำเป็น',
    description: 'ไม่ได้ใช้ในงานปัจจุบัน หรือไม่มีความรู้ในด้านนี้',
    color: '#94A3B8',
    bgColor: '#F1F5F9',
    badgeColor: '#64748B',
  },
  {
    score: 1,
    label: 'น้อยมาก',
    shortLabel: '1 - น้อยมาก',
    description: 'มีทฤษฎีพื้นฐาน แต่ยังไม่สามารถลงมือทำได้ด้วยตนเอง',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    badgeColor: '#DC2626',
  },
  {
    score: 2,
    label: 'น้อย',
    shortLabel: '2 - น้อย',
    description: 'ทำงานง่าย ๆ ได้บ้าง แต่ยังต้องการดูแลอย่างใกล้ชิด',
    color: '#F97316',
    bgColor: '#FFEDD5',
    badgeColor: '#EA580C',
  },
  {
    score: 3,
    label: 'ปานกลาง',
    shortLabel: '3 - ปานกลาง',
    description: 'ทำงานได้ตามมาตรฐาน หากมีคู่มือหรือคนคอยแนะนำในจุดที่ซับซ้อน',
    color: '#FBBF24',
    bgColor: '#FEF3C7',
    badgeColor: '#D97706',
  },
  {
    score: 4,
    label: 'มาก',
    shortLabel: '4 - มาก',
    description: 'ทำงานได้ด้วยตนเอง แก้ไขปัญหาหน้างานได้เกือบทั้งหมด',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    badgeColor: '#2563EB',
  },
  {
    score: 5,
    label: 'มากที่สุด',
    shortLabel: '5 - มากที่สุด',
    description: 'เชี่ยวชาญระดับสูง เป็นที่ปรึกษา (Mentor) และถ่ายทอดความรู้ได้',
    color: '#10B981',
    bgColor: '#D1FAE5',
    badgeColor: '#059669',
  },
];

// -------------------------------------------------------------
// 2. Default 4 Work Areas Competencies & Sub-Skills Seed Data
// -------------------------------------------------------------
export const DEFAULT_WORK_AREAS = [
  {
    id: 'area-admin',
    name: 'งานภายในสำนักงานผู้อำนวยการ',
    shortName: 'สำนักงานผู้อำนวยการ',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    competencies: [
      {
        id: 'comp-admin-01',
        name: 'ความรู้ด้านการบริหารทรัพยากรบุคคล',
        subSkills: [
          { id: 'sub-admin-01-01', name: 'การวางแผนกำลังคน (Workforce Planning)', description: 'การวิเคราะห์ภาระงาน (Workload Analysis) เพื่อกำหนดจำนวนและคุณสมบัติบุคลากรที่เหมาะสม' },
          { id: 'sub-admin-01-02', name: 'การบริหารผลการปฏิบัติงาน (Performance Management)', description: 'การกำหนดเป้าหมาย ติดตาม และประเมินผลการปฏิบัติงานอย่างเป็นระบบ' },
          { id: 'sub-admin-01-03', name: 'การออกแบบและใช้ตัวชี้วัด (KPIs) และ Competency', description: 'การกำหนดดัชนีชี้วัดผลงานและสมรรถนะหลักของบุคลากร' },
          { id: 'sub-admin-01-04', name: 'การพัฒนาและฝึกอบรม (Training & Development)', description: 'การจัดทำแผนและดำเนินโครงการฝึกอบรมเพื่อเพิ่มพูนทักษะ' },
          { id: 'sub-admin-01-05', name: 'การจัดทำแผนพัฒนารายบุคคล (IDP)', description: 'การวิเคราะห์ความจำเป็นและวางแผนพัฒนาบุคลากรรายบุคคล' },
          { id: 'sub-admin-01-06', name: 'การวางแผนเส้นทางอาชีพ (Career Path)', description: 'การสร้างความก้าวหน้าในสายอาชีพและการสืบทอดตำแหน่ง' },
        ],
      },
      {
        id: 'comp-admin-02',
        name: 'ความรู้ด้านนโยบาย และแผน',
        subSkills: [
          { id: 'sub-admin-02-01', name: 'การวางแผนกลยุทธ์ (Strategic Planning)', description: 'การวิเคราะห์บริบทองค์กรและจัดทำแผนยุทธศาสตร์ของสำนักฯ' },
          { id: 'sub-admin-02-02', name: 'การวางแผนปฏิบัติการ (Action Plan)', description: 'การแปลงแผนยุทธศาสตร์สู่แผนปฏิบัติราชการประจำปี' },
          { id: 'sub-admin-02-03', name: 'การวางแผนการใช้จ่ายเงิน', description: 'การบริหารและจัดสรรงบประมาณตามแผนงาน' },
          { id: 'sub-admin-02-04', name: 'การบริหารโครงการ', description: 'การกำกับดูแลโครงการให้บรรลุเป้าหมายตามกรอบเวลาและงบประมาณ' },
          { id: 'sub-admin-02-05', name: 'การวิเคราะห์/สังเคราะห์ข้อมูล', description: 'การประมวลผลข้อมูลเชิงสถิติเพื่อสนับสนุนการตัดสินใจของผู้บริหาร' },
          { id: 'sub-admin-02-06', name: 'การติดตามและประเมินผล (Monitoring & Evaluation)', description: 'การออกแบบระบบติดตามความก้าวหน้าของโครงการและตัวชี้วัดของสำนักฯ' },
        ],
      },
      {
        id: 'comp-admin-03',
        name: 'ความรู้ด้านพัสดุ (Procurement)',
        subSkills: [
          { id: 'sub-admin-03-01', name: 'การวางแผนการจัดซื้อจัดจ้าง', description: 'การจัดทำแผนจัดซื้อจัดจ้างประจำปีและประมาณการราคา' },
          { id: 'sub-admin-03-02', name: 'การปฏิบัติตามแผนจัดซื้อจัดจ้างผ่านระบบสารสนเทศ', description: 'การดำเนินการตาม พ.ร.บ. จัดซื้อจัดจ้างฯ ผ่านระบบ e-GP และระบบสารสนเทศ' },
          { id: 'sub-admin-03-03', name: 'การบริหารพัสดุ (วัสดุและครุภัณฑ์) รวมถึงการบริหารสัญญา', description: 'การตรวจรับ ลงทะเบียน คุมยอด และบริหารสัญญาจ้าง' },
          { id: 'sub-admin-03-04', name: 'การจำหน่ายพัสดุ', description: 'การตรวจสอบสภาพและจำหน่ายพัสดุชำรุดตามระเบียบ' },
          { id: 'sub-admin-03-05', name: 'การรายงานผลการดำเนินงานรายเดือน และรายไตรมาส', description: 'การสรุปรายงานสถานะพัสดุต่อหน่วยงานกำกับดูแล' },
        ],
      },
      {
        id: 'comp-admin-04',
        name: 'ความรู้ด้านงบประมาณ',
        subSkills: [
          { id: 'sub-admin-04-01', name: 'การจัดทำงบประมาณ (Budget Preparation)', description: 'ความเข้าใจการจัดทำงบประมาณแบบมุ่งเน้นผลงาน และการบริหารงบประมาณโครงการ (Project-Based Budgeting)' },
          { id: 'sub-admin-04-02', name: 'การควบคุมและติดตามการใช้จ่ายเงินงบประมาณ', description: 'การควบคุม ดำเนินการต่างๆ ในด้านงบประมาณ ติดตามผลการใช้จ่ายเงินงบประมาณรายงานการเงิน' },
        ],
      },
      {
        id: 'comp-admin-05',
        name: 'ความรู้ด้านการบัญชี',
        subSkills: [
          { id: 'sub-admin-05-01', name: 'หลักการบัญชีและการจัดทำรายงานการเงิน', description: 'ความเข้าใจในการบันทึกบัญชี การจัดทำรายงานการเงิน และการบริหารกระแสเงินสด' },
        ],
      },
      {
        id: 'comp-admin-06',
        name: 'ความรู้ด้านการเงิน',
        subSkills: [
          { id: 'sub-admin-06-01', name: 'การประยุกต์ใช้กฎหมาย ระเบียบ และวินัยการเงินการคลัง', description: 'Financial Regulations Compliance ตามมาตรฐานหน่วยงานภาครัฐ' },
          { id: 'sub-admin-06-02', name: 'การบริหารจัดการ การเบิกจ่าย เงินยืมทดรองจ่าย และเงินทุนหมุนเวียน', description: 'ขั้นตอนการตรวจสอบและดำเนินการเบิกจ่ายเงิน' },
          { id: 'sub-admin-06-03', name: 'การบริหารจัดการรายรับ', description: 'การออกใบเสร็จและนำส่งรายได้ตามระเบียบ' },
          { id: 'sub-admin-06-04', name: 'การปฏิบัติงานผ่านระบบสารสนเทศทางการเงิน', description: 'การใช้ระบบ ERP และระบบการเงินของมหาวิทยาลัย' },
          { id: 'sub-admin-06-05', name: 'การจัดทำและวิเคราะห์รายงานทางการเงิน (Financial Reporting & Data Analysis)', description: 'การวิเคราะห์งบการเงินและรายงานสถานะทางการเงิน' },
        ],
      },
      {
        id: 'comp-admin-07',
        name: 'ทักษะการพัฒนากระบวนการ',
        subSkills: [
          { id: 'sub-admin-07-01', name: 'การวิเคราะห์กระบวนการ (Process Analysis)', description: 'การทำความเข้าใจและเขียนผังกระบวนการทำงาน (Workflow) ในปัจจุบัน' },
          { id: 'sub-admin-07-02', name: 'การออกแบบกระบวนการใหม่ (Process Re-design)', description: 'การออกแบบขั้นตอนการทำงานใหม่ (To-Be Process) ที่ลดความซ้ำซ้อน' },
          { id: 'sub-admin-07-03', name: 'การจัดการคุณภาพ (Quality Management)', description: 'ความรู้เกี่ยวกับมาตรฐาน เช่น ISO 9001 เพื่อนำมาประยุกต์ใช้ในการทำงาน และงานบริการ' },
        ],
      },
      {
        id: 'comp-admin-08',
        name: 'ทักษะการประสานงานและการสื่อสาร',
        subSkills: [
          { id: 'sub-admin-08-01', name: 'การบริหารการประชุม (Meeting Management)', description: 'ทักษะการจัดเตรียมวาระการประชุม การดำเนินการประชุม และการสรุปรายงานการประชุม' },
          { id: 'sub-admin-08-02', name: 'การเขียนหนังสือราชการ/ติดต่อประสานงาน', description: 'ทักษะการร่างหนังสือ โต้ตอบ และการประสานงานที่เป็นทางการ' },
          { id: 'sub-admin-08-03', name: 'การสื่อสารภายในองค์กร (Internal Communication)', description: 'เทคนิคการสื่อสารนโยบายและประกาศต่างๆ ให้บุคลากรในสำนักฯ รับทราบอย่างมีประสิทธิภาพ' },
          { id: 'sub-admin-08-04', name: 'การสื่อสารภายนอกองค์กร (External Communication Skills)', description: 'การสื่อสารตรงประเด็นและกระชับ, การเขียนเอกสาร/อีเมลที่เป็นทางการ, การเจรจาต่อรอง และเข้าใจบริบทผู้รับสาร' },
          { id: 'sub-admin-08-05', name: 'การประสานงานข้ามสายงาน (Cross-functional Communication)', description: 'ทักษะในการอธิบายปัญหาและประสานความร่วมมือกับเพื่อนร่วมงานและทีม' },
        ],
      },
    ],
  },
  {
    id: 'area-dev',
    name: 'งานด้านการพัฒนาระบบสารสนเทศ',
    shortName: 'พัฒนาระบบสารสนเทศ',
    color: '#0284C7',
    bgColor: '#F0F9FF',
    competencies: [
      {
        id: 'comp-dev-01',
        name: 'ทักษะการวิเคราะห์และออกแบบระบบ (System Analysis and Design)',
        subSkills: [
          { id: 'sub-dev-01-01', name: 'การรวบรวมความต้องการ (Requirement Gathering)', description: 'เทคนิคการสัมภาษณ์ผู้ใช้งาน (User Interview) และการวิเคราะห์ความต้องการทางธุรกิจ (Business Requirement)' },
          { id: 'sub-dev-01-02', name: 'การออกแบบเชิงตรรกะ (Logical Design)', description: 'การสร้างแบบจำลอง เช่น Data Flow Diagrams (DFD) และ E-R Diagrams' },
          { id: 'sub-dev-01-03', name: 'การออกแบบเชิงกายภาพ (Physical Design)', description: 'การออกแบบหน้าจอ (UI/UX), การออกแบบโครงสร้างฐานข้อมูล (Database Schema)' },
        ],
      },
      {
        id: 'comp-dev-02',
        name: 'ทักษะการพัฒนาซอฟต์แวร์ (Software Development)',
        subSkills: [
          { id: 'sub-dev-02-01', name: 'ภาษาโปรแกรม (Programming Languages)', description: 'ความเชี่ยวชาญในภาษาหลักที่ใช้ เช่น PHP, Java, Python, JavaScript หรือ .NET' },
          { id: 'sub-dev-02-02', name: 'เทคโนโลยีเว็บ (Web Technologies)', description: 'ความรู้ด้าน HTML, CSS, JavaScript และ Frameworks สมัยใหม่ (เช่น React, Vue.js, Laravel, Next.js)' },
          { id: 'sub-dev-02-03', name: 'การควบคุมเวอร์ชัน (Version Control)', description: 'การใช้งานเครื่องมือ เช่น Git เพื่อบริหารจัดการโค้ดและการทำงานร่วมกัน' },
        ],
      },
      {
        id: 'comp-dev-03',
        name: 'ทักษะการบริหารจัดการฐานข้อมูล (Database Management)',
        subSkills: [
          { id: 'sub-dev-03-01', name: 'ภาษา SQL (SQL Language)', description: 'ความเชี่ยวชาญในการเขียนคำสั่ง SQL (SELECT, INSERT, UPDATE, DELETE, JOINS, Store Procedure)' },
          { id: 'sub-dev-03-02', name: 'การบริหารฐานข้อมูล (DB Administration)', description: 'การติดตั้ง ตั้งค่า สำรองข้อมูล (Backup) และกู้คืน (Restore) ฐานข้อมูล (เช่น MySQL, Oracle, MS SQL, PostgreSQL)' },
          { id: 'sub-dev-03-03', name: 'การปรับแต่งประสิทธิภาพ (Performance Tuning)', description: 'การทำ Indexing และการ Optimize Query เพื่อให้ระบบทำงานได้เร็วขึ้น' },
        ],
      },
      {
        id: 'comp-dev-04',
        name: 'ความรู้ด้านมาตรฐานสากลในการพัฒนา (Knowledge of International Standards)',
        subSkills: [
          { id: 'sub-dev-04-01', name: 'กระบวนการพัฒนาแบบ Agile/Scrum', description: 'ความเข้าใจในหลักการและแนวปฏิบัติของ Scrum (เช่น Sprint, Daily Standup, Retrospective)' },
          { id: 'sub-dev-04-02', name: 'DevOps Principles & CI/CD', description: 'ความเข้าใจในหลักการ CI/CD (Continuous Integration/Continuous Delivery) และการใช้เครื่องมือ (เช่น Jenkins, Docker, GitHub Actions)' },
          { id: 'sub-dev-04-03', name: 'การทดสอบซอฟต์แวร์ (Software Testing)', description: 'ความรู้ในการทำ Unit Test, Integration Test และ User Acceptance Test (UAT)' },
          { id: 'sub-dev-04-04', name: 'มาตรฐาน ISO/IEC 29110', description: 'ความเข้าใจในข้อกำหนดด้านกระบวนการพัฒนาซอฟต์แวร์สำหรับองค์กรขนาดเล็กมาก' },
        ],
      },
      {
        id: 'comp-dev-05',
        name: 'ทักษะการให้คำปรึกษาและแก้ไขปัญหา (Consulting & Problem Solving)',
        subSkills: [
          { id: 'sub-dev-05-01', name: 'การวิเคราะห์ปัญหาเชิงตรรกะ (Logical Problem Solving)', description: 'ทักษะการ Debugging โค้ดและวิเคราะห์ Log file เพื่อหาสาเหตุของข้อผิดพลาด' },
          { id: 'sub-dev-05-02', name: 'การจัดทำเอกสาร (Documentation)', description: 'การเขียนคู่มือการใช้งานระบบ (User Manual) และคู่มือทางเทคนิค (Technical Manual)' },
          { id: 'sub-dev-05-03', name: 'การฝึกอบรมผู้ใช้งาน (User Training)', description: 'ทักษะการถ่ายทอดและสอนการใช้งานระบบใหม่แก่ผู้ใช้งาน' },
        ],
      },
      {
        id: 'comp-dev-06',
        name: 'ทักษะการถ่ายทอดความรู้ (Telling Story)',
        subSkills: [
          { id: 'sub-dev-06-01', name: 'การสื่อสาร (Communication Skills)', description: '1) ทักษะการฟัง: เข้าใจผู้ฟังและจับประเด็นสำคัญ 2) ทักษะการพูด: ใช้ภาษาที่เหมาะสม ชัดเจน ควบคุมน้ำเสียง จังหวะ และภาษากายได้เหมาะสม ใช้คำศัพท์ที่เข้าใจง่าย เหมาะกับกลุ่มผู้ฟัง' },
          { id: 'sub-dev-06-02', name: 'ความเข้าใจในเนื้อหา', description: '1) ความรู้จริง: พูดในเรื่องที่รู้จริง และมีความเข้าใจในข้อมูลที่ถ่ายทอดอย่างถ่องแท้ 2) การจัดโครงสร้าง: วางแผนเนื้อหาให้มีจุดประสงค์หลัก หัวข้อรอง และสรุปชัดเจน' },
          { id: 'sub-dev-06-03', name: 'การสร้างความเชื่อมโยง', description: '1) ยกตัวอย่าง: ใช้ตัวอย่างที่เป็นรูปธรรมและเกี่ยวข้องกับชีวิตประจำวันเพื่อให้ผู้ฟังเห็นภาพ 2) การใช้สื่อ: ใช้สไลด์ ภาพ วิดีโอ เพื่อช่วยให้การนำเสนอน่าสนใจ' },
          { id: 'sub-dev-06-04', name: 'การปรับตัว (Adaptability)', description: '1) รู้จักผู้ฟัง: ปรับเนื้อหาและวิธีการนำเสนอให้เหมาะสมกับพื้นฐานความรู้ของผู้ฟังแต่ละกลุ่ม 2) รับมือสถานการณ์: ควบคุมอารมณ์และปรับเปลี่ยนวิธีการเมื่อเจอผู้ฟังที่มีปัญหาหรือไม่เข้าใจ' },
        ],
      },
      {
        id: 'comp-dev-07',
        name: 'ความรู้ด้านวงจรการพัฒนาซอฟต์แวร์ที่ปลอดภัย (Secure SDLC)',
        subSkills: [
          { id: 'sub-dev-07-01', name: 'ความมั่นคงปลอดภัยของแอปพลิเคชัน', description: 'การควบคุมความมั่นคงปลอดภัยของแอปพลิเคชัน เว็บ และ API (OWASP Top 10)' },
          { id: 'sub-dev-07-02', name: 'การบริหารจัดการตัวตนและการเข้าถึง (IAM)', description: 'การพิสูจน์ตัวตนและการกำหนดสิทธิ์การเข้าถึง, MFA, การจัดการข้อมูลลับ เช่น API Key และ Token' },
          { id: 'sub-dev-07-03', name: 'การกำกับดูแลและการปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA)', description: 'การปกป้องและจัดการข้อมูลส่วนบุคคลในระบบสารสนเทศ' },
          { id: 'sub-dev-07-04', name: 'ความมั่นคงปลอดภัยของข้อมูลและความเป็นส่วนตัว', description: 'รวมถึงธรรมาภิบาลข้อมูล (Data Governance) ในการพัฒนาซอฟต์แวร์' },
          { id: 'sub-dev-07-05', name: 'การทดสอบ การตรวจสอบ และการปฏิบัติตามข้อกำหนด', description: 'การทดสอบการเจาะระบบ (Penetration Test), การประเมินช่องโหว่ของระบบ (Vulnerability Assessment)' },
        ],
      },
      {
        id: 'comp-dev-08',
        name: 'ความรู้ และทักษะด้านการพัฒนา Dashboard เพื่อการรายงานผล และวิเคราะห์ข้อมูล',
        subSkills: [
          { id: 'sub-dev-08-01', name: 'การเข้าใจเป้าหมาย และกำหนดตัวชี้วัด', description: 'การกำหนดตัวชี้วัดที่สะท้อนถึงความสำเร็จ หรือปัญหาที่ต้องการแสดงผล' },
          { id: 'sub-dev-08-02', name: 'ทักษะในการออกแบบ UI/UX การจัดวางองค์ประกอบ', description: 'การจัดวางองค์ประกอบให้เข้าใจง่าย และการสร้างระบบ Filter' },
          { id: 'sub-dev-08-03', name: 'ความเชี่ยวชาญในการใช้เครื่องมือในการสร้าง Interactive Dashboard', description: 'การใช้ Power BI, Tableau, Looker Studio ในการประมวลผลและแสดงผลข้อมูล' },
        ],
      },
    ],
  },
  {
    id: 'area-network',
    name: 'งานด้านวิศวกรรมระบบเครือข่าย',
    shortName: 'วิศวกรรมเครือข่าย',
    color: '#059669',
    bgColor: '#ECFDF5',
    competencies: [
      {
        id: 'comp-net-01',
        name: 'ทักษะการออกแบบและบริหารเครือข่าย (Network Design & Administration)',
        subSkills: [
          { id: 'sub-net-01-01', name: 'TCP/IP และ Subnetting', description: 'ความเข้าใจพื้นฐานของระบบเครือข่าย การแบ่ง IP Address และการทำ Subnet Mask' },
          { id: 'sub-net-01-02', name: 'Routing & Switching', description: 'ความรู้ในการตั้งค่าอุปกรณ์เครือข่าย (Router, Switch), การทำ VLANs, และโปรโตคอลการกำหนดเส้นทาง' },
          { id: 'sub-net-01-03', name: 'เครือข่ายไร้สาย (Wireless Networking)', description: 'การบริหารจัดการ Wi-Fi Controller, การวางแผนติดตั้ง Access Point และการตั้งค่าความปลอดภัย (WPA2/WPA3)' },
          { id: 'sub-net-01-04', name: 'การบำรุงรักษาเครือข่าย (Local Network Maintenance)', description: 'การตรวจสอบและแก้ปัญหาการเชื่อมต่อเครือข่าย (ทั้งสาย LAN และ Wi-Fi) ภายในอาคาร' },
          { id: 'sub-net-01-05', name: 'การดูแลห้อง Server (Server Room Management)', description: 'การตรวจสอบระบบไฟฟ้า (UPS) ระบบปรับอากาศ และสถานะทางกายภาพของอุปกรณ์ในห้อง Server' },
        ],
      },
      {
        id: 'comp-net-02',
        name: 'ทักษะการบริหารจัดการเครื่องแม่ข่าย (Server Administration)',
        subSkills: [
          { id: 'sub-net-02-01', name: 'ระบบปฏิบัติการเซิร์ฟเวอร์ (Server OS)', description: 'ความเชี่ยวชาญในการบริหารจัดการ Linux (เช่น Ubuntu, CentOS) และ Windows Server' },
          { id: 'sub-net-02-02', name: 'เทคโนโลยี Virtualization', description: 'การบริหารจัดการระบบเสมือน (VM) เช่น VMware vSphere หรือ Hyper-V' },
          { id: 'sub-net-02-03', name: 'การบริหารจัดการบริการ (Service Management)', description: 'การติดตั้งและดูแลบริการหลัก เช่น Web Server (Apache/Nginx), DNS, DHCP, Active Directory (AD)' },
        ],
      },
      {
        id: 'comp-net-03',
        name: 'ความรู้ด้านความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity)',
        subSkills: [
          { id: 'sub-net-03-01', name: 'การบริหารจัดการ Firewall', description: 'การกำหนด Policy, การทำ Network Address Translation (NAT) และการตั้งค่า VPN' },
          { id: 'sub-net-03-02', name: 'การป้องกันและเฝ้าระวัง (Protection & Monitoring)', description: 'ความรู้เกี่ยวกับระบบ IDS/IPS, Antivirus, และการวิเคราะห์ Log ด้านความปลอดภัย' },
          { id: 'sub-net-03-03', name: 'การเสริมความแข็งแกร่ง (System Hardening)', description: 'หลักการและเทคนิคการตั้งค่าระบบเครือข่ายและเซิร์ฟเวอร์ให้ปลอดภัย (ปิด Service ที่ไม่จำเป็น, อัปเดต Patch)' },
          { id: 'sub-net-03-04', name: 'ความรู้ด้านความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity Awareness)', description: 'เข้าใจภัยคุกคามทางไซเบอร์ เช่น Virus, Malware, Phishing และแนวทางป้องกันและกำจัดภัยคุกคาม' },
        ],
      },
      {
        id: 'comp-net-04',
        name: 'ทักษะการแก้ปัญหาทางเทคนิค (Technical Troubleshooting)',
        subSkills: [
          { id: 'sub-net-04-01', name: 'เครื่องมือวิเคราะห์เครือข่าย (Network Tools)', description: 'การใช้คำสั่งพื้นฐาน (เช่น ping, traceroute, nslookup) และเครื่องมือขั้นสูง (เช่น Wireshark)' },
          { id: 'sub-net-04-02', name: 'การวินิจฉัยปัญหา (Problem Diagnosis)', description: 'ทักษะการวิเคราะห์ปัญหาจากบนลงล่าง (OSI Model) เพื่อหาสาเหตุที่แท้จริง' },
          { id: 'sub-net-04-03', name: 'ระบบเฝ้าระวัง (Monitoring Systems)', description: 'การใช้งานเครื่องมือ เช่น Zabbix, Grafana หรือ PRTG เพื่อตรวจสอบสถานะระบบ' },
        ],
      },
      {
        id: 'comp-net-05',
        name: 'ความรู้ด้านมาตรฐานโครงสร้างพื้นฐาน (Infrastructure Standards)',
        subSkills: [
          { id: 'sub-net-05-01', name: 'มาตรฐาน ISO 27001 (ISMS)', description: 'ความเข้าใจในข้อกำหนดด้านการบริหารจัดการความมั่นคงปลอดภัยสารสนเทศ' },
          { id: 'sub-net-05-02', name: 'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)', description: 'ความเข้าใจในข้อกำหนดทางเทคนิค (Technical Measures) ที่เกี่ยวข้องกับการคุ้มครองข้อมูล' },
          { id: 'sub-net-05-03', name: 'มาตรฐานศูนย์ข้อมูล (Data Center Standards)', description: 'ความรู้พื้นฐานเกี่ยวกับมาตรฐาน เช่น TIA-942 (ด้านกายภาพ, ระบบไฟฟ้า, ระบบปรับอากาศ)' },
        ],
      },
    ],
  },
  {
    id: 'area-service',
    name: 'งานด้านการบริการวิชาการและส่งเสริมงานวิจัย',
    shortName: 'บริการวิชาการและวิจัย',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    competencies: [
      {
        id: 'comp-svc-01',
        name: 'ทักษะการสนับสนุนผู้ใช้งานและซ่อมบำรุง (IT Support & Maintenance)',
        subSkills: [
          { id: 'sub-svc-01-01', name: 'การวิเคราะห์ฮาร์ดแวร์ (Hardware Troubleshooting)', description: 'การวิเคราะห์อาการเสียของ PC, Notebook และการเปลี่ยนอุปกรณ์' },
          { id: 'sub-svc-01-02', name: 'การจัดการซอฟต์แวร์ (Software Management)', description: 'การติดตั้ง OS (Windows/macOS), การติดตั้งซอฟต์แวร์ลิขสิทธิ์ และการกำจัด Malware/Virus' },
          { id: 'sub-svc-01-03', name: 'การแก้ปัญหาอุปกรณ์ต่อพ่วง (Peripheral Support)', description: 'การติดตั้งและแก้ปัญหา Printer, Scanner และอุปกรณ์ห้องเรียน/ห้องประชุม' },
        ],
      },
      {
        id: 'comp-svc-02',
        name: 'ความรู้การสนับสนุนผู้ใช้งานและซ่อมบำรุง (IT Support & Maintenance)',
        subSkills: [
          { id: 'sub-svc-02-01', name: 'เข้าใจโครงสร้างและการทำงานของคอมพิวเตอร์', description: 'เข้าใจ Hardware, ระบบปฏิบัติการ และอุปกรณ์ต่อพ่วง เพื่อใช้ในการวิเคราะห์และแก้ไขปัญหาเครื่องคอมพิวเตอร์' },
          { id: 'sub-svc-02-02', name: 'เข้าใจการติดตั้ง ตั้งค่า และแก้ไขปัญหาในระบบปฏิบัติการ', description: 'การตั้งค่าและแก้ปัญหาใน Windows, macOS หรือ Linux' },
          { id: 'sub-svc-02-03', name: 'เข้าใจพื้นฐานระบบเครือข่าย', description: 'ความเข้าใจ IP Address, Wi-Fi, Internet connection และการวิเคราะห์ปัญหาการเชื่อมต่อ' },
          { id: 'sub-svc-02-04', name: 'เข้าใจการติดตั้ง การใช้งาน และการบริหารจัดการซอฟต์แวร์ลิขสิทธิ์', description: 'การบริหารจัดการซอฟต์แวร์ที่มีลิขสิทธิ์ของมหาวิทยาลัย' },
        ],
      },
      {
        id: 'comp-svc-03',
        name: 'ทักษะการจัดฝึกอบรมและถ่ายทอด (Training & Instruction)',
        subSkills: [
          { id: 'sub-svc-03-01', name: 'การออกแบบหลักสูตร (Instructional Design)', description: 'การวิเคราะห์ความต้องการของผู้เข้าอบรมและออกแบบเนื้อหาหลักสูตร (เช่น หลักสูตร Digital Literacy)' },
          { id: 'sub-svc-03-02', name: 'การนำเสนอและถ่ายทอด (Presentation Skills)', description: 'การพูดในที่สาธารณะ การอธิบายเรื่องเทคนิคให้เข้าใจง่าย และการจัดการห้องอบรม' },
          { id: 'sub-svc-03-03', name: 'สื่อการสอน (Training Materials)', description: 'การสร้างสื่อการสอน สไลด์, วิดีโอสอน (E-Learning), และคู่มือปฏิบัติการ (Workshop)' },
          { id: 'sub-svc-03-04', name: 'การบริหารจัดการ (Management Skills)', description: 'การวางแผนโครงการฝึกอบรม การบริหารงบประมาณ การประสานงาน และการบริหารความเสี่ยง' },
          { id: 'sub-svc-03-05', name: 'ด้านเทคโนโลยี (Digital & Training Technology Skills)', description: 'การใช้เครื่องมือ Online Training (เช่น Teams, Zoom) การใช้ AI ช่วยออกแบบเนื้อหา' },
          { id: 'sub-svc-03-06', name: 'การประเมินผล (Evaluation Skills)', description: 'การออกแบบเครื่องมือวัดผล การสร้างแบบสอบถาม/แบบทดสอบ การวิเคราะห์ผล (Data Analysis) การสรุปผลและรายงานประกาศผล' },
        ],
      },
      {
        id: 'comp-svc-04',
        name: 'ความรู้การจัดฝึกอบรมและถ่ายทอด (Training & Instruction)',
        subSkills: [
          { id: 'sub-svc-04-01', name: 'บริหารจัดการการฝึกอบรม', description: 'การเตรียมห้องปฏิบัติการ การสนับสนุนผู้เรียน และการดูแลการอบรมให้ดำเนินไปอย่างราบรื่น' },
          { id: 'sub-svc-04-02', name: 'การวิเคราะห์และออกแบบหลักสูตรฝึกอบรมด้านเทคโนโลยีสารสนเทศ', description: 'การออกแบบให้เหมาะสมกับผู้เรียนและวัตถุประสงค์ของการฝึกอบรม' },
          { id: 'sub-svc-04-03', name: 'การบริหารโครงการฝึกอบรม (Training Management)', description: 'การวางแผนโครงการ การบริหารงบประมาณ และการประสานงาน' },
          { id: 'sub-svc-04-04', name: 'ด้านเทคโนโลยีเพื่อการฝึกอบรม (Training Technology)', description: 'การใช้เครื่องมือในการอบรม (Google Meet, Microsoft Team)' },
          { id: 'sub-svc-04-05', name: 'การประเมินผล (Training Evaluation)', description: 'การสร้างแบบประเมิน แบบสอบถาม แบบทดสอบ วุฒิบัตร' },
        ],
      },
      {
        id: 'comp-svc-05',
        name: 'ทักษะการบริการวิชาการ (Academic Service)',
        subSkills: [
          { id: 'sub-svc-05-01', name: 'การสนับสนุนเครื่องมือวิจัย (Research Tools)', description: 'ความรู้ในการใช้งานและให้คำปรึกษาในการติดตั้งโปรแกรมที่สนับสนุนงานวิจัย เช่น SPSS, SolidWorks, Matlab' },
          { id: 'sub-svc-05-02', name: 'การบริการชุมชน (Community Outreach)', description: 'การวางแผนโครงการบริการวิชาการด้านเทคโนโลยีสารสนเทศแก่ชุมชน (เช่น การอบรมทางด้านเทคโนโลยีสารสนเทศให้แก่หน่วยงานภายนอก)' },
          { id: 'sub-svc-05-03', name: 'การสนับสนุน E-Learning', description: 'การให้คำปรึกษาอาจารย์ในการใช้ระบบ Learning Management System (LMS) หรือเครื่องมือสอนออนไลน์ เช่น Google Classroom, Microsoft Team' },
          { id: 'sub-svc-05-04', name: 'การบริหารโครงการ (Project Management Skills)', description: 'วางแผนโครงการ บริหารเวลาและทรัพยากร ติดตามความก้าวหน้า แก้ปัญหาเฉพาะหน้า' },
          { id: 'sub-svc-05-05', name: 'การดูแลห้องปฏิบัติการ (Lab Management)', description: 'การบำรุงรักษาเครื่องคอมพิวเตอร์และซอฟต์แวร์ในห้อง Lab ให้พร้อมใช้งานเสมอ' },
          { id: 'sub-svc-05-06', name: 'การจัดการทรัพยากรห้องประชุม/ห้อง Lab', description: 'การบริหารระบบจองห้อง และการอำนวยความสะดวกผู้ใช้งาน' },
          { id: 'sub-svc-05-07', name: 'การพัฒนางานประจำสู่งานวิจัย (R2R)', description: 'การพัฒนาโจทย์งานวิจัยจากปัญหาหรือกระบวนการปฏิบัติงานจริง' },
        ],
      },
      {
        id: 'comp-svc-06',
        name: 'ความรู้การบริการวิชาการ (Academic Service)',
        subSkills: [
          { id: 'sub-svc-06-01', name: 'เข้าใจระบบการให้บริการด้านเทคโนโลยีสารสนเทศ', description: 'ความเข้าใจ Helpdesk, Ticket system และขั้นตอนการให้บริการผู้ใช้' },
          { id: 'sub-svc-06-02', name: 'เข้าใจวิธีการใช้งานและแก้ปัญหาระบบสารสนเทศพื้นฐาน', description: 'การแก้ปัญหาระบบสารสนเทศพื้นฐานของมหาวิทยาลัย' },
          { id: 'sub-svc-06-03', name: 'การบริหารโครงการ (Project Management)', description: 'การเขียนข้อเสนอโครงการ การบริหารงบประมาณ การติดตามและประเมินผล การบริหารความเสี่ยง' },
        ],
      },
      {
        id: 'comp-svc-07',
        name: 'ทักษะการประชาสัมพันธ์และการสื่อสาร (Public Relations & Communication)',
        subSkills: [
          { id: 'sub-svc-07-01', name: 'การสร้างเนื้อหา (Content Creation)', description: 'การเขียนข่าวประชาสัมพันธ์, การออกแบบ Infographic, และการตัดต่อวิดีโอแนะนำบริการ' },
          { id: 'sub-svc-07-02', name: 'การบริหารช่องทางสื่อสาร', description: 'การดูแล Website, Facebook Page และช่องทางอื่นๆ ของสำนักฯ' },
          { id: 'sub-svc-07-03', name: 'การสื่อสารและให้บริการผ่านช่องทางออนไลน์', description: 'การสื่อสารผ่าน Line, Email, Facebook หรือระบบ Help Center' },
          { id: 'sub-svc-07-04', name: 'Service Skill (ทักษะการบริการ)', description: 'การฟังเชิงรุก (Active Listening), ความฉลาดทางอารมณ์ (EQ), การสื่อสารที่ชัดเจน, การแก้ปัญหาเฉพาะหน้า, ความเห็นอกเห็นใจ (Empathy)' },
          { id: 'sub-svc-07-05', name: 'การบริหารจัดการคำร้อง (Service Request Management)', description: 'การรับเรื่องและติดตามสถานะปัญหาของผู้รับบริการ' },
          { id: 'sub-svc-07-06', name: 'การรายงานสถานะ (Status Reporting)', description: 'การสรุปและรายงานปัญหาหรือความคืบหน้าในการดำเนินงานโครงการ หรืองานที่ได้รับมอบหมายให้ผู้บริหารรับทราบ' },
          { id: 'sub-svc-07-07', name: 'การใช้อุปกรณ์สำหรับผลิตสื่อประชาสัมพันธ์', description: 'ทักษะการใช้กล้อง ขาตั้ง ไมโครโฟน และอุปกรณ์สตูดิโอ' },
        ],
      },
      {
        id: 'comp-svc-08',
        name: 'ความรู้การประชาสัมพันธ์และการสื่อสาร (Public Relations & Communication)',
        subSkills: [
          { id: 'sub-svc-08-01', name: 'ความรู้ด้านการสร้างเนื้อหา (Content Creation)', description: 'การเขียนข่าวประชาสัมพันธ์ การออกแบบ Infographic และการตัดต่อวิดีโอแนะนำบริการ' },
          { id: 'sub-svc-08-02', name: 'ความรู้ด้านการวางแผนสื่อและการสื่อสารดิจิทัล', description: 'การวางแผนแคมเปญสื่อสารให้เข้าถึงกลุ่มเป้าหมาย' },
          { id: 'sub-svc-08-03', name: 'ความรู้ด้านสื่อสังคมออนไลน์และแพลตฟอร์มดิจิทัล', description: 'เข้าใจอัลกอริทึมและพฤติกรรมผู้ใช้บน Social Media' },
          { id: 'sub-svc-08-04', name: 'ความรู้ด้านการใช้อุปกรณ์สำหรับผลิตสื่อประชาสัมพันธ์', description: 'การดูแลและใช้งานอุปกรณ์ผลิตสื่ออย่างถูกต้อง' },
        ],
      },
      {
        id: 'comp-svc-09',
        name: 'ความรู้ด้านการส่งเสริมงานวิจัย',
        subSkills: [
          { id: 'sub-svc-09-01', name: 'ระเบียบวิธีวิจัย (Research Methodology)', description: 'ความเข้าใจกระบวนการทำวิจัยเบื้องต้น (การตั้งโจทย์, การเก็บข้อมูล, การวิเคราะห์)' },
          { id: 'sub-svc-09-02', name: 'การจัดการนวัตกรรม (Innovation Management)', description: 'กระบวนการในการเปลี่ยนไอเดียให้เป็นนวัตกรรม หรือการทำ Proof of Concept' },
          { id: 'sub-svc-09-03', name: 'การจัดการองค์ความรู้ (Knowledge Management - KM)', description: 'เทคนิคการรวบรวมและแลกเปลี่ยนความรู้ของบุคลากรภายในสำนักฯ' },
          { id: 'sub-svc-09-04', name: 'ความรู้ด้านการพัฒนางานประจำสู่งานวิจัย (R2R)', description: 'การวิจัยเพื่อพัฒนากระบวนการทำงาน' },
        ],
      },
      {
        id: 'comp-svc-10',
        name: 'ทักษะด้านการบริการจัดการการสอบวัดความรู้ด้านดิจิทัล (DL)',
        subSkills: [
          { id: 'sub-svc-10-01', name: 'การบริหารทรัพยากรในการสอบ', description: 'การจัดห้องสอบ จัดตารางสอบ และการควบคุมการสอบ' },
          { id: 'sub-svc-10-02', name: 'การนำระบบสารสนเทศมาช่วยในการบริหารจัดการการสอบ', description: 'การใช้ระบบลงทะเบียนและระบบคลังข้อสอบออนไลน์' },
          { id: 'sub-svc-10-03', name: 'การสื่อสารกับหน่วยงานที่เกี่ยวข้อง และผู้เข้ารับการทดสอบ', description: 'การแจ้งกำหนดการและผลการทดสอบ' },
        ],
      },
      {
        id: 'comp-svc-11',
        name: 'ความรู้ด้านการบริการจัดการการสอบวัดความรู้ด้านดิจิทัล (DL)',
        subSkills: [
          { id: 'sub-svc-11-01', name: 'ความรู้ด้านการพัฒนาระบบสารสนเทศสำหรับการสอบ', description: 'ความเข้าใจสถาปัตยกรรมระบบสอบออนไลน์' },
          { id: 'sub-svc-11-02', name: 'ความรู้ด้านการสื่อสารกับหน่วยงานที่เกี่ยวข้องและผู้รับการสอบ', description: 'ข้อระเบียบและแนวปฏิบัติในการจัดสอบมาตรฐาน' },
          { id: 'sub-svc-11-03', name: 'ความรู้ด้านการบริหารทรัพยากรในการสอบ', description: 'การจัดสรรคอมพิวเตอร์และเครือข่ายสำหรับห้องสอบ' },
        ],
      },
      {
        id: 'comp-svc-12',
        name: 'AI Competency (ทักษะและความรู้ด้านปัญญาประดิษฐ์)',
        subSkills: [
          { id: 'sub-svc-12-01', name: 'ความรู้ด้านการใช้ AI เพื่อสนับสนุนการปฏิบัติงาน', description: 'การประยุกต์ใช้ Generative AI ในงานประจำวันเพื่อเพิ่ม Productivity' },
          { id: 'sub-svc-12-02', name: 'ความรู้ด้านการตรวจสอบความถูกต้องและข้อจำกัดของ AI', description: 'การทำ Fact Checking และการระวังอาการ Hallucination ของ AI' },
          { id: 'sub-svc-12-03', name: 'ความรู้ด้านจริยธรรม ความปลอดภัย และความรับผิดชอบในการใช้ AI', description: 'AI Ethics, ลิขสิทธิ์ข้อมูล, และความปลอดภัยของข้อมูลองค์กร' },
          { id: 'sub-svc-12-04', name: 'ความรู้เกี่ยวกับ AI / Tools / Prompt / Ethics', description: 'เข้าใจสถาปัตยกรรม LLM, Model Types และการตั้งค่าพารามิเตอร์' },
          { id: 'sub-svc-12-05', name: 'มีทักษะในการใช้ tool / เขียน prompt / ประยุกต์ / integrate / evaluate', description: 'Prompt Engineering, Tool Calling, API Integration และการวัดผลลัพธ์ AI' },
        ],
      },
    ],
  },
];

// -------------------------------------------------------------
// 3. Fiscal Year Configuration Management
// -------------------------------------------------------------
export function getDefaultFiscalYear() {
  const today = new Date();
  const beYear = today.getFullYear() + 543;
  // If month is >= October (month index >= 9), fiscal year is next year
  return today.getMonth() >= 9 ? beYear + 1 : beYear;
}

export function getSkillMapConfig(fiscalYear) {
  const targetYear = Number(fiscalYear) || getDefaultFiscalYear();
  if (typeof window === 'undefined') {
    return {
      fiscalYear: targetYear,
      workAreas: DEFAULT_WORK_AREAS,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };
  }

  try {
    const raw = localStorage.getItem(LOCAL_KEY_SKILL_MAP_CONFIGS);
    if (raw) {
      const allConfigs = JSON.parse(raw);
      if (allConfigs && allConfigs[targetYear]) {
        return allConfigs[targetYear];
      }
    }
  } catch (e) {
    console.error('Failed reading skill map configs from localStorage', e);
  }

  // Return default template
  return {
    fiscalYear: targetYear,
    workAreas: DEFAULT_WORK_AREAS,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system (default)',
  };
}

export async function saveSkillMapConfig(configData) {
  const fiscalYear = Number(configData.fiscalYear) || getDefaultFiscalYear();
  const payload = {
    ...configData,
    fiscalYear,
    updatedAt: new Date().toISOString(),
  };

  // 1. Save LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_SKILL_MAP_CONFIGS);
      const allConfigs = raw ? JSON.parse(raw) : {};
      allConfigs[fiscalYear] = payload;
      localStorage.setItem(LOCAL_KEY_SKILL_MAP_CONFIGS, JSON.stringify(allConfigs));
    } catch (e) {
      console.error('LocalStorage write error for skill configs', e);
    }
  }

  // 2. Sync to Firebase
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'skill_map_configs', `config-${fiscalYear}`), payload);
    } catch (e) {
      console.warn('Firebase sync failed for skill_map_configs', e);
    }
  }

  return payload;
}

export async function cloneSkillMapConfigFromYear(sourceYear, targetYear, operatorName = 'Admin') {
  const srcConfig = getSkillMapConfig(sourceYear);
  const clonedPayload = {
    fiscalYear: Number(targetYear),
    workAreas: JSON.parse(JSON.stringify(srcConfig.workAreas || DEFAULT_WORK_AREAS)),
    updatedAt: new Date().toISOString(),
    updatedBy: `โคลนจากปี ${sourceYear} โดย ${operatorName}`,
  };

  return await saveSkillMapConfig(clonedPayload);
}

// -------------------------------------------------------------
// 4. Assessment Calculation & Storage
// -------------------------------------------------------------
export function calculateAssessmentSummary(workAreas, ratings = {}) {
  let totalSubSkills = 0;
  let completedCount = 0;
  let totalScore = 0;

  const areaSummaries = {};
  const competencySummaries = {};

  (workAreas || []).forEach((area) => {
    let areaTotalScore = 0;
    let areaSubSkillCount = 0;
    let areaCompletedCount = 0;

    (area.competencies || []).forEach((comp) => {
      let compTotalScore = 0;
      let compSubSkillCount = (comp.subSkills || []).length;
      let compCompletedCount = 0;

      (comp.subSkills || []).forEach((sub) => {
        totalSubSkills++;
        areaSubSkillCount++;
        const score = ratings[sub.id];
        if (score !== undefined && score !== null && score !== '') {
          const numScore = Number(score);
          completedCount++;
          areaCompletedCount++;
          compCompletedCount++;
          totalScore += numScore;
          areaTotalScore += numScore;
          compTotalScore += numScore;
        }
      });

      competencySummaries[comp.id] = {
        competencyId: comp.id,
        name: comp.name,
        areaId: area.id,
        areaName: area.shortName || area.name,
        totalSubSkills: compSubSkillCount,
        completedCount: compCompletedCount,
        averageScore: compCompletedCount > 0 ? Number((compTotalScore / compCompletedCount).toFixed(2)) : 0,
      };
    });

    areaSummaries[area.id] = {
      areaId: area.id,
      name: area.name,
      shortName: area.shortName || area.name,
      color: area.color,
      totalSubSkills: areaSubSkillCount,
      completedCount: areaCompletedCount,
      averageScore: areaCompletedCount > 0 ? Number((areaTotalScore / areaCompletedCount).toFixed(2)) : 0,
    };
  });

  const overallAverage = completedCount > 0 ? Number((totalScore / completedCount).toFixed(2)) : 0;
  const completionPercentage = totalSubSkills > 0 ? Math.round((completedCount / totalSubSkills) * 100) : 0;

  return {
    totalSubSkills,
    completedCount,
    completionPercentage,
    overallAverage,
    areaSummaries,
    competencySummaries,
  };
}

export function getAllAssessments(fiscalYear) {
  const targetYear = fiscalYear ? Number(fiscalYear) : null;
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(LOCAL_KEY_SKILL_MAP_ASSESSMENTS);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return targetYear ? list.filter((a) => Number(a.fiscalYear) === targetYear) : list;
      }
    }
  } catch (e) {
    console.error('Failed reading assessments from localStorage', e);
  }
  return [];
}

export function getAssessmentByPersonnel(personnelId, fiscalYear) {
  const targetYear = Number(fiscalYear) || getDefaultFiscalYear();
  const all = getAllAssessments(targetYear);
  return all.find((a) => a.personnelId === personnelId && Number(a.fiscalYear) === targetYear) || null;
}

export async function saveSkillMapAssessment(assessmentData) {
  const fiscalYear = Number(assessmentData.fiscalYear) || getDefaultFiscalYear();
  const id = assessmentData.id || `eval-${fiscalYear}-${assessmentData.personnelId}`;
  
  const payload = {
    ...assessmentData,
    id,
    fiscalYear,
    updatedAt: new Date().toISOString(),
    submittedAt: assessmentData.submittedAt || new Date().toISOString(),
  };

  // 1. LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_KEY_SKILL_MAP_ASSESSMENTS);
      let list = raw ? JSON.parse(raw) : [];
      const existingIdx = list.findIndex((a) => a.id === id);
      if (existingIdx >= 0) {
        list[existingIdx] = payload;
      } else {
        list.unshift(payload);
      }
      localStorage.setItem(LOCAL_KEY_SKILL_MAP_ASSESSMENTS, JSON.stringify(list));
    } catch (e) {
      console.error('LocalStorage write error for assessment', e);
    }
  }

  // 2. Firebase
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'skill_map_assessments', id), payload);
    } catch (e) {
      console.warn('Firebase sync error for assessment', e);
    }
  }

  return payload;
}

// -------------------------------------------------------------
// 5. ICIT Vision & Mission Aligned Intelligent Analysis Engine
// -------------------------------------------------------------
export const ICIT_VISION = 'สร้างสรรค์ Digital Lifestyle ในรั้ว มจพ.';
export const ICIT_MISSIONS = [
  {
    id: 'm1',
    title: 'พัฒนาโครงสร้างพื้นฐานระบบเทคโนโลยีสารสนเทศและการสื่อสารทางดิจิทัลของมหาวิทยาลัย',
    targetAreas: ['area-network'],
    coreSkills: ['comp-net-01', 'comp-net-02', 'comp-net-03', 'comp-net-05'],
  },
  {
    id: 'm2',
    title: 'พัฒนาระบบเทคโนโลยีสารสนเทศเพื่อสนับสนุนการบริหารจัดการงานของมหาวิทยาลัย',
    targetAreas: ['area-dev', 'area-admin'],
    coreSkills: ['comp-dev-01', 'comp-dev-02', 'comp-dev-03', 'comp-dev-07', 'comp-admin-07'],
  },
  {
    id: 'm3',
    title: 'บริการเทคโนโลยีสารสนเทศเพื่อสนับสนุนการเรียนการสอน การค้นคว้าวิจัย และการปฏิบัติงานในมหาวิทยาลัย',
    targetAreas: ['area-service', 'area-dev'],
    coreSkills: ['comp-svc-01', 'comp-svc-05', 'comp-svc-09', 'comp-dev-08'],
  },
  {
    id: 'm4',
    title: 'บริการวิชาการด้านเทคโนโลยีสารสนเทศ เพื่อการพัฒนาทักษะทางดิจิทัลแก่นักศึกษาและบุคลากร',
    targetAreas: ['area-service'],
    coreSkills: ['comp-svc-03', 'comp-svc-04', 'comp-svc-10', 'comp-svc-11', 'comp-svc-12'],
  },
  {
    id: 'm5',
    title: 'บริการพื้นที่แลกเปลี่ยนรู้และห้องปฏิบัติการเพื่อการเรียนการสอน และการอบรม',
    targetAreas: ['area-service', 'area-admin'],
    coreSkills: ['comp-svc-05', 'comp-svc-07', 'comp-admin-08'],
  },
];

/**
 * Intelligent Rule-Based Skill Analysis aligned with ICIT Vision & 5 Missions
 */
export function generateIntelligentAnalysis(personnel, assessment, workAreas) {
  const summary = calculateAssessmentSummary(workAreas, assessment?.ratings || {});
  const ratings = assessment?.ratings || {};

  const highSkills = [];
  const mediumSkills = [];
  const developmentNeeded = [];

  (workAreas || []).forEach((area) => {
    (area.competencies || []).forEach((comp) => {
      (comp.subSkills || []).forEach((sub) => {
        const score = Number(ratings[sub.id] ?? -1);
        if (score >= 4) {
          highSkills.push({ ...sub, score, compName: comp.name, areaName: area.shortName || area.name });
        } else if (score === 3) {
          mediumSkills.push({ ...sub, score, compName: comp.name, areaName: area.shortName || area.name });
        } else if (score >= 0 && score <= 2) {
          developmentNeeded.push({ ...sub, score, compName: comp.name, areaName: area.shortName || area.name });
        }
      });
    });
  });

  // Calculate alignment with ICIT 5 Missions
  const missionAlignments = ICIT_MISSIONS.map((m) => {
    let missionScoreSum = 0;
    let missionCount = 0;

    m.coreSkills.forEach((compId) => {
      const compSummary = summary.competencySummaries[compId];
      if (compSummary && compSummary.completedCount > 0) {
        missionScoreSum += compSummary.averageScore;
        missionCount++;
      }
    });

    const avg = missionCount > 0 ? Number((missionScoreSum / missionCount).toFixed(1)) : 0;
    let statusText = 'ต้องพัฒนาเพิ่ม';
    let statusColor = '#EF4444';
    if (avg >= 4) {
      statusText = 'เป็นเลิศและเป็นต้นแบบ (Role Model)';
      statusColor = '#10B981';
    } else if (avg >= 3) {
      statusText = 'ปฏิบัติงานได้ตามมาตรฐาน (Standard)';
      statusColor = '#3B82F6';
    } else if (avg >= 2) {
      statusText = 'กำลังพัฒนาสู่เกณฑ์ (Developing)';
      statusColor = '#F59E0B';
    }

    return {
      missionId: m.id,
      title: m.title,
      score: avg,
      statusText,
      statusColor,
    };
  });

  // Strengths Summary
  const topStrengths = highSkills.slice(0, 5).map(
    (s) => `[${s.areaName}] ${s.name} (ระดับ ${s.score}/5: เชี่ยวชาญและถ่ายทอดได้)`
  );
  if (topStrengths.length === 0) {
    topStrengths.push('มีความกระตือรือร้นในการเรียนรู้และมีศักยภาพในการพัฒนาทักษะสู่ระดับมาตรฐาน');
  }

  // Development Opportunities
  const topDevAreas = developmentNeeded.slice(0, 5).map(
    (s) => `[${s.areaName}] ${s.name} (ระดับ ${s.score}/5: ควรเสริมทฤษฎีและการฝึกปฏิบัติ)`
  );
  if (topDevAreas.length === 0) {
    topDevAreas.push('ทักษะส่วนใหญ่อยู่ในเกณฑ์มาตรฐานและระดับสูง สามารถต่อยอดสู่การเป็น Mentor ให้แก่เพื่อนร่วมงาน');
  }

  // Strategic Vision Recommendations
  const strategicRecommendations = [
    `เสริมพลังขับเคลื่อนวิสัยทัศน์ "${ICIT_VISION}" โดยนำจุดเด่นด้าน ${highSkills[0]?.name || 'เทคโนโลยีดิจิทัล'} มาประยุกต์ใช้เพื่อยกระดับการให้บริการแก่อาจารย์ นักศึกษา และบุคลากร มจพ.`,
    `มุ่งเน้นการยกระดับทักษะด้าน AI Competency และการทำงานแบบบูรณาการข้ามสายงาน (Cross-functional collaboration) ระหว่างฝ่าย`,
    `จัดทำแผนพัฒนาตนเอง (IDP) ประจำปีงบประมาณเพื่อปิดช่องว่างทักษะในหัวข้อที่ได้คะแนน 1-2 ให้ก้าวสู่ระดับ 3 (มาตรฐาน) ภายใน 6-12 เดือน`,
  ];

  // Tailored Course Suggestions
  const recommendedCourses = [];
  if (developmentNeeded.some((s) => s.name.includes('AI') || s.compName.includes('AI'))) {
    recommendedCourses.push('Generative AI for Productivity & Prompt Engineering Workshop');
  }
  if (developmentNeeded.some((s) => s.name.includes('Cybersecurity') || s.compName.includes('ความปลอดภัย') || s.name.includes('PDPA'))) {
    recommendedCourses.push('Cybersecurity Awareness & PDPA Practical Compliance for IT Staff');
  }
  if (developmentNeeded.some((s) => s.name.includes('Dashboard') || s.name.includes('วิเคราะห์ข้อมูล'))) {
    recommendedCourses.push('Interactive Data Dashboard & Analytics with Power BI / Looker Studio');
  }
  if (developmentNeeded.some((s) => s.name.includes('สื่อสาร') || s.name.includes('บริการ') || s.name.includes('Service'))) {
    recommendedCourses.push('Service Mind & Effective Cross-functional Communication Mastery');
  }
  if (developmentNeeded.some((s) => s.name.includes('เครือข่าย') || s.name.includes('Server') || s.name.includes('Cloud'))) {
    recommendedCourses.push('Modern Cloud Infrastructure & Enterprise Network Troubleshooting');
  }
  if (recommendedCourses.length === 0) {
    recommendedCourses.push(
      'Advanced Technology Leadership & Mentoring in Higher Education',
      'Continuous Innovation & Digital Transformation Strategy'
    );
  }

  return {
    vision: ICIT_VISION,
    personnelName: personnel?.name || 'บุคลากร',
    position: personnel?.position || 'บุคลากร',
    department: personnel?.department || 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',
    overallAverage: summary.overallAverage,
    completionPercentage: summary.completionPercentage,
    strengths: topStrengths,
    developmentAreas: topDevAreas,
    strategicRecommendations,
    recommendedCourses,
    missionAlignments,
    analyzedAt: new Date().toISOString(),
  };
}
