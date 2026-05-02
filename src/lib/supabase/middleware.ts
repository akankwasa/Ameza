import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_DASHBOARDS: Record<string, string> = {
  client:  "/client/dashboard",
  cleaner: "/cleaner/dashboard",
  admin:   "/admin/jobs",
};

export default async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  // ── Unauthenticated ──────────────────────────────────────────────────────
  if (!user) {
    if (
      pathname.startsWith("/client") ||
      pathname.startsWith("/cleaner") ||
      pathname.startsWith("/admin")
    ) {
      return go("/login");
    }
    return supabaseResponse;
  }

  // ── Authenticated: read role from profiles table ────────────────────────
  // Profiles table is the authoritative source — handles manually-promoted
  // admins and avoids JWT metadata staleness after role changes.
  // Fall back to JWT metadata if the profiles row doesn't exist yet.
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role =
    (profileData?.role as string | undefined) ??
    (user.user_metadata?.role as string | undefined) ??
    null;

  const dashboard = role ? (ROLE_DASHBOARDS[role] ?? null) : null;

  // Redirect away from root, login, and register pages
  if (
    dashboard &&
    (pathname === "/" || pathname === "/login" || pathname === "/register")
  ) {
    return go(dashboard);
  }

  // Enforce role boundaries — wrong-role users bounce to their own dashboard
  if (pathname.startsWith("/client")  && role !== "client")  return go(dashboard ?? "/login");
  if (pathname.startsWith("/cleaner") && role !== "cleaner") return go(dashboard ?? "/login");
  if (pathname.startsWith("/admin")   && role !== "admin")   return go(dashboard ?? "/login");

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/client/:path*",
    "/cleaner/:path*",
    "/admin/:path*",
  ],
};
