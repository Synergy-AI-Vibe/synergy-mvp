# Synergy 저장소에 v3 적용

메인은 Synergy(Next.js)입니다. PoC 는 **로직 공급처**로만 쓰고, 배포되는 건 Synergy 하나입니다.

전체 25분.

---

## 순서가 중요합니다

```
① PoC 의 src/*  →  Synergy 의 src/lib/recipe/     (통째로 복사)
② 이 압축을 Synergy 루트에서 풀기               (①의 4개 파일을 덮어씀)
```

**①을 먼저, ②를 나중에.** 순서를 바꾸면 v3 수정본이 PoC 원본으로 덮여서 LLM 연결이 사라집니다.

---

# 1. PoC 로직 옮기기 (3분)

PoC 파일들은 서로 상대경로(`./index.js`, `../parse/units.js`)로 물려 있습니다. **한 폴더로 통째로** 옮기면 그대로 돕니다.

```bash
cd /c/Synergy
mkdir -p src/lib/recipe
cp -r <PoC경로>/src/* src/lib/recipe/
ls src/lib/recipe
```

이렇게 보여야 합니다.

```
analyze.js  env.js  fetch/  llm/  parse/  price/
```

---

# 2. v3 풀기 (2분)

**Synergy 저장소 루트에서** 압축을 풉니다. 경로가 이미 맞춰져 있어서 그대로 자리를 찾아갑니다.

```bash
cd /c/Synergy
unzip -o <다운로드>/synergy-v3.zip
```

`-o` 는 덮어쓰기입니다. 1번에서 복사한 PoC 파일 중 4개가 v3 수정본으로 바뀝니다.

| 덮어쓰는 파일 | 무엇이 바뀌나 |
|---|---|
| `src/lib/recipe/analyze.js` | 정규화를 가격 조회 전에 배치로 (7줄 추가) |
| `src/lib/recipe/price/index.js` | `canonicalMap` 주입 받도록 (3줄) |
| `src/lib/recipe/price/normalize.js` | 🆕 3단계 통합 |
| `src/lib/recipe/price/alias-store.js` | 🆕 캐시 저장소 |

## 안 쓰는 파일 삭제

v2 때 드린 것 중 **PoC 가 대체하는 것들**입니다. 남겨두면 컴파일이 깨집니다.

```bash
rm -f src/lib/data/ingredient.ts src/lib/data/price.ts
rm -f src/lib/services/normalize-service.ts src/lib/services/analyze-service.ts
rm -rf src/lib/fetch src/lib/parse src/lib/llm
rm -f src/types/pipeline.ts
```

---

# 3. 패키지 · DB (5분)

```bash
npm i @supabase/supabase-js @supabase/ssr server-only

npx supabase db push --dry-run     # 20260903000001 하나만 떠야 정상
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.ts
```

**확인** — SQL Editor 에서 테이블이 **6개**여야 합니다.

```sql
select table_name from information_schema.tables
where table_schema='public' and table_type='BASE TABLE' order by table_name;
-- bookmark · ingredient_alias · profiles · store_price · team_members · unmatched_ingredient
```

`ingredient` 와 `price` 가 사라졌으면 성공입니다.

---

# 4. 환경변수 (3분)

`.env.local` **과 Vercel 양쪽에** 넣습니다. 배포본만 500 나는 사고가 여기서 납니다.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

YOUTUBE_API_KEY=
GEMINI_API_KEY=
KAMIS_API_KEY=
KAMIS_API_ID=
```

**키가 하나도 없어도 서비스는 돕니다.** 커버리지만 떨어집니다.

| 없으면 | 결과 |
|---|---|
| `SUPABASE_SECRET_KEY` | 별칭 캐시가 메모리로 → 서버리스에서 매 요청 LLM 재호출 |
| `GEMINI_API_KEY` | 1·2단계만 (규칙 + 캐시) |
| `YOUTUBE_API_KEY` | 데이터센터 IP 는 봇 차단 → 사실상 필수 |
| `KAMIS_API_KEY` | 시드 스냅샷으로 폴백. 배지가 전부 "추정치" |

---

# 5. 빌드 · 검증 (7분)

```bash
npm run build
```

## 5-1. 목 응답 (PoC 연결 전)

```bash
npm run dev
curl -X POST localhost:3000/api/analyze \
  -H 'content-type: application/json' -d '{"url":"https://youtu.be/abc"}'
```

`?mock=notfound` 로 h4, `?mock=nostore` 로 매장가 없는 케이스도 확인됩니다.

**여기까지 되면 FE 에 통보하세요.** FE 는 이 시점부터 11시간 내내 돌아갑니다.

## 5-2. 정규화 3단계

```bash
node -e "
import('./src/lib/recipe/price/normalize.js').then(async ({resolveCanonicalNames}) => {
  const r = await resolveCanonicalNames(['다진마늘','통삼겹','동전육수','밥숟가락']);
  console.log(JSON.stringify(r.stats));
  for (const [k,v] of r.map) console.log(' ', k, '→', v);
});
"
```

**GEMINI 키가 있을 때 이렇게 나와야 합니다.**

```
{"total":4,"rule":2,"cache":0,"llm":1,"missed":1,"llmCalled":true}
  다진마늘 → 마늘        규칙
  통삼겹 → 돼지고기      규칙
  동전육수 → 코인육수    ← LLM
  밥숟가락 → null        ← 재료가 아니므로 null 이 정답
