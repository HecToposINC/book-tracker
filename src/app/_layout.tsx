import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="item/[id]" options={{ title: '' }} />
        <Stack.Screen name="result" options={{ title: '' }} />
        <Stack.Screen name="scan" options={{ title: 'Escanear ISBN', presentation: 'modal' }} />
        <Stack.Screen
          name="add-manual"
          options={{ title: 'Añadir manualmente', presentation: 'modal' }}
        />
      </Stack>
      <AnimatedSplashOverlay />
    </ThemeProvider>
  );
}
