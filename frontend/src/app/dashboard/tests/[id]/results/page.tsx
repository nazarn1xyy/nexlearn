'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp, Users, Download } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import type { Test, TestResult } from '@/types';

export default function TestResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [test, setTest] = useState<Test | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedResultId, setExpandedResultId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [testRes, resultsRes] = await Promise.all([
          api.get(`/api/tests/${id}/`),
          api.get(`/api/tests/${id}/results/`),
        ]);
        setTest(testRes.data);
        setResults(resultsRes.data);
      } catch (error: any) {
        if (error.response?.status === 403) {
          router.push('/dashboard/tests');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router]);

  const handleExport = async () => {
    try {
      const response = await api.get(`/api/tests/${id}/export/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `test_${id}_results.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Помилка експорту');
    }
  };

  const toggleExpand = (resultId: number) => {
    setExpandedResultId(prev => prev === resultId ? null : resultId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!test) return null;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Breadcrumbs items={[
        { label: 'Головна', href: '/dashboard' },
        { label: 'Тестування', href: '/dashboard/tests' },
        { label: test.title, href: `/dashboard/tests/${id}` },
        { label: 'Результати студентів' },
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Результати: {test.title}</h1>
          <p className="text-sm text-neutral-500 mt-1">Всього спроб: {results.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/tests/${id}`)}>
            <ArrowLeft size={16} /> Назад
          </Button>
          <Button onClick={handleExport}>
            <Download size={16} /> Експорт CSV
          </Button>
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState 
          icon={<Users size={32} />}
          title="Ще немає результатів"
          description="Поки жоден студент не пройшов цей тест."
        />
      ) : (
        <div className="space-y-4">
          {results.map((result) => {
            const isExpanded = expandedResultId === result.id;
            return (
              <Card key={result.id} className="overflow-hidden p-0">
                <div 
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => toggleExpand(result.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0">
                      {(result.student.first_name?.[0] || '') + (result.student.last_name?.[0] || '') || result.student.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{result.student.first_name} {result.student.last_name}</h3>
                      <p className="text-sm text-neutral-500">{result.student.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/2">
                    <div className="text-right flex-1 sm:flex-none">
                      <p className="font-bold text-lg">{result.score}%</p>
                      <p className="text-xs text-neutral-500">{new Date(result.completed_at).toLocaleString('uk-UA')}</p>
                    </div>
                    <div className="shrink-0 w-24 text-center">
                      <Badge variant={result.passed ? 'success' : 'error'}>
                        {result.passed ? 'Пройдено' : 'Не пройдено'}
                      </Badge>
                    </div>
                    <div className="text-neutral-400">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-neutral-100 bg-neutral-50/50 p-4 sm:p-5">
                    <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-neutral-500">Деталі відповідей</h4>
                    <div className="space-y-6">
                      {test.questions?.map((q, idx) => {
                        const studentAnswer = result.answers[idx];
                        let isCorrect = false;
                        let answerDisplay = '';

                        if (q.question_type === 'single') {
                          isCorrect = Number(studentAnswer) === q.correct_answer;
                          answerDisplay = studentAnswer !== undefined && studentAnswer !== -1 
                            ? q.options[studentAnswer as number] || 'Немає відповіді'
                            : 'Немає відповіді';
                        } else if (q.question_type === 'multiple') {
                          const userAns = Array.isArray(studentAnswer) ? [...studentAnswer].sort() : [];
                          const correctAns = [...(q.correct_answers || [])].sort();
                          isCorrect = JSON.stringify(userAns) === JSON.stringify(correctAns);
                          
                          if (userAns.length > 0) {
                            answerDisplay = userAns.map((a: number) => q.options[a]).join(', ');
                          } else {
                            answerDisplay = 'Немає відповіді';
                          }
                        } else if (q.question_type === 'text') {
                          const userAns = String(studentAnswer || '').trim().toLowerCase();
                          const correctAns = (q.correct_answers || []).map(a => String(a).trim().toLowerCase());
                          isCorrect = correctAns.includes(userAns);
                          answerDisplay = String(studentAnswer || 'Немає відповіді');
                        }

                        return (
                          <div key={q.id} className="bg-white p-4 rounded-lg border border-neutral-200">
                            <div className="flex items-start gap-3 mb-2">
                              <span className="font-bold text-neutral-400 mt-0.5">{idx + 1}.</span>
                              <div className="flex-1">
                                <p className="font-medium text-black">{q.question_text}</p>
                              </div>
                              <div className="shrink-0 mt-0.5">
                                {isCorrect ? (
                                  <CheckCircle size={18} className="text-green-500" />
                                ) : (
                                  <XCircle size={18} className="text-red-500" />
                                )}
                              </div>
                            </div>
                            
                            <div className="ml-8 space-y-1 text-sm">
                              <div className="flex gap-2">
                                <span className="text-neutral-500 min-w-24">Відповідь:</span>
                                <span className={isCorrect ? "font-medium text-green-700" : "font-medium text-red-600"}>
                                  {answerDisplay}
                                </span>
                              </div>
                              {!isCorrect && (
                                <div className="flex gap-2">
                                  <span className="text-neutral-500 min-w-24">Правильна:</span>
                                  <span className="font-medium text-black">
                                    {q.question_type === 'single' 
                                      ? q.options[q.correct_answer as number]
                                      : q.question_type === 'multiple'
                                      ? q.correct_answers?.map((a: number) => q.options[a]).join(', ')
                                      : q.correct_answers?.join(' АБО ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
