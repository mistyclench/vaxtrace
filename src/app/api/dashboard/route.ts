import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    totalSales,
    pendingInvoices,
    totalCustomers,
    lowStockItems,
    recentSales,
    totalRevenue,
  ] = await Promise.all([
    prisma.sale.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.sale.count({ where: { status: { in: ["CONFIRMED", "DISPATCHED", "PARTIALLY_PAID"] } } }),
    prisma.customer.count({ where: { active: true } }),
    prisma.stockItem.findMany({
      where: { quantity: { lte: 0 } },
      include: { product: true, outlet: true },
      take: 10,
    }),
    prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true, outlet: true },
    }),
    prisma.sale.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
    }),
  ]);

  return NextResponse.json({
    totalSales,
    pendingInvoices,
    totalCustomers,
    lowStockItems,
    recentSales,
    totalRevenue: totalRevenue._sum.total ?? 0,
  });
}
