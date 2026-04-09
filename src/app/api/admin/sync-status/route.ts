import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [latestEquipment, latestUser] = await Promise.all([
    prisma.equipmentAssignment.findFirst({
      where: { lastSyncedAt: { not: null } },
      orderBy: { lastSyncedAt: "desc" },
      select: { lastSyncedAt: true },
    }),
    prisma.user.findFirst({
      where: { lastSyncedAt: { not: null } },
      orderBy: { lastSyncedAt: "desc" },
      select: { lastSyncedAt: true },
    }),
  ]);

  const reftabSyncedAt = latestEquipment?.lastSyncedAt?.toISOString() ?? null;
  const entraSyncedAt = latestUser?.lastSyncedAt?.toISOString() ?? null;

  // Backward-compatible: lastSyncedAt is the most recent of the two
  const times = [reftabSyncedAt, entraSyncedAt].filter(Boolean) as string[];
  const lastSyncedAt = times.length > 0
    ? times.sort().reverse()[0]
    : null;

  return NextResponse.json({
    lastSyncedAt,
    reftabSyncedAt,
    entraSyncedAt,
  });
}
