require('dotenv').config();
console.log('🔍 DEBUG: GMAIL_USER =', process.env.GMAIL_USER ? '***' + process.env.GMAIL_USER.substring(process.env.GMAIL_USER.length - 5) : 'UNDEFINED');
console.log('🔍 DEBUG: GMAIL_APP_PASSWORD length =', process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.length : 0);
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Helper: Generate .ics calendar file content
function generateICS(title, description, startTimeISO, durationMins, attendeeEmail) {
  const startTime = new Date(startTimeISO);
  const endTime = new Date(startTime.getTime() + durationMins * 60000);
  
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KaraKata AI//Smart Scheduler//EN',
    'BEGIN:VEVENT',
    'UID:' + Date.now() + '@karakata.ai',
    'DTSTAMP:' + fmt(new Date()),
    'DTSTART:' + fmt(startTime),
    'DTEND:' + fmt(endTime),
    'SUMMARY:' + title,
    'DESCRIPTION:' + description.replace(/\n/g, '\\n'),
    'ATTENDEE;CN=Client:mailto:' + attendeeEmail,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

// 1. CHECK AVAILABILITY
app.post('/api/v1/scheduler/check', async (req, res) => {
  try {
    const { requestedDateISO } = req.body; // e.g., "2026-10-10T14:00:00Z"
    if (!requestedDateISO) return res.status(400).json({ error: 'requestedDateISO is required' });

    const date = new Date(requestedDateISO);
    const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const hour = date.getUTCHours();

    // Simple business logic: Mon-Fri, 9 AM to 5 PM UTC
    const isWeekend = day === 0 || day === 6;
    const isOutsideHours = hour < 9 || hour >= 17;

    if (isWeekend || isOutsideHours) {
      return res.json({ 
        success: false, 
        available: false, 
        message: 'That time is outside our business hours (Mon-Fri, 9 AM - 5 PM UTC). Please suggest another time.' 
      });
    }

    // In a real app, you would query a database here to check for existing bookings.
    // For now, we assume the slot is open.
    res.json({ 
      success: true, 
      available: true, 
      message: 'Time slot is available!',
      proposed_slots: [
        new Date(date.getTime() + 30 * 60000).toISOString(), // +30 mins
        new Date(date.getTime() + 60 * 60000).toISOString()  // +60 mins
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. BOOK & SEND CALENDAR INVITE
app.post('/api/v1/scheduler/book', async (req, res) => {
  try {
    const { title, description, startTimeISO, durationMins, attendeeEmail } = req.body;
    
    if (!title || !startTimeISO || !attendeeEmail) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    const icsContent = generateICS(title, description, startTimeISO, durationMins, attendeeEmail);

    // Setup email transporter (Reuses your Gmail credentials)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false // Helps with some Gmail SMTP quirks
      }
    });

    await transporter.sendMail({
      from: `"Kara Scheduling" <${process.env.GMAIL_USER}>`,
      to: attendeeEmail,
      subject: `Calendar Invite: ${title}`,
      text: `Hi,\n\nYour meeting has been scheduled.\n\nDetails:\n${description}\n\nPlease open the attached .ics file to add this to your calendar.\n\nBest,\nKaraKata AI`,
      attachments: [
        {
          filename: 'meeting-invite.ics',
          content: icsContent,
          contentType: 'text/calendar; method=REQUEST'
        }
      ]
    });

    res.json({ 
      success: true, 
      message: 'Booking confirmed and calendar invite sent!',
      ics_preview: icsContent.substring(0, 100) + '...' 
    });

  } catch (error) {
    console.error('Scheduler API Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`📅 Advanced Kara Scheduler API running on http://localhost:${PORT}`);
});


