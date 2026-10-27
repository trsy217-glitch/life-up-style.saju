const { createRequire } = await import("node:module");
const handler = createRequire(import.meta.url)("./confirm.js");

process.env.TOSS_SECRET_KEY = "test_sk_FAKE";
let lastCall = null;
globalThis.fetch = async (url, opt) => {
  lastCall = { url, body: JSON.parse(opt.body), auth: opt.headers.Authorization };
  return { ok: true, json: async () => ({
    orderId: lastCall.body.orderId, paymentKey: lastCall.body.paymentKey,
    totalAmount: lastCall.body.amount, method: "카드",
    approvedAt: "2026-10-28T09:00:00+09:00", receipt: { url: "https://r" } }) };
};

function run(body, method = "POST") {
  return new Promise(res => {
    const r = { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; },
                end(s) { res({ status: this.statusCode, body: JSON.parse(s) }); } };
    handler({ method, body }, r);
  });
}

const base = { paymentKey: "pk_1", orderId: "LUS-all-ABC-XYZ", amount: 4900 };
const cases = [
  ["정상 4,900",            { ...base },                                          200, true],
  ["정상 궁합 1,900",       { paymentKey:"pk", orderId:"LUS-gh-A-B", amount:1900 }, 200, true],
  ["금액 위조 100원",        { ...base, amount: 100 },                              400, false],
  ["금액 위조 1원",          { ...base, amount: 1 },                                400, false],
  ["궁합값으로 전체 결제",   { paymentKey:"pk", orderId:"LUS-all-A-B", amount:1900 },400, false],
  ["문자열 금액",            { ...base, amount: "4900" },                           200, true],
  ["소수점 금액",            { ...base, amount: 4900.5 },                           400, false],
  ["없는 상품코드",          { paymentKey:"pk", orderId:"LUS-free-A-B", amount:0 },  400, false],
  ["주문번호 형식 깨짐",     { paymentKey:"pk", orderId:"hack", amount:4900 },       400, false],
  ["paymentKey 없음",        { orderId:"LUS-all-A-B", amount:4900 },                400, false],
  ["빈 요청",               {},                                                     400, false],
];

let bad = 0;
for (const [name, body, wantStatus, wantOk] of cases) {
  const r = await run(body);
  const pass = r.status === wantStatus && !!r.body.ok === wantOk;
  if (!pass) bad++;
  console.log(`${pass ? "✓" : "✗"} ${name.padEnd(22)} → ${r.status} ok=${!!r.body.ok}${pass ? "" : `  (기대 ${wantStatus}/${wantOk})`}`);
}

const g = await run({}, "GET");
const okG = g.status === 405; if (!okG) bad++;
console.log(`${okG ? "✓" : "✗"} GET 거부${" ".repeat(16)} → ${g.status}`);

delete process.env.TOSS_SECRET_KEY;
const n = await run({ ...base });
const okN = n.status === 500 && !n.body.ok; if (!okN) bad++;
console.log(`${okN ? "✓" : "✗"} 키 없을 때 거부${" ".repeat(10)} → ${n.status}`);
process.env.TOSS_SECRET_KEY = "test_sk_FAKE";

await run({ ...base });
console.log(`\n토스로 보낸 값: ${JSON.stringify(lastCall.body)}`);
console.log(`Authorization: ${lastCall.auth.slice(0,6)}... (Basic + base64)`);
console.log(bad ? `\n실패 ${bad}건` : `\n전부 통과 (${cases.length + 2}건)`);
process.exit(bad ? 1 : 0);
