export interface ElectronAPI {
  onOpenSettings: (callback: (tab?: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
