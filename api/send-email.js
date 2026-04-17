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
      from: 'DealFlow <onboarding@resend.dev>',
      to,
      subject: 'Your DealFlow group is live!',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#0e0e0e;color:#e8e8e0;border-radius:12px">
          <p style="font-family:Georgia,serif;font-size:20px;margin:0 0 4px">deal<span style="color:#B4FF6A">flow</span></p>
          <h2 style="font-size:22px;margin:16px 0 8px">Your group is live 🎉</h2>
          <p style="color:#888;margin-bottom:28px">Here's everything you need to get started, ${name}.</p>
          <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:18px;margin-bottom:12px">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin:0 0 6px">Application form — share with founders</p>
            <p style="color:#B4FF6A;font-family:monospace;font-size:13px;margin:0;word-break:break-all">${applyLink}</p>
          </div>
          <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:18px;margin-bottom:12px">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin:0 0 6px">Investor dashboard</p>
            <p style="color:#7ab8f5;font-family:monospace;font-size:13px;margin:0">${dashLink}</p>
          </div>
          <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:18px;margin-bottom:28px">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin:0 0 6px">Login credentials</p>
            <p style="color:#e8e8e0;font-size:13px;margin:0 0 4px">Email: ${to}</p>
            <p style="color:#e8e8e0;font-family:monospace;font-size:13px;margin:0">Temp password: ${tempPass}</p>
          </div>
          <p style="color:#555;font-size:12px;margin:0">— The DealFlow Team</p>
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
