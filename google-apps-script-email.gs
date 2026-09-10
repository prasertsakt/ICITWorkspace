/**
 * Google Apps Script Web App for ICIT Workspace Email Relay
 *
 * วิธีติดตั้ง / อัปเดต (Deploy):
 * 1. เข้าไปที่ https://script.google.com/
 * 2. เปิดโปรเจกต์เดิม
 * 3. วางโค้ดนี้ทั้งหมดลงในไฟล์ Code.gs
 * 4. ***สำคัญมาก***:
 *    - กดปุ่ม "Deploy" (การทำให้ใช้งานได้) > "Manage deployments" (จัดการการทำให้ใช้งานได้)
 *    - กดที่ไอคอนดินสอ (Edit)
 *    - ในช่อง "Version" (เวอร์ชัน) เลือก "New version" (เวอร์ชันใหม่)
 *    - กด "Deploy"
 */

function doPost(e) {
  try {
    // Safely decode raw bytes as UTF-8 to prevent any character/emoji corruption ()
    var rawString = '';
    if (e.postData && e.postData.bytes) {
      rawString = Utilities.newBlob(e.postData.bytes).getDataAsString('UTF-8');
    } else if (e.postData && e.postData.contents) {
      rawString = e.postData.contents;
    }

    var data = JSON.parse(rawString);
    var recipient = data.to ? String(data.to).trim() : '';
    var subject = data.subject ? String(data.subject).trim() : '';
    var htmlBody = data.htmlBody || '';
    var cc = data.cc ? String(data.cc).trim() : '';
    var bcc = data.bcc ? String(data.bcc).trim() : '';
    var recordId = data.recordId || '';
    var step = data.step || '';
    var senderName = data.senderName || 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)';

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
