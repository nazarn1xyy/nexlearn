'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { BarChart3, Users, Target, TrendingUp, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

const Charts = dynamic(() => import('@/components/AnalyticsCharts'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-lg" />,
});

interface StudentData {
  id: number;
  name: string;
  email: string;
  progress: number;
  passed_tests: number;
  enrolled_at: string;
}

interface QuestionStat {
  question: string;
  correct_pct: number;
}

interface TestData {
  id: number;
  title: string;
  total_attempts: number;
  pass_rate: number;
  avg_score: number;
  question_stats: QuestionStat[];
}

interface AnalyticsData {
  course_title: string;
  total_students: number;
  avg_course_progress: number;
  students: StudentData[];
  tests: TestData[];
  score_distribution: { range: string; count: number }[];
  enrollment_timeline: { date: string; count: number }[];
}

export default function CourseAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTest, setSelectedTest] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(`/api/courses/${id}/analytics/`);
        setData(res.data);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('У вас немає доступу до аналітики цього курсу.');
        } else {
          setError('Помилка завантаження даних.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => router.push(`/dashboard/courses/${id}`)}>
          <ArrowLeft size={16} /> Повернутися до курсу
        </Button>
      </div>
    );
  }

  const totalAttempts = data.tests.reduce((s, t) => s + t.total_attempts, 0);
  const avgPassRate = data.tests.length > 0
    ? Math.round(data.tests.reduce((s, t) => s + t.pass_rate, 0) / data.tests.length)
    : 0;

  const activeTestQuestions = selectedTest !== null
    ? data.tests.find(t => t.id === selectedTest)?.question_stats ?? []
    : [];

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumbs items={[
        { label: 'Головна', href: '/dashboard' },
        { label: 'Курси', href: '/dashboard/courses' },
        { label: data.course_title, href: `/dashboard/courses/${id}` },
        { label: 'Аналітика' },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 size={24} /> Аналітика: {data.course_title}
        </h1>
        <Button variant="outline" onClick={() => router.push(`/dashboard/courses/${id}`)}>
          <ArrowLeft size={16} /> Назад
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="flex items-center gap-3">
          <div className="p-3 bg-black text-white rounded-full"><Users size={20} /></div>
          <div>
            <p className="text-xs text-neutral-500">Студентів</p>
            <p className="text-2xl font-bold">{data.total_students}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-3 bg-black text-white rounded-full"><Target size={20} /></div>
          <div>
            <p className="text-xs text-neutral-500">Прогрес</p>
            <p className="text-2xl font-bold">{data.avg_course_progress}%</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-3 bg-black text-white rounded-full"><TrendingUp size={20} /></div>
          <div>
            <p className="text-xs text-neutral-500">Успішність</p>
            <p className="text-2xl font-bold">{avgPassRate}%</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-3 bg-black text-white rounded-full"><BarChart3 size={20} /></div>
          <div>
            <p className="text-xs text-neutral-500">Спроб</p>
            <p className="text-2xl font-bold">{totalAttempts}</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="text-lg font-bold mb-4">Розподіл балів</h2>
          <div className="h-[280px]">
            <Charts type="scoreDistribution" data={data.score_distribution} />
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold mb-4">Порівняння тестів</h2>
          <div className="h-[280px]">
            <Charts type="testComparison" data={data.tests.map(t => ({ name: t.title.slice(0, 20), pass_rate: t.pass_rate, avg_score: t.avg_score }))} />
          </div>
        </Card>
      </div>

      {/* Per-question difficulty */}
      {data.tests.length > 0 && (
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Складність питань</h2>
            <select
              className="text-sm border rounded-lg px-3 py-1.5 bg-white dark:bg-neutral-900 dark:border-neutral-700"
              value={selectedTest ?? ''}
              onChange={e => setSelectedTest(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Оберіть тест</option>
              {data.tests.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          {activeTestQuestions.length > 0 ? (
            <div className="space-y-3">
              {activeTestQuestions.map((q, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 w-6 shrink-0">Q{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm truncate max-w-[70%]">{q.question}</span>
                      <span className={`text-sm font-bold ${q.correct_pct >= 70 ? 'text-green-600' : q.correct_pct >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {q.correct_pct}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${q.correct_pct >= 70 ? 'bg-green-500' : q.correct_pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${q.correct_pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm text-center py-4">Оберіть тест, щоб побачити складність питань</p>
          )}
        </Card>
      )}

      {/* Test stats cards */}
      <h2 className="text-xl font-bold mb-4">Статистика по тестах</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {data.tests.length === 0 ? (
          <p className="text-neutral-500">У цьому курсі ще немає тестів.</p>
        ) : (
          data.tests.map(test => (
            <Card key={test.id} className="flex flex-col">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{test.title}</h3>
              <div className="flex justify-between items-center mt-auto pt-2 border-t text-sm">
                <span className="text-neutral-500">Спроб: {test.total_attempts}</span>
                <span className={`font-bold ${test.pass_rate >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                  {test.pass_rate}% успішно
                </span>
              </div>
              <div className="mt-2 text-sm text-neutral-500">
                Середній бал: {test.avg_score}%
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Student progress table */}
      <h2 className="text-xl font-bold mb-4">Прогрес студентів</h2>
      <Card className="overflow-x-auto">
        {data.students.length === 0 ? (
          <p className="text-neutral-500 text-center py-4">На цей курс ще ніхто не записався.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-4 font-semibold text-neutral-600">Студент</th>
                <th className="py-3 px-4 font-semibold text-neutral-600">Прогрес</th>
                <th className="py-3 px-4 font-semibold text-neutral-600">Тестів складено</th>
                <th className="py-3 px-4 font-semibold text-neutral-600">Дата запису</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((student) => (
                <tr key={student.id} className="border-b last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-neutral-500">{student.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-black dark:bg-white h-2 rounded-full"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{student.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">{student.passed_tests} / {data.tests.length}</td>
                  <td className="py-3 px-4 text-sm text-neutral-500">
                    {new Date(student.enrolled_at).toLocaleDateString('uk-UA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
