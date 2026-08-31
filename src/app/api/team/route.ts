import { NextResponse } from "next/server";
import { getTeamMembers } from "@/server/services/team-service";

export async function GET() {
  const members = await getTeamMembers();
  return NextResponse.json({ members });
}
