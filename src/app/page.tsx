import { getTeamMembers } from "@/lib/services/team-service";
import type { TeamPart } from "@/types/team";

const PARTS: TeamPart[] = ["기획", "디자인", "FE", "BE"];

export default async function Home() {
  const members = await getTeamMembers();

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center gap-16 px-6 py-24">
        <section className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white">
            S
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            시너지 (Synergy)
          </h1>
          <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
            함께 만들어가는 팀, 시너지입니다.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            프로젝트 기간: 9/3 (10:00 ~ 15:00) · Next.js / Supabase
          </p>
        </section>

        <section className="w-full">
          <h2 className="mb-6 text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            팀 구성
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PARTS.map((part) => (
              <div
                key={part}
                className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {part}
                </span>
                <div className="flex flex-col gap-1">
                  {members
                    .filter((member) => member.part === part)
                    .map((member) => (
                      <span
                        key={member.name}
                        className="text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        {member.name}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
