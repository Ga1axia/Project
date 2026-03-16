"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { DashboardData } from "@/types/dashboard";
import ContentHeader from "./ContentHeader";
import Pagination from "./Pagination";

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 25];

const STAFF_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "has_equipment", label: "Has equipment" },
  { value: "no_equipment", label: "No equipment" },
];

export default function DashboardTable({ data, initialSearchQuery = "" }: { data: DashboardData; initialSearchQuery?: string }) {
  const { me, staff, equipmentByEmployee } = data;
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filterBy, setFilterBy] = useState("all");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const paginatedStaff = useMemo(
    () => filteredStaff.slice((page - 1) * pageSize, page * pageSize),
    [filteredStaff, page, pageSize]
  );

  // Reset to page 1 when filters change
  const handleFilterChange = (value: string) => {
    setFilterBy(value);
    setPage(1);
  };
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <ContentHeader
        title="Reports"
        searchPlaceholder="Search reports"
        showFilter={true}
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
        filterOptions={STAFF_FILTER_OPTIONS}
        selectedFilter={filterBy}
        onFilterChange={handleFilterChange}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        showSettingsLink={true}
      />
      <p className="text-sm text-[var(--muted)]">
        Signed in as {me.displayName} ({me.employeeId}) · Showing {filteredStaff.length} of {staff.length}
      </p>

      <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Employee ID</th>
                <th className="table-header">Contact E-mail</th>
                <th className="table-header">Equipment</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStaff.map((s) => {
                const items = equipmentByEmployee[s.employeeId] ?? [];
                return (
                  <tr
                    key={s.employeeId}
                    className="border-b border-[var(--border)] transition hover:bg-[var(--table-header-bg)]/50"
                  >
                    <td className="table-cell font-medium text-[var(--text)]">{s.displayName}</td>
                    <td className="table-cell text-[var(--text-secondary)]">{s.employeeId}</td>
                    <td className="table-cell text-[var(--text-secondary)]">{s.email}</td>
                    <td className="table-cell text-[var(--muted)]">{items.length} item(s)</td>
                    <td className="table-cell">
                      <Link
                        href={`/staff/${encodeURIComponent(s.employeeId)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
                      >
                        View & collect
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredStaff.length === 0 && (
          <p className="py-12 text-center text-[var(--muted)]">
            {staff.length === 0
              ? "No direct or indirect reports found. Run db:seed to load sample data."
              : "No reports match the current search or filter."}
          </p>
        )}
        {filteredStaff.length > 0 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Equipment summary</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Total equipment in scope: <strong className="text-[var(--text)]">{data.equipment.length}</strong>
        </p>
      </div>
    </div>
  );
}

