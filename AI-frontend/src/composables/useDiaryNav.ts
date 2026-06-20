/** 导航栏点击「日记」：子页回主页 */
export function resolveDiaryMenuClickPath(currentPath: string): string {
  if (currentPath.startsWith('/diary/')) {
    return '/diary'
  }
  return '/diary'
}
