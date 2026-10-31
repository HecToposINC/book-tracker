import { router } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { ActionButton } from '@/components/library/action-button';
import { EmptyState } from '@/components/library/empty-state';
import { EntryRow } from '@/components/library/entry-row';
import { ScreenHeader } from '@/components/library/screen-header';
import { TabScreen } from '@/components/library/tab-screen';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLibrary } from '@/features/library/library-context';

export default function WishlistScreen() {
  const { items, updateItem } = useLibrary();
  const wishlist = items.filter((item) => item.wishlist && !item.owned);

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
            trailing={
              <ActionButton
                title="Lo tengo"
                icon={{ ios: 'checkmark', android: 'check' }}
                onPress={() => updateItem(item.id, { owned: true, wishlist: false })}
              />
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Tu lista de deseos está vacía"
            message="Marca «Lo quiero» en cualquier libro o manga para no olvidarte de comprarlo.">
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
