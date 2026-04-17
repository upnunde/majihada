/** 네이버 클라우드 Maps REST(지오코딩·정적 지도 등) 공통 인증 */
export function getNaverMapsCredentials(): { id: string; secret: string } | null {
  const id =
    process.env.NAVER_MAPS_API_KEY_ID?.trim() ||
    process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID?.trim() ||
    "";
  const secret = process.env.NAVER_MAPS_CLIENT_SECRET?.trim() || "";
  if (!id || !secret) return null;
  return { id, secret };
}
