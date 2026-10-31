# Book Tracker

Gestor de colección de **libros y mangas** al estilo Whakoom, hecho con Expo (SDK 57) y Expo Router.

## Funcionalidades

- **Biblioteca** en cuadrícula con filtros por tipo (libro/manga), estado y texto.
- **Búsqueda** combinada: mangas en AniList y libros en Open Library. Si pegas un ISBN, busca esa edición.
- **Escáner de ISBN** con la cámara (EAN-13/EAN-8/UPC-A) y entrada manual del código.
- **Seguimiento de tomos** en series de manga: pulsa un tomo para marcar que lo tienes y mantén pulsado para marcarlo como leído.
- Estado de lectura (pendiente, leyendo, leído, abandonado), valoración de 1 a 5 estrellas y notas.
- **Lista de deseos** con un contador en la pestaña.
- **Estadísticas**: títulos, tomos, páginas leídas, distribución por estado y autores más presentes.
- Alta manual de lo que no esté en las APIs.
- Datos guardados en el dispositivo (`expo-sqlite/kv-store`; `localStorage` en web).

## APIs (gratuitas, sin API key)

| API | Uso |
|-----|-----|
| [Open Library](https://openlibrary.org/developers/api) | Búsqueda de libros, detalle de obra, búsqueda por ISBN y portadas |
| [AniList GraphQL](https://docs.anilist.co) | Búsqueda de manga, número de tomos, estado de publicación y sinopsis |

## Desarrollo

```bash
npm install
npx expo start        # servidor de desarrollo
npx expo lint         # lint
npx tsc --noEmit      # comprobación de tipos
```

La cámara (`expo-camera`) y SQLite (`expo-sqlite`) tienen código nativo: en iOS y Android usa una development build (`npx expo run:ios|android` o `eas build --profile development`).

## Estructura

```
src/
  app/                    rutas (Expo Router)
    (tabs)/               Biblioteca · Buscar · Deseos · Estadísticas
    item/[id].tsx         detalle de un elemento de la biblioteca
    result.tsx            detalle de un resultado de búsqueda
    scan.tsx              escáner de ISBN
    add-manual.tsx        alta manual
  features/library/       tipos, store, persistencia, estadísticas y clientes de API
  components/library/     componentes de UI
```
