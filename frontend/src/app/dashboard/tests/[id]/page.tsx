'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Award, AlertTriangle,
  Play, FileText, Target, RotateCcw, Trophy,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Test, TestResult } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

type PageState = 'info' | 'testing' | 'result';

export default function TestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(true);
  const [previousResults, setPreviousResults] = useState<TestResult[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [pageState, setPageState] = useState<PageState>('info');
  const autoSubmitted = useRef(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [testRes, resultsRes] = await Promise.all([
          api.get(`/api/tests/${id}/`),
          api.get(`/api/tests/${id}/results/`),
        ]);
        setTest(testRes.data);
        const results = resultsRes.data.results ?? resultsRes.data;
        setPreviousResults(Array.isArray(results) ? results : []);

        if (user?.role === 'student' && testRes.data.course) {
          try {
            const courseRes = await api.get(`/api/courses/${testRes.data.course}/`);
            setIsEnrolled(courseRes.data.is_enrolled ?? false);
          } catch {
            setIsEnrolled(false);
          }
        }
      } catch {
        router.push('/dashboard/tests');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router]);

  const bestResult = previousResults.length > 0
    ? previousResults.reduce((best, r) => (r.score > best.score ? r : best), previousResults[0])
    : null;
  const hasPassed = previousResults.some((r) => r.passed);
  const attemptsUsed = previousResults.length;
  const maxAttempts = 3;

  const startTest = () => {
    if (!test) return;
    setAnswers(new Array(test.questions?.length ?? 0).fill(-1));
    autoSubmitted.current = false;
    setResult(null);
    setError('');
    if (test.time_limit && test.time_limit > 0) {
      setTimeLeft(test.time_limit * 60);
    } else {
      setTimeLeft(null);
    }
    setPageState('testing');
  };

  useEffect(() => {
    if (pageState !== 'testing' || timeLeft === null || timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pageState, timeLeft, result]);

  const handleAnswer = (qIndex: number, optIndex: number) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[qIndex] = optIndex;
      return copy;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post(`/api/tests/${id}/submit/`, { answers });
      setResult(data);
      setPreviousResults((prev) => [data, ...prev]);
      setPageState('result');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || 'Помилка відправки тесту');
    } finally {
      setSubmitting(false);
    }
  }, [id, answers, submitting]);

  useEffect(() => {
    if (timeLeft === 0 && pageState === 'testing' && !result && !autoSubmitted.current) {
      autoSubmitted.current = true;
      handleSubmit();
    }
  }, [timeLeft, pageState, result, handleSubmit]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!test) return null;

  /* ─── Result Screen ─── */
  if (pageState === 'result' && result) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-8">
          {result.passed ? (
            <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
          ) : (
            <XCircle size={48} className="mx-auto text-red-500 mb-4" />
          )}
          <h2 className="text-2xl font-bold mb-2">
            {result.passed ? 'Тест пройдено!' : 'Тест не пройдено'}
          </h2>
          <p className="text-4xl font-bold mb-2">{result.score}%</p>
          <p className="text-neutral-500 mb-4">
            Прохідний бал: {test.passing_score}%
          </p>
          {result.passed && (
            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <Award size={18} className="text-green-600" />
              <span className="text-sm text-green-700 font-medium">Сертифікат видано автоматично!</span>
            </div>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => setPageState('info')}>
              <ArrowLeft size={16} /> До опису тесту
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/tests')}>
              Усі тести
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  /* ─── Info / Start Screen ─── */
  if (pageState === 'info') {
    return (
      <div className="max-w-2xl mx-auto">
        <Breadcrumbs items={[
          { label: 'Головна', href: '/dashboard' },
          { label: 'Тестування', href: '/dashboard/tests' },
          { label: test.title },
        ]} />

        <Card className="mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{test.title}</h1>
              <p className="text-sm text-neutral-500 mt-1">{test.course_title}</p>
            </div>
            {hasPassed && (
              <Badge variant="success">Пройдено ✓</Badge>
            )}
          </div>

          {test.description && (
            <p className="text-neutral-700 mb-6">{test.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="flex flex-col items-center p-3 bg-neutral-50 rounded-lg">
              <FileText size={20} className="text-neutral-400 mb-1" />
              <span className="text-lg font-bold">{test.questions?.length ?? test.questions_count ?? 0}</span>
              <span className="text-xs text-neutral-500">Запитань</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-neutral-50 rounded-lg">
              <Target size={20} className="text-neutral-400 mb-1" />
              <span className="text-lg font-bold">{test.passing_score}%</span>
              <span className="text-xs text-neutral-500">Прохідний бал</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-neutral-50 rounded-lg">
              <Clock size={20} className="text-neutral-400 mb-1" />
              <span className="text-lg font-bold">
                {(test.time_limit ?? 0) > 0 ? `${test.time_limit} хв` : '∞'}
              </span>
              <span className="text-xs text-neutral-500">Час</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-neutral-50 rounded-lg">
              <RotateCcw size={20} className="text-neutral-400 mb-1" />
              <span className="text-lg font-bold">{attemptsUsed}/{maxAttempts}</span>
              <span className="text-xs text-neutral-500">Спроб</span>
            </div>
          </div>

          {!isEnrolled && user?.role === 'student' ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
              <AlertTriangle size={16} />
              Ви не записані на цей курс. Запишіться спочатку, щоб пройти тест.
            </div>
          ) : attemptsUsed >= maxAttempts ? (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700 text-center">
              Ви вичерпали всі спроби для цього тесту.
            </div>
          ) : (
            <Button onClick={startTest} className="w-full">
              <Play size={18} />
              {attemptsUsed > 0 ? 'Спробувати ще раз' : 'Почати тест'}
            </Button>
          )}
        </Card>

        {previousResults.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy size={18} /> Ваші результати
            </h2>
            <div className="flex flex-col gap-2">
              {previousResults.map((r, i) => (
                <div
                  key={r.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    r.passed ? 'border-green-200 bg-green-50' : 'border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {r.passed ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : (
                      <XCircle size={18} className="text-red-400" />
                    )}
                    <div>
                      <span className="text-sm font-medium">
                        Спроба {previousResults.length - i}
                      </span>
                      <p className="text-xs text-neutral-500">
                        {new Date(r.completed_at).toLocaleDateString('uk-UA', {
                          day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${r.passed ? 'text-green-700' : 'text-neutral-800'}`}>
                      {r.score}%
                    </span>
                    {r.id === bestResult?.id && (
                      <p className="text-xs text-neutral-500">Найкращий</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  /* ─── Testing Screen ─── */
  const allAnswered = answers.every((a) => a >= 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{test.title}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {test.course_title} • Прохідний бал: {test.passing_score}%
          </p>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
            timeLeft <= 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-neutral-100 text-black'
          }`}>
            <Clock size={18} />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle size={16} className="text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {test.questions?.map((q, qIndex) => (
          <Card key={q.id}>
            <p className="font-medium mb-3">
              {qIndex + 1}. {q.question_text}
            </p>
            <div className="flex flex-col gap-2">
              {q.options.map((option, optIndex) => (
                <button
                  key={optIndex}
                  onClick={() => handleAnswer(qIndex, optIndex)}
                  className={`
                    text-left px-4 py-3 rounded-lg border text-sm transition-colors
                    ${answers[qIndex] === optIndex
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-200 hover:border-neutral-400'
                    }
                  `}
                >
                  {option}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={!allAnswered}
        >
          Завершити тест
        </Button>
      </div>
    </div>
  );
}
