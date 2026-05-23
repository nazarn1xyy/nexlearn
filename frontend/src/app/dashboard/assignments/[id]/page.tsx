'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

interface Assignment {
  id: number;
  course: number;
  title: string;
  description: string;
  created_by_name: string;
  due_date: string | null;
  max_score: number;
  submissions_count: number;
  created_at: string;
}

interface Submission {
  id: number;
  student: { id: number; first_name: string; last_name: string; email: string };
  text: string;
  file: string | null;
  status: 'pending' | 'graded';
  grade: number | null;
  feedback: string;
  submitted_at: string;
  graded_at: string | null;
}

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [grading, setGrading] = useState<number | null>(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    async function fetchData() {
      try {
        const [aRes, sRes] = await Promise.all([
          api.get(`/api/assignments/${id}/`),
          api.get(`/api/assignments/${id}/submissions/`),
        ]);
        setAssignment(aRes.data);
        setSubmissions(sRes.data.results ?? sRes.data);
      } catch {
        router.push('/dashboard/courses');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router]);

  const handleSubmit = async () => {
    if (!text.trim() && !file) {
      toast.error('Введіть текст або додайте файл');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (text.trim()) formData.append('text', text);
      if (file) formData.append('file', file);
      const { data } = await api.post(`/api/assignments/${id}/submit/`, formData);
      setSubmissions(prev => [data, ...prev]);
      setText('');
      setFile(null);
      toast.success('Відповідь надіслано!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Помилка відправки');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async (subId: number) => {
    const grade = Number(gradeValue);
    if (isNaN(grade) || grade < 0) {
      toast.error('Вкажіть коректну оцінку');
      return;
    }
    try {
      const { data } = await api.post(`/api/assignments/submissions/${subId}/grade/`, {
        grade,
        feedback: feedbackValue,
      });
      setSubmissions(prev => prev.map(s => s.id === subId ? data : s));
      setGrading(null);
      setGradeValue('');
      setFeedbackValue('');
      toast.success('Оцінку збережено');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Помилка');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!assignment) return null;

  const mySubmission = submissions.find(s => s.student.id === user?.id);
  const hasSubmitted = !!mySubmission;

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumbs items={[
        { label: 'Головна', href: '/dashboard' },
        { label: 'Курси', href: '/dashboard/courses' },
        { label: assignment.title },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{assignment.title}</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Назад
        </Button>
      </div>

      <Card className="mb-6">
        <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line mb-4">{assignment.description}</p>
        <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
          <span>Макс. бал: <strong>{assignment.max_score}</strong></span>
          <span>Автор: {assignment.created_by_name}</span>
          {assignment.due_date && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> до {new Date(assignment.due_date).toLocaleDateString('uk-UA')}
            </span>
          )}
        </div>
      </Card>

      {/* Student submit form */}
      {!isTeacher && !hasSubmitted && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Ваша відповідь</h2>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Введіть вашу відповідь..."
            rows={5}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm
              bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-black mb-3 resize-y"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-neutral-500 cursor-pointer hover:text-neutral-700 transition-colors">
              <Upload size={16} />
              <span>{file ? file.name : 'Додати файл'}</span>
              <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <Button onClick={handleSubmit} loading={submitting}>
              Відправити
            </Button>
          </div>
        </Card>
      )}

      {/* Student: show own submission */}
      {!isTeacher && hasSubmitted && mySubmission && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Ваша відповідь</h2>
          <p className="text-sm whitespace-pre-line mb-2">{mySubmission.text}</p>
          {mySubmission.file && (
            <a href={mySubmission.file} target="_blank" rel="noopener noreferrer"
              className="text-sm text-blue-600 underline">Прикріплений файл</a>
          )}
          <div className="mt-3 flex items-center gap-3">
            {mySubmission.status === 'graded' ? (
              <>
                <Badge variant="success"><CheckCircle size={12} className="inline mr-1" />Оцінено: {mySubmission.grade}/{assignment.max_score}</Badge>
                {mySubmission.feedback && (
                  <span className="text-sm text-neutral-500 flex items-center gap-1">
                    <MessageSquare size={12} /> {mySubmission.feedback}
                  </span>
                )}
              </>
            ) : (
              <Badge variant="warning">Очікує перевірки</Badge>
            )}
          </div>
        </Card>
      )}

      {/* Teacher: all submissions */}
      {isTeacher && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Відповіді студентів ({submissions.length})</h2>
          {submissions.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">Ще ніхто не здав завдання.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {submissions.map(sub => (
                <div key={sub.id} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm">{sub.student.first_name} {sub.student.last_name}</span>
                      <span className="text-xs text-neutral-400 ml-2">{sub.student.email}</span>
                    </div>
                    {sub.status === 'graded' ? (
                      <Badge variant="success">{sub.grade}/{assignment.max_score}</Badge>
                    ) : (
                      <Badge variant="warning">Не перевірено</Badge>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-line mb-2">{sub.text}</p>
                  {sub.file && (
                    <a href={sub.file} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline mb-2 inline-block">Файл</a>
                  )}
                  <div className="text-xs text-neutral-400 mb-2">
                    Здано: {new Date(sub.submitted_at).toLocaleString('uk-UA')}
                  </div>

                  {sub.status === 'graded' && sub.feedback && (
                    <div className="text-sm bg-neutral-50 dark:bg-neutral-800 rounded p-2 mt-1">
                      <strong>Ваш коментар:</strong> {sub.feedback}
                    </div>
                  )}

                  {grading === sub.id ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          max={assignment.max_score}
                          value={gradeValue}
                          onChange={e => setGradeValue(e.target.value)}
                          placeholder={`Оцінка (0-${assignment.max_score})`}
                          className="px-3 py-1.5 border rounded-lg text-sm w-32
                            dark:bg-neutral-900 dark:border-neutral-700"
                        />
                        <input
                          type="text"
                          value={feedbackValue}
                          onChange={e => setFeedbackValue(e.target.value)}
                          placeholder="Коментар (опційно)"
                          className="flex-1 px-3 py-1.5 border rounded-lg text-sm
                            dark:bg-neutral-900 dark:border-neutral-700"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleGrade(sub.id)}>Зберегти</Button>
                        <Button size="sm" variant="ghost" onClick={() => setGrading(null)}>Скасувати</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="mt-2"
                      onClick={() => { setGrading(sub.id); setGradeValue(sub.grade?.toString() ?? ''); setFeedbackValue(sub.feedback ?? ''); }}>
                      {sub.status === 'graded' ? 'Переоцінити' : 'Оцінити'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
