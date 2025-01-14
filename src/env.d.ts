/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string
  readonly VITE_DAILY_API_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_DAILY_BOTS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}