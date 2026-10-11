export interface QuizItem {
  id: number;
  page: 1 | 2; // 1: PDF 1페이지 (7개), 2: PDF 2페이지 (4개)
  color: string;
  colorName: string;
  category: string; // 개념 분류 1 (대분류)
  term: string; // 개념 분류 2 (소분류 - 사회 용어)
  role: string; // 주요 역할 및 특징/설명
  termExpl: string;
  roleExpl: string;
  keyTakeaway: string;

  // For compatibility with previous types & ResultModal
  caseText?: string;
  actor?: string;
  actorExpl?: string;
}

export interface ActorNode {
  id: string;
  text: string;
  categoryHint?: string;
  targetItemId?: number;
}

export interface RoleNode {
  id: string;
  targetCaseId: number; // refers to item.id
  text: string;
}

export interface CategoryNode {
  id: string;
  text: string;
  color: string;
}

export interface CaseConnection {
  actorNodeId: string | null; // In 2-tier: null; in 3-tier: category or term
  roleNodeId: string | null; // target role / description node id
}

export interface ConnectionMap {
  [caseId: number]: CaseConnection;
}

export interface GradeResult {
  item: QuizItem;
  selectedActorText: string;
  selectedRoleText: string;
  isActorCorrect: boolean;
  isRoleCorrect: boolean;
  isFullyCorrect: boolean;
}

export interface StudentSubmission {
  studentId: string;
  studentName: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timestamp: string;
  durationSeconds: number;
  results: GradeResult[];
  scopeLabel?: string;
}
