/** 供 Axios 拦截器同步读取，避免 request ↔ capabilities 循环依赖 */
export const capabilitySnapshot = {
  loaded: false,
  modules: {} as Record<string, boolean>,
  probeFailed: false,
}

export function syncCapabilitySnapshot(
  loaded: boolean,
  modules: Record<string, boolean>,
  probeFailed = false,
) {
  capabilitySnapshot.loaded = loaded
  capabilitySnapshot.modules = modules
  capabilitySnapshot.probeFailed = probeFailed
}

export function snapshotEnabled(name: string): boolean {
  if (capabilitySnapshot.probeFailed) return true
  return capabilitySnapshot.modules[name] === true
}
