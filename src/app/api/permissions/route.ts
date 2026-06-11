import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.rolePermission.findMany();

  const grouped: Record<string, Record<string, string[]>> = {};
  for (const row of rows) {
    if (!grouped[row.role]) grouped[row.role] = {};
    if (!grouped[row.role][row.resource]) grouped[row.role][row.resource] = [];
    grouped[row.role][row.resource].push(row.action);
  }

  return NextResponse.json(grouped);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { role, resource, actions } = await req.json();
  if (!role || !resource || !Array.isArray(actions)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { role, resource } }),
    ...actions.map((action: string) =>
      prisma.rolePermission.create({ data: { role, resource, action } })
    ),
  ]);

  return NextResponse.json({ ok: true });
}
