import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { editionShortLabel, type ShelfEntry } from '@/features/library/editions';
import { STATUS_LABELS } from '@/features/library/types';

import { Cover } from './cover';

type LibraryCardProps = {
  entry: ShelfEntry;
  width: number;
};

function progressLabel({ item, edition }: ShelfEntry) {
  if (!edition) return STATUS_LABELS[item.status];
  const total = edition.totalVolumes ? `/${edition.totalVolumes}` : '';
  return `${edition.format} · ${edition.ownedVolumes.length}${total}`;
}

/** Tarjeta de la estantería: una por edición (Panini y Viz de la misma serie van por separado). */
export function LibraryCard({ entry, width }: LibraryCardProps) {
  const { item, edition } = entry;
  const params = edition ? { id: item.id, edition: edition.id } : { id: item.id };

  return (
    // El ancho va en un View: en web `Link asChild` descarta los estilos en forma de función.
    <View style={{ width }}>
      <Link href={{ pathname: '/item/[id]', params }} asChild>
        <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Cover uri={item.coverUrl} title={item.title} width={width} />
          <View style={styles.meta}>
            <ThemedText type="small" numberOfLines={2}>
              {item.title}
            </ThemedText>
            {edition && (
              <ThemedText type="code" numberOfLines={1}>
                {editionShortLabel(edition)}
              </ThemedText>
            )}
            <ThemedText type="code" themeColor="textSecondary" numberOfLines={1}>
              {progressLabel(entry)}
            </ThemedText>
          </View>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  meta: {
    paddingTop: Spacing.one,
    gap: Spacing.half,
  },
});
