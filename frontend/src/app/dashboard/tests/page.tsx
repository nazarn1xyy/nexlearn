'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ClipboardCheck, Download, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import type { Test } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Pagination from '@/components/ui/Pagination';

interface ResultSummary {
  test_id: number;
  best_score: number;
  attempts: number;
  passed: boolean;
}

export default function TestsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [myResults, setMyResults] = useState<Record<number, ResultSummary>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 9;

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const [testsRes, resultsRes] = await Promise.all([
          api.get(`/api/tests/?page=${page}&page_size=${pageSize}`),
          api.get('/api/tests/my-results/'),
        ]);
        setTests(testsRes.data.results ?? testsRes.data);
        setTotalCount(testsRes.data.count ?? 0);
        const results: ResultSummary[] = resultsRes.data;
        const map: Record<number, ResultSummary> = {};
        results.forEach((r) => { map[r.test_id] = r; });
        setMyResults(map);
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [page]);

  const canCreate = user?.role === 'teacher' || user?.role === 'admin';

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'Головна', href: '/dashboard' },
        { label: 'Тестування' },
      ]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Тестування</h1>
        {canCreate && (
          <Link href="/dashboard/tests/create">
            <Button>
              <Plus size={16} />
              Створити тест
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-40 flex flex-col justify-between">
              <div>
                <div className="flex justify-between mb-3">
                  <div className="h-6 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md w-2/3"></div>
                  <div className="h-5 bg-neutral-100 dark:bg-neutral-800/50 animate-pulse rounded-full w-16"></div>
                </div>
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800/50 animate-pulse rounded-md w-1/2 mb-4"></div>
              </div>
              <div className="flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800/50 animate-pulse rounded-md w-1/3"></div>
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800/50 animate-pulse rounded-md w-1/4"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <Card className="text-center py-16 flex flex-col items-center justify-center border-dashed border-2 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center justify-center mb-5">
            <ClipboardCheck size={32} className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Тестів не знайдено</h3>
          <p className="text-neutral-500 max-w-md mx-auto mb-6">
            Поки що тут порожньо. {canCreate ? "Створіть свій перший тест для перевірки знань слухачів." : "Зачекайте, поки викладачі створять нові тести."}
          </p>
          {canCreate && (
            <Link href="/dashboard/tests/create">
              <Button>
                <Plus size={16} />
                Створити тест
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => (
            <Link key={test.id} href={`/dashboard/tests/${test.id}`}>
              <Card className={`hover:border-black transition-colors cursor-pointer h-full ${
                myResults[test.id]?.passed ? 'border-green-300' : ''
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{test.title}</h3>
                  {myResults[test.id]?.passed ? (
                    <Badge variant="success">
                      <CheckCircle size={12} className="inline mr-1" />
                      Пройдено
                    </Badge>
                  ) : myResults[test.id] ? (
                    <Badge variant="warning">Не пройдено</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-neutral-500 mb-3">{test.course_title}</p>
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>{test.questions_count ?? 0} запитань</span>
                  <span>Прохідний бал: {test.passing_score}%</span>
                </div>
                {myResults[test.id] && (
                  <div className="mt-2 text-xs text-neutral-500">
                    Найкращий результат: <span className="font-semibold">{myResults[test.id].best_score}%</span>
                    {' · '}Спроб: {myResults[test.id].attempts}/3
                  </div>
                )}
                {(test.time_limit ?? 0) > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500">
                    <Clock size={12} />
                    <span>{test.time_limit} хв</span>
                  </div>
                )}
                {canCreate && (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const res = await api.get(`/api/tests/${test.id}/export/`, {
                          responseType: 'blob',
                        });
                        const url = window.URL.createObjectURL(new Blob([res.data]));
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `test_${test.id}_results.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      } catch {
                        alert('Помилка експорту');
                      }
                    }}
                    className="flex items-center gap-1 mt-3 text-xs text-neutral-500 hover:text-black transition-colors"
                  >
                    <Download size={12} /> Експорт CSV
                  </button>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
