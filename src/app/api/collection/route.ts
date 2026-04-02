import { NextResponse } from "next/server";
import { getCurrentEmployeeId, getReportEmployeeIds } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const managerId = await getCurrentEmployeeId();
  if (!managerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const reportIds = await getReportEmployeeIds(managerId);
  const scope = reportIds.length > 0 ? reportIds : (await prisma.user.findMany({
    where: { manager: { employeeId: managerId } },
    select: { employeeId: true },
  })).map((u) => u.employeeId);

  const events = await prisma.collectionEvent.findMany({
    where: { assignedToEmployeeId: { in: scope } },
    orderBy: { markedCollectedAt: "desc" },
    include: {
      markedByManager: { select: { displayName: true, employeeId: true } },
      closedOutByIt: { select: { displayName: true, employeeId: true } },
    },
  });

  return NextResponse.json(
    events.map((e) => ({
      id: e.id,
      assetTag: e.assetTag,
      serial: e.serial,
      assignedToEmployeeId: e.assignedToEmployeeId,
      markedByManager: e.markedByManager.displayName,
      markedByManagerId: e.markedByManager.employeeId,
      markedCollectedAt: e.markedCollectedAt.toISOString(),
      notes: e.notes,
      status: e.status,
      closedOutAt: e.closedOutAt?.toISOString() ?? null,
      closedOutBy: e.closedOutByIt?.displayName ?? null,
    }))
  );
}
