import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentEmployeeId } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({ eventId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const employeeId = await getCurrentEmployeeId();
  if (!employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { employeeId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.collectionEvent.findUnique({
    where: { id: parsed.data.eventId },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (event.status === "CLOSED_OUT") {
    return NextResponse.json({ error: "Already closed out" }, { status: 400 });
  }

  await prisma.collectionEvent.update({
    where: { id: parsed.data.eventId },
    data: {
      status: "CLOSED_OUT",
      closedOutByItEmployeeId: user.id,
      closedOutAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, eventId: parsed.data.eventId, status: "CLOSED_OUT" });
}
