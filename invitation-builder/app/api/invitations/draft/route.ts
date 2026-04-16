import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { syncUserProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function makeInvitationCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

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

  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const rate = checkRateLimit(`draft:${user.id}`, 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { title?: string; payload?: unknown } | null;
  const title = String(body?.title ?? "").trim() || "새 청첩장";
  const payload = body?.payload ?? null;

  const synced = await syncUserProfile(user);

  let invitation = null as Awaited<ReturnType<typeof prisma.invitation.create>> | null;
  for (let i = 0; i < 5; i += 1) {
    try {
      invitation = await prisma.invitation.create({
        data: {
          userId: synced.id,
          title,
          code: makeInvitationCode(),
          status: "DRAFT",
          content: payload as object | null,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
        },
      });
      break;
    } catch {
      // code collision retry
    }
  }

  if (!invitation) {
    return NextResponse.json({ message: "초대장 생성에 실패했습니다. 다시 시도해 주세요." }, { status: 500 });
  }

  await prisma.auditLog.create({
    data: {
      userId: synced.id,
      action: "invitation.draft.created",
      targetType: "Invitation",
      targetId: invitation.id,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: request.headers.get("user-agent"),
      payload: { title },
    },
  });

  return NextResponse.json({
    id: invitation.id,
    code: invitation.code,
    title: invitation.title,
    expiresAt: invitation.expiresAt,
  });
}
