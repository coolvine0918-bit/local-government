import { QuizItem, ActorNode, RoleNode, CategoryNode } from '../types';

export const QUIZ_ITEMS_ALL: QuizItem[] = [
  // --- [1페이지: 지방 자치와 시민 참여 핵심 개념 7문항] ---
  {
    id: 1,
    page: 1,
    color: '#2563eb', // Blue
    colorName: '파랑',
    category: '지방 자치의 의미',
    term: '풀뿌리 민주주의',
    role: '일정한 지역에 사는 주민들이 그 지역의 일을 스스로 처리하는 제도로, 민주주의의 기초를 다진다는 의미',
    termExpl: '지역 주민들이 자발적으로 지역의 문제를 주체적으로 해결하여 민주주의의 기초를 튼튼하게 다진다는 뜻입니다.',
    roleExpl: '지방 자치가 아래로부터 꽃피우는 풀뿌리처럼 민주주의의 가장 밑바탕이자 튼튼한 토대가 됨을 의미합니다.',
    keyTakeaway: '풀뿌리 민주주의: 주민 스스로 지역 문제를 해결하며 민주주의의 기초를 다지는 지방 자치의 핵심 정신',
    caseText: '일정한 지역에 사는 주민들이 그 지역의 일을 스스로 처리하는 제도로, 민주주의의 기초를 다진다는 의미',
    actor: '풀뿌리 민주주의',
    actorExpl: '개념 분류 2 (소분류)의 사회 용어로, 민주주의의 기초를 다진다는 의미를 지닌 \'풀뿌리 민주주의\'입니다.'
  },
  {
    id: 2,
    page: 1,
    color: '#059669', // Emerald
    colorName: '초록',
    category: '지방 자치의 의미',
    term: '민주주의의 학교',
    role: '주민이 주체가 되어 문제를 해결하며 민주주의를 직접 배우고 실천하는 장',
    termExpl: '주민들이 일상 속 지역 정치에 참여하며 토론과 합의, 참여 등 민주주의의 기본 원리와 실천 방법을 배우는 배움터입니다.',
    roleExpl: '지방 자치 활동을 통해 민주 시민으로서의 자질과 태도를 직접 체험하고 훈련하는 교육적 역할을 강조합니다.',
    keyTakeaway: '민주주의의 학교: 주민이 주체가 되어 민주주의를 직접 배우고 실천하는 훈련과 배움의 장',
    caseText: '주민이 주체가 되어 문제를 해결하며 민주주의를 직접 배우고 실천하는 장',
    actor: '민주주의의 학교',
    actorExpl: '지방 자치는 주민들이 민주주의를 직접 배우고 실천하는 장으로서 \'민주주의의 학교\'라 불립니다.'
  },
  {
    id: 3,
    page: 1,
    color: '#d97706', // Amber
    colorName: '주황',
    category: '지방 자치 단체의 종류',
    term: '광역 자치 단체',
    role: '넓은 지역을 관할 (특별시, 광역시, 도, 특별자치시, 특별자치도)',
    termExpl: '기초 자치 단체를 포괄하는 넓은 지역을 관할하는 상위 지방 자치 단체입니다.',
    roleExpl: '서울특별시, 6대 광역시, 도, 세종특별자치시, 제주·강원·전북특별자치도가 광역 자치 단체에 해당합니다.',
    keyTakeaway: '광역 자치 단체: 특별시, 광역시, 도, 특별자치시, 특별자치도 등 넓은 지역을 관할하는 지방 자치 단체',
    caseText: '넓은 지역을 관할 (특별시, 광역시, 도, 특별자치시, 특별자치도)',
    actor: '광역 자치 단체',
    actorExpl: '넓은 행정 구역과 다수의 기초 자치 단체를 포괄하는 상위 지방 자치 단체입니다.'
  },
  {
    id: 4,
    page: 1,
    color: '#7c3aed', // Purple
    colorName: '보라',
    category: '지방 자치 단체의 종류',
    term: '기초 자치 단체',
    role: '광역 자치 단체 내의 더 작은 단위 (시, 군, 구)',
    termExpl: '광역 자치 단체의 구역 안에 설치되어 주민의 생활과 가장 밀접한 행정을 담당하는 지방 자치 단체입니다.',
    roleExpl: '시, 군, 자치구(특별시 및 광역시 관할 구역 안의 자치구)가 기초 자치 단체에 속합니다.',
    keyTakeaway: '기초 자치 단체: 광역 자치 단체 내의 더 작은 단위로 주민 생활과 밀접한 시·군·구',
    caseText: '광역 자치 단체 내의 더 작은 단위 (시, 군, 구)',
    actor: '기초 자치 단체',
    actorExpl: '광역 자치 단체보다 좁은 구역에서 주민 생활과 직결된 행정을 담당하는 기초 단위입니다.'
  },
  {
    id: 5,
    page: 1,
    color: '#dc2626', // Red
    colorName: '빨강',
    category: '지방 자치 단체의 구성',
    term: '지방 의회 (의결 기관)',
    role: '지역 주민이 선출한 의원들로 구성. 지역 실정에 맞는 조례 제·개정, 예산안 심의 및 의결, 행정 사무 감사 담당',
    termExpl: '지역 주민의 직선으로 선출된 지방 의원들로 이루어진 지방 자치 단체의 최고 의결 기관(입법 기관 역할)입니다.',
    roleExpl: '지방 자치 단체의 자치 법규인 조례를 제정·개정하고, 예산안을 심의 및 의결하며, 집행부의 행정 사무를 감시·감사합니다.',
    keyTakeaway: '지방 의회: 주민이 선출한 의원으로 구성된 의결 기관(조례 제·개정, 예산 심의·의결, 행정 사무 감사)',
    caseText: '지역 주민이 선출한 의원들로 구성. 지역 실정에 맞는 조례 제·개정, 예산안 심의 및 의결, 행정 사무 감사 담당',
    actor: '지방 의회 (의결 기관)',
    actorExpl: '주민을 대표하여 조례를 제정하고 예산을 심의·의결하며 지자체장을 견제하는 의결 기관입니다.'
  },
  {
    id: 6,
    page: 1,
    color: '#0891b2', // Cyan
    colorName: '청록',
    category: '지방 자치 단체의 구성',
    term: '지방 자치 단체장 (집행 기관)',
    role: '시장, 도지사, 구청장 등. 행정 사무 처리, 조례 실행을 위한 규칙 제정, 예산 직접 집행 담당',
    termExpl: '지방 자치 단체를 대표하고 행정 사무를 총괄하여 실제로 집행하는 최고 행정 책임자(집행 기관)입니다.',
    roleExpl: '시장, 도지사, 군수, 구청장 등이 해당하며, 행정 사무를 처리하고 규칙 제정 및 편성된 예산을 직접 집행합니다.',
    keyTakeaway: '지방 자치 단체장: 시장·도지사·구청장 등 지방 자치 단체를 대표하여 행정 사무와 예산을 집행하는 집행 기관',
    caseText: '시장, 도지사, 구청장 등. 행정 사무 처리, 조례 실행을 위한 규칙 제정, 예산 직접 집행 담당',
    actor: '지방 자치 단체장 (집행 기관)',
    actorExpl: '지방 자치 단체를 대표하고 행정 사무 총괄 및 규칙 제정과 예산 집행을 담당하는 집행 기관입니다.'
  },
  {
    id: 7,
    page: 1,
    color: '#4f46e5', // Indigo
    colorName: '남색',
    category: '시민 참여 제도',
    term: '지방 선거',
    role: '주민을 대표할 지방 자치 단체장과 지방 의회 의원을 선출하는 가장 기본적인 참여 방법',
    termExpl: '지역 주민들이 지방 자치 단체장과 지방 의원 등을 직접 투표로 선출하는 대의 민주주의의 기본 제도입니다.',
    roleExpl: '지역을 대표해 일할 일꾼을 직접 뽑고 임기 후 평가하여 심판하는 가장 대중적이고 기본적인 정치 참여 수단입니다.',
    keyTakeaway: '지방 선거: 지자체장과 지방 의원을 주민이 직접 선출하는 가장 기본적이고 핵심적인 시민 참여 방법',
    caseText: '주민을 대표할 지방 자치 단체장과 지방 의회 의원을 선출하는 가장 기본적인 참여 방법',
    actor: '지방 선거',
    actorExpl: '지방 자치 단체장과 지방 의회 의원을 주민이 직접 선출하는 가장 기본적인 시민 참여 제도입니다.'
  },

  // --- [2페이지: 시민 참여 제도 4문항] ---
  {
    id: 8,
    page: 2,
    color: '#ea580c', // Orange
    colorName: '주황빛',
    category: '시민 참여 제도',
    term: '주민 투표제',
    role: '지역사회의 중요한 사항이나 정책을 주민이 직접 투표로 결정하는 제도',
    termExpl: '지역 주민에게 중대한 영향을 미치는 주요 정책이나 주요 시설 설치 등을 주민 전체의 찬반 투표로 결정하는 제도입니다.',
    roleExpl: '대의제의 한계를 극복하고 주민의 직접적인 의사를 정책에 직접 반영하는 직접 민주주의 수단입니다.',
    keyTakeaway: '주민 투표제: 지역사회의 중요한 정책이나 현안을 주민이 직접 투표로 결정하는 직접 민주주의 제도',
    caseText: '지역사회의 중요한 사항이나 정책을 주민이 직접 투표로 결정하는 제도',
    actor: '주민 투표제',
    actorExpl: '지역사회의 중요한 사항이나 정책을 주민이 직접 투표로 결정하는 직접 민주주의 제도입니다.'
  },
  {
    id: 9,
    page: 2,
    color: '#e11d48', // Rose
    colorName: '장미',
    category: '시민 참여 제도',
    term: '주민 소환제',
    role: '선거로 뽑힌 지방 자치 단체장, 지방 의원 등의 해임 여부를 투표로 결정하는 제도 (비례대표 의원 제외)',
    termExpl: '직권을 남용하거나 무책임한 행정을 펼친 지자체장이나 지역구 지방 의원을 임기 만료 전에 주민 투표로 해임시키는 제도입니다.',
    roleExpl: '선출직 공직자를 통제하고 책임을 묻는 강력한 시민 권리이며, 비례대표 의원은 대상에서 제외됩니다.',
    keyTakeaway: '주민 소환제: 비리나 부당한 행정을 한 선출직 단체장·의원을 임기 중 투표로 해임하는 제도 (비례대표 제외)',
    caseText: '선거로 뽑힌 지방 자치 단체장, 지방 의원 등의 해임 여부를 투표로 결정하는 제도 (비례대표 의원 제외)',
    actor: '주민 소환제',
    actorExpl: '선거로 뽑힌 지자체장이나 지방 의원 등의 해임 여부를 주민 투표로 결정하는 제도입니다 (비례대표 제외).'
  },
  {
    id: 10,
    page: 2,
    color: '#0d9488', // Teal
    colorName: '청록빛',
    category: '시민 참여 제도',
    term: '주민 청원제',
    role: '지역 행정에 관한 요구 사항을 문서로 직접 제출하는 제도',
    termExpl: '주민이 지역 행정에 대한 의견이나 희망 사항, 피해 구제, 조례 제정 등을 문서(청원서)로 정식 제출하여 심사를 청구하는 제도입니다.',
    roleExpl: '주민이 지방 행정에 관한 구체적 요구나 건의사항을 공식 문서를 통해 제출하여 해결을 도모합니다.',
    keyTakeaway: '주민 청원제: 지역 행정에 대한 개선 요구나 희망 사항을 문서로 직접 제출하는 참여 제도',
    caseText: '지역 행정에 관한 요구 사항을 문서로 직접 제출하는 제도',
    actor: '주민 청원제',
    actorExpl: '지역 행정에 관한 요구 사항을 문서로 직접 제출하는 참여 제도입니다.'
  },
  {
    id: 11,
    page: 2,
    color: '#9333ea', // Violet
    colorName: '자주',
    category: '시민 참여 제도',
    term: '주민 참여 예산제',
    role: '지방 자치 단체의 예산 편성 과정에 주민이 직접 참여하여 의견을 내는 제도',
    termExpl: '지방 자치 단체가 예산을 짤 때 주민이 필요한 사업을 직접 제안하고 의견을 반영하는 제도입니다.',
    roleExpl: '지방 재정의 투명성을 높이고 주민이 진정으로 원하는 곳에 세금이 쓰이도록 예산 편성 과정에 참여합니다.',
    keyTakeaway: '주민 참여 예산제: 지자체의 예산 편성 과정에 주민이 직접 참여하여 의견을 내는 재정 민주주의 제도',
    caseText: '지방 자치 단체의 예산 편성 과정에 주민이 직접 참여하여 의견을 내는 제도',
    actor: '주민 참여 예산제',
    actorExpl: '지방 자치 단체의 예산 편성 과정에 주민이 직접 참여하여 의견을 내는 제도입니다.'
  }
];

