import { PrismaClient } from "@prisma/client";

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  if (!email) {
    console.error("사용법: npm run set-admin -- your@email.com");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(
        `[set-admin] ${email} 계정을 찾을 수 없습니다. 먼저 /login 에서 한 번 로그인한 뒤 다시 실행해 주세요.`,
      );
      process.exit(2);
    }
    const updated = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });
    console.log(`[set-admin] OK: ${updated.email} 계정을 ADMIN 으로 설정했습니다.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[set-admin] 실패:", error);
  process.exit(1);
});
