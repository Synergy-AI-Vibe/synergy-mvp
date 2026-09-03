# 백엔드 작업 지시서 — 레시비 (recibi.kr)

> 이 문서 하나만 읽고 작업을 시작할 수 있도록 씌어 있습니다.
> 저장소: `Synergy` (Next.js App Router · TypeScript · Supabase · Vercel)
> 마감: 2026-09-03 14:00

---

# 0. 지금 상태

## 서비스가 하는 일

유튜브 링크를 넣으면 **재료비(소모 원가)** 와 **장바구니 금액**을 계산해, **사 먹는 가격**과 나란히 보여줍니다. 재료를 빼거나 금액을 채우면 화면에서 즉시 다시 계산됩니다.

## 아키텍처

```
브라우저 ──POST /api/analyze──▶ Next 라우트
                                  │
                                  ├─ lib/recipe/          PoC 파이프라인 (JS, 의존성 0)
                                  │    fetch  설명란 → 고정 댓글
                                  │    parse  재료 규칙 5종 + 단위 환산
                                  │    price  KAMIS 실시세 → 시드 폴백
                                  │    llm    Gemini (정규화 · 추출 폴백)
                                  │
                                  ├─ lib/recipe-adapter.ts  PoC 출력 → FE 계약
                                  └─ Supabase             별칭 캐시 · 매장가 · 북마크

브라우저 ──OAuth──▶ 카카오 (Supabase Auth)
```

**서버는 한 번만 부릅니다.** 계산 결과가 화면에 오면 그 뒤 재료 조정은 전부 FE가 `lib/calc.ts` 로 처리합니다.

## 이미 되어 있는 것

| | 상태 |
|---|---|
| DB 스키마 v3 | 마이그레이션 4개 작성 완료 (`supabase/migrations/`) |
| FE 계약 | `src/types/api.ts` |
| 계산식 | `src/lib/calc.ts` (5.7 공식, BE·FE 공용) |
| 목 응답 | `src/lib/mock/analyze.ts` — FE가 이걸로 개발 중 |
| 어댑터 | `src/lib/recipe-adapter.ts` |
| 라우트 뼈대 | analyze · bookmarks · account/delete · auth |
| PoC | 검증 완료. 추출 성공률 60% · 홀드아웃 재현율 95% / 정밀도 91% |

## DB 테이블 (6개)

| 테이블 | 역할 |
|---|---|
| `profiles` | 카카오 계정. `auth.users` 트리거로 자동 생성 |
| `bookmark` | 사용자당 최대 5개. 금액은 저장 안 함 |
| `store_price` | 메뉴 카테고리별 사 먹는 가격 20종 |
| `ingredient_alias` | LLM 정규화 캐시 (`alias` → `canonical_name`) |
| `unmatched_ingredient` | 매칭 실패 누적 수집 |
| `team_members` | 기존 스캐폴드. 건드리지 말 것 |

**가격·표준품목·별칭 규칙은 DB에 없습니다.** PoC 코드(`lib/recipe/price/`)가 담당합니다.

---

# 1. 🚫 절대 지킬 것

작업 전에 반드시 읽으세요. 여기를 어기면 되돌리는 데 시간이 더 듭니다.

### 1-1. PoC 알고리즘을 바꾸지 말 것

`lib/recipe/parse/` · `lib/recipe/price/` 의 로직은 실데이터 60건으로 검증된 것입니다(재현율 95% / 정밀도 91%). **import 경로와 타입만 맞추고 알고리즘은 그대로 두세요.** "더 좋아 보이는" 리팩터링 금지.

### 1-2. 별칭 매칭에 앵커(`^`)를 쓰지 말 것

```js
❌  /^삼겹살/.test("통삼겹")   // false → 주재료 누락
✅  "통삼겹".includes("삼겹")   // true
```

PoC에서 이 버그로 가장 비싼 주재료 600g(17,676원)이 통째로 빠져 소모원가가 **8,522원 → 26,198원, 3배** 어긋났습니다. `price/index.js` 의 `ALIASES` 주석에도 명시돼 있습니다.

### 1-3. 계산식은 `lib/calc.ts` 에만

서버가 초기 1회 계산하고, 이후 FE가 재계산합니다. **같은 공식이 두 곳에 있으면 새로고침할 때 금액이 달라집니다.** 라우트나 서비스에서 직접 더하지 마세요.

