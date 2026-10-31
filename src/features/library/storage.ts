import Storage from 'expo-sqlite/kv-store';

import type { LibraryItem } from './types';

const KEY = 'library:v1';

export function readLibrary(): LibraryItem[] {
  try {
    const raw = Storage.getItemSync(KEY);
    return raw ? (JSON.parse(raw) as LibraryItem[]) : [];
  } catch {
    return [];
  }
}

export function writeLibrary(items: LibraryItem[]) {
  Storage.setItem(KEY, JSON.stringify(items)).catch((error) => {
    console.warn('No se pudo guardar la biblioteca', error);
  });
}
