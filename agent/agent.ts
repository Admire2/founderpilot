import { ServerOptions, cli, defineAgent, voice, JobContext, llm } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { sendAlert } from './alerter';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function loadKaraConfig(): any {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'kara_config.json'), 'utf-8')); }
  catch { return null; }
}

//  Branded PDF brochure - now lists ALL 4 options with our advisory framing
function generateBrochurePdf(subject: string, body: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.rect(0, 0, doc.page.width, 110).fill('#123f2e');
    doc.fill('#ffffff').font('Helvetica-Bold').fontSize(20).text('AKANDE JOSEPH REALTY', 50, 34);
    doc.font('Helvetica').fontSize(10).text('Kara - AI Real Estate Advisor', 50, 66);
    doc.fill('#000000');
    doc.font('Helvetica-Bold').fontSize(15).text(subject, 50, 140, { width: doc.page.width - 100 });
    doc.font('Helvetica').fontSize(10.5).text(body, 50, doc.y + 14, { width: doc.page.width - 100, lineGap: 4 });
    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(12).text('Your 4 Paths (market options we advise on):', 50, doc.y);
    doc.font('Helvetica').fontSize(10.5).text(
      '1. Distress Sale - sell quickly below market to stop default and protect your credit.\n' +
      '2. Short Sale - lender accepts less than the balance; avoids a foreclosure on your record.\n' +
      '3. Fast-Cash Offer - investor buys as-is; closes in days; cash in hand, no repairs.\n' +
      '4. Traditional Sale - full-price MLS listing; best equity if you have time.\n\n' +
      'Our role: we do not push one product. We review your goals (protect credit, cash back, speed) and advise which path fits you best.',
      50, doc.y + 6, { width: doc.page.width - 100, lineGap: 3 });
    doc.font('Helvetica-Oblique').fontSize(8.5).fill('#777777')
      .text('Generated automatically by Kara during your phone call. Akande Joseph Realty.', 50, doc.page.height - 60, { width: doc.page.width - 100 });
    doc.end();
  });
}

