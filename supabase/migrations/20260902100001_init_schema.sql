-- =============================================================
-- 레시비 (recibi.kr) — DB 스키마 v2
-- 2026-09-02 / 신규 기획 5.2 반영
--
-- v1 대비 변경
--   삭제  recipes · recipe_ingredients · cost_snapshots · unit_conversions
--         → 서버에 남는 사용자 데이터는 계정·북마크뿐 (5.2)
--         → 단위 환산은 src/parse/units.js 코드 테이블이 담당
--   추가  ingredient_alias        LLM 정규화 결과 캐시 (5.5)
--         unmatched_ingredient    LLM이 null을 준 이름 + 이유 수집 (5.5)
--         store_price 별칭 매칭   레시피 제목 → 메뉴 카테고리 (매장가 커버리지)
--   변경  price 에 tier / confidence 축 분리 (5.4)
--         ingredient 에 KAMIS 품종·등급 코드 + 밀도 · 개당 중량
-- =============================================================

-- -------------------------------------------------------------
-- 0. ENUM
-- -------------------------------------------------------------

-- 주재료 / 조미료 — NFR-04(주재료 매칭 실패 시 경고)를 가르는 축
create type public.ingredient_role as enum ('main', 'seasoning');

create type public.base_unit as enum ('g', 'ml', 'ea');

-- 신뢰도: tier(어디서 왔나)와 분리된 축 (5.4)
--   actual   실시세  — KAMIS 공표가
--   estimate 추정치  — 시드 스냅샷. 실제 시세와 최대 2.6배 차이가 확인됨
--   user     사용자값 — 화면에서 직접 입력
create type public.price_confidence as enum ('actual', 'estimate', 'user');

create type public.alias_source as enum ('rule', 'llm', 'manual');

create type public.bookmark_source as enum ('youtube', 'manual');

