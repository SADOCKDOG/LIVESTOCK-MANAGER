const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/92D1A5AEBB14DD6EDE571E63DADA38DF');

ws.on('open', async () => {
    console.log('Connected to CDP');
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

    setTimeout(async () => {
        const evalMsg = {
            id: 2,
            method: 'Runtime.evaluate',
            params: {
                expression: `
                    (async () => {
                        console.log('=== RUNNING PremiumQA.runAll() ===');

                        // Wait a bit for everything to be ready
                        await new Promise(r => setTimeout(r, 2000));

                        if (typeof PremiumQA !== 'undefined' && typeof PremiumQA.runAll === 'function') {
                            const result = await PremiumQA.runAll();
                            console.log('PremiumQA.runAll() result:', result);
                            return result;
                        } else {
                            console.error('PremiumQA not available');
                            return { error: 'PremiumQA not available' };
                        }
                    })()
                `,
                awaitPromise: true,
                allowUnsafeEvalBlockedByCSP: true
            }
        };
        ws.send(JSON.stringify(evalMsg));
    }, 5000);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.result) {
        if (msg.result.result) {
            console.log('Result:', JSON.stringify(msg.result.result, null, 2));
        }
    }
    if (msg.error) console.error('Error:', msg.error);
    if (msg.method === 'Runtime.consoleAPICalled') {
        const args = msg.params.args.map(a => a.value !== undefined ? a.value : a.description).join(' ');
        console.log('[Console]', args);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[Exception]', msg.params.exceptionDetails.text);
    }
});

ws.on('error', (err) => {
    console.error('WS Error:', err);
});

setTimeout(() => {
    console.log('Timeout, closing...');
    ws.close();
    process.exit(0);
}, 60000);