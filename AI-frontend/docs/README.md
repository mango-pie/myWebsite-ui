# Knowledge AI 文档目录

这里存放 AI 智能知识库 Knowledge AI 的项目需求、阶段规划、简历材料和面试讲解文档。

## 前端重建（当前）

- **[FEATURES.md — 待实现功能总览](./FEATURES.md)**：纸间前端推倒后需重新实现的全部功能、接口对照、优先级与验收清单。

## 文档列表

- [00 项目需求总览](./00-project-overview.md)
- [01 V1 基础后台需求文档](./01-v1-basic-admin.md)
- [02 V2 知识库与文档管理需求文档](./02-v2-knowledge-document.md)
- [03 V3 RAG 核心需求文档](./03-v3-rag-core.md)
- [04 V4 AI 聊天需求文档](./04-v4-ai-chat.md)
- [05 V5 扩展功能需求文档](./05-v5-extensions.md)
- [06 简历与面试材料](./06-resume-and-interview.md)

## 推荐阅读顺序

1. 重建前端时先读 `FEATURES.md`，再按模块实现。
2. 先阅读 `00-project-overview.md`，了解知识库主链路与阶段安排。
3. 按 V1 到 V4 顺序加深理解；核心完成后看 V5。
4. 准备简历和面试时，重点阅读 `06-resume-and-interview.md`。

## 阶段重点

| 阶段 | 文档 | 核心重点 |
| --- | --- | --- |
| 前端重建 | `FEATURES.md` | 全站功能台账、API 对照、P0–P3 排期 |
| 总览 | `00-project-overview.md` | 项目定位、技术栈、总体架构、开发路线 |
| V1 | `01-v1-basic-admin.md` | Spring Security、JWT、Redis、用户管理 |
| V2 | `02-v2-knowledge-document.md` | 知识库管理、文档上传、MinIO、MySQL 元数据 |
| V3 | `03-v3-rag-core.md` | 文档解析、文本切块、Embedding、pgvector |
| V4 | `04-v4-ai-chat.md` | RAG 问答、多轮对话、Prompt、SSE 流式输出 |
| V5 | `05-v5-extensions.md` | 多模型、Prompt 管理、Token 统计、MCP |
| 面试 | `06-resume-and-interview.md` | 简历描述、项目亮点、面试讲解主线 |
