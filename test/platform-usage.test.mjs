import { register } from 'node:module';
register(new URL('./loader.mjs', import.meta.url).href, import.meta.url);
process.env.GEMINI_API_KEY = 'test-key';
process.env.TAVILY_API_KEY = '';

const file = new URL('../src/app/api/chat/route.js', import.meta.url);
const { POST } = await import(file.href);

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('PASS:', msg);
}

let geminiCalls = 0;
global.fetch = async (url) => {
  if (String(url).includes('generativelanguage.googleapis.com')) {
    geminiCalls += 1;
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Gemini answer' }] } }] }), headers: { get: () => null } };
  }
  return { ok: false, status: 404, json: async () => ({}), headers: { get: () => null } };
};

const post = async (question, messages = []) => {
  const res = await POST({ json: async () => ({ question, messages }) });
  return { status: res.status, body: await res.json() };
};

// 1-4. Platform-usage phrasings answered locally, Gemini never called
for (const q of [
  'How do I use this application?',
  'How do I use this website?',
  'How can I use this platform?',
  'How do I use the app?',
]) {
  const before = geminiCalls;
  const { status, body } = await post(q, []);
  assert(status === 200, `local 200 for: ${q}`);
  assert(body.provider === 'local', `provider=local for: ${q}`);
  assert(geminiCalls === before, `Gemini NOT called for: ${q}`);
  assert(/service-provider booking platform|verified local professionals/i.test(body.answer), `TC local answer for: ${q}`);
}

// 4. Platform-usage phrasings return the 7-step customer journey locally
{
  const before = geminiCalls;
  const { status, body } = await post('How do I use this application?', []);
  assert(status === 200 && body.provider === 'local', 'platform-usage answered locally');
  assert(geminiCalls === before, 'Gemini NOT called for platform-usage');
  for (const step of ['Create an account or sign in', 'Browse service categories', 'Find a provider', 'Review provider details', 'Submit a booking', "provider's response", 'Track your booking status']) {
    assert(body.answer.includes(step), 'journey step present: ' + step);
  }
}

// 5. Existing plumber question still answered locally
{
  const before = geminiCalls;
  const { status, body } = await post('How can I find a plumber?', []);
  assert(status === 200 && body.provider === 'local', 'plumber question still local');
  assert(geminiCalls === before, 'Gemini NOT called for plumber question');
}

// 6. Follow-up sequence: plumber then platform-usage (with history) stays local
{
  const before = geminiCalls;
  const history = [
    { role: 'assistant', text: 'Hello! How can I help?' },
    { role: 'user', text: 'How can I find a plumber?' },
    { role: 'assistant', text: 'Trust Connect connects you with verified local professionals.', provider: 'local' },
  ];
  const { status, body } = await post('How do I use this application?', history);
  assert(status === 200 && body.provider === 'local', 'follow-up platform-usage answered locally with history');
  assert(geminiCalls === before, 'Gemini NOT called for follow-up');
}

// 7. Unrelated general question still follows the AI route (Gemini called)
{
  const before = geminiCalls;
  const { status, body } = await post('What is the capital of France?', []);
  assert(status === 200 && body.provider === 'gemini', 'unrelated question reaches Gemini');
  assert(geminiCalls === before + 1, 'Gemini called exactly once for unrelated question');
}

console.log('All platform-usage assertions PASSED');
