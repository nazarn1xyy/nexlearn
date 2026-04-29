'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    role: 'student',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    if (form.password.length < 8) {
      setError('Пароль повинен містити мінімум 8 символів');
      return;
    }

    if (form.password !== form.password_confirm) {
      setError('Паролі не співпадають');
      return;
    }

    setLoading(true);
    try {
      await register(form);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Помилка реєстрації. Перевірте дані.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <GraduationCap size={40} className="text-black mb-3" />
          <h1 className="text-2xl font-bold">Реєстрація</h1>
          <p className="text-sm text-neutral-500 mt-1">Створіть акаунт в EduPlatform</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ім'я"
              value={form.first_name}
              onChange={(e) => update('first_name', e.target.value)}
              required
            />
            <Input
              label="Прізвище"
              value={form.last_name}
              onChange={(e) => update('last_name', e.target.value)}
              required
            />
          </div>
          <Input
            label="Логін"
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
          <Input
            label="Телефон"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+380..."
          />
          <Select
            label="Роль"
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
            options={[
              { value: 'student', label: 'Слухач' },
              { value: 'teacher', label: 'Викладач' },
            ]}
          />
          <Input
            label="Пароль"
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
          />
          <Input
            label="Повторіть пароль"
            type="password"
            value={form.password_confirm}
            onChange={(e) => update('password_confirm', e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2">
            Зареєструватися
          </Button>
        </form>

        <p className="mt-6 text-sm text-center text-neutral-500">
          Вже є акаунт?{' '}
          <Link href="/login" className="text-black font-medium hover:underline">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
