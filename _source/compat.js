/* ═══════════════════════════════════════════════════════════
 *  compat.js — 연인 궁합 / 비즈니스 궁합 결과지
 *
 *  점수 하나와 다섯 줄로 끝나던 것을, 두 사람 명식을 실제로 겹쳐
 *  "왜 끌렸고 / 어디서 어긋나고 / 무엇을 오해하고 / 언제 힘들고 / 뭐라고 말하면 되는지"
 *  까지 내려간다.
 * ═══════════════════════════════════════════════════════════ */

import { pairAxes, pairYears, daeunShifts, C_ROLE } from "./compat-core.js";
import { LOVE_CROSS, WORK_CROSS, BRANCH_LOVE, LEVEL_PAIR, YINYANG, GIVE,
         bondName, SAME_WANT, SPIRAL_ROLE, SPIRAL, SAID_MEANT, SEEN_AS,
         INSTEAD_SAY, TODAY_DO } from "./compat-copy.js";
import { examplesFor } from "./examples.js";
import { polish } from "./report.js";

/* 이름에 조사를 붙인다 */
function cJong(w) {
  const m = String(w).match(/[가-힣](?![\s\S]*[가-힣])/);
  if (!m) return false;
  return (m[0].charCodeAt(0) - 0xAC00) % 28 !== 0;
}
const iGa  = (w) => w + (cJong(w) ? "이" : "가");
const eunN = (w) => w + (cJong(w) ? "은" : "는");
const eulL = (w) => w + (cJong(w) ? "을" : "를");
const waGwa= (w) => w + (cJong(w) ? "과" : "와");
const egeN = (w) => w + "에게";
const egeN2 = (w) => w + "에게";

const EL_WORD = { 목:"나무", 화:"불", 토:"흙", 금:"쇠", 수:"물" };
const el = (e) => `${e}(${EL_WORD[e] || e})`;

const L_GRADE = (s) => s >= 82 ? "아주 잘 맞는 사이" : s >= 68 ? "잘 맞는 사이"
                   : s >= 54 ? "노력하면 되는 사이" : s >= 40 ? "부딪히는 사이" : "쉽지 않은 사이";

/** 항목 하나 만들기 — 조언이 있으면 예시를 붙인다 */
function sec(title, lead, body, opts = {}) {
  const lines = [].concat(body).filter(x => typeof x === "string" && x.trim());
  return {
    title, lead: lead || "",
    body: lines,
    script: opts.script || null,          // 그대로 쓸 수 있는 말
    /* 머리글(lead)에도 방향을 제시하는 문장이 들어간다. 본문만 보면 놓친다 */
    examples: examplesFor([lead || ""].concat(lines, opts.script || []), 2),
    tag: opts.tag || "",
  };
}

/* ═══════════════════════════════════════════════════════════
 *  연인 궁합
 * ═══════════════════════════════════════════════════════════ */
