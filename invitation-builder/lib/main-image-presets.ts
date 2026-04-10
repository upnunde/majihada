/** 에디터 메인「기본 이미지」모드 전용 — 웨딩 분위기 예시(꽃 SVG 에셋 미사용) */
export const MAIN_IMAGE_PRESETS = [
  {
    id: "classic",
    label: "클래식",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "venue",
    label: "세레모니",
    url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "rings",
    label: "웨딩링",
    url: "https://images.unsplash.com/photo-1515934751635-c81c6bc5a173?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "elegant",
    label: "엘레강스",
    url: "https://images.unsplash.com/photo-1594552077729-2c814f9166c4?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "romantic",
    label: "로맨틱",
    url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80&auto=format&fit=crop",
  },
] as const;

export const DEFAULT_MAIN_PRESET_URL =
  MAIN_IMAGE_PRESETS.find((preset) => preset.id === "romantic")?.url ?? MAIN_IMAGE_PRESETS[0].url;
