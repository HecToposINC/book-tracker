import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type CoverProps = {
  uri?: string;
  title: string;
  width: number;
};

export function Cover({ uri, title, width }: CoverProps) {
  const theme = useTheme();
  const size = { width, height: width * 1.5, borderRadius: Math.max(4, width / 16) };

  if (!uri) {
    return (
      <View style={[styles.placeholder, size, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText
          type={width > 80 ? 'smallBold' : 'code'}
          themeColor="textSecondary"
          numberOfLines={4}
          style={styles.placeholderText}>
          {title}
        </ThemedText>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[size, { backgroundColor: theme.backgroundSelected }]}
      contentFit="cover"
      transition={200}
      accessibilityLabel={`Portada de ${title}`}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  placeholderText: {
    textAlign: 'center',
  },
});
