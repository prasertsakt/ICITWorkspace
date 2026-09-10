import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, cc, bcc, subject, htmlBody, attachments, webhookUrl, senderName } = body;

    if (!to || !subject || !htmlBody) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุข้อมูลที่จำเป็นให้ครบถ้วน (to, subject, htmlBody)' },
        { status: 400 }
      );
    }

    const scriptUrl =
      webhookUrl ||
      process.env.GOOGLE_SCRIPT_EMAIL_URL ||
      process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_EMAIL_URL;

    if (scriptUrl) {
      const resp = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          cc: cc || '',
          bcc: bcc || '',
          subject,
          htmlBody,
          senderName: senderName || 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (ICIT)',
        }),
      });

      const data = await resp.json().catch(() => ({ status: 'forwarded' }));
      const isOk = resp.ok && data.status !== 'error';

      return NextResponse.json({
        success: isOk,
        via: 'google_script',
        data,
        message: data.message || (isOk ? 'ส่งอีเมลสำเร็จเรียบร้อยแล้ว' : 'ไม่สามารถส่งอีเมลผ่าน Webhook ได้'),
        recipient: to,
        cc: cc || '',
        bcc: bcc || '',
      });
    }

    // Default simulation response when no webhook is configured
    return NextResponse.json({
      success: true,
      simulated: true,
      message: 'จำลองการส่งอีเมลสำเร็จ (ยังไม่ได้ตั้งค่า Google Apps Script Webhook URL)',
      recipient: to,
      subject,
      attachmentsCount: attachments?.length || 0,
    });
  } catch (error) {
    console.error('Error in /api/email/send:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
