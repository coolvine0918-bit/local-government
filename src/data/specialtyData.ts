export interface SpecialtyItem {
  id: string;
  name: string;
  region: string;
  icon: string;
  description: string;
  scoreDelta: number;
  isBomb?: boolean;
  isHeal?: boolean;
  rarity: 'jackpot' | 'common' | 'bomb' | 'heal' | 'penalty';
  badgeColor: string;
}

export const REGIONAL_SPECIALTIES: SpecialtyItem[] = [
  // --- [보너스 득점 특산물] ---
  {
    id: 'hanwoo',
    name: '횡성 한우 🥩',
    region: '강원특별자치도 횡성군',
    icon: '🥩',
    description: '입에서 살살 녹는 1++ 명품 횡성 한우! 대박 보너스 +500점!',
    scoreDelta: 500,
    rarity: 'jackpot',
    badgeColor: 'bg-red-500',
  },
  {
    id: 'gulbi',
    name: '영광 법성포 굴비 🐟',
    region: '전라남도 영광군',
    icon: '🐟',
    description: '고소하고 짭조름한 밥도둑 굴비 한 두름! 보너스 +400점!',
    scoreDelta: 400,
    rarity: 'jackpot',
    badgeColor: 'bg-amber-500',
  },
  {
    id: 'squid',
    name: '울릉도 오징어 🦑',
    region: '경상북도 울릉군',
    icon: '🦑',
    description: '동해 청정바다에서 건져 올린 울릉도 특산 오징어! +250점!',
    scoreDelta: 250,
    rarity: 'common',
    badgeColor: 'bg-blue-500',
  },
  {
    id: 'pear',
    name: '나주 배 🍐',
    region: '전라남도 나주시',
    icon: '🍐',
    description: '시원하고 달콤한 과즙 가득 나주 배! +200점!',
    scoreDelta: 200,
    rarity: 'common',
    badgeColor: 'bg-lime-500',
  },
  {
    id: 'ginseng',
    name: '금산 인삼 삼계탕 🍲',
    region: '충청남도 금산군',
    icon: '🍲',
    description: '원기 회복! 금산 인삼의 힘으로 하트 +1개 회복 & +100점!',
    scoreDelta: 100,
    isHeal: true,
    rarity: 'heal',
    badgeColor: 'bg-emerald-500',
  },

  // --- [감점 벌칙 특산물 3가지: 고추, 곶감, 흑돼지] ---
  {
    id: 'chili',
    name: '청양 매운 고추 🌶️',
    region: '충청남도 청양군',
    icon: '🌶️',
    description: '너무 매워서 불이 번쩍! 앗, -100점 감점!',
    scoreDelta: -100,
    rarity: 'penalty',
    badgeColor: 'bg-red-600',
  },
  {
    id: 'persimmon',
    name: '상주 덜 익은 곶감 🍊',
    region: '경상북도 상주시',
    icon: '🍊',
    description: '덜 익어서 떫은 맛 폭발! 앗, -150점 감점!',
    scoreDelta: -150,
    rarity: 'penalty',
    badgeColor: 'bg-orange-600',
  },
  {
    id: 'black_pork',
    name: '제주 까맣게 탄 흑돼지 🥓',
    region: '제주특별자치도',
    icon: '🥓',
    description: '고기가 까맣게 타버렸어요! 앗, -200점 감점!',
    scoreDelta: -200,
    rarity: 'penalty',
    badgeColor: 'bg-rose-700',
  },

  // --- [점수 제로화 폭탄 특산물] ---
  {
    id: 'bomb_cabbage',
    name: '해남 폭탄 배추 💣💥',
    region: '지방 농산물 폭탄 구역',
    icon: '💣',
    description: '🚨 콰광! 폭탄 배추 폭발! 지금까지 모은 점수가 0점으로 초기화되었습니다! 😱',
    scoreDelta: 0,
    isBomb: true,
    rarity: 'bomb',
    badgeColor: 'bg-slate-900',
  },
  {
    id: 'bomb_garlic',
    name: '의성 벼락 맞은 마늘 ⚡💣',
    region: '경상북도 의성군',
    icon: '⚡',
    description: '💥 벼락 맞은 의성 마늘 투척! 누적 점수 리셋 (0점)! 😱',
    scoreDelta: 0,
    isBomb: true,
    rarity: 'bomb',
    badgeColor: 'bg-slate-900',
  },
];

// Helper to pick 3 random distinct specialties
export function pickRandomSpecialties(count = 3): SpecialtyItem[] {
  const shuffled = [...REGIONAL_SPECIALTIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
