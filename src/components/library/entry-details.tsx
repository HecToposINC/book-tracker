import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { KIND_LABELS, type CatalogEntry } from '@/features/library/types';
import { useTheme } from '@/hooks/use-theme';

import { Cover } from './cover';

const SOURCE_LABELS: Record<CatalogEntry['source'], string> = {
  openlibrary: 'Open Library',
  anilist: 'AniList',
  manual: 'Añadido a mano',
};

export function EntryHeader({ entry }: { entry: CatalogEntry }) {
  const facts = [
    entry.format ?? KIND_LABELS[entry.kind],
    entry.year?.toString(),
    entry.publicationStatus,
    entry.totalVolumes ? `${entry.totalVolumes} tomos` : undefined,
    entry.pages ? `${entry.pages} págs.` : undefined,
  ].filter(Boolean);

  return (
    <View style={styles.header}>
      <Cover uri={entry.coverUrl} title={entry.title} width={120} />
      <View style={styles.headerInfo}>
        <ThemedText type="default" style={styles.title} selectable>
          {entry.title}
        </ThemedText>
        {entry.originalTitle && (
          <ThemedText type="small" themeColor="textSecondary" selectable>
            {entry.originalTitle}
          </ThemedText>
        )}
        {entry.authors.length > 0 && (
          <ThemedText type="small" selectable>
            {entry.authors.join(', ')}
          </ThemedText>
        )}
        <ThemedText type="code" themeColor="textSecondary">
          {facts.join(' · ')}
        </ThemedText>
        {entry.score !== undefined && (
          <ThemedText type="code" themeColor="textSecondary">
            Nota media {entry.score}/100
          </ThemedText>
        )}
      </View>
    </View>
  );
}

export function EntryFacts({ entry }: { entry: CatalogEntry }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const rows = [
    ['Editorial', entry.publisher],
    ['ISBN', entry.isbn],
    ['Fuente', SOURCE_LABELS[entry.source]],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <View style={styles.facts}>
      {entry.genres && entry.genres.length > 0 && (
        <View style={styles.genres}>
          {entry.genres.map((genre) => (
            <View key={genre} style={[styles.genre, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="code">{genre}</ThemedText>
            </View>
          ))}
        </View>
      )}

      {entry.description && (
        <Pressable onPress={() => setExpanded((value) => !value)}>
          <ThemedText type="small" numberOfLines={expanded ? undefined : 6}>
            {entry.description}
          </ThemedText>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            {expanded ? 'Ver menos' : 'Ver más'}
          </ThemedText>
        </Pressable>
      )}

      {rows.map(([label, value]) => (
        <View key={label} style={styles.factRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {label}
          </ThemedText>
          <ThemedText type="small" selectable>
            {value}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  headerInfo: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 700,
  },
  facts: {
    gap: Spacing.three,
  },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  genre: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
