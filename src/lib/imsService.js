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
import { IMS_AUDIT_TOPICS } from './constants';

const LOCAL_KEY_IMS_AUDITS = 'icit_ims_audits';
const LOCAL_KEY_IMS_CONFIG_PREFIX = 'icit_ims_config_';
const LOCAL_KEY_IMS_AUDIT_TOPICS = 'icit_ims_audit_topics';

// Clean state: No dummy/mock seed data (User starts with empty list for real input)
export const SEED_IMS_AUDITS = [];

// Local Pub/Sub & Shared Firestore Listeners (Read/Write Optimization)
let auditSubscribers = [];
let sharedAuditsUnsubscribe = null;
let cachedAudits = null;

let configSubscribersMap = {};
let sharedConfigUnsubMap = {};
let cachedConfigMap = {};

function notifyAuditSubscribers(data) {
  cachedAudits = data;
  auditSubscribers.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('IMS Audit subscriber error:', e);
    }
  });
}

function notifyConfigSubscribers(year, data) {
  cachedConfigMap[year] = data;
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
 * Recursively removes undefined fields so Firestore writes never fail with invalid data
 * and ensures minimal payload size
 */
export function cleanForFirestore(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj === undefined ? null : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForFirestore(item));
  }
  const cleaned = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = cleanForFirestore(val);
    }
  });
  return cleaned;
}

/**
 * Initialize local storage without mock seed data and purge legacy demo audits
 */
function initImsLocalStorage() {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(LOCAL_KEY_IMS_AUDITS);
  if (!raw) {
    localStorage.setItem(LOCAL_KEY_IMS_AUDITS, '[]');
    return;
  }
  try {
    const list = JSON.parse(raw);
    const cleaned = list.filter(
      (item) => !['audit-2569-001', 'audit-2569-002', 'audit-2569-003'].includes(item.id)
    );
    if (cleaned.length !== list.length) {
      localStorage.setItem(LOCAL_KEY_IMS_AUDITS, JSON.stringify(cleaned));
    }
  } catch (e) {
    localStorage.setItem(LOCAL_KEY_IMS_AUDITS, '[]');
  }
}

/**
 * Subscribe to all IMS Audits with real-time Firestore sync & local fallback
 * OPTIMIZATION: Uses a SINGLE shared Firestore onSnapshot listener for the entire app.
 * Multiple UI components subscribing will NOT generate duplicate Firestore read calls.
 */
