// /src/lib/otpService.ts
// Handles actual dispatch of OTPs via Resend (Email) and Twilio (SMS)

/**
 * sendEmailOTP
 * Dispatch OTP via Resend. Requires RESEND_API_KEY in .env.local
 */
export async function sendEmailOTP(email: string, otp: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[OTP SERVICE] Resend API Key missing. Simulation to ${email}: ${otp}`);
    return { success: false, error: "Missing API Key" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Stealth ZK-KYC <onboarding@resend.dev>",
        to: email,
        subject: "Your KYC Verification Code",
        html: `<strong>Your verification code is: ${otp}</strong><p>This code expires in 5 minutes.</p>`,
      }),
    });
    return await res.json();
  } catch (err: any) {
    console.error("[OTP SERVICE] Email dispatch failed:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * sendSMSOTP
 * Dispatch OTP via Twilio. Requires TWILIO_ACCOUNT_SID/AUTH_TOKEN in .env.local
 */
export async function sendSMSOTP(mobile: string, otp: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.warn(`[OTP SERVICE] Twilio credentials missing. Simulation to ${mobile}: ${otp}`);
    return { success: false, error: "Missing Credentials" };
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${auth}`,
      },
      body: new URLSearchParams({
        From: from,
        To: mobile,
        Body: `Your Stealth ZK-KYC code is: ${otp}`,
      }),
    });
    return await res.json();
  } catch (err: any) {
    console.error("[OTP SERVICE] SMS dispatch failed:", err.message);
    return { success: false, error: err.message };
  }
}
