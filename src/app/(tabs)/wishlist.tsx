import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { ActionButton } from '@/components/library/action-button';
import { EmptyState } from '@/components/library/empty-state';
import { EntryRow } from '@/components/library/entry-row';
import { ScreenHeader } from '@/components/library/screen-header';
import { TabScreen } from '@/components/library/tab-screen';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { countVolumes, editionLabel, formatVolumeRanges } from '@/features/library/editions';
import { useLibrary } from '@/features/library/library-store';
import type { LibraryItem } from '@/features/library/types';

/** "Kamite · Español: tomo 5 · Yen On · Inglés: tomos 6-8" */
function wantedVolumesLabel(item: LibraryItem) {
  return item.editions
    .filter((edition) => edition.wishlistVolumes.length > 0)
    .map(
      (edition) =>
        `${editionLabel(edition)}: ${edition.wishlistVolumes.length === 1 ? 'tomo' : 'tomos'} ${formatVolumeRanges(edition.wishlistVolumes)}`
    )
    .join(' · ');
}

export default function WishlistScreen() {
  const { items, acquireWishlist } = useLibrary();
  // Obras que quieres enteras y obras de las que te falta algún tomo.
  const wishlist = items.filter(
    (item) => (item.wishlist && !item.owned) || countVolumes(item, 'wishlistVolumes') > 0
  );

  return (
    <TabScreen>
      <ScreenHeader
        title="Deseos"
        subtitle={
          wishlist.length > 0
            ? `${wishlist.length} ${wishlist.length === 1 ? 'título pendiente' : 'títulos pendientes'} de conseguir`
            : undefined
        }
      />
      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <EntryRow
            entry={item}
            onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
            badge={wantedVolumesLabel(item) || undefined}
            trailing={
              <ActionButton
                title="Lo tengo"
                icon={{ ios: 'checkmark', android: 'check' }}
                onPress={() => acquireWishlist(item.id)}
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
