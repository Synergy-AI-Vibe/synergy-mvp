"use client";

import { useState } from "react";
import { pantryRecommendedChips } from "@/lib/data/recibi/ingredients";
import { searchPantryRecipes } from "@/lib/services/recibi/pantry-service";
import { formatWon } from "@/lib/calc";
import { Chip, ChipAddInput } from "@/components/recibi/ui/Chip/Chip";
import { Button } from "@/components/recibi/ui/Button/Button";
import { TextLink } from "@/components/recibi/ui/TextLink/TextLink";
import { ListRow } from "@/components/recibi/ui/ListRow/ListRow";
import { Tag } from "@/components/recibi/ui/Tag/Tag";
import { NoticeCard } from "@/components/recibi/ui/NoticeCard/NoticeCard";
import { Skeleton } from "@/components/recibi/ui/Skeleton/Skeleton";
import type { ChosenPantryIngredient, PantryMatch } from "@/types/recibi";

const PANTRY_LIMIT = 5;

const RESULT_SECTION = "container pb-[clamp(48px,7vw,80px)]";
const ADD_HINT = "목록에 없는 재료는 직접 입력하고 Enter를 누르세요. 10자까지.";
const LEAD =
  "가진 재료를 최대 5개까지 고르고 찾기를 누르면,\n그걸로 만들 수 있는 레시피를 추가로 사야 하는 금액 순으로 보여줍니다.";

