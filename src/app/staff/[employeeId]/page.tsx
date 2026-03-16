"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { isLoggedIn } from "@/lib/auth-session";

type Equipment = {
  id: string | null;
  assetTag: string;
  serial?: string;
  model?: string;
  assignedToEmployeeId: string;
  source: string;
};

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = decodeURIComponent((params.employeeId as string) ?? "");
  const [staff, setStaff] = useState<{ employeeId: string; displayName: string; email: string } | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    if (!employeeId) return;
    (async () => {
      try {
        const [staffRes, eqRes] = await Promise.all([
          fetch("/api/staff"),
          fetch(`/api/equipment?employee_id=${encodeURIComponent(employeeId)}`),
        ]);
        if (!staffRes.ok) throw new Error("Unauthorized");
        const staffList = await staffRes.json();
        const person = staffList.find((s: { employeeId: string }) => s.employeeId === employeeId);
        if (!person) {
          setError("Not in your report scope");
          setLoading(false);
          return;
        }
        setStaff(person);
        setEquipment(eqRes.ok ? await eqRes.json() : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [employeeId, router]);

  async function markCollected(assetTag: string, serial?: string) {
    if (!employeeId) return;
    setCollecting(assetTag);
    try {
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetTag,
          serial,
          assignedToEmployeeId: employeeId,
          notes: notes[assetTag] || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      router.refresh();
      setEquipment((prev) => prev.filter((e) => e.assetTag !== assetTag));
      setNotes((prev) => ({ ...prev, [assetTag]: "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark collected");
    } finally {
      setCollecting(null);
    }
  }

  if (loading) return <div className="text-[var(--muted)]">Loading…</div>;
  if (error && !staff) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>;
  if (!staff) return <div className="text-[var(--muted)]">Staff not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">← Dashboard</Link>
      </div>
      <div className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--text)]">{staff.displayName}</h1>
        <p className="text-[var(--muted)]">{staff.employeeId} · {staff.email}</p>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">Assigned equipment</h2>
        {equipment.length === 0 ? (
          <p className="text-[var(--muted)]">No equipment listed for this employee.</p>
        ) : (
          <div className="space-y-4">
            {equipment.map((e) => (
              <div
                key={`${e.assetTag}-${e.assignedToEmployeeId}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--table-header-bg)]/30 p-4"
              >
                <div>
                  <p className="font-medium text-[var(--text)]">{e.assetTag}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {e.model ?? "—"} {e.serial ? `· ${e.serial}` : ""}
                  </p>
                </div>
                <div className="flex flex-1 flex-wrap items-end gap-2 sm:flex-none">
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    className="max-w-xs rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                    value={notes[e.assetTag] ?? ""}
                    onChange={(ev) => setNotes((prev) => ({ ...prev, [e.assetTag]: ev.target.value }))}
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--success)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    disabled={collecting === e.assetTag}
                    onClick={() => markCollected(e.assetTag, e.serial)}
                  >
                    {collecting === e.assetTag ? "Marking…" : "Mark collected"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
