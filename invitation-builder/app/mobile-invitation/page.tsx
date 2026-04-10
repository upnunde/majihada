import Link from "next/link";
import AppHeader from "@/components/AppHeader";

export default function MobileInvitationPage() {
  return (
    <>
      <AppHeader />
      <main className="min-h-[calc(100vh-64px)] bg-white">
        <section className="w-full bg-[#f6f8ff]">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <p className="text-sm font-semibold text-[#6b7280]">서비스 소개</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#111]">모바일청첩장</h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#4b5563]">
              예식 정보, 갤러리, 방명록, 계좌정보까지 필요한 모든 섹션을 한 번에 구성할 수 있는 dearhour의 대표
              상품입니다.
            </p>
            <div className="mt-8">
              <Link
                href="/editor"
                className="inline-flex h-11 items-center rounded-lg bg-[#111] px-5 text-sm font-semibold text-white hover:bg-black"
              >
                청첩장 만들기
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
