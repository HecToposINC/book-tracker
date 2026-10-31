import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { Book } from '@/features/books/types'

type BookListProps = {
    books: Book[];
};

export default function BookList({ books }: BookListProps){
    return (
    <>
    {books.map((book) =>(
            <HintRow
            key={book.id}
            title={book.title.trim()}
            hint={<ThemedText type="code">{book.status+' '+book.isbn}</ThemedText>}
            />
          
    ))}
    </>
    );
}