export function subscribeImsAudits(callback) {
  auditSubscribers.push(callback);
  initImsLocalStorage();

  // Send in-memory or local/cached data immediately to prevent layout shifts
  if (cachedAudits) {
    callback(cachedAudits);
  } else if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_KEY_IMS_AUDITS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const cleaned = parsed.filter(
          (item) => !['audit-2569-001', 'audit-2569-002', 'audit-2569-003'].includes(item.id)
        );
        cachedAudits = cleaned;
        callback(cleaned);
      } catch (e) {
        callback([]);
      }
    } else {
      callback([]);
    }
  }

  // Multi-tab real-time storage event listener
  const handleStorageChange = (e) => {
    if (!e || e.key === LOCAL_KEY_IMS_AUDITS) {
      try {
        const raw = localStorage.getItem(LOCAL_KEY_IMS_AUDITS);
        const list = JSON.parse(raw || '[]');
        cachedAudits = list;
        callback(list);
      } catch (err) {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
  }

  // If Firebase is available, start the SINGLE shared Firestore listener if not already active
  if (isFirebaseConfigured && db && !sharedAuditsUnsubscribe) {
    try {
      const auditsRef = collection(db, 'ims_audits');
      sharedAuditsUnsubscribe = onSnapshot(
        auditsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = [];
            snapshot.forEach((docSnap) => {
              // Ignore legacy demo seed IDs client-side without firing deleteDoc writes
              if (!['audit-2569-001', 'audit-2569-002', 'audit-2569-003'].includes(docSnap.id)) {
                list.push({ id: docSnap.id, ...docSnap.data() });
              }
            });
            list.sort((a, b) => new Date(b.auditDate || b.createdAt) - new Date(a.auditDate || a.createdAt));
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_KEY_IMS_AUDITS, JSON.stringify(list));
            }
            notifyAuditSubscribers(list);
          } else {
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_KEY_IMS_AUDITS, '[]');
            }
            notifyAuditSubscribers([]);
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
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageChange);
    }
    // Optimization: When all subscribers unmount, teardown the shared Firestore listener
    if (auditSubscribers.length === 0 && sharedAuditsUnsubscribe) {
      sharedAuditsUnsubscribe();
      sharedAuditsUnsubscribe = null;
    }
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

  let webhookUrl = '';
  if (typeof window !== 'undefined') {
    try {
      const emailConfig = JSON.parse(localStorage.getItem('icit_email_notification_config') || '{}');
      webhookUrl = emailConfig.googleAppsScriptUrl || '';
    } catch (e) {}
  }

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
        webhookUrl,
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

  const auditeesText =
    Array.isArray(audit.auditees) && audit.auditees.length > 0
      ? audit.auditees
          .map((a, idx) => `${idx + 1}. ${a.name || '-'}${a.department ? ` (${a.department})` : ''}`)
          .join('<br/>')
      : `${audit.auditee1Name || '-'}${audit.auditeeDepartment ? ` (${audit.auditeeDepartment})` : ''}`;

  const auditorsText =
    audit.hasSecondAuditor && audit.auditor2Name
      ? `1. ${audit.auditor1Name || '-'}<br/>2. ${audit.auditor2Name}`
      : `1. ${audit.auditor1Name || '-'}`;

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
            <td style="padding: 18px 24px; background-color: #FFFFFF; border-bottom: 3px solid #0D9488;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td width="48" valign="middle" style="width: 48px; vertical-align: middle; padding-right: 14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px; width: 44px; height: 44px; border: 1px solid #E2E8F0; border-collapse: collapse;">
                      <tr>
                        <td align="center" valign="middle" style="text-align: center; vertical-align: middle; padding: 4px;">
                          <img src="https://raw.githubusercontent.com/prasertsakt/ICITWorkspace/main/public/icit-logo.png" width="36" height="36" alt="ICIT" style="width: 36px; height: 36px; display: block; border: 0; outline: none;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="vertical-align: middle; text-align: left;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #0D9488; font-weight: 700; line-height: 1.3;">
                      สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)
                    </div>
                    <div style="font-size: 16px; font-weight: 700; color: #0F172A; line-height: 1.3; margin-top: 2px;">
                      ระบบบริหารงาน IMS (ISO 9001 / ISO 27001)
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="padding: 16px 24px; background-color: #FFFBEB; border-bottom: 1px solid #FDE68A;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 15px; font-weight: 700; color: #92400E; line-height: 1.4;">
                      [แจ้งเตือน] แผนการตรวจติดตามภายในเสนอเพื่อขออนุมัติ
                    </div>
                    <div style="font-size: 13px; color: #78350F; margin-top: 5px; line-height: 1.5;">
                      เรียน ${recipientName} (Lead Internal Auditor) กรุณาตรวจสอบและพิจารณาอนุมัติก่อนเริ่มการตรวจ
                    </div>
                  </td>
                </tr>
              </table>
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
                  <td width="160" style="padding: 8px 0; color: #64748B; font-weight: 600; vertical-align: top;">ปีงบประมาณ / มาตรฐาน:</td>
                  <td style="padding: 8px 0; color: #1E293B; vertical-align: top;">ปีงบประมาณ ${audit.auditYear || '2569'} &bull; ${audit.isoStandard || 'IMS 9001/27001'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-weight: 600; vertical-align: top;">วันที่ทำการตรวจติดตาม:</td>
                  <td style="padding: 8px 0; color: #0284C7; font-weight: 700; vertical-align: top;">${audit.auditDate || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-weight: 600; vertical-align: top;">ผู้ตรวจติดตาม:</td>
                  <td style="padding: 8px 0; color: #0369A1; vertical-align: top;">
                    ${auditorsText}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748B; font-weight: 600; vertical-align: top;">ผู้รับการตรวจ:</td>
                  <td style="padding: 8px 0; color: #1E293B; vertical-align: top;">
                    ${auditeesText}
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

  const auditeesText =
    Array.isArray(audit.auditees) && audit.auditees.length > 0
      ? audit.auditees
          .map((a, idx) => `${idx + 1}. ${a.name || '-'}${a.department ? ` (${a.department})` : ''}`)
          .join('<br/>')
      : `${audit.auditee1Name || '-'}${audit.auditeeDepartment ? ` (${audit.auditeeDepartment})` : ''}`;

  const auditorsText =
    audit.hasSecondAuditor && audit.auditor2Name
      ? `${audit.auditor1Name || '-'}${audit.auditor2Name ? `, ${audit.auditor2Name}` : ''}`
      : `${audit.auditor1Name || '-'}`;

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
            <td style="padding: 18px 24px; background-color: #FFFFFF; border-bottom: 3px solid #16A34A;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td width="48" valign="middle" style="width: 48px; vertical-align: middle; padding-right: 14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px; width: 44px; height: 44px; border: 1px solid #E2E8F0; border-collapse: collapse;">
                      <tr>
                        <td align="center" valign="middle" style="text-align: center; vertical-align: middle; padding: 4px;">
                          <img src="https://raw.githubusercontent.com/prasertsakt/ICITWorkspace/main/public/icit-logo.png" width="36" height="36" alt="ICIT" style="width: 36px; height: 36px; display: block; border: 0; outline: none;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="vertical-align: middle; text-align: left;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #16A34A; font-weight: 700; line-height: 1.3;">
                      สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)
                    </div>
                    <div style="font-size: 16px; font-weight: 700; color: #0F172A; line-height: 1.3; margin-top: 2px;">
                      ระบบบริหารงาน IMS (ISO 9001 / ISO 27001)
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="padding: 16px 24px; background-color: #F0FDF4; border-bottom: 1px solid #BBF7D0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 15px; font-weight: 700; color: #15803D; line-height: 1.4;">
                      [แจ้งผล] แผนการตรวจติดตามภายในได้รับการอนุมัติแล้ว (APPROVED)
                    </div>
                    <div style="font-size: 13px; color: #166534; margin-top: 5px; line-height: 1.5;">
                      อนุมัติโดย: ${leadActorName} (Lead Internal Auditor) &bull; พร้อมเข้าตรวจติดตามตามกำหนดการ
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Details Table -->
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                เรียน คณะผู้ตรวจติดตามภายใน (${auditorsText})<br/>
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
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600; vertical-align: top;">ผู้รับการตรวจ:</td>
                  <td style="padding: 8px 12px; color: #1E293B; vertical-align: top;">${auditeesText}</td>
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

  const auditeesText =
    Array.isArray(audit.auditees) && audit.auditees.length > 0
      ? audit.auditees
          .map((a, idx) => `${idx + 1}. ${a.name || '-'}${a.department ? ` (${a.department})` : ''}`)
          .join('<br/>')
      : `${audit.auditee1Name || '-'}${audit.auditeeDepartment ? ` (${audit.auditeeDepartment})` : ''}`;

  const auditorsGreeting =
    audit.hasSecondAuditor && audit.auditor2Name
      ? `${audit.auditor1Name || '-'}${audit.auditor2Name ? `, ${audit.auditor2Name}` : ''}`
      : `${audit.auditor1Name || '-'}`;

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
            <td style="padding: 18px 24px; background-color: #FFFFFF; border-bottom: 3px solid #DC2626;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td width="48" valign="middle" style="width: 48px; vertical-align: middle; padding-right: 14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px; width: 44px; height: 44px; border: 1px solid #E2E8F0; border-collapse: collapse;">
                      <tr>
                        <td align="center" valign="middle" style="text-align: center; vertical-align: middle; padding: 4px;">
                          <img src="https://raw.githubusercontent.com/prasertsakt/ICITWorkspace/main/public/icit-logo.png" width="36" height="36" alt="ICIT" style="width: 36px; height: 36px; display: block; border: 0; outline: none;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="vertical-align: middle; text-align: left;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #DC2626; font-weight: 700; line-height: 1.3;">
                      สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)
                    </div>
                    <div style="font-size: 16px; font-weight: 700; color: #0F172A; line-height: 1.3; margin-top: 2px;">
                      ระบบบริหารงาน IMS (ISO 9001 / ISO 27001)
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="padding: 16px 24px; background-color: #FEF2F2; border-bottom: 1px solid #FECACA;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 15px; font-weight: 700; color: #DC2626; line-height: 1.4;">
                      [แจ้งเตือน] แผนการตรวจติดตามภายในถูกส่งกลับเพื่อแก้ไข (Return to Revision)
                    </div>
                    <div style="font-size: 13px; color: #991B1B; margin-top: 5px; line-height: 1.5;">
                      โดย: ${leadActorName} (Lead Internal Auditor) &bull; กรุณาปรับปรุงข้อมูลและส่งใหม่อีกครั้ง
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Details Table -->
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                เรียน คณะผู้ตรวจติดตามภายใน (${auditorsGreeting})<br/>
                Lead Internal Auditor ได้พิจารณาแผนการตรวจติดตามหัวข้อ <strong>"${audit.topic}"</strong> และมีความเห็นให้ส่งกลับเพื่อปรับปรุงแก้ไขข้อมูลตามรายละเอียดด้านล่าง:
              </p>

              <!-- Revision Comment Highlight Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; background-color: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <div style="font-size: 13px; font-weight: 700; color: #D97706; margin-bottom: 6px;">
                      [ข้อคิดเห็น / สิ่งที่ต้องแก้ไขจาก Lead IA]
                    </div>
                    <div style="font-size: 14px; color: #92400E; line-height: 1.6; font-weight: 500; white-space: pre-line;">
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
                  <td style="padding: 6px 12px; color: #64748B; font-weight: 600; vertical-align: top;">ผู้รับการตรวจ:</td>
                  <td style="padding: 6px 12px; color: #1E293B; vertical-align: top;">${auditeesText}</td>
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
 * Generate HTML email for Auditees when Internal Audit is completed & evaluated (C / NC / OFI)
 */