// PDF 1페이지 (7문항) - default
export const QUIZ_ITEMS_PAGE1 = QUIZ_ITEMS_ALL.filter((item) => item.page === 1);

// PDF 2페이지 (4문항)
export const QUIZ_ITEMS_PAGE2 = QUIZ_ITEMS_ALL.filter((item) => item.page === 2);

// Standard default export
export const QUIZ_ITEMS = QUIZ_ITEMS_PAGE1;

// Helper to generate Actor (Term) Nodes
export const createActorNodes = (items: QuizItem[]): ActorNode[] => {
  return items.map((item) => ({
    id: `actor-${item.id}`,
    targetItemId: item.id,
    text: item.term,
    categoryHint: item.category,
  }));
};

// Shuffled role order to test student knowledge (seed-based determinism)
const SHUFFLED_ROLE_OFFSETS: Record<number, number[]> = {
  // 7 items (page 1)
  7: [2, 5, 1, 6, 3, 7, 4],
  // 4 items (page 2)
  4: [9, 11, 8, 10],
  // 11 items (all)
  11: [3, 7, 1, 9, 2, 8, 5, 11, 4, 10, 6],
};

export const createRoleNodes = (items: QuizItem[]): RoleNode[] => {
  const ids = items.map((i) => i.id);
  const preferredOrder = SHUFFLED_ROLE_OFFSETS[items.length];

  let orderedIds = ids;
  if (preferredOrder && preferredOrder.length === items.length) {
    orderedIds = preferredOrder;
  } else {
    // simple reversal with shift
    orderedIds = [...ids].reverse();
  }

  return orderedIds.map((targetId) => {
    const item = items.find((i) => i.id === targetId) || items[0];
    return {
      id: `role-${targetId}`,
      targetCaseId: targetId,
      text: item.role,
    };
  });
};

export const CATEGORIES: CategoryNode[] = [
  { id: 'cat-1', text: '지방 자치의 의미', color: '#2563eb' },
  { id: 'cat-2', text: '지방 자치 단체의 종류', color: '#d97706' },
  { id: 'cat-3', text: '지방 자치 단체의 구성', color: '#dc2626' },
  { id: 'cat-4', text: '시민 참여 제도', color: '#4f46e5' },
];

export const ACTOR_NODES: ActorNode[] = createActorNodes(QUIZ_ITEMS_PAGE1);
export const ROLE_NODES: RoleNode[] = createRoleNodes(QUIZ_ITEMS_PAGE1);
