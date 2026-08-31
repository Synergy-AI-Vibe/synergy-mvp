import { teamMembers, type TeamMember } from "@/server/data/team";

export async function getTeamMembers(): Promise<TeamMember[]> {
  return teamMembers;
}
