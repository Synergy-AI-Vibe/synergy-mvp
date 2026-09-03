/** 부품 22 — 푸터. 고지 문구는 법무 성격이라 표현을 바꾸거나 줄이지 않는다 (02_동작규칙 1-7) */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="container flex flex-wrap items-center justify-between gap-4 py-[22px]">
        <span className="text-[13px] font-bold">레시비</span>
        <p className="max-w-[60ch] text-[11.5px] leading-[1.6] text-text-2">
          가격은 KAMIS · 참가격 공공 API 기준이며, 매장가는 조회 시점에 따라 실제와 다를 수 있습니다.
        </p>
      </div>
    </footer>
  );
}