export function buildLoveCompat(a, b, opts = {}) {
  const nameA = (opts.nameA || "나").trim() || "나";
  const nameB = (opts.nameB || "상대").trim() || "상대";
  const P = pairAxes(a, b, nameA, nameB);
  const A = P.a, B = P.b;

  const xB = LOVE_CROSS[P.bToA] || LOVE_CROSS["비견"];   // 상대가 나에게
  const xA = LOVE_CROSS[P.aToB] || LOVE_CROSS["비견"];   // 내가 상대에게
  const br = BRANCH_LOVE[P.branch.key] || BRANCH_LOVE["무관"];
  const lvKey = [A.level, B.level].sort().join("") === "신강신약" ? "신강신약"
              : A.level === B.level ? A.level + B.level : "신강신약";
  const lv = LEVEL_PAIR[lvKey] || LEVEL_PAIR["중화중화"];
  const yy = P.sameYinYang ? YINYANG.same : YINYANG.diff;
  const giveKey = (P.give.aToB >= 25 && P.give.bToA >= 25) ? "both"
                : (P.give.aToB >= 25 || P.give.bToA >= 25) ? "oneWay" : "none";
  const gv = GIVE[giveKey];

  const years = pairYears(a, b, nameA, nameB, 8);
  const shifts = daeunShifts(a, b, nameA, nameB, 12);
  const goodY = years.filter(y => y.kind === "합");
  const hardY = years.filter(y => y.kind !== "합");

  const sections = [];

  /* 1. 왜 끌렸나 */
  sections.push(sec(
    "왜 끌렸나",
    `${eunN(nameB)} ${egeN(nameA)} ${P.bToA}, ${xB.label}입니다.`,
    [
      `${eunN(nameB)} ${egeN(nameA)} **${P.bToA}**에 해당합니다. 쉽게 말해 ${xB.label}입니다.`,
      xB.draw,
      `반대로 ${eunN(nameA)} ${egeN(nameB)} **${P.aToB}**, ${xA.label}입니다. ${xA.draw}`,
      P.bToA === P.aToB
        ? `서로에게 같은 자리라 거울처럼 비슷하게 느낍니다. 좋을 때는 말이 필요 없고, 틀어질 때는 똑같이 틀어집니다.`
        : `서로에게 다른 자리입니다. 같은 관계를 두고도 느끼는 것이 다르다는 뜻이라, 이 차이를 모르면 대화가 계속 어긋납니다.`,
    ],
    { tag: "끌림" }));

  /* 1-b. 둘 다 같은 것을 원하는 지점 */
  const wantKey = `${P.bToARole}-${P.aToBRole}`;
  const want = SAME_WANT[wantKey] || SAME_WANT[`${P.aToBRole}-${P.bToARole}`] || "";
  if (want) sections.push(sec(
    "둘 다 같은 걸 원하는 지점",
    "싸우는 이유가 서로 다른 걸 원해서가 아닙니다.",
    [
      want,
      `방법이 반대라서 서로가 서로를 방해하는 것처럼 보입니다. 원하는 것이 같다는 걸 알고 나면 같은 대화가 전혀 다르게 흘러갑니다.`,
      `**다툴 때 한 번만 물어보세요.** \u201C우리 지금 뭘 지키려고 싸우는 거야?\u201D 대개 답이 같습니다.`,
    ], { tag:"공통" }));

  /* 2. 두 사람의 자리 */
  sections.push(sec(
    "두 사람의 자리",
    `${A.gapjaCn} 일주와 ${B.gapjaCn} 일주 — 일지는 ${P.branch.key}입니다.`,
    [
      `${eunN(nameA)} ${A.gapjaCn}(${el(A.el)}) 일주, ${eunN(nameB)} ${B.gapjaCn}(${el(B.el)}) 일주입니다.`,
      `윗글자끼리는 **${P.stem.key}** 관계입니다. ${
        P.stem.key === "천간합" ? "서로를 끌어당기는 힘이 기본으로 깔려 있습니다. 설명하지 않아도 의도가 전달되는 사이입니다."
        : P.stem.key === "내가 준다" ? `${nameA}의 ${el(A.el)} 기운이 ${nameB}의 ${el(B.el)} 기운을 살립니다. 주는 쪽이 ${nameA}이라 아끼는 마음이 자연스럽게 나옵니다.`
        : P.stem.key === "내가 받는다" ? `${nameB}의 ${el(B.el)} 기운이 ${nameA}의 ${el(A.el)} 기운을 살립니다. ${iGa(nameA)} 기대게 되는 구조입니다.`
        : P.stem.key === "내가 누른다" ? `${nameA}의 ${el(A.el)} 기운이 ${eulL(nameB)} 누릅니다. ${nameA}의 말이 의도보다 세게 가 닿습니다.`
        : P.stem.key === "내가 눌린다" ? `${nameB}의 ${el(B.el)} 기운이 ${eulL(nameA)} 누릅니다. ${iGa(nameA)} 눌리는 느낌을 받기 쉽습니다.`
        : "같은 기운이라 코드가 맞습니다. 편한 대신 같은 약점도 공유합니다."}`,
      `아랫글자, 곧 배우자 자리는 **${P.branch.key}**입니다. ${br.t}. ${br.b}`,
      `**다만.** ${br.w}`,
    ],
    { tag: "구조" }));

  /* 3. 오해의 구조 — 가장 중요한 자리 */
  sections.push(sec(
    "서로 다르게 읽는 지점",
    "같은 행동을 두고 둘이 전혀 다르게 해석합니다.",
    [
      `**${iGa(nameA)} 겪는 쪽.** ${xB.misread}`,
      `**${iGa(nameB)} 겪는 쪽.** ${xA.misread}`,
      `이 두 줄이 이 관계에서 벌어지는 싸움의 거의 전부입니다. 어느 쪽도 나쁜 뜻이 없는데, 보내는 신호와 받는 신호가 다릅니다.`,
      `**풀리는 지점은 하나입니다.** 상대의 행동을 해석하지 말고 물어보는 것. 해석은 거의 틀리고, 틀린 해석 위에 쌓인 서운함은 되돌리기 어렵습니다.`,
    ],
    { script: xB.fix, tag: "오해" }));

  /* 3-b. 갈등 나선 */
  const aChase = SPIRAL_ROLE.chase.indexOf(A.domRole) >= 0;
  const bChase = SPIRAL_ROLE.chase.indexOf(B.domRole) >= 0;
  const chaser = aChase && !bChase ? nameA : bChase && !aChase ? nameB : null;
  const puller = chaser === nameA ? nameB : chaser === nameB ? nameA : null;
  sections.push(sec(
    "틀어질 때 도는 순서",
    chaser ? `${iGa(chaser)} 쫓고 ${iGa(puller)} 물러서는 모양으로 돕니다.`
           : (aChase ? "둘 다 먼저 다가가는 쪽입니다." : "둘 다 먼저 물러서는 쪽입니다."),
    chaser ? [
      `**1. 거리 감지.** ${SPIRAL.chase.s1} (${chaser}) / ${SPIRAL.pull.s1} (${puller})`,
      `**2. 압박.** ${SPIRAL.chase.s2} (${chaser}) → ${eunN(puller)} 그것을 압박으로 느낍니다.`,
      `**3. 후퇴.** ${SPIRAL.pull.s3} (${puller}) → ${eunN(chaser)} 그 거리를 거절로 읽습니다.`,
      `**4. 추격.** ${SPIRAL.chase.s3} (${chaser}) → ${SPIRAL.pull.s4} (${puller})`,
      `한 바퀴 돌고 나면 둘 다 상처만 남습니다. **끊는 자리는 2번입니다.** 3번까지 가면 이미 늦습니다.`,
    ] : aChase ? [
      `둘 다 반응이 빠른 쪽이라 틀어지면 양쪽에서 동시에 치고 들어갑니다. 식는 것도 빠르지만 말이 세게 나갑니다.`,
      `**끊는 자리.** 누가 먼저랄 것 없이 둘 다 멈춰야 합니다. \u201C20분 뒤에 다시\u201D를 둘 다 쓸 수 있게 미리 약속해 두세요.`,
    ] : [
      `둘 다 안으로 들어가는 쪽이라 틀어지면 조용해집니다. 싸움은 없는데 거리가 벌어지고, 어느 날 돌아보면 한참 멀어져 있습니다.`,
      `**끊는 자리.** 침묵이 사흘을 넘기지 않게 하는 규칙 하나를 두세요. 내용이 없어도 \u201C아직 정리 중이야\u201D 한 줄이면 충분합니다.`,
    ],
    { script: chaser
        ? `${iGa(puller)} 쓸 말: \u201C지금 말 못 하겠어. 생각 정리되면 오늘 밤에 다시 얘기할게.\u201D / ${iGa(chaser)} 쓸 말: \u201C답 지금 안 해도 돼. 언제쯤 얘기할 수 있을지만 알려줘.\u201D`
        : "\u201C지금은 둘 다 올라와 있으니까 20분만 식히자.\u201D 둘 중 누구든 먼저 쓸 수 있게 해 두세요.",
      tag:"나선" }));

  /* 3-c. 서로의 눈에 비친 모습 */
  const seenA = SEEN_AS[P.aToB] || SEEN_AS["비견"];
  const seenB = SEEN_AS[P.bToA] || SEEN_AS["비견"];
  sections.push(sec(
    "서로의 눈에 비친 모습",
    "좋을 때와 틀어졌을 때, 같은 사람이 전혀 다르게 보입니다.",
    [
      `**${nameB}의 눈에 ${eunN(nameA)}** — 좋을 때는 ${seenA.good}, 틀어지면 ${seenA.bad}으로 보입니다.`,
      `**${nameA}의 눈에 ${eunN(nameB)}** — 좋을 때는 ${seenB.good}, 틀어지면 ${seenB.bad}으로 보입니다.`,
      `둘 다 사실이 아니라 **그때의 거리**입니다. 사람이 변한 게 아니라 보는 자리가 바뀐 것뿐입니다.`,
    ], { tag:"시선" }));

  /* 3-d. 말과 속뜻 */
  const smA = SAID_MEANT[A.dom] || [];
  const smB = SAID_MEANT[B.dom] || [];
  sections.push(sec(
    "이 말을 할 때 속뜻",
    "두 사람이 자주 쓰는 말과, 그 말의 실제 뜻입니다.",
    [
      ...smA.map(([said, meant]) => `**${nameA}: \u201C${said}\u201D** → ${meant}`),
      ...smB.map(([said, meant]) => `**${nameB}: \u201C${said}\u201D** → ${meant}`),
      `말 그대로 받으면 거의 어긋납니다. 특히 \u201C괜찮아\u201D와 \u201C됐어\u201D는 두 사람 모두에게 반대 뜻인 경우가 많습니다.`,
    ], { tag:"번역" }));

  /* 4. 어디서 부딪히나 */
  const hardList = P.hardSpots.slice(0, 3).map(s =>
    `${nameA}의 ${s.aPos} ${waGwa(s.aCn)} ${nameB}의 ${s.bPos} ${iGa(s.bCn)} ${s.kind}`);
  sections.push(sec(
    "어디서 부딪히나",
    P.hardSpots.length ? `명식에서 맞부딪히는 자리가 ${P.hardSpots.length}곳 있습니다.`
                       : "명식끼리 세게 부딪히는 자리는 없습니다.",
    [
      xB.friction,
      P.hardSpots.length
        ? `**부딪히는 자리.** ${hardList.join(", ")}.\n이런 자리가 많을수록 사소한 일로 자주 틀어집니다. 사람 문제가 아니라 결이 다른 지점이 많다는 뜻입니다.`
        : `여덟 글자씩 겹쳐 봐도 충이나 형으로 걸리는 자리가 없습니다. 크게 싸울 일은 적은 조합입니다.`,
      P.softSpots.length
        ? `**반대로 붙는 자리도 ${P.softSpots.length}곳 있습니다.** ${P.softSpots.slice(0,2).map(s => `${s.aPos} ${s.aCn}–${s.bPos} ${s.bCn} ${s.kind}`).join(", ")}. 틀어졌을 때 다시 붙게 만드는 자리입니다.`
        : `대신 특별히 붙는 자리도 없어, 틀어지면 저절로 풀리기를 기다리기 어렵습니다. 먼저 손 내미는 쪽이 있어야 합니다.`,
      P.load.aToB >= 32 || P.load.bToA >= 32
        ? `**한 가지 더.** ${P.load.aToB >= 32 ? `${iGa(nameA)} ${nameB}에게 이미 과한 ${el(B.gisin)} 기운을 ${P.load.aToB}%로 더 얹습니다.` : ""}${P.load.bToA >= 32 ? ` ${iGa(nameB)} ${nameA}에게 과한 ${el(A.gisin)} 기운을 ${P.load.bToA}%로 더합니다.` : ""} 나쁜 사람이라서가 아니라, 이미 넘치는 자리를 건드리기 때문입니다.`
        : "",
    ],
    { tag: "마찰" }));

  /* 5. 말이 엇갈리는 지점 */
  sections.push(sec(
    "말이 엇갈리는 지점",
    "두 사람의 말하는 방식과 듣는 방식이 다릅니다.",
    [
      A.comm.speak === B.comm.speak
        ? `**둘 다 말하는 방식이 같습니다.** ${A.comm.speak} 같은 방식이라 편한 대신, 둘 다 안 하는 말은 끝까지 안 나옵니다.`
        : `**${nameA}의 말하기.** ${A.comm.speak}\n**${nameB}의 말하기.** ${B.comm.speak}`,
      A.comm.listen === B.comm.listen
        ? `**듣는 방식도 같습니다.** ${A.comm.listen} 둘 다 그렇다는 것이 이 조합의 가장 큰 숙제입니다.`
        : `**${nameA}의 듣기.** ${A.comm.listen}\n**${nameB}의 듣기.** ${B.comm.listen}`,
      `**부딪히는 자리.** ${A.comm.conflict}`,
    ],
    { script: A.comm.fix, tag: "대화" }));

  /* 6. 서로를 채우는가 */
  sections.push(sec(
    "서로를 채우는 사이인가",
    gv.t,
    [
      gv.b,
      P.give.bToA >= 25
        ? `${nameA}에게 필요한 ${el(A.yongsin)} 기운을 ${iGa(nameB)} ${P.give.bToA}%로 가지고 있습니다.` : "",
      P.give.aToB >= 25
        ? `${nameB}에게 필요한 ${el(B.yongsin)} 기운을 ${iGa(nameA)} ${P.give.aToB}%로 채워줍니다.` : "",
      `**${lv.t}.** ${lv.b}`,
      `**${yy.t}** ${yy.b}`,
    ],
    { script: gv.f, tag: "보완" }));

  /* 7. 함께 있을 때 두 사람 */
  sections.push(sec(
    "둘이 함께 있을 때",
    `두 사람의 기운을 합치면 ${P.merged.slice().sort((x,y)=>y.ratio-x.ratio)[0].name} 쪽으로 기웁니다.`,
    [
      `합쳐 보면 ${P.merged.map(e => `${el(e.name)} ${e.ratio}%`).join(" · ")}입니다.`,
      P.mLack.length
        ? `**둘 다 ${P.mLack.map(el).join("·")} 기운이 얇습니다.** 같이 있으면 이 영역에서 반복해서 막힙니다. ${
            P.mLack[0] === "목" ? "새로 시작하는 일을 둘 다 미룹니다. 분기마다 새 시도를 하나 강제하는 규칙을 만드세요."
          : P.mLack[0] === "화" ? "좋은 걸 만들어도 둘 다 알리지 못합니다. 바깥으로 드러내는 일은 밖에 맡기거나 일부러 연습하셔야 합니다."
          : P.mLack[0] === "토" ? "둘 다 꾸준히 쌓는 데 약합니다. 저축이든 기록이든 자동으로 되는 장치를 거세요."
          : P.mLack[0] === "금" ? "둘 다 끊고 마무리하는 데 약합니다. 결정이 끝없이 미뤄지니 '이 날까지 안 정하면 A로 간다'를 미리 정해 두세요."
          : "둘 다 유연하게 받아들이는 데 약합니다. 한 방향으로만 밀다 변화에 늦습니다. 밖의 의견을 듣는 자리를 일부러 만드세요."}`
        : "",
      P.mOver.length
        ? `**${P.mOver.map(el).join("·")} 기운은 둘이 합치면 넘칩니다.** 같은 성향이 두 배가 되는 자리라, 서로 말려 주지 못하고 같이 멀리 갑니다.`
        : "",
      !P.mLack.length && !P.mOver.length
        ? "다섯 기운이 비교적 고르게 모입니다. 한 사람의 치우침을 다른 사람이 메워 주는 조합이라, 함께 있을 때 둘 다 덜 흔들립니다." : "",
    ],
    { tag: "합" }));

  /* 8. 시기 */
  sections.push(sec(
    "언제 좋고 언제 힘든가",
    years.length ? `앞으로 8년 안에 두 사람 중 누군가의 자리가 흔들리는 해가 ${years.length}번 있습니다.`
                 : "앞으로 8년 안에 배우자 자리가 크게 흔들리는 해는 없습니다.",
    [
      goodY.length
        ? `**가까워지는 해.** ${goodY.map(y => `${y.year}년(${y.gapjaCn}, ${y.hits.map(h => h.who).join("·")})`).join(", ")}. 배우자 자리에 합이 드는 해라 관계가 한 단계 진전되기 쉽습니다. 결혼이나 동거처럼 형태가 바뀌는 결정은 이 해에 잘 맞습니다.`
        : "",
      hardY.length
        ? `**흔들리는 해.** ${hardY.map(y => `${y.year}년(${y.gapjaCn}, ${y.hits.map(h => h.who).join("·")})`).join(", ")}. 배우자 자리가 충을 맞는 해입니다. 이사·이직·사별 같은 환경 변화가 겹치기 쉽고, 그 스트레스가 관계로 옵니다.`
        : "",
      !years.length ? "두 사람 모두 배우자 자리가 비교적 조용하게 지나갑니다. 큰 사건보다 일상의 누적이 관계를 정합니다." : "",
      shifts.length
        ? `**판이 바뀌는 해.** ${shifts.slice(0,3).map(d => `${d.year}년 ${d.who}(${d.age}세 ${d.gapjaCn})`).join(", ")}에 10년 운이 바뀝니다. 한 사람의 10년이 바뀌면 두 사람의 속도도 같이 바뀝니다. 이 해 앞뒤로는 큰 결정을 미루는 편이 안전합니다.`
        : "",
      `시기가 나쁘다는 건 헤어진다는 뜻이 아닙니다. 그 해에 부딪힐 일이 많다는 것을 알고 들어가면, 같은 일이 훨씬 작게 지나갑니다.`,
    ],
    { tag: "시기" }));

  /* 9. 이 말 대신 이 말 */
  sections.push(sec(
    "이 말 대신 이 말",
    "이 조합에서 특히 위험한 말과, 같은 뜻의 다른 말입니다.",
    INSTEAD_SAY.slice(0, 4).map(([bad, good]) => `\u201C${bad}\u201D 대신 → **\u201C${good}\u201D**`)
      .concat([`공식은 하나입니다. **\u201C너는 ~해\u201D(상대를 규정)를 \u201C나는 ~할 때 ~라고 느껴\u201D(내 감정 + 구체적 행동)로 바꾸는 것.** 같은 내용인데 상대의 방어가 절반으로 줍니다.`]),
    { tag:"말" }));

  /* 10. 오늘 할 수 있는 한 가지 */
  sections.push(sec(
    "오늘 할 수 있는 한 가지",
    "읽고 덮으면 아무것도 바뀌지 않습니다.",
    [
      `**${nameA}에게.** ${TODAY_DO[P.bToA] || TODAY_DO["비견"]}`,
      `**${nameB}에게.** ${TODAY_DO[P.aToB] || TODAY_DO["비견"]}`,
      `**둘이 함께.** 이 결과지에서 가장 뜨끔했던 줄 하나씩만 서로에게 읽어 주세요. 설명은 하지 말고 읽기만 하는 겁니다.`,
    ], { tag:"오늘" }));

  /* ── 항목별 점수 — 이번에는 실제 데이터로 ── */
  const clamp = (n) => Math.max(12, Math.min(97, Math.round(n)));
  const fields = [
    { key:"spark", name:"끌림", cn:"緣",
      score: clamp(P.score + (P.branch.key === "충" ? 8 : 0) + (P.stem.key === "천간합" ? 6 : 0) - (P.branch.key === "무관" ? 5 : 0)),
      text: P.branch.key === "충" ? "첫 끌림이 유독 센 조합입니다. 정반대라서 눈에 들어옵니다. 빠르게 가까워지는 대신 식는 것도 빠를 수 있습니다."
          : P.stem.key === "천간합" ? "서로를 당기는 힘이 기본으로 깔려 있습니다. 처음부터 편했고 앞으로도 편할 조합입니다."
          : "극적인 끌림보다 시간이 쌓이며 깊어지는 쪽입니다. 초반 느낌만으로 판단하면 아깝습니다." },
    { key:"talk", name:"대화", cn:"言",
      score: clamp(P.score + (P.stem.key === "천간합" ? 8 : 0) + (P.stem.key.includes("누") ? -8 : 2)),
      text: (A.comm.speak === B.comm.speak
        ? `두 사람의 말하는 방식이 같습니다. 편한 대신 둘 다 안 꺼내는 말은 끝까지 안 나옵니다. `
        : `말하는 방식이 서로 다릅니다. ${nameA}: ${A.comm.speak.split(".")[0]}. ${nameB}: ${B.comm.speak.split(".")[0]}. `)
        + (P.stem.key.includes("누")
          ? "같은 말도 다르게 들리는 조합이라, 결론보다 이유를 먼저 말하는 순서가 꼭 필요합니다."
          : "알아들을 수는 있는 사이라, 순서만 지키면 크게 어긋나지 않습니다.") },
    { key:"live", name:"같이 살기", cn:"居",
      score: clamp(P.score + (giveKey === "both" ? 9 : giveKey === "none" ? -5 : 3) - P.hardSpots.length * 2),
      text: giveKey === "both" ? "부족한 기운을 서로 채워주는 조합이라 함께 살수록 안정됩니다. 연애보다 생활에서 더 빛나는 궁합입니다."
          : giveKey === "none" ? "연애보다 생활에서 차이가 드러납니다. 생활 방식과 돈 문제를 미리 합의해 두면 크게 흔들리지 않습니다."
          : "한쪽이 더 맞춰 주는 구조입니다. 맞춰 주는 쪽이 지치지 않게 역할을 나눠 두세요." },
    { key:"money", name:"돈", cn:"財",
      score: clamp(P.score + ((A.ratios[A.el] >= 30 || B.ratios[B.el] >= 30) ? -7 : 4)),
      text: (A.ratios[A.el] >= 30 || B.ratios[B.el] >= 30)
          ? `${A.ratios[A.el] >= 30 ? nameA : nameB} 쪽 비겁이 두터워 돈을 나누는 문제에서 부딪히기 쉽습니다. 통장을 합칠지 나눌지를 초반에 정해 두세요.`
          : "돈 문제로 크게 부딪힐 구조는 아닙니다. 다만 쓰는 기준이 다르면 작은 지출에서 자주 걸립니다." },
    { key:"long", name:"오래 가기", cn:"久",
      score: clamp(P.score + (P.branch.key === "육합" ? 8 : P.branch.key === "형" ? -8 : 0) - (P.mLack.length ? 4 : 0) + (P.softSpots.length ? 4 : 0)),
      text: P.branch.key === "육합" ? "오래 붙어 있어도 피로가 적은 조합입니다. 10년 뒤에도 비슷한 모습일 가능성이 높습니다."
          : P.branch.key === "형" ? "말로 조금씩 깎이는 조합이라, 오래 가려면 싸우는 방식에 규칙이 필요합니다."
          : "10년을 같이 가려면 서로의 10년 운이 엇갈리는 구간을 미리 알고 있어야 합니다. 위의 '판이 바뀌는 해'를 기억해 두세요." },
  ].map(f => ({ ...f, grade: L_GRADE(f.score) }));

  /* 관계 이름 — 끌림과 회복으로 짓는다. 점수보다 이름이 오래 남는다.
     끌림은 아래 항목 점수의 '끌림'을 그대로 쓴다. 같은 화면에 같은 이름의
     숫자가 두 개 뜨면 읽는 사람이 어느 쪽을 믿어야 할지 알 수 없다. */
  const pull = fields.find(f => f.key === "spark").score;
  const repair = Math.max(0, Math.min(100,
    55 + (giveKey === "both" ? 20 : giveKey === "oneWay" ? 8 : -10)
       + (P.branch.key === "형" ? -18 : 0) + (P.branch.key === "충" ? -12 : 0)
       - P.hardSpots.length * 4 + (P.branch.key === "육합" ? 12 : 0)));
  const bond = bondName({ pull, repair });

  return polish({
    kind: "love",
    nameA, nameB,
    bond, pull: Math.round(pull), repair: Math.round(repair),
    score: P.score, grade: L_GRADE(P.score),
    headline: `${waGwa(nameA)} ${nameB} — ${bond.name}`,
    oneLine: `${eunN(nameB)} ${egeN(nameA)} ${P.bToA}(${xB.label}), ${eunN(nameA)} ${egeN(nameB)} ${P.aToB}(${xA.label})입니다.`,
    a: { name:nameA, gapja:A.gapja, gapjaCn:A.gapjaCn, el:A.el, level:A.level, yongsin:A.yongsin, type:A.type.name, dom:A.dom },
    b: { name:nameB, gapja:B.gapja, gapjaCn:B.gapjaCn, el:B.el, level:B.level, yongsin:B.yongsin, type:B.type.name, dom:B.dom },
    cross: { aToB:P.aToB, bToA:P.bToA, aLabel:xA.label, bLabel:xB.label },
    stemRel: P.stem.key, branchRel: P.branch.key,
    sections, fields,
    years, shifts,
    closing: P.score >= 68
      ? "잘 맞는 조합입니다. 다만 좋은 궁합은 싸우지 않는 관계가 아니라 **잘 회복되는 관계**입니다. 잘 맞는 사이일수록 노력이 티가 나지 않아 서로 당연하게 여기기 쉽습니다."
      : P.score >= 54
      ? "노력이 필요한 조합입니다. 궁합은 시작 조건이지 결론이 아닙니다. 어디서 부딪히는지를 알고 만나면 그 지점이 오히려 강점이 됩니다."
      : "쉽지 않은 조합으로 나옵니다. 다만 사주가 맞지 않아도 오래 사는 사람들이 있습니다. 차이를 고치려 들지 않고 인정하는 것이 이 궁합의 유일한 방법입니다.",
    disclaimer: "궁합은 두 사람의 타고난 결이 어떻게 만나는지를 보는 것이지, 만나도 되는지 아닌지를 정하는 것이 아닙니다. 점수가 낮아도 알고 만나면 달라지고, 점수가 높아도 모르고 만나면 똑같이 틀어집니다.",
  });
}

