// /src/lib/otpService.ts
// Handles actual dispatch of OTPs via Resend (Email) and Twilio (SMS)

import nodemailer from "nodemailer";

/**
 * sendEmailOTP
 * Dispatch OTP via Email using Nodemailer (Gmail or standard SMTP)
 */
export async function sendEmailOTP(email: string, otp: string) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPass) {
    console.warn(`[OTP SERVICE] EMAIL_USER or EMAIL_APP_PASSWORD missing. Simulation to ${email}: ${otp}`);
    return { success: false, error: "Missing Email Credentials" };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const info = await transporter.sendMail({
      from: `"Stealth ZK-KYC" <${emailUser}>`,
      to: email,
      subject: "Your KYC Verification Code",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Stealth ZK-KYC Protocol</h2>
          <p>Your identity verification code is: <strong>${otp}</strong></p>
          <p>This code expires in 5 minutes.</p>
        </div>
      `,
    });
    
    console.log(`[OTP SERVICE] Email sent successfully to ${email} via Nodemailer. (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
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
