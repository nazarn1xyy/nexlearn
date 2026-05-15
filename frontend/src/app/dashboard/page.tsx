'use client';

import Link from 'next/link';
import { BookOpen, ClipboardCheck, Award, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Card from '@/components/ui/Card';

import useSWR from 'swr';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';

const RechartsChart = dynamic(() => import('@/components/DashboardChart'), { ssr: false, loading: () => <div className="h-[300px] w-full bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-lg" /> });

interface Stats {
  courses: number;
  tests: number;
  certificates: number;
  users: number;
}

const mockChartData = [
  { name: 'Пн', score: 2 },
  { name: 'Вто', score: 5 },
  { name: 'Ср', score: 3 },
  { name: 'Чт', score: 8 },
  { name: 'Пт', score: 6 },
  { name: 'Сб', score: 9 },
  { name: 'Нд', score: 7 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  
  const fetchStats = async () => {
    const requests: Promise<{ data: { count?: number; results?: unknown[] } }>[] = [
      api.get('/api/courses/?page_size=1'),
      api.get('/api/tests/?page_size=1'),
      api.get('/api/certificates/?page_size=1'),
    ];
    if (user?.role === 'admin') {
      requests.push(api.get('/api/users/?page_size=1'));
    }
    const results = await Promise.all(requests);
    const count = (r: { data: { count?: number; results?: unknown[] } }) =>
      r.data.count ?? r.data.results?.length ?? 0;
    return {
      courses: count(results[0]),
      tests: count(results[1]),
      certificates: count(results[2]),
      users: results[3] ? count(results[3]) : 0,
    };
  };

  const { data: stats, isLoading } = useSWR(
    user ? `dashboard-stats-${user.role}` : null, 
    fetchStats,
    { revalidateOnFocus: false, errorRetryCount: 1 }
  );

  const loading = isLoading && !stats;

  const cards = [
    { label: 'Курси', value: stats?.courses ?? 0, icon: BookOpen, href: '/dashboard/courses' },
    { label: 'Тести', value: stats?.tests ?? 0, icon: ClipboardCheck, href: '/dashboard/tests' },
    { label: 'Сертифікати', value: stats?.certificates ?? 0, icon: Award, href: '/dashboard/certificates' },
    ...(user?.role === 'admin'
      ? [{ label: 'Користувачі', value: stats?.users ?? 0, icon: Users, href: '/dashboard/users' }]
      : []),
  ];

  const roleLabels: Record<string, string> = {
    admin: 'Адміністратор',
    teacher: 'Викладач',
    student: 'Слухач',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Вітаємо, {user?.first_name || user?.username}!
        </h1>
        <p className="text-neutral-500 mt-1">
          Роль: {roleLabels[user?.role || ''] || user?.role}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="hover:border-black transition-colors cursor-pointer h-full">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                    <Icon size={20} className="text-black dark:text-white" />
                  </div>
                  <div>
                    {loading ? (
                      <div className="h-8 w-10 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
                    ) : (
                      <p className="text-2xl font-bold">{card.value}</p>
                    )}
                    <p className="text-sm text-neutral-500">{card.label}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-bold mb-6">Активність за останні 7 днів</h2>
          <div className="h-[300px] w-full">
            <RechartsChart data={mockChartData} />
          </div>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800 flex flex-col justify-center items-center text-center p-8 mesh-bg">
          <div className="w-16 h-16 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
            <Award size={32} className="text-black dark:text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-black dark:text-white">Продовжуйте в тому ж дусі!</h3>
          <p className="text-neutral-800 dark:text-neutral-300 text-sm mb-6 max-w-[200px] mx-auto font-medium">
            Ви успішно проходите матеріали. Залишилося ще трохи до нового сертифікату.
          </p>
          <Link href="/dashboard/courses">
            <Button className="w-full bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200">
              Перейти до курсів
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
