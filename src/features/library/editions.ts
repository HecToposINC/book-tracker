import type { CatalogEntry, Edition, EditionLanguage, LibraryItem } from './types';

export const LANGUAGE_LABELS: Record<EditionLanguage, string> = {
  es: 'Español',
  en: 'Inglés',
  ja: 'Japonés',
  fr: 'Francés',
  it: 'Italiano',
  pt: 'Portugués',
  de: 'Alemán',
  other: 'Otro',
};

export const EDITION_FORMATS = ['Manga', 'Novela ligera', 'Libro', 'Cómic'];

/** Editoriales habituales por idioma, para elegirlas con un toque. */
export const PUBLISHER_SUGGESTIONS: Partial<Record<EditionLanguage, string[]>> = {
  es: ['Kamite', 'Panini', 'Ivrea', 'Norma', 'Planeta Cómic', 'Distrito Manga', 'Milky Way', 'Editorial Vid'],
  en: ['Yen Press', 'Yen On', 'Viz Media', 'Kodansha USA', 'Seven Seas', 'J-Novel Club', 'Dark Horse'],
  ja: ['Kadokawa', 'Shueisha', 'Kodansha', 'Shogakukan', 'Square Enix', 'Hakusensha'],
  fr: ['Glénat', 'Kana', 'Pika', 'Ki-oon', 'Kurokawa'],
  it: ['Star Comics', 'Planet Manga', 'J-POP'],
  pt: ['Panini', 'JBC', 'NewPOP'],
  de: ['Carlsen', 'Tokyopop', 'Egmont'],
};

// Orden importante: "kodansha usa" debe resolverse antes que "kodansha".
const PUBLISHER_LANGUAGES: [RegExp, EditionLanguage][] = [
  [/ivrea|panini|kamite|norma|planeta|distrito manga|milky way|editorial vid|ecc|arechi|salamandra|minotauro|alfaguara|debolsillo/, 'es'],
  [/yen press|yen on|viz|seven seas|kodansha (usa|comics)|j-novel|dark horse|vertical|one peace|bloomsbury|scholastic|del rey/, 'en'],
  [/kadokawa|shueisha|kodansha|shogakukan|square enix|hakusensha|fujimi|media factory|ascii media|hayakawa/, 'ja'],
  [/glénat|glenat|kana|pika|ki-oon|kurokawa|ofelbe/, 'fr'],
  [/star comics|planet manga|j-pop/, 'it'],
  [/jbc|newpop/, 'pt'],
  [/carlsen|egmont/, 'de'],
];

/** Idioma de una editorial conocida (Ivrea → español, Yen Press → inglés…). */
export function languageForPublisher(publisher: string): EditionLanguage | undefined {
  const name = publisher.toLowerCase();
  return PUBLISHER_LANGUAGES.find(([pattern]) => pattern.test(name))?.[1];
}

/** Clave para comparar editoriales: "Yen Press LLC" = "Yen Press", "Editorial Ivrea" = "Ivrea". */
export function normalizePublisher(publisher: string) {
  const name = publisher.trim().toLowerCase();
  const latin = name
    .replace(/\b(llc|inc|ltd|editorial|ediciones|publishing|shoten|gmbh)\b/g, '')
    .replace(/[^a-z0-9áéíóúñü]/g, '');
  // Nombres en japonés u otros alfabetos se comparan tal cual.
  return latin || name;
}

export function sameEdition(a: EditionDraft, b: EditionDraft) {
  return (
    a.language === b.language &&
    a.format === b.format &&
    normalizePublisher(a.publisher) === normalizePublisher(b.publisher)
  );
}

export type EditionDraft = Pick<Edition, 'language' | 'publisher' | 'format' | 'totalVolumes'>;

export function defaultFormat(entry: CatalogEntry) {
  if (entry.format && EDITION_FORMATS.includes(entry.format)) return entry.format;
  return entry.kind === 'manga' ? 'Manga' : 'Libro';
}

