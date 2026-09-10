// Real-Time IMS (Integrated Management System) Service
// Handles Internal Audit Reports, Lead IA approvals, and Yearly Auditor assignments
import { db, isFirebaseConfigured } from './firebase';
import { logActivity } from './activityLogService';
import { logEmailToFirestore } from './emailNotificationService';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

const LOCAL_KEY_IMS_AUDITS = 'icit_ims_audits';
const LOCAL_KEY_IMS_CONFIG_PREFIX = 'icit_ims_config_';

// Initial Seed Audits matching the user's AppSheet screenshots
export const SEED_IMS_AUDITS = [
  {
    id: 'audit-2569-001',
    auditYear: '2569',
    isoStandard: 'IMS 9001/27001',
    auditDate: '2026-01-13',
    auditor1Id: 'auditor-1',
    auditor1Name: 'นางสาวไข่มุก สรรพวุธ',
    auditor1Email: 'kaimook.s@icit.kmutnb.ac.th',
    hasSecondAuditor: true,
    auditor2Id: 'auditor-2',
    auditor2Name: 'นางศรินญา พงศ์สุริยา',
    auditor2Email: 'sarinya.p@icit.kmutnb.ac.th',
    auditee1Id: 'auditee-1',
    auditee1Name: 'นายพีรพันธ์ รุจิพงษ์กุล',
    auditeeDepartment: 'ฝ่ายวิศวกรรมระบบเครือข่าย',
    topic: 'Client computer management, Office areas',
    item: 'ตรวจสอบพื้นที่การทำงานของฝ่ายวิศวกรรมฯ - สอบถามการเข้าใช้งานเครื่องคอมพิวเตอร์ กรณีอยู่นอกสถานที่',
    clauses: 'IS: A6.7, A7.9',
    expectedEvidence: '- โปรแกรมที่เข้าใช้งานมีความน่าเชื่อถือ\n- เจ้าของเครื่องควรเข้าถึงจากภายนอกได้เพียงผู้เดียว กรณีใช้เครื่องคนอื่นเข้ามา ต้องไม่มีการ Save Password',
    status: 'COMPLETED',
    approvedByLeadIA: true,
    approvedAt: '2026-01-10T09:30:00.000Z',
    approvedByName: 'รศ. ดร.ประเสริฐศักดิ์ เตียวงค์สมบัติ (Lead Auditor)',
    approvedByEmail: 'prasertsak.t@cit.kmutnb.ac.th',
    findings: 'ได้มีการสอบถามถึงเครื่องคอมพิวเตอร์อีกตัวที่อยู่บนโต๊ะของคุณพีรพันธ์แต่ไม่ได้เปิดใช้งาน ซึ่งเอาไว้ใช้สำหรับอุปกรณ์ 1 ตัวที่ต้องเปิดผ่าน Browser Safari เวอร์ชั่นเก่า โดยการ Remote เข้ามาดำเนินการ และได้ให้ทดสอบการ Remote เข้ามา โดยใช้ Notebook ที่ใช้เป็นประจำในการ Remote ซึ่งต้อง VPN ก่อน จึงจะ Remote ด้วยโปรแกรม Remote Desktop ได้ ซึ่งทั้ง Notebook และเครื่องคอมพิวเตอร์มีการใส่รหัสผ่านไว้',
    recommendation: 'ควรหมั่นตรวจสอบการอัปเดต Security Patch ของระบบ Remote อย่างต่อเนื่อง',
    result: 'C',
    evaluatedAt: '2026-01-13T14:45:00.000Z',
    evaluatedByName: 'นางสาวไข่มุก สรรพวุธ',
    createdByEmail: 'kaimook.s@icit.kmutnb.ac.th',
    createdByName: 'นางสาวไข่มุก สรรพวุธ',
    createdAt: '2026-01-08T08:00:00.000Z',
    updatedAt: '2026-01-13T15:00:00.000Z',
  },
  {
    id: 'audit-2569-002',
    auditYear: '2569',
    isoStandard: 'IMS 9001/27001',
    auditDate: '2026-02-18',
    auditor1Id: 'auditor-1',
    auditor1Name: 'นางสาวไข่มุก สรรพวุธ',
    auditor1Email: 'kaimook.s@icit.kmutnb.ac.th',
    hasSecondAuditor: false,
    auditor2Id: '',
    auditor2Name: '',
    auditor2Email: '',
    auditee1Id: 'auditee-2',
    auditee1Name: 'นายสุรชัย ประสิทธิ์โชค',
    auditeeDepartment: 'ฝ่ายบริการวิชาการและส่งเสริมการวิจัย',
    topic: 'Document and record control',
    item: 'การจัดเก็บและควบคุมการแก้ไขเอกสารสารสนเทศตามกระบวนการคุณภาพ',
    clauses: '9001: 7.5, IS: A5.37',
    expectedEvidence: '- บัญชีแม่บทเอกสาร (Master List of Documents) มีสถานะเป็นปัจจุบัน\n- มีการระบุผู้มีอำนาจอนุมัติเอกสารและบันทึกการจัดเก็บตามกำหนด',
    status: 'READY_FOR_AUDIT',
    approvedByLeadIA: true,
    approvedAt: '2026-02-10T11:00:00.000Z',
    approvedByName: 'รศ. ดร.ประเสริฐศักดิ์ เตียวงค์สมบัติ (Lead Auditor)',
    approvedByEmail: 'prasertsak.t@cit.kmutnb.ac.th',
    findings: '',
    recommendation: '',
    result: '',
    evaluatedAt: '',
    evaluatedByName: '',
    createdByEmail: 'kaimook.s@icit.kmutnb.ac.th',
    createdByName: 'นางสาวไข่มุก สรรพวุธ',
    createdAt: '2026-02-05T10:15:00.000Z',
    updatedAt: '2026-02-10T11:00:00.000Z',
  },
  {
    id: 'audit-2569-003',
    auditYear: '2569',
    isoStandard: 'IMS 9001/27001',
    auditDate: '2026-09-15',
    auditor1Id: 'auditor-2',
    auditor1Name: 'นางศรินญา พงศ์สุริยา',
    auditor1Email: 'sarinya.p@icit.kmutnb.ac.th',
    hasSecondAuditor: true,
    auditor2Id: 'auditor-1',
    auditor2Name: 'นางสาวไข่มุก สรรพวุธ',
    auditor2Email: 'kaimook.s@icit.kmutnb.ac.th',
    auditee1Id: 'auditee-3',
    auditee1Name: 'นายธนกฤต วิศวกรรม',
    auditeeDepartment: 'ฝ่ายวิศวกรรมระบบเครือข่าย',
    topic: 'Facility management and Physical security management (Data center)',
    item: 'ตรวจความมั่นคงปลอดภัยทางกายภาพของห้อง Data Center การเข้า-ออก และระบบดับเพลิงอัตโนมัติ',
    clauses: 'IS: A7.1, A7.2, A7.4',
    expectedEvidence: '- บันทึกการเข้า-ออกห้อง Data Center (Access Log / CCTV)\n- รายงานการบำรุงรักษาระบบปรับอากาศและระบบก๊าซดับเพลิงประจำรอบ',
    status: 'PENDING_LEAD_APPROVAL',
    approvedByLeadIA: false,
    approvedAt: '',
    approvedByName: '',
    approvedByEmail: '',
    findings: '',
    recommendation: '',
    result: '',
    evaluatedAt: '',
    evaluatedByName: '',
    createdByEmail: 'sarinya.p@icit.kmutnb.ac.th',
    createdByName: 'นางศรินญา พงศ์สุริยา',
    createdAt: '2026-09-08T13:40:00.000Z',
    updatedAt: '2026-09-08T13:40:00.000Z',
  },
];

