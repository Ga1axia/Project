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
    include: {
      markedByManager: { select: { displayName: true, employeeId: true } },
    },
  });

  // Aggregate: total by IT vs by managers
  let byIT = 0;
  let byManager = 0;
  const managerStats: Record<string, {
    managerName: string;
    managerId: string;
    totalUnderReports: number;
    collectedByManager: number;
    collectedByIT: number;
  }> = {};

  for (const e of events) {
    if (e.collectedByRole === "it") {
      byIT++;
    } else {
      byManager++;
    }

    const mKey = e.markedByManager.employeeId;
    if (!managerStats[mKey]) {
      managerStats[mKey] = {
        managerName: e.markedByManager.displayName,
        managerId: mKey,
        totalUnderReports: 0,
        collectedByManager: 0,
        collectedByIT: 0,
      };
    }
    managerStats[mKey].totalUnderReports++;
    if (e.collectedByRole === "it") {
      managerStats[mKey].collectedByIT++;
    } else {
      managerStats[mKey].collectedByManager++;
    }
  }

  // Sort by IT collections descending (worst offenders first)
  const managerRanking = Object.values(managerStats).sort(
    (a, b) => b.collectedByIT - a.collectedByIT
  );

  return NextResponse.json({
    totalByIT: byIT,
    totalByManager: byManager,
    total: events.length,
    managerRanking,
  });
}
