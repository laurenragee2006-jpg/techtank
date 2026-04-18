export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { to, name, applyLink, dashLink, tempPass } = req.body;

  if (!to || !name || !applyLink || !dashLink || !tempPass) {
    return res.status(400).json({ error: 'Missing required fields' });
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
      subject: 'Your Lucent group is live!',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#EEF2F7;color:#0F172A;border-radius:12px">
          <p style="font-family:Georgia,serif;font-size:20px;margin:0 0 4px">lu<span style="color:#3B82F6">cent</span></p>
          <h2 style="font-size:22px;margin:16px 0 8px">Your group is live 🎉</h2>
          <p style="color:#64748b;margin-bottom:28px">Here's everything you need to get started, ${name}.</p>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin-bottom:12px">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin:0 0 6px">Application form — share with founders</p>
            <p style="color:#3B82F6;font-family:monospace;font-size:13px;margin:0;word-break:break-all">${applyLink}</p>
          </div>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin-bottom:12px">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin:0 0 6px">Investor dashboard</p>
            <p style="color:#60A5FA;font-family:monospace;font-size:13px;margin:0">${dashLink}</p>
          </div>
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin-bottom:28px">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin:0 0 6px">Login credentials</p>
            <p style="color:#0F172A;font-size:13px;margin:0 0 4px">Email: ${to}</p>
            <p style="color:#0F172A;font-family:monospace;font-size:13px;margin:0">Temp password: ${tempPass}</p>
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
    console.error('Resend error:', err);
    return res.status(500).json({ error: err });
  }
}
