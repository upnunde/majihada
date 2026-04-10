import Link from "next/link";
import AppHeader from "@/components/AppHeader";

const categoryCards = [
  {
    href: "/mobile-invitation",
    title: "모바일청첩장",
    desc: "커버, 갤러리, 계좌, 지도까지 결혼식 초대장에 필요한 요소를 한 번에 제작합니다.",
  },
  {
    href: "/obituary",
    title: "부고장",
    desc: "간결하고 예의 있는 톤으로 빠르게 작성하고 링크로 공지할 수 있습니다.",
  },
  {
    href: "/first-birthday",
    title: "돌잔치 초대장",
    desc: "아이 소개, 일정, 장소 안내를 포함한 돌잔치 전용 초대장을 쉽고 빠르게 만듭니다.",
  },
];

const featureItems = [
  { title: "무료 제작", desc: "템플릿 선택 후 정보 입력만으로 초대장을 바로 만들 수 있습니다." },
  { title: "간편 편집", desc: "이미지/문구/섹션 순서를 직관적으로 바꾸고 즉시 미리보기로 확인합니다." },
  { title: "모바일 최적화", desc: "수신자가 모바일에서 보기 편하도록 레이아웃과 타이포를 기본 최적화합니다." },
];

const processSteps = [
  { step: "01", title: "템플릿 선택", desc: "행사 목적에 맞는 기본 템플릿을 선택합니다." },
  { step: "02", title: "정보 입력", desc: "행사 정보, 사진, 안내 문구를 입력합니다." },
  { step: "03", title: "디자인 조정", desc: "컬러/구성/효과를 원하는 느낌으로 조정합니다." },
  { step: "04", title: "공유 준비", desc: "완성 후 링크 공유를 위한 발행 단계를 진행합니다." },
];

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="min-h-[calc(100vh-64px)] bg-white text-[#111]">
        <section className="w-full bg-gradient-to-r from-[#f6f2ff] via-[#fcfbff] to-[#edf7ff]">
          <div className="mx-auto w-full max-w-7xl px-6 py-24 md:py-32">
            <p className="text-sm font-semibold text-[#6b7280]">dearhour · 모바일 초대장 서비스</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-6xl">
              소중한 날을 특별하게,
              <br />
              모바일 초대장을 쉽고 빠르게
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-[#4b5563] md:text-lg">
              청첩장, 부고장, 돌잔치 초대장까지.
              템플릿 선택 후 정보만 입력하면 누구나 손쉽게 완성도 높은 모바일 초대장을 만들 수 있습니다.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/editor"
                className="inline-flex h-11 items-center rounded-lg bg-[#111] px-5 text-sm font-semibold text-white hover:bg-black"
              >
                지금 무료로 시작하기
              </Link>
              <Link
                href="/mobile-invitation"
                className="inline-flex h-11 items-center rounded-lg border border-[#d1d5db] bg-white px-5 text-sm font-semibold text-[#111] hover:bg-[#f9fafb]"
              >
                템플릿 둘러보기
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="grid gap-4 md:grid-cols-3">
            {featureItems.map((feature) => (
              <article key={feature.title} className="rounded-xl border border-[#e5e7eb] bg-white p-6">
                <h2 className="text-lg font-semibold text-[#111]">{feature.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-4 md:py-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#6b7280]">카테고리</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#111]">필요한 초대장 타입을 선택하세요</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {categoryCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="rounded-xl border border-[#e5e7eb] bg-white p-6 transition-colors hover:bg-[#fafafa]"
              >
                <h2 className="text-xl font-semibold text-[#111]">{card.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">{card.desc}</p>
                <p className="mt-6 text-sm font-semibold text-[#111]">자세히 보기</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="rounded-2xl bg-[#111] px-6 py-10 text-white md:px-10">
            <p className="text-sm font-semibold text-white/70">제작 프로세스</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">간단한 4단계로 완성합니다</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {processSteps.map((step) => (
                <div key={step.step} className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs font-semibold text-white/70">{step.step}</p>
                  <p className="mt-2 text-base font-semibold">{step.title}</p>
                  <p className="mt-2 text-sm text-white/80">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-20">
          <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#111]">지금 바로 초대장을 만들어보세요</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#6b7280]">
              상세 콘텐츠와 카피는 이후 자유롭게 수정할 수 있도록 더미 구성으로 채워두었습니다.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/editor"
                className="inline-flex h-11 items-center rounded-lg bg-[#111] px-5 text-sm font-semibold text-white hover:bg-black"
              >
                에디터로 이동
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-lg border border-[#d1d5db] bg-white px-5 text-sm font-semibold text-[#111] hover:bg-[#f3f4f6]"
              >
                로그인하기
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}