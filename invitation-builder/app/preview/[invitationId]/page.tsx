type PageProps = {
  params: Promise<{ invitationId: string }> | { invitationId: string };
};

export default async function InvitationPreviewPage({ params }: PageProps) {
  const { invitationId } = await params;

  return (
    <main className="min-h-screen bg-[#f4f4f4] px-4 py-10">
      <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
        <div className="bg-[#111] px-5 py-3 text-center text-xs font-medium text-white/90">
          공유 전 미리보기 화면
        </div>

        <section className="space-y-5 px-6 py-8 text-center">
          <p className="text-xs tracking-[0.2em] text-[#8b8b8b]">WEDDING INVITATION</p>
          <h1 className="text-3xl font-semibold text-[#111]">민준 그리고 서연</h1>
          <p className="text-sm leading-relaxed text-[#666]">
            2026년 10월 17일 토요일 오후 1시
            <br />
            dearhour 웨딩홀 3층 그랜드홀
          </p>
          <div className="rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-5 text-sm leading-relaxed text-[#555]">
            이 화면은 마이페이지에서 새 탭으로 열리는 실제 공유형 미리보기 더미입니다.
            <br />
            invitationId: {invitationId}
          </div>
        </section>
      </div>
    </main>
  );
}
