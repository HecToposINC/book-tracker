import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import { ActionButton } from '@/components/library/action-button';
import { ChipGroup } from '@/components/library/chip-group';
import { EmptyState } from '@/components/library/empty-state';
import { IconButton } from '@/components/library/icon-button';
import { LibraryCard } from '@/components/library/library-card';
import { ScreenHeader } from '@/components/library/screen-header';
import { TabScreen } from '@/components/library/tab-screen';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { shelfEntries } from '@/features/library/editions';
import { useLibrary } from '@/features/library/library-store';
import { STATUS_LABELS, STATUS_ORDER, type MediaKind, type ReadingStatus } from '@/features/library/types';
import { useTheme } from '@/hooks/use-theme';

type KindFilter = MediaKind | 'all';
type StatusFilter = ReadingStatus | 'all' | 'owned';

const KIND_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'book', label: 'Libros' },
  { value: 'manga', label: 'Manga' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'owned', label: 'En colección' },
  ...STATUS_ORDER.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
];

const MIN_CARD_WIDTH = 104;

export default function LibraryScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { items } = useLibrary();
  const [kind, setKind] = useState<KindFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');

  const contentWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const columns = Math.max(3, Math.floor((contentWidth + Spacing.three) / (MIN_CARD_WIDTH + Spacing.three)));
  const cardWidth = (contentWidth - Spacing.three * (columns - 1)) / columns;

  // Una tarjeta por edición; lo que solo está en deseos vive en su propia pestaña.
  const library = shelfEntries(items);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = library.filter(({ item, edition }) => {
    const owned = edition ? edition.ownedVolumes.length > 0 : item.owned;
    const searchable = [item.title, ...item.authors, edition?.publisher ?? ''];
    return (
      (kind === 'all' || item.kind === kind) &&
      (status === 'all' || (status === 'owned' ? owned : item.status === status)) &&
      (!normalizedQuery || searchable.some((text) => text.toLowerCase().includes(normalizedQuery)))
    );
  });

  const subtitle = `${library.length} en tu estantería`;

  return (
    <TabScreen>
      <ScreenHeader
        title="Mi biblioteca"
        subtitle={subtitle}
        actions={
          <>
            <IconButton
              ios="barcode.viewfinder"
              android="barcode_scanner"
              label="Escanear ISBN"
              onPress={() => router.push('/scan')}
            />
            <IconButton
              ios="plus"
              android="add"
              label="Añadir manualmente"
              onPress={() => router.push('/add-manual')}
            />
          </>
        }
      />

      {library.length > 0 && (
        <View style={styles.filters}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Filtrar por título, autor o editorial"
            placeholderTextColor={theme.textSecondary}
            clearButtonMode="while-editing"
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />
          <ChipGroup options={KIND_OPTIONS} value={kind} onChange={setKind} />
          <ChipGroup options={STATUS_OPTIONS} value={status} onChange={setStatus} scrollable />
        </View>
      )}

      <FlatList
        key={columns}
        data={visible}
        numColumns={columns}
        keyExtractor={(entry) => entry.key}
        renderItem={({ item: entry }) => <LibraryCard entry={entry} width={cardWidth} />}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          library.length === 0 ? (
            <EmptyState
              title="Tu biblioteca está vacía"
              message="Busca libros y mangas, escanea el código de barras de un libro o añádelo a mano.">
              <ActionButton
                title="Buscar títulos"
                icon={{ ios: 'magnifyingglass', android: 'search' }}
                onPress={() => router.push('/search')}
              />
            </EmptyState>
          ) : (
            <EmptyState title="Sin resultados" message="Ningún título coincide con los filtros." />
          )
        }
      />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    fontSize: 16,
  },
  columns: {
    gap: Spacing.three,
  },
  list: {
    gap: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
});
