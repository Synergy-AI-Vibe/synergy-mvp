import styles from "./TabBar.module.css";

/** 부품 08 — 탭. 결과 화면(r1/r2/r4) 전용. 라우팅이 아니라 화면 상태다 (02_동작규칙 11항) */
export interface TabItem {
  key: string;
  label: string;
  meta?: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function TabBar({ tabs, activeKey, onChange }: TabBarProps) {
  return (
    <div className={styles.wrap}>
      <div className={`container ${styles.list}`.trim()} role="tablist">
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`tab-${tab.key}`}
              aria-selected={active}
              aria-controls={`panel-${tab.key}`}
              className={[styles.tab, active && styles.on].filter(Boolean).join(" ")}
              onClick={() => onChange(tab.key)}
            >
              <span className={styles.label}>{tab.label}</span>
              {tab.meta && <span className={styles.meta}>{tab.meta}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
