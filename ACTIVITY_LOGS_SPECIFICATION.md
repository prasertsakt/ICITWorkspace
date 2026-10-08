# 📋 คู่มือและเอกสารสถาปัตยกรรมระบบบันทึกประวัติกิจกรรมและตรวจสอบย้อนหลัง (System Audit & Activity Logs Specification)
**สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (ICIT KMUTNB)**

---

## 1. วัตถุประสงค์ (Objectives)
ระบบบันทึกประวัติกิจกรรมและตรวจสอบย้อนหลัง (**System Audit Trail & Activity Logging Engine**) ได้รับการออกแบบและพัฒนาขึ้นเพื่อ:
1. **ความโปร่งใสและตรวจสอบย้อนหลังได้ (Traceability & Accountability)**: สามารถตรวจสอบเหตุการณ์และกิจกรรมสำคัญทุกประเภทในระบบ เช่น ใคร (Who), ทำอะไร (What), กับข้อมูลใด (Target Entity), ที่หน้าไหน (Route), เมื่อใด (When) และผลลัพธ์สำเร็จหรือล้มเหลว (Status)
2. **ครอบคลุมทุกโมดูลและบริการใหม่ (Comprehensive Coverage)**: บันทึกทั้งการเข้าสู่ระบบ/ออกจากระบบ (Auth), การเปิดเข้าชมหน้าเว็บ (Page Views), การสร้าง แก้ไข ลบ (CRUD), การอนุมัติ (Workflow Approvals), การจัดเรียง (Reordering), การส่งอีเมลแจ้งเตือน (Emails) และการจัดการมาตรฐาน (Quality/IMS/TQA)
3. **ประสิทธิภาพและการประหยัดโควตา Firestore (Optimized Writes & Debounce)**: ป้องกันปัญหาการเขียนข้อมูลซ้ำซ้อนด้วยเทคนิค In-Memory Debounce (15 วินาทีสำหรับ Page Views) และ Atomic Batching
4. **ความมั่นคงปลอดภัยตามมาตรฐาน PDPA & ISO/IEC 27001**: รองรับการตรวจสอบการเข้าใช้งานที่ไม่ได้รับอนุญาต (Unauthorized Login Rejections) และจำกัดสิทธิ์การล้างประวัติเฉพาะระดับผู้ดูแลระบบ (Admin) เท่านั้น

---

## 2. หมวดหมู่กิจกรรม (Activity Categories & Action Codes)

ระบบจำแนกประเภทกิจกรรมออกเป็น **19 หมวดหมู่หลัก** พร้อมรหัส Action มาตรฐาน:

| หมวดหมู่ (Category Key) | ป้ายกำกับ (Label) | ตัวอย่างการกระทำ (Action Codes) | รายละเอียดที่บันทึก |
| :--- | :--- | :--- | :--- |
| `AUTH` | การเข้าสู่ระบบ | `LOGIN_SUCCESS`, `LOGIN_REJECTED`, `LOGOUT` | บันทึกการล็อกอินด้วย Google OAuth, บัญชีที่ไม่ได้รับอนุญาต (Whitelist Failure), บุคลากรที่ลาออกแล้ว, และการออกจากระบบ |
| `PAGE_VIEW` | การเข้าชมหน้าเว็บ | `PAGE_VIEW` | บันทึกการเปลี่ยนหน้า (Route Transition) พร้อม Debounce 15 วินาที/ผู้ใช้/หน้า |
| `PERSONNEL` | จัดการบุคลากร | `CREATE_PERSONNEL`, `UPDATE_PERSONNEL`, `DELETE_PERSONNEL` | บันทึกการเพิ่ม, แก้ไขข้อมูลส่วนบุคคล, ตำแหน่ง, ฝ่ายงาน, บทบาท และการลบบุคลากร |
| `ATTENDANCE` | ขอลงเวลา/WFH/OT | `CREATE_TIME_ATTENDANCE`, `APPROVE_ATTENDANCE_*`, `CANCEL_TIME_ATTENDANCE`, `DELETE_TIME_ATTENDANCE` | บันทึกการยื่นคำขอลงเวลา, การตรวจสอบ 4 ขั้นตอน (HR, พยาน, หัวหน้าฝ่าย, รอง ผอ.), การยกเลิก และการลบ |
| `LEAVE` | ปฏิทินวันลา | `CREATE_LEAVE`, `UPDATE_LEAVE`, `DELETE_LEAVE`, `ARCHIVE_LEAVES` | บันทึกการลงปฏิทินวันลา, การแก้ไขจำนวนวันลา, การลบวันลา และการจัดเก็บข้อมูลเก่า |
| `EXECUTIVE` | คณะผู้บริหาร | `CREATE_EXECUTIVE`, `UPDATE_EXECUTIVE`, `REORDER_EXECUTIVES`, `DELETE_EXECUTIVE` | บันทึกการแต่งตั้ง/แก้ไขรายชื่อผู้บริหาร, การลบ และการลากจัดเรียงลำดับการแสดงผล |
| `DEPARTMENT` | โครงสร้างฝ่ายงาน | `CREATE_DEPARTMENT`, `UPDATE_DEPARTMENT` | บันทึกการปรับปรุงข้อมูลฝ่ายงาน, หัวหน้าฝ่าย และภารกิจ |
| `JD_HUB` | แบบบรรยายลักษณะงาน | `CREATE_JD`, `UPDATE_JD`, `CONFIRM_JD`, `DELETE_JD`, `UPDATE_JD_CONFIG` | บันทึกการจัดทำ JD, การแก้ไขรายละเอียด, การกดยืนยันความถูกต้อง (User Confirmation), การตั้งค่าช่วงเวลาเปิด-ปิด |
| `IDP` | แผนพัฒนารายบุคคล | `CREATE_IDP_RECORD`, `UPDATE_IDP_RECORD`, `DELETE_IDP_RECORD`, `UPDATE_IDP_CONFIG`, `UPDATE_STRATEGY_CONFIG` | บันทึกการประเมินตนเอง, การประเมินโดยหัวหน้างาน, การกำหนดเกณฑ์สมรรถนะ Core/Functional และยุทธศาสตร์ |
| `IDP_ACTION_PLAN` | แผนปฏิบัติการ IDP | `CREATE_IDP_ACTION_PLAN`, `UPDATE_IDP_ACTION_PLAN`, `DELETE_IDP_ACTION_PLAN` | บันทึกการแปลงช่องว่างทักษะ (Need Analysis) สู่แผนปฏิบัติการพัฒนา 4 ไตรมาส |
| `SKILL_MAP` | แผนที่ทักษะบุคลากร | `SUBMIT_SKILL_MAP_ASSESSMENT`, `UPDATE_SKILL_MAP_CONFIG`, `CLONE_SKILL_MAP_CONFIG` | บันทึกการทำแบบประเมินทักษะ 4 กลุ่มงาน (0-5), การปรับปรุงโครงสร้างทักษะ และการคัดลอกจากปีก่อน |
| `KM_HUB` | องค์ความรู้ & อบรม | `CREATE_KM_RECORD`, `UPDATE_KM_RECORD`, `DELETE_KM_RECORD`, `UPDATE_KM_DOC_CONFIG` | บันทึกประวัติการอบรม, การถ่ายทอดความรู้, การแนบเอกสาร และการตั้งค่าคู่มือ KM |
| `IMS_AUDIT` | ตรวจติดตามภายใน | `CREATE_AUDIT`, `UPDATE_AUDIT`, `DELETE_AUDIT` | บันทึกการตรวจประเมินระบบบริหารจัดการมาตรฐานสากล |
| `IMS_CAR` | จัดการ CAR | `CREATE_CAR`, `UPDATE_CAR_STATUS`, `DELETE_CAR` | บันทึกใบคำขอแก้ไขข้อบกพร่อง และการจัดการอุบัติการณ์ |
| `IMS_OFI` | ติดตาม OFI ภายใน | `CREATE_IMS_OFI`, `UPDATE_IMS_OFI_STATUS` | บันทึกข้อเสนอแนะเพื่อการปรับปรุงภายในระบบ IMS |
| `TQA_OFI` | รายงานผล TQA OFI | `CREATE_TQA_OFI`, `UPDATE_TQA_OFI`, `DELETE_TQA_OFI`, `UPDATE_TQA_REPORT_CONFIG` | บันทึกการรายงานผล 3 รอบของหมวด 1-7 TQA และการแนบ Feedback Report |
| `EMAIL` | การส่งอีเมลแจ้งเตือน | `EMAIL_DISPATCH`, `EMAIL_FAILED` | บันทึกการส่งอีเมล Workflow, ผู้รับ, หัวข้อ และสถานะการจัดส่ง (Delivered/Sandbox) |
| `PORTAL` | หน้าหลักพอร์ทัล | `CREATE_PORTAL_CARD`, `UPDATE_PORTAL_CARD`, `REORDER_PORTAL_CARDS`, `DELETE_PORTAL_CARD` | บันทึกการเพิ่ม/แก้ไขการ์ดบริการ และการจัดเรียงลำดับการ์ดบนหน้า Portal |
| `SYSTEM` | ระบบและความปลอดภัย | `SYSTEM_SEED`, `CLEAR_LOGS`, `BACKUP` | บันทึกการตั้งค่าระบบ, การล้างข้อมูลแคช และเหตุการณ์ความปลอดภัย |

