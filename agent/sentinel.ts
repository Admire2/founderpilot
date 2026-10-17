import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { sendAlert } from './alerter';

dotenv.config();

const CONFIG_PATH = path.join(process.cwd(), 'kara_config.json');
const GROQ_BASE = 'https://api.groq.com/openai/v1';

const LLM_PREFERENCE = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
];
const STT_PREFERENCE = ['whisper-large-v3-turbo', 'whisper-large-v3'];
const TTS_MODEL = 'canopylabs/orpheus-v1-english';

interface KaraConfig {
  llmPrimary: string; llmSecondary: string;
  sttProvider: 'groq' | 'deepgram'; sttModel: string;
  ttsProvider: 'groq' | 'elevenlabs'; ttsModel: string; ttsVoice: string;
  lastCheck: string; lastActiveModels: string[];
}

const DEFAULTS: KaraConfig = {
  llmPrimary: LLM_PREFERENCE[0], llmSecondary: LLM_PREFERENCE[1],
  sttProvider: 'groq', sttModel: STT_PREFERENCE[0],
  ttsProvider: 'groq', ttsModel: TTS_MODEL, ttsVoice: 'autumn',
  lastCheck: '', lastActiveModels: [],
};

const load = (): KaraConfig => { try { return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) }; } catch { return { ...DEFAULTS }; } };
const save = (c: KaraConfig) => fs.writeFileSync(CONFIG_PATH, JSON.stringify(c, null, 2));

async function groqModels(): Promise<string[]> {
  const res = await fetch(`${GROQ_BASE}/models`, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } });
  if (!res.ok) throw new Error(`Groq models endpoint returned ${res.status}`);
  const data: any = await res.json();
  return (data.data || []).map((m: any) => m.id);
}

async function ping(model: string): Promise<{ alive: boolean; degraded: boolean; code: number }> {
  try {
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }),
    });
    if (res.ok) return { alive: true, degraded: false, code: res.status };
    if (res.status === 429 || res.status >= 500) return { alive: true, degraded: true, code: res.status };
    return { alive: false, degraded: false, code: res.status }; // 404/400 = retired
  } catch { return { alive: false, degraded: false, code: -1 }; }
}

async function ttsPing(): Promise<boolean> {
  try {
    const res = await fetch(`${GROQ_BASE}/audio/speech`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: TTS_MODEL, voice: 'autumn', input: 'test' }),
    });
    return res.ok;
  } catch { return false; }
}

async function runCheck() {
  const cfg = load();
  const alerts: string[] = [];
  try {
    const active = await groqModels();

    // Detect models Groq removed since last check
    const disappeared = (cfg.lastActiveModels || []).filter(m => m && !active.includes(m));
    if (disappeared.length) alerts.push(`Groq REMOVED model(s): ${disappeared.join(', ')}. Kara has already migrated if she was using them.`);

    // --- LLM lineup ---
    const pool = Array.from(new Set([
      ...LLM_PREFERENCE.filter(m => active.includes(m)),
      ...[cfg.llmPrimary, cfg.llmSecondary].filter(m => active.includes(m)),
    ]));
    let primary = pool[0] || cfg.llmPrimary;
    let secondary = pool[1] || pool[0] || cfg.llmSecondary;
    const p = await ping(primary);
    if (!p.alive) {
      for (const alt of pool) { if (alt !== primary && (await ping(alt)).alive) { alerts.push(`Primary LLM '${primary}' is retired/dead (code ${p.code}). Auto-promoted '${alt}'.`); primary = alt; break; } }
    } else if (p.degraded) {
      alerts.push(`Groq primary LLM '${primary}' is degraded (code ${p.code} - rate limit or outage). FallbackAdapter will cover calls; monitoring.`);
    }
    if (primary !== cfg.llmPrimary || secondary !== cfg.llmSecondary) {
      alerts.push(`LLM lineup updated: primary=${primary}, secondary=${secondary}.`);
      cfg.llmPrimary = primary; cfg.llmSecondary = secondary;
    }

    // --- STT ---
    const sttModel = STT_PREFERENCE.find(m => active.includes(m));
    if (!sttModel) {
      if (cfg.sttProvider !== 'deepgram') { cfg.sttProvider = 'deepgram'; alerts.push('Groq Whisper unavailable - STT AUTO-SWITCHED to Deepgram (your credits).'); }
    } else {
      if (cfg.sttProvider !== 'groq') alerts.push('Groq Whisper is back - STT AUTO-SWITCHED back to free Groq.');
      cfg.sttProvider = 'groq'; cfg.sttModel = sttModel;
    }

    // --- TTS ---
    const ttsOk = await ttsPing();
    if (!ttsOk) {
      if (cfg.ttsProvider !== 'elevenlabs') { cfg.ttsProvider = 'elevenlabs'; alerts.push('Groq Orpheus TTS unavailable - TTS AUTO-SWITCHED to ElevenLabs (your credits).'); }
    } else {
      if (cfg.ttsProvider !== 'groq') alerts.push('Groq Orpheus TTS is back - AUTO-SWITCHED back to free Groq.');
      cfg.ttsProvider = 'groq'; cfg.ttsModel = TTS_MODEL;
    }

    cfg.lastActiveModels = active;
  } catch (e: any) {
    alerts.push(`Sentinel could not reach Groq API: ${e.message}. Kara will keep using last known-good config.`);
  }

  cfg.lastCheck = new Date().toISOString();
  save(cfg);

  if (alerts.length) {
    await sendAlert('Auto-adjustment applied', alerts.join('\n\n') + '\n\nNo action needed from you - Kara adapted automatically.');
  }
  console.log(alerts.length ? `⚠️ Sentinel: ${alerts.length} adjustment(s).` : '✅ Sentinel: all systems nominal.');
}

async function main() {
  if (process.argv.includes('--test-alert')) {
    await sendAlert('Test notification', 'If you can read this, Kara Sentinel alerts are working. Email channel: OK. SMS channel: activates automatically once A2P approves.');
    process.exit(0);
  }

  if (process.argv.includes('--loop')) {
    console.log('🛰️ Kara Sentinel watchdog running (hourly checks). Ctrl+C to stop.');
    while (true) {
      await runCheck();
      await new Promise((r) => setTimeout(r, 60 * 60 * 1000));
    }
  } else {
    await runCheck();
  }
}

main().catch((err) => {
  console.error('❌ Sentinel fatal error:', err);
  process.exit(1);
});