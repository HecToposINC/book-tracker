import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/library/action-button';
import { ChipGroup } from '@/components/library/chip-group';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { normalizeIsbn } from '@/features/library/isbn';
import { useLibrary } from '@/features/library/library-context';
import {
  KIND_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  type MediaKind,
  type ReadingStatus,
} from '@/features/library/types';
import { useTheme } from '@/hooks/use-theme';

const KIND_OPTIONS = (Object.keys(KIND_LABELS) as MediaKind[]).map((kind) => ({
  value: kind,
  label: KIND_LABELS[kind],
}));
const STATUS_OPTIONS = STATUS_ORDER.map((status) => ({ value: status, label: STATUS_LABELS[status] }));

export default function AddManualScreen() {
  const params = useLocalSearchParams<{ isbn?: string }>();
  const theme = useTheme();
  const { addEntry, getItem } = useLibrary();

  const [kind, setKind] = useState<MediaKind>('book');
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [isbn, setIsbn] = useState(params.isbn ?? '');
  const [volumes, setVolumes] = useState('');
  const [status, setStatus] = useState<ReadingStatus>('pending');
  const [owned, setOwned] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = [styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }];

  function handleSave() {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('El título es obligatorio.');
      return;
    }
    const normalizedIsbn = isbn.trim() ? normalizeIsbn(isbn) : null;
    if (isbn.trim() && !normalizedIsbn) {
      setError('El ISBN no es válido.');
      return;
    }

    // Con ISBN se usa el mismo id que una búsqueda por ISBN, para no duplicar.
    const id = normalizedIsbn ? `isbn:${normalizedIsbn}` : `manual:${Date.now()}`;
    if (getItem(id)) {
      router.replace({ pathname: '/item/[id]', params: { id } });
      return;
    }

    const totalVolumes = Number.parseInt(volumes, 10);
    addEntry(
      {
        id,
        kind,
        source: 'manual',
        title: cleanTitle,
        authors: authors
          .split(',')
          .map((author) => author.trim())
          .filter(Boolean),
        isbn: normalizedIsbn ?? undefined,
        totalVolumes: kind === 'manga' && totalVolumes > 0 ? totalVolumes : undefined,
      },
      { status, owned, wishlist: !owned }
    );
    router.replace({ pathname: '/item/[id]', params: { id } });
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {params.isbn && (
          <ThemedText type="small" themeColor="textSecondary">
            No encontramos el ISBN {params.isbn} en Open Library. Completa los datos para añadirlo.
          </ThemedText>
        )}

        <Field label="Tipo">
          <ChipGroup options={KIND_OPTIONS} value={kind} onChange={setKind} />
        </Field>

        <Field label="Título *">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={kind === 'manga' ? 'Frieren' : 'Arsène Lupin: La aguja hueca'}
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
          />
        </Field>

        <Field label="Autores (separados por comas)">
          <TextInput
            value={authors}
            onChangeText={setAuthors}
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
          />
        </Field>

        <Field label="ISBN">
          <TextInput
            value={isbn}
            onChangeText={setIsbn}
            keyboardType="number-pad"
            placeholderTextColor={theme.textSecondary}
            style={inputStyle}
          />
        </Field>

        {kind === 'manga' && (
          <Field label="Nº de tomos">
            <TextInput
              value={volumes}
              onChangeText={(text) => setVolumes(text.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
            />
          </Field>
        )}

        <Field label="Estado">
          <ChipGroup options={STATUS_OPTIONS} value={status} onChange={setStatus} scrollable />
        </Field>

        <View style={styles.toggleRow}>
          <ThemedText>{owned ? 'Lo tengo' : 'Lo quiero (lista de deseos)'}</ThemedText>
          <Switch
            value={owned}
            onValueChange={setOwned}
            trackColor={{ true: theme.tint, false: theme.backgroundSelected }}
          />
        </View>

        {error && (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        )}

        <ActionButton title="Guardar" onPress={handleSave} />
        <ActionButton title="Cancelar" variant="secondary" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
  container: {
    alignItems: 'center',
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
