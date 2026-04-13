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
    // If auth check times out, let the request through
    return supabaseResponse;
  }

  const { pathname } = request.nextUrl;

  // Skip for API routes — they handle their own auth
  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  // Landing page doesn't need a session
  if (pathname === "/") {
    return supabaseResponse;
  }

  // Auto-create anonymous session for all other routes if no user
  if (!user) {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInAnonymously(),
        SUPABASE_TIMEOUT_MS
      );
      if (error) {
        console.error("Anonymous sign-in failed:", error.message);
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
      user = data.user;
    } catch {
      // On timeout, redirect to landing
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Check if onboarding is complete
  if (user) {
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
      return supabaseResponse;
    }

    // Redirect to onboarding if not complete (unless already there)
    if (!onboardingComplete && pathname !== "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
