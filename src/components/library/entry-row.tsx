import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { KIND_LABELS, type CatalogEntry } from '@/features/library/types';
import { useTheme } from '@/hooks/use-theme';

import { Cover } from './cover';

type EntryRowProps = {
  entry: CatalogEntry;
  onPress: () => void;
  /** Texto destacado bajo el título (p. ej. "En tu colección"). */
  badge?: string;
  /** Acción a la derecha de la fila. */
  trailing?: ReactNode;
};

export function EntryRow({ entry, onPress, badge, trailing }: EntryRowProps) {
  const theme = useTheme();
  const details = [
    KIND_LABELS[entry.kind],
    entry.format !== KIND_LABELS[entry.kind] ? entry.format : undefined,
    entry.year?.toString(),
    entry.totalVolumes ? `${entry.totalVolumes} tomos` : undefined,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
      <Cover uri={entry.coverUrl} title={entry.title} width={56} />
      <View style={styles.info}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {entry.title}
        </ThemedText>
        {entry.authors.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {entry.authors.join(', ')}
          </ThemedText>
        )}
        <ThemedText type="code" themeColor="textSecondary">
          {details.join(' · ')}
        </ThemedText>
        {badge && (
          <ThemedText type="code" style={{ color: theme.tint }}>
            {badge}
          </ThemedText>
        )}
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
});
