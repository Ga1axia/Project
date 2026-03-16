"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getDashboardView, setLoggedIn } from "@/lib/auth-session";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace(getDashboardView() ? "/" : "/choose-view");
    }
  }, [router]);

  function handleLogin() {
    setLoggedIn();
    router.replace("/choose-view");
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm space-y-6 text-center">
        <h1 className="text-xl font-semibold text-[var(--text)]">Equipment Collection Portal</h1>
        <p className="text-sm text-[var(--muted)]">Pilot: sign in with one click to continue.</p>
        <button
          type="button"
          onClick={handleLogin}
          className="w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
