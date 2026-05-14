'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, UserPlus, FileText, Award, TrendingUp, Send, Pencil, Trash2, ClipboardCheck, Clock, CheckCircle, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import type { Course, CourseComment, Test } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import StarRating from '@/components/ui/StarRating';

interface Progress {
  total_tests: number;
  passed_tests: number;
  progress: number;
  has_certificate: boolean;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const [comments, setComments] = useState<CourseComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [myRating, setMyRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState(0);

  const [tests, setTests] = useState<Test[]>([]);
  const [myResults, setMyResults] = useState<Record<number, any>>({});

  const fetchComments = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/courses/${id}/comments/`);
      setComments(data.results ?? data);
    } catch { /* skip */ }
  }, [id]);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get(`/api/courses/${id}/`);
        setCourse(data);

        const [testsRes, resultsRes] = await Promise.all([
          api.get(`/api/tests/?course=${id}&page_size=100`),
          api.get('/api/tests/my-results/'),
        ]);
        setTests(testsRes.data.results ?? testsRes.data);
        const map: Record<number, any> = {};
        resultsRes.data.forEach((r: any) => { map[r.test_id] = r; });
        setMyResults(map);

        if (data.is_enrolled) {
          const { data: prog } = await api.get(`/api/courses/${id}/progress/`);
          setProgress(prog);
        }
        const { data: ratingData } = await api.get(`/api/courses/${id}/rate/`);
        if (ratingData.score) setMyRating(ratingData.score);
      } catch {
        router.push('/dashboard/courses');
      } finally {
        setLoading(false);
      }
    }
    fetch();
    fetchComments();
  }, [id, router, fetchComments]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/api/courses/${id}/enroll/`);
      setCourse((prev) => prev ? { ...prev, is_enrolled: true } : prev);
    } catch { /* already enrolled */ } finally {
      setEnrolling(false);
    }
  };

  const handleRate = async (score: number) => {
    setMyRating(score);
    try {
      const { data } = await api.post(`/api/courses/${id}/rate/`, { score });
      setAvgRating(data.avg_rating);
      setRatingsCount(data.ratings_count);
    } catch { /* skip */ }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      await api.post(`/api/courses/${id}/comments/`, { text: commentText });
      setCommentText('');
      fetchComments();
    } catch { /* skip */ } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course) return null;

  const teacher = typeof course.teacher === 'object' ? course.teacher : null;
  const displayAvg = avgRating || course.avg_rating || 0;
  const displayCount = ratingsCount || course.ratings_count || 0;

  const canManage =
    user?.role === 'admin' ||
    (user?.role === 'teacher' &&
      (teacher ? teacher.id === user?.id : false));

  const handleDelete = async () => {
    if (!confirm('Ви впевнені, що хочете видалити цей курс? Цю дію неможливо скасувати.')) return;
    setDeleting(true);
    try {
      await api.delete(`/api/courses/${id}/`);
      router.push('/dashboard/courses');
    } catch {
      alert('Помилка видалення курсу');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumbs items={[
        { label: 'Головна', href: '/dashboard' },
        { label: 'Курси', href: '/dashboard/courses' },
        { label: course.title },
      ]} />

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold break-words">{course.title}</h1>
            {teacher && (
              <p className="text-sm text-neutral-500 mt-1">
                Викладач: {teacher.first_name} {teacher.last_name}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={course.status === 'published' ? 'success' : 'default'}>
              {course.status === 'published' ? 'Опубліковано' : 'Чернетка'}
            </Badge>
            {canManage && (
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/dashboard/courses/${id}/analytics`}>
                  <Button variant="outline" size="sm">
                    <BarChart3 size={14} />
                    Аналітика
                  </Button>
                </Link>
                <Link href={`/dashboard/courses/${id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil size={14} />
                    Редагувати
                  </Button>
                </Link>
                <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
                  <Trash2 size={14} />
                  Видалити
                </Button>
              </div>
            )}
          </div>
        </div>

        <p className="text-neutral-700 mb-6">{course.description}</p>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-neutral-500">
            {course.students_count ?? 0} слухачів
          </span>
          <span className="text-sm text-neutral-400">•</span>
          <span className="text-sm text-neutral-500">
            {course.materials?.length ?? 0} матеріалів
          </span>
          {displayAvg > 0 && (
            <>
              <span className="text-sm text-neutral-400">•</span>
              <span className="text-sm text-neutral-500">
                ★ {Number(displayAvg).toFixed(1)} ({displayCount})
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-neutral-500">Ваша оцінка:</span>
          <StarRating value={myRating} onChange={handleRate} size={22} />
        </div>

        {user?.role === 'student' && !course.is_enrolled && (
          <Button onClick={handleEnroll} loading={enrolling}>
            <UserPlus size={16} />
            Записатися на курс
          </Button>
        )}
        {course.is_enrolled && (
          <Badge variant="success">Ви записані на цей курс</Badge>
        )}
      </Card>

      {progress && (
        <Card className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} />
            <h2 className="text-lg font-semibold">Ваш прогрес</h2>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-3 mb-3">
            <div
              className="bg-black h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">
              Пройдено тестів: {progress.passed_tests}/{progress.total_tests}
            </span>
            <span className="font-bold">{progress.progress}%</span>
          </div>
          {progress.has_certificate && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Award size={18} className="text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                Сертифікат отримано!
              </span>
            </div>
          )}
        </Card>
      )}

      {course.materials && course.materials.length > 0 && (
        <Card className="mt-4">
          <h2 className="text-lg font-semibold mb-4">Навчальні матеріали</h2>
          <div className="flex flex-col gap-2">
            {course.materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-neutral-400" />
                  <span className="text-sm font-medium">{material.title}</span>
                </div>
                <a
                  href={material.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
                >
                  <Download size={16} />
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tests.length > 0 && (
        <Card className="mt-4">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck size={20} />
            <h2 className="text-lg font-semibold">Тести курсу</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tests.map((test) => {
              const result = myResults[test.id];
              return (
                <Link key={test.id} href={`/dashboard/tests/${test.id}`}>
                  <div className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${
                    result?.passed ? 'border-green-300 bg-green-50/50 dark:bg-green-900/10' : 'border-neutral-200 hover:border-black dark:border-neutral-800 dark:hover:border-neutral-500'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{test.title}</h3>
                      {result?.passed ? (
                        <Badge variant="success"><CheckCircle size={12} className="inline mr-1" />Пройдено</Badge>
                      ) : result ? (
                        <Badge variant="warning">Не пройдено</Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>{test.questions_count ?? 0} питань</span>
                      {(test.time_limit ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {test.time_limit} хв
                        </span>
                      )}
                      {result && (
                        <span>Спроб: {result.attempts}/3</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="text-lg font-semibold mb-4">Коментарі</h2>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            placeholder="Написати коментар..."
            className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          />
          <Button onClick={handleComment} loading={sendingComment} size="sm">
            <Send size={16} />
          </Button>
        </div>

        {comments.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-4">
            Коментарів ще немає. Будьте першим!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {c.author.first_name} {c.author.last_name}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {new Date(c.created_at).toLocaleDateString('uk-UA')}
                  </span>
                </div>
                <p className="text-sm text-neutral-700">{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
