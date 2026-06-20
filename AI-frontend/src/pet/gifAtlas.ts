import { siteConfig } from '@/config/site'
import type {
  PetGifAliasMap,
  PetGifAssetKey,
  PetGifAssetMap,
  PetGifOverlayAliasMap,
  PetGifOverlayMap,
  PetOverlayState,
  PetGifStateMap,
  PetState,
  PetViewModel,
} from './types'

const PET_STATES: PetState[] = ['idle', 'walk', 'react', 'sleep', 'drag']
const PET_OVERLAY_STATES: PetOverlayState[] = ['jump', 'happy', 'sigh']
const PET_ASSET_KEYS: PetGifAssetKey[] = [
  'click',
  'default',
  'fly',
  'move',
  'music',
  'jump',
  'happy',
  'sigh',
]

const gifModules = {
  ...import.meta.glob('../assets/ams/**/*.gif', {
    eager: true,
    import: 'default',
  }),
  ...import.meta.glob('../assets/ams/**/*.GIF', {
    eager: true,
    import: 'default',
  }),
} as Record<string, string>

interface GifAssetEntry {
  filePath: string
  url: string
  fileName: string
  normalizedName: string
}

export interface ResolvedPetGifAtlas {
  assets: Record<PetGifAssetKey, string>
  coreMap: Record<PetState, string>
  overlayMap: Record<PetOverlayState, string>
  loadedFiles: string[]
  unmatchedFiles: string[]
  hasAllCoreStates: boolean
  hasAllOverlayStates: boolean
  hasAllStates: boolean
  matchedStateCount: number
  fallbackState: PetState
}

function normalizeToken(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[_\-\s]+/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '')
}

function normalizeAssets(): GifAssetEntry[] {
  return Object.entries(gifModules).map(([filePath, url]) => {
    const fileName = filePath.split('/').pop() ?? filePath
    return {
      filePath,
      url,
      fileName,
      normalizedName: normalizeToken(fileName),
    }
  })
}

function pickByHint(
  assets: GifAssetEntry[],
  used: Set<string>,
  hint: string | undefined,
): GifAssetEntry | null {
  if (!hint) return null
  const normalizedHint = normalizeToken(hint)
  if (!normalizedHint) return null

  const exact = assets.find(
    (asset) =>
      !used.has(asset.filePath) &&
      (asset.normalizedName === normalizedHint || asset.fileName === hint),
  )
  if (exact) return exact

  const fuzzy = assets.find(
    (asset) =>
      !used.has(asset.filePath) &&
      (asset.normalizedName.includes(normalizedHint) || normalizedHint.includes(asset.normalizedName)),
  )
  return fuzzy ?? null
}

function resolveAssets(
  entries: GifAssetEntry[],
  assetMap: PetGifAssetMap,
): Record<PetGifAssetKey, string> {
  const used = new Set<string>()
  const assets = {} as Record<PetGifAssetKey, string>

  for (const key of PET_ASSET_KEYS) {
    const matched = pickByHint(entries, used, assetMap[key] ?? key)
    if (matched) {
      assets[key] = matched.url
      used.add(matched.filePath)
    } else {
      assets[key] = ''
    }
  }

  return assets
}

function resolveFromConfig(
  assets: GifAssetEntry[],
  used: Set<string>,
  stateMap: PetGifStateMap,
): Partial<Record<PetState, GifAssetEntry>> {
  const resolved: Partial<Record<PetState, GifAssetEntry>> = {}
  for (const state of PET_STATES) {
    const matched = pickByHint(assets, used, stateMap[state])
    if (!matched) continue
    resolved[state] = matched
    used.add(matched.filePath)
  }
  return resolved
}

function resolveByAliases(
  assets: GifAssetEntry[],
  used: Set<string>,
  aliases: PetGifAliasMap,
): Partial<Record<PetState, GifAssetEntry>> {
  const resolved: Partial<Record<PetState, GifAssetEntry>> = {}
  for (const state of PET_STATES) {
    const words = aliases[state] ?? []
    for (const word of words) {
      const matched = pickByHint(assets, used, word)
      if (!matched) continue
      resolved[state] = matched
      used.add(matched.filePath)
      break
    }
  }
  return resolved
}

function resolveOverlayFromConfig(
  assets: GifAssetEntry[],
  used: Set<string>,
  overlayMap: PetGifOverlayMap,
): Partial<Record<PetOverlayState, GifAssetEntry>> {
  const resolved: Partial<Record<PetOverlayState, GifAssetEntry>> = {}
  for (const state of PET_OVERLAY_STATES) {
    const matched = pickByHint(assets, used, overlayMap[state])
    if (!matched) continue
    resolved[state] = matched
    used.add(matched.filePath)
  }
  return resolved
}

