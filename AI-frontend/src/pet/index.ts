export { default as PetDango } from './components/PetDango.vue'
export type {
  PetState,
  PetOverlayState,
  PetWalkPace,
  PetFacing,
  PetViewModel,
  PetRendererKind,
  PetEnableMode,
  PetGifStateMap,
  PetGifAliasMap,
  PetGifOverlayMap,
  PetGifOverlayAliasMap,
  PetGifAssetKey,
  PetGifAssetMap,
} from './types'
export { registerRouteReaction } from './routeReactions'
export { registerAvoidanceZone, unregisterAvoidanceZone } from './composables/usePetAvoidance'
export { usePetAiChat } from './composables/usePetAiChat'
