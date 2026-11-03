import { fileURLToPath } from 'node:url';
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') {
    return { url: new URL('next-server-mock.mjs', import.meta.url).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
export async function load(url, context, nextLoad) {
  if (url.endsWith('next-server-mock.mjs')) {
    const fs = await import('node:fs');
    return { format: 'module', source: fs.readFileSync(fileURLToPath(new URL(url)), 'utf8'), shortCircuit: true };
  }
  return nextLoad(url, context);
}
