import nodemailer from "nodemailer";

export const sendWelcomeEmail = async (email, username, password) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"GrowWithCoinMarket" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Welcome to GrowWithCoinMarket — Your Account is Ready!",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to GrowWithCoinMarket</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#0a0c10;font-family:'DM Sans',sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0c10;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:linear-gradient(160deg,#13161e 0%,#0e1117 100%);border-radius:20px;overflow:hidden;border:1px solid #2a2d3a;box-shadow:0 0 60px rgba(212,175,55,0.08);">

          <!-- Gold top bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#b8860b,#f5d061,#b8860b);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding:48px 40px 32px;">
              <!-- Logo mark -->
              <div style="display:inline-block;background:linear-gradient(135deg,#1e2030,#252840);border:1px solid #2e3250;border-radius:16px;padding:14px 22px;margin-bottom:28px;">
                <span style="font-family:'Playfair Display',serif;font-size:22px;background:linear-gradient(90deg,#f5d061,#c9973a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:0.5px;">
                  GrowWithCoinMarket
                </span>
              </div>

          
              <h1 style="margin:0 0 12px;font-family:'Playfair Display',serif;font-size:32px;color:#f0f0f0;letter-spacing:-0.5px;">
                Welcome Aboard!
              </h1>
              <p style="margin:0;font-size:16px;color:#8a8fa8;line-height:1.6;max-width:400px;">
                Your account has been created successfully. You're now part of a smarter crypto community.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#2a2d3a,transparent);"></div>
            </td>
          </tr>

          <!-- Credentials box -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:13px;font-weight:600;color:#f5d061;letter-spacing:2px;text-transform:uppercase;">
                Your Login Credentials
              </p>

              <!-- Username -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td style="background:#161922;border:1px solid #2a2d3a;border-radius:12px;padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#5a5e75;letter-spacing:1.5px;text-transform:uppercase;">Username</p>
                    <p style="margin:0;font-size:17px;font-weight:600;color:#e8e8f0;letter-spacing:0.3px;">${username}</p>
                  </td>
                </tr>
              </table>

              <!-- Password -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#161922;border:1px solid #2a2d3a;border-radius:12px;padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#5a5e75;letter-spacing:1.5px;text-transform:uppercase;">Password</p>
                    <p style="margin:0;font-size:17px;font-weight:600;color:#e8e8f0;letter-spacing:2px;font-family:monospace;">${password}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security notice -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#1a1f2e,#161b28);border:1px solid #2a3050;border-radius:12px;padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#6a7090;line-height:1.7;">
                      🔒 <strong style="color:#8890b0;">Security tip:</strong> Please change your password after your first login. Never share your credentials with anyone.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 40px 48px;">
              <a href="#" style="display:inline-block;background:linear-gradient(135deg,#c9973a,#f5d061,#c9973a);color:#0a0c10;font-size:15px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:50px;letter-spacing:0.5px;">
                Login to Your Account →
              </a>
            </td>
          </tr>

          <!-- Gold divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#2a2d3a,transparent);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 40px 40px;">
              <p style="margin:0 0 8px;font-size:13px;color:#3a3e55;">
                Need help? Reach us at
                <a href="mailto:${process.env.EMAIL_USER}" style="color:#c9973a;text-decoration:none;">${process.env.EMAIL_USER}</a>
              </p>
              <p style="margin:0;font-size:12px;color:#2e3148;">
                © ${new Date().getFullYear()} GrowWithCoinMarket. All rights reserved.
              </p>
            </td>
          </tr>

          <!-- Gold bottom bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#b8860b,#f5d061,#b8860b);"></td>
          </tr>

        </table>
        <!-- End Card -->

      </td>
    </tr>
  </table>

</body>
</html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error("❌ Email Error:", error);
  }
};
