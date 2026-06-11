import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const outletId  = searchParams.get("outletId");
  const days      = parseInt(searchParams.get("days") ?? "14");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: any = { recordedAt: { gte: since } };
  if (productId) where.productId = productId;
  if (outletId)  where.outletId  = outletId;

  const logs = await prisma.temperatureLog.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, code: true } },
      outlet:  { select: { id: true, name: true } },
    },
    orderBy: { recordedAt: "asc" },
    take: 500,
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, outletId, minTemp, maxTemp, currentTemp } = await req.json();

  if (!productId || !outletId || currentTemp === undefined) {
    return NextResponse.json({ error: "productId, outletId and currentTemp required" }, { status: 400 });
  }

  const log = await prisma.temperatureLog.create({
    data: {
      productId,
      outletId,
      minTemp:     minTemp     ?? currentTemp,
      maxTemp:     maxTemp     ?? currentTemp,
      currentTemp: currentTemp,
    },
  });

  return NextResponse.json(log, { status: 201 });
}

// Summary endpoint: last reading per product per outlet
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}
