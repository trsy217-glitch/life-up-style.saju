#!/usr/bin/env python3
"""ui-manse.html + 엔진 4개 파일 → 자족형 manse.html"""
import re, sys, pathlib

HERE = pathlib.Path(__file__).parent

def strip_mod(src):
    out = []
    for line in src.split("\n"):
        s = line.strip()
        if s.startswith("import ") or s.startswith("} from "):
            continue
        if s.startswith("import {") or re.match(r"^\s*[\w,\s{}]+\s*}?\s*from\s+[\"']", s):
            continue
        out.append(line)
    t = "\n".join(out)
    t = re.sub(r"^export\s+(function|const|let|class)\s", r"\1 ", t, flags=re.M)
    t = re.sub(r"^export\s*\{[^}]*\}(\s*from\s*[\"'][^\"']+[\"'])?\s*;?\s*$", "", t, flags=re.M)
    return t

def read(n):
    return strip_mod((HERE / n).read_text(encoding="utf-8"))

# saju.js 의 import 블록은 여러 줄이므로 수동 처리
def read_saju():
    t = (HERE / "saju.js").read_text(encoding="utf-8")
    t = re.sub(r'import\s*\{[^}]*\}\s*from\s*["\'][^"\']+["\'];?', "", t, flags=re.S)
    t = re.sub(r"^export\s+(function|const|let|class)\s", r"\1 ", t, flags=re.M)
    t = re.sub(r"^export\s*\{[^}]*\};?\s*$", "", t, flags=re.M)
    return t

def read_any(n):
    t = (HERE / n).read_text(encoding="utf-8")
    t = re.sub(r'import\s*\{[^}]*\}\s*from\s*["\'][^"\']+["\'];?', "", t, flags=re.S)
    t = re.sub(r'import\s+\w+\s+from\s*["\'][^"\']+["\'];?', "", t)
    t = re.sub(r"^export\s+(function|const|let|class)\s", r"\1 ", t, flags=re.M)
    t = re.sub(r"^export\s*\{[^}]*\}(\s*from\s*[\"'][^\"']+[\"'])?\s*;?\s*$", "", t, flags=re.M)
    return t

engine = "\n".join([
    "/* ── saju-data.js ── */", read_any("saju-data.js"),
    "/* ── saju.js ── */",     read_any("saju.js"),
    "/* ── report.js ── */",   read_any("report.js"),
    "/* ── sinsal.js ── */",   read_any("sinsal.js"),
    "/* ── glossary.js ── */", read_any("glossary.js"),
    "/* ── examples.js ── */", read_any("examples.js"),
    "/* ── compat-core.js ── */", read_any("compat-core.js"),
    "/* ── compat-copy.js ── */", read_any("compat-copy.js"),
    "/* ── compat.js ── */",   read_any("compat.js"),
    "/* ── newyear-core.js ── */", read_any("newyear-core.js"),
    "/* ── newyear-copy.js ── */", read_any("newyear-copy.js"),
    "/* ── newyear.js ── */",   read_any("newyear.js"),
    "/* ── manse.js ── */",    read_any("manse.js"),
])

# 카테고리 아이콘 — icons/<갈래키>.webp 를 data URI 로 박아 넣는다.
# 자족형 한 파일이어야 하므로 외부 이미지 요청이 생기면 안 된다.
# 파일이 없는 갈래는 그냥 빠지고, 화면에서는 한자로 대신 나온다.
def read_icons():
    import base64
    d = HERE / "icons"
    rows = []
    for key in ["basic", "newyear", "money", "love", "biz", "job", "future", "love2", "team"]:
        f = d / f"{key}.webp"
        if not f.exists():
            continue
        b64 = base64.b64encode(f.read_bytes()).decode("ascii")
        rows.append(f'  {key}: "data:image/webp;base64,{b64}"')
    return "var CATICON = {\n" + ",\n".join(rows) + "\n};"

ui = (HERE / "ui-manse.html").read_text(encoding="utf-8")
assert "/* ENGINE_PLACEHOLDER */" in ui, "placeholder 없음"
assert "/* ICONS_PLACEHOLDER */" in ui, "아이콘 placeholder 없음"
assert "/* PAY_PLACEHOLDER */" in ui, "결제 placeholder 없음"
out = ui.replace("/* ENGINE_PLACEHOLDER */", engine)
out = out.replace("/* ICONS_PLACEHOLDER */", read_icons())
out = out.replace("/* PAY_PLACEHOLDER */", (HERE / "pay.js").read_text(encoding="utf-8"))

dest = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "manse.html"
dest.write_text(out, encoding="utf-8")
# 글자 수가 아니라 실제 바이트로 찍는다. 한글이 많아 둘이 크게 다르다
print(f"{dest}  {len(out.encode('utf-8')):,} bytes")
