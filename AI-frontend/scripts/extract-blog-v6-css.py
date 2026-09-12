import re
from pathlib import Path

src = Path(r"E:\java_demo\Ai-scene\AI-backend\design-preview\Blog v6.html")
dst = Path(r"E:\java_demo\Ai-scene\AI-backend\AI-frontend\src\assets\styles\blog-v6.css")
text = src.read_text(encoding="utf-8")
m = re.search(r"<style>(.*?)</style>", text, re.S)
css = m.group(1)
end = css.find("#tweaks")
g = css.find(".glass{")
chunk = css[g:end] if g >= 0 else css
chunk = re.sub(r"\.page\{[^}]+\}", "", chunk)
chunk = re.sub(r"\.page\.on\{[^}]+\}", "", chunk)

header = """/* Blog v6 layout — color tokens from home-v3.css */
.blog-room-root {
  --col-read: 680px;
  --col-side: 248px;
  --col-deck: 300px;
  color: var(--ink);
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Source Han Sans SC", sans-serif;
  -webkit-font-smoothing: antialiased;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  background:
    radial-gradient(1200px 700px at 12% -10%, var(--page-2), transparent 60%),
    radial-gradient(1000px 800px at 105% 110%, var(--page-3), transparent 55%),
    linear-gradient(160deg, var(--page-1), var(--page-2) 55%, var(--page-3));
  transition: background 1.4s var(--ease-out);
}
html.blog-room-lock,
body.blog-room-lock {
  overflow: hidden;
  min-height: 100%;
}
.blog-room-root .text-pretty { text-wrap: pretty; }
.blog-room-root button,
.blog-room-root input,
.blog-room-root textarea,
.blog-room-root select { font-family: inherit; color: inherit; }
.blog-room-root button { cursor: pointer; border: none; background: none; }
.blog-room-root input,
.blog-room-root textarea,
.blog-room-root select { border: none; outline: none; background: transparent; }
.blog-room-root .blog-page {
  position: relative;
  z-index: 4;
  height: 996px;
  padding: 8px 48px 28px;
  animation: pageIn 0.42s var(--ease-out);
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

"""

dst.write_text(header + chunk, encoding="utf-8")
print(f"wrote {dst} ({dst.stat().st_size} bytes)")
