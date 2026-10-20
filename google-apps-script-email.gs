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

    var subject = data.subject ? String(data.subject).replace(/\uFFFD/g, '').trim() : '';
    var htmlBody = data.htmlBody ? String(data.htmlBody).replace(/\uFFFD/g, '') : '';

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

    // =========================================================================
    // 1. CALENDAR EVENT DELETION ACTION (DELETE_CALENDAR_EVENT)
    // =========================================================================
    if (data.action === 'DELETE_CALENDAR_EVENT' || data.deleteCalendarEvent) {
      var cal = CalendarApp.getDefaultCalendar();
      var deletedCount = 0;
      var deleteErrors = [];
      var targetEventId = data.eventId || (data.calendarEvent && data.calendarEvent.eventId) || '';

      // Strategy 1: Delete by exact Event ID
      if (targetEventId) {
        try {
          var evt = cal.getEventById(targetEventId);
          if (evt) {
            evt.deleteEvent();
            deletedCount++;
          } else if (targetEventId.indexOf('@') !== -1) {
            var strippedId = targetEventId.split('@')[0];
            var evtStripped = cal.getEventById(strippedId);
            if (evtStripped) {
              evtStripped.deleteEvent();
              deletedCount++;
            }
          }
        } catch (errById) {
          deleteErrors.push('ById: ' + errById.toString());
        }
      }

      // Strategy 2: Fallback search by title/topic and date range
      if (deletedCount === 0 && data.calendarEvent) {
        try {
          var cData = data.calendarEvent;
          var searchTitle = cData.title ? String(cData.title).trim() : (subject || '');
          var cleanTopic = cData.topic ? String(cData.topic).trim() : '';
          var sTime = cData.startTime ? new Date(cData.startTime) : null;
          var eTime = cData.endTime ? new Date(cData.endTime) : null;

          if (sTime && eTime && !isNaN(sTime.getTime()) && !isNaN(eTime.getTime())) {
            // +- 24 hour buffer window
            var sWindow = new Date(sTime.getTime() - 24 * 60 * 60 * 1000);
            var eWindow = new Date(eTime.getTime() + 24 * 60 * 60 * 1000);
            var foundEvents = cal.getEvents(sWindow, eWindow);
            for (var k = 0; k < foundEvents.length; k++) {
              var fEvt = foundEvents[k];
              var evTitle = fEvt.getTitle();
              var matchTitle = searchTitle && evTitle.indexOf(searchTitle) !== -1;
              var matchTopic = cleanTopic && evTitle.indexOf(cleanTopic) !== -1;
              if (matchTitle || matchTopic) {
                fEvt.deleteEvent();
                deletedCount++;
              }
            }
          }
        } catch (errSearch) {
          deleteErrors.push('BySearch: ' + errSearch.toString());
        }
      }

      // Strategy 3: Optional cancellation email notification to recipients
      var cancelEmailSent = false;
      if (recipient && subject && htmlBody) {
        try {
          var cancelPlainText = data.plainText || htmlBody.replace(/<[^>]+>/g, ' ').trim();
          var cancelOptions = {
            htmlBody: htmlBody,
            name: senderName,
            noReply: false
          };
          if (cc) cancelOptions.cc = cc;
          if (bcc) cancelOptions.bcc = bcc;
          if (replyTo) cancelOptions.replyTo = replyTo;
          GmailApp.sendEmail(recipient, subject, cancelPlainText, cancelOptions);
          cancelEmailSent = true;
        } catch (mailErr) {
          deleteErrors.push('EmailNotice: ' + mailErr.toString());
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: deletedCount > 0 ? 'success' : (deleteErrors.length === 0 ? 'not_found' : 'warning'),
        deleted: deletedCount > 0,
        deletedCount: deletedCount,
        emailSent: cancelEmailSent,
        targetEventId: targetEventId,
        errors: deleteErrors,
        message: deletedCount > 0
          ? 'ลบกิจกรรมใน Google Calendar เรียบร้อยแล้ว (' + deletedCount + ' รายการ)'
          : 'ไม่พบกิจกรรมที่ตรงกันใน Google Calendar หรือถูกลบไปแล้ว',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 2. STANDARD EMAIL DISPATCH
    // =========================================================================
    if (!recipient || !subject || !htmlBody) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Missing required parameters (to, subject, htmlBody)'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Auto-inject openExternalBrowser=1 to application URLs in htmlBody
    // This guarantees that when users tap links on LINE or mobile email clients, it seamlessly navigates to native system browsers (Safari / Chrome)
    if (htmlBody) {
      htmlBody = htmlBody.replace(/href=["'](https?:\/\/[^"']+)["']/gi, function(match, url) {
        if (!url.includes('openExternalBrowser=1') && (url.includes('time-attendance') || url.includes('icitworkspace') || url.includes('/leave') || url.includes('/ims') || url.includes('cit.kmutnb.ac.th') || url.includes('web.app') || url.includes('localhost'))) {
          var sep = url.indexOf('?') !== -1 ? '&' : '?';
          return 'href="' + url + sep + 'openExternalBrowser=1"';
        }
        return match;
      });

      if (htmlBody.indexOf('<form') !== -1 && htmlBody.indexOf('name="openExternalBrowser"') === -1) {
        htmlBody = htmlBody.replace(/(<form[^>]*>)/gi, '$1\n          <input type="hidden" name="openExternalBrowser" value="1" />');
      }
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

    // Optional: Auto-create Google Calendar event with guests if requested
    var calendarEventResult = null;
    if (data.createCalendarEvent && data.calendarEvent) {
      try {
        var calData = data.calendarEvent;
        var startDt = new Date(calData.startTime);
        var endDt = new Date(calData.endTime);
        var calTitle = calData.title || subject;
        var calLocation = calData.location || '';
        if (calData.isOnline && calData.meetUrl) {
          calLocation = calData.meetUrl;
        }
        var calDescription = calData.description || plainText;
        if (calData.meetUrl && calDescription.indexOf(calData.meetUrl) === -1) {
          calDescription = 'Google Meet: ' + calData.meetUrl + '\n\n' + calDescription;
        }
        var calOptions = {
          description: calDescription,
          location: calLocation,
          sendInvites: true
        };
        if (calData.guests) {
          calOptions.guests = Array.isArray(calData.guests) ? calData.guests.join(',') : String(calData.guests);
        }
        var createdEvent = CalendarApp.getDefaultCalendar().createEvent(calTitle, startDt, endDt, calOptions);
        calendarEventResult = {
          eventId: createdEvent.getId(),
          status: 'created'
        };
      } catch (calErr) {
        calendarEventResult = {
          status: 'warning',
          message: calErr.toString()
        };
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Email successfully sent to ' + recipient + (cc ? ' (CC: ' + cc + ')' : '') + (bcc ? ' (BCC: ' + bcc + ')' : ''),
      recordId: recordId,
      step: step,
      recipient: recipient,
      cc: cc,
      bcc: bcc,
      calendarEvent: calendarEventResult,
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
