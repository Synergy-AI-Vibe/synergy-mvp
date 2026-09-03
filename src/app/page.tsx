import Link from "next/link";
import {
  parseRecipeInputMode,
  RecipeSearchBar,
} from "@/components/recibi/search/RecipeSearchBar";

// h1 홈(링크/직접입력) · h3 형식오류 · c2 계산대기 · h4 추출실패는 전부 RecipeSearchBar 안의 상태다.
// 02_동작규칙 11항: "실제 경로는 네 개면 충분합니다 — 홈(h1 h2 h3)"이므로 라우팅을 나누지 않는다.

const LEAD =
  "유튜브 주소를 넣거나 레시피를 직접 적으면\n재료를 마트 가격으로 계산해 사 먹을 때와 바로 비교해 줍니다.";

// 이 화면이 곧 빈 상태다 — "계산한 것이 없습니다" 대신 사용법 세 단계로 안내한다 (시안 h1)
const HOW_IT_WORKS = [
  {
    title: "레시피를 넣습니다",
    body: "유튜브 주소를 붙여 넣거나 레시피를 직접 적어도 됩니다. 인사말과 타임스탬프는 걸러냅니다.",
  },
  {
    title: "재료를 마트 가격으로 계산합니다",
    body: "'한 줌 · 적당량'은 g·ml로 바꾸고, 이 요리에 실제로 쓰는 양만큼만 값을 매깁니다.",
  },
  {
    title: "사 먹을 때와 비교합니다",
    body: "매장 가격과 나란히 놓아 이번 한 끼에 얼마가 남는지 알려줍니다.",
  },
];

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const mode = parseRecipeInputMode((await searchParams).mode);

  return (
    <main className="shrink-0 grow basis-auto">
      <section className="container pt-[clamp(28px,4vw,44px)]">
        <div className="pt-8 pb-10">
          <h1 className="mb-3 text-[clamp(26px,3.6vw,34px)] leading-[1.3] font-black tracking-[-0.035em]">
            레시피 하나면
            <br />
            얼마 아끼는지 나옵니다
          </h1>
          <p className="text-sm leading-[1.75] whitespace-pre-line text-text-2">{LEAD}</p>
        </div>

        <RecipeSearchBar mode={mode} />
      </section>

      <section className="container pt-[clamp(38px,5vw,56px)] pb-[clamp(48px,7vw,80px)]">
        <ol className="border-t border-line-strong">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.title} className="flex flex-wrap gap-[18px] border-b border-line py-[18px]">
              <span className="w-[26px] flex-none text-[15px] leading-[1.5] font-black text-accent">
                {index + 1}
              </span>
              <div className="min-w-[200px] flex-1">
                <p className="text-sm leading-[1.5] font-bold">{step.title}</p>
                <p className="mt-[3px] text-[12.5px] leading-[1.7] text-text-2">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* SUB 범위 — 링크가 없는 사람을 재료로 찾기로 보낸다 (시안 h1 하단) */}
        <div className="pt-[34px]">
          <div className="mb-[14px] flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="text-sm leading-[1.4] font-bold tracking-[-0.02em]">링크가 없다면</h2>
            <Link
              href="/pantry"
              className="text-[12.5px] font-bold text-accent hover:text-accent-hover active:text-accent-press"
            >
              재료로 찾기
            </Link>
          </div>
          <p className="text-[13px] leading-[1.75] text-text-2">
            냉장고에 있는 재료를 최대 5개까지 고르면
            <br />
            그걸로 만들 수 있는 레시피를 추가로 사야 하는 금액 순으로 보여줍니다.
          </p>
        </div>
      </section>
    </main>
  );
}
