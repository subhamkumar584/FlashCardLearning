type YoutubeSearchItem = {
  id?: { videoId?: string };
  snippet?: { title?: string; description?: string };
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function scoreResult(query: string, item: YoutubeSearchItem): number {
  const qTokens = tokenize(query);
  const title = item.snippet?.title || "";
  const desc = item.snippet?.description || "";
  const tTokens = tokenize(title);
  const dTokens = tokenize(desc);

  // Token overlap score
  let score = 0;
  for (const qt of qTokens) {
    if (tTokens.includes(qt)) score += 3; // title match is strong
    else if (dTokens.includes(qt)) score += 1; // description match
  }

  // Exact phrase boost
  const q = query.trim().toLowerCase();
  if (q && title.toLowerCase().includes(q)) score += 5;
  if (q && desc.toLowerCase().includes(q)) score += 2;

  // Prefer shorter titles (less noise) if scores tie
  score += Math.max(0, 3 - Math.floor((title.length || 0) / 40));

  return score;
}

export async function fetchBestYoutubeUrl(query: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  if (!apiKey) return null;

  // Fetch multiple candidates for better ranking
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&order=relevance&relevanceLanguage=en&maxResults=5&q=${encodeURIComponent(
    query
  )}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    // Fallback try without key (may work with lower quota)
    if (res.status === 403) {
      const fallback = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&order=relevance&relevanceLanguage=en&maxResults=5&q=${encodeURIComponent(
        query
      )}`;
      const res2 = await fetch(fallback);
      if (!res2.ok) return null;
      const data2 = await res2.json();
      const best2 = pickBest(data2.items || [], query);
      return best2 ? `https://youtube.com/watch?v=${best2}` : null;
    }
    return null;
  }

  const data = await res.json();
  const best = pickBest(data.items || [], query);
  return best ? `https://youtube.com/watch?v=${best}` : null;
}

function pickBest(items: YoutubeSearchItem[], query: string): string | null {
  let bestId: string | null = null;
  let bestScore = -Infinity;
  for (const it of items) {
    const id = it.id?.videoId;
    if (!id) continue;
    const s = scoreResult(query, it);
    if (s > bestScore) {
      bestScore = s;
      bestId = id;
    }
  }
  return bestId;
}

// Backward-compatible export (not used now, but kept just in case)
export async function fetchYoutubeVideos(query: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&key=${apiKey}&maxResults=1&type=video`
  );
  const data = await response.json();
  return data.items?.[0];
}
