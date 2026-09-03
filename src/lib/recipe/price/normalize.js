// 재료명 → 표준 품목명, 3단계 통합.
//
// 🔴 이 파일이 PoC 에 없던 조각이다.
//    llm-normalize.js 는 eval/ 과 probe/ 에서만 불리고 있었고,
//    실제 파이프라인(analyze.js → price/index.js)은 규칙 ALIASES 만 쓰고 있었다.
//    기획서 5.6 의 "재료명 정규화 = LLM 사용(핵심)" 이 제품에는 비어 있던 셈이다.
//
//   1단계  규칙      canonicalize()   정규식 ALIASES + 표준명 일치
//   2단계  DB 캐시   lookup_alias()   지난 요청에서 LLM 이 푼 것
//   3단계  LLM       normalizeNames() 남은 것만 한 번에
//              ↓
//          결과는 캐시에 저장 → 다음부터 2단계에서 잡힌다
//          실패는 unmatched_ingredient 로 수집
//
// 설계 원칙
//   · LLM 은 이름당 한 번. 재료마다 호출하지 않는다.
//   · LLM 이 죽어도 서비스는 돈다. 규칙 결과만 쓰고 넘어간다.
//   · 표준 목록에 없는 이름을 모델이 만들어내면 버린다(마지막 방어선).
//   · GEMINI_API_KEY 가 없으면 1·2단계만 돈다.

import { canonicalize, CANONICAL_LIST } from './index.js';
import { normalizeNames } from './llm-normalize.js';
import { getAliasStore } from './alias-store.js';
import { pickModel, apiKey } from '../llm/gemini.js';

// 모델은 프로세스당 한 번만 고른다. PoC 에서는 eval/probe 가 pickModel() 결과를
// 넘겨줬지만 이 연결부에는 그 호출이 없어 model=undefined 로 404가 났다.
let defaultModelPromise = null;
function defaultModel() {
  if (!defaultModelPromise) {
    defaultModelPromise = pickModel().catch((e) => {
      defaultModelPromise = null; // 일시 오류면 다음 요청에서 다시 시도
      throw e;
    });
  }
  return defaultModelPromise;
}

const CANONICAL_SET = new Set(CANONICAL_LIST);

/**
 * 재료 표기 목록을 한 번에 정규화한다.
 *
 * @param {string[]} rawNames 파서가 뽑은 재료 표기들
 * @param {{ store?: object, useLlm?: boolean, model?: string }} opts
 * @returns {Promise<{ map: Map<string, string|null>, stats: object }>}
 *          map: 원문 표기 → 표준 품목명 (못 찾으면 null)
 */
export async function resolveCanonicalNames(rawNames, opts = {}) {
  const store = opts.store ?? getAliasStore();
  // 키 풀(GEMINI_API_KEYS)도 인식해야 하므로 환경변수를 직접 보지 않는다
  const useLlm = opts.useLlm ?? Boolean(apiKey());

  const unique = [...new Set(rawNames.map((n) => String(n || '').trim()).filter(Boolean))];
  const map = new Map();
  // LLM 이 "재료가 아니다"라고 판정한 표기 — 호출부가 결과 행에서 제거한다
  const notIngredient = new Set();
  const stats = { total: unique.length, rule: 0, cache: 0, llm: 0, missed: 0, filtered: 0, llmCalled: false };

  // ── 1단계: 규칙 ────────────────────────────────────────────
  const pending = [];
  for (const name of unique) {
    const hit = canonicalize(name);
    if (hit) {
      map.set(name, hit);
      stats.rule += 1;
    } else {
      pending.push(name);
    }
  }
  if (pending.length === 0) return { map, stats, notIngredient };

  // ── 2단계: DB 캐시 ─────────────────────────────────────────
  const stillPending = [];
  const cacheHits = await Promise.all(pending.map((n) => store.lookup(n).catch(() => null)));

  pending.forEach((name, i) => {
    const cached = cacheHits[i];
    // 코드의 표준 목록이 바뀌었을 수 있으므로 캐시 값도 검증한다.
    // (표준 품목명의 주인은 DB 가 아니라 CANONICAL_LIST 다)
    if (cached && CANONICAL_SET.has(cached)) {
      map.set(name, cached);
      stats.cache += 1;
    } else {
      stillPending.push(name);
    }
  });
  if (stillPending.length === 0) return { map, stats, notIngredient };

  // ── 3단계: LLM ─────────────────────────────────────────────
  if (!useLlm) {
    for (const name of stillPending) map.set(name, null);
    stats.missed += stillPending.length;
    await recordAll(store, stillPending.map((n) => ({ name: n })));
    return { map, stats, notIngredient };
  }

  try {
    stats.llmCalled = true;
    const model = opts.model ?? (await defaultModel());
    const { results } = await normalizeNames(stillPending, CANONICAL_LIST, { model });

    const toSave = [];
    const toRecord = [];

    for (const name of stillPending) {
      const r = results.get(name);
      // normalizeNames 가 이미 임계값(0.6)과 목록 검증을 마친 값을 준다
      const canonical = r?.canonical && CANONICAL_SET.has(r.canonical) ? r.canonical : null;

      if (canonical) {
        map.set(name, canonical);
        stats.llm += 1;
        toSave.push({ name, canonical, confidence: r.confidence, reason: r.reason });
      } else if (r && r.isIngredient === false) {
        // 조리 단계·도구·문장 조각 — 결과 행에서 제거된다 (5.5 "조리 단계나 문장 조각")
        map.set(name, null);
        notIngredient.add(name);
        stats.filtered += 1;
        toRecord.push({ name, reason: r.reason ?? '재료 아님', confidence: r.confidence ?? null });
      } else {
        map.set(name, null);
        stats.missed += 1;
        toRecord.push({ name, reason: r?.reason ?? null, confidence: r?.confidence ?? null });
      }
    }

    await Promise.allSettled([
      ...toSave.map((s) => store.save(s.name, s.canonical, s.confidence, s.reason)),
      recordAll(store, toRecord),
    ]);
  } catch (e) {
    // LLM 은 서비스의 전제가 아니라 보강이다 (5.6)
    console.warn('[normalize] LLM 실패, 규칙 결과로 진행:', e.message);
    for (const name of stillPending) if (!map.has(name)) map.set(name, null);
    stats.missed += stillPending.filter((n) => !map.get(n)).length;
  }

  return { map, stats, notIngredient };
}

function recordAll(store, items) {
  if (!items.length) return Promise.resolve();
  return Promise.allSettled(
    items.map((i) => store.recordUnmatched(i.name, i.reason ?? null, i.confidence ?? null))
  );
}
