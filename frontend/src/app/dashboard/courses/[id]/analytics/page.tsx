'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BarChart3, Users, Target, Clock, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface StudentData {
  id: number;
  name: string;
  email: string;
  progress: number;
  passed_tests: number;
  enrolled_at: string;
}

interface TestData {
  id: number;
  title: string;
  total_attempts: number;
  pass_rate: number;
  avg_score: number;
}

interface AnalyticsData {
  course_title: string;
  total_students: number;
  avg_course_progress: number;
  students: StudentData[];
  tests: TestData[];
}

export default function CourseAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="flex items-center gap-4 bg-gradient-to-br from-neutral-50 to-neutral-100">
          <div className="p-4 bg-black text-white rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">Всього студентів</p>
            <p className="text-3xl font-bold">{data.total_students}</p>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4 bg-gradient-to-br from-neutral-50 to-neutral-100">
          <div className="p-4 bg-black text-white rounded-full">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">Середній прогрес групи</p>
            <p className="text-3xl font-bold">{data.avg_course_progress}%</p>
          </div>
        </Card>
      </div>

      <h2 className="text-xl font-bold mb-4 mt-8">Статистика по тестах</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {data.tests.length === 0 ? (
          <p className="text-neutral-500">У цьому курсі ще немає тестів.</p>
        ) : (
          data.tests.map(test => (
            <Card key={test.id} className="flex flex-col">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">{test.title}</h3>
              <div className="flex justify-between items-center mt-auto pt-2 border-t text-sm">
                <span className="text-neutral-500">Спроб: {test.total_attempts}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${test.pass_rate >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                    {test.pass_rate}% успішно
                  </span>
                </div>
              </div>
              <div className="mt-2 text-sm text-neutral-500">
                Середній бал: {test.avg_score}%
              </div>
            </Card>
          ))
        )}
      </div>

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
                <tr key={student.id} className="border-b last:border-0 hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-neutral-500">{student.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-neutral-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-black h-2 rounded-full"
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
