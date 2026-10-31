import type { CatalogEntry } from '../types';
import { fetchJson } from './http';

// Open Library: https://openlibrary.org/developers/api — gratuita y sin API key.
const BASE_URL = 'https://openlibrary.org';

const coverFromId = (coverId: number) => `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;

type SearchDoc = {
  key: string;
  title: string;
  subtitle?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
  publisher?: string[];
  number_of_pages_median?: number;
  subject?: string[];
};

type WorkResponse = {
  title: string;
  subtitle?: string;
  description?: string | { value: string };
  covers?: number[];
  subjects?: string[];
  first_publish_date?: string;
  authors?: { author: { key: string } }[];
};

type BooksApiEdition = {
  title: string;
  subtitle?: string;
  authors?: { name: string }[];
  publishers?: { name: string }[];
  publish_date?: string;
  number_of_pages?: number;
  cover?: { large?: string; medium?: string };
  subjects?: { name: string }[];
  notes?: string | { value: string };
};

const SEARCH_FIELDS =
  'key,title,subtitle,author_name,first_publish_year,cover_i,isbn,publisher,number_of_pages_median,subject';

function pickIsbn13(isbns?: string[]) {
  return isbns?.find((isbn) => isbn.length === 13) ?? isbns?.[0];
}

function parseYear(date?: string) {
  const match = date?.match(/\d{4}/);
  return match ? Number(match[0]) : undefined;
}

function textValue(value?: string | { value: string }) {
  return typeof value === 'string' ? value : value?.value;
}

function joinTitle(title: string, subtitle?: string) {
  return subtitle ? `${title}: ${subtitle}` : title;
}

export async function searchBooks(query: string, signal?: AbortSignal): Promise<CatalogEntry[]> {
  const params = new URLSearchParams({ q: query, limit: '20', fields: SEARCH_FIELDS });
  const data = await fetchJson<{ docs: SearchDoc[] }>(`${BASE_URL}/search.json?${params}`, {
    signal,
  });

  return data.docs.map((doc) => ({
    id: `ol:${doc.key.replace('/works/', '')}`,
    kind: 'book',
    source: 'openlibrary',
    title: joinTitle(doc.title, doc.subtitle),
    authors: doc.author_name?.slice(0, 3) ?? [],
    coverUrl: doc.cover_i ? coverFromId(doc.cover_i) : undefined,
    year: doc.first_publish_year,
    publisher: doc.publisher?.[0],
    isbn: pickIsbn13(doc.isbn),
    pages: doc.number_of_pages_median,
    genres: doc.subject?.slice(0, 5),
  }));
}

/** Detalle de una obra (`OL123W`), incluida la sinopsis que la búsqueda no trae. */
export async function fetchWork(workId: string, signal?: AbortSignal): Promise<CatalogEntry> {
  const work = await fetchJson<WorkResponse>(`${BASE_URL}/works/${workId}.json`, { signal });
  const authorKeys = work.authors?.slice(0, 3).map((a) => a.author.key) ?? [];
  const authors = await Promise.all(
    authorKeys.map((key) =>
      fetchJson<{ name: string }>(`${BASE_URL}${key}.json`, { signal })
        .then((author) => author.name)
        .catch(() => null)
    )
  );

  return {
    id: `ol:${workId}`,
    kind: 'book',
    source: 'openlibrary',
    title: joinTitle(work.title, work.subtitle),
    authors: authors.filter((name): name is string => Boolean(name)),
    coverUrl: work.covers?.[0] ? coverFromId(work.covers[0]) : undefined,
    year: parseYear(work.first_publish_date),
    description: textValue(work.description),
    genres: work.subjects?.slice(0, 5),
  };
}

/** Busca una edición concreta por ISBN-13. Devuelve `null` si no existe. */
export async function lookupIsbn(isbn: string, signal?: AbortSignal): Promise<CatalogEntry | null> {
  const key = `ISBN:${isbn}`;
  const params = new URLSearchParams({ bibkeys: key, jscmd: 'data', format: 'json' });
  const data = await fetchJson<Record<string, BooksApiEdition>>(`${BASE_URL}/api/books?${params}`, {
    signal,
  });
  const edition = data[key];
  if (!edition) return null;

  return {
    id: `isbn:${isbn}`,
    kind: 'book',
    source: 'openlibrary',
    title: joinTitle(edition.title, edition.subtitle),
    authors: edition.authors?.map((a) => a.name) ?? [],
    coverUrl: edition.cover?.large ?? edition.cover?.medium,
    year: parseYear(edition.publish_date),
    publisher: edition.publishers?.[0]?.name,
    isbn,
    pages: edition.number_of_pages,
    description: textValue(edition.notes),
    genres: edition.subjects?.slice(0, 5).map((s) => s.name),
  };
}

export type SeriesDoc = { title: string; publisher?: string[]; language?: string[] };

/** Obras que coinciden con una serie (en Open Library cada tomo suele ser una obra). */
export async function searchSeriesWorks(query: string, signal?: AbortSignal): Promise<SeriesDoc[]> {
  const params = new URLSearchParams({ q: query, limit: '100', fields: 'title,publisher,language' });
  const data = await fetchJson<{ docs: SeriesDoc[] }>(`${BASE_URL}/search.json?${params}`, { signal });
  return data.docs;
}

export type WorkEdition = { publishers?: string[]; languages?: { key: string }[] };

/** Ediciones de una obra (`OL123W`): cada una con su editorial e idioma. */
export async function fetchWorkEditions(workId: string, signal?: AbortSignal): Promise<WorkEdition[]> {
  const data = await fetchJson<{ entries: WorkEdition[] }>(
    `${BASE_URL}/works/${workId}/editions.json?limit=100`,
    { signal }
  );
  return data.entries;
}
