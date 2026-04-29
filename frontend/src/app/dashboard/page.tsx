'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ClipboardCheck, Award, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Card from '@/components/ui/Card';

interface Stats {
  courses: number;
  tests: number;
  certificates: number;
  users: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
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
        setStats({
          courses: count(results[0]),
          tests: count(results[1]),
          certificates: count(results[2]),
          users: results[3] ? count(results[3]) : 0,
        });
      } catch {
        setStats({ courses: 0, tests: 0, certificates: 0, users: 0 });
      }
    }
    fetchStats();
  }, [user?.role]);

  const loading = stats === null;

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="hover:border-black transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-neutral-100">
                    <Icon size={20} className="text-black" />
                  </div>
                  <div>
                    {loading ? (
                      <div className="h-8 w-10 bg-neutral-200 rounded animate-pulse" />
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
    </div>
  );
}
