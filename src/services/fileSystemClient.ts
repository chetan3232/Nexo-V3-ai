import { FileNode } from '@/store/useFileSystemStore';

const API_BASE = import.meta.env.VITE_NEXO_API_URL ?? 'http://localhost:8787';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(payload.error ?? response.statusText);
  }

  return response.json() as Promise<T>;
}

export async function fetchWorkspaceTree() {
  return request<{ tree: FileNode[] }>('/api/fs/tree');
}

export async function readWorkspaceFile(filePath: string) {
  return request<{ content: string }>(`/api/fs/read?path=${encodeURIComponent(filePath)}`);
}

export async function writeWorkspaceFile(filePath: string, content: string) {
  return request<{ ok: true }>('/api/fs/write', {
    method: 'POST',
    body: JSON.stringify({ path: filePath, content }),
  });
}

export async function renameWorkspacePath(from: string, to: string) {
  return request<{ ok: true }>('/api/fs/rename', {
    method: 'POST',
    body: JSON.stringify({ from, to }),
  });
}

export async function deleteWorkspacePath(filePath: string) {
  return request<{ ok: true }>('/api/fs/delete', {
    method: 'POST',
    body: JSON.stringify({ path: filePath }),
  });
}
