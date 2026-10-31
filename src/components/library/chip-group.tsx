import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipOption<T extends string> = { value: T; label: string };

type ChipGroupProps<T extends string> = {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Permite desplazar horizontalmente cuando hay muchas opciones. */
  scrollable?: boolean;
};

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  scrollable = false,
}: ChipGroupProps<T>) {
  const theme = useTheme();

  const chips = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={option.value}
        onPress={() => onChange(option.value)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={({ pressed }) => [
          styles.chip,
          {
            backgroundColor: selected ? theme.tint : theme.backgroundElement,
            opacity: pressed ? 0.7 : 1,
          },
        ]}>
        <ThemedText type="small" style={{ color: selected ? theme.onTint : theme.text }}>
          {option.label}
        </ThemedText>
      </Pressable>
    );
  });

  return (
    <ScrollView
      horizontal
      scrollEnabled={scrollable}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
    flexGrow: 1,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: 999,
  },
});
