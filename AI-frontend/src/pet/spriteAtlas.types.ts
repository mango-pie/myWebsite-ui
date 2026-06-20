import type { PetSpriteAtlas, PetState } from './types'

/**
 * 未来 Sprite 资源规范（本阶段仅类型契约）：
 *
 * 1. 雪碧图 PNG/WebP，透明背景，单帧 64×64（或 128×128 @2x）
 * 2. 按 row 分行排列各状态动画帧
 * 3. 可选 JSON atlas：
 *
 * @example
 * {
 *   "frameWidth": 64,
 *   "frameHeight": 64,
 *   "imageUrl": "/assets/pet/dango-sprite.png",
 *   "clips": {
 *     "idle":  { "row": 0, "frameCount": 4, "fps": 6,  "loop": true },
 *     "walk":  { "row": 1, "frameCount": 6, "fps": 10, "loop": true },
 *     "react": { "row": 2, "frameCount": 8, "fps": 12, "loop": false },
 *     "sleep": { "row": 3, "frameCount": 2, "fps": 2,  "loop": true },
 *     "drag":  { "row": 4, "frameCount": 1, "fps": 0,  "loop": false }
 *   }
 * }
 */
export interface PetSpriteAtlasJson {
  frameWidth: number
  frameHeight: number
  imageUrl: string
  clips: Partial<Record<PetState, {
    row: number
    frameCount: number
    fps: number
    loop: boolean
  }>>
}

/** 默认 atlas 映射，供 PetRendererSprite 未来实现参考 */
export const DEFAULT_SPRITE_ATLAS: PetSpriteAtlas = {
  idle: { row: 0, frameCount: 4, fps: 6, loop: true },
  walk: { row: 1, frameCount: 6, fps: 10, loop: true },
  react: { row: 2, frameCount: 8, fps: 12, loop: false },
  sleep: { row: 3, frameCount: 2, fps: 2, loop: true },
  drag: { row: 4, frameCount: 1, fps: 0, loop: false },
}
