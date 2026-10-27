/* manse.html 을 실제 DOM 에서 돌려본다 */
const fs = require("fs");
const { JSDOM } = require("jsdom");
const PAGE = "/home/claude/engine/manse.html";

const errs = [];
const dom = new JSDOM(fs.readFileSync(PAGE, "utf8"), {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://example.com/",
  virtualConsole: new (require("jsdom").VirtualConsole)()
    .on("jsdomError", e => errs.push("jsdomError: " + e.message))
    .on("error", (...a) => errs.push("console.error: " + a.join(" "))),
});
const { window } = dom;
const doc = window.document;
const $ = (id) => doc.getElementById(id);

window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
window.alert = (m) => errs.push("alert: " + String(m).slice(0, 80));

function set(id, v) { const e = $(id); e.value = String(v); e.dispatchEvent(new window.Event("input", { bubbles: true })); }
function click(id) { $(id).dispatchEvent(new window.MouseEvent("click", { bubbles: true })); }

let fails = 0;
const ok = (c, m) => { if (!c) { console.log("✗ " + m); fails++; } };

setTimeout(() => {
  /* ── 0. 결제 모드인지, 잠금이 실제로 걸리는지 ── */
  ok(window.TEST_MODE === false, "TEST_MODE 가 켜져 있음 — 출시 상태가 아님");
  ok(typeof window.Pay === "object" && typeof window.Pay.buy === "function", "Pay 가 붙지 않음");
  ok(window.Pay.price("money") === 4900, "풀이 가격이 4,900원이 아님: " + window.Pay.price("money"));
  ok(window.Pay.price("love2") === 1900, "궁합 가격이 1,900원이 아님: " + window.Pay.price("love2"));
  ok(window.Pay.has("basic") === true, "기본이 무료가 아님");
  ok(window.Pay.has("money") === false, "결제 전인데 금전이 열려 있음");
  ok(window.Pay.has("love2") === false, "결제 전인데 궁합이 열려 있음");

  set("y", 1998); set("m", 7); set("d", 22); set("hh", 14); set("mi", 30);
  click("sx-m");
  click("submit");

  ok($("err").textContent === "", "입력 오류: " + $("err").textContent);
  ok($("out").classList.contains("on"), "결과 영역이 열리지 않음");

  const plate = $("plate").innerHTML;
  ok(plate.length > 2000, "만세력 판이 비었음 (" + plate.length + ")");
  ok(/萬|甲|乙|丙|丁|戊|己|庚|辛|壬|癸/.test(plate), "천간 한자가 없음");
  ok((plate.match(/class="gl[ "]/g) || []).length === 8, "천간·지지 칸이 8개가 아님: " + (plate.match(/class="gl[ "]/g) || []).length);
  ok(/대운/.test(plate), "대운 없음");
  ok(/세운/.test(plate), "세운 없음");
  ok(!/undefined|NaN|\[object/.test(plate), "만세력 판에 undefined/NaN");

  /* ── 2. 색인 ── */
  const tabs = [...$("index-in").querySelectorAll("button")];
  ok(tabs.length === 9, "색인 버튼 " + tabs.length + "개 (기대 9: 6갈래 + 신년 + 궁합 2)");
  /* 번호가 아니라 이름으로 찾는다. 탭이 하나 끼면 번호는 전부 밀린다 */
  const tab = (k) => {
    const b = tabs.find(x => x.dataset.k === k);
    if (!b) throw new Error("탭 없음: " + k);
    return b;
  };
  const go = (k) => tab(k).dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

  /* ── 2-b. 잠긴 화면이 제대로 뜨는가 ── */
  go("money");
  const lockHtml = $("cat").innerHTML;
  ok(/class="lock"/.test(lockHtml), "결제 전인데 금전에 잠금 상자가 없음");
  ok(/4,900원/.test(lockHtml), "잠금 상자에 4,900원이 없음");
  /* 잠긴 항목은 질문만 남고 본문이 맛보기(…)로 잘린다.
     무료 항목 2개는 그대로 다 보이는 게 맞다. */
  const qaText = () => [...$("cat").querySelectorAll(".qa")]
    .reduce((n, e) => n + e.textContent.length, 0);
  const lockText = qaText();
  ok((lockHtml.match(/…<\/p>/g) || []).length === 4, "잠긴 항목 4개가 맛보기로 잘리지 않음");
  ok((lockHtml.match(/note-ex/g) || []).length === 1, "잠긴 화면의 TIP 개수가 1이 아님");

  /* 여기서부터는 결제한 상태로 본다 */
  window.localStorage.setItem("lifeup.paid.v1",
    JSON.stringify({ items: { all: { at: "t", amount: 4900 }, gh: { at: "t", amount: 1900 } } }));
  go("money");
  const openHtml = $("cat").innerHTML;
  ok(!/class="lock"/.test(openHtml), "결제했는데 잠금 상자가 남아 있음");
  ok(/class="note-ex"/.test(openHtml), "결제했는데 TIP 이 없음");
  /* HTML 길이는 껍데기가 커서 척도가 안 된다. 실제로 읽는 글자로 본다 */
  const openText = qaText();
  const hidden = Math.round((1 - lockText / openText) * 100);
  ok(hidden >= 50, "잠금이 문항 내용을 충분히 가리지 못함 — 가려지는 글자 " + hidden + "%");
  ok((openHtml.match(/…<\/p>/g) || []).length === 0, "결제했는데 맛보기가 남아 있음");

  /* ── 3. 여섯 갈래 ── */
  const want = [["basic","基"],["money","財"],["love","愛"],["biz","業"],["job","職"],["future","運"]];
  want.forEach(([key, cn]) => {
    go(key);
    const h = $("cat").innerHTML;
    ok(h.indexOf(cn) >= 0, cn + " 갈래 제목 없음");
    const n = (h.match(/<article class="qa"/g) || []).length;
    ok(n === 6, cn + " 갈래 문항 " + n + "개 (기대 6)");
    ok(!/undefined|NaN|\[object|§/.test(h), cn + " 갈래에 undefined/NaN/토큰");
    ok(h.length > 1500, cn + " 갈래 본문이 짧음 (" + h.length + ")");
  });

  /* ── 4. 연인궁합 ── */
  go("love2");
  ok(/연인궁합/.test($("cat").innerHTML), "연인궁합 화면 안 뜸");
  let inp = [...$("cat").querySelectorAll('.mrow [data-f]')];
  const byF = (f) => inp.find(x => x.dataset.f === f);
  ["y:1996", "m:4", "d:11", "hh:9", "mi:20"].forEach(p => {
    const [f, v] = p.split(":"); const e = byF(f);
    e.value = v; e.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  byF("name").value = "민"; byF("name").dispatchEvent(new window.Event("input", { bubbles: true }));
  click("gh-go");
  ok($("gh-err").textContent === "", "연인궁합 오류: " + $("gh-err").textContent);
  const lv = $("gh-out").innerHTML;
  ok(/class="bond"/.test(lv), "연인궁합 관계 이름 카드 없음");
  ok(lv.length > 9000, "연인궁합 결과가 짧음 (" + lv.length + ")");
  ok(!/undefined|NaN|\[object|§/.test(lv), "연인궁합에 undefined/NaN/토큰");
  const lsec = (lv.match(/class="gsec"/g) || []).length;
  ok(lsec >= 12, "연인궁합 섹션 " + lsec + "개 (기대 12개 이상)");
  ["왜 끌렸나","서로 다르게 읽는 지점","틀어질 때 도는 순서","서로의 눈에 비친 모습",
   "이 말을 할 때 속뜻","이 말 대신 이 말","오늘 할 수 있는 한 가지"].forEach(t => {
    ok(lv.indexOf(t) >= 0, "연인궁합에 '" + t + "' 섹션 없음");
  });
  ok((lv.match(/note-sc/g) || []).length >= 3, "연인궁합 대화 스크립트가 적음");

  /* ── 5. 비즈니스궁합 2~5인 ── */
  go("team");
  ok(/비즈니스궁합/.test($("cat").innerHTML), "비즈니스궁합 화면 안 뜸");

  const PEOPLE = [[1995, 3, 14, 10, 30, "여"], [1991, 8, 3, 19, 0, "남"], [2001, 12, 9, 6, 45, "여"], [1988, 5, 27, 23, 10, "남"]];
  for (let k = 0; k < 4; k++) {
    if (k > 0) { click("addm"); }
    const rows = [...$("cat").querySelectorAll(".mrow")];
    ok(rows.length === k + 1, "팀 입력칸 " + rows.length + "개 (기대 " + (k + 1) + ")");
    const r = rows[k];
    const p = PEOPLE[k];
    const f = (n) => r.querySelector('[data-f="' + n + '"]');
    [["y", p[0]], ["m", p[1]], ["d", p[2]], ["hh", p[3]], ["mi", p[4]]].forEach(([n, v]) => {
      f(n).value = String(v); f(n).dispatchEvent(new window.Event("input", { bubbles: true }));
    });
    f("name").value = "사람" + (k + 2); f("name").dispatchEvent(new window.Event("input", { bubbles: true }));
    const sb = [...r.querySelectorAll("[data-sex]")].find(b => b.dataset.sex === p[5]);
    if (sb) sb.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    click("gh-go");
    ok($("gh-err").textContent === "", (k + 2) + "인 궁합 오류: " + $("gh-err").textContent);
    const tv = $("gh-out").innerHTML;
    const pairs = (tv.match(/class="pair"/g) || []).length;
    const expect = (k + 2) * (k + 1) / 2;
    ok(pairs === expect, (k + 2) + "인 짝 " + pairs + "개 (기대 " + expect + ")");
    ok(/class="mcard"/.test(tv), (k + 2) + "인 역할 카드 없음");
    ok(/팀 오행/.test(tv), (k + 2) + "인 팀 오행 없음");
    ["이럴 때는 누구에게","한 사람에게 걸려 있는 것","회의를 어떻게 돌릴 것인가",
   "결정은 누가 어떻게","돈과 지분","같이 이야기해 볼 질문","이번 주에 할 것"].forEach(t => {
    ok(tv.indexOf(t) >= 0, (k + 2) + "인 궁합에 '" + t + "' 없음");
  });
  ok(/class="grid5"/.test(tv), (k + 2) + "인 자리 채움표 없음");
  ok((tv.match(/class="gsec"/g) || []).length >= 8, (k + 2) + "인 섹션 부족");
  ok(tv.length > 9500, (k + 2) + "인 결과가 짧음 (" + tv.length + ")");
    ok(!/undefined|NaN|\[object|§/.test(tv), (k + 2) + "인에 undefined/NaN/토큰");
  }
  ok($("addm").disabled, "다섯 명에서 추가 버튼이 잠기지 않음");

  /* ── 6. 되돌아가기 ── */
  click("again");
  ok(!$("out").classList.contains("on"), "다시 입력하기가 동작하지 않음");

  /* ── 7. 시간 모름 ── */
  $("nohour").checked = true; $("nohour").dispatchEvent(new window.Event("change", { bubbles: true }));
  set("y", 1975); set("m", 11); set("d", 5);
  click("submit");
  ok($("err").textContent === "", "시간 모름 오류: " + $("err").textContent);
  ok(!/undefined/.test($("plate").innerHTML), "시간 모름 판에 undefined");

  /* ── 8. 음력 + 윤달 ── */
  click("again");
  $("nohour").checked = false; $("nohour").dispatchEvent(new window.Event("change", { bubbles: true }));
  click("cal-l");
  set("y", 2020); set("m", 4); set("d", 10); set("hh", 5); set("mi", 0);
  $("leap").checked = true;
  click("submit");
  ok($("err").textContent === "", "음력 윤달 오류: " + $("err").textContent);
  ok(/윤|음력/.test($("plate").innerHTML), "음력 표기 없음");

  /* ── 8-b. 신년운세 ── */
  click("again");
  click("cal-l");
  $("leap").checked = false;
  set("y", 1967); set("m", 10); set("d", 26); set("hh", 8); set("mi", 18);
  click("sx-f");
  click("submit");
  ok($("err").textContent === "", "신년운세용 입력 오류: " + $("err").textContent);
  go("newyear");
  const ny = $("cat").innerHTML;
  ok(/class="ny-card"/.test(ny), "신년운세 한 글자 카드 없음");
  ok(/class="ny-ch"/.test(ny), "신년운세 한 글자 없음");
  const nyRows = (ny.match(/class="r(?: hi| lo)?"/g) || []).length;
  ok(nyRows === 12, "신년운세 달 칸 " + nyRows + "개 (기대 12)");
  const nySec = (ny.match(/class="gsec"/g) || []).length;
  ok(nySec >= 9, "신년운세 꼭지 " + nySec + "개 (기대 9 이상)");
  ok((ny.match(/class="note-ex"/g) || []).length >= 4, "신년운세 예시 칸이 너무 적음");
  ok(/입춘/.test(ny), "신년운세 입춘 안내 없음");
  ok(!/undefined|NaN|\[object|§/.test(ny), "신년운세에 undefined/NaN/토큰");
  /* 내년으로 넘겨도 돌아야 한다 */
  const nyBtn = [...$("cat").querySelectorAll("[data-ny]")];
  ok(nyBtn.length === 2, "신년운세 연도 전환 버튼 " + nyBtn.length + "개");
  nyBtn[1].dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const ny2 = $("cat").innerHTML;
  ok(/class="ny-card"/.test(ny2), "다음 해 신년운세가 안 뜸");
  ok(!/undefined|NaN|\[object|§/.test(ny2), "다음 해 신년운세에 undefined/NaN");

  /* ── 9. 잘못된 입력 ── */
  click("again");
  click("cal-s");
  set("y", ""); set("m", ""); set("d", "");
  click("submit");
  ok($("err").textContent !== "", "빈 입력인데 오류 메시지가 없음");

  if (errs.length) { console.log("\n콘솔/런타임 오류:"); errs.slice(0, 12).forEach(e => console.log("  ✗ " + e)); fails += errs.length; }
  console.log(fails ? `\n실패 ${fails}건` : "\n전부 통과");
  process.exit(fails ? 1 : 0);
}, 400);
