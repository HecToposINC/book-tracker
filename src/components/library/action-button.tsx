import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AppIcon } from './app-icon';

type ActionButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: { ios: SFSymbol; android: AndroidSymbol };
  loading?: boolean;
  disabled?: boolean;
};

export function ActionButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
}: ActionButtonProps) {
  const theme = useTheme();
  const background = {
    primary: theme.tint,
    secondary: theme.backgroundElement,
    danger: theme.backgroundElement,
  }[variant];
  const foreground = { primary: theme.onTint, secondary: theme.text, danger: theme.danger }[
    variant
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        icon && <AppIcon {...icon} size={18} color={foreground} />
      )}
      <ThemedText type="smallBold" style={{ color: foreground }}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
