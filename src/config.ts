/**
 * Configuración central de la app.
 * Todo lo que es "contenido del negocio" (URL de WordPress, contacto, servicios)
 * vive aquí para poder cambiarlo sin tocar las pantallas.
 */

/** URL de la web en WordPress. Se puede sobreescribir con EXPO_PUBLIC_WP_URL. */
export const WP_URL = (process.env.EXPO_PUBLIC_WP_URL ?? 'https://nacionalidadsimple.com').replace(
  /\/+$/,
  ''
);

export const APP_NAME = 'Nacionalidad Simple';
export const APP_TAGLINE = 'Trámites de extranjería en España, explicados fácil';

export const CONTACT = {
  /** Número en formato internacional sin "+" ni espacios. */
  whatsapp: '34611899225',
  /** Para mostrarlo en pantalla. */
  whatsappDisplay: '+34 611 89 92 25',
  email: 'info@nacionalidadsimple.com',
  /** Página de contacto de la web (se abre en el navegador integrado). */
  contactUrl: `${WP_URL}/contacto/`,
};

export type Service = {
  id: string;
  title: string;
  summary: string;
  /** Nombre de icono de Ionicons (@expo/vector-icons). */
  icon: string;
  /**
   * Slug de la página (o entrada) de WordPress con la explicación completa del servicio.
   * Si existe, su contenido se muestra dentro de la app tal como en la web.
   */
  pageSlug?: string;
  /** Puntos clave que se muestran siempre, aunque no haya página en WordPress. */
  highlights: string[];
  /**
   * Formulario de solicitud con pago (WooCommerce). Se abre en el navegador integrado,
   * así funcionan la subida de archivos y la pasarela de pago tal cual en la web.
   */
  order?: { label: string; url: string };
  /** Mensaje pre-rellenado al pulsar "WhatsApp". */
  whatsappMessage: string;
};

export const SERVICES: Service[] = [
  {
    id: 'apostillado',
    title: 'Apostillado de documentos',
    summary: 'Apostillamos tus documentos argentinos para que tengan validez en España.',
    icon: 'ribbon-outline',
    pageSlug: 'apostillas',
    highlights: [
      'Apostilla de La Haya para documentos argentinos',
      'Trámite 100% online, sin moverte de casa',
      'Apostilla digital válida en España y en los países del Convenio',
    ],
    order: { label: 'Solicitar apostilla online', url: `${WP_URL}/apostillas/` },
    whatsappMessage: 'Hola, me interesa el servicio de apostillado de documentos argentinos.',
  },
  {
    id: 'certificados',
    title: 'Certificados argentinos',
    summary: 'Solicitamos por ti certificados oficiales argentinos, sin viajar.',
    icon: 'document-text-outline',
    highlights: [
      'Certificado de antecedentes penales nacionales',
      'Certificado internacional de legalidad del carnet de conducir',
      'Con apostilla incluida si la necesitas',
    ],
    whatsappMessage: 'Hola, necesito solicitar un certificado argentino.',
  },
  {
    id: 'canje-licencia',
    title: 'Canje de licencia de conducir',
    summary: 'Te ayudamos a canjear tu carnet argentino por el español (DGT).',
    icon: 'car-outline',
    pageSlug: 'canje-de-conducir',
    highlights: [
      'Canje del carnet de conducir argentino ante la DGT',
      'Certificado de legalidad del carnet argentino',
      'Gestión del trámite online',
    ],
    whatsappMessage: 'Hola, quiero información sobre el canje de mi licencia de conducir argentina.',
  },
];