---

## 3. โครงสร้างข้อมูลบันทึกประวัติ (Audit Log Schema)

```typescript
interface ActivityLogItem {
  id: string; // เช่น log-1791234567890-abc4 หรือ email-1791234567890
  action: string; // เช่น 'LOGIN_SUCCESS', 'CREATE_LEAVE', 'UPDATE_JD'
  category: string; // ดูตาราง Activity Categories
  status: 'SUCCESS' | 'SIMULATED' | 'FAILED' | 'ERROR';
  title: string; // สรุปใจความสำคัญของกิจกรรมที่เข้าใจง่าย
  details: string; // รายละเอียดเชิงบรรยายของการกระทำ
  actor: {
    id?: string;
    name: string; // ชื่อผู้กระทำ เช่น "รศ. ดร.ประเสริฐศักดิ์ เตียวงศ์สมบัติ"
    email?: string; // อีเมลผู้กระทำ เช่น "prasertsak.t@cit.kmutnb.ac.th"
    role?: string; // บทบาท เช่น "Admin" หรือ "USER"
    department?: string; // ฝ่ายงาน
  };
  target?: {
    id?: string; // รหัสเอกสาร/ข้อมูลเป้าหมาย
    name?: string; // ชื่อข้อมูลเป้าหมาย
    type?: string; // ประเภท เช่น 'LEAVE', 'JD_RECORD', 'TIME_ATTENDANCE'
  };
  metadata?: Record<string, any>; // พารามิเตอร์เพิ่มเติม เช่น payload diff, error message, ip/device
  loggedAt: string; // ISO 8601 Timestamp
  createdAt?: any; // Firestore serverTimestamp()
}
```

---

## 4. สรุปการปรับปรุงหน้าจอ Admin Dashboard (`AdminActivityLogsTab.js`)

1. **Dashboard KPI Metric Cards (7 มิติหลัก)**:
   - กิจกรรมทั้งหมด (Total Activities)
   - การเข้าสู่ระบบ & เข้าชมหน้าเว็บ (Auth & Visits)
   - บุคลากร & โครงสร้างฝ่ายงาน (Personnel & Org)
   - ขอลงเวลา & ปฏิทินวันลา (Attendance & Leave)
   - การพัฒนาบุคลากร (JD Hub, IDP & Skill Map)
   - การจัดการความรู้ & มาตรฐานคุณภาพ (KM Hub, IMS & TQA)
   - การส่งอีเมลแจ้งเตือน (Email Dispatches)

