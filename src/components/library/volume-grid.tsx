import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type VolumeGridProps = {
  total: number;
  owned: number[];
  read: number[];
  onToggleOwned: (volume: number) => void;
  onToggleRead: (volume: number) => void;
};

/** Rejilla de tomos: pulsar marca "lo tengo", mantener pulsado marca "leído". */
export function VolumeGrid({ total, owned, read, onToggleOwned, onToggleRead }: VolumeGridProps) {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {Array.from({ length: total }, (_, index) => {
        const volume = index + 1;
        const isOwned = owned.includes(volume);
        const isRead = read.includes(volume);
        return (
          <Pressable
            key={volume}
            onPress={() => onToggleOwned(volume)}
            onLongPress={() => onToggleRead(volume)}
            accessibilityRole="button"
            accessibilityLabel={`Tomo ${volume}${isOwned ? ', en colección' : ''}${isRead ? ', leído' : ''}`}
            style={({ pressed }) => [
              styles.cell,
              {
                backgroundColor: isOwned ? theme.tint : theme.backgroundElement,
                borderColor: isRead ? theme.text : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <ThemedText type="smallBold" style={{ color: isOwned ? theme.onTint : theme.text }}>
              {volume}
            </ThemedText>
            {isRead && (
              <ThemedText type="code" style={[styles.check, { color: isOwned ? theme.onTint : theme.text }]}>
                ✓
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
  check: {
    position: 'absolute',
    top: 1,
    right: 4,
    fontSize: 10,
  },
});
