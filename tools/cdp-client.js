const WebSocket = require('ws');

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

function connect(wsUrl) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        ws.on('open', () => resolve(ws));
        ws.on('error', (err) => reject(err));
    });
}

module.exports = { sendCommand, connect };