2. **ระบบสืบค้นและตัวกรองอัจฉริยะ (Intelligent Search & Multi-Filter)**:
   - กล่องค้นหาแบบ Real-Time (ค้นหาชื่อผู้ดำเนินการ, อีเมล, หัวข้อ, รหัส Action, ชื่อเป้าหมาย หรือ JSON metadata)
   - ตัวกรองช่วงเวลา: วันนี้ (Today), 7 วันล่าสุด, 30 วันล่าสุด หรือทั้งหมด
   - ตัวกรองสถานะ: 🟢 สำเร็จ, 🟡 โหมดจำลอง/เตือน, 🔴 ไม่สำเร็จ
   - แถบป้ายตัวกรองหมวดหมู่ (Category Chips) ครบทั้ง 19 หมวดหมู่พร้อมระบุจำนวนตัวเลขสถิติแบบ Real-Time

3. **ตารางบันทึกประวัติ (Audit Trail Data Table)**:
   - ป้ายกำกับหมวดหมู่พร้อมไอคอนและสีประจำหมวด
   - รหัส Action Tag (Monospace Code)
   - ชื่อและอีเมลผู้ดำเนินการ พร้อมสถานะ Role
   - เป้าหมายที่ได้รับผลกระทบ (Target Entity Chip)
   - วันที่และเวลามาตรฐานไทย (พ.ศ.)
   - ปุ่มกดตรวจสอบข้อมูลเชิงลึก (Inspection Modal)

4. **หน้าต่างตรวจสอบข้อมูลเชิงลึก (Log Inspection Modal)**:
   - แถบหัวข้อพร้อมสถานะและรหัสกิจกรรม
   - สรุปข้อมูลผู้กระทำและข้อมูลเป้าหมาย
   - ตัวแสดงผล JSON Payload & Metadata Tree พร้อม syntax color และปุ่ม Copy Log ID

5. **ระบบส่งออกข้อมูล (Export Engine)**:
   - **Export CSV**: ส่งออกไฟล์ CSV พร้อมเข้ารหัส UTF-8 BOM (`\uFEFF`) รองรับการเปิดด้วย Microsoft Excel ภาษาไทยโดยไม่มีปัญหาตัวอักษรต่างดาว
   - **Export JSON**: ส่งออกไฟล์ Raw JSON เพื่อการสำรองข้อมูลหรือนำไปวิเคราะห์ต่อ

---

## 5. กฎความปลอดภัย Cloud Firestore (`firestore.rules`)

เพิ่มความปลอดภัยสำหรับคอลเลกชัน `activity_logs` และ `email_logs`:

```javascript
// 24. Rules for 'km_doc_configs' collection (KM Hub Guidelines & Document Attachments)
match /km_doc_configs/{configId} {
  allow read: if true;
  allow write: if isAuthenticated();
}

// 25. Rules for 'activity_logs' collection (System Audit & User Activities)
match /activity_logs/{logId} {
  allow read: if isAuthenticated();
  allow create: if true; // อนุญาตให้บันทึก Authentication Failures และ Page Views ได้
  allow update, delete: if isHrOrAdmin();
}

// 26. Rules for 'email_logs' collection (Email Dispatch Audit Logs)
match /email_logs/{emailId} {
  allow read: if isAuthenticated();
  allow create: if true;
  allow update, delete: if isHrOrAdmin();
}
```

---

## 6. คำแนะนำในการนำไปใช้ (Deployment & Verification)

1. คัดลอกและนำเนื้อหากฎใน `firestore.rules` ไปวางในแท็บ **Rules** บน [Firebase Console](https://console.firebase.google.com/) แล้วกด **Publish**
2. ใช้งานระบบตามปกติ ประวัติกิจกรรมและการเข้าชมหน้าเว็บของผู้ใช้จะเริ่มบันทึกและแสดงผลบนแท็บ **Admin -> ประวัติกิจกรรม** แบบ Real-Time ทันที
