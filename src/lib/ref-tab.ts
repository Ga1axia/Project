const REF_TAB_URL = process.env.REF_TAB_API_URL?.replace(/\/$/, "") ?? "";
const REF_TAB_KEY = process.env.REF_TAB_API_KEY ?? "";

export type RefTabAssignment = {
  asset_tag: string;
  serial?: string;
  model?: string;
  assigned_to_employee_id: string;
  status?: string;
};

/** Fetch equipment assignments from ref tab API. Returns empty array if not configured or error. */
export async function fetchRefTabAssignments(employeeIds: string[]): Promise<RefTabAssignment[]> {
  if (!REF_TAB_URL || !REF_TAB_KEY) return [];
  const results: RefTabAssignment[] = [];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${REF_TAB_KEY}`,
  };
  for (const eid of employeeIds) {
    try {
      const res = await fetch(`${REF_TAB_URL}/assignments?employee_id=${encodeURIComponent(eid)}`, { headers });
      if (!res.ok) continue;
      const data = (await res.json()) as RefTabAssignment[] | { data?: RefTabAssignment[] };
      const list = Array.isArray(data) ? data : (data as { data?: RefTabAssignment[] }).data ?? [];
      results.push(...list.filter((a) => a.assigned_to_employee_id === eid));
    } catch {
      // ignore per-employee errors
    }
  }
  return results;
}
