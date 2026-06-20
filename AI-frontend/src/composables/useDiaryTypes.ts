export interface DiarySavePayload {
  diaryDate: string
  title?: string
  content?: string
  mood?: string
  weather?: string
  tags?: string[]
  status?: number
  coverUrl?: string
}