### 1-4. `types/api.ts` 를 바꾸면 FE에 알릴 것

FE가 이 파일을 보고 화면을 만들고 있습니다. 필드 추가·삭제·이름 변경은 반드시 통보.

### 1-5. 환경변수 이름 (틀리면 조용히 실패)

```
KAMIS_CERT_KEY        ← KAMIS_API_KEY 아님
KAMIS_CERT_ID         ← KAMIS_API_ID 아님
YOUTUBE_API_KEY
GEMINI_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY   ← NEXT_PUBLIC_ 붙이면 DB 전체가 열립니다
```

`kamis.js:26` 이 `KAMIS_CERT_KEY && KAMIS_CERT_ID` 둘 다 있어야 통과시킵니다. 이름이 틀리면 **에러 없이** 시드 값으로 떨어집니다.

### 1-6. `/api/analyze` 라우트에 `export const runtime = 'nodejs'`

PoC의 `env.js` 가 `node:fs`, `http.js` 가 `node:https` 를 씁니다. Edge 런타임에는 없어서 **배포한 뒤에야** 터집니다.

### 1-7. 사용자에게 나가는 문구

- `alert()` 금지
- 사과 표현 금지 — "죄송합니다", "오류가 발생했습니다" 안 씀
- 금액은 원 단위 정수 + 천 단위 쉼표, 퍼센트는 소수점 한 자리
- 에러 메시지는 그대로 화면에 나갑니다. 한국어로, 다음 행동을 알려주는 문장으로

### 1-8. 쓰기는 secret 키로

마스터·가격 테이블에 INSERT 정책을 만들지 않았습니다. publishable 키로 쓰면 **에러 없이 0행 처리**됩니다. `lib/supabase/admin.ts` 를 쓰세요.

### 1-9. 주석을 지우지 말 것

PoC 주석에는 **"왜 그렇게 했는지"** 가 들어 있습니다. 정리한다고 걷어내면 다음 사람이 같은 버그를 다시 만듭니다.

```js
// 앵커(^)를 두면 '통삼겹'·'수육용 목살'처럼 수식어가 앞에 붙은 표기를 놓친다
// 3줄짜리 목록도 인정한다. 4줄을 요구하면 양쪽 다 버려졌다.
// '/' 는 분수(1/5)와 충돌하므로 기본 구분자에서 제외한다.
// ("진간장"의 '장'을 단위로 떼어내면 안 된다)
```

### 1-10. KAMIS 파라미터를 바꾸지 말 것

```js
p_convert_kg_yn: 'N'    // ← 절대 'Y' 로 바꾸지 말 것
```

`'Y'` 로 하면 **값은 kg 기준으로 바뀌는데 `unit` 필드는 `100g` 그대로**라 서로 어긋납니다(시금치: unit=100g, dpr1=23,888). 문서에 없는 내용이고 실제로 두들겨봐야 아는 것입니다.

`p_country_code: '1101'`(서울) · `p_product_cls_code: '01'`(소매)도 그대로 둡니다.

### 1-11. 임계값·매직넘버를 조정하지 말 것

전부 실측으로 정한 값입니다. 근거가 주석에 있습니다.

```js
MIN_ITEMS = 3        재료 3건 이상이면 그 소스 채택
minConfidence = 0.6  LLM 매핑 채택 임계값
run.length >= 3      밀도 탐지 최소 연속 줄 (4로 올렸다가 되돌린 흔적 있음)
length > 40          재료 줄 최대 길이
maxBack = 7          KAMIS 날짜 소급
batchSize = 10       LLM 배치 크기
```

### 1-12. `COUNT_WEIGHTS` 를 DB로 옮기지 말 것

`parse/units.js` 의 재료별 개당 중량 66개는 코드에 둡니다. 주석에 "실제 서비스에서는 재료 마스터 DB로 옮겨야 함"이라고 적혀 있지만, **그건 대회 이후 이야기**입니다. 지금 옮기면 환산 로직 전체를 다시 짜야 합니다.

---

# 2. 작업 목록

우선순위 **P0** = 없으면 시연 불가 · **P1** = 없으면 기능 하나가 빔 · **P2** = 있으면 좋음

---

## BE-1 · PoC 이식 + v3 적용 〔P0〕

### 목표
PoC 파이프라인을 Synergy로 옮기고 DB v3를 적용한다.

