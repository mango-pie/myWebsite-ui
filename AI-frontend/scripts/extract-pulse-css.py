#!/usr/bin/env python3
"""Extract and scope Miku Pulse Player CSS into music-pulse-v1.css"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
RAW_HTML = ROOT / "design-preview" / "Miku Pulse Player v1.html"
OUT = ROOT / "AI-frontend" / "src" / "assets" / "styles" / "music-pulse-v1.css"
SCOPE = ".music-room-root"

html = RAW_HTML.read_text(encoding="utf-8")
start = html.find("<style>") + len("<style>")
end = html.find("</style>")
raw = html[start:end].strip()

header = r"""@import url("https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Noto+Sans+SC:wght@400;500;600;700;900&display=swap");

/* Music Pulse room — adapted from Miku Pulse Player v1 */
html.music-room-lock,
body.music-room-lock {
  overflow: hidden;
  height: 100%;
  min-height: 100%;
}

.music-room-root.home-v3-root {
  --ink: #07121B;
  --ink-deep: #040A0F;
  --surface: #0B1E28;
  --surface-raised: #0F2934;
  --surface-soft: #12333D;
  --accent: #39C5BB;
  --accent-rgb: 57 197 187;
  --ice: #BDFCF4;
  --magenta: #FF4F91;
  --yellow: #FFC857;
  --text: #F2FFFD;
  --muted: #86A8AD;
  --faint: #527279;
  --line: rgb(189 252 244 / 0.15);
  --line-strong: rgb(189 252 244 / 0.34);
  --danger: #FF667F;
  --beam-opacity: 0.28;
  --grid-opacity: 0.12;
  --character-scale: 1;
  --motion: 1;
  --radius-panel: 14px;
  --radius-card: 8px;
  --ease-out: cubic-bezier(.16, 1, .3, 1);
  --font-display: "Chakra Petch", "Noto Sans SC", sans-serif;
  --font-ui: "Noto Sans SC", sans-serif;
  color: var(--text);
}

.music-room-root #stage {
  background: transparent;
}

.music-room-root .music-page {
  position: absolute;
  inset: 72px 28px 28px;
  z-index: 5;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid var(--line);
  background:
    radial-gradient(circle at 78% 4%, rgb(var(--accent-rgb) / 0.12), transparent 34%),
    linear-gradient(145deg, var(--ink-deep), var(--ink) 48%, #08202A);
  box-shadow: 0 18px 48px rgb(0 0 0 / 0.28);
}

.music-room-root .note-chip {
  color: var(--ice);
  border-color: rgb(var(--accent-rgb) / 0.35);
  background: rgb(4 10 15 / 0.55);
}

.music-room-root .pulse-app {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-areas:
    "rail workspace"
    "rail player";
  grid-template-columns: 224px minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) 98px;
  overflow: hidden;
  font-family: var(--font-ui);
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  color: var(--text);
  position: relative;
}

.music-room-root .pulse-app button,
.music-room-root .pulse-app input,
.music-room-root .pulse-app select {
  color: inherit;
  font: inherit;
}

