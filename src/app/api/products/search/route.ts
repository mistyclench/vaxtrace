import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const outletId = req.nextUrl.searchParams.get("outletId") ?? "";

  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      stock: outletId ? { where: { outletId } } : true,
    },
    take: 10,
    orderBy: { name: "asc" },
  });

  const result = products.map((p) => {
    const stockEntry = outletId
      ? p.stock.find((s: any) => s.outletId === outletId)
      : p.stock[0];
    return {
      id: p.id,
      name: p.name,
      code: p.code,
      unit: p.unit,
      sellPrice: Number(p.sellPrice),
      stock: stockEntry ? Number(stockEntry.quantity) : 0,
    };
  });

  return NextResponse.json(result);
}
