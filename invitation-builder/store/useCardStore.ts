import { create } from 'zustand';

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
    imageMode?: 'single' | 'multi';
    transitionEffect?: string;
    transitionIntervalSec?: number;
    frameEffect?: '적용 안함' | '물결' | '안개' | '방울';
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
  youtube: { isOn: boolean; title: string; url: string; isLoop: boolean };
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
  sectionEnabled: Record<string, boolean>;
}

const DEFAULT_GUESTBOOK_ENTRIES: CardData['guestbook']['entries'] = [
  {
    id: 'gb-1',
    name: '이하늘',
    message: '두 분의 결혼을 진심으로 축하드립니다. 오래오래 행복하세요!',
    createdAt: '2026.03.15 10:20',
    password: '1111',
    isSecret: false,
  },
  {
    id: 'gb-2',
    name: '김서윤',
    message: '예쁜 날, 예쁜 마음으로 축하드려요. 직접 가서 축하할게요!',
    createdAt: '2026.03.15 14:02',
    password: '1111',
    isSecret: false,
  },
  {
    id: 'gb-3',
    name: '박지훈',
    message: '두 분의 시작을 축복합니다. 늘 건강하고 행복하세요!',
    createdAt: '2026.03.16 09:41',
    password: '1111',
    isSecret: false,
  },
  {
    id: 'gb-4',
    name: '최유진',
    message: '결혼 진심으로 축하드려요. 예쁜 추억 많이 만드세요!',
    createdAt: '2026.03.16 11:08',
    password: '1111',
    isSecret: false,
  },
  {
    id: 'gb-5',
    name: '정다은',
    message: '서로 아끼며 오래오래 행복한 가정 이루시길 바랍니다.',
    createdAt: '2026.03.16 13:55',
    password: '1111',
    isSecret: false,
  },
  {
    id: 'gb-6',
    name: '오민석',
    message: '인생의 가장 빛나는 날, 함께 축하할 수 있어 기쁩니다!',
    createdAt: '2026.03.16 16:22',
    password: '1111',
    isSecret: false,
  },
  {
    id: 'gb-7',
    name: '한지민',
    message: '두 분의 앞날에 사랑과 웃음이 가득하길 기원합니다.',
    createdAt: '2026.03.17 10:03',
    password: '1111',
    isSecret: false,
  },
  {
    id: 'gb-8',
    name: '강서준',
    message: '행복한 결혼생활 되세요. 좋은 일만 가득하길 바랍니다!',
    createdAt: '2026.03.17 12:47',
    password: '1111',
    isSecret: false,
  },
];

const TOTAL_GUESTBOOK_ENTRY_COUNT = 50;
const generatedGuestbookEntries: CardData['guestbook']['entries'] = Array.from(
  { length: Math.max(0, TOTAL_GUESTBOOK_ENTRY_COUNT - DEFAULT_GUESTBOOK_ENTRIES.length) },
  (_, index) => {
    const idNum = DEFAULT_GUESTBOOK_ENTRIES.length + index + 1;
    return {
      id: `gb-${idNum}`,
      name: `하객${idNum}`,
      message: '결혼 진심으로 축하드립니다. 두 분의 앞날에 행복이 가득하길 바랍니다!',
      createdAt: '2026.03.18 09:00',
      password: '1111',
      isSecret: false,
    };
  }
);

const INITIAL_GUESTBOOK_ENTRIES: CardData['guestbook']['entries'] = [
  ...DEFAULT_GUESTBOOK_ENTRIES,
  ...generatedGuestbookEntries,
];

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
}

// --- 4. 상태 관리 로직 ---
export const useCardStore = create<CardStore>((set) => ({
  data: {
    style: { primaryColor: '#882CDF', bgColor: '#FFFFFF', fontFamily: 'Pretendard', borderRadius: '8px' },
    music: { selectedId: 'classic-1', uploadedFile: null, isLoop: true },
    theme: { fontFamily: 'Pretendard', fontScale: 'md', colorPreset: 'pastel-1', bgm: 'none', bgmAutoplay: false, scrollEffect: true, particleEffect: 'none' },
    main: {
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop',
      images: [],
      title: '김민준 ♥ 박서연 결혼식',
      titleColor: '#333333',
      bodyColor: '#666666',
      animation: '없음',
      introType: 'A',
      imageMode: 'single',
      transitionEffect: '없음',
      transitionIntervalSec: 3,
      frameEffect: '물결',
    },
    hosts: {
      groom: { 
        name: '김민준', phone: '010-0000-0000', relation: '장남',
        father: { name: '', phone: '', isDeceased: false, isOn: true },
        mother: { name: '', phone: '', isDeceased: false, isOn: true }
      },
      bride: { 
        name: '박서연', phone: '010-1111-1111', relation: '장녀',
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
    gallery: { isOn: true, type: 'swipe', images: [], imageGap: 'middle' },
    guestbook: {
      isOn: false,
      title: '방명록',
      description: '축하 인사를 남겨주세요.',
      password: '',
      allowAnonymous: true,
      requireApproval: false,
      entries: INITIAL_GUESTBOOK_ENTRIES,
    },
    youtube: { isOn: false, title: '영상으로 전하는 마음', url: '', isLoop: false },
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
    sectionEnabled: {},
  },

  updateStyle: (newStyle) => set((state) => ({ data: { ...state.data, style: { ...state.data.style, ...newStyle } } })),
  updateTheme: (newTheme) => set((state) => ({ data: { ...state.data, theme: { ...state.data.theme, ...newTheme } } })),
  updateEventInfo: (newInfo) => set((state) => ({ data: { ...state.data, eventInfo: { ...state.data.eventInfo, ...newInfo } } })),
  updateGreeting: (newGreeting) => set((state) => ({ data: { ...state.data, greeting: { ...state.data.greeting, ...newGreeting } } })),
  updateLocation: (newLocation) => set((state) => ({ data: { ...state.data, location: { ...state.data.location, ...newLocation } } })),
  
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