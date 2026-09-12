# -*- coding: utf-8 -*-
"""Extract Reading Room v1 + Knowledge v17 CSS into Vue assets."""
import re
from pathlib import Path

ROOT = Path(r"E:\java_demo\Ai-scene\AI-backend")
PREVIEW = ROOT / "design-preview"
OUT = ROOT / "AI-frontend" / "src" / "assets" / "styles"


def strip_resets(css: str) -> str:
    css = re.sub(r"\*\{margin:0;padding:0;box-sizing:border-box\}\s*", "", css)
    css = re.sub(r"html,body\{[^}]+\}\s*", "", css)
    css = re.sub(r"body\{[^}]+\}\s*", "", css, count=1)
    return css


def extract_reading() -> None:
    text = (PREVIEW / "Reading Room v1.html").read_text(encoding="utf-8")
    m = re.search(r"<style>(.*?)</style>", text, re.S)
    if not m:
        raise SystemExit("Reading Room: no <style>")
    css = strip_resets(m.group(1))
    # Keep :root tokens; scope duplicates under room root via header vars.
    css = re.sub(r"(?<![\w-])\.page(?=[\s\{\.\#\[:,>~+])", ".reading-page", css)
    css = re.sub(r"\.reading-page\.on\{[^}]+\}", "", css)
    css = re.sub(r"\.reading-page\.is-enter\{[^}]+\}", "", css)

    header = """/* Reading Room v1 — violet observatory layout (from design-preview) */
.reading-room-root {
  --ink: #4c5570;
  --ink-soft: #7a83a0;
  --ink-faint: #a5acc4;
  --c-violet: #9b8ce8;
  --c-violet-soft: #e4dffd;
  --c-lilac: #c79ae0;
  --c-blue: #6aaee8;
  --c-mint: #5fc4a5;
  --c-mint-soft: #d6f2e8;
  --c-sun: #ffcf6e;
  --c-sakura: #f490ad;
  --room: #9b8ce8;
  --room-soft: #e4dffd;
  --shadow-1: 0 2px 6px rgba(96, 116, 168, 0.1), 0 10px 28px rgba(96, 116, 168, 0.12);
  --shadow-2: 0 4px 10px rgba(96, 116, 168, 0.14), 0 20px 48px rgba(96, 116, 168, 0.18);
  --r-md: 20px;
  --r-sm: 14px;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.5, 1);
  --ease-out: cubic-bezier(0.22, 0.8, 0.32, 1);
  --col-side: 248px;
  --col-deck: 280px;
  --mid-input-w: 680px;
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
html.reading-room-lock,
body.reading-room-lock {
  overflow: hidden;
  min-height: 100%;
}
.reading-room-root .text-pretty {
  text-wrap: pretty;
}
.reading-room-root button,
.reading-room-root input,
.reading-room-root textarea,
.reading-room-root select {
  font-family: inherit;
  color: inherit;
}
.reading-room-root button {
  cursor: pointer;
  border: none;
  background: none;
}
.reading-room-root input,
.reading-room-root textarea,
.reading-room-root select {
  border: none;
  outline: none;
  background: transparent;
}
.reading-room-root .reading-page {
  position: relative;
  z-index: 4;
  height: 996px;
  padding: 8px 48px 28px;
  animation: readingPageIn 0.42s var(--ease-out);
}
@keyframes readingPageIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.reading-room-root .reading-subnav {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.reading-room-root .reading-subnav button {
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 1px;
  background: rgba(255, 255, 255, 0.72);
  border: 1.5px solid rgba(255, 255, 255, 0.95);
  color: var(--ink-soft);
  transition: transform 0.25s var(--ease-spring), background 0.2s, color 0.2s, box-shadow 0.2s;
}
.reading-room-root .reading-subnav button:hover {
  transform: translateY(-1px);
  color: var(--ink);
}
.reading-room-root .reading-subnav button.on {
  background: var(--room-soft);
  color: var(--room);
  box-shadow: var(--shadow-1);
}

"""
    dst = OUT / "reading-room-v1.css"
    dst.write_text(header + css, encoding="utf-8")
    print(f"wrote {dst} ({dst.stat().st_size} bytes)")


def extract_knowledge() -> None:
    text = (PREVIEW / "Knowledge v17.html").read_text(encoding="utf-8")
    blocks = re.findall(r"<style>(.*?)</style>", text, re.S)
    if not blocks:
        raise SystemExit("Knowledge: no <style>")
    css = strip_resets("\n".join(blocks))
    css = re.sub(r"(?<![\w-])\.page(?=[\s\{\.\#\[:,>~+])", ".knowledge-page", css)
    # Vue always mounts one page; never keep preview's display:none base.
    css = re.sub(
        r"\.knowledge-page\{display:none;([^}]*)\}",
        r".knowledge-page{display:block;\1}",
        css,
        count=1,
    )
    css = re.sub(r"\.knowledge-page\.on\{[^}]+\}", "", css)

    header = """/* Knowledge v17 — blue library room (from design-preview) */
.knowledge-room-root {
  --ink: #4c5570;
  --ink-soft: #7a83a0;
  --ink-faint: #a5acc4;
  --c-violet: #9b8ce8;
  --c-violet-soft: #e4dffd;
  --c-lilac: #c79ae0;
  --c-blue: #6aaee8;
  --c-blue-soft: #d8ebfb;
  --c-mint: #5fc4a5;
  --c-mint-soft: #d6f2e8;
  --c-sun: #ffcf6e;
  --c-sakura: #f490ad;
  --room: #6aaee8;
  --room-soft: #d8ebfb;
  --shadow-1: 0 2px 6px rgba(96, 116, 168, 0.1), 0 10px 28px rgba(96, 116, 168, 0.12);
  --shadow-2: 0 4px 10px rgba(96, 116, 168, 0.14), 0 20px 48px rgba(96, 116, 168, 0.18);
  --r-md: 20px;
  --r-sm: 14px;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.5, 1);
  --ease-out: cubic-bezier(0.22, 0.8, 0.32, 1);
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
html.knowledge-room-lock,
body.knowledge-room-lock {
  overflow: hidden;
  min-height: 100%;
}
.knowledge-room-root .text-pretty {
  text-wrap: pretty;
}
.knowledge-room-root button,
.knowledge-room-root input,
.knowledge-room-root textarea,
.knowledge-room-root select {
  font-family: inherit;
  color: inherit;
}
.knowledge-room-root button {
  cursor: pointer;
  border: none;
  background: none;
}
.knowledge-room-root input,
.knowledge-room-root textarea,
.knowledge-room-root select {
  border: none;
  outline: none;
  background: transparent;
}
.knowledge-room-root .knowledge-page {
  position: relative;
  z-index: 4;
  height: 996px;
  padding: 8px 48px 28px;
  animation: knowledgePageIn 0.42s var(--ease-out);
}
@keyframes knowledgePageIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

"""
    dst = OUT / "knowledge-v17.css"
    dst.write_text(header + css, encoding="utf-8")
    print(f"wrote {dst} ({dst.stat().st_size} bytes, {len(blocks)} style blocks)")


if __name__ == "__main__":
    extract_reading()
    extract_knowledge()