// Local Pub/Sub
let auditSubscribers = [];
let configSubscribersMap = {};

function notifyAuditSubscribers(data) {
  auditSubscribers.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('IMS Audit subscriber error:', e);
    }
  });
}

function notifyConfigSubscribers(year, data) {
  if (configSubscribersMap[year]) {
    configSubscribersMap[year].forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('IMS Config subscriber error:', e);
      }
    });
  }
}

/**
 * Initialize local storage with seed data if empty
 */
function initImsLocalStorage() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(LOCAL_KEY_IMS_AUDITS)) {
    localStorage.setItem(LOCAL_KEY_IMS_AUDITS, JSON.stringify(SEED_IMS_AUDITS));
  }
}

/**
 * Subscribe to all IMS Audits with real-time Firestore sync & local fallback
 */
export function subscribeImsAudits(callback) {
  auditSubscribers.push(callback);
  initImsLocalStorage();

  // Send local/cached data immediately
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_KEY_IMS_AUDITS);
    if (raw) {
      try {
        callback(JSON.parse(raw));
      } catch (e) {
        callback(SEED_IMS_AUDITS);
      }
    } else {
      callback(SEED_IMS_AUDITS);
    }
  }

  // If Firebase is available, set up Firestore onSnapshot listener
  let unsubscribeSnapshot = () => {};
  if (isFirebaseConfigured && db) {
    try {
      const auditsRef = collection(db, 'ims_audits');
      unsubscribeSnapshot = onSnapshot(
        auditsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() });
            });
            list.sort((a, b) => new Date(b.auditDate || b.createdAt) - new Date(a.auditDate || a.createdAt));
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_KEY_IMS_AUDITS, JSON.stringify(list));
            }
            notifyAuditSubscribers(list);
          } else {
            // First time collection is empty in Firestore, write seed data
            SEED_IMS_AUDITS.forEach(async (item) => {
              try {
                await setDoc(doc(db, 'ims_audits', item.id), item);
              } catch (err) {
                // Ignore seed write errors
              }
            });
          }
        },
        (error) => {
          console.warn('Firestore ims_audits onSnapshot error (using local storage):', error);
        }
      );
    } catch (e) {
      console.warn('Failed to listen to Firestore ims_audits:', e);
    }
  }

  return () => {
    auditSubscribers = auditSubscribers.filter((cb) => cb !== callback);
    unsubscribeSnapshot();
  };
}

