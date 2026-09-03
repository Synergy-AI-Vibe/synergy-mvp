"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { ModeSwitch } from "@/components/recibi/ui/ModeSwitch/ModeSwitch";
import { UrlInput } from "@/components/recibi/ui/UrlInput/UrlInput";
import { RecipeTextarea } from "@/components/recibi/ui/RecipeTextarea/RecipeTextarea";
import { Button } from "@/components/recibi/ui/Button/Button";
import { ButtonGhost } from "@/components/recibi/ui/ButtonGhost/ButtonGhost";
import { NoticeCard } from "@/components/recibi/ui/NoticeCard/NoticeCard";
import { Skeleton } from "@/components/recibi/ui/Skeleton/Skeleton";
import { isYoutubeUrl } from "@/lib/recibi/validate";
import { extractRecipeFromText, extractRecipeFromUrl } from "@/lib/services/recibi/recipe-service";
import type { ExtractionResult } from "@/lib/services/recibi/recipe-service";
import type { RecipeInputMode } from "@/types/recibi";

const ACTIONS_ROW = "mt-[14px] flex flex-wrap gap-2.5";
const HINT = "mt-2.5 text-xs leading-[1.7] whitespace-pre-line";

const URL_HINT =
  "유튜브 영상 설명란에서 재료를 읽습니다.\n블로그·인스타 링크는 아직 지원하지 않습니다.";
const URL_ERROR_HINT =
  "유튜브 주소만 계산할 수 있습니다.\nyoutube.com 또는 youtu.be 링크를 넣어 주세요.";
const URL_PLACEHOLDER = "https://youtu.be/... 또는 youtube.com/watch?v=...";
const TEXT_PLACEHOLDER =
  "돼지고기 300g\n신김치 400g\n두부 1모\n\n레시피 본문을 통째로 붙여 넣어도 됩니다.";
const TEXT_BAR_NOTE = "한 줄에 재료 하나 · 인사말이나 타임스탬프는 알아서 걸러냅니다";
const TEXT_HINT =
  "'한 줌 · 적당량' 같은 표현은 평균값으로 바꿔 계산하고, 아래 재료별 금액에서 고칠 수 있습니다.";

interface RecipeSearchBarProps {
  /** 지금 열려 있는 입력 모드. 주소의 ?mode= 를 페이지가 읽어 넘긴다 */
  mode: RecipeInputMode;
}

/**
 * h1 링크 입력 · h2 직접 입력 · h3 형식오류 · c2 계산 대기 · h4 추출실패를 한 덩어리로 묶은 검색부.
 * 홈과 결과 화면 최상단에 같은 모습으로 놓인다 — 결과를 보는 중에도 넣은 링크가 그 자리에 남아야 한다.
 *
 * 입력 모드는 주소(?mode=)에 둔다. 직접 입력 화면을 그대로 링크로 걸 수 있고 새로고침해도 살아남는다.
 * 적어 둔 값은 Context에 두어 화면을 옮겨도 유지되고, 오류·대기·실패는 이 화면의 상태라 여기 로컬로 둔다.
 */
