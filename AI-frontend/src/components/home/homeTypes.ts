/** Shared home page content card types */

export interface HomePostCard {
  id?: number
  title: string
  excerpt: string
  tag: string
  meta: string
  path?: string
}

export interface HomeShowCard {
  id?: number
  title: string
  desc: string
  url: string
  path?: string
  kind: 'todo' | 'dash' | 'app'
}
