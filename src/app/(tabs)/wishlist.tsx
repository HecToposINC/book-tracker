import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { ActionButton } from '@/components/library/action-button';
import { EmptyState } from '@/components/library/empty-state';
import { EntryRow } from '@/components/library/entry-row';
import { ScreenHeader } from '@/components/library/screen-header';
import { TabScreen } from '@/components/library/tab-screen';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  editionLabel,
  formatVolumeRanges,
  wishlistEntries,
  type ShelfEntry,
} from '@/features/library/editions';
import { useLibrary } from '@/features/library/library-store';

/** "Panini · Español · Manga: tomos 5-7", o nada si quieres la obra entera. */
function wantedLabel({ edition }: ShelfEntry) {
  if (!edition) return undefined;
  const volumes = edition.wishlistVolumes;
  return `${editionLabel(edition)} · ${edition.format}: ${volumes.length === 1 ? 'tomo' : 'tomos'} ${formatVolumeRanges(volumes)}`;
}

export default function WishlistScreen() {
  const { items, acquireWishlist } = useLibrary();
  // Una fila por edición con tomos deseados, más las obras que quieres enteras.
  const wishlist = wishlistEntries(items);

  return (
    <TabScreen>
      <ScreenHeader
        title="Deseos"
        subtitle={
          wishlist.length > 0
            ? `${wishlist.length} ${wishlist.length === 1 ? 'pendiente' : 'pendientes'} de conseguir`
            : undefined
        }
      />
      <FlatList
        data={wishlist}
        keyExtractor={(entry) => entry.key}
        contentContainerStyle={styles.list}
        renderItem={({ item: entry }) => (
          <EntryRow
            entry={entry.item}
            onPress={() =>
              router.push({
                pathname: '/item/[id]',
                params: entry.edition ? { id: entry.item.id, edition: entry.edition.id } : { id: entry.item.id },
              })
            }
            badge={wantedLabel(entry)}
            trailing={
              <ActionButton
                title="Lo tengo"
                icon={{ ios: 'checkmark', android: 'check' }}
                onPress={() => acquireWishlist(entry.item.id, entry.edition?.id)}
              />
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Tu lista de deseos está vacía"
            message="Marca «Lo quiero» en cualquier libro o manga, o en tomos sueltos, para no olvidarte de comprarlos.">
            <ActionButton
              title="Buscar títulos"
              icon={{ ios: 'magnifyingglass', android: 'search' }}
              onPress={() => router.push('/search')}
            />
          </EmptyState>
        }
      />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: BottomTabInset + Spacing.four,
  },
});
