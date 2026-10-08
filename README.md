# 🏢 ICIT Workspace (สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.)
> **Enterprise Digital Workspace & Integrated Organization Management Platform**  
> *สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (ICIT KMUTNB)*

---

## 🌟 ภาพรวมระบบ (Overview)
**ICIT Workspace** เป็นระบบดิจิทัลพอร์ทัลแบบครบวงจรที่รวมศูนย์บริการดิจิทัล, การบริหารทรัพยากรบุคคล (HR & Talent Management), การประเมินสมรรถนะและทักษะดิจิทัล, การบริหารจัดการความรู้ (KM), การตรวจติดตามคุณภาพและมาตรฐานสากล (ISO 9001 / ISO 27001 / TQA) พร้อมระบบบันทึกประวัติการใช้งานและ Audit Trail อัจฉริยะ 19 หมวดหมู่

---

## 📚 เอกสารกำกับระบบฉบับสมบูรณ์ (Documentation)

- 📖 **[คู่มือและเอกสารสถาปัตยกรรมระบบทั้งแอปพลิเคชัน (Full System Documentation)](./APP_DOCUMENTATION.md)**: สารบัญและรายละเอียดครบทั้ง 12 โมดูล, โครงสร้างฐานข้อมูล 26 คอลเลกชัน, สิทธิ์ความปลอดภัย RBAC, และการเชื่อมต่อ API
- 📋 **[เอกสารระบบบันทึกประวัติกิจกรรมและ Audit Trail (Activity Logs Specification)](./ACTIVITY_LOGS_SPECIFICATION.md)**: รายละเอียด 19 หมวดหมู่ Action Codes, โครงสร้าง Log Schema, Dynamic Dashboard Metrics, และ Date Range Filter

---

## 🚀 โมดูลและบริการหลัก (Core Modules)

1. 🌐 **Portal & Directory (`/`)**: พอร์ทัลรวมลิงก์บริการดิจิทัล ค้นหาบุคลากร และทำเนียบบุคลากร
2. 👤 **User Profile (`/profile`)**: บัตรดิจิทัลส่วนตัว ตรวจสอบ JD, IDP, โควตาวันลา และประวัติการลงเวลา
3. 🏢 **Organization (`/organization`)**: แผนผังโครงสร้างฝ่ายงาน ภารกิจ และทำเนียบคณะผู้บริหาร
4. ⏱️ **Time & Attendance (`/time-attendance`)**: ขอลงเวลาย้อนหลัง WFH และ OT พร้อม Workflow อนุมัติ 4 ขั้นตอน
5. 📅 **Leave Management (`/leave`)**: ระบบยื่นใบลา คำนวณโควตาอัตโนมัติ และปฏิทินวันลาสำนักฯ
6. 📄 **JD Hub (`/jd-hub`)**: แบบบรรยายลักษณะงาน กำหนดมาตรฐานภาษาอังกฤษ (CEFR B1+) และระบบกดยืนยัน
7. 🎯 **IDP Hub (`/idp-hub`)**: แผนพัฒนารายบุคคล วิเคราะห์ Need Analysis และจัดทำ 4-Quarter Action Plan
8. 📊 **Digital Skill Map (`/skill-map`)**: ประเมินทักษะดิจิทัล 4 กลุ่มงาน กราฟเรดาร์ และ AI ให้คำแนะนำ
9. 📚 **KM Hub (`/km-hub`)**: คลังความรู้ สรุปการฝึกอบรม และแบบฟอร์มเอกสารมาตรฐาน
10. 🛡️ **IMS Quality Hub (`/ims`)**: ตรวจประเมินภายใน (Audit), จัดการข้อบกพร่อง (CAR) และข้อเสนอแนะ (OFI)
11. 🏆 **TQA Quality Hub (`/tqa`)**: ติดตามผลการดำเนินงาน 7 หมวดรางวัลคุณภาพแห่งชาติ และ Feedback Report
12. ⚙️ **Admin Console & Audit Logs (`/admin`)**: จัดการข้อมูลบุคลากร ผู้บริหาร ฝ่ายงาน และระบบตรวจสอบย้อนหลัง

---

## 💻 การติดตั้งและรันในเครื่อง (Getting Started)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. รันโหมด Development
npm run dev

# 3. ตรวจสอบการ Build สำหรับ Production
npm run build
```

เปิดเบราว์เซอร์เข้าใช้งานที่ `http://localhost:3000`

---

*สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (ICIT KMUTNB)*
