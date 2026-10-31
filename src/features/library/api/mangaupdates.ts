import { fetchJson } from './http';

// MangaUpdates: https://api.mangaupdates.com — gratuita y sin API key.
// No admite CORS: en web las peticiones fallan y solo se usan las demás fuentes.
const BASE_URL = 'https://api.mangaupdates.com/v1';

type SearchResponse = { results: { record: { series_id: number } }[] };

export type MangaUpdatesSeries = {
  title: string;
  type: string;
  /** "23 Volumes (Ongoing)" */
  status: string | null;
  associated: { title: string }[];
  publishers: { publisher_name: string; type: string; notes: string }[];
};

export type MangaUpdatesType = 'Manga' | 'Novel';

export async function searchSeries(title: string, type: MangaUpdatesType, signal?: AbortSignal) {
  const data = await fetchJson<SearchResponse>(`${BASE_URL}/series/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search: title, type: [type] }),
    signal,
  });
  return data.results.slice(0, 5).map((result) => result.record.series_id);
}

export function fetchSeries(id: number, signal?: AbortSignal) {
  return fetchJson<MangaUpdatesSeries>(`${BASE_URL}/series/${id}`, { signal });
}
