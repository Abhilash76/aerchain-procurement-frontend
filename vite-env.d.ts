/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYSIS_SERVER?: string;
  readonly VITE_OLLAMA_CHAT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
