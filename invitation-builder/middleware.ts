import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/mypage", "/admin", "/payment"];

export async function middleware(request: NextRequest) {
  try {
    const { response, user } = await updateSession(request);
    const { pathname, search } = request.nextUrl;

    const needsAuth = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!needsAuth || user) {
      return response;
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(loginUrl);
  } catch {
    // Supabase 환경변수가 없는 초기 개발 환경에서는 기존 라우팅을 막지 않는다.
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
