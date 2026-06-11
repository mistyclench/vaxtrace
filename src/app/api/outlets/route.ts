import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = (session.user as any).role as string;
  const userOutletId = (session.user as any).outletId as string | undefined;

  const outlets = await prisma.outlet.findMany({
    where: {
      active: true,
      ...(userRole === "SALES" && userOutletId && { id: userOutletId }),
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(outlets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  const outlet = await prisma.outlet.create({ data });
  return NextResponse.json(outlet, { status: 201 });
}
