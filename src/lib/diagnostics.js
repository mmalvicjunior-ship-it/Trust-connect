import fs from 'node:fs';
import path from 'node:path';

const DIAG_FILE = path.join(process.cwd(), 'provider_diagnostics.json');
const MAX_ENTRIES = 200;

function readEntries() {
  try {
    const raw = fs.readFileSync(DIAG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // File missing, unreadable, or invalid — start fresh
  }
  return [];
}

function writeEntries(entries) {
  try {
    fs.writeFileSync(DIAG_FILE, JSON.stringify(entries, null, 2));
  } catch {
    // Silent: diagnostics must never break chatbot requests
  }
}

export function logEvent({ provider, eventType, status = null, errorCategory = null, durationMs = null, fallbackAttempted = null, correlationId }) {
  const entry = {
    timestamp: new Date().toISOString(),
    correlationId: correlationId || 'unknown',
    provider: provider || 'system',
    eventType: eventType || 'unknown',
    status: Number.isFinite(status) ? status : null,
    errorCategory: typeof errorCategory === 'string' && errorCategory.length > 0 ? errorCategory : null,
    durationMs: Number.isFinite(durationMs) ? Math.round(durationMs) : null,
    fallbackAttempted: fallbackAttempted === true ? true : (fallbackAttempted === false ? false : null),
  };
  const entries = readEntries();
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
  writeEntries(entries);
}
