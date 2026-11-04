import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, subject, htmlBody, recordId, step, webhookUrl } = body;

    // Enforce No-Reply identity across all attendance notifications
    const defaultSender = 'สำนักคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (No-Reply)';
    const senderName = body.senderName
      ? (String(body.senderName).includes('(No-Reply)') ? body.senderName : `${body.senderName} (No-Reply)`)
      : defaultSender;
    const replyTo = body.replyTo || 'noreply-icit@icit.kmutnb.ac.th';

    if (!to || !subject || !htmlBody) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters (to, subject, htmlBody)' },
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
        body: JSON.stringify({ to, subject, htmlBody, recordId, step, senderName, replyTo }),
      });
      const data = await resp.json().catch(() => ({ status: 'forwarded' }));
      const isOk = resp.ok && data.status !== 'error';
      return NextResponse.json({
        success: isOk,
        via: 'google_script',
        senderName,
        replyTo,
        data,
        message: data.message || (isOk ? 'Email sent successfully' : 'Failed sending email'),
      });
    }

    // Default simulation response when no webhook configured
    return NextResponse.json({
      success: true,
      simulated: true,
      senderName,
      replyTo,
      message: 'Email processed in simulation mode (no webhook URL configured).',
      recipient: to,
      subject,
    });
  } catch (error) {
    console.error('Error in /api/attendance/notify:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
