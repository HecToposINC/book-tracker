import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/library/action-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { findByIsbn } from '@/features/library/api/catalog';
import { normalizeIsbn } from '@/features/library/isbn';
import { useLibrary } from '@/features/library/library-store';
import { useTheme } from '@/hooks/use-theme';

export default function ScanScreen() {
  const theme = useTheme();
  const { getItem } = useLibrary();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualIsbn, setManualIsbn] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  // Evita procesar el mismo código varias veces mientras la cámara sigue leyendo.
  const busy = useRef(false);

  async function handleIsbn(raw: string) {
    if (busy.current) return;
    const isbn = normalizeIsbn(raw);
    if (!isbn) {
      setMessage(`«${raw}» no es un ISBN válido.`);
      return;
    }

    busy.current = true;
    setLooking(true);
    setMessage(null);
    try {
      const existing = getItem(`isbn:${isbn}`);
      if (existing) {
        router.replace({ pathname: '/item/[id]', params: { id: existing.id } });
        return;
      }
      const entry = await findByIsbn(isbn);
      if (entry) {
        router.replace({ pathname: '/result', params: { id: entry.id } });
      } else {
        // Muchos mangas y ediciones locales no están en Open Library: alta manual con el ISBN.
        router.replace({ pathname: '/add-manual', params: { isbn } });
      }
    } catch {
      setMessage('No se pudo consultar el ISBN. Revisa tu conexión.');
      busy.current = false;
    } finally {
      setLooking(false);
    }
  }

  function onBarcodeScanned(result: BarcodeScanningResult) {
    if (!busy.current) handleIsbn(result.data);
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.cameraArea}>
        {!permission ? (
          <ActivityIndicator color={theme.tint} />
        ) : permission.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
            onBarcodeScanned={looking ? undefined : onBarcodeScanned}
          />
        ) : (
          <View style={styles.permission}>
            <ThemedText type="small" style={styles.center}>
              Necesitamos la cámara para leer el código de barras del libro.
            </ThemedText>
            {permission.canAskAgain && (
              <ActionButton title="Permitir cámara" onPress={requestPermission} />
            )}
          </View>
        )}
        {permission?.granted && <View pointerEvents="none" style={[styles.frame, { borderColor: theme.tint }]} />}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.panel}>
        <ThemedText type="small" themeColor="textSecondary">
          Apunta al código de barras de la contraportada o escribe el ISBN.
        </ThemedText>
        <View style={styles.row}>
          <TextInput
            value={manualIsbn}
            onChangeText={setManualIsbn}
            placeholder="978…"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            returnKeyType="search"
            onSubmitEditing={() => handleIsbn(manualIsbn)}
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          />
          <ActionButton title="Buscar" loading={looking} onPress={() => handleIsbn(manualIsbn)} />
        </View>
        {message && (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {message}
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  frame: {
    width: '75%',
    aspectRatio: 2,
    borderWidth: 3,
    borderRadius: Spacing.three,
  },
  permission: {
    gap: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
    color: '#fff',
  },
  panel: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});
