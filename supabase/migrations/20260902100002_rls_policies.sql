-- =============================================================
-- RLS 정책 v2
--
-- 원칙
--   * 마스터·가격 데이터는 누구나 읽고, 쓰기는 service_role 만.
--     → 계산은 비로그인으로도 돌아야 하므로(3.1) 읽기는 전면 공개.
--     → INSERT/UPDATE 정책을 만들지 않는 것이 곧 잠금이다.
--   * 사용자 데이터(profiles, bookmark)는 본인 것만.
--   * unmatched_ingredient 는 읽기도 막는다 — 운영 데이터라 사용자에게 보일 이유가 없다.
-- =============================================================

alter table public.profiles             enable row level security;
alter table public.ingredient           enable row level security;
alter table public.ingredient_alias     enable row level security;
alter table public.unmatched_ingredient enable row level security;
alter table public.price                enable row level security;
alter table public.store_price          enable row level security;
alter table public.bookmark             enable row level security;

-- -------------------------------------------------------------
-- profiles
-- -------------------------------------------------------------
create policy "본인 프로필 조회"
  on public.profiles for select
  using (auth.uid() = id);

create policy "본인 프로필 수정"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 회원탈퇴(6-4)는 서버 라우트에서 secret 키로 auth.admin.deleteUser() 호출.
-- auth.users 삭제 → profiles → bookmark 까지 cascade 로 정리된다.

-- -------------------------------------------------------------
-- 마스터 · 가격 — 읽기 전면 공개 (비로그인 계산 필요)
-- -------------------------------------------------------------
create policy "재료 마스터 공개 조회"
  on public.ingredient for select using (true);

create policy "별칭 사전 공개 조회"
  on public.ingredient_alias for select using (true);

create policy "가격 공개 조회"
  on public.price for select using (true);

create policy "매장가 공개 조회"
  on public.store_price for select using (true);

-- 쓰기 정책 없음 → service_role 만 가능
--   · KAMIS 배치 적재         → price
--   · LLM 정규화 결과 캐시    → ingredient_alias
--   · 매칭 실패 수집          → unmatched_ingredient (record_unmatched 함수)

-- -------------------------------------------------------------
-- unmatched_ingredient — 운영 전용. 정책 없이 RLS만 켠다 (service_role 전용)
-- -------------------------------------------------------------

-- -------------------------------------------------------------
-- bookmark — 본인 것만
-- -------------------------------------------------------------
create policy "내 북마크 조회"
  on public.bookmark for select
  to authenticated
  using (user_id = auth.uid());

create policy "내 북마크 추가"
  on public.bookmark for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "내 북마크 삭제"
  on public.bookmark for delete
  to authenticated
  using (user_id = auth.uid());

-- -------------------------------------------------------------
-- 함수 실행 권한
-- -------------------------------------------------------------
-- 매장가 매칭은 비로그인 계산에도 필요하다
grant execute on function public.match_store_price(text) to anon, authenticated;

-- 매칭 실패 수집은 서버(service_role)만
revoke execute on function public.record_unmatched(text, text, numeric) from public, anon, authenticated;