function generateICS(title: string, description: string, startTime: Date, durationMins: number) {
  const endTime = new Date(startTime.getTime() + durationMins * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Akande Joseph Realty//Kara//EN', 'BEGIN:VEVENT',
    'UID:' + Date.now() + '@ajr.com',
    'DTSTAMP:' + fmt(new Date()),
    'DTSTART:' + fmt(startTime),
    'DTEND:' + fmt(endTime),
    'SUMMARY:' + title,
    'DESCRIPTION:' + description,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\n');
}

export default defineAgent({
  entry: async (ctx: JobContext) => {
    try {
      await ctx.connect();
      const participant = await ctx.waitForParticipant();
      const attributes = participant.attributes;

      let phoneNumber = attributes?.phoneNumber || 'Unknown';
      if (phoneNumber === 'Unknown' && participant.identity) {
        phoneNumber = participant.identity.replace('sip_', '').replace('%2B', '+');
      }
      console.log('📞 Call connected from: ' + phoneNumber);

      // 🕵️ CRM LOOKUP
      let callerContext = 'UNKNOWN CALLER: not in database. Politely ask them to fill the intake form on our website, or to spell their email letter-by-letter.';
      let verifiedEmail = '';
      let clientName = '';
      try {
        const { data: client } = await supabase
          .from('clients')
          .select('id, name, email, status')
          .eq('phone_number', phoneNumber)
          .single();
        if (client) {
          verifiedEmail = client.email;
          clientName = client.name;
          callerContext = 'VERIFIED CLIENT RECOGNIZED!\n- Name: ' + client.name + '\n- Client ID: ' + client.id + '\n- Verified Email: ' + client.email + '\nGreet warmly by name. Use send_email / schedule_reminder with the verified email on file. Never ask a verified client to spell their email.';
        }
      } catch (err) {
        console.error('CRM Lookup error:', err);
      }

      // ✅ FIX #1: ADVISOR system prompt (4 options, goals-first, no fake promises)
      const systemPrompt = 'You are Kara, a professional, warm and deeply empathetic real estate ADVISOR for Akande Joseph Realty.\nCALLER CONTEXT:\n' + callerContext + '\n\nYOUR ROLE AND THE 4 OPTIONS:\nHomeowners in hardship generally have 4 market options: 1. Distress Sale, 2. Short Sale, 3. Fast-Cash Offer, 4. Traditional Sale.\nWe do NOT sell these as our own products; they are paths the client can take. OUR JOB is to ADVISE: ask what matters most to them (protecting their credit, cash back in their pocket, speed, or staying in the home), then recommend which option best achieves those goals and explain why in one or two sentences.\n\nRULES:\n1. Empathy first: acknowledge hardship warmly before any business.\n2. Verbal summary: before or when sending the brochure, summarize the relevant options out loud, then say you have emailed the full PDF brochure with all 4 options explained.\n3. NEVER promise videos, video links, external URLs, or files you cannot send. If asked for a video say: "I do not have a video right now, but our PDF brochure explains all four options clearly - shall I email it to you?"\n4. Never guarantee cash back or credit outcomes; say results depend on the lender and market, and we fight for the best possible outcome.\n5. Keep replies to 2-3 spoken sentences and end with a guiding question to move the call forward.\n6. REMINDERS: use schedule_reminder for meetings or callbacks.\n7. KNOWLEDGE: use search_company_knowledge for exact fees or policies.\n8. FAREWELLS: keep goodbyes under 8 words; only farewell when the caller ends the conversation.';

      // 🧠 RAG TOOL
      const searchKnowledgeTool = llm.tool({
        name: 'search_company_knowledge',
        description: 'Search the Akande Joseph Realty internal knowledge base for policies, fees, selling options, or procedures.',
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          console.log('🔍 [RAG] Searching: ' + query);
          try {
            const { data, error } = await supabase
              .from('company_knowledge')
              .select('topic, content')
              .or('topic.ilike.%' + query + '%,content.ilike.%' + query + '%')
              .limit(2);
            if (error) throw error;
            if (!data || data.length === 0) return 'No specific info found. Rely on general real estate expertise.';
            return data.map((d: any) => 'Topic: ' + d.topic + '\nCompany Policy: ' + d.content).join('\n\n');
          } catch (err: any) {
            console.error(' [RAG] Error:', err.message);
            return 'Error searching the knowledge base.';
          }
        },
      });

      //  EMAIL TOOL - ✅ FIX #2: description states HARD limitations to the AI
      const sendEmailTool = llm.tool({
        name: 'send_email',
        description: 'Send the branded PDF brochure (all 4 selling options) plus a text message to the client email. HARD LIMITATIONS: this tool can ONLY send plain text and the standard Akande-Joseph-Realty-Options.pdf attachment. It CANNOT send videos, video links, URLs, images or any other file. Never promise a video or a link; offer the PDF brochure instead. Set attachBrochure true when sending options, hardship details or company info.',
        parameters: z.object({
          email: z.string(),
          subject: z.string(),
          body: z.string(),
          attachBrochure: z.boolean().optional(),
        }),
        execute: async ({ email, subject, body, attachBrochure }) => {
          console.log('📧 [TOOL] Sending email to: ' + email);
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            return 'Error: "' + email + '" is not a valid email address. Ask the user to spell it letter-by-letter.';
          }
          try {
            const transporter = nodemailer.createTransport({
              host: 'smtp.gmail.com',
              port: 465,
              secure: true,
              auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
            });
            const attachments: any[] = [];
            if (attachBrochure) {
              console.log('📄 [PDF] Generating branded brochure...');
              const pdf = await generateBrochurePdf(subject, body);
              attachments.push({ filename: 'Akande-Joseph-Realty-Options.pdf', content: pdf, contentType: 'application/pdf' });
              console.log('📄 [PDF] Brochure attached (' + pdf.length + ' bytes).');
            }
            await transporter.sendMail({
              from: '"Kara | Akande Joseph Realty" <' + process.env.GMAIL_USER + '>',
              to: email,
              subject: subject,
              text: body,
              attachments: attachments,
            });
            console.log('✅ [EMAIL] Sent to ' + email + (attachBrochure ? ' WITH PDF brochure!' : '!'));
            return attachBrochure
              ? 'Email with branded PDF brochure sent. Tell the user to check their inbox for the email and attached brochure.'
              : 'Email sent successfully. Tell the user it just landed in their inbox.';
          } catch (err: any) {
            console.error('❌ [EMAIL] Gmail error:', err.message);
            return 'Failed to send email. Apologize and offer to read the details on the call.';
          }
        },
      });

      //  CALENDAR REMINDER TOOL
      const scheduleReminderTool = llm.tool({
        name: 'schedule_reminder',
        description: 'Schedule a reminder or meeting. Emails a calendar invite (.ics) the caller can add to their phone.',
        parameters: z.object({
          title: z.string(),
          description: z.string(),
          startTimeISO: z.string().describe('ISO 8601 date string (e.g., 2026-10-05T15:00:00Z)'),
          durationMinutes: z.number().default(30),
        }),
        execute: async ({ title, description, startTimeISO, durationMinutes }) => {
          const icsContent = generateICS(title, description, new Date(startTimeISO), durationMinutes);
          try {
            const transporter = nodemailer.createTransport({
              host: 'smtp.gmail.com',
              port: 465,
              secure: true,
              auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
            });
            await transporter.sendMail({
              from: '"Kara | Akande Joseph Realty" <' + process.env.GMAIL_USER + '>',
              to: verifiedEmail || process.env.GMAIL_USER,
              subject: 'Calendar Invite: ' + title,
              text: 'Hi! Here is the calendar invite for "' + title + '". Open the attached file to add it to your phone calendar.',
              attachments: [{ filename: 'reminder.ics', content: icsContent, contentType: 'text/calendar' }],
            });
            return 'Calendar invite sent! Tell the user to check their email and tap the attachment to add it to their phone calendar.';
          } catch (err: any) {
            console.error('❌ [ICS] Error:', err.message);
            return 'Failed to send calendar invite.';
          }
        },
      });

      // 👁️ VISION TOOL
      const analyzeImageTool = llm.tool({
        name: 'analyze_property_image',
        description: 'Analyze a property image from a URL to identify features, condition, or damages.',
        parameters: z.object({ imageUrl: z.string().url() }),
        execute: async ({ imageUrl }) => {
          try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'qwen/qwen3.8-27b',
                max_tokens: 256,
                messages: [{ role: 'user', content: [
                  { type: 'text', text: 'Briefly analyze this real estate property image for condition and features.' },
                  { type: 'image_url', image_url: { url: imageUrl } },
                ] }],
              }),
            });
            const data: any = await res.json();
            return data.choices?.[0]?.message?.content || 'Vision analysis failed.';
          } catch (e) { return 'Vision error.'; }
        },
      });

      // ✅ FIX #3: maxTokens cap on every brain - kills the 429 OTPM crash
      const kc = loadKaraConfig();
      const primaryLLM = new openai.LLM({ model: kc?.llmPrimary || 'openai/gpt-oss-120b', baseURL: 'https://api.groq.com/openai/v1', apiKey: process.env.GROQ_API_KEY, maxTokens: 150 });
      const secondaryLLM = new openai.LLM({ model: kc?.llmSecondary || 'qwen/qwen3.8-27b', baseURL: 'https://api.groq.com/openai/v1', apiKey: process.env.GROQ_API_KEY, maxTokens: 150 });
      const tertiaryLLM = new openai.LLM({ model: 'openai/gpt-oss-20b', baseURL: 'https://api.groq.com/openai/v1', apiKey: process.env.GROQ_API_KEY, maxTokens: 150 });
      
      const resilientLLM = new llm.FallbackAdapter({
        llms: [primaryLLM, secondaryLLM, tertiaryLLM],
        attemptTimeout: 10.0,
        maxRetryPerLLM: 2,
        retryInterval: 0.5,
        retryOnChunkSent: true,
      });

      // ️ EARS & VOICE: PINNED to your credited providers (Deepgram + ElevenLabs). No config switching.
      const stt: any = new deepgram.STT({ model: 'nova-2', language: 'en' });
      const tts: any = new elevenlabs.TTS({ voice: { name: 'Kara', id: 'EXAVITQu4vr4xnSDxMaL' } });

      const session = new voice.AgentSession({ stt, llm: resilientLLM, tts });
      const agent = new voice.Agent({
        instructions: systemPrompt,
        tools: [searchKnowledgeTool, sendEmailTool, scheduleReminderTool, analyzeImageTool],
      });

      await session.start({ room: ctx.room, agent });

      const greeting = verifiedEmail
        ? 'Hello ' + clientName + '! I am Kara, your real estate advisor with Akande Joseph Realty. How can I help you today?'
        : 'Hello! I am Kara, your real estate advisor for Akande Joseph Realty. How can I help you today?';
      await session.generateReply({ instructions: "Start the conversation by saying exactly: '" + greeting + "'" });

      // 👋 FAREWELL PROTOCOL: max 2 goodbyes, then graceful hang-up
      let farewellCount = 0;
      let farewellLocked = false;
      let disconnectTimer: any = null;

      const extractText = (item: any): string => {
        if (!item) return '';
        if (typeof item.text === 'string') return item.text;
        if (typeof item.textContent === 'string') return item.textContent;
        if (typeof item.content === 'string') return item.content;
        if (Array.isArray(item.content)) return item.content.map((c: any) => (typeof c === 'string' ? c : (c && c.text) || '')).join(' ');
        return '';
      };
      const isFarewell = (t: string) => /goodbye|bye[\s!.-]*bye|have a great day|take care|see you|talk soon|have a good one|stay safe/.test(t.toLowerCase());

      const armDisconnect = (ms: number) => {
        if (disconnectTimer) clearTimeout(disconnectTimer);
        disconnectTimer = setTimeout(() => {
          console.log('👋 Farewell protocol complete (' + farewellCount + ' goodbye(s)). Hanging up gracefully.');
          ctx.room.disconnect().catch(() => {});
        }, ms);
      };

      session.on('conversation_item_added', (item: any) => {
        if (item && item.role === 'user' && farewellCount === 1 && !farewellLocked && disconnectTimer) {
          clearTimeout(disconnectTimer);
          disconnectTimer = null;
          console.log('💬 Caller spoke after first goodbye - grace disconnect cancelled (2nd exchange allowed).');
          return;
        }
        if (!item || item.role !== 'assistant') return;
        const txt = extractText(item);
        if (!txt || !isFarewell(txt)) return;
        farewellCount = farewellCount + 1;
        console.log(' Farewell #' + farewellCount + ' detected.');
        if (farewellCount === 1) {
          armDisconnect(4000);
        } else if (!farewellLocked) {
          farewellLocked = true;
          try { (session as any).input.enabled = false; } catch (e) { /* ignore */ }
          armDisconnect(2500);
        }
      });

      session.on('user_started_speaking', () => {
        if (!farewellLocked && farewellCount === 1 && disconnectTimer) {
          clearTimeout(disconnectTimer);
          disconnectTimer = null;
          console.log(' Caller speaking after first goodbye - grace disconnect cancelled.');
        }
      });
    } catch (fatal: any) {
      console.error('💥 FATAL call error:', fatal?.message || fatal);
      try { await sendAlert('Kara call crashed', String(fatal?.message || fatal)); } catch (e) { /* ignore */ }
    }
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'kara',
  }),
);