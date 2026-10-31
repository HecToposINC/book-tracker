import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { STATUS_LABELS, type LibraryItem } from '@/features/library/types';

import { Cover } from './cover';

type LibraryCardProps = {
  item: LibraryItem;
  width: number;
};

function progressLabel(item: LibraryItem) {
  if (item.kind === 'manga') {
    const total = item.totalVolumes ? `/${item.totalVolumes}` : '';
    return `${item.ownedVolumes.length}${total} tomos`;
  }
  return STATUS_LABELS[item.status];
}

export function LibraryCard({ item, width }: LibraryCardProps) {
  return (
    <Link href={{ pathname: '/item/[id]', params: { id: item.id } }} asChild>
      <Pressable style={({ pressed }) => [{ width, opacity: pressed ? 0.7 : 1 }]}>
        <Cover uri={item.coverUrl} title={item.title} width={width} />
        <View style={styles.meta}>
          <ThemedText type="small" numberOfLines={2}>
            {item.title}
          </ThemedText>
          <ThemedText type="code" themeColor="textSecondary" numberOfLines={1}>
            {progressLabel(item)}
          </ThemedText>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  meta: {
    paddingTop: Spacing.one,
    gap: Spacing.half,
  },
});
