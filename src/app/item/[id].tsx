import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/library/action-button';
import { ChipGroup } from '@/components/library/chip-group';
import { confirm } from '@/components/library/confirm';
import { EmptyState } from '@/components/library/empty-state';
import { EntryFacts, EntryHeader } from '@/components/library/entry-details';
import { RatingStars } from '@/components/library/rating-stars';
import { VolumeGrid } from '@/components/library/volume-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useLibrary } from '@/features/library/library-store';
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

const MAX_VOLUMES = 300;

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
  const { updateItem, toggleVolume, removeItem } = useLibrary();
  const [notes, setNotes] = useState(item.notes);
  const [volumesText, setVolumesText] = useState(item.totalVolumes?.toString() ?? '');

  const update = (patch: Partial<LibraryItem>) => updateItem(item.id, patch);
  const inputStyle = [styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }];

  function saveTotalVolumes() {
    const total = Number.parseInt(volumesText, 10);
    if (Number.isNaN(total) || total < 1) {
      setVolumesText(item.totalVolumes?.toString() ?? '');
      return;
    }
    const capped = Math.min(total, MAX_VOLUMES);
    setVolumesText(capped.toString());
    update({
      totalVolumes: capped,
      ownedVolumes: item.ownedVolumes.filter((v) => v <= capped),
      readVolumes: item.readVolumes.filter((v) => v <= capped),
    });
  }

  function setAllVolumes(field: 'ownedVolumes' | 'readVolumes', all: boolean) {
    const volumes = all ? Array.from({ length: item.totalVolumes ?? 0 }, (_, i) => i + 1) : [];
    const patch: Partial<LibraryItem> = { [field]: volumes };
    if (field === 'ownedVolumes' && all) Object.assign(patch, { owned: true, wishlist: false });
    if (field === 'readVolumes') patch.status = all ? 'read' : item.status === 'read' ? 'reading' : item.status;
    update(patch);
  }

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

  const totalVolumes = item.totalVolumes ?? 0;

  return (
    <View style={styles.content}>
      <EntryHeader entry={item} />

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

      <Section title="Lectura">
        <ChipGroup options={STATUS_OPTIONS} value={item.status} onChange={(status) => update({ status })} scrollable />
        <RatingStars value={item.rating} onChange={(rating) => update({ rating })} />
      </Section>

      {item.kind === 'manga' && (
        <Section title="Tomos">
          <View style={styles.volumesHeader}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
              Total de tomos publicados
            </ThemedText>
            <TextInput
              value={volumesText}
              onChangeText={(text) => setVolumesText(text.replace(/\D/g, ''))}
              onEndEditing={saveTotalVolumes}
              onBlur={saveTotalVolumes}
              keyboardType="number-pad"
              placeholder="?"
              placeholderTextColor={theme.textSecondary}
              style={[inputStyle, styles.volumesInput]}
            />
          </View>

          {totalVolumes > 0 ? (
            <>
              <ThemedText type="code" themeColor="textSecondary">
                {item.ownedVolumes.length}/{totalVolumes} en colección · {item.readVolumes.length}/
                {totalVolumes} leídos · Pulsa para marcar que lo tienes, mantén pulsado para marcarlo
                como leído.
              </ThemedText>
              <VolumeGrid
                total={totalVolumes}
                owned={item.ownedVolumes}
                read={item.readVolumes}
                onToggleOwned={(volume) => toggleVolume(item.id, volume, 'ownedVolumes')}
                onToggleRead={(volume) => toggleVolume(item.id, volume, 'readVolumes')}
              />
              <View style={styles.row}>
                <View style={styles.flex}>
                  <ActionButton
                    title={item.ownedVolumes.length === totalVolumes ? 'Quitar todos' : 'Tengo todos'}
                    variant="secondary"
                    onPress={() => setAllVolumes('ownedVolumes', item.ownedVolumes.length !== totalVolumes)}
                  />
                </View>
                <View style={styles.flex}>
                  <ActionButton
                    title={item.readVolumes.length === totalVolumes ? 'Ninguno leído' : 'Todos leídos'}
                    variant="secondary"
                    onPress={() => setAllVolumes('readVolumes', item.readVolumes.length !== totalVolumes)}
                  />
                </View>
              </View>
            </>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              La serie sigue en publicación o no hay datos: indica cuántos tomos hay para seguirlos.
            </ThemedText>
          )}
        </Section>
      )}

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
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  volumesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  volumesInput: {
    width: 72,
    textAlign: 'center',
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
