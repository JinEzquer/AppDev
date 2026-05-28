const { WebSocketServer } = require('ws');
const http = require('http');

const PORT = Number(process.env.WS_PORT || 8080);
const BROADCAST_SECRET = process.env.WS_BROADCAST_SECRET || '';

// Use a shared HTTP server so we can accept HTTP broadcasts + WS connections on one port.
const server = http.createServer((req, res) => {
  // Simple health check for Railway.
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, clients: wss?.clients?.size ?? 0 }));
    return;
  }

  // Backend broadcast endpoint:
  // POST /broadcast
  // Headers: x-ws-secret: <secret>
  // Body: JSON string
  if (req.method === 'POST' && req.url === '/broadcast') {
    const secret = String(req.headers['x-ws-secret'] || '');
    if (!BROADCAST_SECRET || secret !== BROADCAST_SECRET) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'unauthorized' }));
      return;
    }

    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8') || '';
      try {
        // Ensure it is JSON; then broadcast the original string.
        JSON.parse(raw);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'invalid_json' }));
        return;
      }

      broadcast(raw);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'not_found' }));
});

const wss = new WebSocketServer({ server });

function broadcast(rawMessage, sender) {
  for (const client of wss.clients) {
    if (client.readyState !== 1 || client === sender) {
      continue;
    }
    client.send(rawMessage);
  }
}

wss.on('connection', ws => {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  ws.send(
    JSON.stringify({
      type: 'welcome',
      id,
      message: 'WebSocket connection established.',
      connectedAt: new Date().toISOString(),
    }),
  );

  ws.on('message', raw => {
    const text = raw.toString();
    const payload = JSON.stringify({
      type: 'message',
      from: id,
      message: text,
      sentAt: new Date().toISOString(),
    });
    broadcast(payload, ws);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
  console.log(`HTTP health: http://0.0.0.0:${PORT}/health`);
  console.log(`HTTP broadcast: POST http://0.0.0.0:${PORT}/broadcast`);
});

