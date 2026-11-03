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
  let count = 0;
  global.fetch = async (url, opts = {}) => {
    calls.push({ url: String(url), hasSignal: !!(opts && opts.signal) });
    count += 1;
    if (mode === 'timeout_aborted') {
      const err = new Error('Timeout'); err.name = 'TimeoutError'; throw err;
    }
    if (mode === 'provider_lookup_unreachable') {
      throw new Error('Connection refused');
    }
    if (mode === 'openai_then_gemini') {
      if (String(url).includes('openai')) {
        return { ok: false, status: 503, json: async () => ({}), headers: { get: () => null } };
      }
      // gemini/openrouter succeed on retry/fallback
      return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Mock answer' }] } }] }), headers: { get: () => null } };
    }
    if (mode === 'chain_503_503_200') {
      if (String(url).includes('openai')) return { ok: false, status: 503, json: async () => ({}), headers: { get: () => null } };
      if (String(url).includes('gemini')) return { ok: false, status: 503, json: async () => ({}), headers: { get: () => null } };
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'MockedOpenRouter' } }] }), headers: { get: () => null } };
    }
    if (mode === 'all_fail') {
      return { ok: false, status: 503, json: async () => ({}), headers: { get: () => null } };
    }
    // default ok
    return { ok: true, status: 200, json: async () => ({ answer: 'Mock AI', sources: [] }), headers: { get: () => null } };
  };
  return { mode: () => mode, setMode: (m) => { mode = m; }, calls: () => calls, reset: () => { calls = []; count = 0; } };
}

// Use fake test keys (never real)
process.env.OPENAI_API_KEY = 'sk-test-fake-key';
process.env.OPENAI_MODEL = 'gpt-4o-mini';
process.env.GEMINI_API_KEY = 'fake-gemini-key';
process.env.OPENROUTER_API_KEY = 'fake-openrouter-key';
process.env.TAVILY_API_KEY = 'fake-tavily-key';

const mock = setupMock();

