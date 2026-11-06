// Focused static verification for the Gemini + Tavily chat route — no paid requests
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/chat/route.js');
const code = fs.readFileSync(filePath, 'utf8');
let passed = 0, failed = 0;
function check(name, ok) { if (ok) { passed++; console.log('PASS:', name); } else { failed++; console.log('FAIL:', name); } }

check('maxDuration exported', /export const maxDuration = 30;/.test(code));
check('Gemini actual timeout computed', /geminiTimeoutMs = sanitizeTimeoutMs\(process\.env\.GEMINI_TIMEOUT_MS\) \|\| 8000/.test(code));
check('Gemini canAttempt uses geminiTimeoutMs', /canAttempt\(geminiTimeoutMs\)/.test(code));
check('GEMINI_MODEL is read', /process\.env\.GEMINI_MODEL/.test(code));
check('Default Gemini model is gemini-3.5-flash', /'gemini-3\.5-flash'/.test(code));
check('Old hardcoded Gemini model removed', !/gemini-3\.8-flash/.test(code));
check('Gemini uses GEMINI_API_KEY', /process\.env\.GEMINI_API_KEY/.test(code));
check('Gemini key sent via x-goog-api-key header', /'x-goog-api-key': geminiKey/.test(code));
check('No OpenAI integration remains', !/openai/i.test(code));
check('No OpenRouter integration remains', !/openrouter/i.test(code));
check('No DeepSeek integration remains', !/deepseek/i.test(code));
check('Retry budget explicit (next attempt + delay + reserve)', /canAttempt\(retryNeedMs\)/.test(code) || /maxRetries = 0/.test(code));
check('Offline fallback when budget exhausted', /!finalAnswer && serviceOrTradeTerms\.test\(lowerQ\) && !canAttempt\(3000\)/.test(code));
check('Tavily 3000ms', /AbortSignal\.timeout\(3000\)/.test(code));
check('Tavily uses TAVILY_API_KEY', /process\.env\.TAVILY_API_KEY/.test(code));
check('Provider lookup 3000ms', /signal: AbortSignal\.any\(\[AbortSignal\.timeout\(3000\)/.test(code));
check('timeout_aborted preserved', /isAbortError\(e\) \? 'timeout_aborted' : 'request_exception'/.test(code));
check('Gemini maxRetries disabled', /gemini.*maxRetries.*0/.test(code) || /maxRetries = 0/.test(code));
check('deadlineController used', /deadlineController\.signal/.test(code));
check('Missing Gemini key handled', /reason: 'missing_api_key'/.test(code));
check('No 90000ms Gemini default', !/GEMINI_TIMEOUT_MS \|\| '90000'/.test(code));

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
