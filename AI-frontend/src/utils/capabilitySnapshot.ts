/** 供 Axios 拦截器同步读取，避免 request ↔ capabilities 循环依赖 */
export const capabilitySnapshot = {
  loaded: false,
  modules: {} as Record<string, boolean>,
}

export function syncCapabilitySnapshot(loaded: boolean, modules: Record<string, boolean>) {
  capabilitySnapshot.loaded = loaded
  capabilitySnapshot.modules = modules
}

export function snapshotEnabled(name: string): boolean {
  return capabilitySnapshot.modules[name] === true
}
