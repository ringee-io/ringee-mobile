const DEFAULT_API_URL = process.env.EXPO_PUBLIC_RINGEE_API_URL;
const DEFAULT_CALLER_ID = '+17869460882';

export const API_URL =
  process.env.EXPO_PUBLIC_RINGEE_API_URL?.replace(/\/$/, '') || DEFAULT_API_URL;

export const APP_NAME = 'Ringee';
export const APP_TAGLINE = 'Your follow-up companion';

export const WEB_URL = 'https://www.ringee.io';
export const WEB_URL_TERMS = 'https://www.ringee.io/terms';
export const WEB_URL_PRIVACY = 'https://www.ringee.io/privacy';


// ─────────────────────────────────────────────────────────────────────────
// TELNYX — ÚNICO PUNTO DE PRESIÓN
// Toda la config de voz vive aquí, hardcodeada, para aislar variables mientras
// depuramos el "caller ID inválido". Cambia un valor aquí y afecta toda la app.
//
//  - sipUsername / sipPassword: credenciales de la SIP Credential Connection
//    "Ringee SIP - Develop" (las mismas que usa la web).
//  - callerId: número saliente. Telnyx valida que el caller ID pertenezca a la
//    CUENTA en cada INVITE; si no, rechaza con 403 "Caller Origination Number
//    is Invalid". `+17869460882` es el número compartido de Ringee (el que la
//    web usa como fallback). Si tu cuenta DEV no lo tiene, ponlo aquí con uno
//    que sí esté en Telnyx > Numbers de tu cuenta.
//  - debug: deja `true` para que el SDK imprima en Metro el evento de hangup
//    con `cause` / `sipReason` (el motivo real del rechazo).
// ─────────────────────────────────────────────────────────────────────────
export const TELNYX = {
  sipUsername: process.env.EXPO_PUBLIC_TELNYX_SIP_USERNAME,
  sipPassword: process.env.EXPO_PUBLIC_TELNYX_SIP_PASSWORD,
  callerName: process.env.EXPO_PUBLIC_TELNYX_CALLER_NAME || 'Ringee Mobile Dev',
  callerId: process.env.EXPO_PUBLIC_TELNYX_CALLER_ID || DEFAULT_CALLER_ID,
  debug: process.env.EXPO_PUBLIC_TELNYX_DEBUG === 'true',
} as const;
