/** Parse / sync blog filter query: cats & tags as comma-separated numeric ids. */

export function parseIdList(raw: unknown): number[] {
  if (raw == null || raw === '') return []
  const s = Array.isArray(raw) ? raw.join(',') : String(raw)
  return [
    ...new Set(
      s
        .split(',')
        .map((x) => Number(x.trim()))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ]
}

export function serializeIdList(ids: number[]): string | undefined {
  const clean = [...new Set(ids.filter((n) => Number.isFinite(n) && n > 0))]
  return clean.length ? clean.join(',') : undefined
}

export function buildFilterQuery(cats: number[], tags: number[]) {
  const q: Record<string, string> = {}
  const c = serializeIdList(cats)
  const t = serializeIdList(tags)
  if (c) q.cats = c
  if (t) q.tags = t
  return q
}

/** Within cats OR; within tags OR; between cat-group and tag-group AND. */
export function matchPostFilters(
  post: API.BlogPostVO,
  catIds: number[],
  tagIds: number[],
): boolean {
  const catOk =
    catIds.length === 0 || (post.categoryId != null && catIds.includes(post.categoryId))
  const postTagIds = (post.tags || []).map((t) => t.id!).filter(Boolean) as number[]
  const tagOk =
    tagIds.length === 0 || tagIds.some((id) => postTagIds.includes(id))
  return catOk && tagOk
}

/**
 * 0–1 total selected conditions → use server categoryId/tagId.
 * ≥2 → client-side filter (caller fetches without cat/tag or with one hint).
 */
export function resolveServerFilter(catIds: number[], tagIds: number[]) {
  const total = catIds.length + tagIds.length
  if (total === 0) {
    return { mode: 'none' as const, categoryId: undefined, tagId: undefined }
  }
  if (total === 1 && catIds.length === 1) {
    return { mode: 'server' as const, categoryId: catIds[0], tagId: undefined }
  }
  if (total === 1 && tagIds.length === 1) {
    return { mode: 'server' as const, categoryId: undefined, tagId: tagIds[0] }
  }
  return { mode: 'client' as const, categoryId: undefined, tagId: undefined }
}