/**
 * Send an email notification for IMS Audit workflow and log to Firestore
 */
export async function sendImsAuditEmail({
  to,
  cc = '',
  bcc = '',
  subject,
  htmlBody,
  auditId,
  targetStep = 'IMS_AUDIT',
  senderName = 'ระบบบริหารงาน IMS สำนักคอมพิวเตอร์ฯ (ICIT)',
}) {
  if (!to) {
    console.warn('sendImsAuditEmail: No recipient email provided');
    return { success: false, message: 'No recipient email' };
  }

  const logEntry = {
    id: `email-ims-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    recordId: auditId || 'IMS_AUDIT',
    targetStep,
    recipientEmail: to,
    recipientName: to,
    recipientRole: 'ผู้ตรวจ / Lead Auditor',
    cc: cc || '',
    bcc: bcc || '',
    subject: subject.trim(),
    sentAt: new Date().toISOString(),
    status: 'PENDING',
    deliveryMethod: 'API Relay',
    senderName,
  };

  try {
    const resp = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: to.trim(),
        cc: (cc || '').trim(),
        bcc: (bcc || '').trim(),
        subject: subject.trim(),
        htmlBody,
        senderName,
      }),
    });

    const resData = await resp.json().catch(() => ({}));
    if (resp.ok && resData.success) {
      logEntry.status = resData.simulated ? 'SIMULATED' : 'DELIVERED';
      logEntry.deliveryMethod = resData.simulated
        ? 'ระบบจำลองการส่งอีเมล (Simulation Mode)'
        : 'Google Apps Script (Gmail Relay)';
    } else {
      logEntry.status = 'FAILED';
      logEntry.error = resData.message || resData.error || `HTTP ${resp.status}`;
    }
  } catch (err) {
    console.warn('IMS email sending error:', err);
    logEntry.status = 'FAILED';
    logEntry.error = err.message;
  }

  // Save to sent email logs in localStorage
  if (typeof window !== 'undefined') {
    try {
      const logs = JSON.parse(localStorage.getItem('icit_sent_email_logs') || '[]');
      logs.unshift(logEntry);
      if (logs.length > 100) logs.pop();
      localStorage.setItem('icit_sent_email_logs', JSON.stringify(logs));
    } catch (e) {}
  }

  // Save to Firebase Firestore 'email_logs' collection
  try {
    logEmailToFirestore(logEntry).catch(() => {});
  } catch (e) {}

  return logEntry;
}

/**
 * Generate HTML email for Lead Auditor when a new or resubmitted audit plan is pending approval
 */
export function generateImsLeadNotificationHtml({ audit, recipientName = 'Lead Internal Auditor', appBaseUrl = '' }) {
  const baseUrl = appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://icitworkspace.web.app');
  const auditUrl = `${baseUrl}/ims/audit`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>แจ้งเตือน: แผนการตรวจติดตามภายในรอการอนุมัติ</title>
</head>
<body style="font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
          <!-- Official ICIT Header -->
          <tr>
            <td style="padding: 18px 24px; background-color: #FFFFFF; border-bottom: 2px solid #0D9488;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="52" valign="middle" style="padding-right: 14px;">
                    <img src="https://icit.kmutnb.ac.th/main/wp-content/uploads/2021/04/icit-logo-web.png" width="48" height="48" alt="ICIT Logo" style="display: block; border-radius: 8px;" />
                  </td>
                  <td valign="middle">
                    <div style="font-size: 16px; font-weight: 700; color: #0F172A; line-height: 1.2;">ระบบบริหารงาน IMS (ISO 9001 / ISO 27001)</div>
                    <div style="font-size: 12px; color: #64748B;">สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="padding: 16px 24px; background-color: #FEF3C7; border-bottom: 1px solid #FDE68A;">
              <div style="font-size: 15px; font-weight: 700; color: #92400E;">
                📋 แจ้งเตือน: แผนการตรวจติดตามภายในเสนอเพื่อขออนุมัติ
              </div>
              <div style="font-size: 13px; color: #78350F; margin-top: 4px;">
                เรียน ${recipientName} (Lead Internal Auditor) กรุณาตรวจสอบและพิจารณาอนุมัติก่อนเริ่มการตรวจ
              </div>
            </td>
          </tr>

          <!-- Content Details Table -->
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px; line-height: 1.6; border-collapse: collapse;">
                <tr>
                  <td width="160" style="padding: 8px 0; color: #64748B; font-weight: 600; vertical-align: top;">หัวข้อที่รับการตรวจ:</td>
                  <td style="padding: 8px 0; color: #DC2626; font-weight: 700; vertical-align: top;">${audit.topic || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-weight: 600; vertical-align: top;">ปีที่ตรวจ / มาตรฐาน:</td>
                  <td style="padding: 8px 0; color: #1E293B; vertical-align: top;">ปี ${audit.auditYear || '2569'} • ${audit.isoStandard || 'IMS 9001/27001'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-weight: 600; vertical-align: top;">วันที่ทำการตรวจติดตาม:</td>
                  <td style="padding: 8px 0; color: #0284C7; font-weight: 700; vertical-align: top;">${audit.auditDate || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-weight: 600; vertical-align: top;">ผู้ตรวจติดตาม:</td>
                  <td style="padding: 8px 0; color: #0369A1; vertical-align: top;">
                    1. ${audit.auditor1Name || '-'}${audit.hasSecondAuditor && audit.auditor2Name ? '<br/>2. ' + audit.auditor2Name : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-weight: 600; vertical-align: top;">ผู้รับการตรวจ:</td>
                  <td style="padding: 8px 0; color: #1E293B; vertical-align: top;">
                    ${audit.auditee1Name || '-'}${audit.auditeeDepartment ? ' (' + audit.auditeeDepartment + ')' : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-weight: 600; vertical-align: top;">Item (ข้อตรวจ):</td>
                  <td style="padding: 8px 0; color: #0284C7; vertical-align: top;">${audit.item || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-weight: 600; vertical-align: top;">Clauses (ข้อกำหนด):</td>
                  <td style="padding: 8px 0; color: #1E293B; font-weight: 600; vertical-align: top;">${audit.clauses || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-weight: 600; vertical-align: top;">หลักฐานที่คาดหวัง:</td>
                  <td style="padding: 8px 0; color: #334155; vertical-align: top; white-space: pre-line;">${audit.expectedEvidence || '-'}</td>
                </tr>
              </table>

              <!-- Action Button Table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${auditUrl}" target="_blank" style="display: inline-block; background: #0D9488; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(13, 148, 136, 0.3);">
                      เข้าสู่ระบบเพื่อตรวจสอบและพิจารณาอนุมัติ &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; text-align: center;">
              อีเมลอัตโนมัติจากระบบบริหารงาน IMS สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate HTML email for Auditors when Lead IA approves the audit plan
 */
export function generateImsApprovalNotificationHtml({ audit, leadActorName = 'Lead Internal Auditor', appBaseUrl = '' }) {
  const baseUrl = appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://icitworkspace.web.app');
  const auditUrl = `${baseUrl}/ims/audit`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>แจ้งผล: แผนการตรวจติดตามภายในได้รับการอนุมัติแล้ว</title>
</head>
<body style="font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
          <!-- Official ICIT Header -->
          <tr>
            <td style="padding: 18px 24px; background-color: #FFFFFF; border-bottom: 2px solid #16A34A;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="52" valign="middle" style="padding-right: 14px;">
                    <img src="https://icit.kmutnb.ac.th/main/wp-content/uploads/2021/04/icit-logo-web.png" width="48" height="48" alt="ICIT Logo" style="display: block; border-radius: 8px;" />
                  </td>
                  <td valign="middle">
                    <div style="font-size: 16px; font-weight: 700; color: #0F172A; line-height: 1.2;">ระบบบริหารงาน IMS (ISO 9001 / ISO 27001)</div>
                    <div style="font-size: 12px; color: #64748B;">สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="padding: 16px 24px; background-color: #DCFCE7; border-bottom: 1px solid #BBF7D0;">
              <div style="font-size: 15px; font-weight: 700; color: #15803D;">
                ✅ แผนการตรวจติดตามภายในได้รับการอนุมัติแล้ว (APPROVED)
              </div>
              <div style="font-size: 13px; color: #166534; margin-top: 4px;">
                อนุมัติโดย: ${leadActorName} (Lead Internal Auditor) • พร้อมเข้าตรวจติดตามตามกำหนดการ
              </div>
            </td>
          </tr>

          <!-- Content Details Table -->
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                เรียน คณะผู้ตรวจติดตามภายใน (${audit.auditor1Name}${audit.hasSecondAuditor && audit.auditor2Name ? ', ' + audit.auditor2Name : ''})<br/>
                แผนการตรวจติดตามภายในได้รับการอนุมัติเรียบร้อยแล้ว ท่านสามารถดำเนินการเข้าตรวจติดตามตามวันนัดหมาย และเข้าบันทึกผลการตรวจ (Findings, Recommendation และผลสรุป C / NC / OFI) ได้ในระบบ
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px; line-height: 1.6; border-collapse: collapse; background-color: #F8FAFC; border-radius: 8px; padding: 12px; border: 1px solid #E2E8F0;">
                <tr>
                  <td width="150" style="padding: 8px 12px; color: #64748B; font-weight: 600;">หัวข้อที่รับการตรวจ:</td>
                  <td style="padding: 8px 12px; color: #DC2626; font-weight: 700;">${audit.topic || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600;">วันที่ทำการตรวจ:</td>
                  <td style="padding: 8px 12px; color: #0284C7; font-weight: 700;">${audit.auditDate || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600;">ผู้รับการตรวจ:</td>
                  <td style="padding: 8px 12px; color: #1E293B;">${audit.auditee1Name || '-'}${audit.auditeeDepartment ? ' (' + audit.auditeeDepartment + ')' : ''}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600;">Item (ข้อตรวจ):</td>
                  <td style="padding: 8px 12px; color: #0284C7;">${audit.item || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600;">Clauses:</td>
                  <td style="padding: 8px 12px; color: #1E293B;">${audit.clauses || '-'}</td>
                </tr>
              </table>

              <!-- Action Button Table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${auditUrl}" target="_blank" style="display: inline-block; background: #16A34A; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);">
                      เข้าสู่ระบบเพื่อบันทึกผลการตรวจติดตาม &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; text-align: center;">
              อีเมลอัตโนมัติจากระบบบริหารงาน IMS สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate HTML email for Auditors when Lead IA returns the plan for revision (with comment)
 */
export function generateImsRevisionNotificationHtml({ audit, comment, leadActorName = 'Lead Internal Auditor', appBaseUrl = '' }) {
  const baseUrl = appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://icitworkspace.web.app');
  const auditUrl = `${baseUrl}/ims/audit`;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>แจ้งเตือน: แผนการตรวจติดตามภายในถูกส่งกลับเพื่อแก้ไข</title>
</head>
<body style="font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
          <!-- Official ICIT Header -->
          <tr>
            <td style="padding: 18px 24px; background-color: #FFFFFF; border-bottom: 2px solid #DC2626;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="52" valign="middle" style="padding-right: 14px;">
                    <img src="https://icit.kmutnb.ac.th/main/wp-content/uploads/2021/04/icit-logo-web.png" width="48" height="48" alt="ICIT Logo" style="display: block; border-radius: 8px;" />
                  </td>
                  <td valign="middle">
                    <div style="font-size: 16px; font-weight: 700; color: #0F172A; line-height: 1.2;">ระบบบริหารงาน IMS (ISO 9001 / ISO 27001)</div>
                    <div style="font-size: 12px; color: #64748B;">สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="padding: 16px 24px; background-color: #FEF2F2; border-bottom: 1px solid #FECACA;">
              <div style="font-size: 15px; font-weight: 700; color: #DC2626;">
                ⚠️ แจ้งเตือน: แผนการตรวจติดตามภายในถูกส่งกลับเพื่อแก้ไข (Return to Revision)
              </div>
              <div style="font-size: 13px; color: #991B1B; margin-top: 4px;">
                โดย: ${leadActorName} (Lead Internal Auditor) • กรุณาปรับปรุงข้อมูลและส่งใหม่อีกครั้ง
              </div>
            </td>
          </tr>

          <!-- Content Details Table -->
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                เรียน คณะผู้ตรวจติดตามภายใน (${audit.auditor1Name}${audit.hasSecondAuditor && audit.auditor2Name ? ', ' + audit.auditor2Name : ''})<br/>
                Lead Internal Auditor ได้พิจารณาแผนการตรวจติดตามหัวข้อ <strong>"${audit.topic}"</strong> และมีความเห็นให้ส่งกลับเพื่อปรับปรุงแก้ไขข้อมูลตามรายละเอียดด้านล่าง:
              </p>

              <!-- Revision Comment Highlight Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; background-color: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <div style="font-size: 13px; font-weight: 700; color: #D97706; margin-bottom: 4px;">
                      💬 ข้อคิดเห็น / สิ่งที่ต้องแก้ไขจาก Lead IA:
                    </div>
                    <div style="font-size: 14.5px; color: #92400E; line-height: 1.6; font-weight: 500; white-space: pre-line;">
                      ${comment || 'กรุณาตรวจสอบและปรับปรุงรายละเอียดแผนการตรวจเพิ่มเติม'}
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13.5px; line-height: 1.6; border-collapse: collapse; background-color: #F8FAFC; border-radius: 8px; padding: 12px; border: 1px solid #E2E8F0;">
                <tr>
                  <td width="140" style="padding: 6px 12px; color: #64748B; font-weight: 600;">หัวข้อที่รับการตรวจ:</td>
                  <td style="padding: 6px 12px; color: #1E293B; font-weight: 600;">${audit.topic || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px; color: #64748B; font-weight: 600;">วันที่ตรวจ:</td>
                  <td style="padding: 6px 12px; color: #0284C7;">${audit.auditDate || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px; color: #64748B; font-weight: 600;">Item (ข้อตรวจ):</td>
                  <td style="padding: 6px 12px; color: #1E293B;">${audit.item || '-'}</td>
                </tr>
              </table>

              <!-- Action Button Table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${auditUrl}" target="_blank" style="display: inline-block; background: #0284C7; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);">
                      เข้าสู่ระบบเพื่อแก้ไขแผนการตรวจ &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; text-align: center;">
              อีเมลอัตโนมัติจากระบบบริหารงาน IMS สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Save (create or update) an IMS audit report
 */
export async function saveImsAuditRecord(auditData, actor, options = {}) {
  initImsLocalStorage();
  const now = new Date().toISOString();
  const id = auditData.id || `audit-${auditData.auditYear || '2569'}-${Date.now()}`;

  const record = {
    ...auditData,
    id,
    updatedAt: now,
    createdAt: auditData.createdAt || now,
    createdByEmail: auditData.createdByEmail || actor?.email || '',
    createdByName: auditData.createdByName || actor?.name || '',
  };

  // Update localStorage immediately
  if (typeof window !== 'undefined') {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(LOCAL_KEY_IMS_AUDITS) || '[]');
    } catch (e) {
      list = [...SEED_IMS_AUDITS];
    }
    const idx = list.findIndex((a) => a.id === id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    localStorage.setItem(LOCAL_KEY_IMS_AUDITS, JSON.stringify(list));
    notifyAuditSubscribers(list);
  }

  // Update Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'ims_audits', id), record, { merge: true });
    } catch (err) {
      console.warn('Failed to save ims_audit to Firestore:', err);
    }
  }

  // Activity Log
  try {
    logActivity({
      category: 'IMS_AUDIT',
      action: auditData.id ? 'UPDATE_AUDIT' : 'CREATE_AUDIT',
      details: `${auditData.id ? 'แก้ไข' : 'สร้าง'}รายงานตรวจติดตาม IMS: ${record.topic} (${record.auditYear})`,
      actorEmail: actor?.email,
      actorName: actor?.name,
      metadata: { auditId: id, topic: record.topic, status: record.status },
    });
  } catch (e) {}

  // Mail notification to Lead Auditor if submitted for approval
  if (record.status === 'PENDING_LEAD_APPROVAL') {
    let leadEmail = options?.leadAuditorEmail;
    let leadName = options?.leadAuditorName || 'Lead Internal Auditor';
    if (!leadEmail && typeof window !== 'undefined') {
      try {
        const yrCfg = JSON.parse(localStorage.getItem(`${LOCAL_KEY_IMS_CONFIG_PREFIX}${record.auditYear || '2569'}`) || '{}');
        leadEmail = yrCfg.leadAuditorEmail || 'prasertsak.t@cit.kmutnb.ac.th';
        leadName = yrCfg.leadAuditorName || 'Lead Internal Auditor';
      } catch (e) {
        leadEmail = 'prasertsak.t@cit.kmutnb.ac.th';
      }
    }
    if (leadEmail) {
      try {
        const htmlBody = generateImsLeadNotificationHtml({
          audit: record,
          recipientName: leadName,
        });
        sendImsAuditEmail({
          to: leadEmail,
          subject: `[ระบบ IMS] แจ้งเตือน: แผนการตรวจติดตามภายในเสนอเพื่อขออนุมัติ - ${record.topic}`,
          htmlBody,
          auditId: record.id,
          targetStep: 'IMS_PENDING_LEAD_APPROVAL',
          senderName: 'ระบบบริหารงาน IMS',
        }).catch((err) => console.warn('Lead email notification error:', err));
      } catch (err) {
        console.warn('Failed sending email to lead auditor:', err);
      }
    }
  }

  return record;
}

/**
 * Delete an IMS audit record
 */
export async function deleteImsAuditRecord(id, actor) {
  initImsLocalStorage();
  let deletedItem = null;

  if (typeof window !== 'undefined') {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(LOCAL_KEY_IMS_AUDITS) || '[]');
    } catch (e) {
      list = [];
    }
    deletedItem = list.find((a) => a.id === id);
    list = list.filter((a) => a.id !== id);
    localStorage.setItem(LOCAL_KEY_IMS_AUDITS, JSON.stringify(list));
    notifyAuditSubscribers(list);
  }

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'ims_audits', id));
    } catch (err) {
      console.warn('Failed to delete ims_audit from Firestore:', err);
    }
  }

  // Activity Log
  try {
    logActivity({
      category: 'IMS_AUDIT',
      action: 'DELETE_AUDIT',
      details: `ลบรายงานการตรวจติดตาม IMS ID: ${id} (${deletedItem?.topic || ''})`,
      actorEmail: actor?.email,
      actorName: actor?.name,
      metadata: { auditId: id },
    });
  } catch (e) {}

  return true;
}

/**
 * Approve audit plan by Lead Internal Auditor (Sends email notification to Auditor(s))
 */
export async function approveAuditPlanByLead(auditId, leadActor) {
  initImsLocalStorage();
  const now = new Date().toISOString();

  let target = null;
  if (typeof window !== 'undefined') {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_IMS_AUDITS) || '[]');
    const idx = list.findIndex((a) => a.id === auditId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status: 'READY_FOR_AUDIT',
        approvedByLeadIA: true,
        approvedAt: now,
        approvedByName: leadActor?.name || 'Lead Internal Auditor',
        approvedByEmail: leadActor?.email || '',
        leadRevisionComment: '', // Clear previous return comment if approved
        updatedAt: now,
      };
      target = list[idx];
      localStorage.setItem(LOCAL_KEY_IMS_AUDITS, JSON.stringify(list));
      notifyAuditSubscribers(list);
    }
  }

  if (isFirebaseConfigured && db && target) {
    try {
      await setDoc(doc(db, 'ims_audits', auditId), target, { merge: true });
    } catch (err) {
      console.warn('Firestore error in approveAuditPlanByLead:', err);
    }
  }

  try {
    logActivity({
      category: 'IMS_AUDIT',
      action: 'APPROVE_AUDIT_PLAN',
      details: `Lead IA อนุมัติแผนการตรวจติดตาม: ${target?.topic || auditId}`,
      actorEmail: leadActor?.email,
      actorName: leadActor?.name,
      metadata: { auditId, approvedAt: now },
    });
  } catch (e) {}

  // Send Email notification to Auditor(s) on approval
  if (target && target.auditor1Email) {
    try {
      const htmlBody = generateImsApprovalNotificationHtml({
        audit: target,
        leadActorName: leadActor?.name || 'Lead Internal Auditor',
      });
      sendImsAuditEmail({
        to: target.auditor1Email,
        cc: target.hasSecondAuditor && target.auditor2Email ? target.auditor2Email : '',
        subject: `[ระบบ IMS] แจ้งผล: แผนการตรวจติดตามภายในได้รับการอนุมัติแล้ว - ${target.topic}`,
        htmlBody,
        auditId: target.id,
        targetStep: 'IMS_PLAN_APPROVED',
        senderName: 'ระบบบริหารงาน IMS (Lead Auditor)',
      }).catch((err) => console.warn('Auditor approval email error:', err));
    } catch (err) {
      console.warn('Failed sending approval email to auditor:', err);
    }
  }

  return target;
}

/**
 * Return audit plan for revision by Lead Internal Auditor (with comment and email to Auditor(s))
 */
export async function returnAuditPlanForRevision(auditId, comment, leadActor) {
  initImsLocalStorage();
  const now = new Date().toISOString();

  let target = null;
  if (typeof window !== 'undefined') {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_IMS_AUDITS) || '[]');
    const idx = list.findIndex((a) => a.id === auditId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status: 'RETURNED_FOR_REVISION',
        approvedByLeadIA: false,
        leadRevisionComment: comment || '',
        returnedAt: now,
        returnedByName: leadActor?.name || 'Lead Internal Auditor',
        returnedByEmail: leadActor?.email || '',
        updatedAt: now,
      };
      target = list[idx];
      localStorage.setItem(LOCAL_KEY_IMS_AUDITS, JSON.stringify(list));
      notifyAuditSubscribers(list);
    }
  }

  if (isFirebaseConfigured && db && target) {
    try {
      await setDoc(doc(db, 'ims_audits', auditId), target, { merge: true });
    } catch (err) {
      console.warn('Firestore error in returnAuditPlanForRevision:', err);
    }
  }

  // Activity Log
  try {
    logActivity({
      category: 'IMS_AUDIT',
      action: 'RETURN_AUDIT_PLAN',
      details: `Lead IA ส่งกลับแผนตรวจเพื่อแก้ไข: ${target?.topic || auditId} (ข้อคิดเห็น: ${comment || '-'})`,
      actorEmail: leadActor?.email,
      actorName: leadActor?.name,
      metadata: { auditId, comment, returnedAt: now },
    });
  } catch (e) {}

  // Send Email notification to Auditor(s) with comment
  if (target && target.auditor1Email) {
    try {
      const htmlBody = generateImsRevisionNotificationHtml({
        audit: target,
        comment,
        leadActorName: leadActor?.name || 'Lead Internal Auditor',
      });
      sendImsAuditEmail({
        to: target.auditor1Email,
        cc: target.hasSecondAuditor && target.auditor2Email ? target.auditor2Email : '',
        subject: `[ระบบ IMS] แจ้งเตือน: แผนการตรวจติดตามภายในถูกส่งกลับเพื่อแก้ไข - ${target.topic}`,
        htmlBody,
        auditId: target.id,
        targetStep: 'IMS_RETURNED_FOR_REVISION',
        senderName: 'ระบบบริหารงาน IMS (Lead Auditor)',
      }).catch((err) => console.warn('Auditor revision email error:', err));
    } catch (err) {
      console.warn('Failed sending revision email to auditor:', err);
    }
  }

  return target;
}


/**
 * Complete evaluation (enter Findings, Recommendation, and Result C/NC/OFI)
 */
export async function completeAuditEvaluation(auditId, evaluationData, auditorActor) {
  initImsLocalStorage();
  const now = new Date().toISOString();

  let target = null;
  if (typeof window !== 'undefined') {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY_IMS_AUDITS) || '[]');
    const idx = list.findIndex((a) => a.id === auditId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        findings: evaluationData.findings || '',
        recommendation: evaluationData.recommendation || '',
        result: evaluationData.result || 'C',
        status: 'COMPLETED',
        evaluatedAt: now,
        evaluatedByName: auditorActor?.name || list[idx].auditor1Name,
        updatedAt: now,
      };
      target = list[idx];
      localStorage.setItem(LOCAL_KEY_IMS_AUDITS, JSON.stringify(list));
      notifyAuditSubscribers(list);
    }
  }

  if (isFirebaseConfigured && db && target) {
    try {
      await setDoc(doc(db, 'ims_audits', auditId), target, { merge: true });
    } catch (err) {
      console.warn('Firestore error in completeAuditEvaluation:', err);
    }
  }

  try {
    logActivity({
      category: 'IMS_AUDIT',
      action: 'COMPLETE_EVALUATION',
      details: `บันทึกผลการตรวจติดตาม IMS: ${target?.topic} [ผลการตรวจ: ${target?.result}]`,
      actorEmail: auditorActor?.email,
      actorName: auditorActor?.name,
      metadata: { auditId, result: target?.result, topic: target?.topic },
    });
  } catch (e) {}

  return target;
}

// -------------------------------------------------------------
// Yearly Auditor Assignment Management
// -------------------------------------------------------------

export const DEFAULT_YEARLY_CONFIG = {
  year: '2569',
  leadAuditorId: '',
  leadAuditorName: 'รศ. ดร.ประเสริฐศักดิ์ เตียวงค์สมบัติ',
  leadAuditorEmail: 'prasertsak.t@cit.kmutnb.ac.th',
  auditorIds: [],
  auditors: [],
  updatedAt: new Date().toISOString(),
  updatedBy: 'ผู้ดูแลระบบ',
};

/**
 * Subscribe to Yearly Assigned Auditors config
 */
export function subscribeYearlyAuditors(year, callback) {
  const currentYear = year || '2569';
  if (!configSubscribersMap[currentYear]) {
    configSubscribersMap[currentYear] = [];
  }
  configSubscribersMap[currentYear].push(callback);

  const localKey = `${LOCAL_KEY_IMS_CONFIG_PREFIX}${currentYear}`;

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      try {
        callback(JSON.parse(raw));
      } catch (e) {
        callback({ ...DEFAULT_YEARLY_CONFIG, year: currentYear });
      }
    } else {
      callback({ ...DEFAULT_YEARLY_CONFIG, year: currentYear });
    }
  }

  let unsubscribeSnapshot = () => {};
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'ims_config', `year_${currentYear}`);
      unsubscribeSnapshot = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (typeof window !== 'undefined') {
              localStorage.setItem(localKey, JSON.stringify(data));
            }
            notifyConfigSubscribers(currentYear, data);
          } else {
            // Write default if not yet exists
            setDoc(docRef, { ...DEFAULT_YEARLY_CONFIG, year: currentYear }).catch(() => {});
          }
        },
        (error) => {
          console.warn(`Firestore ims_config for ${currentYear} onSnapshot error:`, error);
        }
      );
    } catch (e) {
      console.warn('Failed to listen to Firestore ims_config:', e);
    }
  }

  return () => {
    if (configSubscribersMap[currentYear]) {
      configSubscribersMap[currentYear] = configSubscribersMap[currentYear].filter(
        (cb) => cb !== callback
      );
    }
    unsubscribeSnapshot();
  };
}

/**
 * Save Yearly Assigned Auditors config (Admin only)
 */
export async function saveYearlyAuditors(year, configData, adminActor) {
  const currentYear = year || configData.year || '2569';
  const localKey = `${LOCAL_KEY_IMS_CONFIG_PREFIX}${currentYear}`;
  const now = new Date().toISOString();

  const payload = {
    ...configData,
    year: currentYear,
    updatedAt: now,
    updatedBy: adminActor?.name || 'Admin',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(localKey, JSON.stringify(payload));
    notifyConfigSubscribers(currentYear, payload);
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'ims_config', `year_${currentYear}`), payload, { merge: true });
    } catch (err) {
      console.warn('Failed to save ims_config to Firestore:', err);
    }
  }

  try {
    logActivity({
      category: 'IMS_AUDIT',
      action: 'CONFIG_AUDITORS',
      details: `กำหนดรายชื่อผู้ตรวจติดตามภายในประจำปี ${currentYear} (Lead: ${payload.leadAuditorName || '-'}, Auditors: ${payload.auditors?.length || 0} ท่าน)`,
      actorEmail: adminActor?.email,
      actorName: adminActor?.name,
      metadata: { year: currentYear, auditorsCount: payload.auditors?.length || 0 },
    });
  } catch (e) {}

  return payload;
}

/**
 * Check if the user is authorized to create/edit audits for a given year:
 * - Must be Admin, OR
 * - Assigned as Lead Auditor, OR
 * - Assigned as Internal Auditor for that year
 */
export function isUserAuthorizedAuditor(user, personnel, yearConfig, isAdmin) {
  if (isAdmin) return true;
  if (!user && !personnel) return false;

  const userEmail = (user?.email || personnel?.email || '').toLowerCase();
  const personId = personnel?.id;

  // Check if lead auditor
  if (yearConfig?.leadAuditorEmail && yearConfig.leadAuditorEmail.toLowerCase() === userEmail) {
    return true;
  }
  if (yearConfig?.leadAuditorId && personId && yearConfig.leadAuditorId === personId) {
    return true;
  }

  // Check if in auditorIds or auditors list
  if (yearConfig?.auditorIds && personId && yearConfig.auditorIds.includes(personId)) {
    return true;
  }
  if (yearConfig?.auditors && Array.isArray(yearConfig.auditors)) {
    const isMatched = yearConfig.auditors.some(
      (a) =>
        (a.id && a.id === personId) ||
        (a.email && a.email.toLowerCase() === userEmail)
    );
    if (isMatched) return true;
  }

  return false;
}
