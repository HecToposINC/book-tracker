import * as Device from 'expo-device';
import { useState } from 'react';
import {
  Button,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
} from 'react-native';import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker'
import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';

import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
enum Status {
  owned = 'owned',
  reading = 'reading',
  read = 'read',
  wishlist = 'wishlist',
}
  type Book = {
    id: string;
    title: string;
    isbn: string;
    status: Status
  }

export default function HomeScreen() {

  const [isFormVisible, setIsFormVisible] = useState(false);
const [title, setTitle] = useState('');
const [isbn, setIsbn] = useState('');
const[status, setStatus] = useState<Status>(Status.owned);
const [books, setBooks]= useState<Book[]>([
  {
    id: '1',
    title: 'この素晴らし世界に祝福を',
    isbn: '1234',
    status: Status.read
  },  {
    id: '2',
    title: '魔女の度々',
    isbn: '1236534',
        status: Status.read

  },  {
    id: '3',
    title: 'Aresen Lupin: La aguja hueca',
    isbn: '1232145124',
        status: Status.owned

  }
]);
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            My libray
          </ThemedText>
        </ThemedView>
        {
          books.map((book)=> (
            <HintRow
            key={book.id}
            title={book.title.trim()}
            hint={<ThemedText type="code">{book.status+' '+book.isbn}</ThemedText>}
            />
          ))
        }
                  <Button
  onPress={()=> setIsFormVisible(true)}
  title="Add book"
  color="#33CBDC"
  accessibilityLabel="Add book"
/>
<Modal
  visible={isFormVisible}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={() => setIsFormVisible(false)}
>
  <SafeAreaView style={styles.formContainer}>
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
 onValueChange={(itemValue) =>
    setStatus(itemValue)}>
      <Picker.Item label="Comprado" value={Status.owned} />
<Picker.Item label="Leyendo" value={Status.reading} />
<Picker.Item label="Leído" value={Status.read} />
<Picker.Item label="Lista de deseos" value={Status.wishlist} />
      </Picker>  

    

    <Button
      title="Cancelar"
      onPress={() =>{ setIsFormVisible(false);
        setTitle('');
        setIsbn('');
        setStatus(Status.owned);
      }}
    />

    <Button
      title="Guardar"
      onPress={() => {
        if(title.trim().length > 0 && isbn.trim().length > 0){

        
        const newBook: Book = {
  id: Date.now().toString(),
  title: title.trim(),
  isbn: isbn.trim(),
      status

};
setBooks([...books, newBook]);
        setIsFormVisible(false);
        setTitle('');
        setIsbn('');
        setStatus(Status.owned);
      }}}
    />
  </SafeAreaView>
</Modal>
        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  formContainer: {
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
