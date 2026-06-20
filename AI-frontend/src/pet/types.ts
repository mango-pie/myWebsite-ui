export type PetState = 'idle' | 'walk' | 'react' | 'sleep' | 'drag'
/** 交互动画：jump / happy / sigh */
export type PetOverlayState = 'jump' | 'happy' | 'sigh'
export type PetWalkPace = 'slow' | 'fast'
export type PetFacing = 'left' | 'right'
export type PetRendererKind = 'css' | 'sprite' | 'gif'
export type PetEnableMode = false | 'static' | 'full'

export interface PetPoint {
  x: number
  y: number
}

/** 渲染器唯一输入 — CSS 与 Sprite 共用 */
export interface PetViewModel {
  state: PetState
  overlay: PetOverlayState | null
  walkPace: PetWalkPace
  musicPlaying: boolean
  facing: PetFacing
  /** 相对宠物中心的指针偏移，用于眼睛跟随；null 表示无 hover */
  lookAt: PetPoint | null
}

export interface PetRect {
  x: number
  y: number
  width: number
  height: number
}

export interface PetRouteReaction {
  line?: string
  state?: PetState
}

/** Sprite 阶段：单段动画描述 */
export interface PetSpriteClip {
  row: number
  frameCount: number
  fps: number
  loop: boolean
}

export type PetSpriteAtlas = Record<PetState, PetSpriteClip>

export type PetGifStateMap = Partial<Record<PetState, string>>

export type PetGifAliasMap = Partial<Record<PetState, string[]>>

export type PetGifOverlayMap = Partial<Record<PetOverlayState, string>>

export type PetGifOverlayAliasMap = Partial<Record<PetOverlayState, string[]>>

/** 8 张 GIF 素材键名 */
export type PetGifAssetKey =
  | 'click'
  | 'default'
  | 'fly'
  | 'move'
  | 'music'
  | 'jump'
  | 'happy'
  | 'sigh'

export type PetGifAssetMap = Partial<Record<PetGifAssetKey, string>>
