"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { computeTotals, computeWarnings, formatPercent, formatWon } from "@/lib/calc";
import { setCurrentAnalysis, useCurrentAnalysis } from "@/lib/current-analysis";
import { useHasMounted } from "@/lib/use-has-mounted";
import { parseRecipeInputMode } from "@/lib/recibi/search-mode";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { RecipeSearchBar } from "@/components/recibi/search/RecipeSearchBar";
import { TabBar, type TabItem } from "@/components/recibi/ui/TabBar/TabBar";
import { CompareBar } from "@/components/recibi/ui/CompareBar/CompareBar";
import { IngredientRow } from "@/components/recibi/ui/IngredientRow/IngredientRow";
import { BookmarkButton } from "@/components/recibi/ui/BookmarkButton/BookmarkButton";
import { Banner } from "@/components/recibi/ui/Banner/Banner";
import { NoticeCard } from "@/components/recibi/ui/NoticeCard/NoticeCard";
import { ButtonGhost } from "@/components/recibi/ui/ButtonGhost/ButtonGhost";
import { Skeleton } from "@/components/recibi/ui/Skeleton/Skeleton";
import type { AnalyzeData, AnalyzeResponse, IngredientRow as ApiIngredientRow } from "@/types/api";

type TabKey = "savings" | "ingredients" | "steps";

const PANEL = "container pt-[clamp(38px,5vw,56px)] pb-[clamp(40px,6vw,72px)]";
const SECTION_TITLE = "text-[17px] leading-[1.4] font-black tracking-[-0.02em]";

/** 어떤 공공 데이터로 계산했는지 밝히는 3열 (시안 r2 .srcs) */
const PRICE_SOURCES = [
  { name: "KAMIS 농산물유통정보", desc: "농·축·수산물 도소매가 · 매일 갱신" },
  { name: "한국소비자원 참가격", desc: "가공식품·생필품 · 주 1회 갱신" },
  { name: "직접 입력", desc: "공공 데이터에 없는 재료는 값을 넣어 계산" },
];

