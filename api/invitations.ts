function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character] || character));
}

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    return response.status(405).json({ success: false, error: "Method not allowed." });
  }

  const { recipientEmail, inviterName, agreementTitle, inviteLink, currency, amount } = request.body || {};
  const email = String(recipientEmail || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || !inviteLink || !agreementTitle || !currency || !Number.isFinite(Number(amount))) {
    return response.status(400).json({ success: false, error: "A valid recipient, agreement, amount, currency, and invite link are required." });
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return response.status(503).json({ success: false, error: "Email service is not configured on this deployment." });
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [email],
        subject: `Invitation to join ${agreementTitle}`,
        html: `<p>${escapeHtml(inviterName || "Someone")} invited you to join a Poly-Crow escrow agreement.</p><p><strong>${escapeHtml(agreementTitle)}</strong><br />Stake: ${escapeHtml(String(amount))} ${escapeHtml(currency)}</p><p><a href="${escapeHtml(inviteLink)}">Review and join the agreement</a></p>`,
      }),
    });
    const result = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      return response.status(502).json({ success: false, error: result.message || "Email provider rejected the invitation." });
    }
    return response.status(200).json({ success: true, id: result.id });
  } catch (error) {
    console.error("Invitation email error:", error);
    return response.status(502).json({ success: false, error: "Email service is unavailable." });
  }
}
