"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/lib/auth-session";

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (helpRef.current && !helpRef.current.contains(target)) setHelpOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotificationsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleGlobalSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    router.push(q ? `/?search=${encodeURIComponent(q)}` : "/");
    setSearchValue("");
  }

  function handleSignOut() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--header-bg)] px-6">
      <form onSubmit={handleGlobalSearch} className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            placeholder="Global search (then press Enter)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="input-search"
            aria-label="Global search"
          />
        </div>
      </form>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href="/collection"
          className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-gray-100"
          aria-label="Activity / Collection log"
          title="Collection log"
        >
          <ClockIcon className="h-5 w-5" />
        </Link>
        <div className="relative" ref={helpRef}>
          <button
            type="button"
            onClick={() => { setHelpOpen((o) => !o); setNotificationsOpen(false); }}
            className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-gray-100"
            aria-label="Help"
            title="Help"
          >
            <HelpIcon className="h-5 w-5" />
          </button>
          {helpOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-[var(--border)] bg-white p-3 shadow-lg">
              <p className="text-sm font-medium text-[var(--text)]">Help</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                For equipment or access questions, contact your IT team or the portal administrator.
              </p>
            </div>
          )}
        </div>
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => { setNotificationsOpen((o) => !o); setHelpOpen(false); }}
            className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-gray-100"
            aria-label="Notifications"
            title="Notifications"
          >
            <BellIcon className="h-5 w-5" />
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-[var(--border)] bg-white p-3 shadow-lg">
              <p className="text-sm font-medium text-[var(--text)]">Notifications</p>
              <p className="mt-1 text-sm text-[var(--muted)]">No new notifications.</p>
            </div>
          )}
        </div>
        <div className="ml-2 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--border)] bg-[var(--sidebar-bg)] text-sm font-medium text-[var(--text-secondary)]">
          U
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="ml-2 rounded-md px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-gray-100 hover:text-[var(--text)]"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
