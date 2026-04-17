import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ message: "인증 설정이 아직 완료되지 않았습니다." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userAgent = request.headers.get("user-agent");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // signOut 이전에 내부 User를 찾아 두어야 audit 기록이 정확히 남는다.
  const appUser = user
    ? await prisma.user.findUnique({ where: { authProviderId: user.id } }).catch(() => null)
    : null;

  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ message: "로그아웃에 실패했습니다." }, { status: 500 });
  }

  if (appUser) {
    await prisma.auditLog
      .create({
        data: {
          userId: appUser.id,
          action: "auth.logout",
          targetType: "User",
          targetId: appUser.id,
          ip,
          userAgent,
        },
      })
      .catch(() => null);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
