import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role as string;

  const rows = await prisma.rolePermission.findMany({ where: { role } });

  const permissions: Record<string, string[]> = {};
  for (const row of rows) {
    if (!permissions[row.resource]) permissions[row.resource] = [];
    permissions[row.resource].push(row.action);
  }

  return NextResponse.json({ role, permissions });
}
