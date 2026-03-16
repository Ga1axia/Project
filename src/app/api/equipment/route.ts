import { NextRequest, NextResponse } from "next/server";
import { getCurrentEmployeeId, getReportEmployeeIds } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchRefTabAssignments } from "@/lib/ref-tab";

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

  const employeeId = req.nextUrl.searchParams.get("employee_id");
  const targetIds = employeeId ? (scope.includes(employeeId) ? [employeeId] : []) : scope;
  if (targetIds.length === 0 && employeeId) {
    return NextResponse.json({ error: "Forbidden or not found" }, { status: 403 });
  }

  const fromDb = await prisma.equipmentAssignment.findMany({
    where: { assignedToEmployeeId: { in: targetIds } },
    select: {
      id: true,
      assetTag: true,
      serial: true,
      model: true,
      assignedToEmployeeId: true,
      source: true,
      lastSyncedAt: true,
    },
    orderBy: { assetTag: "asc" },
  });

  const fromRefTab = await fetchRefTabAssignments(targetIds);
  const refTabSet = new Set(fromDb.map((e) => `${e.assetTag}-${e.assignedToEmployeeId}`));
  const merged = [
    ...fromDb.map((e) => ({
      id: e.id,
      assetTag: e.assetTag,
      serial: e.serial ?? undefined,
      model: e.model ?? undefined,
      assignedToEmployeeId: e.assignedToEmployeeId,
      source: e.source,
      lastSyncedAt: e.lastSyncedAt?.toISOString() ?? null,
    })),
    ...fromRefTab
      .filter((a) => !refTabSet.has(`${a.asset_tag}-${a.assigned_to_employee_id}`))
      .map((a) => ({
        id: null,
        assetTag: a.asset_tag,
        serial: a.serial,
        model: a.model,
        assignedToEmployeeId: a.assigned_to_employee_id,
        source: "ref_tab" as const,
        lastSyncedAt: null as string | null,
      })),
  ];

  return NextResponse.json(merged);
}
