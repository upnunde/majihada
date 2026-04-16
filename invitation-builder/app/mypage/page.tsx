import { requireUser, syncUserProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MyPageClient, {
  type GuestMediaItem,
  type MyInvitationItem,
  type MyPaymentItem,
} from "@/app/mypage/mypage-client";
import { readdir, stat } from "fs/promises";
import path from "path";

const MEDIA_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".mov",
  ".webm",
]);

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm"]);

async function collectGuestMedia(invitationIds: string[]): Promise<GuestMediaItem[]> {
  const result: GuestMediaItem[] = [];
  const baseDir = path.join(process.cwd(), "public", "uploads");

  for (const invitationId of invitationIds) {
    const invitationDir = path.join(baseDir, invitationId);
    let folders: Awaited<ReturnType<typeof readdir>> = [];
    try {
      folders = await readdir(invitationDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const folder of folders) {
      if (!folder.isDirectory()) continue;
      const folderPath = path.join(invitationDir, folder.name);
      let files: Awaited<ReturnType<typeof readdir>> = [];
      try {
        files = await readdir(folderPath, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const file of files) {
        if (!file.isFile()) continue;
        const ext = path.extname(file.name).toLowerCase();
        if (!MEDIA_EXTENSIONS.has(ext)) continue;
        const filePath = path.join(folderPath, file.name);
        const fileStat = await stat(filePath).catch(() => null);
        if (!fileStat) continue;

        result.push({
          invitationId,
          fileName: file.name,
          uploadedAt: fileStat.mtime.toISOString().slice(0, 10),
          url: `/uploads/${invitationId}/${folder.name}/${file.name}`,
          kind: VIDEO_EXTENSIONS.has(ext) ? "video" : "image",
        });
      }
    }
  }

  return result
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
    .slice(0, 60);
}

export default async function MyPage() {
  const authUser = await requireUser("/mypage");
  const user = await syncUserProfile(authUser);

  const [invitations, payments] = await Promise.all([
    prisma.invitation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const invitationItems: MyInvitationItem[] = invitations.map((invitation) => ({
    id: invitation.id,
    title: invitation.title,
    code: invitation.code,
    deleteAt: invitation.expiresAt ? invitation.expiresAt.toISOString().slice(0, 10) : "미정",
    status: invitation.status === "PUBLISHED" ? "결제 완료" : "결제 전",
  }));

  const paymentItems: MyPaymentItem[] = payments.map((payment) => ({
    id: payment.orderId,
    product: payment.invitationId ? "워터마크 제거" : "서비스 결제",
    amount: `${payment.amount.toLocaleString("ko-KR")}원`,
    status:
      payment.status === "PAID"
        ? "결제 완료"
        : payment.status === "REFUNDED"
          ? "환불 완료"
          : payment.status === "FAILED"
            ? "결제 실패"
            : payment.status === "CANCELED"
              ? "결제 취소"
              : "결제 대기",
    date: payment.createdAt.toISOString().slice(0, 10),
  }));

  const guestMedia = await collectGuestMedia(invitations.map((item) => item.id));

  return (
    <MyPageClient
      invitations={invitationItems}
      payments={paymentItems}
      guestMedia={guestMedia}
      displayName={user.name || authUser.email || "사용자"}
    />
  );
}
