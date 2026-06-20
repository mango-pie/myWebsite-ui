import type { PetRouteReaction, PetState } from './types'

const ROUTE_REACTIONS: Record<string, PetRouteReaction> = {
  '/lab': { line: '要去搞点实验吗？', state: 'react' },
  '/blog': { line: '今天写点什么好呢…', state: 'react' },
  '/diary': { line: '今天的心情写了吗？', state: 'react' },
  '/about': { line: '想了解站主？', state: 'react' },
}

export function getRouteReaction(path: string): PetRouteReaction | null {
  if (ROUTE_REACTIONS[path]) {
    return ROUTE_REACTIONS[path]
  }

  for (const [routePath, reaction] of Object.entries(ROUTE_REACTIONS)) {
    if (routePath !== '/' && path.startsWith(`${routePath}/`)) {
      return reaction
    }
  }

  return null
}

export function registerRouteReaction(path: string, reaction: PetRouteReaction) {
  ROUTE_REACTIONS[path] = reaction
}

export type { PetState }
