import type { GapAnalysis, RemedialSlide } from '../types';

export const saveGapAnalysisToServer = async (args: {
  userId: string;
  sessionId: string | null;
  standardCode: string;
  analysis: GapAnalysis;
}): Promise<{ ok: true; id: string } | { ok: false; error: string; status: number }> => {
  const res = await fetch('/api/gap-analyses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: args.userId,
      sessionId: args.sessionId,
      standardCode: args.standardCode,
      analysis: args.analysis,
    }),
  });
  const text = await res.text();
  let body: { id?: string; error?: string };
  try {
    body = JSON.parse(text) as { id?: string; error?: string };
  } catch {
    return { ok: false as const, error: text || 'Invalid response', status: res.status };
  }
  if (!res.ok || !body.id) {
    return { ok: false as const, error: body?.error || text || `HTTP ${res.status}`, status: res.status };
  }
  return { ok: true as const, id: body.id };
};

export const saveRemediationSlidesToServer = async (args: {
  userId: string;
  gapAnalysisId: string;
  slides: RemedialSlide[];
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> => {
  const res = await fetch(`/api/gap-analyses/${encodeURIComponent(args.gapAnalysisId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: args.userId,
      remediationSlides: args.slides,
    }),
  });
  const text = await res.text();
  let body: { error?: string };
  try {
    body = JSON.parse(text) as { error?: string };
  } catch {
    return { ok: false as const, error: text || 'Invalid response', status: res.status };
  }
  if (!res.ok) {
    return { ok: false as const, error: body?.error || text || `HTTP ${res.status}`, status: res.status };
  }
  return { ok: true as const };
};

export const postActivityEvents = async (
  events: Array<{ userId: string; action: string; metadata?: Record<string, unknown>; quizSessionId?: string }>
): Promise<void> => {
  try {
    await fetch('/api/activity-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: events.map((e) => ({
          userId: e.userId,
          action: e.action,
          metadata: e.metadata,
          quizSessionId: e.quizSessionId,
        })),
      }),
    });
  } catch {
    /* non-fatal */
  }
};
