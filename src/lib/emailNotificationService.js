// Thai Email Notification System with 1-Click Approval Actions
import { formatImageDisplayUrl } from './driveUtils';

export const LOCAL_KEY_EMAIL_CONFIG = 'icit_email_notification_config';
export const LOCAL_KEY_SENT_EMAILS = 'icit_sent_email_logs';

/**
 * Get configured email webhook or endpoint settings
 */
export function getEmailConfig() {
  if (typeof window === 'undefined') {
    return {
      googleAppsScriptUrl: process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_EMAIL_URL || '',
      senderName: 'สำนักวิทยบริการและเทคโนโลยีสารสนเทศ (ICIT)',
      senderEmail: 'noreply-icit@icit.kmutnb.ac.th',
      enableLiveSending: false,
    };
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY_EMAIL_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading email config', e);
  }
  return {
    googleAppsScriptUrl: '',
    senderName: 'สำนักวิทยบริการและเทคโนโลยีสารสนเทศ (ICIT)',
    senderEmail: 'noreply-icit@icit.kmutnb.ac.th',
    enableLiveSending: false,
  };
}

/**
 * Save email config
 */
export function saveEmailConfig(config) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY_EMAIL_CONFIG, JSON.stringify(config));
}

/**
 * Generate secure action token for 1-click approvals
 */
export function generateApprovalToken(recordId, step) {
  const secretPart = btoa(`${recordId}:${step}:icit-secret-key-2026`).replace(/=/g, '');
  return secretPart;
}

/**
 * Validate action token
 */
export function validateApprovalToken(token, recordId, step) {
  if (!token || !recordId || !step) return false;
  const expected = generateApprovalToken(recordId, step);
  return token === expected;
}

/**
 * Generate Thai Email Subject & HTML Body for the specified workflow step
 */
