import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/library/action-button';
import { EmptyState } from '@/components/library/empty-state';
import { EntryFacts, EntryHeader } from '@/components/library/entry-details';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { fetchEntry, getCachedEntry } from '@/features/library/api/catalog';
import { isAbortError } from '@/features/library/api/http';
import { useLibrary } from '@/features/library/library-context';
import type { CatalogEntry, LibraryItem } from '@/features/library/types';
import { useTheme } from '@/hooks/use-theme';

type AddOptions = Partial<Pick<LibraryItem, 'status' | 'owned' | 'wishlist'>>;

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { getItem, addEntry } = useLibrary();
  const [entry, setEntry] = useState<CatalogEntry | undefined>(() => getCachedEntry(id));
  const [loading, setLoading] = useState(true);

  // Pide el detalle completo (sinopsis, autores) aunque haya una versión en caché.
  useEffect(() => {
    const controller = new AbortController();
    fetchEntry(id, controller.signal)
      .then((full) => full && setEntry(full))
      .catch((error) => {
        if (!isAbortError(error)) console.warn(error);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  if (!entry) {
    return (
      <ThemedView style={styles.centered}>
        {loading ? (
          <ActivityIndicator color={theme.tint} />
        ) : (
          <EmptyState title="No encontrado" message="No se pudo cargar esta ficha." />
        )}
      </ThemedView>
    );
  }

  const inLibrary = Boolean(getItem(entry.id));

  function add(options: AddOptions) {
    if (!entry) return;
    addEntry(entry, options);
    router.replace({ pathname: '/item/[id]', params: { id: entry.id } });
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.content}>
        <EntryHeader entry={entry} />

        <View style={styles.actions}>
          {inLibrary ? (
            <ActionButton
              title="Ver en mi biblioteca"
              icon={{ ios: 'books.vertical', android: 'library_books' }}
              onPress={() => router.replace({ pathname: '/item/[id]', params: { id: entry.id } })}
            />
          ) : (
            <>
              <ActionButton
                title="Añadir a mi colección"
                icon={{ ios: 'plus.circle.fill', android: 'add_circle' }}
                onPress={() => add({ owned: true })}
              />
              <View style={styles.row}>
                <View style={styles.flex}>
                  <ActionButton
                    title="Lo quiero"
                    variant="secondary"
                    icon={{ ios: 'heart', android: 'favorite' }}
                    onPress={() => add({ wishlist: true })}
                  />
                </View>
                <View style={styles.flex}>
                  <ActionButton
                    title="Ya lo leí"
                    variant="secondary"
                    icon={{ ios: 'checkmark.circle', android: 'check_circle' }}
                    onPress={() => add({ status: 'read' })}
                  />
                </View>
              </View>
            </>
          )}
        </View>

        {loading && <ActivityIndicator color={theme.tint} />}
        <EntryFacts entry={entry} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  actions: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
