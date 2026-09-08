import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, subject, htmlBody, recordId, step, webhookUrl } = body;

    if (!to || !subject || !htmlBody) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters (to, subject, htmlBody)' },
        { status: 400 }
      );
    }

    const scriptUrl = webhookUrl || process.env.GOOGLE_SCRIPT_EMAIL_URL;

    if (scriptUrl) {
      const resp = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, htmlBody, recordId, step }),
      });
      const data = await resp.json().catch(() => ({ status: 'forwarded' }));
      return NextResponse.json({ success: true, via: 'google_script', data });
    }

    // Default simulation response when no webhook configured
    return NextResponse.json({
      success: true,
      simulated: true,
      message: 'Email processed in simulation mode (no webhook URL configured).',
      recipient: to,
      subject,
    });
  } catch (error) {
    console.error('Error in /api/attendance/notify:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
