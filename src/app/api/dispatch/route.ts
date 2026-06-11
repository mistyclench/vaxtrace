import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const dispatchSchema = z.object({
  fromOutletId: z.string(),
  toOutletId: z.string().optional(),
  reason: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })).min(1),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dispatches = await prisma.stockDispatch.findMany({
    include: { fromOutlet: true, user: true, lines: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(dispatches);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = dispatchSchema.parse(body);

  const count = await prisma.stockDispatch.count();
  const year = new Date().getFullYear();
  const number = `DSP-${year}-${String(count + 1).padStart(4, "0")}`;

  const dispatch = await prisma.$transaction(async (tx) => {
    const d = await tx.stockDispatch.create({
      data: {
        number,
        fromOutletId: data.fromOutletId,
        toOutletId: data.toOutletId,
        userId: (session.user as any).id,
        reason: data.reason,
        lines: {
          create: data.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
        },
      },
      include: { fromOutlet: true, lines: { include: { product: true } } },
    });

    for (const line of data.lines) {
      // Decrease from-outlet
      await tx.stockItem.upsert({
        where: { productId_outletId: { productId: line.productId, outletId: data.fromOutletId } },
        create: { productId: line.productId, outletId: data.fromOutletId, quantity: -line.quantity },
        update: { quantity: { decrement: line.quantity } },
      });
      // Increase to-outlet if specified
      if (data.toOutletId) {
        await tx.stockItem.upsert({
          where: { productId_outletId: { productId: line.productId, outletId: data.toOutletId } },
          create: { productId: line.productId, outletId: data.toOutletId, quantity: line.quantity },
          update: { quantity: { increment: line.quantity } },
        });
      }
    }

    return d;
  });

  return NextResponse.json(dispatch, { status: 201 });
}
