import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/library/action-button';
import { ChipGroup } from '@/components/library/chip-group';
import { confirm } from '@/components/library/confirm';
import { EditionCard } from '@/components/library/edition-card';
import { EditionForm } from '@/components/library/edition-form';
import { EditionSuggestions } from '@/components/library/edition-suggestions';
import { EmptyState } from '@/components/library/empty-state';
import { EntryFacts, EntryHeader } from '@/components/library/entry-details';
import { RatingStars } from '@/components/library/rating-stars';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { defaultFormat, isSeries } from '@/features/library/editions';
import { useLibrary } from '@/features/library/library-store';
import { useEditionSuggestions } from '@/features/library/use-edition-suggestions';
import {
  KIND_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  type LibraryItem,
  type MediaKind,
} from '@/features/library/types';
import { useTheme } from '@/hooks/use-theme';

const STATUS_OPTIONS = STATUS_ORDER.map((status) => ({ value: status, label: STATUS_LABELS[status] }));
const KIND_OPTIONS = (Object.keys(KIND_LABELS) as MediaKind[]).map((kind) => ({
  value: kind,
  label: KIND_LABELS[kind],
}));

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { getItem } = useLibrary();
  const item = getItem(id);

  if (!item) {
    return (
      <ThemedView style={styles.centered}>
        <EmptyState title="No está en tu biblioteca" message="Puede que lo hayas eliminado." />
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled">
      {/* key: reinicia los campos editables si cambia la ficha mostrada */}
      <ItemDetails key={item.id} item={item} />
    </ScrollView>
  );
}

function ItemDetails({ item }: { item: LibraryItem }) {
  const theme = useTheme();
  const library = useLibrary();
  const { updateItem, removeItem } = library;
  const [notes, setNotes] = useState(item.notes);
  const [addingEdition, setAddingEdition] = useState(false);
  const suggestions = useEditionSuggestions(item);

  const update = (patch: Partial<LibraryItem>) => updateItem(item.id, patch);
  const inputStyle = [styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }];

  async function handleDelete() {
    const accepted = await confirm(
      'Eliminar de la biblioteca',
      `¿Seguro que quieres eliminar «${item.title}»? Se perderán tus notas y tomos marcados.`,
      'Eliminar'
    );
    if (accepted) {
      router.back();
      removeItem(item.id);
    }
  }

  return (
    <View style={styles.content}>
      <EntryHeader entry={item} />

      {/* En series se marca tomo a tomo en cada edición: estos interruptores sobrarían. */}
      {!isSeries(item) && (
        <Section title="Mi colección">
          <ToggleRow
            label="Lo tengo"
            value={item.owned}
            onChange={(owned) => update(owned ? { owned, wishlist: false } : { owned })}
          />
          <ToggleRow
            label="En mi lista de deseos"
            value={item.wishlist}
            disabled={item.owned}
            onChange={(wishlist) => update({ wishlist })}
          />
        </Section>
      )}

      <Section title="Lectura">
        <ChipGroup options={STATUS_OPTIONS} value={item.status} onChange={(status) => update({ status })} scrollable />
        <RatingStars value={item.rating} onChange={(rating) => update({ rating })} />
      </Section>

      {item.editions.length > 0 && (
        <Section title="Mis ediciones">
          <ThemedText type="small" themeColor="textSecondary">
            Elige qué marcar (lo tengo, leído o lo quiero) y pulsa los tomos. Mantén pulsado un tomo
            para marcarlo como leído directamente.
          </ThemedText>
          {item.editions.map((edition) => (
            <EditionCard
              key={edition.id}
              edition={edition}
              onUpdate={(draft) => library.updateEdition(item.id, edition.id, draft)}
              onRemove={() => library.removeEdition(item.id, edition.id)}
              onToggleVolume={(volume, field) => library.toggleVolume(item.id, edition.id, volume, field)}
              onSetAll={(field, all) => library.setAllVolumes(item.id, edition.id, field, all)}
            />
          ))}
        </Section>
      )}

      <Section title="Ediciones encontradas">
        <EditionSuggestions
          suggestions={suggestions}
          editions={item.editions}
          onAdd={(draft) => library.addEdition(item.id, draft)}
        />
        {addingEdition ? (
          <EditionForm
            initial={{
              language: 'es',
              publisher: '',
              format: defaultFormat(item),
              totalVolumes: item.totalVolumes ?? (item.kind === 'book' ? 1 : undefined),
            }}
            submitLabel="Añadir edición"
            onCancel={() => setAddingEdition(false)}
            onSubmit={(draft) => {
              library.addEdition(item.id, draft);
              setAddingEdition(false);
            }}
          />
        ) : (
          <ActionButton
            title="¿No está la tuya? Añadir a mano"
            variant="secondary"
            icon={{ ios: 'plus', android: 'add' }}
            onPress={() => setAddingEdition(true)}
          />
        )}
      </Section>

      <Section title="Notas">
        <TextInput
          value={notes}
          onChangeText={setNotes}
          onBlur={() => notes !== item.notes && update({ notes })}
          placeholder="Edición, dónde lo compraste, a quién lo prestaste…"
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[inputStyle, styles.notes]}
        />
      </Section>

      <Section title="Ficha">
        <EntryFacts entry={item} />
        <View style={styles.kindRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Tipo
          </ThemedText>
          <ChipGroup options={KIND_OPTIONS} value={item.kind} onChange={(kind) => update({ kind })} />
        </View>
      </Section>

      <ActionButton
        title="Eliminar de la biblioteca"
        variant="danger"
        icon={{ ios: 'trash', android: 'delete' }}
        onPress={handleDelete}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title.toUpperCase()}
      </ThemedText>
      {children}
    </View>
  );
}

type ToggleRowProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

function ToggleRow({ label, value, onChange, disabled }: ToggleRowProps) {
  const theme = useTheme();
  return (
    <View style={[styles.toggleRow, disabled && styles.disabled]}>
      <ThemedText type="default">{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: theme.tint, false: theme.backgroundSelected }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabled: {
    opacity: 0.5,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  notes: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  kindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
