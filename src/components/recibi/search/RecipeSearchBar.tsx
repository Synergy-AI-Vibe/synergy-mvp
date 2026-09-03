"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { ModeSwitch } from "@/components/recibi/ui/ModeSwitch/ModeSwitch";
import { UrlInput } from "@/components/recibi/ui/UrlInput/UrlInput";
import { RecipeTextarea } from "@/components/recibi/ui/RecipeTextarea/RecipeTextarea";
import { Button } from "@/components/recibi/ui/Button/Button";
import { ButtonGhost } from "@/components/recibi/ui/ButtonGhost/ButtonGhost";
import { NoticeCard } from "@/components/recibi/ui/NoticeCard/NoticeCard";
import { Skeleton } from "@/components/recibi/ui/Skeleton/Skeleton";
import { isYoutubeUrl } from "@/lib/recibi/validate";
import { setCurrentAnalysis } from "@/lib/current-analysis";
import type { AnalyzeRequest, AnalyzeResponse } from "@/types/api";
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

/** h4 — 실패 사유는 서버가 문구까지 내려준다. 화면에서 지어내지 않는다 */
interface FailureInfo {
  eyebrow: string;
  title: string;
  description: string;
}

/**
 * h1 링크 입력 · h2 직접 입력 · h3 형식오류 · c2 계산 대기 · h4 추출실패를 한 덩어리로 묶은 검색부.
 * 홈과 결과 화면 최상단에 같은 모습으로 놓인다 — 결과를 보는 중에도 넣은 링크가 그 자리에 남아야 한다.
 *
 * 적어 둔 값은 Context에 두어 화면을 옮겨도 유지되고, 오류·대기·실패는 이 화면의 상태라 여기 로컬로 둔다.
 */
export function RecipeSearchBar() {
  const router = useRouter();
  const { search, setSearch } = useRecibiApp();
  // 입력 모드는 이 화면의 상태다 — 주소에 두지 않는다.
  // 이 앱은 루트 레이아웃이 쿠키를 읽어 모든 경로가 동적이라, 주소를 건드리면 탭을 누를 때마다
  // 서버 왕복이 생겨 전환이 눈에 띄게 느려진다(실측 prod 245ms · dev 1s). 탭은 라우팅이 아니라
  // 화면 상태라는 02_동작규칙 11항과도 맞고, 결과 화면의 세 탭도 같은 방식이다.
  const [mode, setMode] = useState<RecipeInputMode>("url");
  const [urlError, setUrlError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failure, setFailure] = useState<FailureInfo | null>(null);
  const [recoveryText, setRecoveryText] = useState("");

  const { url, text } = search;

  /** 탭을 바꾸면 적어 둔 값과 그에 딸린 오류·실패를 모두 비운다 — 새 입력으로 시작한다 */
  function handleModeChange(next: RecipeInputMode) {
    if (next === mode) return;
    setMode(next);
    setSearch({ url: "", text: "" });
    setUrlError(false); // 2-1: 직접 입력으로 바꾸면 링크 오류 상태가 해제됨
    setFailure(null);
    setRecoveryText("");
  }

  function handleUrlChange(value: string) {
    setSearch({ url: value });
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
      setFailure(null);
      setCurrentAnalysis(response.data);
      const { sourceType, sourceUrl } = response.data.recipe;
      const query =
        sourceType === "youtube" && sourceUrl ? `?url=${encodeURIComponent(sourceUrl)}` : "";
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
        title: response.videoTitle
          ? `"${response.videoTitle}"에서 재료를 찾지 못했습니다`
          : "설명란에서 재료를 찾지 못했어요",
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
    if (!isYoutubeUrl(url)) {
      setUrlError(true);
      return;
    }
    setUrlError(false);
    await callAnalyze({ url });
  }

  async function handleTextSubmit() {
    if (!text.trim()) return; // 빈 입력 검증 규칙은 아직 정해지지 않아 최소 방어만 둔다
    await callAnalyze({ text });
  }

  async function handleRecoverySubmit() {
    if (!recoveryText.trim()) return;
    await callAnalyze({ text: recoveryText });
  }

  /** 넣은 링크와 그에 딸린 오류·실패 상태만 되돌린다 (직접 입력해 둔 글은 건드리지 않는다) */
  function clearUrl() {
    setSearch({ url: "" });
    setUrlError(false);
    setFailure(null);
    setRecoveryText("");
  }

  /** h4에서 처음부터 다시 — 모드까지 링크 입력으로 되돌린다 */
  function reset() {
    setSearch({ url: "", text: "" });
    setUrlError(false);
    setFailure(null);
    setRecoveryText("");
    setMode("url");
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
            onClear={clearUrl}
            action={
              <Button variant="accent" onClick={handleUrlSubmit} disabled={isSubmitting || urlError}>
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

      {failure && (
        <div className="mt-[34px]">
          <NoticeCard
            eyebrow={failure.eyebrow}
            title={failure.title}
            description={failure.description}
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
