-- =============================================================
-- 스키마 v3 — PoC 실물 확인 후 단순화
-- 2026-09-03
--
-- 왜 줄이나
--   PoC 의 canonicalize()/ALIASES · KAMIS_MAP · seed.js 가
--   v2 의 ingredient · ingredient_alias · price 와 하는 일이 겹칩니다.
--   그런데 PoC 쪽이 더 정교합니다 —
--     · KAMIS 부위·등급 행 선택 (byRawName, rank)
--     · 셈 단위 → g 환산 (countWeight)
--     · 무게↔부피 단위 어긋남 근사 + issues 배열
--   DB로 옮기면 이걸 전부 다시 짜야 하므로, 가격·정규화는 코드에 둡니다.
--
-- 그래서 DB는 PoC가 못 하는 것만 맡습니다
--   profiles · bookmark        계정 (PoC에 없음)
--   store_price                매장가 (PoC에 없음 — 사용자 입력뿐)
--   ingredient_alias           LLM 정규화 캐시
--                              ※ 서버리스는 요청마다 메모리가 날아가므로
--                                 캐시가 DB에 있어야 호출이 0에 수렴합니다
--   unmatched_ingredient       매칭 실패 누적 수집
--
-- 삭제
--   ingredient · price · ingredient_price(뷰)
--   → PoC 의 CANONICAL_LIST 와 seed.js 가 담당합니다.
--
-- ⚠️ ingredient_alias 는 FK 대신 canonical_name(text) 을 씁니다.
--    표준 품목명의 주인은 코드(PoC CANONICAL_LIST)입니다.
--    DB에 63종을 복제해 두면 코드와 어긋날 때 조용히 깨집니다.
--    대신 코드가 캐시를 읽을 때 CANONICAL_NAMES 에 있는지 한 번 검증합니다.
-- =============================================================

-- -------------------------------------------------------------
-- 1. v2 잔재 정리  (team_members 는 건드리지 않습니다)
-- -------------------------------------------------------------
drop view  if exists public.ingredient_price;
drop table if exists public.price cascade;
drop table if exists public.ingredient_alias cascade;   -- FK 없는 형태로 재생성
drop table if exists public.ingredient cascade;

drop type if exists public.price_confidence;
drop type if exists public.ingredient_role;

-- -------------------------------------------------------------
-- 2. ingredient_alias — LLM 정규화 캐시
--
--    PoC 흐름:  canonicalize()  규칙 ALIASES
--                 ↓ null 이면
--               이 테이블 조회
--                 ↓ 없으면
--               normalizeNames()  Gemini → 여기 저장
--
--    이름당 한 번만 LLM을 부르므로 운영이 길어질수록 호출이 0에 수렴합니다.
-- -------------------------------------------------------------
create table public.ingredient_alias (
  id              bigint generated always as identity primary key,
  /** 레시피 원문에 나온 표기. 정규화 키 */
  alias           text not null,
  /** PoC CANONICAL_LIST 의 표준 품목명. FK 없음 — 주인은 코드 */
  canonical_name  text not null,
  source          text not null default 'llm' check (source in ('rule', 'llm', 'manual')),
  /** PoC minConfidence 와 같은 임계값 0.6. 미만은 애초에 저장하지 않습니다 */
  confidence      numeric not null default 1.0 check (confidence >= 0 and confidence <= 1),
  reason          text,
  hit_count       integer not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index ingredient_alias_key on public.ingredient_alias (lower(alias));
create index ingredient_alias_canonical_idx on public.ingredient_alias (canonical_name);

-- 캐시 조회 + 히트 카운트. 있으면 표준명, 없으면 null
create or replace function public.lookup_alias(p_alias text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  found text;
begin
  update public.ingredient_alias
     set hit_count = hit_count + 1, updated_at = now()
   where lower(alias) = lower(p_alias)
   returning canonical_name into found;
  return found;
end;
$$;

-- LLM 결과 저장. 이미 있으면 무시합니다
create or replace function public.cache_alias(
  p_alias          text,
  p_canonical_name text,
  p_confidence     numeric default 1.0,
  p_reason         text default null
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.ingredient_alias (alias, canonical_name, source, confidence, reason)
  values (p_alias, p_canonical_name, 'llm', p_confidence, p_reason)
  on conflict (lower(alias)) do nothing;
$$;

-- -------------------------------------------------------------
-- 3. unmatched_ingredient — 매칭 실패 수집 (v2 그대로 유지)
--    LLM 이 null 을 주면서 남긴 reason 이
--    "다음에 뭘 표준 품목에 추가할지" 알려주는 목록이 됩니다.
-- -------------------------------------------------------------
-- (v2 에서 이미 생성됨. 스키마 변경 없음)

-- -------------------------------------------------------------
-- 4. store_price — 매장가 (v2 그대로 유지)
--    PoC 에는 이 기능이 아예 없습니다. 신규 구현 대상입니다.
-- -------------------------------------------------------------
-- (v2 에서 이미 생성됨. match_store_price() 도 그대로)

-- -------------------------------------------------------------
-- 5. RLS
-- -------------------------------------------------------------
alter table public.ingredient_alias enable row level security;

-- 정규화는 비로그인 계산에도 필요하므로 읽기는 공개
create policy "별칭 캐시 공개 조회"
  on public.ingredient_alias for select using (true);

-- 쓰기 정책 없음 → service_role(secret 키)만 씁니다
-- 함수는 security definer 라 anon 도 실행은 됩니다
grant execute on function public.lookup_alias(text) to anon, authenticated;
revoke execute on function public.cache_alias(text, text, numeric, text) from public, anon, authenticated;

-- -------------------------------------------------------------
-- 6. 확인
-- -------------------------------------------------------------
/*
select table_name from information_schema.tables
where table_schema='public' and table_type='BASE TABLE' order by table_name;
-- bookmark · ingredient_alias · profiles · store_price · team_members · unmatched_ingredient

select public.lookup_alias('동전육수');            -- null (아직 캐시 없음)
select public.cache_alias('동전육수','코인육수',1.0,'테스트');
select public.lookup_alias('동전육수');            -- '코인육수'
select alias, canonical_name, hit_count from public.ingredient_alias;
*/
