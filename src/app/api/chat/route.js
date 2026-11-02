import { NextResponse } from 'next/server';
import { logEvent } from '../../../lib/diagnostics.js';

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
  if (provider === 'openrouter' && errorCode === 'OPENROUTER_FREE_TIER_DAILY') return 'openrouter_free_tier_daily';
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

const recordProviderCooldown = (provider, response, errorBody, now = Date.now()) => {
  const retryAfterMs = parseRetryAfterMs(response?.headers, now);
  const errorCode = sanitizeDiagnosticCode(errorBody?.error?.code || errorBody?.code);
  let durationMs = retryAfterMs;

  if (durationMs === null && provider === 'openrouter' && errorCode === 'OPENROUTER_FREE_TIER_DAILY') {
    durationMs = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate() + 1) - now;
  }
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

const getSafeOpenRouterMetadata = (metadata = {}) => {
  const safe = {};
  for (const name of ['error_type', 'provider_code', 'limit_source', 'reason']) {
    const value = sanitizeDiagnosticCode(metadata[name]);
    if (value) safe[name] = value;
  }
  return safe;
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
    logProviderOutcome('openrouter', 'skipped', { reason: 'not_reached' });
    return NextResponse.json({ answer: "Hi! I'm doing well, thanks for asking. How are you doing today?", sources: [], provider: 'local' }, { status: 200 });
  }

  // Keep only brief courtesy and farewell replies local.
  const isConv = /^(thank you|thanks|thank you very much|goodbye|bye|see you)[.!?]*$/i.test(lowerQ);
  if (isConv) {
    logProviderOutcome('gemini', 'skipped', { reason: 'not_reached' });
    logProviderOutcome('openrouter', 'skipped', { reason: 'not_reached' });
    return NextResponse.json({ answer: "Of course! Go ahead and ask me anything. I'm here to help.", sources: [], provider: 'local' }, { status: 200 });
  }

  // --- Determine if web search (Tavily) needed ---
  const serviceOrTradeTerms = /\b(plumber|electrician|cleaner|painter|carpenter|gardener|pest|security|hvac|mechanic|car repair|appliance|tiling|masonry)\b/i;
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
    } else try {
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tavilyKey}` },
        body: JSON.stringify({ query: queryText, search_depth: 'advanced', include_answer: true, include_raw_content: false, max_results: 6 }),
        signal: AbortSignal.timeout(15000),
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
      providerFailures.push({ provider: 'tavily', status: null, reason: 'request_exception' });
      logProviderOutcome('tavily', 'failed', { errorCategory: classifyProviderMessage(e?.message) });
    }
  }

  // --- Gemini (primary) ---
  const geminiKey = process.env.GEMINI_API_KEY;
  let geminiUsed = false;
  let finalAnswer = '';
  let finalSources = tavilySources;
  const geminiCooldownSeconds = geminiKey ? getProviderCooldownSeconds('gemini') : 0;

  if (geminiKey && geminiCooldownSeconds === 0) {
    logProviderOutcome('gemini', 'attempted');
    logEvent({ provider: 'gemini', eventType: 'attempt_started', correlationId });
    try {
      const geminiModel = 'gemini-3.8-flash';
      const promptParts = [{ text: `You are Trust Connect AI. Be helpful, accurate, and concise.\n${TC_DOMAIN}` }];
      const tavilyRelevant = tavilyAnswer && isTavilyRelevant(tavilyAnswer, tavilySources);
      if (tavilyAnswer.trim() && !tavilyRelevant) {
        logEvent({ provider: 'tavily', eventType: 'rejected_irrelevant', correlationId, durationMs: null, fallbackAttempted: null });
      }
      if (tavilySources.length > 0 && tavilyAnswer && tavilyRelevant) {
        const citations = tavilySources.map((s, i) => `[${i + 1}] ${s.title || s.url}: ${s.url}`).join('\n');
        promptParts.push({ text: `Recent conversation:\n${context ? context + '\n\n' : ''}The user asked: ${question}\n\nExternal research results (with citations):\n${tavilyAnswer}\n\nSources:\n${citations}\n\nAnswer the user's question using the conversation and research. Include citations where relevant.` });
      } else if (context) {
        promptParts.push({ text: `Recent conversation:\n${context}\n\nLatest user message: ${question}\nAnswer clearly and use the conversation history to resolve follow-up references.` });
      } else {
        promptParts.push({ text: `User asks: ${question}\nAnswer clearly.` });
      }
      let retryCount = 0;
      const maxRetries = 1; // strict limit: one retry for temporary failures
      let geminiRes = null;
      let retryDueToTemp = false;
      while (retryCount <= maxRetries) {
        geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          body: JSON.stringify({ contents: [{ role: 'user', parts: promptParts }], generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } }),
          signal: AbortSignal.timeout(parseInt(process.env.GEMINI_TIMEOUT_MS || '90000', 10)),
        });
        if (geminiRes.ok) break;
        const isTemporary = [503, 502, 504, 500].includes(geminiRes.status);
        if (isTemporary && retryCount < maxRetries) {
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
          ? recordProviderCooldown('gemini', geminiRes, errorBody)
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
      providerFailures.push({ provider: 'gemini', status: null, reason: 'request_exception' });
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

  // --- OpenRouter fallback (fixed free model; only after Gemini did not generate an answer) ---
  const openRouterModel = 'google/gemma-4-26b-a4b-it:free';
  if (!geminiUsed) {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openRouterCooldownSeconds = openRouterKey ? getProviderCooldownSeconds('openrouter') : 0;
    if (openRouterKey && openRouterCooldownSeconds === 0) {
      logProviderOutcome('openrouter', 'attempted');
      logEvent({ provider: 'openrouter', eventType: 'attempt_started', correlationId, durationMs: null, fallbackAttempted: !geminiUsed });
      try {
        const historyPrompt = context ? `Recent conversation:\n${context}\n\n` : '';
        const orPrompt = tavilySources.length > 0 && tavilyAnswer
          ? `${historyPrompt}User asks: ${question}\n\nExternal research:\n${tavilyAnswer}\nSources: ${tavilySources.map((s,i)=>`[${i+1}] ${s.title}`).join(', ')}\n\nAnswer the user's question using the conversation and research. Include citations where relevant.`
          : `${historyPrompt}Latest user message: ${question}\nAnswer clearly and use the conversation history to resolve follow-up references.`;
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openRouterKey}` },
          body: JSON.stringify({ model: openRouterModel.trim(), messages: [{ role: 'user', content: orPrompt }], max_tokens: 1024, temperature: 0.7 }),
        });
        if (orRes.ok) {
          const orData = await orRes.json();
          const content = orData.choices?.[0]?.message?.content;
          const msg = typeof content === 'string'
            ? content.trim()
            : Array.isArray(content)
              ? content.map((part) => part.text || '').join('').trim()
              : '';
          if (msg.length > 0) {
            finalAnswer = msg;
            logProviderOutcome('openrouter', 'succeeded');
            logEvent({ provider: 'openrouter', eventType: 'success', status: orRes.status, correlationId, durationMs: null, fallbackAttempted: true });
          } else {
            providerFailures.push({ provider: 'openrouter', status: orRes.status, reason: 'empty_response' });
            logProviderFailure({
              provider: 'openrouter',
              response: orRes,
              errorBody: { error: { code: 'EMPTY_RESPONSE', message: 'Empty provider response' } },
            });
          }
        } else {
          const errorBody = await readProviderError(orRes);
          const retryAfterSeconds = orRes.status === 429
            ? recordProviderCooldown('openrouter', orRes, errorBody)
            : null;
          const errorCode = sanitizeDiagnosticCode(errorBody?.error?.code || errorBody?.code);
          providerFailures.push({
            provider: 'openrouter',
            status: orRes.status,
            reason: errorCode === 'OPENROUTER_FREE_TIER_DAILY'
              ? 'free_tier_daily_limit'
              : orRes.status === 429 ? 'rate_limited' : 'http_error',
            ...(retryAfterSeconds === null ? {} : { retryAfterSeconds }),
          });
          logProviderFailure({ provider: 'openrouter', response: orRes, errorBody, retryAfterSeconds });
          logEvent({ provider: 'openrouter', eventType: 'http_failure', status: orRes.status, errorCategory: classifyProviderFailure('openrouter', orRes.status, sanitizeDiagnosticCode(errorBody?.error?.code || errorBody?.code || null), errorBody?.error?.message || ''), correlationId, durationMs: null, fallbackAttempted: true });
        }
      } catch (e) {
        providerFailures.push({ provider: 'openrouter', status: null, reason: 'request_exception' });
        if (isAbortError(e)) {
          logProviderOutcome('openrouter', 'timeout', { reason: 'aborted' });
          logEvent({ provider: 'openrouter', eventType: 'timeout', correlationId, durationMs: null, fallbackAttempted: true });
        } else {
          logProviderFailure({ provider: 'openrouter', error: e });
        }
      }
    } else if (openRouterKey) {
      providerFailures.push({ provider: 'openrouter', status: 429, reason: 'rate_limited', retryAfterSeconds: openRouterCooldownSeconds });
      logProviderOutcome('openrouter', 'skipped', { reason: 'cooldown_active', retryAfterSeconds: openRouterCooldownSeconds });
    } else {
      providerFailures.push({ provider: 'openrouter', status: null, reason: 'missing_api_key' });
      logProviderOutcome('openrouter', 'skipped', { reason: 'missing_api_key' });
    }
  } else {
    logProviderOutcome('openrouter', 'skipped', { reason: 'not_reached' });
  }

  if (!finalAnswer && tavilyAnswer.trim() && isTavilyRelevant(tavilyAnswer, tavilySources) && needsTavily) {
    finalAnswer = tavilyAnswer.trim();
    return NextResponse.json({ answer: finalAnswer, sources: finalSources, provider: 'tavily' }, { status: 200 });
  }

  logEvent({ provider: 'system', eventType: 'final_result', correlationId, durationMs: null, fallbackAttempted: !geminiUsed ? true : false, status: finalAnswer ? 200 : 502 });

  if (!finalAnswer) {
    const bothUnavailable = providerFailures.some(f => f.provider === 'gemini') && providerFailures.some(f => f.provider === 'openrouter');
    return NextResponse.json({
      error: bothUnavailable
        ? 'Both AI providers are temporarily busy. Please try again later.'
        : 'The AI assistant is temporarily unavailable. Please try again later.',
      provider: null,
    }, { status: bothUnavailable ? 503 : 502 });
  }

  return NextResponse.json({ answer: finalAnswer, sources: finalSources, provider: geminiUsed ? 'gemini' : 'openrouter' }, { status: 200 });
}
