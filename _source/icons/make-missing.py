#!/usr/bin/env python3
"""
歲 신년운세 · 職 직업 · 運 미래 — 빠진 메달 세 장을 그린다.

나머지 여섯 장은 받은 그림이고 이 셋만 직접 그린 것이라, 같은 줄에 섞여도
한 세트로 보여야 한다. 그래서 받은 그림의 비율을 실제로 재서 맞췄다.

  바깥 금테 : 반지름의 바깥 20% (r 0.80~1.00)
  크림 바탕 : r 0.56~0.80  — 가는 금색 호와 네 방향 금구슬이 여기 있다
  가운데 그림: r 0.00~0.56

그림은 반드시 r=112 원 안에 들어와야 한다. 넘치면 잘려서 무슨 그림인지
알아볼 수 없게 된다. 작은 탭에서는 30px 로 줄어드니 형태는 단순하게 간다.
"""
import math, pathlib, subprocess
from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).parent
SIZE = 192          # 받은 여섯 장과 같은 크기
R    = 196          # 메달 바깥 반지름 (viewBox 400 기준)
RIN  = 112          # 가운데 그림 반지름 = R * 0.571

def frame(scene, sid, rim):
    """테두리는 셋이 똑같다. 가운데 그림만 갈아 끼운다."""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
<defs>
  <linearGradient id="g{sid}" x1=".08" y1="0" x2=".92" y2="1">
    <stop offset="0"   stop-color="#EBD199"/><stop offset=".16" stop-color="#C2A055"/>
    <stop offset=".34" stop-color="#F6E4B8"/><stop offset=".52" stop-color="#B38F3C"/>
    <stop offset=".70" stop-color="#F2DCA8"/><stop offset=".86" stop-color="#C2A055"/>
    <stop offset="1"   stop-color="#E4C78C"/>
  </linearGradient>
  <linearGradient id="b{sid}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F8E8BE"/><stop offset="1" stop-color="#B8903C"/>
  </linearGradient>
  <radialGradient id="f{sid}" cx=".5" cy=".34" r=".75">
    <stop offset="0" stop-color="#FFFDF8"/><stop offset="1" stop-color="#F4ECDC"/>
  </radialGradient>
  <clipPath id="c{sid}"><circle cx="200" cy="200" r="{RIN}"/></clipPath>
</defs>

<circle cx="200" cy="200" r="{R}" fill="url(#f{sid})"/>

<!-- 바깥 금테 — 반지름의 바깥 20% 를 채운다 -->
<circle cx="200" cy="200" r="176" fill="none" stroke="url(#g{sid})" stroke-width="39"/>
<circle cx="200" cy="200" r="194" fill="none" stroke="#B8903C" stroke-width="1.6" opacity=".5"/>
<circle cx="200" cy="200" r="158" fill="none" stroke="#B8903C" stroke-width="1.4" opacity=".45"/>
<circle cx="200" cy="200" r="168" fill="none" stroke="#FFF6DD" stroke-width="2" opacity=".5"/>

<!-- 크림 바탕의 가는 금색 호 — 좌우가 끊겨 있다 -->
<path d="M 128 148 A 148 148 0 0 1 272 148" fill="none" stroke="#C2A055" stroke-width="1.7" opacity=".8"/>
<path d="M 128 252 A 148 148 0 0 0 272 252" fill="none" stroke="#C2A055" stroke-width="1.7" opacity=".8"/>
<path d="M 118 158 A 136 136 0 0 0 118 242" fill="none" stroke="#C2A055" stroke-width="1.1" opacity=".45"/>
<path d="M 282 158 A 136 136 0 0 1 282 242" fill="none" stroke="#C2A055" stroke-width="1.1" opacity=".45"/>

<!-- 가운데 그림 -->
<circle cx="200" cy="200" r="{RIN}" fill="{rim}"/>
<g clip-path="url(#c{sid})">{scene}</g>
<circle cx="200" cy="200" r="{RIN + 4}" fill="none" stroke="url(#g{sid})" stroke-width="9"/>
<circle cx="200" cy="200" r="{RIN + 9}" fill="none" stroke="#B8903C" stroke-width="1.2" opacity=".55"/>

