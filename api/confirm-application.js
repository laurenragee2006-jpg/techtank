export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { to, founderName, groupName } = req.body;
  if (!to || !founderName || !groupName) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Lucent <onboarding@resend.dev>',
      to,
      subject: `Application received — ${groupName}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#ECF1F1;color:#0F172A;border-radius:12px">
          <p style="font-family:Georgia,serif;font-size:20px;margin:0 0 24px">lu<span style="color:#208e90">cent</span></p>
          <h2 style="font-size:20px;font-weight:500;margin:0 0 12px">Application received</h2>
          <p style="color:#64748b;line-height:1.6;margin:0 0 24px">Hi ${founderName}, thanks for applying to <strong style="color:#0F172A">${groupName}</strong>. We've received your application and will review it shortly.</p>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin-bottom:24px">
            <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.08em">What happens next</p>
            <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0">The investment team reviews every application. If there's a fit, they'll reach out directly to schedule a call. This typically takes 2–3 weeks.</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0">— The Lucent Team</p>
        </div>
      `
    })
  });

  if (response.ok) {
    return res.status(200).json({ ok: true });
  } else {
    const err = await response.json();
    return res.status(500).json({ error: err });
  }
}
