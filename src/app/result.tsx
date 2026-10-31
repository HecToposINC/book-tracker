import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/library/action-button';
import { EditionForm } from '@/components/library/edition-form';
import { EditionSuggestions } from '@/components/library/edition-suggestions';
import { EmptyState } from '@/components/library/empty-state';
import { EntryFacts, EntryHeader } from '@/components/library/entry-details';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { fetchEntry, getCachedEntry } from '@/features/library/api/catalog';
import { isAbortError } from '@/features/library/api/http';
import {
  defaultFormat,
  editionsOfWork,
  isSeries,
  type EditionDraft,
} from '@/features/library/editions';
import { useLibrary } from '@/features/library/library-store';
import { useEditionSuggestions } from '@/features/library/use-edition-suggestions';
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

  if (isSeries(entry)) {
    return (
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <EntryHeader entry={entry} />
          <SeriesEditions entry={entry} />
          {loading && <ActivityIndicator color={theme.tint} />}
          <EntryFacts entry={entry} />
        </View>
      </ScrollView>
    );
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

/**
 * En una serie lo que se añade es la edición (idioma + editorial + formato): se pueden añadir
 * varias, aunque la obra ya esté en la biblioteca.
 */
function SeriesEditions({ entry }: { entry: CatalogEntry }) {
  const { items, getItem, addEntry, addEdition, updateItem } = useLibrary();
  const suggestions = useEditionSuggestions(entry);
  const [manual, setManual] = useState(false);
  const item = getItem(entry.id);

  function addDraft(draft: EditionDraft) {
    if (!getItem(entry.id)) addEntry(entry);
    addEdition(entry.id, draft);
    setManual(false);
  }

  return (
    <View style={styles.actions}>
      {item && (
        <ActionButton
          title={`Ver en mi biblioteca (${item.editions.length} ${item.editions.length === 1 ? 'edición' : 'ediciones'})`}
          icon={{ ios: 'books.vertical', android: 'library_books' }}
          onPress={() => router.replace({ pathname: '/item/[id]', params: { id: entry.id } })}
        />
      )}

      <Block title="Elige tus ediciones">
        <ThemedText type="small" themeColor="textSecondary">
          Añade cada edición que tengas o quieras (puedes añadir varias, en distintos idiomas o
          formatos). Después marcas sus tomos en tu biblioteca.
        </ThemedText>
        <EditionSuggestions
          suggestions={suggestions}
          editions={editionsOfWork(items, entry)}
          onAdd={addDraft}
        />
        {manual ? (
          <EditionForm
            initial={{
              language: 'es',
              publisher: '',
              format: defaultFormat(entry),
              totalVolumes: entry.totalVolumes,
            }}
            submitLabel="Añadir edición"
            onCancel={() => setManual(false)}
            onSubmit={addDraft}
          />
        ) : (
          <ActionButton
            title="¿No está la tuya? Añadir a mano"
            variant="secondary"
            icon={{ ios: 'plus', android: 'add' }}
            onPress={() => setManual(true)}
          />
        )}
      </Block>

      {!item?.editions.length && (
        <ActionButton
          title={item?.wishlist ? 'En tu lista de deseos' : 'La quiero, aún sin elegir edición'}
          variant="secondary"
          icon={{ ios: 'heart', android: 'favorite' }}
          disabled={item?.wishlist}
          onPress={() => (item ? updateItem(entry.id, { wishlist: true }) : addEntry(entry, { wishlist: true }))}
        />
      )}
    </View>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.actions}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title.toUpperCase()}
      </ThemedText>
      {children}
    </View>
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
