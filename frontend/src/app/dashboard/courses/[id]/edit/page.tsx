'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Course } from '@/types';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function EditCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', status: 'draft' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get<Course>(`/api/courses/${id}/`);
        setForm({ title: data.title, description: data.description, status: data.status });
      } catch {
        router.push('/dashboard/courses');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id, router]);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.patch(`/api/courses/${id}/`, form);
      router.push(`/dashboard/courses/${id}`);
    } catch {
      setError('Помилка збереження курсу');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumbs items={[
        { label: 'Головна', href: '/dashboard' },
        { label: 'Курси', href: '/dashboard/courses' },
        { label: form.title || 'Курс', href: `/dashboard/courses/${id}` },
        { label: 'Редагування' },
      ]} />

      <h1 className="text-2xl font-bold mb-6">Редагувати курс</h1>
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
            <Button type="submit" loading={saving}>Зберегти</Button>
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