export function generateImsEvaluationNotificationHtml({ audit, appBaseUrl = '' }) {
  const baseUrl = appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://icitworkspace.web.app');
  const auditUrl = `${baseUrl}/ims/audit`;

  const auditeesText =
    Array.isArray(audit.auditees) && audit.auditees.length > 0
      ? audit.auditees
          .map((a, idx) => `${idx + 1}. ${a.name || '-'}${a.department ? ` (${a.department})` : ''}`)
          .join('<br/>')
      : `${audit.auditee1Name || '-'}${audit.auditeeDepartment ? ` (${audit.auditeeDepartment})` : ''}`;

  const auditorsText =
    Array.isArray(audit.auditors) && audit.auditors.length > 0
      ? audit.auditors
          .map((a, idx) => `${idx + 1}. ${a.name || '-'}${a.department ? ` (${a.department})` : ''}`)
          .join('<br/>')
      : audit.hasSecondAuditor && audit.auditor2Name
      ? `1. ${audit.auditor1Name || '-'}<br/>2. ${audit.auditor2Name}`
      : `1. ${audit.auditor1Name || '-'}`;

  const result = audit.result || 'C';
  let badgeColor = '#16A34A';
  let badgeBg = '#F0FDF4';
  let badgeBorder = '#BBF7D0';
  let resultLabel = 'C (สอดคล้องตามข้อกำหนด - Conformity)';
  let resultDesc = 'ผลการตรวจติดตามภายในเป็นไปตามข้อกำหนดมาตรฐาน';

  if (result === 'NC') {
    badgeColor = '#DC2626';
    badgeBg = '#FEF2F2';
    badgeBorder = '#FECACA';
    resultLabel = 'NC (ไม่เป็นไปตามข้อกำหนด - Non-Conformity)';
    resultDesc = 'พบประเด็นที่ไม่เป็นไปตามข้อกำหนด กรุณาประสานงานเพื่อดำเนินการเปิด CAR และปรับปรุงแก้ไขต่อไป';
  } else if (result === 'OFI') {
    badgeColor = '#D97706';
    badgeBg = '#FFFBEB';
    badgeBorder = '#FDE68A';
    resultLabel = 'OFI (โอกาสในการปรับปรุง - Opportunity for Improvement)';
    resultDesc = 'พบข้อสังเกตเพื่อโอกาสในการพัฒนาและปรับปรุงกระบวนการทำงานให้ดียิ่งขึ้น';
  }

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>แจ้งผลการตรวจติดตามภายใน: ${audit.topic}</title>
</head>
<body style="font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
          <!-- Official ICIT Header -->
          <tr>
            <td style="padding: 18px 24px; background-color: #FFFFFF; border-bottom: 3px solid ${badgeColor};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td width="48" valign="middle" style="width: 48px; vertical-align: middle; padding-right: 14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 8px; width: 44px; height: 44px; border: 1px solid #E2E8F0; border-collapse: collapse;">
                      <tr>
                        <td align="center" valign="middle" style="text-align: center; vertical-align: middle; padding: 4px;">
                          <img src="https://raw.githubusercontent.com/prasertsakt/ICITWorkspace/main/public/icit-logo.png" width="36" height="36" alt="ICIT" style="width: 36px; height: 36px; display: block; border: 0; outline: none;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" style="vertical-align: middle; text-align: left;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #0D9488; font-weight: 700; line-height: 1.3;">
                      สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)
                    </div>
                    <div style="font-size: 16px; font-weight: 700; color: #0F172A; line-height: 1.3; margin-top: 2px;">
                      ระบบบริหารงาน IMS (ISO 9001 / ISO 27001)
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="padding: 16px 24px; background-color: ${badgeBg}; border-bottom: 1px solid ${badgeBorder};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 15px; font-weight: 700; color: ${badgeColor}; line-height: 1.4;">
                      [แจ้งผลการตรวจ] บันทึกผลการตรวจติดตามภายในเรียบร้อยแล้ว (${result})
                    </div>
                    <div style="font-size: 13px; color: #334155; margin-top: 5px; line-height: 1.5;">
                      ${resultDesc}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Details Table -->
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                เรียน ผู้รับการตรวจ<br/>
                คณะผู้ตรวจติดตามภายในได้ดำเนินการตรวจติดตามและบันทึกผลการประเมินในระบบเรียบร้อยแล้ว โดยมีรายละเอียดดังนี้:
              </p>

              <!-- Result Highlight Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px; background-color: ${badgeBg}; border: 1.5px solid ${badgeBorder}; border-radius: 8px;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <div style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">
                      ผลการตรวจสรุป (Result)
                    </div>
                    <div style="font-size: 16px; font-weight: 800; color: ${badgeColor}; line-height: 1.4;">
                      ${resultLabel}
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13.5px; line-height: 1.6; border-collapse: collapse; background-color: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
                <tr>
                  <td width="150" style="padding: 8px 12px; color: #64748B; font-weight: 600; vertical-align: top;">หัวข้อที่รับการตรวจ:</td>
                  <td style="padding: 8px 12px; color: #DC2626; font-weight: 700; vertical-align: top;">${audit.topic || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600; vertical-align: top;">ปีงบประมาณ / มาตรฐาน:</td>
                  <td style="padding: 8px 12px; color: #1E293B; vertical-align: top;">ปีงบประมาณ ${audit.auditYear || '2569'} &bull; ${audit.isoStandard || 'IMS 9001/27001'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600; vertical-align: top;">วันที่ทำการตรวจ:</td>
                  <td style="padding: 8px 12px; color: #0284C7; font-weight: 700; vertical-align: top;">${audit.auditDate || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600; vertical-align: top;">คณะผู้ตรวจติดตาม:</td>
                  <td style="padding: 8px 12px; color: #0369A1; vertical-align: top;">${auditorsText}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600; vertical-align: top;">ผู้รับการตรวจ:</td>
                  <td style="padding: 8px 12px; color: #1E293B; vertical-align: top;">${auditeesText}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600; vertical-align: top;">Item (ข้อตรวจ):</td>
                  <td style="padding: 8px 12px; color: #0284C7; vertical-align: top;">${audit.item || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600; vertical-align: top;">Clauses (ข้อกำหนด):</td>
                  <td style="padding: 8px 12px; color: #1E293B; vertical-align: top;">${audit.clauses || '-'}</td>
                </tr>
                ${audit.findings ? `
                <tr>
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600; vertical-align: top; border-top: 1px dashed #CBD5E1;">สิ่งที่ตรวจพบ (Findings):</td>
                  <td style="padding: 8px 12px; color: #334155; vertical-align: top; border-top: 1px dashed #CBD5E1; white-space: pre-line;">${audit.findings}</td>
                </tr>` : ''}
                ${audit.recommendation ? `
                <tr>
                  <td style="padding: 8px 12px; color: #64748B; font-weight: 600; vertical-align: top; border-top: 1px dashed #CBD5E1;">ข้อเสนอแนะ (Recommendation):</td>
                  <td style="padding: 8px 12px; color: #334155; vertical-align: top; border-top: 1px dashed #CBD5E1; white-space: pre-line;">${audit.recommendation}</td>
                </tr>` : ''}
              </table>

              <!-- Action Button Table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${auditUrl}" target="_blank" style="display: inline-block; background: ${badgeColor}; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);">
                      เข้าสู่ระบบเพื่อดูรายละเอียดรายงานการตรวจ &rarr;
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
 * Helper: Resolve email for an auditee (from object or personnel list cache)
 */
function resolveAuditeeEmail(auditee) {
  if (auditee?.email && auditee.email.trim()) return auditee.email.trim().toLowerCase();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('icit_org_personnel');
      if (raw) {
        const list = JSON.parse(raw);
        const match = list.find(
          (p) =>
            (auditee?.id && p.id === auditee.id) ||
            (auditee?.name && p.name && p.name.trim() === auditee.name.trim())
        );
        if (match?.email && match.email.trim()) {
          return match.email.trim().toLowerCase();
        }
      }
    } catch (e) {}
  }
  return '';
}

/**
 * Save (create or update) an IMS audit report
 */
export async function saveImsAuditRecord(auditData, actor, options = {}) {
  initImsLocalStorage();
  const now = new Date().toISOString();
  const id = auditData.id || `audit-${auditData.auditYear || '2569'}-${Date.now()}`;

  const auditees =
    Array.isArray(auditData.auditees) && auditData.auditees.length > 0
      ? auditData.auditees.map((a) => ({
          ...a,
          email: a.email || resolveAuditeeEmail(a) || '',
        }))
      : auditData.auditee1Name
      ? [
          {
            id: auditData.auditee1Id || '',
            name: auditData.auditee1Name,
            department: auditData.auditeeDepartment || '',
            email: auditData.auditee1Email || resolveAuditeeEmail({ id: auditData.auditee1Id, name: auditData.auditee1Name }) || '',
          },
        ]
      : [];

  const record = {
    ...auditData,
    id,
    auditees,
    auditee1Id: auditees[0]?.id || auditData.auditee1Id || '',
    auditee1Name: auditees[0]?.name || auditData.auditee1Name || '',
    auditee1Email: auditees[0]?.email || auditData.auditee1Email || '',
    auditeeDepartment: auditees[0]?.department || auditData.auditeeDepartment || '',
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
      await setDoc(doc(db, 'ims_audits', id), cleanForFirestore(record), { merge: true });
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

  // Mail notification to Auditees when audit evaluation is completed (C / NC / OFI)
  if (record.status === 'COMPLETED') {
    const auditeeEmails = [];
    if (Array.isArray(record.auditees)) {
      record.auditees.forEach((a) => {
        const em = a.email || resolveAuditeeEmail(a);
        if (em && em.trim() && !auditeeEmails.includes(em.trim().toLowerCase())) {
          auditeeEmails.push(em.trim().toLowerCase());
        }
      });
    }
    if (record.auditee1Email && !auditeeEmails.includes(record.auditee1Email.trim().toLowerCase())) {
      auditeeEmails.push(record.auditee1Email.trim().toLowerCase());
    }

    if (auditeeEmails.length > 0) {
      try {
        const htmlBody = generateImsEvaluationNotificationHtml({
          audit: record,
        });
        sendImsAuditEmail({
          to: auditeeEmails.join(', '),
          subject: `[ระบบ IMS] แจ้งผลการตรวจติดตามภายใน: ${record.topic} (ผลการตรวจ: ${record.result || 'C'})`,
          htmlBody,
          auditId: record.id,
          targetStep: 'IMS_EVALUATION_COMPLETED',
          senderName: 'ระบบบริหารงาน IMS (คณะผู้ตรวจติดตาม)',
        }).catch((err) => console.warn('Auditee evaluation email error:', err));
      } catch (err) {
        console.warn('Failed sending evaluation email to auditees:', err);
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
      // Optimized delta write: only persist approval fields
      await setDoc(
        doc(db, 'ims_audits', auditId),
        cleanForFirestore({
          status: 'READY_FOR_AUDIT',
          approvedByLeadIA: true,
          approvedAt: now,
          approvedByName: leadActor?.name || 'Lead Internal Auditor',
          approvedByEmail: leadActor?.email || '',
          leadRevisionComment: '',
          updatedAt: now,
        }),
        { merge: true }
      );
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
      // Optimized delta write: only persist return status and comment
      await setDoc(
        doc(db, 'ims_audits', auditId),
        cleanForFirestore({
          status: 'RETURNED_FOR_REVISION',
          approvedByLeadIA: false,
          leadRevisionComment: comment || '',
          returnedAt: now,
          returnedByName: leadActor?.name || 'Lead Internal Auditor',
          returnedByEmail: leadActor?.email || '',
          updatedAt: now,
        }),
        { merge: true }
      );
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
      // Optimized delta write: only persist findings, recommendations and result
      await setDoc(
        doc(db, 'ims_audits', auditId),
        cleanForFirestore({
          findings: evaluationData.findings || '',
          recommendation: evaluationData.recommendation || '',
          result: evaluationData.result || 'C',
          status: 'COMPLETED',
          evaluatedAt: now,
          evaluatedByName: auditorActor?.name || target.auditor1Name,
          updatedAt: now,
        }),
        { merge: true }
      );
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

  // Mail notification to Auditees when evaluation is completed
  if (target && target.status === 'COMPLETED') {
    const auditeeEmails = [];
    if (Array.isArray(target.auditees)) {
      target.auditees.forEach((a) => {
        const em = a.email || resolveAuditeeEmail(a);
        if (em && em.trim() && !auditeeEmails.includes(em.trim().toLowerCase())) {
          auditeeEmails.push(em.trim().toLowerCase());
        }
      });
    }
    if (target.auditee1Email && !auditeeEmails.includes(target.auditee1Email.trim().toLowerCase())) {
      auditeeEmails.push(target.auditee1Email.trim().toLowerCase());
    }

    if (auditeeEmails.length > 0) {
      try {
        const htmlBody = generateImsEvaluationNotificationHtml({
          audit: target,
        });
        sendImsAuditEmail({
          to: auditeeEmails.join(', '),
          subject: `[ระบบ IMS] แจ้งผลการตรวจติดตามภายใน: ${target.topic} (ผลการตรวจ: ${target.result || 'C'})`,
          htmlBody,
          auditId: target.id,
          targetStep: 'IMS_EVALUATION_COMPLETED',
          senderName: 'ระบบบริหารงาน IMS (คณะผู้ตรวจติดตาม)',
        }).catch((err) => console.warn('Auditee evaluation email error:', err));
      } catch (err) {
        console.warn('Failed sending evaluation email to auditees:', err);
      }
    }
  }

  return target;
}

// -------------------------------------------------------------
// Yearly Auditor Assignment Management
// -------------------------------------------------------------

export const DEFAULT_YEARLY_CONFIG = {
  year: '2569',
  _isConfigured: false, // false = default placeholder, true = explicitly saved by admin
  leadAuditorId: '',
  leadAuditorName: '',
  leadAuditorEmail: '',
  dccId: '',
  dccName: '',
  dccEmail: '',
  appointmentOrderUrl: '',
  auditorIds: [],
  auditors: [],
  updatedAt: new Date().toISOString(),
  updatedBy: 'ผู้ดูแลระบบ',
};

/**
 * Subscribe to Yearly Assigned Auditors config
 * OPTIMIZATION: Uses a single shared Firestore onSnapshot listener per year.
 * Eliminates spurious Firestore writes during read/subscription calls.
 */
export function subscribeYearlyAuditors(year, callback) {
  const currentYear = year || '2569';
  if (!configSubscribersMap[currentYear]) {
    configSubscribersMap[currentYear] = [];
  }
  configSubscribersMap[currentYear].push(callback);

  const localKey = `${LOCAL_KEY_IMS_CONFIG_PREFIX}${currentYear}`;

  // Instant response from memory or localStorage
  if (cachedConfigMap[currentYear]) {
    callback(cachedConfigMap[currentYear]);
  } else if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        cachedConfigMap[currentYear] = parsed;
        callback(parsed);
      } catch (e) {
        callback({ ...DEFAULT_YEARLY_CONFIG, year: currentYear });
      }
    } else {
      callback({ ...DEFAULT_YEARLY_CONFIG, year: currentYear });
    }
  }

  // Multi-tab real-time storage event listener
  const handleConfigStorageChange = (e) => {
    if (!e || e.key === localKey) {
      try {
        const raw = localStorage.getItem(localKey);
        const data = JSON.parse(raw || '{}');
        cachedConfigMap[currentYear] = data;
        callback(data);
      } catch (err) {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleConfigStorageChange);
  }

  // Single shared Firestore onSnapshot listener per year
  if (isFirebaseConfigured && db && !sharedConfigUnsubMap[currentYear]) {
    try {
      const docRef = doc(db, 'ims_config', `year_${currentYear}`);
      sharedConfigUnsubMap[currentYear] = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const isConfigured =
              data._isConfigured === true ||
              Boolean(
                data.leadAuditorId ||
                data.leadAuditorName ||
                (data.auditors && data.auditors.length > 0) ||
                data.dccId ||
                data.dccName
              );
            const fullData = { ...data, _isConfigured: isConfigured };
            cachedConfigMap[currentYear] = fullData;
            if (typeof window !== 'undefined') {
              localStorage.setItem(localKey, JSON.stringify(fullData));
            }
            notifyConfigSubscribers(currentYear, fullData);
          } else {
            // Optimization: Serve default in-memory WITHOUT writing to Firestore!
            // Only explicit Admin action (saveYearlyAuditors) writes to Firestore.
            const defaultData = { ...DEFAULT_YEARLY_CONFIG, year: currentYear, _isConfigured: false };
            cachedConfigMap[currentYear] = defaultData;
            notifyConfigSubscribers(currentYear, defaultData);
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
      // Optimization: Teardown Firestore listener if no more subscribers for this year
      if (configSubscribersMap[currentYear].length === 0 && sharedConfigUnsubMap[currentYear]) {
        sharedConfigUnsubMap[currentYear]();
        delete sharedConfigUnsubMap[currentYear];
      }
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleConfigStorageChange);
    }
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
    _isConfigured: true, // Explicitly saved by admin
    updatedAt: now,
    updatedBy: adminActor?.name || 'Admin',
  };

  cachedConfigMap[currentYear] = payload;

  if (typeof window !== 'undefined') {
    localStorage.setItem(localKey, JSON.stringify(payload));
    notifyConfigSubscribers(currentYear, payload);
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'ims_config', `year_${currentYear}`), cleanForFirestore(payload), { merge: true });
    } catch (err) {
      console.warn('Failed to save ims_config to Firestore:', err);
    }
  }

  try {
    logActivity({
      category: 'IMS_AUDIT',
      action: 'CONFIG_AUDITORS',
      details: `กำหนดรายชื่อผู้ตรวจติดตามและ DCC ประจำปีงบประมาณ ${currentYear} (MR: ${payload.mrName || '-'}, Lead: ${payload.leadAuditorName || '-'}, DCC: ${payload.dccName || '-'}, Auditors: ${payload.auditors?.length || 0} ท่าน)`,
      actorEmail: adminActor?.email,
      actorName: adminActor?.name,
      metadata: { year: currentYear, mr: payload.mrName, lead: payload.leadAuditorName, dcc: payload.dccName, auditorsCount: payload.auditors?.length || 0 },
    });
  } catch (e) {}

  return payload;
}