-- -------------------------------------------------------------
-- 0-1. 공통 트리거
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================
-- 1. profiles  (기획서의 `user` 테이블)
--    ⚠️ Postgres 에서 user 는 예약어라 테이블명으로 쓰면 매번 "user" 로
--       따옴표를 붙여야 한다. profiles 로 둔다.
--    카카오 인증 자체는 Supabase Auth(auth.users)가 처리한다.
-- =============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  kakao_id    text unique,
  nickname    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 첫 로그인이 곧 가입 (6-1)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, kakao_id, nickname)
  values (
    new.id,
    new.raw_user_meta_data ->> 'provider_id',
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'nickname',
      '사용자'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- 2. ingredient — 표준 품목 마스터
-- =============================================================
create table public.ingredient (
  id               bigint generated always as identity primary key,
  name             text not null,                                   -- 표준명
  role             public.ingredient_role not null default 'main',
  base_unit        public.base_unit not null default 'g',

  -- KAMIS 매칭 키
  -- ⚠️ 한 품목에 부위·등급 행이 여러 개다 (돼지 앞다리/삼겹/갈비/목심,
  --    소 안심/등심/설도 × 1++~1등급). item 만으로는 행이 안 정해지므로
  --    kind·rank 까지 지정해야 "어느 행을 쓸지"가 결정된다.
  kamis_item_code  text,
  kamis_kind_code  text,
  kamis_rank_code  text,

  -- 단위 환산 보조 (units.js 가 참조)
  density          numeric,   -- ml → g 계수. 없으면 1.0 가정
  piece_weight_g   numeric,   -- 개·대·모·포기 1개의 g. 셈 단위 품목에 필요

  is_verified      boolean not null default false,  -- 사람이 KAMIS 코드를 검수했는지
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index ingredient_name_key on public.ingredient (lower(name));
create index ingredient_role_idx on public.ingredient (role);

create trigger ingredient_set_updated_at
  before update on public.ingredient
  for each row execute function public.set_updated_at();

-- =============================================================
-- 3. ingredient_alias — 표기 오차 사전 (5.5)
--
--    LLM 정규화 결과가 여기 쌓여 캐시가 된다. 이름당 한 번만 호출하므로
--    운영이 길어질수록 LLM 호출이 0에 수렴한다.
--
--    ⚠️ 매칭은 반드시 '포함'으로 한다. 앵커(^)를 쓰면 안 된다.
--       PoC에서 `^삼겹살` 앵커 때문에 `통삼겹`을 놓쳐 주재료 600g(17,676원)이
--       통째로 빠졌고 소모원가가 8,522원 → 26,198원으로 3배 어긋났다.
-- =============================================================
create table public.ingredient_alias (
  id             bigint generated always as identity primary key,
  alias          text not null,
  ingredient_id  bigint not null references public.ingredient(id) on delete cascade,
  source         public.alias_source not null default 'rule',
  -- LLM 결과의 확신도. 애플리케이션은 0.6 미만을 채택하지 않는다 (5.5)
  confidence     numeric not null default 1.0 check (confidence >= 0 and confidence <= 1),
  created_at     timestamptz not null default now()
);

create unique index ingredient_alias_key on public.ingredient_alias (lower(alias));
create index ingredient_alias_ingredient_idx on public.ingredient_alias (ingredient_id);
-- 채택 가능한 별칭만 빠르게 훑기
create index ingredient_alias_usable_idx
  on public.ingredient_alias (lower(alias)) where confidence >= 0.6;

-- =============================================================
-- 4. unmatched_ingredient — 매칭 실패 수집함 (5.5)
--
--    LLM이 null 을 준 이름과 이유를 모은다.
--    "브랜드명을 제외한 춘장은 표준 품목 목록에 없습니다" 같은 응답이
--    가격 DB에 무엇을 추가해야 하는지 알려주는 목록이 된다.
--    hit_count 가 쌓인 것이 곧 자동화 후보 승격 대상이다 (2.3).
-- =============================================================
create table public.unmatched_ingredient (
  id            bigint generated always as identity primary key,
  raw_name      text not null,
  reason        text,                                  -- LLM이 준 이유
  confidence    numeric,                               -- 임계값 미달로 버려진 경우 그 값
  hit_count     integer not null default 1,
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create unique index unmatched_ingredient_key on public.unmatched_ingredient (lower(raw_name));
create index unmatched_ingredient_rank_idx on public.unmatched_ingredient (hit_count desc);

-- 파이프라인에서 한 줄로 호출. 있으면 카운트 증가, 없으면 삽입.
create or replace function public.record_unmatched(
  p_raw_name   text,
  p_reason     text default null,
  p_confidence numeric default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.unmatched_ingredient (raw_name, reason, confidence)
  values (p_raw_name, p_reason, p_confidence)
  on conflict (lower(raw_name)) do update
    set hit_count    = public.unmatched_ingredient.hit_count + 1,
        last_seen_at = now(),
        reason       = coalesce(excluded.reason, public.unmatched_ingredient.reason);
end;
$$;

-- =============================================================
-- 5. price — 재료당 1행 (ingredient 1:1)
--
--    tier 와 confidence 는 다른 질문에 답한다 (5.4).
--      tier 1 = KAMIS Open API      / confidence actual
--      tier 2 = 시드 스냅샷·크롤링   / confidence estimate
--      tier 3 = 사용자 직접 입력     / confidence user
--    화면 배지는 두 값을 함께 읽는다 (NFR-05).
-- =============================================================
create table public.price (
  ingredient_id  bigint primary key references public.ingredient(id) on delete cascade,

  unit_price     numeric not null,                 -- 원 / base_unit 1단위
  unit           public.base_unit not null default 'g',

  tier           smallint not null check (tier in (1, 2, 3)),
  confidence     public.price_confidence not null,

  -- 장바구니 금액용 (5.7). 고춧가루 1스푼 274원 vs 250g 한 봉지 9,800원
  pack_size      numeric,
  pack_unit      public.base_unit,
  pack_price     integer,

  surveyed_on    date not null,                    -- 조회일 — 화면에 "N월 N일 기준"으로 노출
  source_note    text,                             -- 'KAMIS 등심 1등급', '시드 v1' 등
  updated_at     timestamptz not null default now()
);

create index price_confidence_idx on public.price (confidence);

create trigger price_set_updated_at
  before update on public.price
  for each row execute function public.set_updated_at();

-- 재료 + 가격 + 신뢰도를 한 번에. 파이프라인이 이 뷰만 읽으면 된다.
create view public.ingredient_price
with (security_invoker = true) as
select
  i.id, i.name, i.role, i.base_unit,
  i.density, i.piece_weight_g,
  p.unit_price, p.unit as price_unit,
  p.tier, p.confidence,
  p.pack_size, p.pack_unit, p.pack_price,
  p.surveyed_on
from public.ingredient i
left join public.price p on p.ingredient_id = i.id;

-- =============================================================
-- 6. store_price — 사 먹는 가격
--
--    ⚠️ 레시피 단위가 아니라 **메뉴 카테고리 단위**로 잡는다.
--       레시피별 고정값이면 사용자가 처음 넣는 유튜브 영상에 매장가가 없어
--       r1(절약 금액) 화면이 성립하지 않는다.
--       aliases 로 레시피 제목을 매칭해 커버리지를 확보한다.
-- =============================================================
create table public.store_price (
  id             bigint generated always as identity primary key,
  menu_key       text not null,                          -- 'kimchi-jjigae'
  menu_name      text not null,                          -- '김치찌개'
  -- 레시피 제목 매칭용. 긴 별칭이 우선한다 (돼지고기김치찌개 > 김치찌개)
  aliases        text[] not null default '{}',
  servings       integer not null default 2,

  price_min      integer,
  price_max      integer,
  price_avg      integer,                                -- 계산에 쓰는 값
  delivery_fee   integer not null default 0,             -- price_avg 에 포함된 배달비
  sample_size    integer not null default 0,             -- 표본 수. 0이면 미조사
  surveyed_on    date,
  is_verified    boolean not null default false,         -- 실제 조사 완료 여부

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint store_price_range_check check (
    price_min is null or price_max is null or price_avg is null
    or (price_min <= price_avg and price_avg <= price_max)
  ),
  -- 조사 완료로 표시하려면 금액이 채워져 있어야 한다
  constraint store_price_verified_needs_prices check (
    not is_verified or (price_min is not null and price_max is not null and price_avg is not null)
  )
);

create unique index store_price_menu_key on public.store_price (lower(menu_key));
create index store_price_aliases_idx on public.store_price using gin (aliases);

create trigger store_price_set_updated_at
  before update on public.store_price
  for each row execute function public.set_updated_at();

-- 레시피 제목 → 매장가 1건. 가장 긴 별칭이 걸린 행을 고른다.
-- 조사 완료(is_verified)된 행만 반환하므로, 없으면 화면에서 매장가 영역을 접는다.
create or replace function public.match_store_price(recipe_title text)
returns setof public.store_price
language sql stable as $$
  select sp.*
  from public.store_price sp
  where sp.is_verified
    and exists (
      select 1 from unnest(sp.aliases) a
      where recipe_title ilike '%' || a || '%'
    )
  order by (
    select max(length(a)) from unnest(sp.aliases) a
    where recipe_title ilike '%' || a || '%'
  ) desc
  limit 1;
$$;

-- =============================================================
-- 7. bookmark — 사용자당 최대 5개 (5-1)
--    금액은 저장하지 않는다. 여는 시점 가격으로 재계산한다 (5-4).
--    ⚠️ b1 목록에서는 금액을 표시하지 말 것 — 5건이면 /api/analyze 5회 호출이다.
-- =============================================================
create table public.bookmark (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  source_type  public.bookmark_source not null,
  source_url   text,
  servings     integer not null default 1 check (servings > 0),
  created_at   timestamptz not null default now(),

  constraint bookmark_youtube_needs_url
    check (source_type <> 'youtube' or source_url is not null)
);

create index bookmark_user_idx on public.bookmark (user_id, created_at desc);
-- 같은 영상을 두 번 저장하지 않는다 (직접 입력은 source_url 이 null 이라 제한 없음)
create unique index bookmark_user_url_key
  on public.bookmark (user_id, source_url) where source_url is not null;

create or replace function public.enforce_bookmark_limit()
returns trigger language plpgsql as $$
declare
  current_count integer;
begin
  select count(*) into current_count
  from public.bookmark where user_id = new.user_id;

  if current_count >= 5 then
    raise exception '북마크는 최대 5개까지 저장할 수 있어요. 기존 북마크를 삭제한 뒤 다시 시도해 주세요.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger bookmark_limit_check
  before insert on public.bookmark
  for each row execute function public.enforce_bookmark_limit();
