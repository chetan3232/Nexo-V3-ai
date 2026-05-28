const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export type SandboxResult = {
  status: 'success' | 'error';
  code: number;
  output: string;
};

export type SandboxResponse = {
  result: SandboxResult;
  logs: string;
};

export async function runSandboxCommand(command: string): Promise<SandboxResponse> {
  const response = await fetch(`${API_BASE}/api/sandbox/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ command }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(payload.error ?? response.statusText);
  }

  return response.json() as Promise<SandboxResponse>;
}
