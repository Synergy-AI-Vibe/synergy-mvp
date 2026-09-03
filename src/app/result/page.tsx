"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { computeTotals, computeWarnings, formatPercent, formatWon } from "@/lib/calc";
import { setCurrentAnalysis, useCurrentAnalysis } from "@/lib/current-analysis";
import { useHasMounted } from "@/lib/use-has-mounted";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { TabBar, type TabItem } from "@/components/recibi/ui/TabBar/TabBar";
import { CompareBar } from "@/components/recibi/ui/CompareBar/CompareBar";
import { IngredientRow } from "@/components/recibi/ui/IngredientRow/IngredientRow";
import { BookmarkButton } from "@/components/recibi/ui/BookmarkButton/BookmarkButton";
import { Banner } from "@/components/recibi/ui/Banner/Banner";
import { NoticeCard } from "@/components/recibi/ui/NoticeCard/NoticeCard";
import { ButtonGhost } from "@/components/recibi/ui/ButtonGhost/ButtonGhost";
import { Skeleton } from "@/components/recibi/ui/Skeleton/Skeleton";
import type { AnalyzeData, AnalyzeResponse, IngredientRow as ApiIngredientRow } from "@/types/api";
import styles from "./page.module.css";

type TabKey = "savings" | "ingredients" | "steps";

function buildAdjustmentNote(ingredients: ApiIngredientRow[]): string | null {
  const excluded = ingredients.filter((i) => !i.checked && i.hasPrice);
  if (excluded.length > 0) {
    const amount = excluded.reduce((sum, i) => sum + (i.unitCost ?? 0), 0);
    return `집에 있는 재료 ${excluded.length}개 ${formatWon(amount)}원 제외됨`;
  }

  const unpriced = ingredients.filter((i) => i.checked && !i.hasPrice);
  const entered = unpriced.filter((i) => (i.userPrice ?? 0) > 0);
  if (entered.length > 0) {
    const amount = entered.reduce((sum, i) => sum + (i.userPrice ?? 0), 0);
    const label = entered.length === 1 ? (entered[0].name ?? entered[0].rawText) : `재료 ${entered.length}개`;
    return `${label}은 직접 입력한 ${formatWon(amount)}원으로 계산했습니다`;
  }

  const pending = unpriced.filter((i) => !((i.userPrice ?? 0) > 0));
  if (pending.length > 0) {
    const label = pending.length === 1 ? (pending[0].name ?? pending[0].rawText) : `재료 ${pending.length}개`;
    return `${label}은 금액을 넣기 전까지 합계에 없습니다`;
  }
  return null;
}

