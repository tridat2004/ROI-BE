import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

// ─── Shared Design Tokens ────────────────────────────────────────────────────
const BRAND = {
  name: 'ROI Calculator',
  tagline: 'AI Inspection',
  dark: '#0a1628',
  darker: '#060e1a',
  accent: '#10b981',
  accentLight: '#d1fae5',
  accentBorder: '#6ee7b7',
  text: '#1e293b',
  muted: '#64748b',
  subtle: '#94a3b8',
  border: '#e2e8f0',
  bg: '#f1f5f9',
  white: '#ffffff',
};

// ─── Shared Components ────────────────────────────────────────────────────────
function logoBlock(): string {
  return `
    <table cellpadding="0" cellspacing="0" style="display:inline-table;">
      <tr>
        <td style="vertical-align:middle;padding-right:10px;">
          <div style="
            width:32px;height:32px;
            background:linear-gradient(135deg,${BRAND.accent} 0%,#059669 100%);
            border-radius:8px;
            display:inline-block;line-height:32px;text-align:center;
          ">
            <span style="color:#fff;font-size:16px;font-weight:900;letter-spacing:-1px;">~</span>
          </div>
        </td>
        <td style="vertical-align:middle;">
          <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.4px;">${BRAND.name}</span>
          <span style="color:#4ade80;font-size:11px;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;display:block;margin-top:1px;">${BRAND.tagline}</span>
        </td>
      </tr>
    </table>`;
}

function headerBlock(): string {
  return `
  <tr>
    <td style="
      background:linear-gradient(135deg,${BRAND.darker} 0%,${BRAND.dark} 60%,#0d2137 100%);
      padding:28px 40px;
      text-align:center;
      border-bottom:1px solid rgba(16,185,129,0.15);
    ">
      ${logoBlock()}
    </td>
  </tr>`;
}

function dividerBlock(): string {
  return `
  <tr>
    <td style="padding:0 40px;">
      <div style="
        height:1px;
        background:linear-gradient(90deg,transparent 0%,${BRAND.border} 20%,${BRAND.border} 80%,transparent 100%);
      "></div>
    </td>
  </tr>`;
}

function footerBlock(note: string): string {
  return `
  <tr>
    <td style="padding:22px 40px 30px;">
      <p style="margin:0 0 4px;font-size:12px;color:${BRAND.subtle};line-height:1.7;">
        ${note}
      </p>
      <p style="margin:0;font-size:11px;color:#cbd5e1;letter-spacing:0.3px;">
        &copy; ${new Date().getFullYear()} ${BRAND.name} &mdash; ${BRAND.tagline}
      </p>
    </td>
  </tr>`;
}

