import { languageForPublisher, normalizePublisher, type EditionDraft } from '../editions';
import type { CatalogEntry, EditionLanguage } from '../types';
import { fetchFormatVersions, type FormatVersion } from './anilist';
import { fetchSeries, searchSeries, type MangaUpdatesSeries } from './mangaupdates';
import { fetchWorkEditions, searchSeriesWorks, type SeriesDoc } from './openlibrary';

export type EditionSuggestion = EditionDraft & { key: string };

const OL_LANGUAGES: Record<string, EditionLanguage> = {
  spa: 'es',
  eng: 'en',
  jpn: 'ja',
  fre: 'fr',
  ita: 'it',
  por: 'pt',
  ger: 'de',
};

// Distribuidoras, audiolibros y autoedición: no son ediciones en papel de la obra.
const IGNORED_PUBLISHERS = /independently published|audio|audible|hachette|orbit|createspace/i;

const LANGUAGE_ORDER: EditionLanguage[] = ['es', 'en', 'ja', 'fr', 'it', 'pt', 'de', 'other'];

const cache = new Map<string, EditionSuggestion[]>();

export function getCachedSuggestions(id: string) {
  return cache.get(id);
}

/** Normaliza un título para compararlo sin signos, espacios ni números de tomo. */
function titleKey(title: string) {
  return title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\(?(light novel|novel|manga)\)?/g, '')
    .replace(/[\s\d!?¡¿:;.,'’"()[\]\-–—~・、。！？：]/g, '');
}

function suggestionKey(draft: EditionDraft) {
  return `${normalizePublisher(draft.publisher)}|${draft.language}|${draft.format}`;
}

/** Busca ediciones conocidas de una ficha: formatos, idiomas, editoriales y nº de tomos. */
export async function discoverEditions(
  entry: CatalogEntry,
  signal?: AbortSignal
): Promise<EditionSuggestion[]> {
  const cached = cache.get(entry.id);
  if (cached) return cached;

  let drafts: EditionDraft[] = [];
  if (entry.id.startsWith('al:')) drafts = await discoverSeries(entry, signal);
  else if (entry.id.startsWith('ol:')) drafts = await discoverBookEditions(entry.id.slice(3), signal);

  const suggestions = mergeDrafts(drafts);
  cache.set(entry.id, suggestions);
  return suggestions;
}

async function discoverSeries(entry: CatalogEntry, signal?: AbortSignal) {
  const versions = await fetchFormatVersions(Number(entry.id.slice(3)), signal).catch(() => [
    { format: entry.format ?? 'Manga', volumes: entry.totalVolumes, titles: [entry.title] },
  ]);
  const titles = [...new Set(versions.flatMap((version) => version.titles))];

  const [openLibrary, ...mangaUpdates] = await Promise.all([
    openLibraryDrafts(titles, versions, signal).catch(() => []),
    ...versions.map((version) => mangaUpdatesDrafts(version, signal).catch(() => [])),
  ]);

  // La edición original japonesa de cada formato, aunque no se sepa la editorial.
  const originals = versions.map<EditionDraft>((version) => ({
    language: 'ja',
    publisher: '',
    format: version.format,
    totalVolumes: version.volumes,
  }));
  return [...mangaUpdates.flat(), ...originals, ...openLibrary];
}

/** Editoriales original (japonesa) e inglesa con su nº de tomos. */
async function mangaUpdatesDrafts(version: FormatVersion, signal?: AbortSignal) {
  const series = await findMangaUpdatesSeries(version, signal);
  if (!series) return [];

  const drafts: EditionDraft[] = [];
  for (const publisher of series.publishers) {
    if (IGNORED_PUBLISHERS.test(publisher.publisher_name)) continue;
    const language = publisher.type === 'Original' ? 'ja' : publisher.type === 'English' ? 'en' : null;
    if (!language) continue;
    const source = language === 'ja' ? series.status : publisher.notes;
    drafts.push({
      language,
      publisher: publisher.publisher_name,
      format: version.format,
      totalVolumes: parseVolumeCount(source),
    });
  }
  return drafts;
}

async function findMangaUpdatesSeries(version: FormatVersion, signal?: AbortSignal) {
  const type = version.format === 'Novela ligera' ? 'Novel' : 'Manga';
  const wanted = new Set(version.titles.map(titleKey));
  const romaji = version.titles.find((title) => /^[\x00-\x7F]+$/.test(title)) ?? version.titles[0];

  // La búsqueda mezcla spin-offs: se confirma la serie por sus títulos alternativos.
  for (const id of await searchSeries(romaji, type, signal)) {
    const series: MangaUpdatesSeries = await fetchSeries(id, signal);
    const names = [series.title, ...series.associated.map((a) => a.title)];
    if (names.some((name) => wanted.has(titleKey(name)))) return series;
  }
  return null;
}

function parseVolumeCount(text?: string | null) {
  const match = text?.match(/(\d+)\s*vol/i);
  return match ? Number(match[1]) : undefined;
}

/** Agrupa por editorial las obras de Open Library (cada tomo suele ser una obra distinta). */
async function openLibraryDrafts(titles: string[], versions: FormatVersion[], signal?: AbortSignal) {
  // El título latino y el japonés devuelven obras distintas (p. ej. Ivrea solo sale con el japonés).
  const latin = titles.find((title) => /^[\x00-\x7F]+$/.test(title));
  const native = titles.find((title) => !/^[\x00-\x7F]+$/.test(title));
  const queries = [latin, native].filter((q): q is string => Boolean(q));
  const results = await Promise.all(queries.map((q) => searchSeriesWorks(q, signal).catch(() => [])));
  const seen = new Set<string>();
  const docs = results.flat().filter((doc) => {
    const id = `${doc.title}|${doc.publisher?.join(',')}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  const wanted = titles.map(titleKey).filter(Boolean);
  const matching = docs.filter((doc) => wanted.some((key) => titleKey(doc.title).includes(key)));

  type Group = { publisher: string; language: EditionLanguage; docs: SeriesDoc[] };
  const groups = new Map<string, Group>();
  for (const doc of matching) {
    const publishers = (doc.publisher ?? []).filter((p) => p.trim() && !IGNORED_PUBLISHERS.test(p));
    for (const publisher of publishers) {
      // Con varias editoriales en una obra el idioma solo se fía si la editorial es conocida.
      const docLanguage = doc.language?.length === 1 ? OL_LANGUAGES[doc.language[0]] : undefined;
      const language =
        languageForPublisher(publisher) ?? (publishers.length === 1 ? docLanguage : undefined);
      if (!language) continue;
      const key = `${normalizePublisher(publisher)}|${language}`;
      const group = groups.get(key) ?? { publisher, language, docs: [] };
      group.docs.push(doc);
      groups.set(key, group);
    }
  }

  const fallbackFormat = versions[0]?.format ?? 'Manga';
  return [...groups.values()].map<EditionDraft>((group) => ({
    language: group.language,
    publisher: cleanPublisherName(group.publisher),
    format: guessFormat(group, fallbackFormat),
    totalVolumes: countVolumes(group.docs),
  }));
}

function guessFormat(group: { publisher: string; docs: SeriesDoc[] }, fallback: string) {
  if (/yen on|j-novel/i.test(group.publisher)) return 'Novela ligera';
  let novels = 0;
  let manga = 0;
  for (const doc of group.docs) {
    if (/light novel|\bnovel\b/i.test(doc.title)) novels++;
    else if (/manga/i.test(doc.title)) manga++;
  }
  if (novels === 0 && manga === 0) return fallback;
  return novels > manga ? 'Novela ligera' : 'Manga';
}

/** Tomo más alto que aparece en los títulos; los tomos dobles ("1-2") cuentan como uno. */
function countVolumes(docs: SeriesDoc[]) {
  const bundles = docs.filter((doc) => /\d+\s*-\s*\d+/.test(doc.title)).length;
  if (bundles > 0) return bundles;
  const numbers = docs.map((doc) => volumeNumber(doc.title)).filter((n): n is number => n !== undefined);
  return numbers.length > 0 ? Math.max(...numbers) : undefined;
}

/** "…, Vol. 7: 110-Million Bride" → 7; "祝福を! 7 億千万の花嫁" → 7. */
function volumeNumber(title: string) {
  const match = title.match(/vol(?:ume)?\.?\s*(\d+)/i) ?? title.match(/\d+/);
  const value = match ? Number(match[1] ?? match[0]) : NaN;
  return value > 0 && value < 300 ? value : undefined;
}

function cleanPublisherName(name: string) {
  return name.replace(/,?\s+(LLC|Inc\.?|Ltd\.?)$/i, '').trim();
}

/** Libros: cada edición de la obra en Open Library, agrupada por editorial e idioma. */
async function discoverBookEditions(workId: string, signal?: AbortSignal) {
  const editions = await fetchWorkEditions(workId, signal);
  const drafts: EditionDraft[] = [];
  for (const edition of editions) {
    const languageKey = edition.languages?.[0]?.key.replace('/languages/', '');
    for (const publisher of edition.publishers ?? []) {
      if (!publisher.trim() || IGNORED_PUBLISHERS.test(publisher)) continue;
      const language =
        (languageKey ? OL_LANGUAGES[languageKey] : undefined) ?? languageForPublisher(publisher);
      if (!language) continue;
      drafts.push({ language, publisher: cleanPublisherName(publisher), format: 'Libro', totalVolumes: 1 });
    }
  }
  return drafts;
}

/**
 * Une sugerencias repetidas. Gana la primera fuente (MangaUpdates > AniList > Open Library) y
 * la edición japonesa sin editorial desaparece si alguna fuente la conoce.
 */
function mergeDrafts(drafts: EditionDraft[]): EditionSuggestion[] {
  const merged = new Map<string, EditionSuggestion>();
  for (const draft of drafts) {
    const key = suggestionKey(draft);
    const existing = merged.get(key);
    if (existing) {
      existing.totalVolumes ??= draft.totalVolumes;
    } else {
      merged.set(key, { ...draft, key });
    }
  }

  const all = [...merged.values()];
  const named = all.filter(
    (s) =>
      s.publisher ||
      !all.some((o) => o.publisher && o.language === s.language && o.format === s.format)
  );
  // Los tomos del original (AniList) son más fiables que contar obras sueltas de Open Library.
  for (const suggestion of named) {
    if (suggestion.language !== 'ja' || !suggestion.publisher) continue;
    const original = all.find((o) => !o.publisher && o.format === suggestion.format);
    if (original?.totalVolumes) suggestion.totalVolumes = original.totalVolumes;
  }

  return named.sort(
    (a, b) =>
      a.format.localeCompare(b.format) ||
      LANGUAGE_ORDER.indexOf(a.language) - LANGUAGE_ORDER.indexOf(b.language)
  );
}