/**
 * Check if the user is assigned as DCC (ผู้ควบคุมเอกสาร) in any fiscal year (cached or localStorage)
 */
export function isUserDccInAnyYear(user, personnel) {
  if (!user && !personnel) return false;
  const userEmail = (user?.email || personnel?.email || '').toLowerCase().trim();
  const personId = personnel?.id;

  // 1. Check in-memory cached configs
  for (const yr in cachedConfigMap) {
    const cfg = cachedConfigMap[yr];
    if (cfg?.dccEmail && cfg.dccEmail.toLowerCase().trim() === userEmail) return true;
    if (cfg?.dccId && personId && cfg.dccId === personId) return true;
  }

  // 2. Check localStorage configs for available years
  if (typeof window !== 'undefined') {
    try {
      const currentYearNum = new Date().getFullYear() + 543;
      const yearsToCheck = [
        String(currentYearNum + 1),
        String(currentYearNum),
        String(currentYearNum - 1),
        String(currentYearNum - 2),
        String(currentYearNum - 3),
        '2571',
        '2570',
        '2569',
        '2568',
        '2567',
      ];
      for (const yr of yearsToCheck) {
        const raw = localStorage.getItem(`${LOCAL_KEY_IMS_CONFIG_PREFIX}${yr}`);
        if (raw) {
          const cfg = JSON.parse(raw);
          if (cfg?.dccEmail && cfg.dccEmail.toLowerCase().trim() === userEmail) return true;
          if (cfg?.dccId && personId && cfg.dccId === personId) return true;
        }
      }
    } catch (e) {}
  }

  return false;
}

