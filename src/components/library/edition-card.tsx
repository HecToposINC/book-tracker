import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { editionLabel, type EditionDraft, type VolumeField } from '@/features/library/editions';
import type { Edition } from '@/features/library/types';
import { useTheme } from '@/hooks/use-theme';

import { ActionButton } from './action-button';
import { ChipGroup } from './chip-group';
import { confirm } from './confirm';
import { EditionForm, MAX_VOLUMES } from './edition-form';
import { IconButton } from './icon-button';
import { VolumeGrid } from './volume-grid';

type EditionCardProps = {
  edition: Edition;
  onUpdate: (draft: Partial<EditionDraft>) => void;
  onRemove: () => void;
  onToggleVolume: (volume: number, field: VolumeField) => void;
  onSetAll: (field: VolumeField, all: boolean) => void;
};

const MODE_OPTIONS: { value: VolumeField; label: string }[] = [
  { value: 'ownedVolumes', label: 'Lo tengo' },
  { value: 'readVolumes', label: 'Leído' },
  { value: 'wishlistVolumes', label: 'Lo quiero' },
];

/** Texto del botón para marcar o desmarcar todos los tomos en el modo actual. */
function bulkLabel(mode: VolumeField, allMarked: boolean) {
  if (mode === 'ownedVolumes') return allMarked ? 'Quitar todos' : 'Tengo todos';
  if (mode === 'readVolumes') return allMarked ? 'Ninguno leído' : 'Todos leídos';
  return allMarked ? 'Ya no quiero ninguno' : 'Quiero los que me faltan';
}

export function EditionCard({ edition, onUpdate, onRemove, onToggleVolume, onSetAll }: EditionCardProps) {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<VolumeField>('ownedVolumes');
  const total = edition.totalVolumes ?? 0;
  // En deseos "todos" son los que no tienes.
  const markable = mode === 'wishlistVolumes' ? total - edition.ownedVolumes.length : total;
  const allMarked = edition[mode].length > 0 && edition[mode].length >= markable;
  const counts = [
    `${edition.ownedVolumes.length}/${total} en colección`,
    `${edition.readVolumes.length}/${total} leídos`,
    edition.wishlistVolumes.length > 0 && `${edition.wishlistVolumes.length} en deseos`,
  ].filter(Boolean);

  async function handleRemove() {
    const accepted = await confirm(
      'Eliminar edición',
      `¿Eliminar la edición ${editionLabel(edition)}? Se perderán sus tomos marcados.`,
      'Eliminar'
    );
    if (accepted) onRemove();
  }

  if (editing) {
    return (
      <EditionForm
        initial={edition}
        submitLabel="Guardar"
        onCancel={() => setEditing(false)}
        onSubmit={(draft) => {
          onUpdate(draft);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <View style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <ThemedText type="smallBold">{editionLabel(edition)}</ThemedText>
          <ThemedText type="code" themeColor="textSecondary">
            {edition.format}
            {total > 0 && ` · ${counts.join(' · ')}`}
          </ThemedText>
        </View>
        <IconButton ios="pencil" android="edit" label="Editar edición" onPress={() => setEditing(true)} />
        <IconButton ios="trash" android="delete" label="Eliminar edición" onPress={handleRemove} />
      </View>

      {total > 0 ? (
        <>
          <View style={styles.mode}>
            <ThemedText type="small" themeColor="textSecondary">
              Al pulsar un tomo marcar como:
            </ThemedText>
            <ChipGroup options={MODE_OPTIONS} value={mode} onChange={setMode} scrollable />
          </View>
          <VolumeGrid
            total={total}
            owned={edition.ownedVolumes}
            read={edition.readVolumes}
            wished={edition.wishlistVolumes}
            onPress={(volume) => onToggleVolume(volume, mode)}
            onLongPress={(volume) => onToggleVolume(volume, 'readVolumes')}
          />
          <ActionButton
            title={bulkLabel(mode, allMarked)}
            variant="secondary"
            disabled={markable === 0}
            onPress={() => onSetAll(mode, !allMarked)}
          />
          {total < MAX_VOLUMES && (
            <ActionButton
              title="Salió un tomo nuevo (+1)"
              variant="secondary"
              onPress={() => onUpdate({ totalVolumes: total + 1 })}
            />
          )}
        </>
      ) : (
        <View style={styles.empty}>
          <ThemedText type="small" themeColor="textSecondary">
            Indica cuántos tomos tiene esta edición para marcar los que tienes.
          </ThemedText>
          <ActionButton title="Indicar tomos" variant="secondary" onPress={() => setEditing(true)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  mode: {
    gap: Spacing.one,
  },
  flex: {
    flex: 1,
  },
  empty: {
    gap: Spacing.two,
  },
});