function resolveOverlayByAliases(
  assets: GifAssetEntry[],
  used: Set<string>,
  aliases: PetGifOverlayAliasMap,
): Partial<Record<PetOverlayState, GifAssetEntry>> {
  const resolved: Partial<Record<PetOverlayState, GifAssetEntry>> = {}
  for (const state of PET_OVERLAY_STATES) {
    const words = aliases[state] ?? []
    for (const word of words) {
      const matched = pickByHint(assets, used, word)
      if (!matched) continue
      resolved[state] = matched
      used.add(matched.filePath)
      break
    }
  }
  return resolved
}

export function resolvePetGifUrl(
  model: Pick<PetViewModel, 'state' | 'overlay' | 'walkPace' | 'musicPlaying'>,
  atlas: ResolvedPetGifAtlas,
): string {
  if (model.overlay) {
    return atlas.overlayMap[model.overlay] || atlas.assets[model.overlay] || atlas.assets.default
  }

  switch (model.state) {
    case 'idle':
      return model.musicPlaying
        ? atlas.assets.music || atlas.assets.default
        : atlas.assets.default
    case 'walk':
      return model.walkPace === 'fast'
        ? atlas.assets.fly || atlas.assets.move
        : atlas.assets.move
    case 'react':
      return atlas.assets.click
    case 'sleep':
      return atlas.assets.default
    case 'drag':
      return atlas.assets.fly || atlas.assets.move
    default:
      return atlas.assets.default
  }
}

export function resolvePetGifAtlas(): ResolvedPetGifAtlas {
  const entries = normalizeAssets()
  const cfg = siteConfig.effects.petDango.gif
  const fallbackState = cfg.fallbackState
  const assets = resolveAssets(entries, cfg.assets)
  const used = new Set<string>()

  for (const entry of entries) {
    if (Object.values(assets).includes(entry.url)) {
      used.add(entry.filePath)
    }
  }

  const explicitResolved = resolveFromConfig(entries, used, cfg.stateMap)
  const aliasResolved = resolveByAliases(entries, used, cfg.aliases)
  const merged: Partial<Record<PetState, GifAssetEntry>> = {
    ...aliasResolved,
    ...explicitResolved,
  }

  const fallbackAsset =
    merged[fallbackState] ??
    pickByHint(entries, used, cfg.stateMap[fallbackState]) ??
    entries.find((entry) => entry.normalizedName === 'default') ??
    entries[0] ??
    null
  if (fallbackAsset) {
    used.add(fallbackAsset.filePath)
  }

  const coreMap = {} as Record<PetState, string>
  let hasAllCoreStates = true
  for (const state of PET_STATES) {
    const target = merged[state] ?? fallbackAsset
    if (!target) {
      hasAllCoreStates = false
      coreMap[state] = assets.default
      continue
    }
    coreMap[state] = target.url
    if (!merged[state]) hasAllCoreStates = false
  }

  const overlayExplicitResolved = resolveOverlayFromConfig(entries, used, cfg.overlayMap)
  const overlayAliasResolved = resolveOverlayByAliases(entries, used, cfg.overlayAliases)
  const overlayMerged: Partial<Record<PetOverlayState, GifAssetEntry>> = {
    ...overlayAliasResolved,
    ...overlayExplicitResolved,
  }

  const overlayMap = {} as Record<PetOverlayState, string>
  let hasAllOverlayStates = true
  for (const state of PET_OVERLAY_STATES) {
    const target = overlayMerged[state]
    if (!target) {
      overlayMap[state] = assets[state] || assets.default
      hasAllOverlayStates = false
      continue
    }
    overlayMap[state] = target.url
  }

  const unmatchedFiles = entries
    .filter((entry) => !used.has(entry.filePath))
    .map((entry) => entry.fileName)

  const matchedAssetCount = PET_ASSET_KEYS.filter((key) => Boolean(assets[key])).length

  return {
    assets,
    coreMap,
    overlayMap,
    loadedFiles: entries.map((entry) => entry.fileName),
    unmatchedFiles,
    hasAllCoreStates,
    hasAllOverlayStates,
    hasAllStates: matchedAssetCount >= 8,
    matchedStateCount: matchedAssetCount,
    fallbackState,
  }
}
