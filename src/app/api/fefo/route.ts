import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now   = new Date();
  const in90  = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // All GRN lines that have an expiryDate in the future (within 90 days) or already past
  const lines = await prisma.grnLine.findMany({
    where: { expiryDate: { lte: in90 } },
    include: {
      product: { select: { id: true, name: true, code: true, unit: true } },
      grn: { select: { number: true, supplier: true, outlet: { select: { name: true } } } },
    },
    orderBy: { expiryDate: "asc" },
  });

  const result = lines.map((l) => {
    const exp     = l.expiryDate!;
    const daysLeft = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const status  = daysLeft < 0 ? "EXPIRED" : daysLeft <= 30 ? "CRITICAL" : daysLeft <= 60 ? "WARNING" : "WATCH";
    return {
      id:          l.id,
      batchNumber: l.batchNumber ?? "—",
      expiryDate:  exp.toISOString(),
      daysLeft,
      status,
      quantity:    Number(l.quantity),
      unit:        l.product.unit,
      productId:   l.product.id,
      productName: l.product.name,
      productCode: l.product.code,
      grnNumber:   l.grn.number,
      supplier:    l.grn.supplier,
      outlet:      l.grn.outlet.name,
    };
  });

  return NextResponse.json(result);
}