function wrapper(rows: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
</head>
<body style="
  margin:0;padding:0;
  background:${BRAND.bg};
  font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;
">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:48px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="
          background:${BRAND.white};
          border-radius:16px;
          overflow:hidden;
          box-shadow:0 4px 24px rgba(0,0,0,0.09),0 1px 4px rgba(0,0,0,0.06);
          border:1px solid ${BRAND.border};
        ">
          ${rows}
        </table>
        <p style="margin:20px 0 0;font-size:11px;color:${BRAND.subtle};text-align:center;">
          This email was sent by ${BRAND.name}. If something looks wrong, please contact support.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Service ──────────────────────────────────────────────────────────────────
@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  // ── sendOtp ────────────────────────────────────────────────────────────────
  async sendOtp(
    email: string,
    code: string,
    type: 'register' | 'login' | 'forgot_password',
  ) {
    const config = {
      register: {
        subject: 'Verify your email — ROI Calculator',
        title: 'Verify your email',
        desc: 'Enter the code below to complete your registration.',
        icon: '✉',
        badge: 'EMAIL VERIFICATION',
        note: "If you didn't create an account, you can safely ignore this email.",
      },
      login: {
        subject: 'Your login OTP — ROI Calculator',
        title: 'Login verification',
        desc: 'Enter the code below to sign in to your account.',
        icon: '🔐',
        badge: 'SIGN-IN CODE',
        note: "If you didn't attempt to sign in, someone else may be trying to access your account.",
      },
      forgot_password: {
        subject: 'Reset your password — ROI Calculator',
        title: 'Reset your password',
        desc: 'Enter the code below to verify your identity and reset your password.',
        icon: '🔑',
        badge: 'PASSWORD RESET',
        note: "If you didn't request a password reset, you can safely ignore this email.",
      },
    };

    const c = config[type];

    // Format the OTP code with spaces for readability
    const formattedCode = code.length === 6
      ? `${code.slice(0, 3)}${code.slice(3)}`
      : code;

    const html = wrapper(`
      ${headerBlock()}

      <!-- Badge + Title -->
      <tr>
        <td style="padding:36px 40px 0;">
          <div style="
            display:inline-block;
            background:${BRAND.accentLight};
            color:#065f46;
            font-size:10.5px;
            font-weight:700;
            letter-spacing:1.8px;
            text-transform:uppercase;
            padding:4px 10px;
            border-radius:20px;
            border:1px solid ${BRAND.accentBorder};
            margin-bottom:14px;
          ">${c.badge}</div>
          <h2 style="
            margin:0 0 10px;
            font-size:24px;
            font-weight:800;
            color:${BRAND.text};
            letter-spacing:-0.5px;
            line-height:1.2;
          ">${c.title}</h2>
          <p style="margin:0 0 28px;font-size:15px;color:${BRAND.muted};line-height:1.65;">
            ${c.desc} This code expires in <strong style="color:${BRAND.text};font-weight:600;">5 minutes</strong>.
          </p>
        </td>
      </tr>

      <!-- OTP Box -->
      <tr>
        <td style="padding:0 40px 28px;">
          <div style="
            background:linear-gradient(145deg,#f0fdf8 0%,#ecfdf5 100%);
            border:1.5px solid ${BRAND.accentBorder};
            border-radius:14px;
            padding:32px 20px;
            text-align:center;
            position:relative;
            box-shadow:0 2px 12px rgba(16,185,129,0.08) inset;
          ">
            <div style="
              font-size:46px;
              font-weight:900;
              letter-spacing:16px;
              color:${BRAND.text};
              font-variant-numeric:tabular-nums;
              line-height:1;
              font-family:'Courier New',Courier,monospace;
              padding-left:16px; /* compensate letter-spacing on last char */
            ">${formattedCode}</div>
            <div style="
              margin-top:10px;
              font-size:12px;
              color:${BRAND.muted};
              letter-spacing:0.3px;
            ">One-time code · Do not share</div>
          </div>
        </td>
      </tr>

      <!-- Security Note -->
      <tr>
        <td style="padding:0 40px 32px;">
          <div style="
            display:flex;
            background:#fffbeb;
            border:1px solid #fde68a;
            border-radius:10px;
            padding:12px 16px;
          ">
            <span style="font-size:14px;margin-right:8px;">⚠️</span>
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
              For your security, never share this code with anyone — including ${BRAND.name} support.
            </p>
          </div>
        </td>
      </tr>

      ${dividerBlock()}
      ${footerBlock(c.note)}
    `);

    await this.mailerService.sendMail({ to: email, subject: c.subject, html });
  }

  // ── sendWelcomeWithPassword ────────────────────────────────────────────────
  async sendWelcomeWithPassword(
    email: string,
    fullName: string,
    password: string,
  ) {
    const html = wrapper(`
      ${headerBlock()}

      <!-- Welcome Hero -->
      <tr>
        <td style="padding:36px 40px 0;text-align:center;">
          <div style="
            width:60px;height:60px;
            background:linear-gradient(135deg,${BRAND.accent},#059669);
            border-radius:50%;
            margin:0 auto 18px;
            display:flex;align-items:center;justify-content:center;
            line-height:60px;
            font-size:26px;
          ">🎉</div>
          <h2 style="
            margin:0 0 10px;
            font-size:24px;font-weight:800;color:${BRAND.text};
            letter-spacing:-0.5px;
          ">Welcome aboard, ${fullName || 'there'}!</h2>
          <p style="margin:0 0 28px;font-size:15px;color:${BRAND.muted};line-height:1.65;max-width:360px;margin-left:auto;margin-right:auto;">
            Your account has been created successfully. Use the temporary password below to sign in.
          </p>
        </td>
      </tr>

      <!-- Password Box -->
      <tr>
        <td style="padding:0 40px 20px;">
          <p style="
            margin:0 0 10px;
            font-size:11px;font-weight:700;
            color:${BRAND.muted};letter-spacing:1.5px;text-transform:uppercase;
          ">Your temporary password</p>
          <div style="
            background:linear-gradient(145deg,#f0fdf8,#ecfdf5);
            border:1.5px solid ${BRAND.accentBorder};
            border-radius:14px;
            padding:28px 20px;
            text-align:center;
            box-shadow:0 2px 12px rgba(16,185,129,0.08) inset;
          ">
            <code style="
              font-size:28px;font-weight:800;
              letter-spacing:5px;color:${BRAND.text};
              font-family:'Courier New',Courier,monospace;
            ">${password}</code>
          </div>
        </td>
      </tr>

      <!-- Action Steps -->
      <tr>
        <td style="padding:0 40px 32px;">
          <div style="
            background:#f8fafc;
            border:1px solid ${BRAND.border};
            border-radius:12px;
            padding:18px 20px;
          ">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:${BRAND.text};letter-spacing:0.2px;">
              Next steps
            </p>
            <table cellpadding="0" cellspacing="0" width="100%">
              ${['Sign in with your email and the password above', 'Navigate to your profile settings', 'Change your password to something memorable'].map((step, i) => `
              <tr>
                <td style="padding:4px 0;vertical-align:top;">
                  <span style="
                    display:inline-block;width:20px;height:20px;line-height:20px;
                    background:${BRAND.accent};color:#fff;
                    border-radius:50%;text-align:center;
                    font-size:11px;font-weight:700;margin-right:10px;
                    flex-shrink:0;
                  ">${i + 1}</span>
                </td>
                <td style="padding:4px 0;font-size:13.5px;color:${BRAND.muted};line-height:1.5;">
                  ${step}
                </td>
              </tr>`).join('')}
            </table>
          </div>
        </td>
      </tr>

      <!-- Login CTA -->
      <tr>
        <td style="padding:0 40px 32px;text-align:center;">
          <a href="${process.env.FRONTEND_URL}/auth" style="
            display:inline-block;
            background:linear-gradient(135deg,${BRAND.darker} 0%,${BRAND.dark} 100%);
            color:#ffffff;
            text-decoration:none;
            font-size:15px;font-weight:700;
            padding:15px 40px;
            border-radius:10px;
            letter-spacing:0.2px;
            box-shadow:0 4px 14px rgba(10,22,40,0.25);
          ">
            Go to Login &rarr;
          </a>
        </td>
      </tr>

      ${dividerBlock()}
      ${footerBlock("If you didn't create this account, please contact support immediately.")}
    `);

    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to ROI Calculator — Your account is ready',
      html,
    });
  }

  // ── sendResetPasswordLink ─────────────────────────────────────────────────
  async sendResetPasswordLink(
    email: string,
    link: string,
    expiresInLabel: string,
  ) {
    const html = wrapper(`
      ${headerBlock()}

      <!-- Title -->
      <tr>
        <td style="padding:36px 40px 0;">
          <div style="
            display:inline-block;
            background:#fef2f2;
            color:#991b1b;
            font-size:10.5px;font-weight:700;
            letter-spacing:1.8px;text-transform:uppercase;
            padding:4px 10px;border-radius:20px;
            border:1px solid #fecaca;margin-bottom:14px;
          ">PASSWORD RESET</div>
          <h2 style="
            margin:0 0 10px;
            font-size:24px;font-weight:800;color:${BRAND.text};
            letter-spacing:-0.5px;
          ">Reset your password</h2>
          <p style="margin:0 0 30px;font-size:15px;color:${BRAND.muted};line-height:1.65;">
            We received a request to reset the password for your account. Click the button below to proceed. This link expires in <strong style="color:${BRAND.text};font-weight:600;">${expiresInLabel}</strong>.
          </p>
        </td>
      </tr>

      <!-- CTA Button -->
      <tr>
        <td style="padding:0 40px 12px;text-align:center;">
          <a href="${link}" style="
            display:inline-block;
            background:linear-gradient(135deg,#0a1628 0%,#0d2137 100%);
            color:#ffffff;
            text-decoration:none;
            font-size:15px;font-weight:700;
            padding:15px 40px;
            border-radius:10px;
            letter-spacing:0.2px;
            box-shadow:0 4px 14px rgba(10,22,40,0.25);
          ">
            Reset my password &rarr;
          </a>
        </td>
      </tr>

      <!-- Fallback Link -->
      <tr>
        <td style="padding:16px 40px 32px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:${BRAND.subtle};">
            Button not working? Copy and paste this link into your browser:
          </p>
          <p style="
            margin:0;font-size:11.5px;
            color:${BRAND.accent};word-break:break-all;
            font-family:'Courier New',monospace;
          ">${link}</p>
        </td>
      </tr>

      <!-- Warning Note -->
      <tr>
        <td style="padding:0 40px 32px;">
          <div style="
            background:#fef2f2;
            border:1px solid #fecaca;
            border-radius:10px;
            padding:12px 16px;
          ">
            <span style="font-size:14px;">🔒</span>
            <span style="font-size:13px;color:#991b1b;line-height:1.6;margin-left:6px;">
              If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </span>
          </div>
        </td>
      </tr>

      ${dividerBlock()}
      ${footerBlock("This request was made for " + email + ". If this wasn't you, your account is safe and no changes were made.")}
    `);

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your password — ROI Calculator',
      html,
    });
  }
}