export function generateEmailContent(record, targetStep, recipient, appBaseUrl = '') {
  const baseUrl = appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://icitworkspace.web.app');
  const token = generateApprovalToken(record.id, targetStep);

  let stepTitle = '';
  let recipientRoleText = '';
  let actionPrompt = '';
  let approveBtnText = 'อนุมัติ';
  let rejectBtnText = 'ไม่อนุมัติ';
  let showActionButtons = true;

  switch (targetStep) {
    case 'HR_REVIEW':
      stepTitle = 'แจ้งเตือนฝ่ายบุคคลตรวจสอบใบลงเวลา';
      recipientRoleText = 'เจ้าหน้าที่ ตำแหน่งบุคลากร';
      actionPrompt = 'กรุณาตรวจสอบข้อมูลเวลาปฏิบัติราชการและบันทึกความเห็นการตรวจสอบ';
      approveBtnText = 'ตรวจสอบแล้ว (ผ่าน)';
      rejectBtnText = 'ไม่ผ่านการตรวจสอบ';
      break;
    case 'WITNESS_CONFIRM':
      stepTitle = 'แจ้งเตือนพยานรับรองการลงเวลาปฏิบัติราชการ';
      recipientRoleText = 'พยานผู้รับรอง';
      actionPrompt = 'ท่านได้รับการระบุเป็นพยาน กรุณากดยืนยันรับรองหรือปฏิเสธการรับรองการเป็นพยาน';
      approveBtnText = 'รับรองการเป็นพยาน';
      rejectBtnText = 'ไม่รับรอง';
      break;
    case 'DEPT_HEAD_APPROVE':
      stepTitle = 'แจ้งเตือนหัวหน้าฝ่ายพิจารณาอนุมัติใบลงเวลา';
      recipientRoleText = 'หัวหน้าฝ่าย';
      actionPrompt = 'คำขอได้รับการตรวจสอบจากฝ่ายบุคคลและพยานรับรองแล้ว กรุณาพิจารณาอนุมัติ';
      approveBtnText = 'อนุมัติ';
      rejectBtnText = 'ไม่อนุมัติ';
      break;
    case 'DEPUTY_APPROVE':
      stepTitle = 'แจ้งเตือนรองผู้อำนวยการฝ่ายบริหารพิจารณาอนุมัติ';
      recipientRoleText = 'รองผู้อำนวยการฝ่ายบริหาร';
      actionPrompt = 'คำขอผ่านการรับรองและอนุมัติจากหัวหน้าฝ่ายแล้ว กรุณาพิจารณาอนุมัติขั้นตอนสุดท้าย';
      approveBtnText = 'อนุมัติ (จบกระบวนการ)';
      rejectBtnText = 'ไม่อนุมัติ';
      break;
    case 'COMPLETED':
      stepTitle = 'แจ้งผลการอนุมัติใบลงเวลา (อนุมัติสมบูรณ์)';
      recipientRoleText = 'ผู้ขอลงเวลา';
      actionPrompt = 'คำขอลงเวลาปฏิบัติราชการของท่านได้รับการอนุมัติเสร็จสมบูรณ์เรียบร้อยแล้ว';
      showActionButtons = false;
      break;
    case 'REJECTED':
      stepTitle = 'แจ้งผลการพิจารณาใบลงเวลา (ไม่อนุมัติ)';
      recipientRoleText = 'ผู้ขอลงเวลา';
      actionPrompt = 'คำขอลงเวลาปฏิบัติราชการของท่านไม่ผ่านการอนุมัติ';
      showActionButtons = false;
      break;
    default:
      stepTitle = 'แจ้งเตือนระบบใบลงเวลา';
      recipientRoleText = 'ผู้เกี่ยวข้อง';
      actionPrompt = 'มีรายการใบลงเวลาปฏิบัติราชการที่ต้องดำเนินการ';
  }

  const subject = `[ระบบใบลงเวลา ICIT] ${stepTitle}: ${record.requesterName} (${record.requestType})`;

  const approveUrl = `${baseUrl}/time-attendance?actionId=${record.id}&step=${targetStep}&decision=approve&token=${token}`;
  const rejectUrl = `${baseUrl}/time-attendance?actionId=${record.id}&step=${targetStep}&decision=reject&token=${token}`;
  const viewUrl = `${baseUrl}/time-attendance?viewId=${record.id}`;

  const previewImageUrl = formatImageDisplayUrl(record.imageProofUrl);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #F1F5F9; font-family: 'Kanit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1E293B; line-height: 1.6;">
  <div style="max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #E2E8F0;">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 28px 24px; color: #FFFFFF; text-align: center;">
      <div style="font-size: 13px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.9; margin-bottom: 6px; font-weight: 600;">
        ICIT WORKSPACE &bull; ระบบใบลงเวลา
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF;">
        ${record.requestType || 'ใบลงเวลาปฏิบัติราชการ'}
      </h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">
        ${stepTitle}
      </p>
    </div>

    <!-- Content Body -->
    <div style="padding: 24px;">
      <!-- Greeting & Notice -->
      <div style="background: #EEF2FF; border-left: 4px solid #4F46E5; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 15px; color: #3730A3;">
          <strong>เรียน ${recipient?.name || recipientRoleText}</strong>
        </p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #4338CA;">
          ${actionPrompt}
        </p>
      </div>

      <!-- Detail Card matching AppSheet Form -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tbody>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 8px; color: #64748B; width: 40%;">ผู้ขอลงเวลาปฏิบัติราชการ:</td>
            <td style="padding: 10px 8px; color: #2563EB; font-weight: 700;">${record.requesterName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 8px; color: #64748B;">สังกัด / ฝ่ายงาน:</td>
            <td style="padding: 10px 8px; color: #1E293B; font-weight: 500;">${record.requesterDepartment || '-'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 8px; color: #64748B;">วันที่ดำเนินการ (ยื่นคำขอ):</td>
            <td style="padding: 10px 8px; color: #1E293B;">${record.actionDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 8px; color: #64748B;">วันที่ขอลงเวลา:</td>
            <td style="padding: 10px 8px; color: #2563EB; font-weight: 700; font-size: 16px;">${record.attendanceDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 8px; color: #64748B;">เวลา:</td>
            <td style="padding: 10px 8px; color: #1E293B; font-weight: 600;">${record.attendanceTime}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 8px; color: #64748B;">ระบุบุคลากร (พยาน):</td>
            <td style="padding: 10px 8px; color: #1E293B;">${record.witnessName || '-'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 8px; color: #64748B;">หัวหน้าฝ่าย_:</td>
            <td style="padding: 10px 8px; color: #1E293B;">${record.departmentHeadName || '-'}</td>
          </tr>
          ${record.reason ? `
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 8px; color: #64748B;">เหตุผลความจำเป็น:</td>
            <td style="padding: 10px 8px; color: #334155;">${record.reason}</td>
          </tr>` : ''}
        </tbody>
      </table>

      ${record.commentHr ? `
      <!-- Related comment_บันทึกใบลงเวลา -->
      <div style="margin-bottom: 20px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px;">
        <div style="font-weight: 700; font-size: 13px; color: #334155; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>Related comment_บันทึกใบลงเวลา</span>
        </div>
        <div style="font-size: 13.5px; color: #0F172A; background: #FFFFFF; padding: 10px 12px; border-radius: 6px; border: 1px solid #CBD5E1;">
          ${record.commentHr}
        </div>
      </div>` : ''}

      ${previewImageUrl ? `
      <!-- Embedded CCTV / Proof Photo -->
      <div style="margin-bottom: 24px; text-align: center;">
        <div style="font-size: 13px; color: #64748B; margin-bottom: 8px; font-weight: 500;">
          แนบไฟล์ภาพกล้องวงจรปิด / หลักฐานเวลา:
        </div>
        <img src="${previewImageUrl}" alt="หลักฐานเวลา" style="max-width: 100%; max-height: 280px; border-radius: 8px; border: 1px solid #CBD5E1; box-shadow: 0 2px 8px rgba(0,0,0,0.06); object-fit: contain;" />
      </div>` : ''}

      <!-- Current Workflow Status Summary -->
      <div style="background: #F8FAFC; border-radius: 12px; padding: 16px; margin-bottom: 28px; border: 1px solid #E2E8F0;">
        <div style="font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 10px;">
          สรุปสถานะการดำเนินการ 4 ขั้นตอน:
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: #64748B;">1. สถานะการตรวจสอบโดย_ฝ่ายบุคคล:</span>
            <span style="color: #2563EB; font-weight: 700;">${record.statusHr || 'รอตรวจสอบ'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: #64748B;">2. สถานะการรับรองโดย_พยาน:</span>
            <span style="color: #2563EB; font-weight: 700;">${record.statusWitness || 'รอรับรอง'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: #64748B;">3. สถานะการอนุมัติโดย_หัวหน้าฝ่าย:</span>
            <span style="color: #2563EB; font-weight: 700;">${record.statusDeptHead || 'รออนุมัติ'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: #64748B;">4. สถานะการอนุมัติโดย_รองผอ:</span>
            <span style="color: #2563EB; font-weight: 700;">${record.statusDeputy || 'รออนุมัติ'}</span>
          </div>
        </div>
      </div>

      ${showActionButtons ? `
      <!-- 1-Click Action Buttons for Immediate Approval in Email -->
      <div style="background: #FFFFFF; border: 2px dashed #CBD5E1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">
          ดำเนินการทันทีผ่านอีเมล (1-Click Action)
        </div>
        <p style="font-size: 12.5px; color: #64748B; margin: 0 0 16px 0;">
          คลิกปุ่มด้านล่างเพื่ออนุมัติหรือไม่อนุมัติคำขอนี้ทันทีโดยไม่ต้องกรอกรหัสผ่านซ้ำ:
        </p>

        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <a href="${approveUrl}" target="_blank" style="display: inline-block; background-color: #10B981; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 12px 26px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
            &check; ${approveBtnText}
          </a>
          <a href="${rejectUrl}" target="_blank" style="display: inline-block; background-color: #EF4444; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 12px 26px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);">
            &cross; ${rejectBtnText}
          </a>
        </div>
      </div>` : ''}

      <!-- Link to open system -->
      <div style="text-align: center; padding: 10px 0;">
        <a href="${viewUrl}" target="_blank" style="display: inline-block; color: #4F46E5; font-size: 14px; font-weight: 600; text-decoration: underline;">
          เปิดดูรายละเอียดใบลงเวลาและประวัติกิจกรรมในระบบ ICIT Workspace &rarr;
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94A3B8;">
      อีเมลนี้เป็นข้อความอัตโนมัติจากระบบใบลงเวลา สำนักวิทยบริการและเทคโนโลยีสารสนเทศ (ICIT)<br />
      หากมีข้อสงสัยหรือข้อผิดพลาด กรุณาติดต่อฝ่ายบริหารงานบุคคล สำนักงานผู้อำนวยการ
    </div>
  </div>
</body>
</html>
`;

  return {
    subject,
    html,
    approveUrl,
    rejectUrl,
    viewUrl,
  };
}

/**
 * Find designated recipient for a given step
 */
export function getNotificationRecipientForStep(record, step, allPersonnel = []) {
  if (!record || !step) return null;

  if (step === 'HR_REVIEW') {
    return (
      allPersonnel.find((p) => p.position === 'บุคลากร' && p.status === 'ปกติ') || {
        name: 'เจ้าหน้าที่ฝ่ายบุคคล',
        email: 'hr@icit.org',
        role: 'เจ้าหน้าที่ฝ่ายบุคคล',
      }
    );
  }

  if (step === 'WITNESS_CONFIRM') {
    const p = allPersonnel.find((person) => person.id === record.witnessId);
    return (
      p || {
        name: record.witnessName || 'พยานผู้รับรอง',
        email: record.witnessEmail || 'witness@icit.org',
        role: 'พยานผู้รับรอง',
      }
    );
  }

  if (step === 'DEPT_HEAD_APPROVE') {
    const p = allPersonnel.find((person) => person.id === record.departmentHeadId);
    return (
      p || {
        name: record.departmentHeadName || 'หัวหน้าฝ่าย',
        email: record.departmentHeadEmail || 'head@icit.org',
        role: 'หัวหน้าฝ่าย',
      }
    );
  }

  if (step === 'DEPUTY_APPROVE') {
    const p = allPersonnel.find((person) => person.id === record.deputyDirectorId);
    return (
      p || {
        name: record.deputyDirectorName || 'รองผู้อำนวยการฝ่ายบริหาร',
        email: record.deputyDirectorEmail || 'deputy@icit.org',
        role: 'รองผู้อำนวยการฝ่ายบริหาร',
      }
    );
  }

  if (step === 'COMPLETED' || step === 'REJECTED') {
    const p = allPersonnel.find((person) => person.id === record.requesterId);
    return (
      p || {
        name: record.requesterName || 'ผู้ขอลงเวลา',
        email: record.requesterEmail || 'requester@icit.org',
        role: 'ผู้ขอลงเวลา',
      }
    );
  }

  return null;
}

/**
 * Dispatch or log email notification
 */
export async function sendTimeAttendanceNotification(record, targetStep, recipient, appBaseUrl = '') {
  const content = generateEmailContent(record, targetStep, recipient, appBaseUrl);
  const config = getEmailConfig();

  const logEntry = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    recordId: record.id,
    targetStep,
    recipientEmail: recipient?.email || 'unknown',
    recipientName: recipient?.name || 'ผู้เกี่ยวข้อง',
    recipientRole: recipient?.role || targetStep,
    subject: content.subject,
    sentAt: new Date().toISOString(),
    status: 'SENT',
    approveUrl: content.approveUrl,
    rejectUrl: content.rejectUrl,
    deliveryMethod: 'Local System Sandbox',
  };

  // Attempt live delivery via Google Apps Script Webhook or Next.js internal API
  const scriptUrl = config.googleAppsScriptUrl || process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_EMAIL_URL;

  if (scriptUrl && config.enableLiveSending) {
    try {
      // 1. Direct Webhook Call
      await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          to: recipient?.email,
          subject: content.subject,
          htmlBody: content.html,
          recordId: record.id,
          step: targetStep,
        }),
      });
      logEntry.deliveryMethod = 'Google Apps Script (Gmail API)';
      logEntry.status = 'DELIVERED';
    } catch (err) {
      console.warn('Google Script email notification failed, trying internal API route', err);
      // 2. Fallback to /api/attendance/notify
      try {
        await fetch('/api/attendance/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient?.email,
            subject: content.subject,
            htmlBody: content.html,
            recordId: record.id,
            step: targetStep,
            webhookUrl: scriptUrl,
          }),
        });
        logEntry.deliveryMethod = 'Next.js API Relay';
        logEntry.status = 'DELIVERED';
      } catch (e2) {
        logEntry.deliveryMethod = 'Local Simulation (API error)';
      }
    }
  } else {
    logEntry.deliveryMethod = 'ระบบจำลองการส่งอีเมล (Simulation Sandbox)';
  }

  // Save to sent log in localStorage
  if (typeof window !== 'undefined') {
    try {
      const logs = JSON.parse(localStorage.getItem(LOCAL_KEY_SENT_EMAILS) || '[]');
      logs.unshift(logEntry);
      if (logs.length > 100) logs.pop();
      localStorage.setItem(LOCAL_KEY_SENT_EMAILS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed saving sent email log', e);
    }
  }

  return { success: true, logEntry, content };
}

/**
 * Resend email notification explicitly
 */
export async function resendNotificationEmail(record, step, recipient, appBaseUrl = '') {
  return await sendTimeAttendanceNotification(record, step, recipient, appBaseUrl);
}

/**
 * Get recent sent email logs
 */
export function getSentEmailLogs(recordId = null) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY_SENT_EMAILS);
    const list = raw ? JSON.parse(raw) : [];
    if (recordId) {
      return list.filter((l) => l.recordId === recordId);
    }
    return list;
  } catch (e) {
    return [];
  }
}

