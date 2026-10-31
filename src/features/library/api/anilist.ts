import type { CatalogEntry } from '../types';
import { fetchJson } from './http';

// AniList GraphQL: https://docs.anilist.co — gratuita y sin API key (≈90 peticiones/min).
const ENDPOINT = 'https://graphql.anilist.co';

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  format
  status
  volumes
  description(asHtml: false)
  genres
  averageScore
  startDate { year }
  coverImage { extraLarge large }
  staff(perPage: 4, sort: RELEVANCE) { edges { role node { name { full } } } }
`;

const SEARCH_QUERY = `query ($search: String) {
  Page(perPage: 20) {
    media(search: $search, type: MANGA, sort: SEARCH_MATCH, isAdult: false) { ${MEDIA_FIELDS} }
  }
}`;

const BY_ID_QUERY = `query ($id: Int) {
  Media(id: $id, type: MANGA) { ${MEDIA_FIELDS} }
}`;

type AniListMedia = {
  id: number;
  title: { romaji: string | null; english: string | null; native: string | null };
  format: string | null;
  status: string | null;
  volumes: number | null;
  description: string | null;
  genres: string[] | null;
  averageScore: number | null;
  startDate: { year: number | null } | null;
  coverImage: { extraLarge: string | null; large: string | null } | null;
  staff: { edges: { role: string; node: { name: { full: string } } }[] } | null;
};

const FORMAT_LABELS: Record<string, string> = {
  MANGA: 'Manga',
  NOVEL: 'Novela ligera',
  ONE_SHOT: 'One shot',
};

const STATUS_LABELS: Record<string, string> = {
  FINISHED: 'Finalizado',
  RELEASING: 'En publicación',
  NOT_YET_RELEASED: 'Próximamente',
  CANCELLED: 'Cancelado',
  HIATUS: 'En pausa',
};

async function query<T>(gql: string, variables: Record<string, unknown>, signal?: AbortSignal) {
  const response = await fetchJson<{ data: T }>(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: gql, variables }),
    signal,
  });
  return response.data;
}

function stripHtml(text: string) {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function pickAuthors(media: AniListMedia) {
  const edges = media.staff?.edges ?? [];
  const creators = edges.filter((edge) => /story|art|original/i.test(edge.role));
  const names = (creators.length > 0 ? creators : edges).map((edge) => edge.node.name.full);
  return [...new Set(names)].slice(0, 3);
}

function toEntry(media: AniListMedia): CatalogEntry {
  const title = media.title.english ?? media.title.romaji ?? media.title.native ?? 'Sin título';
  const originalTitle = media.title.native ?? media.title.romaji ?? undefined;

  return {
    id: `al:${media.id}`,
    kind: 'manga',
    source: 'anilist',
    title,
    originalTitle: originalTitle !== title ? originalTitle : undefined,
    authors: pickAuthors(media),
    coverUrl: media.coverImage?.extraLarge ?? media.coverImage?.large ?? undefined,
    year: media.startDate?.year ?? undefined,
    totalVolumes: media.volumes ?? undefined,
    format: media.format ? (FORMAT_LABELS[media.format] ?? media.format) : undefined,
    publicationStatus: media.status ? (STATUS_LABELS[media.status] ?? media.status) : undefined,
    description: media.description ? stripHtml(media.description) : undefined,
    genres: media.genres ?? undefined,
    score: media.averageScore ?? undefined,
  };
}

export async function searchManga(search: string, signal?: AbortSignal): Promise<CatalogEntry[]> {
  const data = await query<{ Page: { media: AniListMedia[] } }>(SEARCH_QUERY, { search }, signal);
  return data.Page.media.map(toEntry);
}

export async function fetchManga(id: number, signal?: AbortSignal): Promise<CatalogEntry> {
  const data = await query<{ Media: AniListMedia }>(BY_ID_QUERY, { id }, signal);
  return toEntry(data.Media);
}
