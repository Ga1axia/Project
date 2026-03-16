const PROVIDER = (process.env.NOTIFICATION_PROVIDER ?? "webhook").toLowerCase();
const WEBHOOK_URL = process.env.WEBHOOK_URL ?? "";
const TEAMS_URL = process.env.TEAMS_WEBHOOK_URL ?? "";
const SMTP = {
  host: process.env.SMTP_HOST ?? "",
  port: Number(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER ?? "",
  pass: process.env.SMTP_PASS ?? "",
};
const NOTIFICATION_EMAIL_TO = process.env.NOTIFICATION_EMAIL_TO ?? "it@company.com";
const APP_BASE_URL = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type CollectionPayload = {
  assetTag: string;
  serial?: string;
  employeeId: string;
  employeeName: string;
  markedByManagerId: string;
  markedByManagerName: string;
  notes?: string;
  markedAt: string;
  eventId: string;
};

export async function notifyItCollected(payload: CollectionPayload): Promise<{ ok: boolean; error?: string }> {
  const text = `Equipment collection: ${payload.assetTag} (${payload.serial ?? "n/a"}) — assigned to ${payload.employeeName} (${payload.employeeId}). Marked collected by ${payload.markedByManagerName} at ${payload.markedAt}. ${payload.notes ? `Notes: ${payload.notes}` : ""} View: ${APP_BASE_URL}/collection`;
  const body = {
    event: "equipment_collected",
    ...payload,
    message: text,
    link: `${APP_BASE_URL}/collection`,
  };

  if (PROVIDER === "teams" && TEAMS_URL) {
    try {
      const res = await fetch(TEAMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "@type": "MessageCard",
          summary: "Equipment collected",
          title: "Equipment collection",
          text,
          potentialAction: [{ "@type": "OpenUri", name: "View portal", targets: [{ os: "default", uri: body.link }] }],
        }),
      });
      return { ok: res.ok, error: res.ok ? undefined : await res.text() };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  if (PROVIDER === "webhook" && WEBHOOK_URL) {
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return { ok: res.ok, error: res.ok ? undefined : await res.text() };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  if (PROVIDER === "email" && SMTP.host) {
    try {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.default.createTransport({
        host: SMTP.host,
        port: SMTP.port,
        secure: false,
        auth: SMTP.user ? { user: SMTP.user, pass: SMTP.pass } : undefined,
      });
      await transport.sendMail({
        from: SMTP.user || "portal@localhost",
        to: NOTIFICATION_EMAIL_TO,
        subject: `[Equipment Portal] Collected: ${payload.assetTag} — ${payload.employeeName}`,
        text,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  return { ok: false, error: "No notification channel configured" };
}
