"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/recibi/ui/Button/Button";
import { ButtonGhost } from "@/components/recibi/ui/ButtonGhost/ButtonGhost";
import { ModeSwitch, type InputMode } from "@/components/recibi/ui/ModeSwitch/ModeSwitch";
import { UrlInput } from "@/components/recibi/ui/UrlInput/UrlInput";
import { RecipeTextarea } from "@/components/recibi/ui/RecipeTextarea/RecipeTextarea";
import { NoticeCard } from "@/components/recibi/ui/NoticeCard/NoticeCard";
import { Skeleton } from "@/components/recibi/ui/Skeleton/Skeleton";
import { TextLink } from "@/components/recibi/ui/TextLink/TextLink";
import { isYoutubeUrl } from "@/lib/recibi/validate";
import { extractRecipeFromText, extractRecipeFromUrl } from "@/lib/services/recibi/recipe-service";
import type { ExtractionResult } from "@/lib/services/recibi/recipe-service";
import styles from "./page.module.css";

// h1 홈(링크/직접입력) · h3 형식오류 · c2 계산대기 · h4 추출실패를 한 화면 안의 상태로 다룬다.
// 02_동작규칙 11항: "실제 경로는 네 개면 충분합니다 — 홈(h1 h2 h3)"이므로 라우팅을 나누지 않는다.
export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("url");
  const [urlValue, setUrlValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [recoveryText, setRecoveryText] = useState("");

  function handleModeChange(next: InputMode) {
    setMode(next);
    if (next === "text") setUrlError(false); // 2-1: 직접 입력으로 바꾸면 링크 오류 상태가 해제됨
  }

  function handleUrlChange(value: string) {
    setUrlValue(value);
    if (urlError) setUrlError(false); // 한 글자라도 고치면 오류 상태 즉시 해제
  }

  async function goToResult(extractor: () => Promise<ExtractionResult>) {
    setIsSubmitting(true);
    const result = await extractor();
    setIsSubmitting(false);
    if (result.ok && result.recipe) {
      router.push(`/result/${result.recipe.id}`);
      return;
    }
    setHasFailed(true);
  }

  async function handleUrlSubmit() {
    if (!isYoutubeUrl(urlValue)) {
      setUrlError(true);
      return;
    }
    setUrlError(false);
    await goToResult(() => extractRecipeFromUrl(urlValue));
  }

  async function handleTextSubmit() {
    if (!textValue.trim()) return; // 02_동작규칙 10-1 미정 — 최소 방어만 둔다
    await goToResult(() => extractRecipeFromText(textValue));
  }

  async function handleRecoverySubmit() {
    if (!recoveryText.trim()) return;
    await goToResult(() => extractRecipeFromText(recoveryText));
  }

  function resetToHome() {
    setMode("url");
    setUrlValue("");
    setTextValue("");
    setUrlError(false);
    setHasFailed(false);
    setRecoveryText("");
  }

  if (hasFailed) {
    return (
      <main>
        <section className={`container ${styles.hero}`}>
          <NoticeCard
            eyebrow="추출 실패"
            title="영상에서 재료를 찾지 못했습니다"
            description={
              "설명란에 재료 목록이 없거나 형식이 달라 읽지 못했습니다.\n재료를 직접 적으면 바로 계산할 수 있습니다."
            }
          >
            <RecipeTextarea
              placeholder={"재료를 한 줄에 하나씩 적어주세요\n예) 돼지고기 목살 300g"}
              value={recoveryText}
              onChange={(event) => setRecoveryText(event.target.value)}
            />
            <div className={styles.actionsRow}>
              <Button onClick={handleRecoverySubmit} disabled={isSubmitting || !recoveryText.trim()}>
                {isSubmitting ? "계산 중" : "직접 입력해서 계산"}
              </Button>
              <ButtonGhost onClick={resetToHome} disabled={isSubmitting}>
                다른 링크 넣기
              </ButtonGhost>
            </div>
          </NoticeCard>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className={`container ${styles.hero}`}>
        <h1 className={styles.title}>
          레시피 하나면
          <br />
          얼마 아끼는지 나옵니다
        </h1>
        <p className={styles.lead}>
          유튜브 레시피 링크를 넣으면 실제 장보기 가격으로 재료비를 계산해, 사 먹을 때와 비교해드립니다.
        </p>

        <ModeSwitch mode={mode} onChange={handleModeChange} />

        {mode === "url" ? (
          <>
            <UrlInput
              value={urlValue}
              onChange={handleUrlChange}
              onSubmit={handleUrlSubmit}
              error={urlError}
              showYoutubeTag={urlValue.length > 0 && !urlError && isYoutubeUrl(urlValue)}
            />
            {urlError && (
              <p className={`${styles.hint} ${styles.hintErr}`}>
                {"유튜브 링크 형식이 아닙니다.\nyoutube.com 또는 youtu.be로 시작하는 링크를 넣어주세요."}
              </p>
            )}
            <div className={styles.actionsRow}>
              <Button variant="accent" onClick={handleUrlSubmit} disabled={isSubmitting || urlError}>
                {isSubmitting ? "계산 중" : "원가 계산"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <RecipeTextarea
              placeholder={"재료를 한 줄에 하나씩 적어주세요\n예) 돼지고기 목살 300g\n신김치 400g"}
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
            />
            <div className={styles.actionsRow}>
              <Button onClick={handleTextSubmit} disabled={isSubmitting || !textValue.trim()}>
                {isSubmitting ? "계산 중" : "원가 계산"}
              </Button>
            </div>
          </>
        )}

        {isSubmitting && (
          <div className={styles.skeletonPreview} aria-hidden="true">
            <Skeleton height={64} />
            <Skeleton height={16} style={{ width: "60%" }} />
            <Skeleton height={16} style={{ width: "40%" }} />
          </div>
        )}

        <div className={styles.pantryLink}>
          <span className={styles.pantryLinkLabel}>링크가 없다면</span>
          <TextLink href="/pantry">있는 재료로 레시피 찾기</TextLink>
        </div>
      </section>
    </main>
  );
}
