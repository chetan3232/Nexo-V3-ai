export type StreamTransport = 'sse' | 'websocket';

export type StreamHandlers = {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
};

const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';

async function fallbackStream(prompt: string, handlers: StreamHandlers, chunkSize: number) {
  for (const token of prompt.match(new RegExp(`.{1,${chunkSize}}`, 'g')) ?? [prompt]) {
    await new Promise((resolve) => setTimeout(resolve, 28));
    handlers.onToken(token);
  }
  handlers.onDone();
}

async function streamViaSse(prompt: string, handlers: StreamHandlers) {
  const response = await fetch(`${API_BASE}/api/ai/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.body) throw new Error('SSE response body unavailable');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      if (event.startsWith('event: done')) {
        handlers.onDone();
        return;
      }

      const line = event.split('\n').find((entry) => entry.startsWith('data: '));
      if (!line) continue;
      const payload = JSON.parse(line.slice(6));
      if (payload.token) handlers.onToken(payload.token);
    }
  }

  handlers.onDone();
}

async function streamViaWebSocket(prompt: string, handlers: StreamHandlers) {
  const wsUrl = API_BASE.replace(/^http/, 'ws');

  await new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(`${wsUrl}/api/ai/ws`);

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ prompt }));
    });

    socket.addEventListener('message', (event) => {
      const payload = JSON.parse(String(event.data));
      if (payload.type === 'token') handlers.onToken(payload.token);
      if (payload.type === 'done') {
        handlers.onDone();
        socket.close();
        resolve();
      }
    });

    socket.addEventListener('error', () => reject(new Error('WebSocket stream failed')));
  });
}

export async function streamAIResponse(transport: StreamTransport, prompt: string, handlers: StreamHandlers) {
  try {
    if (transport === 'sse') {
      await streamViaSse(prompt, handlers);
      return;
    }

    await streamViaWebSocket(prompt, handlers);
  } catch (error) {
    await fallbackStream(prompt, handlers, transport === 'sse' ? 16 : 20);
  }
}
