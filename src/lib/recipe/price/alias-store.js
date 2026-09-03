// 별칭 캐시 저장소.
//
// LLM 정규화 결과를 어디에 쌓을지만 담당한다. 정규화 로직은 normalize.js 에 있다.
//
// 왜 DB 가 필요한가 — 서버리스는 요청이 끝나면 프로세스가 사라진다.
// 메모리에 캐시하면 매 요청 LLM 을 다시 부르게 되고, "이름당 한 번" 이라는
// 비용 가정(NFR-11)이 무너진다.
//
// SUPABASE 환경변수가 없으면 메모리로 떨어진다 — PoC 를 그대로 돌릴 때 쓴다.

let cached = null;

export function getAliasStore() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached = url && key ? supabaseStore(url, key) : memoryStore();
  return cached;
}

// --- 메모리 (PoC 단독 실행용) ---
function memoryStore() {
  const map = new Map();
  return {
    kind: 'memory',
    async lookup(alias) {
      return map.get(alias.toLowerCase()) ?? null;
    },
    async save(alias, canonical) {
      map.set(alias.toLowerCase(), canonical);
    },
    async recordUnmatched() {},
  };
}

// --- Supabase ---
function supabaseStore(url, key) {
  let clientPromise = null;
  const getClient = () => {
    if (!clientPromise) {
      // 동적 import — 패키지가 없는 환경(PoC 단독)에서도 파일 자체는 로드된다
      clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
        createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
      );
    }
    return clientPromise;
  };

  return {
    kind: 'supabase',

    /** 캐시 조회. 히트 카운트도 함께 올라간다 */
    async lookup(alias) {
      try {
        const db = await getClient();
        const { data, error } = await db.rpc('lookup_alias', { p_alias: alias });
        if (error) throw new Error(error.message);
        return data ?? null;
      } catch (e) {
        // 캐시는 최적화일 뿐이다. 실패해도 LLM 으로 진행한다
        console.warn('[alias-store] lookup 실패:', e.message);
        return null;
      }
    },

    async save(alias, canonical, confidence = 1, reason = null) {
      try {
        const db = await getClient();
        const { error } = await db.rpc('cache_alias', {
          p_alias: alias,
          p_canonical_name: canonical,
          p_confidence: confidence,
          p_reason: reason,
        });
        if (error) throw new Error(error.message);
      } catch (e) {
        console.warn('[alias-store] save 실패:', e.message);
      }
    },

    /**
     * 끝내 못 찾은 이름을 모은다.
     * LLM 이 남긴 reason 이 "다음에 뭘 표준 품목에 추가할지" 알려주는 목록이 된다.
     */
    async recordUnmatched(rawName, reason = null, confidence = null) {
      try {
        const db = await getClient();
        const { error } = await db.rpc('record_unmatched', {
          p_raw_name: rawName,
          p_reason: reason,
          p_confidence: confidence,
        });
        if (error) throw new Error(error.message);
      } catch (e) {
        console.warn('[alias-store] recordUnmatched 실패:', e.message);
      }
    },
  };
}
