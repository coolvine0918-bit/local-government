export type SwipeDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface SwipeItem {
  id: number;
  situation: string; // 상황 및 사례 (게임 제시어)
  direction: SwipeDirection; // 상(광역 집행), 하(광역 의결), 좌(기초 집행), 우(기초 의결)
  categoryName: string; // 정답 카테고리 풀네임
  shortName: string; // 간결 명칭 (광역 집행, 광역 의결, 기초 집행, 기초 의결)
  feedback: string; // 오답 시 피드백 / 적용점
}

export interface DirectionConfig {
  direction: SwipeDirection;
  label: string;
  badge: string;
  fullTitle: string;
  examples: string;
  badgeBg: string;
  borderColor: string;
  activeBg: string;
  textColor: string;
  arrowIcon: string;
  keyLabel: string;
  colorHex: string;
}

export const DIRECTION_CONFIGS: Record<SwipeDirection, DirectionConfig> = {
  UP: {
    direction: 'UP',
    label: '광역 집행',
    badge: '상(↑)',
    fullTitle: '광역 자치 단체 - 집행 기관',
    examples: '도청, 특별시청, 광역시청, 도지사, 특별시장, 광역시장',
    badgeBg: 'bg-blue-600',
    borderColor: 'border-blue-500',
    activeBg: 'bg-blue-500/20',
    textColor: 'text-blue-700',
    arrowIcon: '↑',
    keyLabel: '방향키 ↑ 또는 위로 스와이프',
    colorHex: '#2563eb',
  },
  DOWN: {
    direction: 'DOWN',
    label: '광역 의결',
    badge: '하(↓)',
    fullTitle: '광역 자치 단체 - 의결 기관',
    examples: '서울특별시의회, 광역시의회, 도의회, 특별자치도의회',
    badgeBg: 'bg-indigo-600',
    borderColor: 'border-indigo-500',
    activeBg: 'bg-indigo-500/20',
    textColor: 'text-indigo-700',
    arrowIcon: '↓',
    keyLabel: '방향키 ↓ 또는 아래로 스와이프',
    colorHex: '#4f46e5',
  },
  LEFT: {
    direction: 'LEFT',
    label: '기초 집행',
    badge: '좌(←)',
    fullTitle: '기초 자치 단체 - 집행 기관',
    examples: '시청, 군청, 구청, 시장, 군수, 자치구청장',
    badgeBg: 'bg-amber-600',
    borderColor: 'border-amber-500',
    activeBg: 'bg-amber-500/20',
    textColor: 'text-amber-700',
    arrowIcon: '←',
    keyLabel: '방향키 ← 또는 왼쪽으로 스와이프',
    colorHex: '#d97706',
  },
  RIGHT: {
    direction: 'RIGHT',
    label: '기초 의결',
    badge: '우(→)',
    fullTitle: '기초 자치 단체 - 의결 기관',
    examples: '시의회, 군의회, 자치구의회',
    badgeBg: 'bg-emerald-600',
    borderColor: 'border-emerald-500',
    activeBg: 'bg-emerald-500/20',
    textColor: 'text-emerald-700',
    arrowIcon: '→',
    keyLabel: '방향키 → 또는 오른쪽으로 스와이프',
    colorHex: '#059669',
  },
};

