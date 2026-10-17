export type AiSettings = { model: string; temperature: number };
const KEY = 'karaAiSettings';
export function getAiSettings(): AiSettings {
  try { return Object.assign({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', temperature: 0.7 }, JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch (e) { return { model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', temperature: 0.7 }; }
}
export function applyAiSettings(s: AiSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
  (window as any).__karaAi = s;
}
applyAiSettings(getAiSettings());
