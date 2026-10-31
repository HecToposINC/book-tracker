import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  EDITION_FORMATS,
  LANGUAGE_LABELS,
  PUBLISHER_SUGGESTIONS,
  type EditionDraft,
} from '@/features/library/editions';
import type { EditionLanguage } from '@/features/library/types';
import { useTheme } from '@/hooks/use-theme';

import { ActionButton } from './action-button';
import { ChipGroup } from './chip-group';

const LANGUAGE_OPTIONS = (Object.keys(LANGUAGE_LABELS) as EditionLanguage[]).map((language) => ({
  value: language,
  label: LANGUAGE_LABELS[language],
}));
const FORMAT_OPTIONS = EDITION_FORMATS.map((format) => ({ value: format, label: format }));

export const MAX_VOLUMES = 300;

type EditionFormProps = {
  initial: EditionDraft;
  submitLabel: string;
  onSubmit: (draft: EditionDraft) => void;
  onCancel?: () => void;
};

/** Idioma, editorial, formato y nº de tomos de una edición. */
export function EditionForm({ initial, submitLabel, onSubmit, onCancel }: EditionFormProps) {
  const theme = useTheme();
  const [language, setLanguage] = useState(initial.language);
  const [publisher, setPublisher] = useState(initial.publisher);
  const [format, setFormat] = useState(initial.format);
  const [volumes, setVolumes] = useState(initial.totalVolumes?.toString() ?? '');

  const inputStyle = [styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }];
  const suggestions = PUBLISHER_SUGGESTIONS[language] ?? [];

  function handleSubmit() {
    const total = Number.parseInt(volumes, 10);
    onSubmit({
      language,
      publisher: publisher.trim(),
      format,
      totalVolumes: total > 0 ? Math.min(total, MAX_VOLUMES) : undefined,
    });
  }

  return (
    <View style={[styles.form, { borderColor: theme.border }]}>
      <Field label="Idioma">
        <ChipGroup options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} scrollable />
      </Field>

      <Field label="Editorial">
        <TextInput
          value={publisher}
          onChangeText={setPublisher}
          placeholder="Kamite, Yen On, Kadokawa…"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="words"
          style={inputStyle}
        />
        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((name) => {
              const selected = name === publisher.trim();
              return (
                <Pressable
                  key={name}
                  onPress={() => setPublisher(name)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.suggestion,
                    {
                      borderColor: selected ? theme.tint : theme.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}>
                  <ThemedText type="code" style={selected && { color: theme.tint }}>
                    {name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </Field>

      <Field label="Formato">
        <ChipGroup options={FORMAT_OPTIONS} value={format} onChange={setFormat} scrollable />
      </Field>

      <Field label="Tomos publicados en esta edición">
        <TextInput
          value={volumes}
          onChangeText={(text) => setVolumes(text.replace(/\D/g, ''))}
          keyboardType="number-pad"
          placeholder="Ej. 17"
          placeholderTextColor={theme.textSecondary}
          style={[inputStyle, styles.volumesInput]}
        />
      </Field>

      <View style={styles.row}>
        {onCancel && (
          <View style={styles.flex}>
            <ActionButton title="Cancelar" variant="secondary" onPress={onCancel} />
          </View>
        )}
        <View style={styles.flex}>
          <ActionButton title={submitLabel} onPress={handleSubmit} />
        </View>
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  volumesInput: {
    width: 96,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  suggestion: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
