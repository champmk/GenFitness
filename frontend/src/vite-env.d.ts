/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_REGION: string
  readonly VITE_USER_POOL_ID: string
  readonly VITE_CLIENT_ID: string
  readonly VITE_REDIRECT_URI: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}