### 순서 (바꾸면 안 됨)

```bash
# ① PoC 로직을 통째로 (상대경로로 물려 있어 폴더째 옮겨야 함)
mkdir -p src/lib/recipe
cp -r <PoC>/src/* src/lib/recipe/
# ⚠️ PoC의 public/ 은 가져오지 않는다. UI는 Synergy 것을 쓴다.

# ② v3 수정본으로 덮어쓰기 (①보다 나중이어야 함)
#    src/lib/recipe/analyze.js
#    src/lib/recipe/price/{index,normalize,alias-store}.js

# ③ 대체된 파일 삭제
rm -f src/lib/data/ingredient.ts src/lib/data/price.ts
rm -f src/lib/services/normalize-service.ts src/lib/services/analyze-service.ts
rm -rf src/lib/fetch src/lib/parse src/lib/llm
rm -f src/types/pipeline.ts

# ④ 패키지 · DB
npm i @supabase/supabase-js @supabase/ssr server-only
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.ts
```

### 이식 순서 (빌드 에러가 날 때 참고)

PoC 모듈은 의존성 순서가 있습니다. 아래에서 위를 부릅니다.

```
parse/units.js        의존성 없음
parse/ingredients.js  units 만
parse/servings.js     의존성 없음
fetch/http.js         의존성 없음
fetch/youtube*.js     http
fetch/blog.js         http
fetch/resolve.js      fetch/* + parse/ingredients
llm/gemini.js         env
price/kamis.js        env
price/kamis-map.js    의존성 없음
price/seed.js         의존성 없음
price/index.js        units + seed + kamis + kamis-map
price/normalize.js    price/index + llm-normalize + alias-store   ← v3
analyze.js            전부
```

한꺼번에 옮기므로 순서가 문제되진 않지만, **에러가 나면 아래쪽부터** 봅니다.

### 완료 기준
- `npm run build` 통과
- SQL Editor에서 테이블 6개 (`ingredient`·`price` 없음)
- `src/lib/recipe/price/normalize.js` 가 존재 (v3 파일이 안 덮인 게 아닌지)
- `src/lib/recipe/analyze.js` 안에 `resolveCanonicalNames` 가 있음
- `src/lib/recipe/public` 폴더가 **없음** (PoC UI는 안 가져옴)

### 검증
```bash
npm run build
curl -X POST localhost:3000/api/analyze -H 'content-type: application/json' \
  -d '{"url":"https://youtu.be/abc"}'      # 목 응답 JSON
```

---

## BE-2 · KAMIS 연결 확인 〔P0〕

### 목표
가격이 시드 추정치가 아니라 실시세로 붙는지 확인한다.

### 왜 중요한가
시드는 실제 시세와 최대 **165%** 차이납니다(시금치 9 vs 23.89원/g). 키가 안 먹으면 모든 금액이 틀립니다. 그런데 **에러가 안 납니다** — 조용히 시드로 떨어집니다.

### 방법

> ⚠️ **`--env-file=.env.local` 이 없으면 환경변수가 안 읽힙니다.**
> `.env.local` 은 Next가 실행될 때만 자동 로드됩니다. 맨 `node` 로 돌리면 안 읽혀서
> `configured: false` 가 나오고 원인을 못 찾습니다.

```bash
node --env-file=.env.local -e "
import('./src/lib/recipe/price/index.js').then(async (m) => {
  await m.priceItem({ name: '양파', qty: 1, unit: '개', amount: { value: 200, base: 'g' } });
  console.log(JSON.stringify(m.kamisStatus(), null, 2));
});
"
```

`package.json` 에 등록해뒀으면 `npm run kamis` 로도 됩니다.

**전수 확인이 필요하면** PoC 저장소에서 진단 도구를 돌리세요. "KAMIS를 붙이면 실제로 뭐가 달라지나"를 코퍼스 전체로 보여줍니다.

```bash
cd <PoC 저장소> && node probe/kamis-effect.mjs
```

### 완료 기준
```json
{ "configured": true, "ok": true, "regday": "2026-09-0X", "itemCount": 90 이상 }
```

| 결과 | 원인 |
|---|---|
| `configured: false` | 환경변수 이름 (1-5). `KAMIS_CERT_KEY` / `KAMIS_CERT_ID` |
| `ok: false` | `error` 메시지 확인. 인증 실패면 JSON 아닌 본문이 옴 |
| `regday` 가 며칠 전 | **정상.** 주말·공휴일엔 조사값이 없어 `maxBack:7` 로 소급합니다 |

