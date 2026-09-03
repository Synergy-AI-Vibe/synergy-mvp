import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

/** 부품 06 — 글자 링크. href가 있으면 내부 이동 링크, 없으면 버튼(동작 트리거)으로 렌더링 */
type TextLinkProps =
  | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>);

const BASE =
  "inline-flex min-h-tap items-center text-[13.5px] font-medium text-text-2 hover:text-accent active:text-accent-press disabled:cursor-default disabled:text-disabled";

export function TextLink(props: TextLinkProps) {
  if (props.href) {
    const { href, className, ...rest } = props;
    return <Link href={href} className={[BASE, className].filter(Boolean).join(" ")} {...rest} />;
  }
  const { className, ...rest } = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={[BASE, className].filter(Boolean).join(" ")} {...rest} />
  );
}
