/* ═══════════════════════════════════════════════════════════
 *  결제 — 토스페이먼츠
 *
 *  상품은 두 가지다.
 *    all  4,900원  여섯 갈래 + 신년운세
 *    gh   1,900원  연인궁합 + 비즈니스궁합
 *
 *  한 번 결제하면 그 기기의 브라우저에 열림 표시가 남는다. 서버에 회원
 *  정보를 두지 않는 구조라 기기를 바꾸면 다시 열어야 하고, 그 사실을
 *  결제 전 동의 화면과 약관에 그대로 적어 둔다.
 *
 *  결제 승인은 반드시 서버(/api/confirm)에서 한다. 브라우저에서 "결제됐다"
 *  고 말하는 것만 믿으면 누구나 콘솔 한 줄로 전부 열 수 있다.
 * ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var CFG = window.LIFEUP || {};
  var KEY_STORE = "lifeup.paid.v1";

  /* ── 상품표 ──
     서버(api/confirm.js)에도 같은 표가 있다. 둘이 어긋나면 결제가 거절된다.
     가격을 바꾸실 때는 반드시 두 곳을 같이 고치세요. */
  var PRODUCT = {
    all: {
      code: "all", price: 4900, name: "LIFE-UP STYLE 풀이 전부",
      covers: ["money", "love", "biz", "job", "future", "newyear"],
      what: "금전 · 연애 · 사업 · 직업 · 미래 다섯 갈래와 신년운세 전체"
    },
    gh: {
      code: "gh", price: 1900, name: "LIFE-UP STYLE 궁합",
      covers: ["love2", "team"],
      what: "연인궁합과 비즈니스궁합 전체"
    }
  };

  /** 어떤 갈래가 어느 상품에 들어 있는지 */
  function productFor(key) {
    for (var c in PRODUCT) {
      if (PRODUCT[c].covers.indexOf(key) >= 0) return PRODUCT[c];
    }
    return null;
  }

  /* ── 열림 표시 보관 ──
     사생활 보호 모드나 저장소를 막아 둔 브라우저에서는 읽기·쓰기가
     예외를 던진다. 그래도 앱이 멈추면 안 되므로 전부 감싼다. */
  function readPaid() {
    try {
      var raw = localStorage.getItem(KEY_STORE);
      var v = raw ? JSON.parse(raw) : null;
      return (v && typeof v === "object" && v.items) ? v : { items: {} };
    } catch (e) { return { items: {} }; }
  }
  function writePaid(v) {
    try { localStorage.setItem(KEY_STORE, JSON.stringify(v)); return true; }
    catch (e) { return false; }
  }

  function markPaid(code, info) {
    var v = readPaid();
    v.items[code] = {
      at: new Date().toISOString(),
      orderId: (info && info.orderId) || "",
      paymentKey: (info && info.paymentKey) || "",
      amount: (info && info.amount) || (PRODUCT[code] ? PRODUCT[code].price : 0)
    };
    return writePaid(v);
  }

  function hasProduct(code) {
    if (window.TEST_MODE) return true;
    return !!readPaid().items[code];
  }

  /** 갈래 하나가 열려 있는지 */
  function has(key) {
    if (window.TEST_MODE) return true;
    if (key === "basic") return true;
    var p = productFor(key);
    return p ? hasProduct(p.code) : false;
  }

  /* ── 주문번호 ──
     상품 코드를 안에 넣어 둔다. 서버가 이걸 읽어 "이 주문은 얼마여야
     하는가"를 스스로 정하고, 브라우저가 보낸 금액과 맞는지 본다. */
  function makeOrderId(code) {
    var r = "";
    var pool = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    try {
      var a = new Uint8Array(10);
      (window.crypto || window.msCrypto).getRandomValues(a);
      for (var i = 0; i < a.length; i++) r += pool[a[i] % pool.length];
    } catch (e) {
      for (var j = 0; j < 10; j++) r += pool[Math.floor(Math.random() * pool.length)];
    }
    return "LUS-" + code + "-" + Date.now().toString(36).toUpperCase() + "-" + r;
  }

  /* ── 결제 전 동의 ──
     전자상거래법은 결제 직전에 무엇을 얼마에 사는지, 청약철회가 어떻게
     제한되는지를 보여 주고 동의를 받도록 하고 있다. 이 창이 그 자리다. */
  function agreeModal(p) {
    return new Promise(function (resolve) {
      var wrap = document.createElement("div");
      wrap.className = "paysheet";
      wrap.innerHTML =
        '<div class="paysheet-in" role="dialog" aria-modal="true" aria-labelledby="pay-h">'
        + '<h2 id="pay-h">구매 조건 확인</h2>'
        + '<dl class="payinfo">'
        + '<dt>상품</dt><dd>' + p.name + '</dd>'
        + '<dt>내용</dt><dd>' + p.what + '</dd>'
        + '<dt>금액</dt><dd><b>' + p.price.toLocaleString() + '원</b> (부가세 포함)</dd>'
        + '<dt>제공 방식</dt><dd>결제 즉시 이 화면에서 바로 열립니다</dd>'
        + '<dt>이용 기간</dt><dd>기간 제한 없음</dd>'
        + '</dl>'
        + '<div class="paywarn">'
        + '<b>먼저 확인해 주세요</b>'
        + '<ul>'
        + '<li><b>결제하면 바로 열립니다.</b> 디지털 콘텐츠라 내용을 확인하신 뒤에는 '
        + '「전자상거래법」 제17조에 따라 청약철회가 제한됩니다.</li>'
        + '<li>아직 열어보지 않으셨다면 <b>7일 이내 전액 환불</b>됩니다. '
        + '중복 결제나 장애로 보지 못하신 경우에도 전액 환불해 드립니다.</li>'
        + '<li>열람 기록은 <b>지금 쓰시는 기기의 브라우저에만</b> 남습니다. '
        + '다른 기기에서는 다시 열어 주셔야 하고, 브라우저 데이터를 지우면 함께 지워집니다. '
        + '이 경우 영수증을 보내 주시면 확인해 드립니다.</li>'
        + '<li>사주 풀이는 전통 명리 해석이며 <b>의료·법률·금융 조언이 아닙니다.</b></li>'
        + '</ul>'
        + '</div>'
        + '<label class="paychk"><input type="checkbox" id="pay-agree">'
        + '<span>위 내용을 확인했으며 결제에 동의합니다. '
        + '<a href="/terms.html" target="_blank" rel="noopener">이용약관</a> · '
        + '<a href="/refund.html" target="_blank" rel="noopener">환불정책</a> · '
        + '<a href="/privacy.html" target="_blank" rel="noopener">개인정보처리방침</a></span></label>'
        + '<div class="paybtns">'
        + '<button type="button" id="pay-no">닫기</button>'
        + '<button type="button" id="pay-go" disabled>' + p.price.toLocaleString() + '원 결제하기</button>'
        + '</div>'
        + '<p class="paynote">결제는 토스페이먼츠를 통해 처리되며, 카드 정보는 저희에게 저장되지 않습니다.</p>'
        + '</div>';
      document.body.appendChild(wrap);
      document.documentElement.style.overflow = "hidden";

      var chk = wrap.querySelector("#pay-agree");
      var go = wrap.querySelector("#pay-go");
      chk.addEventListener("change", function () { go.disabled = !chk.checked; });

      function close(v) {
        document.documentElement.style.overflow = "";
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        resolve(v);
      }
      wrap.querySelector("#pay-no").addEventListener("click", function () { close(false); });
      go.addEventListener("click", function () { if (chk.checked) close(true); });
      wrap.addEventListener("click", function (e) { if (e.target === wrap) close(false); });
      document.addEventListener("keydown", function esc(e) {
        if (e.key === "Escape") { document.removeEventListener("keydown", esc); close(false); }
      });
      setTimeout(function () { try { chk.focus(); } catch (e) {} }, 30);
    });
  }

  function say(msg) {
    try {
      var b = document.getElementById("errbox");
      if (b) { b.style.display = "block"; b.textContent = msg;
               setTimeout(function () { b.style.display = "none"; }, 6000); return; }
    } catch (e) {}
    alert(msg);
  }

  /* ── 결제 요청 ── */
  function buy(key) {
    var p = productFor(key);
    if (!p) { say("결제할 수 없는 항목입니다."); return; }
    if (hasProduct(p.code)) { say("이미 열려 있습니다."); return; }

    var ck = CFG.TOSS_CLIENT_KEY || "";
    if (!ck || ck.indexOf("REPLACE") === 0) {
      say("결제 키가 아직 설정되지 않았습니다. 잠시 뒤에 다시 시도해 주세요.");
      return;
    }
    if (typeof TossPayments === "undefined") {
      say("결제 모듈을 불러오지 못했습니다. 새로고침 뒤 다시 시도해 주세요.");
      return;
    }

    agreeModal(p).then(function (ok) {
      if (!ok) return;
      var orderId = makeOrderId(p.code);
      /* 돌아왔을 때 어떤 주문이었는지 알아야 한다 */
      try { sessionStorage.setItem("lifeup.pending", JSON.stringify({ code: p.code, orderId: orderId })); } catch (e) {}

      var origin = location.origin;
      try {
        var tp = TossPayments(ck);
        var payment = tp.payment({ customerKey: TossPayments.ANONYMOUS });
        payment.requestPayment({
          method: "CARD",
          amount: { currency: "KRW", value: p.price },
          orderId: orderId,
          orderName: p.name,
          successUrl: origin + "/success.html",
          failUrl: origin + "/fail.html",
          card: { useEscrow: false, flowMode: "DEFAULT", useCardPoint: false, useAppCardOnly: false }
        })["catch"](function (err) {
          if (err && (err.code === "USER_CANCEL" || err.code === "PAY_PROCESS_CANCELED")) return;
          say("결제를 시작하지 못했습니다. " + ((err && err.message) || ""));
        });
      } catch (e) {
        say("결제를 시작하지 못했습니다. 잠시 뒤에 다시 시도해 주세요.");
      }
    });
  }

  /** 지금 열려 있는 상품 목록 */
  function list() {
    var v = readPaid(), out = [];
    for (var c in v.items) if (PRODUCT[c]) out.push({ code: c, name: PRODUCT[c].name, at: v.items[c].at });
    return out;
  }

  /** 돌아온 직후 화면을 다시 그리기 위한 자리. 서버 조회는 하지 않는다 */
  function sync() { return Promise.resolve(list()); }

  window.Pay = {
    PRODUCT: PRODUCT,
    productFor: productFor,
    price: function (key) { var p = productFor(key); return p ? p.price : 0; },
    has: has,
    hasProduct: hasProduct,
    markPaid: markPaid,
    buy: buy,
    list: list,
    sync: sync,
    clear: function () { try { localStorage.removeItem(KEY_STORE); } catch (e) {} }
  };
})();
