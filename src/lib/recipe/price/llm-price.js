// tier2 — 웹 시세 조회.
//
// KAMIS(tier1)에도 시드에도 없는 품목의 "빈 가격"을 메운다.
// 기획서 8절의 tier2(오픈마켓) 자리를 크롤러 대신 정식 API로 채운 것.
//
// 경로 두 개 (위에서부터 시도):
//   1. 네이버 쇼핑 검색 API — NAVER_CLIENT_ID/SECRET 이 있으면 이쪽.
//      실판매가·상품명·판매처가 구조화로 오므로 출처가 확실하고 LLM 이 필요 없다.
//   2. Gemini + Google 검색 그라운딩 — 네이버 키가 없을 때. 유료 티어 키 필요.
//
// 정직성 원칙 (이 서비스의 기둥):
//   · 출처(판매처/검색 근거)가 있는 값만 인정한다. 모델 기억으로 답한 가격은 버린다.
//   · 후보들의 단가 중앙값을 고른다 — 초저가 미끼 상품과 프리미엄 양쪽을 피한다.
//   · 값 범위를 검증하고, 실패하면 조용히 null — 기존 NO_PRICE 흐름(직접 입력 안내) 그대로.
//   · 결과는 tier 2 · live:false 로 나가므로 화면에는 "추정치" 배지가 붙는다.
//
// 비용: 품목당 프로세스 수명 동안 1회 (실패도 캐시). LLM_PRICE=0 으로 끌 수 있다.

import '../env.js';
import { apiKey, rotateApiKey, pickModels } from '../llm/gemini.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const NAVER_URL = 'https://openapi.naver.com/v1/search/shop.json';

// 이름 → 결과 캐시 (부정 결과 포함 — 같은 요청에서 재시도로 쿼터를 태우지 않는다)
const cache = new Map();

/**
 * @param {string} name 표준 품목명(있으면) 또는 원문 재료명
 * @returns {Promise<{per:'g'|'ml'|'ea', unitPrice:number, pack:{size:number,unit:string,price:number,label:string}, sourceName:string, asOf:string}|null>}
 */
export async function lookupWebPrice(name) {
  if (process.env.LLM_PRICE === '0') return null;
  if (!name) return null;
  const key = String(name).trim();
  if (cache.has(key)) return cache.get(key);
  try {
    const r = naverKeys() ? await naverLookup(key) : apiKey() ? await geminiLookup(key) : null;
    cache.set(key, r);
    return r;
  } catch (e) {
    console.warn('[llm-price]', key, e.message);
    cache.set(key, null); // 이번 프로세스에서는 재시도하지 않는다
    return null;
  }
}

// ── 경로 1: 네이버 쇼핑 API ─────────────────────────────────────

function naverKeys() {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  return id && secret ? { id, secret } : null;
}

/**
 * 상품명에서 포장 용량을 읽는다. "곰표 부침가루 1kg", "저지방 우유 900ml x 2개"
 * @returns {{size:number, base:'g'|'ml'|'ea'}|null}
 */
