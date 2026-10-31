import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { EditionSuggestion } from '@/features/library/api/editions';
import { LANGUAGE_LABELS, sameEdition, type EditionDraft } from '@/features/library/editions';
import type { Edition } from '@/features/library/types';
import { useTheme } from '@/hooks/use-theme';

type EditionSuggestionsProps = {
  /** `undefined` mientras se buscan. */
  suggestions: EditionSuggestion[] | undefined;
  editions: Edition[];
  onAdd: (draft: EditionDraft) => void;
};

/** Ediciones encontradas en las APIs, agrupadas por formato, para añadirlas con un toque. */
export function EditionSuggestions({ suggestions, editions, onAdd }: EditionSuggestionsProps) {
  const theme = useTheme();

  if (!suggestions) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.tint} />
        <ThemedText type="small" themeColor="textSecondary">
          Buscando ediciones…
        </ThemedText>
      </View>
    );
  }

  if (suggestions.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No se encontraron ediciones para esta obra. Añade la tuya a mano.
      </ThemedText>
    );
  }

  const formats = [...new Set(suggestions.map((suggestion) => suggestion.format))];

  return (
    <View style={styles.list}>
      {formats.map((format) => (
        <View key={format} style={styles.group}>
          <ThemedText type="smallBold">{format}</ThemedText>
          {suggestions
            .filter((suggestion) => suggestion.format === format)
            .map((suggestion) => {
              const added = editions.some((edition) => sameEdition(edition, suggestion));
              const details = [
                LANGUAGE_LABELS[suggestion.language],
                suggestion.totalVolumes
                  ? `${suggestion.totalVolumes} ${suggestion.totalVolumes === 1 ? 'tomo' : 'tomos'}`
                  : 'tomos sin datos',
              ];
              return (
                <View key={suggestion.key} style={[styles.row, { borderColor: theme.border }]}>
                  <View style={styles.info}>
                    <ThemedText type="small">
                      {suggestion.publisher || 'Edición original (editorial sin datos)'}
                    </ThemedText>
                    <ThemedText type="code" themeColor="textSecondary">
                      {details.join(' · ')}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => onAdd(suggestion)}
                    disabled={added}
                    accessibilityRole="button"
                    accessibilityLabel={`Añadir edición ${suggestion.publisher} en ${LANGUAGE_LABELS[suggestion.language]}`}
                    style={({ pressed }) => [
                      styles.button,
                      {
                        backgroundColor: added ? theme.backgroundElement : theme.tint,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={{ color: added ? theme.textSecondary : theme.onTint }}>
                      {added ? 'Añadida' : 'Añadir'}
                    </ThemedText>
                  </Pressable>
                </View>
              );
            })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.three,
  },
  group: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  button: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
  },
});
