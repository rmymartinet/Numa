// src/utils/api.ts
type TauriInvoke = <T = any>(cmd: string, args?: Record<string, any>) => Promise<T>;

const getInvoke = (): TauriInvoke => {
  const inv = (globalThis as any).__TAURI__?.invoke as TauriInvoke | undefined;
  if (inv) return inv;
  
  // Fallback for browser/Playwright/Vitest (no Tauri)
  return async (cmd: string, args?: Record<string, any>) => {
    console.warn(`[api fallback] invoke(${cmd})`, args);
    if (cmd === "get_stealth_status") return false as any;
    if (cmd === "toggle_stealth_cmd") return undefined as any;
    if (cmd === "capture_screen") return "/tmp/screenshot.png" as any;
    if (cmd === "get_image_as_base64") {
      // 1x1 transparent PNG
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMAAQAABQABlR9uJwAAAABJRU5ErkJggg==";
    }
    return undefined as any;
  };
};

const invoke = getInvoke();

export async function getStealthStatus(): Promise<boolean> {
  return invoke<boolean>("get_stealth_status");
}

export async function toggleStealth(): Promise<void> {
  await invoke<void>("toggle_stealth_cmd");
}

export async function captureScreen(): Promise<string> {
  // returns path on disk (Rust side)
  return invoke<string>("capture_screen");
}

export async function getImageAsBase64(imagePath: string): Promise<string> {
  return invoke<string>("get_image_as_base64", { imagePath });
}

export async function panelShow(): Promise<void> {
  await invoke<void>("panel_show");
}

export async function panelHide(): Promise<void> {
  await invoke<void>("panel_hide");
}

export async function resizeWindow(width: number, height: number): Promise<void> {
  await invoke<void>("resize_window", { width, height });
}