export function createEdition(draft: EditionDraft): Edition {
  return {
    ...draft,
    id: `ed:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    ownedVolumes: [],
    readVolumes: [],
    wishlistVolumes: [],
  };
}

export function isEditionComplete(edition: Edition) {
  return Boolean(edition.totalVolumes) && edition.readVolumes.length >= (edition.totalVolumes ?? 0);
}

export type VolumeField = 'ownedVolumes' | 'readVolumes' | 'wishlistVolumes';

export function countVolumes(item: LibraryItem, field: VolumeField) {
  return item.editions.reduce((sum, edition) => sum + edition[field].length, 0);
}

/** Serie de varios tomos (manga, sagas…): la posesión y los deseos se llevan por tomo. */
export function isSeries(entry: CatalogEntry & { editions?: Edition[] }) {
  return (
    entry.kind === 'manga' ||
    (entry.totalVolumes ?? 0) > 1 ||
    (entry.editions ?? []).some((edition) => (edition.totalVolumes ?? 0) > 1)
  );
}

/** De esta edición solo quieres tomos: va a Deseos, no a la estantería. */
export function isEditionOnlyWanted(edition: Edition) {
  return (
    edition.ownedVolumes.length === 0 &&
    edition.readVolumes.length === 0 &&
    edition.wishlistVolumes.length > 0
  );
}

/** Lo que se ve en la estantería: cada edición por separado, o la obra si no tiene ediciones. */
export type ShelfEntry = { key: string; item: LibraryItem; edition?: Edition };

export function shelfEntries(items: LibraryItem[]): ShelfEntry[] {
  return items.flatMap<ShelfEntry>((item) => {
    if (item.editions.length === 0) return isOnlyWanted(item) ? [] : [{ key: item.id, item }];
    return item.editions
      .filter((edition) => !isEditionOnlyWanted(edition))
      .map((edition) => ({ key: `${item.id}/${edition.id}`, item, edition }));
  });
}

/** Lo que se ve en Deseos: obras que quieres enteras y ediciones con tomos deseados. */
export function wishlistEntries(items: LibraryItem[]): ShelfEntry[] {
  return items.flatMap<ShelfEntry>((item) => {
    const whole: ShelfEntry[] = item.wishlist && !item.owned ? [{ key: item.id, item }] : [];
    const editions = item.editions
      .filter((edition) => edition.wishlistVolumes.length > 0)
      .map((edition) => ({ key: `${item.id}/${edition.id}`, item, edition }));
    return [...whole, ...editions];
  });
}

/** Misma obra en otra ficha (p. ej. el manga y la novela ligera de Konosuba comparten título). */
function isSameWork(a: CatalogEntry, b: CatalogEntry) {
  const titles = (entry: CatalogEntry) =>
    [entry.title, entry.originalTitle].filter((t): t is string => Boolean(t)).map((t) => t.toLowerCase());
  const other = titles(b);
  return a.id === b.id || titles(a).some((title) => other.includes(title));
}

/** Ediciones que ya tienes de esta obra, estén en esta ficha o en la de otro formato. */
export function editionsOfWork(items: LibraryItem[], entry: CatalogEntry) {
  return items.filter((item) => isSameWork(item, entry)).flatMap((item) => item.editions);
}

/** "Panini · ES" para mostrar la edición en espacios pequeños. */
export function editionShortLabel(edition: Edition) {
  const language = edition.language === 'other' ? '' : edition.language.toUpperCase();
  return [edition.publisher || 'Sin editorial', language].filter(Boolean).join(' · ');
}

/** Solo está en deseos: no tienes ni has leído nada, pero quieres la obra o algún tomo. */
export function isOnlyWanted(item: LibraryItem) {
  return (
    !item.owned &&
    countVolumes(item, 'readVolumes') === 0 &&
    (item.wishlist || countVolumes(item, 'wishlistVolumes') > 0)
  );
}

/** [1, 2, 3, 5, 7, 8] → "1-3, 5, 7-8" */
export function formatVolumeRanges(volumes: number[]) {
  const ranges: string[] = [];
  let start = volumes[0];
  for (let i = 1; i <= volumes.length; i++) {
    if (volumes[i] === volumes[i - 1] + 1) continue;
    const end = volumes[i - 1];
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    start = volumes[i];
  }
  return ranges.join(', ');
}

export function editionLabel(edition: Edition) {
  return [edition.publisher || 'Editorial sin indicar', LANGUAGE_LABELS[edition.language]].join(' · ');
}

type LegacyItem = Omit<LibraryItem, 'editions'> & {
  editions?: Edition[];
  ownedVolumes?: number[];
  readVolumes?: number[];
};

/** Migra fichas guardadas antes de las ediciones: los tomos sueltos pasan a una edición. */
export function normalizeItem(stored: LegacyItem): LibraryItem {
  const { ownedVolumes = [], readVolumes = [], editions, ...item } = stored;
  // Las ediciones anteriores a los tomos deseados no tienen ese campo.
  if (Array.isArray(editions)) {
    return { ...item, editions: editions.map((edition) => ({ ...edition, wishlistVolumes: edition.wishlistVolumes ?? [] })) };
  }
  if (ownedVolumes.length === 0 && readVolumes.length === 0) return { ...item, editions: [] };

  const edition = createEdition({
    language: 'other',
    publisher: item.publisher ?? '',
    format: defaultFormat(item),
    totalVolumes: item.totalVolumes,
  });
  return { ...item, editions: [{ ...edition, ownedVolumes, readVolumes }] };
}