```

한 번 더 돌리면 `llm:0, cache:1` 로 바뀝니다 — 캐시가 먹은 겁니다.

## 5-3. 실제 파이프라인 켜기

`src/app/api/analyze/route.ts` 에서 한 줄만 바꿉니다.

```ts
const USE_MOCK = false
```

**FE 는 아무것도 고칠 필요가 없습니다.** 어댑터가 PoC 출력을 계약 형태로 변환합니다.

---

# 구조

```
src/
├── types/
│   ├── api.ts              ★ FE 계약 (BE 소유)
│   └── database.ts           gen types 로 생성
│
├── lib/
│   ├── calc.ts             ★ 5.7 계산식. FE 와 공용
│   ├── recipe-adapter.ts   ★ PoC 출력 → 계약 변환
│   ├── mock/analyze.ts       목 응답
│   ├── supabase/             client · server · admin
│   ├── data/                 store-price · unmatched · bookmark
│   └── recipe/             ← PoC 로직 통째로
│       ├── analyze.js        진입점
│       ├── fetch/ parse/ llm/
│       └── price/            index · kamis · kamis-map · seed
│                             llm-normalize · normalize · alias-store
└── app/
    ├── api/analyze/route.ts  ★
    ├── api/bookmarks/**  ·  api/account/delete
    └── auth/callback  ·  auth/signout
```

**어댑터를 둔 이유** — PoC 를 손대지 않아도 되고(홀드아웃 95%/91% 로직 보존), FE 는 PoC 내부를 몰라도 되며, 나중에 파이프라인을 바꿔도 이 파일만 고치면 됩니다.

---

# 검증 결과

로컬에서 실제로 돌려 확인했습니다.

**타입** — 21개 파일 strict 통과 (PoC 를 `lib/recipe/` 에 둔 상태)

**PoC 실코퍼스**

```
제육볶음   소모원가 12,548원 · 장바구니 30,450원 · 커버리지 54%
           어댑터 변환 후 ingredientTotal 12,548  ✅ PoC 와 일치
닭볶음탕   소모원가 12,748원 · 장바구니 42,200원 · 커버리지 67%
```

**정규화 3단계** — 규칙 2 · 캐시 1 · 미매칭 1 (캐시 경로 동작 확인)

**DB** — v2→v3 마이그레이션, `lookup_alias`/`cache_alias` 왕복, 히트 카운트, 중복 차단, 매장가 매칭, 북마크 5개 제한, RLS 5/5 전부 통과

---

# 고쳐 둔 것 하나

실코퍼스에서 **`"야채와 고기 준비하기"` 같은 조리 단계 문장이 재료로 잡혀** 주재료 경고에 뜨고 있었습니다. 사용자에게 "이 재료는 비교 금액에 포함되지 않았어요" 라고 뜨는데 실제로는 빠진 재료가 아닙니다.

어댑터에 값싼 안전망을 넣었습니다. 원칙적으로는 LLM 이 null 을 내면서 걸러주지만(5.5), 키가 없을 때를 대비한 것입니다.

전체 코퍼스로 확인한 결과 **잔여물 2건만 숨기고 진짜 미매칭 50건은 경고를 유지**합니다. 진짜 재료를 잘못 숨기지 않습니다.

---

# 자주 막히는 지점

| 증상 | 원인 |
|---|---|
| `Cannot find module 'node:fs'` | 라우트에 `export const runtime = 'nodejs'` 누락 |
| `Cannot find module '@/lib/recipe/analyze.js'` | 1번을 안 했거나 경로가 다름 |
| LLM 연결이 사라짐 | 순서가 반대 — ② 풀고 ① 복사했음. 다시 ② |
| `relation "ingredient" does not exist` | `lib/data/{ingredient,price}.ts` 안 지움 |
| `db push` 에 20260902 것들이 또 뜸 | 앞 마이그레이션 파일을 지웠음 → 되돌리기 |
| 배포본만 500 | Vercel 환경변수 미등록 |
| `llmCalled` 계속 false | `GEMINI_API_KEY` 미설정 |
| `cache` 항상 0 | `SUPABASE_SECRET_KEY` 없음 → 메모리 모드 |
| 배지가 전부 "추정치" | KAMIS 키 없음 → 시드 폴백 (정상 동작) |

---

# 아직 남은 것

```
1. 매장가 5~6종 조사 → store_price     ← PoC 에 없는 기능. 없으면 r1 이 빔
2. resolve.js 의 블로그 경로 끄기        ← 기획 3.1 제외 결정인데 코드는 아직 탐
3. r4 조리법                            ← PoC 는 조리 단계를 추출하지 않음. 원문만 접어서
4. 데모 영상 3~5개 파싱 결과 캐시
```
