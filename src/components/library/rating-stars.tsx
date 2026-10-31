import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { AppIcon } from './app-icon';

type RatingStarsProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
};

export function RatingStars({ value, onChange, size = 28 }: RatingStarsProps) {
  const theme = useTheme();

  return (
    <View style={styles.row} accessibilityLabel={`Valoración: ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <Pressable
            key={star}
            disabled={!onChange}
            // Pulsar la estrella actual quita la valoración.
            onPress={() => onChange?.(star === value ? 0 : star)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`${star} estrellas`}>
            <AppIcon
              ios={filled ? 'star.fill' : 'star'}
              android="star"
              size={size}
              color={filled ? theme.tint : theme.border}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
});
