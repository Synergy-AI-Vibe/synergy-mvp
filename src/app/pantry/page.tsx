"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pantryRecommendedChips } from "@/lib/data/recibi/ingredients";
import { searchPantryRecipes } from "@/lib/services/recibi/pantry-service";
import { pantryMatchToAnalysisData } from "@/lib/data/recibi/pantry-to-analysis";
import { setCurrentAnalysis } from "@/lib/current-analysis";
import { formatWon } from "@/lib/calc";
import { Chip, ChipAddInput } from "@/components/recibi/ui/Chip/Chip";
import { Button } from "@/components/recibi/ui/Button/Button";
import { ButtonGhost } from "@/components/recibi/ui/ButtonGhost/ButtonGhost";
import { TextLink } from "@/components/recibi/ui/TextLink/TextLink";
import { ListRow } from "@/components/recibi/ui/ListRow/ListRow";
import { Tag } from "@/components/recibi/ui/Tag/Tag";
import { NoticeCard } from "@/components/recibi/ui/NoticeCard/NoticeCard";
import { Skeleton } from "@/components/recibi/ui/Skeleton/Skeleton";
import type { ChosenPantryIngredient, PantryMatch } from "@/types/recibi";
import styles from "./page.module.css";

const PANTRY_LIMIT = 5;

// p1 시작 · p2 결과 · p3 결과 없음 · p4 5개 가득 — 전부 이 화면의 상태다 (02_동작규칙 7항, SUB)
export default function PantryPage() {
  const router = useRouter();
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

  return (
    <main>
      <section className={`container ${styles.section}`}>
        <h1 className={styles.title}>있는 재료로 찾기</h1>
        <p className={styles.lead}>지금 집에 있는 재료를 골라주세요. 겹치는 재료가 많은 레시피부터 보여드립니다.</p>

        <p className={styles.chosenLabel}>고른 재료 ({chosen.length}/{PANTRY_LIMIT})</p>
        <div className={styles.chosenRow}>
          {chosen.length === 0 ? (
            <span className={styles.emptyChosen}>아직 고른 재료가 없습니다.</span>
          ) : (
            chosen.map((item) => (
              <Chip key={item.id} label={item.label} selected onRemove={() => removeIngredient(item.id)} />
            ))
          )}
        </div>

        <p className={styles.recommendLabel}>추천 재료</p>
        <div className={styles.recommendRow}>
          {pantryRecommendedChips
            .filter((label) => !chosenLabels.has(label.toLowerCase()))
            .map((label) => (
              <Chip key={label} label={label} disabled={isFull} onClick={() => addIngredient(label)} />
            ))}
          <ChipAddInput disabled={isFull} onAdd={(value) => addIngredient(value)} />
          {isFull && <span className={styles.limitHint}>5개까지 고를 수 있습니다</span>}
        </div>
        {duplicateHint && <p className={styles.duplicateHint}>{duplicateHint}</p>}

        <div className={styles.actionsRow}>
          <Button onClick={handleSearch} disabled={chosen.length === 0 || isSearching}>
            {isSearching ? "찾는 중" : "레시피 찾기"}
          </Button>
        </div>
      </section>

      {isSearching && (
        <section className={`container ${styles.resultSection}`}>
          <div className={styles.skeletonList} aria-hidden="true">
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        </section>
      )}

      {!isSearching && results !== null && results.length === 0 && (
        <section className={`container ${styles.resultSection}`}>
          <NoticeCard
            eyebrow="결과 없음"
            title="만들 수 있는 레시피를 찾지 못했습니다"
            description={"고른 재료로는 겹치는 레시피가 없습니다.\n재료를 더 골라보거나 링크로 직접 계산해보세요."}
          >
            <ButtonGhost onClick={resetAll}>재료 다시 고르기</ButtonGhost>
            <TextLink href="/">링크로 계산하기</TextLink>
          </NoticeCard>
        </section>
      )}

      {!isSearching && results !== null && results.length > 0 && (
        <section className={`container ${styles.resultSection}`}>
          <h2 className={styles.resultTitle}>만들 수 있는 레시피</h2>
          <ul className={styles.list}>
            {results.map((match) => (
              <ListRow
                key={match.recipe.id}
                title={match.recipe.title}
                meta={
                  match.missing.length === 0
                    ? `가진 재료 ${match.recipe.requiredIngredients.length}개로 전부 됩니다`
                    : `사야 할 재료 ${match.missing.map((m) => m.name).join(", ")}`
                }
                trailing={
                  <span className={styles.rowRight}>
                    <Tag variant={match.missing.length === 0 ? "ready" : "missing"}>
                      {match.missing.length === 0 ? "지금 바로 가능" : `부족 ${match.missing.length}개`}
                    </Tag>
                    <div className={styles.rowDesc}>
                      {match.missing.length === 0 ? "추가 구매 없음" : `+${formatWon(match.extraCost)}원`}
                    </div>
                  </span>
                }
                onOpen={() => {
                  setCurrentAnalysis(pantryMatchToAnalysisData(match));
                  router.push("/result");
                }}
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
