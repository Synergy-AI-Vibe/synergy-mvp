"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useHasMounted } from "@/context/RecibiAppContext";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * 부품 23 — 모달. Esc·바깥 클릭·닫기 버튼으로 닫힌다 (AccountMenu와 같은 닫힘 규칙).
 * 열려 있는 동안 Tab은 패널 안에서만 돌고, 닫으면 열기 전에 눌렀던 곳으로 초점을 돌려준다.
 */
export function Modal({ open, title, onClose, children }: ModalProps) {
  const hasMounted = useHasMounted();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // onClose를 effect 의존성에 직접 넣으면 부모가 콜백을 새로 만들 때마다
  // 초점 이동·스크롤 잠금이 다시 실행된다 — ref로 최신 값만 읽는다.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const targets = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!targets || targets.length === 0) return;
      const first = targets[0];
      const last = targets[targets.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!hasMounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-20 flex animate-fade-in items-center justify-center bg-scrim p-gutter"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-full w-full max-w-[420px] overflow-y-auto border border-line-strong bg-surface px-gutter pt-[22px] pb-gutter shadow-toast"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2
            className="text-[clamp(19px,2.4vw,22px)] font-black tracking-[-0.035em]"
            id={titleId}
          >
            {title}
          </h2>
          <button
            type="button"
            className="-mt-3 -mr-3 flex size-tap flex-none items-center justify-center text-sm text-text-3 hover:text-text active:text-accent"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