<!-- 네 방향 금구슬 -->
<circle cx="200" cy="63"  r="9" fill="url(#b{sid})"/>
<circle cx="200" cy="337" r="9" fill="url(#b{sid})"/>
<circle cx="63"  cy="200" r="9" fill="url(#b{sid})"/>
<circle cx="337" cy="200" r="9" fill="url(#b{sid})"/>
</svg>'''


# ── 歲 신년운세 — 지평선 위로 떠오르는 해, 둘레에 열두 달 ──
# 붉은 새벽은 받은 여섯 장에 없는 색이라 30px 로 줄여도 바로 구별된다.
_dots = "".join(
    f'<circle cx="{200 + 88 * math.cos(math.radians(a)):.1f}" '
    f'cy="{200 + 88 * math.sin(math.radians(a)):.1f}" r="4.6" fill="#F6E4B8" opacity=".95"/>'
    for a in [-168 + i * 13.1 for i in range(12)])

NEWYEAR = f'''
<rect x="80" y="80" width="240" height="240" fill="#8E2F2A"/>
<circle cx="200" cy="252" r="86" fill="#A8412F" opacity=".75"/>
<circle cx="200" cy="252" r="58" fill="#E8A33C"/>
<circle cx="200" cy="252" r="58" fill="none" stroke="#F6E4B8" stroke-width="3"/>
<!-- 땅을 해 위에 덮어 반쯤 떠오른 모양으로 만든다 -->
<path d="M80 252 L320 252 L320 320 L80 320 Z" fill="#6B211E"/>
<path d="M92 252 L308 252" stroke="#F6E4B8" stroke-width="3.4" opacity=".9"/>
<path d="M120 282 Q200 266 280 282" fill="none" stroke="#C9A961" stroke-width="2.4" opacity=".55"/>
{_dots}
'''

# ── 職 직업 — 자리를 여는 열쇠 ──
# 사업(솟는 막대)과 겹치지 않는 형태를 골랐다. 윤곽이 또렷해 작아도 읽힌다.
JOB = '''
<rect x="80" y="80" width="240" height="240" fill="#2F4858"/>
<circle cx="200" cy="190" r="92" fill="#3A5668" opacity=".85"/>
<path d="M80 258 Q140 238 200 246 Q260 254 320 236 L320 320 L80 320 Z" fill="#243A47"/>
<circle cx="200" cy="158" r="40" fill="none" stroke="#F2DCA8" stroke-width="15"/>
<circle cx="200" cy="158" r="15" fill="#2F4858"/>
<rect x="192" y="192" width="16" height="96" rx="5" fill="#F2DCA8"/>
<rect x="208" y="226" width="30" height="14" rx="4" fill="#C9A961"/>
<rect x="208" y="254" width="22" height="14" rx="4" fill="#C9A961"/>
<circle cx="200" cy="158" r="40" fill="none" stroke="#C9A961" stroke-width="2" opacity=".7"/>
'''

# ── 運 미래 — 초승달 아래, 앞으로 퍼져 나가는 물결 ──
# 지나간 것이 아니라 앞으로 번져 가는 모양. 남보라는 기본(남색)보다 붉다.
FUTURE = '''
<rect x="80" y="80" width="240" height="240" fill="#3A3270"/>
<path d="M80 254 Q140 234 200 242 Q260 250 320 232 L320 320 L80 320 Z" fill="#2A2355"/>
<circle cx="206" cy="160" r="46" fill="#F6E4B8"/>
<circle cx="226" cy="148" r="41" fill="#3A3270"/>
<circle cx="136" cy="140" r="4.4" fill="#F6E4B8" opacity=".9"/>
<circle cx="120" cy="184" r="3" fill="#F6E4B8" opacity=".7"/>
<circle cx="284" cy="196" r="3.4" fill="#F6E4B8" opacity=".75"/>
<path d="M100 262 Q200 240 300 262" fill="none" stroke="#C9A961" stroke-width="4" opacity="1"/>
<path d="M108 288 Q200 262 292 288" fill="none" stroke="#C9A961" stroke-width="3.4" opacity=".72"/>
<path d="M118 312 Q200 284 282 312" fill="none" stroke="#C9A961" stroke-width="2.8" opacity=".48"/>
'''

JOBS = [("newyear", NEWYEAR, "#8E2F2A"), ("job", JOB, "#2F4858"), ("future", FUTURE, "#3A3270")]

for key, scene, rim in JOBS:
    (HERE / f"{key}.svg").write_text(frame(scene, key, rim), encoding="utf-8")

shot = HERE / "_shot.cjs"
shot.write_text(f'''
const {{chromium}} = require("playwright");
(async () => {{
  const b = await chromium.launch();
  const pg = await b.newPage({{ viewport: {{ width: 400, height: 400 }}, deviceScaleFactor: 2 }});
  for (const k of {[j[0] for j in JOBS]!r}) {{
    await pg.goto("file://{HERE}/" + k + ".svg");
    await pg.waitForTimeout(120);
    await pg.screenshot({{ path: "{HERE}/_" + k + ".png", omitBackground: true }});
  }}
  await b.close();
}})();
''', encoding="utf-8")
subprocess.run(["node", str(shot)], check=True)

for key, _, _ in JOBS:
    # 투명 배경을 그대로 RGB 로 바꾸면 바깥이 검게 깔려 금테 둘레에 검은 띠가 생긴다.
    # 받은 여섯 장과 같은 크림색 위에 올려놓고 평탄화한다.
    src = Image.open(HERE / f"_{key}.png").convert("RGBA")
    base = Image.new("RGB", src.size, (253, 250, 240))
    base.paste(src, (0, 0), src)
    im = base.resize((SIZE, SIZE), Image.LANCZOS)
    mask = Image.new("L", (SIZE * 4, SIZE * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, SIZE * 4 - 1, SIZE * 4 - 1), fill=255)
    out = im.convert("RGBA"); out.putalpha(mask.resize((SIZE, SIZE), Image.LANCZOS))
    out.save(HERE / f"{key}.webp", "WEBP", quality=86, method=6)
    print(f"{key}.webp  {(HERE / f'{key}.webp').stat().st_size / 1024:.1f}KB")

for f in list(HERE.glob("_*.png")) + [shot]:
    f.unlink()
