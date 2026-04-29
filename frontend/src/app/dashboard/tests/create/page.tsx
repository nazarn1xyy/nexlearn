'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import type { Course } from '@/types';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface QuestionForm {
  question_text: string;
  options: string[];
  correct_answer: number;
}

export default function CreateTestPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    course: '',
    passing_score: 60,
    time_limit: 0,
  });
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { question_text: '', options: ['', '', '', ''], correct_answer: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCourses() {
      try {
        const { data } = await api.get('/api/courses/');
        setCourses(data.results ?? data);
      } catch {
        // API not available
      }
    }
    fetchCourses();
  }, []);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { question_text: '', options: ['', '', '', ''], correct_answer: 0 },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: string | number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === optIndex ? value : o)) }
          : q
      )
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/tests/', {
        ...form,
        course: Number(form.course),
        questions,
      });
      router.push('/dashboard/tests');
    } catch {
      setError('Помилка створення тесту');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Створити тест</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <div className="flex flex-col gap-4">
            <Input
              label="Назва тесту"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
            <Textarea
              label="Опис"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
            <Select
              label="Курс"
              value={form.course}
              onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))}
              options={[
                { value: '', label: 'Оберіть курс' },
                ...courses.map((c) => ({ value: String(c.id), label: c.title })),
              ]}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Прохідний бал (%)"
                type="number"
                min={0}
                max={100}
                value={form.passing_score}
                onChange={(e) => setForm((p) => ({ ...p, passing_score: Number(e.target.value) }))}
              />
              <Input
                label="Обмеження часу (хв, 0 = без ліміту)"
                type="number"
                min={0}
                value={form.time_limit}
                onChange={(e) => setForm((p) => ({ ...p, time_limit: Number(e.target.value) }))}
              />
            </div>
          </div>
        </Card>

        <h2 className="text-lg font-semibold mt-4">Запитання</h2>

        {questions.map((q, qIndex) => (
          <Card key={qIndex}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm font-medium text-neutral-500">
                Запитання {qIndex + 1}
              </span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <Textarea
              label="Текст запитання"
              value={q.question_text}
              onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
              required
            />

            <div className="mt-3 flex flex-col gap-2">
              {q.options.map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={q.correct_answer === optIndex}
                    onChange={() => updateQuestion(qIndex, 'correct_answer', optIndex)}
                    className="accent-black"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                    placeholder={`Варіант ${optIndex + 1}`}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm
                      focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    required
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Button type="button" variant="outline" onClick={addQuestion} className="self-start">
          <Plus size={16} />
          Додати запитання
        </Button>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>Створити тест</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Скасувати
          </Button>
        </div>
      </form>
    </div>
  );
}
