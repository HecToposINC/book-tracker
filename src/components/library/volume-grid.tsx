import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type VolumeGridProps = {
  total: number;
  owned: number[];
  read: number[];
  wished: number[];
  onPress: (volume: number) => void;
  onLongPress?: (volume: number) => void;
};

/** Rejilla de tomos: relleno = lo tengo, ✓ = leído, borde discontinuo y ♡ = lo quiero. */
export function VolumeGrid({ total, owned, read, wished, onPress, onLongPress }: VolumeGridProps) {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {Array.from({ length: total }, (_, index) => {
        const volume = index + 1;
        const isOwned = owned.includes(volume);
        const isRead = read.includes(volume);
        const isWished = wished.includes(volume);
        const color = isOwned ? theme.onTint : isWished ? theme.tint : theme.text;
        const states = [isOwned && 'en colección', isRead && 'leído', isWished && 'en deseos'].filter(Boolean);
        return (
          <Pressable
            key={volume}
            onPress={() => onPress(volume)}
            onLongPress={onLongPress && (() => onLongPress(volume))}
            accessibilityRole="button"
            accessibilityLabel={[`Tomo ${volume}`, ...states].join(', ')}
            style={({ pressed }) => [
              styles.cell,
              {
                backgroundColor: isOwned ? theme.tint : theme.background,
                borderColor: isWished ? theme.tint : isRead ? theme.text : theme.border,
                borderStyle: isWished ? 'dashed' : 'solid',
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <ThemedText type="smallBold" style={{ color }}>
              {volume}
            </ThemedText>
            {isRead && (
              <ThemedText type="code" style={[styles.badge, styles.topRight, { color }]}>
                ✓
              </ThemedText>
            )}
            {isWished && (
              <ThemedText type="code" style={[styles.badge, styles.bottomRight, { color }]}>
                ♡
              </ThemedText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cell: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 4,
    fontSize: 10,
    lineHeight: 12,
  },
  topRight: {
    top: 1,
  },
  bottomRight: {
    bottom: 1,
  },
});
