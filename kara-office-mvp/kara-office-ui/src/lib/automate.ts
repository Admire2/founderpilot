export type FlowEvent = { source: string; type: string; payload?: any; ts: number };
export function emitFlowEvent(source: string, type: string, payload?: any): void {
  window.dispatchEvent(new CustomEvent('kara-flow-event', { detail: { source, type, payload, ts: Date.now() } }));
}
