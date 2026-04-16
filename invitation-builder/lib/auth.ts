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
  const email = user.email ?? `${user.id}@no-email.local`;
  const fullName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "") as string;
  const avatar = (user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? "") as string;

  return prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email,
      name: fullName || null,
      avatarUrl: avatar || null,
    },
    update: {
      email,
      name: fullName || undefined,
      avatarUrl: avatar || undefined,
    },
  });
}

export async function requireAdmin(nextPath = "/admin") {
  const user = await requireUser(nextPath);
  const synced = await syncUserProfile(user);

  if (synced.role !== "ADMIN") {
    redirect("/mypage?forbidden=admin");
  }

  return synced;
}
