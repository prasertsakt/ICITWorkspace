// Thai Email Notification System with 1-Click Approval Actions
import { formatImageDisplayUrl } from './driveUtils';

export const LOCAL_KEY_EMAIL_CONFIG = 'icit_email_notification_config';
export const LOCAL_KEY_SENT_EMAILS = 'icit_sent_email_logs';

/**
 * Get configured email webhook or endpoint settings
 */
export function getEmailConfig() {
  const envUrl =
    process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_EMAIL_URL ||
    process.env.GOOGLE_SCRIPT_EMAIL_URL ||
    '';
  const envHrEmail =
    process.env.NEXT_PUBLIC_HR_EMAIL ||
    process.env.HR_EMAIL ||
    'tiawongsombat@gmail.com';
  const envDeptHeadEmail =
    process.env.NEXT_PUBLIC_DEPT_HEAD_EMAIL ||
    process.env.DEPT_HEAD_EMAIL ||
    'tiawongsombat@gmail.com';
  const envDeputyEmail =
    process.env.NEXT_PUBLIC_DEPUTY_DIRECTOR_EMAIL ||
    process.env.DEPUTY_DIRECTOR_EMAIL ||
    'tiawongsombat@gmail.com';

  const defaults = {
    googleAppsScriptUrl: envUrl,
    senderName: 'สำนักวิทยบริการและเทคโนโลยีสารสนเทศ (ICIT)',
    senderEmail: 'noreply-icit@icit.kmutnb.ac.th',
    hrEmail: envHrEmail,
    deptHeadEmail: envDeptHeadEmail,
    deputyDirectorEmail: envDeputyEmail,
    enableLiveSending: Boolean(envUrl),
  };

  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    const raw = localStorage.getItem(LOCAL_KEY_EMAIL_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      const effectiveScriptUrl = parsed.googleAppsScriptUrl || envUrl;
      return {
        googleAppsScriptUrl: effectiveScriptUrl,
        senderName: parsed.senderName || defaults.senderName,
        senderEmail: parsed.senderEmail || defaults.senderEmail,
        hrEmail: parsed.hrEmail || envHrEmail,
        deptHeadEmail: parsed.deptHeadEmail || envDeptHeadEmail,
        deputyDirectorEmail: parsed.deputyDirectorEmail || envDeputyEmail,
        enableLiveSending:
          parsed.enableLiveSending !== undefined && parsed.googleAppsScriptUrl
            ? parsed.enableLiveSending
            : Boolean(effectiveScriptUrl),
      };
    }
  } catch (e) {
    console.error('Failed reading email config', e);
  }

  return defaults;
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
      stepTitle = 'แจ้งเตือนฝ่ายบุคคลตรวจสอบขอลงเวลา';
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
      stepTitle = 'แจ้งเตือนหัวหน้าฝ่ายพิจารณาอนุมัติขอลงเวลา';
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
      stepTitle = 'แจ้งผลการอนุมัติขอลงเวลา (อนุมัติสมบูรณ์)';
      recipientRoleText = 'ผู้ขอลงเวลา';
      actionPrompt = 'คำขอลงเวลาปฏิบัติราชการของท่านได้รับการอนุมัติเสร็จสมบูรณ์เรียบร้อยแล้ว';
      showActionButtons = false;
      break;
    case 'REJECTED':
      stepTitle = 'แจ้งผลการพิจารณาขอลงเวลา (ไม่อนุมัติ)';
      recipientRoleText = 'ผู้ขอลงเวลา';
      actionPrompt = 'คำขอลงเวลาปฏิบัติราชการของท่านไม่ผ่านการอนุมัติ';
      showActionButtons = false;
      break;
    case 'CANCELLED':
      stepTitle = 'แจ้งเตือนการยกเลิกคำขอลงเวลา (โดยผู้ยื่นคำขอ)';
      recipientRoleText = 'ผู้เกี่ยวข้อง / ฝ่ายบุคคล';
      actionPrompt = `คำขอลงเวลาปฏิบัติราชการนี้ได้รับการยกเลิกโดย ${record.cancelledByName || record.requesterName} (เหตุผล: ${record.cancelReason || 'ผู้ยื่นขอยกเลิกคำขอ'}) กระบวนการพิจารณาอนุมัติสิ้นสุดลงแล้ว`;
      showActionButtons = false;
      break;
    default:
      stepTitle = 'แจ้งเตือนระบบขอลงเวลา';
      recipientRoleText = 'ผู้เกี่ยวข้อง';
      actionPrompt = 'มีรายการขอลงเวลาปฏิบัติราชการที่ต้องดำเนินการ';
  }

  const subject = `[ระบบขอลงเวลา ICIT] ${stepTitle}: ${record.requesterName} (${record.requestType})`;

  const approveUrl = `${baseUrl}/time-attendance?actionId=${record.id}&step=${targetStep}&decision=approve&token=${token}`;
  const rejectUrl = `${baseUrl}/time-attendance?actionId=${record.id}&step=${targetStep}&decision=reject&token=${token}`;
  const viewUrl = `${baseUrl}/time-attendance?viewId=${record.id}`;

  const previewImageUrl = formatImageDisplayUrl(record.imageProofUrl);

  const headerGradient =
    targetStep === 'CANCELLED'
      ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
      : targetStep === 'REJECTED'
        ? 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)'
        : targetStep === 'COMPLETED'
          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
          : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)';

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
    <div style="background: ${headerGradient}; padding: 28px 24px; color: #FFFFFF; text-align: center;">
      <div style="font-size: 13px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.9; margin-bottom: 6px; font-weight: 600;">
        ICIT WORKSPACE &bull; ระบบขอลงเวลา
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF;">
        ${record.requestType || 'ขอลงเวลาปฏิบัติราชการ'}
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
      <!-- Related comment_บันทึกขอลงเวลา -->
      <div style="margin-bottom: 20px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px;">
        <div style="font-weight: 700; font-size: 13px; color: #334155; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <span>Related comment_บันทึกขอลงเวลา</span>
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
      <!-- 1-Click Action with Comment Textbox in Email -->
      <div style="background: #FFFFFF; border: 2px dashed #CBD5E1; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 4px; text-align: center;">
          ดำเนินการตรวจสอบและลงความเห็นผ่านอีเมล (1-Click Action)
        </div>
        <p style="font-size: 12.5px; color: #64748B; margin: 0 0 16px 0; text-align: center;">
          สามารถพิมพ์ความเห็นในกล่องข้อความ และกดปุ่มเพื่อดำเนินการบันทึกผลได้ทันที:
        </p>

        <!-- Direct Form with Comment Textbox -->
        <form action="${baseUrl}/time-attendance" method="GET" target="_blank" style="margin: 0; padding: 0;">
          <input type="hidden" name="actionId" value="${record.id}" />
          <input type="hidden" name="step" value="${targetStep}" />
          <input type="hidden" name="token" value="${token}" />

          <div style="margin-bottom: 14px; text-align: left;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
              ความเห็นการตรวจสอบ / บันทึกเพิ่มเติม:
            </label>
            <textarea
              name="comment"
              rows="3"
              placeholder="พิมพ์ความเห็นการตรวจสอบ เช่น เวลามา-กลับถูกต้อง, ตรวจสอบภาพจากกล้องวงจรปิดแล้ว (ถ้ามี)..."
              style="width: 100%; box-sizing: border-box; padding: 10px 12px; font-size: 13.5px; border: 1.5px solid #CBD5E1; border-radius: 8px; font-family: inherit; line-height: 1.5; color: #1E293B; background: #F8FAFC;"
            ></textarea>
          </div>

          <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button
              type="submit"
              name="decision"
              value="approve"
              style="cursor: pointer; border: none; background-color: #10B981; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 12px 26px; border-radius: 8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); text-decoration: none;"
            >
              &check; ${approveBtnText}
            </button>
            <button
              type="submit"
              name="decision"
              value="reject"
              style="cursor: pointer; border: none; background-color: #EF4444; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 12px 26px; border-radius: 8px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25); text-decoration: none;"
            >
              &cross; ${rejectBtnText}
            </button>
          </div>
        </form>

        <!-- Direct Link Fallback (for email clients restricting HTML forms) -->
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #E2E8F0; text-align: center; font-size: 12px; color: #64748B;">
          <span>หรือกดดำเนินการแบบด่วน (Quick Links): </span>
          <a href="${approveUrl}" target="_blank" style="color: #059669; font-weight: 700; text-decoration: underline; margin: 0 4px;">
            [คลิก ${approveBtnText}]
          </a>
          <span>&bull;</span>
          <a href="${rejectUrl}" target="_blank" style="color: #DC2626; font-weight: 700; text-decoration: underline; margin: 0 4px;">
            [คลิก ${rejectBtnText}]
          </a>
        </div>
      </div>` : ''}

      <!-- Link to open system -->
      <div style="text-align: center; padding: 10px 0;">
        <a href="${viewUrl}" target="_blank" style="display: inline-block; color: #4F46E5; font-size: 14px; font-weight: 600; text-decoration: underline;">
          เปิดดูรายละเอียดขอลงเวลาและประวัติกิจกรรมในระบบ ICIT Workspace &rarr;
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94A3B8;">
      อีเมลนี้เป็นข้อความอัตโนมัติจากระบบขอลงเวลา สำนักวิทยบริการและเทคโนโลยีสารสนเทศ (ICIT)<br />
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
 * Helper: Check if an email address is deliverable and not a dummy/mock domain
 */
function isDeliverableRealEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  if (!clean.includes('@') || !clean.includes('.')) return false;
  if (clean.endsWith('@icit.org')) return false; // dummy mock domain
  return true;
}

/**
 * Find designated recipient for a given step with real email deliverability guarantee
 */
export function getNotificationRecipientForStep(
  record,
  step,
  allPersonnel = [],
  departmentList = [],
  executiveList = []
) {
  if (!record || !step) return null;
  const config = getEmailConfig();

  if (step === 'HR_REVIEW') {
    // 1. If explicit HR email configured in config or env
    if (config.hrEmail && isDeliverableRealEmail(config.hrEmail)) {
      return {
        name: config.hrName || 'เจ้าหน้าที่ฝ่ายบุคคล',
        email: config.hrEmail.trim(),
        role: 'เจ้าหน้าที่ฝ่ายบุคคล',
      };
    }

    // 2. Personnel with position 'บุคลากร' whose email is not a dummy mock domain
    const hrReal = allPersonnel.find(
      (p) => p.position === 'บุคลากร' && p.status === 'ปกติ' && isDeliverableRealEmail(p.email)
    );
    if (hrReal) return hrReal;

    // 3. Any active Admin with a real email
    const adminReal = allPersonnel.find(
      (p) => p.role === 'Admin' && p.status === 'ปกติ' && isDeliverableRealEmail(p.email)
    );
    if (adminReal) {
      return {
        id: adminReal.id,
        name: `${adminReal.name} (ฝ่ายบุคคล/ผู้ดูแลระบบ)`,
        email: adminReal.email.trim(),
        role: 'เจ้าหน้าที่ฝ่ายบุคคล',
      };
    }

    // 4. Default fallback
    return {
      name: 'เจ้าหน้าที่ฝ่ายบุคคล',
      email: (config.hrEmail || 'tiawongsombat@gmail.com').trim(),
      role: 'เจ้าหน้าที่ฝ่ายบุคคล',
    };
  }

  if (step === 'WITNESS_CONFIRM') {
    const p = allPersonnel.find((person) => person.id === record.witnessId);
    if (p && isDeliverableRealEmail(p.email)) {
      return p;
    }
    if (isDeliverableRealEmail(record.witnessEmail)) {
      return {
        name: record.witnessName || 'พยานผู้รับรอง',
        email: record.witnessEmail.trim(),
        role: 'พยานผู้รับรอง',
      };
    }
    return {
      name: record.witnessName || p?.name || 'พยานผู้รับรอง',
      email: (config.deptHeadEmail || config.hrEmail || 'tiawongsombat@gmail.com').trim(),
      role: 'พยานผู้รับรอง',
    };
  }

  if (step === 'DEPT_HEAD_APPROVE') {
    // 1. Try to find the person by departmentHeadId
    const p = allPersonnel.find((person) => person.id === record.departmentHeadId);
    if (p && isDeliverableRealEmail(p.email)) {
      return {
        id: p.id,
        name: p.name,
        email: p.email.trim(),
        role: 'หัวหน้าฝ่าย',
      };
    }

    // 2. Try to find via departmentList matching requester's department
    if (departmentList && departmentList.length > 0) {
      const dept = departmentList.find(
        (d) =>
          d.name === record.requesterDepartment ||
          d.id === record.departmentHeadId ||
          d.id === record.requesterDepartmentId
      );
      if (dept && dept.headPersonnelId) {
        const headPerson = allPersonnel.find((person) => person.id === dept.headPersonnelId);
        if (headPerson && isDeliverableRealEmail(headPerson.email)) {
          return {
            id: headPerson.id,
            name: headPerson.name,
            email: headPerson.email.trim(),
            role: `หัวหน้าฝ่าย (${dept.name})`,
          };
        }
      }
    }

    // 3. Check record's departmentHeadEmail
    if (isDeliverableRealEmail(record.departmentHeadEmail)) {
      return {
        id: record.departmentHeadId || '',
        name: record.departmentHeadName || 'หัวหน้าฝ่าย',
        email: record.departmentHeadEmail.trim(),
        role: 'หัวหน้าฝ่าย',
      };
    }

    // 4. Configured department head email from config/env
    if (config.deptHeadEmail && isDeliverableRealEmail(config.deptHeadEmail)) {
      return {
        id: record.departmentHeadId || '',
        name: record.departmentHeadName || 'หัวหน้าฝ่าย',
        email: config.deptHeadEmail.trim(),
        role: 'หัวหน้าฝ่าย',
      };
    }

    // 5. Active Personnel with position 'หัวหน้าฝ่าย' and real email
    const headByPosition = allPersonnel.find(
      (person) =>
        person.position?.includes('หัวหน้าฝ่าย') &&
        person.status === 'ปกติ' &&
        isDeliverableRealEmail(person.email)
    );
    if (headByPosition) return headByPosition;

    // 6. Safe fallback to ensure real email API delivers
    return {
      id: record.departmentHeadId || '',
      name: record.departmentHeadName || 'หัวหน้าฝ่าย',
      email: (config.deptHeadEmail || config.hrEmail || 'tiawongsombat@gmail.com').trim(),
      role: 'หัวหน้าฝ่าย',
    };
  }

  if (step === 'DEPUTY_APPROVE') {
    // 1. Try to find the person by deputyDirectorId
    const p = allPersonnel.find((person) => person.id === record.deputyDirectorId);
    if (p && isDeliverableRealEmail(p.email)) {
      return {
        id: p.id,
        name: p.name,
        email: p.email.trim(),
        role: 'รองผู้อำนวยการฝ่ายบริหาร',
      };
    }

    // 2. Try to find executive for administration from executiveList
    if (executiveList && executiveList.length > 0) {
      const deputyExec = executiveList.find(
        (e) =>
          (e.position?.includes('ฝ่ายบริหาร') || e.position?.includes('บริหาร')) &&
          e.position?.includes('รอง')
      );
      if (deputyExec) {
        const deputyPerson = allPersonnel.find((person) => person.id === deputyExec.personnelId);
        if (deputyPerson && isDeliverableRealEmail(deputyPerson.email)) {
          return {
            id: deputyPerson.id,
            name: deputyPerson.name,
            email: deputyPerson.email.trim(),
            role: 'รองผู้อำนวยการฝ่ายบริหาร',
          };
        }
      }
    }

    // 3. Check record's deputyDirectorEmail
    if (isDeliverableRealEmail(record.deputyDirectorEmail)) {
      return {
        id: record.deputyDirectorId || '',
        name: record.deputyDirectorName || 'รองผู้อำนวยการฝ่ายบริหาร',
        email: record.deputyDirectorEmail.trim(),
        role: 'รองผู้อำนวยการฝ่ายบริหาร',
      };
    }

    // 4. Configured deputy email from config/env
    if (config.deputyDirectorEmail && isDeliverableRealEmail(config.deputyDirectorEmail)) {
      return {
        id: record.deputyDirectorId || '',
        name: record.deputyDirectorName || 'รองผู้อำนวยการฝ่ายบริหาร',
        email: config.deputyDirectorEmail.trim(),
        role: 'รองผู้อำนวยการฝ่ายบริหาร',
      };
    }

    // 5. Fallback to ensure real email API delivers
    return {
      id: record.deputyDirectorId || '',
      name: record.deputyDirectorName || 'รองผู้อำนวยการฝ่ายบริหาร',
      email: (config.deputyDirectorEmail || config.hrEmail || 'tiawongsombat@gmail.com').trim(),
      role: 'รองผู้อำนวยการฝ่ายบริหาร',
    };
  }

  if (step === 'COMPLETED' || step === 'REJECTED' || step === 'CANCELLED') {
    const p = allPersonnel.find((person) => person.id === record.requesterId);
    if (p && isDeliverableRealEmail(p.email)) {
      return p;
    }
    if (isDeliverableRealEmail(record.requesterEmail)) {
      return {
        id: record.requesterId || '',
        name: record.requesterName || 'ผู้ขอลงเวลา',
        email: record.requesterEmail.trim(),
        role: 'ผู้ขอลงเวลา',
      };
    }
    return {
      id: record.requesterId || '',
      name: record.requesterName || 'ผู้ขอลงเวลา',
      email: (config.hrEmail || 'tiawongsombat@gmail.com').trim(),
      role: 'ผู้ขอลงเวลา',
    };
  }

  return null;
}

/**
 * Dispatch or log email notification
 */
export async function sendTimeAttendanceNotification(record, targetStep, recipient, appBaseUrl = '') {
  const content = generateEmailContent(record, targetStep, recipient, appBaseUrl);
  const config = getEmailConfig();

  const toEmail = recipient?.email;
  const logEntry = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    recordId: record?.id || '',
    targetStep,
    recipientEmail: toEmail || 'unknown',
    recipientName: recipient?.name || 'ผู้เกี่ยวข้อง',
    recipientRole: recipient?.role || targetStep,
    subject: content.subject,
    sentAt: new Date().toISOString(),
    status: 'PENDING',
    approveUrl: content.approveUrl,
    rejectUrl: content.rejectUrl,
    deliveryMethod: 'Local System Sandbox',
  };

  const scriptUrl =
    config.googleAppsScriptUrl ||
    process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_EMAIL_URL ||
    process.env.GOOGLE_SCRIPT_EMAIL_URL;

  let isDelivered = false;
  let deliveryError = null;

  if (toEmail && config.enableLiveSending && scriptUrl) {
    try {
      // Route via Next.js server-side /api/attendance/notify relay.
      // This eliminates browser CORS preflight issues, header stripping, and opaque 302 redirects with Google Apps Script.
      const resp = await fetch('/api/attendance/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject: content.subject,
          htmlBody: content.html,
          recordId: record?.id || '',
          step: targetStep,
          webhookUrl: scriptUrl,
        }),
      });

      const resData = await resp.json().catch(() => ({}));
      if (resp.ok && resData.success) {
        logEntry.deliveryMethod = 'Google Apps Script (Gmail API Relay)';
        logEntry.status = 'DELIVERED';
        isDelivered = true;
      } else {
        deliveryError = resData.message || resData.error || `HTTP ${resp.status} relay failed`;
        logEntry.deliveryMethod = 'Next.js Relay (Failed)';
        logEntry.status = 'FAILED';
        logEntry.error = deliveryError;
      }
    } catch (err) {
      console.warn('Email notification relay exception:', err);
      deliveryError = err.message || 'Network exception during email dispatch';
      logEntry.deliveryMethod = 'Next.js Relay (Error)';
      logEntry.status = 'FAILED';
      logEntry.error = deliveryError;
    }
  } else {
    logEntry.deliveryMethod = 'ระบบจำลองการส่งอีเมล (Simulation Sandbox)';
    logEntry.status = 'SANDBOX';
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

  return {
    success: isDelivered,
    isSandbox: !isDelivered && !deliveryError,
    error: deliveryError,
    logEntry,
    content,
  };
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

