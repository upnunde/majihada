import { create } from 'zustand';
import { DEFAULT_MAIN_PRESET_URL } from '../lib/main-image-presets';

// --- 1. 상세 타입 정의 ---
export interface StyleConfig {
  primaryColor: string;
  bgColor: string;
  fontFamily: string;
  borderRadius: string;
}

export interface Parent {
  name: string;
  phone: string;
  isDeceased: boolean; // 故 여부
  isOn: boolean;       // 노출 여부
}

export interface Profile {
  name: string;
  phone: string;
  relation: string; // 장남, 아들 등
  father: Parent;
  mother: Parent;
}

export interface EventInfo {
  date: string;
  time: string;
  venueName: string;
  venueDetail: string;
  useCalendar: boolean;
  showDday: boolean;
}

export interface AccountItem {
  id: string;
  groupName: string;
  bank: string;
  accountNumber: string;
  holder: string;
  isKakaoPay: boolean;
  isExpanded: boolean;
}

export interface MusicConfig {
  selectedId: string;
  uploadedFile: { name: string; url: string } | null;
  isLoop: boolean;
}

// --- 2. 전체 데이터 규격 ---
export interface CardData {
  style: StyleConfig;
  music: MusicConfig;
  theme: {
    fontFamily: string;
    fontScale: 'sm' | 'md' | 'lg';
    colorPreset: string;
    bgm: string;
    bgmAutoplay: boolean;
    scrollEffect: boolean;
    particleEffect: string; // 안개, 벚꽃잎 등
  };
  main: {
    image: string;
    images?: string[];
    title: string;
    titleColor: string;
    bodyColor: string;
    animation: string;
    introType?: 'A' | 'B' | 'C' | 'D' | 'E';
    imageMode?: 'single' | 'multi' | 'default';
    /** 기본 이미지 모드에서 선택한 에셋 URL (public SVG 등) */
    presetImage?: string;
    transitionEffect?: string;
    transitionIntervalSec?: number;
  };
  hosts: { groom: Profile; bride: Profile; showContacts: boolean };
  eventInfo: EventInfo;
  greeting: { title: string; content: string };
  notice: { title: string; content: string };
  location: {
    title?: string;
    address: string;
    car: string;     // 자차/주차장
    bus: string;     // 버스
    subway: string;  // 지하철
    transports?: Array<{
      mode: string;   // 예: 지하철/버스/자동차
      detail: string; // 상세 안내
    }>;
    mapProvider: 'kakao' | 'naver'; 
    mapType?: 'photo' | '2d';
  };
  accounts: {
    title: string;
    content: string;
    displayMode?: 'accordion' | 'expanded';
    list: AccountItem[];
  };
  gallery: {
    isOn: boolean;
    type: 'swipe' | 'list';
    images: string[];
    imageGap?: 'none' | 'small' | 'middle' | 'large';
    useLoadMore?: boolean;
  };
  guestbook: {
    isOn: boolean;
    title: string;
    description: string;
    password: string;
    allowAnonymous: boolean;
    requireApproval: boolean;
    entries: Array<{
      id: string;
      name: string;
      message: string;
      createdAt: string;
      password?: string;
      isSecret: boolean;
    }>;
  };
  youtube: {
    isOn: boolean;
    title: string;
    url: string;
    isLoop: boolean;
    sourceType?: 'file' | 'url';
    fileUrl?: string;
  };
  guestUpload: {
    isOn: boolean;
    title: string;
    description: string;
    storageGb: 2 | 5 | 10 | 20;
    showAfterEventModal: boolean;
  };
  share: {
    useThumbnail: boolean;
    thumbnail: string;
    title: string;
    description: string;
    link: string;
    enableCopy: boolean;
    enableKakao: boolean;
  };
  protect: { preventCapture: boolean; preventZoom: boolean; preventDownload: boolean };
  /** 참석 여부(RSVP) — 섹션 ON/OFF는 `sectionEnabled.rsvp` */
  rsvp: {
    title: string;
    description: string;
    /** 동반 인원 수 입력 받기 */
    collectGuestCount: boolean;
    /** 마감일(YYYY-MM-DD, 비우면 제한 없음) */
    deadline: string;
  };
  /** 공개일 설정 */
  publish: { publicStartDate: string };
  /** 영문 등 다국어 노출(추후 콘텐츠 연동) */
  i18n: { enabled: boolean };
  /** 결제·저장 메타(마이페이지·워터마크 등과 연동 예정) */
  billing: { isPaid: boolean; savedAt?: string };
  sectionEnabled: Record<string, boolean>;
}

// --- 3. 스토어 인터페이스 ---
interface CardStore {
  data: CardData;
  // 기존 하위 호환 및 1뎁스 업데이트용
  updateStyle: (style: Partial<StyleConfig>) => void;
  updateTheme: (theme: Partial<CardData['theme']>) => void;
  updateEventInfo: (info: Partial<EventInfo>) => void;
  updateGreeting: (greeting: Partial<{ title: string; content: string }>) => void;
  updateLocation: (location: Partial<CardData['location']>) => void;
  // ★ 깊은 뎁스(부모님 정보, 계좌 등) 업데이트를 위한 만능 함수
  updateData: (path: string, value: any) => void;
  setData: (nextData: CardData) => void;
}

