// TODO: `npm run db:types`로 생성되는 database.types.ts가 생기면
// Database["public"]["Tables"]["team_members"]["Row"] 기반으로 교체
export type TeamPart = "기획" | "디자인" | "FE" | "BE";

export type TeamMember = {
  name: string;
  part: TeamPart;
};
