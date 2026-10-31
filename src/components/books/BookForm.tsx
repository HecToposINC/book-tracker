import { useState } from 'react';
import { Button, StyleSheet, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Status, type BookDraft } from '@/features/books/types';

type BookFormProps = {
  onSave: (draft: BookDraft) => void;
  onCancel: () => void;
};

export default function BookForm({ onSave, onCancel }: BookFormProps) {
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [status, setStatus] = useState<Status>(Status.owned);

  function resetForm() {
    setTitle('');
    setIsbn('');
    setStatus(Status.owned);
  }

  function handleSave() {
    const cleanedTitle = title.trim();
    const cleanedIsbn = isbn.trim();

    if (!cleanedTitle || !cleanedIsbn) {
      return;
    }

    onSave({ title: cleanedTitle, isbn: cleanedIsbn, status });
    resetForm();
  }

  function handleCancel() {
    resetForm();
    onCancel();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText type="title">Añadir libro</ThemedText>

      <TextInput
        style={styles.input}
        placeholder="Título"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={styles.input}
        placeholder="ISBN"
        value={isbn}
        onChangeText={setIsbn}
        keyboardType="numeric"
      />

      <Picker
        selectedValue={status}
        onValueChange={(itemValue) => setStatus(itemValue as Status)}>
        <Picker.Item label="Comprado" value={Status.owned} />
        <Picker.Item label="Leyendo" value={Status.reading} />
        <Picker.Item label="Leído" value={Status.read} />
        <Picker.Item label="Lista de deseos" value={Status.wishlist} />
      </Picker>

      <Button title="Cancelar" onPress={handleCancel} />
      <Button title="Guardar" onPress={handleSave} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
