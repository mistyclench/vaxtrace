import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().min(1),
  unit: z.string().min(1),
  costPrice: z.number().min(0),
  sellPrice: z.number().min(0),
  reorderLevel: z.number().int().min(0),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const categoryId = req.nextUrl.searchParams.get("categoryId");

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(categoryId && { categoryId }),
    },
    include: { category: true, stock: { include: { outlet: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = productSchema.parse(body);
  const product = await prisma.product.create({ data, include: { category: true } });
  return NextResponse.json(product, { status: 201 });
}
