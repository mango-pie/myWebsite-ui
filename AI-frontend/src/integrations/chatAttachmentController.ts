/**
 * 聊天附件上传 — 手写 multipart，openapi 生成的 uploadAttachment 为 JSON 不适用。
 * 别名层，避免被 openapi2ts 覆盖。
 */
import request from '@/request'

export async function uploadChatAttachment(file: File): Promise<API.ChatAttachmentVO> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await request.post<API.BaseResponseChatAttachmentVO>('/chat/attachment', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  const body = res.data
  if (body.code !== 0 || !body.data) {
    throw new Error(body.message || '图片上传失败')
  }
  return body.data
}