/**
 * Check if the user is assigned as DCC (ผู้ควบคุมเอกสาร) for the given year
 * If the current year is not configured yet, it will fallback to checking if the user is DCC in any year
 */
export function isDccUser(user, personnel, yearConfig, checkOtherYearsIfUnset = true) {
  if (!user && !personnel) return false;
  const userEmail = (user?.email || personnel?.email || '').toLowerCase().trim();
  const personId = personnel?.id;

  // 1. Check directly against current yearConfig
  if (yearConfig?.dccEmail && yearConfig.dccEmail.toLowerCase().trim() === userEmail) {
    return true;
  }
  if (yearConfig?.dccId && personId && yearConfig.dccId === personId) {
    return true;
  }

  // 2. If current year does not have DCC defined yet and checkOtherYearsIfUnset is true, fallback to checking any year
  if (checkOtherYearsIfUnset && !yearConfig?.dccEmail && !yearConfig?.dccId) {
    return isUserDccInAnyYear(user, personnel);
  }

  return false;
}

/**
 * Check if the user is assigned as MR (Management Representative) for the given year
 */
export function isMrUser(user, personnel, yearConfig) {
  if (!user && !personnel) return false;
  const userEmail = (user?.email || personnel?.email || '').toLowerCase().trim();
  const personId = personnel?.id;
  if (yearConfig?.mrEmail && yearConfig.mrEmail.toLowerCase().trim() === userEmail) {
    return true;
  }
  if (yearConfig?.mrId && personId && yearConfig.mrId === personId) {
    return true;
  }
  return false;
}

