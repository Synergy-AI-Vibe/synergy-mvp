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
import { setCurrentAnalysis } from "@/lib/current-analysis";
import type { AnalyzeRequest, AnalyzeResponse } from "@/types/api";
import styles from "./page.module.css";

interface FailureInfo {
  eyebrow: string;
  title: string;
  description: string;
}

// h1 홈(링크/직접입력) · h3 형식오류 · c2 계산대기 · h4 추출실패를 한 화면 안의 상태로 다룬다.
// 실제 경로는 홈(h1 h2 h3) 하나면 충분하다 — 계산은 /api/analyze 한 번, 결과는 /result로 이동.
export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("url");
  const [urlValue, setUrlValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failure, setFailure] = useState<FailureInfo | null>(null);
  const [recoveryText, setRecoveryText] = useState("");

  function handleModeChange(next: InputMode) {
    setMode(next);
    if (next === "text") setUrlError(false); // 2-1: 직접 입력으로 바꾸면 링크 오류 상태가 해제됨
  }

  function handleUrlChange(value: string) {
    setUrlValue(value);
    if (urlError) setUrlError(false); // 한 글자라도 고치면 오류 상태 즉시 해제
  }

  async function callAnalyze(body: AnalyzeRequest) {
    setIsSubmitting(true);
    let response: AnalyzeResponse;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      response = (await res.json()) as AnalyzeResponse;
    } catch {
      setIsSubmitting(false);
      setFailure({
        eyebrow: "연결 실패",
        title: "서버에 연결하지 못했습니다",
        description: "네트워크 상태를 확인한 뒤 다시 시도해 주세요.",
      });
      return;
    }
    setIsSubmitting(false);

    if (response.status === "success") {
      setCurrentAnalysis(response.data);
      const { sourceType, sourceUrl } = response.data.recipe;
      const query = sourceType === "youtube" && sourceUrl ? `?url=${encodeURIComponent(sourceUrl)}` : "";
      router.push(`/result${query}`);
      return;
    }

    if (response.status === "error" && response.code === "INVALID_URL") {
      setUrlError(true);
      return;
    }

    if (response.status === "no_recipe_found") {
      setFailure({
        eyebrow: "추출 실패",
        title: response.videoTitle ? `"${response.videoTitle}"에서 재료를 찾지 못했습니다` : "재료를 찾지 못했습니다",
        description: response.message,
      });
      return;
    }

    setFailure({
      eyebrow: "추출 실패",
      title: "계산에 실패했습니다",
      description: response.message,
    });
  }

  async function handleUrlSubmit() {
    if (!isYoutubeUrl(urlValue)) {
      setUrlError(true);
      return;
    }
    setUrlError(false);
    await callAnalyze({ url: urlValue });
  }

  async function handleTextSubmit() {
    if (!textValue.trim()) return; // 빈 입력 검증 규칙은 아직 정해지지 않아 최소 방어만 둔다
    await callAnalyze({ text: textValue });
  }

  async function handleRecoverySubmit() {
    if (!recoveryText.trim()) return;
    await callAnalyze({ text: recoveryText });
  }

  function resetToHome() {
    setMode("url");
    setUrlValue("");
    setTextValue("");
    setUrlError(false);
    setFailure(null);
    setRecoveryText("");
  }

  if (failure) {
    return (
      <main>
        <section className={`container ${styles.hero}`}>
          <NoticeCard eyebrow={failure.eyebrow} title={failure.title} description={failure.description}>
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