// --- 4. 상태 관리 로직 ---
export const useCardStore = create<CardStore>((set) => ({
  data: {
    style: { primaryColor: '#882CDF', bgColor: '#FFFFFF', fontFamily: 'Pretendard', borderRadius: '8px' },
    music: { selectedId: 'classic-1', uploadedFile: null, isLoop: true },
    theme: { fontFamily: 'Pretendard', fontScale: 'md', colorPreset: 'pastel-1', bgm: 'none', bgmAutoplay: false, scrollEffect: true, particleEffect: 'none' },
    main: {
      image: '',
      images: [],
      title: '신동주 ♥ 김민선 결혼식',
      titleColor: '#333333',
      bodyColor: '#666666',
      animation: '없음',
      introType: 'A',
      imageMode: 'default',
      presetImage: DEFAULT_MAIN_PRESET_URL,
      transitionEffect: '없음',
      transitionIntervalSec: 3,
    },
    hosts: {
      groom: { 
        name: '신동주', phone: '010-0000-0000', relation: '장남',
        father: { name: '', phone: '', isDeceased: false, isOn: true },
        mother: { name: '', phone: '', isDeceased: false, isOn: true }
      },
      bride: { 
        name: '김민선', phone: '010-1111-1111', relation: '장녀',
        father: { name: '', phone: '', isDeceased: false, isOn: true },
        mother: { name: '', phone: '', isDeceased: false, isOn: true }
      },
      showContacts: false,
    },
    eventInfo: { date: '2026-10-29', time: '오후 2:00', venueName: '더 신라 서울', venueDetail: '다이너스티 홀 3F', useCalendar: true, showDday: true },
    greeting: { title: '초대합니다', content: '서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어가고자 합니다.' },
    notice: {
      title: '안내사항',
      content: '마음 편히 오셔서 함께 축복해 주세요.\n예식장 내 주차가 가능하며, 식전 30분 전부터 입장이 가능합니다.',
    },
    location: {
      title: '오시는 길',
      address: '',
      car: '',
      bus: '',
      subway: '',
      transports: [{ mode: '', detail: '' }],
      mapProvider: 'naver',
      mapType: 'photo',
    },
    accounts: {
      title: '마음 전하실 곳',
      content: '',
      displayMode: 'accordion',
      list: [
        {
          id: 'groom-1',
          groupName: '신랑측 계좌',
          bank: '',
          accountNumber: '',
          holder: '',
          isKakaoPay: false,
          isExpanded: true,
        },
        {
          id: 'bride-1',
          groupName: '신부측 계좌',
          bank: '',
          accountNumber: '',
          holder: '',
          isKakaoPay: false,
          isExpanded: true,
        },
      ],
    },
    gallery: { isOn: true, type: 'swipe', images: [], imageGap: 'middle', useLoadMore: true },
    guestbook: {
      isOn: false,
      title: '축하해 주세요',
      description: '축하 인사를 남겨주세요.',
      password: '',
      allowAnonymous: true,
      requireApproval: false,
      entries: [],
    },
    youtube: { isOn: false, title: '영상으로 전하는 마음', url: '', isLoop: false, sourceType: 'url', fileUrl: '' },
    guestUpload: {
      isOn: true,
      title: '추억을 공유해 주세요',
      description: '예식 후 촬영하신 사진/영상을 업로드해 주세요.',
      storageGb: 2,
      showAfterEventModal: true,
    },
    share: {
      useThumbnail: true,
      thumbnail: '',
      title: '김민준 ♥ 박서연 결혼식',
      description: '서로가 마주보며 다져온 사랑을 이제 함께 한 곳을 바라보며 걸어가고자 합니다.',
      link: '',
      enableCopy: true,
      enableKakao: true,
    },
    protect: { preventCapture: false, preventZoom: false, preventDownload: false },
    rsvp: {
      title: '참석 여부',
      description: '참석 여부를 알려주시면 준비에 큰 도움이 됩니다.',
      collectGuestCount: true,
      deadline: '',
    },
    publish: {
      publicStartDate: '',
    },
    i18n: {
      enabled: false,
    },
    billing: {
      isPaid: false,
    },
    sectionEnabled: {},
  },

  updateStyle: (newStyle) => set((state) => ({ data: { ...state.data, style: { ...state.data.style, ...newStyle } } })),
  updateTheme: (newTheme) => set((state) => ({ data: { ...state.data, theme: { ...state.data.theme, ...newTheme } } })),
  updateEventInfo: (newInfo) => set((state) => ({ data: { ...state.data, eventInfo: { ...state.data.eventInfo, ...newInfo } } })),
  updateGreeting: (newGreeting) => set((state) => ({ data: { ...state.data, greeting: { ...state.data.greeting, ...newGreeting } } })),
  updateLocation: (newLocation) => set((state) => ({ data: { ...state.data, location: { ...state.data.location, ...newLocation } } })),
  setData: (nextData) => set(() => ({ data: nextData })),
  
  // 문자열 경로를 받아 중첩된 객체를 안전하게 업데이트하는 로직
  updateData: (path, value) => set((state) => {
    const keys = path.split('.');
    const newData = { ...state.data };
    let current: any = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] }; // 불변성 유지
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    return { data: newData };
  }),
}));