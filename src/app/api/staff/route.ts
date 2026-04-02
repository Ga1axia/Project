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
  if (reportIds.length === 0) {
    const staff = await prisma.user.findMany({
      where: { managerId: (await prisma.user.findUnique({ where: { employeeId: managerId }, select: { id: true } }))?.id ?? "" },
      select: { employeeId: true, displayName: true, email: true },
      orderBy: { displayName: "asc" },
    });
    return NextResponse.json(staff);
  }
  const staff = await prisma.user.findMany({
    where: { employeeId: { in: reportIds } },
    select: { employeeId: true, displayName: true, email: true },
    orderBy: { displayName: "asc" },
  });
  return NextResponse.json(staff);
}
