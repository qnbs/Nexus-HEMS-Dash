// Type declarations for Tauri plugins (optional runtime dependencies)
declare module '@tauri-apps/plugin-updater' {
  interface Update {
    version: string;
    body: string | null;
    downloadAndInstall(
      onProgress?: (event: { event: string; data: Record<string, number> }) => void,
    ): Promise<void>;
  }
  export function check(): Promise<Update | null>;
}

declare module '@tauri-apps/plugin-process' {
  export function relaunch(): Promise<void>;
  export function exit(code?: number): Promise<void>;
}
