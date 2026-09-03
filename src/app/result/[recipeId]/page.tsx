"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { resolveRecipeForResult } from "@/lib/data/recibi/recipes";
import {
  calcBarFillPercent,
  calcExclusionMessage,
  calcIngredientTotals,
  calcPerServing,
  calcSavings,
  formatPercent,
  formatWon,
  type IngredientAdjustState,
} from "@/lib/recibi/calc";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { TabBar, type TabItem } from "@/components/recibi/ui/TabBar/TabBar";
import { CompareBar } from "@/components/recibi/ui/CompareBar/CompareBar";
import { IngredientRow } from "@/components/recibi/ui/IngredientRow/IngredientRow";
import { BookmarkButton } from "@/components/recibi/ui/BookmarkButton/BookmarkButton";
import { Banner } from "@/components/recibi/ui/Banner/Banner";
import { RecipeSearchBar } from "@/components/recibi/search/RecipeSearchBar";
import { parseRecipeInputMode } from "@/lib/recibi/search-mode";

type TabKey = "savings" | "ingredients" | "steps";

const PANEL = "container pt-[clamp(38px,5vw,56px)] pb-[clamp(40px,6vw,72px)]";
const SECTION_TITLE = "text-[17px] leading-[1.4] font-black tracking-[-0.02em]";

/** 어떤 공공 데이터로 계산했는지 밝히는 3열 (시안 r2 .srcs) */
const PRICE_SOURCES = [
  { name: "KAMIS 농산물유통정보", desc: "농·축·수산물 도소매가 · 매일 갱신" },
  { name: "한국소비자원 참가격", desc: "가공식품·생필품 · 주 1회 갱신" },
  { name: "직접 입력", desc: "공공 데이터에 없는 재료는 값을 넣어 계산" },
];

