export interface SpeedQuizItem {
  id: number;
  caseText: string; // 상황 및 사례 (구체적 스토리텔링)
  title: string; // 사례 핵심 요약
  options: [string, string]; // 2개 선택지
  answer: string; // 정답 시민 참여 방법
  explanation: string; // 교과 해설
  coreConcept: string; // 핵심 시민 참여 방법 키워드
}

export interface SpeedQuizAttemptResult {
  attemptNumber: number; // 1, 2, 3
  timeLimit: number; // 30, 45, 60
  timeSpent: number; // in seconds
  correctCount: number;
  totalQuestions: number;
  answers: {
    item: SpeedQuizItem;
    userAnswer: string;
    isCorrect: boolean;
  }[];
  timestamp: string;
}

export const SPEED_ATTEMPTS_CONFIG = [
  { attempt: 1, timeLimit: 30, label: '1차 도전 (제한시간 30초)' },
  { attempt: 2, timeLimit: 45, label: '2차 도전 (제한시간 45초)' },
  { attempt: 3, timeLimit: 60, label: '3차 도전 (제한시간 60초)' }
];

export const SPEED_QUIZ_ITEMS: SpeedQuizItem[] = [
  {
    id: 1,
    title: '군포시 시장·시의원·교육감 선출',
    caseText: '군포시를 이끌어갈 시장과 시의원, 경기도 교육감을 선출하기 위해 부모님과 함께 아침 일찍 투표소에 방문했습니다.',
    options: ['지방 선거', '주민 투표제'],
    answer: '지방 선거',
    coreConcept: '지방 선거',
    explanation: '주민을 대표하여 일할 지방 자치 단체장과 지방 의회 의원을 직접 선출하는 가장 기본적이고 핵심적인 대의 민주주의 참여 방법입니다.'
  },
  {
    id: 2,
    title: '폐기물 처리 시설 유치 여부 찬반 투표',
    caseText: '군포시 외곽에 대규모 폐기물 처리 시설을 유치할 것인지에 대해 갈등이 심해지자, 주민들이 직접 찬반 투표를 하여 결정하기로 했습니다.',
    options: ['주민 소환제', '주민 투표제'],
    answer: '주민 투표제',
    coreConcept: '주민 투표제',
    explanation: '지역사회의 주요 현안이나 정책(폐기물 처리 시설 등 중대한 시설 유치)에 대해 주민이 직접 투표로 최종 결정하는 직접 민주주의 제도입니다.'
  },
  {
    id: 3,
    title: '공약 위반 및 비리 시장 해임 투표',
    caseText: '시장이 선거 공약을 어기고 비리를 저지르자, 화가 난 시민들이 서명을 모아 투표를 실시하여 시장을 임기 중에 해임했습니다.',
    options: ['주민 소환제', '주민 청원제'],
    answer: '주민 소환제',
    coreConcept: '주민 소환제',
    explanation: '선거로 뽑힌 지자체장이나 지역구 지방 의원 등이 위법하거나 직무를 불성실하게 수행할 때, 임기 만료 전 주민 투표로 직위를 해임시키는 제도입니다.'
  },
  {
    id: 4,
    title: '스쿨존 안전 시설 확충 공식 요구서 제출',
    caseText: "궁내중학교 앞 도로에 과속 차량이 많아 위험해지자, 1만 명의 주민이 서명한 '스쿨존 안전 시설 확충 요구서'를 시청에 공식적으로 제출했습니다.",
    options: ['주민 참여 예산제', '주민 청원제'],
    answer: '주민 청원제',
    coreConcept: '주민 청원제',
    explanation: '지역 행정에 관한 요구 사항, 피해 구제, 조례 제·개정 등의 건의 사항을 문서(청원서)로 정식 제출하여 심사를 요구하는 제도입니다.'
  },
  {
    id: 5,
    title: '청소년 코딩·웹 실습실 구축 예산 제안',
    caseText: "내년도 시 예산을 편성할 때, 청소년들이 시청 회의에 참석하여 '지역 청소년을 위한 코딩 및 웹 개발(HTML/JS) 실습실 구축' 예산을 제안했습니다.",
    options: ['주민 참여 예산제', '주민 투표제'],
    answer: '주민 참여 예산제',
    coreConcept: '주민 참여 예산제',
    explanation: '지방 자치 단체의 1년 살림살이인 예산 편성 과정에 주민이 직접 참여하여 필요한 사업을 제안하고 예산을 반영하는 재정 민주주의 제도입니다.'
  },
  {
    id: 6,
    title: '공원 훼손 반대 시청 앞 피켓 구호 외침',
    caseText: '우리 동네 자연 공원을 훼손하고 대형 상가를 짓는 것에 반대하는 주민들이 주말에 시청 앞 광장에 모여 피켓을 들고 반대 구호를 외쳤습니다.',
    options: ['집회', '공청회'],
    answer: '집회',
    coreConcept: '집회',
    explanation: '공동의 목적을 가진 시민들이 특정 장소에 모여 피켓이나 구호 등을 통해 자신들의 의사를 집단적으로 표명하는 시민 참여 활동입니다.'
  },
  {
    id: 7,
    title: '반려견 놀이터 건립 시민 5천 명 이름 모으기',
    caseText: '지역 내 반려견들이 안전하게 뛰어놀 수 있는 전용 놀이터를 만들어 달라는 캠페인을 벌이며, 뜻을 같이하는 시민 5천 명의 이름을 모았습니다.',
    options: ['지방 선거', '서명 운동'],
    answer: '서명 운동',
    coreConcept: '서명 운동',
    explanation: '지역 현안이나 특정 문제에 대해 다수 주민들의 동의와 지지 의사를 모으기 위해 서명(이름)을 받는 참여 방법입니다.'
  },
  {
    id: 8,
    title: '새 도서관 건립 위치 전문가·주민 공개 토론',
    caseText: '새로운 시립 도서관 건립 위치와 설계를 확정하기 전에 건축 전문가, 시청 공무원, 그리고 지역 주민들이 한자리에 모여 토론하고 의견을 나누었습니다.',
    options: ['주민 소환제', '공청회'],
    answer: '공청회',
    coreConcept: '공청회',
    explanation: '지자체나 공공 기관이 정책이나 사업을 결정하기 전에 관계 전문가, 이해관계자, 지역 주민의 의견을 공개적으로 듣고 토론하는 제도입니다.'
  },
  {
    id: 9,
    title: '행정구역 통합 찬반 주민 전체 직접 투표',
    caseText: '인근 두 시·군을 하나의 큰 통합시로 합치는 행정구역 통합안에 대해 지역 주민 전체가 직접 찬성과 반대를 표시하는 투표를 실시했습니다.',
    options: ['주민 투표제', '주민 참여 예산제'],
    answer: '주민 투표제',
    coreConcept: '주민 투표제',
    explanation: '지자체 통합, 주요 공공시설 유치 등 주민 생활에 중대한 영향을 미치는 사안을 주민 전체가 직접 투표로 결정하는 주민 투표제입니다.'
  },
  {
    id: 10,
    title: '공금 횡령 비리 지방의원 투표로 직위 박탈',
    caseText: '지역구의 지방의원이 공금 횡령 비리에 연루되자, 주민들이 청구 서명을 거쳐 투표를 실시하여 해당 의원의 의원직을 박탈시켰습니다.',
    options: ['지방 선거', '주민 소환제'],
    answer: '주민 소환제',
    coreConcept: '주민 소환제',
    explanation: '임기 중 비리나 부정을 저지른 선출직 공직자를 주민 투표를 통해 임기 만료 전 해임시키는 제도는 주민 소환제입니다.'
  }
];

export const CORE_PARTICIPATION_METHODS = [
  {
    name: '지방 선거',
    description: '주민을 대표할 지자체장과 지방 의원을 주민이 직접 선출',
    color: '#2563eb'
  },
  {
    name: '주민 투표제',
    description: '지역사회의 중요한 정책이나 주요 시설 유치를 주민이 직접 투표로 결정',
    color: '#059669'
  },
  {
    name: '주민 소환제',
    description: '비리나 부당한 행위를 한 지자체장·의원을 임기 중 투표로 해임',
    color: '#e11d48'
  },
  {
    name: '주민 청원제',
    description: '지역 행정에 대한 요구·건의 사항을 문서(청원서)로 정식 제출',
    color: '#0d9488'
  },
  {
    name: '주민 참여 예산제',
    description: '지자체 예산 편성 과정에 주민이 직접 참여하여 필요한 사업 제안',
    color: '#7c3aed'
  }
];
