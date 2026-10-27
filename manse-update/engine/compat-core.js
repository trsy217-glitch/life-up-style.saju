/* ═══════════════════════════════════════════════════════════
 *  compat-core.js — 두 사람 사이를 재는 축
 *
 *  궁합 결과지가 얇았던 이유는 점수만 있고 '무엇이 어떻게 어긋나는지'가
 *  없었기 때문이다. 여기서는 두 명식을 겹쳐 놓고 쓸 수 있는 모든 축을 뽑는다.
 *  문장은 compat.js 에서 만들고, 이 파일은 숫자와 관계만 낸다.
 * ═══════════════════════════════════════════════════════════ */

import { sipsin, seun } from "./saju.js";
import { analyzeStrength, commStyle, personaType, dominantSipsin,
         workMode, exactAge, ageInYear } from "./report.js";

const CC_GAN = ["갑","을","병","정","무","기","경","신","임","계"];
const CC_JI  = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const CC_GAN_CN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const CC_JI_CN  = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const CC_GAN_EL = { 갑:"목",을:"목",병:"화",정:"화",무:"토",기:"토",경:"금",신:"금",임:"수",계:"수" };
const CC_JI_EL  = { 자:"수",축:"토",인:"목",묘:"목",진:"토",사:"화",오:"화",미:"토",신:"금",유:"금",술:"토",해:"수" };
const CC_GAN_YY = { 갑:"양",을:"음",병:"양",정:"음",무:"양",기:"음",경:"양",신:"음",임:"양",계:"음" };

export const C_GEN    = { 목:"화", 화:"토", 토:"금", 금:"수", 수:"목" };
export const C_CTL    = { 목:"토", 화:"금", 토:"수", 금:"목", 수:"화" };
export const C_GEN_BY = { 목:"수", 화:"목", 토:"화", 금:"토", 수:"금" };
export const C_CTL_BY = { 목:"금", 화:"수", 토:"목", 금:"화", 수:"토" };

export const C_CHEONHAP = { 갑:"기", 기:"갑", 을:"경", 경:"을", 병:"신", 신:"병", 정:"임", 임:"정", 무:"계", 계:"무" };
export const C_YUKHAP = { 자:"축", 축:"자", 인:"해", 해:"인", 묘:"술", 술:"묘",
                          진:"유", 유:"진", 사:"신", 신:"사", 오:"미", 미:"오" };
export const C_SAMHAP = { 신:"신자진", 자:"신자진", 진:"신자진", 해:"해묘미", 묘:"해묘미", 미:"해묘미",
                          인:"인오술", 오:"인오술", 술:"인오술", 사:"사유축", 유:"사유축", 축:"사유축" };
export const C_CHUNG = { 자:"오", 오:"자", 축:"미", 미:"축", 인:"신", 신:"인",
                         묘:"유", 유:"묘", 진:"술", 술:"진", 사:"해", 해:"사" };
export const C_HYEONG = { 인:"사", 사:"신", 신:"인", 축:"술", 술:"미", 미:"축", 자:"묘", 묘:"자" };
export const C_HAE = { 자:"미", 미:"자", 축:"오", 오:"축", 인:"사", 사:"인",
                       묘:"진", 진:"묘", 신:"해", 해:"신", 유:"술", 술:"유" };

/* 십신 → 다섯 묶음 */
export const C_ROLE = {
  비견:"비겁", 겁재:"비겁", 식신:"식상", 상관:"식상",
  편재:"재성", 정재:"재성", 편관:"관성", 정관:"관성",
  편인:"인성", 정인:"인성", 일간:"비겁",
};

/** 상대가 나에게 어떤 십신인가 */
export function crossSipsin(meStem, otherStem) {
  return sipsin(CC_GAN.indexOf(meStem), CC_GAN.indexOf(otherStem));
}

/** 두 지지의 관계 */
export function branchRelation(x, y) {
  if (x === y) return { key:"동지", strength: 6, good: true };
  if (C_YUKHAP[x] === y) return { key:"육합", strength: 15, good: true };
  if (C_SAMHAP[x] === C_SAMHAP[y]) return { key:"삼합", strength: 12, good: true };
  if (C_CHUNG[x] === y) return { key:"충", strength: -15, good: false };
  if (C_HYEONG[x] === y) return { key:"형", strength: -9, good: false };
  if (C_HAE[x] === y) return { key:"해", strength: -6, good: false };
  return { key:"무관", strength: 0, good: null };
}