export function parsePackSize(title) {
  const t = String(title);
  const m = /(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|리터)(?![a-z가-힣])/i.exec(t);
  if (m) {
    const n = Number(m[1].replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return null;
    const u = m[2].toLowerCase();
    let size = u === 'kg' ? n * 1000 : u === 'l' || u === '리터' ? n * 1000 : n;
    const base = u === 'ml' || u === 'l' || u === '리터' ? 'ml' : 'g';
    // 멀티팩: "500g x 2", "500g*3개"
    const multi = /[x×*]\s*(\d{1,2})\s*(?:개|팩|봉|입)?/i.exec(t.slice(m.index + m[0].length));
    if (multi) size *= Number(multi[1]);
    return size > 0 && size <= 100000 ? { size, base } : null;
  }
  // 세는 단위: "계란 30구", "두부 2모" — g 환산 불가라 개 단위로만
  const ea = /(\d{1,3})\s*(구|개입|입|알)(?![a-z가-힣])/.exec(t);
  if (ea) {
    const n = Number(ea[1]);
    return n > 0 && n <= 1000 ? { size: n, base: 'ea' } : null;
  }
  return null;
}

async function naverLookup(name) {
  const keys = naverKeys();
  const res = await fetch(`${NAVER_URL}?query=${encodeURIComponent(name)}&display=20&sort=sim`, {
    headers: { 'X-Naver-Client-Id': keys.id, 'X-Naver-Client-Secret': keys.secret },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`네이버쇼핑 ${res.status}: ${(await res.text()).slice(0, 150)}`);
  const data = await res.json();

  const candidates = [];
  for (const it of data.items ?? []) {
    // 식품 카테고리만. 검색어가 애매하면 주방용품 같은 게 섞인다
    if (it.category1 && it.category1 !== '식품') continue;
    const price = Number(it.lprice);
    if (!Number.isFinite(price) || price < 100 || price > 200000) continue;
    const title = String(it.title).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
    const pack = parsePackSize(title);
    if (!pack) continue; // 용량을 못 읽으면 단가를 낼 수 없다
    candidates.push({ title, price, mall: it.mallName || '네이버쇼핑', ...pack, unitPrice: price / pack.size });
  }
  if (!candidates.length) return null;

  // g/ml 후보가 있으면 그쪽만 쓴다 (개 단위는 단가 비교 축이 다르다)
  const weighted = candidates.filter((c) => c.base !== 'ea');
  const pool = weighted.length ? weighted : candidates;

  // 단가 중앙값 상품을 대표로 — 미끼 최저가도, 프리미엄도 아닌 "보통 가격"
  pool.sort((a, b) => a.unitPrice - b.unitPrice);
  const mid = pool[Math.floor(pool.length / 2)];

  return {
    per: mid.base,
    unitPrice: Math.round(mid.unitPrice * 100) / 100,
    pack: {
      size: mid.size,
      unit: mid.base === 'ea' ? '개' : mid.base,
      price: mid.price,
      label: mid.title.length > 30 ? `${mid.title.slice(0, 30)}…` : mid.title,
    },
    sourceName: `웹 시세 · 네이버쇼핑(${mid.mall})`,
    asOf: new Date().toISOString().slice(0, 10),
  };
}

// ── 경로 2: Gemini + 검색 그라운딩 (네이버 키가 없을 때) ─────────

let modelPromise = null;
function defaultModel() {
  if (!modelPromise) {
    modelPromise = pickModels()
      .then((names) => names.find((n) => /lite/i.test(n)) ?? names[0])
      .catch((e) => {
        modelPromise = null;
        throw e;
      });
  }
  return modelPromise;
}

async function geminiLookup(name, attempt = 0) {
  const model = await defaultModel();
  const prompt = `한국에서 파는 식재료 "${name}"의 현재 온라인 판매 가격을 검색해서 알려줘.
대형마트·이커머스(쿠팡, 이마트몰, 홈플러스, 마켓컬리 등)에서 파는 일반적인 소용량 상품 기준.

반드시 아래 형식의 JSON 한 개만 출력해 (설명·코드펜스 없이):
{"found":true,"productLabel":"곰표 부침가루 1kg","packSize":1000,"packUnit":"g","packPrice":3480,"source":"쿠팡","asOf":"2026-09-03"}

- packUnit 은 g·ml·개 중 하나, packSize 는 그 단위의 숫자 (1kg이면 packUnit "g", packSize 1000)
- packPrice 는 원 단위 정수
- asOf 는 그 가격을 확인한 날짜 (YYYY-MM-DD)
- 검색에서 확실한 최근 가격을 찾지 못하면 {"found":false} 만 출력해. 가격을 추측하거나 지어내지 마.`;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 25000);
  let res, text;
  try {
    res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey()}`, {
      method: 'POST',
      signal: ac.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }], // 검색 그라운딩 — responseSchema 와 병용이 안 되므로 텍스트로 받는다
        generationConfig: { temperature: 0 },
      }),
    });
    text = await res.text();
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 429 && attempt < 4 && rotateApiKey()) return geminiLookup(name, attempt + 1);
  if (!res.ok) throw new Error(`generateContent ${res.status}: ${text.slice(0, 200)}`);

  const json = JSON.parse(text);
  const cand = json.candidates?.[0];

  // 검색 근거가 붙지 않은 응답은 모델의 기억/추측이다 — 버린다
  const grounded = (cand?.groundingMetadata?.groundingChunks ?? []).some((c) => c.web);
  if (!grounded) return null;

  const raw = (cand?.content?.parts ?? []).map((p) => p.text ?? '').join('');
  const m = /\{[\s\S]*\}/.exec(raw.replace(/```(?:json)?/g, ''));
  if (!m) return null;
  let data;
  try {
    data = JSON.parse(m[0]);
  } catch {
    return null;
  }

  if (!data.found) return null;
  const size = Number(data.packSize);
  const price = Number(data.packPrice);
  const unit = String(data.packUnit ?? '').trim();
  const source = String(data.source ?? '').trim();
  // 상식 범위 검증 — 벗어나면 검색이 엉뚱한 걸 잡은 것이다
  if (!['g', 'ml', '개'].includes(unit)) return null;
  if (!Number.isFinite(size) || size <= 0 || size > 100000) return null;
  if (!Number.isFinite(price) || price < 100 || price > 200000) return null;
  if (!source) return null;

  const per = unit === '개' ? 'ea' : unit;
  const asOf = /^\d{4}-\d{2}-\d{2}$/.test(String(data.asOf ?? '')) ? data.asOf : new Date().toISOString().slice(0, 10);
  const label = String(data.productLabel ?? '').trim() || `${size}${unit}`;

  return {
    per,
    unitPrice: Math.round((price / size) * 100) / 100,
    pack: { size, unit, price, label },
    sourceName: `웹 시세 · ${source}`,
    asOf,
  };
}
