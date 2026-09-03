const SURVEY_URL = "https://forms.gle/PVMJbyBAD1Q4o8i48";
const LABEL = "만족도 조사";

/**
 * 만족도 조사로 보내는 플로팅 버튼. 모든 화면 우하단에 떠 있다.
 *
 * z-10 — 모달(20)과 토스트(30) 아래다. 모달이 떠 있는 동안 이 버튼이 어둠막 위로 올라오면
 * 안 되고, 완료 토스트도 이 버튼에 가리면 안 된다.
 * 토스트는 화면 가운데 아래(bottom 28px)라 좁은 화면에서 겹칠 수 있어 높이를 한 단 올려 둔다.
 */
export function SurveyButton() {
  return (
    <a
      href={SURVEY_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={LABEL}
      className="fixed right-gutter bottom-[84px] z-10 inline-flex size-13 items-center justify-center bg-accent text-on-ink shadow-toast hover:bg-accent-hover focus-visible:outline-text active:bg-accent-press sm:bottom-7"
    >
      {/* 말풍선 — 모서리를 직각으로 그려 반경 0 원칙에 맞춘다 (11_디자인시스템) */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M3.5 4.5h17v11h-9l-4 4v-4h-4z" />
        <path d="M7.5 8.5h9M7.5 11.5h5.5" />
      </svg>
      <span className="sr-only">{LABEL} (새 창에서 열림)</span>
    </a>
  );
}
