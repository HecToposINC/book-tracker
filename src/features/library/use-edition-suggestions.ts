import { useEffect, useState } from 'react';

import { discoverEditions, getCachedSuggestions, type EditionSuggestion } from './api/editions';
import { isAbortError } from './api/http';
import type { CatalogEntry } from './types';

/** Ediciones encontradas en las APIs para una ficha; `undefined` mientras se buscan. */
export function useEditionSuggestions(entry: CatalogEntry) {
  const [suggestions, setSuggestions] = useState<EditionSuggestion[] | undefined>(() =>
    getCachedSuggestions(entry.id)
  );

  useEffect(() => {
    if (getCachedSuggestions(entry.id)) return;
    const controller = new AbortController();
    discoverEditions(entry, controller.signal)
      .then(setSuggestions)
      .catch((error) => {
        if (isAbortError(error)) return;
        console.warn(error);
        setSuggestions([]);
      });
    return () => controller.abort();
    // Solo se vuelve a buscar si cambia la ficha, no en cada edición del usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

  return suggestions;
}
