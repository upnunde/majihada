import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { syncUserProfile } from "@/lib/auth";

export async function GET() {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ message: "인증 설정이 아직 완료되지 않았습니다." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  const synced = await syncUserProfile(user);
  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: synced.id,
        email: synced.email,
        name: synced.name,
        avatarUrl: synced.avatarUrl,
        role: synced.role,
      },
    },
    { status: 200 },
  );
}
