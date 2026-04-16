"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type AppHeaderProps = {
  rightSlot?: ReactNode;
  hideSiteNav?: boolean;
};

const categoryLinks = [
  { href: "/mobile-invitation", label: "모바일청첩장" },
  { href: "/obituary", label: "부고장" },
  { href: "/first-birthday", label: "돌잔치 초대장" },
];

type HeaderAuthState = "signed_in" | "signed_out" | "loading";

function DesktopNav({
  authState,
  onSignOut,
}: {
  authState: HeaderAuthState;
  onSignOut: () => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-6">
      <nav className="flex items-center gap-1">
        {categoryLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-on-surface-20 hover:bg-slate-50"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <nav className="flex items-center gap-2">
        {authState === "signed_in" ? (
          <>
            <Link
              href="/mypage"
              className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-medium text-on-surface-20 hover:bg-slate-50"
            >
              마이페이지
            </Link>
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-medium text-on-surface-20 hover:bg-slate-50"
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-medium text-on-surface-20 hover:bg-slate-50"
          >
            {authState === "loading" ? "로그인 확인중" : "로그인"}
          </Link>
        )}
      </nav>
    </div>
  );
}

function MobileNavPanel({
  onNavigate,
  authState,
  onSignOut,
}: {
  onNavigate: () => void;
  authState: HeaderAuthState;
  onSignOut: () => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-30">
          서비스
        </p>
        <nav className="flex flex-col">
          {categoryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-on-surface-20 hover:bg-slate-50"
              onClick={onNavigate}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div>
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-30">
          바로가기
        </p>
        <nav className="flex flex-col gap-2">
          {authState === "signed_in" ? (
            <>
              <Link
                href="/mypage"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-on-surface-20 hover:bg-slate-50"
                onClick={onNavigate}
              >
                마이페이지
              </Link>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-on-surface-20 hover:bg-slate-50"
                onClick={async () => {
                  await onSignOut();
                  onNavigate();
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-on-surface-20 hover:bg-slate-50"
              onClick={onNavigate}
            >
              {authState === "loading" ? "로그인 확인중" : "로그인"}
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}

export default function AppHeader({ rightSlot, hideSiteNav = false }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authState, setAuthState] = useState<HeaderAuthState>("loading");
  const menuPanelId = "app-header-mobile-menu";

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen, closeMobile]);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setAuthState("signed_out");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setAuthState(data.user ? "signed_in" : "signed_out");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthState(session?.user ? "signed_in" : "signed_out");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setAuthState("signed_out");
    router.refresh();
  }, [router]);

  const menuButton = (
    <button
      type="button"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-on-surface-20 hover:bg-slate-50 md:hidden"
      aria-expanded={mobileOpen}
      aria-controls={menuPanelId}
      aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
      onClick={() => setMobileOpen((o) => !o)}
    >
      {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
    </button>
  );

  return (
    <header className="relative z-30 w-full flex-shrink-0 border-b border-border bg-white">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link href="/" className="inline-flex max-w-[min(100%,200px)] shrink-0 items-center">
            <Image
              src="/DHlogo.svg"
              alt="dearhour"
              width={154}
              height={21}
              className="h-[18px] w-auto max-w-full"
              priority
            />
          </Link>
        </div>

        {rightSlot ? (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="min-w-0">{rightSlot}</div>
            {!hideSiteNav && (
              <>
                {menuButton}
                <div className="hidden md:block">
                  <DesktopNav authState={authState} onSignOut={handleSignOut} />
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {!hideSiteNav && (
              <>
                <div className="hidden md:block">
                  <DesktopNav authState={authState} onSignOut={handleSignOut} />
                </div>
                {menuButton}
              </>
            )}
          </>
        )}
      </div>

      {!hideSiteNav && mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="메뉴 닫기"
            onClick={closeMobile}
          />
          <div
            id={menuPanelId}
            role="dialog"
            aria-modal="true"
            aria-label="사이트 메뉴"
            className="fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-white px-4 py-5 shadow-lg md:hidden"
          >
            <MobileNavPanel onNavigate={closeMobile} authState={authState} onSignOut={handleSignOut} />
          </div>
        </>
      )}
    </header>
  );
}