export function RecipeSearchBar({ mode }: RecipeSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { search, setSearch } = useRecibiApp();
  const [urlError, setUrlError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [recoveryText, setRecoveryText] = useState("");

  const { url, text } = search;

  /** 모드 전환은 주소만 바꾼다. 히스토리를 더럽히지 않도록 replace, 스크롤도 그대로 둔다 */
  function goToMode(next: RecipeInputMode) {
    const params = new URLSearchParams(searchParams);
    if (next === "url") params.delete("mode");
    else params.set("mode", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleModeChange(next: RecipeInputMode) {
    if (next === mode) return;
    goToMode(next);
    if (next === "text") setUrlError(false); // 2-1: 직접 입력으로 바꾸면 링크 오류 상태가 해제됨
  }

  function handleUrlChange(value: string) {
    setSearch({ url: value });
    if (urlError) setUrlError(false); // 한 글자라도 고치면 오류 상태 즉시 해제
  }

  async function goToResult(extractor: () => Promise<ExtractionResult>) {
    setIsSubmitting(true);
    const result = await extractor();
    setIsSubmitting(false);
    if (result.ok && result.recipe) {
      setHasFailed(false);
      const query = mode === "text" ? "?mode=text" : "";
      router.push(`/result/${result.recipe.id}${query}`);
      return;
    }
    setHasFailed(true);
  }

  async function handleUrlSubmit() {
    if (!isYoutubeUrl(url)) {
      setUrlError(true);
      return;
    }
    setUrlError(false);
    await goToResult(() => extractRecipeFromUrl(url));
  }

  async function handleTextSubmit() {
    if (!text.trim()) return; // 02_동작규칙 10-1 미정 — 최소 방어만 둔다
    await goToResult(() => extractRecipeFromText(text));
  }

  async function handleRecoverySubmit() {
    if (!recoveryText.trim()) return;
    await goToResult(() => extractRecipeFromText(recoveryText));
  }

  /** 넣은 링크와 그에 딸린 오류·실패 상태만 되돌린다 (직접 입력해 둔 글은 건드리지 않는다) */
  function clearUrl() {
    setSearch({ url: "" });
    setUrlError(false);
    setHasFailed(false);
    setRecoveryText("");
  }

  /** h4에서 처음부터 다시 — 모드까지 링크 입력으로 되돌린다 */
  function reset() {
    setSearch({ url: "", text: "" });
    setUrlError(false);
    setHasFailed(false);
    setRecoveryText("");
    goToMode("url");
  }

  return (
    <>
      <ModeSwitch mode={mode} onChange={handleModeChange} />

      {mode === "url" ? (
        <>
          <UrlInput
            value={url}
            onChange={handleUrlChange}
            onSubmit={handleUrlSubmit}
            error={urlError}
            placeholder={URL_PLACEHOLDER}
            showYoutubeTag={url.length > 0 && !urlError && isYoutubeUrl(url)}
            onClear={clearUrl}
            action={
              <Button
                variant="accent"
                onClick={handleUrlSubmit}
                disabled={isSubmitting || urlError}
              >
                {isSubmitting ? "계산 중" : "원가 계산"}
              </Button>
            }
          />
          <p className={`${HINT} ${urlError ? "text-accent" : "text-text-2"}`}>
            {urlError ? URL_ERROR_HINT : URL_HINT}
          </p>
        </>
      ) : (
        <>
          <RecipeTextarea
            placeholder={TEXT_PLACEHOLDER}
            value={text}
            onChange={(event) => setSearch({ text: event.target.value })}
            footNote={TEXT_BAR_NOTE}
            action={
              <Button onClick={handleTextSubmit} disabled={isSubmitting || !text.trim()}>
                {isSubmitting ? "계산 중" : "이 레시피로 계산"}
              </Button>
            }
          />
          <p className={`${HINT} max-w-[58ch] text-text-2`}>{TEXT_HINT}</p>
        </>
      )}

      {isSubmitting && (
        <div className="mt-[34px] flex flex-col gap-3" aria-hidden="true">
          <Skeleton height={64} />
          <Skeleton height={16} style={{ width: "60%" }} />
          <Skeleton height={16} style={{ width: "40%" }} />
        </div>
      )}

      {hasFailed && (
        <div className="mt-[34px]">
          <NoticeCard
            eyebrow="추출 실패"
            title="설명란에서 재료를 찾지 못했어요"
            description={
              "이 영상은 설명란에 재료 목록이 없습니다. 재료를 직접 적어 주시면 같은 방식으로 계산해 드립니다."
            }
          >
            <RecipeTextarea
              quiet
              compact
              placeholder={"돼지고기 300g\n신김치 400g\n두부 1모"}
              value={recoveryText}
              onChange={(event) => setRecoveryText(event.target.value)}
            />
            <div className={ACTIONS_ROW}>
              <Button
                size="sm"
                onClick={handleRecoverySubmit}
                disabled={isSubmitting || !recoveryText.trim()}
              >
                {isSubmitting ? "계산 중" : "이 레시피로 계산"}
              </Button>
              <ButtonGhost quiet size="sm" onClick={reset} disabled={isSubmitting}>
                다른 링크 넣기
              </ButtonGhost>
            </div>
          </NoticeCard>
        </div>
      )}
    </>
  );
}
