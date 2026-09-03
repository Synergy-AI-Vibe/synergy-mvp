"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import styles from "./page.module.css";

type TabKey = "savings" | "ingredients" | "steps";

export default function ResultPage() {
  const params = useParams<{ recipeId: string }>();
  const router = useRouter();
  const recipe = useMemo(() => resolveRecipeForResult(params.recipeId), [params.recipeId]);

  const { isLoggedIn, bookmarks, addBookmark, removeBookmark } = useRecibiApp();

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
  const hasUnpricedBanner = recipe.ingredients.some(
    (ing) => ing.hasNoPriceData && (checked[ing.id] ?? true) && !(manualPrices[ing.id] > 0)
  );

  const existingBookmark = bookmarks.find((b) => b.recipeId === recipe.id);
  const isBookmarked = Boolean(existingBookmark);

  function handleBookmarkClick() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/result/${recipe!.id}`)}`);
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
    { key: "savings", label: "절약 금액" },
    { key: "ingredients", label: "재료별 금액", meta: `${recipe.ingredients.length}개` },
    { key: "steps", label: "조리법" },
  ];

  return (
    <main>
      <section className={`container ${styles.headSection}`}>
        <p className={styles.eyebrow}>{recipe.sourceLabel}</p>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>{recipe.title}</h1>
            <p className={styles.meta}>
              {recipe.servings}인분 · {recipe.cookMinutes}분
            </p>
          </div>
          <BookmarkButton active={isBookmarked} onClick={handleBookmarkClick} />
        </div>
      </section>

      <TabBar tabs={tabs} activeKey={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

      {activeTab === "savings" && (
        <section
          className={`container ${styles.panel}`}
          role="tabpanel"
          id="panel-savings"
          aria-labelledby="tab-savings"
        >
          <div className={styles.saveRow}>
            <span className={styles.saveNumber}>{savings.amount.toLocaleString("ko-KR")}</span>
            <span className={styles.saveUnit}>원</span>
            <span className={styles.saveVerb}>아낍니다</span>
          </div>
          <p className={styles.saveSummary}>
            사 먹으면 {formatWon(recipe.eatOutPrice.avg)}, 해먹으면 {formatWon(totals.costTotal)} ·{" "}
            {formatPercent(savings.percent)} 절약
          </p>

          <CompareBar eatOutAvg={recipe.eatOutPrice.avg} ingredientTotal={totals.costTotal} fillPercent={barFillPercent} />

          <div className={styles.splitRow}>
            <span>1인분 기준</span>
            <span>
              {formatWon(eatOutPerServing)} → <b>{formatWon(myPerServing)}</b>
            </span>
          </div>

          <p className={styles.caption}>
            {recipe.priceUpdatedAt} 기준 · 사 먹는 가격 {formatWon(recipe.eatOutPrice.min)}~{formatWon(recipe.eatOutPrice.max)} 범위의
            평균값입니다.
          </p>
        </section>
      )}

      {activeTab === "ingredients" && (
        <section
          className={`container ${styles.panel}`}
          role="tabpanel"
          id="panel-ingredients"
          aria-labelledby="tab-ingredients"
        >
          <h2 className={styles.sectionTitle}>재료별 금액</h2>

          {hasUnpricedBanner && (
            <Banner>
              <b>가격 정보가 없는 재료가 있어요.</b> 아래에서 금액을 직접 입력해주세요.
            </Banner>
          )}

          <ul className={styles.ingredientList}>
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
          </ul>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>재료비 합계</span>
            <span className={styles.totalValue}>{formatWon(totals.costTotal)}</span>
          </div>
          {exclusionMessage && <p className={styles.exclusionNote}>{exclusionMessage}</p>}

          <p className={styles.cartNote}>
            실제로 구매하려면 장바구니 기준 최소 <b>{formatWon(totals.cartTotal)}</b>이 필요합니다. 구매 단위 전체
            가격의 합이며, 실제 결제 기능은 없습니다.
          </p>

          <p className={styles.footNote}>
            이 범위의 평균값 <b>{formatWon(recipe.eatOutPrice.avg)}</b>을 비교 기준으로 씁니다. 배달비{" "}
            {formatWon(recipe.eatOutPrice.deliveryFee)} 포함.
          </p>
        </section>
      )}

      {activeTab === "steps" && (
        <section className={`container ${styles.panel}`} role="tabpanel" id="panel-steps" aria-labelledby="tab-steps">
          <h2 className={styles.sectionTitle}>조리법</h2>

          {recipe.steps ? (
            <ol className={styles.stepList}>
              {recipe.steps.map((step) => (
                <li key={step.order} className={styles.step}>
                  <span className={styles.stepNumber}>{step.order}</span>
                  <div className={styles.stepBody}>
                    <p className={styles.stepTitle}>
                      {step.title}
                      {step.minutes && <span className={styles.stepMinutes}>{step.minutes}분</span>}
                    </p>
                    <p className={styles.stepText}>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.emptySteps}>이 레시피는 조리 순서가 정리되어 있지 않습니다.</p>
          )}

          {recipe.rawDescription && (
            <details className={styles.rawDetails}>
              <summary className={styles.rawSummary}>설명란 원문 보기</summary>
              <pre className={styles.rawText}>{recipe.rawDescription}</pre>
            </details>
          )}
        </section>
      )}
    </main>
  );
}
