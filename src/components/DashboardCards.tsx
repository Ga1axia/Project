"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { DashboardData } from "@/types/dashboard";
import ContentHeader from "./ContentHeader";

const CARD_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "has_equipment", label: "Has equipment" },
  { value: "no_equipment", label: "No equipment" },
];

export default function DashboardCards({ data, initialSearchQuery = "" }: { data: DashboardData; initialSearchQuery?: string }) {
  const { me, staff, equipmentByEmployee } = data;
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filterBy, setFilterBy] = useState("all");

  useEffect(() => {
    if (initialSearchQuery) setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = staff;
    if (q) {
      list = list.filter(
        (s) =>
          s.displayName.toLowerCase().includes(q) ||
          s.employeeId.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }
    if (filterBy === "has_equipment") {
      list = list.filter((s) => (equipmentByEmployee[s.employeeId]?.length ?? 0) > 0);
    } else if (filterBy === "no_equipment") {
      list = list.filter((s) => (equipmentByEmployee[s.employeeId]?.length ?? 0) === 0);
    }
    return list;
  }, [staff, searchQuery, filterBy, equipmentByEmployee]);

  return (
    <div className="space-y-6">
      <ContentHeader
        title="Reports (cards)"
        searchPlaceholder="Search reports"
        showFilter={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={CARD_FILTER_OPTIONS}
        selectedFilter={filterBy}
        onFilterChange={setFilterBy}
        showSettingsLink={true}
      />
      <p className="text-sm text-[var(--muted)]">
        Signed in as {me.displayName} ({me.employeeId}) · Showing {filteredStaff.length} of {staff.length}
      </p>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((s) => {
            const items = equipmentByEmployee[s.employeeId] ?? [];
            return (
              <div
                key={s.employeeId}
                className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-[var(--accent)]/40"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
                        {s.displayName.charAt(0)}
                      </div>
                      <h3 className="mt-2 font-semibold text-[var(--text)]">{s.displayName}</h3>
                      <p className="truncate text-sm text-[var(--muted)]">{s.email}</p>
                      <p className="text-xs text-[var(--muted)]">{s.employeeId}</p>
                    </div>
                  </div>
                  <div className="border-t border-[var(--border)] pt-3">
                    <p className="text-sm text-[var(--muted)]">
                      <strong className="text-[var(--text)]">{items.length}</strong> equipment item(s)
                    </p>
                    {items.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                        {items.slice(0, 3).map((e) => (
                          <li key={`${e.assetTag}-${e.assignedToEmployeeId}`}>
                            {e.assetTag} — {e.model ?? "—"}
                          </li>
                        ))}
                        {items.length > 3 && <li>+{items.length - 3} more</li>}
                      </ul>
                    )}
                  </div>
                  <Link
                    href={`/staff/${encodeURIComponent(s.employeeId)}`}
                    className="mt-auto w-full rounded-lg bg-[var(--accent)] py-2 text-center text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
                  >
                    View & collect
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        {filteredStaff.length === 0 && (
          <p className="py-8 text-center text-[var(--muted)]">
            {staff.length === 0
              ? "No direct or indirect reports found. Run db:seed to load sample data."
              : "No reports match the current search or filter."}
          </p>
        )}
      </section>

      <div className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Equipment summary</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Total equipment in scope: <strong className="text-[var(--text)]">{data.equipment.length}</strong>
        </p>
      </div>
    </div>
  );
}
