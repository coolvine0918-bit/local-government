import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  Flame,
  Award,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Vote,
  BookOpen
} from 'lucide-react';
import {
  SPEED_QUIZ_ITEMS,
  SPEED_ATTEMPTS_CONFIG,
  CORE_PARTICIPATION_METHODS,
  SpeedQuizAttemptResult
} from '../data/speedQuizData';
import { sounds } from '../utils/audio';

interface SpeedQuizProps {
  studentId: string;
  studentName: string;
  soundOn: boolean;
  gasUrl: string;
}

export function SpeedQuiz({ studentId, studentName, soundOn, gasUrl }: SpeedQuizProps) {
  // Attempt tracking (1 -> 2 -> 3)
  const [currentAttemptNumber, setCurrentAttemptNumber] = useState<number>(1);
  const [attemptHistory, setAttemptHistory] = useState<SpeedQuizAttemptResult[]>([]);

  // Game stage: 'intro' | 'playing' | 'result'
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'result'>('intro');

  // Question index in active attempt (0..9)
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(
    new Array(SPEED_QUIZ_ITEMS.length).fill(null)
  );

  // Timer state
  const currentConfig = SPEED_ATTEMPTS_CONFIG.find((c) => c.attempt === currentAttemptNumber) || SPEED_ATTEMPTS_CONFIG[0];
  const [timeLeft, setTimeLeft] = useState<number>(currentConfig.timeLimit);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Submit status
  const [submitStatus, setSubmitStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Streak counter
  const [streak, setStreak] = useState<number>(0);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer countdown while playing
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeOver();
            return 0;
          }
          if (prev <= 6 && soundOn) {
            sounds.play('connect');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Start new attempt
  const handleStartAttempt = () => {
    const trimmedId = studentId.trim();
    const trimmedName = studentName.trim();

    if (!trimmedId || !trimmedName) {
      alert('상단 헤더에 학번과 이름을 먼저 입력해 주세요!');
      const idInput = document.getElementById('studentIdInput');
      if (idInput) idInput.focus();
      return;
    }

    const config = SPEED_ATTEMPTS_CONFIG.find((c) => c.attempt === currentAttemptNumber) || SPEED_ATTEMPTS_CONFIG[0];
    setTimeLeft(config.timeLimit);
    setCurrentIndex(0);
    setUserAnswers(new Array(SPEED_QUIZ_ITEMS.length).fill(null));
    setStreak(0);
    setSubmitStatus({ status: 'idle', message: '' });
    startTimeRef.current = Date.now();
    setGameState('playing');
    if (soundOn) sounds.play('select');
  };

  // Student selects an answer from the 2 options
  const handleAnswer = (choice: string) => {
    if (gameState !== 'playing') return;

    const currentItem = SPEED_QUIZ_ITEMS[currentIndex];
    const isCorrect = choice === currentItem.answer;

    if (soundOn) {
      sounds.play(isCorrect ? 'connect' : 'delete');
    }

    if (isCorrect) {
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }

    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentIndex] = choice;
    setUserAnswers(updatedAnswers);

    if (currentIndex + 1 >= SPEED_QUIZ_ITEMS.length) {
      finishAttempt(updatedAnswers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Time expired handler
  const handleTimeOver = () => {
    if (soundOn) sounds.play('delete');
    finishAttempt(userAnswers);
  };

  // Finish current attempt and save result
  const finishAttempt = (finalAnswers: (string | null)[]) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsedSeconds = Math.min(
      currentConfig.timeLimit,
      Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    );

    let correct = 0;
    const answerBreakdown = SPEED_QUIZ_ITEMS.map((item, idx) => {
      const userChoice: string = finalAnswers[idx] || '미응답';
      const isCorrect = userChoice === item.answer;
      if (isCorrect) correct++;
      return {
        item,
        userAnswer: userChoice,
        isCorrect
      };
    });

    const timestamp = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const attemptResult: SpeedQuizAttemptResult = {
      attemptNumber: currentAttemptNumber,
      timeLimit: currentConfig.timeLimit,
      timeSpent: elapsedSeconds,
      correctCount: correct,
      totalQuestions: SPEED_QUIZ_ITEMS.length,
      answers: answerBreakdown,
      timestamp
    };

    setAttemptHistory((prev) => [...prev, attemptResult]);
    setGameState('result');

    if (correct >= 8) {
      if (soundOn) sounds.play('complete');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    submitToGoogleSheet2(attemptResult);
  };

  // Google Sheet 2 Submission
  const submitToGoogleSheet2 = (result: SpeedQuizAttemptResult) => {
    const payload = {
      page: 2,
      sheet: '시트 2',
      type: 'speed_quiz',
      quizType: 'speed',
      targetSheet: '시트 2',
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      score: Math.round((result.correctCount / result.totalQuestions) * 100),
      attemptNumber: result.attemptNumber,
      timeLimit: result.timeLimit,
      timeSpent: result.timeSpent,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      timestamp: result.timestamp,
      details: result.answers
        .map(
          (a) =>
            `${a.item.id}.${a.item.title}: 선택(${a.userAnswer})/${a.isCorrect ? 'O' : 'X'}`
        )
        .join(' | ')
    };

    setSubmitStatus({
      status: 'sending',
      message: '구글 스프레드시트 [시트 2]에 기록 중...'
    });

    const targetUrl = gasUrl || 'https://script.google.com/macros/s/AKfycbyEReFhtl1AW5vdnDyo_8JsNwqmpnQ8sTo6HuVzO0O_qiMJlJXL2JYQaqvy88jMOnCFAQ/exec';

    if (targetUrl && targetUrl.startsWith('http')) {
      const urlWithParams = `${targetUrl}${
        targetUrl.includes('?') ? '&' : '?'
      }type=speed_quiz&page=2&sheet=${encodeURIComponent('시트 2')}&studentId=${encodeURIComponent(
        payload.studentId
      )}&studentName=${encodeURIComponent(payload.studentName)}&score=${payload.score}&attemptNumber=${
        payload.attemptNumber
      }&correctCount=${payload.correctCount}&totalQuestions=${payload.totalQuestions}&timeSpent=${
        payload.timeSpent
      }`;

      fetch(urlWithParams, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(() => {
          setSubmitStatus({
            status: 'success',
            message: '구글 스프레드시트 [시트 2]에 성공적으로 전송 및 기록되었습니다!'
          });
        })
        .catch(() => {
          fetch(urlWithParams, { method: 'GET', mode: 'no-cors' })
            .then(() => {
              setSubmitStatus({
                status: 'success',
                message: '구글 스프레드시트 [시트 2]에 성공적으로 전송 및 기록되었습니다!'
              });
            })
            .catch((err) => {
              setSubmitStatus({
                status: 'error',
                message: '전송 오류 발생: ' + err
              });
            });
        });
      return;
    }

    setTimeout(() => {
      setSubmitStatus({
        status: 'success',
        message: '시트 2 저장 완료 (테스트/로컬 모드 - 실시간 연동 준비 완료)'
      });
    }, 600);
  };

  // Move to next attempt (up to 3)
  const handleProceedNextAttempt = () => {
    if (currentAttemptNumber < 3) {
      setCurrentAttemptNumber((prev) => prev + 1);
      setGameState('intro');
    }
  };

  const currentResult = attemptHistory[attemptHistory.length - 1];
  const progressRatio = ((currentConfig.timeLimit - timeLeft) / currentConfig.timeLimit) * 100;
  const isTimeCritical = timeLeft <= 5 && gameState === 'playing';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full">
      {/* Top Attempt Progress Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                지역사회 시민 참여 방법 사례 탐구 스피드 퀴즈
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                구체적 상황·사례를 읽고 2개의 선택지 중 알맞은 시민 참여 방법(주민투표, 지방선거, 주민소환제 등)을 신속히 선택하세요!
              </p>
            </div>
          </div>

          {/* 3 Attempts Badge Steps */}
          <div className="flex items-center gap-2">
            {SPEED_ATTEMPTS_CONFIG.map((cfg) => {
              const attemptRecord = attemptHistory.find((a) => a.attemptNumber === cfg.attempt);
              const isCurrent = cfg.attempt === currentAttemptNumber && gameState !== 'result';
              const isDone = !!attemptRecord;

              return (
                <div
                  key={cfg.attempt}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    isDone
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : isCurrent
                      ? 'bg-blue-50 border-blue-400 text-blue-800 ring-2 ring-blue-300'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span>{cfg.attempt}차 ({cfg.timeLimit}초)</span>
                  {isDone && (
                    <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                      {attemptRecord.correctCount}/{SPEED_QUIZ_ITEMS.length}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1. INTRO SCREEN */}
      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-4">
            <Clock className="w-8 h-8" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 mb-2">
            총 3회 중 제 {currentAttemptNumber}차 도전
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-2">
            제한시간 <span className="text-amber-600">{currentConfig.timeLimit}초</span> 스피드 도전!
          </h3>

          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6 leading-relaxed">
            화면에 제시되는 <strong>구체적인 지역사회 상황 및 스토리텔링 사례</strong>를 하나씩 읽고,<br />
            2개의 시민 참여 방법 중 가장 알맞은 정답을 신속하게 골라주세요!
          </p>

          {/* Core Citizen Participation Concept Cards */}
          <div className="text-left mb-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-1.5 mb-2.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-700">핵심 5대 시민 참여 방법 미리보기:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {CORE_PARTICIPATION_METHODS.map((method) => (
                <div
                  key={method.name}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition"
                >
                  <div
                    className="text-xs font-black mb-1 flex items-center gap-1"
                    style={{ color: method.color }}
                  >
                    <span>●</span>
                    <span>{method.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                    {method.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartAttempt}
            className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-lg rounded-2xl shadow-md transition transform active:scale-95 inline-flex items-center gap-2.5 cursor-pointer"
          >
            <span>{currentAttemptNumber}차 도전 시작하기 ({currentConfig.timeLimit}초)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 2. PLAYING SCREEN */}
      {gameState === 'playing' && (
        <div className="space-y-4">
          {/* Timer and Progress Bar Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {currentAttemptNumber}차 도전
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  문항 {currentIndex + 1} / {SPEED_QUIZ_ITEMS.length}
                </span>
                {streak > 1 && (
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 animate-bounce">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {streak}연속 정답!
                  </span>
                )}
              </div>

              {/* Countdown Digits */}
              <div
                className={`flex items-center gap-1.5 font-black text-lg sm:text-xl px-3 py-1 rounded-xl transition-all ${
                  isTimeCritical
                    ? 'bg-red-500 text-white animate-pulse shadow-md'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span>{timeLeft}초 남음</span>
              </div>
            </div>

            {/* Time progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isTimeCritical ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${100 - progressRatio}%` }}
              />
            </div>
          </div>

          {/* Active Question Card */}
          {(() => {
            const currentItem = SPEED_QUIZ_ITEMS[currentIndex];
            return (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Question index badge */}
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs mb-3 shadow-xs">
                  사례 {currentItem.id} / {SPEED_QUIZ_ITEMS.length}
                </div>

                <div className="text-xs font-semibold text-amber-700 mb-1">상황 및 스토리텔링 사례</div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-4">
                  {currentItem.title}
                </h3>

                {/* Case Story Paragraph */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6 max-w-2xl mx-auto mb-8 text-left shadow-2xs">
                  <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    <span>실제 상황 내용</span>
                  </div>
                  <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-semibold">
                    "{currentItem.caseText}"
                  </p>
                </div>

                {/* 2 Big Choice Buttons */}
                <div className="text-xs font-bold text-slate-500 mb-3">
                  위 상황에 해당하는 알맞은 시민 참여 방법을 선택하세요:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                  {currentItem.options.map((opt, optIdx) => {
                    const isOptionA = optIdx === 0;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        className={`p-5 rounded-2xl border-2 font-black text-base sm:text-lg transition transform active:scale-95 shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                          isOptionA
                            ? 'border-blue-500 bg-blue-50 hover:bg-blue-600 text-blue-900 hover:text-white'
                            : 'border-emerald-500 bg-emerald-50 hover:bg-emerald-600 text-emerald-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Vote className="w-5 h-5" />
                          <span>{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. RESULT SCREEN */}
      {gameState === 'result' && currentResult && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
          {/* Header Result Banner */}
          <div className="text-center pb-6 border-b border-slate-200 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-3">
              <Award className="w-9 h-9" />
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 inline-block mb-1">
              제 {currentResult.attemptNumber}차 도전 결과 보고서
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              {studentName} 학생 ({studentId})
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              제출 일시: {currentResult.timestamp} · 소요 시간: {currentResult.timeSpent}초 / {currentResult.timeLimit}초
            </p>

            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="p-3 px-5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block">정답 개수</span>
                <span className="text-2xl font-black text-blue-600">
                  {currentResult.correctCount} / {currentResult.totalQuestions}
                </span>
              </div>
              <div className="p-3 px-5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block">점수 환산</span>
                <span className="text-2xl font-black text-amber-600">
                  {Math.round((currentResult.correctCount / currentResult.totalQuestions) * 100)}점
                </span>
              </div>
            </div>

            {/* Google Sheets Status */}
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium px-4 py-1.5 rounded-full bg-slate-100 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{submitStatus.message || '스프레드시트 [시트 2] 기록 완료'}</span>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-3 mb-6">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>문항별 정오표 및 시민 참여 방법 해설</span>
            </h4>

            {currentResult.answers.map((ans) => (
              <div
                key={ans.item.id}
                className={`p-4 rounded-2xl border transition ${
                  ans.isCorrect
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                      {ans.item.id}
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm">{ans.item.title}</h5>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold">
                    {ans.isCorrect ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> 정답
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> 오답
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 mb-2.5 font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-200/60">
                  "{ans.item.caseText}"
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500">내 선택: </span>
                    <strong className={ans.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                      {ans.userAnswer}
                    </strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-500">올바른 정답: </span>
                    <strong className="text-blue-700">{ans.item.answer}</strong>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 leading-relaxed">
                  <strong className="text-blue-800">💡 교과 해설: </strong>
                  {ans.item.explanation}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setGameState('intro');
                setTimeLeft(currentConfig.timeLimit);
              }}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>현재 차수 다시 풀기</span>
            </button>

            {currentAttemptNumber < 3 ? (
              <button
                onClick={handleProceedNextAttempt}
                className="px-6 py-2.5 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>다음 {currentAttemptNumber + 1}차 도전 ({SPEED_ATTEMPTS_CONFIG[currentAttemptNumber].timeLimit}초)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                ✨ 모든 3회 도전 완료!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
