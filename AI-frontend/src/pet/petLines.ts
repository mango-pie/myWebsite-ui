const PET_LINES = [
  '又在摸鱼？',
  '实验室有新想法吗？',
  '今天写随笔了吗？',
  '要不要去听听音乐～',
  '在这里陪你哦',
  '记得多喝水！',
  '代码写累了就歇会儿',
  '嘿嘿～',
  '戳我干嘛啦',
  '要不要去看看最新文章？',
  '双击我可以聊天哦～',
  '今天也要开开心心的！',
  '别熬夜啦，早点休息～',
  '有 bug 的话深呼吸一下',
  '灵感来了就去实验室试试！',
  '摸鱼五分钟，效率涨一倍？',
  '我在呢，慢慢来就好～',
  '记得起来活动活动筋骨',
  '写不出来就先发会儿呆',
  '今日一言看了吗？',
  '拖动我可以换位置哦',
  '哼，才不是在等你理我呢',
  '要不要换首背景音乐？',
  '加油，你可以的！',
  '今日运势不错～',
  '累了就戳戳我聊聊天吧',
  '博客又多了新内容吗？',
  '键盘敲慢点，手会痛的',
  '诶嘿，被发现了～',
]

export function pickRandomLine(exclude?: string): string {
  const pool = exclude ? PET_LINES.filter((line) => line !== exclude) : PET_LINES
  const source = pool.length > 0 ? pool : PET_LINES
  return source[Math.floor(Math.random() * source.length)] ?? PET_LINES[0]
}
