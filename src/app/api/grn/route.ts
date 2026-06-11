import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const grnSchema = z.object({
  outletId: z.string(),
  supplier: z.string().min(1),
  lpoRef: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    unitCost: z.number().min(0),
  })).min(1),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const grns = await prisma.goodsReceivedNote.findMany({
    include: { outlet: true, user: true, lines: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(grns);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = grnSchema.parse(body);

  const count = await prisma.goodsReceivedNote.count();
  const year = new Date().getFullYear();
  const number = `GRN-${year}-${String(count + 1).padStart(4, "0")}`;

  const grn = await prisma.$transaction(async (tx) => {
    const g = await tx.goodsReceivedNote.create({
      data: {
        number,
        outletId: data.outletId,
        userId: (session.user as any).id,
        supplier: data.supplier,
        lpoRef: data.lpoRef,
        notes: data.notes,
        lines: {
          create: data.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitCost: l.unitCost,
          })),
        },
      },
      include: { outlet: true, lines: { include: { product: true } } },
    });

    // Increase stock
    for (const line of data.lines) {
      await tx.stockItem.upsert({
        where: { productId_outletId: { productId: line.productId, outletId: data.outletId } },
        create: { productId: line.productId, outletId: data.outletId, quantity: line.quantity },
        update: { quantity: { increment: line.quantity } },
      });
    }

    return g;
  });

  return NextResponse.json(grn, { status: 201 });
}
