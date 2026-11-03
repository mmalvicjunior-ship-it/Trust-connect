// Focused timeout verification — CommonJS mock, no paid requests
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/chat/route.js');
const code = fs.readFileSync(filePath, 'utf8');
let passed = 0, failed = 0;
function check(name, ok) { if (ok) { passed++; console.log('PASS:', name); } else { failed++; console.log('FAIL:', name); } }

check('maxDuration exported', /export const maxDuration = 30;/.test(code));
check('OpenAI actual timeout computed', /openaiTimeoutMs = sanitizeTimeoutMs\(process\.env\.OPENAI_TIMEOUT_MS\) \|\| 4000/.test(code));
check('OpenAI canAttempt uses openaiTimeoutMs', /canAttempt\(openaiTimeoutMs\)/.test(code));
check('Gemini actual timeout computed', /geminiTimeoutMs = sanitizeTimeoutMs\(process\.env\.GEMINI_TIMEOUT_MS\) \|\| 3000/.test(code));
check('OpenRouter actual timeout computed', /openRouterTimeoutMs = sanitizeTimeoutMs\(process\.env\.OPENROUTER_TIMEOUT_MS\) \|\| 3000/.test(code));
check('Retry need uses sanitized next attempt time', /retryNeedMs = openaiNextMs \+ 2000/.test(code) && /canAttempt\(retryNeedMs\)/.test(code));
check('Retry budget explicit (next attempt + delay + reserve)', /retryNeedMs = openaiNextMs \+ 2000/.test(code) && /canAttempt\(retryNeedMs\)/.test(code));
check('Retry budget explicit (next attempt + delay + reserve)', /retryNeedMs = openaiNextMs \+ 2000/.test(code) && /canAttempt\(retryNeedMs\)/.test(code));
check('Offline fallback when budget exhausted', /!finalAnswer && serviceOrTradeTerms\.test\(lowerQ\) && !canAttempt\(3000\)/.test(code));
check('Tavily 3000ms', /AbortSignal\.timeout\(3000\)/.test(code));
check('Provider lookup 3000ms', /signal: AbortSignal\.any\(\[AbortSignal\.timeout\(3000\)/.test(code));
check('timeout_aborted preserved', /isAbortError\(e\) \? 'timeout_aborted' : 'request_exception'/.test(code));
check('Gemini maxRetries disabled', /gemini.*maxRetries.*0/.test(code) || /maxRetries = 0/.test(code));
check('deadlineController used', /deadlineController\.signal/.test(code));
check('No 90000ms Gemini default', !/GEMINI_TIMEOUT_MS \|\| '90000'/.test(code));
check('No 30000ms OpenAI default', !/OPENAI_TIMEOUT_MS \|\| '30000'/.test(code));

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
