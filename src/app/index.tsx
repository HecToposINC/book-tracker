import { useState } from 'react';
import {
  Button,
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedIcon } from '@/components/animated-icon';
import BookForm from '@/components/books/BookForm';
import { ThemedText } from '@/components/themed-text';

import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import BookList from '@/components/books/BookList';
import { Status, type Book, type BookDraft } from '@/features/books/types';


export default function HomeScreen() {

  const [isFormVisible, setIsFormVisible] = useState(false);
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
  function handleSaveBook(draft: BookDraft) {
    const newBook: Book = {
      id: Date.now().toString(),
      ...draft,
    };

    setBooks((currentBooks) => [...currentBooks, newBook]);
    setIsFormVisible(false);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            My libray
          </ThemedText>
        </ThemedView>
          <BookList books={books} />
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
  <BookForm
    onSave={handleSaveBook}
    onCancel={() => setIsFormVisible(false)}
  />
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
});