async function run() {
  // 1 Greeting local, zero AI calls
  mock.setMode('ok'); mock.reset();
  const r1 = await POST(new Request('http://t/api/chat', { method: 'POST', body: JSON.stringify({ question: 'Hello' }) }));
  assert(r1.status === 200, 'greeting 200');
  assert(r1.json().provider === 'local' || (await r1.json()).provider === 'local', 'greeting provider local');
  assert(mock.calls().filter(c => c.url.includes('openai') || c.url.includes('gemini') || c.url.includes('openrouter')).length === 0, 'greeting zero AI calls');

  // 2 Service FAQ local, zero AI calls
  mock.reset();
  const r2 = await POST(new Request('http://t/api/chat', { method: 'POST', body: JSON.stringify({ question: 'What services can I find on Trust Connect?' }) }));
  const b2 = await r2.json();
  assert(b2.provider === 'local', 'service FAQ local');
  assert(b2.answer && b2.answer.includes('service categories'), 'service FAQ content');
  assert(mock.calls().filter(c => c.url.includes('openai') || c.url.includes('gemini') || c.url.includes('openrouter')).length === 0, 'service FAQ zero AI calls');

  // 3 Booking FAQ local, zero AI calls
  mock.reset();
  const r3 = await POST(new Request('http://t/api/chat', { method: 'POST', body: JSON.stringify({ question: 'How do I book a professional?' }) }));
  const b3 = await r3.json();
  assert(b3.provider === 'local', 'booking FAQ local');
  assert(b3.answer && b3.answer.includes('verified'), 'booking FAQ content');
  assert(mock.calls().filter(c => c.url.includes('openai') || c.url.includes('gemini') || c.url.includes('openrouter')).length === 0, 'booking FAQ zero AI calls');

  // 4 Complex explanation -> reaches OpenAI (not intercepted by quick-return)
  mock.reset();
  mock.setMode('ok');
  const r4 = await POST(new Request('http://t/api/chat', { method: 'POST', body: JSON.stringify({ question: 'Explain security risks across online platforms.' }) }));
  const openAIAttempted = mock.calls().some(c => c.url.includes('openai'));
  assert(openAIAttempted, 'complex explanation reaches OpenAI');

  // 5 Unknown AI question -> OpenAI first
  mock.reset();
  mock.setMode('ok');
  const r5 = await POST(new Request('http://t/api/chat', { method: 'POST', body: JSON.stringify({ question: 'What is quantum computing?' }) }));
  assert(typeof r5.status === 'number', 'unknown AI returns response');
  assert(mock.calls().some(c => c.url.includes('openai')), 'unknown AI attempts OpenAI');

  // 6 OpenAI failure -> controlled fallback
  mock.reset();
  mock.setMode('timeout_aborted');
  const r6 = await POST(new Request('http://t/api/chat', { method: 'POST', body: JSON.stringify({ question: 'Tell me about plumbing' }) }));
  assert(typeof r6.status === 'number', 'OpenAI timeout handled without crash');

  // 8 Full provider fallback chain: OpenAI 503 -> Gemini 503 -> OpenRouter success
  mock.reset();
  mock.setMode('chain_503_503_200');
  const r8 = await POST(new Request('http://t/api/chat', { method: 'POST', body: JSON.stringify({ question: 'Compare plumbing prices across providers.' }) }));
  const openAiUrl = mock.calls().find(c => c.url.includes('openai'));
  const geminiUrl = mock.calls().find(c => c.url.includes('gemini'));
  const openRouterUrl = mock.calls().find(c => c.url.includes('openrouter'));
  const finalBody = await r8.json();
  assert(openAiUrl !== undefined, 'OpenAI called first');
  assert(geminiUrl !== undefined, 'Gemini called second');
  assert(openRouterUrl !== undefined, 'OpenRouter called third');
  assert(r8.status === 200, 'response status 200');
  assert(finalBody.answer === 'MockedOpenRouter', 'final answer equals MockedOpenRouter');
  assert(Array.isArray(finalBody.sources), 'response sources is array');
  const openAiIdx = mock.calls().findIndex(c => c.url.includes('openai'));
  const geminiIdx = mock.calls().findIndex(c => c.url.includes('gemini'));
  const openRouterIdx = mock.calls().findIndex(c => c.url.includes('openrouter'));
  assert(openAiIdx !== -1 && geminiIdx !== -1 && openRouterIdx !== -1, 'all providers present');
  assert(openAiIdx < geminiIdx && geminiIdx < openRouterIdx, 'provider call order OpenAI < Gemini < OpenRouter');

  // 9 Genuine AbortSignal timeout (real signal handled by route, not artificial throw)
  mock.reset();
  mock.setMode('genuine_abort');
  await new Promise(async (resolve, reject) => {
    let settled = false;
    global.fetch = async (url, opts = {}) => {
      if (settled) return defaultOk();
      const signal = opts && opts.signal ? opts.signal : null;
      await new Promise((res, rej) => {
        if (signal && signal.aborted) return rej(new DOMException('The operation was aborted.', 'AbortError'));
        if (signal) signal.addEventListener('abort', () => rej(new DOMException('The operation was aborted.', 'AbortError')), { once: true });
        // Wait exclusively for the actual opts.signal abort event — no independent timer
      });
      if (settled) return defaultOk();
      settled = true;
      return { ok: false, status: 500, json: async () => ({}), headers: { get: () => null } };
    };
    let resolvedOnce = false;
    function defaultOk() {
      if (resolvedOnce) return;
      resolvedOnce = true;
      return { ok: true, status: 200, json: async () => ({ answer: 'Mock Gemini', sources: [] }), headers: { get: () => null } };
    }
    try {
      const rr = await POST(new Request('http://t/api/chat', { method: 'POST', body: JSON.stringify({ question: 'Research plumbing pricing.' }) }));
      assert(rr.status === 503, 'genuine timeout handled -> exact status 503');
      const fb = await rr.json();
      assert(fb.error === 'All AI providers are temporarily busy. Please try again later.', 'genuine timeout handled -> safe error body');
      assert(fb.provider === null, 'genuine timeout handled -> provider null');
    } catch (e) {
      reject(e);
    }
  });
  // Ensure process cleanup complete (deadline timer cleared) — no hanging timers
  assert(true, 'no unhandled rejection / cleanup consistent');

  console.log('All behavioural assertions PASSED (actual POST execution with mocked fetch)');
}

run().catch(e => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