/**
 * Check if the user is authorized to create/edit audits for a given year:
 * - The yearly config must be explicitly configured by admin (_isConfigured === true)
 * - Must be assigned as Lead Auditor, OR
 * - Assigned as DCC (ผู้ควบคุมเอกสาร), OR
 * - Assigned as Internal Auditor for that year
 */
export function isUserAuthorizedAuditor(user, personnel, yearConfig) {
  if (!user && !personnel) return false;

  // If the yearly config has not been explicitly configured by admin, no one is authorized
  if (!yearConfig || yearConfig._isConfigured !== true) {
    return false;
  }

  const userEmail = (user?.email || personnel?.email || '').toLowerCase().trim();
  const personId = personnel?.id;

  // Check if lead auditor
  if (yearConfig?.leadAuditorEmail && yearConfig.leadAuditorEmail.toLowerCase().trim() === userEmail) {
    return true;
  }
  if (yearConfig?.leadAuditorId && personId && yearConfig.leadAuditorId === personId) {
    return true;
  }

  // Check if DCC (ผู้ควบคุมเอกสาร)
  if (yearConfig?.dccEmail && yearConfig.dccEmail.toLowerCase().trim() === userEmail) {
    return true;
  }
  if (yearConfig?.dccId && personId && yearConfig.dccId === personId) {
    return true;
  }

  // Check if MR (Management Representative)
  if (yearConfig?.mrEmail && yearConfig.mrEmail.toLowerCase().trim() === userEmail) {
    return true;
  }
  if (yearConfig?.mrId && personId && yearConfig.mrId === personId) {
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
        (a.email && a.email.toLowerCase().trim() === userEmail)
    );
    if (isMatched) return true;
  }

  return false;
}

