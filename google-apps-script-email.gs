/**
 * Google Apps Script Web App for ICIT Workspace Email Relay
 *
 * วิธีติดตั้ง (Deploy):
 * 1. เข้าไปที่ https://script.google.com/
 * 2. กดปุ่ม "New project" (โครงการใหม่)
 * 3. วางโค้ดนี้ทั้งหมดลงในไฟล์ Code.gs
 * 4. กดปุ่ม "Deploy" (การทำให้ใช้งานได้) > "New deployment" (การทำให้ใช้งานได้ใหม่)
 * 5. เลือกประเภท: "Web app" (เว็บแอปพลิเคชัน)
 *    - Description: ICIT Time Attendance Mail Relay
 *    - Execute as: "Me" (ฉัน - บัญชี Google ของท่าน)
 *    - Who has access: "Anyone" (ทุกคน)
 * 6. กด "Deploy" และคัดลอก "Web app URL" (ลงท้ายด้วย /exec)
 * 7. นำ URL ที่ได้ไปวางในช่อง Google Apps Script Webhook URL ในระบบใบลงเวลา
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var recipient = data.to;
    var subject = data.subject;
    var htmlBody = data.htmlBody;
    var recordId = data.recordId || '';
    var step = data.step || '';

    if (!recipient || !subject || !htmlBody) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Missing required parameters (to, subject, htmlBody)'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Send email using GmailApp / MailApp
    GmailApp.sendEmail(recipient, subject, '', {
      htmlBody: htmlBody,
      name: 'ระบบใบลงเวลา ICIT Workspace',
      noReply: true
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Email successfully sent to ' + recipient,
      recordId: recordId,
      step: step,
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