### 알아둘 것

- **서울 소매가 고정입니다** (`p_country_code=1101`). 지역 차이는 반영 안 됩니다
- **서버리스는 콜드스타트마다 6개 분류를 다시 호출합니다.** 캐시가 모듈 전역 변수라 인스턴스마다 1회씩. 첫 요청이 느린 이유입니다
- KAMIS 매핑은 40품목뿐입니다. 나머지 23품목(조미료·가공식품)은 **영구 추정치**입니다

### 그다음
**Vercel 환경변수에도 똑같이 등록.** `.env.local` 은 로컬 전용입니다.

---

## BE-3 · 매장가 채우기 〔P0〕

### 목표
`store_price` 20종 중 시연할 5~6종에 실제 금액을 넣는다.

### 왜 중요한가
**PoC에는 매장가 기능이 아예 없습니다.** 사용자가 숫자를 직접 치는 input 하나뿐이었습니다. 이걸 안 채우면 **r1(절약 금액) 화면이 빕니다** — 서비스의 메인 화면입니다.

### 방법
배민·요기요에서 **2인분 기준, 배달비 포함** 금액을 보고 SQL Editor에서 채웁니다.

```sql
-- 비어 있는 목록
select menu_key, menu_name from store_price where not is_verified order by menu_name;

-- 채우기 (5~6개)
update store_price set
  price_min = 13000, price_max = 18000, price_avg = 15500,
  delivery_fee = 3000, sample_size = 5,
  surveyed_on = current_date, is_verified = true
where menu_key = 'jeyuk-bokkeum';
```

`kimchi-jjigae` 는 이미 채워져 있습니다(18,000~24,000 · 평균 22,000).

### 완료 기준
```sql
select menu_name, price_min, price_avg, price_max from store_price where is_verified;
-- 6행 이상

select menu_name, price_avg from match_store_price('백종원 제육볶음 만들기');
-- 제육볶음 · 15500
```

### 주의
- 금액을 지어내지 마세요. 조사한 값만 넣습니다
- `is_verified = false` 인 행은 `match_store_price()` 가 반환하지 않습니다 → 화면이 알아서 매장가 영역을 접습니다. 안전장치입니다
- 새벽엔 영업 매장이 적어 표본이 쏠립니다. 08시 이후에 조사

---

## BE-4 · LLM 정규화 연결 확인 〔P0〕

### 목표
비어 있던 LLM 층이 실제로 도는지 확인한다.

### 배경
PoC에서 `llm-normalize.js` 는 `eval/` 과 `probe/` 에서만 불렸습니다. 실제 파이프라인은 정규식 ALIASES만 썼습니다. **기획서 5.6의 "재료명 정규화 = LLM 사용(핵심)" 이 제품에는 없던 상태**였습니다.

v3의 `price/normalize.js` 가 이걸 연결합니다.

```
1단계  canonicalize()      정규식 ALIASES
2단계  lookup_alias()      DB 캐시 (지난 요청에서 LLM이 푼 것)
3단계  normalizeNames()    Gemini, 남은 것만 한 번에
         ↓
   성공 → cache_alias()        다음부터 2단계에서 잡힘
   실패 → record_unmatched()   다음에 뭘 추가할지 알려주는 목록
```

### 검증
```bash
node -e "
import('./src/lib/recipe/price/normalize.js').then(async ({resolveCanonicalNames}) => {
  const r = await resolveCanonicalNames(['다진마늘','통삼겹','동전육수','밥숟가락']);
  console.log(JSON.stringify(r.stats));
  for (const [k,v] of r.map) console.log(' ', k, '→', v);
});
"
```

### 완료 기준
```
{"total":4,"rule":2,"cache":0,"llm":1,"missed":1,"llmCalled":true}
  다진마늘 → 마늘        규칙
  통삼겹 → 돼지고기      규칙
  동전육수 → 코인육수    ← LLM이 품
  밥숟가락 → null        ← 재료가 아니므로 null 이 정답
```

한 번 더 돌리면 `llm:0, cache:1` — 캐시가 먹은 것입니다.

```sql
select alias, canonical_name, confidence, hit_count from ingredient_alias;
select raw_name, hit_count, reason from unmatched_ingredient order by hit_count desc;
```

