import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type AppIconProps = {
  ios: SFSymbol;
  android: AndroidSymbol;
  size?: number;
  color?: ColorValue;
};

export function AppIcon({ ios, android, size = 20, color }: AppIconProps) {
  const theme = useTheme();
  return (
    <SymbolView name={{ ios, android, web: android }} size={size} tintColor={color ?? theme.text} />
  );
}
