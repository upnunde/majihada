import { NextResponse } from "next/server";
import { getNaverMapsCredentials } from "@/lib/naver-maps-credentials";

// 네이버 클라우드 Maps 신규 엔드포인트 (구 naveropenapi.apigw.ntruss.com 은 신규 앱에서 210 반환)
const NAVER_STATIC_RASTER = "https://maps.apigw.ntruss.com/map-static/v2/raster";

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * 네이버 정적 지도 이미지 (서버에서 ID–KEY로 호출).
 * 브라우저 JS SDK와 달리 Web 서비스 URL(Referer) 제약이 없어 로컬 미리보기에 적합합니다.
 * NCP 애플리케이션에서 **Static Map** 사용이 켜져 있어야 합니다.
 */
export async function GET(req: Request) {
  const cred = getNaverMapsCredentials();
  if (!cred) {
    return NextResponse.json(
      { error: "NAVER_MAPS_CLIENT_SECRET 및 Client ID가 .env.local 에 필요합니다." },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  const w = clampInt(Number(url.searchParams.get("w")) || 800, 120, 1024);
  const h = clampInt(Number(url.searchParams.get("h")) || 500, 120, 1024);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "lat, lon required" }, { status: 400 });
  }

  const staticUrl = new URL(NAVER_STATIC_RASTER);
  staticUrl.searchParams.set("w", String(w));
  staticUrl.searchParams.set("h", String(h));
  staticUrl.searchParams.set("center", `${lon},${lat}`);
  // 레벨: 1(세계)~20(건물). 기본 17 = 건물 윤곽이 보이는 거리. ?level= 쿼리로 오버라이드 가능.
  const levelParam = clampInt(Number(url.searchParams.get("level")) || 17, 6, 20);
  staticUrl.searchParams.set("level", String(levelParam));
  staticUrl.searchParams.set("format", "png");
  staticUrl.searchParams.set("scale", "2");
  staticUrl.searchParams.set("lang", "ko");
  // 목적지 핀: 지도 중심 좌표에 기본 빨간 마커 1개(중크기). Naver Static Map 공식 최대 사이즈.
  staticUrl.searchParams.set(
    "markers",
    `type:d|size:mid|pos:${lon} ${lat}|color:red`,
  );

  try {
    const res = await fetch(staticUrl.toString(), {
      method: "GET",
      signal: req.signal,
      headers: {
        "X-NCP-APIGW-API-KEY-ID": cred.id,
        "X-NCP-APIGW-API-KEY": cred.secret,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error: "naver_static_map_failed",
          status: res.status,
          detail: body.slice(0, 200),
        },
        { status: 502 },
      );
    }

    const buf = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "naver_static_map_fetch_error" }, { status: 502 });
  }
}
