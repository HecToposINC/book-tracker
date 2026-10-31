export type MediaKind = 'book' | 'manga';

export type ReadingStatus = 'pending' | 'reading' | 'read' | 'dropped';

export type CatalogSource = 'openlibrary' | 'anilist' | 'manual';

/** Ficha de catálogo tal como llega de una API (o creada a mano). */
export type CatalogEntry = {
  /** Identificador estable: `ol:OL123W`, `isbn:978…`, `al:118586`, `manual:…`. */
  id: string;
  kind: MediaKind;
  source: CatalogSource;
  title: string;
  originalTitle?: string;
  authors: string[];
  coverUrl?: string;
  year?: number;
  publisher?: string;
  isbn?: string;
  pages?: number;
  /** Nº total de tomos de una serie (manga). */
  totalVolumes?: number;
  /** Formato según la fuente: Manga, Novela ligera, One shot… */
  format?: string;
  publicationStatus?: string;
  description?: string;
  genres?: string[];
  /** Puntuación media de la comunidad, 0-100. */
  score?: number;
};

export type EditionLanguage = 'es' | 'en' | 'ja' | 'fr' | 'it' | 'pt' | 'de' | 'other';

/** Edición concreta de una obra (idioma + editorial + formato), con sus propios tomos. */
export type Edition = {
  id: string;
  language: EditionLanguage;
  publisher: string;
  /** Manga, Novela ligera, Libro… */
  format: string;
  /** Tomos publicados en esta edición (puede ir por detrás del original). */
  totalVolumes?: number;
  ownedVolumes: number[];
  readVolumes: number[];
  /** Tomos que quieres conseguir (nunca a la vez que en `ownedVolumes`). */
  wishlistVolumes: number[];
};

/** Ficha guardada en la biblioteca del usuario. */
export type LibraryItem = CatalogEntry & {
  status: ReadingStatus;
  owned: boolean;
  wishlist: boolean;
  /** 0 = sin valorar, 1-5 estrellas. */
  rating: number;
  notes: string;
  editions: Edition[];
  addedAt: number;
  updatedAt: number;
};

export const KIND_LABELS: Record<MediaKind, string> = {
  book: 'Libro',
  manga: 'Manga',
};

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  pending: 'Pendiente',
  reading: 'Leyendo',
  read: 'Leído',
  dropped: 'Abandonado',
};

export const STATUS_ORDER: ReadingStatus[] = ['pending', 'reading', 'read', 'dropped'];