.music-room-root .pulse-app button {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.music-room-root .pulse-app button:disabled,
.music-room-root .pulse-app input:disabled,
.music-room-root .pulse-app select:disabled {
  cursor: not-allowed;
  opacity: .42;
}

.music-room-root .pulse-app button:focus-visible,
.music-room-root .pulse-app input:focus-visible,
.music-room-root .pulse-app select:focus-visible,
.music-room-root .pulse-app a:focus-visible {
  outline: 2px solid var(--ice);
  outline-offset: 3px;
}

.music-room-root .pulse-app svg {
  display: block;
}

.music-room-root .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
"""

app_idx = raw.find(".app {")
if app_idx < 0:
    raise SystemExit("no .app block")

rest = raw[app_idx:]
rest = re.sub(r"\.app\b", ".pulse-app", rest)
rest = rest.replace("100dvh", "100%")
rest = rest.replace("100vh", "100%")
rest = rest.replace("body.drawer-open", ".music-room-root.drawer-open")
rest = rest.replace("body.is-playing", ".music-room-root.is-playing")
rest = rest.replace("body.motion-off", ".music-room-root.motion-off")
rest = rest.replace("body.compact-mode", ".music-room-root.compact-mode")
rest = rest.replace("body.lyrics-theater-open", ".music-room-root.lyrics-theater-open")
rest = rest.replace("body.mini-mode", ".music-room-root.mini-mode")
rest = rest.replace("body[data-stage=", ".music-room-root[data-stage=")
rest = rest.replace("body[data-lyric-size", ".music-room-root[data-lyric-size")
rest = rest.replace('url("assets/miku-brand/hatsune-miku-cc-by-nc.png")', "var(--miku-art, none)")
rest = rest.replace("url('assets/miku-brand/hatsune-miku-cc-by-nc.png')", "var(--miku-art, none)")
rest = rest.replace("url(assets/miku-brand/hatsune-miku-cc-by-nc.png)", "var(--miku-art, none)")


def scope_block(css_text: str) -> str:
    result: list[str] = []
    i = 0
    n = len(css_text)
    while i < n:
        if css_text[i].isspace():
            result.append(css_text[i])
            i += 1
            continue
        if css_text.startswith("/*", i):
            endc = css_text.find("*/", i)
            result.append(css_text[i : endc + 2])
            i = endc + 2
            continue
        if css_text[i] == "@":
            brace = css_text.find("{", i)
            if brace < 0:
                result.append(css_text[i:])
                break
            header_txt = css_text[i:brace]
            stripped = header_txt.strip()
            if stripped.startswith("@keyframes") or stripped.startswith("@font-face"):
                depth = 0
                j = brace
                while j < n:
                    if css_text[j] == "{":
                        depth += 1
                    elif css_text[j] == "}":
                        depth -= 1
                        if depth == 0:
                            j += 1
                            break
                    j += 1
                result.append(css_text[i:j])
                i = j
                continue
            if stripped.startswith("@media") or stripped.startswith("@supports"):
                depth = 0
                j = brace
                while j < n:
                    if css_text[j] == "{":
                        depth += 1
                    elif css_text[j] == "}":
                        depth -= 1
                        if depth == 0:
                            break
                    j += 1
                inner = css_text[brace + 1 : j]
                result.append(header_txt + "{" + scope_block(inner) + "}")
                i = j + 1
                continue
            depth = 0
            j = brace
            while j < n:
                if css_text[j] == "{":
                    depth += 1
                elif css_text[j] == "}":
                    depth -= 1
                    if depth == 0:
                        j += 1
                        break
                j += 1
            result.append(css_text[i:j])
            i = j
            continue

        brace = css_text.find("{", i)
        if brace < 0:
            result.append(css_text[i:])
            break
        selectors = css_text[i:brace].strip()
        depth = 0
        j = brace
        while j < n:
            if css_text[j] == "{":
                depth += 1
            elif css_text[j] == "}":
                depth -= 1
                if depth == 0:
                    j += 1
                    break
            j += 1
        body = css_text[brace:j]
        if selectors == ".pulse-app" and "grid-template-areas" in body:
            i = j
            continue
        scoped_sels = []
        for sel in selectors.split(","):
            sel = sel.strip()
            if not sel:
                continue
            if sel.startswith(SCOPE) or sel.startswith("html") or sel.startswith("body"):
                scoped_sels.append(sel)
            elif sel.startswith(":root"):
                scoped_sels.append(SCOPE)
            else:
                scoped_sels.append(f"{SCOPE} {sel}")
        result.append(", ".join(scoped_sels) + body)
        i = j
    return "".join(result)


footer = """
.music-room-root .global-drawer,
.music-room-root .drawer-scrim,
.music-room-root .mini-player,
.music-room-root .lyrics-theater,
.music-room-root .toast {
  z-index: 80;
}

.music-room-root .tweaks-trigger,
.music-room-root .tweaks-panel {
  display: none;
}

@media (max-width: 1100px) {
  .music-room-root .music-page {
    inset: 64px 12px 12px;
  }
  .music-room-root .pulse-app {
    grid-template-columns: 72px minmax(0, 1fr);
  }
}
"""

OUT.write_text(header + scope_block(rest) + footer, encoding="utf-8")
print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")
