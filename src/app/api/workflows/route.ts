import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workflows = await prisma.workflowConfig.findMany({
    include: { steps: { orderBy: { stepOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(workflows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { trigger, name, description, active, steps } = await req.json();
  if (!trigger || !name) {
    return NextResponse.json({ error: "trigger and name are required" }, { status: 400 });
  }

  const workflow = await prisma.$transaction(async (tx) => {
    const existing = await tx.workflowConfig.findUnique({ where: { trigger } });
    let wf;
    if (existing) {
      wf = await tx.workflowConfig.update({
        where: { trigger },
        data: { name, description, active },
      });
      await tx.workflowConfigStep.deleteMany({ where: { workflowId: wf.id } });
    } else {
      wf = await tx.workflowConfig.create({ data: { trigger, name, description, active } });
    }
    if (Array.isArray(steps) && steps.length > 0) {
      await tx.workflowConfigStep.createMany({
        data: steps.map((s: any) => ({
          workflowId: wf.id,
          stepOrder: s.stepOrder,
          approverRole: s.approverRole,
          label: s.label,
          required: s.required ?? true,
        })),
      });
    }
    return tx.workflowConfig.findUnique({
      where: { id: wf.id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
  });

  return NextResponse.json(workflow, { status: 200 });
}
