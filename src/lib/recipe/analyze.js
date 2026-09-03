// 분석 파이프라인 본체. 로컬 server.js 와 Vercel 서버리스 함수(api/analyze.js)가
// 같은 코드를 쓰도록 여기로 뽑아 두었다. HTTP 에 대해 아무것도 모른다.
import './env.js';
import { resolveRecipe } from './fetch/resolve.js';
import { extractIngredients } from './parse/ingredients.js';
import { detectServings } from './parse/servings.js';
import { priceRecipe, PRICE_META } from './price/index.js';
import { resolveCanonicalNames } from './price/normalize.js';

/**
 * @param {{url?: string, text?: string, overrides?: object, servings?: number}} input
 * @returns {Promise<object>} 프론트가 그대로 렌더할 수 있는 결과
 * @throws {Error & {statusCode: number}} 입력이 잘못된 경우
 */
export async function analyze({ url, text, overrides = {}, servings = null } = {}) {
  let fetched;
  if (text && !url) {
    fetched = { ok: true, source: 'manual', text, title: '직접 입력', trail: [] };
    fetched.extraction = extractIngredients(text, { source: 'manual' });
  } else if (!url) {
    const err = new Error('url 또는 text가 필요합니다.');
    err.statusCode = 400;
    throw err;
  } else {
    fetched = await resolveRecipe(url);
  }

  const extraction = fetched.extraction;

  // 인분은 원문에 적혀 있으면 그걸 쓰고, 사용자가 값을 넘겼으면 사용자 값이 이긴다.
  const detected = detectServings(fetched.text);
  const effectiveServings = servings != null ? servings : detected?.servings ?? 1;

  // 이름 정규화를 가격 조회 **전에** 한 번에 끝낸다.
  //   규칙 → DB 별칭 캐시 → LLM  (5.5)
  // 재료마다 LLM 을 부르지 않기 위해 여기서 배치로 푼다.
  const { map: canonicalMap, stats: normalizeStats } = await resolveCanonicalNames(
    extraction.items.map((i) => i.name)
  );

  const pricing = await priceRecipe(extraction.items, {
    overrides,
    servings: effectiveServings,
    canonicalMap,
  });

  return {
    servings: {
      used: effectiveServings,
      source: servings != null ? 'user' : detected ? 'detected' : 'default',
      detected: detected || null,
    },
    fetched: {
      ok: fetched.ok,
      source: fetched.source,
      title: fetched.title || null,
      channel: fetched.channel || null,
      container: fetched.container || null,
      reason: fetched.reason || null,
      message: fetched.message || null,
      trail: fetched.trail || [],
      resolvedFrom: fetched.resolvedFrom || null,
      linkedUrl: fetched.linkedUrl || null,
      fetchVia: fetched.fetchVia || null,
      textLength: (fetched.text || '').length,
      // 사용자가 값을 고쳐 재계산할 때 URL을 다시 긁지 않도록 원문을 그대로 돌려준다.
      text: fetched.text || '',
    },
    extraction: {
      method: extraction.method,
      sections: extraction.sections,
      diagnostics: extraction.diagnostics,
    },
    // 정규화가 어느 단계에서 풀렸는지. 발표에서 "AI가 어디에 쓰였나"를
    // 숫자로 보여줄 수 있는 자리다 — rule / cache / llm / missed
    normalize: normalizeStats,
    pricing,
    priceMeta: PRICE_META,
  };
}