/**
 * Check if the user is the Lead Auditor for the given year
 */
export function isLeadAuditorUser(user, personnel, yearConfig) {
  if (!user && !personnel) return false;
  const userEmail = (user?.email || personnel?.email || '').toLowerCase().trim();
  const personId = personnel?.id;
  if (yearConfig?.leadAuditorEmail && yearConfig.leadAuditorEmail.toLowerCase().trim() === userEmail) {
    return true;
  }
  if (yearConfig?.leadAuditorId && personId && yearConfig.leadAuditorId === personId) {
    return true;
  }
  return false;
}

/**
 * Check if the user is an assigned auditor on a specific audit report (Auditor 1 or Auditor 2)
 */
export function isAssignedAuditorOnAudit(audit, user, personnel) {
  if (!audit || (!user && !personnel)) return false;
  const userEmail = (user?.email || personnel?.email || '').toLowerCase();
  const personId = personnel?.id;

  if (Array.isArray(audit.auditors)) {
    if (personId && audit.auditors.some((a) => a.id === personId)) return true;
    if (userEmail && audit.auditors.some((a) => a.email && a.email.toLowerCase() === userEmail)) return true;
  }

  if (personId && (audit.auditor1Id === personId || audit.auditor2Id === personId)) {
    return true;
  }
  if (userEmail && (
    (audit.auditor1Email && audit.auditor1Email.toLowerCase() === userEmail) ||
    (audit.auditor2Email && audit.auditor2Email.toLowerCase() === userEmail) ||
    (audit.createdByEmail && audit.createdByEmail.toLowerCase() === userEmail)
  )) {
    return true;
  }
  return false;
}

/**
 * Check if the user can edit a report:
 * - Admin or Lead Auditor: can edit all reports
 * - DCC (ผู้ควบคุมเอกสาร): can edit all reports
 * - Internal Auditor: can only edit reports where they are an assigned auditor
 */
