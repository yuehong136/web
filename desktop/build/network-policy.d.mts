export interface DesktopNetworkPolicyReceipt {
  readonly schemaVersion: 1
  readonly viteMode: string
  readonly environment: Readonly<
    Record<
      'VITE_API_BASE_URL' | 'VITE_ADMIN_API_BASE_URL' | 'VITE_WS_BASE_URL',
      string | null
    >
  >
}

export function createRendererNetworkPolicyReceipt(
  environment: Readonly<Record<string, string>>,
  options?: Readonly<{ viteMode?: string }>,
): DesktopNetworkPolicyReceipt
