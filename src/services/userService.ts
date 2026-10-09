import type { User } from '../types';

export type ServerUserPayload = {
  id: string;
  userKey: string;
  username: string;
  fullName: string;
  isGuest?: boolean;
  guestNumber?: number;
  createdAt: number;
};

const toUser = (p: ServerUserPayload): User => ({
  id: p.id,
  username: p.username,
  fullName: p.fullName,
  createdAt: p.createdAt,
  isGuest: p.isGuest,
  guestNumber: p.guestNumber,
});

export const registerUserOnServer = async (
  username: string,
  fullName: string
): Promise<{ ok: true; user: User } | { ok: false; error: string; status: number }> => {
  const res = await fetch('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, fullName }),
  });
  const text = await res.text();
  let body: ServerUserPayload & { error?: string };
  try {
    body = JSON.parse(text) as ServerUserPayload & { error?: string };
  } catch {
    return { ok: false as const, error: text || 'Invalid response', status: res.status };
  }
  if (!res.ok) {
    return { ok: false as const, error: body?.error || text || `HTTP ${res.status}`, status: res.status };
  }
  return { ok: true as const, user: toUser(body) };
};

export const loginUserOnServer = async (
  username: string
): Promise<{ ok: true; user: User } | { ok: false; error: string; status: number }> => {
  const res = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  const text = await res.text();
  let body: ServerUserPayload & { error?: string };
  try {
    body = JSON.parse(text) as ServerUserPayload & { error?: string };
  } catch {
    return { ok: false as const, error: text || 'Invalid response', status: res.status };
  }
  if (!res.ok) {
    return { ok: false as const, error: body?.error || text || `HTTP ${res.status}`, status: res.status };
  }
  return { ok: true as const, user: toUser(body) };
};

export const createGuestOnServer = async (): Promise<
  { ok: true; user: User } | { ok: false; error: string; status: number }
> => {
  const res = await fetch('/api/users/guest', { method: 'POST' });
  const text = await res.text();
  let body: ServerUserPayload & { error?: string };
  try {
    body = JSON.parse(text) as ServerUserPayload & { error?: string };
  } catch {
    return { ok: false as const, error: text || 'Invalid response', status: res.status };
  }
  if (!res.ok) {
    return { ok: false as const, error: body?.error || text || `HTTP ${res.status}`, status: res.status };
  }
  return { ok: true as const, user: toUser(body) };
};
