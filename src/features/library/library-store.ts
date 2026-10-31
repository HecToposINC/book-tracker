import { useSyncExternalStore } from 'react';

import { readLibrary, writeLibrary } from './storage';
import type { CatalogEntry, LibraryItem } from './types';

type AddOptions = Partial<Pick<LibraryItem, 'status' | 'owned' | 'wishlist'>>;
type VolumeField = 'ownedVolumes' | 'readVolumes';

// Store externo: se lee del almacenamiento la primera vez que se pide.
let items: LibraryItem[] | null = null;
const listeners = new Set<() => void>();
const EMPTY: LibraryItem[] = [];

function getSnapshot() {
  items ??= readLibrary();
  return items;
}

// En el pre-render web no hay almacenamiento: se hidrata vacío y luego se pinta el real.
function getServerSnapshot() {
  return EMPTY;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function mutate(updater: (current: LibraryItem[]) => LibraryItem[]) {
  items = updater(getSnapshot());
  writeLibrary(items);
  listeners.forEach((listener) => listener());
}

function patchItem(id: string, change: (item: LibraryItem) => LibraryItem) {
  mutate((current) =>
    current.map((item) => (item.id === id ? { ...change(item), updatedAt: Date.now() } : item))
  );
}

/** Ajusta campos derivados (posesión, estado de lectura) tras cambiar los tomos. */
function syncVolumes(item: LibraryItem): LibraryItem {
  const next = { ...item };
  if (next.ownedVolumes.length > 0) {
    next.owned = true;
    next.wishlist = false;
  }
  const read = next.readVolumes.length;
  if (next.totalVolumes && read >= next.totalVolumes) next.status = 'read';
  else if (read > 0 && (next.status === 'pending' || next.status === 'read')) next.status = 'reading';
  return next;
}

const actions = {
  addEntry(entry: CatalogEntry, options?: AddOptions) {
    const now = Date.now();
    const item: LibraryItem = {
      ...entry,
      status: options?.status ?? 'pending',
      owned: options?.owned ?? false,
      wishlist: options?.wishlist ?? false,
      rating: 0,
      notes: '',
      ownedVolumes: [],
      readVolumes: [],
      addedAt: now,
      updatedAt: now,
    };
    mutate((current) =>
      current.some((existing) => existing.id === entry.id) ? current : [item, ...current]
    );
  },
  updateItem(id: string, patch: Partial<LibraryItem>) {
    patchItem(id, (item) => ({ ...item, ...patch }));
  },
  toggleVolume(id: string, volume: number, field: VolumeField) {
    patchItem(id, (item) => {
      const volumes = item[field].includes(volume)
        ? item[field].filter((v) => v !== volume)
        : [...item[field], volume].sort((a, b) => a - b);
      return syncVolumes({ ...item, [field]: volumes });
    });
  },
  removeItem(id: string) {
    mutate((current) => current.filter((item) => item.id !== id));
  },
};

export function useLibrary() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    items: current,
    getItem: (id: string) => current.find((item) => item.id === id),
    ...actions,
  };
}
