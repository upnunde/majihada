"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

type AppHeaderProps = {
  rightSlot?: ReactNode;
};

const categoryLinks = [
  { href: "/mobile-invitation", label: "모바일청첩장" },
  { href: "/obituary", label: "부고장" },
  { href: "/first-birthday", label: "돌잔치 초대장" },
];

const utilityLinks = [
  { href: "/editor", label: "에디터" },
  { href: "/mypage", label: "마이페이지" },
  { href: "/login", label: "로그인" },
];

export default function AppHeader({ rightSlot }: AppHeaderProps) {
  return (
    <header className="w-full flex-shrink-0 bg-white border-b border-border z-30">
      <div className="h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/DHlogo.svg"
              alt="dearhour"
              width={154}
              height={21}
              style={{ width: "fit-content", height: "18px" }}
              priority
            />
          </Link>
        </div>

        {rightSlot ?? (
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
              {utilityLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-medium text-on-surface-20 hover:bg-slate-50"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