// p1 시작 · p2 결과 · p3 결과 없음 · p4 5개 가득 — 전부 이 화면의 상태다 (02_동작규칙 7항, SUB)
export default function PantryPage() {
  const [chosen, setChosen] = useState<ChosenPantryIngredient[]>([]);
  const [results, setResults] = useState<PantryMatch[] | null>(null); // null = 아직 안 찾음(p1)
  const [isSearching, setIsSearching] = useState(false);
  const [duplicateHint, setDuplicateHint] = useState<string | null>(null);

  const isFull = chosen.length >= PANTRY_LIMIT;
  const chosenLabels = new Set(chosen.map((c) => c.label.trim().toLowerCase()));

  function addIngredient(label: string, ingredientId?: string) {
    if (isFull) return;
    const key = label.trim().toLowerCase();
    if (chosenLabels.has(key)) {
      setDuplicateHint("이미 담긴 재료입니다");
      return;
    }
    setDuplicateHint(null);
    setChosen((prev) => [...prev, { id: `${Date.now()}-${label}`, label: label.trim(), ingredientId }]);
    setResults(null); // 7-3: 재료를 고치면 결과가 사라짐
  }

  function removeIngredient(id: string) {
    setChosen((prev) => prev.filter((c) => c.id !== id));
    setDuplicateHint(null);
    setResults(null);
  }

  async function handleSearch() {
    if (chosen.length === 0) return;
    setIsSearching(true);
    const matches = await searchPantryRecipes(chosen);
    setResults(matches);
    setIsSearching(false);
  }

  function resetAll() {
    setChosen([]);
    setResults(null);
    setDuplicateHint(null);
  }

  // 상자 안 안내는 한 줄뿐이라 중복 → 가득 참 → 기본 순으로 덮어쓴다
  const boxHint =
    duplicateHint ??
    (isFull ? `재료 ${PANTRY_LIMIT}개를 모두 골랐습니다. 하나를 지우면 다시 입력할 수 있습니다.` : ADD_HINT);

  return (
    <main className="shrink-0 grow basis-auto">
      <section className="container pt-[clamp(34px,5vw,52px)]">
        <h1 className="mb-2 text-[clamp(21px,2.6vw,26px)] font-black tracking-[-0.035em]">
          있는 재료로 찾기
        </h1>
        <p className="mb-[22px] text-[13px] leading-[1.7] whitespace-pre-line text-text-2">{LEAD}</p>

        {/* 고른 재료는 한 상자 안에 — 라벨·입력칸·담은 칩·안내가 한 덩어리로 읽혀야 한다 */}
        <div className="mb-[14px] border border-line-strong px-[18px] py-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <b className="text-[11.5px] leading-none font-bold tracking-[0.05em] text-text-2">
              고른 재료 {chosen.length} / {PANTRY_LIMIT}
            </b>
            {isFull && (
              <span className="text-[11.5px] leading-none font-medium text-accent">
                {PANTRY_LIMIT}개까지 고를 수 있습니다
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ChipAddInput disabled={isFull} onAdd={(value) => addIngredient(value)} />
            {chosen.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                selected
                onRemove={() => removeIngredient(item.id)}
              />
            ))}
          </div>
          <p className={`mt-2.5 text-xs leading-[1.7] ${duplicateHint ? "text-accent" : "text-text-2"}`}>
            {boxHint}
          </p>
        </div>

        <p className="mb-[9px] text-xs leading-[1.7] text-text-2">자주 쓰는 재료</p>
        <div className="mb-[22px] flex flex-wrap items-center gap-2">
          {pantryRecommendedChips
            .filter((label) => !chosenLabels.has(label.toLowerCase()))
            .map((label) => (
              <Chip
                key={label}
                label={label}
                addable
                disabled={isFull}
                onClick={() => addIngredient(label)}
              />
            ))}
        </div>

        <div className="mt-[22px] mb-[34px] flex flex-wrap items-center gap-3">
          <Button className="px-[30px]" onClick={handleSearch} disabled={chosen.length === 0 || isSearching}>
            {isSearching ? "찾는 중" : "레시피 찾기"}
          </Button>
          {chosen.length > 0 && (
            <TextLink onClick={resetAll} disabled={isSearching}>
              모두 지우기
            </TextLink>
          )}
        </div>
      </section>

      {isSearching && (
        <section className={RESULT_SECTION}>
          <div className="flex flex-col gap-3" aria-hidden="true">
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        </section>
      )}

      {!isSearching && results !== null && results.length === 0 && (
        <section className={RESULT_SECTION}>
          <NoticeCard
            eyebrow="찾지 못했어요"
            title="이 재료로 만들 수 있는 레시피가 없어요"
            description={"고른 재료가 겹치는 레시피를 찾지 못했습니다.\n주재료를 하나 더 넣거나, 레시피 링크로 바로 계산해 보세요."}
          >
            <div className="flex flex-wrap gap-2.5">
              <Button size="sm" onClick={resetAll}>
                재료 다시 고르기
              </Button>
              <TextLink href="/">링크로 계산하기</TextLink>
            </div>
          </NoticeCard>
        </section>
      )}

      {!isSearching && results !== null && results.length > 0 && (
        <section className={RESULT_SECTION}>
          <div className="mb-[14px] flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[17px] font-black tracking-[-0.02em]">만들 수 있는 레시피</h2>
            <span className="text-[12.5px] text-text-2">
              추가 구매 금액이 적은 순 {results.length}개
            </span>
          </div>
          <ul className="border-t border-line-strong">
            {results.map((match) => (
              <ListRow
                key={match.recipe.id}
                title={match.recipe.title}
                titleTag={
                  <Tag variant={match.missing.length === 0 ? "ready" : "missing"}>
                    {match.missing.length === 0 ? "지금 바로 가능" : `부족 ${match.missing.length}개`}
                  </Tag>
                }
                meta={
                  match.missing.length === 0
                    ? `가진 재료 ${match.recipe.requiredIngredients.length}개로 전부 됩니다`
                    : `사야 할 재료 ${match.missing.map((m) => m.name).join(", ")}`
                }
                trailing={
                  <span className="text-right">
                    <span className="block text-[14.5px] font-bold text-text">
                      추가 {formatWon(match.extraCost)}원
                    </span>
                    <span className="block text-[12.5px] text-accent">
                      {formatWon(match.savings)}원 절약
                    </span>
                  </span>
                }
                // LLM 추천 메뉴는 저장된 레시피가 아니라 r1(결과 화면)이 성립하지 않는다.
                // onOpen을 주지 않으면 ListRow가 버튼을 비활성화한다 — 목록에서 종결.
              />
            ))}
          </ul>
          <p className="mt-[18px] text-[12.5px] leading-[1.75] text-text-2">
            추가 구매 금액은 부족한 재료를 이 레시피에 쓰는 양만큼만 계산한 값입니다.
          </p>
        </section>
      )}
    </main>
  );
}
