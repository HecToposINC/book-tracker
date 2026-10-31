import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, TextInput, View } from 'react-native';

import { ChipGroup } from '@/components/library/chip-group';
import { EmptyState } from '@/components/library/empty-state';
import { EntryRow } from '@/components/library/entry-row';
import { IconButton } from '@/components/library/icon-button';
import { ScreenHeader } from '@/components/library/screen-header';
import { TabScreen } from '@/components/library/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  findByIsbn,
  searchCatalog,
  type CatalogSearchResult,
  type SearchFilter,
} from '@/features/library/api/catalog';
import { isAbortError } from '@/features/library/api/http';
import { normalizeIsbn } from '@/features/library/isbn';
import { useLibrary } from '@/features/library/library-store';
import type { CatalogEntry } from '@/features/library/types';
import { useTheme } from '@/hooks/use-theme';

const FILTER_OPTIONS: { value: SearchFilter; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'manga', label: 'Manga' },
  { value: 'book', label: 'Libros' },
];

const DEBOUNCE_MS = 450;

type SearchState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'done'; result: CatalogSearchResult }
  | { phase: 'error'; message: string };

export default function SearchScreen() {
  const theme = useTheme();
  const { getItem } = useLibrary();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [searchState, setState] = useState<SearchState>({ phase: 'idle' });
  const trimmed = query.trim();
  // Con menos de 2 caracteres no se busca: el estado guardado se ignora.
  const state: SearchState = trimmed.length < 2 ? { phase: 'idle' } : searchState;

  useEffect(() => {
    if (trimmed.length < 2) return;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setState({ phase: 'loading' });
      try {
        const isbn = normalizeIsbn(trimmed);
        if (isbn) {
          const entry = await findByIsbn(isbn, controller.signal);
          setState({
            phase: 'done',
            result: { books: entry ? [entry] : [], manga: [], errors: [] },
          });
          return;
        }
        const result = await searchCatalog(trimmed, filter, controller.signal);
        setState({ phase: 'done', result });
      } catch (error) {
        if (isAbortError(error)) return;
        setState({ phase: 'error', message: 'No se pudo completar la búsqueda. Revisa tu conexión.' });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmed, filter]);

  const sections =
    state.phase === 'done'
      ? [
          { title: 'Manga · AniList', data: state.result.manga },
          { title: 'Libros · Open Library', data: state.result.books },
        ].filter((section) => section.data.length > 0)
      : [];

  function openEntry(entry: CatalogEntry) {
    if (getItem(entry.id)) {
      router.push({ pathname: '/item/[id]', params: { id: entry.id } });
    } else {
      router.push({ pathname: '/result', params: { id: entry.id } });
    }
  }

  return (
    <TabScreen>
      <ScreenHeader
        title="Buscar"
        subtitle="Libros, mangas o un ISBN"
        actions={
          <IconButton
            ios="barcode.viewfinder"
            android="barcode_scanner"
            label="Escanear ISBN"
            onPress={() => router.push('/scan')}
          />
        }
      />

      <View style={styles.controls}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Título, autor o ISBN"
          placeholderTextColor={theme.textSecondary}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />
        <ChipGroup options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
      </View>

      {state.phase === 'loading' && <ActivityIndicator style={styles.spinner} color={theme.tint} />}

      {state.phase === 'done' &&
        state.result.errors.map((error) => (
          <ThemedText key={error} type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        ))}

      <SectionList
        sections={sections}
        keyExtractor={(entry) => entry.id}
        stickySectionHeadersEnabled={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
            {section.title}
          </ThemedText>
        )}
        renderItem={({ item }) => (
          <EntryRow
            entry={item}
            onPress={() => openEntry(item)}
            badge={getItem(item.id) ? 'En tu biblioteca' : undefined}
          />
        )}
        ListEmptyComponent={
          state.phase === 'error' ? (
            <EmptyState title="Algo ha fallado" message={state.message} />
          ) : state.phase === 'done' ? (
            <EmptyState
              title="Sin resultados"
              message="Prueba con otro título o añádelo manualmente desde tu biblioteca."
            />
          ) : state.phase === 'idle' ? (
            <EmptyState
              title="Encuentra tu próxima lectura"
              message="Los mangas vienen de AniList y los libros de Open Library. También puedes pegar un ISBN."
            />
          ) : null
        }
      />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  controls: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    fontSize: 16,
  },
  spinner: {
    paddingVertical: Spacing.two,
  },
  list: {
    paddingBottom: BottomTabInset + Spacing.four,
  },
  sectionHeader: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
});