### 주의
- `llmCalled: false` → `GEMINI_API_KEY` 없음
- `cache` 가 항상 0 → `SUPABASE_SECRET_KEY` 없음 (메모리 모드)
- LLM이 죽어도 서비스는 돌아야 합니다. 규칙 결과만 쓰고 넘어가는 코드가 이미 들어 있습니다
- **이름당 한 번만 호출**합니다. 재료마다 부르는 코드로 바꾸지 마세요

---

## BE-5 · 실제 파이프라인 켜기 〔P0〕

### 목표
목 응답에서 실제 계산으로 전환한다.

### 방법
`src/app/api/analyze/route.ts` 에서 한 줄:

```ts
const USE_MOCK = false
```

**FE는 아무것도 고칠 필요가 없습니다.** 어댑터가 PoC 출력을 계약 형태로 변환합니다.

### 검증
```bash
curl -X POST localhost:3000/api/analyze -H 'content-type: application/json' \
  -d '{"text":"재료\n돼지고기 삼겹살 500g\n양파 1개\n대파 1대\n고춧가루 1큰술"}' | jq
```

### 완료 기준
- `status: "success"`
- `data.ingredients[]` 에 `unitCost`·`packCost`·`priceConfidence` 가 채워짐
- `data.totals.ingredientTotal` 이 `ingredients` 의 `unitCost` 합과 일치
- `data.normalize` 에 통계
- KAMIS가 붙었으면 주재료의 `priceConfidence` 가 `"actual"`

---

## BE-6 · 블로그 경로 끄기 〔P1〕

### 목표
`resolve.js` 의 블로그 추적을 비활성화한다.

### 왜
기획 3.1에서 **블로그 URL 입력과 유튜브 내부의 블로그 링크 추적을 모두 제외**하기로 했습니다(약관 검토 필요). 그런데 코드는 아직 탑니다.

### 위치
`src/lib/recipe/fetch/resolve.js` — 끌 곳이 **세 군데**입니다.

| 줄 | 무엇 |
|---|---|
| ~50 | 입력이 블로그 URL일 때 (`parseVideoId` 실패 분기) |
| ~117 | `findRecipeLinks()` 로 설명란·댓글의 블로그 링크 수집 |
| ~118 | 그 링크로 `fetchBlog()` 호출 |

**`findRecipeLinks` 도 같이 꺼야 합니다.** `fetchBlog` 만 막으면 링크 수집은 계속 돌아 불필요한 파싱이 남습니다.

### 방법
경로를 지우지 말고 **플래그로 끄세요.** 나중에 되살릴 수 있게.

```js
const ENABLE_BLOG = false;   // 기획 3.1 — 약관 검토 전까지 비활성
```

- 입력이 블로그 URL이면 → `ok:false`, `reason:'BLOG_DISABLED'` 로 즉시 반환
- 3단계(연결된 블로그) 블록 전체를 `if (ENABLE_BLOG) { ... }` 로 감쌈
- `trail` 에 `step('linked-blog','연결된 블로그','skipped','기획 범위 제외')` 를 남겨두면 디버깅이 쉬움

### 완료 기준
- 블로그 URL을 넣으면 `no_recipe_found` 로 h4 화면
- 유튜브 처리 중 블로그 요청이 **한 건도 안 나감** (네트워크 로그로 확인)

---

## BE-7 · 데모 캐시 〔P0 · 협상 불가〕

### 목표
시연할 영상 3~5개의 파싱 결과를 미리 저장해, 당일 외부 API가 죽어도 시연이 되게 한다.

### 왜
고정 댓글은 **비공식 innertube API** 입니다. 키·엔드포인트가 예고 없이 바뀝니다. 발표 당일 아침에 깨지면 시연 자체가 불가능합니다. 유튜브 API 할당량 초과도 같은 결과입니다.

### 방법

**캐시하는 건 파싱 결과가 아니라 "원문"입니다.** 원문만 있으면 파서·가격이 평소대로 돕니다.

```js
// src/lib/recipe/fetch/demo-cache.js   (JSON 아님 — 번들 안전, seed.js 와 같은 이유)
export default {
  'abc123XYZ_1': { title: '돼지고기 김치찌개', channel: '집밥채널', text: '재료\n묵은지 300g\n...' },
  ...
};
```

