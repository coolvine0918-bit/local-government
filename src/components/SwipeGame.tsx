import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  Flame,
  Award,
  RotateCcw,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Camera,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Trophy,
  Sparkles,
  ArrowRight,
  Settings,
  BookOpen,
  Volume2,
  VolumeX,
  Gift,
  AlertTriangle,
} from 'lucide-react';
import {
  SWIPE_QUIZ_ITEMS,
  DIRECTION_CONFIGS,
  SwipeDirection,
  SwipeItem,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  LeaderboardEntry,
  DEFAULT_LEADERBOARD,
} from '../data/swipeGameData';
import { SpecialtyItem, pickRandomSpecialties } from '../data/specialtyData';
import { sounds } from '../utils/audio';

interface SwipeGameProps {
  studentId: string;
  studentName: string;
  soundOn: boolean;
  gasUrl: string;
}

interface WrongAnswerRecord {
  item: SwipeItem;
  chosenDirection: SwipeDirection;
  correctDirection: SwipeDirection;
}

export function SwipeGame({ studentId, studentName, soundOn, gasUrl }: SwipeGameProps) {
  // Game States: 'intro' | 'playing' | 'gameover' | 'cleared'
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameover' | 'cleared'>('intro');

  // Nickname
  const [nickname, setNickname] = useState<string>(() => {
    if (studentName) return `${studentName}${studentId ? `(${studentId})` : ''}`;
    return localStorage.getItem('swipe_game_nickname') || '';
  });

  // Keep nickname synced if props change
  useEffect(() => {
    if (studentName && !nickname) {
      setNickname(`${studentName}${studentId ? `(${studentId})` : ''}`);
    }
  }, [studentName, studentId]);

  // Questions queue
  const [questions, setQuestions] = useState<SwipeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Stats
  const [lives, setLives] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  // Consecutive counters for thrills
  const [consecutiveWrong, setConsecutiveWrong] = useState<number>(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);

  // Specialty Bonus Modal state (triggered on 2 consecutive correct)
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState<boolean>(false);
  const [specialtyOptions, setSpecialtyOptions] = useState<SpecialtyItem[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyItem | null>(null);

  // 2-Consecutive Wrong Reset Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // Wrong answers tracking
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerRecord[]>([]);

  // Red flash effect on screen edges
  const [isRedFlashing, setIsRedFlashing] = useState<boolean>(false);

  // Drag & Swipe State
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [flyingDirection, setFlyingDirection] = useState<SwipeDirection | null>(null);

  // Touch start ref for velocity / distance
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState<boolean>(false);
  const [supabaseConfig, setSupabaseConfig] = useState<{ url: string; anonKey: string }>(() => {
    const savedUrl = localStorage.getItem('supabase_project_url');
    const savedKey = localStorage.getItem('supabase_anon_key');
    const url = (savedUrl && savedUrl.trim() !== '') ? savedUrl : SUPABASE_URL;
    const anonKey = (savedKey && savedKey.trim() !== '') ? savedKey : SUPABASE_ANON_KEY;
    localStorage.setItem('supabase_project_url', url);
    localStorage.setItem('supabase_anon_key', anonKey);
    return { url, anonKey };
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Google Sheet Webhook Submit Status
  const [sheetSubmitStatus, setSheetSubmitStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'success' | 'error' | 'swipe') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'success') navigator.vibrate(30);
        else if (type === 'error') navigator.vibrate([80, 50, 80]);
        else navigator.vibrate(15);
      } catch {
        // Ignore vibration errors
      }
    }
  }, []);

  // Fetch Leaderboard from Supabase or LocalStorage
  const fetchLeaderboard = useCallback(async () => {
    setIsLeaderboardLoading(true);
    const { url, anonKey } = supabaseConfig;

    if (url && anonKey) {
      try {
        const cleanUrl = url.replace(/\/+$/, '');
        const res = await fetch(`${cleanUrl}/rest/v1/leaderboard?select=*&order=score.desc&limit=10`, {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data: LeaderboardEntry[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setLeaderboard(data);
            setIsLeaderboardLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local leaderboard', err);
      }
    }

    // Fallback: LocalStorage
    const saved = localStorage.getItem('swipe_game_local_leaderboard');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLeaderboard(parsed);
        setIsLeaderboardLoading(false);
        return;
      } catch {
        // Fallback to defaults
      }
    }
    setLeaderboard(DEFAULT_LEADERBOARD);
    setIsLeaderboardLoading(false);
  }, [supabaseConfig]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Insert Score to Supabase and LocalStorage
  const recordFinalScore = async (finalScore: number, finalCorrectCount: number) => {
    const playerNick = nickname.trim() || '익명학생';
    localStorage.setItem('swipe_game_nickname', playerNick);

    const newEntry: LeaderboardEntry = {
      nickname: playerNick,
      score: finalScore,
      correct_count: finalCorrectCount,
      total_items: SWIPE_QUIZ_ITEMS.length,
      created_at: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      stage: '3페이지 스와이프 게임',
    };

    // 1. Supabase Insert
    const { url, anonKey } = supabaseConfig;
    if (url && anonKey) {
      try {
        const cleanUrl = url.replace(/\/+$/, '');
        await fetch(`${cleanUrl}/rest/v1/leaderboard`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            nickname: playerNick,
            score: finalScore,
            correct_count: finalCorrectCount,
            stage: '3페이지 자치단체 기관 분류',
          }),
        });
      } catch (err) {
        console.warn('Supabase insert failed:', err);
      }
    }

    // 2. LocalStorage Leaderboard Update
    try {
      const saved = localStorage.getItem('swipe_game_local_leaderboard');
      const currentList: LeaderboardEntry[] = saved ? JSON.parse(saved) : [...DEFAULT_LEADERBOARD];
      const updated = [...currentList, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 15);
      localStorage.setItem('swipe_game_local_leaderboard', JSON.stringify(updated));
      setLeaderboard(updated.slice(0, 10));
    } catch {
      // Ignore
    }

    // 3. Google Apps Script Webhook Submission (Sheet 3)
    if (gasUrl) {
      setSheetSubmitStatus({ status: 'sending', message: '스프레드시트 3페이지에 점수 전송 중...' });
      try {
        const payload = {
          studentId: studentId.trim() || '-',
          studentName: studentName.trim() || playerNick,
          score: finalScore,
          page: 3,
          sheet: '시트 3',
          quizTitle: '상황별 자치단체 기관 분류 스와이프 게임',
          details: `정답 ${finalCorrectCount}/${SWIPE_QUIZ_ITEMS.length}개, 최대 콤보: ${maxCombo}연속`,
          timestamp: new Date().toISOString(),
        };

        const targetUrl = new URL(gasUrl);
        targetUrl.searchParams.set('studentId', payload.studentId);
        targetUrl.searchParams.set('studentName', payload.studentName);
        targetUrl.searchParams.set('score', String(payload.score));
        targetUrl.searchParams.set('page', '3');
        targetUrl.searchParams.set('sheet', '시트 3');

        await fetch(targetUrl.toString(), {
          method: 'GET',
          mode: 'no-cors',
        });

        setSheetSubmitStatus({ status: 'success', message: '구글 시트 3에 성적이 정상 등록되었습니다!' });
      } catch {
        setSheetSubmitStatus({ status: 'error', message: '구글 시트 전송 실패 (네트워크 확인)' });
      }
    }
  };

  // Start Game
  const handleStartGame = () => {
    if (!nickname.trim()) {
      alert('닉네임(또는 학번/이름)을 입력해 주세요!');
      return;
    }

    // Shuffle questions
    const shuffled = [...SWIPE_QUIZ_ITEMS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setLives(3);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setWrongAnswers([]);
    setIsRedFlashing(false);
    setDragOffset({ x: 0, y: 0 });
    setFlyingDirection(null);
    setSheetSubmitStatus({ status: 'idle', message: '' });
    setConsecutiveWrong(0);
    setConsecutiveCorrect(0);
    setIsSpecialtyModalOpen(false);
    setIsResetModalOpen(false);
    setSelectedSpecialty(null);
    setGameState('playing');

    if (soundOn) sounds.play('select');
    triggerHaptic('swipe');
  };

  // Specialty selection handler
  const handleSelectSpecialty = (item: SpecialtyItem) => {
    if (selectedSpecialty) return;
    setSelectedSpecialty(item);

    if (item.isBomb) {
      setScore(0);
      triggerHaptic('error');
      if (soundOn) sounds.play('delete');
    } else if (item.isHeal) {
      setLives((prev) => Math.min(prev + 1, 3));
      setScore((prev) => prev + item.scoreDelta);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
      triggerHaptic('success');
      if (soundOn) sounds.play('success');
    } else if (item.scoreDelta < 0) {
      setScore((prev) => Math.max(0, prev + item.scoreDelta));
      triggerHaptic('error');
      if (soundOn) sounds.play('delete');
    } else {
      setScore((prev) => prev + item.scoreDelta);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
      triggerHaptic('success');
      if (soundOn) sounds.play('success');
    }
  };

  const handleSpecialtyContinue = () => {
    setIsSpecialtyModalOpen(false);
    setSelectedSpecialty(null);
    setConsecutiveCorrect(0);

    if (currentIndex + 1 >= questions.length) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if (soundOn) sounds.play('complete');
      setGameState('cleared');
      recordFinalScore(score + 500, correctCount);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // 2-Wrong Sudden Death reset handler
  const handleRestartFromBeginning = () => {
    setIsResetModalOpen(false);
    setConsecutiveWrong(0);
    setConsecutiveCorrect(0);
    setCombo(0);
    setLives(3);
    setCurrentIndex(0);
    const shuffled = [...SWIPE_QUIZ_ITEMS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    if (soundOn) sounds.play('select');
  };

  // Process Swipe or Button Action
  const handleSwipeAction = (dir: SwipeDirection) => {
    if (gameState !== 'playing' || flyingDirection !== null || isSpecialtyModalOpen || isResetModalOpen) return;

    const currentItem = questions[currentIndex];
    if (!currentItem) return;

    setFlyingDirection(dir);
    const isCorrect = dir === currentItem.direction;

    if (isCorrect) {
      if (soundOn) sounds.play('success');
      triggerHaptic('success');

      setConsecutiveWrong(0);
      const nextConsecutiveCorrect = consecutiveCorrect + 1;
      setConsecutiveCorrect(nextConsecutiveCorrect);

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      const comboBonus = (nextCombo - 1) * 20;
      const points = 100 + comboBonus;
      setScore((prev) => prev + points);
      setCorrectCount((prev) => prev + 1);

      // Check if 2 consecutive correct answers reached! (Specialty Bonus Event)
      if (nextConsecutiveCorrect >= 2) {
        setTimeout(() => {
          setFlyingDirection(null);
          setDragOffset({ x: 0, y: 0 });
          setSpecialtyOptions(pickRandomSpecialties(3));
          setSelectedSpecialty(null);
          setIsSpecialtyModalOpen(true);
        }, 280);
        return;
      }
    } else {
      if (soundOn) sounds.play('delete');
      triggerHaptic('error');

      setConsecutiveCorrect(0);
      const nextConsecutiveWrong = consecutiveWrong + 1;
      setConsecutiveWrong(nextConsecutiveWrong);

      // Reset combo
      setCombo(0);

      // Red flash effect
      setIsRedFlashing(true);
      setTimeout(() => setIsRedFlashing(false), 450);

      // Record wrong answer
      setWrongAnswers((prev) => [
        ...prev,
        {
          item: currentItem,
          chosenDirection: dir,
          correctDirection: currentItem.direction,
        },
      ]);

      // Deduct Life
      const nextLives = lives - 1;
      setLives(nextLives);

      // Check if 2 consecutive wrong answers reached! (Sudden Death to Q1)
      if (nextConsecutiveWrong >= 2) {
        setTimeout(() => {
          setFlyingDirection(null);
          setDragOffset({ x: 0, y: 0 });
          setIsResetModalOpen(true);
          triggerHaptic('error');
          if (soundOn) sounds.play('delete');
        }, 280);
        return;
      }

      if (nextLives <= 0) {
        // Game Over!
        setTimeout(() => {
          setGameState('gameover');
          setFlyingDirection(null);
          setDragOffset({ x: 0, y: 0 });
          recordFinalScore(score, correctCount);
        }, 320);
        return;
      }
    }

    // Move to next question after animation
    setTimeout(() => {
      setFlyingDirection(null);
      setDragOffset({ x: 0, y: 0 });

      if (currentIndex + 1 >= questions.length) {
        // Cleared All 20 Questions!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        if (soundOn) sounds.play('complete');
        setGameState('cleared');
        recordFinalScore(score + 500, correctCount + (isCorrect ? 1 : 0));
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 280);
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || flyingDirection !== null || isSpecialtyModalOpen || isResetModalOpen) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleSwipeAction('UP');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleSwipeAction('DOWN');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSwipeAction('LEFT');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSwipeAction('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, flyingDirection, currentIndex, questions, combo, lives, score]);

  // Touch & Pointer Gesture Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== 'playing' || flyingDirection !== null) return;
    setIsDragging(true);
    touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !touchStartRef.current || flyingDirection !== null) return;
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !touchStartRef.current) return;
    setIsDragging(false);

    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    const threshold = 70; // 70px drag threshold
    const velocity = Math.sqrt(dx * dx + dy * dy) / Math.max(dt, 1);

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold || velocity > 0.6) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0) handleSwipeAction('RIGHT');
        else handleSwipeAction('LEFT');
      } else {
        // Vertical swipe
        if (dy > 0) handleSwipeAction('DOWN');
        else handleSwipeAction('UP');
      }
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Determine active direction based on dragOffset
  const getActiveDragDirection = (): SwipeDirection | null => {
    if (!isDragging) return null;
    const { x, y } = dragOffset;
    const dist = Math.sqrt(x * x + y * y);
    if (dist < 40) return null;

    if (Math.abs(x) > Math.abs(y)) {
      return x > 0 ? 'RIGHT' : 'LEFT';
    } else {
      return y > 0 ? 'DOWN' : 'UP';
    }
  };

  const activeDragDir = getActiveDragDirection();
  const currentItem = questions[currentIndex];

  // Save custom Supabase credentials
  const handleSaveSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('supabase_project_url', url);
    localStorage.setItem('supabase_anon_key', key);
    setSupabaseConfig({ url, anonKey: key });
    setIsSettingsOpen(false);
    fetchLeaderboard();
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-between overflow-hidden bg-slate-100 select-none">
      {/* Red screen flash vignette on mistake */}
      {isRedFlashing && (
        <div className="pointer-events-none fixed inset-0 z-50 border-8 border-red-500/80 bg-red-500/20 animate-pulse" />
      )}

      {/* Supabase Config Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black text-slate-900">Supabase 실시간 랭킹 연동 설정</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-600">
              <p className="leading-relaxed">
                Supabase 무료 프로젝트의 URL과 public anon key를 입력하면, 학생들의 성적이 실시간으로{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-700">
                  leaderboard
                </code>{' '}
                테이블에 저장되고 교실 전체 전자칠판과 태블릿에 실시간 반영됩니다.
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Project URL</label>
                <input
                  type="text"
                  id="supabaseUrlInput"
                  defaultValue={supabaseConfig.url}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Anon / Public API Key</label>
                <input
                  type="text"
                  id="supabaseKeyInput"
                  defaultValue={supabaseConfig.anonKey}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:outline-emerald-500"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">💡 Supabase SQL 에디터 생성 쿼리:</span>
                <pre className="text-[10px] bg-slate-900 text-slate-100 p-2 rounded overflow-x-auto">
{`CREATE TABLE leaderboard (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL,
  correct_count INTEGER DEFAULT 0,
  stage TEXT DEFAULT '3페이지',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read & Insert" ON leaderboard FOR ALL USING (true);`}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  const url = (document.getElementById('supabaseUrlInput') as HTMLInputElement).value;
                  const key = (document.getElementById('supabaseKeyInput') as HTMLInputElement).value;
                  handleSaveSupabaseConfig(url, key);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm cursor-pointer"
              >
                설정 저장 및 연동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Consecutive Correct: Specialty Mystery Box Event Modal */}
      {isSpecialtyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black mb-3">
              <Gift className="w-4 h-4 text-amber-600" /> 🎉 2연속 정답 달성! 지방 특산물 보너스 상자
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              마음에 드는 특산물 상자를 하나 고르세요!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
              상자마다 랜덤한 특산물과 점수가 숨겨져 있습니다.{' '}
              <span className="text-red-600 font-bold block sm:inline">⚠️ 주의: 점수가 0점이 되는 폭탄 배추가 숨어있을 수도 있습니다! 💣</span>
            </p>

            {/* 3 Mystery Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {specialtyOptions.map((item, idx) => {
                const isSelected = selectedSpecialty?.id === item.id;
                const isRevealed = selectedSpecialty !== null;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSpecialty(item)}
                    className={`relative rounded-2xl p-4 sm:p-5 border-2 transition-all duration-300 cursor-pointer flex flex-col items-center justify-between min-h-[180px] ${
                      !isRevealed
                        ? 'bg-gradient-to-b from-amber-50 to-orange-50 border-amber-300 hover:border-amber-400 hover:scale-105 shadow-sm active:scale-95'
                        : isSelected
                        ? item.isBomb
                          ? 'bg-slate-900 text-white border-red-500 shadow-xl ring-4 ring-red-400 scale-105'
                          : 'bg-emerald-50 text-slate-900 border-emerald-500 shadow-xl ring-4 ring-emerald-300 scale-105'
                        : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60'
                    }`}
                  >
                    {!isRevealed ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-2">
                        <div className="w-14 h-14 rounded-2xl bg-amber-200/80 text-amber-800 flex items-center justify-center text-3xl shadow-inner mb-2 animate-bounce">
                          🎁
                        </div>
                        <span className="font-black text-sm text-amber-950">
                          특산물 상자 {idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-amber-700 mt-1">
                          터치하여 개봉
                        </span>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center w-full py-1">
                        <div className="text-4xl mb-1.5">{item.icon}</div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 text-slate-700 mb-1 border border-slate-200">
                          {item.region}
                        </span>
                        <h4 className="font-black text-sm sm:text-base leading-tight mb-1">
                          {item.name}
                        </h4>
                        <div className="mt-1">
                          {item.isBomb ? (
                            <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-black inline-block animate-pulse">
                              💥 점수 0점 리셋!
                            </span>
                          ) : item.isHeal ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-black inline-block">
                              ❤️ 하트+1 &amp; +100점
                            </span>
                          ) : item.scoreDelta > 0 ? (
                            <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-black inline-block">
                              +{item.scoreDelta}점 획득!
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-black inline-block">
                              {item.scoreDelta}점 감점
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <p className={`text-[11px] font-medium mt-2 leading-tight ${item.isBomb ? 'text-red-200' : 'text-slate-600'}`}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Continue Button */}
            {selectedSpecialty ? (
              <button
                onClick={handleSpecialtyContinue}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>다음 문제로 계속하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <p className="text-xs text-amber-700 font-bold">👆 위 상자 중 하나를 터치해 열어보세요!</p>
            )}
          </div>
        </div>
      )}

      {/* 2-Consecutive Wrong: Sudden Death Reset to Q1 Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-4 border-red-500 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black mb-3">
              🚨 2연속 오답 발생!
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              1번 문제부터 다시 시작합니다!
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              자치단체 기관 개념(광역/기초, 집행/의결)을 더욱 확실하게 다잡기 위해 1번 문제로 돌아갑니다. 이번엔 침착하게 도전해 보세요!
            </p>

            <button
              onClick={handleRestartFromBeginning}
              className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-lg shadow-red-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>1번 문제부터 다시 도전하기</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. INTRO SCREEN */}
      {gameState === 'intro' && (
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-center">
          <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200/80 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-black mb-3">
              <Sparkles className="w-3.5 h-3.5" /> 태블릿 최적화 스와이프 액션 게임
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              상황별 자치단체 기관 분류 스와이프
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mb-6 leading-relaxed">
              중앙에 제시되는 지자체 사례 및 역할을 보고{' '}
              <strong className="text-blue-600">상(광역 집행)</strong>,{' '}
              <strong className="text-indigo-600">하(광역 의결)</strong>,{' '}
              <strong className="text-amber-600">좌(기초 집행)</strong>,{' '}
              <strong className="text-emerald-600">우(기초 의결)</strong> 4방향으로 스와이프하여 신속하게 분류하세요!
            </p>

            {/* 4 Directions Map Guide Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-2xl mx-auto mb-6 text-left">
              <div className="p-3 rounded-2xl bg-blue-50/70 border-2 border-blue-200 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-blue-600 text-white">상(↑)</span>
                  <ChevronUp className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-sm font-black text-blue-900">광역 집행</h4>
                <p className="text-[10px] text-blue-700/80 leading-tight mt-1">시·도지사, 특별시청, 광역시청, 도청</p>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/70 border-2 border-indigo-200 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-600 text-white">하(↓)</span>
                  <ChevronDown className="w-4 h-4 text-indigo-600" />
                </div>
                <h4 className="text-sm font-black text-indigo-900">광역 의결</h4>
                <p className="text-[10px] text-indigo-700/80 leading-tight mt-1">시·도의회 (조례 제정, 예산안 심의)</p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border-2 border-amber-200 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-600 text-white">좌(←)</span>
                  <ChevronLeft className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="text-sm font-black text-amber-900">기초 집행</h4>
                <p className="text-[10px] text-amber-700/80 leading-tight mt-1">시장, 군수, 구청장, 시청, 군청, 구청</p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white">우(→)</span>
                  <ChevronRight className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-sm font-black text-emerald-900">기초 의결</h4>
                <p className="text-[10px] text-emerald-700/80 leading-tight mt-1">시·군·구의회 (조례 심의, 행정사무감사)</p>
              </div>
            </div>

            {/* Nickname Input & Start Action */}
            <div className="max-w-md mx-auto space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="학생 닉네임 또는 학번/이름 입력"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:outline-blue-500 font-bold text-center"
                />
              </div>

              <button
                onClick={handleStartGame}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-base shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>스와이프 게임 시작하기</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> 하트 3개 (오답 시 하트 소진)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> 연속 콤보 보너스
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Top 10 Leaderboard Preview */}
          <div className="w-full mt-6 bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-800">실시간 순위 보드 (TOP 10)</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                  {supabaseConfig.url ? 'Supabase 클라우드 연동 중' : '로컬 보드'}
                </span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Supabase 설정</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {leaderboard.slice(0, 10).map((entry, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    idx === 0
                      ? 'bg-amber-50/80 border-amber-300 font-black'
                      : idx === 1
                      ? 'bg-slate-50 border-slate-300 font-bold'
                      : idx === 2
                      ? 'bg-orange-50/50 border-orange-200 font-bold'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                        idx === 0
                          ? 'bg-amber-500 text-white'
                          : idx === 1
                          ? 'bg-slate-400 text-white'
                          : idx === 2
                          ? 'bg-orange-400 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate">{entry.nickname}</span>
                  </div>
                  <span className="font-extrabold text-blue-700 ml-1 shrink-0">{entry.score}점</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. PLAYING SCREEN (Swipe Arena) */}
      {gameState === 'playing' && currentItem && (
        <div className="flex-1 flex flex-col justify-between max-w-4xl w-full mx-auto p-2 sm:p-4 relative">
          {/* Top HUD: Hearts, Question Index, Score, Combo */}
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl shadow-xs border border-slate-200 mb-2">
            {/* Lives */}
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((heartIndex) => (
                <Heart
                  key={heartIndex}
                  className={`w-6 h-6 transition-all duration-200 ${
                    heartIndex <= lives
                      ? 'text-red-500 fill-red-500 scale-100 animate-pulse'
                      : 'text-slate-200 fill-slate-100 scale-90'
                  }`}
                />
              ))}
            </div>

            {/* Question Progress */}
            <div className="text-xs font-black text-slate-500">
              문제 <span className="text-slate-900 text-sm">{currentIndex + 1}</span> / {questions.length}
            </div>

            {/* Combo & Score */}
            <div className="flex items-center gap-3">
              {combo > 1 && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black animate-bounce shadow-xs">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  <span>{combo} COMBO!</span>
                </div>
              )}
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">현재 점수</span>
                <span className="text-base sm:text-lg font-black text-blue-600 tracking-tight">{score}점</span>
              </div>
            </div>
          </div>

          {/* Streak Thrill Status Indicators */}
          {consecutiveWrong === 1 && (
            <div className="flex items-center justify-center gap-2 py-1.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl text-xs font-black animate-pulse shadow-md mb-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>🚨 1회 오답 경고! 다음 문제를 또 틀리면 1번 문제부터 처음으로 리셋됩니다!</span>
            </div>
          )}

          {consecutiveCorrect === 1 && (
            <div className="flex items-center justify-center gap-2 py-1.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-black shadow-md mb-2">
              <Gift className="w-4 h-4 shrink-0 animate-bounce" />
              <span>🎯 1연속 정답 중! 이번 문제를 맞히면 지방 특산물 보너스 상자를 엽니다!</span>
            </div>
          )}

          {/* Swipe Arena Board with 4 Direction Zones */}
          <div className="relative flex-1 min-h-[460px] flex items-center justify-center p-2">
            
            {/* TOP ZONE: 광역 집행 (상) */}
            <div
              onClick={() => handleSwipeAction('UP')}
              className={`absolute top-0 inset-x-8 sm:inset-x-20 py-2.5 px-4 rounded-2xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all z-10 ${
                activeDragDir === 'UP' || flyingDirection === 'UP'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                  : 'bg-blue-50/90 hover:bg-blue-100/90 text-blue-900 border-blue-300 shadow-xs'
              }`}
            >
              <ChevronUp className="w-5 h-5 shrink-0" />
              <div className="text-center">
                <span className="text-xs sm:text-sm font-black block">상(↑) 광역 집행</span>
                <span className="text-[10px] opacity-80 hidden sm:inline">시·도지사, 특별시청, 광역시청, 도청</span>
              </div>
            </div>

            {/* BOTTOM ZONE: 광역 의결 (하) */}
            <div
              onClick={() => handleSwipeAction('DOWN')}
              className={`absolute bottom-0 inset-x-8 sm:inset-x-20 py-2.5 px-4 rounded-2xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all z-10 ${
                activeDragDir === 'DOWN' || flyingDirection === 'DOWN'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105'
                  : 'bg-indigo-50/90 hover:bg-indigo-100/90 text-indigo-900 border-indigo-300 shadow-xs'
              }`}
            >
              <ChevronDown className="w-5 h-5 shrink-0" />
              <div className="text-center">
                <span className="text-xs sm:text-sm font-black block">하(↓) 광역 의결</span>
                <span className="text-[10px] opacity-80 hidden sm:inline">서울특별시의회, 광역시의회, 도의회</span>
              </div>
            </div>

            {/* LEFT ZONE: 기초 집행 (좌) */}
            <div
              onClick={() => handleSwipeAction('LEFT')}
              className={`absolute left-0 top-16 bottom-16 w-20 sm:w-28 p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all z-10 ${
                activeDragDir === 'LEFT' || flyingDirection === 'LEFT'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-lg scale-105'
                  : 'bg-amber-50/90 hover:bg-amber-100/90 text-amber-900 border-amber-300 shadow-xs'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-black writing-vertical text-center leading-tight">
                좌(←)<br />기초<br />집행
              </span>
              <span className="text-[9px] opacity-80 text-center hidden sm:block mt-1">시·군·구청장</span>
            </div>

            {/* RIGHT ZONE: 기초 의결 (우) */}
            <div
              onClick={() => handleSwipeAction('RIGHT')}
              className={`absolute right-0 top-16 bottom-16 w-20 sm:w-28 p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all z-10 ${
                activeDragDir === 'RIGHT' || flyingDirection === 'RIGHT'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg scale-105'
                  : 'bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-900 border-emerald-300 shadow-xs'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-black writing-vertical text-center leading-tight">
                우(→)<br />기초<br />의결
              </span>
              <span className="text-[9px] opacity-80 text-center hidden sm:block mt-1">시·군·구의회</span>
            </div>

            {/* CENTER SWIPE CARD */}
            <div
              ref={cardRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`w-72 sm:w-88 h-64 sm:h-72 bg-white rounded-3xl p-6 shadow-xl border-2 flex flex-col justify-between cursor-grab active:cursor-grabbing touch-none z-20 transition-all ${
                flyingDirection === 'UP'
                  ? '-translate-y-96 opacity-0 scale-75 duration-300 border-blue-500'
                  : flyingDirection === 'DOWN'
                  ? 'translate-y-96 opacity-0 scale-75 duration-300 border-indigo-500'
                  : flyingDirection === 'LEFT'
                  ? '-translate-x-96 opacity-0 scale-75 duration-300 border-amber-500'
                  : flyingDirection === 'RIGHT'
                  ? 'translate-x-96 opacity-0 scale-75 duration-300 border-emerald-500'
                  : isDragging
                  ? 'border-blue-400 shadow-2xl duration-75'
                  : 'border-slate-200/90 duration-200'
              }`}
              style={
                !flyingDirection
                  ? {
                      transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`,
                    }
                  : undefined
              }
            >
              {/* Card Header Badge */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black">
                  Q{currentIndex + 1}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">손가락으로 4방향 밀기</span>
              </div>

              {/* Card Situation / Problem Text */}
              <div className="my-auto py-2 text-center">
                <p className="text-base sm:text-lg font-black text-slate-900 leading-relaxed break-keep">
                  {currentItem.situation}
                </p>
              </div>

              {/* Dynamic Direction Preview Indicator */}
              <div className="text-center pt-2 border-t border-slate-100">
                {activeDragDir ? (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-white shadow-xs ${DIRECTION_CONFIGS[activeDragDir].badgeBg}`}
                  >
                    <span>{DIRECTION_CONFIGS[activeDragDir].badge}</span>
                    <span>{DIRECTION_CONFIGS[activeDragDir].label}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">카드를 상·하·좌·우로 드래그하세요</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Click & Keyboard Assist Guide */}
          <div className="bg-white/80 backdrop-blur-xs py-2 px-4 rounded-xl border border-slate-200/60 text-center text-xs text-slate-500 mt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <span className="font-bold text-slate-700">조작 안내:</span>
            <span>화면 터치 스와이프</span>
            <span>•</span>
            <span>각 방향 박스 터치(클릭)</span>
            <span>•</span>
            <span>키보드 방향키(↑, ↓, ←, →)</span>
          </div>
        </div>
      )}

      {/* 3. RESULT / GAME OVER / DIGITAL WRONG-ANSWER NOTES SCREEN */}
      {(gameState === 'gameover' || gameState === 'cleared') && (
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* Result Banner */}
          <div
            id="printable-wrong-note-header"
            className={`w-full rounded-3xl p-6 sm:p-8 text-white text-center shadow-lg ${
              gameState === 'cleared'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600'
                : 'bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-900'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-black mb-3">
              {gameState === 'cleared' ? '🎉 전체 20문항 완주 성공!' : '💔 하트 소진 - 게임 종료'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black mb-2">
              {gameState === 'cleared'
                ? `${nickname} 학생, 지자체 기관 분류 마스터 달성!`
                : `${nickname} 학생의 오답 분석 & 개념 복습 보고서`}
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm mt-4">
              <div>
                <span className="text-white/70 block text-xs">최종 점수</span>
                <span className="text-2xl font-black">{score}점</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <span className="text-white/70 block text-xs">정답 문항</span>
                <span className="text-2xl font-black">
                  {correctCount} / {SWIPE_QUIZ_ITEMS.length}개
                </span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <span className="text-white/70 block text-xs">최대 콤보</span>
                <span className="text-2xl font-black">{maxCombo}연속</span>
              </div>
            </div>

            {/* Google Sheets Status */}
            {sheetSubmitStatus.message && (
              <div className="mt-4 inline-block px-3 py-1 rounded-lg bg-black/20 text-xs text-white/90 font-medium">
                {sheetSubmitStatus.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={handleStartGame}
                className="px-6 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-sm shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>다시 도전하기</span>
              </button>
            </div>
          </div>

          {/* Digital Wrong-Answer Note Guide Box (삼성노트 / 굿노트 과제 연계) */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 text-amber-950">
            <div className="flex items-center gap-2.5 mb-2">
              <Camera className="w-5 h-5 text-amber-700" />
              <h3 className="text-base font-black text-amber-900">
                디지털 오답 노트 캡처 &amp; 메타인지 학습 과제 안내
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed mb-3">
              태블릿에서 아래의 <strong>[내가 놓친 자치단체 개념(오답 리스트)]</strong> 화면을 캡처한 뒤,{' '}
              <strong>삼성 노트</strong>나 <strong>굿노트(GoodNotes)</strong> 앱으로 불러오세요. 스타일러스 펜을 이용해{' '}
              <em>'내가 왜 이 기관을 헷갈렸는지(예: 조례 심의는 의결 기관인데 집행 기관으로 착각함)'</em> 자신의 말로
              메모하여 과제로 제출하세요!
            </p>
            <div className="text-[11px] font-bold text-amber-800 bg-amber-100/70 p-2.5 rounded-xl border border-amber-200">
              💡 팁: 오답이 0개인 학생은 20문제 완주 축하 화면을 캡처하여 만점 인증 과제로 제출할 수 있습니다.
            </div>
          </div>

          {/* Itemized Wrong-Answer Notes List */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">
                  내가 놓친 자치단체 개념 ({wrongAnswers.length}개)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {wrongAnswers.length === 0 ? '오답 없음 (완벽 이해!)' : '틀린 문항 상세 피드백'}
              </span>
            </div>

            {wrongAnswers.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="text-base font-black text-slate-800 mb-1">틀린 문제가 하나도 없습니다!</h4>
                <p className="text-xs text-slate-500">
                  광역·기초 자치단체의 집행 기관과 의결 기관 개념을 완벽하게 파악했습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {wrongAnswers.map((record, idx) => {
                  const correctCfg = DIRECTION_CONFIGS[record.correctDirection];
                  const chosenCfg = DIRECTION_CONFIGS[record.chosenDirection];

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-red-100 text-red-700 font-bold text-xs">
                          오답 {idx + 1}
                        </span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">
                            내가 고른 답:{' '}
                            <strong className="text-red-600">
                              {chosenCfg.badge} {chosenCfg.label}
                            </strong>
                          </span>
                          <span>➔</span>
                          <span className="text-emerald-700 font-black">
                            정답: {correctCfg.badge} {correctCfg.label}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 mb-2 leading-snug">
                        {record.item.situation}
                      </h4>

                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                        <span className="font-black text-indigo-600 block mb-1">
                          💡 핵심 피드백 및 적용점:
                        </span>
                        <p className="text-slate-700 font-medium leading-relaxed">
                          {record.item.feedback}
                        </p>
                        <div className="mt-2 text-[11px] text-slate-500">
                          <strong>정답 분류:</strong> {record.item.categoryName} ({correctCfg.examples})
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Top 10 Leaderboard in Result */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">명예의 전당 실시간 순위 (TOP 10)</h3>
              </div>
              <span className="text-xs font-bold text-emerald-600">실시간 연동</span>
            </div>

            <div className="divide-y divide-slate-100">
              {leaderboard.slice(0, 10).map((entry, idx) => {
                const isMe = entry.nickname === nickname.trim();
                return (
                  <div
                    key={idx}
                    className={`py-2.5 px-3 rounded-xl flex items-center justify-between text-xs transition ${
                      isMe ? 'bg-blue-50/80 font-black' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                          idx === 0
                            ? 'bg-amber-500 text-white'
                            : idx === 1
                            ? 'bg-slate-400 text-white'
                            : idx === 2
                            ? 'bg-orange-400 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">
                        {entry.nickname} {isMe && '(나)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {entry.correct_count !== undefined && (
                        <span className="text-slate-400 text-[11px]">
                          정답: {entry.correct_count}개
                        </span>
                      )}
                      <span className="font-black text-blue-600 text-sm">{entry.score}점</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
