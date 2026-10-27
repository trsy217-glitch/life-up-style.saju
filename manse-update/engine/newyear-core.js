/* ═══════════════════════════════════════════════════════════
 *  신년운세 — 계산만. 문장은 newyear-copy.js 에 있다.
 *
 *  사주에서 "한 해"는 1월 1일이 아니라 입춘에 바뀐다.
 *  2027년 신년운세는 2027-02-04 입춘부터 2028-02-04 입춘까지다.
 *  1월에 이 앱을 보는 사람은 아직 작년 간지 안에 있다는 뜻이라,
 *  그 사실을 숨기지 않고 화면에 적는다.
 * ═══════════════════════════════════════════════════════════ */

import { computeSaju } from "./saju.js";
import { crossSipsin, branchRelation, C_ROLE,
         CC_GAN, CC_JI, CC_GAN_CN, CC_JI_CN, CC_GAN_EL, CC_JI_EL } from "./compat-core.js";

/* 상생상극 — 이 파일 안에서만 쓴다 */
const NY_GEN = { 목:"화", 화:"토", 토:"금", 금:"수", 수:"목" };
const NY_CTL = { 목:"토", 화:"금", 토:"수", 금:"목", 수:"화" };

/** 그 해의 간지. 입춘 기준이므로 달력 연도와 한 해가 어긋날 수 있다 */
export function yearGanji(year) {
  const si = ((year - 4) % 10 + 10) % 10;
  const bi = ((year - 4) % 12 + 12) % 12;
  return { stem: CC_GAN[si], branch: CC_JI[bi],
           stemCn: CC_GAN_CN[si], branchCn: CC_JI_CN[bi],
           gapja: CC_GAN[si] + CC_JI[bi], gapjaCn: CC_GAN_CN[si] + CC_JI_CN[bi],
           stemEl: CC_GAN_EL[CC_GAN[si]], branchEl: CC_JI_EL[CC_JI[bi]] };
}

/** 지지 → 그 지지가 일간에게 되는 십신 (본기만 본다) */
function branchSipsin(dayStem, branch) {
  const el = CC_JI_EL[branch];
  /* 본기를 대표하는 천간을 골라 천간 십신 함수를 그대로 쓴다.
     음양은 지지의 음양을 따른다 — 자·인·진·오·신·술이 양이다. */
  const yang = ["자", "인", "진", "오", "신", "술"].indexOf(branch) >= 0;
  const stem = CC_GAN.find(g => CC_GAN_EL[g] === el && (CC_GAN.indexOf(g) % 2 === 0) === yang);
  return crossSipsin(dayStem, stem);
}

/* ───────── 열두 달 ─────────
   월주는 절기로 나뉜다. 각 달의 절입 시각과 간지를 실제로 계산해서 쓴다.
   절입이 4~8일 사이에 오므로 20일을 찍으면 항상 그 달 안이다. */
export function monthsOf(year) {
  const out = [];
  for (let k = 0; k < 12; k++) {
    const cy = year + (k >= 11 ? 1 : 0);          // 寅월(2월)부터 세어 丑월은 이듬해 1월
    const cm = ((k + 1) % 12) + 1;                 // k=0 → 2월 … k=10 → 12월, k=11 → 1월
    const s = computeSaju({ year: cy, month: cm, day: 20, hour: 12, minute: 0,
      gender: "남", calendar: "양", city: "서울", trueSolarTime: false, dayBoundary: "23:00" });
    out.push({
      no: k + 1, calYear: cy, calMonth: cm,
      stem: s.pillars.month.stem, branch: s.pillars.month.branch,
      gapja: s.pillars.month.gapja, gapjaCn: s.pillars.month.gapjaCn,
      stemEl: CC_GAN_EL[s.pillars.month.stem], branchEl: CC_JI_EL[s.pillars.month.branch],
      termName: s.term.current, termAt: s.term.currentAt,
    });
  }
  return out;
}

/* ───────── 한 해의 기조 ─────────
   용신(필요한 기운)이 들어오는 해인가, 기신(부담스러운 기운)이 들어오는 해인가. */
function tideOf(el, yongsin, gisin) {
  if (el === yongsin) return { key: "순풍", n: 2 };
  if (el === NY_GEN[yongsin]) return { key: "순한바람", n: 1 };   // 용신이 낳는 기운
  if (el === gisin) return { key: "역풍", n: -2 };
  if (el === NY_CTL[yongsin]) return { key: "맞바람", n: -1 };    // 용신을 누르는 기운
  return { key: "무풍", n: 0 };
}

/** 세운 지지가 원국의 네 지지와 어떤 관계인지 — 어느 자리가 흔들리는지 */
export function palaceHits(saju, branch) {
  const P = ["year", "month", "day", "hour"];
  const NAME = { year: "년지", month: "월지", day: "일지", hour: "시지" };
  const out = [];
  P.forEach(k => {
    const p = saju.pillars[k];
    if (!p) return;
    const r = branchRelation(branch, p.branch);
    if (r.key === "무관" || r.key === "동지") return;
    out.push({ palace: k, palaceName: NAME[k], branch: p.branch, branchCn: p.branchCn,
               rel: r.key, strength: r.strength || 0 });
  });
  return out;
}

