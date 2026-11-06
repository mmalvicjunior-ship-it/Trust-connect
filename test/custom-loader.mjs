import fs from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server' || specifier === 'next/server.js') {
    return { url: 'file://' + resolve(currentDir, 'next-server-mock.cjs'), shortCircuit: true };
  }
  if (specifier === '../../../lib/diagnostics.js') {
    return nextResolve(specifier, { ...context, importAssertions: { type: 'json' } });
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('next-server-mock.cjs')) {
    const source = fs.readFileSync(new URL(url).pathname, 'utf8');
    return { format: 'cjs', source, shortCircuit: true };
  }
  return nextLoad(url, context);
}
