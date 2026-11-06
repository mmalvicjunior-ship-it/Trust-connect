import { NextResponse } from 'next/server';
import { logEvent } from '../../../lib/diagnostics.js';

// Vercel serverless execution budget — safe for all plans (max 300s; 30s fits Hobby/Pro)
export const maxDuration = 30;

const sanitizeTimeoutMs = (raw) => {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > 10000) return null;
  return Math.min(Math.round(n), 10000);
};

// Request-wide time budget — initialized before any provider logic
const BUDGET_MS = 30000;
const RESERVE_MS = 3000;

// Trust Connect domain context (concise, no invented claims)
const TC_DOMAIN = `Trust Connect is a service-provider booking platform.
Available service categories include: Electricians, Plumbers, Mechanics, Cleaners, Painters, Carpenters, Gardeners, Appliance Repair, Air Conditioning, Security Installation, CCTV, Solar Installation, IT Support, General Handyman, Pest Control.
Customers find verified local providers, view ratings/reviews, and book services.
Providers include trades such as electricians, plumbers, cleaners, painters, mechanics, gardeners, appliance repair, HVAC, security, and general handymen.`;

// Relevance guard: reject unrelated Tavily results for Trust Connect queries
const isTavilyRelevant = (answerText, sources) => {
  if (!answerText || !answerText.trim()) return false;
  const text = answerText.toLowerCase();
  // Unrelated product terms that should disqualify a generic platform query
  const unrelatedTerms = ['cybersecurity', 'vpn', 'proxy', 'abilitykey', 'comodo', 'antivirus', 'firewall', 'encryption proxy'];
  const unrelatedMatch = unrelatedTerms.some(t => text.includes(t));
  if (unrelatedMatch) return false;
  // Prefer answers mentioning service/booking/trust concepts
  const relevantTerms = ['service', 'provider', 'booking', 'trust', 'customer', 'professional', 'find', 'book', 'platform', 'plumber', 'cleaner', 'electrician'];
  const relevantMatch = relevantTerms.some(t => text.includes(t)) || (sources && sources.some(s => /service|provider|booking/i.test(s.title || '')));
  return relevantMatch || !unrelatedMatch;
};

// Provider diagnostics (no secrets logged)
const generateCorrelationId = () => Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);

const RATE_LIMIT_HEADERS = [
  'retry-after',
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
  'x-ratelimit-limit-requests',
  'x-ratelimit-remaining-requests',
  'x-ratelimit-reset-requests',
  'x-ratelimit-limit-tokens',
  'x-ratelimit-remaining-tokens',
  'x-ratelimit-reset-tokens',
];
const providerCooldowns = new Map();
const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 60 * 1000;

const sanitizeDiagnosticCode = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const code = String(value).trim().toUpperCase();
  return /^[A-Z0-9_]{1,80}$/.test(code) ? code : null;
};

const classifyProviderMessage = (message) => {
  const normalized = typeof message === 'string' ? message.toLowerCase() : '';
  if (/resource_exhausted|quota/.test(normalized)) return 'quota_or_resource_exhausted';
  if (/rate.?limit|too many requests/.test(normalized)) return 'rate_limit_exceeded';
  if (/capacity|overload|temporarily unavailable/.test(normalized)) return 'provider_at_capacity';
  if (/unauthorized|authentication|permission denied|invalid api key/.test(normalized)) return 'authentication_or_permission_rejected';
  if (/not found|unknown model/.test(normalized)) return 'model_or_endpoint_not_found';
  return 'provider_error';
};

const classifyProviderFailure = (provider, status, errorCode, message) => {
  if (errorCode === 'EMPTY_RESPONSE') return 'empty_response';
  if (errorCode === 'RESOURCE_EXHAUSTED') return 'quota_or_resource_exhausted';
  if (status === 401) return 'authentication_or_permission_rejected';
  if (status === 404 || /not found|unknown model/i.test(String(message || '').toLowerCase())) return 'model_or_endpoint_not_found';
  if (status === 429 || errorCode === 'RATE_LIMIT_EXCEEDED') return 'rate_limit_exceeded';
  if (status === 503 || status === 502 || status === 504) return 'provider_at_capacity';
  return classifyProviderMessage(message);
};

