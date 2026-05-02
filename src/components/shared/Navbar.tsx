"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/enums";

interface NavUser {
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
}

const NAV_LINKS: Record<UserRole, { href: string; label: string }[]> = {
  client: [
    { href: "/cleaners", label: "Find a cleaner" },
    { href: "/client/post-job", label: "Post a job" },
    { href: "/client/jobs", label: "My jobs" },
  ],
  cleaner: [
    { href: "/cleaner/jobs", label: "My jobs" },
    { href: "/cleaner/earnings", label: "Earnings" },
  ],
  admin: [
    { href: "/admin/jobs", label: "Jobs" },
    { href: "/admin/cleaners", label: "Cleaners" },
    { href: "/admin/clients", label: "Clients" },
    { href: "/admin/reviews", label: "Reviews" },
  ],
};

const ROLE_HOME: Record<UserRole, string> = {
  client:  "/client/dashboard",
  cleaner: "/cleaner/dashboard",
  admin:   "/admin/jobs",
};

const PROFILE_HREF: Record<UserRole, string | null> = {
  client: "/client/profile",
  cleaner: "/cleaner/profile",
  admin: null,
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ user, size = "sm" }: { user: NavUser; size?: "sm" | "md" }) {
  const dim = size === "md" ? "h-9 w-9 text-sm" : "h-8 w-8 text-xs";
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-teal-600 font-semibold text-white overflow-hidden ${dim}`}
    >
      {user.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatar_url} alt={user.full_name} className="h-full w-full object-cover" />
      ) : (
        getInitials(user.full_name)
      )}
    </span>
  );
}

function HamburgerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser(userId: string | undefined) {
      if (!userId) {
        setUser(null);
        setAuthReady(true);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_url")
        .eq("id", userId)
        .single();
      setUser(data ?? null);
      setAuthReady(true);
    }

    supabase.auth.getUser().then(({ data }) => loadUser(data.user?.id));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setDropdownOpen(false);
    setMobileOpen(false);
    router.push("/");
  }

  const links = user ? (NAV_LINKS[user.role] ?? []) : [];
  const profileHref = user ? PROFILE_HREF[user.role] : null;
  const homeHref    = (authReady && user) ? (ROLE_HOME[user.role] ?? "/") : "/";

  return (
    <nav className="sticky top-0 z-30 w-full bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Wordmark */}
          <Link
            href={homeHref}
            className="flex-shrink-0 text-2xl font-bold tracking-tight text-teal-600 transition-colors hover:text-teal-700"
          >
            Ameza
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {authReady && (
              user ? (
                <>
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  ))}

                  {/* Avatar dropdown */}
                  <div className="relative ml-3" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen((v) => !v)}
                      aria-label="Account menu"
                      aria-expanded={dropdownOpen}
                      className="rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    >
                      <Avatar user={user} />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black/5">
                        {/* Identity */}
                        <div className="px-4 py-2.5 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.full_name}
                          </p>
                          <p className="text-xs text-gray-400 capitalize mt-0.5">{user.role}</p>
                        </div>

                        {profileHref && (
                          <Link
                            href={profileHref}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Profile
                          </Link>
                        )}

                        <button
                          onClick={signOut}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="ml-1 rounded-md bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                  >
                    Register
                  </Link>
                </>
              )
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="px-4 pb-4 pt-3 space-y-1">
            {authReady && (
              user ? (
                <>
                  {/* Identity row */}
                  <div className="flex items-center gap-3 px-2 py-3 mb-1 border-b border-gray-100">
                    <Avatar user={user} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                    </div>
                  </div>

                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  ))}

                  {profileHref && (
                    <Link
                      href={profileHref}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      Profile
                    </Link>
                  )}

                  <button
                    onClick={signOut}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Register
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
