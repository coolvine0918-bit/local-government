import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  CheckCircle,
  Eye,
  Info,
  Award,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Sparkles,
  FileText,
  Layers,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  QUIZ_ITEMS_ALL,
  createActorNodes,
  createRoleNodes,
} from './data/quizData';
import { ConnectionMap, StudentSubmission, GradeResult } from './types';
import { ConnectionsSvg } from './components/ConnectionsSvg';
import { ResultModal } from './components/ResultModal';
import { SpeedQuiz } from './components/SpeedQuiz';
import { SwipeGame } from './components/SwipeGame';
import { sounds } from './utils/audio';

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbyEReFhtl1AW5vdnDyo_8JsNwqmpnQ8sTo6HuVzO0O_qiMJlJXL2JYQaqvy88jMOnCFAQ/exec';

export default function App() {
  // Navigation Tab: 'line-quiz' (1페이지) | 'speed-quiz' (2페이지) | 'swipe-quiz' (3페이지)
  const [activeTab, setActiveTab] = useState<'line-quiz' | 'speed-quiz' | 'swipe-quiz'>('line-quiz');

  // Column mode: 2-column (기본: 소분류 용어 ➔ 특징·설명) or 3-column (대분류 ➔ 소분류 ➔ 특징·설명)
  const [isTwoColumnMode, setIsTwoColumnMode] = useState<boolean>(true);

  // All 11 local governance concepts from attached document
  const currentItems = QUIZ_ITEMS_ALL;
  const currentActorNodes = useMemo(() => createActorNodes(QUIZ_ITEMS_ALL), []);
  const currentRoleNodes = useMemo(() => createRoleNodes(QUIZ_ITEMS_ALL), []);

  // Student Info
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [startTime] = useState<number>(() => Date.now());

  // Connection State: caseId -> { actorNodeId, roleNodeId }
  const [connections, setConnections] = useState<ConnectionMap>(() => {
    const init: ConnectionMap = {};
    QUIZ_ITEMS_ALL.forEach((item) => {
      init[item.id] = { actorNodeId: null, roleNodeId: null };
    });
    return init;
  });

  // Active selection for click-to-connect
  const [activeSelection, setActiveSelection] = useState<{
    type: 'case' | 'actor' | 'role';
    id: number | string;
  } | null>(null);

  // Dragging state for drag-to-connect
  const [draggingState, setDraggingState] = useState<{
    fromType: 'case' | 'actor';
    fromId: number | string;
    fromDotId: string;
    startPoint: { x: number; y: number };
    currentPoint: { x: number; y: number };
    color: string;
  } | null>(null);

  // Sound toggle
  const [soundOn, setSoundOn] = useState(true);

  // Answer display toggle (review mode)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  // Modals
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<StudentSubmission | null>(null);

  // Google Apps Script Web App URL (Connected to spreadsheet 16M3jqZL1vB7-doVdX-B-Eb-L2XbvQSozFYDB47AvU8c)
  const [gasUrl, setGasUrl] = useState<string>(() => {
    localStorage.setItem('gas_quiz_webhook_url', DEFAULT_GAS_URL);
    return DEFAULT_GAS_URL;
  });

  const [sheetSubmitStatus, setSheetSubmitStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: '대기 중',
  });

  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Keep sound manager in sync
  useEffect(() => {
    sounds.enabled = soundOn;
  }, [soundOn]);

  // Click-to-connect Handler
  const handleCardClick = (type: 'case' | 'actor' | 'role', id: number | string) => {
    sounds.play('select');

    if (!activeSelection) {
      setActiveSelection({ type, id });
      return;
    }

    // Clicking the same card clears selection
    if (activeSelection.type === type && activeSelection.id === id) {
      setActiveSelection(null);
      return;
    }

    if (isTwoColumnMode) {
      // 2-column mode: Direct Case (Term) <-> Role (Description)
      if (activeSelection.type === 'case' && type === 'role') {
        const caseId = Number(activeSelection.id);
        const roleId = String(id);
        makeDirectConnection(caseId, roleId);
        setActiveSelection(null);
        sounds.play('connect');
        return;
      }

      if (activeSelection.type === 'role' && type === 'case') {
        const roleId = String(activeSelection.id);
        const caseId = Number(id);
        makeDirectConnection(caseId, roleId);
        setActiveSelection(null);
        sounds.play('connect');
        return;
      }
    } else {
      // 3-column mode
      if (activeSelection.type === 'case' && type === 'actor') {
        const caseId = Number(activeSelection.id);
        const actorId = String(id);
        makeConnectionCaseToActor(caseId, actorId);
        setActiveSelection({ type: 'actor', id: actorId });
        sounds.play('connect');
        return;
      }

      if (activeSelection.type === 'actor' && type === 'case') {
        const actorId = String(activeSelection.id);
        const caseId = Number(id);
        makeConnectionCaseToActor(caseId, actorId);
        setActiveSelection(null);
        sounds.play('connect');
        return;
      }

      if (activeSelection.type === 'actor' && type === 'role') {
        const actorId = String(activeSelection.id);
        const roleId = String(id);
        makeConnectionActorToRole(actorId, roleId);
        setActiveSelection(null);
        sounds.play('connect');
        return;
      }

      if (activeSelection.type === 'role' && type === 'actor') {
        const roleId = String(activeSelection.id);
        const actorId = String(id);
        makeConnectionActorToRole(actorId, roleId);
        setActiveSelection(null);
        sounds.play('connect');
        return;
      }
    }

    // Switch selection to new card
    setActiveSelection({ type, id });
  };

  const makeDirectConnection = (caseId: number, roleId: string) => {
    setConnections((prev) => {
      const next = { ...prev };
      // Free role from other cases so it's 1:1
      Object.keys(next).forEach((cId) => {
        const numId = Number(cId);
        if (numId !== caseId && next[numId].roleNodeId === roleId) {
          next[numId] = { ...next[numId], roleNodeId: null };
        }
      });
      next[caseId] = { ...next[caseId], roleNodeId: roleId };
      return next;
    });
  };

  const makeConnectionCaseToActor = (caseId: number, actorId: string) => {
    setConnections((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((cId) => {
        const numId = Number(cId);
        if (numId !== caseId && next[numId].actorNodeId === actorId) {
          next[numId] = { ...next[numId], actorNodeId: null };
        }
      });
      next[caseId] = { ...next[caseId], actorNodeId: actorId };
      return next;
    });
  };

  const makeConnectionActorToRole = (actorId: string, roleId: string) => {
    let parentCaseId: number | null = null;
    Object.keys(connections).forEach((cId) => {
      const numId = Number(cId);
      if (connections[numId].actorNodeId === actorId) {
        parentCaseId = numId;
      }
    });

    if (parentCaseId === null) {
      alert('먼저 왼쪽의 개념을 선택해 주세요!');
      return;
    }

    const targetCaseId: number = parentCaseId;

    setConnections((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((cId) => {
        const numId = Number(cId);
        if (numId !== targetCaseId && next[numId].roleNodeId === roleId) {
          next[numId] = { ...next[numId], roleNodeId: null };
        }
      });
      next[targetCaseId] = { ...next[targetCaseId], roleNodeId: roleId };
      return next;
    });
  };

  // Remove connection
  const handleRemoveConnection = (caseId: number, type: 'actor' | 'role') => {
    sounds.play('delete');
    setConnections((prev) => {
      const next = { ...prev };
      if (type === 'actor') {
        next[caseId] = { actorNodeId: null, roleNodeId: null };
      } else {
        next[caseId] = { ...next[caseId], roleNodeId: null };
      }
      return next;
    });
  };

  // Reset all
  const handleResetAll = () => {
    if (confirm('모든 연결선을 초기화하고 다시 시작할까요?')) {
      sounds.play('delete');
      const reset: ConnectionMap = {};
      currentItems.forEach((item) => {
        reset[item.id] = { actorNodeId: null, roleNodeId: null };
      });
      setConnections(reset);
      setActiveSelection(null);
      setShowCorrectAnswers(false);
    }
  };

  // Drag-and-drop pointer events
  const handleDotPointerDown = (
    e: React.PointerEvent,
    fromType: 'case' | 'actor',
    fromId: number | string,
    dotId: string,
    color: string
  ) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    if (!mainContainerRef.current) return;
    const containerRect = mainContainerRef.current.getBoundingClientRect();
    const startPoint = {
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
    };

    setDraggingState({
      fromType,
      fromId,
      fromDotId: dotId,
      startPoint,
      currentPoint: startPoint,
      color,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingState || !mainContainerRef.current) return;
    const containerRect = mainContainerRef.current.getBoundingClientRect();
    setDraggingState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentPoint: {
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top,
        },
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingState) return;

    const elementsUnderPointer = document.elementsFromPoint(e.clientX, e.clientY);
    const dropTarget = elementsUnderPointer.find((el) => el.getAttribute('data-droptarget') === 'true');

    if (dropTarget) {
      const dropType = dropTarget.getAttribute('data-droptype');
      const dropId = dropTarget.getAttribute('data-dropid');

      if (isTwoColumnMode) {
        if (draggingState.fromType === 'case' && dropType === 'role' && dropId) {
          makeDirectConnection(Number(draggingState.fromId), dropId);
          sounds.play('connect');
        }
      } else {
        if (draggingState.fromType === 'case' && dropType === 'actor' && dropId) {
          makeConnectionCaseToActor(Number(draggingState.fromId), dropId);
          sounds.play('connect');
        } else if (draggingState.fromType === 'actor' && dropType === 'role' && dropId) {
          makeConnectionActorToRole(String(draggingState.fromId), dropId);
          sounds.play('connect');
        }
      }
    }

    setDraggingState(null);
  };

  // Grade & Submit
  const handleGradeAndSubmit = () => {
    if (!studentName.trim() || !studentId.trim()) {
      alert('상단에서 [학번]과 [이름]을 먼저 입력해 주세요!');
      return;
    }

    const uncompleted = currentItems.filter((item) => {
      if (isTwoColumnMode) {
        return !connections[item.id]?.roleNodeId;
      }
      return !connections[item.id]?.actorNodeId || !connections[item.id]?.roleNodeId;
    });

    if (uncompleted.length > 0) {
      const confirmSubmit = confirm(
        `아직 연결하지 않은 문항이 ${uncompleted.length}개 있습니다. 이대로 채점하고 제출할까요?`
      );
      if (!confirmSubmit) return;
    }

    // Grade each item
    let correctCount = 0;
    const results: GradeResult[] = currentItems.map((item) => {
      const conn = connections[item.id] || { actorNodeId: null, roleNodeId: null };

      // In 2-column mode, actor is auto-matched to term
      const isActorCorrect = isTwoColumnMode
        ? true
        : currentActorNodes.find((a) => a.id === conn.actorNodeId)?.text === item.term;

      const isRoleCorrect = conn.roleNodeId === `role-${item.id}`;
      const isFullyCorrect = isTwoColumnMode ? isRoleCorrect : isActorCorrect && isRoleCorrect;

      if (isFullyCorrect) {
        correctCount += 1;
      }

      const selectedActor = isTwoColumnMode
        ? item.term
        : currentActorNodes.find((a) => a.id === conn.actorNodeId)?.text || '';
      const selectedRole = currentRoleNodes.find((r) => r.id === conn.roleNodeId)?.text || '';

      return {
        item,
        selectedActorText: selectedActor,
        selectedRoleText: selectedRole,
        isActorCorrect,
        isRoleCorrect,
        isFullyCorrect,
      };
    });

    const score = Math.round((correctCount / currentItems.length) * 100);
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    const submission: StudentSubmission = {
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      score,
      correctCount,
      totalQuestions: currentItems.length,
      timestamp: new Date().toLocaleString('ko-KR'),
      durationSeconds,
      results,
      scopeLabel: '지방자치의 개념 파악하기',
    };

    setCurrentSubmission(submission);
    setIsResultOpen(true);

    if (score >= 80) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      sounds.play('complete');
    } else {
      sounds.play('success');
    }

    // Submit to Google Sheets
    sendToGoogleSheet(submission);
  };

  const sendToGoogleSheet = async (sub: StudentSubmission) => {
    setSheetSubmitStatus({
      status: 'sending',
      message: '스프레드시트에 성적 기록 전송 중...',
    });

    const detailsStr = sub.results
      .map(
        (r) =>
          `[${r.item.term}] 설명:${r.isRoleCorrect ? 'O' : 'X'}`
      )
      .join(' | ');

    const payload = {
      page: 1,
      sheet: '시트 1',
      studentId: sub.studentId,
      studentName: sub.studentName,
      score: sub.score,
      correctCount: sub.correctCount,
      totalQuestions: sub.totalQuestions,
      details: detailsStr,
      timestamp: sub.timestamp,
    };

    if (gasUrl) {
      const urlWithParams = `${gasUrl}${
        gasUrl.includes('?') ? '&' : '?'
      }type=line_quiz&page=1&sheet=${encodeURIComponent('시트 1')}&studentId=${encodeURIComponent(
        sub.studentId
      )}&studentName=${encodeURIComponent(sub.studentName)}&score=${sub.score}&correctCount=${
        sub.correctCount
      }&totalQuestions=${sub.totalQuestions}`;

      try {
        await fetch(urlWithParams, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
        setSheetSubmitStatus({
          status: 'success',
          message: '구글 스프레드시트 [시트 1]에 성공적으로 기록되었습니다!',
        });
      } catch {
        try {
          await fetch(urlWithParams, { method: 'GET', mode: 'no-cors' });
          setSheetSubmitStatus({
            status: 'success',
            message: '구글 스프레드시트에 성공적으로 기록되었습니다!',
          });
        } catch {
          setSheetSubmitStatus({
            status: 'error',
            message: '시트 전송 중 통신 오류가 발생했습니다. (앱스스크립트 배포 설정을 확인하세요)',
          });
        }
      }
    } else {
      setTimeout(() => {
        setSheetSubmitStatus({
          status: 'success',
          message: '학번, 이름, 점수 저장 완료 (테스트 모드 / 시트 URL 등록 시 실시간 기록)',
        });
      }, 700);
    }
  };

  // Completion count
  const completedCount = currentItems.filter((item) => {
    if (isTwoColumnMode) {
      return !!connections[item.id]?.roleNodeId;
    }
    return !!connections[item.id]?.actorNodeId && !!connections[item.id]?.roleNodeId;
  }).length;

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased selection:bg-blue-100"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-sm border border-blue-400/30">
              <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse shrink-0" />
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-normal text-white">
                지방자치의 개념 파악하기
              </h1>
            </div>
          </div>

          {/* Student Info Inputs & Audio Toggle */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 gap-1.5">
              <label htmlFor="studentIdInput" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                학번
              </label>
              <input
                id="studentIdInput"
                type="text"
                placeholder="예: 10315"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-20 px-2 py-1 text-xs bg-white rounded-lg border border-slate-300 focus:outline-blue-500 font-medium"
              />
              <span className="text-slate-300">|</span>
              <label htmlFor="studentNameInput" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                이름
              </label>
              <input
                id="studentNameInput"
                type="text"
                placeholder="예: 홍길동"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-20 px-2 py-1 text-xs bg-white rounded-lg border border-slate-300 focus:outline-blue-500 font-medium"
              />
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundOn(!soundOn)}
              title={soundOn ? '소리 끄기' : '소리 켜기'}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

        </div>
      </header>

      {/* Activity Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('line-quiz')}
            className={`py-2.5 px-3.5 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer rounded-t-lg ${
              activeTab === 'line-quiz'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
              1
            </span>
            <span>지방자치의 개념 파악하기 (선긋기)</span>
          </button>

          <button
            onClick={() => setActiveTab('speed-quiz')}
            className={`py-2.5 px-3.5 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer rounded-t-lg ${
              activeTab === 'speed-quiz'
                ? 'border-amber-500 text-amber-800 bg-amber-50/50 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">
              2
            </span>
            <span>시민 참여 방법 사례 스피드 퀴즈</span>
          </button>

          <button
            onClick={() => setActiveTab('swipe-quiz')}
            className={`py-2.5 px-3.5 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer rounded-t-lg ${
              activeTab === 'swipe-quiz'
                ? 'border-indigo-600 text-indigo-800 bg-indigo-50/50 shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
              3
            </span>
            <span>상황별 자치단체 기관 분류 (스와이프 게임)</span>
          </button>
        </div>
      </nav>

      {/* Sub Tabs / Other quizzes */}
      {activeTab === 'speed-quiz' && (
        <SpeedQuiz
          studentId={studentId}
          studentName={studentName}
          soundOn={soundOn}
          gasUrl={gasUrl}
        />
      )}

      {activeTab === 'swipe-quiz' && (
        <SwipeGame
          studentId={studentId}
          studentName={studentName}
          soundOn={soundOn}
          gasUrl={gasUrl}
        />
      )}

      {/* Main Tab 1: Line Quiz */}
      {activeTab === 'line-quiz' && (
        <>
          {/* Sub Header Strip: Mode Selector & Progress */}
          <div className="bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/90 border-b border-slate-200/90 px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm">
              
              {/* View Mode Toggle: 2-column (용어 ➔ 설명) vs 3-column (대분류 ➔ 용어 ➔ 설명) */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700 text-xs mr-1">선긋기 형식:</span>
                <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200">
                  <button
                    onClick={() => setIsTwoColumnMode(true)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      isTwoColumnMode
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>2단 (용어 ➔ 설명)</span>
                  </button>
                  <button
                    onClick={() => setIsTwoColumnMode(false)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      !isTwoColumnMode
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>3단 (대분류 ➔ 용어 ➔ 설명)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  진행도: {completedCount} / {currentItems.length}개 완료
                </span>

                  {showCorrectAnswers && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>정답 선 확인 중</span>
                    </span>
                  )}

                  <button
                    onClick={handleResetAll}
                    className="text-xs text-slate-500 hover:text-red-600 font-medium underline transition cursor-pointer"
                  >
                    선 모두 지우기
                  </button>
                </div>
              </div>
            </div>

          {/* Guide tip banner */}
          <div className="bg-white border-b border-slate-200/60 px-4 py-2 text-xs text-slate-600">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0"></span>
                <span className="font-bold text-slate-800">선긋기 방법:</span>
                <span>
                  {isTwoColumnMode
                    ? '왼쪽 [사회 용어] 카드를 터치(클릭)한 후, 오른쪽 [역할 및 특징 설명]을 터치하면 바로 연결됩니다. (원형 점을 드래그해도 연결 가능)'
                    : '왼쪽 [대분류]와 [사회 용어]를 연결하고, 이어서 오른쪽 [역할 및 특징 설명]을 연결하세요.'}
                </span>
              </div>
              <span className="text-slate-400 hidden lg:inline">연결된 선이나 카드를 다시 터치하면 선이 해제됩니다.</span>
            </div>
          </div>

          {/* Main Interactive Workspace */}
          <main
            ref={mainContainerRef}
            className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 relative select-none"
          >
            {/* SVG Bezier Lines Canvas */}
            <ConnectionsSvg
              connections={connections}
              items={currentItems}
              actorNodes={currentActorNodes}
              roleNodes={currentRoleNodes}
              isTwoColumnMode={isTwoColumnMode}
              onRemoveConnection={handleRemoveConnection}
              showCorrectAnswers={showCorrectAnswers}
              draggingState={draggingState}
            />

            {/* Board Container */}
            <div className="overflow-x-auto pb-6">
              <div className={`relative z-10 px-1 sm:px-2 ${isTwoColumnMode ? 'w-full min-w-0' : 'min-w-[860px]'}`}>
                
                {/* Column Headers */}
                {isTwoColumnMode ? (
                  // 2-Column Headers: [사회 용어] vs [주요 역할]
                  <div className="grid grid-cols-[1fr_1.3fr] sm:grid-cols-[1fr_1.4fr] gap-4 sm:gap-8 md:gap-14 pb-3 mb-4 border-b-2 border-slate-300 items-end">
                    <div className="flex items-center gap-2 pl-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
                        1
                      </span>
                      <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight">
                        사회 용어
                      </h2>
                    </div>

                    <div className="flex items-center justify-end gap-2 pr-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
                        2
                      </span>
                      <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight">
                        주요 역할
                      </h2>
                    </div>
                  </div>
                ) : (
                  // 3-Column Headers: [대분류 & 기준] vs [사회 용어] vs [주요 역할]
                  <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-8 sm:gap-12 pb-3 mb-4 border-b-2 border-slate-300 items-end">
                    <div className="flex items-center gap-2 pl-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
                        1
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        대분류 &amp; 기준
                      </h2>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-center">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
                        2
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        사회 용어
                      </h2>
                    </div>

                    <div className="flex items-center justify-end gap-2 pr-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
                        3
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        주요 역할
                      </h2>
                    </div>
                  </div>
                )}

                {/* Rows of items */}
                <div className="space-y-4">
                  {currentItems.map((item, idx) => {
                    const role = currentRoleNodes[idx];
                    const actor = currentActorNodes[idx];

                    // Connection states
                    const conn = connections[item.id] || { actorNodeId: null, roleNodeId: null };
                    const isCaseCompleted = isTwoColumnMode
                      ? !!conn.roleNodeId
                      : !!conn.actorNodeId && !!conn.roleNodeId;

                    const isCaseSelected =
                      activeSelection?.type === 'case' && activeSelection.id === item.id;
                    const isRoleSelected =
                      activeSelection?.type === 'role' && activeSelection.id === role.id;

                    // Which case connected to this role card?
                    const connectedCaseId = Object.keys(connections)
                      .map(Number)
                      .find((cId) => connections[cId].roleNodeId === role.id);
                    const connectedItem = connectedCaseId
                      ? currentItems.find((q) => q.id === connectedCaseId)
                      : null;

                    if (isTwoColumnMode) {
                      // 2-Column Row
                      return (
                        <div
                          key={`row-${item.id}`}
                          className="grid grid-cols-[1fr_1.3fr] sm:grid-cols-[1fr_1.4fr] gap-4 sm:gap-8 md:gap-14 items-stretch"
                        >
                          {/* 1. Left Card: 개념분류 2(소분류) 사회 용어 */}
                          <div
                            id={`case-card-${item.id}`}
                            onClick={() => handleCardClick('case', item.id)}
                            className={`p-3.5 sm:p-4 rounded-2xl bg-white border transition-all duration-150 relative cursor-pointer group shadow-xs flex flex-col justify-between ${
                              isCaseSelected
                                ? 'ring-2 ring-blue-500 border-transparent shadow-md bg-blue-50/20'
                                : isCaseCompleted
                                ? 'border-emerald-200 hover:border-emerald-300'
                                : 'border-slate-200 hover:border-blue-300 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className="px-2.5 py-0.5 rounded-lg text-xs font-bold text-white shadow-xs"
                                style={{ backgroundColor: item.color }}
                              >
                                {item.id}번
                              </span>

                              <div className="text-[11px] font-semibold">
                                {isCaseCompleted ? (
                                  <span className="text-emerald-700 flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> 연결 완료
                                  </span>
                                ) : (
                                  <span className="text-slate-400">선택 대기</span>
                                )}
                              </div>
                            </div>

                            {/* Term Title */}
                            <div className="my-1.5">
                              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-900 group-hover:text-blue-700 transition">
                                {item.term}
                              </h3>
                            </div>

                            {/* Right Connector Dot */}
                            <div
                              id={`case-dot-${item.id}`}
                              onPointerDown={(e) =>
                                handleDotPointerDown(
                                  e,
                                  'case',
                                  item.id,
                                  `case-dot-${item.id}`,
                                  item.color
                                )
                              }
                              title="터치하거나 드래그하여 오른쪽 설명에 연결"
                              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer touch-none transition-transform active:scale-125 z-20"
                              style={{
                                backgroundColor: isCaseCompleted ? item.color : '#cbd5e1',
                              }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                            </div>
                          </div>

                          {/* 2. Right Card: 주요 역할 및 특징/설명 */}
                          <div
                            id={`role-card-${role.id}`}
                            data-droptarget="true"
                            data-droptype="role"
                            data-dropid={role.id}
                            onClick={() => handleCardClick('role', role.id)}
                            className={`p-3.5 sm:p-4 rounded-2xl bg-white border transition-all duration-150 relative cursor-pointer flex flex-col justify-between shadow-xs group ${
                              isRoleSelected
                                ? 'ring-2 ring-emerald-500 border-transparent shadow-md bg-emerald-50/20'
                                : connectedItem
                                ? 'border-emerald-200'
                                : 'border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                            }`}
                          >
                            {/* Left Connector Handle */}
                            <div
                              id={`role-dot-${role.id}`}
                              title="터치하여 왼쪽 사회 용어와 연결"
                              className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer touch-none transition-transform active:scale-125 z-20"
                              style={{
                                backgroundColor: connectedItem ? connectedItem.color : '#cbd5e1',
                              }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                특징·설명
                              </span>

                              {connectedItem ? (
                                <span
                                  className="text-[11px] font-bold text-white px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1"
                                  style={{ backgroundColor: connectedItem.color }}
                                >
                                  {connectedItem.term} 연결됨
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">미연결</span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed pl-2">
                              {role.text}
                            </p>

                            <div className="text-[11px] text-slate-400 mt-2 text-right">
                              {connectedItem ? '연결선을 클릭하면 해제됩니다' : '왼쪽 용어를 클릭해 연결하세요'}
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      // 3-Column Row
                      const isActorSelected =
                        activeSelection?.type === 'actor' && activeSelection.id === actor.id;
                      const connectedCaseIds = Object.keys(connections)
                        .map(Number)
                        .filter((cId) => connections[cId].actorNodeId === actor.id);
                      const firstCase =
                        connectedCaseIds.length > 0
                          ? currentItems.find((q) => q.id === connectedCaseIds[0])
                          : null;

                      return (
                        <div
                          key={`row-3col-${item.id}`}
                          className="grid grid-cols-[1fr_1fr_1.4fr] gap-8 sm:gap-12 items-stretch"
                        >
                          {/* 1. 대분류 Card */}
                          <div
                            id={`case-card-${item.id}`}
                            onClick={() => handleCardClick('case', item.id)}
                            className={`p-4 rounded-2xl bg-white border transition-all duration-150 relative cursor-pointer group shadow-xs flex flex-col justify-between ${
                              isCaseSelected
                                ? 'ring-2 ring-blue-500 border-transparent shadow-md bg-blue-50/20'
                                : conn.actorNodeId
                                ? 'border-blue-200'
                                : 'border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className="px-2 py-0.5 rounded-lg text-xs font-bold text-white shadow-xs"
                                style={{ backgroundColor: item.color }}
                              >
                                {item.id}번
                              </span>
                              <span className="text-[11px] text-slate-500 font-semibold">
                                개념 분류 1
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                              {item.category}
                            </h3>

                            <div
                              id={`case-dot-${item.id}`}
                              onPointerDown={(e) =>
                                handleDotPointerDown(
                                  e,
                                  'case',
                                  item.id,
                                  `case-dot-${item.id}`,
                                  item.color
                                )
                              }
                              className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-20"
                              style={{
                                backgroundColor: conn.actorNodeId ? item.color : '#cbd5e1',
                              }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                            </div>
                          </div>

                          {/* 2. 소분류 용어 Card */}
                          <div
                            id={`actor-card-${actor.id}`}
                            data-droptarget="true"
                            data-droptype="actor"
                            data-dropid={actor.id}
                            onClick={() => handleCardClick('actor', actor.id)}
                            className={`p-4 rounded-2xl bg-white border transition-all duration-150 relative cursor-pointer flex flex-col justify-between shadow-xs ${
                              isActorSelected
                                ? 'ring-2 ring-indigo-500 border-transparent shadow-md bg-indigo-50/20'
                                : connectedCaseIds.length > 0
                                ? 'border-indigo-200'
                                : 'border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            <div
                              id={`actor-dot-left-${actor.id}`}
                              className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-20"
                              style={{
                                backgroundColor: firstCase ? firstCase.color : '#cbd5e1',
                              }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                            </div>

                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                개념 분류 2
                              </span>
                              <span className="text-[11px] text-slate-400">사회 용어</span>
                            </div>

                            <h3 className="text-base sm:text-lg font-black text-slate-900 text-center my-2">
                              {actor.text}
                            </h3>

                            <div
                              id={`actor-dot-right-${actor.id}`}
                              onPointerDown={(e) =>
                                handleDotPointerDown(
                                  e,
                                  'actor',
                                  actor.id,
                                  `actor-dot-right-${actor.id}`,
                                  firstCase ? firstCase.color : '#6366f1'
                                )
                              }
                              className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-20"
                              style={{
                                backgroundColor: firstCase ? firstCase.color : '#cbd5e1',
                              }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                            </div>
                          </div>

                          {/* 3. 특징 및 설명 Card */}
                          <div
                            id={`role-card-${role.id}`}
                            data-droptarget="true"
                            data-droptype="role"
                            data-dropid={role.id}
                            onClick={() => handleCardClick('role', role.id)}
                            className={`p-4 rounded-2xl bg-white border transition-all duration-150 relative cursor-pointer flex flex-col justify-between shadow-xs ${
                              isRoleSelected
                                ? 'ring-2 ring-emerald-500 border-transparent shadow-md bg-emerald-50/20'
                                : connectedItem
                                ? 'border-emerald-200'
                                : 'border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            <div
                              id={`role-dot-${role.id}`}
                              className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-125 z-20"
                              style={{
                                backgroundColor: connectedItem ? connectedItem.color : '#cbd5e1',
                              }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                주요 역할 및 특징
                              </span>
                              {connectedItem && (
                                <span
                                  className="text-[11px] font-bold text-white px-2 py-0.5 rounded-md"
                                  style={{ backgroundColor: connectedItem.color }}
                                >
                                  {connectedItem.term}
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed pl-2">
                              {role.text}
                            </p>

                            <div className="text-[11px] text-slate-400 mt-2 text-right">
                              {connectedItem ? '연결 완료' : '미연결'}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>

              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    선긋기 채점 및 맞춤형 피드백 확인
                  </h4>
                  <p className="text-xs text-slate-500">
                    {completedCount === currentItems.length
                      ? '모든 문항을 연결했습니다! 아래 버튼을 눌러 채점해 보세요.'
                      : `현재 ${completedCount} / ${currentItems.length}개 연결됨 (모두 연결한 후 제출을 권장합니다)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                    showCorrectAnswers
                      ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span>{showCorrectAnswers ? '정답 선 끄기' : '정답 선 미리보기'}</span>
                </button>

                <button
                  onClick={handleGradeAndSubmit}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>채점 및 결과 제출</span>
                </button>
              </div>
            </div>

          </main>
        </>
      )}

      {/* Result Modal */}
      {isResultOpen && currentSubmission && (
        <ResultModal
          submission={currentSubmission}
          onClose={() => setIsResultOpen(false)}
          onRetry={() => {
            setIsResultOpen(false);
            handleResetAll();
          }}
          onToggleShowAnswers={() => setShowCorrectAnswers(!showCorrectAnswers)}
          showingAnswers={showCorrectAnswers}
          sheetSubmitStatus={sheetSubmitStatus}
        />
      )}
    </div>
  );
}
