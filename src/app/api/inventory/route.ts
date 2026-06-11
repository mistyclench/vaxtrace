import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const outletId = req.nextUrl.searchParams.get("outletId");

  const stock = await prisma.stockItem.findMany({
    where: { ...(outletId && { outletId }) },
    include: {
      product: { include: { category: true } },
      outlet: true,
    },
    orderBy: [{ outlet: { name: "asc" } }, { product: { name: "asc" } }],
  });
  return NextResponse.json(stock);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Stock taking adjustment
  const { productId, outletId, quantity } = await req.json();
  const item = await prisma.stockItem.upsert({
    where: { productId_outletId: { productId, outletId } },
    create: { productId, outletId, quantity },
    update: { quantity },
    include: { product: true, outlet: true },
  });
  return NextResponse.json(item);
}
