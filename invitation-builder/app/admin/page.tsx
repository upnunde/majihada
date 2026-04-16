import AppHeader from "@/components/AppHeader";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requireAdmin("/admin");

  const [userCount, invitationCount, paidCount, latestPayments] = await Promise.all([
    prisma.user.count(),
    prisma.invitation.count(),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: true },
    }),
  ]);

  return (
    <>
      <AppHeader />
      <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-12">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#111]">어드민</h1>
            <p className="mt-1 text-sm text-[#6b7280]">회원/주문/결제 현황을 관리합니다.</p>
          </div>

          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#ececec] bg-white p-4">
              <p className="text-xs text-[#6b7280]">전체 회원</p>
              <p className="mt-1 text-2xl font-semibold text-[#111]">{userCount.toLocaleString("ko-KR")}</p>
            </div>
            <div className="rounded-lg border border-[#ececec] bg-white p-4">
              <p className="text-xs text-[#6b7280]">전체 초대장</p>
              <p className="mt-1 text-2xl font-semibold text-[#111]">{invitationCount.toLocaleString("ko-KR")}</p>
            </div>
            <div className="rounded-lg border border-[#ececec] bg-white p-4">
              <p className="text-xs text-[#6b7280]">결제 완료 건수</p>
              <p className="mt-1 text-2xl font-semibold text-[#111]">{paidCount.toLocaleString("ko-KR")}</p>
            </div>
          </section>

          <section className="rounded-xl border border-[#e5e7eb] p-4">
            <h2 className="text-lg font-semibold text-[#111]">최근 결제</h2>
            <div className="mt-3 space-y-2">
              {latestPayments.length === 0 ? (
                <div className="rounded-lg bg-[#fafafa] px-4 py-8 text-center text-sm text-[#6b7280]">결제 데이터가 없습니다.</div>
              ) : (
                latestPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#efefef] p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#111]">{payment.user.email}</p>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        주문번호 {payment.orderId} · {payment.createdAt.toISOString().slice(0, 10)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#111]">{payment.amount.toLocaleString("ko-KR")}원</p>
                      <p className="mt-1 text-xs text-[#6b7280]">{payment.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
