// Sends transactional email via Brevo's HTTP API instead of raw SMTP.
// Render's free tier blocks outbound SMTP ports (25, 465, 587), so
// nodemailer + Gmail SMTP hangs and times out there. Brevo sends over
// HTTPS (port 443), which is never blocked, so this works on any host.
//
// Requires env vars:
//   BREVO_API_KEY - your Brevo API key
//   EMAIL_USER    - the Gmail address you verified as a sender in Brevo

const sendEmail = async ({ to, subject, html, toName = '' }) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'NVGo App', email: process.env.EMAIL_USER },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo email send failed (${response.status}): ${errorBody}`);
  }

  return response.json();
};

module.exports = sendEmail;
