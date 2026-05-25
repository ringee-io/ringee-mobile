declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    EXPO_PUBLIC_RINGEE_API_URL?: string;
    EXPO_PUBLIC_TELNYX_SIP_USERNAME?: string;
    EXPO_PUBLIC_TELNYX_SIP_PASSWORD?: string;
    EXPO_PUBLIC_TELNYX_CALLER_NAME?: string;
    EXPO_PUBLIC_TELNYX_PUBLIC_CALLER_ID?: string;
  }
}
