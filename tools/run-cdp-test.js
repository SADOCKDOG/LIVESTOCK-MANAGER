const WebSocket = require('ws');

const WS_URL = 'ws://localhost:9222/devtools/page/C88A117E91038983A40A04485D6F3301';

let messageId = 1;

function sendCommand(ws, method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = messageId++;
        const message = { id, method, params };

        const timeout = setTimeout(() => {
            reject(new Error(`Timeout waiting for response to ${method}`));
        }, 30000);

        const handler = (data) => {
            const response = JSON.parse(data.toString());
            if (response.id === id) {
                clearTimeout(timeout);
                ws.removeListener('message', handler);
                if (response.error) {
                    reject(new Error(response.error.message));
                } else {
                    resolve(response.result);
                }
            }
        };

        ws.on('message', handler);
        ws.send(JSON.stringify(message));
    });
}

async function runTests() {
    console.log('🔌 Connecting to WebView...');
    const ws = new WebSocket(WS_URL);

    ws.on('open', async () => {
        console.log('✅ Connected to WebView\n');

        try {
            // Step 1: Enable QA tools
            console.log('📦 Step 1: Enabling QA tools...');
            const flagResult = await sendCommand(ws, 'Runtime.evaluate', {
                expression: "localStorage.getItem('lm_qa_tools')",
                returnByValue: true
            });
            console.log('   Current flag before:', flagResult.result.value);

            await sendCommand(ws, 'Runtime.evaluate', {
                expression: "localStorage.setItem('lm_qa_tools', '1');",
                returnByValue: true
            });
            await sendCommand(ws, 'Page.reload', {});

            // Poll for readiness instead of a fixed sleep
            console.log('   Waiting for page reload + script load...');
            let ready = false;
            for (let i = 0; i < 30; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                try {
                    const check = await sendCommand(ws, 'Runtime.evaluate', {
                        expression: 'JSON.stringify({state: document.readyState, hasFn: typeof runLacteoTests, url: location.href, flag: localStorage.getItem("lm_qa_tools")})',
                        returnByValue: true
                    });
                    const info = JSON.parse(check.result.value);
                    if (i % 5 === 0) console.log('   ...', JSON.stringify(info));
                    if (info.hasFn === 'function') { ready = true; break; }
                } catch (e) {
                    // context may be mid-navigation, ignore and retry
                }
            }

            console.log(ready ? '✅ QA tools enabled and script loaded\n' : '⚠️ Timed out waiting for runLacteoTests\n');

            // Step 2: Check if runLacteoTests exists
            console.log('🔍 Step 2: Checking if runLacteoTests is available...');
            const checkResult = await sendCommand(ws, 'Runtime.evaluate', {
                expression: 'typeof runLacteoTests',
                returnByValue: true
            });

            if (checkResult.result.value !== 'function') {
                throw new Error('runLacteoTests is not defined. Make sure test-lacteo-v24.js is loaded.');
            }

            console.log('✅ runLacteoTests found\n');

            // Step 3: Run tests
            console.log('🧪 Step 3: Running automated tests...\n');
            console.log('='.repeat(80));

            const testResult = await sendCommand(ws, 'Runtime.evaluate', {
                expression: 'runLacteoTests()',
                returnByValue: true,
                awaitPromise: true
            });

            console.log('='.repeat(80));
            console.log('\n✅ Tests completed\n');

            // Step 4: Navigate to ExPro -> Láctea for visual verification
            console.log('🎨 Step 4: Navigating to ExPro -> Láctea for visual verification...');
            await sendCommand(ws, 'Runtime.evaluate', {
                expression: "window.location.hash = '#/explotacion';",
                returnByValue: true
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Click on Láctea tab
            await sendCommand(ws, 'Runtime.evaluate', {
                expression: `
                    const tabs = document.querySelectorAll('.tab-btn');
                    for (let tab of tabs) {
                        if (tab.textContent.includes('Láctea')) {
                            tab.click();
                            break;
                        }
                    }
                `,
                returnByValue: true
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('✅ Navigated to ExPro -> Láctea\n');

            // Step 5: Take screenshot
            console.log('📸 Step 5: Taking screenshot...');
            const screenshot = await sendCommand(ws, 'Page.captureScreenshot', {
                format: 'png',
                quality: 100
            });

            const fs = require('fs');
            const buffer = Buffer.from(screenshot.data, 'base64');
            fs.writeFileSync('C:\\Users\\yo\\repo\\LIVESTOCK-MANAGER\\tools\\lacteo-dashboard.png', buffer);

            console.log('✅ Screenshot saved to: tools/lacteo-dashboard.png\n');

            console.log('🎉 All steps completed successfully!');

        } catch (error) {
            console.error('❌ Error:', error.message);
        } finally {
            ws.close();
            process.exit(0);
        }
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        process.exit(1);
    });
}

runTests();