/** 두 천간의 관계 */
export function stemRelation(x, y) {
  const ex = CC_GAN_EL[x], ey = CC_GAN_EL[y];
  if (C_CHEONHAP[x] === y) return { key:"천간합", strength: 14, dir:"서로" };
  if (x === y)             return { key:"같은 글자", strength: 5, dir:"서로" };
  if (ex === ey)           return { key:"같은 기운", strength: 5, dir:"서로" };
  if (C_GEN[ex] === ey)    return { key:"내가 준다", strength: 11, dir:"A→B" };
  if (C_GEN[ey] === ex)    return { key:"내가 받는다", strength: 11, dir:"B→A" };
  if (C_CTL[ex] === ey)    return { key:"내가 누른다", strength: -7, dir:"A→B" };
  return { key:"내가 눌린다", strength: -7, dir:"B→A" };
}

/* ───────── 두 사람 한 쌍 ───────── */

/**
 * 두 명식을 겹쳐 놓고 쓸 수 있는 모든 축을 뽑는다.
 * 문장은 만들지 않는다. 숫자와 관계만.
 */
export function pairAxes(a, b, nameA = "A", nameB = "B") {
  const stA = analyzeStrength(a), stB = analyzeStrength(b);
  const dsA = a.pillars.day.stem,   dsB = b.pillars.day.stem;
  const dbA = a.pillars.day.branch, dbB = b.pillars.day.branch;
  const elA = a.dayMaster.element,  elB = b.dayMaster.element;

  const rA = {}; a.elements.forEach(e => rA[e.name] = e.ratio);
  const rB = {}; b.elements.forEach(e => rB[e.name] = e.ratio);

  /* 서로가 서로에게 무엇인가 — 궁합의 뼈대 */
  const aToB = crossSipsin(dsB, dsA);   // A는 B에게 무엇인가
  const bToA = crossSipsin(dsA, dsB);   // B는 A에게 무엇인가

  const stem = stemRelation(dsA, dsB);
  const branch = branchRelation(dbA, dbB);

  /* 서로의 부족한 기운을 채워주는가 */
  const giveAtoB = rA[stB.yongsin] || 0;
  const giveBtoA = rB[stA.yongsin] || 0;
  /* 서로의 과한 기운을 더 얹는가 */
  const loadAtoB = rA[stB.gisin] || 0;
  const loadBtoA = rB[stA.gisin] || 0;

  /* 둘을 합친 오행 — 함께 있을 때의 모습 */
  const merged = ["목","화","토","금","수"].map(k => ({
    name: k, ratio: Math.round(((rA[k] || 0) + (rB[k] || 0)) / 2 * 10) / 10,
  }));
  const mLack = merged.filter(e => e.ratio < 12).map(e => e.name);
  const mOver = merged.filter(e => e.ratio >= 30).map(e => e.name);

  /* 음양 */
  const yyA = CC_GAN_YY[dsA], yyB = CC_GAN_YY[dsB];

  /* 말하기·듣기 */
  const csA = commStyle(a), csB = commStyle(b);
  const ptA = personaType(a), ptB = personaType(b);
  const wmA = workMode(a), wmB = workMode(b);
  const domA = dominantSipsin(a), domB = dominantSipsin(b);

  /* 두 사람의 명식 전체에서 서로의 지지가 부딪히는 자리 */
  const POS = ["year", "month", "day", "hour"];
  const POS_KO = { year:"년주", month:"월주", day:"일주", hour:"시주" };
  const clashes = [];
  POS.forEach(ka => {
    const pa = a.pillars[ka]; if (!pa) return;
    POS.forEach(kb => {
      const pb = b.pillars[kb]; if (!pb) return;
      const r = branchRelation(pa.branch, pb.branch);
      if (r.key === "충" || r.key === "형")
        clashes.push({ kind:r.key, aPos:POS_KO[ka], bPos:POS_KO[kb],
                       aCn:pa.branchCn, bCn:pb.branchCn });
      if (r.key === "육합" || r.key === "삼합")
        clashes.push({ kind:r.key, aPos:POS_KO[ka], bPos:POS_KO[kb],
                       aCn:pa.branchCn, bCn:pb.branchCn, good:true });
    });
  });
  const hardSpots = clashes.filter(c => !c.good);
  const softSpots = clashes.filter(c => c.good);

  /* 점수 */
  let score = 50 + stem.strength + branch.strength;
  if (giveBtoA >= 25) score += 10;
  if (giveAtoB >= 25) score += 10;
  if (loadAtoB >= 32) score -= 5;
  if (loadBtoA >= 32) score -= 5;
  if (stA.level === "신강" && stB.level === "신강") score -= 6;
  if (stA.level === "신약" && stB.level === "신약") score -= 4;
  score -= Math.min(12, hardSpots.length * 3);
  score += Math.min(10, softSpots.length * 2);
  score = Math.max(12, Math.min(97, Math.round(score)));

  return {
    nameA, nameB,
    a: { name:nameA, stem:dsA, stemCn:a.pillars.day.stemCn, branch:dbA, branchCn:a.pillars.day.branchCn,
         gapja:a.pillars.day.gapja, gapjaCn:a.pillars.day.gapjaCn, el:elA, yy:yyA,
         level:stA.level, yongsin:stA.yongsin, gisin:stA.gisin, support:stA.support,
         ratios:rA, comm:csA, type:ptA, work:wmA, dom:domA, domRole:C_ROLE[domA] || "비겁",
         isMale: a.input.gender === "M" },
    b: { name:nameB, stem:dsB, stemCn:b.pillars.day.stemCn, branch:dbB, branchCn:b.pillars.day.branchCn,
         gapja:b.pillars.day.gapja, gapjaCn:b.pillars.day.gapjaCn, el:elB, yy:yyB,
         level:stB.level, yongsin:stB.yongsin, gisin:stB.gisin, support:stB.support,
         ratios:rB, comm:csB, type:ptB, work:wmB, dom:domB, domRole:C_ROLE[domB] || "비겁",
         isMale: b.input.gender === "M" },
    aToB, bToA,                       // 서로에게 어떤 십신인가
    aToBRole: C_ROLE[aToB] || "비겁",
    bToARole: C_ROLE[bToA] || "비겁",
    stem, branch,
    give: { aToB: giveAtoB, bToA: giveBtoA },
    load: { aToB: loadAtoB, bToA: loadBtoA },
    merged, mLack, mOver,
    hardSpots, softSpots,
    sameYinYang: yyA === yyB,
    score,
  };
}