export function canUserEditAudit(audit, user, personnel, yearConfig, isAdmin) {
  if (isAdmin) return true;
  if (isLeadAuditorUser(user, personnel, yearConfig, isAdmin)) return true;
  if (isDccUser(user, personnel, yearConfig, isAdmin)) return true;
  if (isMrUser(user, personnel, yearConfig)) return true;
  if (isAssignedAuditorOnAudit(audit, user, personnel)) return true;
  return false;
}

/**
 * Check if the user can delete a report:
 * - Admin or Lead Auditor: can delete all reports
 * - DCC (ผู้ควบคุมเอกสาร): can delete all reports
 * - Internal Auditor: can delete only reports where they are an assigned auditor AND the report has NOT been approved yet
 *   (If approved by Lead IA, only Lead IA, DCC, or Admin can delete)
 */
export function canUserDeleteAudit(audit, user, personnel, yearConfig, isAdmin) {
  if (isAdmin) return true;
  if (isLeadAuditorUser(user, personnel, yearConfig, isAdmin)) return true;
  if (isDccUser(user, personnel, yearConfig, isAdmin)) return true;
  if (isAssignedAuditorOnAudit(audit, user, personnel) && !audit.approvedByLeadIA) {
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// Dynamic IMS Audit Topics Management (Admin only)
// -------------------------------------------------------------

let topicsSubscribers = [];
let sharedTopicsUnsubscribe = null;
let cachedTopics = null;

function notifyTopicsSubscribers(data) {
  cachedTopics = data;
  topicsSubscribers.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('IMS Topics subscriber error:', e);
    }
  });
}

/**
 * Subscribe to dynamic IMS Audit Topics with real-time Firestore sync & local fallback
 */
export function subscribeImsAuditTopics(callback) {
  topicsSubscribers.push(callback);

  // Send in-memory or localStorage or default topics immediately
  if (cachedTopics && Array.isArray(cachedTopics) && cachedTopics.length > 0) {
    callback(cachedTopics);
  } else if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_KEY_IMS_AUDIT_TOPICS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedTopics = parsed;
          callback(parsed);
        } else {
          callback(IMS_AUDIT_TOPICS);
        }
      } catch (e) {
        callback(IMS_AUDIT_TOPICS);
      }
    } else {
      callback(IMS_AUDIT_TOPICS);
    }
  } else {
    callback(IMS_AUDIT_TOPICS);
  }

  // Multi-tab real-time storage event listener
  const handleTopicsStorageChange = (e) => {
    if (!e || e.key === LOCAL_KEY_IMS_AUDIT_TOPICS) {
      try {
        const raw = localStorage.getItem(LOCAL_KEY_IMS_AUDIT_TOPICS);
        const list = JSON.parse(raw || '[]');
        if (Array.isArray(list) && list.length > 0) {
          cachedTopics = list;
          callback(list);
        }
      } catch (err) {}
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleTopicsStorageChange);
  }

  // Single shared Firestore onSnapshot listener
  if (isFirebaseConfigured && db && !sharedTopicsUnsubscribe) {
    try {
      const docRef = doc(db, 'ims_config', 'audit_topics');
      sharedTopicsUnsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const topics =
              Array.isArray(data?.topics) && data.topics.length > 0 ? data.topics : IMS_AUDIT_TOPICS;
            cachedTopics = topics;
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCAL_KEY_IMS_AUDIT_TOPICS, JSON.stringify(topics));
            }
            notifyTopicsSubscribers(topics);
          } else {
            cachedTopics = IMS_AUDIT_TOPICS;
            notifyTopicsSubscribers(IMS_AUDIT_TOPICS);
          }
        },
        (error) => {
          console.warn('Firestore ims_config audit_topics onSnapshot error:', error);
        }
      );
    } catch (e) {
      console.warn('Failed to listen to Firestore audit_topics:', e);
    }
  }

  return () => {
    topicsSubscribers = topicsSubscribers.filter((cb) => cb !== callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleTopicsStorageChange);
    }
    if (topicsSubscribers.length === 0 && sharedTopicsUnsubscribe) {
      sharedTopicsUnsubscribe();
      sharedTopicsUnsubscribe = null;
    }
  };
}

/**
 * Save / update IMS Audit Topics list (Admin only)
 */
export async function saveImsAuditTopics(topicsList, actor) {
  const cleaned = Array.isArray(topicsList)
    ? topicsList.map((t) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean)
    : [];

  const now = new Date().toISOString();
  const payload = {
    topics: cleaned,
    updatedAt: now,
    updatedBy: actor?.name || actor?.email || 'Admin',
  };

  cachedTopics = cleaned;
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_KEY_IMS_AUDIT_TOPICS, JSON.stringify(cleaned));
  }
  notifyTopicsSubscribers(cleaned);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'ims_config', 'audit_topics'), cleanForFirestore(payload), { merge: true });
    } catch (err) {
      console.warn('Failed to save audit_topics to Firestore:', err);
    }
  }

  try {
    logActivity({
      category: 'IMS_CONFIG',
      action: 'UPDATE_AUDIT_TOPICS',
      details: `แก้ไขรายการหัวข้อที่รับการตรวจ (Audit Topics) — จำนวน ${cleaned.length} หัวข้อ`,
      actorEmail: actor?.email,
      actorName: actor?.name,
      metadata: { totalTopics: cleaned.length },
    });
  } catch (e) {}

  return cleaned;
}

/**
 * Reset IMS Audit Topics back to default predefined topics
 */
export async function resetImsAuditTopicsToDefault(actor) {
  return await saveImsAuditTopics(IMS_AUDIT_TOPICS, actor);
}