function ResultView({ data }: { data: AnalyzeData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoggedIn, bookmarks, addBookmark, removeBookmark } = useRecibiApp();

  const [activeTab, setActiveTab] = useState<TabKey>("savings"); // 재진입 시 항상 "절약 금액"
  const [ingredients, setIngredients] = useState<ApiIngredientRow[]>(data.ingredients);

  const totals = useMemo(() => computeTotals(ingredients, data.store, data.recipe.servings), [ingredients, data.store, data.recipe.servings]);
  const warnings = useMemo(() => computeWarnings(ingredients), [ingredients]);
  const adjustmentNote = useMemo(() => buildAdjustmentNote(ingredients), [ingredients]);
  const eatOutPerServing = data.store ? Math.round(data.store.avg / data.recipe.servings) : 0;

  function toggleIngredient(id: number) {
    setIngredients((prev) => prev.map((row) => (row.id === id ? { ...row, checked: !row.checked } : row)));
  }

  function setManualPrice(id: number, value: number) {
    setIngredients((prev) => prev.map((row) => (row.id === id ? { ...row, userPrice: value } : row)));
  }

  const existingBookmark =
    data.recipe.sourceType === "youtube" && data.recipe.sourceUrl
      ? (bookmarks ?? []).find((b) => b.sourceUrl === data.recipe.sourceUrl)
      : undefined;
  const isBookmarked = Boolean(existingBookmark);

  async function handleBookmarkClick() {
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
      return;
    }
    if (existingBookmark) {
      await removeBookmark(existingBookmark.id);
      return;
    }
    const result = await addBookmark({
      title: data.recipe.title,
      sourceType: data.recipe.sourceType,
      sourceUrl: data.recipe.sourceUrl,
      servings: data.recipe.servings,
    });
    if (!result.ok) {
      if (result.reason === "limit") router.push("/bookmarks"); // b3 — 저장하지 않고 이동, 알림 없음
      if (result.reason === "unauthorized") router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
      // duplicate·error는 알림창 없이 조용히 무시한다 (1-2)
    }
  }

  const tabs: TabItem[] = [
    { key: "savings", label: "절약 금액" },
    { key: "ingredients", label: "재료별 금액", meta: `${ingredients.length}개` },
    { key: "steps", label: "조리법" },
  ];

  return (
    <>
      <section className={`container ${styles.headSection}`}>
        <p className={styles.eyebrow}>
          {data.recipe.sourceType === "youtube" ? `유튜브${data.recipe.channelName ? ` · ${data.recipe.channelName}` : ""}` : "직접 입력"}
        </p>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>{data.recipe.title}</h1>
            <p className={styles.meta}>{data.recipe.servings}인분</p>
          </div>
          <BookmarkButton active={isBookmarked} onClick={handleBookmarkClick} />
        </div>
      </section>

      <TabBar tabs={tabs} activeKey={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

      {activeTab === "savings" && (
        <section className={`container ${styles.panel}`} role="tabpanel" id="panel-savings" aria-labelledby="tab-savings">
          {warnings.missingMain.length > 0 && (
            <Banner>
              <b>가격을 찾지 못한 주재료가 있어요.</b> {warnings.missingMain.join(", ")} — 합계가 실제보다 낮을 수 있습니다.
            </Banner>
          )}

          {data.store ? (
            <>
              <div className={styles.saveRow}>
                <span className={styles.saveNumber}>{totals.savings.toLocaleString("ko-KR")}</span>
                <span className={styles.saveUnit}>원</span>
                <span className={styles.saveVerb}>아낍니다</span>
              </div>
              <p className={styles.saveSummary}>
                사 먹으면 {formatWon(data.store.avg)}원, 해먹으면 {formatWon(totals.ingredientTotal)}원 · {formatPercent(totals.savingsPercent)}%
                절약
              </p>

              <CompareBar eatOutAvg={data.store.avg} ingredientTotal={totals.ingredientTotal} fillPercent={totals.barPercent} />

              <div className={styles.splitRow}>
                <span>1인분 기준</span>
                <span>
                  {formatWon(eatOutPerServing)}원 → <b>{formatWon(totals.perServing)}원</b>
                </span>
              </div>

              <p className={styles.caption}>
                {data.priceBaseDate} 기준 · 사 먹는 가격 {formatWon(data.store.min)}~{formatWon(data.store.max)}원 범위의 평균값입니다.
              </p>
            </>
          ) : (
            <div className={styles.noStoreNote}>
              <p>이 레시피는 비교할 매장가 정보가 없습니다.</p>
              <p style={{ marginTop: 8 }}>
                재료비 합계는 <b>{formatWon(totals.ingredientTotal)}원</b>, 1인분 기준 <b>{formatWon(totals.perServing)}원</b>입니다.
              </p>
            </div>
          )}
        </section>
      )}

      {activeTab === "ingredients" && (
        <section className={`container ${styles.panel}`} role="tabpanel" id="panel-ingredients" aria-labelledby="tab-ingredients">
          <h2 className={styles.sectionTitle}>재료별 금액</h2>

          {warnings.missingMain.length > 0 && (
            <Banner>
              <b>가격 정보가 없는 주재료가 있어요.</b> 아래에서 금액을 직접 입력해주세요.
            </Banner>
          )}

          <ul className={styles.ingredientList}>
            {ingredients.map((ingredient) => (
              <IngredientRow key={ingredient.id} ingredient={ingredient} onToggle={toggleIngredient} onManualPriceChange={setManualPrice} />
            ))}
          </ul>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>재료비 합계</span>
            <span className={styles.totalValue}>{formatWon(totals.ingredientTotal)}원</span>
          </div>
          {adjustmentNote && <p className={styles.exclusionNote}>{adjustmentNote}</p>}
          {warnings.estimatedCount > 0 && (
            <p className={styles.exclusionNote}>
              가격이 붙은 재료 {warnings.pricedCount}개 중 {warnings.estimatedCount}개는 추정 가격입니다.
            </p>
          )}

          <p className={styles.cartNote}>
            실제로 구매하려면 장바구니 기준 최소 <b>{formatWon(totals.basketTotal)}원</b>이 필요합니다. 구매 단위 전체 가격의 합이며, 실제
            결제 기능은 없습니다.
          </p>

          {data.store && (
            <p className={styles.footNote}>
              이 범위의 평균값 <b>{formatWon(data.store.avg)}원</b>을 비교 기준으로 씁니다. 배달비 {formatWon(data.store.deliveryFee)}원 포함.
            </p>
          )}
        </section>
      )}

      {activeTab === "steps" && (
        <section className={`container ${styles.panel}`} role="tabpanel" id="panel-steps" aria-labelledby="tab-steps">
          <h2 className={styles.sectionTitle}>조리법</h2>

          {data.recipe.steps.length > 0 ? (
            <ol className={styles.stepList}>
              {data.recipe.steps.map((step, index) => (
                <li key={index} className={styles.step}>
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <p className={styles.stepText}>{step}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.emptySteps}>이 레시피는 조리 순서가 정리되어 있지 않습니다.</p>
          )}

          {data.recipe.rawText && (
            <details className={styles.rawDetails}>
              <summary className={styles.rawSummary}>설명란 원문 보기</summary>
              <pre className={styles.rawText}>{data.recipe.rawText}</pre>
            </details>
          )}
        </section>
      )}
    </>
  );
}

function ResultPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stored = useCurrentAnalysis();
  const hasMounted = useHasMounted();
  const urlParam = searchParams.get("url");

  const [fetched, setFetched] = useState<AnalyzeData | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const fetchingRef = useRef(false);

  const data = stored ?? fetched;

  useEffect(() => {
    if (!hasMounted || data || fetchingRef.current || fetchFailed) return;

    if (!urlParam) {
      router.replace("/"); // 세션에 남은 결과도, 딥링크로 복구할 링크도 없다
      return;
    }

    let cancelled = false;
    fetchingRef.current = true;
    fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: urlParam }),
    })
      .then((res) => res.json())
      .then((response: AnalyzeResponse) => {
        if (cancelled) return;
        fetchingRef.current = false;
        if (response.status === "success") {
          setCurrentAnalysis(response.data);
          setFetched(response.data);
        } else {
          setFetchFailed(true);
        }
      })
      .catch(() => {
        fetchingRef.current = false;
        if (!cancelled) setFetchFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [hasMounted, data, fetchFailed, urlParam, router]);

  if (fetchFailed) {
    return (
      <section className={`container ${styles.retryError}`}>
        <NoticeCard eyebrow="계산 실패" title="다시 불러오지 못했습니다" description={"이 레시피를 다시 계산하지 못했습니다.\n홈에서 링크를 다시 넣어주세요."}>
          <ButtonGhost onClick={() => router.push("/")}>홈으로</ButtonGhost>
        </NoticeCard>
      </section>
    );
  }

  if (!data) {
    return (
      <section className={`container ${styles.loadingSection}`} aria-hidden="true">
        <Skeleton height={64} />
        <Skeleton height={200} />
        <Skeleton height={16} style={{ width: "60%" }} />
      </section>
    );
  }

  return <ResultView key={data.recipe.sourceUrl ?? data.recipe.title} data={data} />;
}

export default function ResultPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <ResultPageInner />
      </Suspense>
    </main>
  );
}
