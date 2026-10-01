# Nacionalidad Simple — App móvil

App nativa para iOS y Android (Expo + React Native) que muestra los artículos del blog
de **nacionalidadsimple.com**, leídos en directo desde WordPress, y los servicios del despacho
(apostillado, nacionalidad, arraigo…).

## Qué hace

- **Inicio**: último artículo destacado, lista con scroll infinito, filtro por categorías,
  "tirar para refrescar".
- **Explorar**: buscador con resultados en vivo y cuadrícula de categorías.
- **Artículo**: el contenido de WordPress se pinta con componentes nativos (títulos, listas,
  imágenes, tablas, citas, vídeos de YouTube, botones, desplegables de preguntas frecuentes…).
  Imagen con efecto parallax, barra de progreso de lectura, tamaño de letra ajustable,
  guardar, compartir, artículos relacionados y botón de contacto por WhatsApp o email.
- **Enlaces internos**: si un artículo enlaza a otra entrada o página de la web, se abre dentro
  de la app. El resto de enlaces se abre en el navegador integrado.
- **Servicios**: ficha de cada servicio (con el contenido de su página de WordPress, si existe)
  y contacto directo.
- **Guardados**: artículos guardados en el dispositivo.
- **Sin conexión**: lo ya cargado se guarda en caché y se muestra al instante.
- Modo claro/oscuro automático, animaciones nativas a 60 fps y barra de pestañas nativa.

## Probarla en el móvil (5 minutos)

1. Instala **Node.js 20+** en tu ordenador.
2. En el móvil instala **Expo Go** (App Store / Google Play).
3. En esta carpeta:

   ```bash
   npm install
   npx expo start
   ```

4. Escanea el código QR con la cámara (iPhone) o con Expo Go (Android).

## Personalizarla

Todo lo del negocio está en **`src/config.ts`**:

| Qué | Dónde |
| --- | --- |
| URL de WordPress | `WP_URL` (o variable `EXPO_PUBLIC_WP_URL`) |
| WhatsApp y email | `CONTACT` |
| Servicios (textos, iconos, página de WordPress asociada) | `SERVICES` |

Colores de marca: **`src/constants/theme.ts`** (`Brand.primary` y `Brand.accent`).

Logo e iconos: sustituye los PNG de `assets/images/` (`icon.png` 1024×1024, `splash-icon.png`,
`android-icon-*.png`) y el componente `src/components/brand-mark.tsx`.

## Requisitos en WordPress

La app usa la API REST estándar de WordPress (`/wp-json/wp/v2/`), activa por defecto.
Comprueba que responde abriendo en el navegador:

```
https://nacionalidadsimple.com/wp-json/wp/v2/posts?per_page=1
```

Si ves un JSON, todo está listo. Si ves un error, revisa que ningún plugin de seguridad
(Wordfence, iThemes, "Disable REST API"…) esté bloqueando la API pública.

## Publicar en App Store y Google Play

Se compila en la nube con **EAS** (no hace falta Mac ni Android Studio):

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform all
```

Necesitas una cuenta de Apple Developer (99 $/año) y de Google Play Console (25 $ una vez).
Para pasar un APK de prueba a otras personas: `npx eas-cli@latest build -p android --profile preview`.

## Estructura

```
src/
  app/                  Pantallas (Expo Router: cada archivo es una ruta)
    (tabs)/             Inicio, Explorar, Servicios, Guardados
    post/[slug].tsx     Detalle de artículo
    categoria/[slug].tsx
    servicio/[id].tsx
  components/
    html/               Renderizador nativo del HTML de WordPress
  lib/
    wp.ts               Cliente de la API de WordPress
    queries.ts          Cache y paginación (TanStack Query)
    favorites.tsx       Guardados
  config.ts             Datos del negocio
```

## Comandos útiles

```bash
npx expo start          # servidor de desarrollo
npx expo lint           # lint
npm run typecheck       # comprobación de tipos
```
