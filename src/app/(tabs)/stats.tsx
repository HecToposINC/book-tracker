import { ScrollView, StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/library/screen-header';
import { StatusBreakdown } from '@/components/library/status-breakdown';
import { TabScreen } from '@/components/library/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLibrary } from '@/features/library/library-store';
import { computeStats } from '@/features/library/stats';

const numberFormat = new Intl.NumberFormat('es');

export default function StatsScreen() {
  const { items } = useLibrary();
  const stats = computeStats(items);

  const tiles = [
    { label: 'Títulos', value: numberFormat.format(stats.total) },
    { label: 'Libros', value: numberFormat.format(stats.books) },
    { label: 'Series de manga', value: numberFormat.format(stats.manga) },
    { label: 'Tomos en colección', value: numberFormat.format(stats.volumesOwned) },
    { label: 'Tomos leídos', value: numberFormat.format(stats.volumesRead) },
    { label: 'Páginas leídas', value: numberFormat.format(stats.pagesRead) },
    { label: 'En deseos', value: numberFormat.format(stats.wishlist) },
    {
      label: 'Valoración media',
      value: stats.averageRating === null ? '–' : `${stats.averageRating.toFixed(1)} ★`,
    },
  ];

  return (
    <TabScreen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Estadísticas" subtitle="Tu colección en números" />

        <View style={styles.tiles}>
          {tiles.map((tile) => (
            <ThemedView key={tile.label} type="backgroundElement" style={styles.tile}>
              <ThemedText type="small" themeColor="textSecondary">
                {tile.label}
              </ThemedText>
              <ThemedText style={styles.tileValue}>{tile.value}</ThemedText>
            </ThemedView>
          ))}
        </View>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Estado de lectura</ThemedText>
          <StatusBreakdown data={stats.byStatus} />
        </ThemedView>

        {stats.topAuthors.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Autores más presentes</ThemedText>
            {stats.topAuthors.map((author) => (
              <View key={author.name} style={styles.authorRow}>
                <ThemedText type="small" style={styles.flex} numberOfLines={1}>
                  {author.name}
                </ThemedText>
                <ThemedText type="smallBold">{author.count}</ThemedText>
              </View>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  tileValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 600,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  authorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
