const { connect, sendCommand } = require('./cdp-client');

const WS_URL = process.argv[2];
const MODE = process.argv[3] || 'clear'; // 'clear' | 'seed-and-test'

async function evalJs(ws, expression, awaitPromise = true) {
  const result = await sendCommand(ws, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || JSON.stringify(result.exceptionDetails));
  }
  return result.result.value;
}

async function main() {
  const ws = await connect(WS_URL);

  try {
    if (MODE === 'clear') {
      const state = await evalJs(ws, `JSON.stringify({url: location.href, hasDb: typeof window.db})`);
      console.log('Estado inicial:', state);
      const del = await evalJs(ws, `new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('LivestockDB');
        req.onsuccess = () => resolve('deleted');
        req.onerror = () => resolve('error');
        req.onblocked = () => resolve('blocked');
      })`);
      console.log('DB borrada:', del);
      await evalJs(ws, `(() => { localStorage.clear(); localStorage.setItem('lm_qa_tools','1'); return 'ok'; })()`, false);
      console.log('localStorage preparado.');
    } else {
      const state = await evalJs(ws, `JSON.stringify({url: location.href, hasSeedData: typeof window.SeedData, hasRunTests: typeof runLacteoTests})`);
      console.log('Estado tras relanzar:', state);

      const loaded = JSON.parse(state);
      if (loaded.hasSeedData === 'undefined') {
        await evalJs(ws, `new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'js/seed-data.js?v=device1';
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        })`);
        console.log('seed-data.js cargado.');
      }

      console.log('Sembrando datos demo CHAMORRO...');
      await evalJs(ws, `window.SeedData.run(true)`);

      const fincaCheck = await evalJs(ws, `(async () => {
        const f = await window.Fincas.getActive();
        return JSON.stringify({nombre: f && f.nombre, letraQ: f && f.codigo_letra_q});
      })()`);
      console.log('Finca sembrada:', fincaCheck);

      console.log('\nEjecutando runLacteoTests()...\n');
      const results = await evalJs(ws, `runLacteoTests()`);
      console.log('RESULTADOS:', JSON.stringify(results, null, 2));
    }
  } finally {
    ws.close();
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
