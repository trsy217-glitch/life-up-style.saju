/* ═══════════════════════════════════════════════════════════
 *  결제 승인 — Vercel 서버리스 함수
 *
 *  브라우저가 "결제했다"고 말하는 것만 믿으면 누구나 콘솔 한 줄로 전부
 *  열 수 있다. 그래서 승인은 반드시 여기서 한다.
 *
 *  두 번 막는다.
 *    1) 주문번호에 심어 둔 상품 코드로 "이 주문은 얼마여야 하는가"를
 *       서버가 스스로 정하고, 브라우저가 보낸 금액과 맞는지 본다.
 *    2) 토스 승인 API 가 실제 결제 금액과 또 한 번 대조한다.
 *
 *  환경변수 (Vercel → Settings → Environment Variables)
 *    TOSS_SECRET_KEY   test_sk_... 또는 live_sk_...
 *                      클라이언트 키와 짝을 맞춰야 한다.
 *                      이 값은 절대 프런트엔드에 넣지 말 것.
 * ═══════════════════════════════════════════════════════════ */

/* pay.js 의 PRODUCT 와 같은 값이어야 한다. 가격을 바꾸면 두 곳을 같이 고칠 것 */
const PRICE = { all: 4900, gh: 1900 };

const TOSS_CONFIRM = "https://api.tosspayments.com/v1/payments/confirm";

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

/** 주문번호 LUS-{상품}-{시각}-{임의} 에서 상품 코드를 꺼낸다 */
function codeFromOrderId(orderId) {
  const m = /^LUS-([a-z]+)-/.exec(String(orderId || ""));
  return m ? m[1] : null;
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return {}; }
}

/* Vercel 의 Node 런타임은 package.json 없이는 ESM(export default)을 읽지 못한다.
   정적 사이트에 package.json 을 더하면 빌드 설정이 꼬이기 쉬우므로 CommonJS 로 둔다. */
module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  if (req.method !== "POST") return send(res, 405, { ok: false, message: "POST 로 보내 주세요." });

  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) {
    console.error("TOSS_SECRET_KEY 가 설정되지 않았습니다.");
    return send(res, 500, { ok: false, message: "결제 설정이 완료되지 않았습니다. 잠시 뒤 다시 시도해 주세요." });
  }

  const { paymentKey, orderId, amount } = await readBody(req);
  if (!paymentKey || !orderId || amount == null) {
    return send(res, 400, { ok: false, message: "결제 정보가 올바르지 않습니다." });
  }

  /* ① 서버가 정한 금액과 맞는가 */
  const code = codeFromOrderId(orderId);
  const expected = PRICE[code];
  if (!expected) return send(res, 400, { ok: false, message: "알 수 없는 주문입니다." });

  const paid = Number(amount);
  if (!Number.isInteger(paid) || paid !== expected) {
    console.warn("금액 불일치", { orderId, amount, expected });
    return send(res, 400, { ok: false, message: "결제 금액이 맞지 않습니다. 결제가 취소됩니다." });
  }

  /* ② 토스에 승인 요청 */
  let r, data;
  try {
    r = await fetch(TOSS_CONFIRM, {
      method: "POST",
      headers: {
        /* 시크릿 키 뒤에 콜론을 붙이고 Base64 — 토스가 정한 형식이다 */
        Authorization: "Basic " + Buffer.from(secret + ":").toString("base64"),
        "Content-Type": "application/json",
        /* 같은 주문이 두 번 승인되지 않게 한다 */
        "Idempotency-Key": String(orderId),
      },
      body: JSON.stringify({ paymentKey, orderId, amount: paid }),
    });
    data = await r.json();
  } catch (e) {
    console.error("토스 호출 실패", e);
    return send(res, 502, { ok: false, message: "결제사와 통신하지 못했습니다. 결제가 되었는지 확인 후 다시 시도해 주세요." });
  }

  if (!r.ok) {
    console.warn("승인 거절", { orderId, code: data && data.code, message: data && data.message });
    return send(res, 400, {
      ok: false,
      code: (data && data.code) || "CONFIRM_FAILED",
      message: (data && data.message) || "결제 승인에 실패했습니다.",
    });
  }

  /* 승인 성공 — 브라우저가 열림 표시를 남기는 데 필요한 것만 돌려준다 */
  return send(res, 200, {
    ok: true,
    product: code,
    orderId: data.orderId,
    paymentKey: data.paymentKey,
    amount: data.totalAmount,
    method: data.method || "",
    approvedAt: data.approvedAt || "",
    receiptUrl: (data.receipt && data.receipt.url) || "",
  });
};
