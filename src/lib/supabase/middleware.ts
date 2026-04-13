import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Supabase request timed out")), ms)
    ),
  ]);
}

const SUPABASE_TIMEOUT_MS = 10_000;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user;
  try {
    const { data } = await withTimeout(supabase.auth.getUser(), SUPABASE_TIMEOUT_MS);
    user = data.user;
  } catch {
    // If auth check times out, let the request through without redirects
    return supabaseResponse;
  }

  const { pathname } = request.nextUrl;

  // Skip redirect logic for API routes — they handle their own auth
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  // Public routes that don't require auth
  const publicRoutes = ["/", "/login", "/signup", "/onboarding"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If user is not authenticated and trying to access protected routes, send to onboarding
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  // If user is authenticated
  if (user) {
    // Check if onboarding is complete
    let onboardingComplete = false;
    try {
      const result = await withTimeout(
        Promise.resolve(
          supabase
            .from("profiles")
            .select("onboarding_complete")
            .eq("id", user.id)
            .maybeSingle()
        ),
        SUPABASE_TIMEOUT_MS
      );
      onboardingComplete = result.data?.onboarding_complete ?? false;
    } catch {
      // If profile check times out, let the request through
      return supabaseResponse;
    }

    // Redirect to onboarding if not complete (unless already there)
    if (!onboardingComplete && pathname !== "/onboarding" && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // Redirect away from auth pages if logged in
    if (
      (pathname === "/login" || pathname === "/signup") &&
      onboardingComplete
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