/* ═══════════════════════════════════════════════════════════
 *  비즈니스 궁합 (관계사주) — 2~5인
 * ═══════════════════════════════════════════════════════════ */

/* 팀에서 맡으면 좋은 자리 */
const TEAM_SEAT = {
  비겁: { seat:"추진·대표", cn:"推",
    t:"앞에서 끌고 가는 자리입니다. 결정이 빠르고 책임지는 데 거리낌이 없습니다.",
    use:"대표, 영업 총괄, 신규 개척처럼 '내가 정한다'가 성립하는 자리에 두세요.",
    risk:"같은 성향끼리 붙이면 반드시 주도권 싸움이 납니다.",
    meeting:"회의를 열고 닫는 역할을 맡기세요. 대신 발언 시간을 재서 혼자 절반을 넘기지 않게 하는 장치가 필요합니다." },
  식상: { seat:"기획·제작", cn:"創",
    t:"만들고 표현하는 자리입니다. 아이디어와 결과물이 이 사람에게서 나옵니다.",
    use:"콘텐츠, 상품 기획, 제작, 마케팅 크리에이티브를 맡기세요.",
    risk:"벌여놓기만 하고 마무리가 흐려집니다.",
    meeting:"회의 앞머리 10분을 이 사람의 아이디어 시간으로 주세요. 대신 그날 안에 '무엇을 언제까지'로 좁히는 사람이 옆에 있어야 합니다." },
  재성: { seat:"영업·수익", cn:"財",
    t:"숫자로 판단하는 자리입니다. 돈이 어디서 들어오는지를 가장 먼저 봅니다.",
    use:"매출, 영업, 단가 협상, 정산을 맡기세요.",
    risk:"효율이 사람을 이기면 팀이 식습니다.",
    meeting:"회의 끝에 '이번 주 숫자'를 읽는 자리를 맡기세요. 시작이 아니라 끝에 두는 것이 중요합니다." },
  관성: { seat:"관리·운영", cn:"官",
    t:"기준과 책임의 자리입니다. 규칙을 세우고 지키게 만드는 힘이 있습니다.",
    use:"운영, 품질 관리, 계약과 법무, 일정 관리를 맡기세요.",
    risk:"속도를 늦추는 쪽으로 작동할 수 있습니다.",
    meeting:"결정 사항을 기록하고 다음 회의에서 확인하는 역할을 맡기세요. 이 사람이 없으면 같은 안건이 계속 돌아옵니다." },
  인성: { seat:"설계·교육", cn:"印",
    t:"받아서 정리하는 자리입니다. 구조를 짜고 사람을 가르치는 데 능합니다.",
    use:"전략 설계, 문서화, 교육과 온보딩, 리서치를 맡기세요.",
    risk:"준비가 길어집니다. 실행을 책임지는 사람이 뒤를 받쳐야 합니다.",
    meeting:"안건을 미리 정리해 돌리는 역할을 맡기세요. 이 사람이 준비하면 회의 시간이 절반으로 줍니다." },
};

