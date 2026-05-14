'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Search, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import type { Course } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

import useSWR from 'swr';

export default function CoursesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const fetcher = async (url: string) => {
    const { data } = await api.get(url);
    return data;
  };

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  queryParams.set('page', String(page));
  queryParams.set('page_size', String(pageSize));

  const { data, isLoading } = useSWR(`/api/courses/?${queryParams.toString()}`, fetcher, {
    keepPreviousData: true,
  });

  const courses: Course[] = data?.results ?? data ?? [];
  const totalCount = data?.count ?? 0;
  const loading = isLoading && !data;

  useEffect(() => { setPage(1); }, [search]);

  const canCreate = user?.role === 'teacher' || user?.role === 'admin';

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'Головна', href: '/dashboard' },
        { label: 'Курси' },
      ]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Курси</h1>
        {canCreate && (
          <Link href="/dashboard/courses/create">
            <Button>
              <Plus size={16} />
              Створити курс
            </Button>
          </Link>
        )}
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Пошук курсів..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-48 flex flex-col justify-between">
              <div>
                <div className="h-6 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md w-3/4 mb-4"></div>
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800/50 animate-pulse rounded-md w-full mb-2"></div>
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800/50 animate-pulse rounded-md w-5/6"></div>
              </div>
              <div className="flex justify-between mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800/50 animate-pulse rounded-md w-1/4"></div>
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800/50 animate-pulse rounded-md w-1/4"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} />}
          title="Курсів не знайдено"
          description={canCreate ? "Створіть новий курс просто зараз, щоб студенти могли навчатися." : "Зачекайте, поки викладачі опублікують нові матеріали."}
          action={
            canCreate ? (
              <Link href="/dashboard/courses/create">
                <Button>
                  <Plus size={16} />
                  Створити курс
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
              <Card className="hover:border-black transition-colors cursor-pointer h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg leading-tight">{course.title}</h3>
                    <Badge variant={course.status === 'published' ? 'success' : 'default'}>
                      {course.status === 'published' ? 'Опубліковано' : 'Чернетка'}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-500 line-clamp-2 flex-1">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                    <span className="text-xs text-neutral-400">
                      {course.teacher_name || 'Викладач'}
                    </span>
                    <div className="flex items-center gap-2">
                      {course.avg_rating ? (
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          {Number(course.avg_rating).toFixed(1)}
                          <span className="text-neutral-300">({course.ratings_count})</span>
                        </span>
                      ) : null}
                      <span className="text-xs text-neutral-400">
                        {course.students_count ?? 0} слухачів
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
