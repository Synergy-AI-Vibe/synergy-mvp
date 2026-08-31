import { teamMembers } from "@/lib/data/team";
import type { TeamMember } from "@/types/team";

export async function getTeamMembers(): Promise<TeamMember[]> {
  return teamMembers;
}
