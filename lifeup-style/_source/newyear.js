/* ═══════════════════════════════════════════════════════════
 *  신년운세 결과지 조립
 *
 *  토정비결과 다른 점 하나: 모든 꼭지가 "그래서 뭘 하라"로 끝난다.
 *  예측만 주면 읽고 덮지만, 처방을 주면 달력에 적게 된다.
 * ═══════════════════════════════════════════════════════════ */

import { analyzeStrength } from "./report.js";
import { examplesFor } from "./examples.js";
import { buildYearCore } from "./newyear-core.js";
import { YEAR_NAME, TIDE_LINE, PALACE, PALACE_HIT, MONTH_ROLE,
         FIELD_YEAR, TASK, RISK_HOW, IPCHUN_NOTE } from "./newyear-copy.js";

/* 받침 보고 조사 고르기.
   화면에는 한자(丁·未)를 쓰지만 조사는 한글 독음(정·미)으로 정해야 한다.
   한자에는 받침이 없으니 글자만 보면 "未이" 같은 말이 나온다.
   그래서 보여줄 글자와 읽는 글자를 따로 받는다. */
function nyJong(w) {
  const m = String(w).match(/[가-힣](?![\s\S]*[가-힣])/);
  return m ? (m[0].charCodeAt(0) - 0xAC00) % 28 !== 0 : false;
}
const nEun = (show, read) => show + (nyJong(read == null ? show : read) ? "은" : "는");
const nI   = (show, read) => show + (nyJong(read == null ? show : read) ? "이" : "가");

function sec(title, lead, body, opts = {}) {
  const lines = [].concat(body).filter(x => typeof x === "string" && x.trim());
  return { title, lead: lead || "", body: lines,
           script: opts.script || null,
           examples: examplesFor([lead || ""].concat(lines, opts.script || []), 2),
           tag: opts.tag || "" };
}

const MON = (m) => `${m.calMonth}월`;
const MONL = (m) => `${m.calYear}년 ${m.calMonth}월`;