// 2. 상황별 자치단체 기관 분류 사례 탐구 및 적용 (20문항 원문 데이터)
export const SWIPE_QUIZ_ITEMS: SwipeItem[] = [
  {
    id: 1,
    situation: '경기도청에서 새로운 청년 지원 정책 예산을 집행합니다.',
    direction: 'UP',
    categoryName: '광역 자치 단체 - 집행 기관',
    shortName: '광역 집행',
    feedback: "예산을 직접 '집행'하는 곳은 의회가 아니라 '집행 기관'인 도청(도지사)입니다.",
  },
  {
    id: 2,
    situation: '군포시 지역의 주차 문제 해결을 위해 새로운 법인 조례를 통과시켰습니다.',
    direction: 'RIGHT',
    categoryName: '기초 자치 단체 - 의결 기관',
    shortName: '기초 의결',
    feedback: "시, 군, 구 단위에서 조례를 만드는 '의결 기관'은 시·군·구의회입니다.",
  },
  {
    id: 3,
    situation: '군포시장',
    direction: 'LEFT',
    categoryName: '기초 자치 단체 - 집행 기관',
    shortName: '기초 집행',
    feedback: "시장, 군수, 구청장은 '기초 자치 단체'의 행정을 책임지는 집행 기관의 대표입니다.",
  },
  {
    id: 4,
    situation: '서울특별시의회',
    direction: 'DOWN',
    categoryName: '광역 자치 단체 - 의결 기관',
    shortName: '광역 의결',
    feedback: "'서울특별시'는 광역 자치 단체이며, '의회'는 예산을 심의하고 조례를 제정하는 의결 기관입니다.",
  },
  {
    id: 5,
    situation: '도지사가 조례를 실행하기 위해 구체적인 규칙을 제정합니다.',
    direction: 'UP',
    categoryName: '광역 자치 단체 - 집행 기관',
    shortName: '광역 집행',
    feedback: "조례는 의회가 만들지만, 이를 실행하기 위한 '규칙'은 단체장(집행 기관)이 만듭니다.",
  },
  {
    id: 6,
    situation: '종로구청장',
    direction: 'LEFT',
    categoryName: '기초 자치 단체 - 집행 기관',
    shortName: '기초 집행',
    feedback: "구청장은 특별시나 광역시 안에 있는 '기초 자치 단체'의 집행 기관 대표입니다.",
  },
  {
    id: 7,
    situation: '경기도 지역 전체의 행정 사무가 잘 이루어지는지 감사(검사)합니다.',
    direction: 'DOWN',
    categoryName: '광역 자치 단체 - 의결 기관',
    shortName: '광역 의결',
    feedback: '집행 기관이 일을 잘하는지 감시하고 통제하는 역할은 의결 기관(지방의회)의 몫입니다.',
  },
  {
    id: 8,
    situation: '궁내중학교 앞 스쿨존의 안전 시설물을 설치하고 관련 예산을 직접 집행합니다.',
    direction: 'LEFT',
    categoryName: '기초 자치 단체 - 집행 기관',
    shortName: '기초 집행',
    feedback: '지역 내 특정 시설물을 설치하고 예산을 실제로 집행하는 곳은 기초 자치 단체의 집행 기관(시청/구청)입니다.',
  },
  {
    id: 9,
    situation: '경기도 내 모든 중학교의 무상 급식 지원에 관한 조례를 제정합니다.',
    direction: 'DOWN',
    categoryName: '광역 자치 단체 - 의결 기관',
    shortName: '광역 의결',
    feedback: '도 단위의 넓은 지역에 적용되는 조례를 만드는 곳은 광역 자치 단체의 의결 기관(도의회)입니다.',
  },
  {
    id: 10,
    situation: '군포시청이 예산을 올바르게 사용했는지 행정 사무 감사를 실시합니다.',
    direction: 'RIGHT',
    categoryName: '기초 자치 단체 - 의결 기관',
    shortName: '기초 의결',
    feedback: '시청(집행 기관)의 행정을 감시하고 견제하는 역할은 기초 자치 단체의 의결 기관(시의회)이 담당합니다.',
  },
  {
    id: 11,
    situation: '경기도지사',
    direction: 'UP',
    categoryName: '광역 자치 단체 - 집행 기관',
    shortName: '광역 집행',
    feedback: '도지사는 도 단위의 광역 행정을 책임지는 집행 기관의 대표입니다.',
  },
  {
    id: 12,
    situation: '제주특별자치도의회',
    direction: 'DOWN',
    categoryName: '광역 자치 단체 - 의결 기관',
    shortName: '광역 의결',
    feedback: '특별자치도는 광역 자치 단체이며, 의회는 조례 제정과 예산 심의를 맡는 의결 기관입니다.',
  },
  {
    id: 13,
    situation: '군포시 쓰레기 종량제 봉투 가격 인상에 관한 조례안을 심의합니다.',
    direction: 'RIGHT',
    categoryName: '기초 자치 단체 - 의결 기관',
    shortName: '기초 의결',
    feedback: '시 단위의 생활 밀접 조례를 심의하고 의결하는 곳은 기초 자치 단체의 의결 기관(시의회)입니다.',
  },
  {
    id: 14,
    situation: '부산광역시 해운대구청장',
    direction: 'LEFT',
    categoryName: '기초 자치 단체 - 집행 기관',
    shortName: '기초 집행',
    feedback: '광역시 산하의 자치구 구청장은 기초 자치 단체의 집행 기관 대표입니다.',
  },
  {
    id: 15,
    situation: '대전광역시의 버스 노선 개편 조례를 개정합니다.',
    direction: 'DOWN',
    categoryName: '광역 자치 단체 - 의결 기관',
    shortName: '광역 의결',
    feedback: '광역시 단위의 조례를 만들고 고치는 역할은 광역 자치 단체의 의결 기관(광역시의회)이 합니다.',
  },
  {
    id: 16,
    situation: '제주특별자치도지사',
    direction: 'UP',
    categoryName: '광역 자치 단체 - 집행 기관',
    shortName: '광역 집행',
    feedback: '특별자치도를 대표하여 행정 사무를 처리하는 집행 기관의 장입니다.',
  },
  {
    id: 17,
    situation: '군포시민의 안전을 지키기 위해 방범용 CCTV 설치 예산을 편성하고 집행합니다.',
    direction: 'LEFT',
    categoryName: '기초 자치 단체 - 집행 기관',
    shortName: '기초 집행',
    feedback: '시 단위의 예산을 직접 편성하고 예산을 사용하는 주체는 집행 기관(시청)입니다.',
  },
  {
    id: 18,
    situation: '서울특별시장',
    direction: 'UP',
    categoryName: '광역 자치 단체 - 집행 기관',
    shortName: '광역 집행',
    feedback: '특별시의 행정을 총괄하고 예산을 집행하는 최고 책임자로 광역 자치 단체의 집행 기관 대표입니다.',
  },
  {
    id: 19,
    situation: "광주광역시청에서 시민들을 위한 공공 자전거 '타랑께' 운영 예산을 집행합니다.",
    direction: 'UP',
    categoryName: '광역 자치 단체 - 집행 기관',
    shortName: '광역 집행',
    feedback: '광역시청은 광역 단위의 예산을 직접 사용하는 집행 기관입니다.',
  },
  {
    id: 20,
    situation: '경기도 교육 발전을 위한 예산안을 최종적으로 심의하고 의결합니다.',
    direction: 'DOWN',
    categoryName: '광역 자치 단체 - 의결 기관',
    shortName: '광역 의결',
    feedback: '도 단위의 예산안이 적절한지 평가하고 통과시키는 곳은 광역 자치 단체의 의결 기관(도의회)입니다.',
  },
];

// ============================================================================
// Supabase 설정 변수 (사용자 제공 실시간 연동 키 적용)
// ============================================================================
export const SUPABASE_URL: string = 'https://onypqeekklgrqvkdhhbm.supabase.co';
export const SUPABASE_ANON_KEY: string = 'sb_publishable_6gGPYdS8gNTwAX2SRQJklA_b_J8uY9T';

export interface LeaderboardEntry {
  id?: string | number;
  nickname: string;
  score: number;
  correct_count: number;
  total_items?: number;
  created_at?: string;
  stage?: string;
}

// Initial mockup leaderboard for when Supabase is not yet populated
export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: 1, nickname: '민주수호자', score: 2450, correct_count: 20, created_at: '방금 전' },
  { id: 2, nickname: '군포대표참여왕', score: 2180, correct_count: 19, created_at: '3분 전' },
  { id: 3, nickname: '풀뿌리리더', score: 1950, correct_count: 18, created_at: '7분 전' },
  { id: 4, nickname: '자치행정꿈나무', score: 1720, correct_count: 17, created_at: '12분 전' },
  { id: 5, nickname: '스피드조례러', score: 1540, correct_count: 16, created_at: '15분 전' },
];
