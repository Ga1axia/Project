import { NextRequest, NextResponse } from "next/server";
import { getCurrentEmployeeId, getReportEmployeeIds } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const managerId = await getCurrentEmployeeId();
  if (!managerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reportIds = await getReportEmployeeIds(managerId);
  const scope = reportIds.length > 0 ? reportIds : (await prisma.user.findMany({
    where: { manager: { employeeId: managerId } },
    select: { employeeId: true },
  })).map((u) => u.employeeId);

  const startDate = req.nextUrl.searchParams.get("start");
  const endDate = req.nextUrl.searchParams.get("end");

  const where: Record<string, unknown> = {
    assignedToEmployeeId: { in: scope },
  };
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    where.markedCollectedAt = dateFilter;
  }

  const events = await prisma.collectionEvent.findMany({
    where,
    orderBy: { markedCollectedAt: "desc" },
    include: {
      markedByManager: { select: { displayName: true } },
    },
  });

  // Aggregate by model/category
  const byModel: Record<string, number> = {};
  const byDate: Record<string, number> = {};
  for (const e of events) {
    // Group by model (from asset tag pattern or notes)
    const model = e.assetTag.split("-")[0] ?? "Other";
    byModel[model] = (byModel[model] ?? 0) + 1;

    // Group by date
    const dateKey = e.markedCollectedAt.toISOString().split("T")[0];
    byDate[dateKey] = (byDate[dateKey] ?? 0) + 1;
  }

  return NextResponse.json({
    total: events.length,
    byModel,
    byDate,
    events: events.map((e) => ({
      id: e.id,
      assetTag: e.assetTag,
      serial: e.serial,
      assignedToEmployeeId: e.assignedToEmployeeId,
      markedByManager: e.markedByManager.displayName,
      markedCollectedAt: e.markedCollectedAt.toISOString(),
      notes: e.notes,
      status: e.status,
      collectedByRole: e.collectedByRole,
    })),
  });
}
