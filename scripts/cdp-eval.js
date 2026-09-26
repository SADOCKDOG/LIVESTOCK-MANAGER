/**
 * Evalúa una expresión JS dentro del WebView de la app en el emulador vía CDP.
 * Uso: node scripts/cdp-eval.js "<expresion>"
 * Requiere: adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>
 */
const EXPR = process.argv[2] || '1';

async function main() {
  const listUrl = 'http://localhost:9222/json/list';
  const res = await fetch(listUrl);
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  if (!page) throw new Error('Sin target page en DevTools');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pend = new Map();
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };

  const out = await send('Runtime.evaluate', {
    expression: EXPR,
    returnByValue: true,
    awaitPromise: true,
  });
  console.log(JSON.stringify(out.result, null, 2));
  ws.close();
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