/* ───────── 시기 ───────── */

/** 두 사람 모두에게 걸리는 해 — 일지가 충을 맞거나 합이 드는 해 */
export function pairYears(a, b, nameA, nameB, span = 8) {
  const from = new Date().getFullYear();
  const dbA = a.pillars.day.branch, dbB = b.pillars.day.branch;
  const out = [];
  for (let y = from; y < from + span; y++) {
    const sv = seun(y);
    const hits = [];
    if (C_CHUNG[dbA] === sv.branch) hits.push({ who:nameA, kind:"충" });
    if (C_CHUNG[dbB] === sv.branch) hits.push({ who:nameB, kind:"충" });
    if (C_YUKHAP[dbA] === sv.branch) hits.push({ who:nameA, kind:"합" });
    if (C_YUKHAP[dbB] === sv.branch) hits.push({ who:nameB, kind:"합" });
    if (!hits.length) continue;
    out.push({
      year: y, gapja: sv.gapja, gapjaCn: sv.gapjaCn,
      ageA: ageInYear(a, y), ageB: ageInYear(b, y),
      hits,
      both: hits.length >= 2,
      kind: hits.every(h => h.kind === "합") ? "합" : hits.every(h => h.kind === "충") ? "충" : "섞임",
    });
  }
  return out;
}

/** 두 사람의 대운이 바뀌는 해 — 판이 흔들리는 구간 */
export function daeunShifts(a, b, nameA, nameB, span = 12) {
  const now = new Date().getFullYear();
  const out = [];
  const add = (saju, who) => {
    const born = saju.solar.year;
    (saju.daeun.list || []).forEach(d => {
      const y = born + Math.floor(d.startAge);
      if (y >= now && y < now + span)
        out.push({ year: y, who, age: Math.floor(d.startAge), gapjaCn: d.gapjaCn, sipsin: d.sipsin });
    });
  };
  add(a, nameA); add(b, nameB);
  return out.sort((x, y) => x.year - y.year);
}

export { CC_GAN, CC_JI, CC_GAN_CN, CC_JI_CN, CC_GAN_EL, CC_JI_EL, CC_GAN_YY };
