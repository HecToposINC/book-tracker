import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { readLibrary, writeLibrary } from './storage';
import type { CatalogEntry, LibraryItem } from './types';

type AddOptions = Partial<Pick<LibraryItem, 'status' | 'owned' | 'wishlist'>>;

type VolumeField = 'ownedVolumes' | 'readVolumes';

type LibraryContextValue = {
  items: LibraryItem[];
  getItem: (id: string) => LibraryItem | undefined;
  addEntry: (entry: CatalogEntry, options?: AddOptions) => void;
  updateItem: (id: string, patch: Partial<LibraryItem>) => void;
  toggleVolume: (id: string, volume: number, field: VolumeField) => void;
  removeItem: (id: string) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

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

export function LibraryProvider({ children }: { children: ReactNode }) {
  // En web el HTML se pre-renderiza sin localStorage, así que se carga tras montar.
  const [items, setItems] = useState<LibraryItem[]>(() =>
    Platform.OS === 'web' ? [] : readLibrary()
  );

  useEffect(() => {
    if (Platform.OS === 'web') setItems(readLibrary());
  }, []);

  function mutate(updater: (current: LibraryItem[]) => LibraryItem[]) {
    setItems((current) => {
      const next = updater(current);
      writeLibrary(next);
      return next;
    });
  }

  function patchItem(id: string, change: (item: LibraryItem) => LibraryItem) {
    mutate((current) =>
      current.map((item) => (item.id === id ? { ...change(item), updatedAt: Date.now() } : item))
    );
  }

  const value: LibraryContextValue = {
    items,
    getItem: (id) => items.find((item) => item.id === id),
    addEntry: (entry, options) => {
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
    updateItem: (id, patch) => patchItem(id, (item) => ({ ...item, ...patch })),
    toggleVolume: (id, volume, field) =>
      patchItem(id, (item) => {
        const volumes = item[field].includes(volume)
          ? item[field].filter((v) => v !== volume)
          : [...item[field], volume].sort((a, b) => a - b);
        return syncVolumes({ ...item, [field]: volumes });
      }),
    removeItem: (id) => mutate((current) => current.filter((item) => item.id !== id)),
  };

  return <LibraryContext value={value}>{children}</LibraryContext>;
}

export function useLibrary() {
  const context = use(LibraryContext);
  if (!context) throw new Error('useLibrary debe usarse dentro de <LibraryProvider>');
  return context;
}
