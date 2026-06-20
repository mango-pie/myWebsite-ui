# integrations — 第三方 / 非 OpenAPI 接口

`src/api/` 由 `npm run openapi2ts` 根据后端 Swagger **全量生成**，运行后会覆盖该目录下的手写文件。

本目录存放 **不在后端 OpenAPI 中** 的前端 API 封装，例如：

| 文件 | 说明 |
|------|------|
| `hitokoto.ts` | 今日一言（/hitokoto-api 代理） |
| `neteaseMusic.ts` | 网易云音乐（/netease-api 代理） |
| `diaryController.ts` | 从 `@/api/diaryEntryController`  re-export（兼容旧 import 名） |
| `chatAttachmentController.ts` | 聊天图片 multipart 上传（openapi 生成版不适用） |

新增第三方集成请放在此处，引用方式：`import { ... } from '@/integrations/xxx'`。
