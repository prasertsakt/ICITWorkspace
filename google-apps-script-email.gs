/**
 * Google Apps Script Web App for ICIT Workspace Email Relay
 * สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (ICIT KMUTNB)
 *
 * วิธีติดตั้ง / อัปเดต (Deploy):
 * 1. เข้าไปที่ https://script.google.com/
 * 2. เปิดโปรเจกต์เดิม (ICIT Email Relay)
 * 3. วางโค้ดนี้ทั้งหมดลงในไฟล์ Code.gs
 * 4. ***สำคัญมาก (Deploy New Version)***:
 *    - กดปุ่ม "Deploy" (การทำให้ใช้งานได้) > "Manage deployments" (จัดการการทำให้ใช้งานได้)
 *    - กดที่ไอคอนดินสอ (Edit) บน Web App deployment
 *    - ในช่อง "Version" (เวอร์ชัน) เลือก "New version" (เวอร์ชันใหม่)
 *    - ตรวจสอบ "Who has access" (ผู้มีสิทธิ์เข้าถึง) ให้เป็น "Anyone" (ทุกคน)
 *    - กด "Deploy"
 */

function doPost(e) {
  try {
    // Safely decode raw bytes as UTF-8 to prevent any character/emoji corruption (e.g. 🚨, ⚠️, 📊, ภาษาไทย)
    var rawString = '';
    if (e.postData && e.postData.bytes) {
      rawString = Utilities.newBlob(e.postData.bytes).getDataAsString('UTF-8');
    } else if (e.postData && e.postData.contents) {
      rawString = e.postData.contents;
    }

    var data = JSON.parse(rawString);

    // Normalize recipient(s) - supports string or array
    var recipient = '';
    if (Array.isArray(data.to)) {
      recipient = data.to.filter(function(x) { return Boolean(x); }).join(', ').trim();
    } else if (data.to) {
      recipient = String(data.to).trim();
    }

    var subject = data.subject ? String(data.subject).trim() : '';
    var htmlBody = data.htmlBody || '';

    // Normalize CC
    var cc = '';
    if (Array.isArray(data.cc)) {
      cc = data.cc.filter(function(x) { return Boolean(x); }).join(', ').trim();
    } else if (data.cc) {
      cc = String(data.cc).trim();
    }

    // Normalize BCC
    var bcc = '';
    if (Array.isArray(data.bcc)) {
      bcc = data.bcc.filter(function(x) { return Boolean(x); }).join(', ').trim();
    } else if (data.bcc) {
      bcc = String(data.bcc).trim();
    }

    var replyTo = data.replyTo ? String(data.replyTo).trim() : '';
    var recordId = data.recordId || '';
    var step = data.step || '';
    var senderName = data.senderName || 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)';

    if (!recipient || !subject || !htmlBody) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Missing required parameters (to, subject, htmlBody)'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Create plain text fallback to optimize email deliverability and avoid spam filters
    var plainText = data.plainText || htmlBody.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                                              .replace(/<[^>]+>/g, ' ')
                                              .replace(/&nbsp;/g, ' ')
                                              .replace(/\s+/g, ' ')
                                              .trim();

    // Build email options
    var emailOptions = {
      htmlBody: htmlBody,
      name: senderName,
      noReply: false
    };

    if (cc && cc.length > 0) {
      emailOptions.cc = cc;
    }

    if (bcc && bcc.length > 0) {
      emailOptions.bcc = bcc;
    }

    if (replyTo && replyTo.length > 0) {
      emailOptions.replyTo = replyTo;
    }

    // Send email using GmailApp with institutional Google Workspace account
    GmailApp.sendEmail(recipient, subject, plainText, emailOptions);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Email successfully sent to ' + recipient + (cc ? ' (CC: ' + cc + ')' : '') + (bcc ? ' (BCC: ' + bcc + ')' : ''),
      recordId: recordId,
      step: step,
      recipient: recipient,
      cc: cc,
      bcc: bcc,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    service: 'ICIT Workspace Enterprise Email Relay Service',
    organization: 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ มจพ. (ICIT KMUTNB)',
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
