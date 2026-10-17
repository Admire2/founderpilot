import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

dotenv.config();

export async function sendAlert(subject: string, body: string) {
  // 1) EMAIL (primary channel - proven working)
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"Kara Sentinel" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `Kara Sentinel: ${subject}`,
      text: body,
    });
    console.log(`📧 [ALERT EMAIL SENT] ${subject}`);
  } catch (e: any) {
    console.error('❌ Alert email failed:', e.message);
  }
  // 2) SMS (auto-activates once Twilio A2P is approved; silent skip until then)
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `Kara Sentinel: ${subject}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.ALERT_PHONE_NUMBER || '+18329492815',
    });
    console.log('📱 [ALERT SMS SENT]');
  } catch {
    console.log('📵 SMS skipped (A2P pending) - email delivered instead.');
  }
}