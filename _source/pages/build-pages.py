#!/usr/bin/env python3
"""약관·방침·환불·결제결과 페이지를 한 틀로 찍어낸다.

본문은 _*_body.html 에, 공통 모양은 _docstyle.css 에 있다.
본문만 고치고 이 스크립트를 돌리면 다섯 페이지가 다시 만들어진다.
"""
import pathlib

HERE = pathlib.Path(__file__).parent
CSS = (HERE / "_docstyle.css").read_text(encoding="utf-8")

HEAD = '''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title} — LIFE-UP STYLE</title>
<meta name="description" content="{desc}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#FAF6ED">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
{canon}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;700;900&display=swap" rel="stylesheet">
<style>
{css}</style>
</head>
<body>
<div class="wrap">
<header class="top">
  <p class="mark">LIFE-UP STYLE</p>
  <h1>{title}</h1>
  {when}
</header>

{body}

<footer>
  <p><a href="/">앱으로</a><a href="/terms.html">이용약관</a><a href="/refund.html">환불정책</a><a href="/privacy.html">개인정보처리방침</a></p>
  <p style="margin-top:8px">© 2026 <em>○○</em>. LIFE-UP STYLE.</p>
  <a class="back" href="/">LIFE-UP STYLE 로 돌아가기</a>
</footer>
</div>
{script}</body>
</html>
'''

WHEN = '<p class="when">시행일 <em>2026년 ○월 ○일</em> · 최종 수정 <em>2026년 ○월 ○일</em></p>'

# ── 결제 완료 — 서버에 승인을 요청하고 그 결과로만 열어 준다 ──
SUCCESS_JS = '''<script>
(function(){
  "use strict";
  var KEY_STORE = "lifeup.paid.v1";
  var NAME = { all:"풀이 전부", gh:"궁합" };
  var $ = function(id){ return document.getElementById(id); };
  function show(id){ ["stage-load","stage-ok","stage-err"].forEach(function(s){
    var e=$(s); if(e) e.hidden = (s!==id); }); }
  function rows(tbl, pairs){
    if(!tbl) return;
    tbl.innerHTML = pairs.filter(function(p){ return p[1]; })
      .map(function(p){ return "<tr><th>"+p[0]+"</th><td>"+String(p[1])
        .replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</td></tr>"; }).join("");
  }
  function mark(code, info){
    try{
      var raw = localStorage.getItem(KEY_STORE);
      var v = raw ? JSON.parse(raw) : null;
      if(!v || typeof v!=="object" || !v.items) v = { items:{} };
      v.items[code] = { at:new Date().toISOString(), orderId:info.orderId||"",
                        paymentKey:info.paymentKey||"", amount:info.amount||0 };
      localStorage.setItem(KEY_STORE, JSON.stringify(v));
      return true;
    }catch(e){ return false; }
  }

  var q = new URLSearchParams(location.search);
  var paymentKey = q.get("paymentKey"), orderId = q.get("orderId"), amount = q.get("amount");

  if(!paymentKey || !orderId || !amount){
    show("stage-err");
    $("errmsg").textContent = "결제 정보가 없습니다. 결제를 다시 시도해 주세요.";
    return;
  }

  fetch("/api/confirm", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ paymentKey:paymentKey, orderId:orderId, amount:Number(amount) })
  })
  .then(function(r){ return r.json().then(function(d){ return { ok:r.ok, d:d }; }); })
  .then(function(res){
    if(!res.ok || !res.d.ok) throw new Error((res.d && res.d.message) || "결제 승인에 실패했습니다.");
    var d = res.d;
    var saved = mark(d.product, d);
    show("stage-ok");
    rows($("okinfo"), [
      ["상품", NAME[d.product] || d.product],
      ["결제 금액", Number(d.amount).toLocaleString()+"원"],
      ["주문번호", d.orderId],
      ["결제 일시", (d.approvedAt||"").replace("T"," ").slice(0,16)]
    ]);
    if(d.receiptUrl){
      $("okreceipt").innerHTML = '<a href="'+d.receiptUrl+'" target="_blank" rel="noopener">영수증 보기</a>';
    }
    if(!saved){
      $("okreceipt").innerHTML += '<br><strong>브라우저가 저장을 막고 있어 열람 기록을 남기지 못했습니다. '
        + '시크릿 모드를 끄고 다시 들어오시거나, 위 주문번호를 저장해 두신 뒤 문의해 주세요.</strong>';
    }
    try{ sessionStorage.removeItem("lifeup.pending"); }catch(e){}
  })
  .catch(function(err){
    show("stage-err");
    $("errmsg").textContent = (err && err.message) || "결제를 확인하지 못했습니다.";
    rows($("errinfo"), [["주문번호", orderId], ["금액", Number(amount).toLocaleString()+"원"]]);
  });
})();
</script>
'''

FAIL_JS = '''<script>
(function(){
  "use strict";
  var q = new URLSearchParams(location.search);
  var code = q.get("code"), message = q.get("message"), orderId = q.get("orderId");
  var CANCEL = ["USER_CANCEL","PAY_PROCESS_CANCELED"];
  var el = document.getElementById("failmsg");
  if(code && CANCEL.indexOf(code) >= 0){
    el.textContent = "결제를 취소하셨습니다. 금액은 빠져나가지 않았습니다.";
  } else if(message){
    el.textContent = message;
  }
  var t = document.getElementById("failinfo");
  var pairs = [["오류 코드", code], ["주문번호", orderId]].filter(function(p){ return p[1]; });
  if(t && pairs.length){
    t.innerHTML = pairs.map(function(p){ return "<tr><th>"+p[0]+"</th><td>"
      + String(p[1]).replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</td></tr>"; }).join("");
  }
})();
</script>
'''

PAGES = [
    ("terms",   "이용약관", "LIFE-UP STYLE 이용약관 — 서비스 안내, 결제, 청약철회와 환불, 책임의 범위.", True,  True,  ""),
    ("privacy", "개인정보처리방침", "LIFE-UP STYLE 개인정보처리방침 — 서버에 저장하지 않는 구조, 보관과 삭제, 이용자의 권리.", True, True, ""),
    ("refund",  "결제·환불 안내", "LIFE-UP STYLE 결제와 환불 — 가격, 제공 방식, 환불되는 경우와 어려운 경우, 신청 방법.", True, True, ""),
    ("success", "결제 완료", "결제 결과를 확인하는 중입니다.", False, False, SUCCESS_JS),
    ("fail",    "결제 실패", "결제가 완료되지 않았습니다.", False, False, FAIL_JS),
]

for slug, title, desc, index, when, script in PAGES:
    body = (HERE / f"_{slug}_body.html").read_text(encoding="utf-8")
    out = HEAD.format(
        title=title, desc=desc, css=CSS, body=body, script=script,
        robots="index,follow" if index else "noindex,nofollow",
        canon=f'<link rel="canonical" href="https://REPLACE_WITH_DOMAIN/{slug}.html">\n' if index else "",
        when=WHEN if when else "",
    )
    (HERE / f"{slug}.html").write_text(out, encoding="utf-8")
    print(f"{slug}.html  {len(out.encode('utf-8')):,} bytes")
