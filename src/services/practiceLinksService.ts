export type PracticeLink = {
  title: string;
  url: string;
};

export type PracticeLinksResponse = {
  standardId: string;
  links: PracticeLink[];
  source: 'supabase' | 'file';
};

export const fetchPracticeLinks = async (
  standardCode: string,
  limit = 50
): Promise<PracticeLinksResponse> => {
  const encoded = encodeURIComponent(standardCode);
  const candidates = [
    `/api/practice-links?standard_id=${encoded}&limit=${limit}`,
    `/api/practice-links/${encoded}?limit=${limit}`,
  ];

  let lastError = "Unknown practice links error.";
  for (const url of candidates) {
    const res = await fetch(url);
    const contentType = res.headers.get('content-type') || '';
    const bodyText = await res.text();

    if (!res.ok) {
      lastError = `Practice links failed: ${res.status} ${bodyText}`;
      continue;
    }

    if (!contentType.toLowerCase().includes('application/json')) {
      lastError = `Practice links endpoint returned non-JSON (${contentType || 'unknown content type'}).`;
      continue;
    }

    try {
      return JSON.parse(bodyText) as PracticeLinksResponse;
    } catch {
      lastError = "Practice links endpoint returned invalid JSON.";
    }
  }

  throw new Error(lastError);
};