const T_GRADE = (s) => s >= 76 ? "아주 좋은 팀" : s >= 64 ? "좋은 팀"
                     : s >= 52 ? "운영하면 되는 팀" : s >= 40 ? "조심할 팀" : "구조를 바꿔야 하는 팀";

/** 다섯 자리를 비중 순으로 */
function seatRank(P) {
  const r = P.ratios, me = P.el;
  const EL_GEN = { 목:"화", 화:"토", 토:"금", 금:"수", 수:"목" };
  const EL_CTL = { 목:"토", 화:"금", 토:"수", 금:"목", 수:"화" };
  const EL_CTLBY = { 목:"금", 화:"수", 토:"목", 금:"화", 수:"토" };
  const EL_GENBY = { 목:"수", 화:"목", 토:"화", 금:"토", 수:"금" };
  const score = {
    비겁: r[me] || 0, 식상: r[EL_GEN[me]] || 0, 재성: r[EL_CTL[me]] || 0,
    관성: r[EL_CTLBY[me]] || 0, 인성: r[EL_GENBY[me]] || 0,
  };
  score[P.domRole] = (score[P.domRole] || 0) + 8;
  return Object.entries(score).sort((x, y) => y[1] - x[1]).map(([k]) => k);
}

/**
 * 비즈니스 궁합 — 나를 포함해 2~5명
 * @param {Array} members [{name, saju}]
 */
