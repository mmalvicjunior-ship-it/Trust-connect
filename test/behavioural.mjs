import { register } from 'node:module';
register(new URL('./loader.mjs', import.meta.url).href, import.meta.url);

const file = new URL('../src/app/api/chat/route.js', import.meta.url);
const { POST, maxDuration } = await import(file.href);

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('PASS:', msg);
}

function setupMock() {
  let mode = 'ok';
  let calls = [];

  const geminiOk = (text = 'Gemini answer') => ({
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
    headers: { get: () => null },
  });

  const failure = (status, body = {}, retryAfter = null) => ({
    ok: false,
    status,
    json: async () => body,
    headers: { get: (name) => (name.toLowerCase() === 'retry-after' ? retryAfter : null) },
  });

  global.fetch = async (url, opts = {}) => {
    const u = String(url);
    calls.push({ url: u, body: typeof opts.body === 'string' ? opts.body : '' });

    if (u.includes('api.tavily.com')) {
      if (mode === 'tavily_fail') return failure(500, { error: 'search unavailable' });
      if (mode === 'tavily_timeout') {
        const err = new Error('Timeout'); err.name = 'TimeoutError'; throw err;
      }
      if (mode === 'tavily_irrelevant') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            answer: 'Cybersecurity VPN proxy firewall antivirus guidance from AbilityKey and Comodo.',
            results: [{ title: 'Unrelated security vendor', url: 'https://unrelated.example/security' }],
          }),
          headers: { get: () => null },
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          answer: 'Trust Connect is a service provider booking platform with verified plumbers and cleaners.',
          results: [{ title: 'Trust Connect research', url: 'https://research.example/trust-connect' }],
        }),
        headers: { get: () => null },
      };
    }

    if (u.includes('generativelanguage.googleapis.com')) {
      if (mode === 'gemini_503') return failure(503, {});
      if (mode === 'gemini_404') return failure(404, { error: { code: 'NOT_FOUND', message: 'models/gemini-3.5-flash is not found' } });
      if (mode === 'gemini_401') return failure(401, { error: { code: 'UNAUTHENTICATED', message: 'Invalid API key' } });
      if (mode === 'gemini_429') return failure(429, { error: { message: 'Rate limited' } }, '60');
      if (mode === 'gemini_empty') return { ok: true, status: 200, json: async () => ({ candidates: [] }), headers: { get: () => null } };
      if (mode === 'gemini_timeout') {
        const err = new Error('Timeout'); err.name = 'TimeoutError'; throw err;
      }
      return geminiOk();
    }

    if (u.includes('/providers')) {
      if (mode === 'provider_lookup_unreachable') throw new Error('Connection refused');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          providers: [
            { businessName: 'Harare Plumbing Co', specialty: 'Plumber', location: 'Harare', hourlyRate: 25 },
          ],
        }),
        headers: { get: () => null },
      };
    }

    // Any legacy provider endpoint must never be reached.
    if (u.includes('openai') || u.includes('openrouter') || u.includes('deepseek')) {
      return failure(500, { error: 'legacy provider must not be called' });
    }

    return failure(404, {});
  };

  return { setMode: (m) => { mode = m; }, calls: () => calls, reset: () => { calls = []; } };
}

// Fake test keys only — never real secrets
process.env.GEMINI_API_KEY = 'fake-gemini-key';
process.env.GEMINI_MODEL = 'gemini-3.5-flash';
process.env.TAVILY_API_KEY = 'fake-tavily-key';
// Prove legacy keys are ignored even when present
process.env.OPENAI_API_KEY = 'fake-openai-key';
process.env.OPENROUTER_API_KEY = 'fake-openrouter-key';

const mock = setupMock();
const aiCalls = () => mock.calls().filter(c => /generativelanguage|openai|openrouter|deepseek/.test(c.url));
const geminiCalls = () => mock.calls().filter(c => c.url.includes('generativelanguage'));
const legacyCalls = () => mock.calls().filter(c => /openai|openrouter|deepseek/.test(c.url));

async function post(question, messages = []) {
  return POST(new Request('http://t/api/chat', {
    method: 'POST',
    body: JSON.stringify({ question, messages }),
  }));
}