`resolveRecipe()` **맨 앞**에서 봅니다. `parseVideoId` 직후, 네트워크를 타기 전입니다.

```js
import DEMO_CACHE from './demo-cache.js';

export async function resolveRecipe(input) {
  const trail = [];
  const videoId = parseVideoId(input);

  // 시연 안전망 — 캐시에 있으면 네트워크를 타지 않는다
  const cached = videoId && DEMO_CACHE[videoId];
  if (cached) {
    const ex = extractIngredients(cached.text, { source: 'youtube' });
    trail.push(step('cache', '데모 캐시', 'ok', `${cached.text.length}자`, ex.items.length));
    return {
      source: 'youtube', videoId, url: input,
      title: cached.title, channel: cached.channel,
      ok: true, text: cached.text,
      extraction: ex,              // ⚠️ 이거 빠뜨리면 analyze.js 가 터집니다
      trail, resolvedFrom: 'cache',
    };
  }
  ...
```

> ⚠️ **`extraction` 필드가 필수입니다.** `analyze.js` 가 `fetched.extraction` 을 바로 읽습니다. 반환 shape을 `resolveRecipe` 의 다른 return 문들과 맞추세요.

### 원문 뽑는 법

PoC 저장소에서 시연할 영상을 돌리고 `fetched.text` 를 꺼냅니다.

```bash
cd <PoC 저장소>
node --env-file=.env -e "
import('./src/analyze.js').then(async ({analyze}) => {
  const r = await analyze({ url: 'https://youtu.be/시연할영상' });
  console.log(JSON.stringify({
    title: r.fetched.title, channel: r.fetched.channel, text: r.fetched.text
  }, null, 2));
});
"
```

### 완료 기준
- 네트워크를 끊고 캐시된 영상 URL로 `/api/analyze` 호출 → 정상 결과
- 캐시에 없는 URL은 평소대로 동작
- `trail[0].name === 'cache'` 로 캐시를 탔는지 확인 가능

### 주의
캐시된 영상은 **팀이 실제로 시연할 것**이어야 합니다. 발표 대본과 맞추세요.

---

## BE-8 · 북마크 API 〔P1〕

### 목표
`GET/POST /api/bookmarks`, `DELETE /api/bookmarks/:id` 를 동작시킨다.

### 파일
이미 뼈대가 있습니다 — `src/app/api/bookmarks/`, `src/lib/data/bookmark.ts`

### ⚠️ 목록에 금액을 넣지 말 것

5-2가 "열 때마다 재계산"인데, **목록에서 5건의 금액을 보여주려면 `/api/analyze` 를 5번 부릅니다.** PoC 실측 4.3초 기준 목록 하나에 20초고, 유튜브 API 할당량도 5배로 씁니다.

목록은 **제목·인분수만**. 행을 클릭해 결과 화면으로 들어갈 때 계산합니다(5-4 "여는 시점 가격"과도 일치).

### 완료 기준
- 6개째 저장 시 `409` + `reason: "limit"` → FE가 b3 화면으로
- 비로그인 저장 시 `401` + `reason: "unauthorized"` → FE가 a1으로
- 같은 영상 중복 저장 시 `409` + `reason: "duplicate"`
- 삭제는 확인 없이 즉시, 되돌리기 없음

5개 제한은 **DB 트리거**가 막습니다. 앱에서 세지 마세요 — 동시 요청 시 뚫립니다.

---

## BE-9 · 카카오 로그인 〔P1〕

### 목표
로그인 · 로그아웃 · 회원탈퇴를 동작시킨다.

### 파일
`src/app/auth/callback/route.ts` · `signout/route.ts` · `src/app/api/account/delete/route.ts` (뼈대 있음)

### 설정 (코드보다 이게 오래 걸립니다)

**Kakao Developers**
1. 앱 생성 → REST API 키
2. 카카오 로그인 활성화
3. Redirect URI: `https://<프로젝트ref>.supabase.co/auth/v1/callback`
   ← **내 사이트 주소가 아닙니다.** 여기서 KOE006이 제일 많이 납니다
4. 보안 → Client Secret 생성 후 활성화
5. 동의항목: **닉네임·프로필 사진만.** 이메일은 비즈앱 전환 + 심사가 며칠 걸립니다

