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
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
        </div>
      ) : tests.length === 0 ? (
        <Card className="text-center py-12">
          <ClipboardCheck size={40} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">Тестів поки немає</p>
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
