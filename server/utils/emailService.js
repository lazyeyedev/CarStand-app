const { Resend } = require('resend');
const { getPublicClientUrl } = require('./clientUrl');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const SITE   = getPublicClientUrl();

const TYPE_LABEL = {
  general:    'General Enquiry',
  price:      'Price Negotiation',
  test_drive: 'Test Drive Request',
  finance:    'Finance / Loan Enquiry',
};

const sendEnquiryNotification = async ({
  dealerEmail, dealerName, listingTitle,
  senderName, senderEmail, senderPhone,
  message, type, listingUrl,
}) => {
  const typeLabel = TYPE_LABEL[type] || type;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0d0d0d;padding:24px 32px;">
            <span style="color:#c9a84c;font-size:22px;font-weight:900;letter-spacing:2px;">CarStand</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;color:#333;font-size:15px;">Hi ${dealerName},</p>
            <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
              You have received a new enquiry on your listing. Details below.
            </p>

            <!-- Listing -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <div style="color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Listing</div>
                  <div style="color:#111;font-size:15px;font-weight:700;">${listingTitle}</div>
                  <div style="margin-top:8px;">
                    <span style="background:#c9a84c22;color:#a07830;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase;">
                      ${typeLabel}
                    </span>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Sender details -->
            <div style="margin-bottom:24px;">
              <div style="color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">From</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;color:#555;font-size:13px;width:80px;">Name</td>
                  <td style="padding:4px 0;color:#111;font-size:13px;font-weight:600;">${senderName}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#555;font-size:13px;">Email</td>
                  <td style="padding:4px 0;font-size:13px;">
                    <a href="mailto:${senderEmail}" style="color:#c9a84c;">${senderEmail}</a>
                  </td>
                </tr>
                ${senderPhone ? `
                <tr>
                  <td style="padding:4px 0;color:#555;font-size:13px;">Phone</td>
                  <td style="padding:4px 0;color:#111;font-size:13px;">
                    <a href="tel:${senderPhone}" style="color:#c9a84c;">${senderPhone}</a>
                  </td>
                </tr>` : ''}
              </table>
            </div>

            <!-- Message -->
            <div style="margin-bottom:28px;">
              <div style="color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Message</div>
              <div style="background:#f9f9f9;border-left:3px solid #c9a84c;padding:14px 16px;color:#333;font-size:14px;line-height:1.7;border-radius:0 4px 4px 0;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#c9a84c;border-radius:6px;">
                  <a href="${listingUrl}" style="display:inline-block;padding:12px 24px;color:#0d0d0d;font-size:14px;font-weight:700;text-decoration:none;">
                    View Listing →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #e5e5e5;">
            <p style="margin:0;color:#aaa;font-size:12px;">
              CarStand · Ghana's Premier Car Marketplace · 
              <a href="${SITE}" style="color:#c9a84c;text-decoration:none;">carstand.net</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from:    FROM,
    to:      dealerEmail,
    subject: `New Enquiry: ${listingTitle}`,
    html,
  });
};

const sendWelcomeEmail = async ({ email, name }) => {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0d0d0d;padding:24px 32px;">
            <span style="color:#c9a84c;font-size:22px;font-weight:900;letter-spacing:2px;">CarStand</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;color:#111;font-size:20px;">Welcome, ${name} 👋</h2>
            <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.7;">
              You're now on Ghana's premier car marketplace. Here's what you can do:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              ${[
                ['🔍', 'Browse thousands of verified vehicle listings across all 16 regions'],
                ['💬', 'Send enquiries directly to dealers and negotiate prices'],
                ['❤️', 'Save your favourite listings and compare vehicles'],
                ['🚗', 'List your own car for sale through a registered dealer'],
              ].map(([icon, text]) => `
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:28px;font-size:16px;">${icon}</td>
                <td style="padding:8px 0;color:#444;font-size:14px;line-height:1.6;">${text}</td>
              </tr>`).join('')}
            </table>

            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#c9a84c;border-radius:6px;">
                  <a href="${SITE}/listings" style="display:inline-block;padding:12px 24px;color:#0d0d0d;font-size:14px;font-weight:700;text-decoration:none;">
                    Browse Cars →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #e5e5e5;">
            <p style="margin:0;color:#aaa;font-size:12px;">
              CarStand · A TechSphere / Sevinity Holdings product · Accra, Ghana
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: 'Welcome to CarStand',
    html,
  });
};

const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0d0d0d;padding:24px 32px;">
            <span style="color:#c9a84c;font-size:22px;font-weight:900;letter-spacing:2px;">CarStand</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;color:#111;font-size:20px;">Reset your password</h2>
            <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.7;">
              Hi ${name}, we received a request to reset the password on your CarStand account.
              This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
            </p>

            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#c9a84c;border-radius:6px;">
                  <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;color:#0d0d0d;font-size:14px;font-weight:700;text-decoration:none;">
                    Reset Password →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#999;font-size:12px;line-height:1.6;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color:#c9a84c;word-break:break-all;">${resetUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #e5e5e5;">
            <p style="margin:0;color:#aaa;font-size:12px;">
              CarStand · A TechSphere / Sevinity Holdings product · Accra, Ghana
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from:    FROM,
    to:      email,
    subject: 'Reset your CarStand password',
    html,
  });
};

module.exports = { sendEnquiryNotification, sendWelcomeEmail, sendPasswordResetEmail };