**Supabase**
- Authentication → Providers → Kakao: Client ID = REST API 키, Secret = 위 4번
- Authentication → URL Configuration → Redirect URLs 에 `http://localhost:3000/**` **와 배포 도메인** 둘 다
  ← 빠뜨리면 로그인은 되는데 돌아올 때 튕깁니다

### 완료 기준
```sql
select id, kakao_id, nickname from profiles;
```
로그인 후 행이 생기면 `auth.users` → 트리거 → `profiles` 가 정상입니다.

### 주의
회원탈퇴는 **서버가 세션에서 확인한 id만** 씁니다. 클라이언트가 보낸 userId를 쓰면 남의 계정을 지울 수 있습니다.

---

## BE-10 · Vercel 배포 〔P0〕

### 목표
배포본이 실제로 돈다.

### 체크리스트
- Framework Preset **`Next.js`** (`Other` 아님. Build Command·Output 기본값)
- 환경변수 7개 등록 (Production + Preview 둘 다)
- `/api/analyze` 에 `runtime = 'nodejs'`, `maxDuration = 60`
- 배포 후 실제 URL로 `curl` 한 번

### 자주 나는 사고
| 증상 | 원인 |
|---|---|
| 로컬은 되는데 배포본만 500 | Vercel 환경변수 미등록 |
| `Cannot find module 'node:fs'` | `runtime = 'nodejs'` 누락 |
| 빌드 자체가 안 됨 | Preset이 `Other` |
| 10초 타임아웃 | `maxDuration` 미설정 |

**오늘 안에 빈 페이지라도 한 번 배포해 보세요.** 발표 직전에 배포 문제를 만나면 방법이 없습니다.

---

# 3. 도메인 지식 (작업 중 참고)

## 두 개의 금액

| 이름 | 뜻 | 김치찌개 2인분 |
|---|---|---|
| 재료비 합계 (소모 원가) | 레시피에 실제 들어간 양만큼 | 12,854원 |
| 장바구니 금액 | 최소 판매 단위로 다 사면 | 42,250원 |

고춧가루 1스푼(274원)을 쓰려고 250g 한 봉지(9,800원)를 사야 하는 현실을 숨기지 않는 것이 이 서비스의 차별점입니다.

## 계산식 (`lib/calc.ts`)

```
재료비 합계 = Σ(체크된 재료의 원가) + (가격없는 재료가 체크됨 ? 직접입력액 : 0)
장바구니    = Σ(체크된 재료의 구매단위가격) + (동일)
절약        = max(사먹는가격 − 재료비합계, 0)
퍼센트      = (절약 ÷ 사먹는가격 × 100) 소수점 1자리
막대 채움   = min(재료비합계 ÷ 사먹는가격 × 100, 100)
1인분       = round(재료비합계 ÷ 인분수)
```

빈 값과 0은 같게 다룹니다.

## tier와 신뢰도는 다른 축

| tier | 출처 | confidence | 배지 |
|---|---|---|---|
| 1 | KAMIS Open API | `actual` | 실시세 |
| 2 | 시드 스냅샷 | `estimate` | 추정치 |
| 3 | 사용자 직접 입력 | `user` | 직접 입력 |

"1차인데 추정치"인 시드를 표현하려면 축이 둘이어야 합니다.

## 가격 커버리지 현실

```
표준 품목 63개
├─ 40개  KAMIS 매핑 있음  → 키 있으면 실시세
└─ 23개  시드만            → 영구 추정치
         간장·설탕·식용유·참기름·고추장·된장·굴소스·맛술·후추·
         케첩·버터·두부·김치·당면·떡볶이떡·어묵·표고버섯 등
```

23개가 영구 추정치인 이유: **참가격 API가 어떤 조합으로도 0건**을 뱉었습니다. 가공식품을 담당할 소스가 없습니다. 다행히 대부분 조미료라 소모량이 적어 금액 영향이 작습니다.

## 주재료 누락은 반드시 경고 (NFR-04)

주재료 하나가 가격 매칭에 실패하면 합계가 배 단위로 어긋납니다. 조미료는 배지를 생략해도 됩니다.

## PoC 실측 수치 (발표에서 쓸 값)

```
추출 성공률      60%   설명란 20% + 고정 댓글 40%
홀드아웃         재현율 95% / 정밀도 91%  ※ 버그 수정에 써서 오염됨
가격 커버리지    82%   그중 실제 공공데이터 45%
LLM 정규화       회수율 83% · 오답 0 · 환각 0%
LLM 추출 폴백    규칙 실패 13건 중 1건(8%) 복구 → 값어치 작음
```

