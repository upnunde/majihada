import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

const ALLOWED_PROVIDERS = new Set(["google", "kakao", "apple"]);

function getBaseUrl(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const provider = (request.nextUrl.searchParams.get("provider") ?? "").toLowerCase();
  const rawNext = request.nextUrl.searchParams.get("next") ?? "/mypage";
  const next = rawNext.startsWith("/") ? rawNext : "/mypage";

  if (!ALLOWED_PROVIDERS.has(provider)) {
    return NextResponse.redirect(new URL("/login?error=provider", request.url));
  }

  let env: ReturnType<typeof getSupabaseEnv>;
  try {
    env = getSupabaseEnv();
  } catch {
    return NextResponse.redirect(new URL("/login?error=missing_env", request.url));
  }
  const supabase = createClient(env.url, env.anonKey);

  const callbackUrl = `${getBaseUrl(request)}/auth/callback?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google" | "kakao" | "apple",
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }

  return NextResponse.redirect(data.url);
}
