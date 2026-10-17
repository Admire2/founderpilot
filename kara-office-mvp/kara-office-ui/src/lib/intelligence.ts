export type Artifact = { id: string; kind: string; title: string; text: string; ts: number };
const KEY = 'karaIntelligence';

export function getArtifacts(): Artifact[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
}

export function publishArtifact(kind: string, title: string, text: string): void {
  const list = getArtifacts();
  list.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kind, title, text: (text || '').slice(0, 20000), ts: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  window.dispatchEvent(new CustomEvent('kara-intel-updated'));
}
