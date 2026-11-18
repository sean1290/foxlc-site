"""네이버 소식 포스터 원본(*.orig, 보통 PNG 1~2MB)을 가로 최대 1200px JPEG(n.jpg)으로 줄인다.
사용: python3 scripts/shrink-images.py static/naver-img   (Pillow 필요: pip install pillow)
이미 줄인 파일은 건드리지 않는다. 변환이 끝난 .orig 는 지운다."""
import sys
from pathlib import Path
from PIL import Image, ImageOps

MAX_W = 1200
root = Path(sys.argv[1] if len(sys.argv) > 1 else "static/naver-img")
done = 0
for orig in sorted(root.glob("*/*.orig")):
    out = orig.with_suffix(".jpg")
    im = ImageOps.exif_transpose(Image.open(orig))
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    im.save(out, "JPEG", quality=84, optimize=True, progressive=True)
    orig.unlink()
    done += 1
print(f"포스터 {done}장 변환")
