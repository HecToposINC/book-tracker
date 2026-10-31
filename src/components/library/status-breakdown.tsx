import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ChartColors, Spacing } from '@/constants/theme';
import { STATUS_LABELS, type ReadingStatus } from '@/features/library/types';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type StatusBreakdownProps = {
  data: { status: ReadingStatus; count: number }[];
};

/**
 * Barra segmentada fina (una parte por estado) + tabla con nombre, cifra y porcentaje.
 * La tabla es la que lleva los números: el color solo identifica.
 */
export function StatusBreakdown({ data }: StatusBreakdownProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const colors = ChartColors[scheme === 'dark' ? 'dark' : 'light'];
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const summary = data
    .map((d) => `${STATUS_LABELS[d.status]}: ${d.count}`)
    .join(', ');

  return (
    <View style={styles.container}>
      <View
        style={[styles.bar, { backgroundColor: total === 0 ? theme.backgroundElement : undefined }]}
        accessibilityRole="image"
        accessibilityLabel={`Distribución por estado. ${summary}`}>
        {data.map((d, index) =>
          d.count > 0 ? (
            <View
              key={d.status}
              style={[styles.segment, { flex: d.count, backgroundColor: colors[index] }]}
            />
          ) : null
        )}
      </View>

      <View style={styles.table}>
        {data.map((d, index) => (
          <View key={d.status} style={styles.tableRow}>
            <View style={[styles.swatch, { backgroundColor: colors[index] }]} />
            <ThemedText type="small" style={styles.flex}>
              {STATUS_LABELS[d.status]}
            </ThemedText>
            <ThemedText type="smallBold">{d.count}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.percent}>
              {total > 0 ? `${Math.round((d.count / total) * 100)}%` : '–'}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    // Hueco de 2px del color de fondo entre segmentos.
    gap: 2,
  },
  segment: {
    height: '100%',
    borderRadius: 4,
  },
  table: {
    gap: Spacing.two,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  flex: {
    flex: 1,
  },
  percent: {
    width: 44,
    textAlign: 'right',
  },
});