export function buildNewYear(saju, year, opts = {}) {
  const name = opts.name || "";
  const st = analyzeStrength(saju);
  const C = buildYearCore(saju, year, st);

  /* 순풍/역풍으로 해의 이름을 고른다. 0이면 점수로 가른다 */
  const dirKey = C.tide > 0 ? "순" : C.tide < 0 ? "역" : (C.score >= 50 ? "순" : "역");
  const pack = (YEAR_NAME[C.sipsinStem] || YEAR_NAME["비견"])[dirKey];

  const sections = [];

  /* ── 1. 올해는 어떤 해인가 ── */
  sections.push(sec(
    `${year}년은 어떤 해인가`,
    `${year}년의 간지는 ${C.Y.gapjaCn}(${C.Y.gapja})입니다.`,
    [
      `당신의 일간은 ${C.dayCn}(${C.day})입니다. `
        + `올해 들어오는 ${nEun(C.Y.stemCn, C.Y.stem)} 당신에게 **${C.sipsinStem}**, `
        + `아래 글자 ${nEun(C.Y.branchCn, C.Y.branch)} **${C.sipsinBranch}**의 자리입니다.`,
      pack.t,
      TIDE_LINE[String(Math.max(-4, Math.min(4, C.tide)))] || TIDE_LINE["0"],
      C.daeun && C.daeun.changing
        ? `**올해는 10년 운(대운)이 바뀌는 해입니다.** ${C.daeun.cur ? C.daeun.cur.gapjaCn + " 구간으로 넘어갑니다. " : ""}판 자체가 바뀌는 해라, 작년까지 통하던 방식이 안 먹힐 수 있습니다. 바뀌는 첫 1~2년은 원래 어수선합니다.`
        : (C.daeun && C.daeun.yearsToNext != null && C.daeun.yearsToNext <= 2
            ? `${C.daeun.yearsToNext}년 뒤에 10년 운이 바뀝니다. 지금 구간에서 마무리할 것은 올해와 내년에 끝내 두세요.`
            : ""),
    ], { tag:"총평" }));

  /* ── 2. 작년과 무엇이 다른가 ── */
  sections.push(sec(
    `작년과 무엇이 다른가`,
    `${year - 1}년은 ${C.prev.gapjaCn}, ${year}년은 ${C.Y.gapjaCn}입니다.`,
    [
      C.delta >= 8
        ? `**작년보다 올라갑니다.** 작년에 막혀 있던 쪽이 올해 풀립니다. 작년에 포기한 것이 있다면 올해 다시 꺼내 보셔도 됩니다.`
        : C.delta <= -8
        ? `**작년보다 조이는 해입니다.** 작년에 되던 방식이 올해는 품이 더 듭니다. 같은 성과를 내려면 더 들여야 한다고 보시면 맞습니다.`
        : `**작년과 큰 차이는 없습니다.** 흐름이 이어집니다. 작년에 시작한 것을 올해 마무리하기 좋습니다.`,
      `작년은 ${C.prev.sipsin}의 해였고 올해는 ${C.sipsinStem}의 해입니다. `
        + (C.prev.role === C.roleStem
            ? `결이 이어지는 구간이라, 작년에 하던 것을 그대로 더 깊이 가져가면 됩니다.`
            : `결이 바뀝니다. 작년에 잘 통하던 방식을 올해도 그대로 쓰면 어긋나기 쉽습니다.`),
      `**올해 끝에 확인할 것.** 지금 이 글에서 가장 걸리는 한 줄을 적어 두시고, 올해 12월에 다시 꺼내 보세요. 맞았는지 틀렸는지 아는 것이 내년 운세를 훨씬 쓸모 있게 만듭니다.`,
    ], { tag:"비교" }));

  /* ── 3. 어느 자리가 흔들리나 ── */
  const hitLines = [];
  C.hits.forEach(h => {
    const P = PALACE[h.palace], H = PALACE_HIT[h.rel];
    if (!P || !H) return;
    hitLines.push(H.t(P));
    hitLines.push(H.how);
  });
  sections.push(sec(
    "어느 자리가 흔들리나",
    C.hits.length
      ? `올해 지지 ${nI(C.Y.branchCn, C.Y.branch)} 당신의 `
        + `${C.hits.map(h => PALACE[h.palace].name).join("·")}와 맞물립니다.`
      : "올해는 네 기둥 중 어디와도 세게 부딪히지 않습니다.",
    hitLines.length ? hitLines : [
      "크게 흔들리는 자리가 없다는 건, 올해 일어나는 일이 대부분 **내가 만든 일**이라는 뜻입니다.",
      "밖에서 밀어주지도 흔들지도 않으니 결과가 운보다 준비에 달려 있습니다. 올해는 계획표가 운세보다 중요합니다.",
    ], { tag:"사건" }));

  /* ── 4. 열두 달 흐름 ──
     달 이름은 달력 순서로 적는다. 점수 순으로 적으면 "3월·2월" 처럼 거꾸로 나온다. */
  const byMonth = (a, b) => (a.calYear - b.calYear) || (a.calMonth - b.calMonth);
  const bestS  = C.best.slice().sort(byMonth);
  const worstS = C.worst.slice().sort(byMonth);
  const bestL  = bestS.map(MON).join("·");
  const worstL = worstS.map(MON).join("·");
  const b0 = C.best[0], w0 = C.worst[0];
  const bRole = MONTH_ROLE[b0.role] || MONTH_ROLE["비겁"];
  const wRole = MONTH_ROLE[w0.role] || MONTH_ROLE["비겁"];
  sections.push(sec(
    "열두 달 가운데 언제인가",
    `가장 열리는 달은 ${bestL}, 가장 조이는 달은 ${worstL}입니다.`,
    [
      `**${MONL(b0)} — 올해 가장 열리는 달.** 결로 보면 ${bRole.label}입니다. ${bRole.do}`,
      `**${MONL(w0)} — 올해 가장 조이는 달.** `
        + (w0.clash
            ? `당신의 일지와 ${w0.dayRel}이 걸려 몸과 가까운 사람 쪽에서 먼저 신호가 옵니다. `
            : `기운이 반대로 흘러 같은 일에 품이 더 듭니다. `)
        + wRole.careful,
    ].concat(RISK_HOW), { tag:"시기" }));

  /* ── 5. 네 갈래 ── */
  ["돈", "일", "사람", "몸"].forEach(f => {
    const byStem = (FIELD_YEAR[f] || {})[C.roleStem] || "";
    const byBranch = (FIELD_YEAR[f] || {})[C.roleBranch] || "";
    const lines = [byStem];
    if (C.roleBranch !== C.roleStem && byBranch) lines.push(`여기에 더해, ${byBranch}`);
    sections.push(sec(`올해의 ${f}`, "", lines, { tag:f }));
  });

  /* ── 6. 올해의 과제 — 바람 방향까지 보고 고른다 ── */
  const task = (TASK[C.roleStem] || TASK["비겁"])[dirKey];
  sections.push(sec(
    "올해 할 한 가지",
    "열 가지를 적으면 하나도 안 합니다. 올해는 이것 하나만 보세요.",
    [
      `**${task.t}**`,
      task.why,
      `${name ? name + "님, " : ""}올해의 ${pack.ch} — ${pack.name}는 결국 **${pack.verb} 해**입니다. `
        + `12월에 이 한 가지를 했는지만 보시면 올해를 잘 쓴 건지 알 수 있습니다.`,
    ], { tag:"과제" }));

  /* ── 7. 달력에 지금 적을 것 ── */
  sections.push(sec(
    "지금 달력에 적을 것",
    "읽고 덮으면 아무것도 바뀌지 않습니다. 세 줄만 옮겨 적으세요.",
    [
      `**${MONL(b0)}** — 미뤄 둔 결정과 부탁을 이 달에 몰아 둔다.`,
      `**${MONL(w0)}** — 새로 벌이지 않는다. 이 달에 잡힌 큰 건이 있으면 앞뒤로 옮길 수 있는지 본다.`,
      `**${year}년 12월** — 올해의 과제를 했는지 확인한다. → “${task.t}”`,
    ], { tag:"달력" }));

  return {
    kind: "newyear",
    year, name,
    ganji: C.Y, day: C.day, dayCn: C.dayCn,
    char: pack.ch, charName: pack.name, charText: pack.t, verb: pack.verb,
    score: C.score, prevScore: C.prev.score, delta: C.delta,
    tide: C.tide, dir: dirKey,
    sipsinStem: C.sipsinStem, sipsinBranch: C.sipsinBranch,
    roleStem: C.roleStem, roleBranch: C.roleBranch,
    yongsin: C.yongsin, gisin: C.gisin, level: C.level,
    hits: C.hits, daeun: C.daeun,
    months: C.months, best: C.best, worst: C.worst, prev: C.prev,
    ipchun: C.ipchun,
    ipchunNote: IPCHUN_NOTE(year, C.ipchun),
    task,
    sections,
    /* 캡처해서 남에게 보여 줄 한 조각 */
    share: {
      char: pack.ch, name: pack.name, year,
      line: `${year}년, ${name ? name + "님은 " : ""}${pack.name}`,
      sub: pack.verb + " 해",
      best: bestS.map(MON).join("·"), worst: worstS.map(MON).join("·"),
      ganji: C.Y.gapjaCn,
    },
  };
}
