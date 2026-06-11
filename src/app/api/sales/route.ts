import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { z } from "zod";

const saleLineSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const saleSchema = z.object({
  outletId: z.string(),
  customerId: z.string(),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  lpoNumber: z.string().optional(),
  lines: z.array(saleLineSchema).min(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const customerId = req.nextUrl.searchParams.get("customerId");

  const sales = await prisma.sale.findMany({
    where: {
      ...(status && { status: status as any }),
      ...(customerId && { customerId }),
    },
    include: { customer: true, outlet: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = saleSchema.parse(body);

  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const subtotal = data.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const taxAmount = (subtotal * data.taxRate) / 100;
  const total = subtotal + taxAmount;

  const newBalance = Number(customer.balance) + total;
  if (newBalance > Number(customer.creditLimit)) {
    return NextResponse.json(
      { error: `Credit limit exceeded. Available: ${Number(customer.creditLimit) - Number(customer.balance)}` },
      { status: 400 }
    );
  }

  const count = await prisma.sale.count();
  const year = new Date().getFullYear();
  const number = `INV-${year}-${String(count + 1).padStart(4, "0")}`;

  const sale = await prisma.$transaction(async (tx) => {
    const s = await tx.sale.create({
      data: {
        number,
        outletId: data.outletId,
        customerId: data.customerId,
        userId: (session.user as any).id,
        dueDate: addDays(new Date(), customer.creditDays),
        status: "DRAFT",
        subtotal,
        taxRate: data.taxRate,
        taxAmount,
        total,
        notes: data.notes,
        lpoNumber: data.lpoNumber,
        lines: {
          create: data.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            total: l.quantity * l.unitPrice,
          })),
        },
      },
      include: { customer: true, outlet: true, lines: { include: { product: true } } },
    });
    return s;
  });

  return NextResponse.json(sale, { status: 201 });
}