export default function ResultPage() {
  const params = useParams<{ recipeId: string }>();
  const router = useRouter();
  const searchMode = parseRecipeInputMode(useSearchParams().get("mode") ?? undefined);
  const recipe = useMemo(() => resolveRecipeForResult(params.recipeId), [params.recipeId]);

  const { isLoggedIn, bookmarks, addBookmark, removeBookmark, openLoginModal } = useRecibiApp();

  const [activeTab, setActiveTab] = useState<TabKey>("savings"); // 재진입 시 항상 "절약 금액" (02_동작규칙 1-5)
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [manualPrices, setManualPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!recipe) router.replace("/");
  }, [recipe, router]);

  if (!recipe) return null;

  const adjustState: IngredientAdjustState = { checked, manualPrices };
  const totals = calcIngredientTotals(recipe.ingredients, adjustState);
  const savings = calcSavings(recipe.eatOutPrice.avg, totals.costTotal);
  const barFillPercent = calcBarFillPercent(recipe.eatOutPrice.avg, totals.costTotal);
  const myPerServing = calcPerServing(totals.costTotal, recipe.servings);
  const eatOutPerServing = calcPerServing(recipe.eatOutPrice.avg, recipe.servings);
  const exclusionMessage = calcExclusionMessage(recipe.ingredients, adjustState);
  const unpricedName = recipe.ingredients.find(
    (ing) => ing.hasNoPriceData && (checked[ing.id] ?? true) && !(manualPrices[ing.id] > 0)
  )?.name;
  const totalNote =
    exclusionMessage ?? (unpricedName ? `${unpricedName}은 금액을 넣기 전까지 합계에 없습니다` : null);

  const existingBookmark = bookmarks.find((b) => b.recipeId === recipe.id);
  const isBookmarked = Boolean(existingBookmark);

  function handleBookmarkClick() {
    if (!isLoggedIn) {
      openLoginModal({ fromResult: true });
      return;
    }
    if (existingBookmark) {
      removeBookmark(existingBookmark.id);
      return;
    }
    const result = addBookmark(recipe!);
    if (result === "full") router.push("/bookmarks"); // b3 — 저장하지 않고 이동, 알림 없음
  }

  function toggleIngredient(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }

  function setManualPrice(id: string, value: number) {
    setManualPrices((prev) => ({ ...prev, [id]: value }));
  }

  const tabs: TabItem[] = [
    { key: "savings", label: "절약 금액", meta: formatWon(savings.amount) },
    { key: "ingredients", label: "재료별 금액", meta: `${recipe.ingredients.length}개` },
    { key: "steps", label: "조리법", meta: recipe.steps ? `${recipe.steps.length}단계` : undefined },
  ];

  return (
    <main className="shrink-0 grow basis-auto">
      {/* 결과를 보는 중에도 넣은 링크는 홈과 같은 자리(최상단)에 그대로 남는다 */}
      <section className="container pt-[clamp(28px,4vw,44px)] pb-[clamp(30px,4vw,44px)]">
        <RecipeSearchBar mode={searchMode} />
      </section>

      <section className="container pt-[clamp(26px,3.5vw,38px)] pb-7">
        <p className="mb-[7px] text-[11.5px] font-medium tracking-[0.06em] text-text-2">{recipe.sourceLabel}</p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[clamp(22px,2.8vw,28px)] leading-[1.25] font-black tracking-[-0.035em]">{recipe.title}</h1>
            <p className="mt-1 text-[13px] text-text-2">
              {recipe.servings}인분 · 재료 {recipe.ingredients.length}개 · 조리 {recipe.cookMinutes}분
            </p>
          </div>
          <BookmarkButton active={isBookmarked} onClick={handleBookmarkClick} />
        </div>
      </section>

      <TabBar tabs={tabs} activeKey={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

      {activeTab === "savings" && (
        <section
          className={PANEL}
          role="tabpanel"
          id="panel-savings"
          aria-labelledby="tab-savings"
        >
          <p className="mb-4 text-[11.5px] font-medium tracking-[0.06em] text-text-2">직접 만들면</p>
          <div className="mb-[14px] flex flex-wrap items-baseline gap-1.5">
            <span className="text-[clamp(52px,8.5vw,84px)] leading-[0.95] font-black tracking-[-0.05em] text-accent">{savings.amount.toLocaleString("ko-KR")}</span>
            <span className="text-[clamp(22px,3vw,30px)] font-black tracking-[-0.03em] text-accent">원</span>
            <span className="ml-1.5 text-[clamp(18px,2.4vw,24px)] font-bold tracking-[-0.02em]">아낍니다</span>
          </div>
          <p className="mb-[30px] text-sm leading-[1.7] text-text-2">
            사 먹으면 {formatWon(recipe.eatOutPrice.avg)}, 직접 만들면 {formatWon(totals.costTotal)}. 한 끼에{" "}
            {formatPercent(savings.percent)}.
          </p>

          <CompareBar eatOutAvg={recipe.eatOutPrice.avg} ingredientTotal={totals.costTotal} fillPercent={barFillPercent} />

          <div className="flex flex-wrap items-baseline justify-between gap-4 py-4 text-[13px] text-text-2 [&_b]:font-bold [&_b]:text-text">
            <span>1인분으로 나누면</span>
            <span>
              {formatWon(eatOutPerServing)} → <b>{formatWon(myPerServing)}</b>
            </span>
          </div>

          {/* 비교 기준이 어디서 온 값인지 밝히는 블록 — 이 범위가 있어야 아래 평균값 문장이 성립한다 */}
          <h4 className="mt-[34px] mb-[14px] text-sm leading-[1.4] font-bold tracking-[-0.02em]">
            사 먹으면 기준이 된 가격
          </h4>
          <div className="flex flex-wrap items-baseline justify-between gap-[14px] border border-line px-5 py-[18px]">
            <span className="text-[14.5px] leading-[1.4] font-bold">
              {recipe.title} {recipe.servings}인
            </span>
            <span className="text-[15px] leading-[1.4] font-bold">
              {recipe.eatOutPrice.min.toLocaleString("ko-KR")} ~ {formatWon(recipe.eatOutPrice.max)}
            </span>
          </div>
          <p className="mt-3 text-xs leading-[1.7] text-text-2">
            이 범위의 평균값 {formatWon(recipe.eatOutPrice.avg)}을 비교 기준으로 씁니다. 배달비{" "}
            {formatWon(recipe.eatOutPrice.deliveryFee)} 포함.
          </p>
        </section>
      )}

      {activeTab === "ingredients" && (
        <section
          className={PANEL}
          role="tabpanel"
          id="panel-ingredients"
          aria-labelledby="tab-ingredients"
        >
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-4">
            <h2 className={SECTION_TITLE}>재료별 금액</h2>
            <span className="text-[12.5px] text-text-2">{recipe.priceUpdatedAt} 갱신</span>
          </div>
          <p className="mb-[22px] max-w-[56ch] text-[13px] leading-[1.7] text-text-2">
            이미 집에 있는 재료는 체크를 풀면 해 먹는 금액에서 빠집니다.
          </p>

          {unpricedName && (
            <Banner>
              <b>{unpricedName}</b>은 가격 데이터가 없습니다. 아래에서 금액을 넣으면 합계에 바로
              반영됩니다.
            </Banner>
          )}

          <ul className="border-t border-line-strong">
            {recipe.ingredients.map((ingredient) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                checked={checked[ingredient.id] ?? true}
                manualPrice={manualPrices[ingredient.id] ?? 0}
                onToggle={toggleIngredient}
                onManualPriceChange={setManualPrice}
              />
            ))}

            <li className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-line-strong py-5">
              <span>
                <b className="block text-[15px] leading-[1.4] font-black tracking-[-0.02em]">
                  재료비 합계
                </b>
                {totalNote && (
                  <span className="block text-xs leading-[1.6] text-text-2">{totalNote}</span>
                )}
              </span>
              <span className="text-[22px] leading-none font-black tracking-[-0.03em]">
                {formatWon(totals.costTotal)}
              </span>
            </li>
          </ul>

          <p className="mt-[22px] text-[13.5px] leading-[1.8] text-text-2 [&_b]:font-bold [&_b]:text-text">
            실제로 구매하려면 장바구니 기준 최소 <b>{formatWon(totals.cartTotal)}</b>이 필요합니다. 구매 단위 전체
            가격의 합이며, 실제 결제 기능은 없습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-5 border-t border-line pt-[18px]">
            {PRICE_SOURCES.map((source) => (
              <div key={source.name} className="min-w-[170px]">
                <b className="block text-xs leading-[1.6] font-bold">{source.name}</b>
                <span className="block text-[11.5px] leading-[1.6] text-text-2">{source.desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "steps" && (
        <section className={PANEL} role="tabpanel" id="panel-steps" aria-labelledby="tab-steps">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-4">
            <h2 className={SECTION_TITLE}>조리법</h2>
            <span className="text-[12.5px] text-text-2">설명란 원문 요약</span>
          </div>
          <p className="mb-[22px] text-[13px] leading-[1.7] text-text-2">
            {recipe.servings}인분 · 조리 {recipe.cookMinutes}분
          </p>

          <div className="mb-7 border border-line px-5 py-[18px]">
            <p className="mb-2.5 text-xs leading-none font-bold tracking-[0.06em] text-text-2">재료</p>
            <p className="text-[13.5px] leading-[1.9]">
              {recipe.ingredients
                .map((ingredient) => `${ingredient.name} ${ingredient.amountLabel}`)
                .join(" · ")}
            </p>
          </div>

          {recipe.steps ? (
            <ol className="border-t border-line-strong">
              {recipe.steps.map((step) => (
                <li
                  key={step.order}
                  className="flex flex-wrap gap-[18px] border-b border-line py-[18px]"
                >
                  <span className="w-[26px] flex-none text-[15px] leading-[1.5] font-black text-accent">
                    {step.order}
                  </span>
                  <div className="min-w-[200px] flex-1 text-sm leading-[1.75]">
                    {step.body}
                    {step.minutes && (
                      <div className="mt-1 text-xs leading-[1.6] text-text-2">{step.minutes}분</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[13.5px] text-text-2">이 레시피는 조리 순서가 정리되어 있지 않습니다.</p>
          )}

          {recipe.rawDescription && (
            <details className="mt-5">
              <summary className="cursor-pointer text-[12.5px] leading-[1.8] font-bold text-text-2 hover:text-text">설명란 원문 보기</summary>
              <pre className="mt-[14px] max-w-[70ch] font-sans text-[13.5px] leading-[1.9] whitespace-pre-line text-text-2">{recipe.rawDescription}</pre>
            </details>
          )}
        </section>
      )}
    </main>
  );
}