---

# 4. 검증 명령 모음

> ⚠️ **맨 `node -e` 로 돌리면 환경변수가 안 읽힙니다.** `.env.local` 은 Next 실행 시에만
> 자동 로드됩니다. 반드시 `--env-file=.env.local` 을 붙이거나 `npm run` 스크립트를 쓰세요.
> 이걸 빼먹으면 `configured: false` · `llmCalled: false` 가 나오고 원인을 못 찾습니다.

```bash
# 빌드 · 타입
npm run build
npm run check

# 목 응답
curl -X POST localhost:3000/api/analyze -H 'content-type: application/json' \
  -d '{"url":"https://youtu.be/abc"}' | jq
curl -X POST 'localhost:3000/api/analyze?mock=notfound' -H 'content-type: application/json' -d '{"url":"https://youtu.be/abc"}'
curl -X POST 'localhost:3000/api/analyze?mock=nostore'  -H 'content-type: application/json' -d '{"url":"https://youtu.be/abc"}'

# 정규화 3단계   (npm run normalize 와 동일)
node --env-file=.env.local -e "import('./src/lib/recipe/price/normalize.js').then(async({resolveCanonicalNames})=>{const r=await resolveCanonicalNames(['다진마늘','통삼겹','동전육수','밥숟가락']);console.log(JSON.stringify(r.stats));for(const[k,v]of r.map)console.log(' ',k,'→',v)})"

# KAMIS 상태    (npm run kamis 와 동일)
node --env-file=.env.local -e "import('./src/lib/recipe/price/index.js').then(async m=>{await m.priceItem({name:'양파',qty:1,unit:'개',amount:{value:200,base:'g'}});console.log(JSON.stringify(m.kamisStatus(),null,2))})"

# 실제 텍스트로 전체 파이프라인
curl -X POST localhost:3000/api/analyze -H 'content-type: application/json' \
  -d '{"text":"재료\n돼지고기 삼겹살 500g\n양파 1개\n대파 1대\n고춧가루 1큰술"}' | jq '.data.totals, .data.normalize, .data.warnings'

# 통삼겹 회귀 테스트 — 주재료가 빠지지 않는지
curl -X POST localhost:3000/api/analyze -H 'content-type: application/json' \
  -d '{"text":"재료\n통삼겹 400g\n묵은지 300g\n대파 1대"}' \
  | jq '.data.ingredients[] | {rawText, name, unitCost}'
# 통삼겹 → 돼지고기 로 잡히고 unitCost 가 null 이 아니어야 함
```

```sql
-- 테이블 확인 (6개)
select table_name from information_schema.tables
where table_schema='public' and table_type='BASE TABLE' order by table_name;

-- 매장가 조사 현황
select menu_name, price_avg, is_verified from store_price order by is_verified desc, menu_name;

-- 별칭 캐시가 쌓이는지
select alias, canonical_name, confidence, hit_count from ingredient_alias order by created_at desc;

-- 다음에 뭘 표준 품목에 추가할지
select raw_name, hit_count, reason from unmatched_ingredient order by hit_count desc limit 20;

-- 제목 → 매장가 매칭
select menu_name, price_avg from match_store_price('백종원 김치찌개 레시피');
```

---

# 5. 순서 요약

```
P0  BE-1  PoC 이식 + v3 적용          40분
    BE-2  KAMIS 연결 확인             15분
    BE-3  매장가 5~6종                20분
    BE-4  LLM 정규화 확인             20분
    BE-5  USE_MOCK = false            5분
    BE-7  데모 캐시                   30분
    BE-10 Vercel 배포                 30분

P1  BE-6  블로그 경로 끄기            20분
    BE-8  북마크 API                  60분
    BE-9  카카오 로그인               60분
```

**BE-9(카카오)는 잘라도 핵심 시연이 됩니다.** 계산·결과 보기는 전부 비로그인으로 돌아갑니다. 시간이 부족하면 여기부터 버리세요.

**BE-3와 BE-7은 못 버립니다.** 매장가가 없으면 메인 화면이 비고, 데모 캐시가 없으면 당일 아침에 시연이 통째로 날아갈 수 있습니다.

발표 2시간 전부터는 **코드 동결**. 고치는 것만 합니다.
