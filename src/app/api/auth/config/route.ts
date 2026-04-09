import { NextResponse } from "next/server";
import { isSSOConfigured } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ssoEnabled: isSSOConfigured() });
}
