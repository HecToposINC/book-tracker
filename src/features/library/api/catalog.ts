import type { CatalogEntry, MediaKind } from '../types';
import { fetchManga, searchManga } from './anilist';
import { fetchWork, lookupIsbn, searchBooks } from './openlibrary';

// Caché en memoria para abrir el detalle de un resultado sin volver a pedirlo.
const cache = new Map<string, CatalogEntry>();

export function rememberEntries(entries: CatalogEntry[]) {
  for (const entry of entries) {
    cache.set(entry.id, { ...cache.get(entry.id), ...entry });
  }
}

export function getCachedEntry(id: string) {
  return cache.get(id);
}

export type SearchFilter = MediaKind | 'all';

export type CatalogSearchResult = {
  books: CatalogEntry[];
  manga: CatalogEntry[];
  errors: string[];
};

export async function searchCatalog(
  query: string,
  filter: SearchFilter,
  signal?: AbortSignal
): Promise<CatalogSearchResult> {
  const [books, manga] = await Promise.allSettled([
    filter === 'manga' ? Promise.resolve([]) : searchBooks(query, signal),
    filter === 'book' ? Promise.resolve([]) : searchManga(query, signal),
  ]);

  const result: CatalogSearchResult = {
    books: books.status === 'fulfilled' ? books.value : [],
    manga: manga.status === 'fulfilled' ? manga.value : [],
    errors: [],
  };
  if (books.status === 'rejected') result.errors.push('Open Library no responde');
  if (manga.status === 'rejected') result.errors.push('AniList no responde');
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  rememberEntries([...result.books, ...result.manga]);
  return result;
}

export async function findByIsbn(isbn: string, signal?: AbortSignal) {
  const entry = await lookupIsbn(isbn, signal);
  if (entry) rememberEntries([entry]);
  return entry;
}

/** Carga el detalle completo de una ficha a partir de su id. */
export async function fetchEntry(id: string, signal?: AbortSignal): Promise<CatalogEntry | null> {
  const [prefix, value] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
  let entry: CatalogEntry | null = null;

  if (prefix === 'ol') entry = await fetchWork(value, signal);
  else if (prefix === 'al') entry = await fetchManga(Number(value), signal);
  else if (prefix === 'isbn') entry = await lookupIsbn(value, signal);

  if (!entry) return getCachedEntry(id) ?? null;

  // La búsqueda trae campos (ISBN, editorial, páginas) que el detalle no tiene: se combinan.
  const merged: CatalogEntry = { ...entry, ...getCachedEntry(id), ...stripUndefined(entry) };
  rememberEntries([merged]);
  return merged;
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))
  ) as Partial<T>;
}
