import { useSyncExternalStore } from 'react';

import {
  createEdition,
  isEditionComplete,
  isSeries,
  normalizeItem,
  type EditionDraft,
  type VolumeField,
} from './editions';
import { readLibrary, writeLibrary } from './storage';
import type { CatalogEntry, Edition, LibraryItem } from './types';

type AddOptions = Partial<Pick<LibraryItem, 'status' | 'owned' | 'wishlist'>>;

// Store externo: se lee del almacenamiento la primera vez que se pide.
let items: LibraryItem[] | null = null;
const listeners = new Set<() => void>();
const EMPTY: LibraryItem[] = [];

function getSnapshot() {
  items ??= readLibrary().map(normalizeItem);
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
function syncVolumes(item: LibraryItem, field: VolumeField): LibraryItem {
  const next = { ...item };
  const anyOwned = next.editions.some((edition) => edition.ownedVolumes.length > 0);
  if (isSeries(next)) {
    // En series no hay interruptores de obra completa: todo sale de los tomos marcados.
    next.owned = anyOwned;
    if (anyOwned || next.editions.some((edition) => edition.wishlistVolumes.length > 0)) {
      next.wishlist = false;
    }
  } else if (anyOwned) {
    next.owned = true;
    next.wishlist = false;
  }
  if (field === 'readVolumes') {
    const anyRead = next.editions.some((edition) => edition.readVolumes.length > 0);
    if (next.editions.some(isEditionComplete)) next.status = 'read';
    else if (next.status === 'read' || (anyRead && next.status === 'pending')) next.status = 'reading';
  }
  return next;
}

function patchEdition(id: string, editionId: string, change: (edition: Edition) => Edition) {
  patchItem(id, (item) => ({
    ...item,
    editions: item.editions.map((edition) => (edition.id === editionId ? change(edition) : edition)),
  }));
}

/** Tener y querer un tomo se excluyen: al marcar uno se quita del otro. */
const EXCLUSIVE: Partial<Record<VolumeField, VolumeField>> = {
  ownedVolumes: 'wishlistVolumes',
  wishlistVolumes: 'ownedVolumes',
};

function withVolumes(edition: Edition, field: VolumeField, volumes: number[]): Edition {
  const next = { ...edition, [field]: volumes };
  const other = EXCLUSIVE[field];
  if (other) next[other] = next[other].filter((v) => !volumes.includes(v));
  return next;
}

function changeVolumes(
  id: string,
  editionId: string,
  field: VolumeField,
  change: (edition: Edition) => number[]
) {
  patchItem(id, (item) =>
    syncVolumes(
      {
        ...item,
        editions: item.editions.map((edition) =>
          edition.id === editionId ? withVolumes(edition, field, change(edition)) : edition
        ),
      },
      field
    )
  );
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
      editions: [],
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
  addEdition(id: string, draft: EditionDraft) {
    patchItem(id, (item) => ({ ...item, editions: [...item.editions, createEdition(draft)] }));
  },
  /** Cambia los datos de una edición; al reducir los tomos se descartan los que sobran. */
  updateEdition(id: string, editionId: string, draft: Partial<EditionDraft>) {
    patchEdition(id, editionId, (edition) => {
      const next = { ...edition, ...draft };
      const total = next.totalVolumes;
      if (!total) return next;
      return {
        ...next,
        ownedVolumes: next.ownedVolumes.filter((v) => v <= total),
        readVolumes: next.readVolumes.filter((v) => v <= total),
        wishlistVolumes: next.wishlistVolumes.filter((v) => v <= total),
      };
    });
  },
  removeEdition(id: string, editionId: string) {
    patchItem(id, (item) =>
      syncVolumes(
        { ...item, editions: item.editions.filter((edition) => edition.id !== editionId) },
        'ownedVolumes'
      )
    );
  },
  toggleVolume(id: string, editionId: string, volume: number, field: VolumeField) {
    changeVolumes(id, editionId, field, (edition) =>
      edition[field].includes(volume)
        ? edition[field].filter((v) => v !== volume)
        : [...edition[field], volume].sort((a, b) => a - b)
    );
  },
  /** Marca todos los tomos (en deseos, solo los que no tienes) o ninguno. */
  setAllVolumes(id: string, editionId: string, field: VolumeField, all: boolean) {
    changeVolumes(id, editionId, field, (edition) => {
      if (!all) return [];
      const volumes = Array.from({ length: edition.totalVolumes ?? 0 }, (_, i) => i + 1);
      return field === 'wishlistVolumes'
        ? volumes.filter((v) => !edition.ownedVolumes.includes(v))
        : volumes;
    });
  },
  /** Ya tienes lo que querías: los tomos deseados pasan a la colección. */
  acquireWishlist(id: string) {
    patchItem(id, (item) => ({
      ...item,
      owned: true,
      wishlist: false,
      editions: item.editions.map((edition) => ({
        ...edition,
        ownedVolumes: [...edition.ownedVolumes, ...edition.wishlistVolumes].sort((a, b) => a - b),
        wishlistVolumes: [],
      })),
    }));
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
