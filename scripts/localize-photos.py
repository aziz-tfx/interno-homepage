"""Скачивает фото Higgsfield в assets/photos/*.jpg (≤1800px, JPEG q82)
и переписывает ссылки в index.html с CDN на локальные файлы.

Запуск из корня репозитория:  python3 scripts/localize-photos.py
Нужен Pillow:                 pip install pillow
"""
import io, json, pathlib, urllib.request
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3CLCviMVubl8pteTJQ9R4nBs27N/"
photos = json.loads((ROOT / "scripts/photos.json").read_text())
out_dir = ROOT / "assets/photos"
out_dir.mkdir(parents=True, exist_ok=True)
html_path = ROOT / "index.html"
html = html_path.read_text()

for name, key in photos.items():
    url = CDN + key + ".png"
    with urllib.request.urlopen(url) as r:
        im = Image.open(io.BytesIO(r.read())).convert("RGB")
    im.thumbnail((1800, 1800), Image.LANCZOS)
    dst = out_dir / f"{name}.jpg"
    im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
    html = html.replace(url, f"assets/photos/{name}.jpg")
    print(f"{name}: {dst.stat().st_size // 1024} KB")

html_path.write_text(html)
print("index.html обновлён")
