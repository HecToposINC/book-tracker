/** Deja solo dígitos (y una X final de ISBN-10). */
export function cleanIsbn(raw: string): string {
  return raw.toUpperCase().replace(/[^0-9X]/g, '');
}

function isValidIsbn10(isbn: string): boolean {
  if (!/^\d{9}[\dX]$/.test(isbn)) return false;
  const sum = isbn
    .split('')
    .reduce((acc, char, i) => acc + (char === 'X' ? 10 : Number(char)) * (10 - i), 0);
  return sum % 11 === 0;
}

function isValidIsbn13(isbn: string): boolean {
  if (!/^\d{13}$/.test(isbn)) return false;
  const sum = isbn
    .split('')
    .reduce((acc, char, i) => acc + Number(char) * (i % 2 === 0 ? 1 : 3), 0);
  return sum % 10 === 0;
}

function isbn10To13(isbn10: string): string {
  const base = `978${isbn10.slice(0, 9)}`;
  const sum = base
    .split('')
    .reduce((acc, char, i) => acc + Number(char) * (i % 2 === 0 ? 1 : 3), 0);
  return `${base}${(10 - (sum % 10)) % 10}`;
}

/**
 * Devuelve el ISBN-13 normalizado o `null` si el texto no es un ISBN válido.
 * Los códigos EAN-13 de libros empiezan por 978/979.
 */
export function normalizeIsbn(raw: string): string | null {
  const isbn = cleanIsbn(raw);
  if (isValidIsbn13(isbn) && /^97[89]/.test(isbn)) return isbn;
  if (isValidIsbn10(isbn)) return isbn10To13(isbn);
  return null;
}
