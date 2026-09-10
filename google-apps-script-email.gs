/**
 * Google Apps Script Web App for ICIT Workspace Email Relay
 *
 * วิธีติดตั้ง / อัปเดต (Deploy):
 * 1. เข้าไปที่ https://script.google.com/
 * 2. เปิดโปรเจกต์เดิม หรือสร้าง "New project"
 * 3. วางโค้ดนี้ทั้งหมดลงในไฟล์ Code.gs
 * 4. ***สำคัญมาก*** สำหรับการอัปเดต:
 *    - กดปุ่ม "Deploy" (การทำให้ใช้งานได้) > "Manage deployments" (จัดการการทำให้ใช้งานได้)
 *    - กดที่ไอคอนดินสอ (Edit)
 *    - ในช่อง "Version" (เวอร์ชัน) เลือก "New version" (เวอร์ชันใหม่)
 *    - กด "Deploy"
 *    (หากไม่อัปเดตเป็น New version ระบบของ Google จะยังคงรันโค้ดเก่า ทำให้ CC/BCC ไม่ทำงาน)
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var recipient = data.to ? String(data.to).trim() : '';
    var subject = data.subject ? String(data.subject).trim() : '';
    var htmlBody = data.htmlBody || '';
    var cc = data.cc ? String(data.cc).trim() : '';
    var bcc = data.bcc ? String(data.bcc).trim() : '';
    var recordId = data.recordId || '';
    var step = data.step || '';
    var senderName = data.senderName || 'ระบบบริหารจัดการองค์กร ICIT Workspace';

    if (!recipient || !subject || !htmlBody) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Missing required parameters (to, subject, htmlBody)'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Build email options
    var emailOptions = {
      htmlBody: htmlBody,
      name: senderName,
      noReply: false
    };

    // Add CC if specified
    if (cc && cc.length > 0) {
      emailOptions.cc = cc;
    }

    // Add BCC if specified
    if (bcc && bcc.length > 0) {
      emailOptions.bcc = bcc;
    }

    // Send email using GmailApp
    GmailApp.sendEmail(recipient, subject, '', emailOptions);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Email successfully sent to ' + recipient + (cc ? ' (CC: ' + cc + ')' : '') + (bcc ? ' (BCC: ' + bcc + ')' : ''),
      recordId: recordId,
      step: step,
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
    service: 'ICIT Workspace Email Relay Service',
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
