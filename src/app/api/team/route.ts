import { NextResponse } from "next/server";
import { getTeamMembers } from "@/lib/services/team-service";

export async function GET() {
  const members = await getTeamMembers();
  return NextResponse.json({ members });
}