const isAbortError = (e) => {
  if (!e || typeof e !== 'object') return false;
  const name = e.name || '';
  const msg = typeof e.message === 'string' ? e.message : '';
  return name === 'AbortError' || name === 'TimeoutError' || /timeout|timed out/i.test(msg);
};

const parseRetryAfterMs = (headers, now = Date.now()) => {
  const value = headers?.get('retry-after')?.trim();
  if (!value) return null;
  if (/^\d+(?:\.\d+)?$/.test(value)) return Math.max(0, Number(value) * 1000);
  const retryAt = Date.parse(value);
  return Number.isNaN(retryAt) ? null : Math.max(0, retryAt - now);
};

const recordProviderCooldown = (provider, response, now = Date.now()) => {
  const retryAfterMs = parseRetryAfterMs(response?.headers, now);
  let durationMs = retryAfterMs;

  if (durationMs === null) durationMs = DEFAULT_RATE_LIMIT_COOLDOWN_MS;

  const cooldownUntil = now + durationMs;
  providerCooldowns.set(provider, cooldownUntil);
  return Math.ceil(durationMs / 1000);
};

const getProviderCooldownSeconds = (provider, now = Date.now()) => {
  const cooldownUntil = providerCooldowns.get(provider);
  if (!cooldownUntil || cooldownUntil <= now) {
    if (cooldownUntil && cooldownUntil <= now) {
      logEvent({ provider, eventType: 'available_again', correlationId: null, status: null, errorCategory: null, durationMs: Math.ceil((now - (cooldownUntil - DEFAULT_RATE_LIMIT_COOLDOWN_MS)) / 1000) * 1000, fallbackAttempted: null });
    }
    providerCooldowns.delete(provider);
    return 0;
  }
  return Math.ceil((cooldownUntil - now) / 1000);
};

const getRateLimitHeaders = (headers) => {
  const captured = {};
  for (const name of RATE_LIMIT_HEADERS) {
    const value = headers?.get(name);
    if (!value) continue;
    const trimmed = value.trim();
    const isNumber = /^\d+(?:\.\d+)?$/.test(trimmed);
    const isHttpDate = /^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(trimmed);
    const isIsoDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(trimmed);
    if (isNumber || isHttpDate || isIsoDate) captured[name] = trimmed;
  }
  return captured;
};

const logProviderOutcome = (provider, outcome, details = {}) => {
  const event = { provider, outcome };
  if (details.reason) event.reason = details.reason;
  if (Number.isInteger(details.status)) event.status = details.status;
  if (details.errorCategory) event.errorCategory = details.errorCategory;
  if (Number.isFinite(details.retryAfterSeconds) && details.retryAfterSeconds >= 0) {
    event.retryAfterSeconds = details.retryAfterSeconds;
  }
  console.log(`[CHAT_PROV] ${JSON.stringify(event)}`);
};

const logProviderFailure = ({ provider, response, errorBody, retryAfterSeconds, error }) => {
  const providerError = errorBody?.error || errorBody || {};
  const errorCode = sanitizeDiagnosticCode(providerError.code || providerError.status || error?.name);
  logProviderOutcome(provider, 'failed', {
    status: response?.status,
    errorCategory: classifyProviderFailure(provider, response?.status, errorCode, providerError.message || error?.message),
    retryAfterSeconds,
  });
};

