import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      outlet: true,
      user: true,
      lines: { include: { product: { include: { category: true } } } },
      documents: true,
    },
  });
  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sale);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, amountPaid } = await req.json();
  const existingSale = await prisma.sale.findUnique({
    where: { id },
    include: { customer: true, lines: true },
  });
  if (!existingSale) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sale = await prisma.$transaction(async (tx) => {
    // If confirming, reduce stock
    if (status === "CONFIRMED" && existingSale.status === "DRAFT") {
      for (const line of existingSale.lines) {
        await tx.stockItem.upsert({
          where: { productId_outletId: { productId: line.productId, outletId: existingSale.outletId } },
          create: {
            productId: line.productId,
            outletId: existingSale.outletId,
            quantity: -Number(line.quantity),
          },
          update: { quantity: { decrement: Number(line.quantity) } },
        });
      }
      // Update customer balance
      await tx.customer.update({
        where: { id: existingSale.customerId },
        data: { balance: { increment: Number(existingSale.total) } },
      });
    }

    // Record payment
    let newStatus = status ?? existingSale.status;
    const newAmountPaid = amountPaid !== undefined
      ? Number(amountPaid)
      : Number(existingSale.amountPaid);

    if (amountPaid !== undefined) {
      const reduction = Number(amountPaid) - Number(existingSale.amountPaid);
      if (reduction > 0) {
        await tx.customer.update({
          where: { id: existingSale.customerId },
          data: { balance: { decrement: reduction } },
        });
      }
      if (newAmountPaid >= Number(existingSale.total)) newStatus = "PAID";
      else if (newAmountPaid > 0) newStatus = "PARTIALLY_PAID";
    }

    return tx.sale.update({
      where: { id },
      data: { status: newStatus, amountPaid: newAmountPaid },
      include: { customer: true, outlet: true, lines: { include: { product: true } } },
    });
  });

  return NextResponse.json(sale);
}
