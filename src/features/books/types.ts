export enum Status {
  owned = 'owned',
  reading = 'reading',
  read = 'read',
  wishlist = 'wishlist',
}
export type Book = {
    id: string;
    title: string;
    isbn: string;
    status: Status
  }

export type BookDraft = Omit<Book, 'id'>;
