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

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 9;

  useEffect(() => {
    const timeout = setTimeout(() => {
      async function fetch() {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (search) params.set('search', search);
          params.set('page', String(page));
          params.set('page_size', String(pageSize));
          const { data } = await api.get(`/api/courses/?${params}`);
          setCourses(data.results ?? data);
          setTotalCount(data.count ?? 0);
        } catch {
          // API not available
        } finally {
          setLoading(false);
        }
      }
      fetch();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, page]);

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
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen size={40} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">Курсів поки немає</p>
        </Card>
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
