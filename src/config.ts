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
  // TODO: reemplazar por los datos reales.
  /** Número en formato internacional sin "+" ni espacios, p. ej. 34600111222 */
  whatsapp: '34600000000',
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
   * Slug de la página de WordPress con la descripción completa del servicio.
   * Si existe, su contenido se muestra dentro de la app tal como en la web.
   */
  pageSlug?: string;
  /** Puntos clave que se muestran siempre, aunque no haya página en WordPress. */
  highlights: string[];
  /** Mensaje pre-rellenado al pulsar "Solicitar por WhatsApp". */
  whatsappMessage: string;
};

// TODO: ajustar textos y slugs a las páginas reales de la web.
export const SERVICES: Service[] = [
  {
    id: 'apostillado',
    title: 'Apostillado de documentos',
    summary: 'Apostillamos tus documentos para que tengan validez internacional.',
    icon: 'ribbon-outline',
    pageSlug: 'apostillado',
    highlights: [
      'Apostilla de La Haya para documentos españoles',
      'Gestión completa sin que tengas que desplazarte',
      'Envío a domicilio en España y al extranjero',
    ],
    whatsappMessage: 'Hola, me interesa el servicio de apostillado de documentos.',
  },
  {
    id: 'nacionalidad',
    title: 'Nacionalidad española',
    summary: 'Te acompañamos en todo el expediente de nacionalidad por residencia.',
    icon: 'flag-outline',
    pageSlug: 'nacionalidad-espanola',
    highlights: [
      'Revisión de requisitos y documentación',
      'Presentación telemática del expediente',
      'Seguimiento hasta la resolución y jura',
    ],
    whatsappMessage: 'Hola, quiero información sobre el trámite de nacionalidad española.',
  },
  {
    id: 'residencia',
    title: 'Residencia y arraigo',
    summary: 'Arraigo social, laboral, familiar y renovaciones de residencia.',
    icon: 'home-outline',
    pageSlug: 'residencia-y-arraigo',
    highlights: [
      'Estudio previo de tu caso',
      'Preparación y presentación de la solicitud',
      'Renovaciones y modificaciones',
    ],
    whatsappMessage: 'Hola, quiero información sobre residencia / arraigo.',
  },
  {
    id: 'citas',
    title: 'Citas y trámites NIE / TIE',
    summary: 'Te ayudamos con citas de extranjería, huellas y certificados.',
    icon: 'calendar-outline',
    highlights: [
      'NIE, TIE y certificado de registro UE',
      'Toma de huellas y recogida de tarjeta',
      'Certificados y antecedentes penales',
    ],
    whatsappMessage: 'Hola, necesito ayuda con una cita / trámite de NIE o TIE.',
  },
];
