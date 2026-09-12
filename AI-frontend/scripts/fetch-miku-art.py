import re
import urllib.request
from pathlib import Path

req = urllib.request.Request(
    "https://piapro.net/intl/en_character.html",
    headers={"User-Agent": "Mozilla/5.0"},
)
html = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "ignore")
imgs = re.findall(r"src=[\"']([^\"']+)[\"']", html)
print("total", len(imgs))
for i in imgs[:40]:
    print(i)

# also try common KEI official paths
candidates = [
    "https://piapro.net/images/character/miku.png",
    "https://cdn2.piapro.jp/chr_img/miku_v4x.png",
]
out = Path(r"e:/java_demo/Ai-scene/AI-backend/AI-frontend/src/assets/miku-brand/hatsune-miku-cc-by-nc.png")
for u in candidates:
    try:
        r = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(r, timeout=15) as resp:
            data = resp.read()
            print("OK", u, len(data), resp.headers.get("content-type"))
            if len(data) > 10000 and "image" in (resp.headers.get("content-type") or ""):
                out.write_bytes(data)
                print("saved", out)
                break
    except Exception as e:
        print("FAIL", u, e)
