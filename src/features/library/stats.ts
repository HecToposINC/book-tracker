import { countVolumes, isOnlyWanted } from './editions';
import { STATUS_ORDER, type LibraryItem, type ReadingStatus } from './types';

export type LibraryStats = {
  total: number;
  books: number;
  manga: number;
  owned: number;
  wishlist: number;
  volumesOwned: number;
  volumesRead: number;
  pagesRead: number;
  averageRating: number | null;
  byStatus: { status: ReadingStatus; count: number }[];
  topAuthors: { name: string; count: number }[];
};

export function computeStats(items: LibraryItem[]): LibraryStats {
  const tracked = items.filter((item) => !isOnlyWanted(item));
  const rated = items.filter((item) => item.rating > 0);
  const authorCounts = new Map<string, number>();
  for (const item of tracked) {
    for (const author of item.authors) {
      authorCounts.set(author, (authorCounts.get(author) ?? 0) + 1);
    }
  }

  return {
    total: tracked.length,
    books: tracked.filter((item) => item.kind === 'book').length,
    manga: tracked.filter((item) => item.kind === 'manga').length,
    owned: items.filter((item) => item.owned).length,
    // Títulos que quieres enteros o de los que te falta algún tomo.
    wishlist: items.filter(
      (item) => (item.wishlist && !item.owned) || countVolumes(item, 'wishlistVolumes') > 0
    ).length,
    // Se cuentan los tomos marcados en todas las ediciones; un libro sin ediciones cuenta como uno.
    volumesOwned: items.reduce(
      (sum, item) =>
        sum +
        (item.editions.length > 0
          ? countVolumes(item, 'ownedVolumes')
          : item.kind === 'book' && item.owned
            ? 1
            : 0),
      0
    ),
    volumesRead: items.reduce(
      (sum, item) =>
        sum +
        (item.editions.length > 0
          ? countVolumes(item, 'readVolumes')
          : item.kind === 'book' && item.status === 'read'
            ? 1
            : 0),
      0
    ),
    pagesRead: items
      .filter((item) => item.kind === 'book' && item.status === 'read')
      .reduce((sum, item) => sum + (item.pages ?? 0), 0),
    averageRating:
      rated.length > 0 ? rated.reduce((sum, item) => sum + item.rating, 0) / rated.length : null,
    byStatus: STATUS_ORDER.map((status) => ({
      status,
      count: tracked.filter((item) => item.status === status).length,
    })),
    topAuthors: [...authorCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}
