import { redirect } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function getCurrentSupabaseUser() {
  if (!hasSupabaseEnv()) {
    return null;
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser(nextPath = "/mypage") {
  const user = await getCurrentSupabaseUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function syncUserProfile(user: SupabaseUser) {
  const email = (user.email ?? `${user.id}@no-email.local`).toLowerCase();
  const fullName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "") as string;
  const avatar = (user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? "") as string;

  // Auth 제공자 독립: 내부 User.id(cuid)를 유지하고 authProviderId/email로 매핑한다.
  // authProviderId 우선 → email 병합 → 신규 생성 순으로 조회한다.
  const existing =
    (await prisma.user.findUnique({ where: { authProviderId: user.id } })) ??
    (await prisma.user.findUnique({ where: { email } }));

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        authProviderId: user.id,
        email,
        name: fullName || undefined,
        avatarUrl: avatar || undefined,
      },
    });
  }

  return prisma.user.create({
    data: {
      authProviderId: user.id,
      email,
      name: fullName || null,
      avatarUrl: avatar || null,
    },
  });
}

export async function getCurrentAppUser() {
  const user = await getCurrentSupabaseUser();
  if (!user) return null;
  return syncUserProfile(user);
}

export async function requireAdmin(nextPath = "/admin") {
  const user = await requireUser(nextPath);
  const synced = await syncUserProfile(user);

  if (synced.role !== "ADMIN") {
    redirect("/mypage?forbidden=admin");
  }

  return synced;
}