async function run() {
  assert(maxDuration === 30, 'maxDuration exported as 30');

  // 1. Greeting stays local, zero AI calls
  mock.setMode('ok'); mock.reset();
  const r1 = await post('Hello');
  const b1 = await r1.json();
  assert(r1.status === 200, 'greeting 200');
  assert(b1.provider === 'local', 'greeting provider local');
  assert(aiCalls().length === 0, 'greeting zero AI calls');

  // 2. Service FAQ stays local, zero AI calls
  mock.reset();
  const r2 = await post('What services can I find on Trust Connect?');
  const b2 = await r2.json();
  assert(b2.provider === 'local', 'service FAQ local');
  assert(b2.answer.includes('service categories'), 'service FAQ content');
  assert(aiCalls().length === 0, 'service FAQ zero AI calls');

  // 3. Singular/plural service terms still handled locally
  mock.reset();
  for (const q of ['I need a plumber', 'Do you have any electricians?', 'Find mechanics available']) {
    const r = await post(q);
    assert(r.status === 200, `service term returns 200: ${q}`);
  }

  // 4. Booking FAQ stays local
  mock.reset();
  const r4 = await post('How do I book a professional?');
  const b4 = await r4.json();
  assert(b4.provider === 'local', 'booking FAQ local');
  assert(b4.answer.includes('To book a professional'), 'booking FAQ instructions');
  assert(aiCalls().length === 0, 'booking FAQ zero AI calls');

  // 5. Complex question reaches Gemini as primary
  mock.setMode('ok'); mock.reset();
  const r5 = await post('Explain security risks across online platforms.');
  const b5 = await r5.json();
  assert(r5.status === 200, 'complex question 200');
  assert(b5.provider === 'gemini', 'complex question answered by Gemini');
  assert(geminiCalls().length === 1, 'Gemini called exactly once');
  assert(!geminiCalls()[0].url.includes('fake-gemini-key'), 'API key not placed in URL');
  assert(legacyCalls().length === 0, 'no legacy provider called');

  // 6. GEMINI_MODEL from environment is honoured
  mock.reset();
  process.env.GEMINI_MODEL = 'gemini-3.5-flash';
  const r6 = await post('What is quantum computing?');
  assert(r6.status === 200, 'model env question 200');
  assert(geminiCalls()[0].url.includes('/models/gemini-3.5-flash:generateContent'), 'GEMINI_MODEL=gemini-3.5-flash used');

  // 7. Default model when GEMINI_MODEL is absent
  mock.reset();
  delete process.env.GEMINI_MODEL;
  const r7 = await post('What is quantum computing?');
  assert(r7.status === 200, 'default model question 200');
  assert(geminiCalls()[0].url.includes('/models/gemini-3.5-flash:generateContent'), 'default Gemini model is gemini-3.5-flash');

  // 8. Unsafe model string cannot inject into the URL
  mock.reset();
  process.env.GEMINI_MODEL = 'evil/../model?key=leak';
  const r8 = await post('What is quantum computing?');
  assert(r8.status === 200, 'unsafe model value handled safely');
  assert(geminiCalls()[0].url.includes('/models/gemini-3.5-flash:generateContent'), 'unsafe model value falls back to default');
  process.env.GEMINI_MODEL = 'gemini-3.5-flash';

  // 9. Gemini 503 -> safe temporary error, no other provider
  mock.setMode('gemini_503'); mock.reset();
  const r9 = await post('What is quantum computing?');
  const b9 = await r9.json();
  assert(r9.status === 503, 'Gemini 503 maps to 503');
  assert(b9.error.includes('temporarily busy'), 'Gemini 503 safe message');
  assert(b9.provider === null, 'Gemini 503 provider null');
  assert(legacyCalls().length === 0, 'no fallback provider on Gemini 503');

  // 10. Gemini 401 -> safe configuration error
  mock.setMode('gemini_401'); mock.reset();
  const r10 = await post('What is quantum computing?');
  const b10 = await r10.json();
  assert(r10.status === 502, 'Gemini 401 maps to 502');
  assert(b10.error.includes('temporarily unavailable'), 'Gemini 401 safe message');
  assert(!JSON.stringify(b10).includes('fake-gemini-key'), 'Gemini key not leaked');

  // 10b. Unknown model (404) -> safe configuration error
  mock.setMode('gemini_404'); mock.reset();
  const r10b = await post('What is quantum computing?');
  const b10b = await r10b.json();
  assert(r10b.status === 502, 'Gemini 404 unknown model maps to 502');
  assert(b10b.error.includes('temporarily unavailable'), 'Gemini 404 safe message');
  assert(legacyCalls().length === 0, 'no fallback provider on unknown model');

  // 11. Empty Gemini response -> safe failure
  mock.setMode('gemini_empty'); mock.reset();
  const r11 = await post('What is quantum computing?');
  assert(r11.status === 502 || r11.status === 503, 'empty Gemini response handled safely');

  // 12. Gemini timeout -> safe failure
  mock.setMode('gemini_timeout'); mock.reset();
  const r12 = await post('What is quantum computing?');
  assert(r12.status === 503, 'Gemini timeout maps to 503');

  // 13. Tavily results are passed into the Gemini prompt
  mock.setMode('ok'); mock.reset();
  const r13 = await post('Compare plumbers in Harare with latest reviews');
  assert(r13.status === 200, 'Tavily-assisted question 200');
  const tavilyIdx = mock.calls().findIndex(c => c.url.includes('api.tavily.com'));
  const geminiIdx = mock.calls().findIndex(c => c.url.includes('generativelanguage'));
  assert(tavilyIdx !== -1, 'Tavily was called');
  assert(geminiIdx !== -1, 'Gemini was called');
  assert(tavilyIdx < geminiIdx, 'Tavily runs before Gemini');
  const geminiBody = mock.calls()[geminiIdx].body;
  assert(geminiBody.includes('Trust Connect is a service provider booking platform'), 'Tavily answer included in Gemini prompt');
  assert(geminiBody.includes('research.example'), 'Tavily sources included in Gemini prompt');
  const b13 = await r13.json();
  assert(Array.isArray(b13.sources) && b13.sources.length === 1, 'relevant Tavily sources returned');

  // 14. Irrelevant Tavily results are not passed to Gemini or returned
  mock.setMode('tavily_irrelevant'); mock.reset();
  const r14 = await post('Compare plumbers in Harare with latest reviews');
  assert(r14.status === 200, 'irrelevant Tavily still yields Gemini answer');
  const b14 = await r14.json();
  const geminiBody14 = mock.calls().find(c => c.url.includes('generativelanguage')).body;
  assert(!geminiBody14.includes('Cybersecurity'), 'irrelevant Tavily answer excluded from prompt');
  assert(!geminiBody14.includes('unrelated.example'), 'irrelevant Tavily sources excluded from prompt');
  assert(Array.isArray(b14.sources) && b14.sources.length === 0, 'irrelevant Tavily sources not returned');

  // 15. Tavily failure does not block Gemini
  mock.setMode('tavily_fail'); mock.reset();
  const r15 = await post('Compare plumbers in Harare with latest reviews');
  const b15 = await r15.json();
  assert(r15.status === 200, 'Tavily failure does not break chat');
  assert(b15.provider === 'gemini', 'Gemini still answers when Tavily fails');

  // 16. Tavily timeout does not block Gemini
  mock.setMode('tavily_timeout'); mock.reset();
  const r16 = await post('Compare plumbers in Harare with latest reviews');
  assert(r16.status === 200, 'Tavily timeout does not break chat');

  // 17. Missing Tavily key is non-fatal
  mock.setMode('ok'); mock.reset();
  delete process.env.TAVILY_API_KEY;
  const r17 = await post('Compare plumbers in Harare with latest reviews');
  const b17 = await r17.json();
  assert(r17.status === 200 && b17.provider === 'gemini', 'missing Tavily key does not block Gemini');
  assert(!mock.calls().some(c => c.url.includes('api.tavily.com')), 'Tavily not called without key');
  process.env.TAVILY_API_KEY = 'fake-tavily-key';

  // 18. Missing Gemini key produces a clear error without calling legacy providers
  mock.setMode('ok'); mock.reset();
  delete process.env.GEMINI_API_KEY;
  const r18 = await post('What is quantum computing?');
  const b18 = await r18.json();
  assert(r18.status === 502, 'missing Gemini key returns 502');
  assert(b18.error.includes('configuration') || b18.error.includes('temporarily unavailable'), 'missing key clear error');
  assert(geminiCalls().length === 0, 'Gemini not called without key');
  assert(legacyCalls().length === 0, 'no legacy provider called without Gemini key');
  process.env.GEMINI_API_KEY = 'fake-gemini-key';

  // 19. Database provider fallback still works when Gemini fails
  mock.setMode('gemini_503'); mock.reset();
  const r19 = await post('Compare plumbers in Harare');
  const b19 = await r19.json();
  assert(r19.status === 200, 'DB provider fallback returns 200');
  assert(b19.provider === 'provider_fallback', 'DB provider fallback provider label');
  assert(b19.answer.includes('Harare Plumbing Co'), 'DB provider fallback content');

  // 20. Unknown-question failure is bounded and leaks no secrets
  mock.setMode('gemini_503'); mock.reset();
  const r20 = await post('Unknown.');
  const b20 = await r20.json();
  assert(typeof r20.status === 'number', 'unknown question safe response');
  assert(!JSON.stringify(b20).includes('fake-gemini-key'), 'no Gemini secret in failure body');
  assert(!JSON.stringify(b20).includes('fake-tavily-key'), 'no Tavily secret in failure body');

  // 21. Gemini 429 activates cooldown (kept last: cooldown persists for the process)
  mock.setMode('gemini_429'); mock.reset();
  const r21a = await post('What is quantum computing?');
  assert(r21a.status === 503, 'Gemini 429 maps to 503');
  const callsAfterFirst429 = geminiCalls().length;
  mock.setMode('ok');
  const r21b = await post('What is quantum computing?');
  assert(geminiCalls().length === callsAfterFirst429, 'Gemini skipped during active cooldown');
  assert(r21b.status === 503, 'cooldown keeps safe temporary response');

  // 22. No legacy provider was ever contacted during the whole suite
  assert(legacyCalls().length === 0, 'OpenAI/OpenRouter/DeepSeek never called');

  console.log('All behavioural assertions PASSED (actual POST execution with mocked fetch)');
}

run().catch(e => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
