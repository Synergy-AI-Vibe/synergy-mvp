import styles from "./Footer.module.css";

/** 부품 22 — 푸터. 고지 문구는 법무 성격이라 표현을 바꾸거나 줄이지 않는다 (02_동작규칙 1-7) */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.brand}>레시비</span>
        <p className={styles.notice}>
          가격은 KAMIS · 참가격 공공 API 기준이며, 매장가는 조회 시점에 따라 실제와 다를 수 있습니다.
        </p>
      </div>
    </footer>
  );
}