/** 시안 r2·r3 — 합계 라벨 아래 한 줄. 무엇이 빠졌는지/무엇을 직접 넣었는지 밝힌다 */
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
  const searchParams = useSearchParams();
  const { isLoggedIn, bookmarks, addBookmark, removeBookmark, openLoginModal } = useRecibiApp();

  const [activeTab, setActiveTab] = useState<TabKey>("savings"); // 재진입 시 항상 "절약 금액"
  const [ingredients, setIngredients] = useState<ApiIngredientRow[]>(data.ingredients);

  const totals = useMemo(
    () => computeTotals(ingredients, data.store, data.recipe.servings),
    [ingredients, data.store, data.recipe.servings]
  );
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
    if (!isLoggedIn) {
      openLoginModal({ fromResult: true });
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
      if (result.reason === "unauthorized") openLoginModal({ fromResult: true });
      // duplicate·error는 알림창 없이 조용히 무시한다 (1-2)
    }
  }

  const tabs: TabItem[] = [
    { key: "savings", label: "절약 금액", meta: data.store ? `${formatWon(totals.savings)}원` : undefined },
    { key: "ingredients", label: "재료별 금액", meta: `${ingredients.length}개` },
    { key: "steps", label: "조리법", meta: data.recipe.steps.length > 0 ? `${data.recipe.steps.length}단계` : undefined },
  ];

  const ingredientSummary = ingredients
    .map((i) => {
      const amount =
        i.amount !== null && i.amountUnit
          ? `${i.amount}${i.amountUnit}`
          : i.qty !== null && i.unit
            ? `${i.qty}${i.unit}`
            : null;
      const name = i.name ?? i.rawText;
      return amount ? `${name} ${amount}` : name;
    })
    .join(" · ");

  return (
    <>
      {/* 결과를 보는 중에도 넣은 링크는 홈과 같은 자리(최상단)에 그대로 남는다 */}
      <section className="container pt-[clamp(28px,4vw,44px)] pb-[clamp(30px,4vw,44px)]">
        <RecipeSearchBar mode={parseRecipeInputMode(searchParams.get("mode") ?? undefined)} />
      </section>

      <section className="container pt-[clamp(26px,3.5vw,38px)] pb-7">
        <p className="mb-[7px] text-[11.5px] font-medium tracking-[0.06em] text-text-2">
          {data.recipe.sourceType === "youtube"
            ? `유튜브${data.recipe.channelName ? ` · ${data.recipe.channelName}` : ""}`
            : "직접 입력"}
        </p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[clamp(22px,2.8vw,28px)] leading-[1.25] font-black tracking-[-0.035em]">
              {data.recipe.title}
            </h1>
            <p className="mt-1 text-[13px] text-text-2">
              {data.recipe.servings}인분 · 재료 {ingredients.length}개
            </p>
          </div>
          <BookmarkButton active={isBookmarked} onClick={handleBookmarkClick} />
        </div>
      </section>

      <TabBar tabs={tabs} activeKey={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

      {activeTab === "savings" && (
        <section className={PANEL} role="tabpanel" id="panel-savings" aria-labelledby="tab-savings">
          {warnings.missingMain.length > 0 && (
            <Banner>
              <b>가격을 찾지 못한 주재료가 있어요.</b> {warnings.missingMain.join(", ")} — 합계가 실제보다
              낮을 수 있습니다.
            </Banner>
          )}

          {data.store ? (
            <>
              <p className="mb-4 text-[11.5px] font-medium tracking-[0.06em] text-text-2">직접 만들면</p>
              <div className="mb-[14px] flex flex-wrap items-baseline gap-1.5">
                <span className="text-[clamp(52px,8.5vw,84px)] leading-[0.95] font-black tracking-[-0.05em] text-accent">
                  {totals.savings.toLocaleString("ko-KR")}
                </span>
                <span className="text-[clamp(22px,3vw,30px)] font-black tracking-[-0.03em] text-accent">원</span>
                <span className="ml-1.5 text-[clamp(18px,2.4vw,24px)] font-bold tracking-[-0.02em]">
                  아낍니다
                </span>
              </div>
              <p className="mb-[30px] text-sm leading-[1.7] text-text-2">
                사 먹으면 {formatWon(data.store.avg)}원, 직접 만들면 {formatWon(totals.ingredientTotal)}원. 한
                끼에 {formatPercent(totals.savingsPercent)}%.
              </p>

              <CompareBar
                eatOutAvg={data.store.avg}
                ingredientTotal={totals.ingredientTotal}
                fillPercent={totals.barPercent}
              />

              <div className="flex flex-wrap items-baseline justify-between gap-4 py-4 text-[13px] text-text-2 [&_b]:font-bold [&_b]:text-text">
                <span>1인분으로 나누면</span>
                <span>
                  {formatWon(eatOutPerServing)}원 → <b>{formatWon(totals.perServing)}원</b>
                </span>
              </div>

              {/* 비교 기준이 어디서 온 값인지 밝히는 블록 — 이 범위가 있어야 아래 평균값 문장이 성립한다 */}
              <h4 className="mt-[34px] mb-[14px] text-sm leading-[1.4] font-bold tracking-[-0.02em]">
                사 먹으면 기준이 된 가격
              </h4>
              <div className="flex flex-wrap items-baseline justify-between gap-[14px] border border-line px-5 py-[18px]">
                <span className="text-[14.5px] leading-[1.4] font-bold">
                  {data.recipe.title} {data.recipe.servings}인
                </span>
                <span className="text-[15px] leading-[1.4] font-bold">
                  {formatWon(data.store.min)} ~ {formatWon(data.store.max)}원
                </span>
              </div>
              <p className="mt-3 text-xs leading-[1.7] text-text-2">
                {data.priceBaseDate} 기준 · 이 범위의 평균값 {formatWon(data.store.avg)}원을 비교 기준으로
                씁니다. 배달비 {formatWon(data.store.deliveryFee)}원 포함.
              </p>
            </>
          ) : (
            <div className="text-sm leading-[1.8] text-text-2 [&_b]:font-bold [&_b]:text-text">
              <p>이 레시피는 비교할 매장가 정보가 없습니다.</p>
              <p className="mt-2">
                재료비 합계는 <b>{formatWon(totals.ingredientTotal)}원</b>, 1인분 기준{" "}
                <b>{formatWon(totals.perServing)}원</b>입니다.
              </p>
            </div>
          )}
        </section>
      )}

      {activeTab === "ingredients" && (
        <section className={PANEL} role="tabpanel" id="panel-ingredients" aria-labelledby="tab-ingredients">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-4">
            <h2 className={SECTION_TITLE}>재료별 금액</h2>
            <span className="text-[12.5px] text-text-2">{data.priceBaseDate} 갱신</span>
          </div>
          <p className="mb-[22px] max-w-[56ch] text-[13px] leading-[1.7] text-text-2">
            이미 집에 있는 재료는 체크를 풀면 해 먹는 금액에서 빠집니다.
          </p>

          {warnings.missingMain.length > 0 && (
            <Banner>
              <b>{warnings.missingMain.join(", ")}</b>은 가격 데이터가 없습니다. 아래에서 금액을 넣으면
              합계에 바로 반영됩니다.
            </Banner>
          )}

          <ul className="border-t border-line-strong">
            {ingredients.map((ingredient) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                onToggle={toggleIngredient}
                onManualPriceChange={setManualPrice}
              />
            ))}

            <li className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-line-strong py-5">
              <span>
                <b className="block text-[15px] leading-[1.4] font-black tracking-[-0.02em]">재료비 합계</b>
                {adjustmentNote && (
                  <span className="block text-xs leading-[1.6] text-text-2">{adjustmentNote}</span>
                )}
              </span>
              <span className="text-[22px] leading-none font-black tracking-[-0.03em]">
                {formatWon(totals.ingredientTotal)}원
              </span>
            </li>
          </ul>

          {warnings.estimatedCount > 0 && (
            <p className="mt-3 text-[13px] text-text-2">
              가격이 붙은 재료 {warnings.pricedCount}개 중 {warnings.estimatedCount}개는 추정 가격입니다.
            </p>
          )}

          <p className="mt-[22px] text-[13.5px] leading-[1.8] text-text-2 [&_b]:font-bold [&_b]:text-text">
            실제로 구매하려면 장바구니 기준 최소 <b>{formatWon(totals.basketTotal)}원</b>이 필요합니다. 구매
            단위 전체 가격의 합이며, 실제 결제 기능은 없습니다.
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
          <p className="mb-[22px] text-[13px] leading-[1.7] text-text-2">{data.recipe.servings}인분</p>

          {/* 조리 순서 위에 이 요리에 들어가는 재료를 한 줄로 훑게 한다 (시안 r4) */}
          <div className="mb-7 border border-line px-5 py-[18px]">
            <p className="mb-2.5 text-xs leading-none font-bold tracking-[0.06em] text-text-2">재료</p>
            <p className="text-[13.5px] leading-[1.9]">{ingredientSummary}</p>
          </div>

          {data.recipe.steps.length > 0 ? (
            <ol className="border-t border-line-strong">
              {data.recipe.steps.map((step, index) => (
                <li key={index} className="flex flex-wrap gap-[18px] border-b border-line py-[18px]">
                  <span className="w-[26px] flex-none text-[15px] leading-[1.5] font-black text-accent">
                    {index + 1}
                  </span>
                  <p className="min-w-[200px] flex-1 text-sm leading-[1.75]">{step}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[13.5px] text-text-2">이 레시피는 조리 순서가 정리되어 있지 않습니다.</p>
          )}

          {data.recipe.rawText && (
            <details className="mt-5">
              <summary className="cursor-pointer text-[12.5px] leading-[1.8] font-bold text-text-2 hover:text-text">
                설명란 원문 보기
              </summary>
              <pre className="mt-[14px] max-w-[70ch] font-sans text-[13.5px] leading-[1.9] whitespace-pre-line text-text-2">
                {data.recipe.rawText}
              </pre>
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
      <section className="container pt-[clamp(40px,6vw,72px)] pb-[clamp(48px,7vw,80px)]">
        <NoticeCard
          eyebrow="계산 실패"
          title="다시 불러오지 못했습니다"
          description={"이 레시피를 다시 계산하지 못했습니다.\n홈에서 링크를 다시 넣어주세요."}
        >
          <ButtonGhost onClick={() => router.push("/")}>홈으로</ButtonGhost>
        </NoticeCard>
      </section>
    );
  }

  if (!data) {
    return (
      <section
        className="container flex flex-col gap-3 pt-[clamp(40px,6vw,72px)] pb-[clamp(48px,7vw,80px)]"
        aria-hidden="true"
      >
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
    <main className="shrink-0 grow basis-auto">
      <Suspense fallback={null}>
        <ResultPageInner />
      </Suspense>
    </main>
  );
}