/** 올해 대운이 바뀌는가 — 바뀌는 해는 판 자체가 달라진다 */
export function daeunAt(saju, year) {
  const list = (saju.daeun && saju.daeun.list) || [];
  const birthY = saju.solar ? saju.solar.year : null;
  if (!list.length || !birthY) return null;
  const age = year - birthY;                       // 세는나이에 가깝게 — 대운은 이 기준으로 돈다
  let cur = null, next = null;
  for (const d of list) {
    if (d.startAge <= age) cur = d;
    else if (!next) next = d;
  }
  const changing = cur && (age - cur.startAge === 0);
  return { age, cur, next, changing: !!changing,
           yearsToNext: next ? next.startAge - age : null };
}

/* ═══ 본 계산 ═══ */
export function newYearCore(saju, year) {
  const day = saju.pillars.day.stem;
  const Y = yearGanji(year);
  const str = saju.strengthCache || null;         // 없으면 아래에서 넘겨받는다
  return { day, Y, str };
}

/**
 * @param saju   computeSaju 결과
 * @param year   볼 해 (입춘 기준)
 * @param st     analyzeStrength(saju) 결과 — yongsin / gisin / level
 */
export function buildYearCore(saju, year, st) {
  const day = saju.pillars.day.stem;
  const Y = yearGanji(year);
  const yongsin = st.yongsin, gisin = st.gisin;

  const sipsinStem   = crossSipsin(day, Y.stem);
  const sipsinBranch = branchSipsin(day, Y.branch);
  const roleStem     = C_ROLE[sipsinStem]   || "비겁";
  const roleBranch   = C_ROLE[sipsinBranch] || "비겁";

  const tideStem   = tideOf(Y.stemEl,   yongsin, gisin);
  const tideBranch = tideOf(Y.branchEl, yongsin, gisin);
  const tide = tideStem.n + tideBranch.n;          // -4 ~ +4

  const hits = palaceHits(saju, Y.branch);
  const hard = hits.filter(h => h.rel === "충" || h.rel === "형" || h.rel === "해");
  const soft = hits.filter(h => h.rel === "육합" || h.rel === "삼합");

  const dn = daeunAt(saju, year);

  /* 한 해 점수 — 기조(바람)와 흔들림(충형해)과 붙음(합)을 합친다.
     50을 가운데 두고 ±를 얹는다. 12~95 밖으로는 나가지 않게 막는다. */
  let score = 50 + tide * 9 - hard.length * 6 + soft.length * 5;
  if (dn && dn.changing) score -= 3;               // 대운 바뀌는 해는 흔들린다
  score = Math.max(12, Math.min(95, Math.round(score)));

  /* ── 열두 달 ── */
  const months = monthsOf(year).map(m => {
    const mt = tideOf(m.branchEl, yongsin, gisin).n + tideOf(m.stemEl, yongsin, gisin).n;
    const mr = branchRelation(m.branch, saju.pillars.day.branch);
    const clash = (mr.key === "충" || mr.key === "형" || mr.key === "해");
    const bond  = (mr.key === "육합" || mr.key === "삼합");
    const yr    = branchRelation(m.branch, Y.branch);
    const yClash = (yr.key === "충" || yr.key === "형");
    let s = 50 + mt * 8 + (bond ? 9 : 0) - (clash ? 11 : 0) - (yClash ? 7 : 0);
    s = Math.max(14, Math.min(94, Math.round(s)));
    return { ...m, score: s, sipsin: crossSipsin(day, m.stem),
             role: C_ROLE[crossSipsin(day, m.stem)] || "비겁",
             dayRel: mr.key, yearRel: yr.key, clash, bond };
  });

  const sorted = months.slice().sort((a, b) => b.score - a.score);
  const best = sorted.slice(0, 2);
  const worst = sorted.slice(-2).reverse();

  /* 작년과의 대비 — 재방문의 고리다. 작년을 봤던 사람에게는 비교가 가장 와닿는다 */
  const prev = (function () {
    const P = yearGanji(year - 1);
    const t = tideOf(P.stemEl, yongsin, gisin).n + tideOf(P.branchEl, yongsin, gisin).n;
    const h = palaceHits(saju, P.branch).filter(x => x.rel === "충" || x.rel === "형" || x.rel === "해");
    let s = 50 + t * 9 - h.length * 6;
    return { ...P, score: Math.max(12, Math.min(95, Math.round(s))),
             sipsin: crossSipsin(day, P.stem), role: C_ROLE[crossSipsin(day, P.stem)] || "비겁" };
  })();

  return {
    year, Y, day, dayCn: saju.pillars.day.stemCn,
    yongsin, gisin, level: st.level,
    sipsinStem, sipsinBranch, roleStem, roleBranch,
    tideStem, tideBranch, tide, score,
    hits, hard, soft, daeun: dn,
    months, best, worst, prev,
    delta: score - prev.score,
    /* 입춘이 언제인지 — "1월은 아직 작년입니다" 를 말하려면 필요하다 */
    ipchun: months[0] ? months[0].termAt : null,
  };
}