export function buildTeamReport(members, opts = {}) {
  const raw = (members || []).slice(0, 5);
  if (raw.length < 2) return { error: "두 사람 이상 넣어야 관계를 봅니다." };

  /* 각자의 축 — 자기 자신과 한 번 돌려 개인 정보를 얻는다 */
  const M = raw.map((m, i) => {
    const self = pairAxes(m.saju, m.saju, m.name || `${i + 1}번`, m.name || `${i + 1}번`);
    const p = self.a;
    return { idx:i, name:p.name, saju:m.saju, ...p, rank: seatRank(p) };
  });

  /* 자리 배치 — 겹치면 다음 비중으로 */
  const taken = {};
  M.forEach(m => {
    const pick = m.rank.find(r => !taken[r]) || m.rank[0];
    taken[pick] = true;
    m.seatKey = pick;
    m.seat = TEAM_SEAT[pick];
    m.firstSeat = m.rank[0];
  });

  /* 쌍 */
  const pairs = [];
  for (let i = 0; i < M.length; i++)
    for (let j = i + 1; j < M.length; j++) {
      const P = pairAxes(M[i].saju, M[j].saju, M[i].name, M[j].name);
      const xj = WORK_CROSS[P.bToA] || WORK_CROSS["비견"];   // j가 i에게
      const xi = WORK_CROSS[P.aToB] || WORK_CROSS["비견"];   // i가 j에게
      pairs.push({
        a: M[i].name, b: M[j].name, ai: i, bj: j,
        score: P.score, label: T_GRADE(P.score),
        aToB: P.aToB, bToA: P.bToA,
        aLabel: xi.label, bLabel: xj.label,
        stemRel: P.stem.key, branchRel: P.branch.key,
        hard: P.hardSpots.length, soft: P.softSpots.length,
        lines: [
          `${eunN(M[j].name)} ${M[i].name}에게 **${P.bToA}**, ${xj.label}입니다. ${xj.draw}`,
          `반대로 ${eunN(M[i].name)} ${M[j].name}에게 **${P.aToB}**, ${xi.label}입니다.`,
          `**어긋나는 자리.** ${xj.friction}`,
          `**서로 다르게 읽는 지점.** ${xj.misread}`,
          P.hardSpots.length
            ? `명식끼리 부딪히는 자리가 ${P.hardSpots.length}곳 있습니다(${P.hardSpots.slice(0,2).map(s => `${s.aPos}${s.aCn}–${s.bPos}${s.bCn} ${s.kind}`).join(", ")}). 같은 업무를 함께 보게 하면 가장 먼저 터지는 짝입니다.`
            : `명식끼리 세게 부딪히는 자리는 없습니다. 배치만 맞으면 무난하게 굴러갑니다.`,
        ],
        fix: xj.fix,
        examples: examplesFor([xj.fix, xj.friction], 2),
      });
    }

  const avg = Math.round(pairs.reduce((s, p) => s + p.score, 0) / pairs.length);
  const best = pairs.slice().sort((x, y) => y.score - x.score)[0];
  const worst = pairs.slice().sort((x, y) => x.score - y.score)[0];

  /* 팀 오행 */
  const EL5 = ["목","화","토","금","수"];
  const teamEl = EL5.map(k => ({
    name: k,
    ratio: Math.round(M.reduce((s, m) => s + (m.ratios[k] || 0), 0) / M.length * 10) / 10,
  }));
  const tLack = teamEl.filter(e => e.ratio < 12).map(e => e.name);
  const tOver = teamEl.filter(e => e.ratio >= 30).map(e => e.name);

  const LACK_FIX = {
    목: "새로 벌이고 넓히는 힘이 팀에 없습니다. 분기마다 새 시도를 하나 강제하는 규칙을 만드세요. 아무도 안 하면 아무 일도 시작되지 않는 팀입니다.",
    화: "알리는 힘이 팀에 없습니다. 좋은 것을 만들어도 팔리지 않습니다. 마케팅과 홍보는 외주로라도 반드시 붙이세요.",
    토: "중심을 잡고 버티는 힘이 없습니다. 일은 벌어지는데 쌓이지 않습니다. 운영과 정산을 전담할 사람이 필요합니다.",
    금: "끊고 마무리하는 힘이 없습니다. 결정이 미뤄지고 프로젝트가 끝나지 않습니다. '이 날까지 안 정하면 A로 간다'를 규칙으로 두세요.",
    수: "유연하게 받아들이는 힘이 없습니다. 한 방향으로만 밀다 변화에 늦습니다. 바깥 의견을 듣는 자리를 분기마다 만드세요.",
  };
  const OVER_FIX = {
    목: "벌이는 힘이 넘칩니다. 동시에 굴리는 프로젝트 수에 상한을 두세요.",
    화: "드러내는 힘이 넘칩니다. 말과 약속이 앞서니 대외 발표 전 검수 절차를 넣으세요.",
    토: "버티는 힘이 넘칩니다. 변화를 미루는 쪽으로 작동합니다. 분기마다 버릴 것을 하나 정하세요.",
    금: "끊는 힘이 넘칩니다. 기준이 세서 사람이 지칩니다. 평가 전에 듣는 자리를 먼저 두세요.",
    수: "생각이 넘칩니다. 회의가 길어지고 결정이 늦습니다. 회의마다 결론을 문서로 남기세요.",
  };

  const seatCount = {}; M.forEach(m => seatCount[m.seatKey] = (seatCount[m.seatKey] || 0) + 1);
  const firstCount = {}; M.forEach(m => firstCount[m.firstSeat] = (firstCount[m.firstSeat] || 0) + 1);
  const dupSeats = Object.entries(firstCount).filter(([, c]) => c > 1).map(([k]) => k);
  const missSeats = Object.keys(TEAM_SEAT).filter(k => !seatCount[k]);

  /* 대표 후보 */
  const lead = M.slice().sort((x, y) =>
    ((y.firstSeat === "비겁" ? 30 : 0) - (x.firstSeat === "비겁" ? 30 : 0)) +
    ((y.level === "신강" ? 10 : 0) - (x.level === "신강" ? 10 : 0)) +
    ((y.ratios[y.el] || 0) - (x.ratios[x.el] || 0)))[0];

  /* 시기 — 누가 언제 흔들리나 */
  const nowY = new Date().getFullYear();
  const shaky = [];
  M.forEach(m => {
    const born = m.saju.solar.year;
    (m.saju.daeun.list || []).forEach(d => {
      const y = born + Math.floor(d.startAge);
      if (y >= nowY && y < nowY + 8)
        shaky.push({ year:y, who:m.name, age:Math.floor(d.startAge), gapjaCn:d.gapjaCn, sipsin:d.sipsin });
    });
  });
  shaky.sort((x, y) => x.year - y.year);

  /* ── 섹션 ── */
  const sections = [];

  sections.push(sec("누가 어떤 자리인가",
    `${M.length}명을 다섯 자리에 나눠 앉혔습니다.`,
    [
      ...M.map(m => `**${m.name} → ${m.seat.seat}(${m.seat.cn}).** ${m.seat.t} ${m.seat.use}`),
      missSeats.length
        ? `**비어 있는 자리.** ${missSeats.map(k => `${k}(${TEAM_SEAT[k].seat})`).join(", ")}. 이 자리가 없으면 그 영역의 일이 아무에게도 안 갑니다. 외주로라도 채우거나, 가장 가까운 사람이 겸해야 합니다.`
        : `다섯 자리가 모두 채워져 있습니다. 사람 수 대비 역할 분포가 좋은 팀입니다.`,
      dupSeats.length
        ? `**${dupSeats.map(r => `${M.filter(m => m.firstSeat === r).map(m => m.name).join(", ")}`).join(" / ")} — 원래 성향이 겹칩니다.** 배치표에서는 다른 자리로 나눠 뒀지만 실제로는 같은 일에 손을 대려 합니다. ${TEAM_SEAT[dupSeats[0]].risk}`
        : "",
    ], { tag:"배치" }));

  /* ── 언제 누구에게 가야 하나 — 이 리포트에서 가장 바로 쓰이는 자리 ── */
  const ASK = [
    { k:"식상", when:"새로운 발상이 필요할 때" },
    { k:"재성", when:"둘 중 하나를 골라 돈이 되는 쪽을 정해야 할 때" },
    { k:"관성", when:"일정이 밀리고 기준이 흔들릴 때" },
    { k:"인성", when:"복잡한 것을 정리하고 문서로 남겨야 할 때" },
    { k:"비겁", when:"아무도 결정을 안 해서 일이 멈췄을 때" },
  ];
  /* 채워진 자리만 한 줄씩 쓴다. 빈 자리를 하나씩 쓰면 같은 문장이
     서너 번 반복되어, 정작 읽어야 할 "누구에게" 가 묻힌다. */
  const askHit  = ASK.map(x => ({ x, who: M.find(m => m.seatKey === x.k) })).filter(o => o.who);
  const askMiss = ASK.filter(x => !M.find(m => m.seatKey === x.k));
  const asks = askHit.map(o => `**${o.x.when} → ${egeN2(o.who.name)} 물어보세요.** (${o.who.seat.seat})`);
  if (askMiss.length) asks.push(
    `**${askMiss.map(x => x.when).join(" / ")} —** 이때는 팀 안에 맡을 사람이 없습니다. `
    + `${askMiss.map(x => TEAM_SEAT[x.k].seat).join("·")} 자리가 비어 있어서, 이 상황이 오면 매번 밖에서 찾게 됩니다. `
    + `자주 오는 상황이라면 비워 두지 말고 한 명을 정해 두세요.`);
  sections.push(sec("이럴 때는 누구에게",
    "상황별로 누구를 부르면 되는지만 외워 두셔도 팀이 훨씬 빨리 굴러갑니다.",
    asks.concat([
      `**사람을 맞는 타이밍에 넣어야 팀이 제 성능을 냅니다.** 아무나 붙잡고 묻는 팀과, 누구에게 물을지 아는 팀의 속도 차이는 생각보다 큽니다.`,
    ]), { tag:"호명" }));

  /* ── 한 사람에게 걸린 자리 ── */
  const solo = Object.keys(TEAM_SEAT).filter(k => seatCount[k] === 1);
  sections.push(sec("한 사람에게 걸려 있는 것",
    solo.length ? `자리 ${solo.length}개가 각각 한 사람에게만 걸려 있습니다.`
                : "자리마다 받쳐 줄 사람이 있습니다.",
    [
      ...solo.map(k => {
        const who = M.find(m => m.seatKey === k);
        return `**${TEAM_SEAT[k].seat} — ${who.name} 한 명.** 이분이 빠지는 주에는 그 일이 그대로 멈춥니다.`;
      }),
      solo.length
        ? `**대비책.** 각 자리마다 '두 번째 사람'을 정해 두세요. 잘하지 못해도 됩니다. 빠진 주에 막지만 않으면 됩니다. 한 사람이 빠질 때 멈추는 팀은 그 사람도 쉬지 못합니다.`
        : "역할이 겹쳐 있어 한 사람이 빠져도 굴러갑니다. 대신 책임이 흐려지기 쉬우니 자리마다 '최종' 한 명은 정해 두세요.",
    ], { tag:"의존" }));

  sections.push(sec("회의를 어떻게 돌릴 것인가",
    "자리마다 회의에서 맡으면 좋은 역할이 다릅니다.",
    [
      ...M.map(m => `**${m.name}.** ${m.seat.meeting}`),
      `**순서.** ${(() => {
        const o = ["인성","식상","비겁","관성","재성"].filter(k => seatCount[k]);
        const who = o.map(k => M.find(m => m.seatKey === k)).filter(Boolean);
        return who.length >= 2
          ? `${who.map(m => m.name).join(" → ")} 순으로 말하게 하면 회의가 가장 짧아집니다. 준비한 사람이 먼저 열고, 결정하는 사람이 중간에 서고, 숫자가 마지막에 옵니다.`
          : "사람이 적으니 순서보다 '한 사람이 말하는 동안 끊지 않기' 한 가지만 지키면 됩니다.";
      })()}`,
      M.filter(m => m.level === "신강").length >= Math.ceil(M.length * 0.6)
        ? `**${M.filter(m => m.level === "신강").length}명이 신강입니다.** 모두 자기 방식이 분명해 회의가 길어집니다. 안건마다 최종 결정자를 미리 정해두고 들어가세요.`
        : "",
    ],
    { script: "회의 끝에 이 세 줄만 남기면 됩니다. “오늘 정한 것 / 누가 언제까지 / 다음에 다시 볼 것.” 말로만 끝낸 합의는 다음 주에 서로 다르게 기억합니다.",
      tag:"운영" }));

  sections.push(sec("결정은 누가 어떻게",
    `최종 결정은 ${iGa(lead.name)} 맡는 쪽이 맞습니다.`,
    [
      `**${lead.name}.** ${lead.work.key}이고 ${lead.level} 구성이라, 방향을 끌고 가는 자리에 두면 팀이 덜 흔들립니다.`,
      `**지분보다 역할을 먼저 나누세요.** 이 조합에서 같은 일을 둘이 같이 보면 ${waGwa(worst.a)} ${worst.b} 자리에서 가장 먼저 터집니다(${worst.score}점).`,
      `**반대로 ${waGwa(best.a)} ${eunN(best.b)} ${best.score}점으로 가장 잘 맞습니다.** 중요한 건은 이 둘을 한 조로 묶으세요.`,
      `**결정 규칙 한 줄.** 안건마다 '정하는 사람 한 명'을 적어 두고, 나머지는 의견만 냅니다. 합의로 정하려 들면 ${M.length}명짜리 팀은 아무것도 못 정합니다.`,
    ],
    { script: "안건을 올릴 때 제목 옆에 괄호로 적으세요. “가격 개편(결정: " + lead.name + ")”. 누가 정하는지가 먼저 보이면 회의가 절반으로 줍니다.",
      tag:"결정" }));

  sections.push(sec("돈과 지분",
    "이 조합에서 가장 크게 터질 수 있는 자리입니다.",
    [
      `**시작할 때 끝을 적으세요.** 정산 주기, 지분 비율, 그만둘 때의 처리. 이 세 가지를 종이 한 장에 적고 전원이 사인하는 것이 이 팀의 가장 큰 보험입니다.`,
      pairs.some(p => p.bToA === "겁재" || p.aToB === "겁재")
        ? `**특히 조심할 짝이 있습니다.** ${pairs.filter(p => p.bToA === "겁재" || p.aToB === "겁재").map(p => `${p.a}–${p.b}`).join(", ")}. 서로 겁재로 걸리는 자리라 돈이 얽히면 가장 먼저 금이 갑니다.`
        : `서로 겁재로 걸리는 짝은 없습니다. 돈 문제에서 구조적으로 불리한 조합은 아닙니다.`,
      seatCount["재성"]
        ? `숫자를 보는 자리(${M.find(m => m.seatKey === "재성").name})가 있으니 정산을 맡기세요.`
        : `**숫자를 보는 자리가 비었습니다.** 벌이보다 쓰임이 커지기 쉽습니다. 정산만이라도 밖에 맡기는 편이 안전합니다.`,
    ],
    { script: "지분 이야기를 꺼내기 어려우면 이렇게 시작하세요. “지금 사이 좋을 때 정해 두는 게 나중에 서로 편할 것 같아요. 종이에 세 줄만 적어 둘까요?”",
      tag:"돈" }));

  sections.push(sec("언제 흔들리나",
    shaky.length ? `앞으로 8년 안에 ${shaky.length}번, 구성원의 10년 운이 바뀝니다.`
                 : "앞으로 8년 안에 10년 운이 바뀌는 사람은 없습니다.",
    [
      shaky.length
        ? shaky.map(d => `**${d.year}년 — ${d.who}** (${d.age}세, ${d.gapjaCn} ${d.sipsin}). 이 사람의 판이 바뀌는 해입니다.`).join("\n")
        : "구성원 모두 당분간 같은 흐름 안에 있습니다. 팀 바깥 변수가 더 크게 작용합니다.",
      shaky.length
        ? `한 사람의 10년이 바뀌면 그 사람의 속도와 우선순위가 같이 바뀝니다. 팀을 떠나거나 역할을 바꾸고 싶어지는 때도 대개 이 구간입니다. 미리 알고 있으면 배신이 아니라 주기로 보입니다.`
        : "",
      `**이 해 앞뒤로 할 것.** 큰 투자나 새 사업을 겹치지 마시고, 대신 그 사람과 한 번 길게 이야기하는 자리를 만드세요.`,
    ], { tag:"시기" }));

  /* ── 갈등에 이름 붙이기 ── */
  const CONFLICT_LABEL = {
    "비겁-비겁":["주도권 다툼","둘 다 물러서지 않아 같은 안건이 회의마다 돌아옵니다."],
    "식상-관성":["새로 바꾸기 vs 지키기","한쪽은 틀을 깨려 하고 한쪽은 틀을 지키려 합니다. 둘 다 옳습니다."],
    "관성-식상":["지키기 vs 새로 바꾸기","한쪽은 절차를 요구하고 한쪽은 속도를 요구합니다."],
    "재성-인성":["숫자 vs 준비","한쪽은 당장의 매출을, 한쪽은 제대로 된 준비를 봅니다."],
    "인성-재성":["준비 vs 숫자","한쪽은 시간을 더 쓰려 하고 한쪽은 지금 팔자고 합니다."],
    "식상-재성":["벌이기 vs 거두기","만드는 속도와 파는 속도가 안 맞습니다."],
    "재성-식상":["거두기 vs 벌이기","파는 쪽은 재고가 걱정이고 만드는 쪽은 다음 걸 벌이고 싶어 합니다."],
    "관성-비겁":["규칙 vs 자율","한쪽은 절차를 세우고 한쪽은 그 절차를 답답해합니다."],
    "비겁-관성":["자율 vs 규칙","한쪽은 알아서 하려 하고 한쪽은 보고를 원합니다."],
    "인성-식상":["정리 vs 분출","한쪽은 정리될 때까지 안 꺼내고 한쪽은 일단 꺼내 놓습니다."],
    "식상-인성":["분출 vs 정리","한쪽은 빨리 보여주려 하고 한쪽은 완성될 때까지 숨깁니다."],
  };
  const labels = pairs.map(p => {
    const k = `${p.bToARole || C_ROLE[p.bToA]}-${p.aToBRole || C_ROLE[p.aToB]}`;
    const L = CONFLICT_LABEL[k] || CONFLICT_LABEL[`${C_ROLE[p.aToB]}-${C_ROLE[p.bToA]}`];
    return L ? { pair:`${p.a}–${p.b}`, name:L[0], t:L[1], score:p.score } : null;
  }).filter(Boolean).sort((x, y) => x.score - y.score).slice(0, 3);

  if (labels.length) sections.push(sec("이 팀에서 반복될 다툼",
    "싸움에 이름을 붙여 두면, 다음에 같은 일이 생겼을 때 사람 탓을 덜 하게 됩니다.",
    labels.map(L => `**「${L.name}」 — ${L.pair} (${L.score}점).** ${L.t}`)
      .concat([`이름을 붙이는 이유는 하나입니다. \u201C또 그 문제네\u201D라고 말할 수 있게 되면, \u201C저 사람이 문제야\u201D에서 벗어납니다.`,
               `**조기 신호.** 같은 안건이 두 번째 회의에 다시 올라오면 이미 시작된 겁니다. 그때 사람을 바꾸지 말고 결정 방식을 바꾸세요.`]),
    { tag:"갈등" }));

  /* ── 함께 이야기해 볼 질문 ── */
  sections.push(sec("같이 이야기해 볼 질문",
    "이 결과지를 띄워 놓고 30분만 이야기해 보세요.",
    [
      `**1.** 이 배치표를 보고, 지금 실제로 맡고 있는 일과 가장 다른 사람은 누구인가요?`,
      `**2.** 비어 있는 자리(${missSeats.length ? missSeats.map(k => TEAM_SEAT[k].seat).join(", ") : "없음"})는 지금 누가 떠안고 있나요?`,
      `**3.** 지난 세 달 동안 가장 자주 멈춘 지점은 어디였나요? 그게 위의 다툼 이름 중 하나와 겹치나요?`,
      `**4.** 회의에서 가장 말을 많이 하는 사람과 가장 적게 하는 사람은 누구인가요? 적게 하는 쪽은 왜 그런가요?`,
      `**5.** 내가 빠지면 가장 먼저 멈출 일은 무엇인가요? 그걸 누구에게 알려 두어야 할까요?`,
    ], { tag:"질문" }));

  /* ── 액션 스텝 ── */
  sections.push(sec("이번 주에 할 것",
    "읽고 덮으면 아무것도 바뀌지 않습니다. 세 가지만 하세요.",
    [
      `**팀이 할 것 1.** 위 배치표를 그대로 옮겨 적고, 자리마다 '최종 결정자' 한 명씩을 이름으로 적어 공유하세요.`,
      `**팀이 할 것 2.** ${missSeats.length ? `비어 있는 ${missSeats.map(k => TEAM_SEAT[k].seat).join("·")} 자리를 누가 겸할지, 아니면 밖에 맡길지를 이번 주에 정하세요.` : "다섯 자리가 다 찼으니, 각 자리의 '두 번째 사람'을 정해 두세요."}`,
      `**팀이 할 것 3.** 정산 주기와 그만둘 때의 처리를 한 장으로 적고 전원이 읽으세요. 사이 좋을 때 쓰는 문서입니다.`,
      `**각자 할 것.** 자기 자리의 위험(${M.map(m => `${m.name}: ${m.seat.risk.split(".")[0]}`).join(" / ")})을 하나씩 읽고, 이번 달에 그것 하나만 조심해 보세요.`,
    ], { tag:"실행" }));

  /* 항목 점수 */
  const clampT = (n) => Math.max(12, Math.min(97, Math.round(n)));
  const fields = [
    { key:"drive", name:"추진력", cn:"推", score: clampT(avg + (seatCount["비겁"] || 0) * 7 - 4),
      text: seatCount["비겁"]
        ? `${iGa(M.find(m => m.seatKey === "비겁").name)} 끌고 가는 자리라 일이 시작은 됩니다.`
        : "끌고 가는 자리가 비어 있습니다. 좋은 생각은 많은데 시작이 안 되는 팀입니다." },
    { key:"make", name:"만드는 힘", cn:"創", score: clampT(avg + (seatCount["식상"] || 0) * 8 - 4),
      text: seatCount["식상"] ? "결과물을 뽑아내는 사람이 있습니다. 기획과 제작을 안에서 해결할 수 있습니다."
                              : "만드는 자리가 약합니다. 기획과 제작은 외부에 맡기는 편이 빠릅니다." },
    { key:"money", name:"돈 만드는 힘", cn:"財", score: clampT(avg + (seatCount["재성"] || 0) * 9 - 4),
      text: seatCount["재성"] ? "수익을 숫자로 보는 사람이 있습니다. 매출 설계를 이 사람에게 맡기세요."
                              : "돈을 보는 자리가 비었습니다. 벌이보다 쓰임이 커지기 쉽습니다." },
    { key:"run", name:"버티는 힘", cn:"官", score: clampT(avg + ((seatCount["관성"]||0) + (seatCount["인성"]||0)) * 6 - 4),
      text: ((seatCount["관성"]||0) + (seatCount["인성"]||0)) ? "기준을 세우고 굴러가게 만드는 사람이 있습니다."
                              : "관리하는 자리가 비었습니다. 1년을 넘기기 어려운 구조입니다." },
    { key:"talk", name:"호흡", cn:"和",
      score: clampT(avg + pairs.filter(p => p.score < 45).length * -9 + pairs.filter(p => p.score >= 72).length * 6),
      text: (() => {
        const hard = pairs.filter(p => p.score < 45);
        if (hard.length) return `${hard.map(p => `${p.a}–${p.b}`).join(", ")} 자리에서 부딪힙니다. 사람 문제가 아니라 배치 문제라, 역할과 보고선을 떼어놓으면 많이 풀립니다.`;
        if (pairs.some(p => p.score < 54)) return "서로 결이 다른 자리가 있어 운영 규칙이 필요합니다. 결정 방식을 문서로 정해 두세요.";
        return "큰 충돌 없이 말이 통하는 조합입니다.";
      })() },
    { key:"long", name:"오래 갈 힘", cn:"久",
      score: clampT(avg + tLack.length * -6 + (missSeats.length ? -5 : 6)),
      text: tLack.length ? `팀에 ${tLack.map(el).join("·")} 기운이 비어 있어 그 영역에서 반복해서 막힙니다.`
                         : "다섯 기운이 고르게 모여 있어 길게 가기 좋은 조합입니다." },
  ].map(f => ({ ...f, grade: T_GRADE(f.score) }));

  const balance = [
    ...tOver.map(e => `**${el(e)} 과다.** ${OVER_FIX[e]}`),
    ...tLack.map(e => `**${el(e)} 부족.** ${LACK_FIX[e]}`),
  ];

  return polish({
    kind: "team",
    count: M.length,
    avg, grade: T_GRADE(avg),
    headline: `${M.length}명이 모이면 ${T_GRADE(avg)}입니다.`,
    members: M.map(m => ({
      name: m.name, gapja: m.gapja, gapjaCn: m.gapjaCn, el: m.el,
      level: m.level, yongsin: m.yongsin, type: m.type.code, typeName: m.type.name,
      workMode: m.work.key,
      seat: m.seat.seat, seatCn: m.seat.cn, seatT: m.seat.t, seatUse: m.seat.use,
      seatKey: m.seatKey, firstSeat: m.firstSeat,
    })),
    pairs, best, worst, fields, sections,
    teamElements: teamEl, lack: tLack, over: tOver, balance,
    balanceNote: (!tOver.length && !tLack.length)
      ? "팀 전체 오행이 고르게 모였습니다. 한 사람의 약점을 다른 사람이 메우는 구조라, 사람을 늘리기보다 지금 조합을 오래 유지하는 쪽이 유리합니다." : "",
    seatCount, dupSeats, missSeats, lead: lead.name, shaky,
    closing: avg >= 64
      ? "함께 하기 좋은 조합입니다. 다만 궁합이 좋은 팀일수록 규칙 없이 시작해서 나중에 돈 문제로 갈라집니다. 잘 맞는 지금이 문서를 쓸 때입니다."
      : avg >= 52
      ? "운영으로 충분히 굴러가는 조합입니다. 사람을 바꾸는 것보다 역할을 정확히 나누는 쪽이 훨씬 효과가 큽니다."
      : "구조를 손봐야 하는 조합입니다. 사이가 나쁘다는 뜻이 아니라, 지금 배치로는 서로의 힘이 부딪힌다는 뜻입니다. 역할을 분리하고 결정선을 하나로 모으면 달라집니다.",
    disclaimer: "관계사주는 타고난 결이 어떻게 맞물리는지를 보는 것이지, 누가 일을 잘하고 못하는지를 가리는 것이 아닙니다. 점수가 낮은 짝도 배치를 바꾸면 가장 좋은 조합이 되는 경우가 많습니다.",
  });
}
