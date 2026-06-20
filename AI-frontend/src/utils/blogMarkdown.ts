import { marked } from 'marked'
import { Renderer } from 'marked'
import hljs from 'highlight.js/lib/core'
import langHtml from 'highlight.js/lib/languages/xml'
import langCss from 'highlight.js/lib/languages/css'
import langJs from 'highlight.js/lib/languages/javascript'
import langTs from 'highlight.js/lib/languages/typescript'
import langJson from 'highlight.js/lib/languages/json'
import langBash from 'highlight.js/lib/languages/bash'
import langJava from 'highlight.js/lib/languages/java'
import langPython from 'highlight.js/lib/languages/python'
import langMarkdown from 'highlight.js/lib/languages/markdown'
import langSql from 'highlight.js/lib/languages/sql'
import langYaml from 'highlight.js/lib/languages/yaml'

hljs.registerLanguage('html', langHtml)
hljs.registerLanguage('xml', langHtml)
hljs.registerLanguage('css', langCss)
hljs.registerLanguage('javascript', langJs)
hljs.registerLanguage('js', langJs)
hljs.registerLanguage('typescript', langTs)
hljs.registerLanguage('ts', langTs)
hljs.registerLanguage('json', langJson)
hljs.registerLanguage('bash', langBash)
hljs.registerLanguage('sh', langBash)
hljs.registerLanguage('shell', langBash)
hljs.registerLanguage('java', langJava)
hljs.registerLanguage('python', langPython)
hljs.registerLanguage('py', langPython)
hljs.registerLanguage('markdown', langMarkdown)
hljs.registerLanguage('md', langMarkdown)
hljs.registerLanguage('sql', langSql)
hljs.registerLanguage('yaml', langYaml)
hljs.registerLanguage('yml', langYaml)

const renderer = new Renderer()

renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : ''
  const highlighted = language
    ? hljs.highlight(text, { language }).value
    : hljs.highlightAuto(text).value
  const langLabel = language || 'code'
  const escaped = langLabel.replace(/"/g, '&quot;')
  return `<div class="code-block"><div class="code-block__header"><span class="code-block__lang">${escaped}</span><button type="button" class="code-block__copy" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('code').innerText)">复制</button></div><pre><code class="hljs language-${escaped}">${highlighted}</code></pre></div>`
}

marked.use({ renderer, breaks: true, gfm: true })

/**
 * 渲染随笔 Markdown 为 HTML（含代码块顶栏与高亮）
 */
export function renderBlogMarkdown(content: string): string {
  if (!content?.trim()) return ''
  return marked.parse(content) as string
}
