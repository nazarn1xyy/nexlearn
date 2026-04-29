'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function CreateCoursePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/courses/', form);
      router.push('/dashboard/courses');
    } catch {
      setError('Помилка створення курсу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Створити курс</h1>
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Назва курсу"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Введіть назву курсу"
            required
          />
          <Textarea
            label="Опис"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Опишіть курс..."
            required
          />
          <Select
            label="Статус"
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
            options={[
              { value: 'draft', label: 'Чернетка' },
              { value: 'published', label: 'Опубліковано' },
            ]}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Створити</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Скасувати
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
