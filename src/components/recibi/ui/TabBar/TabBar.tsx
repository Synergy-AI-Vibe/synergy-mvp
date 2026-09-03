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

const TAB =
  "flex min-h-tap items-baseline gap-[7px] border-b-2 py-[15px] -mb-px active:border-b-accent";

export function TabBar({ tabs, activeKey, onChange }: TabBarProps) {
  return (
    <div className="sticky top-0 z-[4] border-b border-line bg-surface">
      <div className="container flex flex-wrap gap-7" role="tablist">
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
              className={`${TAB} ${
                active ? "border-b-text text-text" : "border-b-transparent text-text-3 hover:text-text"
              }`}
              onClick={() => onChange(tab.key)}
            >
              <span className="text-sm font-bold tracking-[-0.02em]">{tab.label}</span>
              {tab.meta && (
                <span
                  className={`text-[12.5px] font-medium ${active ? "text-text-2" : "text-text-4"}`}
                >
                  {tab.meta}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
