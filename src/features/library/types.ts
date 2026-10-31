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

/** Ficha guardada en la biblioteca del usuario. */
export type LibraryItem = CatalogEntry & {
  status: ReadingStatus;
  owned: boolean;
  wishlist: boolean;
  /** 0 = sin valorar, 1-5 estrellas. */
  rating: number;
  notes: string;
  ownedVolumes: number[];
  readVolumes: number[];
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