const readProviderError = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const correlationId = generateCorrelationId();
  logEvent({ provider: 'system', eventType: 'request_received', correlationId });

  // Request-wide time budget initialized at start of every request
  const startMs = Date.now();
  const timeLeft = () => BUDGET_MS - (Date.now() - startMs);
  const canAttempt = (needMs = 4000) => timeLeft() > needMs + RESERVE_MS;

  // Real deadline controller for request-wide enforcement
  const deadlineController = new AbortController();
  const deadlineTimer = setTimeout(() => deadlineController.abort(), BUDGET_MS);

  try {
  const question = body?.question;
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return NextResponse.json({ error: 'A question is required.' }, { status: 400 });
  }

  // --- Defence layers preserved ---
  const lowerQ = question.toLowerCase().trim();
  const providerFailures = [];

  // Greeting
  const isGreet = /^(hello|hi|hie|hey|heyy|greetings|howdy|good morning|good afternoon|good evening|nice to meet you|what's up|how's it going|how are you(?: doing)?(?: today)?)[.!?]*$/i.test(lowerQ);
  if (isGreet) {
    logProviderOutcome('gemini', 'skipped', { reason: 'not_reached' });
    return NextResponse.json({ answer: "Hi! I'm doing well, thanks for asking. How are you doing today?", sources: [], provider: 'local' }, { status: 200 });
  }

  // Keep only brief courtesy and farewell replies local.
  const isConv = /^(thank you|thanks|thank you very much|goodbye|bye|see you)[.!?]*$/i.test(lowerQ);
  if (isConv) {
    logProviderOutcome('gemini', 'skipped', { reason: 'not_reached' });
    return NextResponse.json({ answer: "Of course! Go ahead and ask me anything. I'm here to help.", sources: [], provider: 'local' }, { status: 200 });
  }

  // Define terms for quick local answers and search logic
  const serviceOrTradeTerms = /\b(plumbers?|electricians?|cleaners?|painters?|carpenters?|gardeners?|pests?|security|hvacs?|mechanics?|car repairs?|appliances?|tiling|masonry)\b/i;
  const generalServiceOrPlatformTerms = /\b(services?|categories|category|trades?|platform|what can (you|i) (do|find|help)|how (can|does) (it|this|trust connect) work|how (do|can) (i|you) use (this|the) (application|website|platform|app|site)|about trust connect|help me do|available services)\b/i;

  const directFAQTerms = /\b(what services?|what can I find|how does this work|how (do|can) (i|you) use (this|the) (application|website|platform|app|site)|about trust connect|available services?|help me do|what can you do)\b/i;
  const bookingQuery = /\b(how do I book|how can I book|how can I make a booking|how do I request a service|book a (professional|plumber|cleaner|electrician))\b/i;
  const directTradeQuery = /\b(find|look for|search for|need)\b/i;

  // --- Booking FAQ (priority over generic service FAQ) ---
  if (bookingQuery.test(lowerQ)) {
    return NextResponse.json({
      answer: "To book a professional on Trust Connect:\n\n1. Sign in to your account (or create one).\n2. Go to the Booking page and select a verified professional from the provider list.\n3. Choose the service category (for example: Plumber, Electrician, Cleaner).\n4. Enter the date, time, location, job description and estimated amount.\n5. Submit the form.\n\nAfter submitting, your booking receives a Booking ID and is set to Status: Pending. It is not automatically confirmed — confirmation depends on the provider's response through the platform.",
      sources: [], provider: 'local'
    }, { status: 200 });
  }

  // --- Instant local responses for direct FAQs and simple service queries ---
  const isDirectFAQ = directFAQTerms.test(lowerQ);
  const isDirectServiceQuery = serviceOrTradeTerms.test(lowerQ) && (directTradeQuery.test(lowerQ) || /\b(in|at)\s+[a-z]+(falls|city|town|vicfalls)\b/i.test(lowerQ));
  if (isDirectFAQ || (isDirectServiceQuery && !/\b(explain|compare|analysis|detailed|risks|security risks|online platforms)\b/i.test(lowerQ))) {
    const isHelp = /\b(what can (you|i) (do|find|help)|how (can|does) (it|this|trust connect) work|about trust connect)\b/i.test(lowerQ);
    const header = isHelp
      ? "Trust Connect is a service-provider booking platform.\n\n"
      : "Trust Connect connects you with verified local professionals.\n\n";
    return NextResponse.json({
      answer: header + "Available service categories include: Electricians, Plumbers, Mechanics, Cleaners, Painters, Carpenters, Gardeners, Appliance Repair, Air Conditioning, Security Installation, CCTV, Solar Installation, IT Support, General Handyman, Pest Control.\n\nCustomers find verified local providers, view ratings/reviews, and book services directly through our Services page.",
      sources: [], provider: 'local'
    }, { status: 200 });
  }

  const currentInfoTerms = /\b(latest|recent|current|news|developments|updates)\b/i;
  const searchIntentWithService = /\b(find|search|discover|look for|browse)\b/i;
  const locationSearch = /\b(in|at|near)\s+[a-z]+(falls|city|town|region)\b/i;

  const hasService = serviceOrTradeTerms.test(lowerQ);
  const hasCurrentInfo = currentInfoTerms.test(lowerQ);
  const hasLocation = locationSearch.test(lowerQ);
  const hasExplicitSearch = searchIntentWithService.test(lowerQ);

  const needsTavily = (hasService && (hasExplicitSearch || hasLocation || hasCurrentInfo))
    || (hasCurrentInfo && (hasService || hasExplicitSearch || hasLocation))
    || (hasLocation && (hasService || hasExplicitSearch || hasCurrentInfo));

  // Keep enough recent history for references and summaries without unbounded prompts.
  const context = messages
    .filter((m) => ['user', 'assistant'].includes(m.role) && m.provider !== 'error' && typeof m.text === 'string' && m.text.trim().length > 0)
    .slice(-20)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text.trim().substring(0, 1000)}`)
    .join('\n');
  const queryText = messages.length > 0 ? `${context}\nLatest: ${question}` : question;

  // --- Call Tavily only when needed ---
  if (!needsTavily) {
    logEvent({ provider: 'tavily', eventType: 'skipped', correlationId, durationMs: null, fallbackAttempted: null });
  }
  let tavilyAnswer = '';
  let tavilySources = [];
  if (needsTavily) {
    logEvent({ provider: 'tavily', eventType: 'attempted', correlationId, durationMs: null, fallbackAttempted: null });
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (!tavilyKey) {
      providerFailures.push({ provider: 'tavily', status: null, reason: 'missing_api_key' });
      logProviderOutcome('tavily', 'skipped', { reason: 'missing_api_key' });
      logEvent({ provider: 'tavily', eventType: 'skipped', correlationId, durationMs: null, fallbackAttempted: null });
    } else if (canAttempt(3000)) try {
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tavilyKey}` },
        body: JSON.stringify({ query: queryText, search_depth: 'advanced', include_answer: true, include_raw_content: false, max_results: 6 }),
        signal: AbortSignal.any([AbortSignal.timeout(3000), deadlineController.signal]),
      });
      if (tavilyRes.ok) {
        const data = await tavilyRes.json();
        tavilyAnswer = data.answer || '';
        tavilySources = Array.isArray(data.results) ? data.results.map(r => ({ title: r.title || r.url, url: r.url })).filter(s => s.url) : [];
      } else {
        providerFailures.push({ provider: 'tavily', status: tavilyRes.status, reason: 'http_error' });
        logProviderOutcome('tavily', 'failed', {
          status: tavilyRes.status,
          errorCategory: classifyProviderFailure('tavily', tavilyRes.status, null, ''),
        });
      }
    } catch (e) {
      providerFailures.push({ provider: 'tavily', status: null, reason: isAbortError(e) ? 'timeout_aborted' : 'request_exception' });
      if (isAbortError(e)) {
        logProviderOutcome('tavily', 'timeout', { reason: 'aborted' });
      } else {
        logProviderOutcome('tavily', 'failed', { errorCategory: classifyProviderMessage(e?.message) });
      }
    }
  }

  let finalAnswer = '';
  let finalSources = tavilySources;
  let tavilyUsed = false;

  // --- Gemini (primary and only AI model provider) ---
  const geminiKey = process.env.GEMINI_API_KEY;
  const configuredGeminiModel = (process.env.GEMINI_MODEL || '').trim();
  // Only allow a safe model id in the URL path; fall back to the configured default.
  const geminiModel = /^[A-Za-z0-9._-]+$/.test(configuredGeminiModel) ? configuredGeminiModel : 'gemini-3.5-flash';
  let geminiUsed = false;
  const geminiCooldownSeconds = geminiKey ? getProviderCooldownSeconds('gemini') : 0;

  const geminiTimeoutMs = sanitizeTimeoutMs(process.env.GEMINI_TIMEOUT_MS) || 8000;
  if (geminiKey && geminiCooldownSeconds === 0 && !finalAnswer && canAttempt(geminiTimeoutMs)) {
    logProviderOutcome('gemini', 'attempted');
    logEvent({ provider: 'gemini', eventType: 'attempt_started', correlationId });
    try {
      const promptParts = [{ text: `You are Trust Connect AI. Be helpful, accurate, and concise.\n${TC_DOMAIN}` }];
      const tavilyRelevant = tavilyAnswer && isTavilyRelevant(tavilyAnswer, tavilySources);
      if (tavilyAnswer.trim() && !tavilyRelevant) {
        logEvent({ provider: 'tavily', eventType: 'rejected_irrelevant', correlationId, durationMs: null, fallbackAttempted: null });
      }
      if (tavilySources.length > 0 && tavilyAnswer && tavilyRelevant) {
        tavilyUsed = true;
        const citations = tavilySources.map((s, i) => `[${i + 1}] ${s.title || s.url}: ${s.url}`).join('\n');
        promptParts.push({ text: `Recent conversation:\n${context ? context + '\n\n' : ''}The user asked: ${question}\n\nExternal research results (with citations):\n${tavilyAnswer}\n\nSources:\n${citations}\n\nAnswer the user's question using the conversation and research. Include citations where relevant.` });
      } else if (context) {
        promptParts.push({ text: `Recent conversation:\n${context}\n\nLatest user message: ${question}\nAnswer clearly and use the conversation history to resolve follow-up references.` });
      } else {
        promptParts.push({ text: `User asks: ${question}\nAnswer clearly.` });
      }
      let retryCount = 0;
      const maxRetries = 0; // disabled: serverless budget requires single attempt
      let geminiRes = null;
      let retryDueToTemp = false;
      while (retryCount <= maxRetries) {
        geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          body: JSON.stringify({ contents: [{ role: 'user', parts: promptParts }], generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } }),
          signal: AbortSignal.any([AbortSignal.timeout(geminiTimeoutMs), deadlineController.signal]),
        });
        if (geminiRes.ok) break;
        const isTemporary = [503, 502, 504, 500].includes(geminiRes.status);
        if (isTemporary && retryCount < maxRetries && canAttempt(6000)) {
          retryCount += 1;
          retryDueToTemp = true;
          logProviderOutcome('gemini', 'retry', { reason: 'temporary_failure', retryAttempt: retryCount });
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        break;
      }

      if (geminiRes.ok) {
        const gemData = await geminiRes.json();
        const candidate = gemData.candidates?.[0];
        const outputText = candidate?.content?.parts?.[0]?.text || '';
        const answerText = outputText.trim();
        if (answerText) {
          finalAnswer = answerText;
          geminiUsed = true;
          logProviderOutcome('gemini', 'succeeded');
          logEvent({ provider: 'gemini', eventType: 'success', status: geminiRes.status, correlationId, durationMs: null, fallbackAttempted: false });
        } else {
          providerFailures.push({ provider: 'gemini', status: geminiRes.status, reason: 'empty_response' });
          logProviderFailure({
            provider: 'gemini',
            response: geminiRes,
            errorBody: { error: { code: 'EMPTY_RESPONSE', message: 'Empty provider response' } },
          });
        }
      } else {
        const errorBody = await readProviderError(geminiRes);
        const retryAfterSeconds = geminiRes.status === 429
          ? recordProviderCooldown('gemini', geminiRes)
          : null;
        providerFailures.push({
          provider: 'gemini',
          status: geminiRes.status,
          reason: geminiRes.status === 429 ? 'rate_limited' : 'http_error',
          ...(retryAfterSeconds === null ? {} : { retryAfterSeconds }),
        });
        logProviderFailure({ provider: 'gemini', response: geminiRes, errorBody, retryAfterSeconds, retryDueToTemp: retryDueToTemp || null });
        logEvent({ provider: 'gemini', eventType: 'http_failure', status: geminiRes.status, errorCategory: classifyProviderFailure('gemini', geminiRes.status, sanitizeDiagnosticCode(errorBody?.error?.code || errorBody?.code || null), errorBody?.error?.message || ''), correlationId, durationMs: null, fallbackAttempted: false });
      }
    } catch (e) {
      providerFailures.push({ provider: 'gemini', status: null, reason: isAbortError(e) ? 'timeout_aborted' : 'request_exception' });
      if (isAbortError(e)) {
        logProviderOutcome('gemini', 'timeout', { reason: 'aborted' });
        logEvent({ provider: 'gemini', eventType: 'timeout', correlationId, durationMs: null, fallbackAttempted: false, errorCategory: 'timeout_aborted' });
      } else {
        logProviderFailure({ provider: 'gemini', error: e });
        logEvent({ provider: 'gemini', eventType: 'http_failure', correlationId, durationMs: null, fallbackAttempted: false, errorCategory: 'UNKNOWN_ERROR' });
      }
    }
  } else if (geminiKey) {
    providerFailures.push({ provider: 'gemini', status: 429, reason: 'rate_limited', retryAfterSeconds: geminiCooldownSeconds });
    logProviderOutcome('gemini', 'skipped', { reason: 'cooldown_active', retryAfterSeconds: geminiCooldownSeconds });
  } else {
    providerFailures.push({ provider: 'gemini', status: null, reason: 'missing_api_key' });
    logProviderOutcome('gemini', 'skipped', { reason: 'missing_api_key' });
  }

  if (!finalAnswer && tavilyAnswer.trim() && isTavilyRelevant(tavilyAnswer, tavilySources) && needsTavily) {
    finalAnswer = tavilyAnswer.trim();
    return NextResponse.json({ answer: finalAnswer, sources: finalSources, provider: 'tavily' }, { status: 200 });
  }

  logEvent({ provider: 'system', eventType: 'final_result', correlationId, durationMs: null, fallbackAttempted: !geminiUsed ? true : false, status: finalAnswer ? 200 : 502 });

  // --- Internal provider search fallback (Stage 1) ---
  // When the AI provider is unavailable and the user asks about services/professionals,
  // search registered Trust Connect providers via existing backend API.
  if (!finalAnswer && serviceOrTradeTerms.test(lowerQ) && canAttempt(3000)) {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const providerRes = await fetch(`${apiBase}/providers`, { signal: AbortSignal.any([AbortSignal.timeout(3000), deadlineController.signal]) });
      if (providerRes.ok) {
        const providerData = await providerRes.json();
        const all = Array.isArray(providerData.providers) ? providerData.providers : [];
        // Filter by service match (safe, from real DB only)
        const terms = ['plumber','electrician','cleaner','mechanic','carpenter','gardener','painter','security','hvac','appliance','tiling','masonry'];
        const matched = all.filter(p => {
          const text = `${p.businessName || ''} ${p.specialty || ''} ${Array.isArray(p.services) ? p.services.join(' ') : ''}`.toLowerCase();
          return terms.some(t => text.includes(t));
        });
        const results = matched.length ? matched : all.slice(0, 5);
        if (results.length > 0) {
          const lines = results.map((p, i) => {
            const name = p.businessName || 'Registered provider';
            const spec = p.specialty || 'Service provider';
            const loc = p.location || 'Zimbabwe';
            const rate = typeof p.hourlyRate === 'number' ? `Rate: $${p.hourlyRate}` : '';
            const bio = (p.bio || '').trim().substring(0, 120);
            return `${i + 1}. ${name} — ${spec} (${loc})${rate ? '; ' + rate : ''}${bio ? ' — ' + bio : ''}`;
          });
          finalAnswer = `Available Trust Connect providers for your request:\n\n${lines.join('\n')}`;
          logProviderOutcome('provider_fallback', 'succeeded', { count: results.length, source: 'database' });
          logEvent({ provider: 'provider_fallback', eventType: 'success', correlationId, durationMs: null, fallbackAttempted: !geminiUsed ? true : false, status: 200 });
        } else {
          finalAnswer = 'No matching registered provider was found for your request. Try checking our Services page or contact support.';
        }
      }
    } catch (e) {
      // Provider API unreachable; provide deterministic local service response when user asks about trades/services
      logProviderOutcome('provider_fallback', 'skipped', { reason: 'api_unreachable' });
      if (serviceOrTradeTerms.test(lowerQ)) {
        finalAnswer = `Trust Connect connects you with verified local professionals including electricians, plumbers, mechanics, cleaners, painters, gardeners, appliance repair specialists, HVAC technicians, security installers, and general handymen. ` +
          `Browse available services and compare reviews through our Services page, or ask for more details about a specific trade.`;
      }
    }
  }

  // When budget is exhausted before provider lookup, still return service-category answer
  if (!finalAnswer && serviceOrTradeTerms.test(lowerQ) && !canAttempt(3000)) {
    finalAnswer = `Trust Connect connects you with verified local professionals including electricians, plumbers, mechanics, cleaners, painters, gardeners, appliance repair specialists, HVAC technicians, security installers, and general handymen. ` +
      `Browse available services and compare reviews through our Services page, or ask for more details about a specific trade.`;
  }

  // Deterministic fallback for general service / category / platform questions when AI unavailable
  if (!finalAnswer && generalServiceOrPlatformTerms.test(lowerQ)) {
    const isHelpQuery = /\b(what can you (help|do)|how (can|does) (it|this|trust connect) work)\b/i.test(lowerQ);
    const greetingPrefix = /^(hello|hi|hie|hey|greetings|good morning|good afternoon|good evening)\b/i.test(lowerQ)
      ? "Hello! "
      : "";
    const header = isHelpQuery
      ? `${greetingPrefix}I can help you find verified professionals, explore service categories, and learn how to book services on Trust Connect.\n\n`
      : `${greetingPrefix}Trust Connect is a service-provider booking platform where you can discover, review, and book verified local professionals.\n\n`;

    finalAnswer = `${header}Available service categories include:\n` +
      `• Electricians, Plumbers, Mechanics, Cleaners, Painters\n` +
      `• Carpenters, Gardeners, Appliance Repair, Air Conditioning (HVAC)\n` +
      `• Security Installation, CCTV, Solar Installation, IT Support\n` +
      `• General Handyman, Pest Control\n\n` +
      `You can browse providers by specialty, compare reviews, and book services directly through our Services page.`;
    logProviderOutcome('platform_fallback', 'succeeded', { source: 'tc_domain' });
    logEvent({ provider: 'platform_fallback', eventType: 'success', correlationId, durationMs: null, fallbackAttempted: !geminiUsed ? true : false, status: 200 });
  }

  if (!finalAnswer) {
    const failures = providerFailures || [];
    const safeFailures = failures.map(f => ({
      provider: f.provider,
      status: f.status || null,
      reason: f.reason || f.errorCategory || 'unavailable'
    }));
    const temporaryReasons = ['rate_limited', 'provider_at_capacity', 'timeout_aborted', 'service_unavailable'];
    const temporaryStatuses = [429, 503, 502, 504, 500];
    const isTemporaryFailure = (f) => temporaryReasons.includes(f.reason) || temporaryStatuses.includes(f.status);
    const allTemporary = failures.length > 0 && failures.every(isTemporaryFailure);
    const allUnavailable = failures.some(f => f.provider === 'gemini');
    console.error(`[CHAT_ERROR] Fallback exhausted: ${JSON.stringify(safeFailures)}`);
    return NextResponse.json({
      error: (allTemporary && allUnavailable)
        ? 'The AI assistant is temporarily busy. Please try again later.'
        : 'The AI assistant is temporarily unavailable. Please check your configuration or try again later.',
      provider: null,
    }, { status: (allTemporary && allUnavailable) ? 503 : 502 });
  }

  // Include Tavily sources only when relevant research was actually given to Gemini
  const answerSources = (geminiUsed && tavilyUsed) ? finalSources : [];
  return NextResponse.json({ answer: finalAnswer.trim(), sources: answerSources, provider: geminiUsed ? 'gemini' : 'provider_fallback' }, { status: 200 });
  } finally { clearTimeout(deadlineTimer); }
}
